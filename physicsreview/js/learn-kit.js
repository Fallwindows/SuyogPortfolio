// Shared lesson toolkit for the AP Physics 1 lesson files (learn-kinematics/dynamics/energy.js).
// Same canvas, markup and interaction helpers the Physics 2 lessons use, so every
// lesson looks and behaves alike. Classic script: attaches window.PRKit.
window.PRKit = (function () {
  'use strict';

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

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Labeled chip, e.g. a value tag next to a moving object.
  function tag(ctx, s, x, y, o = {}) {
    ctx.font = `${o.weight || 600} ${o.size || 12}px Inter, system-ui, sans-serif`;
    const tw = ctx.measureText(s).width + 12;
    ctx.fillStyle = rgba(col('--surface'), 0.92); roundRect(ctx, x, y, tw, 20, 6); ctx.fill();
    text(ctx, s, x + 6, y + 10, { align: 'left', weight: o.weight || 600, size: o.size, color: o.color });
    return tw;
  }

  // Small x–y plot inside box {x, y, w, h}. o: {xMax, yMin, yMax, xLabel, yLabel, color}.
  // Returns {X(t), Y(v)} mappers so callers can draw extra marks on the same axes.
  function axes(ctx, box, o = {}) {
    const xMax = o.xMax || 1, yMin = o.yMin != null ? o.yMin : -1, yMax = o.yMax != null ? o.yMax : 1;
    const X = (t) => box.x + (t / xMax) * box.w;
    const Y = (v) => box.y + box.h - ((v - yMin) / (yMax - yMin)) * box.h;
    ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    if (yMin < 0 && yMax > 0) {
      ctx.strokeStyle = col('--muted'); ctx.beginPath(); ctx.moveTo(box.x, Y(0)); ctx.lineTo(box.x + box.w, Y(0)); ctx.stroke();
    }
    if (o.yLabel) text(ctx, o.yLabel, box.x + 6, box.y + 10, { align: 'left', color: col('--muted'), size: 11, weight: 600 });
    if (o.xLabel) text(ctx, o.xLabel, box.x + box.w - 4, box.y + box.h - 8, { align: 'right', color: col('--muted'), size: 11 });
    return { X, Y };
  }
  // Polyline of f over [0, xMax] on axes from axes().
  function plot(ctx, ax, f, xMax, color, lw = 2, n = 120) {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = (xMax * i) / n;
      const px = ax.X(t), py = ax.Y(f(t));
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
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

  return { col, clamp, lerp, ease, rgbOf, rgba, sci, signed, eq, call, check, arrow, text, roundRect, tag, axes, plot, stage, drag, loop };
})();
