// Physics Review: visual explanations shown after each duel round.
// PRVisuals.render(key, params) -> self-contained SVG string (theme-aware via CSS vars/classes).
window.PRVisuals = (function () {
  'use strict';

  var K = 8.99e9;
  var uid = 0;

  // ---------- generic helpers ----------
  function esc(s) {
    if (window.PR && window.PR.esc) return window.PR.esc(s);
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function r1(v) { return Math.round(v * 10) / 10; }
  function arr(a) { return Array.isArray(a) ? a : []; }

  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  var SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
  function sup(s) { return String(s).split('').map(function (c) { return SUP[c] || c; }).join(''); }
  function sub(s) { return String(s).split('').map(function (c) { return SUB[c] || c; }).join(''); }
  function minus(s) { return String(s).replace(/^-/, '−'); }

  // Readable number: plain for ordinary magnitudes, "m × 10ⁿ" otherwise.
  function num(x, d) {
    d = d || 3;
    if (!isNum(x)) return '?';
    if (x === 0) return '0';
    var ax = Math.abs(x);
    if (ax >= 1e-2 && ax < 1e5) {
      var v = Number(x.toPrecision(d));
      return minus(Math.abs(v) >= 1e4 ? v.toLocaleString('en-US') : String(v));
    }
    var e = Math.floor(Math.log10(ax));
    var m = Number((x / Math.pow(10, e)).toPrecision(d));
    if (Math.abs(m) >= 10) { m = Number((m / 10).toPrecision(d)); e++; }
    return minus(String(m)) + ' × 10' + sup(e);
  }
  var PFX = { '-12': 'p', '-9': 'n', '-6': 'µ', '-3': 'm', '0': '', '3': 'k', '6': 'M', '9': 'G' };
  // SI prefix formatting: 3.2e-6 C -> "3.2 µC"
  function si(x, unit, d) {
    if (!isNum(x)) return '?';
    if (x === 0) return '0 ' + unit;
    d = d || 3;
    if (Math.abs(x) < 1e-12 || Math.abs(x) >= 1e12) return num(x, d) + ' ' + unit;
    var e3 = clamp(Math.floor(Math.log10(Math.abs(x)) / 3) * 3, -12, 9);
    var v = Number((x / Math.pow(10, e3)).toPrecision(d));
    if (Math.abs(v) >= 1000 && e3 < 9) { e3 += 3; v = Number((x / Math.pow(10, e3)).toPrecision(d)); }
    return num(v, d) + ' ' + PFX[e3] + unit;
  }
  function sgn(x, s) { return (isNum(x) && x > 0 ? '+' : '') + s; }
  function fq(q) { return sgn(q, si(q, 'C')); }
  function fm(r) {
    if (!isNum(r)) return '?';
    var a = Math.abs(r);
    if (a >= 1 || a === 0) return num(r) + ' m';
    if (a >= 0.01) return num(r * 100) + ' cm';
    if (a >= 1e-3) return num(r * 1000) + ' mm';
    return si(r, 'm');
  }
  function fA(A) {
    if (!isNum(A)) return '?';
    if (A >= 1e-2) return num(A) + ' m²';
    if (A >= 1e-6) return num(A * 1e6) + ' mm²';
    return num(A) + ' m²';
  }
  function fV(v) { return si(v, 'V'); }
  function fJ(v) { return si(v, 'J'); }
  function fN(v) { return si(v, 'N'); }
  function fOhm(v) { return si(v, 'Ω'); }
  function fI(v) { return si(v, 'A'); }
  function fW(v) { return si(v, 'W'); }
  function fF(v) { return si(v, 'F'); }

  function srand(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- SVG primitives ----------
  function svg(label, body, h, w) {
    return '<svg viewBox="0 0 ' + (w || 640) + ' ' + (h || 320) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      esc(label) + '">' + body + '</svg>';
  }
  function line(x1, y1, x2, y2, c, w, extra) {
    return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) +
      '" style="stroke:var(--' + (c || 'text') + ');stroke-width:' + (w || 2) + ';stroke-linecap:round' + (extra || '') + '"/>';
  }
  function dline(x1, y1, x2, y2, c, w) { return line(x1, y1, x2, y2, c || 'muted', w || 1.5, ';stroke-dasharray:5 4'); }
  function path(d, c, w, extra) {
    return '<path d="' + d + '" style="fill:none;stroke:var(--' + (c || 'text') + ');stroke-width:' + (w || 2) +
      ';stroke-linejoin:round;stroke-linecap:round' + (extra || '') + '"/>';
  }
  function head(x, y, ang, c, s) {
    s = s || 10;
    var bx = x - s * Math.cos(ang), by = y - s * Math.sin(ang);
    var px = -Math.sin(ang) * s * 0.45, py = Math.cos(ang) * s * 0.45;
    return '<path d="M' + r1(x) + ' ' + r1(y) + 'L' + r1(bx + px) + ' ' + r1(by + py) + 'L' + r1(bx - px) + ' ' + r1(by - py) +
      'Z" style="fill:var(--' + (c || 'text') + ')"/>';
  }
  function arrow(x1, y1, x2, y2, c, w, hs) {
    c = c || 'text'; w = w || 2;
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 2) return '';
    hs = Math.min(hs || (7 + w * 2), L * 0.7);
    var ux = dx / L, uy = dy / L;
    return line(x1, y1, x2 - ux * hs * 0.8, y2 - uy * hs * 0.8, c, w) + head(x2, y2, Math.atan2(dy, dx), c, hs);
  }
  function text(x, y, s, o) {
    o = o || {};
    var st = '';
    if (o.c) st += 'fill:var(--' + o.c + ');';
    if (o.w) st += 'font-weight:' + o.w + ';';
    if (o.sz) st += 'font-size:' + o.sz + 'px;';
    if (o.it) st += 'font-style:italic;';
    if (o.halo) st += 'paint-order:stroke;stroke:var(--surface-2);stroke-width:4px;stroke-linejoin:round;';
    return '<text x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (o.a || 'start') + '"' +
      (o.cls ? ' class="' + o.cls + '"' : '') + (st ? ' style="' + st + '"' : '') + '>' + esc(s) + '</text>';
  }
  function rect(x, y, w, h, o) {
    o = o || {};
    var st = '';
    if (o.fill || !o.cls) st += 'fill:' + (o.fill ? 'var(--' + o.fill + ')' : 'none') + ';';
    if (o.op != null) st += 'fill-opacity:' + o.op + ';';
    if (o.stroke || !o.cls) st += 'stroke:' + (o.stroke ? 'var(--' + o.stroke + ')' : 'none') + ';';
    st += 'stroke-width:' + (o.sw || 1.5) + ';';
    if (o.dash) st += 'stroke-dasharray:' + o.dash + ';';
    return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="' + (o.rx || 0) + '"' +
      (o.cls ? ' class="' + o.cls + '"' : '') + ' style="' + st + '"/>';
  }
  function circle(x, y, r, o) {
    o = o || {};
    var st = 'fill:' + (o.fill ? 'var(--' + o.fill + ')' : 'none') + ';';
    if (o.op != null) st += 'fill-opacity:' + o.op + ';';
    st += 'stroke:' + (o.stroke ? 'var(--' + o.stroke + ')' : 'none') + ';stroke-width:' + (o.sw || 1.5) + ';';
    if (o.dash) st += 'stroke-dasharray:' + o.dash + ';';
    return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(r) + '" style="' + st + '"/>';
  }
  function chargeColor(q) { return q > 0 ? 'pos' : q < 0 ? 'neg' : 'muted'; }
  function charge(x, y, q, r) {
    r = r || 16;
    var s = q > 0 ? '+' : q < 0 ? '−' : '0';
    return circle(x, y, r, { fill: chargeColor(q) }) +
      text(x, y + r * 0.42, s, { a: 'middle', c: 'surface', w: 700, sz: Math.round(r * 1.25) });
  }
  function sign(x, y, s, sz) { // small + / − symbol for charge distributions
    return text(x, y + 4.5, s === '+' ? '+' : '−', { a: 'middle', c: s === '+' ? 'pos' : 'neg', w: 700, sz: sz || 14 });
  }
  function dim(x1, y, x2, label, c) { // horizontal dimension line with end ticks
    return line(x1, y - 6, x1, y + 6, c || 'muted', 1.5) + line(x2, y - 6, x2, y + 6, c || 'muted', 1.5) +
      line(x1, y, x2, y, c || 'muted', 1.5) + rect((x1 + x2) / 2 - label.length * 3.6 - 6, y - 9, label.length * 7.2 + 12, 18, { fill: 'surface-2' }) +
      text((x1 + x2) / 2, y + 4.5, label, { a: 'middle' });
  }
  function bg(w, h) { return rect(0, 0, w || 640, h || 320, { fill: 'surface-2' }); }
  function title(s, x, y) { return text(x == null ? 20 : x, y || 26, s, { cls: 'big' }); }
  function wrap(s, max) {
    var words = String(s).split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function textLines(x, y, s, max, o, lh) {
    return wrap(s, max).map(function (l, i) { return text(x, y + i * (lh || 16), l, o); }).join('');
  }
  function qLabel(q) { // charges given in coulombs vs relative units ("+2q")
    if (!isNum(q)) return '?';
    if (Math.abs(q) < 1e-2) return fq(q);
    var a = Math.abs(q);
    return (q > 0 ? '+' : '−') + (a === 1 ? '' : num(a)) + 'q';
  }

  // ---------- placeholder / concept ----------
  function concept(p) {
    p = p || {};
    var t = p.title || 'Key idea';
    var bullets = arr(p.bullets).slice(0, 6);
    var b = rect(16, 16, 608, 288, { cls: 'panel', rx: 14 }) + rect(16, 16, 6, 288, { fill: 'accent', rx: 3 }) + text(44, 56, t, { cls: 'big' });
    var y = 92;
    bullets.forEach(function (s) {
      var ls = wrap(s, 74);
      b += circle(50, y - 4, 3.5, { fill: 'accent' });
      ls.forEach(function (l, i) { b += text(64, y + i * 18, l); });
      y += ls.length * 18 + 12;
    });
    return svg(t, b);
  }
  function placeholder(key) {
    return concept({ title: 'Visual: ' + (key || 'explanation'), bullets: ['Follow the written steps for this one.'] });
  }

  // ============ UNIT 1: ELECTROSTATICS ============

  function coulombState(s) {
    var q1 = isNum(s.q1) ? s.q1 : 1e-6, q2 = isNum(s.q2) ? s.q2 : 1e-6;
    var F = isNum(s.F) ? s.F : (isNum(s.r) && s.r ? K * Math.abs(q1 * q2) / (s.r * s.r) : NaN);
    return { q1: q1, q2: q2, r: s.r, F: F };
  }
  function coulomb(p) {
    if (!(p.after && typeof p.after === 'object')) return coulombSingle(p);
    var A = coulombState(p), B = coulombState(Object.assign({}, p, { F: undefined }, p.after));
    if (isNum(p.after.F)) B.F = p.after.F;
    var Fm = Math.max(isNum(A.F) ? A.F : 0, isNum(B.F) ? B.F : 0);
    var b = bg() + title('Coulomb force: before → after');
    var panel = function (s, x0, ttl) {
      var o = rect(x0, 40, 306, 222, { fill: 'surface', op: 0.5, stroke: ttl === 'After' ? 'accent' : 'border', sw: ttl === 'After' ? 2 : 1, rx: 10 });
      o += text(x0 + 12, 60, ttl, { w: 700, c: ttl === 'After' ? 'accent' : null });
      var attract = s.q1 * s.q2 < 0, y = 130, ra = 17, rb = 17;
      var x1 = x0 + (attract ? 50 : 105), x2 = x0 + (attract ? 256 : 201);
      var L = Fm > 0 && isNum(s.F) ? Math.max(8, 72 * s.F / Fm) : 40;
      if (attract) o += arrow(x1 + ra + 3, y, x1 + ra + 3 + L, y, 'accent', 3) + arrow(x2 - rb - 3, y, x2 - rb - 3 - L, y, 'accent', 3);
      else o += arrow(x1 - ra - 3, y, x1 - ra - 3 - L, y, 'accent', 3) + arrow(x2 + rb + 3, y, x2 + rb + 3 + L, y, 'accent', 3);
      o += charge(x1, y, s.q1, ra) + charge(x2, y, s.q2, rb);
      o += text(x1, y + 36, qLabel(s.q1), { a: 'middle', sz: 12 }) + text(x2, y + 36, qLabel(s.q2), { a: 'middle', sz: 12 });
      o += dim(x1, y + 64, x2, 'r = ' + fm(s.r));
      o += text(x0 + 153, 250, 'F = ' + fN(s.F), { a: 'middle', c: 'accent', w: 700 });
      return o;
    };
    b += panel(A, 8, 'Before') + panel(B, 326, 'After');
    var ratio = isNum(A.F) && isNum(B.F) && A.F ? B.F / A.F : NaN;
    var parts = [];
    if (A.q1 !== B.q1) parts.push('q₁ ×' + num(B.q1 / A.q1, 3));
    if (A.q2 !== B.q2) parts.push('q₂ ×' + num(B.q2 / A.q2, 3));
    if (isNum(A.r) && isNum(B.r) && A.r !== B.r) parts.push('r ×' + num(B.r / A.r, 3) + ' → 1/r² ×' + num((A.r * A.r) / (B.r * B.r), 3));
    if (isNum(ratio)) b += text(320, 288, 'F × ' + num(ratio, 2), { a: 'middle', w: 700, c: 'accent', sz: 15 });
    if (parts.length) b += text(320, 308, parts.join('   '), { a: 'middle', cls: 'small' });
    return svg('Coulomb force before and after the change', b);
  }
  function coulombSingle(p) {
    var q1 = isNum(p.q1) ? p.q1 : 1e-6, q2 = isNum(p.q2) ? p.q2 : 1e-6;
    var F = isNum(p.F) ? p.F : (isNum(p.r) ? K * Math.abs(q1 * q2) / (p.r * p.r) : NaN);
    var attract = q1 * q2 < 0;
    var x1 = 200, x2 = 440, y = 150;
    var rad = function (q) { return clamp(15 + 3 * Math.log10(Math.abs(q) / 1e-9 + 1), 15, 28); };
    var ra = rad(q1), rb = rad(q2);
    var L = isNum(F) ? clamp(70 + 15 * Math.log10(Math.abs(F)), 35, 110) : 70;
    var b = bg() + title(attract ? 'Opposite charges attract' : 'Like charges repel');
    if (attract) {
      L = Math.min(L, (x2 - x1 - ra - rb) / 2 - 12);
      b += arrow(x1 + ra + 4, y, x1 + ra + 4 + L, y, 'accent', 3) + arrow(x2 - rb - 4, y, x2 - rb - 4 - L, y, 'accent', 3);
      b += text(x1 + ra + 4 + L / 2, y - 14, 'F', { a: 'middle', c: 'accent', w: 700 }) + text(x2 - rb - 4 - L / 2, y - 14, 'F', { a: 'middle', c: 'accent', w: 700 });
    } else {
      b += arrow(x1 - ra - 4, y, x1 - ra - 4 - L, y, 'accent', 3) + arrow(x2 + rb + 4, y, x2 + rb + 4 + L, y, 'accent', 3);
      b += text(x1 - ra - 4 - L / 2, y - 14, 'F', { a: 'middle', c: 'accent', w: 700 }) + text(x2 + rb + 4 + L / 2, y - 14, 'F', { a: 'middle', c: 'accent', w: 700 });
    }
    b += charge(x1, y, q1, ra) + charge(x2, y, q2, rb);
    b += text(x1, y + ra + 22, 'q' + sub(1) + ' = ' + fq(q1), { a: 'middle' }) + text(x2, y + rb + 22, 'q' + sub(2) + ' = ' + fq(q2), { a: 'middle' });
    b += dim(x1, 228, x2, 'r = ' + fm(p.r));
    b += text(320, 272, 'F = k|q₁q₂| / r² = ' + fN(F), { a: 'middle', w: 700, c: 'accent' });
    b += text(320, 296, 'Same size on both charges, opposite directions (Newton’s 3rd law)', { a: 'middle', cls: 'small' });
    return svg('Coulomb force between two charges', b);
  }

  function superposition(p) {
    var ch = arr(p.charges).filter(function (c) { return c && isNum(c.q) && isNum(c.x); });
    var x0 = isNum(p.x0) ? p.x0 : 0;
    var isF = p.quantity === 'force';
    var qT = isNum(p.qTest) ? p.qTest : 1;
    var rel = ch.length && ch.every(function (c) { return Math.abs(c.q) >= 1e-2; });
    var unit = rel ? (isF ? '(kq²/m²)' : 'kq/m²') : isF ? 'N' : 'N/C';
    var comps = ch.map(function (c) {
      var d = x0 - c.x;
      if (d === 0) return 0;
      var E = (rel ? 1 : K) * c.q / (d * d) * (d > 0 ? 1 : -1);
      return isF ? E * qT : E;
    });
    var netC = comps.reduce(function (s, v) { return s + v; }, 0);
    var net = isNum(p.net) ? p.net : netC;
    var xs = ch.map(function (c) { return c.x; }).concat([x0]);
    var mn = Math.min.apply(null, xs), mx = Math.max.apply(null, xs);
    if (mx - mn < 1e-12) { mn -= 1; mx += 1; }
    var pad = (mx - mn) * 0.12;
    var X = function (x) { return 60 + (x - mn + pad) / (mx - mn + 2 * pad) * 520; };
    var H = 140 + (ch.length + 1) * 34 + 30;
    H = Math.max(320, H);
    var b = bg(640, H) + title(isF ? 'Net force = vector sum of each force' : 'Net field = vector sum of each field');
    var ly = 80;
    b += line(30, ly, 610, ly, 'muted', 1.5);
    ch.forEach(function (c, i) {
      b += charge(X(c.x), ly, c.q, 13) + text(X(c.x), ly + 30, 'q' + sub(i + 1) + ' = ' + qLabel(c.q), { a: 'middle', sz: 12 }) +
        text(X(c.x), ly - 20, 'x = ' + fm(c.x), { a: 'middle', cls: 'small' });
    });
    if (isF) b += charge(X(x0), ly, qT, 9); else b += circle(X(x0), ly, 6, { fill: 'accent' });
    b += text(X(x0), ly - 20, (isF ? 'test charge ' + fq(qT) : 'point P'), { a: 'middle', c: 'accent', sz: 12 });
    // vector rows
    var oy = 160, ox = 290, maxAbs = Math.max.apply(null, comps.map(Math.abs).concat([Math.abs(net), 1e-300]));
    var len = function (v) { var l = Math.abs(v) / maxAbs * 140; return l < 10 && v !== 0 ? 10 : l; };
    b += dline(ox, oy - 14, ox, oy + (ch.length + 1) * 34, 'muted', 1);
    b += text(ox, oy - 20, 'vectors at ' + (isF ? 'the test charge' : 'P') + ' (→ = +)', { a: 'middle', cls: 'small' });
    var sym = isF ? 'F' : 'E';
    comps.forEach(function (v, i) {
      var y = oy + i * 34 + 10, c = chargeColor(ch[i].q);
      b += text(20, y + 4.5, sym + sub(i + 1) + ' (from q' + sub(i + 1) + ')', { c: c });
      b += arrow(ox, y, ox + Math.sign(v) * len(v), y, c, 2.5);
      b += text(620, y + 4.5, sgn(v, num(v)) + ' ' + unit, { a: 'end', c: c });
    });
    var ny = oy + ch.length * 34 + 22;
    b += line(20, ny - 12, 620, ny - 12, 'border', 1);
    b += text(20, ny + 6, 'net ' + sym, { c: 'accent', w: 700 });
    b += arrow(ox, ny + 2, ox + Math.sign(net) * len(net), ny + 2, 'accent', 3.5);
    b += text(620, ny + 6, sgn(net, num(net)) + ' ' + unit + (net > 0 ? ' (right)' : net < 0 ? ' (left)' : ''), { a: 'end', c: 'accent', w: 700 });
    b += text(320, H - 14, 'Add with signs: right = +, left = −', { a: 'middle', cls: 'small' });
    return svg('Superposition of ' + (isF ? 'forces' : 'fields') + ' on a line', b, H);
  }

  function pointField(p) {
    var q = isNum(p.q) ? p.q : 1e-9;
    var E = isNum(p.E) ? p.E : (isNum(p.r) ? K * Math.abs(q) / (p.r * p.r) : NaN);
    var cx = 160, cy = 160, out = q >= 0;
    var b = bg() + title('Field of a point charge: E = k|q|/r²');
    [[30, 36], [80, 14]].forEach(function (ring) {
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        if (i === 0 || i === 1 || i === 11) continue;
        var ux = Math.cos(a), uy = Math.sin(a), r0 = ring[0], L = ring[1];
        var sx = cx + ux * r0, sy = cy + uy * r0, ex = cx + ux * (r0 + L), ey = cy + uy * (r0 + L);
        b += out ? arrow(sx, sy, ex, ey, 'muted', 1.5, 7) : arrow(ex, ey, sx, sy, 'muted', 1.5, 7);
      }
    });
    b += charge(cx, cy, q, 20);
    b += text(cx, 300, 'q = ' + fq(q), { a: 'middle', w: 700 });
    var px = 440;
    b += dim(cx, cy + 36, px, 'r = ' + fm(p.r));
    b += dline(cx + 22, cy, px - 8, cy);
    b += circle(px, cy, 5, { fill: 'accent' }) + text(px, cy + 24, 'P', { a: 'middle', c: 'accent', w: 700 });
    b += out ? arrow(px + 8, cy, px + 100, cy, 'accent', 3.5) : arrow(px - 8, cy, px - 100, cy - 0.01, 'accent', 3.5);
    b += text(out ? 470 : 380, cy - 22, 'E = ' + num(E) + ' N/C', { a: 'middle', c: 'accent', w: 700 });
    b += text(470, 80, out ? 'Points AWAY from + charge' : 'Points TOWARD − charge', { a: 'middle', cls: 'small' });
    b += text(450, 300, 'Arrows shrink fast: double r → E becomes ¼', { a: 'middle', cls: 'small' });
    return svg('Electric field of a point charge', b);
  }

  function uniformField(p) {
    var V = p.V, d = p.d;
    var E = isNum(p.E) ? p.E : (isNum(V) && isNum(d) && d ? V / d : NaN);
    var hasQ = isNum(p.q);
    var xl = 170, xr = 410, top = 50, bot = 250;
    var b = bg() + title('Uniform field between plates: E = ΔV / d');
    b += rect(xl - 8, top, 8, bot - top, { fill: 'pos' }) + rect(xr, top, 8, bot - top, { fill: 'neg' });
    for (var y = top + 14; y < bot; y += 26) { b += sign(xl - 20, y, '+') + sign(xr + 20, y, '−'); }
    [0.25, 0.5, 0.75].forEach(function (f) {
      var x = xl + (xr - xl) * f;
      b += dline(x, top + 4, x, bot - 4, 'border', 1.2);
      if (isNum(V)) b += text(x, bot + 14, num(V * (1 - f)) + ' V', { a: 'middle', cls: 'small' });
    });
    var ys = hasQ ? [72, 108, 192, 228] : [72, 111, 150, 189, 228];
    ys.forEach(function (yy) { b += arrow(xl + 8, yy, xr - 8, yy, 'muted', 1.5, 9); });
    b += text(xl - 4, top - 8, isNum(V) ? num(V) + ' V' : '+', { a: 'middle', c: 'pos', w: 700 });
    b += text(xr + 4, top - 8, '0 V', { a: 'middle', c: 'neg', w: 700 });
    b += dim(xl, 290, xr, 'd = ' + fm(d));
    var lines = [];
    lines.push(['ΔV = ' + fV(V), 'text']);
    lines.push(['d = ' + fm(d), 'text']);
    lines.push(['E = ' + num(E) + ' V/m', 'accent']);
    if (hasQ) {
      var q = p.q, mid = (xl + xr) / 2, cy = 150;
      var F = isNum(p.F) ? p.F : (isNum(E) ? Math.abs(q) * E : NaN);
      var dir = q > 0 ? 1 : -1;
      b += arrow(mid + dir * 14, cy, mid + dir * 90, cy, 'accent', 3.5);
      b += charge(mid, cy, q, 12);
      b += text(mid + dir * 52, cy - 14, 'F', { a: 'middle', c: 'accent', w: 700 });
      lines.push(['q = ' + fq(q), 'text']);
      lines.push(['F = |q|E = ' + fN(F), 'accent']);
      if (isNum(p.m)) lines.push(['m = ' + num(p.m) + ' kg', 'text']);
      var a = isNum(p.a) ? p.a : (isNum(p.m) && isNum(F) ? F / p.m : NaN);
      if (isNum(a)) lines.push(['a = F/m = ' + num(a) + ' m/s²', 'accent']);
      lines.push([q > 0 ? '+ charge: force along E' : '− charge: force opposite E', 'muted']);
    }
    lines.push(['E points + → − (high V to low V)', 'muted']);
    lines.forEach(function (l, i) { b += text(450, 70 + i * 26, l[0], { c: l[1], w: l[1] === 'accent' ? 700 : 400, sz: l[1] === 'muted' ? 11 : 13 }); });
    return svg('Uniform electric field between parallel plates', b);
  }

  function potential(p) {
    var ch = arr(p.charges).filter(function (c) { return c && isNum(c.q) && isNum(c.x) && isNum(c.y); });
    var pt = p.point && isNum(p.point.x) && isNum(p.point.y) ? p.point : { x: 0, y: 0 };
    var all = ch.concat([pt]);
    var xs = all.map(function (c) { return c.x; }), ys = all.map(function (c) { return c.y; });
    var mnx = Math.min.apply(null, xs), mxx = Math.max.apply(null, xs), mny = Math.min.apply(null, ys), mxy = Math.max.apply(null, ys);
    var span = Math.max(mxx - mnx, mxy - mny, 1e-9);
    var sc = Math.min(330 / Math.max(mxx - mnx, span * 0.3), 220 / Math.max(mxy - mny, span * 0.3));
    var cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2;
    var X = function (x) { return 205 + (x - cx) * sc; }, Y = function (y) { return 175 - (y - cy) * sc; };
    var b = bg() + title('Potential is a scalar: just add kq/r');
    var parts = ch.map(function (c) {
      var r = Math.hypot(pt.x - c.x, pt.y - c.y);
      return { r: r, V: r > 0 ? K * c.q / r : NaN };
    });
    ch.forEach(function (c, i) {
      var x1 = X(c.x), y1 = Y(c.y), x2 = X(pt.x), y2 = Y(pt.y);
      b += dline(x1, y1, x2, y2, chargeColor(c.q), 1.5);
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, L = Math.hypot(x2 - x1, y2 - y1) || 1;
      var nx = -(y2 - y1) / L * 16, ny = (x2 - x1) / L * 16;
      b += text(mx + nx, my + ny + 4, 'r' + sub(i + 1) + ' = ' + fm(parts[i].r), { a: 'middle', sz: 11 });
    });
    ch.forEach(function (c, i) {
      b += charge(X(c.x), Y(c.y), c.q, 13) + text(X(c.x), Y(c.y) + 28, 'q' + sub(i + 1) + ' = ' + qLabel(c.q), { a: 'middle', sz: 11 });
    });
    b += circle(X(pt.x), Y(pt.y), 6, { fill: 'accent' }) + text(X(pt.x) + 10, Y(pt.y) - 10, 'P', { c: 'accent', w: 700 });
    var Vsum = parts.reduce(function (s, v) { return s + (isNum(v.V) ? v.V : 0); }, 0);
    var Vt = isNum(p.V) ? p.V : Vsum;
    var x0 = 430, y0 = 70;
    b += rect(x0 - 12, y0 - 24, 210, Math.max(110, 48 + parts.length * 26 + 40), { cls: 'panel', rx: 10 });
    b += text(x0, y0 - 4, 'Contributions at P', { w: 700 });
    parts.forEach(function (v, i) {
      b += text(x0, y0 + 22 + i * 26, 'V' + sub(i + 1) + ' = kq' + sub(i + 1) + '/r' + sub(i + 1) + ' = ' + sgn(v.V, fV(v.V)), { c: chargeColor(ch[i].q), sz: 12 });
    });
    var yy = y0 + 22 + parts.length * 26;
    b += line(x0, yy - 12, x0 + 186, yy - 12, 'border', 1);
    b += text(x0, yy + 6, 'V = ' + sgn(Vt, fV(Vt)), { c: 'accent', w: 700, sz: 15 });
    b += text(x0 - 12, 300, 'No directions: + adds, − subtracts', { cls: 'small' });
    return svg('Electric potential from several charges', b);
  }

  function pePair(p) {
    var q1 = isNum(p.q1) ? p.q1 : 1e-6, q2 = isNum(p.q2) ? p.q2 : 1e-6;
    var U = isNum(p.U) ? p.U : (isNum(p.r) ? K * q1 * q2 / p.r : NaN);
    var like = q1 * q2 > 0;
    var b = bg() + title(like ? 'Like charges: U > 0' : 'Unlike charges: U < 0');
    var x1 = 70, x2 = 260, y = 110;
    b += charge(x1, y, q1, 17) + charge(x2, y, q2, 17);
    b += text(x1, y + 38, fq(q1), { a: 'middle' }) + text(x2, y + 38, fq(q2), { a: 'middle' });
    b += dim(x1, 172, x2, 'r = ' + fm(p.r));
    b += text(30, 220, 'U = kq₁q₂ / r = ' + sgn(U, fJ(U)), { c: 'accent', w: 700, sz: 14 });
    b += textLines(30, 248, like ? 'Positive: you had to push them together. Released, they fly apart and U turns into kinetic energy.'
      : 'Negative: they pulled together and released energy. You must add energy to pull them apart.', 42, { cls: 'small' }, 15);
    // U vs r graph
    var gx0 = 370, gx1 = 615, gy0 = 50, gy1 = 290, zy = 170;
    b += arrow(gx0, gy1, gx0, gy0, 'text', 1.5, 8) + arrow(gx0, zy, gx1, zy, 'text', 1.5, 8);
    b += text(gx0 - 8, gy0 + 6, 'U', { a: 'end', w: 700 }) + text(gx1, zy + 20, 'r', { a: 'end', w: 700 });
    b += text(gx0 - 6, zy + 4, '0', { a: 'end', cls: 'small' });
    var s = like ? -1 : 1, pts = [];
    var ra = 0.5, rb = 3; // multiples of r
    for (var i = 0; i <= 60; i++) {
      var f = ra + (rb - ra) * i / 60;
      var yy = zy + s * clamp(55 / f, 0, 115);
      pts.push((i ? 'L' : 'M') + r1(gx0 + 10 + (f - ra) / (rb - ra) * 225) + ' ' + r1(yy));
    }
    b += path(pts.join(''), 'accent', 2.5);
    var mxp = gx0 + 10 + (1 - ra) / (rb - ra) * 225, myp = zy + s * 55;
    b += dline(mxp, zy, mxp, myp) + circle(mxp, myp, 5, { fill: 'accent' });
    b += text(mxp + 10, myp + (like ? -8 : 18), 'at r: ' + sgn(U, fJ(U)), { c: 'accent', sz: 12 });
    b += text(gx1, like ? 280 : 70, like ? 'U → 0 as r → ∞' : 'U → 0 as r → ∞', { a: 'end', cls: 'small' });
    return svg('Electric potential energy of a pair of charges', b);
  }

  function workDV(p) {
    var q = isNum(p.q) ? p.q : 1e-6, Va = isNum(p.Va) ? p.Va : 0, Vb = isNum(p.Vb) ? p.Vb : 0;
    var dV = Vb - Va, dU = q * dV;
    var W = isNum(p.W) ? p.W : -dU, dK = isNum(p.dK) ? p.dK : -dU;
    var b = bg() + title('Charge ' + fq(q) + ' moves A → B: ΔV = ' + sgn(dV, fV(dV)));
    var xa = 110, xb = 530, ya = 120;
    for (var i = 0; i < 5; i++) {
      var x = xa + (xb - xa) * i / 4, v = Va + dV * i / 4;
      b += dline(x, 50, x, 190, 'muted', 1.3) + text(x, 206, num(v) + ' V', { a: 'middle', cls: 'small' });
    }
    if (dV !== 0) {
      var right = Va > Vb;
      [70, 170].forEach(function (yy) { b += right ? arrow(250, yy, 390, yy, 'muted', 1.5, 8) : arrow(390, yy, 250, yy, 'muted', 1.5, 8); });
      b += rect(262, 52, 116, 16, { fill: 'surface-2' }) + text(320, 64, 'E (high V → low V)', { a: 'middle', cls: 'small' });
    }
    b += arrow(xa + 18, ya, xb - 18, ya, 'accent', 2.5);
    b += charge(xa, ya, q, 13) + circle(xb, ya, 13, { stroke: chargeColor(q), dash: '3 3' });
    b += text(xa, ya - 22, 'A: ' + num(Va) + ' V', { a: 'middle', w: 700 }) + text(xb, ya - 22, 'B: ' + num(Vb) + ' V', { a: 'middle', w: 700 });
    // energy bars
    var max = Math.max(Math.abs(dU), Math.abs(dK), 1e-300), zx = 390;
    var bar = function (y, v, lab, c) {
      var w = Math.abs(v) / max * 110;
      return text(40, y + 5, lab, { c: c, w: 700 }) + rect(v >= 0 ? zx : zx - w, y - 8, Math.max(w, 1), 16, { fill: c, op: 0.85, rx: 3 }) +
        text(v >= 0 ? zx + w + 8 : zx - w - 8, y + 5, sgn(v, fJ(v)), { a: v >= 0 ? 'start' : 'end', c: c });
    };
    b += line(zx, 228, zx, 300, 'border', 1.5);
    b += bar(242, dU, 'ΔU = qΔV', 'warn') + bar(272, dK, 'ΔK = −qΔV', 'good');
    b += text(40, 304, 'Work by field W = −qΔV = ' + sgn(W, fJ(W)), { cls: 'small' });
    b += text(620, 304, dU < 0 ? 'U turns into K (speeds up)' : dU > 0 ? 'K turns into U (slows down)' : 'no energy change', { a: 'end', cls: 'small' });
    return svg('Work and energy as a charge crosses equipotentials', b);
  }

  var EPS0 = 8.85e-12;
  function capState(s) {
    var o = Object.assign({}, s);
    var k = isNum(o.kappa) ? o.kappa : 1;
    if (!isNum(o.C) && isNum(o.A) && isNum(o.d) && o.d) o.C = k * EPS0 * o.A / o.d;
    if (!isNum(o.Q) && isNum(o.C) && isNum(o.V)) o.Q = o.C * o.V;
    if (!isNum(o.V) && isNum(o.Q) && isNum(o.C) && o.C) o.V = o.Q / o.C;
    if (!isNum(o.U) && isNum(o.Q) && isNum(o.V)) o.U = 0.5 * o.Q * o.V;
    if (!isNum(o.E) && isNum(o.V) && isNum(o.d) && o.d) o.E = o.V / o.d;
    return o;
  }
  function capacitor(p) {
    var aft = p.after && typeof p.after === 'object' ? p.after : null;
    if (!aft && ['Q2', 'V2', 'C2', 'E2', 'U2', 'd2', 'kappa2'].some(function (k) { return isNum(p[k]); })) {
      aft = { C: p.C2, V: p.V2, Q: p.Q2, U: p.U2, E: p.E2, d: p.d2, kappa: p.kappa2 };
    }
    if (!aft) return capacitorSingle(p);
    var s1 = capState(p);
    var a2 = {};
    Object.keys(aft).forEach(function (k) { if (aft[k] != null) a2[k] = aft[k]; });
    var s2 = capState(Object.assign({ A: p.A, d: p.d, kappa: isNum(p.kappa) ? p.kappa : 1 }, a2));
    var b = bg(640, 340) + title('Capacitor: before → after');
    var dref = Math.min(isNum(s1.d) ? s1.d : 1, isNum(s2.d) ? s2.d : 1) || 1;
    var Qm = Math.max(Math.abs(s1.Q) || 0, Math.abs(s2.Q) || 0), Em = Math.max(Math.abs(s1.E) || 0, Math.abs(s2.E) || 0);
    var panel = function (s, x0, ttl) {
      var o = rect(x0, 40, 306, 232, { fill: 'surface', op: 0.5, stroke: ttl === 'After' ? 'accent' : 'border', sw: ttl === 'After' ? 2 : 1, rx: 10 });
      o += text(x0 + 12, 60, ttl, { w: 700, c: ttl === 'After' ? 'accent' : null });
      var gap = isNum(s.d) ? clamp(55 * s.d / dref, 40, 130) : 55;
      var xl = x0 + 16, xr = x0 + 136, yt = 90, yb = yt + gap;
      o += rect(xl, yt - 6, xr - xl, 6, { fill: 'pos' }) + rect(xl, yb, xr - xl, 6, { fill: 'neg' });
      var n = Qm > 0 && isNum(s.Q) ? clamp(Math.round(7 * Math.abs(s.Q) / Qm), 1, 7) : 4;
      for (var i = 0; i < n; i++) {
        var x = xl + 10 + (i + 0.5) * (xr - xl - 20) / n;
        o += sign(x, yt - 16, '+', 12) + sign(x, yb + 16, '−', 12);
      }
      var k = isNum(s.kappa) ? s.kappa : 1;
      if (k > 1) o += rect(xl + 4, yt + 4, xr - xl - 8, gap - 8, { fill: 'warn', op: 0.18, stroke: 'warn', rx: 3 }) + text((xl + xr) / 2, yt + gap / 2 + 4, 'κ = ' + num(k), { a: 'middle', c: 'warn', w: 700, sz: 12, halo: true });
      var ew = Em > 0 && isNum(s.E) ? 1 + 2.5 * Math.abs(s.E) / Em : 1.5;
      [0.25, 0.75].forEach(function (f) { var x = xl + (xr - xl) * f; o += arrow(x, yt + 4, x, yb - 4, 'muted', ew, 7 + ew); });
      if (isNum(s.d)) o += line(xr + 8, yt, xr + 8, yb, 'muted', 1) + text(xr + 12, (yt + yb) / 2 + 4, 'd = ' + fm(s.d), { sz: 11, halo: true });
      var rows = [['C', fF(s.C)], ['V', fV(s.V)], ['Q', si(s.Q, 'C')], ['E', isNum(s.E) ? num(s.E) + ' V/m' : '?'], ['U', fJ(s.U)]];
      rows.forEach(function (r, i) { o += text(x0 + 214, 92 + i * 34, r[0] + ' = ' + r[1], { sz: 13 }); });
      return o;
    };
    b += panel(s1, 8, 'Before') + panel(s2, 326, 'After');
    var ch = [];
    [['C', 'C'], ['V', 'V'], ['Q', 'Q'], ['E', 'E'], ['U', 'U']].forEach(function (k) {
      var a = s1[k[0]], c = s2[k[0]];
      if (isNum(a) && isNum(c) && a !== 0) {
        var r = c / a;
        ch.push(k[1] + (Math.abs(r - 1) < 5e-3 ? ' same' : ' ×' + num(r, 2)));
      }
    });
    if (ch.length) b += text(320, 296, 'Change: ' + ch.join('   '), { a: 'middle', w: 700 });
    b += text(320, 320, 'Connected to a battery → V fixed.   Isolated → Q fixed.', { a: 'middle', cls: 'small' });
    return svg('Capacitor before and after the change', b, 340);
  }
  function capacitorSingle(p) {
    var C = p.C, V = p.V, kap = isNum(p.kappa) ? p.kappa : 1;
    var Q = isNum(p.Q) ? p.Q : (isNum(C) && isNum(V) ? C * V : NaN);
    var U = isNum(p.U) ? p.U : (isNum(C) && isNum(V) ? 0.5 * C * V * V : NaN);
    var b = bg() + title(kap > 1 ? 'Parallel-plate capacitor with dielectric' : 'Parallel-plate capacitor');
    var xl = 170, xr = 390, yt = 90, yb = 230, bx = 90;
    // battery & wires
    b += path('M' + bx + ' 148V' + (yt + 4) + 'H' + xl, 'text', 2) + path('M' + bx + ' 162V' + (yb + 4) + 'H' + xl, 'text', 2);
    b += line(bx - 18, 148, bx + 18, 148, 'text', 2) + line(bx - 9, 162, bx + 9, 162, 'text', 5);
    b += text(bx - 24, 152, '+', { a: 'end', c: 'pos', w: 700 }) + text(bx - 24, 172, 'V = ' + fV(V), { a: 'end' });
    b += rect(xl, yt - 4, xr - xl, 8, { fill: 'pos' }) + rect(xl, yb, xr - xl, 8, { fill: 'neg' });
    var n = 7;
    for (var i = 0; i < n; i++) {
      var x = xl + 16 + i * (xr - xl - 32) / (n - 1);
      b += sign(x, yt + 14, '+') + sign(x, yb - 10, '−');
      if (i % 2 === 1) b += arrow(x, yt + 26, x, yb - 22, 'muted', 1.5, 8);
    }
    if (kap > 1) {
      b += rect(xl + 6, yt + 32, xr - xl - 12, yb - yt - 60, { fill: 'warn', op: 0.18, stroke: 'warn', sw: 1.5, rx: 4 });
      for (var j = 0; j < 5; j++) {
        var xx = xl + 30 + j * (xr - xl - 60) / 4;
        b += text(xx, yt + 46, '−', { a: 'middle', c: 'neg', sz: 11 }) + text(xx, yb - 30, '+', { a: 'middle', c: 'pos', sz: 11 });
      }
      b += text((xl + xr) / 2, (yt + yb) / 2 + 5, 'κ = ' + num(kap), { a: 'middle', c: 'warn', w: 700 });
    }
    b += text(xl, yt - 14, isNum(p.A) ? 'plate area A = ' + fA(p.A) : '', {}) + text(xr, yt - 14, '+Q', { a: 'end', c: 'pos', w: 700 });
    b += text(xr, yb + 26, '−Q', { a: 'end', c: 'neg', w: 700 });
    b += line(xr + 18, yt + 4, xr + 18, yb, 'muted', 1.5) + line(xr + 12, yt + 4, xr + 24, yt + 4, 'muted', 1.5) + line(xr + 12, yb, xr + 24, yb, 'muted', 1.5);
    b += text(xr + 26, (yt + yb) / 2 + 4, 'd = ' + fm(p.d), {});
    var x0 = 480, rows = [];
    rows.push(['C = κε₀A/d', 'muted'], ['C = ' + fF(C), 'accent']);
    rows.push(['Q = CV', 'muted'], ['Q = ' + si(Q, 'C'), 'accent']);
    rows.push(['U = ½CV² = ½QV', 'muted'], ['U = ' + fJ(U), 'accent']);
    rows.forEach(function (r, i) { b += text(x0, 66 + i * 24 + Math.floor(i / 2) * 10, r[0], { c: r[1], w: r[1] === 'accent' ? 700 : 400, sz: r[1] === 'muted' ? 12 : 14 }); });
    b += text(320, 300, kap > 1 ? 'Dielectric charges partly cancel the field → more Q stored at the same V (C × κ)' : 'Field points from + plate to − plate; inside it is uniform', { a: 'middle', cls: 'small' });
    return svg('Parallel-plate capacitor', b);
  }

  // ---- charging strips ----
  function scatter(cx, cy, w, h, signs, seed) {
    var rnd = srand(seed), out = '', n = signs.length, cols = Math.ceil(Math.sqrt(n * w / h)), rows = Math.ceil(n / cols);
    signs.forEach(function (s, i) {
      var c = i % cols, r = Math.floor(i / cols);
      var x = cx - w / 2 + (c + 0.5) * w / cols + (rnd() - 0.5) * 4, y = cy - h / 2 + (r + 0.5) * h / rows + (rnd() - 0.5) * 4;
      out += sign(x, y, s, 12);
    });
    return out;
  }
  function pairs(n) { var a = []; for (var i = 0; i < n; i++) a.push(i % 2 ? '−' : '+'); return a; }
  function rep(s, n) { var a = []; for (var i = 0; i < n; i++) a.push(s); return a; }
  function sphereSplit(cx, cy, r, leftSigns, rightSigns) {
    var out = '';
    leftSigns.forEach(function (s, i) { var a = Math.PI * (0.62 + 0.76 * (i + 0.5) / leftSigns.length); out += sign(cx + Math.cos(a) * (r - 9), cy - Math.sin(a) * (r - 9), s, 12); });
    rightSigns.forEach(function (s, i) { var a = Math.PI * (-0.38 + 0.76 * (i + 0.5) / rightSigns.length); out += sign(cx + Math.cos(a) * (r - 9), cy - Math.sin(a) * (r - 9), s, 12); });
    return out;
  }
  function rod(x, y, w, h, signs, seed) {
    return rect(x, y, w, h, { fill: 'surface', stroke: 'muted', rx: 4 }) + (signs.length ? scatter(x + w / 2, y + h / 2, w - 8, h - 2, signs, seed) : '');
  }
  function sphere(cx, cy, r) { return circle(cx, cy, r, { fill: 'surface', stroke: 'text', sw: 2 }) + line(cx, cy + r, cx, cy + r + 30, 'muted', 3) + line(cx - 16, cy + r + 30, cx + 16, cy + r + 30, 'muted', 2); }
  function ground(x, y) { return line(x, y, x, y + 14, 'text', 1.5) + line(x - 12, y + 14, x + 12, y + 14, 'text', 2) + line(x - 8, y + 19, x + 8, y + 19, 'text', 2) + line(x - 4, y + 24, x + 4, y + 24, 'text', 2); }
  function dipole(cx, cy, ang) {
    var dx = Math.cos(ang) * 9, dy = Math.sin(ang) * 9;
    return '<ellipse cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="13" ry="6" transform="rotate(' + r1(ang * 180 / Math.PI) + ' ' + r1(cx) + ' ' + r1(cy) + ')" style="fill:none;stroke:var(--muted);stroke-width:1"/>' +
      text(cx + dx, cy + dy + 3.5, '+', { a: 'middle', c: 'pos', sz: 10, w: 700 }) + text(cx - dx, cy - dy + 3.5, '−', { a: 'middle', c: 'neg', sz: 10, w: 700 });
  }

  function charging(p) {
    var method = ['friction', 'conduction', 'induction', 'polarization'].indexOf(p.method) >= 0 ? p.method : 'friction';
    var steps = [];
    if (method === 'friction') {
      steps = [
        ['Start neutral', 'Rod and fur: equal + and −', function (cx, cy) { return rod(cx - 50, cy - 50, 100, 22, pairs(8), 1) + rect(cx - 40, cy + 10, 80, 40, { fill: 'surface', stroke: 'muted', rx: 12 }) + scatter(cx, cy + 30, 70, 32, pairs(8), 2) + text(cx, cy + 66, 'fur', { a: 'middle', cls: 'small' }) + text(cx, cy - 58, 'rod', { a: 'middle', cls: 'small' }); }],
        ['Rub together', 'Contact lets electrons hop', function (cx, cy) { return rod(cx - 50, cy - 22, 100, 22, pairs(8), 3) + rect(cx - 40, cy, 80, 40, { fill: 'surface', stroke: 'muted', rx: 12 }) + scatter(cx, cy + 20, 70, 32, pairs(8), 4) + arrow(cx - 30, cy - 46, cx + 34, cy - 46, 'muted', 1.5, 7) + arrow(cx + 30, cy - 52, cx - 34, cy - 52, 'muted', 1.5, 7); }],
        ['Electrons move', 'e⁻ leave fur, go to rod', function (cx, cy) { return rod(cx - 50, cy - 50, 100, 22, pairs(8).concat(['−', '−', '−']), 5) + rect(cx - 40, cy + 10, 80, 40, { fill: 'surface', stroke: 'muted', rx: 12 }) + scatter(cx, cy + 30, 70, 32, ['+', '−', '+', '+', '+'], 6) + arrow(cx + 50, cy + 14, cx + 50, cy - 24, 'neg', 2, 8) + text(cx + 56, cy, 'e⁻', { c: 'neg', sz: 12 }); }],
        ['Separate', 'Rod −, fur + (equal amounts)', function (cx, cy) { return rod(cx - 50, cy - 60, 100, 22, ['−', '−', '−'], 7) + rect(cx - 40, cy + 20, 80, 40, { fill: 'surface', stroke: 'muted', rx: 12 }) + scatter(cx, cy + 40, 60, 30, ['+', '+', '+'], 8) + text(cx, cy, 'net: −3e and +3e', { a: 'middle', cls: 'small' }); }]
      ];
    } else if (method === 'conduction' && arr(p.spheres).length) {
      var sp = arr(p.spheres).filter(Boolean).slice(0, 3).map(function (s) { return Object.assign({}, s); });
      var allq = []; sp.forEach(function (s) { allq.push(s.before, s.after); });
      allq = allq.filter(isNum);
      var rel = allq.length && allq.every(function (q) { return Math.abs(q) >= 1e-2 || q === 0; });
      var qs = function (q) { return !isNum(q) ? '?' : q === 0 ? '0' : rel ? (q > 0 ? '+' : '') + num(q) : fq(q); };
      var qmx = Math.max.apply(null, allq.map(Math.abs).concat([1e-300]));
      var nm = function (s, i) { return String(s.label || 'ABC'[i]); };
      var tot = sp.reduce(function (t, s) { return t + (isNum(s.before) ? s.before : 0); }, 0);
      var rr = sp.length > 2 ? 18 : 24;
      var ball = function (cx, cy, q, lab, showQ) {
        var o = circle(cx, cy, rr, { fill: 'surface', stroke: 'text', sw: 2 });
        var n = isNum(q) && q !== 0 ? clamp(Math.round(5 * Math.abs(q) / qmx), 1, 5) : 0;
        for (var k = 0; k < n; k++) { var a = (k + 0.5) * 2 * Math.PI / n - Math.PI / 2; o += sign(cx + Math.cos(a) * (rr - 8), cy + Math.sin(a) * (rr - 8), q > 0 ? '+' : '−', 11); }
        if (!n) o += text(cx, cy + 4, '0', { a: 'middle', cls: 'small' });
        o += text(cx, cy - rr - 6, lab, { a: 'middle', w: 700, sz: 12 });
        if (showQ) o += text(cx, cy + rr + 16, qs(q), { a: 'middle', sz: 11, w: 700, c: chargeColor(q) });
        return o;
      };
      var row = function (cx, cy, key, gap) {
        var o = '', w = (sp.length - 1) * gap;
        sp.forEach(function (s, i) { o += ball(cx - w / 2 + i * gap, cy, s[key], nm(s, i), key !== 'mid'); });
        return o;
      };
      steps = [
        ['Before', 'Each sphere has its own charge', function (cx, cy) { return row(cx, cy, 'before', sp.length > 2 ? 44 : 64); }],
        ['Touch', 'One conductor: charge spreads out', function (cx, cy) {
          var o = row(cx, cy, 'mid', 2 * rr);
          return o + text(cx, cy + rr + 16, 'total ' + qs(tot), { a: 'middle', sz: 11, w: 700, c: chargeColor(tot) });
        }],
        ['Separate', 'Identical spheres share equally', function (cx, cy) { return row(cx, cy, 'after', sp.length > 2 ? 44 : 64); }],
        ['Check', 'Charge is conserved', function (cx, cy) {
          var bsum = sp.map(function (s) { return qs(s.before); }).join(' + '), asum = sp.map(function (s) { return qs(s.after); }).join(' + ');
          return text(cx, cy - 30, 'before:', { a: 'middle', cls: 'small' }) + text(cx, cy - 12, bsum, { a: 'middle', sz: 12 }) +
            text(cx, cy + 14, 'after:', { a: 'middle', cls: 'small' }) + text(cx, cy + 32, asum, { a: 'middle', sz: 12 }) +
            text(cx, cy + 58, 'total ' + qs(tot), { a: 'middle', w: 700, c: 'accent' });
        }]
      ];
      // spread total equally over spheres while touching
      sp.forEach(function (s) { s.mid = tot / sp.length; });
    } else if (method === 'conduction') {
      steps = [
        ['Charged rod', 'Neutral metal sphere', function (cx, cy) { return rod(cx - 60, cy - 70, 90, 20, rep('−', 6), 1) + sphere(cx + 10, cy + 10, 34) + scatter(cx + 10, cy + 10, 44, 40, pairs(6), 2); }],
        ['Touch', 'Excess e⁻ spread onto sphere', function (cx, cy) { return rod(cx - 62, cy - 42, 90, 20, rep('−', 6), 3) + sphere(cx + 10, cy + 10, 34) + scatter(cx + 10, cy + 10, 44, 40, pairs(6), 4) + arrow(cx - 4, cy - 26, cx + 12, cy - 4, 'neg', 2, 7) + text(cx + 30, cy - 18, 'e⁻', { c: 'neg', sz: 12 }); }],
        ['Pull rod away', 'Both keep some excess −', function (cx, cy) { return rod(cx - 60, cy - 70, 90, 20, rep('−', 3), 5) + sphere(cx + 10, cy + 10, 34) + sphereSplit(cx + 10, cy + 10, 34, ['−', '−'], ['−']); }],
        ['Result', 'Sphere has SAME sign as rod', function (cx, cy) { return sphere(cx, cy + 10, 34) + sphereSplit(cx, cy + 10, 34, ['−', '−'], ['−']) + text(cx, cy - 40, 'net −', { a: 'middle', c: 'neg', w: 700 }); }]
      ];
    } else if (method === 'induction') {
      steps = [
        ['Neutral sphere', 'Charges evenly mixed', function (cx, cy) { return sphere(cx + 10, cy, 36) + scatter(cx + 10, cy, 46, 44, pairs(6), 1); }],
        ['Bring − rod near', 'e⁻ pushed to far side', function (cx, cy) { return rod(cx - 68, cy - 10, 24, 20, rep('−', 2), 2) + sphere(cx + 18, cy, 36) + sphereSplit(cx + 18, cy, 36, ['+', '+', '+'], ['−', '−', '−']); }],
        ['Ground far side', 'e⁻ escape to ground', function (cx, cy) { return rod(cx - 68, cy - 10, 24, 20, rep('−', 2), 3) + sphere(cx + 14, cy, 36) + sphereSplit(cx + 14, cy, 36, ['+', '+', '+'], ['−']) + path('M' + (cx + 48) + ' ' + (cy + 10) + 'H' + (cx + 64) + 'V' + (cy + 40), 'text', 1.5) + ground(cx + 64, cy + 40) + arrow(cx + 72, cy + 6, cx + 72, cy + 34, 'neg', 2, 7); }],
        ['Remove both', 'Sphere has OPPOSITE sign', function (cx, cy) { return sphere(cx, cy, 36) + sphereSplit(cx, cy, 36, ['+'], ['+']) + sign(cx, cy - 22, '+', 12) + text(cx, cy - 50, 'net +', { a: 'middle', c: 'pos', w: 700 }); }]
      ];
    } else {
      var rnd = srand(9);
      var dips = function (cx, cy, aligned) {
        var out = rect(cx - 40, cy - 36, 80, 72, { fill: 'surface', stroke: 'muted', rx: 10 });
        for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) out += dipole(cx - 24 + j * 24, cy - 22 + i * 22, aligned ? 0 : rnd() * 6.28);
        return out;
      };
      steps = [
        ['Neutral insulator', 'Molecules point randomly', function (cx, cy) { return dips(cx, cy, false); }],
        ['+ rod near', 'Molecules stretch & align', function (cx, cy) { return rod(cx + 48, cy - 10, 22, 20, ['+', '+'], 1) + dips(cx - 10, cy, true); }],
        ['Net attraction', '− ends are closer → pull wins', function (cx, cy) { return rod(cx + 48, cy - 10, 22, 20, ['+', '+'], 2) + dips(cx - 10, cy, true) + arrow(cx - 10, cy + 50, cx + 30, cy + 50, 'accent', 2.5); }],
        ['Remove rod', 'Still neutral: net charge 0', function (cx, cy) { return dips(cx, cy, false); }]
      ];
    }
    var stage = String(p.stage || '').toLowerCase();
    var b = bg() + title('Charging by ' + method, 16, 24);
    steps.forEach(function (st, i) {
      var x = 8 + i * 158, cx = x + 75, hi = stage && (st[0].toLowerCase().indexOf(stage) >= 0 || stage.indexOf(st[0].toLowerCase()) >= 0 || stage === String(i + 1));
      b += rect(x, 40, 150, 266, { cls: hi ? '' : 'panel', fill: hi ? 'surface' : null, stroke: hi ? 'accent' : null, sw: hi ? 2.5 : 1, rx: 10 });
      b += circle(x + 18, 60, 10, { fill: 'accent' }) + text(x + 18, 64.5, String(i + 1), { a: 'middle', c: 'surface', w: 700, sz: 12 });
      b += text(x + 34, 64.5, st[0], { w: 700, sz: 12 });
      b += st[2](cx, 170);
      b += textLines(cx, 268, st[1], 22, { a: 'middle', cls: 'small' }, 14);
      if (i < 3) b += head(x + 155, 170, 0, 'muted', 8);
    });
    return svg('Charging by ' + method + ', step by step', b);
  }

  // ---- field map: numeric field lines + equipotentials ----
  function fieldMap(p) {
    var ch = arr(p.charges).filter(function (c) { return c && isNum(c.q) && isNum(c.x) && isNum(c.y) && c.q !== 0; });
    if (!ch.length) throw new Error('no charges');
    var Wd = 640, Hd = 320;
    var fp = p.point && isNum(p.point.x) && isNum(p.point.y) ? p.point : null;
    var xs = ch.map(function (c) { return c.x; }), ys = ch.map(function (c) { return c.y; });
    if (fp) { xs.push(fp.x); ys.push(fp.y); }
    var fpts = arr(p.points).filter(function (q) { return q && isNum(q.x) && isNum(q.y); });
    fpts.forEach(function (q) { xs.push(q.x); ys.push(q.y); });
    var mnx = Math.min.apply(null, xs), mxx = Math.max.apply(null, xs), mny = Math.min.apply(null, ys), mxy = Math.max.apply(null, ys);
    var needX = (mxx - mnx) + 2.6, needY = (mxy - mny) + (fp || p.points ? 2.8 : 2.0);
    var sc = Math.min(620 / needX, 300 / needY);
    var ccx = (mnx + mxx) / 2, ccy = (mny + mxy) / 2;
    var S = ch.map(function (c) { return { x: Wd / 2 + (c.x - ccx) * sc, y: Hd / 2 - (c.y - ccy) * sc, q: c.q }; });
    var qmax = Math.max.apply(null, ch.map(function (c) { return Math.abs(c.q); }));
    function field(x, y) { // in screen units (relative charges)
      var ex = 0, ey = 0;
      for (var i = 0; i < S.length; i++) {
        var dx = x - S[i].x, dy = y - S[i].y, r2 = dx * dx + dy * dy + 1e-6, r3 = r2 * Math.sqrt(r2);
        ex += S[i].q / qmax * dx / r3; ey += S[i].q / qmax * dy / r3;
      }
      return [ex, ey];
    }
    function hit(x, y, sgnWanted) {
      for (var i = 0; i < S.length; i++) if (Math.sign(S[i].q) === sgnWanted && Math.hypot(x - S[i].x, y - S[i].y) < 11) return S[i];
      return null;
    }
    var lines = [];
    function trace(x, y, dir, endSign) {
      var pts = [[x, y]], h = 3;
      for (var k = 0; k < 900; k++) {
        var e = field(x, y), m = Math.hypot(e[0], e[1]) || 1;
        var mx = x + dir * e[0] / m * h / 2, my = y + dir * e[1] / m * h / 2;
        var e2 = field(mx, my), m2 = Math.hypot(e2[0], e2[1]) || 1;
        x += dir * e2[0] / m2 * h; y += dir * e2[1] / m2 * h;
        pts.push([x, y]);
        if (x < -30 || x > Wd + 30 || y < -30 || y > Hd + 30) return { pts: pts, end: 'out' };
        if (hit(x, y, endSign)) return { pts: pts, end: 'charge' };
      }
      return { pts: pts, end: 'stall' };
    }
    var hasPos = S.some(function (s) { return s.q > 0; });
    S.forEach(function (s) {
      var n = Math.max(6, Math.round(16 * Math.abs(s.q) / qmax));
      for (var i = 0; i < n; i++) {
        var a = (i + 0.5) * 2 * Math.PI / n;
        var sx = s.x + Math.cos(a) * 13, sy = s.y + Math.sin(a) * 13;
        if (s.q > 0) { var t = trace(sx, sy, 1, -1); lines.push({ pts: t.pts, fwd: true }); }
        else {
          var t2 = trace(sx, sy, -1, 1);
          if (!hasPos || t2.end !== 'charge') lines.push({ pts: t2.pts, fwd: false });
        }
      }
    });
    var b = bg();
    // equipotentials via marching squares
    var gs = 8, nx = Wd / gs + 1, ny = Hd / gs + 1, Vg = [];
    var pot = function (x, y) { var v = 0; for (var i = 0; i < S.length; i++) v += S[i].q / qmax / (Math.hypot(x - S[i].x, y - S[i].y) + 1e-6); return v * sc; };
    for (var j = 0; j < ny; j++) { Vg.push([]); for (var i = 0; i < nx; i++) Vg[j].push(pot(i * gs, j * gs)); }
    var mixed = S.some(function (s) { return s.q > 0; }) && S.some(function (s) { return s.q < 0; });
    var levels = [];
    [0.35, 0.7, 1.4, 2.6].forEach(function (f) { levels.push(f, -f); });
    if (mixed) levels.push(0);
    var segs = '';
    levels.forEach(function (L) {
      for (var j = 0; j < ny - 1; j++) for (var i = 0; i < nx - 1; i++) {
        var v = [Vg[j][i], Vg[j][i + 1], Vg[j + 1][i + 1], Vg[j + 1][i]];
        var P = [[i * gs, j * gs], [(i + 1) * gs, j * gs], [(i + 1) * gs, (j + 1) * gs], [i * gs, (j + 1) * gs]];
        var cut = [];
        for (var e = 0; e < 4; e++) {
          var a = v[e], c = v[(e + 1) % 4];
          if ((a - L) * (c - L) < 0) {
            var t = (L - a) / (c - a), A = P[e], B = P[(e + 1) % 4];
            cut.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
          }
        }
        for (var k = 0; k + 1 < cut.length; k += 2) segs += 'M' + r1(cut[k][0]) + ' ' + r1(cut[k][1]) + 'L' + r1(cut[k + 1][0]) + ' ' + r1(cut[k + 1][1]);
      }
    });
    if (segs) b += '<path d="' + segs + '" style="fill:none;stroke:var(--muted);stroke-width:1.1;stroke-dasharray:3 3;opacity:.8"/>';
    lines.forEach(function (L) {
      var pts = L.pts;
      if (pts.length < 3) return;
      var d = '', step = 2;
      for (var i = 0; i < pts.length; i += step) d += (i ? 'L' : 'M') + r1(pts[i][0]) + ' ' + r1(pts[i][1]);
      var last = pts[pts.length - 1]; d += 'L' + r1(last[0]) + ' ' + r1(last[1]);
      b += path(d, 'text', 1.5, ';opacity:.85');
      // arrowhead along a visible part of the line
      var idx = Math.min(pts.length - 2, 18 + Math.floor(pts.length * 0.15));
      for (var q = idx; q < pts.length - 1; q++) { var pp = pts[q]; if (pp[0] > 8 && pp[0] < Wd - 8 && pp[1] > 8 && pp[1] < Hd - 8) { idx = q; break; } }
      var a0 = pts[idx], a1 = pts[idx + 1];
      var ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]) + (L.fwd ? 0 : Math.PI);
      b += head(a0[0], a0[1], ang, 'text', 8);
    });
    S.forEach(function (s, i) {
      b += charge(s.x, s.y, s.q, 11);
      var ql = qLabel(ch[i].q);
      b += rect(s.x - ql.length * 4 - 4, s.y - 31, ql.length * 8 + 8, 17, { fill: 'surface', op: 0.9, rx: 4 }) + text(s.x, s.y - 18, ql, { a: 'middle', w: 700, sz: 12, c: chargeColor(s.q) });
    });
    if (fp) {
      var fx = Wd / 2 + (fp.x - ccx) * sc, fy = Hd / 2 - (fp.y - ccy) * sc, Ex = 0, Ey = 0, Es = 0;
      ch.forEach(function (c) {
        var dx = fp.x - c.x, dy = fp.y - c.y, r2 = dx * dx + dy * dy;
        if (r2 > 0) { var f = c.q / (r2 * Math.sqrt(r2)); Ex += f * dx; Ey += f * dy; Es += Math.abs(c.q) / r2; }
      });
      var Em = Math.hypot(Ex, Ey);
      b += circle(fx, fy, 10, { fill: 'surface', op: 0.9 });
      if (Em > 1e-6 * Es) b += arrow(fx, fy, fx + Ex / Em * 48, fy - Ey / Em * 48, 'accent', 3.5);
      else b += text(fx + 10, fy + 20, 'E = 0', { c: 'accent', w: 700, halo: true });
      b += circle(fx, fy, 5.5, { fill: 'accent' }) + text(fx - 10, fy - 10, 'P', { a: 'end', c: 'accent', w: 700, halo: true });
    }
    fpts.forEach(function (q, i) {
      var qx = Wd / 2 + (q.x - ccx) * sc, qy = Hd / 2 - (q.y - ccy) * sc;
      b += circle(qx, qy, 5.5, { fill: 'accent', stroke: 'surface', sw: 2 }) + text(qx + 9, qy - 8, String(q.label || 'ABCDEFGH'[i] || ''), { c: 'accent', w: 700, halo: true });
    });
    b += rect(8, 8, 262, 22, { fill: 'surface', op: 0.85, rx: 6 }) + text(16, 23, 'solid → field lines  ·  dashed = equipotentials', { sz: 11 });
    if (p.ask) b += rect(8, Hd - 30, 624, 22, { fill: 'surface', op: 0.85, rx: 6 }) + text(320, Hd - 14, p.ask, { a: 'middle', sz: 12 });
    return svg('Field lines and equipotentials for the charge arrangement', b);
  }

  // ============ UNIT 2: CIRCUITS ============

  function elemKind(e) {
    if (!e) return 'wire';
    var l = String(e.label || '');
    if (/^ammeter/i.test(l)) return 'ammeter';
    if (/^voltmeter/i.test(l)) return 'voltmeter';
    if (e.bulb || /bulb|lamp/i.test(l)) return 'bulb';
    if (isNum(e.C) && !isNum(e.R)) return 'cap';
    if (isNum(e.R)) return 'res';
    if (/^S\d*$|switch/i.test(l)) return 'switch';
    if (/^C/.test(l)) return 'cap';
    if (/charger|battery|^ε|emf|source/i.test(l)) return 'source';
    return 'res';
  }
  function isCap(e) { return elemKind(e) === 'cap'; }
  function reqOf(n) {
    if (!n) return NaN;
    if (n.type === 'series') return arr(n.items).reduce(function (s, x) { return s + reqOf(x); }, 0);
    if (n.type === 'parallel') {
      var rs = arr(n.items).map(reqOf);
      if (rs.some(function (r) { return r === 0; })) return 0;
      var g = rs.reduce(function (s, r) { return s + (r === Infinity ? 0 : 1 / r); }, 0);
      return g === 0 ? Infinity : 1 / g;
    }
    if (n.node) return 0;
    if (n.open) return Infinity;
    if (n.short) return 0;
    var k = elemKind(n);
    if (k === 'cap' || (k === 'switch' && !n.closed)) return Infinity;
    if (k === 'switch') return 0;
    return isNum(n.R) ? n.R : NaN;
  }
  function powerOf(e) {
    if (e.open || e.short) return 0;
    return isNum(e.P) ? e.P : isNum(e.I) && isNum(e.R) ? e.I * e.I * e.R : isNum(e.V) && isNum(e.R) && e.R ? e.V * e.V / e.R : isNum(e.I) && isNum(e.V) ? e.I * e.V : NaN;
  }

  // element drawn horizontally, entry at (x, y), width EW
  var EW = 98, EH = 84, GAP = 4, RAIL = 20, NW = 30;
  function measure(n) {
    if (n && n.type === 'series') {
      var w = 0, h = 0;
      arr(n.items).forEach(function (x) { var m = measure(x); w += m.w; h = Math.max(h, m.h); });
      return { w: Math.max(w, 20), h: Math.max(h, 20) };
    }
    if (n && n.type === 'parallel') {
      var ww = 0, hh = 0, its = arr(n.items);
      its.forEach(function (x) { var m = measure(x); ww = Math.max(ww, m.w); hh += m.h; });
      return { w: ww + 2 * RAIL, h: hh + GAP * Math.max(0, its.length - 1) };
    }
    if (n && n.node) return { w: NW, h: EH };
    return { w: EW, h: EH };
  }
  function zigzag(x1, x2, y, c, w) {
    var mid = (x1 + x2) / 2, zl = Math.min(44, Math.abs(x2 - x1)), n = 6, d = 'M' + r1(x1) + ' ' + y + 'H' + r1(mid - zl / 2);
    for (var i = 0; i < n; i++) d += 'L' + r1(mid - zl / 2 + (i + 0.5) * zl / n) + ' ' + (y + (i % 2 ? 8 : -8));
    d += 'L' + r1(mid + zl / 2) + ' ' + y + 'H' + r1(x2);
    return path(d, c, w || 2);
  }
  function drawElem(e, x, y, ctx) {
    var x2 = x + EW, mid = x + EW / 2, hi = ctx.highlight && e.label === ctx.highlight, c = hi ? 'accent' : 'text', out = '';
    var lbl = String(e.label || ''), val = '', below = [];
    var P = powerOf(e);
    var dead = e.open || e.short || (isNum(e.I) && Math.abs(e.I) < 1e-9) || (isNum(P) && ctx.pmax > 0 && P < 1e-6 * ctx.pmax);
    var halo = function (yy, s, o) { o = o || {}; o.a = 'middle'; o.halo = true; return text(mid, yy, s, o); };
    if (e.open) {
      out += line(x, y, mid - 24, y, 'text', 2) + line(mid + 24, y, x2, y, 'text', 2);
      out += circle(mid - 24, y, 3, { fill: 'text' }) + circle(mid + 24, y, 3, { fill: 'text' });
      out += rect(mid - 18, y - 15, 36, 30, { stroke: hi ? 'accent' : 'muted', dash: '4 3', rx: 7 });
      out += halo(y - 22, lbl + ' removed', { sz: 12, c: hi ? 'accent' : 'muted', w: hi ? 700 : 400 });
      out += halo(y + 32, 'open: I = 0', { cls: 'small' });
      return out;
    }
    var ec = e.short ? 'muted' : c;
    if (e.short) {
      out += line(x, y, x + 12, y, 'text', 2) + line(x2 - 12, y, x2, y, 'text', 2);
      out += path('M' + r1(x + 12) + ' ' + y + 'V' + (y + 22) + 'H' + r1(x2 - 12) + 'V' + y, 'accent', 2.5);
      x += 12; x2 -= 12;
    }
    var lead = function (gapL, gapR) { return line(x, y, mid - gapL, y, e.short ? 'muted' : 'text', 2) + line(mid + gapR, y, x2, y, e.short ? 'muted' : 'text', 2); };
    var kind = elemKind(e);
    if (kind === 'cap') {
      out += lead(5, 5) + line(mid - 5, y - 15, mid - 5, y + 15, ec, 3) + line(mid + 5, y - 15, mid + 5, y + 15, ec, 3);
      val = isNum(e.C) ? fF(e.C) : '';
    } else if (kind === 'bulb') {
      var glow = !dead && ctx.pmax > 0 && isNum(P) ? clamp(P / ctx.pmax, 0.05, 1) : 0;
      out += lead(14, 14);
      if (glow) out += circle(mid, y, 15 + 6 * glow, { fill: 'warn', op: 0.15 + 0.5 * glow });
      out += circle(mid, y, 14, { fill: dead ? 'muted' : 'surface', op: dead ? 0.3 : null, stroke: ec, sw: 2 });
      out += path('M' + (mid - 10) + ' ' + (y + 10) + 'L' + (mid + 10) + ' ' + (y - 10) + 'M' + (mid - 10) + ' ' + (y - 10) + 'L' + (mid + 10) + ' ' + (y + 10), dead ? 'muted' : ec, 1.5);
      val = isNum(e.R) ? fOhm(e.R) : '';
      if (dead && !e.short) below.push('unlit');
    } else if (kind === 'ammeter' || kind === 'voltmeter') {
      out += lead(14, 14) + circle(mid, y, 14, { fill: 'surface', stroke: ec, sw: 2 });
      out += text(mid, y + 5, kind === 'ammeter' ? 'A' : 'V', { a: 'middle', w: 700, c: hi ? 'accent' : null });
      lbl = lbl.replace(/^(ammeter|voltmeter)\s*/i, '').replace(/^\((.*)\)$/, '$1') || (kind === 'ammeter' ? 'ammeter' : 'voltmeter');
      if (lbl === 'ammeter' || lbl === 'voltmeter') lbl = '';
      val = isNum(e.R) ? fOhm(e.R) : '';
    } else if (kind === 'switch') {
      out += line(x, y, mid - 16, y, ec, 2) + line(mid + 16, y, x2, y, ec, 2) + circle(mid - 16, y, 3, { fill: 'text' }) + circle(mid + 16, y, 3, { fill: 'text' });
      out += e.closed ? line(mid - 16, y, mid + 16, y, ec, 2) : line(mid - 16, y, mid + 13, y - 14, ec, 2);
    } else if (kind === 'res') {
      out += zigzag(x, x2, y, ec, 2);
      val = isNum(e.R) ? fOhm(e.R) : '';
    } else { // source (e.g. a charger)
      out += lead(20, 20) + rect(mid - 20, y - 13, 40, 26, { fill: 'surface', stroke: ec, sw: 2, rx: 6 });
      out += text(mid - 9, y + 4.5, '+', { a: 'middle', c: 'pos', w: 700 }) + text(mid + 9, y + 4.5, '−', { a: 'middle', c: 'neg', w: 700 });
    }
    if (val && (/^[\d.]/.test(lbl) || /[=Ω]|F\b/.test(lbl) || lbl.indexOf(val) >= 0)) val = '';
    if (lbl || val) out += halo(y - 22, (lbl && val ? lbl + ' = ' : lbl) + val + (e.short ? ' (shorted)' : ''), { sz: 12, c: hi ? 'accent' : e.short ? 'muted' : null, w: hi ? 700 : 400 });
    if (e.short) below = ['shorted: V = 0'];
    else {
      if (isNum(e.I) && !dead) below.push('I = ' + fI(e.I));
      if (isNum(e.V) && !dead) below.push('V = ' + fV(e.V));
      if (isNum(e.Q)) below.push('Q = ' + si(e.Q, 'C'));
    }
    below.forEach(function (t, i) { out += halo(y + (e.short ? 38 : 30) + i * 13, t, { cls: 'small' }); });
    if (isNum(e.I) && e.I > 1e-9 && !e.short) out += kind === 'source' ? head(x2 - 13, y, Math.PI, 'accent', 9) : head(x + 13, y, 0, 'accent', 9);
    return out;
  }
  function drawNet(n, x, y, w, ctx) { // fills width w from (x,y) to (x+w,y)
    var m = measure(n), out = '';
    if (n && n.type === 'series') {
      var its = arr(n.items), extra = w - m.w, cx = x, gap = its.length ? extra / its.length : 0;
      its.forEach(function (it) {
        var mi = measure(it), wi = mi.w + gap;
        out += drawNet(it, cx, y, wi, ctx);
        cx += wi;
      });
      if (!its.length) out += line(x, y, x + w, y, 'text', 2);
      return out;
    }
    if (n && n.type === 'parallel') {
      var items = arr(n.items), top = y - m.h / 2, ys = [];
      items.forEach(function (it) { var mi = measure(it); ys.push(top + mi.h / 2); top += mi.h + GAP; });
      if (!items.length) return line(x, y, x + w, y, 'text', 2);
      var xl = x + RAIL / 2, xr = x + w - RAIL / 2;
      out += line(x, y, xl, y, 'text', 2) + line(xr, y, x + w, y, 'text', 2);
      out += line(xl, ys[0], xl, ys[ys.length - 1], 'text', 2) + line(xr, ys[0], xr, ys[ys.length - 1], 'text', 2);
      out += circle(xl, y, 3, { fill: 'text' }) + circle(xr, y, 3, { fill: 'text' });
      items.forEach(function (it, i) {
        out += line(xl, ys[i], x + RAIL, ys[i], 'text', 2) + line(x + w - RAIL, ys[i], xr, ys[i], 'text', 2);
        out += drawNet(it, x + RAIL, ys[i], w - 2 * RAIL, ctx);
      });
      return out;
    }
    if (n && n.node) { // a labeled point on the wire: dot + letter
      var nx = x + w / 2;
      return line(x, y, x + w, y, 'text', 2) + circle(nx, y, 5, { fill: 'accent', stroke: 'surface', sw: 2 }) +
        text(nx, y - 11, String(n.node), { a: 'middle', c: 'accent', w: 700, sz: 15, halo: true });
    }
    var pad = (w - EW) / 2;
    return line(x, y, x + pad, y, 'text', 2) + drawElem(n || {}, x + pad, y, ctx) + line(x + pad + EW, y, x + w, y, 'text', 2);
  }
  function leaves(n, acc) {
    acc = acc || [];
    if (n && (n.type === 'series' || n.type === 'parallel')) arr(n.items).forEach(function (x) { leaves(x, acc); });
    else if (n) acc.push(n);
    return acc;
  }
  function battery(x, y, emf) { // vertical battery centered at (x,y); + (long plate) on top
    var out = line(x - 18, y - 6, x + 18, y - 6, 'text', 2) + line(x - 9, y + 6, x + 9, y + 6, 'text', 5);
    out += text(x + 24, y - 1, '+', { c: 'pos', w: 700 }) + (isNum(emf) ? text(x - 26, y + 5, 'ε = ' + fV(emf), { a: 'end', w: 700, halo: true }) : '');
    return out;
  }
  function normNet(net) {
    if (!net || typeof net !== 'object') return { type: 'series', items: [] };
    return net.type ? net : { type: 'series', items: [net] };
  }
  // circuit content in its own coordinates; returns {b, w, h}
  function circuitBody(net, emf, r, ctx, I) {
    var m = measure(net);
    var left = isNum(emf) ? 100 : 50, netW = Math.max(m.w, 220), topY = 36 + m.h / 2, botY = 36 + m.h + 40;
    var right = left + netW + 64;
    var Wv = right + 30, Hv = botY + (r ? 40 : 30);
    var b = drawNet(net, left + 34, topY, netW, ctx);
    b += line(left, topY, left + 34, topY, 'text', 2) + line(left + 34 + netW, topY, right, topY, 'text', 2);
    b += line(right, topY, right, botY, 'text', 2);
    var by = (topY + botY) / 2;
    if (r) {
      var rx = (left + right) / 2;
      b += line(right, botY, rx + 40, botY, 'text', 2) + zigzag(rx - 40, rx + 40, botY, 'muted', 2) + line(rx - 40, botY, left, botY, 'text', 2);
      b += text(rx, botY + 26, 'internal r = ' + fOhm(r), { a: 'middle', cls: 'small' });
    } else b += line(right, botY, left, botY, 'text', 2);
    b += line(left, botY, left, by + 6, 'text', 2) + line(left, by - 6, left, topY, 'text', 2);
    b += battery(left, by, emf);
    var foot = '';
    if (isNum(I)) {
      b += arrow(left, by - 14, left, Math.max(topY + 8, by - 44), 'accent', 2.5);
      b += text(left - 10, Math.max(topY + 16, by - 26), 'I = ' + fI(I), { a: 'end', c: 'accent', w: 700, halo: true });
    }
    return { b: b, w: Wv, h: Hv, foot: foot };
  }

  function circuit(p) {
    var net = normNet(p.net);
    var emf = p.emf, r = isNum(p.r) && p.r > 0 ? p.r : 0;
    var aft = p.after && typeof p.after === 'object' ? p.after : null;
    var netB = null, emfB = emf, rB = r;
    if (aft) {
      if (aft.net) { netB = normNet(aft.net); if (isNum(aft.emf)) emfB = aft.emf; if (isNum(aft.r)) rB = aft.r > 0 ? aft.r : 0; }
      else netB = normNet(aft);
    }
    var lv = leaves(net).concat(netB ? leaves(netB) : []);
    var pmax = Math.max.apply(null, lv.filter(function (e) { return e.bulb; }).map(powerOf).filter(isNum).concat([0]));
    var ctx = { highlight: p.highlight, pmax: pmax };
    var askH = p.ask ? 24 : 0;
    if (!netB) {
      var A = circuitBody(net, emf, r, ctx, p.I);
      var footH = A.foot ? 22 : 0;
      var sc = Math.min(1, 620 / A.w);
      var Hout = Math.max(220, A.h * sc + footH + askH + 8);
      var gx = (640 - A.w * sc) / 2;
      var body = bg(640, Hout) + '<g transform="translate(' + r1(gx) + ' 0) scale(' + sc.toFixed(4) + ')">' + A.b + '</g>';
      if (A.foot) body += text(624, A.h * sc + 10, A.foot, { a: 'end', cls: 'small' });
      if (p.ask) body += text(16, Hout - 10, String(p.ask), { sz: 12, w: 700, c: 'accent' });
      return svg('Circuit schematic', body, Math.round(Hout));
    }
    // before / after
    var P1 = circuitBody(net, emf, r, ctx, p.I), P2 = circuitBody(netB, emfB, rB, ctx, aft.I);
    var mw = Math.max(P1.w, P2.w), mh = Math.max(P1.h, P2.h);
    var sSide = Math.min(1, 308 / mw), hSide = 30 + mh * sSide + 26 + askH;
    var effSide = sSide * Math.min(1, 360 / hSide);
    var sStack = Math.min(1, 620 / mw), hStack = 2 * (28 + mh * sStack + 20) + askH;
    var effStack = sStack * Math.min(1, 360 / hStack);
    var b = '', H;
    var panel = function (P, x, y, s, w, ttl) {
      var o = rect(x, y, w, 26 + P.h * s + 22, { fill: 'surface', op: 0.5, stroke: 'border', sw: 1, rx: 10 });
      o += text(x + 12, y + 20, ttl, { w: 700, c: ttl === 'After' ? 'accent' : null });
      o += '<g transform="translate(' + r1(x + (w - P.w * s) / 2) + ' ' + r1(y + 20) + ') scale(' + s.toFixed(4) + ')">' + P.b + '</g>';
      if (P.foot) o += text(x + w - 10, y + 26 + P.h * s + 14, P.foot, { a: 'end', cls: 'small' });
      return o;
    };
    if (effSide >= effStack) {
      H = Math.round(hSide + 8);
      b += panel(P1, 4, 4, sSide, 314, 'Before') + panel(P2, 322, 4, sSide, 314, 'After');
    } else {
      var ph = 28 + mh * sStack + 20;
      H = Math.round(2 * ph + 16 + askH);
      b += panel(P1, 4, 4, sStack, 632, 'Before') + panel(P2, 4, 12 + ph, sStack, 632, 'After');
    }
    if (p.ask) b += text(16, H - 10, String(p.ask), { sz: 12, w: 700, c: 'accent' });
    return svg('Circuit before and after the change', bg(640, H) + b, H);
  }

  function loopPotential(p) {
    var emf = isNum(p.emf) ? p.emf : 0, I = p.I, r = isNum(p.r) ? p.r : 0;
    var el = arr(p.elements).filter(function (e) { return e && isNum(e.dV); }).map(function (e) { return { label: String(e.label || ''), dV: e.dV }; });
    var hasRise = el.some(function (e) { return e.dV > 0; });
    if (!hasRise) {
      var pre = [{ label: 'battery', dV: emf, bat: true }];
      if (r > 0 && isNum(I) && !el.some(function (e) { return /^r$|internal/i.test(e.label); })) pre.push({ label: 'r', dV: -I * r });
      el = pre.concat(el);
    } else el.forEach(function (e) { if (e.dV > 0) e.bat = true; });
    el.forEach(function (e) { if (/^(ε|emf|batt|E\d)/i.test(e.label)) e.src = true; if (e.bat) e.src = true; });
    var cum = [0], mx = 0, mn = 0;
    el.forEach(function (e) { var v = cum[cum.length - 1] + e.dV; cum.push(v); mx = Math.max(mx, v); mn = Math.min(mn, v); });
    var resid = cum[cum.length - 1];
    var tol = 0.01 * Math.max(Math.abs(mx), Math.abs(mn), 1e-9);
    if (Math.abs(resid) < tol) { cum = cum.map(function (v) { return Math.abs(v) < tol ? 0 : v; }); resid = 0; }
    var b = bg() + title('Voltage is height: the loop is a roller coaster');
    // small loop schematic
    var lx = 24, ly = 70, lw = 150, lh = 150;
    b += rect(lx, ly, lw, lh, { stroke: 'text', sw: 2 });
    var others = el.filter(function (e) { return el.indexOf(e) !== el.findIndex(function (x) { return x.bat; }); });
    b += rect(lx - 10, ly + lh / 2 - 10, 20, 20, { fill: 'surface-2' }) + line(lx - 12, ly + lh / 2 - 5, lx + 12, ly + lh / 2 - 5, 'text', 2) + line(lx - 6, ly + lh / 2 + 5, lx + 6, ly + lh / 2 + 5, 'text', 4);
    b += text(lx + 16, ly + lh / 2 + 4, 'ε', { w: 700, c: 'good' });
    var per = 2 * lw + lh, pos = function (t) { // along top → right → bottom (clockwise from top-left)
      var s = t * per;
      if (s < lw) return [lx + s, ly, 0];
      if (s < lw + lh) return [lx + lw, ly + s - lw, 1];
      return [lx + lw - (s - lw - lh), ly + lh, 2];
    };
    others.forEach(function (e, i) {
      var q = pos((i + 0.5) / others.length), ang = q[2] === 1 ? 90 : 0;
      b += '<g transform="translate(' + r1(q[0]) + ' ' + r1(q[1]) + ') rotate(' + ang + ')">' + rect(-18, -11, 36, 22, { fill: 'surface-2' }) + (e.src ? line(-4, -11, -4, 11, 'text', 2) + line(4, -6, 4, 6, 'text', 4) : zigzag(-18, 18, 0, e.label === 'r' ? 'muted' : 'pos', 1.8)) + '</g>';
      var lxp = q[0] + (q[2] === 1 ? 14 : 0), lyp = q[1] + (q[2] === 0 ? -14 : q[2] === 2 ? 24 : 4);
      b += text(lxp, lyp, e.label, { a: q[2] === 1 ? 'start' : 'middle', sz: 11 });
    });
    b += arrow(lx + 14, ly + 30, lx + 50, ly + 30, 'accent', 2, 8) + text(lx + 14, ly + 48, isNum(I) ? 'I = ' + fI(I) : 'I', { c: 'accent', sz: 11 });
    // coaster plot
    var gx0 = 250, gx1 = 620, gy0 = 64, gy1 = 262;
    var Y = function (v) { return gy1 - (v - mn) / ((mx - mn) || 1) * (gy1 - gy0); };
    var nE = el.length, flat = 14, segW = (gx1 - gx0 - flat * (nE + 1)) / Math.max(nE, 1);
    b += arrow(gx0 - 12, gy1 + 14, gx0 - 12, gy0 - 14, 'muted', 1.5, 8) + text(gx0 - 18, gy0 - 18, 'V', { w: 700, a: 'middle' });
    b += dline(gx0, Y(0), gx1, Y(0), 'muted', 1);
    var x = gx0, d = 'M' + gx0 + ' ' + r1(Y(0)), area = d, marks = '', cart = null;
    x += flat; d += 'H' + r1(x);
    el.forEach(function (e, i) {
      var v0 = cum[i], v1 = cum[i + 1], xa = x, xb = x + segW;
      var c = e.dV > 0 ? 'good' : e.src ? 'warn' : 'pos';
      d += 'C' + r1(xa + segW * 0.45) + ' ' + r1(Y(v0)) + ' ' + r1(xb - segW * 0.45) + ' ' + r1(Y(v1)) + ' ' + r1(xb) + ' ' + r1(Y(v1));
      marks += text((xa + xb) / 2 + (e.dV > 0 ? -8 : 8), (Y(v0) + Y(v1)) / 2 + (e.dV > 0 ? 0 : -6), sgn(e.dV, fV(e.dV)), { a: e.dV > 0 ? 'end' : 'start', c: c, w: 700, sz: 12 });
      marks += text((xa + xb) / 2, gy1 + 28, e.label + (e.src && e.dV < 0 ? ' (backward)' : ''), { a: 'middle', sz: 11, c: e.src && e.dV < 0 ? 'warn' : null });
      if (e.bat && !cart) cart = [xb + flat / 2, Y(v1)];
      x = xb + flat; d += 'H' + r1(x);
    });
    area = d + 'V' + r1(gy1 + 12) + 'H' + gx0 + 'Z';
    b += '<path d="' + area + '" style="fill:var(--accent);fill-opacity:.08;stroke:none"/>';
    b += path(d, 'text', 3);
    // tie sleepers
    b += marks;
    // plateau values
    var xx = gx0 + flat;
    cum.forEach(function (v, i) {
      if (i === 0) return;
      xx += segW;
      b += text(xx + flat / 2, Y(v) + 18, num(v) + ' V', { a: 'middle', cls: 'small' });
      xx += flat;
    });
    if (cart) {
      var cx = cart[0], cy = cart[1];
      b += rect(cx - 13, cy - 22, 26, 14, { fill: 'accent', rx: 4 }) + circle(cx - 7, cy - 5, 4, { fill: 'text' }) + circle(cx + 7, cy - 5, 4, { fill: 'text' });
      b += text(cx, cy - 11, '+', { a: 'middle', c: 'surface', w: 700, sz: 12 });
    }
    b += text(gx0, 312, resid === 0 ? 'Back to the start height: ΣΔV = 0 around the loop (Kirchhoff’s loop rule)' : 'Sum of ΔV = ' + fV(resid) + ' (should be 0 for a closed loop)', { cls: 'small' });
    b += text(24, 260, 'Battery lifts charges up;', { cls: 'small' }) + text(24, 276, 'resistors are the drops.', { cls: 'small' });
    return svg('Potential around a circuit loop drawn as a roller coaster', b);
  }

  function junction(p) {
    var ins = arr(p.ins).filter(Boolean), outs = arr(p.outs).filter(Boolean), unk = p.unknown;
    var cx = 320, cy = 160, all = ins.concat(outs);
    var mxI = Math.max.apply(null, all.map(function (e) { return isNum(e.I) ? Math.abs(e.I) : 0; }).concat([1e-300]));
    var b = bg() + title('Junction rule: current in = current out');
    var draw = function (list, isIn) {
      list.forEach(function (e, i) {
        var n = list.length, a = (isIn ? Math.PI : 0) + (n > 1 ? (i / (n - 1) - 0.5) * 1.0 : 0);
        var ux = Math.cos(a), uy = Math.sin(a), R0 = 22, R1 = 170;
        var w = isNum(e.I) ? 1.5 + 4 * Math.abs(e.I) / mxI : 2;
        var hu = e.label === unk, c = hu ? 'accent' : isIn ? 'good' : 'warn';
        b += line(cx + ux * R0, cy + uy * R0, cx + ux * R1, cy + uy * R1, c, w);
        var hx = cx + ux * (R0 + R1) / 2, hy = cy + uy * (R0 + R1) / 2;
        b += head(hx, hy, isIn ? a + Math.PI : a, c, 10 + w * 1.5);
        var tx = cx + ux * (R1 + 10), ty = cy + uy * (R1 + 10) + 4;
        var s = String(e.label || '') + ' = ' + (hu ? '? ' + (isNum(e.I) ? '(' + fI(e.I) + ')' : '') : fI(e.I));
        b += text(tx, ty, s, { a: isIn ? 'end' : 'start', c: hu ? 'accent' : null, w: hu ? 700 : 400 });
      });
    };
    draw(ins, true); draw(outs, false);
    b += circle(cx, cy, 7, { fill: 'text' });
    var sum = function (l) { return l.map(function (e) { return isNum(e.I) ? num(e.I) : '?'; }).join(' + ') || '0'; };
    var tin = ins.reduce(function (s, e) { return s + (isNum(e.I) ? e.I : 0); }, 0);
    b += text(320, 280, 'In: ' + sum(ins) + '  =  Out: ' + sum(outs) + '   (' + fI(tin) + ')', { a: 'middle', w: 700 });
    b += text(320, 302, 'Charge can’t pile up at a point, so every amp that arrives must leave', { a: 'middle', cls: 'small' });
    return svg('Kirchhoff junction rule', b);
  }

  function ohm(p) {
    var V = p.V, I = p.I, R = p.R;
    if (!isNum(V) && isNum(I) && isNum(R)) V = I * R;
    if (!isNum(I) && isNum(V) && isNum(R) && R) I = V / R;
    if (!isNum(R) && isNum(V) && isNum(I) && I) R = V / I;
    var P = isNum(p.P) ? p.P : (isNum(V) && isNum(I) ? V * I : NaN);
    var b = bg() + title('Ohm’s law: V = IR');
    var l = 50, r = 240, t = 80, bt = 230, my = (t + bt) / 2;
    b += zigzag(l, r, t, 'text', 2) + line(r, t, r, bt, 'text', 2) + line(r, bt, l, bt, 'text', 2) + line(l, bt, l, my + 6, 'text', 2) + line(l, my - 6, l, t, 'text', 2);
    b += line(l - 18, my - 6, l + 18, my - 6, 'text', 2) + line(l - 9, my + 6, l + 9, my + 6, 'text', 5);
    b += text(l + 24, my + 4, 'V = ' + fV(V), { w: 700 }) + text((l + r) / 2, t - 18, 'R = ' + fOhm(R), { a: 'middle', w: 700 });
        b += arrow(r + 14, t + 40, r + 14, t + 90, 'accent', 2.5) + text(r + 20, t + 70, 'I = ' + fI(I), { c: 'accent', w: 700 });
    if (isNum(P)) b += text(l, 270, 'P = IV = ' + fW(P), { cls: 'small' });
    // I-V graph
    var gx0 = 360, gx1 = 610, gy0 = 50, gy1 = 270;
    b += arrow(gx0, gy1, gx1, gy1, 'text', 1.5, 8) + arrow(gx0, gy1, gx0, gy0, 'text', 1.5, 8);
    b += text(gx1, gy1 + 22, 'V', { a: 'end', w: 700 }) + text(gx0 - 10, gy0 + 6, 'I', { a: 'end', w: 700 });
    if (isNum(V) && isNum(I) && V > 0 && I > 0) {
      var X = function (v) { return gx0 + v / (V * 1.3) * (gx1 - gx0 - 10); }, Y = function (i) { return gy1 - i / (I * 1.3) * (gy1 - gy0 - 10); };
      b += line(X(0), Y(0), X(V * 1.25), Y(I * 1.25), 'accent', 2.5);
      b += dline(X(V), Y(I), X(V), gy1) + dline(X(V), Y(I), gx0, Y(I)) + circle(X(V), Y(I), 5, { fill: 'accent' });
      b += text(X(V), gy1 + 16, fV(V), { a: 'middle', cls: 'small' }) + text(gx0 - 6, Y(I) + 4, fI(I), { a: 'end', cls: 'small' });
      b += line(X(V * 0.4), Y(I * 0.4), X(V * 0.7), Y(I * 0.4), 'muted', 1.5) + line(X(V * 0.7), Y(I * 0.4), X(V * 0.7), Y(I * 0.7), 'muted', 1.5);
      b += text(X(V * 0.7) + 8, Y(I * 0.4) + 16, 'slope = I/V = 1/R', { cls: 'small' });
    }
    b += text(gx0, 304, 'Straight line through 0: steeper = smaller R', { cls: 'small' });
    return svg('Ohm’s law circuit and I–V graph', b);
  }

  function resistivity(p) {
    var rho = p.rho, L = p.L, A = p.A;
    var R = isNum(p.R) ? p.R : (isNum(rho) && isNum(L) && isNum(A) && A ? rho * L / A : NaN);
    var b = bg() + title('Resistance of a wire: R = ρL / A' + (p.material ? '  (' + p.material + ')' : ''));
    var x1 = 110, x2 = 500, y = 140, ry = 30, rx = 12;
    b += rect(x1, y - ry, x2 - x1, 2 * ry, { fill: 'warn', op: 0.18 });
    b += line(x1, y - ry, x2, y - ry, 'text', 2) + line(x1, y + ry, x2, y + ry, 'text', 2);
    b += '<ellipse cx="' + x2 + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" style="fill:var(--surface-2);stroke:var(--text);stroke-width:2"/>';
    b += '<ellipse cx="' + x1 + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" style="fill:var(--accent);fill-opacity:.35;stroke:var(--accent);stroke-width:2"/>';
    b += arrow(x1 - 60, y - 60, x1 - 6, y - 14, 'accent', 1.5, 8) + text(x1 - 64, y - 66, 'A = ' + fA(A), { a: 'middle', c: 'accent', w: 700 });
    b += dim(x1, y + 60, x2, 'L = ' + fm(L));
    for (var i = 0; i < 4; i++) b += arrow(x1 + 60 + i * 90, y, x1 + 100 + i * 90, y, 'muted', 1.5, 7);
    b += text(x2 + 24, y + 4, 'I →', { c: 'muted' });
    b += text(40, 250, 'ρ = ' + num(rho) + ' Ω·m', {}) + text(40, 274, 'R = ρL/A = ' + fOhm(R), { c: 'accent', w: 700, sz: 15 });
    b += text(620, 250, 'Longer wire → more R (×L)', { a: 'end', cls: 'small' }) + text(620, 268, 'Thicker wire → less R (÷A)', { a: 'end', cls: 'small' });
    b += text(620, 286, 'Double the diameter → A × 4 → R ÷ 4', { a: 'end', cls: 'small' });
    return svg('Wire resistance from resistivity, length and area', b);
  }

  function power(p) {
    var el = arr(p.elements).filter(Boolean).map(function (e) {
      var P = isNum(e.P) ? e.P : isNum(e.I) && isNum(e.V) ? e.I * e.V : isNum(e.I) && isNum(e.R) ? e.I * e.I * e.R : isNum(e.V) && isNum(e.R) && e.R ? e.V * e.V / e.R : NaN;
      return { e: e, P: P };
    });
    var H = Math.max(320, 80 + el.length * 48);
    var pm = Math.max.apply(null, el.map(function (x) { return isNum(x.P) ? x.P : 0; }).concat([1e-300]));
    var b = bg(640, H) + title('Power: P = IV = I²R = V²/R  (brightness ∝ P)');
    el.forEach(function (x, i) {
      var y = 70 + i * 48, e = x.e, f = isNum(x.P) ? x.P / pm : 0, bulb = e.bulb || /bulb|lamp/i.test(String(e.label || ''));
      var top = isNum(x.P) && x.P === pm;
      if (bulb) {
        b += circle(40, y, 10 + 12 * f, { fill: 'warn', op: 0.1 + 0.35 * f });
        b += circle(40, y, 10, { fill: 'surface', stroke: 'text', sw: 1.5 }) + path('M33 ' + (y + 7) + 'L47 ' + (y - 7) + 'M33 ' + (y - 7) + 'L47 ' + (y + 7), 'text', 1.2);
      } else b += zigzag(22, 58, y, 'text', 1.5);
      b += text(72, y - 3, String(e.label || 'element ' + (i + 1)), { w: 700 });
      var det = [];
      if (isNum(e.R)) det.push('R = ' + fOhm(e.R));
      if (isNum(e.I)) det.push('I = ' + fI(e.I));
      if (isNum(e.V)) det.push('V = ' + fV(e.V));
      b += text(72, y + 13, det.join('  '), { cls: 'small' });
      b += rect(260, y - 10, 220 * f, 20, { fill: top ? 'accent' : 'warn', op: top ? 0.9 : 0.6, rx: 4 });
      b += text(260 + 220 * f + 8, y + 5, fW(x.P) + (top && el.length > 1 ? '  ★ brightest' : ''), { c: top ? 'accent' : null, w: top ? 700 : 400 });
    });
    b += text(20, H - 14, 'Series: same I, bigger R gets more P.  Parallel: same V, smaller R gets more P.', { cls: 'small' });
    return svg('Power dissipated by each circuit element', b, H);
  }

  function rc(p) {
    var emf = p.emf, R = p.R, C = p.C;
    var Q = isNum(p.Q) ? p.Q : isNum(C) && isNum(emf) ? C * emf : NaN;
    var Vc = isNum(p.Vc) && p.phase === 'steady' ? p.Vc : emf;
    if (p.phase !== 'steady') Q = isNum(C) && isNum(emf) ? C * emf : NaN;
    var I0 = isNum(emf) && isNum(R) && R ? emf / R : NaN;
    var b = bg() + title('Capacitor in a DC circuit');
    var panel = function (x0, steady) {
      var hi = (p.phase === 'steady') === steady, out = '';
      out += rect(x0, 40, 300, 266, { fill: 'surface', stroke: hi ? 'accent' : 'border', sw: hi ? 2.5 : 1, rx: 10 });
      out += text(x0 + 150, 62, steady ? 'Long time later (steady state)' : 'Just after switch closes', { a: 'middle', w: 700, c: hi ? 'accent' : null });
      var l = x0 + 50, r = x0 + 250, t = 100, bt = 220, my = (t + bt) / 2;
      out += zigzag(l, r, t, 'text', 2) + text((l + r) / 2, t - 14, 'R = ' + fOhm(R), { a: 'middle', sz: 12 });
      out += line(r, t, r, my - 6, 'text', 2) + line(r, my + 6, r, bt, 'text', 2);
      out += line(r - 16, my - 6, r + 16, my - 6, 'text', 3) + line(r - 16, my + 6, r + 16, my + 6, 'text', 3);
      out += text(r - 22, my + 4, 'C', { a: 'end', w: 700 });
      if (steady) {
        out += text(r + 22, my - 4, '+', { c: 'pos', w: 700 }) + text(r + 22, my + 16, '−', { c: 'neg', w: 700 });
      }
      out += line(r, bt, l, bt, 'text', 2) + line(l, bt, l, my + 6, 'text', 2) + line(l, my - 6, l, t, 'text', 2);
      out += line(l - 16, my - 6, l + 16, my - 6, 'text', 2) + line(l - 8, my + 6, l + 8, my + 6, 'text', 5);
      out += text(l + 22, my + 4, 'ε = ' + fV(emf), { sz: 12 });
      if (!steady) {
        out += arrow(l + 30, t - 0.01, l + 70, t, 'accent', 2.5) + arrow(r - 60, bt, r - 100, bt + 0.01, 'accent', 2.5);
        out += text(x0 + 150, 252, 'C acts like a plain wire (Q = 0, no V across C)', { a: 'middle', sz: 12 });
        out += text(x0 + 150, 274, 'I = ε/R = ' + fI(I0), { a: 'middle', c: 'accent', w: 700 });
      } else {
        out += text(x0 + 150, 252, 'C is full: acts like a break (I = 0)', { a: 'middle', sz: 12 });
        out += text(x0 + 150, 274, 'V across C = ' + fV(Vc) + ',  Q = CV = ' + si(Q, 'C'), { a: 'middle', c: 'accent', w: 700 });
      }
      out += text(x0 + 150, 294, 'C = ' + fF(C), { a: 'middle', cls: 'small' });
      return out;
    };
    b += panel(10, false) + panel(330, true);
    return svg('Capacitor in a DC circuit: just after closing vs steady state', b);
  }

  var R = {
    coulomb: coulomb, superposition: superposition, 'point-field': pointField, 'uniform-field': uniformField,
    potential: potential, 'pe-pair': pePair, 'work-dv': workDV, capacitor: capacitor, charging: charging,
    'field-map': fieldMap, concept: concept,
    circuit: circuit, 'loop-potential': loopPotential, junction: junction, ohm: ohm, resistivity: resistivity,
    power: power, rc: rc
  };

  function render(key, params) {
    uid++;
    var fn = R[key];
    if (!fn) return placeholder(key);
    try {
      var out = fn(params && typeof params === 'object' ? params : {});
      if (typeof out === 'string' && out.indexOf('<svg') === 0) return out;
    } catch (e) {
      if (window.console && console.warn) console.warn('PRVisuals ' + key + ':', e);
    }
    if (key === 'concept') return placeholder('explanation');
    return placeholder(key);
  }

  return { render: render, keys: Object.keys(R), fmt: { num: num, si: si } };
})();
