# B — Radar: dismiss menus without click-through

Shell 1.0.1 `_onDoc` closes an open menu on an outside click, but lets the click activate the underlying control. `_onFocusOut` can close the menu even earlier, on pointer focus. Radar's previous QA guarantees that an outside tap only dismisses the menu, particularly over the interactive map and filter controls.

Proposal: consume an outside pointer dismissal (prevent pointer focus, cancel the ensuing click) while retaining Escape focus restoration and ordinary keyboard focus movement. Apply to the network menu, desktop door switcher and phone sheet.

Radar currently installs a small capture listener in `web/assets/common.js` before mounting the bar. It checks the expanded trigger's `aria-controls` panel through the open shadow root, prevents outside pointer focus, consumes the outside click and closes through the trigger. Vendored assets remain unchanged.
