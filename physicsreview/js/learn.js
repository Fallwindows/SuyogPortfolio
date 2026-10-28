// Lesson shell: sidebar, hash routing, prev/next, cleanup of running sims.
(function () {
  const UNIT_NAMES = {
    1: 'Unit 1 · Electrostatics',
    2: 'Unit 2 · Circuits',
  };
  const lessons = window.LESSONS.slice().sort((a, b) => a.unit - b.unit || a.order - b.order);
  const side = document.getElementById('sidebar');
  const main = document.getElementById('lesson');
  let cleanup = null;

  function seen() {
    try { return JSON.parse(localStorage.getItem('pr-seen') || '[]'); } catch (e) { return []; }
  }
  function markSeen(id) {
    try {
      const s = new Set(seen()); s.add(id);
      localStorage.setItem('pr-seen', JSON.stringify([...s]));
    } catch (e) {}
  }

  function buildSidebar(activeId) {
    const done = new Set(seen());
    let html = '';
    let unit = null;
    let n = 0;
    lessons.forEach((l) => {
      if (l.unit !== unit) { unit = l.unit; n = 0; html += `<h3>${UNIT_NAMES[unit] || 'Unit ' + unit}</h3>`; }
      n++;
      const cls = [l.id === activeId ? 'active' : '', done.has(l.id) ? 'done' : ''].join(' ');
      html += `<a href="#${l.id}" class="${cls}"><span class="n">${l.unit}.${n}</span><span>${PR.esc(l.title)}</span></a>`;
    });
    side.innerHTML = html;
  }

  function show() {
    const id = location.hash.slice(1);
    const idx = Math.max(0, lessons.findIndex((l) => l.id === id));
    const l = lessons[idx];
    if (!l) { main.innerHTML = '<p class="muted">No lessons loaded.</p>'; return; }
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) {} }
    cleanup = null;
    main.innerHTML = '';
    const head = document.createElement('div');
    head.innerHTML = `<div class="kicker">${UNIT_NAMES[l.unit]}</div><h1>${l.title}</h1>`;
    const body = document.createElement('div');
    main.append(head, body);
    try { cleanup = l.render(body); } catch (e) { body.innerHTML = `<p class="feedback bad">This lesson failed to load: ${PR.esc(e.message)}</p>`; console.error(e); }
    const prev = lessons[idx - 1], next = lessons[idx + 1];
    const nav = document.createElement('div');
    nav.className = 'lesson-nav';
    nav.innerHTML =
      (prev ? `<a href="#${prev.id}"><small>← Previous</small>${prev.title}</a>` : '<span></span>') +
      (next ? `<a href="#${next.id}" style="text-align:right"><small>Next →</small>${next.title}</a>` : '<span></span>');
    main.append(nav);
    PR.math(main);
    PR.wireChecks(main);
    markSeen(l.id);
    buildSidebar(l.id);
    side.classList.remove('open');
    window.scrollTo(0, 0);
  }

  document.getElementById('sideToggle').addEventListener('click', () => side.classList.toggle('open'));
  window.addEventListener('hashchange', show);
  show();
})();
