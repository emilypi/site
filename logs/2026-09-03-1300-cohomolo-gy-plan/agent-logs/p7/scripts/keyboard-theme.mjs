// Sections 4 (tab order, focus ring) and 5 (theme behaviour).
// Usage: node keyboard-theme.mjs [origin]
// Playwright and axe-core are dev-only and deliberately absent from package.json.
// Install them anywhere and point QA_TOOLS at that directory:
//   mkdir -p /tmp/qa-tools && cd /tmp/qa-tools && npm init -y
//   npm install playwright axe-core lighthouse && npx playwright install chromium
//   QA_TOOLS=/tmp/qa-tools node <this script>
const TOOLS = process.env.QA_TOOLS ?? '/tmp/qa-tools';
const { chromium } = await import(`${TOOLS}/node_modules/playwright/index.mjs`);

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:4321';
const SHOTS = new URL('../screenshots/', import.meta.url).pathname;
const out = {};
const browser = await chromium.launch();

/* ---------------------------------------------------- tab order + focus --- */
{
  const ctx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(ORIGIN + '/posts/kitchen-sink/', { waitUntil: 'load' });
  await page.evaluate(() => document.body.focus());
  const order = [];
  for (let i = 0; i < 22; i += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        cls: el.className?.baseVal ?? el.className ?? '',
        text: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 42),
        href: el.getAttribute('href'),
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
      };
    });
    if (!info) break;
    order.push(info);
    if (i === 0) await page.screenshot({ path: SHOTS + 'focus-skip-link-dark-1280.png' });
    if (info.cls === 'theme-toggle' || info.tag === 'button')
      await page.screenshot({ path: SHOTS + 'focus-theme-toggle-dark-1280.png' });
  }
  out.tabOrder = order;
  out.focusRingMissing = order.filter((o) => o.outlineStyle === 'none' || o.outlineWidth === '0px');
  await ctx.close();
}

/* --------------------------------------------------------------- theme --- */
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: scheme });
  const page = await ctx.newPage();
  const r = { scheme };

  await page.goto(ORIGIN + '/posts/kitchen-sink/', { waitUntil: 'load' });
  r.firstLoad = await page.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme ?? null,
    bg: getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    storedTheme: (() => { try { return localStorage.getItem('theme'); } catch { return 'blocked'; } })(),
    ariaPressed: document.getElementById('theme-toggle')?.getAttribute('aria-pressed'),
    codeColour: getComputedStyle(document.querySelector('.astro-code span')).color,
  }));

  await page.click('#theme-toggle');
  r.afterToggle = await page.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme ?? null,
    bg: getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(),
    storedTheme: localStorage.getItem('theme'),
    ariaPressed: document.getElementById('theme-toggle')?.getAttribute('aria-pressed'),
    codeColour: getComputedStyle(document.querySelector('.astro-code span')).color,
  }));

  // Reload: the attribute must already be set when the DOM is first parsed,
  // which is what the blocking inline script in <head> buys us.
  const early = [];
  page.on('domcontentloaded', async () => {
    try { early.push(await page.evaluate(() => document.documentElement.dataset.theme ?? null)); } catch {}
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  r.attributeAtDomContentLoaded = await page.evaluate(() => document.documentElement.dataset.theme ?? null);
  // Stronger: is the attribute set before <body> even exists? Check that the
  // inline script is the first element in <head>.
  r.themeScriptIsFirstInHead = await page.evaluate(() => {
    const first = document.head.firstElementChild;
    return first?.tagName === 'SCRIPT' && first.textContent.includes('localStorage.getItem');
  });
  r.afterReload = await page.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme ?? null,
    bg: getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(),
    ariaPressed: document.getElementById('theme-toggle')?.getAttribute('aria-pressed'),
  }));
  out[`theme_${scheme}`] = r;
  await ctx.close();
}

/* --------------------------------------------------- fonts (section 6) --- */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const fonts = [];
  page.on('response', (res) => {
    if (/\.(woff2?|ttf|otf)$/.test(new URL(res.url()).pathname))
      fonts.push({ url: res.url(), status: res.status() });
  });
  await page.goto(ORIGIN + '/posts/kitchen-sink/', { waitUntil: 'networkidle' });
  out.fonts = {
    requested: fonts,
    thirdParty: fonts.filter((f) => !f.url.startsWith(ORIGIN)),
    families: await page.evaluate(() => [...document.fonts].map((f) => `${f.family}|${f.display ?? '?'}|${f.status}`).sort()),
    computed: await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      h1: getComputedStyle(document.querySelector('h1')).fontFamily,
      code: getComputedStyle(document.querySelector('.astro-code')).fontFamily,
    })),
  };
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 2));
