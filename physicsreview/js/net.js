// Realtime transport for the 1v1 mode.
// The site is static (no backend), so lobbies and game messages go through a public
// MQTT broker over WebSockets. Lobbies are retained messages on lobby/<id>; each game
// has its own topic. The broker forgets a lobby when the host disconnects (last will).
// Anyone can publish to a public broker, so every message is signed (js/sig.js): a player's
// id is their key's fingerprint, and messages that don't verify, claim another player's
// lobby, belong to another game or are replays are dropped before the game sees them.
window.PRNet = (function () {
  const BASE = 'suyogbhandari-physicsreview/v2';
  const BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
  ];
  const LOBBY_TTL = 45000; // a lobby with no heartbeat for this long is treated as gone
  const MAX_SKEW = 120000; // game messages older than this are treated as replays
  const MAX_MSG = 30000;

  let myId = null;
  const ready = Sig.init(null).then((id) => { myId = id; api.myId = id; return id; });
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
    const will = await Sig.sign({ closed: true, id: myId });
    client = mqtt.connect(url, {
      clientId: 'pr_' + Sig.randomCode(14),
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 3000,
      keepalive: 20,
      will: { topic: `${BASE}/lobby/${myId}`, payload: JSON.stringify(will), retain: true, qos: 1 },
    });
    let everConnected = false;
    client.on('connect', () => {
      everConnected = true;
      emit('status', { state: 'online', url });
      client.subscribe(`${BASE}/lobby/+`, { qos: 1 });
      if (gameTopic) client.subscribe(gameTopic, { qos: 1 });
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
      .filter((l) => l && l.status === 'open' && typeof l.ts === 'number' && now - l.ts < LOBBY_TTL)
      .sort((a, b) => b.created - a.created);
  }

  // ---- lobby (host side) ----
  let lobbyTimer = null;
  let lobbyInfo = null;
  function openLobby(info) {
    lobbyInfo = { ...info, id: myId, hostId: myId, status: 'open', created: Date.now() };
    const pub = async () => {
      if (!lobbyInfo) return;
      lobbyInfo.ts = Date.now();
      const env = await Sig.sign(lobbyInfo);
      client.publish(`${BASE}/lobby/${myId}`, JSON.stringify(env), { retain: true, qos: 1 });
    };
    pub();
    clearInterval(lobbyTimer);
    lobbyTimer = setInterval(pub, 15000);
    joinGame(myId);
    return lobbyInfo;
  }
  function closeLobby() {
    clearInterval(lobbyTimer);
    lobbyTimer = null;
    lobbyInfo = null;
    if (client && myId) Sig.sign({ closed: true, id: myId }).then((env) => client.publish(`${BASE}/lobby/${myId}`, JSON.stringify(env), { retain: true, qos: 1 }));
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
  window.addEventListener('beforeunload', closeLobby);

  const api = { myId, ready, connect, on, openLobby, closeLobby, joinGame, leaveGame, send, listLobbies };
  return api;
})();
