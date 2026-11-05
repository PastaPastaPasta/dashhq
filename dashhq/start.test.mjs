import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '../../lab/node_modules/playwright/index.mjs';
import { installQaGuard } from '../../lab/qa-guard.mjs';

const shell = await readFile(new URL('./dashhq-shell.js', import.meta.url), 'utf8');
const browser = await chromium.launch();
let checks = 0;
try {
  for (const mobile of [false, true]) {
    for (const product of ['radar', 'gov', 'explorer']) {
      const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: mobile ? 390 : 1440, height: 900 }, isMobile: mobile, hasTouch: mobile });
      await installQaGuard(context);
      const page = await context.newPage();
      await page.route('http://*.dashhq.localhost:8787/**', route => {
        if (new URL(route.request().url()).pathname === '/shell.js') return route.fulfill({ contentType: 'text/javascript', body: shell });
        return route.fulfill({ contentType: 'text/html', headers: { 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'" }, body: `<script src="/shell.js"></script><dashhq-bar product="${product}" network="mainnet"></dashhq-bar><dashhq-footer product="${product}"></dashhq-footer><a data-family="bridge" href="/">Begin</a><a data-family="bridge" data-network="mainnet" href="/">Mainnet invitation</a>` });
      });
      await page.goto(`http://${product}.dashhq.localhost:8787/?network=mainnet`);
      const result = await page.evaluate(() => {
        const bar = document.querySelector('dashhq-bar').shadowRoot;
        const starts = [...bar.querySelectorAll('.door')].filter(el => el.querySelector('.dn').textContent === 'Start');
        const links = starts.flatMap(el => [...el.querySelectorAll('a')].map(a => a.href));
        links.push([...document.querySelector('dashhq-footer').shadowRoot.querySelectorAll('a')].find(a => a.textContent === 'Start').href);
        return { links, first: starts[0].querySelector('a').href,
          defaultBridge: dashhq.href('bridge'), defaultFaucet: dashhq.href('faucet'),
          explicit: dashhq.href('bridge', '/', { network: 'mainnet' }),
          invitation: document.querySelector('[data-network="mainnet"]').href,
          declarative: document.querySelector('[data-family="bridge"]').href };
      });
      for (const link of [...result.links, result.defaultBridge, result.defaultFaucet, result.declarative]) {
        assert.equal(new URL(link).searchParams.get('network'), 'testnet', link);
        checks++;
      }
      assert.equal(new URL(result.first).hostname, 'bridge.dashhq.localhost');
      assert.equal(new URL(result.first).searchParams.get('mode'), 'create');
      assert.equal(new URL(result.explicit).searchParams.get('network'), 'mainnet');
      assert.equal(new URL(result.invitation).searchParams.get('network'), 'mainnet');
      checks += 4;
      await context.close();
    }
  }
  console.log(`${checks} Start network and explicit Mainnet checks passed`);
} finally { await browser.close(); }
