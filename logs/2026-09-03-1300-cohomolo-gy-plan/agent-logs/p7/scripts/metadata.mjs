// Section 9: per-page head metadata, sitemap coverage, robots, RSS structure.
// Reads dist/ directly. Usage: node metadata.mjs [distDir]
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DIST = process.argv[2] ?? '/Users/emilypillmore/haskell/site/dist';
const SITE = 'https://cohomolo.gy';
const ROUTES = ['/', '/posts/', '/posts/kitchen-sink/', '/notes/', '/notes/what-notes-are-for/',
  '/tags/', '/tags/meta/', '/tags/typesetting/', '/projects/', '/talks/', '/about/'];

const fileFor = (r) => (r === '/404.html' ? `${DIST}/404.html` : `${DIST}${r}index.html`);
const one = (html, re) => { const m = html.match(re); return m ? m[1] : null; };
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

const rows = [];
for (const r of [...ROUTES, '/404.html']) {
  const html = readFileSync(fileFor(r), 'utf8');
  const titles = all(html, /<title>([\s\S]*?)<\/title>/g);
  const canon = one(html, /<link rel="canonical" href="([^"]+)"/);
  const og = Object.fromEntries(
    [...html.matchAll(/<meta property="(og:[^"]+|article:[^"]+)" content="([^"]*)"/g)].map((m) => [m[1], m[2]]),
  );
  rows.push({
    route: r,
    titleCount: titles.length,
    title: titles[0] ?? null,
    description: one(html, /<meta name="description" content="([^"]*)"/),
    canonical: canon,
    canonicalAbsolute: canon ? canon.startsWith(SITE) : null,
    canonicalTrailingSlash: canon ? canon.endsWith('/') : null,
    rssAlternate: one(html, /<link[^>]*rel="alternate"[^>]*type="application\/rss\+xml"[^>]*href="([^"]+)"/)
      ?? one(html, /<link[^>]*type="application\/rss\+xml"[^>]*href="([^"]+)"/),
    robots: one(html, /<meta name="robots" content="([^"]*)"/),
    ogType: og['og:type'] ?? null,
    ogImage: og['og:image'] ?? null,
    ogUrl: og['og:url'] ?? null,
    articlePublished: og['article:published_time'] ?? null,
    articleModified: og['article:modified_time'] ?? null,
    themeColorCount: all(html, /<meta name="theme-color" content="([^"]*)"/g).length,
    scriptTags: all(html, /<script([^>]*)>/g).map((s) => s.trim() || '(bare inline)'),
    externalScriptSrc: all(html, /<script[^>]*src="(https?:\/\/[^"]+)"/g),
  });
}

/* ---- og image files exist and are 1200x630 ---- */
const ogChecks = [];
for (const row of rows) {
  if (!row.ogImage) continue;
  const p = DIST + row.ogImage.replace(SITE, '');
  const exists = existsSync(p);
  let dims = null;
  if (exists) {
    const b = readFileSync(p);
    // PNG IHDR: width/height are big-endian uint32 at bytes 16..24
    dims = b.slice(1, 4).toString() === 'PNG' ? `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}` : 'not-png';
  }
  ogChecks.push({ route: row.route, ogImage: row.ogImage, exists, dims });
}

/* ---- sitemap ---- */
const idx = readFileSync(`${DIST}/sitemap-index.xml`, 'utf8');
const children = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const child = readFileSync(`${DIST}/sitemap-0.xml`, 'utf8');
const sitemapUrls = [...child.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

/* ---- robots ---- */
const robots = readFileSync(`${DIST}/robots.txt`, 'utf8');

/* ---- rss ---- */
const rss = readFileSync(`${DIST}/rss.xml`, 'utf8');
const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
const RFC822 = /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} (GMT|[+-]\d{4})$/;
const rssItems = items.map((it) => ({
  title: one(it, /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/),
  link: one(it, /<link>([^<]+)<\/link>/),
  pubDate: one(it, /<pubDate>([^<]+)<\/pubDate>/),
}));
let xmlWellFormed = 'unknown';
try { execSync(`xmllint --noout ${DIST}/rss.xml ${DIST}/sitemap-index.xml ${DIST}/sitemap-0.xml`); xmlWellFormed = 'yes'; }
catch (e) { xmlWellFormed = 'NO: ' + String(e.stderr ?? e); }

console.log(JSON.stringify({
  pages: rows,
  ogImageChecks: ogChecks,
  sitemapIndexChildren: children,
  sitemapUrls,
  sitemapMissingRoutes: ROUTES.filter((r) => !sitemapUrls.includes(SITE + r)),
  sitemapExtraUrls: sitemapUrls.filter((u) => !ROUTES.includes(u.replace(SITE, ''))),
  robots,
  robotsMentionsSitemap: /Sitemap:\s*\S+/i.test(robots),
  rss: {
    wellFormed: xmlWellFormed,
    itemCount: rssItems.length,
    items: rssItems,
    nonAbsoluteLinks: rssItems.filter((i) => !i.link?.startsWith(SITE)),
    noTrailingSlash: rssItems.filter((i) => !i.link?.endsWith('/')),
    badPubDate: rssItems.filter((i) => !RFC822.test(i.pubDate ?? '')),
    channelLink: one(rss, /<channel>[\s\S]*?<link>([^<]+)<\/link>/),
    hasAtomSelf: /rel="self"/.test(rss),
  },
}, null, 2));
