// AP Physics 2 · Unit 2 — Electric Force, Field, and Potential.
// Visual, first-principles lessons. Pushes lesson objects onto window.LESSONS.
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);

  // ---------- constants ----------
  const K = 8.99e9;        // N·m²/C²
  const EPS0 = 8.85e-12;   // C²/(N·m²)
  const QE = 1.6e-19;      // C
  const ME = 9.11e-31;     // kg
  const MP = 1.67e-27;     // kg

  // ---------- small helpers ----------
  const col = (n) => PR.color(n);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function rgbOf(c) {
    c = (c || '').trim();
    if (c[0] === '#') {
      let h = c.slice(1);
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      const n = parseInt(h.slice(0, 6), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = c.match(/[\d.]+/g);
    return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function rgba(c, a) {
    const [r, g, b] = rgbOf(c);
    return `rgba(${r},${g},${b},${a})`;
  }

  // HTML number formatting for live readouts (KaTeX would be too slow to re-render per frame).
  function sci(x, n = 3) {
    if (x === 0) return '0';
    if (!isFinite(x)) return '∞';
    const ax = Math.abs(x);
    const minus = (s) => String(s).replace('-', '−');
    if (ax >= 0.01 && ax < 1e4) return minus(PR.sig(x, n));
    let e = Math.floor(Math.log10(ax));
    let m = PR.sig(x / Math.pow(10, e), n);
    if (Math.abs(m) >= 10) { m = PR.sig(m / 10, n); e += 1; }
    return `${minus(m)}×10<sup>${minus(e)}</sup>`;
  }
  const signed = (x, n = 3) => (x > 0 ? '+' : '') + sci(x, n);

  // markup helpers
  const eq = (tex, where) => `<div class="eq">${tex}${where ? `<div class="where">${where}</div>` : ''}</div>`;
  const call = (kind, title, body) => `<div class="callout ${kind}"><div class="title">${title}</div>${body}</div>`;
  const check = (q, opts, ans, why) =>
    `<div class="check" data-answer="${ans}"><div class="q">${q}</div><div class="opts">${opts
      .map((o) => `<button>${o}</button>`)
      .join('')}</div><div class="why">${why}</div></div>`;

  // ---------- canvas drawing ----------
  function arrow(ctx, x1, y1, x2, y2, color, lw = 2, head = 9) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 1) return;
    const ux = dx / len, uy = dy / len;
    const hh = Math.min(head, len * 0.6);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hh * 0.8, y2 - uy * hh * 0.8); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * hh - uy * hh * 0.5, y2 - uy * hh + ux * hh * 0.5);
    ctx.lineTo(x2 - ux * hh + uy * hh * 0.5, y2 - uy * hh - ux * hh * 0.5);
    ctx.closePath(); ctx.fill();
  }

  function text(ctx, s, x, y, o = {}) {
    ctx.font = `${o.weight || 500} ${o.size || 12}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = o.color || col('--text');
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    ctx.fillText(s, x, y);
  }

  // A charge: red disc with "+" or blue disc with "−".
  function chargeDot(ctx, x, y, q, r = 12, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = q > 0 ? col('--pos') : q < 0 ? col('--neg') : col('--muted');
    ctx.fill();
    if (q !== 0 && r >= 4) {
      ctx.strokeStyle = col('--surface');
      ctx.lineWidth = Math.max(1.4, r * 0.2); ctx.lineCap = 'round';
      const a = r * 0.5;
      ctx.beginPath(); ctx.moveTo(x - a, y); ctx.lineTo(x + a, y);
      if (q > 0) { ctx.moveTo(x, y - a); ctx.lineTo(x, y + a); }
      ctx.stroke();
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Canvas stage: fits to width, redraws on resize and on light/dark change.
  function stage(canvas, aspect, draw) {
    const st = { ctx: null, w: 0, h: 0 };
    let raf = 0, lastW = 0;
    st.fit = () => { const r = PR.fitCanvas(canvas, aspect); st.ctx = r.ctx; st.w = r.w; st.h = r.h; };
    st.draw = () => { raf = 0; draw(st.ctx, st.w, st.h); };
    st.request = () => { if (!raf) raf = requestAnimationFrame(st.draw); };
    const onResize = () => {
      const cw = canvas.clientWidth;
      if (cw && cw !== lastW) { lastW = cw; st.fit(); if (st.onResize) st.onResize(); st.draw(); }
    };
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const onTheme = () => { if (st.onTheme) st.onTheme(); st.draw(); };
    window.addEventListener('resize', onResize);
    if (mq && mq.addEventListener) mq.addEventListener('change', onTheme);
    st.fit(); lastW = canvas.clientWidth;
    st.destroy = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (mq && mq.removeEventListener) mq.removeEventListener('change', onTheme);
    };
    return st;
  }

  // Pointer dragging (mouse + touch). hit(x,y) → item or null.
  function drag(canvas, hit, move, end) {
    let cur = null;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener('pointerdown', (e) => {
      const [x, y] = pos(e);
      const it = hit(x, y);
      if (it != null) {
        cur = it; e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        canvas.style.cursor = 'grabbing';
        move(cur, x, y);
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      const [x, y] = pos(e);
      if (cur != null) move(cur, x, y);
      else canvas.style.cursor = hit(x, y) != null ? 'grab' : 'default';
    });
    const up = () => { if (cur != null) { if (end) end(cur); cur = null; canvas.style.cursor = 'default'; } };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }

  // rAF loop with dt (s). Returns stop().
  function loop(fn) {
    let id = 0, last = performance.now(), alive = true;
    const f = (t) => {
      if (!alive) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      fn(dt, t);
      id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => { alive = false; cancelAnimationFrame(id); };
  }

  // ---------- point-charge physics (positions in m, charges in nC) ----------
  const _E = [0, 0];
  function fieldAt(ch, x, y, unit = 1e-9) {
    let ex = 0, ey = 0;
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i];
      const dx = x - c.x, dy = y - c.y;
      let r2 = dx * dx + dy * dy;
      if (r2 < 1e-6) r2 = 1e-6;
      const f = (K * c.q * unit) / (r2 * Math.sqrt(r2));
      ex += f * dx; ey += f * dy;
    }
    _E[0] = ex; _E[1] = ey;
    return _E;
  }
  function potAt(ch, x, y, unit = 1e-9) {
    let v = 0;
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i];
      const r = Math.max(Math.hypot(x - c.x, y - c.y), 0.004);
      v += (K * c.q * unit) / r;
    }
    return v;
  }

  function traceLines(ch, W, H, lpc) {
    const out = [];
    if (!ch.length) return out;
    const tot = ch.reduce((a, c) => a + c.q, 0);
    const sg = tot >= 0 ? 1 : -1;
    const ds = 0.005;
    for (const c of ch) {
      if (Math.sign(c.q) !== sg) continue;
      const n = Math.max(2, Math.round(lpc * Math.abs(c.q)));
      for (let k = 0; k < n; k++) {
        const a = ((k + 0.5) / n) * Math.PI * 2 + 0.3;
        let x = c.x + 0.018 * Math.cos(a), y = c.y + 0.018 * Math.sin(a);
        const pts = [x, y];
        for (let step = 0; step < 1100; step++) {
          let e = fieldAt(ch, x, y);
          let m = Math.hypot(e[0], e[1]);
          if (m === 0) break;
          const mx = x + (sg * e[0] / m) * ds / 2, my = y + (sg * e[1] / m) * ds / 2;
          e = fieldAt(ch, mx, my);
          m = Math.hypot(e[0], e[1]);
          if (m === 0) break;
          x += (sg * e[0] / m) * ds; y += (sg * e[1] / m) * ds;
          pts.push(x, y);
          if (x < -0.15 || x > W + 0.15 || y < -0.15 || y > H + 0.15) break;
          let stop = false;
          for (const d of ch) {
            if (d !== c && (x - d.x) * (x - d.x) + (y - d.y) * (y - d.y) < 0.014 * 0.014) { stop = true; break; }
          }
          if (stop) break;
        }
        out.push({ pts, sg });
      }
    }
    return out;
  }

  // ---------- reusable charge sandbox ----------
  // World: width 1 m, height = aspect m. Charges in nC.
  const TOG = { vectors: 'Field vectors', lines: 'Field lines', heat: 'Potential map', equip: 'Equipotentials' };
  function sandbox(host, o) {
    const H = o.aspect || 0.6;
    const W = 1;
    const show = Object.assign({ vectors: false, lines: false, heat: false, equip: false }, o.show || {});
    const presetNames = o.presets ? Object.keys(o.presets) : [];
    const clone = (a) => a.map((c) => ({ x: c.x, y: c.y, q: c.q }));
    let charges = clone(o.charges || (o.presets ? o.presets[presetNames[0]] : []));
    const probe = o.probe ? { x: o.probeAt ? o.probeAt[0] : 0.5, y: o.probeAt ? o.probeAt[1] : H * 0.25 } : null;
    let q0 = 1;
    host.innerHTML = `<canvas></canvas>${o.profile ? '<canvas data-k="prof" style="border-top:1px solid var(--border)"></canvas>' : ''}
      <div class="sim-controls">
        ${o.add !== false ? '<button class="btn small" data-k="addp"><span style="color:var(--pos)">+</span> charge</button><button class="btn small" data-k="addn"><span style="color:var(--neg)">−</span> charge</button><button class="btn small" data-k="clear">Clear</button>' : ''}
        ${presetNames.length ? `<label>Setup <select data-k="preset">${presetNames.map((n) => `<option>${n}</option>`).join('')}</select></label>` : ''}
        ${(o.toggles || []).map((t) => `<label><input type="checkbox" data-t="${t}" ${show[t] ? 'checked' : ''}> ${TOG[t]}</label>`).join('')}
        ${o.probe === 'force' ? '<label>Test charge <select data-k="q0"><option value="1">+1 nC</option><option value="-1">−1 nC</option></select></label>' : ''}
      </div>
      ${o.probe ? '<div class="sim-readout" data-k="ro"></div>' : ''}
      <div class="sim-caption">${o.caption || ''}</div>`;
    const cv = host.querySelector('canvas');
    const ro = host.querySelector('[data-k="ro"]');
    let cache = null;
    let dirty = true;

    function compute(w, h) {
      const s = w / W;
      const cell = Math.max(4, Math.round(w / 150));
      const gw = Math.ceil(w / cell) + 1, gh = Math.ceil(h / cell) + 1;
      const V = new Float32Array(gw * gh);
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) V[j * gw + i] = potAt(charges, (i * cell) / s, (j * cell) / s);
      const c = { cell, gw, gh, V, s };
      if (show.heat) {
        const off = document.createElement('canvas');
        off.width = gw; off.height = gh;
        const octx = off.getContext('2d');
        const img = octx.createImageData(gw, gh);
        const bg = rgbOf(col('--surface-2')), pc = rgbOf(col('--pos')), nc = rgbOf(col('--neg'));
        const V0 = o.heatScale || 150;
        for (let k = 0; k < gw * gh; k++) {
          const v = V[k];
          const a = 0.78 * Math.tanh(Math.abs(v) / V0);
          const cc = v >= 0 ? pc : nc;
          img.data[k * 4] = bg[0] * (1 - a) + cc[0] * a;
          img.data[k * 4 + 1] = bg[1] * (1 - a) + cc[1] * a;
          img.data[k * 4 + 2] = bg[2] * (1 - a) + cc[2] * a;
          img.data[k * 4 + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        c.heat = off;
      }
      if (show.equip) {
        const step = o.levelStep || 15, max = o.levelMax || 300;
        const segs = [], zero = [];
        for (let j = 0; j < gh - 1; j++) {
          for (let i = 0; i < gw - 1; i++) {
            const a = V[j * gw + i], b = V[j * gw + i + 1], cc = V[(j + 1) * gw + i + 1], d = V[(j + 1) * gw + i];
            const lo = Math.min(a, b, cc, d), hi = Math.max(a, b, cc, d);
            const k0 = Math.max(Math.ceil(lo / step), -Math.floor(max / step));
            const k1 = Math.min(Math.floor(hi / step), Math.floor(max / step));
            for (let k = k0; k <= k1; k++) {
              const L = k * step;
              const p = [];
              if ((a - L) * (b - L) < 0) p.push(i + (L - a) / (b - a), j);
              if ((b - L) * (cc - L) < 0) p.push(i + 1, j + (L - b) / (cc - b));
              if ((d - L) * (cc - L) < 0) p.push(i + (L - d) / (cc - d), j + 1);
              if ((a - L) * (d - L) < 0) p.push(i, j + (L - a) / (d - a));
              const arr = k === 0 ? zero : segs;
              if (p.length >= 4) arr.push(p[0] * cell, p[1] * cell, p[2] * cell, p[3] * cell);
              if (p.length === 8) arr.push(p[4] * cell, p[5] * cell, p[6] * cell, p[7] * cell);
            }
          }
        }
        c.segs = segs; c.zero = zero;
      }
      if (show.lines) c.lines = traceLines(charges, W, H, o.lpc || 10);
      cache = c;
      dirty = false;
    }

    const rOf = (q, w) => (w < 520 ? 0.85 : 1) * (Math.abs(q) < 0.5 ? 7 : 9 + 4 * Math.sqrt(Math.abs(q)));

    function draw(ctx, w, h) {
      if (dirty || !cache) compute(w, h);
      const s = w / W;
      ctx.clearRect(0, 0, w, h);
      if (show.heat && cache.heat) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(cache.heat, -cache.cell / 2, -cache.cell / 2, cache.gw * cache.cell, cache.gh * cache.cell);
      }
      if (show.equip && cache.segs) {
        ctx.save();
        ctx.strokeStyle = rgba(col('--text'), 0.45); ctx.lineWidth = 1;
        ctx.beginPath();
        const sg = cache.segs;
        for (let i = 0; i < sg.length; i += 4) { ctx.moveTo(sg[i], sg[i + 1]); ctx.lineTo(sg[i + 2], sg[i + 3]); }
        ctx.stroke();
        ctx.setLineDash([4, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.5;
        ctx.beginPath();
        const z = cache.zero;
        for (let i = 0; i < z.length; i += 4) { ctx.moveTo(z[i], z[i + 1]); ctx.lineTo(z[i + 2], z[i + 3]); }
        ctx.stroke();
        ctx.restore();
      }
      if (show.lines && cache.lines) {
        const lc = rgba(col('--text'), 0.75);
        ctx.strokeStyle = lc; ctx.lineWidth = 1.3;
        for (const L of cache.lines) {
          const p = L.pts;
          ctx.beginPath(); ctx.moveTo(p[0] * s, p[1] * s);
          for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] * s, p[i + 1] * s);
          ctx.stroke();
          // arrowheads along the line, pointing along E
          let acc = 0;
          for (let i = 2; i < p.length - 2; i += 2) {
            acc += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
            if (acc > 0.13) {
              acc = 0;
              const x = p[i] * s, y = p[i + 1] * s;
              if (x < 0 || x > w || y < 0 || y > h) continue;
              let dx = (p[i + 2] - p[i]) * L.sg, dy = (p[i + 3] - p[i + 1]) * L.sg;
              const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
              arrow(ctx, x - dx * 5, y - dy * 5, x + dx * 4, y + dy * 4, lc, 1.3, 7);
            }
          }
        }
      }
      if (show.vectors) {
        const g = Math.max(30, w / 20);
        const vc = col('--muted');
        for (let y = g / 2; y < h; y += g) {
          for (let x = g / 2; x < w; x += g) {
            const X = x / s, Y = y / s;
            if (charges.some((c) => Math.hypot(c.x - X, c.y - Y) < 0.035)) continue;
            const e = fieldAt(charges, X, Y);
            const m = Math.hypot(e[0], e[1]);
            if (m < 1e-9) continue;
            const a = clamp(Math.log10(m / 5) / 3, 0.12, 1);
            const L = g * 0.36;
            ctx.save(); ctx.globalAlpha = a;
            arrow(ctx, x - (e[0] / m) * L, y - (e[1] / m) * L, x + (e[0] / m) * L, y + (e[1] / m) * L, vc, 1.6, 7);
            ctx.restore();
          }
        }
      }
      if (o.profile && probe) {
        ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = col('--accent'); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, probe.y * s); ctx.lineTo(w, probe.y * s); ctx.stroke(); ctx.restore();
      }
      if (o.platesDraw) o.platesDraw(ctx, w, h, s);
      charges.forEach((c) => chargeDot(ctx, c.x * s, c.y * s, c.q, rOf(c.q, w)));
      if (probe) drawProbe(ctx, w, h, s);
      if (o.profile) drawProfile();
    }

    function drawProbe(ctx, w, h, s) {
      const px = probe.x * s, py = probe.y * s;
      const e = fieldAt(charges, probe.x, probe.y);
      const ex = e[0], ey = e[1];
      const m = Math.hypot(ex, ey);
      const V = potAt(charges, probe.x, probe.y);
      if (o.probe === 'force') {
        if (m > 0) {
          const L = Math.min(140, 20 * Math.log(1 + m / 30));
          const dirx = (q0 * ex) / m, diry = (q0 * ey) / m;
          arrow(ctx, px, py, px + dirx * (L + 9), py + diry * (L + 9), col('--accent'), 3, 11);
          text(ctx, 'F', px + dirx * (L + 22), py + diry * (L + 22), { color: col('--accent'), weight: 700, size: 13 });
        }
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fillStyle = col('--surface'); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = q0 > 0 ? col('--pos') : col('--neg'); ctx.stroke();
        chargeDot(ctx, px, py, q0, 6);
        const F = Math.abs(q0) * 1e-9 * m;
        const ang = (Math.atan2(-ey, ex) * 180) / Math.PI;
        if (ro)
          ro.innerHTML = `<span>Field at test charge: <b>${sci(m)} N/C</b></span><span>direction of <b>E</b>: <b>${Math.round(ang)}°</b> <span class="muted">(0° = right, 90° = up)</span></span><span>Force on ${q0 > 0 ? '+' : '−'}1 nC: <b>${sci(F)} N</b>, ${q0 > 0 ? 'along E' : 'opposite to E'}</span>`;
      } else {
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fillStyle = col('--surface'); ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = col('--accent'); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 5, py); ctx.lineTo(px + 5, py); ctx.moveTo(px, py - 5); ctx.lineTo(px, py + 5);
        ctx.lineWidth = 1.5; ctx.stroke();
        const lab = `V = ${Math.abs(V) < 0.05 ? 0 : PR.sig(V, 3)} V`;
        ctx.font = '600 12px Inter, system-ui, sans-serif';
        const tw = ctx.measureText(lab).width + 12;
        const lx = clamp(px + 14, 4, w - tw - 4), ly = clamp(py - 28, 4, h - 22);
        ctx.fillStyle = rgba(col('--surface'), 0.92); roundRect(ctx, lx, ly, tw, 20, 6); ctx.fill();
        text(ctx, lab, lx + 6, ly + 10, { align: 'left', weight: 600 });
        if (ro) {
          const parts = charges.map((c, i) => {
            const r = Math.hypot(probe.x - c.x, probe.y - c.y);
            const v = (K * c.q * 1e-9) / Math.max(r, 0.004);
            return `<span style="color:${c.q > 0 ? 'var(--pos)' : 'var(--neg)'}">${signed(v, 2)}</span>`;
          });
          ro.innerHTML = `<span>V at probe = <b>${Math.abs(V) < 0.05 ? '0' : signed(V, 3)} V</b></span><span>= sum of ${charges.length} numbers: ${parts.join(' + ') || '0'}</span>` +
            (o.showE ? `<span>|E| there = <b>${sci(m)} V/m</b></span>` : '');
        }
      }
    }

    let prof = null;
    function drawProfile() {
      if (!prof) return;
      const ctx = prof.ctx, w = prof.w, h = prof.h;
      ctx.clearRect(0, 0, w, h);
      const s = w / W, Vm = o.profileMax || o.levelMax || 300;
      const y0 = h / 2, sy = (h * 0.42) / Vm;
      ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(w, y0); ctx.stroke();
      text(ctx, 'V along the dashed line', 8, 12, { align: 'left', color: col('--muted'), size: 11 });
      text(ctx, `+${Vm} V`, w - 6, y0 - h * 0.42, { align: 'right', color: col('--muted'), size: 10 });
      text(ctx, `−${Vm} V`, w - 6, y0 + h * 0.42, { align: 'right', color: col('--muted'), size: 10 });
      ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const v = clamp(potAt(charges, x / s, probe.y), -Vm * 1.1, Vm * 1.1);
        const y = y0 - v * sy;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const dx = 0.005;
      const v0 = potAt(charges, probe.x, probe.y);
      const slope = (potAt(charges, probe.x + dx, probe.y) - potAt(charges, probe.x - dx, probe.y)) / (2 * dx); // V/m
      const px = probe.x * s, py = y0 - clamp(v0, -Vm * 1.1, Vm * 1.1) * sy;
      // tangent line
      const half = 40;
      const pslope = (-slope * sy) / s;
      ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px - half, py - pslope * half); ctx.lineTo(px + half, py + pslope * half); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fillStyle = col('--accent'); ctx.fill();
      const ex = fieldAt(charges, probe.x, probe.y)[0];
      text(ctx, `slope ΔV/Δx = ${PR.sig(slope, 2)} V/m  →  Ex = −slope = ${PR.sig(ex, 2)} N/C`, 8, h - 10, { align: 'left', size: 11, color: col('--accent') });
    }

    const st = stage(cv, H, draw);
    st.onResize = st.onTheme = () => { dirty = true; if (prof) prof.fit(); };
    if (o.profile) {
      const pc = host.querySelector('[data-k="prof"]');
      prof = stage(pc, 0.26, () => drawProfile());
    }
    st.draw();

    const changed = () => { dirty = true; st.request(); };
    drag(
      cv,
      (x, y) => {
        const s = st.w / W;
        const tol = st.w < 520 ? 22 : 16;
        if (probe && Math.hypot(probe.x * s - x, probe.y * s - y) < tol) return probe;
        for (let i = charges.length - 1; i >= 0; i--) {
          if (Math.hypot(charges[i].x * s - x, charges[i].y * s - y) < rOf(charges[i].q, st.w) + 6) return charges[i];
        }
        return null;
      },
      (it, x, y) => {
        const s = st.w / W;
        it.x = clamp(x / s, 0.01, W - 0.01);
        it.y = clamp(y / s, 0.01, H - 0.01);
        if (it === probe) st.request(); else changed();
      }
    );
    const q = (k) => host.querySelector(`[data-k="${k}"]`);
    let nAdd = 0;
    const add = (sign) => {
      if (charges.length >= 10) return;
      nAdd++;
      const a = nAdd * 2.4;
      charges.push({ x: clamp(0.5 + 0.18 * Math.cos(a), 0.05, 0.95), y: clamp(H / 2 + 0.15 * Math.sin(a), 0.05, H - 0.05), q: sign });
      changed();
    };
    if (q('addp')) q('addp').onclick = () => add(1);
    if (q('addn')) q('addn').onclick = () => add(-1);
    if (q('clear')) q('clear').onclick = () => { charges = []; changed(); };
    if (q('preset')) q('preset').onchange = (e) => { charges = clone(o.presets[e.target.value]); changed(); };
    if (q('q0')) q('q0').onchange = (e) => { q0 = Number(e.target.value); st.request(); };
    host.querySelectorAll('[data-t]').forEach((cb) => {
      cb.onchange = () => { show[cb.dataset.t] = cb.checked; changed(); };
    });
    return () => { st.destroy(); if (prof) prof.destroy(); };
  }

  // Common presets (meters, nC). Height of the world = aspect.
  function platesPreset(H, n = 13, q = 0.35) {
    const a = [];
    for (let i = 0; i < n; i++) {
      const x = 0.22 + (0.56 * i) / (n - 1);
      a.push({ x, y: H * 0.3, q: q });
      a.push({ x, y: H * 0.7, q: -q });
    }
    return a;
  }


  // =====================================================================
  // 1. What charge is
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 1, id: 'u1-charge', title: 'What electric charge actually is',
    render(el) {
      el.innerHTML = `
<p class="lead">Everything around you — your desk, your hand, the air — is built from atoms. Atoms are built from three kinds of particles, and two of them carry a property called <b>electric charge</b>. That one property explains lightning, static cling, batteries, and why your hand doesn't sink into the table.</p>

<h2>Inside an atom</h2>
<p>An atom has a tiny, heavy center called the <b>nucleus</b>, made of <b style="color:var(--pos)">protons</b> and <b>neutrons</b>. Around it is a cloud of very light <b style="color:var(--neg)">electrons</b>.</p>
<ul>
<li><b style="color:var(--pos)">Proton</b>: charge <b>+e</b>. Lives in the nucleus, locked in place by the strong nuclear force.</li>
<li><b>Neutron</b>: charge <b>0</b>. Also in the nucleus.</li>
<li><b style="color:var(--neg)">Electron</b>: charge <b>−e</b>. About 1836 times lighter than a proton, and on the outside of the atom — so electrons are the particles that get moved around.</li>
</ul>
<p>Play with the atom below. Add and remove particles and watch the <b>net charge</b> — the protons minus the electrons.</p>

<div class="sim" data-sim="atom">
  <canvas></canvas>
  <div class="sim-controls">
    <span>Protons <button class="btn small" data-a="p-">−</button> <button class="btn small" data-a="p+">+</button></span>
    <span>Neutrons <button class="btn small" data-a="n-">−</button> <button class="btn small" data-a="n+">+</button></span>
    <span>Electrons <button class="btn small" data-a="e-">−</button> <button class="btn small" data-a="e+">+</button></span>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Cartoon model: real electrons are fuzzy clouds, not little planets. Notice that changing the number of protons changes which element it is — that's why in everyday charging, only electrons move.</div>
</div>

<h2>Charge is a property, like mass</h2>
<p>You already know mass from Physics 1: it's a property of matter that makes things pull on each other gravitationally. Charge is another property of matter, but with a twist: <b>it comes in two kinds</b>, which Benjamin Franklin named positive (+) and negative (−).</p>
<div class="callout idea"><div class="title">The rule of interaction</div>
<b>Like charges repel</b> (+ and +, or − and −). <b>Unlike charges attract</b> (+ and −). Neutral objects have equal amounts of + and −, so from far away their effects cancel.</div>
<p>Why are most things neutral? Because + and − attract so strongly that they pair up. Any imbalance gets "filled in" quickly — unless something keeps them apart.</p>

<h2>Charge comes in chunks: quantization</h2>
<p>Every proton has exactly +e and every electron exactly −e. You can't have half an electron, so any object's charge is a whole number of e's:</p>
${eq('\\[ q = n\\,e \\]', 'where \\(q\\) = net charge of the object (coulombs, C); \\(n\\) = a whole number (positive if the object is missing electrons, negative if it has extra); \\(e = 1.60\\times10^{-19}\\) C, the <b>elementary charge</b> — the size of the charge on one proton or electron.')}
<p>A coulomb is a <i>huge</i> amount of charge: \\(1\\text{ C} = 1/(1.6\\times10^{-19}) = 6.25\\times10^{18}\\) electrons' worth. Rubbing a balloon on your hair moves maybe \\(10^{11}\\) electrons, about \\(10^{-8}\\) C. So in problems you'll see microcoulombs (\\(\\mu\\)C = \\(10^{-6}\\) C) and nanocoulombs (nC = \\(10^{-9}\\) C).</p>

<h2>Charge is conserved</h2>
<p>Charge is never created or destroyed — it only moves from one place to another. If a balloon gains 1000 electrons from your hair, your hair loses exactly 1000 electrons. The <b>total</b> charge of an isolated system never changes.</p>
${call('analogy', 'Analogy: money in bank accounts', 'Think of charge as money. You can transfer it between accounts (objects), but the total in the system stays the same (conservation). And the smallest coin is one cent — you can never have half a cent (quantization). Here the "cent" is e.')}
${call('mistake', 'Common mistake: "the object gained protons"', 'In everyday charging (rubbing, touching), <b>only electrons move</b>. Protons are locked in nuclei. An object becomes <b>positive by losing electrons</b>, never by gaining protons.')}
${call('ap', 'On the AP exam', 'Expect questions like "a sphere has −3.2×10<sup>−9</sup> C; how many extra electrons?" (\\(n = q/e = 2\\times10^{10}\\)), or "which of these charges is impossible?" — anything that is not a whole multiple of e.')}
${check('Which of these could NOT be the net charge of an object?', ['\\(+4.8\\times10^{-19}\\) C', '\\(-1.6\\times10^{-19}\\) C', '\\(+2.4\\times10^{-19}\\) C', '\\(+8.0\\times10^{-19}\\) C'], 2, '\\(2.4\\times10^{-19}/1.6\\times10^{-19} = 1.5\\). You can\'t have half an electron, so this charge is impossible. The others are 3e, −1e and 5e.')}
${check('A metal sphere starts neutral and ends up with charge \\(+3.2\\times10^{-12}\\) C. What happened?', ['It gained \\(2\\times10^{7}\\) protons', 'It lost \\(2\\times10^{7}\\) electrons', 'It gained \\(2\\times10^{7}\\) electrons', 'It lost \\(2\\times10^{7}\\) protons'], 1, '\\(n = 3.2\\times10^{-12}/1.6\\times10^{-19} = 2\\times10^7\\). It became positive because electrons left — protons don\'t move.')}
`;
      const host = el.querySelector('[data-sim="atom"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const s = { p: 3, n: 4, e: 3 };
      const NAMES = ['(nothing)', 'hydrogen', 'helium', 'lithium', 'beryllium', 'boron', 'carbon', 'nitrogen', 'oxygen', 'fluorine', 'neon', 'sodium', 'magnesium', 'aluminum', 'silicon', 'phosphorus', 'sulfur', 'chlorine', 'argon'];
      let t = 0;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2 + 6;
        const caps = [2, 8, 8, 8];
        const base = h * 0.18, stepR = h * 0.085;
        let left = s.e;
        caps.forEach((cap, k) => {
          const n = Math.min(cap, left);
          left -= n;
          const r = base + k * stepR;
          if (n === 0 && k > 0) return;
          ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          for (let i = 0; i < n; i++) {
            const a = t * (0.9 / (k + 1)) + (i * Math.PI * 2) / n + k;
            chargeDot(ctx, cx + r * Math.cos(a), cy + r * Math.sin(a), -1, Math.max(5, h * 0.022));
          }
        });
        const N = s.p + s.n;
        const br = clamp(h * 0.028, 4, 8);
        const order = [];
        let pi = 0, ni = 0;
        for (let i = 0; i < N; i++) {
          if (ni >= s.n || (pi < s.p && pi * (s.n + 1) <= ni * (s.p + 1))) { order.push(1); pi++; } else { order.push(0); ni++; }
        }
        for (let i = N - 1; i >= 0; i--) {
          const r = br * 1.05 * Math.sqrt(i) * 1.1, a = i * 2.39996;
          const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
          if (order[i]) chargeDot(ctx, x, y, 1, br);
          else { ctx.beginPath(); ctx.arc(x, y, br, 0, Math.PI * 2); ctx.fillStyle = col('--muted'); ctx.fill(); }
        }
        const net = s.p - s.e;
        text(ctx, `Net charge: ${net > 0 ? '+' : net < 0 ? '−' : ''}${Math.abs(net) === 1 ? '' : Math.abs(net)}${net === 0 ? '0' : 'e'}`, 12, 18, {
          align: 'left', weight: 700, size: 15, color: net > 0 ? col('--pos') : net < 0 ? col('--neg') : col('--text'),
        });
        text(ctx, net === 0 ? 'neutral atom' : net > 0 ? 'positive ion (missing electrons)' : 'negative ion (extra electrons)', 12, 38, { align: 'left', color: col('--muted') });
      }
      const st = stage(cv, 0.55, draw);
      function readout() {
        const net = s.p - s.e;
        ro.innerHTML = `<span>Element: <b>${NAMES[s.p] || '?'}</b></span><span>protons <b style="color:var(--pos)">${s.p}</b> · neutrons <b>${s.n}</b> · electrons <b style="color:var(--neg)">${s.e}</b></span><span>q = (${s.p} − ${s.e})e = <b>${signed(net * QE)} C</b></span>`;
      }
      host.querySelectorAll('[data-a]').forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.a[0], d = b.dataset.a[1] === '+' ? 1 : -1;
          const lim = { p: [1, 18], n: [0, 22], e: [0, 26] }[k];
          s[k] = clamp(s[k] + d, lim[0], lim[1]);
          readout();
        };
      });
      readout();
      const stop = loop((dt) => { t += dt; st.draw(); });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 2. Conductors vs insulators
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 2, id: 'u1-conductors', title: 'Conductors and insulators: who lets electrons roam?',
    render(el) {
      el.innerHTML = `
<p class="lead">Last lesson: electrons are the movable part of matter. But <i>how freely</i> they move depends hugely on the material. That single difference sorts materials into conductors and insulators.</p>

<h2>Free electrons vs bound electrons</h2>
<p>In a <b>metal</b>, each atom lets go of one or two of its outermost electrons. Those electrons aren't attached to any particular atom — they drift through the whole piece of metal like a gas, a "sea of electrons." The positive ions stay put in a fixed grid. A material like this is a <b>conductor</b>: charge can flow through it.</p>
<p>In an <b>insulator</b> (plastic, rubber, glass, dry wood, air), every electron is tightly held by its own atom. Electrons can wiggle slightly but can't travel. Charge placed on an insulator <b>stays where you put it</b>.</p>

<div class="sim" data-sim="bar">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Material <select data-k="mat"><option value="metal">Metal (conductor)</option><option value="plastic">Plastic (insulator)</option></select></label>
    <button class="btn small primary" data-k="add">Touch left end with charged rod</button>
    <button class="btn small" data-k="gnd">Touch right end with finger</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Faint dots: the material's own particles. Bold blue dots: <b>extra</b> electrons from the rod. In metal they push each other apart and spread over the whole bar; in plastic they're stuck where they landed.</div>
</div>

<p>Try it: add charge to the metal bar. The extra electrons repel each other, and since nothing holds them, they spread out until they are as far apart as possible — over the whole object, ending up on the <b>outer surface</b>. Now switch to plastic: the extra electrons stay clumped at the left end.</p>

<h2>Grounding</h2>
<p>The Earth is a gigantic conductor. It can absorb or supply practically unlimited electrons without its own charge changing noticeably. Connecting an object to the Earth with a conductor is called <b>grounding</b> (symbol: <span class="mono">⏚</span>). Your body is a decent conductor too, so touching a charged metal object grounds it: extra electrons flow out through you (or missing ones flow in), and it becomes neutral.</p>
<p>Try "touch with finger" on each material. Metal fully discharges; plastic doesn't, because charge at the left end can't travel to your finger on the right.</p>

${call('analogy', 'Analogy: a crowd in a hallway vs. people in theater seats', 'Electrons in a metal are like people milling in a hallway: push on one end and the whole crowd shifts. Electrons in an insulator are like people buckled into seats: they can lean, but not walk away.')}
${call('mistake', 'Common mistake: "insulators can\'t be charged"', 'Insulators charge <i>very</i> well (that\'s how a balloon gets charged). What they can\'t do is let the charge <b>move</b>. In fact, you can charge a plastic rod by rubbing while holding it, but a metal rod held in your bare hand loses its charge through you to the ground.')}
${call('ap', 'On the AP exam', 'When explaining any charging situation, say explicitly which charges move and why: "electrons in the conductor are free to move, and are repelled by…" Graders look for that reasoning, not just the final sign.')}
${check('A small amount of negative charge is placed on one spot of a neutral, isolated metal sphere. Shortly afterward, the charge is…', ['Still concentrated at that spot', 'Spread uniformly through the inside of the sphere', 'Spread over the outer surface of the sphere', 'Gone — metals can\'t hold charge'], 2, 'The extra electrons repel each other and are free to move, so they spread as far apart as they can: over the outer surface. (A sphere spreads them evenly.)')}
${check('Why is a copper wire wrapped in plastic?', ['The plastic makes the copper conduct better', 'The copper lets charge flow along it; the plastic keeps charge from leaking out to whatever the wire touches', 'Plastic is a conductor that shares the current', 'It stores extra charge'], 1, 'Copper (conductor) carries the charge; plastic (insulator) keeps it from flowing into your hand or other wires.')}
`;
      const host = el.querySelector('[data-sim="bar"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const ASP = 0.42;
      const bar = { x0: 0.08, x1: 0.92, y0: 0.13, y1: 0.29 };
      let mat = 'metal';
      let excess = [];
      let rodT = 0, gndT = 0;
      // background particles (positions in w units)
      const R = PR.rng(7);
      const ions = [];
      for (let i = 0; i < 18; i++) for (let j = 0; j < 3; j++) ions.push({ x: bar.x0 + 0.025 + (i * (bar.x1 - bar.x0 - 0.05)) / 17, y: bar.y0 + 0.03 + j * 0.05 });
      const sea = ions.map((p) => ({ x: p.x + R.range(-0.02, 0.02), y: p.y + R.range(-0.02, 0.02), vx: R.range(-1, 1), vy: R.range(-1, 1), ph: R.range(0, 6.28) }));
      let t = 0;
      function step(dt) {
        t += dt;
        // sea electrons wander (metal) or orbit (plastic)
        sea.forEach((e, i) => {
          if (mat === 'metal') {
            e.vx += R.range(-1, 1) * 0.6; e.vy += R.range(-1, 1) * 0.6;
            const m = Math.hypot(e.vx, e.vy) || 1; e.vx /= m; e.vy /= m;
            e.x += e.vx * 0.05 * dt; e.y += e.vy * 0.05 * dt;
            if (e.x < bar.x0 + 0.01 || e.x > bar.x1 - 0.01) e.vx *= -1;
            if (e.y < bar.y0 + 0.01 || e.y > bar.y1 - 0.01) e.vy *= -1;
            e.x = clamp(e.x, bar.x0 + 0.01, bar.x1 - 0.01); e.y = clamp(e.y, bar.y0 + 0.01, bar.y1 - 0.01);
          } else {
            const a = t * 3 + e.ph;
            e.x = ions[i].x + 0.012 * Math.cos(a); e.y = ions[i].y + 0.012 * Math.sin(a);
          }
        });
        if (mat === 'metal') {
          for (let s = 0; s < 3; s++) {
            excess.forEach((p) => {
              let fx = 0, fy = 0;
              excess.forEach((q) => {
                if (q === p) return;
                const dx = p.x - q.x, dy = p.y - q.y, r2 = dx * dx + dy * dy + 1e-5;
                const r3 = r2 * Math.sqrt(r2);
                fx += dx / r3; fy += dy / r3;
              });
              if (gndT > 0) { const dx = bar.x1 - p.x, dy = (bar.y0 + bar.y1) / 2 - p.y, d = Math.hypot(dx, dy) || 1; fx += (dx / d) * 4000; fy += (dy / d) * 4000; }
              const f = Math.hypot(fx, fy);
              const k = Math.min(0.0016, 1.5e-6 * f) / (f || 1);
              p.x = clamp(p.x + fx * k, bar.x0 + 0.012, bar.x1 - 0.012);
              p.y = clamp(p.y + fy * k, bar.y0 + 0.012, bar.y1 - 0.012);
            });
          }
        }
        if (gndT > 0) {
          gndT -= dt;
          excess = excess.filter((p) => (mat === 'metal' ? p.x < bar.x1 - 0.06 : p.x < bar.x1 - 0.08));
        }
        if (rodT > 0) rodT -= dt;
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const S = w;
        ctx.fillStyle = mat === 'metal' ? rgba(col('--muted'), 0.18) : rgba(col('--warn'), 0.14);
        ctx.strokeStyle = mat === 'metal' ? col('--muted') : col('--warn');
        ctx.lineWidth = 2;
        roundRect(ctx, bar.x0 * S, bar.y0 * S, (bar.x1 - bar.x0) * S, (bar.y1 - bar.y0) * S, 10);
        ctx.fill(); ctx.stroke();
        text(ctx, mat === 'metal' ? 'metal bar' : 'plastic bar', w / 2, bar.y1 * S + 16, { color: col('--muted') });
        const small = Math.max(2, w * 0.004);
        ctx.save(); ctx.globalAlpha = 0.35;
        ions.forEach((p) => chargeDot(ctx, p.x * S, p.y * S, 1, small * 1.6));
        sea.forEach((p) => chargeDot(ctx, p.x * S, p.y * S, -1, small * 1.2));
        ctx.restore();
        excess.forEach((p) => chargeDot(ctx, p.x * S, p.y * S, -1, Math.max(5, w * 0.011)));
        if (rodT > 0) {
          ctx.fillStyle = rgba(col('--neg'), 0.25); ctx.strokeStyle = col('--neg');
          roundRect(ctx, (bar.x0 - 0.07) * S, (bar.y0 - 0.1) * S, 0.07 * S, 0.12 * S, 6); ctx.fill(); ctx.stroke();
          text(ctx, 'rod', (bar.x0 - 0.035) * S, (bar.y0 - 0.115) * S, { color: col('--neg'), size: 11 });
        }
        if (gndT > 0) {
          const gx = (bar.x1 + 0.03) * S, gy = ((bar.y0 + bar.y1) / 2) * S;
          ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(bar.x1 * S, gy); ctx.lineTo(gx, gy); ctx.lineTo(gx, gy + 0.08 * S);
          for (let i = 0; i < 3; i++) { const half = (12 - i * 4) * (w / 700); ctx.moveTo(gx - half, gy + 0.08 * S + i * 5); ctx.lineTo(gx + half, gy + 0.08 * S + i * 5); }
          ctx.stroke();
          text(ctx, 'to ground (you)', gx - 4, gy + 0.08 * S + 26, { color: col('--muted'), size: 11, align: 'right' });
        }
        ro.innerHTML = `<span>Extra electrons: <b>${excess.length}</b></span><span>Net charge: <b>${signed(-excess.length * QE)} C</b> (= ${excess.length ? '−' + excess.length : '0'}e)</span>`;
      }
      const st = stage(cv, ASP, draw);
      host.querySelector('[data-k="add"]').onclick = () => {
        if (excess.length > 30) return;
        rodT = 0.9;
        for (let i = 0; i < 8; i++) excess.push({ x: bar.x0 + 0.015 + R.range(0, 0.03), y: R.range(bar.y0 + 0.02, bar.y1 - 0.02) });
      };
      host.querySelector('[data-k="gnd"]').onclick = () => { gndT = mat === 'metal' ? 2 : 1; };
      host.querySelector('[data-k="mat"]').onchange = (e) => { mat = e.target.value; excess = []; };
      const stop = loop((dt) => {
        step(dt);
        st.draw();
      });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 3. Charging: friction, conduction, induction, polarization, electroscope
  // =====================================================================
  const ring = (n, r, ph = 0) => Array.from({ length: n }, (_, i) => [r * Math.cos(ph + (i * 2 * Math.PI) / n), r * Math.sin(ph + (i * 2 * Math.PI) / n)]);
  const rep = (v, n) => Array.from({ length: n }, () => v);

  function buildScenes() {
    const S = {};
    // --- friction ---
    {
      const objects = [
        { kind: 'balloon', label: 'rubber balloon', pos: [[0.3, 0.24], [0.43, 0.24], [0.27, 0.24]], net: true },
        { kind: 'cloth', label: 'wool', pos: [[0.7, 0.24], [0.6, 0.24], [0.73, 0.24]], net: true },
      ];
      const charges = [];
      [0, 1].forEach((o) => {
        for (let i = 0; i < 6; i++) {
          const cx = i % 2 ? 0.03 : -0.03, cy = -0.08 + Math.floor(i / 2) * 0.08;
          charges.push({ q: 1, at: rep([o, cx - 0.013, cy], 3) });
          if (o === 1 && cx < 0) {
            const k = Math.floor(i / 2);
            charges.push({ q: -1, at: [[1, cx + 0.013, cy], [0, 0.08, -0.06 + k * 0.06], [0, 0.08, -0.06 + k * 0.06]] });
          } else charges.push({ q: -1, at: rep([o, cx + 0.013, cy], 3) });
        }
      });
      S.friction = {
        name: 'Friction', objects, charges,
        captions: [
          'Both objects start neutral: every atom has as many protons (+) as electrons (−).',
          'Rub them together. Rubbing brings huge numbers of atoms into close contact. Rubber holds electrons more tightly than wool does, so some electrons hop from the wool onto the balloon.',
          'Pull them apart. The balloon has 3 extra electrons (net −3e); the wool is missing 3 (net +3e). The total is still zero — charge moved, it wasn\'t created. The two objects now attract each other.',
        ],
      };
    }
    // --- conduction ---
    {
      const objects = [
        { kind: 'sphere', r: 0.1, label: 'charged sphere A', pos: [[0.22, 0.24], [0.4, 0.24], [0.4, 0.24], [0.22, 0.24]], net: true },
        { kind: 'sphere', r: 0.1, label: 'neutral sphere B', pos: rep([0.6, 0.24], 4), net: true },
      ];
      const charges = [];
      [0, 1].forEach((o) => ring(4, 0.04, 0.78).forEach((p) => charges.push({ q: 1, at: rep([o, p[0], p[1]], 4) })));
      const r8 = ring(8, 0.075, 0.2), r6 = ring(6, 0.075, 0.5), r4 = ring(4, 0.075, 0.2);
      for (let i = 0; i < 8; i++) {
        const late = i < 6 ? [0, r6[i][0], r6[i][1]] : [1, r6[i - 2][0], r6[i - 2][1]];
        charges.push({ q: -1, at: [[0, r8[i][0], r8[i][1]], [0, r8[i][0], r8[i][1]], late, late] });
      }
      for (let i = 0; i < 4; i++) charges.push({ q: -1, at: [[1, r4[i][0], r4[i][1]], [1, r4[i][0], r4[i][1]], [1, r6[i][0], r6[i][1]], [1, r6[i][0], r6[i][1]]] });
      S.conduction = {
        name: 'Conduction', objects, charges,
        captions: [
          'Metal sphere A has 4 extra electrons (net −4e). Identical metal sphere B is neutral.',
          'Touch them together. Now they form one big conductor, and the extra electrons on A repel each other.',
          'The extra electrons spread out over the combined object — 2 move onto B. Identical spheres end up sharing the excess equally.',
          'Separate them. Each has net −2e. Charging by conduction gives the object the <b>same sign</b> as the charger. Total charge: −4e before, −4e after.',
        ],
      };
    }
    // --- induction ---
    {
      const objects = [
        { kind: 'rod', label: 'negative rod', pos: [[0.1, 0.24], [0.25, 0.24], [0.25, 0.24], [0.25, 0.24], [-0.25, 0.24]] },
        { kind: 'sphere', r: 0.12, label: 'metal sphere', pos: rep([0.56, 0.24], 5), net: true },
      ];
      const charges = [];
      for (let i = 0; i < 5; i++) charges.push({ q: -1, at: rep([0, -0.08 + i * 0.04, 0], 5) });
      ring(6, 0.05, 0.3).forEach((p) => charges.push({ q: 1, at: rep([1, p[0], p[1]], 5) }));
      const r0 = ring(6, 0.095, 0.5);
      const right6 = Array.from({ length: 6 }, (_, i) => { const a = ((-62 + i * 24.8) * Math.PI) / 180; return [0.095 * Math.cos(a), 0.095 * Math.sin(a)]; });
      const right3 = [-30, 0, 30].map((d) => [0.095 * Math.cos((d * Math.PI) / 180), 0.095 * Math.sin((d * Math.PI) / 180)]);
      const even3 = ring(3, 0.095, 0.4);
      for (let i = 0; i < 6; i++) {
        const leave = i >= 3; // these exit to ground
        charges.push({
          q: -1,
          at: [
            [1, r0[i][0], r0[i][1]],
            [1, right6[i][0], right6[i][1]],
            leave ? [-1, 0.77 + (i - 3) * 0.03, 0.475] : [1, right3[i][0], right3[i][1]],
            leave ? null : [1, right3[i][0], right3[i][1]],
            leave ? null : [1, even3[i][0], even3[i][1]],
          ],
        });
      }
      S.induction = {
        name: 'Induction', objects, charges, ground: true,
        captions: [
          'A neutral metal sphere on an insulating stand. Its free electrons can move around inside it.',
          'Bring a negative rod close — <b>without touching</b>. The rod repels the sphere\'s free electrons to the far side. The sphere is still neutral overall, but it\'s now <b>polarized</b>: + near the rod, − on the far side.',
          'Ground the far side (connect a wire to the Earth). The electrons are still being pushed by the rod, and now they have an escape route: some flow into the Earth.',
          'Disconnect the ground wire <b>while the rod is still nearby</b>. The electrons that left can\'t come back.',
          'Now take the rod away. The sphere is left with a net charge of +3e, spread evenly over its surface. Induction gives the <b>opposite sign</b> to the charging rod — and the rod never touched the sphere.',
        ],
      };
    }
    // --- polarization ---
    {
      const objects = [
        { kind: 'rod', label: 'negative rod', pos: [[0.1, 0.24], [0.3, 0.24], [0.3, 0.24]] },
        { kind: 'paper', label: 'neutral paper (insulator)', pos: [[0.64, 0.24], [0.64, 0.24], [0.6, 0.24]], net: true },
      ];
      const charges = [];
      for (let i = 0; i < 5; i++) charges.push({ q: -1, at: rep([0, -0.08 + i * 0.04, 0], 3) });
      for (let i = 0; i < 6; i++) {
        const cx = i % 2 ? 0.04 : -0.04, cy = -0.075 + Math.floor(i / 2) * 0.075;
        charges.push({ q: -1, cloud: true, at: [[1, cx, cy], [1, cx + 0.016, cy], [1, cx + 0.016, cy]] });
        charges.push({ q: 1, at: rep([1, cx, cy], 3) });
      }
      S.polarization = {
        name: 'Polarization', objects, charges, pull: true,
        captions: [
          'A scrap of paper is an insulator: no free electrons. But each atom\'s electron cloud (pale blue) can shift a tiny bit around its nucleus (+).',
          'Bring a negative rod near. In every atom the electron cloud is pushed slightly <b>away</b> from the rod, leaving each + nucleus a bit <b>closer</b> to the rod. The paper is polarized, but still neutral.',
          'Now the + parts are closer to the rod than the − parts. Electric force gets stronger at shorter distance, so the attraction beats the repulsion: the <b>neutral</b> paper is pulled toward the rod. (Same reason a rubbed balloon sticks to a wall.)',
        ],
      };
    }
    // --- electroscope ---
    {
      const sp = [0.05, 0.5, 0.05, 0.5, 0.5];
      const objects = [
        { kind: 'rod', label: 'negative rod', pos: [[0.12, 0.12], [0.3, 0.12], [-0.25, 0.12], [0.335, 0.12], [-0.25, 0.12]] },
        { kind: 'knob', r: 0.045, label: '', pos: rep([0.5, 0.12], 5), net: false },
        { kind: 'stem', label: '', pos: rep([0.5, 0.25], 5) },
        { kind: 'leaf', label: '', pos: rep([0.5, 0.34], 5), ang: sp },
        { kind: 'leaf', label: '', pos: rep([0.5, 0.34], 5), ang: sp.map((a) => -a) },
      ];
      const charges = [];
      for (let i = 0; i < 5; i++) {
        const home = [0, -0.08 + i * 0.04, 0];
        charges.push({ q: -1, at: i >= 3 ? [home, home, home, [i === 3 ? 3 : 4, 0, 0.08], [i === 3 ? 3 : 4, 0, 0.08]] : rep(home, 5) });
      }
      ring(3, 0.02, 0.5).forEach((p) => charges.push({ q: 1, at: rep([1, p[0], p[1]], 5) }));
      const kr = ring(3, 0.03, 1.5);
      charges.push({ q: -1, at: [[1, kr[0][0], kr[0][1]], [1, 0, 0.032], [1, kr[0][0], kr[0][1]], [1, kr[0][0], kr[0][1]], [1, kr[0][0], kr[0][1]]] });
      charges.push({ q: -1, at: [[1, kr[1][0], kr[1][1]], [3, 0, 0.08], [1, kr[1][0], kr[1][1]], [1, kr[1][0], kr[1][1]], [1, kr[1][0], kr[1][1]]] });
      charges.push({ q: -1, at: [[1, kr[2][0], kr[2][1]], [4, 0, 0.08], [1, kr[2][0], kr[2][1]], [1, kr[2][0], kr[2][1]], [1, kr[2][0], kr[2][1]]] });
      [3, 4].forEach((o) => { charges.push({ q: 1, at: rep([o, 0, 0.035], 5) }); charges.push({ q: -1, at: rep([o, 0, 0.055], 5) }); });
      S.electroscope = {
        name: 'Electroscope', objects, charges, scope: true,
        captions: [
          'An electroscope: a metal knob connected by a metal stem to two very light metal leaves. Neutral, so the leaves hang straight down.',
          'Bring a negative rod near the knob (no touching). Free electrons are repelled down into the leaves. Both leaves are now negative, so they repel and spread apart.',
          'Take the rod away: the electrons spread back out and the leaves fall closed. Nothing was transferred.',
          'Now touch the rod to the knob. A few electrons flow onto the electroscope (charging by conduction). They spread out to the leaves, which repel.',
          'Remove the rod. The electroscope keeps its extra electrons, so the leaves stay apart. The spread shows how much charge it has — but not the sign.',
        ],
      };
    }
    return S;
  }

  LESSONS.push({
    unit: 1, order: 3, id: 'u1-charging', title: 'Four ways to charge an object (plus the electroscope)',
    render(el) {
      el.innerHTML = `
<p class="lead">Every object starts neutral. To charge it, you need to move electrons on or off it. There are only a few ways to do that, and each one follows from two facts you already know: like charges repel / unlike attract, and electrons move freely only in conductors.</p>

<div class="sim" data-sim="charge">
  <canvas></canvas>
  <div class="sim-controls" data-k="methods"></div>
  <div class="sim-controls">
    <button class="btn small" data-k="back">◂ Back</button>
    <button class="btn small primary" data-k="next">Next step ▸</button>
    <span class="muted" data-k="stepn"></span>
  </div>
  <div class="sim-caption" data-k="cap" style="font-size:14px;color:var(--text)"></div>
</div>

<h2>1. Friction (rubbing)</h2>
<p>Different materials hold their electrons with different strength. When two materials rub, electrons move to the one that holds them more tightly. The list ranking materials by this is called the <b>triboelectric series</b>: rubber, plastic and PVC tend to grab electrons (become −); hair, wool, glass and fur tend to lose them (become +). Both objects end up with <b>equal and opposite</b> charges — conservation of charge.</p>

<h2>2. Conduction (touching)</h2>
<p>Touch a charged object to a conductor and the excess charge spreads across both, because the extra charges repel each other and want to get as far apart as possible. The new object ends up with the <b>same sign</b> as the charger.</p>
<p>For two <b>identical</b> conducting spheres, symmetry means they end up with equal charges. Since total charge is conserved:</p>
${eq('\\[ q_{\\text{each}} = \\frac{q_A + q_B}{2} \\]', 'where \\(q_A, q_B\\) = charges before touching (with signs!); afterward each identical sphere holds half the total. Example: +6 nC touches −2 nC → each ends with (6 − 2)/2 = +2 nC.')}

<h2>3. Induction (no touching!)</h2>
<p>Bring a charged rod near a conductor and its free electrons shift — pushed away by a negative rod or pulled toward a positive one. If you give those electrons a path to or from the ground, then cut the path <i>before</i> removing the rod, the conductor is left charged with the <b>opposite sign</b> from the rod. The order of steps matters: ground, cut ground, <i>then</i> remove rod.</p>
<p>A variation: two touching metal spheres. Bring a rod near one, separate the spheres while the rod is still there, and they end up with equal and opposite charges.</p>

<h2>4. Polarization (why charged things attract neutral things)</h2>
<p>A charged object attracts <b>any</b> neutral object — a conductor or an insulator. It pulls the opposite charge slightly closer and pushes the same charge slightly farther. Because electric force is stronger at shorter distances (next lesson!), the near attraction beats the far repulsion. No net charge is transferred; the object is just polarized.</p>

<h2>The electroscope</h2>
<p>An electroscope is a charge detector: like charges on its two leaves repel, so the leaves spread apart. It responds to a nearby charged object (by induction-style separation) and can be charged by touching (conduction).</p>

${call('analogy', 'Analogy: induction is like leaving a party through the back door', 'The rod is a loud guest walking into one side of the room. Everyone (the electrons) crowds to the far side. Open the back door (ground) and some leave. Close the door, and when the loud guest leaves, the room has fewer people than it started with.')}
${call('mistake', 'Common mistakes', '<ul><li>Saying protons move during induction. Only electrons move; "positive regions" are just places with fewer electrons.</li><li>Removing the rod before cutting the ground — then the electrons just come back and the object ends up neutral.</li><li>Thinking attraction proves the object is charged. A neutral object is attracted too (polarization). Only <b>repulsion</b> proves two objects have the same sign of charge.</li></ul>')}
${call('ap', 'On the AP exam', 'You\'ll be asked to draw charge distributions (+ and − signs on diagrams) at each step and justify them. Always conserve charge in your drawing: count your + and − signs.')}
${check('Identical metal spheres with +2Q and −Q touch, then separate. What is the charge on each?', ['+Q and 0', '+Q/2 each', '+3Q/2 each', '+2Q and −Q (no change)'], 1, 'Total = +2Q + (−Q) = +Q. Identical spheres share equally: +Q/2 each. (Notice the force between them changes from attractive to repulsive!)')}
${check('A positively charged rod is used to charge a neutral metal sphere by induction (with grounding). The sphere ends up…', ['Positive', 'Negative', 'Neutral', 'It depends on the size of the sphere'], 1, 'The + rod pulls electrons up from the ground into the sphere. Cut the ground, remove the rod: the sphere keeps the extra electrons, so it\'s negative — opposite to the rod.')}
${check('A charged balloon is held near a small piece of neutral paper. What happens?', ['Nothing — the paper is neutral', 'The paper is attracted to the balloon', 'The paper is repelled', 'It depends on the sign of the balloon\'s charge'], 1, 'Either sign polarizes the paper so that its opposite-charge side is closer. The closer attraction wins: always attraction.')}
`;
      const SC = buildScenes();
      const host = el.querySelector('[data-sim="charge"]');
      const cv = host.querySelector('canvas');
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      let key = 'friction', step = 0, prev = 0, t = 1;
      q('methods').innerHTML = Object.keys(SC).map((k) => `<button class="btn small" data-m="${k}">${SC[k].name}</button>`).join('');
      const setBtns = () => {
        q('methods').querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('primary', b.dataset.m === key));
        const sc = SC[key];
        q('stepn').textContent = `Step ${step + 1} of ${sc.captions.length}`;
        q('cap').innerHTML = sc.captions[step];
        q('next').disabled = step >= sc.captions.length - 1;
        q('back').disabled = step === 0;
      };
      q('methods').querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { key = b.dataset.m; step = prev = 0; t = 1; setBtns(); }));
      q('next').onclick = () => { if (step < SC[key].captions.length - 1) { prev = step; step++; t = 0; setBtns(); } };
      q('back').onclick = () => { if (step > 0) { prev = step; step--; t = 0; setBtns(); } };
      setBtns();

      function objState(sc, o, s) {
        const ob = sc.objects[o];
        return { x: ob.pos[s][0], y: ob.pos[s][1], a: ob.ang ? ob.ang[s] : 0 };
      }
      function objNow(sc, o, e) {
        const A = objState(sc, o, prev), B = objState(sc, o, step);
        return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), a: lerp(A.a, B.a, e) };
      }
      function gp(sc, at, s) {
        if (!at) return null;
        if (at[0] < 0) return [at[1], at[2]];
        const O = objState(sc, at[0], s);
        const c = Math.cos(O.a), sn = Math.sin(O.a);
        return [O.x + at[1] * c - at[2] * sn, O.y + at[1] * sn + at[2] * c];
      }
      function drawObj(ctx, ob, O, S, w) {
        const x = O.x * S, y = O.y * S;
        ctx.lineWidth = 2;
        if (ob.kind === 'balloon') {
          ctx.beginPath(); ctx.ellipse(x, y, 0.11 * S, 0.14 * S, 0, 0, Math.PI * 2);
          ctx.fillStyle = col('--surface'); ctx.fill(); ctx.strokeStyle = col('--text'); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y + 0.14 * S); ctx.lineTo(x - 6, y + 0.14 * S + 9); ctx.lineTo(x + 6, y + 0.14 * S + 9); ctx.closePath(); ctx.stroke();
        } else if (ob.kind === 'cloth') {
          ctx.fillStyle = rgba(col('--warn'), 0.14); ctx.strokeStyle = col('--warn');
          roundRect(ctx, x - 0.09 * S, y - 0.13 * S, 0.18 * S, 0.26 * S, 10); ctx.fill(); ctx.stroke();
        } else if (ob.kind === 'sphere' || ob.kind === 'knob') {
          ctx.beginPath(); ctx.arc(x, y, ob.r * S, 0, Math.PI * 2);
          ctx.fillStyle = rgba(col('--muted'), 0.14); ctx.fill(); ctx.strokeStyle = col('--muted'); ctx.stroke();
          if (ob.kind === 'sphere') { ctx.beginPath(); ctx.moveTo(x, y + ob.r * S); ctx.lineTo(x, y + ob.r * S + 0.06 * S); ctx.strokeStyle = col('--border'); ctx.lineWidth = 5; ctx.stroke(); }
        } else if (ob.kind === 'rod') {
          ctx.fillStyle = rgba(col('--neg'), 0.12); ctx.strokeStyle = col('--neg');
          roundRect(ctx, x - 0.12 * S, y - 0.025 * S, 0.24 * S, 0.05 * S, 0.02 * S); ctx.fill(); ctx.stroke();
        } else if (ob.kind === 'paper') {
          ctx.fillStyle = col('--surface'); ctx.strokeStyle = col('--muted');
          ctx.fillRect(x - 0.09 * S, y - 0.12 * S, 0.18 * S, 0.24 * S); ctx.strokeRect(x - 0.09 * S, y - 0.12 * S, 0.18 * S, 0.24 * S);
        } else if (ob.kind === 'stem') {
          ctx.fillStyle = rgba(col('--muted'), 0.4); ctx.fillRect(x - 0.006 * S, y - 0.09 * S, 0.012 * S, 0.18 * S);
        } else if (ob.kind === 'leaf') {
          const L = 0.11 * S;
          ctx.strokeStyle = col('--warn'); ctx.lineWidth = Math.max(3, 0.012 * S);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * Math.sin(O.a), y + L * Math.cos(O.a)); ctx.stroke();
        }
        if (ob.label) {
          const dy = ob.kind === 'rod' ? 0.05 : ob.kind === 'sphere' ? ob.r + 0.085 : 0.175;
          text(ctx, ob.label, x, y + dy * S, { color: col('--muted'), size: w < 500 ? 10 : 12 });
        }
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const sc = SC[key], S = w, e = ease(clamp(t, 0, 1));
        if (sc.scope) {
          ctx.strokeStyle = col('--border'); ctx.lineWidth = 1.5;
          roundRect(ctx, 0.38 * S, 0.21 * S, 0.24 * S, 0.27 * S, 12); ctx.stroke();
        }
        if (sc.ground && step >= 2) {
          const sp = sc.objects[1].pos[2], a = 0.7, r = sc.objects[1].r;
          const sx = (sp[0] + r * Math.cos(a)) * S, sy = (sp[1] + r * Math.sin(a)) * S;
          const gx = 0.8 * S, gy = 0.43 * S;
          ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
          ctx.beginPath();
          if (step === 2) { ctx.moveTo(sx, sy); ctx.lineTo(gx, sy); ctx.lineTo(gx, gy); }
          else { ctx.moveTo(gx, sy + 0.03 * S); ctx.lineTo(gx, gy); }
          for (let i = 0; i < 3; i++) { const hw = (0.03 - i * 0.009) * S; ctx.moveTo(gx - hw, gy + i * 0.012 * S); ctx.lineTo(gx + hw, gy + i * 0.012 * S); }
          ctx.stroke();
          text(ctx, step === 2 ? 'ground' : 'ground (cut)', gx + 0.04 * S, gy - 0.02 * S, { align: 'left', color: col('--muted'), size: 11 });
        }
        sc.objects.forEach((ob, o) => drawObj(ctx, ob, objNow(sc, o, e), S, w));
        const cr = Math.max(4.5, w * 0.0105);
        sc.charges.forEach((c) => {
          const A = gp(sc, c.at[prev], prev), B = gp(sc, c.at[step], step);
          let x, y, al = 1;
          if (A && B) { x = lerp(A[0], B[0], e); y = lerp(A[1], B[1], e); }
          else if (A) { x = A[0]; y = A[1]; al = 1 - e; }
          else if (B) { x = B[0]; y = B[1]; al = e; }
          else return;
          if (c.cloud) {
            ctx.save(); ctx.globalAlpha = 0.28 * al;
            ctx.beginPath(); ctx.arc(x * S, y * S, cr * 2.3, 0, Math.PI * 2); ctx.fillStyle = col('--neg'); ctx.fill();
            ctx.restore();
          } else chargeDot(ctx, x * S, y * S, c.q, cr, al);
        });
        if (t >= 1) {
          sc.objects.forEach((ob, o) => {
            if (!ob.net) return;
            let n = 0;
            sc.charges.forEach((c) => { if (c.at[step] && c.at[step][0] === o) n += c.q; });
            const O = objState(sc, o, step);
            const dy = ob.kind === 'sphere' ? -(ob.r + 0.03) : -0.17;
            text(ctx, `net ${n > 0 ? '+' + n + 'e' : n < 0 ? '−' + -n + 'e' : '0'}`, O.x * S, (O.y + dy) * S, {
              weight: 700, size: 13, color: n > 0 ? col('--pos') : n < 0 ? col('--neg') : col('--muted'),
            });
          });
          if (sc.scope) {
            let n = 0;
            sc.charges.forEach((c) => { const a = c.at[step]; if (a && a[0] >= 1) n += c.q; });
            text(ctx, `electroscope net ${n > 0 ? '+' + n + 'e' : n < 0 ? '−' + -n + 'e' : '0'}`, 0.5 * S, 0.035 * S, { weight: 700, color: n < 0 ? col('--neg') : n > 0 ? col('--pos') : col('--muted') });
          }
          if (sc.pull && step === 2) {
            const P = objState(sc, 1, 2);
            const x = (P.x - 0.09) * S, y = (P.y - 0.15) * S;
            arrow(ctx, x + 0.02 * S, y, x - 0.08 * S, y, col('--pos'), 2.5);
            text(ctx, 'strong pull on near +', x - 0.09 * S, y - 12, { size: 11, color: col('--pos'), align: 'left' });
            const x2 = (P.x + 0.09) * S;
            arrow(ctx, x2 - 0.02 * S, y, x2 + 0.025 * S, y, col('--neg'), 2);
            text(ctx, 'weak push on far −', x2 + 0.03 * S, y - 12, { size: 11, color: col('--neg'), align: 'right' });
          }
        }
      }
      const st = stage(cv, 0.5, draw);
      const stop = loop((dt) => { if (t < 1) t = Math.min(1, t + dt / 1.1); st.draw(); });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 4. Coulomb's law
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 4, id: 'u1-coulomb', title: "Coulomb's law: how hard charges push and pull",
    render(el) {
      el.innerHTML = `
<p class="lead">We know like charges repel and unlike attract. Now: <i>how strongly?</i> The answer looks almost exactly like Newton's law of gravity from Physics 1 — which makes it easy to learn, as long as you notice the two big differences.</p>

<h2>Play first</h2>
<p>Drag either charge. Change their sizes and signs with the sliders. Watch the force arrows and the graph below.</p>
<div class="sim" data-sim="coul">
  <canvas></canvas>
  <canvas data-k="graph" style="border-top:1px solid var(--border)"></canvas>
  <div class="sim-controls">
    <label>q₁ <input type="range" data-k="q1" min="-5" max="5" step="0.5" value="3"> <span data-k="q1v"></span></label>
    <label>q₂ <input type="range" data-k="q2" min="-5" max="5" step="0.5" value="-2"> <span data-k="q2v"></span></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Arrow lengths grow with force (on a compressed scale so they fit). The two arrows are <b>always</b> the same length, even when one charge is much bigger.</div>
</div>
<p>Things to notice:</p>
<ul>
<li>Bigger charges → bigger force. Double one charge and the force doubles.</li>
<li>Farther apart → much weaker force. Double the distance and the force drops to <b>one quarter</b>.</li>
<li>The force on q₁ and on q₂ are always equal in size and opposite in direction.</li>
</ul>

<h2>The law</h2>
${eq('\\[ F_E = k\\,\\frac{|q_1|\\,|q_2|}{r^2} \\]', 'where \\(F_E\\) = magnitude of the electric force each charge exerts on the other (N); \\(q_1, q_2\\) = the charges (C); \\(r\\) = distance between their centers (m); \\(k = 8.99\\times10^{9}\\ \\text{N·m}^2/\\text{C}^2\\), Coulomb\'s constant. (You may also see \\(k = \\frac{1}{4\\pi\\varepsilon_0}\\) with \\(\\varepsilon_0 = 8.85\\times10^{-12}\\ \\text{C}^2/\\text{N·m}^2\\) — same number.)')}
<p>Use the formula for the <b>size</b> of the force. Get the <b>direction</b> from the rule: like charges push apart, unlike pull together, always along the line connecting them.</p>
<p><b>Example.</b> Two +2.0 μC charges are 0.30 m apart. \\(F = (8.99\\times10^9)(2.0\\times10^{-6})(2.0\\times10^{-6})/(0.30)^2 = 0.40\\) N, pushing them apart. That's about the weight of a small apple — from a few millionths of a coulomb.</p>

<h2>Why "inverse square"?</h2>
<p>Picture the charge's influence spreading out equally in all directions, like light from a bulb or paint from a spray can. At distance r it's spread over a sphere of area \\(4\\pi r^2\\). Double r and the area is 4× bigger, so the influence at any spot is ¼ as strong. Gravity spreads out the same way, which is why it has the same \\(1/r^2\\).</p>

<h2>Compare with gravity</h2>
${eq('\\[ F_G = G\\,\\frac{m_1 m_2}{r^2} \\qquad\\text{vs.}\\qquad F_E = k\\,\\frac{|q_1||q_2|}{r^2} \\]', 'Same shape: product of the "amounts of stuff," divided by distance squared, acting along the line between them. \\(G = 6.67\\times10^{-11}\\) N·m²/kg², tiny; \\(k = 8.99\\times10^{9}\\) N·m²/C², enormous.')}
<ul>
<li><b>Gravity only attracts.</b> There's no negative mass. Electric force can attract or repel.</li>
<li><b>Electric force is far stronger.</b> For two protons, \\(F_E/F_G \\approx 1.2\\times10^{36}\\). Gravity only wins at large scales because big objects are almost perfectly neutral, so their electric forces cancel.</li>
</ul>

<h2>Proportional reasoning (a favorite AP move)</h2>
<p>Since \\(F \\propto q_1 q_2 / r^2\\), you can answer "what happens if…" without numbers:</p>
<ul>
<li>Double one charge → F × 2. Double both → F × 4.</li>
<li>Triple the distance → F ÷ 9.</li>
<li>Double both charges <i>and</i> halve the distance → F × 4 × 4 = 16.</li>
</ul>

<h2>Hanging charged spheres</h2>
<p>A classic setup: two small charged spheres hang from threads and push each other apart. Each sphere is in equilibrium (Physics 1!) under three forces: weight \\(mg\\) down, tension \\(T\\) along the thread, and the electric force \\(F_E\\) horizontally. If the thread makes angle θ with the vertical, the vertical and horizontal balances give:</p>
${eq('\\[ T\\cos\\theta = mg, \\quad T\\sin\\theta = F_E \\quad\\Rightarrow\\quad \\tan\\theta = \\frac{F_E}{mg} \\]', 'where θ = angle of the thread from vertical; \\(m\\) = sphere\'s mass (kg); \\(g\\) = 9.8 m/s². Even if the spheres have different charges, the electric forces on them are equal (Newton\'s 3rd law), so equal-mass spheres hang at equal angles.')}

${call('analogy', 'Analogy: a magnet you can\'t turn off', 'Feeling the push between two balloons is like feeling the push between two magnets: no contact, and it gets dramatically stronger as they get close. Coulomb\'s law is the precise rule for how dramatically: \\(1/r^2\\).')}
${call('mistake', 'Common mistake: "the bigger charge pushes harder"', 'A +5 μC charge and a +1 μC charge exert <b>equal</b> forces on each other — it\'s one interaction, a Newton\'s-third-law pair. The bigger charge doesn\'t "win." (What differs is the <i>acceleration</i> if their masses differ.) Also: don\'t plug signs into the formula and then trust the sign of the answer for direction — use magnitudes and decide the direction from like/unlike.')}
${call('ap', 'On the AP exam', 'Ratio questions ("the force is F; the charges are each doubled and the distance halved; what is the new force?") are extremely common. Write \\(F_{new}/F_{old}\\) as a product of factors.')}
${check('Two small spheres have equal charges and are a distance d apart, with force F between them. Each charge is doubled and d is halved. The new force is…', ['F', '4F', '8F', '16F'], 3, 'Charges: 2 × 2 = 4. Distance: (1/2)² in the denominator gives × 4. Total 16F.')}
${check('A +1 μC charge sits 10 cm from a +4 μC charge. Compared with the force on the +1 μC charge, the force on the +4 μC charge is…', ['4 times as large', 'the same size', '1/4 as large', '16 times as large'], 1, 'Newton\'s third law: the two forces are an action–reaction pair, equal in magnitude and opposite in direction.')}
`;
      const host = el.querySelector('[data-sim="coul"]');
      const cv = host.querySelector('canvas');
      const gcv = host.querySelector('[data-k="graph"]');
      const ro = host.querySelector('.sim-readout');
      const H = 0.45;
      const c1 = { x: 0.3, y: H / 2, q: 3 }, c2 = { x: 0.7, y: H / 2, q: -2 };
      const Fof = (r) => (K * Math.abs(c1.q * c2.q) * 1e-12) / (r * r);
      const rad = (q, w) => (w < 520 ? 0.85 : 1) * (10 + 3 * Math.sqrt(Math.abs(q)));
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const s = w;
        const dx = c2.x - c1.x, dy = c2.y - c1.y;
        const r = Math.max(Math.hypot(dx, dy), 0.02);
        const ux = dx / r, uy = dy / r;
        const F = Fof(r);
        ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c1.x * s, c1.y * s); ctx.lineTo(c2.x * s, c2.y * s); ctx.stroke(); ctx.restore();
        text(ctx, `r = ${r.toFixed(2)} m`, ((c1.x + c2.x) / 2) * s - uy * 16, ((c1.y + c2.y) / 2) * s + ux * 16, { color: col('--muted') });
        if (F > 0) {
          const L = Math.min(0.3 * w, 26 * Math.log(1 + F / 0.02));
          const rep = c1.q * c2.q > 0 ? 1 : -1;
          const r1 = rad(c1.q, w) + 3, r2 = rad(c2.q, w) + 3;
          // on q2: along +u if repel
          const ax = rep * ux, ay = rep * uy;
          const s2x = c2.x * s + ax * (rep > 0 ? r2 : 0), s2y = c2.y * s + ay * (rep > 0 ? r2 : 0);
          arrow(ctx, s2x, s2y, s2x + ax * L, s2y + ay * L, col('--accent'), 3, 11);
          const s1x = c1.x * s - ax * (rep > 0 ? r1 : 0), s1y = c1.y * s - ay * (rep > 0 ? r1 : 0);
          arrow(ctx, s1x, s1y, s1x - ax * L, s1y - ay * L, col('--accent'), 3, 11);
          text(ctx, 'F on q₂', s2x + ax * (L + 14) - ay * 12, s2y + ay * (L + 14) + ax * 12, { color: col('--accent'), size: 12, weight: 600 });
          text(ctx, 'F on q₁', s1x - ax * (L + 14) - ay * 12, s1y - ay * (L + 14) + ax * 12, { color: col('--accent'), size: 12, weight: 600 });
        }
        chargeDot(ctx, c1.x * s, c1.y * s, c1.q, rad(c1.q, w));
        chargeDot(ctx, c2.x * s, c2.y * s, c2.q, rad(c2.q, w));
        text(ctx, 'q₁', c1.x * s, c1.y * s - rad(c1.q, w) - 10, { weight: 600 });
        text(ctx, 'q₂', c2.x * s, c2.y * s - rad(c2.q, w) - 10, { weight: 600 });
        const kind = F === 0 ? 'no force (a charge is zero)' : c1.q * c2.q > 0 ? 'repel (like charges)' : 'attract (unlike charges)';
        ro.innerHTML = `<span>r = <b>${r.toFixed(3)} m</b></span><span>F = <b>${sci(F)} N</b> on each</span><span>${kind}</span>`;
        drawGraph(r, F);
      }
      let g = null;
      function drawGraph(r, F) {
        if (!g) return;
        const ctx = g.ctx, w = g.w, h = g.h;
        ctx.clearRect(0, 0, w, h);
        const x0 = 46, x1 = w - 12, y0 = h - 24, y1 = 14;
        const rmin = 0.05, rmax = 1.0;
        const Fmax = Fof(0.15) || 1;
        const X = (rr) => x0 + ((rr - rmin) / (rmax - rmin)) * (x1 - x0);
        const Y = (ff) => y0 - Math.min(ff / Fmax, 1.05) * (y0 - y1);
        ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
        text(ctx, 'F', x0 - 14, y1 + 6, { color: col('--muted') });
        text(ctx, 'r (m)', x1 - 16, y0 + 14, { color: col('--muted'), size: 11 });
        [0.25, 0.5, 0.75, 1].forEach((v) => text(ctx, String(v), X(v), y0 + 13, { color: col('--muted'), size: 10 }));
        if (F === 0) { text(ctx, 'F = 0 when either charge is zero', (x0 + x1) / 2, (y0 + y1) / 2, { color: col('--muted') }); return; }
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y1 - 4, x1 - x0, y0 - y1 + 4); ctx.clip();
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2; ctx.beginPath();
        for (let rr = rmin; rr <= rmax; rr += 0.004) { const yy = Y(Fof(rr)); if (rr === rmin) ctx.moveTo(X(rr), yy); else ctx.lineTo(X(rr), yy); }
        ctx.stroke(); ctx.restore();
        if (r <= rmax && r >= rmin) {
          ctx.beginPath(); ctx.arc(X(r), Y(F), 5, 0, Math.PI * 2); ctx.fillStyle = col('--accent'); ctx.fill();
          text(ctx, 'you are here', X(r) + 8, Y(F) - 10, { align: 'left', color: col('--accent'), size: 11 });
          if (2 * r <= rmax) {
            ctx.beginPath(); ctx.arc(X(2 * r), Y(F / 4), 4, 0, Math.PI * 2); ctx.fillStyle = col('--muted'); ctx.fill();
            text(ctx, '2r → F/4', X(2 * r) + 7, Y(F / 4) - 10, { align: 'left', color: col('--muted'), size: 11 });
          }
        }
      }
      const st = stage(cv, H, draw);
      g = stage(gcv, 0.26, () => st.draw());
      st.draw();
      const sl = (k) => host.querySelector(`[data-k="${k}"]`);
      const upd = () => {
        c1.q = Number(sl('q1').value); c2.q = Number(sl('q2').value);
        sl('q1v').textContent = `${c1.q > 0 ? '+' : ''}${c1.q} μC`; sl('q2v').textContent = `${c2.q > 0 ? '+' : ''}${c2.q} μC`;
        st.request();
      };
      sl('q1').oninput = sl('q2').oninput = upd; upd();
      drag(cv, (x, y) => {
        const s = st.w;
        for (const c of [c2, c1]) if (Math.hypot(c.x * s - x, c.y * s - y) < rad(c.q, st.w) + 10) return c;
        return null;
      }, (c, x, y) => { c.x = clamp(x / st.w, 0.03, 0.97); c.y = clamp(y / st.w, 0.03, H - 0.03); st.request(); });
      return () => { st.destroy(); g.destroy(); };
    },
  });

  // =====================================================================
  // 5. Superposition of forces
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 5, id: 'u1-superposition', title: 'Many charges: adding forces as vectors',
    render(el) {
      el.innerHTML = `
<p class="lead">Coulomb's law describes two charges. Real situations have many. The good news: each pair interacts as if the others weren't there, and you add up the forces as vectors — exactly like net force in Physics 1.</p>

<h2>The superposition principle</h2>
<p>To find the net force on one charge (call it the <b>target</b>):</p>
<ol>
<li>Pick one other charge. Use Coulomb's law for the size of its force on the target, and like/unlike for the direction.</li>
<li>Repeat for every other charge. (Each force is unaffected by the others.)</li>
<li>Add the forces <b>as vectors</b>: break each into x- and y-components, add the x's, add the y's.</li>
<li>Recombine: \\(F_{net} = \\sqrt{F_x^2 + F_y^2}\\), direction \\(\\theta = \\tan^{-1}(F_y/F_x)\\).</li>
</ol>
${eq('\\[ \\vec F_{net} = \\vec F_1 + \\vec F_2 + \\vec F_3 + \\cdots, \\qquad F_{net,x} = \\sum F_{x}, \\quad F_{net,y} = \\sum F_{y} \\]', 'where each \\(\\vec F_i\\) is the Coulomb force from charge i alone on the target (N).')}

<div class="sim" data-sim="sup">
  <canvas></canvas>
  <div class="sim-controls">
    <label>q₁ <input type="range" data-k="q1" min="-4" max="4" step="1" value="3"></label>
    <label>q₂ <input type="range" data-k="q2" min="-4" max="4" step="1" value="-2"></label>
    <label>q₃ <input type="range" data-k="q3" min="-4" max="4" step="1" value="1"></label>
    <label><input type="checkbox" data-k="tip"> Tip-to-tail</label>
    <label><input type="checkbox" data-k="comp"> Show components</label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">The ringed charge is the target, +1 μC. Drag anything. Thin arrows: force from each charge (colored by that charge's sign). Thick arrow: the net force. Turn on tip-to-tail to see the vector sum built up.</div>
</div>

<h2>Charges on a line: where is the net force zero?</h2>
<p>Put +q at x = 0 and +4q at x = d. A positive test charge between them gets pushed right by the first and left by the second. The pushes balance where</p>
${eq('\\[ \\frac{kq}{x^2} = \\frac{k(4q)}{(d-x)^2} \\;\\Rightarrow\\; d - x = 2x \\;\\Rightarrow\\; x = \\frac{d}{3} \\]', 'The balance point is closer to the <b>smaller</b> charge, so its weaker pull gets the advantage of a shorter distance.')}
<p>For <b>unlike</b> charges, the forces between them point the same way, so they can't cancel there — the balance point is <b>outside</b>, beyond the smaller charge.</p>

<h2>Symmetry saves time</h2>
<p>If charges are arranged symmetrically around the target, components cancel in pairs. Four equal charges on the corners of a square push a target at the center equally in all four directions: net force zero. Two equal charges below a target: their sideways components cancel, and only the vertical parts add.</p>

${call('analogy', 'Analogy: tug-of-war with many ropes', 'Several people pull on a ring with ropes in different directions. Each pull is unaffected by the others; the ring moves according to the vector sum. That\'s superposition.')}
${call('mistake', 'Common mistake: adding magnitudes', 'A 3 N force and a 4 N force don\'t make 7 N unless they point the same way. At right angles they make 5 N. Always add components.')}
${call('ap', 'On the AP exam', 'Many questions just ask for a direction (e.g., "which arrow shows the net force?"). Sketch each force arrow at the target, roughly scaled, and use symmetry before calculating anything.')}
${check('Equal charges +Q sit at x = −a and x = +a. A positive test charge is placed on the y-axis above the origin. The net force on it points…', ['Straight up (+y)', 'Straight down', 'Toward the right', 'Zero force'], 0, 'Each charge pushes it away along a diagonal. The x-components cancel by symmetry; the y-components (both upward) add.')}
${check('+Q is at x = 0 and −4Q at x = d. Where could a test charge feel zero net force?', ['Between them, closer to +Q', 'Between them, closer to −4Q', 'To the left of +Q (x < 0)', 'To the right of −4Q (x > d)'], 2, 'Between unlike charges both forces point the same way, so no cancellation. Outside, the point must be closer to the smaller charge (+Q): at x = −d, where kQ/d² = 4kQ/(2d)².')}
`;
      const host = el.querySelector('[data-sim="sup"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const H = 0.6;
      const src = [{ x: 0.22, y: 0.2, q: 3 }, { x: 0.75, y: 0.15, q: -2 }, { x: 0.62, y: 0.48, q: 1 }];
      const tgt = { x: 0.45, y: 0.33, q: 1 };
      const opt = { tip: false, comp: false };
      const rad = (q, w) => (w < 520 ? 0.85 : 1) * (q === 0 ? 7 : 9 + 3 * Math.sqrt(Math.abs(q)));
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const s = w;
        const forces = src.map((c) => {
          const dx = tgt.x - c.x, dy = tgt.y - c.y, r = Math.max(Math.hypot(dx, dy), 0.02);
          const f = (K * c.q * tgt.q * 1e-12) / (r * r);
          return { fx: (f * dx) / r, fy: (f * dy) / r, mag: Math.abs(f), q: c.q };
        });
        const nx = forces.reduce((a, f) => a + f.fx, 0), ny = forces.reduce((a, f) => a + f.fy, 0);
        const nm = Math.hypot(nx, ny);
        const maxF = Math.max(nm, ...forces.map((f) => f.mag), 1e-9);
        const sc = Math.min(600, (0.24 * w) / maxF); // px per N
        const tx = tgt.x * s, ty = tgt.y * s;
        // faint lines to sources
        ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = col('--border');
        src.forEach((c) => { ctx.beginPath(); ctx.moveTo(c.x * s, c.y * s); ctx.lineTo(tx, ty); ctx.stroke(); });
        ctx.restore();
        let ox = tx, oy = ty;
        forces.forEach((f, i) => {
          if (f.mag === 0) return;
          const c = f.q > 0 ? col('--pos') : col('--neg');
          const sx = opt.tip ? ox : tx, sy = opt.tip ? oy : ty;
          const ex = sx + f.fx * sc, ey = sy - -f.fy * sc;
          arrow(ctx, sx, sy, ex, ey, c, 2, 8);
          text(ctx, `F${i + 1}`, ex + (f.fx >= 0 ? 10 : -10), ey + (f.fy >= 0 ? 10 : -10), { color: c, size: 12, weight: 600 });
          if (opt.tip) { ox = ex; oy = ey; }
        });
        if (nm > 0) {
          if (opt.comp) {
            ctx.save(); ctx.setLineDash([5, 4]);
            arrow(ctx, tx, ty, tx + nx * sc, ty, col('--muted'), 1.5, 7);
            arrow(ctx, tx + nx * sc, ty, tx + nx * sc, ty + ny * sc, col('--muted'), 1.5, 7);
            ctx.restore();
            text(ctx, 'Fx', tx + (nx * sc) / 2, ty + (ny > 0 ? -10 : 12), { color: col('--muted'), size: 11 });
            text(ctx, 'Fy', tx + nx * sc + (nx > 0 ? 14 : -14), ty + (ny * sc) / 2, { color: col('--muted'), size: 11 });
          }
          arrow(ctx, tx, ty, tx + nx * sc, ty + ny * sc, col('--accent'), 4, 13);
          text(ctx, 'F net', tx + nx * sc + (nx >= 0 ? 22 : -22), ty + ny * sc + (ny >= 0 ? 12 : -12), { color: col('--accent'), weight: 700 });
        }
        src.forEach((c, i) => {
          chargeDot(ctx, c.x * s, c.y * s, c.q, rad(c.q, w));
          text(ctx, `q${i + 1} = ${c.q > 0 ? '+' : ''}${c.q} μC`, c.x * s, c.y * s + rad(c.q, w) + 12, { size: 11, color: col('--muted') });
        });
        ctx.beginPath(); ctx.arc(tx, ty, 12, 0, Math.PI * 2); ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2; ctx.stroke();
        chargeDot(ctx, tx, ty, 1, 8);
        const ang = (Math.atan2(-ny, nx) * 180) / Math.PI;
        ro.innerHTML = forces.map((f, i) => `<span>|F${i + 1}| = <b>${sci(f.mag, 2)} N</b></span>`).join('') +
          `<span>F<sub>net,x</sub> = <b>${sci(nx, 2)}</b>, F<sub>net,y</sub> = <b>${sci(-ny, 2)}</b> N</span><span>|F<sub>net</sub>| = <b>${sci(nm, 3)} N</b> at <b>${Math.round(ang)}°</b></span>`;
      }
      const st = stage(cv, H, draw);
      st.draw();
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      ['q1', 'q2', 'q3'].forEach((k, i) => (q(k).oninput = () => { src[i].q = Number(q(k).value); st.request(); }));
      q('tip').onchange = () => { opt.tip = q('tip').checked; st.request(); };
      q('comp').onchange = () => { opt.comp = q('comp').checked; st.request(); };
      drag(cv, (x, y) => {
        const s = st.w;
        if (Math.hypot(tgt.x * s - x, tgt.y * s - y) < 18) return tgt;
        for (const c of src) if (Math.hypot(c.x * s - x, c.y * s - y) < rad(c.q, st.w) + 8) return c;
        return null;
      }, (c, x, y) => { c.x = clamp(x / st.w, 0.03, 0.97); c.y = clamp(y / st.w, 0.03, H - 0.03); st.request(); });
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 6. The electric field idea
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 6, id: 'u1-field', title: 'The electric field: a map of pushes',
    render(el) {
      const H = 0.6;
      el.innerHTML = `
<p class="lead">So far, to find a force we needed both charges. But a charge affects the space around it even when nothing is there to feel it. The <b>electric field</b> is a map of that effect: at every point, it tells you what force a charge <i>would</i> feel if you put one there.</p>

<h2>You already know a field: gravity</h2>
<p>In Physics 1 you wrote \\(F_g = mg\\). The number \\(g = 9.8\\) N/kg is the gravitational field near Earth: <i>force per kilogram</i>. Put 1 kg there, it feels 9.8 N; put 2 kg, it feels 19.6 N. The field is a property of the <b>place</b> (near Earth), not of the object you put there.</p>
<p>The electric field works the same way, but per <b>coulomb</b> instead of per kilogram:</p>
${eq('\\[ \\vec E = \\frac{\\vec F_E}{q_0} \\qquad\\Longleftrightarrow\\qquad \\vec F_E = q_0 \\vec E \\]', 'where \\(\\vec E\\) = electric field at a point (N/C, newtons per coulomb); \\(\\vec F_E\\) = force that a charge placed there feels (N); \\(q_0\\) = the charge placed there (C), called a <b>test charge</b> — imagined small enough not to disturb the charges that make the field.')}

<h2>Explore the map</h2>
<div class="sim" data-sim="field"></div>
<p>Drag the source charges and the ringed test charge. The gray arrows show the direction of E everywhere (darker = stronger). Now switch the test charge to <b>−1 nC</b>: the field arrows don't change at all — the field belongs to the source charges — but the force on the test charge flips to point <b>against</b> E.</p>

<h2>Direction rules</h2>
<ul>
<li>E points in the direction a <b>positive</b> test charge would be pushed.</li>
<li>So E points <b>away from positive</b> source charges and <b>toward negative</b> ones.</li>
<li>A <b>negative</b> charge placed in a field feels a force <b>opposite</b> to E.</li>
</ul>

<h2>Field of a single point charge</h2>
<p>Put a test charge \\(q_0\\) a distance r from a source charge q. Coulomb's law gives \\(F = k|q||q_0|/r^2\\). Divide by \\(|q_0|\\) and the test charge cancels out:</p>
${eq('\\[ E = k\\frac{|q|}{r^2} \\]', 'where \\(E\\) = field strength (N/C) at distance \\(r\\) (m) from a point charge \\(q\\) (C); \\(k = 8.99\\times10^9\\) N·m²/C². Direction: away from q if positive, toward q if negative.')}
<p><b>Example.</b> A +2.0 nC charge. At 0.30 m: \\(E = (8.99\\times10^9)(2.0\\times10^{-9})/(0.30)^2 = 200\\) N/C, pointing away. An electron placed there feels \\(F = eE = (1.6\\times10^{-19})(200) = 3.2\\times10^{-17}\\) N, pointing <i>toward</i> the charge (opposite E, since it's negative).</p>

${call('analogy', 'Analogy: a wind map', 'A weather map shows wind arrows over a whole region, whether or not there\'s a kite there. Put a kite at some point and the arrow tells you which way it gets pushed. The electric field is a "wind map" for charges — except a negative "kite" gets pushed upwind.')}
${call('mistake', 'Common mistake: "E depends on the test charge"', 'Doubling the test charge doubles the force, but E = F/q₀ stays the same. E is set by the <b>source</b> charges and the location. Also, a field exists at a point even if no charge is there.')}
${call('ap', 'On the AP exam', 'Be ready to state E\'s direction and the force direction separately. "The field points right, so the electron accelerates left" is a typical required justification.')}
${check('At point P the field is 500 N/C to the east. A −2 μC charge placed at P feels a force of…', ['1×10⁻³ N east', '1×10⁻³ N west', '250 N west', '2.5×10⁻⁹ N east'], 1, '\\(F = |q|E = (2\\times10^{-6})(500) = 1\\times10^{-3}\\) N. Negative charge → opposite to E → west.')}
${check('The field 0.1 m from a point charge is E. What is it at 0.3 m?', ['E/3', 'E/9', '3E', 'E'], 1, 'E ∝ 1/r². Tripling r divides E by 9.')}
`;
      const off = sandbox(el.querySelector('[data-sim="field"]'), {
        aspect: H,
        presets: {
          'One + charge': [{ x: 0.5, y: H / 2, q: 1 }],
          'One − charge': [{ x: 0.5, y: H / 2, q: -1 }],
          'Plus and minus': [{ x: 0.35, y: H / 2, q: 1 }, { x: 0.65, y: H / 2, q: -1 }],
          'Two plus': [{ x: 0.35, y: H / 2, q: 1 }, { x: 0.65, y: H / 2, q: 1 }],
        },
        show: { vectors: true },
        toggles: ['vectors', 'lines'],
        probe: 'force',
        probeAt: [0.72, 0.18],
        caption: 'World is 1 m wide; each source is ±1 nC (use the buttons to add more). The test charge\'s force arrow is on a compressed scale.',
      });
      return off;
    },
  });

  // =====================================================================
  // 7. Fields of several charges + field lines
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 7, id: 'u1-field-lines', title: 'Field lines and fields of several charges',
    render(el) {
      const H = 0.6;
      el.innerHTML = `
<p class="lead">Arrows everywhere get cluttered. Physicists use a cleaner picture: <b>field lines</b>, continuous curves that follow the field's direction. With a few rules, one glance tells you direction <i>and</i> strength.</p>

<h2>Adding fields</h2>
<p>Fields obey the same superposition rule as forces: the field at a point is the vector sum of the fields each source charge would create alone.</p>
${eq('\\[ \\vec E_{net} = \\vec E_1 + \\vec E_2 + \\cdots, \\qquad E_i = k\\frac{|q_i|}{r_i^2} \\]', 'where \\(r_i\\) is the distance from charge i to the point. Each \\(\\vec E_i\\) points away from \\(q_i\\) if positive, toward it if negative. Add with components, just like forces.')}

<h2>Field-line rules</h2>
<ol>
<li>Lines <b>start on positive</b> charges and <b>end on negative</b> charges (or go off to infinity).</li>
<li>The field at any point is <b>tangent</b> to the line through it, in the direction of the arrows.</li>
<li><b>Density = strength.</b> Where lines crowd together, E is strong; where they spread out, E is weak.</li>
<li>The number of lines leaving or entering a charge is proportional to the size of the charge (+2 gets twice as many lines as −1).</li>
<li>Lines <b>never cross</b> — at a crossing point the field would point two ways at once.</li>
</ol>

<div class="sim" data-sim="lines"></div>
<p>Try each setup. For "+1 and −4," four times as many lines touch the −4 charge, and most of them come in from far away. Hunt for points where the field is zero by dragging the test charge and watching the readout.</p>

<h2>Where is E = 0?</h2>
<p>Same logic as the zero-force point last lesson, because E is just force per unit charge:</p>
<ul>
<li><b>Two like charges:</b> between them, closer to the smaller one. For two equal charges, exactly at the midpoint.</li>
<li><b>Two unlike charges:</b> never between them (both fields point the same way, from + toward −). The zero point is outside, on the side of the <b>smaller</b> charge.</li>
</ul>
<p><b>Example.</b> +Q at x = 0 and −4Q at x = d. To the left of +Q at distance x: \\(kQ/x^2 = k(4Q)/(x+d)^2 \\Rightarrow x + d = 2x \\Rightarrow x = d\\). So E = 0 at x = −d.</p>
<p><b>Midpoint of a dipole.</b> For +q and −q a distance d apart, at the midpoint each field has size \\(kq/(d/2)^2 = 4kq/d^2\\), both pointing toward −q. So \\(E = 8kq/d^2\\) — definitely not zero.</p>

${call('analogy', 'Analogy: water flow', 'Think of + charges as faucets and − charges as drains, with lines showing water flowing from one to the other. Where the flow squeezes through a narrow region it\'s fast (strong field); where it spreads out it\'s slow (weak field).')}
${call('mistake', 'Common mistake: field lines are paths', 'A field line shows the direction of the <b>force</b> at each point — not the path a charge follows. A charge released from rest starts along a line, but once it\'s moving, its momentum carries it off the curved line (just like a ball in projectile motion doesn\'t follow the direction of g).')}
${call('ap', 'On the AP exam', 'You\'ll be asked to sketch field lines for two charges, rank field strength at points by line density, and identify the sign of charges from a field-line picture (lines leaving = positive).')}
${check('A field-line diagram shows 16 lines leaving charge A and 8 lines entering charge B. Which is true?', ['A is negative with twice B\'s magnitude', 'A is positive, B is negative, and |q_A| = 2|q_B|', 'A and B are both positive', 'They have equal magnitude'], 1, 'Lines leave + and enter −. Line count ∝ charge, so A has twice B\'s magnitude.')}
${check('Two equal positive charges are a distance d apart. At the midpoint, the field is…', ['Zero', '\\(2kq/d^2\\) toward one charge', '\\(8kq/d^2\\)', 'Perpendicular to the line joining them'], 0, 'Each field has the same size and they point in opposite directions (away from each charge). They cancel. (For +q and −q they would add to \\(8kq/d^2\\).)')}
`;
      return sandbox(el.querySelector('[data-sim="lines"]'), {
        aspect: H,
        presets: {
          'Plus and minus (dipole)': [{ x: 0.35, y: H / 2, q: 1 }, { x: 0.65, y: H / 2, q: -1 }],
          'Two plus': [{ x: 0.35, y: H / 2, q: 1 }, { x: 0.65, y: H / 2, q: 1 }],
          '+2 and −1': [{ x: 0.38, y: H / 2, q: 2 }, { x: 0.62, y: H / 2, q: -1 }],
          '+1 and −4': [{ x: 0.42, y: H / 2, q: 1 }, { x: 0.6, y: H / 2, q: -4 }],
          'Single +': [{ x: 0.5, y: H / 2, q: 1 }],
          'Single −': [{ x: 0.5, y: H / 2, q: -1 }],
        },
        show: { lines: true },
        toggles: ['lines', 'vectors'],
        probe: 'force',
        probeAt: [0.5, 0.12],
        lpc: 10,
        caption: 'Line count is proportional to each charge. Drag charges to reshape the pattern; drag the ringed test charge to probe E.',
      });
    },
  });

  // =====================================================================
  // 8. Conductors in equilibrium
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 8, id: 'u1-conductors-eq', title: 'Conductors in equilibrium: the field inside is zero',
    render(el) {
      el.innerHTML = `
<p class="lead">Combine two ideas you already have — free electrons move whenever they feel a force, and a field means a force — and you get some surprising, very testable facts about charged metal objects.</p>

<h2>The key argument</h2>
<p>Put extra charge on a conductor. The charges push each other around until they stop moving: <b>electrostatic equilibrium</b>. Now ask: once everything has stopped, could there be a field inside the metal? If there were, the free electrons there would feel a force (\\(F = qE\\)) and move. But nothing is moving. So:</p>
<div class="callout idea"><div class="title">Big idea</div>In electrostatic equilibrium, <b>E = 0 everywhere inside the material of a conductor.</b> Everything else in this lesson follows from that.</div>

<div class="sim" data-sim="cond">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Shape <select data-k="shape"><option value="round">Round rod</option><option value="tip">Rod with a sharp point</option></select></label>
    <button class="btn small primary" data-k="add">Dump 10 charges in the middle</button>
    <button class="btn small" data-k="reset">Reset</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Cross-section of a long metal rod carrying extra positive charge. Watch the charges race to the surface, and watch the field arrows inside shrink to nothing. Drag the ringed probe inside and outside.</div>
</div>

<h2>Consequences</h2>
<ol>
<li><b>Excess charge lives on the outer surface.</b> The charges repel each other and spread as far apart as they can, which means to the surface. (You saw this in the sim.)</li>
<li><b>Just outside, E is perpendicular to the surface.</b> If E had a component along the surface, it would push surface charges sideways — they'd move. So in equilibrium the field leaves the surface at right angles.</li>
<li><b>Charge crowds at sharp points.</b> On a curved surface, charge piles up where the curvature is sharpest, making the field there strongest. That's why lightning rods are pointed, and why sparks jump from sharp edges. Try the pointed shape.</li>
<li><b>A hollow conductor shields its inside.</b> E = 0 in the metal and in an empty cavity inside it, no matter what's outside. This is a <b>Faraday cage</b>: why you're safe in a car during a lightning strike and why a microwave oven's metal mesh keeps the waves in.</li>
</ol>

<h2>Charged conducting sphere</h2>
<p>For a sphere, symmetry spreads the charge Q evenly over the surface. From outside, the field is exactly what it would be if all the charge sat at the center:</p>
${eq('\\[ E = 0 \\;\\;(r < R), \\qquad E = k\\frac{|Q|}{r^2} \\;\\;(r \\ge R) \\]', 'where \\(R\\) = sphere\'s radius (m); \\(r\\) = distance from the center (m); \\(Q\\) = total charge on the sphere (C). The field is strongest right at the surface, \\(kQ/R^2\\), and is zero anywhere inside — even at points off-center. The same holds for a uniformly charged thin hollow shell (conductor or not).')}
<svg class="stage" viewBox="0 0 640 220" style="width:100%;height:auto;background:var(--surface-2);border-radius:12px">
  <line x1="60" y1="180" x2="610" y2="180" class="mutedl" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="60" y2="180" class="mutedl" stroke-width="1.5"/>
  <text x="44" y="30">E</text><text x="596" y="200">r</text>
  <line x1="200" y1="20" x2="200" y2="190" class="mutedl" stroke-dasharray="4 4"/>
  <text x="200" y="205" text-anchor="middle">R</text>
  <line x1="60" y1="179" x2="200" y2="179" class="acc" stroke-width="3"/>
  <path d="M200 40 C 250 105, 300 135, 350 148 S 480 168, 600 172" class="acc" stroke-width="3"/>
  <circle cx="200" cy="40" r="4" class="accf"/>
  <text x="210" y="38">kQ/R² at the surface</text>
  <text x="80" y="168" class="small">inside: E = 0</text>
  <text x="380" y="135" class="small">outside: kQ/r², like a point charge</text>
</svg>

<h2>A charge inside a hollow conductor</h2>
<p>Lower a +q charge (on an insulating thread) into a neutral metal can without touching. Field lines from +q must end somewhere before reaching the metal's interior, where E = 0. So −q gathers on the <b>inner</b> surface. Since the can is neutral overall, +q appears on its <b>outer</b> surface. If the can is grounded, that outer +q drains away, leaving only −q on the inside wall.</p>

${call('analogy', 'Analogy: people in an elevator', 'Strangers who want personal space spread to the walls and corners of an elevator, not the middle. Excess charges on a conductor do the same — and if the elevator has a narrow corner, people get squeezed tightest there (charge crowds at sharp points).')}
${call('mistake', 'Common mistakes', '<ul><li>"E = 0 inside means there\'s no charge on the conductor." No — the charge is on the surface, and it\'s exactly what <i>makes</i> E = 0 inside.</li><li>"Charge on any conductor spreads evenly." Only on a sphere (by symmetry). Other shapes have more charge at sharper curves.</li><li>Mixing up a solid conductor with a uniformly charged <i>insulating</i> solid ball — inside an insulator, charge can sit anywhere and E need not be zero.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect: "Where is the field greatest?" for a charged hollow sphere (just outside the surface, not the center), and "which is true of conductors in electrostatics?" (surface is perpendicular to E; inside E = 0).')}
${check('A hollow metal sphere of radius R has charge +Q. Where is the field strongest: at the center, at R/2, at 3R/2, or at 2R?', ['Center', 'R/2', '3R/2', '2R'], 2, 'Inside (center and R/2) E = 0. Outside, E = kQ/r² gets weaker with distance, so 3R/2 beats 2R.')}
${check('The electric field just outside the surface of a charged conductor in equilibrium is…', ['Parallel to the surface', 'Perpendicular to the surface', 'Zero', 'Infinite'], 1, 'Any component along the surface would push the surface charges sideways, so it can\'t exist in equilibrium.')}
`;
      const host = el.querySelector('[data-sim="cond"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const ASP = 0.6;
      // coordinates in units of canvas height; center at (cx, 0.5)
      const R = 0.27;
      let shape = 'round';
      const rOf = (th) => (shape === 'round' ? R : R * (0.85 + 0.95 * Math.exp(-(th * th) / 0.05)));
      const rng = PR.rng(3);
      let pts = [];
      const probe = { x: 0, y: 0 };
      let cx = 0.8;
      const inside = (x, y) => { const dx = x - cx, dy = y - 0.5; return Math.hypot(dx, dy) < rOf(Math.atan2(dy, dx)); };
      function seed(n) { for (let i = 0; i < n; i++) { const a = rng() * 6.283, r = rng() * 0.05; pts.push({ x: cx + r * Math.cos(a), y: 0.5 + r * Math.sin(a) }); } }
      function reset() { pts = []; seed(30); probe.x = cx - 0.08; probe.y = 0.45; }
      function E2(x, y) {
        let ex = 0, ey = 0;
        for (const p of pts) { const dx = x - p.x, dy = y - p.y; const r2 = dx * dx + dy * dy + 1e-5; ex += dx / r2; ey += dy / r2; }
        return [ex, ey];
      }
      function relax() {
        for (let it = 0; it < 4; it++) {
          for (const p of pts) {
            let fx = 0, fy = 0;
            for (const q of pts) { if (q === p) continue; const dx = p.x - q.x, dy = p.y - q.y; const r2 = dx * dx + dy * dy + 1e-6; fx += dx / r2; fy += dy / r2; }
            const f = Math.hypot(fx, fy) || 1;
            const st = Math.min(0.006, 4e-5 * f);
            p.x += (fx / f) * st; p.y += (fy / f) * st;
            const dx = p.x - cx, dy = p.y - 0.5, th = Math.atan2(dy, dx), d = Math.hypot(dx, dy), rr = rOf(th) * 0.995;
            if (d > rr) { p.x = cx + (dx / d) * rr; p.y = 0.5 + (dy / d) * rr; }
          }
        }
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const S = h;
        cx = (w * 0.45) / h;
        // conductor outline
        ctx.beginPath();
        for (let i = 0; i <= 240; i++) { const th = -Math.PI + (i / 240) * 2 * Math.PI, r = rOf(th); const x = (cx + r * Math.cos(th)) * S, y = (0.5 + r * Math.sin(th)) * S; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath(); ctx.fillStyle = rgba(col('--muted'), 0.16); ctx.fill(); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 2; ctx.stroke();
        const Eref = pts.length / R;
        const g = Math.max(24, w / 26);
        const vc = col('--text');
        for (let y = g / 2; y < h; y += g) for (let x = g / 2; x < w; x += g) {
          const X = x / S, Y = y / S;
          if (pts.some((p) => Math.hypot(p.x - X, p.y - Y) < 0.03)) continue;
          const [ex, ey] = E2(X, Y); const m = Math.hypot(ex, ey);
          if (m < 1e-9) continue;
          const L = g * 0.46 * Math.min(1, Math.sqrt(m / Eref));
          if (L < 1.5) continue;
          ctx.save(); ctx.globalAlpha = inside(X, Y) ? 0.9 : 0.55;
          arrow(ctx, x - (ex / m) * L * 0.5, y - (ey / m) * L * 0.5, x + (ex / m) * L * 0.5, y + (ey / m) * L * 0.5, inside(X, Y) ? col('--accent') : vc, 1.4, 6);
          ctx.restore();
        }
        const cr = Math.max(4, h * 0.016);
        pts.forEach((p) => chargeDot(ctx, p.x * S, p.y * S, 1, cr));
        // probe
        const px = probe.x * S, py = probe.y * S;
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.lineWidth = 2.2; ctx.strokeStyle = col('--accent'); ctx.stroke();
        const [ex, ey] = E2(probe.x, probe.y); const m = Math.hypot(ex, ey);
        const pct = Eref ? (100 * m) / Eref : 0;
        ro.innerHTML = `<span>Probe is <b>${inside(probe.x, probe.y) ? 'inside the metal' : 'outside'}</b></span><span>|E| at probe = <b>${pct < 1 ? pct.toFixed(2) : pct.toFixed(0)}%</b> of the field just outside a round rod with this much charge</span><span>${pts.length} excess charges</span>`;
      }
      const st = stage(cv, ASP, draw);
      cx = (st.w * 0.45) / st.h;
      reset();
      host.querySelector('[data-k="add"]').onclick = () => { if (pts.length < 60) seed(10); };
      host.querySelector('[data-k="reset"]').onclick = reset;
      host.querySelector('[data-k="shape"]').onchange = (e) => { shape = e.target.value; reset(); };
      drag(cv, (x, y) => (Math.hypot(probe.x * st.h - x, probe.y * st.h - y) < 20 ? probe : null), (p, x, y) => { p.x = clamp(x / st.h, 0.02, st.w / st.h - 0.02); p.y = clamp(y / st.h, 0.02, 0.98); });
      const stop = loop(() => { relax(); st.draw(); });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 9. Uniform field + charged-particle motion
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 9, id: 'u1-uniform-field', title: 'Uniform fields and projectile motion for charges',
    render(el) {
      el.innerHTML = `
<p class="lead">Between two large, flat, oppositely charged plates, the field is the same everywhere: same strength, same direction. A charge there feels a constant force — which means you already know how it moves, from projectile motion in Physics 1.</p>

<h2>Why the field between plates is uniform</h2>
<p>Field lines leave the + plate and land on the − plate. With charge spread evenly over large flat plates, the lines run straight across, evenly spaced. Evenly spaced parallel lines mean <b>constant E</b> (field-line density rule). Only near the edges do the lines bulge outward ("fringing"). Outside the plates the fields of the two plates cancel, so E ≈ 0 there.</p>
${eq('\\[ E = \\frac{Q}{\\varepsilon_0 A} \\]', 'where \\(Q\\) = charge on each plate (C, + on one, − on the other); \\(A\\) = area of each plate (m²); \\(\\varepsilon_0 = 8.85\\times10^{-12}\\) C²/(N·m²). Notice: no distance in it! Moving closer to a plate doesn\'t change E. (In a few lessons we\'ll also write E = ΔV/d.)')}

<h2>Constant force → constant acceleration</h2>
${eq('\\[ F = qE, \\qquad a = \\frac{qE}{m} \\]', 'where \\(q\\) = particle\'s charge (C); \\(E\\) = field strength (N/C); \\(m\\) = particle\'s mass (kg); \\(a\\) = acceleration (m/s²), along E for + charges and opposite E for − charges.')}
<p>A particle fired sideways into the plates is exactly a horizontally-launched projectile with \\(g\\) replaced by \\(a = qE/m\\):</p>
${eq('\\[ x = v_0 t, \\qquad y = \\tfrac12 a t^2, \\qquad t_{\\text{plates}} = \\frac{L}{v_0} \\]', 'where \\(v_0\\) = entry speed (m/s, parallel to the plates); \\(L\\) = plate length (m); \\(y\\) = sideways deflection (m). Horizontal velocity never changes because the force is purely perpendicular to the plates. The path is a parabola inside, and a straight line after leaving.')}

<div class="sim" data-sim="plates">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Particle <select data-k="p"><option value="e">Electron</option><option value="p">Proton</option></select></label>
    <label>E <input type="range" data-k="E" min="0" max="20000" step="250" value="5000"> <span data-k="Ev"></span></label>
    <label>Field <select data-k="dir"><option value="1">points down</option><option value="-1">points up</option></select></label>
    <label>Speed <input type="range" data-k="v" min="0" max="1" step="0.005" value="0.5"> <span data-k="vv"></span></label>
    <button class="btn small primary" data-k="fire">Fire ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Plates are 10 cm long and 4 cm apart. The dashed curve previews the path; "Fire" shows it in slow motion. Switch to the proton: the speed slider jumps to a much lower range, because with 1836× the mass it needs far more time in the field to bend as much.</div>
</div>

<h2>Gravity? Ignore it.</h2>
<p>An electron in a 5000 N/C field feels \\(eE = 8\\times10^{-16}\\) N. Its weight is \\(mg = 9\\times10^{-30}\\) N — about \\(10^{14}\\) times smaller. For electrons, protons and ions, gravity is negligible unless a problem says otherwise (an oil drop or a dust speck is a different story).</p>

<h2>Neutral things in a uniform field</h2>
<p>An uncharged conductor (or a dipole: equal + and − charges stuck together) in a uniform field gets equal and opposite forces on its + and − parts. <b>Net force = zero.</b> It may twist to line up with the field, but it doesn't accelerate. (A <i>non-uniform</i> field is different: that's how a charged rod pulls on neutral paper.)</p>

${call('analogy', 'Analogy: a ball rolled off a table', 'Roll a ball off a table: constant horizontal speed, constant downward acceleration g, parabola. A charge entering the plates: constant speed along the plates, constant acceleration qE/m across them. Same math, different force.')}
${call('mistake', 'Common mistakes', '<ul><li>Electrons accelerate <b>opposite</b> to E. Check your sign every time.</li><li>Using \\(a = g\\). Inside plates, the important acceleration is qE/m, which can be \\(10^{14}\\)g for an electron.</li><li>Thinking the particle follows a field line. It curves, but the field lines are straight.</li></ul>')}
${call('ap', 'On the AP exam', 'A free proton and electron between the same plates: same <b>force</b> magnitude (same |q|), opposite directions, and the electron\'s acceleration is ~1836× larger. You may also be asked to sketch the path or compare deflections when E, v or m change.')}
${check('An electron and a proton are released from rest between the same parallel plates. Compared with the proton, the electron has…', ['The same force and the same acceleration', 'The same magnitude of force but a much larger acceleration', 'A larger force and the same acceleration', 'A smaller force and a smaller acceleration'], 1, '|F| = eE for both. a = F/m, and the electron\'s mass is 1/1836 of the proton\'s.')}
${check('A beam of electrons is deflected 2 mm passing through the plates. If the field is doubled, the deflection becomes…', ['1 mm', '2 mm', '4 mm', '8 mm'], 2, 'Time inside is unchanged (same v₀ and L). y = ½at², and a ∝ E, so y doubles: 4 mm.')}
`;
      const host = el.querySelector('[data-sim="plates"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const L = 0.1, D = 0.04;
      const s0 = { p: 'e', E: 5000, dir: 1, v: 3e7 };
      let anim = -1;
      const vRange = { e: [3e6, 8e7], p: [3e4, 2e6] };
      const vFromSlider = () => { const [a, b] = vRange[s0.p]; return a * Math.pow(b / a, Number(q('v').value)); };
      function path() {
        const qq = s0.p === 'e' ? -QE : QE, m = s0.p === 'e' ? ME : MP;
        const a = (qq * s0.E * s0.dir) / m; // + = downward on screen
        const v = s0.v;
        const tL = L / v;
        let yL = 0.5 * a * tL * tL;
        let hit = null;
        if (Math.abs(yL) > D / 2) {
          const th = Math.sqrt(D / Math.abs(a));
          hit = { x: v * th, y: Math.sign(a) * (D / 2) };
        }
        return { a, v, tL, yL, hit, m, F: Math.abs(qq) * s0.E };
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const sc = (0.6 * w) / L;
        const x0 = 0.12 * w, yc = h / 2;
        const top = yc - (D / 2) * sc, bot = yc + (D / 2) * sc;
        const n = Math.round(3 + (12 * s0.E) / 20000);
        if (s0.E > 0) {
          for (let i = 0; i < n; i++) {
            const x = x0 + ((i + 0.5) / n) * L * sc;
            const a1 = s0.dir > 0 ? top + 6 : bot - 6, a2 = s0.dir > 0 ? bot - 6 : top + 6;
            arrow(ctx, x, a1, x, a2, rgba(col('--muted'), 0.6), 1.2, 7);
          }
        }
        const pc = s0.dir > 0 ? '--pos' : '--neg', nc = s0.dir > 0 ? '--neg' : '--pos';
        ctx.fillStyle = col(pc); ctx.fillRect(x0, top - 8, L * sc, 6);
        ctx.fillStyle = col(nc); ctx.fillRect(x0, bot + 2, L * sc, 6);
        text(ctx, s0.dir > 0 ? '+ + + + +' : '− − − − −', x0 + (L * sc) / 2, top - 18, { color: col(pc), weight: 700 });
        text(ctx, s0.dir > 0 ? '− − − − −' : '+ + + + +', x0 + (L * sc) / 2, bot + 20, { color: col(nc), weight: 700 });
        text(ctx, 'E', x0 + L * sc + 14, yc, { color: col('--muted'), weight: 700 });
        // screen
        const xs = 0.95 * w;
        ctx.fillStyle = col('--border'); ctx.fillRect(xs, 6, 5, h - 12);
        const P = path();
        // build trajectory points (px)
        const pts = [];
        const xEnd = P.hit ? P.hit.x : L;
        for (let i = 0; i <= 60; i++) { const x = (xEnd * i) / 60, t = x / P.v; pts.push([x0 + x * sc, yc + 0.5 * P.a * t * t * sc]); }
        if (!P.hit) {
          const vy = P.a * P.tL;
          const dxpx = xs - (x0 + L * sc);
          const t2 = dxpx / sc / P.v;
          pts.push([xs, yc + (P.yL + vy * t2) * sc]);
        }
        ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = col('--accent'); ctx.lineWidth = 1.6;
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], clamp(p[1], -10, h + 10)) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
        // gun
        ctx.fillStyle = col('--muted'); ctx.fillRect(x0 - 0.08 * w, yc - 5, 0.06 * w, 10);
        // animated particle
        if (anim >= 0) {
          const k = Math.min(pts.length - 1, Math.floor(anim * (pts.length - 1)));
          const fr = anim * (pts.length - 1) - k;
          const pA = pts[k], pB = pts[Math.min(k + 1, pts.length - 1)];
          const px = lerp(pA[0], pB[0], fr), py = lerp(pA[1], pB[1], fr);
          chargeDot(ctx, px, clamp(py, 4, h - 4), s0.p === 'e' ? -1 : 1, 7);
        } else chargeDot(ctx, x0, yc, s0.p === 'e' ? -1 : 1, 7);
        const name = s0.p === 'e' ? 'electron' : 'proton';
        ro.innerHTML = `<span>F = qE = <b>${sci(P.F)} N</b></span><span>a = <b>${sci(Math.abs(P.a))} m/s²</b> ${P.a === 0 ? '' : P.a > 0 ? '(down)' : '(up)'}</span>` +
          (P.hit ? `<span>${name} <b>hits the ${P.a > 0 ? 'bottom' : 'top'} plate</b> at x = <b>${(P.hit.x * 100).toFixed(1)} cm</b></span>` :
            `<span>time between plates <b>${sci(P.tL)} s</b></span><span>deflection at exit <b>${(Math.abs(P.yL) * 1000).toFixed(2)} mm</b></span>`) +
          `<span class="muted">weight/electric force ≈ ${sci((P.m * 9.8) / (P.F || 1), 1)}</span>`;
      }
      const st = stage(cv, 0.5, draw);
      const upd = () => {
        s0.p = q('p').value; s0.E = Number(q('E').value); s0.dir = Number(q('dir').value); s0.v = vFromSlider();
        q('Ev').textContent = `${s0.E} N/C`;
        q('vv').innerHTML = `${sci(s0.v, 2)} m/s`;
        anim = -1; st.request();
      };
      ['E', 'dir', 'v'].forEach((k) => (q(k).oninput = q(k).onchange = upd));
      q('p').onchange = () => { q('v').value = 0.5; upd(); };
      upd();
      q('fire').onclick = () => { anim = 0; };
      const stop = loop((dt) => { if (anim >= 0 && anim < 1) { anim = Math.min(1, anim + dt / 1.6); st.draw(); } });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 10. Electric potential energy
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 10, id: 'u1-potential-energy', title: 'Electric potential energy: stored push',
    render(el) {
      el.innerHTML = `
<p class="lead">In Physics 1, lifting a book stores energy in the book–Earth system: gravitational potential energy. Pushing two like charges together stores energy the same way. Let them go and that energy turns into motion.</p>

<h2>Recap from Physics 1</h2>
<p>For a conservative force (like gravity), the work the force does as an object moves equals minus the change in potential energy: \\(W_{\\text{force}} = -\\Delta U\\). Lift a ball: gravity does negative work, U goes up. Drop it: gravity does positive work, U goes down, K goes up. The electric force is conservative too, so the same bookkeeping works.</p>

<h2>In a uniform field: just like mgh</h2>
<p>Near Earth, raising a mass m a height h against gravity increases its energy by \\(mgh\\). Between parallel plates, moving a positive charge q a distance d <b>against</b> the field E increases its energy by:</p>
${eq('\\[ \\Delta U_E = qEd \\quad\\text{(moving a + charge a distance } d \\text{ against } \\vec E) \\]', 'where \\(q\\) = charge (C); \\(E\\) = uniform field (N/C); \\(d\\) = distance moved opposite to the field (m). Moving <i>with</i> the field: U decreases by \\(qEd\\). For a negative charge everything flips: moving with the field <i>raises</i> U. Compare: \\(mg\\) ↔ \\(qE\\), \\(h\\) ↔ \\(d\\).')}

<h2>Two point charges</h2>
${eq('\\[ U_E = k\\frac{q_1 q_2}{r} \\]', 'where \\(U_E\\) = electric potential energy of the pair (J); \\(q_1, q_2\\) = charges <b>with their signs</b> (C); \\(r\\) = separation (m). Zero is chosen at \\(r = \\infty\\) (charges infinitely far apart). Note: \\(1/r\\), not \\(1/r^2\\) — energy falls off more slowly than force.')}
<p>The sign tells a story:</p>
<ul>
<li><b>Like charges: U &gt; 0.</b> You had to push them together to get them there. U gets bigger as they get closer. Released, they fly apart and U turns into K.</li>
<li><b>Unlike charges: U &lt; 0.</b> They're "in a well." Left alone they fall together. To pull them apart to infinity (U = 0) you must <b>add</b> energy.</li>
</ul>

<div class="sim" data-sim="pe">
  <canvas></canvas>
  <canvas data-k="graph" style="border-top:1px solid var(--border)"></canvas>
  <div class="sim-controls">
    <label>Q (fixed) <input type="range" data-k="Q" min="-4" max="4" step="1" value="3"> <span data-k="Qv"></span></label>
    <label>q (movable) <input type="range" data-k="q" min="-4" max="4" step="1" value="2"> <span data-k="qv"></span></label>
    <button class="btn small primary" data-k="go">Release from rest</button>
    <button class="btn small" data-k="stop">Stop</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the movable charge left and right, then release it (mass 0.2 kg, slowed down 3×). The bars show how U turns into K while the total stays fixed. The graph is U versus r; the dot rolls along it like a ball on a hill.</div>
</div>
<p>Look at the graph with like charges: U is a hill that gets steeper as r shrinks, and the charge "rolls downhill" to larger r. With unlike charges, U is a pit, and the charge rolls in. Hold onto this "rolling downhill" picture — it's the heart of the next lesson.</p>

<h2>Systems of several charges</h2>
<p>Potential energy belongs to <b>pairs</b>. For three charges, add up all three pairs:</p>
${eq('\\[ U_{total} = k\\frac{q_1q_2}{r_{12}} + k\\frac{q_1q_3}{r_{13}} + k\\frac{q_2q_3}{r_{23}} \\]', 'where \\(r_{ij}\\) = distance between charges i and j. This equals the work needed to assemble the charges, one at a time, from infinitely far apart. Four charges have 6 pairs.')}

<h2>Energy conservation</h2>
${eq('\\[ K_i + U_i = K_f + U_f \\]', 'with \\(K = \\tfrac12 mv^2\\) and \\(U = kq_1q_2/r\\). Valid when only electric forces do work.')}
<p><b>Example.</b> Two +2.0 μC charges, each 0.010 kg, are held 0.10 m apart and released. \\(U_i = (8.99\\times10^9)(2\\times10^{-6})^2/0.10 = 0.36\\) J. Far apart, U = 0, so the total K is 0.36 J, shared equally: each gets 0.18 J, so \\(v = \\sqrt{2(0.18)/0.010} = 6.0\\) m/s.</p>

${call('analogy', 'Analogy: a compressed spring vs. a pit', 'Two like charges pushed close are like a compressed spring: positive stored energy, waiting to fling them apart. Two unlike charges are like a ball at the bottom of a pit: negative energy relative to level ground, and you have to do work to get it out.')}
${call('mistake', 'Common mistakes', '<ul><li>Dropping signs. In \\(U = kq_1q_2/r\\) you <b>must</b> keep the signs — that\'s how you know if it\'s a hill or a well. (In Coulomb\'s law we used magnitudes; here we don\'t.)</li><li>Using \\(1/r^2\\). Energy is \\(1/r\\).</li><li>Saying "the charge has potential energy." Strictly, the <i>system</i> of charges has it.</li></ul>')}
${call('ap', 'On the AP exam', 'Questions ask for U of three charges on a line or triangle (sum the pairs), or what happens to U when r is tripled (÷3). Energy-bar charts (K, U, total) before and after are common in free response.')}
${check('A proton and an electron are moved farther apart. The potential energy of the system…', ['Increases (becomes less negative)', 'Decreases', 'Stays the same', 'Becomes positive'], 0, 'U = k(+e)(−e)/r is negative. Larger r makes it closer to zero, i.e., larger. You had to do work to pull them apart, and that work was stored.')}
${check('The potential energy of two charges is U. If their separation is tripled, it becomes…', ['9U', '3U', 'U/3', 'U/9'], 2, 'U ∝ 1/r, so it\'s divided by 3. (The force would be divided by 9.)')}
`;
      const host = el.querySelector('[data-sim="pe"]');
      const cv = host.querySelector('canvas');
      const gcv = host.querySelector('[data-k="graph"]');
      const ro = host.querySelector('.sim-readout');
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const XQ = 0.12, RMIN = 0.06, XMAX = 0.97, M = 0.2, SLOW = 1 / 3;
      const s0 = { Q: 3, q: 2, x: 0.45, v: 0, run: false, Etot: 0, msg: '' };
      const Uof = (r) => (K * s0.Q * s0.q * 1e-12) / r;
      let g = null;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const s = w, ay = h * 0.78;
        ctx.strokeStyle = col('--border'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0.03 * w, ay); ctx.lineTo(0.98 * w, ay); ctx.stroke();
        const r = s0.x - XQ;
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(XQ * s, ay + 22); ctx.lineTo(s0.x * s, ay + 22); ctx.stroke(); ctx.restore();
        text(ctx, `r = ${r.toFixed(2)} m`, ((XQ + s0.x) / 2) * s, ay + 34, { color: col('--muted'), size: 11 });
        const rad = (qq) => (w < 520 ? 0.85 : 1) * (qq === 0 ? 7 : 9 + 3 * Math.sqrt(Math.abs(qq)));
        chargeDot(ctx, XQ * s, ay, s0.Q, rad(s0.Q));
        text(ctx, 'Q (fixed)', XQ * s, ay - rad(s0.Q) - 10, { size: 11, color: col('--muted') });
        chargeDot(ctx, s0.x * s, ay, s0.q, rad(s0.q));
        text(ctx, 'q', s0.x * s, ay - rad(s0.q) - 10, { size: 12, weight: 600 });
        // energy bars
        const U = Uof(r), Kk = 0.5 * M * s0.v * s0.v;
        const Et = U + Kk;
        const ref = Math.max(Math.abs(U), Kk, Math.abs(U + Kk), 1e-6);
        const bx = 0.6 * w, bw = Math.min(46, 0.07 * w), gap = bw * 0.6, base = h * 0.36, hmax = h * 0.26;
        const bars = [['K', Kk, '--good'], ['U', U, U >= 0 ? '--pos' : '--neg'], ['total', Et, '--accent']];
        ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx - 8, base); ctx.lineTo(bx + 3 * (bw + gap), base); ctx.stroke();
        bars.forEach(([lab, val, c], i) => {
          const x = bx + i * (bw + gap), hh = (val / ref) * hmax;
          ctx.fillStyle = col(c); ctx.fillRect(x, base - Math.max(hh, 0), bw, Math.abs(hh));
          text(ctx, lab, x + bw / 2, base + (hh < 0 ? -10 : 12) + (hh < 0 ? 0 : 0), { size: 11, color: col('--muted') });
          text(ctx, `${sci(val, 2).replace(/<\/?sup>/g, '')}`, x + bw / 2, base - hh + (hh >= 0 ? -9 : 9), { size: 10 });
        });
        text(ctx, 'energy (J)', bx - 10, base - hmax - 6, { align: 'left', size: 11, color: col('--muted') });
        ro.innerHTML = `<span>U = kQq/r = <b>${signed(U)} J</b></span><span>K = <b>${sci(Kk)} J</b></span><span>${s0.Q * s0.q > 0 ? 'like charges: U > 0, they repel' : s0.Q * s0.q < 0 ? 'unlike charges: U < 0, they attract' : 'one charge is zero: no interaction'}</span>${s0.msg ? `<span><b>${s0.msg}</b></span>` : ''}`;
        drawGraph(r, U);
      }
      function drawGraph(r, U) {
        if (!g) return;
        const ctx = g.ctx, w = g.w, h = g.h;
        ctx.clearRect(0, 0, w, h);
        const x0 = 40, x1 = w - 10, y0 = h / 2;
        const rmin = 0.04, rmax = XMAX - XQ;
        const Um = Math.abs(Uof(0.1)) || 1;
        const X = (rr) => x0 + ((rr - rmin) / (rmax - rmin)) * (x1 - x0);
        const Y = (u) => y0 - clamp(u / Um, -1.1, 1.1) * (h * 0.4);
        ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, 8); ctx.lineTo(x0, h - 8); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
        text(ctx, 'U', x0 - 14, 14, { color: col('--muted') });
        text(ctx, '0', x0 - 10, y0, { color: col('--muted'), size: 10 });
        text(ctx, 'r', x1 - 6, y0 + 12, { color: col('--muted') });
        if (s0.Q * s0.q === 0) return;
        ctx.save(); ctx.beginPath(); ctx.rect(x0, 4, x1 - x0, h - 8); ctx.clip();
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2; ctx.beginPath();
        for (let rr = rmin; rr <= rmax; rr += 0.004) { const y = Y(Uof(rr)); if (rr === rmin) ctx.moveTo(X(rr), y); else ctx.lineTo(X(rr), y); }
        ctx.stroke(); ctx.restore();
        chargeDot(ctx, X(r), Y(U), s0.q, 6);
      }
      function sync() {
        s0.Q = Number(q('Q').value); s0.q = Number(q('q').value);
        q('Qv').textContent = `${s0.Q > 0 ? '+' : ''}${s0.Q} μC`; q('qv').textContent = `${s0.q > 0 ? '+' : ''}${s0.q} μC`;
        s0.run = false; s0.v = 0; s0.msg = ''; st.request();
      }
      const st = stage(cv, 0.42, draw);
      g = stage(gcv, 0.24, () => st.draw());
      q('Q').oninput = q('q').oninput = sync;
      sync(); st.draw();
      q('go').onclick = () => { s0.v = 0; s0.run = true; s0.msg = ''; s0.Etot = Uof(s0.x - XQ); };
      q('stop').onclick = () => { s0.run = false; s0.v = 0; st.request(); };
      drag(cv, (x, y) => (Math.abs(x - s0.x * st.w) < 22 && Math.abs(y - st.h * 0.78) < 26 ? s0 : null), (o, x) => {
        s0.run = false; s0.v = 0; s0.msg = '';
        s0.x = clamp(x / st.w, XQ + RMIN, XMAX); st.request();
      });
      const stop = loop((dt) => {
        if (!s0.run) return;
        const sub = 40, h = (dt * SLOW) / sub;
        for (let i = 0; i < sub; i++) {
          const r = s0.x - XQ;
          const a = (K * s0.Q * s0.q * 1e-12) / (r * r) / M;
          s0.v += a * h; s0.x += s0.v * h;
          if (s0.x - XQ <= RMIN) { s0.x = XQ + RMIN; s0.run = false; s0.msg = 'the charges collide'; s0.v = 0; break; }
          if (s0.x >= XMAX) { s0.x = XMAX; s0.run = false; s0.msg = 'off the screen — still speeding up, slower and slower, as U → 0'; break; }
        }
        st.draw();
      });
      return () => { stop(); st.destroy(); g.destroy(); };
    },
  });

  // =====================================================================
  // 11. Electric potential: height on a roller coaster
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 11, id: 'u1-potential', title: 'Electric potential: the height of the roller coaster',
    render(el) {
      el.innerHTML = `
<p class="lead">On a roller coaster, the height of the track at each point tells you how much energy a car would have there — and the car always tends to roll toward lower ground. <b>Electric potential</b> is exactly that: a "height" assigned to every point in space, and positive charges tend to roll downhill.</p>

<h2>From potential energy to potential</h2>
<p>Gravitational PE is \\(U = mgh\\). It depends on the object (m) and on the place (gh). If you divide out the mass, you get \\(U/m = gh\\): a number that depends only on <b>where</b> you are. A heavier car has more energy at the top, but the <i>track height</i> is the same for every car.</p>
<p>Do the same with electric PE: divide by the charge.</p>
${eq('\\[ V = \\frac{U_E}{q} \\qquad\\Longleftrightarrow\\qquad U_E = qV \\]', 'where \\(V\\) = electric potential at a point (volts, V; 1 V = 1 J/C); \\(U_E\\) = potential energy a charge q would have there (J); \\(q\\) = the charge placed there, with sign (C). V is "energy per coulomb" — the height of the track.')}
<svg class="stage" viewBox="0 0 640 210" style="width:100%;height:auto;background:var(--surface-2);border-radius:12px;margin:12px 0">
  <path d="M20 170 C 90 170, 110 40, 180 40 S 260 140, 320 140 S 420 80, 470 80 S 560 175, 620 175" class="ink" stroke-width="3"/>
  <circle cx="180" cy="31" r="9" class="posf"/><text x="180" y="18" text-anchor="middle">A: 120 V</text>
  <circle cx="320" cy="131" r="9" class="posf"/><text x="320" y="165" text-anchor="middle">B: 20 V</text>
  <circle cx="470" cy="71" r="9" class="posf"/><text x="470" y="58" text-anchor="middle">C: 70 V</text>
  <text x="20" y="200" class="small">Height of the track = potential V. A + charge at A has the most energy per coulomb, and released, "rolls" toward lower V.</text>
</svg>

<h2>Potential of a point charge</h2>
<p>Take \\(U = kqq_0/r\\) from last lesson and divide by the test charge \\(q_0\\):</p>
${eq('\\[ V = k\\frac{q}{r} \\]', 'where \\(V\\) = potential (V) at distance \\(r\\) (m) from a point charge \\(q\\) (C, <b>keep the sign</b>). V is zero infinitely far away. Near a + charge V is a tall peak; near a − charge it\'s a deep pit. It falls off as \\(1/r\\).')}

<h2>See the landscape</h2>
<div class="sim" data-sim="land">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Charges <select data-k="preset"></select></label>
    <label>Rotate <input type="range" data-k="rot" min="-1.6" max="1.6" step="0.02" value="0.45"></label>
    <label>Ball <select data-k="sg"><option value="1">+ charge</option><option value="-1">− charge</option></select></label>
    <button class="btn small" data-k="clr">Clear ball</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption"><b>Tap or click anywhere on the surface to release a ball there from rest.</b> Height = V (red peaks: + charges, blue pits: − charges). A + charge rolls downhill. A − charge does the opposite — the view flips upside down to show its energy landscape, U = qV.</div>
</div>
<p>Notice how the + ball rolls off the red peak, away from the + charge (repulsion!), and falls into the blue pit around a − charge (attraction!). The landscape picture contains everything Coulomb's law told us — but with simple numbers instead of vectors.</p>

<h2>Many charges: just add numbers</h2>
<p>Potential is a <b>scalar</b>: no direction. The potential from several charges is simply the sum, with signs:</p>
${eq('\\[ V_{total} = k\\frac{q_1}{r_1} + k\\frac{q_2}{r_2} + k\\frac{q_3}{r_3} + \\cdots \\]', 'where \\(r_i\\) = distance from charge \\(q_i\\) to the point. No components, no angles — a huge relief compared with adding fields.')}
<p><b>Example.</b> +2.0 nC and −2.0 nC are 0.20 m apart. At the midpoint: \\(V = k(2\\text{ nC})/0.10 + k(-2\\text{ nC})/0.10 = 180 - 180 = 0\\) V. But E there is <b>not</b> zero: both fields point toward the − charge, adding to 3600 N/C.</p>
<p><b>Another.</b> Two +2.0 nC charges, 0.20 m apart. At the midpoint, E = 0 (the fields cancel), but \\(V = 180 + 180 = 360\\) V.</p>

<h2>Potential vs. potential energy</h2>
<ul>
<li><b>V</b> belongs to a <b>place</b> (created by source charges). Units: volts.</li>
<li><b>U = qV</b> belongs to a <b>charge at that place</b>. Units: joules. A −2 μC charge at a 100 V spot has \\(U = (-2\\times10^{-6})(100) = -2\\times10^{-4}\\) J.</li>
</ul>
<p>Same as gravity: the hill's height doesn't care who's standing on it, but the energy does.</p>

${call('analogy', 'Analogy: the roller coaster', 'Height of the track ↔ potential V. Mass of the car ↔ charge q. Energy of the car (mgh) ↔ U = qV. Cars roll toward lower height; positive charges move toward lower V. A negative charge is a weird car that rolls <i>uphill</i>, because for it, U = qV is upside down.')}
${call('mistake', 'Common mistakes', '<ul><li>"V = 0 means E = 0" (or the reverse). They\'re different: V is the height; E is the steepness. A flat hilltop has height but no slope; a slope can pass through sea level.</li><li>Adding potentials as vectors, or dropping the sign of a negative charge.</li><li>Confusing V (volts, place) with U (joules, charge-at-place).</li></ul>')}
${call('ap', 'On the AP exam', 'Classic: four equal charges at the corners of a square. At the center, E = 0 by symmetry, but V = 4kq/r (four positive numbers). Also: "where on the x-axis is V = 0?" — set the sum of kq/r terms to zero.')}
${check('Four equal +q charges sit at the corners of a square. One charge alone makes potential V₀ and field E₀ at the center. With all four:', ['V = 0, E = 0', 'V = 4V₀, E = 0', 'V = 0, E = 4E₀', 'V = 4V₀, E = 4E₀'], 1, 'Potentials are scalars and just add: 4V₀. The fields point in four symmetric directions and cancel: 0.')}
${check('A point charge creates V = 300 V at 0.2 m. What is V at 0.6 m?', ['100 V', '33 V', '900 V', '300 V'], 0, 'V ∝ 1/r, so tripling r divides V by 3: 100 V. (E would be divided by 9.)')}
`;
      const host = el.querySelector('[data-sim="land"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const W = 1, H = 0.6, VC = 220;
      const PRE = {
        'One + charge': [{ x: 0.5, y: 0.3, q: 1 }],
        'One − charge': [{ x: 0.5, y: 0.3, q: -1 }],
        'Plus and minus': [{ x: 0.32, y: 0.3, q: 1 }, { x: 0.68, y: 0.3, q: -1 }],
        'Two plus': [{ x: 0.32, y: 0.3, q: 1 }, { x: 0.68, y: 0.3, q: 1 }],
      };
      q('preset').innerHTML = Object.keys(PRE).map((n) => `<option>${n}</option>`).join('');
      let ch = PRE['Plus and minus'];
      q('preset').value = 'Plus and minus';
      let rot = 0.45, sg = 1;
      const NX = 50, NY = 30;
      let grid = null;
      const hgt = (v) => VC * Math.tanh(v / VC);
      function buildGrid() {
        grid = new Float32Array((NX + 1) * (NY + 1));
        for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) grid[j * (NX + 1) + i] = potAt(ch, (i / NX) * W, (j / NY) * H);
      }
      buildGrid();
      const ball = { on: false, x: 0, y: 0, vx: 0, vy: 0, trail: [], msg: '' };
      const MASS = 5e-7, QB = 1e-9;
      const PHI = 0.55;
      function proj(x, y, v, w, h) {
        const X = x - 0.5, Y = y - H / 2;
        const c = Math.cos(rot), s = Math.sin(rot);
        const xr = X * c - Y * s, yr = X * s + Y * c;
        const S = w * 0.72;
        const z = (sg * hgt(v) / VC) * 0.2;
        return [w / 2 + xr * S, h * 0.54 + yr * S * Math.sin(PHI) - z * S * Math.cos(PHI), yr];
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const P = new Array((NX + 1) * (NY + 1));
        for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { const k = j * (NX + 1) + i; P[k] = proj((i / NX) * W, (j / NY) * H, grid[k], w, h); }
        const quads = [];
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 2, d = a + NX + 1;
          quads.push([a, b, c, d, (P[a][2] + P[c][2]) / 2]);
        }
        quads.sort((A, B) => A[4] - B[4]);
        const bg = rgbOf(col('--surface')), pc = rgbOf(col('--pos')), nc = rgbOf(col('--neg'));
        ctx.lineWidth = 0.6; ctx.strokeStyle = rgba(col('--text'), 0.16);
        for (const qd of quads) {
          const v = (grid[qd[0]] + grid[qd[2]]) / 2;
          const al = 0.85 * Math.tanh(Math.abs(v) / 120);
          const cc = v >= 0 ? pc : nc;
          ctx.fillStyle = `rgb(${bg[0] * (1 - al) + cc[0] * al | 0},${bg[1] * (1 - al) + cc[1] * al | 0},${bg[2] * (1 - al) + cc[2] * al | 0})`;
          ctx.beginPath();
          ctx.moveTo(P[qd[0]][0], P[qd[0]][1]); ctx.lineTo(P[qd[1]][0], P[qd[1]][1]); ctx.lineTo(P[qd[2]][0], P[qd[2]][1]); ctx.lineTo(P[qd[3]][0], P[qd[3]][1]);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        text(ctx, sg > 0 ? 'Height = V  (the landscape a + charge feels)' : 'Height = −V  (flipped: the landscape a − charge feels)', 10, 16, { align: 'left', weight: 600, size: 12 });
        if (ball.trail.length > 1) {
          ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2; ctx.beginPath();
          ball.trail.forEach((p, i) => { const pp = proj(p[0], p[1], potAt(ch, p[0], p[1]), w, h); if (i) ctx.lineTo(pp[0], pp[1]); else ctx.moveTo(pp[0], pp[1]); });
          ctx.stroke();
        }
        if (ball.on || ball.trail.length) {
          const v = potAt(ch, ball.x, ball.y);
          const bp = proj(ball.x, ball.y, v, w, h);
          ctx.beginPath(); ctx.arc(bp[0], bp[1] - 7, 8, 0, Math.PI * 2); ctx.fillStyle = col('--surface'); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = col('--accent'); ctx.stroke();
          chargeDot(ctx, bp[0], bp[1] - 7, sg, 5);
          const Kk = 0.5 * MASS * (ball.vx * ball.vx + ball.vy * ball.vy), U = sg * QB * v;
          ro.innerHTML = `<span>V at ball = <b>${signed(v, 3)} V</b></span><span>U = qV = <b>${signed(U, 3)} J</b></span><span>K = <b>${sci(Kk, 3)} J</b></span><span>K + U = <b>${signed(Kk + U, 3)} J</b></span>${ball.msg ? `<span><b>${ball.msg}</b></span>` : ''}`;
        } else ro.innerHTML = '<span>Tap the surface to drop a ball (a ±1 nC dust grain, 0.5 mg).</span>';
      }
      const st = stage(cv, 0.6, draw);
      st.draw();
      function release(px, py) {
        const w = st.w, h = st.h;
        let best = null, bd = 1e9;
        for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
          const x = (i / NX) * W, y = (j / NY) * H;
          const p = proj(x, y, grid[j * (NX + 1) + i], w, h);
          const d = (p[0] - px) ** 2 + (p[1] - py) ** 2;
          if (d < bd) { bd = d; best = [x, y]; }
        }
        if (!best || bd > 40 * 40) return;
        Object.assign(ball, { on: true, x: best[0], y: best[1], vx: 0, vy: 0, trail: [best.slice()], msg: '' });
      }
      cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(); release(e.clientX - r.left, e.clientY - r.top); st.request(); });
      q('preset').onchange = () => { ch = PRE[q('preset').value]; buildGrid(); ball.on = false; ball.trail = []; st.request(); };
      q('rot').oninput = () => { rot = Number(q('rot').value); st.request(); };
      q('sg').onchange = () => { sg = Number(q('sg').value); ball.on = false; ball.trail = []; st.request(); };
      q('clr').onclick = () => { ball.on = false; ball.trail = []; st.request(); };
      const stop = loop((dt) => {
        if (!ball.on) return;
        const sub = 30, hh = dt / sub;
        for (let i = 0; i < sub; i++) {
          const e = fieldAt(ch, ball.x, ball.y);
          ball.vx += (sg * QB * e[0] / MASS) * hh; ball.vy += (sg * QB * e[1] / MASS) * hh;
          ball.x += ball.vx * hh; ball.y += ball.vy * hh;
          if (ch.some((c) => c.q * sg < 0 && Math.hypot(c.x - ball.x, c.y - ball.y) < 0.025)) { ball.on = false; ball.msg = 'fell into the pit (reached the opposite charge)'; break; }
          if (ball.x < 0 || ball.x > W || ball.y < 0 || ball.y > H) { ball.on = false; ball.x = clamp(ball.x, 0, W); ball.y = clamp(ball.y, 0, H); ball.msg = 'rolled off the edge of the map'; break; }
        }
        ball.trail.push([ball.x, ball.y]);
        if (ball.trail.length > 400) ball.trail.shift();
        st.draw();
      });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 12. Potential difference, work, and energy
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 12, id: 'u1-potential-difference', title: 'Potential difference (voltage), work, and speed',
    render(el) {
      el.innerHTML = `
<p class="lead">On a roller coaster, what matters for speed isn't the absolute height of a point — it's how far the car <i>drops</i>. Same with charges: what matters is the <b>potential difference</b> ΔV between two points, better known as <b>voltage</b>.</p>

<h2>Potential difference</h2>
${eq('\\[ \\Delta V = V_B - V_A \\]', 'where \\(V_A\\) = potential at the starting point A, \\(V_B\\) = potential at the ending point B (both in volts). Where you put "zero" doesn\'t matter — only differences do, like measuring heights from the floor or from sea level.')}
<p>A "9-volt battery" means its terminals differ by 9 V: every coulomb that goes through it gains 9 J of energy.</p>

<h2>Work and energy</h2>
${eq('\\[ \\Delta U_E = q\\,\\Delta V, \\qquad W_{\\text{field}} = -q\\,\\Delta V, \\qquad \\Delta K = -q\\,\\Delta V \\]', 'where \\(q\\) = charge moved, <b>with sign</b> (C); \\(\\Delta V\\) = \\(V_B - V_A\\) (V); \\(W_{\\text{field}}\\) = work done by the electric field (J). The last one holds when the electric force is the only force doing work. If you push the charge slowly (no change in K), <i>you</i> do work \\(W_{\\text{you}} = q\\Delta V\\).')}
<div class="callout idea"><div class="title">Downhill rule</div>Left alone, <b>positive charges move toward lower potential</b> (roll downhill) and speed up. <b>Negative charges move toward higher potential</b> and speed up. Either way, U decreases and K increases.</div>

<div class="sim" data-sim="dv">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Left plate <input type="range" data-k="V" min="0" max="100" step="5" value="100"> <span data-k="Vv"></span></label>
    <label>Charge <select data-k="q"><option value="p">proton (+e)</option><option value="e">electron (−e)</option><option value="u">+1 μC</option><option value="n">−1 μC</option></select></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag points A and B. Right plate is 0 V; plates are 10 cm apart. Dashed vertical lines are points of equal V. Bottom: V along the gap is a straight ramp — the "track" for this region. The work is the same along the straight path and the dog-leg path: only the start and end heights matter.</div>
</div>

<h2>The electron-volt</h2>
<p>For single particles, joules are awkward. One <b>electron-volt (eV)</b> is the energy an electron or proton gains crossing 1 V:</p>
${eq('\\[ 1\\text{ eV} = (1.6\\times10^{-19}\\text{ C})(1\\text{ V}) = 1.6\\times10^{-19}\\text{ J} \\]', 'A particle with charge e crossing ΔV volts gains ΔV electron-volts. A particle with charge 2e (like a helium nucleus) gains 2ΔV eV.')}

<h2>Accelerating a particle from rest</h2>
<p>Start at rest, cross a potential difference of magnitude ΔV (in the direction that speeds it up): \\(\\tfrac12 mv^2 = |q|\\Delta V\\), so</p>
${eq('\\[ v = \\sqrt{\\frac{2|q|\\Delta V}{m}} \\]', 'where \\(v\\) = final speed (m/s); \\(m\\) = mass (kg).')}
<p><b>Example.</b> An electron accelerated from rest through 100 V gains 100 eV = \\(1.6\\times10^{-17}\\) J. \\(v = \\sqrt{2(1.6\\times10^{-17})/(9.11\\times10^{-31})} = 5.9\\times10^6\\) m/s. A proton through the same 100 V gains the same 100 eV but, being 1836× heavier, moves \\(\\sqrt{1836} \\approx 43\\) times slower.</p>
<p>Notice: <b>K depends only on q and ΔV, not on mass.</b> Mass only affects how that energy translates into speed.</p>

${call('analogy', 'Analogy: drop height on a roller coaster', 'A coaster car that drops 30 m gains the same kinetic energy per kg whether the track is a straight plunge or a twisty slide (no friction). Charges are the same: the energy gained depends on ΔV, not the path.')}
${call('mistake', 'Common mistake: sign soup', 'Use one recipe: compute \\(\\Delta V = V_{end} - V_{start}\\), multiply by q <b>with its sign</b> to get ΔU. Then \\(\\Delta K = -\\Delta U\\). Example: an electron from 0 V to +50 V: \\(\\Delta U = (-e)(+50) = -50\\) eV, so it gains 50 eV of K.')}
${call('ap', 'On the AP exam', 'Proportional reasoning is common: "particle with charge 2Q and mass m/2 accelerated through the same V" → K doubles (K = qΔV; mass doesn\'t matter). Also: "one joule of work moves one coulomb across what potential difference?" → 1 V.')}
${check('A proton moves from a point at 50 V to a point at 20 V, with only the electric force acting. Its kinetic energy…', ['Increases by 30 eV', 'Decreases by 30 eV', 'Increases by 70 eV', 'Doesn\'t change'], 0, 'ΔV = 20 − 50 = −30 V. ΔK = −qΔV = −(+e)(−30 V) = +30 eV. A + charge rolling downhill speeds up.')}
${check('A particle of charge Q and mass m, accelerated from rest through ΔV, gets kinetic energy K. A particle of charge 2Q and mass m/2 through the same ΔV gets…', ['K/2', 'K', '2K', '4K'], 2, 'K = qΔV. Doubling q doubles K; the mass is irrelevant to the energy.')}
`;
      const host = el.querySelector('[data-sim="dv"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const CH = { p: { q: QE, m: MP, name: 'proton' }, e: { q: -QE, m: ME, name: 'electron' }, u: { q: 1e-6, m: null, name: '+1 μC' }, n: { q: -1e-6, m: null, name: '−1 μC' } };
      const A = { x: 0.25, y: 0.3 }, B = { x: 0.7, y: 0.55 };
      let V0 = 100, ck = 'p';
      const XL = 0.12, XR = 0.88, YT = 0.06, YB = 0.62;
      const Vat = (x) => V0 * (1 - (x - XL) / (XR - XL));
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const xl = XL * w, xr = XR * w, yt = YT * h, yb = YB * h;
        // equipotentials
        for (let i = 1; i < 10; i++) {
          const x = xl + ((xr - xl) * i) / 10;
          ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, yt); ctx.lineTo(x, yb); ctx.stroke(); ctx.restore();
          if (i % 2 === 0) text(ctx, `${Math.round(V0 * (1 - i / 10))} V`, x, yb + 10, { size: 10, color: col('--muted') });
        }
        if (V0 > 0) for (let j = 0; j < 4; j++) {
          const y = yt + ((yb - yt) * (j + 0.5)) / 4;
          arrow(ctx, xl + 0.06 * w, y, xr - 0.06 * w, y, rgba(col('--muted'), 0.5), 1.2, 8);
        }
        text(ctx, 'E', xr - 0.04 * w, yt + 10, { color: col('--muted'), weight: 700 });
        ctx.fillStyle = col('--pos'); ctx.fillRect(xl - 8, yt, 8, yb - yt);
        ctx.fillStyle = col('--neg'); ctx.fillRect(xr, yt, 8, yb - yt);
        text(ctx, `${V0} V`, xl - 4, yt - 0 + (yb - yt) / 2, { align: 'right', size: 11, weight: 700, color: col('--pos') });
        text(ctx, '0 V', xr + 12, yt + (yb - yt) / 2, { align: 'left', size: 11, weight: 700, color: col('--neg') });
        // paths
        const ax = A.x * w, ay = A.y * h, bx = B.x * w, by = B.y * h;
        ctx.save(); ctx.setLineDash([2, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, by); ctx.lineTo(bx, by); ctx.stroke(); ctx.restore();
        arrow(ctx, ax, ay, bx, by, col('--accent'), 2.5, 10);
        [[A, 'A'], [B, 'B']].forEach(([P, L]) => {
          ctx.beginPath(); ctx.arc(P.x * w, P.y * h, 10, 0, Math.PI * 2); ctx.fillStyle = col('--surface'); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = col('--accent'); ctx.stroke();
          text(ctx, L, P.x * w, P.y * h, { weight: 700, size: 12, color: col('--accent') });
        });
        // ramp graph
        const gy0 = 0.95 * h, gy1 = 0.72 * h;
        ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xl, gy0); ctx.lineTo(xr, gy0); ctx.stroke();
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(xl, V0 ? gy1 : gy0); ctx.lineTo(xr, gy0); ctx.stroke();
        text(ctx, 'V', xl - 14, gy1, { color: col('--muted'), size: 11 });
        [[A, 'A'], [B, 'B']].forEach(([P, L]) => {
          const v = Vat(clamp(P.x, XL, XR));
          const yy = gy0 - (V0 ? (v / V0) * (gy0 - gy1) : 0);
          chargeDot(ctx, P.x * w, yy - 6, CH[ck].q, 6);
          text(ctx, L, P.x * w, yy - 20, { size: 11, weight: 700, color: col('--accent') });
        });
        const c = CH[ck];
        const va = Vat(A.x), vb = Vat(B.x), dV = vb - va;
        const dU = c.q * dV, Wf = -dU;
        const isE = c.m != null;
        const en = (J) => (isE ? `${signed(J / QE, 3)} eV` : `${signed(J * 1e6, 3)} μJ`);
        let extra = '';
        if (isE) {
          if (Wf > 0) extra = `<span>released from rest at A: speed at B = <b>${sci(Math.sqrt((2 * Wf) / c.m), 3)} m/s</b></span>`;
          else extra = `<span>released at A, a ${c.name} would <b>not</b> go to B on its own (that's uphill for it)</span>`;
        }
        ro.innerHTML = `<span>V<sub>A</sub> = <b>${va.toFixed(1)} V</b>, V<sub>B</sub> = <b>${vb.toFixed(1)} V</b></span><span>ΔV = <b>${signed(dV, 3)} V</b></span><span>ΔU = qΔV = <b>${en(dU)}</b></span><span>W<sub>field</sub> = −qΔV = <b>${en(Wf)}</b></span>${extra}`;
      }
      const st = stage(cv, 0.62, draw);
      st.draw();
      const upd = () => { V0 = Number(q('V').value); ck = q('q').value; q('Vv').textContent = `${V0} V`; st.request(); };
      q('V').oninput = q('q').onchange = upd; upd();
      drag(cv, (x, y) => {
        for (const P of [B, A]) if (Math.hypot(P.x * st.w - x, P.y * st.h - y) < 20) return P;
        return null;
      }, (P, x, y) => { P.x = clamp(x / st.w, XL + 0.01, XR - 0.01); P.y = clamp(y / st.h, YT + 0.03, YB - 0.03); st.request(); });
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 13. Equipotentials and E = ΔV/d
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 13, id: 'u1-equipotentials', title: 'Equipotentials: contour lines, and E = ΔV/d',
    render(el) {
      const H = 0.6;
      el.innerHTML = `
<p class="lead">A hiking map draws contour lines: each line connects points at the same height. Close lines mean steep ground; a dropped ball rolls straight down across them. Electric potential has contour lines too, called <b>equipotentials</b>, and they connect the "height" picture (V) to the "push" picture (E).</p>

<h2>Equipotential lines</h2>
<p>An equipotential is a line (or, in 3D, a surface) where V has the same value everywhere. Three facts follow from what you know:</p>
<ol>
<li><b>No work is done moving a charge along an equipotential.</b> ΔV = 0, so \\(W = -q\\Delta V = 0\\). Like walking along a contour line: no climbing.</li>
<li><b>E is perpendicular to equipotentials.</b> If E had a component along the line, moving along it would involve force × distance — work. But the work is zero. So E crosses every equipotential at a right angle.</li>
<li><b>E points "downhill"</b>, from high V toward low V, along the steepest way down.</li>
</ol>

<div class="sim" data-sim="eqp"></div>
<p>Drag the probe and charges. Equipotential lines are drawn every 15 V (dashed = 0 V). Turn on field lines and check: they always cross the contours at right angles, and they're densest where the contours are most tightly packed. The graph shows V along the dashed line; its slope at the probe is the field (with a minus sign).</p>

<h2>How steep? E = ΔV/d</h2>
<p>The field strength is how fast V changes with distance — the steepness of the hill. In a uniform field (parallel plates) it's simply</p>
${eq('\\[ E = \\frac{\\Delta V}{d} \\]', 'where \\(E\\) = magnitude of the uniform field (V/m, which is the same as N/C); \\(\\Delta V\\) = potential difference between two points (V); \\(d\\) = distance between them measured <b>along</b> the field (m). For non-uniform fields, \\(|\\Delta V/\\Delta x|\\) over a short distance gives E there.')}
<p><b>Example.</b> Plates are 0.04 m apart; the lower is at 2 V, the upper at 10 V. \\(E = (10-2)/0.04 = 200\\) V/m, pointing down (toward lower V). A point 0.01 m above the lower plate is ¼ of the way up, so \\(V = 2 + \\tfrac14(8) = 4\\) V.</p>
<p><b>Reading a V-vs-x graph:</b> E is minus the slope. Where V rises to the right, E points left. Where V is flat, E = 0. Where the graph is steepest, E is strongest.</p>

<h2>Conductors are equipotentials</h2>
<p>Inside a conductor in equilibrium, E = 0 (lesson 8). Zero steepness means V is the same everywhere in and on the conductor — the whole object is one flat plateau. A charged sphere has \\(V = kQ/R\\) on its surface and that same value everywhere inside.</p>
<p><b>Connecting two spheres with a wire</b> makes them one conductor, so charge flows until they're at the same V: \\(kQ_1/R_1 = kQ_2/R_2\\), so \\(Q \\propto R\\) — the bigger sphere holds more charge. But the surface field \\(kQ/R^2 \\propto 1/R\\) is <b>stronger on the smaller sphere</b> — the same reason charge crowds at sharp points.</p>

${call('analogy', 'Analogy: a topographic map', 'Equipotential lines ↔ contour lines. Potential V ↔ elevation. Field E ↔ the direction and steepness of the slope, pointing straight downhill. Densely packed contours ↔ a cliff (strong field).')}
${call('mistake', 'Common mistakes', '<ul><li>Drawing field lines parallel to equipotentials. They\'re always perpendicular.</li><li>Thinking E = 0 wherever V = 0. E depends on how V <i>changes</i>, not on its value.</li><li>Using the straight-line distance between two points in E = ΔV/d when they aren\'t lined up along the field. Use only the separation along E.</li></ul>')}
${call('ap', 'On the AP exam', 'Given a map of equipotential lines, you\'ll rank field strengths (closest spacing = strongest), find E\'s direction (perpendicular, toward lower V), compute E = ΔV/d, and find the work to move a charge between lines (zero along a line!).')}
${check('A charge moves along an equipotential line at constant speed. The work done by the electric field is…', ['Positive', 'Negative', 'Zero', 'Depends on the sign of the charge'], 2, 'W = −qΔV and ΔV = 0 along an equipotential.')}
${check('Two parallel plates are connected to a constant voltage source. If the voltage is doubled and the separation reduced to 1/5, the field between them is multiplied by…', ['2/5', '5/2', '10', '1/10'], 2, 'E = ΔV/d: × 2 from the voltage, × 5 from the smaller d. Total × 10.')}
${check('Two charged metal spheres, one twice the radius of the other, are connected by a long wire. Which is true afterward?', ['They have equal charge', 'They have equal potential', 'They have equal surface field', 'The small one has more charge'], 1, 'Charge flows until V is equal. Then Q ∝ R (big one has more charge), and surface E ∝ 1/R (small one has the stronger field).')}
`;
      return sandbox(el.querySelector('[data-sim="eqp"]'), {
        aspect: H,
        presets: {
          'Plus and minus': [{ x: 0.32, y: H / 2, q: 1 }, { x: 0.68, y: H / 2, q: -1 }],
          'One + charge': [{ x: 0.5, y: H / 2, q: 1 }],
          'Two plus': [{ x: 0.35, y: H / 2, q: 1 }, { x: 0.65, y: H / 2, q: 1 }],
          'Parallel plates': platesPreset(H),
        },
        show: { heat: true, equip: true, lines: false },
        toggles: ['equip', 'lines', 'heat'],
        probe: 'potential',
        showE: true,
        probeAt: [0.5, 0.2],
        profile: true,
        profileMax: 150,
        lpc: 8,
        caption: 'Red = high V, blue = low V. Each source is ±1 nC (plates: many smaller charges). The world is 1 m wide.',
      });
    },
  });

  // =====================================================================
  // 14. Capacitors
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 14, id: 'u1-capacitors', title: 'Capacitors: storing charge and energy',
    render(el) {
      el.innerHTML = `
<p class="lead">A capacitor is just two conductors (usually flat plates) held close together but not touching. Connect it to a battery and it stores charge — and energy — in the electric field between the plates. Every idea in it is something you've already seen.</p>

<h2>How it charges</h2>
<p>A battery maintains a potential difference between its terminals. Connect it across two neutral plates: the battery pulls electrons off one plate and pushes them onto the other. One plate becomes +Q, the other −Q (total still zero — conservation). Charge keeps flowing until the plates' potential difference equals the battery's. Then everything stops.</p>
<p>The ratio of stored charge to voltage is the <b>capacitance</b>:</p>
${eq('\\[ C = \\frac{Q}{\\Delta V} \\]', 'where \\(C\\) = capacitance (farads, F = C/V); \\(Q\\) = magnitude of charge on <b>each</b> plate (C); \\(\\Delta V\\) = potential difference between the plates (V). Real capacitors are tiny: picofarads (pF, \\(10^{-12}\\) F) to microfarads (μF).')}

<h2>What sets C?</h2>
${eq('\\[ C = \\kappa\\,\\varepsilon_0\\frac{A}{d} \\]', 'where \\(A\\) = area of each plate (m²); \\(d\\) = plate separation (m); \\(\\varepsilon_0 = 8.85\\times10^{-12}\\) C²/(N·m²); \\(\\kappa\\) (kappa) = dielectric constant of the insulator between the plates (1 for vacuum/air, about 3 for paper, 5 for glass, 80 for water). C depends only on the geometry and material — not on Q or V.')}
<p>Why? From lesson 9, the field between plates is \\(E = Q/(\\varepsilon_0 A)\\), and from lesson 13, \\(\\Delta V = Ed\\). So \\(\\Delta V = Qd/(\\varepsilon_0 A)\\), which rearranges to \\(Q/\\Delta V = \\varepsilon_0 A/d\\).</p>
<ul>
<li><b>Bigger A:</b> the same charge is spread thinner, so E and ΔV are smaller → more charge per volt.</li>
<li><b>Smaller d:</b> the same E over a shorter distance gives a smaller ΔV → more charge per volt.</li>
</ul>

<div class="sim" data-sim="cap">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Area <input type="range" data-k="A" min="50" max="400" step="10" value="100"> <span data-k="Av"></span></label>
    <label>Gap <input type="range" data-k="d" min="1" max="10" step="0.5" value="2"> <span data-k="dv"></span></label>
    <label>κ <input type="range" data-k="k" min="1" max="6" step="0.5" value="1"> <span data-k="kv"></span></label>
    <label>Battery <input type="range" data-k="V" min="1" max="12" step="0.5" value="6"> <span data-k="Vv"></span></label>
    <label><input type="checkbox" data-k="con" checked> Battery connected</label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Plate charges (+/−) are drawn in proportion to Q; arrows between plates in proportion to E. Disconnect the battery, then change the gap or slide in a dielectric: Q is trapped and can't change, so V and E change instead.</div>
</div>

<h2>Dielectrics: polarization strikes again</h2>
<p>Slide an insulator between the plates. Its molecules polarize (lesson 3): their − ends lean toward the + plate and their + ends toward the − plate. That leaves a layer of − charge next to the + plate and + next to the − plate, which partly cancels the plates' field. For the same Q, E and ΔV drop by a factor of κ — so C = Q/ΔV goes <b>up</b> by κ.</p>

<h2>Energy stored</h2>
<p>Charging isn't free: each extra bit of charge has to be pushed against the growing voltage. ΔV rises in proportion to Q (a straight line on a V-vs-Q graph), so the total work is the area of a triangle:</p>
${eq('\\[ U_C = \\tfrac12 Q\\,\\Delta V = \\tfrac12 C(\\Delta V)^2 = \\frac{Q^2}{2C} \\]', 'where \\(U_C\\) = energy stored in the capacitor (J). The ½ comes from the average voltage during charging being half the final voltage. Pick the form matching what\'s held constant.')}
<p><b>Example.</b> A = 100 cm² = 0.010 m², d = 2.0 mm, air. \\(C = (8.85\\times10^{-12})(0.010)/(0.0020) = 44\\) pF. At 6.0 V: \\(Q = CV = 2.7\\times10^{-10}\\) C, \\(E = V/d = 3000\\) V/m, \\(U = \\tfrac12 CV^2 = 8.0\\times10^{-10}\\) J.</p>

<h2>Connected vs. disconnected (the big AP question)</h2>
<ul>
<li><b>Battery stays connected → ΔV is fixed.</b> Change the plates and the battery adds or removes charge to keep ΔV. Double d: C halves, Q halves, E = V/d halves, U halves.</li>
<li><b>Battery disconnected → Q is fixed</b> (the charge has nowhere to go). Double d: C halves, ΔV = Q/C doubles, E stays the same (\\(E = Q/\\varepsilon_0 A\\)), U = Q²/2C doubles — the extra energy is the work you did pulling the attracting plates apart.</li>
<li><b>Insert a dielectric, disconnected:</b> C × κ, Q same, ΔV ÷ κ, E ÷ κ, U ÷ κ. <b>Connected:</b> C × κ, ΔV same, Q × κ, E same, U × κ.</li>
</ul>

${call('analogy', 'Analogy: a water tank pumped full', 'The battery is a pump that can push water up to a certain height (voltage). A wide tank (big A) holds more water for the same height. Energy stored is like the gravitational energy of the water — and since the first water barely had to be lifted and the last was lifted all the way, the average is half: ½QV.')}
${call('mistake', 'Common mistakes', '<ul><li>"C depends on Q or V." It doesn\'t. Q = CV tells you Q from C, not the other way around.</li><li>Forgetting to ask "is the battery connected?" before reasoning. That one question decides what stays constant.</li><li>Using total charge 2Q or 0. Q means the charge on each plate.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect ratio questions: "a second capacitor has twice the area and twice the separation" (same C), and connected/disconnected scenarios asking which of Q, V, E, U change.')}
${check('A capacitor is charged and then disconnected from the battery. The plates are pulled farther apart. What happens to the voltage between them?', ['Decreases', 'Stays the same', 'Increases', 'Becomes zero'], 2, 'Disconnected → Q fixed. Larger d → smaller C. ΔV = Q/C increases.')}
${check('A capacitor stays connected to a battery while a dielectric (κ = 3) is inserted. The stored charge…', ['Triples', 'Stays the same', 'Drops to 1/3', 'Increases ninefold'], 0, 'Connected → ΔV fixed. C triples, so Q = CΔV triples (the battery supplies more charge).')}
`;
      const host = el.querySelector('[data-sim="cap"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const s0 = { A: 100, d: 2, k: 1, Vb: 6, con: true, Qfix: 0 };
      const C0 = (EPS0 * 0.01) / 0.002, Qref = C0 * 6, Eref = 3000;
      const calc = () => {
        const C = (s0.k * EPS0 * s0.A * 1e-4) / (s0.d * 1e-3);
        let Q, V;
        if (s0.con) { V = s0.Vb; Q = C * V; } else { Q = s0.Qfix; V = Q / C; }
        return { C, Q, V, E: V / (s0.d * 1e-3), U: 0.5 * Q * V };
      };
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const f = w / 700;
        const r = calc();
        const gap = (30 + s0.d * 19) * f;
        const ph = Math.sqrt(s0.A) * 15 * f;
        const cx = w / 2, cy = h * 0.4;
        const xl = cx - gap / 2, xr = cx + gap / 2, yt = cy - ph / 2, yb = cy + ph / 2;
        // dielectric
        if (s0.k > 1) {
          ctx.fillStyle = rgba(col('--warn'), 0.12 + 0.03 * s0.k);
          ctx.fillRect(xl + 3, yt, gap - 6, ph);
          const nd = Math.max(2, Math.floor(ph / (22 * f)));
          for (let i = 0; i < nd; i++) {
            const y = yt + ((i + 0.5) * ph) / nd;
            for (let jx = 0; jx < Math.max(1, Math.floor(gap / (30 * f))); jx++) {
              const x = xl + ((jx + 0.5) * gap) / Math.max(1, Math.floor(gap / (30 * f)));
              ctx.beginPath(); ctx.ellipse(x, y, 9 * f + 3, 4.5 * f + 2, 0, 0, Math.PI * 2);
              ctx.strokeStyle = rgba(col('--warn'), 0.8); ctx.lineWidth = 1; ctx.stroke();
              chargeDot(ctx, x - 5 * f - 1, y, -1, 3.5 * f + 1);
              chargeDot(ctx, x + 5 * f + 1, y, 1, 3.5 * f + 1);
            }
          }
          text(ctx, `dielectric κ = ${s0.k}`, cx, yb + 14, { size: 11, color: col('--warn') });
        }
        // field arrows
        const nE = clamp(Math.round((r.E / Eref) * 7), 0, 26);
        for (let i = 0; i < nE; i++) {
          const y = yt + ((i + 0.5) * ph) / nE;
          arrow(ctx, xl + 5, y, xr - 5, y, rgba(col('--text'), 0.55), 1.2, 6);
        }
        // plates
        ctx.fillStyle = col('--muted');
        ctx.fillRect(xl - 7, yt, 7, ph); ctx.fillRect(xr, yt, 7, ph);
        const nQ = clamp(Math.round((r.Q / Qref) * 8), 0, 40);
        const cr = Math.max(3.5, 4.5 * f);
        for (let i = 0; i < nQ; i++) {
          const y = yt + ((i + 0.5) * ph) / nQ;
          chargeDot(ctx, xl - 15, y, 1, cr * (nQ > 20 ? 0.8 : 1));
          chargeDot(ctx, xr + 15, y, -1, cr * (nQ > 20 ? 0.8 : 1));
        }
        // wires + battery
        const by = h * 0.86, bx = cx;
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xl - 7, cy); ctx.lineTo(xl - 0.16 * w, cy); ctx.lineTo(xl - 0.16 * w, by); ctx.lineTo(bx - 14, by);
        ctx.moveTo(xr + 7, cy); ctx.lineTo(xr + 0.16 * w, cy); ctx.lineTo(xr + 0.16 * w, by);
        if (s0.con) ctx.lineTo(bx + 12, by);
        else { ctx.lineTo(bx + 46, by); ctx.moveTo(bx + 46, by); ctx.lineTo(bx + 24, by - 14); ctx.moveTo(bx + 12, by); ctx.lineTo(bx + 24, by); }
        ctx.stroke();
        // battery symbol: long line (+) left, short line (−) right
        ctx.lineWidth = 3; ctx.strokeStyle = col('--pos');
        ctx.beginPath(); ctx.moveTo(bx - 14, by - 16); ctx.lineTo(bx - 14, by + 16); ctx.stroke();
        ctx.strokeStyle = col('--neg'); ctx.beginPath(); ctx.moveTo(bx + 4, by - 9); ctx.lineTo(bx + 4, by + 9); ctx.stroke();
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 4, by); ctx.lineTo(bx + 12, by); ctx.stroke();
        text(ctx, `${s0.Vb} V battery${s0.con ? '' : ' (disconnected)'}`, bx - 4, by + 28, { size: 11, color: col('--muted') });
        text(ctx, `d = ${s0.d} mm`, cx, yt - 12, { size: 11, color: col('--muted') });
        const fmtC = (c) => `${PR.sig(c * 1e12, 3)} pF`;
        ro.innerHTML = `<span>C = <b>${fmtC(r.C)}</b></span><span>Q = <b>${sci(r.Q, 3)} C</b></span><span>ΔV = <b>${PR.sig(r.V, 3)} V</b></span><span>E = <b>${sci(r.E, 3)} V/m</b></span><span>U = <b>${sci(r.U, 3)} J</b></span>`;
      }
      const st = stage(cv, 0.62, draw);
      const upd = () => {
        s0.A = Number(q('A').value); s0.d = Number(q('d').value); s0.k = Number(q('k').value); s0.Vb = Number(q('V').value);
        q('Av').textContent = `${s0.A} cm²`; q('dv').textContent = `${s0.d} mm`; q('kv').textContent = s0.k; q('Vv').textContent = `${s0.Vb} V`;
        st.request();
      };
      ['A', 'd', 'k', 'V'].forEach((k) => (q(k).oninput = upd));
      q('con').onchange = () => {
        if (!q('con').checked) { s0.Qfix = calc().Q; s0.con = false; q('V').disabled = true; }
        else { s0.con = true; q('V').disabled = false; }
        st.request();
      };
      upd(); st.draw();
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 15. Bridge to circuits: the battery
  // =====================================================================
  LESSONS.push({
    unit: 1, order: 15, id: 'u1-battery', title: 'The battery: a charge elevator (bridge to circuits)',
    render(el) {
      el.innerHTML = `
<p class="lead">A roller coaster needs something to haul the cars back up to the top: the chain lift. In electricity, that job belongs to the <b>battery</b>. With that one idea, everything in this unit turns into the start of circuits.</p>

<h2>What a battery does</h2>
<p>Chemical reactions inside a battery move charge "uphill" — positive charge to the + terminal, negative to the − terminal — and keep doing it until the terminals reach a fixed potential difference, its voltage (also called <b>emf</b>, ε). Then it stops, unless charge is drained away. So:</p>
<div class="callout idea"><div class="title">Big idea</div>A battery <b>maintains a constant potential difference</b> between its terminals. Every coulomb that passes through it gains ε joules of energy (a 1.5 V cell gives 1.5 J per coulomb).</div>
<p>You've already seen this in the capacitor lesson: the battery pushed charge onto the plates until the capacitor's voltage matched the battery's, then stopped.</p>

<h2>Connect a closed loop</h2>
<p>Now connect the terminals with wires through a light bulb, making a complete loop (a <b>circuit</b>). The battery's potential difference sets up an electric field inside the wires and bulb. Since metals have free electrons (lesson 2), that field pushes them along: a steady flow of charge called <b>current</b>. Because the battery keeps lifting charge back up, the flow never stops.</p>

<div class="sim" data-sim="loop">
  <canvas></canvas>
  <canvas data-k="prof" style="border-top:1px solid var(--border)"></canvas>
  <div class="sim-controls">
    <label>Battery ε <input type="range" data-k="V" min="1.5" max="12" step="0.5" value="6"> <span data-k="Vv"></span></label>
    <label><input type="checkbox" data-k="sw" checked> Switch closed</label>
    <label><input type="checkbox" data-k="el"> Show electrons instead</label>
  </div>
  <div class="sim-caption">Top: the circuit, with charges flowing. Bottom: the potential (the "track height") as you go around the loop. The battery lifts charge up; the bulb is where it rolls back down, giving its energy away as light and heat. Open the switch: the flow stops, but the battery still holds its voltage — now the whole drop sits across the gap in the switch.</div>
</div>

<h2>The roller-coaster loop</h2>
<ul>
<li><b>Battery = chain lift:</b> raises the potential by ε.</li>
<li><b>Wires = flat track:</b> good wires lose almost no potential.</li>
<li><b>Bulb = the drop:</b> potential falls, and the energy \\(q\\Delta V\\) leaves as light and heat.</li>
</ul>
<p>Going all the way around the loop, you end where you started, at the same height. So <b>the total rise equals the total drop</b>: the bulb's voltage equals the battery's. This is the seed of <b>Kirchhoff's loop rule</b> — the sum of potential changes around any closed loop is zero — which is how you'll analyze every circuit next unit.</p>

<h2>Which way does it flow?</h2>
<p>By tradition, <b>conventional current</b> is drawn as the flow of positive charge: out of the + terminal, through the circuit, into the − terminal (downhill in V). In metal wires, the moving charges are actually electrons, going the opposite way (uphill in V — negative charges do that!). Both pictures give the same energy bookkeeping. Toggle "show electrons" to see it.</p>

${call('analogy', 'Analogy: the chain lift', 'A coaster with no chain lift runs once and stops at the bottom. A circuit with no battery is the same: a charged capacitor connected to a bulb flashes briefly, then stops, because nothing lifts the charge back up. The battery is the chain lift that keeps the ride going.')}
${call('mistake', 'Common mistakes', '<ul><li>"The battery is a container of charge that gets used up." It\'s an energy source that pumps charge already present in the wires. Charge isn\'t used up — it goes around (conservation of charge). What runs out is the chemical energy.</li><li>"Current needs only one wire." Without a closed loop, charge piles up, the field cancels (like in lesson 8), and the flow stops almost instantly.</li></ul>')}
${call('ap', 'On the AP exam', 'Energy language for circuits: "the battery does work on charges, increasing their electric potential energy; that energy is transferred to the bulb as charges move to lower potential." Keeping track of potential around a loop is the core skill of the circuits unit.')}
${check('A 9 V battery is connected to a single bulb with ideal wires. What is the potential difference across the bulb?', ['0 V', '4.5 V', '9 V', 'It depends on the current'], 2, 'Around the loop, rises equal drops. The battery\'s 9 V rise must be matched by a 9 V drop, all in the bulb (ideal wires drop nothing).')}
${check('How much energy does 2 C of charge gain passing through a 12 V battery?', ['6 J', '12 J', '24 J', '0.17 J'], 2, 'ΔU = qΔV = (2 C)(12 V) = 24 J.')}
`;
      const host = el.querySelector('[data-sim="loop"]');
      const cv = host.querySelector('canvas');
      const pcv = host.querySelector('[data-k="prof"]');
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const s0 = { V: 6, on: true, el: false };
      // loop parameter u in [0,4): 0-1 battery (left side, bottom→top), 1-2 top wire (left→right, switch in middle), 2-3 bulb side (top→bottom), 3-4 bottom wire (right→left)
      const N = 32;
      let phase = 0;
      function Vof(u) {
        const V = s0.V;
        if (u < 1) return V * clamp((u - 0.3) / 0.4, 0, 1);
        if (u < 2) { if (s0.on) return V; return u < 1.5 ? V : 0; }
        if (u < 3) return s0.on ? V * (1 - clamp((u - 2.3) / 0.4, 0, 1)) : 0;
        return 0;
      }
      function pos(u, x0, y0, x1, y1) {
        if (u < 1) return [x0, lerp(y1, y0, u)];
        if (u < 2) return [lerp(x0, x1, u - 1), y0];
        if (u < 3) return [x1, lerp(y0, y1, u - 2)];
        return [lerp(x1, x0, u - 3), y1];
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const x0 = 0.18 * w, x1 = 0.82 * w, y0 = 0.16 * h, y1 = 0.86 * h;
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0 + 0.3 * (y1 - y0)); ctx.lineTo(x0, y0); ctx.lineTo((x0 + x1) / 2 - 18, y0);
        ctx.moveTo((x0 + x1) / 2 + 18, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + 0.3 * (y1 - y0));
        ctx.moveTo(x1, y0 + 0.7 * (y1 - y0)); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y0 + 0.7 * (y1 - y0));
        ctx.stroke();
        // switch
        const sx = (x0 + x1) / 2;
        ctx.beginPath(); ctx.arc(sx - 18, y0, 3, 0, 7); ctx.arc(sx + 18, y0, 3, 0, 7); ctx.fillStyle = col('--text'); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx - 18, y0); ctx.lineTo(s0.on ? sx + 18 : sx + 12, s0.on ? y0 : y0 - 20); ctx.stroke();
        text(ctx, 'switch', sx, y0 - 26, { size: 11, color: col('--muted') });
        // battery (vertical): + plate at top
        const by = y0 + 0.5 * (y1 - y0);
        ctx.lineWidth = 3;
        ctx.strokeStyle = col('--pos'); ctx.beginPath(); ctx.moveTo(x0 - 20, by - 0.2 * (y1 - y0) + 8); ctx.lineTo(x0 + 20, by - 0.2 * (y1 - y0) + 8); ctx.stroke();
        ctx.strokeStyle = col('--neg'); ctx.beginPath(); ctx.moveTo(x0 - 11, by + 0.2 * (y1 - y0) - 8); ctx.lineTo(x0 + 11, by + 0.2 * (y1 - y0) - 8); ctx.stroke();
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x0, y0 + 0.3 * (y1 - y0)); ctx.lineTo(x0, by - 0.2 * (y1 - y0) + 8); ctx.moveTo(x0, by + 0.2 * (y1 - y0) - 8); ctx.lineTo(x0, y0 + 0.7 * (y1 - y0)); ctx.stroke();
        text(ctx, '+', x0 - 30, by - 0.2 * (y1 - y0) + 8, { color: col('--pos'), weight: 700, size: 16 });
        text(ctx, '−', x0 - 30, by + 0.2 * (y1 - y0) - 8, { color: col('--neg'), weight: 700, size: 16 });
        text(ctx, `battery ${s0.V} V`, x0 + 26, by, { align: 'left', size: 12, color: col('--muted') });
        // bulb
        const glow = s0.on ? clamp(s0.V / 12, 0, 1) : 0;
        if (glow > 0) {
          const g = ctx.createRadialGradient(x1, by, 4, x1, by, 30 + 40 * glow);
          g.addColorStop(0, rgba(col('--warn'), 0.55 * glow + 0.15)); g.addColorStop(1, rgba(col('--warn'), 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x1, by, 30 + 40 * glow, 0, 7); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x1, by, 0.2 * (y1 - y0), 0, 7);
        ctx.fillStyle = col('--surface'); ctx.fill(); ctx.strokeStyle = col('--text'); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) { const yy = by - 0.12 * (y1 - y0) + (i / 20) * 0.24 * (y1 - y0); const xx = x1 + (i % 2 ? 6 : -6); if (i) ctx.lineTo(xx, yy); else ctx.moveTo(x1, yy); }
        ctx.strokeStyle = glow > 0 ? col('--warn') : col('--muted'); ctx.stroke();
        text(ctx, 'bulb', x1 - 0.2 * (y1 - y0) - 10, by, { align: 'right', size: 12, color: col('--muted') });
        // charges
        for (let i = 0; i < N; i++) {
          const u = (((i / N) * 4 + phase) % 4 + 4) % 4;
          const [x, y] = pos(u, x0, y0, x1, y1);
          chargeDot(ctx, x, y, s0.el ? -1 : 1, Math.max(4, w * 0.008));
        }
        drawProf();
      }
      let pr = null;
      function drawProf() {
        if (!pr) return;
        const ctx = pr.ctx, w = pr.w, h = pr.h;
        ctx.clearRect(0, 0, w, h);
        const x0 = 40, x1 = w - 12, yb = h - 22, yt = 16;
        const X = (u) => x0 + (u / 4) * (x1 - x0), Y = (v) => yb - (v / 12) * (yb - yt);
        ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, yt); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
        text(ctx, 'V', x0 - 16, yt + 4, { color: col('--muted') });
        [['battery', 0.5], ['top wire', 1.5], ['bulb', 2.5], ['bottom wire', 3.5]].forEach(([l, u]) => text(ctx, l, X(u), yb + 12, { size: 10, color: col('--muted') }));
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2.5; ctx.beginPath();
        for (let u = 0; u <= 4.0001; u += 0.01) { const y = Y(Vof(Math.min(u, 3.999))); if (u === 0) ctx.moveTo(X(u), y); else ctx.lineTo(X(u), y); }
        ctx.stroke();
        text(ctx, `+${s0.V} V`, x0 - 6, Y(s0.V), { align: 'right', size: 10, color: col('--muted') });
        for (let i = 0; i < N; i++) {
          const u = (((i / N) * 4 + phase) % 4 + 4) % 4;
          chargeDot(ctx, X(u), Y(Vof(u)) - 6, s0.el ? -1 : 1, 4);
        }
      }
      const st = stage(cv, 0.55, draw);
      pr = stage(pcv, 0.24, () => st.draw());
      const upd = () => { s0.V = Number(q('V').value); s0.on = q('sw').checked; s0.el = q('el').checked; q('Vv').textContent = `${s0.V} V`; st.request(); };
      q('V').oninput = q('sw').onchange = q('el').onchange = upd; upd();
      const stop = loop((dt) => {
        if (s0.on) phase += (s0.el ? -1 : 1) * dt * 0.06 * s0.V;
        st.draw();
      });
      return () => { stop(); st.destroy(); pr.destroy(); };
    },
  });
})();
