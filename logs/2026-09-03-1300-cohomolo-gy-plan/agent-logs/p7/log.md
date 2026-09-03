# p7 — Integration QA, accessibility, and visual pass

Audited in place on `main`, base commit `7193ffa`. Four fixes committed; everything else reported.
`npm run verify` exits 0 at `8064188` (check 0 errors, build 12 pages, lint:links ok 192 links).

Tooling was installed outside the repo (`playwright@1.62.1`, `axe-core`, `lighthouse`) so
`package.json` is untouched. Every script in `scripts/` reads `QA_TOOLS` for that directory.

```bash
mkdir -p /tmp/qa-tools && cd /tmp/qa-tools && npm init -y
npm install playwright axe-core lighthouse && npx playwright install chromium
cd /Users/emilypillmore/haskell/site && npm run build
npx astro preview --port 4321 --host 127.0.0.1 &
QA_TOOLS=/tmp/qa-tools node logs/.../agent-logs/p7/scripts/crawl.mjs
```

## Coverage

| § | Section | Status | Evidence |
|---|---------|--------|----------|
| 1 | Routes | reached | All 16 named paths exist in `dist/` and return 200; three drafts have no directory and 404 over HTTP. |
| 2 | Links and assets | reached | `npm run lint:links` ok 192 links; `crawl.mjs` visited 11 pages, 0 bad responses, 0 console errors. |
| 3 | Contrast | reached | `contrast.mjs` over `tokens.css`, both schemes; table below. Confirmed against rendered pages by axe. |
| 4 | Keyboard and semantics | reached | `keyboard-theme.mjs` tab walk (22 stops) + `a11y.mjs` axe and structural assertions on 11 pages × 2 schemes. |
| 5 | Theme | reached | `keyboard-theme.mjs`: no attribute on first load, toggle writes `localStorage`, attribute present at `domcontentloaded`, Shiki colour flips. |
| 6 | Fonts and layout stability | reached | Network log: 3 site families from `/_astro/`, no third-party host, `font-display: swap`. CLS from Lighthouse. |
| 7 | Lighthouse | reached | 4 runs against Playwright's Chromium; table below. |
| 8 | Markdown rendering | reached | `markdown.mjs` on `/posts/kitchen-sink/` at 1280 and 390. |
| 9 | Metadata | reached | `metadata.mjs` over `dist/`: heads, OG PNG dimensions, sitemap, robots, RSS. |
| 10 | Security and privacy | reached | 2 inline scripts per page and no external `src`; 0 `target="_blank"`; only `127.0.0.1` contacted. Header note added to `docs/DEPLOY.md`. |
| 11 | Docs truth | reached | Token names, script table, frontmatter table, and cited paths checked against source; three mismatches fixed. |
| 12 | No AI attribution | reached | Grep returns only paths under `logs/`; `git log` shows one author and no trailers. |
| 13 | Screenshots | reached | 28 full-page captures plus 2 focus-ring captures in `screenshots/`. |
| 14 | Design review notes | reached | Below. |

## FOUND

### Blockers

**F1 — The de Rham figure is invisible in dark mode, the site's default.**
`Figure.astro` renders the SVG through `<img src=…>`. An SVG loaded that way is a separate
document, so the `stroke="currentColor"` and `fill="currentColor"` throughout
`src/content/posts/_assets/de-rham.svg` resolve against the *image's* own initial colour (black),
not the page's `--color-text`. In light mode black-on-cream happens to look right; in dark mode the
diagram is black on `#0b0d14`, about 1.1:1. The prose beside it claims the opposite: "Figures are
drawn in `currentColor`, so they invert with the theme rather than sitting in a white box at night."

Reproduce:
```bash
QA_TOOLS=/tmp/qa-tools node -e '
const {chromium}=await import(`${process.env.QA_TOOLS}/node_modules/playwright/index.mjs`);
const b=await chromium.launch();
for (const scheme of ["dark","light"]) {
  const p=await (await b.newContext({colorScheme:scheme})).newPage();
  await p.goto("http://127.0.0.1:4321/posts/kitchen-sink/");
  await p.locator(".prose img").first().screenshot({path:`/tmp/derham-${scheme}.png`});
}
await b.close();'
```
`/tmp/derham-dark.png` is a near-uniform dark rectangle (47 distinct pixel values across 521×201,
all in the `#080a10`–`#0b0d14` range). `/tmp/derham-light.png` shows the diagram correctly.

Not fixed — the correct remedy changes a component's contract, which is outside the fix policy.
Two options, in order of preference:
1. Inline the SVG so `currentColor` resolves against the page. Astro can import an `.svg` as a
   component; `Figure.astro` would need to accept one alongside `ImageMetadata | string`.
2. Put a `<style>` block with a `prefers-color-scheme` query inside the SVG file. One file, about
   six lines, but it follows the operating system rather than the site's own theme toggle, so a
   reader who toggles against their OS setting still sees the wrong colour.

Screenshots: `screenshots/posts-kitchen-sink-dark-1280.png` (figure region around y=5300).

### Should-fix

**F2 — Task-list checkboxes have no accessible name (axe `label`, critical).**
Four `<input type="checkbox" checked disabled>` elements from the GFM task list on
`/posts/kitchen-sink/`. Present in both schemes. This is the only remaining critical or serious
violation on the three gate pages other than F4.

Reproduce: `QA_TOOLS=/tmp/qa-tools node scripts/a11y.mjs` → `label|critical -> dark /posts/kitchen-sink/(4), light /posts/kitchen-sink/(4)`.
Also `kitchen-sink-desktop.json` audit `label` scores 0, holding the accessibility category at 95.

Not fixed — the remedy is a small rehype plugin in `astro.config.mjs` that gives each task
checkbox an `aria-label` from its list item text. Both the config file and content prose are
outside the fix policy.

**F3 — `/tags/` is orphaned.** No page on the site links to it. Individual tag pages are reachable
from article tag lists, but the index that lists them all is reachable only from the sitemap or by
typing the URL. `docs/WRITING.md` tells writers "`/tags/` lists them all", implying it is navigable.

Reproduce: `grep -rl 'href="/tags/"' dist/` returns nothing. The two-level crawl from `/` reaches
`/tags/meta/` and `/tags/typesetting/` but never `/tags/`.

Not fixed — where the link belongs (a sixth nav item, a footer link, or a "all tags" link on each
tag page) is a design decision.

**F4 — Shiki's light keyword red misses AA by 0.01 (axe `color-contrast`, serious).**
`#d73a49` on `--color-bg-elevated` `#fffdf7` is 4.49:1 against a 4.5 requirement, across 39 spans
on `/posts/kitchen-sink/` in light mode. The `github-light` theme assumes a pure white code
surface, where the same red reaches 4.53:1; the site's warm `#fffdf7` costs it the pass.

Reproduce: `QA_TOOLS=/tmp/qa-tools node scripts/a11y.mjs` → the only remaining `color-contrast`
row. All 39 nodes carry the same colour pair.

Not fixed — both remedies are out of policy: change `shikiConfig.themes.light` in
`astro.config.mjs` (for example to `light-plus`), or give `.astro-code` a pure white background in
light mode, which is a design change to the code surface.

**F5 — Homepage CLS is 0.203 on desktop, from font swap.**
Well above the 0.05 threshold, and the reason desktop performance sits at 90 rather than ≥95.
Lighthouse names the culprit as `body > main#main > section.band` shifting when the three site
faces finish loading; all four `layout-shifts` sub-items are "Web font loaded".

Reproduce: `lighthouse/home-desktop.json`, audits `cumulative-layout-shift` (0.203) and
`layout-shifts`. Mobile is unaffected (0.007) because the band is below the fold there.

Not fixed — needs metric-compatible fallback faces (`size-adjust`, `ascent-override`) in
`fonts.css`, or preloading the three latin `woff2` files, and the hashed filenames are not
stable across builds. Either exceeds the 20-line bar and needs measured metric values.

**F6 — KaTeX CSS ships on every page, contradicting its own component.**
`KatexStyles.astro` says it is "Loaded by BaseLayout only for entries that set `math: true`, so the
KaTeX stylesheet never reaches a page with no mathematics on it." Vite hoists it into the shared
`BaseLayout` stylesheet instead, so `/`, `/about/`, `/404.html` and the rest all download it.

Reproduce:
```bash
grep -c '\.katex' dist/_astro/BaseLayout.*.css   # 551
grep -o 'href="/_astro/[^"]*\.css"' dist/about/index.html   # only BaseLayout
```
The brief treated this as known unless it cost Lighthouse points. It does: the sheet is 51.8 KB raw
(14.7 KB transferred, 76% unused on the article page) and Lighthouse's `render-blocking-insight`
attributes 451 ms to it, with `/posts/kitchen-sink/` scoring 87 on mobile.

Not fixed — separating the sheet means changing how it is imported, which touches build config.

### Nits

**F7 — Heading levels skip from `h1` to `h3` on `/` and `/projects/`** (axe `heading-order`,
moderate; below the brief's serious/critical gate). `SectionHeading.astro` renders its label as
`<p class="label">` and only emits an `<h2>` when a `title` prop is passed, which no caller does.
Meanwhile `/posts/`, `/notes/` and `/talks/` already use `<h2 class="label year-label">` for the
same job, so the repo holds two conventions for one pattern.

Not fixed: making the label an `<h2>` also needs `.titles > h2` narrowed to `:not(.label)`, since
that rule would otherwise repaint the label in Newsreader at `--text-2xl`. Picking between the two
conventions is the design owner's call.

**F8 — `npm run format:check` fails on four content files**, and did so before this package:
`src/content/notes/boundary-of-a-boundary.md`, `src/content/posts/bellman-fixed-points.md`,
`src/content/posts/kitchen-sink.mdx`, `src/content/talks.yaml`. Verified by running
`npx prettier --check .` in a clean worktree at `7193ffa`. Not fixed: content prose is out of policy,
and `format:check` is not part of the `verify` gate.

**F9 — `--color-warn` is 4.17:1 in light mode on `--color-bg`.** It passes where it is actually
used (the `wip` project chip sits on `--color-bg-elevated`, 4.51:1), but the `.draft` badge in
`ArticleLayout.astro` would use it against the page background. No draft renders today, so nothing
is broken; the token is one background change away from a real failure.

**F10 — Tables have no scroll container.** `.prose table` is `width: 100%` with no
`overflow-x: auto` wrapper, unlike code blocks and display maths. The current table fits at 390 px
(358 px wide, no page overflow), so nothing fails now, but a wider table would push the page
sideways rather than scroll.

**F11 — `--color-bg-inset` is declared in both schemes and used nowhere.** `grep -rn 'color-bg-inset' src/` matches only `tokens.css`.

### Fixed

| # | Finding | Severity | Commit |
|---|---------|----------|--------|
| X1 | `--color-text-faint` failed AA in both schemes at the 12 px sizes it is used at (3.41:1 dark, 2.88:1 light — below even the 3:1 large-text floor), and light `--color-accent-2` label text was 3.65:1 | should-fix | `35a69db` |
| X2 | Footnote back-links were distinguished from surrounding muted prose by colour alone at 1.28:1 (axe `link-in-text-block`, serious) | should-fix | `2f52086` |
| X3 | `/posts/kitchen-sink/` pushed the page to 434 px at a 390 px viewport; the long bare URL was the only unclipped overflow source | should-fix | `ec5c963` |
| X4 | `docs/WRITING.md` described the feed as posts only; `docs/STYLING.md` pointed at `global.css` for breakpoints it does not contain and omitted `--tracking-label`; `docs/DEPLOY.md` had no response-header note | nit | `8064188` |

**X1 detail.** `faint` carries real 12 px metadata everywhere: post dates (`PostList`), article meta
and adjacent-post labels (`ArticleLayout`), tag chips (`TagList`), talk meta (`TalkItem`), project
role and links (`ProjectCard`), the footer colophon, year labels on three index pages, the tag-page
intro, TOC sub-links at 14 px, and the code-fence language badge. None is ≥18.66 px or bold, so all
of it needs 4.5:1. axe reported 30 violation rows across 11 pages × 2 schemes before the change and
7 after. New values, chosen by walking each token toward its scheme's `muted` until both
`--color-bg` and `--color-bg-elevated` cleared 4.5:

| token | scheme | was | now | on bg | on bg-elevated |
|---|---|---|---:|---:|---:|
| `--color-text-faint` | dark | `#626678` | `#7a7e90` | 4.82 | 4.52 |
| `--color-text-faint` | light | `#8d90a0` | `#6c6f81` | 4.52 | 4.88 |
| `--color-accent-2` | light | `#0f8f7a` | `#0c7a68` | 4.78 | 5.16 |

The light values were changed in both the `[data-theme='light']` block and the
`prefers-color-scheme` copy; `contrast.mjs` asserts the two stay identical.

**X3 detail.** Before: `document.documentElement.scrollWidth` 434 against `innerWidth` 390. The
only element overflowing without a scrolling or clipping ancestor was the bare URL anchor, 418 px
wide. The two `.katex-display` blocks and all six `pre.astro-code` blocks were already scrolling
correctly inside their own boxes. After: 390 = 390 on all eight routes tested.

## DISCARDED

- **Four SVGs on the article page carry no `aria-hidden` of their own** — all four sit inside
  `.katex-html[aria-hidden="true"]`, KaTeX's presentation layer, with the MathML mirror carrying
  the semantics. Correct as built.
- **`<pre>` elements take focus in the tab order** — Chromium makes scrollable regions focusable,
  which is what WCAG 2.1.1 wants for a code block that scrolls. Not a defect.
- **275 elements measured wider than the viewport at 390 px** — all inside `.katex-mathml` (hidden)
  or a scrolling ancestor. Only one caused real page overflow, now fixed (X3).
- **`rule/bg` is 1.30:1 in both schemes** — hairline separators, decorative, outside WCAG 1.4.11.
- **404 has no `link[rel=canonical]`** — deliberate, the page is `noindex`; confirmed as expected.
- **KaTeX faces use `font-display: block`** — KaTeX's own stylesheet, and correct for maths glyphs
  where a fallback would be wrong. Costs no Lighthouse points (TBT 0 ms on all four runs).
- **Footer external links carry `rel="me noopener"` with no `target`** — harmless; the site has
  zero `target="_blank"` anywhere.
- **`docs/WRITING.md` shows a per-post `_assets/` folder while the repo uses a shared
  `src/content/posts/_assets/`** — the documented example is internally consistent and would work.
  A convention divergence, not an error; left for the owner.
- **`nav` overflow-scrolls on narrow screens** — deliberate, `scrollbar-width: none` with the list
  wrapping to its own grid row under 40rem. Renders correctly at 390 px.
- **Theme `aria-pressed` starts as `"false"` in the markup** — the inline script syncs it before
  paint; measured `"true"` on first load under `colorScheme: light`.

## NOT SEARCHED

- **Real-device and assistive-technology testing.** All accessibility results are axe-core plus
  scripted checks in headless Chromium. No screen reader (VoiceOver, NVDA) was exercised, so the
  reading order and announcement quality of the maths, the TOC, and the theme toggle are unverified
  beyond their markup.
- **Firefox and WebKit.** Only Chromium was installed. Font-swap CLS in particular is
  engine-specific.
- **Live GitHub Pages behaviour.** Response headers, HTTPS redirection, and 404 handling are
  described in `docs/DEPLOY.md` from documentation, not measured against a deployed site; the DNS
  apex still points elsewhere per that document.
- **OG card visual quality.** Dimensions and existence were checked (all 1200×630 PNGs); the
  rendered artwork was not inspected.

## Lighthouse

Playwright's Chromium via `CHROME_PATH`, against `npm run preview` on `127.0.0.1:4321`, after all
fixes. Raw reports in `lighthouse/`.

| Page | Preset | Performance | Accessibility | Best practices | SEO | CLS | LCP | TBT |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | desktop | **90** | 98 | 100 | 100 | **0.203** | 0.5 s | 0 ms |
| `/` | mobile | 96 | 98 | 100 | 100 | 0.007 | 2.3 s | 0 ms |
| `/posts/kitchen-sink/` | desktop | 100 | 95 | 100 | 100 | 0.001 | 0.6 s | 0 ms |
| `/posts/kitchen-sink/` | mobile | **87** | 95 | 100 | 100 | 0.003 | 3.2 s | 0 ms |

Below the ≥95 target: home desktop performance (top audit `cumulative-layout-shift`, F5) and
article mobile performance (top audit `render-blocking-insight`, F6). Accessibility is held under
100 by `heading-order` on the homepage (F7) and `label` on the article (F2).

## Contrast

`node scripts/contrast.mjs src/styles/tokens.css` — after X1. Exit 0.

### dark

| pair | fg | bg | ratio | AA normal | AA large |
|---|---|---|---:|---|---|
| text | `#e7e4dc` | `#0b0d14` | 15.28 | pass | pass |
| muted | `#9a9db0` | `#0b0d14` | 7.23 | pass | pass |
| faint | `#7a7e90` | `#0b0d14` | 4.82 | pass | pass |
| accent | `#8fb3ff` | `#0b0d14` | 9.30 | pass | pass |
| accent-2 | `#5fe3c9` | `#0b0d14` | 12.31 | pass | pass |
| accent-3 | `#c4a6ff` | `#0b0d14` | 9.47 | pass | pass |
| warn | `#ffb86b` | `#0b0d14` | 11.39 | pass | pass |
| text/elevated | `#e7e4dc` | `#12151f` | 14.34 | pass | pass |
| muted/elevated | `#9a9db0` | `#12151f` | 6.79 | pass | pass |
| faint/elevated | `#7a7e90` | `#12151f` | 4.52 | pass | pass |
| accent/elevated | `#8fb3ff` | `#12151f` | 8.73 | pass | pass |
| rule/bg | `#22263a` | `#0b0d14` | 1.30 | n/a (hairline) | n/a |

### light

| pair | fg | bg | ratio | AA normal | AA large |
|---|---|---|---:|---|---|
| text | `#1b1c24` | `#f7f4ec` | 15.43 | pass | pass |
| muted | `#5b5e70` | `#f7f4ec` | 5.83 | pass | pass |
| faint | `#6c6f81` | `#f7f4ec` | 4.52 | pass | pass |
| accent | `#3552c9` | `#f7f4ec` | 5.97 | pass | pass |
| accent-2 | `#0c7a68` | `#f7f4ec` | 4.78 | pass | pass |
| accent-3 | `#6a45c8` | `#f7f4ec` | 5.79 | pass | pass |
| warn | `#b45f06` | `#f7f4ec` | 4.17 | fail (F9, unused) | pass |
| text/elevated | `#1b1c24` | `#fffdf7` | 16.67 | pass | pass |
| muted/elevated | `#5b5e70` | `#fffdf7` | 6.29 | pass | pass |
| faint/elevated | `#6c6f81` | `#fffdf7` | 4.88 | pass | pass |
| accent/elevated | `#3552c9` | `#fffdf7` | 6.45 | pass | pass |
| rule/bg | `#dcd8cc` | `#f7f4ec` | 1.30 | n/a (hairline) | n/a |

The `[data-theme='light']` block and the `prefers-color-scheme` copy are byte-identical.

## Tab order

`/posts/kitchen-sink/`, dark, 1280×900. Every stop draws `solid 2px rgb(95, 227, 201)`; no stop is
missing a ring.

1. skip link → 2. wordmark → 3–7. Writing, Notes, Projects, Talks, About → 8. theme toggle
(`aria-label="Toggle colour theme"`) → 9–10. tag chips → 11–15. TOC links → 16–20. the five
scrollable code blocks → 21–22. remaining TOC links.

Screenshots: `screenshots/focus-skip-link-dark-1280.png`, `screenshots/focus-theme-toggle-dark-1280.png`.

## Theme

| Check | `colorScheme: dark` | `colorScheme: light` |
|---|---|---|
| `data-theme` on first load | absent | absent |
| `--color-bg` on first load | `#0b0d14` | `#f7f4ec` |
| `aria-pressed` on first load | `false` | `true` |
| after click | `data-theme="light"`, `localStorage.theme="light"` | `data-theme="dark"`, `localStorage.theme="dark"` |
| attribute at `domcontentloaded` after reload | present | present |
| theme script is first element in `<head>` | yes | yes |
| Shiki span colour flips | `rgb(173,186,199)` ↔ `rgb(36,41,46)` | same |

## Metadata

Every one of the 12 routes has exactly one `<title>`, a `meta[name=description]`, an RSS
`link[rel=alternate]`, and an `og:image` that resolves to an existing 1200×630 PNG. Canonicals are
absolute and end in `/` on all 11 indexable routes; `/404.html` correctly has none and carries
`meta[name=robots]=noindex`. Both article pages carry `og:type=article` and
`article:published_time`. The homepage uses `/og/default.png`.

`sitemap-index.xml` names one child listing exactly the 11 indexable routes — no drafts, nothing
missing, nothing extra. `robots.txt` points at the index. `rss.xml` is well-formed
(`xmllint --noout`), carries 2 items (1 published post + 1 published note), and every link is
absolute with a trailing slash and an RFC-822 `pubDate`.

## Security and privacy

Every page carries exactly two `<script>` elements, both inline and both about the theme: the
blocking reader in `<head>` and the toggle's listener. No `src` attribute, no framework runtime, no
third-party host contacted during an 11-page crawl. Zero `target="_blank"` in the whole build, so
the reverse-tabnabbing question does not arise. The site takes no user input and sets no cookies,
which removes most of the OWASP surface by construction. GitHub Pages cannot set custom response
headers, so there is no CSP or `Referrer-Policy`; that is now written down in `docs/DEPLOY.md`
along with the note that only a proxy in front of Pages could add them. If a policy is ever wanted
without a proxy, a `<meta http-equiv="Content-Security-Policy">` in `BaseLayout.astro` would cover
most of it, at the cost of a layout change this package did not make.

## Design review

The concept lands. The dark default really does read as an observatory: the constellation is faint
enough to be atmosphere rather than decoration, the masthead ∂ earns its place as a mark, and
`∂² = 0` in the footer is the kind of joke that rewards the reader who gets it without punishing
the one who does not. Newsreader at display sizes with violet italics on "type theory" and "the
strange future" is the single best decision in the design; it carries the whole homepage. The
restraint is real too — three fonts, one accent triad, no cards-with-shadows, no motion beyond a
slow twinkle that respects `prefers-reduced-motion`. The article page is the strongest artefact:
the sticky TOC, the mono `§` section labels, the code fences with their language badge, and the
maths all sit on one grid and feel like a single instrument rather than a theme plus plugins. The
404 is genuinely funny and on-brand.

What feels off. The light scheme is the weaker of the two — the cream is lovely but the palette was
tuned for the dark ground first, and it shows: the teal reads flat against warm paper, and the
contrast work in X1 had to pull three tokens darker, which narrows the muted/faint gap to about
1.3× and flattens the hierarchy the design wants. It is correct now but less expressive, and a
light-first pass on those two tokens would probably do better than my minimum-viable nudge.
The homepage stops a little abruptly: three bands and then the footer, with no invitation to go
deeper, and `/tags/` — a genuinely browsable index — sitting unlinked (F3) is a missed opportunity
rather than only a bug. The project cards are the least resolved surface; the `author`/`maintained`
row is dense and the mono chips fight the serif titles above them. And the figure being invisible in
the default theme (F1) is exactly the sort of thing the kitchen-sink page exists to catch, which is
a good sign about the page and a bad sign about the figure.

## Artefacts

- Scripts: `scripts/contrast.mjs`, `crawl.mjs`, `a11y.mjs`, `keyboard-theme.mjs`, `markdown.mjs`,
  `metadata.mjs`, `shots.mjs`, `lighthouse.sh`
- Data: `crawl-report.json`, `a11y-before.json`, `a11y-after.json`, `a11y-final.json`,
  `keyboard-theme.json`, `markdown.json`, `metadata.json`, `lighthouse/*.json`
- Screenshots: `screenshots/` — 7 routes × {dark, light} × {1280, 390}, full page, plus two focus
  captures. `shots.mjs` forces `loading="lazy"` images eager before capture; without that the
  de Rham figure is blank in the capture for a reason unrelated to F1.

Git status outside `logs/` is clean. The untracked `agent-logs/p2`–`p6` directories and the
modified `STATUS.md` predate this package.
