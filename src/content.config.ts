import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const tag = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'tags are lower-kebab-case');

const postSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(280),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(tag).default([]),
  draft: z.boolean().default(false),
  math: z.boolean().default(false),
  toc: z.boolean().default(true),
  lede: z.string().optional(),
});

const noteSchema = postSchema.omit({ lede: true, toc: true });

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/posts' }),
  schema: postSchema,
});

const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: noteSchema,
});

const projects = defineCollection({
  loader: file('./src/content/projects.yaml'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().max(200),
    url: z.url(),
    repo: z.url().optional(),
    hackage: z.string().optional(),
    role: z.enum(['author', 'maintainer', 'contributor', 'founder']),
    status: z.enum(['active', 'maintained', 'archived', 'wip']),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const talks = defineCollection({
  loader: file('./src/content/talks.yaml'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(['talk', 'paper', 'slides', 'workshop', 'panel']),
    venue: z.string(),
    date: z.coerce.date(),
    url: z.url().optional(),
    slides: z.url().optional(),
    video: z.url().optional(),
    coauthors: z.array(z.string()).default([]),
    abstract: z.string().optional(),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { posts, notes, projects, talks, about };
