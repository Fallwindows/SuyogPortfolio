// AP Physics 1 · Unit 2 — Force and Translational Dynamics.
// Visual, first-principles lessons. Pushes lesson objects onto window.LESSONS.
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);
  const { col, clamp, lerp, rgba, sci, signed, eq, call, check, arrow, text, roundRect, tag, axes, plot, stage, drag, loop } = window.PRKit;

  // ---------- constants ----------
  const G = 9.8;           // m/s² near Earth's surface
  const GRAV = 6.67e-11;   // N·m²/kg²

  // Force colors, kept the same in every sim so a color always means the same kind of force.
  const FC = { grav: '--warn', normal: '--good', push: '--accent', fric: '--bad', tension: '--text', spring: '--accent' };
  const fc = (k) => col(FC[k]);

  // ---------- small helpers ----------
  function sim(el, name) {
    const host = el.querySelector(`[data-sim="${name}"]`);
    return { host, cv: host.querySelector('canvas'), ro: host.querySelector('.sim-readout'), q: (k) => host.querySelector(`[data-k="${k}"]`) };
  }
  function bind(q, keys, fn) {
    keys.forEach((k) => { const e = q(k); if (e) e.oninput = e.onchange = fn; });
  }
  const deg = (d) => (d * Math.PI) / 180;

  // A box with a label in it.
  function crate(ctx, x, y, w, h, label, o = {}) {
    ctx.fillStyle = o.fill || rgba(col('--warn'), 0.18);
    ctx.strokeStyle = o.stroke || col('--text'); ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 4); ctx.fill(); ctx.stroke();
    if (label) text(ctx, label, x + w / 2, y + h / 2, { weight: 700, size: o.size || 13 });
  }
  // Ground line with hatching; off scrolls the hatching so the floor can appear to move.
  function floor(ctx, x1, x2, y, off = 0) {
    ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.strokeStyle = col('--border'); ctx.lineWidth = 1.2; ctx.beginPath();
    const s = 14, start = x1 - (((off % s) + s) % s) + s;
    for (let x = start; x < x2 + 8; x += s) { ctx.moveTo(x, y + 2); ctx.lineTo(x - 8, y + 10); }
    ctx.stroke();
  }
  // Force arrow from (x,y) by (dx,dy) pixels, labelled just past the tip.
  function force(ctx, x, y, dx, dy, color, label) {
    const L = Math.hypot(dx, dy);
    if (L < 2) return;
    arrow(ctx, x, y, x + dx, y + dy, color, 2.6, 10);
    if (label) text(ctx, label, x + dx + (dx / L) * 16, y + dy + (dy / L) * 12, { color, weight: 700, size: 12 });
  }
  function dot(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
  function dashed(ctx, x1, y1, x2, y2, color, lw = 1.3) {
    ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  // Zig-zag spring between two points.
  function spring(ctx, x1, y1, x2, y2, coils, width, color, lw = 2) {
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 1) return;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, px = -uy, py = ux;
    const lead = Math.min(10, L * 0.12), n = coils * 2;
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
    for (let i = 1; i < n; i++) {
      const d = lead + ((L - 2 * lead) * i) / n, s = i % 2 ? width : -width;
      ctx.lineTo(x1 + ux * d + px * s, y1 + uy * d + py * s);
    }
    ctx.lineTo(x2 - ux * lead, y2 - uy * lead); ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  const N1 = (x) => sci(x, 3); // newtons etc. for readouts

  // =====================================================================
  // 1. Systems and center of mass
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 1, id: 'p1u2-systems', title: 'Systems and center of mass',
    render(el) {
      el.innerHTML = `
<p class="lead">Before you can use any of Newton's laws, you have to answer one question: <i>which</i> object — or group of objects — are you talking about? That choice is called the <b>system</b>. Choose it well and hard problems become easy ones.</p>

<h2>What a system is</h2>
<p>A <b>system</b> is whatever object or collection of objects you decide to study. Everything else is the <b>environment</b> (or surroundings). Once you've drawn that imaginary boundary, every force sorts itself into one of two kinds:</p>
<ul>
<li><b>Internal forces</b>: one part of the system pushing or pulling on another part of the system.</li>
<li><b>External forces</b>: something in the environment pushing or pulling on the system.</li>
</ul>
<p>Example: you push a shopping cart. If the system is <i>just the cart</i>, your push is external — it's what speeds the cart up. If the system is <i>you + cart</i>, your push on the cart and the cart's push back on you are both internal and cancel each other out. The only external forces left are gravity, the floor's upward push, and the floor's friction on your shoes.</p>
${call('idea', 'Big idea', 'Only <b>external</b> forces can change how a system as a whole moves. Internal forces can rearrange the parts, but they can\'t make the whole system speed up, slow down, or turn.')}

<h2>Center of mass: the system's "average position"</h2>
<p>A system spread out in space still has one special point that moves as if the whole system were a single particle sitting there. That point is the <b>center of mass</b> (COM). For objects along a line it's a mass-weighted average of their positions:</p>
${eq('\\[ x_{cm} = \\frac{m_1x_1 + m_2x_2 + m_3x_3 + \\dots}{m_1 + m_2 + m_3 + \\dots} = \\frac{\\sum m_i x_i}{\\sum m_i} \\]', 'where \\(x_{cm}\\) = position of the center of mass (m); \\(m_i\\) = mass of object \\(i\\) (kg); \\(x_i\\) = position of object \\(i\\) (m), all measured from the same origin. Heavier objects "pull" the average toward themselves.')}
<p>Drag the balls along the beam and change their masses. The triangle under the beam sits at the center of mass — it's exactly where you could balance the beam on a fingertip (ignoring the beam's own mass).</p>

<div class="sim" data-sim="com">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Mass A <input type="range" data-k="m0" min="1" max="6" step="1" value="2"> <span data-k="v0"></span></label>
    <label>Mass B <input type="range" data-k="m1" min="1" max="6" step="1" value="1"> <span data-k="v1"></span></label>
    <label>Mass C <input type="range" data-k="m2" min="1" max="6" step="1" value="4"> <span data-k="v2"></span></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag a ball left or right. Make one ball much heavier than the others and watch the balance point slide toward it. Put two equal masses anywhere: the COM is always exactly halfway between them.</div>
</div>

<h2>Why the center of mass matters</h2>
<p>Newton's second law (two lessons from now) works for a whole system if you apply it to the center of mass:</p>
${eq('\\[ \\vec a_{cm} = \\frac{\\sum \\vec F_{\\text{ext}}}{M_{\\text{total}}} \\]', 'where \\(\\vec a_{cm}\\) = acceleration of the center of mass (m/s²); \\(\\sum \\vec F_{\\text{ext}}\\) = the vector sum of the <b>external</b> forces only (N); \\(M_{\\text{total}}\\) = total mass of the system (kg).')}
<p>Two consequences you'll use all year:</p>
<ul>
<li>A firework shell bursts in mid-air. The pieces fly everywhere, but the explosion forces are internal, so the <b>center of mass keeps following the same parabola</b> the shell was on.</li>
<li>Two skaters at rest on frictionless ice push off each other. The pushes are internal, so the <b>COM stays exactly where it was</b> — the lighter skater simply slides farther.</li>
</ul>

<h2>When can you treat an object as a single particle?</h2>
<p>If you only care about how an object moves as a whole — not how it spins or bends — you can model it as a single point at its center of mass with all the mass there. The AP exam calls this the <b>object model</b>. For a uniform, symmetric object (a ball, a block, a meter stick) the COM is at the geometric center. For a lopsided object it shifts toward the heavier part, and for a ring or a boomerang it isn't even inside the material.</p>

${call('analogy', 'Analogy: the balance point', 'Hold a hammer on one finger. You can only balance it close to the heavy head, not at the middle of the handle. That balance point is the center of mass. A seesaw with a heavy kid and a light kid balances the same way: the heavier kid has to sit closer to the pivot.')}
${call('mistake', 'Common mistakes', '<ul><li>Thinking the COM is where "most of the mass is." It\'s an average: a light object far away can pull it a long way.</li><li>Expecting internal forces to move the system. You can\'t lift yourself by pulling up on your own shoelaces — that pull is internal.</li><li>Calling a force internal or external without first stating the system. The same force can be either one, depending on your choice.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect to (1) pick a system so that an unknown force becomes internal and drops out, (2) compute \\(x_{cm}\\) for two or three objects, and (3) predict how the COM moves when the parts push apart or collide — if the net external force is zero, the COM\'s velocity doesn\'t change.')}
${check('A 2 kg ball sits at x = 0 and a 6 kg ball sits at x = 4 m. Where is the center of mass?', ['x = 1 m', 'x = 2 m', 'x = 3 m', 'x = 4 m'], 2, '\\(x_{cm} = (2\\cdot0 + 6\\cdot4)/(2+6) = 24/8 = 3\\) m — closer to the heavier ball, as it should be.')}
${check('Two skaters stand at rest on frictionless ice and push off each other. What does their center of mass do?', ['Moves toward the heavier skater', 'Moves toward the lighter skater', 'Stays at rest', 'Moves in the direction of the harder push'], 2, 'The pushes are internal to the two-skater system, and the external forces (gravity, normal) cancel. Zero net external force means the COM\'s velocity can\'t change: it stays at rest.')}
${check('You push a box across the floor. You choose the system "you + the box." Your push on the box is…', ['An external force on the system', 'An internal force of the system', 'Not a force at all', 'External only if the box speeds up'], 1, 'Both you and the box are inside the boundary, so your push on the box (and the box\'s push back on you) are internal. They can\'t change the motion of the system\'s COM.')}
`;
      const { host, cv, ro, q } = sim(el, 'com');
      const balls = [{ x: 0.3, m: 2, n: 'A' }, { x: 1.0, m: 1, n: 'B' }, { x: 1.7, m: 4, n: 'C' }];
      const LEN = 2;
      let geo = null;
      const xcm = () => balls.reduce((a, b) => a + b.m * b.x, 0) / balls.reduce((a, b) => a + b.m, 0);
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const x0 = 0.08 * w, x1 = 0.92 * w, by = h * 0.58;
        const s = (x1 - x0) / LEN;
        geo = { x0, s, by };
        // beam + ruler
        ctx.fillStyle = col('--border'); ctx.fillRect(x0 - 6, by, x1 - x0 + 12, 8);
        for (let i = 0; i <= 8; i++) {
          const x = x0 + (i * 0.25) * s;
          ctx.fillStyle = col('--muted'); ctx.fillRect(x - 0.5, by + 8, 1, i % 2 ? 4 : 8);
          if (i % 2 === 0) text(ctx, `${i * 0.25} m`, x, by + 26, { color: col('--muted'), size: 11 });
        }
        // balls
        balls.forEach((b) => {
          const r = 9 + 6 * Math.sqrt(b.m);
          const x = x0 + b.x * s;
          dot(ctx, x, by - r, r, rgba(col('--accent'), 0.25 + 0.1 * b.m));
          ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, by - r, r, 0, Math.PI * 2); ctx.stroke();
          text(ctx, b.n, x, by - r, { weight: 700, size: 13 });
          text(ctx, `${b.m} kg`, x, by - 2 * r - 10, { color: col('--muted'), size: 11 });
        });
        // COM marker
        const xc = x0 + xcm() * s;
        dashed(ctx, xc, 24, xc, by, col('--warn'), 1.5);
        ctx.fillStyle = col('--warn');
        ctx.beginPath(); ctx.moveTo(xc, by + 34); ctx.lineTo(xc - 12, by + 56); ctx.lineTo(xc + 12, by + 56); ctx.closePath(); ctx.fill();
        text(ctx, 'COM', xc, 14, { color: col('--warn'), weight: 700 });
      }
      const st = stage(cv, 0.42, draw);
      function readout() {
        const M = balls.reduce((a, b) => a + b.m, 0);
        const num = balls.map((b) => `${b.m}(${b.x.toFixed(2)})`).join(' + ');
        ro.innerHTML = `<span>x<sub>cm</sub> = (${num}) / ${M}</span><span>= <b>${xcm().toFixed(2)} m</b></span><span class="muted">total mass ${M} kg</span>`;
        balls.forEach((b, i) => { q('v' + i).textContent = `${b.m} kg`; });
      }
      bind(q, ['m0', 'm1', 'm2'], () => { balls.forEach((b, i) => { b.m = Number(q('m' + i).value); }); readout(); st.request(); });
      drag(cv,
        (x, y) => {
          if (!geo) return null;
          for (const b of balls) {
            const r = 9 + 6 * Math.sqrt(b.m);
            if (Math.hypot(geo.x0 + b.x * geo.s - x, geo.by - r - y) < r + 10) return b;
          }
          return null;
        },
        (b, x) => { b.x = clamp((x - geo.x0) / geo.s, 0, LEN); readout(); st.request(); });
      readout();
      st.draw();
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 2. Forces and free-body diagrams
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 2, id: 'p1u2-forces-fbd', title: 'Forces and free-body diagrams',
    render(el) {
      el.innerHTML = `
<p class="lead">A force is a push or a pull that one object exerts on another. That's it. Every force has a <i>giver</i> and a <i>receiver</i>, and if you can't name both, it isn't a real force. Kinematics described motion; forces are the reason motion changes.</p>

<h2>What a force is</h2>
<p>A force is a <b>vector</b>: it has a size (magnitude) and a direction. Its SI unit is the <b>newton</b>, \\(1\\text{ N} = 1\\text{ kg·m/s}^2\\) — roughly the weight of a small apple. Forces come in two families:</p>
<ul>
<li><b>Contact forces</b> need touching: the normal force, friction, tension, spring forces, air resistance, your hand pushing.</li>
<li><b>Field (long-range) forces</b> act across empty space: gravity, and later electric and magnetic forces.</li>
</ul>
<p>(Deep down, every contact force is electric: the electrons in your hand repel the electrons in the wall. But in Physics 1 we just call them contact forces.)</p>

<h2>The usual cast of forces</h2>
<ul>
<li><b style="color:var(--warn)">Gravitational force (weight)</b> \\(F_g\\): Earth pulls every object toward its center, so "down."</li>
<li><b style="color:var(--good)">Normal force</b> \\(F_N\\): a surface pushes on an object <b>perpendicular</b> ("normal") to the surface, outward from it.</li>
<li><b style="color:var(--bad)">Friction</b> \\(f\\): a surface pushes <b>parallel</b> to itself, opposing sliding (or the tendency to slide).</li>
<li><b>Tension</b> \\(F_T\\): a rope or string <b>pulls</b> along its own length. Ropes can't push.</li>
<li><b>Spring force</b> \\(F_s\\): a stretched or squeezed spring pushes or pulls back toward its natural length.</li>
<li><b style="color:var(--accent)">Applied force</b> \\(F_A\\): a push or pull from a person or machine.</li>
</ul>
${eq('\\[ F_g = mg \\]', 'where \\(F_g\\) = gravitational force on the object, its weight (N); \\(m\\) = the object\'s mass (kg); \\(g = 9.8\\) m/s² (equivalently 9.8 N/kg) near Earth\'s surface. A 5 kg box weighs \\(5 \\times 9.8 = 49\\) N.')}

<h2>Drawing a free-body diagram (FBD)</h2>
<p>A free-body diagram strips away everything except the forces on one object. It is the single most useful drawing in mechanics. The recipe:</p>
<ol>
<li><b>Pick the object</b> (your system) and draw it as a dot.</li>
<li>Draw <b>only the forces exerted ON it</b>, as arrows that <b>start at the dot</b> and point the way each force acts. Make longer arrows for bigger forces.</li>
<li><b>Label</b> each arrow with its type, and ideally its source: \\(F_N\\) (floor on box), \\(F_g\\) (Earth on box).</li>
<li>Leave out everything that isn't a force: no velocity arrows, no "\\(ma\\)" arrow, no forces the object exerts on other things.</li>
</ol>
<p>Below, a 5 kg box sits on a floor. Change the pull and its angle and watch both pictures: the real scene on the left and the FBD on the right. Notice the normal force: it is <i>not</i> always equal to the weight.</p>

<div class="sim" data-sim="fbd">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Pull F <input type="range" data-k="F" min="0" max="60" step="1" value="30"> <span data-k="Fv"></span></label>
    <label>Angle <input type="range" data-k="th" min="-40" max="60" step="1" value="20"> <span data-k="thv"></span></label>
    <label>μ<sub>k</sub> <input type="range" data-k="mu" min="0" max="0.6" step="0.05" value="0.3"> <span data-k="muv"></span></label>
    <label><input type="checkbox" data-k="slide" checked> Box is sliding right</label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Mass 5 kg, so weight 49 N. A positive angle tilts the pull upward, which lifts some weight off the floor: the normal force drops, and so does kinetic friction (\\(f_k = \\mu_k F_N\\), coming up in the friction lesson). Untick "sliding" and friction becomes static: just big enough to stop the box from moving (assuming the floor is grippy enough).</div>
</div>

<h2>Net force: adding the arrows</h2>
<p>What matters for motion is the <b>net force</b> — the vector sum of every force on the object. Pick axes (usually one along the motion), split angled forces into components, and add each direction separately:</p>
${eq('\\[ \\sum F_x = F_{1x} + F_{2x} + \\dots, \\qquad \\sum F_y = F_{1y} + F_{2y} + \\dots \\]', 'where \\(\\sum F_x\\), \\(\\sum F_y\\) = net force components (N); \\(F_{1x}\\) etc. = the x- and y-components of each individual force, with signs (+ right/up, − left/down). For a force \\(F\\) at angle \\(\\theta\\) above the +x axis: \\(F_x = F\\cos\\theta\\), \\(F_y = F\\sin\\theta\\).')}

${call('analogy', 'Analogy: tug of war', 'Two teams pull a rope in opposite directions. The rope only moves if one side pulls harder — what counts is the difference, the net force. Two huge equal pulls produce exactly the same motion as no pulls at all.')}
${call('mistake', 'Common mistakes', '<ul><li>Drawing a "force of motion" in the direction an object is moving. A moving object doesn\'t carry a force with it. A hockey puck sliding right has <i>no</i> rightward force on it.</li><li>Assuming \\(F_N = mg\\) every time. The normal force is whatever the surface needs to push; angled pulls, inclines and elevators all change it.</li><li>Including forces the object exerts on something else. An FBD of the box shows the floor pushing up on the box, not the box pushing down on the floor.</li></ul>')}
${call('ap', 'On the AP exam', 'Free-body diagrams earn points on their own. Graders check: one dot, arrows that start at the dot, a label on every arrow, nothing extra, and arrow lengths in the right ratios (e.g., \\(F_N\\) shorter than \\(F_g\\) for an object on an accelerating-down elevator). Draw components separately (dashed), not on the main FBD.')}
${check('A ball is thrown straight up. After it leaves your hand (ignore air resistance), which forces act on it on the way up?', ['An upward force from the throw, and gravity', 'Gravity only', 'Gravity and a shrinking upward force', 'No forces at the very top'], 1, 'Once the hand lets go, nothing is touching the ball, so the only force is gravity. The upward <i>velocity</i> is left over from the throw, but velocity isn\'t a force.')}
${check('You pull a box across the floor with a rope angled 30° above horizontal. Compared with the box\'s weight \\(mg\\), the normal force is…', ['Less than mg', 'Equal to mg', 'Greater than mg', 'Zero'], 0, 'The rope\'s upward component carries part of the weight: \\(F_N = mg - F\\sin30^\\circ\\). Push down at an angle instead and \\(F_N\\) would be larger than mg.')}
`;
      const { cv, ro, q } = sim(el, 'fbd');
      const m = 5, W = m * G;
      const s0 = { F: 30, th: 20, mu: 0.3, slide: true };
      function forces() {
        const th = deg(s0.th);
        const Fx = s0.F * Math.cos(th), Fy = s0.F * Math.sin(th);
        const N = Math.max(0, W - Fy);
        const lift = Fy > W;
        let f = s0.slide ? s0.mu * N : Math.min(Fx, Infinity);
        if (!s0.slide && N === 0) f = 0;
        return { Fx, Fy, N, f, lift, net: Fx - f, netY: lift ? Fy - W : 0 };
      }
      function drawSet(ctx, cx, cy, s, P, labels) {
        const th = deg(s0.th);
        force(ctx, cx, cy, 0, W * s, fc('grav'), labels ? 'Fg' : '');
        if (P.N > 0) force(ctx, cx, cy, 0, -P.N * s, fc('normal'), labels ? 'FN' : '');
        if (s0.F > 0) force(ctx, cx, cy, s0.F * Math.cos(th) * s, -s0.F * Math.sin(th) * s, fc('push'), labels ? 'FA' : '');
        if (P.f > 0.01) force(ctx, cx, cy, -P.f * s, 0, fc('fric'), labels ? (s0.slide ? 'fk' : 'fs') : '');
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const P = forces();
        const s = (0.34 * h) / 60;
        // scene
        const fy = h * 0.74, bx = w * 0.27, bw = 76, bh = 54;
        floor(ctx, 10, w * 0.56, fy);
        crate(ctx, bx - bw / 2, fy - bh - (P.lift ? 10 : 0), bw, bh, '5 kg');
        if (s0.F > 0) {
          const th = deg(s0.th), cx = bx + bw / 2, cy = fy - bh / 2 - (P.lift ? 10 : 0);
          ctx.strokeStyle = col('--muted'); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 70 * Math.cos(th), cy - 70 * Math.sin(th)); ctx.stroke();
          text(ctx, 'rope', cx + 82 * Math.cos(th), cy - 82 * Math.sin(th) - 8, { color: col('--muted'), size: 11 });
        }
        if (s0.slide) arrow(ctx, bx - 20, fy - bh - 22, bx + 20, fy - bh - 22, col('--muted'), 1.5, 7);
        if (s0.slide) text(ctx, 'v', bx + 30, fy - bh - 22, { color: col('--muted'), size: 11 });
        text(ctx, 'The scene', 14, 16, { align: 'left', color: col('--muted'), weight: 600 });
        // divider + FBD
        ctx.strokeStyle = col('--border'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w * 0.58, 10); ctx.lineTo(w * 0.58, h - 10); ctx.stroke();
        text(ctx, 'Free-body diagram', w * 0.61, 16, { align: 'left', color: col('--muted'), weight: 600 });
        const cx = w * 0.79, cy = h * 0.5;
        drawSet(ctx, cx, cy, s, P, true);
        dot(ctx, cx, cy, 6, col('--text'));
        if (P.lift) text(ctx, 'Lifts off the floor!', w * 0.27, 26, { color: col('--bad'), weight: 700 });
      }
      const st = stage(cv, 0.55, draw);
      const upd = () => {
        s0.F = Number(q('F').value); s0.th = Number(q('th').value); s0.mu = Number(q('mu').value); s0.slide = q('slide').checked;
        q('Fv').textContent = `${s0.F} N`; q('thv').textContent = `${s0.th}°`; q('muv').textContent = s0.mu.toFixed(2);
        const P = forces();
        const a = P.net / m;
        ro.innerHTML = `<span>F<sub>g</sub> = <b>49.0 N</b></span><span>F<sub>N</sub> = 49 − F sinθ = <b>${N1(P.N)} N</b></span>` +
          `<span>${s0.slide ? 'f<sub>k</sub> = μ<sub>k</sub>F<sub>N</sub>' : 'f<sub>s</sub> (just enough)'} = <b>${N1(P.f)} N</b></span>` +
          `<span>ΣF<sub>x</sub> = F cosθ − f = <b>${N1(P.net)} N</b></span>` +
          (s0.slide ? `<span>so a<sub>x</sub> = ΣF<sub>x</sub>/m = <b>${N1(a)} m/s²</b>${a < 0 ? ' (slowing down)' : ''}</span>` : '<span>at rest: ΣF = 0</span>');
        st.request();
      };
      bind(q, ['F', 'th', 'mu', 'slide'], upd);
      upd();
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 3. Newton's third law
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 3, id: 'p1u2-third-law', title: "Newton's third law: forces come in pairs",
    render(el) {
      el.innerHTML = `
<p class="lead">Forces never show up alone. Push on a wall and the wall pushes back on you, just as hard. A force is really one half of an <b>interaction</b> between two objects, and the two halves always match.</p>

<h2>The law</h2>
${eq('\\[ \\vec F_{A\\text{ on }B} = -\\vec F_{B\\text{ on }A} \\]', 'where \\(\\vec F_{A\\text{ on }B}\\) = the force object A exerts on object B (N); \\(\\vec F_{B\\text{ on }A}\\) = the force B exerts back on A (N). The minus sign means opposite direction; the magnitudes are always exactly equal.')}
<p>This holds no matter what: whether the objects are moving or not, speeding up or not, big or small, touching or interacting through gravity.</p>

<h2>How to spot a third-law pair</h2>
<p>The two forces in a pair always:</p>
<ul>
<li>involve <b>exactly two objects</b>, with the labels swapped (A on B ↔ B on A);</li>
<li>are the <b>same type</b> of force (both gravitational, both normal, both friction…);</li>
<li>act on <b>different objects</b> — so they <b>never cancel each other</b> on one FBD.</li>
</ul>
<p>A book resting on a table has two forces on it: Earth pulls it down (weight) and the table pushes it up (normal). They happen to be equal here, but they are <b>not</b> a third-law pair — both act on the book and they're different types. The real partners are:</p>
<ul>
<li>Earth pulls the book down ↔ <b>the book pulls Earth up</b> (gravitational, same size!).</li>
<li>The table pushes the book up ↔ <b>the book pushes the table down</b> (normal).</li>
</ul>

<h2>Same force, different effects</h2>
<p>Equal forces don't mean equal results. Each object accelerates according to its <i>own</i> mass, \\(a = F/m\\). Two carts push apart below: try making one cart much heavier than the other.</p>

<div class="sim" data-sim="carts">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Mass A <input type="range" data-k="mA" min="1" max="10" step="0.5" value="2"> <span data-k="mAv"></span></label>
    <label>Mass B <input type="range" data-k="mB" min="1" max="10" step="0.5" value="6"> <span data-k="mBv"></span></label>
    <label>Push <input type="range" data-k="F" min="10" max="100" step="5" value="40"> <span data-k="Fv"></span></label>
    <button class="btn small primary" data-k="go">Push apart ▸</button>
    <button class="btn small" data-k="reset">Reset</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">The carts push on each other for 0.25 s through a spring plunger, then coast on a frictionless track. The force arrows during the push are always the same length; the accelerations (and so the final speeds) are not.</div>
</div>

<p>That's why, when a bug hits a truck's windshield, the bug and the truck feel exactly the same force — but the bug's tiny mass gives it an enormous acceleration, and the truck's huge mass gives it almost none.</p>

${call('analogy', 'Analogy: a handshake', 'You can\'t touch something without being touched by it. You can\'t shake someone\'s hand without them shaking yours. Every force is a two-way street.')}
${call('mistake', 'Common mistake: "then how does anything move?"', 'If the horse pulls the cart forward and the cart pulls the horse back equally, how do they go anywhere? Because those two forces act on <b>different objects</b>. To see whether the horse accelerates, look only at forces <i>on the horse</i>: the cart pulls it back, but the ground pushes its hooves forward harder. The forces in a third-law pair never appear on the same FBD.')}
${call('ap', 'On the AP exam', 'Expect "which force is the third-law partner of…" questions; answer by swapping the two objects\' names and keeping the same force type. In collisions, the forces on the two objects are always equal in size even when the masses, speeds, or damage are very different.')}
${check('A big truck and a small car collide head-on. During the collision, the force on the car is ___ the force on the truck.', ['greater than', 'equal in magnitude to', 'less than', 'it depends on their speeds'], 1, 'They are a third-law pair: car-on-truck and truck-on-car. Always equal in size. The car is damaged more because its smaller mass gives it a larger acceleration.')}
${check('A book rests on a table. What is the third-law partner of the book\'s weight (Earth pulling the book down)?', ['The table pushing the book up', 'The book pushing down on the table', 'The book pulling Earth up', 'Friction from the table'], 2, 'Swap the two objects: "Earth on book" becomes "book on Earth," same type (gravity). The table\'s normal force on the book is equal here only because the book is in equilibrium — that\'s Newton\'s first law, not the third.')}
`;
      const { cv, ro, q } = sim(el, 'carts');
      const TPUSH = 0.25, WORLD = 8, CW = 0.8;
      const s0 = { mA: 2, mB: 6, F: 40 };
      let t = -1, xA = -CW / 2, xB = CW / 2, vA = 0, vB = 0;
      function reset() { t = -1; xA = -CW / 2; xB = CW / 2; vA = 0; vB = 0; }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const s = w / WORLD, cx = w / 2, ty = h * 0.7;
        floor(ctx, 8, w - 8, ty);
        const pushing = t >= 0 && t < TPUSH;
        const cartAt = (x, m, label) => {
          const ch = 26 + 4 * Math.sqrt(m), cw = CW * s;
          const left = cx + x * s - cw / 2;
          crate(ctx, left, ty - ch - 10, cw, ch, `${label} · ${m} kg`, { fill: rgba(col(label === 'A' ? '--accent' : '--warn'), 0.2), size: 12 });
          [0.25, 0.75].forEach((f) => dot(ctx, left + cw * f, ty - 6, 6, col('--muted')));
          return ch;
        };
        const hA = cartAt(xA, s0.mA, 'A');
        const hB = cartAt(xB, s0.mB, 'B');
        if (pushing || t < 0) {
          const L = (s0.F / 100) * 0.16 * w;
          const y = ty - Math.max(hA, hB) - 30;
          force(ctx, cx + (xA + CW / 2) * s - 4, y, -L, 0, fc('push'), '');
          force(ctx, cx + (xB - CW / 2) * s + 4, y, L, 0, fc('push'), '');
          text(ctx, `F(B on A) = ${s0.F} N`, cx + (xA + CW / 2) * s - L / 2, y - 16, { color: fc('push'), weight: 600, size: 11 });
          text(ctx, `F(A on B) = ${s0.F} N`, cx + (xB - CW / 2) * s + L / 2, y - 16, { color: fc('push'), weight: 600, size: 11 });
          if (t < 0) text(ctx, 'force preview', cx, h - 10, { color: col('--muted'), size: 11 });
        }
        if (t >= TPUSH) {
          arrow(ctx, cx + xA * s, ty - hA - 24, cx + xA * s - vA * 14, ty - hA - 24, col('--muted'), 2, 8);
          arrow(ctx, cx + xB * s, ty - hB - 24, cx + xB * s + vB * 14, ty - hB - 24, col('--muted'), 2, 8);
        }
      }
      const st = stage(cv, 0.4, draw);
      function readout() {
        const aA = s0.F / s0.mA, aB = s0.F / s0.mB;
        ro.innerHTML = `<span>|F| on each = <b>${s0.F} N</b></span><span>a<sub>A</sub> = F/m<sub>A</sub> = <b>${N1(aA)} m/s²</b></span><span>a<sub>B</sub> = F/m<sub>B</sub> = <b>${N1(aB)} m/s²</b></span>` +
          `<span>after the push: v<sub>A</sub> = <b>${N1(aA * TPUSH)} m/s</b>, v<sub>B</sub> = <b>${N1(aB * TPUSH)} m/s</b></span>`;
        ['mA', 'mB'].forEach((k) => (q(k + 'v').textContent = `${s0[k]} kg`)); q('Fv').textContent = `${s0.F} N`;
      }
      bind(q, ['mA', 'mB', 'F'], () => { s0.mA = Number(q('mA').value); s0.mB = Number(q('mB').value); s0.F = Number(q('F').value); reset(); readout(); st.request(); });
      q('go').onclick = () => { reset(); t = 0; };
      q('reset').onclick = () => { reset(); st.request(); };
      readout();
      st.draw();
      const stop = loop((dt) => {
        if (t < 0) return;
        const sub = 4;
        for (let i = 0; i < sub; i++) {
          const d = dt / sub;
          if (t < TPUSH) { vA -= (s0.F / s0.mA) * d; vB += (s0.F / s0.mB) * d; }
          xA += vA * d; xB += vB * d; t += d;
        }
        const lim = WORLD / 2 - CW / 2 - 0.05;
        if (xA < -lim) { xA = -lim; vA = 0; }
        if (xB > lim) { xB = lim; vB = 0; }
        st.draw();
      });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 4. Newton's first law and equilibrium
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 4, id: 'p1u2-first-law', title: "Newton's first law: inertia and equilibrium",
    render(el) {
      el.innerHTML = `
<p class="lead">What does it take to keep something moving? For 2000 years people believed: a constant push. Slide a book across a table and it stops, after all. Galileo and Newton saw what was really happening — friction was stopping it — and realized that motion needs no cause at all. Only <i>changes</i> in motion do.</p>

<h2>The law of inertia</h2>
<div class="callout idea"><div class="title">Newton's first law</div>An object at rest stays at rest, and an object in motion keeps moving at the <b>same speed in the same direction</b>, unless a <b>net external force</b> acts on it.</div>
<p>The tendency to keep doing whatever you're already doing is called <b>inertia</b>, and <b>mass</b> is the measure of it. A bowling ball has more inertia than a tennis ball: harder to start, harder to stop, harder to turn.</p>
<p>On Earth we rarely see the first law cleanly because friction and air resistance are everywhere. A hockey puck on smooth ice comes closest: it glides a long way with almost no force on it.</p>

<h2>Equilibrium: zero net force</h2>
<p>When all the forces on an object cancel, it is in <b>translational equilibrium</b>. The first law tells you exactly what that looks like: its velocity doesn't change. That includes being at rest, <i>and</i> moving in a straight line at constant speed.</p>
${eq('\\[ \\sum \\vec F = 0 \\iff \\vec a = 0 \\iff \\vec v = \\text{constant} \\qquad\\Longrightarrow\\qquad \\sum F_x = 0, \\ \\ \\sum F_y = 0 \\]', 'where \\(\\sum \\vec F\\) = net external force on the object (N); \\(\\vec a\\) = its acceleration (m/s²); \\(\\vec v\\) = its velocity (m/s). Equilibrium gives you one equation per direction — usually exactly what you need to find unknown forces.')}

<h2>Solving an equilibrium problem: a hanging sign</h2>
<p>A sign of mass \\(m\\) hangs from two ropes, each at angle \\(\\theta\\) above the horizontal. Look at the knot where the ropes meet. Horizontally, the two tensions' x-components cancel (symmetry). Vertically, their y-components must hold up the weight:</p>
${eq('\\[ 2F_T\\sin\\theta = mg \\quad\\Rightarrow\\quad F_T = \\frac{mg}{2\\sin\\theta} \\]', 'where \\(F_T\\) = tension in each rope (N); \\(\\theta\\) = angle of each rope above the horizontal; \\(m\\) = mass of the sign (kg); \\(g = 9.8\\) m/s². As \\(\\theta \\to 0\\), \\(\\sin\\theta \\to 0\\) and the tension shoots toward infinity.')}

<div class="sim" data-sim="sign">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Rope angle θ <input type="range" data-k="th" min="5" max="85" step="1" value="40"> <span data-k="thv"></span></label>
    <label>Mass <input type="range" data-k="m" min="1" max="20" step="1" value="5"> <span data-k="mv"></span></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Forces on the knot, drawn to scale relative to the weight (orange). Dashed lines are the tension components. Flatten the ropes and watch each tension grow far past the weight: only the small vertical parts are doing the holding up, while the big horizontal parts just cancel each other.</div>
</div>

<h2>Inertial reference frames</h2>
<p>Newton's laws hold in frames that aren't accelerating (inertial frames). On a bus that suddenly brakes, you lurch forward — but no force pushed you forward. Your body simply kept moving (first law) while the bus slowed down underneath you. In the ground's frame, everything makes sense.</p>

${call('analogy', 'Analogy: a tablecloth trick', 'Yank a tablecloth out fast and the dishes stay put. The cloth\'s friction acts on them only briefly, and their inertia keeps them where they were.')}
${call('mistake', 'Common mistakes', '<ul><li>"Constant velocity needs a constant net force." No — constant velocity means the net force is <b>zero</b>. A crate pushed at steady speed has the push exactly balanced by friction.</li><li>"At the top of its flight a tossed ball is in equilibrium." Its velocity is zero for an instant, but gravity still acts, so \\(a = g\\). Equilibrium means \\(a = 0\\), not \\(v = 0\\).</li></ul>')}
${call('ap', 'On the AP exam', 'Know that "constant velocity" and "at rest" are both equilibrium and let you set ΣF = 0 in every direction. Classic results: an elevator moving at constant speed has cable tension = mg; a rope can never be pulled perfectly horizontal while holding up a weight.')}
${check('You push a crate across the floor at constant velocity with an 80 N horizontal force. How big is the friction force on the crate?', ['Less than 80 N', 'Exactly 80 N', 'More than 80 N', 'Zero, since it\'s moving'], 1, 'Constant velocity means equilibrium: ΣF<sub>x</sub> = 0, so friction must exactly cancel the 80 N push.')}
${check('A sign hangs from two symmetric ropes. If the ropes are made more horizontal (smaller θ), the tension in each rope…', ['Increases', 'Decreases', 'Stays the same', 'Becomes zero'], 0, '\\(F_T = mg/(2\\sin\\theta)\\). Smaller θ means smaller sinθ, so each rope must pull harder for its vertical part to still hold up the sign.')}
`;
      const { cv, ro, q } = sim(el, 'sign');
      const s0 = { th: 40, m: 5 };
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const th = deg(s0.th);
        const cy0 = 22, cx = w / 2;
        const maxDepth = h * 0.36, maxHalf = w * 0.4;
        let half = maxHalf, depth = half * Math.tan(th);
        if (depth > maxDepth) { depth = maxDepth; half = depth / Math.tan(th); }
        const kx = cx, ky = cy0 + depth;
        // ceiling
        ctx.fillStyle = col('--border'); ctx.fillRect(10, cy0 - 12, w - 20, 12);
        ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - half, cy0); ctx.lineTo(kx, ky); ctx.lineTo(cx + half, cy0); ctx.stroke();
        // sign
        ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx, ky + 26); ctx.stroke();
        crate(ctx, kx - 54, ky + 26, 108, 40, `SIGN · ${s0.m} kg`, { size: 12 });
        // forces on knot
        const W = s0.m * G, T = W / (2 * Math.sin(th));
        const sc = 70 / W; // weight arrow is always 70 px
        const L = Math.min(T * sc, Math.min(w * 0.45, 260));
        const tx = Math.cos(th) * L, ty = -Math.sin(th) * L;
        dashed(ctx, kx, ky, kx - tx, ky, col('--muted')); dashed(ctx, kx - tx, ky, kx - tx, ky + ty, col('--muted'));
        dashed(ctx, kx, ky, kx + tx, ky, col('--muted')); dashed(ctx, kx + tx, ky, kx + tx, ky + ty, col('--muted'));
        force(ctx, kx, ky, -tx, ty, col('--accent'), 'FT');
        force(ctx, kx, ky, tx, ty, col('--accent'), 'FT');
        force(ctx, kx + 64, ky + 46, 0, 70, fc('grav'), 'mg');
        dot(ctx, kx, ky, 5, col('--text'));
        if (T * sc > L + 1) text(ctx, '(tension arrows clipped)', w - 12, h - 10, { align: 'right', color: col('--muted'), size: 11 });
        // angle arc
        ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(kx, ky, 26, Math.PI + 0, Math.PI + th, false); ctx.stroke();
        text(ctx, 'θ', kx - 36, ky - 10, { color: col('--muted'), weight: 700 });
      }
      const st = stage(cv, 0.6, draw);
      const upd = () => {
        s0.th = Number(q('th').value); s0.m = Number(q('m').value);
        q('thv').textContent = `${s0.th}°`; q('mv').textContent = `${s0.m} kg`;
        const W = s0.m * G, T = W / (2 * Math.sin(deg(s0.th)));
        ro.innerHTML = `<span>weight mg = <b>${N1(W)} N</b></span><span>each tension F<sub>T</sub> = mg/(2 sinθ) = <b>${N1(T)} N</b></span>` +
          `<span>vertical parts: 2F<sub>T</sub>sinθ = <b>${N1(2 * T * Math.sin(deg(s0.th)))} N</b> ✓</span><span>horizontal parts: ±<b>${N1(T * Math.cos(deg(s0.th)))} N</b> (cancel)</span>`;
        st.request();
      };
      bind(q, ['th', 'm'], upd);
      upd();
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 5. Newton's second law
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 5, id: 'p1u2-second-law', title: "Newton's second law: net force makes acceleration",
    render(el) {
      el.innerHTML = `
<p class="lead">The first law says: no net force, no change in velocity. The second law finishes the thought. A net force makes an object accelerate, in the direction of the net force, and the more mass the object has, the less it accelerates.</p>

<h2>The law</h2>
${eq('\\[ \\vec a = \\frac{\\sum \\vec F}{m} \\qquad\\text{or}\\qquad \\sum \\vec F = m\\vec a \\]', 'where \\(\\vec a\\) = acceleration of the object (or of a system\'s center of mass) (m/s²); \\(\\sum \\vec F\\) = net external force, the vector sum of all forces on it (N); \\(m\\) = its mass (kg). This is also where the newton comes from: 1 N is the net force that gives 1 kg an acceleration of 1 m/s².')}
<p>Read it as a cause-and-effect sentence: <b>net force</b> (the cause) divided by <b>mass</b> (the resistance) gives <b>acceleration</b> (the effect). Notice what's <i>not</i> in it: velocity. Force decides how velocity <i>changes</i>, not what it is.</p>

<h2>Two experiments in one</h2>
<p>Push a cart along a frictionless track. Try doubling the force (acceleration doubles), then doubling the mass (acceleration halves). The v–t graph's slope is the acceleration; earlier runs stay faintly on the graph so you can compare.</p>

<div class="sim" data-sim="cart">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Net force <input type="range" data-k="F" min="0" max="20" step="1" value="6"> <span data-k="Fv"></span></label>
    <label>Mass <input type="range" data-k="m" min="1" max="10" step="0.5" value="2"> <span data-k="mv"></span></label>
    <button class="btn small primary" data-k="go">Go ▸</button>
    <button class="btn small" data-k="clear">Clear graph</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Each run lasts 4 s, starting from rest. The track view rescales so the whole run fits. Straight v–t lines mean constant acceleration — exactly what a constant net force produces.</div>
</div>

<h2>A recipe for any second-law problem</h2>
<ol>
<li>Choose the <b>system</b>.</li>
<li>Draw its <b>free-body diagram</b>.</li>
<li>Pick axes, with one axis along the acceleration if you know its direction.</li>
<li>Write \\(\\sum F_x = ma_x\\) and \\(\\sum F_y = ma_y\\), with signs.</li>
<li>Solve, then sanity-check units and direction.</li>
</ol>
<p><b>Example:</b> a 2 kg box is pulled right with 10 N while friction pulls left with 4 N. \\(\\sum F_x = 10 - 4 = 6\\) N, so \\(a = 6/2 = 3\\) m/s² to the right. Vertically \\(F_N - mg = 0\\), so \\(F_N = 19.6\\) N.</p>

<h2>Acceleration follows net force, not velocity</h2>
<p>A car moving forward while braking has velocity forward but net force — and acceleration — backward. A ball thrown upward is moving up but accelerating down. The second law links force to <b>acceleration</b> only.</p>
${call('analogy', 'Analogy: shopping carts', 'Push an empty shopping cart and a full one with the same shove. The empty one zips away; the full one barely gets going. Same force, more mass, less acceleration.')}
${call('mistake', 'Common mistakes', '<ul><li>Drawing "\\(ma\\)" as a force on the FBD. \\(ma\\) is the <i>result</i> of the forces, not another force.</li><li>Using one force instead of the net force: \\(a = F_{\\text{push}}/m\\) ignores friction.</li><li>Thinking a bigger force means a bigger speed. Bigger force means faster <i>change</i> in speed.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect graphs: a vs F for fixed mass is a straight line through the origin with slope \\(1/m\\); a vs m is a curve, so you linearize by plotting a vs \\(1/m\\) (slope = F). Also ranking tasks: "rank the accelerations" means computing ΣF/m for each case.')}
${check('A 4 kg object has a 10 N force pulling it east and a 2 N force pulling it west. What is its acceleration?', ['2 m/s² east', '2.5 m/s² east', '3 m/s² east', '0.5 m/s² west'], 0, 'Net force = 10 − 2 = 8 N east, so a = 8/4 = 2 m/s² east.')}
${check('The net force on a cart is doubled while its mass is cut in half. Its acceleration becomes…', ['the same', '2 times as big', '4 times as big', 'half as big'], 2, 'a = ΣF/m. Doubling the top and halving the bottom each double a: 2 × 2 = 4 times as big.')}
`;
      const { cv, ro, q } = sim(el, 'cart');
      const T = 4;
      const s0 = { F: 6, m: 2 };
      let run = null; // {a, t}
      let ghosts = [];
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const a = run ? run.a : s0.F / s0.m;
        const t = run ? run.t : 0;
        // track
        const ty = h * 0.33, x0 = 24, x1 = w - 24;
        const L = Math.max(4, 0.5 * a * T * T * 1.08);
        const s = (x1 - x0 - 70) / L;
        floor(ctx, 10, w - 10, ty);
        const step = L > 60 ? 20 : L > 24 ? 10 : L > 10 ? 5 : 1;
        for (let m = 0; m <= L; m += step) {
          const x = x0 + m * s;
          ctx.fillStyle = col('--muted'); ctx.fillRect(x, ty + 12, 1, 6);
          text(ctx, `${m} m`, x, ty + 26, { color: col('--muted'), size: 10 });
        }
        const x = 0.5 * a * t * t;
        const cw = 44 + 3 * s0.m, ch = 26 + 2 * s0.m;
        const cl = x0 + x * s;
        crate(ctx, cl, ty - ch - 8, cw, ch, `${s0.m} kg`, { fill: rgba(col('--accent'), 0.18), size: 12 });
        [0.25, 0.75].forEach((f) => dot(ctx, cl + cw * f, ty - 5, 5, col('--muted')));
        if (s0.F > 0) force(ctx, cl + cw, ty - ch / 2 - 8, 8 + s0.F * 3.5, 0, fc('push'), 'ΣF');
        // v–t graph
        const vMax = Math.max(8, a * T * 1.1, ...ghosts.map((g) => g * T * 1.1));
        const box = { x: 44, y: h * 0.5, w: w - 64, h: h * 0.44 };
        const ax = axes(ctx, box, { xMax: T, yMin: 0, yMax: vMax, xLabel: 't (s) →', yLabel: 'v (m/s)' });
        text(ctx, `${PR.sig(vMax, 2)}`, box.x - 6, box.y + 4, { align: 'right', color: col('--muted'), size: 10 });
        text(ctx, '0', box.x - 6, box.y + box.h, { align: 'right', color: col('--muted'), size: 10 });
        for (let i = 1; i <= T; i++) text(ctx, `${i}`, ax.X(i), box.y + box.h + 10, { color: col('--muted'), size: 10 });
        ghosts.forEach((g) => { plot(ctx, ax, (tt) => g * tt, T, rgba(col('--muted'), 0.6), 1.5, 2); text(ctx, `a=${PR.sig(g, 2)}`, ax.X(T) - 4, ax.Y(g * T) - 8, { align: 'right', color: col('--muted'), size: 10 }); });
        if (run) plot(ctx, ax, (tt) => a * tt, t, col('--accent'), 2.5, 60);
      }
      const st = stage(cv, 0.72, draw);
      function readout() {
        const a = s0.F / s0.m;
        const t = run ? run.t : 0;
        ro.innerHTML = `<span>a = ΣF/m = ${s0.F}/${s0.m} = <b>${N1(a)} m/s²</b></span><span>t = <b>${t.toFixed(1)} s</b></span><span>v = at = <b>${N1(a * t)} m/s</b></span>`;
        q('Fv').textContent = `${s0.F} N`; q('mv').textContent = `${s0.m} kg`;
      }
      bind(q, ['F', 'm'], () => { s0.F = Number(q('F').value); s0.m = Number(q('m').value); if (run && run.t < T) run = null; readout(); st.request(); });
      q('go').onclick = () => {
        if (run && run.t >= T) { ghosts.push(run.a); if (ghosts.length > 4) ghosts.shift(); }
        run = { a: s0.F / s0.m, t: 0 };
      };
      q('clear').onclick = () => { ghosts = []; run = null; readout(); st.request(); };
      readout();
      st.draw();
      const stop = loop((dt) => {
        if (!run || run.t >= T) return;
        run.t = Math.min(T, run.t + dt);
        readout(); st.draw();
      });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 6. Gravitational force
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 6, id: 'p1u2-gravity', title: 'Gravitational force, weight, and g',
    render(el) {
      el.innerHTML = `
<p class="lead">Every object with mass attracts every other object with mass. You attract this page; Earth attracts the Moon; the Sun attracts Earth. Newton's great insight was that the force pulling an apple down is the same force holding the Moon in its orbit.</p>

<h2>Newton's law of universal gravitation</h2>
${eq('\\[ F_g = G\\frac{m_1 m_2}{r^2} \\]', 'where \\(F_g\\) = magnitude of the gravitational force each object exerts on the other (N); \\(m_1, m_2\\) = the two masses (kg); \\(r\\) = distance between their <b>centers</b> (m); \\(G = 6.67\\times10^{-11}\\) N·m²/kg², the universal gravitational constant. The force is always attractive, along the line joining the centers.')}
<p>\\(G\\) is tiny, so gravity between everyday objects is undetectable: two 70 kg people 1 m apart attract each other with about \\(3\\times10^{-7}\\) N. You only notice gravity when at least one mass is planet-sized. And by the third law, the pull of the apple on Earth is exactly as big as Earth's pull on the apple.</p>

<h2>The gravitational field \\(g\\)</h2>
<p>Instead of computing the force on every object separately, we describe the <b>gravitational field</b> a planet creates: the force per kilogram at each point in space.</p>
${eq('\\[ g = \\frac{F_g}{m} = \\frac{GM}{r^2} \\qquad\\Longrightarrow\\qquad F_g = mg \\]', 'where \\(g\\) = gravitational field strength at that spot (N/kg, which is the same as m/s²); \\(M\\) = mass of the planet (kg); \\(r\\) = distance from the planet\'s center (m); \\(m\\) = mass of the object placed there (kg). At Earth\'s surface \\(g = 9.8\\) N/kg.')}
<p>So \\(g\\) has two meanings that turn out to be the same number: the force of gravity on each kilogram, and the acceleration of anything in free fall there. That is why a hammer and a feather fall together on the Moon: twice the mass means twice the pull, but also twice the inertia.</p>

<div class="sim" data-sim="planet">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Planet <select data-k="pl"><option value="earth">Earth</option><option value="moon">Moon</option><option value="mars">Mars</option><option value="jupiter">Jupiter</option></select></label>
    <label>Satellite mass <input type="range" data-k="m" min="100" max="2000" step="50" value="500"> <span data-k="mv"></span></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the satellite. The small arrows show the field \\(g\\) around the planet: it points toward the center and fades as \\(1/r^2\\). Dashed rings mark 2 and 3 planet radii, where \\(g\\) is ¼ and ⅑ of its surface value.</div>
</div>

<h2>Mass versus weight</h2>
<p><b>Mass</b> (kg) is how much stuff an object has, and how much it resists acceleration. It's the same everywhere. <b>Weight</b> (N) is the gravitational force on it, \\(mg\\), which depends on where you are. A 60 kg astronaut weighs 588 N on Earth, 97 N on the Moon, and has a mass of 60 kg in both places.</p>

<h2>Thinking with the inverse square</h2>
<p>Double the distance from the center and \\(g\\) (and the force) drop to ¼. Triple it, ⅑. But be careful what "distance" means: the International Space Station orbits 400 km up, while Earth's radius is 6370 km. So \\(r\\) only grows by about 6%, and \\(g\\) there is still about 8.7 m/s², nearly 90% of the surface value. Astronauts float not because gravity is gone, but because they are in free fall along with their station (more in the circular motion lesson).</p>

${call('analogy', 'Analogy: spray paint', 'Picture gravity\'s influence as paint sprayed in all directions from the planet. At twice the distance the same paint covers a sphere with 4 times the area (\\(4\\pi r^2\\)), so it\'s 4 times thinner. That\'s the inverse-square law.')}
${call('mistake', 'Common mistakes', '<ul><li>Using height above the surface for \\(r\\). It\'s the distance from the planet\'s center: \\(r = R + h\\).</li><li>"There\'s no gravity in space." There\'s plenty — it\'s what keeps the Moon in orbit.</li><li>Mixing up mass and weight. Kilograms are mass; newtons are weight.</li></ul>')}
${call('ap', 'On the AP exam', 'Ratio problems are favorites: a planet with twice Earth\'s mass and twice its radius has \\(g = 9.8 \\times 2/2^2 = 4.9\\) m/s². Also expect to explain why all objects fall with the same acceleration: gravitational mass and inertial mass are the same, so \\(m\\) cancels in \\(a = F_g/m\\).')}
${check('A satellite moves from a distance r to a distance 3r from Earth\'s center. The gravitational force on it becomes…', ['1/3 as large', '1/9 as large', '3 times as large', '9 times as large'], 1, 'Inverse square: \\((1/3)^2 = 1/9\\).')}
${check('A planet has twice Earth\'s mass and twice Earth\'s radius. The value of g at its surface is about…', ['4.9 m/s²', '9.8 m/s²', '19.6 m/s²', '39.2 m/s²'], 0, '\\(g = GM/R^2\\): mass ×2 and radius² ×4, so g is ×2/4 = ½ of 9.8, which is 4.9 m/s².')}
`;
      const { cv, ro, q } = sim(el, 'planet');
      const PL = {
        earth: { M: 5.97e24, R: 6.37e6, c: '--accent' },
        moon: { M: 7.35e22, R: 1.74e6, c: '--muted' },
        mars: { M: 6.42e23, R: 3.39e6, c: '--bad' },
        jupiter: { M: 1.9e27, R: 6.99e7, c: '--warn' },
      };
      const s0 = { pl: 'earth', m: 500 };
      const sat = { u: 2.2, a: -0.5 }; // distance in planet radii, angle
      let geo = null;
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const P = PL[s0.pl];
        const cx = w * 0.3, cy = h * 0.52, Rp = Math.min(w, h) * 0.11;
        geo = { cx, cy, Rp };
        // field arrows
        const gs = 22;
        for (let y = gs / 2; y < h; y += gs) {
          for (let x = gs / 2; x < w; x += gs) {
            const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
            if (d < Rp * 1.15) continue;
            const rel = (Rp / d) * (Rp / d);
            const L = clamp(9 * Math.sqrt(rel) + 2, 2, 9);
            ctx.save(); ctx.globalAlpha = clamp(0.15 + rel * 1.2, 0.15, 0.85);
            arrow(ctx, x + (dx / d) * L * 0.5, y + (dy / d) * L * 0.5, x - (dx / d) * L * 0.5, y - (dy / d) * L * 0.5, col('--muted'), 1.2, 5);
            ctx.restore();
          }
        }
        [2, 3].forEach((k) => {
          ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = col('--border'); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(cx, cy, Rp * k, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          text(ctx, k === 2 ? 'g/4' : 'g/9', cx, cy - Rp * k - 8, { color: col('--muted'), size: 11 });
        });
        dot(ctx, cx, cy, Rp, rgba(col(P.c), 0.35));
        ctx.strokeStyle = col(P.c); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, Math.PI * 2); ctx.stroke();
        text(ctx, s0.pl[0].toUpperCase() + s0.pl.slice(1), cx, cy, { weight: 700 });
        // satellite
        const sx = cx + sat.u * Rp * Math.cos(sat.a), sy = cy + sat.u * Rp * Math.sin(sat.a);
        const rel = 1 / (sat.u * sat.u);
        force(ctx, sx, sy, -Math.cos(sat.a) * 70 * rel, -Math.sin(sat.a) * 70 * rel, fc('grav'), 'Fg');
        ctx.fillStyle = col('--text'); ctx.fillRect(sx - 6, sy - 6, 12, 12);
        ctx.fillStyle = col('--accent'); ctx.fillRect(sx - 16, sy - 3, 9, 6); ctx.fillRect(sx + 7, sy - 3, 9, 6);
        dashed(ctx, cx, cy, sx, sy, col('--border'));
      }
      const st = stage(cv, 0.6, draw);
      function readout() {
        const P = PL[s0.pl];
        const r = sat.u * P.R;
        const g = (GRAV * P.M) / (r * r), g0 = (GRAV * P.M) / (P.R * P.R);
        ro.innerHTML = `<span>r = <b>${sat.u.toFixed(2)} R</b> = <b>${sci(r / 1000)} km</b> from the center</span><span>g there = GM/r² = <b>${N1(g)} N/kg</b></span>` +
          `<span>surface g = <b>${N1(g0)} N/kg</b> (ratio 1/${N1(sat.u * sat.u)})</span><span>force on ${s0.m} kg satellite = <b>${sci(s0.m * g)} N</b></span>`;
        q('mv').textContent = `${s0.m} kg`;
      }
      bind(q, ['pl', 'm'], () => { s0.pl = q('pl').value; s0.m = Number(q('m').value); readout(); st.request(); });
      drag(cv,
        (x, y) => {
          if (!geo) return null;
          const sx = geo.cx + sat.u * geo.Rp * Math.cos(sat.a), sy = geo.cy + sat.u * geo.Rp * Math.sin(sat.a);
          return Math.hypot(sx - x, sy - y) < 22 ? sat : null;
        },
        (it, x, y) => {
          const dx = x - geo.cx, dy = y - geo.cy;
          it.u = clamp(Math.hypot(dx, dy) / geo.Rp, 1.05, 6); it.a = Math.atan2(dy, dx);
          readout(); st.request();
        });
      readout();
      st.draw();
      return () => st.destroy();
    },
  });

  // =====================================================================
  // 7. Normal force, apparent weight, inclines
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 7, id: 'p1u2-normal-inclines', title: 'Normal force, apparent weight, and inclines',
    render(el) {
      el.innerHTML = `
<p class="lead">A bathroom scale doesn't actually measure your weight. It measures how hard it has to push up on you — the normal force. Usually that equals your weight. In an accelerating elevator, or on a slope, it doesn't.</p>

<h2>What the normal force really is</h2>
<p>When an object presses on a surface, the surface's atoms get squeezed very slightly and push back, like a stiff mattress. That push is perpendicular to the surface and is called the <b>normal force</b> \\(F_N\\). It isn't fixed: it grows or shrinks to be <i>exactly as large as needed</i> to stop the object from sinking into the surface (up to the point where the surface breaks).</p>

<h2>Apparent weight in an elevator</h2>
<p>Stand on a scale in an elevator. Two forces act on you: gravity \\(mg\\) down and the scale's normal force \\(F_N\\) up. Taking up as positive, the second law gives:</p>
${eq('\\[ F_N - mg = ma \\quad\\Longrightarrow\\quad F_N = m(g + a) \\]', 'where \\(F_N\\) = normal force from the scale = what the scale reads, your "apparent weight" (N); \\(m\\) = your mass (kg); \\(g = 9.8\\) m/s²; \\(a\\) = the elevator\'s acceleration (m/s²), <b>positive if upward</b>, negative if downward.')}
<ul>
<li>At rest or moving at <b>constant velocity</b>: \\(a = 0\\), so \\(F_N = mg\\). The scale reads your normal weight.</li>
<li><b>Acceleration up</b> (starting to go up, or slowing while going down): \\(F_N > mg\\). You feel heavy.</li>
<li><b>Acceleration down</b> (starting down, or slowing while going up): \\(F_N < mg\\). You feel light.</li>
<li><b>Free fall</b> (\\(a = -g\\)): \\(F_N = 0\\). The scale reads zero: "weightlessness," even though gravity is still fully on.</li>
</ul>

<div class="sim" data-sim="elevator">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Acceleration <input type="range" data-k="a" min="-9.8" max="6" step="0.2" value="2"> <span data-k="av"></span></label>
    <label>Your mass <input type="range" data-k="m" min="40" max="100" step="5" value="60"> <span data-k="mv"></span></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Only the acceleration matters, not the direction of motion. Going up and speeding up, and going down and slowing down, both have upward acceleration and feel exactly the same. Slide all the way to −9.8 m/s² (cable cut!) and the scale reads zero.</div>
</div>

<h2>Inclines: tilt your axes</h2>
<p>On a ramp at angle \\(\\theta\\), the normal force is perpendicular to the ramp, not straight up. The trick is to tilt your axes to match the ramp: one axis along the slope, one perpendicular to it. Then only gravity needs splitting into components:</p>
${eq('\\[ F_{g\\parallel} = mg\\sin\\theta, \\qquad F_{g\\perp} = mg\\cos\\theta, \\qquad F_N = mg\\cos\\theta \\]', 'where \\(F_{g\\parallel}\\) = the part of the weight pulling the object down the slope (N); \\(F_{g\\perp}\\) = the part pressing it into the slope (N); \\(\\theta\\) = the ramp\'s angle above horizontal; \\(F_N\\) = normal force (N), equal to \\(F_{g\\perp}\\) when nothing else pushes perpendicular to the ramp.')}
<p>On a <b>frictionless</b> ramp, the only force along the slope is \\(mg\\sin\\theta\\), so \\(a = g\\sin\\theta\\), the same for every mass. With friction, static friction can hold the block in place, but only up to \\(\\mu_s F_N\\) (next lesson). The block starts to slip when \\(mg\\sin\\theta > \\mu_s mg\\cos\\theta\\), which is when \\(\\tan\\theta > \\mu_s\\).</p>

<div class="sim" data-sim="incline">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Angle θ <input type="range" data-k="th" min="0" max="60" step="1" value="25"> <span data-k="thv"></span></label>
    <label>μ<sub>s</sub> <input type="range" data-k="mu" min="0" max="1" step="0.05" value="0.6"> <span data-k="muv"></span></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">A 4 kg block. Dashed arrows are gravity's two components. While it holds, static friction (red) exactly matches \\(mg\\sin\\theta\\). Steepen the ramp past \\(\\tan\\theta = \\mu_s\\) and the block slips and slides (here with \\(\\mu_k = 0.8\\mu_s\\)).</div>
</div>

${call('analogy', 'Analogy: a mattress', 'Sit gently on a mattress and it dips a little; jump on it and it dips a lot and pushes back harder. Hard floors do the same thing, just with dips too small to see. The normal force is a surface\'s "push back."')}
${call('mistake', 'Common mistakes', '<ul><li>Writing \\(F_N = mg\\) automatically. Check: is anything else pushing perpendicular? Is the surface tilted? Is the object accelerating perpendicular to the surface?</li><li>Swapping sin and cos on an incline. Test with \\(\\theta = 0\\) (flat): the part along the slope should be zero, so it must be \\(mg\\sin\\theta\\).</li></ul>')}
${call('ap', 'On the AP exam', 'Elevator questions ask you to rank scale readings for different motions — use only the direction of the acceleration. Incline questions love the fact that \\(a = g\\sin\\theta\\) is independent of mass, and the "critical angle" \\(\\tan\\theta = \\mu_s\\).')}
${check('A 60 kg person stands on a scale in an elevator that is accelerating downward at 2 m/s². The scale reads about…', ['468 N', '588 N', '708 N', '0 N'], 0, '\\(F_N = m(g + a) = 60(9.8 - 2) = 468\\) N. Downward acceleration makes you feel lighter.')}
${check('A block slides down a frictionless 30° ramp. Its acceleration is…', ['4.9 m/s²', '8.5 m/s²', '9.8 m/s²', 'It depends on the mass'], 0, '\\(a = g\\sin30^\\circ = 9.8 \\times 0.5 = 4.9\\) m/s², for any mass.')}
${check('A ramp is made steeper. The normal force on a block resting on it…', ['Increases', 'Decreases', 'Stays the same', 'Becomes equal to mg'], 1, '\\(F_N = mg\\cos\\theta\\), and cosθ shrinks as θ grows. At 90° (a wall) the block wouldn\'t press on the surface at all.')}
`;
      // ----- elevator -----
      let cleanElevator = () => {};
      {
        const { cv, ro, q } = sim(el, 'elevator');
        const s0 = { a: 2, m: 60 };
        let ph = 0;
        function draw(ctx, w, h) {
          ctx.clearRect(0, 0, w, h);
          const sx = w * 0.12, sw = w * 0.36;
          ctx.strokeStyle = col('--border'); ctx.lineWidth = 2; ctx.strokeRect(sx, 8, sw, h - 16);
          const ch = h * 0.6, cyTop = h * 0.2 + Math.sin(ph) * h * 0.04;
          ctx.strokeStyle = col('--muted'); ctx.beginPath(); ctx.moveTo(sx + sw / 2, 8); ctx.lineTo(sx + sw / 2, cyTop); ctx.stroke();
          ctx.fillStyle = rgba(col('--accent'), 0.08); ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
          roundRect(ctx, sx + 10, cyTop, sw - 20, ch, 6); ctx.fill(); ctx.stroke();
          // person on scale
          const px = sx + sw / 2, floorY = cyTop + ch - 10;
          ctx.fillStyle = col('--muted'); ctx.fillRect(px - 30, floorY - 10, 60, 10);
          const bh = ch * 0.42;
          ctx.fillStyle = rgba(col('--text'), 0.75); roundRect(ctx, px - 14, floorY - 10 - bh, 28, bh, 8); ctx.fill();
          dot(ctx, px, floorY - 10 - bh - 13, 12, rgba(col('--text'), 0.75));
          // acceleration arrow
          if (Math.abs(s0.a) > 0.05) {
            const L = clamp(Math.abs(s0.a) * 8, 10, 80);
            arrow(ctx, sx + sw + 24, h / 2, sx + sw + 24, h / 2 - Math.sign(s0.a) * L, col('--muted'), 2.5, 9);
            text(ctx, 'a', sx + sw + 38, h / 2 - Math.sign(s0.a) * L / 2, { color: col('--muted'), weight: 700 });
          }
          // FBD
          const fx = w * 0.78, fy = h * 0.5, mg = s0.m * G, N = Math.max(0, s0.m * (G + s0.a));
          const sc = (h * 0.32) / (100 * 15.8);
          text(ctx, 'FBD of you', fx, 16, { color: col('--muted'), weight: 600 });
          force(ctx, fx, fy, 0, mg * sc, fc('grav'), 'mg');
          if (N > 0.5) force(ctx, fx, fy, 0, -N * sc, fc('normal'), 'FN');
          dot(ctx, fx, fy, 6, col('--text'));
          tag(ctx, `scale: ${Math.round(N)} N`, px - 52, Math.min(h - 24, cyTop + ch + 4), { color: fc('normal') });
        }
        const st = stage(cv, 0.6, draw);
        const upd = () => {
          s0.a = Number(q('a').value); s0.m = Number(q('m').value);
          q('av').textContent = `${s0.a > 0 ? '+' : ''}${s0.a.toFixed(1)} m/s²`; q('mv').textContent = `${s0.m} kg`;
          const mg = s0.m * G, N = Math.max(0, s0.m * (G + s0.a));
          const feel = Math.abs(s0.a) < 0.05 ? 'normal weight' : s0.a <= -G + 0.01 ? 'weightless!' : s0.a > 0 ? 'heavier than usual' : 'lighter than usual';
          ro.innerHTML = `<span>true weight mg = <b>${N1(mg)} N</b></span><span>scale F<sub>N</sub> = m(g + a) = <b>${N1(N)} N</b></span><span>= <b>${N1(N / mg)}×</b> your weight · <b>${feel}</b></span>`;
          st.request();
        };
        bind(q, ['a', 'm'], upd);
        upd();
        const stop = loop((dt) => { ph += dt * (0.6 + Math.abs(s0.a) * 0.12); st.draw(); });
        cleanElevator = () => { stop(); st.destroy(); };
      }
      // ----- incline -----
      const { cv, ro, q } = sim(el, 'incline');
      const m = 4;
      const s0 = { th: 25, mu: 0.6 };
      let pos = 0.5, vel = 0; // fraction along the slope from the top
      function state() {
        const th = deg(s0.th);
        const par = m * G * Math.sin(th), N = m * G * Math.cos(th), fmax = s0.mu * N;
        const slips = par > fmax + 1e-9;
        const f = slips ? 0.8 * s0.mu * N : par;
        return { th, par, N, fmax, slips, f, a: slips ? (par - f) / m : 0 };
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const S = state();
        const bx0 = w * 0.08, by0 = h * 0.88;
        const run = w * 0.84;
        let rise = run * Math.tan(S.th);
        let L = run / Math.cos(S.th);
        if (rise > h * 0.72) { rise = h * 0.72; L = rise / Math.sin(S.th); }
        const runPx = L * Math.cos(S.th);
        // slope from top-left (bx0, by0 - rise) to bottom-right (bx0 + runPx, by0)
        ctx.fillStyle = rgba(col('--muted'), 0.18); ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx0, by0 - rise); ctx.lineTo(bx0 + runPx, by0); ctx.closePath(); ctx.fill(); ctx.stroke();
        text(ctx, `θ = ${s0.th}°`, bx0 + runPx - 60, by0 - 12, { color: col('--muted'), weight: 600 });
        const ux = Math.cos(S.th), uy = Math.sin(S.th); // down-slope unit vector (screen)
        const nx = uy, ny = -ux; // outward normal
        const d = clamp(pos, 0.15, 0.85) * L;
        const px = bx0 + ux * d, py = by0 - rise + uy * d;
        const bw = 52, bh = 34;
        const cxB = px + nx * (bh / 2), cyB = py + ny * (bh / 2);
        ctx.save(); ctx.translate(cxB, cyB); ctx.rotate(S.th);
        crate(ctx, -bw / 2, -bh / 2, bw, bh, '4 kg', { size: 12 });
        ctx.restore();
        const sc = (h * 0.3) / (m * G);
        // components
        const parL = S.par * sc, perL = S.N * sc;
        dashed(ctx, cxB, cyB, cxB + ux * parL, cyB + uy * parL, fc('grav'), 1.5);
        dashed(ctx, cxB, cyB, cxB - nx * perL, cyB - ny * perL, fc('grav'), 1.5);
        force(ctx, cxB, cyB, 0, m * G * sc, fc('grav'), 'mg');
        force(ctx, cxB, cyB, nx * perL, ny * perL, fc('normal'), 'FN');
        if (S.f > 0.01) force(ctx, cxB, cyB, -ux * S.f * sc, -uy * S.f * sc, fc('fric'), S.slips ? 'fk' : 'fs');
        dot(ctx, cxB, cyB, 4, col('--text'));
        text(ctx, S.slips ? 'Slipping!' : 'Holding still', w - 14, 18, { align: 'right', weight: 700, color: S.slips ? col('--bad') : col('--good') });
      }
      const st = stage(cv, 0.55, draw);
      const upd = () => {
        s0.th = Number(q('th').value); s0.mu = Number(q('mu').value);
        q('thv').textContent = `${s0.th}°`; q('muv').textContent = s0.mu.toFixed(2);
        const S = state();
        ro.innerHTML = `<span>mg sinθ = <b>${N1(S.par)} N</b></span><span>F<sub>N</sub> = mg cosθ = <b>${N1(S.N)} N</b></span><span>max static friction μ<sub>s</sub>F<sub>N</sub> = <b>${N1(S.fmax)} N</b></span>` +
          `<span>tanθ = <b>${N1(Math.tan(S.th))}</b> ${S.slips ? '>' : '≤'} μ<sub>s</sub> → ${S.slips ? `<b>slides</b>, a = ${N1(S.a)} m/s²` : '<b>stays put</b>'}</span>`;
        if (!S.slips) { pos = 0.5; vel = 0; }
        st.request();
      };
      bind(q, ['th', 'mu'], upd);
      upd();
      const stop = loop((dt) => {
        const S = state();
        if (!S.slips) return;
        vel += S.a * dt * 0.25; pos += vel * dt * 0.25;
        if (pos > 0.85) { pos = 0.15; vel = 0; }
        st.draw();
      });
      return () => { stop(); st.destroy(); cleanElevator(); };
    },
  });

  // =====================================================================
  // 8. Friction
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 8, id: 'p1u2-friction', title: 'Static and kinetic friction',
    render(el) {
      el.innerHTML = `
<p class="lead">Friction is why a crate needs a hard shove to get going but then slides more easily, why you can walk without slipping, and why cars can turn corners. It comes in two flavors, and the difference between them matters on almost every exam.</p>

<h2>Where friction comes from</h2>
<p>Even polished surfaces are rough at the microscopic level. Where the tiny high points touch, the atoms of the two surfaces stick together a little and the bumps snag on each other. Pressing the surfaces together harder squashes more contact points together, which is why friction depends on the normal force. The friction force always acts <b>parallel</b> to the surface.</p>

<h2>Static friction: as much as needed, up to a limit</h2>
<p>When surfaces aren't sliding relative to each other, <b>static friction</b> adjusts itself to whatever is needed to prevent sliding — just like the normal force adjusts to prevent sinking. Push a heavy crate with 10 N and static friction pushes back with 10 N; push with 30 N and it pushes back with 30 N. But only up to a maximum:</p>
${eq('\\[ f_s \\le \\mu_s F_N \\]', 'where \\(f_s\\) = static friction force (N); \\(\\mu_s\\) = coefficient of static friction (no units; depends on the two materials, typically 0.1 to 1); \\(F_N\\) = normal force between the surfaces (N). The "≤" is the whole point: \\(\\mu_s F_N\\) is the <b>maximum</b>, not the value.')}

<h2>Kinetic friction: a steady drag while sliding</h2>
<p>Once the surfaces slide, the contact points don't have time to stick as well, and friction drops to a roughly constant value:</p>
${eq('\\[ f_k = \\mu_k F_N \\]', 'where \\(f_k\\) = kinetic friction force (N), directed opposite to the sliding; \\(\\mu_k\\) = coefficient of kinetic friction (no units), usually smaller than \\(\\mu_s\\); \\(F_N\\) = normal force (N). To a good approximation \\(f_k\\) doesn\'t depend on speed or on how much area is in contact.')}

<div class="sim" data-sim="crate">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Your push <input type="range" data-k="F" min="0" max="120" step="1" value="0"> <span data-k="Fv"></span></label>
    <label>Mass <input type="range" data-k="m" min="5" max="12" step="1" value="10"> <span data-k="mv"></span></label>
    <label>μ<sub>s</sub> <input type="range" data-k="ms" min="0.2" max="0.9" step="0.05" value="0.6"> <span data-k="msv"></span></label>
    <label>μ<sub>k</sub> <input type="range" data-k="mk" min="0.1" max="0.8" step="0.05" value="0.35"> <span data-k="mkv"></span></label>
    <button class="btn small" data-k="stop">Stop the crate</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Slowly drag "Your push" to the right. The dot on the graph shows the friction force right now. It rises along the diagonal (static friction = your push) until it hits \\(\\mu_s F_N\\); then the crate breaks free and friction drops to \\(\\mu_k F_N\\). Now ease the push back down: the crate keeps sliding (and speeds up) as long as your push beats \\(\\mu_k F_N\\).</div>
</div>

<h2>Which way does friction point?</h2>
<p>Friction opposes <b>sliding between the two surfaces</b> (or the tendency to slide) — not necessarily the object's motion. When you walk, your foot pushes backward on the ground; static friction from the ground pushes your foot <b>forward</b>, and that's what moves you. A box on the bed of an accelerating truck is carried forward by static friction pointing forward.</p>

<h2>Friction on a ramp</h2>
<p>On an incline, \\(F_N = mg\\cos\\theta\\), so the maximum static friction is \\(\\mu_s mg\\cos\\theta\\). The block stays put while \\(mg\\sin\\theta \\le \\mu_s mg\\cos\\theta\\), giving the critical angle \\(\\tan\\theta_c = \\mu_s\\). If a block slides down at <b>constant velocity</b>, it's in equilibrium, so \\(\\mu_k = \\tan\\theta\\). (Play with this in the incline sim from the previous lesson.)</p>

${call('analogy', 'Analogy: two hairbrushes', 'Press two hairbrushes bristle-to-bristle and try to slide them. At first they lock together (static); once they get going, the bristles skip over each other and it\'s easier to keep them moving (kinetic). Press them together harder and both get harder.')}
${call('mistake', 'Common mistakes', '<ul><li>Writing \\(f_s = \\mu_s F_N\\) for an object at rest. That\'s only the maximum. If the push is smaller, static friction is smaller.</li><li>"Friction always opposes motion." It opposes <i>relative sliding</i>; it can be what makes things move (walking, car tires).</li><li>Using \\(F_N = mg\\) when someone pushes down at an angle or the floor is tilted.</li></ul>')}
${call('ap', 'On the AP exam', 'Know the friction-vs-applied-force graph: a 45° line through the origin (static), a peak at \\(\\mu_s F_N\\), then a flat lower line at \\(\\mu_k F_N\\). Constant-velocity setups let you find \\(\\mu_k\\) from balanced forces. And always ask first: is it sliding? That decides static or kinetic.')}
${check('A 10 kg crate rests on a floor with μ<sub>s</sub> = 0.5 and μ<sub>k</sub> = 0.3. You push horizontally with 30 N. The friction force is…', ['30 N', '49 N', '29.4 N', '0 N'], 0, 'Max static friction is \\(0.5 \\times 98 = 49\\) N. Your 30 N push is less than that, so the crate doesn\'t move, and static friction just matches you: 30 N.')}
${check('Same crate, but now you push with 60 N. The friction force is…', ['60 N', '49 N', '29.4 N', '30.6 N'], 2, '60 N beats the 49 N maximum, so the crate slides and friction becomes kinetic: \\(0.3 \\times 98 = 29.4\\) N. (The crate then accelerates at \\((60 - 29.4)/10 \\approx 3.1\\) m/s².)')}
`;
      const { cv, ro, q } = sim(el, 'crate');
      const s0 = { F: 0, m: 10, ms: 0.6, mk: 0.35 };
      let v = 0, x = 0;
      const FMAX = 120;
      function fNow() {
        const N = s0.m * G;
        if (v > 0) return s0.mk * N;
        return Math.min(s0.F, s0.ms * N);
      }
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const N = s0.m * G, fs = s0.ms * N, fk = s0.mk * N;
        // scene
        const fy = h * 0.36, cw = 80, chh = 50, cx = w * 0.42;
        floor(ctx, 10, w - 10, fy, x * 60);
        crate(ctx, cx - cw / 2, fy - chh, cw, chh, `${s0.m} kg`);
        const sc = 0.9;
        if (s0.F > 0) force(ctx, cx - cw / 2 - 6 - s0.F * sc, fy - chh / 2, s0.F * sc, 0, fc('push'), '');
        if (s0.F > 0) text(ctx, 'push', cx - cw / 2 - 20 - s0.F * sc / 2, fy - chh / 2 - 14, { color: fc('push'), weight: 700, size: 12 });
        const f = fNow();
        if (f > 0.1) force(ctx, cx, fy - 2, -f * sc, 0, fc('fric'), v > 0 ? 'fk' : 'fs');
        text(ctx, v > 0 ? `sliding · v = ${v.toFixed(1)} m/s` : 'at rest', cx, 16, { weight: 700, color: v > 0 ? col('--bad') : col('--good') });
        // graph: friction vs applied force
        const box = { x: 48, y: h * 0.5, w: w - 70, h: h * 0.42 };
        const ax = axes(ctx, box, { xMax: FMAX, yMin: 0, yMax: FMAX * 0.95, xLabel: 'your push (N) →', yLabel: 'friction (N)' });
        [0, 40, 80, 120].forEach((t) => text(ctx, `${t}`, ax.X(t), box.y + box.h + 10, { color: col('--muted'), size: 10 }));
        ctx.strokeStyle = fc('fric'); ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(ax.X(0), ax.Y(0)); ctx.lineTo(ax.X(Math.min(fs, FMAX)), ax.Y(Math.min(fs, FMAX))); ctx.stroke();
        if (fs < FMAX) {
          dashed(ctx, ax.X(fs), ax.Y(fs), ax.X(fs), ax.Y(fk), fc('fric'), 1.5);
          ctx.strokeStyle = fc('fric'); ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(ax.X(fs), ax.Y(fk)); ctx.lineTo(ax.X(FMAX), ax.Y(fk)); ctx.stroke();
          text(ctx, `μsFN = ${N1(fs)} N`, ax.X(fs) + 6, ax.Y(fs) - 4, { align: 'left', color: fc('fric'), size: 11, weight: 600 });
        }
        dashed(ctx, ax.X(fk), ax.Y(fk), ax.X(fs), ax.Y(fk), rgba(col('--bad'), 0.5), 1.2);
        text(ctx, `μkFN = ${N1(fk)} N`, ax.X(FMAX) - 4, ax.Y(fk) + 12, { align: 'right', color: fc('fric'), size: 11, weight: 600 });
        dot(ctx, ax.X(s0.F), ax.Y(f), 6, col('--accent'));
      }
      const st = stage(cv, 0.75, draw);
      function readout() {
        const N = s0.m * G, f = fNow();
        const a = v > 0 ? (s0.F - f) / s0.m : 0;
        ro.innerHTML = `<span>F<sub>N</sub> = mg = <b>${N1(N)} N</b></span><span>friction now = <b>${N1(f)} N</b> (${v > 0 ? 'kinetic' : 'static'})</span>` +
          `<span>net force = <b>${N1(v > 0 ? s0.F - f : 0)} N</b></span><span>a = <b>${N1(a)} m/s²</b></span>`;
        q('Fv').textContent = `${s0.F} N`; q('mv').textContent = `${s0.m} kg`; q('msv').textContent = s0.ms.toFixed(2); q('mkv').textContent = s0.mk.toFixed(2);
      }
      bind(q, ['F', 'm', 'ms', 'mk'], () => {
        s0.F = Number(q('F').value); s0.m = Number(q('m').value); s0.ms = Number(q('ms').value); s0.mk = Number(q('mk').value);
        if (s0.mk > s0.ms) { s0.mk = s0.ms; q('mk').value = s0.mk; }
        readout(); st.request();
      });
      q('stop').onclick = () => { v = 0; q('F').value = 0; s0.F = 0; readout(); st.request(); };
      readout();
      st.draw();
      const stop = loop((dt) => {
        const N = s0.m * G;
        if (v === 0) {
          if (s0.F > s0.ms * N) v = 1e-6;
          else { st.draw(); return; }
        }
        const a = (s0.F - s0.mk * N) / s0.m;
        v = Math.min(12, v + a * dt);
        if (v <= 0) v = 0;
        x += v * dt;
        readout(); st.draw();
      });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 9. Springs and Hooke's law
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 9, id: 'p1u2-springs', title: "Spring forces and Hooke's law",
    render(el) {
      el.innerHTML = `
<p class="lead">Stretch a spring and it pulls back. Squeeze it and it pushes out. The more you deform it, the harder it fights — in direct proportion. That simple rule describes springs, bungee cords, car suspensions, and (approximately) almost anything that bends a little and springs back.</p>

<h2>Hooke's law</h2>
${eq('\\[ \\vec F_s = -k\\,\\Delta\\vec x \\qquad\\text{magnitude: } F_s = k\\,|\\Delta x| \\]', 'where \\(F_s\\) = force the spring exerts on whatever is attached to its end (N); \\(k\\) = the <b>spring constant</b>, the spring\'s stiffness (N/m); \\(\\Delta x\\) = how far the spring is stretched or compressed <b>from its natural (relaxed) length</b> (m). The minus sign says the force points back toward the natural length — a <b>restoring force</b>.')}
<p>A spring with \\(k = 200\\) N/m needs 200 N to stretch it 1 m, or 2 N to stretch it 1 cm. A stiff car spring might be \\(k \\approx 50{,}000\\) N/m; a Slinky is under 1 N/m.</p>

<h2>The force–stretch graph</h2>
<p>Plot \\(F_s\\) against \\(\\Delta x\\) and you get a straight line through the origin. Its <b>slope is k</b>. (In Unit 3, the <i>area</i> under that line will turn out to be the energy stored in the spring.) Real springs follow this line only up to their elastic limit; stretch too far and they deform permanently.</p>

<h2>A hanging mass</h2>
<p>Hang a mass on a spring and it settles where the spring's pull balances the weight:</p>
${eq('\\[ k\\,\\Delta x = mg \\quad\\Longrightarrow\\quad \\Delta x = \\frac{mg}{k} \\]', 'where \\(\\Delta x\\) = stretch at equilibrium (m); \\(m\\) = hanging mass (kg); \\(g = 9.8\\) m/s²; \\(k\\) = spring constant (N/m). This is how you measure k in the lab: hang known masses, measure stretches, and take the slope of mg vs Δx.')}

<div class="sim" data-sim="spring">
  <canvas></canvas>
  <div class="sim-controls">
    <label>k <input type="range" data-k="k" min="20" max="200" step="5" value="60"> <span data-k="kv"></span></label>
    <label>Mass <input type="range" data-k="m" min="0.1" max="1" step="0.05" value="0.5"> <span data-k="mv"></span></label>
    <label>Springs <select data-k="mode"><option value="one">One spring</option><option value="series">Two in series</option><option value="parallel">Two in parallel</option></select></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Drag the mass up or down and let go. Above the dashed equilibrium line the spring force (blue) is smaller than the weight (orange); below it, larger — so the mass is always pushed back toward equilibrium and bobs around it. The dot on the graph tracks the spring force against the stretch; the line's slope is the effective k.</div>
</div>

<h2>Springs in series and in parallel</h2>
<p><b>Parallel</b> (side by side, sharing the load): both stretch the same amount, and their forces add, so the combination is stiffer. <b>Series</b> (end to end): the same force passes through each spring, and their stretches add, so the combination is softer.</p>
${eq('\\[ k_{\\text{parallel}} = k_1 + k_2, \\qquad \\frac{1}{k_{\\text{series}}} = \\frac{1}{k_1} + \\frac{1}{k_2} \\]', 'where \\(k_1, k_2\\) = constants of the individual springs (N/m); \\(k_{\\text{parallel}}, k_{\\text{series}}\\) = the effective spring constant of the combination (N/m). Two identical springs: parallel gives \\(2k\\), series gives \\(k/2\\). (Careful: this is the reverse of the rule for resistors in Physics 2.)')}

<h2>Ideal springs and strings</h2>
<p>In Physics 1, springs and strings are usually <b>ideal</b>: massless. A massless spring or string transmits the same force all along its length, so the tension (or spring force) is the same at both ends. That's what lets us say "the tension in the rope" as if it were one number.</p>

${call('analogy', 'Analogy: helpers sharing a load', 'Two people lifting a couch side by side (parallel) each carry half, so the couch hardly sags. Two springs hooked end to end (series) is like stacking two mattresses: each squashes under the full load, so the total squash doubles.')}
${call('mistake', 'Common mistakes', '<ul><li>Using the spring\'s total length for Δx. It\'s the change from the natural length.</li><li>Thinking series springs are stiffer. Each one feels the full force, so each stretches the full amount: softer.</li><li>Forgetting the direction: a compressed spring pushes, a stretched one pulls, always toward natural length.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect a lab-style question: given mass and stretch data, plot force (mg) vs stretch and use the slope to find k. Also compare equilibrium stretches for different spring combinations, and identify the spring force on FBDs with the right direction.')}
${check('A spring stretches 4 cm when a 2 N weight hangs from it. How far does it stretch with a 5 N weight?', ['8 cm', '10 cm', '12.5 cm', '20 cm'], 1, 'k = 2 N / 0.04 m = 50 N/m. Then Δx = 5/50 = 0.10 m = 10 cm. (Or by proportion: 2.5 times the force, 2.5 times the stretch.)')}
${check('Two identical springs, each with constant k, are connected end to end (in series). The effective spring constant is…', ['k/2', 'k', '2k', '4k'], 0, '\\(1/k_{\\text{eff}} = 1/k + 1/k = 2/k\\), so \\(k_{\\text{eff}} = k/2\\). The same force stretches each spring fully, so the total stretch doubles.')}
${check('A mass hanging from one spring stretches it by d. The same mass hangs from two of those springs in parallel. The stretch is…', ['d/4', 'd/2', 'd', '2d'], 1, 'Parallel: \\(k_{\\text{eff}} = 2k\\), so \\(\\Delta x = mg/(2k) = d/2\\). Each spring carries half the weight.')}
`;
      const { cv, ro, q } = sim(el, 'spring');
      const s0 = { k: 60, m: 0.5, mode: 'one' };
      const L0 = 0.3, XMAX = 1.2;
      let x = 0, v = 0, dragging = false, geo = null;
      const kEff = () => (s0.mode === 'series' ? s0.k / 2 : s0.mode === 'parallel' ? s0.k * 2 : s0.k);
      const xEq = () => (s0.m * G) / kEff();
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const left = w * 0.3, top = 20;
        const sc = (h - top - 50) / (L0 + XMAX);
        geo = { left, top, sc };
        ctx.fillStyle = col('--border'); ctx.fillRect(left - 60, top - 12, 120, 12);
        const yM = top + (L0 + x) * sc;
        const bs = 24 + 26 * Math.sqrt(s0.m);
        const sColor = col('--accent');
        if (s0.mode === 'parallel') {
          spring(ctx, left - 18, top, left - 18, yM, 10, 7, sColor);
          spring(ctx, left + 18, top, left + 18, yM, 10, 7, sColor);
          ctx.fillStyle = col('--text'); ctx.fillRect(left - 26, yM - 2, 52, 4);
        } else if (s0.mode === 'series') {
          const mid = (top + yM) / 2;
          spring(ctx, left, top, left, mid, 8, 8, sColor);
          dot(ctx, left, mid, 4, col('--text'));
          spring(ctx, left, mid, left, yM, 8, 8, sColor);
        } else spring(ctx, left, top, left, yM, 14, 9, sColor);
        crate(ctx, left - bs / 2, yM, bs, bs * 0.8, `${s0.m} kg`, { size: 11 });
        // equilibrium + natural length markers
        const yEq = top + (L0 + xEq()) * sc + bs * 0.4;
        dashed(ctx, left - 90, yEq, left + 90, yEq, col('--muted'));
        text(ctx, 'equilibrium', left - 92, yEq - 8, { align: 'left', color: col('--muted'), size: 10 });
        dashed(ctx, left + 46, top + L0 * sc, left + 90, top + L0 * sc, col('--border'));
        text(ctx, 'natural length', left + 92, top + L0 * sc, { align: 'left', color: col('--muted'), size: 10 });
        // forces on the mass
        const cy = yM + bs * 0.4, fsc = (h * 0.12) / (s0.m * G);
        const Fs = kEff() * x, W = s0.m * G;
        force(ctx, left + bs / 2 + 18, cy, 0, -clamp(Fs, -2.5 * W, 2.5 * W) * fsc, fc('spring'), 'Fs');
        force(ctx, left - bs / 2 - 18, cy, 0, W * fsc, fc('grav'), 'mg');
        // F–x graph
        const box = { x: w * 0.58, y: 30, w: w * 0.38, h: h * 0.62 };
        const FM = 200 * XMAX * 0.6;
        const ax = axes(ctx, box, { xMax: XMAX, yMin: 0, yMax: FM, xLabel: 'stretch Δx (m) →', yLabel: 'F_s (N)' });
        [0.4, 0.8, 1.2].forEach((t) => text(ctx, `${t}`, ax.X(t), box.y + box.h + 10, { color: col('--muted'), size: 10 }));
        plot(ctx, ax, (t) => Math.min(FM, kEff() * t), XMAX, col('--accent'), 2, 2);
        dashed(ctx, box.x, ax.Y(W), box.x + box.w, ax.Y(W), fc('grav'), 1.2);
        text(ctx, 'mg', box.x + box.w - 4, ax.Y(W) - 8, { align: 'right', color: fc('grav'), size: 11, weight: 700 });
        if (x >= 0) dot(ctx, ax.X(x), ax.Y(Math.min(FM, Fs)), 5, col('--text'));
        text(ctx, `slope = k_eff = ${kEff()} N/m`, box.x, box.y + box.h + 28, { align: 'left', color: col('--accent'), size: 11, weight: 600 });
      }
      const st = stage(cv, 0.62, draw);
      function readout() {
        const Fs = kEff() * x, W = s0.m * G;
        ro.innerHTML = `<span>k<sub>eff</sub> = <b>${kEff()} N/m</b></span><span>stretch Δx = <b>${x.toFixed(3)} m</b></span><span>F<sub>s</sub> = kΔx = <b>${N1(Fs)} N</b></span>` +
          `<span>mg = <b>${N1(W)} N</b></span><span>equilibrium stretch mg/k = <b>${xEq().toFixed(3)} m</b></span>`;
        q('kv').textContent = `${s0.k} N/m`; q('mv').textContent = `${s0.m} kg`;
      }
      bind(q, ['k', 'm', 'mode'], () => { s0.k = Number(q('k').value); s0.m = Number(q('m').value); s0.mode = q('mode').value; x = xEq(); v = 0; readout(); st.request(); });
      drag(cv,
        (px, py) => {
          if (!geo) return null;
          const yM = geo.top + (L0 + x) * geo.sc, bs = 24 + 26 * Math.sqrt(s0.m);
          return Math.abs(px - geo.left) < bs / 2 + 12 && py > yM - 10 && py < yM + bs ? 'm' : null;
        },
        (it, px, py) => { dragging = true; x = clamp((py - geo.top - 10) / geo.sc - L0, -0.2, XMAX); v = 0; readout(); st.request(); },
        () => { dragging = false; });
      x = xEq();
      readout();
      st.draw();
      const stop = loop((dt) => {
        if (dragging) return;
        const k = kEff(), c = 0.12 * 2 * Math.sqrt(k * s0.m);
        const n = 8;
        let moved = false;
        for (let i = 0; i < n; i++) {
          const d = dt / n;
          const a = G - (k * x) / s0.m - (c * v) / s0.m;
          v += a * d; x += v * d;
          if (x > XMAX) { x = XMAX; v = 0; }
          if (x < -0.25) { x = -0.25; v = 0; }
        }
        moved = Math.abs(v) > 1e-4 || Math.abs(x - xEq()) > 1e-4;
        if (moved) { readout(); st.draw(); }
      });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 10. Connected objects
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 10, id: 'p1u2-connected', title: 'Connected objects: tension, pulleys, and Atwood machines',
    render(el) {
      el.innerHTML = `
<p class="lead">Real problems often have several objects tied together, stacked, or pushing on each other. The physics is still just ΣF = ma — the skill is choosing which system to apply it to. Pick the whole group and the connecting forces vanish; pick one object and you can find them.</p>

<h2>Ideal strings and pulleys</h2>
<ul>
<li>An <b>ideal string</b> is massless and doesn't stretch. Its tension \\(F_T\\) is the same everywhere along it, and objects tied by it move with the <b>same speed and same size of acceleration</b>.</li>
<li>An <b>ideal pulley</b> is massless and frictionless. It only changes the direction of the string; the tension is the same on both sides.</li>
</ul>

<h2>Two ways to look at the same problem</h2>
<p><b>1. The whole system.</b> Treat all the connected objects as one system. Tension is now internal and cancels out, so you need only the external forces along the direction of motion:</p>
${eq('\\[ a = \\frac{\\text{(external forces driving the motion)} - \\text{(external forces resisting it)}}{m_1 + m_2} \\]', 'where \\(a\\) = the shared magnitude of acceleration (m/s²); \\(m_1 + m_2\\) = total mass being accelerated (kg). For strings over pulleys, "along the motion" bends around the pulley: think of the string as a straight track.')}
<p><b>2. One object at a time.</b> Draw a separate FBD for each object, write ΣF = ma for each, and solve the equations together. This route gives you the tension.</p>

<h2>The Atwood machine and the modified Atwood</h2>
<p><b>Atwood machine:</b> two masses hang on either side of a pulley. The heavier one (\\(m_2\\)) drives the motion and the lighter one resists. <b>Modified Atwood:</b> one block \\(m_1\\) on a table, connected over a pulley at the edge to a hanging block \\(m_2\\). Here the hanging weight drives the motion and friction on the table block resists.</p>
${eq('\\[ \\text{Atwood: } a = \\frac{(m_2 - m_1)g}{m_1 + m_2}, \\quad F_T = \\frac{2m_1m_2g}{m_1+m_2} \\qquad \\text{Table: } a = \\frac{(m_2 - \\mu_k m_1)g}{m_1 + m_2}, \\quad F_T = m_1(a + \\mu_k g) \\]', 'where \\(m_1, m_2\\) = the two masses (kg) (\\(m_2\\) hangs and drives the motion); \\(\\mu_k\\) = coefficient of kinetic friction between \\(m_1\\) and the table; \\(F_T\\) = string tension (N); \\(g = 9.8\\) m/s².')}

<div class="sim" data-sim="atwood">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Setup <select data-k="mode"><option value="table">Block on table</option><option value="atwood">Atwood (both hang)</option></select></label>
    <label>m₁ <input type="range" data-k="m1" min="1" max="10" step="0.5" value="4"> <span data-k="m1v"></span></label>
    <label>m₂ <input type="range" data-k="m2" min="1" max="10" step="0.5" value="2"> <span data-k="m2v"></span></label>
    <label data-k="mulab">μ<sub>k</sub> <input type="range" data-k="mu" min="0" max="0.6" step="0.05" value="0.2"> <span data-k="muv"></span></label>
    <button class="btn small primary" data-k="go">Release ▸</button>
    <button class="btn small" data-k="reset">Reset</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Black arrows are the tension (the same on both blocks), orange the weights. Notice the tension is always between the two weights in the Atwood machine, and always less than m₂g whenever m₂ accelerates downward. (Table setup: if the hanging weight can't beat friction, we assume nothing moves.)</div>
</div>

<h2>Why the tension isn't simply \\(m_2 g\\)</h2>
<p>If the string pulled up on the hanging block with exactly \\(m_2 g\\), the forces on that block would balance and it couldn't accelerate. Since it does accelerate downward, the tension must be <b>less</b> than its weight: \\(m_2 g - F_T = m_2 a\\).</p>

<h2>Blocks pushing blocks</h2>
<p>Push block 1 (mass \\(m_1\\)) which pushes block 2 (\\(m_2\\)) on a frictionless floor with force \\(F\\). Whole system: \\(a = F/(m_1+m_2)\\). The only horizontal force on block 2 is block 1's contact push, so that push is \\(m_2 a = \\frac{m_2}{m_1+m_2}F\\) — only part of your \\(F\\).</p>

${call('analogy', 'Analogy: a train', 'An engine pulls a line of cars. The coupling right behind the engine has to accelerate every car behind it, so it has the most tension. The last coupling only accelerates the last car, so it has the least.')}
${call('mistake', 'Common mistakes', '<ul><li>Setting the tension equal to the hanging weight. That\'s only true if nothing accelerates.</li><li>Forgetting the system\'s total mass: the hanging weight has to accelerate <i>both</i> blocks.</li><li>Including tension when you\'ve chosen the whole system. It\'s internal there.</li></ul>')}
${call('ap', 'On the AP exam', 'Atwood setups are AP favorites, often as experiments: graph a against \\(m_2\\) (or against the hanging weight) and interpret the slope or intercept. Contact-force questions ask which block pushes on which harder; and justifications should say which system you chose and why tension is internal or external.')}
${check('An Atwood machine has 3 kg and 5 kg masses. The acceleration is about…', ['2.45 m/s²', '4.9 m/s²', '9.8 m/s²', '1.96 m/s²'], 0, 'Whole system: driving force (5 − 3)(9.8) = 19.6 N, total mass 8 kg, so a = 19.6/8 = 2.45 m/s².')}
${check('A block on a frictionless table is pulled by a string over a pulley by a hanging block of mass m₂. The tension in the string is…', ['less than m₂g', 'equal to m₂g', 'greater than m₂g', 'zero'], 0, 'The hanging block accelerates downward, so its weight must beat the tension: \\(F_T = m_2(g - a) < m_2 g\\).')}
${check('You push a 2 kg block that pushes a 3 kg block, with a 10 N force on a frictionless floor. How hard does the 2 kg block push on the 3 kg block?', ['4 N', '6 N', '10 N', '2 N'], 1, 'a = 10/5 = 2 m/s². The 3 kg block\'s only horizontal force is the contact push: 3 × 2 = 6 N.')}
`;
      const { cv, ro, q } = sim(el, 'atwood');
      const s0 = { mode: 'table', m1: 4, m2: 2, mu: 0.2 };
      let t = -1;
      function solve() {
        if (s0.mode === 'atwood') {
          const a = ((s0.m2 - s0.m1) * G) / (s0.m1 + s0.m2);
          return { a, T: (2 * s0.m1 * s0.m2 * G) / (s0.m1 + s0.m2), stuck: false };
        }
        if (s0.m2 <= s0.mu * s0.m1) return { a: 0, T: s0.m2 * G, stuck: true };
        const a = ((s0.m2 - s0.mu * s0.m1) * G) / (s0.m1 + s0.m2);
        return { a, T: s0.m1 * (a + s0.mu * G), stuck: false };
      }
      const blockSize = (m) => 26 + 6 * Math.sqrt(m);
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const S = solve();
        const tt = Math.max(0, t);
        const sc = h * 0.5; // px per meter
        let d = 0.5 * S.a * tt * tt * sc; // displacement in px (positive = m2 goes down)
        const fsc = 60 / (Math.max(s0.m1, s0.m2) * G);
        if (s0.mode === 'table') {
          const ty = h * 0.42, px = w * 0.64, pr = 14;
          const b1 = blockSize(s0.m1), b2 = blockSize(s0.m2);
          const lim = Math.min(px - pr - w * 0.08 - b1 - 10, h - (ty + 60) - b2 - 10);
          d = clamp(d, 0, Math.max(0, lim));
          ctx.fillStyle = rgba(col('--muted'), 0.2); ctx.fillRect(10, ty, px - 10, h - ty - 6);
          ctx.strokeStyle = col('--text'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, ty); ctx.lineTo(px, ty); ctx.stroke();
          ctx.beginPath(); ctx.arc(px, ty - pr, pr, 0, Math.PI * 2); ctx.stroke(); dot(ctx, px, ty - pr, 3, col('--text'));
          const x1 = w * 0.08 + d;
          crate(ctx, x1, ty - b1, b1, b1, `m₁ ${s0.m1}`, { size: 11, fill: rgba(col('--accent'), 0.2) });
          const hx = px + pr, y2 = ty + 30 + d;
          ctx.strokeStyle = col('--text'); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x1 + b1, ty - 2 * pr); ctx.lineTo(px, ty - 2 * pr); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(hx, ty - pr); ctx.lineTo(hx, y2); ctx.stroke();
          crate(ctx, hx - b2 / 2, y2, b2, b2, `m₂ ${s0.m2}`, { size: 11 });
          // forces
          force(ctx, x1 + b1 / 2, ty - b1 / 2, S.T * fsc, 0, col('--text'), 'FT');
          if (s0.mu > 0) force(ctx, x1 + b1 / 2, ty - 4, -(S.stuck ? S.T : s0.mu * s0.m1 * G) * fsc, 0, fc('fric'), 'f');
          force(ctx, hx - b2 / 2 - 14, y2 + b2 / 2, 0, -S.T * fsc, col('--text'), 'FT');
          force(ctx, hx + b2 / 2 + 14, y2 + b2 / 2, 0, s0.m2 * G * fsc, fc('grav'), 'm₂g');
        } else {
          const cx = w * 0.42, py = h * 0.14, pr = 28;
          const b1 = blockSize(s0.m1), b2 = blockSize(s0.m2);
          const lim = h * 0.3;
          d = clamp(d, -lim, lim);
          ctx.fillStyle = col('--border'); ctx.fillRect(cx - 50, 4, 100, 8);
          ctx.strokeStyle = col('--text'); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx, 12); ctx.lineTo(cx, py); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, py, pr, 0, Math.PI * 2); ctx.stroke(); dot(ctx, cx, py, 3, col('--text'));
          const y1 = h * 0.5 - d, y2 = h * 0.5 + d;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(cx - pr, py); ctx.lineTo(cx - pr, y1); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + pr, py); ctx.lineTo(cx + pr, y2); ctx.stroke();
          crate(ctx, cx - pr - b1 / 2, y1, b1, b1, `m₁ ${s0.m1}`, { size: 11, fill: rgba(col('--accent'), 0.2) });
          crate(ctx, cx + pr - b2 / 2, y2, b2, b2, `m₂ ${s0.m2}`, { size: 11 });
          const fx1 = cx - pr - b1 / 2 - 16, fx2 = cx + pr + b2 / 2 + 16;
          force(ctx, fx1, y1 + b1 / 2, 0, -S.T * fsc, col('--text'), 'FT');
          force(ctx, fx1 - 18, y1 + b1 / 2, 0, s0.m1 * G * fsc, fc('grav'), 'm₁g');
          force(ctx, fx2, y2 + b2 / 2, 0, -S.T * fsc, col('--text'), 'FT');
          force(ctx, fx2 + 18, y2 + b2 / 2, 0, s0.m2 * G * fsc, fc('grav'), 'm₂g');
        }
      }
      const st = stage(cv, 0.62, draw);
      function readout() {
        const S = solve();
        const dir = s0.mode === 'atwood' ? (S.a > 0 ? 'm₂ goes down' : S.a < 0 ? 'm₁ goes down' : 'balanced: no acceleration') : S.stuck ? 'hanging weight can\'t beat friction: stays put' : 'm₂ goes down, m₁ slides right';
        ro.innerHTML = `<span>a = <b>${N1(Math.abs(S.a))} m/s²</b></span><span>F<sub>T</sub> = <b>${N1(S.T)} N</b></span><span>m₂g = <b>${N1(s0.m2 * G)} N</b></span><span>${dir}</span>`;
        q('m1v').textContent = `${s0.m1} kg`; q('m2v').textContent = `${s0.m2} kg`; q('muv').textContent = s0.mu.toFixed(2);
        q('mulab').style.display = s0.mode === 'table' ? '' : 'none';
      }
      bind(q, ['mode', 'm1', 'm2', 'mu'], () => {
        s0.mode = q('mode').value; s0.m1 = Number(q('m1').value); s0.m2 = Number(q('m2').value); s0.mu = Number(q('mu').value);
        t = -1; readout(); st.request();
      });
      q('go').onclick = () => { t = 0; };
      q('reset').onclick = () => { t = -1; st.request(); };
      readout();
      st.draw();
      const stop = loop((dt) => { if (t < 0) return; t += dt * 0.6; if (t > 4) t = 4; st.draw(); });
      return () => { stop(); st.destroy(); };
    },
  });

  // =====================================================================
  // 11. Circular motion
  // =====================================================================
  LESSONS.push({
    unit: 12, order: 11, id: 'p1u2-circular', title: 'Circular motion: centripetal acceleration and force',
    render(el) {
      el.innerHTML = `
<p class="lead">A car rounding a curve at a steady 50 km/h is accelerating. That sounds wrong until you remember that velocity has a direction, and in a circle the direction never stops changing. Changing velocity means acceleration, and acceleration needs a net force.</p>

<h2>Why steady speed in a circle is acceleration</h2>
<p>Acceleration is the change in velocity per time. In uniform circular motion the speed is constant, but the velocity arrow keeps turning to stay tangent to the circle. Subtract the velocity a moment ago from the velocity now and the difference \\(\\Delta\\vec v\\) points <b>toward the center</b>. That inward acceleration is called <b>centripetal</b> ("center-seeking"):</p>
${eq('\\[ a_c = \\frac{v^2}{r}, \\qquad v = \\frac{2\\pi r}{T} \\]', 'where \\(a_c\\) = centripetal acceleration, pointing toward the center (m/s²); \\(v\\) = speed (m/s); \\(r\\) = radius of the circle (m); \\(T\\) = period, the time for one full revolution (s). Twice the speed means four times the acceleration; a tighter circle (smaller r) means more.')}

<h2>Centripetal force is a job, not a new force</h2>
<p>By the second law, an inward acceleration needs an inward <b>net force</b>:</p>
${eq('\\[ \\sum F_{\\text{toward center}} = m\\frac{v^2}{r} \\]', 'where \\(\\sum F_{\\text{toward center}}\\) = net force along the radius, counting inward as positive (N); \\(m\\) = mass (kg); \\(v\\) = speed (m/s); \\(r\\) = radius (m).')}
<p>"Centripetal force" is never a separate arrow on an FBD. It's a <i>role</i> that real forces fill: <b>tension</b> for a ball on a string, <b>static friction</b> for a car on a flat curve, <b>gravity</b> for the Moon, the <b>normal force</b> for a rider in a spinning drum.</p>

<div class="sim" data-sim="circle">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Speed <input type="range" data-k="v" min="1" max="10" step="0.5" value="4"> <span data-k="vv"></span></label>
    <label>Radius <input type="range" data-k="r" min="0.5" max="2" step="0.1" value="1.2"> <span data-k="rv"></span></label>
    <label>Mass <input type="range" data-k="m" min="0.1" max="1" step="0.05" value="0.3"> <span data-k="mv"></span></label>
    <button class="btn small primary" data-k="cut">Cut the string ✂</button>
    <button class="btn small" data-k="reset">Reset</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Top view of a ball whirled on a string on a frictionless table, shown at ¼ speed. Blue: velocity (always tangent). Red: the string's tension, the net force (always toward the center). Cut the string and the ball flies off in a straight line along its velocity at that instant — not outward.</div>
</div>

<h2>Cars on curves</h2>
<p>On a <b>flat</b> curve, static friction from the road provides the centripetal force (the tires aren't sliding sideways, so it's static). The fastest safe speed is when friction is at its maximum: \\(\\mu_s mg = mv^2/r\\), so \\(v_{max} = \\sqrt{\\mu_s g r}\\). Ice (small \\(\\mu_s\\)) means a much lower top speed.</p>
<p>On a <b>banked</b> curve, the tilted normal force leans toward the center and can supply the centripetal force even with no friction. The vertical part of \\(F_N\\) holds the car up and the horizontal part turns it: \\(\\tan\\theta = v^2/(rg)\\).</p>

<h2>Vertical loops</h2>
<p>At the <b>top</b> of a roller-coaster loop, both gravity and the track's normal force point down — toward the center: \\(F_N + mg = mv^2/r\\). The slowest the car can go and still stay on the track is when \\(F_N = 0\\), so gravity alone provides the centripetal force: \\(v_{min} = \\sqrt{gr}\\). At the <b>bottom</b>, the normal force points up (toward the center) and gravity down: \\(F_N - mg = mv^2/r\\), which is why you feel pressed into your seat.</p>

<h2>Orbits</h2>
<p>A satellite in a circular orbit has gravity as its only force, and gravity provides exactly the centripetal force needed:</p>
${eq('\\[ \\frac{GMm}{r^2} = \\frac{mv^2}{r} \\quad\\Longrightarrow\\quad v = \\sqrt{\\frac{GM}{r}} \\]', 'where \\(v\\) = orbital speed (m/s); \\(G = 6.67\\times10^{-11}\\) N·m²/kg²; \\(M\\) = mass of the planet being orbited (kg); \\(r\\) = orbit radius, measured from the planet\'s center (m); \\(m\\) = satellite mass (kg), which cancels: every object at the same r orbits at the same speed.')}
<p>Astronauts in orbit feel weightless because they and their spacecraft are falling together around Earth — exactly the elevator-in-free-fall situation, with \\(F_N = 0\\).</p>

${call('analogy', 'Analogy: the water bucket', 'Swing a bucket of water over your head fast enough and the water stays in, even upside down. At the top, gravity alone isn\'t enough to pull the water around a circle that fast, so the bucket bottom has to push down on it too. Swing too slowly and gravity is more than enough: the water falls out of the circle — onto you.')}
${call('mistake', 'Common mistakes', '<ul><li>Drawing a "centrifugal force" pointing outward. In an inertial frame there is no outward force; the feeling of being thrown outward is your inertia trying to go straight.</li><li>Drawing "\\(F_c\\)" as an extra arrow. Identify which real force (or combination) points to the center.</li><li>Thinking a released object flies straight out from the center. It flies along the tangent.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect to (1) identify which force provides the centripetal acceleration, (2) compare forces at the top and bottom of a vertical circle (normal force or tension is largest at the bottom), (3) use \\(v = \\sqrt{GM/r}\\) to reason that orbital speed doesn\'t depend on the satellite\'s mass and decreases for bigger orbits.')}
${check('A car takes the same curve at twice the speed. The net (centripetal) force needed is…', ['2 times as large', '4 times as large', 'half as large', 'the same'], 1, '\\(F = mv^2/r\\): doubling v multiplies \\(v^2\\) by 4.')}
${check('A ball whirled on a string in a horizontal circle (seen from above) is moving due east when the string breaks. Its path afterward is…', ['a straight line heading east', 'straight outward from the center', 'a continuing curve that slowly straightens', 'straight toward the center'], 0, 'With no horizontal force left, the first law takes over: the ball keeps the velocity it had at that instant, tangent to the circle — east.')}
${check('What is the minimum speed at the top of a roller-coaster loop of radius 10 m?', ['about 9.9 m/s', 'about 14 m/s', 'about 7 m/s', 'about 98 m/s'], 0, 'At minimum speed, \\(F_N = 0\\) and gravity supplies the centripetal force: \\(v = \\sqrt{gr} = \\sqrt{98} \\approx 9.9\\) m/s.')}
`;
      const { cv, ro, q } = sim(el, 'circle');
      const SLOW = 0.25;
      const s0 = { v: 4, r: 1.2, m: 0.3 };
      let phi = 0, cut = null, trail = [];
      function draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const cx = w * 0.5, cy = h * 0.5, sc = (Math.min(w, h) * 0.42) / 2;
        const R = s0.r * sc;
        ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = col('--border'); ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        dot(ctx, cx, cy, 5, col('--text'));
        let bx, by, ux, uy;
        if (!cut) {
          bx = cx + R * Math.cos(phi); by = cy - R * Math.sin(phi);
          ux = -Math.sin(phi); uy = -Math.cos(phi);
          ctx.strokeStyle = col('--text'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
        } else {
          bx = cut.x; by = cut.y; ux = cut.ux; uy = cut.uy;
          if (trail.length > 1) {
            ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = col('--muted'); ctx.lineWidth = 1.5;
            ctx.beginPath(); trail.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
          }
        }
        const vL = 12 + s0.v * 7;
        arrow(ctx, bx, by, bx + ux * vL, by + uy * vL, col('--accent'), 2.6, 10);
        text(ctx, 'v', bx + ux * (vL + 12), by + uy * (vL + 12), { color: col('--accent'), weight: 700 });
        if (!cut) {
          const ac = (s0.v * s0.v) / s0.r;
          const L = clamp(10 + ac * 0.9, 12, R - 8);
          const ix = (cx - bx) / R, iy = (cy - by) / R;
          arrow(ctx, bx, by, bx + ix * L, by + iy * L, col('--bad'), 2.6, 10);
          text(ctx, 'FT', bx + ix * (L + 12), by + iy * (L + 12), { color: col('--bad'), weight: 700 });
        }
        dot(ctx, bx, by, 8 + 8 * Math.sqrt(s0.m), col('--text'));
      }
      const st = stage(cv, 0.6, draw);
      function readout() {
        const ac = (s0.v * s0.v) / s0.r;
        ro.innerHTML = `<span>a<sub>c</sub> = v²/r = <b>${N1(ac)} m/s²</b></span><span>tension = mv²/r = <b>${N1(s0.m * ac)} N</b></span><span>period T = 2πr/v = <b>${N1((2 * Math.PI * s0.r) / s0.v)} s</b></span>` +
          (cut ? '<span><b>string cut</b>: no net force → straight line</span>' : '');
        q('vv').textContent = `${s0.v} m/s`; q('rv').textContent = `${s0.r.toFixed(1)} m`; q('mv').textContent = `${s0.m} kg`;
      }
      bind(q, ['v', 'r', 'm'], () => { s0.v = Number(q('v').value); s0.r = Number(q('r').value); s0.m = Number(q('m').value); readout(); });
      q('cut').onclick = () => {
        if (cut) return;
        const w = st.w, h = st.h, cx = w * 0.5, cy = h * 0.5, sc = (Math.min(w, h) * 0.42) / 2, R = s0.r * sc;
        cut = { x: cx + R * Math.cos(phi), y: cy - R * Math.sin(phi), ux: -Math.sin(phi), uy: -Math.cos(phi), sc, age: 0 };
        trail = [[cut.x, cut.y]];
        readout();
      };
      q('reset').onclick = () => { cut = null; trail = []; readout(); };
      readout();
      st.draw();
      const stop = loop((dt) => {
        if (!cut) phi += ((s0.v / s0.r) * dt * SLOW);
        else {
          cut.x += cut.ux * s0.v * cut.sc * dt * SLOW; cut.y += cut.uy * s0.v * cut.sc * dt * SLOW; cut.age += dt;
          trail.push([cut.x, cut.y]);
          if (cut.x < -40 || cut.x > st.w + 40 || cut.y < -40 || cut.y > st.h + 40 || cut.age > 12) { cut = null; trail = []; readout(); }
        }
        st.draw();
      });
      return () => { stop(); st.destroy(); };
    },
  });
})();
