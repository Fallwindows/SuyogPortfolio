// Solo learn mode: an opponent whose only goal is to make your score as low as possible.
// It keeps a model of how likely you are to miss each concept (from CS_CONCEPTS), always aims at
// the one you're most likely to get wrong (favoring niche rules), asks every problem as several
// smaller parts, and breaks your answer down part by part so you see exactly which step slipped.
// Missed concepts come back a few questions later in a new form until you beat them.
// Model + history live in localStorage (PR.key('learn')).
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const screenEl = $('learnScreen');
  if (!screenEl) return;
  const C = window.CS_CONCEPT.byId;
  const lessonTitle = (id) => { const l = CS_LESSONS.find((x) => x.id === id); return l ? l.title : id; };

  // ---------- learner model ----------
  function load() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(PR.key('learn')) || '{}'); } catch (e) {}
    return { concepts: s.concepts || {}, total: s.total || { parts: 0, right: 0 } };
  }
  let M = load();
  function save() { try { localStorage.setItem(PR.key('learn'), JSON.stringify(M)); } catch (e) {} }
  const rec = (id) => (M.concepts[id] = M.concepts[id] || { n: 0, miss: 0, streak: 0, last: 0 });
  // Probability you miss this concept: your record, pulled toward a prior that is higher for niche rules.
  function missProb(id) {
    const c = C[id], r = M.concepts[id] || { n: 0, miss: 0 };
    const prior = 0.3 + 0.55 * (c ? c.niche : 0.5);
    return (r.miss + 2 * prior) / (r.n + 2);
  }

  // ---------- session ----------
  let S = null;
  function start(units) {
    const gens = PRProblems.generators.filter((g) => units.includes(g.unit));
    const pool = new Set();
    gens.forEach((g) => g.concepts.forEach((id) => { if (C[id]) pool.add(id); }));
    S = {
      units, gens, pool: [...pool],
      q: 0, parts: 0, right: 0,
      recent: [], // last targets, so it doesn't hammer one concept back to back
      revenge: [], // [{ id, due }] missed concepts scheduled to come back
      cur: null,
      seed: (Math.random() * 2 ** 31) >>> 0,
    };
    screen(true);
    next();
  }

  // Pick the concept you're most likely to miss right now.
  function pickTarget() {
    const due = S.revenge.find((r) => r.due <= S.q && !S.recent.slice(-1).includes(r.id));
    if (due) { S.revenge = S.revenge.filter((r) => r !== due); return { id: due.id, why: 'revenge' }; }
    let best = null, bestScore = -1;
    for (const id of S.pool) {
      if (S.recent.slice(-3).includes(id)) continue;
      const r = M.concepts[id];
      const unseen = !r || !r.n;
      const score = missProb(id) * (0.7 + 0.3 * C[id].niche) + (unseen ? 0.12 : 0) + Math.random() * 0.06;
      if (score > bestScore) { bestScore = score; best = id; }
    }
    return { id: best, why: M.concepts[best] && M.concepts[best].n ? 'weak' : 'untested' };
  }

  function next() {
    const t = pickTarget();
    if (!t.id) { screenEl.innerHTML = '<div class="card"><p>No problems available for these units yet.</p></div>'; return; }
    const cands = S.gens.filter((g) => g.concepts.includes(t.id));
    const lastGen = S.cur && S.cur.gen;
    const fresh = cands.length > 1 ? cands.filter((x) => x !== lastGen) : cands; // vary the problem style
    const g = fresh[Math.floor(Math.random() * fresh.length)];
    const hard = missProb(t.id) > 0.45 || C[t.id].niche >= 0.6;
    let p;
    try { p = PRProblems.makeOne(g, S.seed + S.q * 7919, { target: t.id, hard }); }
    catch (e) { console.error(e); S.recent.push(t.id); S.q++; return next(); }
    // Parts are the question broken into steps; a problem without them is asked as one part.
    const parts = (p.parts && p.parts.length ? p.parts : [Object.assign({ q: 'Your answer', concept: (p.concepts || [])[0] || t.id }, p)])
      .map((x) => Object.assign({}, x, { concept: C[x.concept] ? x.concept : t.id }));
    S.cur = { gen: g, p, parts, target: t, answered: false };
    S.recent.push(t.id);
    render();
  }

  // ---------- rendering ----------
  function screen(on) {
    ['lobbyScreen', 'waitScreen', 'gameScreen'].forEach((s) => $(s).classList.toggle('hidden', on || s !== 'lobbyScreen'));
    screenEl.classList.toggle('hidden', !on);
    window.scrollTo(0, 0);
  }

  function header() {
    const pct = S.parts ? Math.round((100 * S.right) / S.parts) : null;
    return `<div class="card lm-head">
      <div><div class="muted" style="font-size:13px">Your score this session</div>
        <div class="lm-score">${S.parts ? `${S.right} / ${S.parts}` : '—'}${pct !== null ? ` <span class="muted" style="font-size:16px;font-weight:500">${pct}%</span>` : ''}</div></div>
      <div style="flex:1;min-width:200px" class="muted">Learn mode wins when this number drops. It aims at whatever you're most likely to miss, so a low score means it found your gaps.</div>
      <button class="btn small" id="lmEnd">End session</button>
    </div>`;
  }

  function targetLine() {
    const t = S.cur.target, c = C[t.id], r = M.concepts[t.id];
    const why = t.why === 'revenge' ? `you missed this recently, so it's back in a new form`
      : t.why === 'untested' ? (c.niche >= 0.6 ? `a niche rule you haven't been tested on yet` : `you haven't been tested on this yet`)
        : `you've missed it ${r.miss} of ${r.n} time${r.n === 1 ? '' : 's'}`;
    return `<div class="lm-target muted">Aiming at <b>${PR.esc(c.name)}</b>${c.niche >= 0.6 ? '<span class="niche">NICHE</span>' : ''} · ${why}</div>`;
  }

  function partInput(part, k) {
    if (part.type === 'mc') {
      return `<div class="choices">${part.choices.map((ch, i) => `<button data-part="${k}" data-i="${i}">${String.fromCharCode(65 + i)}. ${ch}</button>`).join('')}</div>`;
    }
    const isText = part.type === 'text';
    return `<div class="answer-row" style="margin-top:4px"><input type="text" data-part="${k}" ${isText ? 'class="mono wide" spellcheck="false"' : 'inputmode="decimal"'} autocomplete="off" placeholder="${PR.esc(part.placeholder || (isText ? 'Type it exactly' : 'Number'))}"> ${part.units ? `<span class="muted">${PR.esc(part.units)}</span>` : ''}</div>`;
  }

  function render() {
    const { p, parts } = S.cur;
    screenEl.innerHTML = `${header()}
      <div class="card problem">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="pill">Question ${S.q + 1}</span>
          <span class="pill u${p.unit}">${PR.esc(PR.unitShort(p.unit))}</span>
          <span class="pill">${PR.esc(p.topic)}</span>
        </div>
        ${targetLine()}
        <div class="prompt">${p.prompt}</div>
        ${p.given ? `<div class="given">${p.given}</div>` : ''}
        <p class="muted" style="font-size:14px;margin-top:10px">Answered in ${parts.length} part${parts.length === 1 ? '' : 's'}. Each part is graded on its own.</p>
        <div id="lmParts">${parts.map((part, k) => `<div class="lm-part" data-k="${k}"><div class="lm-q">${parts.length > 1 ? `Part ${k + 1}. ` : ''}${part.q}</div>${partInput(part, k)}<div class="lm-why hidden"></div></div>`).join('')}</div>
        <div class="answer-row"><button class="btn primary" id="lmSubmit">Submit all parts</button><button class="btn small" id="lmSkip">I don't know · show me</button></div>
        <div id="lmResult"></div>
      </div>
      ${weakPanel()}`;
    // mc selection (pick one per part; graded on submit)
    screenEl.querySelectorAll('.choices button[data-part]').forEach((b) => {
      b.onclick = () => {
        if (S.cur.answered) return;
        screenEl.querySelectorAll(`.choices button[data-part="${b.dataset.part}"]`).forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
      };
    });
    screenEl.querySelectorAll('input[data-part]').forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') grade(false); }));
    $('lmSubmit').onclick = () => grade(false);
    $('lmSkip').onclick = () => grade(true);
    $('lmEnd').onclick = end;
    const first = screenEl.querySelector('input[data-part]');
    if (first) setTimeout(() => first.focus(), 50);
  }

  function responseOf(k) {
    const sel = screenEl.querySelector(`.choices button.sel[data-part="${k}"]`);
    if (sel) return { value: Number(sel.dataset.i), shown: sel.innerHTML.replace(/^[A-E]\.\s*/, '') };
    const inp = screenEl.querySelector(`input[data-part="${k}"]`);
    return inp ? { value: inp.value, shown: PR.esc(inp.value) } : { value: null, shown: '' };
  }
  const answerShown = (part) => (part.type === 'mc' ? part.choices[part.correct] : PR.esc(String(part.type === 'numeric' ? PR.sig(part.answer, 6) : part.answer)));

  function grade(gaveUp) {
    if (S.cur.answered) return;
    const { parts, p } = S.cur;
    // Don't grade a half-filled answer by accident.
    if (!gaveUp) {
      const blank = parts.findIndex((part, k) => { const r = responseOf(k); return r.value === null || r.value === ''; });
      if (blank >= 0) { $('lmResult').innerHTML = `<div class="feedback info">Answer every part first (part ${blank + 1} is empty), or press "I don't know".</div>`; return; }
    }
    S.cur.answered = true;
    const rows = [];
    parts.forEach((part, k) => {
      const r = gaveUp ? { value: null, shown: '<span class="muted">skipped</span>' } : responseOf(k);
      const ok = !gaveUp && PRProblems.check(part, r.value);
      // a wrong multiple-choice pick may reveal a specific misconception
      const slip = !ok && part.type === 'mc' && part.misconceptions && r.value !== null ? part.misconceptions[r.value] : null;
      rows.push({ part, k, ok, shown: r.shown, slip: slip && C[slip] ? slip : null });
      const box = screenEl.querySelector(`.lm-part[data-k="${k}"]`);
      box.classList.add(ok ? 'right' : 'wrong');
      box.querySelectorAll('input, button').forEach((x) => { x.disabled = true; });
      if (part.type === 'mc') { const bs = box.querySelectorAll('.choices button'); if (bs[part.correct]) bs[part.correct].classList.add('right'); if (!ok && r.value !== null && bs[r.value]) bs[r.value].classList.add('wrong'); }
      const why = box.querySelector('.lm-why');
      why.classList.remove('hidden');
      why.innerHTML = `${ok ? '<b class="good">✓ Right.</b>' : `<b class="bad">✗</b> Answer: <b>${answerShown(part)}</b>.`} ${part.why || ''}`;
    });
    // update the model: every part counts for its concept; a revealing wrong pick also counts against that misconception
    const now = Date.now();
    rows.forEach(({ part, ok, slip }) => {
      const r = rec(part.concept);
      r.n++; r.last = now;
      if (ok) r.streak++; else { r.miss++; r.streak = 0; }
      if (slip && slip !== part.concept) { const s2 = rec(slip); s2.n++; s2.miss++; s2.streak = 0; s2.last = now; }
    });
    const nRight = rows.filter((x) => x.ok).length;
    S.parts += rows.length; S.right += nRight;
    M.total.parts += rows.length; M.total.right += nRight;
    // missed concepts come back 2–4 questions later
    [...new Set(rows.filter((x) => !x.ok).map((x) => x.part.concept))].forEach((id) => {
      if (!S.revenge.some((r) => r.id === id)) S.revenge.push({ id, due: S.q + 2 + Math.floor(Math.random() * 3) });
    });
    save();
    try {
      const st = JSON.parse(localStorage.getItem(PR.key('stats')) || '{}');
      const t = (st[p.topic] = st[p.topic] || { unit: p.unit, tries: 0, right: 0 });
      t.tries++; if (nRight === rows.length) t.right++;
      localStorage.setItem(PR.key('stats'), JSON.stringify(st));
    } catch (e) {}

    $('lmResult').innerHTML = breakdown(rows) + explanation(p);
    screenEl.querySelector('.lm-head').outerHTML = header();
    $('lmEnd').onclick = end;
    const act = screenEl.querySelector('#lmSubmit').parentElement;
    act.innerHTML = '<button class="btn primary" id="lmNext">Next question →</button>';
    $('lmNext').onclick = () => { S.q++; next(); };
    $('lmNext').focus();
    const wp = screenEl.querySelector('#lmWeak');
    if (wp) wp.outerHTML = weakPanel();
  }

  // "Your answer, broken down": one row per part, with the concept it tested.
  function breakdown(rows) {
    const missed = rows.filter((r) => !r.ok);
    const head = !missed.length ? `<div class="feedback good">Every part right. Learn mode will dig for something harder.</div>`
      : `<div class="feedback bad">${missed.length} of ${rows.length} part${rows.length === 1 ? '' : 's'} slipped. ${missed.length === rows.length ? 'Start with the first one.' : 'Everything else held up.'}</div>`;
    return `${head}<div class="lm-break"><h3 style="font-size:16px">Your answer, broken down</h3><table>
      <tr><th>Part</th><th>You said</th><th>Correct</th><th>Concept tested</th></tr>
      ${rows.map(({ part, k, ok, shown, slip }) => {
        const c = C[part.concept];
        return `<tr><td>${k + 1}</td><td>${shown || '<span class="muted">—</span>'}</td><td>${ok ? '<span class="ok">✓</span>' : `<span class="no">✗</span> ${answerShown(part)}`}</td>
        <td><a href="${PR.path}/learn.html#${c.lesson}" target="_blank" rel="noopener">${PR.esc(c.name)}</a>${!ok ? `<div class="muted" style="font-size:13px">${PR.esc(c.rule)}</div>` : ''}
        ${slip ? `<div class="muted" style="font-size:13px">That pick is what you'd get from: <b>${PR.esc(C[slip].name)}</b></div>` : ''}</td></tr>`;
      }).join('')}</table></div>`;
  }
  function explanation(p) {
    return `<div class="explain"><h3 style="font-size:16px">Worked solution</h3>
      ${p.explainHTML ? `<div>${p.explainHTML}</div>` : ''}
      <ol>${(p.steps || []).map((s) => `<li>${s}</li>`).join('')}</ol>
      ${p.lesson ? `<p style="margin-top:12px"><a href="${PR.path}/learn.html#${p.lesson}" target="_blank" rel="noopener">Review the lesson: ${PR.esc(lessonTitle(p.lesson))} →</a></p>` : ''}</div>`;
  }

  // Your weakest concepts so far (all sessions).
  function weakPanel() {
    const rows = Object.entries(M.concepts).filter(([id, r]) => r.n && C[id] && (!S || S.units.includes(C[id].unit)))
      .map(([id, r]) => ({ id, r, p: r.miss / r.n })).filter((x) => x.r.miss).sort((a, b) => b.p - a.p || b.r.miss - a.r.miss).slice(0, 8);
    return `<div class="card" id="lmWeak" style="margin-top:16px"><h3 style="font-size:15px">Your weak spots <span class="muted" style="font-weight:400;font-size:13px">· what learn mode keeps aiming at</span></h3>
      ${rows.length ? `<div class="lm-weak">${rows.map(({ id, r, p }) => `<div class="row"><a href="${PR.path}/learn.html#${C[id].lesson}" target="_blank" rel="noopener">${PR.esc(C[id].name)}</a><span class="bar"><i style="width:${Math.round(p * 100)}%"></i></span><span class="muted mono">${r.miss}/${r.n}</span></div>`).join('')}</div>`
        : '<p class="muted" style="font-size:14px;margin-top:6px">Nothing missed yet. Give it a few questions.</p>'}
      <p style="margin-top:10px;font-size:13px"><a href="${PR.path}/concepts.html">See every concept →</a></p></div>`;
  }

  function end() {
    const pct = S.parts ? Math.round((100 * S.right) / S.parts) : 0;
    screenEl.innerHTML = `<div class="card" style="text-align:center;padding:32px">
      <h2 style="font-size:26px">Session over</h2>
      <p class="muted" style="margin-top:6px">You got <b>${S.right} of ${S.parts}</b> parts (${pct}%) across ${S.q + (S.cur && S.cur.answered ? 1 : 0)} questions.</p>
      <div class="answer-row" style="justify-content:center"><button class="btn primary" id="lmAgain">Keep going</button><button class="btn" id="lmBack">Back to lobbies</button></div>
    </div>${weakPanel()}`;
    $('lmAgain').onclick = () => start(S.units);
    $('lmBack').onclick = () => { location.hash = ''; screen(false); };
  }

  const unitsFromSelect = () => $('unitSelect').value.split(',').map(Number);
  $('learnBtn').onclick = () => { location.hash = 'learn'; start(unitsFromSelect()); };
  function fromHash() {
    const hidden = screenEl.classList.contains('hidden');
    if (location.hash === '#learn' && hidden) start(unitsFromSelect());
    else if (location.hash !== '#learn' && !hidden) screen(false); // the 1v1 link goes back to the lobby list
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
  window.PRLearnState = () => ({ S, M }); // for debugging from the console
})();
