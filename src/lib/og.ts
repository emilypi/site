/**
 * Open Graph card rendering.
 *
 * Draws the 1200×630 social image that fronts every post and note. The layout is
 * built as plain satori element objects rather than JSX because the project has
 * no JSX runtime, and the palette is inlined as literals because satori cannot
 * read the CSS custom properties in `src/styles/tokens.css` — the values here
 * must be kept in step with that file by hand.
 *
 * This module is imported both by the Astro endpoints under `src/pages/og/` and
 * by `scripts/og-default.mjs` running under bare Node, so it must not import
 * anything from `astro:*`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import satori, { type Font } from 'satori';
import { Resvg } from '@resvg/resvg-js';

import { SITE } from '../site.config.ts';
import { formatDate } from './format.ts';

/** What a card is standing in for: an article, a short note, or the site itself. */
export type OgKind = 'post' | 'note' | 'site';

export interface OgInput {
  title: string;
  description?: string;
  date?: Date;
  tags?: string[];
  kind: OgKind;
}

/** Card geometry, in CSS pixels. */
const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 64;

/** Mirror of the `--color-*` tokens in `src/styles/tokens.css`. */
const COLOR = {
  bg: '#0b0d14',
  text: '#e7e4dc',
  muted: '#9a9db0',
  faint: '#626678',
  rule: '#22263a',
  accent: '#8fb3ff',
  accent2: '#5fe3c9',
  accent3: '#c4a6ff',
} as const;

const AURORA = `linear-gradient(90deg, ${COLOR.accent}, ${COLOR.accent2}, ${COLOR.accent3})`;

const DISPLAY = 'Newsreader';
const MONO = 'JetBrains Mono';

/** Section label shown top right, one per kind of card. */
const KIND_LABEL: Record<OgKind, string> = {
  post: 'writing',
  note: 'note',
  site: 'index',
};

/** Title point sizes, largest first; the first entry whose limit fits wins. */
const TITLE_SIZES = [
  { maxChars: 60, fontSize: 64, budget: 96 },
  { maxChars: 90, fontSize: 56, budget: 110 },
  { maxChars: Infinity, fontSize: 48, budget: 130 },
] as const;

/** Roughly two lines of italic Newsreader at 30px across the content column. */
const DESCRIPTION_BUDGET = 150;

/** The site card carries a wordmark rather than a sentence, so it gets its own scale. */
const SITE_TITLE = { fontSize: 96, budget: 40 } as const;

/** Tags past this many are dropped rather than wrapped onto a second row. */
const MAX_TAGS = 3;

const DOT_COUNT = 16;

/**
 * A shallow diagonal wash from the elevated surface colour down into the void,
 * so the card is not a flat rectangle. satori's `radial-gradient` support is
 * unusable here — it inverts the stops and leaves a hard box edge — so the
 * depth has to come from a linear ramp.
 */
const BACKDROP = `linear-gradient(150deg, #151a27 0%, ${COLOR.bg} 58%, #090b11 100%)`;

/** Bands the text occupies, kept clear so no dot lands against a letterform. */
const TEXT_SAFE = [
  { y0: 52, y1: 122 }, // wordmark and section label
  { y0: 168, y1: 462 }, // title and description
  { y0: 486, y1: 584 }, // rule, date, tags, hairline
] as const;

/** Outside these bounds a dot is clear of the text column at any height. */
const MARGIN_X = { left: 48, right: 1152 } as const;

// A minimal shape for satori's element tree. satori types its input as React's
// `ReactNode`; these objects are the runtime form React elements reduce to.
interface OgNode {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: OgNode | (OgNode | false)[] | string | number;
  };
}

/**
 * Where to look for the font files.
 *
 * Module-relative resolution is correct under `astro dev` and under bare Node,
 * but Astro's build bundles this module into `dist/.prerender/chunks/`, where
 * `import.meta.url` no longer points anywhere near `src/`. Both Astro and the
 * npm scripts run from the project root, so the working directory is the
 * fallback.
 */
const FONT_DIRS = [
  new URL('../assets/og/', import.meta.url),
  pathToFileURL(join(process.cwd(), 'src', 'assets', 'og', '/')),
];

function fontFile(name: string): Buffer {
  for (const dir of FONT_DIRS) {
    try {
      return readFileSync(new URL(name, dir));
    } catch {
      continue;
    }
  }

  throw new Error(`Open Graph font ${name} not found under src/assets/og/`);
}

/**
 * Loaded once per process and reused by every card.
 *
 * These are static instances, not variable fonts: satori's opentype.js fork
 * throws while parsing an `fvar` table, so a variable TTF cannot be used here.
 * Newsreader is taken at the 16pt optical size, whose sturdier stems hold up
 * against a near-black background better than the hairlines of the 72pt cut.
 */
const FONTS: Font[] = [
  { name: DISPLAY, data: fontFile('newsreader-16pt-regular.ttf'), weight: 400, style: 'normal' },
  { name: DISPLAY, data: fontFile('newsreader-16pt-italic.ttf'), weight: 400, style: 'italic' },
  { name: MONO, data: fontFile('jetbrains-mono-regular.ttf'), weight: 400, style: 'normal' },
];

/** Cut a string to a character budget on a word boundary, marking the cut with an ellipsis. */
function truncate(text: string, budget: number): string {
  if (text.length <= budget) return text;

  const cut = text.slice(0, budget - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const kept = lastSpace > budget * 0.6 ? cut.slice(0, lastSpace) : cut;

  return `${kept.trimEnd()}…`;
}

/** FNV-1a over the title, so a card's constellation is its own but stable across builds. */
function hashString(text: string): number {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/** Numerical Recipes' linear congruential generator: tiny, seedable, and reproducible. */
function seededRandom(seed: number): () => number {
  let state = seed || 1;

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

/** Scatter faint dots over the card, skipping the bands and column the text occupies. */
function constellation(seed: number): OgNode[] {
  const random = seededRandom(seed);
  const dots: OgNode[] = [];

  for (let placed = 0, tries = 0; placed < DOT_COUNT && tries < DOT_COUNT * 20; tries += 1) {
    const x = random() * (WIDTH - 32) + 16;
    const y = random() * (HEIGHT - 32) + 16;

    const inColumn = x > MARGIN_X.left && x < MARGIN_X.right;
    if (inColumn && TEXT_SAFE.some((band) => y > band.y0 && y < band.y1)) continue;

    const size = 2 + Math.round(random() * 3);
    const teal = random() < 0.25;

    dots.push({
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          left: Math.round(x),
          top: Math.round(y),
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: teal ? COLOR.accent2 : COLOR.text,
          opacity: 0.25 + random() * 0.45,
        },
      },
    });
    placed += 1;
  }

  return dots;
}

const text = (value: string, style: Record<string, unknown>): OgNode => ({
  type: 'span',
  props: { style, children: value },
});

const row = (style: Record<string, unknown>, children: (OgNode | false)[]): OgNode => ({
  type: 'div',
  props: { style: { display: 'flex', flexDirection: 'row', ...style }, children },
});

/** The wordmark: an accent partial-derivative sign followed by the site name. */
function wordmark(): OgNode {
  return row({ alignItems: 'center' }, [
    text('∂', { fontFamily: MONO, fontSize: 26, color: COLOR.accent }),
    text(SITE.title, { fontFamily: MONO, fontSize: 26, color: COLOR.text, marginLeft: 12 }),
  ]);
}

/** Date and tags on the left, an aurora hairline on the right. */
function footer(input: OgInput): OgNode {
  const tags = (input.tags ?? []).slice(0, MAX_TAGS);

  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column' },
      children: [
        {
          type: 'div',
          props: { style: { display: 'flex', height: 1, backgroundColor: COLOR.rule } },
        },
        row({ marginTop: 26, alignItems: 'center', justifyContent: 'space-between' }, [
          row({ alignItems: 'center' }, [
            input.date !== undefined &&
              text(formatDate(input.date, 'long'), {
                fontFamily: MONO,
                fontSize: 22,
                color: COLOR.faint,
              }),
            ...tags.map((tag) =>
              text(`#${tag}`, {
                fontFamily: MONO,
                fontSize: 22,
                color: COLOR.accent2,
                marginLeft: 24,
              }),
            ),
          ]),
          {
            type: 'div',
            props: {
              style: { display: 'flex', width: 240, height: 2, backgroundImage: AURORA },
            },
          },
        ]),
      ],
    },
  };
}

function card(input: OgInput): OgNode {
  const sizing =
    TITLE_SIZES.find((candidate) => input.title.length <= candidate.maxChars) ?? TITLE_SIZES[2];
  const isSite = input.kind === 'site';
  const titleSize = isSite ? SITE_TITLE.fontSize : sizing.fontSize;

  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: COLOR.bg,
        backgroundImage: BACKDROP,
      },
      children: [
        ...constellation(hashString(input.title)),
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: WIDTH,
              height: 5,
              backgroundImage: AURORA,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: WIDTH,
              height: HEIGHT,
              padding: PADDING,
            },
            children: [
              row({ alignItems: 'center', justifyContent: 'space-between' }, [
                wordmark(),
                text(`§ ${KIND_LABEL[input.kind]}`, {
                  fontFamily: MONO,
                  fontSize: 24,
                  color: COLOR.muted,
                }),
              ]),
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    justifyContent: 'center',
                  },
                  children: [
                    text(truncate(input.title, isSite ? SITE_TITLE.budget : sizing.budget), {
                      fontFamily: DISPLAY,
                      fontSize: titleSize,
                      lineHeight: 1.1,
                      letterSpacing: '-0.015em',
                      color: COLOR.text,
                    }),
                    input.description !== undefined &&
                      input.description !== '' &&
                      text(truncate(input.description, DESCRIPTION_BUDGET), {
                        fontFamily: DISPLAY,
                        fontStyle: 'italic',
                        fontSize: 30,
                        lineHeight: 1.35,
                        color: COLOR.muted,
                        marginTop: 28,
                        maxWidth: 900,
                      }),
                  ],
                },
              },
              footer(input),
            ],
          },
        },
      ],
    },
  };
}

/**
 * Render one Open Graph card to PNG bytes, exactly 1200×630.
 *
 * The buffer is copied into an array of its own so the result is a plain
 * `Uint8Array<ArrayBuffer>`, which `Response` accepts as a body.
 */
export async function renderOg(input: OgInput): Promise<Uint8Array<ArrayBuffer>> {
  // satori's parameter is typed as React's `ReactNode`; the cast hands it the
  // plain object tree that a React element reduces to at runtime.
  const svg = await satori(card(input) as never, { width: WIDTH, height: HEIGHT, fonts: FONTS });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();

  return new Uint8Array(png);
}
