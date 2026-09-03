# p4 — Section pages and routes

Branch `pkg/p4` from `main` @ `28ad2f5`. Worktree `/Users/emilypillmore/haskell/.site-worktrees/p4`.

Two commits:

| SHA | Subject |
| --- | --- |
| `be641b0` | Add section pages, entry routes, and 404 |
| `62a8af0` | Omit canonical link on noindex pages — scope extension, see below |

Both are now on `main` via merge commit `98206a7`. The orchestrator then applied the About fix
itself as `7193ffa` and removed the worktree, so `main` is at `7193ffa` and branch `pkg/p4` is gone.
The final verification below was re-run against merged `main`, not against the branch.

## Pages built

| Route | File | Notes |
| --- | --- | --- |
| `/posts/` | `src/pages/posts/index.astro` | Year groups, newest first, `PostList showDescription`. Empty state: "Nothing here yet." in `.prose`. |
| `/posts/<id>/` | `src/pages/posts/[...id].astro` | `getStaticPaths` over `getPublishedPosts()`; `prev` = newer, `next` = older. |
| `/notes/` | `src/pages/notes/index.astro` | Flat list; year grouping only above 12 notes (`GROUPING_THRESHOLD`). No descriptions. |
| `/notes/<id>/` | `src/pages/notes/[...id].astro` | As posts, `collection="notes"`. |
| `/tags/` | `src/pages/tags/index.astro` | Flowing `#tag` + count, count desc then name (order comes from `getAllTags`). |
| `/tags/<tag>/` | `src/pages/tags/[tag].astro` | Posts then notes, each under a `SectionHeading`. |
| `/projects/` | `src/pages/projects/index.astro` | Groups active → wip → maintained → archived; empty groups skipped; `repeat(auto-fill, minmax(18rem, 1fr))`. |
| `/talks/` | `src/pages/talks/index.astro` | Date desc, grouped by year, `<ol>` of `TalkItem`. |
| `/about/` | `src/pages/about/index.astro` | `.container--narrow`, `<Content />` in `.prose`, then `§ elsewhere`. |
| `/404` | `src/pages/404.astro` | `noindex`, centred, one joke. |

All pages: top element is `.container` (or `.container--narrow`), padding `var(--space-12)` top and
`var(--space-24)` bottom, `description` passed to `BaseLayout`, every scoped style token-only apart
from `1px` hairlines and `ch`/`rem` measures already used by the design system.

## Decisions

**Index pages get a real `<h1>`, not `SectionHeading title=`.** The route table suggested
`SectionHeading label title`, but `SectionHeading` renders an `<h2>`, which would leave every index
page without an `<h1>` and with a document outline starting at level 2. Each index page instead
carries a small scoped header — `<p class="label">§ …</p>`, `<h1>` in the display face, italic intro —
that mirrors `.article-header` in `ArticleLayout`. `SectionHeading` is still used where it is
genuinely a section within a page: the `§ writing` / `§ notes` blocks on a tag page, the status
groups on `/projects/`, and `§ elsewhere` on `/about/`.

**Years are read with `getUTCFullYear`.** `formatDate` formats in UTC, so a post dated `2026-01-01`
must file under 2026 regardless of the builder's timezone. Local-time grouping would put it in 2025
west of Greenwich.

**Tag routes are keyed on the slug.** `getStaticPaths` matches entries with
`slugifyTag(tag) === slug`, the same function `TagList` uses to write its hrefs, so the two agree by
construction. A `Map` keyed by slug also means two tags that slugify alike take one route rather than
crashing the build on a duplicate path. The schema regex makes that unreachable today.

**`/about/` excludes the RSS link from `§ elsewhere`.** The feed is already in the masthead and the
footer, and `§ elsewhere` is for places that are Emily rather than the site.

## Component gaps

None blocking. Two notes for whoever owns the design system:

- `SectionHeading` has no heading-level control, so it cannot serve as a page title. See the decision
  above.
- No component owns "index page header" (label + h1 + intro). The same ~25 lines of scoped CSS are
  repeated across five index pages. A `PageHeader` component would absorb it, but components are out
  of p4's scope.

## Cross-package issues

### 1. `404.html → /404/` — FIXED in `62a8af0` (contract-adjacent change to c-components)

Scope for this one change was extended by the orchestrator after the diagnosis below was reported.
`src/layouts/BaseLayout.astro` now reads:

```astro
{/* A page kept out of the index has no canonical URL to advertise. */}
{!noindex && <link rel="canonical" href={canonical} />}
```

This touches `BaseLayout`, which p4 otherwise only consumes. It changes no prop and no other
package's call sites: `BaseLayout`'s `Props` is unchanged, and the only page passing `noindex` is
`src/pages/404.astro`. Verified after the change: `dist/404.html` carries zero canonical tags and
still carries `<meta name="robots" content="noindex">`; `dist/posts/index.html` still carries
`<link rel="canonical" href="https://cohomolo.gy/posts/">`. `lint:links` is now clean at
12 pages, 192 links.

The `og:url` meta on the 404 page still holds `/404/`. It was left alone deliberately: the approved
change was the canonical link only, `check-links.mjs` does not extract `og:url`, and Open Graph
consumers want the URL a share resolves to rather than a file path.

Original diagnosis:

`BaseLayout` emits `<link rel="canonical" href={absolute(Astro.url.pathname)}>` on every page. For
the 404 route `Astro.url.pathname` is `/404/` because `astro.config.mjs` sets
`trailingSlash: 'always'`, but Astro writes the file to `dist/404.html`, not `dist/404/index.html`.
`check-links.mjs` resolves same-origin absolute URLs against the filesystem, so `/404/` finds no
file. Any `404.astro` built on `BaseLayout` hits this; it is not caused by this package's markup or
by the `noindex` prop.

The page itself behaves correctly. Served from `astro preview`:

```
/404                   -> 404  Astro's built-in "trailingSlash is set to always" page
/404/                  -> 200  our page
/nope                  -> 404  Astro's built-in page
/nope/                 -> 404  our page
/posts/does-not-exist/ -> 404  our page
```

Real not-found URLs get our page. Only the literal `/404` without a trailing slash is rejected, by
the preview server's trailing-slash rule, and static hosts serve `dist/404.html` directly anyway.

Two one-line fixes were offered:

1. `src/layouts/BaseLayout.astro` — skip the canonical when `noindex` is set. Correct on its own
   merits: a noindex error page should not advertise a canonical URL.
   `{!noindex && <link rel="canonical" href={canonical} />}`
2. `scripts/check-links.mjs` — ignore `rel="canonical"` targets, which are metadata rather than
   navigable links.

The orchestrator approved 1 and extended p4's scope to that one file. Applied in `62a8af0`.

### 2. `/about/` shows the same link list twice — FIXED in `7193ffa` (on `main`)

The orchestrator approved removing the trailing list from `src/content/pages/about.md` and applied it
themselves in `7193ffa` while merging `pkg/p4` (merge commit `98206a7`), so p4 never committed this
change. The commit drops the eight lines from "Where to find me:" through the email bullet and keeps
the closing `<!-- TODO(emily): ... -->` comment. `§ elsewhere`, built from `SITE.links`, is now the
only link list on the page; `about.png` in this directory was re-taken from merged `main` and shows
it once.

One consequence worth recording: the prose list carried annotations the `SITE.links` version does not
— the `emilypi` handle, `topos`, and "the research org" beside `cohomolo-gy`. Those no longer appear
anywhere on the page. Restoring them would mean either annotating `SITE.links` or reinstating a
shorter prose line; neither is p4's call.

Original diagnosis:

`src/content/pages/about.md` ends with a "Where to find me:" list — GitHub, cohomolo-gy, Hackage,
LinkedIn, email — and the brief also specifies a `§ elsewhere` list built from `SITE.links`. They
carry identical entries, so the rendered page repeats itself; visible in `about.png`. The brief was
followed rather than silently narrowed, so the section is present.

Resolution needed a decision the orchestrator owns, since it spans two packages:

- Keep the page section and drop the trailing list from `about.md` (p3's file). `SITE.links` is the
  single source of truth and cannot drift. **Recommended, and the one taken.**
- Or keep the prose list, which is richer (handles, "the research org"), and delete `§ elsewhere`
  from `src/pages/about/index.astro`. One-line change, inside p4's scope.

## Draft exclusion check

```bash
for f in src/content/posts/*.md src/content/posts/*.mdx src/content/notes/*.md; do
  base=$(basename "$f"); id="${base%.*}"
  case "$id" in _*) continue;; esac
  coll=$(basename "$(dirname "$f")")
  if grep -qE '^draft:[[:space:]]*true' "$f"; then
    [ -d "dist/$coll/$id" ] && echo "FAIL draft routed: $coll/$id" || echo "ok   draft excluded: $coll/$id"
  else
    [ -f "dist/$coll/$id/index.html" ] && echo "ok   published routed: $coll/$id" || echo "FAIL published missing: $coll/$id"
  fi
done
```

```
ok   draft excluded: posts/bellman-fixed-points
ok   draft excluded: posts/why-cohomolo-gy
ok   published routed: posts/kitchen-sink
ok   draft excluded: notes/boundary-of-a-boundary
ok   published routed: notes/what-notes-are-for
```

All three drafts are absent from the production build. `getPublishedPosts` / `getPublishedNotes`
filter on `isPublished`, which is `import.meta.env.DEV || !draft`, so drafts route under
`astro dev` only.

## Verification

| Command | Result |
| --- | --- |
| `npm run check` | pass — 44 files, 0 errors, 0 warnings, 0 hints |
| `npm run build` | pass — 12 pages in 2.18s |
| `test -f dist/{posts,notes,tags,projects,talks,about}/index.html` | pass — all six |
| `test -f dist/404.html` | pass |
| `test -f dist/posts/kitchen-sink/index.html` | pass |
| `test -f dist/tags/{meta,typesetting}/index.html` | pass — every tag on a published entry |
| draft exclusion loop | pass — 3 drafts unrouted, 2 published routed |
| `npm run lint:links` | pass — 12 pages, 192 links, 0 broken. Was 12 broken on `main` |
| `npx prettier --check` on pages + `BaseLayout` | pass |
| `git status --porcelain \| grep -vE '<scope>'` | pass — no output; scope pattern extended to allow `src/layouts/BaseLayout.astro` |
| `dist/404.html` has no canonical, keeps `robots: noindex` | pass |
| `dist/posts/index.html` still has its canonical | pass |

| `/about/` renders one link list, not two | pass — zero "Where to find me", one `§ elsewhere` |

Re-run in full against merged `main` at `7193ffa`. Every row above reflects the final tree, including
both approved fixes, not the first commit. `dist/` and `node_modules/` are gitignored, so the build
left `src/` clean.

Routes generated: `/`, `/404.html`, `/about/`, `/notes/`, `/notes/what-notes-are-for/`, `/posts/`,
`/posts/kitchen-sink/`, `/projects/`, `/tags/`, `/tags/meta/`, `/tags/typesetting/`, `/talks/`,
plus `/rss.xml` and two OG images from earlier packages.

## Screenshots

Dark, 1280 wide, full page, 2× scale, from `npm run preview`: `posts.png`, `projects.png`,
`talks.png`, `about.png`, `tags.png`, `404.png`. The 404 shot is taken at `/no-such-page/` rather
than `/404`, since that is the path a visitor actually arrives on and the one the preview server
serves our page for. `about.png` was re-taken from merged `main` after `7193ffa` and shows the
single link list; the other five are unchanged by either fix.
