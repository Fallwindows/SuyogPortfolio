// Physics Review home: lessons opened and accuracy by topic, from this browser's localStorage.
(function () {
  let seen = [], stats = {};
  try { seen = JSON.parse(localStorage.getItem('pr-seen') || '[]'); } catch (e) {}
  try { stats = JSON.parse(localStorage.getItem('pr-stats') || '{}'); } catch (e) {}
  if (seen.length) document.getElementById('learnCta').textContent = `${seen.length} lessons opened · keep going →`;
  const el = document.getElementById('stats');
  const rows = Object.entries(stats).sort((a, b) => PR.unitRank(a[1].unit) - PR.unitRank(b[1].unit) || b[1].tries - a[1].tries);
  if (!rows.length) { el.innerHTML = '<p class="muted">Play a 1v1 or solo practice round and your accuracy by topic shows up here.</p>'; return; }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  el.innerHTML = rows.map(([topic, t]) => {
    const pct = Math.round((100 * t.right) / Math.max(1, t.tries));
    return `<div class="row"><span><span class="pill u${t.unit}">P${PR.unitInfo(t.unit).course.slice(-1)} U${PR.unitInfo(t.unit).n}</span> ${esc(topic)}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="muted mono">${t.right}/${t.tries}</span></div>`;
  }).join('');
})();
