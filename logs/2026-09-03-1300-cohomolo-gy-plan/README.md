# cohomolo.gy — Plan

**Created**: 2026-09-03
**Status**: Complete
**Intake**: `../2026-09-03-1300-cohomolo-gy-intake/brief.md`

## Problem Statement

The domain `cohomolo.gy` is dead and Emily has no home for her writing. Build a
writing-first static site whose two ergonomic priorities are adding an entry and
editing the styling, with a design that reads as future-facing, functional, and a
little mystical while keeping the joy of discovery. [D-1, D-13]

## Goals

- Drop-a-file publishing for posts and notes; edit-a-YAML for projects and talks. [D-7]
- One CSS file of tokens controls the whole look; one TS file controls identity. [c-design-tokens, c-site-config]
- Math and code render at build time with zero client JavaScript beyond the theme toggle. [D-9, D-16]
- Deploys itself from `main` to GitHub Pages at the custom domain. [C-3]
- Documentation that lets the six-months-later maintainer act without re-learning Astro. [D-12]

## Non-Goals

Search, comments, analytics, newsletter, CMS, i18n, AI attribution of any kind. [D-3, D-4]

## Constraints

- **Tech**: Astro 7.3.x, Node ≥ 22.12, `@astrojs/markdown-remark` unified processor. [C-1, C-2, D-14]
- **Hosting**: GitHub Pages via Actions; `public/CNAME`. [C-3]
- **Location**: `~/haskell/site`. [D-5]
- **Timeline**: none.

## Users

| User Type | Access Method | Primary Flow |
| --------- | ------------- | ------------ |
| Reader | browser, RSS | read a post; follow a tag; find Emily's projects |
| Author | editor + `npm run dev` | `npm run new:post`, write, flip `draft: false`, push |
| Maintainer | npm | `npm outdated`, bump, `npm run verify` |

## Success Criteria

- [ ] `npm run verify` exits 0 (check + build + link lint). [C-4]
- [ ] Every path in `c-routes` exists in `dist/`.
- [ ] Lighthouse mobile ≥ 95 across categories on `/` and `/posts/kitchen-sink/`.
- [ ] Screenshot pass in both themes approved by Emily.

## Files

| File | Purpose |
| ---- | ------- |
| `registry.md` | every decision / constant / gate, ID'd |
| `contracts.yaml` | frozen interfaces between packages |
| `architecture.yaml` / `architecture.md` | components and connections |
| `packages.yaml` / `packages.md` | work DAG |
| `briefs/p*.md` | self-contained agent briefs |
| `STATUS.md` | campaign state |
| `agent-logs/p*/` | durable logs from each package |
