import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Note = CollectionEntry<'notes'>;

/** Tag with the number of published entries carrying it. */
export interface TagCount {
  tag: string;
  count: number;
}

/**
 * Drafts are visible while running `astro dev` and hidden from every build, so
 * work in progress is readable locally without ever shipping.
 */
export const isPublished = (e: { data: { draft: boolean } }): boolean =>
  import.meta.env.DEV || !e.data.draft;

const byDateDesc = (a: { data: { date: Date } }, b: { data: { date: Date } }): number =>
  b.data.date.getTime() - a.data.date.getTime();

export async function getPublishedPosts(): Promise<Post[]> {
  return (await getCollection('posts', isPublished)).sort(byDateDesc);
}

export async function getPublishedNotes(): Promise<Note[]> {
  return (await getCollection('notes', isPublished)).sort(byDateDesc);
}

/** Every tag across published posts and notes, most used first, ties broken alphabetically. */
export async function getAllTags(): Promise<TagCount[]> {
  const [posts, notes] = await Promise.all([getPublishedPosts(), getPublishedNotes()]);
  const counts = new Map<string, number>();

  for (const entry of [...posts, ...notes]) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
