# dashhq.org

The front door and directory for the Dash ecosystem. Static HTML, CSS and JavaScript; no build dependencies or backend.

`index.html` opens with the headline, the lede and the search, then the connected three-tier ecosystem map at the full content width, then four task cards. Every map node names its maintainer. The map uses five columns on desktop, with amber funding wires, and two columns on phones. Search results carry a layer tile and also highlight matching projects in place. A compact Mainnet observation line keeps its live source beside the figures. `/directory/` lists all 65 projects and resources as cards in tinted category bands, four across from 1400 px, with a description, maker, status and monospace host for each. Network tags come from the catalog; docs, diagrams and source libraries use descriptive status tags. Map links open their directory entries. `/identity/` explains sign-ins and key handling.

`hub.js` searches the inert `#directory-index` template without hiding the page. Keep that template in sync with `/directory/` when editing resources. Search handles public ProTx hashes, IPs, Platform IDs and bare or suffixed Dash names, with task-specific routes for treasury, fees, voting and polls. Store and guide links stay within their resource result. Escape clears the field. The directory reuses the same matching, with counts, a clear button, a query URL and category anchors in a single scrolling strip that also works without JavaScript. Without JavaScript the finder stays hidden; every visible destination remains a normal link.

`pulse.js` reads Radar’s public Mainnet summary with a bounded timeout and five-minute refresh. It shows observation age, stale-data warnings and retry on failure. Counts and source details remain available through the adjacent snapshot link and metric titles. No other data service is contacted. Fonts and assets are local, and CSP permits no inline scripts or styles.

The shell is pinned under `dashhq/`; see `SHELL.md`. The hub has a text wordmark and a local lowercase d favicon. Yappr and Forge are outbound links; Polls lives in Governance and fees in Explorer.

Local checks: `node --check hub.js`, `node --check pulse.js`, and `node scripts/qa-r7-hub.mjs` in the running family lab. There is no package-managed lint, typecheck or unit-test suite. Build with `lab/build.sh hub` from the lab root, then use the guarded screenshot runner.
