// Problem bank for AP CSA Unit 2: Selection and Iteration. Registers generators with PRProblems
// (see the format in problems-core.js). Every code answer comes from running the code in JavaLite,
// so it is always what Java really prints. Every problem also carries `parts`: the same question
// broken into its individual steps, each tagged with one concept, for solo learn mode.
(function () {
  'use strict';
  const { esc, code, c, run, mc, oneLine } = PRProblems.helpers;
  const J = window.JavaLite;
  const tf = (b) => (b ? 'true' : 'false');
  const B = (s) => `<b>${s}</b>`;

  // ---------- running Java ----------
  // What the snippet prints; the bank's own snippets must run cleanly.
  function printed(src, opts) {
    const r = J.run(src, opts);
    if (r.error) throw new Error(`bank snippet failed (${r.error.message}):\n${src}`);
    return r.output;
  }
  // What a student should answer: the output on one line, or "Compile error" / the exception name.
  // Trailing spaces on each line are dropped (answers compare whitespace-insensitively anyway).
  const tidy = (s) => oneLine(String(s).split('\n').map((l) => l.replace(/\s+$/, '')).join('\n'));
  const result = (src, opts) => tidy(run(src, opts).text);
  // Value of a boolean/number expression with variables { a: ['int', 4] }.
  function ev(expr, vars) {
    const x = J.evalExpr(expr, vars || {});
    if (x.error) throw new Error(`bank expression failed: ${expr}`);
    return x.value;
  }
  const compiles = (src) => { const r = J.run(src, { maxSteps: 2000 }); return !(r.error && r.error.kind === 'compile'); };
  // How many times the condition on `line` was checked and came out true / in total.
  function condCounts(src, line) {
    const t = J.run(src, { trace: true }).trace;
    const at = t.filter((s) => s.line === line && s.cond !== undefined);
    return { yes: at.filter((s) => s.cond).length, all: at.length };
  }
  // A short trace table for the explanation: line, what happened, variables that changed.
  function traceHTML(src, maxRows = 14) {
    const t = J.run(src, { trace: true, maxSteps: 4000 }).trace;
    let prev = {};
    const rows = [];
    for (const s of t) {
      if (rows.length >= maxRows) { rows.push('<tr><td colspan="2" class="muted">… and so on</td></tr>'); break; }
      const now = {};
      s.vars.forEach(([n, , v]) => { now[n] = v; });
      const changed = Object.keys(now).filter((k) => now[k] !== prev[k]).map((k) => `${esc(k)} = ${esc(now[k])}`);
      prev = now;
      const what = s.error ? `<span class="err">${esc(s.error.name)}</span>` : s.cond !== undefined ? `condition is <b>${s.cond}</b>` : s.ret !== undefined ? `return ${esc(s.ret)}` : changed.join(', ') || '—';
      rows.push(`<tr><td class="mono">line ${s.line}</td><td>${what}</td></tr>`);
    }
    return `<div class="tr-label">Trace</div><table class="trace-mini">${rows.join('')}</table>`;
  }

  // ---------- parts ----------
  const P = {
    text: (q, answer, concept, why, extra) => Object.assign({ q, type: 'text', answer: String(answer), concept, why }, extra || {}),
    num: (q, answer, concept, why) => ({ q, type: 'numeric', answer: Number(answer), concept, why }),
    tf: (q, val, concept, why) => ({ q, type: 'mc', choices: ['true', 'false'], correct: val ? 0 : 1, concept, why }),
    yn: (q, val, concept, why) => ({ q, type: 'mc', choices: ['Yes', 'No'], correct: val ? 0 : 1, concept, why }),
    pick: (q, choices, correct, concept, why) => ({ q, type: 'mc', choices, correct, concept, why }),
    mc: (rng, q, correct, wrongs, concept, why) => Object.assign({ q, type: 'mc', concept, why }, mc(rng, correct, wrongs)),
  };
  // Text answer box hint for true/false/compile-error style questions.
  const HINT_BOOL = 'Type true, false, or Compile error.';
  const HINT_OUT = 'Type exactly what is printed (separate lines with /). If it crashes, type the exception name, e.g. ArithmeticException.';

  // ---------- variants ----------
  // A generator is a list of variants { c: [concepts], hard, f(rng) }. Learn mode's target picks a
  // variant whose trap is that concept; hard picks the nastiest ones.
  function choose(rng, opts, variants) {
    if (opts && opts.target) { const v = variants.filter((x) => x.c.includes(opts.target)); if (v.length) return rng.pick(v); }
    if (opts && opts.hard) { const v = variants.filter((x) => x.hard); if (v.length) return rng.pick(v); }
    return rng.pick(variants);
  }
  function gen(id, topic, lesson, variants) {
    PRProblems.register({
      id, unit: 2, topic, lesson,
      concepts: [...new Set(variants.flatMap((v) => v.c))],
      make(rng, opts) {
        const v = choose(rng, opts, variants);
        const p = v.f(rng, opts || {});
        if (!p.concepts) p.concepts = v.c.slice();
        return p;
      },
    });
  }

  // =====================================================================
  // 2.3 if statements
  // =====================================================================
  function ifTrace(rng, kind) {
    let a = rng.int(1, 5), b = rng.int(1, 6);
    // for the precedence trap, pick values where a + b % 2 and (a + b) % 2 disagree
    for (let t = 0; kind === 'mod' && t < 20 && (a + (b % 2) === 0) === ((a + b) % 2 === 0); t++) { a = rng.int(1, 5); b = rng.int(1, 6); }
    const cc = rng.int(2, 9), k = rng.int(2, 5);
    const cond1 = kind === 'mod' ? 'a + b % 2 == 0' : '(a + b) % 2 == 0';
    const L = [
      `int a = ${a}, b = ${b}, c = ${cc};`,
      `if(${cond1}){`, '  a++;', `  b *= ${k};`, '}',
      'if(b <= c){', '  b -= 2;', '  c += a + b;', '}',
      'if(2*a < c)', '  c *= a + b;'];
    if (kind === 'braces') L.push('  a += 10;');
    L.push('System.out.print(a + " " + b + " " + c);');
    const src = L.join('\n');
    const ans = printed(src);
    const c1 = ev(cond1, { a: ['int', a], b: ['int', b] }) === 'true';
    const first9 = L.slice(0, 9).join('\n');
    const bAfter = printed(`${first9}\nSystem.out.print(b);`);
    const c3 = printed(`${first9}\nSystem.out.print(2*a < c);`) === 'true';
    let alt = '';
    if (kind === 'mod') alt = printed(src.replace('a + b % 2 == 0', '(a + b) % 2 == 0'));
    const parts = [
      P.tf(`Is the first condition ${c(cond1)} true or false? (a = ${a}, b = ${b})`, c1, kind === 'mod' ? 'mod-vs-plus' : 'sequential-ifs',
        kind === 'mod' ? `% happens before +, so it is a + (b % 2) = ${a} + ${b % 2} = ${a + (b % 2)}, which is compared to 0.` : `(${a} + ${b}) % 2 = ${(a + b) % 2}.`),
      P.text('What is b right after the second if statement (line 9)?', bAfter, 'sequential-ifs', 'Each if is checked with the values as they are at that moment, so the first if may change b before the second one asks b &lt;= c.'),
    ];
    if (kind === 'braces') parts.push(P.yn(`Does ${c('a += 10;')} belong to the last if?`, false, 'if-braces', 'Without braces only the next single statement (c *= a + b;) belongs to the if. Indentation means nothing to Java, so a += 10 always runs.'));
    else parts.push(P.tf(`Is the last condition ${c('2*a < c')} true when Java reaches it?`, c3, 'sequential-ifs', 'Use the values after the first two ifs.'));
    parts.push(P.text('Final output', ans, kind === 'braces' ? 'if-braces' : kind === 'mod' ? 'mod-vs-plus' : 'sequential-ifs', 'Trace each statement in order.'));
    return {
      type: 'text', prompt: `What does this code print?${code(src)}`, answer: ans, placeholder: 'e.g. 2 15 4',
      explainHTML: traceHTML(src),
      steps: [
        `First condition ${c(cond1)} is ${B(tf(c1))}${kind === 'mod' ? ' (% before +)' : ''}.`,
        `After the second if, b is ${B(bAfter)}.`,
        kind === 'braces' ? `${c('a += 10;')} is not inside the last if (no braces), so it always runs.` : `The last condition is ${B(tf(c3))}.`,
        alt && alt !== ans ? `If you misread it you would get ${esc(alt)}.` : 'Each if is an independent question.',
        `Output: ${B(esc(ans))}`,
      ],
      parts,
    };
  }
  gen('u2-if-trace', 'Tracing if statements', 'cs2-if', [
    { c: ['sequential-ifs', 'if-braces'], f: (r) => ifTrace(r, 'plain') },
    { c: ['mod-vs-plus', 'sequential-ifs'], hard: true, f: (r) => ifTrace(r, 'mod') },
    { c: ['if-braces', 'sequential-ifs'], hard: true, f: (r) => ifTrace(r, 'braces') },
  ]);

  gen('u2-if-compiles', 'Which if statements compile?', 'cs2-if', [
    { c: ['if-boolean', 'not-op'], f: ifCompiles },
    { c: ['not-op', 'if-boolean'], hard: true, f: ifCompiles },
  ]);
  function ifCompiles(rng) {
    const items = [
      ['if(b)', null], ['if(a > 5)', null], ['if(!b)', 'not-op'], ['if(!(a > 5))', 'not-op'], ['if(a == 5)', null], ['if(b == false)', null],
      ['if(a)', 'if-boolean'], ['if(!a)', 'not-op'], ['if(a = 5)', 'if-boolean'], ['if(b > false)', 'relational-numeric'], ['if(a + 1)', 'if-boolean'],
    ].map(([s, cpt]) => ({ s, cpt, ok: compiles(`int a = 3; boolean b = true;\n${s}\n  a++;`) }));
    const good = items.filter((x) => x.ok), bad = items.filter((x) => !x.ok);
    const askBad = rng() < 0.5;
    const right = askBad ? rng.pick(bad) : rng.pick(good);
    const wrongPool = rng.shuffle(askBad ? good : bad);
    const m = mc(rng, c(right.s), wrongPool.map((x) => ({ text: c(x.s), concept: askBad ? (x.s.includes('!') ? 'not-op' : 'if-boolean') : x.cpt })));
    const x1 = rng.pick(items), x2 = rng.pick(items.filter((x) => x !== x1));
    const why = (x) => (x.ok ? `${esc(x.s)} compiles: the condition is a boolean.` : `${esc(x.s)} does not compile: ${x.s.includes('!a') ? '! only works on booleans' : x.s.includes('>') ? '> only compares numbers' : 'the condition is an int, not a boolean'}.`);
    return Object.assign({
      type: 'mc', prompt: `Let ${c('a')} be an ${c('int')} and ${c('b')} be a ${c('boolean')}. Which of these ${askBad ? B('does NOT compile') : B('compiles')}?`,
      steps: ['An if condition must be a boolean.', `${c('!')} can only go in front of a boolean.`, `${c('<, >, <=, >=')} only compare numbers.`, `Answer: ${B(c(right.s))}`],
      parts: [
        P.yn(`Does ${c(x1.s)} compile?`, x1.ok, x1.ok ? 'if-boolean' : x1.cpt || 'if-boolean', why(x1)),
        P.yn(`Does ${c(x2.s)} compile?`, x2.ok, x2.ok ? 'if-boolean' : x2.cpt || 'if-boolean', why(x2)),
        P.pick(`Which ${askBad ? 'does NOT compile' : 'compiles'}?`, m.choices, m.correct, askBad ? (right.cpt || 'if-boolean') : 'if-boolean', why(right)),
      ],
    }, m);
  }

  gen('u2-pyth-swap', 'Swapping inside an if', 'cs2-if', [
    { c: ['if-swap'], f: (r) => pyth(r, 'swap') },
    { c: ['if-swap', 'sequential-ifs'], hard: true, f: (r) => pyth(r, 'broken') },
  ]);
  function pyth(rng, kind) {
    const tri = rng.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [4, 5, 6], [2, 3, 4]]);
    const args = rng.shuffle(tri);
    const sw = (x) => (kind === 'swap' ? [`    int temp = ${x};`, `    ${x} = c;`, '    c = temp;'] : [`    ${x} = c;`, `    c = ${x};`]);
    const src = ['public static boolean isPythTrip(int a, int b, int c){', '  if(a > c){', ...sw('a'), '  }', '  if(b > c){', ...sw('b'), '  }',
      '  return a*a + b*b == c*c;', '}', `System.out.print(isPythTrip(${args.join(', ')}));`].join('\n');
    const ans = printed(src);
    const cAfter = printed(`int a = ${args[0]}, b = ${args[1]}, c = ${args[2]};\nif(a > c){\n${sw('a').join('\n')}\n}\nSystem.out.print(c);`);
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans, hint: HINT_BOOL,
      steps: [`Start: a = ${args[0]}, b = ${args[1]}, c = ${args[2]}.`, kind === 'swap' ? 'A swap needs a temp variable; then c holds the larger value.' : `${c('a = c; c = a;')} is not a swap: both end up with c's old value.`, `After the first if, c is ${B(cAfter)}.`, `Returns ${B(ans)}`],
      parts: [
        P.text('What is c after the first if statement?', cAfter, 'if-swap', kind === 'swap' ? 'temp keeps the old a, so the values trade places.' : 'a = c copies c into a, then c = a copies that same value back: nothing is swapped.'),
        P.text('What is printed?', ans, 'if-swap', 'Check a*a + b*b == c*c with the final values.'),
      ],
    };
  }

  // =====================================================================
  // 2.3 if-else
  // =====================================================================
  gen('u2-if-else-once', 'if-else: exactly one branch', 'cs2-if-else', [
    { c: ['else-checked-once', 'if-else-one'], hard: true, f: (r) => elseOnce(r, true) },
    { c: ['separate-if-bug', 'sequential-ifs'], f: (r) => elseOnce(r, false) },
    { c: ['separate-if-bug', 'if-else-one'], f: water },
  ]);
  function elseOnce(rng, useElse) {
    const v = rng.int(2, 9), d = rng.pick([1, 2, 3, -1]);
    const [w1, w2] = rng.pick([['hello', 'world'], ['ping', 'pong'], ['up', 'down'], ['yes', 'no']]);
    const src = `int x = ${v};\nif(x == ${v}){\n  x += ${d};\n  System.out.print("${w1} ");\n}\n${useElse ? 'else' : `if(x != ${v})`}\n  System.out.print("${w2} ");\nSystem.out.print(x);`;
    const ans = result(src);
    return {
      type: 'text', prompt: `What does this print?${code(src)}`, answer: ans, placeholder: `e.g. ${w1} ${v}`,
      steps: [`x is ${v}, so the first condition is true: x becomes ${v + d} and "${w1}" prints.`, useElse ? 'The else was decided at the same moment as the if. Changing x inside the if never makes the else run.' : `The second if is a separate question, asked now with x = ${v + d}, so it is true too.`, `Output: ${B(esc(ans))}`],
      parts: [
        P.tf(`Is ${c(`x == ${v}`)} true when it is checked?`, true, 'if-else-one', `x starts at ${v}.`),
        useElse ? P.yn(`After x changes to ${v + d}, does Java go back and check the else?`, false, 'else-checked-once', 'An if-else is checked once: exactly one branch runs, decided when the if is evaluated.')
          : P.tf(`Is ${c(`x != ${v}`)} true when the second if is reached?`, true, 'separate-if-bug', `By then x is ${v + d}. A separate if is a new question.`),
        P.text('Output', ans, useElse ? 'else-checked-once' : 'separate-if-bug', 'Trace in order.'),
      ],
    };
  }
  function water(rng) {
    const T = rng.pick([rng.int(-30, -1), rng.int(0, 100), rng.int(101, 140)]);
    const src = `double T = ${T};\nif(T < 0)\n  System.out.print("ice ");\nif(T <= 100)\n  System.out.print("liquid ");\nelse\n  System.out.print("steam ");`;
    const ans = result(src);
    const words = ans.trim().split(/\s+/).length;
    return {
      type: 'text', prompt: `This code is meant to print the state of water at temperature T. What does it print?${code(src)}`, answer: ans,
      steps: ['The first if is its own chain.', 'The second if-else is a separate chain, so it always prints exactly one word.', `For T = ${T}: ${B(esc(ans))}`, T < 0 ? 'That is the bug: below 0 it prints two states. Fix: make the second if an else if.' : 'Only one state prints here, but negative T would print two.'],
      parts: [
        P.num('How many words are printed?', words, 'separate-if-bug', 'Two separate chains can each print something.'),
        P.text('Output', ans, 'if-else-one', 'The if-else pair always prints exactly one of its two words.'),
      ],
    };
  }

  gen('u2-missing-return', 'Missing return statement', 'cs2-if-else', [
    { c: ['missing-return', 'return-exits'], hard: true, f: missingReturn },
    { c: ['if-else-one', 'missing-return'], f: missingReturn },
  ]);
  function missingReturn(rng) {
    const bodies = [
      ['if(a == b)\n    return 2*a*b;\n  else\n    return a*b;', true],
      ['if(a == b)\n    return 2*a*b;\n  if(a != b)\n    return a*b;', false],
      ['if(a == b)\n    return 2*a*b;\n  return a*b;', true],
      ['if(a == b)\n    return 2*a*b;', false],
      ['if(a > b)\n    return a*b;\n  else if(a < b)\n    return 2*a*b;', false],
      ['if(a > b)\n    return a*b;\n  else if(a < b)\n    return 2*a*b;\n  else\n    return 0;', true],
    ];
    const [body] = rng.pick(bodies);
    const a = rng.int(2, 6), b = rng.pick([a, rng.int(2, 6)]);
    const src = `public static int m(int a, int b){\n  ${body}\n}\nSystem.out.print(m(${a}, ${b}));`;
    const r = run(src);
    const ok = !(r.r.error && r.r.error.kind === 'compile');
    const CE = 'Compile error: missing return statement';
    const correct = ok ? `Prints ${r.text}` : CE;
    const wrongs = [{ text: ok ? CE : `Prints ${a * b}`, concept: 'missing-return' }, { text: `Prints ${2 * a * b}`, concept: 'return-exits' }, { text: `Prints ${a * b}`, concept: 'if-else-one' }, { text: 'Prints 0', concept: 'missing-return' }, { text: CE, concept: 'missing-return' }];
    const m = mc(rng, correct, wrongs);
    return Object.assign({
      type: 'mc', prompt: `What happens when this code runs?${code(src)}`,
      steps: ['The compiler does not know the values of a and b. It asks: is a return guaranteed on every possible path?', ok ? 'Yes: an else (or an unconditional return at the end) guarantees one.' : 'No: if every condition were false, the method would reach its end without returning an int. Even if(a == b) … if(a != b) … counts as possibly missing.', `Answer: ${B(esc(correct))}`],
      parts: [
        P.yn('Can the compiler be sure an int is returned on every path?', ok, 'missing-return', ok ? 'An else, or a return after the ifs, covers every path.' : 'The compiler considers every condition being false, whatever the values really are.'),
        P.pick('What happens?', m.choices, m.correct, 'missing-return', ok ? `It compiles and m(${a}, ${b}) returns ${r.text}.` : 'It never runs: the missing return is a compile error.'),
      ],
    }, m);
  }

  // =====================================================================
  // 2.3 else-if chains
  // =====================================================================
  gen('u2-else-if-chain', 'else-if chains', 'cs2-else-if', [
    { c: ['else-if-chain', 'chain-guarantee'], f: (r) => chain(r, 'proper') },
    { c: ['threshold-order'], f: (r) => chain(r, 'ascending-ifs') },
    { c: ['threshold-order', 'else-if-chain'], hard: true, f: (r) => chain(r, 'ascending-elseif') },
    { c: ['chain-guarantee', 'else-if-chain'], f: (r) => chain(r, 'bonus') },
  ]);
  function chain(rng, kind) {
    let src, line;
    if (kind === 'bonus') {
      const s = rng.int(0, 40);
      src = `int score = 100;\nint stars = ${s};\nif(stars >= 30)\n  score += 4000;\nelse if(stars >= 20)\n  score += 2000;\nelse if(stars >= 10)\n  score += 1000;\nSystem.out.print(score);`;
      line = 3;
    } else {
      const g = rng.int(45, 99);
      const T = [['A', 90], ['B', 80], ['C', 70], ['D', 60]];
      if (kind === 'proper') src = `int grade = ${g};\nString letter;\n${T.map(([L, t], i) => `${i ? 'else if' : 'if'}(grade >= ${t})\n  letter = "${L}";`).join('\n')}\nelse\n  letter = "F";\nSystem.out.print(letter);`;
      else {
        const rev = T.slice().reverse();
        src = `int grade = ${g};\nString letter = "F";\n${rev.map(([L, t], i) => `${i && kind === 'ascending-elseif' ? 'else if' : 'if'}(grade >= ${t})\n  letter = "${L}";`).join('\n')}\nSystem.out.print(letter);`;
      }
      line = 3;
    }
    const ans = printed(src);
    const t = J.run(src, { trace: true }).trace;
    const checked = t.filter((s) => s.cond !== undefined).length;
    const why = {
      proper: 'An else-if is only checked when everything above it was false, so the first true condition wins and the rest are skipped.',
      'ascending-ifs': 'Separate ifs from the lowest threshold up keep overwriting letter, so the highest threshold reached wins. Correct.',
      'ascending-elseif': 'With else-ifs in ascending order, the first true condition (>= 60) stops the chain, so any passing grade gets "D". That is the bug.',
      bonus: 'The chain has no else, so it may run no branch at all (fewer than 10 stars adds nothing).',
    }[kind];
    return {
      type: 'text', prompt: `What does this print?${code(src)}`, answer: ans, explainHTML: traceHTML(src),
      steps: [`Conditions actually checked: ${checked}.`, why, `Output: ${B(esc(ans))}`],
      parts: [
        P.num('How many conditions does Java actually check?', checked, kind === 'ascending-ifs' ? 'threshold-order' : 'else-if-chain', 'Separate ifs are all checked; in a chain, checking stops at the first true condition.'),
        P.text('Output', ans, kind === 'bonus' ? 'chain-guarantee' : kind === 'proper' ? 'else-if-chain' : 'threshold-order', why),
      ],
    };
    void line;
  }

  gen('u2-chain-count', 'Counting possible outcomes of conditional chains', 'cs2-else-if', [
    { c: ['count-chains', 'chain-guarantee'], hard: true, f: chainCount },
  ]);
  function chainCount(rng) {
    const n = rng.int(4, 7);
    const seq = [];
    let withElse = 0;
    for (let i = 0; i < n; i++) {
      seq.push('if');
      for (let k = rng.int(0, 2); k > 0; k--) seq.push('else if');
      if (rng() < 0.5) { seq.push('else'); withElse++; }
    }
    const askMax = rng() < 0.5;
    const list = `<pre class="code">${seq.map((s) => `<span class="ln">${s}</span>`).join('')}</pre>`;
    return {
      type: 'numeric', prompt: `Each conditional below controls exactly one print command, in this order:${list}What is the ${B(askMax ? 'maximum' : 'minimum')} number of print commands that can run?`,
      answer: askMax ? n : withElse,
      steps: [`Every if starts a new chain, so there are ${n} chains.`, 'Each chain runs at most one branch, so the maximum is the number of chains.', `Only chains ending in else are guaranteed to run a branch: ${withElse} of them.`, `${askMax ? 'Maximum' : 'Minimum'}: ${B(askMax ? n : withElse)}`],
      parts: [
        P.num('How many separate chains are there?', n, 'count-chains', 'Each if starts a new chain.'),
        P.num('How many chains end with an else?', withElse, 'chain-guarantee', 'Only those are guaranteed to run a branch.'),
        P.num('Maximum number of prints?', n, 'count-chains', 'At most one per chain.'),
        P.num('Minimum number of prints?', withElse, 'chain-guarantee', 'Chains without an else can run nothing.'),
      ],
    };
  }

  gen('u2-chain-structure', 'Valid conditional chains', 'cs2-else-if', [
    { c: ['chain-structure'], f: chainStructure },
  ]);
  function chainStructure(rng) {
    const kw = ['if', 'else if', 'else'];
    const toJava = (seq) => 'int x = 0;\n' + seq.map((s, i) => (s === 'else' ? `else System.out.print(${i});` : `${s}(x == ${i}) System.out.print(${i});`)).join('\n');
    const valid = [], invalid = [];
    for (let tries = 0; tries < 400 && (valid.length < 3 || invalid.length < 6); tries++) {
      const len = rng.int(3, 5);
      const seq = Array.from({ length: len }, (_, i) => (i === 0 && rng() < 0.7 ? 'if' : rng.pick(kw)));
      const key = seq.join(' / ');
      if (valid.concat(invalid).some((x) => x.key === key)) continue;
      (compiles(toJava(seq)) ? valid : invalid).push({ seq, key });
    }
    const right = valid[0] || { key: 'if / else if / else', seq: ['if', 'else if', 'else'] };
    const m = mc(rng, esc(right.key), invalid.map((x) => ({ text: esc(x.key), concept: 'chain-structure' })));
    const bad = invalid[0] || { key: 'if / else / else if' };
    return Object.assign({
      type: 'mc', prompt: 'Which sequence of conditionals compiles? (Each one controls a single print command.)',
      steps: ['A chain must start with if.', 'else if and else need an open chain above them.', 'An else closes the chain: nothing but a new if can follow it.', `Answer: ${B(esc(right.key))}`],
      parts: [
        P.yn('Can an else if come right after an else?', false, 'chain-structure', 'The else closed the chain, so the else if has no open if above it.'),
        P.yn(`Does ${esc(bad.key)} compile?`, false, 'chain-structure', 'Look for an else if or else with no open if above it.'),
        P.pick('Which sequence compiles?', m.choices, m.correct, 'chain-structure', 'Every else if / else must follow an if or else if of an open chain.'),
      ],
    }, m);
  }

  // =====================================================================
  // 2.4 nested conditionals
  // =====================================================================
  gen('u2-nested', 'Nested conditionals', 'cs2-nested', [
    { c: ['dangling-else', 'nested-if'], hard: true, f: (r) => nested(r, 'dangling') },
    { c: ['nested-if'], f: (r) => nested(r, 'braces') },
    { c: ['reassign-fallthrough', 'nested-if'], hard: true, f: (r) => nested(r, 'reassign') },
  ]);
  function nested(rng, kind) {
    let src, alt = '';
    const x = rng.int(1, 9), y = rng.int(1, 9), P1 = rng.int(2, 7), Q1 = rng.int(2, 7);
    if (kind === 'dangling') {
      src = `int x = ${x}, y = ${y};\nif(x > ${P1})\n  if(y > ${Q1})\n    System.out.print("one ");\nelse\n  System.out.print("two ");\nSystem.out.print("end");`;
      alt = result(`int x = ${x}, y = ${y};\nif(x > ${P1}){\n  if(y > ${Q1})\n    System.out.print("one ");\n}\nelse\n  System.out.print("two ");\nSystem.out.print("end");`);
    } else if (kind === 'braces') {
      src = `int x = ${x}, y = ${y};\nif(x > ${P1}){\n  if(y > ${Q1})\n    System.out.print("one ");\n  else\n    System.out.print("two ");\n}\nelse\n  System.out.print("three ");\nSystem.out.print("end");`;
    } else {
      const c1 = rng.pick([1, 2, 3]), c2 = rng.pick([1, 2]);
      src = `Scanner reader = new Scanner(System.in);\nint choice = reader.nextInt();\nif(choice == 1 || choice == 2){\n  System.out.print("low battery ");\n  choice = reader.nextInt();\n  if(choice == 1)\n    System.out.print("device dies ");\n  else\n    choice = 3;\n}\nif(choice == 3)\n  System.out.print("radio ");\nSystem.out.print("end");`;
      const input = [c1, c2];
      const ans = result(src, { input });
      return {
        type: 'text', prompt: `The user types ${B(c1)} and then ${B(c2)} (if asked). What is printed?${code(src)}`, answer: ans,
        steps: [`First choice is ${c1}: ${c1 === 3 ? 'the first if is false' : 'enter the first if'}.`, c1 !== 3 ? `Second choice ${c2}: ${c2 === 1 ? 'the device dies' : 'choice is set to 3'}.` : 'The second input is never read.', `${c('if(choice == 3)')} is a separate if, checked afterward with the current choice.`, `Output: ${B(esc(ans))}`],
        parts: [
          P.tf(`Is ${c('choice == 1 || choice == 2')} true?`, c1 !== 3, 'nested-if', `choice is ${c1}.`),
          P.text('What is choice right before line 11 (if(choice == 3))?', c1 === 3 ? '3' : c2 === 1 ? '1' : '3', 'reassign-fallthrough', 'choice = 3 inside the nested else makes the later if true.'),
          P.text('Output', ans, 'reassign-fallthrough', 'Trace with the inputs.'),
        ],
      };
    }
    const ans = result(src);
    const outer = x > P1;
    const parts = [P.tf(`Is ${c(`x > ${P1}`)} true?`, outer, 'nested-if', `x is ${x}.`)];
    if (kind === 'dangling') parts.unshift(P.pick('Which if does the else belong to?', [`the inner if (y > ${Q1})`, `the outer if (x > ${P1})`], 0, 'dangling-else', 'Without braces, an else pairs with the nearest unmatched if. The indentation is misleading.'));
    else parts.push(P.tf(`Is the inner condition ${c(`y > ${Q1}`)} even checked?`, outer, 'nested-if', 'The inner if is only reached when the outer condition is true.'));
    parts.push(P.text('Output', ans, kind === 'dangling' ? 'dangling-else' : 'nested-if', 'Trace it.'));
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans,
      steps: [kind === 'dangling' ? 'The else belongs to the nearest unmatched if: the INNER one, whatever the indentation says.' : 'The inner if-else only runs when the outer condition is true.', `x > ${P1} is ${B(tf(outer))}; y > ${Q1} is ${B(tf(y > Q1))}.`, alt && alt !== ans ? `Reading the else as the outer one's would give "${esc(alt)}".` : 'Trace the branches.', `Output: ${B(esc(ans))}`],
      parts,
    };
  }

  // =====================================================================
  // 2.2 relational operators and equality
  // =====================================================================
  const REL = [
    { e: 'a * b > c == a - 2 <= b', c: 'rel-precedence', l: 'a * b > c', r: 'a - 2 <= b' },
    { e: 'a > b == b > c', c: 'bool-eq-bool', l: 'a > b', r: 'b > c' },
    { e: '(a != b) == (b != c)', c: 'bool-eq-bool', l: 'a != b', r: 'b != c' },
    { e: 'a + b > c * 2 != a < b', c: 'rel-precedence', l: 'a + b > c * 2', r: 'a < b' },
    { e: 'a != b == b != c', c: 'rel-chain-error', l: 'a != b', bad: '(a != b) == b' },
    { e: 'a > (b == b) > c', c: 'rel-chain-error', l: 'b == b', bad: 'a > true' },
    { e: 'a * b > (c == a - 2) <= b', c: 'rel-chain-error', l: 'c == a - 2', bad: 'a * b > (a boolean)' },
  ];
  gen('u2-relational-eval', 'Evaluating relational expressions', 'cs2-relational', [
    { c: ['rel-precedence', 'bool-eq-bool'], f: (r) => relEval(r, REL.filter((x) => !x.bad)) },
    { c: ['rel-chain-error', 'rel-precedence'], hard: true, f: (r) => relEval(r, REL.filter((x) => x.bad)) },
    { c: ['bool-eq-bool'], hard: true, f: (r) => relEval(r, REL.filter((x) => x.c === 'bool-eq-bool')) },
  ]);
  function relEval(rng, pool) {
    const T = rng.pick(pool);
    const a = rng.int(2, 7), b = rng.int(2, 7), cc = rng.int(2, 9);
    const vars = { a: ['int', a], b: ['int', b], c: ['int', cc] };
    const src = `int a = ${a}, b = ${b}, c = ${cc};\nSystem.out.print(${T.e});`;
    const ans = result(src);
    const lv = ev(T.l, vars);
    const parts = [P.text(`What does ${c(T.l)} evaluate to?`, lv, T.bad ? 'rel-precedence' : 'rel-precedence', '< > <= >= happen before == and !=, and arithmetic happens before both.')];
    if (T.bad) parts.push(P.yn(`After that, Java must evaluate ${c(T.bad)}. Is comparing a boolean with a number allowed?`, false, 'rel-chain-error', 'A boolean can only be compared with another boolean, so this is a compile error.'));
    else parts.push(P.text(`What does ${c(T.r)} evaluate to?`, ev(T.r, vars), 'rel-precedence', 'Evaluate the other comparison the same way.'));
    parts.push(P.text('What is printed?', ans, T.c, T.bad ? 'It never runs.' : 'Compare the two booleans.', { hint: HINT_BOOL }));
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans, hint: HINT_BOOL,
      explainHTML: (() => {
        const st = CSKit.exprSteps(T.e, vars);
        return st.steps ? `<div class="tr-label">Step by step</div>${st.steps.map((s) => `<div class="mono">${esc(s.text)}</div>`).join('')}` : '';
      })(),
      steps: ['Precedence: arithmetic, then &lt; &gt; &lt;= &gt;=, then == and !=, left to right.', `${c(T.l)} is ${B(lv)}.`, T.bad ? `Then ${c(T.bad)} compares a boolean with a number: compile error.` : `${c(T.r)} is ${B(ev(T.r, vars))}, and the two booleans are compared.`, `Answer: ${B(esc(ans))}`],
      parts,
    };
  }

  gen('u2-relational-meaning', 'Relational operators: what they work on', 'cs2-relational', [
    { c: ['string-compare-method', 'relational-numeric'], f: (r) => relMeaning(r, 'string') },
    { c: ['relational-numeric'], hard: true, f: (r) => relMeaning(r, 'bool') },
    { c: ['relational-ops'], f: (r) => relMeaning(r, 'type') },
  ]);
  function relMeaning(rng, kind) {
    if (kind === 'string') {
      const after = rng() < 0.5;
      const right = after ? 's1.compareTo(s2) > 0' : 's1.compareTo(s2) < 0';
      const m = mc(rng, c(right), [{ text: c(after ? 's1 > s2' : 's1 < s2'), concept: 'relational-numeric' }, { text: c(after ? 's1.compareTo(s2) < 0' : 's1.compareTo(s2) > 0'), concept: 'string-compare-method' }, { text: c(after ? 's2.compareTo(s1) > 0' : 's2.compareTo(s1) < 0'), concept: 'string-compare-method' }]);
      return Object.assign({
        type: 'mc', prompt: `Which expression is true exactly when String ${c('s1')} comes ${B(after ? 'after' : 'before')} ${c('s2')} alphabetically?`,
        steps: ['&lt; and &gt; only work on numbers, so s1 &lt; s2 does not compile.', 's1.compareTo(s2) is negative when s1 comes first, positive when it comes after.', `Answer: ${B(c(right))}`],
        parts: [P.yn(`Does ${c('s1 < s2')} compile for Strings?`, false, 'relational-numeric', '&lt; &gt; &lt;= &gt;= only work on int, double, Integer, Double.'), P.pick('Which is right?', m.choices, m.correct, 'string-compare-method', 'Negative means the caller comes first.')],
      }, m);
    }
    if (kind === 'bool') {
      const va = rng() < 0.5, vb = !va;
      const op = rng.pick(['>', '<', '>=']);
      const src = `boolean a = ${va};\nboolean b = ${vb};\nSystem.out.print(a ${op} b);`;
      const ans = result(src);
      const m = mc(rng, esc(ans), [{ text: 'true', concept: 'relational-numeric' }, { text: 'false', concept: 'relational-numeric' }, { text: '1', concept: 'relational-numeric' }, { text: '0', concept: 'relational-numeric' }]);
      return Object.assign({
        type: 'mc', prompt: `What happens?${code(src)}`,
        steps: [`${c(op)} only compares numbers.`, 'booleans are not numbers in Java (true is not 1).', `Answer: ${B(esc(ans))}`],
        parts: [P.yn(`Can ${c(op)} compare two booleans?`, false, 'relational-numeric', 'Only == and != work on booleans.'), P.pick('What happens?', m.choices, m.correct, 'relational-numeric', 'It is a compile error: bad operand types.')],
      }, m);
    }
    const ex = rng.pick(['x <= y', 'x != y', 'x > y + 1', 'x == y * 2']);
    const m = mc(rng, c('boolean'), [{ text: c('int'), concept: 'relational-ops' }, { text: c('double'), concept: 'relational-ops' }, { text: c('String'), concept: 'relational-ops' }]);
    const x = rng.int(1, 9), y = rng.int(1, 9);
    const v = ev(ex, { x: ['int', x], y: ['int', y] });
    return Object.assign({
      type: 'mc', prompt: `${c('x')} and ${c('y')} are ints. What type is the value of ${c(ex)}?`,
      steps: ['Every relational operator produces a boolean.', `With x = ${x}, y = ${y} it is ${v}.`, `Answer: ${B(c('boolean'))}`],
      parts: [P.text(`With x = ${x} and y = ${y}, what is ${c(ex)}?`, v, 'relational-ops', 'Compare the numbers.'), P.pick('What type is it?', m.choices, m.correct, 'relational-ops', 'true or false: a boolean.')],
    }, m);
  }

  gen('u2-equality', '== on primitives, objects, and doubles', 'cs2-equality', [
    { c: ['eq-primitive'], f: (r) => equality(r, 'prim') },
    { c: ['eq-reference', 'eq-primitive'], hard: true, f: (r) => equality(r, 'ref') },
    { c: ['eq-incomparable'], hard: true, f: (r) => equality(r, 'incomp') },
    { c: ['double-roundoff', 'epsilon'], hard: true, f: (r) => equality(r, 'double') },
    { c: ['epsilon', 'double-roundoff'], f: (r) => equality(r, 'eps') },
  ]);
  function equality(rng, kind) {
    const v = rng.int(2, 99);
    let src, what, cpt;
    if (kind === 'prim') {
      const w = rng.pick([`${v}.0`, `${v}.5`, `new Integer(${v})`, `new Integer(${v + 1})`]);
      src = `int a = ${v};\n${w.startsWith('new') ? 'Integer' : 'double'} b = ${w};\nSystem.out.print(a == b);`;
      what = 'the values'; cpt = 'eq-primitive';
    } else if (kind === 'ref') {
      src = `Integer a = new Integer(${v});\nInteger b = ${rng() < 0.7 ? `new Integer(${v})` : 'a'};\nSystem.out.print(a == b);`;
      what = 'whether they are the same object'; cpt = 'eq-reference';
    } else if (kind === 'incomp') {
      src = `Integer a = new Integer(${v});\nDouble b = new Double(${v});\nSystem.out.print(a == b);`;
      what = 'nothing: it does not compile'; cpt = 'eq-incomparable';
    } else {
      const k = rng.pick(['1.111', '3.333', '1.1', '0.3', '2.2', '1.7']);
      src = `double x = ${k};\ndouble a = 3*x, b = 4*x, c = 5*x;\nSystem.out.print(a*a + b*b == c*c);` + (kind === 'eps' ? '\nSystem.out.print(" " + (Math.abs(a*a + b*b - c*c) < 1E-10));' : '');
      what = 'the values (exactly, bit for bit)'; cpt = kind === 'eps' ? 'epsilon' : 'double-roundoff';
    }
    const ans = result(src);
    const WHAT = ['the values', 'whether they are the same object', 'nothing: it does not compile', 'the values (exactly, bit for bit)'];
    const opts = [WHAT[0], WHAT[1], WHAT[2]];
    if (kind === 'double' || kind === 'eps') opts[0] = WHAT[3];
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans, hint: 'Type true, false, or Compile error (separate several values with spaces).',
      steps: [
        kind === 'prim' ? 'An int compared with a double or an Integer compares values (the int widens / the Integer unboxes).' : kind === 'ref' ? '== between two Integer objects asks whether they are the same object, not whether they hold the same number.' : kind === 'incomp' ? 'Integer and Double are different object types: == between them is a compile error (incomparable types).' : 'Doubles are stored with tiny rounding errors, so == on computed doubles is unreliable.',
        kind === 'eps' ? 'Comparing with a tolerance (Math.abs(difference) &lt; 1E-10) is the safe way.' : 'Read the declarations carefully.',
        `Answer: ${B(esc(ans))}`],
      parts: [
        P.pick('Here, what does == check?', opts, opts.indexOf(what), cpt, kind === 'ref' ? 'Two Integer objects: identity.' : kind === 'incomp' ? 'Incomparable types never compile.' : 'Numbers are compared by value.'),
        P.text('What is printed?', ans, cpt, 'Apply the rule.', { hint: HINT_BOOL }),
      ],
    };
  }

  // =====================================================================
  // 2.5–2.6 boolean logic
  // =====================================================================
  const TT = [
    { e: '!A && B || C', first: '!', c: 'and-before-or' },
    { e: '!A && (B || C)', first: '!', c: 'and-table' },
    { e: 'A || !B && C', first: '!', c: 'and-before-or' },
    { e: 'A || B && C', first: '&&', c: 'and-before-or' },
    { e: 'A == B && C', first: '==', c: 'bool-precedence-full' },
    { e: 'A == (B && C)', first: '&&', c: 'iff-eq' },
    { e: 'A != B', first: '!=', c: 'xor-neq' },
    { e: 'A == B', first: '==', c: 'iff-eq' },
    { e: '!(A || B)', first: '||', c: 'nand-nor' },
    { e: '!(A && B)', first: '&&', c: 'nand-nor' },
    { e: 'A || B', first: '||', c: 'or-table' },
    { e: 'A && B', first: '&&', c: 'and-table' },
  ];
  const varsIn = (e) => ['A', 'B', 'C'].filter((v) => e.includes(v));
  gen('u2-truth-value', 'Truth tables', 'cs2-truth-tables', [
    ...['and-before-or', 'and-table', 'bool-precedence-full', 'iff-eq', 'xor-neq', 'nand-nor', 'or-table'].map((cpt) => ({ c: [cpt, 'truth-table-rows'], hard: ['and-before-or', 'bool-precedence-full', 'xor-neq'].includes(cpt), f: (r) => truthValue(r, TT.filter((x) => x.c === cpt)) })),
    { c: ['truth-table-rows', 'and-table'], f: (r) => truthRows(r) },
  ]);
  function envOf(vs, vals) { const o = {}; vs.forEach((v, i) => { o[v] = ['boolean', vals[i]]; }); return o; }
  function truthValue(rng, pool) {
    const T = rng.pick(pool);
    const vs = varsIn(T.e);
    const vals = vs.map(() => rng() < 0.5);
    const val = ev(T.e, envOf(vs, vals));
    const decl = vs.map((v, i) => `boolean ${v} = ${vals[i]};`).join('\n');
    const src = `${decl}\nSystem.out.print(${T.e});`;
    const ops = ['!', '&&', '||', '==', '!='];
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: val, hint: 'Type true or false.',
      steps: ['Precedence: ! first, then == and !=, then &&, then ||. Parentheses override.', `The first operation is ${c(T.first)}.`, `With ${vs.map((v, i) => `${v} = ${vals[i]}`).join(', ')}: ${B(val)}`],
      parts: [
        P.pick(`Which operator in ${c(T.e)} is applied first?`, ops.map((o) => c(o)), ops.indexOf(T.first), T.c === 'iff-eq' || T.c === 'xor-neq' ? 'bool-precedence-full' : T.c, 'Parentheses first, then ! , then == / !=, then &&, then ||.'),
        P.num(`How many rows would the full truth table of ${c(T.e)} have?`, Math.pow(2, vs.length), 'truth-table-rows', `${vs.length} variables give 2^${vs.length} rows.`),
        P.text('What is printed?', val, T.c, T.c === 'xor-neq' ? 'For booleans, != is true when exactly one is true.' : T.c === 'iff-eq' ? '== is true when both have the same value.' : 'Evaluate in precedence order.'),
      ],
    };
  }
  function truthRows(rng) {
    const T = rng.pick(TT.filter((x) => varsIn(x.e).length >= 2));
    const vs = varsIn(T.e);
    let count = 0;
    for (let r = 0; r < 1 << vs.length; r++) {
      const vals = vs.map((_, k) => !!((r >> k) & 1));
      if (ev(T.e, envOf(vs, vals)) === 'true') count++;
    }
    return {
      type: 'numeric', prompt: `In the full truth table of ${c(T.e)}, in how many rows is the expression ${B('true')}?`, answer: count,
      steps: [`${vs.length} variables: ${Math.pow(2, vs.length)} rows.`, 'Evaluate each row (precedence: !, ==/!=, &&, ||).', `True rows: ${B(count)}`],
      parts: [
        P.num('How many rows does the table have?', Math.pow(2, vs.length), 'truth-table-rows', 'n variables give 2^n rows.'),
        P.num('In how many rows is it true?', count, T.c, 'Check every combination.'),
      ],
    };
  }

  gen('u2-or-meaning', 'English to boolean expressions', 'cs2-truth-tables', [
    { c: ['or-table', 'xor-neq'], f: (r) => orMeaning(r, ['or', 'xor']) },
    { c: ['xor-neq', 'iff-eq'], hard: true, f: (r) => orMeaning(r, ['xor', 'iff']) },
    { c: ['nand-nor', 'and-table'], f: (r) => orMeaning(r, ['nor', 'nand']) },
  ]);
  function orMeaning(rng, kinds) {
    const S = {
      or: [['A door opens if you have the keys or know the code.', 'keys', 'code']],
      xor: [['You must play either the red pieces or the blue pieces (exactly one set).', 'red', 'blue'], ['A light switch is in exactly one of two positions: up or down.', 'up', 'down']],
      iff: [['We only play minecraft together: I play if and only if my son plays.', 'me', 'son']],
      nor: [['My son may neither play on the freeway nor eat glass. When is he allowed?', 'freeway', 'glass']],
      nand: [['You are not allowed to text and drive at the same time. When is it allowed?', 'text', 'drive']],
    };
    const kind = rng.pick(kinds);
    const [sent, x, y] = rng.pick(S[kind]);
    const F = { or: `${x} || ${y}`, xor: `${x} != ${y}`, iff: `${x} == ${y}`, nor: `!(${x} || ${y})`, nand: `!(${x} && ${y})`, and: `${x} && ${y}` };
    const CON = { or: 'or-table', xor: 'xor-neq', iff: 'iff-eq', nor: 'nand-nor', nand: 'nand-nor', and: 'and-table' };
    const right = F[kind];
    const m = mc(rng, c(right), rng.shuffle(Object.keys(F).filter((k) => k !== kind)).map((k) => ({ text: c(F[k]), concept: CON[k] })));
    const bothOk = ev(right, { [x]: ['boolean', true], [y]: ['boolean', true] }) === 'true';
    return Object.assign({
      type: 'mc', prompt: `${esc(sent)} Which Java expression is ${c('true')} exactly in the allowed situations? (${c(x)} and ${c(y)} are booleans.)`,
      steps: ['Inclusive or (||): at least one. Exclusive or (!=): exactly one. If and only if (==): same value.', 'not (A or B) means both false; not (A and B) means not both.', `Answer: ${B(c(right))}`],
      parts: [
        P.yn(`Is the situation where ${x} and ${y} are BOTH true allowed?`, bothOk, CON[kind], 'Read the sentence carefully: does "or" include both?'),
        P.pick('Which expression?', m.choices, m.correct, CON[kind], `${esc(right)} matches the sentence.`),
      ],
    }, m);
  }

  // De Morgan
  const RELS = [
    ['num % K == 0', 'num % K != 0', 'num % K == 1'],
    ['num > K', 'num <= K', 'num < K'],
    ['num < K', 'num >= K', 'num > K'],
    ['num >= K', 'num < K', 'num <= K'],
    ['num <= K', 'num > K', 'num >= K'],
    ['num != K', 'num == K', 'num < K'],
  ];
  gen('u2-demorgan', "De Morgan's laws", 'cs2-demorgan', [
    { c: ['demorgan-or', 'negate-relational'], f: (r) => demorgan(r, '||') },
    { c: ['demorgan-and', 'negate-relational'], f: (r) => demorgan(r, '&&') },
    { c: ['negate-relational', 'demorgan-or'], hard: true, f: (r) => demorgan(r, rng2op(r)) },
    { c: ['negate-large'], hard: true, f: negateLarge },
  ]);
  function rng2op(rng) { return rng() < 0.5 ? '||' : '&&'; }
  function demorgan(rng, op) {
    const [p, q] = rng.shuffle(RELS).slice(0, 2);
    const k1 = rng.int(2, 6), k2 = rng.int(3, 9);
    const f = (s, k) => s.replace('K', k);
    const P0 = f(p[0], k1), Q0 = f(q[0], k2), nP = f(p[1], k1), nQ = f(q[1], k2), wP = f(p[2], k1);
    const flip = op === '||' ? '&&' : '||';
    const expr = `!(${P0} ${op} ${Q0})`;
    const right = `${nP} ${flip} ${nQ}`;
    const m = mc(rng, c(right), [
      { text: c(`${nP} ${op} ${nQ}`), concept: op === '||' ? 'demorgan-or' : 'demorgan-and' },
      { text: c(`${wP} ${flip} ${nQ}`), concept: 'negate-relational' },
      { text: c(`${nP} ${flip} ${Q0}`), concept: op === '||' ? 'demorgan-or' : 'demorgan-and' },
      { text: c(`!${P0} ${op} !${Q0}`), concept: op === '||' ? 'demorgan-or' : 'demorgan-and' },
    ]);
    return Object.assign({
      type: 'mc', prompt: `${c('num')} is an int. Which expression is equivalent to ${c(expr)}?`,
      steps: [`De Morgan: !(A ${op} B) is !A ${flip} !B.`, `!(${esc(P0)}) is ${c(nP)} (not ${esc(wP)}).`, `Answer: ${B(c(right))}`],
      parts: [
        P.mc(rng, `What is the negation of ${c(P0)}?`, c(nP), [{ text: c(wP), concept: 'negate-relational' }, { text: c(P0), concept: 'negate-relational' }], 'negate-relational', 'The opposite of &gt; is &lt;= (it must include equality), and the opposite of == is !=.'),
        P.pick(`After negating, which operator joins the two parts?`, [c('&&'), c('||')], flip === '&&' ? 0 : 1, op === '||' ? 'demorgan-or' : 'demorgan-and', `De Morgan swaps ${esc(op)} for ${esc(flip)}.`),
        P.pick('Which expression is equivalent?', m.choices, m.correct, op === '||' ? 'demorgan-or' : 'demorgan-and', 'Negate both parts and swap the operator.'),
      ],
    }, m);
  }
  function negateLarge(rng) {
    if (rng() < 0.5) {
      const k1 = rng.int(1, 5), k2 = rng.int(6, 12), m1 = rng.pick([2, 3]), m2 = rng.pick([3, 5]);
      const expr = `!((x + y > ${k1} || x < ${k2}) && (x % ${m1} == 0 && y % ${m2} == 0))`;
      const A = `(x + y <= ${k1} && x >= ${k2}) || (x % ${m1} != 0 || y % ${m2} != 0)`;
      const m = mc(rng, c(A), [
        { text: c(`(x + y <= ${k1} && x >= ${k2}) && (x % ${m1} != 0 || y % ${m2} != 0)`), concept: 'negate-large' },
        { text: c(`(x + y <= ${k1} || x >= ${k2}) || (x % ${m1} != 0 && y % ${m2} != 0)`), concept: 'demorgan-or' },
        { text: c(`(x + y <= ${k1} && x >= ${k2}) || (x % ${m1} != 0 && y % ${m2} != 0)`), concept: 'demorgan-and' },
        { text: c(`(x + y <= ${k1} || x >= ${k2}) || (x % ${m1} != 0 || y % ${m2} != 0)`), concept: 'demorgan-or' },
      ]);
      return Object.assign({
        type: 'mc', prompt: `${c('x')} and ${c('y')} are ints. Which is equivalent to ${c(expr)}?`,
        steps: ['The outer ! turns (P) && (Q) into !P || !Q.', `!(x + y > ${k1} || x < ${k2}) is x + y <= ${k1} && x >= ${k2}.`, `!(x % ${m1} == 0 && y % ${m2} == 0) is x % ${m1} != 0 || y % ${m2} != 0.`, `Answer: ${B(c(A))}`],
        parts: [
          P.pick('The outermost operator inside the ! is &&. What does it become?', [c('||'), c('&&')], 0, 'negate-large', 'De Morgan: !(P && Q) is !P || !Q.'),
          P.mc(rng, `What is ${c(`!(x + y > ${k1} || x < ${k2})`)}?`, c(`x + y <= ${k1} && x >= ${k2}`), [{ text: c(`x + y <= ${k1} || x >= ${k2}`), concept: 'demorgan-or' }, { text: c(`x + y < ${k1} && x > ${k2}`), concept: 'negate-relational' }], 'demorgan-or', 'Negate both comparisons and swap || for &&.'),
          P.pick('Which is equivalent?', m.choices, m.correct, 'negate-large', 'Apply De Morgan at every level.'),
        ],
      }, m);
    }
    const F = rng.pick([
      ['A || !B && C', '!A && (B || !C)', '!A && B || !C'],
      ['A && B || C', '(!A || !B) && !C', '!A || !B && !C'],
      ['A && (B || C)', '!A || !B && !C', '(!A || !B) && !C'],
      ['!A || B && !C', 'A && (!B || C)', 'A && !B || C'],
    ]);
    const m = mc(rng, c(F[1]), [{ text: c(F[2]), concept: 'negate-large' }, { text: c(`!${F[0].replace(/[()]/g, '')}`), concept: 'negate-large' }, { text: c(F[0].replace(/!/g, '').replace(/\b([ABC])\b/g, '!$1')), concept: 'demorgan-and' }]);
    const env = { A: ['boolean', true], B: ['boolean', false], C: ['boolean', true] };
    return Object.assign({
      type: 'mc', prompt: `${c('A')}, ${c('B')}, ${c('C')} are booleans. Which expression is the negation of ${c(F[0])} (true exactly when it is false)?`,
      steps: ['Negate every variable and swap && with ||.', 'Then keep the ORIGINAL order of operations: whatever happened first before must still happen first, so add parentheses.', `Answer: ${B(c(F[1]))}`],
      parts: [
        P.text(`With A = true, B = false, C = true, what is ${c(F[0])}?`, ev(F[0], env), 'and-before-or', '&& before ||.'),
        P.yn(`Is ${c(F[2])} (no extra parentheses) the negation?`, false, 'negate-large', 'Swapping && and || changes which happens first unless you add parentheses.'),
        P.pick('Which is the negation?', m.choices, m.correct, 'negate-large', 'Negate, swap, and preserve the original order.'),
      ],
    }, m);
  }

  gen('u2-equivalence', 'Equivalent boolean expressions', 'cs2-demorgan', [
    { c: ['complement-laws'], f: (r) => equiv(r, 'complement') },
    { c: ['distributive', 'and-before-or'], hard: true, f: (r) => equiv(r, 'dist') },
    { c: ['eq-chain-bool'], hard: true, f: (r) => equiv(r, 'chainmc') },
    { c: ['eq-chain-bool', 'iff-eq'], hard: true, f: (r) => equiv(r, 'chainval') },
  ]);
  function equiv(rng, kind) {
    if (kind === 'complement') {
      const k = rng.int(2, 9);
      const [e, val] = rng.pick([[`x > ${k} || x <= ${k}`, 'always true'], [`x > ${k} && x <= ${k}`, 'always false'], ['A && !A', 'always false'], ['A || !A', 'always true']]);
      const m = mc(rng, val, [{ text: val === 'always true' ? 'always false' : 'always true', concept: 'complement-laws' }, { text: 'depends on the value', concept: 'complement-laws' }, { text: 'does not compile', concept: 'complement-laws' }]);
      return Object.assign({
        type: 'mc', prompt: `${c(e)} is…`,
        steps: ['Something and its opposite can never both be true (A && !A is false).', 'Something or its opposite is always true (A || !A is true).', `Answer: ${B(val)}`],
        parts: [P.yn('Can a condition and its opposite both be true at once?', false, 'complement-laws', 'Never.'), P.pick(`${esc(e)} is…`, m.choices, m.correct, 'complement-laws', val)],
      }, m);
    }
    if (kind === 'dist') {
      const T = rng.pick([['A && (B || C)', '(A && B) || (A && C)', ['(A && B) || C', 'A && B || C', '(A || B) && (A || C)']], ['A || (B && C)', '(A || B) && (A || C)', ['(A || B) && C', 'A || B && C', '(A && B) || (A && C)']]]);
      const m = mc(rng, c(T[1]), T[2].map((w, i) => ({ text: c(w), concept: i === 1 ? 'and-before-or' : 'distributive' })));
      return Object.assign({
        type: 'mc', prompt: `Which is equivalent to ${c(T[0])}?`,
        steps: ['Distributive laws: A && (B || C) = (A && B) || (A && C), and A || (B && C) = (A || B) && (A || C).', 'Check with a truth table if unsure.', `Answer: ${B(c(T[1]))}`],
        parts: [
          P.text(`With A = false, B = true, C = true, what is ${c(T[0])}?`, ev(T[0], { A: ['boolean', false], B: ['boolean', true], C: ['boolean', true] }), 'and-before-or', 'Parentheses first.'),
          P.pick('Which is equivalent?', m.choices, m.correct, 'distributive', 'Distribute the outer operator over the inner one.'),
        ],
      }, m);
    }
    if (kind === 'chainmc') {
      const m = mc(rng, c('A == B && B == C'), [{ text: c('A == B == C'), concept: 'eq-chain-bool' }, { text: c('A != B != C'), concept: 'eq-chain-bool' }, { text: c('A == B || B == C'), concept: 'iff-eq' }]);
      return Object.assign({
        type: 'mc', prompt: `${c('A')}, ${c('B')}, ${c('C')} are booleans. Which expression is true exactly when all three have the same value?`,
        steps: ['Java does not chain comparisons like math does.', 'A == B == C means (A == B) == C, which is NOT "all equal" (all false gives false).', `Answer: ${B(c('A == B && B == C'))}`],
        parts: [
          P.text(`If A, B, C are all false, what is ${c('A == B == C')}?`, ev('A == B == C', { A: ['boolean', false], B: ['boolean', false], C: ['boolean', false] }), 'eq-chain-bool', '(false == false) is true, then true == false is false.'),
          P.pick('Which means "all the same"?', m.choices, m.correct, 'eq-chain-bool', 'A == B && B == C (A == C follows).'),
        ],
      }, m);
    }
    const vals = [rng() < 0.5, rng() < 0.5, rng() < 0.5];
    const e = rng.pick(['A == B == C', 'A != B != C', 'A == B != C']);
    const env = { A: ['boolean', vals[0]], B: ['boolean', vals[1]], C: ['boolean', vals[2]] };
    const src = `boolean A = ${vals[0]}, B = ${vals[1]}, C = ${vals[2]};\nSystem.out.print(${e});`;
    const ans = result(src);
    const first = e.slice(0, 6);
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans, hint: 'Type true or false.',
      steps: ['== and != go left to right.', `${c(first)} is ${ev(first, env)}.`, `Then that result is compared with C: ${B(ans)}`],
      parts: [
        P.text(`What is ${c(first)}?`, ev(first, env), 'iff-eq', 'Left to right: do the left comparison first.'),
        P.text('What is printed?', ans, 'eq-chain-bool', 'Compare that boolean with C. It is not "all equal".'),
      ],
    };
  }

  gen('u2-necessary', 'Necessary and sufficient', 'cs2-necessary', [
    { c: ['necessary'], f: (r) => necessary(r, 'nec') },
    { c: ['sufficient'], f: (r) => necessary(r, 'suf') },
    { c: ['nec-and-suf', 'iff-eq'], hard: true, f: (r) => necessary(r, 'both') },
  ]);
  function necessary(rng, kind) {
    const S = {
      nec: [['it is a weekday', 'there are regular school hours', 'It must be a weekday to have regular school hours.'], ['you have a ticket', 'you board the plane', 'You must have a ticket to board the plane.'], ['the number is even', 'the number is divisible by 4', 'A number must be even to be divisible by 4.']],
      suf: [['an integer (3 or more) is prime', 'it is odd', 'If an integer 3 or greater is prime, it must be odd.'], ['a number is divisible by 10', 'it is divisible by 5', 'If a number is divisible by 10, it is divisible by 5.'], ['a function is differentiable', 'it is continuous', 'If a function is differentiable on an interval, it is continuous there.']],
      both: [['I am playing minecraft', 'my son is playing minecraft', 'My son and I only play minecraft together, never alone.'], ['num is even', 'num % 2 == 0', 'An integer is even if and only if it is divisible by 2.']],
    };
    const [a, b, sent] = rng.pick(S[kind]);
    const rows = [`A true, B true`, `A true, B false`, `A false, B true`, `A false, B false`];
    const label = (k) => ({ nec: 'necessary', suf: 'sufficient', both: 'necessary and sufficient' }[k]);
    if (kind === 'both') {
      const m = mc(rng, c('A == B'), [{ text: c('A != B'), concept: 'xor-neq' }, { text: c('A || B'), concept: 'nec-and-suf' }, { text: c('A && B'), concept: 'nec-and-suf' }]);
      return Object.assign({
        type: 'mc', prompt: `${esc(sent)} Let A = "${esc(a)}" and B = "${esc(b)}". Which Java expression is always true?`,
        steps: ['A is necessary AND sufficient for B: they are either both true or both false.', 'That is if and only if, which is == for booleans.', `Answer: ${B(c('A == B'))}`],
        parts: [P.num('How many of the four true/false combinations are impossible?', 2, 'nec-and-suf', 'A true with B false, and A false with B true.'), P.pick('Which expression?', m.choices, m.correct, 'nec-and-suf', 'Same truth value: A == B.')],
      }, m);
    }
    const imp = kind === 'nec' ? 2 : 1;
    const m = mc(rng, rows[imp], [{ text: rows[kind === 'nec' ? 1 : 2], concept: kind === 'nec' ? 'sufficient' : 'necessary' }, { text: rows[0], concept: kind }, { text: rows[3], concept: kind }].map((x) => Object.assign(x, { concept: x.concept === 'nec' ? 'necessary' : x.concept === 'suf' ? 'sufficient' : x.concept })));
    return Object.assign({
      type: 'mc', prompt: `${esc(sent)} Let A = "${esc(a)}" and B = "${esc(b)}". Which combination is ${B('impossible')}?`,
      steps: [`A is ${label(kind)} for B.`, kind === 'nec' ? 'Necessary: without A there is no B, so A false with B true cannot happen. (A can be true while B is false.)' : 'Sufficient: A guarantees B, so A true with B false cannot happen. (B can happen some other way.)', `Answer: ${B(rows[imp])}`],
      parts: [
        P.pick('Is A necessary or sufficient for B?', ['necessary', 'sufficient'], kind === 'nec' ? 0 : 1, kind === 'nec' ? 'necessary' : 'sufficient', kind === 'nec' ? '"must ... to ..." describes a requirement: necessary.' : '"if ... then must ..." describes a guarantee: sufficient.'),
        P.pick('Which combination is impossible?', m.choices, m.correct, kind === 'nec' ? 'necessary' : 'sufficient', kind === 'nec' ? 'B cannot happen without A.' : 'A always brings B.'),
      ],
    }, m);
  }

  // =====================================================================
  // 2.5–2.6 null and short-circuiting
  // =====================================================================
  gen('u2-short-circuit', 'Short-circuit evaluation', 'cs2-short-circuit', [
    { c: ['short-and', 'guard-order'], f: (r) => shortC(r, 'guard') },
    { c: ['guard-order', 'short-and'], hard: true, f: (r) => shortC(r, 'late') },
    { c: ['short-or'], f: (r) => shortC(r, 'or') },
    { c: ['npe', 'null-ref', 'guard-order'], hard: true, f: (r) => shortC(r, 'null') },
    { c: ['bounds-guard', 'guard-order'], f: (r) => shortC(r, 'bounds') },
  ]);
  function shortC(rng, kind) {
    let src, left, rightEval, cpt;
    const a = rng.int(4, 20), k = rng.int(1, 4);
    if (kind === 'guard' || kind === 'late' || kind === 'or') {
      const b = kind === 'guard' ? rng.pick([0, rng.int(1, 5)]) : rng.pick([0, 0, rng.int(1, 5)]);
      const cond = kind === 'guard' ? `b != 0 && a / b > ${k}` : kind === 'late' ? `a / b > ${k} && b != 0` : `b == 0 || a / b > ${k}`;
      src = `int a = ${a}, b = ${b};\nif(${cond})\n  System.out.print("hello");\nelse\n  System.out.print("world");`;
      const leftExpr = cond.split(/ && | \|\| /)[0];
      left = kind === 'late' ? (b === 0 ? 'ArithmeticException' : ev(leftExpr, { a: ['int', a], b: ['int', b] })) : ev(leftExpr, { a: ['int', a], b: ['int', b] });
      rightEval = kind === 'late' ? b !== 0 : kind === 'guard' ? left === 'true' : left === 'false';
      cpt = kind === 'or' ? 'short-or' : kind === 'late' ? 'guard-order' : 'short-and';
      const ans = result(src);
      return scPack(src, ans, leftExpr, left, rightEval, cpt, kind === 'late' ? 'The division is on the LEFT, so it runs before the guard can protect it.' : kind === 'or' ? 'true || X is true without evaluating X.' : 'false && X is false without evaluating X.');
    }
    if (kind === 'null') {
      const isNull = rng() < 0.85;
      const s = isNull ? 'null' : `"${rng.pick(['code', 'java', 'loop', 'boolean'])}"`;
      const late = rng() < 0.5;
      const cond = late ? `s.length() > ${k} && s != null` : `s != null && s.length() > ${k}`;
      src = `String s = ${s};\nif(${cond})\n  System.out.print("long");\nelse\n  System.out.print("short");`;
      const leftExpr = late ? `s.length() > ${k}` : 's != null';
      left = late && isNull ? 'NullPointerException' : ev(leftExpr, { s: ['String', isNull ? null : s.slice(1, -1)] });
      rightEval = late ? !isNull : !isNull;
      const ans = result(src);
      return scPack(src, ans, leftExpr, left, rightEval, late ? 'guard-order' : 'npe', late ? 'Calling a method on null crashes: the null check must come first.' : 'When s is null, s != null is false, so s.length() is never called.');
    }
    const str = rng.pick(['Memecraft', 'Mississippi', 'Batman', 'Zelda']);
    const ch = rng.pick(str.split(''));
    const idx = rng.pick([-1, rng.int(0, str.length - 1), str.length, str.length + 2]);
    const late = rng() < 0.4;
    const cond = late ? 'str.substring(index, index + 1).equals(c) && index >= 0 && index < str.length()' : 'index >= 0 && index < str.length() && str.substring(index, index + 1).equals(c)';
    src = `public static boolean checkChar(String str, String c, int index){\n  return ${cond};\n}\nSystem.out.print(checkChar("${str}", "${ch}", ${idx}));`;
    const inb = idx >= 0 && idx < str.length;
    const ans = result(src);
    return scPack(src, ans, late ? 'str.substring(index, index + 1)' : 'index >= 0', late ? (inb ? str[idx] : 'StringIndexOutOfBoundsException') : tf(idx >= 0), late ? inb : idx >= 0, late ? 'guard-order' : 'bounds-guard', late ? 'substring runs first, so an out-of-range index crashes before the checks.' : 'The bounds checks come first and short-circuit before substring could crash.');
  }
  function scPack(src, ans, leftExpr, left, rightEval, cpt, why) {
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans, hint: HINT_OUT,
      steps: [`Left side ${c(leftExpr)}: ${B(esc(left))}.`, rightEval ? 'The right side has to be evaluated too.' : 'The right side is skipped (short-circuit).', why, `Output: ${B(esc(ans))}`],
      parts: [
        P.text(`What does the left side ${c(leftExpr)} give? (true, false, or the exception)`, left, cpt === 'short-or' ? 'short-or' : cpt, 'Evaluate it with the given values.'),
        P.yn('Is the rest of the condition evaluated?', rightEval, cpt === 'short-or' ? 'short-or' : 'short-and', 'false && … and true || … skip the right side.'),
        P.text('What is printed?', ans, cpt, why, { hint: HINT_OUT }),
      ],
    };
  }

  // =====================================================================
  // 2.7 while loops
  // =====================================================================
  gen('u2-while-trace', 'Tracing while loops', 'cs2-while', [
    { c: ['while-repeats'], f: (r) => whileTrace(r, 'print-first') },
    { c: ['while-order', 'while-repeats'], hard: true, f: (r) => whileTrace(r, 'dec-first') },
    { c: ['while-zero'], f: (r) => whileTrace(r, 'zero') },
    { c: ['loop-priming', 'while-repeats'], f: (r) => whileTrace(r, 'prime') },
  ]);
  function whileTrace(rng, kind) {
    let src;
    if (kind === 'prime') {
      const T = rng.int(2, 4), M = rng.pick([3, 7]), K = rng.int(1, 6);
      src = `int r = 100;\nint count = 0;\nwhile(r >= ${T}){\n  r = (r * ${M} + ${K}) % 10;\n  count++;\n}\nSystem.out.print(count + " " + r);`;
    } else {
      const n = kind === 'zero' ? rng.int(-3, 0) : rng.int(3, 6), lo = kind === 'zero' ? rng.int(1, 3) : rng.int(-1, 1), s = rng.pick([1, 1, 2]);
      const body = kind === 'dec-first' ? `  x -= ${s};\n  System.out.println(x);` : `  System.out.println(x);\n  x -= ${s};`;
      src = `int x = ${n};\nwhile(x >= ${lo}){\n${body}\n}\nSystem.out.print("Blast off!");`;
    }
    const ans = result(src);
    const line = kind === 'prime' ? 3 : 2;
    const cnt = condCounts(src, line);
    const lines = printed(src).split('\n');
    return {
      type: 'text', prompt: `What does this print?${code(src)}`, answer: ans, placeholder: 'separate lines with /',
      explainHTML: traceHTML(src),
      steps: [`The condition is checked before every pass: ${cnt.all} checks, ${cnt.yes} passes.`, kind === 'dec-first' ? 'x is decreased BEFORE printing, so the starting value is never printed and the last value printed is below the limit.' : kind === 'zero' ? 'The condition is false the first time, so the body never runs.' : kind === 'prime' ? 'r starts at 100 just so the loop is entered the first time.' : 'Print, then decrease, until the condition is false.', `Output: ${B(esc(ans))}`],
      parts: [
        P.num('How many times does the loop body run?', cnt.yes, kind === 'zero' ? 'while-zero' : kind === 'prime' ? 'loop-priming' : 'while-repeats', 'Count the passes where the condition was true.'),
        P.text('What is the first line printed?', lines[0], kind === 'dec-first' ? 'while-order' : 'while-repeats', kind === 'dec-first' ? 'x changes before the first print.' : 'Trace the first pass.'),
        P.text('Full output', ans, kind === 'dec-first' ? 'while-order' : kind === 'zero' ? 'while-zero' : kind === 'prime' ? 'loop-priming' : 'while-repeats', 'Trace every pass.'),
      ],
    };
  }

  gen('u2-while-termination', 'Infinite loops', 'cs2-while', [
    { c: ['infinite-loop'], hard: true, f: whileTerm },
  ]);
  function whileTerm(rng) {
    const s = rng.int(1, 6), k = rng.pick([2, 3]), e = s + k * rng.int(2, 4) + rng.pick([0, 0, 1]);
    const op = rng() < 0.75 ? '!=' : '<';
    const src = `int x = ${s};\nwhile(x ${op} ${e}){\n  System.out.print(x + " ");\n  x += ${k};\n}\nSystem.out.print("done");`;
    const ans = result(src);
    const hits = (e - s) % k === 0;
    return {
      type: 'text', prompt: `What does this print? (If it never ends, type ${c('Infinite loop')}.)${code(src)}`, answer: ans, hint: 'Type the output, or Infinite loop.',
      steps: [`x goes ${s}, ${s + k}, ${s + 2 * k}, …`, op === '!=' ? (hits ? `x lands exactly on ${e}, so the loop stops.` : `x jumps over ${e}, so x != ${e} stays true forever: an infinite loop (a runtime error).`) : `x eventually reaches ${e} or more, so it stops.`, `Answer: ${B(esc(ans))}`],
      parts: [
        P.yn(`Does x ever equal exactly ${e}?`, hits, 'infinite-loop', `Count up from ${s} by ${k}.`),
        P.text('What is printed?', ans, 'infinite-loop', 'A condition that never becomes false never ends the loop.'),
      ],
    };
  }

  gen('u2-digits', 'Digit loops with % 10 and / 10', 'cs2-while-algos', [
    { c: ['digit-extract'], f: (r) => digits(r, 'sum') },
    { c: ['digit-extract'], f: (r) => digits(r, 'reverse') },
    { c: ['digit-extract', 'while-repeats'], f: (r) => digits(r, 'count') },
    { c: ['digit-extract', 'infinite-loop'], hard: true, f: (r) => digits(r, 'bug') },
  ]);
  function digits(rng, kind) {
    const n = rng.int(100, 99999);
    const cond = kind === 'bug' ? 'n >= 0' : 'n > 0';
    const body = { sum: '  sum += n % 10;', reverse: '  System.out.print(n % 10);', count: '  sum++;', bug: '  sum += n % 10;' }[kind];
    const src = `int n = ${n};\nint sum = 0;\nwhile(${cond}){\n${body}\n  n /= 10;\n}\n${kind === 'reverse' ? '' : 'System.out.print(sum);'}`.replace(/\n$/, '');
    const ans = result(src);
    const len = String(n).length;
    const numeric = kind === 'sum' || kind === 'count';
    return {
      type: numeric ? 'numeric' : 'text', prompt: `What is printed?${code(src)}`, answer: numeric ? Number(ans) : ans, hint: kind === 'bug' ? 'Type the output, or Infinite loop.' : undefined,
      steps: ['n % 10 is the last digit; n /= 10 chops it off.', `${n} has ${len} digits, so a correct loop runs ${len} times.`, kind === 'bug' ? 'But while(n >= 0) is still true when n reaches 0 (0 / 10 is 0): infinite loop.' : 'The loop stops when n reaches 0.', `Answer: ${B(esc(ans))}`],
      parts: [
        P.num('What is n % 10 on the first pass?', n % 10, 'digit-extract', 'The last digit.'),
        P.num('What is n after the first n /= 10?', Math.floor(n / 10), 'digit-extract', 'int division chops the last digit.'),
        kind === 'bug' ? P.yn('Does the loop ever stop?', false, 'infinite-loop', 'At n = 0 the condition n >= 0 is still true, and n stays 0.') : P.num('How many times does the loop run?', len, 'digit-extract', 'Once per digit.'),
        numeric ? P.num('What is printed?', Number(ans), 'digit-extract', 'Trace it.') : P.text('What is printed?', ans, kind === 'bug' ? 'infinite-loop' : 'digit-extract', 'Trace it.'),
      ],
    };
  }

  gen('u2-indexof', 'Finding every match with indexOf', 'cs2-while-algos', [
    { c: ['indexof-loop', 'find-all'], f: (r) => indexLoop(r, 'print') },
    { c: ['count-matches', 'find-all'], f: (r) => indexLoop(r, 'count') },
    { c: ['indexof-loop', 'infinite-loop'], hard: true, f: (r) => indexLoop(r, 'bug') },
  ]);
  function indexLoop(rng, kind) {
    const str = rng.pick(['Mississippi River', 'The Legend of Zelda', 'banana bandana', 'abracadabra', 'lollipop', 'coconut cake']);
    const ch = rng() < 0.85 ? rng.pick(str.replace(/ /g, '').split('')) : 'z';
    const upd = kind === 'bug' ? 'index = str.indexOf(ch, index);' : 'index = str.indexOf(ch, index) + 1;';
    const src = `String str = "${str}";\nString ch = "${ch}";\nint index = 0;\nint count = 0;\nwhile(str.indexOf(ch, index) >= 0){\n  ${kind === 'count' ? '' : 'System.out.print(str.indexOf(ch, index) + " ");\n  '}${upd}\n  count++;\n}\nSystem.out.print("count " + count);`;
    const ans = result(src);
    const first = str.indexOf(ch);
    const total = str.split(ch).length - 1;
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans, hint: 'Type the output, or Infinite loop.',
      steps: [`"${esc(ch)}" first appears at index ${first}.`, kind === 'bug' ? 'index is set to the match itself, not one past it, so the same match is found forever (when there is one).' : 'Moving index one past each match lets the search continue after it.', `Answer: ${B(esc(ans))}`],
      parts: [
        P.num(`What does ${c(`str.indexOf("${ch}", 0)`)} return?`, first, 'indexof-loop', 'The first match, or −1 if there is none.'),
        P.num(`How many times does "${esc(ch)}" appear in "${esc(str)}"?`, total, 'count-matches', 'Count them; indices start at 0.'),
        P.text('What is printed?', ans, kind === 'bug' ? 'indexof-loop' : kind === 'count' ? 'count-matches' : 'find-all', kind === 'bug' && total ? 'Without + 1 the loop finds the same index again and again.' : 'Trace the loop.'),
      ],
    };
  }

  gen('u2-hailstone', 'Conditionals inside loops: hailstone', 'cs2-while-algos', [
    { c: ['hailstone', 'while-repeats'], f: hailstone },
  ]);
  function hailstone(rng) {
    const n = rng.int(3, 13);
    const src = `int n = ${n};\nint steps = 0;\nwhile(n > 1){\n  if(n % 2 == 0)\n    n /= 2;\n  else\n    n = 3*n + 1;\n  steps++;\n}\nSystem.out.print(steps);`;
    const ans = Number(printed(src));
    const second = n % 2 === 0 ? n / 2 : 3 * n + 1;
    return {
      type: 'numeric', prompt: `What is printed?${code(src)}`, answer: ans,
      explainHTML: traceHTML(src, 10),
      steps: [`${n} is ${n % 2 ? 'odd' : 'even'}, so the next value is ${second}.`, 'Keep going until n is 1, counting steps.', `Answer: ${B(ans)}`],
      parts: [P.num('What is n after the first pass?', second, 'hailstone', 'Even: halve. Odd: 3n + 1.'), P.num('What is printed?', ans, 'hailstone', 'Count the passes until n is 1.')],
    };
  }

  // =====================================================================
  // 2.8 for loops
  // =====================================================================
  gen('u2-for-sum', 'for loops: parts, steps, and accumulators', 'cs2-for', [
    { c: ['accumulator', 'for-step'], f: (r) => forSum(r, 'step') },
    { c: ['for-zero'], hard: true, f: (r) => forSum(r, 'zero') },
    { c: ['min-max-bounds', 'for-zero'], f: (r) => forSum(r, 'minmax') },
    { c: ['for-parts'], hard: true, f: (r) => forSum(r, 'checks') },
  ]);
  function forSum(rng, kind) {
    let src, q, line = 3;
    const a = rng.int(1, 8), b = a + rng.int(3, 9), s = rng.pick([1, 2, 3]);
    if (kind === 'step') { src = `int sum = 0;\nint count = 0;\nfor(int i = ${a}; i ${rng() < 0.5 ? '<=' : '<'} ${b}; i += ${s}){\n  sum += i;\n  count++;\n}\nSystem.out.print(sum);`; q = 'What is printed?'; }
    else if (kind === 'zero' || kind === 'minmax') {
      const lo = kind === 'minmax' ? 'Math.min(a, b)' : 'a', hi = kind === 'minmax' ? 'Math.max(a, b)' : 'b';
      src = `public static int sumOfInts(int a, int b){\n  int sum = 0;\n  for(int i = ${lo}; i <= ${hi}; i++)\n    sum += i;\n  return sum;\n}\nSystem.out.print(sumOfInts(${b}, ${a}));`;
      q = 'What is printed?';
    } else { src = `int sum = 0;\nfor(int i = 0; i < ${b - a}; i++){\n  sum += i;\n}\nSystem.out.print(sum);`; line = 2; q = `How many times is the condition ${c(`i < ${b - a}`)} checked?`; }
    const out = Number(printed(src));
    const fl = kind === 'zero' || kind === 'minmax' ? 3 : line;
    const cnt = condCounts(src, fl);
    const answer = kind === 'checks' ? cnt.all : out;
    return {
      type: 'numeric', prompt: `${q}${code(src)}`, answer,
      steps: [
        kind === 'checks' ? 'The condition is checked before every pass AND once more when it finally fails.' : kind === 'zero' ? `sumOfInts(${b}, ${a}) starts i at ${b}, and ${b} &lt;= ${a} is false, so the loop never runs.` : kind === 'minmax' ? 'Math.min and Math.max make the loop work whichever argument is bigger.' : `i takes the values ${a}, ${a + s}, … while the condition holds.`,
        `The body runs ${cnt.yes} times.`,
        `Answer: ${B(answer)}`],
      parts: [
        P.num('How many times does the loop body run?', cnt.yes, kind === 'zero' ? 'for-zero' : kind === 'checks' ? 'for-parts' : 'for-step', 'The update runs after the body; the condition is checked before each pass.'),
        kind === 'checks' ? P.num('How many times is the condition checked?', cnt.all, 'for-parts', 'One more check than passes: the last check is the one that fails.')
          : P.num('What is printed?', out, kind === 'zero' ? 'for-zero' : kind === 'minmax' ? 'min-max-bounds' : 'accumulator', 'Add up every i the loop visits.'),
      ],
    };
  }

  gen('u2-for-while', 'for loops rewritten as while loops', 'cs2-for', [
    { c: ['for-to-while', 'for-parts'], hard: true, f: forWhile },
  ]);
  function forWhile(rng) {
    const a = rng.int(0, 3), b = a + rng.int(3, 5), s = rng.pick([1, 2]);
    const inc = s === 1 ? 'i++' : `i += ${s}`;
    const f = `for(int i = ${a}; i < ${b}; ${inc}){\n  System.out.print(i + " ");\n}`;
    const want = printed(f);
    const cand = [
      [`int i = ${a};\nwhile(i < ${b}){\n  System.out.print(i + " ");\n  ${inc};\n}`, null],
      [`int i = ${a};\nwhile(i < ${b}){\n  ${inc};\n  System.out.print(i + " ");\n}`, 'for-to-while'],
      [`int i = ${a};\nwhile(i <= ${b}){\n  System.out.print(i + " ");\n  ${inc};\n}`, 'for-parts'],
      [`int i = ${a};\n${inc};\nwhile(i < ${b}){\n  System.out.print(i + " ");\n  ${inc};\n}`, 'for-parts'],
      [`int i = ${a};\nwhile(i < ${b}){\n  System.out.print(i + " ");\n}`, 'infinite-loop'],
    ];
    const results = cand.map(([src]) => result(src));
    const rightIdx = results.findIndex((r) => r === tidy(want));
    const m = mc(rng, code(cand[rightIdx][0]), cand.filter((_, i) => i !== rightIdx && results[i] !== tidy(want)).map(([src, cpt]) => ({ text: code(src), concept: cpt || 'for-to-while' })));
    return Object.assign({
      type: 'mc', prompt: `Which while loop prints exactly the same thing as this for loop?${code(f)}`,
      steps: ['for(init; condition; update){ body } is init; while(condition){ body; update; }.', 'The update goes at the END of the while body.', `The for loop prints ${B(esc(want.trim()))}.`],
      parts: [
        P.pick('In a for loop, when does the update run?', ['after the body, before the condition is checked again', 'before the body, every pass', 'once, before the first check'], 0, 'for-parts', 'init once → check → body → update → check → …'),
        P.text('What does the for loop print?', tidy(want), 'for-parts', 'Trace it.'),
        P.pick('Which while loop matches?', m.choices, m.correct, 'for-to-while', 'Moving the update before the body shifts every printed value.'),
      ],
    }, m);
  }

  gen('u2-for-scope', 'Loop variable scope', 'cs2-for', [
    { c: ['for-scope'], hard: true, f: forScope },
  ]);
  function forScope(rng) {
    const n = rng.int(3, 7);
    const V = [
      `int sum = 0;\nfor(int i = 0; i < ${n}; i++){\n  sum += i;\n}\nSystem.out.print(sum + " " + i);`,
      `int sum = 0;\nint i;\nfor(i = 0; i < ${n}; i++){\n  sum += i;\n}\nSystem.out.print(sum + " " + i);`,
      `int i = 5;\nint sum = 0;\nfor(int i = 0; i < ${n}; i++){\n  sum += i;\n}\nSystem.out.print(sum);`,
      `for(int i = 0; i < ${n}; i++){\n  int t = i * 2;\n}\nSystem.out.print(t);`,
      `int sum = 0;\nfor(int i = 0; i < ${n}; i++){\n  sum += i;\n}\nfor(int i = 0; i < 2; i++){\n  sum += i;\n}\nSystem.out.print(sum);`,
    ];
    const src = rng.pick(V);
    const ans = result(src);
    const err = ans === 'Compile error';
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans, hint: 'Type the output, or Compile error.',
      steps: ['A variable declared inside a for header or loop body only exists inside that loop.', 'A variable declared before the loop still exists after it.', 'Declaring a name that already exists in the method is a compile error; reusing a name after its loop ended is fine.', `Answer: ${B(esc(ans))}`],
      parts: [
        P.yn('Does every variable used exist at the place it is used?', !err, 'for-scope', 'Check where each variable was declared.'),
        P.text('What is printed?', ans, 'for-scope', err ? 'cannot find symbol / already defined: it never runs.' : 'It compiles; trace it.'),
      ],
    };
  }

  gen('u2-loop-count-direction', 'Does the loop ever stop?', 'cs2-for', [
    { c: ['for-direction'], hard: true, f: (r) => loopDir(r, 'dir') },
    { c: ['for-neq-skip', 'infinite-loop'], hard: true, f: (r) => loopDir(r, 'neq') },
    { c: ['count-single', 'for-parts'], f: (r) => loopDir(r, 'ok') },
  ]);
  function loopDir(rng, kind) {
    const N = rng.int(5, 12);
    let head, ans, cpt;
    const OVER = 'About 2 billion times (until i overflows)';
    const NEVER = 'It never stops';
    if (kind === 'dir') { head = rng.pick([`for(int i = 0; i < ${N}; i--)`, `for(int i = ${N}; i > 0; i++)`]); ans = OVER; cpt = 'for-direction'; }
    else if (kind === 'neq') {
      const even = N % 2 === 0 ? N : N + 1, odd = even + 1;
      const E = rng() < 0.6 ? even : odd;
      head = `for(int i = 1; i != ${E}; i += 2)`;
      ans = E % 2 === 0 ? NEVER : `${(E - 1) / 2} times`; cpt = 'for-neq-skip';
    } else {
      head = rng.pick([`for(int i = 0; i < ${N}; i++)`, `for(int i = 1; i <= ${N}; i++)`, `for(int i = ${N}; i > 0; i--)`, `for(int i = 0; i <= ${N}; i++)`]);
      ans = `${printed(`int c = 0;\n${head}\n  c++;\nSystem.out.print(c);`)} times`; cpt = 'count-single';
    }
    const m = mc(rng, ans, [
      { text: `${N} times`, concept: 'count-single' }, { text: `${N + 1} times`, concept: 'count-single' }, { text: NEVER, concept: 'for-neq-skip' },
      { text: OVER, concept: 'for-direction' }, { text: '0 times', concept: 'for-zero' }, { text: `${N - 1} times`, concept: 'count-single' },
    ]);
    const toward = kind !== 'dir';
    return Object.assign({
      type: 'mc', prompt: `How many times does the body of this loop run? (The body does not change ${c('i')}.)${code(head + '{\n  /* body */\n}')}`,
      steps: [toward ? 'The update moves i toward the exit.' : 'The update moves i AWAY from the exit, so the condition stays true until i wraps around past Integer.MIN_VALUE / MAX_VALUE.', kind === 'neq' ? 'With i += 2 from 1, i is always odd, so it can only stop at an odd target.' : 'Count: larger − smaller, plus 1 for <= or >=.', `Answer: ${B(esc(ans))}`],
      parts: [
        P.yn('Does each update move i toward making the condition false?', toward, kind === 'dir' ? 'for-direction' : 'for-parts', 'Compare the direction of the update with the condition.'),
        P.pick('How many times does it run?', m.choices, m.correct, cpt, kind === 'dir' ? 'int overflow eventually breaks the loop after about 2^31 passes.' : kind === 'neq' ? '!= only stops if i lands exactly on the target.' : 'larger − smaller (+1 for <=).'),
      ],
    }, m);
  }

  gen('u2-primes', 'Primes, factors, and factorization', 'cs2-for-algos', [
    { c: ['prime-sqrt', 'early-return-loop'], f: (r) => primes(r, 'ok') },
    { c: ['prime-sqrt'], hard: true, f: (r) => primes(r, 'lt') },
    { c: ['smallest-factor'], f: (r) => primes(r, 'factor') },
    { c: ['prime-factorization'], f: (r) => primes(r, 'pf') },
    { c: ['early-return-loop'], hard: true, f: (r) => primes(r, 'early') },
  ]);
  function primes(rng, kind) {
    const FIND = 'public static int findFactor(int n){\n  for(int i = 2; i <= Math.sqrt(n); i++){\n    if(n % i == 0)\n      return i;\n  }\n  return n;\n}';
    let src, n;
    if (kind === 'ok' || kind === 'lt' || kind === 'early') {
      n = kind === 'lt' ? rng.pick([25, 49, 121, 169, 15, 17, 29]) : kind === 'early' ? rng.pick([9, 15, 21, 25, 35, 13, 8]) : rng.pick([25, 49, 17, 29, 51, 91, 97, 39]);
      const cond = kind === 'lt' ? 'i < Math.sqrt(n)' : 'i <= Math.sqrt(n)';
      const body = kind === 'early' ? '    if(n % i == 0)\n      return false;\n    else\n      return true;' : '    if(n % i == 0)\n      return false;';
      src = `public static boolean checkPrime(int n){\n  for(int i = 2; ${cond}; i++){\n${body}\n  }\n  return true;\n}\nSystem.out.print(checkPrime(${n}));`;
    } else if (kind === 'factor') { n = rng.pick([15, 35, 49, 77, 91, 97, 121, 143, 221]); src = `${FIND}\nSystem.out.print(findFactor(${n}));`; }
    else { n = rng.pick([60, 84, 90, 126, 210, 98, 75, 132]); src = `${FIND}\nint n = ${n};\nwhile(n > 1){\n  int f = findFactor(n);\n  System.out.print(f + " ");\n  n /= f;\n}`; }
    const ans = result(src);
    const sq = Math.sqrt(n);
    const isSq = Number.isInteger(sq);
    let smallest = n; for (let i = 2; i * i <= n; i++) if (n % i === 0) { smallest = i; break; }
    const numeric = kind === 'factor';
    const found = kind === 'lt' ? smallest !== n && smallest < sq : smallest !== n;
    const parts = kind === 'factor' || kind === 'pf'
      ? [P.num(`What does findFactor(${n}) return?`, smallest, 'smallest-factor', 'The first i from 2 up to √n that divides n, or n itself if none does.')]
      : [P.yn(`Does the loop find a factor of ${n}?`, found, 'prime-sqrt', `Math.sqrt(${n}) is ${Number(sq.toFixed(3))}; ${kind === 'lt' ? 'i &lt; √n stops one short, so the square of a prime is never caught' : 'i &lt;= √n includes the square root itself'}.`)];
    if (kind === 'early') parts[0] = P.num('How many values of i does the loop actually test before returning?', 1, 'early-return-loop', 'The else returns true on the very first pass, so only i = 2 is ever tested.');
    parts.push(numeric ? P.num('What is printed?', Number(ans), 'smallest-factor', 'The first i that divides n, or n itself if none does.') : P.text('What is printed?', ans, kind === 'pf' ? 'prime-factorization' : kind === 'early' ? 'early-return-loop' : 'prime-sqrt', 'Trace it.'));
    return {
      type: numeric ? 'numeric' : 'text', prompt: `What is printed?${code(src)}`, answer: numeric ? Number(ans) : ans, hint: numeric ? undefined : 'Type true/false or the printed numbers.',
      steps: [
        kind === 'lt' && isSq ? `With i &lt; Math.sqrt(${n}), i never reaches ${sq}, the only factor to find, so ${n} is wrongly called prime.` : kind === 'early' ? 'Returning true in the else ends the method after testing only i = 2.' : `The smallest factor of ${n} is ${smallest}.`,
        kind === 'pf' ? 'Divide out each smallest factor until n is 1.' : 'Return as soon as the answer is known.',
        `Answer: ${B(esc(ans))}`],
      parts,
    };
  }

  // =====================================================================
  // 2.8 series and overflow
  // =====================================================================
  gen('u2-series', 'Series and overflow', 'cs2-series', [
    { c: ['factorial-double', 'int-overflow-loop'], hard: true, f: (r) => series(r, 'fact') },
    { c: ['alternating-sign', 'series-sum'], f: (r) => series(r, 'alt') },
    { c: ['series-sum'], f: (r) => series(r, 'basel') },
    { c: ['int-overflow-loop'], hard: true, f: (r) => series(r, 'denom') },
  ]);
  function series(rng, kind) {
    if (kind === 'fact') {
      const n = rng.int(13, 16), dbl = rng() < 0.4;
      const mk = (t) => `${t} f = 1;\nfor(int i = 1; i <= ${n}; i++)\n  f *= i;\nSystem.out.print(f);`;
      const src = mk(dbl ? 'double' : 'int');
      const right = printed(src), other = printed(mk(dbl ? 'int' : 'double'));
      const m = mc(rng, esc(right), [{ text: esc(other), concept: 'factorial-double' }, { text: 'ArithmeticException', concept: 'int-overflow-loop' }, { text: esc(String(BigInt(1) * [...Array(n)].reduce((a, _, i) => a * BigInt(i + 1), BigInt(1)))), concept: 'int-overflow-loop' }]);
      return Object.assign({
        type: 'mc', prompt: `What is printed?${code(src)}`,
        steps: [`${n}! is about ${Number([...Array(n)].reduce((a, _, i) => a * (i + 1), 1)).toExponential(2)}, far past Integer.MAX_VALUE (about 2.1 × 10^9).`, dbl ? 'A double can hold it (printed in E notation).' : 'An int silently wraps around: no error, just a wrong number.', `Answer: ${B(esc(right))}`],
        parts: [P.yn(`Is ${n}! bigger than Integer.MAX_VALUE?`, true, 'factorial-double', '13! = 6,227,020,800 already is.'), P.yn('Does int overflow throw an exception?', false, 'int-overflow-loop', 'It wraps around silently.'), P.pick('What is printed?', m.choices, m.correct, 'factorial-double', dbl ? 'double keeps it (approximately).' : 'The int result has wrapped.')],
      }, m);
    }
    if (kind === 'alt' || kind === 'basel') {
      const n = rng.int(2, 5);
      const body = kind === 'alt' ? '  if(i % 2 == 1)\n    sum += 1.0 / i;\n  else\n    sum -= 1.0 / i;' : '  sum += 1.0 / (i * i);';
      const src = `double sum = 0;\nfor(int i = 1; i <= ${n}; i++){\n${body}\n}\nSystem.out.print(sum);`;
      const right = printed(src);
      const w1 = printed(src.replace(/1\.0 \//g, '1 /'));
      const w2 = kind === 'alt' ? printed(src.replace('sum -= 1.0', 'sum += 1.0')) : printed(src.replace('1.0 / (i * i)', 'i * i'));
      const w3 = kind === 'alt' ? printed(src.replace('i % 2 == 1', 'i % 2 == 0')) : printed(src.replace('i <= ', 'i < '));
      const m = mc(rng, esc(right), [{ text: esc(w1), concept: 'int-division' }, { text: esc(w2), concept: kind === 'alt' ? 'alternating-sign' : 'series-sum' }, { text: esc(w3), concept: kind === 'alt' ? 'alternating-sign' : 'count-single' }, { text: esc(String(n)), concept: 'series-sum' }]);
      const t1 = kind === 'alt' ? '1.0' : '1.0';
      return Object.assign({
        type: 'mc', prompt: `What is printed?${code(src)}`,
        steps: [kind === 'alt' ? 'Odd i adds 1/i, even i subtracts it: 1 − 1/2 + 1/3 − …' : 'Add 1/i² for i = 1 … n.', '1.0 / i is mixed mode (a double); 1 / i would be int division (0 for i &gt; 1).', `Answer: ${B(esc(right))}`],
        parts: [P.text('What is sum after the first pass?', t1, 'series-sum', 'i = 1: 1.0 / 1 = 1.0.'), P.yn(`Would ${c('1 / i')} give the same result as ${c('1.0 / i')}?`, false, 'int-division', '1 / 2 is 0 in int division.'), P.pick('What is printed?', m.choices, m.correct, kind === 'alt' ? 'alternating-sign' : 'series-sum', 'Trace every term.')],
      }, m);
    }
    const i = rng.pick([600, 700, 800, 1000]);
    const src = `int i = ${i};\nint d = 2 * i * (2 * i + 1) * (2 * i + 2);\nSystem.out.print(d);`;
    const right = printed(src);
    const fixed = printed(`int i = ${i};\ndouble d = 2.0 * i * (2 * i + 1) * (2 * i + 2);\nSystem.out.print(d);`);
    const m = mc(rng, esc(right), [{ text: esc(fixed), concept: 'int-overflow-loop' }, { text: 'ArithmeticException', concept: 'int-overflow-loop' }, { text: 'Compile error', concept: 'int-overflow-loop' }]);
    return Object.assign({
      type: 'mc', prompt: `The Nilakantha series uses denominators like this. What is printed?${code(src)}`,
      steps: [`The true value is about ${Number(fixed).toExponential(3)}, bigger than Integer.MAX_VALUE.`, 'int arithmetic wraps around silently.', `Fix: mixed mode, e.g. ${c('2.0 * i * …')}. Answer: ${B(esc(right))}`],
      parts: [P.yn('Is the true product bigger than Integer.MAX_VALUE (about 2.1 billion)?', true, 'int-overflow-loop', `It is about ${Number(fixed).toExponential(2)}.`), P.pick('What is printed?', m.choices, m.correct, 'int-overflow-loop', 'Overflow wraps: no error, wrong value.')],
    }, m);
  }

  // =====================================================================
  // 2.9 Euler lab pieces
  // =====================================================================
  gen('u2-euler', "Building blocks from the Euler's formula lab", 'cs2-euler', [
    { c: ['round3-manual'], hard: true, f: (r) => euler(r, 'round') },
    { c: ['zero-tolerance'], f: (r) => euler(r, 'zero') },
    { c: ['power-loop'], f: (r) => euler(r, 'power') },
    { c: ['complex-cases'], f: (r) => euler(r, 'complex') },
  ]);
  function euler(rng, kind) {
    let src, why, cpt = { round: 'round3-manual', zero: 'zero-tolerance', power: 'power-loop', complex: 'complex-cases' }[kind], part1;
    if (kind === 'round') {
      const x = (rng() < 0.6 ? -1 : 1) * (rng.int(1, 9) + rng.int(1000, 9999) / 10000);
      src = `public static double round3(double num){\n  return (int)(num * 1000 + 0.5) / 1000.0;\n}\nSystem.out.print(round3(${x}));`;
      const inner = printed(`System.out.print(${x} * 1000 + 0.5);`);
      part1 = P.text(`What is ${c(`${x} * 1000 + 0.5`)}? (Java prints doubles in full)`, inner, 'round3-manual', 'Multiply first, then add.');
      why = x < 0 ? 'For negatives, adding 0.5 and truncating toward zero rounds the wrong way. Negatives need − 0.5.' : 'For positives, + 0.5 then truncate rounds correctly.';
    } else if (kind === 'zero') {
      const v = rng.pick(['-2.5', '2.5', '0.00000000000023', '-0.00000000000023', '-0.001']);
      const good = rng() < 0.5;
      src = `public static boolean zero(double num){\n  return ${good ? 'num <= 1E-10 && num >= -1E-10' : 'num <= 1E-10'};\n}\nSystem.out.print(zero(${v}));`;
      part1 = P.yn(`Is |${v}| at most 1E-10?`, Math.abs(Number(v)) <= 1e-10, 'zero-tolerance', '1E-10 is 0.0000000001.');
      why = good ? 'Both bounds are checked, so only values very near 0 count.' : 'Only the upper bound is checked, so every negative number counts as "zero": a bug.';
    } else if (kind === 'power') {
      const a = rng.int(2, 4), b = rng.int(2, 4), off = rng() < 0.5;
      src = `public static double power(double a, int b){\n  double result = 1;\n  for(int i = 0; i ${off ? '<=' : '<'} b; i++)\n    result *= a;\n  return result;\n}\nSystem.out.print(power(${a}, ${b}));`;
      part1 = P.num('How many times does the loop multiply?', off ? b + 1 : b, 'power-loop', off ? 'i = 0 … b inclusive is b + 1 passes: one extra multiplication.' : 'i = 0 … b − 1 is b passes.');
      why = off ? 'i &lt;= b runs one time too many.' : 'Exactly b multiplications.';
    } else {
      const a = rng.pick([0, 2, -1.5, 3]), b = rng.pick([0, 2, -2, 0.5]);
      src = `public static void show(double a, double b){\n  if(a == 0 && b == 0)\n    System.out.print(0.0);\n  else if(a == 0)\n    System.out.print(b + "i");\n  else if(b == 0)\n    System.out.print(a);\n  else if(b > 0)\n    System.out.print(a + " + " + b + "i");\n  else\n    System.out.print(a + " - " + (-b) + "i");\n}\nshow(${a}, ${b});`;
      part1 = P.pick('Which case applies?', ['both zero', 'only a is zero', 'only b is zero', 'b positive', 'b negative'], a === 0 && b === 0 ? 0 : a === 0 ? 1 : b === 0 ? 2 : b > 0 ? 3 : 4, 'complex-cases', 'Check the cases in order.');
      why = 'The chain handles each case once, in order; a − bi prints −b so it shows "2.0 - 2.0i", not "2.0 + -2.0i".';
    }
    const ans = result(src);
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans,
      steps: [why, `Answer: ${B(esc(ans))}`, 'Doubles always print with a decimal point.'].slice(0, 3),
      parts: [part1, P.text('What is printed?', ans, cpt, why)],
    };
  }

  // =====================================================================
  // 2.10 String algorithms
  // =====================================================================
  gen('u2-reverse', 'Reversing a String', 'cs2-strings', [
    { c: ['reverse-string'], f: (r) => reverse(r, 'ok') },
    { c: ['loop-bounds-string', 'reverse-string'], hard: true, f: (r) => reverse(r, rng2(r)) },
  ]);
  function rng2(rng) { return rng() < 0.5 ? 'start' : 'stop'; }
  function reverse(rng, kind) {
    const w = rng.pick(['Batman', 'hello', 'Zelda', 'loops', 'Java', 'stack']);
    const init = kind === 'start' ? 'str.length()' : 'str.length() - 1';
    const cond = kind === 'stop' ? 'i > 0' : 'i >= 0';
    const src = `String str = "${w}";\nfor(int i = ${init}; ${cond}; i--)\n  System.out.print(str.substring(i, i + 1));`;
    const ans = result(src);
    return {
      type: 'text', prompt: `What is printed?${code(src)}`, answer: ans, hint: HINT_OUT,
      steps: [`"${w}" has length ${w.length}: valid indices 0 to ${w.length - 1}.`, kind === 'start' ? `Starting at ${w.length} asks for substring(${w.length}, ${w.length + 1}), past the end: crash.` : kind === 'stop' ? 'i &gt; 0 stops before index 0, so the first letter is never printed.' : 'From the last index down to 0, one character each.', `Answer: ${B(esc(ans))}`],
      parts: [
        P.num('What is the first value of i?', kind === 'start' ? w.length : w.length - 1, 'loop-bounds-string', 'Look at the initialization.'),
        P.num('What is the last value of i for which the body runs?', kind === 'stop' ? 1 : 0, 'loop-bounds-string', 'Look at the condition.'),
        P.text('What is printed?', ans, kind === 'ok' ? 'reverse-string' : 'loop-bounds-string', 'Valid indices are 0 … length − 1.'),
      ],
    };
  }

  // =====================================================================
  // 2.11 nested loops
  // =====================================================================
  gen('u2-grid', 'Nested loops: grids', 'cs2-nested-loops', [
    { c: ['nested-grid', 'which-var'], f: (r) => grid(r, ['i', 'j']) },
    { c: ['which-var', 'nested-grid'], hard: true, f: (r) => grid(r, ['R - i', 'C - j']) },
    { c: ['i-plus-j', 'nested-grid'], f: (r) => grid(r, ['i + j', 'K - i - j']) },
  ]);
  function grid(rng, exprs) {
    const R = rng.int(2, 4), C = rng.int(2, 4);
    const ex = rng.pick(exprs).replace('R', R - 1).replace('C', C - 1).replace('K', R + C);
    const iDown = rng() < 0.25;
    const src = `for(int i = ${iDown ? `${R - 1}; i >= 0; i--` : `0; i < ${R}; i++`}){\n  for(int j = 0; j < ${C}; j++){\n    System.out.print(${ex} + " ");\n  }\n  System.out.println();\n}`;
    const out = printed(src);
    const rows = out.split('\n').filter((x) => x !== '');
    const ans = tidy(out);
    return {
      type: 'text', prompt: `What is printed? (Write each line, separated by /.)${code(src)}`, answer: ans, placeholder: 'e.g. 0 0 0 / 1 1 1',
      steps: [`The outer loop runs ${R} times (rows); for each, the inner loop runs ${C} times (columns).`, `Each entry prints ${c(ex)}; println ends the row.`, `Answer: ${B(esc(ans))}`],
      parts: [
        P.num('How many lines (rows) are printed?', R, 'nested-grid', 'One row per outer pass, ended by println.'),
        P.num('How many numbers are on each line?', C, 'nested-grid', 'The inner loop runs fully every outer pass.'),
        P.text('What is the first line?', rows[0].trim(), ex.includes('+') || ex.includes('K') ? 'i-plus-j' : 'which-var', `Use the first value of i and every j.`),
        P.text('Full output', ans, ex.includes('+') ? 'i-plus-j' : 'which-var', 'Row by row.'),
      ],
    };
  }

  gen('u2-triangle', 'Nested loops: triangles and patterns', 'cs2-triangles', [
    { c: ['triangle-bound'], f: (r) => triangle(r, '<=') },
    { c: ['triangle-bound'], hard: true, f: (r) => triangle(r, '<') },
    { c: ['triangle-bound', 'which-var'], f: (r) => triangle(r, 'down') },
    { c: ['pattern-condition'], f: (r) => triangle(r, 'pattern') },
  ]);
  function triangle(rng, kind) {
    const n = rng.int(3, 5);
    let src;
    if (kind === 'pattern') {
      const k = rng.int(n - 1, n + 1);
      src = `for(int i = 0; i < ${n}; i++){\n  for(int j = 0; j < ${n}; j++){\n    if(i + j >= ${k})\n      System.out.print("$");\n    else\n      System.out.print("#");\n  }\n  System.out.println();\n}`;
    } else if (kind === 'down') src = `for(int i = ${n - 1}; i >= 0; i--){\n  for(int j = 0; j <= i; j++){\n    System.out.print(j + " ");\n  }\n  System.out.println();\n}`;
    else src = `for(int i = 0; i < ${n}; i++){\n  for(int j = 0; j ${kind} i; j++){\n    System.out.print(i + " ");\n  }\n  System.out.println();\n}`;
    const out = printed(src);
    const lines = out.split('\n').slice(0, n);
    const count = (l) => (kind === 'pattern' ? l.length : l.trim() ? l.trim().split(/\s+/).length : 0);
    const total = lines.reduce((s, l) => s + count(l), 0);
    const ans = tidy(out);
    return {
      type: 'text', prompt: `What is printed? (Write each line, separated by /. Write an empty line as nothing between slashes.)${code(src)}`, answer: ans,
      accept: [ans.replace(/^\s*\/\s*/, '')],
      steps: [kind === 'pattern' ? `Print $ when i + j &gt;= ${src.match(/>= (\d+)/)[1]}, # otherwise.` : kind === '<' ? 'j &lt; i: when i is 0 the inner loop never runs, so the first line is empty.' : 'The inner loop bound depends on i, so each row has a different length.', `Items per row: ${lines.map(count).join(', ')}.`, `Answer: ${B(esc(ans))}`],
      parts: [
        P.num('How many items are on the first line?', count(lines[0]), kind === 'pattern' ? 'pattern-condition' : 'triangle-bound', kind === '<' ? 'When i = 0, j &lt; 0 is false right away.' : 'Look at the inner bound when i has its first value.'),
        P.num('How many items are printed in total?', total, kind === 'pattern' ? 'pattern-condition' : 'triangle-bound', 'Add up the rows.'),
        P.text('Full output', ans, kind === 'pattern' ? 'pattern-condition' : 'triangle-bound', 'Row by row.'),
      ],
    };
  }

  // =====================================================================
  // 2.12 counting iterations
  // =====================================================================
  gen('u2-count', 'Counting loop iterations', 'cs2-counting', [
    { c: ['count-single'], f: (r) => countLoops(r, 'single') },
    { c: ['count-rect', 'count-single'], f: (r) => countLoops(r, 'rect') },
    { c: ['count-triangle'], hard: true, f: (r) => countLoops(r, 'tri') },
    { c: ['count-symbolic'], hard: true, f: (r) => countLoops(r, 'sym') },
  ]);
  function countLoops(rng, kind) {
    const op = () => rng.pick(['<', '<=']);
    if (kind === 'sym') {
      const o1 = op(), o2 = op();
      const src = `public static void printAs(int a1, int a2, int b1, int b2){\n  for(int i = a1; i ${o1} a2; i++){\n    for(int j = b1; j ${o2} b2; j++){\n      System.out.print("A");\n    }\n  }\n}`;
      const f = (x, y) => `(a2 - a1${x ? ' + 1' : ''}) * (b2 - b1${y ? ' + 1' : ''})`;
      const right = f(o1 === '<=', o2 === '<=');
      const m = mc(rng, c(right), [[false, false], [true, false], [false, true], [true, true]].map(([x, y]) => ({ text: c(f(x, y)), concept: 'count-single' })));
      const a1 = 2, a2 = 6, b1 = 1, b2 = 4;
      const n = Number(printed(`int c = 0;\nfor(int i = ${a1}; i ${o1} ${a2}; i++)\n  for(int j = ${b1}; j ${o2} ${b2}; j++)\n    c++;\nSystem.out.print(c);`));
      return Object.assign({
        type: 'mc', prompt: `Precondition: a1 &lt;= a2 and b1 &lt;= b2. How many times is "A" printed?${code(src)}`,
        steps: ['Each loop runs larger − smaller times, plus 1 if its condition uses &lt;=.', 'Nested rectangular loops multiply.', `Answer: ${B(c(right))}`],
        parts: [
          P.num(`Check with numbers: printAs(${a1}, ${a2}, ${b1}, ${b2}) prints how many A's?`, n, 'count-rect', 'Count each loop and multiply.'),
          P.pick('How many times in general?', m.choices, m.correct, 'count-symbolic', '+1 only for the loops that use &lt;=.'),
        ],
      }, m);
    }
    let src;
    const a = rng.int(0, 20), b = a + rng.int(3, 12), c1 = rng.int(0, 10), d = c1 + rng.int(2, 9);
    const o1 = op(), o2 = op();
    if (kind === 'single') src = `for(int i = ${a}; i ${o1} ${b}; i++)\n  System.out.print("A");`;
    else if (kind === 'rect') src = `for(int i = ${a}; i ${o1} ${b}; i++){\n  for(int j = ${c1}; j ${o2} ${d}; j++){\n    System.out.print("A");\n  }\n}`;
    else { const n = rng.int(4, 9); src = `for(int i = 0; i < ${n}; i++){\n  for(int j = 0; j ${o2} i; j++){\n    System.out.print("A");\n  }\n}`; }
    const counted = Number(printed(src.replace(/System\.out\.print\("A"\);/, 'count++;').replace(/^/, 'int count = 0;\n') + '\nSystem.out.print(count);'));
    const outer = kind === 'tri' ? Number(src.match(/i < (\d+)/)[1]) : b - a + (o1 === '<=' ? 1 : 0);
    const parts = [P.num('How many times does the outer loop run?', outer, 'count-single', 'larger − smaller, +1 for &lt;=.')];
    if (kind === 'rect') parts.push(P.num('How many times does the inner loop run each pass?', d - c1 + (o2 === '<=' ? 1 : 0), 'count-single', 'Same rule.'));
    if (kind === 'tri') parts.push(P.num('When i is 0, how many times does the inner loop run?', o2 === '<=' ? 1 : 0, 'count-triangle', o2 === '<=' ? 'j = 0 only.' : '0 &lt; 0 is false: zero times.'));
    parts.push(P.num('How many A\'s in total?', counted, kind === 'tri' ? 'count-triangle' : kind === 'rect' ? 'count-rect' : 'count-single', kind === 'tri' ? (o2 === '<=' ? '1 + 2 + … + n = n(n + 1)/2.' : '0 + 1 + … + (n − 1) = n(n − 1)/2.') : 'Multiply the counts.'));
    return {
      type: 'numeric', prompt: `How many times is "A" printed?${code(src)}`, answer: counted,
      steps: [`Outer loop: ${outer} times.`, kind === 'tri' ? 'The inner bound depends on i, so add the row lengths (a triangular number).' : kind === 'rect' ? 'Inner loop the same every time: multiply.' : 'larger − smaller, plus 1 for &lt;=.', `Answer: ${B(counted)}`],
      parts,
    };
  }

  // =====================================================================
  // 2.1 algorithms
  // =====================================================================
  gen('u2-algorithms', 'Algorithms with selection and repetition', 'cs2-algorithms', [
    { c: ['exceptions-first', 'sign-encodes-result'], f: (r) => algo(r, 'stratego') },
    { c: ['return-exits', 'exceptions-first'], hard: true, f: (r) => algo(r, 'unreachable') },
    { c: ['loop-replaces-repeat'], f: (r) => algo(r, 'loop') },
    { c: ['algo-describe', 'return-exits'], f: (r) => algo(r, 'pachisi') },
  ]);
  function algo(rng, kind) {
    if (kind === 'loop') {
      const k = rng.int(4, 8);
      const right = `for(int i = 0; i < ${k}; i++)`;
      const m = mc(rng, c(right), [{ text: c(`for(int i = 0; i <= ${k}; i++)`), concept: 'count-single' }, { text: c(`for(int i = 1; i < ${k}; i++)`), concept: 'count-single' }, { text: c(`for(int i = ${k}; i >= 0; i--)`), concept: 'count-single' }]);
      return Object.assign({
        type: 'mc', prompt: `This code repeats ${c('if(Math.random() < p) count++;')} exactly ${k} times, written out ${k} times in a row. Which loop header (around one copy) does the same thing?`,
        steps: ['A loop replaces repeated identical code.', `It must run exactly ${k} times.`, `0 to ${k - 1} is ${k} values: ${B(c(right))}`],
        parts: [P.num(`How many times does ${c(`for(int i = 0; i <= ${k}; i++)`)} run?`, k + 1, 'count-single', '&lt;= adds one.'), P.pick('Which header?', m.choices, m.correct, 'loop-replaces-repeat', `It must run exactly ${k} times.`)],
      }, m);
    }
    if (kind === 'pachisi') {
      const k = rng.int(0, 6);
      const src = `public static int getMoveValue(int count){\n  if(count == 0)\n    return 25;\n  if(count == 1)\n    return 10;\n  return count;\n}\npublic static boolean extraTurn(int count){\n  return count == 0 || count == 1 || count == 6;\n}\nSystem.out.print(getMoveValue(${k}) + " " + extraTurn(${k}));`;
      const ans = result(src);
      return {
        type: 'text', prompt: `In Pachisi, ${k} cowrie shells land up. What is printed?${code(src)}`, answer: ans,
        steps: ['Each step of the algorithm is its own method: count, move value, extra turn.', 'A return ends the method immediately, so later checks are skipped.', `Answer: ${B(esc(ans))}`],
        parts: [P.text(`What does getMoveValue(${k}) return?`, ans.split(' ')[0], 'return-exits', 'The first matching return wins.'), P.text(`What does extraTurn(${k}) return?`, ans.split(' ')[1], 'algo-describe', '0, 1, or 6 shells give another turn.')],
      };
    }
    const pairs = [[1, 10], [3, 11], [10, 1], [11, 3], [5, 5], [7, 4], [2, 9], [8, 8]];
    const [at, df] = rng.pick(pairs);
    const special = 'if(attack == 1 && defend == 10)\n    return 1;\n  if(attack == 3 && defend == 11)\n    return 1;';
    const src = kind === 'unreachable'
      ? `public static int result(int attack, int defend){\n  return attack - defend;\n  ${special}\n}\nSystem.out.print(result(${at}, ${df}));`
      : `public static int result(int attack, int defend){\n  ${special}\n  return attack - defend;\n}\nSystem.out.print(result(${at}, ${df}));`;
    const ans = result(src);
    const isSpecial = (at === 1 && df === 10) || (at === 3 && df === 11);
    const v = Number(ans);
    return {
      type: 'text', prompt: `Stratego: a positive result means the attacker wins, 0 a tie, negative the defender. Ranks: spy 1, miner 3, marshal 10, bomb 11. What is printed?${code(src)}`, answer: ans, hint: 'Type the number, or Compile error.',
      steps: [kind === 'unreachable' ? 'The general rule returns first, so the special-case ifs after it can never run: Java rejects that as an unreachable statement.' : 'The exceptions (spy beats marshal, miner beats bomb) are checked first and return early.', kind === 'unreachable' ? 'Handle exceptions to the rule BEFORE the general rule.' : 'Otherwise attack − defend encodes the result in its sign.', `Answer: ${B(esc(ans))}`],
      parts: [
        P.yn(`Is (${at} attacks ${df}) one of the special cases?`, isSpecial, 'exceptions-first', 'Spy (1) attacking marshal (10), or miner (3) attacking bomb (11).'),
        kind === 'unreachable' ? P.yn('Can any statement after the first return ever run?', false, 'return-exits', 'return ends the method; code after an unconditional return is unreachable (compile error).')
          : P.pick('Who wins?', ['attacker', 'tie', 'defender'], v > 0 ? 0 : v === 0 ? 1 : 2, 'sign-encodes-result', 'Positive: attacker. 0: tie. Negative: defender.'),
        P.text('What is printed?', ans, kind === 'unreachable' ? 'return-exits' : 'sign-encodes-result', 'Trace it.', { hint: 'Type the number, or Compile error.' }),
      ],
    };
  }
})();
