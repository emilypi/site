# p6 — RSS feed and Open Graph images

Branch `pkg/p6` off `main` at `b9f1ea7`, one commit `e6fb0e3`.
Worktree `/Users/emilypillmore/haskell/.site-worktrees/p6`.

## Dependencies added

Only `dependencies` and `devDependencies` in `package.json` were touched; no script or other field changed.

| Package                 | Version   | Where          |
| ----------------------- | --------- | -------------- |
| `satori`                | 0.33.4    | dependencies   |
| `@resvg/resvg-js`       | 2.6.2     | dependencies   |
| `markdown-it`           | 15.0.1    | dependencies   |
| `sanitize-html`         | 2.17.7    | dependencies   |
| `@types/markdown-it`    | 14.2.0    | devDependencies|
| `@types/sanitize-html`  | 2.16.1    | devDependencies|

`@astrojs/rss` 4.0.19 was already a dependency and is used as-is.

## Fonts

`src/assets/og/` holds 532 KB, against the 1.5 MB ceiling. Every file is SIL Open Font License 1.1.

| File                          | Bytes   | Source URL                                                                                                  | Licence |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| `newsreader-16pt-regular.ttf` | 121,824 | `https://raw.githubusercontent.com/productiontype/Newsreader/master/fonts/static/ttf/Newsreader16pt-Regular.ttf` | OFL 1.1 |
| `newsreader-16pt-italic.ttf`  | 131,332 | `https://raw.githubusercontent.com/productiontype/Newsreader/master/fonts/static/ttf/Newsreader16pt-Italic.ttf`  | OFL 1.1 |
| `jetbrains-mono-regular.ttf`  | 270,224 | `https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf`           | OFL 1.1 |
| `newsreader-OFL.txt`          | 4,394   | `https://raw.githubusercontent.com/productiontype/Newsreader/master/OFL.txt`                                    | —       |
| `jetbrains-mono-OFL.txt`      | 4,399   | `https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt`                                       | —       |

SHA-256:

```
0636887c9f72f77ce188f0b31029be58e65adae5a47e6d2887ad5020c2c75036  newsreader-16pt-regular.ttf
292646cbb948153511e308fa80def59959746d70114bd0936ba0a7f67a33181d  newsreader-16pt-italic.ttf
e6fd0d7e91550b3ed2b735d4312474362c4716edc4fc0577a0f61ed782d5aed1  jetbrains-mono-regular.ttf
```

### Why static instances, not variable TTFs

The first attempt used the variable fonts from `google/fonts`
(`ofl/newsreader/Newsreader[opsz,wght].ttf`, `ofl/inter/Inter[opsz,wght].ttf`,
`ofl/jetbrainsmono/JetBrainsMono[wght].ttf`). satori cannot parse them:

```
TypeError: Cannot read properties of undefined (reading '256')
    at parseFvarAxis (node_modules/@shuding/opentype.js/dist/opentype.js:10285:25)
    at Object.parseFvarTable [as parse] (…:10321:16)
```

satori 0.33.4 bundles `@shuding/opentype.js` 1.4.0-beta.0, whose `fvar` parser indexes a
name table that is not populated. Any font carrying an `fvar` table throws on load, so a
variable font is not usable here at all.

Static instances are therefore taken from upstream. Google Fonts serves only variable TTFs
for these three families, and `https://fonts.google.com/download?family=Newsreader` returns
an HTML page rather than a zip, so the files come from the type designers' repositories.

Newsreader ships static cuts at optical sizes 6, 16 and 72 pt — nothing in the 24–36 pt range
the brief suggested. The 16 pt cut is used: its stems hold up against the near-black
background, where the 72 pt hairlines thin out. The 72 pt pair was downloaded, compared, and
deleted.

Inter was dropped. The card uses only the display serif and the mono, so Inter would have
added 876 KB (variable) or ~600 KB (statics) of never-rendered bytes. JetBrains Mono covers
the Latin fallback.

Glyph coverage was checked before committing: JetBrains Mono has `∂` (U+2202) and `§`
(U+00A7), which the wordmark and the section label need. Newsreader has `§` but not `∂`;
it never renders either.

## `@astrojs/rss` item schema

Read from `node_modules/@astrojs/rss/dist/index.d.ts` (4.0.19). `RSSFeedItem` accepts:

```
link, content, title, pubDate, description, customData, categories,
author, commentsUrl, source, enclosure
```

`author` exists as a first-class property, so no `customData` is needed for it.
`src/lib/feed.ts` sets `author` to `emilypi@cohomolo.gy (Emily Pillmore)`, the
`email (Name)` form RSS 2.0 specifies. `pubDate` types as `Date` on the output side, so
`entry.data.date` passes through unchanged.

`rss()` options used: `title`, `description`, `site`, `items`, `customData`
(`<language>en</language>` from `SITE.locale`), `trailingSlash: true`.

## Feed body rendering

Markdown is rendered by `markdown-it` (`html: true`, `linkify: true`) and then sanitised by
`sanitize-html` with `defaults.allowedTags.concat(['img'])` and `src`/`alt`/`title`/`width`/
`height` allowed on `img`.

**Maths.** Maths stays as raw `$…$` and `$$…$$` source, as agreed: KaTeX output needs a
stylesheet no reader loads. A naive pass corrupts it, though — markdown-it treats `\,` as a
markdown escape and emits `$\int_0^1 x^2,dx$`. Each maths span is therefore lifted out into a
placeholder before rendering and substituted back afterwards. The substitution uses a
replacer function, not a replacement string: `$$` in a replacement string is the escape for a
literal `$`, which silently halves every display delimiter. Both bugs were caught in the
built feed and fixed.

**MDX.** `.mdx` is detected from `entry.filePath ?? entry.id`. Two passes run over the body:

- `/^[ \t]*(?:import|export)\s.*$/gm` removes ESM statements.
- `/<\/?[A-Z][A-Za-z0-9]*\b[^>]*\/?>/g` removes component tags, keeping the prose between
  them, so a `<Callout>…</Callout>` contributes its text to the feed.

If a closing component tag survives (`/<\/[A-Z]/`), the body is abandoned and the item falls
back to `description` alone, with a build-time warning naming the entry:

```
[feed] posts/<id>: MDX body has JSX, using description only
```

Known limitation, not handled: MDX expressions such as `{SITE.title}` pass through into the
feed verbatim. Stripping `{…}` would damage TeX (`\mathbb{Z}`) and code spans, so it is left
alone rather than guessed at.

## Open Graph card

`src/lib/og.ts` exports `renderOg(input): Promise<Uint8Array<ArrayBuffer>>` — the narrower
`ArrayBuffer` parameter is required, because TypeScript 6's `BodyInit` rejects
`Uint8Array<ArrayBufferLike>` and `new Response(png, …)` would not typecheck otherwise.

Layout, on a 1200×630 canvas with 64px padding:

- A 5px full-bleed aurora bar across the top, and a 240×2 aurora hairline bottom right, both
  `linear-gradient(90deg, #8fb3ff, #5fe3c9, #c4a6ff)`.
- Background `#0b0d14` under a shallow `linear-gradient(150deg, #151a27, #0b0d14 58%, #090b11)`
  so the card is not a flat rectangle. **satori's `radial-gradient` is unusable**: it inverts
  the stops and paints a hard-edged box, so the two soft corner glows that were tried first
  were removed. Sample of the failure is not kept; the linear ramp replaced it.
- 16 constellation dots, 2–5px, `borderRadius: 999`, `#e7e4dc` at opacity 0.25–0.70 with about
  a quarter in `#5fe3c9`. Positions come from a linear congruential generator seeded with an
  FNV-1a hash of the title, so each entry gets its own constellation and it is identical on
  every build. Dots are rejected inside three horizontal bands (the wordmark row, the
  title/description block, the footer) unless they fall in the outer 48px margins.
- Wordmark top left: `∂` in `#8fb3ff` then `cohomolo.gy` in `#e7e4dc`, JetBrains Mono 26px.
  Section label top right in `#9a9db0`: `§ writing`, `§ note`, or `§ index`.
- Title in Newsreader 400 with `lineHeight 1.1` and `letterSpacing -0.015em`: 64px up to 60
  characters, 56px up to 90, 48px beyond; 96px for the `site` card. Character budgets of
  96/110/130 approximate three lines and truncate on a word boundary with `…`, since satori
  does not clip overflow.
- Description in Newsreader italic 30px `#9a9db0`, `maxWidth 900`, budget 150 characters.
- Footer: a `#22263a` rule, then the date via `formatDate(date, 'long')` in `#626678` and up
  to three `#tag` in `#5fe3c9`, JetBrains Mono 22px.

### Font path resolution

`import.meta.url` alone does not work. Astro bundles `src/lib/og.ts` into
`dist/.prerender/chunks/og_*.mjs`, and the build failed with:

```
ENOENT: no such file or directory, open
'…/dist/.prerender/assets/og/newsreader-16pt-regular.ttf'
```

`fontFile()` now tries the module-relative directory first (correct under `astro dev` and
under bare Node) and falls back to `process.cwd()/src/assets/og/`, which is where both
`astro build` and `npm run og:default` run from.

### `scripts/og-default.mjs`

Option (a) from the brief works. Node 24.20.0 strips types from imported `.ts` modules with
no flag, so the script does `import { renderOg } from '../src/lib/og.ts'` and
`import { SITE } from '../src/site.config.ts'` directly. Two consequences:

- `src/lib/og.ts` imports its own siblings with explicit `.ts` extensions
  (`'../site.config.ts'`, `'./format.ts'`) because Node cannot resolve extensionless
  specifiers. `allowImportingTsExtensions` is already on in `astro/tsconfigs/base`, and Vite
  resolves them, so this costs nothing at build time. The rest of `src/lib` keeps the
  extensionless style.
- `src/lib/og.ts` imports nothing from `astro:*`, as required.

Output:

```
/Users/emilypillmore/haskell/.site-worktrees/p6/public/og/default.png — 86754 bytes
```

## Built path check

`trailingSlash: 'always'` does **not** turn the image endpoints into directories. With three
temporary entries present, the build emitted exactly:

```
dist/og/default.png
dist/og/notes/zz-og-note.png
dist/og/posts/zz-og-test-long.png
dist/og/posts/zz-og-test.png
```

No `dist/og/posts/<id>.png/index.html` and no trailing-slash directory. Nothing to report as
a bug.

## Tests

Temporary entries `src/content/posts/zz-og-test.md`, `src/content/posts/zz-og-test-long.mdx`
and `src/content/notes/zz-og-note.md` exercised markdown, MDX component stripping, inline and
display maths, long-title truncation, and the note kind. All three were deleted before the
commit; `git status` shows nothing under `src/content/`.

`check-feed-items.mjs` (kept in this directory, no dependencies) counts `<item>` elements and
compares them with the non-draft, non-template files on disk:

```
rss 2.0 declared : true
well-formed tags : true
<item> count     : 3
published entries: 3
exit=0
```

`xmllint --noout dist/rss.xml` exits 0, so the feed is well-formed XML.

PNG signature and IHDR, read from the first 24 bytes:

```
dist/og/posts/zz-og-test.png       sig 89504e47 w 1200 h 630 bytes  94978 OK
dist/og/posts/zz-og-test-long.png  sig 89504e47 w 1200 h 630 bytes 132019 OK
dist/og/notes/zz-og-note.png       sig 89504e47 w 1200 h 630 bytes  73281 OK
public/og/default.png              sig 89504e47 w 1200 h 630 bytes  86754 OK
```

**Zero-entry build.** With the collections empty, `astro build` succeeds, both
`getStaticPaths` return `[]`, no OG endpoint is emitted, and the feed degrades to an
item-less but valid channel:

```xml
<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>cohomolo.gy</title>…<language>en</language></channel></rss>
```

Clearing `node_modules/.astro` is needed after deleting content files, otherwise the stale
content-layer cache makes the build fail on a module for a file that no longer exists. That
is an Astro caching quirk, not a defect in this package.

## Verification

```
npm run check                          → 0 errors, 0 warnings, 0 hints (17 files)
npm run build                          → exit 0
test -f dist/rss.xml && rss 2.0 regex  → exit 0
npm run og:default && IHDR 1200×630    → exit 0
du -sk src/assets/og                   → 532 (ceiling 1536)
git status --porcelain | grep -vE …    → no output
xmllint --noout dist/rss.xml           → exit 0
npx prettier --check <new files>       → all matched
```

## Samples in this directory

- `default.png` — the `site` card, `public/og/default.png` as committed
- `sample-post.png` — a short-title post card
- `sample-post-long-title.png` — 116-character title at 48px, description truncated with `…`
- `sample-note.png` — the note kind
- `sample-rss.xml` — the feed built from the three temporary entries
- `check-feed-items.mjs` — the item-count check

## Open issues for the campaign

1. **`formatDate` is off by one day west of UTC.** `src/lib/format.ts` builds its
   `Intl.DateTimeFormat` without a `timeZone`, and frontmatter dates such as `2026-07-02`
   parse as UTC midnight. In a UTC-7 environment the card renders `1 July 2026`. This affects
   every date on the site, not just the cards, so the fix belongs in `src/lib/format.ts`
   (`timeZone: 'UTC'`), which is outside this package's scope. The OG cards will inherit the
   correction automatically.
2. **Nothing references the images yet.** `/og/posts/<id>.png`, `/og/notes/<id>.png` and
   `/og/default.png` are produced but no `<meta property="og:image">` is emitted anywhere;
   the head component belongs to another package.
3. **`public/og/default.png` is committed and generated.** If `SITE.title` or
   `SITE.author.bio` changes, someone must re-run `npm run og:default` and commit the result.
