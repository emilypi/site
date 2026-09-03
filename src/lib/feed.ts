/**
 * RSS feed contents.
 *
 * Posts and notes share one chronological feed. Each item carries the full
 * article rendered to HTML, so a reader that shows full text needs no round
 * trip to the site.
 */
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import type { RSSFeedItem } from '@astrojs/rss';

import { SITE } from '../site.config';
import { getPublishedNotes, getPublishedPosts, type Note, type Post } from './content';
import { absolute } from './url';

/** How many of the newest entries the feed carries. */
const FEED_LIMIT = 20;

/** `email (Name)` is the address format RSS 2.0 specifies for `<author>`. */
const FEED_AUTHOR = `${SITE.author.email} (${SITE.author.name})`;

const markdown = new MarkdownIt({ html: true, linkify: true });

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
};

/** An MDX `import` or `export` statement at the top level of the body. */
const ESM_STATEMENT = /^[ \t]*(?:import|export)\s.*$/gm;

/** An MDX component tag: `<Callout …>`, `</Figure>`, `<Aside … />`. */
const COMPONENT_TAG = /<\/?[A-Z][A-Za-z0-9]*\b[^>]*\/?>/g;

/** A closing component tag that survived stripping, meaning the body is still JSX. */
const RESIDUAL_COMPONENT = /<\/[A-Z]/;

/** A `$$…$$` block or a `$…$` span, the delimiters `remark-math` recognises. */
const MATH_SPAN = /\$\$[\s\S]+?\$\$|\$(?![\s$])[^$\n]*?(?<![\s\\])\$/g;

/** Marks where a maths span was lifted out; alphanumeric so markdown-it leaves it alone. */
const mathPlaceholder = (index: number): string => `xMATHSPAN${index}ENDMATHx`;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const isMdx = (entry: Post | Note): boolean =>
  (entry.filePath ?? entry.id).toLowerCase().endsWith('.mdx');

/**
 * Reduce an MDX body to something a feed reader can display.
 *
 * MDX component tags have no meaning outside the site's build, so the tags are
 * removed and the prose between them kept. Returns `undefined` when what is left
 * still contains JSX, in which case the caller falls back to the description.
 */
function stripMdx(body: string): string | undefined {
  const stripped = body.replace(ESM_STATEMENT, '').replace(COMPONENT_TAG, '');

  return RESIDUAL_COMPONENT.test(stripped) ? undefined : stripped;
}

/**
 * Render a body to sanitised HTML.
 *
 * Maths is left as the raw `$…$` and `$$…$$` source: KaTeX output depends on a
 * stylesheet no feed reader loads, so the delimiters are the honest fallback.
 * Each span is lifted out before markdown-it runs and put back afterwards,
 * because otherwise TeX escapes such as `\,` are eaten as markdown escapes.
 */
function renderBody(entry: Post | Note): string | undefined {
  const body = entry.body;
  if (body === undefined || body.trim() === '') return undefined;

  const source = isMdx(entry) ? stripMdx(body) : body;
  if (source === undefined) {
    console.warn(
      `[feed] ${entry.collection}/${entry.id}: MDX body has JSX, using description only`,
    );
    return undefined;
  }

  const maths: string[] = [];
  const masked = source.replace(MATH_SPAN, (span) => mathPlaceholder(maths.push(span) - 1));
  const html = sanitizeHtml(markdown.render(masked), sanitizeOptions);

  // The replacement must be a function: `$$` in a replacement string is the
  // escape for a literal `$`, which would halve every display-maths delimiter.
  return maths.reduce(
    (rendered, span, index) => rendered.replaceAll(mathPlaceholder(index), () => escapeHtml(span)),
    html,
  );
}

function toFeedItem(entry: Post | Note, path: string): RSSFeedItem {
  return {
    title: entry.data.title,
    description: entry.data.description,
    pubDate: entry.data.date,
    link: absolute(path),
    categories: [...entry.data.tags],
    author: FEED_AUTHOR,
    content: renderBody(entry),
  };
}

/** The newest published posts and notes, merged and ordered newest first. */
export async function feedItems(): Promise<RSSFeedItem[]> {
  const [posts, notes] = await Promise.all([getPublishedPosts(), getPublishedNotes()]);

  return [
    ...posts.map((post) => toFeedItem(post, `/posts/${post.id}/`)),
    ...notes.map((note) => toFeedItem(note, `/notes/${note.id}/`)),
  ]
    .sort((a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0))
    .slice(0, FEED_LIMIT);
}
