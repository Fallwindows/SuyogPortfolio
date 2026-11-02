// Maps a visual key to the lesson id that teaches it, so the duel can link
// "Review the lesson" after a round.
window.PR_LESSON_FOR_KEY = {
  // Unit 1 · Electrostatics
  charging: 'u1-charging',
  coulomb: 'u1-coulomb',
  superposition: 'u1-superposition',
  'point-field': 'u1-field',
  'field-map': 'u1-field-lines',
  'uniform-field': 'u1-uniform-field',
  'pe-pair': 'u1-potential-energy',
  potential: 'u1-potential',
  'work-dv': 'u1-potential-difference',
  capacitor: 'u1-capacitors',
  concept: 'u1-conductors-eq',
  // Unit 2 · Circuits
  ohm: 'u2-ohm',
  resistivity: 'u2-resistance',
  power: 'u2-power',
  circuit: 'u2-combination',
  junction: 'u2-junction',
  'loop-potential': 'u2-loop-rule',
  rc: 'u2-rc',
};

// Finer-grained matches by problem topic or generator, checked before the key map.
window.PR_LESSON_FOR_TOPIC = [
  [/bulb|bright/i, 'u2-brightness'],
  [/meter/i, 'u2-meters'],
  [/internal|terminal/i, 'u2-internal-resistance'],
  [/junction/i, 'u2-junction'],
  [/loop rule/i, 'u2-loop-rule'],
  [/two loops|kirchhoff's rules/i, 'u2-multiloop'],
  [/capacitor (network|combination)/i, 'u2-capacitor-combos'],
  [/\bRC\b|[Cc]apacitors in (DC )?circuits/, 'u2-rc'],
  [/potential in circuits/i, 'u2-potential-points'],
  [/^current$/i, 'u2-current'],
  [/series|parallel|reduction/i, 'u2-combination'],
  [/polarization|induction|electroscope|friction|charge sharing|charging/i, 'u1-charging'],
  [/conductor|sphere|shielding/i, 'u1-conductors-eq'],
  [/quantiz|charge interactions/i, 'u1-charge'],
  [/potential energy/i, 'u1-potential-energy'],
  [/^electric force|forces in fields/i, 'u1-coulomb'],
  [/ranking electric potential|^electric potential/i, 'u1-potential'],
  [/superposition/i, 'u1-superposition'],
  [/field lines|field direction|field zero/i, 'u1-field-lines'],
  [/equipotential/i, 'u1-equipotentials'],
  [/dielectric/i, 'u1-capacitors'],
  [/energy in fields/i, 'u1-potential-energy'],
];
