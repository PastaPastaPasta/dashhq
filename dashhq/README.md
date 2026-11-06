# dashhq shell 1.9.0

The shared shell for the dashhq.org family: the family bar, the footer, the hash display, the sign-in explanation,
the wrong-network and retired-page notices, the theme, and the tokens they all draw with. Read `../DESIGN.md` for the
rules and `../ADOPTION-r6.md` for your site's changes this round (then `-r5`, `-r4`).

## New in 1.9

- No shared glyph or favicon. Every product may supply its original icon in `slot="logo"`.
- `All tools` is an unboxed destination picker: eight links, one name/description row pattern. The hub has no picker.
  Fees stays under Explorer; Pollr retires into Governance `/polls/`. Yappr and Forge resolve via `href()` only.
- Theme has one control, in the bar at every width. It opens Light / Dark / Match device as `menuitemradio` rows.
  Enter/Space opens; Up/Down, Home/End move; Escape returns focus. `theme.toggle()` remains supported.
- The phone sheet is one column, over a dismissible scrim; it locks page scroll. Pointer opening focuses the sheet;
  keyboard opening focuses the first link. No nested More tools, app group or theme row.
- Footer: one band, no destination list. See the exact slot contract below.
- Added `.dh-disclosure`, `.dh-time`, `.dh-chip--test`; `.dh-stat` is now a surface card with 18px padding,
  a 1px border, 10px radius and 12px tile gaps. Settled Reported badges no longer draw a dotted circle.
- Removed release assets: `mark/` and its favicon. Remove those references from your document head.
  Removed shadow classes: `.steps`, `.grp`, `.only`, `.themes`, `.seg`, `.mtools` and footer `.doors`.
  No public bar attribute was removed. `no-theme` now hides the sole theme control: only use it for embedded chrome.

### Footer API in 1.9

`product` and `source` attributes remain. The wordmark is always `dashhq`, and Source comes from `source`.
For a product, the shell writes “Radar is one of the dashhq tools for the Dash network.” (using the registry name),
then places the **default slot** inline before Source and All Dash projects. Supply plain text and links;
do not supply grids, columns, block wrappers, another tagline or another directory link.

For `product="home"`, the **default slot is the sentence** (or use `slot="sentence"` on one inline element).
Put optional links in `slot="links"`. The hub omits All Dash projects. Named slots are only used by the hub.

```html
<dashhq-footer product="radar" source="https://github.com/PastaPastaPasta/dash-nodes">
  <a href="/about">Data sources</a><a href="/api">API</a>
</dashhq-footer>
<dashhq-footer product="home" source="https://github.com/PastaPastaPasta/dashhq">
  <span slot="sentence">Kept by pasta. No analytics; one theme cookie if you pick a theme.</span>
  <a slot="links" href="https://github.com/PastaPastaPasta/dashhq/issues">Report a problem ↗</a>
</dashhq-footer>
```

### Freshness and disclosure contracts

`.dh-time` styles authored markup; it does **not** calculate or refresh timestamps. Render a relative age only,
using `<time class="dh-time" datetime="2026-11-06T16:16:00Z" title="6 Nov 2026, 16:16 UTC">10 min ago</time>`.
Use UTC with this exact absolute format in title. Update the relative text from the product's existing timer.
Use `<details class="dh-disclosure"><summary>Details</summary>…</details>`; native details keyboard handling stays intact.
Use `<span class="dh-chip--test">Testnet preview</span>` for a dashed chip without a circle.

## New in 1.8 (round 6): sources beside figures, and a switcher that says what it is

| What | Who acts | How |
|---|---|---|
| **Sources beside figures.** A source or check label never sits inside a sentence. Three classes in the component layer: `.dh-src`, a quiet tag after a label or a complete value ("Asked for [Platform records]"; `--ok` checked in this browser, `--warn` stale or not checked); `.dh-ref`, a superscript number after a sentence's full stop; `.dh-sources`, the numbered lines closing the block (`ol`), or one "Sources: …" line for a block that shares a source (`p`). | Governance (Treasury, budget header), Explorer and anyone with a chip in a sentence; anyone showing fiat | "Sources beside figures" below; `components.html#sources`; checks `sources-*`; `../ADOPTION-r6.md` §4 |
| **Fiat reads as an estimate**: "≈ $309,000", three significant figures (`../PRICE.md`, with a reference `formatUsdEstimate`). | Governance, Explorer, Bridge | `../PRICE.md` |
| **The desktop switcher says what it is**: "dashhq tools ⌄" beside the product name (Sol #14), the phone menu's heading too. Short of room, the words give way to the chevron before the row collapses. Its accessible name is unchanged ("All dashhq tools"). | Nobody: re-vendor | check `switcher-says-what-it-is-*`; `bars.html` |
| **1.8.1, same API.** A numbered source line keeps a link or `<time>` inline (1.8.0 put them in the number's column); a long `.dh-src` tag wraps inside its tile instead of widening a phone page. A retired page mounted late forwards even where the browser keeps no navigation timing. The arrival notice moves to a new bar whichever order a framework swaps bars in, and pads the scroll only under a `sticky` bar. The address loses no more than the marker (no stray `?`). `PRICE.md`'s `formatUsdEstimate` uses only long-supported Intl options. | Everyone on 1.8.0: re-vendor 1.8.1 | checks `sources-*`, `arrival-handover-insert-then-remove`, `moved-late-without-timing-forwards-once`, `switcher-drops-words-before-collapsing` |
| **Fixes to 1.7.0, same API.** The desktop network menu's "Network settings" row keeps its look (1.7.0's phone "More tools" style leaked onto it in Governance and Explorer). The arrival notice shows only where the retired product's links land, survives the page replacing its bar, keeps focus on Dismiss across re-renders, waits for a visible tab before speaking, and pads `<html>`'s scroll while it makes the bar taller. A retired page never forwards in a loop, and waits for DOMContentLoaded even when it is added late. | Everyone on 1.7.0: re-vendor 1.8.1 | checks `network-settings-row-unchanged`, `arrival-*`, `moved-never-loops` |

## New in 1.7 (round 6): no waiting at a retired address, and a phone menu that lists nothing twice

| What | Who acts | How |
|---|---|---|
| **Retired pages forward at once.** `<dashhq-moved>` opens the exact new place with `location.replace` as soon as the page's route map has run: no countdown, no "Stay here", no 20 seconds on an empty page. The network, query and plain hash travel as before, plus `?moved-from=<product>`. An instant redirect sets no time limit, so WCAG 2.2.1 has nothing to adjust. Someone who comes Back to the old address gets the page with its one link instead of a second bounce; without JavaScript, the element's children (heading, lede, one real link) are the page. | EvoVote, Basics, the Fee estimator: re-vendor; drop `networks` from the bar; make the no-JS link a primary button with `moved-from` | `<dashhq-moved>` below; `moved.html`; checks `moved-*` |
| **The arrival notice is the shell's.** On any family page, the shell reads `?moved-from=`, takes it out of the address before the app starts (every other byte of the query is kept), and the bar shows one dismissible line: "**fees.dashhq.org** is now part of Explorer. Old links open the same place here." (the first sentence only on phones). It shows only on the product the retired one moved into, is announced once, and goes when dismissed or when the visitor moves on to another page. | Nobody: re-vendor. Governance deletes its own `MovedFromVote` notice | "Arriving from a retired product" below; `arrived.html?moved-from=vote`; checks `arrival-*` |
| **A short phone menu.** The product's sections, then "dashhq tools": the other doors by name (never the product's own door, which its sections already cover), then one **More tools** row that opens the apps, Architecture, the Fee estimator, the DAPI console, the Faucet and dashhq.org, then the theme. Anything your own sections already link to leaves the family part, so the hub's menu no longer lists Radar, Governance, Explorer and Start twice. With `phone-nav="tabs"` the menu holds only the family part, as before. | Nobody: re-vendor. See `../ADOPTION-r6.md` §2 for the sites whose nav repeats family links | "Phone menu" below; checks `phone-menu-*` |
| **Footer:** "Directory" opens `dashhq.org/directory/`, like the hub's own nav, instead of a fold half-way down the hub. | Nobody | check `footer-directory-is-the-directory-page` |

## New in 1.6 (round 5): the same situation, handled the same way everywhere

| What | Who acts | How |
|---|---|---|
| **The shell owns the network order.** Every network menu reads Mainnet, Testnet, then "Developer networks" (devnets A to Z, open only on a devnet), whatever order `networks` lists. `dashhq.network.sort()` gives the same order to any list of your own. | Nobody for the bar. Explorer and Bridge: sort their own network pickers. | `<dashhq-bar>`; check `network-order-is-the-shells` |
| **`<dashhq-not-found>`** and **`dashhq.network.findElsewhere()`**: a record looked up on one network that isn't there says "Not on Testnet. This masternode exists on Mainnet", with "Open it on Mainnet", or "Not on Testnet or Mainnet". | Radar, Governance, Explorer, Bridge, DAPI | The element's section below; `demo.html#not-found` |
| **`<dashhq-moved>`**: one retired-page behaviour (the 20-second forward is gone in 1.7: it forwards at once). | EvoVote, Basics, the Fee estimator | The element's section below; `moved.html` |
| **Compact sign-in help.** On phones (or `compact="always"`) `<dashhq-signin-help>` is one line, "Uses your Dash identity · What's this? ›", above the ways in; the explanation opens in place. | Nobody: re-vendor | The element's section below; `app.html?signin` at 390px |
| **The committing button is amber everywhere.** `.dh-btn--primary` no longer takes `--dh-accent`. `.dh-btn--lg` is retired and draws at the family height. An app's accent now marks its brand, selection and highlights, turned on with `<html data-dh-accent="forge\|pollr\|yappr">`. Links stay blue. | Forge, Pollr, Yappr: swap the `:root` line for the attribute | "App accents" below; `components.html#accents` |
| **1.6.2:** a new lookup is a new question: it shows "Checking" and never an earlier answer, and a dropped lookup's late answer is discarded. Apps that pass a new lookup function on every render set `record`, so the same record keeps its answer. Focus stays in a notice when its button changes. The retired-page warning is said when the tab is first visible, and a scroll that starts on its buttons stops the forward. | Everyone: re-vendor 1.6.2 | |
| **1.6.1:** review fixes, same API. "Open it on Mainnet" is dispatched from the page's bar, so SPAs that route the bar's network switch route this one too. Both notices keep one live region and announce each result once. The retired-page forward is 20 seconds (WCAG 2.2.1), and pressing "Stay here" from the keyboard can't also open the link (Firefox). `found` values other than a network, `none` or `unknown` read as "couldn't check", never as "nowhere". Repeated query keys all travel. `.dh-fill` resets the body margin. | Everyone: re-vendor 1.6.1 | |
| **Fixes.** The footer and switcher no longer mark Explorer's door current on Architecture, Basics or the DAPI console (Opus #15). A stepper step before the current one can say it isn't done (`data-state="todo"`, Sol #14). Two link styles, `.dh-link` and `.dh-link--go` (Opus #25). `.dh-fill` keeps a short page's footer at the bottom (Opus #22). | Bridge (`todo`); anyone with a floating footer | `components.html#steps`, `#misc` |

## New in 1.5 (round 4)

| What | Who acts | How |
|---|---|---|
| **One phone lockup.** Every compact bar shows the mark and a small `dashhq` over the product name. The wordmark is never dropped; short of room the network pill loses its word first, then the product name truncates. | Nobody: re-vendor. Delete any CSS that hides or restyles the bar's lockup. | `bars.html` shows all 14 bars. |
| **One section nav per app.** `slot="nav"` is the app's only section nav. With `phone-nav="tabs"` the bar draws it as a bottom tab bar on phones, and the menu keeps only the family. | Pollr, Yappr (tabs); Forge (menu) | Delete your own bottom nav and sidebars' section lists; see *Navigation layers*. |
| **`<dashhq-signin-help>`.** One explanation of signing in: what a Dash identity is, what this app asks for, where it is kept, Start, and the hub's `/identity/` page. | Governance, Pollr, Forge, Yappr | Put it at the top of your sign-in surface; see the element's section. |
| **`.dh-choice` and `.dh-dialog`.** Choice cards for the ways in (and any "new or existing" choice), and the dialog frame. | Same apps; Bridge for its contract import choice | `components.html#signin`. |
| **Phone menu.** Start is "Start on Testnet" with its explanation and Bridge → Faucet; Apps and Also are 44px rows. | Nobody | |
| **Devnets** in a `networks` list sit behind "Developer networks" unless the page is on a devnet. | Nobody (Explorer: no change needed) | |
| **`:state(compact)`** on the bar and **`--dh-tabs-h`** on `<html>` let product CSS follow the bar. | Optional | |
| **1.5.1:** the family menus' Fee estimator opens Explorer's `/tools/fees/` (with the network) instead of the retired host. Review fixes: the bar no longer oscillates when product CSS hides its nav with `:state(compact)`; `hidden` works on nav items and on the help's `start` slot; a tab works while the menu is open; the sign-in help explains the app's own network (Testnet for the apps, even under a Mainnet bar) and offers Bridge on that network off Testnet. | Everyone: re-vendor 1.5.1 | |
| **1.5.3:** the sign-in help is shorter on phones: one sentence about identities with "How identities work →" inline, facts as lead-in paragraphs, `kept-note` in secondary ink. The door switcher's group labels line up; the network menu sizes to its content ("Developer networks" on one line). | Everyone: re-vendor 1.5.3 | |
| **1.5.2:** `asks="password"` reads "a password you set in *Product*" (Yappr's backup password, Forge's unlock passphrase). On phones a done step's link in `.dh-steps` covers its disc, and its label lines up with the others (it sat lower in Faucet). | Everyone: re-vendor 1.5.2 | |

| File | What | Required |
|---|---|---|
| `dashhq-shell.js` | `<dashhq-bar>`, `<dashhq-footer>`, `<dashhq-hash>`, `<dashhq-signin-help>`, `<dashhq-not-found>`, `<dashhq-moved>`, theme, `window.dashhq` | yes |
| `dashhq-tokens.css` | `--dh-*` custom properties, light and dark, and the Archivo `@font-face` | yes |
| `dashhq-shell.css` | Pre-upgrade fallback and styling for your links slotted into the bar | yes |
| `fonts/archivo-latin-var.woff2` | Archivo, variable, Latin, 79 KB (`fonts/PROVENANCE.md`, `fonts/OFL.txt`) | yes |
| `dashhq-components.css` | The family component layer: layout, page header, buttons, fields, tables, states, stepper (`.dh-*` classes) | yes (see Components) |
| `dashhq-tailwind-preset.cjs` | Tailwind 3.4 preset mapping colours, radii, heights, fonts and shadows to the tokens | Tailwind sites |
| `dashhq-shell.d.ts`, `dashhq-shell.react.d.ts` | Types for `window.dashhq` and the events; JSX types for the elements (React only) | TS sites |
| `demo.html` | Every piece on one page; also a CSP test (open it through a server, not `file://`) | no |
| `bars.html` | All fourteen bars with each site's real attributes, logo and actions: the phone lockup reference | no |
| `app.html` | An app page: section nav as phone tabs, the sign-in dialog with `<dashhq-signin-help>`, one footer | no |
| `components.html` | Every component in every state, with the app accents; `?accent=forge\|pollr\|yappr` previews one page-wide | no |
| `moved.html`, `moved.js` | A retired product's page as every retired site writes it (EvoVote's, with its one route map) | no |
| `arrived.html` | Where a retired link lands (a Governance contest): open it as `arrived.html?moved-from=vote` to see the arrival notice | no |

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
<!-- Keep your product’s original favicon; the shell ships none. -->
```

The script is classic and blocking on purpose: it sets `<html data-theme>` before first paint, so there is no flash
of the wrong theme and no inline script. It is about 79 KB (23 KB gzipped), readable, unminified, and makes no requests.

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
  <a href="/about">Data sources</a>
</dashhq-footer>
```

## `<dashhq-bar>`

| Attribute | Meaning |
|---|---|
| `product` | **Required.** `home radar gov explorer faucet bridge arch fees dapi vote basics forge pollr yappr`. Sets the name, the active door, and which links carry the network. |
| `product-name` | Override the shown name (rare). |
| `product-href` | Where the product name links. Default `/`. Set it if you have a base path. |
| `network` | The network this page shows: `mainnet`, `testnet`, `devnet-<name>`. Omit on pages that are not about one network. Testnet and devnet draw the bar's bottom rule dashed. |
| `networks` | Space-separated list of the networks this page can show. With two or more, the network pill becomes a menu. The order is the shell's, never yours: Mainnet, Testnet, then devnets A to Z behind "Developer networks" (open when the page is on a devnet). The page's own `network` is always listed. Choosing one navigates to the same URL with `?network=` (including mainnet) unless you cancel the `dashhq-network` event. |
| `network-settings` | URL of an advanced network page; adds "Network settings" to the network menu (gov). |
| `phone-nav` | `menu` (default) or `tabs`. Where the slotted nav goes on phones: the top of the menu, or a bottom tab bar the bar draws (apps whose sections people switch between constantly: Pollr, Yappr). |
| `network-note` | Optional. One sentence shown under the network choices, on record pages: "This masternode is on Mainnet." Switching keeps the record's URL; if the record isn't on the new network, the page shows `<dashhq-not-found>` (never a silent jump to a list, never "not published yet"). |
| `sticky` | Sticks the bar to the top. Use it on the core tools. |
| `no-theme` | Hides the sole theme control, including its popover. Intended for embedded chrome only. |

| Slot | Content |
|---|---|
| `nav` | One element (`<nav>`, `<ul>` or `<div>`) holding your top-level sections: your only section nav. Mark the current one `aria-current="page"`. 3 to 6 links (3 to 5 with `phone-nav="tabs"`). A plain `<button>` may stand in for a link that opens something (Yappr's Post). On phones they stack as 44px menu rows, or become tabs. Inside an item, an element with `class="dh-nav-icon"` (a 22px icon) shows only in the tab bar. `data-dh-phone` on an item shows it only in the phone layouts; `data-dh-desktop` only in the wide row. |
| `actions` | Sign in or the account menu, and at most one more control (search, notifications). It stays visible on phones: keep it to 100px there ("Sign in", or 40px icon buttons). The account menu holds the app's personal pages (profile, bookmarks, settings, sign out). |
| `logo` | One original product icon, for any product except home: `<img slot="logo" src="/icon.png" alt="" width="22" height="22">`. Decorative, local asset, 22px desktop / 26px phone, radius 5px. With no assigned icon there is no gap. Do not pass a family glyph. |

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
- `window.dashhq.network.sort(list)`: the family's order (Mainnet, Testnet, devnets A to Z). Use it for any network
  picker of your own (settings pages, Bridge's selector).
- `window.dashhq.network.findElsewhere(exists, { network, networks, signal })`: see `<dashhq-not-found>`.
- `window.dashhq.theme.set('dark' | 'light' | 'system')`, `.toggle()`, `.pref`, `.resolved`.

On wide screens **All tools ⌄** (accessible name “All dashhq tools”) sits beside the product name.
The hub (`product="home"`) has only its wordmark and slotted nav, no family picker. The bar measures available width:
first it drops the All tools label, then collapses to phone chrome. Desktop lockup: dashhq / [optional icon] Product.
Phone: optional 26px icon beside a small dashhq home link over the product link. The theme stays visible.
When space runs out, the network word hides before the product name truncates (full name in its tooltip).

**Phone menu.** One column of 44px rows: your sections, a hairline and dashhq tools label, the other core doors,
a hairline and Architecture / DAPI console / Faucet, then a hairline and All Dash projects.
No nested disclosure or theme row. Any destination already in the product nav is omitted from the family portion;
the current core door is omitted. The hub shows its slotted doors plus nonduplicated reference tools.
Pointer/touch opening focuses the sheet container without a link ring; keyboard opening focuses its first link.
The scrim closes the sheet and page scroll stays locked until close. Escape restores trigger focus.

**Following the bar from product CSS.** The bar never writes attributes on itself. It exposes its layout as a custom
state, `dashhq-bar:state(compact)`, for the rare control in your actions slot that must change with it. With
`phone-nav="tabs"` on a phone it also sets `--dh-tabs-h` on `<html>` (the tab bar's height, including the safe area);
`<dashhq-footer>` already pads itself by it, and anything of yours fixed to the bottom (a toast, a compose button)
should sit at `bottom: var(--dh-tabs-h, 0px)`.

`:state()` is recent (Chrome 125, Firefox 126, Safari 17.4). Older engines reject the whole selector list it appears
in, and `el.matches(':state(compact)')` throws there, so keep it in a rule of its own or behind
`@supports selector(:state(a))`. Hide a nav item with the `hidden` attribute (or `data-dh-phone` / `data-dh-desktop`):
the bar's item rules outrank utility classes such as Tailwind's `.hidden`. The tab bar is `position: fixed`, so the
bar must not sit inside an element with `transform`, `filter`, `backdrop-filter`, `will-change` or `contain`; that
would pin the tab bar inside the header instead of the screen's bottom edge. Tab labels are one or two short words
("Polls", "My polls"); they wrap under the icon rather than overflow.

### Navigation layers

One owner per job, at every width (`../DESIGN.md` §5 has the full rule):

| Layer | Owns | Desktop | Phone |
|---|---|---|---|
| Family bar | The family tools, theme, the network, and the account (`actions`) | The row | Product icon, lockup, network, theme, actions, menu (≡) |
| The product's sections (`slot="nav"`) | The app's 3 to 6 top-level sections | In the bar's row, after the product name | Top of the menu, or the bottom tab bar (`phone-nav="tabs"`) |
| Page | Tabs, filters, sub-navigation of one page or record | In the page | In the page |
| Footer (`<dashhq-footer>`) | Product lines, Source, All Dash projects | One footer | One footer |

So: no second header, no sidebar that repeats the sections, no app bottom bar of your own, no second footer in a
side column. A sidebar may hold things that belong to the page (compose, filters, who to follow), never the section
list. Personal pages (profile, bookmarks, followers, settings) go in the account menu in `actions`.

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

## `<dashhq-signin-help>`

One explanation of signing in, worded the same in every app. Put it at the top of every sign-in surface, under the
title and one lede, above your own ways in:

```html
<div class="dh-dialog__head"><h2 class="dh-dialog__title">Sign in to Pollr</h2> … close … </div>
<p class="dh-dialog__lede">Reading is free. Sign in to create a poll or vote.</p>
<dashhq-signin-help asks="key" kept="tab" why="It signs the polls you create and your votes."></dashhq-signin-help>
… your form, or your ways in as .dh-choice cards …
```

It says what a Dash identity is (network-aware: "One Testnet identity works across the dashhq apps on Testnet; each
app signs you in on its own"), what this app asks for and where it keeps it, "No identity yet? Start on Testnet →"
(Mainnet and devnets: "Create one in Bridge →" on that network, with "Mainnet, real DASH" on Mainnet), and links
"How identities work →" to the hub's `/identity/` page. Your
implementation, your security model and your forms stay exactly as they are; this only explains them.

| Attribute | Meaning |
|---|---|
| `asks` | What you accept, space-separated, in the order you offer them. `wallet` (an approval in a Dash wallet), `passkey`, `phrase` (recovery phrase, 12 or 24 words), `key` (a private key, High or Critical), `password` (a password or passphrase set in this app: Yappr's backup password, Forge's unlock passphrase), `voting-key` (a masternode's voting key; said separately, with "never the owner, payout or collateral key"). Unknown words are ignored. |
| `kept` | Where it ends up and for how long. `memory` (never saved in the browser; closing the tab signs you out), `tab` (this tab until it closes or you sign out), `browser` (this browser until you sign out, with the shared-computer advice), `sealed` (this browser, encrypted with a passkey or passphrase). Omit it when your ways differ; the help then says each way below says what it keeps, and each `.dh-choice` says so in its meta line. Update it live if the user flips a "keep me signed in" switch. |
| `kept-note` | One or two sentences of specifics: limits, expiry, encrypted copies on Platform. "This browser gets its own limited key: at most 0.05 DASH, only on Forge, for 90 days." |
| `why` | One sentence: what the credential signs here. |
| `product`, `network` | Default to the page bar's. An app that runs on one network (Forge, Pollr, Yappr) explains that network even without `network`. Set `network` if the dialog is about a different network than the page. |
| `compact` | Default (`auto`): on a phone-narrow dialog (under 440px) the help folds to one line, "Uses your Dash identity · What's this? ›", so the ways in come first and the explanation is one tap away. `always` (or the bare attribute) folds it at any width; `never` keeps it open. The line opens in place and keeps focus. |

| Slot | Content |
|---|---|
| `start` | Your own create action instead of the default Start link, when you have one (Governance's "Create an account"). A plain `<button>` or `<a>`; the help styles it like its own link. |

It is a well (page ground, hairline border), so it sits inside a dialog or a card without becoming a card in a
card. On phones it starts folded (`compact`); opened, each fact is one paragraph with its label as a lead-in ("Pollr
asks for: …"), and `kept-note` is set smaller in secondary ink. Keep `why`
to about 12 words. Copy is fixed on purpose: if a sentence is wrong for your app, request a
change in `REQUESTS/` rather than working around it. Accurate values for each app are in `../ADOPTION-r4.md`, and the
page it links to is `../IDENTITY-PAGE.md`.

## `<dashhq-not-found>`

A record looked up on one network that isn't there: a masternode, proposal, name contest, identity, contract, token.
A shared link opened on the other network must never look like missing data, so the page says where the record is
instead. Use it in place of your own not-found block on every record page, under the page header:

```html
<dashhq-not-found thing="masternode" id-label="ProTx hash" list-href="/masternodes?network=testnet"
  list-label="Browse Testnet masternodes"></dashhq-not-found>
```

| State | Title | Line | Actions |
|---|---|---|---|
| checking | Not on Testnet | ◌ Checking Mainnet… | |
| found (`found="mainnet"`) | Not on Testnet | This masternode exists on Mainnet. | **Open it on Mainnet →** (a button), your list link |
| `found="none"` | Not on Testnet or Mainnet | There's no masternode with this ProTx hash on either network. | your list link |
| `found="unknown"` | Not on Testnet | We couldn't check Mainnet just now. | Look on Mainnet →, your list link |

| Attribute | Meaning |
|---|---|
| `thing` | **Required.** The noun, lower case: `masternode`, `evonode`, `proposal`, `name contest`, `identity`, `username`, `contract`, `token`. |
| `id-label` | What the id is called in the "none" line: `ProTx hash`, `name`, `hash`. Default `ID`. |
| `network` | Where the page looked. Default: the page bar's network (and it re-checks when that changes). |
| `networks` | Where to look. Default `mainnet testnet`; the shell's order. |
| `found` | Set it yourself if your app already knows: a network, `none` or `unknown`. Leave it off (or `checking`) while you check; anything else reads as `unknown`. Keep the last answer while you re-check the same record, so the notice doesn't flash. |
| `record` | With a `lookup`: the record's id (`proposal:Dash-Music`, the ProTx). A new `record` is a new question; a new lookup function for the same `record` keeps the answer. Without it, every new lookup function is a new question, so pass a stable function (React: `useCallback` on the id and network) or set `record`. |
| `href` | The record on the found network. Default: this URL with `?network=` swapped, which is right for every family URL shape (`/mn/<protx>`, `/p/<name>`, `/identity/?id=`). |
| `list-href`, `list-label` | This network's list or search: "Browse Testnet masternodes", "Search Testnet". |

Children are one extra sentence of your own, shown under the line (Governance: "A proposal shows here once the network
has it."). Keep it factual; never guess why it's missing.

**Let the element check.** Give it a lookup and it asks the other networks itself, in order, showing "Checking…"
meanwhile, and asks again when the page's network changes:

```js
const el = document.querySelector('dashhq-not-found');
el.lookup = async (network, signal) => (await fetch(`/api/mn/${protx}?network=${network}`, { signal })).ok;
```

The lookup resolves `true` or `false`; a throw counts as "couldn't check". A question starts a microtask after the change
that asked it, so setting `record` and `lookup` in the same step asks once, with the new lookup. Without the element,
`await dashhq.network.findElsewhere(lookup, { network: 'testnet' })` returns `'mainnet'`, `'none'` or `'unknown'`.

| Stack | How |
|---|---|
| Static (Radar) | Render the element, then set `el.lookup` (above). |
| React (Governance, DAPI) | `<dashhq-not-found ref={ref} thing="proposal" id-label="name" />`, then in an effect `ref.current.lookup = (n, signal) => api.hasProposal(name, n, signal)`. Or compute `found` with `findElsewhere` and pass it as a prop. |
| Chakra / Next (Explorer) | The same as React. Replace `IdentityNetworkRecovery` and each entity page's "No … on this network" with the element. |
| Vanilla TS (Bridge) | `wrong-network.ts` already probes: set `found` from its answer. |

"Open it on Mainnet" fires the same cancelable `dashhq-network` event as the bar's menu (bubbling, composed,
`detail: { network, href }`), **from the page's bar**, so an SPA that already routes the bar's switch (Governance,
Explorer, DAPI) routes this one with no new code. If nobody cancels it, it is an ordinary link to `href`.

## `<dashhq-moved>`

The page a retired product leaves behind. One behaviour for the family, decided once:

- **It forwards at once.** As soon as the page's route map has run (deferred scripts run before `DOMContentLoaded`),
  the element replaces the address with the exact new place. Nobody waits, nobody has to find a button, and Back from
  the new place skips the old address. An instant redirect sets no time limit, so there is nothing for WCAG 2.2.1 to
  adjust and no "Stay here".
- **Nothing is lost:** the old link's network (`?network=`, or the element's `network`, else Mainnet), its query (every
  value of a repeated key), and its hash (unless the hash was an old hash route such as `#/c/german`, which your route
  map turns into `path`).
- **The new home says what happened**, not the old one: the element adds `?moved-from=<product>`, and the new home's
  bar shows "**vote.dashhq.org** is now part of Governance. Old links open the same place here." (below).
- **What it draws is for the few it doesn't forward at once:** a slow destination ("Opening Governance…" with the one
  link), or someone who comes Back to the old address on purpose, who gets the page and its link instead of a second
  bounce. Its children are the page without JavaScript: the heading, the lede and a real production link.
- **The same header and footer:** your product's bar, without `networks` (the page has no network content; the element
  sets a static pill to the network the visitor will land on), `<main class="dh-container dh-page"><div class="dh-narrow">`,
  and your `<dashhq-footer>`. Put `class="dh-fill"` on `<body>` so the footer sits at the bottom.

```html
<body class="dh-fill">
<dashhq-bar product="vote" network="mainnet" sticky></dashhq-bar>
<main class="dh-container dh-page"><div class="dh-narrow">
  <dashhq-moved to="gov" path="/names" heading="Name contests moved to Governance"
    lede="Browse name contests, inspect tallies and choose how to vote, all in one place." label="Open name contests">
    <h1 class="dh-page-header__title">Name contests moved to Governance</h1>
    <p class="dh-page-header__lede">Browse name contests, inspect tallies and choose how to vote, all in one place.</p>
    <p><a class="dh-btn dh-btn--primary" href="https://gov.dashhq.org/names?network=mainnet&amp;moved-from=vote">Open name contests →</a></p>
  </dashhq-moved>
  <noscript><p>JavaScript is off, so this page can't open your contest directly. The link above opens the contest list on Mainnet.</p></noscript>
</div></main>
<dashhq-footer product="vote" source="…"></dashhq-footer>
</body>
```

| Attribute | Meaning |
|---|---|
| `to` | **Required.** The new home's product key (`gov`, `explorer`). |
| `path` | The exact place there, with any query: `/names/a11ce`, `/tools/fees/`, `/dpns/search/`. Set it from a deferred script when the old URL maps to a deeper place (`moved.js` maps EvoVote's `#/c/<label>`); the forward waits for deferred scripts. Default `/`. |
| `heading` | The H1. Default "*Old* has moved to *New*". Say what moved if that's clearer: "Name contests moved to Governance". |
| `lede` | One sentence: what the new home does for the visitor. |
| `label` | The primary link's words. Default "Open *New*". |
| `network` | The network when the old link names none (Basics' old pages were Testnet). Default Mainnet. |
| `product` | The retired product. Default: the page bar's. |

A retired site keeps only its pages and its route map: no countdown, no pause button, no redirect script.

### Arriving from a retired product

Nothing to add on the new home. The shell reads `?moved-from=` when it loads (before your app's router does) and takes
it out of the address with `history.replaceState`, keeping every other byte of the query and the hash, so a reload, a
copied link or your router never see it. The bar of the product the retired one moved into then shows one line under
its row, on the info ground, with a Dismiss button:

> **fees.dashhq.org** is now part of Explorer. Old links open the same place here.

- Phones show the first sentence only.
- It shows only on the product that is the retired one's new home, and only on the pages its links land on: Governance's
  `/names…` for `vote`; Explorer's `/tools/fees/` for `fees`; Explorer's `/`, `/identity/…` and `/dpns/…` for `basics`.
  A hand-made link elsewhere can't make a page claim the move: the marker is taken out of the address and ignored.
- Screen readers hear it once, when the tab is visible (a tab opened in the background waits until it is shown). Re-rendering
  the bar keeps the same node, says nothing new and keeps focus on Dismiss. If your framework replaces the bar element,
  in either order (remove then insert, or insert then remove), the new bar takes the same node over.
- It goes when dismissed (focus moves to the product's name) or when the visitor moves on to another page in your SPA
  (a push or a traverse, through the Navigation API; without it, it stays until dismissed). Your app canonicalising its
  own address with `replaceState` doesn't end it.
- While it shows under a `sticky` bar, the bar is taller, so the shell adds its height to `<html>`'s
  `scroll-padding-top` (on top of yours, as computed when the notice appeared): anchors and `scrollIntoView` sized for
  the bar alone still land clear of it. Dismissing gives your value back.
- `<dashhq-moved>` never forwards a page that was itself reached by a forward, or one whose map points back at itself.
- It is part of the bar, so it sticks with a `sticky` bar until dismissed. The phone menu opens over it.

## Components (`dashhq-components.css`)

One small, framework-free layer on the tokens. It is CSP-safe: no inline styles, no images, no `url()`. Every
class is namespaced `dh-`. The rules it encodes are in `../DESIGN.md` §6; `components.html` shows every piece in every
state, and `../tools/render-components.mjs` checks it. Load it after `dashhq-shell.css` and before your own CSS.

Decided once for the family, so nobody decides them again:

| | |
|---|---|
| Radius | 6px (`--dh-r2`) on every control, 10px (`--dh-r3`) on every card, 3px (`--dh-r1`) on badges. Nothing pill-shaped. |
| Heights | `--dh-ctl-h-sm` / `--dh-ctl-h`: 28 / 34px, and 40 / 42px on touch screens. Every button that matters, inputs and selects use the middle one; `--sm` is for dense rows. `.dh-btn--lg` is retired (1.6): it draws at the family height. |
| Focus | `outline: 2px solid var(--dh-focus); outline-offset: 2px` on everything. `--dh-ring-shadow` is the same ring as a box-shadow. |
| Casing | Sentence case: "Create identity", "Sign in", "Explore public posts". Components reset `text-transform` and `letter-spacing`, but the words are yours to write. |
| Primary | `.dh-btn--primary` is the one committing action in view, filled amber (`--dh-act`) with navy `--dh-act-ink` text, in every product, apps included. |
| Selection | `--dh-select` (the current tab's rule, a chosen card's ring, checked boxes) and `--dh-select-soft` (selected and highlighted rows): Dash blue, or an app's accent. |
| Links | `.dh-link` inside sentences (underlined); `.dh-link--go` for a next step on its own ("Top up in Bridge →": semibold, arrow, underlined on hover). Both Dash blue everywhere. |
| Width | `.dh-container` is the bar's row: `max-width: var(--dh-max)`, border-box, `padding-inline: var(--dh-gutter)`. Content starts at the bar gutter: x = 160 at 1440px, 16px on phones. |

**App accents.** The committing button is amber in every product. An app's accent is for its brand mark, its
selection and its highlights, and an app turns it on with one attribute on `<html>`:

```html
<html lang="en" data-dh-accent="pollr">   <!-- or forge, yappr -->
```

That sets `--dh-accent` (the glyph: `text-[var(--dh-accent)]`), and points `--dh-select` and `--dh-select-soft` at
the accent's shades for the current theme, so the current tab's rule, a chosen card's ring, checked boxes, the phone
tab bar's current tab and selected rows follow. Links, focus and status stay the family's. The shades are tokens
(`--dh-accent-pollr-select`, `-soft`), checked at 3:1 for marks and 4.5:1 for text on highlights. Delete the old
`:root { --dh-accent: var(--dh-accent-pollr); }` line; it now only colours the glyph. Never fill a button with the
accent, and never set text in it: Forge's ember would read as the dark theme's warning colour.

### Class reference

| Block | Classes | Notes |
|---|---|---|
| Layout | `dh-container`, `dh-page`, `dh-narrow`, `dh-measure`, `dh-stack` (`--lg`), `dh-grid` (`--dh-grid-min`), `dh-split`, `dh-band`, `dh-fill` (+ `dh-fill__main`) | One container per page. Narrow columns stay left-aligned. `dh-split` is a main column plus a 320px aside. `dh-fill` on `<body>` (or the element holding bar, main and footer) keeps a short page's footer at the bottom of the screen. |
| Page header | `dh-page-header` (`--home`), `__row`, `__text`, `__kicker`, `__title`, `__lede`, `__actions`, `__meta`; `dh-crumbs` | One per page, directly inside the container. Title 30px (26px on phones), lede 17px, actions top right and wrapping under on phones. |
| Section | `dh-section` (`--rule`), `__head`, `__title`, `__desc`, `__actions` | H2 21px. The description sits under the title, with actions to the right. |
| Buttons | `dh-btn` + `--primary` · `--secondary` · `--quiet` · `--link` · `--destructive`; `--sm` · `--block` · `--icon` (`--lg` retired); `dh-actions` (`--end`, `--stack`), `dh-actions__note` | `:disabled` or `aria-disabled="true"` flattens any variant to grey; delete any site `opacity` rule for disabled buttons, or the two compound. `aria-busy="true"` adds a spinner; change the label ("Sending…") and have the handler ignore presses while busy. Aliases: `--act` = `--primary`, `--danger` = `--destructive`. |
| Fields | `dh-field`, `dh-field__label`, `__optional`, `__help`, `__error`; `dh-input` (`--mono`, `--sm`), `dh-select`, `dh-textarea`; `dh-input-group` + `__addon`; `dh-inline-form`; `dh-form`, `dh-form__row`, `dh-fieldset`; `dh-check` | Label above. Mark invalid fields with `aria-invalid="true"` and `aria-describedby` pointing at the error. On touch, text is 16px so iOS doesn't zoom. |
| Segmented / tabs | `dh-seg` (`--block`) with `aria-pressed` buttons or `aria-current` links; `dh-tabs` with `aria-current` / `aria-selected`; `dh-count` | Segmented control: views of the same data. Tabs: sections of one record. Both change the URL. |
| Cards | `dh-card` (`--flush`, `--link`), `__head`, `__title`, `__desc`, `__foot`, `__rule`; `dh-panel` = `dh-card` | No shadow, no card inside a card. |
| Choices | `dh-choices` (`--2`), `dh-choice`, `__icon`, `__title`, `__desc`, `__meta` | One whole-card `<button>` or `<a>` per way to do a thing (sign-in methods, new or existing identity). Recommended first, with a `dh-badge` if you say so; unavailable ways last and `disabled` (dashed). `aria-pressed`/`aria-checked`/`aria-current` mark the chosen one. The meta line says what it keeps ("Kept: this tab only"). |
| Dialog | `dh-dialog` (on `<dialog>` or a framework's dialog content), `__head`, `__title`, `__lede`, `__body` | Title left, close top right (`dh-btn--quiet dh-btn--icon`), one lede. 520px wide. |
| Stats | `dh-stats`, `dh-stat` (`--key`, `--good`, `--warn`), `__label`, `__value`, `__note` | |
| Tables | `dh-table` (`--compact`, `--cards`, `--stack`), `dh-table-wrap`, `dh-r`, `dh-sub`; row cards: `dh-rc-title`, `dh-rc-end`, `dh-rc-line`, `dh-rc-actions`, `dh-rc-hide` | Every `td` gets `data-label`. `--cards` turns list tables into Radar-style row cards under 640px: the title's link covers the card, controls in any cell stay clickable above it, and `dh-rc-actions` cells (buttons, checkboxes) move to the card's last line without a label. `--stack` turns record tables (keys, checks) into label/value blocks. Captions stay for screen readers. |
| Key/value | `dh-kv` (`--ruled`, `--grid`) | `<dt>`/`<dd>` pairs, optionally wrapped in `<div>`. Long values wrap; they never overflow. |
| Badges | `dh-badge` (`--good`, `--warn`, `--bad`, `--info`, `--outline`, `--dot`), `dh-status` (`--good`, `--warn`, `--bad`, `--info`), `dh-proof` (`--checking`, `--ok`, `--reported`, `--unverified`, `--failed`) | Never clickable, except the proof badge, which opens what was checked. `dh-pill` = `dh-badge`. |
| Sources | `dh-src` (`--ok`, `--warn`), `dh-ref`, `dh-sources` (on an `ol`, numbered; on a `p`, one plain line) | Never inside a sentence. Tag after a label or a complete value; marker after the full stop; the lines close the section or card. See below. |
| Notices | `dh-notice` (`--info`, `--success`, `--warn`, `--error`), `__title`, `__actions` | Page context. Use `role="status"`, or `role="alert"` for errors. |
| States | `dh-empty` (`--inline`), `__title`; `dh-loading` (`--block`), `__note`, `dh-spin`, `dh-skel` (`--text`, `--title`, `--num`, `--row`, `--block`), `dh-skel-group`, `dh-progress`; `dh-error` (`--stale`), `__title` | Empty says what would be here and offers one next step. Loading names what is loading. Error says what failed, what is safe and how to retry, with the raw detail under Details. `--stale` keeps the last good data on screen and says how old it is. |
| Stepper | `dh-steps` on an `<ol>`, `aria-current="step"` on the current `<li>`, links on done steps | Numbers come from the list. Write "Address", not "1 Address". Steps before the current one show as done (or set `data-state="done"`). An earlier step the visitor hasn't done gets `data-state="todo"` (a dashed grey ring), so opening a later step never claims progress. |
| Misc | `dh-code`, `dh-toolbar` + `dh-grow`, `dh-pager`, `dh-elsewhere`, `dh-sr`, `dh-num`, `dh-mono`, `dh-unit`, `dh-link`, `dh-link--go` | |

### Sources beside figures

A source or check label never sits inside a sentence: "119% of what it can pay, by the proposals due at this payout
[Platform records]" can't be quoted. Write the sentence plainly and put the source in one of three places
(`../DESIGN.md` §6):

```html
<!-- 1. A tag after a label (or a table header, or a complete value). Write a space before it. -->
<div class="dh-stat">
  <span class="dh-stat__label">Asked for <span class="dh-src">Platform records</span></span>
  <span class="dh-stat__value">8,125 <small>DASH</small></span>
  <span class="dh-stat__note">119% of what it can pay</span>
</div>

<!-- 2. A marker after the sentence's full stop, and the numbered lines closing the section or card. -->
<p>Proposals are grouped by where they stand, largest first.<sup class="dh-ref"><a href="#tr-src-1" aria-label="Source 1">1</a></sup></p>
<ol class="dh-sources" role="list" aria-label="Sources">
  <li id="tr-src-1">Standings: vote tallies reported by the governance data service at block 2,384,512. Each proposal's page recounts its own.</li>
</ol>

<!-- 3. A block whose figures share a source says it once, with no markers. -->
<p class="dh-sources">Sources: proposals and amounts from Platform records; USD at Coinbase's price, 01:22 UTC.</p>
```

- `.dh-src` is dotted (reported). `.dh-src--ok` is solid green: worked out or checked in this browser ("Consensus
  limit"); say so to screen readers too, which hear no border: `<span class="dh-src dh-src--ok">Consensus
  limit<span class="dh-sr">, worked out in this browser</span></span>`. `.dh-src--warn` is dashed: stale or not checked
  ("Stale" on a price older than 10 minutes). A long tag wraps inside its tile. It is a label, like a badge, never a
  link: put the detail in a numbered line, or in the record's proof badge.
- Number the markers in reading order within the page and give each line an `id` unique on the page (`tr-src-1`).
  `aria-label="Source 1"` on the marker's link; `role="list" aria-label="Sources"` on the list (Safari drops a styled
  list's role otherwise). A line may hold links and a `<time>`; they stay inline. A jump lands the line clear of a
  sticky bar and highlights it.
- "Verified" is still the proof badge's word, one per record, beside its title.
- A caveat that changes what the reader should do is a sentence of its own; one that only qualifies a source goes in
  the source's line.

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

Full recipes: `../DESIGN.md` §6, "Mapping recipes". Per-site changes: `../ADOPTION-r5.md` (then `-r4`, `-r3`).

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

Start is a Testnet itinerary inside Bridge: address → funding → identity → username.
The Start door always opens Testnet in Bridge.
`href()` and declarative links to Bridge/Faucet default to Testnet. Explicit
`{ network: "mainnet" }` / `data-network="mainnet"` still support real-funds flows.
A Bridge URL can use `?mode=create&journey=start&network=testnet` to begin at address creation.
