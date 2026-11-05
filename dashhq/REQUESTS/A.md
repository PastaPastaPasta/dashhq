# A: declarative family links for static pages

Problem: Basics must retire with only the shell script, but its per-URL Explorer destination must use `dashhq.href()` in production and in the lab. Shell 1.0.1 has no declarative link adapter. Hub and Architecture also have static cross-links.

Proposal: have the shell resolve anchors with `data-family="explorer"` and `data-path="/dpns/search"` (optionally `data-network`) through `dashhq.href()`. Keep their production `href` as the no-JavaScript fallback.

Sites: Basics (required to meet the shell-only script goal), Hub, Architecture.

Local workaround: each repo has a seven-line `family-links.js` adapter outside the unchanged vendor directory. Basics therefore has this one extra first-party script until a shell release supports the attribute. No remote requests, redirects, or data reads are added.

The shell registry still maps Bridge to bridge.thepasta.org in production. This stream uses `dashhq.href('bridge')`; the lab correctly resolves it to bridge.dashhq.localhost with explicit `?network=`. Move the production registry host when that door is available; no local override was made.
