// Section 8: what the kitchen-sink article actually renders.
// Usage: node markdown.mjs [origin]
// Playwright and axe-core are dev-only and deliberately absent from package.json.
// Install them anywhere and point QA_TOOLS at that directory:
//   mkdir -p /tmp/qa-tools && cd /tmp/qa-tools && npm init -y
//   npm install playwright axe-core lighthouse && npx playwright install chromium
//   QA_TOOLS=/tmp/qa-tools node <this script>
const TOOLS = process.env.QA_TOOLS ?? '/tmp/qa-tools';
const { chromium } = await import(`${TOOLS}/node_modules/playwright/index.mjs`);

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:4321';
const URL_ = ORIGIN + '/posts/kitchen-sink/';
const browser = await chromium.launch();
const out = {};

/* ------------------------------------------------- desktop: structure --- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  out.structure = await page.evaluate(() => {
    const q = (s) => [...document.querySelectorAll(s)];
    const shikiVarCount = (el) => {
      let n = 0;
      for (const sp of el.querySelectorAll('span[style]'))
        if (/--shiki-(light|dark)/.test(sp.getAttribute('style'))) n += 1;
      return n;
    };
    const toc = document.querySelector('.toc');
    const tocLinks = toc ? [...toc.querySelectorAll('a')].map((a) => a.getAttribute('href')) : [];
    return {
      katexDisplay: q('.katex-display').length,
      katexInline: q('.katex').length,
      katexErrors: q('.katex-error').length,
      codeBlocks: q('pre.astro-code').map((p) => ({
        lang: p.getAttribute('data-language'),
        shikiSpans: shikiVarCount(p),
        overflowX: getComputedStyle(p).overflowX,
        scrollable: p.scrollWidth > p.clientWidth,
      })),
      footnotesSection: !!document.querySelector('section[data-footnotes], .footnotes'),
      footnoteRefs: q('a[data-footnote-ref]').length,
      footnoteBackrefs: q('a[data-footnote-backref]').length,
      backrefDecoration: document.querySelector('a[data-footnote-backref]')
        ? getComputedStyle(document.querySelector('a[data-footnote-backref]')).textDecorationLine : null,
      tables: q('.prose table').length,
      images: q('.prose img').map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height') })),
      figures: q('.prose figure').length,
      figcaptions: q('.prose figcaption').map((f) => f.textContent.trim().slice(0, 40)),
      callouts: q('.callout').map((c) => ({ classes: c.className, label: c.querySelector('.label')?.textContent.trim() })),
      tocPresent: !!toc,
      tocLinks,
      tocTargetsResolve: tocLinks.map((h) => ({ href: h, resolves: !!document.getElementById(decodeURIComponent(h.slice(1))) })),
      headingAnchors: q('.prose .heading-anchor').length,
      headingIds: q('.prose h2[id], .prose h3[id], .prose h4[id]').map((h) => h.id),
      taskListItems: q('.task-list-item').length,
      taskCheckboxes: q('.task-list-item input').map((i) => ({ checked: i.checked, disabled: i.disabled, ariaLabel: i.getAttribute('aria-label') })),
    };
  });
  // does anything overflow the page at 1280?
  out.desktopOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    overflows: document.documentElement.scrollWidth > window.innerWidth,
  }));
  await ctx.close();
}

/* --------------------------------------------------- 390px: no overflow --- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  out.mobile = await page.evaluate(() => {
    const doc = document.documentElement;
    const wide = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > window.innerWidth + 1 || r.right > window.innerWidth + 1)
        wide.push({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 50), width: Math.round(r.width), right: Math.round(r.right) });
    }
    const table = document.querySelector('.prose table');
    const tableWrap = table?.parentElement;
    return {
      scrollWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
      pageOverflows: doc.scrollWidth > window.innerWidth,
      elementsWiderThanViewport: wide.slice(0, 12),
      elementsWiderThanViewportCount: wide.length,
      table: table ? {
        scrollWidth: table.scrollWidth, clientWidth: table.clientWidth,
        parentTag: tableWrap?.tagName.toLowerCase(),
        parentOverflowX: tableWrap ? getComputedStyle(tableWrap).overflowX : null,
        parentScrollable: tableWrap ? tableWrap.scrollWidth > tableWrap.clientWidth : null,
      } : null,
      katexDisplayScrollable: [...document.querySelectorAll('.katex-display')].map((k) => ({
        overflowX: getComputedStyle(k).overflowX, scrollable: k.scrollWidth > k.clientWidth,
      })),
      longestPreScrollable: [...document.querySelectorAll('pre.astro-code')].map((p) => p.scrollWidth > p.clientWidth),
    };
  });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 2));
