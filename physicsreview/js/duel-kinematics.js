// Duel bank for AP Physics 1 · Unit 1 (Kinematics): problem generators, their
// visual explanations (keys 'k-*'), and links to the matching lessons.
// Loaded after problems.js, visuals.js and lesson-map.js. Deterministic: every
// random choice comes from the rng passed to make(), so both players match.
(function () {
  'use strict';
  const PR = window.PR;
  const sig = PR.sig, fmt = PR.fmt;
  const { M, X, Q, B, rnd, sgn, giv, tx, mc } = PRProblems.helpers;
  const gens = PRProblems.generators;

  const g = 9.8;
  const U = { m: tx('m'), s: tx('s'), mps: tx('m/s'), mps2: '\\text{m/s}^2', km: tx('km'), kmh: tx('km/h') };
  const gGiven = M('g = 9.8\\ \\text{m/s}^2');
  const DEG = Math.PI / 180;
  const deg = (x) => sig(x / DEG, 3);
  // Signed number for KaTeX: "+3" / "-3" with a real minus sign.
  const sn = (x) => (x < 0 ? '-' : '+') + fmt(Math.abs(x));
  // Sum written out term by term: "12 - 20 + 5"
  const sumTex = (xs) => xs.map((d, i) => (d < 0 ? '- ' : i ? '+ ' : '') + fmt(Math.abs(d))).join(' ');

  // ======================================================================
  // VISUALS
  // ======================================================================
  const h = PRVisuals.h;
  const { isNum, arr, num, svg, line, dline, path, arrow, text, rect, circle, dim, bg, title, textLines } = h;
  const signed = (x) => (x > 0 ? '+' : '') + num(x);

  function niceStep(range, n) {
    const raw = range / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 5, 10]) if (m * mag >= raw - 1e-9) return m * mag;
    return 10 * mag;
  }
  function filled(pts, c, op) {
    return '<path d="M' + pts.map((p) => h.r1(p[0]) + ' ' + h.r1(p[1])).join('L') + 'Z" style="fill:var(--' + c + ');fill-opacity:' + op + ';stroke:none"/>';
  }

  // 1D path on a number line: each leg above, the net displacement below.
  function kMotion(p) {
    const legs = arr(p.legs).filter(isNum), u = p.unit || 'm';
    const pos = [isNum(p.x0) ? p.x0 : 0];
    legs.forEach((d) => pos.push(pos[pos.length - 1] + d));
    let lo = Math.min.apply(null, pos), hi = Math.max.apply(null, pos);
    if (hi - lo < 1e-9) hi = lo + 1;
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const Xp = (v) => 50 + (540 * (v - lo)) / (hi - lo);
    let b = bg() + title(p.title || 'Distance vs displacement');
    const ax = 214;
    b += line(30, ax, 610, ax, 'muted', 1.5) + text(612, ax - 8, '+', { a: 'end', cls: 'small' });
    const gap = Math.min(30, 130 / Math.max(1, legs.length));
    legs.forEach((d, i) => {
      const y = 62 + i * gap;
      b += dline(Xp(pos[i]), y, Xp(pos[i]), ax, 'border', 1);
      b += arrow(Xp(pos[i]), y, Xp(pos[i + 1]), y, 'warn', 2.5);
      b += text((Xp(pos[i]) + Xp(pos[i + 1])) / 2, y - 7, (i + 1) + ': ' + num(Math.abs(d)) + ' ' + u + (d > 0 ? ' →' : ' ←'), { a: 'middle', sz: 12, halo: true });
    });
    pos.forEach((x) => { b += line(Xp(x), ax - 5, Xp(x), ax + 5, 'text', 1.5); });
    b += circle(Xp(pos[0]), ax, 6, { fill: 'good' }) + text(Xp(pos[0]), ax + 22, 'start', { a: 'middle', cls: 'small' });
    b += circle(Xp(pos[pos.length - 1]), ax, 6, { fill: 'pos' }) + text(Xp(pos[pos.length - 1]), ax - 12, 'end', { a: 'middle', cls: 'small' });
    const disp = pos[pos.length - 1] - pos[0];
    const dist = legs.reduce((a, d) => a + Math.abs(d), 0);
    b += arrow(Xp(pos[0]), 254, Xp(pos[pos.length - 1]), 254, 'accent', 3);
    b += text(320, 280, 'displacement Δx = ' + signed(disp) + ' ' + u + '   (start → end, straight line)', { a: 'middle', c: 'accent', w: 700 });
    b += text(320, 304, 'distance = ' + legs.map((d) => num(Math.abs(d))).join(' + ') + ' = ' + num(dist) + ' ' + u + '   (every bit of path)', { a: 'middle', w: 600, c: 'warn' });
    return svg('Distance traveled versus displacement on a number line', b);
  }

  // Motion graph: x–t, v–t (piecewise linear or dense curve). Optional shaded area or slope triangle.
  function kGraph(p) {
    const pts = arr(p.pts).filter((q) => Array.isArray(q) && isNum(q[0]) && isNum(q[1]));
    if (pts.length < 2) throw new Error('k-graph needs points');
    const kind = p.kind || 'v';
    const meta = { x: ['x (m)', 'Position vs time', 'm'], v: ['v (m/s)', 'Velocity vs time', 'm/s'], a: ['a (m/s²)', 'Acceleration vs time', 'm/s²'] }[kind];
    const tMax = p.tMax || pts[pts.length - 1][0];
    let yMin = Math.min(0, ...pts.map((q) => q[1])), yMax = Math.max(0, ...pts.map((q) => q[1]));
    if (yMax - yMin < 1e-9) yMax = yMin + 1;
    const ys = niceStep(yMax - yMin, 5);
    yMin = Math.floor(yMin / ys - 1e-9) * ys; yMax = Math.ceil(yMax / ys + 1e-9) * ys;
    const L = 64, T = 44, W = 548, Hh = 228;
    const Xp = (t) => L + (t / tMax) * W, Yp = (v) => T + Hh - ((v - yMin) / (yMax - yMin)) * Hh;
    const at = (t) => {
      for (let i = 1; i < pts.length; i++) {
        if (t <= pts[i][0] + 1e-9) { const a = pts[i - 1], c = pts[i]; return c[0] === a[0] ? c[1] : a[1] + ((c[1] - a[1]) * (t - a[0])) / (c[0] - a[0]); }
      }
      return pts[pts.length - 1][1];
    };
    let b = bg() + title(p.title || meta[1]) + text(L + W, 26, meta[0] + ' vs t (s)', { a: 'end', cls: 'small' });
    const ts = niceStep(tMax, 8);
    for (let i = 0; i * ts <= tMax + 1e-9; i++) {
      const t = i * ts;
      b += line(Xp(t), T, Xp(t), T + Hh, 'border', 1) + text(Xp(t), T + Hh + 16, num(t), { a: 'middle', cls: 'small' });
    }
    for (let i = 0; yMin + i * ys <= yMax + 1e-9; i++) {
      const v = yMin + i * ys;
      b += line(L, Yp(v), L + W, Yp(v), 'border', 1) + text(L - 8, Yp(v) + 4, num(Math.abs(v) < 1e-9 ? 0 : v), { a: 'end', cls: 'small' });
    }
    b += line(L, T, L, T + Hh, 'muted', 1.5) + line(L, Yp(0), L + W, Yp(0), 'muted', 1.5);
    // shaded area (v–t): split at breakpoints and zero crossings, + green, − red
    if (Array.isArray(p.shade)) {
      const t0 = p.shade[0], t1 = p.shade[1];
      const cuts = [t0];
      pts.forEach((q) => { if (q[0] > t0 && q[0] < t1) cuts.push(q[0]); });
      cuts.push(t1);
      for (let i = 0; i < cuts.length - 1; i++) {
        let a = cuts[i], c = cuts[i + 1], va = at(a), vc = at(c);
        const pieces = [];
        if (va * vc < 0) { const tc = a + ((c - a) * va) / (va - vc); pieces.push([a, va, tc, 0], [tc, 0, c, vc]); } else pieces.push([a, va, c, vc]);
        pieces.forEach((s) => {
          const pos = s[1] + s[3] >= 0;
          b += filled([[Xp(s[0]), Yp(0)], [Xp(s[0]), Yp(s[1])], [Xp(s[2]), Yp(s[3])], [Xp(s[2]), Yp(0)]], pos ? 'good' : 'pos', 0.25);
        });
      }
    }
    b += path('M' + pts.map((q) => h.r1(Xp(q[0])) + ' ' + h.r1(Yp(q[1]))).join('L'), 'text', 2.5);
    if (pts.length <= 8) pts.forEach((q) => { b += circle(Xp(q[0]), Yp(q[1]), 3.5, { fill: 'text' }); });
    if (Array.isArray(p.mark)) {
      const t0 = p.mark[0], t1 = p.mark[1], y0 = at(t0), y1 = at(t1);
      b += line(Xp(t0), Yp(y0), Xp(t1), Yp(y1), 'accent', 4);
      b += dline(Xp(t0), Yp(y0), Xp(t1), Yp(y0), 'accent', 1.5) + dline(Xp(t1), Yp(y0), Xp(t1), Yp(y1), 'accent', 1.5);
      b += text((Xp(t0) + Xp(t1)) / 2, Yp(y0) + (y1 >= y0 ? 16 : -8), 'Δt = ' + num(t1 - t0) + ' s', { a: 'middle', c: 'accent', sz: 12, halo: true });
      b += text(Xp(t1) + 6, (Yp(y0) + Yp(y1)) / 2 + 4, 'Δ' + kind + ' = ' + signed(y1 - y0), { c: 'accent', sz: 12, halo: true });
      const slope = (y1 - y0) / (t1 - t0);
      b += text(L + 8, T + 16, 'slope = ' + signed(y1 - y0) + ' / ' + num(t1 - t0) + ' = ' + signed(slope) + ' ' + (kind === 'x' ? 'm/s (velocity)' : 'm/s² (acceleration)'), { c: 'accent', w: 700, halo: true });
    }
    if (p.note) b += text(L + 8, T + (p.mark ? 34 : 16), p.note, { w: 700, c: 'accent', halo: true });
    return svg(meta[1] + ' graph', b);
  }

  // Velocity and acceleration arrows on a cart, plus a motion diagram.
  function kVA(p) {
    const sv = Math.sign(p.v || 0), sa = Math.sign(p.a || 0);
    let b = bg() + title('Velocity vs acceleration');
    const cx = 320, cy = 104;
    b += line(60, cy + 24, 580, cy + 24, 'muted', 2);
    b += rect(cx - 32, cy - 16, 64, 30, { fill: 'surface', stroke: 'text', sw: 2, rx: 7 });
    b += circle(cx - 18, cy + 17, 6, { fill: 'text' }) + circle(cx + 18, cy + 17, 6, { fill: 'text' });
    if (sv) b += arrow(cx, cy - 32, cx + sv * 120, cy - 32, 'accent', 3) + text(cx + sv * 128, cy - 28, 'v', { a: sv > 0 ? 'start' : 'end', c: 'accent', w: 700 });
    else b += text(cx, cy - 30, 'v = 0 (at rest)', { a: 'middle', c: 'accent', w: 700 });
    if (sa) b += arrow(cx, cy + 46, cx + sa * 80, cy + 46, 'warn', 3) + text(cx + sa * 88, cy + 50, 'a', { a: sa > 0 ? 'start' : 'end', c: 'warn', w: 700 });
    else b += text(cx, cy + 50, 'a = 0', { a: 'middle', c: 'warn', w: 700 });
    // motion diagram: equal time steps
    const v0 = sv, a0 = sa * (sv ? 0.15 : 0.3);
    const xs = []; for (let t = 0; t <= 6; t++) xs.push(v0 * t + 0.5 * a0 * t * t);
    let lo = Math.min(...xs), hi = Math.max(...xs); if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const Xp = (x) => 80 + (480 * (x - lo)) / (hi - lo);
    b += text(60, 196, 'Motion diagram (one dot per equal time step):', { cls: 'small' });
    b += line(60, 226, 580, 226, 'border', 1);
    xs.forEach((x, i) => { b += circle(Xp(x), 226, 7, { fill: i ? 'muted' : 'accent' }); });
    b += text(Xp(xs[0]), 250, 't = 0', { a: 'middle', cls: 'small' });
    const verdict = !sa ? (sv ? 'a = 0 → constant velocity (dots evenly spaced)' : 'No velocity, no acceleration → stays at rest')
      : !sv ? 'Starts from rest → speeds up in the direction of a'
        : sv === sa ? 'v and a point the same way → speeding up (gaps grow)' : 'v and a point opposite ways → slowing down (gaps shrink)';
    b += text(320, 292, verdict, { a: 'middle', w: 700, c: 'accent' });
    return svg('Velocity and acceleration directions with a motion diagram', b);
  }

  // Constant-acceleration motion diagram + table of the five kinematic variables.
  function kDots(p) {
    const v0 = +p.v0, a = +p.a, t = +p.t, pre = isNum(p.pre) ? p.pre : 0;
    const N = 6, xs = [];
    for (let i = 0; i <= N; i++) { const tt = (t * i) / N; xs.push(pre + v0 * tt + 0.5 * a * tt * tt); }
    const all = xs.concat([0]);
    let lo = Math.min(...all), hi = Math.max(...all); if (hi - lo < 1e-9) hi = lo + 1;
    const Xp = (x) => 60 + (520 * (x - lo)) / (hi - lo);
    let b = bg() + title(p.title || 'Constant acceleration');
    const y = 112;
    b += line(40, y, 600, y, 'border', 1.5);
    if (pre > 0) {
      for (let i = 0; i < 4; i++) b += circle(Xp((pre * i) / 4), y, 6, { fill: 'muted' });
      b += dim(Xp(0), y + 30, Xp(pre), 'reaction: ' + num(pre) + ' m');
    }
    xs.forEach((x, i) => { b += circle(Xp(x), y, 7, { fill: 'accent' }); });
    const vMax = Math.max(Math.abs(v0), Math.abs(+p.v), 1e-9);
    if (Math.abs(v0) > 1e-9) b += arrow(Xp(xs[0]), y - 26, Xp(xs[0]) + (Math.sign(v0) * 70 * Math.abs(v0)) / vMax, y - 26, 'accent', 2.5) + text(Xp(xs[0]), y - 38, 'v₀', { c: 'accent', w: 700 });
    if (Math.abs(+p.v) > 1e-9) b += arrow(Xp(xs[N]), y - 26, Xp(xs[N]) + (Math.sign(+p.v) * 70 * Math.abs(+p.v)) / vMax, y - 26, 'accent', 2.5) + text(Xp(xs[N]), y - 38, 'v', { c: 'accent', w: 700 });
    else b += text(Xp(xs[N]), y - 30, 'v = 0', { a: 'middle', c: 'accent', w: 700 });
    if (Math.abs(a) > 1e-9) b += arrow(300, y + 58, 300 + Math.sign(a) * 60, y + 58, 'warn', 2.5) + text(300 + Math.sign(a) * 70, y + 62, 'a', { a: a > 0 ? 'start' : 'end', c: 'warn', w: 700 });
    const cols = [['v₀', p.v0, 'm/s'], ['v', p.v, 'm/s'], ['a', p.a, 'm/s²'], ['t', p.t, 's'], ['Δx', p.dx, 'm']];
    const keys = ['v0', 'v', 'a', 't', 'dx'];
    cols.forEach((c, i) => {
      const x0 = 34 + i * 116, unk = keys[i] === p.unknown;
      b += rect(x0, 196, 108, 58, { fill: unk ? 'accent' : 'surface', op: unk ? 0.15 : 1, stroke: unk ? 'accent' : 'border', sw: unk ? 2 : 1, rx: 8 });
      b += text(x0 + 54, 216, c[0] + (unk ? ' (unknown)' : ''), { a: 'middle', w: 700, c: unk ? 'accent' : null, sz: 12 });
      b += text(x0 + 54, 240, isNum(+c[1]) ? num(+c[1]) + ' ' + c[2] : '—', { a: 'middle', sz: 13, w: unk ? 700 : 400 });
    });
    if (p.eq) b += text(320, 290, 'Used: ' + p.eq, { a: 'middle', w: 700, c: 'accent', sz: 15 });
    return svg('Motion diagram and the five kinematic variables', b);
  }

  // Vertical free fall: strobe dots going up (left column) and down (right column).
  function kFreeFall(p) {
    const h0 = isNum(p.h0) ? p.h0 : 0, v0 = isNum(p.v0) ? p.v0 : 0;
    const tTop = v0 > 0 ? v0 / g : 0;
    const H = h0 + (v0 > 0 ? (v0 * v0) / (2 * g) : 0);
    const T = (v0 + Math.sqrt(v0 * v0 + 2 * g * h0)) / g;
    const vImp = Math.sqrt(v0 * v0 + 2 * g * h0);
    const gy = 288, s = 236 / Math.max(H, 1e-6);
    const Yp = (y) => gy - y * s;
    let b = bg() + title(p.title || 'Free fall');
    b += line(30, gy, 360, gy, 'text', 2);
    if (h0 > 0) b += rect(120, Yp(h0), 110, gy - Yp(h0), { fill: 'muted', op: 0.25, stroke: 'muted', sw: 1 });
    const N = 10, vMax = Math.max(Math.abs(v0), vImp, 1e-6);
    for (let i = 0; i <= N; i++) {
      const tt = (T * i) / N, y = h0 + v0 * tt - 0.5 * g * tt * tt, v = v0 - g * tt;
      const x = v0 > 0 ? (tt < tTop ? 252 : 292) : 272;
      b += circle(x, Yp(y), 6, { fill: i === 0 ? 'good' : 'text' });
      if (i % 2 === 0 && Math.abs(v) > 0.05 * vMax) {
        const L = (38 * Math.abs(v)) / vMax;
        b += arrow(x + (x < 270 ? -14 : 14), Yp(y), x + (x < 270 ? -14 : 14), Yp(y) - Math.sign(v) * L, 'accent', 2);
      }
    }
    if (v0 > 0) {
      b += circle(272, Yp(H), 6, { fill: 'accent' }) + text(282, Yp(H) - 8, 'top: v = 0, a = g ↓', { c: 'accent', w: 700, sz: 12, halo: true });
      b += dline(40, Yp(H), 240, Yp(H), 'muted', 1);
    }
    b += arrow(70, 70, 70, 120, 'warn', 3) + text(80, 100, 'a = g', { c: 'warn', w: 700 });
    b += text(70, 138, 'always ↓', { a: 'middle', cls: 'small' });
    const lines = [
      'launch: ' + (v0 > 0 ? num(v0) + ' m/s up' : v0 < 0 ? num(-v0) + ' m/s down' : 'dropped from rest'),
      'launch height: ' + num(h0) + ' m',
    ];
    if (v0 > 0) lines.push('time to top: v₀/g = ' + num(tTop) + ' s', 'max height: ' + num(H) + ' m');
    lines.push('time to ground: ' + num(T) + ' s', 'impact speed: ' + num(vImp) + ' m/s');
    lines.forEach((l, i) => { b += text(380, 70 + i * 24, l, { w: i >= lines.length - 2 ? 700 : 400 }); });
    b += text(380, 70 + lines.length * 24 + 8, 'blue arrows: velocity', { cls: 'small' });
    return svg('Free-fall motion diagram', b);
  }

  // Relative motion: stacked 1D velocities, two cars approaching, or a river crossing.
  function kRelative(p) {
    let b = bg();
    if (p.mode === 'approach') {
      const vA = +p.vA, vB = +p.vB, d = +p.d;
      b += title('Closing in: relative speed');
      b += line(40, 170, 600, 170, 'muted', 2);
      const car = (x, c) => rect(x - 26, 140, 52, 24, { fill: c, op: 0.85, rx: 6 }) + circle(x - 14, 166, 5, { fill: 'text' }) + circle(x + 14, 166, 5, { fill: 'text' });
      b += car(100, 'accent') + car(540, 'warn');
      b += arrow(100, 116, 100 + 100 * vA / Math.max(vA, vB), 116, 'accent', 3) + text(100, 104, num(vA) + ' m/s', { c: 'accent', w: 700 });
      b += arrow(540, 116, 540 - 100 * vB / Math.max(vA, vB), 116, 'warn', 3) + text(540, 104, num(vB) + ' m/s', { a: 'end', c: 'warn', w: 700 });
      b += dim(100, 206, 540, 'gap: ' + num(d) + ' m');
      b += text(320, 258, 'In A\'s frame, B approaches at ' + num(vA) + ' + ' + num(vB) + ' = ' + num(vA + vB) + ' m/s', { a: 'middle', w: 600 });
      b += text(320, 286, 't = gap / closing speed = ' + num(d) + ' / ' + num(vA + vB) + ' = ' + num(d / (vA + vB)) + ' s', { a: 'middle', w: 700, c: 'accent' });
      return svg('Two objects approaching each other', b);
    }
    if (p.mode === 'river') {
      const vb = +p.vb, vw = +p.vw, W = +p.W, straight = !!p.straight;
      b += title(straight ? 'Aim upstream to go straight across' : 'Crossing a river with a current');
      b += rect(20, 44, 600, 26, { fill: 'good', op: 0.25 }) + rect(20, 70, 600, 196, { fill: 'accent', op: 0.08 }) + rect(20, 266, 600, 26, { fill: 'good', op: 0.25 });
      for (let i = 0; i < 4; i++) b += arrow(440 + (i % 2) * 70, 100 + i * 42, 480 + (i % 2) * 70, 100 + i * 42, 'muted', 1.5);
      b += text(600, 88, 'current ' + num(vw) + ' m/s →', { a: 'end', cls: 'small' });
      const sx = 140, sy = 266, vs = 120 / Math.max(vb, vw, Math.hypot(vb, vw));
      if (!straight) {
        const drift = (vw * W) / vb, s = Math.min(196 / W, 360 / Math.max(drift, 1e-6));
        b += dline(sx, sy, sx + drift * s, sy - W * s, 'muted', 1.5);
        b += arrow(sx, sy, sx, sy - vb * vs, 'text', 2.5) + text(sx - 8, sy - vb * vs / 2, 'boat/water ' + num(vb), { a: 'end', sz: 12, halo: true });
        b += arrow(sx, sy - vb * vs, sx + vw * vs, sy - vb * vs, 'warn', 2.5) + text(sx + vw * vs / 2, sy - vb * vs - 8, 'water ' + num(vw), { a: 'middle', c: 'warn', sz: 12, halo: true });
        b += arrow(sx, sy, sx + vw * vs, sy - vb * vs, 'accent', 3);
        b += text(320, 210, 't = W / v_boat = ' + num(W) + ' / ' + num(vb) + ' = ' + num(W / vb) + ' s', { w: 700, halo: true });
        b += text(320, 232, 'drift = v_water · t = ' + num(drift) + ' m', { w: 700, c: 'warn', halo: true });
        b += text(320, 254, 'ground speed = √(' + num(vb) + '² + ' + num(vw) + '²) = ' + num(Math.hypot(vb, vw)) + ' m/s', { w: 700, c: 'accent', halo: true });
      } else {
        const vy = Math.sqrt(Math.max(0, vb * vb - vw * vw));
        b += dline(sx, sy, sx, 70, 'muted', 1.5);
        b += arrow(sx, sy, sx - vw * vs, sy - vy * vs, 'text', 2.5) + text(sx - vw * vs - 6, sy - vy * vs - 6, 'heading ' + num(vb), { a: 'end', sz: 12, halo: true });
        b += arrow(sx - vw * vs, sy - vy * vs, sx, sy - vy * vs, 'warn', 2.5);
        b += arrow(sx, sy, sx, sy - vy * vs, 'accent', 3);
        b += text(260, 190, 'sin θ = v_water / v_boat = ' + num(vw) + '/' + num(vb) + ' → θ = ' + num(Math.asin(vw / vb) / DEG) + '° upstream', { w: 600, halo: true });
        b += text(260, 214, 'speed across = √(' + num(vb) + '² − ' + num(vw) + '²) = ' + num(vy) + ' m/s', { w: 700, c: 'accent', halo: true });
        b += text(260, 238, 't = ' + num(W) + ' / ' + num(vy) + ' = ' + num(W / vy) + ' s', { w: 700, halo: true });
      }
      b += text(30, 306, 'width W = ' + num(W) + ' m', { cls: 'small' });
      return svg('River crossing velocity triangle', b);
    }
    // stacked 1D: frame relative to ground, object relative to frame, object relative to ground
    const vF = +p.vF, vO = +p.vO, sum = vF + vO, F = p.F || 'frame', O = p.O || 'object';
    b += title('Adding velocities in 1D');
    const sc = 220 / Math.max(Math.abs(vF), Math.abs(vO), Math.abs(sum), 1e-6), x0 = 320;
    const row = (y, v, c, lab) => line(x0, y - 14, x0, y + 14, 'border', 1) +
      (Math.abs(v) > 1e-9 ? arrow(x0, y, x0 + v * sc, y, c, 3) : '') + text(x0 + (v >= 0 ? -8 : 8), y + 5, lab, { a: v >= 0 ? 'end' : 'start', sz: 12 }) +
      text(x0 + v * sc + (v >= 0 ? 8 : -8), y + 5, signed(v) + ' m/s', { a: v >= 0 ? 'start' : 'end', c: c, w: 700 });
    b += row(84, vF, 'text', F + ' rel. ground');
    b += row(144, vO, 'warn', O + ' rel. ' + F);
    b += line(80, 180, 560, 180, 'border', 1);
    b += row(222, sum, 'accent', O + ' rel. ground');
    b += text(320, 288, 'v(' + O + ', ground) = v(' + O + ', ' + F + ') + v(' + F + ', ground) = ' + signed(vO) + ' ' + signed(vF).replace(/^(\d)/, '+$1') + ' = ' + signed(sum) + ' m/s', { a: 'middle', w: 600, sz: 12 });
    return svg('Relative velocity: adding velocities in one dimension', b);
  }

  // Vectors on axes: tip-to-tail chain, optional resultant and components.
  function kVectors(p) {
    const vecs = arr(p.vecs).filter((v) => v && isNum(v.x) && isNum(v.y));
    if (!vecs.length) throw new Error('k-vectors needs vecs');
    const u = p.unit || '';
    const chain = [[0, 0]];
    vecs.forEach((v) => { const l = chain[chain.length - 1]; chain.push([l[0] + v.x, l[1] + v.y]); });
    const xs = chain.map((c) => c[0]), ys = chain.map((c) => c[1]);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const span = Math.max(x1 - x0, y1 - y0, 1e-6);
    if (x1 - x0 < span * 0.3) { x0 -= span * 0.15; x1 += span * 0.15; }
    if (y1 - y0 < span * 0.3) { y0 -= span * 0.15; y1 += span * 0.15; }
    const sc = Math.min(440 / (x1 - x0), 220 / (y1 - y0));
    const ox = 100 + (440 - (x1 - x0) * sc) / 2 - x0 * sc, oy = 280 - (220 - (y1 - y0) * sc) / 2 + y0 * sc;
    const P = (x, y) => [ox + x * sc, oy - y * sc];
    let b = bg() + title(p.title || (p.sum ? 'Adding vectors tip to tail' : 'Vector components'));
    b += line(40, oy, 620, oy, 'border', 1) + line(ox, 40, ox, 310, 'border', 1);
    b += text(616, oy - 6, p.xName || '+x', { a: 'end', cls: 'small' }) + text(ox + 6, 52, p.yName || '+y', { cls: 'small' });
    vecs.forEach((v, i) => {
      const a = P(chain[i][0], chain[i][1]), c = P(chain[i + 1][0], chain[i + 1][1]);
      b += arrow(a[0], a[1], c[0], c[1], 'text', 2.5);
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1, nx = -(c[1] - a[1]) / L, ny = (c[0] - a[0]) / L;
      b += text((a[0] + c[0]) / 2 + nx * 16, (a[1] + c[1]) / 2 + ny * 16 + 4, (v.label || '') + ' = ' + num(Math.hypot(v.x, v.y)) + (u ? ' ' + u : ''), { a: 'middle', w: 700, sz: 12, halo: true });
      if (p.comps && vecs.length === 1) {
        b += dline(a[0], a[1], c[0], a[1], 'warn', 2) + dline(c[0], a[1], c[0], c[1], 'warn', 2);
        b += text((a[0] + c[0]) / 2, a[1] + (v.y >= 0 ? 18 : -8), (v.label || 'A') + 'x = ' + num(v.x), { a: 'middle', c: 'warn', w: 700, halo: true });
        b += text(c[0] + (v.x >= 0 ? 8 : -8), (a[1] + c[1]) / 2 + 4, (v.label || 'A') + 'y = ' + num(v.y), { a: v.x >= 0 ? 'start' : 'end', c: 'warn', w: 700, halo: true });
        const ang = Math.atan2(v.y, v.x) / DEG;
        b += text(a[0] + 40 * Math.sign(v.x || 1), a[1] - 8 * Math.sign(v.y || 1), 'θ = ' + num(Math.abs(ang) > 90 ? 180 - Math.abs(ang) : Math.abs(ang)) + '°', { a: 'middle', sz: 12, c: 'muted' });
      }
    });
    if (p.sum && vecs.length > 1) {
      const e = chain[chain.length - 1], a = P(0, 0), c = P(e[0], e[1]);
      b += arrow(a[0], a[1], c[0], c[1], 'accent', 3);
      if (p.comps) b += dline(a[0], a[1], c[0], a[1], 'warn', 1.5) + dline(c[0], a[1], c[0], c[1], 'warn', 1.5);
      b += text(320, 306, 'R = √(' + num(e[0]) + '² + ' + num(e[1]) + '²) = ' + num(Math.hypot(e[0], e[1])) + (u ? ' ' + u : '') +
        ',  θ = ' + num(Math.atan2(e[1], e[0]) / DEG) + '° from +x', { a: 'middle', w: 700, c: 'accent' });
    }
    return svg('Vector diagram', b);
  }

  // Projectile: trajectory with equal-time dots and velocity components.
  function kProjectile(p) {
    const v0 = +p.v0 || 10, ang = (isNum(p.ang) ? p.ang : 45) * DEG, h0 = isNum(p.h0) ? p.h0 : 0;
    const vx = v0 * Math.cos(ang), vy0 = v0 * Math.sin(ang);
    const T = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h0)) / g, R = vx * T;
    const H = h0 + (vy0 > 0 ? (vy0 * vy0) / (2 * g) : 0);
    const sxF = 470 / Math.max(R, 1e-6), syF = 210 / Math.max(H, 1e-6), s = Math.min(sxF, syF);
    const sx = Math.min(sxF, Math.max(s, 220 / Math.max(R, 1e-6))), sy = Math.min(syF, Math.max(s, 120 / Math.max(H, 1e-6)));
    const x0 = 90, gy = 272;
    const P = (x, y) => [x0 + x * sx, gy - y * sy];
    let b = bg() + title(p.title || (h0 > 0 && Math.abs(vy0) < 1e-9 ? 'Horizontal launch' : 'Projectile motion'));
    b += line(20, gy, 620, gy, 'text', 2);
    if (h0 > 0) b += rect(20, gy - h0 * sy, x0 - 20, h0 * sy, { fill: 'muted', op: 0.25, stroke: 'muted', sw: 1 });
    let d = '';
    for (let i = 0; i <= 40; i++) { const t = (T * i) / 40, q = P(vx * t, h0 + vy0 * t - 0.5 * g * t * t); d += (i ? 'L' : 'M') + h.r1(q[0]) + ' ' + h.r1(q[1]); }
    b += path(d, 'accent', 1.5, ';stroke-dasharray:5 4');
    const N = 8, vs = 46 / v0;
    for (let i = 0; i <= N; i++) {
      const t = (T * i) / N, vy = vy0 - g * t, q = P(vx * t, h0 + vy0 * t - 0.5 * g * t * t);
      b += circle(q[0], q[1], 4.5, { fill: 'text' });
      if (i === 0 || i === N || i === Math.round((vy0 / g / T) * N)) {
        b += arrow(q[0], q[1], q[0] + vx * vs, q[1], 'accent', 2.2);
        if (Math.abs(vy) * vs > 4) b += arrow(q[0], q[1], q[0], q[1] - vy * vs, 'warn', 2.2);
      }
    }
    if (vy0 > 0) {
      const tp = vy0 / g, q = P(vx * tp, H);
      b += dline(q[0], q[1], q[0], gy, 'muted', 1) + text(q[0] + 6, (q[1] + gy) / 2, 'H = ' + num(H) + ' m', { w: 600, sz: 12, halo: true });
      b += text(q[0], q[1] - 12, 'top: vy = 0, vx unchanged', { a: 'middle', sz: 11, c: 'accent', halo: true });
    }
    b += dim(x0, gy + 22, x0 + R * sx, 'R = ' + num(R) + ' m');
    if (h0 > 0) b += text(26, gy - h0 * sy - 8, 'h = ' + num(h0) + ' m', { sz: 12, w: 600 });
    b += text(620, 26, 'v₀ = ' + num(v0) + ' m/s at ' + num(ang / DEG) + '°', { a: 'end', w: 600, sz: 12 });
    b += text(620, 44, 'vx = ' + num(vx) + ' m/s (constant)', { a: 'end', c: 'accent', sz: 12 });
    b += text(620, 62, 'vy₀ = ' + num(vy0) + ' m/s, changes by −g each s', { a: 'end', c: 'warn', sz: 12 });
    b += text(620, 80, 'time in air T = ' + num(T) + ' s', { a: 'end', w: 700, sz: 12 });
    return svg('Projectile trajectory with velocity components', b);
  }

  PRVisuals.register({
    'k-motion': kMotion, 'k-graph': kGraph, 'k-va': kVA, 'k-dots': kDots, 'k-freefall': kFreeFall,
    'k-relative': kRelative, 'k-vectors': kVectors, 'k-projectile': kProjectile,
  });

  // ======================================================================
  // LESSON LINKS
  // ======================================================================
  Object.assign(window.PR_LESSON_FOR_KEY, {
    'k-motion': 'p1u1-describe', 'k-graph': 'p1u1-graphs', 'k-va': 'p1u1-acceleration', 'k-dots': 'p1u1-kinematic-eqs',
    'k-freefall': 'p1u1-free-fall', 'k-relative': 'p1u1-relative', 'k-vectors': 'p1u1-vectors', 'k-projectile': 'p1u1-projectile',
  });
  window.PR_LESSON_FOR_TOPIC.push(
    [/distance vs displacement|scalars and vectors/i, 'p1u1-describe'],
    [/average (speed|velocity)/i, 'p1u1-velocity'],
    [/speeding up/i, 'p1u1-acceleration'],
    [/position.time graph|velocity.time graph|motion graphs/i, 'p1u1-graphs'],
    [/kinematic equations|stopping distance/i, 'p1u1-kinematic-eqs'],
    [/free fall/i, 'p1u1-free-fall'],
    [/relative (velocity|motion)|river crossing/i, 'p1u1-relative'],
    [/vector components|adding vectors/i, 'p1u1-vectors'],
    [/horizontal launch|projectile/i, 'p1u1-projectile']
  );

  const concept = (title, bullets) => ({ key: 'concept', params: { title, bullets } });

  // ======================================================================
  // GENERATORS — AP Physics 1 · Unit 1 · Kinematics
  // ======================================================================

  gens.push({
    id: 'p1u1-displacement', unit: 11, topic: 'Distance vs displacement',
    make(rng) {
      const who = rng.pick(['A student walks', 'A dog runs', 'A robot rolls', 'A cyclist rides']);
      const n = rng.int(2, 3);
      const legs = [];
      let s = sgn(rng);
      for (let i = 0; i < n; i++) { legs.push(s * rng.int(3, 30)); s = i === 0 ? -s : sgn(rng); }
      let disp = legs.reduce((a, d) => a + d, 0);
      if (disp === 0) { legs[n - 1] += legs[n - 1] > 0 ? 2 : -2; disp = legs.reduce((a, d) => a + d, 0); }
      const dist = legs.reduce((a, d) => a + Math.abs(d), 0);
      const ask = rng.pick(['distance', 'displacement']);
      const desc = legs.map((d) => `${Math.abs(d)} m ${d > 0 ? 'east' : 'west'}`).join(', then ');
      return {
        type: 'numeric',
        prompt: `${who} along a straight east–west path: ${desc}. What is the ${ask === 'distance' ? 'total distance traveled' : 'displacement (east is +, so give a negative number if it ends up west of where it started)'}? Answer in m.`,
        answer: ask === 'distance' ? dist : disp, units: 'm',
        steps: [
          `Distance is a scalar: add up every bit of path, ignoring direction. Displacement is a vector: ${M('\\Delta x = x_f - x_i')}, where you ended up relative to where you started.`,
          `Give each leg a sign (east +, west −) and add: ${M(`\\Delta x = ${sumTex(legs)} = ${disp}\\ \\text{m}`)}.`,
          `Add the sizes for distance: ${M(`d = ${legs.map((d) => Math.abs(d)).join(' + ')} = ${dist}\\ \\text{m}`)}.`,
          `${B(ask === 'distance' ? `distance = ${dist} m` : `Δx = ${disp} m`)}. Distance is never smaller than |displacement|; they match only if the motion never reverses.`,
        ],
        visual: { key: 'k-motion', params: { legs, unit: 'm' } },
      };
    },
  });

  gens.push({
    id: 'p1u1-avg-velocity', unit: 11, topic: 'Average speed & velocity',
    make(rng) {
      const d1 = rng.int(6, 30) * 10;
      let d2 = rng.int(2, 25) * 10; if (d2 === d1) d2 += 10;
      const t1 = rng.int(10, 60), t2 = rng.int(5, 40);
      const ask = rng.pick(['speed', 'velocity']);
      const ans = ask === 'speed' ? (d1 + d2) / (t1 + t2) : (d1 - d2) / (t1 + t2);
      return {
        type: 'numeric',
        prompt: `A runner on a straight track runs ${Q(d1, U.m)} east in ${Q(t1, U.s)}, then turns around and runs ${Q(d2, U.m)} west in ${Q(t2, U.s)}. What is the runner's average ${ask} for the whole trip? Answer in m/s${ask === 'velocity' ? ' (east is +)' : ''}.`,
        answer: sig(ans, 3), units: 'm/s',
        steps: [
          `Average speed = total distance ÷ total time. Average velocity = displacement ÷ total time, ${M('v_{avg} = \\Delta x/\\Delta t')}. Both use the <i>whole</i> elapsed time.`,
          `Total time: ${M(`${t1} + ${t2} = ${t1 + t2}\\ \\text{s}`)}. Distance: ${M(`${d1} + ${d2} = ${d1 + d2}\\ \\text{m}`)}. Displacement: ${M(`${d1} - ${d2} = ${d1 - d2}\\ \\text{m}`)}.`,
          ask === 'speed' ? M(`\\text{avg speed} = \\frac{${d1 + d2}}{${t1 + t2}} = ${fmt(ans)}\\ \\text{m/s}`) : M(`v_{avg} = \\frac{${d1 - d2}}{${t1 + t2}} = ${fmt(ans)}\\ \\text{m/s}`),
          `${B(`${ask === 'speed' ? 'average speed' : 'average velocity'} ≈ ${X(ans)} m/s`)}. Averaging the two leg speeds would be wrong: the legs take different times.`,
        ],
        visual: { key: 'k-motion', params: { legs: [d1, -d2], unit: 'm' } },
      };
    },
  });

  gens.push({
    id: 'p1u1-round-trip', unit: 11, topic: 'Average speed (round trip)',
    make(rng) {
      let v1 = rng.pick([30, 40, 50, 60]), v2 = rng.pick([60, 80, 90, 100, 120]);
      if (v1 === v2) v2 = 90;
      const d = rng.int(2, 12) * 10;
      const ask = rng.pick(['speed', 'speed', 'velocity']);
      const harm = (2 * v1 * v2) / (v1 + v2), arith = (v1 + v2) / 2;
      const opt = (x) => M(fmt(x, 3) + '\\ \\text{km/h}');
      const correct = ask === 'speed' ? opt(harm) : opt(0);
      const wrongs = ask === 'speed' ? [opt(arith), opt(0), opt(Math.abs(v2 - v1)), opt(v1 + v2), opt(v2)] : [opt(harm), opt(arith), opt(Math.abs(v2 - v1)), opt(v2)];
      return {
        type: 'mc',
        prompt: `A car drives ${Q(d, U.km)} along a straight road to a town at a steady ${Q(v1, U.kmh)}, then drives straight back home at ${Q(v2, U.kmh)}. What is the car's average ${ask} for the whole round trip?`,
        ...mc(rng, correct, wrongs),
        steps: [
          `Times for each leg: ${M(`t_1 = \\frac{${d}}{${v1}} = ${fmt(d / v1)}\\ \\text{h}`)}, ${M(`t_2 = \\frac{${d}}{${v2}} = ${fmt(d / v2)}\\ \\text{h}`)}.`,
          ask === 'speed'
            ? `Average speed = total distance ÷ total time: ${M(`\\frac{${2 * d}}{${fmt(d / v1 + d / v2)}} = ${fmt(harm)}\\ \\text{km/h}`)}.`
            : `The car ends where it started, so its displacement is 0 and ${M('v_{avg} = \\Delta x/\\Delta t = 0')}.`,
          `The car spends <i>more time</i> at the slower speed, so the average speed is below the simple average ${M(fmt(arith) + '\\ \\text{km/h}')}.`,
          `${B(ask === 'speed' ? `average speed ≈ ${fmt(harm, 3)} km/h` : 'average velocity = 0')}.`,
        ],
        visual: { key: 'k-motion', params: { legs: [d, -d], unit: 'km', title: 'Round trip: distance vs displacement' } },
      };
    },
  });

  const VA_OPTS = [
    'Moving in the + direction and speeding up', 'Moving in the + direction and slowing down',
    'Moving in the − direction and speeding up', 'Moving in the − direction and slowing down',
  ];
  gens.push({
    id: 'p1u1-accel-sign', unit: 11, topic: 'Acceleration: speeding up or slowing down',
    make(rng) {
      const sv = sgn(rng), sa = sgn(rng);
      const variant = rng.pick(['numbers', 'words', 'which-a']);
      const idx = (sv > 0 ? 0 : 2) + (sv === sa ? 0 : 1);
      if (variant === 'which-a') {
        const speeding = rng() < 0.5;
        const aDir = speeding ? sv : -sv;
        const dirOpt = (s) => (s > 0 ? 'In the + direction' : 'In the − direction');
        return {
          type: 'mc',
          prompt: `A cart moves in the ${sv > 0 ? '+' : '−'} direction along a straight track and is ${speeding ? 'speeding up' : 'slowing down'}. Which way does its acceleration point?`,
          ...mc(rng, dirOpt(aDir), [dirOpt(-aDir), 'The acceleration is zero', 'Perpendicular to the track']),
          steps: [
            `Acceleration is the rate of change of velocity, ${M('a = \\Delta v/\\Delta t')}. Its direction is the direction of ${M('\\Delta v')}.`,
            speeding ? `Speeding up: velocity gets bigger in the direction it already points, so ${M('\\Delta v')} points the same way as ${M('v')}.` : `Slowing down: velocity shrinks, so ${M('\\Delta v')} points opposite to ${M('v')}.`,
            `"Negative acceleration" does not automatically mean slowing down — only the comparison with v's direction tells you that.`,
            `${B(dirOpt(aDir))}.`,
          ],
          visual: { key: 'k-va', params: { v: sv, a: aDir } },
        };
      }
      const v = sv * rnd(rng, 2, 15, 2), a = sa * rnd(rng, 1, 5, 2);
      const prompt = variant === 'numbers'
        ? `At one instant an object has velocity ${Q(v, U.mps)} and acceleration ${Q(a, U.mps2)}. Which describes its motion at that instant?`
        : `A car is moving ${sv > 0 ? 'east' : 'west'} and its acceleration points ${sa > 0 ? 'east' : 'west'}. Taking east as +, which describes its motion?`;
      return {
        type: 'mc', prompt,
        ...mc(rng, VA_OPTS[idx], VA_OPTS.filter((_, i) => i !== idx)),
        steps: [
          `The sign of v tells you the direction of motion: ${sv > 0 ? '+' : '−'}.`,
          `Speeding up or slowing down depends on whether v and a point the <b>same</b> way (speeding up) or <b>opposite</b> ways (slowing down).`,
          `Here v is ${sv > 0 ? '+' : '−'} and a is ${sa > 0 ? '+' : '−'}: ${sv === sa ? 'same direction' : 'opposite directions'}. A negative a alone does not mean slowing down.`,
          `${B(VA_OPTS[idx])}.`,
        ],
        visual: { key: 'k-va', params: { v: sv, a: sa } },
      };
    },
  });

  gens.push({
    id: 'p1u1-xt-graph', unit: 11, topic: 'Position–time graphs',
    make(rng) {
      const VS = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
      let ts, xs, vs;
      for (let tries = 0; tries < 12; tries++) {
        ts = [0]; xs = [rng.pick([0, 0, 2, 4, 6, 10])]; vs = [];
        for (let k = 0; k < 3; k++) { const dt = rng.int(2, 4), v = rng.pick(VS); vs.push(v); ts.push(ts[k] + dt); xs.push(xs[k] + v * dt); }
        if (vs.some((v) => v !== 0) && !vs.every((v) => v === vs[0])) break;
        if (tries === 11) { ts = [0, 3, 5, 8]; xs = [2, 11, 11, 3]; vs = [3, 0, -8 / 3]; }
      }
      const pts = ts.map((t, i) => [t, xs[i]]);
      let variant = rng.pick(['seg', 'seg', 'avg', 'dist']);
      const T = ts[3];
      const nz = vs.map((v, i) => i).filter((i) => vs[i] !== 0);
      const k = rng.pick(nz);
      const avg = (xs[3] - xs[0]) / T;
      if (variant === 'avg' && avg === 0) variant = 'seg';
      const dist = vs.reduce((a, v, i) => a + Math.abs(v * (ts[i + 1] - ts[i])), 0);
      let prompt, ans, units = 'm/s', steps, mark, note;
      const lead = 'The position–time graph shows an object moving along a straight line.';
      if (variant === 'seg') {
        ans = vs[k]; mark = [ts[k], ts[k + 1]];
        prompt = `${lead} What is its velocity between ${M(`t = ${ts[k]}`)} s and ${M(`t = ${ts[k + 1]}`)} s? Answer in m/s (negative if it moves in the − direction).`;
        steps = [
          `On an x–t graph the <b>slope</b> is the velocity: ${M('v = \\Delta x/\\Delta t')}.`,
          `Read the endpoints: ${M(`x(${ts[k]}) = ${xs[k]}\\ \\text{m}`)}, ${M(`x(${ts[k + 1]}) = ${xs[k + 1]}\\ \\text{m}`)}.`,
          M(`v = \\frac{${xs[k + 1]} - (${xs[k]})}{${ts[k + 1]} - ${ts[k]}} = ${fmt(ans)}\\ \\text{m/s}`),
          `${B(`v = ${fmt(ans)} m/s`)}. A straight segment means constant velocity; ${ans < 0 ? 'a downhill slope means motion in the − direction' : 'an uphill slope means motion in the + direction'}.`,
        ];
      } else if (variant === 'avg') {
        ans = avg; mark = [0, T];
        prompt = `${lead} What is its average velocity from ${M('t = 0')} to ${M(`t = ${T}`)} s? Answer in m/s.`;
        steps = [
          `Average velocity only cares about where it started and ended: ${M('v_{avg} = \\Delta x/\\Delta t')} — the slope of the straight line joining the two points.`,
          `${M(`x(0) = ${xs[0]}\\ \\text{m}`)}, ${M(`x(${T}) = ${xs[3]}\\ \\text{m}`)}.`,
          M(`v_{avg} = \\frac{${xs[3]} - (${xs[0]})}{${T}} = ${fmt(ans)}\\ \\text{m/s}`),
          `${B(`v_avg ≈ ${X(ans)} m/s`)}. The wiggles in between don't matter for average velocity (they do for distance).`,
        ];
      } else {
        ans = dist; units = 'm'; note = 'distance = ' + vs.map((v, i) => num(Math.abs(xs[i + 1] - xs[i]))).join(' + ') + ' = ' + num(dist) + ' m';
        prompt = `${lead} What total distance does it travel from ${M('t = 0')} to ${M(`t = ${T}`)} s? Answer in m.`;
        steps = [
          `Distance adds up every change in position, ignoring direction: add ${M('|\\Delta x|')} for each segment.`,
          `Segments: ${vs.map((v, i) => M(`|${xs[i + 1]} - (${xs[i]})| = ${Math.abs(xs[i + 1] - xs[i])}`)).join(', ')}.`,
          M(`d = ${vs.map((v, i) => Math.abs(xs[i + 1] - xs[i])).join(' + ')} = ${dist}\\ \\text{m}`),
          `${B(`distance = ${dist} m`)}. (The displacement is only ${xs[3] - xs[0]} m — distance counts the back-and-forth.)`,
        ];
      }
      return {
        type: 'numeric', prompt, answer: sig(ans, 3), units, steps,
        figure: { key: 'k-graph', params: { kind: 'x', pts } },
        visual: { key: 'k-graph', params: { kind: 'x', pts, mark, note } },
      };
    },
  });

  // Area under a straight v–t segment from (t0,v0) to (t1,v1), signed or absolute.
  function segArea(t0, v0, t1, v1, abs) {
    if (!abs) return 0.5 * (v0 + v1) * (t1 - t0);
    if (v0 * v1 < 0) { const tc = t0 + ((t1 - t0) * v0) / (v0 - v1); return 0.5 * Math.abs(v0) * (tc - t0) + 0.5 * Math.abs(v1) * (t1 - tc); }
    return Math.abs(0.5 * (v0 + v1) * (t1 - t0));
  }
  gens.push({
    id: 'p1u1-vt-graph', unit: 11, topic: 'Velocity–time graphs',
    make(rng) {
      let ts, vs;
      for (let tries = 0; tries < 12; tries++) {
        ts = [0]; vs = [rng.pick([0, 0, 2, 4, -2, 6])];
        for (let k = 0; k < 3; k++) { ts.push(ts[k] + rng.int(2, 4)); vs.push(rng.int(-6, 8)); }
        if (vs.some((v, i) => i && v !== vs[i - 1])) break;
        if (tries === 11) { ts = [0, 2, 5, 8]; vs = [0, 6, 6, -3]; }
      }
      const pts = ts.map((t, i) => [t, vs[i]]);
      const T = ts[3];
      const segs = [0, 1, 2].filter((i) => vs[i + 1] !== vs[i]);
      let variant = rng.pick(['acc', 'disp', 'dist', 'segdisp']);
      const disp = [0, 1, 2].reduce((a, i) => a + segArea(ts[i], vs[i], ts[i + 1], vs[i + 1], false), 0);
      const dist = [0, 1, 2].reduce((a, i) => a + segArea(ts[i], vs[i], ts[i + 1], vs[i + 1], true), 0);
      if (variant === 'disp' && Math.abs(disp) < 1e-9) variant = 'dist';
      const kk = rng.pick([0, 1, 2].filter((i) => segArea(ts[i], vs[i], ts[i + 1], vs[i + 1], false) !== 0));
      if (variant === 'segdisp' && kk === undefined) variant = 'acc';
      if (variant === 'dist' && dist < 1e-9) variant = 'acc';
      const lead = 'The velocity–time graph shows an object moving along a straight line.';
      const areaTerms = [0, 1, 2].map((i) => fmt(segArea(ts[i], vs[i], ts[i + 1], vs[i + 1], false)));
      let prompt, ans, units, steps, params = { kind: 'v', pts };
      if (variant === 'acc') {
        const k = rng.pick(segs);
        ans = (vs[k + 1] - vs[k]) / (ts[k + 1] - ts[k]); units = 'm/s²'; params.mark = [ts[k], ts[k + 1]];
        prompt = `${lead} What is its acceleration between ${M(`t = ${ts[k]}`)} s and ${M(`t = ${ts[k + 1]}`)} s? Answer in m/s².`;
        steps = [
          `On a v–t graph the <b>slope</b> is the acceleration: ${M('a = \\Delta v/\\Delta t')}.`,
          `Read the endpoints: ${M(`v(${ts[k]}) = ${vs[k]}`)} m/s, ${M(`v(${ts[k + 1]}) = ${vs[k + 1]}`)} m/s.`,
          M(`a = \\frac{${vs[k + 1]} - (${vs[k]})}{${ts[k + 1] - ts[k]}} = ${fmt(ans)}\\ \\text{m/s}^2`),
          `${B(`a ≈ ${X(ans)} m/s²`)}. Don't read the height of the graph — that's velocity, not acceleration.`,
        ];
      } else if (variant === 'segdisp') {
        const k = kk;
        ans = segArea(ts[k], vs[k], ts[k + 1], vs[k + 1], false); units = 'm'; params.shade = [ts[k], ts[k + 1]];
        params.note = 'area = ' + num(ans) + ' m';
        prompt = `${lead} What is its displacement between ${M(`t = ${ts[k]}`)} s and ${M(`t = ${ts[k + 1]}`)} s? Answer in m.`;
        steps = [
          `On a v–t graph the <b>area</b> between the line and the time axis is the displacement (area below the axis counts as negative).`,
          `This piece is a trapezoid (or triangle): ${M('\\text{area} = \\tfrac12 (v_1 + v_2)\\,\\Delta t')}.`,
          M(`\\Delta x = \\tfrac12 (${vs[k]} + ${vs[k + 1]})(${ts[k + 1] - ts[k]}) = ${fmt(ans)}\\ \\text{m}`),
          `${B(`Δx = ${fmt(ans)} m`)}.`,
        ];
      } else {
        const abs = variant === 'dist';
        ans = abs ? dist : disp; units = 'm'; params.shade = [0, T];
        params.note = (abs ? 'distance = ' : 'displacement = ') + num(ans) + ' m';
        prompt = `${lead} What ${abs ? 'total distance does it travel' : 'is its displacement'} from ${M('t = 0')} to ${M(`t = ${T}`)} s? Answer in m.`;
        steps = [
          `Displacement = signed area under the v–t graph: area above the axis is +, below the axis is −. Distance adds the areas all as positive.`,
          `Split into pieces (cut where the line crosses v = 0). Signed areas by segment: ${M(areaTerms.join(',\\ '))} m.`,
          abs ? `Make every piece positive and add: ${M(`d = ${fmt(dist)}\\ \\text{m}`)}.` : M(`\\Delta x = ${areaTerms.join(' + ').replace(/\+ -/g, '- ')} = ${fmt(disp)}\\ \\text{m}`),
          `${B(`${abs ? 'distance' : 'Δx'} = ${fmt(ans)} m`)}.${Math.abs(dist - Math.abs(disp)) > 1e-9 ? ` (The ${abs ? 'displacement' : 'distance'} is ${fmt(abs ? disp : dist)} m: part of the motion is backward.)` : ''}`,
        ];
      }
      return {
        type: 'numeric', prompt, answer: sig(ans, 3), units, steps,
        figure: { key: 'k-graph', params: { kind: 'v', pts } },
        visual: { key: 'k-graph', params },
      };
    },
  });

  gens.push({
    id: 'p1u1-graph-concept', unit: 11, topic: 'Reading motion graphs',
    make(rng) {
      const c = rng.int(0, 3);
      const [sv, sa] = [[1, 1], [1, -1], [-1, -1], [-1, 1]][c];
      const kind = rng.pick(['x', 'v']);
      let pts = [];
      if (kind === 'x') {
        const x0 = sv > 0 ? 2 : 30, v0 = sv * (sv === sa ? 1.5 : 6), a = sa * (sv === sa ? 1.5 : 1.2);
        for (let i = 0; i <= 24; i++) { const t = (4 * i) / 24; pts.push([sig(t, 4), sig(x0 + v0 * t + 0.5 * a * t * t, 4)]); }
      } else {
        const v0 = sv * (sv === sa ? 1 : 6), v1 = sv * (sv === sa ? 6 : 1);
        pts = [[0, v0], [4, v1]];
      }
      const steps = kind === 'x' ? [
        `On an x–t graph, the <b>slope</b> is the velocity. The slope here is ${sv > 0 ? 'positive' : 'negative'} the whole time, so the object moves in the ${sv > 0 ? '+' : '−'} direction.`,
        `The <b>steepness</b> is the speed. The curve gets ${sv === sa ? 'steeper' : 'flatter'} as time goes on, so the object is ${sv === sa ? 'speeding up' : 'slowing down'}.`,
        `Curving upward (concave up) means a > 0; curving downward means a < 0. Here it curves ${sa > 0 ? 'up' : 'down'}, so a is ${sa > 0 ? '+' : '−'} — ${sv === sa ? 'the same' : 'opposite to the'} direction of v.`,
        `${B(VA_OPTS[c])}.`,
      ] : [
        `On a v–t graph, the <b>height</b> is the velocity. It stays ${sv > 0 ? 'above' : 'below'} the axis, so the object moves in the ${sv > 0 ? '+' : '−'} direction.`,
        `Speed is the distance from the axis. It goes from ${Math.abs(pts[0][1])} to ${Math.abs(pts[1][1])} m/s, so the object is ${sv === sa ? 'speeding up' : 'slowing down'}.`,
        `The slope (acceleration) is ${sa > 0 ? 'positive' : 'negative'}. A ${sa > 0 ? 'positive' : 'negative'} slope does not by itself mean speeding up — compare with the sign of v.`,
        `${B(VA_OPTS[c])}.`,
      ];
      return {
        type: 'mc',
        prompt: `The ${kind === 'x' ? 'position–time' : 'velocity–time'} graph shows an object moving along a line from ${M('t = 0')} to ${M('t = 4')} s. Which describes its motion during this time?`,
        ...mc(rng, VA_OPTS[c], VA_OPTS.filter((_, i) => i !== c)),
        steps,
        figure: { key: 'k-graph', params: { kind, pts } },
        visual: { key: 'k-va', params: { v: sv, a: sa } },
      };
    },
  });

  gens.push({
    id: 'p1u1-kinematics', unit: 11, topic: 'Kinematic equations',
    make(rng) {
      const variant = rng.pick(['v-t', 'x-t', 'v-x', 't', 'a']);
      let v0, v, a, t, dx, prompt, ans, units, eqTex, eqTxt, plug, unknown;
      const obj = rng.pick(['cart', 'car', 'skateboarder', 'train']);
      if (variant === 'v-t') {
        v0 = rng.int(0, 15); a = rnd(rng, 0.5, 5, 2) * (rng() < 0.3 ? -1 : 1); t = rng.int(2, 8);
        if (Math.abs(v0 + a * t) < 1) a = Math.abs(a);
        v = v0 + a * t; dx = v0 * t + 0.5 * a * t * t; unknown = 'v'; ans = v; units = 'm/s';
        prompt = `A ${obj} moving at ${Q(v0, U.mps)} in the + direction has a constant acceleration of ${Q(a, U.mps2)}. What is its velocity after ${Q(t, U.s)}? Answer in m/s.`;
        eqTex = 'v = v_0 + at'; eqTxt = 'v = v₀ + at';
        plug = `v = ${v0} + (${fmt(a)})(${t}) = ${fmt(v)}\\ \\text{m/s}`;
      } else if (variant === 'x-t') {
        v0 = rng.int(0, 15); a = rnd(rng, 0.5, 5, 2); t = rng.int(2, 8);
        v = v0 + a * t; dx = v0 * t + 0.5 * a * t * t; unknown = 'dx'; ans = dx; units = 'm';
        prompt = `A ${obj} starts ${v0 ? `at ${Q(v0, U.mps)}` : 'from rest'} and speeds up with a constant acceleration of ${Q(a, U.mps2)}. How far does it travel in ${Q(t, U.s)}? Answer in m.`;
        eqTex = '\\Delta x = v_0 t + \\tfrac12 a t^2'; eqTxt = 'Δx = v₀t + ½at²';
        plug = `\\Delta x = (${v0})(${t}) + \\tfrac12(${fmt(a)})(${t})^2 = ${fmt(dx)}\\ \\text{m}`;
      } else if (variant === 'v-x') {
        v0 = rng.int(0, 15); a = rnd(rng, 0.5, 5, 2); dx = rng.int(10, 200);
        v = Math.sqrt(v0 * v0 + 2 * a * dx); t = (v - v0) / a; unknown = 'v'; ans = v; units = 'm/s';
        prompt = `A ${obj} moving at ${Q(v0, U.mps)} speeds up with a constant acceleration of ${Q(a, U.mps2)} over a distance of ${Q(dx, U.m)}. What is its final speed? Answer in m/s.`;
        eqTex = 'v^2 = v_0^2 + 2a\\Delta x'; eqTxt = 'v² = v₀² + 2aΔx';
        plug = `v = \\sqrt{${v0}^2 + 2(${fmt(a)})(${dx})} = ${fmt(v)}\\ \\text{m/s}`;
      } else if (variant === 't') {
        v0 = rng.int(0, 20); v = v0 + rng.int(3, 20); dx = rng.int(20, 300);
        t = (2 * dx) / (v0 + v); a = (v - v0) / t; unknown = 't'; ans = t; units = 's';
        prompt = `A ${obj} speeds up uniformly from ${Q(v0, U.mps)} to ${Q(v, U.mps)} while covering ${Q(dx, U.m)}. How long does this take? Answer in s.`;
        eqTex = '\\Delta x = \\tfrac12 (v_0 + v)\\,t'; eqTxt = 'Δx = ½(v₀ + v)t';
        plug = `t = \\frac{2\\Delta x}{v_0 + v} = \\frac{2(${dx})}{${v0} + ${v}} = ${fmt(t)}\\ \\text{s}`;
      } else {
        v0 = rng.int(10, 35); v = rng() < 0.5 ? 0 : rng.int(2, v0 - 5); dx = rng.int(15, 150);
        a = (v * v - v0 * v0) / (2 * dx); t = (2 * dx) / (v0 + v); unknown = 'a'; ans = a; units = 'm/s²';
        prompt = `A ${obj} slows uniformly from ${Q(v0, U.mps)} to ${v ? Q(v, U.mps) : 'a stop'} over a distance of ${Q(dx, U.m)}. What is its acceleration? Answer in m/s² (negative means it points opposite the motion).`;
        eqTex = 'v^2 = v_0^2 + 2a\\Delta x'; eqTxt = 'v² = v₀² + 2aΔx';
        plug = `a = \\frac{v^2 - v_0^2}{2\\Delta x} = \\frac{${v}^2 - ${v0}^2}{2(${dx})} = ${fmt(a)}\\ \\text{m/s}^2`;
      }
      const names = { v0: 'v_0', v: 'v', a: 'a', t: 't', dx: '\\Delta x' };
      const known = { 'v-t': ['v0', 'a', 't'], 'x-t': ['v0', 'a', 't'], 'v-x': ['v0', 'a', 'dx'], t: ['v0', 'v', 'dx'], a: ['v0', 'v', 'dx'] }[variant];
      const missing = ['v0', 'v', 'a', 't', 'dx'].find((k) => k !== unknown && !known.includes(k));
      return {
        type: 'numeric', prompt, answer: sig(ans, 3), units,
        steps: [
          `Constant acceleration, so the kinematic equations apply. Knowns: ${M(known.map((k) => names[k]).join(',\\ '))}. Unknown: ${M(names[unknown])}. Not given and not asked: ${M(names[missing])}.`,
          `Pick the equation that leaves out ${M(names[missing])}: ${M(eqTex)}.`,
          M(plug),
          `${B(`${unknown === 'dx' ? 'Δx' : unknown} ≈ ${X(ans)} ${units}`)}.${unknown === 'a' ? ' The minus sign says the acceleration points backward (it is slowing).' : ''}`,
        ],
        visual: { key: 'k-dots', params: { v0, v, a, t, dx, unknown, eq: eqTxt } },
      };
    },
  });

  gens.push({
    id: 'p1u1-stopping', unit: 11, topic: 'Stopping distance',
    make(rng) {
      const v = rng.int(12, 30), tr = rng.pick([0.5, 0.6, 0.7, 0.8, 1, 1.2, 1.5]), a = rng.pick([4, 5, 6, 7, 8]);
      const dr = v * tr, db = (v * v) / (2 * a), ans = dr + db;
      return {
        type: 'numeric',
        prompt: `A driver traveling at ${Q(v, U.mps)} sees a hazard. It takes ${Q(tr, U.s)} to react and hit the brakes; the brakes then slow the car at a constant ${Q(a, U.mps2)} until it stops. What is the total distance from seeing the hazard to stopping? Answer in m.`,
        answer: sig(ans, 3), units: 'm',
        steps: [
          `Two stages. During the reaction time the car still moves at constant speed: ${M(`d_r = v t_r = (${v})(${tr}) = ${fmt(dr)}\\ \\text{m}`)}.`,
          `Braking: constant acceleration from ${M(`v_0 = ${v}`)} to ${M('v = 0')}, no time given, so use ${M('v^2 = v_0^2 + 2a\\Delta x')}.`,
          M(`d_b = \\frac{v_0^2}{2a} = \\frac{${v}^2}{2(${a})} = ${fmt(db)}\\ \\text{m}`),
          `${B(`total ≈ ${X(ans)} m`)}. Notice the braking part grows with ${M('v^2')}, the reaction part only with ${M('v')}.`,
        ],
        visual: { key: 'k-dots', params: { v0: v, v: 0, a: -a, t: v / a, dx: db, unknown: 'dx', eq: 'd = v₀t_r + v₀²/(2a)', pre: dr, title: 'Reaction, then braking' } },
      };
    },
  });

  gens.push({
    id: 'p1u1-stopping-scaling', unit: 11, topic: 'Stopping distance (scaling)',
    make(rng) {
      const k = rng.pick([2, 3, 0.5]);
      const kw = { 2: 'twice', 3: 'three times', 0.5: 'half' }[k];
      const ask = rng.pick(['distance', 'distance', 'time']);
      const base = ask === 'distance' ? rng.int(10, 60) : rng.int(2, 8);
      const u = ask === 'distance' ? '\\ \\text{m}' : '\\ \\text{s}';
      const opt = (x) => M(fmt(x, 3) + u);
      const correct = ask === 'distance' ? opt(base * k * k) : opt(base * k);
      const wrongs = ask === 'distance' ? [opt(base * k), opt(base * k * k * k), opt(base), opt(base * Math.sqrt(k))] : [opt(base * k * k), opt(base), opt(base * Math.sqrt(k)), opt(base / k)];
      return {
        type: 'mc',
        prompt: `With constant braking, a car moving at speed ${M('v')} stops in a ${ask} of ${opt(base)}. If the same car brakes the same way from ${kw} that speed, what is the stopping ${ask}?`,
        ...mc(rng, correct, wrongs),
        steps: [
          `Same braking means the same acceleration ${M('a')}. Final speed is 0 both times.`,
          ask === 'distance' ? `${M('0 = v_0^2 - 2a\\Delta x')} gives ${M('\\Delta x = v_0^2/(2a)')}, so ${M('\\Delta x \\propto v_0^2')}.` : `${M('0 = v_0 - at')} gives ${M('t = v_0/a')}, so ${M('t \\propto v_0')}.`,
          ask === 'distance' ? `Speed × ${k} → distance × ${M(`${k}^2 = ${k * k}`)}.` : `Speed × ${k} → time × ${k}.`,
          `${B(`${ask} = ${fmt(ask === 'distance' ? base * k * k : base * k)} ${ask === 'distance' ? 'm' : 's'}`)}.${ask === 'distance' ? ' The usual slip is scaling linearly.' : ''}`,
        ],
        visual: concept('Stopping with the same braking', [
          'Stopping distance: v² = 2aΔx, so Δx = v²/(2a) ∝ v².',
          'Stopping time: v = at, so t = v/a ∝ v.',
          `Speed × ${k} → distance × ${k * k}, time × ${k}.`,
          'Average speed while braking is v/2, and the time is v/a: distance = (v/2)(v/a).',
        ]),
      };
    },
  });

  gens.push({
    id: 'p1u1-free-fall', unit: 11, topic: 'Free fall',
    make(rng) {
      const variant = rng.pick(['drop-t', 'drop-v', 'up-h', 'up-t', 'cliff']);
      let prompt, ans, units, steps, h0 = 0, v0 = 0;
      if (variant === 'drop-t' || variant === 'drop-v') {
        h0 = rng.int(5, 80);
        const t = Math.sqrt((2 * h0) / g), v = Math.sqrt(2 * g * h0);
        const thing = rng.pick(['A rock is dropped from a bridge', 'A phone slips off a balcony', 'A ball is released from rest at the top of a tower']);
        if (variant === 'drop-t') {
          ans = t; units = 's';
          prompt = `${thing} ${Q(h0, U.m)} above the ground. Ignoring air resistance, how long does it take to hit the ground? Answer in s.`;
          steps = [`Dropped means ${M('v_0 = 0')}; the acceleration is ${M('g = 9.8\\ \\text{m/s}^2')} downward the whole way.`,
            `Use ${M('\\Delta y = v_0 t + \\tfrac12 g t^2')} with ${M('v_0 = 0')} (taking down as +): ${M('h = \\tfrac12 g t^2')}.`,
            M(`t = \\sqrt{\\frac{2h}{g}} = \\sqrt{\\frac{2(${h0})}{9.8}} = ${fmt(t)}\\ \\text{s}`),
            `${B(`t ≈ ${X(t)} s`)}. Mass doesn't appear anywhere: everything falls with the same g.`];
        } else {
          ans = v; units = 'm/s';
          prompt = `${thing} ${Q(h0, U.m)} above the ground. Ignoring air resistance, how fast is it moving just before it hits the ground? Answer in m/s.`;
          steps = [`Dropped means ${M('v_0 = 0')}; it accelerates at ${M('g')} downward.`,
            `No time given, so use ${M('v^2 = v_0^2 + 2g\\Delta y')}.`,
            M(`v = \\sqrt{2gh} = \\sqrt{2(9.8)(${h0})} = ${fmt(v)}\\ \\text{m/s}`),
            `${B(`v ≈ ${X(v)} m/s`)}, downward.`];
        }
      } else if (variant === 'up-h' || variant === 'up-t') {
        v0 = rng.int(5, 25);
        const H = (v0 * v0) / (2 * g), T = (2 * v0) / g;
        if (variant === 'up-h') {
          ans = H; units = 'm';
          prompt = `A ball is tossed straight up at ${Q(v0, U.mps)}. Ignoring air resistance, how high above the launch point does it rise? Answer in m.`;
          steps = [`At the top the ball momentarily stops: ${M('v = 0')}. The acceleration is ${M('-g')} (up is +) the whole time, even at the top.`,
            `Use ${M('v^2 = v_0^2 - 2g\\Delta y')} with ${M('v = 0')}.`,
            M(`\\Delta y = \\frac{v_0^2}{2g} = \\frac{${v0}^2}{2(9.8)} = ${fmt(H)}\\ \\text{m}`),
            `${B(`H ≈ ${X(H)} m`)}.`];
        } else {
          ans = T; units = 's';
          prompt = `A ball is tossed straight up at ${Q(v0, U.mps)} and caught at the same height. Ignoring air resistance, how long is it in the air? Answer in s.`;
          steps = [`Time to the top: velocity drops by 9.8 m/s every second, so ${M(`t_{up} = v_0/g = ${v0}/9.8 = ${fmt(v0 / g)}\\ \\text{s}`)}.`,
            `The motion is symmetric: coming down to the same height takes the same time, and it arrives at ${M(`${v0}\\ \\text{m/s}`)} downward.`,
            M(`T = \\frac{2v_0}{g} = \\frac{2(${v0})}{9.8} = ${fmt(T)}\\ \\text{s}`),
            `${B(`T ≈ ${X(T)} s`)}. (Or solve ${M('0 = v_0 t - \\tfrac12 g t^2')}.)`];
        }
      } else {
        v0 = rng.int(4, 15); h0 = rng.int(10, 60);
        const T = (v0 + Math.sqrt(v0 * v0 + 2 * g * h0)) / g;
        ans = T; units = 's';
        prompt = `A stone is thrown straight up at ${Q(v0, U.mps)} from the edge of a cliff ${Q(h0, U.m)} above the water. It goes up, comes back past the cliff edge, and falls into the water. Ignoring air resistance, how long after the throw does it hit the water? Answer in s.`;
        steps = [`Take up as + and the launch point as ${M('y = 0')}. The water is at ${M(`\\Delta y = -${h0}\\ \\text{m}`)}, and ${M('a = -9.8\\ \\text{m/s}^2')} for the whole flight.`,
          `${M('\\Delta y = v_0 t - \\tfrac12 g t^2')} gives ${M(`-${h0} = ${v0}t - 4.9t^2`)}, a quadratic: ${M(`4.9t^2 - ${v0}t - ${h0} = 0`)}.`,
          M(`t = \\frac{${v0} + \\sqrt{${v0}^2 + 4(4.9)(${h0})}}{2(4.9)} = ${fmt(T)}\\ \\text{s}`),
          `${B(`t ≈ ${X(T)} s`)}. Keep the positive root; the negative one is "before the throw".`];
      }
      return { type: 'numeric', prompt, given: gGiven, answer: sig(ans, 3), units, steps, visual: { key: 'k-freefall', params: { h0, v0 } } };
    },
  });

  gens.push({
    id: 'p1u1-free-fall-concept', unit: 11, topic: 'Free fall (concept)',
    make(rng) {
      const variant = rng.pick(['top', 'return', 'mass', 'rising']);
      const v0 = rng.int(8, 20);
      let prompt, correct, wrongs, steps, visual = { key: 'k-freefall', params: { h0: 0, v0 } };
      if (variant === 'top') {
        prompt = 'A ball is thrown straight up. Ignoring air resistance, at the very top of its flight, what are its velocity and acceleration?';
        correct = 'v = 0; a = 9.8 m/s² downward';
        wrongs = ['v = 0; a = 0', 'v = 0; a = 9.8 m/s² upward', 'v = 9.8 m/s upward; a = 0'];
        steps = ['The ball stops rising and starts falling, so for an instant its velocity is zero.',
          'Gravity never switches off. The acceleration is g downward on the way up, at the top, and on the way down.',
          'If a were zero at the top, the velocity would stay zero and the ball would hang in the air.',
          `${B(correct)}.`];
      } else if (variant === 'return') {
        prompt = `A ball is thrown straight up at ${Q(v0, U.mps)}. Ignoring air resistance, how fast is it moving when it comes back down to the launch height?`;
        correct = `${v0} m/s, downward`;
        wrongs = ['0 m/s', `More than ${v0} m/s, downward`, `Less than ${v0} m/s, downward`];
        steps = [`On the way up, velocity drops by 9.8 m/s every second until it is 0 at the top.`,
          `On the way down it gains 9.8 m/s every second for the same amount of time.`,
          `Free-fall motion is symmetric: same height ↔ same speed, opposite direction.`,
          `${B(correct)}.`];
      } else if (variant === 'mass') {
        const m1 = rng.int(2, 10);
        prompt = `A ${m1} kg steel ball and a 0.5 kg steel ball of the same size are dropped together from the same height. Ignoring air resistance, which hits the ground first?`;
        correct = 'They hit at the same time';
        wrongs = [`The ${m1} kg ball`, 'The 0.5 kg ball', 'It depends on the height they are dropped from'];
        steps = ['The heavier ball does feel a bigger gravitational force — but it also has more mass to accelerate.',
          `${M('a = F/m = mg/m = g')}: the mass cancels, so every object in free fall has the same acceleration.`,
          'Same starting height, same starting speed (0), same acceleration → same time.',
          `${B(correct)}.`];
        visual = { key: 'k-freefall', params: { h0: rng.int(10, 40), v0: 0, title: 'Free fall: same g for every mass' } };
      } else {
        prompt = 'A ball is thrown straight up. Ignoring air resistance, while it is still rising, its acceleration is…';
        correct = 'Downward and constant';
        wrongs = ['Upward and decreasing', 'Upward and constant', 'Downward and increasing'];
        steps = ['While rising, the ball is slowing down, so its acceleration points opposite its (upward) velocity: downward.',
          'Only gravity acts (no air resistance), and gravity near Earth is constant, so a = g = 9.8 m/s² the whole time.',
          'The velocity is upward and decreasing; don\'t confuse the velocity with the acceleration.',
          `${B(correct)}.`];
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });

  gens.push({
    id: 'p1u1-relative-1d', unit: 11, topic: 'Relative velocity',
    make(rng) {
      const variant = rng.pick(['train', 'approach', 'walkway']);
      if (variant === 'train') {
        const V = rng.int(10, 30), u = rnd(rng, 1, 2.5, 2), fwd = rng() < 0.5;
        const ans = V + (fwd ? u : -u);
        return {
          type: 'numeric',
          prompt: `A train moves east at ${Q(V, U.mps)}. A passenger walks toward the ${fwd ? 'front' : 'back'} of the train (the ${fwd ? 'east' : 'west'} end) at ${Q(u, U.mps)} relative to the train. What is the passenger's speed relative to the ground? Answer in m/s.`,
          answer: sig(ans, 3), units: 'm/s',
          steps: [
            `Velocities add: ${M('\\vec v_{P,G} = \\vec v_{P,T} + \\vec v_{T,G}')} (passenger relative to ground = passenger relative to train + train relative to ground).`,
            `East is +. Train: ${M(`+${V}`)} m/s. Passenger relative to train: ${M(`${fwd ? '+' : '-'}${fmt(u)}`)} m/s.`,
            M(`v_{P,G} = ${V} ${fwd ? '+' : '-'} ${fmt(u)} = ${fmt(ans)}\\ \\text{m/s}`),
            `${B(`${fmt(ans)} m/s`)} east. To someone on the platform, even a passenger walking "backward" still moves east.`,
          ],
          visual: { key: 'k-relative', params: { vF: V, vO: fwd ? u : -u, F: 'train', O: 'passenger' } },
        };
      }
      if (variant === 'approach') {
        const v1 = rng.int(10, 30), v2 = rng.int(10, 30), d = rng.int(2, 20) * 100;
        const t = d / (v1 + v2);
        return {
          type: 'numeric',
          prompt: `Two cars are ${Q(d, U.m)} apart on a straight road and drive toward each other, one at ${Q(v1, U.mps)} and the other at ${Q(v2, U.mps)}. How long until they meet? Answer in s.`,
          answer: sig(t, 3), units: 's',
          steps: [
            `Work in the frame of one car. In that frame it is at rest and the other car approaches at the <b>relative speed</b>.`,
            `They move toward each other, so the speeds add: ${M(`v_{rel} = ${v1} + ${v2} = ${v1 + v2}\\ \\text{m/s}`)}.`,
            M(`t = \\frac{d}{v_{rel}} = \\frac{${d}}{${v1 + v2}} = ${fmt(t)}\\ \\text{s}`),
            `${B(`t ≈ ${X(t)} s`)}.`,
          ],
          visual: { key: 'k-relative', params: { mode: 'approach', vA: v1, vB: v2, d } },
        };
      }
      const w = rnd(rng, 0.5, 1.5, 2), L = rng.int(30, 120), withIt = rng() < 0.6;
      const u = withIt ? rnd(rng, 1, 2, 2) : sig(w + rnd(rng, 0.5, 1.2, 2), 3);
      const vg = withIt ? u + w : u - w, t = L / vg;
      return {
        type: 'numeric',
        prompt: `An airport moving walkway is ${Q(L, U.m)} long and moves at ${Q(w, U.mps)}. A traveler walks ${withIt ? 'along it in the direction it moves' : 'against its motion (the "wrong way")'} at ${Q(u, U.mps)} relative to the walkway. How long does it take the traveler to get from one end to the other? Answer in s.`,
        answer: sig(t, 3), units: 's',
        steps: [
          `Speed relative to the ground = speed relative to the walkway + walkway's speed (with signs).`,
          `${withIt ? 'Same direction' : 'Opposite directions'}: ${M(`v = ${fmt(u)} ${withIt ? '+' : '-'} ${fmt(w)} = ${fmt(vg)}\\ \\text{m/s}`)} relative to the ground.`,
          M(`t = \\frac{L}{v} = \\frac{${L}}{${fmt(vg)}} = ${fmt(t)}\\ \\text{s}`),
          `${B(`t ≈ ${X(t)} s`)}.`,
        ],
        visual: { key: 'k-relative', params: { vF: w, vO: withIt ? u : -u, F: 'walkway', O: 'traveler' } },
      };
    },
  });

  gens.push({
    id: 'p1u1-river', unit: 11, topic: 'River crossing',
    make(rng) {
      const vb = rng.int(3, 8), vw = rng.int(1, vb - 1), W = rng.int(4, 20) * 10;
      const variant = rng.pick(['time', 'drift', 'speed', 'straight']);
      const lead = `A river ${Q(W, U.m)} wide flows at ${Q(vw, U.mps)}. A boat can move at ${Q(vb, U.mps)} relative to the water.`;
      let prompt, ans, units, steps;
      if (variant === 'straight') {
        const vy = Math.sqrt(vb * vb - vw * vw);
        ans = W / vy; units = 's';
        prompt = `${lead} The pilot aims the boat partly upstream so that it travels straight across, landing directly opposite its starting point. How long does the crossing take? Answer in s.`;
        steps = [
          `To go straight across, the upstream part of the boat's velocity must cancel the current: ${M(`v_b\\sin\\theta = v_w`)}.`,
          `The boat's velocity relative to the water is the hypotenuse (${vb} m/s); the current is one leg, so the speed straight across is the other leg: ${M(`\\sqrt{${vb}^2 - ${vw}^2} = ${fmt(vy)}\\ \\text{m/s}`)}.`,
          M(`t = \\frac{${W}}{${fmt(vy)}} = ${fmt(ans)}\\ \\text{s}`),
          `${B(`t ≈ ${X(ans)} s`)} — longer than aiming straight across (${fmt(W / vb)} s), because part of the effort fights the current.`,
        ];
      } else {
        const t = W / vb, drift = vw * t, vg = Math.hypot(vb, vw);
        ans = variant === 'time' ? t : variant === 'drift' ? drift : vg;
        units = variant === 'speed' ? 'm/s' : variant === 'time' ? 's' : 'm';
        prompt = `${lead} The pilot points the boat straight across (perpendicular to the banks). ${variant === 'time' ? 'How long does it take to reach the other side? Answer in s.' : variant === 'drift' ? 'How far downstream from the point directly opposite does it land? Answer in m.' : 'What is the boat\'s speed relative to the shore? Answer in m/s.'}`;
        steps = [
          `The boat's velocity relative to the shore is ${M('\\vec v_{boat,water} + \\vec v_{water,shore}')}: ${vb} m/s across plus ${vw} m/s downstream, at right angles.`,
          `Only the across part gets the boat across: ${M(`t = W/v_b = ${W}/${vb} = ${fmt(t)}\\ \\text{s}`)}. The current doesn't change that time.`,
          variant === 'speed' ? M(`v = \\sqrt{${vb}^2 + ${vw}^2} = ${fmt(vg)}\\ \\text{m/s}`) : `Meanwhile the current carries it downstream: ${M(`d = v_w t = (${vw})(${fmt(t)}) = ${fmt(drift)}\\ \\text{m}`)}.`,
          `${B(`${variant === 'time' ? 't' : variant === 'drift' ? 'drift' : 'speed'} ≈ ${X(ans)} ${units}`)}.`,
        ];
      }
      return { type: 'numeric', prompt, answer: sig(ans, 3), units, steps, visual: { key: 'k-relative', params: { mode: 'river', vb, vw, W, straight: variant === 'straight' } } };
    },
  });

  gens.push({
    id: 'p1u1-components', unit: 11, topic: 'Vector components',
    make(rng) {
      const variant = rng.pick(['comp', 'comp', 'mag', 'angle']);
      if (variant === 'comp') {
        const A = rng.int(10, 60), th = rng.int(15, 75), which = rng.pick(['x', 'y']);
        const ctx = rng.pick(['disp', 'vel']);
        const ax = A * Math.cos(th * DEG), ay = A * Math.sin(th * DEG), ans = which === 'x' ? ax : ay;
        const u = ctx === 'disp' ? 'm' : 'm/s';
        const what = ctx === 'disp' ? `A hiker's displacement is ${Q(A, U.m)} at ${M(`${th}^\\circ`)} north of east.` : `A ball is launched at ${Q(A, U.mps)} at ${M(`${th}^\\circ`)} above the horizontal.`;
        const comp = ctx === 'disp' ? (which === 'x' ? 'east' : 'north') : (which === 'x' ? 'horizontal' : 'vertical');
        return {
          type: 'numeric',
          prompt: `${what} What is the ${comp} component? Answer in ${u}.`,
          answer: sig(ans, 3), units: u,
          steps: [
            `The vector is the hypotenuse of a right triangle; its components are the two legs.`,
            `With θ measured from the ${ctx === 'disp' ? 'east (x) axis' : 'horizontal'}: the side next to θ uses cosine, the side across from θ uses sine.`,
            M(`A_${which} = ${A}\\${which === 'x' ? 'cos' : 'sin'}(${th}^\\circ) = ${fmt(ans)}\\ \\text{${u}}`),
            `${B(`${comp} component ≈ ${X(ans)} ${u}`)}.`,
          ],
          visual: { key: 'k-vectors', params: { vecs: [{ x: ax, y: ay, label: 'A' }], comps: true, unit: u, xName: ctx === 'disp' ? 'east' : 'horizontal', yName: ctx === 'disp' ? 'north' : 'vertical' } },
        };
      }
      const ax = rng.int(3, 40), ay = rng.int(3, 40);
      const mag = Math.hypot(ax, ay), ang = Math.atan2(ay, ax) / DEG;
      const ans = variant === 'mag' ? mag : ang;
      return {
        type: 'numeric',
        prompt: `A velocity has components ${M(`v_x = ${ax}`)} m/s and ${M(`v_y = ${ay}`)} m/s. What is ${variant === 'mag' ? 'its magnitude? Answer in m/s.' : 'the angle it makes above the +x axis? Answer in degrees.'}`,
        answer: sig(ans, 3), units: variant === 'mag' ? 'm/s' : '°',
        steps: [
          `The components are the legs of a right triangle and the vector is the hypotenuse.`,
          variant === 'mag' ? `Pythagorean theorem: ${M('v = \\sqrt{v_x^2 + v_y^2}')}.` : `The angle from the x-axis: ${M('\\tan\\theta = v_y/v_x')}.`,
          variant === 'mag' ? M(`v = \\sqrt{${ax}^2 + ${ay}^2} = ${fmt(mag)}\\ \\text{m/s}`) : M(`\\theta = \\tan^{-1}\\!\\left(\\frac{${ay}}{${ax}}\\right) = ${fmt(ang)}^\\circ`),
          `${B(variant === 'mag' ? `v ≈ ${X(mag)} m/s` : `θ ≈ ${X(ang)}°`)}.`,
        ],
        visual: { key: 'k-vectors', params: { vecs: [{ x: ax, y: ay, label: 'v' }], comps: true, unit: 'm/s' } },
      };
    },
  });

  gens.push({
    id: 'p1u1-vector-add', unit: 11, topic: 'Adding vectors',
    make(rng) {
      const d1 = rng.int(3, 20), d2 = rng.int(3, 20), th = rng.pick([90, 90, 30, 45, 60]);
      const ask = rng.pick(['mag', 'mag', 'angle']);
      const bx = d2 * Math.cos(th * DEG), by = d2 * Math.sin(th * DEG);
      const Rx = d1 + bx, Ry = by, R = Math.hypot(Rx, Ry), ang = Math.atan2(Ry, Rx) / DEG;
      const leg2 = th === 90 ? `${Q(d2, U.km)} north` : `${Q(d2, U.km)} at ${M(`${th}^\\circ`)} north of east`;
      const ans = ask === 'mag' ? R : ang;
      return {
        type: 'numeric',
        prompt: `A drone flies ${Q(d1, U.km)} east, then ${leg2}. ${ask === 'mag' ? 'How far is it from its starting point? Answer in km.' : 'At what angle north of east is it from its starting point? Answer in degrees.'}`,
        answer: sig(ans, 3), units: ask === 'mag' ? 'km' : '°',
        steps: [
          `Add displacements as vectors (tip to tail), not as plain numbers. Break each into east (x) and north (y) components.`,
          th === 90 ? `Leg 1: (${d1}, 0). Leg 2: (0, ${d2}).` : `Leg 1: (${d1}, 0). Leg 2: ${M(`(${d2}\\cos${th}^\\circ,\\ ${d2}\\sin${th}^\\circ) = (${fmt(bx)},\\ ${fmt(by)})`)}.`,
          `Sum: ${M(`R_x = ${fmt(Rx)},\\ R_y = ${fmt(Ry)}`)}. ${ask === 'mag' ? M(`R = \\sqrt{R_x^2 + R_y^2} = ${fmt(R)}\\ \\text{km}`) : M(`\\theta = \\tan^{-1}(R_y/R_x) = ${fmt(ang)}^\\circ`)}`,
          `${B(ask === 'mag' ? `R ≈ ${X(R)} km` : `θ ≈ ${X(ang)}° north of east`)}.${ask === 'mag' ? ` Simply adding ${d1} + ${d2} = ${d1 + d2} km would only be right if both legs pointed the same way.` : ''}`,
        ],
        visual: { key: 'k-vectors', params: { vecs: [{ x: d1, y: 0, label: 'A' }, { x: bx, y: by, label: 'B' }], sum: true, comps: true, unit: 'km', xName: 'east', yName: 'north' } },
      };
    },
  });

  gens.push({
    id: 'p1u1-horizontal-launch', unit: 11, topic: 'Horizontal launch',
    make(rng) {
      const table = rng() < 0.4;
      const h0 = table ? rnd(rng, 0.7, 1.5, 2) : rng.int(10, 60);
      const v = table ? rnd(rng, 1, 4, 2) : rng.int(5, 25);
      const lead = table ? `A marble rolls off a table ${Q(h0, U.m)} high at ${Q(v, U.mps)}.` : `A ball is thrown horizontally at ${Q(v, U.mps)} from the top of a cliff ${Q(h0, U.m)} high.`;
      const t = Math.sqrt((2 * h0) / g), R = v * t, vy = g * t, vf = Math.hypot(v, vy);
      const variant = rng.pick(['time', 'range', 'range', 'speed', 'mc']);
      const visual = { key: 'k-projectile', params: { v0: v, ang: 0, h0 } };
      if (variant === 'mc') {
        const prop = rng.pick(['time', 'distance']);
        const correct = prop === 'time' ? 'It stays the same' : 'It doubles';
        return {
          type: 'mc',
          prompt: `${lead} If it left the edge at twice the speed instead (same height), what would happen to the ${prop === 'time' ? 'time it takes to reach the ground' : 'horizontal distance it travels before landing'}? Ignore air resistance.`,
          ...mc(rng, correct, ['It stays the same', 'It doubles', 'It is cut in half', 'It increases by a factor of 4', 'It increases by a factor of √2']),
          steps: [
            `Horizontal and vertical motions are independent. Vertically, it starts with ${M('v_y = 0')} and falls ${M('h')} with acceleration ${M('g')} no matter how fast it moves sideways.`,
            `So the fall time ${M('t = \\sqrt{2h/g}')} doesn't depend on the launch speed.`,
            `Horizontal distance ${M('x = v_x t')}: same time, double ${M('v_x')} → double ${M('x')}.`,
            `${B(correct)}.`,
          ],
          visual,
        };
      }
      const ans = variant === 'time' ? t : variant === 'range' ? R : vf;
      const units = variant === 'time' ? 's' : variant === 'range' ? 'm' : 'm/s';
      return {
        type: 'numeric',
        prompt: `${lead} Ignoring air resistance, ${variant === 'time' ? 'how long is it in the air? Answer in s.' : variant === 'range' ? 'how far from the base does it land? Answer in m.' : 'how fast is it moving just before it lands? Answer in m/s.'}`,
        given: gGiven, answer: sig(ans, 3), units,
        steps: [
          `Split the motion. Horizontal: no acceleration, ${M(`v_x = ${fmt(v)}`)} m/s the whole time. Vertical: starts at ${M('v_y = 0')}, accelerates at ${M('g')} downward — exactly like a dropped object.`,
          `Fall time from the vertical motion: ${M(`t = \\sqrt{2h/g} = \\sqrt{2(${fmt(h0)})/9.8} = ${fmt(t)}\\ \\text{s}`)}.`,
          variant === 'time' ? `The horizontal speed has no effect on this time.`
            : variant === 'range' ? M(`x = v_x t = (${fmt(v)})(${fmt(t)}) = ${fmt(R)}\\ \\text{m}`)
              : `${M(`v_y = gt = ${fmt(vy)}\\ \\text{m/s}`)}, so ${M(`v = \\sqrt{v_x^2 + v_y^2} = \\sqrt{${fmt(v)}^2 + ${fmt(vy)}^2} = ${fmt(vf)}\\ \\text{m/s}`)}.`,
          `${B(`${variant === 'time' ? 't' : variant === 'range' ? 'x' : 'v'} ≈ ${X(ans)} ${units}`)}.`,
        ],
        visual,
      };
    },
  });

  gens.push({
    id: 'p1u1-projectile', unit: 11, topic: 'Projectile motion',
    make(rng) {
      const v0 = rng.int(10, 30), th = rng.pick([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]);
      const vx = v0 * Math.cos(th * DEG), vy = v0 * Math.sin(th * DEG);
      const T = (2 * vy) / g, H = (vy * vy) / (2 * g), R = vx * T;
      const variant = rng.pick(['T', 'H', 'R', 'R']);
      const ans = { T, H, R }[variant], units = variant === 'T' ? 's' : 'm';
      const thing = rng.pick(['A soccer ball is kicked', 'A golf ball is hit', 'A water balloon is launched']);
      return {
        type: 'numeric',
        prompt: `${thing} from level ground at ${Q(v0, U.mps)} at ${M(`${th}^\\circ`)} above the horizontal. Ignoring air resistance, ${variant === 'T' ? 'how long is it in the air? Answer in s.' : variant === 'H' ? 'what maximum height does it reach? Answer in m.' : 'how far away does it land? Answer in m.'}`,
        given: gGiven, answer: sig(ans, 3), units,
        steps: [
          `Components: ${M(`v_x = ${v0}\\cos${th}^\\circ = ${fmt(vx)}`)} m/s (constant), ${M(`v_{y0} = ${v0}\\sin${th}^\\circ = ${fmt(vy)}`)} m/s (changes at ${M('-g')}).`,
          variant === 'H' ? `At the top ${M('v_y = 0')}: ${M(`H = \\frac{v_{y0}^2}{2g} = \\frac{${fmt(vy)}^2}{2(9.8)}`)}.` : `Time in the air from the vertical motion (up and back to the same height): ${M(`T = \\frac{2v_{y0}}{g} = \\frac{2(${fmt(vy)})}{9.8} = ${fmt(T)}\\ \\text{s}`)}.`,
          variant === 'R' ? M(`R = v_x T = (${fmt(vx)})(${fmt(T)}) = ${fmt(R)}\\ \\text{m}`) : variant === 'H' ? M(`H = ${fmt(H)}\\ \\text{m}`) : `The horizontal motion doesn't affect the time — only ${M('v_{y0}')} and ${M('g')} do.`,
          `${B(`${variant} ≈ ${X(ans)} ${units}`)}.`,
        ],
        visual: { key: 'k-projectile', params: { v0, ang: th, h0: 0 } },
      };
    },
  });

  gens.push({
    id: 'p1u1-projectile-concept', unit: 11, topic: 'Projectile motion (concept)',
    make(rng) {
      const variant = rng.pick(['top', 'drop-vs-fire', 'complementary', 'vx']);
      const th = rng.pick([30, 35, 40, 50, 55, 60]);
      let prompt, correct, wrongs, steps, visual = { key: 'k-projectile', params: { v0: 20, ang: th, h0: 0 } };
      if (variant === 'top') {
        prompt = `A ball is launched at ${M(`${th}^\\circ`)} above the horizontal over level ground. Ignoring air resistance, at the highest point of its path…`;
        correct = 'Its velocity is horizontal and its acceleration is g downward';
        wrongs = ['Its velocity is zero and its acceleration is g downward', 'Its velocity is horizontal and its acceleration is zero', 'Its velocity and acceleration are both zero'];
        steps = ['At the top only the vertical velocity is zero. The horizontal velocity never changes, so the ball is still moving sideways at ' + M('v_0\\cos\\theta') + '.',
          'The only force is gravity, so the acceleration is g downward everywhere along the path — including the top.',
          'Zero velocity at the top is only true for a ball thrown straight up.',
          `${B(correct)}.`];
      } else if (variant === 'drop-vs-fire') {
        prompt = 'At the same instant, ball A is dropped from rest and ball B is fired horizontally from the same height. Ignoring air resistance, which reaches the level ground first?';
        correct = 'They land at the same time';
        wrongs = ['Ball A, because it travels a shorter path', 'Ball B, because it is moving faster', 'It depends on how fast ball B is fired'];
        steps = ['Both start with zero vertical velocity at the same height.',
          'Both accelerate downward at g. Horizontal motion doesn\'t change vertical motion — the two are independent.',
          'Same vertical start, same vertical acceleration → same fall time. B just lands farther away.',
          `${B(correct)}.`];
        visual = { key: 'k-projectile', params: { v0: 12, ang: 0, h0: 20, title: 'Horizontal motion doesn\'t change the fall time' } };
      } else if (variant === 'complementary') {
        prompt = `Two balls are launched from level ground at the same speed, one at ${M(`${th}^\\circ`)} and one at ${M(`${90 - th}^\\circ`)} above the horizontal. Ignoring air resistance, how do they compare?`;
        correct = `Same range; the ${Math.max(th, 90 - th)}° ball stays in the air longer`;
        wrongs = [`Same range and same time in the air`, `The ${Math.max(th, 90 - th)}° ball goes farther`, `The ${Math.min(th, 90 - th)}° ball goes farther and stays in the air longer`];
        steps = [`Range on level ground: ${M('R = \\frac{v_0^2 \\sin 2\\theta}{g}')}. Since ${M(`\\sin(2\\cdot${th}^\\circ) = \\sin(2\\cdot${90 - th}^\\circ)`)}, the ranges match.`,
          `Time in the air ${M('T = 2v_0\\sin\\theta / g')} depends on the vertical component, which is larger for the steeper launch.`,
          'The steeper ball goes higher and slower sideways; the flatter one stays low and moves faster sideways. Same landing spot.',
          `${B(correct)}.`];
      } else {
        prompt = `A ball is launched at ${M(`${th}^\\circ`)} above the horizontal. Ignoring air resistance, what happens to the horizontal component of its velocity during the flight?`;
        correct = 'It stays constant';
        wrongs = ['It decreases until the top, then increases', 'It decreases steadily the whole time', 'It is zero at the top of the path'];
        steps = ['The only force is gravity, which is vertical. There is no horizontal force.',
          'No horizontal force → no horizontal acceleration → constant horizontal velocity (Newton\'s first law in the x-direction).',
          'It is the <b>vertical</b> component that shrinks to zero at the top and then grows downward.',
          `${B(correct)}.`];
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });

  gens.push({
    id: 'p1u1-scalars-vectors', unit: 11, topic: 'Scalars and vectors',
    make(rng) {
      const VEC = ['Displacement', 'Velocity', 'Acceleration'];
      const SCA = ['Distance', 'Speed', 'Time', 'Mass'];
      const askVec = rng() < 0.6;
      const correct = askVec ? rng.pick(VEC) : rng.pick(SCA);
      const wrongs = askVec ? rng.shuffle(SCA) : rng.shuffle(VEC);
      return {
        type: 'mc',
        prompt: `Which of these quantities is a ${askVec ? 'vector' : 'scalar'}?`,
        ...mc(rng, correct, wrongs),
        steps: [
          'A <b>vector</b> has a size and a direction (in 1D, a sign). A <b>scalar</b> is just a size.',
          'Vectors here: displacement, velocity, acceleration. Scalars: distance, speed, time, mass.',
          'Paired up: distance ↔ displacement, speed ↔ velocity. The scalar is the "how much"; the vector also says "which way".',
          `${B(correct)} is a ${askVec ? 'vector' : 'scalar'}.`,
        ],
        visual: concept('Scalar or vector?', [
          'Scalar: size only — distance, speed, time, mass.',
          'Vector: size and direction — displacement, velocity, acceleration.',
          'In 1D, the direction is the sign: −3 m/s means 3 m/s in the − direction.',
          'Distance ≥ |displacement|; speed ≥ |velocity| (averages).',
        ]),
      };
    },
  });

  gens.push({
    id: 'p1u1-relative-concept', unit: 11, topic: 'Relative motion (concept)',
    make(rng) {
      const variant = rng.pick(['drop', 'rain', 'cars']);
      let prompt, correct, wrongs, steps, visual;
      if (variant === 'drop') {
        prompt = 'A passenger on a train moving at constant velocity drops a ball straight down. Ignoring air resistance, where does the ball land relative to the passenger?';
        correct = 'Directly below the release point, at the passenger\'s feet';
        wrongs = ['Behind the release point, toward the back of the train', 'In front of the release point', 'It depends on how fast the train is moving'];
        steps = ['Before release, the ball already moves forward with the train at the train\'s speed.',
          'After release no horizontal force acts, so it keeps that forward speed — the same as the passenger and the train.',
          'In the train\'s frame it just falls straight down. (Someone on the ground sees a parabola.)',
          `${B(correct)}.`];
        visual = concept('Same motion, two frames', ['Train frame: the ball falls straight down.', 'Ground frame: the ball moves forward with the train while falling — a parabola.', 'Both agree on where it lands relative to the passenger.', 'Physics works the same in every frame moving at constant velocity.']);
      } else if (variant === 'rain') {
        prompt = 'Rain falls straight down on a windless day. To the driver of a car moving forward, the raindrops appear to…';
        correct = 'Slant toward the car, coming from in front';
        wrongs = ['Fall straight down', 'Slant toward the car, coming from behind', 'Move straight up'];
        steps = [`Rain relative to car = rain relative to ground − car relative to ground: ${M('\\vec v_{R,C} = \\vec v_{R,G} - \\vec v_{C,G}')}.`,
          'Subtracting the car\'s forward velocity adds a backward part to the rain\'s velocity.',
          'Down + backward = slanting toward the car from the front, which is why the windshield gets wet first.',
          `${B(correct)}.`];
        visual = { key: 'k-vectors', params: { vecs: [{ x: 0, y: -6, label: 'rain' }, { x: -4, y: 0, label: '−car' }], sum: true, xName: 'forward', yName: 'up', title: 'Rain velocity seen from the car' } };
      } else {
        const v1 = rng.int(22, 30), v2 = rng.int(12, 20);
        prompt = `Car A drives east at ${Q(v1, U.mps)} and car B drives east at ${Q(v2, U.mps)} on the same road. From the point of view of the driver of car B, car A…`;
        correct = `Moves east at ${v1 - v2} m/s`;
        wrongs = [`Moves east at ${v1 + v2} m/s`, `Moves west at ${v1 - v2} m/s`, `Moves east at ${v1} m/s`];
        steps = [`${M('v_{A,B} = v_{A,G} - v_{B,G}')}: subtract the observer's velocity.`,
          M(`v_{A,B} = ${v1} - ${v2} = ${v1 - v2}\\ \\text{m/s}`),
          'Positive, so east: A pulls slowly ahead. Same-direction speeds subtract; opposite-direction speeds add.',
          `${B(correct)}.`];
        visual = { key: 'k-relative', params: { vF: v2, vO: v1 - v2, F: 'car B', O: 'car A' } };
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });
})();
