// AP CSA Unit 1 problem bank (Using Objects and Methods). Registers generators with PRProblems
// (see problems-core.js). Every Java answer comes from running the code in JavaLite.
// Each generator is a set of variants; a variant has the concept(s) it traps on, so solo learn
// mode can aim at one concept (opts.target) or ask for the nastier variants (opts.hard).
(function () {
  'use strict';
  const { esc, code, mc, oneLine } = PRProblems.helpers;
  const J = window.JavaLite;
  const HINT = 'Type exactly what it prints; separate lines with " / ". Type Compile error if it does not compile, or the exception name if it crashes.';
  const uniq = (a) => [...new Set(a.filter(Boolean))];

  // ---------- running Java ----------
  // text: what a student writes as the result (output, "Compile error", or the exception name)
  function R(src, opts) {
    const r = J.run(src, opts || {});
    const out = oneLine(r.output);
    let text;
    if (r.error && r.error.kind === 'compile') text = 'Compile error';
    else if (r.error && r.error.name === 'InfiniteLoop') text = 'Infinite loop';
    else if (r.error) text = (out ? out + ' then ' : '') + r.error.name;
    else text = out;
    return { text, out, err: r.error, r };
  }
  // Print one expression after running src: the value Java has at that point.
  const val = (src, expr, opts) => R(`${src}\nSystem.out.print(${expr});`, opts).text;

  // ---------- parts (the breakdown learn mode grades one by one) ----------
  const PT = (q, answer, concept, why, accept) => Object.assign({ q, type: 'text', answer: String(answer), concept, why }, accept ? { accept } : {});
  const PN = (q, answer, concept, why) => ({ q, type: 'numeric', answer: Number(answer), concept, why });
  function PM(rng, q, correct, wrongs, concept, why) {
    const m = mc(rng, correct, wrongs);
    return { q, type: 'mc', choices: m.choices, correct: m.correct, concept, why };
  }
  const PYN = (q, yes, concept, why) => ({ q, type: 'mc', choices: ['Yes', 'No'], correct: yes ? 0 : 1, concept, why });

  // choice formatting: program output in code style, error words plain
  const ERRWORD = /^(Compile error|Infinite loop|Nothing.*|[A-Za-z]*Exception.*)$/;
  const ch = (t) => (ERRWORD.test(t) ? esc(t) : `<code>${esc(t)}</code>`);
  const chw = (ws) => ws.map((w) => (typeof w === 'string' ? ch(w) : { text: ch(w.text), concept: w.concept }));

  // ---------- problem builders ----------
  // "What does this print?" with the real output as the answer.
  function textQ(intro, src, steps, parts, o) {
    o = o || {};
    const res = R(src, o.run);
    return {
      type: 'text', prompt: `${intro || 'What does this code print?'}${code(src)}${o.after || ''}`, answer: res.text,
      hint: o.hint || HINT, placeholder: 'Output', steps: typeof steps === 'function' ? steps(res) : steps,
      parts: typeof parts === 'function' ? parts(res) : parts, explainHTML: o.explain,
    };
  }
  // Multiple choice on what the code does; wrong options are the results of specific mistakes.
  function outcomeQ(rng, intro, src, wrongs, steps, parts, o) {
    o = o || {};
    const res = R(src, o.run);
    const m = mc(rng, ch(res.text), chw(wrongs));
    return {
      type: 'mc', prompt: `${intro || 'What is the result of running this code?'}${code(src)}`,
      choices: m.choices, correct: m.correct, misconceptions: m.misconceptions,
      steps: typeof steps === 'function' ? steps(res) : steps, parts: typeof parts === 'function' ? parts(res) : parts, res,
    };
  }
  // Plain multiple choice (concept questions). wrongs: [{ text, concept }]
  function choiceQ(rng, prompt, correct, wrongs, steps, parts) {
    const m = mc(rng, correct, wrongs);
    return { type: 'mc', prompt, choices: m.choices, correct: m.correct, misconceptions: m.misconceptions, steps, parts };
  }

  // ---------- generator wrapper ----------
  function gen(id, topic, lesson, variants) {
    const cs = (v) => [].concat(v.c);
    PRProblems.register({
      id, unit: 1, topic, lesson, concepts: uniq(variants.flatMap(cs)),
      make(rng, opts) {
        opts = opts || {};
        let pool = variants;
        if (opts.target) { const t = pool.filter((v) => cs(v).includes(opts.target)); if (t.length) pool = t; }
        if (opts.hard) { const h = pool.filter((v) => v.hard); if (h.length) pool = h; }
        const v = rng.pick(pool);
        const p = v.f(rng);
        delete p.res;
        p.concepts = uniq(cs(v).concat((p.parts || []).map((x) => x.concept))).slice(0, 6);
        return p;
      },
    });
  }

  const PHRASES = ['I am Iron Man!', 'Mississippi River', 'The Legend of Zelda', 'John Cena', 'Batman Begins', 'Hermione Granger', 'Princess Leia', 'Memecraft'];
  const NAMES = ['Pikachu', 'Squirtle', 'Charmander', 'Bulbasaur', 'Eevee', 'Jigglypuff'];
  const q = (s) => JSON.stringify(s); // Java string literal for simple text

  // =====================================================================
  // 1.1 Compile, runtime, logic errors
  // =====================================================================
  const KIND = { compile: 'Compile error', runtime: 'Runtime error', logic: 'Logic error (runs, but the answer is wrong)', none: 'No error' };
  function classify(rng, intro, src, kind, why, concept) {
    const tag = {
      compile: { runtime: 'compile-vs-run', logic: 'logic-error', none: 'compile-error' },
      runtime: { compile: 'compiler-no-values', logic: 'logic-error', none: 'runtime-error' },
      logic: { compile: 'compile-error', runtime: 'runtime-error', none: 'logic-error' },
    }[kind];
    const wrongs = Object.keys(tag).map((k) => ({ text: KIND[k], concept: tag[k] }));
    const m = mc(rng, KIND[kind], wrongs);
    const compiles = kind !== 'compile';
    const parts = [PYN('Does this code compile?', compiles, compiles ? 'compiler-no-values' : 'compile-error',
      compiles ? 'Every line has legal types, so the compiler accepts it. It never looks at the actual values.' : why)];
    if (compiles) parts.push(PYN('Does the program crash while it runs?', kind === 'runtime', 'runtime-error', kind === 'runtime' ? why : 'Nothing illegal happens at run time.'));
    else parts.push(PYN('Does any line of the program run?', false, 'compile-vs-run', 'With a compile error, run time is never reached, so nothing runs.'));
    if (kind === 'logic') parts.push(PYN('Does it give the answer the programmer intended?', false, 'logic-error', why));
    return {
      type: 'mc', prompt: `${intro}${code(src)}What kind of problem does it have?`, choices: m.choices, correct: m.correct, misconceptions: m.misconceptions,
      steps: [
        'First ask: do all the types work? If not, it is a compile error and nothing runs.',
        'If it compiles, ask: does anything crash while running (int ÷ 0, bad index, null)? That is a runtime error.',
        'If it runs to the end but gives the wrong answer, it is a logic error.',
        `<b>${esc(KIND[kind])}</b>: ${why}`,
      ], parts,
    };
  }
  gen('u1-error-kind', 'Compile, runtime, or logic error', 'cs1-compile', [
    { c: ['compile-error'], f(rng) {
      const s = rng.pick([
        ['int x = 8 / "John Cena";\nSystem.out.println(x);', 'Division only compiles between numbers, and "John Cena" is a String.'],
        ['int a = "Batman";\nSystem.out.println(a);', 'A String cannot be stored in an int variable.'],
        ['double d = 4.5;\nint n = d;\nSystem.out.println(n);', 'A double cannot go into an int without a cast (possible lossy conversion).'],
        ['String s = "hi";\nint k = s * 2;\nSystem.out.println(k);', 'Multiplication only compiles between numbers.'],
      ]);
      return classify(rng, 'Consider this code:', s[0], 'compile', s[1]);
    } },
    { c: ['runtime-error', 'compiler-no-values'], f(rng) {
      const n = rng.int(3, 40);
      const s = rng.pick([
        [`int a = ${n};\nint b = 0;\nSystem.out.println(a / b);`, 'int ÷ 0 throws an ArithmeticException while running. The compiler only saw int / int, which is legal.'],
        [`String s = "Batman";\nSystem.out.println(s.substring(${rng.int(7, 9)}));`, 'The index is past the length of the String, so substring throws an exception at run time.'],
        ['String s = null;\nSystem.out.println(s.length());', 'Calling a method on null throws a NullPointerException at run time.'],
      ]);
      return classify(rng, 'Consider this code:', s[0], 'runtime', s[1]);
    } },
    { c: ['logic-error'], f(rng) {
      const a = rng.int(60, 99), b = rng.int(60, 99), c = rng.int(60, 99);
      const s = rng.pick([
        [`// intended: the average of three test scores\nint a = ${a}, b = ${b}, c = ${c};\ndouble avg = a + b + c / 3.0;\nSystem.out.println(avg);`, 'Only c is divided by 3, because / happens before +. It needs (a + b + c) / 3.0.'],
        ['// intended: a solution of 2x² + 5x − 3 = 0\ndouble a = 2, b = 5, c = -3;\ndouble x = (-b + Math.sqrt(b*b - 4*a*c)) / 2*a;\nSystem.out.println(x);', '/ 2*a divides by 2 and then multiplies by a; the denominator needs parentheses: (2*a).'],
      ]);
      return classify(rng, 'The comment says what the programmer intended.', s[0], 'logic', s[1]);
    } },
    { c: ['statements-before-crash'], f(rng) {
      const n = rng.int(2, 50), w1 = rng.pick(['Hello', 'Start', 'Ready']), w2 = rng.pick(['World', 'Done', 'Bye']);
      const src = `System.out.println("${w1}");\nint x = ${n};\nSystem.out.println(x / 0);\nSystem.out.println("${w2}");`;
      const correct = `${w1} is printed, then an ArithmeticException stops the program`;
      return choiceQ(rng, `What happens when this runs?${code(src)}`, esc(correct), [
        { text: esc(`Nothing is printed: the ArithmeticException happens first`), concept: 'statements-before-crash' },
        { text: esc(`${w1} / ${w2} is printed (dividing by 0 is skipped)`), concept: 'int-div-zero' },
        { text: esc('Compile error: the compiler sees the division by zero'), concept: 'compiler-no-values' },
      ], ['The code compiles: x / 0 is int / int, which is a legal type combination.', `Line 1 runs and prints ${esc(w1)}.`, 'Line 3 divides an int by the int 0, so an ArithmeticException stops the program; line 4 never runs.', `<b>${esc(correct)}</b>`],
      [PYN('Does it compile?', true, 'compiler-no-values', 'The compiler checks types, not values, and int / int is legal.'),
        PN('How many lines are printed before the crash?', 1, 'statements-before-crash', 'Lines before the runtime error run normally.'),
        PYN(`Is "${w2}" printed?`, false, 'runtime-error', 'After a runtime error the program stops.')]);
    } },
    { c: ['compile-vs-run'], hard: true, f(rng) {
      const w1 = rng.pick(['Hello', 'Start', 'Ready']), w2 = rng.pick(['World', 'Done', 'Bye']);
      const src = `System.out.println("${w1}");\nSystem.out.println("${w2}");\nint x = "${rng.pick(['oops', 'ten', 'five'])}";\nSystem.out.println(x);`;
      return choiceQ(rng, `What happens when this is compiled and run?${code(src)}`, esc('Nothing is printed: there is a compile error'), [
        { text: esc(`${w1} / ${w2}, then an error`), concept: 'compile-vs-run' },
        { text: esc(`${w1} / ${w2}`), concept: 'compile-error' },
        { text: esc(`${w1}, then an error`), concept: 'compile-vs-run' },
      ], ['The whole program is compiled before anything runs.', 'Line 3 puts a String into an int: a compile error.', 'Because compilation fails, run time is never reached, so even lines 1 and 2 never run.', '<b>Nothing is printed: compile error.</b>'],
      [PYN('Does line 3 compile?', false, 'compile-error', 'A String cannot be assigned to an int.'),
        PN('How many lines get printed?', 0, 'compile-vs-run', 'A compile error anywhere means no line runs at all.')]);
    } },
  ]);

  // =====================================================================
  // 1.1 Algorithms
  // =====================================================================
  gen('u1-algorithms', 'Designing algorithms', 'cs1-algorithms', [
    { c: ['check-order-algo'], f(rng) {
      const r = rng.pick([5, 6, 7]), cc = rng.pick([6, 7, 8]);
      return choiceQ(rng, `A connect-four game on a ${r}-row by ${cc}-column board has just placed a piece. In which order should the program check what happens next?`,
        'Check for a win first, then check whether the board is full', [
          { text: 'Check whether the board is full first, then check for a win', concept: 'check-order-algo' },
          { text: 'Only check whether the board is full', concept: 'algorithm-steps' },
          { text: 'Check for a win only after every turn of the computer player', concept: 'algorithm-steps' },
        ], ['A move can fill the board AND make four in a row.', 'If the full-board check comes first, that winning move would be called a draw.', '<b>Check for a win, then for a full board.</b>'],
        [PN(`How many moves fill a ${r} × ${cc} board?`, r * cc, 'algorithm-steps', `Rows × columns = ${r * cc}.`),
          PM(rng, 'Why must the win check come first?', 'The last move can both fill the board and win', [
            { text: 'Checking for a win is faster', concept: 'check-order-algo' }, { text: 'The board can never be full', concept: 'check-order-algo' }, { text: 'It does not matter', concept: 'check-order-algo' }], 'check-order-algo', 'Otherwise a winning last move is misread as a draw.')]);
    } },
    { c: ['precondition-algo'], f(rng) {
      const bad = rng.pick(['an angle of 120 degrees', 'an angle of −30 degrees', 'an initial speed of −5 m/s', 'an initial height of −10 meters']);
      return choiceQ(rng, 'A method returns how far a projectile travels. Its preconditions: initial speed > 0, initial height ≥ 0, angle between 0 and 90 degrees inclusive. Which input is the method NOT guaranteed to handle correctly?',
        esc(bad.charAt(0).toUpperCase() + bad.slice(1)), [
          { text: 'An angle of 45 degrees', concept: 'precondition-algo' }, { text: 'An initial height of 0 meters', concept: 'precondition-algo' },
          { text: 'An angle of 90 degrees', concept: 'precondition-algo' }, { text: 'An initial speed of 12 m/s', concept: 'precondition-algo' },
        ], ['Preconditions describe the inputs the method promises to handle.', 'Inputs on the boundary (height 0, angle 90) are allowed because of "≥" and "inclusive".', `<b>${esc(bad)}</b> breaks a precondition, so the result may be wrong.`],
        [PM(rng, 'What does a precondition promise?', 'Correct results only when the precondition is true', [
          { text: 'The method checks the inputs and fixes bad ones', concept: 'precondition-algo' }, { text: 'Bad inputs cause a compile error', concept: 'compile-error' },
          { text: 'The method works for every possible input', concept: 'precondition-algo' }], 'precondition-algo', 'The method is only designed for inputs that meet its preconditions.'),
        PYN('Is an angle of exactly 90 degrees allowed?', true, 'precondition-algo', '"Between 0 and 90 inclusive" includes 90.')]);
    } },
    { c: ['algorithm-steps'], f(rng) {
      const k = rng.int(0, 6);
      const methods = 'public static int getMoveValue(int count){\n  if(count == 0)\n    return 25;\n  if(count == 1)\n    return 10;\n  return count;\n}\npublic static boolean extraTurn(int count){\n  return count == 0 || count == 1 || count == 6;\n}\n';
      const moves = Number(val(methods, `getMoveValue(${k})`)), extra = val(methods, `extraTurn(${k})`) === 'true';
      const opt = (m, e) => `${m} spaces, ${e ? 'with' : 'no'} extra turn`;
      return choiceQ(rng, `In Pachisi, 6 cowrie shells are thrown. 0 up → move 25, 1 up → move 10, otherwise move the number that landed up. 0, 1 or 6 up → an extra turn.${code(methods)}After a throw, <b>${k}</b> shells landed up. What happens?`,
        esc(opt(moves, extra)), [
          { text: esc(opt(k, extra)), concept: 'exceptions-first' }, { text: esc(opt(moves, !extra)), concept: 'algorithm-steps' },
          { text: esc(opt(k === 0 ? 10 : k === 1 ? 25 : k + 1, extra)), concept: 'algorithm-steps' }, { text: esc(opt(25, !extra)), concept: 'algorithm-steps' },
        ].filter((w) => w.concept !== 'exceptions-first').concat([{ text: esc(opt(k, !extra)), concept: 'algorithm-steps' }]),
        ['Step 1: throw 6 shells and count how many land up (Math.random() < p, six times).', `Step 2: getMoveValue(${k}) returns ${moves}.`, `Step 3: extraTurn(${k}) returns ${extra}.`, `<b>${esc(opt(moves, extra))}</b>`],
        [PN(`What does getMoveValue(${k}) return?`, moves, 'algorithm-steps', 'Check the special cases 0 and 1 first; otherwise return the count.'),
          PYN(`Does extraTurn(${k}) return true?`, extra, 'algorithm-steps', 'Only 0, 1 or 6 shells up give an extra turn.'),
          PM(rng, 'Which step of the algorithm must happen first?', 'Throw the shells and count how many land up', [
            { text: 'Decide whether there is an extra turn', concept: 'algorithm-steps' }, { text: 'Move the piece', concept: 'algorithm-steps' }, { text: 'Return 25', concept: 'algorithm-steps' }], 'algorithm-steps', 'Both later steps use the count.')]);
    } },
  ]);

  // =====================================================================
  // 1.2 Binary, bytes, int range
  // =====================================================================
  const bits8 = (v) => v.toString(2).padStart(8, '0');
  const spaced = (b) => b.slice(0, 4) + ' ' + b.slice(4);
  const HEX = '0123456789ABCDEF';
  gen('u1-binary', 'Binary, bytes, and int range', 'cs1-binary', [
    { c: ['binary-place'], f(rng) {
      const v = rng.int(1, 255), b = bits8(v);
      const parts = [];
      b.split('').forEach((d, i) => { if (d === '1') parts.push(128 >> i); });
      return { type: 'numeric', prompt: `What is the unsigned byte <code>${spaced(b)}</code> in base 10?`, answer: v,
        steps: ['Unsigned byte place values: 128 64 32 16 8 4 2 1.', `The 1 bits are worth ${parts.join(' + ')}.`, `<b>${v}</b>`],
        parts: [PN('What is the place value of the leftmost digit of an unsigned byte?', 128, 'binary-place', 'The digits are worth 128, 64, 32, 16, 8, 4, 2, 1.'),
          PN(`What is ${spaced(b)} in base 10?`, v, 'binary-place', `Add the place values of the 1 bits: ${parts.join(' + ')}.`)] };
    } },
    { c: ['signed-byte'], hard: true, f(rng) {
      const v = rng.int(128, 255), b = bits8(v);
      return { type: 'numeric', prompt: `What is the <b>signed</b> byte <code>${spaced(b)}</code> in base 10?`, answer: v - 256,
        steps: ['In a signed byte the leftmost bit is worth −128 instead of 128.', `The other 7 bits add up to ${v - 128}.`, `−128 + ${v - 128} = <b>${v - 256}</b>`],
        parts: [PN('In a signed byte, what is the leftmost bit worth?', -128, 'signed-byte', 'Signed bytes make the top digit −128, giving the range −128 to 127.'),
          PN('What do the other 7 bits add up to?', v - 128, 'binary-place', 'Use place values 64, 32, 16, 8, 4, 2, 1.'),
          PN('So what is the signed value?', v - 256, 'signed-byte', `−128 + ${v - 128}.`)] };
    } },
    { c: ['hex'], f(rng) {
      const v = rng.int(16, 255), b = bits8(v), hi = v >> 4, lo = v & 15, hx = HEX[hi] + HEX[lo];
      return choiceQ(rng, `What is the byte <code>${spaced(b)}</code> in hexadecimal?`, `<code>${hx}</code>`, [
        { text: `<code>${HEX[lo] + HEX[hi]}</code>`, concept: 'hex' }, { text: `<code>${v}</code>`, concept: 'hex' },
        { text: `<code>${String(hi) + String(lo)}</code>`, concept: 'hex' }, { text: `<code>${HEX[(hi + 1) % 16] + HEX[lo]}</code>`, concept: 'binary-place' },
        { text: `<code>${HEX[hi] + HEX[(lo + 1) % 16]}</code>`, concept: 'binary-place' },
      ], ['Each group of 4 binary digits is one hex digit.', `${b.slice(0, 4)} = ${hi} = ${HEX[hi]}, ${b.slice(4)} = ${lo} = ${HEX[lo]}.`, `<b>${hx}</b>`],
      [PT(`What hex digit is ${b.slice(0, 4)}?`, HEX[hi], 'hex', `8·${b[0]} + 4·${b[1]} + 2·${b[2]} + 1·${b[3]} = ${hi}, and ${hi} is ${HEX[hi]} in hex.`, [HEX[hi].toLowerCase()]),
        PT(`What hex digit is ${b.slice(4)}?`, HEX[lo], 'hex', `That is ${lo}, written ${HEX[lo]} in hex (A = 10 … F = 15).`, [HEX[lo].toLowerCase()])]);
    } },
    { c: ['bits-bytes'], f(rng) {
      const n = rng.int(3, 12);
      return { type: 'numeric', prompt: `How many different values can be stored in ${n} bits?`, answer: Math.pow(2, n),
        steps: ['Each bit has 2 possible values (0 or 1).', `${n} bits give 2 × 2 × … (${n} times) = 2^${n}.`, `<b>${Math.pow(2, n)}</b>`],
        parts: [PN('How many bits are in a byte?', 8, 'bits-bytes', 'A byte is 8 bits.'), PN('How many values can one byte hold?', 256, 'bits-bytes', '2^8 = 256.'),
          PN(`How many values can ${n} bits hold?`, Math.pow(2, n), 'bits-bytes', `2^${n}.`)] };
    } },
    { c: ['int-overflow', 'int-range'], hard: true, f(rng) {
      const k = rng.int(1, 9), m = k + rng.int(1, 9);
      const src = `int x = Integer.MAX_VALUE - ${k};\nx = x + ${m};\nSystem.out.print(x);`;
      return textQ('What does this code print?', src, (r) => [`Integer.MAX_VALUE is 2147483647, so x starts at ${2147483647 - k}.`, `Adding ${m} goes ${m - k} past the maximum.`, 'An int that passes Integer.MAX_VALUE wraps around to Integer.MIN_VALUE (−2147483648) and keeps counting. There is no error.', `<b>${r.text}</b>`],
        (r) => [PN('What is Integer.MAX_VALUE?', 2147483647, 'int-range', 'An int is 32 bits: the largest value is 2^31 − 1 = 2147483647.'),
          PYN('Does Java throw an error when an int goes past its maximum?', false, 'int-overflow', 'It silently wraps around to the most negative int.'),
          PT('What is printed?', r.text, 'int-overflow', 'MAX_VALUE + 1 is MIN_VALUE, then it counts up from there.')]);
    } },
    { c: ['int-range'], f(rng) {
      return choiceQ(rng, 'Which of these values can an <code>int</code> NOT hold?', '<code>2147483648</code>', [
        { text: '<code>-2147483648</code>', concept: 'int-range' }, { text: '<code>2147483647</code>', concept: 'int-range' }, { text: '<code>-1</code>', concept: 'int-range' }],
      ['An int is 32 bits, with range −2^31 to 2^31 − 1.', 'That is −2147483648 to 2147483647.', '<b>2147483648</b> is one too big.'],
      [PN('What is the largest int?', 2147483647, 'int-range', '2^31 − 1.'), PN('What is the smallest int?', -2147483648, 'int-range', '−2^31.')]);
    } },
    { c: ['double-size'], f(rng) {
      return choiceQ(rng, 'How many bytes of memory does a <code>double</code> use?', '8', [
        { text: '4', concept: 'double-size' }, { text: '2', concept: 'double-size' }, { text: '16', concept: 'double-size' }],
      ['An int uses 4 bytes (32 bits).', 'A double is called "double" because it uses twice as much: 8 bytes (64 bits).', '<b>8 bytes</b>'],
      [PN('How many bytes is an int?', 4, 'int-range', 'An int is 32 bits = 4 bytes.'), PN('How many bits is a double?', 64, 'double-size', '8 bytes × 8 bits.'),
        PYN('Can a double hold a value as large as 10^300?', true, 'double-size', 'Doubles go up to about 1.79 × 10^308.')]);
    } },
  ]);

  // =====================================================================
  // 1.2 Variables
  // =====================================================================
  gen('u1-variables', 'Declaring and initializing variables', 'cs1-variables', [
    { c: ['undeclared'], f(rng) {
      const n = rng.int(2, 30);
      const src = `a = ${n};\nint b = a + 1;\nSystem.out.print(b);`;
      return outcomeQ(rng, null, src, [{ text: String(n + 1), concept: 'undeclared' }, { text: String(n), concept: 'undeclared' }, { text: '1', concept: 'declare-init' }],
        ['A variable must be declared (given a type) the first time it is used.', 'Line 1 uses a without ever declaring it.', '<b>Compile error</b>: cannot find symbol a.'],
        [PYN('Is a declared before line 1 uses it?', false, 'undeclared', 'There is no int a; anywhere before it is used.'), PYN('Does the code compile?', false, 'compile-error', 'cannot find symbol: variable a.')]);
    } },
    { c: ['redeclare'], f(rng) {
      const n = rng.int(2, 30), m = n + rng.int(1, 9);
      const src = `int a = ${n};\nint a = ${m};\nSystem.out.print(a);`;
      return outcomeQ(rng, null, src, [{ text: String(m), concept: 'redeclare' }, { text: String(n), concept: 'redeclare' }, { text: `${n}${m}`, concept: 'declare-init' }],
        ['int a = … declares a new variable called a.', 'Line 2 tries to declare a a second time in the same method.', '<b>Compile error</b>: variable a is already defined.'],
        [PYN('Is line 2 a new declaration?', true, 'redeclare', 'It starts with a type (int), so it declares a again.'), PT('What happens?', 'Compile error', 'redeclare', 'A variable can only be declared once in a method. Line 2 should be a = …;')]);
    } },
    { c: ['type-mismatch'], f(rng) {
      const s = rng.pick([
        ['boolean b = 1;\nSystem.out.print(b);', ['1', 'true', 'false'], 'int cannot be converted to boolean'],
        ['int a = true;\nSystem.out.print(a);', ['true', '1', '0'], 'boolean cannot be converted to int'],
        ['int a = "Batman";\nSystem.out.print(a);', ['Batman', '0', '"Batman"'], 'String cannot be converted to int'],
      ]);
      return outcomeQ(rng, null, s[0], s[1].map((t) => ({ text: t, concept: 'type-mismatch' })),
        ['A variable can only hold values of its declared type.', `Here: ${s[2]}.`, '<b>Compile error</b> (incompatible types).'],
        [PYN('Does the value match the declared type?', false, 'type-mismatch', `${s[2]}.`), PT('What happens?', 'Compile error', 'type-mismatch', 'Mismatched types are caught by the compiler.')]);
    } },
    { c: ['final'], hard: true, f(rng) {
      const v = rng.pick(['3.14159', '9.8', '2.5']), w = rng.pick(['2.71828', '1.5', '6.0']);
      if (rng() < 0.6) {
        const src = `final double C = ${v};\nC = ${w};\nSystem.out.print(C);`;
        return outcomeQ(rng, null, src, [{ text: w, concept: 'final' }, { text: v, concept: 'final' }, { text: '0.0', concept: 'declare-init' }],
          ['final means the value cannot change after initialization.', 'Line 2 tries to assign C a new value.', '<b>Compile error</b>: cannot assign a value to final variable C.'],
          [PYN('Can a final variable be given a new value later?', false, 'final', 'Its value is fixed at initialization.'), PT('What happens?', 'Compile error', 'final', 'Reassigning a final variable does not compile.')]);
      }
      const src = `final double C = ${v};\ndouble d = C * 2;\nSystem.out.print(d);`;
      return outcomeQ(rng, null, src, [{ text: 'Compile error', concept: 'final' }, { text: v, concept: 'final' }, { text: String(Math.trunc(Number(v) * 2)), concept: 'double-print-format' }, { text: '0.0', concept: 'declare-init' }],
        (r) => ['final only stops C from being reassigned.', 'Reading C (C * 2) is fine.', `<b>${r.text}</b>`], [PYN('Is reading a final variable allowed?', true, 'final', 'Only reassigning it is an error.'), PT('What is printed?', R(src).text, 'double-print-format', 'A double prints with a decimal point.')]);
    } },
    { c: ['declare-init'], f(rng) {
      const n = rng.int(2, 20), m = rng.int(21, 60);
      const src = `int a;\na = ${n};\na = ${m};\nSystem.out.print(a);`;
      return textQ(null, src, ['int a; declares a (no value yet).', `a = ${n}; gives it its first value; a = ${m}; replaces it.`, `<b>${m}</b>`],
        [PM(rng, 'Which line declares a?', 'Line 1', [{ text: 'Line 2', concept: 'declare-init' }, { text: 'Line 3', concept: 'declare-init' }, { text: 'Every line that mentions a', concept: 'declare-init' }], 'declare-init', 'Only the line with the type (int a;) declares it.'),
          PN('What is a after line 2?', n, 'declare-init', 'Line 2 initializes a.'), PT('What is printed?', String(m), 'assign-is-snapshot', 'The last assignment wins.')]);
    } },
    { c: ['three-primitives'], f(rng) {
      const nonPrim = rng.pick(['String', 'Integer', 'Scanner']);
      return choiceQ(rng, 'Which of these is NOT a primitive type?', `<code>${nonPrim}</code>`, [
        { text: '<code>int</code>', concept: 'three-primitives' }, { text: '<code>double</code>', concept: 'three-primitives' }, { text: '<code>boolean</code>', concept: 'three-primitives' }],
      ['AP CSA uses three primitive types: int, double and boolean.', 'Everything else is an object type.', `<b>${nonPrim}</b> is an object type.`],
      [PN('How many primitive types does AP CSA use?', 3, 'three-primitives', 'int, double, boolean.'), PYN(`Is ${nonPrim} an object type?`, true, 'three-primitives', 'Anything that is not int, double or boolean is an object.')]);
    } },
  ]);

  gen('u1-print-doubles', 'How doubles and constants print', 'cs1-variables', [
    { c: ['double-print-format'], f(rng) {
      const n = rng.int(2, 99);
      const src = `double x = ${n};\nSystem.out.print(x);`;
      return textQ(null, src, ['An int assigned to a double becomes a double.', 'A double always prints with a decimal point.', `<b>${n}.0</b>`],
        [PM(rng, `What value does x hold?`, `<code>${n}.0</code>`, [{ text: `<code>${n}</code>`, concept: 'double-print-format' }, { text: 'Compile error', concept: 'widening' }], 'widening', 'An int fits into a double by adding .0.'),
          PT('What is printed?', `${n}.0`, 'double-print-format', 'Doubles print with a decimal point.')]);
    } },
    { c: ['double-print-format', 'sci-notation'], hard: true, f(rng) {
      const n = rng.int(2, 9), k = rng.pick([10000000, 100000000, 0.0001]);
      const src = `double x = ${n} * ${k === 0.0001 ? '0.0001' : k + '.0'};\nSystem.out.print(x);`;
      return textQ(null, src, ['Doubles of 10^7 or more, or below 0.001, print in E (scientific) notation.', 'The mantissa always has a decimal point.', (r) => `<b>${r}</b>`].slice(0, 2).concat([`<b>${R(src).text}</b>`]),
        (r) => [PYN('Does Java print this value in E notation?', true, 'double-print-format', 'Values ≥ 10^7 or < 10^-3 print in E notation.'), PT('What is printed?', r.text, 'sci-notation', 'For example 3.0E7 means 3.0 × 10^7.')]);
    } },
    { c: ['sci-notation'], f(rng) {
      const m = rng.pick([1.5, 2.5, 3.5, 4.5, 1.2, 2.4]), e = rng.int(10, 30);
      const src = `double big = ${m}E${e};\nSystem.out.print(big * 2);`;
      return textQ(null, src, (r) => [`${m}E${e} means ${m} × 10^${e}.`, 'Doubling gives the mantissa × 2; Java prints large doubles in E notation.', `<b>${r.text}</b>`],
        (r) => [PM(rng, `What does ${m}E${e} mean?`, esc(`${m} × 10^${e}`), [{ text: esc(`${m} × e^${e}`), concept: 'sci-notation' }, { text: esc(`${m}^${e}`), concept: 'sci-notation' }, { text: esc(`${m} + ${e}`), concept: 'sci-notation' }], 'sci-notation', 'E means "times 10 to the power".'),
          PT('What is printed?', r.text, 'sci-notation', 'Big doubles print in E notation.')]);
    } },
    { c: ['math-pi-e'], f(rng) {
      const which = rng.pick(['PI', 'E']), k = rng.pick([10, 100, 1000]);
      const src = `System.out.print((int)(Math.${which} * ${k}));`;
      return textQ(null, src, (r) => [`Math.${which} is ${which === 'PI' ? '3.141592653589793' : '2.718281828459045'}.`, `Times ${k}, then (int) chops the decimals.`, `<b>${r.text}</b>`],
        (r) => [PM(rng, `What is Math.${which}?`, which === 'PI' ? '<code>3.141592653589793</code>' : '<code>2.718281828459045</code>', [
          { text: which === 'PI' ? '<code>3.14</code>' : '<code>2.72</code>', concept: 'math-pi-e' }, { text: which === 'PI' ? '<code>2.718281828459045</code>' : '<code>3.141592653589793</code>', concept: 'math-pi-e' }, { text: 'Compile error', concept: 'math-pi-e' }], 'math-pi-e', 'Math.PI and Math.E are full-precision doubles.'),
          PT('What is printed?', r.text, 'cast-int', '(int) truncates the decimal part.')]);
    } },
  ]);

  // =====================================================================
  // 1.3–1.4 Arithmetic
  // =====================================================================
  gen('u1-int-div', 'int division and modulus', 'cs1-arith', [
    { c: ['int-division'], f(rng) {
      let a = rng.int(10, 60), b = rng.int(3, 9); if (a % b === 0) a++;
      const src = `System.out.print(${a} / ${b});`;
      return textQ(null, src, [`${a} and ${b} are both ints, so this is int division.`, `${a} ÷ ${b} = ${(a / b).toFixed(3)}…, and int division chops off the decimal (no rounding).`, `<b>${Math.trunc(a / b)}</b>`],
        [PM(rng, `What type is ${a} / ${b}?`, 'int', [{ text: 'double', concept: 'int-division' }, { text: 'It depends on the answer', concept: 'int-division' }], 'int-division', 'int / int is always an int.'),
          PT('What is printed?', String(Math.trunc(a / b)), 'int-division', 'The decimal part is truncated, never rounded.')]);
    } },
    { c: ['mixed-mode'], f(rng) {
      let a = rng.int(10, 60), b = rng.pick([2, 4, 5, 8]); if (a % b === 0) a++;
      const form = rng.pick([`${a} / ${b}.0`, `${a}.0 / ${b}`, `${a} * 1.0 / ${b}`]);
      const src = `System.out.print(${form});`;
      return textQ(null, src, (r) => ['If either operand is a double, the result is a double (mixed-mode arithmetic).', 'No truncation happens.', `<b>${r.text}</b>`],
        (r) => [PM(rng, `What type is ${form}?`, 'double', [{ text: 'int', concept: 'mixed-mode' }], 'mixed-mode', 'One double operand makes the whole operation a double.'),
          PT('What is printed?', r.text, 'mixed-mode', 'The decimal part is kept.')]);
    } },
    { c: ['modulus'], f(rng) {
      const a = rng.int(5, 80), b = rng.int(2, 12);
      const src = `System.out.print(${a} % ${b});`;
      return textQ(null, src, (r) => [`% is the remainder of division.`, `${a} ÷ ${b} is ${Math.trunc(a / b)} remainder ${a % b}.`, `<b>${r.text}</b>`],
        [PN(`What is ${a} / ${b} in Java?`, Math.trunc(a / b), 'int-division', 'int division truncates.'), PT('What is printed?', String(a % b), 'modulus', `${a} − ${b}·${Math.trunc(a / b)} = ${a % b}.`)]);
    } },
    { c: ['mod-properties'], hard: true, f(rng) {
      const n = rng.int(3, 40), k = rng.int(2, 9);
      const exprs = rng.shuffle([`${n} % 1`, `0 % ${n}`, `${k} % ${k + n}`, `${n * k} % ${k}`]).slice(0, 3);
      const src = `System.out.print(${exprs[0]} + " " + (${exprs[1]}) + " " + (${exprs[2]}));`;
      return textQ(null, src, (r) => ['a % 1 is 0; 0 % a is 0; a smaller number mod a bigger one is itself; a multiple of b mod b is 0.', `<b>${r.text}</b>`],
        exprs.map((e) => PT(`What is ${e}?`, val('', e), 'mod-properties', 'Use the remainder rules.')));
    } },
    { c: ['literal'], f(rng) {
      const n = rng.int(2, 99);
      return choiceQ(rng, `In the statement <code>int score = ${n};</code>, which is the literal?`, `<code>${n}</code>`, [
        { text: '<code>score</code>', concept: 'literal' }, { text: '<code>int</code>', concept: 'literal' }, { text: '<code>=</code>', concept: 'literal' }],
      ['A literal is a fixed value written directly in the code.', '<code>score</code> is a variable; <code>int</code> is a type.', `<b>${n}</b>`],
      [PYN(`Can the value of the literal ${n} ever change?`, false, 'literal', 'Literals are fixed values.'), PYN('Can score change later (it is not final)?', true, 'literal', 'Variables can be reassigned.')]);
    } },
  ]);

  gen('u1-precedence', 'Arithmetic order of operations', 'cs1-arith', [
    { c: ['arith-precedence'], f(rng) {
      const [a, b, c, d, e, f] = [rng.int(2, 9), rng.int(4, 12), rng.int(2, 4), rng.int(2, 6), rng.int(1, 9), rng.int(2, 7)];
      const expr = `${a} + ${b} / ${c} * ${d} - ${e} % ${f}`;
      const src = `System.out.print(${expr});`;
      const s1 = Math.trunc(b / c);
      return textQ(null, src, (r) => ['* / % happen before + −, and within a group, left to right.', `${b} / ${c} = ${s1}, then ${s1} * ${d} = ${s1 * d}, then ${e} % ${f} = ${e % f}.`, `${a} + ${s1 * d} − ${e % f}`, `<b>${r.text}</b>`],
        (r) => [PM(rng, 'Which operation happens first?', `<code>${b} / ${c}</code>`, [{ text: `<code>${a} + ${b}</code>`, concept: 'arith-precedence' }, { text: `<code>${c} * ${d}</code>`, concept: 'arith-precedence' }, { text: `<code>${e} % ${f}</code>`, concept: 'arith-precedence' }], 'arith-precedence', '/ and * have the same precedence, so the leftmost one goes first.'),
          PN(`What is ${b} / ${c} * ${d}?`, s1 * d, 'int-division', `int division first: ${s1}, then × ${d}.`), PT('What is printed?', r.text, 'arith-precedence', 'Then do + and − left to right.')]);
    } },
    { c: ['left-to-right-types'], hard: true, f(rng) {
      let a = rng.int(21, 79), b = 10, c = rng.int(21, 79); if (a % 10 === 0) a++; if (c % 10 === 0) c++;
      const src = `System.out.print(1.0 * ${a} / ${b} + ${c} / ${b});`;
      return textQ(null, src, (r) => [`1.0 * ${a} is ${a}.0, so ${a}.0 / ${b} is a double: ${val('', `1.0 * ${a} / ${b}`)}.`, `But ${c} / ${b} is still int / int: ${Math.trunc(c / b)}.`, `<b>${r.text}</b>`],
        (r) => [PT(`What is 1.0 * ${a} / ${b}?`, val('', `1.0 * ${a} / ${b}`), 'mixed-mode', 'The 1.0 makes the left part a double.'),
          PN(`What is ${c} / ${b}?`, Math.trunc(c / b), 'left-to-right-types', 'This part has no double in it, so it is int division.'),
          PT('What is printed?', r.text, 'left-to-right-types', 'double + int gives a double.')]);
    } },
  ]);

  gen('u1-div-zero', 'Division by zero', 'cs1-arith', [
    { c: ['int-div-zero'], f(rng) {
      const n = rng.int(2, 50);
      const src = `int a = ${n};\nSystem.out.print(a / 0);`;
      return outcomeQ(rng, null, src, [{ text: 'Infinity', concept: 'double-div-zero' }, { text: '0', concept: 'int-div-zero' }, { text: 'Compile error', concept: 'compiler-no-values' }],
        ['a / 0 is int / int, which compiles.', 'At run time an int divided by the int 0 throws an ArithmeticException.', '<b>ArithmeticException</b>'],
        [PYN('Does it compile?', true, 'compiler-no-values', 'The compiler only checks types.'), PT('What happens when it runs?', 'ArithmeticException', 'int-div-zero', 'int ÷ int 0 is a runtime error.')]);
    } },
    { c: ['double-div-zero'], hard: true, f(rng) {
      const n = rng.int(2, 50);
      const form = rng.pick([`${n} / 0.0`, `${n}.0 / 0`, `-${n} / 0.0`]);
      const src = `System.out.print(${form});`;
      return outcomeQ(rng, null, src, [{ text: 'ArithmeticException', concept: 'double-div-zero' }, { text: '0.0', concept: 'double-div-zero' }, { text: 'Compile error', concept: 'compiler-no-values' }, { text: 'NaN', concept: 'double-div-zero' }],
        (r) => ['One operand is a double, so this is double division.', 'Dividing by zero with doubles is not an error: it gives Infinity (or −Infinity).', `<b>${r.text}</b>`],
        (r) => [PYN('Is this double division?', true, 'mixed-mode', 'Either operand being a double makes it double division.'), PT('What is printed?', r.text, 'double-div-zero', 'Doubles divided by zero give Infinity; only int ÷ 0 crashes.')]);
    } },
    { c: ['numeric-only-arith'], f(rng) {
      const src = rng.pick(['System.out.print(8 / "John Cena");', 'String s = "abc";\nSystem.out.print(s * 3);', 'boolean b = true;\nSystem.out.print(b + 1);']);
      return outcomeQ(rng, null, src, [{ text: 'ArithmeticException', concept: 'numeric-only-arith' }, { text: '0', concept: 'numeric-only-arith' }, { text: 'abcabcabc', concept: 'numeric-only-arith' }, { text: '2', concept: 'numeric-only-arith' }],
        ['*, /, %, − only work on numbers (int, double, Integer, Double).', 'A String or boolean operand is a type error.', '<b>Compile error</b>'],
        [PYN('Are both operands numbers?', false, 'numeric-only-arith', 'One of them is a String or a boolean.'), PT('What happens?', 'Compile error', 'compile-error', 'Bad operand types are caught at compile time.')]);
    } },
  ]);

  // =====================================================================
  // 1.3–1.4 Assignment, swap, print
  // =====================================================================
  gen('u1-swap', 'Assignment and swapping', 'cs1-assign', [
    { c: ['swap-temp'], f(rng) {
      const a = rng.int(1, 20), b = a + rng.int(1, 20);
      const v = rng.pick(['bad', 'good1', 'good2']);
      const body = v === 'bad' ? 'a = b;\nb = a;' : v === 'good1' ? 'int temp = a;\na = b;\nb = temp;' : 'int temp = b;\nb = a;\na = temp;';
      const src = `int a = ${a}, b = ${b};\n${body}\nSystem.out.print(a + " " + b);`;
      return textQ(null, src, (r) => [v === 'bad' ? `a = b makes a ${b}; then b = a copies the NEW a, so b is ${b} too.` : 'The temp variable remembers one value before it is overwritten.', `<b>${r.text}</b>`],
        (r) => [PN('What is a after the second line runs?', Number(val(`int a = ${a}, b = ${b};\n${body.split('\n')[0]}`, 'a')), 'assign-is-snapshot', 'Each assignment copies the current value.'),
          PT('What is printed?', r.text, 'swap-temp', v === 'bad' ? 'Without a temp variable the original a is lost.' : 'This swap works.')]);
    } },
    { c: ['assign-is-snapshot'], f(rng) {
      const x = rng.int(1, 20), y = x + rng.int(1, 20);
      const src = `int a = ${x};\nint b = a;\na = ${y};\nSystem.out.print(a + " " + b);`;
      return textQ(null, src, ['b = a copies the value a has at that moment.', `Changing a later does not change b.`, `<b>${y} ${x}</b>`],
        [PN('What is b after line 2?', x, 'assign-is-snapshot', 'It copies a\'s current value.'), PN('What is b after line 3?', x, 'assign-is-snapshot', 'b is a separate variable; it keeps its value.'), PT('What is printed?', `${y} ${x}`, 'assign-is-snapshot', 'a changed, b did not.')]);
    } },
  ]);

  gen('u1-print-println', 'print vs println', 'cs1-assign', [
    { c: ['print-println'], f(rng) {
      const L = rng.shuffle(['A', 'B', 'C', 'D', 'E']).slice(0, 4);
      const kinds = L.map(() => rng.pick(['print', 'println']));
      const src = L.map((x, i) => `System.out.${kinds[i]}("${x}");`).join('\n');
      return textQ(null, src, (r) => ['println prints and THEN moves to a new line; print stays on the same line.', `<b>${r.text}</b>`],
        (r) => [PN('How many lines of output are there (counting a last unfinished line)?', r.r.output.replace(/\n$/, '').split('\n').length, 'print-println', 'Each println ends a line.'),
          PT('What is on the first line?', r.r.output.split('\n')[0], 'print-println', 'Everything up to and including the first println.'), PT('Full output?', r.text, 'print-println', 'Separate lines with " / ".')]);
    } },
  ]);

  gen('u1-quadratic', 'Parentheses in formulas', 'cs1-assign', [
    { c: ['quadratic-parens', 'logic-error'], f(rng) {
      const [a, b, c] = rng.pick([[2, 5, -3], [1, -3, 2], [2, 8, -3], [4, 3, -6], [1, 1, -6]]);
      const bad = `public static double qf1(double a, double b, double c){\n  return (-b + Math.sqrt(b*b - 4*a*c))/2*a;\n}`;
      const good = bad.replace('/2*a', '/(2*a)');
      const got = Number(val(bad, `qf1(${a}, ${b}, ${c})`)), right = Number(val(good, `qf1(${a}, ${b}, ${c})`));
      return { type: 'numeric', prompt: `What does <code>qf1(${a}, ${b}, ${c})</code> return?${code(bad)}`, answer: got,
        steps: ['/2*a means: divide by 2, THEN multiply by a (left to right).', `The intended answer is ${right}, using /(2*a).`, `This code returns <b>${got}</b>, a logic error.`],
        parts: [PN(`What should the solution be (with /(2*a))?`, right, 'quadratic-parens', 'The whole 2*a is the denominator.'),
          PN('What does this code actually return?', got, 'quadratic-parens', '/2*a divides by 2 and multiplies by a.'),
          PM(rng, 'What kind of error is this?', 'Logic error', [{ text: 'Compile error', concept: 'logic-error' }, { text: 'Runtime error', concept: 'logic-error' }], 'logic-error', 'It runs fine but gives a wrong answer.')] };
    } },
  ]);

  // =====================================================================
  // 1.5 Casting
  // =====================================================================
  gen('u1-cast', 'Casting', 'cs1-casting', [
    { c: ['cast-int'], f(rng) {
      const x = (rng() < 0.5 ? -1 : 1) * (rng.int(1, 40) + rng.pick([0.2, 0.5, 0.7, 0.9]));
      const src = `double x = ${x};\nSystem.out.print((int) x);`;
      return textQ(null, src, (r) => ['(int) chops off the decimal part (toward zero); it does not round.', `<b>${r.text}</b>`],
        (r) => [PYN('Does (int) round to the nearest integer?', false, 'cast-int', 'It truncates.'), PT('What is printed?', r.text, 'cast-int', `(int)${x} drops everything after the decimal point.`)]);
    } },
    { c: ['cast-precedence'], f(rng) {
      const a = rng.int(2, 9) + rng.pick([0.6, 0.7, 0.8]), k = rng.int(2, 5);
      const form = rng.pick([`(int)a * ${k}`, `(int)(a * ${k})`]);
      const src = `double a = ${a};\nint b = ${form};\nSystem.out.print(b);`;
      return textQ(null, src, (r) => ['A cast happens before * / % + −.', form.startsWith('(int)a') ? `(int)a is ${Math.trunc(a)}, then × ${k}.` : `a * ${k} happens first (parentheses), then the cast.`, `<b>${r.text}</b>`],
        (r) => [PM(rng, 'What happens first?', form.startsWith('(int)a') ? 'The cast of a' : `The multiplication a * ${k}`, [{ text: form.startsWith('(int)a') ? `The multiplication a * ${k}` : 'The cast of a', concept: 'cast-precedence' }], 'cast-precedence', 'Casting has higher precedence than *, unless parentheses say otherwise.'),
          PT('What is printed?', r.text, 'cast-precedence', 'Then the other operation.')]);
    } },
    { c: ['cast-quotient'], f(rng) {
      let a = rng.int(21, 99), b = rng.pick([4, 8, 10]); if (a % b === 0) a++;
      const form = rng.pick(['(double)a/b', 'a/(double)b', '(double)(a/b)']);
      const src = `int a = ${a};\nint b = ${b};\ndouble c = ${form};\nSystem.out.print(c);`;
      return textQ(null, src, (r) => [form === '(double)(a/b)' ? `a/b is int division first: ${Math.trunc(a / b)}; then the cast makes it ${Math.trunc(a / b)}.0.` : 'One operand is cast to double before dividing, so the division keeps decimals.', `<b>${r.text}</b>`],
        (r) => [PYN('Is the division done as int / int?', form === '(double)(a/b)', 'cast-quotient', form === '(double)(a/b)' ? 'The parentheses make a/b happen before the cast.' : 'The cast happens before the division.'), PT('What is printed?', r.text, 'cast-quotient', 'Where the cast goes decides whether the decimal survives.')]);
    } },
    { c: ['cast-right-to-left'], hard: true, f(rng) {
      const x = rng.int(2, 20) + rng.pick([0.13, 0.5, 0.81]);
      const src = `double a = ${x};\na = (double)(int)a;\nSystem.out.print(a);`;
      return textQ(null, src, (r) => ['Chained casts go right to left: (int)a first.', `(int)${x} is ${Math.trunc(x)}, then (double) makes it ${Math.trunc(x)}.0.`, `<b>${r.text}</b>`],
        [PN(`What is (int)${x}?`, Math.trunc(x), 'cast-int', 'Truncate.'), PT('What is printed?', `${Math.trunc(x)}.0`, 'cast-right-to-left', 'The (double) on the left happens last.')]);
    } },
    { c: ['widening'], f(rng) {
      const n = rng.int(2, 50);
      const bad = rng() < 0.5;
      const src = bad ? `int a = ${n}.0;\nSystem.out.print(a);` : `double a = ${n};\nSystem.out.print(a);`;
      return outcomeQ(rng, null, src, bad ? [{ text: String(n), concept: 'widening' }, { text: `${n}.0`, concept: 'widening' }, { text: '0', concept: 'widening' }] : [{ text: String(n), concept: 'double-print-format' }, { text: 'Compile error', concept: 'widening' }, { text: '0.0', concept: 'widening' }],
        (r) => ['An int (4 bytes) fits into a double (8 bytes): 3 becomes 3.0.', 'A double does not fit into an int without a cast.', `<b>${r.text}</b>`],
        (r) => [PYN('Does it compile?', !bad, 'widening', bad ? 'A double value cannot be stored in an int.' : 'An int value can be stored in a double.'), PT('What is the result?', r.text, 'widening', bad ? 'incompatible types: possible lossy conversion.' : 'The int becomes a double.')]);
    } },
    { c: ['cast-out-of-range'], hard: true, f(rng) {
      const neg = rng() < 0.5, e = rng.int(11, 25);
      const src = `System.out.print((int)(${neg ? '-' : ''}6.022E${e}));`;
      return outcomeQ(rng, null, src, [{ text: 'ArithmeticException', concept: 'cast-out-of-range' }, { text: neg ? '2147483647' : '-2147483648', concept: 'cast-out-of-range' }, { text: `${neg ? '-' : ''}6.022E${e}`, concept: 'cast-out-of-range' }, { text: '0', concept: 'cast-out-of-range' }],
        (r) => ['The double is far beyond the int range.', 'Casting to int clamps it to Integer.MAX_VALUE or Integer.MIN_VALUE. No error.', `<b>${r.text}</b>`],
        (r) => [PYN('Does the cast throw an error?', false, 'cast-out-of-range', 'It clamps to the nearest int limit.'), PT('What is printed?', r.text, 'cast-out-of-range', neg ? 'Below the int range: Integer.MIN_VALUE.' : 'Above the int range: Integer.MAX_VALUE.')]);
    } },
  ]);

  gen('u1-win-proportion', 'Returning a ratio of ints', 'cs1-casting', [
    { c: ['win-proportion'], f(rng) {
      let w = rng.int(1, 9), g = rng.pick([10, 20, 4, 8]); if (w >= g) w = g - 1;
      const variant = rng.pick(['bad', 'fixed', 'paren']);
      const body = variant === 'bad' ? 'return wins/games;' : variant === 'fixed' ? 'return (double)wins/games;' : 'return (double)(wins/games);';
      const meth = `public static double winProportion(int wins, int games){\n  ${body}\n}`;
      const src = `${meth}\nSystem.out.print(winProportion(${w}, ${g}));`;
      const right = String(w / g);
      return outcomeQ(rng, `What is printed?`, src, [{ text: right, concept: 'win-proportion' }, { text: '0.0', concept: 'cast-quotient' }, { text: '0', concept: 'return-widen' }, { text: '1.0', concept: 'int-division' }],
        (r) => [variant === 'fixed' ? `(double)wins makes ${w}.0, so ${w}.0/${g} keeps the decimal.` : `wins/games is int division: ${w}/${g} is 0.`, variant === 'bad' ? 'The return statement then converts the int 0 to 0.0.' : variant === 'paren' ? 'The cast comes after the division, so it only turns 0 into 0.0.' : `That is ${right}.`, `<b>${r.text}</b>`],
        (r) => [PN(`What is ${w}/${g} with ints?`, 0, 'int-division', 'int division truncates.'), PT('What is printed?', r.text, variant === 'paren' ? 'cast-quotient' : 'win-proportion', 'Cast the numerator (or denominator), not the quotient.')]);
    } },
  ]);

  // =====================================================================
  // 1.5 Rounding methods
  // =====================================================================
  const ROUND_BAD = 'public static int round(double num){\n  return (int)(num + 0.5);\n}';
  const ROUND_GOOD = 'public static int round(double num){\n  if(num > 0)\n    return (int)(num + 0.5);\n  return (int)(num - 0.5);\n}';
  gen('u1-rounding', 'Rounding methods', 'cs1-rounding', [
    { c: ['round-half'], f(rng) {
      const x = -(rng.int(1, 20) + rng.pick([0.3, 0.6, 0.8]));
      const useBad = rng() < 0.6;
      const src = `${useBad ? ROUND_BAD : ROUND_GOOD}\nSystem.out.print(round(${x}));`;
      return textQ(null, src, (r) => [useBad ? `${x} + 0.5 = ${(x + 0.5).toFixed(1)}; (int) truncates toward zero.` : `For a negative number the method subtracts 0.5: ${(x - 0.5).toFixed(1)}, then (int) truncates.`, useBad ? 'Adding 0.5 only rounds correctly for positive numbers.' : 'That rounds negatives correctly.', `<b>${r.text}</b>`],
        (r) => [PT(`What is num ${useBad ? '+' : '−'} 0.5?`, String(useBad ? Math.round((x + 0.5) * 10) / 10 : Math.round((x - 0.5) * 10) / 10), 'round-half', 'Work out the double first.'), PT('What is printed?', r.text, 'round-half', '(int) truncates toward zero.')]);
    } },
    { c: ['round-digits'], f(rng) {
      const x = Math.round((rng.int(1, 30) + rng()) * 100000) / 100000, d = rng.pick([1, 2, 3]);
      const meth = `${ROUND_GOOD}\npublic static double round(double num, int digits){\n  int powTen = (int)(Math.pow(10, digits));\n  num = round(num*powTen);\n  return num/powTen;\n}`;
      const src = `${meth}\nSystem.out.print(round(${x}, ${d}));`;
      return textQ(null, src, (r) => [`powTen is ${Math.pow(10, d)}.`, `round(${x}*${Math.pow(10, d)}) rounds to a whole number, then dividing by ${Math.pow(10, d)} puts the decimal back.`, `<b>${r.text}</b>`],
        (r) => [PN('What is powTen?', Math.pow(10, d), 'round-digits', `10^${d}.`), PN('Which method does round(num*powTen) call: the one with 1 parameter or 2?', 1, 'overload-intro', 'One double argument matches round(double).'), PT('What is printed?', r.text, 'round-digits', 'Multiply, round, divide.')]);
    } },
    { c: ['round-parens'], hard: true, f(rng) {
      const src = 'public static int round(double num){\n  return (int)num + 0.5;\n}\nSystem.out.print(round(2.7));';
      return outcomeQ(rng, null, src, [{ text: '3', concept: 'round-parens' }, { text: '2.5', concept: 'round-parens' }, { text: '2', concept: 'cast-precedence' }],
        ['The cast happens before + 0.5: (int)num is 2, then 2 + 0.5 is the double 2.5.', 'The method promises an int but returns a double.', '<b>Compile error</b> (possible lossy conversion from double to int).'],
        [PM(rng, 'What type is (int)num + 0.5?', 'double', [{ text: 'int', concept: 'round-parens' }], 'cast-precedence', 'The cast applies to num only; adding 0.5 makes a double.'), PT('What happens?', 'Compile error', 'round-parens', 'Write (int)(num + 0.5).')]);
    } },
    { c: ['overload-intro'], f(rng) {
      const x = rng.int(1, 20) + 0.456, call = rng.pick([`round(${x})`, `round(${x}, 1)`]);
      const meth = `${ROUND_GOOD}\npublic static double round(double num, int digits){\n  int powTen = (int)(Math.pow(10, digits));\n  num = round(num*powTen);\n  return num/powTen;\n}`;
      const two = call.includes(',');
      return outcomeQ(rng, `Both methods are in the same class. What does <code>System.out.print(${call});</code> print?`, `${meth}\nSystem.out.print(${call});`,
        [{ text: two ? String(Math.round(x)) : String(Math.round(x * 10) / 10), concept: 'overload-intro' }, { text: 'Compile error', concept: 'overload-intro' }, { text: two ? `${Math.round(x)}.0` : `${Math.round(x)}.0`, concept: 'return-widen' }],
        (r) => ['Two methods named round are allowed because their parameter lists differ (overloading).', two ? 'A double and an int match round(double, int).' : 'One double matches round(double).', `<b>${r.text}</b>`],
        (r) => [PN('How many parameters does the method that runs take?', two ? 2 : 1, 'overload-intro', 'Java picks the method whose parameters match the arguments.'), PT('What is printed?', r.text, 'overload-intro', two ? 'It returns a double.' : 'It returns an int.')]);
    } },
  ]);

  // =====================================================================
  // 1.6 Compound assignment
  // =====================================================================
  gen('u1-compound', 'Compound assignment', 'cs1-compound', [
    { c: ['compound-trace', 'compound-ops'], f(rng) {
      for (let tries = 0; ; tries++) {
        const a = rng.int(3, 20), b = rng.int(2, 9);
        const ops = [['a', '-=', 'b'], ['b', '+=', 'a'], ['a', '*=', 'b'], ['b', '/=', 'a'], ['a', '%=', 'b'], ['a', '+=', String(rng.int(2, 9))]];
        const lines = rng.shuffle(ops).slice(0, 4).map(([x, o, y]) => `${x} ${o} ${y};`);
        const pre = `int a = ${a};\nint b = ${b};`;
        const src = `${pre}\n${lines.join('\n')}\nSystem.out.print(a + " " + b);`;
        const res = R(src);
        if (res.err && tries < 15) continue;
        return textQ(null, src, (r) => ['Keep a table of a and b after every line.', ...lines.map((l, i) => `After <code>${esc(l)}</code>: ${esc(val(`${pre}\n${lines.slice(0, i + 1).join('\n')}`, 'a + " " + b'))}`), `<b>${r.text}</b>`],
          (r) => [PT(`What are a and b after line 3 (answer like "a b")?`, val(`${pre}\n${lines[0]}`, 'a + " " + b'), 'compound-ops', `${lines[0]} uses the current values.`),
            PT('What are a and b after line 4?', val(`${pre}\n${lines.slice(0, 2).join('\n')}`, 'a + " " + b'), 'compound-trace', 'Use the values from the line before.'),
            PT('What is printed?', r.text, 'compound-trace', 'Keep tracing to the end (/= and %= on ints truncate).')]);
      }
    } },
    { c: ['compound-int-div'], f(rng) {
      let a = rng.int(11, 60), k = rng.pick([3, 4, 5, 7]); if (a % k === 0) a++;
      const src = `int a = ${a};\na /= ${k};\nSystem.out.print(a);`;
      return textQ(null, src, ['a /= k means a = a / k.', 'a is an int, so this is int division.', `<b>${Math.trunc(a / k)}</b>`],
        [PYN('Can an int hold a decimal part?', false, 'compound-int-div', 'So the division truncates.'), PT('What is printed?', String(Math.trunc(a / k)), 'compound-int-div', `${a} / ${k} truncated.`)]);
    } },
    { c: ['inc-dec'], f(rng) {
      const a = rng.int(1, 30);
      const ops = rng.shuffle(['a++;', 'a++;', 'a--;', 'a += 3;', 'a--;']).slice(0, 3);
      const src = `int a = ${a};\n${ops.join('\n')}\nSystem.out.print(a);`;
      return textQ(null, src, (r) => ['a++ adds 1, a-- subtracts 1, a += 3 adds 3.', `<b>${r.text}</b>`],
        (r) => [PN('What is a after the first change?', Number(val(`int a = ${a};\n${ops[0]}`, 'a')), 'inc-dec', `${ops[0]} changes a by 1 or 3.`), PT('What is printed?', r.text, 'inc-dec', 'Apply each change in order.')]);
    } },
    { c: ['assign-lowest'], hard: true, f(rng) {
      const y = rng.int(2, 9), p = rng.int(2, 6), qq = rng.int(1, 5);
      const op = rng.pick(['*=', '-=']);
      const src = `int y = ${y};\ny ${op} ${p} + ${qq};\nSystem.out.print(y);`;
      const wrong = op === '*=' ? y * p + qq : y - p + qq;
      return textQ(null, src, (r) => ['Assignment operators (=, *=, -=, …) have the lowest precedence, so they happen last.', `${p} + ${qq} = ${p + qq} first, then y ${op} ${p + qq}.`, `<b>${r.text}</b>`],
        (r) => [PN(`What is computed first?`, p + qq, 'assign-lowest', 'The right side is evaluated before the compound assignment.'), PM(rng, 'What is printed?', `<code>${r.text}</code>`, [{ text: `<code>${wrong}</code>`, concept: 'assign-lowest' }, { text: `<code>${y}</code>`, concept: 'compound-ops' }], 'assign-lowest', `y ${op} (${p} + ${qq}).`)]);
    } },
  ]);

  // =====================================================================
  // 1.7 Scanner
  // =====================================================================
  gen('u1-scanner', 'The Scanner class', 'cs1-scanner', [
    { c: ['scanner-methods'], f(rng) {
      const vals = [rng.int(1, 20), rng.int(1, 20), rng.int(1, 20)];
      const src = `import java.util.Scanner;\nScanner reader = new Scanner(System.in);\nint a = reader.nextInt();\nint b = reader.nextInt();\nint c = reader.nextInt();\nSystem.out.print(a - b + " " + c);`;
      return textQ(`The user types <code>${vals.join(' ')}</code>. What does this print?`, src, (r) => ['Each nextInt() returns the next value and moves past it.', `a = ${vals[0]}, b = ${vals[1]}, c = ${vals[2]}.`, `a − b happens first (left to right), then concatenation. <b>${r.text}</b>`],
        (r) => [PN('What value does b get?', vals[1], 'scanner-methods', 'The second nextInt() call returns the second value.'), PT('What is printed?', r.text, 'concat-left-right', '(a - b) is computed before + " " because − and + go left to right.')], { run: { input: vals.map(String) } });
    } },
    { c: ['scanner-hasnext'], f(rng) {
      const vals = Array.from({ length: rng.int(5, 10) }, () => rng.pick(['true', 'false']));
      const src = `Scanner reader = new Scanner(new File("potatoes.txt"));\nint good = 0;\nint rotten = 0;\nwhile(reader.hasNext()){\n  boolean g = reader.nextBoolean();\n  if(g)\n    good++;\n  else\n    rotten++;\n}\nSystem.out.print(good + " good, " + rotten + " rotten");`;
      const good = vals.filter((v) => v === 'true').length;
      const ans = `${good} good, ${vals.length - good} rotten`;
      return { type: 'text', prompt: `potatoes.txt contains <code>${vals.join(' ')}</code>. What does this print?${code(src)}`, answer: ans, hint: HINT, placeholder: 'Output',
        steps: ['hasNext() is true while values are left in the file.', 'Each nextBoolean() reads the next value.', `There are ${good} true and ${vals.length - good} false.`, `<b>${esc(ans)}</b>`],
        parts: [PN('How many times does the loop body run?', vals.length, 'scanner-hasnext', 'Once per value in the file.'), PN('How many values are true?', good, 'scanner-methods', 'Count them.'), PT('What is printed?', ans, 'scanner-hasnext', 'good counts true, rotten counts false.')] };
    } },
    { c: ['input-mismatch'], hard: true, f(rng) {
      const bad = rng.pick(['3.5', 'seven', 'true']);
      const src = `Scanner reader = new Scanner(System.in);\nint n = reader.nextInt();\nSystem.out.print(n * 2);`;
      return outcomeQ(rng, `The user types <code>${bad}</code>.`, src, [{ text: bad === '3.5' ? '7.0' : '0', concept: 'input-mismatch' }, { text: bad === '3.5' ? '6' : 'Compile error', concept: 'input-mismatch' }, { text: 'NullPointerException', concept: 'input-mismatch' }, { text: 'Compile error', concept: 'compile-vs-run' }],
        [`nextInt() expects an int, but the next value is "${esc(bad)}".`, 'That mismatch is found while the program runs.', '<b>InputMismatchException</b>'],
        [PYN('Does the program compile?', true, 'compiler-no-values', 'The compiler cannot know what the user will type.'), PT('What happens?', 'InputMismatchException', 'input-mismatch', 'The input does not match the type nextInt() reads.')], { run: { input: [bad] } });
    } },
    { c: ['scanner-create'], f(rng) {
      return choiceQ(rng, 'Which line correctly creates a Scanner that reads from the keyboard?', '<code>Scanner reader = new Scanner(System.in);</code>', [
        { text: '<code>Scanner reader = Scanner(System.in);</code>', concept: 'scanner-create' }, { text: '<code>Scanner reader = new Scanner();</code>', concept: 'scanner-create' },
        { text: '<code>new Scanner reader(System.in);</code>', concept: 'scanner-create' }, { text: '<code>Scanner reader = new Scanner(System.out);</code>', concept: 'scanner-create' }],
      ['Declare a Scanner variable, create the object with new, and pass System.in (the keyboard).', 'You also need import java.util.Scanner; at the top.', '<b>Scanner reader = new Scanner(System.in);</b>'],
      [PM(rng, 'Which import is needed?', '<code>import java.util.Scanner;</code>', [{ text: '<code>import java.io.Scanner;</code>', concept: 'scanner-create' }, { text: 'No import is needed', concept: 'scanner-create' }], 'scanner-create', 'Scanner lives in java.util.'),
        PYN('Does creating an object need the keyword new?', true, 'new-keyword', 'new calls the constructor.')]);
    } },
    { c: ['scanner-file'], hard: true, f(rng) {
      return choiceQ(rng, 'A program reads numbers from <code>temps.txt</code> with <code>new Scanner(new File("temps.txt"))</code>. What else does main need?', '<code>throws FileNotFoundException</code> in its header (and <code>import java.io.*;</code>)', [
        { text: 'Nothing else', concept: 'scanner-file' }, { text: 'A while loop around new Scanner', concept: 'scanner-file' }, { text: '<code>System.in</code> as a second argument', concept: 'scanner-file' }],
      ['A file might not exist, so main must declare throws FileNotFoundException.', 'File comes from java.io, so import java.io.*;', '<b>throws FileNotFoundException</b>'],
      [PYN('Is java.io needed for the File class?', true, 'scanner-file', 'File is in java.io.'), PM(rng, 'Which method tells you whether more values are left?', '<code>hasNext()</code>', [{ text: '<code>isEmpty()</code>', concept: 'scanner-hasnext' }, { text: '<code>nextLine()</code>', concept: 'scanner-hasnext' }], 'scanner-hasnext', 'hasNext() returns false when the file has no more values.')]);
    } },
  ]);

  // =====================================================================
  // 1.7 Structure of a class
  // =====================================================================
  const BOX = `public class Box {\n  private double w;\n  private double h;\n  public Box(double w0, double h0){\n    w = w0;\n    h = h0;\n  }\n  public Box(double side){\n    w = side;\n    h = side;\n  }\n  public Box(){\n    w = 1;\n    h = 1;\n  }\n  public double area(){\n    return w * h;\n  }\n  public void grow(double k){\n    w += k;\n  }\n}\n`;
  gen('u1-class-structure', 'Structure of a class', 'cs1-class-structure', [
    { c: ['ctor-overload'], f(rng) {
      const call = rng.pick([`new Box(${rng.int(2, 9)})`, `new Box(${rng.int(2, 9)}, ${rng.int(2, 9)})`, 'new Box()']);
      const src = `${BOX}Box b = ${call};\nSystem.out.print(b.area());`;
      const n = call.split(',').length + (call.includes('()') ? -1 : 0);
      return textQ(null, src, (r) => ['The constructor whose parameters match the arguments runs.', `${call} has ${n === 0 ? 'no arguments' : n === 1 ? 'one argument' : 'two arguments'}.`, `area() returns w * h as a double. <b>${r.text}</b>`],
        (r) => [PN('How many parameters does the constructor that runs have?', call.includes('()') ? 0 : call.includes(',') ? 2 : 1, 'ctor-overload', 'Java matches the argument list.'), PT('What is printed?', r.text, 'constructor', 'The constructor set w and h.')]);
    } },
    { c: ['constructor'], f(rng) {
      return choiceQ(rng, 'Which line is a correct constructor header for a class named <code>Box</code>?', '<code>public Box(double side)</code>', [
        { text: '<code>public void Box(double side)</code>', concept: 'constructor' }, { text: '<code>public double Box(double side)</code>', concept: 'constructor' },
        { text: '<code>public Box box(double side)</code>', concept: 'constructor' }],
      ['A constructor has the same name as the class.', 'It has NO return type, not even void.', '<b>public Box(double side)</b>'],
      [PYN('Does a constructor have a return type?', false, 'constructor', 'No return type at all.'), PM(rng, 'What is the main job of a constructor?', 'Set the initial values of the attributes', [{ text: 'Print the object', concept: 'constructor' }, { text: 'Return the object\'s area', concept: 'methods-behaviors' }], 'constructor', 'It initializes the new object.')]);
    } },
    { c: ['attributes'], f(rng) {
      return choiceQ(rng, `In this class, which are the attributes?${code(BOX.split('\n').slice(0, 8).join('\n') + '\n  ...\n}')}`, '<code>w</code> and <code>h</code>', [
        { text: '<code>w0</code> and <code>h0</code>', concept: 'attributes' }, { text: '<code>Box</code> and <code>area</code>', concept: 'attributes' }, { text: '<code>side</code>', concept: 'attributes' }],
      ['Attributes (instance variables) are declared at the top of the class, outside any method.', 'w0 and h0 are constructor parameters.', '<b>w and h</b>'],
      [PYN('Are w and h usually private?', true, 'attributes', 'Attributes are normally private.'), PYN('Is w0 an attribute?', false, 'attributes', 'It is a parameter of the constructor; it disappears when the constructor ends.')]);
    } },
    { c: ['methods-behaviors'], f(rng) {
      const s = rng.int(2, 6), k = rng.int(1, 4);
      const src = `${BOX}Box b = new Box(${s});\nb.grow(${k});\nSystem.out.print(b.area());`;
      return textQ(null, src, (r) => [`new Box(${s}) makes w = h = ${s}.0.`, `grow(${k}) changes the attribute w to ${s + k}.0.`, `area() = w * h. <b>${r.text}</b>`],
        (r) => [PN('What is w after grow?', s + k, 'methods-behaviors', 'Methods can change the object\'s attributes.'), PN('What is h after grow?', s, 'attributes', 'grow only changes w.'), PT('What is printed?', r.text, 'methods-behaviors', 'w * h as a double.')]);
    } },
    { c: ['double-tolerance'], hard: true, f(rng) {
      const pair = rng.pick([['0.1 + 0.2', '0.3'], ['0.1 * 3', '0.3'], ['1.1 + 2.2', '3.3']]);
      const src = `double a = ${pair[0]};\ndouble b = ${pair[1]};\nSystem.out.print((a == b) + " " + (Math.abs(a - b) <= 0.001));`;
      return textQ(null, src, (r) => ['Doubles store most decimals with a tiny rounding error.', `${pair[0]} is not exactly ${pair[1]} in a computer.`, 'Comparing within a tolerance (0.001) works.', `<b>${r.text}</b>`],
        (r) => [PYN('Is a == b true?', r.text.startsWith('true'), 'double-tolerance', 'Rounding error makes them slightly different.'), PT('What is printed?', r.text, 'double-tolerance', 'Use Math.abs(a − b) <= tolerance for doubles.')]);
    } },
  ]);

  // =====================================================================
  // 1.8 Comments, pre/postconditions
  // =====================================================================
  gen('u1-comments', 'Comments, preconditions, postconditions', 'cs1-comments', [
    { c: ['comments'], f(rng) {
      const x = rng.int(1, 9), a = rng.int(2, 9), b = rng.int(2, 4);
      const src = `int x = ${x};\n// x += ${a};\nx *= ${b};\n/* x -= 1;\nx += 100; */\nSystem.out.print(x);`;
      return textQ(null, src, ['// comments out one line; /* ... */ comments out everything between them.', `Only x *= ${b} runs.`, `<b>${x * b}</b>`],
        [PYN(`Does x += ${a} run?`, false, 'comments', 'The compiler ignores comments.'), PYN('Does x += 100 run?', false, 'comments', 'It is inside a /* */ block comment.'), PT('What is printed?', String(x * b), 'comments', `${x} × ${b}.`)]);
    } },
    { c: ['precondition'], f(rng) {
      const a = rng.int(5, 12), b = a - rng.int(1, 4);
      const meth = `// Precondition: a <= b\npublic static int findSum(int a, int b){\n  int sum = 0;\n  for(int i = a; i <= b; i++)\n    sum += i;\n  return sum;\n}`;
      const got = Number(val(meth, `findSum(${a}, ${b})`)), intended = Number(val(meth, `findSum(${b}, ${a})`));
      return { type: 'numeric', prompt: `findSum should add every integer from a to b.${code(meth)}What does <code>findSum(${a}, ${b})</code> return?`, answer: got,
        steps: [`i starts at ${a}, and ${a} <= ${b} is false, so the loop never runs.`, 'sum is still 0.', `<b>0</b> — the call breaks the precondition a <= b (the intended sum would be ${intended}).`],
        parts: [PYN(`Does findSum(${a}, ${b}) meet the precondition?`, false, 'precondition', `${a} <= ${b} is false.`), PN('What does it return?', got, 'precondition', 'The loop condition is false at the start.'), PN(`What is findSum(${b}, ${a})?`, intended, 'precondition', 'With a <= b it works as intended.')] };
    } },
    { c: ['precondition-substring'], hard: true, f(rng) {
      return choiceQ(rng, `This method compares one character of two Strings.${code('public static boolean sameChar(String s1, String s2, int index){\n  return s1.substring(index, index + 1).equals(s2.substring(index, index + 1));\n}')}What is its precondition?`,
        esc('0 <= index < Math.min(s1.length(), s2.length())'), [
          { text: esc('0 <= index <= Math.min(s1.length(), s2.length())'), concept: 'precondition-substring' },
          { text: esc('0 < index < s1.length()'), concept: 'string-index' },
          { text: esc('index < s1.length() + s2.length()'), concept: 'precondition-substring' }],
        ['substring(index, index + 1) needs index + 1 <= length, so index < length.', 'Both Strings must have that index, so use the shorter length.', '<b>0 <= index < Math.min(s1.length(), s2.length())</b>'],
        [PYN('Is index equal to the length allowed here?', false, 'precondition-substring', 'Then index + 1 would be past the end.'), PYN('Is index 0 allowed?', true, 'string-index', 'Indices start at 0.')]);
    } },
    { c: ['postcondition'], f(rng) {
      const src = 'String phase = "liquid";\nif(temperature < 0)\n  phase = "solid";\nif(temperature > 100)\n  phase = "vapor";';
      return choiceQ(rng, `Which is a postcondition of this code?${code(src)}`, esc('phase is "solid", "liquid", or "vapor", depending on temperature'), [
        { text: esc('temperature must be between 0 and 100'), concept: 'postcondition' }, { text: esc('temperature has been declared and initialized'), concept: 'precondition' },
        { text: esc('phase is always "liquid"'), concept: 'postcondition' }],
      ['A postcondition is what is guaranteed AFTER the code runs.', '"temperature has been initialized" must be true BEFORE, so it is a precondition.', '<b>phase is solid, liquid or vapor.</b>'],
      [PM(rng, 'Which is a precondition here?', 'temperature has been declared and initialized', [{ text: 'phase is "vapor"', concept: 'precondition' }, { text: 'phase was printed', concept: 'precondition' }], 'precondition', 'It must be true before the code runs.'), PYN('Is a postcondition checked before the code runs?', false, 'postcondition', 'It describes the result afterward.')]);
    } },
    { c: ['guard-precondition'], f(rng) {
      const s = rng.pick(PHRASES), i = rng.pick([-1, s.length, s.length + 2, rng.int(0, s.length - 1)]);
      const meth = `public static String charAt(String s, int index){\n  if(index < 0 || index >= s.length())\n    return "none";\n  return s.substring(index, index + 1);\n}`;
      const src = `${meth}\nSystem.out.print("[" + charAt(${q(s)}, ${i}) + "]");`;
      return textQ('What does this code print? (Brackets show spaces.)', src, (r) => [`The if statement exits early when index is outside 0 to ${s.length - 1}.`, i < 0 || i >= s.length ? 'So substring is never called, and no exception happens.' : `Index ${i} is fine, so substring returns that character.`, `<b>${r.text}</b>`],
        (r) => [PYN('Does the early return run?', i < 0 || i >= s.length, 'guard-precondition', `Valid indices are 0 to ${s.length - 1}.`), PT('What is printed?', r.text, 'guard-precondition', 'Checking the precondition first avoids the exception.')]);
    } },
  ]);

  // =====================================================================
  // 1.9 Method signatures
  // =====================================================================
  gen('u1-signatures', 'Method signatures and overloading', 'cs1-signatures', [
    { c: ['overload-rules'], hard: true, f(rng) {
      return choiceQ(rng, 'Which pair of method headers can both be in the same class?', esc('void show(int a, String b)  and  void show(String a, int b)'), [
        { text: esc('void show(int a)  and  void show(int b)'), concept: 'overload-rules' }, { text: esc('int show(int a)  and  double show(int a)'), concept: 'overload-rules' },
        { text: esc('public void show(int a)  and  private void show(int a)'), concept: 'overload-rules' }],
      ['Overloaded methods must have different lists of parameter TYPES.', 'Order counts: (int, String) differs from (String, int).', 'Parameter names, return types and public/private do not count.', '<b>show(int, String) and show(String, int)</b>'],
      [PYN('Does changing only the return type allow overloading?', false, 'overload-rules', 'The parameter types must differ.'), PYN('Is (int a, String b) different from (String a, int b)?', true, 'overload-rules', 'The order of types counts.')]);
    } },
    { c: ['return-widen'], f(rng) {
      let a = rng.int(5, 30), b = rng.int(2, 6); if (a % b === 0) a++;
      const src = `public static double half(int a, int b){\n  return a / b;\n}\nSystem.out.print(half(${a}, ${b}));`;
      return textQ(null, src, (r) => [`a / b is int division: ${Math.trunc(a / b)}.`, 'The method returns double, so the int is converted to a double.', `<b>${r.text}</b>`],
        [PN(`What is ${a} / ${b} in Java?`, Math.trunc(a / b), 'int-division', 'int / int.'), PT('What is printed?', `${Math.trunc(a / b)}.0`, 'return-widen', 'An int returned from a double method becomes a double.')]);
    } },
    { c: ['void-early-return'], f(rng) {
      const x = rng.pick([-rng.int(1, 9), rng.int(1, 9)]);
      const src = `public static void check(int x){\n  if(x < 0)\n    return;\n  System.out.print("ok " + x);\n}\ncheck(${x});\nSystem.out.print("!");`;
      return textQ(null, src, (r) => ['A void method can use return; (no value) to exit early.', x < 0 ? 'x < 0, so it returns before printing.' : 'x is not negative, so it prints.', `<b>${r.text}</b>`],
        (r) => [PYN('Does the method exit early?', x < 0, 'void-early-return', 'return; leaves the method.'), PT('What is printed?', r.text, 'void-early-return', 'After the method, "!" prints.')]);
    } },
    { c: ['return-type'], f(rng) {
      const src = `public static int pos(int a){\n  if(a > 0)\n    return a;\n}\nSystem.out.print(pos(${rng.int(1, 9)}));`;
      return outcomeQ(rng, null, src, [{ text: src.match(/pos\((\d)\)\);$/)[1], concept: 'return-type' }, { text: '0', concept: 'return-type' }, { text: 'NullPointerException', concept: 'return-type' }],
        ['A non-void method must return a value on every path.', 'If a > 0 is false, nothing is returned.', '<b>Compile error</b>: missing return statement.'],
        [PYN('Does every path return an int?', false, 'return-type', 'The path where a <= 0 has no return.'), PT('What happens?', 'Compile error', 'return-type', 'The compiler checks this, even though this call uses a positive number.')]);
    } },
    { c: ['public-private'], f(rng) {
      return choiceQ(rng, 'Where can a <code>private</code> method be called from?', 'Only from inside its own class', [
        { text: 'From any class', concept: 'public-private' }, { text: 'Only from main', concept: 'public-private' }, { text: 'Nowhere: private methods cannot be called', concept: 'public-private' }],
      ['public: callable from any class.', 'private: callable only from inside the class that defines it.', '<b>Only inside its own class.</b>'],
      [PYN('Can another class call a public method?', true, 'public-private', 'That is what public means.'), PYN('Can another class call a private method?', false, 'public-private', 'It does not compile.')]);
    } },
  ]);

  // =====================================================================
  // 1.10 Calling methods
  // =====================================================================
  gen('u1-calling', 'Calling methods', 'cs1-calling', [
    { c: ['arg-match'], f(rng) {
      const meth = 'public static void f(int a, double b, String c){\n  System.out.print(c);\n}';
      const cands = rng.shuffle(['f(4, 6, "Hi")', 'f(4, 6.5, "Hi")', 'f(4.0, 6, "Hi")', 'f(4, "Hi", 6)', 'f("4", 6.0, "Hi")', 'f(4, 6)']);
      const ok = cands.filter((cl) => !R(`${meth}\n${cl};`).err);
      const bad = cands.filter((cl) => R(`${meth}\n${cl};`).err);
      const right = ok[0];
      return choiceQ(rng, `Which call compiles?${code(meth)}`, `<code>${esc(right)}</code>`, bad.map((b) => ({ text: `<code>${esc(b)}</code>`, concept: 'arg-match' })),
        ['Arguments must match the parameter types in order: (int, double, String).', 'An int can be passed to a double parameter; a double cannot go to an int.', `<b>${esc(right)}</b>`],
        [PYN('Can an int be passed to a double parameter?', true, 'arg-match', 'It is widened (6 becomes 6.0).'), PYN('Can a double be passed to an int parameter?', false, 'arg-match', 'That would lose information.')]);
    } },
    { c: ['use-return'], f(rng) {
      const n = rng.int(2, 20);
      const src = `public static int twice(int x){\n  return x * 2;\n}\nint n = ${n};\ntwice(n);\nSystem.out.print(n);`;
      return textQ(null, src, ['twice(n) returns a value, but nothing stores or prints it.', 'n itself is never changed.', `<b>${n}</b>`],
        [PN('What does twice(n) return?', 2 * n, 'trace-calls', 'x * 2.'), PYN('Does calling twice(n) change n?', false, 'use-return', 'The returned value is thrown away; n keeps its value.'), PT('What is printed?', String(n), 'use-return', 'Use n = twice(n); to keep the result.')]);
    } },
    { c: ['void-not-value'], f(rng) {
      const src = 'public static void hello(){\n  System.out.print("hi");\n}\nSystem.out.print(hello());';
      return outcomeQ(rng, null, src, [{ text: 'hi', concept: 'void-not-value' }, { text: 'hihi', concept: 'void-not-value' }, { text: 'null', concept: 'void-not-value' }],
        ['hello() is void: it returns no value.', 'print needs a value to print.', '<b>Compile error</b>: void type not allowed here.'],
        [PYN('Does hello() return a value?', false, 'void-not-value', 'void means no value.'), PT('What happens?', 'Compile error', 'void-not-value', 'Just call hello(); on its own line.')]);
    } },
    { c: ['caller-vs-param'], f(rng) {
      const [n1, n2] = rng.shuffle(NAMES).slice(0, 2), m = rng.int(5, 12), d = rng.int(2, 6), h = rng.int(20, 40);
      const cls = `public class Fighter {\n  private String name;\n  private int might;\n  private int health;\n  public Fighter(String n, int m, int h){\n    name = n; might = m; health = h;\n  }\n  public String getName(){ return name; }\n  public void attack(Fighter target){\n    System.out.print(name + " hits " + target.getName() + " ");\n    target.damage(might - ${d});\n  }\n  public void damage(int loss){\n    health -= loss;\n    System.out.print(name + " " + health);\n  }\n}\n`;
      const src = `${cls}Fighter a = new Fighter(${q(n1)}, ${m}, ${h});\nFighter b = new Fighter(${q(n2)}, ${m + 3}, ${h});\na.attack(b);`;
      return textQ(null, src, (r) => [`a calls attack, so inside attack, name and might are ${n1}'s.`, `target is b, so target.damage(${m} − ${d}) lowers ${n2}'s health.`, `<b>${r.text}</b>`],
        (r) => [PM(rng, 'Inside attack, whose name is name?', esc(n1), [{ text: esc(n2), concept: 'caller-vs-param' }], 'caller-vs-param', 'The object that calls the method.'), PN(`What is ${n2}'s health after the attack?`, h - (m - d), 'caller-vs-param', `${h} − (${m} − ${d}).`), PT('What is printed?', r.text, 'trace-calls', 'Follow the calls in order.')]);
    } },
    { c: ['trace-calls'], f(rng) {
      const x = rng.int(1, 9), a = rng.int(2, 5), b = rng.int(1, 9);
      const src = `public static int f(int n){\n  return n * ${a};\n}\npublic static int g(int n){\n  return n + ${b};\n}\nSystem.out.print(f(g(${x})) + " " + g(f(${x})));`;
      return textQ(null, src, (r) => ['The inner call runs first; its return value becomes the argument of the outer call.', `g(${x}) = ${x + b}, f(${x + b}) = ${(x + b) * a}.`, `f(${x}) = ${x * a}, g(${x * a}) = ${x * a + b}.`, `<b>${r.text}</b>`],
        [PN(`What is g(${x})?`, x + b, 'trace-calls', `${x} + ${b}.`), PN(`What is f(g(${x}))?`, (x + b) * a, 'trace-calls', 'Use the inner result.'), PN(`What is g(f(${x}))?`, x * a + b, 'trace-calls', 'Order matters.')]);
    } },
  ]);

  // =====================================================================
  // 1.11 Math class
  // =====================================================================
  gen('u1-math', 'The Math class', 'cs1-math', [
    { c: ['math-abs'], f(rng) {
      const n = rng.int(2, 30), d = rng.int(1, 9) + 0.5;
      const src = `System.out.print(Math.abs(-${n}) + " " + Math.abs(-${d}));`;
      return textQ(null, src, ['Math.abs is overloaded: an int argument returns an int, a double argument returns a double.', `<b>${n} ${d}</b>`],
        [PT(`What is Math.abs(-${n})?`, String(n), 'math-abs', 'int in, int out (no .0).'), PT(`What is Math.abs(-${d})?`, String(d), 'math-abs', 'double in, double out.')]);
    } },
    { c: ['math-pow'], f(rng) {
      const a = rng.int(2, 6), b = rng.int(2, 4);
      const cast = rng() < 0.4;
      const src = `System.out.print(${cast ? '(int)' : ''}Math.pow(${a}, ${b}));`;
      return textQ(null, src, (r) => ['Math.pow always returns a double.', cast ? 'The (int) cast turns it into an int.' : 'So it prints with .0.', `<b>${r.text}</b>`],
        (r) => [PM(rng, 'What type does Math.pow return?', 'double', [{ text: 'int', concept: 'math-pow' }, { text: 'the same type as the base', concept: 'math-pow' }], 'math-pow', 'Always double.'), PT('What is printed?', r.text, 'math-pow', `${a}^${b} = ${Math.pow(a, b)}.`)]);
    } },
    { c: ['math-sqrt-nan'], hard: true, f(rng) {
      const n = rng.pick([4, 9, 16, 25, 36]);
      const src = `System.out.print(Math.sqrt(${n}) + " " + Math.sqrt(-${n}));`;
      return textQ(null, src, (r) => [`Math.sqrt(${n}) is ${Math.sqrt(n)}.0 (a double).`, 'The square root of a negative number is NaN ("not a number"), a value, not an error.', `<b>${r.text}</b>`],
        (r) => [PYN(`Does Math.sqrt(-${n}) throw an error?`, false, 'math-sqrt-nan', 'It returns NaN.'), PT('What is printed?', r.text, 'math-sqrt-nan', 'sqrt always returns a double.')]);
    } },
    { c: ['math-minmax'], hard: true, f(rng) {
      const a = rng.int(1, 9), b = a + rng.int(1, 9);
      const form = rng.pick([`Math.min(${a}, ${b}.0)`, `Math.max(${a}, ${b})`, `Math.max(${a}.0, ${b})`, `Math.min(${a}, ${b})`]);
      const src = `System.out.print(${form});`;
      return textQ(null, src, (r) => ['Two ints call the int version and return an int.', 'If either argument is a double, the double version runs and returns a double.', `<b>${r.text}</b>`],
        (r) => [PM(rng, 'Which version runs?', form.includes('.0') ? '(double, double)' : '(int, int)', [{ text: form.includes('.0') ? '(int, int)' : '(double, double)', concept: 'math-minmax' }], 'math-minmax', 'One double argument means the double version.'), PT('What is printed?', r.text, 'math-minmax', form.includes('.0') ? 'The result is a double.' : 'The result is an int.')]);
    } },
    { c: ['max-of-three'], f(rng) {
      const [a, b, c] = [rng.int(1, 50), rng.int(1, 50), rng.int(1, 50)];
      const src = `int a = ${a}, b = ${b}, c = ${c};\nSystem.out.print(Math.max(a, Math.max(b, c)));`;
      return textQ(null, src, [`Math.max(b, c) = ${Math.max(b, c)}.`, `Math.max(a, ${Math.max(b, c)}) = ${Math.max(a, b, c)}.`, `<b>${Math.max(a, b, c)}</b>`],
        [PN('What is Math.max(b, c)?', Math.max(b, c), 'max-of-three', 'The inner call runs first.'), PT('What is printed?', String(Math.max(a, b, c)), 'max-of-three', 'The largest of the three.')]);
    } },
    { c: ['math-static'], f(rng) {
      return choiceQ(rng, 'How do you correctly call the square root method on a double <code>x</code>?', '<code>Math.sqrt(x)</code>', [
        { text: '<code>x.sqrt()</code>', concept: 'math-static' }, { text: '<code>new Math().sqrt(x)</code>', concept: 'math-static' }, { text: '<code>sqrt(x)</code>', concept: 'math-static' }],
      ['Math methods are static: call them on the class name Math.', 'You never create a Math object, and doubles have no methods.', '<b>Math.sqrt(x)</b>'],
      [PYN('Do you need to create a Math object?', false, 'math-static', 'Static methods are called on the class.'), PM(rng, 'Which is Java\'s power operator?', 'There is none: use Math.pow', [{ text: '^', concept: 'math-pow' }, { text: '**', concept: 'math-pow' }], 'math-pow', '^ is a different operator (exclusive or).')]);
    } },
  ]);

  gen('u1-random', 'Math.random', 'cs1-math', [
    { c: ['random-int'], f(rng) {
      const lo = rng.int(1, 10), hi = lo + rng.int(3, 12);
      return choiceQ(rng, `Which expression gives a random int from ${lo} to ${hi}, inclusive, with every value equally likely?`, `<code>(int)(Math.random() * ${hi - lo + 1}) + ${lo}</code>`, [
        { text: `<code>(int)(Math.random() * ${hi - lo}) + ${lo}</code>`, concept: 'random-int' }, { text: `<code>(int)Math.random() * ${hi - lo + 1} + ${lo}</code>`, concept: 'random-cast-bug' },
        { text: `<code>(int)(Math.random() * ${hi}) + ${lo}</code>`, concept: 'random-int' }, { text: `<code>Math.random() * ${hi - lo + 1} + ${lo}</code>`, concept: 'random-int' }],
      ['Use (int)(Math.random() * (max − min + 1)) + min.', `max − min + 1 = ${hi - lo + 1} possible values.`, 'The parentheses make the multiplication happen before the cast.', `<b>(int)(Math.random() * ${hi - lo + 1}) + ${lo}</b>`],
      [PN(`How many different values are there from ${lo} to ${hi} inclusive?`, hi - lo + 1, 'random-int', 'max − min + 1.'), PN('What is the smallest value the correct expression can give?', lo, 'random-range', 'Math.random() can be 0.0.')]);
    } },
    { c: ['random-cast-bug'], hard: true, f(rng) {
      const k = rng.int(4, 10);
      return choiceQ(rng, `What values can <code>(int)Math.random() * ${k} + 1</code> produce?`, 'Only 1', [
        { text: `1 to ${k}`, concept: 'random-cast-bug' }, { text: `0 to ${k - 1}`, concept: 'random-cast-bug' }, { text: `1 to ${k + 1}`, concept: 'random-int' }],
      ['The cast happens before *, so (int)Math.random() comes first.', 'Math.random() is always less than 1, so the cast always gives 0.', `0 * ${k} + 1 = <b>1</b>, every time.`],
      [PN('What is (int)Math.random() always equal to?', 0, 'random-cast-bug', 'A double from 0 up to (not including) 1 truncates to 0.'), PYN('Does the cast happen before the multiplication here?', true, 'cast-precedence', 'There are no parentheses around Math.random() * k.')]);
    } },
    { c: ['random-range'], f(rng) {
      return choiceQ(rng, 'What range of values can <code>Math.random()</code> return?', 'A double from 0.0 (inclusive) up to 1.0 (exclusive)', [
        { text: 'A double from 0.0 to 1.0, both inclusive', concept: 'random-range' }, { text: 'An int, either 0 or 1', concept: 'random-range' }, { text: 'A double from 1.0 to 10.0', concept: 'random-range' }],
      ['Math.random() returns a double.', 'It can be exactly 0.0, but never 1.0.', '<b>0.0 ≤ value < 1.0</b>'],
      [PYN('Can Math.random() return exactly 1.0?', false, 'random-range', '1.0 is excluded.'), PYN('Can it return exactly 0.0?', true, 'random-range', '0.0 is included.')]);
    } },
    { c: ['random-prob'], f(rng) {
      const p = rng.pick([0.3, 0.42, 0.75, 1.2, -0.1]);
      const prob = Math.max(0, Math.min(1, p));
      return { type: 'numeric', prompt: `What is the probability that <code>Math.random() &lt; ${p}</code> is true? (Answer as a decimal from 0 to 1.)`, answer: prob, absTol: 1e-9,
        steps: ['Math.random() is spread evenly from 0 up to 1.', 'So Math.random() < p is true with probability p.', p > 1 ? 'p > 1: always true.' : p < 0 ? 'p < 0: never true.' : '', `<b>${prob}</b>`].filter(Boolean),
        parts: [PYN('Is Math.random() always less than 1?', true, 'random-range', 'It never reaches 1.0.'), PN(`So what is P(Math.random() < ${p})?`, prob, 'random-prob', p > 1 ? 'Always true.' : p < 0 ? 'Never true.' : 'It equals p.')] };
    } },
  ]);

  gen('u1-math-more', 'Math round, floor, ceil, trig, log', 'cs1-math-more', [
    { c: ['math-round'], f(rng) {
      const x = (rng() < 0.5 ? -1 : 1) * (rng.int(1, 20) + rng.pick([0.2, 0.6, 0.8]));
      const src = `System.out.print(Math.round(${x}));`;
      return textQ(null, src, (r) => ['Math.round rounds to the nearest whole number and returns a whole number (no .0).', `<b>${r.text}</b>`],
        (r) => [PYN('Does Math.round return a value with .0?', false, 'math-round', 'It returns a whole-number type.'), PT('What is printed?', r.text, 'math-round', 'Nearest whole number (−4.6 → −5, −4.2 → −4).')]);
    } },
    { c: ['math-floor-ceil'], hard: true, f(rng) {
      const x = -(rng.int(1, 9) + rng.pick([0.3, 0.8])), fn = rng.pick(['floor', 'ceil']);
      const src = `System.out.print(Math.${fn}(${x}));`;
      return textQ(null, src, (r) => [fn === 'floor' ? 'floor goes DOWN to the next integer (more negative for negatives).' : 'ceil goes UP to the next integer (toward zero for negatives).', 'Both return a double.', `<b>${r.text}</b>`],
        (r) => [PM(rng, `What type does Math.${fn} return?`, 'double', [{ text: 'int', concept: 'math-floor-ceil' }], 'math-floor-ceil', 'They return doubles.'), PT('What is printed?', r.text, 'math-floor-ceil', fn === 'floor' ? 'Down: −5.3 → −6.0.' : 'Up: −5.8 → −5.0.')]);
    } },
    { c: ['math-trig-radians'], f(rng) {
      const deg = rng.pick([30, 45, 60, 90]);
      return choiceQ(rng, `Which expression gives the sine of ${deg} degrees?`, `<code>Math.sin(${deg} * Math.PI / 180)</code>`, [
        { text: `<code>Math.sin(${deg})</code>`, concept: 'math-trig-radians' }, { text: `<code>Math.sin(${deg} * 180 / Math.PI)</code>`, concept: 'math-trig-radians' }, { text: `<code>Math.sin(${deg}) * Math.PI / 180</code>`, concept: 'math-trig-radians' }],
      ['Math.sin, cos and tan work in radians.', 'Degrees × π / 180 converts to radians.', `<b>Math.sin(${deg} * Math.PI / 180)</b>`],
      [PYN(`Is Math.sin(${deg}) the sine of ${deg} degrees?`, false, 'math-trig-radians', `It is the sine of ${deg} radians.`), PM(rng, 'How do you convert radians to degrees?', 'Multiply by 180 / Math.PI', [{ text: 'Multiply by Math.PI / 180', concept: 'math-trig-radians' }], 'math-trig-radians', 'The reverse conversion.')]);
    } },
    { c: ['math-log'], hard: true, f(rng) {
      const src = rng.pick(['System.out.print(Math.ln(Math.E));', 'System.out.print(Math.log(Math.E));', 'System.out.print(Math.log10(1000));']);
      return outcomeQ(rng, null, src, [{ text: '1.0', concept: 'math-log' }, { text: '3.0', concept: 'math-log' }, { text: 'Compile error', concept: 'math-log' }, { text: '2.302585092994046', concept: 'math-log' }],
        (r) => ['Math.log is the natural log (base e); Math.log10 is base 10.', 'There is no Math.ln method.', `<b>${r.text}</b>`],
        (r) => [PYN('Does Math.ln exist?', false, 'math-log', 'Use Math.log for the natural log.'), PT('What is the result?', r.text, 'math-log', 'log(e) = 1.0, log10(1000) = 3.0.')]);
    } },
  ]);

  // =====================================================================
  // 1.12–1.14 Objects and aliases
  // =====================================================================
  const POKE = `public class Pokemon {\n  private String name;\n  private int health;\n  public Pokemon(String n, int h){\n    name = n;\n    health = h;\n  }\n  public void heal(int amount){\n    health += amount;\n  }\n  public int getHealth(){\n    return health;\n  }\n}\n`;
  gen('u1-objects', 'Objects and aliases', 'cs1-objects', [
    { c: ['aliases'], f(rng) {
      const [n1, n2] = rng.shuffle(NAMES).slice(0, 2), h1 = rng.int(10, 30), h2 = rng.int(10, 30), k = rng.int(2, 9);
      const src = `${POKE}Pokemon p1 = new Pokemon(${q(n1)}, ${h1});\nPokemon p2 = new Pokemon(${q(n2)}, ${h2});\nPokemon p3 = p1;\np3.heal(${k});\nSystem.out.print(p1.getHealth() + " " + p2.getHealth());`;
      return textQ(null, src, (r) => ['p3 = p1 does not copy the object: p1 and p3 now refer to the SAME object (aliases).', `p3.heal(${k}) changes that object, so p1 sees the change.`, `<b>${r.text}</b>`],
        (r) => [PYN('After Pokemon p3 = p1;, how many Pokemon objects exist: is it still 2?', true, 'aliases', 'Assigning a reference does not create a new object.'), PN("What is p1's health after p3.heal?", h1 + k, 'aliases', 'Same object.'), PT('What is printed?', r.text, 'aliases', 'p2 is a different object and is unchanged.')]);
    } },
    { c: ['object-equality', 'reference-variable'], f(rng) {
      const n = rng.pick(NAMES), h = rng.int(10, 30);
      const src = `${POKE}Pokemon a = new Pokemon(${q(n)}, ${h});\nPokemon b = new Pokemon(${q(n)}, ${h});\nPokemon c = a;\nSystem.out.print((a == b) + " " + (a == c));`;
      return textQ(null, src, ['== on objects asks: do both variables refer to the same object?', 'a and b are two separate objects (two news), even with identical attributes.', 'c is an alias of a.', '<b>false true</b>'],
        [PYN('Do a and b refer to the same object?', false, 'reference-variable', 'Each new creates a different object.'), PYN('Do a and c refer to the same object?', true, 'object-equality', 'c = a copies the reference.'), PT('What is printed?', 'false true', 'object-equality', '== compares identity, not attributes.')]);
    } },
    { c: ['private-access'], f(rng) {
      const src = `${POKE}Pokemon p = new Pokemon(${q(rng.pick(NAMES))}, ${rng.int(10, 30)});\nSystem.out.print(p.health);`;
      const h = src.match(/, (\d+)\);\nSystem/)[1];
      return outcomeQ(rng, 'This code is in a different class from Pokemon.', src, [{ text: h, concept: 'private-access' }, { text: '0', concept: 'private-access' }, { text: 'NullPointerException', concept: 'private-access' }],
        ['health is private, so only code inside Pokemon can use it.', 'From another class, use the public getter getHealth().', '<b>Compile error</b>: health has private access.'],
        [PYN('Can another class read a private attribute directly?', false, 'private-access', 'Private means only inside the class.'), PM(rng, 'How should the other class get the health?', '<code>p.getHealth()</code>', [{ text: '<code>Pokemon.health</code>', concept: 'private-access' }, { text: '<code>p.health()</code>', concept: 'private-access' }], 'private-access', 'Use the public getter.')]);
    } },
    { c: ['new-keyword', 'class-vs-object'], f(rng) {
      const n = rng.pick(NAMES);
      return choiceQ(rng, `What does <code>new Pokemon("${n}", 20)</code> do?`, 'Creates a new Pokemon object by running the constructor that matches (String, int)', [
        { text: 'Creates the Pokemon class', concept: 'class-vs-object' }, { text: 'Changes the attributes of every Pokemon', concept: 'class-vs-object' }, { text: 'Calls a method named new', concept: 'new-keyword' }],
      ['The class is the blueprint; new builds an object (instance) from it.', 'The constructor whose parameters match the arguments runs.', '<b>It creates a new object.</b>'],
      [PM(rng, 'Which is the blueprint?', 'The class', [{ text: 'The object', concept: 'class-vs-object' }, { text: 'The constructor', concept: 'class-vs-object' }], 'class-vs-object', 'Objects are made from the class.'), PN('If new Pokemon(...) runs 3 times, how many objects exist?', 3, 'new-keyword', 'Each new makes one object.')]);
    } },
  ]);

  // =====================================================================
  // 1.15 Strings
  // =====================================================================
  const cut = (s, max) => (s.length > max ? s.slice(0, max) : s);
  gen('u1-substring', 'substring and length', 'cs1-strings', [
    { c: ['substring-two'], f(rng) {
      const s = rng.pick(PHRASES), a = rng.int(0, s.length - 3), b = rng.int(a + 1, s.length);
      const src = `String s = ${q(s)};\nSystem.out.print("[" + s.substring(${a}, ${b}) + "]");`;
      return textQ('What does this code print? (The brackets show any spaces at the ends.)', src, (r) => [`substring(${a}, ${b}) starts at index ${a} (included) and stops before index ${b} (excluded).`, `That is ${b - a} characters.`, `<b>${esc(r.text)}</b>`],
        (r) => [PN('How many characters does it return?', b - a, 'substring-two', 'to − from.'), PT(`What character is at index ${a}?`, s.charAt(a) === ' ' ? 'space' : s.charAt(a), 'string-index', 'Indices start at 0.', s.charAt(a) === ' ' ? [' ', '" "'] : undefined), PT('What is printed?', r.text, 'substring-two', 'The end index is exclusive.')]);
    } },
    { c: ['substring-one'], hard: true, f(rng) {
      const s = rng.pick(PHRASES), a = rng.pick([s.length, s.length - 1, rng.int(1, s.length - 2)]);
      const src = `String s = ${q(s)};\nSystem.out.print("[" + s.substring(${a}) + "]");`;
      return textQ('What does this code print? (The brackets show any spaces.)', src, (r) => [`s.length() is ${s.length}.`, a === s.length ? 'substring(length()) is the empty String, not an error.' : `substring(${a}) goes from index ${a} to the end.`, `<b>${esc(r.text)}</b>`],
        (r) => [PN('What is s.length()?', s.length, 'string-length', 'Count every character, including spaces.'), PYN(`Is substring(${a}) an error?`, false, 'substring-one', 'An index equal to the length is still allowed.'), PT('What is printed?', r.text, 'substring-one', 'From the index to the end.')]);
    } },
    { c: ['substring-bounds'], hard: true, f(rng) {
      const s = rng.pick(PHRASES);
      const call = rng.pick([`s.substring(${s.length + 1})`, `s.substring(-1, 3)`, `s.substring(5, 3)`, `s.substring(2, ${s.length + 2})`]);
      const src = `String s = ${q(s)};\nSystem.out.print(s.substring(0, 2));\nSystem.out.print(${call});`;
      const res = R(src);
      return choiceQ(rng, `What happens?${code(src)}`, esc(`${s.slice(0, 2)} is printed, then a StringIndexOutOfBoundsException`), [
        { text: esc(`${s.slice(0, 2)}${s.slice(2)}`), concept: 'substring-bounds' }, { text: esc('Compile error'), concept: 'compiler-no-values' },
        { text: esc('StringIndexOutOfBoundsException before anything prints'), concept: 'statements-before-crash' }],
        [`s.length() is ${s.length}.`, `${esc(call)} uses an index that is negative, past the length, or a start after the end.`, 'That throws StringIndexOutOfBoundsException at run time, after line 2 already printed.', `<b>${esc(res.text)}</b>`],
        [PN('What is s.length()?', s.length, 'string-length', 'Count all characters.'), PYN(`Is ${call} legal at run time?`, false, 'substring-bounds', 'Indices must satisfy 0 <= from <= to <= length.'), PYN('Does line 2 print before the crash?', true, 'statements-before-crash', 'Lines before a runtime error run.')]);
    } },
    { c: ['single-char', 'string-index'], f(rng) {
      const s = rng.pick(PHRASES), last = rng() < 0.5, i = last ? s.length - 1 : rng.int(0, s.length - 2);
      const expr = last ? 's.substring(s.length() - 1)' : `s.substring(${i}, ${i + 1})`;
      const src = `String s = ${q(s)};\nSystem.out.print("[" + ${expr} + "]");`;
      return textQ('What does this code print? (Brackets show spaces.)', src, (r) => [last ? `s.length() − 1 = ${s.length - 1}, the index of the last character.` : `substring(i, i + 1) is the one character at index ${i}.`, `<b>${esc(r.text)}</b>`],
        (r) => [PN(last ? 'What is the index of the last character?' : `Which index is read?`, last ? s.length - 1 : i, 'string-index', 'Indices go from 0 to length() − 1.'), PT('What is printed?', r.text, 'single-char', 'One character.')]);
    } },
    { c: ['string-length'], f(rng) {
      const s = rng.pick(PHRASES);
      const src = `String s = ${q(s)};\nSystem.out.print(s.length());`;
      return { type: 'numeric', prompt: `What does this print?${code(src)}`, answer: s.length,
        steps: ['length() counts every character, including spaces and punctuation.', `<b>${s.length}</b>`],
        parts: [PYN('Do spaces count?', true, 'string-length', 'Every character counts.'), PN('What is the index of the last character?', s.length - 1, 'string-index', 'length() − 1.'), PN('What is s.length()?', s.length, 'string-length', 'Count them all.')] };
    } },
  ]);

  gen('u1-indexof', 'indexOf and contains', 'cs1-strings', [
    { c: ['indexof'], f(rng) {
      const s = rng.pick(PHRASES), t = rng.pick([...new Set(s.replace(/ /g, '').split(''))].concat(['z', 'q']));
      const src = `String s = ${q(s)};\nSystem.out.print(s.indexOf(${q(t)}));`;
      return textQ(null, src, (r) => ['indexOf returns the index of the FIRST match, or −1 if it is not there.', 'Java is case sensitive.', `<b>${r.text}</b>`],
        (r) => [PYN(`Is "${t}" in the String?`, s.includes(t), 'indexof', 'Case matters.'), PT('What is printed?', r.text, 'indexof', 'First match, or −1.')]);
    } },
    { c: ['indexof-from'], f(rng) {
      const s = rng.pick(['Mississippi River', 'The Legend of Zelda', 'I am Iron Man!', 'Hermione Granger']);
      const t = rng.pick(s.split('').filter((ch2, i, arr) => arr.indexOf(ch2) !== arr.lastIndexOf(ch2) && ch2 !== ' '));
      const from = rng.int(1, s.length - 2);
      const src = `String s = ${q(s)};\nSystem.out.print(s.indexOf(${q(t)}) + " " + s.indexOf(${q(t)}, ${from}));`;
      return textQ(null, src, (r) => [`indexOf("${t}") searches from the start.`, `indexOf("${t}", ${from}) starts searching at index ${from} (included).`, `<b>${r.text}</b>`],
        (r) => [PN(`What is s.indexOf("${t}")?`, s.indexOf(t), 'indexof', 'First match.'), PN(`What is s.indexOf("${t}", ${from})?`, s.indexOf(t, from), 'indexof-from', `First match at or after index ${from}.`)]);
    } },
    { c: ['substring-indexof-neg'], hard: true, f(rng) {
      const s = rng.pick(PHRASES), t = rng.pick(['x', 'z', 'Q']);
      const src = `String s = ${q(s)};\nSystem.out.print(s.substring(s.indexOf(${q(t)})));`;
      return outcomeQ(rng, null, src, [{ text: s, concept: 'substring-indexof-neg' }, { text: s.slice(-1), concept: 'substring-indexof-neg' }, { text: '-1', concept: 'indexof' }, { text: 'Compile error', concept: 'compiler-no-values' }],
        [`"${t}" is not in the String, so indexOf returns −1.`, 's.substring(−1) is out of bounds.', '<b>StringIndexOutOfBoundsException</b>'],
        [PN(`What does s.indexOf("${t}") return?`, -1, 'indexof', 'Not found means −1.'), PT('What happens?', 'StringIndexOutOfBoundsException', 'substring-indexof-neg', 'A negative index always throws.')]);
    } },
    { c: ['contains'], f(rng) {
      const s = rng.pick(PHRASES), t = rng.pick([s.slice(1, 3), s.slice(-3), 'oh', 'xyz', s.slice(0, 2).toLowerCase()]);
      const src = `String s = ${q(s)};\nSystem.out.print(s.contains(${q(t)}) + " " + (s.indexOf(${q(t)}) >= 0));`;
      return textQ(null, src, (r) => ['s.contains(t) is the same as s.indexOf(t) >= 0.', 'Case matters.', `<b>${r.text}</b>`],
        (r) => [PYN('Do the two expressions always give the same answer?', true, 'contains', 'contains is indexOf(t) >= 0.'), PT('What is printed?', r.text, 'contains', s.includes(t) ? `"${t}" appears in s.` : `"${t}" does not appear (case matters).`)]);
    } },
  ]);

  gen('u1-compare', 'equals and compareTo', 'cs1-strings', [
    { c: ['compareto'], f(rng) {
      const pairs = [['Who Killed Thanos?', 'Ant Man killed him!'], ['Batman', 'Robin'], ['apple', 'banana'], ['Zelda', 'Link'], ['cat', 'car'], ['Iron', 'Ice']];
      const [a, b] = rng.pick(pairs);
      const sw = rng() < 0.5;
      const [x, y] = sw ? [b, a] : [a, b];
      const src = `System.out.print(${q(x)}.compareTo(${q(y)}));`;
      return textQ(null, src, (r) => ['compareTo finds the first position where the Strings differ.', 'It returns (that character of the caller) − (that character of the argument).', `<b>${r.text}</b>`],
        (r) => [PYN(`Does "${x}" come before "${y}" alphabetically (by character codes)?`, Number(r.text) < 0, 'compareto', 'Negative means the caller comes first.'), PT('What is printed?', r.text, 'compareto', 'The difference of the first different characters.')]);
    } },
    { c: ['compareto-prefix'], hard: true, f(rng) {
      const w = rng.pick(['pear', 'cat', 'sun', 'Bat', 'star']), ext = rng.pick(['l', 'ch', 's', 'man']);
      const sw = rng() < 0.5, x = sw ? w + ext : w, y = sw ? w : w + ext;
      const src = `System.out.print(${q(x)}.compareTo(${q(y)}));`;
      return textQ(null, src, (r) => ['Every character of the shorter String matches the start of the longer one.', 'Then compareTo returns the difference in length; the shorter one comes first.', `<b>${r.text}</b>`],
        (r) => [PYN(`Is the result negative?`, Number(r.text) < 0, 'compareto-prefix', `"${w}" comes before "${w + ext}".`), PT('What is printed?', r.text, 'compareto-prefix', 'Length of caller − length of argument.')]);
    } },
    { c: ['equals-case'], f(rng) {
      const s = rng.pick(['Batman', 'Iron Man', 'Zelda', 'John Cena']), t = rng.pick([s.toLowerCase(), s, s + ' ', s.toUpperCase()]);
      const src = `String a = ${q(s)};\nString b = ${q(t)};\nSystem.out.print(a.equals(b));`;
      return textQ(null, src, (r) => ['equals is true only if every character matches exactly.', 'Case and extra spaces count.', `<b>${r.text}</b>`],
        (r) => [PYN('Does equals ignore capital letters?', false, 'equals-case', 'Java is case sensitive.'), PT('What is printed?', r.text, 'equals-case', s === t ? 'They match exactly.' : 'They differ.')]);
    } },
    { c: ['equals-vs-eq'], f(rng) {
      return choiceQ(rng, 'To check whether two Strings <code>s1</code> and <code>s2</code> contain the same characters, you should use:', '<code>s1.equals(s2)</code>', [
        { text: '<code>s1 == s2</code>', concept: 'equals-vs-eq' }, { text: '<code>s1.compareTo(s2) &gt; 0</code>', concept: 'compareto' }, { text: '<code>s1.indexOf(s2)</code>', concept: 'indexof' }],
      ['== on objects checks whether they are the same object.', 'equals compares the characters.', '<b>s1.equals(s2)</b>'],
      [PYN('Does == compare the characters of two Strings?', false, 'equals-vs-eq', 'It compares identity.'), PN('What does s1.compareTo(s2) return when they match?', 0, 'compareto', 'Equal Strings compare to 0.')]);
    } },
  ]);

  // =====================================================================
  // 1.15 Concatenation, escapes, toString
  // =====================================================================
  gen('u1-concat', 'String concatenation', 'cs1-concat', [
    { c: ['concat-left-right'], f(rng) {
      const a = rng.int(1, 9), b = rng.int(1, 9), w = rng.pick(['John Cena ', 'Score: ', 'x']);
      const form = rng.pick([`${q(w)} + ${a} + ${b}`, `${a} + ${b} + ${q(w)}`, `${a} + ${b} + ${q(w)} + ${a} + ${b}`]);
      const src = `System.out.print(${form});`;
      return textQ(null, src, (r) => ['+ goes left to right.', 'int + int adds; once a String is involved, + concatenates.', `<b>${esc(r.text)}</b>`],
        (r) => [PM(rng, `What is the first + doing?`, form.startsWith('"') ? 'Concatenation' : 'Addition', [{ text: form.startsWith('"') ? 'Addition' : 'Concatenation', concept: 'concat-left-right' }], 'concat-left-right', 'Look at the two operands of the leftmost +.'), PT('What is printed?', r.text, 'concat-left-right', 'Left to right.')]);
    } },
    { c: ['concat-parens'], f(rng) {
      const a = rng.int(2, 9), b = rng.int(2, 9);
      const form = rng.pick([`"x" + (${a} + ${b})`, `"x" + ${a} * ${b}`, `"x" + ${a} + ${b}`]);
      const src = `System.out.print(${form});`;
      return textQ(null, src, (r) => ['Parentheses and * happen before +.', `<b>${r.text}</b>`],
        (r) => [PYN('Is any arithmetic done before concatenating?', !form.endsWith(`${a} + ${b}`) || form.includes('('), 'concat-parens', 'Parentheses or * run first.'), PT('What is printed?', r.text, 'concat-parens', 'Then concatenate.')]);
    } },
    { c: ['concat-compound'], hard: true, f(rng) {
      const a = rng.int(1, 9), b = rng.int(1, 9);
      const src = `String s = "A";\ns += "B" + ${a} + ${b};\ns += ${a} + ${b};\nSystem.out.print(s);`;
      return textQ(null, src, (r) => ['s += expr means s = s + (expr): the whole right side is built first.', `"B" + ${a} + ${b} is "B${a}${b}" (left to right).`, `${a} + ${b} is ${a + b} (both ints) before it is added to s.`, `<b>${r.text}</b>`],
        [PT('What is s after line 2?', `AB${a}${b}`, 'concat-left-right', 'String first, so every + concatenates.'), PT(`What is ${a} + ${b} on line 3?`, String(a + b), 'concat-compound', 'The right side is evaluated first, and it is int + int.'), PT('What is printed?', `AB${a}${b}${a + b}`, 'concat-compound', 'Then it is appended.')]);
    } },
    { c: ['string-immutable'], hard: true, f(rng) {
      const s = rng.pick(['Batman', 'Zelda', 'Hermione']);
      const src = `String s = ${q(s)};\ns.substring(${rng.int(1, 3)});\nSystem.out.print(s);`;
      return textQ(null, src, ['String methods never change the String; substring returns a NEW String.', 'That new String is not stored, so it is thrown away.', `<b>${s}</b>`],
        [PYN('Does s.substring(...) change s?', false, 'string-immutable', 'Strings are immutable.'), PT('What is printed?', s, 'string-immutable', 'Use s = s.substring(...); to keep the result.')]);
    } },
    { c: ['tostring-implicit'], f(rng) {
      const n = rng.pick(NAMES), h = rng.int(10, 40);
      const src = `public class Mon {\n  private String name;\n  private int hp;\n  public Mon(String n, int h){ name = n; hp = h; }\n  public String toString(){\n    return name + " " + hp + "/" + hp;\n  }\n}\nMon m = new Mon(${q(n)}, ${h});\nSystem.out.print("hello " + m + " world");`;
      return textQ(null, src, ['Concatenating an object with a String calls its toString() automatically.', `toString returns "${n} ${h}/${h}".`, `<b>hello ${n} ${h}/${h} world</b>`],
        [PYN('Is toString() called even though the code never writes m.toString()?', true, 'tostring-implicit', 'Printing or concatenating calls it for you.'), PT('What does toString return?', `${n} ${h}/${h}`, 'tostring-implicit', 'name + " " + hp + "/" + hp.'), PT('What is printed?', `hello ${n} ${h}/${h} world`, 'tostring-implicit', 'Then concatenate.')]);
    } },
    { c: ['escape-seq'], f(rng) {
      const v = rng.pick([
        ['System.out.print("Batman\\nRobin");', 'Batman / Robin', '\\n starts a new line.'],
        ['System.out.print("He said \\"hi\\"");', 'He said "hi"', '\\" is a quote character inside the String.'],
        ['System.out.print("C:\\\\new");', 'C:\\new', '\\\\ is one backslash, so the n after it is a plain n.'],
        ['System.out.print("type \\\\n\\nnext");', 'type \\n / next', '\\\\ is a backslash, then n; then \\n is a new line.'],
      ]);
      return textQ(null, v[0], (r) => [v[2], `<b>${esc(r.text)}</b>`],
        (r) => [PM(rng, 'What does \\n mean inside a String?', 'A new line', [{ text: 'A backslash and an n', concept: 'escape-seq' }, { text: 'A tab', concept: 'escape-seq' }], 'escape-seq', '\\n is the newline escape.'), PT('What is printed?', r.text, 'escape-seq', v[2])]);
    } },
  ]);

  // =====================================================================
  // Modular arithmetic design
  // =====================================================================
  gen('u1-modular', 'Modular arithmetic design', 'cs1-modular', [
    { c: ['mod-cycle'], f(rng) {
      const n = 5, start = rng.int(0, 4), step = rng.int(1, 4);
      const lines = [`int counter = ${start};`, `int step = ${step};`];
      for (let i = 0; i < 5; i++) lines.push('System.out.print(counter + " ");', `counter = (counter + step) % ${n};`);
      const src = lines.join('\n');
      return textQ(null, src, (r) => [`counter starts at ${start}, adds ${step} each time, and % ${n} wraps it back into 0 to ${n - 1}.`, `<b>${r.text}</b>`],
        (r) => [PN('What is counter after the first update?', (start + step) % n, 'mod-cycle', `(${start} + ${step}) % ${n}.`), PT('What is printed?', r.text, 'mod-cycle', 'Keep adding and wrapping.')]);
    } },
    { c: ['mod-prime-step'], hard: true, f(rng) {
      const n = rng.pick([6, 8, 9, 10]);
      const gcd = (a, b) => (b ? gcd(b, a % b) : a);
      const good = [], bad = [];
      for (let s = 1; s < n; s++) (gcd(s, n) === 1 ? good : bad).push(s);
      const right = rng.pick(good.filter((s) => s !== 1));
      return choiceQ(rng, `counter = (counter + step) % ${n} is repeated ${n} times, starting at 0. Which step visits every value 0 to ${n - 1} exactly once?`, String(right),
        rng.shuffle(bad).map((s) => ({ text: String(s), concept: 'mod-prime-step' })).concat([{ text: String(n), concept: 'mod-cycle' }, { text: 'Every step from 1 to ' + (n - 1), concept: 'mod-prime-step' }]),
        ['A step visits every value only if it shares no factor with n.', `${n} is not prime, so steps sharing a factor with ${n} get stuck in a smaller cycle.`, `<b>${right}</b>`],
        [PN(`Starting at 0 with step ${bad[bad.length - 1]}, what value comes after 0?`, bad[bad.length - 1] % n, 'mod-cycle', '(0 + step) % n.'), PYN(`Is ${n} prime?`, false, 'mod-prime-step', `With a prime n (like 5), every step 1 to n − 1 works.`)]);
    } },
  ]);
})();
