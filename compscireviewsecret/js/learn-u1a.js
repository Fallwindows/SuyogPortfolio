// AP CSA Unit 1 (part A): compiling, algorithms, binary, variables, arithmetic, assignment,
// casting, rounding, compound assignment. Visual, first-principles lessons built on CSKit
// (tracers you can step and edit, expression steppers). Pushes lesson objects onto window.LESSONS.
// Each h2 lists the concept ids it teaches in data-concepts (see CS_CONCEPTS in concepts.js).
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);
  const { code, compare, rule, c, call, check } = CSKit;
  const title = (id) => (window.CS_LESSONS.find((l) => l.id === id) || {}).title || id;
  const sec = (text, concepts) => `<h2 data-concepts="${concepts}">${text}</h2>`;
  const widget = (kind, id) => `<div data-cs="${kind}" data-id="${id}"></div>`;
  const add = (order, id, render) => LESSONS.push({ unit: 1, order, id, title: title(id), render });

  // =====================================================================
  // 1. Compiling and running
  // =====================================================================
  add(1, 'cs1-compile', (el) => {
    el.innerHTML = `
<p class="lead">Before a single line of your program runs, a program called the <b>compiler</b> reads all of it. Knowing what the compiler checks (and what it can't) explains the three kinds of errors you'll ever see.</p>

${sec('Two stages: compile time, then run time', 'compile-vs-run')}
<p>Java is a high-level language: people can read it, but a computer can't run it directly. So your code goes through two stages:</p>
<ol>
<li><b>Compile time.</b> The compiler translates your Java into <b>bytecode</b>. If it finds even one problem, it stops. Nothing runs, nothing prints.</li>
<li><b>Run time.</b> Only if compiling succeeded does the program start running, line by line.</li>
</ol>
${call('idea', 'The big idea', 'A <b>compile error</b> anywhere means <b>zero</b> output, even if the mistake is on the last line. Run time is never reached.')}

${sec('The three kinds of errors', 'compile-error runtime-error logic-error')}
<ul>
<li><b>Compile error</b>: the code breaks Java's rules, usually a type problem. <span class="mono">8 / "John Cena"</span> can't compile, because division only works on numbers. Missing semicolons, undeclared variables and passing a String where a number is needed are also compile errors.</li>
<li><b>Runtime error</b>: the code compiles, starts running, then crashes. Examples: int division by zero (ArithmeticException), an index out of bounds, an infinite loop.</li>
<li><b>Logic error</b>: the code compiles and runs with no error message at all, but the answer is wrong. These are the sneakiest, because nothing warns you.</li>
</ul>
<p>Try each one in the stepper. Change the expression to <span class="mono">8 / 2</span>, <span class="mono">8 / 0</span>, then <span class="mono">8 / "John Cena"</span>.</p>
${widget('stepper', 's1')}

${sec('The compiler checks types, not values', 'compiler-no-values')}
<p>Why does <span class="mono">8 / 0</span> compile? The compiler doesn't calculate anything. It only sees "int divided by int", which is a perfectly legal kind of operation. The actual values only meet at run time, and that's when dividing by zero blows up.</p>
${compare([
  { title: 'Compile error', bad: true, src: 'System.out.println(8 / "John Cena");', note: 'Wrong types: the compiler rejects it. Nothing runs.' },
  { title: 'Runtime error', bad: true, src: 'System.out.println(8 / 0);', note: 'Types are fine (int / int), so it compiles. It crashes while running.' },
])}

${sec('Lines before a crash still run', 'statements-before-crash')}
<p>A runtime error stops the program at that line. Everything before it already happened. Step through these two programs: the only difference is the order of the lines.</p>
${widget('tracer', 't1')}
${widget('tracer', 't2')}

${sec('A logic error: the quadratic formula', 'logic-error')}
<p>Here are two methods meant to return the solutions of ax<sup>2</sup>+bx+c=0. The second pair is missing parentheses around <span class="mono">2*a</span>. It compiles and runs with no error, so the compiler can't help you.</p>
${widget('tracer', 't3')}
<p>With <span class="mono">/2*a</span>, Java divides by 2 and <i>then multiplies</i> by a (left to right). For a = 2, b = 5, c = −3 the correct roots are 0.5 and −3.0, but the broken version gives 2.0 and −12.0. And if the parameter <span class="mono">c</span> had been declared as a String, <span class="mono">4*a*c</span> wouldn't compile at all: that's a compile error, not a logic error.</p>

${call('analogy', 'Analogy: an essay going to print', 'A compile error is a spell-checker refusing to print your essay at all. A runtime error is the printer jamming on page 3: pages 1 and 2 already came out. A logic error is an essay that prints perfectly but argues the wrong thing.')}
${call('mistake', 'Common mistake: "8 / 0 is a compile error"', 'It compiles! The compiler only knows the types (int / int). The division by zero is discovered while running, so it is a <b>runtime</b> error, and any output before it still appears.')}
${call('ap', 'On the AP exam', 'Expect "Which best describes the result?" questions with choices like "compile error", "runtime error (ArithmeticException)", or a specific output. First ask: does every operation have legal types? Then ask: could a value cause a crash?')}
${check('What happens when this runs?<br>' + code('System.out.println("Hello World");\nSystem.out.println(3 / 0);'), ['Compile error, nothing prints', '"Hello World" prints, then an ArithmeticException', 'An ArithmeticException with nothing printed', '"Hello World" then Infinity'], 1, '3 / 0 is int / int, which compiles. At run time the first line prints, then the division by zero crashes the program.')}
${check('A method that should classify a 3-4-5 triangle as "right" says "obtuse". No error message appears. What kind of error is this?', ['Compile error', 'Runtime error', 'Logic error', 'Not an error'], 2, 'It compiles and runs without crashing but gives the wrong answer: a logic error.')}
`;
    return CSKit.mount(el, {
      s1: { expr: '8 / 0', caption: 'Edit the expression: 8 / 2 evaluates, 8 / 0 compiles but crashes, 8 / "John Cena" never compiles.' },
      t1: { title: 'Crash first', src: 'System.out.println(3 / 0);\nSystem.out.println("Hello World");', caption: 'The crash is on line 1, so line 2 never runs.' },
      t2: { title: 'Print first', src: 'System.out.println("Hello World");\nSystem.out.println(3 / 0);', caption: '"Hello World" prints first, then the program crashes.' },
      t3: {
        title: 'qf1/qf2 correct vs. missing parentheses',
        src: `public static double qf1(double a, double b, double c){
  return (-b + Math.sqrt(b*b - 4*a*c))/(2*a);
}
public static double qf2(double a, double b, double c){
  return (-b - Math.sqrt(b*b - 4*a*c))/(2*a);
}
public static double bad1(double a, double b, double c){
  return (-b + Math.sqrt(b*b - 4*a*c))/2*a;
}
public static double bad2(double a, double b, double c){
  return (-b - Math.sqrt(b*b - 4*a*c))/2*a;
}
System.out.println(qf1(2, 5, -3));
System.out.println(qf2(2, 5, -3));
System.out.println(bad1(2, 5, -3));
System.out.println(bad2(2, 5, -3));`,
        caption: 'Run to the end: 0.5 and −3.0 are right; 2.0 and −12.0 are a logic error.',
      },
    });
  });

  // =====================================================================
  // 2. Algorithms
  // =====================================================================
  add(2, 'cs1-algorithms', (el) => {
    el.innerHTML = `
<p class="lead">An <b>algorithm</b> is a list of steps that solves a problem. Programmers write the steps in plain words first, then turn each step into code. The hard thinking happens in the steps, not the Java.</p>

${sec('Steps first, code second', 'algorithm-steps')}
<p>Say we fire a projectile and want the horizontal distance it travels before landing. Before any Java, list the steps:</p>
<ol>
<li>Split the launch speed into vertical and horizontal parts using sine and cosine. Java's <span class="mono">Math.sin</span> and <span class="mono">Math.cos</span> use radians, so convert degrees with <span class="mono">angle*Math.PI/180</span>.</li>
<li>Find the time to hit the ground with the quadratic formula, using a = −4.9, b = vertical speed, c = starting height.</li>
<li>Multiply that time by the horizontal speed and return the result.</li>
</ol>
<p>Each step becomes a line or two of code:</p>
${code(`public static double calcDistance(double v0, double h0, double angle){
  angle = angle*Math.PI/180;          // step 1: degrees to radians
  double v0ver = v0*Math.sin(angle);
  double v0hor = v0*Math.cos(angle);
  double t = qf2(-4.9, v0ver, h0);    // step 2: time in the air
  return t*v0hor;                     // step 3: distance
}`)}

${sec('Preconditions make the problem smaller', 'precondition-algo')}
<p>The projectile algorithm only promises a correct answer under some assumptions, called <b>preconditions</b>: the launch speed is positive, the height is at least 0, the angle is between 0° and 90°, there's no air resistance, and the ground is flat at height 0. Code doesn't have to handle every possible input; it has to handle the inputs its preconditions allow.</p>
${rule('// Precondition: v0 > 0, h0 >= 0, 0 <= angle <= 90', 'A precondition is written as a comment above the method. If a caller breaks it, the method may return nonsense. That is the caller\'s fault, not the method\'s.')}

${sec('The order of the steps matters', 'check-order-algo')}
<p>Here is part of a Connect Four algorithm. After a piece is dropped:</p>
<ol>
<li>Check whether that move made four in a row. If so, that player wins.</li>
<li>Only if there was no win: is the board full (42 moves)? If so, it's a draw.</li>
<li>Otherwise, pass the turn.</li>
</ol>
<p>Swap steps 1 and 2 and a game where the 42nd move makes four in a row would be called a draw. Same checks, wrong order, wrong answer: a logic error.</p>
<p>Step through the order yourself. In this tracer, the last move both fills the board and wins. Click <b>Edit code</b> and swap the two <span class="mono">if</span> blocks to see the bug appear.</p>
${widget('tracer', 't1')}

${call('analogy', 'Analogy: a recipe', 'A recipe lists steps before you cook, assumes things ("preheat the oven" means you have an oven: a precondition), and the order matters: you can\'t frost a cake before you bake it.')}
${call('mistake', 'Common mistake: coding before thinking', 'Jumping straight into Java and patching it until the output looks right. Write the 3 to 5 steps first; most bugs are steps in the wrong order or a missed case.')}
${call('ap', 'On the AP exam', 'Free-response questions often describe an algorithm in words ("if the score is above 100, ...; otherwise ..."). Underline each step and each case, then translate them one at a time. Respect the stated preconditions: you don\'t need to handle inputs they rule out.')}
${check('A method has the precondition "n >= 2". What happens if it is called with n = 0?', ['It must throw an error', 'It must return 0', 'Its behavior is not guaranteed: the caller broke the precondition', 'It will not compile'], 2, 'Preconditions describe what the method assumes. Calls that break them may give any result.')}
${check('Why must the Connect Four program check for a win before checking for a full board?', ['Checking for a win is faster', 'A move that fills the board AND makes four in a row would wrongly be called a draw', 'The board can never be full', 'Java requires it'], 1, 'Both conditions can be true on the 42nd move; the win must take priority.')}
`;
    return CSKit.mount(el, {
      t1: {
        title: 'The 42nd move: a win, not a draw',
        src: `int moves = 42;
boolean fourInARow = true;
if(fourInARow){
  System.out.println("Win!");
}
else if(moves == 42){
  System.out.println("Draw");
}
else{
  System.out.println("Next player's turn");
}`,
        caption: 'Edit the code so the moves == 42 check comes first: now the winning move is reported as a draw.',
      },
    });
  });

  // =====================================================================
  // 3. Bits, bytes, binary, hex
  // =====================================================================
  add(3, 'cs1-binary', (el) => {
    el.innerHTML = `
<p class="lead">Every number in a computer is stored as a row of switches that are either off (0) or on (1). Once you see how those rows work, odd behavior like an int suddenly turning hugely negative makes complete sense.</p>

${sec('Bits and bytes', 'bits-bytes')}
<p>A <b>bit</b> is the smallest unit of computing: a single 0 or 1. Eight bits make a <b>byte</b>. Each bit doubles the number of patterns, so a byte has 2<sup>8</sup> = 256 possible values.</p>

${sec('Binary place values', 'binary-place')}
<p>Our normal numbers are base 10: each place is worth 10 times the one to its right. Binary is base 2: each place is worth <b>2 times</b> the one to its right. In an <b>unsigned</b> byte the eight places are worth</p>
${rule('128  64  32  16  8  4  2  1', 'Add up the places that hold a 1. Example: 00101011 = 32 + 8 + 2 + 1 = 43. An unsigned byte runs from 00000000 = 0 to 11111111 = 255.')}
<p>Click the bits below to flip them and watch every reading update.</p>
<div class="sim" data-sim="byte">
  <div class="byte-bits" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:18px 12px 6px"></div>
  <div class="byte-vals" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:0 12px 14px;font-size:12px"></div>
  <div class="sim-controls">
    <label><input type="checkbox" data-k="signed"> Signed (top bit is worth −128)</label>
    <button class="btn small" data-k="inc">+1</button>
    <button class="btn small" data-k="dec">−1</button>
    <button class="btn small" data-k="clear">All 0</button>
    <button class="btn small" data-k="max">Largest value</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Try this: set the signed byte to its largest value (01111111 = 127) and press +1. The pattern becomes 10000000, which a signed byte reads as −128. That wraparound is exactly what happens to an int that goes past its maximum.</div>
</div>

${sec('Signed bytes: one bit becomes negative', 'signed-byte')}
<p>To store negative numbers, a <b>signed</b> byte makes the top bit worth <b>−128</b> instead of +128. Everything else stays the same.</p>
<ul>
<li>01111111 = 64 + 32 + 16 + 8 + 4 + 2 + 1 = <b>127</b>, the largest signed byte.</li>
<li>10000000 = −128, the smallest.</li>
<li>10001001 = −128 + 8 + 1 = <b>−119</b> (the same bits mean 137 unsigned).</li>
<li>11111111 = −128 + 127 = <b>−1</b>. Add 1 and every bit carries over to 00000000 = 0, exactly as −1 + 1 should.</li>
</ul>

${sec('Hexadecimal', 'hex')}
<p>Hexadecimal is base 16, using digits 0–9 then A (10), B (11), C (12), D (13), E (14), F (15). Because 16 = 2<sup>4</sup>, every group of <b>4 bits is exactly one hex digit</b>:</p>
${rule('0010 1011  →  2B      1000 1001  →  89      1111 1111  →  FF', 'Split the byte into two groups of four and convert each group: 1011 = 8 + 2 + 1 = 11 = B.')}

${sec('An int is 32 bits', 'int-range')}
<p>An <span class="mono">int</span> uses 4 bytes = 32 bits, and its top bit is worth −2<sup>31</sup>. So its range is</p>
${rule('-2147483648  to  2147483647', 'That is −2³¹ to 2³¹ − 1. Java names them Integer.MIN_VALUE and Integer.MAX_VALUE. There are 2³² possible int values in total.')}

${sec('Overflow wraps around', 'int-overflow')}
<p>Integer.MAX_VALUE is 0 followed by 31 ones. Add 1 and you get 1 followed by 31 zeros, which is Integer.MIN_VALUE. Java doesn't warn you or crash: the value just wraps around.</p>
${widget('tracer', 't1')}

${sec('A double is twice as big', 'double-size')}
<p>A <span class="mono">double</span> uses 8 bytes (64 bits), twice an int, which is where the name comes from. It holds about 16 significant figures and reaches about ±1.79×10<sup>308</sup>, and can zoom in as small as about 4.94×10<sup>−324</sup>. A <span class="mono">boolean</span> only needs one bit's worth of information: true or false.</p>

${call('analogy', 'Analogy: a car odometer', 'An old 6-digit odometer at 999999 rolls over to 000000. An int at 2147483647 rolls over too, but because the top bit means "negative", it lands on −2147483648.')}
${call('mistake', 'Common mistake: expecting an error on overflow', 'Integer.MAX_VALUE + 1 does not crash and does not become 2147483648. It silently becomes −2147483648. Overflow is a logic error waiting to happen.')}
${call('ap', 'On the AP exam', 'Know that an int is 32 bits, that Integer.MAX_VALUE + 1 wraps to Integer.MIN_VALUE, and that a double has a far larger range. Binary/hex conversions show up as warm-up questions.')}
${check('What is the signed byte 11111110 in decimal?', ['254', '−2', '−126', '−1'], 1, '−128 + 64 + 32 + 16 + 8 + 4 + 2 = −128 + 126 = −2. (Unsigned it would be 254.)')}
${check('What does this print?<br>' + code('int x = Integer.MAX_VALUE;\nx++;\nSystem.out.print(x);'), ['2147483648', '-2147483648', 'An ArithmeticException', '2147483647'], 1, 'Overflow wraps around to Integer.MIN_VALUE with no error.')}
${check('Which hex digit is the binary group 1100?', ['C', '12', 'B', 'D'], 0, '1100 = 8 + 4 = 12, which is written C in hex.')}
`;
    // ---- the byte flipper ----
    const host = el.querySelector('[data-sim="byte"]');
    const bitsEl = host.querySelector('.byte-bits'), valsEl = host.querySelector('.byte-vals'), ro = host.querySelector('.sim-readout');
    const q = (k) => host.querySelector(`[data-k="${k}"]`);
    let bits = [0, 0, 1, 0, 1, 0, 1, 1]; // 43
    const signed = () => q('signed').checked;
    const unsignedVal = () => bits.reduce((a, b) => a * 2 + b, 0);
    const value = () => { const u = unsignedVal(); return signed() && bits[0] ? u - 256 : u; };
    function setFrom(n) { const u = ((n % 256) + 256) % 256; bits = bits.map((_, i) => (u >> (7 - i)) & 1); }
    function draw() {
      bitsEl.innerHTML = bits.map((b, i) => `<button class="btn" data-i="${i}" style="width:44px;height:52px;font-family:'JetBrains Mono',monospace;font-size:20px;${b ? 'background:var(--accent);color:var(--accent-text);border-color:var(--accent)' : ''}${i === 3 ? ';margin-right:10px' : ''}">${b}</button>`).join('');
      valsEl.innerHTML = bits.map((_, i) => {
        const w = i === 0 && signed() ? '−128' : String(128 >> i);
        return `<span class="mono" style="width:44px;text-align:center;${i === 0 && signed() ? 'color:var(--bad);font-weight:700' : 'color:var(--muted)'}${i === 3 ? ';margin-right:10px' : ''}">${w}</span>`;
      }).join('');
      const u = unsignedVal();
      const hex = u.toString(16).toUpperCase().padStart(2, '0');
      const parts = bits.map((b, i) => (b ? (i === 0 && signed() ? '−128' : String(128 >> i)) : null)).filter(Boolean);
      ro.innerHTML = `<span>${signed() ? 'Signed' : 'Unsigned'} value: <b>${value()}</b></span><span>= ${parts.join(' + ') || '0'}</span><span>hex: <b>${hex}</b></span><span class="muted">${signed() ? `unsigned would be ${u}` : `signed would be ${bits[0] ? u - 256 : u}`}</span>`;
      bitsEl.querySelectorAll('button').forEach((b) => { b.onclick = () => { const i = Number(b.dataset.i); bits[i] = 1 - bits[i]; draw(); }; });
    }
    q('signed').onchange = draw;
    q('inc').onclick = () => { setFrom(unsignedVal() + 1); draw(); };
    q('dec').onclick = () => { setFrom(unsignedVal() - 1); draw(); };
    q('clear').onclick = () => { setFrom(0); draw(); };
    q('max').onclick = () => { setFrom(signed() ? 127 : 255); draw(); };
    draw();
    return CSKit.mount(el, {
      t1: {
        title: 'Going past the largest int',
        src: `int big = Integer.MAX_VALUE;
System.out.println(big);
big = big + 1;
System.out.println(big);
int small = Integer.MIN_VALUE;
small--;
System.out.println(small);`,
        caption: 'MAX_VALUE + 1 wraps to MIN_VALUE, and MIN_VALUE − 1 wraps to MAX_VALUE. No error either way.',
      },
    });
  });

  // =====================================================================
  // 4. Primitive types and variables
  // =====================================================================
  add(4, 'cs1-variables', (el) => {
    el.innerHTML = `
<p class="lead">A variable is a named box that holds one value. Java is strict about what kind of value goes in each box, and that strictness is the source of most compile errors in Unit 1.</p>

${sec('The three primitive types', 'three-primitives')}
<ul>
<li><span class="mono">int</span>: a whole number, like 3 or −40.</li>
<li><span class="mono">double</span>: a number that can have decimals, like 3.14 or 2.0.</li>
<li><span class="mono">boolean</span>: exactly <span class="mono">true</span> or <span class="mono">false</span>.</li>
</ul>
<p>Everything else, including <span class="mono">String</span>, is an <b>object</b>, which we'll meet later.</p>

${sec('Declaring and initializing', 'declare-init')}
${rule('int a = 6;', '<b>Declaration</b> (int a) creates the box and fixes its type, once. <b>Initialization</b> (= 6) puts the first value in. Initializing at declaration is optional: int a; then a = 6; later is fine.')}
<p>Step through, and watch the variable appear when it's declared and change when it's assigned:</p>
${widget('tracer', 't1')}

${sec('Undeclared and twice-declared variables', 'undeclared redeclare')}
<p>A variable must be declared <b>the first time it is used</b>. Writing <span class="mono">a = 6;</span> before any <span class="mono">int a</span> gives <i>cannot find symbol</i>. Declaring it a second time in the same method (<span class="mono">int a = 6; int a = 7;</span>) gives <i>variable a is already defined</i>. Once it exists, just assign: <span class="mono">a = 7;</span>.</p>
${compare([
  { title: 'Compile error: cannot find symbol', bad: true, src: 'a = 6;\nint a = 7;\nSystem.out.print(a);' },
  { title: 'Compile error: already defined', bad: true, src: 'int a = 6;\nint a = 7;\nSystem.out.print(a);' },
])}

${sec('The box only takes its own type', 'type-mismatch')}
<p>Each of these is a compile error with the message <i>incompatible types</i>:</p>
${code(`int a = "Batman";     // String cannot be converted to int
boolean b = 1;        // int cannot be converted to boolean
int c = true;         // boolean cannot be converted to int`)}
<p>Unlike some languages, Java won't treat 1 as true or 0 as false. A boolean holds only true or false.</p>

${sec('final variables', 'final')}
<p>Adding <span class="mono">final</span> to a declaration locks the value after initialization. <span class="mono">final</span> is not a type; it goes in addition to the type: <span class="mono">final double PI = 3.14159;</span>. By convention final variables get ALL-CAPS names.</p>
${widget('tracer', 't2')}
<p>Reading a final variable is always fine. Only assigning it again is the error: <i>cannot assign a value to final variable PI</i>.</p>

${sec('Math.PI and Math.E', 'math-pi-e')}
<p>Java already has these constants as final variables in the Math class: <span class="mono">Math.PI</span> is 3.141592653589793 and <span class="mono">Math.E</span> is 2.718281828459045. Java is case sensitive, so <span class="mono">math.pi</span> or <span class="mono">Math.Pi</span> won't compile.</p>

${sec('Very large and tiny numbers', 'sci-notation double-print-format')}
<p>Doubles can be written in scientific notation with an E: <span class="mono">6.022E23</span> means 6.022×10<sup>23</sup> and <span class="mono">6.626E-34</span> means 6.626×10<sup>−34</sup>.</p>
<p>How a double <i>prints</i> is worth memorizing:</p>
<ul>
<li>A double always prints with a decimal point: <span class="mono">double a = 3;</span> prints <b>3.0</b>, never 3.</li>
<li>From 10<sup>7</sup> upward (or below 0.001), Java prints E notation: 6.022E23 prints as <b>6.022E23</b>, and 12345678.0 prints as <b>1.2345678E7</b>.</li>
</ul>
${widget('tracer', 't3')}

${call('analogy', 'Analogy: labeled jars', 'A variable is a jar with a label (the name) and a shape (the type). An int jar only takes whole numbers, a boolean jar only takes true or false. A final jar has its lid glued on after the first fill.')}
${call('mistake', 'Common mistakes', '<ul><li>Re-declaring: writing int a = 7; when a already exists. Just write a = 7;.</li><li>Expecting 3.0 to print as 3. A double always shows its decimal point.</li><li>Thinking final means "can\'t be read". It only means "can\'t be changed".</li></ul>')}
${call('ap', 'On the AP exam', 'Look for type mismatches in the choices: a String assigned to an int, a boolean to an int. Also expect output questions where a double prints as 5.0, or a huge value prints in E notation.')}
${check('Which line compiles?', ['int a = true;', 'boolean b = 0;', 'double d = 7;', 'int c = "7";'], 2, 'An int fits into a double (d becomes 7.0). The others mix incompatible types.')}
${check('What does this print?<br>' + code('final double PI = 3.14159;\nSystem.out.print(PI);'), ['3.14159', 'Compile error: PI is final', '3', 'Nothing'], 0, 'PI is only read, never reassigned, so final causes no problem.')}
${check('What does this print?<br>' + code('double x = 12345678;\nSystem.out.print(x);'), ['12345678', '12345678.0', '1.2345678E7', 'Compile error'], 2, 'The int converts to a double, and doubles of 10^7 or more print in E notation.')}
`;
    return CSKit.mount(el, {
      t1: { title: 'Declare, assign, reassign', src: 'int a;\na = 6;\nSystem.out.println(a);\na = 7;\nSystem.out.println(a);\nString hero = "Batman";\nboolean happy = true;\nSystem.out.println(hero + " " + happy);', caption: 'int a; declares a with no value yet (shown as —). Each later = replaces the value.' },
      t2: { title: 'final in action', src: 'final double PI = 3.14159;\nSystem.out.println(PI);\nPI = 2.71828;\nSystem.out.println(PI);', caption: 'This is a compile error, so nothing runs at all. Click Edit code and delete line 3 to make it run.' },
      t3: { title: 'How doubles print', src: 'double a = 3;\nSystem.out.println(a);\nfinal double avogadro = 6.022E23;\nSystem.out.println(avogadro);\nSystem.out.println(12345678.0);\nSystem.out.println(1234567.0);\nSystem.out.println(Math.PI);', caption: '3 prints as 3.0; 10^7 and above switch to E notation; 1234567.0 is still printed normally.' },
    });
  });

  // =====================================================================
  // 5. Arithmetic
  // =====================================================================
  add(5, 'cs1-arith', (el) => {
    el.innerHTML = `
<p class="lead">Java arithmetic looks like calculator arithmetic, with one big difference: when both numbers are ints, the answer is an int too. That one rule explains most "wrong" answers in this unit.</p>

${sec('Literals and variables', 'literal')}
<p>A <b>literal</b> is a value written directly in the code: <span class="mono">4</span> is an int literal, <span class="mono">4.0</span> a double literal, <span class="mono">"hi"</span> a String literal. A variable's value can change (unless it's final); a literal never does.</p>

${sec('Arithmetic only works on numbers', 'numeric-only-arith')}
<p><span class="mono">*</span>, <span class="mono">/</span>, <span class="mono">%</span>, <span class="mono">+</span> and <span class="mono">-</span> work on ints, doubles, and the Integer and Double objects. Anything else (<span class="mono">8 / "John Cena"</span>, <span class="mono">true * 2</span>) is a compile error. The one exception is <span class="mono">+</span>, which also joins Strings, which we cover in the concatenation lesson.</p>

${sec('int / int truncates', 'int-division')}
${rule('23 / 5  →  4', 'An int divided by an int gives an int. The decimal part is chopped off (truncated), never rounded: 29 / 10 is 2, not 3; −7 / 2 is −3.')}

${sec('Mixed mode: one double makes it a double', 'mixed-mode')}
${rule('23 / 5.0  →  4.6        23.0 / 5  →  4.6', 'If either side is a double, Java converts the other side to a double first, and the result is a double. No truncation happens.')}
<p>Edit the expression and see the type change. Try <span class="mono">18 / 3</span>, <span class="mono">18.0 / 3</span>, <span class="mono">21 / 5</span>, <span class="mono">21 / 5.0</span>.</p>
${widget('stepper', 's1')}

${sec('Modulus: the remainder', 'modulus mod-properties')}
${rule('a % b', 'The remainder when a is divided by b. 19 % 8 = 3 (19 = 2·8 + 3), 8 % 19 = 8 (8 = 0·19 + 8), 30 % 5 = 0.')}
<ul>
<li><span class="mono">a % b</span> is 0 exactly when b is a factor of a. So <span class="mono">n % 2 == 0</span> tests for even numbers.</li>
<li><span class="mono">a % 1</span> is always 0, and <span class="mono">0 % a</span> is 0 (for nonzero a).</li>
<li>% also works on doubles: <span class="mono">3.6 % 1.4</span> is about 0.8 (it prints 0.8000000000000003 because of rounding inside the computer). That's useful for keeping an angle between 0 and 2π.</li>
</ul>

${sec('Dividing by zero: int vs double', 'int-div-zero double-div-zero')}
<p>This is a favorite trick question.</p>
<ul>
<li><span class="mono">5 / 0</span> and <span class="mono">5 % 0</span>, int by int: <b>ArithmeticException</b> at run time. The program stops.</li>
<li><span class="mono">5 / 0.0</span>, <span class="mono">5.0 / 0</span>, <span class="mono">3.0 / 0.0</span>: the result is <b>Infinity</b>. No error, and the program keeps running.</li>
</ul>
${widget('tracer', 't1')}

${sec('Order of operations', 'arith-precedence')}
${rule('( )   then   * / %   then   + -', 'Parentheses first. Then multiplication, division and modulus, left to right. Then addition and subtraction, left to right.')}
<p>Step through the teacher's example one operation at a time:</p>
${widget('stepper', 's2')}
<p>Now put parentheses around <span class="mono">2 * 5</span>: <span class="mono">8 + 4 / (2 * 5) - 3 % 6</span> gives 5, because 4 / 10 is 0 in int division.</p>

${sec('The type can change halfway through', 'left-to-right-types')}
<p>Each operation is int or double on its own. In <span class="mono">1.0 * 46 / 10 + 36 / 10</span>, the first part becomes a double early (46.0 / 10 = 4.6), but <span class="mono">36 / 10</span> is still int / int = 3. The answer is 7.6, not 8.2.</p>
${widget('stepper', 's3')}

${call('analogy', 'Analogy: sharing pizzas', 'int division is handing out whole pizzas: 23 pizzas among 5 people is 4 each, with 3 left over (that\'s 23 % 5). Double division is slicing: 4.6 pizzas each.')}
${call('mistake', 'Common mistakes', '<ul><li>Rounding int division: 29 / 10 is 2, not 3.</li><li>Thinking 5 / 0.0 crashes. It\'s Infinity. Only int / int by zero throws.</li><li>Assuming one double early in an expression makes every later division a double.</li></ul>')}
${call('ap', 'On the AP exam', 'Evaluate expressions like 7 / 2 * 2.0 + 7 % 3 step by step, tracking whether each intermediate value is an int or a double. Write the type next to each step.')}
${check('What is <span class="mono">7 / 2 * 2.0</span>?', ['7.0', '6.0', '6', '7'], 1, '7 / 2 is int division = 3; then 3 * 2.0 = 6.0.')}
${check('What happens?<br>' + code('System.out.println(3.0 / 0);\nSystem.out.println("Hello World");'), ['ArithmeticException, nothing prints', 'Infinity, then Hello World', 'Compile error', '0.0, then Hello World'], 1, 'A double divided by 0 is Infinity, not an error, so the next line runs.')}
${check('What is <span class="mono">17 % 5 + 17 / 5</span>?', ['5', '6.4', '2', '3'], 0, '17 % 5 = 2 and 17 / 5 = 3 (int division), so 2 + 3 = 5.')}
`;
    return CSKit.mount(el, {
      s1: { expr: '23 / 5', caption: 'int / int gives an int. Change either number to a double (23.0 or 5.0) and the answer becomes 4.6.' },
      s2: { expr: '8 + 4 / 2 * 5 - 3 % 6', caption: '4 / 2, then * 5, then 3 % 6: all left to right at the same level, before any + or −.' },
      s3: { expr: '1.0 * 46 / 10 + 36 / 10', caption: '46.0 / 10 is a double division, but 36 / 10 is still int / int.' },
      t1: { title: 'Zero: int vs double', src: 'System.out.println(3.0 / 0);\nSystem.out.println(3 / 0.0);\nSystem.out.println(3.0 / 0.0);\nSystem.out.println("Hello World");\nSystem.out.println(3 / 0);\nSystem.out.println("Never printed");', caption: 'Three Infinitys and Hello World print. Then int 3 / 0 crashes, so the last line never runs.' },
    });
  });

  // =====================================================================
  // 6. Assignment, swapping, print vs println
  // =====================================================================
  add(6, 'cs1-assign', (el) => {
    el.innerHTML = `
<p class="lead">The = sign in Java doesn't mean "is equal to". It means "compute the right side, then store it in the box on the left". Read it as an arrow pointing left, and swapping, tracing and printing all become easy.</p>

${sec('Assignment copies the current value', 'assign-is-snapshot')}
${rule('b = a;', 'Take the value a has RIGHT NOW and copy it into b. If a changes later, b keeps the old copy. The two boxes are not linked.')}
${widget('tracer', 't1')}

${sec('Swapping two variables', 'swap-temp')}
<p>Suppose a = 2 and b = 5 and we want a = 5, b = 2. The obvious attempt fails:</p>
${compare([
  { title: 'Wrong', bad: true, src: 'a = b;   // a is 5\nb = a;   // b is 5 too!', note: 'a\'s original value (2) was overwritten before anyone saved it.' },
  { title: 'Right', good: true, src: 'int temp = a;  // save 2\na = b;         // a is 5\nb = temp;      // b is 2', note: 'A temporary variable holds one value while the other moves.' },
])}
<p>Step through both. Then click Edit code and try the other correct order: <span class="mono">int temp = b; b = a; a = temp;</span>.</p>
${widget('tracer', 't2')}

${sec('print vs println', 'print-println')}
<ul>
<li><span class="mono">System.out.print(x)</span> shows x and stays on the same line.</li>
<li><span class="mono">System.out.println(x)</span> shows x, <b>then</b> moves to a new line. With nothing inside, <span class="mono">println()</span> just ends the line.</li>
</ul>
${widget('tracer', 't3')}
<p>B and C end up on the same line because print("B") didn't end its line.</p>

${sec('Parentheses around a whole denominator', 'quadratic-parens')}
<p>The quadratic formula needs the entire numerator divided by the entire 2a:</p>
${compare([
  { title: 'Right', good: true, src: 'return (-b + Math.sqrt(b*b - 4*a*c))/(2*a);' },
  { title: 'Logic error', bad: true, src: 'return (-b + Math.sqrt(b*b - 4*a*c))/2*a;', note: '/2*a divides by 2, then multiplies by a, because / and * go left to right.' },
])}
<p>A method can only return one value, which is why the notes use two methods, qf1 (with +) and qf2 (with −), one for each solution. For qf1(4, 3, −6) and qf2(4, 3, −6) they print 0.9058688457449497 and −1.6558688457449497.</p>

${call('analogy', 'Analogy: two full cups', 'To swap the drinks in two full cups you need a third, empty cup. Pouring cup A into cup B first just spills A\'s drink away. temp is the empty cup.')}
${call('mistake', 'Common mistake: reading = as "equals"', 'x = x + 1 isn\'t a false equation. It means: take x, add 1, store it back in x. (Testing for equality uses ==, which comes in Unit 2.)')}
${call('ap', 'On the AP exam', 'Trace questions update several variables in sequence. Keep a small table with one column per variable and update it line by line. And watch for print vs println when the question asks for the exact output layout.')}
${check('a is 2 and b is 5. After <span class="mono">a = b; b = a;</span>, what are a and b?', ['a = 5, b = 2', 'a = 5, b = 5', 'a = 2, b = 2', 'a = 2, b = 5'], 1, 'a = b sets a to 5. Then b = a copies that 5 into b. The 2 is lost.')}
${check('What is printed?<br>' + code('System.out.print("A");\nSystem.out.println("B");\nSystem.out.print("C");'), ['A B C on three lines', 'AB, then C on the next line', 'ABC on one line', 'A, then BC'], 1, 'print("A") stays on the line, println("B") prints B then ends the line, so C starts the next line.')}
`;
    return CSKit.mount(el, {
      t1: { title: 'Copies, not links', src: 'int a = 4;\nint b = a;\na = 10;\nSystem.out.println(a);\nSystem.out.println(b);', caption: 'b got a copy of 4. Changing a to 10 afterward does not touch b.' },
      t2: { title: 'Swapping with temp', src: 'int a = 2;\nint b = 5;\nint temp = a;\na = b;\nb = temp;\nSystem.out.println(a + " " + b);', caption: 'Watch temp hold the 2 while a takes b\'s 5.' },
      t3: { title: 'print vs println', src: 'System.out.println("A");\nSystem.out.print("B");\nSystem.out.println("C");\nSystem.out.println("D");\nSystem.out.print("E");', caption: 'The output box shows exactly where each line break happens.' },
    });
  });

  // =====================================================================
  // 7. Casting
  // =====================================================================
  add(7, 'cs1-casting', (el) => {
    el.innerHTML = `
<p class="lead">An int fits inside a double, but a double doesn't fit inside an int. Casting is how you tell Java to force a value into a different numeric type, and exactly <i>where</i> you put the cast changes the answer.</p>

${sec('Widening: int fits into double', 'widening')}
<p>An int is 4 bytes and a double is 8. Java happily puts a smaller int into a bigger double: <span class="mono">double a = 3;</span> stores 3.0. Going the other way won't fit, so <span class="mono">int a = 3.0;</span> is a compile error: <i>incompatible types: possible lossy conversion from double to int</i>.</p>
${compare([
  { title: 'Compiles: a becomes 3.0', good: true, src: 'double a = 3;\nSystem.out.print(a);' },
  { title: 'Compile error', bad: true, src: 'int a = 3.0;\nSystem.out.print(a);' },
])}

${sec('The cast operators', 'cast-int')}
${rule('(int) x        (double) x', '(int) chops off the decimal part, toward zero: (int)3.9 is 3 and (int)-3.9 is -3. It never rounds. (double) adds .0: (double)5 is 5.0.')}

${sec('Casts happen before arithmetic', 'cast-precedence cast-right-to-left')}
<p>A cast binds tighter than <span class="mono">*</span>, <span class="mono">/</span>, <span class="mono">%</span>, <span class="mono">+</span>, <span class="mono">-</span>. So it applies only to the thing right after it, unless you use parentheses.</p>
${compare([
  { title: '(int)a * 2  →  10', src: 'double a = 5.6;\nint b = (int)a * 2;', note: '(int)5.6 = 5 happens first, then 5 * 2.' },
  { title: '(int)(a * 2)  →  11', src: 'double a = 5.6;\nint b = (int)(a * 2);', note: '5.6 * 2 = 11.2 happens first, then (int)11.2 = 11.' },
])}
<p>Several casts in a row are applied right to left: <span class="mono">(double)(int)9.8133</span> first does (int) to get 9, then (double) to get 9.0.</p>
${widget('stepper', 's1')}

${sec('Where the cast goes in a division', 'cast-quotient')}
<p>With <span class="mono">int a = 54, b = 10</span>, every one of these "divides 54 by 10" but they don't agree:</p>
${widget('tracer', 't1')}
<ul>
<li><span class="mono">a / b</span> is int division: 5. Stored in a double it becomes 5.0.</li>
<li><span class="mono">(double)a / b</span>: cast first (54.0), then divide: <b>5.4</b>.</li>
<li><span class="mono">a / (double)b</span>: also 5.4.</li>
<li><span class="mono">(double)(a / b)</span>: the parentheses make int division happen first (5), and then it's cast to 5.0. Too late.</li>
</ul>

${sec('Case study: win proportion', 'win-proportion')}
<p>A method should return wins ÷ games, so 8 wins in 10 games should give 0.8.</p>
${widget('tracer', 't2')}
<p><span class="mono">return wins/games;</span> computes 8 / 10 = 0 as an int, <i>then</i> the return converts it to 0.0. Casting the numerator fixes it: <span class="mono">return (double)wins/games;</span> gives 0.8.</p>
${rule('(double)a / b', 'To get the calculator answer from two ints, cast the numerator OR the denominator. Do not cast the whole quotient (double)(a / b).')}

${sec('Casting a huge double to int', 'cast-out-of-range')}
<p>What if the double is far too big for an int? Java doesn't wrap around here; it clamps. <span class="mono">(int)6.022E22</span> is 2147483647 (Integer.MAX_VALUE), and <span class="mono">(int)-6.022E22</span> is −2147483648 (Integer.MIN_VALUE).</p>
${widget('tracer', 't3')}

${call('analogy', 'Analogy: a measuring cup', 'Pouring a small cup (int) into a big jug (double) is safe. Pouring the jug into the cup needs you to deliberately throw some away: that\'s the cast, and what spills is the decimal part.')}
${call('mistake', 'Common mistakes', '<ul><li>(int) rounding. It truncates: (int)3.99 is 3.</li><li>Writing (double)(wins/games). The int division already lost the decimals.</li><li>Expecting a giant double cast to int to wrap like overflow. It clamps to MAX_VALUE or MIN_VALUE instead.</li></ul>')}
${call('ap', 'On the AP exam', 'Questions love (double) placement: "Which expression returns the average as a double?" Pick the one that casts before the division happens.')}
${check('int a = 7, b = 2. What is <span class="mono">(double)(a / b)</span>?', ['3.5', '3.0', '3', '4.0'], 1, 'a / b is int division = 3, and only then is it cast to 3.0.')}
${check('What is <span class="mono">(int)(2.7 * 3)</span>?', ['6', '8', '8.1', '9'], 1, '2.7 * 3 = 8.1 first (parentheses), then (int) truncates to 8.')}
${check('What does <span class="mono">(int)-4.9</span> evaluate to?', ['−5', '−4', '4', '−4.0'], 1, 'Casting to int chops the decimal toward zero.')}
`;
    return CSKit.mount(el, {
      s1: { expr: '(double)(int)a', vars: { a: ['double', 9.8133] }, caption: 'Right to left: (int) first makes 9, then (double) makes 9.0. Try (int)a * 2 and (int)(a * 2).' },
      t1: { title: 'Four ways to divide 54 by 10', src: 'int a = 54;\nint b = 10;\ndouble c1 = a / b;\ndouble c2 = (double)a / b;\ndouble c3 = a / (double)b;\ndouble c4 = (double)(a / b);\nSystem.out.println(c1);\nSystem.out.println(c2);\nSystem.out.println(c3);\nSystem.out.println(c4);', caption: 'Only casting before the division keeps the .4.' },
      t2: { title: 'winProportion: broken and fixed', src: 'public static double winBroken(int wins, int games){\n  return wins/games;\n}\npublic static double winFixed(int wins, int games){\n  return (double)wins/games;\n}\nSystem.out.println(winBroken(8, 10));\nSystem.out.println(winFixed(8, 10));', caption: 'winBroken returns 0.0; winFixed returns 0.8.' },
      t3: { title: 'Clamping, not wrapping', src: 'System.out.println((int)(6.022E22));\nSystem.out.println((int)(-6.022E22));\nSystem.out.println((int)3.99);', caption: 'Too-big doubles clamp to Integer.MAX_VALUE / MIN_VALUE. (int)3.99 truncates to 3.' },
    });
  });

  // =====================================================================
  // 8. Rounding methods
  // =====================================================================
  add(8, 'cs1-rounding', (el) => {
    el.innerHTML = `
<p class="lead">Casting always truncates, but we often want to round to the nearest whole number or to two decimal places. A clever +0.5 trick does it, and the two rounding methods in the notes also introduce overloading: two methods sharing one name.</p>

${sec('Rounding to the nearest integer with + 0.5', 'round-half')}
<p>Truncation chops down. But if you add 0.5 first, anything that was .5 or more gets pushed past the next whole number before the chop:</p>
${rule('(int)(num + 0.5)', 'Rounds a positive num: 12.58 + 0.5 = 13.08 → 13, while 12.3 + 0.5 = 12.8 → 12. For negatives use (int)(num - 0.5): -12.58 - 0.5 = -13.08 → -13.')}
<p>That's why the method needs an if: positive numbers add 0.5 and negative ones subtract it. <span class="mono">if(num > 0)</span> and <span class="mono">if(num >= 0)</span> both work, because 0.0 rounds to 0 either way.</p>

${sec('Why the parentheses matter', 'round-parens')}
<p>Casting happens before +. Without parentheses, <span class="mono">(int)num + 0.5</span> casts first (12) and then adds 0.5 (12.5), which is a double. Returning a double from a method declared to return int is a compile error.</p>
${compare([
  { title: 'Compile error', bad: true, src: 'public static int round(double num){\n  return (int)num + 0.5;\n}', note: 'int + double is a double; it can\'t be returned as an int.' },
  { title: 'Correct', good: true, src: 'public static int round(double num){\n  return (int)(num + 0.5);\n}' },
])}

${sec('Rounding to a number of decimal places', 'round-digits')}
<p>To round 12.58623064 to 2 places: multiply by 10<sup>2</sup> (1258.623064), round to the nearest integer (1259), divide by 100 as a double (12.59).</p>
${widget('tracer', 't1')}

${sec('Overloading: two methods, one name', 'overload-intro')}
<p>Both methods are called <span class="mono">round</span>. That's allowed because their <b>parameter types</b> differ: one takes <span class="mono">(double)</span>, the other <span class="mono">(double, int)</span>. Java picks the right one from the arguments:</p>
<ul>
<li><span class="mono">round(num)</span>: one double argument, so it runs the first method and returns an int.</li>
<li><span class="mono">round(num, 2)</span>: a double then an int, so it runs the second method, which itself calls the first.</li>
</ul>
<p>Step through the tracer and watch which method each call jumps into.</p>

${call('analogy', 'Analogy: the 0.5 nudge', 'Think of each whole number as a step on a staircase. Truncating always drops you to the step below. Adding 0.5 first means anyone more than halfway up gets lifted onto the next step before the drop.')}
${call('mistake', 'Common mistakes', '<ul><li>Forgetting the negative case: (int)(-2.7 + 0.5) = (int)(-2.2) = -2, but -2.7 should round to -3.</li><li>Dividing by an int at the end: num / powTen with num an int would truncate again. In the method, num is a double, so the division keeps decimals.</li></ul>')}
${call('ap', 'On the AP exam', 'You may be asked which expression rounds a positive double x to the nearest int: (int)(x + 0.5). Watch for distractors like (int)x + 0.5 or (int)(x) + 1.')}
${check('What does <span class="mono">(int)(7.5 + 0.5)</span> give?', ['7', '8', '8.0', '7.5'], 1, '7.5 + 0.5 = 8.0, and (int)8.0 = 8.')}
${check('Two methods: <span class="mono">round(double)</span> and <span class="mono">round(double, int)</span>. Which runs for <span class="mono">round(3.14159, 3)</span>?', ['round(double)', 'round(double, int)', 'Compile error: duplicate method', 'Both'], 1, 'The arguments are a double then an int, matching the second signature.')}
`;
    return CSKit.mount(el, {
      t1: {
        title: 'The two overloaded round methods',
        src: `public static int round(double num){
  if(num > 0)
    return (int)(num + 0.5);
  return (int)(num - 0.5);
}
public static double round(double num, int digits){
  int powTen = (int)(Math.pow(10, digits));
  num = round(num*powTen);
  return num/powTen;
}
double num = 12.58623064;
System.out.println(round(num));
System.out.println(round(num, 2));
System.out.println(round(-12.58623064));`,
        caption: 'round(num) prints 13; round(num, 2) calls round(1258.623064) = 1259, stores 1259.0, and returns 12.59.',
      },
    });
  });

  // =====================================================================
  // 9. Compound assignment
  // =====================================================================
  add(9, 'cs1-compound', (el) => {
    el.innerHTML = `
<p class="lead">Changing a variable based on its own value is so common that Java has shortcuts for it. They save typing, but they hide two traps: int division and the fact that they happen last.</p>

${sec('++ and --', 'inc-dec')}
${rule('a++;        a--;', 'a++ takes a\'s value, adds 1, and stores it back in a. a-- subtracts 1. If a is 4, after a++ it is 5.')}

${sec('Compound assignment operators', 'compound-ops')}
${rule('a += 7;   a -= 7;   a *= 7;   a /= 7;   a %= 7;', 'a += 7 means a = a + 7. The others work the same way with their operator.')}

${sec('/= on an int truncates', 'compound-int-div')}
<p>If a is an int, <span class="mono">a /= 5</span> is int division. 17 /= 5 leaves a = 3, not 3.4. Same rule as before: two ints give an int.</p>

${sec('Tracing a chain', 'compound-trace')}
<p>Step through the teacher's chain, keeping track of a after every line:</p>
${widget('tracer', 't1')}
<p>Now a trickier one with two variables. Predict each value before you step. The last line has a surprise.</p>
${widget('tracer', 't2')}
<p>b /= a makes b = 5 / 15 = 0 (int division). Then a %= b is 15 % 0, which throws ArithmeticException, because % is a remainder of a division, and you can't divide by zero.</p>

${sec('Assignment happens last', 'assign-lowest')}
<p>All assignment operators (=, +=, -=, *=, /=, %=) have the <b>lowest</b> precedence in Java. The whole right side is computed first.</p>
${compare([
  { title: 'x = 5*x + 1;  →  21', src: 'int x = 4;\nx = 5*x + 1;', note: '5*4 = 20, + 1 = 21, then store 21.' },
  { title: 'y *= 5 + 1;  →  24', src: 'int y = 4;\ny *= 5 + 1;', note: '5 + 1 = 6 first, then y = y * 6 = 24, not 4*5 + 1.' },
])}
${widget('tracer', 't3')}

${call('analogy', 'Analogy: a bank deposit slip', 'balance += deposit + bonus: the teller totals the slip (deposit + bonus) first, and only then adds the total to your balance. The += is the last thing that happens.')}
${call('mistake', 'Common mistake: y *= 5 + 1 as (y * 5) + 1', '*= is an assignment, so it happens last: y = y * (5 + 1).')}
${call('ap', 'On the AP exam', 'Trace questions chain many compound assignments. Make a table with one row per line and one column per variable. Watch for int division in /= and a zero sneaking into a later / or %.')}
${check('int a = 20; then a++; a -= 4; a %= 3; a += 7; a *= 2; a--; a /= 5; What is a?', ['3', '3.4', '17', '18'], 0, '21, 17, 2, 9, 18, 17, then 17 / 5 = 3 in int division.')}
${check('int y = 3; y *= 2 + 4; What is y?', ['10', '18', '6', '24'], 1, '2 + 4 = 6 first, then y = 3 * 6 = 18.')}
`;
    return CSKit.mount(el, {
      t1: { title: 'One variable, many updates', src: 'int a = 20;\na++;\nSystem.out.println(a);\na -= 4;\nSystem.out.println(a);\na %= 3;\nSystem.out.println(a);\na += 7;\nSystem.out.println(a);\na *= 2;\nSystem.out.println(a);\na--;\nSystem.out.println(a);\na /= 5;\nSystem.out.println(a);', caption: '21, 17, 2, 9, 18, 17, 3. The last one is 17 / 5 in int division.' },
      t2: { title: 'Two variables and a hidden zero', src: 'int a = 5;\nint b = 2;\na -= b;\nb += a;\na *= b;\nb /= a;\na %= b;\nSystem.out.println(a);', caption: 'a = 3, b = 5, a = 15, b = 5 / 15 = 0, then 15 % 0 crashes.' },
      t3: { title: 'Assignment is last', src: 'int x = 4;\nx = 5*x + 1;\nSystem.out.println(x);\nint y = 4;\ny *= 5 + 1;\nSystem.out.println(y);', caption: '21 and 24.' },
    });
  });
})();
