import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { deflateSync, inflateSync } from 'node:zlib';
import { recompressPng, rewriteIntegrity, selectFiles } from './build.mjs';

const sri = (bytes) => `sha256-${createHash('sha256').update(bytes).digest('base64')}`;

test('only listed top-level entries ship, and dev files are dropped', () => {
  const picked = selectFiles(['index.html', 'README.md', 'og.png', 'dashhq/dashhq-shell.js', 'dashhq/dashhq-shell.d.ts', 'dashhq/SHA256SUMS', 'dashhq/fonts/OFL.txt', 'dashhq/fonts/PROVENANCE.md', 'icons/hub.js.map']);
  assert.deepEqual(picked, ['index.html', 'dashhq/dashhq-shell.js', 'dashhq/fonts/OFL.txt']);
});

test('a new top-level entry stops the build until it is listed', () => {
  assert.throws(() => selectFiles(['index.html', 'new-page.html']), /new-page\.html/);
});

test('integrity follows the minified file, and a stale one is reported', () => {
  const original = new Map([['a.css', Buffer.from('a { color: red; }')]]);
  const built = new Map([['a.css', Buffer.from('a{color:red}')]]);
  const html = `<link rel="stylesheet" href="/a.css" integrity="${sri(original.get('a.css'))}" crossorigin="anonymous">`;
  const result = rewriteIntegrity(html, 'index.html', original, built);
  assert.deepEqual(result.problems, []);
  assert.ok(result.html.includes(sri(built.get('a.css'))));
  const stale = rewriteIntegrity('<script src="a.css" integrity="sha256-AAAA"></script>', 'index.html', original, built);
  assert.equal(stale.problems.length, 1);
});

test('PNG recompression keeps the pixels', () => {
  const png = readFileSync(new URL('../../icons/brands/dashscan.png', import.meta.url));
  const pixels = (bytes) => {
    const parts = [];
    for (let i = 8; i < bytes.length; ) {
      const length = bytes.readUInt32BE(i);
      if (bytes.toString('latin1', i + 4, i + 8) === 'IDAT') parts.push(bytes.subarray(i + 8, i + 8 + length));
      i += 12 + length;
    }
    return inflateSync(Buffer.concat(parts));
  };
  const out = recompressPng(png);
  assert.ok(out.length <= png.length);
  assert.deepEqual(pixels(out), pixels(png));
  assert.ok(deflateSync(Buffer.alloc(1)).length > 0);
});
