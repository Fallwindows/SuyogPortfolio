// Concept map page: every concept grouped by unit and lesson, with your learn-mode record.
(function () {
  let learn = {};
  try { learn = JSON.parse(localStorage.getItem(PR.key('learn')) || '{}'); } catch (e) {}
  const recs = learn.concepts || {};
  const el = document.getElementById('cmap');
  const filter = document.getElementById('cmFilter'), search = document.getElementById('cmSearch');
  document.getElementById('cmLead').insertAdjacentHTML('afterbegin', `<b>${CS_CONCEPT.all.length} concepts.</b> `);

  function keep(c) {
    const r = recs[c.id];
    const q = search.value.trim().toLowerCase();
    if (q && !(c.name + ' ' + c.rule).toLowerCase().includes(q)) return false;
    switch (filter.value) {
      case 'weak': return r && r.miss > 0;
      case 'untested': return !r || !r.n;
      case 'niche': return c.niche >= 0.6;
      default: return true;
    }
  }
  function render() {
    let html = '';
    Object.keys(PR.UNITS).map(Number).sort((a, b) => PR.unitRank(a) - PR.unitRank(b)).forEach((u) => {
      const lessons = CS_LESSONS.filter((l) => l.unit === u);
      let body = '';
      lessons.forEach((l) => {
        const cs = CS_CONCEPT.all.filter((c) => c.lesson === l.id && keep(c));
        if (!cs.length) return;
        body += `<div class="cmap-lesson"><span class="muted">${PR.esc(l.topic)}</span> · <a href="${PR.path}/learn.html#${l.id}">${PR.esc(l.title)}</a></div>`;
        body += cs.map((c) => {
          const r = recs[c.id];
          const mx = r && r.n ? `<span class="${r.miss / r.n >= 0.5 ? 'bad' : r.miss ? '' : 'good'}">${r.n - r.miss}/${r.n}</span>` : '<span class="muted">—</span>';
          return `<div class="cmap-row"><span class="nm">${PR.esc(c.name)}${c.niche >= 0.6 ? '<span class="niche">NICHE</span>' : ''}</span><span class="rl">${PR.esc(c.rule)}</span><span class="mx">${mx}</span></div>`;
        }).join('');
      });
      if (body) html += `<section class="cmap-unit card"><h2 style="font-size:20px">${PR.esc(PR.unitName(u))}</h2>${body}</section>`;
    });
    el.innerHTML = html || '<p class="muted" style="margin-top:20px">Nothing matches.</p>';
  }
  filter.onchange = render;
  search.oninput = render;
  render();
})();
