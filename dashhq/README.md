# dashhq shell 1.3.0

The shared shell for the dashhq.org family: the family bar, the footer, the hash display, the theme, and the
tokens they all draw with. Read `../DESIGN.md` for the rules and `../MIGRATION.md` for your site's plan.

| File | What | Required |
|---|---|---|
| `dashhq-shell.js` | `<dashhq-bar>`, `<dashhq-footer>`, `<dashhq-hash>`, theme, `window.dashhq` | yes |
| `dashhq-tokens.css` | `--dh-*` custom properties, light and dark, and the Archivo `@font-face` | yes |
| `dashhq-shell.css` | Pre-upgrade fallback and styling for your links slotted into the bar | yes |
| `fonts/archivo-latin-var.woff2` | Archivo, variable, Latin, 79 KB (`fonts/PROVENANCE.md`, `fonts/OFL.txt`) | yes |
| `dashhq-components.css` | Reference look for buttons, fields, tables, pills, states (`.dh-*` classes) | plain-CSS sites |
| `mark/` | The mark as SVG, and the favicon | yes |
| `dashhq-shell.d.ts`, `dashhq-shell.react.d.ts` | Types for `window.dashhq` and the events; JSX types for the elements (React only) | TS sites |
| `demo.html` | Every piece on one page; also a CSP test (open it through a server, not `file://`) | no |

## Vendor it

Copy this directory unchanged to a path your site serves as static files, at build time. Use `/dashhq/` everywhere so
the family is predictable:

| Stack | Copy to |
|---|---|
| Vite (gov, vote, dapi, fees, bridge) | `public/dashhq/` |
| Next static export (explorer, pollr, forge) | `public/dashhq/` (respect `basePath` in the URLs below) |
| Static HTML (hub, arch, basics, Radar `web/`, faucet `public/`) | `dashhq/` beside `index.html` |

Pin it: record the shell version and the sha256 of `dashhq-shell.js` in your repo (e.g. `public/dashhq/VERSION`).
Update by copying a newer release over it. Never edit the vendored files; map your own variables onto the tokens.

`VERSION` contains the shell release. Request shared changes in `REQUESTS/` (one file per workstream);
site implementers must not edit the shell or their vendored copy.

`radar` is the canonical product key. `nodes` remains a compatible alias in bar/footer attributes and
`dashhq.origin()` / `dashhq.href()`; both keys link to `radar.dashhq.org` (or `radar.dashhq.localhost` in the lab).

## Load it

Put this in `<head>`, in this order, before your own stylesheet:

```html
<script src="/dashhq/dashhq-shell.js"></script>
<link rel="preload" href="/dashhq/fonts/archivo-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/dashhq/dashhq-tokens.css">
<link rel="stylesheet" href="/dashhq/dashhq-shell.css">
<link rel="icon" href="/dashhq/mark/favicon.svg" type="image/svg+xml">
```

The script is classic and blocking on purpose: it sets `<html data-theme>` before first paint, so there is no flash
of the wrong theme and no inline script. It is about 40 KB (12 KB gzipped), readable, unminified, and makes no requests.

### Frameworks

- **Vite** (gov, vote, dapi, fees, bridge): the tags above go in `index.html`'s `<head>`; files in `public/dashhq/`.
- **Next static export** (explorer, pollr, forge): put a plain `<script src="/dashhq/dashhq-shell.js"></script>` in
  `app/layout.tsx`'s `<head>`. Not `next/script`: it defers the script, and `beforeInteractive` adds an inline
  bootstrap that a strict CSP blocks. Prefix `basePath` if you have one, and add `suppressHydrationWarning` to
  `<html>`: the script sets `data-theme`, `data-theme-pref` and `color-scheme` before React hydrates. Don't pass a
  `style` prop to `<html>`. If React re-creates `<html>` (React 19 does after a root hydration error), the shell
  notices and puts the theme back.
- **React** renders `<dashhq-bar>` like any element; slotted children stay React's (they are never moved), and the
  element adds no attributes to itself. Boolean attributes (`sticky`, `no-theme`, `full`, `no-copy`) are on when
  present: write `sticky=""` and **omit the prop to turn it off**. React 18 writes `false` as the string "false",
  which counts as on. Listen for `dashhq-network` with a ref and `addEventListener` (React 18 has no prop for custom
  events). Tested: React 18 server render + `hydrateRoot`, with nav links, the network and a hash changing state.
- **Chakra v2** (explorer) writes the same `data-theme` attribute. Remove `ColorModeScript` and give `ChakraProvider`
  a `colorModeManager` whose `get()` returns `window.dashhq.theme.resolved` and whose `set(v)` calls
  `window.dashhq.theme.set(v)`; re-render on the `dashhq-theme` event.
- **Tailwind**: `darkMode: ['selector', '[data-theme="dark"]']`, colours as `var(--dh-…)`.

Then, in `<body>`:

```html
<dashhq-bar product="radar" network="mainnet" networks="mainnet testnet" sticky>
  <nav slot="nav" aria-label="Radar">
    <a href="/" aria-current="page">Overview</a>
    <a href="/masternodes">Masternodes</a>
  </nav>
  <div slot="actions"><!-- optional: sign in, account --></div>
</dashhq-bar>
…
<dashhq-footer product="radar" source="https://github.com/PastaPastaPasta/dash-nodes">
  <p>Optional lines of your own: data sources, privacy, about.</p>
</dashhq-footer>
```

## `<dashhq-bar>`

| Attribute | Meaning |
|---|---|
| `product` | **Required.** `home radar gov explorer faucet bridge arch fees dapi vote basics forge pollr yappr`. Sets the name, the active door, and which links carry the network. |
| `product-name` | Override the shown name (rare). |
| `product-href` | Where the product name links. Default `/`. Set it if you have a base path. |
| `network` | The network this page shows: `mainnet`, `testnet`, `devnet-<name>`. Omit on pages that are not about one network. Testnet and devnet draw the bar's bottom rule dashed. |
| `networks` | Space-separated list. With two or more, the network pill becomes a menu. Choosing one navigates to the same URL with `?network=` (including mainnet) unless you cancel the `dashhq-network` event. |
| `network-settings` | URL of an advanced network page; adds "Network settings" to the network menu (gov). |
| `sticky` | Sticks the bar to the top. Use it on the core tools. |
| `no-theme` | Hides the theme button (the menu still has System / Light / Dark). |

| Slot | Content |
|---|---|
| `nav` | One element (`<nav>`, `<ul>` or `<div>`) holding your top-level links. Mark the current one `aria-current="page"`. 3 to 6 links. In the phone menu they stack as 44px rows. |
| `actions` | Sign in, account, notifications. Keep it to one or two compact controls; it stays visible on phones. |
| `logo` | Apps only: your own glyph (20×20) before your name. |

Events and API:

- `dashhq-network` (bubbles, composed, cancelable), `detail: { network, href }`. SPAs call `preventDefault()`
  and route themselves, then update the `network` attribute.
- `dashhq-theme` on `document`, `detail: { pref, theme }`, on every change after load. It does not fire for the
  initial theme: read `window.dashhq.theme.resolved` when your app starts, then listen.
- `window.dashhq.href('gov', '/names/german')` builds a family link: production URL, or the lab URL on
  `*.dashhq.localhost`, plus an explicit `?network=` for every network-aware destination, including Mainnet.
  The network is the page's: the most recently connected bar's `network`, else the URL. It throws if the path would
  leave that product's origin. Use it for every cross-link.
- `window.dashhq.network.fromUrl()`, `.withNetwork(url, n)`, `.canonicalize()`: the one network vocabulary.
- `window.dashhq.theme.set('dark' | 'light' | 'system')`, `.toggle()`, `.pref`, `.resolved`.

The bar decides its own layout: it collapses to the phone layout (mark, product name, network pill, menu button)
whenever the full row would not fit, not at a fixed breakpoint. You do not need a media query for it.

## `<dashhq-hash>`

```html
<dashhq-hash value="219eddd…fb32 (full value)" href="https://radar.dashhq.org/mn/219eddd…" label="ProTx hash">219eddd…fb32 (full value)</dashhq-hash>
```

Shows `219edd…fb32` with the full value in the tooltip and for screen readers, and a copy button that copies the
full value and announces "Copied". `head`/`tail` change the kept characters (default 6 and 4). `full` shows the whole
value, wrapped (record headers). `no-copy` hides the button. Always set `value`; also put the full value in the
element's text, which is what shows if the script never runs.

- **Addresses someone will send DASH to** (bridge deposit addresses, faucet funding addresses) use `full`.
  Truncated addresses invite address-poisoning: an attacker's look-alike that shares the first and last characters.
  Display-only addresses in lists (proposal payees, payout addresses) may truncate.
- **Never secrets.** The value ends up in an attribute, a tooltip and the accessibility tree. Mnemonics, WIF keys
  and voting keys never go in `<dashhq-hash>`.

## Theme

One preference for the whole family. Stored as the cookie `dh_theme=light|dark|system` on `Domain=dashhq.org` (in the
lab, `dashhq.localhost`), `SameSite=Lax`, `Secure` on https, one year, so every subdomain shares it; and in
`localStorage['dh-theme']` as the fallback on other domains (yap.pr, thepasta.org). It is a preference, not an
identifier, and is only written when someone picks a theme. The script keeps `<html data-theme="light|dark">` set to
the resolved theme and `data-theme-pref` to the choice, and re-reads the cookie when a tab becomes visible.

Style dark mode off `[data-theme="dark"]` only. Tailwind: `darkMode: ['selector', '[data-theme="dark"]']`.
Chakra: drive `colorMode` from the `dashhq-theme` event and drop `chakra-ui-color-mode`. Delete your old theme key.

## CSP

Works under `script-src 'self'; style-src 'self'; font-src 'self'` with no `'unsafe-inline'` and no `'unsafe-eval'`.
It uses no inline script, no `innerHTML` (so it also works under Trusted Types), no `style` attributes, and no
network requests. Element styles are constructable stylesheets, which CSP does not govern. Check that your policy
lists `font-src 'self'` (or a `default-src` that allows it): faucet's `/keys` and `/admin` policy currently has
`default-src 'none'` without `font-src`, so Archivo would be blocked there.

`demo.html` carries a stricter policy than any site in the family; `design/tools/render-demo.mjs` loads it and fails
on any violation.

## Browser support

Evergreen browsers: Chrome and Edge 111+, Firefox 101+, Safari 16.4+ (constructable stylesheets, static class fields).
On older Safari the elements fall back to a `<style>` element, which a strict `style-src 'self'` blocks, so the bar
renders unstyled there but still works. The theme cookie is renewed on every visit because Safari keeps
script-written cookies for 7 days.

## Local lab

On `dashhq.localhost` and `*.dashhq.localhost` every family link becomes
`<scheme>://<product>.dashhq.localhost:<same port>/…` (the hub is `dashhq.localhost`). Production is unchanged.

## Declarative family links

Static pages can use only the shell script:

```html
<a href="https://explorer.dashhq.org/dpns/search/?network=mainnet"
   data-family="explorer" data-path="/dpns/search/">Search usernames</a>
```

`data-family` is a product key, `data-path` defaults to `/`, and optional `data-network`
pins a particular network. Otherwise the page bar or URL owns the network. The shell
resolves initial and newly inserted anchors, attribute changes, network changes and
history traversal. Invalid product keys, network values and off-origin paths retain
the authored fallback. Keep a real production `href` for no-JavaScript browsing.

Outside pointer taps dismiss an open door switcher, network menu or phone sheet and
consume that tap, including pointer focus. Escape restores trigger focus; Tab still
moves normally. A second tap can activate the underlying control.

Start is a Testnet itinerary: Bridge address → Faucet funding → Bridge identity → username.
The Start door, its step links and the footer always open Testnet, beginning in Bridge.
`href()` and declarative links to Bridge/Faucet default to Testnet. Explicit
`{ network: "mainnet" }` / `data-network="mainnet"` still support real-funds flows.
A Bridge URL can use `?mode=create&journey=start&network=testnet` to begin at address creation.
