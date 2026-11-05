// The one part a retired site still writes: mapping its old routes onto the new home. EvoVote's "#/c/german" was a
// contest; Governance keeps contests at /names/german. Everything else (timing, Stay here, the network, the query,
// the header) is <dashhq-moved>'s.
const moved = document.querySelector('dashhq-moved');
function map() {
  const m = /^#\/?(?:c|names)\/([^/?#]+)/.exec(location.hash);
  let label = '';
  try { label = m ? decodeURIComponent(m[1]) : ''; } catch { /* a malformed bookmark opens the list */ }
  moved.setAttribute('path', label ? `/names/${encodeURIComponent(label)}?from=vote` : '/names?from=vote');
  moved.setAttribute('label', label ? `Open ${label}.dash in Governance` : 'Open name contests');
}
map();
addEventListener('hashchange', map);
