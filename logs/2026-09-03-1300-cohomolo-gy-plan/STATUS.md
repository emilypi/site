# Campaign Status: cohomolo-gy

**Plan**: `logs/2026-09-03-1300-cohomolo-gy-plan`
**Mode**: orchestrated
**Updated**: 2026-09-03 14:40

## Current Wave: 4

States: `pending` → `briefed` → `in-flight` → `fix-round-N` → `verified` | `parked`

| Package | Wave | Kind  | State     | Tier  | Log                  | Verified |
| ------- | ---- | ----- | --------- | ----- | -------------------- | -------- |
| p1      | 1    | build | verified  | opus  | agent-logs/p1/       | 2026-09-03 |
| p2      | 2    | build | verified  | opus  | agent-logs/p2/       | 2026-09-03 (merged 11fa848) |
| p3      | 2    | build | verified  | opus  | agent-logs/p3/       | 2026-09-03 (merged b17ba77) |
| p5      | 2    | build | verified  | sonnet| agent-logs/p5/       | 2026-09-03 (merged 5850496) |
| p6      | 2    | build | verified  | opus  | agent-logs/p6/       | 2026-09-03 (merged 0fe494d) |
| p4      | 3    | build | verified  | opus  | agent-logs/p4/       | 2026-09-03 (merged 98206a7) |
| p7      | 4    | audit | verified  | opus  | agent-logs/p7/       | 2026-09-03 (fixes 35a69db…8064188 + 247e662) |

## Parked / Unresolved

- none

## Deviations From Plan


- 2026-09-03 13:21 (p1): `typescript` pinned to `^6.0.3` — TypeScript 7 lacks the API `@astrojs/check@0.9.10` needs (C-1 amended). `z.url()` used instead of deprecated `z.string().url()` (c-content-schema, same type). `agda` removed from `shikiConfig.langs` — Shiki bundles no Agda grammar (C-6 amended; Agda fences render as plain text). Display math requires `$$` on its own lines (remark-math 6); single-line `$$…$$` renders inline.
- 2026-09-03 13:40 (p6): satori cannot parse variable fonts; OG renderer uses static TTF instances (Newsreader regular + italic, JetBrains Mono) and drops Inter from the card. Font paths resolve from the working directory because Astro bundles the prerender chunk (c-routes unaffected).
- 2026-09-03 13:42 (orchestrator, from p6 finding): `formatDate` now formats in UTC (commit 9594a3b) so `YYYY-MM-DD` frontmatter renders the same calendar day everywhere.
- 2026-09-03 13:35 (p3): Compositionality paper verified (DOI 10.32408/compositionality-6-1) — U-2 answered; `vitrea` is on Hackage (C-7 amended); venue spelled "Scala World"; talk date 2019-09-03 inferred, TODO left for Emily.
- 2026-09-03 13:46 (p2): KaTeX CSS is hoisted by Vite into the shared stylesheet, so it ships on every page (~52 KB cached) despite the conditional component; revisit in p7 only if page weight matters. TOC rail is absolutely positioned beside the prose column rather than a two-column grid, to keep the prose aligned with the masthead.
- 2026-09-03 13:58 (p4): BaseLayout omits the canonical link when `noindex` is set (c-components amended; the 404 page's canonical pointed at a non-existent `/404/` directory). Index pages render their own `<h1>` rather than SectionHeading's `<h2>` so every page has a top-level heading. About page's inline link list removed (orchestrator, 7193ffa) so `SITE.links` is the single source.
- 2026-09-03 14:30 (p7 audit): 14/14 sections reached. Fixed by p7: faint/teal token contrast (35a69db), footnote back-link underline (2f52086), long-URL overflow at 390px (ec5c963), docs corrections (8064188). Fixed by orchestrator (247e662): Figure gains a slot for inline SVG so `currentColor` follows the theme (c-components amended: `src`/`alt` optional); GFM task-list checkboxes get `aria-label` via an inline rehype plugin; `/tags/` linked from the Writing and Notes indexes; fonts moved from `@import` of fontsource CSS to Astro's Fonts API with `fontProviders.local()` over the same pinned fontsource files (D-15 amended) — preloads + size-adjusted fallbacks took homepage CLS from 0.203 to 0. Lighthouse after fixes: home 100/97 (desktop/mobile) perf, kitchen-sink 100/93; a11y 98/100; BP and SEO 100 everywhere.
- Accepted, not fixed: Shiki `github-light` keyword red is 4.49:1 on the light code surface (0.01 short of AA); KaTeX CSS is hoisted into the shared stylesheet (~52 KB cached) and render-blocks ~450 ms on first load; `og:url` on the 404 page reads `/404/`.
