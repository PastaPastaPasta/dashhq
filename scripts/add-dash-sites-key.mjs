#!/usr/bin/env node
// Adds one limited publishing key to a Dash Platform identity, for the dashhq Dash Sites workflow.
// Run once, on your own machine, with the identity file dash-bridge wrote:
//
//   DASH_SITES_DIR=~/workspace/dash-sites node scripts/add-dash-sites-key.mjs <identity.json> \
//     --budget 0.25 --expires 2027-11-27 [--network mainnet|testnet] [--out <file>]
// <file> defaults to ~/dash-sites-publish-key.<network>.wif, outside the repository.
//
// The new key is an ECDSA_HASH160 AUTHENTICATION key of level HIGH, bound to the dash-sites contract
// only, with the total budget and expiry you choose, added in an identity update signed by the
// MASTER key. Its WIF is written only to <file> (mode 0600), never to the terminal.
//
//   node scripts/add-dash-sites-key.mjs <identity.json> --disable <keyId> [--network ...]
// disables a key instead (revocation), signed by the MASTER key.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { args, CREDITS_PER_DASH, formatDash, loadDashSites, parseDash } from './dash-site/lib.mjs';

const REPO = 'PastaPastaPasta/dashhq';
const SECRET = 'DASH_SITES_PUBLISH_KEY';
const DAY_MS = 24 * 60 * 60 * 1000;
/** An identity update adding one key with limits cost 0.00043 DASH on testnet (protocol 14); this rounds up. */
const FEE_ESTIMATE = 100_000_000n;
const MAX_BUDGET = 5n * CREDITS_PER_DASH;

export function parseExpiry(text, now = Date.now()) {
  const ms = /^\d{4}-\d{2}-\d{2}$/.test(text ?? '') ? Date.parse(`${text}T00:00:00Z`) : Number.NaN;
  if (!Number.isFinite(ms)) throw new Error(`--expires must be a date such as 2027-11-27, not ${text}`);
  if (ms <= now + DAY_MS) throw new Error('--expires must be more than a day from now');
  if (ms > now + 5 * 366 * DAY_MS) throw new Error('--expires must be within five years');
  return ms;
}

export function parseBudget(text) {
  const credits = parseDash(text ?? '');
  if (credits <= 0n) throw new Error('--budget must be more than 0 DASH');
  if (credits > MAX_BUDGET) throw new Error(`--budget must be at most ${formatDash(MAX_BUDGET)}`);
  return credits;
}

export function masterKeyOf(record) {
  if (typeof record?.identityId !== 'string' || !Array.isArray(record.identityKeys)) throw new Error('the identity file has no identityId and identityKeys (the dash-bridge format)');
  const master = record.identityKeys.find((key) => key.purpose === 'AUTHENTICATION' && key.securityLevel === 'MASTER');
  if (!master?.privateKeyWif) throw new Error('the identity file has no AUTHENTICATION/MASTER key');
  return master.privateKeyWif;
}

/** The key to add, and its private key. Builds the key only; nothing is sent. */
export function newPublishingKey(sdk, { network, keyId, contractId, totalBudget, expiresAt, secret = randomBytes(32) }) {
  const privateKey = sdk.PrivateKey.fromBytes(secret, network);
  const key = new sdk.IdentityPublicKeyInCreation({
    keyId,
    purpose: 'authentication',
    securityLevel: 'high',
    keyType: 'ecdsa_hash160',
    isReadOnly: false,
    data: Buffer.from(privateKey.getPublicKeyHash(), 'hex'),
    contractBounds: sdk.ContractBounds.SingleContract(contractId),
    totalBudget,
    expiresAt: BigInt(expiresAt),
  });
  return { key, privateKey };
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    return /^y(?:es)?$/i.test((await rl.question(question)).trim());
  } finally {
    rl.close();
  }
}

/** Throws unless the MASTER WIF in the file is a live MASTER key of the identity. */
async function checkMaster(sdk, identity, masterWif) {
  const master = sdk.PrivateKey.fromWIF(masterWif);
  try {
    const candidates = [master.getPublicKeyHash(), (await sdk.wallet.keyPairFromWif(masterWif)).publicKey].map((hex) => hex.toLowerCase());
    const match = identity.publicKeys.find((key) => candidates.includes(String(key.data).toLowerCase()) && key.disabledAt === undefined);
    if (!match || match.securityLevel !== 'MASTER') throw new Error('the MASTER key in the identity file is not a live MASTER key of this identity');
  } finally {
    master.free();
  }
}

async function main() {
  const [file, ...rest] = process.argv.slice(2);
  if (!file || file.startsWith('--')) throw new Error('usage: add-dash-sites-key.mjs <identity.json> --budget <DASH> --expires <YYYY-MM-DD> [--network mainnet|testnet] [--out <file>] | --disable <keyId>');
  const opts = args(rest, { network: 'optional', budget: 'optional', expires: 'optional', out: 'optional', disable: 'optional' });
  const network = opts.network ?? 'mainnet';
  if (network !== 'mainnet' && network !== 'testnet') throw new Error('--network must be mainnet or testnet');
  const record = JSON.parse(readFileSync(file, 'utf8'));
  if (record.network && record.network !== network) throw new Error(`the identity file is for ${record.network}; pass --network ${record.network}`);
  const masterWif = masterKeyOf(record);

  const ds = await loadDashSites();
  const { sdk: wasm, core, evo } = ds;
  const contractId = core.networkConfig(network).contractId;
  const sdk = await evo.connectSdk(core.readerConfig(network));
  const identity = await sdk.identities.fetch(record.identityId);
  if (!identity) throw new Error(`identity ${record.identityId} does not exist on ${network}`);
  await checkMaster(wasm, identity, masterWif);
  const balance = BigInt((await sdk.identities.balance(record.identityId)) ?? 0n);
  const signer = new wasm.IdentitySigner();
  signer.addKey(wasm.PrivateKey.fromWIF(masterWif));

  if (opts.disable !== undefined) {
    const keyId = Number(opts.disable);
    const key = identity.publicKeys.find((k) => k.keyId === keyId);
    if (!key) throw new Error(`identity has no key ${opts.disable}`);
    if (key.disabledAt !== undefined) throw new Error(`key ${keyId} is already disabled`);
    if (key.securityLevel === 'MASTER' || key.securityLevel === 'CRITICAL') throw new Error(`key ${keyId} is ${key.securityLevel}; this disables publishing keys only`);
    console.error(`Disable key ${keyId} (${key.purpose}/${key.securityLevel}) of ${record.identityId} on ${network}, signed by the MASTER key.`);
    if (!(await confirm('Broadcast? [y/N] '))) throw new Error('cancelled; nothing sent');
    await sdk.identities.update({ identity, disablePublicKeys: [keyId], signer });
    console.error(`key ${keyId} disabled; the workflow refuses it from now on. Delete the secret too: gh secret delete ${SECRET} -R ${REPO}`);
    return;
  }

  const totalBudget = parseBudget(opts.budget);
  const expiresAt = parseExpiry(opts.expires);
  const out = opts.out ?? join(homedir(), `dash-sites-publish-key.${network}.wif`);
  if (existsSync(out)) throw new Error(`${out} exists; pass another --out or remove it`);
  const keyId = Math.max(...identity.publicKeys.map((key) => key.keyId)) + 1;
  const { key, privateKey } = newPublishingKey(wasm, { network, keyId, contractId, totalBudget, expiresAt });

  console.error(
    [
      `Add to identity ${record.identityId} on ${network}:`,
      `  key id:     ${keyId}`,
      `  key:        AUTHENTICATION / HIGH / ECDSA_HASH160 ${privateKey.getPublicKeyHash()}`,
      `  bound to:   dash-sites contract ${contractId} only (cannot register names, transfer or withdraw)`,
      `  budget:     ${formatDash(totalBudget)} in total`,
      `  expires:    ${new Date(expiresAt).toISOString()}`,
      `  signed by:  the MASTER key in ${file}`,
      `  fee:        about ${formatDash(FEE_ESTIMATE)}, from the identity balance of ${formatDash(balance)}`,
      `  WIF to:     ${out} (mode 0600, not shown)`,
    ].join('\n'),
  );
  if (balance < FEE_ESTIMATE) throw new Error('the identity balance does not cover the fee; top it up first');
  if (!(await confirm('Broadcast this identity update? [y/N] '))) throw new Error('cancelled; nothing sent');

  writeFileSync(out, privateKey.toWIF(), { mode: 0o600, flag: 'wx' });
  signer.addKey(privateKey);
  try {
    await sdk.identities.update({ identity, addPublicKeys: [key], signer });
  } catch (error) {
    throw new Error(`${error?.message ?? error}. The update may still have reached Platform, so ${out} is kept: check whether key ${keyId} exists, and disable it with --disable ${keyId} if it does; otherwise shred the file`);
  }
  const after = await sdk.identities.fetch(record.identityId);
  const added = after?.publicKeys.find((k) => k.keyId === keyId);
  const spent = balance - BigInt((await sdk.identities.balance(record.identityId)) ?? 0n);
  console.error(
    [
      '',
      added ? `Added key ${keyId}; the update cost ${formatDash(spent)}.` : `Sent; key ${keyId} is not visible yet. Check with: dash-sites whoami`,
      '',
      network === 'mainnet' ? 'Store it as the workflow secret, then delete the file:' : 'This is a testnet key; the workflow publishes on mainnet. Delete the file when done:',
      ...(network === 'mainnet' ? [`  gh secret set ${SECRET} -R ${REPO} < ${out}`] : []),
      `  shred -u ${out}`,
      '',
      `To revoke later: node scripts/add-dash-sites-key.mjs ${file} --network ${network} --disable ${keyId}`,
    ].join('\n'),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().then(
    () => process.exit(0),
    (error) => {
      console.error(`add-dash-sites-key: ${error?.message ?? error}`);
      process.exit(1);
    },
  );
}
