// Unit 2 · Circuits — visual, first-principles lessons.
// Classic script: pushes lesson objects onto window.LESSONS (see CONTRACT).
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);
  const E_CHARGE = 1.6e-19;

  /* ===================================================================== */
  /* Shared helpers                                                         */
  /* ===================================================================== */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;

  function bag() {
    const fns = [];
    const run = function () {
      while (fns.length) {
        try { fns.pop()(); } catch (e) { /* ignore */ }
      }
    };
    run.add = (f) => { fns.push(f); return f; };
    return run;
  }
  function on(b, target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    b.add(() => target.removeEventListener(type, fn, opts));
  }

  // Theme colours re-read from CSS (cached ~200 ms, so a dark-mode switch shows up right away).
  let themeCache = null, themeAt = -1e9;
  function theme() {
    const now = Date.now();
    if (!themeCache || now - themeAt > 200) {
      const c = (n) => PR.color(n) || '#888888';
      themeCache = {
        text: c('--text'), muted: c('--muted'), border: c('--border'), surface: c('--surface'),
        surface2: c('--surface-2'), accent: c('--accent'), accentSoft: c('--accent-soft'),
        pos: c('--pos'), neg: c('--neg'), good: c('--good'), bad: c('--bad'), warn: c('--warn'), bg: c('--bg'),
      };
      themeAt = now;
    }
    return themeCache;
  }
  const rgbCache = new Map();
  function rgb(c) {
    if (rgbCache.has(c)) return rgbCache.get(c);
    let out = [128, 128, 128];
    const s = String(c).trim();
    if (s[0] === '#') {
      let h = s.slice(1);
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      const n = parseInt(h.slice(0, 6), 16);
      if (!isNaN(n)) out = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    } else {
      const m = s.match(/[\d.]+/g);
      if (m && m.length >= 3) out = [+m[0], +m[1], +m[2]];
    }
    rgbCache.set(c, out);
    return out;
  }
  function mix(a, b, t) {
    const A = rgb(a), B = rgb(b);
    t = clamp(t, 0, 1);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  }
  function alpha(c, a) {
    const A = rgb(c);
    return `rgba(${A[0]},${A[1]},${A[2]},${clamp(a, 0, 1)})`;
  }

  // Number formatting for live HTML readouts (KaTeX is not re-run on readouts).
  function num(x, n = 3) {
    if (x === 0) return '0';
    if (!isFinite(x)) return '∞';
    const ax = Math.abs(x);
    if (ax >= 1e-3 && ax < 1e6) {
      return Number(x.toPrecision(n)).toLocaleString('en-US', { maximumFractionDigits: 6 });
    }
    const e = Math.floor(Math.log10(ax));
    const m = Number((x / Math.pow(10, e)).toPrecision(n));
    return `${m}×10<sup>${e}</sup>`;
  }
  // Plain-text number for canvas labels
  function tnum(x, n = 3) {
    if (x === 0) return '0';
    if (!isFinite(x)) return '∞';
    const ax = Math.abs(x);
    if (ax >= 1e-3 && ax < 1e6) return String(Number(x.toPrecision(n)));
    return x.toExponential(n - 1);
  }
  const sgn = (x, n = 3) => (x > 1e-12 ? '+' : x < -1e-12 ? '−' : '') + num(Math.abs(x), n);

  // Responsive canvas + animation loop. frame(view, dt, t) runs every frame while on-screen.
  function canvasSim(b, canvas, aspect, frame) {
    const asp = () => (typeof aspect === 'function' ? aspect(canvas.clientWidth || 600) : aspect);
    const view = PR.fitCanvas(canvas, asp());
    view.refit = () => Object.assign(view, PR.fitCanvas(canvas, asp()));
    on(b, window, 'resize', () => { view.refit(); frame(view, 0, 0); });
    let visible = true;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; });
      io.observe(canvas);
      b.add(() => io.disconnect());
    }
    let id = 0, last = 0;
    const tick = (t) => {
      id = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (!visible) return;
      frame(view, dt, t / 1000);
    };
    id = requestAnimationFrame(tick);
    b.add(() => cancelAnimationFrame(id));
    return view;
  }

  // Pointer handling (mouse + touch). Handlers get {x,y} in CSS px. down() returning false = no drag.
  function drag(b, canvas, h) {
    let active = false;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    on(b, canvas, 'pointerdown', (e) => {
      if (h.down && h.down(pos(e)) === false) return;
      active = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });
    on(b, canvas, 'pointermove', (e) => {
      const p = pos(e);
      if (active) { if (h.move) h.move(p); }
      else if (h.hover) canvas.style.cursor = h.hover(p) ? 'pointer' : 'default';
    });
    const end = () => { if (active) { active = false; if (h.up) h.up(); } };
    on(b, canvas, 'pointerup', end);
    on(b, canvas, 'pointercancel', end);
  }

  const ctl = (root, k) => root.querySelector(`[data-k="${k}"]`);
  function out(root, k, html) { const e = root.querySelector(`[data-o="${k}"]`); if (e) e.innerHTML = html; }
  const slider = (k, label, min, max, step, val) =>
    `<label data-l="${k}">${label} <input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${val}"> <span data-o="${k}"></span></label>`;
  const checkbox = (k, label, onn) => `<label><input type="checkbox" data-k="${k}" ${onn ? 'checked' : ''}> ${label}</label>`;
  const button = (k, label) => `<button class="btn small" data-k="${k}">${label}</button>`;
  const select = (k, label, opts) =>
    `<label>${label} <select data-k="${k}">${opts.map((o, i) => `<option value="${i}">${o}</option>`).join('')}</select></label>`;

  function font(ctx, px, weight) {
    ctx.font = `${weight || 400} ${px}px Inter, system-ui, -apple-system, sans-serif`;
  }
  function arrow(ctx, x1, y1, x2, y2, color, w = 2, head = 8) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
    ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fill();
  }
  function text(ctx, s, x, y, color, px = 12, weight = 400, align = 'center', base = 'middle') {
    font(ctx, px, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y);
  }
  function bgFill(v) { const th = theme(); v.ctx.fillStyle = th.surface2; v.ctx.fillRect(0, 0, v.w, v.h); }

  // Plot axes in rect r = {x,y,w,h}. Returns mapping functions.
  function axes(ctx, r, xr, yr, opt) {
    const th = theme();
    const X = (v) => r.x + ((v - xr[0]) / (xr[1] - xr[0])) * r.w;
    const Y = (v) => r.y + r.h - ((v - yr[0]) / (yr[1] - yr[0])) * r.h;
    ctx.strokeStyle = th.border; ctx.lineWidth = 1;
    font(ctx, 11); ctx.fillStyle = th.muted;
    if (opt.xt) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let v = xr[0]; v <= xr[1] + 1e-9; v += opt.xt) {
        ctx.beginPath(); ctx.moveTo(X(v), r.y); ctx.lineTo(X(v), r.y + r.h); ctx.stroke();
        ctx.fillText(opt.xf ? opt.xf(v) : String(+v.toFixed(3)), X(v), r.y + r.h + 4);
      }
    }
    if (opt.yt) {
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let v = yr[0]; v <= yr[1] + 1e-9; v += opt.yt) {
        ctx.beginPath(); ctx.moveTo(r.x, Y(v)); ctx.lineTo(r.x + r.w, Y(v)); ctx.stroke();
        ctx.fillText(opt.yf ? opt.yf(v) : String(+v.toFixed(3)), r.x - 5, Y(v));
      }
    }
    ctx.strokeStyle = th.text; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y + r.h); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.stroke();
    font(ctx, 12, 600); ctx.fillStyle = th.text;
    if (opt.xl) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(opt.xl, r.x + r.w, r.y + r.h - 4); }
    if (opt.yl) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(opt.yl, r.x + 6, r.y + 2); }
    return { X, Y };
  }

  /* ===================================================================== */
  /* Series/parallel circuit engine: solve + draw a schematic               */
  /* ===================================================================== */
  // A circuit = { emf, r?, net, mode?: 'final'|'initial' }.  net is a tree of
  //   ser(...children) / par(...children) / leaf.
  // Leaf kinds: 'R' resistor, 'B' bulb, 'C' capacitor, 'A' ammeter, 'V' voltmeter, 'S' switch, 'W' plain wire.
  // Leaf state: 'ok' | 'open' (removed / switch open) | 'short' (a wire across it).
  let leafId = 0;
  function mk(k, name, R, extra) {
    return Object.assign({ k, name, R, C: 0, state: 'ok', ph: Math.random() * 0.6, id: ++leafId, I: 0, V: 0, P: 0, Q: 0 }, extra || {});
  }
  const Res = (name, R, x) => mk('R', name, R, x);
  const Bulb = (name, R, x) => mk('B', name, R, x);
  const Cap = (name, C, x) => mk('C', name, Infinity, Object.assign({ C }, x || {}));
  const Meter = (kind, name, R) => mk(kind, name, R);
  const Sw = (name, closed) => mk('S', name, 0, { state: closed ? 'ok' : 'open' });
  const ser = (...c) => ({ t: 's', c });
  const par = (...c) => ({ t: 'p', c });
  const isLeaf = (n) => !n.t;
  function leaves(n, acc = []) { if (isLeaf(n)) acc.push(n); else n.c.forEach((c) => leaves(c, acc)); return acc; }

  function effR(n, mode) {
    if (n.state === 'open') return Infinity;
    if (n.state === 'short') return 0;
    if (n.k === 'C') return mode === 'initial' ? 0 : Infinity;
    if (n.k === 'S' || n.k === 'W') return 0;
    return n.R;
  }
  function req(n, mode) {
    if (isLeaf(n)) return (n.Rq = effR(n, mode));
    if (n.t === 's') { let s = 0; for (const c of n.c) s += req(c, mode); return (n.Rq = s); }
    let g = 0, zero = false;
    for (const c of n.c) { const r = req(c, mode); if (r === 0) zero = true; else if (r !== Infinity) g += 1 / r; }
    return (n.Rq = zero ? 0 : g === 0 ? Infinity : 1 / g);
  }
  const plainCap = (c) => isLeaf(c) && c.k === 'C' && c.state === 'ok';
  // Distribute voltage V and current I through the tree (current flows "left to right").
  function dist(n, V, I, mode) {
    n.V = V; n.I = I;
    if (isLeaf(n)) { n.P = V * I; n.Q = n.k === 'C' && n.state === 'ok' ? n.C * V : 0; return; }
    if (n.t === 's') {
      if (n.Rq === Infinity) {
        const opens = n.c.filter((c) => c.Rq === Infinity);
        if (opens.every(plainCap)) {
          let inv = 0; for (const c of opens) inv += 1 / c.C;
          const Q = V / inv;
          for (const c of n.c) dist(c, c.Rq === Infinity ? Q / c.C : 0, 0, mode);
        } else for (const c of n.c) dist(c, c.Rq === Infinity ? V / opens.length : 0, 0, mode);
      } else for (const c of n.c) dist(c, I * c.Rq, I, mode);
    } else if (n.Rq === 0) {
      const zs = n.c.filter((c) => c.Rq === 0);
      for (const c of n.c) dist(c, 0, c.Rq === 0 ? I / zs.length : 0, mode);
    } else for (const c of n.c) dist(c, V, c.Rq === Infinity ? 0 : V / c.Rq, mode);
  }
  function solveCirc(c) {
    const mode = c.mode || 'final';
    const Rn = req(c.net, mode), r = c.r || 0, Rt = Rn + r;
    c.short = Rt < 1e-9;
    const I = Rt === Infinity ? 0 : c.short ? c.emf / 0.01 : c.emf / Rt;
    const Vn = Rn === Infinity ? c.emf : I * Rn;
    dist(c.net, Vn, I, mode);
    c.I = I; c.Req = Rn; c.Vt = c.emf - I * r;
    return c;
  }
  // Pure-capacitor networks (no resistors): charge/voltage split by capacitance.
  function ceq(n) {
    if (isLeaf(n)) return (n.Ce = n.C);
    if (n.t === 's') { let s = 0; for (const c of n.c) s += 1 / ceq(c); return (n.Ce = 1 / s); }
    let s = 0; for (const c of n.c) s += ceq(c); return (n.Ce = s);
  }
  function capDist(n, V) {
    n.V = V; n.I = 0; n.Q = n.Ce * V; n.P = 0;
    if (isLeaf(n)) return;
    if (n.t === 's') for (const c of n.c) capDist(c, n.Q / c.Ce);
    else for (const c of n.c) capDist(c, V);
  }
  function solveCaps(c) { c.Ceq = ceq(c.net); capDist(c.net, c.emf); c.I = 0; c.Vt = c.emf; c.short = false; return c; }

  function layout(n) {
    if (isLeaf(n)) { n.w = 2.4; n.h = 2.0; n.ty = 0.95; return; }
    n.c.forEach(layout);
    if (n.t === 's') {
      n.w = 0; n.ty = 0; let below = 0;
      for (const c of n.c) { n.w += c.w; n.ty = Math.max(n.ty, c.ty); below = Math.max(below, c.h - c.ty); }
      n.h = n.ty + below;
    } else {
      let mw = 0, y = 0;
      for (const c of n.c) { mw = Math.max(mw, c.w); c.oy = y; y += c.h; }
      n.w = mw + 1.0; n.h = y; n.ty = n.c[0].ty;
    }
  }
  function circDims(c) {
    layout(c.net);
    const X0 = 0.55, Y0 = 0.15;
    const xr = X0 + c.net.w, xR = xr + 0.35, yt = Y0 + c.net.ty, yb = Y0 + c.net.h + 0.5;
    return { X0, Y0, xr, xR, xl: 0.2, yt, yb, W: xR + 0.25, H: yb + 0.95 };
  }

  const UMAX = 58; // max px per layout unit, so small circuits don't get huge
  function seg(E, x1, y1, x2, y2, V) {
    const c = E.ctx;
    c.strokeStyle = E.col(V); c.lineWidth = E.lw;
    c.beginPath(); c.moveTo(E.X(x1), E.Y(y1)); c.lineTo(E.X(x2), E.Y(y2)); c.stroke();
    E.segs.push({ x1: E.X(x1), y1: E.Y(y1), x2: E.X(x2), y2: E.Y(y2), V });
  }
  function dotsAlong(E, pts, I, holder, skip) {
    // pts: polyline in units, in the direction of conventional current
    if (!E.o.dots || !(Math.abs(I) > 1e-9) || !isFinite(I)) return;
    const sp = 0.55; // spacing in units
    const speed = clamp((E.o.dotK || 1) * I, -6, 6);
    holder.ph = (((holder.ph || 0) + speed * E.dt) % sp + sp) % sp;
    let L = 0; const lens = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); L += l; }
    const ctx = E.ctx; ctx.fillStyle = E.th.warn;
    for (let s = holder.ph; s < L; s += sp) {
      let d = s, i = 0;
      while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
      const t = lens[i] ? d / lens[i] : 0;
      const x = lerp(pts[i][0], pts[i + 1][0], t), y = lerp(pts[i][1], pts[i + 1][1], t);
      if (skip && skip(x, y)) continue;
      ctx.beginPath(); ctx.arc(E.X(x), E.Y(y), Math.max(2, E.u * 0.07), 0, 2 * Math.PI); ctx.fill();
    }
  }
  function zigzag(E, x1, x2, y, vertical) {
    const ctx = E.ctx, n = 6, amp = 0.2;
    ctx.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const t = i / (n * 2), a = i === 0 || i === n * 2 ? 0 : i % 2 ? amp : -amp;
      const p = lerp(x1, x2, t);
      if (vertical) { if (i === 0) ctx.moveTo(E.X(y + a), E.Y(p)); else ctx.lineTo(E.X(y + a), E.Y(p)); }
      else if (i === 0) ctx.moveTo(E.X(p), E.Y(y + a)); else ctx.lineTo(E.X(p), E.Y(y + a));
    }
    ctx.stroke();
  }
  function leafValue(n) {
    if (n.lab) return n.lab;
    if (n.k === 'C') return tnum(n.C * 1e6) + ' µF';
    if (n.k === 'S' || n.k === 'W') return '';
    if (n.k === 'A' || n.k === 'V') return '';
    return tnum(n.R) + ' Ω';
  }
  function leafFull(n) {
    if (n.k === 'C') return `${tnum(n.Q * 1e6)} µC · ${tnum(n.V)} V`;
    if (n.k === 'A') return `reads ${tnum(n.I)} A`;
    if (n.k === 'V') return `reads ${tnum(n.V)} V`;
    if (n.k === 'S' || n.k === 'W') return '';
    return `${tnum(n.I)} A · ${tnum(n.V)} V`;
  }
  function drawLeaf(E, n, x, y, w, Vl) {
    const ctx = E.ctx, th = E.th, u = E.u, Vr = Vl - n.V, cx = x + w / 2;
    const half = { R: 0.62, B: 0.42, C: 0.13, A: 0.38, V: 0.38, S: 0.45, W: 0 }[n.k] || 0;
    const fs = clamp(u * 0.3, 10, 13);
    seg(E, x, y, cx - half, y, Vl);
    seg(E, cx + half, y, x + w, y, Vr);
    if (n.k === 'W') seg(E, cx - 0.01, y, cx + 0.01, y, Vl);
    const faded = n.state === 'open' && n.k !== 'S';
    ctx.globalAlpha = faded ? 0.28 : 1;
    ctx.strokeStyle = th.text; ctx.lineWidth = Math.max(1.5, u * 0.055);
    if (n.k === 'R') zigzag(E, cx - half, cx + half, y);
    else if (n.k === 'B') {
      const br = E.o.Pref ? clamp(n.P / E.o.Pref, 0, 1.6) : 0;
      if (br > 0.003) {
        const R0 = half * u, R1 = R0 * (1.2 + 1.6 * Math.sqrt(br));
        const g = ctx.createRadialGradient(E.X(cx), E.Y(y), R0 * 0.2, E.X(cx), E.Y(y), R1);
        g.addColorStop(0, alpha(th.warn, 0.95 * Math.min(1, br + 0.15)));
        g.addColorStop(1, alpha(th.warn, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(E.X(cx), E.Y(y), R1, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.fillStyle = br > 0.003 ? alpha(th.warn, 0.25 + 0.6 * Math.min(1, br)) : th.surface;
      ctx.beginPath(); ctx.arc(E.X(cx), E.Y(y), half * u, 0, 2 * Math.PI); ctx.fill();
      if (faded) ctx.setLineDash([4, 3]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); // filament
      ctx.moveTo(E.X(cx - half), E.Y(y)); ctx.lineTo(E.X(cx - 0.18), E.Y(y));
      ctx.arc(E.X(cx), E.Y(y), 0.18 * u, Math.PI, 0); ctx.lineTo(E.X(cx + half), E.Y(y)); ctx.stroke();
    } else if (n.k === 'C') {
      ctx.lineWidth = Math.max(2.5, u * 0.09);
      ctx.beginPath();
      ctx.moveTo(E.X(cx - half), E.Y(y - 0.42)); ctx.lineTo(E.X(cx - half), E.Y(y + 0.42));
      ctx.moveTo(E.X(cx + half), E.Y(y - 0.42)); ctx.lineTo(E.X(cx + half), E.Y(y + 0.42));
      ctx.stroke();
      if (Math.abs(n.Q) > 1e-12) {
        const fsz = clamp(u * 0.26, 9, 12);
        text(ctx, '+', E.X(cx - half - 0.17), E.Y(y - 0.3), th.pos, fsz, 700);
        text(ctx, '−', E.X(cx + half + 0.17), E.Y(y - 0.3), th.neg, fsz, 700);
      }
    } else if (n.k === 'A' || n.k === 'V') {
      ctx.fillStyle = th.surface; ctx.beginPath(); ctx.arc(E.X(cx), E.Y(y), half * u, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      text(ctx, n.k, E.X(cx), E.Y(y), th.accent, clamp(u * 0.38, 11, 16), 700);
    } else if (n.k === 'S') {
      ctx.strokeStyle = E.col(Vl);
      ctx.beginPath(); ctx.moveTo(E.X(cx - half), E.Y(y));
      if (n.state === 'open') ctx.lineTo(E.X(cx + half * 0.8), E.Y(y - 0.45)); else ctx.lineTo(E.X(cx + half), E.Y(y));
      ctx.stroke();
      ctx.fillStyle = th.text;
      [cx - half, cx + half].forEach((xx) => { ctx.beginPath(); ctx.arc(E.X(xx), E.Y(y), Math.max(2.5, u * 0.07), 0, 7); ctx.fill(); });
    }
    ctx.globalAlpha = 1;
    if (n.hl) {
      ctx.strokeStyle = th.accent; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.strokeRect(E.X(x + 0.12), E.Y(y - 0.85), (w - 0.24) * u, 1.85 * u); ctx.setLineDash([]);
    }
    if (n.state === 'short') {
      const a = cx - half - 0.15, bx = cx + half + 0.15, top = y - 0.62;
      ctx.strokeStyle = th.warn; ctx.lineWidth = E.lw + 1;
      ctx.beginPath(); ctx.moveTo(E.X(a), E.Y(y)); ctx.lineTo(E.X(a), E.Y(top)); ctx.lineTo(E.X(bx), E.Y(top)); ctx.lineTo(E.X(bx), E.Y(y)); ctx.stroke();
      text(ctx, 'shorted', E.X(cx), E.Y(top - 0.16), th.warn, fs - 1, 600);
    }
    // labels
    const nameY = n.state === 'short' ? y - 0.98 : y - 0.66;
    if (n.name && E.o.labels !== 'none') text(ctx, n.name + (n.state === 'open' && n.k !== 'S' ? ' (removed)' : ''), E.X(cx), E.Y(nameY), th.text, fs, 600);
    if (E.o.labels !== 'none' && E.o.labels !== 'name') {
      const v1 = leafValue(n);
      if (v1) text(ctx, v1, E.X(cx), E.Y(y + 0.62), th.muted, fs - 1);
      if (E.o.labels === 'full') { const v2 = leafFull(n); if (v2) text(ctx, v2, E.X(cx), E.Y(y + 0.92), th.text, fs - 1, 500); }
    }
    dotsAlong(E, [[x, y], [x + w, y]], n.I, n, n.k === 'C' ? (xx) => Math.abs(xx - cx) < half + 0.05 : null);
    E.hits.push({ n, x: E.X(cx), y: E.Y(y), r: Math.max(22, 0.7 * u) });
  }
  function drawNode(E, n, x, y, w, Vl) {
    if (isLeaf(n)) return drawLeaf(E, n, x, y + n.ty, w, Vl);
    if (n.t === 's') {
      const k = w / n.w; let cx = x, V = Vl;
      for (const c of n.c) { drawNode(E, c, cx, y + (n.ty - c.ty), c.w * k, V); cx += c.w * k; V -= c.V; }
      return;
    }
    const Vr = Vl - n.V, xb1 = x + 0.25, xb2 = x + w - 0.25, rowTop = y + n.ty;
    let rowBot = rowTop;
    seg(E, x, rowTop, xb1, rowTop, Vl); seg(E, xb2, rowTop, x + w, rowTop, Vr);
    for (const c of n.c) {
      const ry = y + c.oy + c.ty; rowBot = ry;
      seg(E, xb1, ry, x + 0.5, ry, Vl); seg(E, x + w - 0.5, ry, xb2, ry, Vr);
      drawNode(E, c, x + 0.5, y + c.oy, w - 1.0, Vl);
    }
    seg(E, xb1, rowTop, xb1, rowBot, Vl); seg(E, xb2, rowTop, xb2, rowBot, Vr);
    E.ctx.fillStyle = E.th.text;
    for (const c of n.c) {
      const ry = y + c.oy + c.ty;
      [xb1, xb2].forEach((xx) => { E.ctx.beginPath(); E.ctx.arc(E.X(xx), E.Y(ry), Math.max(2.5, E.u * 0.07), 0, 7); E.ctx.fill(); });
    }
  }
  // Draw a full circuit (battery on the bottom wire, + terminal on the left) into view.
  function drawCircuit(v, c, o, dt) {
    const th = theme(), ctx = v.ctx, d = circDims(c);
    const u = Math.min(v.w / d.W, v.h / d.H, UMAX), ox = (v.w - d.W * u) / 2, oy = (v.h - d.H * u) / 2;
    const Vmax = Math.max(1e-9, c.emf);
    const E = {
      ctx, u, th, o, dt: dt || 0, segs: [], hits: [], lw: Math.max(2, u * 0.07),
      X: (x) => ox + x * u, Y: (y) => oy + y * u,
      col: (V) => (o.colorV ? mix(th.neg, th.pos, clamp(V / Vmax, 0, 1)) : th.text),
    };
    E.d = d; E.ox = ox; E.oy = oy;
    const r = c.r || 0, Ir = c.I * r, Vtop = c.emf - Ir;
    const bx = (d.xl + d.xR) / 2 - (o.showR ? 0.75 : 0), rx = bx + 1.35, yb = d.yb;
    // right side and bottom (V = 0 after the network)
    const Vout = Vtop - c.net.V;
    seg(E, d.xr, d.yt, d.xR, d.yt, Vout); seg(E, d.xR, d.yt, d.xR, yb, Vout);
    if (o.showR) {
      seg(E, d.xR, yb, rx + 0.55, yb, Vout); seg(E, rx - 0.55, yb, bx + 0.12, yb, Vout - Ir);
      ctx.strokeStyle = th.text; ctx.lineWidth = Math.max(1.5, u * 0.055); zigzag(E, rx - 0.55, rx + 0.55, yb);
    } else seg(E, d.xR, yb, bx + 0.12, yb, Vout);
    seg(E, bx - 0.12, yb, d.xl, yb, Vtop); seg(E, d.xl, yb, d.xl, d.yt, Vtop); seg(E, d.xl, d.yt, d.X0, d.yt, Vtop);
    // battery: long plate (+) on the left, short thick plate (−) on the right
    ctx.strokeStyle = th.text;
    ctx.lineWidth = Math.max(2, u * 0.06);
    ctx.beginPath(); ctx.moveTo(E.X(bx - 0.12), E.Y(yb - 0.45)); ctx.lineTo(E.X(bx - 0.12), E.Y(yb + 0.45)); ctx.stroke();
    ctx.lineWidth = Math.max(4, u * 0.13);
    ctx.beginPath(); ctx.moveTo(E.X(bx + 0.12), E.Y(yb - 0.24)); ctx.lineTo(E.X(bx + 0.12), E.Y(yb + 0.24)); ctx.stroke();
    const fs = clamp(u * 0.3, 10, 13);
    text(ctx, '+', E.X(bx - 0.35), E.Y(yb - 0.38), th.pos, fs + 1, 700);
    text(ctx, '−', E.X(bx + 0.36), E.Y(yb - 0.38), th.neg, fs + 1, 700);
    text(ctx, o.batLabel || `ε = ${tnum(c.emf)} V`, E.X(bx), E.Y(yb + 0.7), th.text, fs, 600);
    if (o.showR) {
      text(ctx, `r = ${tnum(r)} Ω`, E.X(rx), E.Y(yb + 0.7), th.text, fs, 600);
      ctx.strokeStyle = th.muted; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.strokeRect(E.X(bx - 0.6), E.Y(yb - 0.62), (rx + 0.75 - bx + 0.6) * u, 1.6 * u); ctx.setLineDash([]);
      text(ctx, 'real battery', E.X(bx - 0.55), E.Y(yb - 0.78), th.muted, fs - 2, 500, 'left');
    }
    drawNode(E, c.net, d.X0, d.Y0, c.net.w, Vtop);
    if (!c.holder) c.holder = {};
    dotsAlong(E, [[d.xr, d.yt], [d.xR, d.yt], [d.xR, yb], [d.xl, yb], [d.xl, d.yt], [d.X0, d.yt]], c.I, c.holder,
      (x, y) => Math.abs(y - yb) < 0.01 && x > bx - 0.25 && x < bx + 0.25);
    if (c.short) text(ctx, 'SHORT CIRCUIT — huge current!', v.w / 2, E.Y(d.yb) - 14, th.bad, 14, 700);
    return E;
  }
  // Canvas that keeps a circuit solved and drawn. getC() returns the circuit; o = draw options +
  // { solve?, onTap?(hit, p, E), after?(ctx, E, c, v) }.
  function circuitSim(b, canvas, getC, o) {
    let aspect = 0.5, last = null, dims = null;
    const aspFor = (w) => (dims ? clamp(Math.min(dims.H / dims.W, (dims.H * UMAX) / Math.max(w, 1)), 0.25, 1.15) : 0.5);
    const view = canvasSim(b, canvas, (w) => (aspect = aspFor(w)), (v, dt) => {
      const c = getC();
      (o.solve || solveCirc)(c);
      dims = circDims(c);
      const a = aspFor(v.w);
      if (Math.abs(a - aspect) > 0.01) { aspect = a; v.refit(); }
      bgFill(v);
      last = drawCircuit(v, c, o, dt);
      if (o.after) o.after(v.ctx, last, c, v);
    });
    if (o.onTap || o.onWire) {
      drag(b, canvas, {
        down: (p) => {
          if (!last) return false;
          if (o.onTap) {
            const h = last.hits.find((hh) => Math.hypot(hh.x - p.x, hh.y - p.y) < hh.r);
            if (h) { o.onTap(h, p, last); return false; }
          }
          if (o.onWire) {
            let best = null, bd = 16;
            for (const s of last.segs) {
              const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy || 1;
              const t = clamp(((p.x - s.x1) * dx + (p.y - s.y1) * dy) / L2, 0, 1);
              const dd = Math.hypot(s.x1 + t * dx - p.x, s.y1 + t * dy - p.y);
              if (dd < bd) { bd = dd; best = { V: s.V, x: s.x1 + t * dx, y: s.y1 + t * dy }; }
            }
            if (best) o.onWire(best, last);
          }
          return false;
        },
        hover: (p) => !!(last && o.onTap && last.hits.some((hh) => Math.hypot(hh.x - p.x, hh.y - p.y) < hh.r)),
      });
    }
    return view;
  }
  // Cycle a tapped bulb/resistor: ok → removed → shorted → ok
  function cycleState(n) {
    if (n.k === 'S') { n.state = n.state === 'open' ? 'ok' : 'open'; return; }
    n.state = n.state === 'ok' ? 'open' : n.state === 'open' ? 'short' : 'ok';
  }

  /* ---------- potential "roller coaster" landscape ---------- */
  // items: [{kind:'bat'|'R'|'B'|'wire'|'gap', dV (signed change in V going with the current), name, len}]
  function drawLandscape(ctx, rect, items, I, holder, dt, opts) {
    const th = theme();
    opts = opts || {};
    let total = 0; for (const it of items) total += it.len;
    // potential at each boundary
    const xs = [0], Vs = [0];
    let x = 0, V = 0, Vmin = 0, Vmax = 0;
    for (const it of items) { x += it.len; V += it.dV; xs.push(x); Vs.push(V); Vmin = Math.min(Vmin, V); Vmax = Math.max(Vmax, V); }
    const span = Math.max(1e-6, Vmax - Vmin);
    const X = (s) => rect.x + (s / total) * rect.w;
    const Y = (vv) => rect.y + rect.h - ((vv - Vmin) / span) * rect.h;
    const Vat = (s) => {
      for (let i = 0; i < items.length; i++) {
        if (s <= xs[i + 1] || i === items.length - 1) {
          const t = clamp((s - xs[i]) / items[i].len, 0, 1);
          if (items[i].kind === 'gap') return t < 0.5 ? Vs[i] : Vs[i + 1];
          return lerp(Vs[i], Vs[i + 1], t);
        }
      }
      return 0;
    };
    // ground fill
    ctx.fillStyle = alpha(th.accent, 0.08);
    ctx.beginPath(); ctx.moveTo(X(0), rect.y + rect.h + 6);
    for (let i = 0; i <= 200; i++) { const s = (i / 200) * total; ctx.lineTo(X(s), Y(Vat(s))); }
    ctx.lineTo(X(total), rect.y + rect.h + 6); ctx.closePath(); ctx.fill();
    // track segments
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const col = it.kind === 'bat' ? th.good : it.kind === 'wire' ? th.muted : it.kind === 'gap' ? th.bad : th.pos;
      ctx.strokeStyle = col; ctx.lineWidth = 4;
      if (it.kind === 'gap') ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(X(xs[i]), Y(Vs[i]));
      if (it.kind === 'gap') { ctx.lineTo(X((xs[i] + xs[i + 1]) / 2), Y(Vs[i])); ctx.lineTo(X((xs[i] + xs[i + 1]) / 2), Y(Vs[i + 1])); }
      ctx.lineTo(X(xs[i + 1]), Y(Vs[i + 1])); ctx.stroke(); ctx.setLineDash([]);
      if (it.name) {
        const mx = X((xs[i] + xs[i + 1]) / 2), my = Math.min(Y(Vs[i]), Y(Vs[i + 1]));
        text(ctx, it.name, mx, my - 12, col === th.muted ? th.muted : col, 12, 700);
        if (it.kind !== 'wire' && it.kind !== 'gap') text(ctx, (it.dV >= 0 ? '+' : '−') + tnum(Math.abs(it.dV)) + ' V', mx, my - 26, th.text, 11, 500);
        if (it.kind === 'gap') text(ctx, 'open: no path', mx, my - 26, th.bad, 11, 600);
      }
      if (it.kind === 'bat') { // lift-hill chain
        ctx.strokeStyle = alpha(th.good, 0.6); ctx.lineWidth = 1.5;
        const n = 6;
        for (let k = 1; k < n; k++) {
          const s = xs[i] + (k / n) * it.len;
          ctx.beginPath(); ctx.moveTo(X(s), Y(Vat(s)) + 4); ctx.lineTo(X(s), Y(Vat(s)) + 11); ctx.stroke();
        }
      }
    }
    // axis
    ctx.strokeStyle = th.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rect.x, rect.y - 4); ctx.lineTo(rect.x, rect.y + rect.h + 6); ctx.lineTo(rect.x + rect.w, rect.y + rect.h + 6); ctx.stroke();
    text(ctx, '↑ potential (height)', rect.x + 4, rect.y + rect.h + 18, th.muted, 11, 600, 'left');
    text(ctx, opts.xl || 'position around the circuit → (back to start)', rect.x + rect.w, rect.y + rect.h + 18, th.muted, 11, 500, 'right');
    // charges riding the track
    const nBalls = opts.balls || 14;
    holder.ph = ((holder.ph || 0) + clamp((opts.speedK || 0.25) * I, -3, 3) * dt * total) % total;
    if (holder.ph < 0) holder.ph += total;
    for (let k = 0; k < nBalls; k++) {
      const s = (holder.ph + (k * total) / nBalls) % total;
      ctx.fillStyle = th.pos;
      ctx.beginPath(); ctx.arc(X(s), Y(Vat(s)) - 6, 5.5, 0, 2 * Math.PI); ctx.fill();
      text(ctx, '+', X(s), Y(Vat(s)) - 6, th.surface, 9, 700);
    }
    return { X, Y };
  }
  // Landscape item list from a series tree (current flows in order). Wires in between.
  function seriesItems(c) {
    const items = [{ kind: 'bat', dV: c.emf, name: 'battery', len: 1 }];
    if (c.r) items.push({ kind: 'R', dV: -c.I * c.r, name: 'r', len: 0.6 });
    items.push({ kind: 'wire', dV: 0, name: 'wire', len: 0.5 });
    for (const n of leaves(c.net)) {
      if (n.k === 'S') {
        if (n.state === 'open') items.push({ kind: 'gap', dV: -n.V, name: n.name, len: 0.6 });
        else items.push({ kind: 'wire', dV: 0, name: '', len: 0.3 });
      } else items.push({ kind: n.k === 'B' ? 'B' : 'R', dV: -n.V, name: n.name, len: 1.1 });
      items.push({ kind: 'wire', dV: 0, name: '', len: 0.4 });
    }
    return items;
  }

  /* ===================================================================== */
  /* 1. Current                                                             */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 1, id: 'u2-current',
    title: 'From still charges to moving charges: current',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">In electrostatics, charges sat still. A circuit is what happens when we stop them from settling down: we keep a potential difference across a conductor, so there's always a field pushing charges along. That steady flow of charge is called <b>current</b>.</p>

<h2>Why the charges start moving</h2>
<p>Remember the rule from electrostatics: inside a conductor <em>at equilibrium</em>, the field is zero. Charges slide around until they've cancelled any field inside, then stop. That's why a charged metal sphere has \\(E = 0\\) inside.</p>
<p>Now connect the two ends of a metal wire to a battery. The battery holds one end at a higher potential than the other — and it <em>keeps</em> holding it there. The charges can never finish rearranging, so a field stays inside the wire, pointing from high potential to low potential. A field means a force on every free charge, so the charges keep moving.</p>
<div class="callout idea"><div class="title">Big idea</div>Potential difference across a conductor → electric field inside it → force on free charges → current. No potential difference, no current.</div>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${checkbox('on', 'Connect the battery', false)}
    ${slider('V', 'Battery voltage', 1, 12, 0.5, 6)}
  </div>
  <div class="sim-readout">
    <span>Net electrons crossing the dashed line per second: <b data-o="rate"></b></span>
  </div>
  <div class="sim-caption">Blue dots are free electrons in a metal; faint + dots are the fixed metal ions. With no battery, electrons zoom around randomly (very fast!) but just as many cross the dashed line each way, so the net flow is zero. Connect the battery: the field nudges every electron to the left between collisions. The highlighted electron's path still zig-zags — but it now <em>drifts</em>. Raise the voltage and the drift (and the current) increases.</div>
</div>

<h2>Measuring current</h2>
<p>Current is how much charge passes a point each second — like counting cars passing under a bridge per minute.</p>
<div class="eq">\\[ I = \\frac{\\Delta Q}{\\Delta t} \\]
<div class="where">where \\(I\\) = current in <b>amperes</b> (A), \\(\\Delta Q\\) = charge passing a point (C), \\(\\Delta t\\) = time (s). So 1 A = 1 C/s.</div></div>
<p><b>Example.</b> A phone charger delivers 2 A for one hour (3600 s). Charge delivered: \\(\\Delta Q = I\\Delta t = 2 \\times 3600 = 7200\\ \\text{C}\\). Since each electron carries \\(1.6\\times10^{-19}\\) C, that's \\(7200 / 1.6\\times10^{-19} = 4.5\\times10^{22}\\) electrons.</p>

<h2>Electrons go one way, "current" goes the other</h2>
<p>In metal wires, the charges that actually move are electrons, which are negative. They're pushed <em>opposite</em> to the field, from low potential toward high potential. But long before anyone knew about electrons, physicists agreed to draw current as the direction <b>positive</b> charge would flow: from high potential (+ terminal) to low potential (− terminal). This is <b>conventional current</b>, and it's what every circuit diagram and every AP question uses.</p>
<p>For energy and circuit analysis it doesn't matter: negative charge moving left has exactly the same effect as positive charge moving right.</p>

<h2>Slow drift, instant light</h2>
<p>Electrons in a copper wire carrying 1 A drift at only about 0.07 mm/s — slower than a snail. Yet the bulb lights the instant you flip the switch. Why? The wire is <em>already full</em> of free electrons. Closing the switch sets up the field along the whole wire almost at the speed of light, so electrons everywhere start drifting at once, including the ones already inside the bulb.</p>

<div class="callout analogy"><div class="title">Analogy</div>A garden hose that's already full of water: turn on the tap and water comes out the far end immediately, even though the water entering at the tap takes a while to get there. The hose is the wire; the water is the sea of electrons.</div>

<div class="callout mistake"><div class="title">Common mistake</div>“A battery stores charge and sends it out into the wire.” No — the charges were already in the wire. The battery provides <em>energy</em> (a potential difference) that pushes the existing charges around. Also: current is not “used up” by a bulb. The same amount of charge per second leaves a bulb as enters it.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Always use conventional current (out of the + terminal, through the circuit, into the − terminal) unless a question explicitly asks about electrons. Know \\(I = \\Delta Q/\\Delta t\\) and the charge of an electron, \\(e = 1.6\\times10^{-19}\\) C.</div>

<div class="check" data-answer="1"><div class="q">A wire carries 0.5 A. How much charge passes a point in 1 minute?</div>
<div class="opts"><button>0.5 C</button><button>30 C</button><button>120 C</button><button>0.0083 C</button></div>
<div class="why">\\(\\Delta Q = I\\Delta t = 0.5 \\times 60 = 30\\ \\text{C}\\). Remember to convert minutes to seconds.</div></div>

<div class="check" data-answer="2"><div class="q">In a wire, electrons are drifting to the left. Which way is the conventional current?</div>
<div class="opts"><button>To the left</button><button>There is no current because electrons are negative</button><button>To the right</button><button>Up, perpendicular to the wire</button></div>
<div class="why">Negative charge moving left is equivalent to positive charge moving right. Conventional current points to the right.</div></div>
`;
      const canvas = el.querySelector('canvas');
      const cb = ctl(el, 'on'), sV = ctl(el, 'V');
      const H = 0.34, vth = 0.42, tau = 0.07;
      const es = [];
      const rnd = () => { const a = Math.random() * 2 * Math.PI, s = vth * (0.5 + Math.random()); return [s * Math.cos(a), s * Math.sin(a)]; };
      for (let i = 0; i < 70; i++) { const v = rnd(); es.push({ x: Math.random(), y: 0.02 + Math.random() * (H - 0.04), vx: v[0], vy: v[1] }); }
      const ions = [];
      for (let i = 0; i < 16; i++) for (let j = 0; j < 3; j++) ions.push({ x: (i + 0.5) / 16, y: ((j + 0.5) / 3) * H });
      let trail = [], rate = 0, flash = [];
      const sync = () => out(el, 'V', sV.value + ' V');
      sync(); on(b, sV, 'input', sync);
      canvasSim(b, canvas, (w) => (w < 520 ? 0.62 : 0.42), (v, dt) => {
        const th = theme(), ctx = v.ctx;
        const a = cb.checked ? +sV.value * 0.29 : 0;
        let count = 0;
        for (let i = 0; i < es.length; i++) {
          const e = es[i];
          if (Math.random() < dt / tau) { const nv = rnd(); e.vx = nv[0]; e.vy = nv[1]; if (i === 0) flash.push({ x: e.x, y: e.y, t: 0 }); }
          e.vx -= a * dt;
          const ox = e.x;
          e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.y < 0.02) { e.y = 0.02; e.vy = Math.abs(e.vy); }
          if (e.y > H - 0.02) { e.y = H - 0.02; e.vy = -Math.abs(e.vy); }
          if (ox >= 0.5 && e.x < 0.5) count++;
          if (ox < 0.5 && e.x >= 0.5) count--;
          let wrapped = false;
          if (e.x < 0) { e.x += 1; wrapped = true; }
          if (e.x >= 1) { e.x -= 1; wrapped = true; }
          if (i === 0) { if (wrapped) trail.push(null); trail.push([e.x, e.y]); if (trail.length > 160) trail.shift(); }
        }
        if (dt > 0) rate += (count / dt - rate) * (1 - Math.exp(-dt / 1.5));
        bgFill(v);
        const x0 = 46, x1 = v.w - 46, yTop = v.h * 0.3, hh = v.h * 0.4;
        const X = (x) => x0 + x * (x1 - x0), Y = (y) => yTop + (y / H) * hh;
        // battery terminals
        ctx.fillStyle = cb.checked ? th.pos : th.border; ctx.fillRect(8, yTop - 6, 30, hh + 12);
        ctx.fillStyle = cb.checked ? th.neg : th.border; ctx.fillRect(v.w - 38, yTop - 6, 30, hh + 12);
        text(ctx, '+', 23, yTop + hh / 2, th.surface, 18, 700);
        text(ctx, '−', v.w - 23, yTop + hh / 2, th.surface, 18, 700);
        ctx.fillStyle = th.surface; ctx.fillRect(x0, yTop, x1 - x0, hh);
        ctx.strokeStyle = th.text; ctx.lineWidth = 1.5; ctx.strokeRect(x0, yTop, x1 - x0, hh);
        ctx.fillStyle = alpha(th.pos, 0.35);
        for (const p of ions) { ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 6, 0, 7); ctx.fill(); }
        ctx.strokeStyle = th.muted; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(0.5), yTop - 4); ctx.lineTo(X(0.5), yTop + hh + 4); ctx.stroke(); ctx.setLineDash([]);
        // trail
        ctx.strokeStyle = alpha(th.accent, 0.7); ctx.lineWidth = 1.5; ctx.beginPath();
        let pen = false;
        for (const p of trail) { if (!p) { pen = false; continue; } if (!pen) { ctx.moveTo(X(p[0]), Y(p[1])); pen = true; } else ctx.lineTo(X(p[0]), Y(p[1])); }
        ctx.stroke();
        flash = flash.filter((f) => (f.t += dt) < 0.3);
        for (const f of flash) { ctx.strokeStyle = alpha(th.warn, 1 - f.t / 0.3); ctx.beginPath(); ctx.arc(X(f.x), Y(f.y), 6 + 20 * f.t, 0, 7); ctx.stroke(); }
        ctx.fillStyle = th.neg;
        for (const e of es) { ctx.beginPath(); ctx.arc(X(e.x), Y(e.y), 3.2, 0, 7); ctx.fill(); }
        ctx.strokeStyle = th.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(es[0].x), Y(es[0].y), 6, 0, 7); ctx.stroke();
        if (cb.checked) {
          const yA = yTop - 18;
          for (let k = 0; k < 4; k++) { const xa = X(0.1 + k * 0.24); arrow(ctx, xa, yA, xa + 40, yA, th.muted, 1.5, 7); }
          text(ctx, 'field E (high V → low V)', X(0.5), yA - 13, th.muted, 11, 600);
          const yB = yTop + hh + 22;
          arrow(ctx, X(0.3), yB, X(0.45), yB, th.warn, 3, 10);
          text(ctx, 'conventional current I', X(0.375), yB + 15, th.warn, 11, 700);
          arrow(ctx, X(0.7), yB, X(0.55), yB, th.neg, 3, 10);
          text(ctx, 'electron drift', X(0.625), yB + 15, th.neg, 11, 700);
        } else text(ctx, 'no battery: random motion only, no net flow', v.w / 2, yTop + hh + 22, th.muted, 12, 600);
        out(el, 'rate', num(Math.round(rate * 10) / 10, 3) + (cb.checked ? ' (to the left → current to the right)' : ' (≈ 0)'));
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 2. Battery and emf                                                     */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 2, id: 'u2-emf',
    title: 'The battery: a lift hill for charge (emf)',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">In electrostatics you pictured potential as <em>height</em>: positive charge "rolls downhill" from high potential to low potential, the way a roller coaster car rolls down a slope. A circuit is a roller coaster track that loops back on itself — and the battery is the lift hill that hauls the cars back to the top.</p>

<h2>Charges rolling downhill</h2>
<p>When a positive charge \\(q\\) moves through a potential difference \\(\\Delta V\\), its electric potential energy changes by \\(\\Delta U = q\\Delta V\\). Going from high to low potential it <em>loses</em> potential energy — and in a resistor or bulb that energy becomes thermal energy and light.</p>
<p>But a roller coaster can't keep rolling downhill forever. Something has to lift each car back up. In a circuit that's the battery.</p>

<h2>The battery's job: emf</h2>
<p>Inside a battery, chemical reactions push positive charge from the − terminal to the + terminal, <em>against</em> the electric force — uphill. The work done per coulomb lifted is called the <b>emf</b> (\\(\\varepsilon\\)), measured in volts:</p>
<div class="eq">\\[ \\varepsilon = \\frac{W_{\\text{battery}}}{q} \\]
<div class="where">where \\(\\varepsilon\\) = emf (V, which is J/C), \\(W_{\\text{battery}}\\) = work the battery does on the charge (J), \\(q\\) = charge moved through the battery (C). A 9 V battery gives every coulomb that passes through it 9 J of energy.</div></div>
<p>"emf" originally stood for "electromotive force," but it's not a force — it's energy per charge, a potential difference. For an ideal battery, the potential difference between its terminals equals its emf.</p>

<div class="sim">
  <canvas data-c="sch"></canvas>
  <canvas data-c="land"></canvas>
  <div class="sim-controls">
    ${slider('emf', 'Battery emf', 1.5, 12, 0.5, 9)}
    ${slider('r1', 'Bulb', 1, 20, 1, 6)}
    ${slider('r2', 'Resistor', 1, 20, 1, 3)}
    ${checkbox('sw', 'Switch closed', true)}
  </div>
  <div class="sim-readout"><span>Current: <b data-o="I"></b></span><span>Drop across bulb: <b data-o="v1"></b></span><span>Drop across resistor: <b data-o="v2"></b></span></div>
  <div class="sim-caption">Top: the circuit, with wires coloured by potential (red = high, blue = low). Bottom: the same circuit as a roller coaster — height is potential. The battery (green) lifts each + charge up by ε; the bulb and resistor are downhill slopes; wires are flat (no drop). Open the switch (here or tap it in the diagram): the track has a gap, nothing flows, and the whole ε appears across the gap.</div>
</div>

<h2>You need a complete loop</h2>
<p>Charge only flows if there's a complete path from the + terminal, through the circuit, back to the − terminal. That's a <b>closed circuit</b>. Any break — an open switch, a burnt-out filament, a loose wire — makes it an <b>open circuit</b> and the current everywhere in that loop drops to zero. Like a roller coaster with a missing section of track: no car can complete the loop, so none of them move.</p>
<p>Notice what the landscape shows: the charges end up back at the bottom, where they started. Every bit of height the battery added was lost in the bulb and resistor. That's energy conservation, and it'll become Kirchhoff's loop rule later.</p>

<div class="callout analogy"><div class="title">Analogy</div>The battery is a pump in a closed loop of water pipes, lifting water up to a tank; the bulb is a water wheel the water falls through on the way back down. The pump doesn't create water — it gives the water that's already there energy.</div>

<div class="callout mistake"><div class="title">Common mistake</div>“A battery supplies a fixed current.” No — a battery supplies a (roughly) fixed <em>potential difference</em>. How much current flows depends on what you connect to it. Try it: change the resistor and the current changes, but the battery's lift stays the same.</div>

<div class="check" data-answer="2"><div class="q">A 12 V battery moves 5 C of charge from its − terminal to its + terminal. How much work does it do on the charge?</div>
<div class="opts"><button>2.4 J</button><button>17 J</button><button>60 J</button><button>0.42 J</button></div>
<div class="why">\\(W = q\\varepsilon = 5 \\times 12 = 60\\ \\text{J}\\).</div></div>

<div class="check" data-answer="0"><div class="q">In the landscape, the switch is open. What is the potential difference across the open switch?</div>
<div class="opts"><button>Equal to the battery's emf</button><button>Zero, because no current flows</button><button>Half the emf</button><button>It depends on the bulb's resistance</button></div>
<div class="why">With no current, there's no drop across the bulb or resistor (\\(\\Delta V = IR = 0\\)), so the full emf appears across the gap. That's why you can get a shock from the two contacts of an open switch.</div></div>
`;
      const s = { emf: ctl(el, 'emf'), r1: ctl(el, 'r1'), r2: ctl(el, 'r2'), sw: ctl(el, 'sw') };
      const bulb = Bulb('bulb', 6), res = Res('resistor', 3), sw = Sw('switch', true);
      const circ = { emf: 9, net: ser(bulb, res, sw) };
      function sync() {
        circ.emf = +s.emf.value; bulb.R = +s.r1.value; res.R = +s.r2.value; sw.state = s.sw.checked ? 'ok' : 'open';
        out(el, 'emf', circ.emf + ' V'); out(el, 'r1', bulb.R + ' Ω'); out(el, 'r2', res.R + ' Ω');
      }
      sync();
      Object.values(s).forEach((x) => on(b, x, 'input', sync));
      circuitSim(b, el.querySelector('[data-c="sch"]'), () => circ, {
        colorV: true, dots: true, labels: 'value', Pref: 12, dotK: 0.6,
        onTap: (h) => { if (h.n.k === 'S') { s.sw.checked = !s.sw.checked; sync(); } },
      });
      const lh = {};
      canvasSim(b, el.querySelector('[data-c="land"]'), (w) => (w < 520 ? 0.6 : 0.36), (v, dt) => {
        solveCirc(circ);
        bgFill(v);
        drawLandscape(v.ctx, { x: 30, y: 46, w: v.w - 50, h: v.h - 90 }, seriesItems(circ), circ.I, lh, dt, { speedK: 0.08 });
        out(el, 'I', num(circ.I) + ' A');
        out(el, 'v1', num(bulb.V) + ' V'); out(el, 'v2', num(res.V) + ' V');
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 3. Resistance & resistivity                                            */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 3, id: 'u2-resistance',
    title: 'Resistance: why wires fight back',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">In the first lesson the drifting electrons kept bumping into the metal's ions. Every collision steals some of the energy the field gave them and turns it into jiggling of the ions — heat. That "friction" for current is <b>resistance</b>.</p>

<h2>What resistance means</h2>
<p>Resistance \\(R\\) tells you how much potential difference you need to push a given current through something:</p>
<div class="eq">\\[ R = \\frac{\\Delta V}{I} \\]
<div class="where">where \\(R\\) = resistance in <b>ohms</b> (Ω), \\(\\Delta V\\) = potential difference across the object (V), \\(I\\) = current through it (A). 1 Ω = 1 V/A: a 1 Ω resistor needs 1 V to push 1 A through it.</div></div>
<p>Big \\(R\\) = hard to push current through (a narrow, crowded hallway). Small \\(R\\) = easy (a wide, empty hallway).</p>

<h2>What sets the resistance of a wire</h2>
<p>Think about the electrons' trip through the wire:</p>
<ul>
<li><b>Longer wire</b> → more ions to collide with along the way. Double the length, double the resistance: \\(R \\propto L\\).</li>
<li><b>Thicker wire</b> → more lanes for charge to flow side by side. Double the cross-sectional area, half the resistance: \\(R \\propto 1/A\\).</li>
<li><b>Material</b> → some materials have more free electrons or collide them more often. This is captured by the <b>resistivity</b> \\(\\rho\\).</li>
</ul>
<div class="eq">\\[ R = \\frac{\\rho L}{A} \\]
<div class="where">where \\(\\rho\\) = resistivity of the material (Ω·m), \\(L\\) = length (m), \\(A\\) = cross-sectional area (m²). For a round wire of radius \\(r\\), \\(A = \\pi r^2\\) — so doubling the radius makes \\(A\\) four times bigger.</div></div>
<p><b>Example.</b> 10 m of copper wire (\\(\\rho = 1.7\\times10^{-8}\\ \\Omega\\cdot\\text{m}\\)) with radius 0.5 mm: \\(A = \\pi(0.5\\times10^{-3})^2 = 7.9\\times10^{-7}\\ \\text{m}^2\\), so \\(R = (1.7\\times10^{-8})(10)/(7.9\\times10^{-7}) \\approx 0.22\\ \\Omega\\). Tiny — that's why we usually treat connecting wires as having zero resistance.</p>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${select('mat', 'Material', ['Copper', 'Aluminum', 'Iron', 'Nichrome (heater wire)'])}
    ${slider('L', 'Length', 0.5, 5, 0.1, 2)}
    ${slider('d', 'Diameter', 0.2, 2, 0.05, 1)}
  </div>
  <div class="sim-readout"><span>ρ = <b data-o="rho"></b></span><span>A = <b data-o="A"></b></span><span>R = ρL/A = <b data-o="R"></b></span><span>Compared with the first wire: <b data-o="ratio"></b></span></div>
  <div class="sim-caption">Blue dots are free electrons drifting through the wire with the same battery voltage across it. Longer wire → the same voltage is spread over more length, so the field is weaker and they drift more slowly. Thicker wire → more electrons flowing side by side. Higher resistivity → more collisions, slower drift. (Drift speeds hugely exaggerated so you can see them.)</div>
</div>

<div class="callout analogy"><div class="title">Analogy</div>A crowd leaving a stadium through a hallway. A longer hallway takes longer (more length, more resistance). A wider hallway lets more people through at once (more area, less resistance). A hallway full of pillars is like a high-resistivity material.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Doubling the <em>diameter</em> (or radius) does not halve the resistance — it quarters it, because area goes as radius squared. And resistivity \\(\\rho\\) is a property of the <em>material</em>; resistance \\(R\\) is a property of a particular <em>object</em> (material + shape).</div>

<div class="callout ap"><div class="title">On the AP exam</div>Ratio questions are classic: “Wire Y has twice the length and twice the diameter of wire X, same material. Compare resistances.” \\(R_Y = \\rho(2L)/(4A) = \\tfrac12 R_X\\). Set up the ratio rather than plugging numbers.</div>

<div class="check" data-answer="3"><div class="q">A wire has resistance R. It is replaced by a wire of the same material with half the length and half the radius. The new resistance is…</div>
<div class="opts"><button>R/4</button><button>R/2</button><button>R</button><button>2R</button></div>
<div class="why">Half the length → ×½. Half the radius → area is ¼ → ×4. Overall \\(\\tfrac12\\times4 = 2\\): the new resistance is 2R.</div></div>
`;
      const MATS = [['Copper', 1.7e-8], ['Aluminum', 2.8e-8], ['Iron', 1.0e-7], ['Nichrome', 1.1e-6]];
      const sm = ctl(el, 'mat'), sL = ctl(el, 'L'), sd = ctl(el, 'd');
      const R0 = (1.7e-8 * 2) / (Math.PI * Math.pow(0.5e-3, 2));
      let parts = [];
      for (let i = 0; i < 160; i++) parts.push({ s: Math.random(), q: Math.random() * 2 - 1 });
      function calc() {
        const rho = MATS[+sm.value][1], L = +sL.value, d = +sd.value * 1e-3, A = (Math.PI * d * d) / 4;
        return { rho, L, d, A, R: (rho * L) / A };
      }
      function sync() {
        const c = calc();
        out(el, 'L', c.L.toFixed(1) + ' m'); out(el, 'd', (+sd.value).toFixed(2) + ' mm');
        out(el, 'rho', num(c.rho) + ' Ω·m'); out(el, 'A', num(c.A) + ' m²');
        out(el, 'R', num(c.R) + ' Ω'); out(el, 'ratio', '× ' + num(c.R / R0));
      }
      sync();
      [sm, sL, sd].forEach((x) => on(b, x, 'input', sync));
      canvasSim(b, el.querySelector('canvas'), (w) => (w < 520 ? 0.6 : 0.38), (v, dt) => {
        const th = theme(), ctx = v.ctx, c = calc();
        bgFill(v);
        const x0 = 50, maxL = v.w - 100, len = (c.L / 5) * maxL, cy = v.h / 2;
        const rad = 6 + (+sd.value / 2) * Math.min(48, v.h * 0.18);
        // terminals
        ctx.fillStyle = th.pos; ctx.fillRect(x0 - 26, cy - 30, 18, 60); text(ctx, '+', x0 - 17, cy, th.surface, 15, 700);
        ctx.fillStyle = th.neg; ctx.fillRect(x0 + len + 8, cy - 30, 18, 60); text(ctx, '−', x0 + len + 17, cy, th.surface, 15, 700);
        ctx.strokeStyle = th.muted; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0 - 8, cy); ctx.lineTo(x0, cy); ctx.moveTo(x0 + len, cy); ctx.lineTo(x0 + len + 8, cy); ctx.stroke();
        // cylinder body
        const g = ctx.createLinearGradient(0, cy - rad, 0, cy + rad);
        g.addColorStop(0, alpha(th.warn, 0.25)); g.addColorStop(0.5, alpha(th.warn, 0.5)); g.addColorStop(1, alpha(th.warn, 0.2));
        ctx.fillStyle = g; ctx.fillRect(x0, cy - rad, len, 2 * rad);
        ctx.strokeStyle = th.text; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0, cy - rad); ctx.lineTo(x0 + len, cy - rad); ctx.moveTo(x0, cy + rad); ctx.lineTo(x0 + len, cy + rad); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x0 + len, cy, rad * 0.3, rad, 0, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x0, cy, rad * 0.3, rad, 0, Math.PI / 2, (3 * Math.PI) / 2); ctx.stroke();
        // electrons: density fixed, so count ∝ L·d²
        const count = clamp(Math.round(18 * (c.L / 2) * Math.pow(+sd.value, 2)), 3, 160);
        const drift = (0.25 / c.L) * Math.pow(1.7e-8 / c.rho, 0.4); // fraction of 5 m per second (exaggerated)
        ctx.fillStyle = th.neg;
        for (let i = 0; i < count; i++) {
          const p = parts[i];
          p.s -= (drift * 5 / c.L) * dt * 0.6;
          if (p.s < 0) { p.s += 1; p.q = Math.random() * 2 - 1; }
          const jit = (Math.random() - 0.5) * 0.04 * (c.rho / 1.7e-8 > 10 ? 1 : 0.3);
          ctx.beginPath(); ctx.arc(x0 + (p.s + jit) * len, cy + p.q * (rad - 3), 2.6, 0, 7); ctx.fill();
        }
        text(ctx, `L = ${c.L.toFixed(1)} m`, x0 + len / 2, cy + rad + 16, th.text, 12, 600);
        text(ctx, `${MATS[+sm.value][0]}, d = ${(+sd.value).toFixed(2)} mm`, x0 + len / 2, cy - rad - 14, th.text, 12, 600);
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 4. Ohm's law                                                           */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 4, id: 'u2-ohm',
    title: "Ohm's law and I–V graphs",
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">For many materials, if you double the push (voltage), you double the flow (current). The ratio \\(\\Delta V/I\\) stays the same no matter how hard you push. That's Ohm's law — and it's true for resistors but not for everything.</p>

<div class="eq">\\[ \\Delta V = IR \\qquad\\Longleftrightarrow\\qquad I = \\frac{\\Delta V}{R} \\]
<div class="where">where \\(\\Delta V\\) = potential difference across the device (V), \\(I\\) = current through it (A), \\(R\\) = its resistance (Ω). Often written just \\(V = IR\\).</div></div>
<p>Read it three ways. <b>Fixed R:</b> more voltage → proportionally more current. <b>Fixed V</b> (like a battery): bigger resistance → less current. <b>Fixed I:</b> a bigger resistance has a bigger voltage drop across it — a steeper downhill on the roller coaster.</p>
<p><b>Example.</b> A 12 V battery across a 4 Ω resistor: \\(I = 12/4 = 3\\ \\text{A}\\). Swap in an 8 Ω resistor: \\(I = 1.5\\ \\text{A}\\).</p>

<h2>Ohmic vs. non-ohmic</h2>
<p>A device is <b>ohmic</b> if its resistance stays constant as you change the voltage. Its current-vs-voltage graph is a straight line through the origin. A light bulb filament is <b>non-ohmic</b>: as more current flows it gets white-hot, its ions vibrate harder, electrons collide more often, so its resistance <em>rises</em>. Its I–V graph curves over.</p>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${select('dev', 'Device', ['10 Ω resistor', '20 Ω resistor', 'Light bulb (filament)'])}
    ${slider('V', 'Voltage', 0, 12, 0.1, 6)}
  </div>
  <div class="sim-readout"><span>ΔV = <b data-o="v"></b></span><span>I = <b data-o="i"></b></span><span>R = ΔV/I = <b data-o="r"></b></span></div>
  <div class="sim-caption">Drag on the graph or use the slider. For the resistors, R stays the same everywhere on the line. For the bulb, R = ΔV/I keeps growing as the voltage rises — the curve bends toward the V axis.</div>
</div>

<h2>Reading I–V graphs</h2>
<p>On a graph of \\(I\\) (vertical) versus \\(\\Delta V\\) (horizontal), the slope is \\(I/\\Delta V = 1/R\\). So a <b>steeper</b> line means <b>less</b> resistance. If the axes are swapped (\\(\\Delta V\\) vertical, \\(I\\) horizontal), the slope is \\(R\\) itself. Always check which is which!</p>

<div class="callout analogy"><div class="title">Analogy</div>Pushing a shopping cart through mud. Ohmic mud: push twice as hard, cart goes twice as fast. Non-ohmic: the mud gets thicker the faster you go, so doubling the push gives less than double the speed.</div>

<div class="callout mistake"><div class="title">Common mistake</div>“\\(R = V/I\\), so if I raise the voltage, the resistance goes up.” For an ohmic resistor, R is fixed by its material and shape; raising V raises I in proportion, and the ratio stays the same. The formula <em>measures</em> R; it doesn't control it.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Lab-style questions give a data table of V and I and ask you to linearize and find R from a slope (best-fit line, not a single point). Know that slope of I vs V is 1/R, and that a curved graph means non-ohmic.</div>

<div class="check" data-answer="1"><div class="q">On an I (vertical) vs ΔV (horizontal) graph, resistor X's line is steeper than resistor Y's. Which has the greater resistance?</div>
<div class="opts"><button>X</button><button>Y</button><button>They're equal</button><button>Can't tell</button></div>
<div class="why">Slope = 1/R. Steeper slope ⇒ larger 1/R ⇒ smaller R. So Y has more resistance.</div></div>
`;
      const sd = ctl(el, 'dev'), sV = ctl(el, 'V');
      const devs = [(V) => V / 10, (V) => V / 20, (V) => 0.5 * Math.pow(V / 12, 0.6)];
      const names = ['10 Ω', '20 Ω', 'bulb'];
      function sync() {
        const V = +sV.value, I = devs[+sd.value](V);
        out(el, 'V', V.toFixed(1) + ' V'); out(el, 'v', V.toFixed(1) + ' V'); out(el, 'i', num(I) + ' A');
        out(el, 'r', V > 0 ? num(V / I) + ' Ω' : '—');
      }
      sync();
      [sd, sV].forEach((x) => on(b, x, 'input', sync));
      let ax = null;
      const cv = el.querySelector('canvas');
      drag(b, cv, {
        down: (p) => { if (!ax) return false; setV(p); },
        move: (p) => setV(p),
      });
      function setV(p) { sV.value = clamp(ax.inv(p.x), 0, 12).toFixed(1); sync(); }
      canvasSim(b, cv, (w) => (w < 520 ? 0.75 : 0.5), (v) => {
        const th = theme(), ctx = v.ctx;
        bgFill(v);
        const r = { x: 54, y: 16, w: v.w - 70, h: v.h - 52 };
        const a = axes(ctx, r, [0, 12], [0, 1.3], { xt: 2, yt: 0.25, xl: 'ΔV (V)', yl: 'I (A)', yf: (y) => y.toFixed(2) });
        ax = { inv: (px) => ((px - r.x) / r.w) * 12 };
        devs.forEach((f, i) => {
          const sel = i === +sd.value;
          ctx.strokeStyle = sel ? th.accent : alpha(th.muted, 0.6); ctx.lineWidth = sel ? 3 : 1.5;
          ctx.beginPath();
          for (let k = 0; k <= 100; k++) { const V = (k / 100) * 12; const y = a.Y(Math.min(f(V), 1.3)); if (k === 0) ctx.moveTo(a.X(V), y); else ctx.lineTo(a.X(V), y); }
          ctx.stroke();
          text(ctx, names[i], a.X(12) - 4, a.Y(Math.min(f(12), 1.3)) - 8, sel ? th.accent : th.muted, 11, 600, 'right');
        });
        const V = +sV.value, I = devs[+sd.value](V);
        ctx.strokeStyle = th.warn; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a.X(V), a.Y(0)); ctx.lineTo(a.X(V), a.Y(I)); ctx.lineTo(a.X(0), a.Y(I)); ctx.stroke(); ctx.setLineDash([]);
        if (V > 0) { ctx.strokeStyle = alpha(th.warn, 0.7); ctx.beginPath(); ctx.moveTo(a.X(0), a.Y(0)); ctx.lineTo(a.X(V), a.Y(I)); ctx.stroke(); }
        ctx.fillStyle = th.warn; ctx.beginPath(); ctx.arc(a.X(V), a.Y(I), 6, 0, 7); ctx.fill();
        if (V > 0) text(ctx, `R = ΔV/I = ${tnum(V / I)} Ω`, a.X(V) + 8, a.Y(I) - 14, th.text, 12, 600, a.X(V) > r.x + r.w * 0.7 ? 'right' : 'left');
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 5. Power and energy                                                    */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 5, id: 'u2-power',
    title: 'Power and energy: what makes a bulb bright',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">A bulb's brightness is about how fast it turns electrical energy into light and heat. That rate is <b>power</b>. Build it from two things you already know: voltage is energy per coulomb, and current is coulombs per second.</p>

<h2>Building the formula</h2>
<p>Every coulomb that falls through a potential difference \\(\\Delta V\\) gives up \\(\\Delta V\\) joules. And \\(I\\) coulombs pass through each second. So the energy given up per second is</p>
<div class="eq">\\[ P = I\\,\\Delta V \\qquad\\left(\\frac{\\text{J}}{\\text{s}} = \\frac{\\text{C}}{\\text{s}}\\cdot\\frac{\\text{J}}{\\text{C}}\\right) \\]
<div class="where">where \\(P\\) = power in <b>watts</b> (W = J/s), \\(I\\) = current through the device (A), \\(\\Delta V\\) = potential difference across it (V).</div></div>
<p>Combine with Ohm's law (\\(\\Delta V = IR\\)) to get two more versions — all three give the same answer for a resistor:</p>
<div class="eq">\\[ P = I\\Delta V = I^2R = \\frac{(\\Delta V)^2}{R} \\]
<div class="where">Use \\(I^2R\\) when you know the current (handy in series, where current is shared). Use \\((\\Delta V)^2/R\\) when you know the voltage (handy in parallel, where voltage is shared).</div></div>
<p><b>Example.</b> A 6 Ω bulb on a 12 V battery: \\(I = 2\\) A, \\(P = 2\\times12 = 24\\) W. Check: \\(I^2R = 4\\times6 = 24\\) W, \\(V^2/R = 144/6 = 24\\) W. ✓</p>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${slider('emf', 'Battery', 0, 12, 0.5, 12)}
    ${slider('R', 'Bulb resistance', 2, 24, 1, 6)}
    ${slider('t', 'Hours on', 0, 10, 0.5, 2)}
  </div>
  <div class="sim-readout"><span>I = <b data-o="I"></b></span><span>P = IΔV = <b data-o="P"></b></span><span>Energy = P·t = <b data-o="E"></b></span></div>
  <div class="sim-caption">The glow is proportional to power. Notice: at fixed voltage, a <em>smaller</em> resistance gives a <em>brighter</em> bulb (P = V²/R) — more current flows.</div>
</div>

<h2>Energy and the kilowatt-hour</h2>
<p>Power is a rate. Total energy is power × time:</p>
<div class="eq">\\[ E = P\\,\\Delta t \\]
<div class="where">where \\(E\\) = energy (J), \\(P\\) = power (W), \\(\\Delta t\\) = time (s). Electric companies bill in <b>kilowatt-hours</b>: 1 kWh = 1000 W × 3600 s = \\(3.6\\times10^6\\) J.</div></div>

<div class="callout analogy"><div class="title">Analogy</div>Power is like the flow rate of a waterfall times its height. A tall waterfall (big ΔV) with lots of water going over each second (big I) delivers a lot of energy per second to the rocks below.</div>

<div class="callout mistake"><div class="title">Common mistake</div>“Bigger resistance means more power because \\(P = I^2R\\).” That's only true if the current stays the same (e.g., resistors in series). On a fixed voltage, a bigger resistance draws less current and the power goes <em>down</em> (\\(P = V^2/R\\)). Pick the formula whose other variable is actually being held constant.</div>

<div class="callout ap"><div class="title">On the AP exam</div>“Brightness” always means power dissipated by the bulb. For identical bulbs, the one with more current through it (equivalently, more voltage across it) is brighter. A 60 W household bulb has <em>more</em> resistance than a 100 W one: both run on 120 V, and \\(R = V^2/P\\).</div>

<div class="check" data-answer="2"><div class="q">A resistor connected to a fixed battery dissipates power P. It's replaced by a resistor with twice the resistance. The new power is…</div>
<div class="opts"><button>4P</button><button>2P</button><button>P/2</button><button>P/4</button></div>
<div class="why">Voltage is fixed, so use \\(P = V^2/R\\). Doubling R halves P.</div></div>

<div class="check" data-answer="0"><div class="q">A 1500 W heater runs for 2 hours. How much energy does it use?</div>
<div class="opts"><button>3 kWh</button><button>750 kWh</button><button>3000 J</button><button>0.75 kWh</button></div>
<div class="why">\\(E = P\\Delta t = 1.5\\ \\text{kW} \\times 2\\ \\text{h} = 3\\ \\text{kWh}\\) (\\(= 1.08\\times10^7\\) J).</div></div>
`;
      const s = { emf: ctl(el, 'emf'), R: ctl(el, 'R'), t: ctl(el, 't') };
      const bulb = Bulb('bulb', 6);
      const circ = { emf: 12, net: ser(bulb) };
      function sync() {
        circ.emf = +s.emf.value; bulb.R = +s.R.value;
        solveCirc(circ);
        const hrs = +s.t.value, E = bulb.P * hrs * 3600;
        out(el, 'emf', circ.emf + ' V'); out(el, 'R', bulb.R + ' Ω'); out(el, 't', hrs + ' h');
        out(el, 'I', num(circ.I) + ' A'); out(el, 'P', num(bulb.P) + ' W');
        out(el, 'E', `${num(E)} J = ${num(E / 3.6e6)} kWh`);
      }
      sync();
      Object.values(s).forEach((x) => on(b, x, 'input', sync));
      circuitSim(b, el.querySelector('canvas'), () => circ, { colorV: true, dots: true, labels: 'full', Pref: 24, dotK: 0.5 });
      return b;
    },
  });

  // Animate dots along a pixel polyline (current in the direction of the points if I > 0).
  function pxDots(ctx, pts, I, holder, dt, k, color) {
    if (!(Math.abs(I) > 1e-9)) return;
    const sp = 22;
    holder.ph = ((((holder.ph || 0) + clamp(I * k, -200, 200) * dt) % sp) + sp) % sp;
    let L = 0; const lens = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); L += l; }
    ctx.fillStyle = color;
    for (let s = holder.ph; s < L; s += sp) {
      let d = s, i = 0;
      while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
      const t = lens[i] ? d / lens[i] : 0;
      ctx.beginPath(); ctx.arc(lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t), 3, 0, 7); ctx.fill();
    }
  }
  // Draw a vertical or horizontal component between two px points (for custom schematics).
  function compPx(ctx, kind, x1, y1, x2, y2, opts) {
    const th = theme(); opts = opts || {};
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux;
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const half = kind === 'bat' ? 6 : 22;
    ctx.strokeStyle = opts.wire || th.text; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(cx - ux * half, cy - uy * half);
    ctx.moveTo(cx + ux * half, cy + uy * half); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = th.text;
    if (kind === 'R') {
      ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const t = -half + (i / 12) * 2 * half, a = i === 0 || i === 12 ? 0 : i % 2 ? 7 : -7;
        const px = cx + ux * t + nx * a, py = cy + uy * t + ny * a;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (kind === 'bat') {
      // opts.plusFirst: the + (long) plate is at the (x1,y1) side
      const pf = opts.plusFirst !== false;
      const pLong = pf ? -half : half, pShort = pf ? half : -half;
      ctx.lineWidth = 2.5; ctx.beginPath();
      ctx.moveTo(cx + ux * pLong + nx * 16, cy + uy * pLong + ny * 16); ctx.lineTo(cx + ux * pLong - nx * 16, cy + uy * pLong - ny * 16); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(cx + ux * pShort + nx * 8, cy + uy * pShort + ny * 8); ctx.lineTo(cx + ux * pShort - nx * 8, cy + uy * pShort - ny * 8); ctx.stroke();
      text(ctx, '+', cx + ux * pLong * 2.6 + nx * 14, cy + uy * pLong * 2.6 + ny * 14, th.pos, 13, 700);
      text(ctx, '−', cx + ux * pShort * 2.6 + nx * 14, cy + uy * pShort * 2.6 + ny * 14, th.neg, 13, 700);
    }
    if (opts.label) text(ctx, opts.label, cx + nx * (opts.off || 26), cy + ny * (opts.off || 26), th.text, 12, 600);
  }

  /* ===================================================================== */
  /* 6. Series                                                              */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 6, id: 'u2-series',
    title: 'Series circuits: one path, shared current',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">Put bulbs one after another in a single loop and every charge has to pass through all of them. There's only one path, so there's only one current. The battery's "height" gets split up among the bulbs.</p>

<h2>Three rules for series</h2>
<ol>
<li><b>Same current everywhere.</b> Charge can't pile up or leak out between components, so whatever goes through the first bulb goes through the next: \\(I_1 = I_2 = I_3\\).</li>
<li><b>Voltages add up to the battery's.</b> On the roller coaster, the battery lifts each charge by \\(\\varepsilon\\); the drops across the components must add back to \\(\\varepsilon\\) to get the charge back to the bottom: \\(\\varepsilon = \\Delta V_1 + \\Delta V_2 + \\Delta V_3\\).</li>
<li><b>Resistances add.</b> Divide rule 2 by the shared current \\(I\\):</li>
</ol>
<div class="eq">\\[ R_{\\text{eq}} = R_1 + R_2 + R_3 + \\cdots \\]
<div class="where">where \\(R_{\\text{eq}}\\) = equivalent resistance: the single resistor that would draw the same current from the battery. Adding a resistor in series always <em>increases</em> \\(R_{\\text{eq}}\\), so the current <em>decreases</em>.</div></div>
<p><b>Example.</b> 2 Ω, 4 Ω and 6 Ω in series on 12 V: \\(R_{\\text{eq}} = 12\\ \\Omega\\), \\(I = 1\\) A. Drops: 2 V, 4 V, 6 V — they add to 12 V. ✓ The biggest resistor gets the biggest share of the voltage (\\(\\Delta V = IR\\) with the same \\(I\\)), and dissipates the most power (\\(P = I^2R\\)).</p>

<div class="sim">
  <canvas data-c="sch"></canvas>
  <canvas data-c="land"></canvas>
  <div class="sim-controls">
    ${slider('emf', 'Battery', 1, 18, 0.5, 12)}
    ${slider('n', 'Number of bulbs', 1, 4, 1, 2)}
    ${slider('r1', 'R₁', 1, 12, 1, 6)}
    ${slider('r2', 'R₂', 1, 12, 1, 6)}
    ${slider('r3', 'R₃', 1, 12, 1, 6)}
    ${slider('r4', 'R₄', 1, 12, 1, 6)}
  </div>
  <div class="sim-readout"><span>R<sub>eq</sub> = <b data-o="req"></b></span><span>I = <b data-o="I"></b></span><span data-o="drops"></span></div>
  <div class="sim-caption">Add bulbs: every bulb dims, because the total resistance goes up and the shared current goes down. In the landscape, the battery's lift is split into more, smaller drops. Make one resistance bigger: it takes a bigger share of the drop and glows brighter than the others. Tap a bulb in the diagram to remove it (then short it): one break stops everything in series.</div>
</div>

<h2>The voltage divider</h2>
<p>Because voltage splits in proportion to resistance, two series resistors make a <b>voltage divider</b>: \\(\\Delta V_1 = \\varepsilon\\,\\dfrac{R_1}{R_1 + R_2}\\). A 9 V battery across 1 kΩ and 2 kΩ gives 3 V and 6 V. You can find the split without ever computing the current.</p>

<div class="callout analogy"><div class="title">Analogy</div>One hiking trail down a mountain with several steep sections. Every hiker walks every section (same current). The total height lost is the mountain's height (the emf), shared among the sections — the longest steep section accounts for the most height.</div>

<div class="callout mistake"><div class="title">Common mistake</div>“The first bulb gets the most current and uses some of it up, so later bulbs are dimmer.” Current is <em>not</em> used up — it's the same in every series component. Identical bulbs in series are equally bright, whatever their order.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Series reasoning questions: adding a bulb in series makes all existing bulbs dimmer; removing one (or one burning out) turns them all off. Justify with current: “R<sub>eq</sub> increases, so the current from the battery decreases, so P = I²R decreases for each bulb.”</div>

<div class="check" data-answer="1"><div class="q">A 3 Ω and a 9 Ω resistor are in series with a 24 V battery. What is the voltage across the 9 Ω resistor?</div>
<div class="opts"><button>6 V</button><button>18 V</button><button>24 V</button><button>12 V</button></div>
<div class="why">\\(R_{\\text{eq}} = 12\\ \\Omega\\), \\(I = 2\\) A, \\(\\Delta V = IR = 2\\times9 = 18\\) V. Or by division: \\(24\\times9/12 = 18\\) V.</div></div>
`;
      const s = {}; ['emf', 'n', 'r1', 'r2', 'r3', 'r4'].forEach((k) => (s[k] = ctl(el, k)));
      const bulbs = [1, 2, 3, 4].map((i) => Bulb('R' + ['₁', '₂', '₃', '₄'][i - 1], 6));
      const circ = { emf: 12, net: ser(bulbs[0], bulbs[1]) };
      function sync() {
        const n = +s.n.value;
        circ.emf = +s.emf.value;
        bulbs.forEach((bb, i) => { bb.R = +s['r' + (i + 1)].value; out(el, 'r' + (i + 1), bb.R + ' Ω'); el.querySelector(`[data-l="r${i + 1}"]`).style.display = i < n ? '' : 'none'; });
        circ.net = ser(...bulbs.slice(0, n));
        out(el, 'emf', circ.emf + ' V'); out(el, 'n', n);
      }
      sync();
      Object.values(s).forEach((x) => on(b, x, 'input', sync));
      circuitSim(b, el.querySelector('[data-c="sch"]'), () => circ, {
        colorV: true, dots: true, labels: 'full', Pref: 24, dotK: 0.6, onTap: (h) => cycleState(h.n),
      });
      const lh = {};
      canvasSim(b, el.querySelector('[data-c="land"]'), (w) => (w < 520 ? 0.6 : 0.34), (v, dt) => {
        solveCirc(circ);
        bgFill(v);
        drawLandscape(v.ctx, { x: 30, y: 46, w: v.w - 50, h: v.h - 90 }, seriesItems(circ), circ.I, lh, dt, { speedK: 0.08 });
        out(el, 'req', num(circ.Req) + ' Ω'); out(el, 'I', num(circ.I) + ' A');
        out(el, 'drops', 'Drops: ' + leaves(circ.net).map((n) => `${n.name} <b>${num(n.V)} V</b>`).join(', ') + ` → sum <b>${num(leaves(circ.net).reduce((a, n) => a + n.V, 0))} V</b>`);
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 7. Parallel                                                            */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 7, id: 'u2-parallel',
    title: 'Parallel circuits: many paths, shared voltage',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">Now give the charges a choice. Connect bulbs side by side, each on its own branch between the same two junctions. Each charge goes through just one bulb — and every branch gets the full "height" of the battery.</p>

<h2>Three rules for parallel</h2>
<ol>
<li><b>Same voltage across every branch.</b> All branches connect the same two junctions. Wires have no drop, so the top junction is at one potential and the bottom at another — every branch sees the same \\(\\Delta V\\). With nothing else in the circuit, that's the battery's \\(\\varepsilon\\).</li>
<li><b>Currents add.</b> The current from the battery splits among the branches and recombines: \\(I = I_1 + I_2 + I_3\\). Each branch takes \\(I_k = \\Delta V/R_k\\) — the easier path gets more.</li>
<li><b>Reciprocals of resistances add.</b> Divide rule 2 by the shared \\(\\Delta V\\):</li>
</ol>
<div class="eq">\\[ \\frac{1}{R_{\\text{eq}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3} + \\cdots \\]
<div class="where">where \\(R_{\\text{eq}}\\) is always <b>smaller than the smallest branch resistance</b>. Two equal resistors \\(R\\) in parallel give \\(R/2\\); \\(n\\) equal ones give \\(R/n\\). Shortcut for two: \\(R_{\\text{eq}} = \\dfrac{R_1R_2}{R_1 + R_2}\\).</div></div>
<p><b>Example.</b> 6 Ω and 3 Ω in parallel on 12 V: branch currents 2 A and 4 A, total 6 A. \\(R_{\\text{eq}} = 12/6 = 2\\ \\Omega\\) — check: \\(1/6 + 1/3 = 1/2\\). ✓</p>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${slider('emf', 'Battery', 1, 18, 0.5, 12)}
    ${slider('n', 'Branches', 1, 4, 1, 2)}
    ${slider('r1', 'R₁', 1, 24, 1, 12)}
    ${slider('r2', 'R₂', 1, 24, 1, 12)}
    ${slider('r3', 'R₃', 1, 24, 1, 12)}
    ${slider('r4', 'R₄', 1, 24, 1, 12)}
  </div>
  <div class="sim-readout"><span>R<sub>eq</sub> = <b data-o="req"></b></span><span>Battery current = <b data-o="I"></b></span><span data-o="br"></span></div>
  <div class="sim-caption">Tap a switch to open or close its branch. Adding a branch doesn't dim the others — each still has the full battery voltage — but the battery has to supply more total current. The wire colours show it: the whole top rail is at one potential and the whole bottom rail at another.</div>
</div>

<h2>Adding a branch lowers R<sub>eq</sub></h2>
<p>This feels backwards at first: adding <em>more</em> resistors makes the total resistance <em>smaller</em>? Yes — you're adding another path. More lanes on a highway means more cars per second can get through, even though each lane is as slow as before. That's exactly what happens in your house: every appliance you plug in is another parallel branch, and the total current from the panel goes up. (Too many and the breaker trips.)</p>

<div class="callout analogy"><div class="title">Analogy</div>A row of checkout lanes at a store. Each lane (branch) handles its own customers; opening another lane doesn't slow the others, but more customers per second leave the store in total.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Forgetting to flip at the end: \\(1/R_{\\text{eq}} = 1/6 + 1/3 = 0.5\\) means \\(R_{\\text{eq}} = 2\\ \\Omega\\), not 0.5 Ω. Sanity check: \\(R_{\\text{eq}}\\) must be smaller than every branch.</div>

<div class="callout ap"><div class="title">On the AP exam</div>With an ideal battery, adding a parallel bulb leaves the other bulbs' brightness unchanged but increases the battery's current (and its power output). Removing one parallel bulb doesn't affect the others. (With a real battery's internal resistance the others dim slightly — later lesson.)</div>

<div class="check" data-answer="3"><div class="q">Three identical 9 Ω resistors are connected in parallel. The equivalent resistance is…</div>
<div class="opts"><button>27 Ω</button><button>9 Ω</button><button>1/3 Ω</button><button>3 Ω</button></div>
<div class="why">\\(1/R = 3/9\\), so \\(R = 3\\ \\Omega\\). For n equal resistors, \\(R/n\\).</div></div>

<div class="check" data-answer="0"><div class="q">Two bulbs are in parallel on an ideal battery. A third identical bulb is added in parallel. What happens to the current from the battery?</div>
<div class="opts"><button>It increases by 50%</button><button>It stays the same and splits three ways</button><button>It decreases</button><button>It doubles</button></div>
<div class="why">Each bulb draws the same current \\(\\varepsilon/R\\) as before. Going from 2 to 3 branches means 3/2 as much total current.</div></div>
`;
      const s = {}; ['emf', 'n', 'r1', 'r2', 'r3', 'r4'].forEach((k) => (s[k] = ctl(el, k)));
      const sub = ['₁', '₂', '₃', '₄'];
      const bulbs = sub.map((x) => Bulb('R' + x, 12));
      const sws = sub.map((x) => Sw('S' + x, true));
      const circ = { emf: 12, net: null };
      function sync() {
        const n = +s.n.value;
        circ.emf = +s.emf.value;
        bulbs.forEach((bb, i) => { bb.R = +s['r' + (i + 1)].value; out(el, 'r' + (i + 1), bb.R + ' Ω'); el.querySelector(`[data-l="r${i + 1}"]`).style.display = i < n ? '' : 'none'; });
        circ.net = par(...bulbs.slice(0, n).map((bb, i) => ser(sws[i], bb)));
        out(el, 'emf', circ.emf + ' V'); out(el, 'n', n);
      }
      sync();
      Object.values(s).forEach((x) => on(b, x, 'input', sync));
      circuitSim(b, el.querySelector('canvas'), () => circ, {
        colorV: true, dots: true, labels: 'full', Pref: 12, dotK: 0.5,
        onTap: (h) => { if (h.n.k === 'S') cycleState(h.n); },
        after: () => {
          out(el, 'req', num(circ.Req) + ' Ω'); out(el, 'I', num(circ.I) + ' A');
          out(el, 'br', 'Branches: ' + bulbs.slice(0, +s.n.value).map((bb) => `${bb.name} <b>${num(bb.I)} A</b>`).join(' + ') + ` = <b>${num(circ.I)} A</b>`);
        },
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 8. Combination circuits                                                */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 8, id: 'u2-combination',
    title: 'Combination circuits: reduce, then expand',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">Real circuits mix series and parallel. The trick is never to tackle the whole thing at once. Shrink it one small group at a time down to a single resistor, find the battery current, then rebuild it step by step to find every current and voltage.</p>

<h2>How to spot series and parallel</h2>
<ul>
<li>Two resistors are in <b>series</b> if the same current must go through both — they're connected end to end with <em>no junction</em> between them.</li>
<li>Two resistors (or groups) are in <b>parallel</b> if both ends are connected to the <em>same two junctions</em> — their tops are connected by wire, and so are their bottoms.</li>
</ul>
<p>Some pairs are neither. Then you can't combine them directly — combine something else first, or use Kirchhoff's rules (coming up).</p>

<h2>The recipe</h2>
<ol>
<li><b>Reduce:</b> find a simple series or parallel group, replace it with its equivalent, redraw. Repeat until one resistor is left.</li>
<li><b>Battery current:</b> \\(I = \\varepsilon / R_{\\text{eq}}\\).</li>
<li><b>Expand:</b> go back through your drawings in reverse. A series group passes its current to each member (\\(\\Delta V = IR\\) for each); a parallel group passes its voltage to each branch (\\(I = \\Delta V/R\\) for each).</li>
</ol>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${select('pre', 'Circuit', ['R₁ in series with (R₂ ∥ (R₃ + R₄))', '((R₁ + R₂) ∥ R₃) in series with R₄', 'R₁ ∥ R₂ ∥ (R₃ + (R₄ ∥ R₅))'])}
    ${button('prev', '← Back')}
    ${button('next', 'Next step →')}
  </div>
  <div class="sim-readout"><span data-o="step"></span></div>
  <div class="sim-caption">Step through. The dashed box marks the group just combined. On the way back up, every resistor gets labelled with its current and voltage.</div>
</div>

<div class="callout analogy"><div class="title">Analogy</div>Like simplifying a messy fraction: you don't do it all at once, you cancel one factor at a time and rewrite. Each redraw is one small, safe step.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Applying the battery's full voltage to a resistor that is not directly across the battery. Only the <em>whole</em> network has \\(\\varepsilon\\) across it (for an ideal battery). A parallel group's voltage is the battery's voltage <em>minus</em> drops in series with it.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Show your redraws. For “rank the currents” questions you often don't need numbers: the battery current goes through any resistor in series with the battery; it splits at a parallel group, with the bigger share going to the lower-resistance branch.</div>

<div class="check" data-answer="2"><div class="q">A 4 Ω resistor is in series with a parallel pair of 6 Ω and 12 Ω, on a 16 V battery. What's the battery current?</div>
<div class="opts"><button>0.73 A</button><button>4 A</button><button>2 A</button><button>1.3 A</button></div>
<div class="why">Parallel pair: \\(6\\cdot12/18 = 4\\ \\Omega\\). Total \\(4 + 4 = 8\\ \\Omega\\). \\(I = 16/8 = 2\\) A.</div></div>
`;
      const sub = (i) => '₀₁₂₃₄₅₆₇₈₉'[i];
      const presets = [
        () => ({ emf: 12, net: ser(Res('R₁', 4), par(Res('R₂', 6), ser(Res('R₃', 2), Res('R₄', 1)))) }),
        () => ({ emf: 12, net: ser(par(ser(Res('R₁', 2), Res('R₂', 4)), Res('R₃', 3)), Res('R₄', 4)) }),
        () => ({ emf: 12, net: par(Res('R₁', 12), Res('R₂', 6), ser(Res('R₃', 2), par(Res('R₄', 4), Res('R₅', 4)))) }),
      ];
      const clone = (n) => (isLeaf(n) ? Object.assign({}, n, { hl: false }) : { t: n.t, c: n.c.map(clone) });
      function findGroup(n, parent, idx) {
        if (isLeaf(n)) return null;
        for (let i = 0; i < n.c.length; i++) { const r = findGroup(n.c[i], n, i); if (r) return r; }
        return n.c.every(isLeaf) ? { n, parent, idx } : null;
      }
      function buildSteps(c0) {
        const steps = [];
        let tree = clone(c0.net);
        steps.push({ net: clone(tree), labels: 'value', text: 'Start: look for the innermost group that is clearly series (end to end, no junction) or clearly parallel (same two junctions).' });
        const fwd = [clone(tree)];
        let guard = 0;
        while (!isLeaf(tree) && guard++ < 10) {
          const g = findGroup(tree, null, 0);
          const kids = g.n.c;
          const name = 'R' + kids.map((k) => k.name.replace('R', '')).join('');
          let R, txt;
          if (g.n.t === 's') {
            R = kids.reduce((a, k) => a + k.R, 0);
            txt = `${kids.map((k) => k.name).join(' and ')} are in <b>series</b> (same current, no junction between): ${name} = ${kids.map((k) => tnum(k.R)).join(' + ')} = <b>${tnum(R)} Ω</b>.`;
          } else {
            R = 1 / kids.reduce((a, k) => a + 1 / k.R, 0);
            txt = `${kids.map((k) => k.name).join(' and ')} are in <b>parallel</b> (same two junctions): 1/${name} = ${kids.map((k) => '1/' + tnum(k.R)).join(' + ')} → ${name} = <b>${tnum(R)} Ω</b>.`;
          }
          const leaf = Res(name, Number(R.toPrecision(4)), { hl: true });
          if (!g.parent) tree = leaf;
          else {
            g.parent.c[g.idx] = leaf;
            if (g.parent.c.length === 1) { /* not used by presets */ }
          }
          steps.push({ net: clone(tree), labels: 'value', text: txt, hlName: name });
          fwd.push(clone(tree));
        }
        const I = c0.emf / tree.R;
        steps.push({ net: clone(tree), labels: 'full', text: `One resistor left: R<sub>eq</sub> = ${tnum(tree.R)} Ω. Battery current I = ε / R<sub>eq</sub> = ${tnum(c0.emf)} / ${tnum(tree.R)} = <b>${tnum(I)} A</b>.` });
        for (let k = fwd.length - 2; k >= 0; k--) {
          steps.push({
            net: clone(fwd[k]), labels: 'full',
            text: k === 0
              ? 'Fully expanded: every resistor now has its current and voltage. Check: currents into each junction equal currents out, and drops around any loop add to ε.'
              : 'Expand one group: series members share the current (ΔV = IR each); parallel branches share the voltage (I = ΔV/R each).',
          });
        }
        steps.forEach((st) => { if (st.hlName) leaves(st.net).forEach((l) => (l.hl = l.name === st.hlName)); else if (st.labels === 'full') leaves(st.net).forEach((l) => (l.hl = false)); });
        return steps;
      }
      let steps = [], idx = 0, circ = null;
      const sp = ctl(el, 'pre');
      function load() { const c0 = presets[+sp.value](); steps = buildSteps(c0); idx = 0; show(); }
      function show() {
        const st = steps[idx];
        circ = { emf: 12, net: st.net };
        out(el, 'step', `<span><b>Step ${idx + 1} of ${steps.length}.</b> ${st.text}</span>`);
        ctl(el, 'prev').disabled = idx === 0; ctl(el, 'next').disabled = idx === steps.length - 1;
      }
      load();
      on(b, sp, 'input', load);
      on(b, ctl(el, 'prev'), 'click', () => { if (idx > 0) { idx--; show(); } });
      on(b, ctl(el, 'next'), 'click', () => { if (idx < steps.length - 1) { idx++; show(); } });
      void sub;
      circuitSim(b, el.querySelector('canvas'), () => circ, {
        colorV: false, dots: true, Pref: 0, dotK: 0.6,
        get labels() { return steps[idx] ? steps[idx].labels : 'value'; },
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 9. Junction rule                                                       */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 9, id: 'u2-junction',
    title: "Kirchhoff's junction rule: charge is conserved",
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">You've already been using this rule: currents split at a parallel junction and add back up. Kirchhoff's junction rule just says it out loud — and it comes straight from conservation of charge.</p>

<h2>Why it must be true</h2>
<p>A <b>junction</b> (or node) is any point where three or more wires meet. Charge can't be created or destroyed, and in a steady circuit it can't pile up at a point either (a pile of charge would make a field that pushes further charge away until the pile-up stopped). So every coulomb per second that flows <em>in</em> must flow <em>out</em>:</p>
<div class="eq">\\[ \\sum I_{\\text{in}} = \\sum I_{\\text{out}} \\]
<div class="where">where the sums are over all the currents entering and leaving one junction (A). Equivalently, taking “in” as positive and “out” as negative, the currents at a junction add to zero.</div></div>
<p><b>Example.</b> 5 A flows into a junction; 2 A leaves along one wire. The only other wire must carry 3 A <em>out</em>.</p>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${slider('i1', 'I₁ in', 0, 5, 0.1, 3)}
    ${slider('i2', 'I₂ in', 0, 5, 0.1, 2)}
    ${slider('i3', 'I₃ out', 0, 8, 0.1, 1.5)}
  </div>
  <div class="sim-readout"><span>I₄ must be <b data-o="i4"></b></span><span data-o="sum"></span></div>
  <div class="sim-caption">Set three currents; the fourth is forced by charge conservation. If you take out more than goes in, I₄ comes out negative — that just means its current actually flows <em>into</em> the junction. Watch the dots: the number arriving each second equals the number leaving.</div>
</div>

<h2>Unknown directions are fine</h2>
<p>In a complicated circuit you often don't know which way a current flows. Just guess a direction, draw an arrow, and write the junction rule with your guesses. If the answer comes out negative, the current is real — it just flows opposite to your arrow.</p>

<div class="callout analogy"><div class="title">Analogy</div>Water pipes meeting at a joint. Whatever flows in per second has to flow out per second — the joint can't store water. Or cars at an intersection: cars entering per minute equal cars leaving per minute.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Applying the junction rule along a single wire with a bulb in it and thinking the bulb “uses up” current. A bulb isn't a junction and it doesn't consume charge — the current into a bulb equals the current out. What a bulb uses up is <em>energy</em> (potential), not charge.</div>

<div class="callout ap"><div class="title">On the AP exam</div>When asked to justify a current relationship, name the principle: “By conservation of charge (junction rule), the current into junction A, 3 A, equals the total current out, I₁ + I₂.”</div>

<div class="check" data-answer="1"><div class="q">At a junction, 4 A and 1 A flow in, and 7 A flows out along a third wire. What about the fourth wire?</div>
<div class="opts"><button>2 A out</button><button>2 A in</button><button>12 A in</button><button>Impossible — the rule is violated</button></div>
<div class="why">In: 4 + 1 + x = out: 7, so x = 2 A flowing <em>in</em>.</div></div>
`;
      const s = { i1: ctl(el, 'i1'), i2: ctl(el, 'i2'), i3: ctl(el, 'i3') };
      const hs = [{}, {}, {}, {}];
      function vals() { const i1 = +s.i1.value, i2 = +s.i2.value, i3 = +s.i3.value; return [i1, i2, i3, i1 + i2 - i3]; }
      function sync() {
        const I = vals();
        ['i1', 'i2', 'i3'].forEach((k, i) => out(el, k, I[i].toFixed(1) + ' A'));
        out(el, 'i4', I[3] >= 0 ? `${num(I[3])} A out` : `${num(-I[3])} A <em>in</em> (negative “out”)`);
        const tin = I[0] + I[1] + Math.max(0, -I[3]), tout = I[2] + Math.max(0, I[3]);
        out(el, 'sum', `Total in <b>${num(tin)} A</b> = total out <b>${num(tout)} A</b>`);
      }
      sync();
      Object.values(s).forEach((x) => on(b, x, 'input', sync));
      canvasSim(b, el.querySelector('canvas'), (w) => (w < 520 ? 0.7 : 0.45), (v, dt) => {
        const th = theme(), ctx = v.ctx, I = vals();
        bgFill(v);
        const cx = v.w / 2, cy = v.h / 2, L = Math.min(v.w * 0.42, v.h * 0.9);
        // endpoints: 0,1 on the left (in), 2,3 on the right (out)
        const ends = [[cx - L, cy - L * 0.35], [cx - L, cy + L * 0.35], [cx + L, cy - L * 0.35], [cx + L, cy + L * 0.35]];
        const names = ['I₁', 'I₂', 'I₃', 'I₄'];
        for (let k = 0; k < 4; k++) {
          const e = ends[k];
          ctx.strokeStyle = th.text; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(cx, cy); ctx.stroke();
          const inward = k < 2 ? I[k] : -I[k]; // positive = flows toward the junction
          const pts = inward >= 0 ? [e, [cx, cy]] : [[cx, cy], e];
          pxDots(ctx, pts, Math.abs(inward), hs[k], dt, 18, th.warn);
          const mx = (e[0] + cx) / 2, my = (e[1] + cy) / 2;
          const dir = inward >= 0 ? 1 : -1, ux = (cx - e[0]) / L, uy = (cy - e[1]) / L;
          if (Math.abs(I[k]) > 0.01) arrow(ctx, mx - ux * 18 * dir, my - uy * 18 * dir - 16, mx + ux * 18 * dir, my + uy * 18 * dir - 16, k === 3 ? th.accent : th.pos, 2.5, 9);
          text(ctx, `${names[k]} = ${tnum(Math.abs(I[k]))} A ${inward >= 0 ? 'in' : 'out'}`, mx, my + 22, k === 3 ? th.accent : th.text, 13, 700);
        }
        ctx.fillStyle = th.text; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fill();
        text(ctx, 'junction', cx, cy - 18, th.muted, 11, 600);
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 10. Loop rule                                                          */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 10, id: 'u2-loop-rule',
    title: "Kirchhoff's loop rule: the roller-coaster walk",
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">Walk all the way around any closed loop of a circuit and come back to where you started. You're back at the same height — so all the ups and downs in potential along the way must cancel. That's the loop rule, and it's just conservation of energy.</p>

<h2>Why it must be true</h2>
<p>Potential is like height: each point in a circuit has one definite potential. If you start at a point, travel around a loop, and return to that same point, your net change in potential is zero — just like hiking a loop trail and ending at the car. Since \\(\\Delta U = q\\Delta V\\), a charge that goes around the loop gains exactly as much energy (from batteries) as it loses (in resistors).</p>
<div class="eq">\\[ \\sum_{\\text{closed loop}} \\Delta V = 0 \\]
<div class="where">where the sum is over every battery and resistor you pass through going once around the loop, each \\(\\Delta V\\) taken with its sign (V).</div></div>

<h2>The sign rules (memorise these)</h2>
<ul>
<li><b>Battery, − to + terminal:</b> \\(+\\varepsilon\\) (up the lift hill). Going + to −: \\(-\\varepsilon\\).</li>
<li><b>Resistor, walking in the same direction as the current:</b> \\(-IR\\) (current flows downhill, so you're going down). Walking against the current: \\(+IR\\).</li>
<li><b>Plain wire:</b> 0.</li>
</ul>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${slider('e1', 'ε₁', 2, 18, 1, 12)}
    ${checkbox('use2', 'Add ε₂ (opposing)', false)}
    ${slider('e2', 'ε₂', 1, 9, 1, 4)}
    ${select('dir', 'Walk', ['clockwise', 'counter-clockwise'])}
    ${button('go', '▶ Walk the loop')}
  </div>
  <div class="sim-readout"><span data-o="eq"></span></div>
  <div class="sim-caption"><b>Drag the walker</b> (the ring) around the loop, or press Walk. The graph traces potential versus distance walked: up at a battery's − to + crossing, down through each resistor in the direction of current. However you set it, and whichever way you walk, the graph ends at the height it started — the sum is zero.</div>
</div>

<p><b>Example.</b> A 12 V battery with 2 Ω, 4 Ω and 6 Ω in a single loop: \\(+12 - I(2) - I(4) - I(6) = 0\\), so \\(I = 1\\) A. Walk the other way and every sign flips: \\(-12 + 6 + 4 + 2 = 0\\). Same answer.</p>
<p>With a second battery pointing the “wrong” way (ε₂ opposing): \\(+\\varepsilon_1 - IR_1 - \\varepsilon_2 - IR_2 - IR_3 = 0\\), so \\(I = (\\varepsilon_1 - \\varepsilon_2)/(R_1 + R_2 + R_3)\\). The bigger battery wins and actually pushes charge backwards through the smaller one (that's how recharging works).</p>

<div class="callout analogy"><div class="title">Analogy</div>A hiking loop: climb up the ski lift (battery), then walk down several slopes (resistors) back to the parking lot. Total climb = total descent. If there's a second lift running backwards, you have to go down it too.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Getting the battery sign from the current direction. A battery's sign depends only on which terminal you cross <em>into</em>: − to + is always \\(+\\varepsilon\\), whichever way the current goes. Only resistor signs depend on the current direction.</div>

<div class="callout ap"><div class="title">On the AP exam</div>When justifying, name the principle: “By conservation of energy (the loop rule), the sum of potential differences around the loop is zero, so ε = ΔV₁ + ΔV₂.” You may be asked to sketch potential vs. position around a loop — that's exactly this graph.</div>

<div class="check" data-answer="2"><div class="q">Walking around a loop in the direction of the current, you cross a 9 V battery from − to +, then a 3 Ω resistor, then a 6 Ω resistor. What is the current?</div>
<div class="opts"><button>3 A</button><button>9 A</button><button>1 A</button><button>0.5 A</button></div>
<div class="why">\\(+9 - 3I - 6I = 0\\), so \\(I = 1\\) A.</div></div>
`;
      const s = { e1: ctl(el, 'e1'), use2: ctl(el, 'use2'), e2: ctl(el, 'e2'), dir: ctl(el, 'dir') };
      const R1 = 2, R2 = 4, R3 = 6;
      // perimeter parameter p in [0,4): 0 = bottom-left corner, going up the left side (clockwise on screen)
      const els = () => {
        const list = [
          { name: 'ε₁', a: 0.38, b: 0.62, kind: 'bat', cw: +s.e1.value, plusAtEnd: true },
          { name: 'R₁', a: 1.15, b: 1.5, kind: 'R', R: R1 },
          { name: 'R₂', a: 2.3, b: 2.7, kind: 'R', R: R2 },
          { name: 'R₃', a: 3.3, b: 3.7, kind: 'R', R: R3 },
        ];
        if (s.use2.checked) list.splice(2, 0, { name: 'ε₂', a: 1.66, b: 1.84, kind: 'bat', cw: -+s.e2.value, plusAtEnd: false });
        const I = ((+s.e1.value) - (s.use2.checked ? +s.e2.value : 0)) / (R1 + R2 + R3);
        list.forEach((e) => { if (e.kind === 'R') e.cw = -I * e.R; });
        return { list, I };
      };
      let d = 0, walking = false;
      const dirSign = () => (+s.dir.value === 0 ? 1 : -1);
      function Vwalk(dd, list, dir) { // potential after walking distance dd from the start corner
        let V = 0;
        for (const e of list) {
          const A = dir > 0 ? e.a : 4 - e.b, B = dir > 0 ? e.b : 4 - e.a;
          V += clamp((dd - A) / (B - A), 0, 1) * dir * e.cw;
        }
        return V;
      }
      function sync() {
        out(el, 'e1', s.e1.value + ' V'); out(el, 'e2', s.e2.value + ' V');
        ctl(el, 'e2').closest('label').style.opacity = s.use2.checked ? 1 : 0.4;
      }
      sync();
      [s.e1, s.use2, s.e2].forEach((x) => on(b, x, 'input', sync));
      on(b, s.dir, 'input', () => { d = 0; });
      on(b, ctl(el, 'go'), 'click', () => { d = 0; walking = true; });
      let geo = null;
      const cv = el.querySelector('canvas');
      const pointAt = (p) => { // p in [0,4) → unit square coords
        p = ((p % 4) + 4) % 4;
        if (p < 1) return [0, 1 - p];
        if (p < 2) return [p - 1, 0];
        if (p < 3) return [1, p - 2];
        return [1 - (p - 3), 1];
      };
      drag(b, cv, {
        down: (p) => { if (!geo) return false; walking = false; setFrom(p); },
        move: (p) => setFrom(p),
      });
      function setFrom(p) {
        const u = (p.x - geo.x) / geo.w, vv = (p.y - geo.y) / geo.h;
        // nearest side
        const cands = [[Math.abs(u), 1 - clamp(vv, 0, 1)], [Math.abs(vv), 1 + clamp(u, 0, 1)], [Math.abs(1 - u), 2 + clamp(vv, 0, 1)], [Math.abs(1 - vv), 3 + (1 - clamp(u, 0, 1))]];
        cands.sort((a, c) => a[0] - c[0]);
        let pp = cands[0][1] % 4;
        let nd = dirSign() > 0 ? pp : (4 - pp) % 4;
        if (d > 3.5 && nd < 0.5) nd = 4; // allow finishing the loop
        if (Math.abs(nd - d) > 2 && !(d > 3.5 && nd > 3.5)) return; // ignore jumps across the start
        d = clamp(nd, 0, 4);
      }
      canvasSim(b, cv, (w) => (w < 520 ? 1.15 : 0.62), (v, dt) => {
        const th = theme(), ctx = v.ctx, { list, I } = els(), dir = dirSign();
        if (walking) { d += dt * 0.5; if (d >= 4) { d = 4; walking = false; } }
        bgFill(v);
        const narrow = v.w < 520;
        const sq = narrow ? { x: 66, y: 30, w: v.w - 132, h: v.h * 0.42 - 30 } : { x: 72, y: 34, w: v.w * 0.42 - 130, h: v.h - 80 };
        geo = sq;
        const P = (p) => { const q = pointAt(p); return [sq.x + q[0] * sq.w, sq.y + q[1] * sq.h]; };
        // potential (clockwise from start corner) for colouring
        const Vcw = (p) => Vwalk(p, list, 1);
        let vmin = 0, vmax = 0;
        for (let k = 0; k <= 80; k++) { const V = Vcw((k / 80) * 4); vmin = Math.min(vmin, V); vmax = Math.max(vmax, V); }
        const col = (V) => mix(th.neg, th.pos, (V - vmin) / Math.max(1e-6, vmax - vmin));
        // wires (skipping components)
        const inEl = (p) => list.find((e) => p > e.a && p < e.b);
        for (let k = 0; k < 160; k++) {
          const p0 = (k / 160) * 4, p1 = ((k + 1) / 160) * 4, pm = (p0 + p1) / 2;
          if (inEl(pm)) continue;
          const a = P(p0), c = P(p1);
          ctx.strokeStyle = col(Vcw(pm)); ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
        }
        for (const e of list) {
          const a = P(e.a), c = P(e.b);
          const inward = (() => { const m = P((e.a + e.b) / 2); const dx = m[0] - (sq.x + sq.w / 2), dy = m[1] - (sq.y + sq.h / 2); return Math.abs(dx) / sq.w > Math.abs(dy) / sq.h ? [-Math.sign(dx), 0] : [0, -Math.sign(dy)]; })();
          if (e.kind === 'R') compPx(ctx, 'R', a[0], a[1], c[0], c[1]);
          else compPx(ctx, 'bat', a[0], a[1], c[0], c[1], { plusFirst: !e.plusAtEnd });
          const m = P((e.a + e.b) / 2);
          const lab = e.kind === 'R' ? `${e.name} ${e.R} Ω` : `${e.name} ${Math.abs(e.cw)} V`;
          if (inward[0]) text(ctx, lab, m[0] - inward[0] * 16, m[1], th.text, 12, 700, inward[0] > 0 ? 'right' : 'left');
          else text(ctx, lab, m[0], m[1] + inward[1] * 24, th.text, 12, 700);
        }
        // current arrow
        const sgn = I >= 0 ? 1 : -1;
        const ta = P(1.75 + 0.0), tb = P(1.95);
        if (Math.abs(I) > 1e-6) {
          const q1 = P(2.85 - 0.09 * sgn), q2 = P(2.85 + 0.09 * sgn);
          void ta; void tb;
          arrow(ctx, q1[0] + 14, q1[1], q2[0] + 14, q2[1], th.warn, 3, 10);
        }
        text(ctx, `I = ${tnum(Math.abs(I))} A ${I >= 0 ? '(clockwise)' : '(counter-clockwise)'}`, sq.x + sq.w / 2, sq.y + sq.h / 2, th.warn, 12, 700);
        text(ctx, 'start', sq.x - 4, sq.y + sq.h + 16, th.muted, 11, 600);
        // walker
        const wp = P(dir > 0 ? d : 4 - d);
        ctx.strokeStyle = th.accent; ctx.lineWidth = 3; ctx.fillStyle = alpha(th.accent, 0.2);
        ctx.beginPath(); ctx.arc(wp[0], wp[1], 11, 0, 7); ctx.fill(); ctx.stroke();
        // graph
        const gr = narrow ? { x: 50, y: v.h * 0.5 + 10, w: v.w - 66, h: v.h * 0.5 - 50 } : { x: v.w * 0.45 + 30, y: 30, w: v.w * 0.55 - 50, h: v.h - 76 };
        let gmin = 0, gmax = 0;
        for (let k = 0; k <= 200; k++) { const V = Vwalk((k / 200) * 4, list, dir); gmin = Math.min(gmin, V); gmax = Math.max(gmax, V); }
        const pad = Math.max(1, (gmax - gmin) * 0.1);
        const ax = axes(ctx, gr, [0, 4], [gmin - pad, gmax + pad], { xl: 'distance walked →', yl: 'ΔV from start (V)' });
        ctx.strokeStyle = th.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(gr.x, ax.Y(0)); ctx.lineTo(gr.x + gr.w, ax.Y(0)); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = alpha(th.muted, 0.5); ctx.lineWidth = 1.5; ctx.beginPath();
        for (let k = 0; k <= 200; k++) { const dd = (k / 200) * 4; const y = ax.Y(Vwalk(dd, list, dir)); if (k === 0) ctx.moveTo(ax.X(dd), y); else ctx.lineTo(ax.X(dd), y); }
        ctx.stroke();
        ctx.strokeStyle = th.accent; ctx.lineWidth = 3; ctx.beginPath();
        const kk = Math.round((d / 4) * 200);
        for (let k = 0; k <= kk; k++) { const dd = (k / 200) * 4; const y = ax.Y(Vwalk(dd, list, dir)); if (k === 0) ctx.moveTo(ax.X(dd), y); else ctx.lineTo(ax.X(dd), y); }
        ctx.stroke();
        ctx.fillStyle = th.accent; ctx.beginPath(); ctx.arc(ax.X(d), ax.Y(Vwalk(d, list, dir)), 5, 0, 7); ctx.fill();
        for (const e of list) {
          const A = dir > 0 ? e.a : 4 - e.b, B = dir > 0 ? e.b : 4 - e.a, mid = (A + B) / 2;
          text(ctx, e.name, ax.X(mid), gr.y + gr.h + 12, th.muted, 10, 600);
        }
        // running equation
        const order = list.slice().sort((x, y) => (dir > 0 ? x.a - y.a : y.a - x.a));
        let terms = [], sum = 0;
        for (const e of order) {
          const A = dir > 0 ? e.a : 4 - e.b, B = dir > 0 ? e.b : 4 - e.a;
          if (d >= B - 1e-9) {
            const val = dir * e.cw; sum += val;
            terms.push(`${val >= 0 ? '+' : '−'} ${num(Math.abs(val))} V <span class="muted">(${e.name}${e.kind === 'R' ? (val < 0 ? ', with I' : ', against I') : (val > 0 ? ', − to +' : ', + to −')})</span>`);
          } else if (d > A) terms.push(`<span class="muted">crossing ${e.name}…</span>`);
        }
        out(el, 'eq', `Walk so far: ${terms.length ? terms.join(' ') : '<span class="muted">(start walking)</span>'} &nbsp;→&nbsp; <b>ΣΔV = ${num(Math.abs(sum) < 1e-9 ? 0 : sum)} V</b>${d >= 4 - 1e-9 ? ' ✓ back to the start: total is zero' : ''}`);
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 11. Multi-loop circuits                                                */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 11, id: 'u2-multiloop',
    title: 'Multi-loop circuits: using both rules together',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">Put a battery in two different branches and series/parallel reduction stops working: nothing is cleanly in series or in parallel any more. Instead, write down the two Kirchhoff rules and solve them like a system of equations from algebra class.</p>

<h2>The recipe</h2>
<ol>
<li><b>Label a current in each branch</b> with a guessed direction (\\(I_1, I_2, I_3\\)). A branch is a path between two junctions; everything in one branch shares one current.</li>
<li><b>Junction rule</b> at one junction: currents in = currents out.</li>
<li><b>Loop rule</b> around enough loops to get as many equations as unknowns (here two loops).</li>
<li><b>Solve</b> by substitution. A negative answer means the current flows opposite your arrow — keep the sign while you finish the algebra.</li>
</ol>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${slider('e1', 'ε₁', 0, 18, 1, 12)}
    ${slider('e2', 'ε₂', 0, 18, 1, 6)}
    ${slider('r1', 'R₁', 1, 10, 1, 2)}
    ${slider('r2', 'R₂', 1, 10, 1, 4)}
    ${slider('r3', 'R₃', 1, 10, 1, 2)}
  </div>
  <div class="sim-readout" style="display:block"><div data-o="eqs"></div></div>
  <div class="sim-caption">Arrows show the guessed directions: I₁ up through the left branch, I₂ down through the middle, I₃ up through the right. If a value goes negative, its dots run against the arrow. Try making ε₂ much smaller than ε₁: battery 2 gets pushed backwards (it's being charged).</div>
</div>

<p><b>Worked example</b> (the sim's starting values: ε₁ = 12 V, ε₂ = 6 V, R₁ = 2 Ω, R₂ = 4 Ω, R₃ = 2 Ω).</p>
<ul>
<li>Junction (top): \\(I_1 + I_3 = I_2\\).</li>
<li>Left loop (up through ε₁, across R₁, down through R₂): \\(12 - 2I_1 - 4I_2 = 0\\).</li>
<li>Right loop (up through ε₂, across R₃, down through R₂): \\(6 - 2I_3 - 4I_2 = 0\\).</li>
<li>From the loops: \\(I_1 = 6 - 2I_2\\) and \\(I_3 = 3 - 2I_2\\). Substitute into the junction: \\(9 - 4I_2 = I_2\\), so \\(I_2 = 1.8\\) A, \\(I_1 = 2.4\\) A, \\(I_3 = -0.6\\) A.</li>
</ul>
<p>The negative \\(I_3\\) says 0.6 A actually flows <em>down</em> through battery 2 — from its + terminal to its − terminal. Battery 1 is charging battery 2.</p>

<div class="callout analogy"><div class="title">Analogy</div>Two pumps feeding the same set of pipes. The stronger pump can overpower the weaker one and force water backward through it. The rules don't change: water in = water out at each joint, and total lift = total drop around any loop.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Using a different current in two resistors that are in the same branch, or the same current in different branches. One branch ↔ one current. And once you've chosen an arrow for a current, keep using that direction in every equation, even after you suspect it's backwards.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Free-response questions often ask you to “write, but do not solve” the equations. Show a junction equation and loop equations with clear signs, labelled with which loop you walked. Points are given for correct setup.</div>

<div class="check" data-answer="0"><div class="q">You solve a two-loop circuit and get I₃ = −0.5 A. What does that mean?</div>
<div class="opts"><button>0.5 A flows opposite to the arrow you drew for I₃</button><button>You made an error; currents can't be negative</button><button>Charge is being destroyed in that branch</button><button>The current in that branch is zero</button></div>
<div class="why">The sign just compares the real direction to your guess. Magnitude 0.5 A, direction opposite your arrow.</div></div>
`;
      const s = {}; ['e1', 'e2', 'r1', 'r2', 'r3'].forEach((k) => (s[k] = ctl(el, k)));
      const hs = {};
      function solve() {
        const e1 = +s.e1.value, e2 = +s.e2.value, R1 = +s.r1.value, R2 = +s.r2.value, R3 = +s.r3.value;
        const VA = (e1 / R1 + e2 / R3) / (1 / R1 + 1 / R2 + 1 / R3);
        return { e1, e2, R1, R2, R3, VA, I1: (e1 - VA) / R1, I2: VA / R2, I3: (e2 - VA) / R3 };
      }
      function sync() {
        ['e1', 'e2'].forEach((k) => out(el, k, s[k].value + ' V'));
        ['r1', 'r2', 'r3'].forEach((k) => out(el, k, s[k].value + ' Ω'));
        const z = solve(), f = (x) => num(x);
        out(el, 'eqs', `
<div>Junction: I₁ + I₃ = I₂ → ${f(z.I1)} + (${f(z.I3)}) = ${f(z.I2)} ✓</div>
<div>Left loop: ε₁ − I₁R₁ − I₂R₂ = ${z.e1} − (${f(z.I1)})(${z.R1}) − (${f(z.I2)})(${z.R2}) = ${f(Math.abs(z.e1 - z.I1 * z.R1 - z.I2 * z.R2) < 1e-9 ? 0 : z.e1 - z.I1 * z.R1 - z.I2 * z.R2)} ✓</div>
<div>Right loop: ε₂ − I₃R₃ − I₂R₂ = ${z.e2} − (${f(z.I3)})(${z.R3}) − (${f(z.I2)})(${z.R2}) = ${f(Math.abs(z.e2 - z.I3 * z.R3 - z.I2 * z.R2) < 1e-9 ? 0 : z.e2 - z.I3 * z.R3 - z.I2 * z.R2)} ✓</div>
<div><b>I₁ = ${f(z.I1)} A, I₂ = ${f(z.I2)} A, I₃ = ${f(z.I3)} A</b>${z.I1 < -1e-9 ? ' — I₁ negative: battery 1 is being charged.' : ''}${z.I3 < -1e-9 ? ' — I₃ negative: battery 2 is being charged.' : ''}</div>`);
      }
      sync();
      Object.values(s).forEach((x) => on(b, x, 'input', sync));
      canvasSim(b, el.querySelector('canvas'), (w) => (w < 520 ? 0.85 : 0.5), (v, dt) => {
        const th = theme(), ctx = v.ctx, z = solve();
        bgFill(v);
        const xl = v.w * 0.14, xm = v.w * 0.5, xr = v.w * 0.86, yt = v.h * 0.14, yb = v.h * 0.86;
        const yR = lerp(yt, yb, 0.33), yE = lerp(yt, yb, 0.68);
        const col = (V) => mix(th.neg, th.pos, V / Math.max(1, z.e1, z.e2, z.VA));
        const wire = (pts, V) => { ctx.strokeStyle = col(V); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.stroke(); };
        // top rail at VA, bottom rail at 0
        wire([[xl, yt], [xr, yt]], z.VA); wire([[xl, yb], [xr, yb]], 0);
        // left branch: bottom → ε1 → (V=e1) → R1 → top
        wire([[xl, yb], [xl, yE + 8]], 0); wire([[xl, yE - 8], [xl, yR + 24]], z.e1); wire([[xl, yR - 24], [xl, yt]], z.VA);
        compPx(ctx, 'bat', xl, yE - 8, xl, yE + 8, { plusFirst: true, label: `ε₁ = ${z.e1} V`, off: -44 });
        compPx(ctx, 'R', xl, yR + 24, xl, yR - 24, { label: `R₁ = ${z.R1} Ω`, off: 44 });
        // middle: R2
        wire([[xm, yt], [xm, (yt + yb) / 2 - 24]], z.VA); wire([[xm, (yt + yb) / 2 + 24], [xm, yb]], 0);
        compPx(ctx, 'R', xm, (yt + yb) / 2 - 24, xm, (yt + yb) / 2 + 24, { label: `R₂ = ${z.R2} Ω`, off: -44 });
        // right: ε2 and R3
        wire([[xr, yb], [xr, yE + 8]], 0); wire([[xr, yE - 8], [xr, yR + 24]], z.e2); wire([[xr, yR - 24], [xr, yt]], z.VA);
        compPx(ctx, 'bat', xr, yE - 8, xr, yE + 8, { plusFirst: true, label: `ε₂ = ${z.e2} V`, off: 44 });
        compPx(ctx, 'R', xr, yR + 24, xr, yR - 24, { label: `R₃ = ${z.R3} Ω`, off: -44 });
        ctx.fillStyle = th.text;
        [[xm, yt], [xm, yb]].forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 7); ctx.fill(); });
        // dots
        const k = 25;
        pxDots(ctx, [[xl, yb], [xl, yt], [xm, yt]], z.I1, (hs.a = hs.a || {}), dt, k, th.warn);
        pxDots(ctx, [[xm, yt], [xm, yb]], z.I2, (hs.b = hs.b || {}), dt, k, th.warn);
        pxDots(ctx, [[xr, yb], [xr, yt], [xm, yt]], z.I3, (hs.c = hs.c || {}), dt, k, th.warn);
        pxDots(ctx, [[xm, yb], [xl, yb]], z.I1, (hs.d = hs.d || {}), dt, k, th.warn);
        pxDots(ctx, [[xm, yb], [xr, yb]], z.I3, (hs.e = hs.e || {}), dt, k, th.warn);
        // guessed-direction arrows + values
        const ya = lerp(yt, yb, 0.5);
        arrow(ctx, xl + 18, ya + 14, xl + 18, ya - 14, th.accent, 2.5, 9);
        text(ctx, `I₁ = ${tnum(z.I1)} A`, xl + 26, ya, th.accent, 12, 700, 'left');
        arrow(ctx, xm + 18, yt + 22, xm + 18, yt + 50, th.accent, 2.5, 9);
        text(ctx, `I₂ = ${tnum(z.I2)} A`, xm + 26, yt + 36, th.accent, 12, 700, 'left');
        arrow(ctx, xr - 18, ya + 14, xr - 18, ya - 14, th.accent, 2.5, 9);
        text(ctx, `I₃ = ${tnum(z.I3)} A`, xr - 26, ya, th.accent, 12, 700, 'right');
        text(ctx, 'A', xm, yt - 12, th.text, 12, 700);
        text(ctx, 'B', xm, yb + 14, th.text, 12, 700);
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 12. Internal resistance                                                */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 12, id: 'u2-internal-resistance',
    title: 'Real batteries: internal resistance and terminal voltage',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">So far batteries have been perfect: always exactly ε across their terminals. Real batteries have a little resistance inside them — the chemicals and plates also make charges collide. That hidden resistance steals some voltage whenever current flows.</p>

<h2>Model: an ideal battery plus a small resistor</h2>
<p>Treat a real battery as an ideal emf \\(\\varepsilon\\) in series with an <b>internal resistance</b> \\(r\\), both hidden inside the case. The voltage you can actually measure across the two terminals is the <b>terminal voltage</b>. Walk through the battery from − to +: up by \\(\\varepsilon\\), then down by \\(Ir\\) across the internal resistor:</p>
<div class="eq">\\[ \\Delta V_{\\text{terminal}} = \\varepsilon - Ir \\]
<div class="where">where \\(\\varepsilon\\) = emf (V), \\(I\\) = current through the battery (A), \\(r\\) = internal resistance (Ω). With a load resistor \\(R\\) connected, \\(I = \\dfrac{\\varepsilon}{R + r}\\) — the internal resistance is just one more resistor in series.</div></div>
<ul>
<li><b>No current</b> (nothing connected, or an ideal voltmeter only): \\(\\Delta V_{\\text{terminal}} = \\varepsilon\\). That's how you measure emf.</li>
<li><b>More current</b> → bigger internal drop → lower terminal voltage. Car headlights dim when you start the engine because the starter motor draws a huge current.</li>
<li><b>Short circuit</b> (a bare wire, R ≈ 0): \\(I = \\varepsilon/r\\), the largest possible current, and the terminal voltage drops to zero. All the energy is dumped as heat inside the battery — it gets hot, and can be dangerous.</li>
</ul>
<p><b>Example.</b> A 9.0 V battery with \\(r = 1.0\\ \\Omega\\) powers an 8.0 Ω resistor: \\(I = 9/9 = 1.0\\) A, terminal voltage \\(= 9 - 1(1) = 8.0\\) V. The load gets 8 W; 1 W is wasted inside the battery.</p>

<div class="sim">
  <canvas data-c="sch"></canvas>
  <canvas data-c="g"></canvas>
  <div class="sim-controls">
    ${slider('emf', 'ε', 1.5, 12, 0.5, 9)}
    ${slider('r', 'Internal r', 0, 4, 0.1, 1)}
    ${slider('R', 'Load R', 0, 20, 0.5, 8)}
  </div>
  <div class="sim-readout"><span>I = <b data-o="I"></b></span><span>Terminal ΔV = <b data-o="vt"></b></span><span>Power to load: <b data-o="pl"></b></span><span>Wasted inside: <b data-o="pr"></b></span></div>
  <div class="sim-caption">The graph is terminal voltage versus current: a straight line starting at ε (no current) and sloping down with slope −r. Lower the load resistance to draw more current and watch the operating point slide down the line. Set R = 0 for a short circuit.</div>
</div>

<div class="callout analogy"><div class="title">Analogy</div>A water pump with a narrow outlet pipe inside it. When little water flows, you get nearly the full pump pressure at the outlet. Open the tap wide and the narrow internal pipe eats up a lot of the pressure before the water even leaves the pump.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Assuming the voltage across a battery's terminals is always ε. Only when no current flows. Also, in a parallel circuit with a real battery, adding a branch increases the current, lowers the terminal voltage, and slightly dims the bulbs that were already there.</div>

<div class="callout ap"><div class="title">On the AP exam</div>A classic lab: measure terminal voltage and current for several load resistors, graph ΔV vs I, and read ε from the vertical intercept and r from (minus) the slope.</div>

<div class="check" data-answer="1"><div class="q">A battery reads 6.0 V with nothing connected. With a 2.0 Ω resistor connected, it reads 5.0 V. What is its internal resistance?</div>
<div class="opts"><button>0.2 Ω</button><button>0.4 Ω</button><button>1.0 Ω</button><button>2.5 Ω</button></div>
<div class="why">ε = 6.0 V. Current through the load: \\(I = 5.0/2.0 = 2.5\\) A. Internal drop: \\(6.0 - 5.0 = 1.0\\) V \\(= Ir\\), so \\(r = 1.0/2.5 = 0.4\\ \\Omega\\).</div></div>
`;
      const s = { emf: ctl(el, 'emf'), r: ctl(el, 'r'), R: ctl(el, 'R') };
      const load = Res('load R', 8);
      const circ = { emf: 9, r: 1, net: ser(load) };
      function sync() {
        circ.emf = +s.emf.value; circ.r = +s.r.value; load.R = +s.R.value;
        out(el, 'emf', circ.emf + ' V'); out(el, 'r', circ.r.toFixed(1) + ' Ω'); out(el, 'R', load.R + ' Ω');
        solveCirc(circ);
        const short = circ.short;
        out(el, 'I', short ? '∞ (ideal short!)' : num(circ.I) + ' A');
        out(el, 'vt', short ? '—' : num(circ.Vt) + ' V');
        out(el, 'pl', short ? '—' : num(circ.I * circ.I * load.R) + ' W');
        out(el, 'pr', short ? '—' : num(circ.I * circ.I * circ.r) + ' W');
      }
      sync();
      Object.values(s).forEach((x) => on(b, x, 'input', sync));
      circuitSim(b, el.querySelector('[data-c="sch"]'), () => circ, { colorV: true, dots: true, labels: 'full', showR: true, dotK: 0.4 });
      canvasSim(b, el.querySelector('[data-c="g"]'), (w) => (w < 520 ? 0.65 : 0.4), (v) => {
        const th = theme(), ctx = v.ctx;
        bgFill(v);
        const e = circ.emf, r = Math.max(circ.r, 1e-6);
        const Imax = Math.min(30, e / Math.max(r, 0.25));
        const g = { x: 50, y: 18, w: v.w - 70, h: v.h - 52 };
        const a = axes(ctx, g, [0, Imax * 1.05], [0, 12.5], { yt: 2, xl: 'current I (A)', yl: 'terminal ΔV (V)' });
        ctx.strokeStyle = th.accent; ctx.lineWidth = 2.5; ctx.beginPath();
        ctx.moveTo(a.X(0), a.Y(e)); const Iend = Math.min(Imax * 1.05, e / r); ctx.lineTo(a.X(Iend), a.Y(e - Iend * circ.r)); ctx.stroke();
        text(ctx, `intercept = ε = ${tnum(e)} V`, a.X(0) + 8, a.Y(e) - 12, th.accent, 11, 600, 'left');
        text(ctx, `slope = −r = −${tnum(circ.r)} Ω`, a.X(Iend * 0.55) + 6, a.Y(e - Iend * 0.55 * circ.r) + 16, th.muted, 11, 600, 'left');
        if (!circ.short && circ.I <= Imax * 1.05) {
          ctx.fillStyle = th.warn; ctx.beginPath(); ctx.arc(a.X(circ.I), a.Y(circ.Vt), 6, 0, 7); ctx.fill();
          text(ctx, 'operating point', a.X(circ.I), a.Y(circ.Vt) - 14, th.warn, 11, 700);
        }
        font(ctx, 11); ctx.fillStyle = th.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (let k = 0; k <= 4; k++) { const I = (k / 4) * Imax; ctx.fillText(tnum(I, 2), a.X(I), g.y + g.h + 4); }
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 13. Meters                                                             */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 13, id: 'u2-meters',
    title: 'Ammeters and voltmeters: measuring without disturbing',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">To measure something you have to connect a meter to it — and the meter becomes part of the circuit. A good meter is designed so that adding it changes almost nothing. Where you put it matters as much as what it is.</p>

<h2>Ammeter: measures current, goes <em>in series</em></h2>
<p>To count the charge flowing through a bulb, the charge has to flow through the meter too. So you break the circuit and insert the ammeter in line, in series with the bulb. To avoid changing the current it measures, an ideal ammeter has <b>zero resistance</b> (no voltage drop across it).</p>

<h2>Voltmeter: measures potential difference, goes <em>in parallel</em></h2>
<p>To compare the potential at two points, touch the voltmeter's two leads to those points — across the component, in parallel with it. To avoid stealing current from the component, an ideal voltmeter has <b>infinite resistance</b> (no current through it).</p>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${select('cfg', 'Meter', ['Ammeter in series ✓', 'Voltmeter across R₂ ✓', 'Ammeter across R₂ ✗', 'Voltmeter in series ✗'])}
    ${slider('q', 'Meter quality', 0, 3, 1, 3)}
  </div>
  <div class="sim-readout"><span>Meter reads: <b data-o="read"></b></span><span>True value without meter: <b data-o="truth"></b></span><span data-o="note"></span></div>
  <div class="sim-caption">Circuit: 12 V battery, R₁ = 100 Ω and R₂ = 200 Ω in series (true current 0.04 A, true voltage across R₂ = 8 V). Lower the meter quality to see a real meter disturb the circuit. Then try the two wrong placements.</div>
</div>

<h2>What goes wrong with the wrong placement</h2>
<ul>
<li><b>Ammeter across a component (in parallel):</b> its near-zero resistance is a <em>short</em> around that component. Almost all the current detours through the ammeter, the component goes dark, the total current jumps, and a real ammeter's fuse can blow.</li>
<li><b>Voltmeter in series:</b> its huge resistance is basically an <em>open circuit</em>. The current drops to nearly zero, bulbs go out, and the voltmeter reads almost the full battery emf (all the drop happens across it).</li>
</ul>

<div class="callout analogy"><div class="title">Analogy</div>An ammeter is a turnstile in a hallway: everyone must pass through it, and a good one doesn't slow anyone down. A voltmeter is a person with an altimeter comparing two floors: they don't stand in the hallway at all; they just peek at two levels.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Mixing up the ideal resistances. Ammeter: <b>series, ~0 Ω</b>. Voltmeter: <b>parallel, ~∞ Ω</b>. Remember: each is designed so it doesn't change the very thing it measures.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Lab design questions ask you to draw where meters go to determine a resistance with Ohm's law: ammeter in series with the resistor, voltmeter in parallel across it, then R = ΔV/I (best: the slope of a graph from several readings).</div>

<div class="check" data-answer="3"><div class="q">A student accidentally connects a voltmeter in series with a bulb and battery. What happens?</div>
<div class="opts"><button>The bulb gets brighter</button><button>The voltmeter reads zero</button><button>The meter is destroyed by a huge current</button><button>The bulb barely glows and the voltmeter reads nearly the battery's emf</button></div>
<div class="why">The voltmeter's huge resistance cuts the current to almost zero; nearly all of the battery's emf drops across the voltmeter.</div></div>
`;
      const sc = ctl(el, 'cfg'), sq = ctl(el, 'q');
      const RA = [10, 1, 0.1, 0.001], RV = [500, 5000, 1e5, 1e7];
      const qn = ['poor', 'okay', 'good', 'nearly ideal'];
      let circ = null, meter = null;
      function build() {
        const k = +sc.value, q = +sq.value;
        const R1 = Res('R₁', 100), R2 = Res('R₂', 200);
        if (k === 0 || k === 2) meter = Meter('A', 'ammeter', RA[q]); else meter = Meter('V', 'voltmeter', RV[q]);
        meter.lab = `${tnum(meter.R)} Ω`;
        const net = k === 0 ? ser(R1, R2, meter) : k === 1 ? ser(R1, par(R2, meter)) : k === 2 ? ser(R1, par(R2, meter)) : ser(R1, R2, meter);
        circ = { emf: 12, net };
        out(el, 'q', qn[q]);
      }
      build();
      [sc, sq].forEach((x) => on(b, x, 'input', build));
      circuitSim(b, el.querySelector('canvas'), () => circ, {
        colorV: true, dots: true, labels: 'full', dotK: 25,
        after: () => {
          const k = +sc.value;
          const reading = meter.k === 'A' ? meter.I : meter.V;
          out(el, 'read', `${num(reading)} ${meter.k === 'A' ? 'A' : 'V'}`);
          out(el, 'truth', k === 0 ? '0.04 A (current)' : k === 1 ? '8 V (across R₂)' : k === 2 ? '0.04 A — but this placement shorts R₂!' : '8 V across R₂ — but this placement breaks the circuit!');
          out(el, 'note', k === 2 ? `Current through R₂ is now only <b>${num(leaves(circ.net)[1].I)} A</b>` : k === 3 ? `Circuit current is now only <b>${num(circ.I)} A</b>` : `Error: <b>${num(Math.abs(reading - (k === 0 ? 0.04 : 8)) / (k === 0 ? 0.04 : 8) * 100, 2)}%</b>`);
        },
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 14. Brightness reasoning                                               */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 14, id: 'u2-brightness',
    title: 'Bulb brightness puzzles: what-if reasoning',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">Many AP questions have no numbers at all: “bulb B is removed — what happens to bulb A?” You can answer every one of them with the same three-step chain of reasoning. Practise it here, then check yourself with the sim.</p>

<h2>The chain of reasoning</h2>
<ol>
<li><b>What happens to the total resistance?</b> Removing a bulb from a parallel group raises \\(R_{\\text{eq}}\\); removing one from a series path breaks it (\\(R \\to \\infty\\)). Shorting a bulb with a wire replaces it with 0 Ω. Adding in series raises \\(R_{\\text{eq}}\\); adding in parallel lowers it.</li>
<li><b>What happens to the battery current?</b> \\(I = \\varepsilon/R_{\\text{eq}}\\): goes the opposite way to \\(R_{\\text{eq}}\\).</li>
<li><b>Follow the current and voltage to the bulb you care about.</b> A bulb in series with the battery carries the battery current, so its brightness (\\(P = I^2R\\)) follows it. For a bulb in a parallel group, find the voltage across the group: \\(\\varepsilon\\) minus the drops in series with it. More drop elsewhere means less voltage left for the group.</li>
</ol>
<p>Identical bulbs: more current ⇔ more voltage ⇔ more power ⇔ brighter.</p>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${select('pre', 'Circuit', ['A in series with (B ∥ C)', 'A ∥ (B + C)', 'A + B + C in series', '(A ∥ B) + (C ∥ D)', 'A + (B ∥ (C + D))'])}
    ${button('reset', 'Reset bulbs')}
  </div>
  <div class="sim-readout"><span data-o="tbl"></span></div>
  <div class="sim-caption"><b>Tap a bulb</b> to cycle it: normal → removed (unscrewed, open) → shorted (a wire across it) → normal. Brightness is shown relative to one bulb alone on the same battery. All bulbs identical; ideal battery.</div>
</div>

<h2>Worked puzzle</h2>
<p>A is in series with the parallel pair B ∥ C. Initially A carries the full current \\(I\\); B and C each get \\(I/2\\). So A is brightest (4× the power of B or C, since \\(P = I^2R\\)).</p>
<p><b>Remove C.</b> Step 1: the parallel group becomes just B, so its resistance goes from \\(R/2\\) up to \\(R\\); total goes from \\(1.5R\\) to \\(2R\\). Step 2: battery current drops, so A <b>dims</b>. Step 3: A now takes less of the battery's voltage (\\(\\Delta V_A = IR\\) is smaller), leaving more for B: B goes from \\(\\varepsilon/3\\) to \\(\\varepsilon/2\\) and <b>brightens</b>. Try it in the sim.</p>

<div class="callout analogy"><div class="title">Analogy</div>Think of the battery's voltage as a budget shared along any path. If one part of the path takes less, the rest gets more. If the overall path gets harder (more resistance), less money (current) flows overall.</div>

<div class="callout mistake"><div class="title">Common mistake</div>“Removing a bulb means more current for the others.” Not necessarily! Removing a bulb from a parallel group <em>raises</em> the total resistance, so the battery current goes <em>down</em>. Bulbs in series with the battery get dimmer; it's only the remaining bulbs in that parallel group that can get brighter.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Write the chain explicitly in your justification: “When bulb C is removed, the equivalent resistance increases, so the current through the battery and bulb A decreases, so bulb A dims. The potential difference across A decreases, so the potential difference across B increases, so B brightens.”</div>

<div class="check" data-answer="2"><div class="q">Three identical bulbs are in parallel across an ideal battery. One is unscrewed. The other two…</div>
<div class="opts"><button>get brighter</button><button>get dimmer</button><button>stay the same</button><button>go out</button></div>
<div class="why">Each parallel branch has the full battery voltage regardless of the others, so their power \\(V^2/R\\) is unchanged. (The battery current drops by a third.)</div></div>

<div class="check" data-answer="0"><div class="q">Bulbs A and B are in series. A wire is connected across B (shorting it). What happens to A?</div>
<div class="opts"><button>It gets brighter</button><button>It gets dimmer</button><button>It stays the same</button><button>It goes out</button></div>
<div class="why">B is bypassed, so total resistance falls from 2R to R. The current doubles and A now has the full battery voltage: 4× the power.</div></div>

<div class="check" data-answer="1"><div class="q">Circuit A ∥ (B + C): which is brightest?</div>
<div class="opts"><button>B and C equally, brighter than A</button><button>A</button><button>All the same</button><button>C, because it's last</button></div>
<div class="why">A has the full ε across it. B and C share ε, each getting ε/2, so each has ¼ of A's power.</div></div>
`;
      const sp = ctl(el, 'pre');
      const R = 10, EMF = 12;
      const B = (n) => Bulb(n, R);
      const presets = [
        () => ser(B('A'), par(B('B'), B('C'))),
        () => par(B('A'), ser(B('B'), B('C'))),
        () => ser(B('A'), B('B'), B('C')),
        () => ser(par(B('A'), B('B')), par(B('C'), B('D'))),
        () => ser(B('A'), par(B('B'), ser(B('C'), B('D')))),
      ];
      let circ = { emf: EMF, net: presets[0]() };
      const load = () => { circ = { emf: EMF, net: presets[+sp.value]() }; };
      on(b, sp, 'input', load);
      on(b, ctl(el, 'reset'), 'click', load);
      const Pone = (EMF * EMF) / R;
      circuitSim(b, el.querySelector('canvas'), () => circ, {
        colorV: true, dots: true, labels: 'name', Pref: Pone, dotK: 0.6,
        onTap: (h) => cycleState(h.n),
        after: () => {
          out(el, 'tbl', leaves(circ.net).map((n) => `${n.name}: <b>${n.state === 'open' ? 'off (removed)' : n.state === 'short' ? 'off (shorted)' : num(n.P / Pone, 3) + '×'}</b>`).join(' &nbsp; ') + (circ.short ? ' &nbsp; <b>Battery shorted!</b>' : ` &nbsp; Battery current: <b>${num(circ.I)} A</b>`));
        },
      });
      return b;
    },
  });

  /* ===================================================================== */
  /* 15. Potential at points & ground                                       */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 15, id: 'u2-potential-points',
    title: 'Potential at points in a circuit, and grounding',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">Every point in a circuit has a potential — a height on the roller coaster. Only <em>differences</em> in height are physical, so we're free to call any one point "zero." That chosen point is the <b>ground</b>.</p>

<h2>Wires are flat, components are slopes</h2>
<p>An ideal wire has no resistance, so there's no drop along it: every point on one continuous stretch of wire (up to the next component) is at the same potential. So "the potential at point P" really means "the potential of the whole wire P sits on." To find it, start from a point you know, and walk to P adding up the changes (loop-rule signs): \\(+\\varepsilon\\) through a battery − to +, \\(-IR\\) through a resistor along the current.</p>

<h2>Grounding</h2>
<p>A ground symbol (⏚) marks the point defined to be at 0 V. Moving the ground shifts <em>every</em> potential by the same amount — like measuring heights from the floor versus from the table top — but it never changes any potential <em>difference</em>, current, or brightness.</p>
<div class="eq">\\[ \\Delta V_{AB} = V_B - V_A \\]
<div class="where">where \\(V_A, V_B\\) = potentials of points A and B (V), each measured from the same ground. \\(\\Delta V_{AB}\\) doesn't depend on where the ground is.</div></div>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${select('mode', 'Tap a wire to', ['place point A', 'place point B', 'move the ground ⏚'])}
    ${slider('emf', 'Battery', 3, 18, 1, 12)}
  </div>
  <div class="sim-readout"><span>V<sub>A</sub> = <b data-o="va"></b></span><span>V<sub>B</sub> = <b data-o="vb"></b></span><span>V<sub>B</sub> − V<sub>A</sub> = <b data-o="dv"></b></span></div>
  <div class="sim-caption">Circuit: R₁ = 2 Ω in series with (R₂ = 6 Ω ∥ (R₃ = 1 Ω + R₄ = 2 Ω)). Wire colours show potential (red high, blue low). Place A and B on any two wires — even in different branches — then move the ground. Both potentials change; their difference doesn't.</div>
</div>

<p><b>Example</b> (12 V, ground at the battery's − terminal): R<sub>eq</sub> = 2 + (6 ∥ 3) = 4 Ω, so the battery current is 3 A. The + terminal's wire is at 12 V. Through R₁ the drop is 3 × 2 = 6 V, so the junction after R₁ is at 6 V — and so is the whole top of the parallel group. The right branch (R₃ + R₄ = 3 Ω) carries 6/3 = 2 A, so R₃ drops 2 V: the wire between R₃ and R₄ is at 4 V. R₄ drops the remaining 4 V to 0. Potential difference between the top of R₂ and the R₃–R₄ wire: 6 − 4 = 2 V, even though they're in different branches.</p>

<div class="callout analogy"><div class="title">Analogy</div>Elevation: Denver is "1600 m above sea level," but you could just as well measure from the Dead Sea. The height of a mountain <em>above Denver</em> doesn't depend on which zero you pick.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Thinking a point has no potential if no current flows through it. A wire dangling from the + terminal with nothing attached is still at the + terminal's potential. Potential is about position on the "height map," not about flow.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Questions like “What is the potential difference between points X and Y?” where X and Y are in different branches. Walk from X to Y along any path, adding changes with correct signs — every path gives the same answer.</div>

<div class="check" data-answer="1"><div class="q">The − terminal of a 9 V battery is grounded. Current flows through a 3 Ω and a 6 Ω resistor in series (1 A). What is the potential of the wire between the two resistors (3 Ω first, starting from the + terminal)?</div>
<div class="opts"><button>3 V</button><button>6 V</button><button>9 V</button><button>−3 V</button></div>
<div class="why">Start at + (9 V), go through the 3 Ω along the current: drop \\(IR = 3\\) V. \\(9 - 3 = 6\\) V. (Check from ground: up through the 6 Ω against the current: \\(0 + 6 = 6\\) V.)</div></div>
`;
      const sm = ctl(el, 'mode'), se = ctl(el, 'emf');
      const circ = { emf: 12, net: ser(Res('R₁', 2), par(Res('R₂', 6), ser(Res('R₃', 1), Res('R₄', 2)))) };
      const syncE = () => { circ.emf = +se.value; out(el, 'emf', circ.emf + ' V'); };
      syncE(); on(b, se, 'input', syncE);
      let marks = { A: null, B: null, G: null }; // unit coords
      let lastE = null;
      const toU = (E, px, py) => ({ x: (px - E.ox) / E.u, y: (py - E.oy) / E.u });
      const nearestV = (E, m) => {
        let best = null, bd = 1e9;
        const px = E.X(m.x), py = E.Y(m.y);
        for (const s of E.segs) {
          const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy || 1;
          const t = clamp(((px - s.x1) * dx + (py - s.y1) * dy) / L2, 0, 1);
          const dd = Math.hypot(s.x1 + t * dx - px, s.y1 + t * dy - py);
          if (dd < bd) { bd = dd; best = s.V; }
        }
        return best;
      };
      circuitSim(b, el.querySelector('canvas'), () => circ, {
        colorV: true, dots: false, labels: 'value',
        onWire: (hit, E) => {
          const k = ['A', 'B', 'G'][+sm.value];
          marks[k] = toU(E, hit.x, hit.y);
          if (k === 'A') sm.value = '1'; else if (k === 'B') sm.value = '0';
        },
        after: (ctx, E) => {
          lastE = E;
          const th = theme();
          if (!marks.G) marks.G = { x: E.d.xR, y: E.d.yb };
          const gV = nearestV(E, marks.G);
          // ground symbol
          const gx = E.X(marks.G.x), gy = E.Y(marks.G.y);
          ctx.strokeStyle = th.good; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + 14);
          [12, 8, 4].forEach((w, i) => { ctx.moveTo(gx - w, gy + 14 + i * 4); ctx.lineTo(gx + w, gy + 14 + i * 4); });
          ctx.stroke();
          text(ctx, '0 V', gx + 16, gy + 18, th.good, 11, 700, 'left');
          const vals = {};
          ['A', 'B'].forEach((k) => {
            const m = marks[k];
            if (!m) return;
            const V = nearestV(E, m) - gV; vals[k] = V;
            const x = E.X(m.x), y = E.Y(m.y);
            ctx.fillStyle = th.accent; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
            text(ctx, k, x, y, th.surface, 10, 700);
            const lab = `${k}: ${tnum(V)} V`;
            font(ctx, 12, 700);
            const w = ctx.measureText(lab).width + 10;
            ctx.fillStyle = alpha(th.surface, 0.9); ctx.fillRect(x + 10, y - 26, w, 18);
            text(ctx, lab, x + 15, y - 17, th.accent, 12, 700, 'left');
          });
          out(el, 'va', vals.A != null ? num(vals.A) + ' V' : '<span class="muted">tap a wire</span>');
          out(el, 'vb', vals.B != null ? num(vals.B) + ' V' : '<span class="muted">tap a wire</span>');
          out(el, 'dv', vals.A != null && vals.B != null ? num(vals.B - vals.A) + ' V' : '—');
        },
      });
      void lastE;
      return b;
    },
  });

  /* ===================================================================== */
  /* 16. Capacitors in series and parallel                                  */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 16, id: 'u2-capacitor-combos',
    title: 'Capacitors in series and parallel',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">From electrostatics: a capacitor is two plates that store equal and opposite charge, with \\(Q = C\\Delta V\\) and stored energy \\(U = \\tfrac12 Q\\Delta V\\). Now connect several to a battery. They combine by rules that look like the resistor rules — but swapped.</p>

<h2>Parallel: same voltage, charges add</h2>
<p>Capacitors in parallel each sit across the same two junctions, so each has the full \\(\\Delta V\\). Each stores \\(Q_k = C_k\\Delta V\\), and the total charge is the sum. It's like one capacitor with bigger plates:</p>
<div class="eq">\\[ C_{\\text{eq}} = C_1 + C_2 + C_3 + \\cdots \\quad\\text{(parallel)} \\]
<div class="where">where \\(C\\) = capacitance in farads (F; often µF = \\(10^{-6}\\) F). Parallel always <em>increases</em> the total capacitance.</div></div>

<h2>Series: same charge, voltages add</h2>
<p>In series, the right plate of \\(C_1\\) and the left plate of \\(C_2\\) are connected by a wire that's isolated from everything else. It started neutral, so if \\(+Q\\) shows up on one plate, \\(-Q\\) must show up on the other: <b>every series capacitor carries the same charge \\(Q\\)</b>. The voltages add to the battery's: \\(\\Delta V = Q/C_1 + Q/C_2 + \\cdots\\). Dividing by \\(Q\\):</p>
<div class="eq">\\[ \\frac{1}{C_{\\text{eq}}} = \\frac{1}{C_1} + \\frac{1}{C_2} + \\cdots \\quad\\text{(series)} \\]
<div class="where">Series always <em>decreases</em> the total, below the smallest one. It's like one capacitor with a wider gap. Two equal capacitors in series: \\(C/2\\).</div></div>
<p><b>Example.</b> 3 µF and 6 µF in series on 12 V: \\(C_{\\text{eq}} = 2\\) µF, \\(Q = 24\\) µC on each. Voltages: \\(24/3 = 8\\) V and \\(24/6 = 4\\) V (add to 12 ✓). The <em>smaller</em> capacitor gets the <em>bigger</em> voltage.</p>

<div class="sim">
  <canvas></canvas>
  <div class="sim-controls">
    ${select('pre', 'Arrangement', ['C₁ and C₂ in series', 'C₁ and C₂ in parallel', 'C₁ in series with (C₂ ∥ C₃)'])}
    ${slider('v', 'Battery', 1, 24, 1, 12)}
    ${slider('c1', 'C₁ (µF)', 1, 10, 1, 3)}
    ${slider('c2', 'C₂ (µF)', 1, 10, 1, 6)}
    ${slider('c3', 'C₃ (µF)', 1, 10, 1, 3)}
  </div>
  <div class="sim-readout"><span>C<sub>eq</sub> = <b data-o="ceq"></b></span><span>Charge from battery = <b data-o="q"></b></span><span>Total energy stored = <b data-o="u"></b></span></div>
  <div class="sim-caption">Labels show each capacitor's charge and voltage once fully charged. Check the rules: in series the charges match and the voltages add; in parallel the voltages match and the charges add.</div>
</div>

<div class="callout analogy"><div class="title">Analogy</div>Capacitors combine the opposite way to resistors because capacitance grows with plate <em>area</em> (parallel = more area) and shrinks with <em>gap</em> (series = bigger total gap). Resistance is the reverse: more lanes (parallel) = less resistance.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Using the resistor formulas for capacitors. Parallel capacitors <b>add directly</b>; series capacitors use the <b>reciprocal</b> rule. Double-check: does your answer make series smaller and parallel bigger?</div>

<div class="callout ap"><div class="title">On the AP exam</div>Expect equal-charge reasoning for series and equal-voltage reasoning for parallel, plus energy \\(U = \\tfrac12 C(\\Delta V)^2\\). Questions often ask which capacitor stores the most energy: in parallel, the biggest C; in series (same Q, \\(U = Q^2/2C\\)), the smallest C.</div>

<div class="check" data-answer="2"><div class="q">Two 4 µF capacitors in series are connected to a 10 V battery. What charge is on each?</div>
<div class="opts"><button>40 µC</button><button>80 µC</button><button>20 µC</button><button>10 µC</button></div>
<div class="why">Series: \\(C_{\\text{eq}} = 2\\) µF. \\(Q = C_{\\text{eq}}\\Delta V = 20\\) µC, the same on each (each has 5 V).</div></div>
`;
      const s = {}; ['pre', 'v', 'c1', 'c2', 'c3'].forEach((k) => (s[k] = ctl(el, k)));
      let circ = null;
      function build() {
        const C = [1, 2, 3].map((i) => Cap('C' + ['₁', '₂', '₃'][i - 1], +s['c' + i].value * 1e-6));
        const k = +s.pre.value;
        const net = k === 0 ? ser(C[0], C[1]) : k === 1 ? par(C[0], C[1]) : ser(C[0], par(C[1], C[2]));
        circ = { emf: +s.v.value, net };
        el.querySelector('[data-l="c3"]').style.display = k === 2 ? '' : 'none';
        out(el, 'v', s.v.value + ' V'); [1, 2, 3].forEach((i) => out(el, 'c' + i, s['c' + i].value));
        solveCaps(circ);
        out(el, 'ceq', num(circ.Ceq * 1e6) + ' µF');
        out(el, 'q', num(circ.Ceq * circ.emf * 1e6) + ' µC');
        out(el, 'u', num(0.5 * circ.Ceq * circ.emf * circ.emf * 1e6) + ' µJ');
      }
      build();
      Object.values(s).forEach((x) => on(b, x, 'input', build));
      circuitSim(b, el.querySelector('canvas'), () => circ, { colorV: true, dots: false, labels: 'full', solve: solveCaps });
      return b;
    },
  });

  /* ===================================================================== */
  /* 17. RC circuits                                                        */
  /* ===================================================================== */
  LESSONS.push({
    unit: 2, order: 17, id: 'u2-rc',
    title: 'Capacitors in circuits: charging, discharging, steady state',
    render(el) {
      const b = bag();
      el.innerHTML = `
<p class="lead">A capacitor in a circuit behaves completely differently at the start than at the end. An empty capacitor at first acts like a plain wire. Once it's full, it acts like a break in the circuit. Everything in between is a smooth slowdown.</p>

<h2>Charging, step by step</h2>
<ol>
<li><b>The instant the switch closes</b>, the capacitor is empty: \\(Q = 0\\), so \\(\\Delta V_C = Q/C = 0\\). There's no voltage across it — exactly like a wire. The full battery voltage lands on the resistor, so the current starts at its maximum, \\(I_0 = \\varepsilon/R\\).</li>
<li><b>As charge builds up</b>, \\(\\Delta V_C\\) rises. By the loop rule \\(\\varepsilon = \\Delta V_R + \\Delta V_C\\), so less is left for the resistor, and the current shrinks. Smaller current means the capacitor fills more slowly — so it slows down more and more.</li>
<li><b>After a long time</b>, \\(\\Delta V_C = \\varepsilon\\), the resistor has no voltage, the current is zero. The full capacitor acts like an open switch. Final charge: \\(Q = C\\varepsilon\\).</li>
</ol>
<p>The bigger \\(R\\) (less current) or the bigger \\(C\\) (more charge to fill), the slower it happens. The product \\(RC\\) sets the time scale: it's mostly full after a few \\(RC\\).</p>

<h2>Discharging</h2>
<p>Disconnect the battery and connect the charged capacitor across the resistor. Now the capacitor is the "battery": it starts at \\(\\Delta V_C = \\varepsilon\\) and pushes current \\(\\varepsilon/R\\) the opposite way. As it loses charge its voltage drops, so the current drops — again a fast-then-slow fade to zero.</p>

<div class="sim">
  <canvas data-c="rc"></canvas>
  <div class="sim-controls">
    ${button('chg', 'Switch to battery (charge)')}
    ${button('dis', 'Switch to bypass (discharge)')}
    ${button('empty', 'Empty the capacitor')}
    ${slider('emf', 'ε', 3, 12, 1, 9)}
    ${slider('R', 'R (kΩ)', 1, 10, 0.5, 5)}
    ${slider('C', 'C (µF)', 100, 1000, 50, 400)}
  </div>
  <div class="sim-readout"><span>ΔV<sub>C</sub> = <b data-o="vc"></b></span><span>I = <b data-o="i"></b></span><span>Q = <b data-o="q"></b></span><span>Energy stored = <b data-o="u"></b></span><span>RC = <b data-o="tau"></b></span></div>
  <div class="sim-caption">Real-time. Graphs restart each time you flip the switch. Charging: capacitor voltage rises quickly then levels off at ε; the current starts at ε/R and fades to zero. Discharging: both fade, and the current flows the other way (dots reverse).</div>
</div>

<h2>Steady state in a bigger circuit</h2>
<p>The two rules of thumb solve almost every AP capacitor-in-a-circuit question:</p>
<ul>
<li><b>Just after closing (uncharged):</b> replace each capacitor with a <b>wire</b>.</li>
<li><b>Long after (steady state):</b> replace each capacitor with a <b>break</b> — no current in its branch. Then find the voltage across the capacitor's two ends from the rest of the circuit, and \\(Q = C\\Delta V\\).</li>
</ul>
<div class="sim">
  <canvas data-c="ss"></canvas>
  <div class="sim-controls">
    ${select('pre', 'Circuit', ['R₁ in series with (R₂ ∥ C)', '(R₁ + C) ∥ R₂', 'R₁ + C + R₂ in series'])}
    ${select('t', 'Time', ['just after closing (t = 0)', 'long after (steady state)'])}
  </div>
  <div class="sim-readout"><span data-o="ssr"></span></div>
  <div class="sim-caption">ε = 12 V, R₁ = 4 Ω, R₂ = 8 Ω, C = 10 µF. At t = 0 the empty capacitor carries current like a wire (shorting anything in parallel with it). In steady state its branch carries no current, and it holds the voltage of whatever it's in parallel with.</div>
</div>

<div class="eq">\\[ Q = C\\,\\Delta V_C, \\qquad U_C = \\tfrac12 C(\\Delta V_C)^2 \\]
<div class="where">where \\(\\Delta V_C\\) = voltage across the capacitor in steady state (V), \\(Q\\) = its charge (C), \\(U_C\\) = stored energy (J).</div></div>
<p><b>Example</b> (first circuit, steady state): no current through C, so the current is \\(12/(4+8) = 1\\) A through R₁ and R₂. C is in parallel with R₂, so \\(\\Delta V_C = 1\\times8 = 8\\) V and \\(Q = 10\\ \\mu\\text{F}\\times8\\ \\text{V} = 80\\ \\mu\\text{C}\\).</p>

<div class="callout analogy"><div class="title">Analogy</div>Filling a balloon from an air pump through a thin straw. At first air rushes in easily. As the balloon fills and pushes back harder, the flow slows. When the balloon's push equals the pump's, the flow stops — the balloon is "full," and air no longer moves through the straw.</div>

<div class="callout mistake"><div class="title">Common mistake</div>Thinking current flows <em>through</em> the capacitor's gap. No charge crosses the insulating gap: charge piles up on one plate while the same amount leaves the other plate, so it <em>looks</em> like current passes through while charging. In steady state, there's no current in a capacitor's branch at all.</div>

<div class="callout ap"><div class="title">On the AP exam</div>Sketch-the-graph questions: capacitor voltage and charge rise and level off (curving, never straight); current and resistor voltage start at a maximum and decay toward zero. Also: “immediately after the switch is closed” → capacitor = wire; “a long time after” → capacitor = open.</div>

<div class="check" data-answer="3"><div class="q">An uncharged capacitor in series with a resistor is connected to a battery. Immediately after the switch closes, the voltage across the resistor is…</div>
<div class="opts"><button>zero</button><button>half the battery voltage</button><button>increasing from zero</button><button>equal to the battery voltage</button></div>
<div class="why">The empty capacitor has \\(\\Delta V_C = 0\\), so by the loop rule all of ε is across the resistor. It then decreases as the capacitor charges.</div></div>

<div class="check" data-answer="1"><div class="q">Long after closing the switch in the circuit “(R₁ + C) ∥ R₂” with a 12 V battery, the voltage across C is…</div>
<div class="opts"><button>0 V</button><button>12 V</button><button>4 V</button><button>8 V</button></div>
<div class="why">No current in the C branch, so no drop across R₁. C's branch is directly across the battery: \\(\\Delta V_C = 12\\) V.</div></div>
`;
      /* ---- live RC ---- */
      const s = { emf: ctl(el, 'emf'), R: ctl(el, 'R'), C: ctl(el, 'C') };
      let q = 0, mode = 'charge', t = 0, hist = [], hp = {};
      const par_ = () => ({ e: +s.emf.value, R: +s.R.value * 1e3, C: +s.C.value * 1e-6 });
      const syncS = () => { out(el, 'emf', s.emf.value + ' V'); out(el, 'R', s.R.value); out(el, 'C', s.C.value); };
      syncS(); Object.values(s).forEach((x) => on(b, x, 'input', syncS));
      const flip = (m) => { mode = m; t = 0; hist = []; };
      on(b, ctl(el, 'chg'), 'click', () => flip('charge'));
      on(b, ctl(el, 'dis'), 'click', () => flip('discharge'));
      on(b, ctl(el, 'empty'), 'click', () => { q = 0; flip(mode); });
      canvasSim(b, el.querySelector('[data-c="rc"]'), (w) => (w < 520 ? 1.05 : 0.5), (v, dt) => {
        const th = theme(), ctx = v.ctx, P = par_(), tau = P.R * P.C;
        let I = 0;
        const n = 20, h = dt / n;
        for (let k = 0; k < n; k++) {
          I = mode === 'charge' ? (P.e - q / P.C) / P.R : -q / (P.C * P.R);
          q = Math.max(0, q + I * h);
        }
        I = mode === 'charge' ? (P.e - q / P.C) / P.R : -q / (P.C * P.R);
        t += dt;
        if (t <= 5 * tau + 0.05 && dt > 0) hist.push([t, q / P.C, I]);
        const Vc = q / P.C;
        out(el, 'vc', num(Vc) + ' V'); out(el, 'i', num(Math.abs(I) * 1e3) + ' mA' + (I < -1e-12 ? ' (reversed)' : ''));
        out(el, 'q', num(q * 1e6) + ' µC'); out(el, 'u', num(0.5 * P.C * Vc * Vc * 1e3) + ' mJ'); out(el, 'tau', num(tau) + ' s');
        bgFill(v);
        const narrow = v.w < 520;
        const cr = narrow ? { x: 20, y: 16, w: v.w - 40, h: v.h * 0.44 } : { x: 20, y: 20, w: v.w * 0.46 - 30, h: v.h - 40 };
        // --- schematic ---
        const xl = cr.x + cr.w * 0.1, xb = cr.x + cr.w * 0.3, xa = cr.x + cr.w * 0.38, xc = cr.x + cr.w * 0.5, xr = cr.x + cr.w * 0.9;
        const yt = cr.y + cr.h * 0.25, yb = cr.y + cr.h * 0.92;
        const W = (pts, col) => { ctx.strokeStyle = col || th.text; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1])); ctx.stroke(); };
        const ya = yt - 22, ybp = yt + 22;
        W([[xa, ya], [xl, ya], [xl, (ya + yb) / 2 - 8]]);
        compPx(ctx, 'bat', xl, (ya + yb) / 2 - 8, xl, (ya + yb) / 2 + 8, { plusFirst: true, label: `ε = ${P.e} V`, off: -40 });
        W([[xl, (ya + yb) / 2 + 8], [xl, yb], [xr, yb]]);
        W([[xa, ybp], [xb, ybp], [xb, yb]]);
        ctx.fillStyle = th.text; [[xa, ya], [xa, ybp], [xc, yt]].forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, 7); ctx.fill(); });
        W([[xc, yt], mode === 'charge' ? [xa + 2, ya + 2] : [xa + 2, ybp - 2]], th.accent);
        text(ctx, 'S', xc + 2, yt - 14, th.accent, 12, 700);
        const rx1 = xc + (xr - xc) * 0.2, rx2 = xc + (xr - xc) * 0.75;
        W([[xc, yt], [rx1, yt]]);
        compPx(ctx, 'R', rx1, yt, rx2, yt, { label: `R = ${s.R.value} kΩ`, off: -22 });
        W([[rx2, yt], [xr, yt], [xr, (yt + yb) / 2 - 6]]);
        // capacitor plates (horizontal plates on vertical branch)
        const cy = (yt + yb) / 2;
        ctx.strokeStyle = th.text; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(xr - 20, cy - 6); ctx.lineTo(xr + 20, cy - 6); ctx.moveTo(xr - 20, cy + 6); ctx.lineTo(xr + 20, cy + 6); ctx.stroke();
        W([[xr, cy + 6], [xr, yb]]);
        const nq = Math.round((q / (P.C * 12)) * 8);
        for (let k = 0; k < nq; k++) { const xx = xr - 18 + (k + 0.5) * (36 / Math.max(nq, 1)); text(ctx, '+', xx, cy - 14, th.pos, 11, 700); text(ctx, '−', xx, cy + 15, th.neg, 11, 700); }
        text(ctx, `C = ${s.C.value} µF`, xr - 28, cy, th.text, 12, 600, 'right');
        const loop = mode === 'charge'
          ? [[xl, (ya + yb) / 2 - 8], [xl, ya], [xa, ya], [xc, yt], [xr, yt], [xr, cy - 6]]
          : [[xr, cy - 6], [xr, yt], [xc, yt], [xa, ybp], [xb, ybp], [xb, yb]];
        const loop2 = mode === 'charge' ? [[xr, cy + 6], [xr, yb], [xl, yb], [xl, (ya + yb) / 2 + 8]] : [[xb, yb], [xr, yb], [xr, cy + 6]];
        const sign = mode === 'charge' ? 1 : -1;
        const Ik = (Math.abs(I) / (P.e / P.R)) * 60;
        pxDots(ctx, loop, Ik * (mode === 'charge' ? 1 : 1), hp.a = hp.a || {}, dt, 1, th.warn);
        pxDots(ctx, loop2, Ik, hp.b = hp.b || {}, dt, 1, th.warn);
        void sign;
        // --- graphs ---
        const gr = narrow ? { x: 46, y: v.h * 0.5 + 6, w: v.w - 60, h: v.h * 0.5 - 30 } : { x: v.w * 0.5 + 30, y: 16, w: v.w * 0.5 - 46, h: v.h - 40 };
        const g1 = { x: gr.x, y: gr.y, w: gr.w, h: gr.h / 2 - 16 }, g2 = { x: gr.x, y: gr.y + gr.h / 2 + 8, w: gr.w, h: gr.h / 2 - 16 };
        const T = 5 * tau;
        const a1 = axes(ctx, g1, [0, T], [0, 12], { yt: 4, xl: 'time', yl: 'ΔV_C (V)' });
        const a2 = axes(ctx, g2, [0, T], [-P.e / P.R * 1e3, P.e / P.R * 1e3], { xl: 'time', yl: 'I (mA)' });
        ctx.strokeStyle = th.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(g2.x, a2.Y(0)); ctx.lineTo(g2.x + g2.w, a2.Y(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(g1.x, a1.Y(P.e)); ctx.lineTo(g1.x + g1.w, a1.Y(P.e)); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, 'ε', g1.x + g1.w - 4, a1.Y(P.e) - 8, th.muted, 11, 700, 'right');
        for (let k = 1; k <= 5; k++) text(ctx, k + 'RC', a1.X(k * tau), g1.y + g1.h + 8, th.muted, 10, 500);
        [[a1, 1, th.accent], [a2, 2, th.warn]].forEach(([a, idx, col]) => {
          ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath();
          hist.forEach((p, i) => { const y = a.Y(idx === 2 ? p[2] * 1e3 : p[1]); if (i === 0) ctx.moveTo(a.X(p[0]), y); else ctx.lineTo(a.X(p[0]), y); });
          ctx.stroke();
        });
        text(ctx, mode === 'charge' ? 'charging' : 'discharging', gr.x + gr.w / 2, gr.y + 2, th.text, 12, 700, 'center', 'top');
      });

      /* ---- steady state solver ---- */
      const spre = ctl(el, 'pre'), st = ctl(el, 'tt') || ctl(el, 't');
      let circ2 = null;
      function build2() {
        const R1 = Res('R₁', 4), R2 = Res('R₂', 8), C = Cap('C', 10e-6);
        const k = +spre.value;
        const net = k === 0 ? ser(R1, par(R2, C)) : k === 1 ? par(ser(R1, C), R2) : ser(R1, C, R2);
        circ2 = { emf: 12, net, mode: +st.value === 0 ? 'initial' : 'final', C, R1, R2 };
      }
      build2();
      [spre, st].forEach((x) => on(b, x, 'input', build2));
      circuitSim(b, el.querySelector('[data-c="ss"]'), () => circ2, {
        colorV: true, dots: true, labels: 'full', dotK: 0.6,
        after: () => {
          const c = circ2;
          out(el, 'ssr', `Battery current <b>${num(c.I)} A</b> · current through C's branch <b>${num(c.C.I)} A</b> · ΔV<sub>C</sub> = <b>${num(c.C.V)} V</b> · Q = <b>${num(c.C.Q * 1e6)} µC</b>` +
            (c.mode === 'initial' ? ' <span class="muted">(capacitor acts like a wire)</span>' : ' <span class="muted">(capacitor acts like a break)</span>'));
        },
      });
      return b;
    },
  });
})();
