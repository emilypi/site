// Count <item> elements in dist/rss.xml and compare with published entries on disk.
import { readFileSync, readdirSync } from 'node:fs';

const feed = readFileSync('dist/rss.xml', 'utf8');
const items = (feed.match(/<item>/g) ?? []).length;
const published = ['src/content/posts', 'src/content/notes']
  .flatMap((dir) => readdirSync(dir).map((name) => `${dir}/${name}`))
  .filter((path) => !path.split('/').pop().startsWith('_'))
  .filter((path) => !/^draft:\s*true$/m.test(readFileSync(path, 'utf8')));

console.log('rss 2.0 declared :', /<rss[^>]*version="2\.0"/.test(feed));
console.log('well-formed tags :', (feed.match(/<item>/g) ?? []).length === (feed.match(/<\/item>/g) ?? []).length);
console.log('<item> count     :', items);
console.log('published entries:', Math.min(published.length, 20));
process.exit(items === Math.min(published.length, 20) ? 0 : 1);
