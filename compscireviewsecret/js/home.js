// Computer Science Review home: lessons opened, duel accuracy by topic, and learn-mode summary.
(function () {
  let seen = [], stats = {}, learn = {};
  try { seen = JSON.parse(localStorage.getItem(PR.key('seen')) || '[]'); } catch (e) {}
  try { stats = JSON.parse(localStorage.getItem(PR.key('stats')) || '{}'); } catch (e) {}
  try { learn = JSON.parse(localStorage.getItem(PR.key('learn')) || '{}'); } catch (e) {}
  if (seen.length) document.getElementById('learnCta').textContent = `${seen.length} of ${CS_LESSONS.length} lessons opened · keep going →`;
  document.getElementById('cmCount').textContent = `All ${CS_CONCEPT.all.length} core concepts from Units 1 and 2 in one list, with how well you know each one.`;
  const tried = Object.values(learn.concepts || {}).filter((c) => c.n);
  if (tried.length) {
    const weak = tried.filter((c) => c.miss / c.n >= 0.5).length;
    document.getElementById('lmCta').textContent = `${tried.length} concepts tested · ${weak} still weak →`;
  }
  const el = document.getElementById('stats');
  const rows = Object.entries(stats).sort((a, b) => PR.unitRank(a[1].unit) - PR.unitRank(b[1].unit) || b[1].tries - a[1].tries);
  if (!rows.length) { el.innerHTML = '<p class="muted">Play a 1v1, solo practice, or learn mode round and your accuracy by topic shows up here.</p>'; return; }
  el.innerHTML = rows.map(([topic, t]) => {
    const pct = Math.round((100 * t.right) / Math.max(1, t.tries));
    return `<div class="row"><span><span class="pill u${t.unit}">U${PR.unitInfo(t.unit).n}</span> ${PR.esc(topic)}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="muted mono">${t.right}/${t.tries}</span></div>`;
  }).join('');
})();
