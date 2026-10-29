// 1v1 duel: lobby browser, match flow, scoring, visual explanations.
// The host is authoritative for who won each round; both sides generate the same
// problems locally from the shared seed (PRProblems.generate).
(function () {
  const $ = (id) => document.getElementById(id);
  const me = PRNet.myId;

  // ---------- name ----------
  const nameInput = $('nameInput');
  try { nameInput.value = localStorage.getItem('pr-name') || ''; } catch (e) {}
  function myName() {
    const n = nameInput.value.trim().slice(0, 20) || 'Player ' + me.slice(0, 3).toUpperCase();
    try { localStorage.setItem('pr-name', nameInput.value.trim()); } catch (e) {}
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
    return units.length === 2 ? 'Units 1 + 2' : units[0] === 1 ? 'Unit 1 · Electrostatics' : 'Unit 2 · Circuits';
  }

  function renderLobbies(list) {
    const el = $('lobbyList');
    const others = list.filter((l) => l.hostId !== me);
    if (!online) { el.innerHTML = '<div class="empty">Connecting to the lobby server…</div>'; return; }
    if (!others.length) {
      el.innerHTML = '<div class="empty">No open lobbies right now. Create one, and it will show up here for anyone else on this page.</div>';
      return;
    }
    el.innerHTML = '';
    others.forEach((l) => {
      const row = document.createElement('div');
      row.className = 'lobby-item';
      const age = Math.max(0, Math.round((Date.now() - l.created) / 60000));
      row.innerHTML = `<span class="status-dot on"></span>
        <div class="meta"><b>${PR.esc(l.hostName)}'s lobby</b>
        <span>${unitLabel(l.units)} · ${l.rounds} problems · ${age ? age + ' min ago' : 'just now'}</span></div>`;
      const btn = document.createElement('button');
      btn.className = 'btn primary small';
      btn.textContent = 'Join';
      btn.onclick = () => joinLobby(l);
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
      score: { me: 0, op: 0 },
      round: null,
      history: [],
      opSeen: Date.now(),
      over: false,
    };
    $('log').innerHTML = '';
    if ($('pastDlg').open) $('pastDlg').close();
    $('meName').textContent = G.meName + ' (you)';
    $('opName').textContent = mode === 'solo' ? 'Solo practice' : G.opName;
    $('chatRow').classList.toggle('hidden', mode === 'solo');
    screen('gameScreen');
    renderHistory();
    startRound(0);
    if (mode !== 'solo') startHeartbeat();
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
    const map = window.PR_LESSON_FOR_KEY || {};
    const key = (p.figure && p.figure.key) || (p.visual && p.visual.key);
    const byTopic = (window.PR_LESSON_FOR_TOPIC || []).find(([re]) => re.test(p.topic || ''));
    let id = byTopic ? byTopic[1] : map[key];
    // A generic 'concept' card says nothing about the unit, so fall back by unit.
    if (!byTopic && key === 'concept' && p.unit === 2) id = 'u2-emf';
    if (id && id[1] !== String(p.unit)) id = map[key] && map[key][1] === String(p.unit) ? map[key] : null;
    const l = id && (window.LESSONS || []).find((x) => x.id === id);
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
    setStatus('me', ''); setStatus('op', G.mode === 'solo' ? '' : 'solving…');
    liveLine();
  }

  function cur() { return G.problems[G.r]; }
  function isHostish() { return G.mode !== 'guest'; }
  function oppId() { return G.mode === 'solo' ? null : G.opId; }

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
    $('unitPill').textContent = 'Unit ' + p.unit;
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
      area.innerHTML = `<div class="answer-row">
        <input type="text" id="ansInput" inputmode="decimal" autocomplete="off" placeholder="Your answer">
        <span class="muted">${PR.esc(p.units || '')}</span>
        <button class="btn primary" id="ansBtn">Submit</button></div>
        <p class="muted" style="font-size:12px;margin-top:6px">Scientific notation works: 3.2e5 or 3.2x10^5.</p>`;
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
    let svg = '';
    try {
      svg = window.PRVisuals ? PRVisuals.render(p.visual.key, p.visual.params) : '';
    } catch (e) { console.error(e); }
    const l = lessonFor(p);
    return `<h3 style="font-size:16px">Visual explanation</h3>
      ${svg ? `<div class="visual">${svg}</div>` : ''}
      <ol>${p.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      ${l ? `<p style="margin-top:12px"><a href="/physicsreview/learn.html#${l.id}" target="_blank" rel="noopener">Review the lesson: ${PR.esc(l.title)} →</a></p>` : ''}`;
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
        <span class="pill">Problem ${h.r + 1}</span><span class="pill u${p.unit}">Unit ${p.unit}</span>
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
    if (p.type === 'numeric' && !String(response).trim()) return;
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
      const s = JSON.parse(localStorage.getItem('pr-stats') || '{}');
      const t = (s[p.topic] = s[p.topic] || { unit: p.unit, tries: 0, right: 0 });
      t.tries++; if (ok) t.right++;
      localStorage.setItem('pr-stats', JSON.stringify(s));
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
    if (G.mode === 'host') PRNet.send({ type: 'won', r: G.r, winner, score: { [me]: G.score.me, [G.opId]: G.score.op } });
  }

  function applyWinner(winner, hostScore) {
    const R = G.round;
    const wasCorrect = R.pendingCorrect;
    R.winner = winner;
    R.pendingCorrect = false;
    if (hostScore) {
      G.score.me = hostScore[me] || 0;
      G.score.op = hostScore[G.opId] || 0;
    } else if (winner === me) G.score.me++;
    else if (winner && winner === oppId()) G.score.op++;
    scores();
    R.secs = Math.round((Date.now() - R.started) / 1000);
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
      const opts = { seed: randSeed(), units: hosting.units, rounds: hosting.rounds, meName: hosting.hostName, opName: m.name, opId: m.from, lobbyId: me };
      PRNet.closeLobby(); // stop advertising, but keep the game topic
      PRNet.joinGame(me);
      PRNet.send({ type: 'start', to: m.from, seed: opts.seed, units: opts.units, rounds: opts.rounds, hostName: hosting.hostName });
      hosting = null;
      newGame('host', opts);
      log(`${m.name} joined`);
      return;
    }
    if (m.type === 'join' && G && m.from !== G.opId) { PRNet.send({ type: 'full', to: m.from }); return; }

    // Guest waiting for the host's start.
    if (m.type === 'start' && m.to === me) {
      clearTimeout(joinTimeout);
      const opts = { seed: m.seed, units: m.units, rounds: m.rounds, meName: myName(), opName: m.hostName, opId: m.from, lobbyId: joiningLobby || (G && G.lobbyId) };
      joiningLobby = null;
      newGame('guest', opts);
      log(`Joined ${m.hostName}'s lobby`);
      return;
    }
    if (m.type === 'full' && m.to === me) {
      clearTimeout(joinTimeout);
      joiningLobby = null;
      PRNet.leaveGame();
      screen('lobbyScreen');
      alert('That lobby just filled up. Pick another or create your own.');
      return;
    }

    if (!G || m.from !== G.opId) return;
    G.opSeen = Date.now();
    const R = G.round;
    switch (m.type) {
      case 'ping': break;
      case 'chat': log(`${G.opName}: ${m.text}`); break;
      case 'leave':
        log(`${G.opName} left the match`);
        setStatus('op', 'left');
        if (!G.over) { G.over = true; feedback('info', `${PR.esc(G.opName)} left the match.`); }
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
        if (G.mode === 'guest' && m.r === G.r) applyWinner(m.winner, m.score);
        break;
      case 'skip':
        if (m.r !== G.r) break;
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
    hosting = { hostName: myName(), units, rounds };
    PRNet.openLobby(hosting);
    $('waitTitle').textContent = 'Waiting for an opponent…';
    $('waitSub').textContent = `${unitLabel(units)} · ${rounds} problems. Your lobby is listed for everyone on the 1v1 page.`;
    screen('waitScreen');
  };
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
      if (G && !G.over && Date.now() - G.opSeen > 20000) setStatus('op', 'connection lost…');
    }, 3000);
  }
  function stopHeartbeat() { clearInterval(pingTimer); clearInterval(watchTimer); }

  tickTimer = setInterval(() => {
    if (!G || G.over || !G.round) { $('timer').textContent = ''; return; }
    const s = Math.floor((Date.now() - G.round.started) / 1000);
    $('timer').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 500);

  window.addEventListener('beforeunload', () => { if (G && G.mode !== 'solo') PRNet.send({ type: 'leave' }); });

  window.PRDuelState = () => G; // for debugging from the console

  renderLobbies([]);
  PRNet.connect();
})();
