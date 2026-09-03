import type { APIRoute, GetStaticPaths } from 'astro';

import { getPublishedNotes, type Note } from '../../../lib/content';
import { renderOg } from '../../../lib/og';

export const getStaticPaths: GetStaticPaths = async () =>
  (await getPublishedNotes()).map((note) => ({ params: { id: note.id }, props: { note } }));

export const GET: APIRoute = async ({ props }) => {
  const { note } = props as { note: Note };

  const png = await renderOg({
    title: note.data.title,
    description: note.data.description,
    date: note.data.date,
    tags: note.data.tags,
    kind: 'note',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
