/** Presentation styles for a date: prose, compact, or machine-readable. */
export type DateFormat = 'long' | 'short' | 'iso';

/** Average adult reading speed for technical prose. */
const WORDS_PER_MINUTE = 230;

// Frontmatter dates such as `2026-07-02` parse as UTC midnight. Formatting in
// UTC keeps the calendar day stable wherever the site is built.
const longFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Render a date for display.
 *
 * - `long` → `3 September 2026`
 * - `short` → `Sep 2026`
 * - `iso` → `2026-09-03`
 */
export function formatDate(d: Date, fmt: DateFormat = 'long'): string {
  switch (fmt) {
    case 'iso':
      return d.toISOString().slice(0, 10);
    case 'short':
      return shortFormatter.format(d);
    case 'long':
      return longFormatter.format(d);
  }
}

/** Estimated time to read a body of markdown, never rounding below one minute. */
export function readingTime(body: string): { minutes: number; words: number } {
  const words = body.split(/\s+/).filter(Boolean).length;
  return { minutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)), words };
}

/** Normalise a tag to the lower-kebab-case form used in URLs. */
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
