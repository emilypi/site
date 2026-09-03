// Section 4: axe-core scan + structural/semantic assertions, both schemes.
// Usage: node a11y.mjs [origin]
// Playwright and axe-core are dev-only and deliberately absent from package.json.
// Install them anywhere and point QA_TOOLS at that directory:
//   mkdir -p /tmp/qa-tools && cd /tmp/qa-tools && npm init -y
//   npm install playwright axe-core lighthouse && npx playwright install chromium
//   QA_TOOLS=/tmp/qa-tools node <this script>
const TOOLS = process.env.QA_TOOLS ?? '/tmp/qa-tools';
const { chromium } = await import(`${TOOLS}/node_modules/playwright/index.mjs`);
import { readFileSync } from 'node:fs';

const AXE = `${TOOLS}/node_modules/axe-core/axe.min.js`;
const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:4321';
const PAGES = ['/', '/posts/', '/posts/kitchen-sink/', '/notes/', '/notes/what-notes-are-for/',
  '/tags/', '/tags/meta/', '/projects/', '/talks/', '/about/', '/404.html'];
const axeSource = readFileSync(AXE, 'utf8');

const browser = await chromium.launch();
const out = { axe: [], semantics: [] };

for (const scheme of ['dark', 'light']) {
  const ctx = await browser.newContext({ colorScheme: scheme });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(ORIGIN + path, { waitUntil: 'load' });
    await page.addScriptTag({ content: axeSource });
    const r = await page.evaluate(async () =>
      await window.axe.run(document, { resultTypes: ['violations'] }));
    for (const v of r.violations) {
      out.axe.push({
        scheme, path, id: v.id, impact: v.impact, help: v.help,
        nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(' '), summary: (n.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 260) })),
        nodeCount: v.nodes.length,
      });
    }

    const sem = await page.evaluate(() => {
      const sel = (s) => [...document.querySelectorAll(s)];
      const toggle = document.getElementById('theme-toggle');
      return {
        h1Count: sel('h1').length,
        h1Text: sel('h1').map((h) => h.textContent.trim().slice(0, 60)),
        headingOrder: sel('h1,h2,h3,h4,h5,h6').map((h) => h.tagName),
        header: sel('body > header').length,
        navWithLabel: sel('nav').map((n) => n.getAttribute('aria-label')),
        navWithoutLabel: sel('nav:not([aria-label]):not([aria-labelledby])').length,
        mainId: sel('main').map((m) => m.id),
        mainCount: sel('main').length,
        footer: sel('body > footer').length,
        imgsMissingAlt: sel('img').filter((i) => i.getAttribute('alt') === null).map((i) => i.getAttribute('src')),
        imgCount: sel('img').length,
        imgsMissingDims: sel('img').filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).map((i) => i.getAttribute('src')),
        svgsNotHidden: sel('svg').filter((s) => s.getAttribute('aria-hidden') !== 'true' && !s.querySelector('title')).length,
        svgCount: sel('svg').length,
        toggleName: toggle?.getAttribute('aria-label') ?? null,
        togglePressed: toggle?.getAttribute('aria-pressed') ?? null,
        skipLink: (() => { const a = document.querySelector('a.skip-link'); return a ? { href: a.getAttribute('href'), text: a.textContent.trim() } : null; })(),
        lang: document.documentElement.lang,
        titleCount: document.querySelectorAll('title').length,
        emptyLinks: sel('a').filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label') && !a.querySelector('[alt]')).length,
        listInvalid: sel('ul,ol').filter((l) => [...l.children].some((c) => c.tagName !== 'LI' && c.tagName !== 'SCRIPT' && c.tagName !== 'TEMPLATE')).length,
      };
    });
    out.semantics.push({ scheme, path, ...sem });
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
