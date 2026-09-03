# Registry — cohomolo-gy

Single source of truth. Every other document cites these IDs and never
restates the values. Prefixes: `D-` decision, `C-` constant,
`U-` user gate, `OQ-` open question. Interface contracts live in
`contracts.yaml` and are cited as `c-*`.

IDs D-1 … D-14 and C-1 … C-4 are carried verbatim from the intake brief
(`../2026-09-03-1300-cohomolo-gy-intake/brief.md`).

---

## D-1 — Site shape

**Decision**: `cohomolo.gy` is a writing-first personal blog and homepage: posts are the centre of gravity; About, Projects, Talks, and Notes orbit them.
**Why**: Chosen by Emily over landing page, digital garden, and org hub during the premise check.
**Undo**: Reorder the homepage sections; the collections are unaffected.

## D-2 — User classes

**Decision**: Three user classes: readers (any device, links/RSS), Emily-as-author (Markdown file + `npm run dev`), Emily-as-maintainer (npm upgrades).
**Why**: The request names "ease of adding entries" and "easy to edit styling" as priorities, so the author class drives structure.
**Undo**: n/a.

## D-3 — Non-goals

**Decision**: No search, no comments, no analytics, no newsletter, no CMS, no i18n.
**Why**: Asked directly as an inclusion checklist; Emily selected only feeds/OG and math/code.
**Undo**: Each is additive later (Pagefind, giscus, Plausible) without touching content.

## D-4 — No AI attribution

**Decision**: No file, byline, footer, commit trailer, `humans.txt`, or metadata names an AI tool as author or contributor. Emily is the sole author everywhere.
**Why**: Explicit instruction: "Remove yourself as an author, make it for me."
**Undo**: n/a.

## D-5 — Repository location and name

**Decision**: The project lives at `~/haskell/site`; the GitHub repository is expected to be named `site`.
**Why**: Emily's choice over `cohomolo.gy` and `cohomolo-gy`.
**Undo**: `mv`; nothing in the build depends on the directory name.

## D-6 — Execution mode

**Decision**: Orchestrated. Packages are dispatched to a coordinated agent team in git worktrees; Emily commits the result herself.
**Why**: Emily: "use teams, coordinate effectively, put in high effort."
**Undo**: n/a.

## D-7 — Collections

**Decision**: Four collections — `posts` (long-form Markdown/MDX), `notes` (short-form Markdown), `projects` (YAML data), `talks` (YAML data) — plus a single `about` Markdown entry. Schemas are frozen in `c-content-schema`.
**Why**: Sections selected by Emily. Data collections for projects/talks keep lists editable without touching templates.
**Undo**: Deleting a collection = delete its folder, its config entry, its route file, and its nav item.

## D-8 — Feeds and metadata

**Decision**: One RSS feed at `/rss.xml` containing posts and notes, a sitemap via `@astrojs/sitemap`, and a generated 1200×630 PNG Open Graph image per post and per note at `/og/<collection>/<id>.png`.
**Why**: Standard blog plumbing Emily asked for; one feed is what most readers expect.
**Undo**: Filter notes out of the feed with one predicate.

## D-9 — Math and code

**Decision**: Server-rendered KaTeX via `remark-math` + `rehype-katex`; Shiki highlighting with dual themes (`themes: { light, dark }`) and the languages Haskell, Lean 4, Agda, OCaml, Rust, Python, TypeScript, Bash, Nix. KaTeX CSS is loaded only on pages whose frontmatter sets `math: true`.
**Why**: Domain is `cohomolo.gy`; math and Haskell are non-negotiable. Zero client JS.
**Undo**: Remove two plugins and one stylesheet.

## D-10 — Theme

**Decision**: Dark-first. `prefers-color-scheme` is honoured on first visit; a toggle in the header persists the choice in `localStorage` under key `theme`; the choice is applied by an inline `<script>` in `<head>` before first paint to avoid flash. The `data-theme="light|dark"` attribute on `<html>` is the switch.
**Why**: Emily chose dark-first with light + toggle.
**Undo**: Delete the toggle and the script; keep the media query.

## D-11 — Seed content

**Decision**: Ship two draft posts written in Emily's voice with `draft: true` (so they build locally but do not publish until she flips the flag), one published kitchen-sink post that exercises every feature, two short notes, a populated `projects.yaml` and `talks.yaml` from public facts, and an About page from the chosen bio line.
**Why**: Emily chose "two real starter posts + one demo post." Drafts protect her from publishing words she has not reviewed.
**Undo**: Delete files.

## D-12 — Documentation set

**Decision**: `README.md` (what/why/quickstart/structure), `docs/WRITING.md` (adding posts, notes, projects, talks; frontmatter reference; drafts; math; images), `docs/STYLING.md` (tokens, fonts, where each visual decision lives), `docs/DEPLOY.md` (GitHub Pages setup, DNS records, custom domain checklist), `docs/MAINTENANCE.md` (upgrading Astro, Dependabot, troubleshooting).
**Why**: "all the requisite readmes and documentation" with author ergonomics as the priority.
**Undo**: n/a.

## D-13 — Design direction

**Decision**: "Observatory at the edge of the type universe." Dark void with warm paper text; a cool aurora accent pair (indigo → teal) used sparingly; serif display type with true italics for wonder, a humanist sans for reading, a monospace for metadata and code; a static constellation motif (SVG dots + hairlines) in the masthead; hairline rules; mono section labels (`§ writing`); a `∂` monogram as the logomark; the footer signs off with `∂² = 0`. Motion is limited to hover/focus transitions and respects `prefers-reduced-motion`. Tokens are frozen in `c-design-tokens`.
**Why**: The brief asks for "future, AI, functional programming, futurism, mysticism, and the joy of discovery." Void + aurora reads as futurist; serif italics and warm paper read as humane and joyful; `∂` is the cohomology in `cohomolo.gy`.
**Undo**: Every value is a CSS custom property in one file.

## D-14 — Markdown pipeline

**Decision**: Use the `unified()` processor from `@astrojs/markdown-remark` (not Astro 7's default Sätteri) configured under `markdown.processor`, so the remark/rehype ecosystem (remark-math, rehype-katex, rehype-slug, rehype-autolink-headings) applies to both `.md` and `.mdx`.
**Why**: Grounded 2026-09-03 against docs.astro.build/guides/markdown-content and the v7 upgrade guide: Sätteri is the v7 default and `markdown.remarkPlugins` / `rehypePlugins` are deprecated in favour of `markdown.processor`. KaTeX support on Sätteri is a 0.1.x third-party scaffold; remark-math/rehype-katex are the long-term-maintained path.
**Undo**: Swap `processor: unified({...})` for `satteri({...})` when a maintained Sätteri math plugin exists.

## D-15 — Fonts

**Decision**: Self-hosted via `@fontsource-variable/newsreader` (display + headings, with italics), `@fontsource-variable/inter` (body/UI), `@fontsource-variable/jetbrains-mono` (code/metadata). Imported once in `src/styles/fonts.css`. Fallback stacks are always declared.
**Why**: No third-party font requests; variable fonts keep the payload to three files; the pairing carries D-13.
**Undo**: Change three imports and three `--font-*` tokens.

## D-16 — No client router

**Decision**: No `<ClientRouter />` / view transitions. The only JavaScript shipped is the theme toggle's inline script.
**Why**: Simplicity and long-term maintainability outrank a page-transition flourish; it also removes a whole class of "script did not rerun" bugs.
**Undo**: Add `<ClientRouter />` to `BaseLayout` and rerun theme application on `astro:after-swap`.

## D-17 — Isolation and merge strategy

**Decision**: p1 initialises git with a `main` branch and an initial commit. Wave 2+ packages run in worktrees on branches `pkg/<id>`, with scopes that are pairwise disjoint; the orchestrator merges each into `main` with `--no-ff` after its verify passes, then rebuilds.
**Why**: Concurrent `astro build` runs in one checkout collide on `dist/` and `.astro/`. Disjoint scopes make merges trivial.
**Undo**: n/a.

## D-18 — URL scheme

**Decision**: Directory-style URLs with trailing slashes (`build.format: 'directory'`, `trailingSlash: 'always'`), post ids from filenames, tags lower-kebab. Full route table in `c-routes`.
**Why**: GitHub Pages serves `index.html` per directory natively; canonical URLs stay stable.
**Undo**: Change two config values; internal links use a helper so nothing else moves.

## D-19 — Licence deferred

**Decision**: No `LICENSE` file is committed. README carries a one-line TODO naming the choice (code licence, content licence) for Emily.
**Why**: Licensing her writing is Emily's call, not a default.
**Undo**: Add the file.

---

## C-1 — Astro version

**Value**: `astro@^7.3.1` with `@astrojs/mdx@^8.0.0`, `@astrojs/rss@^4.0.19`, `@astrojs/sitemap@^3.7.4`, `@astrojs/markdown-remark@^7.3.0`, `@astrojs/check@^0.9.10`.
**Source**: `npm view` on 2026-09-03.

## C-2 — Node version

**Value**: `.nvmrc` = `24`; engines `>=22.12.0`.
**Source**: Astro 7 `engines.node` is `>=22.12.0`; local node is 24.20.0.

## C-3 — Deploy workflow

**Value**: `.github/workflows/deploy.yml` using `actions/checkout@v7`, `withastro/action@v6`, `actions/deploy-pages@v5`; permissions `contents: read, pages: write, id-token: write`; `public/CNAME` = `cohomolo.gy`; `site: 'https://cohomolo.gy'`; no `base`.
**Source**: docs.astro.build/en/guides/deploy/github, fetched 2026-09-03.

## C-4 — Done gate

**Value**:
```bash
npm run check          # astro check → exit 0
npm run build          # astro build → exit 0
npm run lint:links     # scripts/check-links.mjs over dist/ → exit 0
```
Plus every path in `c-routes` exists in `dist/` and a screenshot pass of `/`, `/posts/kitchen-sink/`, `/about/` in both themes.
**Source**: Intake §Definition of Done.

## C-5 — Site identity

**Value**:
```ts
title:       "cohomolo.gy"
author:      "Emily Pillmore"
email:       "emilypi@cohomolo.gy"
bio:         "Engineer and mathematician writing about type theory, AI, and the strange future."
url:         "https://cohomolo.gy"
links:
  github:    "https://github.com/emilypi"
  org:       "https://github.com/cohomolo-gy"
  hackage:   "https://hackage.haskell.org/user/topos"
  linkedin:  "https://www.linkedin.com/in/emily-pillmore"
  email:     "mailto:emilypi@cohomolo.gy"
  rss:       "/rss.xml"
```
**Source**: Emily, intake rounds 2–3.

## C-6 — Shiki languages

**Value**: `['haskell','lean4','agda','ocaml','rust','python','typescript','javascript','bash','nix','json','yaml','toml','diff','latex']` with `themes: { light: 'github-light', dark: 'github-dark-dimmed' }` as the baseline pair (p2 may swap for a pair that matches the tokens; record the swap in STATUS.md).
**Source**: D-9.

## C-7 — Public facts for seed data

**Value** (verified public sources only; nothing else may be asserted about Emily):
- Maintains Haskell packages on Hackage as `topos`, including `base64`, `base16`, `base32`, `nonempty-vector`, `smash`, `group-theory`, `vitrea` (WIP optics).
- GitHub `emilypi`; research org `cohomolo-gy` (repos: `haskell-resources`, `optics-resources`, `polytope`, `lawvere`, `Isomorphic-Reasoning`, `Type-Arithmetic-and-the-Yoneda-Perspective`, `cats-in-context`, `invitation-to-haskell`).
- Talk: "Type Arithmetic and the Yoneda Perspective", Scalaworld 2019 (slides repo above).
- Paper: peer-reviewed article in *Compositionality* vol. 6 (2024) — title must be left as a `TODO` placeholder unless verified by the content agent from the journal's site.
- Former CTO, Haskell Foundation. Program committees: ICFP Haskell Implementors' Workshop (2021, 2025).
- BS Mathematics, University of Utah.
**Source**: GitHub org/profile pages fetched 2026-09-03; memory file `emily-pillmore-profile`. Titles Emily has rejected and that must never appear: "Head of Core Engineering", "Principal Engineer", "Systems Engineer".

---

## U-1 — Licence choice

**Question**: Which licence for code (MIT/BSD-3/Apache-2.0) and for written content (CC BY 4.0 / CC BY-NC 4.0 / all rights reserved)?
**Options**: any; costs are nil either way.
**Recommendation**: MIT for code, CC BY 4.0 for content.
**Blocks**: nothing — see D-19.
**Answer**: 2026-09-03 — proprietary, all rights reserved, for both content and code (`LICENSE`); content may not be used for ML training. D-19 superseded.

## U-2 — Compositionality paper title

**Question**: Exact title, co-authors, and DOI of the 2024 *Compositionality* vol. 6 article.
**Options**: content agent verifies from compositionality-journal.org, or Emily fills the TODO.
**Recommendation**: Verify; if unverifiable, ship a TODO placeholder rather than a guess.
**Blocks**: one row of `talks.yaml`.
**Answer**: _unanswered_
