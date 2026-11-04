// Message signing for the multiplayer pages.
// The games talk through a public MQTT broker that anyone can publish to, so every message is
// wrapped in an envelope signed with the sender's own ECDSA P-256 key (WebCrypto). A player's id
// is derived from their public key, so nobody can send messages, claim seats or set names as
// someone else: receivers drop anything whose signature doesn't verify.
//   envelope = { b: JSON string of the body, k: base64 raw public key, s: base64 signature over b }
window.Sig = (function () {
  const enc = new TextEncoder();
  const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
  const SIGN = { name: 'ECDSA', hash: 'SHA-256' };
  const MAX_BODY = 20000;
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
  const sha = async (data) => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data));
  const idOf = async (raw) => (await sha(raw)).slice(0, 24);

  let priv = null, pub = null, myId = null;

  // storeKey: localStorage key to keep the identity across reloads (null = new identity per page load)
  async function init(storeKey) {
    let saved = null;
    try { if (storeKey) saved = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch (e) {}
    if (saved && saved.priv && saved.pub) {
      try {
        priv = await crypto.subtle.importKey('jwk', saved.priv, ALG, false, ['sign']);
        pub = saved.pub;
      } catch (e) { saved = null; }
    }
    if (!saved || !priv) {
      const kp = await crypto.subtle.generateKey(ALG, true, ['sign', 'verify']);
      priv = kp.privateKey;
      pub = b64(await crypto.subtle.exportKey('raw', kp.publicKey));
      if (storeKey) {
        try { localStorage.setItem(storeKey, JSON.stringify({ priv: await crypto.subtle.exportKey('jwk', kp.privateKey), pub })); } catch (e) {}
      }
    }
    myId = await idOf(unb64(pub));
    return myId;
  }

  async function sign(body) {
    const b = JSON.stringify(body);
    const s = await crypto.subtle.sign(SIGN, priv, enc.encode(b));
    return { b, k: pub, s: b64(s) };
  }

  const keys = new Map();   // public key -> { key, id }
  const checked = new Map(); // signature -> verified result (or null), so replays aren't re-verified
  // -> { body, from } when the signature is valid, else null
  async function verify(env) {
    if (!env || typeof env.b !== 'string' || typeof env.k !== 'string' || typeof env.s !== 'string') return null;
    if (env.b.length > MAX_BODY || env.k.length > 200 || env.s.length > 200) return null;
    const memo = checked.get(env.s);
    if (memo !== undefined) return memo && memo.b === env.b && memo.k === env.k ? memo.res : null;
    let res = null;
    try {
      let k = keys.get(env.k);
      if (!k) {
        const raw = unb64(env.k);
        k = { key: await crypto.subtle.importKey('raw', raw, ALG, false, ['verify']), id: await idOf(raw) };
        keys.set(env.k, k);
      }
      if (await crypto.subtle.verify(SIGN, k.key, unb64(env.s), enc.encode(env.b))) {
        const body = JSON.parse(env.b);
        if (body && typeof body === 'object') res = { body, from: k.id };
      }
    } catch (e) { res = null; }
    if (checked.size > 5000) checked.clear();
    checked.set(env.s, { b: env.b, k: env.k, res });
    return res;
  }

  // unguessable room/lobby codes
  function randomCode(n) {
    const a = 'abcdefghijkmnpqrstuvwxyz23456789', r = crypto.getRandomValues(new Uint8Array(n));
    return [...r].map((x) => a[x % a.length]).join('');
  }

  return { init, sign, verify, sha, randomCode, get id() { return myId; } };
})();
