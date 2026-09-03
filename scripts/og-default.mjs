#!/usr/bin/env node
/**
 * Render the fallback Open Graph image shipped as a static asset.
 *
 *   npm run og:default
 *
 * Pages without an entry of their own — the home page, the tag index, error
 * pages — point at `/og/default.png`. It is generated rather than drawn so it
 * cannot drift from the card design in `src/lib/og.ts`, and it is committed so
 * the site builds without a rendering step for it.
 *
 * Requires Node 22.18 or newer, which strips the types from the imported `.ts`
 * modules without a build step.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { renderOg } from '../src/lib/og.ts';
import { SITE } from '../src/site.config.ts';

const OUTPUT = new URL('../public/og/default.png', import.meta.url);

const png = await renderOg({
  title: SITE.title,
  description: SITE.author.bio,
  kind: 'site',
});

mkdirSync(new URL('.', OUTPUT), { recursive: true });
writeFileSync(OUTPUT, png);

console.log(`${fileURLToPath(OUTPUT)} — ${png.length} bytes`);
