// 1v1 duel: lobby browser, match flow, scoring, visual explanations.
// The host is authoritative for who won each round; both sides generate the same
// problems locally from the shared seed (PRProblems.generate).
// Waits for PRNet's signing key, since `me` is that key's fingerprint.
PRNet.ready.then(function () {
  const $ = (id) => document.getElementById(id);
  const me = PRNet.myId;

  // ---------- name ----------
  const nameInput = $('nameInput');
  try { nameInput.value = localStorage.getItem(PR.key('name')) || ''; } catch (e) {}
  function myName() {
    const n = nameInput.value.trim().slice(0, 20) || 'Player ' + me.slice(0, 3).toUpperCase();
    try { localStorage.setItem(PR.key('name'), nameInput.value.trim()); } catch (e) {}
    return n;
  }

  // ---------- screens ----------
  function screen(name) {
    ['lobbyScreen', 'waitScreen', 'gameScreen'].forEach((s) => $(s).classList.toggle('hidden', s !== name));
    window.scrollTo(0, 0);
  }

  // ---------- connection + lobby list ----------
  let online = false;
  PRNet.on('status', ({ state }) => {
    online = state === 'online';
    $('netDot').className = 'status-dot ' + (online ? 'on' : state === 'error' || state === 'offline' ? 'err' : '');
    $('netText').textContent = online ? 'Live' : state === 'connecting' ? 'Connecting…' : 'Offline — retrying';
    $('createBtn').disabled = !online;
    renderLobbies(PRNet.listLobbies());
  });
  PRNet.on('lobbies', renderLobbies);

  function unitLabel(units) {
    const us = units.slice().sort((a, b) => PR.unitRank(a) - PR.unitRank(b));
    const course = PR.unitInfo(us[0]).course;
    if (us.length === 1) return `${course} · ${PR.unitName(us[0])}`;
    const n = us.map((u) => PR.unitInfo(u).n);
    const consecutive = n.every((x, i) => !i || x === n[i - 1] + 1);
    return `${course} · Units ${consecutive && n.length > 2 ? `${n[0]}–${n[n.length - 1]}` : n.join(' + ')}`;
  }

  // Everything from the network is checked before use: names are plain short text, units are
  // known unit ids, rounds and seeds are bounded integers.
  const cleanName = (n) => (typeof n === 'string' ? n.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').trim().slice(0, 20) : '') || 'Opponent';
  const validUnits = (u) => Array.isArray(u) && u.length >= 1 && u.length <= 10 && u.every((x) => Number.isInteger(x) && PR.UNITS[x]);
  const validRounds = (r) => Number.isInteger(r) && r >= 1 && r <= 50;
  // A match snapshot: current problem index and who won each finished one.
  const validSnap = (s, rounds, ids) => s && typeof s === 'object' && Number.isInteger(s.r) && s.r >= 0 && s.r < rounds &&
    typeof s.over === 'boolean' && Array.isArray(s.results) && s.results.length <= rounds &&
    s.results.every((x) => x === null || (x && typeof x === 'object' && ids.includes(x.w) && typeof x.secs === 'number'));
  const validLobby = (l) => l && typeof l.hostName === 'string' && validUnits(l.units) && validRounds(l.rounds) && typeof l.created === 'number' &&
    (l.status !== 'playing' || (typeof l.guestId === 'string' && Number.isInteger(l.seed) && validSnap(l.snap, l.rounds, [l.hostId, l.guestId, null])));
  const AWAY_MS = 35000; // no lobby refresh / message for this long = that player is away

  function renderLobbies(list) {
    const el = $('lobbyList');
    if (!online) { el.innerHTML = '<div class="empty">Connecting to the lobby server…</div>'; return; }
    const now = Date.now();
    // Open lobbies (other people's, or my own if I reloaded while waiting), plus matches I'm a player in.
    const rows = list.filter(validLobby).filter((l) => {
      if (hosting && l.hostId === me) return false;
      if (G && !G.over && G.lobbyId === l.hostId) return false;
      return l.status === 'open' || l.hostId === me || l.guestId === me;
    }).sort((a, b) => (b.status === 'playing') - (a.status === 'playing'));
    if (!rows.length) {
      el.innerHTML = '<div class="empty">No open lobbies right now. Create one, and it will show up here for anyone else on this page.</div>';
      return;
    }
    el.innerHTML = '';
    rows.forEach((l) => {
      const row = document.createElement('div');
      row.className = 'lobby-item';
      const age = Math.max(0, Math.round((now - l.created) / 60000));
      const hostAway = now - l.ts > AWAY_MS;
      const host = PR.esc(cleanName(l.hostName));
      const btn = document.createElement('button');
      btn.className = 'btn primary small';
      if (l.status === 'playing') {
        const guest = PR.esc(cleanName(l.guestName));
        const res = l.snap.results;
        const sc = (id) => res.filter((x) => x && x.w === id).length;
        const asHost = l.hostId === me;
        row.innerHTML = `<span class="status-dot ${hostAway ? '' : 'on'}"></span>
          <div class="meta"><b>${host} vs ${guest}</b>
          <span>${PR.esc(unitLabel(l.units))} · problem ${l.snap.r + 1} / ${Number(l.rounds)} · ${sc(l.hostId)}–${sc(l.guestId)}${hostAway ? ` · ${host} away` : ''}</span></div>`;
        btn.textContent = `Rejoin as ${cleanName(asHost ? l.hostName : l.guestName)}`;
        btn.onclick = () => rejoinMatch(l);
      } else {
        row.innerHTML = `<span class="status-dot ${hostAway ? '' : 'on'}"></span>
          <div class="meta"><b>${host}'s lobby</b>
          <span>${PR.esc(unitLabel(l.units))} · ${Number(l.rounds)} problems · ${age ? age + ' min ago' : 'just now'}${hostAway ? ' · host away' : ''}</span></div>`;
        if (l.hostId === me) {
          btn.textContent = 'Reopen your lobby';
          btn.onclick = () => openMyLobby({ hostName: cleanName(l.hostName), units: l.units, rounds: l.rounds, created: l.created });
        } else {
          btn.textContent = hostAway ? 'Host away' : 'Join';
          btn.disabled = hostAway;
          btn.onclick = () => joinLobby(l);
        }
      }
      row.append(btn);
      el.append(row);
    });
  }

  // ---------- game state ----------
  let G = null;
  let pingTimer = null, watchTimer = null, tickTimer = null;

  function newGame(mode, opts) {
    G = {
      mode, // 'solo' | 'host' | 'guest'
      lobbyId: opts.lobbyId || null,
      seed: opts.seed,
      units: opts.units,
      rounds: opts.rounds,
      problems: buildProblems(opts.seed, opts.rounds, opts.units),
      r: 0,
      meName: opts.meName,
      opName: opts.opName || '',
      opId: opts.opId || null,
      created: opts.created || Date.now(),
      score: { me: 0, op: 0 },
      results: [], // per problem: { w: winner id or null, secs }, the shared record both sides sync on
      round: null,
      history: [],
      opSeen: opts.opSeen || Date.now(),
      opAway: false,
      over: false,
    };
    $('log').innerHTML = '';
    if ($('pastDlg').open) $('pastDlg').close();
    $('meName').textContent = G.meName + ' (you)';
    $('opName').textContent = mode === 'solo' ? 'Solo practice' : G.opName;
    $('chatRow').classList.toggle('hidden', mode === 'solo');
    screen('gameScreen');
    renderHistory();
    if (opts.restore) adopt(opts.restore);
    else startRound(0);
    // The host's lobby record doubles as the match record, so either player can rejoin from it.
    if (mode === 'host') PRNet.openLobby(matchRecord);
    if (mode !== 'solo') startHeartbeat();
  }

  // ---------- match record + resync ----------
  function snap() { return { r: G.r, results: G.results.slice(0, G.rounds), over: G.over }; }
  // How far a match has got; whichever side is further along is the truth after a reconnect.
  const progressOf = (s) => (s.over ? Infinity : s.r * 2 + (s.results[s.r] ? 1 : 0));
  function matchRecord() {
    return {
      status: 'playing', created: G.created, hostName: G.meName, units: G.units, rounds: G.rounds, seed: G.seed,
      guestId: G.opId, guestName: G.opName, snap: snap(),
    };
  }
  function recordChanged() { if (G && G.mode === 'host' && !G.over) PRNet.refreshLobby(); }
  function recount() {
    G.score.me = G.results.filter((x) => x && x.w === me).length;
    G.score.op = G.results.filter((x) => x && x.w && x.w === G.opId).length;
    scores();
  }

  // Jump to a snapshot: rebuild finished problems, then reopen the current one.
  function adopt(s) {
    G.results = s.results.map((x) => (x ? { w: x.w, secs: x.secs } : null));
    G.history = [];
    for (let i = 0; i < s.r; i++) {
      const x = G.results[i];
      if (x) G.history.push({ r: i, problem: G.problems[i], winner: x.w, secs: x.secs });
    }
    renderHistory();
    if (s.over) { G.r = s.r; recount(); finish(); return; }
    startRound(s.r);
    recount();
    const x = G.results[s.r];
    if (x) applyWinner(x.w, x.secs);
  }

  // Sent whenever we (re)enter a match or the connection comes back: the other side answers
  // with its snapshot, both keep the furthest one, then re-send anything the other may have missed.
  function sendHello() { if (G && G.mode !== 'solo') PRNet.send({ type: 'hello', name: G.meName, snap: snap() }); }
  function reconcile(s) {
    if (!validSnap(s, G.rounds, [me, G.opId, null])) return;
    if (progressOf(s) > progressOf(snap())) { adopt(s); log('Caught up with the match'); }
    if (G.over) return;
    const R = G.round;
    if (R.pendingCorrect) PRNet.send({ type: 'attempt', r: G.r, ok: true, n: R.myTries });
    if (R.myGaveUp) PRNet.send({ type: 'giveup', r: G.r });
    if (G.mode === 'host' && R.winner !== undefined) PRNet.send({ type: 'won', r: G.r, winner: R.winner });
    if (R.revealed && R.winner !== me && R.winner !== null) PRNet.send({ type: 'skip', r: G.r, solved: !!R.lateSolve });
    if (R.readyMe) PRNet.send({ type: 'ready', r: G.r });
  }

  // Half workbook problems, half generated ones, interleaved. Deterministic per seed
  // so both players see the same set.
  function buildProblems(seed, rounds, units) {
    const rng = PR.rng(seed ^ 0x5bd1e995);
    const wb = window.PRWorkbook ? PRWorkbook.problems.filter((p) => units.includes(p.unit)) : [];
    const nWb = Math.min(wb.length, Math.floor(rounds / 2));
    const gen = PRProblems.generate(seed, rounds - nWb, units);
    const picked = rng.shuffle(wb).slice(0, nWb);
    const out = [];
    while (gen.length || picked.length) {
      const takeWb = picked.length && (!gen.length || rng() < picked.length / (picked.length + gen.length));
      out.push(takeWb ? picked.shift() : gen.shift());
    }
    return out;
  }

  // Which lesson to point at after a round, by visual key. Filled in from the lesson files.
  function lessonFor(p) {
    if (p.lesson) { // problems that name their lesson directly (Computer Science)
      const l = (window.LESSONS || []).find((x) => x.id === p.lesson);
      return { id: p.lesson, title: l ? l.title : 'the matching lesson' };
    }
    const map = window.PR_LESSON_FOR_KEY || {};
    const key = (p.figure && p.figure.key) || (p.visual && p.visual.key);
    const lessonById = (lid) => (window.LESSONS || []).find((x) => x.id === lid);
    const sameUnit = (lid) => { const l = lessonById(lid); return !!l && l.unit === p.unit; };
    // Topic patterns from both courses share one list, so only accept a match in this problem's unit.
    const byTopic = (window.PR_LESSON_FOR_TOPIC || []).find(([re, lid]) => re.test(p.topic || '') && sameUnit(lid));
    let id = byTopic ? byTopic[1] : map[key];
    // A generic 'concept' card says nothing about the unit, so fall back by unit.
    if (!byTopic && key === 'concept' && p.unit === 2) id = 'u2-emf';
    if (id && !sameUnit(id)) id = map[key] && sameUnit(map[key]) ? map[key] : null;
    const l = id && lessonById(id);
    return id ? { id, title: l ? l.title : 'the matching lesson' } : null;
  }

  function startRound(r) {
    G.r = r;
    G.round = {
      winner: undefined, // undefined = open, id = winner, null = nobody
      myTries: 0, opTries: 0,
      myGaveUp: false, opGaveUp: false,
      readyMe: false, readyOp: false,
      revealed: false, // answer shown to me (the loser keeps it hidden until they skip)
      opDone: false, // opponent has solved or skipped, so "Next" can unlock
      started: Date.now(),
      pendingCorrect: false,
    };
    renderProblem();
    setStatus('me', ''); setStatus('op', G.mode === 'solo' ? '' : G.opAway ? 'away · can rejoin' : 'solving…');
    liveLine();
    recordChanged();
  }

  function cur() { return G.problems[G.r]; }
  function isHostish() { return G.mode !== 'guest'; }

  // ---------- rendering ----------
  function setStatus(who, text) { $(who === 'me' ? 'meStatus' : 'opStatus').textContent = text; }
  function scores() {
    $('meScore').textContent = G.score.me;
    $('opScore').textContent = G.score.op;
    liveLine();
  }
  // Status of the live round, shown in the past-problem viewer's header.
  function liveLine() {
    if (!G || !G.round) return;
    const R = G.round;
    const state = G.over ? 'match over' : R.winner === undefined ? 'still open' : R.winner === me ? 'you solved it' : R.winner ? `${G.opName} solved it` : 'nobody solved it';
    $('pastLive').textContent = `Live: problem ${G.r + 1} (${state}) · ${G.score.me}–${G.score.op}`;
  }
  function log(text) {
    const d = document.createElement('div');
    d.textContent = text;
    $('log').prepend(d);
  }

  function renderProblem() {
    const p = cur();
    scores();
    $('roundPill').textContent = `Problem ${G.r + 1} / ${G.rounds}`;
    $('unitPill').textContent = PR.unitShort(p.unit);
    $('unitPill').className = 'pill u' + p.unit;
    $('topicPill').textContent = p.source ? `${p.topic} · ${p.source}` : p.topic;
    let fig = '';
    if (p.figure && window.PRVisuals) {
      try { fig = `<div class="explain" style="border:0;padding:0;margin:0"><div class="visual">${PRVisuals.render(p.figure.key, p.figure.params)}</div></div>`; } catch (e) {}
    }
    $('prompt').innerHTML = p.prompt + fig;
    $('given').innerHTML = p.given || '';
    $('given').classList.toggle('hidden', !p.given);
    $('feedback').innerHTML = '';
    $('explain').classList.add('hidden');
    $('explain').innerHTML = '';
    const area = $('answerArea');
    if (p.type === 'mc') {
      area.innerHTML = '<div class="choices">' + p.choices.map((c, i) => `<button data-i="${i}">${String.fromCharCode(65 + i)}. ${c}</button>`).join('') + '</div>';
      area.querySelectorAll('button').forEach((b) => (b.onclick = () => submit(Number(b.dataset.i), b)));
    } else {
      // 'numeric' answers are numbers; 'text' answers are typed exactly (e.g. program output).
      const isText = p.type === 'text';
      area.innerHTML = `<div class="answer-row">
        <input type="text" id="ansInput" ${isText ? 'spellcheck="false" class="mono wide"' : 'inputmode="decimal"'} autocomplete="off" placeholder="${PR.esc(p.placeholder || 'Your answer')}">
        <span class="muted">${PR.esc(p.units || '')}</span>
        <button class="btn primary" id="ansBtn">Submit</button></div>
        <p class="muted" style="font-size:12px;margin-top:6px">${PR.esc(isText ? p.hint || 'Type exactly what the code prints.' : 'Scientific notation works: 3.2e5 or 3.2x10^5.')}</p>`;
      const inp = $('ansInput');
      $('ansBtn').onclick = () => submit(inp.value);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(inp.value); });
      setTimeout(() => inp.focus(), 50);
    }
    renderActions();
    PR.math($('problemCard'));
  }

  function renderActions() {
    const el = $('roundActions');
    el.innerHTML = '';
    const R = G.round;
    if (R.winner === undefined) {
      const give = document.createElement('button');
      give.className = 'btn small';
      give.textContent = G.mode === 'solo' ? 'Show answer' : R.myGaveUp ? 'Waiting for opponent to give up too…' : 'Give up';
      give.disabled = R.myGaveUp;
      give.onclick = giveUp;
      el.append(give);
      return;
    }
    if (!R.revealed) {
      const sk = document.createElement('button');
      sk.className = 'btn';
      sk.textContent = 'Skip · show the answer';
      sk.onclick = () => reveal(false);
      el.append(sk);
      return;
    }
    const ex = document.createElement('button');
    ex.className = 'btn primary';
    ex.textContent = 'Show visual explanation';
    ex.onclick = () => { showExplanation(); ex.remove(); };
    el.append(ex);
    const nx = document.createElement('button');
    nx.className = 'btn';
    const last = G.r === G.rounds - 1;
    nx.textContent = R.readyMe ? 'Waiting for opponent…' : !R.opDone ? `Waiting for ${G.opName} to solve or skip…` : last ? 'See final score' : 'Next problem →';
    nx.disabled = R.readyMe || !R.opDone;
    nx.onclick = ready;
    el.append(nx);
  }

  // Visual + steps + lesson link for one problem. Shared by the live round and the history viewer.
  function explanationHTML(p) {
    // A problem either brings its own explanation markup (explainHTML) or a PRVisuals key.
    let svg = p.explainHTML || '';
    try {
      if (!svg && p.visual) svg = window.PRVisuals ? PRVisuals.render(p.visual.key, p.visual.params) : '';
    } catch (e) { console.error(e); }
    const l = lessonFor(p);
    return `<h3 style="font-size:16px">Visual explanation</h3>
      ${svg ? `<div class="visual">${svg}</div>` : ''}
      <ol>${p.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      ${l ? `<p style="margin-top:12px"><a href="${PR.path}/learn.html#${l.id}" target="_blank" rel="noopener">Review the lesson: ${PR.esc(l.title)} →</a></p>` : ''}`;
  }

  function showExplanation() {
    const box = $('explain');
    box.innerHTML = explanationHTML(cur());
    box.classList.remove('hidden');
    PR.math(box);
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---------- past rounds ----------
  // Finished rounds stay viewable in a dialog layered over the match, so looking back
  // never touches the live round's inputs, timer, or network state.
  function renderHistory() {
    const el = $('history');
    if (!G || !G.history.length) {
      el.innerHTML = '<div class="muted" style="font-size:13px">Finished problems show up here. Open any of them without leaving the current one.</div>';
      return;
    }
    el.innerHTML = '';
    G.history.slice().reverse().forEach((h) => {
      const b = document.createElement('button');
      const res = h.winner === me ? 'you ✓' : h.winner ? `${G.opName} ✓` : 'unsolved';
      b.innerHTML = `<span class="n">#${h.r + 1}</span><span class="t">${PR.esc(h.problem.topic)}</span><span class="res ${h.winner === me ? 'me' : ''}">${PR.esc(res)}</span>`;
      b.onclick = () => openPast(h);
      el.append(b);
    });
  }

  function openPast(h) {
    const p = h.problem;
    let fig = '';
    if (p.figure && window.PRVisuals) {
      try { fig = `<div class="visual">${PRVisuals.render(p.figure.key, p.figure.params)}</div>`; } catch (e) {}
    }
    const choices = p.type === 'mc'
      ? '<div class="choices">' + p.choices.map((c, i) => `<button disabled class="${i === p.correct ? 'right' : ''}">${String.fromCharCode(65 + i)}. ${c}</button>`).join('') + '</div>'
      : '';
    const who = h.winner === me ? `You solved it in ${h.secs}s.` : h.winner ? `${PR.esc(G.opName)} solved it in ${h.secs}s.` : 'Nobody solved it.';
    $('pastBody').innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span class="pill">Problem ${h.r + 1}</span><span class="pill u${p.unit}">${PR.unitShort(p.unit)}</span>
        <span class="pill">${PR.esc(p.source ? `${p.topic} · ${p.source}` : p.topic)}</span>
      </div>
      <div class="prompt" style="margin-top:10px">${p.prompt}</div>
      ${fig}
      ${p.given ? `<div class="given">${p.given}</div>` : ''}
      ${choices}
      <div class="feedback info">${who} Answer: <b>${answerText(p)}</b></div>
      <div class="explain">${explanationHTML(p)}</div>`;
    const dlg = $('pastDlg');
    if (!dlg.open) dlg.showModal();
    $('pastBody').scrollTop = 0;
    PR.math($('pastBody'));
  }

  $('pastClose').onclick = () => $('pastDlg').close();
  $('pastDlg').addEventListener('click', (e) => { if (e.target === $('pastDlg')) $('pastDlg').close(); });
  // Hand focus back to the answer box so the player can keep typing.
  $('pastDlg').addEventListener('close', () => { const i = $('ansInput'); if (i && !i.disabled) i.focus(); });

  function answerText(p) {
    if (p.type === 'mc') return String.fromCharCode(65 + p.correct);
    if (p.type === 'text') return PR.esc(p.answer);
    return `${PR.sig(p.answer, 3)} ${p.units || ''}`.trim();
  }

  function lockInputs() {
    $('answerArea').classList.remove('waiting');
    $('answerArea').querySelectorAll('button, input').forEach((x) => (x.disabled = true));
    const p = cur();
    if (p.type === 'mc') {
      const btns = $('answerArea').querySelectorAll('.choices button');
      if (btns[p.correct]) btns[p.correct].classList.add('right');
    }
  }

  function feedback(cls, html) {
    $('feedback').innerHTML = `<div class="feedback ${cls}">${html}</div>`;
    PR.math($('feedback'));
  }

  // ---------- answering ----------
  // Fair shots: you may answer whenever you have taken no more shots than your
  // opponent (so A shoots, then B may shoot twice, then A, ...). Not turn-based:
  // whoever is allowed can fire at any moment. A player who gave up stops counting.
  function canShoot() {
    const R = G.round;
    return G.mode === 'solo' || R.opGaveUp || R.myTries <= R.opTries;
  }

  function submit(response, btn) {
    const R = G.round;
    const p = cur();
    if (p.type !== 'mc' && !String(response).trim()) return;
    if (R.winner !== undefined) {
      // Opponent already won: free practice tries, no point, no fair-shot limit.
      if (R.revealed) return;
      const ok = PRProblems.check(p, response);
      if (btn) { btn.classList.add(ok ? 'right' : 'wrong'); if (!ok) btn.disabled = true; }
      stat(p, ok);
      if (ok) reveal(true);
      else feedback('bad', `Not quite. Keep trying (no point at stake), or skip to see the answer.`);
      return;
    }
    if (R.pendingCorrect) return;
    if (!canShoot()) { feedback('info', `Wait for ${PR.esc(G.opName)} to take a shot — then you can go again.`); return; }
    R.myTries++;
    const ok = PRProblems.check(p, response);
    if (btn) { btn.classList.add(ok ? 'right' : 'wrong'); if (!ok) btn.disabled = true; }
    stat(p, ok);
    if (G.mode === 'solo') {
      if (ok) endRound(me);
      else feedback('bad', 'Not quite. Try again, or show the answer.');
      return;
    }
    PRNet.send({ type: 'attempt', r: G.r, ok, n: R.myTries });
    if (ok) {
      if (isHostish()) endRound(me);
      else { R.pendingCorrect = true; feedback('info', 'Correct! Checking whether you were first…'); }
      return;
    }
    setStatus('me', `${R.myTries} miss${R.myTries > 1 ? 'es' : ''}`);
    shotHint();
  }

  // Tell the player whether they can shoot right now.
  function shotHint() {
    const R = G.round;
    if (G.mode === 'solo' || R.winner !== undefined || R.pendingCorrect) return;
    if (canShoot()) {
      feedback(R.myTries ? 'bad' : 'info', R.myTries ? 'Not quite — your shot is open again.' : 'Your shot is open.');
    } else {
      feedback('bad', `Not quite. Waiting for ${PR.esc(G.opName)} to take a shot before you can go again.`);
    }
    $('answerArea').classList.toggle('waiting', !canShoot());
  }

  // Per-browser stats, shown on the hub.
  function stat(p, ok) {
    try {
      const s = JSON.parse(localStorage.getItem(PR.key('stats')) || '{}');
      const t = (s[p.topic] = s[p.topic] || { unit: p.unit, tries: 0, right: 0 });
      t.tries++; if (ok) t.right++;
      localStorage.setItem(PR.key('stats'), JSON.stringify(s));
    } catch (e) {}
  }

  function giveUp() {
    const R = G.round;
    if (G.mode === 'solo') { endRound(null); return; }
    R.myGaveUp = true;
    PRNet.send({ type: 'giveup', r: G.r });
    setStatus('me', 'gave up');
    renderActions();
    if (isHostish() && R.opGaveUp) endRound(null);
  }

  // Host (or solo) decides the round.
  function endRound(winner) {
    if (G.round.winner !== undefined) return;
    applyWinner(winner);
    if (G.mode === 'host') PRNet.send({ type: 'won', r: G.r, winner });
  }

  // secs is given when replaying a result from a snapshot.
  function applyWinner(winner, secs) {
    const R = G.round;
    const wasCorrect = R.pendingCorrect;
    R.winner = winner;
    R.pendingCorrect = false;
    R.secs = typeof secs === 'number' ? Math.max(0, Math.round(secs)) : Math.round((Date.now() - R.started) / 1000);
    G.results[G.r] = { w: winner, secs: R.secs };
    recount();
    recordChanged();
    const p = cur();
    if (winner && winner !== me) {
      setStatus('op', 'solved ✓');
      log(`#${G.r + 1}: ${G.opName} solved it (${R.secs}s)`);
      // I answered correctly too but lost the race: I already know the answer.
      if (wasCorrect) { reveal(true); return; }
      // Otherwise keep the answer hidden: I can keep trying or skip.
      R.opDone = true;
      $('answerArea').classList.remove('waiting');
      feedback('bad', `${PR.esc(G.opName)} got it first (+1 to them). The answer stays hidden — keep working on it, or skip to see it.`);
      renderActions();
      return;
    }
    R.revealed = true;
    // My win: the opponent still has to solve or skip before we move on. Nobody won: both are done.
    R.opDone = G.mode === 'solo' || !winner;
    lockInputs();
    G.history.push({ r: G.r, problem: p, winner, secs: R.secs });
    renderHistory();
    if (winner === me) {
      feedback('good', `You got it in ${R.secs}s! Answer: <b>${answerText(p)}</b>`);
      setStatus('me', 'solved ✓');
      log(`#${G.r + 1}: you solved it (${R.secs}s)`);
    } else {
      feedback('info', `Nobody got this one. Answer: <b>${answerText(p)}</b>`);
      log(`#${G.r + 1}: no one solved it`);
    }
    renderActions();
  }

  // The loser of a round sees the answer only once they solve it themselves or skip.
  function reveal(solved) {
    const R = G.round;
    if (R.revealed) return;
    R.revealed = true;
    R.opDone = true;
    R.lateSolve = solved;
    PRNet.send({ type: 'skip', r: G.r, solved });
    lockInputs();
    const p = cur();
    G.history.push({ r: G.r, problem: p, winner: R.winner, secs: R.secs });
    renderHistory();
    setStatus('me', solved ? 'solved (late)' : 'skipped');
    feedback(solved ? 'good' : 'info', `${solved ? 'You got it too.' : 'Skipped.'} Answer: <b>${answerText(p)}</b>`);
    renderActions();
  }

  function ready() {
    const R = G.round;
    if (G.mode === 'solo') { advance(); return; }
    R.readyMe = true;
    PRNet.send({ type: 'ready', r: G.r });
    renderActions();
    if (G.mode === 'host' && R.readyOp) { PRNet.send({ type: 'next', r: G.r + 1 }); advance(); }
  }

  function advance() {
    if (G.r + 1 >= G.rounds) finish();
    else startRound(G.r + 1);
  }

  function finish() {
    G.over = true;
    if (G.mode === 'host') PRNet.closeLobby(); // nothing left to rejoin
    liveLine();
    const { me: a, op: b } = G.score;
    const solo = G.mode === 'solo';
    const headline = solo ? `You solved ${a} of ${G.rounds}` : a > b ? 'You win! 🎉' : a < b ? `${PR.esc(G.opName)} wins` : 'Tie game';
    $('roundPill').textContent = 'Final';
    $('unitPill').textContent = ''; $('topicPill').textContent = '';
    $('prompt').innerHTML = `<h2 style="font-size:28px">${headline}</h2><p class="muted">${solo ? '' : `Final score ${a} – ${b}`}</p>`;
    $('given').classList.add('hidden');
    $('answerArea').innerHTML = '';
    $('feedback').innerHTML = '';
    $('explain').classList.add('hidden');
    const el = $('roundActions');
    el.innerHTML = '';
    if (G.mode !== 'guest') {
      const again = document.createElement('button');
      again.className = 'btn primary';
      again.textContent = solo ? 'Practice again' : 'Rematch';
      again.onclick = rematch;
      el.append(again);
    } else {
      el.innerHTML = `<span class="muted">Waiting to see if ${PR.esc(G.opName)} starts a rematch…</span>`;
    }
    const back = document.createElement('button');
    back.className = 'btn';
    back.textContent = 'Back to lobbies';
    back.onclick = leave;
    el.append(back);
  }

  function rematch() {
    const opts = { seed: randSeed(), units: G.units, rounds: G.rounds, meName: G.meName, opName: G.opName, opId: G.opId, lobbyId: G.lobbyId };
    if (G.mode === 'host') PRNet.send({ type: 'start', to: G.opId, seed: opts.seed, units: opts.units, rounds: opts.rounds, hostName: G.meName });
    newGame(G.mode, opts);
  }

  // ---------- network messages ----------
  PRNet.on('game', (m) => {
    // Host waiting for someone to join.
    if (m.type === 'join' && hosting && !G) {
      const opts = { seed: randSeed(), units: hosting.units, rounds: hosting.rounds, meName: hosting.hostName, opName: cleanName(m.name), opId: m.from, lobbyId: me, created: hosting.created };
      PRNet.send({ type: 'start', to: m.from, seed: opts.seed, units: opts.units, rounds: opts.rounds, hostName: hosting.hostName });
      hosting = null;
      newGame('host', opts);
      log(`${opts.opName} joined`);
      return;
    }
    if (m.type === 'join' && G && m.from !== G.opId) { PRNet.send({ type: 'full', to: m.from }); return; }

    // Guest waiting for the host's start.
    // only the host of the lobby we joined may start our match, with sane settings
    if (m.type === 'start' && m.to === me && m.from === (joiningLobby || (G && G.lobbyId)) && Number.isInteger(m.seed) && validUnits(m.units) && validRounds(m.rounds)) {
      clearTimeout(joinTimeout);
      const opts = { seed: m.seed, units: m.units, rounds: m.rounds, meName: myName(), opName: cleanName(m.hostName), opId: m.from, lobbyId: joiningLobby || (G && G.lobbyId) };
      joiningLobby = null;
      newGame('guest', opts);
      log(`Joined ${opts.opName}'s lobby`);
      return;
    }
    if (m.type === 'full' && m.to === me && m.from === joiningLobby) {
      clearTimeout(joinTimeout);
      joiningLobby = null;
      PRNet.leaveGame();
      screen('lobbyScreen');
      alert('That lobby just filled up. Pick another or create your own.');
      return;
    }

    if (!G || G.mode === 'solo' || m.from !== G.opId) return;
    G.opSeen = Date.now();
    if (G.opAway && m.type !== 'away') {
      if (G.opAway === true) log(`${G.opName} is back`); // not when we were the ones rejoining
      G.opAway = false;
      if (!G.over) setStatus('op', 'connected');
    }
    const R = G.round;
    switch (m.type) {
      case 'ping': break;
      case 'chat': if (typeof m.text === 'string') log(`${G.opName}: ${m.text.slice(0, 140)}`); break;
      case 'hello':
        PRNet.send({ type: 'sync', snap: snap() });
        reconcile(m.snap);
        break;
      case 'sync':
        reconcile(m.snap);
        break;
      case 'away': // their page closed or reloaded; they can rejoin from the lobby list
        opGone();
        break;
      case 'leave':
        log(`${G.opName} left the match`);
        setStatus('op', 'left');
        if (!G.over) {
          G.over = true;
          if (G.mode === 'host') PRNet.closeLobby();
          feedback('info', `${PR.esc(G.opName)} left the match.`);
        }
        break;
      case 'attempt':
        if (m.r !== G.r || R.winner !== undefined) break;
        R.opTries = Math.max(R.opTries + 1, m.n || 0);
        if (m.ok) {
          setStatus('op', 'answered ✓');
          if (G.mode === 'host') endRound(G.opId);
        } else {
          setStatus('op', `${R.opTries} miss${R.opTries > 1 ? 'es' : ''}`);
          if (R.myTries) shotHint();
        }
        break;
      case 'giveup':
        if (m.r !== G.r || R.winner !== undefined) break;
        R.opGaveUp = true;
        setStatus('op', 'gave up');
        if (R.myTries) shotHint();
        if (G.mode === 'host' && R.myGaveUp) endRound(null);
        break;
      case 'won':
        if (G.mode === 'guest' && m.r === G.r && R.winner === undefined) applyWinner([me, G.opId, null].includes(m.winner) ? m.winner : null);
        break;
      case 'skip':
        if (m.r !== G.r || R.opSkipped) break;
        R.opSkipped = true;
        R.opDone = true;
        setStatus('op', m.solved ? 'solved (late)' : 'skipped');
        log(`#${G.r + 1}: ${G.opName} ${m.solved ? 'solved it too' : 'skipped'}`);
        if (R.winner !== undefined) renderActions();
        break;
      case 'ready':
        if (m.r !== G.r) break;
        R.readyOp = true;
        setStatus('op', 'ready for next');
        if (G.mode === 'host' && R.readyMe) { PRNet.send({ type: 'next', r: G.r + 1 }); advance(); }
        break;
      case 'next':
        if (G.mode === 'guest' && m.r === G.r + 1) advance();
        break;
    }
  });

  function randSeed() { return (Math.random() * 2 ** 31) >>> 0; }

  // ---------- hosting / joining ----------
  let hosting = null;
  let joiningLobby = null;
  let joinTimeout = null;

  $('createBtn').onclick = () => {
    const units = $('unitSelect').value.split(',').map(Number);
    const rounds = Number($('roundSelect').value);
    openMyLobby({ hostName: myName(), units, rounds, created: Date.now() });
  };
  function openMyLobby(info) {
    hosting = info;
    PRNet.openLobby({ status: 'open', hostName: info.hostName, units: info.units, rounds: info.rounds, created: info.created });
    $('waitTitle').textContent = 'Waiting for an opponent…';
    $('waitSub').textContent = `${unitLabel(info.units)} · ${info.rounds} problems. Your lobby is listed for everyone on the 1v1 page for 15 minutes, even if you get disconnected.`;
    screen('waitScreen');
  }

  // Back into a match I was playing (same key as before, so the other side accepts me).
  function rejoinMatch(l) {
    const asHost = l.hostId === me;
    const opts = {
      seed: l.seed, units: l.units, rounds: l.rounds, created: l.created,
      meName: cleanName(asHost ? l.hostName : l.guestName), opName: cleanName(asHost ? l.guestName : l.hostName),
      opId: asHost ? l.guestId : l.hostId, lobbyId: l.hostId, restore: l.snap,
    };
    PRNet.joinGame(l.hostId);
    newGame(asHost ? 'host' : 'guest', opts);
    log('You rejoined the match');
    // Treat the other side as away until they answer.
    G.opSeen = 0;
    opGone(true);
    setTimeout(sendHello, 400);
  }
  $('cancelWait').onclick = () => {
    hosting = null;
    PRNet.closeLobby();
    PRNet.leaveGame();
    screen('lobbyScreen');
  };

  function joinLobby(l) {
    joiningLobby = l.id;
    PRNet.joinGame(l.id);
    $('waitTitle').textContent = `Joining ${l.hostName}'s lobby…`;
    $('waitSub').textContent = '';
    screen('waitScreen');
    // Give the subscription a moment to land before announcing ourselves.
    setTimeout(() => PRNet.send({ type: 'join', name: myName() }), 400);
    clearTimeout(joinTimeout);
    joinTimeout = setTimeout(() => {
      joiningLobby = null;
      PRNet.leaveGame();
      screen('lobbyScreen');
      alert("Couldn't reach that lobby — the host may have left.");
    }, 8000);
  }

  $('soloBtn').onclick = () => {
    const units = $('unitSelect').value.split(',').map(Number);
    newGame('solo', { seed: randSeed(), units, rounds: Number($('roundSelect').value), meName: myName() });
  };

  function leave() {
    if (G && G.mode !== 'solo') PRNet.send({ type: 'leave' });
    if (G && G.mode === 'host') PRNet.closeLobby();
    stopHeartbeat();
    PRNet.leaveGame();
    G = null;
    screen('lobbyScreen');
    renderLobbies(PRNet.listLobbies());
  }
  $('leaveBtn').onclick = () => { if (!G || G.over || G.mode === 'solo' || confirm('Leave this match?')) leave(); };

  // ---------- chat ----------
  function sendChat() {
    const t = $('chatInput').value.trim();
    if (!t || !G) return;
    PRNet.send({ type: 'chat', text: t.slice(0, 140) });
    log(`You: ${t}`);
    $('chatInput').value = '';
  }
  $('chatSend').onclick = sendChat;
  $('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

  // ---------- heartbeat + timer ----------
  function startHeartbeat() {
    stopHeartbeat();
    G.opSeen = Date.now();
    pingTimer = setInterval(() => PRNet.send({ type: 'ping' }), 5000);
    watchTimer = setInterval(() => {
      if (!G || G.over) return;
      if (!G.opAway && Date.now() - G.opSeen > 20000) opGone();
      // Rejoined and nobody answered: they're away too.
      if (G.opAway === 'unknown' && Date.now() - G.opAwaySince > 8000) { G.opAway = false; opGone(); }
    }, 3000);
  }
  function stopHeartbeat() { clearInterval(pingTimer); clearInterval(watchTimer); }

  // The opponent dropped: the match waits for them (up to 15 minutes) instead of ending.
  function opGone(quiet) {
    if (!G || G.over || G.opAway) return;
    G.opAway = quiet ? 'unknown' : true;
    G.opAwaySince = Date.now();
    setStatus('op', quiet ? 'checking if they\'re here…' : 'away · can rejoin');
    if (!quiet) log(`${G.opName} disconnected. The match stays open for 15 minutes so they can rejoin from the lobby list.`);
  }

  // Our own connection came back after a drop: messages may have been lost, so resync.
  let wasOnline = false;
  PRNet.on('status', ({ state }) => {
    if (state !== 'online') return;
    if (wasOnline && G && !G.over) sendHello();
    wasOnline = true;
  });

  tickTimer = setInterval(() => {
    if (!G || G.over || !G.round) { $('timer').textContent = ''; return; }
    const s = Math.floor((Date.now() - G.round.started) / 1000);
    $('timer').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 500);

  // Closing or reloading isn't leaving: the opponent is told we're away, and we can rejoin.
  window.addEventListener('beforeunload', () => { if (G && G.mode !== 'solo' && !G.over) PRNet.send({ type: 'away' }); });

  window.PRDuelState = () => G; // for debugging from the console

  renderLobbies([]);
  PRNet.connect();
});
