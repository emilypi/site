# cohomolo.gy

Source for Emily Pillmore's site at https://cohomolo.gy — essays and notes on type theory, AI, mathematics, and the strange future.

## Quick start

```bash
nvm use          # Node >= 22.12
npm install
npm run dev       # prints a local URL — open it
```

To publish something new:

```bash
npm run new:post "Title"   # scaffolds src/content/posts/<slug>.md
# edit the file, then set draft: false
git add . && git commit -m "..." && git push   # pushing to main deploys
```

## Stack

- **Astro 7** (static output) — pages ship as plain HTML; there's no server to run or secure.
- **Markdown/MDX content collections** — posts, notes, projects, and talks live as version-controlled files, typed and validated at build time.
- **KaTeX** (via remark-math/rehype-katex) — math renders at build, so reading an equation needs no client-side JS.
- **Shiki** — code blocks get accurate, theme-aware syntax highlighting without shipping a highlighter to the browser.
- **@astrojs/rss** and **@astrojs/sitemap** — the feed and sitemap are generated from the same content collections, so they can't drift from what's actually on the site.
- **satori** — Open Graph card images render from real content at build time, not a static placeholder.
- **GitHub Pages** — free static hosting under a custom domain, with no server to keep alive.

The whole stack favours long-term maintainability over cleverness: plain CSS (no preprocessor, no utility framework), and zero client-side JavaScript except the theme toggle.

## Repository layout

```
.github/           CI workflow (deploy.yml) and Dependabot config
docs/              this documentation
logs/              planning and build records for the site; safe to ignore
public/            static files served as-is (favicon, CNAME, robots.txt)
scripts/           standalone Node scripts (new post/note, link checker, OG regen)
src/
  components/      Astro components (Header, Footer, ThemeToggle, PostList, ...)
  content/         posts, notes, projects.yaml, talks.yaml, the about page
  content.config.ts  collection schemas (the source of truth for frontmatter)
  layouts/         BaseLayout, ArticleLayout
  lib/             small pure helpers (URL normalisation, dates, content queries)
  pages/           file-based routes
  site.config.ts   site identity, nav, links
  styles/          tokens, fonts, global reset, prose typography
```

## Scripts

| Script         | Command                                                | What it does                                                         |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `dev`          | `astro dev`                                            | Local dev server with live reload; drafts are visible.               |
| `build`        | `astro build`                                          | Build the static site to `dist/`; drafts are excluded.               |
| `preview`      | `astro preview`                                        | Serve the built `dist/` locally, as it appears in production.        |
| `check`        | `astro check`                                          | Type-check `.astro` files and validate content frontmatter.          |
| `format`       | `prettier --write .`                                   | Format the whole repo.                                               |
| `format:check` | `prettier --check .`                                   | Check formatting without writing.                                    |
| `lint:links`   | `node scripts/check-links.mjs dist`                    | Crawl the built `dist/` and fail on any dangling internal link.      |
| `new:post`     | `node scripts/new.mjs post`                            | Scaffold a new post from the template and print its path.            |
| `new:note`     | `node scripts/new.mjs note`                            | Scaffold a new note from the template and print its path.            |
| `og:default`   | `node scripts/og-default.mjs`                          | Regenerate the default Open Graph image.                             |
| `verify`       | `npm run check && npm run build && npm run lint:links` | Type-check, build, and link-check in sequence — the pre-deploy gate. |

## Editing

- Writing content? Start with [`docs/WRITING.md`](docs/WRITING.md).
- Changing how the site looks? Start with [`docs/STYLING.md`](docs/STYLING.md).
- Setting up or troubleshooting hosting? Start with [`docs/DEPLOY.md`](docs/DEPLOY.md).
- Upgrading dependencies or general upkeep? See [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md).

## The one file for identity

`src/site.config.ts` holds the site's name, tagline, bio, navigation, and external links. Nothing else in the codebase should hardcode a title, URL, or handle — change it there.

## License

Proprietary. All content and code are copyright Emily Pillmore, all rights reserved; see [`LICENSE`](LICENSE) for what is and is not permitted, including the prohibition on using the writing to train machine learning models. Third-party fonts and libraries keep their own licenses.
