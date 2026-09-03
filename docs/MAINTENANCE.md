# Maintenance

## Upgrading dependencies

```bash
npm outdated
npx @astrojs/upgrade
npm run verify
```

`npx @astrojs/upgrade` upgrades Astro and its first-party integrations (`@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, `@astrojs/check`) together, since they're versioned as a set. `npm run verify` then runs `check` (type-checks `.astro` files and validates content frontmatter against the collection schemas), `build` (builds the full site, which surfaces template and schema errors that `check` alone can miss), and `lint:links` (crawls the build output for dangling internal links). All three must pass before pushing an upgrade.

## Dependabot

`.github/dependabot.yml` runs monthly for both the `npm` and `github-actions` ecosystems, grouping minor and patch updates into a single pull request per ecosystem so routine bumps don't create a flood of individual PRs. Major-version bumps still arrive as their own PR.

## The Markdown pipeline

Astro 7 processes Markdown and MDX through `@astrojs/markdown-remark`'s `unified()` processor, configured in `astro.config.mjs` under `markdown.processor` (remark/rehype plugins, GFM, smartypants) and `markdown.shikiConfig` (syntax highlighting). If a future Astro major changes how the processor is wired, `markdown.processor` in `astro.config.mjs` is the place to look first.

## Adding a language to Shiki

Add the language's Shiki identifier to `markdown.shikiConfig.langs` in `astro.config.mjs`. `agda` is a known gap: it isn't in Shiki's bundled grammar set, so `agda`-fenced code currently falls back to plain text. Adding real Agda highlighting needs a custom TextMate grammar object passed in the same `langs` array, not just an identifier string.

## Known sharp edges

- **TypeScript is pinned to `^6.0.3`.** `@astrojs/check` (used by `npm run check`) does not yet support TypeScript 7. Revisit this pin once `@astrojs/check` adds support.
- **Astro's compiler requires closed tags.** A void element like `<img>` or `<br>` must be self-closed (`<img />`) — an unclosed tag is a build error, not a warning.
- **`trailingSlash: 'always'`.** Every internal link must end in `/`; `src/lib/url.ts`'s `href()` helper enforces this for anything built dynamically.
- **Drafts appear in `npm run dev` only.** A post or note with `draft: true` is invisible to `npm run build`, the RSS feed, and the sitemap — if something is "missing" from the deployed site, check its `draft` flag first.

## Running the link checker

The link checker inspects the built output, so build first:

```bash
npm run build
npm run lint:links
```

(`npm run verify` does both, plus `check`, in one step.)

## Regenerating the default OG image

```bash
npm run og:default
```

This regenerates `public/og/default.png`, used as the Open Graph card for any page that isn't an individual post or note.

## Planning records

`logs/` holds the planning and build records for the site itself — design decisions, work-package briefs, and agent logs from how the site was built. It's not part of the site and is safe to ignore day to day.
