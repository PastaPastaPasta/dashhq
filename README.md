# dashhq.org

The family front door and a cyanotype map of the Dash ecosystem. Static HTML, CSS and JavaScript; no build dependencies or backend.

`index.html` contains the map, six starting points and expandable project groups. `/directory/` holds the full resource directory. `hub.css` maps the site's drafting surface onto the family tokens. `hub.js` handles the finder and numbered routes. The pinned shell, Archivo font and mark live in `dashhq/`; see `SHELL.md` for the version and checksum. The shell resolves declarative family destinations; SVG map links use `dashhq.href()` explicitly.

The finder returns destination links from the project cards and directory without hiding the catalogue. Map routes highlight and number their stops. The finder is hidden without JavaScript; the full directory and production destination links remain usable.

A plate needs an `<article class="card spanN" id="…">`, a matching `<a class="hnode">` in the map, and a matching `<a class="chip">` in the phone list. Keep the three ID lists identical. At desktop width each grid row spans six columns: two `span3` cards or three `span2` cards. Route `data-route` values are ordered plate IDs.

Counts come from the page. The family-route check is explicitly labelled as a local lab check; the full directory link-check date remains historical. Only update a check date after checking that scope.

The page uses a strict first-party CSP. `pulse.js` reads Radar’s public Mainnet summary with a bounded timeout, shows the source observation times, and keeps a useful retry state if reads fail. No other data service is contacted. All fonts and assets are local. `og.png` remains the previous map preview and can be regenerated separately when publishing.

Local checks: `node --check hub.js`, `node --check pulse.js`, and the static copy build. There is no package-managed test, lint or typecheck suite. In the family lab, use `../../lab/build.sh hub` and the guarded screenshot runner from the lab root.
