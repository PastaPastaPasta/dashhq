import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '../../lab/node_modules/playwright/index.mjs';
import { installQaGuard } from '../../lab/qa-guard.mjs';
const shell = await readFile(new URL('./dashhq-shell.js', import.meta.url), 'utf8');
const browser = await chromium.launch();
let checks = 0;
try {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await installQaGuard(context);
  await context.route('http://*.dashhq.localhost:8787/**', route => route.fulfill({ contentType: route.request().url().endsWith('/shell.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8', body: route.request().url().endsWith('/shell.js') ? shell : '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/shell.js"></script><dashhq-bar product="gov" network="mainnet" networks="devnet-z testnet mainnet devnet-a" network-settings="/settings"><nav slot="nav"><a href="/#proposals">Proposals</a></nav></dashhq-bar><dashhq-footer product="gov" source="/source"></dashhq-footer>' }));
  const page = await context.newPage();
  await page.goto('http://gov.dashhq.localhost:8787/?mn=record&network=mainnet');
  const registry = await page.evaluate(async () => ({
    alias: dashhq.products.nodes === dashhq.products.radar,
    fees: dashhq.href('fees', '/', { network: 'testnet' }), pollr: dashhq.href('pollr'),
    forge: dashhq.href('forge'), yappr: dashhq.href('yappr'),
    sorted: dashhq.network.sort(['devnet-z', 'test', 'main', 'devnet-a', 'testnet']),
    elsewhere: await dashhq.network.findElsewhere(n => n === 'testnet', { network: 'mainnet' }),
    invalid: (() => { try { dashhq.href('gov', '//example.com'); return false; } catch { return true; } })()
  }));
  assert.equal(registry.alias, true);
  assert.equal(new URL(registry.fees).pathname, '/tools/fees/');
  assert.equal(new URL(registry.fees).searchParams.get('network'), 'testnet');
  assert.equal(new URL(registry.pollr).pathname, '/');
  assert.equal(new URL(registry.pollr).hostname, 'pollr.dashhq.localhost');
  assert.equal(new URL(registry.forge).hostname, 'forge.dashhq.localhost');
  assert.equal(new URL(registry.yappr).hostname, 'yappr.dashhq.localhost');
  assert.deepEqual(registry.sorted, ['mainnet', 'testnet', 'devnet-a', 'devnet-z']);
  assert.equal(registry.elsewhere, 'testnet');
  assert.equal(registry.invalid, true); checks += 10;
  const bar = page.locator('dashhq-bar');
  await page.evaluate(() => { document.addEventListener('dashhq-network', e => { e.preventDefault(); window.__network = e.detail; }); });
  await bar.locator('button.net').click();
  assert.deepEqual(await bar.locator('.netpop a.opt').allTextContents(), ['Mainnet','Testnet','Devnet a','Devnet z','Network settings']);
  await bar.getByRole('link', { name: 'Testnet', exact: true }).click();
  const event = await page.evaluate(() => window.__network);
  assert.equal(event.network, 'testnet');
  assert.equal(new URL(event.href).searchParams.get('mn'), 'record');
  assert.equal(new URL(page.url()).searchParams.get('network'), 'mainnet'); checks += 4;
  // A retirement marker is consumed before the app reads its query; the notice survives bar replacement.
  await page.goto('http://gov.dashhq.localhost:8787/polls/example?network=testnet&moved-from=pollr&id=record');
  assert.equal(new URL(page.url()).searchParams.has('moved-from'), false);
  assert.equal(new URL(page.url()).searchParams.get('id'), 'record');
  assert.match(await bar.locator('.at').textContent(), /pollr.dashhq.org is now part of Governance/);
  await page.evaluate(() => { const old = document.querySelector('dashhq-bar'); const next = old.cloneNode(true); old.before(next); old.remove(); });
  assert.equal(await page.locator('dashhq-bar .arrive').count(), 1);
  await bar.getByRole('button', { name: 'Dismiss', exact: true }).click();
  assert.equal(await bar.locator('.arrive').count(), 0); checks += 5;
  // Public toggle and no-theme compatibility remain; the hub never gets another family list.
  await page.evaluate(() => { dashhq.theme.set('light'); dashhq.theme.toggle(); });
  assert.equal(await page.evaluate(() => dashhq.theme.resolved), 'dark');
  await bar.evaluate(b => b.setAttribute('no-theme', ''));
  assert.equal(await bar.locator('.tbtn').count(), 0);
  await bar.evaluate(b => { b.removeAttribute('no-theme'); b.setAttribute('product','home'); });
  assert.equal(await bar.locator('.switch').count(), 0);
  assert.equal(await bar.locator('.family').getAttribute('hidden'), ''); checks += 4;
  await context.close();
  console.log(`${checks} shell compatibility checks passed`);
} finally { await browser.close(); }
