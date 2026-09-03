import { SITE } from '../site.config';

/** Targets that must be emitted verbatim: other origins, mail, and in-page anchors. */
const EXTERNAL = /^(?:https?:|mailto:|tel:|#)/;

/** A trailing path segment carrying a file extension, e.g. `/rss.xml`. */
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

/**
 * Normalise an internal link to the site's `trailingSlash: 'always'` convention.
 *
 * Directory paths gain a leading and trailing slash. Anything addressing a file,
 * another origin, a mail client, or an anchor passes through untouched.
 */
export function href(path: string): string {
  if (EXTERNAL.test(path) || HAS_EXTENSION.test(path)) return path;

  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

/** Resolve a path against the canonical site origin, for feeds, sitemaps, and Open Graph tags. */
export function absolute(path: string): string {
  return new URL(path, SITE.url).toString();
}
