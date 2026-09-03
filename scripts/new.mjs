#!/usr/bin/env node
/**
 * Start a new post or note from its template.
 *
 *   node scripts/new.mjs post "Optics from first principles"
 *   node scripts/new.mjs note            # prompts for the title
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const KINDS = ['post', 'note'];
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Reduce a title to the lower-kebab-case slug used as the filename and URL. */
function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Today as `YYYY-MM-DD` in the local timezone. */
function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Replace a frontmatter field's value, preserving any trailing comment. */
function setField(source, field, value) {
  const pattern = new RegExp(`^(${field}:)[^\\n#]*(#.*)?$`, 'm');
  return source.replace(pattern, (_match, key, comment) =>
    `${key} ${value}${comment ? ` ${comment}` : ''}`.trimEnd(),
  );
}

async function main() {
  const [kind, ...rest] = process.argv.slice(2);

  if (!KINDS.includes(kind)) {
    console.error(`usage: node scripts/new.mjs <${KINDS.join('|')}> [title]`);
    return 1;
  }

  let title = rest.join(' ').trim();
  if (title === '') {
    const rl = createInterface({ input: stdin, output: stdout });
    title = (await rl.question(`Title of the new ${kind}: `)).trim();
    rl.close();
  }

  if (title === '') {
    console.error('a title is required');
    return 1;
  }

  const slug = slugify(title);
  if (slug === '') {
    console.error(`cannot derive a slug from ${JSON.stringify(title)}`);
    return 1;
  }

  const dir = join(ROOT, 'src', 'content', `${kind}s`);
  const template = join(dir, '_template.md');
  const destination = join(dir, `${slug}.md`);

  if (existsSync(destination)) {
    console.error(`refusing to overwrite ${destination}`);
    return 1;
  }

  let body = readFileSync(template, 'utf8');
  body = setField(body, 'title', `'${title.replace(/'/g, "''")}'`);
  body = setField(body, 'date', today());
  writeFileSync(destination, body, { flag: 'wx' });

  console.log(destination);
  return 0;
}

process.exit(await main());
