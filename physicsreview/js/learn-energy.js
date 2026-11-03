// AP Physics 1 · Unit 3 — Work, Energy, and Power.
// Visual, first-principles lessons. Pushes lesson objects onto window.LESSONS.
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);
  const { col, clamp, lerp, rgba, sci, signed, eq, call, check, arrow, text, roundRect, tag, axes, plot, stage, drag, loop } = window.PRKit;

  const G = 9.8; // m/s²

  // ---------- small helpers ----------
  const fx = (x, n = 3) => sci(x, n);
  const deg = (r) => (r * 180) / Math.PI;
  const rad = (d) => (d * Math.PI) / 180;

  // Vertical bar chart inside box {x, y, w, h}. bars: [{label, v, color}].
  // With o.neg, the zero line sits higher so negative bars (e.g. negative work) have room.
  function bars(ctx, box, list, max, o = {}) {
    const n = list.length, gap = box.w / n, bw = Math.min(40, gap * 0.62);
    const labY = box.y + box.h - 8;
    const zeroY = o.neg ? box.y + (box.h - 18) * 0.62 : box.y + box.h - 20;
    const upRoom = zeroY - box.y - 16, downRoom = box.y + box.h - 22 - zeroY;
    const sc = upRoom / (max || 1);
    if (o.title) text(ctx, o.title, box.x + box.w / 2, box.y + 4, { color: col('--muted'), size: 11, weight: 600 });
    list.forEach((b, i) => {
      const cx = box.x + gap * (i + 0.5);
      let hh = b.v * sc;
      if (hh < 0) hh = Math.max(hh, -downRoom);
      hh = Math.min(hh, upRoom + 6);
      ctx.fillStyle = b.color;
      if (Math.abs(hh) > 0.5) ctx.fillRect(cx - bw / 2, hh > 0 ? zeroY - hh : zeroY, bw, Math.abs(hh));
      text(ctx, b.label, cx, labY, { size: 11, weight: 600, color: col('--muted') });
      if (o.values !== false) {
        const vy = hh >= 0 ? zeroY - hh - 8 : zeroY - hh + 9;
        text(ctx, (o.fmt || ((v) => Math.round(v)))(b.v), cx, vy, { size: 10.5, weight: 600 });
      }
    });
    ctx.strokeStyle = col('--text'); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(box.x + 4, zeroY); ctx.lineTo(box.x + box.w - 4, zeroY); ctx.stroke();
  }

  // Horizontal zigzag spring from x1 to x2 at height y.
  function spring(ctx, x1, x2, y, amp = 9, coils = 10, color) {
    ctx.strokeStyle = color || col('--text'); ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const lead = Math.min(10, (x2 - x1) * 0.1);
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + lead, y);
    const L = x2 - x1 - 2 * lead;
    for (let i = 0; i < coils * 2; i++) {
      ctx.lineTo(x1 + lead + (L * (i + 0.5)) / (coils * 2), y + (i % 2 ? amp : -amp));
    }
    ctx.lineTo(x2 - lead, y); ctx.lineTo(x2, y); ctx.stroke();
  }

  function crate(ctx, x, y, w, h, label) {
    ctx.fillStyle = col('--warn'); roundRect(ctx, x, y, w, h, 4); ctx.fill();
    ctx.strokeStyle = rgba(col('--text'), 0.35); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + w - 4, y + h - 4); ctx.moveTo(x + w - 4, y + 4); ctx.lineTo(x + 4, y + h - 4); ctx.stroke();
    if (label) text(ctx, label, x + w / 2, y + h / 2, { weight: 700, size: 12, color: col('--text') });
  }

  function ground(ctx, x1, x2, y) {
    ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.strokeStyle = rgba(col('--muted'), 0.5); ctx.lineWidth = 1;
    for (let x = x1 + 6; x < x2; x += 14) { ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x - 8, y + 10); ctx.stroke(); }
  }

  const q$ = (host) => (k) => host.querySelector(`[data-k="${k}"]`);

  // =====================================================================
  // 1. Kinetic energy
  // =====================================================================
  LESSONS.push({
    unit: 13, order: 1, id: 'p1u3-kinetic', title: 'Kinetic energy: the energy of motion',
    render(el) {
      el.innerHTML = `
<p class="lead">Forces tell you how motion changes from moment to moment. Energy is a second way to look at the same physics — an accounting system. Instead of tracking every push along the way, you track one number that can move between objects and change form, but never appears from nothing. The first form to meet is the energy an object has simply because it is moving.</p>

<h2>What "energy" means</h2>
<p><b>Energy</b> is a scalar quantity (just a size, no direction) that describes a system's ability to change things — to speed something up, lift it, squash it, warm it. It is measured in <b>joules</b>: \\(1\\text{ J} = 1\\text{ kg·m}^2/\\text{s}^2 = 1\\text{ N·m}\\). One joule is roughly the energy to lift an apple (about 1 N of weight) up 1 meter.</p>
<p>Energy comes in a few forms you will use all unit: <b>kinetic</b> (motion), <b>potential</b> (stored by position or arrangement), and <b>internal/thermal</b> (the jiggling of atoms — what friction makes). This lesson is about the first.</p>

<h2>Kinetic energy</h2>
${eq('\\[ K = \\tfrac12 m v^2 \\]', 'where \\(K\\) = translational kinetic energy (J); \\(m\\) = mass of the object (kg); \\(v\\) = its speed (m/s). Speed, not velocity: the direction does not matter, and \\(v^2\\) is never negative, so \\(K \\ge 0\\) always.')}
<p>Two things jump out of this formula:</p>
<ul>
<li><b>K is proportional to mass.</b> A 2000 kg truck at the same speed as a 1000 kg car has twice the kinetic energy.</li>
<li><b>K is proportional to speed squared.</b> Double your speed and K becomes <b>four</b> times bigger. Triple it: nine times. That is why highway crashes are so much worse than parking-lot bumps, and why stopping distance grows so fast with speed.</li>
</ul>

<div class="sim" data-sim="ke">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Mass <input type="range" data-k="m" min="200" max="2000" step="50" value="1000"> <span data-k="mv"></span></label>
    <label>Speed <input type="range" data-k="v" min="0" max="30" step="0.5" value="10"> <span data-k="vv"></span></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Left: the car drives at the chosen speed. Right: K against speed for this mass — a parabola, not a straight line. The hollow dot shows where you would be at double the speed: four times higher on the graph.</div>
</div>

<h2>Direction doesn't matter</h2>
<p>A ball moving left at 3 m/s has exactly the same K as the same ball moving right at 3 m/s, or straight up at 3 m/s. Kinetic energy has no direction and no sign. If an object's speed stays the same while it turns a corner (like a car on a circular track), its kinetic energy is constant even though its velocity is changing.</p>

<h2>Kinetic energy of a system</h2>
<p>For several objects, the system's kinetic energy is just the sum: \\(K_{\\text{sys}} = \\tfrac12 m_1v_1^2 + \\tfrac12 m_2v_2^2 + \\dots\\). Every term is positive, so the total can only be zero if every piece is at rest.</p>

${call('idea', 'The big idea', 'Energy is an account balance. In the next lessons you will see the two ways the balance changes: forces doing <b>work</b> on the system from outside, and energy changing form <b>inside</b> the system (motion ↔ height ↔ spring squish ↔ heat).')}
${call('analogy', 'Analogy: a battering ram', 'Doubling the speed of a battering ram doesn\'t just hit twice as hard in the energy sense — it delivers four times the energy into the door. The squared speed is why speed limits matter more than vehicle weight.')}
${call('mistake', 'Common mistakes', '<ul><li>Forgetting to square: going from 10 to 20 m/s multiplies K by 4, not 2.</li><li>Giving K a negative sign because the object moves in the −x direction. K is never negative.</li><li>Forgetting the ½. \\(K = mv^2\\) is off by a factor of 2.</li></ul>')}
${call('ap', 'On the AP exam', 'Ratio questions are a favorite: "Object A has twice the mass and half the speed of B. Compare their kinetic energies." \\(K_A/K_B = 2 \\times (1/2)^2 = 1/2\\). Set up the ratio instead of plugging in made-up numbers.')}
${check('A cart\'s speed increases from 3 m/s to 6 m/s. Its kinetic energy…', ['Doubles', 'Triples', 'Quadruples', 'Stays the same'], 2, 'K ∝ v². The speed doubles, so K is multiplied by 2² = 4.')}
${check('Ball A has mass m and speed 2v. Ball B has mass 2m and speed v. Which has more kinetic energy?', ['A, by a factor of 2', 'B, by a factor of 2', 'They are equal', 'A, by a factor of 4'], 0, '\\(K_A = \\tfrac12 m (2v)^2 = 2mv^2\\). \\(K_B = \\tfrac12 (2m)v^2 = mv^2\\). Speed is squared, mass is not, so A has twice as much.')}
${check('A car drives around a circular track at a steady 20 m/s. Its kinetic energy…', ['Increases', 'Decreases', 'Stays constant', 'Keeps changing sign'], 2, 'K depends only on speed. The direction of the velocity changes, but the speed (and so K) stays the same.')}
`;
      const host = el.querySelector('[data-sim="ke"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = q$(host);
      const s = { m: 1000, v: 10 };
      let xpos = 0;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 560;
        const leftW = narrow ? w : w * 0.52;
        const roadY = narrow ? h * 0.36 : h * 0.62;
        ground(ctx, 8, leftW - 8, roadY);
        const ppm = (leftW - 16) / 40; // 40 m of road visible
        const cw = 34 + (s.m / 2000) * 40, ch = 16 + (s.m / 2000) * 14;
        const span = leftW - 16 + cw;
        const cx = 8 - cw + (((xpos * ppm) % span) + span) % span;
        ctx.fillStyle = col('--accent'); roundRect(ctx, cx, roadY - ch - 8, cw, ch, 5); ctx.fill();
        ctx.fillStyle = rgba(col('--surface'), 0.6); roundRect(ctx, cx + cw * 0.55, roadY - ch - 4, cw * 0.3, ch * 0.4, 3); ctx.fill();
        ctx.fillStyle = col('--text');
        [cx + cw * 0.22, cx + cw * 0.78].forEach((wx) => { ctx.beginPath(); ctx.arc(wx, roadY - 6, 6, 0, Math.PI * 2); ctx.fill(); });
        if (s.v > 0) arrow(ctx, cx + cw / 2, roadY - ch - 22, cx + cw / 2 + 8 + s.v * 2.2, roadY - ch - 22, col('--good'), 2.5, 9);
        text(ctx, `v = ${s.v} m/s`, 14, 16, { align: 'left', weight: 700, size: 13 });
        text(ctx, `m = ${s.m} kg`, 14, 34, { align: 'left', color: col('--muted') });
        // K vs v graph
        const K = 0.5 * s.m * s.v * s.v;
        const box = narrow ? { x: 46, y: h * 0.5, w: w - 60, h: h * 0.44 } : { x: w * 0.6, y: 18, w: w * 0.37, h: h - 46 };
        const ax = axes(ctx, box, { xMax: 30, yMin: 0, yMax: 900, yLabel: 'K (kJ)', xLabel: 'v (m/s) →' });
        plot(ctx, ax, (v) => (0.5 * s.m * v * v) / 1000, 30, col('--accent'), 2.2);
        text(ctx, '900', box.x - 4, box.y + 4, { align: 'right', size: 10, color: col('--muted') });
        text(ctx, '0', box.x - 4, box.y + box.h - 2, { align: 'right', size: 10, color: col('--muted') });
        if (2 * s.v <= 30 && s.v > 0) {
          const px = ax.X(2 * s.v), py = ax.Y((4 * K) / 1000);
          ctx.setLineDash([4, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, box.y + box.h); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2; ctx.stroke();
          text(ctx, '2v → 4K', px - 6, py - 12, { align: 'right', size: 11, color: col('--muted'), weight: 600 });
        }
        const px = ax.X(s.v), py = ax.Y(K / 1000);
        ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fillStyle = col('--accent'); ctx.fill();
      }
      const st = stage(cv, 0.55, draw);
      function upd() {
        s.m = Number(q('m').value); s.v = Number(q('v').value);
        q('mv').textContent = `${s.m} kg`; q('vv').textContent = `${s.v} m/s`;
        const K = 0.5 * s.m * s.v * s.v;
        ro.innerHTML = `<span>K = ½(${s.m})(${s.v})² = <b>${fx(K)} J</b></span><span>at 2v: <b>${fx(4 * K)} J</b> (×4)</span><span>with 2m: <b>${fx(2 * K)} J</b> (×2)</span>`;
        st.request();
      }
      ['m', 'v'].forEach((k) => (q(k).oninput = upd));
      upd();
      const stop = loop((dt) => { xpos += s.v * dt; st.draw(); });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 2. Work
  // =====================================================================
  LESSONS.push({
    unit: 13, order: 2, id: 'p1u3-work', title: 'Work: how forces move energy in and out',
    render(el) {
      el.innerHTML = `
<p class="lead">How does energy get into a system? The most common way is a force from outside pushing or pulling while the object moves. Physicists call that transfer <b>work</b>. Work is not "effort" — you can hold a heavy bag until your arms shake and do zero work on it.</p>

<h2>Work needs force AND motion along the force</h2>
<p>Push a box across the floor and it speeds up: energy went into it. Push on a wall that doesn't move: nothing changes, no energy went into the wall. So work needs a <b>displacement</b>. And only the part of the force <b>along</b> the displacement counts — a straight-down push on a sliding box doesn't speed it up or slow it down.</p>
${eq('\\[ W = F_{\\parallel}\\, d = F d \\cos\\theta \\]', 'where \\(W\\) = work done by one particular force (J); \\(F\\) = magnitude of that force (N), assumed constant; \\(d\\) = magnitude of the displacement of the point where the force acts (m); \\(\\theta\\) = angle between the force and the displacement; \\(F_{\\parallel} = F\\cos\\theta\\) = component of the force along the displacement.')}

<div class="sim" data-sim="work">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Force <input type="range" data-k="F" min="0" max="50" step="1" value="30"> <span data-k="Fv"></span></label>
    <label>Angle θ <input type="range" data-k="th" min="0" max="180" step="1" value="35"> <span data-k="thv"></span></label>
    <button class="btn small primary" data-k="go">Pull ▸</button>
    <button class="btn small" data-k="reset">Reset</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the tip of the orange force arrow (or use the sliders). The crate always slides 4 m to the right. The green arrow is the part of the force along the motion — the only part that does work. The gray dashed part is perpendicular and does nothing.</div>
</div>

<h2>The sign of work</h2>
<ul>
<li>\\(0^\\circ \\le \\theta < 90^\\circ\\): force has a component <b>with</b> the motion → \\(W > 0\\). The force puts energy <b>into</b> the object.</li>
<li>\\(\\theta = 90^\\circ\\): force is perpendicular → \\(W = 0\\). No energy transferred. (The normal force on a box sliding on a level floor; gravity on a box sliding horizontally; the string force on a ball whirled in a circle.)</li>
<li>\\(90^\\circ < \\theta \\le 180^\\circ\\): force has a component <b>against</b> the motion → \\(W < 0\\). The force takes energy <b>out</b>. Kinetic friction on a sliding object is the classic example (\\(\\theta = 180^\\circ\\)).</li>
</ul>
<p>Work is a scalar. The negative sign does not mean a direction; it means energy flowed out of the object instead of in.</p>

<h2>Net work</h2>
<p>When several forces act, each does its own work. The <b>net work</b> is the sum: \\(W_{\\text{net}} = W_1 + W_2 + \\dots\\), which is the same as the work done by the net force. In the next lesson this net work turns out to equal the change in kinetic energy.</p>

${call('analogy', 'Analogy: pushing a stalled car', 'Push from directly behind: all your effort helps. Push from the side at an angle: only the forward part helps; the sideways part just presses the car into the road. Push from the front: you slow it down — negative work.')}
${call('mistake', 'Common mistakes', '<ul><li>Using the total distance a person walks while carrying a box horizontally. The lifting force is vertical and the motion is horizontal: θ = 90°, W = 0.</li><li>Using the angle to the vertical when the formula needs the angle between F and d.</li><li>Thinking a force that does no work does "nothing." The normal force still matters for Newton\'s second law; it just transfers no energy.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect "which forces do positive, negative, or zero work on the object?" Go force by force and compare each one\'s direction to the displacement. Also common: a rope pulling at an angle, where only \\(F\\cos\\theta\\) counts.')}
${check('A waiter carries a tray at constant height while walking 10 m across a room at constant speed. The work done by the waiter\'s upward force on the tray is…', ['Positive', 'Negative', 'Zero', 'Depends on the waiter\'s speed'], 2, 'The upward force is perpendicular to the horizontal displacement, so cos 90° = 0 and W = 0.')}
${check('A 20 N force pulls a sled 5 m along level snow, at 60° above the horizontal. How much work does the force do?', ['100 J', '50 J', '87 J', '0 J'], 1, 'W = Fd cos θ = (20)(5)(cos 60°) = (20)(5)(0.5) = 50 J.')}
${check('A box slides to the right across a rough floor and slows down. The work done by kinetic friction is…', ['Positive, because friction acts on the box', 'Negative, because friction points opposite the displacement', 'Zero, because friction is perpendicular to the floor', 'Positive, because the floor warms up'], 1, 'Friction points left, displacement points right: θ = 180°, cos 180° = −1. Friction takes kinetic energy out of the box.')}
`;
      const host = el.querySelector('[data-sim="work"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = q$(host);
      const D = 4;
      const s = { F: 30, th: 35, prog: 0, run: false };
      let geo = null;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const floorY = h * 0.72;
        const x0 = w * 0.18, x1 = w * 0.68;
        const cwid = Math.min(64, w * 0.12), chei = cwid * 0.72;
        const cx = lerp(x0, x1, s.prog);
        ground(ctx, 8, w - 8, floorY);
        // displacement arrow
        arrow(ctx, x0 + cwid / 2, floorY + 26, x1 + cwid / 2, floorY + 26, col('--muted'), 1.6, 8);
        text(ctx, 'd = 4 m', (x0 + x1) / 2 + cwid / 2, floorY + 40, { color: col('--muted'), size: 11 });
        ctx.save(); ctx.globalAlpha = 0.25; crate(ctx, x1, floorY - chei, cwid, chei); ctx.restore();
        crate(ctx, cx, floorY - chei, cwid, chei, '5 kg');
        const ox = cx + cwid / 2, oy = floorY - chei / 2;
        const Lmax = Math.min(h * 0.55, w * 0.3);
        const L = (s.F / 50) * Lmax;
        const a = rad(s.th);
        const tx = ox + L * Math.cos(a), ty = oy - L * Math.sin(a);
        // components
        const par = L * Math.cos(a);
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(ox + par, oy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
        if (Math.abs(par) > 3) arrow(ctx, ox, oy, ox + par, oy, col('--good'), 3.5, 10);
        arrow(ctx, ox, oy, tx, ty, col('--warn'), 3, 11);
        text(ctx, 'F', tx + 10 * Math.cos(a), ty - 12 * Math.sin(a) - 4, { weight: 700, size: 14, color: col('--warn') });
        if (Math.abs(par) > 14) text(ctx, 'F cos θ', ox + par / 2, oy + 14, { size: 11, weight: 600, color: col('--good') });
        // angle arc
        if (L > 20) {
          ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(ox, oy, 22, -a, 0, false); ctx.stroke();
          text(ctx, `${s.th}°`, ox + 34 * Math.cos(a / 2), oy - 34 * Math.sin(a / 2), { size: 11, color: col('--muted') });
        }
        geo = { ox, oy, Lmax, tx, ty };
        const W = s.F * D * Math.cos(a);
        const Wsofar = W * s.prog;
        const sign = Math.abs(Math.cos(a)) < 1e-3 ? 'zero' : W > 0 ? 'positive' : 'negative';
        const c = sign === 'positive' ? col('--good') : sign === 'negative' ? col('--bad') : col('--muted');
        text(ctx, `W = F d cos θ = ${fx(W).replace(/<[^>]+>/g, '')} J  (${sign})`, 14, 18, { align: 'left', weight: 700, size: 14, color: c });
        if (s.prog > 0) text(ctx, `energy transferred so far: ${Math.round(Wsofar)} J`, 14, 38, { align: 'left', size: 12, color: col('--muted') });
      }
      const st = stage(cv, 0.5, draw);
      function readout() {
        const a = rad(s.th), W = s.F * D * Math.cos(a);
        q('Fv').textContent = `${s.F} N`; q('thv').textContent = `${s.th}°`;
        q('F').value = s.F; q('th').value = s.th;
        ro.innerHTML = `<span>F∥ = F cos θ = <b>${fx(s.F * Math.cos(a))} N</b></span><span>F⊥ = <b>${fx(s.F * Math.sin(a))} N</b> (does no work)</span><span>W by F = <b>${fx(W)} J</b></span><span class="muted">W by gravity = 0, W by normal force = 0 (both ⟂ to d)</span>`;
        st.request();
      }
      q('F').oninput = () => { s.F = Number(q('F').value); readout(); };
      q('th').oninput = () => { s.th = Number(q('th').value); readout(); };
      q('go').onclick = () => { s.prog = 0; s.run = true; };
      q('reset').onclick = () => { s.prog = 0; s.run = false; st.request(); };
      drag(cv,
        (x, y) => (geo && Math.hypot(x - geo.tx, y - geo.ty) < 20 ? 'tip' : null),
        (it, x, y) => {
          const dx = x - geo.ox, dy = geo.oy - y;
          let a = Math.atan2(Math.max(0, dy), dx);
          s.th = Math.round(clamp(deg(a), 0, 180));
          s.F = Math.round(clamp((Math.hypot(dx, Math.max(0, dy)) / geo.Lmax) * 50, 0, 50));
          readout();
        });
      readout();
      const stop = loop((dt) => { if (s.run) { s.prog = Math.min(1, s.prog + dt / 2); if (s.prog >= 1) s.run = false; st.draw(); } });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 3. Work–energy theorem
  // =====================================================================
  LESSONS.push({
    unit: 13, order: 3, id: 'p1u3-work-energy', title: 'The work–energy theorem and force–displacement graphs',
    render(el) {
      el.innerHTML = `
<p class="lead">Work is energy transferred by a force. Kinetic energy is energy of motion. Connect them and you get one of the most useful shortcuts in mechanics: the net work done on an object equals how much its kinetic energy changes. No time, no acceleration — just start and finish.</p>

<h2>Where it comes from</h2>
<p>Take a constant net force \\(F\\) on an object of mass \\(m\\) over a displacement \\(d\\). Newton's second law gives \\(a = F/m\\), and kinematics gives \\(v_f^2 = v_i^2 + 2ad\\). Multiply both sides by \\(\\tfrac12 m\\):</p>
${eq('\\[ \\tfrac12 m v_f^2 - \\tfrac12 m v_i^2 = m a d = F_{\\text{net}}\\, d \\]', 'The left side is the change in kinetic energy; the right side is the net work. Same physics as Newton\'s laws, just packaged as energy.')}
${eq('\\[ W_{\\text{net}} = \\Delta K = K_f - K_i \\]', 'where \\(W_{\\text{net}}\\) = total work done by all forces on the object (J), equal to the work done by the net force; \\(K_i, K_f\\) = initial and final kinetic energy (J).')}
<ul>
<li>Positive net work → the object speeds up.</li>
<li>Negative net work → it slows down.</li>
<li>Zero net work → its speed is unchanged (it may still change direction).</li>
</ul>

<h2>When the force changes: area under the F–x graph</h2>
<p>\\(W = Fd\\) only works for a constant force. If the force changes with position, chop the motion into tiny steps. In each step the force is nearly constant, so the work is a thin rectangle of height \\(F\\) and width \\(\\Delta x\\). Add all the rectangles and you get the <b>area under the force-vs-position graph</b>.</p>
${eq('\\[ W = \\text{area under the } F_x \\text{ vs. } x \\text{ graph} \\]', 'where \\(F_x\\) = component of the force along the motion (N), plotted against position \\(x\\) (m). Area <b>above</b> the axis is positive work; area <b>below</b> the axis is negative work.')}

<div class="sim" data-sim="fx">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Starting speed <input type="range" data-k="v0" min="0" max="6" step="0.1" value="1"> <span data-k="v0v"></span></label>
    <button class="btn small primary" data-k="run">Run ▸</button>
    <button class="btn small" data-k="flat">Constant force</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the dots up and down to reshape the net force on a 2 kg cart. Blue area adds energy, red area removes it. The track at the bottom shares the same x-axis: press Run and watch the cart speed up where the force is positive and slow down where it is negative. If the red area eats all its kinetic energy, the cart stops early.</div>
</div>

${call('idea', 'Why this is a shortcut', 'To find a speed after a messy push, you don\'t need the acceleration at each moment. Find the area, add it to the starting K, and solve \\(K_f = \\tfrac12 mv_f^2\\) for \\(v_f\\).')}
${call('analogy', 'Analogy: deposits and withdrawals', 'K is the balance in an account. Each force writes either a deposit (positive work) or a withdrawal (negative work). The balance can never go below zero — if it hits zero, the object has stopped.')}
${call('mistake', 'Common mistakes', '<ul><li>Using only the applied force. The theorem needs <b>net</b> work — include friction, gravity, everything.</li><li>Reading the height of the F–x graph as the work. Work is the <b>area</b>; the height is the force.</li><li>Forgetting that area below the axis subtracts.</li></ul>')}
${call('ap', 'On the AP exam', 'You will often be handed an F–x graph made of triangles and rectangles and asked for the speed at a certain position. Area of a triangle = ½·base·height; count areas below the axis as negative. Also expect "derive" questions where you start from \\(W_{\\text{net}} = \\Delta K\\) and write symbols before numbers.')}
${check('A 2 kg cart starts at rest. The net force on it does 16 J of work. Its final speed is…', ['2 m/s', '4 m/s', '8 m/s', '16 m/s'], 1, '\\(16 = \\tfrac12(2)v^2\\), so \\(v^2 = 16\\) and \\(v = 4\\) m/s.')}
${check('A force on a cart rises steadily from 0 N at x = 0 to 10 N at x = 4 m. How much work does it do over those 4 m?', ['40 J', '20 J', '10 J', '2.5 J'], 1, 'The graph is a triangle: area = ½ (4 m)(10 N) = 20 J.')}
${check('The net work on a moving object is zero. Which must be true?', ['The object is at rest', 'No forces act on it', 'Its speed at the end equals its speed at the start', 'Its velocity never changed'], 2, 'Zero net work means ΔK = 0: same speed at the end as at the start. Forces can act (and cancel, or be perpendicular), and the direction can change.')}
`;
      const host = el.querySelector('[data-sim="fx"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = q$(host);
      const M = 2, XMAX = 5, FMAX = 20;
      const pts = [8, 12, 12, 4, -6, -10];
      const s = { v0: 1, run: false, x: 0 };
      let ax = null, gbox = null;
      // cumulative work from 0 to x (piecewise linear F)
      function work(x) {
        let W = 0;
        for (let i = 0; i < 5; i++) {
          const a = i, b = Math.min(i + 1, x);
          if (b <= a) break;
          const Fa = pts[i], Fb = lerp(pts[i], pts[i + 1], b - a);
          W += 0.5 * (Fa + Fb) * (b - a);
        }
        return W;
      }
      function F(x) { const i = Math.min(4, Math.floor(x)); return lerp(pts[i], pts[i + 1], x - i); }
      function stopPoint() {
        const K0 = 0.5 * M * s.v0 * s.v0;
        if (K0 === 0 && F(0) <= 0) return 0;
        for (let x = 0.002; x <= XMAX; x += 0.002) if (K0 + work(x) <= 0) return x;
        return null;
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        gbox = { x: 44, y: 14, w: w - 60, h: h * 0.62 };
        ax = axes(ctx, gbox, { xMax: XMAX, yMin: -FMAX, yMax: FMAX, yLabel: 'F (N)', xLabel: 'x (m)' });
        // fill
        const poly = () => {
          ctx.beginPath(); ctx.moveTo(ax.X(0), ax.Y(0));
          pts.forEach((f, i) => ctx.lineTo(ax.X(i), ax.Y(f)));
          ctx.lineTo(ax.X(XMAX), ax.Y(0)); ctx.closePath();
        };
        const y0 = ax.Y(0);
        ctx.save(); ctx.beginPath(); ctx.rect(gbox.x, gbox.y, gbox.w, y0 - gbox.y); ctx.clip();
        poly(); ctx.fillStyle = rgba(col('--accent'), 0.25); ctx.fill(); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(gbox.x, y0, gbox.w, gbox.y + gbox.h - y0); ctx.clip();
        poly(); ctx.fillStyle = rgba(col('--pos'), 0.25); ctx.fill(); ctx.restore();
        for (let i = 1; i < XMAX; i++) {
          ctx.strokeStyle = rgba(col('--border'), 0.9); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(ax.X(i), gbox.y); ctx.lineTo(ax.X(i), gbox.y + gbox.h); ctx.stroke();
        }
        for (let i = 0; i <= XMAX; i++) text(ctx, String(i), ax.X(i), gbox.y + gbox.h + 10, { size: 10, color: col('--muted') });
        text(ctx, '+20', gbox.x - 4, gbox.y + 4, { align: 'right', size: 10, color: col('--muted') });
        text(ctx, '0', gbox.x - 4, y0, { align: 'right', size: 10, color: col('--muted') });
        text(ctx, '−20', gbox.x - 4, gbox.y + gbox.h - 4, { align: 'right', size: 10, color: col('--muted') });
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2.2; ctx.beginPath();
        pts.forEach((f, i) => (i ? ctx.lineTo(ax.X(i), ax.Y(f)) : ctx.moveTo(ax.X(i), ax.Y(f)))); ctx.stroke();
        pts.forEach((f, i) => { ctx.beginPath(); ctx.arc(ax.X(i), ax.Y(f), 7, 0, Math.PI * 2); ctx.fillStyle = col('--surface'); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = col('--accent'); ctx.stroke(); });
        // track
        const ty = h - 22;
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax.X(0) - 10, ty); ctx.lineTo(ax.X(XMAX) + 10, ty); ctx.stroke();
        const sp = stopPoint();
        if (sp != null) {
          ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = col('--bad'); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(ax.X(sp), gbox.y); ctx.lineTo(ax.X(sp), ty); ctx.stroke(); ctx.restore();
          text(ctx, 'K hits 0', ax.X(sp) + 4, ty - 30, { align: 'left', size: 11, color: col('--bad'), weight: 600 });
        }
        const bx = ax.X(s.x);
        ctx.fillStyle = col('--accent'); roundRect(ctx, bx - 14, ty - 18, 28, 14, 4); ctx.fill();
        ctx.fillStyle = col('--text');
        [bx - 8, bx + 8].forEach((x) => { ctx.beginPath(); ctx.arc(x, ty - 3, 3.5, 0, Math.PI * 2); ctx.fill(); });
        const K = 0.5 * M * s.v0 * s.v0 + work(s.x);
        const v = Math.sqrt(Math.max(0, 2 * K / M));
        if (v > 0.05) arrow(ctx, bx + 16, ty - 11, bx + 18 + v * 6, ty - 11, col('--good'), 2, 7);
      }
      const st = stage(cv, 0.62, draw);
      function readout() {
        q('v0v').textContent = `${s.v0.toFixed(1)} m/s`;
        const K0 = 0.5 * M * s.v0 * s.v0, W = work(XMAX), sp = stopPoint();
        const Kx = K0 + work(s.x);
        ro.innerHTML = `<span>K<sub>i</sub> = <b>${fx(K0)} J</b></span><span>W (0 → 5 m) = area = <b>${signed(W)} J</b></span>` +
          (sp == null ? `<span>K at 5 m = <b>${fx(K0 + W)} J</b> → v = <b>${fx(Math.sqrt((2 * (K0 + W)) / M))} m/s</b></span>`
            : `<span><b>stops at x ≈ ${sp.toFixed(2)} m</b> (all its K used up)</span>`) +
          `<span class="muted">cart at x = ${s.x.toFixed(2)} m: K = ${fx(Math.max(0, Kx))} J</span>`;
        st.request();
      }
      drag(cv,
        (x, y) => { if (!ax) return null; for (let i = 0; i < pts.length; i++) if (Math.hypot(x - ax.X(i), y - ax.Y(pts[i])) < 16) return i; return null; },
        (i, x, y) => {
          const f = FMAX - ((y - gbox.y) / gbox.h) * 2 * FMAX;
          pts[i] = clamp(Math.round(f * 2) / 2, -FMAX, FMAX);
          s.run = false; s.x = 0; readout();
        });
      q('v0').oninput = () => { s.v0 = Number(q('v0').value); s.run = false; s.x = 0; readout(); };
      q('run').onclick = () => { s.x = 0; s.run = true; };
      q('flat').onclick = () => { pts.fill(8); s.run = false; s.x = 0; readout(); };
      readout();
      const stop = loop((dt) => {
        if (!s.run) return;
        const K = 0.5 * M * s.v0 * s.v0 + work(s.x);
        const v = Math.sqrt(Math.max(0, (2 * K) / M));
        const sp = stopPoint();
        s.x += Math.max(v, 0.15) * dt * 0.8; // shown at 0.8× speed
        if (sp != null && s.x >= sp) { s.x = sp; s.run = false; }
        if (s.x >= XMAX) { s.x = XMAX; s.run = false; }
        readout();
      });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 4. Potential energy
  // =====================================================================
  LESSONS.push({
    unit: 13, order: 4, id: 'p1u3-potential', title: 'Potential energy: gravity and springs',
    render(el) {
      el.innerHTML = `
<p class="lead">Lift a book onto a shelf and it isn't moving, so it has no kinetic energy. But knock it off and it comes down fast. The energy you put in while lifting didn't vanish — it was stored in the arrangement of the book and the Earth. Stored energy of arrangement is <b>potential energy</b>.</p>

<h2>Potential energy belongs to a system</h2>
<p>Potential energy is not inside one object. It belongs to a <b>system of objects that interact through a conservative force</b> — the book-Earth system (gravity) or the block-spring system (spring force). If you draw your system as only the book, there is no potential energy; instead, gravity is an outside force doing work on it. Both pictures give the same answers, as long as you don't count it twice.</p>
<p>A <b>conservative force</b> is one whose work depends only on the start and end positions, not the path. Lift a book 1 m straight up or zig-zag it up a staircase to the same height: gravity does the same −mgh of work either way. Gravity and spring forces are conservative; friction is not (a longer path means more friction work).</p>

<h2>Gravitational potential energy near Earth</h2>
${eq('\\[ \\Delta U_g = m g \\Delta y \\]', 'where \\(\\Delta U_g\\) = change in gravitational potential energy of the object–Earth system (J); \\(m\\) = mass (kg); \\(g = 9.8\\) m/s² (near Earth\'s surface); \\(\\Delta y\\) = change in height (m), positive when going up.')}
<p>Only <b>changes</b> in potential energy matter physically. You get to choose where \\(U_g = 0\\) (the floor, the table, the ceiling…). Pick a different zero and every \\(U_g\\) value shifts by the same amount, but the differences — the things that affect motion — stay identical.</p>

<div class="sim" data-sim="ug">
  <canvas></canvas>
  <div class="sim-controls">
    <label>U<sub>g</sub> = 0 at <select data-k="zero"><option value="0">the floor</option><option value="1">the table top</option><option value="3.5">the ceiling</option></select></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the 2 kg ball up and down. Switch where U<sub>g</sub> = 0: the U value jumps (it can even go negative, below the zero line), but the change from the table top to the ball never changes.</div>
</div>

<h2>Spring potential energy</h2>
<p>An ideal spring pushes back with \\(F_s = -kx\\) (Hooke's law). The force grows as you stretch, so the work you do is the area of a triangle under the F–x graph: \\(\\tfrac12 (x)(kx)\\). That stored energy is</p>
${eq('\\[ U_s = \\tfrac12 k x^2 \\]', 'where \\(U_s\\) = elastic potential energy of the spring system (J); \\(k\\) = spring constant (N/m), how stiff the spring is; \\(x\\) = distance stretched <i>or</i> compressed from the relaxed length (m). Because \\(x\\) is squared, stretching and compressing by the same amount store the same energy, and doubling \\(x\\) stores 4× the energy.')}

<div class="sim" data-sim="spring">
  <canvas></canvas>
  <div class="sim-controls">
    <label>k <input type="range" data-k="k" min="20" max="200" step="5" value="100"> <span data-k="kv"></span></label>
    <button class="btn small primary" data-k="rel">Release ▸</button>
    <button class="btn small" data-k="hold">Hold</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the 1 kg block to stretch or compress the spring (no friction). The graph is U<sub>s</sub> = ½kx². Release it: energy sloshes between spring (U) and motion (K), but the total stays fixed.</div>
</div>

<h2>Gravity far from Earth (a preview)</h2>
<p>\\(mgh\\) only works where \\(g\\) is nearly constant. For satellites and planets, the full expression is \\(U_G = -\\dfrac{Gm_1m_2}{r}\\), where \\(r\\) is the center-to-center distance and \\(G = 6.67\\times10^{-11}\\) N·m²/kg². The zero is chosen at infinite separation, so bound objects have negative U. Moving apart, U rises toward zero.</p>

${call('analogy', 'Analogy: a stretched rubber band', 'Pull a rubber band back and hold it: nothing moves, but you can feel the stored "readiness." Let go and that storage becomes motion. Gravitational PE is the same idea, with the Earth and the object as the two ends of an invisible rubber band.')}
${call('mistake', 'Common mistakes', '<ul><li>Saying "the ball has potential energy." Strictly, the ball–Earth <b>system</b> does. On the AP exam this matters when you choose a system.</li><li>Using the length of the spring for x. x is the stretch <i>from relaxed length</i>.</li><li>Thinking negative U is impossible. It just means below your chosen zero.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect to justify which energies exist given a system choice: "the block–Earth system" has \\(U_g\\); "the block alone" does not, and gravity does external work instead. Spring questions usually test the squared dependence: doubling compression → 4× energy → 2× launch speed.')}
${check('A 3 kg box is lifted from the floor to a shelf 2 m high. The change in gravitational potential energy of the box–Earth system is about…', ['6 J', '29 J', '59 J', '118 J'], 2, 'ΔU = mgΔy = (3)(9.8)(2) ≈ 59 J.')}
${check('Spring A is compressed 4 cm. Spring B, identical, is compressed 8 cm. B stores…', ['The same energy as A', '2× the energy of A', '4× the energy of A', '8× the energy of A'], 2, 'U = ½kx². Doubling x multiplies U by 2² = 4.')}
${check('Two students pick different zero levels for gravitational PE. They will agree on…', ['The value of U at the top of a hill', 'The change in U between two points', 'Whether U is positive', 'None of these'], 1, 'Moving the zero shifts every U by the same amount, so differences (which determine motion) are the same for both.')}
`;
      const cleanups = [];
      // --- gravitational PE sim ---
      {
        const host = el.querySelector('[data-sim="ug"]');
        const cv = host.querySelector('canvas');
        const ro = host.querySelector('.sim-readout');
        const q = q$(host);
        const m = 2, TOP = 3.5;
        const s = { y: 2.2, zero: 0 };
        let map = null;
        function draw(ctx, w, h) {
          ctx.clearRect(0, 0, w, h);
          const floorY = h - 16, topY = 16;
          const Y = (y) => floorY - (y / TOP) * (floorY - topY);
          map = { Y, inv: (py) => ((floorY - py) / (floorY - topY)) * TOP };
          // ceiling
          ctx.fillStyle = rgba(col('--muted'), 0.25); ctx.fillRect(0, topY - 8, w, 8);
          ground(ctx, 0, w, floorY);
          // ruler
          for (let y = 0; y <= TOP + 1e-6; y += 0.5) {
            ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(30, Y(y)); ctx.lineTo(y % 1 === 0 ? 42 : 37, Y(y)); ctx.stroke();
            if (y % 1 === 0) text(ctx, `${y} m`, 26, Y(y), { align: 'right', size: 10, color: col('--muted') });
          }
          // table
          const tx = w * 0.3, tw = w * 0.22;
          ctx.fillStyle = col('--text'); ctx.fillRect(tx, Y(1) - 2, tw, 5);
          ctx.fillRect(tx + 6, Y(1), 4, floorY - Y(1)); ctx.fillRect(tx + tw - 10, Y(1), 4, floorY - Y(1));
          // zero line
          const zy = Y(s.zero);
          ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = col('--accent'); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(44, zy); ctx.lineTo(w - 8, zy); ctx.stroke(); ctx.restore();
          text(ctx, 'U = 0', w - 10, zy + (s.zero > 3 ? 12 : -10), { align: 'right', size: 11, weight: 700, color: col('--accent') });
          // ball
          const bx = w * 0.62, by = Y(s.y);
          ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2); ctx.fillStyle = col('--warn'); ctx.fill();
          text(ctx, '2 kg', bx, by, { size: 10, weight: 700 });
          // height arrow from zero
          if (Math.abs(by - zy) > 18) arrow(ctx, bx + 30, zy, bx + 30, by + (by < zy ? 14 : -14), col('--accent'), 2, 8);
          text(ctx, `h = ${(s.y - s.zero).toFixed(2)} m`, bx + 40, (by + zy) / 2, { align: 'left', size: 12, weight: 600, color: col('--accent') });
          // table-to-ball
          ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = col('--muted');
          ctx.beginPath(); ctx.moveTo(tx + tw, Y(1)); ctx.lineTo(bx - 20, Y(1)); ctx.stroke(); ctx.restore();
          // bar
          const U = m * G * (s.y - s.zero);
          bars(ctx, { x: w - Math.min(110, w * 0.2), y: 24, w: Math.min(100, w * 0.18), h: h - 40 }, [{ label: 'U', v: U, color: col('--accent') }], m * G * TOP, { neg: true });
        }
        const st = stage(cv, 0.5, draw);
        function readout() {
          const U = m * G * (s.y - s.zero);
          ro.innerHTML = `<span>height above floor <b>${s.y.toFixed(2)} m</b></span><span>U<sub>g</sub> = mg(y − y<sub>0</sub>) = <b>${signed(U)} J</b></span><span>ΔU from table top to ball = <b>${signed(m * G * (s.y - 1))} J</b> <span class="muted">(same for every zero)</span></span>`;
          st.request();
        }
        q('zero').onchange = () => { s.zero = Number(q('zero').value); readout(); };
        drag(cv, (x, y) => (map && Math.hypot(x - st.w * 0.62, y - map.Y(s.y)) < 22 ? 'b' : null),
          (it, x, y) => { s.y = clamp(Math.round(map.inv(y) * 20) / 20, 0.15, 3.3); readout(); });
        readout();
        cleanups.push(() => st.destroy());
      }
      // --- spring PE sim ---
      {
        const host = el.querySelector('[data-sim="spring"]');
        const cv = host.querySelector('canvas');
        const ro = host.querySelector('.sim-readout');
        const q = q$(host);
        const XM = 0.3, m = 1;
        const s = { k: 100, x: 0.15, A: 0.15, t: 0, run: false };
        let geo = null;
        function draw(ctx, w, h) {
          ctx.clearRect(0, 0, w, h);
          const narrow = w < 560;
          const topH = narrow ? h * 0.42 : h;
          const lw = narrow ? w : w * 0.55;
          const floorY = topH * 0.7;
          const wallX = 18, eqX = wallX + lw * 0.45, ppm = (lw * 0.4) / XM;
          ground(ctx, 0, lw, floorY);
          ctx.fillStyle = col('--muted'); ctx.fillRect(wallX - 10, floorY - 70, 10, 70);
          const bw = 40, bh = 34;
          const bx = eqX + s.x * ppm;
          spring(ctx, wallX, bx, floorY - bh / 2, 9, 9);
          ctx.fillStyle = col('--accent'); roundRect(ctx, bx, floorY - bh, bw, bh, 4); ctx.fill();
          text(ctx, '1 kg', bx + bw / 2, floorY - bh / 2, { size: 11, weight: 700, color: col('--surface') });
          ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = col('--muted');
          ctx.beginPath(); ctx.moveTo(eqX, floorY - bh - 18); ctx.lineTo(eqX, floorY + 8); ctx.stroke(); ctx.restore();
          text(ctx, 'x = 0', eqX, floorY - bh - 26, { size: 10, color: col('--muted') });
          const Fs = -s.k * s.x;
          if (Math.abs(Fs) > 0.5) arrow(ctx, bx + bw / 2, floorY - bh - 10, bx + bw / 2 + clamp(Fs * 1.5, -lw * 0.3, lw * 0.3), floorY - bh - 10, col('--bad'), 2.5, 8);
          geo = { bx, bw, by: floorY - bh, bh, eqX, ppm };
          // U graph
          const box = narrow ? { x: 40, y: topH + 8, w: w - 56, h: h - topH - 20 } : { x: w * 0.6, y: 16, w: w * 0.37, h: h - 40 };
          const Umax = 0.5 * 200 * XM * XM;
          const ax = axes(ctx, box, { xMax: 2 * XM, yMin: 0, yMax: Umax, yLabel: 'U (J)', xLabel: 'x →' });
          plot(ctx, ax, (t) => 0.5 * s.k * (t - XM) * (t - XM), 2 * XM, col('--accent'), 2);
          const Etot = 0.5 * s.k * s.A * s.A;
          ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = col('--good'); ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(box.x, ax.Y(Math.min(Etot, Umax))); ctx.lineTo(box.x + box.w, ax.Y(Math.min(Etot, Umax))); ctx.stroke(); ctx.restore();
          text(ctx, 'total E', box.x + box.w - 4, ax.Y(Math.min(Etot, Umax)) - 8, { align: 'right', size: 10, color: col('--good'), weight: 600 });
          const U = 0.5 * s.k * s.x * s.x;
          ctx.beginPath(); ctx.arc(ax.X(s.x + XM), ax.Y(Math.min(U, Umax)), 5.5, 0, Math.PI * 2); ctx.fillStyle = col('--accent'); ctx.fill();
          text(ctx, '−0.3', box.x, box.y + box.h + 10, { size: 10, color: col('--muted') });
          text(ctx, '0', box.x + box.w / 2, box.y + box.h + 10, { size: 10, color: col('--muted') });
          text(ctx, '+0.3 m', box.x + box.w, box.y + box.h + 10, { size: 10, color: col('--muted'), align: 'right' });
        }
        const st = stage(cv, 0.5, draw);
        function readout() {
          q('kv').textContent = `${s.k} N/m`;
          const U = 0.5 * s.k * s.x * s.x, E = 0.5 * s.k * s.A * s.A, K = Math.max(0, E - U);
          ro.innerHTML = `<span>x = <b>${signed(s.x, 2)} m</b></span><span>F<sub>s</sub> = −kx = <b>${signed(-s.k * s.x)} N</b></span><span>U<sub>s</sub> = ½kx² = <b>${fx(U)} J</b></span><span>K = <b>${fx(K)} J</b></span><span>total = <b>${fx(E)} J</b></span>`;
          st.request();
        }
        q('k').oninput = () => { s.k = Number(q('k').value); s.run = false; s.A = Math.abs(s.x); readout(); };
        q('rel').onclick = () => { s.A = s.x; s.t = 0; s.run = true; };
        q('hold').onclick = () => { s.run = false; s.A = Math.abs(s.x); readout(); };
        drag(cv,
          (x, y) => (geo && x > geo.bx - 8 && x < geo.bx + geo.bw + 8 && y > geo.by - 8 && y < geo.by + geo.bh + 8 ? 'b' : null),
          (it, x) => { s.run = false; s.x = clamp(Math.round(((x - geo.bw / 2 - geo.eqX) / geo.ppm) * 100) / 100, -XM, XM); s.A = Math.abs(s.x); readout(); });
        readout();
        const stop = loop((dt) => {
          if (!s.run) return;
          s.t += dt;
          s.x = s.A * Math.cos(Math.sqrt(s.k / m) * s.t * 0.5); // shown at half speed
          readout();
        });
        cleanups.push(() => { stop(); st.destroy(); });
      }
      return () => cleanups.forEach((f) => f());
    },
  });

  // =====================================================================
  // 5. Conservation of energy
  // =====================================================================
  const TRACKS = {
    'Half-pipe': (x) => 6 * Math.pow((x - 5) / 5, 2),
    'Bump in the middle': (x) => 6 * Math.pow((x - 5) / 5, 2) + 2.2 * Math.exp(-Math.pow((x - 5) / 0.8, 2)),
  };

  // LOL scenarios: each system choice lists initial/final energies and external work.
  const LOL = {
    drop: {
      label: 'Ball dropped from 5 m',
      desc: 'A 2 kg ball is dropped from rest 5 m above the ground. Final moment: just before it hits.',
      systems: {
        'Ball + Earth': { i: { K: 0, Ug: 98, Us: 0 }, W: 0, f: { K: 98, Ug: 0, Us: 0, Eth: 0 }, note: 'Gravity is internal, so it shows up as U<sub>g</sub>. No outside work.' },
        'Ball only': { i: { K: 0, Ug: 0, Us: 0 }, W: 98, f: { K: 98, Ug: 0, Us: 0, Eth: 0 }, note: 'Earth is outside the system, so there is no U<sub>g</sub>. Gravity does +98 J of external work.' },
      },
    },
    spring: {
      label: 'Spring launches a block upward',
      desc: 'A spring (k = 400 N/m) compressed 0.5 m launches a 1 kg block straight up. Final moment: the top of its flight.',
      systems: {
        'Block + spring + Earth': { i: { K: 0, Ug: 0, Us: 50 }, W: 0, f: { K: 0, Ug: 50, Us: 0, Eth: 0 }, note: 'All forces are internal: spring energy becomes gravitational energy (height 5.1 m).' },
        'Block + Earth': { i: { K: 0, Ug: 0, Us: 0 }, W: 50, f: { K: 0, Ug: 50, Us: 0, Eth: 0 }, note: 'The spring is outside, so it does +50 J of work on the system instead of storing U<sub>s</sub>.' },
        'Block only': { i: { K: 0, Ug: 0, Us: 0 }, W: 0, f: { K: 0, Ug: 0, Us: 0, Eth: 0 }, note: 'Spring does +50 J, gravity does −50 J: net external work 0, and the block starts and ends at rest.' },
      },
    },
    slide: {
      label: 'Box slides to a stop',
      desc: 'A 4 kg box sliding at 5 m/s on a rough floor slides to a stop.',
      systems: {
        'Box + floor': { i: { K: 50, Ug: 0, Us: 0 }, W: 0, f: { K: 0, Ug: 0, Us: 0, Eth: 50 }, note: 'Friction is internal: kinetic energy becomes thermal energy of the box and floor.' },
        'Box only': { i: { K: 50, Ug: 0, Us: 0 }, W: -50, f: { K: 0, Ug: 0, Us: 0, Eth: 0 }, note: 'The floor is outside: friction does −50 J of external work, draining the box\'s K.' },
      },
    },
  };

  LESSONS.push({
    unit: 13, order: 5, id: 'p1u3-conservation', title: 'Conservation of energy and energy bar charts',
    render(el) {
      el.innerHTML = `
<p class="lead">Energy is never created or destroyed. It only moves between objects (by work) or changes form inside a system. That one sentence — the <b>conservation of energy</b> — solves problems where tracking forces would be miserable, like a skater on a curved ramp.</p>

<h2>The energy equation</h2>
<p>Pick a system. Its total energy can change only if something outside does work on it:</p>
${eq('\\[ K_i + U_i + W_{\\text{ext}} = K_f + U_f + \\Delta E_{\\text{th}} \\]', 'where \\(K\\) = kinetic energy (J); \\(U\\) = total potential energy inside the system, \\(U_g + U_s\\) (J); \\(W_{\\text{ext}}\\) = work done on the system by forces from outside it (J); \\(\\Delta E_{\\text{th}}\\) = increase in thermal (internal) energy from friction inside the system (J); i, f = initial and final moments you choose.')}
<p>If no outside forces do work and there is no friction, the system is <b>closed and isolated with only conservative forces</b>, and mechanical energy \\(K + U\\) stays constant: \\(K_i + U_i = K_f + U_f\\).</p>

<h2>Watch it happen</h2>
<div class="sim" data-sim="skate">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Track <select data-k="track">${Object.keys(TRACKS).map((k) => `<option>${k}</option>`).join('')}</select></label>
    <label>Friction <select data-k="mu"><option value="0">none</option><option value="0.04">a little (μ = 0.04)</option><option value="0.15">a lot (μ = 0.15)</option></select></label>
    <button class="btn small" data-k="pause">Pause</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the 60 kg skater anywhere on the track and let go (released from rest). Bars: kinetic, gravitational potential, thermal, and their total. With no friction the skater always returns to the release height (dashed line), and the total bar never moves. Add friction and watch thermal energy grow while the dashed line sinks.</div>
</div>

<h2>Speed from heights, no forces required</h2>
<p>Release from rest at height \\(h\\) on any frictionless track: \\(mgh = \\tfrac12 mv^2 + mgy\\), so at height \\(y\\)</p>
${eq('\\[ v = \\sqrt{2g(h - y)} \\]', 'where \\(v\\) = speed at height \\(y\\) (m/s); \\(h\\) = release height (m); \\(g = 9.8\\) m/s². Mass cancels, and the shape of the track doesn\'t matter — only the drop.')}

<h2>Energy bar charts (LOL diagrams)</h2>
<p>AP Physics uses bar charts to organize energy: bars for the initial energies, a circle showing what's in the system and any external work, then bars for the final energies. The bars on the left plus the work must equal the bars on the right. The <b>system choice</b> decides which bars exist.</p>
<div class="sim" data-sim="lol">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Situation <select data-k="sc">${Object.entries(LOL).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
    <label>System <select data-k="sys"></select></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Same physical event, different system boundaries. Whatever is outside the system appears as external work W instead of potential or thermal energy. Either way the books balance.</div>
</div>

${call('idea', 'Choosing the system', 'Include the Earth → gravity is internal, use \\(U_g\\). Leave the Earth out → gravity is an external force, use its work. Include the surface → friction becomes \\(\\Delta E_{\\text{th}}\\). Never do both for the same force, or you count its energy twice.')}
${call('analogy', 'Analogy: money in a sealed jar of envelopes', 'Money (energy) can move between envelopes inside the jar — "K", "U", "thermal" — but the jar total stays the same unless someone outside reaches in (external work).')}
${call('mistake', 'Common mistakes', '<ul><li>Counting gravity twice: using both \\(mgh\\) and "work done by gravity."</li><li>Thinking a heavier skater goes faster down a frictionless ramp. Mass cancels.</li><li>Expecting a ball to rise higher than its release point on a frictionless track. Without outside work, it can\'t.</li></ul>')}
${call('ap', 'On the AP exam', 'Bar charts show up constantly: "Draw bars for the block–spring–Earth system at positions 1 and 2." Keep bar heights proportional, mark zero clearly, and state your system. Free-response often asks you to explain in words why energy is or isn\'t conserved for a given system.')}
${check('A skater is released from rest at the top of a 5 m frictionless ramp. Speed at the bottom?', ['About 7 m/s', 'About 10 m/s', 'About 49 m/s', 'Depends on the skater\'s mass'], 1, '\\(v = \\sqrt{2gh} = \\sqrt{2(9.8)(5)} \\approx 9.9\\) m/s. Mass cancels.')}
${check('A ball falls (no air resistance). For the system of the ball alone, which is true?', ['K + U<sub>g</sub> is constant', 'There is no U<sub>g</sub>; gravity does positive external work', 'Energy is not conserved', 'K decreases'], 1, 'With Earth outside the system there is no gravitational PE; gravity is an outside force doing positive work, which shows up as increasing K.')}
${check('A pendulum swings with no friction or air resistance. At the lowest point…', ['K is minimum and U is maximum', 'K is maximum and U is minimum', 'Both K and U are zero', 'The total energy is greatest'], 1, 'The lowest point has the least height (min U), so all the energy that left U is now K (max). The total never changes.')}
`;
      const cleanups = [];
      // --- skate park ---
      {
        const host = el.querySelector('[data-sim="skate"]');
        const cv = host.querySelector('canvas');
        const ro = host.querySelector('.sim-readout');
        const q = q$(host);
        const m = 60, XW = 10, YH = 7;
        let yf = TRACKS['Half-pipe'];
        const yp = (x) => (yf(x + 1e-3) - yf(x - 1e-3)) / 2e-3;
        const s = { x: 1.6, v: 0, E0: 0, Eth: 0, mu: 0, paused: false, dragging: false };
        s.E0 = m * G * yf(s.x);
        let geo = null;
        function step(dt) {
          const n = 12, hh = dt / n;
          for (let i = 0; i < n; i++) {
            const sl = yp(s.x), c = 1 / Math.sqrt(1 + sl * sl), sn = sl * c;
            const gt = -G * sn, fr = s.mu * G * c;
            if (Math.abs(s.v) < 0.03 && Math.abs(gt) <= fr) { s.v = 0; continue; }
            // friction opposes the sliding (or, from rest, the direction gravity starts it moving)
            const a = gt - (s.v !== 0 ? Math.sign(s.v) : Math.sign(gt)) * fr;
            s.v += a * hh;
            const ds = s.v * hh;
            s.x = clamp(s.x + ds * c, 0.02, XW - 0.02);
            s.Eth += m * fr * Math.abs(ds);
            const v2 = 2 * ((s.E0 - s.Eth) / m - G * yf(s.x));
            if (v2 <= 0) s.v = 0; else s.v = (s.v >= 0 ? 1 : -1) * Math.sqrt(v2);
          }
        }
        function draw(ctx, w, h) {
          ctx.clearRect(0, 0, w, h);
          const narrow = w < 560;
          const tw = narrow ? w - 16 : w * 0.64;
          const th = narrow ? h * 0.62 : h - 20;
          const sc = Math.min(tw / XW, (th - 10) / YH);
          const ox = 8 + (tw - XW * sc) / 2, oy = (narrow ? th : h - 12);
          const P = (x, y) => [ox + x * sc, oy - y * sc];
          for (let y = 1; y <= 6; y++) {
            const [, py] = P(0, y);
            ctx.strokeStyle = rgba(col('--border'), 0.9); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(ox, py); ctx.lineTo(ox + XW * sc, py); ctx.stroke();
            text(ctx, `${y} m`, ox + 2, py - 7, { align: 'left', size: 9.5, color: col('--muted') });
          }
          ctx.beginPath();
          for (let i = 0; i <= 200; i++) { const x = (XW * i) / 200; const [px, py] = P(x, yf(x)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.lineTo(...P(XW, 0)); ctx.lineTo(...P(0, 0)); ctx.closePath();
          ctx.fillStyle = rgba(col('--muted'), 0.18); ctx.fill();
          ctx.beginPath();
          for (let i = 0; i <= 200; i++) { const x = (XW * i) / 200; const [px, py] = P(x, yf(x)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.strokeStyle = s.mu > 0 ? col('--warn') : col('--text'); ctx.lineWidth = s.mu > 0 ? 3.5 : 2.5; ctx.stroke();
          // max height line
          const hmax = (s.E0 - s.Eth) / (m * G);
          const [, hy] = P(0, hmax);
          ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = col('--good'); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(ox, hy); ctx.lineTo(ox + XW * sc, hy); ctx.stroke(); ctx.restore();
          // skater
          const sl = yp(s.x), nx = -sl / Math.sqrt(1 + sl * sl), ny = 1 / Math.sqrt(1 + sl * sl);
          const [sx, sy] = P(s.x, yf(s.x));
          const cx = sx + nx * 11, cy = sy - ny * 11; // sit on top of the track, along its normal
          ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fillStyle = col('--accent'); ctx.fill();
          if (Math.abs(s.v) > 0.1) {
            const tx = 1 / Math.sqrt(1 + sl * sl), ty = sl / Math.sqrt(1 + sl * sl);
            const L = s.v * 4;
            arrow(ctx, cx, cy, cx + tx * L, cy - ty * L, col('--good'), 2.2, 8);
          }
          geo = { cx, cy, P, sc, ox };
          // bars
          const K = 0.5 * m * s.v * s.v, U = m * G * yf(s.x);
          const bbox = narrow ? { x: 8, y: th + 6, w: w - 16, h: h - th - 8 } : { x: w * 0.68, y: 14, w: w * 0.3, h: h - 22 };
          bars(ctx, bbox, [
            { label: 'K', v: K, color: col('--good') },
            { label: 'Ug', v: U, color: col('--accent') },
            { label: 'Eth', v: s.Eth, color: col('--warn') },
            { label: 'Total', v: K + U + s.Eth, color: col('--text') },
          ], m * G * 6.3, { values: !narrow });
        }
        const st = stage(cv, 0.58, draw);
        function readout() {
          const K = 0.5 * m * s.v * s.v, U = m * G * yf(s.x);
          ro.innerHTML = `<span>height <b>${yf(s.x).toFixed(2)} m</b></span><span>speed <b>${Math.abs(s.v).toFixed(2)} m/s</b></span><span>K <b>${Math.round(K)} J</b></span><span>U<sub>g</sub> <b>${Math.round(U)} J</b></span><span>E<sub>th</sub> <b>${Math.round(s.Eth)} J</b></span><span>total <b>${Math.round(K + U + s.Eth)} J</b></span>`;
        }
        function reset(x) { s.x = x; s.v = 0; s.E0 = m * G * yf(x); s.Eth = 0; }
        q('track').onchange = () => { yf = TRACKS[q('track').value]; reset(1.6); };
        q('mu').onchange = () => { s.mu = Number(q('mu').value); reset(s.x); };
        q('pause').onclick = () => { s.paused = !s.paused; q('pause').textContent = s.paused ? 'Play' : 'Pause'; };
        drag(cv,
          (x, y) => (geo && Math.hypot(x - geo.cx, y - geo.cy) < 22 ? 's' : null),
          (it, x) => { s.dragging = true; reset(clamp((x - geo.ox) / geo.sc, 0.3, XW - 0.3)); st.request(); },
          () => { s.dragging = false; reset(s.x); });
        let tR = 0;
        const stop = loop((dt) => {
          if (!s.paused && !s.dragging) step(dt);
          st.draw();
          tR += dt; if (tR > 0.1) { tR = 0; readout(); }
        });
        readout();
        cleanups.push(() => { stop(); st.destroy(); });
      }
      // --- LOL bar charts ---
      {
        const host = el.querySelector('[data-sim="lol"]');
        const cv = host.querySelector('canvas');
        const ro = host.querySelector('.sim-readout');
        const q = q$(host);
        const s = { sc: 'drop', sys: null };
        function fillSystems() {
          const names = Object.keys(LOL[s.sc].systems);
          q('sys').innerHTML = names.map((n) => `<option>${n}</option>`).join('');
          s.sys = names[0];
        }
        function draw(ctx, w, h) {
          ctx.clearRect(0, 0, w, h);
          const d = LOL[s.sc].systems[s.sys];
          const max = 100;
          const narrow = w < 560;
          const gw = narrow ? w * 0.36 : w * 0.34;
          const iBox = { x: 6, y: 26, w: gw, h: h - 32 };
          const fBox = { x: w - gw * (4 / 3) - 6, y: 26, w: gw * (4 / 3), h: h - 32 };
          const mid = { x: iBox.x + iBox.w + 6, w: fBox.x - iBox.x - iBox.w - 12 };
          text(ctx, 'Initial', iBox.x + iBox.w / 2, 12, { weight: 700, size: 13 });
          text(ctx, 'Final', fBox.x + fBox.w / 2, 12, { weight: 700, size: 13 });
          bars(ctx, iBox, [
            { label: 'K', v: d.i.K, color: col('--good') }, { label: 'Ug', v: d.i.Ug, color: col('--accent') }, { label: 'Us', v: d.i.Us, color: col('--neg') },
          ], max, { neg: true });
          bars(ctx, fBox, [
            { label: 'K', v: d.f.K, color: col('--good') }, { label: 'Ug', v: d.f.Ug, color: col('--accent') }, { label: 'Us', v: d.f.Us, color: col('--neg') }, { label: 'ΔEth', v: d.f.Eth, color: col('--warn') },
          ], max, { neg: true });
          // system circle + W bar
          const cx = mid.x + mid.w / 2, r = Math.min(mid.w / 2 - 4, 54);
          const cy = 26 + r + 4;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2; ctx.stroke();
          const names = s.sys.split(' + ');
          names.forEach((n, i) => text(ctx, n, cx, cy + (i - (names.length - 1) / 2) * 15, { size: 11.5, weight: 600 }));
          text(ctx, 'system', cx, cy - r - 8, { size: 10, color: col('--muted') });
          const wBox = { x: cx - 30, y: cy + r + 4, w: 60, h: h - (cy + r + 4) - 6 };
          bars(ctx, wBox, [{ label: 'W ext', v: d.W, color: d.W < 0 ? col('--bad') : col('--text') }], max, { neg: true });
          text(ctx, '+', iBox.x + iBox.w + 4, h * 0.5, { size: 16, weight: 700, color: col('--muted') });
          text(ctx, '=', fBox.x - 4, h * 0.5, { size: 16, weight: 700, color: col('--muted') });
        }
        const st = stage(cv, 0.5, draw);
        function readout() {
          const d = LOL[s.sc].systems[s.sys];
          const L = d.i.K + d.i.Ug + d.i.Us + d.W, R = d.f.K + d.f.Ug + d.f.Us + d.f.Eth;
          ro.innerHTML = `<span>${LOL[s.sc].desc}</span><span>${d.i.K} + ${d.i.Ug} + ${d.i.Us} + (${d.W}) = <b>${L} J</b> &nbsp;=&nbsp; ${d.f.K} + ${d.f.Ug} + ${d.f.Us} + ${d.f.Eth} = <b>${R} J</b></span><span class="muted">${d.note}</span>`;
          st.request();
        }
        q('sc').onchange = () => { s.sc = q('sc').value; fillSystems(); readout(); };
        q('sys').onchange = () => { s.sys = q('sys').value; readout(); };
        fillSystems(); readout();
        cleanups.push(() => st.destroy());
      }
      return () => cleanups.forEach((f) => f());
    },
  });

  // =====================================================================
  // 6. Friction and dissipated energy
  // =====================================================================
  LESSONS.push({
    unit: 13, order: 6, id: 'p1u3-nonconservative', title: 'Friction and energy dissipated',
    render(el) {
      el.innerHTML = `
<p class="lead">Slide a book across a table and it stops. Its kinetic energy is gone — but energy can't disappear. Rub your hands together and you know where it went: friction turns ordered motion into the random jiggling of atoms, which we feel as warmth. That energy is <b>dissipated</b>: still there, but no longer useful for motion.</p>

<h2>Why friction is non-conservative</h2>
<p>Gravity's work depends only on start and end heights; you can get it all back by coming down. Kinetic friction always points against the sliding, so it does negative work on every leg of a trip, out and back. The longer the path, the more energy it takes. Work that depends on the path means there is <b>no potential energy for friction</b>.</p>

<h2>How much energy friction turns into heat</h2>
${eq('\\[ \\Delta E_{\\text{th}} = f_k\\, d = \\mu_k F_N\\, d \\]', 'where \\(\\Delta E_{\\text{th}}\\) = thermal energy produced in the surfaces (J); \\(f_k\\) = kinetic friction force (N); \\(\\mu_k\\) = coefficient of kinetic friction (no units); \\(F_N\\) = normal force (N), equal to \\(mg\\) on a level surface; \\(d\\) = distance slid along the surface (m) — the path length, not the displacement.')}
<p>For a box sliding to a stop on a level floor, all its kinetic energy becomes thermal energy:</p>
${eq('\\[ \\tfrac12 m v_0^2 = \\mu_k m g\\, d \\quad\\Rightarrow\\quad d = \\frac{v_0^2}{2\\mu_k g} \\]', 'where \\(v_0\\) = initial speed (m/s); \\(d\\) = stopping distance (m). Mass cancels: a heavy box and a light box with the same \\(\\mu_k\\) and starting speed stop in the same distance. And \\(d \\propto v_0^2\\): twice the speed, four times the stopping distance.')}

<div class="sim" data-sim="slide">
  <canvas></canvas>
  <div class="sim-controls">
    <label>v<sub>0</sub> <input type="range" data-k="v0" min="1" max="12" step="0.5" value="6"> <span data-k="v0v"></span></label>
    <label>μ<sub>k</sub> <input type="range" data-k="mu" min="0.05" max="0.8" step="0.01" value="0.3"> <span data-k="muv"></span></label>
    <label>Mass <input type="range" data-k="m" min="1" max="10" step="1" value="4"> <span data-k="mv"></span></label>
    <button class="btn small primary" data-k="go">Slide ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">The floor glows where friction has turned kinetic energy into thermal energy. The bars always add to the starting K. Change the mass: the energies change, but the stopping distance does not.</div>
</div>

<h2>Friction in the energy equation</h2>
<p>With the surfaces inside your system, friction shows up as \\(\\Delta E_{\\text{th}}\\) on the final side of \\(K_i + U_i + W_{\\text{ext}} = K_f + U_f + \\Delta E_{\\text{th}}\\). With only the sliding object in the system, friction is instead an external force doing negative work \\(W = -f_k d\\). Same numbers, different bookkeeping — just don't use both.</p>

${call('analogy', 'Analogy: spilled water', 'Mechanical energy is water in a bucket you can pour from place to place. Friction is a leak onto the floor: the water still exists, but it has spread out and you can\'t pour it back into the bucket.')}
${call('mistake', 'Common mistakes', '<ul><li>Using displacement instead of path length. A puck sliding 3 m out and 3 m back has d = 6 m for friction.</li><li>Using \\(F_N = mg\\) on a ramp. On an incline, \\(F_N = mg\\cos\\theta\\).</li><li>Saying energy is "lost." The system\'s mechanical energy drops, but the total energy (including thermal) is conserved.</li></ul>')}
${call('ap', 'On the AP exam', 'Typical tasks: compare stopping distances (\\(d \\propto v_0^2/\\mu_k\\)), find the thermal energy produced, or explain why mechanical energy isn\'t conserved for a given system but total energy is.')}
${check('A box sliding on a level floor stops in 4 m. If its starting speed is doubled (same floor), it stops in…', ['4 m', '8 m', '16 m', '2 m'], 2, '\\(d = v_0^2/(2\\mu_k g)\\). Doubling \\(v_0\\) makes d four times larger: 16 m.')}
${check('A 2 kg block slides 3 m on a floor with \\(\\mu_k = 0.5\\). How much thermal energy is produced?', ['3 J', '9.8 J', '29.4 J', '58.8 J'], 2, '\\(f_k = \\mu_k mg = 0.5(2)(9.8) = 9.8\\) N. \\(\\Delta E_{\\text{th}} = f_k d = 9.8 \\times 3 = 29.4\\) J.')}
${check('Two boxes, one twice as heavy as the other, slide on the same floor with the same starting speed. Which slides farther?', ['The heavier one', 'The lighter one', 'They slide the same distance', 'It depends on the floor area'], 2, 'Friction and kinetic energy are both proportional to mass, so m cancels in \\(d = v_0^2/(2\\mu_k g)\\).')}
`;
      const host = el.querySelector('[data-sim="slide"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = q$(host);
      const s = { v0: 6, mu: 0.3, m: 4, t: 0, run: false };
      const dist = () => (s.v0 * s.v0) / (2 * s.mu * G);
      const tStop = () => s.v0 / (s.mu * G);
      const xAt = (t) => { const tt = Math.min(t, tStop()); return s.v0 * tt - 0.5 * s.mu * G * tt * tt; };
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 560;
        const tw = narrow ? w : w * 0.66;
        const floorY = narrow ? h * 0.42 : h * 0.62;
        const d = dist();
        const span = Math.max(5, Math.ceil(d * 1.12));
        const x0 = 20, ppm = (tw - 70) / span;
        const x = xAt(s.t);
        // glow trail
        const gr = ctx.createLinearGradient(x0, 0, x0 + x * ppm, 0);
        gr.addColorStop(0, rgba(col('--warn'), 0.15)); gr.addColorStop(1, rgba(col('--warn'), 0.55));
        ctx.fillStyle = gr; ctx.fillRect(x0, floorY, x * ppm + 20, 8);
        ground(ctx, 8, tw - 8, floorY);
        // ticks
        const stepM = span > 40 ? 10 : span > 15 ? 5 : 1;
        for (let m = 0; m <= span; m += stepM) {
          ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x0 + m * ppm, floorY + 12); ctx.lineTo(x0 + m * ppm, floorY + 18); ctx.stroke();
          text(ctx, `${m}`, x0 + m * ppm, floorY + 27, { size: 10, color: col('--muted') });
        }
        text(ctx, 'm', x0 + span * ppm + 12, floorY + 27, { size: 10, color: col('--muted') });
        // stop marker
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = col('--bad'); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x0 + d * ppm + 20, floorY - 50); ctx.lineTo(x0 + d * ppm + 20, floorY); ctx.stroke(); ctx.restore();
        text(ctx, `stops at ${d.toFixed(2)} m`, x0 + d * ppm + 20, floorY - 58, { size: 11, color: col('--bad'), weight: 600, align: d * ppm > tw * 0.6 ? 'right' : 'center' });
        const bs = 26 + s.m * 2;
        const bx = x0 + x * ppm;
        crate(ctx, bx, floorY - bs, bs, bs, `${s.m} kg`);
        const v = s.t < tStop() ? s.v0 - s.mu * G * s.t : 0;
        if (v > 0.05) {
          arrow(ctx, bx + bs / 2, floorY - bs - 12, bx + bs / 2 + 10 + v * 5, floorY - bs - 12, col('--good'), 2.2, 8);
          arrow(ctx, bx + 2, floorY - 4, bx - 14 - s.mu * 40, floorY - 4, col('--bad'), 2.5, 8);
          text(ctx, 'fₖ', bx - 18 - s.mu * 40, floorY - 14, { size: 12, weight: 700, color: col('--bad') });
        }
        const K = 0.5 * s.m * v * v, K0 = 0.5 * s.m * s.v0 * s.v0;
        const bbox = narrow ? { x: 20, y: floorY + 34, w: w - 40, h: h - floorY - 36 } : { x: w * 0.7, y: 14, w: w * 0.28, h: h - 22 };
        bars(ctx, bbox, [
          { label: 'K', v: K, color: col('--good') },
          { label: 'ΔEth', v: K0 - K, color: col('--warn') },
          { label: 'Total', v: K0, color: col('--text') },
        ], 0.5 * 10 * 144, { values: !narrow });
      }
      const st = stage(cv, 0.5, draw);
      function readout() {
        q('v0v').textContent = `${s.v0} m/s`; q('muv').textContent = s.mu.toFixed(2); q('mv').textContent = `${s.m} kg`;
        const f = s.mu * s.m * G, d = dist(), K0 = 0.5 * s.m * s.v0 * s.v0;
        ro.innerHTML = `<span>f<sub>k</sub> = μ<sub>k</sub>mg = <b>${fx(f)} N</b></span><span>K<sub>0</sub> = <b>${fx(K0)} J</b></span><span>d = v<sub>0</sub>²/(2μ<sub>k</sub>g) = <b>${fx(d)} m</b></span><span>ΔE<sub>th</sub> = f<sub>k</sub>d = <b>${fx(f * d)} J</b></span>`;
        st.request();
      }
      ['v0', 'mu', 'm'].forEach((k) => (q(k).oninput = () => { s[k] = Number(q(k).value); s.t = 0; s.run = false; readout(); }));
      q('go').onclick = () => { s.t = 0; s.run = true; };
      readout();
      const stop = loop((dt) => { if (s.run) { s.t += dt; if (s.t > tStop()) { s.t = tStop(); s.run = false; } st.draw(); } });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 7. Power
  // =====================================================================
  LESSONS.push({
    unit: 13, order: 7, id: 'p1u3-power', title: 'Power: how fast energy moves',
    render(el) {
      el.innerHTML = `
<p class="lead">Walk up a flight of stairs or sprint up it: you end at the same height, so you gave yourself the same gravitational potential energy. But sprinting leaves you gasping. The difference is not how much energy, but how <b>fast</b> you transferred it. That rate is <b>power</b>.</p>

<h2>Power is a rate</h2>
${eq('\\[ P = \\frac{\\Delta E}{\\Delta t} = \\frac{W}{\\Delta t} \\]', 'where \\(P\\) = average power (watts, W; \\(1\\text{ W} = 1\\text{ J/s}\\)); \\(\\Delta E\\) = energy transferred or converted (J); \\(W\\) = work done (J); \\(\\Delta t\\) = time it took (s).')}
<p>A 60 W bulb converts 60 joules every second. A car engine might deliver 100 kW. One <b>horsepower</b> is about 746 W — a fit human can manage roughly 1 hp for a short sprint.</p>

<h2>Power from force and speed</h2>
<p>If a constant force \\(F\\) pushes along the motion while the object covers distance \\(d\\) in time \\(\\Delta t\\), then \\(P = Fd/\\Delta t\\). But \\(d/\\Delta t\\) is the speed:</p>
${eq('\\[ P = F v \\cos\\theta \\]', 'where \\(F\\) = force (N); \\(v\\) = speed of the object (m/s); \\(\\theta\\) = angle between the force and the velocity. For a force along the motion, \\(P = Fv\\). This is the instantaneous power the force delivers.')}
<p>This explains why a car's engine struggles at high speed: to push against air drag \\(F\\) while going fast, the needed power \\(Fv\\) climbs quickly.</p>

<div class="sim" data-sim="lift">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Load <input type="range" data-k="m" min="50" max="500" step="10" value="200"> <span data-k="mv"></span></label>
    <label>Lift time <input type="range" data-k="t" min="2" max="12" step="0.5" value="5"> <span data-k="tv"></span></label>
    <button class="btn small primary" data-k="go">Lift ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">A motor lifts a crate 10 m at constant speed. The work it must do is fixed by the mass (mgh). The lift time decides the power: same work, half the time, double the power. The gauge reads the motor's output while lifting.</div>
</div>

${call('idea', 'Energy vs. power', 'Energy is "how much"; power is "how fast." Your electricity bill charges for energy (kilowatt-<i>hours</i> = power × time), not for power.')}
${call('analogy', 'Analogy: filling a bathtub', 'The water in the tub is the energy. The faucet\'s flow rate is the power. A fire hose and a dripping tap can deliver the same total water — one just does it much faster.')}
${call('mistake', 'Common mistakes', '<ul><li>Confusing W (work, joules) with W (watts, the unit of power). Read the context.</li><li>Thinking a more powerful motor does more work to lift the same load to the same height. It does the same work, just faster.</li><li>Using total distance instead of distance along the force when finding work for P = W/Δt.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect comparisons ("student A climbs in 8 s, B in 10 s, with different masses — who has more power?") and \\(P = Fv\\) for an object at constant speed, where the applied force equals the opposing force (friction or weight).')}
${check('A 50 kg student climbs stairs 4 m high in 5 s. Average power output against gravity?', ['40 W', '196 W', '392 W', '1960 W'], 2, 'W = mgh = (50)(9.8)(4) = 1960 J. P = 1960/5 = 392 W.')}
${check('Motor A lifts a load in 10 s. Motor B lifts the same load the same height in 5 s. Compared with A, motor B does…', ['Twice the work at the same power', 'The same work at twice the power', 'Half the work at the same power', 'The same work at half the power'], 1, 'Work = mgh is the same. Doing it in half the time doubles the power.')}
${check('A truck moves at a constant 20 m/s while the engine pushes forward with 3000 N (balancing drag and friction). The engine\'s power is…', ['150 W', '3000 W', '60 kW', '600 kW'], 2, 'P = Fv = (3000)(20) = 60,000 W = 60 kW.')}
`;
      const host = el.querySelector('[data-sim="lift"]');
      const cv = host.querySelector('canvas');
      const ro = host.querySelector('.sim-readout');
      const q = q$(host);
      const H = 10, PMAX = (500 * G * H) / 2;
      const s = { m: 200, T: 5, t: 0, run: false };
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const floorY = h - 16, topY = 40;
        const towerX = w * 0.3;
        ground(ctx, 0, w * 0.55, floorY);
        // tower and motor
        ctx.fillStyle = col('--muted'); ctx.fillRect(towerX - 4, topY - 14, 8, floorY - topY + 14);
        ctx.fillRect(towerX - 4, topY - 14, w * 0.14, 8);
        const hookX = towerX + w * 0.13;
        ctx.fillStyle = col('--text'); roundRect(ctx, towerX - 22, floorY - 30, 44, 30, 5); ctx.fill();
        text(ctx, 'motor', towerX, floorY - 15, { size: 10, weight: 700, color: col('--surface') });
        // height scale
        const Y = (y) => floorY - (y / H) * (floorY - topY - 40);
        for (let y = 0; y <= H; y += 2) {
          text(ctx, `${y} m`, w * 0.53, Y(y), { align: 'right', size: 10, color: col('--muted') });
        }
        const frac = s.T ? clamp(s.t / s.T, 0, 1) : 0;
        const y = frac * H;
        const cs = 20 + (s.m / 500) * 22;
        const cy = Y(y) - cs;
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(hookX, topY - 6); ctx.lineTo(hookX, cy); ctx.stroke();
        crate(ctx, hookX - cs / 2, cy, cs, cs);
        text(ctx, `${s.m} kg`, hookX + cs / 2 + 6, cy + cs / 2, { align: 'left', size: 11, weight: 600 });
        if (s.run) arrow(ctx, hookX - cs / 2 - 14, cy + cs, hookX - cs / 2 - 14, cy + cs - 30, col('--good'), 2.2, 8);
        // gauge
        const P = s.run ? s.m * G * (H / s.T) : 0;
        const gx = w * 0.78, gy = h * 0.62, gr = Math.min(w * 0.17, h * 0.45);
        ctx.lineWidth = 10; ctx.lineCap = 'butt';
        ctx.strokeStyle = col('--surface'); ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, 2 * Math.PI); ctx.stroke();
        ctx.strokeStyle = col('--accent'); ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, Math.PI + Math.PI * clamp(P / PMAX, 0, 1)); ctx.stroke();
        ctx.lineCap = 'round';
        const a = Math.PI + Math.PI * clamp(P / PMAX, 0, 1);
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (gr - 14) * Math.cos(a), gy + (gr - 14) * Math.sin(a)); ctx.stroke();
        ctx.beginPath(); ctx.arc(gx, gy, 5, 0, Math.PI * 2); ctx.fillStyle = col('--text'); ctx.fill();
        text(ctx, `${(P / 1000).toFixed(2)} kW`, gx, gy + 20, { weight: 700, size: 15 });
        text(ctx, 'power', gx, gy + 38, { size: 11, color: col('--muted') });
        text(ctx, '0', gx - gr, gy + 14, { size: 10, color: col('--muted') });
        text(ctx, `${(PMAX / 1000).toFixed(1)}`, gx + gr, gy + 14, { size: 10, color: col('--muted') });
        text(ctx, `energy delivered: ${Math.round(s.m * G * y)} J`, w * 0.6, 18, { align: 'left', size: 12, weight: 600 });
      }
      const st = stage(cv, 0.55, draw);
      function readout() {
        q('mv').textContent = `${s.m} kg`; q('tv').textContent = `${s.T} s`;
        const W = s.m * G * H, v = H / s.T, P = W / s.T;
        ro.innerHTML = `<span>W = mgh = <b>${fx(W)} J</b></span><span>v = h/t = <b>${fx(v)} m/s</b></span><span>P = W/Δt = mgv = <b>${fx(P)} W</b></span><span class="muted">≈ ${(P / 746).toFixed(1)} hp</span>`;
        st.request();
      }
      ['m', 't'].forEach((k) => (q(k).oninput = () => { if (k === 'm') s.m = Number(q(k).value); else s.T = Number(q(k).value); s.t = 0; s.run = false; readout(); }));
      q('go').onclick = () => { s.t = 0; s.run = true; };
      readout();
      const stop = loop((dt) => { if (s.run) { s.t += dt; if (s.t >= s.T) { s.t = s.T; s.run = false; } st.draw(); } });
      return () => { stop(); st.destroy(); };
    },
  });
})();
