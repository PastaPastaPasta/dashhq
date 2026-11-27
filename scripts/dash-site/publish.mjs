#!/usr/bin/env node
// Publishes the planned build with the key in DASH_SITES_KEY, after checking that the key is a
// limited one: bound to the dash-sites contract, with a budget and an expiry, and enough left.
// Never prints the key; it reaches only the dash-sites CLI, through the environment.
//   DASH_SITES_DIR=<checkout> DASH_SITES_KEY=<wif> node scripts/dash-site/publish.mjs \
//     --plan <plan.json> --site <dir> --identity <id> [--check-only]
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { args, DASH_SITES_CONTRACTS, formatDash, loadDashSites, notice, parseDash, refuseKey, summary, table } from './lib.mjs';

function cli(ds, argv) {
  const run = spawnSync(process.execPath, [ds.cli, ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], env: process.env, maxBuffer: 64 * 1024 * 1024 });
  if (run.status !== 0) throw new Error(`dash-sites ${argv[0]} failed (exit ${run.status})`);
  return JSON.parse(run.stdout);
}

/** The contract a key of the identity is bound to, read from Platform without the key. */
async function keyContract(ds, network, identityId, keyId) {
  const sdk = await ds.evo.connectSdk(ds.core.readerConfig(network));
  const identity = await sdk.identities.fetch(identityId);
  const key = identity?.publicKeys.find((k) => k.keyId === keyId);
  const bounds = key?.contractBounds?.toJSON();
  return bounds?.$type === 'singleContract' && typeof bounds.id === 'string' ? bounds.id : undefined;
}

async function main() {
  const opts = args(process.argv.slice(2), { plan: 'required', site: 'required', identity: 'required', 'check-only': 'flag' });
  const plan = JSON.parse(readFileSync(opts.plan, 'utf8'));
  if (plan.upToDate) {
    notice(`${plan.name}.dash.site already serves ${plan.content}; nothing to publish`);
    summary(`Nothing published: ${plan.name}.dash.site already serves this build.`);
    return;
  }
  process.env.DASH_SITES_KEY = (process.env.DASH_SITES_KEY ?? '').trim();
  if (!process.env.DASH_SITES_KEY) {
    notice('DASH_SITES_KEY is not set; nothing published');
    return;
  }
  const ds = await loadDashSites();
  const network = plan.network;
  const contractId = DASH_SITES_CONTRACTS[network];
  if (!contractId || ds.core.networkConfig(network).contractId !== contractId) {
    throw new Error(`dash-sites at DASH_SITES_REF uses contract ${ds.core.networkConfig(network).contractId} on ${network}, not ${contractId}; check the pin before publishing`);
  }
  const whoami = cli(ds, ['whoami', '--network', network, '--identity', opts.identity]);
  const estimate = BigInt(plan.estimate);
  const reasons = refuseKey(whoami, {
    network,
    identityId: opts.identity,
    name: plan.name,
    contractId,
    keyContract: whoami.bound ? await keyContract(ds, network, opts.identity, whoami.keyId) : undefined,
    estimate,
  });
  summary(
    `### Key check\n\n${table([
      ['Key', `${whoami.keyId} of \`${whoami.identityId}\``],
      ['Bound to dash-sites', whoami.bound ? 'yes' : 'no'],
      ['Budget', `${whoami.remainingBudget ?? '?'} left of ${whoami.totalBudget ?? 'no budget'}`],
      ['Expires', whoami.expiresAt ?? 'never'],
      ['Identity balance', whoami.balance],
      ['This publish (estimate)', formatDash(estimate)],
    ])}\n`,
  );
  if (reasons.length) {
    for (const reason of reasons) notice(reason, 'error');
    summary(`**Refused to publish:**\n\n${reasons.map((r) => `- ${r}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  if (opts['check-only']) {
    notice('the key may publish this build; --check-only, so nothing was published');
    return;
  }

  const result = cli(ds, ['publish', opts.site, '--name', plan.name, '--network', network, '--identity', opts.identity, ...(plan.brotli ? ['--brotli'] : [])]);
  if (result.content !== plan.content) throw new Error(`published ${result.content}, but the plan built ${plan.content}`);
  summary(
    `### Published ${plan.name}.dash.site\n\n${table([
      ['Revision', result.revision],
      ['Content', `\`${result.content}\``],
      ['Chunks uploaded', result.uploaded],
      ['Chunks reused', result.reused],
      ['Spent', result.spent],
      ['Estimate was', formatDash(estimate)],
      ['Key budget left before', whoami.remainingBudget],
    ])}\n\nhttps://${plan.name}.dash.site/\n`,
  );
  if (!String(result.spent).startsWith('-') && parseDash(result.spent) > estimate) notice(`spent ${result.spent}, more than the estimate of ${formatDash(estimate)}`, 'warning');
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (error) => {
    console.error(`publish.mjs: ${error?.message ?? error}`);
    process.exit(1);
  },
);
