import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { SITE } from '../site.config';
import { feedItems } from '../lib/feed';

export async function GET(context: APIContext): Promise<Response> {
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: await feedItems(),
    customData: `<language>${SITE.locale}</language>`,
    trailingSlash: true,
  });
}
