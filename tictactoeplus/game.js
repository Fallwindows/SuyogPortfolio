// Tic Tac Toe Plus — online 1v1 with no backend.
// Like Physics Review's 1v1, browsers share a room through a public MQTT broker, and open games
// are listed in a lobby: each host publishes a signed, retained lobby/<their key id> message
// (refreshed every 15 s, cleared by a last will when they disconnect). Because anyone can
// publish there, a room is a hash-chained log of signed events (join / move / reset). Every client
// verifies each event's signature (js/sig.js), checks it follows the rules and was made by the
// player whose seat it is, and rebuilds the board from the log. Forged, out-of-turn or illegal
// events are ignored, so nobody can move for another player, take their seat or rename them.
(async function () {
  const BASE = 'suyogbhandari-tictactoeplus/v2';
  const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
  const N = 4, WIN = 4, MAX_LOG = 800, MAX_MSG = 600000;
  const TURN_MS = 5 * 60 * 1000;   // a player who doesn't move for 5 minutes loses on time
  const MAX_FUTURE = 15000;        // events stamped further in the future than this are rejected
  const TIE_MS = 10000;            // only an event this fresh can lose a same-moment tie
  const RESET_HASH = '471f157327c92233c44e1240b921373a6e8f1e74f962e9655e1e6d6df6c874a3'; // sha256 of the restart password
  const $ = (id) => document.getElementById(id);

  const LOBBY_TTL = 45000;          // a lobby with no heartbeat for this long is treated as gone
  const qs = new URLSearchParams(location.search);
  const me = await Sig.init('tttp-key-v2');
  // A room link carries an unguessable code and the creator's key id. A valid game history has to
  // start with the creator taking a seat, so nobody can pass off a made-up history for the room.
  const validRoom = (r, h) => typeof r === 'string' && /^[a-z0-9]{12,32}$/.test(r) && typeof h === 'string' && /^[0-9a-f]{24}$/.test(h);
  let room = null, host = null, topic = null;

  let log = [];            // [{ env, h }] — verified events, h = sha256 of the event body
  let S = newGame(null);   // board state rebuilt from the log
  let mode = 'piece', err = '', client = null, online = false;

  // ---------- rules ----------
  function newGame(prev) {
    // the last winner goes first; after a draw (or an unfinished game) the other player starts
    const p = prev || { owners: {}, names: {}, starter: 'O' };
    const starter = p.winner === 'X' || p.winner === 'O' ? p.winner : p.starter === 'X' ? 'O' : 'X';
    return { owners: { ...p.owners }, names: { ...p.names }, starter, board: Array(N * N).fill(null), turn: starter,
      tri: { X: 1, O: 1 }, winner: null, winLine: [], last: null };
  }
  function findWin(board, p) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const line = []; let own = 0;
      for (let k = 0; k < WIN; k++) {
        const rr = r + dr * k, cc = c + dc * k;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) break;
        const v = board[rr * N + cc];
        if (v !== p && v !== 'T') break;
        if (v === p) own++;
        line.push(rr * N + cc);
      }
      // triangles count for both sides, but a line needs at least one of your own pieces
      if (line.length === WIN && own > 0) return line;
    }
    return null;
  }
  function checkEnd(s, mover) {
    for (const p of [mover, mover === 'X' ? 'O' : 'X']) {
      const line = findWin(s.board, p);
      if (line) { s.winner = p; s.winLine = line; return true; }
    }
    if (s.board.every((v) => v)) { s.winner = 'draw'; return true; }
    return false;
  }
  const seatOf = (s, id) => (s.owners.X === id ? 'X' : s.owners.O === id ? 'O' : null);
  const cleanName = (n) => (typeof n === 'string' ? n.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').trim().slice(0, 20) : '');

  // Apply one event signed by `from`. Returns an error message, or null after updating s.
  async function apply(s, b, from) {
    if (b.type === 'join') {
      const name = cleanName(b.name);
      if (b.seat !== 'X' && b.seat !== 'O') return 'Bad seat';
      if (s.owners[b.seat]) return 'Seat taken';
      if (seatOf(s, from)) return 'You already have a seat';
      if (!name) return 'Enter your name first';
      s.owners[b.seat] = from; s.names[b.seat] = name;
      return null;
    }
    const mine = seatOf(s, from);
    if (!mine) return 'Only the two players can do that';
    if (b.type === 'move') {
      if (!s.owners.X || !s.owners.O) return 'Waiting for opponent';
      if (s.winner) return 'Game over';
      if (mine !== s.turn) return 'Not your turn';
      if (!Number.isInteger(b.i) || b.i < 0 || b.i >= N * N || s.board[b.i]) return 'Square taken';
      if (b.kind === 'tri') {
        if (!s.tri[mine]) return 'No triangle left this turn';
        s.board[b.i] = 'T'; s.tri[mine] = 0; s.last = b.i;
        checkEnd(s, mine); // you keep your turn to place your piece
      } else if (b.kind === 'piece') {
        s.board[b.i] = mine; s.last = b.i;
        if (!checkEnd(s, mine)) { s.turn = mine === 'X' ? 'O' : 'X'; s.tri[s.turn] = 1; } // new turn: refill triangle, max 1
      } else return 'Bad move';
      return null;
    }
    if (b.type === 'timeout') {
      if (!s.owners.X || !s.owners.O) return 'Waiting for opponent';
      if (s.winner) return 'Game over';
      if (mine === s.turn) return "It's your turn";
      if (!(b.ts - s.lastTs >= TURN_MS)) return 'Their 5 minutes are not up yet';
      s.winner = mine; s.winLine = []; s.byTime = true;
      return null;
    }
    if (b.type === 'reset') {
      if (!s.winner && (typeof b.pw !== 'string' || (await Sig.sha(b.pw)) !== RESET_HASH)) return 'Wrong password';
      Object.assign(s, newGame(s));
      return null;
    }
    return 'Unknown action';
  }

  // Longest valid prefix of a received log: signatures, chain links and rules all have to check out.
  async function validPrefix(envs) {
    const out = [], s = newGame(null);
    let prev = '0';
    for (let idx = 0; idx < envs.length && idx < MAX_LOG; idx++) {
      const env = envs[idx], v = await Sig.verify(env);
      if (!v) break;
      const b = v.body;
      if (b.room !== room || b.seq !== idx || b.prev !== prev) break;
      if (idx === 0 && (b.type !== 'join' || v.from !== host)) break;
      if (typeof b.ts !== 'number' || b.ts < (s.lastTs || 0) || b.ts > Date.now() + MAX_FUTURE) break;
      if (await apply(s, b, v.from)) break;
      s.lastTs = b.ts;
      prev = await Sig.sha(env.b);
      out.push({ env, h: prev, ts: b.ts });
    }
    return { entries: out, state: s };
  }
  // Prefer the longer history; break ties (two events at once) the same way on every client.
  const better = (a, b) => a.length !== b.length ? a.length > b.length : a.length > 0 && a[a.length - 1].h < b[b.length - 1].h;
  const same = (a, b) => a.length === b.length && (!a.length || a[a.length - 1].h === b[b.length - 1].h);

  // ---------- network ----------
  let queue = Promise.resolve();
  const serial = (fn) => (queue = queue.then(fn).catch((e) => console.error(e)));
  let repairTimer = null;
  function publish() {
    if (!client || !client.connected) { err = 'Offline — reconnecting…'; render(); return; }
    client.publish(topic, JSON.stringify({ log: log.map((e) => e.env) }), { retain: true, qos: 1 });
  }
  // Someone published an older, shorter or tampered log: put the good one back.
  function scheduleRepair() {
    clearTimeout(repairTimer);
    repairTimer = setTimeout(() => serial(publish), 800 + Math.random() * 1200);
  }
  // A history we already have can only be extended, never rewritten. The one exception is the
  // newest event while it is a few seconds old, so two events sent at the same moment settle the
  // same way for everyone.
  const extendsOurs = (a) => log.every((e, k) => (a[k] && a[k].h === e.h) || (k === log.length - 1 && Date.now() - e.ts < TIE_MS));
  async function onLog(envs) {
    const r = await validPrefix(envs);
    if (better(r.entries, log) && extendsOurs(r.entries)) { log = r.entries; S = r.state; afterUpdate(); render(); }
    else if (log.length && !same(r.entries, log)) scheduleRepair();
  }
  async function act(body) {
    if (!room) return;
    if (!log.length && me !== host) { err = 'Waiting for the person who made this room to pick a side'; return render(); }
    Object.assign(body, { room, seq: log.length, prev: log.length ? log[log.length - 1].h : '0', ts: Math.max(Date.now(), S.lastTs || 0) });
    const test = structuredClone(S);
    const e = await apply(test, body, me);
    if (e) { err = e; return render(); }
    test.lastTs = body.ts;
    const env = await Sig.sign(body);
    log.push({ env, h: await Sig.sha(env.b), ts: body.ts });
    S = test; mode = 'piece';
    afterUpdate(); render(); publish();
  }

  function connect(i = 0) {
    $('net').textContent = 'Connecting to the game relay…';
    const will = { topic: `${BASE}/lobby/${me}`, payload: JSON.stringify(closedEnv), retain: true, qos: 1 };
    client = mqtt.connect(BROKERS[i], { clientId: 'ttt_' + Sig.randomCode(14), clean: true, connectTimeout: 8000, reconnectPeriod: 3000, keepalive: 20, will });
    let ever = false;
    client.on('connect', () => {
      ever = true; online = true; $('net').textContent = 'Online · moves are signed and checked';
      client.subscribe(`${BASE}/lobby/+`, { qos: 1 });
      if (topic) client.subscribe(topic, { qos: 1 });
      if (hosting) publishLobby();
      render(); renderLobbies();
    });
    client.on('offline', () => { online = false; $('net').textContent = 'Offline — reconnecting…'; render(); renderLobbies(); });
    client.on('close', () => { if (!ever && i < BROKERS.length - 1) { client.end(true); connect(i + 1); } });
    client.on('message', (t, buf) => {
      if (buf.length > MAX_MSG) return;
      if (t.startsWith(`${BASE}/lobby/`)) { onLobby(t.slice(BASE.length + 7), buf).catch(() => {}); return; }
      if (t !== topic) return;
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (!m || !Array.isArray(m.log)) return;
      serial(() => onLog(m.log));
    });
  }

  // ---------- lobbies ----------
  const lobbies = new Map();
  let hosting = false, lobbyTimer = null, pendingJoin = null, closedEnv = null;
  async function onLobby(id, buf) {
    let env; try { env = JSON.parse(buf.toString()); } catch (e) { return; }
    const v = await Sig.verify(env);
    if (!v || v.from !== id) return; // only a lobby's own host can list or close it
    const l = v.body;
    if (l.closed || l.status !== 'open' || l.host !== id || !validRoom(l.room, l.host)) lobbies.delete(id);
    else lobbies.set(id, { room: l.room, host: id, name: cleanName(l.name) || 'Someone', created: +l.created || Date.now(), ts: +l.ts || 0 });
    renderLobbies();
  }
  const openLobbies = () => [...lobbies.values()]
    .filter((l) => l.host !== me && Date.now() - l.ts < LOBBY_TTL && l.room !== room)
    .sort((a, b) => b.created - a.created);
  async function publishLobby() {
    if (!hosting || !client || !client.connected) return;
    const env = await Sig.sign({ status: 'open', room, host: me, name: S.names.X || myName(), created: hosting, ts: Date.now() });
    if (hosting) client.publish(`${BASE}/lobby/${me}`, JSON.stringify(env), { retain: true, qos: 1 });
  }
  function closeLobby() {
    if (!hosting) return;
    hosting = false; clearInterval(lobbyTimer);
    if (client && client.connected) client.publish(`${BASE}/lobby/${me}`, JSON.stringify(closedEnv), { retain: true, qos: 1 });
  }
  // Called whenever the game state changes.
  function afterUpdate() {
    if (hosting && S.owners.X && S.owners.O) closeLobby(); // full: take it off the list
    if (pendingJoin && log.length) {
      const name = pendingJoin.name; clearTimeout(pendingJoin.timer); pendingJoin = null;
      if (!seatOf(S, me) && S.owners.X && !S.owners.O) serial(() => act({ type: 'join', seat: 'O', name }));
      else if (!seatOf(S, me)) err = 'Someone else just took that seat — you are watching';
    }
  }

  function enterRoom(r, h) {
    if (topic && client) client.unsubscribe(topic);
    room = r; host = h; topic = `${BASE}/room/${room}`;
    log = []; S = newGame(null); mode = 'piece';
    history.replaceState(null, '', `?room=${room}&host=${host}`);
    $('share').textContent = 'Or send this link to a friend: ' + location.href;
    if (client && client.connected) client.subscribe(topic, { qos: 1 });
    screen('game'); render();
  }
  function leaveRoom() {
    closeLobby();
    if (pendingJoin) { clearTimeout(pendingJoin.timer); pendingJoin = null; }
    if (topic && client) client.unsubscribe(topic);
    room = host = topic = null; log = []; S = newGame(null);
    history.replaceState(null, '', location.pathname);
    screen('lobby'); renderLobbies();
  }
  function myName() { return cleanName($('lobbyName').value) || cleanName($('name').value); }
  function rememberName(n) { try { localStorage.setItem('tttp-name', n); } catch (e) {} $('lobbyName').value = $('name').value = n; }
  function createLobby() {
    const name = myName();
    if (!name) { $('lobbyMsg').textContent = 'Enter your name first.'; $('lobbyName').focus(); return; }
    rememberName(name);
    enterRoom(Sig.randomCode(16), me);
    serial(() => act({ type: 'join', seat: 'X', name })).then(() => {
      if (seatOf(S, me) !== 'X') return;
      hosting = Date.now();
      publishLobby(); clearInterval(lobbyTimer); lobbyTimer = setInterval(publishLobby, 15000);
    });
  }
  function joinLobby(l) {
    const name = myName();
    if (!name) { $('lobbyMsg').textContent = 'Enter your name first.'; $('lobbyName').focus(); return; }
    rememberName(name);
    enterRoom(l.room, l.host);
    pendingJoin = { name, timer: setTimeout(() => {
      if (!pendingJoin) return;
      leaveRoom();
      $('lobbyMsg').textContent = `Couldn't reach ${l.name}'s game — they may have left.`;
    }, 8000) };
  }
  function renderLobbies() {
    const el = $('lobbyList');
    $('netDot').className = 'dot' + (online ? ' on' : '');
    $('netText').textContent = online ? 'Live' : 'Connecting…';
    $('createBtn').disabled = !online;
    if (!online) { el.innerHTML = '<div class="empty">Connecting to the lobby server…</div>'; return; }
    const list = openLobbies();
    if (!list.length) { el.innerHTML = '<div class="empty">No open lobbies right now. Create one and it shows up here for anyone else on this page.</div>'; return; }
    el.textContent = '';
    for (const l of list) {
      const row = document.createElement('div'), meta = document.createElement('div'), b = document.createElement('b'), sub = document.createElement('span'), btn = document.createElement('button');
      row.className = 'lobby'; meta.className = 'meta';
      const age = Math.max(0, Math.round((Date.now() - l.created) / 60000));
      b.textContent = `${l.name}'s game`;
      sub.textContent = `waiting for an opponent · ${age ? age + ' min ago' : 'just now'}`;
      btn.textContent = 'Join'; btn.className = 'primary'; btn.onclick = () => joinLobby(l);
      meta.append(b, sub);
      row.innerHTML = '<span class="dot on"></span>';
      row.append(meta, btn);
      el.append(row);
    }
  }
  setInterval(renderLobbies, 5000);
  function screen(name) {
    $('lobbyScreen').hidden = name !== 'lobby';
    $('gameScreen').hidden = name !== 'game';
    $('lobbyMsg').textContent = '';
  }

  // ---------- UI ----------
  function render() {
    const b = $('board');
    if (b.children.length !== N * N) {
      b.innerHTML = '';
      for (let i = 0; i < N * N; i++) { const d = document.createElement('div'); d.className = 'c'; d.onclick = () => clickCell(i); b.appendChild(d); }
    }
    S.board.forEach((v, i) => {
      const d = b.children[i];
      d.textContent = v === 'T' ? '▲' : (v || '');
      d.className = 'c ' + (v || '') + (S.winLine.includes(i) ? ' win' : '') + (S.last === i ? ' last' : '');
    });
    const mine = seatOf(S, me), seated = { X: !!S.owners.X, O: !!S.owners.O };
    const nm = (s) => (S.names[s] ? `${S.names[s]} (${s})` : s);
    const seats = $('seats'); seats.textContent = '';
    $('nameRow').style.display = mine ? 'none' : '';
    if (mine) seats.textContent = `You are ${nm(mine)}` + (seated.X && seated.O ? ` vs ${nm(mine === 'X' ? 'O' : 'X')}` : '');
    else for (const s of ['X', 'O']) {
      const btn = document.createElement('button');
      btn.textContent = seated[s] ? `${nm(s)} joined` : `Play as ${s}`;
      btn.disabled = seated[s] || !online;
      btn.onclick = () => join(s);
      seats.appendChild(btn);
    }
    const myTurn = mine && mine === S.turn && !S.winner && seated.X && seated.O;
    const hasTri = mine && S.tri[mine] > 0;
    if (!hasTri && mode === 'tri') mode = 'piece';
    $('bTri').disabled = !myTurn || !hasTri;
    $('bPiece').className = mode === 'piece' ? 'on' : '';
    $('bTri').className = mode === 'tri' ? 'on' : '';
    $('bReset').disabled = !mine;
    let st;
    if (!online) st = 'Connecting…';
    else if (S.winner === 'draw') st = 'Draw!';
    else if (S.winner) st = (S.winner === mine ? 'You win' : `${nm(S.winner)} wins`) + (S.byTime ? ' on time' : '') + (S.winner === mine ? '! 🎉' : '!');
    else if (!seated.X || !seated.O) st = mine ? 'Waiting for opponent…' : 'Pick a side';
    else if (myTurn) st = hasTri ? 'Your turn — ▲ available' : 'Your turn — place your piece';
    else st = mine ? `${nm(S.turn)}'s turn` : `Spectating — ${nm(S.turn)}'s turn`;
    if (!room) return;
    $('status').textContent = err ? `${st} · ${err}` : st;
    err = '';
    renderTimer();
  }
  // Turn clock: shows the time left; when the other player runs out, this client claims the win.
  let claiming = false;
  function renderTimer() {
    const t = $('timer'), mine = seatOf(S, me);
    if (!S.owners.X || !S.owners.O || S.winner || !S.lastTs) { t.textContent = ''; return; }
    const left = Math.max(0, TURN_MS - (Date.now() - S.lastTs));
    const mm = Math.floor(left / 60000), ss = String(Math.floor(left / 1000) % 60).padStart(2, '0');
    t.textContent = `${S.turn === mine ? 'Your' : `${S.names[S.turn] || S.turn}'s`} time to move: ${mm}:${ss}`;
    t.className = left < 60000 ? 'low' : '';
    if (!left && mine && mine !== S.turn && !claiming) {
      claiming = true;
      serial(() => act({ type: 'timeout' })).then(() => { claiming = false; });
    }
  }
  setInterval(renderTimer, 1000);
  function join(seat) {
    const name = cleanName($('name').value) || myName();
    if (!name) { err = 'Enter your name first'; $('name').focus(); return render(); }
    rememberName(name);
    serial(() => act({ type: 'join', seat, name }));
  }
  function clickCell(i) {
    const mine = seatOf(S, me);
    if (!mine || S.board[i] || S.winner || mine !== S.turn) return;
    const kind = mode;
    serial(() => act({ type: 'move', kind, i }));
  }
  $('bPiece').onclick = () => { mode = 'piece'; render(); };
  $('bTri').onclick = () => { mode = 'tri'; render(); };
  $('bReset').onclick = () => {
    if (!seatOf(S, me)) return;
    if (S.winner) return serial(() => act({ type: 'reset' }));
    const pw = prompt('The game is not finished yet. Enter the password to restart:');
    if (pw !== null) serial(() => act({ type: 'reset', pw }));
  };
  $('createBtn').onclick = createLobby;
  $('lobbyName').addEventListener('keydown', (e) => { if (e.key === 'Enter') createLobby(); });
  $('bLeave').onclick = () => {
    const mine = seatOf(S, me);
    if (mine && S.owners.X && S.owners.O && !S.winner && !confirm('Leave this game? You can come back with the link.')) return;
    leaveRoom();
  };
  try { $('name').value = $('lobbyName').value = localStorage.getItem('tttp-name') || ''; } catch (e) {}
  closedEnv = await Sig.sign({ closed: true, host: me });
  window.addEventListener('beforeunload', closeLobby);
  // A shared link goes straight to its game; otherwise start at the lobby list.
  const linkRoom = (qs.get('room') || '').toLowerCase(), linkHost = (qs.get('host') || '').toLowerCase();
  if (validRoom(linkRoom, linkHost)) enterRoom(linkRoom, linkHost);
  else screen('lobby');
  renderLobbies();
  connect();
})();
