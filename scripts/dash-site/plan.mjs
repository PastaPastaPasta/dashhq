#!/usr/bin/env node
// Builds the bundle `dash-sites publish` would store, checks it against the CLI's dry run, and
// compares it with what the name serves now (read-only): which chunks are already stored, and what
// publishing would cost. Writes plan.json and the job summary. Needs no key.
//   DASH_SITES_DIR=<checkout> node scripts/dash-site/plan.mjs --site <dir> --name <name> \
//     --network mainnet --dry-run <dry-run.json> --out <plan.json> [--brotli]
import { readFileSync, writeFileSync } from 'node:fs';
import { args, formatDash, loadDashSites, output, summary, table } from './lib.mjs';

const QUERY_BATCH = 100;

async function retry(what, run, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= attempts) throw new Error(`${what}: ${error?.message ?? error}`);
      console.error(`${what} failed (${error?.message ?? error}); trying again`);
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
}

export async function plan({ site, name, network, dryRun, brotli }, ds) {
  const { core, evo, files } = ds;
  const bundle = core.buildSite(await files.readSiteDirectory(site), brotli ? { brotli: ds.brotli } : {});
  if (dryRun && bundle.contentUri !== dryRun.content) {
    throw new Error(`this build gives ${bundle.contentUri} but the CLI dry run gives ${dryRun.content}; the two builds must match`);
  }
  const hashes = [...bundle.chunks.keys()];
  const reader = await retry('connecting to Platform', () => evo.EvoReader.connect(core.readerConfig(network)));
  const live = await retry(`resolving ${name}`, () => core.resolveName(reader, name));
  if (live.status === 'invalid' || live.status === 'unregistered') throw new Error(`${name} is ${live.status} on ${network}`);
  const present = new Set();
  if (live.site) {
    for (let i = 0; i < hashes.length; i += QUERY_BATCH) {
      const found = await retry('reading stored chunks', () => reader.getChunks(live.site.id, hashes.slice(i, i + QUERY_BATCH)));
      for (const hash of found.keys()) present.add(hash);
    }
  }
  const missing = hashes.filter((hash) => !present.has(hash));
  return {
    name,
    network,
    owner: live.ownerId,
    content: bundle.contentUri,
    brotli: Boolean(brotli),
    stats: bundle.stats,
    firstPublish: core.estimateCredits(bundle).toString(),
    live: {
      status: live.status,
      ...(live.site ? { siteId: live.site.id, revision: live.site.revision, content: live.site.content } : {}),
      height: live.meta.height,
    },
    storedChunks: present.size,
    missingChunks: missing.length,
    missingBytes: missing.reduce((sum, hash) => sum + bundle.chunks.get(hash).length, 0),
    estimate: core.estimateCredits(bundle, missing).toString(),
    upToDate: live.status === 'ok' && live.site.content === bundle.contentUri,
  };
}

export function describe(result) {
  const s = result.stats;
  return table([
    ['Name', `${result.name} on ${result.network} (owner \`${result.owner}\`)`],
    ['Files', s.files],
    ['Bytes', s.bytes.toLocaleString('en-US')],
    ['Stored bytes', `${s.storedBytes.toLocaleString('en-US')} (${result.brotli ? 'brotli where smaller, else gzip' : 'gzip'})`],
    ['Chunks', s.chunks],
    ['First-publish estimate', formatDash(BigInt(result.firstPublish))],
    ['Live site', result.live.revision ? `revision ${result.live.revision} at height ${result.live.height}, \`${result.live.content ?? 'taken down'}\`` : result.live.status],
    ['Built content', `\`${result.content}\``],
    ['Chunks already stored', `${result.storedChunks} of ${s.chunks}`],
    ['Chunks to upload', `${result.missingChunks} (${result.missingBytes.toLocaleString('en-US')} bytes)`],
    ['Incremental estimate', result.upToDate ? 'nothing to publish' : formatDash(BigInt(result.estimate))],
    ['Up to date', result.upToDate ? 'yes: the name already serves this build' : 'no'],
  ]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const opts = args(process.argv.slice(2), { site: 'required', name: 'required', network: 'required', 'dry-run': 'optional', out: 'required', brotli: 'flag' });
    const dryRun = opts['dry-run'] ? JSON.parse(readFileSync(opts['dry-run'], 'utf8')) : undefined;
    const result = await plan({ ...opts, dryRun }, await loadDashSites());
    writeFileSync(opts.out, `${JSON.stringify(result, null, 2)}\n`);
    summary(`### Dash Sites: ${result.name}.dash.site\n\n${describe(result)}\n`);
    output('up_to_date', result.upToDate);
    output('content', result.content);
    process.exit(0);
  } catch (error) {
    console.error(`plan.mjs: ${error?.message ?? error}`);
    process.exit(1);
  }
}
