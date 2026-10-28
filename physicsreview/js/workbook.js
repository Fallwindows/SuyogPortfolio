// Fixed bank of duel problems that follow the student's AP Physics 2 workbook
// (Electrostatics MC = unit 1, Circuits MC = unit 2). Each problem is a restatement
// in our own words (same situation, numbers and answer) with a `source` pointer
// so the student can cross-reference the workbook. Order and answer letters match
// the workbook. Loaded as a classic script; attaches window.PRWorkbook.
window.PRWorkbook = (function () {
  var LET = 'ABCDE';
  var problems = [];

  function add(unit, n, topic, prompt, choices, letter, steps, visual, figure) {
    var correct = typeof letter === 'number' ? letter : LET.indexOf(letter);
    var p = {
      id: (unit === 1 ? 'wb-es-' : 'wb-ci-') + n,
      unit: unit,
      topic: topic,
      type: 'mc',
      prompt: prompt,
      choices: choices,
      correct: correct,
      steps: steps,
      visual: visual,
      source: (unit === 1 ? 'Workbook Electrostatics MC #' : 'Workbook Circuits MC #') + n,
    };
    if (figure) p.figure = figure;
    problems.push(p);
  }
  function es(n, topic, prompt, choices, letter, steps, visual, figure) {
    add(1, n, topic, prompt, choices, letter, steps, visual, figure);
  }
  function ci(n, topic, prompt, choices, letter, steps, visual, figure) {
    add(2, n, topic, prompt, choices, letter, steps, visual, figure);
  }

  // ---- visual helpers ----
  function concept(title, bullets) { return { key: 'concept', params: { title: title, bullets: bullets } }; }
  function fmap(charges, ask, points) {
    var p = { charges: charges };
    if (ask) p.ask = ask;
    if (points) p.points = points;
    return { key: 'field-map', params: p };
  }
  function q(qv, x, y) { return { q: qv, x: x, y: y }; }
  function pt(x, y, label) { return { x: x, y: y, label: label }; }
  function circuit(emf, net, opts) {
    var p = { emf: emf, net: net };
    if (opts) for (var k in opts) p[k] = opts[k];
    return { key: 'circuit', params: p };
  }
  function S() { return { type: 'series', items: Array.prototype.slice.call(arguments) }; }
  function Pl() { return { type: 'parallel', items: Array.prototype.slice.call(arguments) }; }
  function R(label, r, extra) {
    var o = { label: label };
    if (r != null) o.R = r;
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  function Cp(label, c, extra) {
    var o = { label: label };
    if (c != null) o.C = c;
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  function Bulb(label, r, extra) {
    var o = { label: label, bulb: true };
    if (r != null) o.R = r;
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  function vis(key, params) { return { key: key, params: params }; }

  var k = 8.99e9;

  // ===================== UNIT 1: ELECTROSTATICS =====================

  es(1, "Conductors",
    "A solid metal sphere is given a net positive charge \\(Q\\). Where does that charge end up?",
    ["Bunched up at the center of the sphere.", "Spread evenly through the whole volume of the sphere.",
     "Densest at the center, thinning out toward the edge.", "Spread evenly over the outer surface only."],
    "D",
    ["In a conductor, charges are free to move.",
     "Like charges repel, so the excess charges push each other as far apart as they can get: the outer surface.",
     "For a sphere, symmetry makes that surface layer uniform, and the field inside the metal is zero."],
    concept("Excess charge on a conductor", ["Free charges repel each other", "They migrate to the outer surface", "Inside the metal: E = 0"]));

  es(2, "Capacitors",
    "A parallel-plate capacitor is charged by a battery. The battery is then disconnected, and the plates are pulled farther apart. What happens to the charge on the plates and the voltage between them?",
    ["Both stay the same.", "Both increase.", "Charge increases, voltage decreases.", "Charge stays the same, voltage increases."],
    "D",
    ["Disconnected means the charge has nowhere to go: \\(Q\\) is fixed.",
     "\\(C = \\varepsilon_0 A/d\\), so increasing \\(d\\) decreases \\(C\\).",
     "\\(V = Q/C\\): fixed \\(Q\\) over a smaller \\(C\\) gives a larger \\(V\\)."],
    concept("Isolated capacitor, plates pulled apart", ["Q fixed (nowhere to go)", "d up → C = ε₀A/d down", "V = Q/C goes up"]));

  es(3, "Potential difference",
    "It takes 1 J of work to move 1 C of charge between two points without changing its speed. What is true about those two points?",
    ["The current between them is 1 A.", "The potential difference between them is 1 V.",
     "The electric field there is 1 N/C.", "The electric field there is 1 J per electron."],
    "B",
    ["With no change in speed, all the work goes into electric potential energy: \\(W = q\\Delta V\\).",
     "\\(\\Delta V = W/q = 1\\text{ J}/1\\text{ C} = 1\\text{ V}\\).",
     "A volt is literally a joule per coulomb. Nothing here tells us a current or a field strength."],
    vis('work-dv', { q: 1, Va: 0, Vb: 1, W: 1, dK: 0 }));

  var fig45 = fmap([q(1, -1, 0), q(1, 1, 0)], "Origin A between the charges; B at x = 2d, C at x = 3d, D at (−d, −d)", [pt(0, 0, 'A'), pt(2, 0, 'B'), pt(3, 0, 'C'), pt(-1, -1, 'D')]);
  es(4, "Electric field",
    "Two equal positive charges \\(+q\\) sit on the x-axis at \\(x = -d\\) and \\(x = +d\\). Point A is the origin, B is at \\(x = 2d\\), C is at \\(x = 3d\\), and D is at \\((-d, -d)\\). At which point is the electric field weakest?",
    ["A", "B", "C", "D"],
    "A",
    ["Each charge makes a field pointing away from itself.",
     "At A the two fields have equal size (both a distance \\(d\\) away) and opposite directions.",
     "So they cancel exactly: \\(E_A = 0\\), which is as weak as it gets. At B, C and D the fields do not cancel."],
    { key: 'field-map', params: { charges: fig45.params.charges, points: fig45.params.points, point: { x: 0, y: 0 } } }, fig45);

  es(5, "Electric potential",
    "Same setup: \\(+q\\) at \\(x = -d\\) and \\(+q\\) at \\(x = +d\\), with A at the origin, B at \\(x = 2d\\), C at \\(x = 3d\\), and D at \\((-d,-d)\\). At which point is the electric potential largest?",
    ["A", "B", "C", "D"],
    "A",
    ["Potential is a scalar: just add \\(kq/r\\) from each charge, no directions.",
     "A: \\(kq/d + kq/d = 2kq/d\\). B: \\(kq/d + kq/3d \\approx 1.33\\,kq/d\\). D: \\(kq/d + kq/(\\sqrt5 d) \\approx 1.45\\,kq/d\\). C is smaller still.",
     "A, closest to both charges, wins. Notice that E is zero at A while V is at its largest."],
    vis('potential', { charges: [{ q: 1, x: -1, y: 0 }, { q: 1, x: 1, y: 0 }], point: { x: 0, y: 0 }, V: 2 * k }), fig45);

  es(6, "Capacitors",
    "A parallel-plate capacitor has capacitance \\(C_0\\). A second one has plates with twice the area and twice the gap. Its capacitance is about",
    ["\\(\\tfrac14 C_0\\)", "\\(C_0\\)", "\\(2C_0\\)", "\\(4C_0\\)"],
    "B",
    ["\\(C = \\varepsilon_0 A/d\\).",
     "Doubling \\(A\\) doubles \\(C\\); doubling \\(d\\) halves it.",
     "\\(\\varepsilon_0(2A)/(2d) = \\varepsilon_0 A/d = C_0\\)."],
    concept("C = ε₀A/d", ["Area × 2 → C × 2", "Gap × 2 → C ÷ 2", "Net: unchanged"]));

  es(7, "Coulomb's law",
    "Two identical metal spheres carry \\(+2Q\\) and \\(-Q\\) and are a distance \\(d\\) apart (much larger than their size). The attractive force on the left sphere is \\(F_1\\). They are touched together, then put back at distance \\(d\\); now the force is \\(F_2\\). Which is correct?",
    ["\\(2F_1 = F_2\\)", "\\(F_1 = F_2\\)", "\\(F_1 = 2F_2\\)", "\\(F_1 = 8F_2\\)"],
    "D",
    ["Before: \\(F_1 \\propto (2Q)(Q) = 2Q^2\\).",
     "Touching identical spheres shares the net charge equally: \\((2Q - Q)/2 = Q/2\\) each.",
     "After: \\(F_2 \\propto (Q/2)(Q/2) = Q^2/4\\), which is \\(1/8\\) of \\(2Q^2\\). So \\(F_1 = 8F_2\\) (and now they repel)."],
    vis('coulomb', { q1: 2e-6, q2: -1e-6, r: 0.1, F: k * 2e-12 / 0.01 }));

  es(8, "Capacitors",
    "Which change increases the capacitance of a parallel-plate capacitor?",
    ["Increasing the gap between the plates", "Increasing the charge on each plate", "Increasing the plate area", "Increasing the voltage across the plates"],
    "C",
    ["\\(C = \\varepsilon_0 A/d\\) depends only on geometry (and the material between the plates).",
     "More charge or more voltage changes \\(Q\\) and \\(V\\) together; their ratio \\(C\\) stays put.",
     "Bigger \\(A\\) raises \\(C\\); bigger \\(d\\) lowers it."],
    concept("What sets C?", ["Plate area A (bigger → more C)", "Gap d (bigger → less C)", "Dielectric κ", "NOT Q or V"]));

  es(9, "Conductors",
    "A hollow metal sphere of radius \\(R\\) carries positive charge. At which distance from the center is the field strongest?",
    ["0 (the center)", "\\(3R/2\\)", "\\(2R\\)", "None: the field is the same strength everywhere"],
    "B",
    ["Inside a charged metal shell the field is zero, so the center has \\(E = 0\\).",
     "Outside, the shell acts like a point charge: \\(E = kQ/r^2\\), which shrinks with distance.",
     "The closest outside point, \\(3R/2\\), has the largest field."],
    vis('point-field', { q: 1e-9, r: 1.5, E: k * 1e-9 / 2.25 }));

  es(10, "Coulomb's law",
    "Charges \\(+q\\) and \\(-2q\\) are 2 cm apart. The force on the \\(-2q\\) charge has magnitude \\(F\\). What is the force on the \\(+q\\) charge?",
    ["\\(\\tfrac12 F\\), toward the \\(-2q\\) charge", "\\(2F\\), away from the \\(-2q\\) charge", "\\(F\\), toward the \\(-2q\\) charge", "\\(F\\), away from the \\(-2q\\) charge"],
    "C",
    ["Newton's third law: the two charges push or pull on each other with equal-size forces.",
     "\\(F = k|q_1q_2|/r^2\\) uses both charges symmetrically, so the bigger charge does not feel a bigger force.",
     "Opposite signs attract, so the force on \\(+q\\) points toward \\(-2q\\)."],
    vis('coulomb', { q1: 1e-9, q2: -2e-9, r: 0.02, F: k * 2e-18 / 4e-4 }));

  var vis11 = { key: 'superposition', params: { charges: [{ q: 1, x: 6 }, { q: -4, x: 12 }], x0: 0, quantity: 'field', net: 0 } };
  var fig11 = fmap([q(1, 6, 0), q(-4, 12, 0)], '+Q at 6, −4Q at 12 on a number line', [pt(0, 0, 'A'), pt(8, 0, 'B'), pt(9, 0, 'C'), pt(10, 0, 'D'), pt(18, 0, 'E')]);
  es(11, "Electric field",
    "On a number line, \\(+Q\\) sits at 6 and \\(-4Q\\) at 12. Labeled points: A at 0, B at 8, C at 9, D at 10, E at 18. The net electric field is zero closest to which point?",
    ["A", "C", "D", "E"],
    "A",
    ["Between opposite charges both fields point the same way (toward \\(-4Q\\)), so they cannot cancel there.",
     "Outside, the zero must be on the side of the smaller charge, so its weaker field can be closer.",
     "Set \\(Q/r^2 = 4Q/(r+6)^2\\): \\(r + 6 = 2r\\), so \\(r = 6\\). That is 6 units left of \\(+Q\\): point A."],
    vis11, fig11);

  es(12, "Conductors",
    "A charge of \\(10^{-6}\\) C is placed on an insulated solid metal sphere. Which statement is true?",
    ["The charge spreads evenly through the sphere's volume.",
     "Outside the sphere, the field gets stronger as you move farther away.",
     "A separate insulated metal object brought near (not touching) the sphere gains a net positive charge.",
     "If a second metal sphere is connected by a wire, charge flows until both spheres are at the same potential."],
    "D",
    ["Charge on a conductor sits on the surface, so the first statement is wrong; outside, \\(E = kQ/r^2\\) falls off, so the second is wrong.",
     "A nearby object only gets polarized (charges shift); its net charge stays zero without contact.",
     "Charge flows along a wire as long as there is a potential difference, so it stops when the potentials are equal."],
    concept("Connected conductors", ["Charge flows while ΔV ≠ 0", "Stops when V₁ = V₂", "Polarization ≠ net charge"]));

  es(13, "Uniform field",
    "Two large parallel plates P (top) and Q (bottom) are connected to a battery. Point I is above plate P (outside the gap); points II and III are both between the plates, at different heights. Ignoring edge effects, how does the force on a test charge at III compare?",
    ["Same size and direction as at point I", "Same size and direction as at point II",
     "Much larger than at II, same direction", "Much smaller than at II, same direction"],
    "B",
    ["Between large parallel plates the field is uniform: the same size and direction everywhere in the gap.",
     "\\(F = qE\\), so the force is the same at II and III.",
     "Point I is outside the plates, where the field is essentially zero, so it is not a match."],
    vis('uniform-field', { V: 12, d: 0.02, E: 600 }));

  es(14, "Electric field",
    "Point B is twice as far from an isolated charge \\(+Q\\) as point A. What is \\(E_A : E_B\\)?",
    ["8 to 1", "4 to 1", "2 to 1", "1 to 2"],
    "B",
    ["\\(E = kQ/r^2\\).",
     "Doubling \\(r\\) divides \\(E\\) by \\(2^2 = 4\\).",
     "So \\(E_A\\) is 4 times \\(E_B\\)."],
    vis('point-field', { q: 1e-9, r: 1, E: k * 1e-9 }));

  es(15, "Polarization",
    "What is the net force on an uncharged metal sphere sitting in a uniform electric field?",
    ["Zero", "Along the field", "Opposite the field", "A force that makes it oscillate about a point"],
    "A",
    ["The field pushes electrons one way, leaving the other side positive: the sphere polarizes.",
     "The net charge is still zero, so the two sides carry equal and opposite charge.",
     "In a uniform field those equal and opposite charges feel equal and opposite forces: the net force is zero."],
    vis('charging', { method: 'polarization', stage: 'Neutral sphere in a uniform field' }));

  es(16, "Conductors",
    "Two metal spheres of different radii each carry \\(-Q\\). What happens when they are joined by a wire?",
    ["No charge flows.",
     "Negative charge flows from the larger sphere to the smaller one until their potentials match.",
     "Negative charge flows from the smaller sphere to the larger one until the surface fields match.",
     "Negative charge flows from the smaller sphere to the larger one until their potentials match."],
    "D",
    ["\\(V = kQ/R\\): with the same \\(-Q\\), the smaller sphere has a more negative (lower) potential.",
     "Negative charge drifts toward higher potential, so it flows from the small sphere to the large one.",
     "Flow stops when there is no potential difference, not when fields match."],
    concept("Two spheres, same −Q", ["Small R → V = kQ/R more negative", "Electrons move toward higher V", "Stop when V equal"]));

  es(17, "Uniform field",
    "Two plates connected to a voltage source have a field of 2,000 N/C between them. The voltage is doubled and the gap is cut to 1/5 of what it was. The new field is",
    ["800 N/C", "1,600 N/C", "2,400 N/C", "20,000 N/C"],
    "D",
    ["Between plates, \\(E = V/d\\).",
     "\\(V \\times 2\\) and \\(d \\div 5\\) gives \\(E \\times 2 \\times 5 = E \\times 10\\).",
     "\\(2{,}000 \\times 10 = 20{,}000\\) N/C."],
    vis('uniform-field', { V: 200, d: 0.01, E: 20000 }));

  var fig1819 = fmap([q(1, -1, 1), q(1, 1, -1)], "Square of side d: +Q at top-left and bottom-right; P at the bottom-left corner", [pt(-1, -1, 'P')]);
  es(18, "Electric field",
    "Two \\(+Q\\) charges sit at opposite corners of a square of side \\(d\\): top-left and bottom-right. Point P is the bottom-left corner. Which way does the net field at P point?",
    ["Up and to the left", "Up and to the right", "Down and to the left", "Down and to the right"],
    "C",
    ["Fields point away from positive charges.",
     "The top-left charge is straight above P, so its field at P points down. The bottom-right charge is straight to the right, so its field points left.",
     "Equal sizes (both a distance \\(d\\)), so the sum points down and to the left at 45°."],
    fig1819, fig1819);

  es(19, "Potential energy",
    "Same square: \\(+Q\\) at two opposite corners, side \\(d\\). What is the electric potential energy of a charge \\(+q\\) held at the empty corner P?",
    ["Zero", "\\(\\dfrac{\\sqrt2}{4\\pi\\varepsilon_0}\\dfrac{qQ}{d}\\)", "\\(\\dfrac{2}{4\\pi\\varepsilon_0}\\dfrac{qQ}{d}\\)", "\\(\\dfrac{2\\sqrt2}{4\\pi\\varepsilon_0}\\dfrac{qQ}{d}\\)"],
    "C",
    ["Potential energy at a point is \\(U = qV\\), and potential adds as a scalar.",
     "Both charges are a distance \\(d\\) from P: \\(V = kQ/d + kQ/d = 2kQ/d\\).",
     "\\(U = 2kqQ/d = \\dfrac{2}{4\\pi\\varepsilon_0}\\dfrac{qQ}{d}\\)."],
    vis('potential', { charges: [{ q: 1, x: 0, y: 1 }, { q: 1, x: 1, y: 0 }], point: { x: 0, y: 0 }, V: 2 * k }), fig1819);

  es(20, "Capacitors",
    "Two parallel plates a distance \\(d\\) apart stay connected to a battery while the gap is doubled. Which is correct?",
    ["The charge on the plates doubles.", "The charge on the plates is halved.", "The voltage between the plates doubles.", "The capacitance is unchanged."],
    1,
    ["Still connected: the battery holds \\(V\\) constant.",
     "\\(C = \\varepsilon_0 A/d\\) is halved when \\(d\\) doubles.",
     "\\(Q = CV\\) is then halved too."],
    concept("Battery stays connected", ["V fixed by battery", "d × 2 → C ÷ 2", "Q = CV ÷ 2"]));

  es(21, "Conductors",
    "A hollow metal sphere carries positive charge. C is its center and P is some other point inside. What is the electric field at these points?",
    ["Zero at both points.", "Zero at C; nonzero and pointing inward at P.", "Zero at C; nonzero and pointing outward at P.", "Nonzero at both points."],
    "A",
    ["In electrostatic equilibrium the charge sits on the outer surface.",
     "The surface charge arranges itself so the field everywhere inside the conductor's cavity is zero.",
     "So \\(E = 0\\) at C and at P."],
    concept("Inside a charged metal shell", ["All charge on the outer surface", "E = 0 everywhere inside", "V constant inside"]));

  var fig22 = fmap([q(-1, 1, 0), q(1, 0, 1)], "−Q at (d, 0), +Q at (0, d)", [pt(0, 0, 'O')]);
  es(22, "Electric field",
    "Charge \\(-Q\\) sits on the x-axis at \\(x = d\\), and \\(+Q\\) sits on the y-axis at \\(y = d\\). Which way does the field at the origin point?",
    ["Right (+x)", "Up and to the left", "Down and to the right", "Down and to the left"],
    "C",
    ["Field points away from \\(+Q\\): the \\(+Q\\) is above O, so its field at O points down.",
     "Field points toward \\(-Q\\): the \\(-Q\\) is to the right of O, so its field points right.",
     "Equal sizes, so the net is down and to the right at 45°."],
    fig22, fig22);

  es(23, "Uniform field",
    "An electron and a proton are released from rest in the same uniform field, far enough apart to ignore each other. A little later, while both are still in the field, they have the same",
    ["direction of motion", "speed", "magnitude of acceleration", "magnitude of force"],
    "D",
    ["\\(F = qE\\) and both have charge of magnitude \\(e\\), so the force magnitudes match.",
     "The forces point in opposite directions, so they move opposite ways.",
     "The electron's mass is about 1/1836 of the proton's, so its acceleration and speed are far larger."],
    vis('uniform-field', { V: 100, d: 0.01, E: 10000, q: 1.6e-19, F: 1.6e-15 }));

  es(24, "Uniform field",
    "Two large parallel plates are 0.04 m apart. The lower plate is at 2 V and the upper plate at 10 V (relative to ground). Point P is 0.01 m above the lower plate. The potential at P is",
    ["10 V", "8 V", "6 V", "4 V"],
    "D",
    ["The field between plates is uniform, so potential changes evenly with height.",
     "8 V over 0.04 m is 2 V per cm (200 V/m).",
     "1 cm above the 2 V plate: \\(2 + 2 = 4\\) V."],
    vis('uniform-field', { V: 8, d: 0.04, E: 200 }));

  es(25, "Energy in fields",
    "A particle with charge \\(Q\\) and mass \\(m\\) starts from rest and is accelerated through potential difference \\(V\\), gaining kinetic energy \\(K\\). A particle with charge \\(2Q\\) and mass \\(m/2\\) is accelerated from rest through the same \\(V\\). Its kinetic energy is",
    ["\\(\\tfrac12 K\\)", "\\(K\\)", "\\(2K\\)", "\\(4K\\)"],
    "C",
    ["Energy conservation: \\(\\Delta K = |q|\\Delta V\\).",
     "Mass does not appear: it changes the final speed, not the energy gained.",
     "Double the charge, double the energy: \\(2K\\)."],
    vis('work-dv', { q: 2, Va: 1, Vb: 0, W: 2, dK: 2 }));

  var fig26 = fmap([q(1, -1, 0), q(-1, 1, 0)], "Y on the left, Z on the right", [pt(-1, 0.25, 'Y'), pt(1, 0.25, 'Z'), pt(1.6, 0, 'X')]);
  es(26, "Field lines",
    "Field lines in a region run out of small sphere Y and into small sphere Z (Y on the left, Z on the right). Point X is on the axis just to the right of Z. Which is true?",
    ["Y is negative and Z is positive.", "The field strength is the same everywhere.", "The field is strongest midway between Y and Z.", "A small negative object at X would tend to move right."],
    "D",
    ["Lines start on positive charge and end on negative: Y is positive, Z is negative.",
     "Lines bunch up near the spheres, so the field is strongest there, not midway, and not uniform.",
     "At X, just right of Z, the field points left (into Z). A negative charge feels a force opposite the field: to the right."],
    fig26, fig26);

  es(27, "Capacitors",
    "A parallel-plate capacitor has capacitance \\(C_0\\). Another one has twice the plate area and twice the plate gap. Its capacitance is about",
    ["\\(\\tfrac14 C_0\\)", "\\(\\tfrac12 C_0\\)", "\\(C_0\\)", "\\(2C_0\\)"],
    "C",
    ["\\(C = \\varepsilon_0 A/d\\).",
     "\\(\\varepsilon_0(2A)/(2d)\\): the factors of 2 cancel.",
     "Capacitance is unchanged: \\(C_0\\)."],
    concept("C = ε₀A/d", ["2A ÷ 2d = A/d", "Same capacitance"]));

  es(28, "Conductors",
    "Just outside the surface of a charged conductor (at equilibrium), the electric field is",
    ["perpendicular to the surface", "parallel to the surface", "zero", "infinite"],
    "A",
    ["If the field had a component along the surface, it would push surface charges sideways, and they would move.",
     "At equilibrium nothing moves, so that component must be zero.",
     "Only the perpendicular part remains: the field meets the surface at right angles (the surface is an equipotential)."],
    concept("Field at a conductor's surface", ["Along-surface component would move charges", "Equilibrium → that part is 0", "E ⟂ surface"]));

  es(29, "Work and potential",
    "Charges \\(+Q\\) and \\(+2Q\\) are fixed. Points R and S are each a distance \\(d\\) from both charges (one above the line joining them, one below). How much work is needed to move a charge \\(-Q\\) from R to S?",
    ["It depends on the path.", "Positive", "Zero", "Negative"],
    "C",
    ["Potential at R: \\(kQ/d + 2kQ/d = 3kQ/d\\). At S: exactly the same, by symmetry.",
     "\\(W = q\\Delta V\\), and \\(\\Delta V = 0\\).",
     "The electric force is conservative, so the path does not matter: \\(W = 0\\)."],
    vis('potential', { charges: [{ q: 1, x: -1, y: 0 }, { q: 2, x: 1, y: 0 }], point: { x: 0, y: 1 }, V: 3 * k / Math.SQRT2 }));

  es(30, "Uniform field",
    "A rigid insulating rod stands vertically in a uniform field that points to the right. It has \\(-2Q\\) at its top end and \\(+Q\\) at its bottom end. The rod feels",
    ["a net force to the left and clockwise rotation", "a net force to the left and counterclockwise rotation",
     "a net force to the right and clockwise rotation", "a net force to the right and counterclockwise rotation"],
    "B",
    ["Top: \\(F = 2QE\\) to the left (negative charge, against the field). Bottom: \\(F = QE\\) to the right.",
     "Net force: \\(2QE - QE = QE\\) to the left.",
     "Top pushed left and bottom pushed right turns the rod counterclockwise."],
    concept("Rod in a field to the right", ["Top −2Q: 2QE to the left", "Bottom +Q: QE to the right", "Net QE left; turns counterclockwise"]));

  es(32, "Dielectrics",
    "An isolated capacitor with air between its plates has voltage \\(V_0\\) and charge \\(Q_0\\). The gap is then filled with oil, giving voltage \\(V\\) and charge \\(Q\\). Which is correct?",
    ["\\(Q = Q_0\\) and \\(V > V_0\\)", "\\(Q = Q_0\\) and \\(V < V_0\\)", "\\(Q > Q_0\\) and \\(V = V_0\\)", "\\(Q < Q_0\\) and \\(V < V_0\\)"],
    "B",
    ["Isolated: the charge is stuck on the plates, so \\(Q = Q_0\\).",
     "Oil is a dielectric (\\(\\kappa > 1\\)), so \\(C = \\kappa\\varepsilon_0 A/d\\) goes up.",
     "\\(V = Q/C\\) goes down: \\(V < V_0\\)."],
    vis('capacitor', { C: 2e-12, V: 5, Q: 1e-11, U: 2.5e-11, kappa: 2, A: 0.01, d: 0.0885 }));

  es(33, "Coulomb's law",
    "Two small spheres each carry charge \\(q\\), a distance \\(d\\) apart, and push on each other with force \\(F\\). Each charge is doubled and the distance is halved. The new force is",
    ["\\(F\\)", "\\(4F\\)", "\\(8F\\)", "\\(16F\\)"],
    "D",
    ["\\(F = kq_1q_2/r^2\\).",
     "Both charges doubled: \\(\\times 4\\). Distance halved: \\(\\times 4\\).",
     "Total: \\(\\times 16\\)."],
    vis('coulomb', { q1: 2e-6, q2: 2e-6, r: 0.05, F: k * 4e-12 / 0.0025 }));

  es(34, "Conductors",
    "Which is true for conductors in electrostatic equilibrium?",
    ["Positive work is needed to move a positive charge across the conductor's surface.",
     "Charge placed on a conductor always spreads evenly over its surface.",
     "The potential inside a conductor is always zero.",
     "The conductor's surface is always an equipotential."],
    "D",
    ["There is no field component along the surface, so moving charge along it takes no work.",
     "No work means no change in potential: the surface (and the whole conductor) is at one potential.",
     "That potential is not necessarily zero, and charge is only even on symmetric shapes like spheres."],
    concept("Conductor at equilibrium", ["E inside = 0", "E at surface ⟂ surface", "Whole conductor at one V (not necessarily 0)"]));

  es(35, "Electric force",
    "A charged particle moves with velocity \\(v\\) through an electric field \\(E\\). The electric force \\(F\\) on it must be",
    ["parallel to \\(v\\)", "perpendicular to \\(v\\)", "parallel to \\(E\\)", "perpendicular to \\(E\\)"],
    "C",
    ["\\(\\vec F = q\\vec E\\): velocity does not appear.",
     "So the force lies along the field line (same direction for \\(+q\\), opposite for \\(-q\\)).",
     "Either way, it is parallel (or antiparallel) to \\(E\\)."],
    vis('uniform-field', { V: 100, d: 0.01, E: 10000, q: 1e-6, F: 0.01 }));

  es(36, "Work in a field",
    "A charge of \\(+3.0 \\times 10^{-8}\\) C sits in an upward uniform field of \\(4.0 \\times 10^4\\) N/C. It moves 0.5 m upward. How much work does the electric force do on it?",
    ["\\(6 \\times 10^{-4}\\) J", "\\(12 \\times 10^{-4}\\) J", "\\(2 \\times 10^{4}\\) J", "\\(8 \\times 10^{4}\\) J"],
    "A",
    ["Force: \\(F = qE = (3.0\\times10^{-8})(4.0\\times10^4) = 1.2\\times10^{-3}\\) N, upward.",
     "Displacement is along the force, so \\(W = Fd\\).",
     "\\(W = (1.2\\times10^{-3})(0.5) = 6\\times10^{-4}\\) J."],
    vis('uniform-field', { V: 20000, d: 0.5, E: 4e4, q: 3e-8, F: 1.2e-3 }));

  es(39, "Dielectrics",
    "A sheet of mica is slid between the plates of a charged, isolated parallel-plate capacitor. Which is true?",
    ["The capacitance decreases.", "The voltage across the capacitor decreases.", "The charge on the plates decreases.", "The field between the plates increases."],
    "B",
    ["Isolated: \\(Q\\) stays the same.",
     "Mica is a dielectric, so \\(C\\) increases by \\(\\kappa\\).",
     "\\(V = Q/C\\) drops (and so does \\(E = V/d\\))."],
    vis('capacitor', { C: 6e-12, V: 2, Q: 1.2e-11, U: 1.2e-11, kappa: 3, A: 0.01, d: 0.0443 }));

  es(40, "Conductors",
    "Metal spheres X and Y carry the same charge \\(+Q\\), but X has the larger radius. They are far apart. If a wire connects them, which way do electrons flow in the wire?",
    ["From X to Y", "From Y to X", "No charge flows.", "It depends on the size of \\(Q\\)."],
    "A",
    ["\\(V = kQ/R\\): same \\(Q\\), smaller \\(R\\) means higher potential. So Y is at the higher potential.",
     "Electrons (negative) move toward higher potential.",
     "They flow from X to Y until the potentials match."],
    concept("Same +Q, different radii", ["V = kQ/R → smaller sphere Y is higher", "Electrons go low V → high V", "X → Y"]));

  es(41, "Charged spheres",
    "A sphere of radius \\(R\\) has charge \\(+Q\\) spread evenly over its surface. For points inside (\\(r < R\\)), which gives the field \\(E\\) and potential \\(V\\)?",
    ["\\(E = 0\\), \\(V = kQ/R\\)", "\\(E = 0\\), \\(V = kQ/r\\)", "\\(E = kQ/r^2\\), \\(V = 0\\)", "\\(E = kQ/R^2\\), \\(V = 0\\)"],
    "A",
    ["Inside a uniform shell of charge the field is zero.",
     "Zero field means the potential does not change as you move around inside.",
     "So it keeps its surface value everywhere inside: \\(V = kQ/R\\)."],
    concept("Inside a charged shell", ["E = 0", "V = constant = surface value kQ/R"]));

  es(42, "Charged spheres",
    "Same sphere (\\(+Q\\) on the surface, radius \\(R\\)). For points outside (\\(r > R\\)), which gives \\(E\\) and \\(V\\)?",
    ["\\(kQ/R^2\\), \\(kQ/R\\)", "\\(kQ/R\\), \\(kQ/r\\)", "\\(kQ/r^2\\), \\(kQ/r\\)", "\\(kQ/r^2\\), \\(kQ/r^2\\)"],
    "C",
    ["Outside, a uniform sphere of charge acts like a point charge at its center.",
     "Point-charge field: \\(E = kQ/r^2\\).",
     "Point-charge potential: \\(V = kQ/r\\)."],
    vis('point-field', { q: 1e-9, r: 2, E: k * 1e-9 / 4 }));

  es(43, "Electric field",
    "Knowing the electric field vector at a point, which of these can you determine? I. The direction of the force on a test charge of known sign there. II. The force per unit charge on a test charge there. III. The charge located at that point.",
    ["I only", "III only", "I and II only", "II and III only"],
    "C",
    ["\\(\\vec E = \\vec F/q\\) is defined as force per unit charge, so II is yes.",
     "Its direction gives the force direction on \\(+q\\) (reversed for \\(-q\\)), so I is yes.",
     "The field is made by other charges; it says nothing about what charge is sitting at that point. III is no."],
    concept("What E tells you", ["Force per coulomb ✓", "Force direction for known sign ✓", "Charge at the point ✗"]));

  es(44, "Charged spheres",
    "A metal sphere of radius \\(R\\) carries charge \\(Q\\). Another, of radius \\(R/2\\), carries the same \\(Q\\). They are far apart. The field just outside the small sphere divided by the field just outside the large one is about",
    ["1/4", "1/2", "2", "4"],
    "D",
    ["Just outside a sphere, \\(E = kQ/R^2\\).",
     "Same \\(Q\\), half the radius: \\(E\\) is \\(2^2 = 4\\) times bigger.",
     "Ratio: 4."],
    concept("E at the surface = kQ/R²", ["Half the radius", "→ 4× the field"]));

  es(45, "Electric force",
    "An insulating ring is cut in half. The top half gets \\(-q\\) spread evenly, the bottom half gets \\(+q\\) spread evenly, and the halves are rejoined with insulation. Which way is the net force on an electron at the center?",
    ["Toward the top of the page", "Toward the bottom of the page", "To the right", "To the left"],
    "B",
    ["The negative top half repels the electron: downward. The positive bottom half attracts it: also downward.",
     "Left-right pieces cancel by symmetry.",
     "Net force: toward the bottom of the page."],
    fmap([q(-1, 0, 1), q(-1, -0.7, 0.7), q(-1, 0.7, 0.7), q(1, 0, -1), q(1, -0.7, -0.7), q(1, 0.7, -0.7)], "Negative top half, positive bottom half; electron at the center"));

  es(46, "Superposition",
    "Four \\(+q\\) charges sit at the corners of a square. At the center C, one charge alone gives potential \\(V_0\\) and field magnitude \\(E_0\\). With all four, the potential and field at C are",
    ["0 and 0", "0 and \\(2E_0\\)", "\\(4V_0\\) and 0", "\\(4V_0\\) and \\(2E_0\\)"],
    "C",
    ["Potential is a scalar: four equal positive contributions add to \\(4V_0\\).",
     "Field is a vector: each corner's field at C is cancelled by the opposite corner's.",
     "So \\(V = 4V_0\\) and \\(E = 0\\)."],
    fmap([q(1, -1, 1), q(1, 1, 1), q(1, -1, -1), q(1, 1, -1)], "Center C of the square"));

  es(47, "Electric potential",
    "Charge \\(-2Q\\) is on the x-axis at \\(x = D\\) and \\(+Q\\) is at \\(x = 2D\\). Point P at \\(x = 3D\\) is one of two points on the positive x-axis where the potential is zero. Where is the other?",
    ["\\(\\tfrac23 D\\)", "\\(\\tfrac32 D\\)", "\\(\\tfrac53 D\\)", "\\(2D\\)"],
    "C",
    ["Check P: \\(-2kQ/(2D) + kQ/D = 0\\). The other zero is between the charges, closer to the smaller one.",
     "At \\(x\\) between them: \\(\\dfrac{2}{x - D} = \\dfrac{1}{2D - x}\\).",
     "\\(4D - 2x = x - D\\), so \\(x = 5D/3\\)."],
    vis('potential', { charges: [{ q: -2, x: 1, y: 0 }, { q: 1, x: 2, y: 0 }], point: { x: 5 / 3, y: 0 }, V: 0 }));

  es(48, "Charged spheres",
    "Two concentric metal shells have radii \\(r_1 < r_2\\) and charges \\(Q_1\\) (inner) and \\(Q_2\\) (outer). In the region \\(r_1 < r < r_2\\), the field is proportional to",
    ["\\(Q_1/r^2\\)", "\\((Q_1 + Q_2)/r^2\\)", "\\((Q_1 + Q_2)/r\\)", "\\(Q_1/r + Q_2/r^2\\)"],
    "A",
    ["Inside the outer shell, its own charge makes no field.",
     "Outside the inner shell, it acts like a point charge \\(Q_1\\) at the center.",
     "So \\(E = kQ_1/r^2\\)."],
    concept("Between two shells", ["Outer shell: no field inside it", "Inner shell: like a point charge", "E ∝ Q₁/r²"]));

  es(51, "Charging by induction",
    "Two uncharged metal spheres X and Y are on insulating stands. A negatively charged rubber rod is held near X (not touching). Y is brought up on the far side of X, touches it, and is moved away. Then the rod is removed. What are the final charges?",
    ["X: zero, Y: zero", "X: negative, Y: positive", "X: positive, Y: negative", "X: positive, Y: positive"],
    "C",
    ["The negative rod repels electrons away from it, through X and into Y while they touch.",
     "Separating them traps the imbalance: X has lost electrons, Y has gained them.",
     "Removing the rod does not change that: X is positive, Y is negative."],
    vis('charging', { method: 'induction', stage: 'Two touching spheres, negative rod near X' }));

  es(52, "Charging by induction",
    "Uncharged conductors 1 and 2 touch each other on insulating stands. A negative rod is held near conductor 1 (not touching). With the rod in place, conductor 2 is pushed away so they separate. Conductor 2 is now",
    ["uncharged", "positively charged", "negatively charged", "charged, but the sign can't be predicted"],
    "C",
    ["The negative rod pushes electrons away from itself.",
     "They flow from conductor 1 into conductor 2 (the far side).",
     "Separating them traps the extra electrons on 2: it is negative."],
    vis('charging', { method: 'induction', stage: 'Rod near 1; electrons pushed into 2' }));

  var fig5354 = fmap([q(1, -1, 1), q(1, 1, -1), q(0.3, -1, -1)], "+Q at top-left and bottom-right; test charge +q at the bottom-left corner");
  es(53, "Superposition",
    "Two \\(+Q\\) charges are fixed at opposite corners of a square (top-left and bottom-right). A positive test charge \\(+q\\) sits at the bottom-left corner. Which way is the net force on it?",
    ["Down and to the right", "Up and to the right", "Straight down", "Down and to the left"],
    "D",
    ["Like charges repel.",
     "The top-left charge pushes \\(+q\\) straight down; the bottom-right charge pushes it straight left.",
     "Equal sizes, so the net force points down and to the left."],
    fig5354, fig5354);

  es(54, "Superposition",
    "Same square. If \\(F\\) is the force on the test charge from just one of the \\(+Q\\) charges, the net force from both is",
    ["Zero", "\\(F/\\sqrt2\\)", "\\(\\sqrt2\\,F\\)", "\\(2F\\)"],
    2,
    ["Both charges are a side length away, so each force has size \\(F\\).",
     "The two forces are at right angles.",
     "\\(\\sqrt{F^2 + F^2} = \\sqrt2\\,F\\)."],
    fig5354, fig5354);

  var vis55 = { key: 'superposition', params: { charges: [{ q: 3, x: 0 }, { q: 2, x: 2 }], x0: 1.1, quantity: 'field', net: 0 } };
  var fig5556 = fmap([q(3, -1, 0), q(2, 1, 0)], '+3q at point I, +2q at point III', [pt(-1, -0.3, 'I'), pt(0, 0, 'II'), pt(1, -0.3, 'III')]);
  es(55, "Electric field",
    "On a line, \\(+3q\\) sits at point I and \\(+2q\\) at point III; point II is halfway between. Apart from infinity, where on the line is the field zero?",
    ["Left of I", "Between I and II", "Between II and III", "Right of III"],
    "C",
    ["Two like charges: their fields point in opposite directions only between them.",
     "To cancel, the point must be closer to the smaller charge (\\(+2q\\)).",
     "So the zero lies between II and III."],
    vis55, fig5556);

  es(56, "Electric potential",
    "Same line: \\(+3q\\) at I and \\(+2q\\) at III. Where on the line is the potential negative?",
    ["Left of I", "Between I and II", "Between II and III", "Nowhere: it is never negative"],
    "D",
    ["\\(V = \\sum kq_i/r_i\\) is a scalar sum.",
     "Both charges are positive, so every term is positive at every point.",
     "The potential is positive everywhere (approaching 0 only far away)."],
    vis('potential', { charges: [{ q: 3, x: 0, y: 0 }, { q: 2, x: 2, y: 0 }], point: { x: 1, y: 0 }, V: 5 * k }));

  es(58, "Uniform field",
    "If the only force on an electron comes from a uniform electric field, the electron moves with constant",
    ["acceleration opposite to the field", "acceleration along the field", "speed opposite to the field", "speed along the field"],
    "A",
    ["Uniform field: constant force \\(F = eE\\), so constant acceleration \\(a = eE/m\\).",
     "The electron is negative, so the force points opposite to the field.",
     "Its speed changes; its acceleration does not."],
    vis('uniform-field', { V: 100, d: 0.01, E: 10000, q: -1.6e-19, m: 9.11e-31, F: 1.6e-15, a: 1.76e15 }));

  es(60, "Equipotentials",
    "A positive charge is moved at constant speed between two points in an electric field, and the field does no work on it at any moment. That can only happen if the charge moves",
    ["along the field", "against the field", "perpendicular to an equipotential line", "along an equipotential line"],
    "D",
    ["Work by the field is \\(W = -q\\Delta V\\). Zero work at every moment means \\(V\\) never changes.",
     "Constant-\\(V\\) paths are equipotentials.",
     "Equivalently, the motion is always perpendicular to the field, so \\(\\vec F\\cdot d\\vec s = 0\\)."],
    concept("Zero work by the field", ["W = −qΔV = 0", "Stay on one equipotential", "Motion ⟂ E"]));

  es(61, "Work and potential",
    "A thin non-conducting hollow sphere of radius \\(R\\) has a large charge \\(+Q\\) spread evenly over it, and a small hole. A small charge \\(+q\\) starts at point P, a distance \\(r > R\\) from the center. How much work must an outside agent do to move \\(+q\\) through the hole to the center O?",
    ["\\(kqQ/r\\)", "\\(kqQ/R\\)", "\\(kq(Q-q)/r\\)", "\\(kqQ(1/R - 1/r)\\)"],
    "D",
    ["Outside, \\(V_P = kQ/r\\). Inside the shell, \\(E = 0\\), so \\(V\\) stays at the surface value: \\(V_O = kQ/R\\).",
     "Work by an outside agent (no change in speed) is \\(W = q(V_O - V_P)\\).",
     "\\(W = kqQ(1/R - 1/r)\\), positive since you push \\(+q\\) toward \\(+Q\\)."],
    vis('work-dv', { q: 1, Va: 1, Vb: 2, W: 1, dK: 0 }));

  es(62, "Capacitors",
    "A capacitor with plate gap \\(d\\) is charged to voltage \\(V_0\\) by a battery that is then removed. Ignoring edge effects, the field between the plates is",
    ["\\(V_0 d\\)", "\\(V_0/d\\)", "\\(V_0/d^2\\)", "\\(V_0^2/d\\)"],
    "B",
    ["Between parallel plates the field is uniform.",
     "For a uniform field, \\(\\Delta V = Ed\\).",
     "So \\(E = V_0/d\\)."],
    vis('uniform-field', { V: 10, d: 0.01, E: 1000 }));

  es(63, "Dielectrics",
    "Same capacitor (charged, battery removed). An insulating plastic sheet is slid between the plates without disturbing anything else. What happens to the capacitance?",
    ["It increases.", "It decreases.", "Nothing; it stays the same.", "It can't be predicted without knowing the sheet's thickness."],
    "A",
    ["Plastic is a dielectric: its molecules polarize and partially cancel the field.",
     "Less field for the same charge means less voltage, so \\(C = Q/V\\) goes up.",
     "Any thickness of dielectric raises \\(C\\); the thickness only sets how much."],
    vis('capacitor', { C: 4e-12, V: 2.5, Q: 1e-11, U: 1.25e-11, kappa: 2, A: 0.01, d: 0.04425 }));

  es(64, "Shielding",
    "A point charge \\(+Q\\) sits inside an uncharged metal spherical shell, and several other point charges are scattered outside the shell. The field at point P inside the shell depends on",
    ["\\(Q\\) only", "the charge on the shell only", "\\(Q\\) and the charge on the shell", "all of the point charges"],
    "A",
    ["A closed metal shell rearranges its charge so outside charges make no field in its cavity (shielding).",
     "The shell's inner surface charge is fixed by \\(Q\\) alone.",
     "So the field at P depends only on \\(Q\\)."],
    concept("Metal shell shielding", ["Outside charges can't reach the cavity", "Inner surface gets −Q", "Field inside set by Q only"]));

  es(65, "Energy in fields",
    "An electron starts from rest at one plate and accelerates across a potential difference \\(V\\) to the other plate. Its speed on arrival is proportional to",
    ["\\(1/\\sqrt V\\)", "\\(\\sqrt V\\)", "\\(V\\)", "\\(V^2\\)"],
    "B",
    ["Energy: \\(eV = \\tfrac12 mv^2\\).",
     "\\(v = \\sqrt{2eV/m}\\).",
     "So \\(v \\propto \\sqrt V\\)."],
    vis('work-dv', { q: -1.6e-19, Va: 0, Vb: 100, W: 1.6e-17, dK: 1.6e-17 }));

  var fig6667 = fmap([q(1, -2, 0), q(-4, 2, 0)], "Q at x = −2, −4Q at x = +2 (grid units)", [pt(0, 3, 'P'), pt(-6, 0, 'A'), pt(-3, 0, 'B'), pt(-1, 0, 'C'), pt(1, 0, 'D'), pt(6, 0, 'E')]);
  es(66, "Superposition",
    "Charge \\(Q\\) sits at \\(x = -2\\) and \\(-4Q\\) at \\(x = +2\\) (grid units). Point P is on the positive y-axis. Which describes the field at P?",
    ["Straight up (+y)", "Straight down (−y)", "Components in −x and +y", "Components in +x and −y"],
    "D",
    ["From \\(Q\\): points away from it, up and to the right.",
     "From \\(-4Q\\): points toward it, down and to the right, and it is 4 times stronger (same distance).",
     "Both have \\(+x\\) parts; the \\(-4Q\\) wins vertically. Net: \\(+x\\) and \\(-y\\)."],
    fig6667, fig6667);

  es(67, "Electric field",
    "Same charges: \\(Q\\) at \\(x = -2\\), \\(-4Q\\) at \\(x = +2\\). Labeled points: A at −6, B at −3, C at −1, E at +6. Where on the x-axis is the field zero?",
    ["A", "B", "C", "E"],
    "A",
    ["Opposite charges: the fields cancel only outside the pair, on the side of the smaller charge.",
     "Distance \\(r\\) left of \\(Q\\): \\(Q/r^2 = 4Q/(r+4)^2\\), so \\(r + 4 = 2r\\) and \\(r = 4\\).",
     "\\(x = -2 - 4 = -6\\): point A."],
    fig6667, fig6667);

  es(69, "Superposition",
    "Six \\(+Q\\) particles are fixed, equally spaced, around a circle of radius \\(R\\). The field at the center has magnitude",
    ["0", "\\(\\dfrac{6Q}{4\\pi\\varepsilon_0 R^2}\\)", "\\(\\dfrac{3\\sqrt2\\,Q}{4\\pi\\varepsilon_0 R^2}\\)", "\\(\\dfrac{3Q}{2\\pi\\varepsilon_0 R^2}\\)"],
    "A",
    ["Each charge has a partner directly across the circle.",
     "Each pair's fields at the center are equal and opposite.",
     "All three pairs cancel: \\(E = 0\\)."],
    fmap([q(1, 1, 0), q(1, 0.5, 0.87), q(1, -0.5, 0.87), q(1, -1, 0), q(1, -0.5, -0.87), q(1, 0.5, -0.87)], "Center of the hexagon"));

  es(70, "Work and potential",
    "With the six \\(+Q\\) charges fixed on the circle, how much work is needed to bring a seventh \\(+Q\\) from very far away to the center?",
    ["0", "\\(\\dfrac{6Q}{4\\pi\\varepsilon_0 R}\\)", "\\(\\dfrac{3Q^2}{2\\pi\\varepsilon_0 R^2}\\)", "\\(\\dfrac{3Q^2}{2\\pi\\varepsilon_0 R}\\)"],
    "D",
    ["Zero field at the center does not mean zero potential: potential adds as a scalar.",
     "\\(V_{center} = 6kQ/R\\), and \\(V = 0\\) far away.",
     "\\(W = Q\\,\\Delta V = 6kQ^2/R = \\dfrac{6Q^2}{4\\pi\\varepsilon_0 R} = \\dfrac{3Q^2}{2\\pi\\varepsilon_0 R}\\)."],
    vis('potential', { charges: [{ q: 1, x: 1, y: 0 }, { q: 1, x: 0.5, y: 0.866 }, { q: 1, x: -0.5, y: 0.866 }, { q: 1, x: -1, y: 0 }, { q: 1, x: -0.5, y: -0.866 }, { q: 1, x: 0.5, y: -0.866 }], point: { x: 0, y: 0 }, V: 6 * k }));

  es(74, "Conductors",
    "A problem begins: \"A solid sphere has charge spread uniformly throughout its volume...\" What can you correctly conclude?",
    ["The field is zero everywhere inside.", "The potential on the surface is not constant.", "The potential at the center is zero.", "The sphere is not made of metal."],
    "D",
    ["In a metal, excess charge cannot stay inside: it moves to the surface.",
     "Charge that stays spread through the volume must be stuck in place, so the material is an insulator.",
     "(Inside such a sphere the field is not zero; it grows with \\(r\\).)"],
    concept("Charge through the volume", ["Metal: charge moves to the surface", "Volume charge → insulator"]));

  es(75, "Charged spheres",
    "Charge is spread uniformly through a sphere of radius \\(R\\). At distance \\(r\\) from its center, the field strength is",
    ["greatest at \\(r = 0\\)", "proportional to \\(r\\) when \\(r > R\\)", "proportional to \\(r\\) when \\(r < R\\)", "proportional to \\(r^2\\)"],
    "C",
    ["Inside, only the charge closer to the center than \\(r\\) counts, and that is proportional to \\(r^3\\).",
     "\\(E \\propto r^3/r^2 = r\\) for \\(r < R\\), so it is zero at the center.",
     "Outside it acts like a point charge: \\(E \\propto 1/r^2\\)."],
    concept("Uniformly charged ball", ["Inside: E ∝ r (0 at center)", "Outside: E ∝ 1/r²", "Peak at the surface"]));

  es(76, "Electroscope",
    "A negative rod is brought near an uncharged electroscope without touching: the leaves spread (I). A finger touches the electroscope: the leaves fall (II). The finger is removed and then the rod: the leaves spread again (III). The charge on the leaves is",
    ["positive in I and III", "negative in I and III", "positive in I, negative in III", "negative in I, positive in III"],
    "D",
    ["I: the negative rod pushes electrons down into the leaves, so they are negative.",
     "II: the finger (ground) lets those repelled electrons escape.",
     "III: with the finger and rod gone, the electroscope is short of electrons, so the leaves are positive.",
     "Note: the workbook's key prints letter B here, but its own explanation (negative in I, positive in III) matches D."],
    vis('charging', { method: 'induction', stage: 'Electroscope grounded by a finger' }));

  es(77, "Polarization",
    "A positively charged conductor attracts a second object. Which could be true? I. The object is a conductor with negative net charge. II. The object is a conductor with zero net charge. III. The object is an insulator with zero net charge.",
    ["I only", "II only", "III only", "I, II and III"],
    "D",
    ["Opposite charges attract, so I works.",
     "A neutral conductor gets its charges separated (induced), with the near side opposite: attraction, so II works.",
     "A neutral insulator's molecules polarize the same way: weaker attraction, but still attraction. III works."],
    vis('charging', { method: 'polarization' }));

  var vis78 = { key: 'superposition', params: { charges: [{ q: 4, x: -0.2 }, { q: 9, x: 0.3 }], x0: 0, quantity: 'field', net: 0 } };
  var fig7879 = fmap([q(4, -2, 0)], '+4.0 C at 0.20 m left of the origin; unknown q at 0.30 m right', [pt(0, 0, 'origin'), pt(3, 0, 'q = ?')]);
  es(78, "Superposition",
    "A \\(+4.0\\) C point charge sits on the x-axis 0.20 m left of the origin. A second charge \\(q\\) sits 0.30 m right of the origin. If the net field at the origin is zero, \\(q\\) is",
    ["+9.0 C", "+6.0 C", "−6.0 C", "−9.0 C"],
    "A",
    ["The +4 C charge's field at the origin points right (away from it). The other field must point left, so \\(q\\) must push away too: \\(q > 0\\).",
     "Equal magnitudes: \\(4/(0.2)^2 = q/(0.3)^2\\).",
     "\\(q = 4 \\times 0.09/0.04 = 9\\) C."],
    vis78, fig7879);

  es(79, "Electric potential",
    "Same setup: +4.0 C at 0.20 m left of the origin, \\(q\\) at 0.30 m right. If the net potential at the origin is zero, \\(q\\) is",
    ["+9.0 C", "+6.0 C", "−6.0 C", "−9.0 C"],
    "C",
    ["Potential is a scalar: \\(k(4)/0.2 + kq/0.3 = 0\\).",
     "\\(q = -4 \\times 0.3/0.2\\).",
     "\\(q = -6\\) C."],
    vis('potential', { charges: [{ q: 4, x: -0.2, y: 0 }, { q: -6, x: 0.3, y: 0 }], point: { x: 0, y: 0 }, V: 0 }));

  es(80, "Forces in fields",
    "A small object with charge \\(q\\) and weight \\(mg\\) hangs from a string of length \\(L\\) in a uniform horizontal field \\(E\\) pointing right. It hangs at rest with the string at angle \\(\\theta\\) from vertical, pushed out to the right. What is \\(q\\)?",
    ["positive, \\(mg/E\\)", "negative, \\(mg/E\\)", "positive, \\(mg\\tan\\theta/E\\)", "negative, \\(mg\\tan\\theta/E\\)"],
    "C",
    ["The electric force pushes the object right, along the field, so \\(q\\) is positive.",
     "Vertical balance: \\(T\\cos\\theta = mg\\). Horizontal balance: \\(T\\sin\\theta = qE\\).",
     "Divide: \\(\\tan\\theta = qE/mg\\), so \\(q = mg\\tan\\theta/E\\)."],
    vis('uniform-field', { V: 100, d: 0.1, E: 1000 }));

  es(81, "Capacitors",
    "Two large plates a distance \\(d\\) apart are charged by a battery of voltage \\(V\\). The battery is disconnected and the plates are slowly pulled apart. As the gap grows,",
    ["the charge on the plates decreases", "the field between the plates increases", "the voltage between the plates decreases", "the voltage between the plates increases"],
    "D",
    ["Disconnected: \\(Q\\) is fixed.",
     "\\(C = \\varepsilon_0 A/d\\) falls as \\(d\\) grows.",
     "\\(V = Q/C\\) rises. (The field \\(E = Q/(\\varepsilon_0 A)\\) stays the same.)"],
    concept("Isolated plates pulled apart", ["Q fixed", "C ↓", "V = Q/C ↑, E unchanged"]));

  es(82, "Work and potential",
    "Equipotential lines are drawn at 0, 20.0 V and 40.0 V. Point a lies on the 0 V line and point b on the 40.0 V line (the lines are 0.10 m apart and the straight path from a to b is longer than that). How much work is done in moving a \\(+3.00\\) mC charge from a to b?",
    ["4.00 mJ", "8.00 mJ", "12.0 mJ", "120 mJ"],
    "D",
    ["Only the start and end potentials matter: \\(\\Delta V = 40.0 - 0 = 40.0\\) V. The distances are a distraction.",
     "\\(W = q\\Delta V = (3.00\\times10^{-3})(40.0)\\).",
     "\\(W = 0.120\\) J = 120 mJ."],
    vis('work-dv', { q: 3e-3, Va: 0, Vb: 40, W: 0.12, dK: 0 }));

  es(83, "Coulomb's law",
    "Two positive point charges repel with 0.36 N when 1.5 m apart. What is the force when they are 1.0 m apart?",
    ["0.81 N", "0.54 N", "0.24 N", "0.16 N"],
    "A",
    ["\\(F \\propto 1/r^2\\).",
     "\\(F_2 = 0.36 \\times (1.5/1.0)^2 = 0.36 \\times 2.25\\).",
     "\\(F_2 = 0.81\\) N."],
    vis('coulomb', { q1: 1e-5, q2: 9e-6, r: 1.0, F: 0.81 }));

  es(84, "Conductors",
    "Two isolated metal spheres, S1 (radius 0.030 m, +6.0 nC) and S2 (radius 0.040 m, +2.0 nC), are connected by a wire. Charge flows in the wire until",
    ["both spheres have equal charge", "the repulsive forces become equal", "both have the same surface charge density", "both spheres are at the same potential"],
    "D",
    ["Charge moves along a wire only when there is a potential difference to drive it.",
     "Before: \\(V_1 = k(6)/0.03\\) is far above \\(V_2 = k(2)/0.04\\), so charge flows from S1 to S2.",
     "It stops when \\(V_1 = V_2\\)."],
    concept("Wire between conductors", ["Flow driven by ΔV", "Ends when V₁ = V₂"]));

  es(85, "Superposition",
    "A \\(+q\\) charge is placed midway between \\(+3q\\) and \\(-q\\), which are \\(2d\\) apart. The force on the \\(+q\\) has magnitude",
    ["\\(2kq^2/d^2\\)", "\\(4kq^2/d^2\\)", "\\(6kq^2/d^2\\)", "\\(8kq^2/d^2\\)"],
    "B",
    ["Each charge is \\(d\\) away from the middle.",
     "\\(+3q\\) pushes \\(+q\\) toward \\(-q\\) with \\(3kq^2/d^2\\); \\(-q\\) pulls it the same way with \\(kq^2/d^2\\).",
     "Same direction, so they add: \\(4kq^2/d^2\\)."],
    { key: 'superposition', params: { charges: [{ q: 3, x: -1 }, { q: -1, x: 1 }], x0: 0, quantity: 'force', qTest: 1, net: 4 * k } });

  es(86, "Polarization",
    "A charged rod is placed between two neutral, insulated metal spheres. Labeling left to right: region I is the far side of the left sphere, II its side facing the rod, III the right sphere's side facing the rod, and IV its far side. Region II has the same sign of charge as",
    ["I only", "III only", "IV only", "I and IV only"],
    "B",
    ["The rod pulls opposite charge toward itself in each sphere.",
     "So the sides facing the rod (II and III) both get the sign opposite to the rod.",
     "The far sides (I and IV) get the rod's sign. II matches III."],
    vis('charging', { method: 'polarization', stage: 'Rod between two neutral spheres' }));

  es(87, "Capacitors",
    "Two large insulated plates carry opposite charges and have a uniform field between them. The plates are moved farther apart. Which is true? I. The field gets weaker. II. The field gets stronger. III. The voltage between the plates increases.",
    ["I only", "II only", "III only", "I and III only"],
    "C",
    ["Insulated: \\(Q\\) is fixed, and \\(E = Q/(\\varepsilon_0 A)\\) does not involve the gap. So the field is unchanged; I and II are false.",
     "\\(V = Ed\\) grows with \\(d\\).",
     "Only III is true."],
    concept("Fixed Q, bigger gap", ["E = Q/(ε₀A): unchanged", "V = Ed: grows"]));

  es(88, "Coulomb's law",
    "Two small charged objects a distance \\(R\\) apart exert force \\(F\\) on each other. If the distance is made four times larger, the force becomes",
    ["\\(16F\\)", "\\(4F\\)", "\\(F/4\\)", "\\(F/16\\)"],
    "D",
    ["\\(F \\propto 1/r^2\\).",
     "\\(r \\times 4\\) gives \\(F \\div 4^2\\).",
     "\\(F/16\\)."],
    vis('coulomb', { q1: 1e-6, q2: 1e-6, r: 0.4, F: k * 1e-12 / 0.16 }));

  es(89, "Electroscope",
    "An electroscope is charged positively, so its leaves spread. An object brought near its top plate makes the leaves spread even more. You can conclude that the object is",
    ["positively charged", "negatively charged", "charged, but the sign is unknown", "uncharged"],
    "A",
    ["Wider leaves means the leaves have become more positive.",
     "That happens if electrons leave the leaves and move up to the top plate.",
     "Electrons are drawn up only by a positive object near the plate."],
    vis('charging', { method: 'induction', stage: 'Positive electroscope, object near the top' }));

  es(90, "Superposition",
    "Four positive charges: charge 3 is in the middle, charge 1 directly above it, charge 2 directly to its left, and charge 4 directly to its right. The force between 1 and 3 is 6.0 N, between 2 and 3 is 5.0 N, and between 3 and 4 is 3.0 N. The net force on charge 3 is about",
    ["6.3 N", "8.0 N", "11 N", "14 N"],
    "A",
    ["All repel. Charge 2 pushes 3 to the right (5 N); charge 4 pushes it left (3 N): net 2 N right.",
     "Charge 1 pushes it down: 6 N.",
     "\\(\\sqrt{2^2 + 6^2} = \\sqrt{40} \\approx 6.3\\) N."],
    fmap([q(1, 0, 1), q(1, -1, 0), q(1, 0, 0), q(1, 1, 0)], "Charge 3 at the center; 1 above, 2 left, 4 right"));

  es(91, "Capacitors",
    "Two isolated parallel plates, gap \\(d\\), carry charges \\(+Q\\) and \\(-Q\\) and each has area \\(A\\). Which would make the field between them stronger? I. Increasing \\(Q\\). II. Increasing \\(A\\). III. Increasing \\(d\\).",
    ["I only", "II only", "III only", "II and III only"],
    "A",
    ["Combine \\(Q = CV\\), \\(C = \\varepsilon_0 A/d\\) and \\(V = Ed\\): \\(E = Q/(\\varepsilon_0 A)\\).",
     "More \\(Q\\) raises \\(E\\); more \\(A\\) spreads the charge thinner and lowers it.",
     "\\(d\\) does not appear. Only I works."],
    concept("E = Q/(ε₀A)", ["Q ↑ → E ↑", "A ↑ → E ↓", "d: no effect"]));

  es(92, "Polarization",
    "A positively charged glass rod is brought near a neutral hollow metal sphere hanging from an insulating string. The sphere is attracted because",
    ["the rod removes electrons from the sphere", "the charge makes a magnetic field that attracts the sphere",
     "the rod's charge separates the charges in the sphere", "some protons pass from the rod to the sphere"],
    "C",
    ["Nothing touches, so no charge is transferred (and protons never move in these processes).",
     "The rod pulls electrons to the near side, leaving the far side positive.",
     "The near negative side is closer, so the attraction beats the repulsion."],
    vis('charging', { method: 'polarization', stage: 'Positive rod near a neutral sphere' }));

  es(93, "Uniform field",
    "An alpha particle and a proton sit side by side midway between two large plates; the bottom plate is positive and the top is negative. If both are free to move,",
    ["the alpha moves up with twice the proton's velocity", "both move up with the same velocity",
     "both accelerate upward with the same acceleration", "the alpha accelerates upward with half the proton's acceleration"],
    "D",
    ["The field points from + to −: upward. Both are positive, so both are pushed up.",
     "Alpha: charge \\(2e\\), mass \\(\\approx 4m_p\\). So \\(F_\\alpha = 2F_p\\).",
     "\\(a = F/m\\): \\(a_\\alpha = 2F_p/4m_p = \\tfrac12 a_p\\)."],
    vis('uniform-field', { V: 100, d: 0.01, E: 10000, q: 3.2e-19, m: 6.64e-27, F: 3.2e-15, a: 4.8e11 }));

  es(94, "Capacitors",
    "Two parallel plates carry charges \\(\\pm Q\\), are a distance \\(d\\) apart, and each has area \\(A\\). Which would lower the voltage between them? I. Increasing \\(Q\\). II. Increasing \\(d\\). III. Increasing \\(A\\).",
    ["I only", "II only", "III only", "II and III"],
    "C",
    ["\\(V = Q/C\\) with \\(C = \\varepsilon_0 A/d\\) gives \\(V = Qd/(\\varepsilon_0 A)\\).",
     "Increasing \\(Q\\) or \\(d\\) raises \\(V\\).",
     "Only increasing \\(A\\) lowers it."],
    concept("V = Qd/(ε₀A)", ["Q ↑ → V ↑", "d ↑ → V ↑", "A ↑ → V ↓"]));

  es(95, "Superposition",
    "Charges \\(+q\\) and \\(-q\\) are a distance \\(d\\) apart. The field at the midpoint has magnitude",
    ["\\(kq/d^2\\)", "\\(2kq/d^2\\)", "\\(4kq/d^2\\)", "\\(8kq/d^2\\)"],
    "D",
    ["Each charge is \\(d/2\\) from the midpoint: \\(E = kq/(d/2)^2 = 4kq/d^2\\) each.",
     "Between opposite charges both fields point the same way (from + toward −).",
     "They add: \\(8kq/d^2\\)."],
    { key: 'superposition', params: { charges: [{ q: 1, x: -0.5 }, { q: -1, x: 0.5 }], x0: 0, quantity: 'field', net: 8 * k } });

  es(96, "Superposition",
    "\\(+Q\\) at the origin makes field \\(E_0\\) at point P (\\(x = +1\\), \\(y = 0\\)). A charge \\(-2Q\\) is to be placed so the net field at P is zero. It goes on the",
    ["x-axis, \\(x > 1\\)", "x-axis, \\(x < 0\\)", "y-axis, \\(y > 0\\)", "y-axis, \\(y < 0\\)"],
    "B",
    ["At P, \\(+Q\\)'s field points in \\(+x\\). The \\(-2Q\\) field must point in \\(-x\\), so \\(-2Q\\) must lie on the x-axis to the left of P.",
     "It is the bigger charge, so it must be farther from P than \\(+Q\\): \\(2/r^2 = 1/1^2\\) gives \\(r = \\sqrt2\\).",
     "\\(x = 1 - \\sqrt2 \\approx -0.41\\), so \\(x < 0\\)."],
    { key: 'superposition', params: { charges: [{ q: 1, x: 0 }, { q: -2, x: -0.414 }], x0: 1, quantity: 'field', net: 0 } });

  es(97, "Energy in fields",
    "A 300 eV electron is fired midway between two parallel plates that have 400 V between them. It bends upward and hits the upper plate. Its kinetic energy just before impact is",
    ["360 eV", "400 eV", "500 eV", "700 eV"],
    "C",
    ["From the midline to a plate is half the gap, so half the voltage: 200 V.",
     "Bending toward the upper plate means the field speeds it up: it gains \\(e(200\\text{ V}) = 200\\) eV.",
     "Kinetic energy is a scalar: \\(300 + 200 = 500\\) eV."],
    vis('work-dv', { q: -1.6e-19, Va: 0, Vb: 200, W: 3.2e-17, dK: 3.2e-17 }));

  es(98, "Charge interactions",
    "Two small hollow metal balls on insulating threads attract each other. A positively charged rod is known to attract ball A. Which can be concluded? I. A is positive. II. B is negative. III. A and B have opposite charges.",
    ["I only", "II only", "III only", "none of these"],
    "D",
    ["A positive rod attracts A, so A is negative or neutral (neutral objects are attracted by polarization). I is out.",
     "If A is neutral, B could be either sign; if A is negative, B could be positive or neutral.",
     "So neither II nor III is guaranteed."],
    concept("Attraction is ambiguous", ["Opposite charges attract", "Charged + neutral also attract", "So attraction alone can't fix signs"]));

  es(99, "Uniform field",
    "A \\(5\\times10^{-6}\\) C charge sits midway between two parallel metal plates connected to a 9 V battery. It feels a force of \\(1.5\\times10^{-4}\\) N. The plate separation is",
    ["\\(6.75\\times10^{-9}\\) m", "\\(2.7\\times10^{-4}\\) m", "\\(3.7\\times10^{-3}\\) m", "0.30 m"],
    "D",
    ["\\(E = F/q = 1.5\\times10^{-4}/5\\times10^{-6} = 30\\) N/C.",
     "\\(E = V/d\\), so \\(d = V/E\\).",
     "\\(d = 9/30 = 0.30\\) m."],
    vis('uniform-field', { V: 9, d: 0.3, E: 30, q: 5e-6, F: 1.5e-4 }));

  es(100, "Capacitors",
    "A parallel-plate capacitor is fully charged by a battery of emf \\(\\varepsilon\\). The battery is disconnected and the plates are pushed to half their original separation. What is \\(V_{new}/V_{old}\\)?",
    ["1/2", "1", "2", "4"],
    "A",
    ["Disconnected: \\(Q\\) is fixed.",
     "Halving \\(d\\) doubles \\(C = \\varepsilon_0 A/d\\).",
     "\\(V = Q/C\\) is halved: ratio 1/2."],
    concept("Fixed Q, half the gap", ["C doubles", "V = Q/C halves"]));

  es(101, "Conductors",
    "A solid, uncharged metal sphere of radius \\(3a\\) has a hollow spherical cavity of radius \\(a\\) at its center, where a point charge \\(+Q\\) sits. With \\(V = 0\\) at infinity, the potential at \\(r = 2a\\) (inside the metal) is",
    ["0", "\\(2kQ/3a\\)", "\\(kQ/3a\\)", "\\(kQ/a\\)"],
    "C",
    ["The \\(+Q\\) induces \\(-Q\\) on the cavity wall; the neutral metal is left with \\(+Q\\) on its outer surface.",
     "Outside, everything looks like a point charge \\(+Q\\): at the outer surface \\(V = kQ/3a\\).",
     "Inside the metal \\(E = 0\\), so the potential is the same everywhere in the metal: \\(kQ/3a\\) at \\(r = 2a\\)."],
    concept("Charge in a cavity of a thick metal shell", ["Inner wall: −Q", "Outer surface: +Q", "Metal at one potential: kQ/(3a)"]));

  es(102, "Coulomb's law",
    "Two identical point charges \\(Q\\) a distance \\(d\\) apart exert force \\(F\\) on each other. If the distance is reduced to \\(0.40d\\), the force becomes",
    ["\\(6.3F\\)", "\\(2.5F\\)", "\\(0.40F\\)", "\\(0.16F\\)"],
    "A",
    ["\\(F \\propto 1/r^2\\).",
     "\\(1/0.40^2 = 1/0.16 = 6.25\\).",
     "About \\(6.3F\\)."],
    vis('coulomb', { q1: 1e-6, q2: 1e-6, r: 0.04, F: k * 1e-12 / 0.0016 }));

  var fig103 = fmap([q(-2, -1, 1), q(1, 1, 1), q(2, -1, -1), q(-1, 1, -1)], "10 cm square: −2Q top-left, +Q top-right, +2Q bottom-left, −Q bottom-right", [pt(0, 0, 'P')]);
  es(103, "Superposition",
    "Four charges sit on the corners of a 10 cm square: \\(-2Q\\) top-left, \\(+Q\\) top-right, \\(+2Q\\) bottom-left, \\(-Q\\) bottom-right. Which way does the field at the center P point?",
    ["Right", "Up", "Down", "Up and to the right"],
    "B",
    ["All four are the same distance from P, so each field's size is proportional to its charge.",
     "Diagonal 1 (\\(-2Q\\) TL and \\(-Q\\) BR): both fields point toward TL, net strength \\(1Q\\) toward TL. Diagonal 2 (\\(+Q\\) TR and \\(+2Q\\) BL): both point toward TR, net \\(1Q\\) toward TR.",
     "Equal pulls toward the top-left and top-right corners: the sideways parts cancel, leaving straight up."],
    fig103, fig103);

  es(104, "Uniform field",
    "A proton is released between the plates of a fully charged capacitor: 200 V across a 5 cm gap. Its acceleration is",
    ["\\(7.3\\times10^{13}\\) m/s²", "\\(9.6\\times10^{8}\\) m/s²", "\\(6.3\\times10^{19}\\) m/s²", "\\(3.8\\times10^{11}\\) m/s²"],
    "D",
    ["\\(E = V/d = 200/0.05 = 4000\\) N/C.",
     "\\(F = eE = (1.6\\times10^{-19})(4000) = 6.4\\times10^{-16}\\) N.",
     "\\(a = F/m = 6.4\\times10^{-16}/1.67\\times10^{-27} \\approx 3.8\\times10^{11}\\) m/s²."],
    vis('uniform-field', { V: 200, d: 0.05, E: 4000, q: 1.6e-19, m: 1.67e-27, F: 6.4e-16, a: 3.83e11 }));

  es(105, "Conductors",
    "A solid, uncharged metal sphere of radius \\(3a\\) has a hollow cavity of radius \\(2a\\). A point charge \\(+Q\\) is placed in the cavity, a distance \\(a\\) from the center. What is the field at point P, \\(r = 4a\\) from the center (outside the sphere)?",
    ["0", "\\(kQ/16a^2\\)", "\\(3kQ/16a^2\\)", "\\(kQ/9a^2\\)"],
    "B",
    ["The cavity wall gets \\(-Q\\); the neutral metal puts \\(+Q\\) on its outer surface.",
     "The metal hides the off-center position: the outer \\(+Q\\) spreads uniformly over the sphere.",
     "Outside it acts like a point charge at the center: \\(E = kQ/(4a)^2 = kQ/16a^2\\)."],
    vis('point-field', { q: 1e-9, r: 4, E: k * 1e-9 / 16 }));

  es(106, "Electroscope",
    "A positive object is held near the top of an uncharged electroscope. The electroscope is briefly touched with a finger, the finger is removed, and then the object is removed. Now a negative charge is brought near the top. The leaves",
    ["stay uncharged", "spread farther apart", "move closer together", "stay negatively charged but don't move"],
    "B",
    ["With the positive object near, grounding lets electrons flow in from the finger. Removing the finger and then the object leaves the electroscope negative, with the leaves spread.",
     "A negative charge near the top pushes more electrons down into the leaves.",
     "More negative leaves repel more: they spread farther."],
    vis('charging', { method: 'induction', stage: 'Charged negative by induction' }));

  es(107, "Conductors",
    "A thick metal shell has inner radius \\(a\\) and outer radius \\(2a\\), with a point charge \\(+Q\\) at its center. What net charge must the shell carry for the charge density on its inner and outer surfaces to be equal?",
    ["\\(-5Q\\)", "\\(+3Q\\)", "\\(-4Q\\)", "\\(+4Q\\)"],
    "A",
    ["The inner surface must hold \\(-Q\\) (to cancel the field of \\(+Q\\) inside the metal).",
     "Equal densities: \\(Q_{out}/(4\\pi(2a)^2) = Q_{in}/(4\\pi a^2)\\), so \\(Q_{out} = 4Q_{in} = -4Q\\).",
     "Total shell charge: \\(-Q + (-4Q) = -5Q\\)."],
    concept("Equal surface densities", ["Inner: −Q on area 4πa²", "Outer area is 4× bigger → −4Q", "Shell total −5Q"]));

  es(109, "Electric potential",
    "A metal spherical shell of radius \\(R\\) carries \\(+Q\\). A is its center, B is on its surface, and C is a distance \\(R\\) outside the surface. With \\(V = 0\\) at infinity, which is correct?",
    ["\\(V_C < V_B < V_A\\)", "\\(V_A < V_B < V_C\\)", "\\(V_C = V_B = V_A\\)", "\\(V_C < V_B = V_A\\)"],
    "D",
    ["Inside the shell \\(E = 0\\), so the potential is constant: \\(V_A = V_B = kQ/R\\).",
     "Outside, \\(V = kQ/r\\) falls with distance: \\(V_C = kQ/2R\\).",
     "So \\(V_C < V_B = V_A\\)."],
    concept("Shell potentials", ["Inside: V = kQ/R everywhere", "Outside: V = kQ/r", "V_C = kQ/2R is lowest"]));

  es(110, "Potential energy",
    "For a set of point charges fixed in place, which statement is always true?",
    ["If the system's potential energy is negative, an outside agent must do net positive work to pull the charges apart to infinity.",
     "If the system's potential energy is positive, net positive work is needed to bring any new charge in from infinity.",
     "If the system's potential energy is zero, there are no negative charges.",
     "If the system's potential energy is negative, an outside agent did net positive work to assemble it."],
    "A",
    ["\\(U\\) equals the work needed to assemble the charges from infinity. Negative \\(U\\) means assembling it released energy, so D is false.",
     "Negative \\(U\\) is a bound system: pulling it apart to \\(U = 0\\) takes positive work. A is true.",
     "B depends on the sign of the new charge; C fails because + and − pairs can cancel to zero."],
    vis('pe-pair', { q1: 1e-6, q2: -1e-6, r: 0.1, U: -k * 1e-12 / 0.1 }));

  es(111, "Coulomb's law",
    "A positive charge exerts force \\(F\\) on a negative charge a distance \\(x\\) away. The negative charge is swapped for a positive charge of the same size, and the distance is halved. The new force has magnitude",
    ["\\(4F\\)", "\\(2F\\)", "\\(F\\)", "\\(F/2\\)"],
    "A",
    ["The sign change flips the direction (attract to repel), not the size.",
     "\\(F \\propto 1/r^2\\): halving the distance multiplies the force by 4.",
     "\\(4F\\)."],
    vis('coulomb', { q1: 1e-6, q2: 1e-6, r: 0.05, F: k * 1e-12 / 0.0025 }));

  es(112, "Coulomb's law",
    "Two charged insulating spheres on an air table: A has \\(+3Q\\) and B has \\(+Q\\). When released, what are the forces on them?",
    ["Both forces point the same way, equal in size", "They repel, and the force on A is three times the force on B",
     "They attract, with equal-size forces", "They repel, with equal-size forces"],
    "D",
    ["Both are positive, so they repel: the forces point away from each other.",
     "Newton's third law: the force A exerts on B equals the force B exerts on A in size.",
     "\\(F = k(3Q)(Q)/r^2\\) on each."],
    vis('coulomb', { q1: 3e-6, q2: 1e-6, r: 0.1, F: k * 3e-12 / 0.01 }));

  var fig114 = fmap([q(3, -1, 0), q(-1, 1, 0)], "+3Q on the left, −Q on the right", [pt(-2, 0.4, 'Region I'), pt(0, 0.4, 'Region II'), pt(2, 0.4, 'Region III')]);
  es(114, "Electric potential",
    "On the x-axis, \\(+3Q\\) is on the left and \\(-Q\\) on the right. Region I is left of \\(+3Q\\), Region II is between them, Region III is right of \\(-Q\\). Apart from infinity, where on the axis is the potential zero?",
    ["Only in Region II", "In Regions I and II", "In Regions I and III", "In Regions II and III"],
    "D",
    ["\\(V = k(3Q)/r_1 - kQ/r_2 = 0\\) requires \\(r_1 = 3r_2\\): you must be three times closer to \\(-Q\\).",
     "That happens once between them (Region II) and once beyond \\(-Q\\) (Region III).",
     "In Region I you are always closer to \\(+3Q\\), so \\(V > 0\\)."],
    fig114, fig114);

  es(115, "Electric field",
    "Same charges (\\(+3Q\\) left, \\(-Q\\) right). Apart from infinity, where on the axis is the field zero?",
    ["Only in Region I", "In Regions I and II", "Only in Region III", "In Regions II and III"],
    "C",
    ["Between opposite charges both fields point the same way (toward \\(-Q\\)): no zero in II.",
     "Outside, the zero must be closer to the smaller charge, so its weaker field can match.",
     "That is beyond \\(-Q\\): only Region III."],
    fig114, fig114);

  es(116, "Capacitors",
    "A parallel-plate capacitor stays connected to a battery while a student pulls the plates apart to twice the gap. What happens to its voltage and its stored energy?",
    ["Voltage doubles; energy stays the same", "Voltage doubles; energy halves", "Voltage stays the same; energy halves", "Voltage stays the same; energy doubles"],
    "C",
    ["Still connected: the battery holds \\(V\\) fixed.",
     "Doubling \\(d\\) halves \\(C\\).",
     "\\(U = \\tfrac12 CV^2\\) is halved."],
    concept("Connected, gap doubled", ["V fixed", "C halves", "U = ½CV² halves"]));

  es(117, "Charging by friction",
    "Combing hair with a neutral comb leaves the comb negatively charged. The best explanation is",
    ["the hair gains protons from the comb", "the hair gains protons and gives electrons to the comb",
     "the hair loses electrons to the comb", "the comb loses protons to the hand holding it"],
    "C",
    ["Protons are locked in nuclei; in everyday charging only electrons move.",
     "The comb ends up negative, so it gained electrons.",
     "They came from the hair, which is left positive."],
    vis('charging', { method: 'friction' }));

  es(118, "Superposition",
    "Charge \\(+Q\\) is at \\(x = -1\\) m and \\(-2Q\\) at \\(x = +1\\) m. Where on the x-axis does a test charge \\(+q\\) feel zero net force?",
    ["\\(-(3 + \\sqrt8)\\) m", "\\(-1/3\\) m", "\\(1/3\\) m", "\\(3 + \\sqrt8\\) m"],
    "A",
    ["Zero force means zero field: outside the pair, on the side of the smaller charge, so left of \\(-1\\) m.",
     "Distance \\(x\\) left of \\(+Q\\): \\(Q/x^2 = 2Q/(x+2)^2\\), so \\(x + 2 = \\sqrt2\\,x\\) and \\(x = 2/(\\sqrt2 - 1) = 2 + \\sqrt8\\).",
     "Position: \\(-1 - (2 + \\sqrt8) = -(3 + \\sqrt8) \\approx -5.8\\) m."],
    { key: 'superposition', params: { charges: [{ q: 1, x: -1 }, { q: -2, x: 1 }], x0: -5.83, quantity: 'force', qTest: 1, net: 0 } });

  es(119, "Capacitors",
    "A capacitor with plate gap \\(d\\) on insulating supports is charged by a battery, which is then removed. The gap is increased to \\(2d\\) (fringing still negligible). Which quantity doubles?",
    ["The capacitance", "The surface charge density on the plates", "The stored energy", "The field between the plates"],
    "C",
    ["Battery removed: \\(Q\\) fixed, so the charge density and \\(E = Q/(\\varepsilon_0 A)\\) do not change.",
     "\\(C\\) halves, so \\(V = Q/C\\) doubles.",
     "\\(U = \\tfrac12 QV\\) doubles."],
    concept("Fixed Q, gap doubled", ["C ÷ 2", "V × 2", "U = ½QV × 2", "σ and E unchanged"]));

  es(120, "Coulomb's law",
    "Two point objects each carry \\(10Q\\), a distance \\(d\\) apart, with force \\(F\\) between them. Half the charge on one is moved to the other, and the distance is doubled. The new force is",
    ["\\(0.19F\\)", "\\(0.25F\\)", "\\(0.75F\\)", "\\(4.0F\\)"],
    "A",
    ["Before: \\(F \\propto (10Q)(10Q)/d^2 = 100Q^2/d^2\\).",
     "After: charges \\(5Q\\) and \\(15Q\\), distance \\(2d\\): \\(75Q^2/4d^2 \\approx 18.75Q^2/d^2\\).",
     "Ratio: \\(18.75/100 \\approx 0.19\\)."],
    vis('coulomb', { q1: 5e-6, q2: 1.5e-5, r: 0.2, F: k * 7.5e-11 / 0.04 }));

  es(121, "Charge sharing",
    "Two identical spheres with equal charges \\(Q\\) repel with force \\(F\\) at distance \\(d\\). A third identical, uncharged sphere touches the first sphere, then the second, and is removed. The new force between the original two is",
    ["\\(\\tfrac34 F\\)", "\\(\\tfrac58 F\\)", "\\(\\tfrac12 F\\)", "\\(\\tfrac38 F\\)"],
    "D",
    ["First touch: \\(Q\\) splits evenly, so sphere 1 and the third sphere have \\(Q/2\\) each.",
     "Second touch: \\(Q/2 + Q = 3Q/2\\) splits, so sphere 2 gets \\(3Q/4\\).",
     "\\(F' \\propto (Q/2)(3Q/4) = \\tfrac38 Q^2\\), so \\(F' = \\tfrac38 F\\)."],
    concept("Touch and share", ["Sphere 1: Q → Q/2", "Sphere 2: Q → 3Q/4", "F ∝ q₁q₂ → 3/8 F"]));

  es(122, "Energy in fields",
    "An alpha particle reaches speed \\(v\\) after being accelerated from rest through 1200 V. What accelerating voltage would give it speed \\(2v\\)?",
    ["4800 V", "4100 V", "2400 V", "1700 V"],
    "A",
    ["\\(qV = \\tfrac12 mv^2\\), so \\(V \\propto v^2\\).",
     "Doubling \\(v\\) needs four times the voltage.",
     "\\(4 \\times 1200 = 4800\\) V."],
    vis('work-dv', { q: 3.2e-19, Va: 4800, Vb: 0, W: 1.536e-15, dK: 1.536e-15 }));

  es(123, "Superposition",
    "A charge \\(Q\\) is at one corner of an equilateral triangle. An identical charge placed at a second corner makes each feel 15 N. An identical third charge is placed at the last corner. The force on each charge is now",
    ["15 N", "26 N", "30 N", "42 N"],
    "B",
    ["Each charge now feels two 15 N pushes, 60° apart.",
     "Resolve along the bisector: each contributes \\(15\\cos30^\\circ\\); the sideways parts cancel.",
     "\\(F = 2(15)\\cos30^\\circ \\approx 26\\) N."],
    fmap([q(1, -1, -0.6), q(1, 1, -0.6), q(1, 0, 1.13)], "Equilateral triangle of identical charges"));

  es(124, "Charged spheres",
    "Two metal spheres with the same charge \\(Q\\) are very far apart. A has radius 10 cm, B has radius 20 cm. At what distances from their centers are the field magnitudes equal?",
    ["15 cm from A and 15 cm from B", "30 cm from A and 40 cm from B", "20 cm from A and 40 cm from B", "40 cm from A and 40 cm from B"],
    "D",
    ["Outside a charged sphere, \\(E = kQ/r^2\\): the radius doesn't matter.",
     "Same \\(Q\\), so equal distances outside both spheres give equal fields.",
     "40 cm is outside both. (15 cm is inside B, where \\(E = 0\\).)"],
    concept("Outside, size doesn't matter", ["E = kQ/r² for r > R", "Same Q, same r → same E"]));

  es(125, "Conductors",
    "A large metal sphere X with charge \\(Q\\) is connected by a wire to a small uncharged metal sphere Y; then the wire is removed. How does the field at Y's surface \\(E_Y\\) compare with \\(E_X\\) at X's surface?",
    ["\\(E_X = E_Y = 0\\)", "\\(E_Y = E_X \\neq 0\\)", "\\(E_Y < E_X\\)", "\\(E_Y > E_X\\)"],
    "D",
    ["Connected: equal potentials, \\(kQ_X/r_X = kQ_Y/r_Y\\).",
     "Surface field: \\(E = kQ/r^2 = V/r\\).",
     "Same \\(V\\), smaller radius: \\(E_Y > E_X\\). (This is why sharp points spark.)"],
    concept("Same V, different radii", ["E at surface = V/r", "Smaller sphere → stronger field"]));

  es(126, "Capacitors",
    "What voltage across an 8.9 nF capacitor puts \\(1.5\\times10^{12}\\) excess electrons on one plate?",
    ["3.7 V", "5.9 V", "14 V", "27 V"],
    "D",
    ["Charge: \\(Q = Ne = (1.5\\times10^{12})(1.6\\times10^{-19}) = 2.4\\times10^{-7}\\) C.",
     "\\(V = Q/C = 2.4\\times10^{-7}/8.9\\times10^{-9}\\).",
     "\\(V \\approx 27\\) V."],
    vis('capacitor', { C: 8.9e-9, V: 27, Q: 2.4e-7, U: 3.24e-6, kappa: 1, A: 1.0, d: 9.94e-4 }));

  es(127, "Conductors",
    "A hollow metal sphere is evenly charged positive. Points K and L are inside it; M and N are outside. At which pair is the field smallest?",
    ["K and N", "L and M", "K and L", "M and N"],
    "C",
    ["Inside a charged metal shell the field is exactly zero.",
     "Outside it is \\(kQ/r^2 > 0\\).",
     "So K and L, both inside, have the smallest field (zero)."],
    concept("Charged shell", ["Inside: E = 0", "Outside: E = kQ/r²"]));

  var fig128 = fmap([q(-1, -2, 1.5), q(-1, -2, -1.5), q(-1, 2, -1.5)], "Rectangle 80 cm wide, 60 cm tall; each charge −40 nC", [pt(-2.3, 1.5, 'Q1'), pt(-2.3, -1.5, 'Q2'), pt(2.3, -1.5, 'Q3'), pt(0, 0, 'X')]);
  es(128, "Superposition",
    "Three charges, each \\(-40\\) nC, sit at three corners of a rectangle 80 cm wide and 60 cm tall: \\(Q_1\\) top-left, \\(Q_2\\) bottom-left, \\(Q_3\\) bottom-right. The net force on \\(Q_2\\) is",
    ["\\(1.4\\times10^{-5}\\) N", "\\(1.7\\times10^{-5}\\) N", "\\(4.2\\times10^{-5}\\) N", "\\(4.6\\times10^{-5}\\) N"],
    "D",
    ["From \\(Q_1\\) (0.60 m above): \\(F = (8.99\\times10^9)(40\\times10^{-9})^2/0.36 \\approx 4.0\\times10^{-5}\\) N, pushing \\(Q_2\\) down.",
     "From \\(Q_3\\) (0.80 m right): \\(F \\approx 1.44\\times10^{-5}/0.64 \\approx 2.25\\times10^{-5}\\) N, pushing it left.",
     "At right angles: \\(\\sqrt{4.0^2 + 2.25^2}\\times10^{-5} \\approx 4.6\\times10^{-5}\\) N."],
    fig128, fig128);

  es(129, "Superposition",
    "Same rectangle (80 cm × 60 cm, three \\(-40\\) nC charges at three corners). What is the field at the center X?",
    ["1440 N/C", "720 N/C", "360 N/C", "180 N/C"],
    "A",
    ["\\(Q_1\\) and \\(Q_3\\) are at opposite corners, equal distances from X: their fields cancel.",
     "Only \\(Q_2\\) is left, at half a diagonal: \\(r = \\sqrt{0.3^2 + 0.4^2} = 0.5\\) m.",
     "\\(E = (8.99\\times10^9)(40\\times10^{-9})/0.25 \\approx 1440\\) N/C."],
    fig128, fig128);

  es(131, "Charging by induction",
    "Metal spheres A, B, C on insulating stands touch in a row. A strong positive object is held near A and a strong negative object near C. With them in place, B is removed. Then the objects are removed, and B is touched first to A, then to C. B's final charge is",
    ["same sign as A's original charge, half its size", "opposite sign to A's original charge, half its size",
     "opposite sign to A's original charge, a quarter of its size", "same sign as C's original charge, half its size"],
    "C",
    ["The positive object pulls electrons into A (A becomes \\(-q\\)); the negative object pushes electrons out of C (C becomes \\(+q\\)). B, in the middle, stays neutral.",
     "B touches A: they share \\(-q\\), so B has \\(-q/2\\). B touches C: they share \\(+q - q/2 = +q/2\\), so B ends with \\(+q/4\\).",
     "\\(+q/4\\) is opposite in sign to A's original \\(-q\\), and a quarter of its size."],
    vis('charging', { method: 'induction', stage: 'Three touching spheres between + and − objects' }));

  var fig133 = fmap([q(3, -1, 1), q(-1, 1, 1), q(-2, -1, -1), q(3, 1, -1)], "Square with diagonal 2a: +3q top-left, −q top-right, −2q bottom-left, +3q bottom-right", [pt(0, 0, 'center')]);
  es(133, "Superposition",
    "Four charges sit on the corners of a square whose diagonal is \\(2a\\): \\(+3q\\) top-left, \\(-q\\) top-right, \\(-2q\\) bottom-left, \\(+3q\\) bottom-right. The field at the center is",
    ["\\(kq/a^2\\), 45° above the +x axis", "\\(kq/a^2\\), 45° below the −x axis", "\\(3kq/a^2\\), 45° above the −x axis", "\\(3kq/a^2\\), 45° below the +x axis"],
    "B",
    ["Each corner is a distance \\(a\\) from the center.",
     "The two \\(+3q\\) charges are opposite each other: their fields cancel. On the other diagonal, \\(-q\\) (top-right) cancels \\(-q\\) worth of the \\(-2q\\) (bottom-left).",
     "What's left acts like \\(-q\\) at the bottom-left: field \\(kq/a^2\\) pointing toward it, 45° below the \\(-x\\) axis."],
    fig133, fig133);

  es(134, "Potential energy",
    "A free electron and a free proton are between two oppositely charged parallel plates, both at the same spot closer to the positive plate. Which is true? I. The force on the proton is larger than on the electron. II. The proton's potential energy is greater than the electron's. III. Their potential energies are equal.",
    ["II only", "III only", "I and II only", "I and III only"],
    "A",
    ["Same field, same charge magnitude: equal force sizes. I is false.",
     "\\(U = qV\\): at the same \\(V\\), the proton has \\(+eV\\) and the electron \\(-eV\\).",
     "Near the positive plate \\(V\\) is positive, so the proton's \\(U\\) is positive and the electron's negative. II only."],
    vis('uniform-field', { V: 100, d: 0.01, E: 10000, q: 1.6e-19, F: 1.6e-15 }));

  es(135, "Conductors",
    "A thick metal spherical shell has inner radius \\(a\\) and outer radius \\(b\\). A charge \\(+Q\\) sits at its center, and the shell itself carries total charge \\(-q\\). At equilibrium, how is the shell's charge arranged?",
    ["\\(+Q\\) on the inner surface, \\(-q - Q\\) on the outer", "\\(-q\\) shared evenly between the two surfaces",
     "\\(-Q\\) on the inner surface, \\(Q - q\\) on the outer", "\\(-Q\\) on the inner surface, \\(-q\\) on the outer"],
    "C",
    ["The field inside the metal must be zero, so the inner surface must cancel \\(+Q\\): it holds \\(-Q\\).",
     "Inner + outer must equal the shell's total \\(-q\\).",
     "Outer: \\(-q - (-Q) = Q - q\\)."],
    concept("Charge bookkeeping on a shell", ["Inner: −Q (cancels the center charge)", "Outer: total − inner = Q − q"]));

  es(136, "Electric potential",
    "Same shell (\\(+Q\\) at the center, shell total \\(-q\\)). What is the potential at a distance \\(R\\) from the center, where \\(a < R < b\\) (inside the metal)?",
    ["\\(kQ/a\\)", "\\(kQ/R\\)", "\\(k(Q - q)/R\\)", "\\(k(Q - q)/b\\)"],
    "D",
    ["Outside, the total charge \\(Q - q\\) acts like a point charge: at the outer surface \\(V = k(Q-q)/b\\).",
     "Inside the metal \\(E = 0\\), so \\(V\\) doesn't change from the surface value.",
     "\\(V = k(Q - q)/b\\)."],
    concept("Potential inside the metal", ["E = 0 in the metal", "V = value at the outer surface", "k(Q − q)/b"]));

  es(137, "Conductors",
    "Metal sphere X is uncharged. Metal sphere Y has twice X's diameter and carries charge \\(q\\). They are joined by a long thin wire. At equilibrium,",
    ["Y has half X's potential", "X and Y have the same potential", "Y has half X's charge", "X and Y have the same charge"],
    "B",
    ["Charge flows along the wire until there is no potential difference.",
     "So the potentials end up equal.",
     "(Then \\(Q \\propto R\\): Y, twice as big, holds twice X's charge.)"],
    concept("Joined conductors", ["Equal potentials", "Q ∝ R"]));

  var fig138 = fmap([q(1, -1, 1), q(2, 1, 1), q(1, -1, -1), q(1, 1, -1)], "Square: +2Q at top-right, +Q at the other corners; P is a distance r from each", [pt(0, 0, 'P')]);
  es(138, "Electric potential",
    "Four positive charges are fixed at a square's corners: three are \\(Q\\), one is \\(2Q\\). Point P, the center, is a distance \\(r\\) from each. The potential at P is",
    ["Zero", "\\(2kQ/r\\)", "\\(4kQ/r\\)", "\\(5kQ/r\\)"],
    "D",
    ["Potential adds as a scalar.",
     "\\(V = k(Q + Q + Q + 2Q)/r\\).",
     "\\(V = 5kQ/r\\)."],
    fig138, fig138);

  es(139, "Superposition",
    "Same square (three \\(Q\\), one \\(2Q\\), center at distance \\(r\\)). The field at P has magnitude",
    ["\\(kQ/r^2\\)", "\\(2kQ/r^2\\)", "\\(4kQ/r^2\\)", "\\(5kQ/r^2\\)"],
    "A",
    ["Think of the \\(2Q\\) as \\(Q + Q\\).",
     "Four \\(Q\\)'s at the corners cancel completely by symmetry.",
     "The extra \\(Q\\) at the \\(2Q\\) corner remains: \\(E = kQ/r^2\\)."],
    fig138, fig138);

  es(140, "Charged spheres",
    "Metal spheres X and Y are far apart and isolated. X has the larger radius, and the fields just outside their surfaces are equal. Compared with Y's charge, X's charge is",
    ["greater", "less", "the same", "undeterminable without the actual field value"],
    "A",
    ["Surface field: \\(E = kQ/R^2\\).",
     "Equal fields means \\(Q_X/R_X^2 = Q_Y/R_Y^2\\).",
     "\\(R_X > R_Y\\), so \\(Q_X > Q_Y\\)."],
    concept("Equal surface fields", ["Q ∝ R²", "Bigger sphere holds more charge"]));

  es(141, "Potential energy",
    "Two negative point charges a distance \\(x\\) apart have potential energy \\(U\\). If the distance grows to \\(3x\\), their potential energy is",
    ["\\(9U\\)", "\\(3U\\)", "\\(\\tfrac13 U\\)", "\\(\\tfrac19 U\\)"],
    "C",
    ["\\(U = kq_1q_2/r\\): one power of \\(r\\), not two.",
     "Tripling \\(r\\) divides \\(U\\) by 3.",
     "\\(U/3\\)."],
    vis('pe-pair', { q1: -1e-6, q2: -1e-6, r: 0.3, U: k * 1e-12 / 0.3 }));

  es(142, "Forces in fields",
    "Sphere X (mass \\(M\\), charge \\(+q\\)) hangs from a string. Sphere Y, also \\(+q\\), is fixed a distance \\(d\\) directly below X. In equilibrium, the string tension is about",
    ["\\(Mg + kq/d\\)", "\\(Mg - kq/d\\)", "\\(Mg + kq^2/d^2\\)", "\\(Mg - kq^2/d^2\\)"],
    "D",
    ["Forces on X: tension up, gravity down, and Y's repulsion up.",
     "Balance: \\(T + kq^2/d^2 = Mg\\).",
     "\\(T = Mg - kq^2/d^2\\)."],
    vis('coulomb', { q1: 1e-7, q2: 1e-7, r: 0.1, F: k * 1e-14 / 0.01 }));

  es(143, "Charging by induction",
    "A small positive sphere on a nonconducting thread is lowered into a grounded metal cup without touching it. The ground wire on the cup's outside is disconnected, and then the sphere is pulled out. Where does the cup's excess charge end up?",
    ["Negative charge on the inside surface; none outside", "Negative charge on the outside surface; none inside",
     "Positive charge on the inside surface; none outside", "Positive charge on the outside surface; none inside"],
    "B",
    ["The positive sphere draws electrons from ground onto the cup's inner surface.",
     "Disconnecting the ground traps that extra negative charge on the cup.",
     "With the sphere gone, the excess charge spreads to the outer surface (excess charge on a conductor lives on the outside)."],
    vis('charging', { method: 'induction', stage: 'Charge inside a grounded cup' }));

  es(144, "Energy in fields",
    "A helium nucleus (charge \\(+2q\\), mass \\(4m\\)) and a lithium nucleus (charge \\(+3q\\), mass \\(7m\\)) are accelerated through the same potential difference \\(V_0\\). What is \\(K_{Li}/K_{He}\\)?",
    ["2/3", "6/7", "7/6", "3/2"],
    "D",
    ["\\(K = qV_0\\): only the charge matters, not the mass.",
     "\\(K_{Li}/K_{He} = 3q/2q\\).",
     "\\(3/2\\)."],
    vis('work-dv', { q: 3, Va: 1, Vb: 0, W: 3, dK: 3 }));

  es(145, "Electric field",
    "Charge \\(-Q\\) is at the origin and \\(+2Q\\) at \\(x = d\\). In which region of the x-axis is the net field zero?",
    ["\\(-\\infty < x < 0\\)", "\\(0 < x < d/2\\)", "\\(d/2 < x < d\\)", "\\(d < x < \\infty\\)"],
    "A",
    ["Opposite charges: the fields cancel only outside the pair.",
     "It must be closer to the smaller charge (\\(-Q\\)).",
     "So left of the origin: \\(x < 0\\)."],
    { key: 'superposition', params: { charges: [{ q: -1, x: 0 }, { q: 2, x: 1 }], x0: -2.41, quantity: 'field', net: 0 } });

  es(149, "Potential energy",
    "Two protons and an electron are lined up with the electron in the middle, a distance \\(a\\) from each proton. How much work did an outside force do to assemble them from far apart?",
    ["\\(-2ke^2/a\\)", "\\(-3ke^2/2a\\)", "\\(ke^2/2a\\)", "\\(3ke^2/a\\)"],
    "B",
    ["Assembly work = total potential energy = sum over every pair.",
     "Two proton-electron pairs: \\(-ke^2/a\\) each. One proton-proton pair at \\(2a\\): \\(+ke^2/2a\\).",
     "\\(-2ke^2/a + ke^2/2a = -3ke^2/2a\\)."],
    vis('pe-pair', { q1: 1.6e-19, q2: -1.6e-19, r: 1e-10, U: -k * 2.56e-38 / 1e-10 }));

  // ===================== UNIT 2: CIRCUITS =====================

  ci(1, "Series and parallel",
    "Four resistor arrangements: I is two 1 Ω resistors in series; II is two 2 Ω in series; III is two 2 Ω in parallel; IV is two 4 Ω in parallel. Which two have the same resistance between their terminals? (The workbook asks you to pick two answers.)",
    ["I and IV", "II and III", "I and III", "II and IV"],
    0,
    ["Series adds: I = 1 + 1 = 2 Ω; II = 2 + 2 = 4 Ω.",
     "Two equal resistors in parallel give half of one: III = 1 Ω; IV = 2 Ω.",
     "I and IV are both 2 Ω (workbook answers A and D)."],
    concept("Equivalent resistance", ["I: 1 + 1 = 2 Ω", "II: 2 + 2 = 4 Ω", "III: 2 ∥ 2 = 1 Ω", "IV: 4 ∥ 4 = 2 Ω"]));

  var fig2 = circuit(6, S(R('4 Ω', 4), Pl(R('3 Ω', 3), R('6 Ω', 6))), { ask: 'V between X and Y (across the parallel pair)?' });
  ci(2, "Series and parallel",
    "An ideal 6 V battery drives a 4 Ω resistor in series with a parallel pair of 3 Ω and 6 Ω. Points X and Y are on either side of the parallel pair. What is the potential difference between X and Y?",
    ["2 V", "3 V", "4 V", "6 V"],
    "A",
    ["Parallel pair: \\(\\dfrac{3\\cdot6}{3+6} = 2\\) Ω. Total: \\(4 + 2 = 6\\) Ω.",
     "Current from the battery: \\(I = 6/6 = 1\\) A.",
     "Voltage across the pair: \\(V = (1)(2) = 2\\) V (the 4 Ω takes the other 4 V)."],
    circuit(6, S(R('4 Ω', 4, { I: 1, V: 4 }), Pl(R('3 Ω', 3, { I: 0.667, V: 2 }), R('6 Ω', 6, { I: 0.333, V: 2 }))), { ask: 'V(XY) = 2 V' }),
    fig2);

  ci(3, "Meters",
    "An ideal battery powers a lamp. An ammeter sits in the main wire from the battery, and a voltmeter is connected across the lamp. A second identical lamp is then connected in parallel with the first. What happens to the ammeter reading?",
    ["It increases, because the current through the ammeter now splits to feed both lamps.",
     "It stays the same, because the ammeter measures the battery's current.",
     "It decreases, because the circuit's resistance has gone up.",
     "It stays the same, because energy is conserved."],
    "A",
    ["Each lamp gets the full battery voltage, so each draws the same current the first one did.",
     "The ammeter sits before the split, so it carries the sum of both lamp currents (junction rule).",
     "Its reading doubles: adding a parallel branch lowers total resistance."],
    circuit(6, Pl(Bulb('lamp 1', 12, { I: 0.5, V: 6 }), Bulb('lamp 2', 12, { I: 0.5, V: 6 })), { ask: 'Example: 6 V, 12 Ω lamps. Ammeter 0.5 A → 1.0 A' }));

  ci(4, "Meters",
    "Same circuit: ideal battery, lamp, ammeter in the main wire, voltmeter across the lamp. A second identical lamp is added in parallel. What happens to the voltmeter reading?",
    ["It decreases, because the current splits between the branches.", "It stays the same, because charge is conserved.",
     "It increases, because the circuit's resistance has gone up.", "It stays the same, because energy is conserved."],
    "D",
    ["The voltmeter is across the lamp, which is directly across the ideal battery.",
     "Loop rule (energy conservation): around any loop, the voltage drops must add to the battery's emf.",
     "Each parallel lamp gets the full emf, so the reading doesn't change."],
    vis('loop-potential', { emf: 6, elements: [{ label: 'lamp', dV: -6 }], I: 0.5 }));

  ci(5, "Resistivity",
    "Four resistors are made of the same material. Which has the greatest resistance?",
    ["Length \\(\\ell\\), cross-section \\(A\\)", "Length \\(2\\ell\\), cross-section \\(A\\)", "Length \\(\\ell\\), cross-section \\(2A\\)", "Length \\(2\\ell\\), cross-section tapering from \\(2A\\) to \\(A\\)"],
    "B",
    ["\\(R = \\rho L/A\\): longer means more resistance, thicker means less.",
     "The longest pieces are the \\(2\\ell\\) ones. The tapered one is thicker than \\(A\\) along most of its length.",
     "So the long, uniformly thin one (\\(2\\ell\\), \\(A\\)) wins."],
    vis('resistivity', { rho: 1e-6, L: 2, A: 1e-6, R: 2 }));

  ci(6, "Capacitors in circuits",
    "Two capacitors are in parallel across voltage \\(V\\), with \\(C_1 = 1.5C_2\\). What is \\(Q_1/Q_2\\)?",
    ["2/3", "1", "3/2", "9/4"],
    "C",
    ["Parallel: both have the same voltage \\(V\\).",
     "\\(Q = CV\\), so \\(Q_1/Q_2 = C_1/C_2\\).",
     "\\(= 1.5 = 3/2\\)."],
    circuit(10, Pl(Cp('C1 = 3 µF', 3e-6, { Q: 3e-5, V: 10 }), Cp('C2 = 2 µF', 2e-6, { Q: 2e-5, V: 10 })), { ask: 'Example: 10 V. Q1 = 30 µC, Q2 = 20 µC' }));

  ci(7, "Power",
    "Four unfinished circuits use identical resistors R and identical capacitors C. A battery can complete any one of them. Circuit A: two R in series. Circuit B: a C in series with an R. Circuit C: a C in parallel with a series pair of R's. Circuit D: two R in parallel. Which gives the greatest steady power?",
    ["A", "B", "C", "D"],
    "D",
    ["Steady state: a capacitor in series blocks current, so B dissipates nothing. In C the capacitor branch carries no current, leaving \\(2R\\).",
     "\\(P = \\varepsilon^2/R_{eq}\\): the smallest equivalent resistance wins.",
     "A: \\(2R\\). C: \\(2R\\). D: \\(R/2\\). D wins."],
    concept("Greatest steady power", ["P = ε²/R_eq", "A: 2R, B: open (0 W), C: 2R, D: R/2", "D: smallest R_eq"]));

  ci(8, "Capacitors in circuits",
    "Same four circuits (A: two R in series; B: C in series with R; C: C in parallel with two R in series; D: two R in parallel). Which keeps stored energy after the battery is connected and then disconnected?",
    ["A", "B", "C", "D"],
    "B",
    ["Energy is stored only in a capacitor, so A and D are out.",
     "In C, the capacitor sits across the resistors, so once the battery leaves it discharges through them.",
     "In B, the charged capacitor has no closed path to discharge through: it keeps its energy."],
    concept("Holding stored energy", ["Need a capacitor", "And no resistor path across it", "Only circuit B"]));

  ci(9, "Power",
    "A variable resistor is connected to a battery with negligible internal resistance. A graph of the resistor's power \\(P\\) against the current \\(I\\) is a straight line through the origin, reaching \\(P = 10\\) W at \\(I = 4\\) A. What is the battery's emf?",
    ["0.025 V", "2.5 V", "6.25 V", "40 V"],
    "B",
    ["\\(P = IV\\), and with no internal resistance the resistor always has the full emf across it.",
     "So \\(P = \\varepsilon I\\): the slope of the P-I line is \\(\\varepsilon\\).",
     "\\(\\varepsilon = 10/4 = 2.5\\) V."],
    vis('ohm', { V: 2.5, I: 4, R: 0.625, P: 10 }));

  var fig10 = circuit(10, S(R('10 Ω', 10), Pl(R('r'), R('r'))), { ask: 'I = 0.5 A; find r' });
  ci(10, "Series and parallel",
    "A 10 V battery drives a 10 Ω resistor in series with two equal resistors \\(r\\) in parallel. For what value of \\(r\\) is the current 0.5 A?",
    ["1 Ω", "5 Ω", "10 Ω", "20 Ω"],
    "D",
    ["Total resistance needed: \\(10/0.5 = 20\\) Ω.",
     "Two equal resistors in parallel give \\(r/2\\): \\(10 + r/2 = 20\\).",
     "\\(r = 20\\) Ω."],
    circuit(10, S(R('10 Ω', 10, { I: 0.5, V: 5 }), Pl(R('r = 20 Ω', 20, { I: 0.25, V: 5 }), R('r = 20 Ω', 20, { I: 0.25, V: 5 })))),
    fig10);

  ci(11, "Power",
    "Resistors \\(R_1\\) and \\(R_2\\) are connected to the same ideal emf, once in series and once in parallel. How does the total power compare?",
    ["Greater in series, because the current isn't split.", "Greater in series, because the equivalent resistance is greater.",
     "Greater in parallel, because the total current is greater.", "Greater in parallel, because both resistors have the same voltage."],
    "C",
    ["Same emf, so \\(P = \\varepsilon I_{total}\\).",
     "Parallel has the smaller equivalent resistance, so it draws more total current.",
     "More current at the same emf means more power: parallel wins, because the total current is greater."],
    concept("Same battery, two hookups", ["Series: R₁ + R₂ (big) → small I", "Parallel: smaller R_eq → big I", "P = εI → parallel wins"]));

  ci(12, "Current",
    "Part of a circuit: between points X and Y, one branch has a 1 Ω and a 3 Ω resistor in series, and a parallel branch has a single 2 Ω resistor. With a steady current, the charge per second passing a point is",
    ["greater in the 1 Ω than in the 3 Ω", "greater in the 1 Ω than in the 2 Ω", "greater in the 2 Ω than in the 3 Ω", "greater at X than at Y"],
    "C",
    ["Charge per second is current. The 1 Ω and 3 Ω are in series, so they carry the same current.",
     "Both branches have the same voltage; the 2 Ω branch has half the resistance (2 vs 4 Ω), so twice the current.",
     "All current entering at X leaves at Y. So the 2 Ω carries more than the 3 Ω."],
    circuit(12, Pl(S(R('1 Ω', 1, { I: 3, V: 3 }), R('3 Ω', 3, { I: 3, V: 9 })), R('2 Ω', 2, { I: 6, V: 12 })), { ask: 'Example: 12 V across X–Y' }));

  ci(13, "Resistivity",
    "Two circular loops of the same wire have radii \\(b\\) and \\(2b\\). The loop of radius \\(b\\) has resistance \\(R\\). The loop of radius \\(2b\\) has resistance",
    ["\\(R/2\\)", "\\(R\\)", "\\(2R\\)", "\\(4R\\)"],
    "C",
    ["\\(R = \\rho L/A\\); same wire means same \\(\\rho\\) and \\(A\\).",
     "Circumference \\(2\\pi r\\): doubling the radius doubles the length.",
     "So the resistance doubles: \\(2R\\)."],
    vis('resistivity', { rho: 1.7e-8, L: 0.628, A: 1e-7, R: 0.107 }));

  ci(14, "Capacitors in circuits",
    "Why is the total capacitance of capacitors in parallel the sum of the individual capacitances?",
    ["Each capacitor's charge depends on its capacitance, but they all have the same voltage.",
     "Each has the same charge, but its voltage depends on its capacitance.",
     "Capacitors always combine like resistors in series.",
     "The parallel hookup increases the effective plate separation."],
    "A",
    ["Parallel: every capacitor has the same \\(V\\).",
     "Each stores \\(Q_i = C_iV\\), and the total charge is \\(\\sum Q_i = (\\sum C_i)V\\).",
     "So \\(C_{eq} = Q_{total}/V = \\sum C_i\\)."],
    concept("Capacitors in parallel", ["Same V", "Q adds: Q = (C₁ + C₂ + …)V", "C_eq = sum"]));

  ci(15, "Resistivity",
    "A wire of length \\(L\\) and radius \\(r\\) has resistance \\(R\\). A wire of the same material with length \\(L/2\\) and radius \\(r/2\\) has resistance",
    ["\\(4R\\)", "\\(2R\\)", "\\(R\\)", "\\(R/2\\)"],
    "B",
    ["\\(R = \\rho L/A\\) with \\(A = \\pi r^2\\).",
     "Half the length: \\(\\div 2\\). Half the radius: area \\(\\div 4\\), so \\(R \\times 4\\).",
     "Net: \\(\\times 2\\)."],
    vis('resistivity', { rho: 1.7e-8, L: 0.5, A: 7.85e-7, R: 0.0108 }));

  var fig1618 = circuit(12, S(R('R1 = 2500 Ω', 2500), Pl(R('R2 = 2000 Ω', 2000), R('R3 = 6000 Ω', 6000))), { ask: 'I1 through R1; I2 through R2; I3 through R3' });
  var vis1618 = circuit(12, S(R('R1 = 2500 Ω', 2500, { I: 0.003, V: 7.5 }), Pl(R('R2 = 2000 Ω', 2000, { I: 0.00225, V: 4.5 }), R('R3 = 6000 Ω', 6000, { I: 0.00075, V: 4.5 }))));
  ci(16, "Kirchhoff's junction rule",
    "A 12 V battery drives \\(R_1 = 2500\\) Ω in series with a parallel pair \\(R_2 = 2000\\) Ω and \\(R_3 = 6000\\) Ω. \\(I_1\\) flows through \\(R_1\\) and \\(I_2\\) through \\(R_2\\). Which is greater?",
    ["\\(I_1\\), because it has more resistance.", "\\(I_2\\), because it has less resistance.", "\\(I_1\\), because of charge conservation.", "\\(I_2\\), because of energy conservation."],
    "C",
    ["All of \\(I_1\\) arrives at the junction and splits: \\(I_1 = I_2 + I_3\\).",
     "Charge isn't created or lost, so each branch gets only part of \\(I_1\\).",
     "\\(I_1 > I_2\\), by charge conservation (the junction rule)."],
    vis1618, fig1618);

  ci(17, "Series and parallel",
    "Same circuit (12 V; 2500 Ω in series with 2000 Ω ∥ 6000 Ω). What is \\(I_1\\)?",
    ["1 mA", "3 mA", "4 mA", "12 mA"],
    "B",
    ["Parallel pair: \\(\\dfrac{2000\\cdot6000}{8000} = 1500\\) Ω.",
     "Total: \\(2500 + 1500 = 4000\\) Ω.",
     "\\(I_1 = 12/4000 = 3\\) mA."],
    vis1618, fig1618);

  ci(18, "Series and parallel",
    "Same circuit. Which change would increase \\(I_1\\)?",
    ["Remove \\(R_3\\) and its branch.", "Replace \\(R_2\\) with another 6000 Ω resistor.", "Add an 8000 Ω resistor in parallel with \\(R_2\\) and \\(R_3\\).", "Rewire all three resistors in series."],
    "C",
    ["\\(I_1 = 12/R_{total}\\), so we need a smaller total resistance.",
     "Removing a branch, raising \\(R_2\\), or going all-series each raises the total.",
     "Adding another parallel path lowers the parallel resistance, so \\(I_1\\) rises."],
    vis1618, fig1618);

  ci(19, "Power",
    "A 60 W incandescent bulb and a 13.3 W compact fluorescent are both plugged into a 110 V household circuit. Which has the greater resistance?",
    ["Neither, since they have the same voltage across them.", "The 60 W bulb, because it draws more current.",
     "The 13.3 W bulb, because it uses less power.", "The 13.3 W bulb, because it is more efficient."],
    "C",
    ["Same voltage, so use \\(P = V^2/R\\), which gives \\(R = V^2/P\\).",
     "Less power at the same voltage means more resistance.",
     "\\(R_{60} = 110^2/60 \\approx 200\\) Ω; \\(R_{13.3} = 110^2/13.3 \\approx 910\\) Ω.",
     "Note: the workbook's key prints letter B, but its explanation (the lower-wattage bulb has the greater resistance) matches C."],
    vis('power', { elements: [{ label: '60 W bulb', R: 201.7, I: 0.545, V: 110, P: 60 }, { label: '13.3 W CFL', R: 909.8, I: 0.121, V: 110, P: 13.3 }] }));

  ci(20, "Kirchhoff's rules",
    "Three vertical branches join at a top and a bottom junction. Left branch: a 16 V battery and a 4 Ω resistor, carrying 1 A up into the top junction. Right branch: a 24 V battery and a 6 Ω resistor, carrying 2 A up into the top junction. Middle branch: just a resistor \\(R\\). What is \\(R\\)?",
    ["3 Ω", "4 Ω", "6 Ω", "12 Ω"],
    "B",
    ["Junction rule at the top: 1 A + 2 A come in, so 3 A flows down through \\(R\\).",
     "Loop rule around the left loop: \\(+16 - (1)(4) - 3R = 0\\).",
     "\\(3R = 12\\), so \\(R = 4\\) Ω. (The right loop agrees: \\(24 - 12 - 12 = 0\\).)"],
    vis('junction', { ins: [{ label: 'left branch', I: 1 }, { label: 'right branch', I: 2 }], outs: [{ label: 'R', I: 3 }] }));

  ci(21, "Kirchhoff's rules",
    "Two branches each hold a 2 V battery and a 50 Ω resistor, and a third branch is a 150 Ω resistor, all connected between points x and y. The batteries are oriented so that a current of 0.04 A circulates through both of them around the loop made by the two battery branches. What is the potential difference between x and y?",
    ["8 V", "2 V", "0 V", "4 V"],
    "C",
    ["Around the battery loop: 2 V + 2 V of emf drives 0.04 A through 100 Ω, using all 4 V. That loop is self-contained.",
     "Going from x to y through one battery branch: gain 2 V in the battery, lose \\((0.04)(50) = 2\\) V in its resistor: net 0.",
     "So \\(V_{xy} = 0\\), and the 150 Ω branch carries no current."],
    vis('loop-potential', { emf: 4, elements: [{ label: '50 Ω (branch 1)', dV: -2 }, { label: '50 Ω (branch 2)', dV: -2 }], I: 0.04 }));

  ci(22, "Internal resistance",
    "A 12 V storage battery with 2 Ω internal resistance is being charged: a current of 2 A is driven into its positive terminal. A voltmeter across its terminals reads",
    ["8 V", "10 V", "12 V", "16 V"],
    "D",
    ["When charging, current is forced backward through the battery, so the charger must overcome both the emf and the internal resistance drop.",
     "\\(V_T = \\varepsilon + Ir = 12 + (2)(2)\\).",
     "\\(V_T = 16\\) V: a terminal voltage can exceed the emf."],
    concept("Charging a battery", ["Discharging: V_T = ε − Ir", "Charging: V_T = ε + Ir", "12 + (2)(2) = 16 V"]));

  ci(23, "Series and parallel",
    "Identical batteries are connected to: A, two 2 Ω resistors in parallel; B, two 4 Ω in parallel; C, two 2 Ω in series; D, a single 2 Ω. In which circuit does the battery supply the most current?",
    ["A", "B", "C", "D"],
    "A",
    ["Equivalent resistances: A = 1 Ω, B = 2 Ω, C = 4 Ω, D = 2 Ω.",
     "\\(I = \\varepsilon/R_{eq}\\): least resistance, most current.",
     "A (1 Ω)."],
    concept("Four loads, same battery", ["A: 2 ∥ 2 = 1 Ω", "B: 4 ∥ 4 = 2 Ω", "C: 2 + 2 = 4 Ω", "D: 2 Ω"]));

  ci(24, "Series and parallel",
    "Same four circuits (A: 2 Ω ∥ 2 Ω; B: 4 Ω ∥ 4 Ω; C: 2 Ω + 2 Ω in series; D: one 2 Ω). Which has the greatest equivalent resistance?",
    ["A", "B", "C", "D"],
    "C",
    ["A = 1 Ω, B = 2 Ω, D = 2 Ω.",
     "Series adds: C = 4 Ω.",
     "C is greatest."],
    concept("Four loads, same battery", ["A: 1 Ω", "B: 2 Ω", "C: 4 Ω (largest)", "D: 2 Ω"]));

  ci(25, "Power",
    "Same four circuits. Which dissipates the least power?",
    ["A", "B", "C", "D"],
    "C",
    ["Same emf, so \\(P = \\varepsilon^2/R_{eq}\\).",
     "Least power means greatest \\(R_{eq}\\).",
     "C (4 Ω)."],
    concept("P = ε²/R_eq", ["Biggest R_eq → least power", "C: 4 Ω"]));

  ci(26, "Capacitors in circuits",
    "Two identical parallel-plate capacitors are connected in series. Their equivalent capacitance",
    ["depends on the charge on each capacitor", "depends on the voltage across both", "is larger than either capacitor's", "is smaller than either capacitor's"],
    "D",
    ["Series capacitors combine with reciprocals: \\(1/C_{eq} = 1/C + 1/C\\).",
     "So \\(C_{eq} = C/2\\).",
     "In effect, the plate gaps add up, which lowers the capacitance.",
     "Note: the workbook's key prints letter C, but its explanation (smaller than the smallest capacitor) matches D."],
    circuit(12, S(Cp('C', 2e-6, { Q: 1.2e-5, V: 6 }), Cp('C', 2e-6, { Q: 1.2e-5, V: 6 })), { ask: 'Example: two 2 µF in series → 1 µF' }));

  ci(27, "Internal resistance",
    "A 12 V battery delivers a steady 0.5 A to a load, and its terminal voltage is 10 V. If it is connected to a load with less resistance, the terminal voltage will be",
    ["12 V", "10 V", "between 10 and 12 V", "less than 10 V"],
    "D",
    ["\\(V_T = \\varepsilon - Ir\\); from the data, \\(r = (12 - 10)/0.5 = 4\\) Ω.",
     "A smaller load resistance draws more current.",
     "More current means a bigger \\(Ir\\) drop inside, so \\(V_T\\) falls below 10 V."],
    vis('loop-potential', { emf: 12, r: 4, elements: [{ label: 'internal r', dV: -2 }, { label: 'load', dV: -10 }], I: 0.5 }));

  ci(28, "Kirchhoff's rules",
    "Three branches meet at junctions X (top) and Y (bottom). The left branch, with a 15 V battery, brings 2 A into X. The right branch, with a 10 V battery, carries 1 A away from X. The middle branch runs from X down to Y through a 10 V battery (positive terminal toward X) and then a 2 Ω resistor. What is the magnitude of the potential difference between X and Y?",
    ["4 V", "8 V", "10 V", "12 V"],
    "D",
    ["Junction rule at X: 2 A in = 1 A out + middle current, so 1 A flows down the middle branch.",
     "Walk from X to Y down the middle: entering the battery at its + end and leaving at −, you drop 10 V; then the resistor (current flowing downward) drops \\((1)(2) = 2\\) V.",
     "\\(V_X - V_Y = 12\\) V."],
    vis('junction', { ins: [{ label: 'left branch', I: 2 }], outs: [{ label: 'right branch', I: 1 }, { label: 'middle branch', I: 1 }], unknown: 'middle branch' }));

  var rcGraphs = ["Starts at its largest value and decays toward zero", "Starts at zero and rises, leveling off at a maximum",
    "Starts high, dips below zero, then returns toward zero", "Starts at zero and curves upward ever more steeply"];
  ci(29, "RC circuits",
    "A battery \\(V\\), a switch, a resistor \\(R\\) and an initially uncharged capacitor \\(C\\) are in series. After the switch closes, which describes the voltage across the resistor over time?",
    rcGraphs,
    "A",
    ["At first the empty capacitor acts like a wire, so the whole battery voltage is across \\(R\\).",
     "As charge builds, the capacitor's voltage grows and leaves less for \\(R\\) (loop rule).",
     "When the capacitor is full, the current and \\(V_R\\) reach zero: a decaying curve."],
    vis('rc', { emf: 12, R: 1000, C: 1e-3, Q: 0, Vc: 0, phase: 'charging-start' }));

  ci(30, "RC circuits",
    "Same series RC circuit (initially uncharged capacitor). Which describes the current over time after the switch closes?",
    rcGraphs,
    "A",
    ["The current is \\(I = V_R/R\\), so it follows the resistor's voltage.",
     "It is largest at the start, when the capacitor acts like a wire.",
     "It decays toward zero as the capacitor fills."],
    vis('rc', { emf: 12, R: 1000, C: 1e-3, Q: 0, Vc: 0, phase: 'charging-start' }));

  ci(31, "RC circuits",
    "Same series RC circuit. Which describes the voltage across the capacitor over time after the switch closes?",
    rcGraphs,
    "B",
    ["The capacitor starts empty: \\(V_C = 0\\).",
     "Charge flows on, so \\(V_C = Q/C\\) rises, quickly at first and then more slowly as the current dies.",
     "It levels off at the battery's voltage."],
    vis('rc', { emf: 12, R: 1000, C: 1e-3, Q: 0.012, Vc: 12, phase: 'steady' }));

  ci(32, "Power",
    "A wire of resistance \\(R\\) dissipates power \\(P\\) carrying current \\(I\\). It is replaced by a wire of resistance \\(3R\\) carrying the same current. The new power is",
    ["\\(P/9\\)", "\\(P/3\\)", "\\(P\\)", "\\(3P\\)"],
    "D",
    ["With the current given, use \\(P = I^2R\\).",
     "Same \\(I\\), three times \\(R\\).",
     "\\(3P\\)."],
    vis('power', { elements: [{ label: 'R', R: 1, I: 1, V: 1, P: 1 }, { label: '3R', R: 3, I: 1, V: 3, P: 3 }] }));

  var fig33 = circuit(null, Pl(S(Cp('2 µF', 2e-6), Cp('2 µF', 2e-6)), S(Cp('2 µF', 2e-6), Cp('2 µF', 2e-6)), S(Cp('2 µF', 2e-6), Cp('2 µF', 2e-6))), { ask: 'Voltage between X and Y for 6 µC on every capacitor?' });
  ci(33, "Capacitors in circuits",
    "Six 2 µF capacitors form three parallel branches between X and Y, each branch being two capacitors in series. What voltage between X and Y puts 6 µC on each plate of every capacitor?",
    ["3 V", "6 V", "9 V", "18 V"],
    "B",
    ["Each capacitor: \\(V = Q/C = 6\\,\\mu\\text{C}/2\\,\\mu\\text{F} = 3\\) V.",
     "Two in series per branch: \\(3 + 3 = 6\\) V.",
     "Parallel branches share the same voltage: 6 V."],
    circuit(6, Pl(S(Cp('2 µF', 2e-6, { Q: 6e-6, V: 3 }), Cp('2 µF', 2e-6, { Q: 6e-6, V: 3 })), S(Cp('2 µF', 2e-6, { Q: 6e-6, V: 3 }), Cp('2 µF', 2e-6, { Q: 6e-6, V: 3 })), S(Cp('2 µF', 2e-6, { Q: 6e-6, V: 3 }), Cp('2 µF', 2e-6, { Q: 6e-6, V: 3 })))),
    fig33);

  var loop3435 = vis('loop-potential', { emf: 12, elements: [{ label: '0.3 Ω', dV: -0.6 }, { label: '6 V battery (opposing)', dV: -6 }, { label: '0.2 Ω', dV: -0.4 }, { label: 'R = 1 Ω', dV: -2 }, { label: '1.5 Ω', dV: -3 }], I: 2 });
  ci(34, "Kirchhoff's loop rule",
    "A single loop contains a 12 V battery, a 6 V battery facing the opposite way, and resistors 0.3 Ω, 0.2 Ω, 1.5 Ω and an unknown \\(R\\). The current is 2 A (driven by the 12 V battery). What is \\(R\\)?",
    ["1 Ω", "2 Ω", "3 Ω", "4 Ω"],
    "A",
    ["Opposing batteries: net emf \\(12 - 6 = 6\\) V.",
     "Loop rule: \\(6 = (2)(0.3 + 0.2 + 1.5 + R)\\).",
     "\\(3 = 2 + R\\), so \\(R = 1\\) Ω."],
    loop3435);

  ci(35, "Kirchhoff's loop rule",
    "Same loop (12 V and an opposing 6 V battery, 0.3 Ω, 0.2 Ω, 1.5 Ω and \\(R\\), current 2 A). Going from X to Y you pass through the 6 V battery (entering at its + terminal), the 0.2 Ω, and \\(R\\), all along the current. What is the potential difference between X and Y?",
    ["1.2 V", "6.0 V", "8.4 V", "10.8 V"],
    "C",
    ["Through the 6 V battery from + to −: \\(-6\\) V.",
     "Across 0.2 Ω and \\(R = 1\\) Ω in the direction of the current: \\(-(2)(0.2) - (2)(1) = -2.4\\) V.",
     "Total: \\(-8.4\\) V, so the magnitude is 8.4 V."],
    loop3435);

  ci(36, "RC circuits",
    "A battery \\(V\\), a switch and \\(R_1\\) are in series, feeding a capacitor \\(C\\) and resistor \\(R_2\\) that are in parallel with each other. After the switch closes, the current from the battery is",
    ["constant, because batteries always give constant current", "constant, because the capacitor is an open circuit and doesn't affect the two resistors",
     "decreasing, because current initially flows into the capacitor", "decreasing, because it reaches zero when the capacitor is full"],
    "C",
    ["At first the empty capacitor acts like a wire, shorting out \\(R_2\\): only \\(R_1\\) limits the current, so it is large.",
     "As \\(C\\) charges, less current goes to it and more goes through \\(R_2\\), so the total resistance rises toward \\(R_1 + R_2\\).",
     "The current decreases, but levels off at \\(V/(R_1 + R_2)\\), not zero."],
    vis('rc', { emf: 12, R: 1000, C: 1e-3, Q: 0, Vc: 0, phase: 'charging-start' }));

  ci(37, "Kirchhoff's rules",
    "A bridge circuit: across a battery there are two paths. The upper path is 1 Ω then 3 Ω; the lower path is 2 Ω then \\(R\\). An ammeter connects the midpoint of the upper path to the midpoint of the lower path. If the ammeter reads zero, \\(R\\) is",
    ["1.5 Ω", "2 Ω", "4 Ω", "6 Ω"],
    "D",
    ["Zero ammeter current means its two ends are at the same potential.",
     "So the drop across 1 Ω equals the drop across 2 Ω, and the voltages divide in the same ratio in both paths: \\(1/3 = 2/R\\).",
     "\\(R = 6\\) Ω."],
    concept("Balanced bridge", ["Ammeter reads 0 → midpoints at equal V", "1 : 3 must equal 2 : R", "R = 6 Ω"]));

  ci(38, "Kirchhoff's rules",
    "Same bridge: upper path 1 Ω then 3 Ω, lower path 2 Ω then \\(R\\), ammeter between the midpoints (upper midpoint drawn above the lower one). The battery's positive terminal is on the right-hand end (the 3 Ω / \\(R\\) side). For current to flow through the ammeter toward the bottom of the page, compared with the balanced value \\(R\\) must be",
    ["larger, so the voltage across \\(R\\) increases", "larger, so the equivalent resistance increases",
     "smaller, so the voltage across \\(R\\) decreases", "smaller, so the equivalent resistance decreases"],
    "A",
    ["Current flows down through the ammeter only if the upper midpoint is at a higher potential than the lower midpoint.",
     "Measured up from the left (low) end: upper midpoint \\(= \\varepsilon\\cdot\\tfrac{1}{4}\\); lower midpoint \\(= \\varepsilon\\cdot\\tfrac{2}{2+R}\\).",
     "Need \\(\\tfrac14 > \\tfrac{2}{2+R}\\), so \\(R > 6\\) Ω: larger. Then \\(R\\) takes a bigger share of the voltage (its ratio \\(R/2\\) beats \\(3/1\\))."],
    concept("Unbalanced bridge", ["Current flows high V → low V", "Upper midpoint: ε/4 above the low end", "Lower midpoint: 2ε/(2+R) → need R > 6 Ω"]));

  ci(39, "RC circuits",
    "A resistor \\(R\\) and capacitor \\(C\\) are in series with a battery of terminal voltage \\(V_0\\). Which equation relates the current \\(I\\) and capacitor charge \\(Q\\)?",
    ["\\(V_0 + QC - I^2R = 0\\)", "\\(V_0 - Q/C - IR = 0\\)", "\\(V_0^2 - Q^2/2C - I^2R = 0\\)", "\\(V_0 - CI - I^2R = 0\\)"],
    "B",
    ["Loop rule: the battery's rise equals the sum of the drops.",
     "Resistor drop: \\(IR\\). Capacitor drop: \\(V = Q/C\\).",
     "\\(V_0 - Q/C - IR = 0\\)."],
    vis('loop-potential', { emf: 12, elements: [{ label: 'R (IR)', dV: -8 }, { label: 'C (Q/C)', dV: -4 }], I: 0.008 }));

  ci(40, "Power",
    "Which combination of 4 Ω resistors dissipates 24 W on a 12 V battery?",
    ["Two in series", "Three in parallel", "One in parallel with a series pair of two", "One in series with a parallel pair of two"],
    "D",
    ["Needed resistance: \\(R = V^2/P = 144/24 = 6\\) Ω.",
     "Options: 8 Ω; 4/3 Ω; \\(4 \\parallel 8 = 8/3\\) Ω; \\(4 + 4\\parallel4 = 4 + 2 = 6\\) Ω.",
     "The last one."],
    circuit(12, S(R('4 Ω', 4, { I: 2, V: 8 }), Pl(R('4 Ω', 4, { I: 1, V: 4 }), R('4 Ω', 4, { I: 1, V: 4 })))));

  var fig41 = circuit(12, S(Pl(Cp('3.0 µF', 3e-6), Cp('3.0 µF', 3e-6)), Cp('3.0 µF', 3e-6)), { ask: 'X before the parallel pair, Y between, Z after the single capacitor' });
  ci(41, "Capacitors in circuits",
    "Three identical 3.0 µF capacitors and a 12 V battery: two capacitors in parallel between points X and Y, then the third capacitor alone between Y and Z. The voltage between Y and Z is",
    ["6 V, because all capacitors have the same voltage", "8 V, because charge is conserved on the wires containing point Y",
     "6 V, because charge is conserved on the wires containing point Y", "8 V, because all capacitors have the same charge"],
    "B",
    ["The isolated wires around Y start neutral and stay neutral, so the charge on the X–Y group equals the charge on the Y–Z capacitor.",
     "X–Y is \\(6\\,\\mu\\)F, Y–Z is \\(3\\,\\mu\\)F. Same \\(Q\\), so \\(V = Q/C\\) is twice as large on Y–Z.",
     "\\(V_{XY} + V_{YZ} = 12\\) V gives 4 V and 8 V."],
    circuit(12, S(Pl(Cp('3.0 µF', 3e-6, { Q: 1.2e-5, V: 4 }), Cp('3.0 µF', 3e-6, { Q: 1.2e-5, V: 4 })), Cp('3.0 µF', 3e-6, { Q: 2.4e-5, V: 8 }))),
    fig41);

  ci(42, "Bulb brightness",
    "Two identical bulbs are in series with a battery and glow equally. A switch S is connected across bulb 2 (from one side of it to the other). When S is closed,",
    ["bulb 1 goes out; bulb 2 gets brighter", "bulb 1 gets brighter; bulb 2 goes out", "bulb 1 gets brighter; bulb 2 gets slightly dimmer", "bulb 1 gets slightly dimmer; bulb 2 gets brighter"],
    "B",
    ["The closed switch is a zero-resistance path around bulb 2, so current bypasses it: bulb 2 goes out.",
     "The total resistance drops from \\(2R\\) to \\(R\\), so the current doubles.",
     "Bulb 1 now has the whole battery voltage: brighter."],
    circuit(12, S(Bulb('bulb 1', 10, { I: 1.2, V: 12 })), { ask: 'After closing S: bulb 2 shorted out' }));

  ci(43, "Series and parallel",
    "An ammeter and a 15 Ω resistor are in series with a 20 Ω resistor; a 60 Ω resistor with a switch S in series is connected in parallel with the 20 Ω. With S open the ammeter reads 2.0 A. When S is closed, the reading",
    ["doubles", "increases slightly but does not double", "stays the same", "decreases slightly"],
    "B",
    ["S open: \\(15 + 20 = 35\\) Ω carries 2.0 A, so the battery is 70 V.",
     "S closed: \\(20 \\parallel 60 = 15\\) Ω, total 30 Ω, so \\(I = 70/30 \\approx 2.3\\) A.",
     "A small increase. Doubling would need the total resistance halved."],
    circuit(70, S(R('15 Ω', 15, { I: 2.33, V: 35 }), Pl(R('20 Ω', 20, { I: 1.75, V: 35 }), R('60 Ω', 60, { I: 0.58, V: 35 }))), { ask: 'S closed (battery found to be 70 V)' }));

  ci(44, "Resistivity",
    "Two cylindrical wires are made of the same material, and wire X has twice the resistance of wire Y. Which could be true?",
    ["X has twice Y's diameter.", "X is twice as long as Y and has twice its diameter.", "Y is twice as long as X and has twice its diameter.", "Y is twice as long as X."],
    "C",
    ["\\(R = \\rho L/A\\) with \\(A \\propto d^2\\), so \\(R \\propto L/d^2\\).",
     "Option C: \\(R_Y \\propto 2L/(2d)^2 = \\tfrac12 L/d^2\\), so \\(R_Y = \\tfrac12 R_X\\). That matches.",
     "A gives \\(R_X = R_Y/4\\); B gives \\(R_X = R_Y/2\\); D gives \\(R_Y = 2R_X\\)."],
    vis('resistivity', { rho: 1.7e-8, L: 1, A: 7.85e-7, R: 0.0217 }));

  ci(45, "Internal resistance",
    "Two identical batteries (emf \\(\\varepsilon\\), internal resistance \\(r\\)) each carry 1 A. In one, current flows out of the + terminal (discharging) and the terminal voltage is 10 V. In the other, current is driven into the + terminal (charging) and the terminal voltage is 20 V. What are \\(\\varepsilon\\) and \\(r\\)?",
    ["\\(\\varepsilon = 5\\) V, \\(r = 15\\) Ω", "\\(\\varepsilon = 10\\) V, \\(r = 100\\) Ω", "\\(\\varepsilon = 15\\) V, \\(r = 5\\) Ω", "\\(\\varepsilon = 20\\) V, \\(r = 10\\) Ω"],
    "C",
    ["Discharging: \\(V_T = \\varepsilon - Ir\\), so \\(\\varepsilon - r = 10\\).",
     "Charging: \\(V_T = \\varepsilon + Ir\\), so \\(\\varepsilon + r = 20\\).",
     "Add: \\(2\\varepsilon = 30\\), so \\(\\varepsilon = 15\\) V and \\(r = 5\\) Ω."],
    vis('loop-potential', { emf: 15, r: 5, elements: [{ label: 'internal r', dV: -5 }, { label: 'external load', dV: -10 }], I: 1 }));

  var fig4749 = circuit(null, S(Pl(Bulb('K'), S(Bulb('L'), Bulb('M'))), Bulb('N')), { ask: 'Four identical bulbs' });
  ci(47, "Bulb brightness",
    "Four identical bulbs: bulb K is in parallel with a series pair L and M, and that whole group is in series with bulb N and the battery. Rank the currents.",
    ["K > L > M > N", "L = M > K = N", "L > M > K > N", "N > K > L = M"],
    "D",
    ["N is in the main line, so it carries all the current.",
     "The current splits: the L–M branch has twice the resistance of K, so it gets half as much as K.",
     "L and M are in series, so they share the same current. \\(N > K > L = M\\)."],
    circuit(12, S(Pl(Bulb('K', 10, { I: 0.48, V: 4.8 }), S(Bulb('L', 10, { I: 0.24, V: 2.4 }), Bulb('M', 10, { I: 0.24, V: 2.4 }))), Bulb('N', 10, { I: 0.72, V: 7.2 })), { ask: 'Example: 12 V, 10 Ω bulbs' }),
    fig4749);

  ci(48, "Bulb brightness",
    "Same circuit (K in parallel with L–M in series, all in series with N). Bulb K burns out. Then",
    ["only bulb N goes out", "bulb N gets brighter", "bulb N's brightness stays the same", "bulb N gets dimmer but stays lit"],
    "D",
    ["With K gone, N, L and M are all in series.",
     "Total resistance rises from \\(R + \\tfrac23 R\\) to \\(3R\\), so the current through N drops.",
     "N dims but stays lit."],
    circuit(12, S(Bulb('L', 10, { I: 0.4, V: 4 }), Bulb('M', 10, { I: 0.4, V: 4 }), Bulb('N', 10, { I: 0.4, V: 4 })), { ask: 'Example after K burns out: N current 0.72 A → 0.40 A' }),
    fig4749);

  ci(49, "Bulb brightness",
    "Same circuit. This time bulb M burns out. Then",
    ["only bulb M goes out", "bulb N goes out, but at least one other stays lit", "bulb N's brightness stays the same", "bulb N gets dimmer but stays lit"],
    "D",
    ["M's branch is broken, so L (in series with M) goes out too.",
     "What's left is K and N in series: total \\(2R\\), up from \\(\\tfrac53 R\\).",
     "Less current through N: dimmer, but lit."],
    circuit(12, S(Bulb('K', 10, { I: 0.6, V: 6 }), Bulb('N', 10, { I: 0.6, V: 6 })), { ask: 'Example after M burns out: N current 0.72 A → 0.60 A' }),
    fig4749);

  var fig50 = circuit(5, S(R('ammeter (25 Ω)', 25), Pl(R('R'), R('voltmeter (10.0 kΩ)', 10000)), R('975 Ω', 975)), { ask: 'Ammeter reads 1.00 mA; voltmeter reading?' });
  ci(50, "Meters",
    "A 5.00 V battery, an ammeter (internal resistance 25.0 Ω), a 975 Ω resistor, and a resistor \\(R\\) are in series; a voltmeter (internal resistance 10.0 kΩ) is connected across \\(R\\). The ammeter reads 1.00 mA. The voltmeter reads about",
    ["1.0 V", "3.0 V", "4.0 V", "5.0 V"],
    "C",
    ["The full 1.00 mA flows through the ammeter and the 975 Ω.",
     "Drops: \\((0.001)(25) = 0.025\\) V and \\((0.001)(975) = 0.975\\) V, together 1.00 V.",
     "Loop rule: the \\(R\\)–voltmeter pair gets \\(5.00 - 1.00 = 4.0\\) V."],
    vis('loop-potential', { emf: 5, elements: [{ label: 'ammeter 25 Ω', dV: -0.025 }, { label: 'R ∥ voltmeter', dV: -4.0 }, { label: '975 Ω', dV: -0.975 }], I: 0.001 }),
    fig50);

  ci(51, "Series and parallel",
    "Resistors \\(R_1\\) and \\(R_2\\) in parallel have an equivalent resistance of 5 Ω. Which is correct?",
    ["Both are greater than 5 Ω.", "Both equal 5 Ω.", "Both are less than 5 Ω.", "\\(R_1 + R_2 = 5\\) Ω."],
    "A",
    ["Adding a parallel path always gives the current an extra route, lowering resistance.",
     "So a parallel combination is smaller than its smallest member.",
     "Both must exceed 5 Ω (e.g., 10 Ω ∥ 10 Ω = 5 Ω)."],
    circuit(10, Pl(R('10 Ω', 10, { I: 1, V: 10 }), R('10 Ω', 10, { I: 1, V: 10 })), { ask: 'Example: 10 Ω ∥ 10 Ω = 5 Ω' }));

  ci(52, "Power",
    "One resistor on a battery (no internal resistance) dissipates total power \\(P\\). With \\(n\\) identical resistors in series on the same battery, the total power is",
    ["\\(n^2P\\)", "\\(nP\\)", "\\(P/n\\)", "\\(P/n^2\\)"],
    "C",
    ["\\(P = \\varepsilon^2/R_{eq}\\).",
     "\\(n\\) in series: \\(R_{eq} = nR\\).",
     "\\(P' = \\varepsilon^2/(nR) = P/n\\)."],
    concept("Same battery, more series resistors", ["R_eq = nR", "P = ε²/R_eq", "Total power ÷ n"]));

  var fig53 = circuit(null, S(R('4.0 Ω', 4), Pl(R('2.0 Ω', 2), R('3.0 Ω', 3), R('6.0 Ω', 6, { I: 1 }))), { ask: 'Current in 6.0 Ω is 1.0 A; find V' });
  ci(53, "Series and parallel",
    "A power supply \\(V\\) drives a 4.0 Ω resistor in series with three resistors in parallel: 2.0 Ω, 3.0 Ω and 6.0 Ω. The current in the 6.0 Ω resistor is 1.0 A. What is \\(V\\)?",
    ["10 V", "18 V", "24 V", "30 V"],
    "D",
    ["Parallel voltage: \\((1.0)(6.0) = 6.0\\) V, so the 3 Ω carries 2 A and the 2 Ω carries 3 A.",
     "Total current: \\(1 + 2 + 3 = 6\\) A, all through the 4 Ω: \\((6)(4) = 24\\) V.",
     "\\(V = 24 + 6 = 30\\) V."],
    circuit(30, S(R('4.0 Ω', 4, { I: 6, V: 24 }), Pl(R('2.0 Ω', 2, { I: 3, V: 6 }), R('3.0 Ω', 3, { I: 2, V: 6 }), R('6.0 Ω', 6, { I: 1, V: 6 })))),
    fig53);

  var fig54 = circuit(null, S(R('100 Ω', 100), Pl(R('300 Ω', 300), S(R('200 Ω', 200), Cp('3.00 µF', 3e-6, { Q: 18e-6 })))), { ask: 'Capacitor fully charged to 18.0 µC; find V' });
  ci(54, "RC steady state",
    "A supply \\(V\\) drives a 100 Ω resistor in series with a 300 Ω resistor. Across the 300 Ω is a branch with a 200 Ω resistor and a 3.00 µF capacitor in series. The capacitor is fully charged with 18.0 µC. What is \\(V\\)?",
    ["4.40 V", "6.00 V", "8.00 V", "10.4 V"],
    "C",
    ["\\(V_C = Q/C = 18.0/3.00 = 6.00\\) V. Fully charged, so no current in that branch and no drop across the 200 Ω.",
     "So the 300 Ω has 6.00 V: \\(I = 0.0200\\) A, which also flows through the 100 Ω (drop 2.00 V).",
     "\\(V = 6.00 + 2.00 = 8.00\\) V."],
    circuit(8, S(R('100 Ω', 100, { I: 0.02, V: 2 }), Pl(R('300 Ω', 300, { I: 0.02, V: 6 }), S(R('200 Ω', 200, { I: 0, V: 0 }), Cp('3.00 µF', 3e-6, { Q: 18e-6, V: 6 }))))),
    fig54);

  ci(55, "Series and parallel",
    "A battery is connected to resistor Z in parallel with a series pair X and Y. If the current is the same in all three resistors, which must be true?",
    ["X, Y and Z are all equal.", "X and Y are equal.", "X + Y equals Z.", "X and Y are each larger than Z."],
    "C",
    ["X and Y are in series, so they always share one current.",
     "The two branches have the same voltage, so equal branch currents need equal branch resistances.",
     "\\(X + Y = Z\\)."],
    circuit(null, Pl(R('Z'), S(R('X'), R('Y')))));

  ci(56, "Power",
    "Four equal resistors: resistor D is connected directly across the battery, and resistors A, B and C are in series in a second branch across the battery. Which dissipates the most power?",
    ["A", "B", "C", "D"],
    "D",
    ["D has the full battery voltage; A, B and C split it three ways.",
     "\\(P = V^2/R\\) with equal \\(R\\).",
     "D, with 3× the voltage, has 9× the power of each of the others."],
    circuit(9, Pl(S(R('B', 10, { I: 0.3, V: 3 }), R('A', 10, { I: 0.3, V: 3 }), R('C', 10, { I: 0.3, V: 3 })), R('D', 10, { I: 0.9, V: 9 })), { ask: 'Example: 9 V, 10 Ω each' }));

  ci(57, "Potential in circuits",
    "Two uniform resistance wires of equal length are each connected directly across the same 1.56 V cell; wire X is twice as thick as wire Y. Which best describes the potential versus position along the two wires?",
    ["Both rise linearly, X more steeply than Y", "Both rise linearly, Y more steeply than X", "Both fall linearly, at different rates", "Both rise along the same straight line"],
    "D",
    ["Each wire is directly across the cell, so each has the full 1.56 V from end to end.",
     "In a uniform wire the potential changes evenly with position.",
     "Same length, same total drop: identical lines. Thickness changes the current, not the potential profile."],
    vis('loop-potential', { emf: 1.56, elements: [{ label: 'wire (either X or Y)', dV: -1.56 }], I: 1 }));

  var fig58 = circuit(10, S(Bulb('A', 10), Pl(S(Bulb('B', 10), Bulb('C', 10)), Bulb('D', 10)), Bulb('E', 10)), { ask: 'Five identical 10 Ω bulbs' });
  ci(58, "Bulb brightness",
    "Five identical 10 Ω bulbs, a switch, and a 10 V battery: bulbs A and E are in the main line; between them, bulbs B and C in series form one branch and bulb D forms a parallel branch. Which bulb(s) could burn out without other bulbs going out?",
    ["Only D", "Only E", "Only C or D", "B, C or D"],
    "A",
    ["A or E burning out breaks the main line: everything goes dark.",
     "B and C are in series with each other, so if either fails, the other goes out too.",
     "D failing leaves A–B–C–E still connected: only D."],
    fig58, fig58);

  var fig5961 = circuit(null, S(R('ammeter'), R('20 Ω', 20), Pl(R('15 Ω', 15), S(R('S'), R('30 Ω', 30)))), { ask: 'Ammeter reads 2.0 A with S open' });
  ci(59, "Series and parallel",
    "An ideal battery, ideal ammeter, 20 Ω and 15 Ω resistors are in series. A 30 Ω resistor with a switch S is connected across the 15 Ω. With S open, the ammeter reads 2.0 A. What is the voltage across the 15 Ω resistor (S open)?",
    ["30 V", "40 V", "60 V", "70 V"],
    "A",
    ["With S open, the 30 Ω branch carries nothing.",
     "The full 2.0 A flows through the 15 Ω.",
     "\\(V = IR = (2.0)(15) = 30\\) V."],
    circuit(70, S(R('20 Ω', 20, { I: 2, V: 40 }), R('15 Ω', 15, { I: 2, V: 30 })), { ask: 'S open' }),
    fig5961);

  ci(60, "Series and parallel",
    "Same circuit with S open (20 Ω and 15 Ω in series, 2.0 A). What is the battery voltage?",
    ["30 V", "40 V", "60 V", "70 V"],
    "D",
    ["Series: \\(R = 20 + 15 = 35\\) Ω.",
     "\\(\\varepsilon = IR = (2.0)(35)\\).",
     "70 V."],
    circuit(70, S(R('20 Ω', 20, { I: 2, V: 40 }), R('15 Ω', 15, { I: 2, V: 30 })), { ask: 'S open' }),
    fig5961);

  ci(61, "Series and parallel",
    "Same circuit (70 V battery found above). When S is closed, the current is",
    ["1.7 A", "2.0 A", "2.3 A", "3.0 A"],
    "C",
    ["Closing S puts 30 Ω in parallel with 15 Ω: \\(\\dfrac{15\\cdot30}{45} = 10\\) Ω.",
     "Total: \\(20 + 10 = 30\\) Ω.",
     "\\(I = 70/30 \\approx 2.3\\) A."],
    circuit(70, S(R('20 Ω', 20, { I: 2.33, V: 46.7 }), Pl(R('15 Ω', 15, { I: 1.56, V: 23.3 }), R('30 Ω', 30, { I: 0.78, V: 23.3 }))), { ask: 'S closed' }),
    fig5961);

  var fig6263 = circuit(9, Pl(S(R('7 Ω (A→B)', 7), R('2 Ω (B→D)', 2)), S(R('4 Ω (A→C)', 4), R('5 Ω (C→D)', 5))), { ask: 'A = top junction (battery +), D/E = bottom junction' });
  var vis6263 = circuit(9, Pl(S(R('7 Ω (A→B)', 7, { I: 1, V: 7 }), R('2 Ω (B→D)', 2, { I: 1, V: 2 })), S(R('4 Ω (A→C)', 4, { I: 1, V: 4 }), R('5 Ω (C→D)', 5, { I: 1, V: 5 }))));
  ci(62, "Series and parallel",
    "A 9 V battery feeds point A. From A, one path goes through 7 Ω to point B and then 2 Ω to point D; the other path goes through 4 Ω to point C and then 5 Ω to D. D connects through point E back to the battery. How does the current in the 2 Ω compare with the current in the 4 Ω?",
    ["Twice as large", "Half as large", "Equal", "Four times as large"],
    "C",
    ["Each path is two resistors in series: \\(7 + 2 = 9\\) Ω and \\(4 + 5 = 9\\) Ω.",
     "Both paths have the full 9 V across them.",
     "Each carries \\(9/9 = 1\\) A: equal."],
    vis6263, fig6263);

  ci(63, "Potential in circuits",
    "Same circuit (A → 7 Ω → B → 2 Ω → D, and A → 4 Ω → C → 5 Ω → D, 9 V). What is the potential at B relative to C?",
    ["+7 V", "+3 V", "0 V", "−3 V"],
    "D",
    ["Each path carries 1 A.",
     "From A to B the potential drops 7 V; from A to C it drops 4 V.",
     "\\(V_B - V_C = (V_A - 7) - (V_A - 4) = -3\\) V."],
    vis6263, fig6263);

  var fig64 = circuit(null, S(Bulb('1'), Pl(Bulb('2'), Bulb('3'), S(R('S'), Bulb('4')))), { ask: 'All bulbs identical; bulb 4 lights only when S closes' });
  ci(64, "Bulb brightness",
    "Identical bulbs: bulb 1 is in the main line; after it, bulbs 2 and 3 are in parallel. Bulb 4, in series with an open switch S, is connected in parallel with bulb 3. When S is closed and bulb 4 lights, which other bulb(s) get brighter?",
    ["Bulb 1 only", "Bulb 2 only", "Bulbs 2 and 3 only", "Bulbs 1, 2 and 3"],
    "A",
    ["Adding bulb 4 adds another parallel path, so the total resistance drops.",
     "More total current flows through bulb 1 in the main line: brighter.",
     "Bulb 1 now takes more of the battery voltage, leaving less for the parallel group: bulbs 2 and 3 dim."],
    circuit(12, S(Bulb('1', 10, { I: 0.9, V: 9 }), Pl(Bulb('2', 10, { I: 0.3, V: 3 }), Bulb('3', 10, { I: 0.3, V: 3 }), Bulb('4', 10, { I: 0.3, V: 3 }))), { ask: 'Example (12 V, 10 Ω): bulb 1 0.80 A → 0.90 A; bulbs 2, 3: 0.40 A → 0.30 A' }),
    fig64);

  var fig6566 = circuit(null, S(R('J'), Pl(S(R('K'), R('L')), R('M')), R('N')), { ask: 'Five identical resistors' });
  var vis6566 = circuit(12, S(R('J', 10, { I: 0.45, V: 4.5 }), Pl(S(R('K', 10, { I: 0.15, V: 1.5 }), R('L', 10, { I: 0.15, V: 1.5 })), R('M', 10, { I: 0.3, V: 3 })), R('N', 10, { I: 0.45, V: 4.5 })), { ask: 'Example: 12 V, 10 Ω each' });
  ci(65, "Series and parallel",
    "Five identical resistors: J, then a parallel group (K and L in series on one side, M alone on the other), then N, all in series with a voltage source. Which resistor(s) carry the most current?",
    ["M only", "N only", "J and N only", "K and L only"],
    "C",
    ["J and N are in the main line: all of the current passes through each.",
     "The current splits at the parallel group (M gets 2/3, K–L gets 1/3).",
     "J and N carry the most."],
    vis6566, fig6566);

  ci(66, "Power",
    "Same five resistors (J, then K–L in series parallel with M, then N). Which have the greatest rate of energy dissipation?",
    ["M only", "N only", "J and N only", "K and L only"],
    "C",
    ["All the resistors are identical, so \\(P = I^2R\\) is largest where \\(I\\) is largest.",
     "J and N carry the full current.",
     "J and N."],
    vis('power', { elements: [{ label: 'J', R: 10, I: 0.45, V: 4.5, P: 2.03 }, { label: 'K', R: 10, I: 0.15, V: 1.5, P: 0.225 }, { label: 'L', R: 10, I: 0.15, V: 1.5, P: 0.225 }, { label: 'M', R: 10, I: 0.3, V: 3, P: 0.9 }, { label: 'N', R: 10, I: 0.45, V: 4.5, P: 2.03 }] }),
    fig6566);

  var fig67 = circuit(null, S(R('ammeter'), Bulb('R1'), Pl(Bulb('R2 (A to D)'), S(Bulb('R3 (D to C)'), Bulb('R4 (C to B)')))), { ask: 'A and B are joined by a wire' });
  ci(67, "Bulb brightness",
    "A battery and ideal ammeter feed bulb \\(R_1\\), which leads to point D. From D, bulb \\(R_2\\) goes to point A; also from D, bulb \\(R_3\\) goes to point C and bulb \\(R_4\\) goes from C to point B. A and B are joined by a wire back to the battery. All bulbs are identical. Bulb \\(R_4\\) is removed, breaking the circuit there. Which is true afterward?",
    ["The voltage from B to C increases.", "The power supplied by the battery increases.", "The voltage across \\(R_1\\) increases.", "The ammeter reading is unchanged."],
    "A",
    ["Removing \\(R_4\\) kills the \\(R_3\\)–\\(R_4\\) branch. Total resistance rises from \\(\\tfrac53R\\) to \\(2R\\), so the current, \\(V_{R_1}\\), and battery power all drop.",
     "With no current in \\(R_3\\), point C sits at D's potential. So \\(V_{BC} = V_{AD}\\) = the voltage across \\(R_2\\).",
     "Before: \\(V_{BC} = \\varepsilon/5\\) (across \\(R_4\\)). After: \\(V_{R_2} = \\varepsilon/2\\). It increases."],
    circuit(10, S(Bulb('R1', 10, { I: 0.5, V: 5 }), Bulb('R2', 10, { I: 0.5, V: 5 })), { ask: 'Example after removal (10 V, 10 Ω): V(BC) = V(R2) = 5 V, up from 2 V' }),
    fig67);

  ci(68, "Resistivity",
    "Current through a bulb's thin filament makes it white-hot, while the thicker connecting wires stay cool. This happens because",
    ["the connecting wires have more resistance than the filament", "the thin filament has more resistance than the connecting wires",
     "the filament isn't insulated", "the filament carries more current than the connecting wires"],
    "B",
    ["The filament and wires are in series, so they carry the same current.",
     "\\(P = I^2R\\): the piece with more resistance turns more energy into heat.",
     "The thin filament (small \\(A\\) in \\(R = \\rho L/A\\)) has the larger resistance."],
    vis('power', { elements: [{ label: 'filament', R: 240, I: 0.5, V: 120, P: 60 }, { label: 'wires', R: 0.1, I: 0.5, V: 0.05, P: 0.025 }] }));

  var fig69 = circuit(12, S(R('3.0 Ω', 3), R('6.0 Ω', 6)), { r: 1, ask: 'Voltmeter across the battery terminals' });
  ci(69, "Internal resistance",
    "A 12.0 V battery with 1.0 Ω internal resistance drives a 3.0 Ω and a 6.0 Ω resistor in series. An ideal voltmeter is connected across the battery's terminals. It reads",
    ["10.0 V", "10.5 V", "10.8 V", "11.6 V"],
    "C",
    ["Total resistance: \\(1 + 3 + 6 = 10\\) Ω, so \\(I = 12/10 = 1.2\\) A.",
     "Terminal voltage: \\(V_T = \\varepsilon - Ir = 12 - (1.2)(1.0)\\).",
     "10.8 V (which also equals \\(1.2 \\times 9\\))."],
    circuit(12, S(R('3.0 Ω', 3, { I: 1.2, V: 3.6 }), R('6.0 Ω', 6, { I: 1.2, V: 7.2 })), { r: 1, ask: 'V_T = 12 − 1.2 = 10.8 V' }),
    fig69);

  var fig70 = circuit(null, S(Bulb('1'), Pl(Bulb('2'), S(Bulb('3'), Bulb('4')))), { ask: 'A just before bulb 3, B between bulbs 3 and 4' });
  ci(70, "Bulb brightness",
    "Identical bulbs: bulb 1 in the main line, then bulb 2 in parallel with a series pair of bulbs 3 and 4. Point A is just before bulb 3 and point B is between bulbs 3 and 4. A wire is connected from A to B, so bulb 3 goes out. Which bulbs get brighter?",
    ["Only bulb 4", "Only bulbs 1 and 4", "Only bulbs 2 and 4", "Bulbs 1, 2 and 4"],
    "B",
    ["The 3–4 branch drops from \\(2R\\) to \\(R\\), so the parallel group drops from \\(\\tfrac23R\\) to \\(\\tfrac12R\\) and the total resistance falls.",
     "More total current: bulb 1 brightens. Bulb 1 takes more voltage, so the parallel group gets less: bulb 2 dims.",
     "Bulb 4 now has the whole parallel voltage instead of half: \\(\\tfrac13\\varepsilon\\) vs. \\(\\tfrac15\\varepsilon\\). Brighter."],
    circuit(12, S(Bulb('1', 10, { I: 0.8, V: 8 }), Pl(Bulb('2', 10, { I: 0.4, V: 4 }), Bulb('4', 10, { I: 0.4, V: 4 }))), { ask: 'Example (12 V, 10 Ω) after shorting bulb 3' }),
    fig70);

  ci(71, "Capacitors in circuits",
    "A 5 µF capacitor has \\(+100\\) µC on its top plate and \\(-100\\) µC on its bottom. A 20 µF capacitor has \\(-50\\) µC on its top plate and \\(+50\\) µC on its bottom. Two switches close at once, connecting top plate to top plate and bottom to bottom. At equilibrium, the charge on the 5 µF's top plate is",
    ["50 µC", "30 µC", "25 µC", "10 µC"],
    "D",
    ["Charge is conserved on the connected top plates: \\(+100 - 50 = +50\\) µC to share.",
     "Connected in parallel, they end at the same voltage, so charge splits in proportion to \\(C\\): 5 : 20 = 1 : 4.",
     "5 µF gets \\(\\tfrac15(50) = 10\\) µC."],
    circuit(null, Pl(Cp('5 µF', 5e-6, { Q: 1e-5, V: 2 }), Cp('20 µF', 20e-6, { Q: 4e-5, V: 2 })), { ask: 'After connecting: common V = 50 µC / 25 µF = 2 V' }));

  ci(72, "Resistivity",
    "How should a bulb's filament be changed to make the bulb give more light at the same voltage?",
    ["Increase the resistivity only.", "Increase the diameter only.", "Decrease the diameter only.", "Decrease the diameter and increase the resistivity."],
    "B",
    ["Same voltage: \\(P = V^2/R\\), so more light needs less resistance.",
     "\\(R = \\rho L/A\\): a thicker filament (bigger \\(A\\)) lowers \\(R\\).",
     "Raising \\(\\rho\\) or thinning it would raise \\(R\\) and dim the bulb."],
    vis('resistivity', { rho: 5.6e-8, L: 0.5, A: 2e-9, R: 14 }));

  var fig74 = circuit(null, Pl(S(Cp('1 µF', 1e-6), Cp('C')), S(R('1 Ω', 1), R('3 Ω', 3))), { ask: 'a between the capacitors, b between the resistors; V(ab) = 0?' });
  ci(74, "RC steady state",
    "Two branches sit across the same battery. Branch 1: a 1 µF capacitor then an unknown capacitor \\(C\\), with point a between them. Branch 2: a 1 Ω resistor then a 3 Ω resistor, with point b between them (the 1 µF and the 1 Ω connect to the same terminal). In steady state, for what \\(C\\) is the potential difference between a and b zero?",
    ["1/3 µF", "2/3 µF", "2 µF", "3 µF"],
    "A",
    ["Resistor branch: current is the same in both, so the 3 Ω drop is 3 times the 1 Ω drop.",
     "For \\(V_{ab} = 0\\), the drop across \\(C\\) must be 3 times the drop across the 1 µF.",
     "Series capacitors carry the same \\(Q\\), so \\(V = Q/C\\): three times the voltage means a third of the capacitance. \\(C = 1/3\\) µF."],
    concept("Balanced capacitor–resistor bridge", ["Resistors: V splits 1 : 3", "Series capacitors: V ∝ 1/C", "Need 1/C : 1/1 = 3 → C = 1/3 µF"]),
    fig74);

  var fig75 = circuit(null, S(Bulb('1'), Pl(Bulb('2'), S(Bulb('3'), Bulb('4')))), { ask: 'A on the return wire, B between bulbs 3 and 4' });
  ci(75, "Bulb brightness",
    "Four identical bulbs of resistance \\(R\\): bulb 1 in the main line, then bulb 2 in parallel with a series pair of bulbs 3 and 4. Point A is on the return wire to the battery, and point B is between bulbs 3 and 4. A wire is connected from A to B (shorting bulb 4). Which bulbs get brighter?",
    ["Bulb 1 only", "Bulb 2 only", "Bulb 3 only", "Bulbs 1 and 3 only"],
    "D",
    ["Bulb 4 is bypassed, so the 3–4 branch drops from \\(2R\\) to \\(R\\) and the total resistance falls.",
     "More total current: bulb 1 brightens, leaving less voltage for the parallel group, so bulb 2 dims.",
     "Bulb 3 now gets the whole parallel voltage instead of half: \\(\\tfrac13\\varepsilon\\) vs. \\(\\tfrac15\\varepsilon\\). Brighter."],
    circuit(12, S(Bulb('1', 10, { I: 0.8, V: 8 }), Pl(Bulb('2', 10, { I: 0.4, V: 4 }), Bulb('3', 10, { I: 0.4, V: 4 }))), { ask: 'Example (12 V, 10 Ω) after shorting bulb 4' }),
    fig75);

  ci(76, "RC circuits",
    "A series RC circuit: \\(R = 10.0\\) Ω, \\(C = 5.0\\) F, battery 12 V. The capacitor starts uncharged and the switch closes at \\(t = 0\\). Some time later the current is 0.50 A. What is the voltage across the capacitor then?",
    ["5 V", "6 V", "7 V", "12 V"],
    "C",
    ["Resistor: \\(V_R = IR = (0.50)(10.0) = 5\\) V.",
     "Loop rule: \\(12 = V_R + V_C\\).",
     "\\(V_C = 12 - 5 = 7\\) V."],
    vis('loop-potential', { emf: 12, elements: [{ label: 'R = 10 Ω', dV: -5 }, { label: 'C = 5.0 F', dV: -7 }], I: 0.5 }));

  ci(77, "Bulb brightness",
    "A constant-current source drives identical bulbs. Bulb 1 is in the main line; bulb 2 is connected between points A and B. A second branch from C to D, in parallel with bulb 2, holds an open switch S and bulb 3. After S is closed, which is correct?",
    ["Bulb 2 gets brighter.", "Bulb 1 gets dimmer.", "All three bulbs get equally brighter.", "The voltage between C and D decreases."],
    "D",
    ["The source keeps the total current fixed, so bulb 1 is unchanged.",
     "Bulbs 2 and 3 now split that current: half each, so bulb 2 dims.",
     "\\(V_{CD} = V_{AB} = (I/2)R\\), half of what it was (\\(IR\\) before): it decreases."],
    concept("Constant-current source", ["Total I fixed → bulb 1 unchanged", "Bulbs 2 and 3 split I", "V(AB) = V(CD) halves"]));

  ci(78, "Power",
    "Resistors \\(R\\) and \\(4R\\) are in series across voltage \\(V\\). If \\(R\\) dissipates power \\(P\\), the \\(4R\\) resistor dissipates",
    ["\\(4P\\)", "\\(P\\)", "\\(\\tfrac12 P\\)", "\\(\\tfrac14 P\\)"],
    "A",
    ["Series: same current through both.",
     "\\(P = I^2R\\) is proportional to \\(R\\) at fixed \\(I\\).",
     "\\(4R\\) dissipates \\(4P\\)."],
    vis('power', { elements: [{ label: 'R', R: 1, I: 1, V: 1, P: 1 }, { label: '4R', R: 4, I: 1, V: 4, P: 4 }] }));

  ci(79, "Series and parallel",
    "A battery, ammeter, 20 Ω resistor and 15 Ω resistor are in series; a 30 Ω resistor with a switch is connected across the 15 Ω. When the switch is closed, the voltage across the 15 Ω resistor",
    ["equals the voltage across the 20 Ω", "is twice the voltage across the 30 Ω", "equals the voltage across the 30 Ω", "is half the voltage across the 30 Ω"],
    "C",
    ["Closing the switch puts the 30 Ω in parallel with the 15 Ω.",
     "Components in parallel share the same two end points.",
     "So they have the same voltage."],
    circuit(70, S(R('20 Ω', 20, { I: 2.33, V: 46.7 }), Pl(R('15 Ω', 15, { I: 1.56, V: 23.3 }), R('30 Ω', 30, { I: 0.78, V: 23.3 }))), { ask: 'Example with a 70 V battery' }),
    fig5961);

  ci(80, "Series and parallel",
    "Same 9 V circuit as before: A → 7 Ω → B → 2 Ω → D and A → 4 Ω → C → 5 Ω → D, with D connected through point E back to the battery. What is the current at E?",
    ["2 A", "4 A", "5 A", "7 A"],
    "A",
    ["Each path is 9 Ω, so the pair in parallel is 4.5 Ω.",
     "\\(I = 9/4.5 = 2\\) A.",
     "All of it returns through E (1 A from each path)."],
    vis('junction', { ins: [{ label: 'via B (7 Ω + 2 Ω)', I: 1 }, { label: 'via C (4 Ω + 5 Ω)', I: 1 }], outs: [{ label: 'E', I: 2 }], unknown: 'E' }),
    fig6263);

  ci(81, "Potential in circuits",
    "Same circuit. What is the potential at B relative to D?",
    ["+2 V", "+4 V", "+5 V", "+7 V"],
    "A",
    ["Between B and D is only the 2 Ω resistor, carrying 1 A.",
     "\\(\\Delta V = IR = (1)(2) = 2\\) V.",
     "Current flows from B to D, so B is higher: +2 V."],
    vis6263, fig6263);

  var fig82 = circuit(10, S(R('ammeter'), Pl(R('200 Ω', 200), Cp('600 µF', 600e-6), R('400 Ω', 400))), { ask: 'Ammeter reading at steady state?' });
  ci(82, "RC steady state",
    "A 10 V battery, switch and ideal ammeter feed three parallel branches: a 200 Ω resistor, a 600 µF capacitor, and a 400 Ω resistor. After the current settles, the ammeter reads",
    ["\\(8.1\\times10^{-2}\\) A", "\\(7.5\\times10^{-2}\\) A", "\\(6.9\\times10^{-2}\\) A", "zero"],
    "B",
    ["Once charged, the capacitor branch carries no current: ignore it.",
     "\\(200 \\parallel 400 = 133.3\\) Ω.",
     "\\(I = 10/133.3 = 0.075\\) A \\(= 7.5\\times10^{-2}\\) A."],
    circuit(10, Pl(R('200 Ω', 200, { I: 0.05, V: 10 }), Cp('600 µF', 600e-6, { Q: 6e-3, V: 10 }), R('400 Ω', 400, { I: 0.025, V: 10 }))),
    fig82);

  ci(83, "Kirchhoff's loop rule",
    "A single loop has a 10 V battery and a 6 V battery facing opposite ways, a switch, and resistors of 2 Ω, 4 Ω, 6 Ω and 8 Ω. When the switch closes, the current is",
    ["0.75 A", "0.5 A", "0.3 A", "0.2 A"],
    "D",
    ["Opposing batteries: net emf \\(10 - 6 = 4\\) V.",
     "Series total: \\(2 + 4 + 6 + 8 = 20\\) Ω.",
     "\\(I = 4/20 = 0.2\\) A."],
    vis('loop-potential', { emf: 10, elements: [{ label: '6 V battery (opposing)', dV: -6 }, { label: '2 Ω', dV: -0.4 }, { label: '4 Ω', dV: -0.8 }, { label: '6 Ω', dV: -1.2 }, { label: '8 Ω', dV: -1.6 }], I: 0.2 }));

  var fig84 = circuit(10, S(Pl(R('10 Ω', 10), R('10 Ω', 10)), Pl(R('10 Ω', 10), Cp('10 µF', 10e-6))), { ask: 'Charge on the capacitor when fully charged?' });
  ci(84, "RC steady state",
    "A 10 V battery drives two 10 Ω resistors in parallel, in series with a third 10 Ω resistor. A 10 µF capacitor is connected across that third resistor. Once the capacitor is fully charged, its charge is",
    ["23 µC", "40 µC", "67 µC", "100 µC"],
    "C",
    ["Fully charged, the capacitor carries no current; it just reads the voltage of the resistor it sits across.",
     "The parallel pair is 5 Ω, in series with 10 Ω: the 10 Ω takes \\(\\tfrac{10}{15}(10) \\approx 6.7\\) V.",
     "\\(Q = CV = (10\\,\\mu\\text{F})(6.7\\text{ V}) \\approx 67\\) µC."],
    circuit(10, S(Pl(R('10 Ω', 10, { I: 0.333, V: 3.33 }), R('10 Ω', 10, { I: 0.333, V: 3.33 })), Pl(R('10 Ω', 10, { I: 0.667, V: 6.67 }), Cp('10 µF', 10e-6, { Q: 66.7e-6, V: 6.67 })))),
    fig84);

  ci(85, "Series and parallel",
    "Using four identical resistors \\(R\\), which arrangement has an equivalent resistance of \\(\\tfrac43 R\\)?",
    ["One \\(R\\) in series with three in parallel", "A series pair in parallel with two more single resistors", "Two series pairs in parallel with each other", "One \\(R\\) in series with (one \\(R\\) in parallel with a series pair)"],
    "A",
    ["Three in parallel: \\(R/3\\). Plus one in series: \\(\\tfrac43R\\).",
     "Check the rest: \\(2R \\parallel R \\parallel R = \\tfrac25R\\); \\(2R \\parallel 2R = R\\); \\(R + (R \\parallel 2R) = \\tfrac53R\\).",
     "Only the first gives \\(\\tfrac43R\\)."],
    concept("Four identical resistors", ["R + R/3 = 4R/3 ✓", "2R ∥ R ∥ R = 2R/5", "2R ∥ 2R = R", "R + (R ∥ 2R) = 5R/3"]));

  var fig86 = circuit(9, S(R('4 Ω', 4), Pl(R('3 Ω', 3), S(R('4 Ω', 4), Pl(R('6 Ω', 6), R('3 Ω', 3))))));
  ci(86, "Series and parallel",
    "A 9 V battery drives a 4 Ω resistor in series with a network: a 3 Ω resistor in parallel with a branch made of a 4 Ω resistor followed by a 6 Ω and a 3 Ω in parallel. What total current does the battery supply?",
    ["3.0 A", "2.0 A", "1.5 A", "1.0 A"],
    "C",
    ["Innermost: \\(6 \\parallel 3 = 2\\) Ω; that branch is \\(4 + 2 = 6\\) Ω.",
     "\\(6 \\parallel 3 = 2\\) Ω; plus the series 4 Ω: total 6 Ω.",
     "\\(I = 9/6 = 1.5\\) A."],
    circuit(9, S(R('4 Ω', 4, { I: 1.5, V: 6 }), Pl(R('3 Ω', 3, { I: 1, V: 3 }), S(R('4 Ω', 4, { I: 0.5, V: 2 }), Pl(R('6 Ω', 6, { I: 0.167, V: 1 }), R('3 Ω', 3, { I: 0.333, V: 1 })))))),
    fig86);

  ci(87, "Meters",
    "Which wiring lets you measure \\(R\\) with Ohm's law (ideal voltmeter and ammeter)?",
    ["Voltmeter and ammeter in series with each other, that pair connected across \\(R\\)", "Voltmeter across \\(R\\); ammeter in series with \\(R\\)",
     "Voltmeter and ammeter each connected across \\(R\\)", "Ammeter across \\(R\\); voltmeter in series with \\(R\\)"],
    "B",
    ["A voltmeter measures the difference between two points, so it goes across (in parallel with) \\(R\\).",
     "An ammeter measures the current through something, so it goes in series with \\(R\\).",
     "Then \\(R = V/I\\)."],
    vis('ohm', { V: 6, I: 0.5, R: 12 }));

  ci(88, "Series and parallel",
    "Identical resistors: a battery, ammeter, switch \\(S_1\\) and \\(R_1\\) are in the main line. After \\(R_1\\) there are three parallel paths: switch \\(S_2\\) in series with \\(R_2\\); a bare wire through switch \\(S_3\\); and \\(R_3\\). Closing which switches gives the most power in \\(R_2\\)?",
    ["\\(S_1\\) only", "\\(S_2\\) only", "\\(S_1\\) and \\(S_2\\) only", "\\(S_1\\) and \\(S_3\\) only"],
    "C",
    ["\\(S_1\\) must be closed for any current at all, and \\(S_2\\) must be closed for current to reach \\(R_2\\).",
     "\\(S_3\\) must stay open: closing it would short out \\(R_2\\) (and \\(R_3\\)).",
     "So \\(S_1\\) and \\(S_2\\)."],
    concept("Switch logic", ["S1: main line, needed for any current", "S2: connects R2", "S3: a bare wire that shorts R2 and R3"]));

  ci(89, "Series and parallel",
    "Same circuit (main line: \\(S_1\\), \\(R_1\\); then parallel paths \\(S_2\\)+\\(R_2\\), \\(S_3\\) bare wire, \\(R_3\\)). Closing which switches gives the largest ammeter reading?",
    ["\\(S_1\\) only", "\\(S_2\\) only", "\\(S_1\\) and \\(S_2\\)", "\\(S_1\\) and \\(S_3\\)"],
    "D",
    ["Largest current needs the smallest total resistance.",
     "Closing \\(S_3\\) shorts the parallel section to zero resistance.",
     "With \\(S_1\\) and \\(S_3\\) closed only \\(R_1\\) remains: the minimum possible."],
    concept("Smallest R_eq", ["S1 + S3: only R1 left", "Max current"]));

  ci(90, "Series and parallel",
    "Same circuit. Closing which switches gives the largest voltage across \\(R_3\\)?",
    ["\\(S_1\\) only", "\\(S_2\\) only", "\\(S_1\\) and \\(S_2\\) only", "\\(S_1\\) and \\(S_3\\) only"],
    "A",
    ["\\(S_1\\) is required for any current.",
     "Closing \\(S_2\\) adds \\(R_2\\) in parallel, lowering the parallel voltage; closing \\(S_3\\) shorts \\(R_3\\) to zero.",
     "With only \\(S_1\\) closed, \\(R_3\\) is in series with \\(R_1\\) and gets half the battery voltage, the most possible."],
    concept("Biggest V across R3", ["S2 closed: R2 ∥ R3 lowers it", "S3 closed: shorts R3", "S1 only: V = ε/2"]));

  return { problems: problems };
})();
