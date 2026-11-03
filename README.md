# dashhq.org

The landing page at [dashhq.org](https://dashhq.org): a map of the Dash ecosystem.

One static file, `index.html`, plus self-hosted Barlow fonts (SIL Open Font License) in `fonts/`. No build step.
GitHub Pages serves the `main` branch root.

## How it is put together

- **The sheet** at the top is one SVG: every project on the layer it works with. Phones get the same projects
  as chips instead, because a 1040 px drawing does not fit.
- **Routes** number the stops of a journey on that map. Each `<li class="route">` carries its stops in
  `data-route`, as a space-separated list of card ids.
- **Plates** are the cards below, one per project, each with a hand-drawn SVG mark.
- **The directory** is the plain list at the end, for everything that does not need a drawing.
- **The finder** (the `Find` field) filters plates and directory entries, and lights up the matching projects
  on the map. It is progressive enhancement: without JavaScript the field is hidden and the whole page is there.

Counts in the title block are computed from the page at load, so they cannot drift. The `Links checked` date
is not: bump it when you have actually re-checked the links.

## Adding a project

A plate needs a `<article class="card spanN" id="...">`, a matching `<a class="hnode">` in the map, and a matching
`<a class="chip">` in the phone list. The three id lists must stay identical; `.span3` and `.span2` have to add up
to 6 per row.

The map link's accessible name is its `aria-label`, written in the order the words are drawn
(`author, name`). The `<text>` elements end with a space so the drawn words do not run together.

`og.png` is the link preview: a 1200x630 render of the map plus a title block, made from the page's own SVG and
fonts. Re-render it when the map changes; nothing on the page reads it, only the `og:image` tag does.

Something missing, dead or wrong? Open an issue with the link.
