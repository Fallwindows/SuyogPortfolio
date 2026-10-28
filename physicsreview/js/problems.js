// Problem bank for the AP Physics 2 duel (Unit 1 Electrostatics, Unit 2 DC Circuits).
// Deterministic: every random choice comes from PR.rng, so both players see identical problems for one seed.
window.PRProblems = (function () {
  const PR = window.PR;
  const sig = PR.sig, fmt = PR.fmt;

  // Constants (AP values)
  const K = 8.99e9, E0 = 8.85e-12, QE = 1.6e-19, ME = 9.11e-31, MP = 1.67e-27;

  // ---------- formatting helpers ----------
  const M = (s) => '\\(' + s + '\\)';
  const X = (x, n = 3) => M(fmt(x, n));
  const Q = (x, u, n = 3) => M(fmt(x, n) + '\\ ' + u);
  const B = (s) => '<b>' + s + '</b>';
  const rnd = (rng, lo, hi, n = 2) => sig(rng.range(lo, hi), n);
  const sgn = (rng) => (rng() < 0.5 ? -1 : 1);
  const giv = (...items) => items.join('<br>');
  const uC = '\\mu\\text{C}', nC = '\\text{nC}';
  const tx = (s) => '\\text{' + s + '}';

  const G = {
    k: M('k = 8.99 \\times 10^{9}\\ \\text{N}\\cdot\\text{m}^2/\\text{C}^2'),
    e0: M('\\varepsilon_0 = 8.85 \\times 10^{-12}\\ \\text{C}^2/(\\text{N}\\cdot\\text{m}^2)'),
    e: M('e = 1.6 \\times 10^{-19}\\ \\text{C}'),
    me: M('m_e = 9.11 \\times 10^{-31}\\ \\text{kg}'),
    mp: M('m_p = 1.67 \\times 10^{-27}\\ \\text{kg}'),
  };

  // Build a 4-option multiple choice: correct + first 3 unique distractors, shuffled with rng.
  function mc(rng, correct, wrongs) {
    const seen = new Set([correct]);
    const w = [];
    for (const s of wrongs) {
      if (w.length >= 3) break;
      if (!seen.has(s)) { seen.add(s); w.push(s); }
    }
    const opts = [correct].concat(w);
    const order = rng.shuffle(opts.map((_, i) => i));
    return { choices: order.map((i) => opts[i]), correct: order.indexOf(0) };
  }


  const gens = [];

  // ======================================================================
  // UNIT 1 — ELECTROSTATICS
  // ======================================================================

  gens.push({
    id: 'u1-coulomb', unit: 1, topic: "Coulomb's law",
    make(rng) {
      const q1 = sgn(rng) * rnd(rng, 1, 9, 2), q2 = sgn(rng) * rnd(rng, 1, 9, 2);
      const variant = rng.pick(['F', 'r']);
      let rcm = rng.int(2, 30), r = rcm / 100;
      let F = (K * Math.abs(q1 * q2) * 1e-12) / (r * r);
      const kind = q1 * q2 > 0 ? 'repel (like charges)' : 'attract (unlike charges)';
      let prompt, ans, units, solve;
      if (variant === 'F') {
        prompt = `A ${Q(q1, uC)} point charge and a ${Q(q2, uC)} point charge are ${Q(rcm, tx('cm'))} apart. What is the magnitude of the electric force each exerts on the other? Answer in N.`;
        ans = F; units = 'N';
        solve = `F = \\frac{(8.99 \\times 10^9)(${fmt(Math.abs(q1))} \\times 10^{-6})(${fmt(Math.abs(q2))} \\times 10^{-6})}{(${fmt(r)})^2} = ${fmt(F)}\\ \\text{N}`;
      } else {
        F = sig(F, 3); r = Math.sqrt((K * Math.abs(q1 * q2) * 1e-12) / F); rcm = r * 100;
        prompt = `A ${Q(q1, uC)} point charge and a ${Q(q2, uC)} point charge exert forces of magnitude ${Q(F, tx('N'))} on each other. How far apart are they? Answer in cm.`;
        ans = rcm; units = 'cm';
        solve = `r = \\sqrt{\\frac{k|q_1q_2|}{F}} = \\sqrt{\\frac{(8.99 \\times 10^9)(${fmt(Math.abs(q1 * q2) * 1e-12)})}{${fmt(F)}}} = ${fmt(r)}\\ \\text{m}`;
      }
      return {
        type: 'numeric', prompt, given: giv(G.k),
        answer: sig(ans, 3), units,
        steps: [
          `Coulomb's law: ${M('F = k\\frac{|q_1q_2|}{r^2}')}. The force grows with each charge, and it falls off as ${M('1/r^2')} because the influence spreads over a sphere of area ${M('4\\pi r^2')}.`,
          `Convert to SI: ${M('1\\ \\mu\\text{C} = 10^{-6}\\ \\text{C}')}, ${M('1\\ \\text{cm} = 0.01\\ \\text{m}')}.`,
          `${M(solve)}`,
          `${B(variant === 'F' ? `F ≈ ${X(ans)} N` : `r ≈ ${X(ans)} cm`)}. The charges ${kind}, and by Newton's third law both feel the same magnitude.`,
        ],
        visual: { key: 'coulomb', params: { q1: q1 * 1e-6, q2: q2 * 1e-6, r, F } },
      };
    },
  });

  gens.push({
    id: 'u1-coulomb-scaling', unit: 1, topic: "Coulomb's law (scaling)",
    make(rng) {
      let a, b, c;
      do { a = rng.pick([1, 2, 3]); b = rng.pick([1, 2, 3]); c = rng.pick([0.5, 2, 3]); } while (a === 1 && b === 1 && c === 1);
      const q1 = rng.int(1, 6), q2 = rng.int(1, 6), rcm = rng.int(5, 30);
      const F0 = sig((K * q1 * q2 * 1e-12) / Math.pow(rcm / 100, 2), 2);
      const factor = (a * b) / (c * c);
      const opt = (f) => `${M(fmt(F0 * f, 3) + '\\ \\text{N}')}`;
      const word = (x) => ({ 1: 'unchanged', 2: 'doubled', 3: 'tripled' }[x]);
      const rw = { 0.5: 'halved', 2: 'doubled', 3: 'tripled' }[c];
      const correct = opt(factor);
      const wrongs = [opt((a * b) / c), opt(a * b * c * c), opt(1 / (c * c)), opt(factor * 2), opt(factor / 2)];
      const changes = [];
      changes.push(a === 1 ? 'the first charge is left unchanged' : `the first charge is ${word(a)}`);
      changes.push(b === 1 ? 'the second charge is left unchanged' : `the second charge is ${word(b)}`);
      changes.push(`the distance between them is ${rw}`);
      return {
        type: 'mc',
        prompt: `Two point charges a distance r apart exert an electric force of magnitude ${Q(F0, tx('N'))} on each other. Then ${changes[0]}, ${changes[1]}, and ${changes[2]}. What is the new force magnitude?`,
        ...mc(rng, correct, wrongs),
        steps: [
          `${M('F = k\\frac{q_1q_2}{r^2}')}: F is proportional to each charge and inversely proportional to the square of the distance.`,
          `Charge factors: ${M(`${a} \\times ${b} = ${a * b}`)}. Distance factor: ${M(`r \\to ${c}r`)}, so ${M(`1/r^2 \\to \\tfrac{1}{${c * c}}`)}${c < 1 ? ' (halving r makes F 4× bigger)' : ''}.`,
          `New force: ${M(`F' = ${fmt(F0)} \\times \\frac{${a * b}}{${c * c}} = ${fmt(F0 * factor)}\\ \\text{N}`)}.`,
          `${B(`F' ≈ ${X(F0 * factor)} N`)}. The common slip is forgetting to square the distance factor.`,
        ],
        visual: { key: 'coulomb', params: { q1: q1 * 1e-6, q2: q2 * 1e-6, r: rcm / 100, F: F0, after: { q1: a * q1 * 1e-6, q2: b * q2 * 1e-6, r: (c * rcm) / 100, F: F0 * factor } } },
      };
    },
  });

  // 1D superposition along a line: returns {charges, x0, net, parts}
  function line1D(rng, unitScale, forTest) {
    for (let tries = 0; tries < 20; tries++) {
      const d = rng.int(6, 20);
      const q1 = sgn(rng) * rnd(rng, 1, 9, 2), q2 = sgn(rng) * rnd(rng, 1, 9, 2);
      const between = rng() < 0.5;
      const x0 = between ? rng.int(2, d - 2) : d + rng.int(3, 10);
      const qt = forTest ? sgn(rng) * rnd(rng, 1, 5, 2) : 1;
      const xs = [0, d];
      const qs = [q1, q2];
      const parts = qs.map((q, i) => {
        const dx = (x0 - xs[i]) / 100;
        return (K * q * unitScale * qt * (forTest ? unitScale : 1) * Math.sign(dx)) / (dx * dx);
      });
      const net = parts[0] + parts[1];
      if (Math.abs(net) >= 0.08 * (Math.abs(parts[0]) + Math.abs(parts[1]))) {
        return { d, q1, q2, x0, qt, parts, net };
      }
    }
    // fallback (deterministic): same-sign charges, point outside
    const d = 10, q1 = 4, q2 = 2, x0 = 15, qt = 1;
    const parts = [0, 10].map((x, i) => (K * [q1, q2][i] * unitScale * qt * (forTest ? unitScale : 1)) / Math.pow((x0 - x) / 100, 2));
    return { d, q1, q2, x0, qt, parts, net: parts[0] + parts[1] };
  }

  const dirWord = (v) => (v > 0 ? 'right (+)' : 'left (−)');

  gens.push({
    id: 'u1-superposition-force', unit: 1, topic: 'Superposition of forces',
    make(rng) {
      const s = line1D(rng, 1e-6, true);
      return {
        type: 'numeric',
        prompt: `Charge ${M('q_1 = ' + fmt(s.q1) + '\\ ' + uC)} is at ${M('x = 0')} and ${M('q_2 = ' + fmt(s.q2) + '\\ ' + uC)} is at ${M(`x = ${s.d}\\ \\text{cm}`)}. A test charge ${M('q_0 = ' + fmt(s.qt) + '\\ ' + uC)} is placed at ${M(`x = ${s.x0}\\ \\text{cm}`)}. What is the net electric force on ${M('q_0')}? Take +x (right) as positive. Answer in N.`,
        given: giv(G.k),
        answer: sig(s.net, 3), units: 'N',
        steps: [
          `Superposition: each charge pushes or pulls on ${M('q_0')} as if the other were not there. Add the two forces as vectors, which here means adding signed numbers along x.`,
          `From ${M('q_1')} (distance ${M(`${s.x0}\\ \\text{cm}`)}): ${M(`|F_1| = k\\frac{|q_1q_0|}{r_1^2} = ${fmt(Math.abs(s.parts[0]))}\\ \\text{N}`)}. ${s.q1 * s.qt > 0 ? 'The charges are alike, so they repel' : 'The charges are unlike, so they attract'}, and ${M('F_1')} points ${dirWord(s.parts[0])}.`,
          `From ${M('q_2')} (distance ${M(`${Math.abs(s.x0 - s.d)}\\ \\text{cm}`)}): ${M(`|F_2| = ${fmt(Math.abs(s.parts[1]))}\\ \\text{N}`)}. ${s.q2 * s.qt > 0 ? 'Repel' : 'Attract'}, so ${M('F_2')} points ${dirWord(s.parts[1])}.`,
          `${M(`F_{net} = (${fmt(s.parts[0])}) + (${fmt(s.parts[1])}) = ${fmt(s.net)}\\ \\text{N}`)}`,
          `${B(`F<sub>net</sub> ≈ ${X(s.net)} N`)}, pointing ${s.net > 0 ? 'right' : 'left'}.`,
        ],
        visual: { key: 'superposition', params: { charges: [{ q: s.q1 * 1e-6, x: 0 }, { q: s.q2 * 1e-6, x: s.d / 100 }], x0: s.x0 / 100, quantity: 'force', qTest: s.qt * 1e-6, net: s.net } },
      };
    },
  });

  gens.push({
    id: 'u1-superposition-field', unit: 1, topic: 'Superposition of fields',
    make(rng) {
      const s = line1D(rng, 1e-9, false);
      return {
        type: 'numeric',
        prompt: `Charge ${M('q_1 = ' + fmt(s.q1) + '\\ ' + nC)} is at ${M('x = 0')} and ${M('q_2 = ' + fmt(s.q2) + '\\ ' + nC)} is at ${M(`x = ${s.d}\\ \\text{cm}`)}. What is the net electric field at ${M(`x = ${s.x0}\\ \\text{cm}`)}? Take +x (right) as positive. Answer in N/C.`,
        given: giv(G.k),
        answer: sig(s.net, 3), units: 'N/C',
        steps: [
          `The electric field at a point is the force per unit positive test charge. Each charge contributes ${M('E = k|q|/r^2')}, pointing <i>away</i> from a positive charge and <i>toward</i> a negative one. The fields add (superposition).`,
          `From ${M('q_1')} at ${M(`r_1 = ${s.x0}\\ \\text{cm}`)}: ${M(`|E_1| = \\frac{(8.99 \\times 10^9)(${fmt(Math.abs(s.q1))} \\times 10^{-9})}{(${fmt(s.x0 / 100)})^2} = ${fmt(Math.abs(s.parts[0]))}\\ \\text{N/C}`)}, pointing ${dirWord(s.parts[0])}.`,
          `From ${M('q_2')} at ${M(`r_2 = ${Math.abs(s.x0 - s.d)}\\ \\text{cm}`)}: ${M(`|E_2| = ${fmt(Math.abs(s.parts[1]))}\\ \\text{N/C}`)}, pointing ${dirWord(s.parts[1])}.`,
          `${M(`E_{net} = (${fmt(s.parts[0])}) + (${fmt(s.parts[1])}) = ${fmt(s.net)}\\ \\text{N/C}`)}`,
          `${B(`E<sub>net</sub> ≈ ${X(s.net)} N/C`)}`,
        ],
        visual: { key: 'superposition', params: { charges: [{ q: s.q1 * 1e-9, x: 0 }, { q: s.q2 * 1e-9, x: s.d / 100 }], x0: s.x0 / 100, quantity: 'field', net: s.net } },
      };
    },
  });

  gens.push({
    id: 'u1-point-field', unit: 1, topic: 'Field of a point charge',
    make(rng) {
      let q = sgn(rng) * rnd(rng, 1, 9, 2);
      const rcm = rng.int(2, 25), r = rcm / 100;
      let E = (K * Math.abs(q) * 1e-9) / (r * r);
      const variant = rng.pick(['E', 'q']);
      let prompt, ans, units, steps;
      if (variant === 'E') {
        prompt = `What is the magnitude of the electric field ${Q(rcm, tx('cm'))} from a ${Q(q, nC)} point charge? Answer in N/C.`;
        ans = E; units = 'N/C';
        steps = [
          `A test charge ${M('q_0')} at distance r feels ${M('F = k|q|q_0/r^2')}. The field is force per unit test charge, so ${M('E = F/q_0 = k|q|/r^2')}.`,
          `SI: ${M(`q = ${fmt(q)} \\times 10^{-9}\\ \\text{C}`)}, ${M(`r = ${fmt(r)}\\ \\text{m}`)}.`,
          `${M(`E = \\frac{(8.99 \\times 10^9)(${fmt(Math.abs(q))} \\times 10^{-9})}{(${fmt(r)})^2} = ${fmt(E)}\\ \\text{N/C}`)}`,
          `${B(`E ≈ ${X(E)} N/C`)}, pointing ${q > 0 ? 'away from' : 'toward'} the charge.`,
        ];
      } else {
        E = sig(E, 3); q = Math.sign(q) * ((E * r * r) / K) * 1e9;
        prompt = `At a point ${Q(rcm, tx('cm'))} from a small charged sphere, the electric field has magnitude ${Q(E, tx('N/C'))} and points ${q > 0 ? 'directly away from' : 'directly toward'} the sphere. What is the charge on the sphere (include the sign)? Answer in nC.`;
        ans = q; units = 'nC';
        steps = [
          `Outside a uniformly charged sphere the field is the same as a point charge's: ${M('E = k|q|/r^2')}, so ${M('|q| = Er^2/k')}.`,
          `${M(`|q| = \\frac{(${fmt(E)})(${fmt(r)})^2}{8.99 \\times 10^9} = ${fmt(Math.abs(q) * 1e-9)}\\ \\text{C}`)}`,
          `Field lines point away from positive charge and toward negative charge. Here the field points ${q > 0 ? 'away, so q is positive' : 'toward the sphere, so q is negative'}.`,
          `${B(`q ≈ ${X(q)} nC`)}`,
        ];
      }
      return {
        type: 'numeric', prompt, given: giv(G.k),
        answer: sig(ans, 3), units, steps,
        visual: { key: 'point-field', params: { q: q * 1e-9, r, E } },
      };
    },
  });

  gens.push({
    id: 'u1-uniform-field', unit: 1, topic: 'Uniform field between plates',
    make(rng) {
      const V = rng.int(2, 100) * 10, dmm = rng.int(2, 20), d = dmm / 1000, E = V / d;
      const variant = rng.pick(['E', 'F', 'a']);
      const params = { V, d, E };
      let prompt, ans, units, given = '', steps;
      const setup = `Two large parallel plates are ${Q(dmm, tx('mm'))} apart, with a potential difference of ${Q(V, tx('V'))} between them.`;
      const s1 = `Between large parallel plates the field is uniform, so the potential drops steadily from the + plate to the − plate: ${M('\\Delta V = Ed')}, giving ${M('E = \\Delta V/d')}.`;
      const s2 = `${M(`E = \\frac{${V}\\ \\text{V}}{${fmt(d)}\\ \\text{m}} = ${fmt(E)}\\ \\text{V/m} = ${fmt(E)}\\ \\text{N/C}`)}`;
      if (variant === 'E') {
        prompt = `${setup} What is the magnitude of the electric field between the plates? Answer in N/C.`;
        ans = E; units = 'N/C';
        steps = [s1, `Units: 1 V/m = 1 N/C. Both mean energy per charge per meter, which is force per charge.`, s2, B(`E ≈ ${X(E)} N/C`) + ', pointing from the + plate toward the − plate.'];
      } else if (variant === 'F') {
        const q = sgn(rng) * rng.int(1, 9);
        const F = Math.abs(q) * 1e-9 * E;
        Object.assign(params, { q: q * 1e-9, F });
        prompt = `${setup} A small bead with charge ${Q(q, nC)} is between the plates. What is the magnitude of the electric force on it? Answer in µN.`;
        ans = F * 1e6; units = 'µN';
        steps = [s1, s2, `Force on a charge in a field: ${M(`F = |q|E = (${Math.abs(q)} \\times 10^{-9})(${fmt(E)}) = ${fmt(F)}\\ \\text{N}`)}. The force points ${q > 0 ? 'along E, toward the − plate' : 'opposite E, toward the + plate'}.`, B(`F ≈ ${X(ans)} µN`)];
      } else {
        const proton = rng() < 0.5, m = proton ? MP : ME, q = proton ? QE : -QE;
        const F = QE * E, a = F / m;
        Object.assign(params, { q, m, F, a });
        given = giv(G.e, proton ? G.mp : G.me);
        prompt = `${setup} ${proton ? 'A proton' : 'An electron'} is released between the plates. What is the magnitude of its acceleration? (Gravity is negligible.) Answer in m/s².`;
        ans = a; units = 'm/s²';
        steps = [s1, s2, `Electric force: ${M(`F = eE = (1.6 \\times 10^{-19})(${fmt(E)}) = ${fmt(F)}\\ \\text{N}`)}. That is about ${M('10^{' + Math.round(Math.log10(F / (m * 9.8))) + '}')} times the particle's weight, so ignoring gravity is safe.`, `Newton's second law: ${M(`a = F/m = \\frac{${fmt(F)}}{${fmt(m)}} = ${fmt(a)}\\ \\text{m/s}^2`)}, directed ${proton ? 'toward the − plate' : 'toward the + plate'}.`, B(`a ≈ ${X(a)} m/s²`)];
      }
      return { type: 'numeric', prompt, given, answer: sig(ans, 3), units, steps, visual: { key: 'uniform-field', params } };
    },
  });

  gens.push({
    id: 'u1-potential', unit: 1, topic: 'Electric potential (superposition)',
    make(rng) {
      let charges, px, py, Vs, Vt, rs;
      for (let tries = 0; tries < 30; tries++) {
        const nq = rng.pick([2, 2, 3]);
        px = rng.int(-2, 2); py = rng.int(-2, 2);
        charges = [];
        while (charges.length < nq) {
          const x = rng.int(-6, 6), y = rng.int(-6, 6);
          const dist = Math.hypot(x - px, y - py);
          if (dist < 2 || charges.some((c) => c.x === x && c.y === y)) continue;
          charges.push({ q: sgn(rng) * rnd(rng, 1, 9, 2), x, y });
        }
        rs = charges.map((c) => Math.hypot(c.x - px, c.y - py) / 100);
        Vs = charges.map((c, i) => (K * c.q * 1e-9) / rs[i]);
        Vt = Vs.reduce((s, v) => s + v, 0);
        if (Math.abs(Vt) >= 0.1 * Vs.reduce((s, v) => s + Math.abs(v), 0)) break;
      }
      const list = charges.map((c, i) => `${M(`q_${i + 1} = ${fmt(c.q)}\\ \\text{nC}`)} at (${c.x}, ${c.y}) cm`).join('; ');
      return {
        type: 'numeric',
        prompt: `Point charges are placed as follows: ${list}. What is the electric potential at point P (${px}, ${py}) cm? (V = 0 infinitely far away.) Answer in V.`,
        given: giv(G.k),
        answer: sig(Vt, 3), units: 'V',
        steps: [
          `Potential is electric potential energy per unit charge, ${M('V = kq/r')} for a point charge. It is a <b>scalar</b>, so the contributions add as signed numbers with no components or directions.`,
          `Distances to P (Pythagorean theorem): ${rs.map((r, i) => M(`r_${i + 1} = ${fmt(r)}\\ \\text{m}`)).join(', ')}.`,
          `Contributions: ${Vs.map((v, i) => M(`V_${i + 1} = \\frac{(8.99 \\times 10^9)(${fmt(charges[i].q)} \\times 10^{-9})}{${fmt(rs[i])}} = ${fmt(v)}\\ \\text{V}`)).join('<br>')}`,
          `${M(`V_P = ${Vs.map((v) => '(' + fmt(v) + ')').join(' + ')} = ${fmt(Vt)}\\ \\text{V}`)}`,
          `${B(`V<sub>P</sub> ≈ ${X(Vt)} V`)}. Negative charges contribute negative potential.`,
        ],
        visual: { key: 'potential', params: { charges: charges.map((c) => ({ q: c.q * 1e-9, x: c.x / 100, y: c.y / 100 })), point: { x: px / 100, y: py / 100 }, V: Vt } },
      };
    },
  });

  gens.push({
    id: 'u1-pe-pair', unit: 1, topic: 'Electric potential energy',
    make(rng) {
      const q1 = sgn(rng) * rnd(rng, 1, 9, 2), q2 = sgn(rng) * rnd(rng, 1, 9, 2), rcm = rng.int(2, 50), r = rcm / 100;
      const U = (K * q1 * q2 * 1e-12) / r;
      const variant = rng.pick(['U', 'W']);
      const prompt = variant === 'U'
        ? `What is the electric potential energy of a ${Q(q1, uC)} charge and a ${Q(q2, uC)} charge separated by ${Q(rcm, tx('cm'))}? (U = 0 at infinite separation; include the sign.) Answer in J.`
        : `A ${Q(q1, uC)} charge is fixed in place. How much work must an external agent do to slowly bring a ${Q(q2, uC)} charge from very far away to ${Q(rcm, tx('cm'))} from it? (Include the sign.) Answer in J.`;
      return {
        type: 'numeric', prompt, given: giv(G.k),
        answer: sig(U, 3), units: 'J',
        steps: [
          `For two point charges, ${M('U = k\\frac{q_1q_2}{r}')}, with U = 0 at infinite separation. Keep the signs of the charges: the sign of U carries physics.`,
          variant === 'W' ? `Moving the charge slowly (no change in KE) means the agent's work all goes into potential energy: ${M('W_{ext} = \\Delta U = U_{final} - 0')}.` : `${q1 * q2 > 0 ? 'Like charges: you had to push them together, which stored energy, so U > 0.' : 'Unlike charges: they pull together on their own, so the system has less energy than when far apart, and U < 0.'}`,
          `${M(`U = \\frac{(8.99 \\times 10^9)(${fmt(q1)} \\times 10^{-6})(${fmt(q2)} \\times 10^{-6})}{${fmt(r)}} = ${fmt(U)}\\ \\text{J}`)}`,
          `${B(`${variant === 'U' ? 'U' : 'W'} ≈ ${X(U)} J`)}${variant === 'W' && U < 0 ? '. Negative: the agent must hold the charge back as the attraction pulls it in.' : ''}`,
        ],
        visual: { key: 'pe-pair', params: { q1: q1 * 1e-6, q2: q2 * 1e-6, r, U } },
      };
    },
  });

  gens.push({
    id: 'u1-work-dv', unit: 1, topic: 'Potential difference & energy',
    make(rng) {
      const variant = rng.pick(['dK', 'speed']);
      if (variant === 'dK') {
        const q = sgn(rng) * rnd(rng, 1, 9, 2);
        let Va, Vb;
        do { Va = rng.int(-50, 50) * 10; Vb = rng.int(-50, 50) * 10; } while (Math.abs(Va - Vb) < 50);
        const dV = Vb - Va, W = -q * 1e-6 * dV;
        return {
          type: 'numeric',
          prompt: `A ${Q(q, uC)} charge moves from point A (${M(`V_A = ${Va}\\ \\text{V}`)}) to point B (${M(`V_B = ${Vb}\\ \\text{V}`)}). Only the electric force acts on it. What is the change in its kinetic energy? (Include the sign.) Answer in mJ.`,
          given: '',
          answer: sig(W * 1000, 3), units: 'mJ',
          steps: [
            `Potential is potential energy per charge, so ${M('\\Delta U = q\\Delta V')}. The work done by the field is ${M('W_{field} = -\\Delta U = -q\\Delta V')}.`,
            `Only the electric force acts, so energy is conserved: ${M('\\Delta K = -\\Delta U = -q\\Delta V')}.`,
            `${M(`\\Delta V = V_B - V_A = ${Vb} - (${Va}) = ${dV}\\ \\text{V}`)}`,
            `${M(`\\Delta K = -(${fmt(q)} \\times 10^{-6})(${dV}) = ${fmt(W)}\\ \\text{J}`)}. ${q > 0 ? 'Positive charges speed up moving toward lower potential.' : 'Negative charges speed up moving toward higher potential.'}`,
            `${B(`ΔK ≈ ${X(W * 1000)} mJ`)}`,
          ],
          visual: { key: 'work-dv', params: { q: q * 1e-6, Va, Vb, W, dK: W } },
        };
      }
      const proton = rng() < 0.5, dV = rng.int(5, 200) * 10, m = proton ? MP : ME;
      const KE = QE * dV, v = Math.sqrt((2 * KE) / m);
      const Va = proton ? dV : 0, Vb = proton ? 0 : dV, q = proton ? QE : -QE;
      return {
        type: 'numeric',
        prompt: `${proton ? 'A proton' : 'An electron'} starts from rest and is accelerated through a potential difference of ${Q(dV, tx('V'))}. What is its final speed? Answer in m/s.`,
        given: giv(G.e, proton ? G.mp : G.me),
        answer: sig(v, 3), units: 'm/s',
        steps: [
          `The field does work ${M('W = -q\\Delta V')} on the particle. ${proton ? 'A positive charge moves from high to low potential' : 'A negative charge moves from low to high potential'}, so the work is positive and ${M('|W| = e|\\Delta V|')}.`,
          `Work-energy theorem, starting from rest: ${M(`\\tfrac12 mv^2 = e|\\Delta V| = (1.6 \\times 10^{-19})(${dV}) = ${fmt(KE)}\\ \\text{J}`)}.`,
          `${M(`v = \\sqrt{\\frac{2e|\\Delta V|}{m}} = \\sqrt{\\frac{2(${fmt(KE)})}{${fmt(m)}}} = ${fmt(v)}\\ \\text{m/s}`)}`,
          `${B(`v ≈ ${X(v)} m/s`)}${proton ? '' : '. The electron is about 1800× lighter than a proton, so it ends up much faster.'}`,
        ],
        visual: { key: 'work-dv', params: { q, Va, Vb, W: KE, dK: KE } },
      };
    },
  });

  gens.push({
    id: 'u1-dv-signs', unit: 1, topic: 'Work by the field (signs)',
    make(rng) {
      const q = sgn(rng) * rng.int(1, 9);
      let Va, Vb;
      do { Va = rng.int(-40, 40) * 10; Vb = rng.int(-40, 40) * 10; } while (Math.abs(Va - Vb) < 50 || Va + Vb === 0 || Va === -Vb);
      const W = q * (Va - Vb) / 1000; // mJ (µC·V = µJ)
      const opt = (x) => M(fmt(x, 3) + '\\ \\text{mJ}');
      const correct = opt(W);
      const wrongs = [opt(-W), opt(q * (Va + Vb) / 1000), opt(0), opt(W * 2), opt(-W * 2)];
      return {
        type: 'mc',
        prompt: `A ${Q(q, uC)} charge is moved from point A, where ${M(`V_A = ${Va}\\ \\text{V}`)}, to point B, where ${M(`V_B = ${Vb}\\ \\text{V}`)}. How much work does the <i>electric field</i> do on the charge?`,
        ...mc(rng, correct, wrongs),
        steps: [
          `The electric force is conservative, so its work depends only on the start and end points: ${M('W_{field} = -\\Delta U = -q(V_B - V_A)')}.`,
          `${M(`\\Delta V = ${Vb} - (${Va}) = ${Vb - Va}\\ \\text{V}`)}`,
          `${M(`W_{field} = -(${q} \\times 10^{-6})(${Vb - Va}) = ${fmt(W / 1000)}\\ \\text{J}`)}`,
          `${B(`W = ${X(W)} mJ`)}. ${W > 0 ? 'The field helps the motion, and the charge loses potential energy.' : 'The field opposes the motion, and the charge gains potential energy.'}`,
        ],
        visual: { key: 'work-dv', params: { q: q * 1e-6, Va, Vb, W: W / 1000, dK: W / 1000 } },
      };
    },
  });

  const DIELECTRICS = [{ k: 1, n: 'air' }, { k: 2.1, n: 'Teflon' }, { k: 3.7, n: 'paper' }, { k: 5.4, n: 'mica' }];

  gens.push({
    id: 'u1-capacitor', unit: 1, topic: 'Capacitors',
    make(rng) {
      const de = rng.pick(DIELECTRICS), Acm = rng.int(50, 400), A = Acm * 1e-4;
      const dmm = rnd(rng, 0.5, 3, 2), d = dmm / 1000, V = rng.int(6, 120);
      const C = (de.k * E0 * A) / d, Qc = C * V, U = 0.5 * C * V * V;
      const variant = rng.pick(['C', 'Q', 'U']);
      const fill = de.k === 1 ? 'air between the plates' : `the gap filled with ${de.n} (${M(`\\kappa = ${de.k}`)})`;
      const ask = { C: 'What is its capacitance? Answer in pF.', Q: 'What is the magnitude of the charge on each plate? Answer in nC.', U: 'How much energy is stored in it? Answer in nJ.' }[variant];
      const ans = { C: C * 1e12, Q: Qc * 1e9, U: U * 1e9 }[variant];
      const units = { C: 'pF', Q: 'nC', U: 'nJ' }[variant];
      const steps = [
        `A parallel-plate capacitor stores +Q and −Q on facing plates. Bigger plates hold more charge at the same voltage. A smaller gap means the opposite charges attract more strongly, so more charge fits. A dielectric polarizes and partly cancels the field. Together: ${M('C = \\frac{\\kappa\\varepsilon_0 A}{d}')}.`,
        `SI: ${M(`A = ${Acm}\\ \\text{cm}^2 = ${fmt(A)}\\ \\text{m}^2`)}, ${M(`d = ${dmm}\\ \\text{mm} = ${fmt(d)}\\ \\text{m}`)}. Then ${M(`C = \\frac{(${de.k})(8.85 \\times 10^{-12})(${fmt(A)})}{${fmt(d)}} = ${fmt(C)}\\ \\text{F}`)}.`,
      ];
      if (variant === 'Q' || variant === 'U') steps.push(`Charge: ${M(`Q = CV = (${fmt(C)})(${V}) = ${fmt(Qc)}\\ \\text{C}`)}.`);
      if (variant === 'U') steps.push(`Energy: while charging, the voltage climbs from 0 to V, so on average each bit of charge is moved through V/2: ${M(`U = \\tfrac12 QV = \\tfrac12 CV^2 = \\tfrac12(${fmt(C)})(${V})^2 = ${fmt(U)}\\ \\text{J}`)}.`);
      steps.push(B(`${variant} ≈ ${X(ans)} ${units}`));
      return {
        type: 'numeric',
        prompt: `A parallel-plate capacitor has plates of area ${M(`${Acm}\\ \\text{cm}^2`)} separated by ${Q(dmm, tx('mm'))}, with ${fill}. It is connected to a ${Q(V, tx('V'))} battery. ${ask}`,
        given: giv(G.e0),
        answer: sig(ans, 3), units, steps,
        visual: { key: 'capacitor', params: { C, V, Q: Qc, U, kappa: de.k, A, d } },
      };
    },
  });

  gens.push({
    id: 'u1-capacitor-change', unit: 1, topic: 'Capacitors: connected vs isolated',
    make(rng) {
      const connected = rng() < 0.5, change = rng.pick(['d', 'kappa']);
      const kap = change === 'kappa' ? rng.pick([2, 3]) : 1;
      const qty = rng.pick(['Q', 'V', 'E', 'U', 'C']);
      const Acm = rng.int(50, 300), A = Acm * 1e-4, dmm = rng.int(1, 4), d = dmm / 1000, V0 = rng.int(6, 48);
      const C0 = (E0 * A) / d, Q0 = C0 * V0;
      const C1 = change === 'd' ? C0 / 2 : C0 * kap, d1 = change === 'd' ? 2 * d : d;
      const V1 = connected ? V0 : Q0 / C1, Q1 = connected ? C1 * V0 : Q0;
      const ratio = {
        C: C1 / C0, V: V1 / V0, Q: Q1 / Q0, E: V1 / d1 / (V0 / d), U: (Q1 * V1) / (Q0 * V0),
      }[qty];
      const name = { Q: 'charge Q on each plate', V: 'potential difference V across it', E: 'electric field E between the plates', U: 'energy U stored in it', C: 'capacitance C' }[qty];
      let opts;
      if (change === 'd') opts = [[0.5, 'It is halved.'], [1, 'It stays the same.'], [2, 'It doubles.'], [4, 'It quadruples.']];
      else opts = [[1 / kap, `It decreases to 1/${kap} of its value.`], [1, 'It stays the same.'], [kap, `It is multiplied by ${kap}.`], [kap * kap, `It is multiplied by ${kap * kap}.`]];
      let best = opts[0];
      for (const o of opts) if (Math.abs(Math.log(o[0] / ratio)) < Math.abs(Math.log(best[0] / ratio))) best = o;
      const correct = best[1];
      const wrongs = opts.filter((o) => o !== best).map((o) => o[1]);
      const fixed = connected ? 'It stays connected to the battery, so <b>V is fixed</b> at the battery voltage.' : 'It is isolated, so the charge has nowhere to go and <b>Q is fixed</b>.';
      const r = (x) => fmt(x, 3);
      const cStep = change === 'd'
        ? `${M('C = \\kappa\\varepsilon_0A/d')}: doubling d halves C.`
        : `${M('C = \\kappa\\varepsilon_0A/d')}: the dielectric multiplies C by ${M('\\kappa = ' + kap)}. Its molecules polarize and partly cancel the field, so more charge fits per volt.`;
      const fC = r(C1 / C0), dd = change === 'd';
      const why = {
        C: `C depends only on the geometry and the material in the gap, not on the battery. ${dd ? 'Doubling d halves it.' : `The dielectric multiplies it by ${kap}.`} Whether the battery is connected doesn't matter for C.`,
        Q: connected
          ? `The battery holds V at ${V0} V, so ${M('Q = CV')} follows C: the battery ${C1 > C0 ? `pushes extra charge onto the plates (×${fC})` : `takes charge back off the plates (×${fC})`}.`
          : `The isolated plates have no path for charge to leave or arrive, so Q cannot change, whatever happens to C.`,
        V: connected
          ? `The plates are wired straight to the battery terminals, so V stays at ${V0} V.`
          : `Q is fixed, so ${M('V = Q/C')} changes opposite to C: C ×${fC} means V ×${r(V1 / V0)}${dd ? '. Pulling the plates apart against their attraction raises their potential difference' : '. The dielectric\'s induced charges partly cancel the field, so less voltage is needed for the same Q'}.`,
        E: dd
          ? (connected
            ? `${M('E = V/d')} with V held at ${V0} V and d doubled, so E is halved.`
            : `${M('E = V/d')}: V doubles and d doubles, so E is unchanged. Equivalently, E depends on the charge per area Q/A, and neither Q nor A changed.`)
          : (connected
            ? `${M('E = V/d')}, and neither V (battery) nor d changed, so E is the same. The battery adds charge to make up for the dielectric's partial cancellation.`
            : `V drops to 1/${kap} with the same d, so ${M('E = V/d')} drops to 1/${kap}: the dielectric's polarized molecules partly cancel the field of the fixed plate charge.`),
        U: connected
          ? `With V fixed, use ${M('U = \\tfrac12 CV^2')}: U follows C (×${fC}).${dd ? ' Energy actually flows back into the battery as charge leaves the plates.' : ''}`
          : `With Q fixed, use ${M('U = \\tfrac{Q^2}{2C}')}: U changes opposite to C (×${r((Q1 * V1) / (Q0 * V0))}).${dd ? ' The extra energy comes from the work you do pulling the attracting plates apart.' : ' The plates do work pulling the dielectric in, so the stored energy drops.'}`,
      }[qty];
      const chain = why;
      return {
        type: 'mc',
        prompt: `An air-filled parallel-plate capacitor is charged by a ${Q(V0, tx('V'))} battery. ${connected ? 'While it is still connected to the battery' : 'It is then disconnected from the battery, and'} ${change === 'd' ? 'the plate separation is doubled' : `a dielectric with ${M('\\kappa = ' + kap)} is slid in to completely fill the gap`}. What happens to the ${name}?`,
        ...mc(rng, correct, wrongs),
        steps: [
          `First decide what stays fixed. ${fixed}`,
          ...(qty === 'C' ? [] : [cStep]),
          chain,
          `${B('Answer: ' + correct)}`,
        ],
        visual: { key: 'capacitor', params: { C: C0, V: V0, Q: Q0, U: 0.5 * Q0 * V0, kappa: 1, A, d, after: { C: C1, V: V1, Q: Q1, U: 0.5 * Q1 * V1, kappa: kap, A, d: d1 }, connected } },
      };
    },
  });

  gens.push({
    id: 'u1-charging', unit: 1, topic: 'Charging methods',
    make(rng) {
      const method = rng.pick(['friction', 'conduction', 'induction', 'polarization']);
      let prompt, correct, wrongs, steps, stage, extra = {};
      if (method === 'friction') {
        const pair = rng.pick([
          { rod: 'rubber rod', cloth: 'fur', rodSign: -1 },
          { rod: 'glass rod', cloth: 'silk', rodSign: 1 },
          { rod: 'plastic comb', cloth: 'dry hair', rodSign: -1 },
        ]);
        const rodS = pair.rodSign < 0 ? 'negative' : 'positive', clS = pair.rodSign < 0 ? 'positive' : 'negative';
        stage = 'Separate';
        prompt = `A neutral ${pair.rod} is rubbed with neutral ${pair.cloth}, and the ${pair.rod} ends up ${rodS}ly charged. Which statement best describes the ${pair.cloth} afterward?`;
        correct = `It is ${clS}, with the same magnitude of charge as the ${pair.rod}.`;
        wrongs = [`It is still neutral; only the ${pair.rod} became charged.`, `It is ${rodS}, like the ${pair.rod}.`, `It is ${clS}, but with a much smaller charge than the ${pair.rod}.`];
        steps = [
          'Rubbing only transfers electrons from one material to the other. Protons are locked in nuclei and do not move.',
          `The ${pair.rod} ${pair.rodSign < 0 ? 'gained' : 'lost'} electrons, so the ${pair.cloth} ${pair.rodSign < 0 ? 'lost' : 'gained'} exactly that many.`,
          'Charge is conserved: the total was zero before, so it is still zero. The two objects carry equal and opposite charges.',
          B(`The ${pair.cloth} is ${clS} with equal magnitude.`),
        ];
      } else if (method === 'conduction') {
        const qa = sgn(rng) * rng.int(2, 12) * 2, qb = rng() < 0.5 ? 0 : sgn(rng) * rng.int(1, 6) * 2;
        const each = (qa + qb) / 2;
        stage = 'Result';
        extra = { spheres: [{ before: qa * 1e-9, after: each * 1e-9 }, { before: qb * 1e-9, after: each * 1e-9 }] };
        prompt = `Identical metal spheres A and B carry charges ${Q(qa, nC)} and ${Q(qb, nC)}. They are touched together and then separated. What is the charge on each sphere afterward?`;
        correct = `Each has ${Q(each, nC)}.`;
        wrongs = [`A has ${Q(qa + qb, nC)} and B has ${M('0')}.`, `Each has ${Q((qa - qb) / 2, nC)}.`, `Each has ${Q(qa + qb, nC)}.`, `They keep ${Q(qa, nC)} and ${Q(qb, nC)}.`];
        steps = [
          'In conductors, electrons move freely. While the spheres touch they form one conductor, and the charge spreads out to minimize repulsion.',
          `Charge is conserved: total = ${M(`${qa} + (${qb}) = ${qa + qb}\\ \\text{nC}`)}.`,
          `The spheres are identical, so by symmetry they share the total equally: ${M(`${qa + qb}/2 = ${each}\\ \\text{nC}`)}.`,
          B(`Each sphere: ${each} nC`),
        ];
      } else if (method === 'induction') {
        const rodPos = rng() < 0.5, rs = rodPos ? 'positively' : 'negatively', fin = rodPos ? 'negative' : 'positive';
        stage = 'Remove both';
        prompt = `A ${rs} charged rod is held near (not touching) a neutral metal sphere. While the rod is near, the sphere is briefly connected to ground, then the ground wire is removed, and finally the rod is taken away. What is the final charge on the sphere?`;
        correct = `${fin[0].toUpperCase() + fin.slice(1)}, spread over the sphere's surface.`;
        wrongs = [`${(rodPos ? 'positive' : 'negative')[0].toUpperCase() + (rodPos ? 'positive' : 'negative').slice(1)}, the same sign as the rod.`, 'Neutral, because the rod never touched the sphere.', `${fin[0].toUpperCase() + fin.slice(1)} only on the side that faced the rod; the rest is neutral.`];
        steps = [
          `The rod's charge pushes the sphere's free electrons ${rodPos ? 'toward the rod (attraction)' : 'away from the rod (repulsion)'}. This separates the charge, but the sphere is still neutral overall.`,
          `Grounding lets electrons ${rodPos ? 'flow up from the ground, attracted by the + rod' : 'escape to the ground, pushed away by the − rod'}.`,
          `Removing the ground wire first traps that change. Then the rod is removed and the sphere is left with net ${fin} charge, which spreads evenly over the surface.`,
          B(`Final charge: ${fin} (opposite to the rod).`),
        ];
      } else {
        const rodPos = rng() < 0.5;
        stage = 'Net attraction';
        prompt = `A ${rodPos ? 'positively' : 'negatively'} charged rod is brought near small, neutral bits of paper (an insulator) without touching them. What happens?`;
        correct = 'The bits are attracted to the rod, because their molecules polarize.';
        wrongs = ['Nothing, because neutral objects feel no electric force.', 'The bits are repelled, because they become polarized with the same sign as the rod.', `The bits are attracted only because the rod is ${rodPos ? 'positive' : 'negative'}; a rod of the other sign would repel them.`];
        steps = [
          'In an insulator, electrons cannot travel through the material, but each molecule\'s charge can shift slightly. The molecules become tiny dipoles.',
          `The side of each molecule nearest the rod becomes slightly ${rodPos ? 'negative' : 'positive'}, and the far side slightly ${rodPos ? 'positive' : 'negative'}.`,
          'The near (opposite) charges are closer to the rod than the far (like) charges. Force falls off with distance, so attraction beats repulsion and there is a net pull toward the rod. This happens for either sign of rod.',
          B('Net attraction by polarization.'),
        ];
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual: { key: 'charging', params: Object.assign({ method, stage }, extra) } };
    },
  });

  gens.push({
    id: 'u1-field-direction', unit: 1, topic: 'Electric field direction',
    make(rng) {
      const horiz = rng() < 0.5;
      const pos = horiz ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
      const pts = horiz ? [[0, 0], [0, 1], [0, -1]] : [[0, 0], [1, 0], [-1, 0]];
      const [px, py] = rng.pick(pts);
      const s = [sgn(rng), sgn(rng)];
      let Ex = 0, Ey = 0;
      const comps = pos.map(([x, y], i) => {
        const dx = px - x, dy = py - y, r3 = Math.pow(Math.hypot(dx, dy), 3);
        const ex = (s[i] * dx) / r3, ey = (s[i] * dy) / r3;
        Ex += ex; Ey += ey;
        return [ex, ey];
      });
      const DIRS = { right: 'To the right (+x)', left: 'To the left (−x)', up: 'Upward (+y)', down: 'Downward (−y)', zero: 'The field is zero there' };
      const OPP = { right: 'left', left: 'right', up: 'down', down: 'up' };
      let dir;
      if (Math.hypot(Ex, Ey) < 1e-9) dir = 'zero';
      else if (Math.abs(Ex) > Math.abs(Ey)) dir = Ex > 0 ? 'right' : 'left';
      else dir = Ey > 0 ? 'up' : 'down';
      const wrongKeys = dir === 'zero' ? rng.shuffle(['right', 'left', 'up', 'down']) : [OPP[dir], 'zero'].concat(rng.shuffle(['right', 'left', 'up', 'down'].filter((k) => k !== dir && k !== OPP[dir])));
      const sym = (v) => (v > 0 ? '+Q' : '−Q');
      const cdesc = pos.map(([x, y], i) => `${M(sym(s[i]).replace('−', '-'))} at (${x}, ${y}) m`).join(' and ');
      const r = (v) => fmt(Math.abs(v) < 1e-12 ? 0 : v, 2);
      const dname = (ex, ey) => {
        const h = Math.abs(ex) < 1e-9 ? '' : ex > 0 ? 'right' : 'left', v = Math.abs(ey) < 1e-9 ? '' : ey > 0 ? 'up' : 'down';
        return h && v ? `${v} and to the ${h}` : h ? `to the ${h}` : v;
      };
      const each = pos.map(([x, y], i) => `the ${s[i] > 0 ? '+Q' : '−Q'} at (${x}, ${y}) makes a field at P pointing ${s[i] > 0 ? 'away from' : 'toward'} it, i.e. ${dname(comps[i][0], comps[i][1])}`).join('; ');
      const cancelTxt = dir === 'zero'
        ? 'The two fields are equal and exactly opposite, so they cancel: E = 0 at P.'
        : Math.abs(Ex) < 1e-9
          ? `The horizontal parts are equal and opposite and cancel. The vertical parts both point ${Ey > 0 ? 'up' : 'down'} and add.`
          : Math.abs(Ey) < 1e-9 && comps.every((c) => Math.abs(c[1]) < 1e-9)
            ? `Both fields point ${Ex > 0 ? 'right' : 'left'} along the same line, so they add.`
            : `The vertical parts are equal and opposite and cancel. The horizontal parts both point ${Ex > 0 ? 'right' : 'left'} and add.`;
      return {
        type: 'mc',
        prompt: `Two point charges of equal magnitude are fixed: ${cdesc}. What is the direction of the net electric field at point P (${px}, ${py}) m?`,
        ...mc(rng, DIRS[dir], wrongKeys.map((k) => DIRS[k])),
        steps: [
          'The field from a positive charge points away from it, and the field from a negative charge points toward it. That is the direction a small positive test charge would be pushed.',
          `P is the same distance from both charges, so the two fields have equal magnitude. Here ${each}.`,
          `${cancelTxt} Components in units of ${M('kQ/r^2')}: (${r(comps[0][0])}, ${r(comps[0][1])}) + (${r(comps[1][0])}, ${r(comps[1][1])}) = (${r(Ex)}, ${r(Ey)}).`,
          B(`Answer: ${DIRS[dir]}`),
        ],
        visual: { key: 'field-map', params: { charges: pos.map(([x, y], i) => ({ q: s[i] * 1e-6, x, y })), ask: `P (${px}, ${py})`, point: { x: px, y: py } } },
      };
    },
  });

  gens.push({
    id: 'u1-rank-potential', unit: 1, topic: 'Ranking electric potential',
    make(rng) {
      const q = sgn(rng) * rnd(rng, 1, 9, 2);
      const rs = rng.shuffle([2, 3, 4, 5, 6, 8, 10, 12, 15]).slice(0, 3);
      const angles = rng.shuffle([0, 45, 90, 135, 180, 225, 270, 315]).slice(0, 3);
      const L = ['A', 'B', 'C'];
      const P = rs.map((r, i) => ({ L: L[i], r, x: sig(r * Math.cos((angles[i] * Math.PI) / 180), 3), y: sig(r * Math.sin((angles[i] * Math.PI) / 180), 3), V: (K * q * 1e-9) / (r / 100) }));
      const highest = rng() < 0.5;
      const pick = P.slice().sort((a, b) => (highest ? b.V - a.V : a.V - b.V))[0];
      const correct = `Point ${pick.L}`;
      const wrongs = P.filter((p) => p !== pick).map((p) => `Point ${p.L}`).concat(['All three are at the same potential']);
      return {
        type: 'mc',
        prompt: `A ${Q(q, nC)} point charge sits at the origin. Point A is ${Q(rs[0], tx('cm'))} away, B is ${Q(rs[1], tx('cm'))} away, and C is ${Q(rs[2], tx('cm'))} away (in different directions). Which point is at the <b>${highest ? 'highest' : 'lowest'}</b> electric potential?`,
        ...mc(rng, correct, wrongs),
        steps: [
          `${M('V = kq/r')} depends only on distance, not direction, because potential is a scalar. Equipotentials around a point charge are spheres.`,
          `Here q is ${q > 0 ? 'positive, so V is positive and largest close to the charge' : 'negative, so V is negative and most negative close to the charge. Moving farther away raises V toward 0'}.`,
          `Values: ${P.map((p) => M(`V_${p.L} = ${fmt(p.V)}\\ \\text{V}`)).join(', ')}.`,
          B(`Answer: Point ${pick.L}`),
        ],
        visual: { key: 'potential', params: { charges: [{ q: q * 1e-9, x: 0, y: 0 }], point: { x: pick.x / 100, y: pick.y / 100 }, V: pick.V } },
      };
    },
  });

  gens.push({
    id: 'u1-quantization', unit: 1, topic: 'Charge quantization',
    make(rng) {
      if (rng() < 0.5) {
        const qn = rnd(rng, 1, 50, 2), N = (qn * 1e-9) / QE;
        return {
          type: 'numeric',
          prompt: `A balloon rubbed on someone's hair ends up with a charge of ${Q(-qn, nC)}. How many electrons were transferred to the balloon? (Enter in scientific notation, e.g. 2.5e10.)`,
          given: giv(G.e),
          answer: sig(N, 3), units: 'electrons',
          steps: [
            `Charge is quantized. Every electron carries ${M('-e = -1.6 \\times 10^{-19}\\ \\text{C}')}, so any charge is a whole number of e: ${M('q = Ne')}.`,
            `The balloon is negative because it gained electrons. The hair lost the same number and is equally positive, since charge is conserved.`,
            `${M(`N = \\frac{|q|}{e} = \\frac{${qn} \\times 10^{-9}}{1.6 \\times 10^{-19}} = ${fmt(N)}`)}`,
            B(`N ≈ ${X(N)} electrons`),
          ],
          visual: { key: 'charging', params: { method: 'friction', stage: 'Electrons move' } },
        };
      }
      const a = rnd(rng, 1, 9.9, 2), ex = rng.int(10, 12), N = a * Math.pow(10, ex), qn = (N * QE) / 1e-9;
      return {
        type: 'numeric',
        prompt: `A neutral metal sphere loses ${M(`${a} \\times 10^{${ex}}`)} electrons. What is its net charge, including the sign? Answer in nC.`,
        given: giv(G.e),
        answer: sig(qn, 3), units: 'nC',
        steps: [
          `Protons stay put; only electrons move. Removing electrons leaves unbalanced protons, so the sphere becomes <b>positive</b>.`,
          `Charge is quantized: ${M('q = Ne')}.`,
          `${M(`q = (${a} \\times 10^{${ex}})(1.6 \\times 10^{-19}) = ${fmt(qn * 1e-9)}\\ \\text{C}`)}`,
          B(`q ≈ +${X(qn)} nC`),
        ],
        visual: { key: 'charging', params: { method: 'conduction', stage: 'Result' } },
      };
    },
  });

  gens.push({
    id: 'u1-zero-field', unit: 1, topic: 'Where is the field zero?',
    make(rng) {
      let a, b, s1, s2;
      do {
        a = rng.int(1, 9); b = rng.int(1, 9); s1 = sgn(rng); s2 = sgn(rng);
      } while (a === b || (s1 !== s2 && Math.max(a, b) / Math.min(a, b) < 1.7));
      const q1 = s1 * a, q2 = s2 * b, d = rng.int(10, 40);
      let x, where, eq;
      if (s1 === s2) {
        x = d / (1 + Math.sqrt(b / a));
        where = `Both charges have the same sign, so between them their fields point in opposite directions and can cancel. Outside, they point the same way and add. So the zero is <b>between</b> them, closer to the smaller charge.`;
        eq = `\\frac{${a}}{x^2} = \\frac{${b}}{(${d} - x)^2} \\Rightarrow \\frac{${d} - x}{x} = \\sqrt{\\tfrac{${b}}{${a}}} \\Rightarrow x = \\frac{${d}}{1 + \\sqrt{${b}/${a}}}`;
      } else if (a < b) {
        x = -d / (Math.sqrt(b / a) - 1);
        where = `The charges have opposite signs, so between them both fields point the same way (away from + and toward −) and cannot cancel. The zero must be outside, on the side of the <b>smaller</b> charge ${M('q_1')}, so it can make up for its smaller size by being closer. That means x < 0.`;
        eq = `\\frac{${a}}{s^2} = \\frac{${b}}{(s + ${d})^2} \\Rightarrow \\frac{s + ${d}}{s} = \\sqrt{\\tfrac{${b}}{${a}}} \\Rightarrow s = \\frac{${d}}{\\sqrt{${b}/${a}} - 1} = ${fmt(-x)}\\ \\text{cm},\\ x = -s`;
      } else {
        x = d + d / (Math.sqrt(a / b) - 1);
        where = `The charges have opposite signs, so between them both fields point the same way and cannot cancel. The zero must be outside, beyond the <b>smaller</b> charge ${M('q_2')}, so x > ${d} cm.`;
        eq = `\\frac{${a}}{(s + ${d})^2} = \\frac{${b}}{s^2} \\Rightarrow s = \\frac{${d}}{\\sqrt{${a}/${b}} - 1} = ${fmt(x - d)}\\ \\text{cm},\\ x = ${d} + s`;
      }
      return {
        type: 'numeric',
        prompt: `A ${Q(q1, uC)} charge is at ${M('x = 0')} and a ${Q(q2, uC)} charge is at ${M(`x = ${d}\\ \\text{cm}`)}. At what position x on the line (other than infinity) is the net electric field zero? Answer in cm (include the sign).`,
        given: '',
        answer: sig(x, 3), units: 'cm',
        steps: [
          `The net field is zero where the two fields have <i>equal magnitude</i> and <i>opposite direction</i>.`,
          where,
          `Set the magnitudes equal. k and the units µC cancel: ${M(eq)}.`,
          `${B(`x ≈ ${X(x)} cm`)}`,
        ],
        visual: { key: 'superposition', params: { charges: [{ q: q1 * 1e-6, x: 0 }, { q: q2 * 1e-6, x: d / 100 }], x0: x / 100, quantity: 'field', net: 0 } },
      };
    },
  });

  gens.push({
    id: 'u1-conductors', unit: 1, topic: 'Conductors in equilibrium',
    make(rng) {
      const v = rng.pick(['where', 'inside-E', 'inside-V', 'two-spheres']);
      const Qn = rng.int(2, 9);
      let prompt, correct, wrongs, steps, title, bullets;
      if (v === 'where') {
        prompt = `A solid metal sphere on an insulating stand is given a charge of ${Q(Qn, nC)}. Once the charges stop moving, where is the excess charge?`;
        correct = 'Spread uniformly over the outer surface';
        wrongs = ['Spread uniformly throughout the volume of the sphere', 'Concentrated at the center of the sphere', 'Spread over the surface, but only on the half nearest the stand'];
        title = 'Excess charge sits on the surface';
        bullets = ['Like charges repel', 'Free charges move as far apart as they can', 'E = 0 inside the metal', 'The excess ends up on the outer surface'];
        steps = [
          'In a conductor, charges are free to move. The excess charges all have the same sign, so they repel each other.',
          'They keep moving until no electric field acts on them inside the metal. If there were any field inside, free charges would still be moving.',
          'The arrangement that does this puts all the excess charge on the outer surface. On an isolated sphere, symmetry spreads it uniformly.',
          B('On the outer surface, uniformly.'),
        ];
      } else if (v === 'inside-E') {
        prompt = `A hollow metal sphere carries a charge of ${Q(Qn, nC)}. Point P is inside the hollow, close to the wall, and point O is at the center. How do the electric field magnitudes at P and O compare?`;
        correct = 'Both are zero.';
        wrongs = ['The field at P is larger, because P is closer to the charge.', 'The field at O is larger, because the fields from all sides add up at the center.', 'Both equal kQ/R², where R is the sphere\'s radius.'];
        title = 'No field inside a charged shell';
        bullets = ['Charge is on the outer surface', 'Near patch: close but small', 'Far side: far but large', 'Contributions cancel → E = 0 everywhere inside'];
        steps = [
          'The charge sits on the outer surface of the sphere.',
          'From a point near the wall, the nearby charge is close but there is little of it. Much more charge is on the far side, but it is farther away. With the 1/r² law these contributions cancel exactly.',
          'This holds everywhere inside the cavity, not just at the center. This is why a metal shell shields its interior.',
          B('E = 0 at both points.'),
        ];
      } else if (v === 'inside-V') {
        const Rcm = rng.int(5, 20), V = (K * Qn * 1e-9) / (Rcm / 100);
        prompt = `A metal sphere of radius ${Q(Rcm, tx('cm'))} carries charge ${Q(Qn, nC)}, which makes its surface ${Q(V, tx('V'))} relative to infinity. What is the electric potential at the center of the sphere?`;
        correct = `${Q(V, tx('V'))}, the same as at the surface`;
        wrongs = ['0 V, because the electric field inside is zero', `${Q(2 * V, tx('V'))}, because the center is closer to all the charge`, 'Infinite, because r = 0 at the center'];
        title = 'E = 0 inside ⇒ V constant';
        bullets = ['ΔV = −E·Δx', 'Inside: E = 0 → no change in V', `V(center) = V(surface) = ${sig(V, 3)} V`];
        steps = [
          'Potential changes only where there is a field: across a small step, ΔV = −EΔx.',
          'Inside a conductor in equilibrium E = 0, so V does not change as you move from the surface to the center.',
          `So V(center) = V(surface) = kQ/R ≈ ${sig(V, 3)} V. E = 0 does not mean V = 0. It means V is constant.`,
          B(`V = ${X(V)} V`),
        ];
      } else {
        prompt = 'Two metal spheres, one of radius R and one of radius 2R, are far apart and connected by a long thin wire. A total charge Q is placed on the system. After equilibrium, which statement is correct?';
        correct = 'They are at the same potential, and the larger sphere holds twice as much charge.';
        wrongs = ['They hold equal charges, Q/2 each.', 'They are at the same potential, and the smaller sphere holds more charge.', 'The smaller sphere is at higher potential, because its charge is more concentrated.'];
        title = 'Connected conductors share a potential';
        bullets = ['Charge flows until V₁ = V₂', 'kq₁/R = kq₂/(2R)', 'q₂ = 2q₁ → q₁ = Q/3, q₂ = 2Q/3'];
        steps = [
          'The wire makes the two spheres one conductor. Charge flows until there is no potential difference along it, so the spheres end at the same potential.',
          `For each sphere ${M('V = kq/r')}, so ${M('\\frac{kq_1}{R} = \\frac{kq_2}{2R} \\Rightarrow q_2 = 2q_1')}.`,
          'With q₁ + q₂ = Q: q₁ = Q/3 and q₂ = 2Q/3. The bigger sphere holds more charge, but the smaller sphere has the stronger surface field.',
          B('Same potential; the larger sphere has twice the charge.'),
        ];
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual: { key: 'concept', params: { title, bullets } } };
    },
  });

  gens.push({
    id: 'u1-spheres-connected', unit: 1, topic: 'Charge sharing between conductors',
    make(rng) {
      let r1, r2, q1, q2;
      do { r1 = rng.int(2, 12); r2 = rng.int(2, 12); q1 = sgn(rng) * rng.int(1, 20); q2 = sgn(rng) * rng.int(1, 20); } while (r1 === r2 || q1 + q2 === 0);
      const Qt = q1 + q2, q1f = (Qt * r1) / (r1 + r2), q2f = Qt - q1f, V = (K * Qt * 1e-9) / ((r1 + r2) / 100);
      const ask = rng.pick(['q1', 'V']);
      return {
        type: 'numeric',
        prompt: `Two metal spheres far apart have radii ${Q(r1, tx('cm'))} (sphere 1) and ${Q(r2, tx('cm'))} (sphere 2), and charges ${Q(q1, nC)} and ${Q(q2, nC)}. They are connected by a long, thin wire. ${ask === 'q1' ? 'What is the final charge on sphere 1? Answer in nC.' : 'What is the final potential of the spheres? Answer in V.'}`,
        given: giv(G.k),
        answer: sig(ask === 'q1' ? q1f : V, 3), units: ask === 'q1' ? 'nC' : 'V',
        steps: [
          `Charge flows through the wire until both spheres are at the same potential. The spheres are far apart, so each acts like an isolated sphere with ${M('V = kq/r')}.`,
          `Equal potentials: ${M(`\\frac{q_1'}{${r1}} = \\frac{q_2'}{${r2}}`)}, so the charge splits in proportion to the radii.`,
          `Charge is conserved: ${M(`q_1' + q_2' = ${q1} + (${q2}) = ${Qt}\\ \\text{nC}`)}. So ${M(`q_1' = ${Qt}\\cdot\\frac{${r1}}{${r1} + ${r2}} = ${fmt(q1f)}\\ \\text{nC}`)} and ${M(`q_2' = ${fmt(q2f)}\\ \\text{nC}`)}.`,
          ask === 'V' ? `${M(`V = \\frac{kq_1'}{r_1} = \\frac{(8.99 \\times 10^9)(${fmt(q1f)} \\times 10^{-9})}{${fmt(r1 / 100)}} = ${fmt(V)}\\ \\text{V}`)}` : `Check: the larger sphere ends with more charge, but both are at the same V.`,
          B(ask === 'q1' ? `q₁' ≈ ${X(q1f)} nC` : `V ≈ ${X(V)} V`),
        ],
        visual: { key: 'charging', params: { method: 'conduction', stage: 'Result', spheres: [{ before: q1 * 1e-9, after: q1f * 1e-9, r: r1 / 100 }, { before: q2 * 1e-9, after: q2f * 1e-9, r: r2 / 100 }] } },
      };
    },
  });

  // ======================================================================
  // UNIT 2 — DC CIRCUITS
  // ======================================================================
  const OM = '\\Omega';
  const leaf = (label, R, extra) => Object.assign({ label, R }, extra || {});
  const ser = (...items) => ({ type: 'series', items });
  const par = (...items) => ({ type: 'parallel', items });
  function reqOf(n) {
    if (n.type === 'series') return n.items.reduce((s, c) => s + reqOf(c), 0);
    if (n.type === 'parallel') {
      const rs = n.items.map(reqOf);
      if (rs.some((r) => r === 0)) return 0;
      const g = rs.reduce((s, r) => s + (isFinite(r) ? 1 / r : 0), 0);
      return g === 0 ? Infinity : 1 / g;
    }
    if (n.C !== undefined) return Infinity; // capacitor in steady state: open
    if (/^ammeter/i.test(n.label)) return 0; // ideal meters
    if (/^voltmeter/i.test(n.label)) return Infinity;
    return n.R;
  }
  function assign(n, I, V) {
    n._I = I; n._V = V;
    if (n.type === 'series') {
      const rs = n.items.map(reqOf);
      const open = rs.filter((r) => !isFinite(r)).length;
      n.items.forEach((c, i) => {
        if (open) assign(c, 0, isFinite(rs[i]) ? 0 : V / open);
        else assign(c, I, I * rs[i]);
      });
    } else if (n.type === 'parallel') {
      const rs = n.items.map(reqOf);
      const zeros = rs.filter((r) => r === 0).length;
      n.items.forEach((c, i) => assign(c, zeros ? (rs[i] === 0 ? I / zeros : 0) : isFinite(rs[i]) ? V / rs[i] : 0, zeros ? 0 : V));
    } else {
      n.I = I; n.V = V;
      if (n.C !== undefined) { n.Q = n.C * V; n.I = 0; }
    }
  }
  function solve(net, emf, r = 0) {
    const Req = reqOf(net);
    const I = isFinite(Req) ? emf / (Req + r) : 0;
    const V = emf - I * r;
    assign(net, I, V);
    return { Req, I, V };
  }
  function leaves(n, out = []) { if (n.items) n.items.forEach((c) => leaves(c, out)); else out.push(n); return out; }
  function clean(n) {
    if (n.items) return { type: n.type, items: n.items.map(clean) };
    const o = { label: n.label };
    for (const k of ['R', 'C', 'I', 'V', 'Q']) if (n[k] !== undefined && isFinite(n[k])) o[k] = sig(n[k], 4);
    if (n.bulb) o.bulb = true;
    if (n.open) { o.open = true; o.R = n.R0; o.I = 0; }
    if (n.short) { o.short = true; o.R = 0; }
    return o;
  }
  function cloneNet(n) { return n.items ? { type: n.type, items: n.items.map(cloneNet) } : Object.assign({}, n); }
  const RV = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60];
  const EMFS = [6, 9, 12, 18, 24];
  const ohm = (x) => Q(x, OM);

  gens.push({
    id: 'u2-ohm', unit: 2, topic: "Ohm's law",
    make(rng) {
      const V = rng.pick([1.5, 3, 4.5, 6, 9, 12, 24]), R = rng.pick([47, 68, 100, 150, 220, 330, 470, 680, 1000, 2200]);
      const I = V / R;
      const variant = rng.pick(['I', 'R', 'V']);
      let prompt, ans, units, solveTx;
      if (variant === 'I') {
        prompt = `A ${ohm(R)} resistor is connected across an ideal ${Q(V, tx('V'))} battery. What current flows through it? Answer in mA.`;
        ans = I * 1000; units = 'mA'; solveTx = `I = \\frac{V}{R} = \\frac{${V}}{${R}} = ${fmt(I)}\\ \\text{A}`;
      } else if (variant === 'R') {
        const Im = sig(I * 1000, 3);
        prompt = `When a ${Q(V, tx('V'))} potential difference is placed across a resistor, the current is ${Q(Im, tx('mA'))}. What is its resistance? Answer in Ω.`;
        ans = V / (Im / 1000); units = 'Ω'; solveTx = `R = \\frac{V}{I} = \\frac{${V}}{${fmt(Im / 1000)}} = ${fmt(ans)}\\ \\Omega`;
      } else {
        const Im = sig(I * 1000, 2);
        prompt = `A current of ${Q(Im, tx('mA'))} flows through a ${ohm(R)} resistor. What is the potential difference across it? Answer in V.`;
        ans = (Im / 1000) * R; units = 'V'; solveTx = `V = IR = (${fmt(Im / 1000)})(${R}) = ${fmt(ans)}\\ \\text{V}`;
      }
      const Vv = variant === 'V' ? ans : V, Ii = Vv / (variant === 'R' ? ans : R);
      return {
        type: 'numeric', prompt, given: '',
        answer: sig(ans, 3), units,
        steps: [
          `Current is the rate at which charge flows past a point (1 A = 1 C/s). Voltage is the energy each coulomb gives up crossing the resistor, the "height drop" on the roller coaster.`,
          `For an ohmic resistor the current is proportional to the voltage across it, and the constant of proportionality defines resistance: ${M('V = IR')}.`,
          `${M(solveTx)}`,
          B(`${variant} ≈ ${X(ans)} ${units}`),
        ],
        visual: { key: 'ohm', params: { V: Vv, I: Ii, R: Vv / Ii, P: Vv * Ii } },
      };
    },
  });

  gens.push({
    id: 'u2-bulb-rating', unit: 2, topic: 'Power ratings',
    make(rng) {
      const Vr = rng.pick([12, 120, 230]), Pr = rng.pick(Vr === 12 ? [6, 12, 18, 24, 36] : [25, 40, 60, 75, 100]);
      const R = (Vr * Vr) / Pr, Vn = sig(Vr * rng.pick([0.25, 0.5, 0.75]), 3), Pn = (Vn * Vn) / R;
      const ask = rng.pick(['R', 'P', 'I']);
      const ans = { R, P: Pn, I: Pr / Vr }[ask];
      const units = { R: 'Ω', P: 'W', I: 'A' }[ask];
      const q = { R: 'What is the resistance of its filament when lit normally? Answer in Ω.', P: `If it is instead connected to ${Q(Vn, tx('V'))}, what power does it use? Assume its resistance stays the same. Answer in W.`, I: 'What current does it draw when operating normally? Answer in A.' }[ask];
      const steps = [
        `A rating like "${Pr} W, ${Vr} V" means the bulb uses ${Pr} W when it has ${Vr} V across it. Power is the energy per second delivered by charges dropping through V: ${M('P = IV')}.`,
      ];
      if (ask === 'I') steps.push(`${M(`I = \\frac{P}{V} = \\frac{${Pr}}{${Vr}} = ${fmt(ans)}\\ \\text{A}`)}`);
      else {
        steps.push(`Combine with ${M('V = IR')}: ${M('P = V^2/R')}, so ${M(`R = \\frac{V^2}{P} = \\frac{${Vr}^2}{${Pr}} = ${fmt(R)}\\ \\Omega`)}.`);
        if (ask === 'P') steps.push(`At the new voltage: ${M(`P = \\frac{V^2}{R} = \\frac{${Vn}^2}{${fmt(R)}} = ${fmt(Pn)}\\ \\text{W}`)}. Power goes as V², so ${Vn / Vr === 0.5 ? 'half the voltage gives a quarter of the power' : 'it drops faster than the voltage'}.`);
      }
      steps.push(B(`${ask} ≈ ${X(ans)} ${units}`));
      return {
        type: 'numeric',
        prompt: `A light bulb is rated ${Q(Pr, tx('W'))} at ${Q(Vr, tx('V'))}. ${q}`,
        given: '', answer: sig(ans, 3), units, steps,
        visual: { key: 'ohm', params: ask === 'P' ? { V: Vn, I: Vn / R, R, P: Pn } : { V: Vr, I: Pr / Vr, R, P: Pr } },
      };
    },
  });

  const RHO = [
    { n: 'copper', rho: 1.68e-8 }, { n: 'aluminum', rho: 2.65e-8 }, { n: 'tungsten', rho: 5.6e-8 }, { n: 'nichrome', rho: 1.1e-6 },
  ];

  gens.push({
    id: 'u2-resistivity', unit: 2, topic: 'Resistivity',
    make(rng) {
      const m = rng.pick(RHO);
      const L = m.n === 'nichrome' ? rnd(rng, 0.5, 5, 2) : rnd(rng, 5, 80, 2);
      const dmm = rng.pick([0.2, 0.3, 0.5, 0.8, 1.0, 1.5, 2.0]);
      const A = Math.PI * Math.pow(dmm / 2000, 2), R = (m.rho * L) / A;
      return {
        type: 'numeric',
        prompt: `A ${m.n} wire (${M(`\\rho = ${fmt(m.rho)}\\ \\Omega\\cdot\\text{m}`)}) is ${Q(L, tx('m'))} long and has a diameter of ${Q(dmm, tx('mm'))}. What is its resistance? Answer in Ω.`,
        given: '',
        answer: sig(R, 3), units: 'Ω',
        steps: [
          `Resistance depends on the material and the shape. A longer wire means more collisions along the way (R ∝ L). A thicker wire gives more parallel paths for charge (R ∝ 1/A). So ${M('R = \\frac{\\rho L}{A}')}.`,
          `Cross-section: radius ${M(`r = ${dmm / 2}\\ \\text{mm} = ${fmt(dmm / 2000)}\\ \\text{m}`)}, so ${M(`A = \\pi r^2 = ${fmt(A)}\\ \\text{m}^2`)}. Use the radius, not the diameter.`,
          `${M(`R = \\frac{(${fmt(m.rho)})(${L})}{${fmt(A)}} = ${fmt(R)}\\ \\Omega`)}`,
          B(`R ≈ ${X(R)} Ω`),
        ],
        visual: { key: 'resistivity', params: { rho: m.rho, L, A, R, material: m.n } },
      };
    },
  });

  function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }
  function fracR(n, d) { const g = gcd(n, d); n /= g; d /= g; return d === 1 ? (n === 1 ? 'R' : `${n}R`) : `\\tfrac{${n}}{${d}}R`; }

  gens.push({
    id: 'u2-resistivity-scaling', unit: 2, topic: 'Resistivity (scaling)',
    make(rng) {
      const Lf = rng.pick([[1, 2], [2, 1], [3, 1], [1, 1]]), Df = rng.pick([[1, 2], [2, 1], [3, 1]]);
      const word = (f, what) => (f[0] === f[1] ? `the same ${what}` : f[1] === 2 ? `half the ${what}` : `${f[0] === 2 ? 'twice' : 'three times'} the ${what}`);
      const [ln, ld] = Lf, [dn, dd] = Df;
      const correct = M("R' = " + fracR(ln * dd * dd, ld * dn * dn));
      const wrongs = [
        M("R' = " + fracR(ln * dd, ld * dn)), M("R' = " + fracR(ln * dn * dn, ld * dd * dd)),
        M("R' = " + fracR(dd * dd, dn * dn)), M("R' = " + fracR(ln, ld)), M("R' = " + fracR(2 * ln * dd * dd, ld * dn * dn)),
      ];
      const L0 = 2, d0 = 1e-3, rho = 1.68e-8;
      const L = (L0 * ln) / ld, A = Math.PI * Math.pow((d0 * dn) / dd / 2, 2);
      return {
        type: 'mc',
        prompt: `A copper wire has resistance R. A second copper wire has ${word(Lf, 'length')} and ${word(Df, 'diameter')}. What is its resistance R'?`,
        ...mc(rng, correct, wrongs),
        steps: [
          `${M('R = \\rho L/A')}, and for a round wire ${M('A = \\pi (d/2)^2 \\propto d^2')}. The material is the same, so ρ does not change.`,
          `Length factor: ×${M(ln + '/' + ld)}. Area factor: ${M(`(${dn}/${dd})^2 = ${dn * dn}/${dd * dd}`)}, and R is divided by it.`,
          `${M(`R' = R \\times \\frac{${ln}}{${ld}} \\times \\frac{${dd * dd}}{${dn * dn}}`)}. The usual mistake is forgetting that area goes as diameter squared.`,
          B('Answer: ' + correct),
        ],
        visual: { key: 'resistivity', params: { rho, L, A, R: (rho * L) / A, material: 'copper' } },
      };
    },
  });

  gens.push({
    id: 'u2-series-parallel', unit: 2, topic: 'Series–parallel reduction',
    make(rng) {
      const E = rng.pick(EMFS), [R1, R2, R3] = [rng.pick(RV), rng.pick(RV), rng.pick(RV)];
      const topo = rng.pick(['A', 'B']);
      let net, prompt, ask, ans, units, steps;
      const L1 = leaf('R1', R1), L2 = leaf('R2', R2), L3 = leaf('R3', R3);
      if (topo === 'A') {
        net = ser(L1, par(L2, L3));
        const s = solve(net, E), R23 = (R2 * R3) / (R2 + R3);
        ask = rng.pick(['Req', 'I', 'I2', 'V3']);
        const q = { Req: 'What is the equivalent resistance of the circuit? Answer in Ω.', I: 'What current does the battery supply? Answer in A.', I2: 'What is the current through R2? Answer in A.', V3: 'What is the potential difference across R3? Answer in V.' }[ask];
        prompt = `An ideal ${Q(E, tx('V'))} battery is connected to ${M('R_1 = ' + R1 + '\\ ' + OM)} in series with a parallel pair, ${M('R_2 = ' + R2 + '\\ ' + OM)} and ${M('R_3 = ' + R3 + '\\ ' + OM)}. ${q}`;
        ans = { Req: s.Req, I: s.I, I2: L2.I, V3: L3.V }[ask];
        units = { Req: 'Ω', I: 'A', I2: 'A', V3: 'V' }[ask];
        steps = [
          `R2 and R3 connect between the same two points, so they are in parallel. They have the same voltage, and their currents add. ${M(`R_{23} = \\left(\\tfrac{1}{${R2}} + \\tfrac{1}{${R3}}\\right)^{-1} = ${fmt(R23)}\\ \\Omega`)}. A parallel combination is always smaller than either branch.`,
          `All of the battery's current goes through R1 and then through the pair, so R1 and R23 are in series and add: ${M(`R_{eq} = ${R1} + ${fmt(R23)} = ${fmt(s.Req)}\\ \\Omega`)}.`,
        ];
        if (ask !== 'Req') steps.push(`Battery current: ${M(`I = \\frac{\\varepsilon}{R_{eq}} = \\frac{${E}}{${fmt(s.Req)}} = ${fmt(s.I)}\\ \\text{A}`)}.`);
        if (ask === 'I2' || ask === 'V3') steps.push(`Loop rule: the pair gets whatever voltage R1 doesn't use: ${M(`V_{23} = \\varepsilon - IR_1 = ${E} - (${fmt(s.I)})(${R1}) = ${fmt(L3.V)}\\ \\text{V}`)}.`);
        if (ask === 'I2') steps.push(`${M(`I_2 = \\frac{V_{23}}{R_2} = \\frac{${fmt(L2.V)}}{${R2}} = ${fmt(L2.I)}\\ \\text{A}`)}`);
      } else {
        net = par(ser(L1, L2), L3);
        const s = solve(net, E);
        ask = rng.pick(['Req', 'I', 'I1', 'V2']);
        const q = { Req: 'What is the equivalent resistance of the circuit? Answer in Ω.', I: 'What current does the battery supply? Answer in A.', I1: 'What is the current through R1? Answer in A.', V2: 'What is the potential difference across R2? Answer in V.' }[ask];
        prompt = `An ideal ${Q(E, tx('V'))} battery is connected across two parallel branches. One branch has ${M('R_1 = ' + R1 + '\\ ' + OM)} and ${M('R_2 = ' + R2 + '\\ ' + OM)} in series. The other branch has ${M('R_3 = ' + R3 + '\\ ' + OM)} alone. ${q}`;
        ans = { Req: s.Req, I: s.I, I1: L1.I, V2: L2.V }[ask];
        units = { Req: 'Ω', I: 'A', I1: 'A', V2: 'V' }[ask];
        steps = [
          `Each branch connects directly across the battery, so <b>each branch gets the full ${E} V</b> (loop rule through that branch).`,
          `Branch 1 (series, resistances add): ${M(`R_{12} = ${R1} + ${R2} = ${R1 + R2}\\ \\Omega`)}, so ${M(`I_1 = \\frac{${E}}{${R1 + R2}} = ${fmt(L1.I)}\\ \\text{A}`)}. Branch 2: ${M(`I_3 = \\frac{${E}}{${R3}} = ${fmt(L3.I)}\\ \\text{A}`)}.`,
        ];
        if (ask === 'Req' || ask === 'I') steps.push(`Junction rule: ${M(`I = I_1 + I_3 = ${fmt(s.I)}\\ \\text{A}`)}, so ${M(`R_{eq} = \\varepsilon / I = ${fmt(s.Req)}\\ \\Omega`)}. Check: ${M(`(1/${R1 + R2} + 1/${R3})^{-1}`)} gives the same value.`);
        if (ask === 'V2') steps.push(`${M(`V_2 = I_1R_2 = (${fmt(L1.I)})(${R2}) = ${fmt(L2.V)}\\ \\text{V}`)}. The ${E} V splits between R1 and R2 in proportion to their resistances.`);
      }
      steps.push(B(`≈ ${X(ans)} ${units}`));
      return {
        type: 'numeric', prompt, given: '', answer: sig(ans, 3), units, steps,
        visual: { key: 'circuit', params: { emf: E, net: clean(net), ask: ask, highlight: { I2: 'R2', V3: 'R3', I1: 'R1', V2: 'R2' }[ask] } },
      };
    },
  });

  gens.push({
    id: 'u2-ladder', unit: 2, topic: 'Multi-step circuit reduction',
    make(rng) {
      const E = rng.pick(EMFS), [R1, R2, R3, R4] = [rng.pick(RV), rng.pick(RV), rng.pick(RV), rng.pick(RV)];
      const L1 = leaf('R1', R1), L2 = leaf('R2', R2), L3 = leaf('R3', R3), L4 = leaf('R4', R4);
      const net = ser(L1, par(L2, ser(L3, L4)));
      const s = solve(net, E);
      const R34 = R3 + R4, Rp = (R2 * R34) / (R2 + R34);
      const ask = rng.pick(['I4', 'V2', 'P4']);
      const ans = { I4: L4.I, V2: L2.V, P4: L4.I * L4.I * R4 }[ask], units = { I4: 'A', V2: 'V', P4: 'W' }[ask];
      const q = { I4: 'What is the current through R4? Answer in A.', V2: 'What is the potential difference across R2? Answer in V.', P4: 'At what rate is energy dissipated in R4? Answer in W.' }[ask];
      const steps = [
        `Work from the inside out. R3 and R4 are in series (same current, one path): ${M(`R_{34} = ${R3} + ${R4} = ${R34}\\ \\Omega`)}.`,
        `R2 is in parallel with that chain: ${M(`R_p = \\frac{(${R2})(${R34})}{${R2} + ${R34}} = ${fmt(Rp)}\\ \\Omega`)}. Then R1 is in series: ${M(`R_{eq} = ${R1} + ${fmt(Rp)} = ${fmt(s.Req)}\\ \\Omega`)}.`,
        `${M(`I = \\frac{${E}}{${fmt(s.Req)}} = ${fmt(s.I)}\\ \\text{A}`)}. The voltage across the parallel section is ${M(`V_p = IR_p = ${fmt(L2.V)}\\ \\text{V}`)}, which is also ${M('V_2')}.`,
      ];
      if (ask !== 'V2') steps.push(`The R3–R4 branch has the same ${fmt(L2.V)} V: ${M(`I_4 = \\frac{${fmt(L2.V)}}{${R34}} = ${fmt(L4.I)}\\ \\text{A}`)}${ask === 'P4' ? `, so ${M(`P_4 = I_4^2R_4 = (${fmt(L4.I)})^2(${R4}) = ${fmt(ans)}\\ \\text{W}`)}` : ''}.`);
      steps.push(B(`≈ ${X(ans)} ${units}`));
      return {
        type: 'numeric',
        prompt: `An ideal ${Q(E, tx('V'))} battery drives this network: ${M('R_1 = ' + R1 + '\\ ' + OM)} in series with a parallel section. One side of that section is ${M('R_2 = ' + R2 + '\\ ' + OM)}. The other side is ${M('R_3 = ' + R3 + '\\ ' + OM)} and ${M('R_4 = ' + R4 + '\\ ' + OM)} in series. ${q}`,
        given: '', answer: sig(ans, 3), units, steps,
        visual: { key: 'circuit', params: { emf: E, net: clean(net), ask, highlight: ask === 'V2' ? 'R2' : 'R4' } },
      };
    },
  });

  gens.push({
    id: 'u2-internal-r', unit: 2, topic: 'EMF & internal resistance',
    make(rng) {
      const E = rng.pick([1.5, 6, 9, 12]), r = rnd(rng, 0.2, 2, 2), R = rnd(rng, 1, 20, 2);
      const variant = rng.pick(['Vt', 'I', 'r']);
      const I = E / (R + r), Vt = E - I * r;
      const net = ser(leaf('R', R));
      let prompt, ans, units, steps;
      if (variant === 'r') {
        const Im = sig(I, 3), Vm = sig(E - Im * r, 3), rr = (E - Vm) / Im;
        prompt = `A battery with emf ${Q(E, tx('V'))} delivers a current of ${Q(Im, tx('A'))} to a load. A voltmeter across its terminals reads ${Q(Vm, tx('V'))}. What is the internal resistance of the battery? Answer in Ω.`;
        ans = rr; units = 'Ω';
        steps = [
          `A real battery acts like an ideal emf ε in series with a small internal resistance r. When current flows, some of the energy is lost inside the battery, so the terminal voltage is ${M('V_t = \\varepsilon - Ir')}.`,
          `The "missing" voltage is the drop inside: ${M(`Ir = \\varepsilon - V_t = ${E} - ${Vm} = ${fmt(E - Vm)}\\ \\text{V}`)}.`,
          `${M(`r = \\frac{${fmt(E - Vm)}}{${Im}} = ${fmt(rr)}\\ \\Omega`)}`,
          B(`r ≈ ${X(rr)} Ω`),
        ];
      } else {
        prompt = `A battery with emf ${Q(E, tx('V'))} and internal resistance ${ohm(r)} is connected to a ${ohm(R)} resistor. ${variant === 'I' ? 'What current flows? Answer in A.' : 'What is the terminal voltage (what a voltmeter across the battery reads)? Answer in V.'}`;
        ans = variant === 'I' ? I : Vt; units = variant === 'I' ? 'A' : 'V';
        steps = [
          `Model the battery as an ideal emf in series with r. The internal resistance and the load are in series around one loop.`,
          `Loop rule: ${M('\\varepsilon - Ir - IR = 0 \\Rightarrow I = \\frac{\\varepsilon}{R + r}')} ${M(`= \\frac{${E}}{${R} + ${r}} = ${fmt(I)}\\ \\text{A}`)}.`,
        ];
        if (variant === 'Vt') steps.push(`${M(`V_t = \\varepsilon - Ir = ${E} - (${fmt(I)})(${r}) = ${fmt(Vt)}\\ \\text{V}`)}, which equals ${M('IR')}, the voltage across the load. It is less than the emf.`);
        steps.push(B(`≈ ${X(ans)} ${units}`));
      }
      solve(net, E, r);
      return { type: 'numeric', prompt, given: '', answer: sig(ans, 3), units, steps, visual: { key: 'circuit', params: { emf: E, r, net: clean(net), ask: variant } } };
    },
  });

  gens.push({
    id: 'u2-terminal-voltage', unit: 2, topic: 'Terminal voltage (concept)',
    make(rng) {
      const E = rng.pick([6, 9, 12, 24]), r = rng.pick([0.5, 1, 2]), I = rng.pick([0.5, 1, 1.5, 2]);
      const variant = rng.pick(['charging', 'load']);
      const opt = (x) => Q(x, tx('V'));
      let prompt, correct, wrongs, steps, net;
      if (variant === 'charging') {
        prompt = `A rechargeable battery with emf ${Q(E, tx('V'))} and internal resistance ${ohm(r)} is being <b>charged</b>: a charger pushes ${Q(I, tx('A'))} into its positive terminal, backward through the battery. What does a voltmeter across the battery's terminals read?`;
        correct = opt(E + I * r);
        wrongs = [opt(E - I * r), opt(E), opt(I * r), opt(E + 2 * I * r)];
        steps = [
          'Model the battery as an ideal emf ε in series with internal resistance r.',
          `When it is being charged, current enters the + terminal and goes through r <i>toward</i> the emf. The charger must supply the emf plus the drop across r: ${M('V_t = \\varepsilon + Ir')}.`,
          `${M(`V_t = ${E} + (${I})(${r}) = ${E + I * r}\\ \\text{V}`)}. A discharging battery would read ε − Ir instead.`,
          B('Answer: ' + correct),
        ];
        net = ser({ label: 'charger', I, V: E + I * r });
      } else {
        const R1 = sig(E / I - r, 3), Vt = E - I * r;
        prompt = `A battery with emf ${Q(E, tx('V'))} delivers ${Q(I, tx('A'))} to a load, and its terminal voltage is ${Q(Vt, tx('V'))}. The load is replaced with one of <b>smaller</b> resistance. What will the terminal voltage be now?`;
        correct = `Less than ${opt(Vt)}`;
        wrongs = [opt(Vt), `Between ${opt(Vt)} and ${opt(E)}`, opt(E)];
        steps = [
          `The terminal voltage is ${M('V_t = \\varepsilon - Ir')}. The internal resistance here is ${M(`r = (${E} - ${Vt})/${I} = ${r}\\ \\Omega`)}.`,
          `A smaller load resistance lowers the total resistance ${M('R + r')}, so the current ${M('I = \\varepsilon/(R + r)')} increases.`,
          `More current means a bigger drop Ir inside the battery, so less voltage is left at the terminals.`,
          B(`V<sub>t</sub> drops below ${Vt} V.`),
        ];
        net = ser(leaf('load', R1));
        solve(net, E, r);
        const after = ser(leaf('load', sig(R1 / 2, 3)));
        const sa = solve(after, E, r);
        steps[2] = `More current means a bigger drop Ir inside the battery, so less voltage is left at the terminals. Example: halving the load to ${fmt(R1 / 2)} Ω gives ${M(`I = ${fmt(sa.I)}\\ \\text{A}`)} and ${M(`V_t = ${E} - (${fmt(sa.I)})(${r}) = ${fmt(sa.V)}\\ \\text{V}`)}.`;
        return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual: { key: 'circuit', params: { emf: E, r, net: clean(net), after: clean(after), ask: 'smaller load → more I → lower Vt', highlight: 'load' } } };
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual: { key: 'circuit', params: { emf: E, r, net: clean(net), ask: 'charging: Vt = ε + Ir' } } };
    },
  });

  gens.push({
    id: 'u2-kirchhoff', unit: 2, topic: "Kirchhoff's rules (two loops)",
    make(rng) {
      let E1, E2, R1, R2, R3, V, I1, I2, I3, s2;
      for (let t = 0; t < 20; t++) {
        E1 = rng.pick([6, 9, 12, 18]); E2 = rng.pick([3, 6, 9, 12]); s2 = sgn(rng);
        R1 = rng.pick([2, 3, 4, 5, 6]); R2 = rng.pick([2, 3, 4, 6, 8]); R3 = rng.pick([2, 4, 5, 6, 10]);
        const e2 = s2 * E2;
        V = (E1 / R1 + e2 / R2) / (1 / R1 + 1 / R2 + 1 / R3);
        I1 = (E1 - V) / R1; I2 = (e2 - V) / R2; I3 = V / R3;
        if (Math.abs(I3) > 0.05 && Math.abs(I1) > 0.05 && Math.abs(I2) > 0.05) break;
      }
      const e2 = s2 * E2;
      const ask = rng.pick(['I3', 'I1', 'VX']);
      const ans = { I3: Math.abs(I3), I1, VX: V }[ask], units = ask === 'VX' ? 'V' : 'A';
      const q = { I3: 'What is the magnitude of the current through R3? Answer in A.', I1: 'What is the current through R1, taking <i>upward</i> (from Y toward X through branch 1) as positive? Answer in A.', VX: 'What is the potential of X relative to Y (V<sub>X</sub> − V<sub>Y</sub>)? Answer in V.' }[ask];
      const ins = [], outs = [];
      [['I1', I1], ['I2', I2], ['I3', -I3]].forEach(([l, i]) => (i >= 0 ? ins : outs).push({ label: l, I: sig(Math.abs(i), 4) }));
      return {
        type: 'numeric',
        prompt: `Three branches connect node X (top) to node Y (bottom). Branch 1: a ${Q(E1, tx('V'))} battery with its + terminal toward X, in series with ${M('R_1 = ' + R1 + '\\ ' + OM)}. Branch 2: a ${Q(E2, tx('V'))} battery with its + terminal toward ${s2 > 0 ? 'X' : 'Y'}, in series with ${M('R_2 = ' + R2 + '\\ ' + OM)}. Branch 3: ${M('R_3 = ' + R3 + '\\ ' + OM)} alone. The batteries are ideal. ${q}`,
        given: '',
        answer: sig(ans, 3), units,
        steps: [
          `Let ${M('V_X')} be the potential of X with Y = 0 V. Going up each branch from Y to X, the loop rule says the potential rises by the emf and falls by IR, and you must end at ${M('V_X')}. So the upward current in branch 1 is ${M('I_1 = (\\varepsilon_1 - V_X)/R_1')}, in branch 2 it is ${M(`I_2 = (${s2 > 0 ? '' : '-'}\\varepsilon_2 - V_X)/R_2`)}, and the downward current through R3 is ${M('I_3 = V_X/R_3')}.`,
          `Junction rule at X (charge in = charge out): ${M('I_1 + I_2 = I_3')}. Substituting: ${M(`\\frac{${E1} - V_X}{${R1}} + \\frac{${e2} - V_X}{${R2}} = \\frac{V_X}{${R3}}`)}.`,
          `Solve: ${M(`V_X = \\frac{${E1}/${R1} + (${e2})/${R2}}{1/${R1} + 1/${R2} + 1/${R3}} = ${fmt(V)}\\ \\text{V}`)}.`,
          `Currents: ${M(`I_1 = ${fmt(I1)}\\ \\text{A}`)}, ${M(`I_2 = ${fmt(I2)}\\ \\text{A}`)}, ${M(`I_3 = ${fmt(I3)}\\ \\text{A}`)}. A negative value means that current actually flows opposite to the assumed direction. Check: ${M(`${fmt(I1)} + (${fmt(I2)}) = ${fmt(I1 + I2)}`)}.`,
          B(`≈ ${X(ans)} ${units}`),
        ],
        visual: { key: 'junction', params: { ins, outs, unknown: ask === 'I3' ? 'I3' : ask === 'I1' ? 'I1' : undefined } },
      };
    },
  });

  gens.push({
    id: 'u2-loop-rule', unit: 2, topic: 'Loop rule & potential',
    make(rng) {
      const E1 = rng.pick([9, 12, 18, 24]), hasE2 = rng() < 0.4, E2 = hasE2 ? rng.pick([3, 4.5, 6]) : 0;
      const r = rng() < 0.5 ? rnd(rng, 0.5, 2, 2) : 0;
      const R1 = rng.pick(RV.slice(0, 9)), R2 = rng.pick(RV.slice(0, 9)), R3 = rng.pick(RV.slice(0, 9));
      const Rt = R1 + R2 + R3 + r, I = (E1 - E2) / Rt;
      const ask = rng.pick(['I', 'VP', 'V2']);
      const VP = E1 - I * r - I * R1;
      const ans = { I, VP, V2: I * R2 }[ask], units = ask === 'I' ? 'A' : 'V';
      const elements = [];
      if (r) elements.push({ label: 'r', dV: sig(-I * r, 4) });
      elements.push({ label: 'R1', dV: sig(-I * R1, 4) }, { label: 'R2', dV: sig(-I * R2, 4) });
      if (hasE2) elements.push({ label: 'ε2', dV: -E2 });
      elements.push({ label: 'R3', dV: sig(-I * R3, 4) });
      const q = { I: 'What is the current in the loop? Answer in A.', VP: 'Point P is between R1 and R2. What is the potential at P relative to the negative terminal of the main battery? Answer in V.', V2: 'What is the potential difference across R2? Answer in V.' }[ask];
      return {
        type: 'numeric',
        prompt: `A single loop contains a ${Q(E1, tx('V'))} battery${r ? ` (internal resistance ${ohm(r)})` : ' (ideal)'} followed in order by ${M('R_1 = ' + R1 + '\\ ' + OM)}, ${M('R_2 = ' + R2 + '\\ ' + OM)}, ${hasE2 ? `a ${Q(E2, tx('V'))} ideal battery connected to <i>oppose</i> the first, ` : ''}and ${M('R_3 = ' + R3 + '\\ ' + OM)}. ${q}`,
        given: '',
        answer: sig(ans, 3), units,
        steps: [
          `Think of potential as height on a roller coaster. Going once around the loop you must return to the same height, so all the rises and drops add to zero (Kirchhoff's loop rule, which is energy conservation per coulomb).`,
          `Going in the direction of the current: +${E1} V up through the battery${r ? ', −Ir through the internal resistance' : ''}, −IR down through each resistor${hasE2 ? `, and −${E2} V through the opposing battery (from + to −)` : ''}.`,
          `${M(`${E1}${hasE2 ? ' - ' + E2 : ''} - I(${r ? r + ' + ' : ''}${R1} + ${R2} + ${R3}) = 0 \\Rightarrow I = \\frac{${fmt(E1 - E2)}}{${fmt(Rt)}} = ${fmt(I)}\\ \\text{A}`)}`,
          ask === 'VP' ? `Start at the − terminal (0 V), climb the battery, then go down: ${M(`V_P = ${E1}${r ? ` - (${fmt(I)})(${r})` : ''} - (${fmt(I)})(${R1}) = ${fmt(VP)}\\ \\text{V}`)}.` : ask === 'V2' ? `${M(`V_2 = IR_2 = (${fmt(I)})(${R2}) = ${fmt(I * R2)}\\ \\text{V}`)}` : `Same current everywhere in a single loop, because charge has nowhere else to go.`,
          B(`≈ ${X(ans)} ${units}`),
        ],
        visual: { key: 'loop-potential', params: { emf: E1, elements, I } },
      };
    },
  });

  gens.push({
    id: 'u2-junction', unit: 2, topic: 'Junction rule',
    make(rng) {
      const nin = rng.pick([1, 2, 3]);
      const vals = [];
      for (let i = 0; i < 3; i++) vals.push(sig(rng.int(2, 60) / 10, 2));
      { const si = vals.slice(0, nin).reduce((a, b) => a + b, 0), so = vals.slice(nin).reduce((a, b) => a + b, 0); if (Math.abs(si - so) < 0.15) vals[0] = sig(vals[0] + 1.5, 2); }
      const ins = vals.slice(0, nin).map((I, i) => ({ label: 'I' + (i + 1), I }));
      const outs = vals.slice(nin).map((I, i) => ({ label: 'I' + (nin + i + 1), I }));
      const sumIn = ins.reduce((s, x) => s + x.I, 0), sumOut = outs.reduce((s, x) => s + x.I, 0);
      const I4 = sig(sumIn - sumOut, 4); // + means leaving
      const visIns = ins.slice(), visOuts = outs.slice();
      (I4 >= 0 ? visOuts : visIns).push({ label: 'I4', I: Math.abs(I4) });
      const desc = (arr, dir) => arr.map((x) => `${x.I} A ${dir}`).join(', ');
      return {
        type: 'numeric',
        prompt: `Four wires meet at a junction. Three of the currents are ${[desc(ins, 'in'), desc(outs, 'out')].filter(Boolean).join('; ')}. What is the current in the fourth wire? Take <i>leaving</i> the junction as positive. Answer in A.`,
        given: '',
        answer: I4, units: 'A', tolerance: 0.03,
        steps: [
          'Charge is conserved and cannot pile up at a point, so every coulomb per second flowing in must flow out: ΣI<sub>in</sub> = ΣI<sub>out</sub> (junction rule).',
          `In: ${M(`${sumIn.toFixed(1)}\\ \\text{A}`)}. Known out: ${M(`${sumOut.toFixed(1)}\\ \\text{A}`)}.`,
          `${M(`I_4 = ${sumIn.toFixed(1)} - ${sumOut.toFixed(1)} = ${fmt(I4)}\\ \\text{A}`)}. ${I4 >= 0 ? 'Positive, so it leaves the junction.' : 'Negative, so it actually flows into the junction.'}`,
          B(`I₄ = ${X(I4)} A`),
        ],
        visual: { key: 'junction', params: { ins: visIns, outs: visOuts, unknown: 'I4' } },
      };
    },
  });

  gens.push({
    id: 'u2-power', unit: 2, topic: 'Electric power',
    make(rng) {
      const E = rng.pick(EMFS), R1 = rng.pick(RV), R2 = rng.pick(RV.filter((x) => x !== R1));
      const isSer = rng() < 0.5;
      const L1 = leaf('R1', R1), L2 = leaf('R2', R2);
      const net = isSer ? ser(L1, L2) : par(L1, L2);
      const s = solve(net, E);
      const ask = rng.pick(['P1', 'Ptot']);
      const P1 = L1.I * L1.V, Pt = s.I * E;
      const ans = ask === 'P1' ? P1 : Pt;
      const bigger = isSer ? (R1 > R2 ? 'R1' : 'R2') : (R1 < R2 ? 'R1' : 'R2');
      return {
        type: 'numeric',
        prompt: `Resistors ${M('R_1 = ' + R1 + '\\ ' + OM)} and ${M('R_2 = ' + R2 + '\\ ' + OM)} are connected in <b>${isSer ? 'series' : 'parallel'}</b> to an ideal ${Q(E, tx('V'))} battery. ${ask === 'P1' ? 'At what rate is energy dissipated in R1?' : 'What total power does the battery deliver?'} Answer in W.`,
        given: '', answer: sig(ans, 3), units: 'W',
        steps: [
          `Power is energy per time: each coulomb gives up V joules, and I coulombs pass per second, so ${M('P = IV = I^2R = V^2/R')}.`,
          isSer
            ? `In series both resistors carry the same current: ${M(`I = \\frac{${E}}{${R1} + ${R2}} = ${fmt(s.I)}\\ \\text{A}`)}. ${M(`P_1 = I^2R_1 = ${fmt(P1)}\\ \\text{W}`)}, ${M(`P_2 = ${fmt(L2.I * L2.V)}\\ \\text{W}`)}.`
            : `In parallel both have the full ${E} V: ${M(`P_1 = \\frac{${E}^2}{${R1}} = ${fmt(P1)}\\ \\text{W}`)}, ${M(`P_2 = \\frac{${E}^2}{${R2}} = ${fmt(L2.I * L2.V)}\\ \\text{W}`)}.`,
          ask === 'Ptot' ? `Total: ${M(`P = P_1 + P_2 = ${fmt(Pt)}\\ \\text{W}`)} (equal to ${M('\\varepsilon I')}). Energy is conserved.` : `Notice that in ${isSer ? 'series the larger' : 'parallel the smaller'} resistor (${bigger}) dissipates more power.`,
          B(`P ≈ ${X(ans)} W`),
        ],
        visual: { key: 'power', params: { elements: [L1, L2].map((l) => ({ label: l.label, R: l.R, I: sig(l.I, 4), V: sig(l.V, 4), P: sig(l.I * l.V, 4) })) } },
      };
    },
  });

  gens.push({
    id: 'u2-power-scaling', unit: 2, topic: 'Power (scaling)',
    make(rng) {
      const n = rng.pick([2, 3, 4]);
      const v = rng.pick(['nseries', 'nparallel', 'sameI', 'sameV']);
      const P = (num, den) => M((num === den ? '' : den === 1 ? num : `\\tfrac{${num}}{${den}}`) + 'P');
      let prompt, correct, wrongs, steps, els;
      const R0 = 10, E = 12;
      if (v === 'nseries' || v === 'nparallel') {
        const ser_ = v === 'nseries';
        prompt = `One resistor connected to an ideal battery dissipates power P. Then ${n} identical copies of that resistor are connected in <b>${ser_ ? 'series' : 'parallel'}</b> to the same battery. What total power is dissipated now?`;
        correct = ser_ ? P(1, n) : P(n, 1);
        wrongs = ser_ ? [P(n, 1), P(1, n * n), P(n * n, 1), P(1, 1)] : [P(1, n), P(n * n, 1), P(1, n * n), P(1, 1)];
        steps = [
          `The battery's voltage V is fixed, so use ${M('P_{total} = V^2/R_{eq}')}.`,
          ser_ ? `${n} in series: ${M(`R_{eq} = ${n}R`)}, so the current is cut by ${n}.` : `${n} in parallel: ${M(`R_{eq} = R/${n}`)}. Each resistor still gets the full V and dissipates P on its own.`,
          `${M(`P_{total} = \\frac{V^2}{${ser_ ? n + 'R' : 'R/' + n}} = ${ser_ ? `\\tfrac{1}{${n}}` : n}P`)}`,
          B('Answer: ' + correct),
        ];
        els = Array.from({ length: n }, (_, i) => {
          const I = ser_ ? E / (n * R0) : E / R0;
          return { label: 'R' + (i + 1), R: R0, I: sig(I, 4), V: sig(I * R0, 4), P: sig(I * I * R0, 4) };
        });
      } else {
        const sameI = v === 'sameI';
        prompt = sameI
          ? `A resistor R carries current I and dissipates power P. It is replaced by a resistor of ${n}R, and the <b>same current</b> I is maintained. What power is dissipated now?`
          : `A resistor R is connected across a fixed voltage V and dissipates power P. It is replaced by a resistor of ${n}R across the <b>same voltage</b>. What power is dissipated now?`;
        correct = sameI ? P(n, 1) : P(1, n);
        wrongs = sameI ? [P(1, n), P(n * n, 1), P(1, 1), P(1, n * n)] : [P(n, 1), P(1, n * n), P(1, 1), P(n * n, 1)];
        steps = [
          `Choose the power formula that uses the quantity that stays fixed. ${sameI ? `With I fixed, use ${M('P = I^2R')}.` : `With V fixed, use ${M('P = V^2/R')}.`}`,
          sameI ? `R goes up by a factor of ${n}, so P goes up by a factor of ${n}.` : `R goes up by a factor of ${n}, so the current drops by ${n} and P = V²/R drops by a factor of ${n}.`,
          `Using the "wrong" formula (e.g. ${sameI ? 'V²/R' : 'I²R'}) without accounting for how the other quantity changes gives the opposite answer, a common trap.`,
          B('Answer: ' + correct),
        ];
        els = [
          { label: 'R', R: R0, I: 1, V: R0, P: R0 },
          sameI ? { label: n + 'R', R: n * R0, I: 1, V: n * R0, P: n * R0 } : { label: n + 'R', R: n * R0, I: sig(R0 / (n * R0), 4), V: R0, P: sig((R0 * R0) / (n * R0), 4) },
        ];
      }
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual: { key: 'power', params: { elements: els } } };
    },
  });

  // Identical-bulb networks for brightness reasoning
  const BULB_NETS = [
    () => ser(B_('A'), par(B_('B'), B_('C'))),
    () => par(ser(B_('A'), B_('B')), B_('C')),
    () => ser(B_('A'), par(B_('B'), ser(B_('C'), B_('D')))),
    () => ser(B_('A'), B_('B'), par(B_('C'), B_('D'))),
    () => par(B_('A'), ser(B_('B'), par(B_('C'), B_('D')))),
    () => ser(par(B_('A'), B_('B')), par(B_('C'), B_('D'), B_('E'))),
  ];
  function B_(label) { return { label, R: 10, bulb: true }; }
  function describe(n, top = true) {
    if (!n.items) return 'bulb ' + n.label;
    const inner = n.items.map((c) => describe(c, false)).join(n.type === 'series' ? ' in series with ' : ' in parallel with ');
    return top ? inner : `[${inner}]`;
  }

  function secName(n) { return n.items ? `the ${leaves(n).map((l) => l.label).join('–')} group` : `bulb ${n.label}`; }
  function pathIdx(n, lab, p = []) {
    if (!n.items) return n.label === lab ? p : null;
    for (let i = 0; i < n.items.length; i++) { const r = pathIdx(n.items[i], lab, p.concat(i)); if (r) return r; }
    return null;
  }
  const nodeAt = (root, idx) => idx.reduce((n, i) => n.items[i], root);
  // Explain how current divides in a solved identical-bulb network (units of ε/R with R = 10 Ω).
  function splitText(net, E) {
    const u = (I) => M(`${fmt((I * 10) / E)}\\,\\varepsilon/R`);
    const parts = [];
    (function walk(n) {
      if (!n.items) return;
      if (n.type === 'parallel') {
        parts.push(`${n === net ? 'Each branch sits directly across the battery' : `The ${u(n._I)} reaching ${secName(n)} splits`}: ${n.items.map((c) => `${secName(c)} (${fmt(reqOf(c) / 10)}R) gets ${u(c._I)}`).join(', ')}. The lower-resistance path gets more current.`);
      } else {
        const direct = n.items.filter((c) => !c.items).map((c) => c.label);
        if (direct.length) parts.push(n === net
          ? `${direct.length > 1 ? 'Bulbs ' + direct.join(' and ') + ' are' : 'Bulb ' + direct[0] + ' is'} in the main line and carr${direct.length > 1 ? 'y' : 'ies'} all ${u(n._I)}.`
          : `${direct.length > 1 ? 'Bulbs ' + direct.join(' and ') + ' are in series in one branch, so they share' : 'Bulb ' + direct[0] + ' carries'} that branch's ${u(n._I)}.`);
      }
      n.items.forEach(walk);
    })(net);
    return parts.join(' ');
  }

  let bulbMismatch = 0;
  function tryBulbChange(rng, E, mk, forced) {
    const net = mk(), after = mk();
    const names = leaves(net).map((l) => l.label);
    let X_, Y_, change;
    if (forced) [X_, Y_, change] = forced;
    else { X_ = rng.pick(names); Y_ = rng.pick(names.filter((x) => x !== X_)); change = rng.pick(['remove', 'short']); }
    const tgt = leaves(after).find((l) => l.label === X_);
    if (change === 'remove') { tgt.R0 = tgt.R; tgt.R = Infinity; tgt.open = true; } else { tgt.R = 0; tgt.short = true; }
    if (reqOf(after) === 0) return null;
    solve(net, E); solve(after, E);
    const Pb = leaves(net).find((l) => l.label === Y_), Pa = leaves(after).find((l) => l.label === Y_);
    const pb = Pb.I * Pb.V, pa = Pa.I * Pa.V;
    const got = pa < 1e-9 ? 'out' : pa > pb * 1.001 ? 'up' : pa < pb * 0.999 ? 'down' : 'same';

    const px = pathIdx(net, X_), py = pathIdx(net, Y_);
    let k = 0; while (px[k] === py[k]) k++;
    const L = nodeAt(net, px.slice(0, k)), La = nodeAt(after, px.slice(0, k));
    const bx = nodeAt(net, px.slice(0, k + 1)), bxa = nodeAt(after, px.slice(0, k + 1));
    const by = nodeAt(net, py.slice(0, k + 1)), bya = nodeAt(after, py.slice(0, k + 1));
    const Rb = reqOf(net), Ra = reqOf(after);
    const R_ = (x) => M(isFinite(x) ? `${fmt(x / 10)}R` : '\\infty');
    const V_ = (x) => M(`${fmt(x / E)}\\,\\varepsilon`);
    const I_ = (x) => M(`${fmt((x * 10) / E)}\\,\\varepsilon/R`);
    const yPart = by.items ? `${secName(by)}, the part containing ${Y_}` : `bulb ${Y_}`;
    const xIn = bx.items ? `Bulb ${X_} is part of ${secName(bx)}, which` : `Bulb ${X_}`;
    let pred, why;
    if (change === 'remove') {
      if (!isFinite(Ra)) {
        pred = 'out';
        why = `Bulb ${X_} is in series with the battery and every other bulb, so all of the current has to pass through it. Removing it breaks the only path around the circuit. No current flows anywhere, so bulb ${Y_} goes out.`;
      } else if (L.type === 'series' && !isFinite(reqOf(La))) {
        pred = 'out';
        why = `Bulbs ${X_} and ${Y_} are in series in the same branch (${secName(L)}), so they carry the same current. Removing ${X_} opens that branch: no current can get through it, so ${Y_} goes out. The rest of the circuit still has a path, which is why the other bulbs can stay lit.`;
      } else if (L.type === 'series') {
        pred = 'down';
        why = `${xIn} is in series with ${yPart}. Removing ${X_} takes away a parallel path, so ${secName(bx)} rises from ${R_(reqOf(bx))} to ${R_(reqOf(bxa))} and the total from ${R_(Rb)} to ${R_(Ra)}. More resistance in series means less current through ${Y_}'s part: ${I_(by._I)} → ${I_(bya._I)}.`;
      } else if (k === 0) {
        pred = 'same';
        why = `Bulbs ${X_} and ${Y_} are on different branches, each connected directly across the ideal battery. ${Y_}'s branch always has the full ${M('\\varepsilon')} across it, whatever happens on ${X_}'s branch. Removing ${X_} only cuts the battery's total current. ${Y_}'s current stays ${I_(Pb.I)}.`;
      } else {
        pred = 'up';
        why = `Bulbs ${X_} and ${Y_} are on different branches of ${secName(L)}, a parallel section. Removing ${X_} takes away one of its paths, so the section's resistance rises from ${R_(reqOf(L))} to ${R_(reqOf(La))}. The section is in series with the rest of the circuit, so it now takes a larger share of the battery voltage: ${V_(L._V)} → ${V_(La._V)}. ${Y_}'s branch gets more voltage.`;
      }
    } else {
      if (L.type === 'parallel' && reqOf(bxa) === 0) {
        pred = 'out';
        why = `Bulbs ${X_} and ${Y_} are on parallel paths between the same two points. The wire across ${X_} joins those points with zero resistance, so the voltage between them drops to 0. Current takes the wire instead, and ${Y_} has nothing pushing current through it: it goes out.`;
      } else if (L.type === 'parallel' && k === 0) {
        pred = 'same';
        why = `Bulbs ${X_} and ${Y_} are on different branches, each connected directly across the ideal battery. Shorting ${X_} changes only ${X_}'s branch (${R_(reqOf(bx))} → ${R_(reqOf(bxa))}). ${Y_}'s branch still has the full ${M('\\varepsilon')}, so its current stays ${I_(Pb.I)}.`;
      } else if (L.type === 'parallel') {
        pred = 'down';
        why = `Bulbs ${X_} and ${Y_} are on different branches of ${secName(L)}. Shorting ${X_} lowers its branch (${R_(reqOf(bx))} → ${R_(reqOf(bxa))}), so the whole section drops from ${R_(reqOf(L))} to ${R_(reqOf(La))}. A smaller resistance in series with the rest gets a smaller share of the battery voltage: ${V_(L._V)} → ${V_(La._V)}.`;
      } else {
        pred = 'up';
        why = `${xIn} is in series with ${yPart}. Replacing ${X_} with a wire drops ${secName(bx)} from ${R_(reqOf(bx))} to ${R_(reqOf(bxa))}, so the total resistance falls (${R_(Rb)} → ${R_(Ra)}). More current flows through ${Y_}'s part: ${I_(by._I)} → ${I_(bya._I)}.`;
      }
    }
    if (pred !== got) { bulbMismatch++; return null; }
    const outcome = OUTS[got];
    const fin = got === 'out'
      ? `Bulb ${Y_}: ${V_(Pb.V)} before, 0 after, so it <b>goes out</b>.`
      : got === 'same'
        ? `Bulb ${Y_} keeps ${V_(Pb.V)} across it, so its brightness <b>stays the same</b>.`
        : `Bulb ${Y_}: ${V_(Pb.V)} → ${V_(Pa.V)}, so its power changes by ×${fmt(pa / pb)} and it <b>${got === 'up' ? 'gets brighter' : 'gets dimmer'}</b>.`;
    return {
      type: 'mc',
      prompt: `Identical bulbs are connected to an ideal battery: ${describe(net)}. Bulb ${X_} is then ${change === 'remove' ? '<b>removed</b> from its socket (leaving a gap)' : '<b>shorted</b> by a wire connected across its terminals'}. What happens to bulb ${Y_}?`,
      ...mc(rng, outcome, Object.values(OUTS).filter((x) => x !== outcome)),
      steps: [
        `For identical bulbs, brightness follows power, ${M('P = V^2/R')}. So track the voltage across bulb ${Y_}. Call each bulb's resistance R.`,
        `Before: ${M(`R_{eq} = ${fmt(Rb / 10)}R`)}, and bulb ${Y_} has ${V_(Pb.V)} across it.`,
        why,
        fin,
      ],
      visual: { key: 'circuit', params: { emf: E, net: clean(net), after: clean(after), ask: `bulb ${X_} ${change === 'remove' ? 'removed' : 'shorted'}`, highlight: Y_ } },
    };
  }
  const OUTS = { out: 'Goes out', same: 'Stays the same brightness', up: 'Gets brighter', down: 'Gets dimmer (but stays lit)' };

  gens.push({
    id: 'u2-bulb-change', unit: 2, topic: 'Bulb brightness: remove or short',
    make(rng) {
      const E = 12;
      let res = null;
      for (let t = 0; t < 40 && !res; t++) res = tryBulbChange(rng, E, rng.pick(BULB_NETS), null);
      return res || tryBulbChange(rng, E, BULB_NETS[0], ['B', 'C', 'remove']);
    },
  });
  Object.defineProperty(gens, '_bulbMismatch', { get: () => bulbMismatch });

  function rankString(ls) {
    const arr = ls.map((l) => ({ L: l.label, p: l.I * l.V })).sort((a, b) => b.p - a.p);
    let s = arr[0].L;
    for (let i = 1; i < arr.length; i++) s += (Math.abs(arr[i].p - arr[i - 1].p) < 1e-9 * (1 + arr[i].p) ? ' = ' : ' > ') + arr[i].L;
    return s;
  }

  gens.push({
    id: 'u2-bulb-rank', unit: 2, topic: 'Ranking bulb brightness',
    make(rng) {
      const E = 12, net = rng.pick(BULB_NETS)(), s = solve(net, E), ls = leaves(net);
      const correct = rankString(ls);
      const names = ls.map((l) => l.label);
      const wrongs = [
        names.join(' > '), // "current gets used up"
        names.join(' = '),
        correct.split(/ [>=] /).reverse().join(' > '),
      ];
      for (let i = 0; i < 6; i++) wrongs.push(rng.shuffle(names).join(' > '));
      const pw = ls.map((l) => `${M(`P_${l.label} = ${fmt((l.I * l.V) / ((E * E) / 10))}\\,\\varepsilon^2/R`)}`).join(', ');
      return {
        type: 'mc',
        prompt: `Identical bulbs are connected to an ideal battery: ${describe(net)}. Rank the bulbs from brightest to dimmest.`,
        ...mc(rng, correct, wrongs),
        steps: [
          'Identical bulbs: brightness follows power, P = I²R. More current means a brighter bulb. Current is not "used up" along the way; it splits only at junctions.',
          `${M(`R_{eq} = ${fmt(s.Req / 10)}R`)}, so the battery supplies ${M(`I = ${fmt((s.I * 10) / E)}\\,\\varepsilon/R`)}. ${splitText(net, E)}`,
          `Powers: ${pw}.`,
          B(`Ranking: ${correct}`),
        ],
        visual: { key: 'power', params: { elements: ls.map((l) => ({ label: l.label, R: l.R, I: sig(l.I, 4), V: sig(l.V, 4), P: sig(l.I * l.V, 4), bulb: true })) } },
      };
    },
  });

  gens.push({
    id: 'u2-meters', unit: 2, topic: 'Ammeters & voltmeters',
    make(rng) {
      const E = rng.pick([6, 9, 12]), R = rng.pick([10, 20, 30]);
      const meter = rng.pick(['ammeter', 'voltmeter', 'branch']);
      const real = meter === 'voltmeter' && rng() < 0.5;
      const r = real ? 1 : 0;
      let prompt, correct, wrongs, steps;
      const setup = `A battery${real ? ' with a small internal resistance' : ' with no internal resistance'} lights lamp L1. An ammeter is in the main line next to the battery${meter === 'branch' ? ', a second ammeter is in series with L1 alone,' : ''} and a voltmeter is across L1. A second identical lamp L2 is now connected in parallel with L1.`;
      if (meter === 'ammeter') {
        prompt = `${setup} What happens to the reading of the main-line ammeter?`;
        correct = 'It increases, because the battery now feeds two branches.';
        wrongs = ['It stays the same, because a battery provides a constant current.', 'It decreases, because adding a lamp increases the total resistance.', 'It stays the same, because charge is conserved.'];
        steps = [
          'Lamps in parallel each sit directly across the battery, so each gets the full battery voltage.',
          'Adding a parallel branch adds another path, which <i>lowers</i> the equivalent resistance (from R to R/2).',
          `So the battery supplies more current: from ${M(`\\varepsilon/R = ${fmt(E / R)}\\ \\text{A}`)} to ${M(`2\\varepsilon/R = ${fmt((2 * E) / R)}\\ \\text{A}`)}. A battery supplies a fixed voltage, not a fixed current.`,
          B('Main ammeter reading increases (doubles).'),
        ];
      } else if (meter === 'branch') {
        prompt = `${setup} What happens to the reading of the ammeter in series with L1?`;
        correct = 'It stays the same, because L1 still has the full battery voltage across it.';
        wrongs = ['It is cut in half, because the current now splits between two lamps.', 'It increases, because the total resistance decreases.', 'It drops to zero, because L2 provides an easier path.'];
        steps = [
          'With an ideal battery, the voltage across each parallel branch is the battery voltage, whatever else is connected.',
          `L1 still has ${E} V across it and the same resistance, so ${M(`I_1 = \\varepsilon/R = ${fmt(E / R)}\\ \\text{A}`)} does not change.`,
          'The <i>battery</i> current doubles to feed L2. It does not "split" a fixed amount.',
          B('The L1 ammeter reading stays the same.'),
        ];
      } else if (!real) {
        prompt = `${setup} What happens to the voltmeter reading?`;
        correct = 'It stays the same, because each parallel branch has the battery voltage.';
        wrongs = ['It decreases, because the current is split between the two branches.', 'It increases, because the total resistance increases.', 'It is cut in half, because the voltage is shared by two lamps.'];
        steps = [
          'Parallel elements connect to the same two nodes, so they have the same potential difference.',
          `With no internal resistance, those nodes are the battery terminals, fixed at ${E} V.`,
          'So L1 still has the full voltage. Voltage is shared in <i>series</i>, not in parallel.',
          B('Voltmeter reading stays the same.'),
        ];
      } else {
        prompt = `${setup} What happens to the voltmeter reading?`;
        correct = 'It decreases slightly, because more current through the internal resistance lowers the terminal voltage.';
        wrongs = ['It stays the same, because parallel branches always get the full emf.', 'It is cut in half, because the voltage is shared by two lamps.', 'It increases, because the total resistance increases.'];
        steps = [
          `The voltmeter reads the terminal voltage ${M('V_t = \\varepsilon - Ir')}.`,
          'Adding L2 in parallel lowers the load resistance, so the battery current I increases.',
          `A larger Ir drop inside the battery leaves less at the terminals. Example: ${M(`\\varepsilon = ${E}\\ \\text{V}, r = 1\\ \\Omega, R = ${R}\\ \\Omega`)}: ${M(`V_t`)} goes from ${fmt((E * R) / (R + 1))} V to ${fmt((E * R) / 2 / (R / 2 + 1))} V.`,
          B('It decreases slightly (not by half).'),
        ];
      }
      const mk = (withL2) => {
        const l1 = meter === 'branch' ? ser({ label: 'ammeter (L1)' }, leaf('L1', R, { bulb: true })) : leaf('L1', R, { bulb: true });
        const n = ser({ label: 'ammeter' }, par(l1, { label: 'voltmeter' }, ...(withL2 ? [leaf('L2', R, { bulb: true })] : [])));
        solve(n, E, r);
        return n;
      };
      const before = mk(false), net = mk(true);
      const params = { emf: E, net: clean(before), after: clean(net), ask: meter === 'voltmeter' ? 'voltmeter across L1' : meter === 'branch' ? 'ammeter in L1 branch' : 'main-line ammeter', highlight: 'L1' };
      if (real) params.r = r;
      return { type: 'mc', prompt, ...mc(rng, correct, wrongs), steps, visual: { key: 'circuit', params } };
    },
  });

  gens.push({
    id: 'u2-rc-series', unit: 2, topic: 'RC circuits',
    make(rng) {
      const E = rng.pick([6, 9, 12, 24]), R = rng.pick([10, 20, 50, 100, 200, 500]), CuF = rng.pick([2, 5, 10, 22, 47, 100]);
      const C = CuF * 1e-6, variant = rng.pick(['I0', 'Q', 'Vc']);
      let prompt, ans, units, steps, params;
      const base = `An uncharged ${Q(CuF, '\\mu\\text{F}')} capacitor is connected in series with a ${ohm(R)} resistor, an ideal ${Q(E, tx('V'))} battery, and an open switch. The switch is closed at t = 0.`;
      if (variant === 'I0') {
        ans = (E / R) * 1000; units = 'mA';
        prompt = `${base} What is the current immediately after the switch is closed? Answer in mA.`;
        steps = [
          'An uncharged capacitor has no voltage across it (V = Q/C = 0). At the first instant it acts like a plain wire.',
          `So the whole ${E} V appears across the resistor: ${M(`I_0 = \\varepsilon/R = ${E}/${R} = ${fmt(E / R)}\\ \\text{A}`)}.`,
          'As charge builds up, the capacitor voltage rises, the resistor\'s share falls, and the current decreases toward zero.',
          B(`I₀ ≈ ${X(ans)} mA`),
        ];
        params = { emf: E, R, C, Q: 0, Vc: 0, phase: 'charging-start' };
      } else if (variant === 'Q') {
        ans = C * E * 1e6; units = 'µC';
        prompt = `${base} After a long time, what is the charge on the capacitor? Answer in µC.`;
        steps = [
          'Charge flows until the capacitor voltage matches the battery. Then there is no voltage left for the resistor, so I = 0. A fully charged capacitor acts like an open switch.',
          `In steady state: ${M('V_C = \\varepsilon')} (the resistor doesn't matter for the final charge).`,
          `${M(`Q = CV = (${CuF} \\times 10^{-6})(${E}) = ${fmt(C * E)}\\ \\text{C}`)}`,
          B(`Q ≈ ${X(ans)} µC`),
        ];
        params = { emf: E, R, C, Q: C * E, Vc: E, phase: 'steady' };
      } else {
        const I = sig((E / R) * rng.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75]), 3);
        ans = E - I * R; units = 'V';
        prompt = `${base} At a certain moment the current is ${Q(I * 1000, tx('mA'))}. What is the voltage across the capacitor at that moment? Answer in V.`;
        steps = [
          `Loop rule at any instant: ${M('\\varepsilon - IR - V_C = 0')}. The battery's voltage is shared between the resistor and the capacitor.`,
          `Resistor: ${M(`IR = (${fmt(I)})(${R}) = ${fmt(I * R)}\\ \\text{V}`)}.`,
          `${M(`V_C = ${E} - ${fmt(I * R)} = ${fmt(ans)}\\ \\text{V}`)}`,
          B(`V<sub>C</sub> ≈ ${X(ans)} V`),
        ];
        params = { emf: E, R, C, Q: C * ans, Vc: ans, phase: 'charging-start' };
      }
      return { type: 'numeric', prompt, given: '', answer: sig(ans, 3), units, steps, visual: { key: 'rc', params } };
    },
  });

  gens.push({
    id: 'u2-rc-steady', unit: 2, topic: 'Capacitors in DC circuits (steady state)',
    make(rng) {
      const E = rng.pick(EMFS), R1 = rng.pick(RV), R2 = rng.pick(RV), CuF = rng.pick([2, 3, 5, 10, 20]);
      const L1 = leaf('R1', R1), L2 = leaf('R2', R2), Cl = { label: 'C', C: CuF * 1e-6 };
      const net = ser(L1, par(L2, Cl));
      const s = solve(net, E);
      const ask = rng.pick(['Q', 'I', 'Vc']);
      const ans = { Q: Cl.Q * 1e6, I: s.I, Vc: Cl.V }[ask], units = { Q: 'µC', I: 'A', Vc: 'V' }[ask];
      const q = { Q: 'What is the charge on the capacitor? Answer in µC.', I: 'What current does the battery supply? Answer in A.', Vc: 'What is the voltage across the capacitor? Answer in V.' }[ask];
      return {
        type: 'numeric',
        prompt: `An ideal ${Q(E, tx('V'))} battery is connected to ${M('R_1 = ' + R1 + '\\ ' + OM)} in series with a parallel pair: ${M('R_2 = ' + R2 + '\\ ' + OM)} and a ${Q(CuF, '\\mu\\text{F}')} capacitor. The circuit has been connected for a long time. ${q}`,
        given: '', answer: sig(ans, 3), units,
        steps: [
          'After a long time the capacitor is fully charged and no current flows into it, so it acts like an open switch (a break in the wire).',
          `So current flows only through R1 and R2 in series: ${M(`I = \\frac{${E}}{${R1} + ${R2}} = ${fmt(s.I)}\\ \\text{A}`)}.`,
          `The capacitor is in parallel with R2, so it has the same voltage: ${M(`V_C = IR_2 = ${fmt(Cl.V)}\\ \\text{V}`)}.`,
          ask === 'Q' ? `${M(`Q = CV_C = (${CuF} \\times 10^{-6})(${fmt(Cl.V)}) = ${fmt(Cl.Q)}\\ \\text{C}`)}` : 'The capacitor branch carries no steady current, but it still holds charge.',
          B(`≈ ${X(ans)} ${units}`),
        ],
        visual: { key: 'circuit', params: { emf: E, net: clean(net), ask, highlight: ask === 'I' ? 'R1' : 'C' } },
      };
    },
  });

  gens.push({
    id: 'u2-rc-concept', unit: 2, topic: 'Capacitors in circuits (concept)',
    make(rng) {
      const E = rng.pick([6, 12, 18]), R1 = rng.pick([2, 3, 4, 6]), R2 = rng.pick([3, 6, 8, 12]), CuF = rng.pick([5, 10, 20]);
      const when = rng.pick(['start', 'steady']);
      const what = rng.pick(['I1', 'I2']);
      const amp = (x) => Q(x, tx('A'));
      const vals = { start: { I1: E / R1, I2: 0 }, steady: { I1: E / (R1 + R2), I2: E / (R1 + R2) } }[when];
      const correct = amp(vals[what]);
      const wrongs = [amp(E / (R1 + R2)), amp(E / R1), amp(0), amp(E / R2), amp((E / R1) * 0.5), amp((2 * E) / R1), amp((E * (R1 + R2)) / (R1 * R2))];
      const C = CuF * 1e-6;
      const Vc = when === 'start' ? 0 : (E * R2) / (R1 + R2);
      const Ic = when === 'start' ? E / R1 : 0, Ir = E / (when === 'start' ? R1 : R1 + R2);
      const rcNet = ser({ label: 'R1', R: R1, I: sig(Ir, 4), V: sig(Ir * R1, 4) }, par({ label: 'R2', R: R2, I: sig(when === 'start' ? 0 : Ir, 4), V: sig(Vc, 4) }, { label: 'C', C, Q: sig(C * Vc, 4), V: sig(Vc, 4), I: sig(Ic, 4) }));
      return {
        type: 'mc',
        prompt: `An ideal ${Q(E, tx('V'))} battery, a switch, and ${M('R_1 = ' + R1 + '\\ ' + OM)} are in series with a parallel pair: ${M('R_2 = ' + R2 + '\\ ' + OM)} and an initially uncharged ${Q(CuF, '\\mu\\text{F}')} capacitor. What is the current through ${what === 'I1' ? 'R1' : 'R2'} ${when === 'start' ? '<b>immediately after</b> the switch is closed' : '<b>a long time after</b> the switch is closed'}?`,
        ...mc(rng, correct, wrongs),
        steps: [
          when === 'start'
            ? 'At the first instant the capacitor is uncharged, so V<sub>C</sub> = Q/C = 0 and it acts like a wire. A wire in parallel with R2 shorts it: R2 has 0 V across it and carries no current.'
            : 'After a long time the capacitor is full and carries no current, so it acts like an open switch. R1 and R2 are then simply in series.',
          when === 'start'
            ? `So all of the current goes through R1 and the capacitor: ${M(`I_1 = \\varepsilon/R_1 = ${fmt(E / R1)}\\ \\text{A}`)}, ${M('I_2 = 0')}.`
            : `${M(`I_1 = I_2 = \\frac{\\varepsilon}{R_1 + R_2} = ${fmt(E / (R1 + R2))}\\ \\text{A}`)}, and the capacitor ends at ${M(`V_C = I R_2 = ${fmt(Vc)}\\ \\text{V}`)}.`,
          'Rule of thumb: an uncharged capacitor acts like a wire, and a fully charged one acts like a break.',
          B('Answer: ' + correct),
        ],
        visual: { key: 'circuit', params: { emf: E, net: rcNet, ask: when === 'start' ? 'just after the switch closes' : 'long after (steady state)', highlight: what === 'I1' ? 'R1' : 'R2' } },
      };
    },
  });

  gens.push({
    id: 'u2-cap-network', unit: 2, topic: 'Capacitor combinations',
    make(rng) {
      const E = rng.pick([6, 9, 12, 18, 24]), c = [rng.pick([2, 3, 4, 6]), rng.pick([1, 2, 3, 4]), rng.pick([1, 2, 3, 5])];
      const [C1, C2, C3] = c;
      const C23 = C2 + C3, Ceq = (C1 * C23) / (C1 + C23), Qt = Ceq * E, V23 = Qt / C23, V1 = Qt / C1;
      const ask = rng.pick(['Q2', 'V1', 'Ceq']);
      const ans = { Q2: C2 * V23, V1, Ceq }[ask], units = { Q2: 'µC', V1: 'V', Ceq: 'µF' }[ask];
      const q = { Q2: 'What is the charge on C2? Answer in µC.', V1: 'What is the voltage across C1? Answer in V.', Ceq: 'What is the equivalent capacitance? Answer in µF.' }[ask];
      const net = ser({ label: 'C1', C: C1 * 1e-6, Q: sig(Qt * 1e-6, 4), V: sig(V1, 4) }, par({ label: 'C2', C: C2 * 1e-6, Q: sig(C2 * V23 * 1e-6, 4), V: sig(V23, 4) }, { label: 'C3', C: C3 * 1e-6, Q: sig(C3 * V23 * 1e-6, 4), V: sig(V23, 4) }));
      const steps = [
        `Parallel capacitors share a voltage and their plate areas effectively add: ${M(`C_{23} = ${C2} + ${C3} = ${C23}\\ \\mu\\text{F}`)}.`,
        `C1 is in series with that pair. Charge that leaves one plate must arrive on the next, so series capacitors carry the same charge: ${M(`C_{eq} = \\left(\\tfrac{1}{${C1}} + \\tfrac{1}{${C23}}\\right)^{-1} = ${fmt(Ceq)}\\ \\mu\\text{F}`)}.`,
      ];
      if (ask !== 'Ceq') {
        steps.push(`${M(`Q_1 = Q_{23} = C_{eq}\\varepsilon = (${fmt(Ceq)})(${E}) = ${fmt(Qt)}\\ \\mu\\text{C}`)}.`);
        steps.push(ask === 'V1' ? `${M(`V_1 = Q_1/C_1 = ${fmt(Qt)}/${C1} = ${fmt(V1)}\\ \\text{V}`)}` : `${M(`V_{23} = ${fmt(Qt)}/${C23} = ${fmt(V23)}\\ \\text{V}`)}, so ${M(`Q_2 = C_2V_{23} = (${C2})(${fmt(V23)}) = ${fmt(C2 * V23)}\\ \\mu\\text{C}`)}.`);
      }
      steps.push(B(`≈ ${X(ans)} ${units}`));
      return {
        type: 'numeric',
        prompt: `A ${Q(C1, '\\mu\\text{F}')} capacitor C1 is connected in series with a parallel pair, C2 = ${Q(C2, '\\mu\\text{F}')} and C3 = ${Q(C3, '\\mu\\text{F}')}, across an ideal ${Q(E, tx('V'))} battery. All are fully charged. ${q}`,
        given: '', answer: sig(ans, 3), units, steps,
        visual: { key: 'circuit', params: { emf: E, net, ask, highlight: ask === 'V1' ? 'C1' : ask === 'Q2' ? 'C2' : undefined } },
      };
    },
  });

  // ======================================================================
  // generate / check
  // ======================================================================
  function seedNum(seed) {
    if (typeof seed === 'number' && isFinite(seed)) return seed >>> 0;
    const s = String(seed);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function mix(a, b) {
    let h = (Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) + Math.imul(b + 1, 0xc2b2ae35)) >>> 0;
    h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
    return h >>> 0;
  }

  function generate(seed, count, units) {
    const s = seedNum(seed);
    const us = Array.isArray(units) && units.length ? units.map(Number) : [1, 2];
    let pool = gens.filter((g) => us.includes(g.unit));
    if (!pool.length) pool = gens;
    const master = PR.rng(mix(s, 0x5eed));
    const out = [];
    let bag = [], last = null;
    for (let i = 0; i < count; i++) {
      if (!bag.length) {
        bag = master.shuffle(pool);
        if (bag.length > 1 && bag[0] === last) { const t = bag[0]; bag[0] = bag[1]; bag[1] = t; }
      }
      const g = bag.shift();
      last = g;
      const p = g.make(PR.rng(mix(s, i)));
      out.push(Object.assign({ id: `${g.id}-${seed}-${i}`, unit: g.unit, topic: g.topic }, p));
    }
    return out;
  }

  function parseNum(resp) {
    if (resp === null || resp === undefined) return null;
    let s = String(resp).trim().replace(/[\u2212\u2013\u2014]/g, '-').replace(/\s+/g, '').replace(/,/g, '');
    if (!s) return null;
    let m = s.match(/^([+-]?)10\^\{?\(?([+-]?\d+)\)?\}?/);
    if (m) return Number(m[1] + '1') * Math.pow(10, Number(m[2]));
    m = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:[eE]([+-]?\d+)|[x×X*·]10(?:\^|\*\*)\{?\(?([+-]?\d+)\)?\}?)?/);
    if (!m) return null;
    let v = Number(m[1]);
    const e = m[2] !== undefined ? m[2] : m[3];
    if (e !== undefined) v *= Math.pow(10, Number(e));
    return isFinite(v) ? v : null;
  }

  function check(problem, response) {
    if (!problem) return false;
    if (problem.type === 'mc') return response !== '' && response !== null && Number(response) === problem.correct;
    const x = parseNum(response);
    if (x === null) return false;
    const a = Number(problem.answer);
    if (a === 0) return Math.abs(x) <= (problem.absTol || 1e-9);
    const tol = problem.tolerance != null ? problem.tolerance : 0.03;
    return Math.abs(x - a) <= tol * Math.abs(a);
  }

  return { generators: gens, generate, check, parseNum };
})();
