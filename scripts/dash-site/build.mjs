#!/usr/bin/env node
// Builds the copy of dashhq.org published to Dash Sites: the public files only, minified, with
// lossless image optimisation. The repository stays as it is; GitHub Pages serves it unchanged.
//   node scripts/dash-site/build.mjs <out-dir> [--raw]
// --raw stages the same files unminified, to compare against.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, join, posix } from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';

/** Top-level entries of the repository that are part of the site. */
const INCLUDE = ['404.html', 'index.html', 'favicon.svg', 'hub.css', 'hub.js', 'pulse.js', 'retired.css', 'dashhq', 'directory', 'icons', 'identity'];

/**
 * Top-level entries that are not: docs, Pages settings, tooling. `og.png` is only ever linked as
 * https://dashhq.org/og.png (the og:image), so the copy does not need its own.
 */
const EXCLUDE = ['.github', '.gitignore', '.nojekyll', 'CNAME', 'README.md', 'SHELL.md', 'DEPLOY.md', 'lab', 'scripts', 'og.png'];

/**
 * Files inside included directories that no page loads: the shell's types, Tailwind preset and
 * release metadata, the font's provenance note, and the retired-site script. The font licence stays.
 */
const DROP = [
  /^dashhq\/.*\.d\.ts$/,
  /^dashhq\/dashhq-tailwind-preset\.cjs$/,
  /^dashhq\/(PINNED|SHA256SUMS|VERSION)$/,
  /^dashhq\/fonts\/PROVENANCE\.md$/,
  /^dashhq\/moved\.js$/,
  /\.map$/,
];

/** SVG sprites whose symbols pages address by id; their ids and hidden symbols must survive. */
const SPRITES = new Set(['icons/directory.svg']);

/** svgo's default preset, less every plugin that rounds numbers or rewrites geometry, so pixels stay the same. */
const LOSSLESS_SVG = {
  cleanupIds: false,
  cleanupNumericValues: false,
  convertPathData: false,
  convertTransform: false,
  convertShapeToPath: false,
  mergePaths: false,
  convertColors: false,
  minifyStyles: false,
  inlineStyles: false,
};

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: dirname(new URL(import.meta.url).pathname), encoding: 'utf8' }).trim();

export function selectFiles(tracked) {
  const tops = [...new Set(tracked.map((path) => path.split('/')[0]))];
  const unknown = tops.filter((top) => !INCLUDE.includes(top) && !EXCLUDE.includes(top));
  if (unknown.length) throw new Error(`add these to INCLUDE or EXCLUDE in scripts/dash-site/build.mjs: ${unknown.join(', ')}`);
  return tracked.filter((path) => INCLUDE.includes(path.split('/')[0]) && !DROP.some((re) => re.test(path)));
}

const sri = (algo, bytes) => `${algo}-${createHash(algo).update(bytes).digest('base64')}`;

/**
 * Rewrites the integrity of every local stylesheet and script a page loads to match the minified
 * file. An integrity that does not match the original file is left alone and reported, since the
 * page is already broken on Pages and the copy should fail the same way rather than be fixed.
 */
export function rewriteIntegrity(html, page, original, built) {
  const problems = [];
  const out = html.replace(/<(?:link|script)\b[^>]*>/gi, (tag) => {
    const integrity = /\sintegrity=(["'])([^"']+)\1/i.exec(tag);
    const ref = /\s(?:href|src)=(["'])([^"']+)\1/i.exec(tag);
    if (!integrity || !ref || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(ref[2])) return tag;
    const path = posix.normalize(ref[2].startsWith('/') ? ref[2].slice(1) : posix.join(posix.dirname(page), ref[2])).split(/[?#]/)[0];
    if (!original.has(path) || !built.has(path)) {
      problems.push(`${page}: ${ref[2]} is not part of the site`);
      return tag;
    }
    const [algo] = integrity[2].split('-');
    if (sri(algo, original.get(path)) !== integrity[2]) {
      problems.push(`${page}: the integrity of ${ref[2]} does not match the file`);
      return tag;
    }
    return tag.replace(integrity[2], sri(algo, built.get(path)));
  });
  return { html: out, problems };
}

/** Re-deflates a PNG's image data at the highest level and drops text and time chunks. Pixels and colour chunks stay. */
export function recompressPng(bytes) {
  const signature = bytes.subarray(0, 8);
  const chunks = [];
  for (let i = 8; i < bytes.length; ) {
    const length = bytes.readUInt32BE(i);
    chunks.push({ type: bytes.toString('latin1', i + 4, i + 8), data: bytes.subarray(i + 8, i + 8 + length) });
    i += 12 + length;
  }
  const idat = inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  const best = [0, 1, 2, 3].map((strategy) => deflateSync(idat, { level: 9, memLevel: 9, strategy })).sort((a, b) => a.length - b.length)[0];
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const encode = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, 'latin1');
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, tail]);
  };
  const drop = new Set(['tEXt', 'zTXt', 'iTXt', 'tIME']);
  const parts = [signature];
  let wroteIdat = false;
  for (const chunk of chunks) {
    if (drop.has(chunk.type)) continue;
    if (chunk.type === 'IDAT') {
      if (!wroteIdat) parts.push(encode('IDAT', best));
      wroteIdat = true;
      continue;
    }
    parts.push(encode(chunk.type, chunk.data));
  }
  const out = Buffer.concat(parts);
  return out.length < bytes.length ? out : bytes;
}

async function minifiers() {
  const tools = join(root, 'scripts/dash-site/node_modules');
  if (!existsSync(tools)) throw new Error('run "npm ci --ignore-scripts --prefix scripts/dash-site" first');
  const [{ transform }, { minify: html }, { optimize }] = await Promise.all([import('esbuild'), import('html-minifier-terser'), import('svgo')]);
  return {
    js: async (text) => (await transform(text, { loader: 'js', minify: true, legalComments: 'inline', charset: 'utf8' })).code,
    css: async (text) => (await transform(text, { loader: 'css', minify: true, legalComments: 'inline', charset: 'utf8' })).code,
    html: (text) =>
      html(text, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
        minifyCSS: false,
        minifyJS: false,
        keepClosingSlash: true,
        caseSensitive: true,
      }),
    svg: (text, path) =>
      optimize(text, {
        path,
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                ...LOSSLESS_SVG,
                ...(SPRITES.has(path) ? { removeHiddenElems: false, removeUselessDefs: false, collapseGroups: false } : {}),
              },
            },
          },
        ],
      }).data,
  };
}

export async function build(out, { raw = false } = {}) {
  if (existsSync(out) && readdirSync(out).length) throw new Error(`${out} is not empty`);
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  const paths = selectFiles(tracked);
  const original = new Map(paths.map((path) => [path, readFileSync(join(root, path))]));
  const built = new Map(original);
  if (!raw) {
    const min = await minifiers();
    for (const [path, bytes] of original) {
      const text = bytes.toString('utf8');
      let next;
      if (path.endsWith('.js')) next = Buffer.from(await min.js(text));
      else if (path.endsWith('.css')) next = Buffer.from(await min.css(text));
      else if (path.endsWith('.svg')) next = Buffer.from(min.svg(text, path));
      else if (path.endsWith('.html')) next = Buffer.from(await min.html(text));
      else if (path.endsWith('.png')) next = recompressPng(bytes);
      if (next && next.length < bytes.length) built.set(path, next);
    }
    const problems = [];
    for (const path of paths.filter((p) => p.endsWith('.html'))) {
      const result = rewriteIntegrity(built.get(path).toString('utf8'), path, original, built);
      built.set(path, Buffer.from(result.html));
      problems.push(...result.problems);
    }
    if (problems.length) throw new Error(problems.join('\n'));
  }
  for (const [path, bytes] of built) {
    mkdirSync(dirname(join(out, path)), { recursive: true });
    writeFileSync(join(out, path), bytes);
  }
  const before = [...original.values()].reduce((sum, b) => sum + b.length, 0);
  const after = [...built.values()].reduce((sum, b) => sum + b.length, 0);
  console.error(`built ${built.size} of ${tracked.length} tracked files in ${out}: ${before} -> ${after} bytes`);
  return { files: built.size, before, after };
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const [out, flag] = process.argv.slice(2);
  if (!out || (flag && flag !== '--raw')) {
    console.error('usage: build.mjs <out-dir> [--raw]');
    process.exit(2);
  }
  await build(out, { raw: flag === '--raw' }).catch((error) => {
    console.error(`build.mjs: ${error.message}`);
    process.exit(1);
  });
}
