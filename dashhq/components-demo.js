// components.html behaviour only: ?accent=forge|pollr|yappr previews an app's accent page-wide; the segmented
// controls toggle. The top bar navigates for real, like a static site.
const accent = new URLSearchParams(location.search).get('accent');
if (['forge', 'pollr', 'yappr'].includes(accent)) document.documentElement.dataset.accent = accent;

for (const seg of document.querySelectorAll('.dh-seg')) {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    for (const x of seg.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
  });
}
for (const form of document.querySelectorAll('form')) form.addEventListener('submit', (e) => e.preventDefault());
