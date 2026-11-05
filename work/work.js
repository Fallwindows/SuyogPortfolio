// Before/after animations on /work, drawn as pixel art. Each scene is drawn at 1/PX resolution
// and scaled up without smoothing; labels go on top at full resolution so they stay readable.
// A slider on each figure crossfades between the "before" and "after" scene.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PX = 3;
  const FONT = '"Press Start 2P", monospace';
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = (k) => k * k * (3 - 2 * k);
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const C = {
    night: '#1d1b33', ink: '#f4f4f4', muted: '#9a99c2', rule: '#3b3866', dark: '#141228',
    orange: '#ff8a3d', red: '#ff3f5b', yellow: '#ffd23f', green: '#5ad16b', blue: '#3a7bd5',
    boxBody: '#c8894b', boxEdge: '#6e4426', boxTape: '#f2c27b', boxLabel: '#fff4dc', boxInk: '#2b1a0e',
    machine: '#4b4e6d', machineEdge: '#2a2b45', gear: '#8486b8', dest: '#8d8fa8', destEdge: '#2a2b45',
    coinEdge: '#b8860b', belt: '#2a2b45', beltMark: '#6c6fa0',
    grass: '#3f7d47', grassDark: '#356a3c', road: '#4b4e6d', roadEdge: '#2e2f48', sand: '#d9c48a',
    sea: '#2a5bd7', wave: '#6fa8ff', stone: '#9a9cb5', stoneHi: '#c4c6da', stoneEdge: '#4b4e6d', dirt: '#6b5b3e',
  };

  // ---------- low-res drawing helpers (scene coordinates) ----------
  function rect(ctx, x, y, w, h, fill, stroke, lw = 2) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw); }
  }
  function disc(ctx, x, y, r, fill, stroke, lw = 2) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function rock(ctx, cx, cy, r, seed, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    const pts = [];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = r * (0.82 + 0.18 * hash(seed * 13 + i)); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.fillStyle = C.stone; ctx.fill(); ctx.strokeStyle = C.stoneEdge; ctx.lineWidth = 3; ctx.stroke();
    disc(ctx, cx - r * 0.28, cy - r * 0.3, r * 0.36, C.stoneHi);
    disc(ctx, cx + r * 0.3, cy + r * 0.25, r * 0.12, C.stoneEdge);
    ctx.restore();
  }
  function gear(ctx, x, y, r, ang, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
    for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-r * 0.16, -r * 1.22, r * 0.32, r * 0.4); }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Top-down truck facing right; (x, y) is the rear end of the bed at the truck's centre line.
  function truck(ctx, x, y, w, h, body, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    const bedL = w * 0.66;
    for (const wx of [x + 6, x + bedL - 16, x + w - 14]) { rect(ctx, wx, y - h / 2 - 3, 10, 4, C.dark); rect(ctx, wx, y + h / 2 - 1, 10, 4, C.dark); }
    rect(ctx, x, y - h / 2, bedL, h, body, C.dark, 2);
    rect(ctx, x + 4, y - h / 2 + 4, bedL - 8, h - 8, 'rgba(0,0,0,.18)');
    rect(ctx, x + bedL + 2, y - h / 2 + 2, w - bedL - 2, h - 4, C.orange, C.dark, 2);
    rect(ctx, x + w - 8, y - h / 2 + 5, 4, h - 10, '#9fd3ff');
    ctx.restore();
  }
  function cardboard(ctx, T, x, yb, w, h, label, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    const y = yb - h;
    rect(ctx, x, y, w, h, C.boxBody, C.boxEdge, 2);
    ctx.fillStyle = C.boxEdge; ctx.fillRect(x, y + h * 0.2, w, 2);
    ctx.fillStyle = C.boxTape; ctx.fillRect(x + w / 2 - w * 0.08, y, w * 0.16, h * 0.42);
    if (label) {
      const lh = Math.max(10, h * 0.36);
      rect(ctx, x + 4, yb - lh - 4, w - 8, lh, C.boxLabel);
      T(label, x + w / 2, yb - 4 - lh / 2 + 0.5, { size: Math.min(10, lh - 2), color: C.boxInk, align: 'center', base: 'middle', max: w - 12 });
    }
    ctx.restore();
  }
  function meter(ctx, x0, x1, y, val, limit, fill = C.orange) {
    const w = x1 - x0, f = w * Math.min(1, val);
    rect(ctx, x0, y, w, 10, C.rule);
    rect(ctx, x0, y, Math.max(6, f), 10, fill);
    if (limit != null) {
      const lx = x0 + w * limit;
      if (x0 + f > lx) rect(ctx, lx, y, x0 + f - lx, 10, C.red);
      rect(ctx, lx - 1, y - 6, 3, 22, C.ink);
    }
  }

  // ---------- figure shell: slider, pixel pipeline, text overlay ----------
  function figure(fig, scene) {
    const canvas = fig.querySelector('canvas'), input = fig.querySelector('input[type=range]'), ctx = canvas.getContext('2d');
    const [lo, hi] = [...fig.querySelectorAll('.viz-slider span')].map((el) => el.textContent);
    const off = document.createElement('canvas'), octx = off.getContext('2d');
    const st = { beforeStart: 100, after: false };
    let W = 0, H = 0, dpr = 1, v = Number(input.value) / 100, t = 100, last = performance.now(), visible = true;
    function size() {
      dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth; if (!W) return;
      H = Math.round(clamp(W * scene.aspect, scene.minH, scene.maxH));
      canvas.style.height = H + 'px'; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      off.width = Math.ceil(W / PX); off.height = Math.ceil(H / PX);
    }
    function onInput() {
      const after = Number(input.value) >= 50;
      fig.classList.toggle('is-after', after);
      input.setAttribute('aria-valuetext', after ? hi : lo);
    }
    input.addEventListener('input', onInput); onInput();
    new ResizeObserver(size).observe(canvas); size();
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (visible && W) {
        t += dt * (reduce ? 0.3 : 1);
        const after = Number(input.value) >= 50;
        if (!after && st.after) st.beforeStart = t; // the backlog / wasted count restarts each time "before" comes back
        st.after = after;
        v += (Number(input.value) / 100 - v) * Math.min(1, dt * 6);
        const texts = [];
        let clipX = null;
        const T = (s, x, y, o = {}) => texts.push({ s, x, y, o, alpha: octx.globalAlpha, clipX });
        T.clip = (x) => { clipX = x; };
        octx.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
        octx.globalAlpha = 1;
        scene.draw(octx, T, W, H, t, ease(clamp(v, 0, 1)), st);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, off.width * PX * dpr, off.height * PX * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const it of texts) {
          if (it.alpha <= 0.01) continue;
          ctx.save();
          if (it.clipX != null) { ctx.beginPath(); ctx.rect(0, 0, it.clipX, H); ctx.clip(); }
          ctx.globalAlpha = it.alpha;
          let size = (it.o.size || 10) * 0.85;
          ctx.font = `${size}px ${FONT}`;
          if (it.o.max) while (size > 5 && ctx.measureText(it.s).width > it.o.max) { size -= 0.5; ctx.font = `${size}px ${FONT}`; }
          ctx.textAlign = it.o.align || 'left'; ctx.textBaseline = it.o.base || 'alphabetic';
          if (it.o.outline) { ctx.lineWidth = 4; ctx.strokeStyle = C.dark; ctx.lineJoin = 'round'; ctx.strokeText(it.s, it.x, it.y); }
          ctx.fillStyle = it.o.color || C.ink; ctx.fillText(it.s, it.x, it.y);
          ctx.restore();
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ======================= Pren: boulders down the road =======================
  const pren = {
    aspect: 0.7, minH: 360, maxH: 430,
    draw(ctx, T, W, H, t, v, st) {
      const a = 1 - v, narrow = W < 480;
      const roadY = H * 0.34, roadH = 38, roadMid = roadY + roadH / 2;
      const meterTop = H - 46, seaTop = H * 0.68;
      const lot = { x0: W * 0.56, x1: W * 0.78, y0: roadY + roadH + 8, y1: seaTop - 14 };
      const lotCx = (lot.x0 + lot.x1) / 2, lotCy = (lot.y0 + lot.y1) / 2;
      const tw = Math.min(124, W * 0.24), th = 30, bedL = tw * 0.66, r = Math.min(30, (lot.y1 - lot.y0) * 0.42);

      // land, sea, road
      rect(ctx, 0, 0, W, H, C.grass);
      for (let i = 0; i < 40; i++) rect(ctx, hash(i) * W, hash(i + 70) * H * 0.9, 9, 6, C.grassDark);
      rect(ctx, W * 0.34, seaTop - 8, W, 10, C.sand);
      rect(ctx, W * 0.36, seaTop, W, meterTop - seaTop, C.sea);
      for (let i = 0; i < 14; i++) {
        const wx = ((hash(i) * W + t * 12 * (i % 2 ? 1 : -1)) % (W * 0.64) + W * 0.64) % (W * 0.64) + W * 0.36;
        rect(ctx, wx, seaTop + 10 + hash(i + 9) * (meterTop - seaTop - 20), 14, 3, C.wave);
      }
      rect(ctx, 0, roadY, W, roadH, C.road);
      rect(ctx, 0, roadY - 3, W, 3, C.roadEdge); rect(ctx, 0, roadY + roadH, W, 3, C.roadEdge);
      for (let x = 8; x < W; x += 30) rect(ctx, x, roadMid - 2, 14, 4, C.yellow);

      // database (left) with its quarry, app (right) with its lot
      const top = narrow ? 30 : H * 0.05, capY = narrow ? 18 : roadY - 14, capMax = narrow ? W - 16 : null;
      const db = { x0: 8, x1: Math.max(110, W * 0.2), y0: top, y1: roadY - 8 };
      rect(ctx, db.x0, db.y0, db.x1 - db.x0, db.y1 - db.y0, '#5b5f8a', C.dark, 3);
      for (let i = 0; i < 3; i++) { // stacked-disk database icon on the roof
        const cy = db.y0 + 18 + i * 14, cx = (db.x0 + db.x1) / 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, (db.x1 - db.x0) * 0.28, 6, 0, 0, Math.PI * 2); ctx.fillStyle = i ? '#7c80b0' : '#9da1d0'; ctx.fill();
        ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.stroke();
      }
      T('DATABASE', (db.x0 + db.x1) / 2, db.y1 - 10, { size: 10, align: 'center', outline: true, max: db.x1 - db.x0 - 6 });
      const pit = { x0: 8, x1: W * 0.3, y0: roadY + roadH + 10, y1: seaTop + 20 };
      rect(ctx, pit.x0, pit.y0, pit.x1 - pit.x0, pit.y1 - pit.y0, C.dirt, C.dark, 2);
      for (let i = 0; i < 5; i++) rock(ctx, pit.x0 + 22 + i * ((pit.x1 - pit.x0 - 40) / 4), pit.y0 + 22 + (i % 2) * 22, 15, i + 20);
      T('all the data', (pit.x0 + pit.x1) / 2, pit.y1 - 6, { size: 8, align: 'center', outline: true, max: pit.x1 - pit.x0 - 6 });

      const app = { x0: W * 0.8, x1: W - 8, y0: top, y1: roadY - 8 };
      rect(ctx, app.x0, app.y0, app.x1 - app.x0, app.y1 - app.y0, '#c94f4f', C.dark, 3);
      for (let i = 0; i < 3; i++) rect(ctx, app.x0 + 8, app.y0 + 10 + i * 12, app.x1 - app.x0 - 16, 4, '#a63e3e');
      T('APP', (app.x0 + app.x1) / 2, app.y1 - 10, { size: 10, align: 'center', outline: true });
      rect(ctx, lot.x0, lot.y0, lot.x1 - lot.x0, lot.y1 - lot.y0, C.dirt);
      for (let x = lot.x0; x <= lot.x1; x += 12) { rect(ctx, x, lot.y0 - 2, 4, 4, C.sand); rect(ctx, x, lot.y1 - 2, 4, 4, C.sand); }
      T("app's copy", lot.x0 + 4, lot.y0 + 12, { size: 7, outline: true });

      // ---- before: a truck hauls the whole database; the copy already in the lot goes in the sea ----
      const T0 = 4.2, s0 = t % T0, arrive = 2.0, drop = 0.8;
      const oldGoing = s0 >= arrive && s0 < arrive + drop;
      const stored = a * (s0 < arrive || s0 >= arrive + drop ? 1 : 0) + v;
      rock(ctx, lotCx, lotCy, r, 3, stored);
      if (a > 0.01) {
        ctx.save(); ctx.globalAlpha = a;
        const startX = db.x1 - 10, stopX = lotCx - bedL / 2;
        let tx;
        if (s0 < arrive) tx = lerp(startX, stopX, ease(s0 / arrive));
        else if (s0 < arrive + drop) tx = stopX;
        else tx = lerp(stopX, W + 20, Math.pow((s0 - arrive - drop) / (T0 - arrive - drop), 1.6));
        truck(ctx, tx, roadMid, tw, th, C.yellow);
        if (s0 < arrive) rock(ctx, tx + bedL / 2, roadMid, r, 3);
        if (oldGoing) {
          const k = (s0 - arrive) / drop;
          rock(ctx, lotCx, lerp(roadMid, lotCy, ease(k)), r, 3);           // new boulder drops into the lot
          rock(ctx, lotCx, lerp(lotCy, seaTop + 26, k * k), r, 3, 1 - k * 0.4); // old one shoved into the sea
        }
        const sp = (s0 - arrive - drop * 0.75) / 0.9;
        if (sp > 0 && sp < 1) {
          const sx = lotCx, sy = seaTop + 30;
          ctx.globalAlpha = a * (1 - sp);
          ctx.beginPath(); ctx.ellipse(sx, sy, 12 + sp * 40, 5 + sp * 12, 0, 0, Math.PI * 2); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
          for (let i = 0; i < 7; i++) { const ang = Math.PI + (i / 6) * Math.PI; rect(ctx, sx + Math.cos(ang) * sp * 44, sy + Math.sin(ang) * sp * 34 + sp * sp * 30, 5, 5, '#ffffff'); }
          ctx.globalAlpha = a;
        }
        const wasted = Math.max(0, Math.floor((t - st.beforeStart - arrive - drop * 0.75) / T0) + 1);
        const seaCx = (W * 0.36 + W) / 2 + (narrow ? 0 : W * 0.06);
        T('WASTED EGRESS', seaCx, seaTop + 30, { size: narrow ? 9 : 11, color: '#ffffff', align: 'center', outline: true });
        T(`${wasted} boulder${wasted === 1 ? '' : 's'} in the sea`, seaCx, seaTop + 48, { size: 8, color: C.yellow, align: 'center', outline: true });
        T('every single run hauls the WHOLE database again', W / 2, capY, { size: 9, align: 'center', outline: true, max: capMax || app.x0 - db.x1 - 12 });
        ctx.restore();
      }

      // ---- after: a pickup checks the version; small loads only when something changed ----
      if (v > 0.01) {
        ctx.save(); ctx.globalAlpha = v;
        const T1 = 4.6, c = Math.floor(t / T1), s = t - c * T1, changed = c % 2 === 1;
        const dbVer = 40 + Math.floor((c + 1) / 2), synced = !changed || s >= 3.8, appVer = synced ? dbVer : dbVer - 1;
        T('v' + dbVer, db.x1 - 6, db.y0 + 12, { size: 8, color: C.yellow, align: 'right', outline: true });
        T('v' + appVer, app.x1 - 6, app.y0 + 12, { size: 8, color: C.yellow, align: 'right', outline: true });
        const startX = db.x1 - 10, checkX = app.x0 - tw * 0.5 - 8;
        const pw = tw * 0.42;
        let px = null;
        if (s < 1.3) px = lerp(startX, checkX, ease(s / 1.3));
        else if (s < 1.9) px = checkX;
        else if (s < 3.1) px = lerp(checkX, W + 20, (s - 1.9) / 1.2);
        if (px != null) {
          truck(ctx, px, roadMid - 6, pw, 20, C.blue);
          T('v' + dbVer, px + pw * 0.33, roadMid - 2, { size: 7, color: '#ffffff', align: 'center', outline: true });
        }
        // rows added next to the boulder, never replacing it
        const done = Math.floor(c / 2) + (changed && s >= 3.8 ? 1 : 0), n = done ? ((done - 1) % 4) + 1 : 0;
        const slot = (i) => [lot.x0 + 14 + (i % 2) * (lot.x1 - lot.x0 - 28), lot.y0 + 16 + Math.floor(i / 2) * (lot.y1 - lot.y0 - 32)];
        for (let i = 0; i < n; i++) { const [sx, sy] = slot(i); rock(ctx, sx, sy, 7, 50 + i); }
        if (changed && s >= 2.0) {
          const gw = tw * 0.55, stopX = lotCx - gw * 0.33;
          let gx;
          if (s < 3.2) gx = lerp(startX, stopX, ease((s - 2) / 1.2));
          else if (s < 3.8) gx = stopX;
          else gx = lerp(stopX, W + 20, (s - 3.8) / 0.8);
          truck(ctx, gx, roadMid + 6, gw, 22, C.green);
          if (s < 3.2) rock(ctx, gx + gw * 0.33, roadMid + 6, 7, 60);
          else if (s < 3.8) { const k = (s - 3.2) / 0.6, [sx, sy] = slot(n % 4); rock(ctx, lerp(gx + gw * 0.33, sx, k), lerp(roadMid + 6, sy, ease(k)), 7, 60); }
        }
        let msg;
        if (!changed) msg = s < 1.3 ? 'check one small number first' : `v${dbVer} = v${appVer} · nothing to haul`;
        else if (s < 1.3) msg = 'check one small number first';
        else if (s < 2.0) msg = `v${appVer} < v${dbVer} · check each store`;
        else if (s < 3.2) msg = 'only store 1 changed';
        else if (s < 3.8) msg = 'haul just its new rows';
        else msg = `synced to v${dbVer}`;
        T(msg, W / 2, capY, { size: 9, color: C.yellow, align: 'center', outline: true, max: capMax || app.x0 - db.x1 - 12 });
        const seaCx = (W * 0.36 + W) / 2 + (narrow ? 0 : W * 0.06);
        T('WASTED EGRESS', seaCx, seaTop + 30, { size: narrow ? 9 : 11, color: '#ffffff', align: 'center', outline: true });
        T('0 boulders in the sea', seaCx, seaTop + 48, { size: 8, color: C.green, align: 'center', outline: true });
        ctx.restore();
      }

      // egress meter
      rect(ctx, 0, meterTop, W, H - meterTop, C.night);
      const val = lerp(1 + 0.03 * Math.sin(t * 3), 0.06, v), limit = 0.62;
      T(narrow ? 'Egress' : 'Data hauled out of the database (egress)', 12, meterTop + 15, { size: 8, color: C.muted, max: (W - 24) * limit - 10 });
      meter(ctx, 12, W - 12, meterTop + 24, val, limit);
      T('limit', 12 + (W - 24) * limit + 6, meterTop + 15, { size: 8 });
      if (a > 0.5) T('over limit', W - 12, meterTop + 15, { size: 8, color: C.red, align: 'right' });
    },
  };

  // ======================= Persona: factory line =======================
  const INBOX = ['email', 'promo', 'message', 'calendar', 'newsletter', 'receipt', 'email', 'reminder', 'promo', 'doc share', 'message', 'email'];
  const ROUTES = { email: ['memory', 'action'], message: ['memory', 'action'], calendar: ['memory', 'future'], reminder: ['future'], receipt: ['memory'], 'doc share': ['memory'], promo: [], newsletter: [] };
  const labelOf = (id) => INBOX[((id % INBOX.length) + INBOX.length) % INBOX.length];
  function coins(ctx, pts, t, every) {
    ctx.save(); ctx.globalAlpha *= 0.35; ctx.strokeStyle = C.yellow; ctx.lineWidth = 20; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    for (let age = t % every; age * 110 < L; age += every) {
      let d = age * 110;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], seg = Math.hypot(x1 - x0, y1 - y0);
        if (d <= seg) { const x = lerp(x0, x1, d / seg), y = lerp(y0, y1, d / seg); disc(ctx, x, y, 7, C.yellow, C.coinEdge, 2); rect(ctx, x - 1, y - 4, 2, 8, C.coinEdge); break; }
        d -= seg;
      }
    }
  }
  const persona = {
    aspect: 0.56, minH: 330, maxH: 370,
    draw(ctx, T, W, H, t, v, st) {
      const a = 1 - v, narrow = W < 480;
      const beltY = H * 0.72, xIn = Math.round(W * (narrow ? 0.3 : 0.38));
      const bw = Math.min(64, W * 0.16), bh = bw * 0.7, speed = 46, spacing = bw + 22, pos = t * speed;
      rect(ctx, 0, 0, W, H, C.night);
      for (let i = 0; i < 40; i++) rect(ctx, hash(i) * W, hash(i + 50) * H, 3, 3, '#2a2850');
      rect(ctx, -4, beltY, xIn + 8, 12, C.belt);
      for (let x = (pos % 24) - 24; x < xIn; x += 24) rect(ctx, x, beltY + 5, 8, 2, C.beltMark);
      T("Zach's money spent", 6, 16, { size: 9, color: C.muted });
      meter(ctx, 6, 126, 24, lerp(0.94, 0.16, v), null, C.yellow);

      // ---- before: one slow, expensive agent takes every box; the line backs up ----
      if (a > 0.01) {
        ctx.save(); ctx.globalAlpha = a;
        const SERVICE = 4.5, mouth = xIn - bw, gap = 3;
        const id0 = Math.ceil((st.beforeStart * speed - mouth) / spacing);
        const ta0 = (mouth + id0 * spacing) / speed;
        const served = id0 + Math.max(0, t - ta0) / SERVICE;
        const idNew = Math.floor((pos + bw) / spacing);
        let onBelt = 0;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, xIn, H); ctx.clip(); T.clip(xIn);
        for (let id = Math.max(id0, Math.floor(served)); id <= idNew; id++) {
          const x = Math.min(pos - id * spacing, mouth - (id - served) * (bw + gap));
          if (x < -bw * 0.5) continue;
          cardboard(ctx, T, x, beltY, bw, bh, labelOf(id));
          onBelt++;
        }
        ctx.restore(); T.clip(null);
        // boxes that no longer fit on the belt pile up on top of it
        const waiting = Math.max(0, idNew - Math.ceil(served) + 1);
        const heap = Math.max(0, waiting - onBelt), hw = bw * 0.78, hh = bh * 0.78;
        let drawn = 0;
        for (let row = 0; row < 3 && drawn < heap; row++) {
          const cols = Math.max(1, Math.floor((mouth - 6 - row * hw * 0.5) / (hw + 2)));
          for (let c = 0; c < cols && drawn < heap; c++, drawn++) {
            cardboard(ctx, T, 4 + row * hw * 0.5 + c * (hw + 2), beltY - bh - 2 - row * (hh + 2), hw, hh, '');
          }
        }
        T(`In line: ${waiting}`, 6, 46, { size: 11, color: waiting > 2 ? C.red : C.ink });
        T('each box waits its turn', 6, 62, { size: 8, color: C.muted });

        const shake = reduce ? 0 : Math.sin(t * 38) * 0.8;
        const mx0 = xIn + shake, mx1 = W - 8 + shake, my0 = H * 0.17, my1 = beltY + 26, mw = mx1 - mx0, pipeX = mx0 + mw * 0.72;
        coins(ctx, [[pipeX, 0], [pipeX, my0 + 4]], t, 0.13);
        T("Zach's money", pipeX - 16, 30, { size: 10, color: C.yellow, align: 'right' });
        rect(ctx, mx0, my0, mw, my1 - my0, C.machine, C.machineEdge, 3);
        rect(ctx, mx0, beltY - bh - 8, 10, bh + 8, C.machineEdge);
        const gr = Math.min(20, mw * 0.08), gy = my0 + (my1 - my0) * 0.58, slowSpin = t * 0.7;
        gear(ctx, mx0 + mw * 0.2, gy, gr, slowSpin, C.gear);
        gear(ctx, mx0 + mw * 0.2 + gr * 2.05, gy - gr * 0.3, gr * 0.8, -slowSpin * 1.25, '#a3a5d0');
        T('AI agent', mx0 + mw / 2, my0 + 26, { size: 13, align: 'center', max: mw - 16 });
        T('runs the full agent on every box', mx0 + mw / 2, my0 + 42, { size: 8, color: '#c9c9ef', align: 'center', max: mw - 16 });
        // progress on the current box
        const bx0 = mx0 + mw * 0.2 + gr * 3.4, bx1 = mx1 - 14, by = gy - 4;
        if (t >= ta0 && bx1 - bx0 > 40) {
          const cur = Math.floor(served), k = served - cur;
          T(`working: ${labelOf(cur)}`, bx0, by - 8, { size: 8, max: bx1 - bx0 });
          meter(ctx, bx0, bx1, by, k, null, C.green);
          T(`${SERVICE.toFixed(1)} s per box`, bx0, by + 26, { size: 8, color: C.muted, max: bx1 - bx0 });
        }
        ctx.restore();
      }

      // ---- after: a fast classifier in front; only real work reaches the agent ----
      if (v > 0.01) {
        ctx.save(); ctx.globalAlpha = v;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, xIn, H); ctx.clip(); T.clip(xIn);
        for (let id = Math.ceil((pos - xIn) / spacing); id <= Math.floor((pos + bw) / spacing); id++) cardboard(ctx, T, pos - id * spacing, beltY, bw, bh, labelOf(id));
        ctx.restore(); T.clip(null);
        T('In line: 0', 6, 46, { size: 11, color: C.green });
        T('sorted as it arrives', 6, 62, { size: 8, color: C.muted });
        const cx0 = xIn, cx1 = xIn + (narrow ? 72 : Math.max(84, W * 0.16)), cy0 = beltY - bh - 30, cy1 = beltY + 18, cyM = (cy0 + cy1) / 2;
        const gx0 = Math.max(cx1 + (narrow ? 34 : 54), W * (narrow ? 0.58 : 0.64)), gx1 = W - 34, gh = Math.min(44, H * 0.13);
        const targets = { memory: H * 0.2, action: H * 0.45, future: H * 0.7 }, names = { memory: 'Memory', action: 'Action', future: 'Future action' };
        const binY = H - 18, hot = {}, delay = 0.35, fly = 1.3, cw = bw * 0.55, ch = bh * 0.55;
        const idMax = Math.floor((pos - xIn) / spacing), idMin = Math.floor((pos - xIn - (delay + fly) * speed) / spacing) - 1;
        for (let id = idMin; id <= idMax; id++) {
          const lbl = labelOf(id), s = t - (xIn + id * spacing) / speed - delay;
          if (s < 0) continue;
          const routes = ROUTES[lbl];
          if (!routes.length) { if (s < 1) cardboard(ctx, T, (cx0 + cx1) / 2 - cw / 2, lerp(cy1 + ch, binY, ease(s)), cw, ch, lbl, 1 - s * s); continue; }
          for (const r of routes) {
            const k = s / fly;
            if (k >= 1) { if (k < 1.3) hot[r] = true; continue; }
            const e = ease(k), y = lerp(cyM, targets[r] + gh / 2, e) - Math.sin(e * Math.PI) * 10;
            cardboard(ctx, T, lerp(cx1, gx0 - cw, e), y + ch / 2, cw, ch, lbl, k > 0.85 ? (1 - k) / 0.15 : 1);
          }
        }
        rect(ctx, cx0, cy0, cx1 - cx0, cy1 - cy0, C.blue, C.ink, 3);
        T('Classifier', (cx0 + cx1) / 2, cyM - 4, { size: 9, align: 'center', max: cx1 - cx0 - 8 });
        T('layer', (cx0 + cx1) / 2, cyM + 10, { size: 9, align: 'center' });
        ctx.strokeStyle = C.muted; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(cx0 + 4, binY - 12); ctx.lineTo(cx0 + 10, binY); ctx.lineTo(cx1 - 10, binY); ctx.lineTo(cx1 - 4, binY - 12); ctx.stroke();
        T('ignored', cx1 + 6, binY, { size: 8, color: C.muted });
        for (const k of Object.keys(targets)) {
          rect(ctx, gx0, targets[k], gx1 - gx0, gh, C.dest, hot[k] ? C.yellow : C.destEdge, 3);
          T(names[k], (gx0 + gx1) / 2, targets[k] + gh / 2 + 0.5, { size: 9, color: C.night, align: 'center', base: 'middle', max: gx1 - gx0 - 8 });
        }
        const px = W - 14, ay = targets.action + gh / 2;
        coins(ctx, [[px, 0], [px, ay], [gx1 + 2, ay]], t, 1.1);
        T("Zach's money", px - 16, 30, { size: 10, color: C.yellow, align: 'right' });
        ctx.restore();
      }
    },
  };


  // ======================= Metamaterial: optimizer + sound wall =======================
  // What each method's cell does, shown while the optimizer works on it.
  const METHOD_NOTE = ['resonator chambers that trap sound', 'wells of different depths that scatter it', 'perforated sheets that soak it up'];
  // One candidate unit cell; sound arrives from the left, so every opening faces left.
  // Each manufacturing method allows a different kind of geometry.
  function cell(ctx, x, y, s, method, seed) {
    const mat = '#c4c6da', air = '#2a2b45', h = (i) => hash(seed * 31 + i);
    rect(ctx, x, y, s, s, air);
    ctx.fillStyle = mat;
    if (method === 0) { // FDM: Helmholtz resonator, a closed chamber behind a narrow neck
      ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
      const cw = s * (0.34 + 0.28 * h(1)), ch = s * (0.36 + 0.3 * h(2));
      const cx0 = x + s - 5 - cw, cy0 = y + (s - ch) / 2;
      const nw = Math.max(3, s * (0.07 + 0.1 * h(3))), ny = y + s / 2 - nw / 2;
      ctx.fillStyle = air;
      ctx.fillRect(cx0, cy0, cw, ch);
      ctx.fillRect(x + 2, ny, cx0 - x - 2, nw);
    } else if (method === 1) { // CNC: wells milled straight in from the face, no overhangs
      ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
      const n = 3 + Math.floor(h(1) * 3), pitch = (s - 4) / n, fin = Math.max(2, pitch * 0.25);
      ctx.fillStyle = air;
      for (let i = 0; i < n; i++) ctx.fillRect(x + 2, y + 2 + i * pitch + fin / 2, (s - 8) * (0.25 + 0.7 * h(i + 3)), pitch - fin);
    } else { // laser-cut: thin perforated sheets with air gaps, solid backing
      const n = 2 + Math.floor(h(1) * 3), gap = (s - 10) / n;
      ctx.fillRect(x + s - 6, y + 2, 4, s - 4);
      for (let i = 0; i < n; i++) {
        const px = x + 4 + i * gap, holeStep = 6 + Math.floor(h(i + 5) * 4);
        ctx.fillStyle = mat; ctx.fillRect(px, y + 2, 4, s - 4);
        ctx.fillStyle = air;
        for (let py = y + 4 + (i % 2) * 3; py < y + s - 6; py += holeStep) ctx.fillRect(px, py, 4, 3);
        ctx.fillStyle = mat;
      }
    }
    ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
  }
  const meta = {
    aspect: 0.78, minH: 400, maxH: 480,
    draw(ctx, T, W, H, t, v) {
      const narrow = W < 480;

      // ---- top: the optimizer generating and scoring shapes for one manufacturing method ----
      const optH = Math.round(H * 0.34);
      rect(ctx, 0, 0, W, optH, C.night);
      // One method at a time, in order: generate designs for a while, then hold on the best one.
      const GEN = 9, HOLD = 4, CYCLE = GEN + HOLD, step = 0.6, e = Math.max(0, t - 100);
      const round = Math.floor(e / CYCLE), m = round % 3, u = e - round * CYCLE, done = u >= GEN;
      const made = Math.min(15, Math.floor(Math.min(u, GEN - 0.01) / step) + 1);
      const score = (i) => clamp(hash(round * 97 + i) * (0.45 + 0.55 * Math.sqrt(i / 14)) + 0.1, 0, 1);
      let best = 0;
      for (let i = 1; i < made; i++) if (score(i) > score(best)) best = i;
      T('OPTIMIZER', 10, 18, { size: 10, color: C.yellow });
      const names = narrow ? ['FDM', 'CNC', 'Laser'] : ['FDM printing', 'CNC milling', 'Laser-cut'];
      let sx = 10;
      names.forEach((nm, i) => {
        const label = `${i + 1} ${nm}${i < m ? ' OK' : ''}`;
        T(label, sx, 34, { size: 8, color: i === m ? C.yellow : i < m ? C.green : C.muted });
        sx += label.length * 6.9 + 6;
        if (i < 2) { T('>', sx, 34, { size: 8, color: C.muted }); sx += 14; }
      });
      const bs = Math.min(76, optH - 46), bx = W - bs - 14, by = 26;
      const cs = Math.min(44, optH - 70), cols = clamp(Math.floor((bx - 30) / (cs + 8)), 2, 6);
      for (let c = 0; c < cols; c++) {
        const i = made - cols + c;
        if (i < 0) continue;
        const x = 10 + c * (cs + 8), y = 46;
        cell(ctx, x, y, cs, m, round * 97 + i);
        if (i === made - 1 && !done) { ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 12); rect(ctx, x, y, cs, cs, '#ffffff'); ctx.globalAlpha = 1; }
        meter(ctx, x, x + cs, y + cs + 6, score(i), null, i === best ? C.yellow : C.green);
        if (i === best) rect(ctx, x - 3, y - 3, cs + 6, cs + 6, null, C.yellow, 2);
      }
      cell(ctx, bx, by, bs, m, round * 97 + best);
      rect(ctx, bx - 3, by - 3, bs + 6, bs + 6, null, C.yellow, 3);
      T(done ? 'best design' : 'best so far', bx + bs / 2, by + bs + 16, { size: 8, color: C.yellow, align: 'center' });
      const full = ['FDM printing', 'CNC milling', 'laser-cut sheets'][m];
      T(done ? `DONE: best ${full} design found` : `${full}: ${METHOD_NOTE[m]}`, 10, optH - 10, { size: 8, color: done ? C.green : C.muted, max: bx - 20 });

      // ---- bottom: a drone's sound hitting a wall on its way to a house ----
      const top = optH, ground = H - 26;
      rect(ctx, 0, top, W, H - top, '#20294a');
      for (let i = 0; i < 18; i++) rect(ctx, hash(i + 3) * W, top + hash(i + 40) * (ground - top) * 0.5, 2, 2, '#3a4778');
      rect(ctx, 0, ground, W, H - ground, C.grass);
      rect(ctx, 0, ground, W, 3, C.grassDark);
      const droneX = Math.max(44, W * 0.1), droneY = top + (ground - top) * 0.42 + Math.sin(t * 2.2) * 4;
      const wallX = Math.round(W * 0.46), ww = narrow ? 26 : 30, wallTop = top + 26;
      const maxR = W * 0.95, trans = lerp(0.7, 0.1, v);
      const ring = (cx, cy, r, a0, a1, alpha) => {
        if (alpha <= 0.02) return;
        ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = '#9fd3ff'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke(); ctx.restore();
      };
      const spacing = 30, phase = (t * 70) % spacing;
      // incoming wave fronts, up to the wall
      ctx.save(); ctx.beginPath(); ctx.rect(0, top, wallX, ground - top); ctx.clip();
      for (let r = phase + 14; r < maxR; r += spacing) ring(droneX, droneY, r, -0.75, 0.75, 1 - r / maxR);
      ctx.restore();
      // what gets through
      ctx.save(); ctx.beginPath(); ctx.rect(wallX + ww, top, W, ground - top); ctx.clip();
      for (let r = phase + 14; r < maxR; r += spacing) ring(droneX, droneY, r, -0.75, 0.75, (1 - r / maxR) * trans * 1.4);
      ctx.restore();
      // with the metamaterial, much of the energy is steered up and away
      if (v > 0.01) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, ground - top - 4); ctx.clip();
        const ry = wallTop + (ground - wallTop) * 0.3;
        for (let r = phase + 10; r < W * 0.45; r += spacing) ring(wallX, ry, r, -Math.PI * 0.86, -Math.PI * 0.6, v * (1 - r / (W * 0.45)));
        ctx.restore();
        T('redirected up and away', wallX - 8, top + 16, { size: 8, color: '#9fd3ff', align: 'right', outline: true, max: wallX - 16 });
      }
      // the drone
      rect(ctx, droneX - 22, droneY - 6, 44, 14, '#5b5f8a', C.dark, 2);
      rect(ctx, droneX - 38, droneY - 10, 76, 4, C.dark);
      rect(ctx, droneX - 38, droneY - 16, 4, 8, C.dark); rect(ctx, droneX + 34, droneY - 16, 4, 8, C.dark);
      const blade = 14 + Math.abs(Math.sin(t * 40)) * 12;
      rect(ctx, droneX - 36 - blade / 2, droneY - 18, blade, 3, '#c4c6da');
      rect(ctx, droneX + 36 - blade / 2, droneY - 18, blade, 3, '#c4c6da');
      rect(ctx, droneX - 6, droneY + 8, 12, 6, C.dark);
      if (Math.floor(t * 3) % 2) rect(ctx, droneX + 14, droneY - 2, 4, 4, C.red);
      T('drone', droneX, droneY + 32, { size: 8, align: 'center', outline: true });
      // the wall: plain before, a stack of the optimizer's best cells after
      const wh = ground - wallTop;
      if (1 - v > 0.01) {
        ctx.save(); ctx.globalAlpha = 1 - v;
        rect(ctx, wallX, wallTop, ww, wh, '#8d8fa8', C.dark, 2);
        for (let i = 0; i < 14; i++) rect(ctx, wallX + 4 + hash(i) * (ww - 10), wallTop + 6 + hash(i + 20) * (wh - 12), 3, 3, '#6f7190');
        ctx.restore();
      }
      if (v > 0.01) {
        ctx.save(); ctx.globalAlpha = v;
        for (let y = wallTop; y < ground - 1; y += ww) cell(ctx, wallX, y, Math.min(ww, ground - y), m, round * 97 + best);
        ctx.restore();
      }
      T(v < 0.5 ? 'plain wall' : 'metamaterial', wallX + ww / 2, ground + 16, { size: 8, align: 'center', outline: true });
      // the house and how loud it is there
      const hx0 = W * 0.76, hx1 = W - 12, hy0 = ground - Math.min(70, (ground - top) * 0.5);
      ctx.fillStyle = '#7a2f2f'; ctx.beginPath(); ctx.moveTo(hx0 - 6, hy0); ctx.lineTo((hx0 + hx1) / 2, hy0 - 26); ctx.lineTo(hx1 + 6, hy0); ctx.closePath(); ctx.fill();
      rect(ctx, hx0, hy0, hx1 - hx0, ground - hy0, '#c94f4f', C.dark, 2);
      rect(ctx, hx0 + (hx1 - hx0) * 0.2, hy0 + 12, 14, 12, C.yellow, C.dark, 2);
      rect(ctx, hx1 - (hx1 - hx0) * 0.2 - 12, ground - 24, 12, 24, '#5a2a1a');
      T('home', (hx0 + hx1) / 2, ground + 16, { size: 8, align: 'center', outline: true });
      const loud = lerp(0.88, 0.12, v) + 0.03 * Math.sin(t * 9);
      const mx0 = hx0 - 4, mx1 = hx1;
      T('noise at home', mx0, top + 18, { size: 8, color: C.muted, max: mx1 - mx0 });
      meter(ctx, mx0, mx1, top + 26, loud, null, v < 0.5 ? C.red : C.green);
      T(v < 0.5 ? 'HEARD' : 'QUIET', mx1, top + 52, { size: 10, color: v < 0.5 ? C.red : C.green, align: 'right', outline: true });
    },
  };

  document.fonts.load(`10px ${FONT}`).catch(() => {}).then(() => {
    const p = document.getElementById('prenViz');
    if (p) figure(p, pren);
    const q = document.getElementById('personaViz');
    if (q) figure(q, persona);
    const m = document.getElementById('metaViz');
    if (m) figure(m, meta);
  });
})();
