// The one part a retired site still writes: mapping its old routes onto the new home. EvoVote's "#/c/german" was a
// contest; Governance publishes each contest at /names/<label> in DPNS's homograph-safe form (lower case, o to 0,
// i and l to 1), so "#/c/Alice" opens /names/a11ce. Everything else (the forward, the network, the query, the notice
// on arrival) is <dashhq-moved>'s.
{
  const moved = document.querySelector('dashhq-moved');
  const m = /^#\/?(?:c|names)\/([^/?#]+)/.exec(location.hash);
  let label = '';
  try { label = m ? decodeURIComponent(m[1]).trim().replace(/\.dash$/i, '').toLowerCase() : ''; } catch { /* a malformed bookmark opens the list */ }
  const key = label.replace(/o/g, '0').replace(/[il]/g, '1');
  if (/^[a-z01-]{3,19}$/.test(key)) {
    moved.setAttribute('path', `/names/${key}`);
    moved.setAttribute('label', `Open ${label}.dash in Governance`);
  }
}
