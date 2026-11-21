(() => {
  const summary = document.getElementById('pulse-summary');
  const age = document.getElementById('pulse-age');
  const retry = document.getElementById('pulse-retry');
  let refreshing = false;
  let last;
  const ago = timestamp => {
    const minutes = Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 60));
    return minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} h ago`;
  };
  function metric(value, label, shortLabel, title, share, goodFrom) {
    const span = document.createElement('span');
    span.title = title;
    const strong = document.createElement('strong');
    strong.textContent = value;
    if (Number.isFinite(share)) strong.className = share >= goodFrom ? 'good' : share >= goodFrom - 15 ? 'warn' : 'bad';
    const full = document.createElement('span');
    full.className = 'long-label';
    full.textContent = label;
    const short = document.createElement('span');
    short.className = 'short-label';
    short.textContent = shortLabel;
    span.append(strong, full, short);
    return span;
  }
  function render() {
    const { crawl, platform } = last;
    const old = Date.now() / 1000 - crawl.finished > 3600;
    const stalePlatform = platform?.checked && Date.now() / 1000 - platform.updated > 2700;
    const label = document.createElement('span');
    label.textContent = 'Mainnet now';
    summary.replaceChildren(label,
      metric(crawl.mn_total ? `${(crawl.mn_reachable / crawl.mn_total * 100).toFixed(1)}%` : 'Not checked', ' of masternodes answered', ' Core answered', `${crawl.mn_reachable} of ${crawl.mn_total} enabled masternodes · P2P reachability`, crawl.mn_total ? crawl.mn_reachable / crawl.mn_total * 100 : NaN, 97),
      metric(platform?.checked ? `${(platform.healthy / platform.checked * 100).toFixed(1)}%` : 'Not checked', ' of evonodes passed Platform checks', ' Platform passed', platform?.checked ? `${platform.healthy} of ${platform.checked} checked evonodes · Tenderdash and DAPI · ${new Date(platform.updated * 1000).toISOString()}` : 'No Platform observations published', platform?.checked ? platform.healthy / platform.checked * 100 : NaN, 95));
    if (stalePlatform) note('Platform check overdue');
    age.textContent = `${ago(crawl.finished)}${old ? ' (overdue)' : ''}`;
    age.dateTime = new Date(crawl.finished * 1000).toISOString();
    age.title = `Core: ${age.dateTime}${platform?.updated ? '; Platform: ' + new Date(platform.updated * 1000).toISOString() : ''}`;
  }
  function note(text) {
    const span = document.createElement('span');
    span.textContent = text;
    summary.append(span);
  }
  async function load() {
    if (refreshing) return;
    refreshing = true;
    retry.disabled = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('https://radar.dashhq.org/api/v1/mainnet/summary', { credentials: 'omit', cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      const c = data.crawl, p = data.platform;
      if (!c || ![c.mn_total, c.mn_reachable, c.finished].every(Number.isFinite) || c.mn_total < 0 || c.mn_reachable < 0 || c.mn_reachable > c.mn_total || c.finished <= 0 || c.finished > Date.now() / 1000 + 60 ||
        (p && (![p.healthy, p.checked].every(Number.isFinite) || p.checked < 0 || p.healthy < 0 || p.healthy > p.checked || (p.checked > 0 && (!Number.isFinite(p.updated) || p.updated <= 0 || p.updated > Date.now() / 1000 + 60))))) throw new Error('invalid');
      last = data;
      render();
      retry.hidden = true;
    } catch {
      if (last) { render(); note('Refresh failed; last observation shown'); }
      else {
        summary.textContent = 'Mainnet observations unavailable. Open Radar for diagnostics.';
        age.textContent = 'unavailable';
      }
      retry.hidden = false;
    } finally { clearTimeout(timer); refreshing = false; retry.disabled = false; }
  }
  retry.addEventListener('click', load);
  load();
  setInterval(load, 5 * 60 * 1000);
})();
