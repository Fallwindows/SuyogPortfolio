// AP Physics 1 · Unit 1 — Kinematics.
// Visual, first-principles lessons. Pushes lesson objects onto window.LESSONS.
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);
  const { col, clamp, lerp, rgba, sci, signed, eq, call, check, arrow, text, roundRect, tag, axes, plot, stage, drag, loop } = window.PRKit;

  const G = 9.8; // m/s²

  // ---------- small helpers ----------
  const fix = (x, n = 1) => {
    const v = Math.abs(x) < 0.5 * Math.pow(10, -n) ? 0 : x;
    return v.toFixed(n).replace('-', '−');
  };
  const sfix = (x, n = 1) => (x > 0.5 * Math.pow(10, -n) ? '+' : '') + fix(x, n);
  const deg = (r) => (r * 180) / Math.PI;
  const rad = (d) => (d * Math.PI) / 180;

  function ball(ctx, x, y, r, color) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color || col('--accent'); ctx.fill();
  }
  // A side-view car centred at (x, y = road level), facing +x if dir >= 0.
  function car(ctx, x, y, dir = 1, size = 1) {
    const w = 34 * size, h = 12 * size;
    ctx.save();
    ctx.translate(x, y);
    if (dir < 0) ctx.scale(-1, 1);
    ctx.fillStyle = col('--accent');
    roundRect(ctx, -w / 2, -h - 6 * size, w, h, 4 * size); ctx.fill();
    roundRect(ctx, -w / 4, -h - 13 * size, w / 2.2, 9 * size, 3 * size); ctx.fill();
    ctx.fillStyle = col('--text');
    ctx.beginPath(); ctx.arc(-w / 3.2, -5 * size, 4.5 * size, 0, Math.PI * 2); ctx.arc(w / 3.2, -5 * size, 4.5 * size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Number-line ruler from x = a to b (world m) drawn at screen y, with mapper X.
  function ruler(ctx, X, a, b, y, step, labelEvery) {
    ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(X(a), y); ctx.lineTo(X(b), y); ctx.stroke();
    const s0 = Math.ceil(a / step) * step;
    for (let v = s0; v <= b + 1e-9; v += step) {
      const big = Math.abs(v / labelEvery - Math.round(v / labelEvery)) < 1e-6;
      ctx.beginPath(); ctx.moveTo(X(v), y - (big ? 6 : 3)); ctx.lineTo(X(v), y + (big ? 6 : 3)); ctx.stroke();
      if (big) text(ctx, fix(v, 0), X(v), y + 16, { color: col('--muted'), size: 11 });
    }
  }
  // "nice" step for an axis spanning `span`
  function niceStep(span, target = 8) {
    const raw = span / target, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  const q = (host) => (k) => host.querySelector(`[data-k="${k}"]`);

  // =====================================================================
  // 1. Position, distance, displacement
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 1, id: 'p1u1-describe', title: 'Position, distance, and displacement',
    render(el) {
      el.innerHTML = `
<p class="lead">Before we can talk about <i>why</i> things move, we need a precise way to say <i>how</i> they move. Kinematics is that language. It starts with one simple question: where is the object, and compared to what?</p>

<h2>Position needs an origin</h2>
<p>"The cafe is 300 m away" is useless unless you know 300 m <i>from where</i> and <i>which way</i>. Physics fixes this with a <b>coordinate system</b>: pick a point called the <b>origin</b> (x = 0), and pick which direction counts as <b>positive</b>. Then an object's <b>position</b> \\(x\\) is a signed number: how far it is from the origin, with the sign saying which side.</p>
<ul>
<li>x = +4 m: 4 m on the positive side of the origin.</li>
<li>x = −3 m: 3 m on the negative side.</li>
<li>x = 0: right at the origin.</li>
</ul>
<p>You get to choose the origin and the positive direction. Different choices give different position numbers, but (as you'll see in the sim) they never change the physics.</p>

<h2>Scalars and vectors</h2>
<p>Some quantities only need a size: mass (3 kg), time (5 s), temperature. These are <b>scalars</b>. Others need a size <i>and</i> a direction: "4 m to the left" is not the same as "4 m to the right." These are <b>vectors</b>. In one dimension, the direction is carried by the <b>sign</b>: + means the positive direction, − means the negative direction.</p>
${call('idea', 'Big idea', 'A vector in 1D is just a signed number. The sign is not "less than zero" in the everyday sense; it is a direction. A velocity of −8 m/s is <i>not</i> slower than +2 m/s. It is faster, pointed the other way.')}

<h2>Displacement: the change in position</h2>
<p>When an object moves from \\(x_i\\) to \\(x_f\\), its <b>displacement</b> is the straight-line change from start to finish:</p>
${eq('\\[ \\Delta x = x_f - x_i \\]', 'where \\(\\Delta x\\) = displacement (m), a vector: + if the object ended up on the positive side of where it started; \\(x_f\\) = final position (m); \\(x_i\\) = initial position (m). The Greek letter \\(\\Delta\\) ("delta") always means "final minus initial."')}
<p>Displacement only cares about the start and the end. Walk 10 m forward and 10 m back, and your displacement is zero, no matter how tired you are.</p>

<h2>Distance: the odometer</h2>
<p><b>Distance</b> is the total length of the path you actually covered. It is a scalar and can never be negative or go down, like a car's odometer. Distance is always at least as big as the size of the displacement:</p>
${eq('\\[ d \\ge |\\Delta x| \\]', 'where \\(d\\) = distance traveled (m, scalar, never negative); \\(|\\Delta x|\\) = magnitude of the displacement (m). They are equal only when the object moves in one direction without ever turning around.')}

<p>Drag the walker along the number line. The dashed trail shows the path over time (top = the start, bottom = now). Watch the two readouts: displacement can shrink when you turn back; distance only grows.</p>
<div class="sim" data-sim="line">
  <canvas></canvas>
  <div class="sim-controls">
    <button class="btn small" data-k="reset">Start a new trip here</button>
    <label>Origin at <select data-k="origin"><option value="0">the middle</option><option value="-10">the left end</option><option value="4">the tree (x = 4 m)</option></select></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Move the origin: every position number changes, but the displacement and distance stay exactly the same. Displacement is a <i>change</i>, so it doesn't care where zero is.</div>
</div>

${call('analogy', 'Analogy: a GPS and an odometer', 'Displacement is the arrow a GPS would draw "as the crow flies" from where you started to where you are now. Distance is the car\'s odometer: it counts every meter, including the U-turns.')}
${call('mistake', 'Common mistakes', '<ul><li>Treating a negative displacement as "less movement." −6 m is 6 m of displacement pointed in the negative direction.</li><li>Adding distances when the question asks for displacement. Back-and-forth trips cancel in displacement.</li><li>Forgetting that position depends on your origin. Always say (or draw) where x = 0 is.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect to state and justify your coordinate choice ("take right as positive"), to compare distance and displacement for a round trip, and to identify which quantities are vectors (displacement, velocity, acceleration, force) versus scalars (distance, speed, time, mass, energy).')}
${check('A dog runs 5 m east, then 8 m west. Taking east as positive, what are its distance and displacement?', ['Distance 13 m, displacement −3 m', 'Distance 3 m, displacement −3 m', 'Distance 13 m, displacement +13 m', 'Distance −3 m, displacement 13 m'], 0, 'Distance adds every leg: 5 + 8 = 13 m. Displacement is the net change: +5 − 8 = −3 m, i.e. 3 m west of the start.')}
${check('Which of these is a vector?', ['The time a race takes', 'The total distance of a hike', 'The displacement of a runner after one lap', 'The mass of a cart'], 2, 'Displacement has a direction (even if it is zero after a full lap, it is still a vector quantity). Time, distance and mass only have a size.')}
${check('A runner finishes a 400 m lap exactly where she started. Her displacement is…', ['400 m', '0 m', '−400 m', '200 m'], 1, 'Start and finish are the same point, so \\(x_f - x_i = 0\\). The 400 m is the distance.')}
`;
      const host = el.querySelector('[data-sim="line"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      const XM = 10;
      const s = { x: 2, x0: 2, dist: 0, trail: [2], o: 0 };
      const geom = (w, h) => {
        const pad = 26, sx = (w - 2 * pad) / (2 * XM);
        return { pad, sx, X: (x) => pad + (x + XM) * sx, yl: h * 0.74 };
      };
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const { X, yl } = geom(w, h);
        // the tree landmark
        ctx.fillStyle = col('--good');
        ctx.beginPath(); ctx.arc(X(4), yl - 32, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col('--muted'); ctx.fillRect(X(4) - 2, yl - 24, 4, 18);
        // trail (time runs downward)
        const n = s.trail.length;
        if (n > 1) {
          const top = 14, bot = yl - 56;
          ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = rgba(col('--muted'), 0.8); ctx.lineWidth = 1.5;
          ctx.beginPath();
          s.trail.forEach((x, i) => { const y = top + ((bot - top) * i) / (n - 1); if (i) ctx.lineTo(X(x), y); else ctx.moveTo(X(x), y); });
          ctx.stroke(); ctx.restore();
          text(ctx, 'start', X(s.trail[0]) + 6, 14, { align: 'left', size: 11, color: col('--muted') });
        }
        // number line (labels relative to chosen origin)
        ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(-XM), yl); ctx.lineTo(X(XM), yl); ctx.stroke();
        arrow(ctx, X(XM) - 4, yl, X(XM) + 10, yl, col('--muted'), 1.2, 8);
        for (let v = -XM; v <= XM; v++) {
          const lab = v - s.o;
          const big = lab % 2 === 0;
          ctx.beginPath(); ctx.moveTo(X(v), yl - (big ? 6 : 3)); ctx.lineTo(X(v), yl + (big ? 6 : 3)); ctx.stroke();
          if (big) text(ctx, String(lab).replace('-', '−'), X(v), yl + 18, { color: lab === 0 ? col('--accent') : col('--muted'), size: 11, weight: lab === 0 ? 700 : 500 });
        }
        text(ctx, 'x (m) →', X(XM), yl + 36, { align: 'right', color: col('--muted'), size: 11 });
        text(ctx, 'O', X(s.o), yl + 34, { color: col('--accent'), weight: 700 });
        // start flag
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(s.x0), yl); ctx.lineTo(X(s.x0), yl - 30); ctx.stroke();
        ctx.fillStyle = col('--warn'); ctx.beginPath(); ctx.moveTo(X(s.x0), yl - 30); ctx.lineTo(X(s.x0) + 14, yl - 25); ctx.lineTo(X(s.x0), yl - 20); ctx.fill();
        // displacement arrow
        if (Math.abs(s.x - s.x0) > 0.05) {
          arrow(ctx, X(s.x0), yl - 44, X(s.x), yl - 44, col('--accent'), 3, 10);
          text(ctx, `Δx = ${sfix(s.x - s.x0)} m`, (X(s.x0) + X(s.x)) / 2, yl - 56, { color: col('--accent'), weight: 700 });
        }
        // walker
        ball(ctx, X(s.x), yl, 11, col('--accent'));
        ctx.strokeStyle = col('--surface'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(s.x), yl, 11, 0, Math.PI * 2); ctx.stroke();
        ro.innerHTML = `<span>position x = <b>${sfix(s.x - s.o)} m</b></span><span>start x<sub>i</sub> = <b>${sfix(s.x0 - s.o)} m</b></span><span>displacement Δx = <b style="color:var(--accent)">${sfix(s.x - s.x0)} m</b></span><span>distance d = <b>${fix(s.dist)} m</b></span>`;
      }
      const st = stage(cv, 0.42, draw);
      drag(
        cv,
        (px, py) => { const g = geom(st.w, st.h); return Math.abs(px - g.X(s.x)) < 20 && Math.abs(py - g.yl) < 26 ? s : null; },
        (it, px) => {
          const g = geom(st.w, st.h);
          const nx = Math.round(clamp((px - g.pad) / g.sx - XM, -XM, XM) * 10) / 10;
          if (nx === s.x) return;
          s.dist += Math.abs(nx - s.x); s.x = nx;
          const last = s.trail[s.trail.length - 1];
          if (Math.abs(nx - last) >= 0.2) { s.trail.push(nx); if (s.trail.length > 400) s.trail.splice(1, 1); }
          st.request();
        },
        () => { if (s.trail[s.trail.length - 1] !== s.x) s.trail.push(s.x); st.request(); }
      );
      k('reset').onclick = () => { s.x0 = s.x; s.dist = 0; s.trail = [s.x]; st.request(); };
      k('origin').onchange = (e) => { s.o = Number(e.target.value); st.request(); };
      st.draw();
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 2. Speed and velocity
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 2, id: 'p1u1-velocity', title: 'Speed and velocity: how fast, and which way',
    render(el) {
      el.innerHTML = `
<p class="lead">Displacement tells you how far an object's position changed. Velocity tells you how <i>quickly</i> it changed, and in which direction. It's the most important idea in kinematics, because almost everything else is built on it.</p>

<h2>Average velocity</h2>
<p>Divide the displacement by the time it took:</p>
${eq('\\[ v_{\\text{avg}} = \\frac{\\Delta x}{\\Delta t} = \\frac{x_f - x_i}{t_f - t_i} \\]', 'where \\(v_{\\text{avg}}\\) = average velocity (m/s), a vector with the same sign as \\(\\Delta x\\); \\(\\Delta x\\) = displacement (m); \\(\\Delta t\\) = elapsed time (s), always positive.')}
<p>Because it uses displacement, average velocity ignores everything that happened in between. A round trip has zero average velocity, however fast you went.</p>

<h2>Average speed</h2>
${eq('\\[ \\text{average speed} = \\frac{d}{\\Delta t} \\]', 'where \\(d\\) = total distance traveled (m); \\(\\Delta t\\) = elapsed time (s). Average speed is a scalar and never negative. It is at least as big as \\(|v_{\\text{avg}}|\\).')}

<h2>Velocity is a slope</h2>
<p>Plot position against time and the average velocity between two moments is the <b>slope of the straight line</b> (the <i>secant</i>) joining those two points: rise \\(\\Delta x\\) over run \\(\\Delta t\\). Steeper line, faster motion. Line sloping down, motion in the negative direction.</p>
<p>Now slide the two times closer together. The secant line swings until it just touches the curve at one point: the <b>tangent line</b>. Its slope is the <b>instantaneous velocity</b>, the velocity at that single instant, which is what a speedometer (plus a direction) reads.</p>
${eq('\\[ v = \\lim_{\\Delta t \\to 0} \\frac{\\Delta x}{\\Delta t} = \\text{slope of the } x\\text{–}t \\text{ graph} \\]', 'where \\(v\\) = instantaneous velocity (m/s). <b>Speed</b> is its magnitude \\(|v|\\). You won\'t need the calculus notation on the AP exam, but you will need "slope of the tangent line."')}

<div class="sim" data-sim="trip">
  <canvas></canvas>
  <div class="sim-controls">
    <label>t₁ <input type="range" data-k="t1" min="0" max="10" step="0.1" value="1"> <span data-k="t1v"></span></label>
    <label>t₂ <input type="range" data-k="t2" min="0" max="10" step="0.1" value="6"> <span data-k="t2v"></span></label>
    <label><input type="checkbox" data-k="tan" checked> Tangent at t₂</label>
    <button class="btn small primary" data-k="play">Play ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">The car drives forward, slows, turns around, and comes partway back. The accent line is the secant (average velocity from t₁ to t₂); the green line is the tangent at t₂ (instantaneous velocity). Drag t₂ toward t₁: the two slopes become equal.</div>
</div>

${call('analogy', 'Analogy: a road trip', 'Drive 300 km in 4 h and your average speed is 75 km/h, even though you sat at a red light (0 km/h) and passed a truck (110 km/h). The speedometer reading at any moment is the instantaneous speed; the trip summary is the average.')}
${call('idea', 'Reading an x–t graph', '<ul><li>Positive slope → moving in the + direction.</li><li>Negative slope → moving in the − direction.</li><li>Zero slope (flat) → at rest at that instant.</li><li>Steeper → faster. Curved → the velocity is changing.</li></ul>')}
${call('mistake', 'Common mistakes', '<ul><li>Reading the <i>height</i> of an x–t graph as the velocity. Height is position; <b>slope</b> is velocity.</li><li>Mixing up average speed and the magnitude of average velocity. They differ whenever the object turns around.</li><li>Thinking an object at x = 0 must be at rest. It can be zooming through the origin.</li></ul>')}
${call('ap', 'On the AP exam', 'You will be handed x–t graphs and asked where the object is fastest (steepest), where it is at rest (flat), where it turns around (slope changes sign), and to compare average and instantaneous velocity. Always justify with the word "slope."')}
${check('A runner completes a 400 m lap in 80 s and ends where she started. Her average speed and average velocity are…', ['5 m/s and 5 m/s', '5 m/s and 0 m/s', '0 m/s and 5 m/s', '0 m/s and 0 m/s'], 1, 'Average speed = 400/80 = 5 m/s. Displacement is zero, so average velocity is 0.')}
${check('On an x–t graph, a section of the line slopes downward and gets steeper with time. The object is…', ['Moving in the + direction and slowing down', 'Moving in the − direction and speeding up', 'Moving in the − direction and slowing down', 'At rest'], 1, 'Downward slope means negative velocity (− direction). Steeper means larger magnitude, so its speed is increasing.')}
`;
      const host = el.querySelector('[data-sim="trip"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      const T = 10;
      const xf = (t) => 12 * Math.sin(0.55 * t) + 1.2 * t;
      const vf = (t) => 6.6 * Math.cos(0.55 * t) + 1.2;
      const dist = (a, b) => { let d = 0; const n = 200; for (let i = 0; i < n; i++) d += Math.abs(xf(a + ((b - a) * (i + 1)) / n) - xf(a + ((b - a) * i) / n)); return d; };
      let t1 = 1, t2 = 6, playing = false;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const pad = 30, X = (x) => pad + ((x + 4) / 22) * (w - 2 * pad);
        // road strip
        const yr = 52;
        ruler(ctx, X, -4, 18, yr, 1, 2);
        text(ctx, 'x (m)', w - 6, yr - 12, { align: 'right', color: col('--muted'), size: 11 });
        car(ctx, X(xf(t2)), yr, vf(t2));
        ctx.save(); ctx.globalAlpha = 0.35; car(ctx, X(xf(t1)), yr, vf(t1)); ctx.restore();
        // graph
        const box = { x: 46, y: 92, w: w - 66, h: h - 120 };
        const ax = axes(ctx, box, { xMax: T, yMin: -4, yMax: 18, xLabel: 't (s)', yLabel: 'x (m)' });
        for (let s = 0; s <= T; s += 2) text(ctx, String(s), ax.X(s), box.y + box.h + 12, { color: col('--muted'), size: 10 });
        for (let v = 0; v <= 15; v += 5) text(ctx, String(v), box.x - 8, ax.Y(v), { align: 'right', color: col('--muted'), size: 10 });
        plot(ctx, ax, xf, T, col('--text'), 2);
        const a = Math.min(t1, t2), b = Math.max(t1, t2);
        // secant
        if (b - a > 0.05) {
          const m = (xf(b) - xf(a)) / (b - a);
          const ext = 0.8;
          ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ax.X(Math.max(0, a - ext)), ax.Y(xf(a) - m * Math.min(ext, a)));
          ctx.lineTo(ax.X(Math.min(T, b + ext)), ax.Y(xf(b) + m * Math.min(ext, T - b))); ctx.stroke();
          // rise/run triangle
          ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(ax.X(a), ax.Y(xf(a))); ctx.lineTo(ax.X(b), ax.Y(xf(a))); ctx.lineTo(ax.X(b), ax.Y(xf(b))); ctx.stroke(); ctx.restore();
          text(ctx, 'Δt', (ax.X(a) + ax.X(b)) / 2, ax.Y(xf(a)) + (xf(b) >= xf(a) ? 11 : -11), { color: col('--muted'), size: 11 });
          text(ctx, 'Δx', ax.X(b) + 14, (ax.Y(xf(a)) + ax.Y(xf(b))) / 2, { color: col('--muted'), size: 11 });
        }
        if (k('tan').checked) {
          const m = vf(t2), L = 1.6;
          ctx.strokeStyle = col('--good'); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ax.X(t2 - L), ax.Y(xf(t2) - m * L)); ctx.lineTo(ax.X(t2 + L), ax.Y(xf(t2) + m * L)); ctx.stroke();
        }
        ball(ctx, ax.X(t1), ax.Y(xf(t1)), 5, col('--muted'));
        ball(ctx, ax.X(t2), ax.Y(xf(t2)), 5, col('--accent'));
        const dt = b - a, dx = xf(b) - xf(a);
        ro.innerHTML = dt > 0.05
          ? `<span>Δx = <b>${sfix(dx)} m</b> in Δt = <b>${fix(dt)} s</b></span><span>average velocity = <b style="color:var(--accent)">${sfix(dx / dt, 2)} m/s</b></span><span>average speed = <b>${fix(dist(a, b) / dt, 2)} m/s</b></span><span>instantaneous v at t₂ = <b style="color:var(--good)">${sfix(vf(t2), 2)} m/s</b></span>`
          : `<span>t₁ = t₂: the secant has shrunk to the tangent. v = <b style="color:var(--good)">${sfix(vf(t2), 2)} m/s</b></span>`;
      }
      const st = stage(cv, 0.62, draw);
      const upd = () => {
        t1 = Number(k('t1').value); t2 = Number(k('t2').value);
        k('t1v').textContent = `${t1.toFixed(1)} s`; k('t2v').textContent = `${t2.toFixed(1)} s`;
        st.request();
      };
      ['t1', 't2'].forEach((n) => (k(n).oninput = () => { playing = false; upd(); }));
      k('tan').onchange = upd;
      k('play').onclick = () => { if (t2 >= T - 0.05) k('t2').value = t1; playing = true; };
      const stop = loop((dt) => {
        if (!playing) return;
        const nt = Math.min(T, Number(k('t2').value) + dt * 2);
        k('t2').value = nt; if (nt >= T) playing = false;
        upd();
      });
      upd();
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 3. Acceleration
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 3, id: 'p1u1-acceleration', title: 'Acceleration: how velocity changes',
    render(el) {
      el.innerHTML = `
<p class="lead">Velocity is the rate at which position changes. Acceleration is one level up: the rate at which <i>velocity</i> changes. Pressing the gas, hitting the brakes, and turning around are all acceleration.</p>

<h2>Definition</h2>
${eq('\\[ a_{\\text{avg}} = \\frac{\\Delta v}{\\Delta t} = \\frac{v_f - v_i}{t_f - t_i} \\]', 'where \\(a_{\\text{avg}}\\) = average acceleration (m/s², read "meters per second, per second"); \\(v_f, v_i\\) = final and initial velocity (m/s, signed); \\(\\Delta t\\) = elapsed time (s).')}
<p>The units say it all: an acceleration of 3 m/s² means the velocity changes by 3 m/s <b>every second</b>. Start at 2 m/s, and one second later you're at 5 m/s, then 8 m/s, then 11 m/s.</p>
<p>Just like velocity is the slope of an x–t graph, <b>acceleration is the slope of a v–t graph</b>. The instantaneous acceleration is the slope of the tangent line there.</p>

<h2>The sign of acceleration does not mean "speeding up"</h2>
<p>This is the single most-tested idea in the unit. Acceleration is a vector; its sign is a <i>direction</i>. Whether the object speeds up or slows down depends on how the acceleration direction compares to the velocity direction:</p>
<ul>
<li><b>Same sign</b> (v and a point the same way): <b>speeding up</b>.</li>
<li><b>Opposite signs</b>: <b>slowing down</b>.</li>
<li><b>a = 0</b>: constant velocity (no speeding up, slowing, or turning).</li>
</ul>
<p>So a car moving in the − direction with a negative acceleration is speeding up, and a car moving in the + direction with negative acceleration is braking.</p>

<div class="sim" data-sim="acc">
  <canvas></canvas>
  <div class="sim-controls">
    <label>v₀ <input type="range" data-k="v0" min="-10" max="10" step="1" value="8"> <span data-k="v0v"></span></label>
    <label>a <input type="range" data-k="a" min="-4" max="4" step="0.5" value="-2"> <span data-k="av"></span></label>
    <button class="btn small primary" data-k="go">Go ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">A <b>motion diagram</b>: the car's position every 0.5 s, with a velocity arrow (accent) at each dot and the acceleration arrow (orange) on the car. Equal spacing = constant velocity. Spacing that grows = speeding up; shrinks = slowing down. Try v₀ = +8, a = −2: the car brakes, stops for an instant, and comes back.</div>
</div>

<h2>Zero velocity does not mean zero acceleration</h2>
<p>Throw a ball straight up. At the very top, its velocity is zero for an instant, but its velocity is still changing (from + to −), so its acceleration is not zero. The sim shows the same thing with the car turning around: v = 0 for an instant while the orange arrow never disappears.</p>

${call('analogy', 'Analogy: the gas pedal and the brake', 'Your velocity is the speedometer plus which way the car points. Acceleration is what your foot is doing. Gas while going forward: speeding up. Brake while going forward: slowing down. But in reverse, the "brake" pushes forward, so braking in reverse is a <i>positive</i> acceleration.')}
${call('mistake', 'Common mistakes', '<ul><li>"Negative acceleration means slowing down." Only if the velocity is positive.</li><li>"At the top of its flight the ball has zero acceleration." Its velocity is zero; its acceleration is still g, downward.</li><li>Confusing big velocity with big acceleration. A jet cruising at 250 m/s in a straight line has zero acceleration.</li></ul>')}
${call('ap', 'On the AP exam', 'You\'ll be asked to draw motion diagrams, decide from signs whether an object is speeding up or slowing down, and find acceleration as the slope of a v–t graph. Explain with "velocity and acceleration are in the same / opposite directions."')}
${check('A car moves in the −x direction and its acceleration is +3 m/s². The car is…', ['Speeding up', 'Slowing down', 'Moving at constant speed', 'At rest'], 1, 'Velocity and acceleration have opposite signs, so the speed is decreasing.')}
${check('A cyclist goes from +4 m/s to +10 m/s in 3 s. Her average acceleration is…', ['+2 m/s²', '+3.3 m/s²', '+6 m/s²', '+18 m/s²'], 0, '\\(a = \\Delta v/\\Delta t = (10 - 4)/3 = 2\\) m/s².')}
${check('A ball thrown upward is at the top of its path. Which is true at that instant?', ['v = 0 and a = 0', 'v = 0 and a ≠ 0', 'v ≠ 0 and a = 0', 'v ≠ 0 and a ≠ 0'], 1, 'The ball is momentarily at rest, but gravity is still changing its velocity at 9.8 m/s² downward.')}
`;
      const host = el.querySelector('[data-sim="acc"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      const XM = 40, TMAX = 8;
      let v0 = 8, a = -2, t = 0, running = false;
      const xAt = (tt) => v0 * tt + 0.5 * a * tt * tt;
      const vAt = (tt) => v0 + a * tt;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const pad = 26, X = (x) => pad + ((x + XM) / (2 * XM)) * (w - 2 * pad);
        const yr = h * 0.42;
        ruler(ctx, X, -XM, XM, yr + 8, 5, 10);
        // motion-diagram dots
        const dots = [];
        for (let s = 0; s <= t + 1e-6; s += 0.5) dots.push(s);
        const vs = 3.2 * (w / 700);
        dots.forEach((s, i) => {
          const px = X(xAt(s));
          ball(ctx, px, yr - 56, 4.5, rgba(col('--text'), 0.85));
          const v = vAt(s);
          if (Math.abs(v) > 0.05) arrow(ctx, px, yr - 56 - 12 - (i % 2) * 10, px + v * vs, yr - 56 - 12 - (i % 2) * 10, rgba(col('--accent'), 0.85), 1.8, 7);
        });
        text(ctx, 'motion diagram (one dot every 0.5 s)', 10, 14, { align: 'left', size: 11, color: col('--muted') });
        const v = vAt(t), x = xAt(t);
        car(ctx, X(x), yr, v === 0 ? (a >= 0 ? 1 : -1) : v);
        if (a !== 0) arrow(ctx, X(x), yr + 30, X(x) + a * 9 * (w / 700), yr + 30, col('--warn'), 3, 10);
        if (a !== 0) text(ctx, 'a', X(x) + a * 9 * (w / 700) + Math.sign(a) * 10, yr + 30, { color: col('--warn'), weight: 700 });
        // small v–t graph
        const box = { x: 40, y: h * 0.62, w: w - 60, h: h * 0.32 };
        const ax = axes(ctx, box, { xMax: TMAX, yMin: -26, yMax: 26, xLabel: 't (s)', yLabel: 'v (m/s)' });
        plot(ctx, ax, vAt, Math.max(t, 0.001), col('--accent'), 2);
        ball(ctx, ax.X(t), ax.Y(v), 4, col('--accent'));
        const state = Math.abs(v) < 0.05 ? (a === 0 ? 'at rest' : 'instantaneously at rest (turning around)')
          : a === 0 ? 'constant velocity' : v * a > 0 ? 'speeding up (v and a same direction)' : 'slowing down (v and a opposite)';
        ro.innerHTML = `<span>t = <b>${fix(t)} s</b></span><span>v = <b>${sfix(v)} m/s</b></span><span>a = <b>${sfix(a)} m/s²</b></span><span><b>${state}</b></span>`;
      }
      const st = stage(cv, 0.6, draw);
      const upd = () => {
        v0 = Number(k('v0').value); a = Number(k('a').value);
        k('v0v').textContent = `${sfix(v0, 0)} m/s`; k('av').textContent = `${sfix(a)} m/s²`;
        t = 0; running = false; st.request();
      };
      ['v0', 'a'].forEach((n) => (k(n).oninput = upd));
      k('go').onclick = () => { t = 0; running = true; };
      const stop = loop((dt) => {
        if (!running) return;
        t += dt;
        if (t >= TMAX || Math.abs(xAt(t)) > XM - 1 || Math.abs(vAt(t)) > 25) running = false;
        st.draw();
      });
      upd();
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 4. Motion graphs
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 4, id: 'p1u1-graphs', title: 'Motion graphs: slopes and areas',
    render(el) {
      el.innerHTML = `
<p class="lead">Position, velocity and acceleration are three views of the same motion. Graph them against time and they are tied together by just two operations: <b>slope</b> takes you down the chain, <b>area</b> takes you back up. Master those two and you can read any motion graph.</p>

<h2>Going down the chain: slopes</h2>
<ul>
<li>The <b>slope of the x–t graph</b> at any time is the <b>velocity</b> then.</li>
<li>The <b>slope of the v–t graph</b> at any time is the <b>acceleration</b> then.</li>
</ul>
<p>So a straight x–t line means constant velocity; a curved x–t graph means the velocity is changing. A straight, slanted v–t line means constant acceleration.</p>

<h2>Going up the chain: areas</h2>
<p>Why does area work? Take a stretch where the velocity is constant, say 4 m/s for 3 s. You travel \\(\\Delta x = v\\,\\Delta t = 12\\) m. On the v–t graph that product is a rectangle: height 4, width 3, area 12. If the velocity changes, slice the time into thin strips; each strip is a skinny rectangle, and the strips add up to the area under the curve.</p>
${eq('\\[ \\Delta x = \\text{area under the } v\\text{–}t \\text{ graph}, \\qquad \\Delta v = \\text{area under the } a\\text{–}t \\text{ graph} \\]', 'where \\(\\Delta x\\) = displacement (m) and \\(\\Delta v\\) = change in velocity (m/s) over the chosen time interval. Area <b>below</b> the time axis counts as <b>negative</b>: the object was moving (or accelerating) in the − direction.')}
${call('idea', 'Big idea: what each graph hides', 'An x–t graph shows <i>where</i>. A v–t graph shows how fast and which way, but not where it started: area only gives the <b>change</b> in position. Likewise an a–t graph tells you the change in velocity, not the velocity itself. You always need a starting value.')}

<div class="sim" data-sim="graphs">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Setup <select data-k="preset"><option value="0">Speed up, cruise, brake</option><option value="1">Throw up, fall back</option><option value="2">Constant velocity</option><option value="3">Back and forth</option></select></label>
    <label>v₀ <input type="range" data-k="v0" min="-6" max="6" step="1" value="0"> <span data-k="v0v"></span></label>
    <label>time <input type="range" data-k="t" min="0" max="10" step="0.05" value="4"> <span data-k="tv"></span></label>
    <button class="btn small primary" data-k="play">Play ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption"><b>Drag the four orange bars on the a–t graph</b> up or down to design your own motion. The v–t and x–t graphs rebuild themselves from the areas. Shaded areas run from t = 0 to the cursor (green above the axis, red below). The tangent lines show slopes at the cursor.</div>
</div>

<h2>Reading the shapes</h2>
<ul>
<li><b>x–t flat</b> → at rest. <b>x–t straight, slanted</b> → constant velocity. <b>x–t curving up (smile)</b> → positive acceleration; <b>curving down (frown)</b> → negative acceleration.</li>
<li><b>v–t crossing the time axis</b> → the object turns around there (and the x–t graph has a peak or valley at that same time).</li>
<li><b>v–t flat</b> → zero acceleration; the a–t graph sits on the axis.</li>
</ul>

${call('analogy', 'Analogy: a water tank', 'Think of velocity as the flow rate into a tank and position as the water level. The level rises fastest when the flow is biggest (slope of x = v). The total water added is flow × time, the area under the flow graph (area under v = Δx). Negative flow drains the tank.')}
${call('mistake', 'Common mistakes', '<ul><li>Reading a v–t graph as if it were a picture of the path. A v–t line that goes "down" does not mean the object is going down.</li><li>Thinking that where the v–t graph crosses zero, the object is back at the start. It is momentarily at rest; it is back at the start only when the <i>total</i> area is zero.</li><li>Ignoring the sign of area below the axis.</li></ul>')}
${call('ap', 'On the AP exam', 'Graph translation is everywhere: "sketch the v–t graph that matches this x–t graph," "find the displacement from 2 s to 6 s" (area), "when is the object farthest from the origin?" (when v changes sign). Label axes and show the area or slope you used.')}
${check('An object\'s velocity is a constant +4 m/s for 3 s, then a constant −2 m/s for 2 s. Its displacement over the 5 s is…', ['+16 m', '+8 m', '+12 m', '+2 m'], 1, 'Area: (4)(3) = +12 m, then (−2)(2) = −4 m. Net +8 m. (Distance would be 16 m.)')}
${check('A v–t graph is a straight line that starts at +6 m/s and crosses the time axis at t = 3 s. At t = 3 s the object is…', ['At the origin', 'Momentarily at rest and turning around', 'At its maximum speed', 'Not accelerating'], 1, 'v = 0 there, so it stops for an instant and reverses. The acceleration (slope) is the same nonzero value the whole time.')}
${check('An x–t graph is a horizontal line at x = +5 m. The object is…', ['Moving at 5 m/s', 'At rest, 5 m from the origin', 'Accelerating at 5 m/s²', 'Moving back toward the origin'], 1, 'Zero slope means zero velocity. The height tells you where it sits: 5 m on the + side.')}
`;
      const host = el.querySelector('[data-sim="graphs"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      const T = 10, SEG = 2.5;
      const PRESETS = [
        { v0: 0, acc: [2, 0, -2, 0] },
        { v0: 6, acc: [-1.2, -1.2, -1.2, -1.2] },
        { v0: 3, acc: [0, 0, 0, 0] },
        { v0: 4, acc: [0, -3, 0, 2.5] },
      ];
      const s = { v0: 0, acc: [2, 0, -2, 0], tc: 4, playing: false };
      let M = null;
      const seg = (t) => clamp(Math.floor(t / SEG), 0, 3);
      const aAt = (t) => s.acc[seg(t)];
      const vAt = (t) => { const i = seg(t), d = t - i * SEG; return M.vs[i] + s.acc[i] * d; };
      const xAt = (t) => { const i = seg(t), d = t - i * SEG; return M.xs[i] + M.vs[i] * d + 0.5 * s.acc[i] * d * d; };
      function model() {
        const vs = [s.v0], xs = [0];
        for (let i = 0; i < 4; i++) { vs.push(vs[i] + s.acc[i] * SEG); xs.push(xs[i] + vs[i] * SEG + 0.5 * s.acc[i] * SEG * SEG); }
        M = { vs, xs };
        let xmin = 0, xmax = 0, vmax = 2;
        for (let i = 0; i <= 200; i++) { const t = (T * i) / 200; const x = xAt(t), v = vAt(t); xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); vmax = Math.max(vmax, Math.abs(v)); }
        const pad = Math.max(2, 0.1 * (xmax - xmin));
        Object.assign(M, { xmin: xmin - pad, xmax: xmax + pad, vmax: vmax * 1.2 });
      }
      let boxes = null;
      function layout(w, h) {
        const L = 50, R = w - 14, top = 58, gap = 20;
        const gh = (h - top - 26 - 2 * gap) / 3;
        boxes = {
          x: { x: L, y: top, w: R - L, h: gh },
          v: { x: L, y: top + gh + gap, w: R - L, h: gh },
          a: { x: L, y: top + 2 * (gh + gap), w: R - L, h: gh },
        };
      }
      // Fill the area between f and the t-axis from 0 to tc: green above, red below.
      function shade(ctx, ax, box, f, tc) {
        if (tc <= 0) return;
        const build = () => {
          ctx.beginPath(); ctx.moveTo(ax.X(0), ax.Y(0));
          const n = Math.max(2, Math.round(tc * 30));
          for (let i = 0; i <= n; i++) { const t = (tc * i) / n; ctx.lineTo(ax.X(t), ax.Y(f(t))); }
          ctx.lineTo(ax.X(tc), ax.Y(0)); ctx.closePath();
        };
        const y0 = clamp(ax.Y(0), box.y, box.y + box.h);
        ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, y0 - box.y); ctx.clip();
        build(); ctx.fillStyle = rgba(col('--good'), 0.25); ctx.fill(); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(box.x, y0, box.w, box.y + box.h - y0); ctx.clip();
        build(); ctx.fillStyle = rgba(col('--bad'), 0.25); ctx.fill(); ctx.restore();
      }
      function tangent(ctx, ax, box, t, y, m, color, L = 1.2) {
        ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax.X(t - L), ax.Y(y - m * L)); ctx.lineTo(ax.X(t + L), ax.Y(y + m * L)); ctx.stroke();
        ctx.restore();
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        layout(w, h);
        const tc = s.tc;
        // track
        const pad = 26, XX = (x) => pad + ((x - M.xmin) / (M.xmax - M.xmin)) * (w - 2 * pad);
        const yr = 30;
        const step = niceStep(M.xmax - M.xmin, 10);
        ruler(ctx, XX, M.xmin, M.xmax, yr, step, step * 2);
        car(ctx, XX(xAt(tc)), yr, vAt(tc) || 1, 0.8);
        const bx = boxes.x, bv = boxes.v, ba = boxes.a;
        // x–t
        const ax1 = axes(ctx, bx, { xMax: T, yMin: M.xmin, yMax: M.xmax, yLabel: 'x (m)' });
        plot(ctx, ax1, xAt, T, col('--text'), 2);
        tangent(ctx, ax1, bx, tc, xAt(tc), vAt(tc), col('--good'));
        // v–t
        const ax2 = axes(ctx, bv, { xMax: T, yMin: -M.vmax, yMax: M.vmax, yLabel: 'v (m/s)' });
        shade(ctx, ax2, bv, vAt, tc);
        plot(ctx, ax2, vAt, T, col('--accent'), 2);
        tangent(ctx, ax2, bv, tc, vAt(tc), aAt(tc), col('--warn'), 0.9);
        // a–t with draggable bars
        const ax3 = axes(ctx, ba, { xMax: T, yMin: -3.5, yMax: 3.5, yLabel: 'a (m/s²)', xLabel: 't (s)' });
        shade(ctx, ax3, ba, aAt, tc);
        for (let i = 0; i < 4; i++) {
          const y = ax3.Y(s.acc[i]);
          ctx.strokeStyle = col('--warn'); ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.moveTo(ax3.X(i * SEG), y); ctx.lineTo(ax3.X((i + 1) * SEG), y); ctx.stroke();
          ctx.beginPath(); ctx.arc(ax3.X((i + 0.5) * SEG), y, 6, 0, Math.PI * 2); ctx.fillStyle = col('--surface'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
        }
        for (let t = 0; t <= T; t += 2) text(ctx, String(t), ax3.X(t), ba.y + ba.h + 12, { color: col('--muted'), size: 10 });
        // cursor
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ax1.X(tc), bx.y); ctx.lineTo(ax1.X(tc), ba.y + ba.h); ctx.stroke(); ctx.restore();
        ball(ctx, ax1.X(tc), ax1.Y(xAt(tc)), 4.5, col('--text'));
        ball(ctx, ax2.X(tc), ax2.Y(vAt(tc)), 4.5, col('--accent'));
        const x = xAt(tc), v = vAt(tc), a = aAt(tc);
        ro.innerHTML = `<span>t = <b>${fix(tc, 2)} s</b></span><span>x = <b>${sfix(x)} m</b></span><span>v = slope of x–t = <b style="color:var(--good)">${sfix(v)} m/s</b></span><span>a = slope of v–t = <b style="color:var(--warn)">${sfix(a)} m/s²</b></span><span>area under v–t (0→t) = <b>${sfix(x)} m</b> = Δx</span><span>area under a–t (0→t) = <b>${sfix(v - s.v0)} m/s</b> = Δv</span>`;
      }
      model();
      const st = stage(cv, 0.95, draw);
      drag(
        cv,
        (px, py) => {
          if (!boxes) return null;
          const b = boxes.a;
          if (px < b.x || px > b.x + b.w || py < b.y - 8 || py > b.y + b.h + 8) return null;
          return seg(((px - b.x) / b.w) * T);
        },
        (i, px, py) => {
          const b = boxes.a;
          const val = 3.5 - ((py - b.y) / b.h) * 7;
          s.acc[i] = clamp(Math.round(val * 2) / 2, -3, 3);
          model(); st.request();
        }
      );
      const upd = () => {
        s.v0 = Number(k('v0').value); s.tc = Number(k('t').value);
        k('v0v').textContent = `${sfix(s.v0, 0)} m/s`; k('tv').textContent = `${s.tc.toFixed(1)} s`;
        model(); st.request();
      };
      k('v0').oninput = upd;
      k('t').oninput = () => { s.playing = false; upd(); };
      k('preset').onchange = (e) => { const p = PRESETS[Number(e.target.value)]; s.acc = p.acc.slice(); k('v0').value = p.v0; upd(); };
      k('play').onclick = () => { if (s.tc >= T - 0.05) k('t').value = 0; s.playing = true; };
      const stop = loop((dt) => {
        if (!s.playing) return;
        const nt = Math.min(T, Number(k('t').value) + dt * 2);
        k('t').value = nt; if (nt >= T) s.playing = false;
        upd();
      });
      upd();
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 5. Kinematic equations
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 5, id: 'p1u1-kinematic-eqs', title: 'Constant acceleration: the kinematic equations',
    render(el) {
      el.innerHTML = `
<p class="lead">When the acceleration is constant, the v–t graph is a straight line. That one fact, plus "slope = acceleration" and "area = displacement," gives you every equation you need to predict where an object will be and how fast it'll be going.</p>

<h2>Equation 1: from the slope</h2>
<p>A straight v–t line starting at \\(v_0\\) with slope \\(a\\) reaches \\(v_0 + at\\) after time \\(t\\):</p>
${eq('\\[ v_x = v_{x0} + a_x t \\]', 'where \\(v_x\\) = velocity at time \\(t\\) (m/s); \\(v_{x0}\\) = initial velocity (m/s); \\(a_x\\) = constant acceleration (m/s²); \\(t\\) = elapsed time (s). The subscript x reminds you these are components along one axis, with signs.')}

<h2>Equation 2: from the area</h2>
<p>The area under that straight line from 0 to \\(t\\) is a <b>rectangle</b> (height \\(v_0\\), width \\(t\\)) plus a <b>triangle</b> (width \\(t\\), height \\(at\\)). Add them:</p>
${eq('\\[ x = x_0 + v_{x0} t + \\tfrac12 a_x t^2 \\]', 'where \\(x\\) = position at time \\(t\\) (m); \\(x_0\\) = initial position (m). The \\(v_{x0}t\\) term is the rectangle (what you\'d cover at your starting speed); the \\(\\tfrac12 a_x t^2\\) term is the triangle (the extra from accelerating). \\(x - x_0 = \\Delta x\\).')}
<p>Watch the two pieces of area grow in the sim below. The rectangle and the triangle are literally the two terms of the equation.</p>

<div class="sim" data-sim="kin">
  <canvas></canvas>
  <div class="sim-controls">
    <label>v₀ <input type="range" data-k="v0" min="-10" max="20" step="1" value="4"> <span data-k="v0v"></span></label>
    <label>a <input type="range" data-k="a" min="-5" max="5" step="0.5" value="2"> <span data-k="av"></span></label>
    <label>t <input type="range" data-k="t" min="0.5" max="8" step="0.5" value="4"> <span data-k="tv"></span></label>
    <button class="btn small primary" data-k="go">Run ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Blue rectangle = \\(v_0 t\\). Orange triangle = \\(\\tfrac12 a t^2\\). Their sum is the displacement shown on the track. If the velocity line crosses zero, part of the area dips below the axis: that part counts as negative, because the car is backing up.</div>
</div>

<h2>Equation 3: no time needed</h2>
<p>Solve equation 1 for \\(t\\) and substitute into equation 2; the time cancels out:</p>
${eq('\\[ v_x^2 = v_{x0}^2 + 2 a_x (x - x_0) \\]', 'where all symbols are as above. Use it when a problem never mentions time, such as stopping distances. Because speed is squared, <b>doubling the speed quadruples the braking distance</b>.')}
<p>A handy fourth form comes straight from "average velocity × time" (for constant acceleration, the average velocity is the midpoint of the v–t line):</p>
${eq('\\[ \\Delta x = \\tfrac12 (v_{x0} + v_x)\\, t \\]', 'where \\(\\Delta x\\) = displacement (m). Valid <b>only</b> when the acceleration is constant.')}

<h2>A strategy that always works</h2>
<ol>
<li>Draw the situation; choose an origin and a positive direction.</li>
<li>List the five quantities \\(\\Delta x, v_0, v, a, t\\). Write the three you know (with signs) and the one you want.</li>
<li>Pick the equation that contains your three knowns and your unknown, and is <i>missing</i> the fifth one.</li>
<li>Solve with symbols first, then plug in. Check the sign and size make sense.</li>
</ol>

${call('analogy', 'Analogy: a paycheck with raises', 'Start a job earning $4 per hour, and every hour you get a $2/hour raise. What you earn after t hours is the starting wage times t (the rectangle) plus the extra from all the raises (the triangle): exactly \\(v_0t + \\tfrac12 a t^2\\).')}
${call('mistake', 'Common mistakes', '<ul><li>Using these equations when the acceleration is <b>not constant</b> (e.g., a driver who keeps changing the pedal). Then you need graphs and areas.</li><li>Dropping signs. If up is +, gravity is \\(a = -9.8\\) m/s² in every equation.</li><li>Writing \\(v = \\Delta x / t\\) for an accelerating object. That\'s the <i>average</i> velocity, not the final one.</li></ul>')}
${call('ap', 'On the AP exam', 'These three equations are on your equation sheet (with x and y versions). The exam rewards symbolic derivations: "derive an expression for the stopping distance in terms of v₀ and a." Start from a listed equation and show the algebra.')}
${check('A car starts from rest and accelerates at 2 m/s² for 5 s. How far does it go?', ['10 m', '20 m', '25 m', '50 m'], 2, '\\(\\Delta x = v_0t + \\tfrac12at^2 = 0 + \\tfrac12(2)(5)^2 = 25\\) m.')}
${check('A car traveling 20 m/s brakes at 5 m/s². What is its stopping distance?', ['4 m', '20 m', '40 m', '80 m'], 2, 'No time given → \\(v^2 = v_0^2 + 2a\\Delta x\\): \\(0 = 400 + 2(-5)\\Delta x\\), so \\(\\Delta x = 40\\) m.')}
${check('If the same car were going 40 m/s with the same braking, its stopping distance would be…', ['40 m', '80 m', '160 m', '320 m'], 2, '\\(\\Delta x = v_0^2/(2|a|)\\) scales with \\(v_0^2\\). Doubling speed → 4× distance = 160 m.')}
`;
      const host = el.querySelector('[data-sim="kin"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      let v0 = 4, a = 2, T = 4, tau = T, running = false;
      const xAt = (t) => v0 * t + 0.5 * a * t * t;
      const vAt = (t) => v0 + a * t;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        let xmin = 0, xmax = 0;
        for (let i = 0; i <= 60; i++) { const x = xAt((T * i) / 60); xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
        const span = Math.max(10, xmax - xmin), padw = span * 0.08;
        xmin -= padw; xmax += padw;
        if (xmax - xmin < 10) xmax = xmin + 10;
        const pad = 26, X = (x) => pad + ((x - xmin) / (xmax - xmin)) * (w - 2 * pad);
        const yr = 58;
        const step = niceStep(xmax - xmin, 10);
        ruler(ctx, X, xmin, xmax, yr, step, step * 2);
        ctx.save(); ctx.globalAlpha = 0.3; car(ctx, X(0), yr, v0 || 1); ctx.restore();
        car(ctx, X(xAt(tau)), yr, vAt(tau) || (a >= 0 ? 1 : -1));
        const dx = xAt(tau);
        if (Math.abs(dx) > 0.01) {
          arrow(ctx, X(0), yr - 36, X(dx), yr - 36, col('--good'), 2.5, 9);
          text(ctx, `Δx = ${sfix(dx)} m`, clamp((X(0) + X(dx)) / 2, 50, w - 50), yr - 48, { color: col('--good'), weight: 700 });
        }
        // v–t graph
        const vm = Math.max(4, Math.abs(v0), Math.abs(vAt(T))) * 1.2;
        const box = { x: 50, y: 100, w: w - 66, h: h - 128 };
        const ax = axes(ctx, box, { xMax: T, yMin: -vm, yMax: vm, xLabel: 't (s)', yLabel: 'v (m/s)' });
        for (let i = 0; i <= T + 1e-9; i += T > 4 ? 1 : 0.5) text(ctx, String(i), ax.X(i), box.y + box.h + 12, { color: col('--muted'), size: 10 });
        // rectangle v0·τ
        ctx.fillStyle = rgba(col('--accent'), 0.22);
        ctx.fillRect(ax.X(0), Math.min(ax.Y(0), ax.Y(v0)), ax.X(tau) - ax.X(0), Math.abs(ax.Y(v0) - ax.Y(0)));
        // triangle ½aτ²
        ctx.fillStyle = rgba(col('--warn'), 0.32);
        ctx.beginPath(); ctx.moveTo(ax.X(0), ax.Y(v0)); ctx.lineTo(ax.X(tau), ax.Y(vAt(tau))); ctx.lineTo(ax.X(tau), ax.Y(v0)); ctx.closePath(); ctx.fill();
        plot(ctx, ax, vAt, T, rgba(col('--text'), 0.35), 1.5);
        plot(ctx, ax, vAt, Math.max(tau, 0.001), col('--text'), 2.2);
        ball(ctx, ax.X(tau), ax.Y(vAt(tau)), 4.5, col('--text'));
        if (Math.abs(v0) > 0) text(ctx, `v₀t = ${sfix(v0 * tau)} m`, ax.X(tau / 2), ax.Y(v0 / 2), { color: col('--accent'), weight: 700, size: 12 });
        if (Math.abs(a) > 0 && tau > 0.3) text(ctx, `½at² = ${sfix(0.5 * a * tau * tau)} m`, ax.X(tau * 0.7), ax.Y(v0 + a * tau * 0.85) + (a > 0 ? -14 : 14), { color: col('--warn'), weight: 700, size: 12 });
        const v = vAt(tau);
        ro.innerHTML = `<span>t = <b>${fix(tau, 2)} s</b></span><span>v = v₀ + at = <b>${sfix(v, 2)} m/s</b></span><span>Δx = v₀t + ½at² = ${sfix(v0 * tau, 2)} ${0.5 * a * tau * tau < 0 ? '−' : '+'} ${fix(Math.abs(0.5 * a * tau * tau), 2)} = <b>${sfix(dx, 2)} m</b></span><span>check: v² = <b>${fix(v * v, 1)}</b> and v₀² + 2aΔx = <b>${fix(v0 * v0 + 2 * a * dx, 1)}</b></span>`;
      }
      const st = stage(cv, 0.62, draw);
      const upd = () => {
        v0 = Number(k('v0').value); a = Number(k('a').value); T = Number(k('t').value);
        k('v0v').textContent = `${sfix(v0, 0)} m/s`; k('av').textContent = `${sfix(a)} m/s²`; k('tv').textContent = `${T.toFixed(1)} s`;
        tau = T; running = false; st.request();
      };
      ['v0', 'a', 't'].forEach((n) => (k(n).oninput = upd));
      k('go').onclick = () => { tau = 0; running = true; };
      const stop = loop((dt) => {
        if (!running) return;
        tau = Math.min(T, tau + dt * Math.max(1, T / 4));
        if (tau >= T) running = false;
        st.draw();
      });
      upd();
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 6. Free fall
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 6, id: 'p1u1-free-fall', title: 'Free fall: everything drops at g',
    render(el) {
      el.innerHTML = `
<p class="lead">Drop a hammer and a feather on the Moon and they hit the ground together; astronaut David Scott did exactly that in 1971. Without air resistance, every object near a planet's surface falls with the same constant acceleration. That makes falling the perfect use of the kinematic equations.</p>

<h2>What "free fall" means</h2>
<p>An object is in <b>free fall</b> when the only force acting on it is gravity. That includes things falling down, things thrown up (on the way up <i>and</i> down), and things thrown sideways. Near Earth's surface, the acceleration in free fall is</p>
${eq('\\[ g = 9.8\\ \\text{m/s}^2 \\text{, directed downward} \\]', 'where \\(g\\) = the magnitude of the free-fall acceleration (m/s²). It does not depend on the object\'s mass, its speed, or whether it\'s moving up or down. (You\'ll see <i>why</i> in Unit 2: heavier objects feel a bigger pull, but they are also harder to accelerate, and the two effects cancel exactly.)')}
<p>Air resistance spoils this for light, spread-out objects like feathers and paper. In AP problems, ignore air resistance unless you're told otherwise.</p>

<h2>The equations, specialized</h2>
<p>Choose <b>up as positive</b>. Then the acceleration is \\(a_y = -g\\) for the entire flight, and the kinematic equations become</p>
${eq('\\[ v_y = v_{y0} - g t, \\qquad y = y_0 + v_{y0} t - \\tfrac12 g t^2, \\qquad v_y^2 = v_{y0}^2 - 2g(y - y_0) \\]', 'where \\(y\\) = height above your chosen origin (m); \\(v_y\\) = vertical velocity (m/s, + up, − down); \\(v_{y0}\\) = launch velocity (m/s); \\(g = 9.8\\) m/s². The minus signs come from gravity pointing in the − direction.')}

<div class="sim" data-sim="drop">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Height <input type="range" data-k="H" min="5" max="60" step="1" value="20"> <span data-k="Hv"></span></label>
    <label>Launch v₀ <input type="range" data-k="v0" min="-10" max="20" step="1" value="0"> <span data-k="v0v"></span></label>
    <label>Where <select data-k="g"><option value="9.8">Earth (9.8 m/s²)</option><option value="1.62">Moon (1.62 m/s²)</option><option value="3.71">Mars (3.71 m/s²)</option></select></label>
    <button class="btn small primary" data-k="go">Release ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">A strobe photo: one image every 0.2 s (shifted sideways a little so you can see each flash; the real ball moves straight up and down). The gaps grow as the ball falls, because it covers more distance every 0.2 s. The v–t graph on the right is a straight line with slope −g, whatever you choose for v₀.</div>
</div>

<h2>Symmetry of a vertical throw</h2>
<p>Throw a ball straight up at speed \\(v_0\\). It slows by 9.8 m/s every second until it stops at the top (\\(t_{\\text{up}} = v_0/g\\)), then speeds up by 9.8 m/s every second on the way down. Because the acceleration is the same both ways:</p>
<ul>
<li>It takes as long to come down to the launch height as it took to go up.</li>
<li>At any height, its speed on the way down equals its speed on the way up.</li>
<li>The maximum height above launch is \\(h = v_0^2/(2g)\\) (set \\(v_y = 0\\) in the third equation).</li>
</ul>

${call('analogy', 'Analogy: a bank account with a fixed fee', 'Your vertical velocity is a balance that loses $9.8 every second, no matter what. Deposit 19.6 at launch and the balance hits zero (the top) after 2 s, then goes negative (falling) at the same steady rate.')}
${call('mistake', 'Common mistakes', '<ul><li>"Heavier objects fall faster." Not without air: same \\(g\\) for all.</li><li>"At the top, a = 0." The velocity is zero; the acceleration is still 9.8 m/s² downward.</li><li>Using \\(+9.8\\) when you chose up as positive. Pick a direction once and keep every sign consistent.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect questions comparing a dropped object with one thrown down or up, or a heavy and a light ball. Also "sketch y–t, v–t and a–t for a ball thrown up": a downward-opening parabola, a straight line with slope −g crossing zero at the top, and a flat line at −g.')}
${check('A rock is dropped from rest. After 2.0 s, how fast is it going and how far has it fallen?', ['9.8 m/s and 9.8 m', '19.6 m/s and 19.6 m', '19.6 m/s and 39.2 m', '9.8 m/s and 19.6 m'], 1, '\\(v = gt = 9.8 \\times 2 = 19.6\\) m/s. Distance \\(= \\tfrac12 g t^2 = \\tfrac12(9.8)(4) = 19.6\\) m.')}
${check('A ball is thrown straight up at 9.8 m/s. How high does it rise?', ['4.9 m', '9.8 m', '19.6 m', '1.0 m'], 0, '\\(h = v_0^2/(2g) = 96/19.6 = 4.9\\) m. It takes 1.0 s to get there.')}
${check('With no air resistance, a 5 kg bowling ball and a 0.5 kg soccer ball are dropped together. The bowling ball lands…', ['First, because it is 10× heavier', 'At the same time', 'Second, because it has more inertia', 'First, but only slightly'], 1, 'Both have acceleration g, start at rest, and fall the same height, so they take the same time.')}
`;
      const host = el.querySelector('[data-sim="drop"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      let H = 20, v0 = 0, g = G, t = 0, running = false;
      const yAt = (tt) => H + v0 * tt - 0.5 * g * tt * tt;
      const vAt = (tt) => v0 - g * tt;
      const tf = () => (v0 + Math.sqrt(v0 * v0 + 2 * g * H)) / g;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const TF = tf();
        const ytop = Math.max(H, H + (v0 > 0 ? (v0 * v0) / (2 * g) : 0)) * 1.12;
        const gl = h - 26, sy = (gl - 22) / ytop;
        const Y = (y) => gl - y * sy;
        const lw = w * 0.5;
        // ground + cliff
        ctx.fillStyle = col('--border'); ctx.fillRect(0, gl, lw, h - gl);
        ctx.fillStyle = rgba(col('--muted'), 0.35); ctx.fillRect(lw * 0.06, Y(H), lw * 0.16, gl - Y(H));
        // height ruler
        const step = niceStep(ytop, 6);
        ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
        for (let y = 0; y <= ytop; y += step) {
          ctx.beginPath(); ctx.moveTo(lw - 8, Y(y)); ctx.lineTo(lw - 2, Y(y)); ctx.stroke();
          text(ctx, `${fix(y, 0)} m`, lw - 12, Y(y), { align: 'right', color: col('--muted'), size: 10 });
        }
        // strobe images
        const x0 = lw * 0.3, spread = Math.min(4, (lw * 0.4) / Math.max(1, TF / 0.2));
        let i = 0;
        for (let s = 0; s <= Math.min(t, TF) + 1e-6; s += 0.2, i++) {
          ctx.save(); ctx.globalAlpha = 0.3; ball(ctx, x0 + i * spread, Y(Math.max(0, yAt(s))) - 7, 7, col('--accent')); ctx.restore();
        }
        const tc = Math.min(t, TF);
        const yy = Math.max(0, yAt(tc)), vv = vAt(tc);
        const bxp = x0 + (tc / 0.2) * spread;
        ball(ctx, bxp, Y(yy) - 7, 8, col('--accent'));
        if (tc < TF && Math.abs(vv) > 0.1) arrow(ctx, bxp + 18, Y(yy) - 7, bxp + 18, Y(yy) - 7 - vv * 2.2, col('--good'), 2.5, 8);
        if (tc < TF) {
          arrow(ctx, bxp - 18, Y(yy) - 7, bxp - 18, Y(yy) + 16, col('--warn'), 2.5, 8);
          text(ctx, 'g', bxp - 28, Y(yy) + 6, { color: col('--warn'), weight: 700 });
        }
        // v–t
        const vm = Math.max(Math.abs(v0), Math.sqrt(v0 * v0 + 2 * g * H)) * 1.15;
        const box = { x: lw + 30, y: 16, w: w - lw - 44, h: h - 46 };
        const ax = axes(ctx, box, { xMax: TF, yMin: -vm, yMax: vm, xLabel: 't (s)', yLabel: 'v (m/s), up = +' });
        plot(ctx, ax, vAt, TF, rgba(col('--text'), 0.3), 1.5);
        plot(ctx, ax, vAt, Math.max(0.001, tc), col('--good'), 2.2);
        ball(ctx, ax.X(tc), ax.Y(vv), 4, col('--good'));
        text(ctx, `${fix(TF, 2)} s`, box.x + box.w, box.y + box.h + 12, { align: 'right', color: col('--muted'), size: 10 });
        const top = v0 > 0 ? `<span>max height <b>${fix(H + (v0 * v0) / (2 * g), 1)} m</b> at t = <b>${fix(v0 / g, 2)} s</b></span>` : '';
        ro.innerHTML = `<span>t = <b>${fix(tc, 2)} s</b></span><span>height y = <b>${fix(yy, 1)} m</b></span><span>v = <b>${sfix(vv, 1)} m/s</b></span><span>lands after <b>${fix(TF, 2)} s</b> at <b>${fix(Math.sqrt(v0 * v0 + 2 * g * H), 1)} m/s</b></span>${top}`;
      }
      const st = stage(cv, 0.62, draw);
      const upd = () => {
        H = Number(k('H').value); v0 = Number(k('v0').value); g = Number(k('g').value);
        k('Hv').textContent = `${H} m`; k('v0v').textContent = `${sfix(v0, 0)} m/s ${v0 > 0 ? '(up)' : v0 < 0 ? '(down)' : ''}`;
        t = 0; running = false; st.request();
      };
      ['H', 'v0'].forEach((n) => (k(n).oninput = upd));
      k('g').onchange = upd;
      k('go').onclick = () => { t = 0; running = true; };
      const stop = loop((dt) => {
        if (!running) return;
        t += dt;
        if (t >= tf()) { t = tf(); running = false; }
        st.draw();
      });
      upd();
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 7. Reference frames and relative velocity
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 7, id: 'p1u1-relative', title: 'Reference frames and relative velocity',
    render(el) {
      el.innerHTML = `
<p class="lead">You're sitting on a train, reading. To you, your book isn't moving. To someone on the platform, it's whizzing past at 30 m/s. Both are right. Every position and velocity is measured <i>relative to</i> something, and changing that something changes the numbers.</p>

<h2>Reference frames</h2>
<p>A <b>reference frame</b> is the point of view you measure from: an origin and axes that are attached to some object (the ground, a train, the water in a river). An observer at rest in that frame measures everything relative to it. Physics works the same way in any frame that isn't accelerating, but the <i>values</i> of positions and velocities depend on the frame.</p>
${call('idea', 'Big idea', 'There is no such thing as "the" velocity of an object. There is only its velocity <b>relative to</b> a particular frame. "The car moves at 25 m/s" quietly means "relative to the road."')}

<h2>Adding velocities between frames</h2>
<p>Suppose you walk toward the front of a train at 1.5 m/s (relative to the train), and the train moves at 20 m/s (relative to the ground). Every second, the train carries you 20 m and your legs carry you another 1.5 m. Relative to the ground you move 21.5 m/s. In general:</p>
${eq('\\[ \\vec v_{A\\,\\text{rel}\\,C} = \\vec v_{A\\,\\text{rel}\\,B} + \\vec v_{B\\,\\text{rel}\\,C} \\]', 'where \\(\\vec v_{A\\,\\text{rel}\\,C}\\) = velocity of object A measured in frame C (m/s); \\(\\vec v_{A\\,\\text{rel}\\,B}\\) = velocity of A measured in frame B; \\(\\vec v_{B\\,\\text{rel}\\,C}\\) = velocity of frame B measured in frame C. These are <b>vectors</b>: in 1D, keep the signs; in 2D, add them tip to tail. Notice the "inner" letters (B) chain together like dominoes.')}
<p>Two useful facts follow:</p>
<ul>
<li>Swapping the order flips the sign: \\(\\vec v_{B\\,\\text{rel}\\,A} = -\\vec v_{A\\,\\text{rel}\\,B}\\). If a car passes you at +5 m/s, you move at −5 m/s relative to the car.</li>
<li>Two cars approaching head-on at 25 m/s and 20 m/s (relative to the road) close the gap at 45 m/s relative to each other. Going the same way, the faster one gains at only 5 m/s.</li>
</ul>

<h2>A boat crossing a river</h2>
<p>The classic 2D case. The boat's motor pushes it through the <b>water</b> (\\(\\vec v_{\\text{boat rel water}}\\)), while the water itself flows downstream relative to the <b>ground</b> (\\(\\vec v_{\\text{water rel ground}}\\)). The velocity you'd see from the shore is their vector sum.</p>

<div class="sim" data-sim="river">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Boat speed (rel. water) <input type="range" data-k="vb" min="1" max="6" step="0.5" value="4"> <span data-k="vbv"></span></label>
    <label>Heading <input type="range" data-k="th" min="-60" max="60" step="1" value="0"> <span data-k="thv"></span></label>
    <label>Current <input type="range" data-k="vc" min="0" max="4" step="0.5" value="2"> <span data-k="vcv"></span></label>
    <label>View from <select data-k="frame"><option value="g">the shore (ground frame)</option><option value="w">a raft drifting with the water</option></select></label>
    <button class="btn small primary" data-k="go">Cross ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">The river is 60 m wide and flows to the right. Heading 0° points straight across; negative angles aim upstream. The inset adds the vectors tip to tail: <span style="color:var(--accent)">boat rel. water</span> + <span style="color:var(--warn)">water rel. ground</span> = <span style="color:var(--good)">boat rel. ground</span>. Switch to the raft's view: the boat goes exactly where it's pointed, and the shore slides past instead.</div>
</div>

<p>Because the current is perpendicular to the "across" direction, it can't help or hurt the crossing. The crossing time only depends on the boat's across-component: \\(t = W / (v_b\\cos\\theta)\\). The current only decides <i>where</i> you land.</p>

${call('analogy', 'Analogy: a moving walkway', 'Walk along an airport moving walkway and you fly past people standing on it. Walk backward against it at the walkway\'s speed and you stay in place relative to the floor: \\(v = (-1.0) + (+1.0) = 0\\).')}
${call('mistake', 'Common mistakes', '<ul><li>Adding speeds when the velocities point in different directions. In 2D, add vectors (Pythagoras for perpendicular ones), not plain numbers.</li><li>Thinking a stronger current makes the crossing take longer. If you aim straight across, it doesn\'t; you just drift farther downstream.</li><li>Losing track of "relative to what." Label every velocity with two letters.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect a scenario described by two observers ("a student on a cart tosses a ball straight up; what path does a student on the ground see?"). In the cart frame the ball goes straight up and down; in the ground frame it is a parabola. Both observers agree on the acceleration.')}
${check('You walk at 1.5 m/s toward the back of a train moving forward at 20 m/s. Your velocity relative to the ground is…', ['21.5 m/s forward', '18.5 m/s forward', '1.5 m/s backward', '18.5 m/s backward'], 1, 'Forward = +: \\(v = -1.5 + 20 = +18.5\\) m/s, still forward.')}
${check('A boat aims straight across a 60 m river at 4 m/s (relative to the water). The current is 3 m/s. How long does the crossing take?', ['12 s', '15 s', '20 s', '8.6 s'], 1, 'Only the across-component matters: \\(t = 60/4 = 15\\) s. (The boat\'s ground speed is 5 m/s, but part of that is sideways.)')}
${check('Car A drives east at 25 m/s; car B drives west at 20 m/s, toward A. The velocity of B relative to A is…', ['5 m/s west', '45 m/s west', '45 m/s east', '5 m/s east'], 1, 'East = +: \\(v_{B\\,\\text{rel}\\,A} = v_{B} - v_{A} = -20 - 25 = -45\\) m/s, i.e. 45 m/s west.')}
`;
      const host = el.querySelector('[data-sim="river"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      const W = 60;
      let vb = 4, th = 0, vc = 2, frame = 'g', t = 0, running = false;
      const comp = () => {
        const bx = vb * Math.sin(rad(th)), by = vb * Math.cos(rad(th));
        const T = W / by;
        return { bx, by, gx: bx + vc, gy: by, T };
      };
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const C = comp();
        const fx = frame === 'g' ? C.gx : C.bx; // boat x-velocity in the chosen frame
        const shift = frame === 'g' ? 0 : -vc;  // ground drift seen in the frame
        const xe = fx * C.T;
        const bankH = 26;
        const sy = (h - 2 * bankH - 20) / W;
        const span = Math.abs(xe) + 30;
        const s = Math.min(sy, (w - 40) / span);
        const cx = (Math.min(0, xe) + Math.max(0, xe)) / 2;
        const X = (x) => w / 2 + (x - cx) * s;
        const yNear = h - bankH - 10, yFar = yNear - W * s;
        const Y = (y) => yNear - y * s;
        // water
        ctx.fillStyle = rgba(col('--accent'), 0.12); ctx.fillRect(0, yFar, w, yNear - yFar);
        // banks
        ctx.fillStyle = rgba(col('--good'), 0.22); ctx.fillRect(0, yFar - bankH, w, bankH); ctx.fillRect(0, yNear, w, bankH);
        // trees on banks: fixed to the ground
        const xl = cx - w / 2 / s, xr = cx + w / 2 / s;
        const off = shift * t;
        const sp = 15;
        for (let x = Math.floor((xl - off) / sp) * sp; x <= xr - off + sp; x += sp) {
          [yFar - bankH / 2, yNear + bankH / 2].forEach((yy) => {
            ball(ctx, X(x + off), yy - 2, 6, rgba(col('--good'), 0.9));
          });
        }
        // ripples: fixed to the water
        const roff = (frame === 'g' ? vc : 0) * t;
        ctx.strokeStyle = rgba(col('--accent'), 0.5); ctx.lineWidth = 1.5;
        for (let j = 1; j < 6; j++) {
          const yy = (W * j) / 6;
          for (let x = Math.floor((xl - roff) / 12) * 12 + (j % 2) * 6; x <= xr - roff + 12; x += 12) {
            ctx.beginPath(); ctx.moveTo(X(x + roff), Y(yy)); ctx.lineTo(X(x + roff) + 10, Y(yy)); ctx.stroke();
          }
        }
        // planned path + start/landing points
        ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = col('--good'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(xe), Y(W)); ctx.stroke(); ctx.restore();
        ball(ctx, X(0), Y(0), 4, col('--text'));
        // boat
        const tc = Math.min(t, C.T);
        const bxp = X(fx * tc), byp = Y(C.by * tc);
        ctx.save(); ctx.translate(bxp, byp); ctx.rotate(rad(th));
        ctx.fillStyle = col('--warn');
        ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(6, -2); ctx.lineTo(6, 10); ctx.lineTo(-6, 10); ctx.lineTo(-6, -2); ctx.closePath(); ctx.fill();
        ctx.restore();
        // vector inset
        const ix = 16, iy = 16, iw = Math.min(170, w * 0.36), ih = 120;
        ctx.fillStyle = rgba(col('--surface'), 0.92); roundRect(ctx, ix, iy, iw, ih, 8); ctx.fill();
        ctx.strokeStyle = col('--border'); ctx.lineWidth = 1; ctx.stroke();
        const vs = Math.min(14, (ih - 30) / 6.5);
        const ox = ix + iw / 2 - ((C.bx + vc) * vs) / 2, oy = iy + ih - 12;
        arrow(ctx, ox, oy, ox + C.bx * vs, oy - C.by * vs, col('--accent'), 2.5, 8);
        if (vc > 0) arrow(ctx, ox + C.bx * vs, oy - C.by * vs, ox + C.gx * vs, oy - C.by * vs, col('--warn'), 2.5, 8);
        arrow(ctx, ox, oy, ox + C.gx * vs, oy - C.gy * vs, col('--good'), 2.5, 8);
        text(ctx, 'vector sum', ix + 8, iy + 11, { align: 'left', size: 10, color: col('--muted') });
        const vg = Math.hypot(C.gx, C.gy);
        const ang = deg(Math.atan2(C.gx, C.gy));
        const aim = vc < vb ? `<span>to land straight across, aim <b>${fix(deg(Math.asin(vc / vb)), 0)}° upstream</b></span>` : '<span>current ≥ boat speed: <b>can\'t land straight across</b></span>';
        ro.innerHTML = `<span>v<sub>boat rel ground</sub> = <b style="color:var(--good)">${fix(vg, 2)} m/s</b>, ${fix(Math.abs(ang), 0)}° ${ang >= 0 ? 'downstream' : 'upstream'} of straight across</span><span>crossing time = W / v<sub>across</sub> = 60 / ${fix(C.by, 2)} = <b>${fix(C.T, 1)} s</b></span><span>lands <b>${fix(Math.abs(C.gx * C.T), 1)} m ${C.gx >= 0 ? 'downstream' : 'upstream'}</b></span>${aim}`;
      }
      const st = stage(cv, 0.6, draw);
      const upd = () => {
        vb = Number(k('vb').value); th = Number(k('th').value); vc = Number(k('vc').value); frame = k('frame').value;
        k('vbv').textContent = `${fix(vb)} m/s`; k('thv').textContent = `${th > 0 ? th + '° downstream' : th < 0 ? -th + '° upstream' : 'straight across'}`; k('vcv').textContent = `${fix(vc)} m/s`;
        t = 0; running = false; st.request();
      };
      ['vb', 'th', 'vc'].forEach((n) => (k(n).oninput = upd));
      k('frame').onchange = upd;
      k('go').onclick = () => { t = 0; running = true; };
      const stop = loop((dt) => {
        if (!running) return;
        const T = comp().T;
        t += dt * Math.max(3, T / 5);
        if (t >= T) { t = T; running = false; }
        st.draw();
      });
      upd();
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 8. Vectors in 2D
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 8, id: 'p1u1-vectors', title: 'Vectors in two dimensions',
    render(el) {
      el.innerHTML = `
<p class="lead">In one dimension, a sign was enough to give a direction. On a flat field, a direction can be any angle, so we need a better tool. The trick that makes 2D physics easy: break every vector into two perpendicular 1D pieces, and handle each piece with everything you already know.</p>

<h2>What a vector is</h2>
<p>A vector is an arrow: its <b>length</b> is the magnitude (how much) and its <b>direction</b> is where it points. We write it with an arrow on top, \\(\\vec A\\), and its magnitude as \\(A\\) or \\(|\\vec A|\\). Moving an arrow around without turning or stretching it doesn't change the vector.</p>

<h2>Adding vectors: tip to tail</h2>
<p>Walk 4 m east, then 3 m north. Where are you? Draw the first arrow, then start the second arrow at the <b>tip</b> of the first. The <b>resultant</b> \\(\\vec R = \\vec A + \\vec B\\) runs from the very first tail to the very last tip: 5 m, a bit north of east. The order doesn't matter: \\(\\vec A + \\vec B = \\vec B + \\vec A\\) (the two orders make a parallelogram).</p>
<p>To <b>subtract</b>, add the opposite: \\(\\vec A - \\vec B = \\vec A + (-\\vec B)\\), where \\(-\\vec B\\) is the same arrow flipped around.</p>

<h2>Components: one 2D vector = two 1D numbers</h2>
<p>Any vector can be written as the sum of a horizontal arrow and a vertical arrow. Those are its <b>components</b>. With trigonometry on the right triangle they form:</p>
${eq('\\[ A_x = A\\cos\\theta, \\qquad A_y = A\\sin\\theta \\]', 'where \\(A\\) = magnitude of \\(\\vec A\\) (in its units, e.g. m or m/s); \\(\\theta\\) = angle measured from the +x axis (degrees); \\(A_x, A_y\\) = the x and y components, which are signed: negative means the component points in −x or −y.')}
<p>Going the other way, from components back to magnitude and direction, is Pythagoras plus the tangent:</p>
${eq('\\[ A = \\sqrt{A_x^2 + A_y^2}, \\qquad \\tan\\theta = \\frac{A_y}{A_x} \\]', 'where \\(\\theta\\) = direction angle from the +x axis. Check the quadrant: the calculator\'s \\(\\tan^{-1}\\) can\'t tell (−3, −4) from (3, 4).')}

<h2>Adding with components</h2>
<p>Here's the payoff: to add vectors, just add their components separately. \\(R_x = A_x + B_x\\) and \\(R_y = A_y + B_y\\). Two 1D additions, no messy triangle geometry. Drag the arrow tips below and watch the components add.</p>

<div class="sim" data-sim="vec">
  <canvas></canvas>
  <div class="sim-controls">
    <label><input type="checkbox" data-k="comp" checked> Show components</label>
    <label><input type="checkbox" data-k="sub"> Subtract (A − B)</label>
    <label><input type="checkbox" data-k="par"> Show B + A too</label>
    <button class="btn small" data-k="reset">Reset</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the tip of <span style="color:var(--accent)">A</span> or <span style="color:var(--warn)">B</span> (grid squares are 1 m). The <span style="color:var(--good)">resultant R</span> goes from the first tail to the last tip. With "Show B + A too," the other order traces the second half of a parallelogram and lands on the same tip.</div>
</div>

${call('analogy', 'Analogy: city blocks', 'In a grid city, "go 3 blocks east and 4 blocks north" is a perfect description of a trip. That\'s components. "Go 5 blocks\' worth at 53° north of east" is the same trip as a magnitude and angle. The crow flies the second; your feet walk the first.')}
${call('mistake', 'Common mistakes', '<ul><li>Adding magnitudes: 3 m + 4 m at right angles is 5 m, not 7 m. Magnitudes only add directly when the vectors point the same way.</li><li>Swapping sin and cos. \\(\\cos\\) goes with the side <i>adjacent</i> to the angle. If the angle is measured from the vertical, the roles swap.</li><li>Forgetting component signs for vectors pointing left or down.</li></ul>')}
${call('ap', 'On the AP exam', 'You\'ll resolve velocities and forces into components constantly: launch velocities in Unit 1, forces on inclines and tensions in Unit 2. Draw the right triangle, label the angle, and say which component uses sin and which uses cos.')}
${check('A hiker walks 3 km east, then 4 km north. Her displacement is…', ['7 km at 53° north of east', '5 km at 53° north of east', '5 km at 37° north of east', '1 km north'], 1, '\\(R = \\sqrt{3^2 + 4^2} = 5\\) km; \\(\\tan\\theta = 4/3\\), \\(\\theta = 53°\\) above east.')}
${check('A velocity of 10 m/s points 30° above the +x axis. Its components are…', ['\\(v_x = 5\\), \\(v_y = 8.7\\) m/s', '\\(v_x = 8.7\\), \\(v_y = 5\\) m/s', '\\(v_x = 10\\), \\(v_y = 0\\) m/s', '\\(v_x = 7.1\\), \\(v_y = 7.1\\) m/s'], 1, '\\(v_x = 10\\cos30° = 8.7\\) m/s, \\(v_y = 10\\sin30° = 5\\) m/s.')}
${check('Two vectors have magnitudes 3 N and 4 N. Which can NOT be the magnitude of their sum?', ['1 N', '5 N', '7 N', '8 N'], 3, 'The sum ranges from 4 − 3 = 1 (opposite) to 4 + 3 = 7 (same direction). 8 is impossible.')}
`;
      const host = el.querySelector('[data-sim="vec"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      const A = { x: 5, y: 2 }, B = { x: 2, y: 4 };
      let geo = null;
      function setGeo(w, h) {
        const s = Math.min(w / 17, h / 11);
        geo = { s, ox: w / 2 - 6 * s, oy: h / 2 + 3.5 * s };
        geo.X = (x) => geo.ox + x * s; geo.Y = (y) => geo.oy - y * s;
        geo.ix = (px) => (px - geo.ox) / s; geo.iy = (py) => (geo.oy - py) / s;
      }
      const sub = () => k('sub').checked;
      const Beff = () => (sub() ? { x: -B.x, y: -B.y } : B);
      function vec(ctx, x1, y1, x2, y2, color, label, lw = 3) {
        const { X, Y } = geo;
        arrow(ctx, X(x1), Y(y1), X(x2), Y(y2), color, lw, 11);
        if (label) text(ctx, label, (X(x1) + X(x2)) / 2 - (Y(y2) - Y(y1)) * 0.08 - 8, (Y(y1) + Y(y2)) / 2 + (X(x2) - X(x1)) * 0.08 - 8, { color, weight: 700, size: 14 });
      }
      function compLegs(ctx, x1, y1, dx, dy, color) {
        const { X, Y } = geo;
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = color; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(X(x1), Y(y1)); ctx.lineTo(X(x1 + dx), Y(y1)); ctx.lineTo(X(x1 + dx), Y(y1 + dy)); ctx.stroke(); ctx.restore();
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        setGeo(w, h);
        const { X, Y, s } = geo;
        // grid
        ctx.strokeStyle = rgba(col('--border'), 1); ctx.lineWidth = 1;
        for (let x = Math.ceil(geo.ix(0)); x <= geo.ix(w); x++) { ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), h); ctx.stroke(); }
        for (let y = Math.ceil(geo.iy(h)); y <= geo.iy(0); y++) { ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(w, Y(y)); ctx.stroke(); }
        ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();
        text(ctx, '+x', w - 12, Y(0) - 10, { color: col('--muted'), size: 11 });
        text(ctx, '+y', X(0) + 14, 12, { color: col('--muted'), size: 11 });
        const b = Beff();
        const R = { x: A.x + b.x, y: A.y + b.y };
        if (k('par').checked) {
          ctx.save(); ctx.globalAlpha = 0.4;
          vec(ctx, 0, 0, b.x, b.y, col('--warn'), '', 2.5);
          vec(ctx, b.x, b.y, R.x, R.y, col('--accent'), '', 2.5);
          ctx.restore();
        }
        if (k('comp').checked) {
          compLegs(ctx, 0, 0, A.x, A.y, col('--accent'));
          compLegs(ctx, A.x, A.y, b.x, b.y, col('--warn'));
          compLegs(ctx, 0, 0, R.x, R.y, rgba(col('--good'), 0.7));
        }
        vec(ctx, 0, 0, R.x, R.y, col('--good'), 'R', 3.5);
        vec(ctx, 0, 0, A.x, A.y, col('--accent'), 'A');
        vec(ctx, A.x, A.y, R.x, R.y, col('--warn'), sub() ? '−B' : 'B');
        // handles
        [[A.x, A.y, '--accent'], [R.x, R.y, '--warn']].forEach(([x, y, c]) => {
          ctx.beginPath(); ctx.arc(X(x), Y(y), 7, 0, Math.PI * 2); ctx.fillStyle = col('--surface'); ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = col(c); ctx.stroke();
        });
        const mag = (v) => Math.hypot(v.x, v.y), ang = (v) => deg(Math.atan2(v.y, v.x));
        const row = (n, v, c) => `<span><b style="color:var(${c})">${n}</b> = (${sfix(v.x)}, ${sfix(v.y)}) m → <b>${fix(mag(v), 2)} m</b> at <b>${fix(ang(v), 0)}°</b></span>`;
        ro.innerHTML = row('A', A, '--accent') + row(sub() ? '−B' : 'B', b, '--warn') +
          `<span><b style="color:var(--good)">R</b> = (${sfix(A.x)} ${b.x < 0 ? '−' : '+'} ${fix(Math.abs(b.x))}, ${sfix(A.y)} ${b.y < 0 ? '−' : '+'} ${fix(Math.abs(b.y))}) = (${sfix(R.x)}, ${sfix(R.y)}) m → <b>${fix(mag(R), 2)} m</b> at <b>${fix(ang(R), 0)}°</b></span>` +
          `<span class="muted">|A| + |B| = ${fix(mag(A) + mag(B), 2)} m, but |R| = ${fix(mag(R), 2)} m</span>`;
      }
      const st = stage(cv, 0.62, draw);
      const snap = (v) => Math.round(v * 2) / 2;
      drag(
        cv,
        (px, py) => {
          if (!geo) return null;
          const b = Beff();
          if (Math.hypot(px - geo.X(A.x + b.x), py - geo.Y(A.y + b.y)) < 18) return 'B';
          if (Math.hypot(px - geo.X(A.x), py - geo.Y(A.y)) < 18) return 'A';
          return null;
        },
        (which, px, py) => {
          const x = snap(clamp(geo.ix(px), geo.ix(8), geo.ix(st.w - 8))), y = snap(clamp(geo.iy(py), geo.iy(st.h - 8), geo.iy(8)));
          if (which === 'A') { A.x = x; A.y = y; }
          else { const dx = x - A.x, dy = y - A.y; B.x = sub() ? -dx : dx; B.y = sub() ? -dy : dy; }
          st.request();
        }
      );
      ['comp', 'sub', 'par'].forEach((n) => (k(n).onchange = () => st.request()));
      k('reset').onclick = () => { A.x = 5; A.y = 2; B.x = 2; B.y = 4; st.request(); };
      st.draw();
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 9. Projectile motion
  // =====================================================================
  LESSONS.push({
    unit: 11, order: 9, id: 'p1u1-projectile', title: 'Projectile motion: two motions at once',
    render(el) {
      el.innerHTML = `
<p class="lead">Roll a ball off a table and drop another from the same height at the same moment. They hit the floor together. That one experiment unlocks all of projectile motion: the sideways motion and the up-down motion happen at the same time but completely ignore each other.</p>

<h2>Independence of horizontal and vertical motion</h2>
<p>Once a projectile is launched (and air resistance is ignored), the only force on it is gravity, which points straight down. So:</p>
<ul>
<li><b>Horizontally</b>: no force, no acceleration. \\(v_x\\) never changes. Equal distances in equal times.</li>
<li><b>Vertically</b>: acceleration \\(g\\) downward, exactly like the free fall you already know.</li>
</ul>
<p>Gravity can't speed up or slow down a sideways motion, and moving sideways doesn't change how fast you fall. The curved path is just the two simple motions drawn on top of each other.</p>

<h2>Split the launch velocity</h2>
<p>A projectile launched at speed \\(v_0\\) at angle \\(\\theta\\) above horizontal starts with components</p>
${eq('\\[ v_{x0} = v_0\\cos\\theta, \\qquad v_{y0} = v_0\\sin\\theta \\]', 'where \\(v_0\\) = launch speed (m/s); \\(\\theta\\) = launch angle above the horizontal; \\(v_{x0}, v_{y0}\\) = horizontal and vertical launch components (m/s).')}
<p>Then the two independent motions are (taking up as +):</p>
${eq('\\[ x = v_{x0}\\,t \\qquad\\qquad y = y_0 + v_{y0}\\,t - \\tfrac12 g t^2, \\quad v_y = v_{y0} - g t \\]', 'where \\(x\\) = horizontal distance from the launch point (m); \\(y\\) = height (m), starting at \\(y_0\\); \\(t\\) = time since launch (s); \\(g = 9.8\\) m/s². The <b>only</b> thing the two columns share is the time \\(t\\).')}
${call('idea', 'Strategy: time is the bridge', 'Almost every projectile problem goes: use the vertical motion to find the time in the air, then use that time in \\(x = v_{x0}t\\) to find how far it went (or the reverse). Make a two-column table, x and y, and never mix them.')}

<div class="sim" data-sim="proj">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Speed <input type="range" data-k="v0" min="5" max="30" step="0.5" value="18"> <span data-k="v0v"></span></label>
    <label>Angle <input type="range" data-k="th" min="0" max="90" step="1" value="40"> <span data-k="thv"></span></label>
    <label>Launch height <input type="range" data-k="H" min="0" max="30" step="1" value="0"> <span data-k="Hv"></span></label>
    <label><input type="checkbox" data-k="shadow" checked> Shadows</label>
    <label><input type="checkbox" data-k="comp"> Compare 90° − θ</label>
    <button class="btn small primary" data-k="fire">Fire ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Strobe dots every 0.25 s. The <span style="color:var(--accent)">horizontal arrow (vₓ)</span> never changes; the <span style="color:var(--good)">vertical arrow (v_y)</span> shrinks, flips, and grows, just like a ball thrown straight up. The shadows on the ground and the left wall show the two motions separately: one steady, one free fall. Set the height to 0 and try 30° and 60°: same range.</div>
</div>

<h2>Useful results</h2>
<ul>
<li><b>Horizontal launch</b> (\\(\\theta = 0\\)) from height \\(h\\): it falls like a dropped object, so \\(t = \\sqrt{2h/g}\\), and lands \\(x = v_0 t\\) away.</li>
<li><b>At the top</b> of the path \\(v_y = 0\\) but \\(v_x\\) is not: the speed there is \\(v_0\\cos\\theta\\), the slowest point of the flight, never zero (unless launched straight up).</li>
<li><b>Level ground</b>: by symmetry the ball lands at the launch speed, at the same angle below the horizontal. The range is largest at 45°, and complementary angles (30° and 60°) give the same range.</li>
</ul>
${eq('\\[ R = \\frac{v_0^2 \\sin 2\\theta}{g} \\quad \\text{(level ground only)} \\]', 'where \\(R\\) = horizontal range (m) when the landing height equals the launch height. Not on the AP equation sheet: derive it from the two columns if you need it, and never use it for a launch off a cliff.')}

${call('analogy', 'Analogy: the monkey and the hunter', 'A hunter aims straight at a monkey hanging from a branch. The moment the dart leaves the gun, the monkey lets go. Both fall the same distance \\(\\tfrac12 g t^2\\) in the same time, so the dart still hits. Gravity pulls the whole picture down equally; it doesn\'t care about sideways motion.')}
${call('mistake', 'Common mistakes', '<ul><li>"At the top, the velocity is zero." Only the vertical part is zero.</li><li>Using \\(v_0\\) in the vertical equations instead of \\(v_0\\sin\\theta\\).</li><li>Thinking a faster horizontal throw stays in the air longer. Time in the air depends only on the vertical motion.</li><li>Giving the horizontal motion an acceleration. In Physics 1 projectiles, \\(a_x = 0\\).</li></ul>')}
${call('ap', 'On the AP exam', 'Classic setups: a ball rolled off a table (find where it lands), comparing two launches (which lands first, which goes farther), and sketching \\(v_x\\)–t and \\(v_y\\)–t graphs (flat line, and a straight line with slope −g). Justify "same time in the air" with "same vertical motion."')}
${check('A ball rolls off a 1.25 m high table at 3.0 m/s. How far from the table\'s edge does it land?', ['0.5 m', '1.5 m', '3.0 m', '3.75 m'], 1, 'Vertical: \\(1.25 = \\tfrac12(9.8)t^2\\) → \\(t \\approx 0.505\\) s. Horizontal: \\(x = 3.0 \\times 0.505 \\approx 1.5\\) m.')}
${check('At the highest point of a projectile\'s flight (launched at 40°), which is true?', ['v = 0 and a = 0', 'v = 0 and a = g down', 'v = v₀cos40° and a = g down', 'v = v₀cos40° and a = 0'], 2, 'Only the vertical component is zero; the horizontal part stays \\(v_0\\cos40°\\). Gravity never switches off.')}
${check('Ball A is dropped from a cliff. Ball B is thrown horizontally at 20 m/s from the same cliff at the same instant. Which lands first?', ['A', 'B', 'They land together', 'It depends on the cliff height'], 2, 'Both start with \\(v_{y0} = 0\\) and accelerate at g, so they fall identically. B just lands farther away.')}
`;
      const host = el.querySelector('[data-sim="proj"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const k = q(host);
      let v0 = 18, th = 40, H = 0, t = 0, running = false, fired = false;
      const flight = (ang) => {
        const vx = v0 * Math.cos(rad(ang)), vy = v0 * Math.sin(rad(ang));
        const tf = (vy + Math.sqrt(vy * vy + 2 * G * H)) / G;
        return { vx, vy, tf, R: vx * tf, top: H + (vy * vy) / (2 * G), ttop: vy / G };
      };
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const F = flight(th), F2 = flight(90 - th);
        const cmp = k('comp').checked;
        const xspan = Math.max(10, F.R, cmp ? F2.R : 0) * 1.08;
        const yspan = Math.max(5, F.top, cmp ? F2.top : 0) * 1.15;
        const left = 46, gy = h - 28;
        const s = Math.min((w - left - 16) / xspan, (gy - 14) / yspan);
        const X = (x) => left + x * s, Y = (y) => gy - y * s;
        // ground, tower
        ctx.fillStyle = col('--border'); ctx.fillRect(0, gy, w, h - gy);
        if (H > 0) { ctx.fillStyle = rgba(col('--muted'), 0.35); ctx.fillRect(left - 16, Y(H), 16, gy - Y(H)); }
        // axis ticks
        const step = niceStep(xspan, 8);
        for (let x = 0; x <= xspan; x += step) text(ctx, `${fix(x, 0)}`, X(x), gy + 14, { color: col('--muted'), size: 10 });
        text(ctx, 'm', w - 8, gy + 14, { align: 'right', color: col('--muted'), size: 10 });
        // preview paths
        const pathOf = (FF, color, dash) => {
          ctx.save(); ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) { const tt = (FF.tf * i) / 80; const px = X(FF.vx * tt), py = Y(H + FF.vy * tt - 0.5 * G * tt * tt); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.stroke(); ctx.restore();
        };
        if (cmp) pathOf(F2, rgba(col('--warn'), 0.8), [3, 4]);
        pathOf(F, rgba(col('--accent'), 0.6), [6, 5]);
        // max height marker
        ctx.save(); ctx.setLineDash([2, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(left, Y(F.top)); ctx.lineTo(X(F.vx * F.ttop), Y(F.top)); ctx.stroke(); ctx.restore();
        text(ctx, `${fix(F.top, 1)} m`, left - 4, Y(F.top), { align: 'right', color: col('--muted'), size: 10 });
        const tc = fired ? Math.min(t, F.tf) : 0;
        const pos = (tt) => [F.vx * tt, H + F.vy * tt - 0.5 * G * tt * tt];
        // strobe dots
        for (let tt = 0.25; tt < tc; tt += 0.25) { const [x, y] = pos(tt); ctx.save(); ctx.globalAlpha = 0.35; ball(ctx, X(x), Y(y), 5, col('--accent')); ctx.restore(); }
        const [x, y] = pos(tc);
        const vy = F.vy - G * tc;
        if (k('shadow').checked && fired) {
          ball(ctx, X(x), gy - 4, 5, rgba(col('--accent'), 0.6));
          ball(ctx, left - 26, Y(y), 5, rgba(col('--good'), 0.7));
          ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = rgba(col('--muted'), 0.7); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x), gy - 4); ctx.moveTo(X(x), Y(y)); ctx.lineTo(left - 26, Y(y)); ctx.stroke(); ctx.restore();
        }
        const vsc = 2.2;
        if (tc < F.tf || !fired) {
          if (F.vx > 0.05) arrow(ctx, X(x), Y(y), X(x) + F.vx * vsc, Y(y), col('--accent'), 2.5, 8);
          if (Math.abs(vy) > 0.05) arrow(ctx, X(x), Y(y), X(x), Y(y) - vy * vsc, col('--good'), 2.5, 8);
          arrow(ctx, X(x), Y(y), X(x) + F.vx * vsc, Y(y) - vy * vsc, rgba(col('--text'), 0.55), 1.5, 7);
        }
        ball(ctx, X(x), Y(y), 7, col('--accent'));
        const speed = Math.hypot(F.vx, vy);
        const comp = cmp ? `<span style="color:var(--warn)">${90 - th}°: range <b>${fix(F2.R, 1)} m</b>, flight <b>${fix(F2.tf, 2)} s</b></span>` : '';
        ro.innerHTML = `<span>v<sub>x0</sub> = ${fix(v0)}cos${th}° = <b style="color:var(--accent)">${fix(F.vx, 2)} m/s</b></span><span>v<sub>y0</sub> = ${fix(v0)}sin${th}° = <b style="color:var(--good)">${fix(F.vy, 2)} m/s</b></span><span>t = <b>${fix(tc, 2)} s</b>, v<sub>y</sub> = <b>${sfix(vy, 2)} m/s</b>, speed <b>${fix(speed, 2)} m/s</b></span><span>time in air <b>${fix(F.tf, 2)} s</b> · range <b>${fix(F.R, 1)} m</b> · max height <b>${fix(F.top, 1)} m</b></span>${comp}`;
      }
      const st = stage(cv, 0.55, draw);
      const upd = () => {
        v0 = Number(k('v0').value); th = Number(k('th').value); H = Number(k('H').value);
        k('v0v').textContent = `${fix(v0)} m/s`; k('thv').textContent = `${th}°`; k('Hv').textContent = `${H} m`;
        t = 0; running = false; fired = false; st.request();
      };
      ['v0', 'th', 'H'].forEach((n) => (k(n).oninput = upd));
      ['shadow', 'comp'].forEach((n) => (k(n).onchange = () => st.request()));
      k('fire').onclick = () => { t = 0; running = true; fired = true; };
      const stop = loop((dt) => {
        if (!running) return;
        const F = flight(th);
        t += dt * Math.max(1, F.tf / 4);
        if (t >= F.tf) { t = F.tf; running = false; }
        st.draw();
      });
      upd();
      return () => { stop(); st.destroy(); };
    },
  });
})();
