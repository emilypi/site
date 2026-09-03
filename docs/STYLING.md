# Styling

Every visual decision on the site lives in `src/styles/`. There is no CSS-in-JS, no preprocessor, and no utility framework — just custom properties and plain rules.

## Tokens

`src/styles/tokens.css` holds every colour, font, size, and spacing value as a CSS custom property, grouped by what it controls:

- **Colour** — `--color-bg`, `--color-bg-elevated`, `--color-bg-inset` (backgrounds, least to most raised); `--color-text`, `--color-text-muted`, `--color-text-faint` (foreground, most to least prominent); `--color-rule` (hairlines and borders); `--color-accent`, `--color-accent-2`, `--color-accent-3` (the primary, teal, and violet accents — also the colours behind `Callout`'s `note`/`math`/`idea` kinds); `--color-warn` (amber, also `Callout`'s `warn` kind); `--color-selection`; `--gradient-aurora` (a decorative gradient). To warm the dark background, change `--color-bg`.
- **Typography** — `--font-display`, `--font-body`, `--font-mono` (the three font-family tokens, see Fonts below); `--text-xs` through `--text-4xl` (the type scale); `--leading-tight` and `--leading-body` (line-height pairs); `--tracking-label` (the letter-spacing used by uppercase mono labels).
- **Layout** — `--measure` and `--measure-wide` (line-length caps for prose vs. wide content) and `--gutter` (page margins).
- **Spacing** — `--space-1` through `--space-24`, the scale used for margins, padding, and gaps, so components stay on a consistent rhythm.
- **Shape and motion** — `--radius-sm`, `--radius-md`, `--radius-lg` (corner radii); `--shadow-glow`; `--ease-out` and `--dur` (transition easing and duration).

Changing a token changes every place that uses it — there's no need to hunt through components for a hardcoded value.

## Light vs dark

Colours are defined in three blocks that layer on top of each other:

1. Dark values are the defaults, set directly on `:root`.
2. Light overrides live under `:root[data-theme='light']` — this wins once a viewer has explicitly chosen light mode.
3. A `prefers-color-scheme: light` media query, scoped to `:root:not([data-theme])`, applies the same light overrides on a first visit before any explicit choice — matching the visitor's system setting without overriding a choice already made.

The theme toggle writes the viewer's choice to `localStorage` under the key `theme` and sets `data-theme` on the root element accordingly, so the choice sticks across visits.

**To make light the default:** swap the blocks — move the light values onto bare `:root`, move the dark values behind a `:root[data-theme='dark']` selector, and update `color-scheme` in `global.css` to match.

## Fonts

Fonts are configured in the `fonts` array in `astro.config.mjs` and served by Astro's Fonts API. The font files themselves come from the pinned `@fontsource-variable` packages in `node_modules` (**Newsreader** for display and prose headings, **Inter** for body text, **JetBrains Mono** for code and labels), so nothing is fetched from a third-party CDN at build or at run time. Astro emits the `@font-face` rules, preloads the two text faces, and generates size-adjusted fallback fonts so the page does not shift when the real font arrives. `src/layouts/BaseLayout.astro` renders one `<Font />` component per face, and `src/styles/tokens.css` maps `--font-display`, `--font-body`, and `--font-mono` onto the variables the API defines (`--font-newsreader`, `--font-inter`, `--font-jetbrains-mono`).

**To swap a face:** install another `@fontsource-variable/<face>` package, point the matching `variants[].src` paths in `astro.config.mjs` at its `files/*-latin-wght-*.woff2` files (check the weight range in that package's `metadata.json`), update `name`, and keep the `cssVariable`. Nothing else changes.

**To go system-only:** delete the entry from the `fonts` array, remove its `<Font />` line from `BaseLayout.astro`, and set the corresponding `--font-*` token in `tokens.css` to a system stack such as `system-ui, sans-serif`.

## Prose typography

`src/styles/prose.css` is responsible for the typography of Markdown body copy rendered inside `.prose` — heading rhythm, paragraph measure, blockquotes, tables, inline vs. block code, and link styling. It sits on top of the tokens and reset, so it should reference tokens rather than hardcoding values.

## Code block themes

Shiki's light and dark themes are set in `shikiConfig.themes` in `astro.config.mjs` (currently `github-light` and `github-dark-dimmed`). Change either value to a different [Shiki theme name](https://shiki.style/themes) to change the code palette; both themes' CSS variables ship in the build and the active one follows the page's colour scheme.

## The constellation

The homepage renders a `<Constellation />` component as a decorative background. To turn it off, remove `<Constellation />` from `src/pages/index.astro`.

## Favicon and the ∂ mark

`public/favicon.svg` is a static SVG: a dark rounded square with a serif ∂ glyph. Edit the SVG directly to change the colours or the glyph — there's no build step for it.

## Responsive breakpoints

There is no shared breakpoint scale; each piece sets its own where its layout needs one. The `@media` rules currently in use live in `prose.css` (`900px`), `Header.astro` and `PostList.astro` (`40rem`), `ArticleLayout.astro` (`40rem`, `75rem`), and `index.astro` (`40rem`, `48rem`).
