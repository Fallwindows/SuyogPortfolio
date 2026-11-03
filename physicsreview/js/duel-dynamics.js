// AP Physics 1 · Unit 2 — Force and Translational Dynamics: duel problems + their visuals.
// Pushes generators onto PRProblems.generators (unit 12), registers 'd-*' visual keys,
// and points each topic at its lesson. Deterministic: every random choice comes from rng.
(function () {
  'use strict';
  const PR = window.PR;
  const sig = PR.sig, fmt = PR.fmt;
  const { M, X, Q, B, rnd, giv, tx, mc } = PRProblems.helpers;
  const gens = PRProblems.generators;

  const g = 9.8, GRAV = 6.67e-11, M_EARTH = 5.97e24, R_EARTH = 6.37e6;
  const D2R = Math.PI / 180;
  const N_ = tx('N'), KG = tx('kg'), MS = tx('m/s'), MS2 = '\\text{m/s}^2', CM = tx('cm'), NM = tx('N/m');
  const G = {
    g: M('g = 9.8\\ \\text{m/s}^2'),
    G: M('G = 6.67 \\times 10^{-11}\\ \\text{N}\\cdot\\text{m}^2/\\text{kg}^2'),
    Me: M('M_E = 5.97 \\times 10^{24}\\ \\text{kg}'),
    Re: M('R_E = 6.37 \\times 10^{6}\\ \\text{m}'),
  };
  const deg = (d) => M(d + '^\\circ');
  const sum = (a) => a.reduce((s, x) => s + x, 0);

  // ======================================================================
  // VISUALS ('d-*')
  // ======================================================================
  const H = PRVisuals.h;
  const { svg, bg, title, line, dline, arrow, text, rect, circle, dim, wrap, num, arr, isNum, clamp } = H;
  const fN = (x) => (isNum(x) ? H.fN(x) : '?');
  const fa = (x) => (isNum(x) ? num(x) + ' m/s²' : '?');
  const fv = (x) => (isNum(x) ? num(x) + ' m/s' : '?');

  // Wrapped note lines; a line starting with '!' is the highlighted result.
  function notesAt(x, y, lines, max) {
    let o = '', yy = y;
    arr(lines).forEach((s) => {
      const hi = String(s)[0] === '!';
      const ls = wrap(hi ? String(s).slice(1) : s, max || 38);
      ls.forEach((l, i) => { o += text(x, yy + i * 17, l, hi ? { c: 'accent', w: 700 } : { sz: 13 }); });
      yy += ls.length * 17 + 8;
    });
    return o;
  }
  function raw(d, fill, stroke, sw) {
    return '<path d="' + d + '" style="fill:var(--' + fill + ');stroke:var(--' + stroke + ');stroke-width:' + (sw || 2) + ';stroke-linejoin:round"/>';
  }

  // Free-body diagram: dot-with-arrows convention, arrows drawn from the center,
  // lengths proportional to |mag|. f = {label, ang (deg, 0 = right, 90 = up), mag, c}
  function fbdAt(cx, cy, forces, maxL, opts) {
    opts = opts || {};
    const fs = arr(forces).filter((f) => f && f.mag !== 0);
    const mx = Math.max(1e-12, ...fs.map((f) => Math.abs(isNum(f.mag) ? f.mag : 1)));
    const half = opts.size || 16;
    let o = opts.ball ? circle(cx, cy, half, { fill: 'surface', stroke: 'text', sw: 2 })
      : rect(cx - half, cy - half, 2 * half, 2 * half, { fill: 'surface', stroke: 'text', sw: 2, rx: 3 });
    fs.forEach((f) => {
      const a = f.ang * D2R;
      const L = 30 + (maxL - 30) * Math.abs(isNum(f.mag) ? f.mag : 1) / mx;
      const x2 = cx + Math.cos(a) * L, y2 = cy - Math.sin(a) * L;
      o += arrow(cx, cy, x2, y2, f.c || 'text', 2.5);
      const lx = clamp(x2 + Math.cos(a) * 16, 24, (opts.maxX || 620)), ly = clamp(y2 - Math.sin(a) * 14 + 4, 44, 312);
      o += text(lx, ly, f.label, { a: Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end', c: f.c || 'text', w: 700, sz: 12, halo: true });
    });
    o += circle(cx, cy, 3, { fill: 'text' });
    if (opts.acc) {
      const a = opts.acc.ang * D2R, ax = cx + (opts.accDx || 0), ay = cy + (opts.accDy || 0);
      o += arrow(ax, ay, ax + Math.cos(a) * 44, ay - Math.sin(a) * 44, 'accent', 2);
      o += text(ax + Math.cos(a) * 54, ay - Math.sin(a) * 54 + 4, opts.acc.label || 'a', { a: 'middle', c: 'accent', it: true, w: 700, sz: 12, halo: true });
    }
    return o;
  }

  function fbd(p) {
    let b = bg() + title(p.title || 'Free-body diagram');
    b += fbdAt(170, 180, p.forces, 115, { ball: p.ball, acc: p.acc, accDx: 0, accDy: 0, maxX: 320 });
    if (p.caption) b += text(170, 306, p.caption, { a: 'middle', cls: 'small' });
    b += notesAt(340, 70, p.notes, 38);
    return svg(p.title || 'Free-body diagram', b);
  }

  function incline(p) {
    const th = clamp(isNum(p.theta) ? p.theta : 30, 5, 45), t = th * D2R;
    const BL = [40, 290], Lb = 280, top = [BL[0] + Lb, BL[1] - Lb * Math.tan(t)];
    let b = bg() + title(p.title || 'Block on an incline');
    b += raw('M' + BL[0] + ' ' + BL[1] + 'L' + top[0] + ' ' + BL[1] + 'L' + top[0] + ' ' + H.r1(top[1]) + 'Z', 'surface', 'text', 1.5);
    b += text(BL[0] + 62, BL[1] - 8, 'θ = ' + num(th) + '°', { sz: 12 });
    const u = [Math.cos(t), -Math.sin(t)], n = [-Math.sin(t), -Math.cos(t)];
    const hyp = Lb / Math.cos(t), s = 0.5 * hyp;
    const P = [BL[0] + u[0] * s, BL[1] + u[1] * s], C = [P[0] + n[0] * 18, P[1] + n[1] * 18];
    const c = (a, bb) => [C[0] + u[0] * a + n[0] * bb, C[1] + u[1] * a + n[1] * bb];
    const k = [c(-18, -18), c(18, -18), c(18, 18), c(-18, 18)];
    b += raw('M' + k.map((q) => H.r1(q[0]) + ' ' + H.r1(q[1])).join('L') + 'Z', 'surface', 'text', 2);
    const Lg = 78;
    b += arrow(C[0], C[1], C[0], C[1] + Lg, 'pos', 2.5) + text(C[0] + 6, C[1] + Lg + 4, 'mg', { c: 'pos', w: 700, halo: true });
    const LN = Lg * Math.cos(t);
    b += arrow(C[0], C[1], C[0] + n[0] * LN, C[1] + n[1] * LN, 'accent', 2.5) + text(C[0] + n[0] * (LN + 14), C[1] + n[1] * (LN + 14) + 4, 'N', { a: 'middle', c: 'accent', w: 700, halo: true });
    if (p.fric) {
      const sg = p.fric === 'up' ? 1 : -1, Lf = Math.max(24, Lg * (p.mu || 0.2) * Math.cos(t));
      b += arrow(C[0], C[1], C[0] + sg * u[0] * Lf, C[1] + sg * u[1] * Lf, 'warn', 2.5) + text(C[0] + sg * u[0] * (Lf + 14), C[1] + sg * u[1] * (Lf + 14) + 4, 'f', { a: 'middle', c: 'warn', w: 700, it: true, halo: true });
    }
    if (p.motion) {
      const sg = p.motion === 'up' ? 1 : -1, o = [C[0] + n[0] * 44 - sg * u[0] * 10, C[1] + n[1] * 44 - sg * u[1] * 10];
      b += arrow(o[0], o[1], o[0] + sg * u[0] * 40, o[1] + sg * u[1] * 40, 'muted', 1.6) + text(o[0] + sg * u[0] * 50, o[1] + sg * u[1] * 50, 'v', { a: 'middle', c: 'muted', it: true });
    }
    b += notesAt(350, 70, p.notes, 34);
    return svg('Block on an incline with its forces', b);
  }

  function atwood(p) {
    let b = bg() + title(p.table ? 'Modified Atwood machine' : 'Atwood machine');
    const box = (cx, y, m, lab, c) => {
      const s = clamp(22 + 6 * Math.sqrt(m || 1), 26, 52);
      return rect(cx - s / 2, y, s, s, { fill: 'surface', stroke: c || 'text', sw: 2, rx: 3 }) + text(cx, y + s / 2 + 4, lab, { a: 'middle', w: 700, sz: 12 });
    };
    if (!p.table) {
      const px = 160, py = 78, r = 24;
      b += line(px, 40, px, py, 'muted', 3) + circle(px, py, r, { fill: 'surface', stroke: 'text', sw: 2 }) + circle(px, py, 3, { fill: 'text' });
      const heavyRight = p.m2 >= p.m1;
      const y1 = heavyRight ? 140 : 205, y2 = heavyRight ? 205 : 140;
      b += line(px - r, py, px - r, y1, 'text', 1.5) + line(px + r, py, px + r, y2, 'text', 1.5);
      b += box(px - r, y1, p.m1, num(p.m1) + ' kg') + box(px + r, y2, p.m2, num(p.m2) + ' kg');
      const dl = heavyRight ? 1 : -1;
      b += arrow(px - r - 52, 185, px - r - 52, 185 + dl * -40, 'accent', 2) + arrow(px + r + 52, 185, px + r + 52, 185 + dl * 40, 'accent', 2);
      b += text(px - r - 64, 190, 'a', { a: 'end', c: 'accent', it: true, w: 700 }) + text(px + r + 64, 190, 'a', { c: 'accent', it: true, w: 700 });
    } else {
      const ty = 140;
      b += rect(20, ty, 220, 10, { fill: 'border' }) + rect(30, ty + 10, 10, 150, { fill: 'border' }) + rect(222, ty + 10, 10, 150, { fill: 'border' });
      b += circle(244, ty - 12, 13, { fill: 'surface', stroke: 'text', sw: 2 }) + circle(244, ty - 12, 2.5, { fill: 'text' });
      b += rect(80, ty - 50, 66, 50, { fill: 'surface', stroke: 'text', sw: 2, rx: 3 }) + text(113, ty - 21, num(p.M) + ' kg', { a: 'middle', w: 700, sz: 12 });
      b += line(146, ty - 25, 244, ty - 25, 'text', 1.5) + line(257, ty - 12, 257, 200, 'text', 1.5);
      b += box(257, 200, p.m, num(p.m) + ' kg');
      b += arrow(90, ty - 70, 140, ty - 70, 'accent', 2) + text(150, ty - 66, 'a', { c: 'accent', it: true, w: 700 });
      b += arrow(300, 210, 300, 255, 'accent', 2) + text(308, 240, 'a', { c: 'accent', it: true, w: 700 });
      if (p.mu) b += arrow(80, ty - 8, 46, ty - 8, 'warn', 2.5) + text(42, ty - 16, 'f', { a: 'end', c: 'warn', it: true, w: 700 });
    }
    b += notesAt(350, 70, p.notes, 34);
    return svg(p.table ? 'Block on a table tied over a pulley to a hanging block' : 'Two masses hanging over a pulley', b);
  }

  function elevator(p) {
    let b = bg() + title('Apparent weight in an elevator');
    b += rect(30, 50, 150, 250, { fill: 'surface', stroke: 'text', sw: 2, rx: 4 }) + line(105, 50, 105, 36, 'text', 2);
    b += rect(75, 270, 60, 12, { fill: 'border', stroke: 'text', sw: 1 }) + text(105, 296, 'scale', { a: 'middle', cls: 'small' });
    b += circle(105, 180, 13, { fill: 'surface', stroke: 'text', sw: 2 }) + rect(92, 196, 26, 50, { fill: 'surface', stroke: 'text', sw: 2, rx: 6 });
    b += line(98, 246, 98, 270, 'text', 3) + line(112, 246, 112, 270, 'text', 3);
    if (p.vdir) {
      const up = p.vdir === 'up';
      b += arrow(155, up ? 150 : 110, 155, up ? 110 : 150, 'muted', 2) + text(162, 134, 'v', { c: 'muted', it: true });
    }
    const aUp = isNum(p.a) ? p.a : 0;
    if (aUp) b += arrow(48, aUp > 0 ? 150 : 110, 48, aUp > 0 ? 110 : 150, 'accent', 2.5) + text(58, 134, 'a', { c: 'accent', it: true, w: 700 });
    const W = (p.m || 60) * g, Nn = isNum(p.N) ? p.N : W;
    b += fbdAt(270, 175, [
      { label: 'N = ' + fN(Nn), ang: 90, mag: Nn, c: 'accent' },
      { label: 'mg = ' + fN(W), ang: 270, mag: W, c: 'pos' },
    ], 110, { ball: true, maxX: 360 });
    b += notesAt(380, 70, p.notes, 30);
    return svg('Person on a scale in an accelerating elevator', b);
  }

  function zig(x, y1, y2, n) {
    n = n || 7;
    const lead = 10, seg = (y2 - y1 - 2 * lead) / n;
    let d = 'M' + x + ' ' + y1 + 'L' + x + ' ' + (y1 + lead);
    for (let i = 0; i < n; i++) d += 'L' + (x + (i % 2 ? -11 : 11)) + ' ' + H.r1(y1 + lead + seg * (i + 0.5));
    d += 'L' + x + ' ' + H.r1(y2 - lead) + 'L' + x + ' ' + y2;
    return H.path(d, 'good', 2);
  }
  function spring(p) {
    const mode = p.mode || 'single';
    let b = bg() + title(mode === 'single' ? "Hooke's law" : 'Springs in ' + mode);
    b += line(50, 50, 270, 50, 'text', 3);
    for (let x = 56; x < 270; x += 14) b += line(x, 50, x - 8, 42, 'muted', 1.2);
    const mass = (y) => rect(125, y, 70, 44, { fill: 'surface', stroke: 'text', sw: 2, rx: 3 }) + text(160, y + 27, p.m ? num(p.m) + ' kg' : 'm', { a: 'middle', w: 700, sz: 12 });
    let yb;
    if (mode === 'series') {
      b += zig(160, 50, 135) + circle(160, 135, 4, { fill: 'text' }) + zig(160, 135, 220) + mass(220);
      b += text(180, 95, 'k₁', { c: 'good', w: 700 }) + text(180, 180, 'k₂', { c: 'good', w: 700 });
      yb = 264;
    } else if (mode === 'parallel') {
      b += zig(125, 50, 190) + zig(195, 50, 190) + line(115, 190, 205, 190, 'text', 3) + line(160, 190, 160, 200, 'text', 2) + mass(200);
      b += text(100, 125, 'k₁', { a: 'end', c: 'good', w: 700 }) + text(215, 125, 'k₂', { c: 'good', w: 700 });
      yb = 244;
    } else {
      b += zig(160, 50, 190, 8) + mass(190) + text(180, 120, 'k', { c: 'good', w: 700, it: true });
      yb = 234;
    }
    b += arrow(222, yb - 22, 222, yb + 26, 'pos', 2.5) + text(230, yb + 20, 'mg', { c: 'pos', w: 700 });
    b += notesAt(330, 70, p.notes, 36);
    return svg('Mass hanging from springs', b);
  }

  // Circular motion. view 'top' (flat curve / orbit, dashed path) or 'side' (vertical circle, solid track).
  function circular(p) {
    let b = bg() + title(p.title || 'Circular motion');
    const cx = 170, cy = 180, R = 90;
    b += circle(cx, cy, R, { stroke: p.view === 'side' ? 'text' : 'muted', sw: p.view === 'side' ? 2 : 1.5, dash: p.view === 'side' ? null : '6 5' });
    if (p.planet) b += circle(cx, cy, 34, { fill: 'accent', op: 0.25, stroke: 'accent', sw: 1.5 }) + text(cx, cy + 4, p.planet, { a: 'middle', sz: 11, w: 600 });
    else b += circle(cx, cy, 3, { fill: 'muted' });
    const at = p.at || 'right';
    const pos = { top: [cx, cy - R], bottom: [cx, cy + R], right: [cx + R, cy] }[at] || [cx + R, cy];
    b += dline(cx, cy, pos[0], pos[1], 'muted', 1.2);
    if (p.rLabel) b += text((cx + pos[0]) / 2 + (at === 'right' ? 0 : 8), (cy + pos[1]) / 2 - (at === 'right' ? 8 : 0), p.rLabel, { a: at === 'right' ? 'middle' : 'start', cls: 'small' });
    const tang = { top: [1, 0], right: [0, 1], bottom: [-1, 0] }[at] || [0, 1];
    b += arrow(pos[0], pos[1], pos[0] + tang[0] * 62, pos[1] + tang[1] * 62, 'muted', 2) + text(pos[0] + tang[0] * 72, pos[1] + tang[1] * 72 + 4, p.vLabel || 'v', { a: 'middle', c: 'muted', it: true, halo: true });
    b += fbdAt(pos[0], pos[1], p.forces, 62, { ball: true, size: 10, maxX: 320 });
    b += notesAt(340, 70, p.notes, 38);
    return svg(p.title || 'Circular motion', b);
  }

  function gravity(p) {
    let b = bg() + title(p.title || 'Universal gravitation');
    const L = p.left || {}, Rt = p.right || {};
    const r1 = clamp(L.size || 40, 8, 70), r2 = clamp(Rt.size || 20, 6, 60);
    const x1 = 30 + r1 + 10, x2 = 300 - r2;
    b += circle(x1, 170, r1, { fill: 'accent', op: 0.3, stroke: 'accent', sw: 1.5 }) + circle(x2, 170, r2, { fill: 'warn', op: 0.3, stroke: 'warn', sw: 1.5 });
    b += text(x1, 170 + r1 + 18, L.label || 'M', { a: 'middle', sz: 12, w: 600 }) + text(x2, 170 + r2 + 18, Rt.label || 'm', { a: 'middle', sz: 12, w: 600 });
    b += arrow(x1 + r1 + 2, 170, x1 + r1 + 46, 170, 'pos', 2.5) + arrow(x2 - r2 - 2, 170, x2 - r2 - 46, 170, 'pos', 2.5);
    if (p.force) b += text((x1 + x2) / 2, 150, p.force, { a: 'middle', c: 'pos', w: 700, sz: 12, halo: true });
    b += dim(x1, 260, x2, p.dist || 'r');
    b += notesAt(340, 70, p.notes, 38);
    return svg(p.title || 'Two masses attracting each other', b);
  }

  function com(p) {
    const L = p.L || 100, ms = arr(p.masses);
    const X0 = 50, X1 = 590, xs = (x) => X0 + (x / L) * (X1 - X0);
    let b = bg() + title('Center of mass: the balance point');
    b += rect(X0 - 4, 166, X1 - X0 + 8, 8, { fill: 'muted', rx: 3 });
    for (let x = 0; x <= L; x += L / 10) b += line(xs(x), 178, xs(x), 186, 'muted', 1) + text(xs(x), 200, num(x), { a: 'middle', cls: 'small' });
    const mx = Math.max(...ms.map((m) => m.m), 1);
    ms.forEach((m) => {
      const r = 10 + 18 * Math.sqrt(m.m / mx);
      b += circle(xs(m.x), 166 - r, r, { fill: 'accent', op: 0.35, stroke: 'accent', sw: 1.5 }) + text(xs(m.x), 166 - 2 * r - 8, num(m.m) + ' kg', { a: 'middle', sz: 12, w: 600 });
    });
    if (isNum(p.xcm)) {
      const x = xs(p.xcm);
      b += raw('M' + H.r1(x) + ' 212L' + H.r1(x - 14) + ' 236L' + H.r1(x + 14) + ' 236Z', 'pos', 'pos', 1);
      b += text(x, 256, 'x_cm = ' + num(p.xcm) + ' cm', { a: 'middle', c: 'pos', w: 700 });
    }
    b += text(320, 296, p.note || 'x_cm = (m₁x₁ + m₂x₂ + …) / (m₁ + m₂ + …): heavier masses pull the balance point toward them.', { a: 'middle', cls: 'small' });
    return svg('Masses on a light rod and their center of mass', b);
  }

  function blocks(p) {
    const pull = p.mode === 'pull';
    let b = bg() + title(pull ? 'Blocks pulled by a string' : 'Blocks pushed together');
    const fy = 150;
    b += line(20, fy, 380, fy, 'text', 2);
    const wA = 30 + 6 * Math.sqrt(p.mA || 1), wB = 30 + 6 * Math.sqrt(p.mB || 1);
    let xA = 110, xB = pull ? xA + wA + 50 : xA + wA;
    b += rect(xA, fy - 50, wA, 50, { fill: 'surface', stroke: 'text', sw: 2, rx: 3 }) + text(xA + wA / 2, fy - 21, 'A', { a: 'middle', w: 700 });
    b += rect(xB, fy - 50, wB, 50, { fill: 'surface', stroke: 'text', sw: 2, rx: 3 }) + text(xB + wB / 2, fy - 21, 'B', { a: 'middle', w: 700 });
    b += text(xA + wA / 2, fy + 18, num(p.mA) + ' kg', { a: 'middle', cls: 'small' }) + text(xB + wB / 2, fy + 18, num(p.mB) + ' kg', { a: 'middle', cls: 'small' });
    if (pull) {
      b += line(xA + wA, fy - 25, xB, fy - 25, 'text', 1.5);
      b += arrow(xB + wB, fy - 25, xB + wB + 60, fy - 25, 'text', 2.5) + text(xB + wB + 64, fy - 38, 'F = ' + fN(p.F), { w: 700, sz: 12 });
    } else {
      b += arrow(xA - 70, fy - 25, xA, fy - 25, 'text', 2.5) + text(xA - 70, fy - 38, 'F = ' + fN(p.F), { w: 700, sz: 12 });
    }
    b += arrow(xA, fy - 70, xA + 50, fy - 70, 'accent', 2) + text(xA + 58, fy - 66, 'a = ' + fa(p.a), { c: 'accent', w: 700, sz: 12 });
    // horizontal FBDs of each block
    const F = p.F || 1, P = p.contact || 0, sc = 90 / F;
    const fbA = 100, fbB = 280, yy = 240;
    b += text(fbA, 205, 'A alone', { a: 'middle', cls: 'small' }) + text(fbB, 205, 'B alone', { a: 'middle', cls: 'small' });
    b += rect(fbA - 12, yy - 12, 24, 24, { fill: 'surface', stroke: 'text', sw: 2 }) + rect(fbB - 12, yy - 12, 24, 24, { fill: 'surface', stroke: 'text', sw: 2 });
    if (!pull) {
      b += arrow(fbA, yy, fbA + F * sc, yy, 'text', 2.5) + text(fbA + F * sc + 4, yy - 10, 'F', { w: 700 });
      b += arrow(fbA, yy, fbA - Math.max(22, P * sc), yy, 'accent', 2.5) + text(fbA - Math.max(22, P * sc) - 4, yy - 10, 'P', { a: 'end', c: 'accent', w: 700 });
      b += arrow(fbB, yy, fbB + Math.max(22, P * sc), yy, 'accent', 2.5) + text(fbB + Math.max(22, P * sc) + 4, yy - 10, 'P', { c: 'accent', w: 700 });
    } else {
      b += arrow(fbA, yy, fbA + Math.max(22, P * sc), yy, 'good', 2.5) + text(fbA + Math.max(22, P * sc) + 4, yy - 10, 'T', { c: 'good', w: 700 });
      b += arrow(fbB, yy, fbB - Math.max(22, P * sc), yy, 'good', 2.5) + text(fbB - Math.max(22, P * sc) - 4, yy - 10, 'T', { a: 'end', c: 'good', w: 700 });
      b += arrow(fbB, yy, fbB + F * sc * 0.8, yy, 'text', 2.5) + text(fbB + F * sc * 0.8 + 4, yy - 10, 'F', { w: 700 });
    }
    b += text(190, 296, '(vertical forces cancel and are left out)', { a: 'middle', cls: 'small' });
    b += notesAt(410, 70, p.notes, 28);
    return svg('Two blocks accelerating together', b);
  }

  // Newton's third-law pair: two objects, equal and opposite arrows.
  function pair(p) {
    let b = bg() + title(p.title || "Newton's third law pair");
    const A = p.a || {}, Bo = p.b || {};
    const rA = clamp(A.size || 26, 10, 60), rB = clamp(Bo.size || 26, 10, 60);
    const xA = 60 + rA, xB = 330 - rB, y = 165;
    b += circle(xA, y, rA, { fill: 'accent', op: 0.25, stroke: 'accent', sw: 2 }) + circle(xB, y, rB, { fill: 'warn', op: 0.25, stroke: 'warn', sw: 2 });
    b += text(xA, y + rA + 20, A.label || 'A', { a: 'middle', w: 700, sz: 12 }) + text(xB, y + rB + 20, Bo.label || 'B', { a: 'middle', w: 700, sz: 12 });
    const L = 60, apart = !!p.repel;
    const ax = apart ? xA - rA - 4 : xA + rA + 4, bx = apart ? xB + rB + 4 : xB - rB - 4;
    b += arrow(ax, y, ax + (apart ? -L : L), y, 'pos', 3) + arrow(bx, y, bx + (apart ? L : -L), y, 'pos', 3);
    b += text(xA, y - rA - 14, p.onA || 'force on A by B', { a: 'middle', c: 'pos', sz: 12, w: 600, halo: true });
    b += text(xB, y - rB - 14, p.onB || 'force on B by A', { a: 'middle', c: 'pos', sz: 12, w: 600, halo: true });
    b += text(195, 296, 'Same size · opposite directions · on different objects', { a: 'middle', cls: 'small' });
    b += notesAt(380, 70, p.notes, 32);
    return svg(p.title || "Newton's third law pair", b);
  }

  PRVisuals.register({
    'd-fbd': fbd, 'd-incline': incline, 'd-atwood': atwood, 'd-elevator': elevator, 'd-spring': spring,
    'd-circular': circular, 'd-gravity': gravity, 'd-com': com, 'd-blocks': blocks, 'd-pair': pair,
  });

  // Force shortcuts for FBD params.
  const fW = (mag, lab) => ({ label: lab || 'mg', ang: 270, mag, c: 'pos' });
  const fNorm = (mag, lab, ang) => ({ label: lab || 'N', ang: ang == null ? 90 : ang, mag, c: 'accent' });
  const fF = (mag, ang, lab) => ({ label: lab || 'f', ang, mag, c: 'warn' });
  const fT = (mag, ang, lab) => ({ label: lab || 'T', ang, mag, c: 'good' });
  const fA = (mag, ang, lab) => ({ label: lab || 'F', ang, mag, c: 'text' });
  const vis = (key, params) => ({ key, params });

  // ======================================================================
  // GENERATORS — unit 12
  // ======================================================================

  // ---------- center of mass ----------
  gens.push({
    id: 'p1u2-com', unit: 12, topic: 'Center of mass',
    make(rng) {
      const n = rng.pick([2, 3, 3]);
      const xs = rng.shuffle([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]).slice(0, n).sort((a, b) => a - b);
      const ms = xs.map(() => rng.pick([0.5, 1, 1.5, 2, 3, 4, 5]));
      const top = sum(ms.map((m, i) => m * xs[i])), bot = sum(ms);
      const xcm = top / bot;
      const list = ms.map((m, i) => `a ${Q(m, KG)} mass at the ${xs[i]} cm mark`).join(n === 2 ? ' and ' : ', ').replace(/, (?=[^,]*$)/, ', and ');
      return {
        type: 'numeric',
        prompt: `A meter stick of negligible mass has ${list}. Where is the center of mass of the system? Answer as a position on the stick in cm.`,
        answer: sig(xcm, 3), units: 'cm',
        steps: [
          `The center of mass is the mass-weighted average position: ${M('x_{cm} = \\frac{\\sum m_i x_i}{\\sum m_i}')}. It is where you could balance the whole system on one finger.`,
          `Numerator: ${M(ms.map((m, i) => `(${m})(${xs[i]})`).join(' + ') + ` = ${fmt(top)}\\ \\text{kg}\\cdot\\text{cm}`)}.`,
          `Denominator: total mass ${M(`${fmt(bot)}\\ \\text{kg}`)}, so ${M(`x_{cm} = ${fmt(top)}/${fmt(bot)} = ${fmt(xcm)}\\ \\text{cm}`)}.`,
          `${B(`x_cm ≈ ${X(xcm)} cm`)}. Check: it lies between the masses and sits closer to the heavier ones.`,
        ],
        visual: vis('d-com', { masses: ms.map((m, i) => ({ m, x: xs[i] })), L: 100, xcm }),
      };
    },
  });

  // ---------- second law: perpendicular forces ----------
  gens.push({
    id: 'p1u2-net-force', unit: 12, topic: "Newton's second law (net force)",
    make(rng) {
      const m = rng.pick([2, 3, 4, 5, 6, 8, 10, 12]);
      const F1 = rng.int(4, 12) * 5, F2 = rng.int(2, 10) * 5, F3 = rng.int(1, 8) * 5;
      const Fx = F1 - F3, Fy = F2, Fn = Math.hypot(Fx, Fy), a = Fn / m;
      const ang = Math.atan2(Fy, Fx) / D2R;
      return {
        type: 'numeric',
        prompt: `A ${Q(m, KG)} puck on frictionless, horizontal ice is pulled by three horizontal forces: ${Q(F1, N_)} east, ${Q(F2, N_)} north, and ${Q(F3, N_)} west. What is the magnitude of the puck's acceleration? Answer in m/s².`,
        answer: sig(a, 3), units: 'm/s²',
        steps: [
          `${M('\\vec a = \\vec F_{net}/m')}: add the forces as vectors first, then divide by the mass. Gravity and the normal force cancel vertically, so only the three pulls matter.`,
          `East–west: ${M(`F_x = ${F1} - ${F3} = ${Fx}\\ \\text{N}`)}. North–south: ${M(`F_y = ${Fy}\\ \\text{N}`)}.`,
          `${M(`|F_{net}| = \\sqrt{${Fx}^2 + ${Fy}^2} = ${fmt(Fn)}\\ \\text{N}`)}, pointing ${fmt(Math.abs(ang), 2)}° ${Fx >= 0 ? 'north of east' : 'north of west'}.`,
          `${B(`a = ${fmt(Fn)}/${m} ≈ ${X(a)} m/s²`)}, in the same direction as the net force. Adding the magnitudes (${F1 + F2 + F3} N) is the classic mistake.`,
        ],
        visual: vis('d-fbd', {
          title: 'Horizontal forces on the puck (top view)',
          forces: [fA(F1, 0, `${F1} N`), fA(F2, 90, `${F2} N`), fA(F3, 180, `${F3} N`), { label: 'F_net', ang, mag: Fn, c: 'accent' }],
          notes: [`Fx = ${F1} − ${F3} = ${Fx} N`, `Fy = ${Fy} N`, `|F_net| = √(Fx² + Fy²) = ${num(Fn)} N`, `!a = F_net/m = ${fa(a)}`],
        }),
      };
    },
  });

  // ---------- second law: angled pull ----------
  gens.push({
    id: 'p1u2-angled-pull', unit: 12, topic: "Newton's second law (angled pull)",
    make(rng) {
      let m, F, th, mu, a, Nn;
      for (let i = 0; i < 40; i++) {
        m = rng.pick([4, 5, 6, 8, 10, 12, 15, 20]); F = rng.int(4, 20) * 5; th = rng.pick([20, 25, 30, 35, 40, 45, 50]);
        mu = rng() < 0.4 ? 0 : rnd(rng, 0.1, 0.4, 2);
        Nn = m * g - F * Math.sin(th * D2R);
        a = (F * Math.cos(th * D2R) - mu * Nn) / m;
        if (Nn > 0.15 * m * g && a > 0.2) break;
      }
      if (!(Nn > 0 && a > 0)) { m = 10; F = 60; th = 30; mu = 0.2; Nn = m * g - F * 0.5; a = (F * Math.cos(th * D2R) - mu * Nn) / m; }
      const ask = rng() < 0.7 ? 'a' : 'N';
      const Fx = F * Math.cos(th * D2R), Fy = F * Math.sin(th * D2R), f = mu * Nn;
      const surf = mu ? `a horizontal floor with coefficient of kinetic friction ${M('\\mu_k = ' + mu)}` : 'a frictionless horizontal floor';
      return {
        type: 'numeric',
        prompt: `A ${Q(m, KG)} crate slides across ${surf}. A rope pulls it with a force of ${Q(F, N_)} at ${deg(th)} above the horizontal. ${ask === 'a' ? "What is the crate's acceleration? Answer in m/s²." : 'What is the normal force from the floor on the crate? Answer in N.'}`,
        given: giv(G.g),
        answer: sig(ask === 'a' ? a : Nn, 3), units: ask === 'a' ? 'm/s²' : 'N',
        steps: [
          `Split the pull into components: ${M(`F_x = F\\cos\\theta = ${fmt(Fx)}\\ \\text{N}`)}, ${M(`F_y = F\\sin\\theta = ${fmt(Fy)}\\ \\text{N}`)}.`,
          `Vertical: no vertical acceleration, so ${M('N + F_y = mg')} → ${M(`N = ${fmt(m * g)} - ${fmt(Fy)} = ${fmt(Nn)}\\ \\text{N}`)}. The rope lifts a little, so N is <i>less</i> than mg.`,
          mu ? `Friction uses that N: ${M(`f = \\mu_k N = ${mu}(${fmt(Nn)}) = ${fmt(f)}\\ \\text{N}`)}, so ${M(`a = \\frac{F_x - f}{m} = \\frac{${fmt(Fx)} - ${fmt(f)}}{${m}} = ${fmt(a)}\\ \\text{m/s}^2`)}.`
            : `No friction: ${M(`a = F_x/m = ${fmt(Fx)}/${m} = ${fmt(a)}\\ \\text{m/s}^2`)}.`,
          ask === 'a' ? `${B(`a ≈ ${X(a)} m/s²`)}. Using the full F instead of F cos θ${mu ? ', or mg instead of N for friction,' : ''} are the usual slips.`
            : `${B(`N ≈ ${X(Nn)} N`)}, smaller than mg = ${X(m * g)} N.`,
        ],
        visual: vis('d-fbd', {
          title: 'Free-body diagram of the crate',
          forces: [fW(m * g, 'mg'), fNorm(Nn), fA(F, th, 'F'), mu ? fF(f, 180) : null].filter(Boolean),
          acc: { ang: 0, label: 'a' },
          notes: [`Fx = F cos ${th}° = ${fN(Fx)}`, `N = mg − F sin ${th}° = ${fN(Nn)}`, mu ? `f = μN = ${fN(f)}` : 'no friction', `!${ask === 'a' ? 'a = ' + fa(a) : 'N = ' + fN(Nn)}`],
        }),
      };
    },
  });

  // ---------- third law ----------
  gens.push({
    id: 'p1u2-third-law', unit: 12, topic: "Newton's third law",
    make(rng) {
      const kind = rng.pick(['crash', 'book', 'skaters', 'apple', 'horse']);
      let prompt, correct, wrongs, steps, visual;
      if (kind === 'crash') {
        const mT = rng.pick([8000, 10000, 12000]), mC = rng.pick([900, 1000, 1200]);
        prompt = `A ${Q(mT, KG)} truck collides head-on with a ${Q(mC, KG)} car. During the collision, how does the force the truck exerts on the car compare with the force the car exerts on the truck?`;
        correct = 'Equal in magnitude and opposite in direction';
        wrongs = ['The truck pushes harder, because it has more mass', 'The car pushes harder, because it is the one that gets damaged more', 'It depends on which vehicle was moving faster'];
        steps = [`These two forces are a Newton's third-law pair: the truck pushes on the car, and the car pushes back on the truck.`, `Third-law pairs are <i>always</i> equal in size and opposite in direction, no matter the masses or speeds.`, `What differs is the effect: ${M('a = F/m')}, so the car's acceleration is ${fmt(mT / mC, 2)}× the truck's. That's why the car is wrecked.`, `${B('Equal and opposite forces')}.`];
        visual = vis('d-pair', { title: 'Truck and car push on each other', a: { label: 'truck', size: 50 }, b: { label: 'car', size: 20 }, repel: true, onA: 'F on truck by car', onB: 'F on car by truck', notes: ['Forces: equal size', `Accelerations: car's is ${num(mT / mC, 2)}× bigger (a = F/m)`] });
      } else if (kind === 'book') {
        prompt = `A book rests on a table. Earth pulls down on the book (its weight). What is the Newton's third-law partner of that force?`;
        correct = 'The book pulling up on Earth';
        wrongs = ['The table pushing up on the book', 'The book pushing down on the table', 'There is none — weight has no reaction force'];
        steps = [`A third-law pair is the <i>same interaction</i> seen from both sides: "A on B" pairs with "B on A".`, `The weight is "Earth pulls book (gravitationally)". Swap the objects: "book pulls Earth (gravitationally)", pointing up.`, `The table's normal force is equal and opposite to the weight here, but that is because of the first law (the book isn't accelerating), not the third law. It acts on the same object and is a different kind of force.`, `${B('Book pulls up on Earth')}.`];
        visual = vis('d-pair', { title: 'Earth and book pull on each other', a: { label: 'Earth', size: 58 }, b: { label: 'book', size: 14 }, onA: 'book pulls Earth', onB: 'Earth pulls book', notes: ['Pair = same interaction, swapped objects', 'Normal force on the book is NOT the partner: same object, different interaction'] });
      } else if (kind === 'skaters') {
        const m1 = rng.pick([40, 50, 60, 75, 80]), m2 = rng.pick([20, 25, 30, 40, 100]);
        if (m1 === m2) return this.make(rng);
        const r = m2 / m1;
        const R = (x) => M(fmt(x, 3));
        prompt = `On frictionless ice, a ${Q(m1, KG)} skater pushes off a ${Q(m2, KG)} skater, and they move apart. What is the ratio of the first skater's acceleration to the second skater's during the push?`;
        correct = R(r);
        wrongs = [R(1 / r), R(1), R(r * r), R(1 / (r * r)), R(2 * r)];
        steps = [`During the push, each skater exerts a force on the other: a third-law pair, so ${M('F_{1\\text{ on }2} = F_{2\\text{ on }1} = F')}.`, `${M('a_1 = F/m_1')} and ${M('a_2 = F/m_2')}.`, `${M(`\\frac{a_1}{a_2} = \\frac{m_2}{m_1} = \\frac{${m2}}{${m1}} = ${fmt(r)}`)}.`, `${B(`a₁/a₂ = ${X(r)}`)}: same force, so the lighter skater gets the bigger acceleration.`];
        visual = vis('d-pair', { title: 'Skaters push apart', a: { label: m1 + ' kg', size: 20 + m1 / 4 }, b: { label: m2 + ' kg', size: 20 + m2 / 4 }, repel: true, onA: 'F', onB: 'F', notes: ['Same force F on each', `a₁ = F/${m1}, a₂ = F/${m2}`, `!a₁/a₂ = ${num(r)}`] });
      } else if (kind === 'apple') {
        prompt = `An apple falls from a tree. Compared with the gravitational force Earth exerts on the apple, the gravitational force the apple exerts on Earth is…`;
        correct = 'Equal in size, so Earth accelerates toward the apple, but by an immeasurably tiny amount';
        wrongs = ['Zero, because the apple is too small to pull on Earth', 'Much smaller, because the apple has much less mass', 'Equal in size, so Earth accelerates toward the apple just as fast as the apple falls'];
        steps = [`Earth-on-apple and apple-on-Earth are a third-law pair, so they are exactly equal in size.`, `For a 0.2 kg apple, that force is about 2 N.`, `Earth's acceleration is ${M('a = F/M_E = 2/(6\\times10^{24}) \\approx 3\\times10^{-25}\\ \\text{m/s}^2')}, far too small to notice.`, `${B('Equal forces; tiny effect on Earth')}.`];
        visual = vis('d-pair', { title: 'Earth and apple pull on each other', a: { label: 'Earth', size: 60 }, b: { label: 'apple', size: 10 }, onA: '≈ 2 N', onB: '≈ 2 N', notes: ['Equal forces', "Earth's a = F/M ≈ 10⁻²⁵ m/s²", "Apple's a = 9.8 m/s²"] });
      } else {
        prompt = `A horse pulls a cart, and the horse and cart speed up together. The cart pulls back on the horse with a force equal and opposite to the horse's pull. Why can they still accelerate?`;
        correct = 'The two forces act on different objects; the horse speeds up because the ground pushes it forward harder than the cart pulls it back';
        wrongs = ['The horse pulls slightly harder on the cart than the cart pulls on the horse', 'The forces cancel, so the motion comes from the horse\'s momentum', 'The cart\'s pull on the horse only appears after the cart starts moving'];
        steps = [`Equal and opposite third-law forces act on <i>different</i> objects, so they never cancel each other.`, `To decide whether the horse accelerates, add only the forces <i>on the horse</i>: friction from the ground forward, the cart's pull backward.`, `The horse pushes back on the ground, and the ground pushes the horse forward (another third-law pair). When that forward push exceeds the cart's pull, the horse accelerates.`, `${B('Different objects — the pairs never cancel')}.`];
        visual = vis('d-fbd', { title: 'Horizontal forces on the horse alone', forces: [fF(9, 0, 'ground on horse'), fT(6, 180, 'cart on horse')], acc: { ang: 0, label: 'a' }, notes: ['Only forces ON the horse go in its diagram', 'Its partner, horse on cart, acts on the cart', '!Net force forward → horse speeds up'] });
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });

  // ---------- first law ----------
  gens.push({
    id: 'p1u2-first-law', unit: 12, topic: "Newton's first law",
    make(rng) {
      const kind = rng.pick(['elevator', 'puck', 'skydiver', 'bus', 'car']);
      let prompt, correct, wrongs, steps, visual;
      if (kind === 'elevator') {
        const m = rng.pick([600, 800, 1000, 1200]), v = rng.pick([1, 2, 3, 4]);
        prompt = `A ${Q(m, KG)} elevator moves upward at a constant ${Q(v, MS)}. How does the tension in its cable compare with the elevator's weight?`;
        correct = 'The tension equals the weight';
        wrongs = ['The tension is greater than the weight, because the elevator moves up', 'The tension is less than the weight', 'The tension depends on how fast the elevator is moving'];
        steps = [`Constant velocity means zero acceleration (first law), so the net force is zero.`, `Only two forces act: tension up and weight down. For them to cancel, ${M('T = mg')}.`, `${M(`T = ${m}(9.8) = ${fmt(m * g)}\\ \\text{N}`)}, the same whether the elevator moves up, down or sits still, as long as velocity is constant.`, `${B('T = mg')}: you need a net force to change velocity, not to keep it.`];
        visual = vis('d-fbd', { title: 'Elevator at constant velocity', forces: [fT(m * g, 90, 'T'), fW(m * g)], notes: ['v constant → a = 0', 'F_net = T − mg = 0', '!T = mg = ' + fN(m * g)] });
      } else if (kind === 'puck') {
        prompt = `A hockey puck slides across frictionless ice at a constant velocity. Which statement about the horizontal forces on the puck is correct?`;
        correct = 'There is no horizontal force on it at all';
        wrongs = ['A forward force keeps it moving', 'A forward force from the stick stays with the puck and slowly wears off', 'There is a forward force balanced by a backward force of inertia'];
        steps = [`Newton's first law: an object keeps its velocity unless a net force acts on it.`, `Once the puck leaves the stick, nothing touches it horizontally (no friction), so there is no horizontal force.`, `Inertia isn't a force; it's the tendency to keep moving. The vertical forces (weight and normal) cancel.`, `${B('No horizontal force — motion needs no force to continue')}.`];
        visual = vis('d-fbd', { title: 'Puck sliding on frictionless ice', forces: [fNorm(1), fW(1)], acc: { ang: 0, label: 'v (constant)' }, notes: ['Only weight and normal force, which cancel', 'Nothing pushes it forward', '!F_net = 0 → v stays constant'] });
      } else if (kind === 'skydiver') {
        const m = rng.pick([60, 70, 80, 90]);
        prompt = `A ${Q(m, KG)} skydiver falls at terminal (constant) velocity. What is the magnitude of the air resistance on her?`;
        const W = m * g, R = (x) => M(fmt(x) + '\\ \\text{N}');
        correct = R(W);
        wrongs = [R(0), R(W / 2), R(2 * W), R(m)];
        steps = [`Terminal velocity is constant velocity, so acceleration is zero.`, `Forces: weight ${M('mg')} down, air resistance up. Zero net force means they're equal.`, `${M(`F_{air} = mg = ${m}(9.8) = ${fmt(W)}\\ \\text{N}`)}.`, `${B(`F_air = ${X(W)} N`)}. She's still moving fast, but the speed no longer changes.`];
        visual = vis('d-fbd', { title: 'Skydiver at terminal velocity', ball: true, forces: [{ label: 'F_air', ang: 90, mag: W, c: 'accent' }, fW(W)], notes: ['Constant v → F_net = 0', '!F_air = mg = ' + fN(W)] });
      } else if (kind === 'bus') {
        prompt = `A standing bus passenger lurches forward when the bus brakes suddenly. Why?`;
        correct = 'Her body keeps moving forward while the bus (and her feet) slow down';
        wrongs = ['A forward force pushes her when the brakes are applied', 'The braking force on the bus is transferred to her as a forward push', 'Her inertia exerts a forward force on her'];
        steps = [`First law: her body keeps moving at the bus's old speed unless a force changes that.`, `Friction from the floor slows her feet along with the bus, but the top of her body keeps going.`, `Relative to the slowing bus she seems to be thrown forward, but no forward force acts on her.`, `${B('Inertia: she keeps moving, the bus doesn\'t')}.`];
        visual = vis('d-fbd', { title: 'Passenger as the bus brakes', forces: [fNorm(1), fW(1), fF(0.5, 180, 'friction on feet')], acc: { ang: 180, label: 'a (backward)' }, notes: ['The only horizontal force on her points backward', 'Nothing pushes her forward', '!She keeps moving; the bus slows under her'] });
      } else {
        const F = rng.int(4, 12) * 100;
        prompt = `A car moves along a straight, level road at a constant ${Q(rng.int(15, 30), MS)}. The road pushes the car forward with ${Q(F, N_)}. What is the total backward (air drag + rolling resistance) force on the car?`;
        const R = (x) => M(fmt(x) + '\\ \\text{N}');
        correct = R(F);
        wrongs = [R(0), R(F / 2), R(2 * F), R(F * 0.9)];
        steps = [`Constant speed in a straight line = constant velocity = zero acceleration.`, `Zero acceleration means zero net force: forward and backward forces cancel.`, `${M(`F_{back} = F_{forward} = ${F}\\ \\text{N}`)}.`, `${B(`${F} N`)}. Equal forces don't mean "no motion"; they mean "no change in motion".`];
        visual = vis('d-fbd', { title: 'Car at constant velocity', forces: [fNorm(2 * F), fW(2 * F), fF(F, 0, 'F forward'), { label: 'drag', ang: 180, mag: F, c: 'muted' }], notes: ['v constant → F_net = 0', '!backward forces = ' + F + ' N'] });
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });

  // ---------- gravitation: planet scaling ----------
  gens.push({
    id: 'p1u2-gravity-scaling', unit: 12, topic: 'Gravitational force (scaling)',
    make(rng) {
      let a, b;
      do { a = rng.pick([0.5, 2, 3, 4, 8]); b = rng.pick([0.5, 2, 3, 4]); } while (Math.abs(a / (b * b) - 1) < 1e-9);
      const m = rng.pick([10, 20, 40, 50, 60]), W0 = m * g;
      const opt = (f) => M(fmt(W0 * f, 3) + '\\ \\text{N}');
      const f = a / (b * b);
      return {
        type: 'mc',
        prompt: `An object weighs ${Q(W0, N_)} on Earth. A planet has ${a} times Earth's mass and ${b} times Earth's radius. What does the object weigh on that planet's surface?`,
        ...mc(rng, opt(f), [opt(a / b), opt(a * b * b), opt(a * b), opt(1 / (b * b)), opt(a), opt(b * b / a)]),
        steps: [
          `Weight is the gravitational force: ${M('F_g = \\frac{GMm}{R^2}')}, so on the surface ${M('g = GM/R^2')}.`,
          `Mass factor: ×${a}. Radius factor: ${M(`R \\to ${b}R`)}, so ${M(`1/R^2 \\to 1/${fmt(b * b)}`)}.`,
          `${M(`W = ${fmt(W0)} \\times \\frac{${a}}{${fmt(b * b)}} = ${fmt(W0 * f)}\\ \\text{N}`)}. (The object's mass, ${m} kg, doesn't change.)`,
          `${B(`W ≈ ${X(W0 * f)} N`)}. Forgetting to square the radius factor is the common slip.`,
        ],
        visual: vis('d-gravity', { title: 'Weight on another planet', left: { label: `planet: ${a}M, ${b}R`, size: 30 * Math.min(2, Math.sqrt(b)) }, right: { label: m + ' kg', size: 10 }, force: 'W', dist: `R = ${b}R_E`, notes: ['g = GM/R²', `mass × ${a}, 1/R² × 1/${num(b * b)}`, `!W = ${fN(W0)} × ${num(f, 3)} = ${fN(W0 * f)}`] }),
      };
    },
  });

  // ---------- gravitation: numeric ----------
  gens.push({
    id: 'p1u2-gravitation', unit: 12, topic: 'Universal gravitation',
    make(rng) {
      const v = rng.pick(['pair', 'altitude', 'altitude']);
      if (v === 'pair') {
        const m1 = rng.int(1, 20) * 50, m2 = rng.int(1, 20) * 50, r = rnd(rng, 0.5, 4, 2);
        const F = (GRAV * m1 * m2) / (r * r);
        return {
          type: 'numeric',
          prompt: `Two lead spheres of mass ${Q(m1, KG)} and ${Q(m2, KG)} have centers ${Q(r, tx('m'))} apart. What is the gravitational force between them? Answer in N.`,
          given: giv(G.G), answer: sig(F, 3), units: 'N',
          steps: [
            `Newton's law of gravitation: ${M('F_g = \\frac{Gm_1m_2}{r^2}')}, with r measured center to center.`,
            `${M(`F_g = \\frac{(6.67\\times10^{-11})(${m1})(${m2})}{(${r})^2}`)}.`,
            `${M(`F_g = ${fmt(F)}\\ \\text{N}`)}: gravity between everyday objects is tiny; it only gets big when one mass is a planet.`,
            `${B(`F ≈ ${X(F)} N`)}, equal on each sphere (third law).`,
          ],
          visual: vis('d-gravity', { left: { label: m1 + ' kg', size: 14 + m1 / 40 }, right: { label: m2 + ' kg', size: 14 + m2 / 40 }, force: 'F_g', dist: 'r = ' + r + ' m', notes: ['F = Gm₁m₂/r²', '!F = ' + num(F) + ' N'] }),
        };
      }
      const hkm = rng.int(2, 60) * 100, r = R_EARTH + hkm * 1000;
      const gh = (GRAV * M_EARTH) / (r * r);
      return {
        type: 'numeric',
        prompt: `What is the gravitational field strength (free-fall acceleration) at an altitude of ${Q(hkm, tx('km'))} above Earth's surface? Answer in m/s².`,
        given: giv(G.G, G.Me, G.Re), answer: sig(gh, 3), units: 'm/s²',
        steps: [
          `${M('g = \\frac{GM}{r^2}')}, where r is measured from Earth's <i>center</i>: ${M(`r = R_E + h = 6.37\\times10^6 + ${fmt(hkm * 1000)} = ${fmt(r)}\\ \\text{m}`)}.`,
          `${M(`g = \\frac{(6.67\\times10^{-11})(5.97\\times10^{24})}{(${fmt(r)})^2}`)}.`,
          `${M(`g = ${fmt(gh)}\\ \\text{m/s}^2`)}, compared with 9.8 at the surface (ratio ${M(`(R_E/r)^2 = ${fmt(gh / 9.81, 3)}`)}).`,
          `${B(`g ≈ ${X(gh)} m/s²`)}. Using h alone instead of R + h is the classic mistake.`,
        ],
        visual: vis('d-gravity', { title: 'Gravity above Earth', left: { label: 'Earth', size: 60 }, right: { label: 'object', size: 8 }, force: 'F_g', dist: 'r = R_E + h', notes: ['g = GM/r², r from the center', `r = ${num(r)} m`, '!g = ' + fa(gh)] }),
      };
    },
  });

  // ---------- elevator ----------
  gens.push({
    id: 'p1u2-elevator', unit: 12, topic: 'Apparent weight (elevator)',
    make(rng) {
      const m = rng.int(10, 18) * 5, a = rnd(rng, 0.5, 3, 2);
      const vdir = rng.pick(['up', 'down']), speeding = rng() < 0.5;
      const aUp = (vdir === 'up') === speeding ? a : -a;
      const Nn = m * (g + aUp);
      const desc = `is moving ${vdir}ward and ${speeding ? 'speeding up' : 'slowing down'} at a rate of ${Q(a, MS2)}`;
      return {
        type: 'numeric',
        prompt: `A ${Q(m, KG)} student stands on a bathroom scale in an elevator that ${desc}. What does the scale read? Answer in N.`,
        given: giv(G.g), answer: sig(Nn, 3), units: 'N',
        steps: [
          `The scale reads the normal force N it pushes up with. First find the direction of ${M('a')}: ${speeding ? 'speeding up means a points the same way as v' : 'slowing down means a points opposite to v'}, so ${M('a')} points <b>${aUp > 0 ? 'up' : 'down'}</b>.`,
          `Second law with up as +: ${M(`N - mg = ma_y`)} → ${M('N = m(g + a_y)')}.`,
          `${M(`N = ${m}(9.8 ${aUp > 0 ? '+' : '-'} ${a}) = ${fmt(Nn)}\\ \\text{N}`)}, compared with the true weight ${M(`mg = ${fmt(m * g)}\\ \\text{N}`)}.`,
          `${B(`N ≈ ${X(Nn)} N`)}. Only the acceleration matters, not the direction of motion.`,
        ],
        visual: vis('d-elevator', { m, a: aUp, N: Nn, vdir, notes: [`moving ${vdir}, ${speeding ? 'speeding up' : 'slowing'}`, `→ a points ${aUp > 0 ? 'up' : 'down'}`, 'N − mg = ma', '!N = ' + fN(Nn)] }),
      };
    },
  });

  // ---------- incline ----------
  gens.push({
    id: 'p1u2-incline', unit: 12, topic: 'Inclined planes',
    make(rng) {
      const th = rng.pick([15, 20, 25, 30, 35, 40]), t = th * D2R;
      const v = rng.pick(['down', 'down', 'up']);
      let mu = rng() < 0.35 ? 0 : rnd(rng, 0.1, 0.45, 2);
      if (v === 'down' && mu > Math.tan(t) - 0.08) mu = Math.max(0, sig(Math.tan(t) * 0.5, 2));
      const m = rng.pick([2, 3, 5, 8, 10]);
      const s = Math.sin(t), c = Math.cos(t);
      const a = v === 'down' ? g * (s - mu * c) : g * (s + mu * c);
      const surface = mu ? `with coefficient of kinetic friction ${M('\\mu_k = ' + mu)}` : 'that is frictionless';
      const prompt = v === 'down'
        ? `A ${Q(m, KG)} block slides down a ${deg(th)} ramp ${surface}. What is the magnitude of its acceleration? Answer in m/s².`
        : `A ${Q(m, KG)} block is given a shove up a ${deg(th)} ramp ${surface}. While it is still sliding up, what is the magnitude of its acceleration? Answer in m/s².`;
      return {
        type: 'numeric', prompt, given: giv(G.g), answer: sig(a, 3), units: 'm/s²',
        steps: [
          `Tilt your axes: x along the ramp, y perpendicular. Gravity splits into ${M('mg\\sin\\theta')} down the slope and ${M('mg\\cos\\theta')} into the ramp.`,
          `Perpendicular: no acceleration, so ${M('N = mg\\cos\\theta')}${mu ? `, and friction is ${M('f = \\mu_k mg\\cos\\theta')}` : ''}.`,
          mu ? `Friction opposes the sliding, so it points ${v === 'down' ? 'up' : 'down'} the ramp: ${M(`a = g(\\sin\\theta ${v === 'down' ? '-' : '+'} \\mu_k\\cos\\theta) = 9.8(${fmt(s)} ${v === 'down' ? '-' : '+'} ${mu}\\cdot${fmt(c)})`)}.`
            : `With no friction: ${M(`a = g\\sin\\theta = 9.8\\sin ${th}^\\circ`)} (going up or down, it's the same).`,
          `${B(`a ≈ ${X(a)} m/s²`)}${v === 'up' ? ', directed down the ramp (it is slowing down).' : ', down the ramp.'} The mass cancels out.`,
        ],
        visual: vis('d-incline', { theta: th, mu, fric: mu ? (v === 'down' ? 'up' : 'down') : null, motion: v, notes: [`g sin θ = ${fa(g * s)}`, `N = mg cos θ`, mu ? `f = μ mg cos θ (${v === 'down' ? 'up' : 'down'} the slope)` : 'no friction', `!a = ${fa(a)}`] }),
      };
    },
  });

  // ---------- friction: static vs kinetic ----------
  gens.push({
    id: 'p1u2-friction', unit: 12, topic: 'Static vs kinetic friction',
    make(rng) {
      const m = rng.int(4, 30), muS = rnd(rng, 0.4, 0.8, 2), muK = sig(muS * rng.range(0.5, 0.85), 2);
      const Fmax = muS * m * g;
      const slides = rng() < 0.5;
      const F = sig(Fmax * (slides ? rng.range(1.12, 1.6) : rng.range(0.35, 0.88)), 2);
      const moves = F > Fmax;
      const f = moves ? muK * m * g : F;
      return {
        type: 'numeric',
        prompt: `A ${Q(m, KG)} crate sits at rest on a level floor (${M('\\mu_s = ' + muS)}, ${M('\\mu_k = ' + muK)}). You push horizontally with ${Q(F, N_)}. What is the magnitude of the friction force on the crate? Answer in N.`,
        given: giv(G.g), answer: sig(f, 3), units: 'N',
        steps: [
          `First ask: does it move? Static friction can hold up to ${M(`f_{s,\\max} = \\mu_s mg = ${muS}(${m})(9.8) = ${fmt(Fmax)}\\ \\text{N}`)}.`,
          moves ? `Your push (${F} N) is bigger than ${fmt(Fmax)} N, so the crate breaks free and slides.` : `Your push (${F} N) is less than ${fmt(Fmax)} N, so the crate stays put.`,
          moves ? `Sliding means kinetic friction: ${M(`f_k = \\mu_k mg = ${muK}(${m})(9.8) = ${fmt(f)}\\ \\text{N}`)}.` : `Static friction only pushes as hard as needed to cancel your push: ${M(`f_s = F = ${F}\\ \\text{N}`)}, not the maximum.`,
          `${B(`f ≈ ${X(f)} N`)}. ${moves ? 'Using μs for a sliding object is the usual slip.' : 'Answering μs·mg here is the usual slip: that is only the limit.'}`,
        ],
        visual: vis('d-fbd', {
          title: moves ? 'Crate sliding: kinetic friction' : 'Crate at rest: static friction',
          forces: [fNorm(m * g), fW(m * g), fA(F, 0, 'push ' + F + ' N'), fF(f, 180, 'f = ' + fN(f))],
          acc: moves ? { ang: 0, label: 'a' } : null,
          notes: [`f_s,max = μs·mg = ${fN(Fmax)}`, `push = ${F} N → ${moves ? 'slides' : 'stays at rest'}`, moves ? `f_k = μk·mg` : 'f_s = push (just enough)', `!f = ${fN(f)}`],
        }),
      };
    },
  });

  gens.push({
    id: 'p1u2-friction-concept', unit: 12, topic: 'Friction (concept)',
    make(rng) {
      const kind = rng.pick(['truck', 'area', 'walk', 'keepgoing', 'sliding']);
      let prompt, correct, wrongs, steps, visual;
      if (kind === 'truck') {
        prompt = `A box rides in the bed of a pickup truck that is speeding up forward. The box does not slide. What force makes the box speed up, and which way does it point?`;
        correct = 'Static friction from the truck bed, pointing forward';
        wrongs = ['Kinetic friction from the truck bed, pointing backward', 'Static friction from the truck bed, pointing backward', 'No horizontal force is needed, because the box is at rest relative to the truck'];
        steps = [`The box accelerates forward with the truck, so a net forward force must act on it.`, `The only thing touching it horizontally is the truck bed. The box doesn't slip, so it's <b>static</b> friction.`, `Friction opposes <i>relative</i> slipping: without it the box would slide backward relative to the bed, so friction points forward.`, `${B('Static friction, forward')}.`];
        visual = vis('d-fbd', { title: 'Box on an accelerating truck bed', forces: [fNorm(1), fW(1), fF(0.45, 0, 'f_s (forward)')], acc: { ang: 0, label: 'a' }, notes: ['Box would slip backward without friction', '!Static friction points forward'] });
      } else if (kind === 'area') {
        prompt = `A brick slides across a floor on its large face. It is flipped onto its narrow side (one-third the contact area) and slid again at the same speed. How does the kinetic friction force change?`;
        correct = 'It stays the same';
        wrongs = ['It becomes one-third as large', 'It becomes three times as large', 'It becomes nine times as large'];
        steps = [`Kinetic friction is ${M('f_k = \\mu_k N')}.`, `Flipping the brick doesn't change its weight, so on a level floor ${M('N = mg')} is unchanged.`, `${M('\\mu_k')} depends on the two surfaces' materials, not on the contact area (to a good approximation).`, `${B('Same friction')}.`];
        visual = vis('d-fbd', { title: 'f = μN: no area in the formula', forces: [fNorm(1), fW(1), fF(0.4, 180)], acc: { ang: 0, label: 'v' }, notes: ['N = mg either way', 'μk depends only on the materials', '!Friction unchanged'] });
      } else if (kind === 'walk') {
        prompt = `As you walk forward at a steady pace, which way does the friction force from the ground on your planted foot point?`;
        correct = 'Forward';
        wrongs = ['Backward', 'Straight up', 'There is no friction on a planted foot'];
        steps = [`To step, your foot pushes backward on the ground.`, `Without friction (ice) your foot would slip backward, so friction opposes that and points forward.`, `That forward friction (a third-law partner of your backward push) is what moves you along.`, `${B('Forward')}: friction doesn't always point backward; it opposes slipping between surfaces.`];
        visual = vis('d-fbd', { title: 'Forces on a walker\'s planted foot', forces: [fNorm(1), fW(1), fF(0.4, 0, 'f (forward)')], notes: ['Foot pushes back on the ground', '!Ground pushes the foot forward'] });
      } else if (kind === 'keepgoing') {
        prompt = `You push a heavy couch across a floor. Once it starts sliding, the push needed to keep it moving at constant speed is…`;
        correct = 'Less than the push needed to get it started';
        wrongs = ['More than the push needed to get it started', 'The same as the push needed to get it started', 'Zero, because a moving object needs no force'];
        steps = [`To start it you must beat maximum static friction, ${M('\\mu_s N')}.`, `Once sliding, kinetic friction ${M('\\mu_k N')} acts, and ${M('\\mu_k < \\mu_s')} for almost all surfaces.`, `Constant speed means your push equals kinetic friction (first law), which is smaller.`, `${B('Less')}.`];
        visual = vis('d-fbd', { title: 'Couch sliding at constant speed', forces: [fNorm(1), fW(1), fA(0.35, 0, 'push = f_k'), fF(0.35, 180, 'f_k')], notes: ['To start: push > μs·N', 'To keep going: push = μk·N', '!μk < μs → less push'] });
      } else {
        prompt = `A box slides to the left across the floor while you push on it toward the right, so it is slowing down. Which way does kinetic friction on the box point?`;
        correct = 'To the right';
        wrongs = ['To the left', 'Opposite to your push', 'It points whichever way the net force points'];
        steps = [`Kinetic friction always opposes the direction of <b>sliding</b> relative to the surface.`, `The box slides left, so friction points right, no matter which way you push.`, `Here friction and your push both point right, and both slow the box down.`, `${B('Right')}.`];
        visual = vis('d-fbd', { title: 'Box sliding left, being slowed', forces: [fNorm(1), fW(1), fA(0.5, 0, 'push'), fF(0.4, 0, 'f_k')], acc: { ang: 0, label: 'a' }, notes: ['Sliding to the left', 'Friction opposes sliding → right', '!Both forces point right'] });
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });

  // ---------- springs ----------
  gens.push({
    id: 'p1u2-hooke', unit: 12, topic: "Hooke's law",
    make(rng) {
      const v = rng.pick(['x', 'k']);
      if (v === 'x') {
        const k = rng.int(5, 60) * 10, m = rnd(rng, 0.2, 3, 2);
        const x = (m * g) / k;
        return {
          type: 'numeric',
          prompt: `A ${Q(m, KG)} mass hangs at rest from a vertical spring with spring constant ${Q(k, NM)}. How far is the spring stretched? Answer in cm.`,
          given: giv(G.g), answer: sig(x * 100, 3), units: 'cm',
          steps: [
            `At rest, the spring force balances the weight (first law): ${M('k\\Delta x = mg')}.`,
            `Hooke's law ${M('|F_s| = k|\\Delta x|')}: the stretch grows in proportion to the force.`,
            `${M(`\\Delta x = \\frac{mg}{k} = \\frac{${m}(9.8)}{${k}} = ${fmt(x)}\\ \\text{m}`)}.`,
            `${B(`Δx ≈ ${X(x * 100)} cm`)}.`,
          ],
          visual: vis('d-spring', { mode: 'single', m, notes: ['At rest: kΔx = mg', `k = ${k} N/m`, `!Δx = ${num(x * 100)} cm`] }),
        };
      }
      const F = rng.int(2, 30) * 2, xcm = rng.int(2, 25);
      const k = F / (xcm / 100);
      return {
        type: 'numeric',
        prompt: `A force of ${Q(F, N_)} stretches a spring ${Q(xcm, CM)} from its natural length. What is the spring constant? Answer in N/m.`,
        answer: sig(k, 3), units: 'N/m',
        steps: [
          `Hooke's law: ${M('F = k\\Delta x')}, so ${M('k = F/\\Delta x')}.`,
          `Convert the stretch to meters: ${M(`${xcm}\\ \\text{cm} = ${fmt(xcm / 100)}\\ \\text{m}`)}.`,
          `${M(`k = \\frac{${F}}{${fmt(xcm / 100)}} = ${fmt(k)}\\ \\text{N/m}`)}. It is the slope of a force-vs-stretch graph.`,
          `${B(`k ≈ ${X(k)} N/m`)}. Forgetting the cm → m conversion gives an answer 100× too small.`,
        ],
        visual: vis('d-spring', { mode: 'single', notes: ['F = kΔx', `F = ${F} N, Δx = ${xcm / 100} m`, `!k = ${num(k)} N/m`] }),
      };
    },
  });

  gens.push({
    id: 'p1u2-springs-combo', unit: 12, topic: 'Springs in series & parallel',
    make(rng) {
      const mode = rng.pick(['series', 'parallel']);
      const k = rng.int(5, 40) * 10, m = rnd(rng, 0.5, 4, 2);
      const keff = mode === 'series' ? k / 2 : 2 * k;
      const x = (m * g) / keff;
      return {
        type: 'numeric',
        prompt: `Two identical springs, each with ${M(`k = ${k}\\ \\text{N/m}`)}, are connected ${mode === 'series' ? 'end to end (in series)' : 'side by side (in parallel)'} and a ${Q(m, KG)} mass hangs from them at rest. How far does the mass hang below where it would be with the springs unstretched? Answer in cm.`,
        given: giv(G.g), answer: sig(x * 100, 3), units: 'cm',
        steps: [
          mode === 'series' ? `In series, <b>each</b> spring carries the full weight mg, so each stretches ${M('mg/k')}, and the total stretch is twice that.` : `In parallel, the two springs <b>share</b> the weight, mg/2 each, and stretch the same amount.`,
          mode === 'series' ? `Equivalent: ${M('\\frac{1}{k_{eff}} = \\frac1k + \\frac1k')} → ${M(`k_{eff} = k/2 = ${fmt(keff)}\\ \\text{N/m}`)} (softer).` : `Equivalent: ${M(`k_{eff} = k + k = ${fmt(keff)}\\ \\text{N/m}`)} (stiffer).`,
          `${M(`\\Delta x = \\frac{mg}{k_{eff}} = \\frac{${m}(9.8)}{${fmt(keff)}} = ${fmt(x)}\\ \\text{m}`)}.`,
          `${B(`Δx ≈ ${X(x * 100)} cm`)}. (Note: springs combine the opposite way from resistors.)`,
        ],
        visual: vis('d-spring', { mode, m, notes: [mode === 'series' ? 'Each spring holds mg → stretches add' : 'Springs share mg → same stretch', `k_eff = ${num(keff)} N/m`, `!Δx = ${num(x * 100)} cm`] }),
      };
    },
  });

  // ---------- connected blocks ----------
  gens.push({
    id: 'p1u2-blocks', unit: 12, topic: 'Connected objects (contact force & tension)',
    make(rng) {
      const mode = rng.pick(['push', 'pull']);
      let mA = rng.int(1, 10), mB = rng.int(1, 10);
      const F = rng.int(2, 15) * 4;
      const a = F / (mA + mB);
      const P = mode === 'push' ? mB * a : mA * a;
      const prompt = mode === 'push'
        ? `Blocks A (${Q(mA, KG)}) and B (${Q(mB, KG)}) sit side by side on a frictionless floor. A horizontal force of ${Q(F, N_)} pushes on A, which pushes B ahead of it. What is the force A exerts on B? Answer in N.`
        : `Blocks A (${Q(mA, KG)}) and B (${Q(mB, KG)}) on a frictionless floor are tied together by a light string. A horizontal force of ${Q(F, N_)} pulls B forward, and B drags A behind it. What is the tension in the string between them? Answer in N.`;
      return {
        type: 'numeric', prompt, answer: sig(P, 3), units: 'N',
        steps: [
          `Treat both blocks as one system: the force between them is internal, so ${M(`a = \\frac{F}{m_A + m_B} = \\frac{${F}}{${mA + mB}} = ${fmt(a)}\\ \\text{m/s}^2`)}.`,
          `Now isolate the block that is pushed or pulled only by the connecting force: ${mode === 'push' ? 'B' : 'A'} (mass ${mode === 'push' ? mB : mA} kg).`,
          `${M(`${mode === 'push' ? 'P' : 'T'} = m_${mode === 'push' ? 'B' : 'A'}\\,a = ${mode === 'push' ? mB : mA}(${fmt(a)}) = ${fmt(P)}\\ \\text{N}`)}.`,
          `${B(`${mode === 'push' ? 'P' : 'T'} ≈ ${X(P)} N`)}, less than ${F} N, because it only accelerates part of the system.`,
        ],
        visual: vis('d-blocks', { mode, mA, mB, F, a, contact: P, notes: ['System: a = F/(mA + mB)', `a = ${fa(a)}`, `${mode === 'push' ? 'B' : 'A'} alone: ${mode === 'push' ? 'P' : 'T'} = m·a`, `!${mode === 'push' ? 'P' : 'T'} = ${fN(P)}`] }),
      };
    },
  });

  // ---------- Atwood ----------
  gens.push({
    id: 'p1u2-atwood', unit: 12, topic: 'Atwood machine',
    make(rng) {
      const table = rng() < 0.5;
      const ask = rng.pick(['a', 'T']);
      if (!table) {
        let m1 = rnd(rng, 1, 8, 2), m2 = rnd(rng, 1, 8, 2);
        if (Math.abs(m1 - m2) < 0.4) m2 = sig(m1 + 1.5, 2);
        const a = (Math.abs(m2 - m1) * g) / (m1 + m2), T = (2 * m1 * m2 * g) / (m1 + m2);
        const hi = Math.max(m1, m2), lo = Math.min(m1, m2);
        return {
          type: 'numeric', topic: 'Atwood machine',
          prompt: `Masses of ${Q(m1, KG)} and ${Q(m2, KG)} hang from the two ends of a light string over a frictionless pulley and are released. What is ${ask === 'a' ? 'the magnitude of their acceleration? Answer in m/s².' : 'the tension in the string? Answer in N.'}`,
          given: giv(G.g), answer: sig(ask === 'a' ? a : T, 3), units: ask === 'a' ? 'm/s²' : 'N',
          steps: [
            `Whole system: the heavier side's weight minus the lighter side's weight drives both masses: ${M(`a = \\frac{(m_{big} - m_{small})g}{m_1 + m_2} = \\frac{(${hi} - ${lo})(9.8)}{${fmt(m1 + m2)}} = ${fmt(a)}\\ \\text{m/s}^2`)}.`,
            `Isolate the lighter mass (it accelerates up): ${M('T - m_{small}g = m_{small}a')}.`,
            `${M(`T = ${lo}(9.8 + ${fmt(a)}) = ${fmt(T)}\\ \\text{N}`)}, between the two weights (${fmt(lo * g)} N and ${fmt(hi * g)} N).`,
            `${B(ask === 'a' ? `a ≈ ${X(a)} m/s²` : `T ≈ ${X(T)} N`)}. ${ask === 'T' ? 'T is not just the weight of either mass, because both are accelerating.' : ''}`,
          ],
          visual: vis('d-atwood', { m1, m2, a, T, notes: [`a = (m_big − m_small)g / (m₁ + m₂)`, `a = ${fa(a)}`, `T = m_small(g + a) = ${fN(T)}`, `!${ask === 'a' ? 'a = ' + fa(a) : 'T = ' + fN(T)}`] }),
        };
      }
      let Mb, m, mu, a;
      for (let i = 0; i < 30; i++) {
        Mb = rnd(rng, 1, 10, 2); m = rnd(rng, 0.5, 5, 2); mu = rng() < 0.4 ? 0 : rnd(rng, 0.1, 0.4, 2);
        a = (m * g - mu * Mb * g) / (Mb + m);
        if (a > 0.3) break;
      }
      if (!(a > 0)) { Mb = 4; m = 2; mu = 0.2; a = (m * g - mu * Mb * g) / (Mb + m); }
      const T = m * (g - a);
      return {
        type: 'numeric', topic: 'Modified Atwood machine',
        prompt: `A ${Q(Mb, KG)} block on a horizontal table${mu ? ` (${M('\\mu_k = ' + mu)})` : ' (frictionless)'} is tied by a light string over a pulley at the table's edge to a ${Q(m, KG)} mass hanging below. What is ${ask === 'a' ? 'the magnitude of the acceleration? Answer in m/s².' : 'the tension in the string? Answer in N.'}`,
        given: giv(G.g), answer: sig(ask === 'a' ? a : T, 3), units: ask === 'a' ? 'm/s²' : 'N',
        steps: [
          `System (both blocks, along the string): the hanging weight ${M('mg')} drives it${mu ? `, table friction ${M('\\mu_k Mg')} resists it` : ''}.`,
          `${M(`a = \\frac{mg ${mu ? '- \\mu_k Mg' : ''}}{M + m} = \\frac{${m}(9.8)${mu ? ` - ${mu}(${Mb})(9.8)` : ''}}{${fmt(Mb + m)}} = ${fmt(a)}\\ \\text{m/s}^2`)}.`,
          `Isolate the hanging mass: ${M('mg - T = ma')} → ${M(`T = ${m}(9.8 - ${fmt(a)}) = ${fmt(T)}\\ \\text{N}`)}.`,
          `${B(ask === 'a' ? `a ≈ ${X(a)} m/s²` : `T ≈ ${X(T)} N`)}. T is less than the hanging weight (${fmt(m * g)} N), or the mass couldn't accelerate down.`,
        ],
        visual: vis('d-atwood', { table: true, M: Mb, m, mu, a, T, notes: [`a = (mg${mu ? ' − μMg' : ''})/(M + m)`, `a = ${fa(a)}`, `T = m(g − a) = ${fN(T)}`, `!${ask === 'a' ? 'a = ' + fa(a) : 'T = ' + fN(T)}`] }),
      };
    },
  });

  // ---------- circular: curves ----------
  gens.push({
    id: 'p1u2-curve', unit: 12, topic: 'Circular motion (curves)',
    make(rng) {
      const v = rng.pick(['vmax', 'force', 'banked']);
      if (v === 'vmax') {
        const mu = rnd(rng, 0.3, 0.9, 2), r = rng.int(2, 30) * 5;
        const vm = Math.sqrt(mu * g * r);
        return {
          type: 'numeric',
          prompt: `A car rounds a flat (unbanked) curve of radius ${Q(r, tx('m'))}. The coefficient of static friction between the tires and road is ${mu}. What is the maximum speed at which the car can take the curve without skidding? Answer in m/s.`,
          given: giv(G.g), answer: sig(vm, 3), units: 'm/s',
          steps: [
            `On a flat curve, the only horizontal force is static friction toward the center. It must supply the centripetal force: ${M('f_s = \\frac{mv^2}{r}')}.`,
            `The most friction available is ${M('\\mu_s N = \\mu_s mg')}. Set ${M('\\frac{mv^2}{r} = \\mu_s mg')}: the mass cancels.`,
            `${M(`v_{max} = \\sqrt{\\mu_s g r} = \\sqrt{${mu}(9.8)(${r})} = ${fmt(vm)}\\ \\text{m/s}`)}.`,
            `${B(`v_max ≈ ${X(vm)} m/s`)}. There is no outward "centrifugal" force in the free-body diagram.`,
          ],
          visual: vis('d-circular', { title: 'Car on a flat curve (top view)', view: 'top', at: 'right', rLabel: 'r = ' + r + ' m', forces: [fF(1, 180, 'f_s (to center)')], notes: ['Friction is the centripetal force', 'μs·mg = mv²/r', `!v_max = √(μs g r) = ${fv(vm)}`] }),
        };
      }
      if (v === 'force') {
        const m = rng.int(8, 20) * 100, sp = rng.int(8, 25), r = rng.int(3, 30) * 5;
        const F = (m * sp * sp) / r;
        return {
          type: 'numeric',
          prompt: `A ${Q(m, KG)} car drives around a flat circular curve of radius ${Q(r, tx('m'))} at a steady ${Q(sp, MS)}. How large is the friction force from the road on the car? Answer in N.`,
          answer: sig(F, 3), units: 'N',
          steps: [
            `Constant speed in a circle still means acceleration: ${M('a_c = v^2/r')}, pointing to the center.`,
            `${M(`a_c = ${sp}^2/${r} = ${fmt((sp * sp) / r)}\\ \\text{m/s}^2`)}.`,
            `Friction is the only horizontal force, so it is the net (centripetal) force: ${M(`f = ma_c = ${m}(${fmt((sp * sp) / r)}) = ${fmt(F)}\\ \\text{N}`)}.`,
            `${B(`f ≈ ${X(F)} N`)}, pointing toward the center of the curve.`,
          ],
          visual: vis('d-circular', { title: 'Car on a flat curve (top view)', view: 'top', at: 'right', rLabel: 'r = ' + r + ' m', vLabel: 'v = ' + sp + ' m/s', forces: [fF(1, 180, 'f')], notes: ['a_c = v²/r toward the center', `a_c = ${fa((sp * sp) / r)}`, `!f = m·a_c = ${fN(F)}`] }),
        };
      }
      const th = rng.pick([10, 15, 20, 25, 30, 35]), r = rng.int(5, 40) * 10;
      const vb = Math.sqrt(g * r * Math.tan(th * D2R));
      return {
        type: 'numeric',
        prompt: `A highway curve of radius ${Q(r, tx('m'))} is banked at ${deg(th)}. At what speed can a car take the curve with no friction needed at all? Answer in m/s.`,
        given: giv(G.g), answer: sig(vb, 3), units: 'm/s',
        steps: [
          `With no friction, only gravity and the normal force act. The normal force tilts toward the center, and its horizontal part provides the centripetal force.`,
          `Vertical: ${M('N\\cos\\theta = mg')}. Horizontal: ${M('N\\sin\\theta = mv^2/r')}.`,
          `Divide: ${M('\\tan\\theta = \\frac{v^2}{gr}')} → ${M(`v = \\sqrt{gr\\tan\\theta} = \\sqrt{9.8(${r})\\tan ${th}^\\circ} = ${fmt(vb)}\\ \\text{m/s}`)}.`,
          `${B(`v ≈ ${X(vb)} m/s`)}, independent of the car's mass.`,
        ],
        visual: vis('d-fbd', { title: 'Car on a banked curve (from behind)', forces: [fNorm(1 / Math.cos(th * D2R), 'N', 90 + th), fW(1)], acc: { ang: 180, label: 'a_c (to center)' }, notes: ['N tilts toward the center', 'N cos θ = mg', 'N sin θ = mv²/r', `!v = √(g r tan θ) = ${fv(vb)}`] }),
      };
    },
  });

  // ---------- circular: vertical circles ----------
  gens.push({
    id: 'p1u2-vertical-circle', unit: 12, topic: 'Vertical circles',
    make(rng) {
      const v = rng.pick(['loopmin', 'bottom', 'top', 'hump']);
      const R = (r) => Q(r, tx('m'));
      if (v === 'loopmin') {
        const r = rnd(rng, 2, 20, 2), vm = Math.sqrt(g * r);
        return {
          type: 'numeric',
          prompt: `A roller-coaster car goes around a vertical loop of radius ${R(r)}. What is the minimum speed it must have at the top so that it just stays on the track? Answer in m/s.`,
          given: giv(G.g), answer: sig(vm, 3), units: 'm/s',
          steps: [
            `At the top, both gravity and the track's normal force point down, toward the center: ${M('N + mg = mv^2/r')}.`,
            `The slowest possible speed is when the track barely touches the car: ${M('N = 0')}, so gravity alone supplies the centripetal force.`,
            `${M(`mg = \\frac{mv^2}{r} \\Rightarrow v = \\sqrt{gr} = \\sqrt{9.8(${r})} = ${fmt(vm)}\\ \\text{m/s}`)}.`,
            `${B(`v_min ≈ ${X(vm)} m/s`)}. Slower than this and the car falls inward off the track.`,
          ],
          visual: vis('d-circular', { title: 'Top of a loop at minimum speed', view: 'side', at: 'top', rLabel: 'r = ' + r + ' m', forces: [fW(1)], notes: ['At the top: N + mg = mv²/r', 'Minimum speed → N = 0', `!v = √(g r) = ${fv(vm)}`] }),
        };
      }
      const m = rnd(rng, 0.2, 3, 2);
      if (v === 'bottom') {
        const r = rnd(rng, 0.5, 2, 2), sp = rnd(rng, 2, 8, 2);
        const T = m * (g + (sp * sp) / r);
        return {
          type: 'numeric',
          prompt: `A ${Q(m, KG)} ball on a string is swung in a vertical circle of radius ${R(r)}. At the lowest point it moves at ${Q(sp, MS)}. What is the tension in the string there? Answer in N.`,
          given: giv(G.g), answer: sig(T, 3), units: 'N',
          steps: [
            `At the bottom, the center is <i>up</i>. Tension points up (toward the center) and gravity points down.`,
            `Net force toward the center: ${M('T - mg = \\frac{mv^2}{r}')}.`,
            `${M(`T = m\\left(g + \\frac{v^2}{r}\\right) = ${m}\\left(9.8 + \\frac{${sp}^2}{${r}}\\right) = ${fmt(T)}\\ \\text{N}`)}.`,
            `${B(`T ≈ ${X(T)} N`)}: more than the weight (${fmt(m * g)} N), because the net force must point up.`,
          ],
          visual: vis('d-circular', { title: 'Ball on a string at the bottom', view: 'side', at: 'bottom', rLabel: 'r', forces: [fT(T, 90, 'T'), fW(m * g)], notes: ['Center is up', 'T − mg = mv²/r', `!T = ${fN(T)}`] }),
        };
      }
      if (v === 'top') {
        let r, sp;
        for (let i = 0; i < 20; i++) { r = rnd(rng, 0.5, 2, 2); sp = rnd(rng, 3, 9, 2); if ((sp * sp) / r > g * 1.3) break; }
        if (!((sp * sp) / r > g)) { r = 1; sp = 5; }
        const T = m * ((sp * sp) / r - g);
        return {
          type: 'numeric',
          prompt: `A ${Q(m, KG)} ball on a string is swung in a vertical circle of radius ${R(r)}. At the highest point it moves at ${Q(sp, MS)}. What is the tension in the string there? Answer in N.`,
          given: giv(G.g), answer: sig(T, 3), units: 'N',
          steps: [
            `At the top, the center is <i>down</i>. Tension and gravity both point down, toward the center.`,
            `${M('T + mg = \\frac{mv^2}{r}')}.`,
            `${M(`T = m\\left(\\frac{v^2}{r} - g\\right) = ${m}\\left(\\frac{${sp}^2}{${r}} - 9.8\\right) = ${fmt(T)}\\ \\text{N}`)}.`,
            `${B(`T ≈ ${X(T)} N`)}. Gravity does part of the centripetal job, so the string pulls less than at the bottom.`,
          ],
          visual: vis('d-circular', { title: 'Ball on a string at the top', view: 'side', at: 'top', rLabel: 'r', forces: [fT(T, 270, 'T'), fW(m * g)], notes: ['Center is down', 'T + mg = mv²/r', `!T = ${fN(T)}`] }),
        };
      }
      let r, sp;
      for (let i = 0; i < 20; i++) { r = rng.int(5, 40); sp = rnd(rng, 4, 18, 2); if ((sp * sp) / r < g * 0.8) break; }
      if (!((sp * sp) / r < g)) { r = 20; sp = 10; }
      const mc_ = rng.int(8, 16) * 100;
      const Nn = mc_ * (g - (sp * sp) / r);
      return {
        type: 'numeric',
        prompt: `A ${Q(mc_, KG)} car drives over the top of a rounded hill whose radius of curvature is ${R(r)}, moving at ${Q(sp, MS)}. What normal force does the road exert on the car at the top? Answer in N.`,
        given: giv(G.g), answer: sig(Nn, 3), units: 'N',
        steps: [
          `At the crest, the center of the circle is <i>below</i> the car. The net force must point down.`,
          `${M('mg - N = \\frac{mv^2}{r}')}.`,
          `${M(`N = m\\left(g - \\frac{v^2}{r}\\right) = ${mc_}\\left(9.8 - \\frac{${sp}^2}{${r}}\\right) = ${fmt(Nn)}\\ \\text{N}`)}.`,
          `${B(`N ≈ ${X(Nn)} N`)}, less than mg: riders feel lighter over a hump. If ${M('v^2/r')} reached g, the car would leave the road.`,
        ],
        visual: vis('d-circular', { title: 'Car over the crest of a hill', view: 'side', at: 'top', rLabel: 'r = ' + r + ' m', forces: [fNorm(Nn), fW(mc_ * g)], notes: ['Center is below', 'mg − N = mv²/r', `!N = ${fN(Nn)}`] }),
      };
    },
  });

  // ---------- circular: concept / scaling ----------
  gens.push({
    id: 'p1u2-circular-concept', unit: 12, topic: 'Circular motion (concept)',
    make(rng) {
      const kind = rng.pick(['scale', 'scale', 'cut', 'direction', 'centrifugal']);
      let prompt, correct, wrongs, steps, visual;
      if (kind === 'scale') {
        let s, c;
        do { s = rng.pick([1, 2, 3, 0.5]); c = rng.pick([1, 2, 0.5, 3]); } while (s === 1 && c === 1);
        const F0 = rng.int(2, 30) * 10;
        const opt = (f) => M(fmt(F0 * f, 3) + '\\ \\text{N}');
        const f = (s * s) / c;
        const sw = { 1: 'the same speed', 2: 'twice the speed', 3: 'three times the speed', 0.5: 'half the speed' }[s];
        const cw = { 1: 'the same radius', 2: 'twice the radius', 3: 'three times the radius', 0.5: 'half the radius' }[c];
        prompt = `An object moving in a circle needs a centripetal force of ${Q(F0, N_)}. If it moves at ${sw} on a circle of ${cw}, what centripetal force does it need?`;
        correct = opt(f);
        wrongs = [opt(s / c), opt(s * s * c), opt(s / (c * c)), opt(s * c), opt(c / (s * s)), opt(f * 2), opt(f / 2), opt(f * 4), opt(f / 4), opt(1)];
        steps = [`${M('F_c = \\frac{mv^2}{r}')}: proportional to the speed <b>squared</b>, inversely proportional to the radius.`, `Speed factor ${s}: ${M(`v^2 \\times ${fmt(s * s)}`)}. Radius factor ${c}: ${M(`\\times \\tfrac{1}{${c}}`)}.`, `${M(`F' = ${F0} \\times \\frac{${fmt(s * s)}}{${c}} = ${fmt(F0 * f)}\\ \\text{N}`)}.`, `${B(`${X(F0 * f)} N`)}.`];
        visual = vis('d-circular', { title: 'Centripetal force scaling', view: 'top', at: 'right', rLabel: `r × ${c}`, vLabel: `v × ${s}`, forces: [{ label: 'F_c', ang: 180, mag: 1, c: 'pos' }], notes: ['F_c = mv²/r', `v² × ${num(s * s)}, 1/r × ${num(1 / c)}`, `!F_c = ${num(F0 * f)} N`] });
      } else if (kind === 'cut') {
        prompt = `A ball is whirled in a horizontal circle on a string. At the moment the ball is at the rightmost point of the circle, moving straight "up the page", the string snaps. Viewed from above, what path does the ball take?`;
        correct = 'A straight line continuing "up the page" (tangent to the circle)';
        wrongs = ['A straight line pointing away from the center (to the right)', 'A curved path that keeps bending around the circle', 'A straight line pointing toward the center'];
        steps = [`While the string pulls, it keeps bending the ball's path toward the center.`, `When it snaps, there's no more horizontal force (first law), so the velocity stops changing.`, `The ball keeps the velocity it had at that instant, which is tangent to the circle.`, `${B('Tangent line')}: there was never an outward force to fling it outward.`];
        visual = vis('d-circular', { title: 'String snaps: the ball goes straight', view: 'top', at: 'right', forces: [], vLabel: 'v (keeps going)', notes: ['No force → no change in velocity', '!Path continues along the tangent'] });
      } else if (kind === 'direction') {
        prompt = `A car drives around a circular track at a constant speed. Which way does its acceleration point?`;
        correct = 'Toward the center of the circle';
        wrongs = ['There is no acceleration, because the speed is constant', 'Forward, along the direction of motion', 'Away from the center of the circle'];
        steps = [`Acceleration is any change in <i>velocity</i>, and velocity includes direction.`, `The direction keeps turning toward the center, so the velocity change points inward.`, `${M('a_c = v^2/r')}, directed to the center.`, `${B('Toward the center')}.`];
        visual = vis('d-circular', { title: 'Uniform circular motion', view: 'top', at: 'right', forces: [{ label: 'a', ang: 180, mag: 1, c: 'accent' }], notes: ['Speed constant, direction changing', '!a points to the center'] });
      } else {
        prompt = `A rider in a car going around a sharp left turn feels pressed against the right-hand door. Which statement is correct?`;
        correct = 'The door pushes the rider toward the center (left); the rider\'s body would otherwise keep going straight';
        wrongs = ['A centrifugal force pushes the rider outward (right)', 'The rider\'s inertia exerts a rightward force on the door, so the net force on the rider is to the right', 'No forces act on the rider horizontally'];
        steps = [`From the ground, the rider's body tends to keep moving in a straight line (first law).`, `The car turns left under them, so the door runs into the rider.`, `The door then pushes the rider <b>left</b>, toward the center: that's the centripetal force on the rider.`, `${B('The door pushes inward')}. "Centrifugal force" is only the feeling of inertia in a turning car.`];
        visual = vis('d-circular', { title: 'Rider in a left turn (top view)', view: 'top', at: 'right', forces: [{ label: 'N from door', ang: 180, mag: 1, c: 'accent' }], notes: ['Only real force: the door, pushing inward', '!No outward force in the FBD'] });
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });

  // ---------- orbits ----------
  gens.push({
    id: 'p1u2-orbit', unit: 12, topic: 'Orbits',
    make(rng) {
      const hkm = rng.int(2, 40) * 100, r = R_EARTH + hkm * 1000;
      const v = Math.sqrt((GRAV * M_EARTH) / r);
      const ask = rng.pick(['v', 'v', 'T']);
      const Tm = (2 * Math.PI * r) / v / 60;
      return {
        type: 'numeric',
        prompt: `A satellite is in a circular orbit ${Q(hkm, tx('km'))} above Earth's surface. ${ask === 'v' ? 'What is its orbital speed? Answer in m/s.' : 'How long does it take to go around once? Answer in minutes.'}`,
        given: giv(G.G, G.Me, G.Re), answer: sig(ask === 'v' ? v : Tm, 3), units: ask === 'v' ? 'm/s' : 'min',
        steps: [
          `Gravity is the centripetal force: ${M('\\frac{GMm}{r^2} = \\frac{mv^2}{r}')} → ${M('v = \\sqrt{GM/r}')}. The satellite's mass cancels.`,
          `Orbit radius from Earth's center: ${M(`r = R_E + h = ${fmt(r)}\\ \\text{m}`)}.`,
          `${M(`v = \\sqrt{\\frac{(6.67\\times10^{-11})(5.97\\times10^{24})}{${fmt(r)}}} = ${fmt(v)}\\ \\text{m/s}`)}${ask === 'T' ? `, and ${M(`T = \\frac{2\\pi r}{v} = ${fmt(Tm * 60)}\\ \\text{s}`)}` : ''}.`,
          `${B(ask === 'v' ? `v ≈ ${X(v)} m/s` : `T ≈ ${X(Tm)} min`)}. Higher orbits are slower.`,
        ],
        visual: vis('d-circular', { title: 'Satellite in circular orbit', view: 'top', at: 'right', planet: 'Earth', rLabel: 'r = R_E + h', forces: [{ label: 'F_g', ang: 180, mag: 1, c: 'pos' }], notes: ['Gravity = centripetal force', 'GMm/r² = mv²/r', `v = √(GM/r) = ${fv(v)}`, `!${ask === 'v' ? 'v = ' + fv(v) : 'T = ' + num(Tm) + ' min'}`] }),
      };
    },
  });

  // ---------- free-body diagrams ----------
  gens.push({
    id: 'p1u2-fbd', unit: 12, topic: 'Free-body diagrams',
    make(rng) {
      const kind = rng.pick(['thrown', 'upramp', 'wall', 'hanging', 'curve']);
      let prompt, correct, wrongs, steps, visual;
      if (kind === 'thrown') {
        prompt = `A ball has been thrown straight up and is still rising. Ignoring air resistance, which forces act on it?`;
        correct = 'Only gravity, pointing down';
        wrongs = ['Gravity down, and the force of the throw pointing up', 'Gravity down, and an upward force that shrinks as it rises', 'No forces at all until it reaches the top'];
        steps = [`List only forces from things touching the ball, plus gravity.`, `Once it leaves your hand, nothing touches it. The "force of the throw" stopped when contact ended.`, `It moves up because of the velocity it already has; gravity slows it down.`, `${B('Only gravity')}.`];
        visual = vis('d-fbd', { title: 'Ball rising after the throw', ball: true, forces: [fW(1)], acc: { ang: 270, label: 'a = g' }, notes: ['Velocity up, force down', 'No "force of motion"', '!Only mg'] });
      } else if (kind === 'upramp') {
        prompt = `A block was shoved up a rough ramp and is still sliding up. Which forces act on it?`;
        correct = 'Weight, normal force (perpendicular to the ramp), and friction pointing down the ramp';
        wrongs = ['Weight, normal force, and friction pointing up the ramp', 'Weight, normal force, friction down the ramp, and the forward force of the shove', 'Weight, a vertical normal force, and friction down the ramp'];
        steps = [`Things touching it: the ramp (normal force and friction). Plus gravity.`, `The normal force is perpendicular to the surface, not vertical.`, `Kinetic friction opposes the sliding, so it points down the ramp. The shove ended when your hand let go.`, `${B('mg, N ⊥ ramp, f down the ramp')}.`];
        visual = vis('d-incline', { theta: 25, mu: 0.3, fric: 'down', motion: 'up', notes: ['N perpendicular to the ramp', 'Sliding up → friction down', '!No leftover "shove" force'] });
      } else if (kind === 'wall') {
        prompt = `You press a book against a wall with a horizontal push, and it stays put. Which forces act on the book?`;
        correct = 'Weight down, your push toward the wall, the wall\'s normal force away from it, and static friction up';
        wrongs = ['Weight down, your push, and the wall\'s normal force; nothing else is needed', 'Weight down, your push, the normal force, and static friction down', 'Your push and the normal force only; the push cancels gravity'];
        steps = [`Vertical: the book doesn't fall, so something must push up to balance mg. Your push is horizontal, so it can't.`, `That upward force is static friction from the wall.`, `Horizontal: your push and the wall's normal force cancel.`, `${B('mg, push, N, and f_s up')}. Pushing harder raises the max friction but not the actual friction (still = mg).`];
        visual = vis('d-fbd', { title: 'Book pressed against a wall', forces: [fA(1.4, 180, 'push'), fNorm(1.4, 'N', 0), fW(1), fF(1, 90, 'f_s')], notes: ['Push and N cancel (horizontal)', 'f_s and mg cancel (vertical)', '!f_s = mg, pointing up'] });
      } else if (kind === 'hanging') {
        prompt = `A sign hangs at rest from two ropes, each pulling up and outward at an angle. Which statement about the forces on the sign is correct?`;
        correct = 'The vertical parts of the two tensions add up to the sign\'s weight';
        wrongs = ['Each rope\'s tension equals half the weight', 'The total tension (T₁ + T₂) equals the weight', 'The horizontal parts of the tensions add up to the weight'];
        steps = [`Three forces: weight down, two tensions along the ropes.`, `At rest, the net force is zero in each direction separately.`, `Vertical: ${M('T_1\\sin\\theta_1 + T_2\\sin\\theta_2 = mg')}. Horizontal: ${M('T_1\\cos\\theta_1 = T_2\\cos\\theta_2')}.`, `${B('Vertical components sum to mg')}. Each tension is actually bigger than its share, because part of it pulls sideways.`];
        visual = vis('d-fbd', { title: 'Sign held by two angled ropes', forces: [fT(1.1, 140, 'T₁'), fT(1.1, 40, 'T₂'), fW(1.4)], notes: ['Vertical: T₁ sin θ + T₂ sin θ = mg', 'Horizontal parts cancel', '!Each T > mg/2'] });
      } else {
        prompt = `A car rounds a flat curve at constant speed. Viewed from behind the car, which forces act on it?`;
        correct = 'Weight, normal force, and static friction toward the center of the curve';
        wrongs = ['Weight, normal force, friction toward the center, and a centrifugal force outward', 'Weight, normal force, and friction pointing outward', 'Weight and normal force only, since the speed is constant'];
        steps = [`Moving in a circle requires a net force toward the center, even at constant speed.`, `The only horizontal thing touching the car is the road: static friction on the tires points inward.`, `"Centrifugal force" isn't exerted by anything, so it never goes in a free-body diagram.`, `${B('mg, N, and f toward the center')}.`];
        visual = vis('d-fbd', { title: 'Car on a flat curve (from behind)', forces: [fNorm(1), fW(1), fF(0.6, 180, 'f_s (to center)')], acc: { ang: 180, label: 'a_c' }, notes: ['Center of the curve is to the left', '!Friction is the centripetal force'] });
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });

  // ---------- systems ----------
  gens.push({
    id: 'p1u2-systems', unit: 12, topic: 'Systems & internal forces',
    make(rng) {
      const kind = rng.pick(['internal', 'cm', 'acc']);
      let prompt, correct, wrongs, steps, visual;
      if (kind === 'internal') {
        prompt = `Two blocks, A and B, are pushed across a frictionless floor by a force F applied to A. If you choose A and B together as the system, which force is internal?`;
        correct = 'The force A exerts on B (and B on A)';
        wrongs = ['The applied force F', 'The weight of block B', 'The normal force from the floor on A'];
        steps = [`An internal force is exerted by one part of the system on another part.`, `A and B are both inside the system, so their push on each other is internal. Those forces come in a third-law pair and cancel within the system.`, `F (from your hand), gravity (from Earth) and the floor's normal forces come from outside: they're external.`, `${B('A-on-B is internal')}. Only external forces change the system's motion.`];
        visual = vis('d-blocks', { mode: 'push', mA: 4, mB: 2, F: 12, a: 2, contact: 4, notes: ['System = A + B', 'P (A↔B) is internal', '!a_system = F_ext/m_total'] });
      } else if (kind === 'cm') {
        const m1 = rng.pick([50, 60, 70]), m2 = rng.pick([5, 10, 20]);
        prompt = `A ${Q(m1, KG)} astronaut floating at rest in space throws a ${Q(m2, KG)} tool away from herself. What happens to the center of mass of the astronaut–tool system?`;
        correct = 'It stays at rest where it was';
        wrongs = ['It moves in the direction the tool was thrown', 'It moves in the direction the astronaut recoils', 'It moves at first and then slowly stops'];
        steps = [`The throw involves only internal forces (astronaut on tool, tool on astronaut).`, `With no external force, the center of mass of the system can't accelerate.`, `It was at rest, so it stays at rest: the tool goes one way and the astronaut the other, balanced around it.`, `${B('Center of mass stays put')}.`];
        visual = vis('d-com', { masses: [{ m: m1, x: 30 }, { m: m2, x: 90 }], L: 100, xcm: (30 * m1 + 90 * m2) / (m1 + m2), note: 'Internal forces move the parts apart, but the center of mass stays where it was.' });
      } else {
        const ma = rng.int(2, 8), mb = rng.int(2, 8), F = rng.int(3, 12) * 4;
        const a = F / (ma + mb);
        const R = (x) => M(fmt(x) + '\\ \\text{m/s}^2');
        prompt = `A ${Q(ma, KG)} cart is linked to a ${Q(mb, KG)} cart, and a ${Q(F, N_)} horizontal force pulls the pair across a frictionless track. What is the acceleration of the system's center of mass?`;
        correct = R(a);
        wrongs = [R(F / ma), R(F / mb), R(F / Math.abs(ma - mb || 1)), R(F * (ma + mb)), R(2 * a)];
        steps = [`For a system, ${M('\\vec a_{cm} = \\frac{\\sum \\vec F_{ext}}{m_{total}}')}. The link between the carts is internal and drops out.`, `External horizontal force: just ${F} N.`, `${M(`a_{cm} = \\frac{${F}}{${ma} + ${mb}} = ${fmt(a)}\\ \\text{m/s}^2`)}.`, `${B(`a ≈ ${X(a)} m/s²`)}.`];
        visual = vis('d-blocks', { mode: 'pull', mA: ma, mB: mb, F, a, contact: ma * a, notes: ['System = both carts', 'Only external F counts', `!a = F/(m₁ + m₂) = ${fa(a)}`] });
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual };
    },
  });

  // ======================================================================
  // lesson links
  // ======================================================================
  Object.assign(window.PR_LESSON_FOR_KEY, {
    'd-fbd': 'p1u2-forces-fbd',
    'd-incline': 'p1u2-normal-inclines',
    'd-atwood': 'p1u2-connected',
    'd-elevator': 'p1u2-normal-inclines',
    'd-spring': 'p1u2-springs',
    'd-circular': 'p1u2-circular',
    'd-gravity': 'p1u2-gravity',
    'd-com': 'p1u2-systems',
    'd-blocks': 'p1u2-connected',
    'd-pair': 'p1u2-third-law',
  });
  window.PR_LESSON_FOR_TOPIC.push(
    [/^center of mass|systems & internal/i, 'p1u2-systems'],
    [/free-body/i, 'p1u2-forces-fbd'],
    [/third law/i, 'p1u2-third-law'],
    [/first law/i, 'p1u2-first-law'],
    [/second law/i, 'p1u2-second-law'],
    [/^orbits$|vertical circles|circular motion/i, 'p1u2-circular'],
    [/gravitation|gravitational force/i, 'p1u2-gravity'],
    [/apparent weight|inclined plane/i, 'p1u2-normal-inclines'],
    [/friction/i, 'p1u2-friction'],
    [/hooke|springs in/i, 'p1u2-springs'],
    [/atwood|connected objects/i, 'p1u2-connected']
  );
})();
