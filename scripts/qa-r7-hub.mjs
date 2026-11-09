import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '../../../lab/node_modules/playwright/index.mjs';
import { installQaGuard } from '../../../lab/qa-guard.mjs';

const out = new URL('../../../shots/r7-fix/hub/checks/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({args:['--host-resolver-rules=MAP *.localhost 127.0.0.1','--disable-dev-shm-usage']});
const report = [];
const base = 'http://dashhq.localhost:8787';
try {
  for (const width of [1440,390,360]) for (const theme of ['light','dark']) {
    const height = width<600?844:900;
    const context = await browser.newContext({viewport:{width,height},isMobile:width<600,hasTouch:width<600,deviceScaleFactor:2,colorScheme:theme,serviceWorkers:'block',locale:'en-US',timezoneId:'UTC'});
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
    assert.equal(await page.locator('#title').evaluate(el=>getComputedStyle(el).fontStretch),'116%');
    assert(await page.locator('.door strong').evaluateAll(els=>els.every(el=>getComputedStyle(el).fontStretch==='110%')));
    const heights = await page.locator('.map-node').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
    assert.equal(new Set(heights).size,1,'map node heights');
    assert.equal(await page.locator('.map-node').count(),24);
    assert.equal(await page.locator('.map-node small').count(),24,'every map node names its maintainer');
    assert.equal(await page.locator('.map-node small').filter({hasText:'Testnet preview'}).count(),3);
    assert(await page.locator('.map-node small').evaluateAll(els=>els.every(el=>el.textContent.trim() && el.scrollWidth<=el.clientWidth)),'maintainer labels fit');
    assert(await page.locator('.map-node>span').evaluateAll(els=>els.every(el=>parseFloat(getComputedStyle(el).fontSize)>=13 && el.scrollWidth<=el.clientWidth)),'map names at 13px or more, unclipped');
    assert(await page.locator('.map-node small').evaluateAll(els=>els.every(el=>parseFloat(getComputedStyle(el).fontSize)>=12)),'map makers at 12px or more');
    if(width>=1100) {
      const [map,top,h1,search]=await Promise.all(['.eco','.hub-top','#title','#q'].map(s=>page.locator(s).boundingBox()));
      assert(Math.abs(map.width-(top.width-80))<2,'map spans the content width');
      assert(map.y+map.height<=height && h1.y<height && search.y+search.height<height,'headline, search and the whole map sit in the first screen');
      assert((await page.locator('.doors').boundingBox()).y>map.y+map.height,'task cards sit under the map');
    }
    const mapEntries = await page.locator('li[data-entry]').evaluateAll(els=>els.map(el=>({id:el.dataset.entry,href:el.querySelector('a').getAttribute('href'),context:el.querySelector('a').title})));
    assert(mapEntries.every(entry=>entry.href==='/directory/#'+entry.id && entry.context.includes('View directory entry.')));
    const catalog = await page.locator('#directory-index').evaluate(el=>Array.from(el.content.querySelectorAll('.dgroup li')).map(row=>({id:row.id,text:row.textContent})));
    assert.equal(await page.locator('.resource-columns').count(),0);
    for(const [query,path] of [['treasury','/treasury'],['my masternodes','/masternodes'],['contract cost','/tools/fees/'],['name contests','/names'],['pollr','/polls'],['alice.dash','/dpns/'],['1'.repeat(64),'/mn/'+'1'.repeat(64)],['1'.repeat(43),'/search/'],['203.0.113.1','/masternodes']]) {
      await page.locator('#q').fill(query);
      assert.equal(new URL(await page.locator('#find-results a').first().getAttribute('href'),base).pathname,path,query);
    }
    await page.locator('#q').fill('forge');
    assert((await page.locator('#find-results a').first().innerText()).includes('↗'));
    assert(await page.locator('#find-results .result-site').first().isVisible());
    assert(await page.locator('#find-results .result-description').first().isVisible());
    await page.locator('#q').fill('pasta');
    const username = new URL(await page.locator('#find-results li>a').first().getAttribute('href'));
    assert.equal(username.pathname,'/dpns/');
    assert.equal(username.searchParams.get('name'),'pasta.dash');
    assert.equal(username.searchParams.get('network'),'mainnet');
    assert((await page.locator('#find-results li>a').first().innerText()).includes('Look up pasta.dash in Explorer'));
    await page.locator('#q').fill('wallet');
    assert.equal(await page.locator('#find-results .result-tile').count(),await page.locator('#find-results li').count(),'every result carries a layer tile');
    assert(await page.locator('#find-results .result-tile').evaluateAll(els=>els.every(el=>el.dataset.tier && el.textContent.trim().length>=2)));
    assert.equal(await page.locator('#find-results .result-title').filter({hasText:'App Store'}).count(),0);
    assert.equal(await page.locator('#find-results .result-title').filter({hasText:'API keys'}).count(),0);
    assert.equal(await page.locator('#find-results .result-site').filter({hasText:'Faucet'}).count(),0);
    assert.equal(await page.locator('#find-results li').filter({hasText:'DashPay wallet'}).getByRole('link',{name:'App Store ↗',exact:true}).count(),1);
    for(const invalid of ['no matching resource !!!','-pasta','pasta-','ab','a'.repeat(64),'x<script>']) {
      await page.locator('#q').fill(invalid);
      assert.equal(await page.locator('#find-results li>a[href*="/dpns/"]').count(),0,invalid);
    }
    await page.locator('#q').fill('no matching resource !!!');
    await page.waitForFunction(()=>document.querySelector('#qcount').textContent.startsWith('No destinations match'));
    assert.equal(await page.locator('#noresult').count(),0);
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
        assert.equal(await page.locator('.dgroup li').count(),67);
        assert.deepEqual(await page.locator('.dgroup li').evaluateAll(els=>els.map(row=>({id:row.id,text:row.textContent}))),catalog,'home search and directory share the catalog');
        assert.equal(await page.locator('.maker,.catalog-status,.catalog-url code').count(),201);
        assert(await page.locator('.dgroup li').evaluateAll(els=>els.every(row=>row.querySelector('.catalog-name a[href]') && row.querySelector('.dd').textContent.trim() && row.querySelector('.maker').textContent.trim() && row.querySelector('.catalog-status').textContent.trim() && row.querySelector('.catalog-url code').textContent.trim())));
        assert.equal(await page.locator('#yappr .maker').innerText(),'pasta');
        assert.equal(await page.locator('#forge .catalog-status').innerText(),'Testnet preview');
        assert.equal(await page.locator('#dashpay .catalog-status').innerText(),'Mainnet');
        assert.equal(await page.locator('#evotool .catalog-status').innerText(),'Mainnet · Testnet');
        assert((await page.locator('.dgroup li').first().boundingBox()).y<480,'resources start in the first screen');
        assert((await page.locator('.category-links').boundingBox()).height<=(width<600?60:100),'categories fit two rows on desktop and one strip on phones');
        if(width>=600) assert(await page.locator('.category-links a').evaluateAll(els=>els.every(el=>{const b=el.getBoundingClientRect();return b.left>=0 && b.right<=innerWidth;})),'every category chip is visible');
        if(width>=1400) assert.equal(await page.locator('.dgroup li').evaluateAll(els=>els.filter(el=>Math.round(el.getBoundingClientRect().y)===Math.round(els[0].getBoundingClientRect().y)).length),4,'four cards across at 1400 and wider');
        for(const entry of mapEntries) assert.equal(await page.locator('#'+entry.id).count(),1,'map entry has a directory target');
        assert.equal(await page.getByRole('link',{name:/Kotlin SDK/}).count(),1);
        assert.equal(await page.getByRole('link',{name:/^Pollr/}).count(),0);
        assert.equal(await page.locator('.category-links a').count(),10);
        await page.locator('#q').fill('pshenmic');
        assert.equal(await page.locator('.dgroup li:visible').count(),8,'maker filter');
        await page.locator('#q').fill('testnet preview');
        assert.equal(await page.locator('.dgroup li:visible').count(),8,'preview filter');
        await page.locator('#q').fill('grovedb');
        assert.equal(await page.locator('.dgroup li:visible').count(),4);
        assert.equal(await page.locator('.dgroup:visible').count(),3);
        assert.equal(await page.locator('#qcount').textContent(),'4 of 67 resources');
        assert.equal(new URL(page.url()).searchParams.get('q'),'grovedb');
        await page.reload();
        assert.equal(await page.locator('#q').inputValue(),'grovedb');
        await page.locator('#q').fill('no matching resource !!!');
        assert.equal(await page.locator('.dgroup:visible').count(),0);
        assert((await page.locator('#qcount').textContent()).startsWith('No resources match'));
        await page.getByRole('button',{name:'Clear filter',exact:true}).click();
        assert.equal(await page.locator('.dgroup li:visible').count(),67);
        assert.equal(new URL(page.url()).searchParams.has('q'),false);
        assert(await page.locator('#q').evaluate(el=>document.activeElement===el));
        await page.locator('.category-links a').last().click();
        assert.equal(new URL(page.url()).hash,'#category-10');
        assert((await page.locator('#category-10').boundingBox()).y>=52);
        await noOverflow();
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
  for(const network of ['mainnet','testnet']) {
    const context = await browser.newContext({serviceWorkers:'block'});
    await installQaGuard(context);
    const page=await context.newPage();
    await page.goto(base+'/?network='+network);
    for(const query of ['pasta','Pasta.dash','foo-bar','a'.repeat(63)]) {
      await page.locator('#q').fill(query);
      const url=new URL(await page.locator('#find-results li>a').first().getAttribute('href'));
      assert.equal(url.hostname,'explorer.dashhq.localhost');
      assert.equal(url.searchParams.get('network'),network);
      assert.equal(url.searchParams.get('name'),query.toLowerCase().replace(/\.dash$/,'')+'.dash');
    }
    await context.close();
  }
  const plain = await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
  await installQaGuard(plain);
  const plainPage=await plain.newPage();
  await plainPage.goto(base+'/directory/');
  assert.equal(await plainPage.locator('.dgroup li:visible').count(),67);
  assert.equal(await plainPage.locator('.category-links a').count(),10);
  assert(await plainPage.locator('.finder').isHidden());
  await plainPage.locator('.category-links a').last().click();
  assert.equal(new URL(plainPage.url()).hash,'#category-10');
  await plain.close();
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
