import { appendFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliCompressSync, constants as zlib } from 'node:zlib';

export const CREDITS_PER_DASH = 100_000_000_000n;
/** The dash-sites contract a publishing key must be bound to, pinned here so a dash-sites bump cannot move it. */
export const DASH_SITES_CONTRACTS = { mainnet: 'GCSi8NkjXyRpLC7FsEnCfx5ntmWZ16bD2t9zc4JiT4X3', testnet: 'CjzpdgCPJdLgVZdUu8SNacWVnrhDv34LstjPdBeJ4dT' };
/** A key must stay valid at least this long past the check, so it cannot expire mid-publish. */
export const EXPIRY_MARGIN_MS = 60 * 60 * 1000;

export function dashSitesDir(env = process.env) {
  const dir = env.DASH_SITES_DIR;
  if (!dir) throw new Error('set DASH_SITES_DIR to a dash-sites checkout built with "npm ci && npx tsc -b"');
  return resolve(dir);
}

const load = (dir, path) => import(pathToFileURL(join(dir, path)).href);

/** The built dash-sites modules this repo's scripts use, loaded from a checkout rather than installed. */
export async function loadDashSites(dir = dashSitesDir()) {
  const sdkPackage = JSON.parse(readFileSync(join(dir, 'node_modules/@dashevo/evo-sdk/package.json'), 'utf8'));
  const [core, evo, files, sdk] = await Promise.all([
    load(dir, 'packages/core/dist/index.js'),
    load(dir, 'packages/core/dist/evo.js'),
    load(dir, 'packages/cli/dist/files.js'),
    load(dir, join('node_modules/@dashevo/evo-sdk', sdkPackage.exports['.'].import)),
  ]);
  const { decompress } = createRequire(join(dir, 'package.json'))('brotli/decompress');
  return { dir, core, evo, files, sdk, brotli: brotliFor(decompress), cli: join(dir, 'packages/cli/bundle/dash-sites.mjs') };
}

/**
 * The compressor `dash-sites publish --brotli` uses (packages/cli/src/main.ts), so this builds the
 * same chunks as the CLI. Callers compare the content URI with the CLI's dry run to be sure.
 */
function brotliFor(decompress) {
  return (data) => {
    const window = Math.min(24, Math.max(10, Math.ceil(Math.log2(Math.max(data.length, 1)))));
    const compressed = new Uint8Array(brotliCompressSync(data, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11, [zlib.BROTLI_PARAM_LGWIN]: window, [zlib.BROTLI_PARAM_SIZE_HINT]: data.length } }));
    try {
      const decoded = decompress(compressed, data.length);
      if (decoded.length === data.length && decoded.every((byte, i) => byte === data[i])) return compressed;
    } catch {
      // stored as gzip
    }
    return data;
  };
}

/** Parses an amount in DASH ("0.25") into credits, exactly; refuses more precision than a credit. */
export function parseDash(text) {
  const match = /^\s*(\d+)(?:\.(\d{1,11}))?\s*(?:DASH)?\s*$/i.exec(String(text));
  if (!match) throw new Error(`not an amount of DASH: ${text}`);
  return BigInt(match[1]) * CREDITS_PER_DASH + BigInt((match[2] ?? '').padEnd(11, '0'));
}

export function formatDash(credits) {
  const whole = credits / CREDITS_PER_DASH;
  const fraction = (credits % CREDITS_PER_DASH).toString().padStart(11, '0').replace(/0+$/, '').padEnd(5, '0');
  return `${whole}.${fraction} DASH`;
}

/**
 * Reasons to refuse publishing with the key `whoami` describes, empty when it may publish.
 * `whoami` amounts are rounded down to 5 decimals, so the budget and balance checks err on refusing.
 */
export function refuseKey(whoami, { network, identityId, name, contractId, keyContract, estimate, now = Date.now() }) {
  const reasons = [];
  if (whoami.network !== network) reasons.push(`the key is for ${whoami.network}, not ${network}`);
  if (whoami.identityId !== identityId) reasons.push(`the key belongs to ${whoami.identityId}, not ${identityId}`);
  if (!whoami.names?.includes(`${name}.dash`)) reasons.push(`the identity does not own ${name}.dash`);
  if (whoami.bound !== true) reasons.push('the key is not bound to a contract; store a key bound to the dash-sites contract, never a master or other unbound key');
  else if (keyContract !== contractId) reasons.push(`the key is bound to ${keyContract ?? 'something other than one contract'}, not the dash-sites contract ${contractId}`);
  if (whoami.totalBudget === undefined) reasons.push('the key has no total budget');
  if (whoami.expiresAt === undefined) reasons.push('the key has no expiry');
  else if (!(Date.parse(whoami.expiresAt) > now + EXPIRY_MARGIN_MS)) reasons.push(`the key expires at ${whoami.expiresAt}, within the next hour or earlier`);
  if (whoami.remainingBudget === undefined) reasons.push('the key reports no remaining budget');
  else if (parseDash(whoami.remainingBudget) < estimate) reasons.push(`the key has ${whoami.remainingBudget} of budget left and this publish may cost ${formatDash(estimate)}; raise its budget or add a new key`);
  if (whoami.balance === undefined || parseDash(whoami.balance) < estimate) reasons.push(`the identity holds ${whoami.balance} and this publish may cost ${formatDash(estimate)}; top it up`);
  return reasons;
}

export function summary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  else console.error(markdown);
}

export function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

export function notice(message, level = 'notice') {
  console.log(process.env.GITHUB_ACTIONS ? `::${level}::${message}` : `${level}: ${message}`);
}

export const table = (rows) => ['| | |', '|---|---|', ...rows.map(([k, v]) => `| ${k} | ${v} |`)].join('\n');

export function args(argv, spec) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || !(key in spec)) throw new Error(`unknown argument ${argv[i]}`);
    out[key] = spec[key] === 'flag' ? true : argv[++i];
    if (out[key] === undefined) throw new Error(`${argv[i - 1]} needs a value`);
  }
  for (const [key, kind] of Object.entries(spec)) if (kind === 'required' && out[key] === undefined) throw new Error(`--${key} is required`);
  return out;
}
