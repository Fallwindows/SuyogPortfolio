// AP Physics 1 · Unit 3 — Work, Energy, and Power: duel problem bank + visuals.
// Classic script loaded after problems.js, visuals.js and lesson-map.js. Pushes unit-13
// generators onto PRProblems.generators and registers the 'e-*' visual keys.
// Deterministic: every random choice comes from the rng passed to make().
(function () {
  'use strict';
  const PR = window.PR;
  const sig = PR.sig, fmt = PR.fmt;
  const { M, X, Q, B, rnd, giv, tx, mc } = PRProblems.helpers;
  const gens = PRProblems.generators;

  const g = 9.8;
  const G = { g: M('g = 9.8\\ \\text{m/s}^2') };
  const J = tx('J'), mps = tx('m/s'), m_ = tx('m'), kg = tx('kg'), N_ = tx('N'), W_ = tx('W'), s_ = tx('s'), cm = tx('cm');
  const deg = (d) => M(d + '^\\circ');

  // ======================================================================
  // VISUALS ('e-*')
  // ======================================================================
  const H = PRVisuals.h;
  const { svg, bg, title, line, dline, path, arrow, text, rect, circle, dim, textLines, num, si, isNum, clamp, r1, arr } = H;
  const fJ = (x) => si(x, 'J');
  const fv = (v) => num(v) + ' m/s';
  const val = (x) => (isNum(x) ? x : 0);
  function poly(pts, fill, op) {
    return '<path d="M' + pts.map((q) => r1(q[0]) + ' ' + r1(q[1])).join('L') + 'Z" style="fill:var(--' + fill +
      ');fill-opacity:' + op + ';stroke:none"/>';
  }
  function zigzag(x1, x2, y, amp, coils, c) {
    let d = 'M' + r1(x1) + ' ' + y;
    const n = coils * 2, step = (x2 - x1 - 16) / n;
    d += 'L' + r1(x1 + 8) + ' ' + y;
    for (let i = 0; i < n; i++) d += 'L' + r1(x1 + 8 + step * (i + 0.5)) + ' ' + r1(y + (i % 2 ? amp : -amp));
    d += 'L' + r1(x2 - 8) + ' ' + y + 'L' + r1(x2) + ' ' + y;
    return path(d, c || 'text', 2);
  }
  function cart(x, y, w, hgt, label) { // box on wheels, (x, y) = bottom-left on the ground
    return rect(x, y - hgt - 8, w, hgt, { fill: 'surface', stroke: 'text', sw: 2, rx: 5 }) +
      circle(x + w * 0.25, y - 6, 6, { fill: 'text' }) + circle(x + w * 0.75, y - 6, 6, { fill: 'text' }) +
      (label ? text(x + w / 2, y - hgt / 2 - 3, label, { a: 'middle', sz: 12, w: 600 }) : '');
  }

  // Energy bar chart: before | (external work) | after.
  // p.before / p.after: {K, Ug, Us, Eth} (missing = column not shown); p.W optional; p.rel hides numbers.
  const COLS = [['K', 'K', 'accent'], ['Ug', 'Ug', 'good'], ['Us', 'Us', 'warn'], ['Eth', 'ΔEth', 'pos']];
  function eBars(p) {
    const A = p.before || {}, Z = p.after || {};
    const cols = COLS.filter((c) => isNum(A[c[0]]) || isNum(Z[c[0]]));
    const hasW = isNum(p.W);
    const vals = [];
    cols.forEach((c) => vals.push(Math.abs(val(A[c[0]])), Math.abs(val(Z[c[0]]))));
    if (hasW) vals.push(Math.abs(p.W));
    const mx = Math.max(1e-12, ...vals);
    const negW = hasW && p.W < 0;
    const base = negW ? 170 : 236, sc = (negW ? 84 : 146) / mx;
    const unit = p.unit || 'J';
    const lab = (v) => (p.rel ? '' : unit === 'J' ? fJ(v) : num(v) + ' ' + unit);
    let b = bg() + title(p.title || 'Energy bar chart');
    const panel = (o0, x0, w, label) => {
      let o = rect(x0, 40, w, 248, { fill: 'surface', op: 0.5, stroke: 'border', sw: 1, rx: 10 }) +
        text(x0 + w / 2, 60, label, { a: 'middle', w: 700 });
      const n = cols.length, bw = Math.min(44, (w - 20) / n - 14), gap = (w - n * bw) / (n + 1);
      o += line(x0 + 8, base, x0 + w - 8, base, 'muted', 1.5);
      cols.forEach((c, i) => {
        const v = Math.max(0, val(o0[c[0]])), x = x0 + gap + i * (bw + gap), hh = v * sc;
        if (hh > 0.5) o += rect(x, base - hh, bw, hh, { fill: c[2], rx: 2 });
        if (!p.rel && isNum(o0[c[0]])) o += text(x + bw / 2, base - hh - 6, lab(v), { a: 'middle', sz: 10, halo: true });
        o += text(x + bw / 2, base + 17, c[1], { a: 'middle', w: 600, sz: 12 });
      });
      return o;
    };
    if (hasW) {
      b += panel(A, 12, 252, p.labels ? p.labels[0] : 'Before');
      b += rect(276, 40, 88, 248, { fill: 'surface', op: 0.5, stroke: 'accent', sw: 1.5, rx: 10 });
      b += text(320, 60, p.Wlabel || 'Work in', { a: 'middle', w: 700, c: 'accent', sz: 12 });
      const hh = Math.abs(p.W) * sc;
      b += line(284, base, 356, base, 'muted', 1.5);
      if (hh > 0.5) b += rect(300, p.W >= 0 ? base - hh : base, 40, hh, { fill: 'accent', op: 0.55, rx: 2 });
      if (!p.rel) b += text(320, p.W >= 0 ? base - hh - 6 : base + hh + 14, (p.W > 0 ? '+' : '') + lab(p.W), { a: 'middle', sz: 10, halo: true });
      b += text(320, negW ? 82 : base + 17, 'W', { a: 'middle', w: 600, sz: 12 });
      b += panel(Z, 376, 252, p.labels ? p.labels[1] : 'After');
    } else {
      b += panel(A, 16, 280, p.labels ? p.labels[0] : 'Before');
      b += arrow(302, 160, 338, 160, 'muted', 2.5);
      b += panel(Z, 344, 280, p.labels ? p.labels[1] : 'After');
    }
    const tot = (o) => cols.reduce((s, c) => s + val(o[c[0]]), 0);
    const note = p.note || (p.rel ? '' : 'Total: ' + fJ(tot(A)) + (hasW ? '  +  W (' + fJ(p.W) + ')' : '') + '  =  ' + fJ(tot(Z)));
    if (note) b += text(320, 308, note, { a: 'middle', sz: 12, w: 600 });
    return svg(p.title || 'Energy bar chart', b);
  }

  // A force and a displacement drawn from one block, with the angle between them.
  function eWork(p) {
    const fA = (isNum(p.fAng) ? p.fAng : 30) * Math.PI / 180, dA = (isNum(p.dAng) ? p.dAng : 0) * Math.PI / 180;
    const delta = Math.atan2(Math.sin(fA - dA), Math.cos(fA - dA));
    const th = Math.abs(delta) * 180 / Math.PI;
    const cosT = Math.cos(delta);
    const cx = 190, cy = 176;
    let b = bg() + title(p.title || 'Work = F d cos θ');
    if (Math.abs(Math.sin(dA)) < 0.01) b += line(30, cy + 26, 350, cy + 26, 'muted', 2);
    b += rect(cx - 34, cy - 25, 68, 50, { fill: 'surface', stroke: 'text', sw: 2, rx: 4 });
    const dx = Math.cos(dA), dy = -Math.sin(dA), fx = Math.cos(fA), fy = -Math.sin(fA);
    b += arrow(cx, cy, cx + dx * 140, cy + dy * 140, 'muted', 3);
    b += text(cx + dx * 158, cy + dy * 158 + 4, p.dLabel || 'd (motion)', { a: 'middle', c: 'muted', w: 600, sz: 12, halo: true });
    b += arrow(cx, cy, cx + fx * 112, cy + fy * 112, 'accent', 3.5);
    b += text(cx + fx * 132, cy + fy * 132 + 4, p.fLabel || 'F', { a: 'middle', c: 'accent', w: 700, sz: 13, halo: true });
    if (th > 2 && th < 178) {
      let d = '';
      for (let i = 0; i <= 24; i++) {
        const a = dA + (delta * i) / 24;
        d += (i ? 'L' : 'M') + r1(cx + 44 * Math.cos(a)) + ' ' + r1(cy - 44 * Math.sin(a));
      }
      b += path(d, 'warn', 2);
      const am = dA + delta / 2;
      b += text(cx + 60 * Math.cos(am), cy - 60 * Math.sin(am) + 4, 'θ', { a: 'middle', c: 'warn', w: 700, halo: true });
    }
    let y = 80;
    const right = (s, o) => { b += text(400, y, s, o || {}); y += 26; };
    right('θ = ' + num(th, 3) + '°', { w: 600 });
    right('cos θ = ' + num(Math.abs(cosT) < 1e-9 ? 0 : cosT, 3));
    if (isNum(p.F) && isNum(p.d)) right('W = (' + si(p.F, 'N') + ')(' + num(p.d) + ' m)(' + num(Math.abs(cosT) < 1e-9 ? 0 : cosT, 3) + ')');
    if (isNum(p.W)) right('W = ' + (p.W > 0 ? '+' : '') + fJ(p.W), { w: 700, c: 'accent', sz: 15 });
    const word = Math.abs(cosT) < 1e-6 ? 'Zero: the force is ⟂ to the motion.' : cosT > 0 ? 'Positive: the force helps the motion.' : 'Negative: the force opposes the motion.';
    b += textLines(400, y + 8, word, 28, { w: 600 }, 18);
    if (p.note) b += textLines(400, y + 52, p.note, 30, { cls: 'small' }, 15);
    return svg('Force and displacement: work done', b);
  }

  // Force–position graph; p.area shades the region under the curve.
  function niceStep(mx) { return [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find((s) => mx / s <= 6) || 1000; }
  function eFx(p) {
    const pts = arr(p.pts).filter((q) => Array.isArray(q) && isNum(q[0]) && isNum(q[1]));
    if (pts.length < 2) throw new Error('need points');
    const xMax = Math.ceil(Math.max(...pts.map((q) => q[0]))) + 1;
    const Fmax = Math.max(...pts.map((q) => q[1]));
    const st = niceStep(Fmax), yTop = Math.ceil((Fmax * 1.12) / st) * st;
    const x0 = 74, x1 = 610, y0 = 48, y1 = 268;
    const Xp = (x) => x0 + (x / xMax) * (x1 - x0), Yp = (F) => y1 - (F / yTop) * (y1 - y0);
    let b = bg() + title(p.title || 'Force vs position');
    for (let i = 0; i <= xMax; i++) {
      b += line(Xp(i), y0, Xp(i), y1, 'border', 1);
      b += text(Xp(i), y1 + 16, String(i), { a: 'middle', cls: 'small' });
    }
    for (let F = 0; F <= yTop + 1e-9; F += st) {
      b += line(x0, Yp(F), x1, Yp(F), 'border', 1);
      b += text(x0 - 8, Yp(F) + 4, String(F), { a: 'end', cls: 'small' });
    }
    if (isNum(p.area)) {
      const poly0 = pts.map((q) => [Xp(q[0]), Yp(q[1])]);
      poly0.push([Xp(pts[pts.length - 1][0]), Yp(0)], [Xp(pts[0][0]), Yp(0)]);
      b += poly(poly0, 'accent', 0.22);
      const mid = (pts[0][0] + pts[pts.length - 1][0]) / 2;
      b += text(Xp(mid), Yp(Fmax * 0.45) + 4, 'area = W = ' + fJ(p.area), { a: 'middle', w: 700, c: 'accent', halo: true });
    }
    b += line(x0, y1, x1, y1, 'text', 2) + line(x0, y0, x0, y1, 'text', 2);
    b += path('M' + pts.map((q) => r1(Xp(q[0])) + ' ' + r1(Yp(q[1]))).join('L'), 'accent', 3);
    b += text(x1, y1 + 34, 'x (m)', { a: 'end', cls: 'small' });
    b += text(x0 + 6, y0 - 8, 'F (N)', { cls: 'small' });
    return svg('Force versus position graph', b, 320);
  }

  // Track / drop / pendulum with heights and speeds at A and B, plus mini K–Ug bars.
  function eTrack(p) {
    const shape = p.shape || 'ramp';
    const hA = val(p.hA), hB = val(p.hB);
    const hTop = Math.max(hA, hB, val(p.hMax), 1e-9);
    const gy = 276, sc = 186 / hTop;
    const yA = gy - hA * sc, yB = gy - hB * sc;
    let b = bg() + title(p.title || 'Energy is conserved');
    let ax, ay, bx, by;
    if (shape === 'pendulum') {
      const px = 205, py = 46, L = 196, a0 = 48 * Math.PI / 180;
      ax = px - L * Math.sin(a0); ay = py + L * Math.cos(a0); bx = px; by = py + L;
      b += line(px - 60, py, px + 60, py, 'text', 3);
      let d = '';
      for (let i = 0; i <= 30; i++) { const a = -a0 + (2 * a0 * i) / 30; d += (i ? 'L' : 'M') + r1(px + L * Math.sin(a)) + ' ' + r1(py + L * Math.cos(a)); }
      b += path(d, 'muted', 1.5, ';stroke-dasharray:5 4');
      b += line(px, py, ax, ay, 'muted', 1.5) + line(px, py, bx, by, 'text', 1.5);
      b += dline(ax - 30, ay, 380, ay) + dline(ax - 30, by, 380, by);
      b += line(370, ay, 370, by, 'text', 1.5) + text(376, (ay + by) / 2 + 4, 'h', { w: 700 });
      b += circle(ax, ay, 11, { fill: 'accent' }) + circle(bx, by, 11, { fill: 'accent', op: 0.45 });
    } else if (shape === 'drop' || shape === 'up' || shape === 'lift') {
      ax = bx = 200; ay = yA - 11; by = yB - 11;
      b += line(20, gy, 400, gy, 'muted', 2);
      if (shape !== 'up') {
        if (hA > 0) b += line(140, yA, 260, yA, 'text', 3);
        if (hB > 0) b += line(140, yB, 260, yB, 'text', 3);
      }
      b += dline(ax, ay + (by > ay ? 14 : -14), bx, by + (by > ay ? -14 : 14), 'muted', 1.5);
      b += arrow(ax + 26, ay, bx + 26, by, 'muted', 2);
      b += circle(ax, ay, 11, { fill: 'accent' }) + circle(bx, by, 11, { fill: 'accent', op: 0.45 });
      const lo = Math.max(yA, yB), hi = Math.min(yA, yB);
      if (lo - hi > 6) b += line(330, lo, 330, hi, 'text', 1.5) + line(322, lo, 338, lo, 'text', 1.5) + line(322, hi, 338, hi, 'text', 1.5) +
        text(342, (lo + hi) / 2 + 4, 'Δh = ' + num(Math.abs(hA - hB)) + ' m', { sz: 12, halo: true });
    } else {
      b += line(20, gy, 400, gy, 'muted', 2);
      const ya = p.aMid ? gy : yA;
      const d = 'M40 ' + r1(ya) + ' C110 ' + r1(gy) + ' 150 ' + r1(gy) + ' 205 ' + r1(gy) + ' C260 ' + r1(gy) + ' 300 ' + r1(gy) + ' 370 ' + r1(yB);
      b += path(shape === 'valley' ? d : 'M40 ' + r1(yA) + ' C200 ' + r1(yA) + ' 210 ' + r1(yB) + ' 370 ' + r1(yB), 'text', 3);
      ax = p.aMid ? 205 : 40; ay = (p.aMid ? gy : yA) - 11; bx = 370; by = yB - 11;
      b += circle(ax, ay, 11, { fill: 'accent' }) + circle(bx, by, 11, { fill: 'accent', op: 0.45 });
    }
    const tagAt = (x, y, nm, h, v) => {
      const s = nm + ':  h = ' + num(h) + ' m' + (isNum(v) ? ',  v = ' + fv(v) : '');
      return text(clamp(x, 12, 396), y, s, { a: x < 120 ? 'start' : x > 300 ? 'end' : 'middle', sz: 12, w: 600, halo: true });
    };
    b += tagAt(ax - 10, ay - 20, p.nameA || 'A', hA, p.vA);
    b += tagAt(bx + (shape === 'pendulum' ? 0 : 10), shape === 'pendulum' ? by + 30 : by - 20, p.nameB || 'B', hB, p.vB);
    // mini bars: per-kg unless a mass is given
    const m = isNum(p.m) ? p.m : 1;
    const KA = 0.5 * m * val(p.vA) * val(p.vA), KB = 0.5 * m * val(p.vB) * val(p.vB), UA = m * 9.8 * hA, UB = m * 9.8 * hB;
    const Eth = val(p.Eth);
    const mx = Math.max(KA, KB, UA, UB, Eth, 1e-12);
    b += rect(420, 40, 206, 252, { fill: 'surface', op: 0.5, stroke: 'border', sw: 1, rx: 10 });
    b += text(523, 60, isNum(p.m) ? 'Energy (J)' : 'Energy per kg', { a: 'middle', w: 700, sz: 12 });
    const base = 250, H0 = 150;
    const bar = (x, v, c, l) => (v * H0 / mx > 0.5 ? rect(x, base - v * H0 / mx, 22, v * H0 / mx, { fill: c, rx: 2 }) : '') + text(x + 11, base + 15, l, { a: 'middle', sz: 10, w: 600 });
    b += line(428, base, 618, base, 'muted', 1.5);
    b += bar(436, KA, 'accent', 'K') + bar(462, UA, 'good', 'Ug');
    b += bar(526, KB, 'accent', 'K') + bar(552, UB, 'good', 'Ug');
    if (Eth > 0) b += bar(578, Eth, 'pos', 'ΔEth');
    b += text(462, base + 32, p.nameA || 'A', { a: 'middle', w: 700 }) + text(Eth > 0 ? 565 : 552, base + 32, p.nameB || 'B', { a: 'middle', w: 700 });
    if (p.note) b += textLines(430, 82, p.note, 30, { cls: 'small' }, 14);
    return svg(p.title || 'Energy conservation diagram', b);
  }

  // Compressed spring → block launched.
  function eSpring(p) {
    let b = bg() + title(p.title || 'Spring energy becomes kinetic energy');
    const fy = 240;
    b += line(30, fy, 620, fy, 'muted', 2) + rect(30, 120, 10, fy - 120, { fill: 'muted' });
    b += zigzag(40, 190, fy - 26, 13, 10, 'text');
    b += rect(190, fy - 52, 60, 52, { fill: 'surface', stroke: 'text', sw: 2, rx: 4 }) + text(220, fy - 22, 'm', { a: 'middle', w: 700 });
    b += dline(260, 110, 260, fy, 'muted');
    b += text(262, 102, 'natural length', { a: 'middle', cls: 'small' });
    b += dim(190, fy + 22, 260, 'x = ' + (isNum(p.x) ? H.fm(p.x) : 'x'));
    b += rect(470, fy - 52, 60, 52, { fill: 'surface', op: 0.5, stroke: 'accent', sw: 2, rx: 4, dash: '5 4' });
    b += arrow(536, fy - 26, 610, fy - 26, 'accent', 3);
    b += text(572, fy - 40, isNum(p.v) ? 'v = ' + fv(p.v) : 'v', { a: 'middle', c: 'accent', w: 700 });
    let y = 66;
    const add = (s, o) => { b += text(300, y, s, Object.assign({ a: 'middle' }, o || {})); y += 22; };
    if (isNum(p.k)) add('k = ' + num(p.k) + ' N/m' + (isNum(p.m) ? ',   m = ' + num(p.m) + ' kg' : ''), { sz: 12 });
    if (isNum(p.U)) add('Us = ½kx² = ' + fJ(p.U), { w: 700, c: 'warn' });
    if (isNum(p.U) && isNum(p.v)) add('→  K = ½mv² = ' + fJ(p.U), { w: 700, c: 'accent' });
    return svg('Spring launcher energy', b);
  }

  // Kinetic energy of a moving cart (optionally before → after).
  function eKe(p) {
    const states = [p];
    if (p.after && typeof p.after === 'object') states.push(Object.assign({}, p, p.after));
    const Kmax = Math.max(...states.map((s) => val(s.K) || 0.5 * val(s.m) * val(s.v) * val(s.v)), 1e-12);
    const vmax = Math.max(...states.map((s) => val(s.v)), 1e-12);
    let b = bg() + title(p.title || 'Kinetic energy  K = ½mv²');
    const w = states.length === 1 ? 600 : 300;
    states.forEach((s, i) => {
      const x0 = 20 + i * 310;
      const K = isNum(s.K) ? s.K : 0.5 * s.m * s.v * s.v;
      if (states.length > 1) b += text(x0 + 10, 62, i ? 'After' : 'Before', { w: 700, c: i ? 'accent' : null });
      b += line(x0, 200, x0 + w - 90, 200, 'muted', 2);
      b += cart(x0 + 20, 200, 90, 46, num(s.m) + ' kg');
      const L = 30 + 120 * val(s.v) / vmax;
      b += arrow(x0 + 116, 160, x0 + 116 + L, 160, 'accent', 3) + text(x0 + 116 + L / 2, 148, 'v = ' + fv(s.v), { a: 'middle', c: 'accent', w: 600, sz: 12 });
      const hh = 150 * K / Kmax, bx = x0 + w - 70;
      b += line(bx - 8, 250, bx + 46, 250, 'muted', 1.5) + rect(bx, 250 - hh, 38, hh, { fill: 'accent', rx: 2 }) + text(bx + 19, 266, 'K', { a: 'middle', w: 600 });
      b += text(x0 + 20, 236, 'K = ½(' + num(s.m) + ')(' + num(s.v) + ')² = ' + fJ(K), { sz: 12, w: 600 });
    });
    if (states.length > 1 && isNum(p.K) && isNum(states[1].K)) b += text(320, 300, 'K × ' + num(states[1].K / p.K, 3), { a: 'middle', w: 700, c: 'accent', sz: 15 });
    return svg('Kinetic energy of a moving cart', b);
  }

  // Stopping distance before vs after (same braking force).
  function eStop(p) {
    const d1 = val(p.d1), d2 = val(p.d2), dm = Math.max(d1, d2, 1e-9);
    let b = bg() + title(p.title || 'Same braking force: distance ∝ K');
    const row = (y, d, label, c) => {
      const L = 440 * d / dm;
      return text(30, y - 46, label, { w: 700, c: c }) + line(20, y, 620, y, 'muted', 1.5) + cart(30, y, 80, 34) +
        line(110, y - 2, 110 + L, y - 2, c || 'text', 4, ';stroke-dasharray:2 6') + dim(110, y + 22, 110 + L, 'd = ' + num(d) + ' m', c);
    };
    b += row(130, d1, p.label1 || 'Before', null);
    b += row(250, d2, p.label2 || 'After', 'accent');
    if (p.note) b += text(320, 306, p.note, { a: 'middle', sz: 12, w: 600 });
    return svg('Stopping distances compared', b);
  }

  // Power: motor lifting, car at constant speed, or two people compared.
  function ePower(p) {
    let b = bg() + title(p.title || 'Power = energy per time');
    let y = 84;
    const right = (s, o) => { b += text(340, y, s, o || {}); y += 26; };
    if (p.mode === 'drive' || p.mode === 'accel') {
      b += line(20, 240, 320, 240, 'muted', 2) + cart(90, 240, 110, 52, 'car');
      b += arrow(150, 120, 230, 120, 'accent', 3) + text(190, 108, isNum(p.v) ? 'v = ' + fv(p.v) : 'v', { a: 'middle', c: 'accent', w: 600 });
      if (p.mode === 'drive') {
        b += arrow(200, 205, 290, 205, 'good', 3) + text(292, 192, 'F (drive)', { a: 'end', c: 'good', sz: 12, w: 600 });
        b += arrow(90, 205, 30, 205, 'pos', 3) + text(30, 192, 'resistance', { c: 'pos', sz: 12, w: 600 });
        right('Constant speed → F_drive = F_resist', { sz: 12 });
        if (isNum(p.F)) right('F = ' + si(p.F, 'N'));
        right('P = Fv' + (isNum(p.P) ? ' = ' + si(p.P, 'W') : ''), { w: 700, c: 'accent', sz: 15 });
      } else {
        right('K: 0 → ½mv²' + (isNum(p.W) ? ' = ' + fJ(p.W) : ''));
        if (isNum(p.t)) right('t = ' + num(p.t) + ' s');
        right('P = ΔK / t' + (isNum(p.P) ? ' = ' + si(p.P, 'W') : ''), { w: 700, c: 'accent', sz: 15 });
      }
    } else if (p.mode === 'compare') {
      const A = p.A || {}, Bp = p.B || {};
      const mets = [['W ∝ m', val(A.m), val(Bp.m)], ['time', val(A.t), val(Bp.t)], ['P = W/t', val(A.m) / Math.max(val(A.t), 1e-9), val(Bp.m) / Math.max(val(Bp.t), 1e-9)]];
      mets.forEach((mt, i) => {
        const x0 = 40 + i * 200, mx = Math.max(mt[1], mt[2], 1e-12);
        b += rect(x0, 44, 180, 240, { fill: 'surface', op: 0.5, stroke: i === 2 ? 'accent' : 'border', sw: i === 2 ? 2 : 1, rx: 10 });
        b += text(x0 + 90, 66, mt[0], { a: 'middle', w: 700, c: i === 2 ? 'accent' : null });
        b += line(x0 + 12, 250, x0 + 168, 250, 'muted', 1.5);
        [[mt[1], 'A'], [mt[2], 'B']].forEach((q, j) => {
          const hh = 150 * q[0] / mx, bx = x0 + 40 + j * 60;
          b += rect(bx, 250 - hh, 40, hh, { fill: i === 2 ? 'accent' : 'muted', rx: 2 }) + text(bx + 20, 268, q[1], { a: 'middle', w: 700 });
        });
      });
      if (p.note) b += text(320, 306, p.note, { a: 'middle', sz: 12, w: 600 });
      return svg('Power compared for two people', b);
    } else {
      b += line(20, 270, 300, 270, 'muted', 2) + rect(100, 44, 110, 40, { fill: 'surface', stroke: 'text', sw: 2, rx: 6 }) + text(155, 69, 'motor', { a: 'middle', w: 600 });
      b += line(155, 84, 155, 150, 'text', 2) + rect(125, 150, 60, 44, { fill: 'surface', stroke: 'text', sw: 2, rx: 4 }) + text(155, 177, isNum(p.m) ? num(p.m) + ' kg' : 'm', { a: 'middle', sz: 12, w: 600 });
      b += rect(125, 226, 60, 44, { fill: 'surface', op: 0.5, stroke: 'muted', sw: 1.5, rx: 4, dash: '5 4' });
      b += line(250, 270, 250, 150, 'text', 1.5) + line(242, 270, 258, 270, 'text', 1.5) + line(242, 150, 258, 150, 'text', 1.5) + text(258, 214, 'h' + (isNum(p.h) ? ' = ' + num(p.h) + ' m' : ''), { sz: 12 });
      b += arrow(200, 230, 200, 180, 'accent', 2.5);
      if (isNum(p.W)) right('W = mgh = ' + fJ(p.W));
      if (isNum(p.t)) right('t = ' + num(p.t) + ' s');
      right('P = W / t' + (isNum(p.P) ? ' = ' + si(p.P, 'W') : ''), { w: 700, c: 'accent', sz: 15 });
    }
    if (p.note) b += textLines(340, y + 10, p.note, 36, { cls: 'small' }, 15);
    return svg('Power diagram', b);
  }

  PRVisuals.register({
    'e-bars': eBars, 'e-work': eWork, 'e-fx': eFx, 'e-track': eTrack, 'e-spring': eSpring,
    'e-ke': eKe, 'e-stop': eStop, 'e-power': ePower,
  });

  // ======================================================================
  // GENERATORS (unit 13)
  // ======================================================================

  const MOVERS = [
    { n: 'baseball', m: [0.145, 0.145], v: [20, 42] },
    { n: 'soccer ball', m: [0.43, 0.43], v: [8, 25] },
    { n: 'lab cart', m: [0.5, 2.5], v: [0.5, 3] },
    { n: 'cyclist (with bike)', m: [60, 95], v: [4, 12] },
    { n: 'car', m: [900, 2000], v: [8, 30] },
  ];
  function mover(rng) {
    const o = rng.pick(MOVERS);
    return { n: o.n, m: o.m[0] === o.m[1] ? o.m[0] : rnd(rng, o.m[0], o.m[1], 2), v: rnd(rng, o.v[0], o.v[1], 2) };
  }

  gens.push({
    id: 'p1u3-ke', unit: 13, topic: 'Kinetic energy',
    make(rng) {
      const o = mover(rng);
      const K = 0.5 * o.m * o.v * o.v;
      if (rng() < 0.55) {
        return {
          type: 'numeric',
          prompt: `A ${Q(o.m, kg)} ${o.n} moves at ${Q(o.v, mps)}. What is its kinetic energy? Answer in J.`,
          answer: sig(K, 3), units: 'J',
          steps: [
            `Kinetic energy is the energy an object has because it moves: ${M('K = \\tfrac12 mv^2')}. It is a scalar, never negative, and it doesn't care about direction.`,
            `Plug in SI units (kg, m/s): ${M(`K = \\tfrac12(${fmt(o.m)})(${fmt(o.v)})^2`)}.`,
            `${M(`K = ${fmt(K)}\\ \\text{J}`)}. Square the speed first, then multiply — the ½ is easy to forget.`,
            `${B(`K ≈ ${X(K)} J`)}`,
          ],
          visual: { key: 'e-ke', params: { m: o.m, v: o.v, K } },
        };
      }
      const K3 = sig(K, 3), v = Math.sqrt((2 * K3) / o.m);
      return {
        type: 'numeric',
        prompt: `A ${Q(o.m, kg)} ${o.n} has ${Q(K3, J)} of kinetic energy. How fast is it moving? Answer in m/s.`,
        answer: sig(v, 3), units: 'm/s',
        steps: [
          `Start from ${M('K = \\tfrac12 mv^2')} and solve for speed: ${M('v = \\sqrt{2K/m}')}.`,
          `${M(`v = \\sqrt{\\frac{2(${fmt(K3)})}{${fmt(o.m)}}}`)}.`,
          `${M(`v = ${fmt(v)}\\ \\text{m/s}`)}. A common slip is forgetting the square root (that gives ${M('v^2')}, in m²/s²).`,
          `${B(`v ≈ ${X(v)} m/s`)}`,
        ],
        visual: { key: 'e-ke', params: { m: o.m, v, K: K3 } },
      };
    },
  });

  gens.push({
    id: 'p1u3-ke-scaling', unit: 13, topic: 'Kinetic energy (scaling)',
    make(rng) {
      const a = rng.pick([2, 3, 0.5]), b = rng.pick([1, 1, 2, 0.5]);
      const m = rnd(rng, 1, 5, 2), v = rng.int(2, 8);
      const K0 = sig(0.5 * m * v * v, 3);
      const f = b * a * a;
      const opt = (x) => M(fmt(K0 * x, 3) + '\\ \\text{J}');
      const massTxt = { 1: 'Its mass stays the same', 2: 'Cargo is added that doubles its mass', 0.5: 'Half of its mass is removed' }[b];
      const spTxt = { 2: 'its speed doubles', 3: 'its speed triples', 0.5: 'its speed is cut in half' }[a];
      return {
        type: 'mc',
        prompt: `A ${Q(m, kg)} cart moving at ${Q(v, mps)} has ${Q(K0, J)} of kinetic energy. ${massTxt}, and ${spTxt}. What is its new kinetic energy?`,
        ...mc(rng, opt(f), [opt(b * a), opt(a * a), opt(f * 2), opt(f / 2), opt(b / (a * a)), opt(f * 4)]),
        steps: [
          `${M('K = \\tfrac12 mv^2')}: K is proportional to mass and to the <i>square</i> of speed.`,
          `Mass factor: ${M(`\\times ${fmt(b)}`)}. Speed factor: ${M(`\\times ${fmt(a)}`)}, so ${M(`v^2 \\times ${fmt(a * a)}`)}.`,
          `${M(`K' = ${fmt(K0)} \\times ${fmt(b)} \\times ${fmt(a * a)} = ${fmt(K0 * f)}\\ \\text{J}`)}.`,
          `${B(`K' ≈ ${X(K0 * f)} J`)}. The classic trap is scaling K by the speed factor instead of its square.`,
        ],
        visual: { key: 'e-ke', params: { m, v, K: K0, after: { m: m * b, v: v * a, K: K0 * f } } },
      };
    },
  });

  gens.push({
    id: 'p1u3-work', unit: 13, topic: 'Work by a constant force',
    make(rng) {
      const th = rng.pick([0, 25, 30, 37, 45, 60, 120, 135, 150, 180]);
      const F = rnd(rng, 10, 90, 2), d = rng.int(2, 15);
      const c = Math.cos((th * Math.PI) / 180);
      const W = F * d * c;
      let prompt, fLabel;
      if (th === 0) {
        prompt = `A worker pushes a crate ${Q(d, m_)} across the floor with a horizontal force of ${Q(F, N_)} in the direction it moves. How much work does the worker's push do on the crate? Answer in J.`;
        fLabel = 'F push';
      } else if (th < 90) {
        prompt = `A student pulls a sled ${Q(d, m_)} across level snow with a rope at ${deg(th)} above the horizontal. The rope tension is ${Q(F, N_)}. How much work does the tension do on the sled? Answer in J.`;
        fLabel = 'T';
      } else if (th === 180) {
        prompt = `A box slides ${Q(d, m_)} across a rough floor. The kinetic friction force on it is ${Q(F, N_)}. How much work does friction do on the box? Include the sign. Answer in J.`;
        fLabel = 'f friction';
      } else {
        prompt = `A hockey puck slides ${Q(d, m_)} across the ice. The whole time, a player's stick pushes on it with a constant ${Q(F, N_)} force directed ${deg(th)} from the puck's direction of motion. How much work does the stick do on the puck? Include the sign. Answer in J.`;
        fLabel = 'F stick';
      }
      return {
        type: 'numeric', prompt,
        answer: sig(W, 3), units: 'J',
        steps: [
          `Work by a constant force: ${M('W = Fd\\cos\\theta')}, where ${M('\\theta')} is the angle between the force and the displacement. Only the part of the force along the motion does work.`,
          `Here ${M(`\\theta = ${th}^\\circ`)}, so ${M(`\\cos\\theta = ${fmt(sig(c, 3))}`)}${th > 90 ? ' — negative, because the force points partly against the motion' : ''}.`,
          `${M(`W = (${fmt(F)})(${fmt(d)})(${fmt(sig(c, 3))}) = ${fmt(W)}\\ \\text{J}`)}.`,
          `${B(`W ≈ ${X(W)} J`)}. ${W < 0 ? 'Negative work means this force takes energy out of the object.' : 'Positive work means this force adds energy to the object.'}`,
        ],
        visual: { key: 'e-work', params: { fAng: th, dAng: 0, F, d, W, fLabel } },
      };
    },
  });

  const WORK_OPTS = ['Positive work', 'Negative work', 'Zero work', 'It depends on how fast the object moves'];
  const WORK_SCEN = [
    ['the kinetic friction force on a box sliding across a level floor', 180, 0, 1, 'f', 'Friction points opposite the sliding motion: θ = 180°, cos θ = −1.'],
    ['the normal force on a box sliding across a level floor', 90, 0, 2, 'Fₙ', 'The normal force is vertical and the motion is horizontal: θ = 90°, cos θ = 0.'],
    ['gravity on a ball thrown straight up, while the ball is rising', 270, 90, 1, 'Fg', 'Gravity points down while the ball moves up: θ = 180°.'],
    ['gravity on a ball while it falls', 270, 270, 0, 'Fg', 'Gravity points down and the ball moves down: θ = 0°.'],
    ['the string tension on a ball whirled in a horizontal circle at constant speed', 90, 0, 2, 'T (to center)', 'Tension points toward the center; the velocity is tangent to the circle. They are always perpendicular, so the speed never changes.'],
    ['your hand on a book you lower slowly at constant speed', 90, 270, 1, 'F hand', 'Your hand pushes up while the book moves down: θ = 180°. That is why the book loses energy instead of speeding up.'],
    ['gravity on a satellite in a circular orbit', 90, 0, 2, 'Fg (to Earth)', 'In a circular orbit gravity points to the center and the velocity is tangent: θ = 90° the whole way around.'],
    ['air resistance on a falling skydiver', 90, 270, 1, 'F air', 'Drag points opposite the velocity: θ = 180°.'],
    ['gravity on a car driving along a level road', 270, 0, 2, 'Fg', 'Gravity is vertical; the car moves horizontally: θ = 90°.'],
    ['the tension in an elevator cable while the elevator moves up', 90, 90, 0, 'T', 'The cable pulls up and the elevator moves up: θ = 0°.'],
  ];
  gens.push({
    id: 'p1u3-work-sign', unit: 13, topic: 'Work: positive, negative, or zero',
    make(rng) {
      const [desc, fAng, dAng, ans, fLabel, why] = rng.pick(WORK_SCEN);
      const others = WORK_OPTS.filter((_, i) => i !== ans);
      return {
        type: 'mc',
        prompt: `What kind of work is done by ${desc}?`,
        ...mc(rng, WORK_OPTS[ans], others),
        steps: [
          `The sign of work comes from ${M('W = Fd\\cos\\theta')}: only the angle between the force and the displacement matters.`,
          why,
          `${M('\\theta < 90^\\circ')}: positive (adds energy). ${M('\\theta = 90^\\circ')}: zero. ${M('\\theta > 90^\\circ')}: negative (removes energy). Speed has nothing to do with the sign.`,
          `${B(WORK_OPTS[ans])}.`,
        ],
        visual: { key: 'e-work', params: { fAng, dAng, fLabel, dLabel: 'motion' } },
      };
    },
  });

  function areaOf(pts) {
    let a = 0;
    for (let i = 1; i < pts.length; i++) a += ((pts[i][1] + pts[i - 1][1]) / 2) * (pts[i][0] - pts[i - 1][0]);
    return a;
  }
  gens.push({
    id: 'p1u3-work-graph', unit: 13, topic: 'Work from a force–position graph',
    make(rng) {
      const shape = rng.pick(['trap', 'step', 'tri', 'line']);
      const F1 = 5 * rng.int(2, 8);
      let pts;
      if (shape === 'trap') { const x1 = rng.int(1, 3), x2 = x1 + rng.int(1, 3), x3 = x2 + rng.int(1, 3); pts = [[0, 0], [x1, F1], [x2, F1], [x3, 0]]; }
      else if (shape === 'step') { let F2; do { F2 = 5 * rng.int(1, 8); } while (F2 === F1); const x1 = rng.int(1, 4), x2 = x1 + rng.int(1, 4); pts = [[0, F1], [x1, F1], [x1, F2], [x2, F2]]; }
      else if (shape === 'tri') { const x1 = rng.int(1, 4), x2 = x1 + rng.int(1, 4); pts = [[0, 0], [x1, F1], [x2, 0]]; }
      else { const x1 = rng.int(2, 6); pts = [[0, 0], [x1, F1]]; }
      const W = areaOf(pts), xEnd = pts[pts.length - 1][0];
      const askV = rng() < 0.45;
      const m = rng.pick([2, 4, 5, 8, 10]);
      const v = Math.sqrt((2 * W) / m);
      const prompt = askV
        ? `A ${Q(m, kg)} cart starts from rest on a frictionless track. The only horizontal force on it varies with position as shown. What is the cart's speed at ${M('x = ' + xEnd + '\\ \\text{m}')}? Answer in m/s.`
        : `The graph shows the net horizontal force on a cart as it moves from ${M('x = 0')} to ${M('x = ' + xEnd + '\\ \\text{m}')}. How much work does this force do on the cart? Answer in J.`;
      const steps = [
        `When a force changes with position, ${M('W = Fd')} doesn't work directly. Instead, ${B('work = area under the F–x graph')} (each thin strip is ${M('F\\,\\Delta x')}).`,
        `Split the region into rectangles and triangles: area ${M(`= ${fmt(W)}\\ \\text{N}\\cdot\\text{m} = ${fmt(W)}\\ \\text{J}`)}.`,
      ];
      if (askV) {
        steps.push(`Work–energy theorem from rest: ${M('W = \\tfrac12 mv^2')}, so ${M(`v = \\sqrt{2W/m} = \\sqrt{2(${fmt(W)})/${m}} = ${fmt(v)}\\ \\text{m/s}`)}.`);
        steps.push(`${B(`v ≈ ${X(v)} m/s`)}`);
      } else {
        steps.push(`Watch the units: newtons × meters = joules. Triangles are ${M('\\tfrac12 \\times')} base ${M('\\times')} height — forgetting the ½ is the usual mistake.`);
        steps.push(`${B(`W = ${X(W)} J`)}`);
      }
      return {
        type: 'numeric', prompt,
        answer: sig(askV ? v : W, 3), units: askV ? 'm/s' : 'J',
        steps,
        visual: { key: 'e-fx', params: { pts, area: W } },
        figure: { key: 'e-fx', params: { pts } },
      };
    },
  });

  gens.push({
    id: 'p1u3-work-energy', unit: 13, topic: 'Work–energy theorem',
    make(rng) {
      const kind = rng.pick(['speed', 'stop', 'force']);
      if (kind === 'speed') {
        const m = rnd(rng, 1, 6, 2), v0 = rng() < 0.4 ? 0 : rnd(rng, 1, 4, 2), F = rnd(rng, 2, 20, 2), d = rng.int(1, 8);
        const W = F * d, K0 = 0.5 * m * v0 * v0, v = Math.sqrt(v0 * v0 + (2 * W) / m);
        return {
          type: 'numeric',
          prompt: `A ${Q(m, kg)} cart ${v0 ? `moving at ${Q(v0, mps)}` : 'at rest'} on a frictionless track is pushed by a constant horizontal net force of ${Q(F, N_)} in its direction of motion for ${Q(d, m_)}. What is its speed afterward? Answer in m/s.`,
          answer: sig(v, 3), units: 'm/s',
          steps: [
            `Work–energy theorem: the net work on an object equals its change in kinetic energy, ${M('W_{\\text{net}} = \\Delta K')}.`,
            `${M(`W_{\\text{net}} = Fd = (${fmt(F)})(${d}) = ${fmt(W)}\\ \\text{J}`)}. Initial ${M(`K_0 = \\tfrac12(${fmt(m)})(${fmt(v0)})^2 = ${fmt(K0)}\\ \\text{J}`)}.`,
            `${M(`K = ${fmt(K0)} + ${fmt(W)} = ${fmt(K0 + W)}\\ \\text{J}`)}, so ${M(`v = \\sqrt{2K/m} = ${fmt(v)}\\ \\text{m/s}`)}. (Adding speeds or adding ${M('Fd/m')} to ${M('v_0')} directly is wrong — energies add, speeds don't.)`,
            `${B(`v ≈ ${X(v)} m/s`)}`,
          ],
          visual: { key: 'e-bars', params: { before: { K: K0 }, after: { K: K0 + W }, W, Wlabel: 'Net work', title: 'Work–energy theorem: W = ΔK' } },
        };
      }
      if (kind === 'stop') {
        const m = rnd(rng, 1000, 2000, 2), v = rnd(rng, 10, 30, 2), f = rnd(rng, 4000, 12000, 2);
        const K = 0.5 * m * v * v, d = K / f;
        return {
          type: 'numeric',
          prompt: `A ${Q(m, kg)} car moving at ${Q(v, mps)} brakes to a stop. The road exerts a constant ${Q(f, N_)} friction force on the car while it stops. How far does it travel while braking? Answer in m.`,
          answer: sig(d, 3), units: 'm',
          steps: [
            `Use ${M('W_{\\text{net}} = \\Delta K')}. Friction is the net horizontal force and points backward, so ${M('W = -fd')}. Final K is zero.`,
            `${M(`K_0 = \\tfrac12(${fmt(m)})(${fmt(v)})^2 = ${fmt(K)}\\ \\text{J}`)}.`,
            `${M(`-fd = 0 - K_0 \\Rightarrow d = \\frac{K_0}{f} = \\frac{${fmt(K)}}{${fmt(f)}} = ${fmt(d)}\\ \\text{m}`)}.`,
            `${B(`d ≈ ${X(d)} m`)}. Notice ${M('d \\propto v^2')}: twice the speed needs four times the distance.`,
          ],
          visual: { key: 'e-bars', params: { before: { K }, after: { K: 0 }, W: -K, Wlabel: 'Friction work', title: 'Braking: friction removes all the K' } },
        };
      }
      const m = 0.145, v = rnd(rng, 20, 40, 2), d = rnd(rng, 0.1, 0.3, 2);
      const K = 0.5 * m * v * v, F = K / d;
      return {
        type: 'numeric',
        prompt: `A ${Q(m, kg)} baseball moving at ${Q(v, mps)} is caught. The catcher's glove moves back ${Q(d, m_)} while stopping the ball. What is the magnitude of the average force of the glove on the ball? Answer in N.`,
        answer: sig(F, 3), units: 'N',
        steps: [
          `${M('W_{\\text{net}} = \\Delta K')}. The glove's force points opposite the ball's motion, so it does negative work ${M('-Fd')} and the ball ends at rest.`,
          `${M(`K_0 = \\tfrac12(${m})(${fmt(v)})^2 = ${fmt(K)}\\ \\text{J}`)}.`,
          `${M(`F = \\frac{K_0}{d} = \\frac{${fmt(K)}}{${fmt(d)}} = ${fmt(F)}\\ \\text{N}`)}. A longer stopping distance means a smaller force — that's why the catcher's hand gives.`,
          `${B(`F ≈ ${X(F)} N`)}`,
        ],
        visual: { key: 'e-bars', params: { before: { K }, after: { K: 0 }, W: -K, Wlabel: 'Glove work', title: 'Catching: the glove removes all the K' } },
      };
    },
  });

  gens.push({
    id: 'p1u3-stopping-scaling', unit: 13, topic: 'Stopping distance (work–energy)',
    make(rng) {
      let a, b;
      do { a = rng.pick([2, 3, 0.5, 1.5]); b = rng.pick([1, 1, 2]); } while (a === 1 && b === 1);
      const d0 = rng.int(10, 40);
      const f = b * a * a;
      const opt = (x) => M(fmt(d0 * x, 3) + '\\ \\text{m}');
      const spTxt = { 2: 'twice as fast', 3: 'three times as fast', 0.5: 'half as fast', 1.5: '1.5 times as fast' }[a];
      const massTxt = b === 2 ? 'a truck with twice the mass, moving' : 'the same car, moving';
      return {
        type: 'mc',
        prompt: `A car braking on a level road with a constant friction force skids ${Q(d0, m_)} before stopping. If ${massTxt} ${spTxt}, brakes with the same friction force, how far does it skid?`,
        ...mc(rng, opt(f), [opt(b * a), opt(a * a * (b === 1 ? 2 : 1)), opt(f * 2), opt(b / (a * a)), opt(b * Math.sqrt(a)), opt(f / 2)]),
        steps: [
          `Work–energy: friction's work removes all the kinetic energy, ${M('fd = \\tfrac12 mv^2')}, so ${M('d = \\frac{mv^2}{2f}')}.`,
          `With the same ${M('f')}: ${M('d \\propto m v^2')}. Mass factor ${M(`\\times ${b}`)}, speed factor ${M(`\\times ${fmt(a)}`)} → ${M(`v^2 \\times ${fmt(a * a)}`)}.`,
          `${M(`d' = ${d0} \\times ${b} \\times ${fmt(a * a)} = ${fmt(d0 * f)}\\ \\text{m}`)}.`,
          `${B(`d' ≈ ${X(d0 * f)} m`)}. Distance scales with speed <i>squared</i>, which is why speeding is so dangerous.`,
        ],
        visual: { key: 'e-stop', params: { d1: d0, d2: d0 * f, label1: 'Original', label2: `${b === 2 ? 'Mass ×2, ' : ''}speed ×${num(a)}`, note: 'd = mv² / 2f   →   d × ' + num(f, 3) } },
      };
    },
  });

  gens.push({
    id: 'p1u3-gpe', unit: 13, topic: 'Gravitational potential energy',
    make(rng) {
      const kind = rng.pick(['shelf', 'hike', 'lower', 'height']);
      if (kind === 'shelf' || kind === 'hike') {
        const m = kind === 'shelf' ? rnd(rng, 2, 25, 2) : rng.int(50, 90);
        const h = kind === 'shelf' ? rnd(rng, 0.5, 2.5, 2) : 10 * rng.int(10, 90);
        const U = m * g * h;
        return {
          type: 'numeric',
          prompt: kind === 'shelf'
            ? `A ${Q(m, kg)} box is lifted from the floor onto a shelf ${Q(h, m_)} high. By how much does the gravitational potential energy of the box–Earth system increase? Answer in J.`
            : `A ${Q(m, kg)} hiker climbs a trail that gains ${Q(h, m_)} of elevation. By how much does the gravitational potential energy of the hiker–Earth system increase? Answer in J.`,
          given: giv(G.g),
          answer: sig(U, 3), units: 'J',
          steps: [
            `Near Earth's surface, ${M('\\Delta U_g = mg\\Delta h')}. Only the change in height matters — not the path (${kind === 'hike' ? 'switchbacks don\'t change it' : 'straight up or up a ramp, same answer'}).`,
            `${M(`\\Delta U_g = (${fmt(m)})(9.8)(${fmt(h)})`)}.`,
            `${M(`\\Delta U_g = ${fmt(U)}\\ \\text{J}`)}. Potential energy belongs to the object–Earth <i>system</i>, not the object alone.`,
            `${B(`ΔUg ≈ ${X(U)} J`)}`,
          ],
          visual: { key: 'e-track', params: { shape: 'lift', hA: 0, hB: h, m, title: 'Raising the object stores Ug', nameA: 'start', nameB: 'end' } },
        };
      }
      if (kind === 'lower') {
        const m = rnd(rng, 5, 40, 2), h1 = rnd(rng, 3, 12, 2), h2 = sig(h1 * rng.range(0.1, 0.6), 2);
        const U = m * g * (h2 - h1);
        return {
          type: 'numeric',
          prompt: `A crane lowers a ${Q(m, kg)} crate from ${Q(h1, m_)} above the ground to ${Q(h2, m_)} above the ground. What is the change in gravitational potential energy of the crate–Earth system? Include the sign. Answer in J.`,
          given: giv(G.g),
          answer: sig(U, 3), units: 'J',
          steps: [
            `${M('\\Delta U_g = mg\\Delta h = mg(h_f - h_i)')}. Going down makes ${M('\\Delta h')} negative.`,
            `${M(`\\Delta h = ${fmt(h2)} - ${fmt(h1)} = ${fmt(h2 - h1)}\\ \\text{m}`)}.`,
            `${M(`\\Delta U_g = (${fmt(m)})(9.8)(${fmt(h2 - h1)}) = ${fmt(U)}\\ \\text{J}`)}.`,
            `${B(`ΔUg ≈ ${X(U)} J`)} (negative: the system lost potential energy).`,
          ],
          visual: { key: 'e-track', params: { shape: 'lift', hA: h1, hB: h2, m, title: 'Lowering the crate: Ug decreases', nameA: 'start', nameB: 'end' } },
        };
      }
      const m = rnd(rng, 0.5, 10, 2), h = rnd(rng, 1, 20, 2), U = sig(m * g * h, 3), hh = U / (m * g);
      return {
        type: 'numeric',
        prompt: `Lifting a ${Q(m, kg)} object straight up increases the gravitational potential energy of the object–Earth system by ${Q(U, J)}. How high was it lifted? Answer in m.`,
        given: giv(G.g),
        answer: sig(hh, 3), units: 'm',
        steps: [
          `${M('\\Delta U_g = mg\\Delta h')}, so ${M('\\Delta h = \\frac{\\Delta U_g}{mg}')}.`,
          `${M(`\\Delta h = \\frac{${fmt(U)}}{(${fmt(m)})(9.8)}`)}.`,
          `${M(`\\Delta h = ${fmt(hh)}\\ \\text{m}`)}.`,
          `${B(`Δh ≈ ${X(hh)} m`)}`,
        ],
        visual: { key: 'e-track', params: { shape: 'lift', hA: 0, hB: hh, m, title: 'Ug = mgh', nameA: 'start', nameB: 'end' } },
      };
    },
  });

  gens.push({
    id: 'p1u3-spring', unit: 13, topic: 'Spring potential energy',
    make(rng) {
      const kind = rng.pick(['U', 'v', 'x']);
      const k = 50 * rng.int(2, 16), xcm = rng.int(4, 20), x = xcm / 100, m = rnd(rng, 0.2, 2, 2);
      const U = 0.5 * k * x * x;
      if (kind === 'U') {
        return {
          type: 'numeric',
          prompt: `A spring with spring constant ${Q(k, tx('N/m'))} is compressed ${Q(xcm, cm)} from its natural length. How much elastic potential energy is stored? Answer in J.`,
          answer: sig(U, 3), units: 'J',
          steps: [
            `Spring potential energy: ${M('U_s = \\tfrac12 kx^2')}, where ${M('x')} is the stretch or compression from natural length.`,
            `Convert: ${M(`x = ${xcm}\\ \\text{cm} = ${fmt(x)}\\ \\text{m}`)}. Leaving x in cm makes the answer 10,000× too big.`,
            `${M(`U_s = \\tfrac12(${k})(${fmt(x)})^2 = ${fmt(U)}\\ \\text{J}`)}.`,
            `${B(`Us ≈ ${X(U)} J`)}`,
          ],
          visual: { key: 'e-spring', params: { k, x, U } },
        };
      }
      const v = x * Math.sqrt(k / m);
      if (kind === 'v') {
        return {
          type: 'numeric',
          prompt: `A ${Q(m, kg)} block is pressed against a spring (${M(`k = ${k}\\ \\text{N/m}`)}) on a frictionless horizontal surface, compressing it ${Q(xcm, cm)}. The block is released. What is its speed after it leaves the spring? Answer in m/s.`,
          answer: sig(v, 3), units: 'm/s',
          steps: [
            `System = block + spring, no friction: all the spring energy becomes kinetic energy, ${M('\\tfrac12 kx^2 = \\tfrac12 mv^2')}.`,
            `${M(`U_s = \\tfrac12(${k})(${fmt(x)})^2 = ${fmt(U)}\\ \\text{J}`)}.`,
            `${M(`v = \\sqrt{2U_s/m} = x\\sqrt{k/m} = ${fmt(v)}\\ \\text{m/s}`)}.`,
            `${B(`v ≈ ${X(v)} m/s`)}`,
          ],
          visual: { key: 'e-spring', params: { k, x, m, U, v } },
        };
      }
      const v2 = sig(v, 2), x2 = v2 * Math.sqrt(m / k);
      return {
        type: 'numeric',
        prompt: `A spring launcher (${M(`k = ${k}\\ \\text{N/m}`)}) on a frictionless horizontal track must send a ${Q(m, kg)} cart off at ${Q(v2, mps)}. How far must the spring be compressed? Answer in cm.`,
        answer: sig(x2 * 100, 3), units: 'cm',
        steps: [
          `Energy conservation, spring → kinetic: ${M('\\tfrac12 kx^2 = \\tfrac12 mv^2')}.`,
          `Solve for compression: ${M('x = v\\sqrt{m/k}')}.`,
          `${M(`x = (${fmt(v2)})\\sqrt{${fmt(m)}/${k}} = ${fmt(x2)}\\ \\text{m}`)}.`,
          `${B(`x ≈ ${X(x2 * 100)} cm`)}`,
        ],
        visual: { key: 'e-spring', params: { k, x: x2, m, U: 0.5 * m * v2 * v2, v: v2 } },
      };
    },
  });

  gens.push({
    id: 'p1u3-conservation', unit: 13, topic: 'Conservation of energy',
    make(rng) {
      const kind = rng.pick(['drop', 'coaster', 'pendulum', 'up', 'halfpipe']);
      const base = (vis) => ({ key: 'e-track', params: vis });
      if (kind === 'drop') {
        const h = rnd(rng, 2, 40, 2), v = Math.sqrt(2 * g * h);
        return {
          type: 'numeric',
          prompt: `A rock is dropped from rest from a bridge ${Q(h, m_)} above the water. Ignoring air resistance, how fast is it moving when it hits the water? Answer in m/s.`,
          given: giv(G.g), answer: sig(v, 3), units: 'm/s',
          steps: [
            `System = rock + Earth. No friction or air resistance, so mechanical energy is conserved: ${M('U_{g,i} + K_i = U_{g,f} + K_f')}.`,
            `${M('mgh = \\tfrac12 mv^2')} — the mass cancels, so every object falls with the same speed.`,
            `${M(`v = \\sqrt{2gh} = \\sqrt{2(9.8)(${fmt(h)})} = ${fmt(v)}\\ \\text{m/s}`)}.`,
            `${B(`v ≈ ${X(v)} m/s`)}`,
          ],
          visual: base({ shape: 'drop', hA: h, hB: 0, vA: 0, vB: v, title: 'Falling: Ug → K' }),
        };
      }
      if (kind === 'coaster') {
        const hA = rnd(rng, 15, 50, 2), vA = rng() < 0.4 ? 0 : rnd(rng, 2, 8, 2);
        const hB = sig(rng.range(2, 0.85 * (hA + (vA * vA) / (2 * g))), 2);
        const vB = Math.sqrt(vA * vA + 2 * g * (hA - hB));
        const m = 10 * rng.int(25, 60);
        return {
          type: 'numeric',
          prompt: `A ${Q(m, kg)} roller-coaster car passes point A, ${Q(hA, m_)} above the ground, ${vA ? `at ${Q(vA, mps)}` : 'nearly at rest'}. The track is frictionless. How fast is it moving at point B, ${Q(hB, m_)} above the ground? Answer in m/s.`,
          given: giv(G.g), answer: sig(vB, 3), units: 'm/s',
          steps: [
            `Car + Earth, no friction: ${M('\\tfrac12 mv_A^2 + mgh_A = \\tfrac12 mv_B^2 + mgh_B')}. The mass cancels — you don't need it.`,
            `${M('v_B = \\sqrt{v_A^2 + 2g(h_A - h_B)}')}. Only the height difference matters, not the shape of the track between.`,
            `${M(`v_B = \\sqrt{(${fmt(vA)})^2 + 2(9.8)(${fmt(hA - hB)})} = ${fmt(vB)}\\ \\text{m/s}`)}.`,
            `${B(`vB ≈ ${X(vB)} m/s`)}`,
          ],
          visual: base({ shape: 'valley', hA, hB, vA, vB, hMax: hA, title: 'Frictionless track: K + Ug stays constant' }),
        };
      }
      if (kind === 'pendulum') {
        const hcm = rng.int(10, 80), h = hcm / 100, v = Math.sqrt(2 * g * h);
        return {
          type: 'numeric',
          prompt: `A pendulum bob is pulled aside until it is ${Q(hcm, cm)} above its lowest point, then released from rest. How fast is it moving at the bottom of its swing? Answer in m/s.`,
          given: giv(G.g), answer: sig(v, 3), units: 'm/s',
          steps: [
            `The string's tension is always perpendicular to the motion, so it does no work. Only gravity does work → energy of bob + Earth is conserved.`,
            `${M('mgh = \\tfrac12 mv^2 \\Rightarrow v = \\sqrt{2gh}')}, with ${M(`h = ${fmt(h)}\\ \\text{m}`)}.`,
            `${M(`v = \\sqrt{2(9.8)(${fmt(h)})} = ${fmt(v)}\\ \\text{m/s}`)}.`,
            `${B(`v ≈ ${X(v)} m/s`)}`,
          ],
          visual: base({ shape: 'pendulum', hA: h, hB: 0, vA: 0, vB: v, title: 'Pendulum: Ug at the top → K at the bottom' }),
        };
      }
      const v = rnd(rng, 4, 20, 2), h = (v * v) / (2 * g);
      if (kind === 'up') {
        return {
          type: 'numeric',
          prompt: `A ball is thrown straight up at ${Q(v, mps)}. Ignoring air resistance, how high above the launch point does it rise? Answer in m.`,
          given: giv(G.g), answer: sig(h, 3), units: 'm',
          steps: [
            `Ball + Earth: K at launch becomes Ug at the top, where the ball is momentarily at rest.`,
            `${M('\\tfrac12 mv^2 = mgh \\Rightarrow h = \\frac{v^2}{2g}')}.`,
            `${M(`h = \\frac{(${fmt(v)})^2}{2(9.8)} = ${fmt(h)}\\ \\text{m}`)}.`,
            `${B(`h ≈ ${X(h)} m`)}`,
          ],
          visual: base({ shape: 'up', hA: 0, hB: h, vA: v, vB: 0, title: 'Thrown up: K → Ug' }),
        };
      }
      return {
        type: 'numeric',
        prompt: `A skateboarder moves through the bottom of a frictionless half-pipe at ${Q(v, mps)}. How high up the side (above the bottom) does she rise before stopping? Answer in m.`,
        given: giv(G.g), answer: sig(h, 3), units: 'm',
        steps: [
          `Skater + Earth, no friction: all the K at the bottom becomes Ug at the highest point.`,
          `${M('\\tfrac12 mv^2 = mgh \\Rightarrow h = \\frac{v^2}{2g}')} (mass cancels).`,
          `${M(`h = \\frac{(${fmt(v)})^2}{2(9.8)} = ${fmt(h)}\\ \\text{m}`)}.`,
          `${B(`h ≈ ${X(h)} m`)}`,
        ],
        visual: base({ shape: 'valley', aMid: true, hA: 0, hB: h, vA: v, vB: 0, title: 'Half-pipe: K → Ug' }),
      };
    },
  });

  gens.push({
    id: 'p1u3-friction-energy', unit: 13, topic: 'Energy dissipated by friction',
    make(rng) {
      const kind = rng.pick(['dissipated', 'slide', 'final']);
      if (kind === 'dissipated') {
        const m = rnd(rng, 20, 60, 2), h = rnd(rng, 3, 15, 2);
        const v = sig(Math.sqrt(2 * g * h) * rng.range(0.5, 0.85), 2);
        const Ui = m * g * h, Kf = 0.5 * m * v * v, E = Ui - Kf;
        return {
          type: 'numeric',
          prompt: `A child and sled (${Q(m, kg)} total) start from rest at the top of a snowy hill ${Q(h, m_)} high and reach the bottom at ${Q(v, mps)}. How much mechanical energy was converted to thermal energy by friction? Answer in J.`,
          given: giv(G.g), answer: sig(E, 3), units: 'J',
          steps: [
            `System = sled + Earth + snow. Total energy is conserved, but friction turns some mechanical energy into thermal energy: ${M('U_{g,i} = K_f + \\Delta E_{\\text{th}}')}.`,
            `${M(`U_{g,i} = mgh = (${fmt(m)})(9.8)(${fmt(h)}) = ${fmt(Ui)}\\ \\text{J}`)}; ${M(`K_f = \\tfrac12(${fmt(m)})(${fmt(v)})^2 = ${fmt(Kf)}\\ \\text{J}`)}.`,
            `${M(`\\Delta E_{\\text{th}} = ${fmt(Ui)} - ${fmt(Kf)} = ${fmt(E)}\\ \\text{J}`)}.`,
            `${B(`ΔEth ≈ ${X(E)} J`)}`,
          ],
          visual: { key: 'e-bars', params: { before: { K: 0, Ug: Ui, Eth: 0 }, after: { K: Kf, Ug: 0, Eth: E }, title: 'Sliding down with friction', labels: ['Top', 'Bottom'] } },
        };
      }
      if (kind === 'slide') {
        const v0 = rnd(rng, 3, 12, 2), mu = sig(rng.range(0.1, 0.6), 2), d = (v0 * v0) / (2 * mu * g);
        return {
          type: 'numeric',
          prompt: `A box slides across a level floor with an initial speed of ${Q(v0, mps)}. The coefficient of kinetic friction is ${M(`\\mu_k = ${mu}`)}. How far does it slide before stopping? Answer in m.`,
          given: giv(G.g), answer: sig(d, 3), units: 'm',
          steps: [
            `Friction converts the box's kinetic energy into thermal energy: ${M('\\tfrac12 mv_0^2 = f_k d')}.`,
            `On a level floor ${M('F_N = mg')}, so ${M('f_k = \\mu_k mg')}. Then ${M('\\tfrac12 mv_0^2 = \\mu_k mg\\,d')} — mass cancels.`,
            `${M(`d = \\frac{v_0^2}{2\\mu_k g} = \\frac{(${fmt(v0)})^2}{2(${mu})(9.8)} = ${fmt(d)}\\ \\text{m}`)}.`,
            `${B(`d ≈ ${X(d)} m`)}`,
          ],
          visual: { key: 'e-bars', params: { before: { K: 1, Eth: 0 }, after: { K: 0, Eth: 1 }, rel: true, title: 'All the K becomes thermal energy', note: '½mv₀² = μk·mg·d' } },
        };
      }
      const m = rnd(rng, 1, 8, 2), h = rnd(rng, 1, 6, 2), Ui = m * g * h, E = sig(Ui * rng.range(0.15, 0.6), 2);
      const v = Math.sqrt((2 * (Ui - E)) / m);
      return {
        type: 'numeric',
        prompt: `A ${Q(m, kg)} block starts from rest at the top of a ramp ${Q(h, m_)} high. On the way down, friction converts ${Q(E, J)} into thermal energy. How fast is the block moving at the bottom? Answer in m/s.`,
        given: giv(G.g), answer: sig(v, 3), units: 'm/s',
        steps: [
          `Energy bookkeeping (block + Earth + ramp): ${M('mgh = \\tfrac12 mv^2 + \\Delta E_{\\text{th}}')}.`,
          `${M(`mgh = (${fmt(m)})(9.8)(${fmt(h)}) = ${fmt(Ui)}\\ \\text{J}`)}, so ${M(`K_f = ${fmt(Ui)} - ${fmt(E)} = ${fmt(Ui - E)}\\ \\text{J}`)}.`,
          `${M(`v = \\sqrt{2K_f/m} = ${fmt(v)}\\ \\text{m/s}`)}. Ignoring friction would give ${M(`\\sqrt{2gh} = ${fmt(Math.sqrt(2 * g * h))}`)} m/s — too fast.`,
          `${B(`v ≈ ${X(v)} m/s`)}`,
        ],
        visual: { key: 'e-bars', params: { before: { K: 0, Ug: Ui, Eth: 0 }, after: { K: Ui - E, Ug: 0, Eth: E }, title: 'Ramp with friction', labels: ['Top', 'Bottom'] } },
      };
    },
  });

  const BAR_SCEN = [
    {
      q: 'A ball is dropped from rest. Take the system to be the ball and Earth, and ignore air resistance. Which statement describes the energy of the system as the ball falls?',
      right: 'Ug decreases and K increases by the same amount; the total stays constant.',
      wrong: ['K increases and Ug stays the same, so the total increases.', 'Gravity does positive work on the system, so its total energy increases.', 'Both K and Ug increase.'],
      why: 'Gravity is an internal force when Earth is in the system, so it shows up as Ug, not as outside work. No external work → total energy constant.',
      vis: { before: { K: 0, Ug: 4 }, after: { K: 4, Ug: 0 } },
    },
    {
      q: 'A ball is dropped from rest. This time the system is the ball only (Earth is outside the system). Which statement is correct as the ball falls?',
      right: 'The system has no Ug; gravity does positive external work, increasing the ball\'s K.',
      wrong: ['Ug of the ball decreases while K increases; total is constant.', 'Gravity does negative work, so K decreases.', 'Nothing does work on the ball, so its energy is constant.'],
      why: 'Potential energy needs two interacting objects in the system. With Earth outside, gravity is an external force doing positive work: W = ΔK.',
      vis: { before: { K: 0 }, after: { K: 4 }, W: 4, Wlabel: 'Gravity (ext.)' },
    },
    {
      q: 'A person pushes a box up a frictionless ramp at constant speed. The system is the box and Earth. Which bar chart description is correct?',
      right: 'The person does positive work; Ug increases by that amount while K stays the same.',
      wrong: ['K increases because the person does positive work.', 'The person does no net work because the speed is constant, so Ug stays the same.', 'Ug increases and K decreases by the same amount.'],
      why: 'Constant speed → K unchanged. The person is outside the system, so their positive work must go into Ug.',
      vis: { before: { K: 2, Ug: 0 }, after: { K: 2, Ug: 3 }, W: 3, Wlabel: 'Person (ext.)' },
    },
    {
      q: 'A box slides across a rough floor and comes to rest. The system is the box and the floor. What happens to the system\'s energy?',
      right: 'K converts into thermal energy; the system\'s total energy stays the same.',
      wrong: ['Friction does negative external work, so the total energy decreases.', 'The energy is destroyed by friction.', 'K converts into potential energy of the box.'],
      why: 'With both surfaces inside the system, friction is internal: it converts K into ΔEth (warmer box and floor). No external work → total constant.',
      vis: { before: { K: 4, Eth: 0 }, after: { K: 0, Eth: 4 } },
    },
    {
      q: 'A compressed spring launches a cart along a frictionless horizontal track. System: spring + cart. From release until the cart leaves the spring, what happens?',
      right: 'Us decreases and K increases by the same amount.',
      wrong: ['Us and K both decrease.', 'The spring does external work, so the total energy increases.', 'Us converts into gravitational potential energy.'],
      why: 'The spring is inside the system: its force is internal and stored energy just changes form, Us → K. The track is level, so Ug doesn\'t change.',
      vis: { before: { K: 0, Us: 4 }, after: { K: 4, Us: 0 } },
    },
    {
      q: 'A ball is thrown straight up. System: ball + Earth, no air resistance. Compared with the moment of release, at the top of its path…',
      right: 'K is zero and Ug equals the total energy.',
      wrong: ['K and Ug are both zero.', 'K is at its maximum and Ug is zero.', 'Both K and Ug are at their maximum.'],
      why: 'At the very top the ball is momentarily at rest (vertical throw), so all of the launch K has become Ug.',
      vis: { before: { K: 4, Ug: 0 }, after: { K: 0, Ug: 4 }, labels: ['Release', 'Top'] },
    },
  ];
  gens.push({
    id: 'p1u3-bars', unit: 13, topic: 'Energy bar charts and systems',
    make(rng) {
      const s = rng.pick(BAR_SCEN);
      return {
        type: 'mc',
        prompt: s.q,
        ...mc(rng, s.right, s.wrong),
        steps: [
          `First decide what's in the system. Forces between objects <i>inside</i> it store or convert energy (Ug, Us, thermal); forces from <i>outside</i> do work.`,
          s.why,
          `Bar chart rule: initial energies + external work = final energies.`,
          `${B(s.right)}`,
        ],
        visual: { key: 'e-bars', params: Object.assign({ rel: true, title: 'Energy bar chart' }, s.vis) },
      };
    },
  });

  gens.push({
    id: 'p1u3-power', unit: 13, topic: 'Power',
    make(rng) {
      const kind = rng.pick(['lift', 'drive', 'time', 'accel']);
      if (kind === 'lift') {
        const m = rnd(rng, 50, 500, 2), h = rnd(rng, 3, 20, 2), t = rnd(rng, 4, 30, 2);
        const W = m * g * h, P = W / t;
        return {
          type: 'numeric',
          prompt: `A motor lifts a ${Q(m, kg)} load ${Q(h, m_)} straight up at constant speed in ${Q(t, s_)}. What average power does the motor deliver? Answer in W.`,
          given: giv(G.g), answer: sig(P, 3), units: 'W',
          steps: [
            `Power is the rate of energy transfer: ${M('P = \\frac{W}{\\Delta t}')}.`,
            `At constant speed the motor's work all goes into Ug: ${M(`W = mgh = (${fmt(m)})(9.8)(${fmt(h)}) = ${fmt(W)}\\ \\text{J}`)}.`,
            `${M(`P = \\frac{${fmt(W)}}{${fmt(t)}} = ${fmt(P)}\\ \\text{W}`)}.`,
            `${B(`P ≈ ${X(P)} W`)}`,
          ],
          visual: { key: 'e-power', params: { mode: 'lift', m, h, t, W, P } },
        };
      }
      if (kind === 'drive') {
        const F = rnd(rng, 300, 2000, 2), v = rnd(rng, 10, 35, 2), P = F * v;
        return {
          type: 'numeric',
          prompt: `A car drives at a constant ${Q(v, mps)} on a level road. Air resistance and rolling friction together exert ${Q(F, N_)} on it. What power must the engine deliver to the wheels? Answer in W.`,
          answer: sig(P, 3), units: 'W',
          steps: [
            `Constant velocity → net force zero, so the forward driving force equals the resistance: ${M(`F = ${fmt(F)}\\ \\text{N}`)}.`,
            `For a constant force along the motion, ${M('P = \\frac{Fd}{t} = Fv')}.`,
            `${M(`P = (${fmt(F)})(${fmt(v)}) = ${fmt(P)}\\ \\text{W}`)}.`,
            `${B(`P ≈ ${X(P)} W`)}`,
          ],
          visual: { key: 'e-power', params: { mode: 'drive', F, v, P } },
        };
      }
      if (kind === 'time') {
        const P = 50 * rng.int(4, 40), m = rnd(rng, 40, 300, 2), h = rnd(rng, 2, 15, 2), t = (m * g * h) / P;
        return {
          type: 'numeric',
          prompt: `A ${Q(P, W_)} winch lifts a ${Q(m, kg)} crate ${Q(h, m_)} at constant speed. How long does this take? Answer in s.`,
          given: giv(G.g), answer: sig(t, 3), units: 's',
          steps: [
            `${M('P = \\frac{W}{t}')}, so ${M('t = \\frac{W}{P}')}.`,
            `${M(`W = mgh = (${fmt(m)})(9.8)(${fmt(h)}) = ${fmt(m * g * h)}\\ \\text{J}`)}.`,
            `${M(`t = \\frac{${fmt(m * g * h)}}{${P}} = ${fmt(t)}\\ \\text{s}`)}.`,
            `${B(`t ≈ ${X(t)} s`)}`,
          ],
          visual: { key: 'e-power', params: { mode: 'lift', m, h, t, W: m * g * h, P } },
        };
      }
      const m = rnd(rng, 900, 1800, 2), v = rnd(rng, 10, 30, 2), t = rnd(rng, 4, 15, 2);
      const K = 0.5 * m * v * v, P = K / t;
      return {
        type: 'numeric',
        prompt: `A ${Q(m, kg)} car speeds up from rest to ${Q(v, mps)} in ${Q(t, s_)} on a level road. Ignoring friction and air resistance, what average power does the engine deliver? Answer in W.`,
        answer: sig(P, 3), units: 'W',
        steps: [
          `The engine's work goes into kinetic energy: ${M('W = \\Delta K = \\tfrac12 mv^2')}.`,
          `${M(`\\Delta K = \\tfrac12(${fmt(m)})(${fmt(v)})^2 = ${fmt(K)}\\ \\text{J}`)}.`,
          `${M(`P_{\\text{avg}} = \\frac{\\Delta K}{t} = \\frac{${fmt(K)}}{${fmt(t)}} = ${fmt(P)}\\ \\text{W}`)}. (Using ${M('P = Fv')} with the final speed would overcount — the speed wasn't constant.)`,
          `${B(`P ≈ ${X(P)} W`)}`,
        ],
        visual: { key: 'e-power', params: { mode: 'accel', m, v, t, W: K, P } },
      };
    },
  });

  gens.push({
    id: 'p1u3-power-compare', unit: 13, topic: 'Power (comparisons)',
    make(rng) {
      let mr, tr;
      do { mr = rng.pick([1, 1.5, 2, 0.5]); tr = rng.pick([1, 2, 0.5, 1.5]); } while (mr === 1 && tr === 1);
      const mA = 10 * rng.int(5, 8), tA = rng.pick([10, 12, 20, 30]);
      const mB = mA * mr, tB = tA * tr;
      const r = (mA / mB) * (tB / tA); // P_A / P_B
      const opt = (x) => (Math.abs(x - 1) < 1e-9 ? M('P_A = P_B') : M(`P_A = ${fmt(sig(x, 3))}\\,P_B`));
      return {
        type: 'mc',
        prompt: `Students A and B run up the same flight of stairs. A has mass ${Q(mA, kg)} and takes ${Q(tA, s_)}. B has mass ${Q(mB, kg)} and takes ${Q(tB, s_)}. How does A's average power compare with B's?`,
        ...mc(rng, opt(r), [opt(mA / mB), opt(1 / r), opt(tB / tA), opt((mA / mB) * (tA / tB)), opt(1), opt(2 * r), opt(r / 2), opt(4 * r), opt(r / 4)]),
        steps: [
          `${M('P = \\frac{W}{t} = \\frac{mgh}{t}')}. Same stairs → same ${M('h')}, so ${M('P \\propto m/t')}.`,
          `Work ratio ${M(`W_A/W_B = m_A/m_B = ${fmt(sig(mA / mB, 3))}`)}. Time ratio ${M(`t_A/t_B = ${fmt(sig(tA / tB, 3))}`)}.`,
          `${M(`\\frac{P_A}{P_B} = \\frac{m_A/t_A}{m_B/t_B} = ${fmt(sig(r, 3))}`)}. Doing more work doesn't mean more power if it takes longer.`,
          `${B(opt(r))}`,
        ],
        visual: { key: 'e-power', params: { mode: 'compare', A: { m: mA, t: tA }, B: { m: mB, t: tB }, note: 'P_A / P_B = ' + num(r, 3) } },
      };
    },
  });

  gens.push({
    id: 'p1u3-conservation-concept', unit: 13, topic: 'Conservation of energy (concept)',
    make(rng) {
      const kind = rng.pick(['cliff', 'ramps', 'scale', 'halfway']);
      if (kind === 'cliff') {
        const right = 'All three hit the ground with the same speed.';
        return {
          type: 'mc',
          prompt: 'Three identical balls are thrown from the top of a cliff with the same speed: one straight up, one horizontally, one straight down. Ignoring air resistance, rank their speeds just before they hit the ground below.',
          ...mc(rng, right, ['The one thrown down is fastest, then horizontal, then up.', 'The one thrown up is fastest, because it falls from higher.', 'The horizontal one is fastest, because it has two velocity components.']),
          steps: [
            `Ball + Earth, no air resistance: ${M('\\tfrac12 mv_0^2 + mgh = \\tfrac12 mv_f^2')}.`,
            `All three start with the same ${M('v_0')} (energy doesn't care about direction) and drop the same height ${M('h')}.`,
            `So ${M('v_f = \\sqrt{v_0^2 + 2gh}')} is the same for all three. Their <i>times</i> and directions differ, but not their speeds.`,
            `${B(right)}`,
          ],
          visual: { key: 'e-track', params: { shape: 'drop', hA: 20, hB: 0, vA: 10, vB: Math.sqrt(100 + 2 * g * 20), title: 'Same start energy, same drop → same final speed', note: 'Direction of the throw does not appear in the energy equation.' } },
        };
      }
      if (kind === 'ramps') {
        const right = 'They reach the bottom with the same speed.';
        return {
          type: 'mc',
          prompt: 'Two blocks start from rest at the same height. One slides down a steep straight frictionless ramp; the other slides down a long, gently curved frictionless ramp to the same final height. Compare their speeds at the bottom.',
          ...mc(rng, right, ['The steep ramp gives the greater speed.', 'The curved ramp gives the greater speed, because the path is longer.', 'It depends on the masses of the blocks.']),
          steps: [
            `The normal force is perpendicular to the motion, so it does no work. Only gravity does work, and gravity's work depends only on the drop in height.`,
            `${M('mgh = \\tfrac12 mv^2')} for both, so ${M('v = \\sqrt{2gh}')} — independent of the ramp's shape and of the mass.`,
            `The ramps can change how <i>long</i> the trip takes, but not the final speed.`,
            `${B(right)}`,
          ],
          visual: { key: 'e-track', params: { shape: 'ramp', hA: 5, hB: 0, vA: 0, vB: Math.sqrt(2 * g * 5), title: 'Path shape does not matter, only Δh' } },
        };
      }
      if (kind === 'scale') {
        const k = rng.pick([2, 3]);
        const right = `${k * k} times as high`;
        return {
          type: 'mc',
          prompt: `On a frictionless track, a cart moving at speed ${M('v')} at the bottom rolls up a hill and reaches a maximum height ${M('h')}. If it starts at the bottom with speed ${M(k + 'v')} instead, how high does it go?`,
          ...mc(rng, right, [`${k} times as high`, `${k === 2 ? '√2' : '√3'} times as high`, `${2 * k} times as high`, `${k * k * k} times as high`]),
          steps: [
            `${M('\\tfrac12 mv^2 = mgh \\Rightarrow h = \\frac{v^2}{2g}')}.`,
            `Height is proportional to speed <i>squared</i>: ${M(`(${k}v)^2 = ${k * k}v^2`)}.`,
            `So the new height is ${M(`${k * k}h`)}.`,
            `${B(right)}`,
          ],
          visual: { key: 'e-bars', params: { before: { K: 1, Ug: 0 }, after: { K: 0, Ug: 1 }, rel: true, title: 'All the K becomes Ug: h ∝ v²' } },
        };
      }
      const right = 'Half of its total mechanical energy is kinetic.';
      return {
        type: 'mc',
        prompt: 'A pendulum is released from rest at height h above its lowest point. When the bob is at height h/2 (halfway down), which is true? (Take the lowest point as Ug = 0.)',
        ...mc(rng, right, ['Its speed is half of its speed at the bottom.', 'All of its energy is kinetic.', 'Its kinetic energy is one quarter of its total.']),
        steps: [
          `Total energy ${M('E = mgh')} is constant (tension does no work).`,
          `At height ${M('h/2')}: ${M('U_g = \\tfrac12 mgh')}, so ${M('K = E - U_g = \\tfrac12 mgh')} — half the total.`,
          `Speed there is ${M('\\sqrt{gh}')}, which is ${M('1/\\sqrt2 \\approx 0.71')} of the bottom speed ${M('\\sqrt{2gh}')}, not half.`,
          `${B(right)}`,
        ],
        visual: { key: 'e-bars', params: { before: { K: 0, Ug: 2 }, after: { K: 1, Ug: 1 }, rel: true, title: 'Halfway down: K = Ug', labels: ['Release', 'Height h/2'] } },
      };
    },
  });

  // ======================================================================
  // Lesson links
  // ======================================================================
  Object.assign(window.PR_LESSON_FOR_KEY, {
    'e-ke': 'p1u3-kinetic',
    'e-work': 'p1u3-work',
    'e-fx': 'p1u3-work-energy',
    'e-stop': 'p1u3-work-energy',
    'e-spring': 'p1u3-potential',
    'e-track': 'p1u3-conservation',
    'e-bars': 'p1u3-conservation',
    'e-power': 'p1u3-power',
  });
  window.PR_LESSON_FOR_TOPIC.push(
    [/work.energy|stopping distance|force.position graph/i, 'p1u3-work-energy'],
    [/^work/i, 'p1u3-work'],
    [/^kinetic energy/i, 'p1u3-kinetic'],
    [/potential energy/i, 'p1u3-potential'],
    [/dissipated|friction/i, 'p1u3-nonconservative'],
    [/conservation of energy|bar chart|systems/i, 'p1u3-conservation'],
    [/^power/i, 'p1u3-power'],
  );
})();
