// AP CSA Unit 2 · Selection and Iteration — lessons 2.7 to 2.12 (while, for, series, Euler lab,
// String algorithms, nested loops, counting iterations). Pushes lesson objects onto window.LESSONS.
// Every runnable snippet goes through show()/showErr(), which records it so the test harness can
// confirm JavaLite really prints what the lesson claims.
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);
  const K = window.CSKit;
  const { code, compare, rule, c, call, check, outBox } = K;
  const esc = (s) => PR.esc(s);
  const titleOf = (id) => ((window.CS_LESSONS || []).find((l) => l.id === id) || {}).title || id;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // build(show, showErr) -> { html, specs (CSKit.mount table), sims(el) -> cleanup }
  function lesson(order, id, build) {
    LESSONS.push({
      unit: 2, order, id, title: titleOf(id),
      render(el) {
        const examples = [];
        const show = (src, out, opts) => { examples.push({ src, out }); return code(src, opts) + outBox(out); };
        const showErr = (src, out, err, msg) => { examples.push({ src, out, err }); return code(src) + outBox(out, msg || err); };
        const b = build(show, showErr);
        this._examples = examples;
        this._specs = b.specs || {};
        el.innerHTML = b.html;
        const c1 = K.mount(el, b.specs || {});
        const c2 = b.sims ? b.sims(el) : null;
        return () => { c1(); if (c2) c2(); };
      },
    });
  }

  // small seeded generator so the dice tracer is repeatable until you edit the code
  function seeded(s) { return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }

  // =====================================================================
  // 2.7 while loops
  // =====================================================================
  lesson(12, 'cs2-while', (show, showErr) => ({
    html: `
<p class="lead">An if statement asks its question once. A while loop asks the same question again and again, running its body each time the answer is true, and stopping the first time the answer is false. That one change is what lets a program count down, keep rolling dice, or chew through every digit of a number.</p>

<h2>An if statement that keeps asking</h2>
${rule('while (condition) { body }', 'where <b>condition</b> must be a boolean, exactly like an if. When it is true the body runs, then Java jumps back up and checks the condition <i>again</i>. When it is false, Java skips past the loop and continues after the closing brace.')}
<p>Everything you know about if statements carries over:</p>
<ul>
<li>The condition must be a boolean (<code>while (x)</code> with an int x does not compile).</li>
<li>Braces work the same way: with no braces, only the next single statement is the body. With two or more statements, braces are required.</li>
</ul>
<p>The one difference: an if body runs <b>at most once</b>. A while body runs <b>as long as the condition stays true</b>, rechecking before every pass.</p>
<p>Step through the countdown below. Watch the condition line turn green (true, run the body) and finally red (false, exit).</p>
<div data-cs="tracer" data-id="count"></div>

<h2>The order inside the body matters</h2>
<p>Swap the two lines in the body and the output shifts by one in both directions:</p>
${compare([
      { title: 'Print, then decrement', src: 'int x = 5;\nwhile (x >= 0) {\n    System.out.println(x);\n    x--;\n}\nSystem.out.print("Blast off!");', note: 'Prints 5 4 3 2 1 0, then Blast off!' },
      { title: 'Decrement, then print', src: 'int x = 5;\nwhile (x >= 0) {\n    x--;\n    System.out.println(x);\n}\nSystem.out.print("Blast off!");', note: 'Prints 4 3 2 1 0 −1, then Blast off!' },
    ])}
<p>Why does the second one never print 5, but does print −1? Because x is decreased <i>before</i> the first print, so the first value shown is 4. And when x is 0, the check <code>0 &gt;= 0</code> is still true, so the body runs one more time: x becomes −1, and −1 is printed. The condition is only checked at the top, never in the middle of the body.</p>
${show('int x = 5;\nwhile (x >= 0) {\n    x--;\n    System.out.println(x);\n}\nSystem.out.print("Blast off!");', '4\n3\n2\n1\n0\n-1\nBlast off!')}

<h2>A loop can run zero times</h2>
<p>The condition is checked <i>before</i> the first pass, too. If it starts out false, the body never runs at all:</p>
${show('int x = -3;\nwhile (x >= 0) {\n    System.out.println(x);\n    x--;\n}\nSystem.out.print("Blast off!");', 'Blast off!')}

<h2>Infinite loops</h2>
<p>A loop only ends when its condition becomes false. If nothing in the body ever makes that happen, the loop runs forever. That is an <b>infinite loop</b>, a runtime error: the program compiles fine and then never finishes (your IDE eventually stops it, or you press stop).</p>
<p>The classic version forgets to change the variable at all. The sneakier version changes it, but steps right over the stopping value:</p>
${compare([
      { title: 'Never stops', bad: true, src: 'int x = 5;\nwhile (x != 10) {\n    System.out.println(x);\n    x += 2;\n}', note: 'x goes 5, 7, 9, 11, 13 … it is never exactly 10, so x != 10 is always true.' },
      { title: 'Stops', good: true, src: 'int x = 5;\nwhile (x <= 10) {\n    System.out.println(x);\n    x += 2;\n}', note: 'Prints 5 7 9. When x reaches 11, 11 <= 10 is false, so the loop ends.' },
    ])}
<p>Run the broken one in the tracer. JavaLite gives up after a few hundred steps and reports the infinite loop instead of freezing your browser:</p>
<div data-cs="tracer" data-id="inf"></div>
<p>Changing the condition to <code>x != 11</code> would also stop (5, 7, 9, then 11 ends it), but only because 11 happens to be on the path. <code>&lt;=</code> is safer: it stops no matter which values the loop lands on.</p>

<h2>Priming the loop</h2>
<p>Sometimes you can't know how many passes you need ahead of time. In this dice game you keep rolling as long as you roll at least a 2:</p>
<div data-cs="tracer" data-id="dice"></div>
<p>Look at <code>int roll = 100;</code>. That value is never added to the sum, and no die shows 100. It is there only so <code>roll &gt;= 2</code> is true the first time, which guarantees the loop runs at least once. The first line inside the body immediately replaces it with a real roll. Giving a loop variable a starting value that forces the first pass is called <b>priming</b> the loop.</p>

${call('analogy', 'Analogy: "lather, rinse, repeat"', 'Shampoo instructions are an infinite loop: nothing says when to stop. A real loop always needs the "until your hair is clean" part, and something in the body has to move you toward it.')}
${call('mistake', 'Common mistakes', '<ul><li>Forgetting to change the loop variable in the body (instant infinite loop).</li><li>Using <code>!=</code> when the variable can jump over the stopping value. Prefer <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code>, <code>&gt;=</code>.</li><li>Assuming the condition is checked in the middle of the body. It is only checked at the top, before each pass.</li></ul>')}
${call('ap', 'On the AP exam', 'Expect "what is printed?" loops where the order of the update and the print matters, and "which change fixes this infinite loop?" questions. Trace with a table: one row per pass, showing each variable and the condition.')}
${check('What is printed?<pre class="code"><span class="ln">int n = 1;</span><span class="ln">while (n &lt; 20) {</span><span class="ln">    n *= 3;</span><span class="ln">}</span><span class="ln">System.out.print(n);</span></pre>', ['9', '20', '27', '81'], 2, 'n goes 1 → 3 → 9 → 27. When n is 9, 9 < 20 is true, so it becomes 27. Then 27 < 20 is false and the loop ends: 27.')}
${check('Which loop is infinite?', ['<code>int x = 0; while (x &lt; 10) x += 3;</code>', '<code>int x = 0; while (x != 9) x += 3;</code>', '<code>int x = 1; while (x != 9) x += 3;</code>', '<code>int x = 20; while (x &lt; 10) x++;</code>'], 2, 'Starting at 1 and adding 3 gives 1, 4, 7, 10, 13 … it jumps over 9, so x != 9 is true forever. Option B does land on 9 (0, 3, 6, 9) and stops; option D never runs at all.')}
`,
    specs: {
      count: { src: 'int x = 5;\nwhile (x >= 0) {\n    System.out.println(x);\n    x--;\n}\nSystem.out.print("Blast off!");', expect: '5\n4\n3\n2\n1\n0\nBlast off!', caption: 'Each pass: check the condition, print x, take 1 away. The last check (x is −1) is false, so the loop ends and "Blast off!" prints.' },
      inf: { src: 'int x = 5;\nwhile (x != 10) {\n    System.out.println(x);\n    x += 2;\n}\nSystem.out.print("Blast off!");', maxSteps: 120, expectError: 'InfiniteLoop', caption: 'Press "Run to end". x is never exactly 10, so the condition never turns false. Then press ✎ Edit code and change != to <= to fix it.' },
      dice: { src: 'int sum = 0;\nint roll = 100;\nwhile (roll >= 2) {\n    roll = (int)(Math.random() * 6) + 1;\n    System.out.println("Rolled a " + roll);\n    sum += roll;\n}\nSystem.out.println("Sum: " + sum);', random: seeded(7), caption: 'The first check uses the primed value 100. After that, every check uses the roll you just made. A roll of 1 still gets added to the sum, and then the loop ends.' },
    },
  }));

  // =====================================================================
  // 2.7 while loop algorithms
  // =====================================================================
  lesson(13, 'cs2-while-algos', (show, showErr) => ({
    html: `
<p class="lead">Three patterns come up again and again with while loops: peeling the digits off a number, finding every place a String appears, and following a rule until you reach a stopping value. Each one is a loop whose number of passes you don't know ahead of time.</p>

<h2>Peeling off digits with % 10 and / 10</h2>
<p>For a positive int n, two operations do all the work:</p>
${rule('n % 10   and   n / 10', 'where <b>n % 10</b> is the last digit (the remainder when you divide by 10), and <b>n / 10</b> is n with its last digit chopped off (int division truncates). Do both, over and over, and you visit every digit from right to left.')}
<p>Starting from 123456:</p>
<table class="truth"><tr><th>n</th><th>n % 10</th><th>n / 10</th></tr>
<tr><td>123456</td><td>6</td><td>12345</td></tr><tr><td>12345</td><td>5</td><td>1234</td></tr><tr><td>1234</td><td>4</td><td>123</td></tr>
<tr><td>123</td><td>3</td><td>12</td></tr><tr><td>12</td><td>2</td><td>1</td></tr><tr><td>1</td><td>1</td><td>0</td></tr></table>
<p>Once n reaches 0 you are done: 0 % 10 is 0 and 0 / 10 is 0, so repeating changes nothing. So the loop must stop when n is 0: <code>while (n &gt; 0)</code>.</p>
<div class="sim" data-sim="peel">
  <div class="sim-controls"><label>n <input type="number" data-k="n" value="47562" min="1" max="999999999" style="width:130px"></label>
  <button class="btn small primary" data-k="step">Peel one digit ▶</button><button class="btn small" data-k="reset">Reset</button></div>
  <div class="sim-readout" data-k="ro"></div>
  <div style="padding:0 16px 12px;overflow-x:auto" data-k="tbl"></div>
  <div class="sim-caption">Each press does one pass of the digit-sum loop: add n % 10 to the sum, then n /= 10. When n reaches 0, the condition n > 0 is false and the loop is over.</div>
</div>
<p>Printing the digits backwards and summing them are the same loop with a different body:</p>
${show('public static void reverseDigits(int n) {\n    while (n > 0) {\n        System.out.print(n % 10);\n        n /= 10;\n    }\n}\nreverseDigits(123456);', '654321')}
${show('public static int digitSum(int n) {\n    int sum = 0;\n    while (n > 0) {\n        sum += n % 10;\n        n /= 10;\n    }\n    return sum;\n}\nSystem.out.print(digitSum(47562));', '24')}
<p>Write <code>while (n &gt;= 0)</code> instead and you get an infinite loop. Once n hits 0, n /= 10 keeps it at 0, and 0 &gt;= 0 is true forever:</p>
<div data-cs="tracer" data-id="digitsInf"></div>

<h2>Finding every place a String appears</h2>
<p><code>indexOf(c, index)</code> searches starting at <code>index</code> and returns where it found c, or −1. To find <i>all</i> of them, keep searching from just past the last match:</p>
<div data-cs="tracer" data-id="zelda"></div>
<p>The pattern has three jobs inside the loop: remember where the match was (<code>index = str.indexOf(c, index)</code>), use it (print it), and move past it (<code>index++</code>). Forget the last one and indexOf keeps finding the same "e" at index 2 forever.</p>

<h2>Following a rule: the hailstone sequence</h2>
<p>Start with a positive integer. If it is even, halve it. If it is odd (and not 1), triple it and add 1. Stop at 1. Nobody has ever proven this always reaches 1, but it has for every number anyone has tried.</p>
<div data-cs="tracer" data-id="hail"></div>
<p>This is a loop with an if-else inside. The loop decides <i>whether</i> to keep going (<code>n &gt; 1</code>). The if-else decides <i>what</i> to do this pass.</p>

${call('idea', 'Big idea', 'Use a while loop when you can say when to stop but not how many passes it takes: "until n is 0", "until indexOf gives −1", "until n is 1".')}
${call('mistake', 'Common mistakes', '<ul><li><code>while (n &gt;= 0)</code> in a digit loop: infinite, because 0 / 10 is 0.</li><li>Forgetting to move the search index past the match in an indexOf loop: infinite.</li><li>Expecting digits left to right. % 10 gives them right to left.</li></ul>')}
${call('ap', 'On the AP exam', 'Digit loops show up constantly: count the digits, add them, reverse them, or check if a number contains a certain digit. Write out the n / n % 10 table and the answer falls out.')}
${check('What does <code>digitSum(9070)</code> return, using the method above?', ['16', '7', '9', '97'], 0, '9070 % 10 = 0, then 907 % 10 = 7, then 90 % 10 = 0, then 9. 0 + 7 + 0 + 9 = 16. Zeros in the middle don\'t stop the loop, only n reaching 0 does.')}
${check('In the indexOf loop, what happens if you delete <code>index++;</code>?', ['It prints every index twice', 'It prints 2 forever (infinite loop)', 'It prints nothing', 'It throws StringIndexOutOfBoundsException'], 1, 'indexOf("e", 2) finds the "e" at index 2, sets index to 2, prints it, and searches from 2 again, finding the same "e". Nothing moves forward.')}
`,
    specs: {
      digitsInf: { src: 'int n = 47;\nint sum = 0;\nwhile (n >= 0) {\n    sum += n % 10;\n    n /= 10;\n}\nSystem.out.print(sum);', maxSteps: 120, expectError: 'InfiniteLoop', caption: 'Watch n: 47, 4, 0, 0, 0 … The condition n >= 0 never turns false. Edit it to n > 0 and it prints 11.' },
      zelda: { src: 'String str = "The Legend of Zelda";\nString c = "e";\nint index = 0;\nwhile (str.indexOf(c, index) >= 0) {\n    index = str.indexOf(c, index);\n    System.out.print(index + " ");\n    index++;\n}', expect: '2 5 7 15 ', caption: 'Searches start at 0, 3, 6, 8, then 16. The last search finds nothing (−1), so the condition is false and the loop stops.' },
      hail: { src: 'int n = 6;\nSystem.out.println(n);\nwhile (n > 1) {\n    if (n % 2 == 0)\n        n /= 2;\n    else\n        n = 3 * n + 1;\n    System.out.println(n);\n}', expect: '6\n3\n10\n5\n16\n8\n4\n2\n1\n', caption: 'Try editing n to 7: it takes 16 steps and climbs as high as 52 before falling to 1.' },
    },
    sims(el) {
      const host = el.querySelector('[data-sim="peel"]');
      if (!host) return null;
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      let n = 0, sum = 0, rows = [];
      const reset = () => { n = clamp(Math.floor(Number(q('n').value) || 1), 1, 999999999); sum = 0; rows = []; draw(); };
      const draw = () => {
        q('ro').innerHTML = `<span>n = <b>${n}</b></span><span>sum = <b>${sum}</b></span><span>condition n &gt; 0 is <b class="${n > 0 ? 'good' : 'bad'}">${n > 0}</b></span>`;
        q('tbl').innerHTML = rows.length ? `<table class="truth"><tr><th>pass</th><th>n</th><th>n % 10</th><th>sum</th><th>n / 10</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table>` : '';
        q('step').disabled = n <= 0;
      };
      q('step').onclick = () => { if (n > 0) { const d = n % 10; sum += d; rows.push([n, d, sum, Math.floor(n / 10)]); n = Math.floor(n / 10); draw(); } };
      q('reset').onclick = reset;
      q('n').onchange = reset;
      reset();
      return null;
    },
  }));

  // =====================================================================
  // 2.8 for loops
  // =====================================================================
  lesson(14, 'cs2-for', (show, showErr) => ({
    html: `
<p class="lead">Most loops look the same: set a counter, check it, run the body, bump the counter. A for loop packs those three jobs into one line at the top, so you can see at a glance exactly how the loop starts, when it stops, and how it moves.</p>

<h2>The three parts</h2>
${rule('for (initialization; condition; update) { body }', 'where <b>initialization</b> runs exactly once, before anything else; <b>condition</b> is a boolean checked before every pass (true: run the body, false: leave the loop); <b>update</b> runs after the body finishes, right before the condition is checked again.')}
<p>So the order is: initialization → condition → body → update → condition → body → update → … until the condition is false. The update is <i>not</i> done before the first pass. Step through it and watch when <code>i++</code> happens:</p>
<div data-cs="tracer" data-id="basic"></div>

<h2>Every for loop is a while loop in disguise</h2>
${compare([
      { title: 'for', src: 'for (int i = 0; i < 6; i++) {\n    System.out.println(i);\n}' },
      { title: 'the same loop as a while', src: 'int i = 0;\nwhile (i < 6) {\n    System.out.println(i);\n    i++;\n}' },
    ])}
<p>The rewrite rule: put the initialization before the while, keep the condition, and put the update as the <b>last</b> line of the body. If you put the update first, you change what the loop does:</p>
${show('int i = 0;\nwhile (i < 6) {\n    i++;\n    System.out.println(i);\n}', '1\n2\n3\n4\n5\n6\n')}
<p>Now it prints 1 through 6 instead of 0 through 5, because i goes up before each print.</p>

<h2>The loop variable only lives inside the loop</h2>
<p>A variable declared in the for header exists only inside that loop. After the loop ends, it is gone:</p>
${showErr('for (int i = 0; i < 3; i++) {\n    System.out.print(i);\n}\nSystem.out.print(i);', '', 'CompileError', 'Compile error: cannot find symbol: variable i')}
<p>The upside: the next loop can declare its own <code>int i</code> again with no conflict. If you need the value after the loop, declare the variable before it (<code>int i; for (i = 0; …)</code>).</p>

<h2>Accumulators and steps</h2>
<p>A variable declared <i>before</i> the loop and updated inside it collects a result: an <b>accumulator</b>.</p>
${show('int sum = 0;\nfor (int i = 1; i <= 60; i++) {\n    sum += i;\n}\nSystem.out.print(sum);', '1830')}
<p>The update doesn't have to be <code>i++</code>. With <code>i += 2</code>, the loop visits every other number:</p>
${show('int sum = 0;\nfor (int i = 2; i <= 60; i += 2) {\n    sum += i;\n}\nSystem.out.print(sum);', '930')}
<p>When the body doesn't use i at all (rolling 12 dice), any header that runs 12 times works: <code>i = 0; i &lt; 12</code>, <code>i = 1; i &lt;= 12</code>, or <code>i = 12; i &gt; 0; i--</code>.</p>

<h2>Loops that run zero times, and removing a precondition</h2>
<p>This method adds the integers from a to b. Its precondition is a &lt;= b:</p>
${show('public static int sumOfInts(int a, int b) {\n    int sum = 0;\n    for (int i = a; i <= b; i++) {\n        sum += i;\n    }\n    return sum;\n}\nSystem.out.println(sumOfInts(5, 8));\nSystem.out.println(sumOfInts(8, 5));\nSystem.out.println(sumOfInts(7, 7));', '26\n0\n7\n')}
<p><code>sumOfInts(8, 5)</code> returns 0: i starts at 8, and 8 &lt;= 5 is false right away, so the loop body never runs. To make the method work in either order, loop from the smaller to the larger:</p>
${show('public static int sumOfInts(int a, int b) {\n    int sum = 0;\n    for (int i = Math.min(a, b); i <= Math.max(a, b); i++) {\n        sum += i;\n    }\n    return sum;\n}\nSystem.out.print(sumOfInts(8, 5));', '26')}

<h2>Loops that never end</h2>
<p>Two ways a for loop goes wrong:</p>
<ul>
<li><b>The update moves away from the exit.</b> <code>for (int i = 0; i &lt; 10; i--)</code>: i goes 0, −1, −2 … and i &lt; 10 stays true. It only stops after about two billion passes, when i wraps around past Integer.MIN_VALUE to a huge positive number. <code>for (int i = 10; i &gt; 0; i++)</code> has the same problem heading up toward Integer.MAX_VALUE.</li>
<li><b>A != condition gets skipped.</b> <code>for (int i = 1; i != 10; i += 2)</code>: i is always odd, so it is never 10.</li>
</ul>
<p>The rule: on average, the update should move the variable <i>toward</i> making the condition false. Try it below:</p>
<div class="sim" data-sim="anat">
  <div class="sim-controls">
    <label>int i = <input type="number" data-k="a" value="0" style="width:70px"></label>
    <label>condition i <select data-k="op"><option>&lt;</option><option>&lt;=</option><option>&gt;</option><option>&gt;=</option><option>!=</option></select> <input type="number" data-k="b" value="10" style="width:70px"></label>
    <label>update i += <input type="number" data-k="s" value="1" style="width:60px"></label>
  </div>
  <div class="sim-readout" data-k="ro"></div>
  <div style="padding:0 16px 12px" data-k="seq"></div>
  <div class="sim-caption">Shows the values of i that each pass sees (up to 40), and whether the loop never starts, ends normally, or runs away. Use a negative update for i--.</div>
</div>

${call('analogy', 'Analogy: a lap counter', 'Initialization is setting the counter to 0 before the race; the condition is asking "have I finished?" before every lap; the update is clicking the counter at the end of each lap, not the start.')}
${call('mistake', 'Common mistakes', '<ul><li>Thinking the update runs before the first pass. It runs after each body.</li><li>Using the loop variable after the loop (compile error: cannot find symbol).</li><li>Moving the update to the top of the body when rewriting as a while.</li></ul>')}
${call('ap', 'On the AP exam', 'You will be asked how many times a loop runs, what it prints, and which of several loops are equivalent. Rewriting for ↔ while and checking boundary values (first pass, last pass) are the most reliable tools.')}
${check('What is printed?<pre class="code"><span class="ln">int total = 0;</span><span class="ln">for (int k = 10; k &gt; 0; k -= 3) {</span><span class="ln">    total += k;</span><span class="ln">}</span><span class="ln">System.out.print(total);</span></pre>', ['22', '18', '19', '30'], 0, 'k is 10, 7, 4, 1 (then −2 fails k > 0). 10 + 7 + 4 + 1 = 22.')}
${check('Which loop runs exactly 5 times?', ['<code>for (int i = 1; i &lt; 5; i++)</code>', '<code>for (int i = 0; i &lt;= 5; i++)</code>', '<code>for (int i = 5; i &gt; 0; i--)</code>', '<code>for (int i = 5; i &gt;= 0; i--)</code>'], 2, 'i = 5, 4, 3, 2, 1 — five values. The others run 4, 6, and 6 times.')}
${check('<code>for (int i = 20; i &gt; 0; i++)</code> …', ['never runs', 'runs 20 times', 'runs until i overflows past Integer.MAX_VALUE', 'does not compile'], 2, 'i starts at 20, which is > 0, and goes up. It stays positive until it passes Integer.MAX_VALUE and wraps to a negative number, about 2.1 billion passes later.')}
`,
    specs: {
      basic: { src: 'for (int i = 0; i < 6; i++) {\n    System.out.println(i);\n}\nSystem.out.print("done");', expect: '0\n1\n2\n3\n4\n5\ndone', caption: 'Line 1 is checked before each pass. i is 0 on the first pass, so i++ clearly hasn\'t happened yet. After the body prints 5, i++ makes i 6, and 6 < 6 is false.' },
    },
    sims(el) {
      const host = el.querySelector('[data-sim="anat"]');
      if (!host) return null;
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const test = (i, op, b) => (op === '<' ? i < b : op === '<=' ? i <= b : op === '>' ? i > b : op === '>=' ? i >= b : i !== b);
      const draw = () => {
        const a = Math.trunc(Number(q('a').value) || 0), b = Math.trunc(Number(q('b').value) || 0), s = Math.trunc(Number(q('s').value) || 0), op = q('op').value;
        const seq = [];
        let i = a, n = 0;
        while (test(i, op, b) && n < 41) { seq.push(i); i += s; n++; }
        let verdict;
        if (!seq.length) verdict = '<b>Never runs</b>: the condition is false the very first time.';
        else if (n > 40) {
          const away = s === 0 || (op === '!=' ? true : (op === '<' || op === '<=') ? s < 0 : s > 0);
          verdict = s === 0 ? '<b class="bad">Infinite loop</b>: the update never changes i.' :
            op === '!=' ? `<b class="bad">Never ends</b>: i steps over ${b} and keeps going.` :
            away ? '<b class="bad">Runs away</b>: the update moves i away from the exit, so it only stops when i overflows (billions of passes).' :
            `<b>Runs ${Math.floor(Math.abs(b - a) / Math.abs(s)) + 1}ish times</b> (more than 40 shown).`;
          if (!away && op !== '!=' && s !== 0) {
            let cnt = 0; let j = a; while (test(j, op, b) && cnt < 1e6) { j += s; cnt++; }
            verdict = `<b>Ends</b> after ${cnt} passes (first 40 shown).`;
          }
        } else verdict = `<b class="good">Ends</b> after <b>${seq.length}</b> pass${seq.length === 1 ? '' : 'es'}. Final i = ${i}, and i ${op} ${b} is false.`;
        q('ro').innerHTML = `<span class="mono">for (int i = ${a}; i ${esc(op)} ${b}; i += ${s})</span><span>${verdict}</span>`;
        q('seq').innerHTML = seq.slice(0, 40).map((v) => `<span class="pill" style="margin:2px">${v}</span>`).join('') + (n > 40 ? ' <span class="muted">…</span>' : '');
      };
      ['a', 'b', 's', 'op'].forEach((k) => { q(k).oninput = q(k).onchange = draw; });
      draw();
      return null;
    },
  }));

  // =====================================================================
  // 2.8 for loop algorithms: primes, factors, factorization
  // =====================================================================
  lesson(15, 'cs2-for-algos', (show, showErr) => ({
    html: `
<p class="lead">Is 9973 prime? What is the smallest number that divides 14401? What are the prime factors of 14400? Each of these is a short loop, and each one has a boundary detail that decides whether the answer is right or quietly wrong.</p>

<h2>Checking for a prime</h2>
<p>A number n ≥ 2 is prime if nothing from 2 up to n − 1 divides it evenly. You don't have to test that far, though. Factors come in pairs (a × b = n), and in every pair one factor is at most √n. So if nothing up to √n divides n, nothing above it can either.</p>
${show('public static boolean checkPrime(int n) {\n    for (int i = 2; i <= Math.sqrt(n); i++) {\n        if (n % i == 0)\n            return false;\n    }\n    return true;\n}\nSystem.out.println(checkPrime(3));\nSystem.out.println(checkPrime(15));\nSystem.out.println(checkPrime(17));', 'true\nfalse\ntrue\n')}
<ul>
<li><code>checkPrime(3)</code>: 2 &lt;= √3 ≈ 1.73 is false, so the loop never runs and the method returns true.</li>
<li><code>checkPrime(15)</code>: i = 2 doesn't divide, i = 3 does, so it returns false immediately.</li>
<li><code>checkPrime(17)</code>: 2, 3 and 4 don't divide. Then i = 5 and 5 &lt;= 4.12 is false, so the loop ends and the method returns true.</li>
</ul>

<h2>Why it must be &lt;= and not &lt;</h2>
<p>With <code>i &lt; Math.sqrt(n)</code>, the square root itself is never tested. For 25, √25 is exactly 5, so i = 5 is skipped and 25 is reported as prime. The same happens for 49, 121, 169: squares of primes. (16 and 36 are still caught, because 2 divides them first.) Try it:</p>
<div class="sim" data-sim="prime">
  <div class="sim-controls">
    <label>n <input type="number" data-k="n" value="25" min="2" max="100000" style="width:110px"></label>
    <label>condition <select data-k="op"><option value="le">i &lt;= Math.sqrt(n)</option><option value="lt">i &lt; Math.sqrt(n)</option></select></label>
  </div>
  <div class="sim-readout" data-k="ro"></div>
  <div style="padding:0 16px 12px" data-k="tries"></div>
  <div class="sim-caption">Each chip is one value of i the loop tests. Green means n % i is not 0, red means i divides n (return false). Try 25, 49, 121 with each condition.</div>
</div>

<h2>Return inside, return after</h2>
<p>The two return statements do different jobs. <code>return false</code> sits inside the loop: the moment a factor is found you know the answer, so you leave. <code>return true</code> sits after the loop: you can only say "prime" once <i>every</i> candidate has been tested. Putting it in an else inside the loop is a classic bug:</p>
${show('public static boolean badPrime(int n) {\n    for (int i = 2; i <= Math.sqrt(n); i++) {\n        if (n % i == 0)\n            return false;\n        else\n            return true;\n    }\n    return true;\n}\nSystem.out.print(badPrime(9));', 'true')}
<p>For 9, i = 2 doesn't divide, so the else returns true immediately, before 3 is ever tried. The loop only ever runs once.</p>

<h2>The smallest factor</h2>
<p>Change "return false" to "return the factor" and you get the smallest factor of n. If the loop finds nothing up to √n, n is prime, and its smallest factor (other than 1) is n itself:</p>
${show('public static int findFactor(int n) {\n    for (int i = 2; i <= Math.sqrt(n); i++) {\n        if (n % i == 0)\n            return i;\n    }\n    return n;\n}\nSystem.out.print(findFactor(3) + " " + findFactor(15) + " " + findFactor(17));', '3 3 17')}

<h2>Prime factorization</h2>
<p>Keep finding the smallest factor, print it, and divide it out, until nothing is left (n becomes 1):</p>
<div data-cs="tracer" data-id="factor"></div>
<p>The smallest factor of any number greater than 1 is always prime, so everything printed is a prime factor. 14400 gives 2 2 2 2 2 2 3 3 5 5; 14401 is prime and prints just 14401; 14402 gives 2 19 379. Edit n in the tracer to check.</p>

${call('analogy', 'Analogy: checking for counterfeits', 'To prove a stack has a fake bill, you stop at the first fake you find. To prove the stack is all real, you have to look at every bill. That is why <code>return false</code> is inside the loop and <code>return true</code> is after it.')}
${call('mistake', 'Common mistakes', '<ul><li><code>i &lt; Math.sqrt(n)</code>: squares of primes (25, 49) come out "prime".</li><li><code>else return true</code> inside the loop: the method decides after testing only 2.</li><li>Starting at i = 1: every number is divisible by 1, so everything comes out "not prime".</li></ul>')}
${call('ap', 'On the AP exam', 'Expect "which of these returns the correct result for all n?" with one boundary changed, and tracing the factorization loop. Test the edge cases: 2, 4, a prime, and a square of a prime.')}
${check('With <code>i &lt; Math.sqrt(n)</code> instead of <code>&lt;=</code>, which number is wrongly reported as prime?', ['36', '27', '49', '51'], 2, '√49 = 7 exactly, so 7 is never tested, and 2 through 6 don\'t divide 49. 36 is caught by 2, 27 by 3, and 51 by 3.')}
${check('What does <code>findFactor(91)</code> return?', ['91', '7', '13', '1'], 1, '91 = 7 × 13. Testing 2, 3, 4, 5, 6 fails, and 7 divides it, so 7 is returned (7 <= √91 ≈ 9.5).')}
`,
    specs: {
      factor: { src: 'public static int findFactor(int n) {\n    for (int i = 2; i <= Math.sqrt(n); i++) {\n        if (n % i == 0)\n            return i;\n    }\n    return n;\n}\npublic static void primeFactorization(int n) {\n    while (n > 1) {\n        int f = findFactor(n);\n        System.out.print(f + " ");\n        n /= f;\n    }\n}\nprimeFactorization(60);', expect: '2 2 3 5 ', maxSteps: 6000, caption: '60 → 30 → 15 → 5 → 1. Each pass prints the smallest factor and divides it out. Edit 60 to 14400, 14401, or 14402.' },
    },
    sims(el) {
      const host = el.querySelector('[data-sim="prime"]');
      if (!host) return null;
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const draw = () => {
        const n = clamp(Math.floor(Number(q('n').value) || 2), 2, 100000), le = q('op').value === 'le';
        const tries = [];
        let verdict = true;
        for (let i = 2; le ? i <= Math.sqrt(n) : i < Math.sqrt(n); i++) {
          const d = n % i === 0;
          tries.push([i, d]);
          if (d) { verdict = false; break; }
        }
        let real = n >= 2;
        for (let i = 2; i * i <= n; i++) if (n % i === 0) { real = false; break; }
        q('ro').innerHTML = `<span>√${n} ≈ <b>${Math.sqrt(n).toFixed(3)}</b></span><span>checkPrime returns <b>${verdict}</b></span><span>${verdict === real ? '<b class="good">correct</b>' : `<b class="bad">wrong!</b> ${n} = ${Math.round(Math.sqrt(n))} × ${Math.round(Math.sqrt(n))} and ${Math.round(Math.sqrt(n))} was never tested`}</span>`;
        q('tries').innerHTML = tries.length ? tries.map(([i, d]) => `<span class="pill" style="margin:2px;${d ? 'background:var(--bad-soft);color:var(--bad)' : 'background:var(--good-soft);color:var(--good)'}">${n} % ${i} = ${n % i}</span>`).join('') : '<span class="muted">The loop never runs (2 is already past the bound).</span>';
      };
      q('n').oninput = draw; q('op').onchange = draw;
      draw();
      return null;
    },
  }));

  // =====================================================================
  // 2.8 series and overflow
  // =====================================================================
  lesson(16, 'cs2-series', (show, showErr) => ({
    html: `
<p class="lead">Some famous numbers are the sums of infinitely many terms: π²/6, the natural log of 2, e. A computer can't add infinitely many, but a loop can add thousands in a blink, and watching the partial sums close in on the answer is a great way to see what a loop is doing. It also exposes the main danger of loops that multiply: numbers that grow past what an int can hold.</p>

<h2>Summing a series with a loop</h2>
<p>Euler showed that 1 + 1/4 + 1/9 + 1/16 + … (the reciprocals of the squares) gets closer and closer to π²/6 ≈ 1.6449. That is the Basel problem. The loop is just an accumulator:</p>
${show('public static double baselSum(int n) {\n    double sum = 0;\n    for (int i = 1; i <= n; i++)\n        sum += Math.pow(i, -2);\n    return sum;\n}\nSystem.out.println(baselSum(2));\nSystem.out.println(baselSum(5));\nSystem.out.println(baselSum(10));', '1.25\n1.4636111111111112\n1.5497677311665408\n')}
<p><code>Math.pow(i, -2)</code> is 1/i². Writing <code>1 / (i * i)</code> instead would be a bug: that is int / int, which is 0 for every i past 1. <code>1.0 / (i * i)</code> works.</p>
<div class="sim" data-sim="series">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Series <select data-k="s"><option value="basel">1 + 1/4 + 1/9 + … (Basel)</option><option value="alt">1 − 1/2 + 1/3 − … (alternating harmonic)</option><option value="e">1 + 1 + 1/2! + 1/3! + … (e)</option></select></label>
    <label>Terms <input type="range" data-k="n" min="1" max="300" value="40"> <span data-k="nv"></span></label>
  </div>
  <div class="sim-readout" data-k="ro"></div>
  <div class="sim-caption">Each dot is the partial sum after that many terms; the dashed line is the value the series converges to. The alternating series zig-zags: even numbers of terms land below ln 2, odd numbers above.</div>
</div>

<h2>Alternating signs</h2>
<p>The alternating harmonic series 1 − 1/2 + 1/3 − 1/4 + … converges to ln 2 ≈ 0.6931. You need the sign to flip every term. One clean way is a sign variable that you multiply by −1 each pass (another is checking whether i is even with <code>i % 2</code>):</p>
${show('public static double alternatingHarmonic(int numberOfTerms) {\n    double sum = 0;\n    double sign = 1;\n    for (int i = 1; i <= numberOfTerms; i++) {\n        sum += sign / i;\n        sign = -sign;\n    }\n    return sum;\n}\nSystem.out.println(alternatingHarmonic(2));\nSystem.out.println(alternatingHarmonic(3));\nSystem.out.println(alternatingHarmonic(6));', '0.5\n0.8333333333333333\n0.6166666666666666\n')}
<p>Notice <code>sign / i</code>: sign is a double, so this is mixed-mode division and keeps the decimals.</p>

<h2>Factorials blow past an int</h2>
<p>The series for e<sup>x</sup> is 1 + x + x²/2! + x³/3! + …, which needs factorials. They grow absurdly fast. An int can hold up to 2,147,483,647, and 13! is 6,227,020,800. Past that, int arithmetic silently <b>wraps around</b> with no error:</p>
${show('int f = 1;\nfor (int i = 1; i <= 13; i++)\n    f *= i;\nSystem.out.println(f);\ndouble g = 1;\nfor (int i = 1; i <= 13; i++)\n    g *= i;\nSystem.out.println(g);', '1932053504\n6.2270208E9\n')}
<p>The int version printed 1,932,053,504, a garbage number. The double version is right (6.2270208E9 means 6.2270208 × 10⁹). So the factorial method uses a double:</p>
${show('public static double factorial(int n) {\n    double result = 1;\n    for (int i = 2; i <= n; i++)\n        result *= i;\n    return result;\n}\npublic static double calcSeries(double x) {\n    double sum = 0;\n    for (int k = 0; k <= 100; k++)\n        sum += Math.pow(x, k) / factorial(k);\n    return sum;\n}\nSystem.out.println(calcSeries(1));\nSystem.out.println(Math.E);', '2.7182818284590455\n2.718281828459045\n')}

<h2>Overflow hiding inside an expression</h2>
<p>Even when the <i>result</i> is stored in a double, the arithmetic before it might still be int arithmetic. In this term, 2 * k * (2 * k + 1) * (2 * k + 2) is computed entirely with ints, and for k = 1000 the true value (about 8 billion) doesn't fit:</p>
${show('int k = 1000;\ndouble bad = 2 * k * (2 * k + 1) * (2 * k + 2);\ndouble good = 2.0 * k * (2 * k + 1) * (2 * k + 2);\nSystem.out.println(bad);\nSystem.out.println(good);', '-5.77930592E8\n8.012004E9\n')}
<p><code>bad</code> is a double, but the multiplication on its right side was done entirely with ints. The true product, about 8 billion, wrapped around to −577,930,592 <i>before</i> it was converted to a double, so <code>bad</code> holds −577930592.0 (a double this large prints in E notation: −5.77930592E8). It is negative, which is impossible for a product of positive numbers: that is the giveaway. Making the first number <code>2.0</code> turns the whole chain into mixed-mode double arithmetic from the very first multiplication.</p>

${call('idea', 'Big idea', 'More terms means a closer approximation, but each partial sum is still only an approximation. And any loop that multiplies (factorials, powers, big denominators) needs doubles, or at least one double early in the expression.')}
${call('mistake', 'Common mistakes', '<ul><li><code>1 / (i * i)</code> is int division: 0 for every i ≥ 2.</li><li>int factorials: wrong from 13! on, with no error message.</li><li>Storing in a double doesn\'t help if the expression was already computed with ints.</li></ul>')}
${call('ap', 'On the AP exam', 'Look for int / int inside a sum, and for products that can exceed about 2.1 billion. "What is printed?" questions love a series that silently becomes 1.0 because every term after the first is 0.')}
${check('What does this print?<pre class="code"><span class="ln">double sum = 0;</span><span class="ln">for (int i = 1; i &lt;= 4; i++)</span><span class="ln">    sum += 1 / i;</span><span class="ln">System.out.print(sum);</span></pre>', ['2.083333333333333', '1.0', '0.0', '4.0'], 1, '1 / 1 is 1, but 1 / 2, 1 / 3 and 1 / 4 are all int division, which gives 0. sum is 1 + 0 + 0 + 0 = 1.0 (a double, so it prints with .0).')}
${check('Which line correctly computes 1/k² as a double for an int k?', ['<code>1 / k * k</code>', '<code>1 / (k * k)</code>', '<code>1.0 / (k * k)</code>', '<code>(double)(1 / (k * k))</code>'], 2, '1.0 makes it mixed mode. Option D casts after the int division has already produced 0.')}
`,
    sims(el) {
      const host = el.querySelector('[data-sim="series"]');
      if (!host) return null;
      const P = window.PRKit, col = P.col;
      const cv = host.querySelector('canvas'), q = (k) => host.querySelector(`[data-k="${k}"]`);
      const T = { basel: Math.PI * Math.PI / 6, alt: Math.log(2), e: Math.E };
      const name = { basel: 'π²/6', alt: 'ln 2', e: 'e' };
      function partials(s, n) {
        const out = [];
        let sum = 0, fact = 1;
        for (let i = 1; i <= n; i++) {
          if (s === 'basel') sum += 1 / (i * i);
          else if (s === 'alt') sum += (i % 2 ? 1 : -1) / i;
          else { if (i > 1) fact *= (i - 1); sum += 1 / fact; }
          out.push(sum);
        }
        return out;
      }
      const st = P.stage(cv, 0.45, (ctx, w, h) => {
        const s = q('s').value, n = Number(q('n').value);
        q('nv').textContent = n;
        const ps = partials(s, n), tgt = T[s];
        const lo = Math.min(tgt, ...ps) - 0.05, hi = Math.max(tgt, ...ps) + 0.05;
        ctx.clearRect(0, 0, w, h);
        const box = { x: 44, y: 14, w: w - 58, h: h - 40 };
        const X = (i) => box.x + ((i - 1) / Math.max(1, n - 1)) * box.w, Y = (v) => box.y + box.h - ((v - lo) / (hi - lo)) * box.h;
        ctx.strokeStyle = col('--border'); ctx.lineWidth = 1; ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = col('--accent'); ctx.beginPath(); ctx.moveTo(box.x, Y(tgt)); ctx.lineTo(box.x + box.w, Y(tgt)); ctx.stroke(); ctx.restore();
        P.text(ctx, name[s], box.x + box.w - 4, Y(tgt) - 10, { align: 'right', color: col('--accent'), weight: 700 });
        ctx.strokeStyle = P.rgba(col('--text'), 0.35); ctx.beginPath();
        ps.forEach((v, i) => (i ? ctx.lineTo(X(i + 1), Y(v)) : ctx.moveTo(X(1), Y(v)))); ctx.stroke();
        const r = n > 120 ? 1.6 : 3;
        ps.forEach((v, i) => { ctx.beginPath(); ctx.arc(X(i + 1), Y(v), r, 0, Math.PI * 2); ctx.fillStyle = col('--text'); ctx.fill(); });
        P.text(ctx, hi.toFixed(3), box.x - 4, box.y + 6, { align: 'right', size: 10, color: col('--muted') });
        P.text(ctx, lo.toFixed(3), box.x - 4, box.y + box.h - 4, { align: 'right', size: 10, color: col('--muted') });
        P.text(ctx, 'terms →', box.x + box.w, box.y + box.h + 16, { align: 'right', size: 11, color: col('--muted') });
        const last = ps[ps.length - 1];
        q('ro').innerHTML = `<span>partial sum after ${n} term${n === 1 ? '' : 's'}: <b>${last.toPrecision(10)}</b></span><span>${name[s]} = <b>${tgt.toPrecision(10)}</b></span><span>off by <b>${Math.abs(last - tgt).toExponential(2)}</b></span>`;
      });
      q('s').onchange = () => st.draw();
      q('n').oninput = () => st.draw();
      st.draw();
      return () => st.destroy();
    },
  }));

  // =====================================================================
  // 2.9 Euler's formula lab
  // =====================================================================
  lesson(17, 'cs2-euler', (show, showErr) => ({
    html: `
<p class="lead">Euler's formula says e<sup>ix</sup> = cos x + i·sin x, which is how mathematicians get the famous e<sup>iπ</sup> = −1. In the 2.9 lab you build e<sup>ix</sup> from scratch, with no Math class at all: no Math.PI, no Math.sin, no Math.pow, not even Math.abs. Everything comes from arithmetic, ifs and loops, which makes it the perfect review of the whole unit.</p>

<h2>Step 1: generating π yourself</h2>
<p>The Nilakantha series: π = 3 + 4/(2·3·4) − 4/(4·5·6) + 4/(6·7·8) − … Each term's denominator is the product of three consecutive numbers. The catch is the one from the last lesson: by term 1000 that product is about 8 billion, past what an int holds. Use mixed mode for the denominator:</p>
${show('public static double pi() {\n    double sum = 3;\n    double sign = 1;\n    for (int k = 1; k <= 1000; k++) {\n        double denom = 2.0 * k * (2 * k + 1) * (2 * k + 2);\n        sum += sign * 4 / denom;\n        sign = -sign;\n    }\n    return sum;\n}\nSystem.out.print(pi());', '3.141592653340544')}
<p>The <code>2.0</code> at the front makes every multiplication after it double arithmetic. With <code>2 * k</code> instead, the denominator overflows for large k and the approximation goes wrong.</p>

<h2>Step 2: rounding to 3 places without Math.round</h2>
<p>Shift three places left, add 0.5, chop with an int cast, shift back:</p>
${rule('(int)(num * 1000 + 0.5) / 1000.0', 'where the <b>+ 0.5</b> makes the cast round instead of truncate (2.2357 → 2235.7 + 0.5 = 2236.2 → 2236), and <b>1000.0</b> (a double) makes the final division keep its decimals. For negative numbers subtract 0.5 instead, because the cast truncates toward zero.')}
${show('public static double round3(double num) {\n    if (num >= 0)\n        return (int)(num * 1000 + 0.5) / 1000.0;\n    return (int)(num * 1000 - 0.5) / 1000.0;\n}\nSystem.out.println(round3(2.23543));\nSystem.out.println(round3(2.23573));\nSystem.out.println(round3(-0.86602));', '2.235\n2.236\n-0.866\n')}

<h2>Step 3: "zero" within rounding, without Math.abs</h2>
<p>Computed doubles are rarely exactly 0 (cos(π/2) from a series might come out as 1.2E-13). Treat anything within 10<sup>−10</sup> of zero as zero. Without Math.abs, write the absolute-value check as two comparisons:</p>
${rule('num <= 1E-10 && num >= -1E-10', 'where <b>1E-10</b> means 1 × 10<sup>−10</sup>. This is true exactly when |num| ≤ 10<sup>−10</sup>, which is what Math.abs(num) <= 1E-10 would say.')}

<h2>Step 4: displaying a complex number, case by case</h2>
<p>Given a (real part) and b (imaginary part), the output rules are: round both; if both are zero print 0.0; if only a is zero print bi; if only b is zero print a; otherwise a + bi, or a − bi when b is negative (never "2.0 + -2.0i"). The order of the checks matters: "both zero" must come before "only a is zero", or 0, 0 would print 0.0i.</p>
<div data-cs="tracer" data-id="complex"></div>

<h2>Step 5: power, factorial, and the trig series</h2>
<p>Without Math.pow, a power with a non-negative integer exponent is just repeated multiplication. Start at 1 (anything to the 0 is 1) and multiply b times:</p>
${show('public static double power(double a, int b) {\n    double result = 1;\n    for (int i = 0; i < b; i++)\n        result *= a;\n    return result;\n}\nSystem.out.print(power(2, 10) + " " + power(1.5, 2) + " " + power(7, 0));', '1024.0 2.25 1.0')}
<p>Then cos x = 1 − x²/2! + x⁴/4! − … and sin x = x − x³/3! + x⁵/5! − …: alternating series that call power and factorial each term. Plug them into displayComplexNumber and you have e<sup>ix</sup>. Explore the finished pipeline:</p>
<div class="sim" data-sim="euler">
  <div class="sim-controls">
    <label>x = <select data-k="x">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => `<option value="${k}" ${k === 6 ? 'selected' : ''}>${k === 0 ? '0' : k === 6 ? 'π' : k === 12 ? '2π' : `${k}π/6`}</option>`).join('')}</select></label>
    <label>Series terms <input type="range" data-k="t" min="1" max="11" value="11"> <span data-k="tv"></span></label>
  </div>
  <div class="sim-readout" data-k="ro"></div>
  <div class="sim-caption">cos and sin are built from their series with your own power and factorial (no Math.cos or Math.sin), then shown with the displayComplexNumber rules. With 11 terms (up to x²⁰/20!), e^(iπ) displays as −1.0. With only a few terms, larger angles drift.</div>
</div>

${call('idea', 'Big idea', 'Big programs are small methods stacked up: pi() uses a loop, round3 uses casting, zero uses &&, displayComplexNumber uses an else-if chain, cosine and sine use loops that call power and factorial. Test each one alone before combining them.')}
${call('mistake', 'Common mistakes', '<ul><li>int arithmetic in the Nilakantha denominator: overflow for large k.</li><li>round3 with <code>/ 1000</code> instead of <code>/ 1000.0</code>: int division throws away the decimals.</li><li>Checking "only a is zero" before "both are zero".</li></ul>')}
${call('ap', 'On the AP exam', 'Free-response questions are exactly this shape: several small methods, each building on the last, often with "you may not use …" restrictions. Use the methods you already wrote, as the prompt says you can.')}
${check('<code>round3(4.0004999)</code> returns…', ['4.0', '4.001', '4.000', '4.0005'], 0, '4.0004999 × 1000 = 4000.4999; + 0.5 = 4000.9999; the cast gives 4000; 4000 / 1000.0 = 4.0 (a double prints as 4.0, not 4.000).')}
${check('Which is equivalent to Math.abs(x) &lt;= 0.01?', ['<code>x &lt;= 0.01 || x &gt;= -0.01</code>', '<code>x &lt;= 0.01 &amp;&amp; x &gt;= -0.01</code>', '<code>x &gt;= 0.01 &amp;&amp; x &lt;= -0.01</code>', '<code>-x &lt;= 0.01</code>'], 1, 'x must be in the band from −0.01 to 0.01: both conditions at once, so &&. The || version is true for every x.')}
`,
    specs: {
      complex: { src: 'public static double round3(double num) {\n    if (num >= 0)\n        return (int)(num * 1000 + 0.5) / 1000.0;\n    return (int)(num * 1000 - 0.5) / 1000.0;\n}\npublic static boolean zero(double num) {\n    return num <= 1E-10 && num >= -1E-10;\n}\npublic static void displayComplexNumber(double a, double b) {\n    a = round3(a);\n    b = round3(b);\n    if (zero(a) && zero(b))\n        System.out.println(0.0);\n    else if (zero(a))\n        System.out.println(b + "i");\n    else if (zero(b))\n        System.out.println(a);\n    else if (b > 0)\n        System.out.println(a + " + " + b + "i");\n    else\n        System.out.println(a + " - " + (-b) + "i");\n}\ndisplayComplexNumber(0, 0);\ndisplayComplexNumber(2, 0);\ndisplayComplexNumber(0, 2);\ndisplayComplexNumber(2, 2);\ndisplayComplexNumber(2, -2);', expect: '0.0\n2.0\n2.0i\n2.0 + 2.0i\n2.0 - 2.0i\n', maxSteps: 4000, caption: 'Five calls, five different branches of one else-if chain. The last case prints −b with a minus sign in front, so you never see "+ -2.0i".' },
    },
    sims(el) {
      const host = el.querySelector('[data-sim="euler"]');
      if (!host) return null;
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const round3 = (x) => (x >= 0 ? Math.trunc(x * 1000 + 0.5) / 1000 : Math.trunc(x * 1000 - 0.5) / 1000);
      const zero = (x) => x <= 1e-10 && x >= -1e-10;
      const jd = (x) => { const s = String(x); return s.includes('.') || s.includes('e') ? s : s + '.0'; };
      const display = (a, b) => {
        a = round3(a); b = round3(b);
        if (zero(a) && zero(b)) return '0.0';
        if (zero(a)) return jd(b) + 'i';
        if (zero(b)) return jd(a);
        return b > 0 ? `${jd(a)} + ${jd(b)}i` : `${jd(a)} - ${jd(-b)}i`;
      };
      let PI = 3, sg = 1;
      for (let k = 1; k <= 1000; k++) { PI += sg * 4 / (2 * k * (2 * k + 1) * (2 * k + 2)); sg = -sg; }
      const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
      const series = (x, start, terms) => { let s = 0, sign = 1; for (let t = 0; t < terms; t++) { const p = start + 2 * t; s += sign * Math.pow(x, p) / fact(p); sign = -sign; } return s; };
      const draw = () => {
        const k = Number(q('x').value), terms = Number(q('t').value);
        q('tv').textContent = `${terms} (up to x^${2 * terms - 2}/${2 * terms - 2}!)`;
        const x = k * PI / 6;
        const cs = series(x, 0, terms), sn = series(x, 1, terms + 0);
        q('ro').innerHTML = `<span>x ≈ <b>${x.toFixed(6)}</b></span><span>cosine(x) = <b>${cs.toPrecision(8)}</b></span><span>sine(x) = <b>${sn.toPrecision(8)}</b></span><span>e<sup>ix</sup> displays as <b class="mono">${esc(display(cs, sn))}</b></span><span class="muted">true value: ${esc(display(Math.cos(x), Math.sin(x)))}</span>`;
      };
      q('x').onchange = draw; q('t').oninput = draw;
      draw();
      return null;
    },
  }));

  // =====================================================================
  // 2.10 String algorithms
  // =====================================================================
  lesson(18, 'cs2-strings', (show, showErr) => ({
    html: `
<p class="lead">A String is a row of characters with numbered seats, 0 to length() − 1. Loops let you visit those seats one by one (to reverse a word), or jump from match to match with indexOf (to find and count every "s" in Mississippi). The hard part is never the idea; it is getting the first and last index exactly right.</p>

<h2>Finding every index</h2>
<p>Same pattern as the while-loop lesson: search from <code>index</code>, report the match, then search again from one past it.</p>
<div data-cs="tracer" data-id="find"></div>
<div class="sim" data-sim="walk">
  <div class="sim-controls">
    <label>String <input type="text" data-k="s" value="Mississippi River" style="width:180px"></label>
    <label>find <input type="text" data-k="c" value="i" style="width:60px"></label>
    <button class="btn small primary" data-k="step">indexOf ▶</button><button class="btn small" data-k="reset">Reset</button>
  </div>
  <div style="padding:10px 16px;overflow-x:auto" data-k="strip"></div>
  <div class="sim-readout" data-k="ro"></div>
  <div class="sim-caption">Each press is one loop check: str.indexOf(ch, index). Blue cells are where the search starts; green cells are matches found so far. When it returns −1, the loop is over.</div>
</div>

<h2>Counting the matches</h2>
<p>To also return how many there were, change three things: the return type becomes int, an accumulator <code>count</code> starts at 0, and every match does <code>count++</code>.</p>
${show('public static int findIndices(String str, String ch) {\n    int count = 0;\n    int index = 0;\n    while (str.indexOf(ch, index) >= 0) {\n        System.out.print(str.indexOf(ch, index) + " ");\n        index = str.indexOf(ch, index) + 1;\n        count++;\n    }\n    return count;\n}\nSystem.out.println("Count: " + findIndices("Mississippi River", "s"));\nSystem.out.println("Count: " + findIndices("Mississippi River", "o"));', '2 3 5 6 Count: 4\nCount: 0\n')}
<p>For "o", the very first check is false, so nothing prints and the count stays 0.</p>

<h2>Printing a String backwards</h2>
<p>Start at the last index, <code>length() − 1</code>, and count down to 0, printing one character each time with <code>substring(i, i + 1)</code>:</p>
<div data-cs="tracer" data-id="back"></div>

<h2>Getting the bounds right</h2>
<p>For a String of length n, the valid single-character positions are 0 through n − 1. <code>substring(i, i + 1)</code> needs i + 1 ≤ n, so i ≤ n − 1. Go one step too far and Java throws:</p>
${showErr('String str = "abc";\nfor (int i = 0; i <= str.length(); i++)\n    System.out.print(str.substring(i, i + 1));', 'abc', 'StringIndexOutOfBoundsException', 'StringIndexOutOfBoundsException: begin 3, end 4, length 3')}
<p>It printed all three letters first, then crashed on i = 3. The fix is <code>i &lt; str.length()</code>. The backwards loop has the mirror-image trap: starting at <code>i = str.length()</code> crashes on the very first pass.</p>

${call('analogy', 'Analogy: numbered seats', 'A theater row of 10 seats numbered 0 to 9 has no seat 10. "Up to and including length()" sends you to a seat that doesn\'t exist.')}
${call('mistake', 'Common mistakes', '<ul><li><code>i &lt;= str.length()</code> with substring(i, i + 1): out of bounds on the last pass.</li><li>Starting a backwards loop at <code>str.length()</code> instead of <code>str.length() − 1</code>.</li><li>Forgetting the + 1 when moving the search index past a match (infinite loop).</li></ul>')}
${call('ap', 'On the AP exam', 'String loops are everywhere in free response: count occurrences, build a reversed or filtered String with +=, find the first or last match. Always test the first and last character, and a String with no matches.')}
${check('What is printed?<pre class="code"><span class="ln">String s = "banana";</span><span class="ln">int n = 0;</span><span class="ln">for (int i = 0; i &lt; s.length(); i++)</span><span class="ln">    if (s.substring(i, i + 1).equals("a")) n++;</span><span class="ln">System.out.print(n);</span></pre>', ['2', '3', '6', '1'], 1, 'Indices 1, 3 and 5 hold "a": n is 3.')}
${check('Which header prints a String str backwards without an error?', ['<code>for (int i = str.length(); i &gt;= 0; i--)</code>', '<code>for (int i = str.length() - 1; i &gt; 0; i--)</code>', '<code>for (int i = str.length() - 1; i &gt;= 0; i--)</code>', '<code>for (int i = 0; i &lt; str.length(); i--)</code>'], 2, 'A crashes on the first pass (index length). B never prints index 0, the first letter. D runs away from its exit.')}
`,
    specs: {
      find: { src: 'String str = "Mississippi River";\nString ch = "i";\nint index = 0;\nwhile (str.indexOf(ch, index) >= 0) {\n    System.out.print(str.indexOf(ch, index) + " ");\n    index = str.indexOf(ch, index) + 1;\n}', expect: '1 4 7 10 13 ', caption: 'Edit ch to "s" (prints 2 3 5 6) or "o" (prints nothing: the loop never runs).' },
      back: { src: 'String str = "Batman";\nfor (int i = str.length() - 1; i >= 0; i--)\n    System.out.print(str.substring(i, i + 1));', expect: 'namtaB', caption: 'i goes 5, 4, 3, 2, 1, 0 — six characters, last to first. Edit str to "hello world" or "John Cena".' },
    },
    sims(el) {
      const host = el.querySelector('[data-sim="walk"]');
      if (!host) return null;
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      let index = 0, found = [], done = false, last = null;
      const reset = () => { index = 0; found = []; done = false; last = null; draw(); };
      const draw = () => {
        const s = q('s').value;
        q('strip').innerHTML = `<table class="truth" style="margin:0"><tr>${[...s].map((ch, i) => `<td style="${found.includes(i) ? 'background:var(--good-soft)' : i === index && !done ? 'background:var(--accent-soft)' : ''}" class="mono">${esc(ch === ' ' ? '␣' : ch)}</td>`).join('')}</tr><tr>${[...s].map((_, i) => `<td class="muted" style="font-size:11px">${i}</td>`).join('')}</tr></table>`;
        q('ro').innerHTML = last === null ? '<span class="muted">index = 0. Press indexOf ▶.</span>' :
          `<span>str.indexOf("${esc(q('c').value)}", ${last.from}) returned <b>${last.r}</b></span><span>${last.r >= 0 ? `print ${last.r}, then index = ${last.r} + 1 = ${last.r + 1}` : 'condition false: loop over'}</span><span>found so far: <b>${found.join(' ') || 'none'}</b> (count ${found.length})</span>`;
        q('step').disabled = done || !q('c').value;
      };
      q('step').onclick = () => {
        const s = q('s').value, c = q('c').value;
        const r = s.indexOf(c, index);
        last = { from: index, r };
        if (r >= 0) { found.push(r); index = r + 1; } else done = true;
        draw();
      };
      q('reset').onclick = reset;
      q('s').oninput = reset; q('c').oninput = reset;
      reset();
      return null;
    },
  }));

  // =====================================================================
  // Shared nested-loop grid sim (2.11)
  // =====================================================================
  // presets: [{ label, src(R, C) -> Java }]. Output comes from really running the code in JavaLite,
  // then revealed character by character in print order.
  function gridSim(host, presets, caption) {
    host.innerHTML = `
      <div class="sim-controls">
        <label>Code <select data-k="p">${presets.map((p, i) => `<option value="${i}">${esc(p.label)}</option>`).join('')}</select></label>
        <label>outer bound <input type="range" data-k="r" min="1" max="9" value="4"> <span data-k="rv"></span></label>
        <label>inner bound <input type="range" data-k="c" min="1" max="9" value="5"> <span data-k="cv"></span></label>
        <button class="btn small primary" data-k="play">▶ Play</button>
      </div>
      <div class="fig-row" style="margin:0;padding:0 12px">
        <div data-k="code"></div>
        <div><div class="tr-label" style="font-size:12px;font-weight:700;color:var(--muted);margin:12px 0 6px">OUTPUT</div><pre class="console" data-k="out" style="font-size:15px;line-height:1.45"></pre></div>
      </div>
      <div class="sim-readout" data-k="ro"></div>
      <div class="sim-caption">${caption}</div>`;
    const q = (k) => host.querySelector(`[data-k="${k}"]`);
    let full = '', shown = 0, timer = 0;
    const stop = () => { clearInterval(timer); timer = 0; };
    function rebuild() {
      stop();
      const p = presets[Number(q('p').value)];
      const R = Number(q('r').value), C = Number(q('c').value);
      q('rv').textContent = R; q('cv').textContent = C;
      q('r').disabled = p.fixed; q('c').disabled = p.fixed || p.noC;
      const src = p.src(R, C);
      q('code').innerHTML = code(src);
      const r = JavaLite.run(src, { maxSteps: 20000 });
      full = r.error ? `(${r.error.name}: ${r.error.message})` : r.output;
      const prints = (src.match(/System\.out\.print\(/g) || []).length ? (full.replace(/\n/g, '').match(/\S+|\s/g) || []).length : 0;
      void prints;
      shown = full.length;
      paint();
      const lines = full.replace(/\n$/, '').split('\n');
      q('ro').innerHTML = `<span><b>${lines.length}</b> line${lines.length === 1 ? '' : 's'}</span><span>${esc(p.note ? p.note(R, C) : '')}</span>`;
    }
    function paint() { q('out').textContent = full.slice(0, shown) + (shown < full.length ? '▌' : ''); }
    q('play').onclick = () => {
      stop(); shown = 0; paint();
      const step = Math.max(1, Math.ceil(full.length / 90));
      timer = setInterval(() => { shown = Math.min(full.length, shown + step); paint(); if (shown >= full.length) stop(); }, 45);
    };
    ['p', 'r', 'c'].forEach((k) => { q(k).oninput = q(k).onchange = rebuild; });
    rebuild();
    return stop;
  }

  // =====================================================================
  // 2.11 nested loops: grids
  // =====================================================================
  lesson(19, 'cs2-nested-loops', (show, showErr) => ({
    html: `
<p class="lead">Put a loop inside a loop and the inner one runs <i>all the way through</i> every single time the outer one takes a step. That is how you print grids, tables and patterns: the outer loop picks the row, the inner loop walks across it.</p>

<h2>The inner loop restarts every time</h2>
${show('for (int i = 0; i < 4; i++) {\n    for (int j = 0; j < 5; j++) {\n        System.out.print(i + " ");\n    }\n    System.out.println();\n}', '0 0 0 0 0 \n1 1 1 1 1 \n2 2 2 2 2 \n3 3 3 3 3 \n')}
${rule('outer passes × inner passes = total runs of the inner body', 'here 4 × 5 = 20 prints. The <b>println()</b> sits after the inner loop but inside the outer one, so it runs once per row and turns the 20 values into 4 lines.')}
<p>Step through it and watch j go back to 0 at the start of every row:</p>
<div data-cs="tracer" data-id="grid"></div>

<h2>What you print decides the picture</h2>
<p>The loops above make a 4-by-5 grid of positions. What appears in each position depends only on the expression you print. Pick one below and change the bounds:</p>
<div class="sim" data-sim="grid1"></div>
<ul>
<li><b>Print i</b> (the outer variable): each row repeats one number: 0 0 0 0 0 / 1 1 1 1 1 …</li>
<li><b>Print j</b> (the inner variable): every row is the same: 0 1 2 3.</li>
<li><b>Print 3 − i</b>: rows count down instead, a vertical mirror. Running i from 3 down to 0 and printing i gives the same picture.</li>
<li><b>Print 3 − j</b>: each row reads 3 2 1 0, a horizontal mirror.</li>
<li><b>Print i + j</b>: values go up by 1 moving right <i>and</i> moving down. <b>7 − i − j</b> is 7 minus that, so it goes down both ways.</li>
</ul>

<h2>A times table, lined up</h2>
${show('for (int i = 1; i <= 10; i++) {\n    for (int j = 1; j <= 10; j++) {\n        if (i * j < 10)\n            System.out.print(" ");\n        System.out.print(i * j + " ");\n    }\n    System.out.println();\n}', ' 1  2  3  4  5  6  7  8  9 10 \n 2  4  6  8 10 12 14 16 18 20 \n 3  6  9 12 15 18 21 24 27 30 \n 4  8 12 16 20 24 28 32 36 40 \n 5 10 15 20 25 30 35 40 45 50 \n 6 12 18 24 30 36 42 48 54 60 \n 7 14 21 28 35 42 49 56 63 70 \n 8 16 24 32 40 48 56 64 72 80 \n 9 18 27 36 45 54 63 72 81 90 \n10 20 30 40 50 60 70 80 90 100 \n')}
<p>The if prints an extra space in front of one-digit products, so they line up with the two-digit ones. (100 still sticks out; it would need one more rule.)</p>

${call('analogy', 'Analogy: an odometer', 'The inner loop is the fast wheel and the outer loop is the slow one. The slow wheel moves only after the fast wheel has gone all the way around.')}
${call('mistake', 'Common mistakes', '<ul><li>Putting println() inside the inner loop: every value lands on its own line.</li><li>Mixing up i and j: i picks the row (changes slowly), j picks the column (changes fast).</li><li>Reusing the same variable name for both loops: the inner loop wrecks the outer counter (and with for-header declarations it won\'t even compile).</li></ul>')}
${call('ap', 'On the AP exam', 'You will often be shown nested loops and four possible outputs. Find the first row (i = its first value, run j all the way), then the second row, and look for which choice matches. Usually two rows is enough to decide.')}
${check('What is the second line printed?<pre class="code"><span class="ln">for (int i = 0; i &lt; 3; i++) {</span><span class="ln">    for (int j = 0; j &lt; 4; j++)</span><span class="ln">        System.out.print(i * j + " ");</span><span class="ln">    System.out.println();</span><span class="ln">}</span></pre>', ['0 1 2 3', '1 1 1 1', '0 2 4 6', '1 2 3 4'], 0, 'The second line is i = 1: 1·0, 1·1, 1·2, 1·3 = 0 1 2 3.')}
${check('How many times does the inner body run?<pre class="code"><span class="ln">for (int i = 0; i &lt; 6; i++)</span><span class="ln">    for (int j = 0; j &lt; 3; j++)</span><span class="ln">        count++;</span></pre>', ['9', '18', '21', '36'], 1, '6 outer passes × 3 inner passes = 18.')}
`,
    specs: {
      grid: { src: 'for (int i = 0; i < 3; i++) {\n    for (int j = 0; j < 2; j++) {\n        System.out.print(i + " ");\n    }\n    System.out.println();\n}', expect: '0 0 \n1 1 \n2 2 \n', caption: 'A smaller 3 × 2 version so you can step through every pass. Notice the inner condition (line 2) going false after j = 1, then i++ and a fresh j = 0.' },
    },
    sims(el) {
      const host = el.querySelector('[data-sim="grid1"]');
      if (!host) return null;
      const L = (expr) => (R, C) => `for (int i = 0; i < ${R}; i++) {\n    for (int j = 0; j < ${C}; j++) {\n        System.out.print(${expr} + " ");\n    }\n    System.out.println();\n}`;
      return gridSim(host, [
        { label: 'print i', src: L('i'), note: (R, C) => `${R} × ${C} = ${R * C} prints` },
        { label: 'print j', src: L('j'), note: (R, C) => `${R} × ${C} = ${R * C} prints` },
        { label: 'print 3 - i', src: L('3 - i'), note: () => 'a vertical mirror of "print i"' },
        { label: 'print 3 - j', src: L('3 - j'), note: () => 'a horizontal mirror of "print j"' },
        { label: 'print i + j', src: L('i + j'), note: () => 'goes up by 1 to the right and down' },
        { label: 'print 7 - i - j', src: L('7 - i - j'), note: () => '7 minus the i + j picture' },
        { label: 'print i * j', src: L('i * j'), note: () => 'a times table starting at 0' },
        { label: 'i counts down, print i', src: (R, C) => `for (int i = ${R - 1}; i >= 0; i--) {\n    for (int j = 0; j < ${C}; j++) {\n        System.out.print(i + " ");\n    }\n    System.out.println();\n}`, note: () => 'same picture as "print 3 - i" when the outer bound is 4' },
      ], 'Pick what gets printed and change the bounds; ▶ Play reveals the output in the order Java prints it, left to right, row by row.');
    },
  }));

  // =====================================================================
  // 2.11 nested loops: triangles and patterns
  // =====================================================================
  lesson(20, 'cs2-triangles', (show, showErr) => ({
    html: `
<p class="lead">When the inner loop's bound uses the outer variable, the rows stop being the same length. Row 0 might get one value, row 1 two, row 2 three: a triangle. Add an if inside and you can draw almost any pattern made of characters.</p>

<h2>The inner bound depends on i</h2>
${compare([
      { title: 'j <= i', src: 'for (int i = 0; i < 4; i++) {\n    for (int j = 0; j <= i; j++) {\n        System.out.print(i + " ");\n    }\n    System.out.println();\n}', note: 'Rows of 1, 2, 3, 4 values.' },
      { title: 'j < i', src: 'for (int i = 0; i < 4; i++) {\n    for (int j = 0; j < i; j++) {\n        System.out.print(i + " ");\n    }\n    System.out.println();\n}', note: 'Rows of 0, 1, 2, 3 values: the first line is empty.' },
    ])}
${show('for (int i = 0; i < 4; i++) {\n    for (int j = 0; j < i; j++) {\n        System.out.print(i + " ");\n    }\n    System.out.println();\n}', '\n1 \n2 2 \n3 3 3 \n')}
<p>With <code>j &lt; i</code>, row i = 0 checks 0 &lt; 0, which is false, so the inner loop never runs. The println() still runs, so the output starts with a blank line. That one-character difference between &lt; and &lt;= changes both the shape and the count.</p>
<p>Explore the triangle family, including loops that count down:</p>
<div class="sim" data-sim="tri"></div>

<h2>Patterns from conditions</h2>
<p>Instead of changing the bounds, keep a full square and decide what to print in each spot with an if. In a 5 × 5 grid, the spots where the row plus the column is at least 5 form a staircase:</p>
<div data-cs="tracer" data-id="stairs"></div>
<p>Two diagonals make an X: the main diagonal is where i == j, and the other diagonal is where i + j equals the last index. In a 21 × 21 square that is <code>if (i == j || i + j == 20)</code>. Try the X and the staircase in the explorer above (choose them in the Code menu).</p>

${call('idea', 'Big idea', 'Ask two questions about any nested-loop pattern: how many values in row i (the inner bound), and what goes in row i, column j (the expression or the if).')}
${call('mistake', 'Common mistakes', '<ul><li>Mixing up j &lt;= i (starts with 1 value) and j &lt; i (starts with an empty row).</li><li>Forgetting the empty line at the top when j &lt; i, or at the start of a loop like j = i; j &lt; 4 with i = 4.</li><li>Off-by-one diagonals: in an n × n grid the anti-diagonal is i + j == n − 1.</li></ul>')}
${call('ap', 'On the AP exam', 'Triangle loops are the most common "what is printed?" nested-loop question. Write out rows 0, 1 and the last row; the shape becomes obvious.')}
${check('What is the first line printed?<pre class="code"><span class="ln">for (int i = 3; i &gt;= 0; i--) {</span><span class="ln">    for (int j = 0; j &lt;= i; j++)</span><span class="ln">        System.out.print(j + " ");</span><span class="ln">    System.out.println();</span><span class="ln">}</span></pre>', ['0', '0 1 2 3', '3 3 3 3', '3 2 1 0'], 1, 'The first row has i = 3, so j runs 0 through 3 and prints j: 0 1 2 3. The rows then shrink: 0 1 2, 0 1, 0.')}
${check('In a 7 × 7 grid (i and j from 0 to 6), which condition draws the diagonal from top-right to bottom-left?', ['<code>i == j</code>', '<code>i + j == 7</code>', '<code>i + j == 6</code>', '<code>i - j == 6</code>'], 2, 'Top-right is row 0, column 6; bottom-left is row 6, column 0. Every cell on that line has i + j = 6.')}
`,
    specs: {
      stairs: { src: 'for (int i = 0; i < 5; i++) {\n    for (int j = 0; j < 5; j++) {\n        if (i + j >= 5)\n            System.out.print("$");\n        else\n            System.out.print("#");\n    }\n    System.out.println();\n}', expect: '#####\n####$\n###$$\n##$$$\n#$$$$\n', maxSteps: 4000, caption: 'Every cell is decided by one if. Row 0 never reaches 5 (the most is 0 + 4), so it is all #.' },
    },
    sims(el) {
      const host = el.querySelector('[data-sim="tri"]');
      if (!host) return null;
      return gridSim(host, [
        { label: 'j <= i, print i', noC: true, src: (R) => `for (int i = 0; i < ${R}; i++) {\n    for (int j = 0; j <= i; j++) {\n        System.out.print(i + " ");\n    }\n    System.out.println();\n}`, note: (R) => `1 + 2 + … + ${R} = ${R * (R + 1) / 2} prints` },
        { label: 'j < i, print i', noC: true, src: (R) => `for (int i = 0; i < ${R}; i++) {\n    for (int j = 0; j < i; j++) {\n        System.out.print(i + " ");\n    }\n    System.out.println();\n}`, note: (R) => `0 + 1 + … + ${R - 1} = ${R * (R - 1) / 2} prints; the first line is empty` },
        { label: 'i counts down, j <= i, print j', noC: true, src: (R) => `for (int i = ${R - 1}; i >= 0; i--) {\n    for (int j = 0; j <= i; j++) {\n        System.out.print(j + " ");\n    }\n    System.out.println();\n}`, note: () => 'longest row first' },
        { label: 'j counts down from 4 to i, print i + j', fixed: true, src: () => 'for (int i = 1; i < 4; i++) {\n    for (int j = 4; j >= i; j--) {\n        System.out.print(i + j + " ");\n    }\n    System.out.println();\n}', note: () => 'rows of 4, 3, 2 values' },
        { label: 'j from i up to 4, i counts down', fixed: true, src: () => 'for (int i = 4; i >= 1; i--) {\n    for (int j = i; j < 4; j++) {\n        System.out.print(i + j + " ");\n    }\n    System.out.println();\n}', note: () => 'the first line is blank: j = 4, and 4 < 4 is false' },
        { label: 'staircase: i + j >= bound ? $ : #', noC: true, src: (R) => `for (int i = 0; i < ${R}; i++) {\n    for (int j = 0; j < ${R}; j++) {\n        if (i + j >= ${R})\n            System.out.print("$");\n        else\n            System.out.print("#");\n    }\n    System.out.println();\n}`, note: (R) => `a ${R} × ${R} square, split by i + j >= ${R}` },
        { label: 'X: i == j || i + j == last', noC: true, src: (R) => { const n = 2 * R + 1; return `for (int i = 0; i < ${n}; i++) {\n    for (int j = 0; j < ${n}; j++) {\n        if (i == j || i + j == ${n - 1})\n            System.out.print("X");\n        else\n            System.out.print(" ");\n    }\n    System.out.println();\n}`; }, note: (R) => `a ${2 * R + 1} × ${2 * R + 1} square; the anti-diagonal is i + j == ${2 * R}` },
      ], 'The outer bound slider sets the size. In the triangle presets the inner bound is i, so the inner slider is turned off.');
    },
  }));

  // =====================================================================
  // 2.12 counting iterations
  // =====================================================================
  lesson(21, 'cs2-counting', (show, showErr) => ({
    html: `
<p class="lead">"How many times does this print?" You could trace every pass, but for nested loops that might be hundreds. A couple of rules give the count in seconds, and they are exactly the kind of informal run-time analysis the AP exam asks for.</p>

<h2>One loop</h2>
${rule('count = larger − smaller   (+ 1 if the condition is <= or >=)', 'for a loop that moves by ++ or −−, where <b>larger</b> and <b>smaller</b> are the start value and the bound in the condition (whichever is bigger). With < or >, the bound itself is never used, so no + 1. With <= or >=, it is, so add 1. This assumes the loop runs at all.')}
<ul>
<li><code>for (int i = 0; i &lt; 5; i++)</code>: 5 − 0 = 5 passes (0, 1, 2, 3, 4).</li>
<li><code>for (int i = 0; i &lt;= 5; i++)</code>: 5 − 0 + 1 = 6 passes (0 through 5).</li>
<li><code>for (int i = 45; i &lt;= 57; i++)</code>: 57 − 45 + 1 = 13 passes.</li>
</ul>

<h2>Rectangular nested loops: multiply</h2>
<p>When the inner bounds don't depend on i, every outer pass runs the inner loop the same number of times. Multiply:</p>
${show('int count = 0;\nfor (int i = 45; i <= 57; i++)\n    for (int j = 18; j < 25; j++)\n        count++;\nSystem.out.print(count);', '91')}
<p>13 × 7 = 91. Swap which one has the <code>&lt;=</code> (<code>i &lt; 57</code>, <code>j &lt;= 25</code>) and it becomes 12 × 8 = 96.</p>
<p>The same rules work with variables. If <code>a1 &lt;= a2</code> and <code>b1 &lt;= b2</code>:</p>
<table class="truth"><tr><th>outer</th><th>inner</th><th>prints</th></tr>
<tr><td class="mono">i = a1; i &lt; a2</td><td class="mono">j = b1; j &lt; b2</td><td class="mono">(a2 − a1)(b2 − b1)</td></tr>
<tr><td class="mono">i = a1; i &lt;= a2</td><td class="mono">j = b1; j &lt; b2</td><td class="mono">(a2 − a1 + 1)(b2 − b1)</td></tr>
<tr><td class="mono">i = a1; i &lt; a2</td><td class="mono">j = b1; j &lt;= b2</td><td class="mono">(a2 − a1)(b2 − b1 + 1)</td></tr>
<tr><td class="mono">i = a1; i &lt;= a2</td><td class="mono">j = b1; j &lt;= b2</td><td class="mono">(a2 − a1 + 1)(b2 − b1 + 1)</td></tr></table>

<h2>Triangular nested loops: add up the rows</h2>
<p>When the inner bound is i, row by row the counts grow: with <code>j &lt;= i</code> and i from 0 to 4, the rows run 1, 2, 3, 4, 5 times, which is 15. With <code>j &lt; i</code> they run 0, 1, 2, 3, 4 times, which is 10.</p>
${rule('1 + 2 + … + n = n(n + 1) / 2', 'so for outer <b>i = 0; i < n</b>: inner <b>j <= i</b> runs n(n + 1)/2 times in total, and inner <b>j < i</b> runs 0 + 1 + … + (n − 1) = (n − 1)n/2 times.')}
${show('int count = 0;\nint n = 10;\nfor (int i = 0; i < n; i++)\n    for (int j = 0; j <= i; j++)\n        count++;\nSystem.out.print(count);', '55')}
<p>10 × 11 / 2 = 55. Check your rule against the real loop with the calculator:</p>
<div class="sim" data-sim="count">
  <div class="sim-controls">
    <label>outer: i = <input type="number" data-k="a1" value="0" style="width:60px"></label>
    <label>i <select data-k="oop"><option>&lt;</option><option>&lt;=</option></select> <input type="number" data-k="a2" value="5" style="width:60px"></label>
    <label>inner <select data-k="mode"><option value="rect">j from b1 to b2</option><option value="le">j = 0; j &lt;= i</option><option value="lt">j = 0; j &lt; i</option></select></label>
    <label data-k="rect">j = <input type="number" data-k="b1" value="0" style="width:60px"> j <select data-k="iop"><option>&lt;</option><option>&lt;=</option></select> <input type="number" data-k="b2" value="8" style="width:60px"></label>
  </div>
  <div style="padding:0 12px" data-k="code"></div>
  <div class="sim-readout" data-k="ro"></div>
  <div class="sim-caption">The formula is computed from the rules; "actually ran" is the real count from running the Java code. They should always agree when the loops run at all.</div>
</div>

${call('analogy', 'Analogy: seats in a theater', 'A rectangular theater with 12 rows of 8 seats has 96 seats: multiply. A triangular one where row 1 has 1 seat, row 2 has 2 … up to row n has n(n + 1)/2: add.')}
${call('mistake', 'Common mistakes', '<ul><li>Forgetting the + 1 for <= (or adding it for <).</li><li>Multiplying for triangular loops, where the inner count changes every row.</li><li>Mixing up n(n + 1)/2 (j <= i) and n(n − 1)/2 (j < i).</li></ul>')}
${call('ap', 'On the AP exam', 'Expect "how many times is the statement executed?" with numbers and with variables like n. Count the outer loop, ask whether the inner bound depends on i, then multiply or add.')}
${check('How many times is "A" printed?<pre class="code"><span class="ln">for (int i = 3; i &lt;= 10; i++)</span><span class="ln">    for (int j = 0; j &lt; 4; j++)</span><span class="ln">        System.out.print("A");</span></pre>', ['28', '32', '36', '40'], 1, 'Outer: 10 − 3 + 1 = 8. Inner: 4 − 0 = 4. 8 × 4 = 32.')}
${check('For n &gt; 0, how many times does <code>count++</code> run?<pre class="code"><span class="ln">for (int i = 0; i &lt; n; i++)</span><span class="ln">    for (int j = 0; j &lt; i; j++)</span><span class="ln">        count++;</span></pre>', ['n²', 'n(n + 1)/2', 'n(n − 1)/2', 'n − 1'], 2, 'The rows run 0, 1, 2, …, n − 1 times. That sum is (n − 1)n/2.')}
${check('Precondition a1 &lt;= a2, b1 &lt;= b2. How many times does the body run?<pre class="code"><span class="ln">for (int i = a1; i &lt;= a2; i++)</span><span class="ln">    for (int j = b1; j &lt; b2; j++)</span><span class="ln">        System.out.print("A");</span></pre>', ['(a2 − a1)(b2 − b1)', '(a2 − a1 + 1)(b2 − b1)', '(a2 − a1)(b2 − b1 + 1)', '(a2 − a1 + 1)(b2 − b1 + 1)'], 1, 'Only the outer loop uses <=, so only the outer count gets + 1.')}
`,
    sims(el) {
      const host = el.querySelector('[data-sim="count"]');
      if (!host) return null;
      const q = (k) => host.querySelector(`[data-k="${k}"]`);
      const num = (k) => Math.trunc(Number(q(k).value) || 0);
      const draw = () => {
        const a1 = clamp(num('a1'), -50, 200), a2 = clamp(num('a2'), -50, 200), b1 = clamp(num('b1'), -50, 200), b2 = clamp(num('b2'), -50, 200);
        const oop = q('oop').value, iop = q('iop').value, mode = q('mode').value;
        q('rect').style.display = mode === 'rect' ? '' : 'none';
        const inner = mode === 'rect' ? `j = ${b1}; j ${iop} ${b2}` : mode === 'le' ? 'j = 0; j <= i' : 'j = 0; j < i';
        const src = `int count = 0;\nfor (int i = ${a1}; i ${oop} ${a2}; i++)\n    for (int ${inner}; j++)\n        count++;\nSystem.out.print(count);`;
        q('code').innerHTML = code(src);
        const outerN = Math.max(0, a2 - a1 + (oop === '<=' ? 1 : 0));
        let formula, fval;
        if (mode === 'rect') {
          const innerN = Math.max(0, b2 - b1 + (iop === '<=' ? 1 : 0));
          formula = `(${a2} − ${a1}${oop === '<=' ? ' + 1' : ''}) × (${b2} − ${b1}${iop === '<=' ? ' + 1' : ''}) = ${outerN} × ${innerN}`;
          fval = outerN * innerN;
        } else if (a1 === 0) {
          const n = outerN;
          formula = mode === 'le' ? `n(n + 1)/2 with n = ${n}` : `(n − 1)n/2 with n = ${n}`;
          fval = mode === 'le' ? n * (n + 1) / 2 : (n - 1) * n / 2;
          if (n === 0) fval = 0;
        } else {
          formula = 'add up the rows (the outer loop doesn\'t start at 0)';
          fval = null;
        }
        const r = JavaLite.run(src, { maxSteps: 200000 });
        const ran = r.error ? r.error.name : r.output;
        q('ro').innerHTML = `<span>outer passes: <b>${outerN}</b></span><span>formula: <b>${esc(formula)}</b>${fval !== null ? ` = <b>${fval}</b>` : ''}</span><span>actually ran: <b>${esc(ran)}</b></span>`;
      };
      ['a1', 'a2', 'b1', 'b2', 'oop', 'iop', 'mode'].forEach((k) => { q(k).oninput = q(k).onchange = draw; });
      draw();
      return null;
    },
  }));
})();
