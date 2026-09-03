// Section 13: full-page screenshots, both widths and both colour schemes.
// Usage: node shots.mjs [origin]
// Playwright and axe-core are dev-only and deliberately absent from package.json.
// Install them anywhere and point QA_TOOLS at that directory:
//   mkdir -p /tmp/qa-tools && cd /tmp/qa-tools && npm init -y
//   npm install playwright axe-core lighthouse && npx playwright install chromium
//   QA_TOOLS=/tmp/qa-tools node <this script>
const TOOLS = process.env.QA_TOOLS ?? '/tmp/qa-tools';
const { chromium } = await import(`${TOOLS}/node_modules/playwright/index.mjs`);
import { mkdirSync } from 'node:fs';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:4321';
const DIR = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

const ROUTES = [
  ['home', '/'],
  ['posts-kitchen-sink', '/posts/kitchen-sink/'],
  ['about', '/about/'],
  ['projects', '/projects/'],
  ['talks', '/talks/'],
  ['tags', '/tags/'],
  ['404', '/404.html'],
];
const SIZES = [[1280, 900], [390, 844]];

const browser = await chromium.launch();
const written = [];
for (const scheme of ['dark', 'light']) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    for (const [name, path] of ROUTES) {
      await page.goto(ORIGIN + path, { waitUntil: 'networkidle' });
      // freeze the twinkling stars so successive runs diff cleanly
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
      // fullPage capture can outrun `loading="lazy"`, leaving a real image blank
      await page.evaluate(async () => {
        for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
        await Promise.all([...document.images].filter((i) => !i.complete)
          .map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
        await document.fonts.ready;
      });
      const file = `${DIR}${name}-${scheme}-${w}.png`;
      await page.screenshot({ path: file, fullPage: true });
      written.push(`${name}-${scheme}-${w}.png`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(written.join('\n'));
console.log('\ntotal:', written.length);
