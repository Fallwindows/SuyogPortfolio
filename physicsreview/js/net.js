// Realtime transport for the 1v1 mode.
// The site is static (no backend), so lobbies and game messages go through a public
// MQTT broker over WebSockets. Lobbies are retained messages on lobby/<host id> that the host
// refreshes; while a match runs the record also carries its seed and progress, so a player
// who drops can rejoin. A lobby nobody has refreshed for LOBBY_TTL is treated as gone.
// Each game has its own topic.
// Anyone can publish to a public broker, so every message is signed (js/sig.js): a player's
// id is their key's fingerprint, and messages that don't verify, claim another player's
// lobby, belong to another game or are replays are dropped before the game sees them.
// The key is kept across reloads (one per open tab), so a reloaded player is provably the
// same player and keeps their seat.
window.PRNet = (function () {
  const BASE = (window.PR_SITE && PR_SITE.net) || 'suyogbhandari-physicsreview/v2';
  const BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
  ];
  const LOBBY_TTL = 15 * 60 * 1000; // lobbies stay listed (and matches rejoinable) this long after the last refresh
  const MAX_SKEW = 120000; // game messages older than this are treated as replays
  const MAX_MSG = 30000;

  // Each open tab holds a lock on one key slot for its lifetime, so a reload gets the same
  // identity back while a second tab gets a different one.
  function claimSlot() {
    if (!navigator.locks) return Promise.resolve(0);
    return new Promise((resolve) => {
      const tryN = (n) => {
        if (n >= 8) { resolve(null); return; }
        navigator.locks.request(PR.key('duel-slot-' + n), { ifAvailable: true }, (lock) => {
          if (!lock) { tryN(n + 1); return; }
          resolve(n);
          return new Promise(() => {}); // held until the tab closes or reloads
        }).catch(() => resolve(null));
      };
      tryN(0);
    });
  }

  let myId = null;
  const ready = claimSlot()
    .then((n) => Sig.init(n == null ? null : PR.key('duel-key-' + n)))
    .then((id) => { myId = id; api.myId = id; return id; });
  let client = null;
  let brokerIdx = 0;
  const handlers = { status: [], lobbies: [], game: [] };
  const lobbies = new Map();
  let gameTopic = null;
  const seen = new Set(); // signatures of game messages already delivered

  function emit(kind, data) { handlers[kind].forEach((fn) => fn(data)); }
  function on(kind, fn) { handlers[kind].push(fn); }

  async function connect() {
    await ready;
    const url = BROKERS[brokerIdx];
    emit('status', { state: 'connecting', url });
    // No last will: a dropped host's lobby stays listed (as away) so they can come back to it.
    client = mqtt.connect(url, {
      clientId: 'pr_' + Sig.randomCode(14),
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 3000,
      keepalive: 20,
    });
    let everConnected = false;
    client.on('connect', () => {
      everConnected = true;
      client.subscribe(`${BASE}/lobby/+`, { qos: 1 });
      if (gameTopic) client.subscribe(gameTopic, { qos: 1 });
      if (lobbyInfo) pubLobby();
      emit('status', { state: 'online', url });
    });
    client.on('reconnect', () => emit('status', { state: 'connecting', url }));
    client.on('offline', () => emit('status', { state: 'offline', url }));
    client.on('error', () => emit('status', { state: 'error', url }));
    client.on('close', () => {
      // Broker unreachable on first try: fall back to the next one.
      if (!everConnected && brokerIdx < BROKERS.length - 1) {
        client.end(true);
        brokerIdx++;
        connect();
      }
    });
    client.on('message', (topic, buf) => { onMessage(topic, buf).catch(() => {}); });
  }

  async function onMessage(topic, buf) {
    if (buf.length > MAX_MSG) return;
    let env;
    try { env = JSON.parse(buf.toString()); } catch (e) { return; }
    const v = await Sig.verify(env);
    if (!v) return; // unsigned, forged or tampered
    const msg = v.body;
    if (topic.startsWith(`${BASE}/lobby/`)) {
      const id = topic.slice(`${BASE}/lobby/`.length);
      if (v.from !== id) return; // only the host can publish or close their own lobby
      if (msg.closed) lobbies.delete(id);
      else lobbies.set(id, { ...msg, id, hostId: id });
      emit('lobbies', listLobbies());
    } else if (topic === gameTopic) {
      if (v.from === myId) return; // MQTT echoes our own publishes
      if (msg.topic !== gameTopic || typeof msg.t !== 'number' || Math.abs(Date.now() - msg.t) > MAX_SKEW) return;
      if (seen.has(env.s)) return; // replayed message
      if (seen.size > 5000) seen.clear();
      seen.add(env.s);
      emit('game', { ...msg, from: v.from });
    }
  }

  function listLobbies() {
    const now = Date.now();
    return [...lobbies.values()]
      .filter((l) => l && (l.status === 'open' || l.status === 'playing') && typeof l.ts === 'number' && now - l.ts < LOBBY_TTL)
      .sort((a, b) => b.created - a.created);
  }

  // ---- lobby (host side) ----
  // info is an object, or a function returning one, re-read on every refresh so the
  // record tracks the live match.
  let lobbyTimer = null;
  let lobbyInfo = null;
  let lobbyQueue = Promise.resolve(); // signing is async; publish records in the order they were made
  function pubLobby() {
    if (!lobbyInfo || !client || !client.connected) return;
    const info = typeof lobbyInfo === 'function' ? lobbyInfo() : lobbyInfo;
    const body = { status: 'open', created: Date.now(), ...info, id: myId, hostId: myId, ts: Date.now() };
    lobbyQueue = lobbyQueue.then(() => Sig.sign(body))
      .then((env) => client.publish(`${BASE}/lobby/${myId}`, JSON.stringify(env), { retain: true, qos: 1 }))
      .catch(() => {});
  }
  function openLobby(info) {
    lobbyInfo = info;
    pubLobby();
    clearInterval(lobbyTimer);
    lobbyTimer = setInterval(pubLobby, 10000);
    joinGame(myId);
  }
  function refreshLobby() { pubLobby(); }
  function closeLobby() {
    clearInterval(lobbyTimer);
    lobbyTimer = null;
    lobbyInfo = null;
    if (!client || !myId) return;
    lobbyQueue = lobbyQueue.then(() => Sig.sign({ closed: true, id: myId }))
      .then((env) => client.publish(`${BASE}/lobby/${myId}`, JSON.stringify(env), { retain: true, qos: 1 }))
      .catch(() => {});
  }

  // ---- game channel ----
  function joinGame(lobbyId) {
    if (gameTopic && client) client.unsubscribe(gameTopic);
    gameTopic = `${BASE}/game/${lobbyId}`;
    if (client && client.connected) client.subscribe(gameTopic, { qos: 1 });
  }
  function leaveGame() {
    if (gameTopic && client) client.unsubscribe(gameTopic);
    gameTopic = null;
  }
  let sendQueue = Promise.resolve(); // signing is async; keep messages in the order they were sent
  function send(msg) {
    if (!client || !gameTopic) return;
    const topic = gameTopic, body = { ...msg, topic, t: Date.now(), nonce: Sig.randomCode(8) };
    sendQueue = sendQueue.then(() => Sig.sign(body))
      .then((env) => client.publish(topic, JSON.stringify(env), { qos: 1 }))
      .catch(() => {});
  }

  // Re-filter stale lobbies periodically even if no messages arrive.
  setInterval(() => emit('lobbies', listLobbies()), 5000);

  const api = { myId, ready, connect, on, openLobby, refreshLobby, closeLobby, joinGame, leaveGame, send, listLobbies };
  return api;
})();
