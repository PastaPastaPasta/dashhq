// components.html behaviour only: ?accent=forge|pollr|yappr previews an app's accent page-wide (the attribute an app
// sets on <html>); the accent cards are filled from one template; the segmented controls toggle. The top bar
// navigates for real, like a static site.
const accent = new URLSearchParams(location.search).get('accent');
if (['forge', 'pollr', 'yappr'].includes(accent)) document.documentElement.dataset.dhAccent = accent;

const NAMES = { core: 'Core (amber, selection in Dash blue)', forge: 'Forge (ember)', pollr: 'Pollr (teal)', yappr: 'Yappr (sky)' };
for (const [key, name] of Object.entries(NAMES)) {
  const card = document.querySelector(`.accent-${key}`);
  card.append(document.getElementById('accent-card').content.cloneNode(true));
  card.querySelector('.dh-label').textContent = name;
  if (key === 'core') card.querySelector('.accent-glyph').remove();
}

for (const seg of document.querySelectorAll('.dh-seg')) {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    for (const x of seg.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
  });
}
for (const form of document.querySelectorAll('form')) form.addEventListener('submit', (e) => e.preventDefault());
