import assert from 'node:assert/strict';
import { test } from 'node:test';
import { masterKeyOf, newPublishingKey, parseBudget, parseExpiry } from './add-dash-sites-key.mjs';
import { loadDashSites } from './dash-site/lib.mjs';

const NOW = Date.parse('2026-11-27T00:00:00Z');

test('budget and expiry are checked before anything is built', () => {
  assert.equal(parseBudget('0.25'), 25_000_000_000n);
  assert.throws(() => parseBudget('0'));
  assert.throws(() => parseBudget('6'));
  assert.equal(parseExpiry('2027-11-27', NOW), Date.parse('2027-11-27T00:00:00Z'));
  assert.throws(() => parseExpiry('2026-11-27', NOW), /more than a day/);
  assert.throws(() => parseExpiry('2035-01-01', NOW), /five years/);
  assert.throws(() => parseExpiry('next year', NOW));
});

test('the MASTER key is taken from a dash-bridge identity file', () => {
  const record = { identityId: 'ID', identityKeys: [{ purpose: 'AUTHENTICATION', securityLevel: 'HIGH', privateKeyWif: 'high' }, { purpose: 'AUTHENTICATION', securityLevel: 'MASTER', privateKeyWif: 'master' }] };
  assert.equal(masterKeyOf(record), 'master');
  assert.throws(() => masterKeyOf({ identityId: 'ID', identityKeys: [] }), /MASTER/);
});

test('the new key is HIGH ECDSA_HASH160 authentication, bound to the contract, with budget and expiry', { skip: !process.env.DASH_SITES_DIR && 'needs DASH_SITES_DIR' }, async () => {
  const { sdk, core } = await loadDashSites();
  await sdk.ensureInitialized();
  const contractId = core.networkConfig('mainnet').contractId;
  const secret = Buffer.alloc(32, 7);
  const { key, privateKey } = newPublishingKey(sdk, { network: 'mainnet', keyId: 4, contractId, totalBudget: 25_000_000_000n, expiresAt: Date.parse('2027-11-27T00:00:00Z'), secret });
  const json = key.toJSON();
  assert.equal(json.id ?? json.keyId, 4);
  assert.equal(String(key.purpose ?? json.purpose).toUpperCase(), 'AUTHENTICATION');
  assert.equal(String(key.securityLevel ?? json.securityLevel).toUpperCase(), 'HIGH');
  assert.equal(String(key.keyType ?? json.type ?? json.keyType).toUpperCase(), 'ECDSA_HASH160');
  assert.equal(Buffer.from(key.data).toString('hex'), privateKey.getPublicKeyHash());
  assert.deepEqual(key.contractBounds.toJSON(), sdk.ContractBounds.SingleContract(contractId).toJSON());
  assert.equal(key.totalBudget, 25_000_000_000n);
  assert.equal(key.expiresAt, BigInt(Date.parse('2027-11-27T00:00:00Z')));
  assert.equal(key.isReadOnly, false);
  assert.equal(sdk.PrivateKey.fromWIF(privateKey.toWIF()).toHex(), secret.toString('hex'));
});
