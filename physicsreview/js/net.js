// Realtime transport for the 1v1 mode.
// The site is static (no backend), so lobbies and game messages go through a public
// MQTT broker over WebSockets. Lobbies are retained messages on lobby/<id>; each game
// has its own topic. The broker forgets a lobby when the host disconnects (last will).
window.PRNet = (function () {
  const BASE = 'suyogbhandari-physicsreview/v1';
  const BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
  ];
  const LOBBY_TTL = 45000; // a lobby with no heartbeat for this long is treated as gone

  const myId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  let client = null;
  let brokerIdx = 0;
  const handlers = { status: [], lobbies: [], game: [] };
  const lobbies = new Map();
  let gameTopic = null;

  function emit(kind, data) { handlers[kind].forEach((fn) => fn(data)); }
  function on(kind, fn) { handlers[kind].push(fn); }

  function connect() {
    const url = BROKERS[brokerIdx];
    emit('status', { state: 'connecting', url });
    client = mqtt.connect(url, {
      clientId: 'pr_' + myId,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 3000,
      keepalive: 20,
      will: { topic: `${BASE}/lobby/${myId}`, payload: '', retain: true, qos: 1 },
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
    client.on('message', (topic, buf) => {
      const text = buf.toString();
      if (topic.startsWith(`${BASE}/lobby/`)) {
        const id = topic.slice(`${BASE}/lobby/`.length);
        if (!text) lobbies.delete(id);
        else {
          try { lobbies.set(id, JSON.parse(text)); } catch (e) { return; }
        }
        emit('lobbies', listLobbies());
      } else if (topic === gameTopic) {
        let msg;
        try { msg = JSON.parse(text); } catch (e) { return; }
        if (msg.from === myId) return; // MQTT echoes our own publishes
        emit('game', msg);
      }
    });
  }

  function listLobbies() {
    const now = Date.now();
    return [...lobbies.values()]
      .filter((l) => l && l.status === 'open' && now - l.ts < LOBBY_TTL)
      .sort((a, b) => b.created - a.created);
  }

  // ---- lobby (host side) ----
  let lobbyTimer = null;
  let lobbyInfo = null;
  function openLobby(info) {
    lobbyInfo = { ...info, id: myId, hostId: myId, status: 'open', created: Date.now() };
    const pub = () => {
      lobbyInfo.ts = Date.now();
      client.publish(`${BASE}/lobby/${myId}`, JSON.stringify(lobbyInfo), { retain: true, qos: 1 });
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
    if (client) client.publish(`${BASE}/lobby/${myId}`, '', { retain: true, qos: 1 });
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
  function send(msg) {
    if (!client || !gameTopic) return;
    client.publish(gameTopic, JSON.stringify({ ...msg, from: myId, t: Date.now() }), { qos: 1 });
  }

  // Re-filter stale lobbies periodically even if no messages arrive.
  setInterval(() => emit('lobbies', listLobbies()), 5000);
  window.addEventListener('beforeunload', closeLobby);

  return { myId, connect, on, openLobby, closeLobby, joinGame, leaveGame, send, listLobbies };
})();
