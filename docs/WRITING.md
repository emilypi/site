# Writing content

## Adding a post

```bash
npm run new:post "Optics from first principles"
```

This copies `src/content/posts/_template.md` to `src/content/posts/<slug>.md` (the slug is your title, lower-kebab-cased) and sets `title` and `date` for you. Edit the body, fill in `description` and `tags`, and set `draft: false` when it's ready to publish. Commit and push to `main` to deploy it.

To do it by hand: copy `src/content/posts/_template.md` to a new file in the same directory and fill in the frontmatter yourself. The filename becomes the URL (see below), so name it deliberately.

## Adding a note

Same idea, one directory over:

```bash
npm run new:note "A note on notes"
```

Notes use `src/content/notes/_template.md` and the same frontmatter as posts, minus `toc` and `lede` (notes are short — if one needs a table of contents or a standfirst, it wants to be a post).

## Frontmatter reference

| Field         | Type                | Required | Default | Meaning                                                         |
| ------------- | ------------------- | -------- | ------- | --------------------------------------------------------------- |
| `title`       | string, ≤120 chars  | yes      | —       | The headline, in sentence case.                                 |
| `description` | string, ≤280 chars  | yes      | —       | One or two sentences; used in feeds, search results, and cards. |
| `date`        | date (`YYYY-MM-DD`) | yes      | —       | Publication date.                                               |
| `updated`     | date                | no       | —       | Set only after a substantive revision.                          |
| `tags`        | string[]            | no       | `[]`    | Lower-kebab-case, e.g. `[type-theory, haskell]`.                |
| `draft`       | boolean             | no       | `false` | While `true`, shows in `npm run dev` only — see Drafts below.   |
| `math`        | boolean             | no       | `false` | Set `true` to load KaTeX styles for this entry.                 |
| `toc`         | boolean             | no       | `true`  | Posts only. Set `false` to suppress the table of contents.      |
| `lede`        | string              | no       | —       | Posts only. A pull quote or standfirst shown above the body.    |

## Drafts and preview

An entry with `draft: true` renders when you run `npm run dev`, but is excluded from `npm run build`, the RSS feed, and the sitemap. Flip it to `false` and republish to make it live — there is no separate staging step.

## Tags

Tags must be lower-kebab-case (`type-theory`, not `Type Theory` or `type_theory`) — anything else fails validation at build. Every unique tag across published posts and notes gets its own page at `/tags/<tag>/`, and `/tags/` lists them all.

## Math

Inline math uses single dollars: `$e^{i\pi} + 1 = 0$`.

Display math needs `$$` alone on its own line, the LaTeX on the following line(s), and a closing `$$` alone on its own line:

```
$$
\sum_{i=1}^n i = \frac{n(n+1)}{2}
$$
```

A single-line `$$...$$` renders **inline**, not as a display equation — keep the delimiters on their own lines when you want the centred, block form.

Set `math: true` in frontmatter to load the KaTeX stylesheet for that entry. It isn't loaded by default, so pages without math stay lighter.

## Code blocks

Fence code with a language for highlighting:

````
```haskell
newtype Cofree f a = a :< f (Cofree f a)
```
````

Supported languages: `haskell`, `lean4`, `ocaml`, `rust`, `python`, `typescript`, `javascript`, `bash`, `nix`, `json`, `yaml`, `toml`, `diff`, `latex`. `diff` fences get the usual `+`/`-` highlighting. (`agda` is not in this list — see `docs/MAINTENANCE.md` if you need it.)

## Footnotes, tables, task lists

Standard GitHub-flavoured Markdown works throughout: footnotes (`[^1]`), tables, and task lists (`- [ ]` / `- [x]`).

## Images

For a plain Markdown post, put the image beside the post in a same-named `_assets/` folder and reference it with a relative path:

```
src/content/posts/optics-from-first-principles.md
src/content/posts/optics-from-first-principles/_assets/diagram.png
```

```markdown
![A profunctor optic diagram](./optics-from-first-principles/_assets/diagram.png)
```

In an `.mdx` post, use `<Figure>` instead (see below) for a captioned figure.

## MDX and the two components

Name a file `.mdx` instead of `.md` to import components into the body:

```mdx
import Callout from '../../components/Callout.astro';
import Figure from '../../components/Figure.astro';
import fig from './_assets/diagram.svg';

<Callout kind="idea" title="Conjecture">
  Optics compose, but the composition is contravariant in the "get" direction.
</Callout>

<Figure src={fig} alt="A profunctor optic diagram" caption="The van Laarhoven encoding." />
```

`Callout` takes an optional `kind` — one of `note`, `idea`, `warn`, `math`, or `aside`, defaulting to `note` — and an optional `title`. The label shown is `title` if given, otherwise the kind itself; each kind has its own accent colour (`note` → accent, `idea` → violet, `warn` → amber, `math` → teal, `aside` → neutral). The body goes in the default slot.

`Figure` takes `src` (either an imported image's metadata, or a plain string — a plain string renders as a plain `<img>`), `alt`, an optional `caption`, and an optional `width`.

## Adding a project

Projects are a YAML list at `src/content/projects.yaml`, not individual files:

```yaml
- id: bytestring-lens
  name: bytestring-lens
  description: Optics for ByteString, with fusion-friendly traversals.
  url: https://hackage.haskell.org/package/bytestring-lens
  repo: https://github.com/emilypi/bytestring-lens
  hackage: bytestring-lens
  role: author # author | maintainer | contributor | founder
  status: maintained # active | maintained | archived | wip
  tags: [haskell, optics]
  featured: true
```

`id` must be unique across the list. `repo`, `hackage`, and `tags` are optional; everything else is required.

## Adding a talk

Talks are a YAML list at `src/content/talks.yaml`:

```yaml
- id: zurihac-2024-optics
  title: Optics from First Principles
  kind: talk # talk | paper | slides | workshop | panel
  venue: ZuriHac
  date: 2024-06-07
  url: https://example.org/talks/optics
  slides: https://example.org/talks/optics/slides.pdf
  video: https://www.youtube.com/watch?v=example
  coauthors: []
  abstract: A derivation of profunctor optics from the Yoneda lemma.
```

`id` must be unique. `url`, `slides`, `video`, and `abstract` are optional.

## Editing the About page

The About page's content lives at `src/content/pages/about.md` (the `about` collection's one entry, id `about`), with `title` and `description` frontmatter plus a Markdown body, rendered at `/about/`. Edit that file directly; there's no script for it.

## How URLs are derived from filenames

A post or note's filename (minus the extension) becomes its URL slug: `src/content/posts/optics-from-first-principles.md` is served at `/posts/optics-from-first-principles/`. Every internal URL ends in a trailing slash (`trailingSlash: 'always'` in `astro.config.mjs`). **Renaming a file changes its URL** — anything that linked to the old path (bookmarks, other posts, search engines) will 404 until it's updated or redirected.

## The RSS feed

`/rss.xml` lists published posts and notes in one feed (drafts excluded), most recent first, capped at the newest 20. Each entry carries its title, description, link, publication date, tags, and the full body rendered to HTML, so a reader showing full text needs no round trip to the site.

## The OG image

Each post and note gets a generated Open Graph card at `/og/posts/<id>.png` or `/og/notes/<id>.png`, built at deploy time from the entry's title and the site's look. Everything else (the homepage, tag pages, and so on) uses the static default at `/og/default.png` — see `npm run og:default` in `docs/MAINTENANCE.md` to regenerate it.
