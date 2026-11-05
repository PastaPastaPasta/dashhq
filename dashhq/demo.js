// Demo-only behaviour. Shows how an SPA takes over the bar's network switch instead of reloading.
document.addEventListener('dashhq-network', (e) => {
  const bar = e.target.closest('dashhq-bar');
  if (!bar || !bar.closest('.bars')) return; // the top bar navigates for real, like a static site would
  e.preventDefault();
  bar.setAttribute('network', e.detail.network);
});

for (const seg of document.querySelectorAll('.dh-seg')) {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    for (const x of seg.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
  });
}
