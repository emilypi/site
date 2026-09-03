// Section 2 + 10: crawl same-origin links two levels deep from /.
// Asserts: no non-2xx responses, no console errors, no page errors, no
// third-party hosts, no target=_blank lacking rel=noopener.
// Usage: node crawl.mjs [origin]
// Playwright and axe-core are dev-only and deliberately absent from package.json.
// Install them anywhere and point QA_TOOLS at that directory:
//   mkdir -p /tmp/qa-tools && cd /tmp/qa-tools && npm init -y
//   npm install playwright axe-core lighthouse && npx playwright install chromium
//   QA_TOOLS=/tmp/qa-tools node <this script>
const TOOLS = process.env.QA_TOOLS ?? '/tmp/qa-tools';
const { chromium } = await import(`${TOOLS}/node_modules/playwright/index.mjs`);

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:4321';
const DEPTH = 2;

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
const bad = [];
const hosts = new Set();
let current = '/';

page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning')
    consoleErrors.push({ page: current, type: m.type(), text: m.text() });
});
page.on('pageerror', (e) => pageErrors.push({ page: current, text: String(e) }));
page.on('response', (r) => {
  hosts.add(new URL(r.url()).host);
  if (r.status() >= 400) bad.push({ page: current, url: r.url(), status: r.status() });
});

const seen = new Set(['/']);
let frontier = ['/'];
const visited = [];
const blankNoOpener = [];

for (let depth = 0; depth <= DEPTH && frontier.length; depth += 1) {
  const next = [];
  for (const path of frontier) {
    current = path;
    const res = await page.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    visited.push({ path, status: res?.status() ?? 0, depth });
    if ((res?.status() ?? 0) >= 400) bad.push({ page: path, url: ORIGIN + path, status: res.status() });

    const found = await page.$$eval('a[href]', (as) =>
      as.map((a) => ({ href: a.href, target: a.getAttribute('target'), rel: a.getAttribute('rel') })),
    );
    for (const a of found) {
      if (a.target === '_blank' && !(a.rel ?? '').includes('noopener'))
        blankNoOpener.push({ page: path, href: a.href, rel: a.rel });
      const u = new URL(a.href);
      if (u.origin !== ORIGIN) continue;
      const p = u.pathname + u.search;
      if (seen.has(p)) continue;
      seen.add(p);
      next.push(p);
    }
  }
  frontier = next;
}

await browser.close();

const report = {
  origin: ORIGIN,
  pagesVisited: visited.length,
  visited,
  badResponses: bad,
  consoleErrors,
  pageErrors,
  hostsContacted: [...hosts].sort(),
  targetBlankWithoutNoopener: blankNoOpener,
};
console.log(JSON.stringify(report, null, 2));
const fail = bad.length + consoleErrors.length + pageErrors.length + blankNoOpener.length +
  [...hosts].filter((h) => h !== '127.0.0.1:4321').length;
console.error(`\ncrawl: ${visited.length} pages, ${bad.length} bad, ${consoleErrors.length} console, ${pageErrors.length} pageerror, hosts=${[...hosts].join(',')}`);
process.exit(fail ? 1 : 0);
