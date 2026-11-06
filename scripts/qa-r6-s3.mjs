import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from '../../../lab/node_modules/playwright/index.mjs';
import { installQaGuard } from '../../../lab/qa-guard.mjs';

const root = new URL('../../../', import.meta.url);
const out = new URL('shots/r6-s3-journeys/', root);
await fs.mkdir(out, { recursive: true });
const urls = { hub: 'http://dashhq.localhost:8787', bridge: 'http://bridge.dashhq.localhost:8787', faucet: 'http://faucet.dashhq.localhost:8787', radar: 'http://radar.dashhq.localhost:8787', arch: 'http://arch.dashhq.localhost:8787', explorer: 'http://explorer.dashhq.localhost:8787' };
const protx = 'd353cdcae53071401345c38ab482935cb62442be2174a1d3210ca356c9017eff';
const identity = '7P3ZsJHh61jhvVwaxh1xyNx7wkCqiDdkhw2EpCfTn9J';
const results = [];
const externalBuilds = { explorer: JSON.parse(await fs.readFile(new URL('lab/logs/explorer.build.json', root), 'utf8')) };
const sources = Object.fromEntries(await Promise.all(['bridge', 'faucet', 'nodes', 'hub', 'arch'].map(async site => [site, {
  head: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: new URL(`repos/${site}/`, root), encoding: 'utf8'}).trim(),
  build: JSON.parse(await fs.readFile(new URL(`lab/logs/${site}.build.json`, root), 'utf8')),
}])));
for (const [site, source] of Object.entries(sources)) {
  assert.equal(source.build.headSha, source.head, `${site}: rebuild before capturing`);
  assert.equal(source.build.status, 'built');
}
const browser = await chromium.launch({args:['--host-resolver-rules=MAP *.localhost 127.0.0.1','--disable-dev-shm-usage']});
try {
  for (const device of ['phone', 'desktop']) for (const theme of ['light','dark']) {
    const context = await browser.newContext({viewport:{width:device === 'phone' ? 390 : 1440,height:device === 'phone' ? 844 : 900},isMobile:device === 'phone',hasTouch:device === 'phone',colorScheme:theme,serviceWorkers:'block',locale:'en-US',timezoneId:'UTC'});
    const blocked = [];
    await installQaGuard(context,{onBlocked:request=>blocked.push(request)});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    const shot = async name => page.screenshot({path:new URL(`${name}__${device}__${theme}.png`,out).pathname,animations:'disabled'});
    const noOverflow = async () => assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),'page overflows');
    const menu = async () => {
      const bar = page.locator('dashhq-bar');
      if (device === 'phone') {
        await bar.getByRole('button', {name:'Menu', exact:true}).click();
        const more = bar.getByRole('button', {name:'More tools', exact:true});
        assert(await more.isVisible());
        const links = await bar.locator('.sheet a').evaluateAll(els => els.filter(el => el.getClientRects().length).map(el => {
          const url = new URL(el.href);
          return url.origin + url.pathname + url.hash;
        }));
        const local = await bar.locator('[slot="nav"] a').evaluateAll(els => els.filter(el => el.getClientRects().length).map(el => {
          const url = new URL(el.href);
          return url.origin + url.pathname + url.hash;
        }));
        assert.equal(new Set([...links, ...local]).size, links.length + local.length, 'repeated phone destination');
        assert((await more.boundingBox()).y < 844, 'More tools fits first screen');
        const themeChoices = await bar.locator('.sheet .themes').boundingBox();
        assert(themeChoices.y + themeChoices.height <= 844, 'closed menu fits one phone screen');
        if ([urls.hub, urls.radar].includes(new URL(page.url()).origin)) await shot('family-menu-' + new URL(page.url()).hostname.split('.')[0]);
        await more.click();
        assert(await bar.locator('#dh-more').isVisible());
        await bar.getByRole('button', {name:'Close menu', exact:true}).click();
      } else {
        assert(/tools/i.test(await bar.locator('.switch').innerText()), 'desktop family switcher has a visible Tools label');
        if (new URL(page.url()).origin === urls.radar) {
          await bar.locator('.switch').click();
          await shot('desktop-tools');
          await page.keyboard.press('Escape');
        }
      }
      const directory = new URL(await page.locator('dashhq-footer').getByRole('link', {name:'Directory', exact:true}).getAttribute('href'));
      assert.equal(directory.pathname, '/directory/');
    };
    await page.goto(urls.hub);
    await page.locator('#q').waitFor({state:'visible'});
    await menu();
    assert((await page.locator('#q').boundingBox()).y < (await page.locator('main nav.doors').boundingBox()).y);
    assert(await page.locator('.pulse-fold').evaluate(el=>el.open));
    assert((await page.locator('.network-pulse .dh-sources').textContent()).includes('Sources:'));
    for (const [query,path] of [['treasury','/treasury'],['my masternodes','/masternodes'],['contract cost','/tools/fees/'],['name contests','/names']]) {
      await page.locator('#q').fill(query);
      assert(new URL(await page.locator('#find-results a').first().getAttribute('href')).pathname === path,query);
    }
    await shot('hub-task-search');
    await page.locator('#q').fill('');
    const folds = await page.locator('.catalogue-fold:not([open]) > summary').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
    assert(folds.every(height=>height <= 80),`collapsed rows too tall: ${folds}`);
    await noOverflow();
    await page.goto(urls.hub + '/identity/');
    await page.locator('#choose-task').waitFor();
    await shot('identity-task-guide');
    await noOverflow();
    await page.goto(urls.radar);
    await page.locator('#host-donut .donut-value').waitFor({timeout:45000});
    await menu();
    assert((await page.locator('#health-source').textContent()).includes('Sources: Radar crawler'));
    const providers = (await page.locator('#host-donut .donut-value').textContent()).trim();
    const countries = (await page.locator('#country-donut .donut-value').textContent()).trim();
    assert((await page.locator('#where-lede').textContent()).includes(`${providers} identified providers across ${countries} countries`));
    assert((await page.locator('#host-list button').textContent()).startsWith(`Show all ${providers} providers`));
    assert((await page.locator('#country-list button').textContent()).startsWith(`Show all ${countries} countries`));
    await page.locator('#where').evaluate(el=>el.scrollIntoView({block:'start'}));
    await shot('radar-counts');
    await page.locator('#host-list button').click();
    const hostRows = await page.locator('#host-list li').allTextContents();
    assert.equal(hostRows.filter(row=>!row.includes('Unknown')).length,Number(providers.replaceAll(',','')));
    await noOverflow();
    await page.goto(urls.radar + '/mn/' + protx);
    await page.locator('.node-sections').waitFor({timeout:45000});
    assert(!(await page.locator('body').innerText()).includes('starts once Dash Core 24 is released'));
    await shot('radar-node-index');
    await page.locator('.node-sections a[href="#readiness"]').click();
    const readinessBadge = await page.locator('#readiness .card-head .dh-status').boundingBox();
    assert(readinessBadge.x + readinessBadge.width <= (device === 'phone' ? 390 : 1440), 'readiness badge fits');
    await shot('radar-readiness');
    await noOverflow();
    await page.goto(urls.arch);
    await page.locator('.action-map').waitFor();
    await menu();
    await page.locator('.action-map').scrollIntoViewIfNeeded();
    await shot('arch-action-map');
    await page.getByRole('link',{name:'Explore the technical component map ↓',exact:true}).click();
    await shot('arch-technical-arrival');
    assert((await page.locator('#relationships').boundingBox()).y >= 48);
    await noOverflow();
    await page.goto(urls.explorer + `/identity/?network=mainnet&id=${identity}`);
    await page.getByRole('link', {name:/Estimate a contract/}).click();
    await page.getByRole('button', {name:'Estimate fees', exact:true}).click();
    await page.getByRole('link', {name:/Continue to Bridge/}).click();
    await page.waitForFunction(() => document.querySelector('.contract-import-receipt')?.textContent.includes('Schema SHA-256:'));
    await menu();
    await page.locator('#contract-choose-existing-btn').click();
    assert.equal(await page.locator('#contract-identity-id-input').inputValue(),identity);
    assert.equal(await page.locator('#contract-private-key-input').inputValue(),'');
    assert(await page.locator('#contract-identity-continue-btn').isDisabled());
    await shot('bridge-public-identity');
    await noOverflow();
    await page.goto(urls.faucet);
    await menu();
    assert((await page.locator('.dh-sources').textContent()).includes('Faucet status API'));
    assert(await page.locator('.dh-steps').isHidden());
    const address = 'yZgQUp3D4cxQSa5YvAZcmmu17xkuSk1uKs';
    await page.goto(urls.faucet + `/?from=bridge&journey=start&address=${address}`);
    await page.locator('#returnBridgeBtn').waitFor({state:'visible'});
    assert.equal(await page.locator('#addressInput').inputValue(),address);
    const resume = new URL(await page.locator('#returnBridgeBtn').getAttribute('href'));
    assert.equal(resume.searchParams.get('deposit'),address);
    assert.equal(resume.searchParams.get('mode'),'resume');
    assert.equal(resume.searchParams.get('network'),'testnet');
    assert.equal(await page.locator('.dh-steps a').getAttribute('href'),resume.href);
    await shot('faucet-return');
    const tabs = context.pages().length;
    await page.locator('#returnBridgeBtn').click();
    await page.locator('#restore-backup-input').waitFor();
    assert.equal(context.pages().length,tabs);
    assert.equal(page.url(),resume.href);
    assert((await page.locator('.family-deposit-address').textContent()).includes(address));
    await shot('bridge-resume');
    if (device === 'phone') {
      await page.goto(urls.hub);
      await page.locator('main nav.doors').getByRole('link',{name:/Start on Testnet/}).click();
      await page.locator('#continue-btn').click();
      await page.locator('#backup-saved').waitFor({timeout:60000});
      const phrase = await page.locator('.mnemonic-copy').getAttribute('data-copy');
      assert(phrase && phrase.split(' ').length >= 12);
      await page.locator('#backup-saved').check();
      await page.locator('#backup-continue-btn').click();
      const funding = page.locator('.family-faucet-link');
      await funding.waitFor({timeout:60000});
      const generatedAddress = new URL(await funding.getAttribute('href')).searchParams.get('address');
      const popupPromise = page.waitForEvent('popup');
      await funding.click();
      const faucet = await popupPromise;
      await faucet.locator('#returnBridgeBtn').waitFor();
      assert.equal(await faucet.locator('#addressInput').inputValue(),generatedAddress);
      await faucet.locator('#returnBridgeBtn').click();
      await faucet.locator('#restore-backup-input').waitFor();
      assert((await faucet.locator('.family-deposit-address').textContent()).includes(generatedAddress));
      await faucet.getByText('Saved only your recovery phrase?',{exact:true}).click();
      await faucet.locator('#restore-phrase-input').fill(phrase);
      await faucet.locator('#restore-phrase-btn').click();
      await faucet.locator('#backup-saved').waitFor({timeout:60000});
      await faucet.locator('#backup-saved').check();
      await faucet.locator('#backup-continue-btn').click();
      await faucet.locator('.family-faucet-link').waitFor({timeout:60000});
      assert.equal(new URL(await faucet.locator('.family-faucet-link').getAttribute('href')).searchParams.get('address'),generatedAddress);
      await faucet.screenshot({path:new URL(`phone-start-restored__${theme}.png`,out).pathname,animations:'disabled'});
      await faucet.close();
    }
    assert.equal(blocked.length,0,`unexpected writes: ${blocked.join(', ')}`);
    assert.deepEqual(errors, [], 'browser page errors');
    results.push({device,theme,checks:'hub task search/health/folds; Radar counts/index/readiness; Arch map/anchors; Explorer identity → fee estimator → Bridge public identity; Faucet direct/start/same-tab resume; family menus/Directory',errors,blocked});
    console.log(`${device} ${theme}: PASS`);
    await context.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(new URL('report.json',out),JSON.stringify({sources,externalBuilds,fixture:'Live public reads under lab/qa-guard.mjs; local keys generated only in browser memory; no chain writes.',results},null,2)+'\n');
}
