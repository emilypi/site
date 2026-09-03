# Requirements Brief: cohomolo-gy

Intake: `logs/2026-09-03-1300-cohomolo-gy-intake/` · Coverage: 11 covered, 1 n-a, 0 blocked ·
Open questions: 0

This brief is **self-contained**. Downstream skills must not need the
intake directory — values are inlined with their registry IDs. The
registry remains the editing source.

## Discovery

1. **What are we building?** A writing-first personal blog and homepage for
   Emily Pillmore at `https://cohomolo.gy`, built as a static site. [D-1]
2. **Who uses it, and how?** Readers arrive via links/RSS on any device;
   Emily authors by dropping Markdown files into a collection and editing
   plain CSS tokens. [D-2]
3. **What is explicitly OUT of scope?** Search, comments, analytics,
   newsletter, CMS, i18n, any AI-authorship attribution. [D-3, D-4]
4. **What constraints exist?** Astro 7 on Node ≥22.12, deployed to GitHub
   Pages via Actions with a CNAME, repo at `~/haskell/site`, no deadline.
   [C-1, C-2, C-3, D-5]
5. **How will we know it's done?** `npm run build` and `npm run check` exit 0;
   every route in the route table renders; feed and sitemap validate; no
   broken internal links; Lighthouse ≥ 95 on performance/a11y/SEO for the
   homepage and a post. [C-4]
6. **Who builds it?** Orchestrated: a coordinated agent team, Emily commits. [D-6]

## Problem

The domain `cohomolo.gy` has a dead A record (connection refused on 443)
and Emily has no place of her own to write. The cost of inaction is a dead
personal domain and writing that goes unpublished or scattered.

**Premise check**: asked whether the site is a blog, a landing page, a
digital garden, or a research-org hub. Emily chose writing-first blog +
homepage. [D-1]

## Users

| Class | Reach | Scale | Sophistication |
| ----- | ----- | ----- | -------------- |
| Readers | Direct links, RSS, search engines | Low hundreds/day at most | Technical; expect code + math to render |
| Emily (author) | Editor + `npm run dev`, commits to GitHub | Weekly-ish | Expert; wants zero ceremony to add an entry |
| Emily (maintainer, 6 months out) | Dependabot / `npm outdated` | Quarterly | Wants upgrades to be boring |

## Scope

**In scope:**

- Collections: posts (long-form), notes (short-form), projects (data), talks & papers (data); an About page [D-7]
- RSS/Atom feed, sitemap, per-post Open Graph images [D-8]
- KaTeX math and Shiki code highlighting with Haskell/Lean/Rust/Python/OCaml/Agda grammars, dual light/dark [D-9]
- Dark-first theme with light mode and a persisted toggle [D-10]
- Seed content: two draft posts in Emily's voice + one kitchen-sink demo post [D-11]
- README plus writing, styling, and deployment docs [D-12]
- Design direction: futurist / functional-programming / mysticism, with the joy of discovery [D-13]

**Explicitly out of scope:** [D-3]

- Client-side search (Pagefind or otherwise)
- Comments (giscus etc.)
- Analytics of any kind
- Newsletter / email capture
- A CMS or admin UI
- Internationalisation
- Any byline, footer, or metadata naming an AI tool as author or contributor [D-4]

**First to be cut under pressure**: OG image generation, then the notes collection.

## Current State and Prior Attempts

- `https://cohomolo.gy` → A 104.37.178.1, connection refused. Nothing to migrate.
- `~/haskell/resume` is an unrelated Parcel + LaTeX résumé (remote `andgate/resume`); not a site.
- No `*.github.io` or `site` repo exists under `emilypi` or `cohomolo-gy` (checked 2026-09-03).
- Existing static-site generators installed: none (no hugo/zola). Node 24.20.0 and npm 11.19.0 present via mise.

## Constraints

| Constraint | Value | Source |
| ---------- | ----- | ------ |
| Generator | Astro 7.3.x | [C-1] |
| Node | ≥ 22.12 (use 24 via `.nvmrc`) | [C-2] |
| Hosting | GitHub Pages via Actions, `public/CNAME` = `cohomolo.gy` | [C-3] |
| Repo location | `~/haskell/site` | [D-5] |
| Markdown pipeline | `@astrojs/markdown-remark` `unified()` processor (remark-math + rehype-katex) | [D-14] |

## Interfaces

- GitHub Pages: consumes `dist/` via `withastro/action@v6` + `actions/deploy-pages@v5`. Emily owns the repo settings.
- DNS at the registrar: Emily must point A/AAAA records at GitHub Pages; documented in `docs/DEPLOY.md`.

## Data

n-a: no data is stored, moved, or derived beyond the site's own content. The theme preference lives in `localStorage` only.

## Failure and Blast Radius

A broken deploy leaves the previous deploy live (Pages is atomic). Rollback is `git revert` + push. No data to lose. Acceptable downtime: days.

## Definition of Done

```bash
npm run check            # expect: exit 0
npm run build            # expect: exit 0; dist/ contains every route in c-routes
npm run lint:links       # expect: exit 0 (no broken internal links in dist/)
```

Plus a human pass over screenshots of `/`, `/posts/<demo>`, `/about` in both themes.

## Operations

Owner: Emily. Upgrades: `npm outdated` → bump → `npm run build`. Dependabot config included. No monitoring.

## Timeline

No deadline. Nothing forces a date.

## Decision Authority

Emily approves and vetoes. No other stakeholders. Nothing promised to anyone.

## Open Questions

None routed. Two facts were resolved by grounding during intake (Astro 7 markdown pipeline, GitHub Pages workflow versions) and recorded as D-14 / C-3.

## Gates Needing a Human Answer

None blocking. See §Assumptions for defaults chosen where Emily was silent.

## Assumptions

- LICENSE: none committed; Emily chooses code/content licences before publishing. If wrong: a file to add.
- Fonts are self-hosted via `@fontsource` packages (no third-party font CDN). If Emily prefers system fonts: delete two imports.
- No client-side page transitions (`ClientRouter`); the only JS is the theme toggle. If wrong: add `<ClientRouter />` and rerun scripts on `astro:after-swap`.
- Notes and posts share one RSS feed at `/rss.xml`; posts only would be a one-line filter.

## Coverage Gaps

None. `data` is n-a with reason.

## Handoff

- **→ `/planning`**: no unknowns require grounding; brief-driven mode starts from §Discovery.
