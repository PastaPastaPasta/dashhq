/*! dashhq-shell 1.1.0 | family bar, footer, hash display and theme for dashhq.org tools | MIT */
/* Load as a classic, blocking script in <head>, before any stylesheet that depends on [data-theme]:
     <script src="/dashhq/dashhq-shell.js"></script>
   CSP: needs only script-src 'self'. No inline script, no eval, no innerHTML, no style attributes,
   no third-party requests. Element styles use constructable stylesheets, which CSP does not govern. */
(() => {
  'use strict';
  if (window.dashhq && window.dashhq.version) return;

  const VERSION = '1.1.0';
  const doc = document;
  const root = doc.documentElement;
  const host = location.hostname;

  /* ---------------------------------------------------------------- family registry */
  // door: home | network | governance | platform | start | apps
  // net: the product accepts ?network=, so family links carry the current network into it
  const PRODUCTS = {
    home:     { name: 'dashhq',        url: 'https://dashhq.org',          door: 'home' },
    radar:    { name: 'Radar',         url: 'https://radar.dashhq.org',    door: 'network',    net: true },
    gov:      { name: 'Governance',    url: 'https://gov.dashhq.org',      door: 'governance', net: true },
    explorer: { name: 'Explorer',      url: 'https://explorer.dashhq.org', door: 'platform',   net: true },
    faucet:   { name: 'Faucet',        url: 'https://faucet.dashhq.org',   door: 'start' },
    bridge:   { name: 'Bridge',        url: 'https://bridge.thepasta.org', door: 'start',      net: true },
    arch:     { name: 'Architecture',  url: 'https://arch.dashhq.org',     door: 'platform' },
    fees:     { name: 'Fee estimator', url: 'https://fees.dashhq.org',     door: 'platform' },
    dapi:     { name: 'DAPI console',  url: 'https://dapi.dashhq.org',     door: 'platform',   net: true },
    vote:     { name: 'EvoVote',       url: 'https://vote.dashhq.org',     door: 'governance', net: true },
    basics:   { name: 'Basics',        url: 'https://basics.dashhq.org',   door: 'platform' },
    forge:    { name: 'Forge',         url: 'https://forge.dashhq.org',    door: 'apps' },
    pollr:    { name: 'Pollr',         url: 'https://pollr.dashhq.org',    door: 'apps' },
    yappr:    { name: 'Yappr',         url: 'https://yap.pr',              door: 'apps' }
  };
  PRODUCTS.nodes = PRODUCTS.radar;
  const DOORS = [
    { door: 'home',       key: 'home',     label: 'dashhq.org', desc: 'The map: every Dash app, tool and doc' },
    { door: 'network',    key: 'radar',    label: 'Radar',      desc: 'Live network health, masternodes and evonodes' },
    { door: 'governance', key: 'gov',      label: 'Governance', desc: 'Proposals, votes, name contests' },
    { door: 'platform',   key: 'explorer', label: 'Explorer',   desc: 'Identities, names, contracts, proof-checked' },
    { door: 'start',      key: 'faucet',   label: 'Start',      desc: 'Testnet DASH, then an identity', steps: ['faucet', 'bridge'] }
  ];
  const APPS = ['forge', 'pollr', 'yappr'];
  const ALSO = ['arch', 'fees'];

  /* ---------------------------------------------------------------- local lab */
  // On dashhq.localhost and *.dashhq.localhost every family link stays in the lab: same scheme, same port.
  const LAB = host === 'dashhq.localhost' || host.endsWith('.dashhq.localhost');

  function origin(key) {
    if (key === 'nodes') key = 'radar';
    const p = PRODUCTS[key];
    if (!p) throw new Error(`dashhq: unknown product "${key}"`);
    if (!LAB) return p.url;
    const port = location.port ? ':' + location.port : '';
    return `${location.protocol}//${key === 'home' ? '' : key + '.'}dashhq.localhost${port}`;
  }

  /* ---------------------------------------------------------------- network vocabulary */
  function parseNetwork(v) {
    if (v == null) return null;
    v = String(v).trim().toLowerCase();
    if (v === 'mainnet' || v === 'main') return 'mainnet';
    if (v === 'testnet' || v === 'test') return 'testnet';
    const m = /^devnet[-_ ]?([a-z0-9][a-z0-9-]{0,31})$/.exec(v);
    return m ? 'devnet-' + m[1] : null;
  }
  const networkKind = (n) => (n === 'mainnet' ? 'main' : n === 'testnet' ? 'test' : n ? 'dev' : '');
  function networkLabel(n) {
    if (n === 'mainnet') return 'Mainnet';
    if (n === 'testnet') return 'Testnet';
    return n && n.startsWith('devnet-') ? 'Devnet ' + n.slice(7) : '';
  }
  // ?network= wins; the legacy ?net= is read so old links keep working. Absent means mainnet.
  function networkFromUrl(u) {
    const sp = new URL(u || location.href, location.href).searchParams;
    return parseNetwork(sp.get('network')) || parseNetwork(sp.get('net')) || 'mainnet';
  }
  function withNetwork(u, n) {
    const url = new URL(u, location.href);
    url.searchParams.delete('net');
    const network = parseNetwork(n);
    if (network) url.searchParams.set('network', network);
    else url.searchParams.delete('network');
    return url.href;
  }
  // Rewrite a legacy ?net= (or ?network=main) to the canonical form without a reload.
  function canonicalizeNetworkParam() {
    const sp = new URL(location.href).searchParams;
    if (!sp.has('net') && !sp.has('network')) return;
    const next = withNetwork(location.href, networkFromUrl());
    if (next !== location.href) history.replaceState(history.state, '', next);
  }

  canonicalizeNetworkParam();

  // The page's network: from the most recently connected <dashhq-bar network>, else from the URL.
  const bars = new Set();
  const netListeners = new Set();
  function activeNetwork() {
    let n = null;
    for (const b of bars) n = parseNetwork(b.getAttribute('network')) || n;
    return n || networkFromUrl();
  }
  const netChanged = () => [...netListeners].forEach((fn) => fn());

  function href(key, path, opts) {
    const base = origin(key);
    const u = new URL(path || '/', base + '/');
    if (u.origin !== new URL(base).origin) throw new Error(`dashhq: href("${key}") must stay on ${base}`);
    const p = PRODUCTS[key];
    const n = parseNetwork(opts && 'network' in opts ? opts.network : activeNetwork());
    if (p.net && n) {
      u.searchParams.delete('net');
      u.searchParams.set('network', n);
    }
    return u.href;
  }

  // Keep production hrefs as the no-script fallback; resolve only explicitly opted-in anchors.
  function familyLinks(node) {
    if (!node.querySelectorAll) return;
    const links = [...node.querySelectorAll('a[data-family]')];
    if (node.matches && node.matches('a[data-family]')) links.push(node);
    for (const link of links) {
      if (!Object.hasOwn(PRODUCTS, link.dataset.family)) continue;
      const network = parseNetwork(link.dataset.network);
      if (link.hasAttribute('data-network') && !network) continue;
      try {
        link.href = href(link.dataset.family, link.dataset.path || '/', network ? { network } : undefined);
      } catch { /* An invalid path keeps its authored fallback. */ }
    }
  }
  netListeners.add(() => familyLinks(doc));
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') familyLinks(record.target);
      else for (const node of record.addedNodes) familyLinks(node);
    }
  }).observe(root, { subtree: true, childList: true, attributes: true,
    attributeFilter: ['data-family', 'data-path', 'data-network'] });
  addEventListener('popstate', () => familyLinks(doc));
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => familyLinks(doc));
  else familyLinks(doc);

  /* ---------------------------------------------------------------- theme */
  // One preference for the whole family: a cookie on the parent domain (dashhq.org, or dashhq.localhost in the
  // lab) so every subdomain shares it, plus localStorage as the fallback on other domains (yap.pr, thepasta.org).
  const COOKIE_RE = /(?:^|;\s*)dh_theme=(light|dark|system)(?:;|$)/;
  const LS_KEY = 'dh-theme';
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const validPref = (v) => (v === 'light' || v === 'dark' || v === 'system' ? v : null);

  function cookieDomain() {
    if (host === 'dashhq.org' || host.endsWith('.dashhq.org')) return 'dashhq.org';
    return LAB ? 'dashhq.localhost' : null;
  }
  function cookiePref() {
    try { const m = COOKIE_RE.exec(doc.cookie || ''); return m && m[1]; } catch { return null; } // sandboxed frame
  }
  function readPref() {
    const c = cookiePref();
    if (c) return c;
    try { return validPref(localStorage.getItem(LS_KEY)) || 'system'; } catch { return 'system'; }
  }
  function writeCookie(p) {
    const d = cookieDomain();
    if (!d) return;
    try {
      doc.cookie = `dh_theme=${p}; Domain=${d}; Path=/; Max-Age=31536000; SameSite=Lax` +
        (location.protocol === 'https:' ? '; Secure' : '');
    } catch { /* sandboxed frame */ }
  }
  function writePref(p) {
    writeCookie(p);
    try { localStorage.setItem(LS_KEY, p); } catch { /* storage blocked: the cookie still works */ }
  }

  let pref = readPref();
  // Safari keeps cookies written by script for 7 days; renew it on every visit so subdomains stay in step.
  if (cookiePref()) writeCookie(pref);
  const themeListeners = new Set();
  const resolved = () => (pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref);

  function syncThemeColor() {
    const meta = doc.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta || !doc.body) return;
    const c = getComputedStyle(root).getPropertyValue('--dh-surface').trim();
    if (c) meta.setAttribute('content', c);
  }
  function applyTheme(announce) {
    const t = resolved();
    root.setAttribute('data-theme', t);
    root.setAttribute('data-theme-pref', pref);
    root.style.colorScheme = t;
    syncThemeColor();
    if (announce) doc.dispatchEvent(new CustomEvent('dashhq-theme', { detail: { pref, theme: t } }));
    [...themeListeners].forEach((fn) => fn());
  }
  function setPref(p) {
    p = validPref(p);
    if (!p) throw new Error('dashhq: theme must be light, dark or system');
    pref = p;
    writePref(p);
    applyTheme(true);
  }
  const toggleTheme = () => setPref(resolved() === 'dark' ? 'light' : 'dark');

  applyTheme(false);
  // Frameworks may wipe <html> attributes (React 19 does when it client-renders the root); put the theme back.
  new MutationObserver(() => {
    const t = resolved();
    if (root.getAttribute('data-theme') !== t || root.getAttribute('data-theme-pref') !== pref ||
      root.style.colorScheme !== t) applyTheme(false);
  }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-theme-pref', 'style'] });
  mq.addEventListener('change', () => { if (pref === 'system') applyTheme(true); });
  // Another subdomain may have changed the shared cookie while this tab sat in the background.
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) return;
    const p = readPref();
    if (p !== pref) { pref = p; applyTheme(true); }
  });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', syncThemeColor);

  /* ---------------------------------------------------------------- DOM helpers (no innerHTML) */
  const SVGNS = 'http://www.w3.org/2000/svg';
  // h('a', { class: 'x', href }, ...children). Attributes that are null or false are skipped; true sets "".
  function h(tag, attrs, ...kids) {
    const el = tag.startsWith('svg:') ? doc.createElementNS(SVGNS, tag.slice(4)) : doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v != null && v !== false) el.setAttribute(k, v === true ? '' : v);
    }
    el.append(...kids.flat(Infinity).filter((c) => c != null && c !== false));
    return el;
  }

  const ICONS = {
    chevron: ['M5 7.5l5 5 5-5'],
    menu: ['M3.5 6h13M3.5 10h13M3.5 14h13'],
    close: ['M5 5l10 10M15 5L5 15'],
    moon: ['M15.5 12.2A6.5 6.5 0 0 1 7.8 4.5a6.5 6.5 0 1 0 7.7 7.7z'],
    sun: ['M10 6.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
      'M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4'],
    copy: ['M7 7h8.5v8.5H7z', 'M4.5 12.5V4.5h8'],
    check: ['M4.5 10.5l3.5 3.5 7.5-8']
  };
  const icon = (name, size) =>
    h('svg:svg', { viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true', focusable: 'false', class: 'ic' },
      ICONS[name].map((d) => h('svg:path', { d })));
  // The mark: a blueprint plate, two layers, and the amber link that joins them (an H on its side).
  const mark = (size) =>
    h('svg:svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true', focusable: 'false', class: 'mark' },
      h('svg:rect', { class: 'mk-plate', x: '.5', y: '.5', width: '23', height: '23', rx: '5' }),
      h('svg:path', { class: 'mk-rail', d: 'M5 8.5H19M5 15.5H19' }),
      h('svg:path', { class: 'mk-link', d: 'M12 8.5V15.5' }));

  /* ---------------------------------------------------------------- shadow CSS */
  const BASE_CSS =
    ':host{font-family:var(--dh-font);color:var(--dh-ink);-webkit-font-smoothing:antialiased;' +
    '-moz-osx-font-smoothing:grayscale}' +
    ':host([hidden]){display:none!important}' +
    '*,*::before,*::after{box-sizing:border-box}' +
    'a{color:inherit;text-decoration:none}' +
    'button{font:inherit;color:inherit;background:none;border:0;margin:0;padding:0;cursor:pointer;' +
    '-webkit-tap-highlight-color:transparent}' +
    ':focus-visible{outline:2px solid var(--dh-focus);outline-offset:2px}' +
    '.ic{display:block;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}' +
    '.mark{display:block;flex:none}' +
    '.mk-plate{fill:#0A2A3D;stroke:var(--dh-mark-edge,transparent);stroke-width:1}' +
    '.mk-rail{stroke:#A6D8F7;stroke-width:2.2;fill:none}' +
    '.mk-link{stroke:#F5A73C;stroke-width:3.2;fill:none}' +
    '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';

  const BAR_CSS = BASE_CSS +
    ':host{display:block;position:relative;z-index:40}' +
    ':host([sticky]){position:sticky;top:0}' +
    '.bar{background:var(--dh-surface);border-bottom:1px solid var(--dh-line);' +
    '--dh-nav-dir:row;--dh-nav-h:32px;--dh-nav-fs:14px;--dh-nav-pad:10px;--dh-nav-align:center}' +
    '.bar.test,.bar.dev{border-bottom:1px dashed var(--dh-line-2)}' +
    '.row{position:relative;max-width:var(--dh-shell-max,var(--dh-max));margin:0 auto;' +
    'padding:0 var(--dh-gutter);height:var(--dh-bar-h);display:flex;align-items:center;gap:2px;overflow:hidden}' +
    '.bar.popping .row,.bar.open .row{overflow:visible}' +
    '.home{display:flex;align-items:center;gap:9px;height:36px;padding-right:4px;border-radius:var(--dh-r2);flex:none}' +
    '.wm{font-weight:650;font-stretch:112%;font-size:16px;letter-spacing:-.012em;line-height:1}' +
    '.slash{color:var(--dh-line-2);font-size:19px;font-weight:300;margin:0 3px 0 5px;flex:none;line-height:1}' +
    '.product{display:flex;align-items:center;gap:7px;font-weight:580;font-size:15px;height:34px;padding:0 4px;' +
    'border-radius:var(--dh-r2);white-space:nowrap;flex:none}' +
    '.product:hover .pn{text-decoration:underline;text-decoration-color:var(--dh-line-2);text-underline-offset:4px}' +
    '.switch{width:28px;height:32px;display:grid;place-items:center;border-radius:var(--dh-r2);' +
    'color:var(--dh-ink-2);flex:none}' +
    '.switch:hover,.switch[aria-expanded=true]{background:var(--dh-hover);color:var(--dh-ink)}' +
    '.switch .ic{transition:transform var(--dh-dur-2) var(--dh-ease)}' +
    '.switch[aria-expanded=true] .ic{transform:rotate(180deg)}' +
    '.sheet{display:contents}' +
    '.nav{display:flex;align-items:center;flex:none;margin-left:14px}' +
    '.family{display:none}' +
    '.end{display:flex;align-items:center;gap:6px;margin-left:auto;padding-left:12px;flex:none}' +
    '.tbtn,.menu{width:34px;height:34px;display:grid;place-items:center;border-radius:var(--dh-r2);color:var(--dh-ink-2)}' +
    '.tbtn:hover,.menu:hover,.menu[aria-expanded=true]{background:var(--dh-hover);color:var(--dh-ink)}' +
    '.menu{display:none}' +
    /* network pill: solid = mainnet (live, real DASH); dashed = testnet; dotted = devnet. Same key as the hub map. */
    '.netwrap{position:relative;flex:none}' +
    '.net{display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border:1px solid var(--dh-line-2);' +
    'border-radius:var(--dh-r2);background:var(--dh-surface);font-size:13px;font-weight:540;white-space:nowrap;' +
    'color:var(--dh-ink)}' +
    'button.net{padding-right:6px}' +
    'button.net:hover{background:var(--dh-hover)}' +
    '.net .dot{width:7px;height:7px;border-radius:50%;background:var(--dh-good);flex:none}' +
    '.net.test,.net.dev{background:var(--dh-sunken)}' +
    '.net.test{border-style:dashed}.net.dev{border-style:dotted;border-width:1.5px}' +
    '.net.test .dot,.net.dev .dot{background:transparent;border:1.5px solid var(--dh-ink-2)}' +
    '.net .ic{color:var(--dh-ink-2)}' +
    /* popovers */
    '.pop{position:absolute;top:calc(100% + 6px);z-index:2;background:var(--dh-surface);border-radius:var(--dh-r3);' +
    'box-shadow:var(--dh-shadow-pop);padding:6px}' +
    '.doorpop{left:var(--dh-gutter);width:min(440px,calc(100vw - 2 * var(--dh-gutter)))}' +
    '.netpop{right:0;min-width:200px}' +
    '.opt{display:flex;align-items:center;gap:10px;min-height:36px;padding:6px 10px;border-radius:var(--dh-r2);' +
    'font-size:14px;color:var(--dh-ink)}' +
    '.opt:hover{background:var(--dh-hover)}' +
    '.opt .tick{width:16px;color:var(--dh-brand-ink);flex:none}' +
    '.opt.more{color:var(--dh-brand-ink);border-top:1px solid var(--dh-line);border-radius:0 0 var(--dh-r2) var(--dh-r2);' +
    'margin-top:4px}' +
    /* the doors list, used in the desktop popover and the phone sheet */
    '.doors{list-style:none;margin:0;padding:0}' +
    '.door{position:relative;display:grid;gap:1px;padding:9px 12px 9px 14px;border-radius:var(--dh-r2)}' +
    '.door:hover{background:var(--dh-hover)}' +
    '.door[aria-current]{background:var(--dh-sunken)}' +
    '.door[aria-current]::before{content:"";position:absolute;left:4px;top:10px;bottom:10px;width:3px;' +
    'border-radius:2px;background:var(--dh-brand)}' +
    '.dn{font-weight:620;font-size:15px}' +
    '.dn::after{content:"";position:absolute;inset:0}' +
    '.dd{font-size:13px;color:var(--dh-ink-2)}' +
    '.steps{position:relative;z-index:1;font-size:13px;color:var(--dh-ink-2);display:flex;gap:6px;align-items:center;' +
    'margin-top:2px}' +
    '.steps a{color:var(--dh-brand-ink);font-weight:540}' +
    '.steps a:hover{text-decoration:underline}' +
    '.grp{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;padding:10px 14px;border-top:1px solid var(--dh-line);' +
    'margin-top:6px;font-size:14px}' +
    '.gl{font-size:13px;color:var(--dh-ink-2);min-width:52px}' +
    '.grp a{font-weight:540}' +
    '.grp a:hover{color:var(--dh-brand-ink)}' +
    '.grp a[aria-current]{color:var(--dh-brand-ink);text-decoration:underline;text-underline-offset:3px}' +
    '.themes{display:flex;align-items:center;gap:12px;padding:10px 14px 6px;border-top:1px solid var(--dh-line);' +
    'margin-top:6px}' +
    '.seg{display:inline-flex;padding:2px;background:var(--dh-sunken);border-radius:var(--dh-r2);gap:2px}' +
    '.seg button{height:28px;padding:0 11px;border-radius:4px;font-size:13px;font-weight:520;color:var(--dh-ink-2)}' +
    '.seg button:hover{color:var(--dh-ink)}' +
    '.seg button[aria-pressed=true]{background:var(--dh-surface);color:var(--dh-ink);' +
    'box-shadow:0 0 0 1px var(--dh-line),0 1px 2px rgba(8,24,36,.08)}' +
    /* compact: phones, and any width where the row would not fit */
    '.bar.compact .wm,.bar.compact .slash,.bar.compact .switch,.bar.compact .tbtn{display:none}' +
    '.bar.compact .home{padding-right:2px}' +
    '.bar.compact.is-home .wm{display:inline}' +
    '.bar.compact .product{padding-left:6px}' +
    '.bar.compact .menu{display:grid}' +
    '.bar.compact .sheet{display:none;--dh-nav-dir:column;--dh-nav-h:44px;--dh-nav-fs:16px;--dh-nav-pad:12px;' +
    '--dh-nav-align:stretch}' +
    '.bar.compact.open .sheet{display:block;position:absolute;left:0;right:0;top:100%;z-index:2;' +
    'background:var(--dh-surface);border-bottom:1px solid var(--dh-line);box-shadow:0 18px 30px -18px rgba(8,24,36,.45);' +
    'max-height:calc(100vh - var(--dh-bar-h));max-height:calc(100dvh - var(--dh-bar-h));overflow:auto;' +
    'overscroll-behavior:contain;padding:8px var(--dh-gutter) 20px}' +
    '.bar.compact .nav{display:block;margin:0 0 6px}' +
    '.bar.compact .nav.empty{display:none}' +
    '.bar.compact .family{display:block;border-top:1px solid var(--dh-line);padding-top:8px}' +
    '.bar.compact .nav.empty+.family{border-top:0;padding-top:0}' +
    '.bar.compact .family .door{padding:11px 12px 11px 14px}' +
    '.bar.compact .grp,.bar.compact .themes{padding-left:14px;padding-right:0}' +
    '.bar.compact .net{height:36px}' +
    '.bar.compact .menu{width:40px;height:40px;margin-right:-4px}' +
    '.bar.compact .seg button{height:40px;padding:0 14px}' +
    'button.net{position:relative}.bar.compact button.net::after{content:"";position:absolute;inset:-4px -2px}' +
    '@media (prefers-reduced-motion:no-preference){.pop:not([hidden]),.bar.compact.open .sheet{' +
    'animation:dh-in var(--dh-dur-2) var(--dh-ease)}}' +
    '@keyframes dh-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}';

  const FOOT_CSS = BASE_CSS +
    ':host{display:block;margin-top:var(--dh-7)}' +
    '.f{border-top:1px solid var(--dh-line);font-size:13px;color:var(--dh-ink-2)}' +
    '.in{max-width:var(--dh-shell-max,var(--dh-max));margin:0 auto;padding:var(--dh-5) var(--dh-gutter) var(--dh-6);' +
    'display:grid;gap:14px}' +
    '.top{display:flex;flex-wrap:wrap;align-items:center;gap:10px 28px}' +
    '.home{display:flex;align-items:center;gap:8px;color:var(--dh-ink);font-weight:650;font-stretch:112%;font-size:15px}' +
    '.home .tld{color:var(--dh-ink-2);font-weight:520}' +
    '.doors{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0;padding:0;list-style:none}' +
    '.doors a{color:var(--dh-ink);font-weight:520;font-size:14px}' +
    '.doors a:hover,.meta a:hover{color:var(--dh-brand-ink);text-decoration:underline;text-underline-offset:3px}' +
    '.doors a[aria-current]{color:var(--dh-brand-ink)}' +
    '.meta{display:flex;flex-wrap:wrap;gap:4px 16px}' +
    '.meta a{color:var(--dh-ink-2);text-decoration:underline;text-decoration-color:var(--dh-line-2);' +
    'text-underline-offset:3px}' +
    '@media (max-width:560px){.top{flex-direction:column;align-items:flex-start}' +
    '.top nav{width:100%}.doors{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}' +
    '.doors a{display:block;padding:9px 0}}';

  const HASH_CSS = BASE_CSS +
    ':host{display:inline-flex;align-items:center;gap:2px;max-width:100%;vertical-align:baseline;' +
    'font-family:var(--dh-mono);font-size:.92em;line-height:1.3}' +
    '.v{white-space:nowrap;font-variant-ligatures:none}' +
    ':host([full]) .v{white-space:normal;overflow-wrap:anywhere;word-break:break-all}' +
    'a.v{color:var(--dh-brand-ink)}' +
    'a.v:hover{text-decoration:underline;text-underline-offset:3px}' +
    '.e{color:var(--dh-ink-3);padding:0 1px}' +
    '.cp{display:grid;place-items:center;width:24px;height:24px;border-radius:4px;color:var(--dh-ink-2);flex:none;' +
    'align-self:center}' +
    '.cp:hover{background:var(--dh-hover);color:var(--dh-ink)}' +
    '.cp.done{color:var(--dh-good)}' +
    '@media (pointer:coarse){.cp{width:40px;height:40px;margin:-8px -8px -8px 0}}';

  /* ---------------------------------------------------------------- base element */
  // Shadow root + one adopted stylesheet per element class; re-render on any observed attribute change.
  class ShellElement extends HTMLElement {
    static sheetFor(css) {
      if (!Object.prototype.hasOwnProperty.call(this, '_sheet')) {
        try { this._sheet = new CSSStyleSheet(); this._sheet.replaceSync(css); } catch { this._sheet = css; }
      }
      return this._sheet;
    }
    connectedCallback() {
      if (!this.shadowRoot) {
        const sr = this.attachShadow({ mode: 'open' });
        const s = this.constructor.sheetFor(this.constructor.css);
        // Engines without constructable stylesheets get a <style> element (blocked by a strict style-src; those
        // engines predate the CSPs in this family).
        if (typeof s === 'string') this._style = h('style', null, s);
        else sr.adoptedStyleSheets = [s];
        this._subs = [];
      }
      this.render();
    }
    disconnectedCallback() { this._drop(); }
    attributeChangedCallback(name, oldV, newV) {
      if (this.shadowRoot && this.isConnected && oldV !== newV) this.render();
    }
    // Replace the shadow content; keeps the fallback <style> if there is one.
    _paint(...nodes) { this.shadowRoot.replaceChildren(...(this._style ? [this._style] : []), ...nodes); }
    // Subscribe to theme or network changes until the next render or disconnect.
    _on(set, fn) { set.add(fn); this._subs.push(() => set.delete(fn)); }
    _drop() { while (this._subs && this._subs.length) this._subs.pop()(); }
  }

  const productOf = (el) => (PRODUCTS[el.getAttribute('product')] ? el.getAttribute('product') : 'home');
  const current = (on, value = 'true') => (on ? value : null);

  /* ---------------------------------------------------------------- <dashhq-bar> */
  let openBar = null; // only one bar menu open on the page

  class DashhqBar extends ShellElement {
    static get observedAttributes() {
      return ['product', 'product-name', 'product-href', 'network', 'networks', 'network-settings', 'no-theme'];
    }
    static css = BAR_CSS;

    constructor() {
      super();
      this._fit = this._fit.bind(this);
      this._onDoc = this._onDoc.bind(this);
      this._onPointer = this._onPointer.bind(this);
      this._onKey = this._onKey.bind(this);
    }
    connectedCallback() {
      bars.add(this);
      this._ro = new ResizeObserver(this._fit);
      const first = !this.shadowRoot;
      super.connectedCallback();
      if (first) this.shadowRoot.addEventListener('focusout', (e) => this._onFocusOut(e));
      doc.addEventListener('pointerdown', this._onPointer, true);
      doc.addEventListener('click', this._onDoc, true);
      doc.addEventListener('keydown', this._onKey);
      doc.fonts.ready.then(this._fit);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      bars.delete(this);
      doc.removeEventListener('pointerdown', this._onPointer, true);
      doc.removeEventListener('click', this._onDoc, true);
      doc.removeEventListener('keydown', this._onKey);
      this._ro.disconnect();
      this.close();
      if (this._net) { this._net = null; netChanged(); }
    }

    render() {
      const key = productOf(this);
      const net = parseNetwork(this.getAttribute('network'));
      const kind = networkKind(net);
      // Re-rendering replaces the shadow DOM; remember which control had focus so keyboard users keep their place.
      const focused = this.shadowRoot.activeElement && this.shadowRoot.activeElement.dataset.f;

      this.close();
      this._drop();

      const switchBtn = h('button', { class: 'switch', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'dh-doors',
        'aria-label': 'All dashhq tools', 'data-f': 'switch' }, icon('chevron', 16));
      const doorPop = h('nav', { class: 'pop doorpop', id: 'dh-doors', hidden: true, 'aria-label': 'dashhq tools' },
        this._family(key, net));
      switchBtn.addEventListener('click', () => this._toggle('door', switchBtn, doorPop));

      this._navSlot = h('slot', { name: 'nav' });
      this._navSlot.addEventListener('slotchange', this._fit);
      this._nav = h('div', { class: 'nav empty', part: 'nav' }, this._navSlot);
      const sheetEl = h('div', { class: 'sheet', id: 'dh-sheet' }, this._nav, h('div', { class: 'family' }, this._family(key, net)));

      const end = h('div', { class: 'end' }, net && this._netControl(net, kind));
      if (!this.hasAttribute('no-theme')) {
        const tbtn = h('button', { class: 'tbtn', type: 'button', 'data-f': 'theme' });
        const sync = () => {
          const dark = resolved() === 'dark';
          tbtn.replaceChildren(icon(dark ? 'sun' : 'moon', 18));
          tbtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
          tbtn.setAttribute('title', dark ? 'Light theme' : 'Dark theme');
        };
        sync();
        this._on(themeListeners, sync);
        tbtn.addEventListener('click', toggleTheme);
        end.append(tbtn);
      }
      const menuBtn = h('button', { class: 'menu', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'dh-sheet',
        'aria-label': 'Menu', 'data-f': 'menu' }, icon('menu', 20));
      menuBtn.addEventListener('click', () => this._toggle('sheet', menuBtn, sheetEl));
      end.append(h('slot', { name: 'actions' }), menuBtn);

      const productHref = this.getAttribute('product-href') || '/';
      const product = key !== 'home' && h('a', { class: 'product', href: net ? withNetwork(productHref, net) : productHref },
        h('slot', { name: 'logo' }), h('span', { class: 'pn' }, this.getAttribute('product-name') || PRODUCTS[key].name));
      this._row = h('div', { class: 'row' },
        h('a', { class: 'home', href: href('home'), 'aria-label': 'dashhq.org home' },
          mark(22), h('span', { class: 'wm', 'aria-hidden': 'true' }, 'dashhq')),
        product && [h('span', { class: 'slash', 'aria-hidden': 'true' }, '/'), product],
        switchBtn, doorPop, sheetEl, end);
      this._bar = h('header', { class: `bar ${kind}${key === 'home' ? ' is-home' : ''}`, part: 'bar' }, this._row);
      // Following any link inside the bar (including the product's slotted nav) closes what is open.
      this._bar.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a')) this.close(); });
      this._paint(this._bar);
      // Re-check the fit whenever anything in the row changes width: slotted content, the network, a late font.
      this._ro.disconnect();
      [this, this._nav, end, product].forEach((el) => el && this._ro.observe(el));
      this._fit();
      if (focused) { const f = this.shadowRoot.querySelector(`[data-f="${focused}"]`); if (f) f.focus(); }
      if (net !== this._net) { this._net = net; queueMicrotask(netChanged); }
    }

    // Doors, Apps, Also and the theme choice: the desktop popover and the phone sheet each get a copy.
    _family(key, net) {
      const cur = PRODUCTS[key].door;
      const to = (k) => href(k, '/', net ? { network: net } : undefined);
      const link = (k) => h('a', { href: to(k), 'aria-current': current(key === k, 'page') }, PRODUCTS[k].name);
      const doors = h('ul', { class: 'doors' }, DOORS.map((d) =>
        h('li', { class: 'door', 'aria-current': current(cur === d.door) },
          h('a', { class: 'dn', href: to(d.key) }, d.label),
          h('span', { class: 'dd' }, d.desc),
          d.steps && h('span', { class: 'steps' }, link(d.steps[0]), h('span', { 'aria-hidden': 'true' }, '→'), link(d.steps[1])))));
      const group = (label, keys) => h('div', { class: 'grp' }, h('span', { class: 'gl' }, label), keys.map((k) => link(k)));

      const btns = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([p, label]) => {
        const b = h('button', { type: 'button' }, label);
        b.addEventListener('click', () => setPref(p));
        return [p, b];
      });
      const sync = () => btns.forEach(([p, b]) => b.setAttribute('aria-pressed', String(p === pref)));
      sync();
      this._on(themeListeners, sync);
      const themes = h('div', { class: 'themes' }, h('span', { class: 'gl' }, 'Theme'),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Theme' }, btns.map(([, b]) => b)));

      return [doors, group('Apps', APPS), group('Also', ALSO), themes];
    }

    _netControl(net, kind) {
      const label = networkLabel(net);
      const list = (this.getAttribute('networks') || '').split(/[\s,]+/).map(parseNetwork).filter(Boolean);
      const face = [h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'sr' }, 'Network: '), label];
      if (list.length < 2) return h('span', { class: 'net ' + kind, title: 'Network: ' + label }, face);

      const btn = h('button', { class: 'net ' + kind, type: 'button', 'aria-expanded': 'false', 'aria-controls': 'dh-net',
        'data-f': 'net' }, face, icon('chevron', 14));
      const options = list.map((n) => {
        const a = h('a', { class: 'opt', href: withNetwork(location.href, n), 'aria-current': current(n === net) },
          h('span', { class: 'tick' }, n === net && icon('check', 16)), networkLabel(n));
        // SPAs change the URL after render, so rebuild the target from the current URL whenever it is used.
        const fresh = () => { a.href = withNetwork(location.href, n); };
        a.addEventListener('pointerenter', fresh);
        a.addEventListener('focus', fresh);
        a.addEventListener('click', (e) => {
          fresh();
          const proceed = this.dispatchEvent(new CustomEvent('dashhq-network', {
            bubbles: true, composed: true, cancelable: true, detail: { network: n, href: a.href } }));
          if (!proceed) e.preventDefault();
        });
        return a;
      });
      const settings = this.getAttribute('network-settings');
      const pop = h('nav', { class: 'pop netpop', id: 'dh-net', hidden: true, 'aria-label': 'Network' }, options,
        settings && h('a', { class: 'opt more', href: settings }, 'Network settings'));
      btn.addEventListener('click', () => this._toggle('net', btn, pop));
      return h('div', { class: 'netwrap' }, btn, pop);
    }

    // which: 'door' | 'net' (popovers) or 'sheet' (the phone menu)
    _setOpen(o, on) {
      o.trigger.setAttribute('aria-expanded', String(on));
      if (o.which === 'sheet') {
        this._bar.classList.toggle('open', on);
        o.trigger.replaceChildren(icon(on ? 'close' : 'menu', 20));
        o.trigger.setAttribute('aria-label', on ? 'Close menu' : 'Menu');
      } else {
        o.panel.hidden = !on;
        this._bar.classList.toggle('popping', on);
      }
    }
    _toggle(which, trigger, panel) {
      const was = this._open && this._open.which === which;
      this.close();
      if (was) return;
      if (openBar && openBar !== this) openBar.close();
      openBar = this;
      this._open = { which, trigger, panel };
      this._setOpen(this._open, true);
      if (which === 'sheet') {
        // The sheet comes before the menu button in DOM order, so put keyboard focus on its first link.
        const first = this._navSlot.assignedElements().map((el) => (el.matches('a') ? el : el.querySelector('a')))
          .find((a) => a && a.getClientRects().length) || panel.querySelector('a');
        if (first) first.focus();
      }
    }
    close() {
      const o = this._open;
      if (!o) return null;
      this._open = null;
      if (openBar === this) openBar = null;
      this._setOpen(o, false);
      return o.trigger;
    }
    _outside(e) {
      if (!this._open) return false;
      const path = e.composedPath();
      return !path.includes(this._open.panel) && !path.includes(this._open.trigger);
    }
    _onPointer(e) {
      if (!this._outside(e)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    _onDoc(e) {
      if (!this._outside(e)) return;
      if (e.detail > 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      this.close();
    }
    _onKey(e) {
      if (e.key !== 'Escape' || !this._open) return;
      const t = this.close();
      if (t) t.focus();
    }
    _onFocusOut(e) {
      const o = this._open, to = e.relatedTarget;
      if (!o || !to || o.panel.contains(to) || to === o.trigger) return;
      if (o.which === 'sheet' && this.contains(to)) return; // the product's slotted nav lives in the sheet
      this.close();
    }
    // Collapse to the phone layout whenever the full row does not fit. Runs inside ResizeObserver, before paint.
    _fit() {
      const bar = this._bar, row = this._row;
      if (!bar) return;
      // A product may hide its slotted nav (an app with its own bottom nav on phones); treat that as no nav.
      const shown = this._navSlot.assignedElements().some((el) => getComputedStyle(el).display !== 'none');
      this._nav.classList.toggle('empty', !shown);
      const w = this.getBoundingClientRect().width;
      const was = bar.classList.contains('compact');
      bar.classList.remove('compact');
      const compact = w > 0 && (w < 600 || row.scrollWidth > row.clientWidth + 1);
      bar.classList.toggle('compact', compact);
      if (this._open && was !== compact && (this._open.which === 'sheet') !== compact) this.close();
    }
  }

  /* ---------------------------------------------------------------- <dashhq-footer> */
  class DashhqFooter extends ShellElement {
    static get observedAttributes() { return ['product', 'source']; }
    static css = FOOT_CSS;

    render() {
      this._drop();
      this._on(netListeners, () => this.render());
      const key = productOf(this);
      const cur = PRODUCTS[key].door;
      const src = this.getAttribute('source');
      const doorLinks = DOORS.slice(1).map((d) =>
        h('li', null, h('a', { href: href(d.key), 'aria-current': current(cur === d.door) }, d.label)));
      doorLinks.push(h('li', null, h('a', { href: href('home', '/#apps'), 'aria-current': current(cur === 'apps') }, 'Apps')));
      this._paint(h('footer', { class: 'f', part: 'footer' },
        h('div', { class: 'in' },
          h('div', { class: 'top' },
            h('a', { class: 'home', href: href('home') }, mark(20), h('span', null, 'dashhq', h('span', { class: 'tld' }, '.org'))),
            h('nav', { 'aria-label': 'dashhq tools' }, h('ul', { class: 'doors' }, doorLinks))),
          h('slot'),
          h('div', { class: 'meta' },
            h('span', null, key === 'home' ? 'Tools for the Dash network.' : `${PRODUCTS[key].name} is part of dashhq.org.`),
            src && h('a', { href: src }, 'Source'),
            h('a', { href: href('home', '/#directory') }, 'Directory')))));
    }
  }

  /* ---------------------------------------------------------------- <dashhq-hash> */
  class DashhqHash extends ShellElement {
    static get observedAttributes() { return ['value', 'href', 'head', 'tail', 'full', 'label', 'no-copy']; }
    static css = HASH_CSS;

    render() {
      const value = (this.getAttribute('value') || this.textContent || '').trim();
      // Without a value attribute the text is the value, and it may not be parsed yet when we first render.
      if (!this.hasAttribute('value') && !this._mo) {
        this._mo = new MutationObserver(() => this.render());
        this._mo.observe(this, { childList: true, characterData: true, subtree: true });
      }
      const head = Math.max(2, parseInt(this.getAttribute('head'), 10) || 6);
      const tail = Math.max(2, parseInt(this.getAttribute('tail'), 10) || 4);
      const full = this.hasAttribute('full') || value.length <= head + tail + 1;
      const label = this.getAttribute('label') || 'value';
      const link = this.getAttribute('href');
      const text = full ? value : [
        h('span', { class: 'sr' }, `${label} ${value}`),
        h('span', { 'aria-hidden': 'true' }, value.slice(0, head), h('span', { class: 'e' }, '…'), value.slice(-tail))
      ];
      const v = h(link ? 'a' : 'span', { class: 'v', href: link, title: value }, text);
      if (this.hasAttribute('no-copy') || !value) return this._paint(v);

      const live = h('span', { class: 'sr', 'aria-live': 'polite' });
      const btn = h('button', { class: 'cp', type: 'button', 'aria-label': 'Copy ' + label, title: 'Copy' }, icon('copy', 15));
      const show = (done, msg) => {
        btn.classList.toggle('done', done);
        btn.replaceChildren(icon(done ? 'check' : 'copy', 15));
        live.textContent = msg;
      };
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!navigator.clipboard) return show(false, 'Copy needs a secure page. Select the text instead.');
        navigator.clipboard.writeText(value).then(() => {
          show(true, 'Copied');
          clearTimeout(this._t);
          this._t = setTimeout(() => show(false, ''), 1400);
        }, () => show(false, 'Copy failed. Select the text instead.'));
      });
      this._paint(v, btn, live);
    }
  }

  /* ---------------------------------------------------------------- register + public API */
  for (const [name, cls] of [['dashhq-bar', DashhqBar], ['dashhq-footer', DashhqFooter], ['dashhq-hash', DashhqHash]]) {
    if (!customElements.get(name)) customElements.define(name, cls);
  }

  Object.values(PRODUCTS).forEach(Object.freeze);
  window.dashhq = Object.freeze({
    version: VERSION,
    lab: LAB,
    products: Object.freeze(PRODUCTS),
    origin,
    href,
    theme: Object.freeze({
      get pref() { return pref; },
      get resolved() { return resolved(); },
      set: setPref,
      toggle: toggleTheme
    }),
    network: Object.freeze({
      parse: parseNetwork,
      label: networkLabel,
      kind: networkKind,
      fromUrl: networkFromUrl,
      withNetwork,
      canonicalize: canonicalizeNetworkParam
    })
  });
})();
