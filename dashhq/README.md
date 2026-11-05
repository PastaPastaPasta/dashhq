# dashhq shell 1.4.0

The shared shell for the dashhq.org family: the family bar, the footer, the hash display, the theme, and the
tokens they all draw with. Read `../DESIGN.md` for the rules and `../MIGRATION.md` for your site's plan.

| File | What | Required |
|---|---|---|
| `dashhq-shell.js` | `<dashhq-bar>`, `<dashhq-footer>`, `<dashhq-hash>`, theme, `window.dashhq` | yes |
| `dashhq-tokens.css` | `--dh-*` custom properties, light and dark, and the Archivo `@font-face` | yes |
| `dashhq-shell.css` | Pre-upgrade fallback and styling for your links slotted into the bar | yes |
| `fonts/archivo-latin-var.woff2` | Archivo, variable, Latin, 79 KB (`fonts/PROVENANCE.md`, `fonts/OFL.txt`) | yes |
| `dashhq-components.css` | The family component layer: layout, page header, buttons, fields, tables, states, stepper (`.dh-*` classes) | yes (see Components) |
| `dashhq-tailwind-preset.cjs` | Tailwind 3.4 preset mapping colours, radii, heights, fonts and shadows to the tokens | Tailwind sites |
| `mark/` | The mark as SVG, and the favicon | yes |
| `dashhq-shell.d.ts`, `dashhq-shell.react.d.ts` | Types for `window.dashhq` and the events; JSX types for the elements (React only) | TS sites |
| `demo.html` | Every piece on one page; also a CSP test (open it through a server, not `file://`) | no |
| `components.html` | Every component in every state, with the app accents; `?accent=forge\|pollr\|yappr` previews one page-wide | no |

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
<link rel="stylesheet" href="/dashhq/dashhq-components.css">
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
| `network-note` | One sentence shown under the network choices. Set it on record pages, where a record exists on one network only: "This masternode is on Mainnet; Testnet opens Testnet's list." Pair it with routing that lands on the other network's list or search instead of a dead end. |
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

The bar decides its own layout: it collapses to the phone layout (mark, `dashhq /`, product name, network pill, menu
button) whenever the full row would not fit, not at a fixed breakpoint, and drops the `dashhq /` wordmark only when
even that row would not fit. You do not need a media query for it. In the phone menu the five doors are a compact
grid of names; the desktop switcher keeps their descriptions. Apps are tagged with the one network they run on
(Testnet), so nobody crosses from a Mainnet tool into a practice app unawares. The Fee estimator and DAPI console
receive the page's network like the other network-aware tools.

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

## Components (`dashhq-components.css`)

One small, framework-free layer on the tokens. It is CSP-safe: no inline styles, no images, no `url()`. Every
class is namespaced `dh-`. The rules it encodes are in `../DESIGN.md` §6; `components.html` shows every piece in every
state, and `../tools/render-components.mjs` checks it. Load it after `dashhq-shell.css` and before your own CSS.

Decided once for the family, so nobody decides them again:

| | |
|---|---|
| Radius | 6px (`--dh-r2`) on every control, 10px (`--dh-r3`) on every card, 3px (`--dh-r1`) on badges. Nothing pill-shaped. |
| Heights | `--dh-ctl-h-sm` / `--dh-ctl-h` / `--dh-ctl-h-lg`: 28 / 34 / 42px, and 40 / 42 / 48px on touch screens. Inputs and selects use the middle one. |
| Focus | `outline: 2px solid var(--dh-focus); outline-offset: 2px` on everything. `--dh-ring-shadow` is the same ring as a box-shadow. |
| Casing | Sentence case: "Create identity", "Sign in", "Explore public posts". Components reset `text-transform` and `letter-spacing`, but the words are yours to write. |
| Primary | `.dh-btn--primary` is the one committing action in view, filled with `--dh-accent` (amber) and `--dh-accent-ink` text. |
| Width | `.dh-container` is the bar's row: `max-width: var(--dh-max)`, border-box, `padding-inline: var(--dh-gutter)`. Content starts exactly under the mark: x = 160 at 1440px, 16px on phones. |

**App accents.** An app writes one line, on `:root`, and every primary button follows; shape, height, weight, ink and
states stay the family's:

```css
:root { --dh-accent: var(--dh-accent-forge); }   /* or -pollr, -yappr */
```

The three accents are tokens, checked against the navy ink at rest, on hover and when pressed. Don't override
`--dh-accent-ink` or `--dh-act*`, and don't recolour anything else with the accent.

### Class reference

| Block | Classes | Notes |
|---|---|---|
| Layout | `dh-container`, `dh-page`, `dh-narrow`, `dh-measure`, `dh-stack` (`--lg`), `dh-grid` (`--dh-grid-min`), `dh-split`, `dh-band` | One container per page. Narrow columns stay left-aligned. `dh-split` is a main column plus a 320px aside. |
| Page header | `dh-page-header` (`--home`), `__row`, `__text`, `__kicker`, `__title`, `__lede`, `__actions`, `__meta`; `dh-crumbs` | One per page, directly inside the container. Title 30px (26px on phones), lede 17px, actions top right and wrapping under on phones. |
| Section | `dh-section` (`--rule`), `__head`, `__title`, `__desc`, `__actions` | H2 21px. The description sits under the title, with actions to the right. |
| Buttons | `dh-btn` + `--primary` · `--secondary` · `--quiet` · `--link` · `--destructive`; `--sm` · `--lg` · `--block` · `--icon`; `dh-actions` (`--end`, `--stack`), `dh-actions__note` | `:disabled` or `aria-disabled="true"` flattens any variant to grey; delete any site `opacity` rule for disabled buttons, or the two compound. `aria-busy="true"` adds a spinner; change the label ("Sending…") and have the handler ignore presses while busy. Aliases: `--act` = `--primary`, `--danger` = `--destructive`. |
| Fields | `dh-field`, `dh-field__label`, `__optional`, `__help`, `__error`; `dh-input` (`--mono`, `--sm`), `dh-select`, `dh-textarea`; `dh-input-group` + `__addon`; `dh-inline-form`; `dh-form`, `dh-form__row`, `dh-fieldset`; `dh-check` | Label above. Mark invalid fields with `aria-invalid="true"` and `aria-describedby` pointing at the error. On touch, text is 16px so iOS doesn't zoom. |
| Segmented / tabs | `dh-seg` (`--block`) with `aria-pressed` buttons or `aria-current` links; `dh-tabs` with `aria-current` / `aria-selected`; `dh-count` | Segmented control: views of the same data. Tabs: sections of one record. Both change the URL. |
| Cards | `dh-card` (`--flush`, `--link`), `__head`, `__title`, `__desc`, `__foot`, `__rule`; `dh-panel` = `dh-card` | No shadow, no card inside a card. |
| Stats | `dh-stats`, `dh-stat` (`--key`, `--good`, `--warn`), `__label`, `__value`, `__note` | |
| Tables | `dh-table` (`--compact`, `--cards`, `--stack`), `dh-table-wrap`, `dh-r`, `dh-sub`; row cards: `dh-rc-title`, `dh-rc-end`, `dh-rc-line`, `dh-rc-actions`, `dh-rc-hide` | Every `td` gets `data-label`. `--cards` turns list tables into Radar-style row cards under 640px: the title's link covers the card, controls in any cell stay clickable above it, and `dh-rc-actions` cells (buttons, checkboxes) move to the card's last line without a label. `--stack` turns record tables (keys, checks) into label/value blocks. Captions stay for screen readers. |
| Key/value | `dh-kv` (`--ruled`, `--grid`) | `<dt>`/`<dd>` pairs, optionally wrapped in `<div>`. Long values wrap; they never overflow. |
| Badges | `dh-badge` (`--good`, `--warn`, `--bad`, `--info`, `--outline`, `--dot`), `dh-status` (`--good`, `--warn`, `--bad`, `--info`), `dh-proof` (`--checking`, `--ok`, `--reported`, `--unverified`, `--failed`) | Never clickable, except the proof badge, which opens what was checked. `dh-pill` = `dh-badge`. |
| Notices | `dh-notice` (`--info`, `--success`, `--warn`, `--error`), `__title`, `__actions` | Page context. Use `role="status"`, or `role="alert"` for errors. |
| States | `dh-empty` (`--inline`), `__title`; `dh-loading` (`--block`), `__note`, `dh-spin`, `dh-skel` (`--text`, `--title`, `--num`, `--row`, `--block`), `dh-skel-group`, `dh-progress`; `dh-error` (`--stale`), `__title` | Empty says what would be here and offers one next step. Loading names what is loading. Error says what failed, what is safe and how to retry, with the raw detail under Details. `--stale` keeps the last good data on screen and says how old it is. |
| Stepper | `dh-steps` on an `<ol>`, `aria-current="step"` on the current `<li>`, links on done steps | Numbers come from the list. Write "Address", not "1 Address". Steps before the current one show as done (or set `data-state="done"`). |
| Misc | `dh-code`, `dh-toolbar` + `dh-grow`, `dh-pager`, `dh-elsewhere`, `dh-sr`, `dh-num`, `dh-mono`, `dh-unit`, `dh-link` | |

### Using it from each stack

- **Plain CSS** (hub, arch, basics, faucet, Radar): link the file and use the classes in your HTML. Delete your own
  button, field, table and card rules as you replace them.
- **React + CSS** (gov, vote, bridge, fees): use the classes in JSX or templates (`className="dh-btn dh-btn--primary"`).
  Keep any wrapper component thin: it maps props to classes and adds nothing visual.
- **Tailwind** (dapi, pollr, yappr, forge): add `presets: [require('./public/dashhq/dashhq-tailwind-preset.cjs')]`, then
  have your `<Button>`, `<Input>`, `<Card>` and `<Badge>` render the `dh-*` classes. Use `dh-*` utilities
  (`bg-dh-surface`, `text-dh-ink-2`, `rounded-dh`, `h-dh`, `max-w-dh`, `px-dh-gutter`) for everything else. The preset
  also moves Tailwind's own scale onto the family's: `rounded`/`-sm` = 3, `-md` = 6, `-lg` and up = 10, and `shadow`,
  `-sm`, `-md` = none (`-lg` and up = the pop shadow, for things that float). **Load the layer before Tailwind's CSS**
  so a utility on a component element (`pb-24` on `dh-page`) can refine it: Next puts its own CSS ahead of `<link>`s
  in `<head>`, so Next apps `@import '../public/dashhq/dashhq-components.css';` at the top of `globals.css` (before
  `@tailwind base`) instead of linking it. Preflight's element resets lose to the layer's classes in either order
  (`render-components.mjs` checks both against Tailwind 3.4.19). Don't restyle `dh-btn` with `bg-*` or `rounded-*`.
- **Chakra v2** (explorer): extend the theme so Chakra's components draw the same shapes from the same tokens.
  The snippet is in `../DESIGN.md` §6.

Full recipes: `../DESIGN.md` §6, "Mapping recipes". Per-site changes: `../ADOPTION-r3.md`.

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
