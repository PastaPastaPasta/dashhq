// The one part a retired site still writes: mapping its old routes onto the new home (EvoVote's, as it ships). A
// contest ("#/c/<label>", "/c/<label>" or "/names/<label>") opens /names/<label> in DPNS's homograph-safe form (lower
// case, o to 0, i and l to 1), the address Governance publishes for each contest, so "#/c/Alice" opens /names/a11ce;
// anything else opens the contest list. Everything else (the forward, the network, the query, the notice on arrival)
// is <dashhq-moved>'s.
(() => {
  const moved = document.querySelector('dashhq-moved');
  const route = location.hash.replace(/^#\/?/, '') || location.pathname.replace(/^\//, '');
  const match = /^(?:c|names)\/([^/?#]+)\/?$/.exec(route);
  let label = '';
  try { label = match ? decodeURIComponent(match[1]).trim().replace(/\.dash$/i, '').toLowerCase() : ''; } catch { /* the list */ }
  const key = label.replace(/o/g, '0').replace(/[il]/g, '1');
  if (!/^[a-z01-]{3,19}$/.test(key)) return;
  moved.setAttribute('path', '/names/' + key);
  moved.setAttribute('label', `Open ${label}.dash in Governance`);
})();
