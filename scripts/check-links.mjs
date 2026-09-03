#!/usr/bin/env node
/**
 * Verify that every site-relative link in the built output resolves to a file
 * on disk. Zero dependencies; run it against `dist` after `astro build`.
 *
 *   node scripts/check-links.mjs dist
 *   node scripts/check-links.mjs --self-test
 */

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { join, posix, relative, dirname } from 'node:path';
import { tmpdir } from 'node:os';

/** The canonical origin; absolute links to it are checked like relative ones. */
const SITE_ORIGIN = 'https://cohomolo.gy';

/** Schemes that leave the site or never hit the filesystem. */
const IGNORED_SCHEME = /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i;

/** Collect every `dist/**\/*.html` path. */
function findHtmlFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) out.push(full);
    }
  };
  walk(root);
  return out;
}

/** Pull every linkable target out of one page's HTML. */
function extractTargets(html) {
  const targets = [];

  for (const [, value] of html.matchAll(/(?:href|src)\s*=\s*"([^"]*)"/gi)) {
    targets.push(value);
  }

  for (const [, value] of html.matchAll(/srcset\s*=\s*"([^"]*)"/gi)) {
    for (const candidate of value.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) targets.push(url);
    }
  }

  // Social card images live in meta content, not href/src.
  const meta = /<meta\b[^>]*\b(?:property|name)\s*=\s*"(?:og:image|twitter:image)"[^>]*>/gi;
  for (const [tag] of html.matchAll(meta)) {
    const content = /\bcontent\s*=\s*"([^"]*)"/i.exec(tag);
    if (content) targets.push(content[1]);
  }

  return targets;
}

/**
 * Reduce a raw target to a site-absolute path, or null if it is not ours to check.
 */
function normalizeTarget(raw, pageDir) {
  let target = raw.trim();
  if (target === '') return null;

  if (target.startsWith(`${SITE_ORIGIN}/`) || target === SITE_ORIGIN) {
    target = target.slice(SITE_ORIGIN.length) || '/';
  } else if (IGNORED_SCHEME.test(target) || target.startsWith('//')) {
    return null;
  }

  target = target.split('#')[0].split('?')[0];
  if (target === '') return null;

  return target.startsWith('/') ? target : posix.join('/', pageDir, target);
}

/** A target resolves if it names a file, a directory index, or a sibling `.html`. */
function resolves(root, target) {
  const rel = target.replace(/^\/+/, '');
  const isFile = (p) => {
    try {
      return statSync(p).isFile();
    } catch {
      return false;
    }
  };
  const base = join(root, rel);
  return isFile(base) || isFile(join(base, 'index.html')) || isFile(`${base}.html`);
}

/**
 * Check every page under `root`. Prints misses as `page → target`.
 * Returns 1 if any link dangles, 0 otherwise.
 */
function checkDist(root) {
  let pages = [];
  try {
    pages = findHtmlFiles(root);
  } catch {
    console.error(`cannot read build directory: ${root}`);
    return 1;
  }

  const misses = [];
  let linkCount = 0;

  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    const pageName = relative(root, page);
    const pageDir = dirname(pageName) === '.' ? '' : dirname(pageName);

    for (const raw of extractTargets(html)) {
      const target = normalizeTarget(raw, pageDir);
      if (target === null) continue;
      linkCount += 1;
      if (!resolves(root, target)) misses.push(`${pageName} → ${target}`);
    }
  }

  if (misses.length > 0) {
    for (const miss of misses) console.error(miss);
    console.error(`${misses.length} broken link(s)`);
    return 1;
  }

  console.log(`ok: ${pages.length} pages, ${linkCount} links`);
  return 0;
}

function selfTest() {
  const base = mkdtempSync(join(tmpdir(), 'check-links-'));

  const clean = join(base, 'clean');
  mkdirSync(clean, { recursive: true });
  writeFileSync(join(clean, 'index.html'), '<a href="/about/">about</a>');
  mkdirSync(join(clean, 'about'), { recursive: true });
  writeFileSync(join(clean, 'about', 'index.html'), '<p>about</p>');

  const broken = join(base, 'broken');
  mkdirSync(broken, { recursive: true });
  writeFileSync(join(broken, 'index.html'), '<a href="/nowhere/">gone</a>');

  const cleanCode = checkDist(clean);
  const brokenCode = checkDist(broken);
  rmSync(base, { recursive: true, force: true });

  if (cleanCode !== 0) throw new Error(`clean fixture should pass, got exit ${cleanCode}`);
  if (brokenCode !== 1) throw new Error(`broken fixture should fail, got exit ${brokenCode}`);

  console.log('self-test ok');
  return 0;
}

const args = process.argv.slice(2);
process.exit(args.includes('--self-test') ? selfTest() : checkDist(args[0] ?? 'dist'));
