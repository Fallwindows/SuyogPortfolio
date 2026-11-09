// Problem bank core for Computer Science Review. Same interface the duel engine expects from
// PRProblems (generate, check), plus register() for the unit banks (problems-u1.js, problems-u2.js).
//
// A generator:
//   { id: 'u2-if-trace', unit: 2, topic: 'Tracing if statements', lesson: 'cs2-if',
//     concepts: ['if-braces', 'sequential-ifs'],           // every concept this generator can test
//     make(rng, opts) -> problem }                          // opts: { target: conceptId, hard: bool } from learn mode
// A problem (what make returns):
//   type: 'mc' | 'text' | 'numeric'
//   prompt: HTML (use CSKit.code(src) for code)
//   mc: choices (HTML strings), correct (index)   · text: answer (string), accept?: [other strings]
//   numeric: answer (number), units?, tolerance?
//   steps: [HTML strings] worked solution, last one the result in <b>
//   explainHTML?: HTML shown above the steps (e.g. a trace table or CSKit.code with highlighted lines)
//   concepts: [ids] tested by the whole problem (from CS_CONCEPTS)
//   parts: [ { q, type, answer | choices+correct, concept, why } ] — the same problem broken into
//          2–5 smaller questions (each one concept). Solo learn mode asks these and grades each part.
//   misconceptions?: for mc, [conceptId or null per choice]: picking that wrong choice means that concept slipped
// Answers should come from JavaLite.run/result so they are always what Java really does.
window.PRProblems = (function () {
  'use strict';
  const gens = [];

  function register(g) {
    if (!g || !g.id || !g.make || !PR.UNITS[g.unit]) throw new Error('bad generator ' + (g && g.id));
    if (gens.some((x) => x.id === g.id)) throw new Error('duplicate generator ' + g.id);
    gens.push(g);
  }

  // ---------- shared helpers for the banks ----------
  const esc = (s) => PR.esc(s);
  const code = (src, o) => CSKit.code(src, o);
  const c = (s) => `<code>${esc(s)}</code>`;
  // Run Java and get what it prints, or "Compile error" / "<Name>" for errors.
  function run(src, opts) { return JavaLite.result(src, opts); }
  // Build a 4-option multiple choice: correct + first 3 distinct distractors, shuffled.
  // wrongs may be strings or { text, concept } (concept = the misconception that wrong answer reveals).
  function mc(rng, correct, wrongs) {
    const seen = new Set([correct]);
    const w = [];
    for (const x of wrongs) {
      const t = typeof x === 'string' ? x : x.text;
      if (w.length >= 3) break;
      if (!seen.has(t)) { seen.add(t); w.push({ text: t, concept: typeof x === 'string' ? null : x.concept || null }); }
    }
    const opts = [{ text: correct, concept: null }].concat(w);
    const order = rng.shuffle(opts.map((_, i) => i));
    return { choices: order.map((i) => opts[i].text), correct: order.indexOf(0), misconceptions: order.map((i) => opts[i].concept) };
  }
  // Show program output as a choice/answer string: newlines become " / " so it fits on one line.
  const oneLine = (s) => String(s).replace(/\n+$/, '').replace(/\n/g, ' / ');

  // ---------- generate (identical scheduling to Physics: shuffled bag, no immediate repeats) ----------
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
  function finish(g, p, id) {
    return Object.assign({ id, unit: g.unit, topic: g.topic, lesson: g.lesson, concepts: g.concepts.slice(0, 3), steps: [] }, p);
  }
  function generate(seed, count, units) {
    const s = seedNum(seed);
    const us = Array.isArray(units) && units.length ? units.map(Number) : Object.keys(PR.UNITS).map(Number);
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
      out.push(finish(g, g.make(PR.rng(mix(s, i)), {}), `${g.id}-${seed}-${i}`));
    }
    return out;
  }
  // One problem from a specific generator (learn mode).
  function makeOne(g, seed, opts) { return finish(g, g.make(PR.rng(seedNum(seed)), opts || {}), `${g.id}-${seed}`); }

  // ---------- checking ----------
  function parseNum(resp) {
    if (resp === null || resp === undefined) return null;
    let s = String(resp).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/,/g, '');
    if (!s) return null;
    const m = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:[eE]([+-]?\d+))?$/);
    if (!m) return null;
    const v = Number(m[1]) * (m[2] !== undefined ? Math.pow(10, Number(m[2])) : 1);
    return isFinite(v) ? v : null;
  }
  // Text answers: whitespace (including line breaks and " / ") collapses, so "4 / 3 / 2" and
  // "4 3 2" both match output 4\n3\n2. Error words ("compile error", "ArithmeticException") ignore case.
  const normText = (s) => String(s).replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const errorish = (s) => /^(compile error|infinite loop|[a-z]*exception|[a-z]*error)$/i.test(normText(s).replace(/^.* then /, ''));
  function textMatch(resp, ans) {
    const a = normText(ans), r = normText(resp);
    if (r === a) return true;
    if (errorish(ans) && r.toLowerCase() === a.toLowerCase()) return true;
    // "Exception" alone: accept the bare class name without "java.lang."
    return r.toLowerCase().replace(/^java\.lang\./, '') === a.toLowerCase();
  }
  function check(problem, response) {
    if (!problem) return false;
    if (problem.type === 'mc') return response !== '' && response !== null && Number(response) === problem.correct;
    if (problem.type === 'text') return [problem.answer].concat(problem.accept || []).some((a) => textMatch(response, a));
    const x = parseNum(response);
    if (x === null) return false;
    const a = Number(problem.answer);
    if (a === 0) return Math.abs(x) <= (problem.absTol || 1e-9);
    const tol = problem.tolerance != null ? problem.tolerance : 0.001;
    return Math.abs(x - a) <= tol * Math.abs(a);
  }

  const helpers = { esc, code, c, run, mc, oneLine };
  return { generators: gens, register, generate, makeOne, check, parseNum, textMatch, helpers };
})();
