# p3 — Seed content in Emily's voice

Branch `pkg/p3` from `main` at `b9f1ea7`. Tip `3a9954a`. Four commits, all authored
`Emily Pillmore <emilypi@cohomolo.gy>`, no trailers.

## Voice notes (five lines)

1. Register is plain and unceremonious. She opens with the thing itself, never with throat-clearing, and signs off in her own name ("Thanks, Emily.") rather than in an institutional voice.
2. Sentences are short and load-bearing; when they lengthen it is to carry a qualification she actually means, e.g. the licensing paragraph in `haskell-resources` about why the repo links to PDFs instead of hosting them.
3. Humour arrives as a dry section heading rather than as a joke in the prose: "Under the Hood (Where the sausage is made)", "The Beautiful and Comical George Wilson on Classy Optics".
4. Mathematics is introduced by lineage, not by definition. `haskell-resources` is organised as a history — "The Beginning: Moggi + Wadler", then propositions-as-types, then design space — which is a curator's instinct rather than a lecturer's.
5. Technical claims are concrete, comparative, and falsifiable: "Better performance than `base64-bytestring`", "Rejects non-canonical encodings that do not roundtrip in other base64 libraries like `ZE==`." No adjectives doing work that a benchmark should do.

## URLs fetched

### READMEs read for voice

| URL | Status | Taken |
| --- | --- | --- |
| `raw.githubusercontent.com/cohomolo-gy/haskell-resources/master/README.md` | 200 | Voice; the "where the sausage is made" phrasing reused in the project description |
| `raw.githubusercontent.com/emilypi/base64/master/README.md` | 200 | Voice; base64 description (type coverage, perf vs base64-bytestring, non-canonical rejection) |
| `raw.githubusercontent.com/cohomolo-gy/optics-resources/master/README.md` | 200 | Voice; optics-resources description (van Laarhoven, Kmett, categorical papers) |

`optics-resources` on `main` is 404; `master` is the live branch. `haskell-resources` serves 200 on both.

### Repositories (GitHub API, all 200, none flagged archived)

| Repo | Description returned |
| --- | --- |
| `emilypi/base64` | "RFC 4648-compliant Base64" |
| `cohomolo-gy/haskell-resources` | "A List of Foundational Haskell Papers" |
| `emilypi/smash` | "Smash products, Wedge products, and other Pointed stuff" |
| `emilypi/nonempty-vector` | "Non-empty Vectors" |
| `emilypi/base16` | `null` — description taken from the Hackage synopsis instead |
| `emilypi/base32` | "RFC 4648-compliant Base32 encodings + decodings" |
| `emilypi/group-theory` | "The theory of groups" |
| `emilypi/vitrea` | "[WIP] Optics via the profunctor representation theorem" |
| `cohomolo-gy/optics-resources` | "Resources for the aspiring optician" |
| `cohomolo-gy/polytope` | "zero to competency in LLM research and associated \*P problems and optimization theory" |
| `cohomolo-gy/lawvere` | "The collected works of F. W. Lawvere" |
| `cohomolo-gy/Type-Arithmetic-and-the-Yoneda-Perspective` | "Slides for Scalaworld 2019" |

Nothing 404'd, so nothing was dropped.

### Hackage

All 200: `base64`, `base16`, `base32`, `nonempty-vector`, `smash`, `group-theory`, **`vitrea`**.
Negative control (`hackage.haskell.org/package/definitely-not-a-real-package-xyz`) returns 404, so the 200s are genuine rather than a soft-404.

`base16` synopsis, used verbatim as the basis of its description: "Fast RFC 4648-compliant Base16 encoding".
`vitrea` synopsis: "Profunctor optics via the profunctor representation theorem."

**Deviation from the brief's table:** the brief marks `vitrea` as having no Hackage package. It does. `hackage: vitrea` is set and `url` points at the package page. Flagged for review below.

### The Compositionality paper — verified, not a TODO

| URL | Status | Taken |
| --- | --- | --- |
| `compositionality.episciences.org/13530` | 200 | Title, author order, date, DOI, abstract |
| `doi.org/10.32408/compositionality-6-1` | 200, resolves to the episciences page | DOI confirmed live |
| `dblp.org/pid/256/9524.xml` | 200 | Independent confirmation of title, author order, volume, year |

Title: **"Profunctor Optics, a Categorical Update"**. Compositionality vol. 6, published 2024-02-23.
Authors in order: Bryce Clarke, Derek Elkins, Jeremy Gibbons, Fosco Loregiàn, Bartosz Milewski, Emily Pillmore, Mario Román.

dblp lists exactly two records for Emily Pillmore, and they are the same work: this article and its 2020 arXiv preprint (`abs/2001.07488`). So there is no second paper to find.

Surname spelling: dblp renders "Fosco Loregiàn" (with the accent); episciences renders "Loregian". dblp is used, as the canonical bibliographic record.

`compositionality.episciences.org/search/index?q=Pillmore` returns 403 to curl, and `compositionality-journal.org/papers/` did not resolve; the article was reached by search and then confirmed against the two primary sources above.

### Scala World 2019

| URL | Status | Taken |
| --- | --- | --- |
| `youtube.com/oembed?url=...aXS5HZ_1fNQ` | 200 | Video title and channel |
| `youtube.com/watch?v=aXS5HZ_1fNQ` | 200 | Video live |
| `scala.world` | 200 | Official conference name |
| GitHub commits API on the slides repo | 200 | Slide-finalisation dates |

The recording is titled **"Emily Pillmore: Type Arithmetic and the Yoneda Lemma"**, uploaded by the channel **Scala World**, and it sits in the "Scala World 2019" playlist. This is a verified `video` URL, which the brief allowed only if found.

Three judgement calls, all flagged in `talks.yaml` as YAML comments:

- **Venue spelling.** `scala.world` gives the official name as "Scala World" ("a conference for the Scala programming language which ran over four editions from 2015 until 2019"). The brief said "Scalaworld 2019"; the repo description also says "Scalaworld". Used **"Scala World 2019"** per the primary source.
- **Title.** Slides repo and the brief both say "…Yoneda **Perspective**"; the conference's own recording says "…Yoneda **Lemma**". Kept the brief's title, left a TODO for Emily to choose.
- **Date.** The brief's fallback was `2019-09-15`, but the conference ran 2019-08-31 to 2019-09-04, so that date is known to be wrong. Used **2019-09-03**, the day the slides repo's "updates to slides (final)" commit lands (08:54 UTC, followed by "update with comedy" at 09:28). This is evidence, not proof; TODO left.

Not included: a 2019 tweet by Jon Pretty describes a 90-minute Scala World workshop by Emily on category theory, free constructions, profunctor optics and the Yoneda lemma. A tweet is not a programme page and the workshop has no verifiable title or date, so no entry was made. Noted here in case Emily wants to add it.

## Content produced

| File | State | Notes |
| --- | --- | --- |
| `src/content/posts/why-cohomolo-gy.md` | draft | ~800 words. Cochain complex, `d ∘ d = 0`, `Hⁿ = ker dₙ / im dₙ₋₁`. No schedule promised. |
| `src/content/posts/bellman-fixed-points.md` | draft | ~2,150 words. Full contraction proof, Banach, Haskell value iteration, FP angle, deadly triad. |
| `src/content/posts/kitchen-sink.mdx` | published | Exercises every feature in the brief's order. |
| `src/content/posts/_assets/de-rham.svg` | — | 1,694 bytes, `viewBox` set, `currentColor` strokes, `font-family="serif"`, no external fonts. |
| `src/content/notes/what-notes-are-for.md` | published | 185 words. |
| `src/content/notes/boundary-of-a-boundary.md` | draft | 235 words. |
| `src/content/projects.yaml` | — | 11 entries, first four `featured: true`. |
| `src/content/talks.yaml` | — | 2 entries. |
| `src/content/pages/about.md` | — | ~360 words. |

### Mathematical statements checked

Everything asserted in `bellman-fixed-points.md` was re-derived rather than recalled:

- The contraction proof turns on `Σ_{s'} P(s'|s,a) = 1`, so the bound is a convex combination and the dynamics are irrelevant. Stated as such.
- The max lemma `|maxₐ f − maxₐ g| ≤ maxₐ|f − g|` needs the max to be attained; finite `A` is called out in the text.
- Residual-to-error bound `‖v_{k+1} − v*‖ ≤ γε/(1−γ)` derived in the post, not asserted.
- Iterations per decimal digit: `1/log₁₀(1/γ)` gives 21.9 at γ=0.9 and 229.1 at γ=0.99. Rounded to 22 and 229.
- `T` is *both* a contraction and monotone, so Knaster–Tarski and Banach both apply; the post's claim is that the order gives no rate, which is the accurate distinction.
- The one clean function-approximation case (on-policy, linear, stationary-distribution-weighted L²) is attributed to Tsitsiklis–Van Roy.
- Deadly triad named to Sutton & Barto, no citation, per brief.

Two corrections made during drafting, both after the first draft:

1. `supDist` originally used `M.unionWith`, which is wrong when key sets differ — it keeps raw values rather than differences. Switched to `M.intersectionWith` and reseeded `valueIteration` with `go (bellman m v0)` so both compared maps always come out of `bellman` and therefore share a key set. The post explains why.
2. An unverified claim that divergence counterexamples exist "on problems with four states" was softened to "a handful of states", since I did not verify a specific count.

### Editorial deviation

`projects.yaml` sets `url` to the Hackage page where a package exists and to GitHub otherwise, with `repo` always the GitHub source. The brief's table gave GitHub for both columns, which would have made `repo` duplicate `url` on all eleven rows. This reading matches the scaffold's own commented example in `projects.yaml`. Easy to reverse if unwanted.

## MDX verification — **not deferred**

The brief expected `kitchen-sink.mdx` to be unverifiable today. It was verified.

Method: built against a temporary Markdown twin first, then stubbed `src/components/Callout.astro` and `src/components/Figure.astro`, rendered the real `.mdx` through a throwaway `src/pages/zz-preview/[...id].astro`, and inspected the emitted HTML. All temporary files were deleted before committing; `git status` is clean and only `src/content/` changed.

Rendered output of the real `kitchen-sink.mdx`:

| Feature | Result |
| --- | --- |
| KaTeX | 2 display, 13 inline, **0 `katex-error`** |
| Syntax highlighting | `bash`, `diff`, `haskell`, `lean4`, `python` — all five highlighted |
| Callouts | `note`, `idea`, `warn`, `math` in that order |
| Figure | 1 `<figure>`, SVG processed to `/_astro/de-rham.B9FdML51.svg` |
| Footnotes / task list / table | 7 footnote refs, 4 checkboxes, 1 table |
| `hr` / `kbd` / `del` / `blockquote` | 2 / 2 / 1 / 1 |
| Headings | 11 `h2` (10 mine + GFM's "Footnotes"), 1 `h3`, 1 `h4`; `headings` prop length 13 |
| Overflow URL | autolinked correctly, query string intact |

Haskell operators survive escaping: `Node <$> traverse f l <*> f x <*> traverse f r` round-trips exactly.

**What the integration package must match.** My stubs used these prop names, and the `.mdx` is written against them:

- `Callout` — `kind` (`note` | `idea` | `warn` | `math`), optional `title`, children as slot.
- `Figure` — `src`, `alt`, `caption`. `src` arrives as an **imported asset object**, not a string, because MDX passes `import deRham from './_assets/de-rham.svg'` through Astro's asset pipeline. `Figure` must read `src.src` (or accept `ImageMetadata`). A component that assumes a plain string will render a broken image.

`agda` was not used anywhere; it has no bundled Shiki grammar.

## Verification

| Command | Result |
| --- | --- |
| `npm run check` | exit 0 — 0 errors, 0 warnings, 0 hints |
| `npm run build` | exit 0 |
| `! grep -rilE 'claude\|anthropic\|chatgpt\|openai\|generated by\|as an ai\|language model' src/content` | exit 0 |
| `! grep -rilE 'Head of Core Engineering\|Principal Engineer\|Systems Engineer\|Ava Labs' src/content` | exit 0 |
| `git status --porcelain \| grep -v '^.. src/content/'` | no output |

Schema validation runs during content sync, so both `check` and `build` exercise the frontmatter, `projects.yaml`, and `talks.yaml` against `src/content.config.ts`.

## TODOs left for Emily

In files:

1. `talks.yaml` — confirm the day of the Scala World talk (2019-09-03 is inferred from slide commits).
2. `talks.yaml` — choose between "Yoneda Perspective" (slides) and "Yoneda Lemma" (recording).
3. `talks.yaml` — decide whether the ICFP Haskell Implementors' Workshop program committees (2021, 2025) should appear on `/talks/`; they are currently only on About.
4. `projects.yaml` — `lawvere` is set `status: archived` per the brief, but GitHub does not flag it archived; last commit 2021-05.
5. `about.md` — "anything you'd rather say differently".
6. `why-cohomolo-gy.md` — the "what I'm reading now" section is thin; wants a concrete example.
7. `bellman-fixed-points.md` — offer of a nested-balls figure for the Banach section.
8. `bellman-fixed-points.md` — Sutton & Barto is named but not cited.
9. `boundary-of-a-boundary.md` — whether to qualify "holes" or leave it as the note it is.

Raised here rather than in a file:

10. The `url`/`repo` convention in `projects.yaml` (see Editorial deviation).
11. `vitrea` is on Hackage despite the brief saying otherwise; `hackage: vitrea` is set.
12. Venue is written "Scala World 2019" per the conference's own site, not "Scalaworld".
13. The Scala World workshop attested only by a 2019 tweet was left out for want of a primary source.

## Facts I could not verify

- The exact day of the Scala World 2019 talk. No archived programme found.
- Nothing else. Every project URL, Hackage package, DOI, coauthor name, and video URL in the committed files was fetched and returned 200.

Everything on the About page comes from the brief's Public Facts. The current employer is not mentioned anywhere, and the grep for it passes.
