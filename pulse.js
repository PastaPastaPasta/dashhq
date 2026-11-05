(() => {
  const age = document.getElementById('pulse-age');
  const retry = document.getElementById('pulse-retry');
  let refreshing = false;
  let last;
  const fmt = value => value.toLocaleString('en-US');
  const date = timestamp => new Date(timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
  const ago = timestamp => { const minutes = Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 60)); return minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} h ago`; };
  function render() {
    if (!last) return;
    const { crawl, platform } = last;
    const old = Date.now() / 1000 - crawl.finished > 3600;
    document.getElementById('pulse-core').textContent = crawl.mn_total ? `${(crawl.mn_reachable / crawl.mn_total * 100).toFixed(1)}% answered` : 'Not checked';
    document.getElementById('pulse-core-note').textContent = `${fmt(crawl.mn_reachable)} of ${fmt(crawl.mn_total)} enabled masternodes`;
    document.getElementById('pulse-platform').textContent = platform?.checked ? `${Date.now() / 1000 - platform.updated > 2700 ? "Check overdue · " : ""}${(platform.healthy / platform.checked * 100).toFixed(1)}% passed` : 'Not checked';
    document.getElementById('pulse-platform-note').textContent = platform?.checked ? `${fmt(platform.healthy)} of ${fmt(platform.checked)} checked evonodes · ${ago(platform.updated)}` : 'No Platform observations published';
    document.getElementById('pulse-platform-note').title = platform?.updated ? `Tenderdash P2P + DAPI · ${date(platform.updated)}` : '';
    age.textContent = `Radar observations · ${old ? 'Crawl is over an hour old · ' : ''}Core ${date(crawl.finished)}. Open Radar for diagnostics.`;
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
        (p?.checked && (![p.healthy, p.checked, p.updated].every(Number.isFinite) || p.healthy < 0 || p.healthy > p.checked || p.updated <= 0 || p.updated > Date.now() / 1000 + 60))) throw new Error('invalid');
      last = data;
      render();
      retry.hidden = true;
    } catch {
      if (last) { render(); age.textContent += ' Refresh failed; showing the last observation.'; }
      else {
        for (const id of ['pulse-core', 'pulse-platform']) document.getElementById(id).textContent = 'Status unavailable';
        age.textContent = 'Radar could not be reached. You can still open its diagnostics.';
      }
      retry.hidden = false;
    } finally { clearTimeout(timer); refreshing = false; retry.disabled = false; }
  }
  retry.addEventListener('click', load);
  load();
  setInterval(load, 5 * 60 * 1000);
})();
