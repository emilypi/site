# p1 — Scaffold, config, content schema, CI

Date: 2026-09-03 · Working directory: `/Users/emilypillmore/haskell/site` · Author: Emily Pillmore

Astro 7 project scaffolded from an empty directory (only `logs/` was present). Every
contract in the brief is implemented; three deviations are recorded below, one of them
forced by a hard tooling incompatibility.

## Installed versions

`npm ls --depth=0` (clean tree, no unmet or forced peer dependencies):

```
cohomolo.gy@0.1.0 /Users/emilypillmore/haskell/site
├── @astrojs/check@0.9.10
├── @astrojs/markdown-remark@7.3.0
├── @astrojs/mdx@8.0.0
├── @astrojs/rss@4.0.19
├── @astrojs/sitemap@3.7.4
├── @fontsource-variable/inter@5.3.0
├── @fontsource-variable/jetbrains-mono@5.3.0
├── @fontsource-variable/newsreader@5.3.0
├── astro@7.3.1
├── katex@0.18.5
├── prettier-plugin-astro@0.14.1
├── prettier@3.9.6
├── rehype-autolink-headings@7.1.0
├── rehype-katex@7.0.1
├── rehype-slug@6.0.0
├── remark-math@6.0.0
├── sharp@0.35.4
└── typescript@6.0.3
```

Toolchain: Node 24.20.0, npm 11.19.0.

## API shapes verified against installed `.d.ts` files

The brief required checking Astro 7 API shapes on disk rather than from memory. What was
read and what it confirmed:

| Claim | File read | Result |
| --- | --- | --- |
| `unified` is exported from `@astrojs/markdown-remark` | `node_modules/@astrojs/markdown-remark/dist/index.d.ts:19` | Confirmed: `export { isUnifiedProcessor, type UnifiedProcessorOptions, type UnifiedResolvedOptions, unified } from './processor.js'` |
| `unified()` option shape | `node_modules/@astrojs/markdown-remark/dist/processor.d.ts:2-12` | Confirmed: `remarkPlugins`, `rehypePlugins`, `remarkRehype`, `recmaPlugins`, `gfm`, `smartypants`. Signature is `unified(opts?): MarkdownProcessor<UnifiedResolvedOptions>` |
| `gfm` / `smartypants` defaults | same file, doc comments on lines 8-11 | Both default to `true`. Set explicitly anyway so the pipeline does not silently change if a future default flips |
| `markdown.processor` is a valid top-level key | `node_modules/astro/dist/types/public/config.d.ts:2548` | Confirmed: `processor?: MarkdownProcessor` |
| `shikiConfig` / `syntaxHighlight` remain top-level | same file, lines 2323 and 2350 | Confirmed |
| `remarkPlugins`/`rehypePlugins`/`gfm`/`smartypants` are deprecated at top level | same file, lines 2397, 2420, 2445, 2469 | Confirmed deprecated, each pointing at `markdown.processor`. None used |
| `ShikiConfig.defaultColor` accepts `false` | `node_modules/@astrojs/internal-helpers/dist/markdown.d.ts:18` | Confirmed: `defaultColor?: 'light' \| 'dark' \| string \| false` |
| Content-layer loaders | `node_modules/astro/dist/content/loaders/index.d.ts:1-2` | Confirmed: `export { file }`, `export { glob }` |
| `astro/zod` exposes both `z.url()` and `z.string().url()` | runtime probe via `node --input-type=module` | Both are functions. Chose `z.url()` (see deviation 2) |
| Fontsource entry points | `ls node_modules/@fontsource-variable/*/` | `index.css` on all three uses the `wght` axis, so the italic companion is `wght-italic.css`, not `standard-italic.css`. Families: `Newsreader Variable`, `Inter Variable`, `JetBrains Mono Variable` |
| `withastro/action@v6` inputs | `curl -s https://raw.githubusercontent.com/withastro/action/v6/action.yml` | `node-version` (default `24`) and `package-manager` both exist. Both passed explicitly |

## Markdown pipeline probe

Wrote a temporary `src/pages/probe.md` containing display math, inline math, a `haskell`
fence, a footnote, and a table; built; grepped `dist/probe/index.html`; deleted the probe
and rebuilt. Marker counts in the built HTML:

| Marker | Occurrences | Proves |
| --- | --- | --- |
| `katex-display` | 1 | remark-math + rehype-katex, display mode |
| `class="katex"` | 4 | KaTeX rendering (display, inline, two in the table) |
| `astro-code` | 2 | Shiki highlighting is active |
| `--shiki-light` | 12 | Dual-theme CSS variables emitted |
| `--shiki-dark` | 12 | Dual-theme CSS variables emitted |
| `data-footnotes` | 1 | GFM footnote section |
| `data-footnote-ref` | 1 | GFM footnote reference |
| `<table>` | 1 | GFM tables |
| `heading-anchor` | 2 | rehype-slug + rehype-autolink-headings |

The `<pre>` carries only custom properties and no literal `color`, which is what
`defaultColor: false` is for and what p2 needs to switch themes by `[data-theme]`:

```html
<pre class="astro-code astro-code-themes github-light github-dark-dimmed"
     style="--shiki-light:#24292e;--shiki-dark:#adbac7;--shiki-light-bg:#fff;--shiki-dark-bg:#22272e; overflow-x: auto;"
     tabindex="0" data-language="haskell">
```

Full excerpt saved to `probe-excerpt.html` beside this log. `src/pages/probe.md` was
deleted and the site rebuilt; `dist/` now contains only `index.html`, `CNAME`,
`favicon.svg`, `robots.txt`, `sitemap-0.xml`, `sitemap-index.xml`, and `_astro/`.

### Finding for content authors (p3)

**`$$...$$` on a single line renders as inline math, not display math.** With
remark-math 6 the display form must be fenced across three lines:

```markdown
$$
\int_M d\omega = \int_{\partial M} \omega
$$
```

The single-line form was tried first and produced `<p><span class="katex">` with no
`katex-display` wrapper and no `display="block"` on the `<math>` element. Both templates
should be read with this in mind when math-heavy content is written.

## YAML file loader verified

The brief asked for proof that `file()` parses YAML. With `projects.yaml` and
`talks.yaml` holding `[]`, `astro check` emits `[file-loader] No items found`. A dummy
item was added to each, and both warnings disappeared with 0 errors, confirming the YAML
parsed and validated against the schemas including `z.url()` and `z.coerce.date()`. The
generated `.astro/collections/projects.schema.json` renders `url` as
`{"type":"string","format":"uri"}`. The dummy items were then reverted to `[]`.

## Contract deviations

### 1. TypeScript 6.0.3 instead of 7.0.2 (forced)

The brief specified `typescript 7.0.2`. It is incompatible with `astro check`, which the
brief also requires to exit 0. Two failures, in order:

`npm install @astrojs/check@0.9.10 typescript@7.0.2` fails outright on peers:

```
npm error Could not resolve dependency:
npm error peer typescript@"^5.0.0 || ^6.0.0" from @astrojs/check@0.9.10
```

Forcing it through with `--legacy-peer-deps` installs, but `astro check` then refuses to
run:

```
The TypeScript module loaded (found 7.0.2) does not expose the programmatic API that
`astro check` relies on. TypeScript's native compiler (7.0 and later) does not ship this
API yet. Until it does, run `astro check` with a TypeScript version that still provides
it (6.x). See https://github.com/withastro/roadmap/discussions/1321 to track support.
```

`@astrojs/check@0.9.10` is the latest published version and its peer range is still
`^5.0.0 || ^6.0.0`, so no newer release resolves this. TypeScript 7 is the native-port
compiler and has not yet shipped the language-service API the checker needs.

Resolution: `node_modules` and `package-lock.json` were deleted and reinstalled clean at
`typescript@^6.0.3`, the latest 6.x. This matters beyond local convenience. A lockfile
built with `--legacy-peer-deps` records a peer violation that CI's plain `npm install`
would have to reproduce, so the forced tree was not kept. The dependency graph now has no
unmet peers.

Revisit when `@astrojs/check` publishes a release accepting `typescript@^7`.

### 2. `z.url()` instead of `z.string().url()`

The frozen schema in the brief wrote `z.string().url()`; the brief also granted latitude
to use whichever form `astro check` accepts without deprecation errors. Astro 7 ships
Zod 4, where the string method is deprecated in favour of the top-level `z.url()`. The
top-level form is used for `projects.url`, `projects.repo`, `talks.url`, `talks.slides`,
and `talks.video`.

This is not a behavioural change. Both validate a string as a URL, both infer as
`string`, and both emit `{"type":"string","format":"uri"}` in the generated JSON schema,
so downstream packages consuming these collections see an identical type. `astro check`
reports 0 errors, 0 warnings, 0 hints.

### 3. `agda` dropped from `shikiConfig.langs`

The brief listed `agda`. Shiki does not bundle a grammar for it and the build fails hard
at highlighter construction, before any page renders:

```
ShikiError: Language `agda` is not included in this bundle.
You may want to load it from external source.
```

A runtime probe of `bundledLanguages` confirmed every other requested language resolves;
`agda` was the only miss, and `lean4` is present. It is removed from the list with a
comment in `astro.config.mjs` recording why. Agda fences fall back to plain text rather
than breaking the build. Adding it later means passing a custom TextMate grammar object
into `langs` rather than a string.

## Other decisions worth recording

- **`gfm` and `smartypants` set explicitly to `true`** in `unified()`. They already
  default to true, but footnotes and tables depend on GFM, and pinning them means a
  future default change cannot silently strip features the probe just proved work.
- **`src/env.d.ts` kept** with `/// <reference types="astro/client" />`. `astro check`
  passes with it present, and it costs one line to guarantee `import.meta.env` typing for
  the five agents fanning out from this commit.
- **`favicon.svg` uses `dominant-baseline="central"`** for vertical centring of the `∂`
  glyph, since `<text>` has no box to centre within. p2 may refine the mark.
- **`scripts/check-links.mjs` counts links after filtering.** The `ok: N pages, M links`
  line reports only site-relative targets actually checked, not every attribute in the
  HTML.
- **`.gitignore` carries `*.log`** as specified, which does not match the `.md` files
  under `logs/`. `logs/` is committed as required.

## Test-first evidence

The brief required the link checker's self-test to be written before its main path. The
first version of `scripts/check-links.mjs` contained the self-test and a `checkDist` that
threw `not implemented`:

```
$ node scripts/check-links.mjs --self-test
Error: not implemented
    at checkDist (file:///Users/emilypillmore/haskell/site/scripts/check-links.mjs:10:9)
EXIT=1
```

The checker was then implemented against it:

```
$ node scripts/check-links.mjs --self-test
ok: 2 pages, 1 links
index.html → /nowhere/
1 broken link(s)
self-test ok
EXIT=0
```

The two interleaved lines are the fixtures reporting as they are checked: the clean
fixture passes, the dangling one is caught and prints its miss.

`scripts/new.mjs` was exercised manually. It fills the title and today's date, leaves
`draft: true`, prints the path, and exits 1 on a name collision rather than overwriting:

```
$ node scripts/new.mjs post "Optics from First Principles"
/Users/emilypillmore/haskell/site/src/content/posts/optics-from-first-principles.md
$ node scripts/new.mjs post "Optics from First Principles"
refusing to overwrite .../optics-from-first-principles.md          # EXIT=1
```

Both generated files were deleted; only `_template.md` remains in each collection.

## Final verification

| Command | Exit | Output |
| --- | --- | --- |
| `npm run check` | 0 | `Result (11 files): 0 errors, 0 warnings, 0 hints` |
| `npm run build` | 0 | `1 page(s) built`, `sitemap-index.xml created at dist` |
| `node scripts/check-links.mjs --self-test` | 0 | `self-test ok` |
| `npm run lint:links` | 0 | `ok: 1 pages, 2 links` |
| `npm run format:check` | 0 | `All matched files use Prettier code style!` |
| `test -f public/CNAME && grep -qx 'cohomolo.gy' public/CNAME` | 0 | — |

`npm run verify` chains check, build, and lint:links. The `og:default` script points at
`scripts/og-default.mjs`, which p6 will add; it is expected to fail until then and is not
part of `verify`.

## Git

Repository initialised on `main` with repo-local identity `Emily Pillmore
<emilypi@cohomolo.gy>`. One commit, `Scaffold Astro site for cohomolo.gy`, including
`logs/`. No trailers.
