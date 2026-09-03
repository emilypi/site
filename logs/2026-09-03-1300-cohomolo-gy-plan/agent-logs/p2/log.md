# p2 — Design system, layouts, components, homepage

Branch `pkg/p2` from `main` at `b9f1ea7`. Worktree `/Users/emilypillmore/haskell/.site-worktrees/p2`.

## What shipped

Styles

- `src/styles/tokens.css` — the frozen token set exactly as specified, plus the light overrides
  duplicated into both the `:root[data-theme='light']` block and the
  `@media (prefers-color-scheme: light) :root:not([data-theme])` block. Nothing was renamed or
  removed. Nothing was added.
- `src/styles/global.css` — reset, base type, the named utility classes (`.container`,
  `.container--narrow`, `.label`, `.hairline`, `.visually-hidden`, `.link-plain`), the skip-link
  styles, `:focus-visible`, `::selection`, `scroll-behavior` gated on `prefers-reduced-motion`, and
  the Shiki dual-theme rules.
- `src/styles/prose.css` — the `.prose` reading surface: headings, autolink anchors, links, quotes,
  code, KaTeX, lists, tables, media, footnotes, `mark`/`kbd`/`abbr`/`del`.

Layouts

- `src/layouts/BaseLayout.astro` — theme script first in `<head>`, full metadata head, skip link,
  `Header`/`main#main`/`Footer`.
- `src/layouts/ArticleLayout.astro` — article header, optional lede, prose slot, prev/next nav,
  contents as a `<details>` below 1200px and a sticky rail in the right margin at and above it.

Components — `Header`, `Footer`, `ThemeToggle`, `FormattedDate`, `TagList`, `PostList`,
`TableOfContents`, `Callout`, `Figure`, `Constellation`, `SectionHeading`, `ProjectCard`,
`TalkItem`, plus two private ones: `Icon` (the six footer marks, drawn inline) and `KatexStyles`.

Pages — `src/pages/index.astro` (hero with constellation and aurora, then writing, notes and
projects bands, each hidden when its collection is empty).

Assets — `public/favicon.svg` refined: the `∂` is now italic and carries `--color-accent`, matching
the masthead monogram.

## Decisions

**Type sizes actually used.** No token values were changed. The homepage `h1` is `--text-4xl`
(`clamp(2.75rem, 6vw, 4rem)`) at weight 400 with `letter-spacing: -0.02em` and `max-width: 22ch`,
which breaks the bio sentence over three lines at 1280px and four at 390px. The article `h1` is
`--text-3xl`. Prose `h2` is `--text-2xl`, `h3` is `--text-xl`, `h4` is body semibold at `--text-lg`;
`h5`/`h6` fall back to the mono label treatment. Nav links are mono at `--text-sm`; every label,
date, tag and status pill is mono at `--text-xs` with `--tracking-label`.

**Shiki variables observed.** Built a post with a Haskell fence and read `dist`. Shiki emits, on
`pre.astro-code` and on every token `span`, exactly four custom properties: `--shiki-light`,
`--shiki-dark`, `--shiki-light-bg`, `--shiki-dark-bg`. The `<pre>` also carries
`class="astro-code astro-code-themes github-light github-dark-dimmed"`, `data-language`, and an
inline `overflow-x: auto`. No literal colours appear anywhere. So the theming is
`.astro-code, .astro-code span { color: var(--shiki-dark) }` with `--shiki-light` substituted in
both light blocks, and the background forced to `--color-bg-elevated` with `!important` to beat the
inline `-bg` variables. Verified in both schemes in `article-dark.png` and `article-light.png`.

**Contents rail placement.** The brief asked for a sticky aside in the right margin at ≥1200px. The
obvious implementation — widening the article shell and running a two-column grid — pulls the prose
column left of the masthead wordmark, because the header uses `.container` at `--measure-wide`. The
misalignment is visible at 1280px and worse at 1440px. Instead the shell keeps `--measure-wide` on
every article, and the rail is absolutely positioned at `left: calc(var(--measure) + var(--space-8))`
inside a `position: relative` body, spanning `top: 0; bottom: 0` so an inner `position: sticky`
wrapper has room to travel. Its width is clamped to the space actually left over:
`clamp(9rem, calc((100vw + var(--measure-wide)) / 2 - 2 * var(--gutter) - var(--measure) - var(--space-8) - 1rem), 15rem)`.
At 1200px that resolves to about 220px and fits with room to spare; the prose column stays aligned
with the masthead at every width.

**Section dividers.** The homepage rules are drawn on a `.band-inner` child of `.container` rather
than on the container itself, so they line up with the text rather than with the container's padding
box. The vertical rhythm around each rule is roughly balanced: 56px above, 48px below.

**Callout `aside` kind.** The `aside` kind takes `--color-rule` for its left border as specified,
but its mono label is overridden to `--color-text-faint` — at `--color-rule` on the dark background
the label was illegible.

**Constellation.** Deterministic at build time: a seeded LCG (`Math.imul` on the Numerical Recipes
constants) over a jittered grid — 9x4 cells for `low`, 10x6 for `mid` — which spreads the field more
evenly than uniform sampling while still looking organic. Each star links to its two nearest
neighbours within 140 units, pairs deduped. Five stars twinkle on a 6–9s cycle with staggered
delays, animating between a per-star `--twinkle-base` and `--twinkle-peak`; the whole animation sits
inside `@media (prefers-reduced-motion: no-preference)`. The SVG takes `color: var(--color-text-muted)`
so `currentColor` stars read as a faint field rather than as bright dots, and masks to transparent
between 42% and 92% of its height. The hero's aurora is on `.hero::before` at `z-index: -2` so the
constellation at `z-index: -1` sits above it.

**No dependencies were added.**

## Verification

| Command | Result |
| --- | --- |
| `npm run check` | pass, 0 errors / 0 warnings / 0 hints over 28 files |
| `npm run build` | pass, 1 page (empty content set) |
| `grep -q 'data-theme' dist/index.html` | pass |
| `grep -c 'data-theme' src/styles/tokens.css` | 3 |
| `grep -rq 'Newsreader' dist/_astro/*.css` | pass |
| `git status --porcelain -- src/content` | empty |
| `npm run lint:links` | **fail — 12 dangling links, none of them mine** |

Head order confirmed by reading `dist/index.html`: the theme script is the first child of `<head>`
at byte 37, the first `rel="stylesheet"` at byte 1706. No empty `<ol>` and no empty band `<section>`
survive an empty content set — only `<section class="hero">` is emitted.

Beyond the brief's list:

- Horizontal-overflow scan over `/`, an article and the smoke page, at 320/390/768/1200/1440 in both
  schemes: no page scrolls horizontally. Wide code blocks, tables and display math scroll inside
  their own containers.
- Theme toggle driven in a real browser: starting dark it flips `data-theme` to `light`, repaints
  the body to `rgb(247, 244, 236)`, sets `aria-pressed="true"`, writes `theme=light` to
  `localStorage`, and survives a reload.
- `prefers-reduced-motion: reduce` resolves the twinkle to `animation-name: none` and
  `scroll-behavior: auto`; under `no-preference` they are `twinkle` and `smooth`.
- First Tab stop is the skip link; it slides into view at 8px and moves focus to `main` on Enter.
- One `h1` per page, one `main#main`, the primary nav is labelled, no `img` without `alt`.

### About the `lint:links` failure

Every dangling target is a route another package owns. The homepage and the shared chrome link to
them by contract, so this check cannot pass on `pkg/p2` in isolation.

- `/posts/`, `/notes/`, `/projects/`, `/talks/`, `/about/` — p4's routes, reached from `SITE.nav`,
  the hero's jump row and the footer.
- `/rss.xml` — p6's feed, reached from the head `<link rel="alternate">` and the footer.
- `/og/default.png` — p6's social card, reached from `og:image` and `twitter:image`.

Expect it to go green once p4 and p6 land.

## Screenshots

All under this directory, captured against `npm run preview` with throwaway content that was deleted
before committing.

- `home-dark.png`, `home-light.png` — 1280x900, full page.
- `home-mobile.png` — 390x844, full page.
- `article-dark.png`, `article-light.png` — 1280x1200, full page, with the contents `<details>`.
- `article-toc-rail.png` — 1200x1000, the sticky rail at the breakpoint.
- `article-mobile.png` — 390x844, full page.
- `smoke-dark.png` — every component with sample props, including all five callout kinds.

Playwright had no browser installed; `npx playwright install chromium` fetched one. Note for anyone
repeating this: the CLI accepts `--color-scheme light` but silently ignores `--color-scheme=light`,
and its default is light, so an unflagged capture is *not* the dark theme.

## Open issues

1. **`formatDate` is a day early in negative UTC offsets.** A post dated `2026-07-02` renders as
   "1 July 2026". `date: z.coerce.date()` parses `YYYY-MM-DD` as UTC midnight, and
   `Intl.DateTimeFormat('en-GB')` then formats it in the local zone. Reproduced on every preview
   entry. `src/lib/format.ts` is p1's file, so it is untouched here; the fix is a `timeZone: 'UTC'`
   option on both formatters and on the `iso` branch.
2. **KaTeX CSS ships on every page.** `BaseLayout` imports `KatexStyles.astro` statically and only
   renders it when `math` is true, as the brief specifies, but Vite hoists the stylesheet into the
   chunk shared by every page — 52K raw for the combined sheet, of which KaTeX is roughly half. The
   font files are emitted and their URLs rewritten correctly, and browsers fetch only the faces they
   use, so the cost is one cached stylesheet rather than per-page bandwidth. Left as is; worth a
   second look in p7 if page weight is being tuned.
3. **`agda` is not a Shiki language**, as the scaffold notes. Agda fences render as plain text
   inside the styled `pre`, which looks acceptable but is not highlighted.
4. **`/notes/{id}/` and `/posts/{id}/` were exercised through a throwaway route** to validate
   `ArticleLayout`. p4 owns the real routes; the props it must pass are the ones in the contract.
