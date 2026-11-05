# dashhq.org

The family front door and a cyanotype map of the Dash ecosystem. Static HTML, CSS and JavaScript; no build dependencies or backend.

`index.html` contains the map, five family doors, project plates and directory. `hub.css` maps the site's drafting surface onto the family tokens. `hub.js` handles the finder and numbered routes. The pinned shell, Archivo font and mark live in `dashhq/`; see `SHELL.md` for the version and checksum. Family destinations use `dashhq.href()` through the small `family-links.js` adapter.

The finder filters plates and directory entries, highlights matching map nodes, removes unavailable links from the tab order, and keeps the skip link pointed at visible content. It is hidden without JavaScript; the full directory and production destination links remain usable.

A plate needs an `<article class="card spanN" id="…">`, a matching `<a class="hnode">` in the map, and a matching `<a class="chip">` in the phone list. Keep the three ID lists identical. At desktop width each grid row spans six columns: two `span3` cards or three `span2` cards. Route `data-route` values are ordered plate IDs.

Counts come from the page. The family-route check is explicitly labelled as a local lab check; the full directory link-check date remains historical. Only update a check date after checking that scope.

The page uses a strict first-party CSP and makes no data requests. All fonts and assets are local. `og.png` remains the previous map preview and can be regenerated separately when publishing.

Local checks: `node --check hub.js`, `node --check family-links.js`, and the static copy build. There is no package-managed test, lint or typecheck suite. In the family lab, use `../../lab/build.sh hub` and the guarded screenshot runner from the lab root.
