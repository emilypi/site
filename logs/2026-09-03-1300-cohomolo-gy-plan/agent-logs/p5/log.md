# p5 — README and docs — log

## Fix round 2 (post-review)

Team lead supplied the frozen `c-components` contract (previously only component names were frozen, not props). Updated `docs/WRITING.md`'s Callout/Figure section to the real props (`Callout`: `kind?: 'note'|'idea'|'warn'|'math'|'aside'`, default `note`, plus optional `title`, plus a default slot; `Figure`: `src: ImageMetadata | string`, `alt`, optional `caption`, optional `width`) and dropped the "check the component source" hedge, since the contract now answers it directly. Also tightened the About page line to name the collection/entry id (`about`/`about`) and its route (`/about/`). Updated `docs/STYLING.md`'s token list to name the real custom properties from the frozen tokens contract (colour, typography, layout, spacing, shape/motion groups) instead of speaking generically, and refined the light/dark section to note the `prefers-color-scheme` query is scoped to `:root:not([data-theme])`.

Re-ran the full verify suite after the edit — all five checks still pass (file existence, no AI/tool mentions, prettier --check, script cross-check, git status scope). Removed a stray untracked `log.md` draft from the worktree root (an artifact of drafting this log before copying it out) so `git status --porcelain` is clean of anything outside `README.md`/`docs/`/`.github/dependabot.yml`.

New commit: `605675a0012804067e811bfc8ef9cf72ca4b3ad1` ("Align Callout/Figure and token docs with frozen component contract"), on `pkg/p5`, same repo-local identity, no trailers.

## Files written

- `README.md`
- `docs/WRITING.md`
- `docs/STYLING.md`
- `docs/DEPLOY.md`
- `docs/MAINTENANCE.md`
- `.github/dependabot.yml`

Branch `pkg/p5`, tip commit `8ad86e5029eb6901b09706553877bf1ea5bcce3a` ("Add README and documentation"), repo-local identity (Emily Pillmore <emilypi@cohomolo.gy>), no trailers.

## Repo state read (main, at worktree creation)

Confirmed by direct read before writing anything:

- `package.json` scripts: `dev`, `build`, `preview`, `check`, `format`, `format:check`, `lint:links`, `new:post`, `new:note`, `og:default`, `verify`. TypeScript devDependency is `^6.0.3`.
- `astro.config.mjs`: `trailingSlash: 'always'`, `build.format: 'directory'`, Shiki `langs` list matches the brief exactly (no `agda`), themes `github-light`/`github-dark-dimmed`, `markdown.processor` uses `unified()` from `@astrojs/markdown-remark` with `remark-math`/`rehype-katex`/`rehype-slug`/`rehype-autolink-headings`, `gfm: true`.
- `.nvmrc` = `24`.
- `.github/workflows/deploy.yml`: push-to-`main` trigger, `withastro/action@v6`, `actions/deploy-pages@v5`.
- `public/CNAME` = `cohomolo.gy`; `public/robots.txt` present; `public/favicon.svg` present and does contain a dark rounded-square background with a serif **∂** glyph — documented as fact, not assumed.
- `src/site.config.ts`, `src/content.config.ts` (schemas for posts/notes/projects/talks/about, confirms `z.url()` on project/talk URL fields and the note schema as `postSchema.omit({lede, toc})`), `src/content/posts/_template.md`, `src/content/notes/_template.md`, `src/content/projects.yaml`, `src/content/talks.yaml` (both empty `[]` with a commented example each — used as the basis for the YAML examples in WRITING.md), `src/lib/url.ts` (confirms trailing-slash normalisation and how `href()`/`absolute()` work), `src/lib/format.ts`, `src/lib/content.ts` (confirms drafts are filtered by `import.meta.env.DEV`).
- `src/styles/tokens.css` is currently a one-line stub comment; `src/styles/global.css` has only a box-sizing reset, `color-scheme: dark light`, and a body margin reset — no `.container`/`.prose`/`.label`/`.hairline` utilities and no `@media` rules yet; `src/styles/prose.css` does not exist yet.
- `src/components/` and `src/layouts/` do not exist yet. `src/pages/` currently has only `index.astro` (a minimal page, no `<Constellation/>` present yet). `scripts/og-default.mjs` does not exist yet (only `check-links.mjs` and `new.mjs` are present), even though `package.json` already references it as the `og:default` script.
- `scripts/check-links.mjs` and `scripts/new.mjs` read in full for their usage text and behaviour (slug derivation, template copy, draft/date field-setting).

## Assumed from contracts (integration must re-verify)

These are stated as fact in the docs per the brief's instruction, backed by the plan's frozen facts, but the underlying files/components did not exist on `main` at read time:

1. **Routes** — the full route list (`/posts/`, `/notes/`, `/tags/`, etc.) is taken verbatim from the frozen facts; only `/` exists as a real route today.
2. **Components** — `Header`, `Footer`, `ThemeToggle`, `PostList`, `TagList`, `FormattedDate`, `TableOfContents`, `Callout`, `Figure`, `Constellation`, `SectionHeading`, `ProjectCard`, `TalkItem` and both layouts (`BaseLayout.astro`, `ArticleLayout.astro`) are documented as existing; `src/components/` and `src/layouts/` do not exist yet.
3. **Theme toggle mechanism** — the frozen facts only say it "stores `theme` in `localStorage`." STYLING.md additionally states it sets a `data-theme` attribute on the root element; that specific mechanism is my inference from the `:root[data-theme='light']` selector named in the frozen facts, not itself a frozen fact. Verify against the actual `ThemeToggle` component once built.
4. ~~**`Callout` kinds/props and `Figure` props`**~~ — **Resolved in fix round 2.** The team lead supplied the frozen `c-components` contract; `docs/WRITING.md` now documents the real props (`Callout`: `kind?: 'note'|'idea'|'warn'|'math'|'aside'` default `note`, optional `title`, default slot; `Figure`: `src: ImageMetadata | string`, `alt`, optional `caption`, optional `width`) with no hedge. Integration should still confirm `src/components/Callout.astro` and `Figure.astro`, once written, match this contract exactly (colours per kind, slot behaviour for a string vs. imported `src`).
5. **`prose.css` responsibilities** (STYLING.md) — described generically (heading rhythm, measure, blockquotes, tables, code, links) since the file does not exist yet; no specific rule was available to confirm against.
6. **Responsive breakpoints** — per the brief's explicit fallback instruction, since `global.css`/`prose.css` have no `@media` rules yet, STYLING.md says "see the `@media` rules in `global.css` and `prose.css`" rather than naming a breakpoint value.
7. **Token groups** (STYLING.md) — **Updated in fix round 2** to name the actual custom properties from the frozen tokens contract the team lead supplied (colour, typography, layout, spacing, shape/motion groups — full list in `docs/STYLING.md`). `src/styles/tokens.css` is still only a comment stub on `main` as of this writing, so integration should confirm the design package's `tokens.css` defines exactly these names (and no others it should also mention) once it lands.
8. **RSS feed contents and OG image contents** (WRITING.md) — described generically (title/description/link/date for the feed; title and site look for the OG card) based on the schema fields and the frozen fact that OG images are generated by satori at `src/pages/og/…`; neither the feed route nor the OG page templates exist yet, so the actual rendered content should be checked once built.
9. **About page** — `src/content/pages/about.md` is documented as the file to edit; it does not exist on `main` yet (content work in progress), but the collection loader/schema in `content.config.ts` (real, on `main`) requires exactly that path.
10. **`og-default.mjs`** — `npm run og:default` is documented per `package.json` (which is real and merged); the script file itself does not exist on `main` yet.

## GitHub Pages IPs (docs/DEPLOY.md)

Fetched 2026-09-03 from https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site:

- A: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- AAAA: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`

## Verify output

```
=== file existence ===
OK exit 0
=== AI mention grep ===
OK exit 0
=== prettier check ===
Checking formatting...
All matched files use Prettier code style!
OK exit 0
=== script cross-check ===
ok: build
ok: check
ok: dev
ok: lint:links
ok: new:note
ok: new:post
ok: og:default
ok: verify
=== git status scope check ===
exit code of grep (expect 1/no output): 1
```

`git status --porcelain` before commit showed only `.github/dependabot.yml`, `README.md`, `docs/` as untracked — nothing outside scope.
