import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '../../../lab/node_modules/playwright/index.mjs';
import { installQaGuard } from '../../../lab/qa-guard.mjs';

const out = new URL('../../../reviews/round7-shots/S2/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({args:['--host-resolver-rules=MAP *.localhost 127.0.0.1','--disable-dev-shm-usage']});
const report = [];
const base = 'http://dashhq.localhost:8787';
try {
  for (const width of [1440,390,360]) for (const theme of ['light','dark']) {
    const context = await browser.newContext({viewport:{width,height:width<600?844:900},isMobile:width<600,hasTouch:width<600,deviceScaleFactor:2,colorScheme:theme,serviceWorkers:'block',locale:'en-US',timezoneId:'UTC'});
    const blocked = [], errors = [];
    await installQaGuard(context,{onBlocked:r=>blocked.push(r)});
    const page = await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    const noOverflow = async () => assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
    await page.goto(base);
    await page.locator('#q').waitFor({state:'visible'});
    await page.waitForFunction(()=>!document.getElementById('pulse-summary').textContent.includes('Checking'));
    assert.equal(await page.locator('.doors>a').count(),4);
    assert.equal(await page.locator('details,.plate,svg.mk,.pby').count(),0);
    assert.equal(await page.locator('dashhq-bar').getByRole('button',{name:'All tools',exact:true}).count(),0);
    const pageHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
    if(width<600) assert(pageHeight<3200,`phone too long: ${pageHeight}`);
    await noOverflow();
    const smallText=await page.locator('body *').evaluateAll(els=>els.filter(el=>el.getClientRects().length && [...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize)<12).map(el=>el.outerHTML.slice(0,100)));
    assert.deepEqual(smallText,[],'text below 12px');
    const repeatLinks=await page.locator('a').evaluateAll(els=>{
      const counts={};
      for(const a of els.filter(a=>a.getClientRects().length && !a.closest('dashhq-bar'))) {const u=new URL(a.href);const k=u.origin+u.pathname.replace(/\/$/,'')+u.search+u.hash;counts[k]=(counts[k]||0)+1;}
      return Object.entries(counts).filter(([,count])=>count>2);
    });
    assert.deepEqual(repeatLinks,[],'repeated destinations');
    for(const [query,path] of [['treasury','/treasury'],['my masternodes','/masternodes'],['contract cost','/tools/fees/'],['name contests','/names'],['pollr','/polls'],['alice.dash','/dpns/'],['1'.repeat(64),'/mn/'+'1'.repeat(64)],['1'.repeat(43),'/search/'],['203.0.113.1','/masternodes']]) {
      await page.locator('#q').fill(query);
      assert.equal(new URL(await page.locator('#find-results a').first().getAttribute('href'),base).pathname,path,query);
    }
    await page.locator('#q').fill('forge');
    assert((await page.locator('#find-results a').first().innerText()).includes('↗'));
    assert(await page.locator('#find-results .result-site').first().isVisible());
    assert(await page.locator('#find-results .result-description').first().isVisible());
    await page.locator('#q').fill('zzzz-does-not-exist');
    assert(await page.locator('#noresult').isVisible());
    assert.equal(await page.getByRole('button',{name:/^Clear(?: search)?$/}).count(),1);
    await page.getByRole('button',{name:'Clear',exact:true}).click();
    assert.equal(await page.locator('#q').inputValue(),'');
    assert(await page.locator('#q').evaluate(el=>document.activeElement===el));
    await page.locator('#q').fill('forge');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#q').inputValue(),'');
    assert(await page.locator('#q').evaluate(el=>document.activeElement===el));
    // Follow real destinations without initiating any account or write operation.
    for(const [index,host,path] of [[0,'radar.dashhq.localhost','/masternodes'],[1,'gov.dashhq.localhost','/treasury'],[2,'explorer.dashhq.localhost','/'],[3,'bridge.dashhq.localhost','/']]) {
      await page.goto(base);
      await page.locator('.doors>a').nth(index).click();
      await page.waitForURL(u=>u.hostname===host && u.pathname===path);
      if(index===3) assert.equal(new URL(page.url()).searchParams.get('network'),'testnet');
      await noOverflow();
    }
    for(const path of ['/directory/','/identity/']) {
      assert.equal((await page.goto(base+path)).status(),200);
      await noOverflow();
      assert.equal(await page.locator('details').count(),0);
      if(path==='/directory/') {
        assert.equal(await page.locator('.dgroup li').count(),65);
        assert.equal(await page.getByRole('link',{name:/Kotlin SDK/}).count(),1);
        assert.equal(await page.getByRole('link',{name:/^Pollr/}).count(),0);
      } else {
        assert((await page.locator('#forge').innerText()).includes('wallet-imported keys can be unlimited'));
      }
    }
    assert.equal(blocked.length,0,'unexpected writes');
    assert.deepEqual(errors,[],'page exceptions');
    report.push({width,theme,pageHeight,blocked,errors,pass:true});
    console.log(`PASS ${width} ${theme}: ${pageHeight}px home`);
    await context.close();
  }
  // Deterministic read fixtures cover success, stale, invalid and retry states.
  const context = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2,serviceWorkers:'block'});
  await installQaGuard(context);
  const page=await context.newPage();
  let fixture='failed';
  await context.route('**/*',async route=>{
    const url=decodeURIComponent(route.request().url());
    if(!url.includes('/api/v1/mainnet/summary'))return route.fallback();
    const now=Math.floor(Date.now()/1000);
    const data={crawl:{mn_total:100,mn_reachable:98,finished:now-(fixture==='stale'?7200:600)},platform:{checked:20,healthy:18,updated:now-(fixture==='stale'?7200:600)}};
    if(fixture==='invalid')data.platform.healthy=21;
    return route.fulfill({status:fixture==='failed'?503:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto(base);
  await page.locator('#pulse-retry').waitFor({state:'visible'});
  assert((await page.locator('#pulse-summary').innerText()).includes('unavailable'));
  fixture='success';await page.locator('#pulse-retry').click();
  await page.waitForFunction(()=>document.getElementById('pulse-summary').textContent.includes('98.0%'));
  assert((await page.locator('#pulse-summary').innerText()).includes('90.0%'));
  assert(await page.locator('#pulse-retry').isHidden());
  fixture='stale';await page.reload();
  await page.waitForFunction(()=>document.getElementById('pulse-age').textContent.includes('overdue'));
  assert((await page.locator('#pulse-summary').innerText()).includes('Platform check overdue'));
  fixture='invalid';await page.reload();
  await page.locator('#pulse-retry').waitFor({state:'visible'});
  assert(!(await page.locator('#pulse-summary').innerText()).includes('%'));
  report.push({case:'network failure → retry success; stale crawl/platform; malformed counts rejected',fixture:'synthetic public-read responses only',pass:true});
  await context.close();
} finally {
  await browser.close();
  await fs.writeFile(new URL('qa.json',out),JSON.stringify(report,null,2)+'\n');
}
