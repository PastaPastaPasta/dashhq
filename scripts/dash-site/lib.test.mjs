import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDash, parseDash, refuseKey } from './lib.mjs';

const CONTRACT = 'GCSi8NkjXyRpLC7FsEnCfx5ntmWZ16bD2t9zc4JiT4X3';
const NOW = Date.parse('2026-11-27T00:00:00Z');
const context = { network: 'mainnet', identityId: 'ID', name: 'd4shhq', contractId: CONTRACT, keyContract: CONTRACT, estimate: parseDash('0.006'), now: NOW };
const good = {
  network: 'mainnet',
  identityId: 'ID',
  names: ['d4shhq.dash'],
  balance: '0.10000 DASH',
  keyId: 4,
  bound: true,
  totalBudget: '0.25000 DASH',
  remainingBudget: '0.24000 DASH',
  expiresAt: '2027-11-27T00:00:00.000Z',
};

test('parseDash is exact and formatDash round-trips', () => {
  assert.equal(parseDash('0.25'), 25_000_000_000n);
  assert.equal(parseDash('0.00720 DASH'), 720_000_000n);
  assert.equal(parseDash('1'), 100_000_000_000n);
  assert.throws(() => parseDash('-1'));
  assert.throws(() => parseDash('0.000000000001'));
  assert.throws(() => parseDash('abc'));
  assert.equal(formatDash(5_356_052_500n), '0.053560525 DASH');
  assert.equal(parseDash(formatDash(5_356_052_500n)), 5_356_052_500n);
});

test('a bound, budgeted, unexpired key with enough left may publish', () => {
  assert.deepEqual(refuseKey(good, context), []);
});

test('an unbound key is refused, as a master or critical key would be', () => {
  const unbound = { ...good, bound: false, totalBudget: undefined, remainingBudget: undefined, expiresAt: undefined };
  const reasons = refuseKey(unbound, { ...context, keyContract: undefined });
  assert.match(reasons.join('\n'), /not bound to a contract/);
  assert.match(reasons.join('\n'), /no total budget/);
  assert.match(reasons.join('\n'), /no expiry/);
});

test('a key bound to another contract is refused', () => {
  assert.match(refuseKey(good, { ...context, keyContract: 'Other' }).join(), /bound to Other/);
});

test('an expired key, or one expiring within the hour, is refused', () => {
  assert.match(refuseKey({ ...good, expiresAt: '2026-11-26T00:00:00.000Z' }, context).join(), /expires/);
  assert.match(refuseKey({ ...good, expiresAt: '2026-11-27T00:30:00.000Z' }, context).join(), /expires/);
});

test('too little budget or balance for the estimate is refused', () => {
  assert.match(refuseKey({ ...good, remainingBudget: '0.00500 DASH' }, context).join(), /budget left/);
  assert.match(refuseKey({ ...good, balance: '0.00100 DASH' }, context).join(), /top it up/);
  assert.deepEqual(refuseKey({ ...good, remainingBudget: '0.00600 DASH' }, context), []);
});

test('another network, identity or name is refused', () => {
  assert.match(refuseKey({ ...good, network: 'testnet' }, context).join(), /for testnet/);
  assert.match(refuseKey({ ...good, identityId: 'X' }, context).join(), /belongs to X/);
  assert.match(refuseKey({ ...good, names: [] }, context).join(), /does not own d4shhq/);
});
