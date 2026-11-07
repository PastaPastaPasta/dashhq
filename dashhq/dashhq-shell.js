/*! dashhq-shell 1.9.3 | family bar, footer, hash display, sign-in help, not-found and moved notices, and theme for dashhq.org tools | MIT */
/* Load as a classic, blocking script in <head>, before any stylesheet that depends on [data-theme]:
     <script src="/dashhq/dashhq-shell.js"></script>
   CSP: needs only script-src 'self'. No inline script, no eval, no innerHTML, no style attributes,
   no third-party requests. Element styles use constructable stylesheets, which CSP does not govern. */
(() => {
  'use strict';
  if (window.dashhq && window.dashhq.version) return;

  const VERSION = '1.9.3';
  const doc = document;
  const root = doc.documentElement;
  const host = location.hostname;

  /* ---------------------------------------------------------------- family registry */
  // door: home | network | governance | platform | start | apps
  // net: the product accepts ?network=, so family links carry the current network into it
  // only: the one network the product runs on, shown next to it in the family menus
  const PRODUCTS = {
    home:     { name: 'dashhq',        url: 'https://dashhq.org',          door: 'home' },
    radar:    { name: 'Radar',         url: 'https://radar.dashhq.org',    door: 'network',    net: true },
    gov:      { name: 'Governance',    url: 'https://gov.dashhq.org',      door: 'governance', net: true },
    explorer: { name: 'Explorer',      url: 'https://explorer.dashhq.org', door: 'platform',   net: true },
    faucet:   { name: 'Faucet',        url: 'https://faucet.dashhq.org',   door: 'start',      net: true },
    bridge:   { name: 'Bridge',        url: 'https://bridge.thepasta.org', door: 'start',      net: true },
    arch:     { name: 'Architecture',  url: 'https://arch.dashhq.org',     door: 'platform' },
    fees:     { name: 'Fee estimator', url: 'https://explorer.dashhq.org',     door: 'platform',   net: true },
    dapi:     { name: 'DAPI console',  url: 'https://dapi.dashhq.org',     door: 'platform',   net: true },
    vote:     { name: 'EvoVote',       url: 'https://vote.dashhq.org',     door: 'governance', net: true },
    basics:   { name: 'Basics',        url: 'https://basics.dashhq.org',   door: 'platform' },
    forge:    { name: 'Forge',         url: 'https://forge.dashhq.org',    door: 'apps',       only: 'Testnet' },
    pollr:    { name: 'Pollr',         url: 'https://pollr.dashhq.org',    door: 'apps',       only: 'Testnet' },
    yappr:    { name: 'Yappr',         url: 'https://yap.pr',              door: 'apps',       only: 'Testnet' }
  };
  PRODUCTS.nodes = PRODUCTS.radar;
  const DOORS = [
    { door: 'network', key: 'radar', label: 'Radar', desc: 'Network health and masternodes' },
    { door: 'governance', key: 'gov', label: 'Governance', desc: 'Proposals, polls and name contests' },
    { door: 'platform', key: 'explorer', label: 'Explorer', desc: 'Identities, names, contracts, fees' },
    { door: 'start', key: 'bridge', label: 'Start on Testnet', desc: 'Address, tDASH, identity, username' }
  ];
  const ALSO = ['arch', 'dapi', 'faucet'];
  const DESCRIPTIONS = {
    arch: 'How Platform works', dapi: 'Raw node responses', faucet: 'Testnet DASH for your address'
  };
  const MOVED = { fees: ['explorer', '/tools/fees/'] };
  // Retired products: the address people have bookmarked, and the product that is its new home. <dashhq-moved>
  // forwards there at once with ?moved-from=<key>, and the new home's bar says so once.
  // paths: where its forward can land, the only pages that show the notice (trailing slashes don't matter).
  const RETIRED = {
    pollr: { to: 'gov', was: 'pollr.dashhq.org', paths: ['/polls'] },
    vote: { to: 'gov', was: 'vote.dashhq.org', paths: ['/names'] },
    fees: { to: MOVED.fees[0], was: 'fees.dashhq.org', paths: [MOVED.fees[1]] },
    basics: { to: 'explorer', was: 'basics.dashhq.org', paths: ['/', '/identity/', '/dpns/'] }
  };
  const ARRIVAL_PARAM = 'moved-from';
  // The hub's page that explains identities, keys and each app's sign-in (linked from <dashhq-signin-help>).
  const IDENTITY_PATH = '/identity/';

  /* ---------------------------------------------------------------- local lab */
  // On dashhq.localhost and *.dashhq.localhost every family link stays in the lab: same scheme, same port.
  const LAB = host === 'dashhq.localhost' || host.endsWith('.dashhq.localhost');

  function origin(key) {
    if (MOVED[key]) key = MOVED[key][0];
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
  // The family's order, whatever order a site passes: Mainnet, Testnet, then devnets A to Z. In a menu where a
  // mis-click means real money or practice money, the same position always means the same network.
  function sortNetworks(list) {
    const rank = (n) => (n === 'mainnet' ? 0 : n === 'testnet' ? 1 : 2);
    return [...new Set([...(list || [])].map(parseNetwork).filter(Boolean))]
      .sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
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
    if (!parseNetwork(sp.get('network') ?? sp.get('net'))) return;
    const next = withNetwork(location.href, networkFromUrl());
    if (next !== location.href) history.replaceState(history.state, '', next);
  }

  canonicalizeNetworkParam();

  // Arriving from a retired product: remember where from, then take the marker out of the address before any app
  // reads it, so a reload, a copied link or the app's router never sees it. Every other byte of the query is kept.
  let forwarded = false; // this page was itself reached by a retired page's forward
  const arrival = (() => {
    if (!location.search) return null;
    const parts = location.search.slice(1).split('&');
    let from = null;
    const kept = parts.filter((p) => {
      const i = p.indexOf('=');
      if ((i < 0 ? p : p.slice(0, i)) !== ARRIVAL_PARAM) return true;
      if (from == null) {
        try { from = decodeURIComponent(i < 0 ? '' : p.slice(i + 1)); } catch { from = ''; }
      }
      return false;
    });
    if (kept.length === parts.length) return null;
    forwarded = true;
    const href = location.href, cut = href.search(/[?#]/), hash = href.indexOf('#');
    try {
      history.replaceState(history.state, '', href.slice(0, cut) + (kept.some(Boolean) ? '?' + kept.join('&') : '') +
        (hash < 0 ? '' : href.slice(hash)));
    } catch { /* an opaque or sandboxed document keeps its address */ }
    // Only where the old product's links land, so a hand-made link can't make another page claim the move.
    const r = Object.hasOwn(RETIRED, from) && RETIRED[from];
    const norm = (x) => (x.length > 1 ? x.replace(/\/+$/, '') : x);
    const here = norm(location.pathname);
    const lands = r && r.paths.map(norm).some((p) => (p === '/' ? here === '/' : here === p || here.startsWith(p + '/')));
    return lands ? { from, bar: null, el: null, ro: null, done: false } : null;
  })();
  // While the notice shows, a sticky bar is taller: pad the page's scroll by its height so anchors and
  // scrollIntoView (sized for the bar alone) still land clear of it. The page's own value (read once, when the padding
  // starts) comes back after. null restores.
  let padWas = null;
  function padScroll(px) {
    if (px == null) {
      if (padWas) root.style.scrollPaddingTop = padWas.inline;
      padWas = null;
      return;
    }
    if (padWas === null) padWas = { inline: root.style.scrollPaddingTop, base: getComputedStyle(root).scrollPaddingTop };
    root.style.scrollPaddingTop = padWas.base === 'auto' ? `${px}px` : `calc(${padWas.base} + ${px}px)`;
  }
  // The arrival notice ends when dismissed, or when the visitor moves on to another page of the app (a push or a
  // traverse in the Navigation API; an app canonicalising its own address with replaceState doesn't count). Without the
  // Navigation API it stays until dismissed. Focus that was on it moves to the product's name.
  function endArrival(refocus) {
    if (arrival.done) return;
    arrival.done = true;
    if (arrival.ro) arrival.ro.disconnect();
    padScroll(null);
    const el = arrival.el;
    if (!el) return;
    const sr = el.getRootNode();
    const had = refocus && sr.activeElement && el.contains(sr.activeElement);
    el.remove();
    arrival.el = null;
    const to = had && (sr.querySelector('.product') || sr.querySelector('.home'));
    if (to) to.focus();
  }
  if (arrival && window.navigation && typeof navigation.addEventListener === 'function') {
    let path = location.pathname;
    navigation.addEventListener('currententrychange', (e) => {
      if (e.navigationType !== 'replace' && location.pathname !== path) endArrival(false);
      path = location.pathname;
    });
  }

  // The page's network: from the most recently connected <dashhq-bar network>, else from the URL.
  const bars = new Set();
  const netListeners = new Set();
  function activeNetwork() {
    let n = null;
    for (const b of bars) n = parseNetwork(b.getAttribute('network')) || n;
    return n || networkFromUrl();
  }
  const netChanged = () => [...netListeners].forEach((fn) => fn());

  // A record that isn't on this network: look on the others, in the family's order. exists(network, signal) resolves
  // true or false; a throw counts as "couldn't check". Resolves to the first network that has it, 'none' when every
  // other network said no, or 'unknown' when none had it and at least one couldn't be asked.
  async function findElsewhere(exists, opts) {
    const o = opts || {};
    const here = parseNetwork(o.network) || activeNetwork();
    let unknown = false;
    for (const n of sortNetworks(o.networks || ['mainnet', 'testnet']).filter((x) => x !== here)) {
      if (o.signal && o.signal.aborted) return 'unknown';
      try { if (await exists(n, o.signal)) return n; } catch { unknown = true; }
    }
    return unknown ? 'unknown' : 'none';
  }

  function href(key, path, opts) {
    const base = origin(key);
    const u = new URL(path || '/', base + '/');
    if (u.origin !== new URL(base).origin) throw new Error(`dashhq: href("${key}") must stay on ${base}`);
    if (MOVED[key]) u.pathname = MOVED[key][1];
    const p = PRODUCTS[key];
    const fallback = p.door === 'start' ? parseNetwork(u.searchParams.get('network')) || 'testnet' : activeNetwork();
    const n = parseNetwork(opts && 'network' in opts ? opts.network : fallback);
    if (p.net && n) {
      u.searchParams.delete('net');
      u.searchParams.set('network', n);
    }
    return u.href;
  }

  function doorHref(key, network) {
    if (MOVED[key]) return href(MOVED[key][0], MOVED[key][1], network ? { network } : undefined);
    if (PRODUCTS[key].door === 'start') {
      return href(key, key === 'bridge' ? '/?mode=create&journey=start' : '/?journey=start', { network: 'testnet' });
    }
    return href(key, '/', network ? { network } : undefined);
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
    syncTabs();
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
    monitor: ['M2.5 3.5h15v10h-15z', 'M10 13.5V17M7 17h6'],
    moon: ['M15.5 12.2A6.5 6.5 0 0 1 7.8 4.5a6.5 6.5 0 1 0 7.7 7.7z'],
    sun: ['M10 6.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
      'M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4'],
    copy: ['M7 7h8.5v8.5H7z', 'M4.5 12.5V4.5h8'],
    check: ['M4.5 10.5l3.5 3.5 7.5-8'],
    info: ['M10 2.8a7.2 7.2 0 1 1 0 14.4 7.2 7.2 0 0 1 0-14.4z', 'M10 9.2v4.6', 'M10 6.4v.1'],
    identity: ['M2.5 4.5h15v11h-15z', 'M8.6 9.2a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0z', 'M4.4 13.3c.6-1.2 1.4-1.8 2.4-1.8s1.8.6 2.4 1.8',
      'M11.5 8.5h3.8M11.5 11.5h2.8']
  };
  const icon = (name, size) =>
    h('svg:svg', { viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true', focusable: 'false', class: 'ic' },
      ICONS[name].map((d) => h('svg:path', { d })));
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
    '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';

  const BAR_CSS = BASE_CSS +
    ':host{display:block;position:relative;z-index:40}' +
    ':host([sticky]){position:sticky;top:0}' +
    '.bar{position:relative;background:var(--dh-surface);border-bottom:1px solid var(--dh-line);' +
    '--dh-nav-dir:row;--dh-nav-h:32px;--dh-nav-fs:14px;--dh-nav-pad:10px;--dh-nav-align:center;' +
    '--dh-nav-only-phone:none;--dh-nav-only-desk:flex}' +
    '.bar.compact{--dh-nav-only-phone:flex;--dh-nav-only-desk:none}' +
    '.bar.test,.bar.dev{border-bottom:1px dashed var(--dh-line-2)}' +
    '.row{position:relative;max-width:var(--dh-shell-max,var(--dh-max));margin:0 auto;' +
    'padding:0 var(--dh-gutter);height:var(--dh-bar-h);display:flex;align-items:center;gap:2px;overflow:hidden}' +
    '.bar.popping .row,.bar.open .row{overflow:visible}' +
    '.lockup{display:flex;align-items:center;flex:none;gap:0}' +
    '.home{display:flex;align-items:center;height:36px;border-radius:var(--dh-r2);flex:none}' +
    '.wm{font-weight:650;font-stretch:112%;font-size:17px;letter-spacing:-.012em;line-height:1}' +
    '.is-home .wm{font-size:19px}' +
    '.slash{color:var(--dh-line-2);font-size:19px;font-weight:300;margin:0 7px;flex:none;line-height:1}' +
    '.product{display:flex;align-items:center;font-weight:580;font-size:15.5px;height:34px;' +
    'border-radius:var(--dh-r2);white-space:nowrap;min-width:0}' +
    '.pn{min-width:0}' +
    '.logo{display:none;flex:none;margin-right:7px}' +
    '.has-logo .logo{display:block}' +
    '::slotted([slot=logo]){display:block;width:22px;height:22px;border-radius:5px;object-fit:contain}' +
    '.product:hover .pn{text-decoration:underline;text-decoration-color:var(--dh-line-2);text-underline-offset:4px}' +
    '.doorwrap{position:relative;flex:none;margin-left:10px}' +
    '.switch{display:flex;align-items:center;gap:4px;padding:6px 8px;' +
    'border-radius:var(--dh-r2);color:var(--dh-ink-2);font-size:14.5px;font-weight:520;white-space:nowrap}' +
    '.switch:hover,.switch[aria-expanded=true]{background:var(--dh-hover);color:var(--dh-ink)}' +
    '.bar.nolabel .swl{display:none}' +
    '.switch .ic{transition:transform var(--dh-dur-2) var(--dh-ease)}' +
    '.switch[aria-expanded=true] .ic{transform:rotate(180deg)}' +
    '.sheet{display:contents}' +
    '.nav{display:flex;align-items:center;flex:none;margin-left:14px}' +
    '.family{display:none}' +
    '.end{display:flex;align-items:center;gap:6px;margin-left:auto;padding-left:12px;flex:none}' +
    '.tbtn,.menu{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--dh-r2);color:var(--dh-ink-2)}' +
    '.tbtn:hover,.tbtn[aria-expanded=true],.menu:hover,.menu[aria-expanded=true]{background:var(--dh-hover);color:var(--dh-ink)}' +
    '.menu{display:none}' +
    /* Network names distinguish live funds from practice funds. */
    '.netwrap{position:relative;flex:none}' +
    '.net{display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border:1px solid var(--dh-line-2);' +
    'border-radius:var(--dh-r2);background:var(--dh-surface);font-size:13px;font-weight:540;white-space:nowrap;' +
    'color:var(--dh-ink)}' +
    'button.net{padding-right:6px}' +
    'button.net:hover{background:var(--dh-hover)}' +
    '.net .dot{width:7px;height:7px;border-radius:50%;background:var(--dh-good);flex:none}' +
    '.net.test,.net.dev{background:var(--dh-chip)}' +
    '.net.dev{border-style:dotted;border-width:1.5px}' +
    '.net.test .dot,.net.dev .dot{background:transparent;border:1.5px solid var(--dh-ink-2)}' +
    '.net .ic{color:var(--dh-ink-2)}' +
    /* popovers */
    '.pop{position:absolute;top:calc(100% + 6px);z-index:2;background:var(--dh-surface);border-radius:var(--dh-r3);' +
    'box-shadow:var(--dh-shadow-pop);padding:6px}' +
    '.doorpop{left:0;width:420px;padding:8px}' +
    '.netpop{right:0;width:max-content;min-width:200px;max-width:min(300px,calc(100vw - 2 * var(--dh-gutter)))}' +
    '.nnote{margin:4px 0 0;padding:8px 10px 4px;border-top:1px solid var(--dh-line);font-size:13px;line-height:1.4;' +
    'color:var(--dh-ink-2)}' +
    '.opt{display:flex;align-items:center;gap:10px;min-height:36px;padding:6px 10px;border-radius:var(--dh-r2);' +
    'font-size:14px;color:var(--dh-ink)}' +
    '.opt:hover{background:var(--dh-hover)}' +
    '.opt .tick{width:16px;color:var(--dh-brand-ink);flex:none}' +
    '.opt.more{color:var(--dh-brand-ink);border-top:1px solid var(--dh-line);border-radius:0 0 var(--dh-r2) var(--dh-r2);' +
    'margin-top:4px}' +
    /* devnets sit behind one toggle unless the page is on one: internal networks are not for every visitor */
    'button.opt{width:100%;text-align:left;color:var(--dh-ink-2)}' +
    '.netpop button.opt .ic{margin-left:auto;transition:transform var(--dh-dur-2) var(--dh-ease)}' +
    'button.opt[aria-expanded=true] .ic{transform:rotate(180deg)}' +
    '.doors{list-style:none;margin:0;padding:0}' +
    '.door{display:grid;grid-template-columns:150px minmax(0,1fr);align-items:center;min-height:40px;' +
    'padding:9px 12px;border-radius:var(--dh-r2);line-height:22px}' +
    '.door:hover{background:var(--dh-hover)}' +
    '.door[aria-current]{background:var(--dh-chip);box-shadow:inset 3px 0 var(--dh-brand)}' +
    '.dn{font-weight:580;font-size:15px;white-space:nowrap}' +
    '.dd{font-size:13.5px;color:var(--dh-ink-2);white-space:nowrap}' +
    '.sep{height:1px;background:var(--dh-line);margin:8px 12px}' +
    '.all{color:var(--dh-brand-ink)}' +
    '.themewrap{position:relative;flex:none}' +
    '.themepop{right:0;width:220px}' +
    '.themeopt{width:100%;text-align:left;min-height:40px}' +
    '.themeopt[aria-checked=true]{background:var(--dh-chip);font-weight:580}' +
    '.themeopt .tick{margin-left:auto}' +
    '.themeopt .ic{flex:none;color:var(--dh-ink-2)}' +
    '.themeopt .tick .ic{color:var(--dh-brand-ink)}' +
    '.bar.compact .doorwrap{display:none}' +
    '.bar.compact .lockup{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto;' +
    'flex:0 1 auto;min-width:0;row-gap:3px}' +
    '.bar.compact.has-logo .lockup{grid-template-columns:26px minmax(0,1fr);column-gap:7px}' +
    '.bar.compact .logo{grid-area:1/1/3/2;margin:0}' +
    '.bar.compact ::slotted([slot=logo]){width:26px;height:26px}' +
    '.bar.compact .home{height:auto;grid-row:1;justify-self:start}' +
    '.bar.compact.has-logo .home,.bar.compact.has-logo .product{grid-column:2}' +
    '.bar.compact .wm{font-size:11.5px;color:var(--dh-ink-2)}' +
    '.bar.compact .slash{display:none}' +
    '.bar.compact .product{grid-row:2;height:auto;font-size:15px;line-height:1.15}' +
    '.bar.compact .pn{overflow:hidden;text-overflow:ellipsis}' +
    '.bar.compact.is-home .lockup{display:flex}' +
    '.bar.compact.is-home .wm{font-size:19px;color:var(--dh-ink)}' +
    '.bar.compact .end{padding-left:6px;gap:4px}' +
    '.bar.compact .net{padding:0 9px;gap:6px}.bar.compact button.net{padding-right:5px}' +
    '.bar.squeeze .nl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
    '.bar.squeeze .net{gap:4px;padding:0 10px}.bar.squeeze button.net{padding-right:6px}' +
    '.bar.compact .menu{display:grid}' +
    '.bar.compact .sheet{display:none;--dh-nav-dir:column;--dh-nav-h:44px;--dh-nav-fs:15px;--dh-nav-pad:12px;' +
    '--dh-nav-align:stretch;--dh-nav-weight:580;--dh-nav-ink:var(--dh-ink);--dh-nav-current-mark:inset 3px 0 var(--dh-brand)}' +
    '.sheet:focus{outline:none}' +
    '.scrim{display:none}' +
    '.bar.open .scrim{display:block;position:absolute;left:0;right:0;top:100%;height:100dvh;' +
    'background:rgba(6,19,27,.38);touch-action:none}' +
    '.bar.compact.open .sheet{display:block;position:absolute;left:0;right:0;top:100%;z-index:2;' +
    'background:var(--dh-surface);border-bottom:1px solid var(--dh-line);box-shadow:0 18px 30px -18px rgba(8,24,36,.45);' +
    'max-height:calc(100vh - var(--dh-bar-h) - var(--dh-tabs-h, 0px));' +
    'max-height:calc(100dvh - var(--dh-bar-h) - var(--dh-tabs-h, 0px));overflow:auto;' +
    'overscroll-behavior:contain;padding:8px var(--dh-gutter) 16px}' +
    '.bar.compact .nav{display:block;margin:0 0 6px}' +
    '.bar.compact .nav.empty{display:none}' +
    '.bar.compact .family{display:block;border-top:1px solid var(--dh-line);padding-top:8px}' +
    '.bar.compact .nav.empty+.family{border-top:0;padding-top:0}' +
    '.fl{margin:0;padding:6px 12px;font-size:12.5px;color:var(--dh-ink-2)}' +
    '.pd{list-style:none;margin:0;padding:0}' +
    '.pd a,.hm{display:flex;align-items:center;min-height:44px;padding:0 12px;' +
    'border-radius:var(--dh-r2);font-size:15px;font-weight:540}' +
    '@media (hover:hover){.pd a:hover,.hm:hover{background:var(--dh-hover)}}' +
    '.pd a[aria-current]{background:var(--dh-chip);box-shadow:inset 3px 0 var(--dh-brand)}' +
    '.hm{color:var(--dh-brand-ink)}' +
    '[hidden]{display:none!important}' +
    /* phone-nav="tabs": the product's sections become a bottom tab bar; the menu then holds only the family */
    '.bar.compact.tabs .nav{position:fixed;left:0;right:0;bottom:0;z-index:3;margin:0;' +
    'padding:0 max(env(safe-area-inset-right,0px),4px) env(safe-area-inset-bottom,0px) max(env(safe-area-inset-left,0px),4px);' +
    'background:var(--dh-surface);border-top:1px solid var(--dh-line);' +
    '--dh-nav-dir:row;--dh-nav-h:56px;--dh-nav-fs:12px;--dh-nav-pad:4px;--dh-nav-align:stretch;--dh-nav-gap:0;' +
    '--dh-nav-item:1 1 0;--dh-nav-item-dir:column;--dh-nav-item-gap:4px;--dh-nav-item-justify:center;--dh-nav-ws:normal;' +
    '--dh-nav-icon:block;--dh-nav-radius:0;--dh-nav-current-bg:transparent;--dh-nav-current-ink:var(--dh-ink);' +
    '--dh-nav-current-mark:inset 0 2px 0 var(--dh-select);--dh-nav-current-icon:var(--dh-select)}' +
    '.bar.compact.tabs .nav.empty{display:none}' +
    '.bar.compact.tabs .family{border-top:0;padding-top:0}' +
    '.bar.compact .net{height:36px}' +

    'button.net{position:relative}.bar.compact button.net::after{content:"";position:absolute;inset:-4px -2px}' +
    /* Arriving from a retired product: one quiet line under the row, in the bar so every product gets it. */
    '.arrive{border-top:1px solid var(--dh-line);background:var(--dh-info-soft)}' +
    '.ain{max-width:var(--dh-shell-max,var(--dh-max));margin:0 auto;padding:4px var(--dh-gutter);display:flex;' +
    'align-items:center;gap:10px;min-height:40px;font-size:14px;line-height:1.4;color:var(--dh-ink)}' +
    '.ain>.ic{color:var(--dh-info);flex:none}' +
    '.at{margin:0;flex:1 1 auto;min-width:0;overflow-wrap:anywhere}' +
    '.at b{font-weight:620}' +
    '.ax{width:32px;height:32px;display:grid;place-items:center;flex:none;margin-right:-6px;border-radius:var(--dh-r2);' +
    'color:var(--dh-ink-2)}' +
    '.ax:hover{background:var(--dh-hover);color:var(--dh-ink)}' +
    '.bar.compact .am{display:none}' +
    '@media (pointer:coarse){.ax{width:40px;height:40px;margin-right:-10px}}' +
    '@media (prefers-reduced-motion:no-preference){.pop:not([hidden]),.bar.compact.open .sheet{' +
    'animation:dh-in var(--dh-dur-2) var(--dh-ease)}}' +
    '@keyframes dh-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}';

  const FOOT_CSS = BASE_CSS +
    ':host{display:block;margin-top:var(--dh-7);padding-bottom:var(--dh-tabs-h,0px)}' +
    '.f{border-top:1px solid var(--dh-line);font-size:14px;line-height:1.5;color:var(--dh-ink-2)}' +
    '.in{max-width:var(--dh-shell-max,var(--dh-max));margin:0 auto;padding:22px var(--dh-gutter) 26px;' +
    'display:flex;flex-wrap:wrap;align-items:baseline;gap:10px 24px}' +
    '.home{color:var(--dh-ink);font-weight:650;font-stretch:112%;font-size:15px;flex:none}' +
    '.sentence{flex:1 1 360px;margin:0;min-width:0}' +
    '.links{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px}' +
    '.links a{color:var(--dh-ink-2);text-decoration:underline;text-decoration-color:var(--dh-line-2);text-underline-offset:3px}' +
    '.links a:hover{color:var(--dh-brand-ink)}' +
    '::slotted(*){display:inline!important;margin:0!important;padding:0!important;font:inherit!important;color:inherit!important}' +
    '::slotted(a){text-decoration:underline;text-decoration-color:var(--dh-line-2);text-underline-offset:3px}' +
    '@media(max-width:600px){.in{gap:10px 16px}.sentence{flex-basis:calc(100% - 100px)}.links{width:100%}}';

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

  // A well (sunken, no border) so it sits inside a dialog or card without becoming a card in a card.
  const SIGNIN_CSS = BASE_CSS +
    ':host{display:block}' +
    '.w{container-type:inline-size;display:grid;gap:10px;padding:14px 16px;background:var(--dh-page);' +
    'border:1px solid var(--dh-line);border-radius:var(--dh-r3);font-size:14px;line-height:1.45;color:var(--dh-ink);text-align:left}' +
    'p{margin:0}' +
    '.t{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:620;line-height:1.3}' +
    '.t .ic{color:var(--dh-brand-ink);flex:none}' +
    '.p,.q,.nn{color:var(--dh-ink-2)}' +
    '.nn{font-size:13px}' +
    '.p a{color:var(--dh-brand-ink);font-weight:600;white-space:nowrap}' +
    '.p a:hover{text-decoration:underline;text-underline-offset:3px}' +
    'dl{margin:0;display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 14px}' +
    'dl>div{display:contents}' +
    'dt{font-size:13px;font-weight:520;color:var(--dh-ink-2);padding-top:1px}' +
    'dd{margin:0}' +
    /* Narrow (a phone dialog): each fact is one paragraph with its label as a lead-in, so the ways in stay close. */
    '@container (max-width:360px){dl{grid-template-columns:minmax(0,1fr);gap:8px}dl>div{display:block}' +
    'dt{display:inline;padding:0;font-size:14px;font-weight:600;color:var(--dh-ink)}dt::after{content:":"}' +
    'dd{display:inline;margin-left:.3em}}' +
    '.f{display:flex;flex-wrap:wrap;align-items:center;gap:2px 10px;padding-top:10px;border-top:1px solid var(--dh-line)}' +
    '.f a{color:var(--dh-brand-ink);font-weight:600}' +
    '.f a:hover{text-decoration:underline;text-underline-offset:3px}' +
    '.nt{color:var(--dh-ink-2);font-size:13px}' +
    '.ar{margin-left:.3em}' +
    /* An app's own create action in the start slot (Governance: "Create an account") looks like the default link,
       whatever classes or framework resets it brings. */
    '::slotted([slot=start]){all:unset!important;display:inline-flex!important;align-items:center!important;' +
    'color:var(--dh-brand-ink)!important;font:600 14px/1.45 var(--dh-font)!important;cursor:pointer!important}' +
    '::slotted([slot=start][hidden]){display:none!important}' +
    '::slotted([slot=start]:hover){text-decoration:underline!important;text-underline-offset:3px!important}' +
    '::slotted([slot=start]:focus-visible){outline:2px solid var(--dh-focus)!important;outline-offset:2px!important;' +
    'border-radius:var(--dh-r1)!important}' +
    '@media (pointer:coarse){.f a{display:inline-flex;align-items:center;min-height:40px}' +
    '::slotted([slot=start]){min-height:40px!important}}' +
    /* Compact (phones, or compact="always"): one line that opens the explanation, so the ways in come first. */
    '.w.c{padding:4px 6px 4px 12px;gap:0}.w.c.open{padding-bottom:14px;gap:10px}' +
    '.tg{display:flex;align-items:center;gap:8px;width:100%;min-height:36px;text-align:left;font-size:14px;font-weight:600;' +
    'line-height:1.3;border-radius:var(--dh-r2)}' +
    '.tg .ic{color:var(--dh-brand-ink);flex:none}' +
    '.tg .tt{flex:1 1 auto;min-width:0}' +
    '.tg .wt{flex:none;margin-left:auto;padding:0 2px 0 6px;color:var(--dh-brand-ink);font-size:13px;white-space:nowrap}' +
    '.tg .cv{transform:rotate(-90deg);transition:transform var(--dh-dur-2) var(--dh-ease)}' +
    '.tg[aria-expanded=true] .cv{transform:none}' +
    '.tg:hover .wt{text-decoration:underline;text-underline-offset:3px}' +
    '.bd{display:grid;gap:10px}.bd[hidden]{display:none}' +
    /* One line at any width: the sentence where it fits, shorter forms of it on 390 and 360px phones. */
    '.tg .tt>span{display:none}' +
    '@container (min-width:340px){.tg .tt .lg{display:inline}}' +
    '@container (min-width:300px) and (max-width:339.98px){.tg .tt .md{display:inline}}' +
    '@container (max-width:299.98px){.tg .tt .sh{display:inline}}' +
    '@media (pointer:coarse){.tg{min-height:44px}}';

  // The buttons and action row the notices share. Navigation is a bordered button; .pri is the amber committing one.
  const ACT_CSS =
    '.acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:8px}' +
    '.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:var(--dh-ctl-h);padding:0 14px;' +
    'border:1px solid var(--dh-raised-line);border-radius:var(--dh-r2);background:var(--dh-raised);color:var(--dh-ink);' +
    'font-size:14px;font-weight:600;white-space:nowrap}' +
    '.btn:hover{background:var(--dh-raised-hover)}' +
    '.ar{margin-left:.3em}' +
    '.spin{width:14px;height:14px;flex:none;border-radius:50%;border:2px solid var(--dh-line);border-top-color:var(--dh-brand);' +
    'animation:dh-rot .8s linear infinite}' +
    '@media (prefers-reduced-motion:reduce){.spin{animation-duration:2.4s}}' +
    '@keyframes dh-rot{to{transform:rotate(360deg)}}';

  // Not on this network: a dashed well (dashed = nothing real here) that says where the record is instead.
  const NOTFOUND_CSS = BASE_CSS + ACT_CSS +
    ':host{display:block}' +
    '.nf{display:grid;gap:6px;justify-items:start;padding:20px 24px;border:1px dashed var(--dh-line-2);' +
    'border-radius:var(--dh-r3);font-size:15px;line-height:1.5;color:var(--dh-ink);text-align:left}' +
    'h2{margin:0;font-size:17px;font-weight:620;line-height:1.3}' +
    'p{margin:0;color:var(--dh-ink-2);max-width:64ch}' +
    '.chk{display:flex;align-items:center;gap:10px}' +
    '.acts{column-gap:20px}' +
    '.lk{color:var(--dh-brand-ink);font-size:14px;font-weight:600}' +
    '.lk:hover{text-decoration:underline;text-underline-offset:3px}' +
    '@media (pointer:coarse){.lk{display:inline-flex;align-items:center;min-height:40px}}' +
    '@media (max-width:480px){.nf{padding:16px}}';

  // A retired product's page: what moved where and the one way on, while it forwards.
  const MOVED_CSS = BASE_CSS + ACT_CSS +
    ':host{display:block}' +
    'h1{margin:0;font:var(--dh-w-head) var(--dh-fs-h1)/var(--dh-lh-head) var(--dh-font);font-stretch:var(--dh-stretch-head);' +
    'letter-spacing:-.015em;text-wrap:balance;overflow-wrap:anywhere}' +
    '.l{margin:8px 0 0;max-width:64ch;font-size:var(--dh-fs-lead);line-height:1.55;color:var(--dh-ink-2)}' +
    '.n{display:grid;gap:4px;margin-top:var(--dh-5);padding:12px 16px;border-left:3px solid var(--dh-info);' +
    'border-radius:var(--dh-r2);background:var(--dh-info-soft);font-size:var(--dh-fs-ui);line-height:1.5}' +
    '.nt{display:flex;align-items:center;gap:10px;margin:0;font-weight:620}' +
    '.nb{margin:0;color:var(--dh-ink)}' +
    '.pri{border-color:transparent;background:var(--dh-act);color:var(--dh-act-ink);font-weight:620}' +
    '.pri:hover{background:var(--dh-act);background-image:linear-gradient(var(--dh-shade-1),var(--dh-shade-1))}' +
    '@media (max-width:480px){h1{font-size:26px}.l{font-size:var(--dh-fs-body)}.btn{width:100%}}';

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

  // A bar drawing its sections as a bottom tab bar publishes the tab bar's height as --dh-tabs-h on <html>, so the
  // footer (and any fixed element of the app's own) keeps clear of it. Only presence is compared, so restoring the
  // property after a framework wipes <html style> can't loop with the observer above.
  const tabBars = new Set();
  const TABS_H = 'calc(57px + env(safe-area-inset-bottom, 0px))';
  function syncTabs() {
    const has = root.style.getPropertyValue('--dh-tabs-h') !== '';
    if (tabBars.size && !has) root.style.setProperty('--dh-tabs-h', TABS_H);
    else if (!tabBars.size && has) root.style.removeProperty('--dh-tabs-h');
  }

  // Custom states let product CSS follow the bar's layout without the element writing attributes on itself:
  // dashhq-bar:state(compact) { … }. Older engines spell custom states with a leading "--".
  function setState(el, name, on) {
    const s = el._internals && el._internals.states;
    if (!s) return;
    // Old engines throw only from add() for the unprefixed name, so setting stops at the first spelling that
    // works and removal clears both.
    for (const n of [name, '--' + name]) {
      try {
        if (on) { s.add(n); return; }
        s.delete(n);
      } catch { /* spelling not supported */ }
    }
  }

  class DashhqBar extends ShellElement {
    static get observedAttributes() {
      return ['product', 'product-name', 'product-href', 'network', 'networks', 'network-settings', 'network-note',
        'no-theme', 'phone-nav'];
    }
    static css = BAR_CSS;

    constructor() {
      super();
      try { this._internals = this.attachInternals(); } catch { this._internals = null; }
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
      if (arrival && arrival.bar === this && !arrival.done) {
        queueMicrotask(() => {
          const next = arrival.bar === this && [...bars].find((b) => productOf(b) === RETIRED[arrival.from].to);
          if (next) next.render();
        });
      }
      tabBars.delete(this);
      syncTabs();
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

      // The label gives way to the chevron before the bar collapses.
      const switchBtn = h('button', { class: 'switch', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'dh-doors',
        'aria-label': 'All dashhq tools', 'data-f': 'switch' }, h('span', { class: 'swl', 'aria-hidden': 'true' }, 'All tools'),
        icon('chevron', 14));
      const doorPop = h('nav', { class: 'pop doorpop', id: 'dh-doors', hidden: true, 'aria-label': 'dashhq tools' },
        this._family(key, net));
      switchBtn.addEventListener('click', (e) => this._toggle('door', switchBtn, doorPop, e.detail === 0));

      // One section nav per product. The bar places it: in the row on wide screens; on phones at the top of the menu,
      // or (phone-nav="tabs") as a bottom tab bar, leaving the menu to the family.
      this._tabs = this.getAttribute('phone-nav') === 'tabs';
      this._navSlot = h('slot', { name: 'nav' });
      this._navSlot.addEventListener('slotchange', this._fit);
      this._nav = h('div', { class: 'nav empty', part: 'nav' }, this._navSlot);
      this._pf = h('div', { class: 'family', hidden: key === 'home' }, this._phoneFamily(key, net));
      const sheetEl = h('div', { class: 'sheet', id: 'dh-sheet', tabindex: '-1', 'aria-label': 'Navigation' }, !this._tabs && this._nav, this._pf);

      const end = h('div', { class: 'end' }, net && this._netControl(net, kind));
      if (!this.hasAttribute('no-theme')) {
        end.append(this._themeControl());
      }
      const menuBtn = h('button', { class: 'menu', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'dh-sheet',
        'aria-label': 'Menu', 'data-f': 'menu' }, icon('menu', 20));
      menuBtn.addEventListener('click', (e) => this._toggle('sheet', menuBtn, sheetEl, e.detail === 0));
      end.append(h('slot', { name: 'actions' }), menuBtn);

      const productHref = this.getAttribute('product-href') || '/';
      this._pn = h('span', { class: 'pn' }, this.getAttribute('product-name') || PRODUCTS[key].name);
      const product = key !== 'home' && h('a', { class: 'product', href: net ? withNetwork(productHref, net) : productHref }, this._pn);
      const logo = h('slot', { name: 'logo' });
      logo.addEventListener('slotchange', () => {
        this._bar.classList.toggle('has-logo', logo.assignedElements().length > 0);
        this._fit();
      });
      this._product = product || null;
      const lockup = h('div', { class: 'lockup' },
        h('a', { class: 'home', href: href('home'), 'aria-label': 'dashhq.org home' },
          h('span', { class: 'wm', 'aria-hidden': 'true' }, 'dashhq')),
        product && [h('span', { class: 'slash', 'aria-hidden': 'true' }, '/'),
          h('span', { class: 'logo' }, logo), product]);
      this._row = h('div', { class: 'row' }, lockup,
        key !== 'home' && h('div', { class: 'doorwrap' }, switchBtn, doorPop),
        this._tabs && this._nav, sheetEl, end);
      this._bar = h('header', { class: `bar ${kind}${key === 'home' ? ' is-home' : ''}${this._tabs ? ' tabs' : ''}`,
        part: 'bar' }, this._row, this._arrival(key), h('div', { class: 'scrim', 'aria-hidden': 'true' }));
      this._bar.classList.toggle('has-logo', logo.assignedElements().length > 0);
      // Following any link inside the bar (including the product's slotted nav) closes what is open.
      this._bar.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a')) this.close(); });
      this._paint(this._bar);
      // Re-check the fit whenever anything in the row changes width: slotted content, the network, a late font.
      this._ro.disconnect();
      [this, this._nav, end, lockup].forEach((el) => el && this._ro.observe(el));
      this._fit();
      if (focused) { const f = this.shadowRoot.querySelector(`[data-f="${focused}"]`); if (f) f.focus(); }
      if (net !== this._net) { this._net = net; queueMicrotask(netChanged); }
    }

    _family(key, net) {
      const row = (k, label, desc, target) => h('li', null,
        h('a', { class: 'door', href: target || doorHref(k, net), 'aria-current': current(k === key || PRODUCTS[k] === PRODUCTS[key], 'page') },
          h('span', { class: 'dn' }, label), h('span', { class: 'dd' }, desc)));
      return h('ul', { class: 'doors' }, DOORS.map(d => row(d.key, d.label, d.desc)),
        h('li', { class: 'sep', role: 'separator' }),
        ALSO.map(k => row(k, PRODUCTS[k].name, DESCRIPTIONS[k])),
        h('li', { class: 'sep', role: 'separator' }),
        row('home', 'All Dash projects →', 'The directory on dashhq.org', href('home', '/directory/')));
    }

    _phoneFamily(key, net) {
      if (key === 'home') return null;
      const list = (items) => h('ul', { class: 'pd' }, items.map(([k, label]) =>
        h('li', { 'data-k': k }, h('a', { href: doorHref(k, net), 'aria-current': current(PRODUCTS[k] === PRODUCTS[key], 'page') }, label))));
      return [h('div', { 'data-list': '' }, h('p', { class: 'fl' }, 'dashhq tools'),
        list(DOORS.map(d => [d.key, d.label]))),
        h('div', { 'data-list': '' }, h('div', { class: 'sep', role: 'separator' }),
          list(ALSO.map(k => [k, PRODUCTS[k].name]))),
        h('div', { 'data-list': '' }, h('div', { class: 'sep', role: 'separator' }),
          h('a', { class: 'hm', href: href('home', '/directory/'), 'data-k': 'home' }, 'All Dash projects →'))];
    }

    _themeControl() {
      const btn = h('button', { class: 'tbtn', type: 'button', 'data-f': 'theme', 'aria-label': 'Theme', title: 'Theme',
        'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': 'dh-theme' });
      const options = [['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'Match device', 'monitor']].map(([p, label, glyph]) => {
        const option = h('button', { class: 'opt themeopt', type: 'button', role: 'menuitemradio', tabindex: '-1' },
          icon(glyph, 16), label, h('span', { class: 'tick' }));
        option.addEventListener('click', () => { setPref(p); this.close(); btn.focus(); });
        return [p, option];
      });
      const pop = h('div', { class: 'pop themepop', id: 'dh-theme', role: 'menu', 'aria-label': 'Theme', tabindex: '-1', hidden: true },
        options.map(([, option]) => option));
      const sync = () => {
        btn.replaceChildren(icon(resolved() === 'dark' ? 'sun' : 'moon', 18));
        options.forEach(([p, option]) => {
          option.setAttribute('aria-checked', String(pref === p));
          option.querySelector('.tick').replaceChildren(...(pref === p ? [icon('check', 16)] : []));
        });
      };
      sync();
      this._on(themeListeners, sync);
      btn.addEventListener('click', (e) => this._toggle('theme', btn, pop, e.detail === 0));
      btn.addEventListener('keydown', (e) => {
        if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        if (!this._open || this._open.which !== 'theme') this._toggle('theme', btn, pop);
        options[e.key === 'ArrowUp' ? 2 : 0][1].focus();
      });
      return h('div', { class: 'themewrap' }, btn, pop);
    }

    // Deduplicate sibling destinations already in local navigation, keeping the current product in the family list.
    _dedupe() {
      const place = (u) => { try { const x = new URL(u, location.href); return x.origin + x.pathname; } catch { return ''; } };
      const keys = new Set(), places = new Set();
      for (const el of this._navSlot.assignedElements()) {
        for (const a of el.matches('a') ? [el] : el.querySelectorAll('a')) {
          if (!a.getClientRects().length) continue; // an item hidden in this layout doesn't count
          const k = a.dataset.family;
          if (k && Object.hasOwn(PRODUCTS, k)) keys.add(PRODUCTS[k] === PRODUCTS.radar ? 'radar' : k);
          places.add(place(a.href));
        }
      }
      for (const item of this._pf.querySelectorAll('[data-k]')) {
        const a = item.matches('a') ? item : item.querySelector('a');
        item.hidden = PRODUCTS[item.dataset.k] !== PRODUCTS[productOf(this)] &&
          (keys.has(item.dataset.k) || places.has(place(a.href)));
      }
      for (const list of this._pf.querySelectorAll('[data-list]')) list.hidden = !list.querySelector('[data-k]:not([hidden])');
    }

    // After a retired product's forward: "fees.dashhq.org is now part of Explorer." Only the bar of the product it
    // moved into shows it (and only where that product's links land), so a hand-made link can't make another tool claim
    // the move. One node for its whole life, which a new bar of the product takes over if the page replaces its bar, so
    // nothing is announced twice; it goes when dismissed or when the visitor moves on.
    _arrival(key) {
      const a = arrival;
      if (!a || a.done || RETIRED[a.from].to !== key) return null;
      if (a.bar && a.bar !== this && a.bar.isConnected) return null;
      a.bar = this;
      if (!a.el) {
        const r = RETIRED[a.from];
        const live = h('p', { class: 'sr', role: 'status', id: 'dh-arrive-said' });
        const x = h('button', { class: 'ax', type: 'button', 'aria-label': 'Dismiss', 'aria-describedby': 'dh-arrive-said',
          title: 'Dismiss', 'data-f': 'arrive-x' }, icon('close', 16));
        x.addEventListener('click', () => endArrival(true));
        const said = h('p', { class: 'at', 'aria-hidden': 'true' }, h('b', null, r.was), ` is now part of ${PRODUCTS[r.to].name}.`,
          h('span', { class: 'am' }, ' Old links open the same place here.'));
        a.el = h('div', { class: 'arrive', part: 'arrival' }, h('div', { class: 'ain' }, icon('info', 18), said, x), live);
        // Said once, while someone is looking: a tab opened in the background waits until it is shown.
        const say = () => {
          if (doc.hidden) return;
          doc.removeEventListener('visibilitychange', say);
          setTimeout(() => { live.textContent = said.textContent; }, 60);
        };
        doc.addEventListener('visibilitychange', say);
        say();
        // Only a bar that sticks covers the page's anchors.
        a.ro = new ResizeObserver(() => {
          const shown = a.el && a.el.isConnected && a.bar.hasAttribute('sticky');
          padScroll(shown ? a.el.getBoundingClientRect().height : null);
        });
        a.ro.observe(a.el);
      }
      return a.el;
    }

    _netControl(net, kind) {
      const label = networkLabel(net);
      // The shell owns the order (sortNetworks); a site's list only says which networks it offers.
      let list = sortNetworks((this.getAttribute('networks') || '').split(/[\s,]+/));
      if (list.length > 1 && !list.includes(net)) list = sortNetworks([...list, net]);
      const face = [h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'sr' }, 'Network: '),
        h('span', { class: 'nl' }, label)];
      if (list.length < 2) return h('span', { class: 'net ' + kind, title: 'Network: ' + label }, face);

      const btn = h('button', { class: 'net ' + kind, type: 'button', 'aria-expanded': 'false', 'aria-controls': 'dh-net',
        'data-f': 'net', title: 'Network: ' + label }, face, icon('chevron', 14));
      const option = (n) => {
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
      };
      // Devnets are internal: they always come last, behind "Developer networks", which starts open only on a devnet.
      const devs = list.filter((n) => networkKind(n) === 'dev');
      let devGroup = null;
      if (devs.length) {
        const open = kind === 'dev';
        const box = h('div', { id: 'dh-devnets', hidden: !open }, devs.map(option));
        const toggle = h('button', { class: 'opt', type: 'button', 'aria-expanded': String(open), 'aria-controls': 'dh-devnets' },
          h('span', { class: 'tick' }), 'Developer networks', icon('chevron', 14));
        toggle.addEventListener('click', () => {
          box.hidden = !box.hidden;
          toggle.setAttribute('aria-expanded', String(!box.hidden));
        });
        devGroup = [toggle, box];
      }
      const settings = this.getAttribute('network-settings');
      const note = this.getAttribute('network-note');
      const pop = h('nav', { class: 'pop netpop', id: 'dh-net', hidden: true, 'aria-label': 'Network' },
        list.filter((n) => !devs.includes(n)).map(option), devGroup,
        note && h('p', { class: 'nnote' }, note),
        settings && h('a', { class: 'opt more', href: settings }, 'Network settings'));
      btn.addEventListener('click', (e) => this._toggle('net', btn, pop, e.detail === 0));
      return h('div', { class: 'netwrap' }, btn, pop);
    }

    // Only one panel is open across all bars.
    _setOpen(o, on) {
      o.trigger.setAttribute('aria-expanded', String(on));
      if (o.which === 'sheet') {
        this._bar.classList.toggle('open', on);
        root.toggleAttribute('data-dh-sheet-open', on);
        o.trigger.replaceChildren(icon(on ? 'close' : 'menu', 20));
        o.trigger.setAttribute('aria-label', on ? 'Close menu' : 'Menu');
      } else {
        o.panel.hidden = !on;
        this._bar.classList.toggle('popping', on);
      }
    }
    _toggle(which, trigger, panel, keyboard = false) {
      const was = this._open && this._open.which === which;
      this.close();
      if (was) return;
      if (openBar && openBar !== this) openBar.close();
      openBar = this;
      this._open = { which, trigger, panel };
      this._setOpen(this._open, true);
      if (which === 'sheet') {
        this._dedupe();
        if (!keyboard) panel.focus({ preventScroll: true });
        else {
          const first = (!this._tabs && this._navSlot.assignedElements()
            .flatMap(el => el.matches('a,button') ? [el] : [...el.querySelectorAll('a,button')])
            .find(a => a.getClientRects().length)) || [...panel.querySelectorAll('a,button')].find(a => a.getClientRects().length);
          (first || panel).focus({ preventScroll: true });
        }
      } else if (which === 'theme') {
        (keyboard ? panel.querySelector('[aria-checked=true]') : panel).focus({ preventScroll: true });
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
      // The tab bar stays visible under the open menu; a tab is a real destination, not a tap to dismiss.
      if (this._tabs && path.includes(this._nav)) return false;
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
      const trigger = this.close();
      if (e.detail > 0 && trigger) trigger.focus();
    }
    _onKey(e) {
      const o = this._open;
      if (o && o.which === 'theme' && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const options = [...o.panel.querySelectorAll('[role=menuitemradio]')];
        const index = options.indexOf(this.shadowRoot.activeElement);
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 :
          (index + (e.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
        options[next].focus();
        return;
      }
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
      const w = this.getBoundingClientRect().width;
      const was = bar.classList.contains('compact');
      // Measure the wide row as the wide row: product CSS keyed to :state(compact) must not still apply, or the
      // bar would flip back and forth between layouts.
      bar.classList.remove('compact', 'squeeze', 'nolabel');
      setState(this, 'compact', false);
      const over = () => row.scrollWidth > row.clientWidth + 1;
      if (over()) bar.classList.add('nolabel'); // the switcher's words go first, then the whole row collapses
      const compact = w > 0 && (w < 600 || over());
      bar.classList.toggle('compact', compact);
      setState(this, 'compact', compact);
      // A product may hide its slotted nav in one layout; treat that as no nav (read after the final state is set).
      const shown = this._navSlot.assignedElements().some((el) => getComputedStyle(el).display !== 'none');
      this._nav.classList.toggle('empty', !shown);
      // The phone lockup keeps "dashhq" and the product at any width. Short of room, the network pill drops its word
      // first; only then does the product name truncate (with the full name as its tooltip).
      const pn = this._product && this._pn;
      const cut = () => !!pn && pn.scrollWidth > pn.clientWidth + 1;
      if (compact && (over() || cut())) bar.classList.add('squeeze');
      if (pn) {
        if (compact && cut()) this._product.setAttribute('title', pn.textContent);
        else this._product.removeAttribute('title');
      }
      if (compact && this._tabs && shown) tabBars.add(this); else tabBars.delete(this);
      syncTabs();
      if (this._open && was !== compact && (this._open.which === 'sheet') !== compact) this.close();
    }
  }

  /* ---------------------------------------------------------------- <dashhq-footer> */
  class DashhqFooter extends ShellElement {
    static get observedAttributes() { return ['product', 'source']; }
    static css = FOOT_CSS;

    render() {
      this._drop();
      const key = productOf(this);
      const src = this.getAttribute('source');
      this._paint(h('footer', { class: 'f', part: 'footer' },
        h('div', { class: 'in' },
          h('a', { class: 'home', href: href('home') }, 'dashhq'),
          h('div', { class: 'sentence' }, key === 'home' ? h('slot', { name: 'sentence' }, h('slot')) :
            `${PRODUCTS[key].name} is one of the dashhq tools for the Dash network.`),
          h('div', { class: 'links' }, key === 'home' ? h('slot', { name: 'links' }) : h('slot'),
            src && h('a', { href: src }, 'Source'),
            key !== 'home' && h('a', { href: href('home', '/directory/') }, 'All Dash projects')))));

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

  /* ---------------------------------------------------------------- <dashhq-signin-help> */
  // One explanation of signing in, worded the same in every app: what a Dash identity is, what this app asks for and
  // where it keeps it, and where to get an identity. The app's own ways in (its forms and choices) stay the app's.
  const ASKS = {
    wallet: 'an approval in your Dash wallet',
    passkey: 'a passkey',
    phrase: 'your recovery phrase (12 or 24 words)',
    key: 'a private key (High or Critical)',
    password: (name) => `a password you set in ${name}`
  };
  const KEPT = {
    memory: 'In memory only, never saved in this browser. Closing the tab signs you out.',
    tab: 'In this tab until you close it or sign out.',
    browser: 'In this browser until you sign out. On a shared computer, sign out when you finish.',
    sealed: 'In this browser, encrypted with your passkey or passphrase. You unlock it when you come back.'
  };
  const listOf = (items) => (items.length < 2 ? items[0] : `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`);
  const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1) + '.';
  // A margin, not a space: touch screens lay these links out as flex boxes, which drop a leading space.
  const arrow = () => h('span', { class: 'ar', 'aria-hidden': 'true' }, '→');
  function pageProduct() {
    let key = null;
    for (const b of bars) key = PRODUCTS[b.getAttribute('product')] ? b.getAttribute('product') : key;
    return key;
  }

  class DashhqSigninHelp extends ShellElement {
    static get observedAttributes() { return ['product', 'network', 'asks', 'why', 'kept', 'kept-note', 'compact']; }
    static css = SIGNIN_CSS;

    // compact: absent or "auto" folds the explanation into one line when the help is phone-narrow; "" / "always"
    // folds it everywhere; "never" keeps it open.
    connectedCallback() {
      if (!this._ro) {
        this._ro = new ResizeObserver(() => {
          const n = this._isNarrow();
          if (n !== this._narrow) { this._narrow = n; if (this.shadowRoot) this.render(); }
        });
      }
      this._narrow = this._isNarrow();
      super.connectedCallback();
      this._ro.observe(this);
    }
    disconnectedCallback() { super.disconnectedCallback(); this._ro.disconnect(); }
    _isNarrow() {
      const w = this.getBoundingClientRect().width;
      return w > 0 ? w < 440 : matchMedia('(max-width: 600px)').matches;
    }
    _compact() {
      const a = this.getAttribute('compact');
      const mode = a == null ? 'auto' : a.trim().toLowerCase();
      if (mode === '' || mode === 'true' || mode === 'always') return true;
      if (mode === 'never' || mode === 'false') return false;
      return this._narrow;
    }

    render() {
      this._drop();
      // Without its own attributes it follows the page's bar, which may connect or switch networks later.
      if (!this.hasAttribute('network') || !this.hasAttribute('product')) this._on(netListeners, () => this.render());
      const key = PRODUCTS[this.getAttribute('product')] ? this.getAttribute('product') : pageProduct();
      const name = key && key !== 'home' ? PRODUCTS[key].name : null;
      // An app that runs on one network explains that network, whatever page or bar it sits under.
      const net = parseNetwork(this.getAttribute('network')) || (key && parseNetwork(PRODUCTS[key].only)) || activeNetwork();
      const netName = networkLabel(net);

      const tokens = [...new Set((this.getAttribute('asks') || '').split(/[\s,]+/).filter(Boolean))];
      const ways = tokens.filter((t) => Object.hasOwn(ASKS, t))
        .map((t) => (typeof ASKS[t] === 'function' ? ASKS[t](name || 'this app') : ASKS[t]));
      const voting = tokens.includes('voting-key');
      const asks = [];
      if (ways.length) asks.push(sentence(listOf(ways)));
      if (voting) {
        asks.push(ways.length ? 'To vote as a masternode, also its voting key: never the owner, payout or collateral key.'
          : 'Your masternode\'s voting key: never the owner, payout or collateral key.');
      }
      const why = (this.getAttribute('why') || '').trim();
      if (why && asks.length) asks.push(why);
      const keptKey = this.getAttribute('kept');
      const several = ways.length + (voting ? 1 : 0) > 1;
      let keptLine = null;
      if (Object.hasOwn(KEPT, keptKey)) keptLine = KEPT[keptKey];
      else if (several) keptLine = 'Each way below says what it keeps and for how long.';
      const note = (this.getAttribute('kept-note') || '').trim();

      const facts = [];
      if (asks.length) facts.push(h('div', null, h('dt', null, `${name || 'This app'} asks for`), h('dd', null, asks.join(' '))));
      if (asks.length && (keptLine || note)) {
        facts.push(h('div', null, h('dt', null, 'Where it\'s kept'),
          h('dd', null, keptLine, keptLine && note && ' ', note && h('span', { class: 'nn' }, note))));
      }

      // Testnet starts the family's Start journey; Mainnet and devnets create one in Bridge on that network.
      const start = net === 'testnet' ? h('a', { href: doorHref('bridge') }, 'Start on Testnet', arrow())
        : [h('a', { href: href('bridge', '/?mode=create', { network: net }) }, 'Create one in Bridge', arrow()),
          h('span', { class: 'nt' }, net === 'mainnet' ? 'Mainnet, real DASH' : netName)];

      const body = [
        h('p', { class: 'p' }, `Your account on Dash Platform. One ${netName} identity works across the dashhq apps on ` +
          `${netName}; each app signs you in on its own. ` + (net === 'mainnet' ? 'Saving data on Mainnet costs real DASH. ' : ''),
        h('a', { class: 'lk', href: href('home', IDENTITY_PATH) }, 'How identities work', arrow())),
        facts.length ? h('dl', null, facts) : null,
        h('p', { class: 'f' }, h('span', { class: 'q' }, 'No identity yet?'), h('slot', { name: 'start' }, start))];
      // Re-rendering (a new attribute, or the layout flipping between folded and open) keeps keyboard focus inside.
      const hadFocus = this.shadowRoot.activeElement && this.shadowRoot.activeElement.closest('.w');
      if (!this._compact()) {
        this._paint(h('div', { class: 'w' }, h('p', { class: 't' }, icon('identity', 20), 'You sign in with a Dash identity'), body));
        if (hadFocus) this.shadowRoot.querySelector('a').focus();
        return;
      }

      // Compact: the controls come first and the explanation is one tap away. The toggle flips in place, so focus stays.
      const more = h('div', { class: 'bd', id: 'dh-signin-more' }, body);
      const word = h('span', { class: 'wt' });
      const tg = h('button', { class: 'tg', type: 'button', 'aria-controls': 'dh-signin-more' }, icon('identity', 20),
        h('span', { class: 'tt' }, h('span', { class: 'lg' }, 'You sign in with a Dash identity'),
          h('span', { class: 'md' }, 'Uses your Dash identity'), h('span', { class: 'sh' }, 'Your Dash identity')),
        word, h('span', { class: 'cv', 'aria-hidden': 'true' }, icon('chevron', 14)));
      const well = h('div', { class: 'w c' }, tg, more);
      const sync = () => {
        const o = !!this._open;
        more.hidden = !o;
        tg.setAttribute('aria-expanded', String(o));
        word.textContent = o ? 'Hide' : 'What\'s this?';
        well.classList.toggle('open', o);
      };
      sync();
      tg.addEventListener('click', () => { this._open = !this._open; sync(); });
      this._paint(well);
      if (hadFocus) tg.focus();
    }
  }

  // The notices keep one live region for their whole life and change only its words, so screen readers hear each
  // result once; the visible content beside it is repainted freely.
  class NoticeElement extends ShellElement {
    _show(...nodes) {
      if (!this._box) {
        this._box = h('div');
        this._live = h('p', { class: 'sr', role: 'status' });
        this._paint(this._box, this._live);
      }
      const f = this.shadowRoot.activeElement && this.shadowRoot.activeElement.dataset.f;
      this._box.replaceChildren(...nodes.filter(Boolean));
      if (!f) return;
      // The same control if it is still there, else the next one, else the notice itself: focus never falls to <body>.
      let el = this._box.querySelector(`[data-f="${f}"]`) || this._box.querySelector('[data-f]');
      if (!el && this._box.firstElementChild) { el = this._box.firstElementChild; el.tabIndex = -1; }
      if (el) el.focus({ preventScroll: true });
    }
    // Say it once, a moment after the region exists, so it is announced rather than read as part of the page.
    _say(text) {
      if (text === this._said) return;
      this._said = text;
      clearTimeout(this._sayT);
      this._sayT = setTimeout(() => { if (this._live) this._live.textContent = text; }, 60);
    }
  }

  /* ---------------------------------------------------------------- <dashhq-not-found> */
  // A record looked up on one network that isn't there. Says so, then where it is instead (or that it is nowhere), so a
  // shared link opened on the other network never looks like missing data. The app either sets found="mainnet" |
  // "none" | "unknown" itself, or hands the element a lookup: el.lookup = (network, signal) => Promise<boolean>.
  class DashhqNotFound extends NoticeElement {
    static get observedAttributes() {
      return ['thing', 'id-label', 'network', 'networks', 'found', 'href', 'list-href', 'list-label', 'record'];
    }
    static css = NOTFOUND_CSS;

    // Which question is being asked: this network, and either the `record` attribute or, without one, this lookup
    // function. A new question shows "Checking" at once and never an earlier answer. With `record` set, a new lookup
    // function for the same record (a framework re-rendering) is the same question: its answer stays.
    _key(here) {
      const own = this.getAttribute('record');
      return here + ' ' + (own != null ? 'record:' + own : 'lookup:' + (this._fnId || 0));
    }
    get lookup() { return this._lookup || null; }
    set lookup(fn) {
      fn = typeof fn === 'function' ? fn : null;
      if (fn === this._lookup) return;
      this._lookup = fn;
      this._fnId = (this._fnId || 0) + 1;
      if (!fn) this._abort(); // a dropped lookup's late answer must never show under the next one
      if (this.shadowRoot && this.isConnected) this.render();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._abort();
    }
    _abort() {
      if (this._ac) this._ac.abort();
      this._ac = null;
      this._ranKey = null;
    }
    _nets() { return sortNetworks((this.getAttribute('networks') || 'mainnet testnet').split(/[\s,]+/)); }
    // A check already running for the same question is left to finish; later ones use the newest lookup.
    _run(here, key) {
      if (this._ac) this._ac.abort();
      const ac = this._ac = new AbortController();
      this._ranKey = key;
      findElsewhere((n, signal) => this._lookup(n, signal), { network: here, networks: this._nets(), signal: ac.signal }).then((found) => {
        if (ac.signal.aborted) return;
        this._ac = null;
        if (found === this._found && key === this._foundKey) return;
        this._found = found;
        this._foundKey = key;
        this.render();
      });
    }
    _target(network) {
      const given = this.getAttribute('href');
      return given ? new URL(given, location.href).href : withNetwork(location.href, network);
    }
    // found="…": a network, "none" or "unknown"; empty or "checking" shows the check; anything else can't be trusted to
    // mean "nowhere", so it reads as "couldn't check".
    _answer(here) {
      const raw = this.getAttribute('found');
      if (raw == null) return this._lookup && this._foundKey === this._key(here) ? this._found : null;
      const v = raw.trim().toLowerCase();
      if (v === '' || v === 'checking') return null;
      return v === 'none' || v === 'unknown' ? v : parseNetwork(v) || 'unknown';
    }

    render() {
      this._drop();
      if (!this.hasAttribute('network')) this._on(netListeners, () => this.render());
      const here = parseNetwork(this.getAttribute('network')) || activeNetwork();
      // Start a new question a microtask later, so a record and its lookup set in the same step are asked together.
      const due = () => this._lookup && !this.hasAttribute('found') && this.isConnected && this._ranKey !== this._key(here);
      if (due()) queueMicrotask(() => { if (due()) this._run(here, this._key(here)); });
      const found = this._answer(here);
      const thing = (this.getAttribute('thing') || 'record').trim();
      const idLabel = (this.getAttribute('id-label') || 'ID').trim();
      const hereL = networkLabel(here);
      const others = this._nets().filter((n) => n !== here);
      const otherLs = others.map(networkLabel);
      const othersL = listOf(otherLs) || 'the other network';

      // Opening it on the other network is a network switch: the page's bar hears it first (where SPAs listen and route,
      // as they do for the bar's own menu); if nobody cancels it, the link simply navigates.
      const open = (network, text) => {
        const a = h('a', { class: 'btn', href: this._target(network), 'data-f': 'open' }, text, arrow());
        a.addEventListener('click', (e) => {
          a.href = this._target(network);
          const go = ([...bars].pop() || this).dispatchEvent(new CustomEvent('dashhq-network', {
            bubbles: true, composed: true, cancelable: true, detail: { network, href: a.href } }));
          if (!go) e.preventDefault();
        });
        return a;
      };
      const listHref = this.getAttribute('list-href');
      const list = listHref && h('a', { class: 'lk', href: new URL(listHref, location.href).href, 'data-f': 'list' },
        this.getAttribute('list-label') || `Search ${hereL}`, arrow());

      let title = `Not on ${hereL}`, line, action = null;
      if (found === 'none') {
        title = `Not on ${listOf([hereL, ...otherLs])}`;
        line = `There's no ${thing} with this ${idLabel} on ${others.length > 1 ? 'any network' : 'either network'}.`;
      } else if (found === 'unknown') {
        line = `We couldn't check ${othersL} just now.`;
        if (others[0]) action = open(others[0], `Look on ${otherLs[0]}`);
      } else if (found) {
        line = `This ${thing} exists on ${networkLabel(found)}.`;
        action = open(found, `Open it on ${networkLabel(found)}`);
      }
      this._show(h('div', { class: 'nf' }, h('h2', null, title),
        h('p', null, line || h('span', { class: 'chk' }, h('span', { class: 'spin', 'aria-hidden': 'true' }), `Checking ${othersL}…`)),
        h('slot'), (action || list) && h('div', { class: 'acts' }, action, list)));
      if (line) this._say(`${title}. ${line}`); // checking says nothing, so a re-check doesn't repeat the same answer
    }
  }

  /* ---------------------------------------------------------------- <dashhq-moved> */
  // A retired product's page. It forwards at once to the exact new place, with the old link's network, query and hash,
  // and adds ?moved-from=<product> so the new home's bar says, once, what happened. An instant redirect sets no time
  // limit (WCAG 2.2.1), so there is nothing to stop or extend. What it draws is for the few it doesn't forward at once:
  // a slow destination, or someone who came Back to it on purpose. Its children are the page without JavaScript.
  class DashhqMoved extends NoticeElement {
    static get observedAttributes() { return ['to', 'path', 'product', 'network', 'heading', 'lede', 'label']; }
    static css = MOVED_CSS;

    connectedCallback() {
      if (this._going === undefined) {
        const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        this._going = !(nav && nav.type === 'back_forward');
        if (this._going) {
          const stay = () => { this._going = false; this.render(); };
          const go = () => {
            if (!this.isConnected || !this._going) return;
            const to = new URL(this._dest());
            // A map pointing back at this page, or a retired page reached by another one's forward, would bounce the
            // visitor forever: stay, and show the way on.
            if (forwarded || to.origin + to.pathname === location.origin + location.pathname) return stay();
            location.replace(to.href);
          };
          // After the site's route map. Deferred scripts run before DOMContentLoaded, which can still be ahead after
          // parsing has finished (this element added by a deferred script), so ask the navigation entry. Without one,
          // go at DOMContentLoaded or load, whichever comes first: DOMContentLoaded may already have passed.
          if (doc.readyState === 'complete' || (nav && nav.domContentLoadedEventStart > 0)) setTimeout(go, 0);
          else {
            const once = () => {
              doc.removeEventListener('DOMContentLoaded', once);
              removeEventListener('load', once);
              setTimeout(go, 0);
            };
            doc.addEventListener('DOMContentLoaded', once);
            addEventListener('load', once);
          }
          // Restored from the back-forward cache: show the way on rather than "Opening…" forever.
          addEventListener('pageshow', (e) => { if (e.persisted && this._going) stay(); });
        }
      }
      super.connectedCallback();
    }
    _names() {
      const to = this.getAttribute('to');
      let from = PRODUCTS[this.getAttribute('product')] ? this.getAttribute('product') : pageProduct();
      if (from === 'home') from = null;
      return { to: PRODUCTS[to] ? to : 'home', toName: PRODUCTS[to] ? PRODUCTS[to].name : 'dashhq.org',
        from, fromName: from ? PRODUCTS[from].name : 'This tool' };
    }
    _net() {
      const sp = new URL(location.href).searchParams;
      return parseNetwork(sp.get('network') || sp.get('net')) || parseNetwork(this.getAttribute('network')) || 'mainnet';
    }
    // The new home, with the old link's network, its query (contract, id, filters, every value of a repeated key) unless
    // the new path sets that key, its hash unless the path has one or the old hash was a hash route ("#/c/german":
    // the site maps that into path), and where it came from.
    _dest() {
      const { to, from } = this._names();
      let u;
      try { u = new URL(href(to, this.getAttribute('path') || '/', { network: this._net() })); } catch { u = new URL(href(to)); }
      const own = new Set(u.searchParams.keys());
      for (const [k, v] of new URL(location.href).searchParams) {
        if (k !== 'network' && k !== 'net' && k !== ARRIVAL_PARAM && !own.has(k)) u.searchParams.append(k, v);
      }
      if (from) u.searchParams.set(ARRIVAL_PARAM, from);
      if (!u.hash && location.hash && !location.hash.startsWith('#/')) u.hash = location.hash;
      return u.href;
    }

    render() {
      const { to, toName, fromName } = this._names();
      const aware = !!PRODUCTS[to].net;
      const net = this._net();
      // The same header on every retired page: the bar shows the network the visitor will land on.
      const bar = [...bars].pop();
      if (bar && aware && bar.getAttribute('network') !== net) bar.setAttribute('network', net);
      const lede = (this.getAttribute('lede') || '').trim();
      this._show(h('div', { class: 'm' },
        h('h1', null, this.getAttribute('heading') || `${fromName} has moved to ${toName}`),
        lede && h('p', { class: 'l' }, lede),
        h('div', { class: 'n' },
          this._going && h('p', { class: 'nt' }, h('span', { class: 'spin', 'aria-hidden': 'true' }), `Opening ${toName}…`),
          h('p', { class: 'nb' }, `Links to ${fromName} keep working: they open the same place in ${toName}` +
            (aware ? `, on ${networkLabel(net)}.` : '.')),
          h('div', { class: 'acts' },
            h('a', { class: 'btn pri', href: this._dest(), 'data-f': 'pri' }, this.getAttribute('label') || `Open ${toName}`, arrow())))));
    }
  }

  /* ---------------------------------------------------------------- register + public API */
  for (const [name, cls] of [['dashhq-bar', DashhqBar], ['dashhq-footer', DashhqFooter], ['dashhq-hash', DashhqHash],
    ['dashhq-signin-help', DashhqSigninHelp], ['dashhq-not-found', DashhqNotFound], ['dashhq-moved', DashhqMoved]]) {
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
      sort: sortNetworks,
      fromUrl: networkFromUrl,
      withNetwork,
      canonicalize: canonicalizeNetworkParam,
      findElsewhere
    })
  });
})();
