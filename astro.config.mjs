import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/** Give GFM task-list checkboxes an accessible name: the text of their list item. */
function rehypeTaskListLabels() {
  const text = (node) =>
    node.type === 'text' ? node.value : (node.children ?? []).map(text).join('');
  const visit = (node) => {
    if (node.type === 'element' && node.tagName === 'li') {
      const input = (node.children ?? []).find(
        (c) => c.type === 'element' && c.tagName === 'input' && c.properties?.type === 'checkbox',
      );
      if (input) {
        const label = text({ children: node.children.filter((c) => c !== input) }).trim();
        if (label) input.properties.ariaLabel = label;
      }
    }
    for (const child of node.children ?? []) visit(child);
  };
  return (tree) => visit(tree);
}

// Typefaces come from the pinned @fontsource-variable packages and are served
// by Astro's Fonts API, which also generates size-adjusted fallbacks so text
// does not shift when the real font arrives. See docs/STYLING.md.
const fontsource = (pkg, file) => `./node_modules/@fontsource-variable/${pkg}/files/${file}`;

const fonts = [
  {
    provider: fontProviders.local(),
    name: 'Newsreader',
    cssVariable: '--font-newsreader',
    fallbacks: ['Iowan Old Style', 'Georgia', 'serif'],
    options: {
      variants: [
        { src: [fontsource('newsreader', 'newsreader-latin-wght-normal.woff2')], weight: '200 800', style: 'normal' },
        { src: [fontsource('newsreader', 'newsreader-latin-wght-italic.woff2')], weight: '200 800', style: 'italic' },
      ],
    },
  },
  {
    provider: fontProviders.local(),
    name: 'Inter',
    cssVariable: '--font-inter',
    fallbacks: ['system-ui', 'sans-serif'],
    options: {
      variants: [
        { src: [fontsource('inter', 'inter-latin-wght-normal.woff2')], weight: '100 900', style: 'normal' },
        { src: [fontsource('inter', 'inter-latin-wght-italic.woff2')], weight: '100 900', style: 'italic' },
      ],
    },
  },
  {
    provider: fontProviders.local(),
    name: 'JetBrains Mono',
    cssVariable: '--font-jetbrains-mono',
    fallbacks: ['ui-monospace', 'Menlo', 'monospace'],
    options: {
      variants: [
        { src: [fontsource('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')], weight: '100 800', style: 'normal' },
      ],
    },
  },
];

export default defineConfig({
  site: 'https://cohomolo.gy',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
  fonts,
  markdown: {
    processor: unified({
      gfm: true,
      smartypants: true,
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeSlug,
        rehypeTaskListLabels,
        [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { class: 'heading-anchor' } }],
        [rehypeKatex, { strict: 'ignore' }],
      ],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
      // `agda` is not in Shiki's bundled grammar set; adding it needs a custom
      // TextMate grammar object here. Agda fences fall back to plain text.
      langs: [
        'haskell',
        'lean4',
        'ocaml',
        'rust',
        'python',
        'typescript',
        'javascript',
        'bash',
        'nix',
        'json',
        'yaml',
        'toml',
        'diff',
        'latex',
      ],
      wrap: false,
    },
  },
});
