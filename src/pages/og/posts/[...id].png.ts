import type { APIRoute, GetStaticPaths } from 'astro';

import { getPublishedPosts, type Post } from '../../../lib/content';
import { renderOg } from '../../../lib/og';

export const getStaticPaths: GetStaticPaths = async () =>
  (await getPublishedPosts()).map((post) => ({ params: { id: post.id }, props: { post } }));

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Post };

  const png = await renderOg({
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    tags: post.data.tags,
    kind: 'post',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
