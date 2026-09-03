// WCAG 2.1 contrast ratios for the token palette in src/styles/tokens.css.
// Usage: node contrast.mjs [path/to/tokens.css]
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? new URL('../../../../../src/styles/tokens.css', import.meta.url).pathname;
const css = readFileSync(file, 'utf8');

/** Pull the `--name: #hex;` declarations out of one brace-delimited block. */
function block(selector) {
  const i = css.indexOf(selector);
  if (i < 0) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf('{', i);
  const body = css.slice(open + 1, css.indexOf('}', open));
  const out = {};
  for (const [, k, v] of body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[k] = v;
  return out;
}

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map(srgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const pairs = [
  ['text', '--color-text', '--color-bg'],
  ['muted', '--color-text-muted', '--color-bg'],
  ['faint', '--color-text-faint', '--color-bg'],
  ['accent', '--color-accent', '--color-bg'],
  ['accent-2', '--color-accent-2', '--color-bg'],
  ['accent-3', '--color-accent-3', '--color-bg'],
  ['warn', '--color-warn', '--color-bg'],
  ['text/elevated', '--color-text', '--color-bg-elevated'],
  ['muted/elevated', '--color-text-muted', '--color-bg-elevated'],
  ['faint/elevated', '--color-text-faint', '--color-bg-elevated'],
  ['accent/elevated', '--color-accent', '--color-bg-elevated'],
  ['text/inset', '--color-text', '--color-bg-inset'],
  ['rule/bg', '--color-rule', '--color-bg'],
];

const themes = { dark: block(':root {'), light: block(":root[data-theme='light']") };
// the media-query copy must equal the data-theme copy
const mq = block(':root:not([data-theme])');

let fail = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n### ${name}\n`);
  console.log('| pair | fg | bg | ratio | AA normal (4.5) | AA large (3.0) |');
  console.log('|---|---|---|---:|---|---|');
  for (const [label, fgv, bgv] of pairs) {
    const fg = t[fgv] ?? themes.dark[fgv];
    const bg = t[bgv] ?? themes.dark[bgv];
    const r = ratio(fg, bg);
    const aa = r >= 4.5 ? 'pass' : 'FAIL';
    const aaL = r >= 3 ? 'pass' : 'FAIL';
    if (['text', 'muted', 'text/elevated', 'muted/elevated'].includes(label) && r < 4.5) fail++;
    if (label.startsWith('faint') && r < 3) fail++;
    console.log(`| ${label} | \`${fg}\` | \`${bg}\` | ${r.toFixed(2)} | ${aa} | ${aaL} |`);
  }
}

console.log('\n### light data-theme vs prefers-color-scheme copy\n');
const drift = Object.keys(themes.light).filter((k) => themes.light[k] !== mq[k]);
console.log(drift.length ? `DRIFT: ${drift.join(', ')}` : 'identical — no drift');

console.log(`\nhard failures: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
