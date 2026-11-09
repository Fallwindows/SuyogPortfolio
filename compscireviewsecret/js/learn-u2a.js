// AP CSA Unit 2 · Selection and Iteration — lessons 2.1 to 2.6 (algorithms, booleans, if/else, logic).
// Visual, first-principles lessons in the same style as Physics Review. Pushes onto window.LESSONS.
// Every runnable snippet is listed in the lesson's `checks` so the test harness can run it in JavaLite
// and confirm the output the lesson claims.
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);
  const K = window.CSKit;
  const { code, compare, rule, c, call, check } = K;
  const esc = (s) => PR.esc(s);
  const titleOf = (id) => (window.CS_LESSONS.find((l) => l.id === id) || {}).title || id;
  // Invisible anchor marking where a concept is taught (the concept map links here).
  const tag = (...ids) => ids.map((id) => `<span class="ctag" id="c-${id}"></span>`).join('');

  // Seeded Math.random for tracers, so a demo with random rolls replays the same way each time.
  function seeded(seed) { const r = PR.rng(seed); return () => r(); }

  function lesson(order, id, o) {
    LESSONS.push({
      unit: 2, order, id, title: titleOf(id), concepts: o.concepts, checks: o.checks || [],
      render(el) {
        el.innerHTML = o.html;
        const stopMount = K.mount(el, o.specs || {});
        const stopExtra = o.after ? o.after(el) : null;
        return () => { stopMount(); if (typeof stopExtra === 'function') stopExtra(); };
      },
    });
  }

  // =====================================================================
  // 2.1 Algorithms with selection and repetition
  // =====================================================================
  const PACHISI = `public static int cowrieCount(double p){
    int count = 0;
    for(int i = 0; i < 6; i++){
        if(Math.random() < p)
            count++;
    }
    return count;
}
public static int getMoveValue(int count){
    if(count == 0)
        return 25;
    if(count == 1)
        return 10;
    return count;
}
public static boolean extraTurn(int count){
    return count == 0 || count == 1 || count == 6;
}
int up = cowrieCount(0.5);
System.out.println("Shells up: " + up);
System.out.println("Move: " + getMoveValue(up));
System.out.println("Extra turn: " + extraTurn(up));`;
  const STRATEGO = `// positive: attacker wins, 0: tie, negative: defender wins
public static int result(int attackingRank, int defendingRank){
    if(attackingRank == 1 && defendingRank == 10)
        return 1;   // the spy beats the marshal
    if(attackingRank == 3 && defendingRank == 11)
        return 1;   // the miner defuses the bomb
    return attackingRank - defendingRank;
}
System.out.println(result(1, 10));
System.out.println(result(3, 11));
System.out.println(result(10, 1));
System.out.println(result(4, 7));
System.out.println(result(6, 6));`;
  const STRATEGO_BAD = `public static int result(int attackingRank, int defendingRank){
    return attackingRank - defendingRank;
    if(attackingRank == 1 && defendingRank == 10)
        return 1;
}
System.out.println(result(1, 10));`;

  lesson(1, 'cs2-algorithms', {
    concepts: ['algo-describe', 'loop-replaces-repeat', 'exceptions-first', 'return-exits', 'sign-encodes-result'],
    checks: [{ src: STRATEGO, expect: '1\n1\n9\n-3\n0\n' }, { src: STRATEGO_BAD, expect: 'Compile error' }, { src: PACHISI, random: true }],
    html: `
<p class="lead">Unit 1 gave you the pieces: variables, arithmetic, method calls. Unit 2 adds the two things that make programs think. <b>Selection</b> means doing different things depending on a condition (if). <b>Repetition</b> means doing something many times (loops). Almost every interesting algorithm is these two ideas mixed together.</p>

<h2>Describe it first, then code it</h2>
${tag('algo-describe')}
<p>An algorithm is a list of steps precise enough that a computer could follow them. Writing the steps in plain words <i>before</i> writing Java splits a big problem into small ones, and each small one usually becomes a method.</p>
<p>Take the board game <b>Pachisi</b>. On your turn you throw 6 cowrie shells. Each shell lands face up with probability <i>p</i>. Then:</p>
<ul>
<li>0 shells up: move 25 spaces. 1 shell up: move 10 spaces.</li>
<li>2 or more up: move as many spaces as there are shells up.</li>
<li>If 0, 1, or 6 shells landed up, you get another turn.</li>
</ul>
<p>The algorithm in three steps:</p>
<ol>
<li><b>Count</b>: six times, check ${c('Math.random() < p')}, and keep a count of the trues.</li>
<li><b>Decide</b>: use the count to find the number of spaces.</li>
<li><b>Decide again</b>: use the count to find whether there's an extra turn.</li>
</ol>
<p>Each step became one method. Step through it below. The random rolls replay the same way each time you reset, so you can watch the count climb.</p>
<div data-cs="tracer" data-id="pachisi"></div>

<h2>Loops replace repeated code</h2>
${tag('loop-replaces-repeat')}
<p>Without a loop, counting six shells means writing the same two lines six times. The loop says "do this 6 times" once.</p>
${compare([
  { title: 'Without a loop', src: `int count = 0;
if(Math.random() < p)
    count++;
if(Math.random() < p)
    count++;
if(Math.random() < p)
    count++;
// ... three more copies ...
return count;` },
  { title: 'With a loop', good: true, src: `int count = 0;
for(int i = 0; i < 6; i++){
    if(Math.random() < p)
        count++;
}
return count;`, note: 'Change 6 to 100 shells and the loop version stays three lines long.' },
])}

<h2>Exceptions first, then the general rule</h2>
${tag('exceptions-first', 'sign-encodes-result')}
<p>In <b>Stratego</b>, every piece has a rank (bomb 11, marshal 10, general 9, … miner 3, scout 2, spy 1, flag 0). When one piece attacks another, the higher rank wins and equal ranks tie, with two exceptions: a <b>spy attacking the marshal</b> wins, and a <b>miner attacking a bomb</b> wins.</p>
<p>Step 1 handles the exceptions. Step 2 is the general rule. The method returns one int whose <b>sign</b> carries the result: positive means the attacker won, 0 means a tie, negative means the defender won. Then ${c('attackingRank - defendingRank')} does the whole general rule in one subtraction.</p>
${rule('return attackingRank - defendingRank;', 'positive → attacker wins · 0 → tie · negative → defender wins. One number can carry three outcomes.')}
<div data-cs="tracer" data-id="stratego"></div>

<h2>return ends the method</h2>
${tag('return-exits')}
<p>Why must the exceptions come first? Because <b>a return statement ends the method immediately</b>. Once a return runs, nothing after it executes. If the general rule came first, the exception checks would never run. The compiler can see that, so it refuses to compile the code at all: "unreachable statement".</p>
<div data-cs="tracer" data-id="strategoBad"></div>

${call('analogy', 'Analogy: a bouncer with a VIP list', 'A bouncer checks the VIP list first ("are you on it? come in"), then applies the general rule ("21 or older?"). Check the age first and the VIPs who are 20 never get in.')}
${call('mistake', 'Common mistake: general rule before exceptions', `Putting ${c('return a - b;')} first makes every line after it unreachable (a compile error). With an if/else version, the bug can compile and silently ignore the special cases.`)}
${call('ap', 'On the AP exam', 'Free-response questions often describe a rule with exceptions ("…unless…", "…except when…"). Write the exceptions as early returns, then the general case. And read every method you call: its return value is the only thing that comes back.')}
${check('A method has <code>if(x &gt; 0) return 1;</code> followed by <code>return 0;</code>. What does it return when x is 5?', ['1, and the second return never runs', '0, because the last return wins', '1 and then 0', 'It does not compile'], 0, 'The first return that runs ends the method. With x = 5 the if is true, so it returns 1 and stops.')}
${check('In the Stratego method, result(9, 9) returns…', ['1', '0', '−1', '18'], 1, 'Neither exception applies, so it returns 9 − 9 = 0: a tie.')}
`,
    specs: {
      pachisi: { src: PACHISI, random: seeded(7), title: 'Pachisi: one turn', caption: 'The loop runs 6 times. Watch the condition on line 4 come out true or false, and <b>count</b> go up only on the trues.' },
      stratego: { src: STRATEGO, title: 'Stratego attack results', caption: 'result(1, 10) is the spy hitting the marshal. The first if catches it before the subtraction could say −9.' },
      strategoBad: { src: STRATEGO_BAD, title: 'General rule first: does not compile', caption: 'Line 3 can never run, because line 2 always returns first.' },
    },
  });

  // =====================================================================
  // 2.2 Relational operators
  // =====================================================================
  lesson(2, 'cs2-relational', {
    concepts: ['relational-ops', 'relational-numeric', 'rel-precedence', 'rel-chain-error', 'bool-eq-bool', 'string-compare-method'],
    checks: [
      { src: 'boolean a = true; boolean b = false; System.out.print(a != b);', expect: 'true' },
      { src: 'String s1 = "hello"; String s2 = "world"; System.out.print(s1 > s2);', expect: 'Compile error' },
      { src: 'boolean a = true; boolean b = false; System.out.print(a > b);', expect: 'Compile error' },
      { src: 'String s1 = "hello"; String s2 = "world"; System.out.print(s1.compareTo(s2) < 0);', expect: 'true' },
    ],
    html: `
<p class="lead">Every decision a program makes starts with a question that has a yes/no answer: is the score at least 90? Is the index past the end? In Java those questions are <b>boolean expressions</b>, and most of them are built from six relational operators.</p>

<h2>Six ways to compare</h2>
${tag('relational-ops')}
<table class="truth"><tr><th>Operator</th><th>Means</th><th>Example</th><th>Value</th></tr>
<tr><td class="mono">&gt;</td><td>greater than</td><td class="mono">7 &gt; 3</td><td>true</td></tr>
<tr><td class="mono">&gt;=</td><td>greater than or equal to</td><td class="mono">3 &gt;= 3</td><td>true</td></tr>
<tr><td class="mono">&lt;</td><td>less than</td><td class="mono">2 &lt; 2</td><td>false</td></tr>
<tr><td class="mono">&lt;=</td><td>less than or equal to</td><td class="mono">2 &lt;= 2</td><td>true</td></tr>
<tr><td class="mono">==</td><td>equal to</td><td class="mono">4 == 4.0</td><td>true</td></tr>
<tr><td class="mono">!=</td><td>not equal to</td><td class="mono">true != false</td><td>true</td></tr></table>
<p>Each one takes two values and produces a single <b>boolean</b>: true or false. That boolean can be printed, stored in a boolean variable, or (next lessons) used to steer an if or a loop.</p>
${code('boolean a = true;\nboolean b = false;\nSystem.out.print(a != b);   // true: two different values')}

<h2>&lt; &gt; &lt;= &gt;= only work on numbers</h2>
${tag('relational-numeric', 'string-compare-method')}
<p>Asking whether one number is bigger than another makes sense. Asking whether ${c('"hello"')} is bigger than ${c('"world"')}, or ${c('true')} bigger than ${c('false')}, doesn't, so Java refuses to compile it. The ordering operators only accept <b>int, double, Integer, and Double</b>. ${c('==')} and ${c('!=')} are more general: they work on any two comparable values, numbers or not.</p>
${compare([
  { title: 'Compile error: bad operand types', bad: true, src: 'String s1 = "hello";\nString s2 = "world";\nSystem.out.print(s1 > s2);' },
  { title: 'Compile error: bad operand types', bad: true, src: 'boolean a = true;\nboolean b = false;\nSystem.out.print(a > b);' },
])}
<p>To put Strings in alphabetical order, call the String method ${c('compareTo')} from Unit 1: ${c('s1.compareTo(s2) < 0')} is true when s1 comes first. That compiles, because compareTo returns an int.</p>

<h2>Precedence: where comparisons fall in line</h2>
${tag('rel-precedence')}
<p>A single line can mix arithmetic, ordering comparisons, and equality checks. Java evaluates them in a fixed order:</p>
${rule('*  /  %   →   +  -   →   <  >  <=  >=   →   ==  !=   →   &&   →   ||', 'arithmetic first, then the ordering comparisons, then equality, then AND, then OR. Within one level, left to right.')}
<p>Step through the notes' example. Press <b>Next step</b> to watch Java do one operation at a time:</p>
<div data-cs="stepper" data-id="prec1"></div>

<h2>Why ordering comes before equality</h2>
${tag('rel-chain-error', 'bool-eq-bool')}
<p>Here's the reason behind that order. The ordering operators need two numbers and produce a boolean. ${c('==')} is happy comparing two booleans. So doing the ordering comparisons first turns numbers into booleans, and then ${c('==')} compares the booleans. Force the opposite order with parentheses and you end up asking "is 15 greater than false?", which doesn't compile:</p>
<div data-cs="stepper" data-id="prec2"></div>
<p>The same thing happens with chains of ${c('!=')}. All three variables here are ints:</p>
<div class="fig-row">
<div data-cs="stepper" data-id="chainBad"></div>
<div data-cs="stepper" data-id="chainOk"></div>
</div>
<p>${c('a != b == b != c')} goes left to right: ${c('a != b')} gives ${c('true')}, and then ${c('true == b')} compares a boolean with an int, which is a compile error. Parenthesize each comparison and you're comparing two booleans, which is fine. In the same way, ${c('a > b == b > c')} is legal without parentheses, because the ordering comparisons run first and leave two booleans for ${c('==')}.</p>
<div data-cs="stepper" data-id="gtChain"></div>

${call('analogy', 'Analogy: sorting mail before delivering it', 'The post office sorts by city before sorting by street. Doing it the other way works sometimes and makes a mess the rest of the time. Java\'s precedence table is a fixed sorting order, so every program means the same thing.')}
${call('mistake', 'Common mistakes', `<ul><li>Writing ${c('3 < x < 10')} like in math. In Java, ${c('3 < x')} becomes a boolean, and then ${c('true < 10')} doesn't compile. Use ${c('3 < x && x < 10')} (next lessons).</li><li>Using ${c('<')} on Strings. Use compareTo.</li><li>Forgetting that ${c('==')} and ${c('!=')} come after ${c('<')} ${c('>')} ${c('<=')} ${c('>=')}.</li></ul>`)}
${call('ap', 'On the AP exam', 'Expect "what does this print?" with mixed arithmetic and comparisons, and "which of these does not compile?" where the trap is comparing a boolean with a number, or ordering Strings or booleans.')}
${check('What does <code>System.out.print(4 + 2 * 3 &gt;= 10 == 7 % 4 &lt; 2);</code> print?', ['true', 'false', 'Compile error', '10'], 1, 'Arithmetic first: 2 * 3 = 6, 4 + 6 = 10, 7 % 4 = 3. Both comparisons come next: 10 >= 10 is true and 3 < 2 is false. Last, == compares them: true == false is <b>false</b>.')}
${check('Which of these compiles? (x, y, z are ints)', ['<code>x &lt; y &lt; z</code>', '<code>x != y == y != z</code>', '<code>x &lt; y == y &lt; z</code>', '<code>"a" &lt; "b"</code>'], 2, 'x < y == y < z runs both comparisons first, then compares two booleans. The others compare a boolean with an int, or order Strings.')}
`,
    specs: {
      prec1: { expr: '3 * 5 > 20 == 5.5 - 2 <= 3', caption: 'Multiplication, then subtraction, then the two ordering comparisons, then == compares the two booleans.' },
      prec2: { expr: '3 * 5 > (20 == 5.5 - 2) <= 3', caption: 'The parentheses force == first, which leaves 15 > false. That is a compile error.' },
      chainBad: { expr: 'a != b == b != c', vars: { a: ['int', 4], b: ['int', 5], c: ['int', 6] }, editable: false },
      chainOk: { expr: '(a != b) == (b != c)', vars: { a: ['int', 4], b: ['int', 5], c: ['int', 6] }, editable: false },
      gtChain: { expr: 'a > b == b > c', vars: { a: ['int', 4], b: ['int', 5], c: ['int', 6] }, caption: 'a > b and b > c both happen first. false == false is true.' },
    },
  });
  // =====================================================================
  // 2.2 Equality on objects and doubles
  // =====================================================================
  const EPS_SRC = `public static boolean doubleEquality(double a, double b){
    return Math.abs(a - b) < 1E-10;
}
double left = 3.333*3.333 + 4.444*4.444;
double right = 5.555*5.555;
System.out.println(left);
System.out.println(right);
System.out.println(left == right);
System.out.println(doubleEquality(left, right));`;
  lesson(3, 'cs2-equality', {
    concepts: ['eq-primitive', 'eq-reference', 'eq-incomparable', 'double-roundoff', 'epsilon'],
    checks: [
      { src: 'int a = 5; Integer b = new Integer(5); System.out.print(a == b);', expect: 'true' },
      { src: 'int a = 5; double b = 5.0; System.out.print(a == b);', expect: 'true' },
      { src: 'Integer a = new Integer(5); Integer b = new Integer(5); System.out.print(a == b);', expect: 'false' },
      { src: 'Integer a = new Integer(5); Double b = new Double(5); System.out.print(a == b);', expect: 'Compile error' },
      { src: 'System.out.print(3.0*3.0 + 4.0*4.0 == 5.0*5.0);', expect: 'true' },
      { src: 'System.out.print(3.333*3.333 + 4.444*4.444 == 5.555*5.555);', expect: 'false' },
      { src: EPS_SRC, expect: '30.858025\n30.858024999999998\nfalse\ntrue\n' },
      { src: 'Integer a = null; Integer b = null; System.out.print(a == b);', expect: 'true' },
    ],
    html: `
<p class="lead">${c('==')} looks like the simplest operator in Java, but it means two different things. For <b>primitives</b> (int, double, boolean) it asks "same value?". For <b>objects</b> it asks "same object?". And doubles add a third twist: two numbers that are equal on paper can come out a hair apart.</p>

<h2>Primitives: same value?</h2>
${tag('eq-primitive')}
<p>For ints, doubles, and booleans, ${c('==')} compares the values. Mixed types get converted first:</p>
${compare([
  { title: 'int vs double: true', good: true, src: 'int a = 5;\ndouble b = 5.0;\nSystem.out.print(a == b);', note: 'The 5 is widened to 5.0, then compared.' },
  { title: 'int vs Integer: true', good: true, src: 'int a = 5;\nInteger b = new Integer(5);\nSystem.out.print(a == b);', note: 'Java unpacks ("unboxes") the 5 inside the Integer, because one side is a primitive.' },
])}

<h2>Objects: same object?</h2>
${tag('eq-reference', 'eq-incomparable')}
<p>An object variable doesn't hold the object. It holds a <b>reference</b>, an arrow pointing at the object. ${c('==')} between two references asks whether the two arrows point at the <i>same</i> object. Two separate objects with identical contents are still two objects:</p>
<div data-cs="tracer" data-id="ints"></div>
<p>Two different object types can't be compared with ${c('==')} at all. An Integer and a Double can never be the same object, so the compiler stops you:</p>
${code('Integer a = new Integer(5);\nDouble b = new Double(5);\nSystem.out.print(a == b);   // compile error: incomparable types')}
<p>And two references that both hold ${c('null')} (pointing at nothing) are ${c('==')}: both point at the same nothing.</p>
<p class="muted" style="font-size:14px">(Modern Java marks <code>new Integer(5)</code> as old-fashioned, but it still compiles, and it's the clearest way to see identity.)</p>

<h2>Doubles: equal on paper, not in the computer</h2>
${tag('double-roundoff')}
<p>${c('3.0*3.0 + 4.0*4.0 == 5.0*5.0')} is true: 9.0 + 16.0 and 25.0 are stored exactly. Now try a right triangle with sides 3.333, 4.444, and 5.555. It's the same triangle scaled by 1.111, so mathematically the equation holds. But a double stores numbers in binary with about 16 significant figures, and most decimals (like 0.1) have no exact binary form, so tiny rounding errors creep in:</p>
<div data-cs="tracer" data-id="eps"></div>

<h2>The fix: close enough counts as equal</h2>
${tag('epsilon')}
${rule('Math.abs(a - b) < EPSILON', 'a, b = the doubles being compared · EPSILON = a tiny tolerance such as 1E-10 (0.0000000001). If they differ by less than EPSILON, treat them as equal.')}
<p>The two values above differ by about 3.6×10<sup>−15</sup>, far below 10<sup>−10</sup>, so doubleEquality says true. Use ${c('==')} on doubles only when you know the values are exact, like whole numbers or the result of a cast.</p>

${call('analogy', 'Analogy: twins vs the same person', 'Identical twins look the same (equal contents) but are two people. <code>==</code> on objects asks "is this literally the same person?" Two new Integer(5) objects are twins.')}
${call('mistake', 'Common mistakes', `<ul><li>Expecting ${c('new Integer(5) == new Integer(5)')} to be true. It's false: two objects.</li><li>Expecting ${c('Integer == Double')} to compile.</li><li>Testing computed doubles with ${c('==')}. Use a tolerance.</li></ul>`)}
${call('ap', 'On the AP exam', 'Questions about "what does this print" with == on objects test identity vs contents. For Strings, the AP-safe habit is to always compare contents with <code>equals</code>, never <code>==</code>.')}
${check('<code>int a = 7; Integer b = new Integer(7); Integer c = new Integer(7);</code> What are <code>a == b</code> and <code>b == c</code>?', ['true, true', 'true, false', 'false, false', 'false, true'], 1, 'a == b unboxes b because a is a primitive: true. b == c compares two different objects: false.')}
${check('Why is <code>0.1 + 0.2 == 0.3</code> false in Java?', ['Java rounds to 1 decimal place', 'Doubles store most decimals approximately in binary, so the sum is 0.30000000000000004', '== cannot compare doubles', 'It is a compile error'], 1, 'Floating-point rounding. Compare with Math.abs(x - 0.3) < 1E-10 instead.')}
`,
    specs: {
      ints: { src: 'Integer a = new Integer(5);\nInteger b = new Integer(5);\nInteger c = a;\nSystem.out.println(a == b);\nSystem.out.println(a == c);', title: 'Same contents vs same object', caption: 'a and b are two objects holding 5, so a == b is false. c = a copies the arrow, so a and c point at one object: true.', editable: true },
      eps: { src: EPS_SRC, title: 'Floating-point rounding', caption: 'Mathematically left equals right. In binary they land 1 digit apart in the 16th place, so == says false. The EPSILON check says true.' },
    },
  });

  // =====================================================================
  // 2.3 Part A: if statements
  // =====================================================================
  const EX4 = `int a = 1, b = 3, c = 4;
if((a + b) % 2 == 0){
    a++;
    b *= 5;
}
if(b <= c){
    b -= 2;
    c += a + b;
}
if(2*a < c)
    c *= a + b;
System.out.print(a + " " + b + " " + c);`;
  const EX5 = EX4.replace('if((a + b) % 2 == 0){', 'if(a + b % 2 == 0){');
  const PYTH = `public static boolean isPythTrip(int a, int b, int c){
    if(a > c){
        int temp = a;
        a = c;
        c = temp;
    }
    if(b > c){
        int temp = b;
        b = c;
        c = temp;
    }
    return a*a + b*b == c*c;
}
System.out.println(isPythTrip(5, 3, 4));
System.out.println(isPythTrip(3, 4, 5));
System.out.println(isPythTrip(3, 4, 6));`;
  const BRACES_BAD = `int a = 3;
if(a > 5)
    a++;
    System.out.print("a was incremented");`;
  lesson(4, 'cs2-if', {
    concepts: ['not-op', 'if-boolean', 'if-braces', 'sequential-ifs', 'mod-vs-plus', 'if-swap'],
    checks: [
      { src: EX4, expect: '2 15 4' }, { src: EX5, expect: '1 1 12' }, { src: PYTH, expect: 'true\ntrue\nfalse\n' },
      { src: BRACES_BAD, expect: 'a was incremented' },
      { src: 'int a = 3; if(a) a++;', expect: 'Compile error' }, { src: 'int a = 3; if(!a) a++;', expect: 'Compile error' },
      { src: 'int a = 3; if(!(a > 5)) System.out.print("small");', expect: 'small' },
    ],
    html: `
<p class="lead">An if statement is a fork in the road: a boolean decides whether a piece of code runs or gets skipped. Three details trip people up: the condition must really be a boolean, braces decide <i>how much</i> code the if controls, and each if is asked at the moment the program reaches it.</p>

<h2>The parameter of an if is one boolean</h2>
${tag('if-boolean', 'not-op')}
${rule('if( boolean condition )  statement', 'when the condition is true, the statement runs; when false, it is skipped and the program continues after it.')}
<p>Let ${c('a')} be an int and ${c('b')} a boolean:</p>
<table class="truth"><tr><th>if</th><th>Compiles?</th><th>Why</th></tr>
<tr><td class="mono">if(a)</td><td class="f">no</td><td>a is an int, not a boolean (C/Python habits don't carry over)</td></tr>
<tr><td class="mono">if(b)</td><td class="t">yes</td><td>runs when b is true</td></tr>
<tr><td class="mono">if(a &gt; 5)</td><td class="t">yes</td><td>a &gt; 5 evaluates to a boolean</td></tr>
<tr><td class="mono">if(!b)</td><td class="t">yes</td><td>runs when b is false</td></tr>
<tr><td class="mono">if(!a)</td><td class="f">no</td><td>! only goes in front of a boolean</td></tr>
<tr><td class="mono">if(!(a &gt; 5))</td><td class="t">yes</td><td>same as if(a &lt;= 5)</td></tr></table>
<p>${c('!')} is the <b>NOT</b> operator. It is <b>unary</b>: it applies to one value, unlike ${c('*')}, which needs two. It flips true to false and false to true, and only works on booleans.</p>
<div data-cs="stepper" data-id="notStep"></div>

<h2>Braces: how much does the if control?</h2>
${tag('if-braces')}
<p>With exactly one statement, braces are optional. With two or more, braces are <b>required</b>, because without them the if controls only the very next statement. Indentation means nothing to Java.</p>
${compare([
  { title: 'Bug: the print always runs', bad: true, src: BRACES_BAD, note: 'a is 3, so a++ is skipped, but the message still prints. Only a++ belongs to the if.' },
  { title: 'Fixed with braces', good: true, src: 'int a = 3;\nif(a > 5){\n    a++;\n    System.out.print("a was incremented");\n}', note: 'Now both statements are skipped when a <= 5.' },
])}

<h2>Each if is its own question, asked when it's reached</h2>
${tag('sequential-ifs')}
<p>Several ifs in a row are <b>independent</b>: each one is checked when the program gets to it, using the variables as they are <i>at that moment</i>. An earlier if can change a variable that a later if tests. Trace the notes' Example 4 one line at a time:</p>
<div data-cs="tracer" data-id="ex4"></div>
<p>The last if has no braces, so it controls only ${c('c *= a + b;')}. Here 4 &lt; 4 is false, so c stays 4. Output: <b>2 15 4</b>.</p>

<h2>One missing pair of parentheses</h2>
${tag('mod-vs-plus')}
<p>Example 5 is the same code with ${c('(a + b) % 2')} changed to ${c('a + b % 2')}. Since ${c('%')} happens before ${c('+')}, that's ${c('a + (b % 2)')} = 1 + 1 = 2, so the first condition is now false. Everything after changes:</p>
<div data-cs="tracer" data-id="ex5"></div>

<h2>Using ifs to make a guarantee: swapping</h2>
${tag('if-swap')}
<p>${c('a*a + b*b == c*c')} tests for a right triangle only if c is the longest side. Instead of making that a precondition, two ifs <b>swap</b> values (with a temp variable, from Unit 1) so that c always ends up the largest:</p>
<div data-cs="tracer" data-id="pyth"></div>
<p>For isPythTrip(5, 3, 4), the first if swaps a and c, so the method tests 4·4 + 3·3 == 5·5: true. Without the swaps it would test 5·5 + 3·3 == 4·4 and wrongly say false.</p>

${call('analogy', 'Analogy: security checkpoints', 'Each if is a checkpoint you walk through in order. A checkpoint that hands you a badge (changes a variable) changes how the next checkpoint treats you.')}
${call('mistake', 'Common mistakes', `<ul><li>Two statements under an if with no braces: only the first is controlled.</li><li>${c('if(a)')} with an int: doesn't compile.</li><li>${c('a + b % 2')} when you meant ${c('(a + b) % 2')}.</li></ul>`)}
${call('ap', 'On the AP exam', 'Tracing sequential ifs is a multiple-choice favorite. Keep a small table of every variable and update it line by line. Never use the starting values for a later if.')}
${check('<code>int x = 4;</code> then <code>if(x &gt; 3) x += 2; if(x &gt; 5) x *= 10; System.out.print(x);</code> prints…', ['6', '60', '40', '4'], 1, 'The first if makes x = 6. The second if sees 6 > 5 (not the old 4), so x becomes 60.')}
${check('Which compiles if <code>n</code> is an int?', ['<code>if(n % 2)</code>', '<code>if(!n)</code>', '<code>if(!(n % 2 == 0))</code>', '<code>if(n = 0)</code>'], 2, '!(n % 2 == 0) negates a boolean. The others put an int (or an assignment) where a boolean is required.')}
`,
    specs: {
      notStep: { expr: '!(a > 5)', vars: { a: ['int', 3] }, caption: 'Try changing it to !a to see the compile error.' },
      ex4: { src: EX4, title: 'Example 4: three independent ifs', caption: 'Green bar: the condition was true. Red bar: false, so that code is skipped.' },
      ex5: { src: EX5, title: 'Example 5: a + b % 2', caption: '1 + 3 % 2 is 1 + 1 = 2, and 2 == 0 is false. The first block is skipped, so the later conditions see different values. Output: 1 1 12.' },
      pyth: { src: PYTH, title: 'isPythTrip with swaps' },
    },
  });

  // =====================================================================
  // 2.3 Part B: if-else
  // =====================================================================
  const MR1 = `public static int mrMethod(int a, int b){
    if(a == b)
        return 2*a*b;
}
System.out.print(mrMethod(2, 2));`;
  const MR2 = `public static int mrMethod(int a, int b){
    if(a == b)
        return 2*a*b;
    else
        return a*b;
}
System.out.print(mrMethod(2, 3));`;
  const MR3 = `public static int mrMethod(int a, int b){
    if(a == b)
        return 2*a*b;
    return a*b;
}
System.out.print(mrMethod(4, 4));`;
  const MR4 = `public static int mrMethod(int a, int b){
    if(a == b)
        return 2*a*b;
    if(a != b)
        return a*b;
}
System.out.print(mrMethod(2, 3));`;
  const WATER = `double T = -5;
if(T < 0)
    System.out.print("ice ");
if(T <= 100)
    System.out.print("liquid water ");
else
    System.out.print("steam ");`;
  const EX6A = `int x = 4;
if(x == 4){
    x++;
    System.out.println("hello");
}
if(x != 4)
    System.out.print("world");`;
  const EX6B = `int x = 4;
if(x == 4){
    x++;
    System.out.println("hello");
}
else
    System.out.print("world");`;
  const QUAD = `public static double round(double num, int digits){
    int powTen = (int)(Math.pow(10, digits));
    return (double)Math.round(num*powTen)/powTen;
}
public static void printQuadraticSolutions(double a, double b, double c){
    double disc = b*b - 4*a*c;
    if(disc >= 0){
        double s1 = (-b + Math.sqrt(disc))/(2*a);
        double s2 = (-b - Math.sqrt(disc))/(2*a);
        System.out.println(round(s1, 2) + ", " + round(s2, 2));
    }
    else{
        double realCo = -b/(2*a);
        double imagCo = Math.sqrt(Math.abs(disc))/(2*a);
        System.out.print(round(realCo, 2) + " + " + round(imagCo, 2) + "i, ");
        System.out.println(round(realCo, 2) + " - " + round(imagCo, 2) + "i");
    }
}
printQuadraticSolutions(2, 5, -3);
printQuadraticSolutions(2, 8, -3);
printQuadraticSolutions(1, -10, 25);
printQuadraticSolutions(2, 3, 10);`;
  lesson(5, 'cs2-if-else', {
    concepts: ['if-else-one', 'missing-return', 'else-checked-once', 'separate-if-bug'],
    checks: [
      { src: MR1, expect: 'Compile error' }, { src: MR2, expect: '6' }, { src: MR3, expect: '32' }, { src: MR4, expect: 'Compile error' },
      { src: WATER, expect: 'ice liquid water ' }, { src: EX6A, expect: 'hello\nworld' }, { src: EX6B, expect: 'hello\n' },
      { src: QUAD, expect: '0.5, -3.0\n0.35, -4.35\n5.0, 5.0\n-0.75 + 2.11i, -0.75 - 2.11i\n' },
    ],
    html: `
<p class="lead">An if alone either runs its code or doesn't. Add an <b>else</b> and you get a guarantee: exactly one of two paths runs, every time. That guarantee matters most when a method has to return something.</p>

<h2>Exactly one of the two</h2>
${tag('if-else-one')}
${code('if(condition){\n    // code set 1: runs when condition is true\n}\nelse{\n    // code set 2: runs when condition is false\n}')}
<p>When the program reaches this, exactly one code set runs. Never both, never neither.</p>

<h2>A method must <i>guarantee</i> its return</h2>
${tag('missing-return')}
<p>A method with a return type like int promises to return an int <b>no matter what</b>. The compiler doesn't run your code to check. It looks at the structure and asks: is there any path through this method that reaches the end without a return? If so: <i>missing return statement</i>. Try all four versions from the notes:</p>
<div class="fig-row"><div data-cs="tracer" data-id="mr1"></div><div data-cs="tracer" data-id="mr2"></div></div>
<div class="fig-row"><div data-cs="tracer" data-id="mr3"></div><div data-cs="tracer" data-id="mr4"></div></div>
<p>Version 4 is the sneaky one. We know that either ${c('a == b')} or ${c('a != b')} must be true, but the compiler treats two separate ifs as two independent questions that could both be false. It doesn't reason about what the conditions mean. Only an else (or a final unconditional return) settles it.</p>

<h2>The else is decided at the same moment as the if</h2>
${tag('else-checked-once')}
<p>An if is checked <b>once</b>. The else's fate is sealed at that same instant: if the condition was true when checked, the else is skipped, even if code inside the if changes the variable. Compare two separate ifs with an if-else:</p>
<div class="fig-row"><div data-cs="tracer" data-id="ex6a"></div><div data-cs="tracer" data-id="ex6b"></div></div>
<p>In both, ${c('x++')} changes x to 5 inside the first block. With a separate ${c('if(x != 4)')}, that new question sees 5 and prints "world". With else, there's no new question. The else was already ruled out when ${c('x == 4')} was true.</p>

<h2>Two ifs where you meant one decision</h2>
${tag('separate-if-bug')}
<p>This code means to print the state of water at temperature T. For T = −5 it prints <b>both</b> "ice" and "liquid water", because the second if is a separate question, and −5 &lt;= 100 is true:</p>
<div data-cs="tracer" data-id="water"></div>
<p>The fix is to make the second if part of the same decision: ${c('else if(T <= 100)')}. That's next lesson.</p>

<h2>A bigger example: the quadratic formula</h2>
<p>An if-else picks between real and complex solutions depending on the discriminant b² − 4ac. One branch or the other always runs, so something always prints.</p>
<div data-cs="tracer" data-id="quad"></div>

${call('analogy', 'Analogy: a fork in a trail', 'At a fork you go left or right: exactly one, decided once, when you reach it. Two separate signposts that each say "go this way if…" could send you down both trails, or neither.')}
${call('mistake', 'Common mistake: "but one of my ifs has to be true"', 'The compiler never reasons about whether conditions cover every case. <code>if(x &gt; 0) return 1; if(x &lt;= 0) return 0;</code> still has a missing return statement. Use else, or end with an unconditional return.')}
${call('ap', 'On the AP exam', 'Missing-return questions ask which version compiles. Look for an else (or a last return outside any if) on every path. On free response, a non-void method that can fall off the end loses points even if your logic is right.')}
${check('Which version compiles?', ['<code>if(n &gt; 0) return "pos"; if(n &lt;= 0) return "not";</code>', '<code>if(n &gt; 0) return "pos"; else return "not";</code>', '<code>if(n &gt; 0) return "pos";</code>', 'none of them'], 1, 'Only the if-else guarantees a return on every path the compiler can see.')}
${check('<code>int x = 1; if(x &lt; 5){ x = 10; } else { x = 20; } System.out.print(x);</code>', ['10', '20', '1020', '1'], 0, 'x < 5 is true when checked, so x = 10. The else was ruled out at that moment and never runs.')}
`,
    specs: {
      mr1: { src: MR1, title: 'Version 1', caption: 'When a != b nothing is returned: compile error.' },
      mr2: { src: MR2, title: 'Version 2: if-else', caption: 'Every path returns.' },
      mr3: { src: MR3, title: 'Version 3: final return', caption: 'The unconditional return at the end covers every other case.' },
      mr4: { src: MR4, title: 'Version 4: two ifs', caption: 'Compile error, even though one of the conditions is always true.' },
      ex6a: { src: EX6A, title: 'Two separate ifs', editable: false },
      ex6b: { src: EX6B, title: 'if-else', editable: false },
      water: { src: WATER, title: 'States of water (buggy)', caption: 'Change line 4 to else if(T <= 100) using Edit code, then run it again.' },
      quad: { src: QUAD, title: 'Real or complex solutions' },
    },
  });

  // =====================================================================
  // 2.3 Part C: else-if chains
  // =====================================================================
  const WEATHER_BAD = `int temp = 20;
String weather;
if(temp <= 31)
    weather = "cold";
else
    weather = "cool";
if(temp <= 70)
    weather = "moderate";
else
    weather = "warm";
System.out.print(weather);`;
  const WEATHER = `int temp = 20;
String weather;
if(temp <= 31)
    weather = "cold";
else if(temp <= 50)
    weather = "cool";
else if(temp <= 70)
    weather = "moderate";
else
    weather = "warm";
System.out.print(weather);`;
  const GRADE_UP = `double numberGrade = 85;
String letterGrade = "F";
if(numberGrade >= 60)
    letterGrade = "D";
if(numberGrade >= 70)
    letterGrade = "C";
if(numberGrade >= 80)
    letterGrade = "B";
if(numberGrade >= 90)
    letterGrade = "A";
System.out.print(letterGrade);`;
  const GRADE_BAD = `double numberGrade = 85;
String letterGrade = "F";
if(numberGrade >= 60)
    letterGrade = "D";
else if(numberGrade >= 70)
    letterGrade = "C";
else if(numberGrade >= 80)
    letterGrade = "B";
else if(numberGrade >= 90)
    letterGrade = "A";
System.out.print(letterGrade);`;
  const GRADE = `double numberGrade = 85;
String letterGrade;
if(numberGrade >= 90)
    letterGrade = "A";
else if(numberGrade >= 80)
    letterGrade = "B";
else if(numberGrade >= 70)
    letterGrade = "C";
else if(numberGrade >= 60)
    letterGrade = "D";
else
    letterGrade = "F";
System.out.print(letterGrade);`;
  const BONUS = `public static int bonusPoints(int goldenStars){
    int score = 0;
    if(goldenStars >= 30){
        System.out.println("You got 4000 bonus points!");
        score += 4000;
    }
    else if(goldenStars >= 20){
        System.out.println("You got 2000 bonus points!");
        score += 2000;
    }
    else if(goldenStars >= 10){
        System.out.println("You got 1000 bonus points!");
        score += 1000;
    }
    return score;
}
System.out.println(bonusPoints(25));
System.out.println(bonusPoints(4));`;
  const ELSE_NO_IF = `int x = 5;
if(x > 0)
    System.out.print("positive");
else
    System.out.print("not positive");
else if(x == 0)
    System.out.print("zero");`;
  const NOTES22 = ['if', 'if', 'else if', 'else if', 'else', 'if', 'else if', 'if', 'if', 'else', 'if', 'else if', 'if', 'else if', 'else', 'if', 'if', 'else if', 'if', 'else if', 'else', 'if'];
  lesson(6, 'cs2-else-if', {
    concepts: ['else-if-chain', 'chain-structure', 'chain-guarantee', 'count-chains', 'threshold-order'],
    checks: [
      { src: WEATHER_BAD, expect: 'moderate' }, { src: WEATHER, expect: 'cold' }, { src: GRADE_UP, expect: 'B' }, { src: GRADE_BAD, expect: 'D' },
      { src: GRADE, expect: 'B' }, { src: BONUS, expect: 'You got 2000 bonus points!\n2000\n0\n' }, { src: ELSE_NO_IF, expect: 'Compile error' },
      { src: 'int temp = 40; String weather; if(temp <= 31) weather = "cold"; else if(temp <= 50) weather = "cool"; System.out.print(weather);', expect: 'Compile error' },
    ],
    html: `
<p class="lead">Real decisions often have more than two outcomes: cold, cool, moderate, warm; A, B, C, D, F. An <b>else-if chain</b> picks <i>at most one</i> outcome out of many. Understanding exactly when each link is checked is the whole lesson.</p>

<h2>Each else-if is asked only if everything above it was false</h2>
${tag('else-if-chain')}
<p>An if is an independent question: it's always asked when reached. An else-if or else is <b>not</b> independent. It's only checked when the if at the top of the chain and every else-if above it were all false. The moment one link is true, its code runs and the rest of the chain is skipped.</p>
<p>The temperature-to-weather mapping (31 or less cold, 32–50 cool, 51–70 moderate, 71+ warm) shows why that matters. Two separate if-else pairs give the wrong answer for 20°:</p>
<div class="fig-row"><div data-cs="tracer" data-id="wbad"></div><div data-cs="tracer" data-id="wgood"></div></div>
<p>In the broken version, the second if-else is a brand-new question and overwrites "cold" with "moderate". In the chain, once ${c('temp <= 31')} is true, nothing else is checked, so weather is set exactly once. And ${c('else if(temp <= 50)')} doesn't need ${c('temp >= 32 &&')}: it can only be reached when temp is already above 31.</p>

<h2>Order matters: check thresholds from the top down</h2>
${tag('threshold-order')}
<p>Grading with 90/80/70/60 cutoffs, here are three versions for a grade of 85:</p>
<div class="fig-row"><div data-cs="tracer" data-id="gbad"></div><div data-cs="tracer" data-id="gup"></div></div>
<div data-cs="tracer" data-id="grade"></div>
<p>The else-if chain checking from low to high stops at the first true link, ${c('>= 60')}, and gives a D. Separate ifs from low to high work, because each later if gets to <i>upgrade</i> the grade. In that order you must <b>not</b> use else-if. The standard chain checks the highest threshold first.</p>

<h2>Guaranteed outcome, or maybe none</h2>
${tag('chain-guarantee')}
<p>A chain that <b>ends in else</b> always runs exactly one branch, because the else catches everything that fell through. A chain that ends in else-if (or a lone if) runs <b>at most one</b>, and possibly none. The platformer bonus below has no else on purpose: under 10 stars, nothing should happen.</p>
<div data-cs="tracer" data-id="bonus"></div>
<p>This matters for variables too. If a chain without a final else is the only thing that assigns a variable, Java says it "might not have been initialized" when you use it later, since possibly no branch ran.</p>

<h2>Grammar of a chain</h2>
${tag('chain-structure')}
<ul>
<li>A chain always <b>starts with if</b>. A new if always starts a new chain.</li>
<li>Any number of else-ifs may follow.</li>
<li>An <b>else ends the chain</b>. Nothing may attach after it until a new if starts.</li>
<li>An else-if or else with no open if above it is a compile error.</li>
</ul>
<div data-cs="tracer" data-id="noif"></div>

<h2>Counting outcomes</h2>
${tag('count-chains')}
<p>Suppose each conditional controls one print. How many prints are possible?</p>
${rule('max prints = number of ifs      min prints = number of chains that end in else', 'each if starts one chain · a chain gives at most one outcome · only chains ending in else guarantee one')}
<p>Build your own sequence below, or load the notes' 22-conditional example (answer: 11 chains, so at most 11 prints; 4 of them end in else, so at least 4).</p>
<div class="sim" data-sim="chains">
  <div class="chain-list" style="padding:12px 16px;display:flex;flex-wrap:wrap;gap:6px;min-height:52px"></div>
  <div class="sim-controls">
    <button class="btn small" data-a="if">+ if</button>
    <button class="btn small" data-a="else if">+ else if</button>
    <button class="btn small" data-a="else">+ else</button>
    <button class="btn small" data-a="undo">Undo</button>
    <button class="btn small" data-a="clear">Clear</button>
    <button class="btn small primary" data-a="notes">Load the notes' example</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Each colored group is one chain. A red block means a compile error (no open if for it to attach to).</div>
</div>

${call('analogy', 'Analogy: a sorting machine', 'An else-if chain is a coin sorter: each coin drops through the slots top to bottom and falls into the first one it fits. With a catch-all bin at the bottom (else), every coin lands somewhere. Without it, some coins can fall through.')}
${call('mistake', 'Common mistakes', `<ul><li>Using separate ifs that overwrite each other when you meant one decision.</li><li>Ordering an else-if chain from low threshold to high.</li><li>Adding redundant checks like ${c('else if(temp > 31 && temp <= 50)')}. They aren't wrong, but they hint you're not trusting the chain.</li><li>${c('else')} followed by another ${c('else if')}: compile error.</li></ul>`)}
${call('ap', 'On the AP exam', 'Expect "which values make this code fail?" questions (the boundary values: 31, 32, 50, 70…) and chain-counting questions. Test boundaries when you trace.')}
${check('A grade chain checks <code>&gt;= 60</code>, then <code>else if(&gt;= 70)</code>, <code>else if(&gt;= 80)</code>, <code>else if(&gt;= 90)</code>. Which grades come out right?', ['All of them', 'Only grades below 70', 'Only grades of 90 and above', 'None'], 1, 'Any grade of 60 or more stops at the first link and gets D. That is only right for 60–69, and grades below 60 skip the whole chain (also right, if the default was F).')}
${check('Conditionals in order: if, else if, if, if, else, else if. Is this legal, and what are the max and min prints?', ['Legal; max 3, min 1', 'Compile error: the last else if follows an else', 'Legal; max 6, min 0', 'Legal; max 3, min 0'], 1, 'The else closes the third chain, so the else if after it has no open if to attach to.')}
`,
    specs: {
      wbad: { src: WEATHER_BAD, title: 'Two if-else pairs (wrong)', editable: false },
      wgood: { src: WEATHER, title: 'One chain (right)', editable: false },
      gbad: { src: GRADE_BAD, title: 'Chain from 60 up (wrong)', editable: false },
      gup: { src: GRADE_UP, title: 'Separate ifs from 60 up (works)', editable: false },
      grade: { src: GRADE, title: 'Standard chain from 90 down', caption: 'Change numberGrade with Edit code and try the boundaries: 90, 89.9, 60, 59.' },
      bonus: { src: BONUS, title: 'Bonus points: no else on purpose' },
      noif: { src: ELSE_NO_IF, title: 'An else-if after an else', caption: "The else closed the chain, so the else-if has nothing to attach to." },
    },
    after(el) {
      const host = el.querySelector('[data-sim="chains"]');
      if (!host) return null;
      let seq = NOTES22.slice();
      const COLORS = ['var(--accent-soft)', 'var(--good-soft)', '#fef3c7', '#ede9fe', '#e0f2fe'];
      function analyze() {
        const chains = [];
        let open = false, ok = true;
        const marks = seq.map((s) => {
          if (s === 'if') { chains.push({ items: 1, endsElse: false }); open = true; return chains.length - 1; }
          if (!open) { ok = false; return -1; }
          const ch = chains[chains.length - 1];
          ch.items++;
          if (s === 'else') { ch.endsElse = true; open = false; }
          return chains.length - 1;
        });
        return { chains, marks, ok };
      }
      function render() {
        const a = analyze();
        host.querySelector('.chain-list').innerHTML = seq.length ? seq.map((s, i) => {
          const m = a.marks[i];
          const bg = m < 0 ? 'var(--bad-soft)' : COLORS[m % COLORS.length];
          return `<span class="mono" style="padding:3px 9px;border-radius:7px;font-size:13px;background:${bg};border:1px solid ${m < 0 ? 'var(--bad)' : 'var(--border)'}">${esc(s)}</span>`;
        }).join('') : '<span class="muted">Add conditionals with the buttons below.</span>';
        const ro = host.querySelector('.sim-readout');
        if (!a.ok) ro.innerHTML = '<span class="err">Compile error:</span> a red else-if/else has no open if above it.';
        else ro.innerHTML = `<span>Chains (= ifs): <b>${a.chains.length}</b></span><span>Maximum prints: <b>${a.chains.length}</b></span><span>Chains ending in else: <b>${a.chains.filter((x) => x.endsElse).length}</b></span><span>Minimum prints: <b>${a.chains.filter((x) => x.endsElse).length}</b></span>`;
      }
      host.querySelectorAll('[data-a]').forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.a;
          if (k === 'undo') seq.pop();
          else if (k === 'clear') seq = [];
          else if (k === 'notes') seq = NOTES22.slice();
          else if (seq.length < 40) seq.push(k);
          render();
        };
      });
      render();
      return null;
    },
  });

  // =====================================================================
  // 2.4 Nested conditionals
  // =====================================================================
  const STORM = `Scanner reader = new Scanner(System.in);
System.out.println("Power's out. 1 = go outside, 2 = stay inside");
int choice = reader.nextInt();
if(choice == 1){
    System.out.println("A fork in the road. 1 = left, 2 = right");
    choice = reader.nextInt();
    if(choice == 1)
        System.out.println("You find a secret lab.");
    else
        System.out.println("You find an abandoned warehouse.");
}
else{
    System.out.println("1 = laptop, 2 = phone, 3 = ham radio");
    choice = reader.nextInt();
    if(choice == 1 || choice == 2){
        System.out.println("No internet. 1 = keep using it, 2 = try the radio");
        choice = reader.nextInt();
        if(choice == 1)
            System.out.println("The battery dies. Zombies attack!");
        else
            choice = 3;
    }
    if(choice == 3)
        System.out.println("You hear a faint broadcast from strange cultists.");
}`;
  const DANGLE = `int x = 5;
int y = -2;
if(x > 0)
    if(y > 0)
        System.out.println("both positive");
else
    System.out.println("x is not positive");`;
  const DANGLE_FIX = `int x = 5;
int y = -2;
if(x > 0){
    if(y > 0)
        System.out.println("both positive");
}
else
    System.out.println("x is not positive");`;
  lesson(7, 'cs2-nested', {
    concepts: ['nested-if', 'dangling-else', 'reassign-fallthrough'],
    checks: [
      { src: STORM, input: [1, 2], expect: "Power's out. 1 = go outside, 2 = stay inside\nA fork in the road. 1 = left, 2 = right\nYou find an abandoned warehouse.\n" },
      { src: STORM, input: [2, 1, 2], expect: "Power's out. 1 = go outside, 2 = stay inside\n1 = laptop, 2 = phone, 3 = ham radio\nNo internet. 1 = keep using it, 2 = try the radio\nYou hear a faint broadcast from strange cultists.\n" },
      { src: DANGLE, expect: 'x is not positive\n' }, { src: DANGLE_FIX, expect: '' },
    ],
    html: `
<p class="lead">An if can go inside another if. The inner question is only asked when the outer answer was yes, which is exactly how a choose-your-own-adventure story branches.</p>

<h2>Questions inside questions</h2>
${tag('nested-if')}
<p>In a nested conditional, the inner if belongs to one branch of the outer one. It's only reached when that branch runs. Play the "stormy night" story: pick the inputs, then step through and watch which blocks are entered and which are skipped entirely.</p>
<div data-cs="tracer" data-id="stormA"></div>
<div data-cs="tracer" data-id="stormB"></div>

<h2>Reassigning to reach a later if</h2>
${tag('reassign-fallthrough')}
<p>In the second run you stayed inside, used the laptop, then chose the radio. That branch doesn't print anything itself. It just does ${c('choice = 3;')}. A few lines later, the separate ${c('if(choice == 3)')} is a new question, and it's now true. One branch "reroutes" you into code meant for another choice, so the radio story is written only once.</p>

<h2>The dangling else</h2>
${tag('dangling-else')}
<p>Nested ifs without braces hide a trap. When an else could belong to more than one if, Java attaches it to the <b>nearest</b> unmatched if above it. Indentation means nothing to Java.</p>
<div class="fig-row"><div data-cs="tracer" data-id="dangle"></div><div data-cs="tracer" data-id="dangleFix"></div></div>
<p>The indentation suggests the else goes with ${c('if(x > 0)')}. It actually belongs to ${c('if(y > 0)')}. So with x = 5 and y = −2 it prints "x is not positive", which is false! Braces around the inner if close it off, and then the else really does pair with the outer if.</p>

${call('analogy', 'Analogy: a phone menu', '"Press 1 for billing." Only after pressing 1 do you hear "Press 1 for a payment, 2 for a refund." The inner menu exists only on that branch, and the same key (1) means different things at different depths, just like <code>choice</code> being reused.')}
${call('mistake', 'Common mistakes', `<ul><li>Trusting indentation to pair an else. Use braces on nested ifs.</li><li>Forgetting that an inner if is skipped entirely when the outer condition is false.</li></ul>`)}
${call('ap', 'On the AP exam', 'Dangling-else and nested-if tracing questions show up in multiple choice, often with misleading indentation. Pair each else with the closest if that has no else yet and isn\'t closed off by braces.')}
${check('<code>int a = 0; if(a &gt; 0) if(a &lt; 10) System.out.print("small"); else System.out.print("other");</code> prints…', ['small', 'other', 'nothing', 'Compile error'], 2, 'The else pairs with the inner if(a < 10). The outer if(a > 0) is false, so the whole inner if/else is skipped and nothing prints.')}
${check('In the stormy night code, which inputs print the cultist broadcast?', ['1, 1', '2, 3', '1, 2', '2, 1, 1'], 1, 'Choosing 2 then 3 goes straight to if(choice == 3). (2, 1, 2 also gets there, through choice = 3.)')}
`,
    specs: {
      stormA: { src: STORM, input: [1, 2], title: 'Run 1: inputs 1, 2 (outside, then right)', caption: 'The whole else block (lines 12–23) is skipped because choice was 1.' },
      stormB: { src: STORM, input: [2, 1, 2], title: 'Run 2: inputs 2, 1, 2 (inside, laptop, radio)', caption: 'Line 21 sets choice = 3, so the separate if on line 23 becomes true.' },
      dangle: { src: DANGLE, title: 'Misleading indentation', editable: false },
      dangleFix: { src: DANGLE_FIX, title: 'Braces fix the pairing', editable: false, caption: 'Now nothing prints: x > 0 is true and y > 0 is false.' },
    },
  });

  // =====================================================================
  // 2.5 Truth tables
  // =====================================================================
  const BIG = '!(a + b > c || a < b) && b - a == c || (a + b) % 2 == 0 && c > 0';
  lesson(8, 'cs2-truth-tables', {
    concepts: ['and-table', 'or-table', 'xor-neq', 'iff-eq', 'nand-nor', 'and-before-or', 'truth-table-rows', 'bool-precedence-full'],
    checks: [
      { src: 'boolean a = true, b = true, c = false; System.out.println(a || b && c); System.out.print((a || b) && c);', expect: 'true\nfalse' },
      { src: `int a = 5, b = 7, c = 1; System.out.print(${BIG});`, expect: 'true' },
    ],
    html: `
<p class="lead">Conditions get combined: "keys <b>or</b> the code", "reached the throne <b>and</b> has the sword". A <b>truth table</b> lists every possible combination of true and false and what the combined expression gives for each, so you can see the whole behavior at once.</p>

<h2>AND and OR</h2>
${tag('and-table', 'or-table')}
<div class="fig-row"><div data-cs="truth" data-id="and"></div><div data-cs="truth" data-id="or"></div></div>
<p>${c('A && B')} is true only when <b>both</b> are true. ${c('A || B')} is true when <b>at least one</b> is true, both included. That's the <b>inclusive</b> or. A door that opens with keys <i>or</i> a numeric code still opens if you have both.</p>

<h2>Exclusive or is != , "if and only if" is ==</h2>
${tag('xor-neq', 'iff-eq')}
<p>English "or" sometimes means <b>exactly one</b>: "play the red pieces or the blue pieces". You can't take both. For booleans, Java writes that exclusive or as ${c('A != B')}: true exactly when the two differ. And ${c('A == B')} is true when both have the same value. That's "if and only if" (iff): an integer is even if and only if it's divisible by 2, so ${c('isEven == (n % 2 == 0)')} is always true.</p>
<div class="fig-row"><div data-cs="truth" data-id="xor"></div><div data-cs="truth" data-id="iff"></div></div>

<h2>NOT AND, NOT OR</h2>
${tag('nand-nor')}
<p>Put ${c('!')} in front of a whole AND or OR. "You can't text and drive" is ${c('!(text && drive)')}: false only when both are true. "Don't play on the freeway nor eat glass" is ${c('!(freeway || glass)')}: true only when both are false.</p>
<div class="fig-row"><div data-cs="truth" data-id="nand"></div><div data-cs="truth" data-id="nor"></div></div>

<h2>Bigger tables: 2<sup>n</sup> rows</h2>
${tag('truth-table-rows', 'and-before-or')}
<p>Each variable doubles the number of combinations: 1 variable has 2 rows, 2 have 4, 3 have 8. With three variables, precedence starts to matter. <b>&amp;&amp; happens before ||</b> (like × before +), and ${c('!')} binds tighter than both. So ${c('A || !B && C')} means ${c('A || ((!B) && C)')}. Edit the expressions below and watch the table change:</p>
<div data-cs="truth" data-id="three"></div>
<div data-cs="truth" data-id="eqand"></div>
<p>${c('A == B && C')} does the ${c('==')} first, then the ${c('&&')}. ${c('A == (B && C)')} is a different table.</p>
<div data-cs="stepper" data-id="aob"></div>

<h2>The full precedence table</h2>
${tag('bool-precedence-full')}
<table class="truth"><tr><th>Order</th><th>Operators</th></tr>
<tr><td>1</td><td class="mono">( )</td></tr>
<tr><td>2</td><td class="mono">!  ++  --  (int) (double)</td></tr>
<tr><td>3</td><td class="mono">*  /  %</td></tr>
<tr><td>4</td><td class="mono">+  -</td></tr>
<tr><td>5</td><td class="mono">&lt;  &gt;  &lt;=  &gt;=</td></tr>
<tr><td>6</td><td class="mono">==  !=</td></tr>
<tr><td>7</td><td class="mono">&amp;&amp;</td></tr>
<tr><td>8</td><td class="mono">||</td></tr>
<tr><td>9</td><td class="mono">=  +=  -=  *=  /=  %=</td></tr></table>
<p>Here is the notes' monster expression with a = 5, b = 7, c = 1. Step through it to watch every rule in action:</p>
<div data-cs="stepper" data-id="big"></div>

${call('analogy', 'Analogy: a light with two switches', 'Two switches wired in series (both must be on) is AND. Wired in parallel (either one works) is OR. A hallway light you can flip from either end is exclusive or: change exactly one switch and the light changes.')}
${call('mistake', 'Common mistakes', `<ul><li>Reading ${c('a || b && c')} left to right. && goes first.</li><li>Thinking "or" excludes both. In Java, || includes both being true.</li><li>Writing ${c('A ^ B')} for exclusive or on the exam. Use ${c('A != B')}.</li></ul>`)}
${call('ap', 'On the AP exam', 'Expect "which expression has this truth table" and "for which values is this true?" Build the table: 2 variables give 4 rows, 3 give 8. List rows in a fixed order (TTT, TTF, TFT, …) so you don\'t miss one.')}
${check('How many rows does a truth table for an expression in A, B, C, D have?', ['4', '8', '16', '32'], 2, '2⁴ = 16.')}
${check('With <code>a = false, b = true, c = true</code>, what is <code>a &amp;&amp; b || c</code>?', ['true', 'false', 'Compile error', 'It depends on evaluation order'], 0, '&& first: false && true = false. Then false || true = true.')}
`,
    specs: {
      and: { exprs: ['A && B'], editable: false },
      or: { exprs: ['A || B'], editable: false },
      xor: { exprs: ['A != B'], editable: false, caption: 'Exclusive or: red pieces or blue, exactly one.' },
      iff: { exprs: ['A == B'], editable: false, caption: 'If and only if: same value.' },
      nand: { exprs: ['!(A && B)'], editable: false },
      nor: { exprs: ['!(A || B)'], editable: false },
      three: { exprs: ['!A && B || C', '!A && (B || C)', 'A || !B && C'], vars: ['A', 'B', 'C'], caption: 'Three variables give 8 rows. The parentheses in the second column change four of them.' },
      eqand: { exprs: ['A == B && C', 'A == (B && C)'], vars: ['A', 'B', 'C'] },
      aob: { expr: 'a || b && c', vars: { a: ['boolean', true], b: ['boolean', true], c: ['boolean', false] }, caption: 'b && c is false first, then true || false is true. Try (a || b) && c: false.' },
      big: { expr: BIG, vars: { a: ['int', 5], b: ['int', 7], c: ['int', 1] }, caption: 'Inside the parentheses, the || short-circuits. In the second half, % and == go before &&.' },
    },
  });

  // =====================================================================
  // 2.6 De Morgan and equivalences
  // =====================================================================
  const MOD3 = `for(int num = 0; num <= 8; num++){
    boolean original = !(num % 3 == 0 || num > 5);
    boolean rewritten = num % 3 != 0 && num <= 5;
    System.out.println(num + ": " + original + " " + rewritten);
}`;
  lesson(9, 'cs2-demorgan', {
    concepts: ['demorgan-or', 'demorgan-and', 'negate-relational', 'negate-large', 'complement-laws', 'distributive', 'eq-chain-bool'],
    checks: [
      { src: MOD3, expect: '0: false false\n1: true true\n2: true true\n3: false false\n4: true true\n5: true true\n6: false false\n7: false false\n8: false false\n' },
      { src: 'int x = 4, y = 6; System.out.println(!((x + y > 2 || x < 10) && (x % 2 == 0 && y % 3 == 0))); System.out.print((x + y <= 2 && x >= 10) || (x % 2 != 0 || y % 3 != 0));', expect: 'false\nfalse' },
    ],
    html: `
<p class="lead">Two expressions are <b>equivalent</b> when they give the same value in every row of the truth table. Knowing a few equivalences lets you rewrite a confusing condition into a clear one, and spot the one answer choice that matches on the exam.</p>

<h2>De Morgan's laws</h2>
${tag('demorgan-or', 'demorgan-and')}
${rule('!(A || B)  ≡  !A && !B          !(A && B)  ≡  !A || !B', 'push the ! inside each part, and swap || with && (or && with ||)')}
<p>"Don't play on the freeway <i>nor</i> eat glass" means "don't play on the freeway <i>and</i> don't eat glass". "You can't text and drive" means "either you aren't texting, <i>or</i> you aren't driving". Check that the columns match:</p>
<div class="fig-row"><div data-cs="truth" data-id="dm1"></div><div data-cs="truth" data-id="dm2"></div></div>

<h2>Negating a comparison</h2>
${tag('negate-relational')}
<p>Inside De Morgan, each part gets negated. For comparisons that means flipping the operator, and the boundary is where people slip: the opposite of ${c('>')} is ${c('<=')}, not ${c('<')}.</p>
<table class="truth"><tr><th>Expression</th><th>Its negation</th></tr>
<tr><td class="mono">x &gt; 5</td><td class="mono">x &lt;= 5</td></tr><tr><td class="mono">x &gt;= 5</td><td class="mono">x &lt; 5</td></tr>
<tr><td class="mono">a == b</td><td class="mono">a != b</td></tr><tr><td class="mono">num % 3 == 0</td><td class="mono">num % 3 != 0</td></tr></table>
<p>So ${c('!(num % 3 == 0 || num > 5)')} becomes ${c('num % 3 != 0 && num <= 5')}. The loop below checks both for num = 0 to 8:</p>
<div data-cs="tracer" data-id="mod3"></div>
<p>Likewise, ${c('if(index >= 0 && index <= str.length()) inBounds = true; else inBounds = false;')} can be flipped to ${c('if(index < 0 || index > str.length()) inBounds = false; else inBounds = true;')}.</p>

<h2>Always false, always true</h2>
${tag('complement-laws')}
<div data-cs="truth" data-id="comp"></div>

<h2>Distributive laws</h2>
${tag('distributive')}
${rule('A && (B || C)  ≡  (A && B) || (A && C)        A || (B && C)  ≡  (A || B) && (A || C)', 'like a(b + c) = ab + ac, but in logic it works both ways')}
<p><b>Frost giant Jarl:</b> to win you must reach the throne (A) <i>and</i> have the magic sword (B) or fire arrows (C). That's either "throne with sword" or "throne with arrows". <b>Locked door:</b> it opens with the key (A), <i>or</i> with lockpicks (B) and enough skill (C). That's the same as "key or lockpicks, <i>and</i> key or skill", which is true but more confusing to say.</p>
<div class="fig-row"><div data-cs="truth" data-id="dist1"></div><div data-cs="truth" data-id="dist2"></div></div>

<h2>Negating a large expression</h2>
${tag('negate-large')}
<p>What is the negation of ${c('A || !B && C')}? Flipping every part and swapping the operators gives ${c('!A && B || !C')}, but compare the tables: they are <i>not</i> opposites.</p>
<div data-cs="truth" data-id="neg1"></div>
<p>The problem is order of operations. In the original, the ${c('&&')} ran first. After swapping, that part became an ${c('||')}, which would now run last. To negate correctly, you must <b>keep the original grouping</b> by adding parentheses:</p>
${rule('1. negate every part   2. swap && and ||   3. keep the original order (add parentheses)', '!(A || !B && C) is !A && (B || !C)')}
<div data-cs="truth" data-id="neg2"></div>
<p>More practice: the negation of ${c('A && B || C')} is ${c('(!A || !B) && !C')}. The negation of ${c('A && (B || C)')} is ${c('!A || !B && !C')}, and no parentheses are needed there because the && part already runs first.</p>

<h2>A == B == C is not "all the same"</h2>
${tag('eq-chain-bool')}
<p>Java does not chain comparisons like Python. ${c('A == B == C')} is ${c('(A == B) == C')}: compare A and B, then compare that boolean with C. Its table matches ${c('A != B != C')} (a double negation). To ask "are all three the same?", write ${c('A == B && B == C')}. A == C then follows automatically.</p>
<div data-cs="truth" data-id="eqchain"></div>

${call('analogy', 'Analogy: turning a sentence inside out', 'Negating "I\'ll go if it\'s sunny and warm" gives "I won\'t go if it\'s not sunny or not warm." One bad condition is enough to cancel. That flip from "and" to "or" is De Morgan.')}
${call('mistake', 'Common mistakes', `<ul><li>${c('!(A && B)')} as ${c('!A && !B')}. The operator must swap.</li><li>Negating ${c('x > 5')} as ${c('x < 5')}. It's ${c('x <= 5')}.</li><li>Dropping parentheses when negating a mixed && / || expression.</li><li>Using ${c('a == b == c')} to test that three ints are equal. It doesn't even compile for ints.</li></ul>`)}
${call('ap', 'On the AP exam', 'A classic: "Which expression is equivalent to !( … )?" with five similar choices. Apply De Morgan in steps, or plug in one set of values and eliminate choices.')}
${check('Let x, y be ints. Which is equivalent to <code>!((x + y &gt; 2 || x &lt; 10) &amp;&amp; (x % 2 == 0 &amp;&amp; y % 3 == 0))</code>?', [
  '<code>(x + y &lt;= 2 &amp;&amp; x &gt;= 10) || (x % 2 != 0 || y % 3 != 0)</code>',
  '<code>(x + y &lt;= 2 &amp;&amp; x &gt;= 10) &amp;&amp; (x % 2 != 0 || y % 3 != 0)</code>',
  '<code>(x + y &lt;= 2 || x &gt;= 10) || (x % 2 != 0 &amp;&amp; y % 3 != 0)</code>',
  '<code>(x + y &lt;= 2 &amp;&amp; x &gt;= 10) || (x % 2 != 0 &amp;&amp; y % 3 != 0)</code>',
  '<code>(x + y &lt;= 2 || x &gt;= 10) || (x % 2 != 0 || y % 3 != 0)</code>',
], 0, 'Work outside in. The outer && becomes ||. The first group (P || Q) becomes !P && !Q: x + y <= 2 && x >= 10. The second group (R && S) becomes !R || !S: x % 2 != 0 || y % 3 != 0. Joined by ||, that is choice A. (B keeps && in the middle; at x = 4, y = 5 the original is true but B is false.)')}
${check('Which is the negation of <code>A || B &amp;&amp; C</code>?', ['<code>!A &amp;&amp; !B || !C</code>', '<code>!A &amp;&amp; (!B || !C)</code>', '<code>!A || !B &amp;&amp; !C</code>', '<code>(!A &amp;&amp; !B) || !C</code>'], 1, 'B && C ran first in the original, so after swapping, its replacement (!B || !C) needs parentheses to still run first.')}
`,
    specs: {
      dm1: { exprs: ['!(A || B)', '!A && !B'], editable: false, caption: 'Freeway nor glass.' },
      dm2: { exprs: ['!(A && B)', '!A || !B'], editable: false, caption: 'Texting and driving.' },
      mod3: { src: MOD3, title: '!(num % 3 == 0 || num > 5) vs num % 3 != 0 && num <= 5' },
      comp: { exprs: ['A && !A', 'A || !A'], vars: ['A'], editable: false },
      dist1: { exprs: ['A && (B || C)', '(A && B) || (A && C)'], vars: ['A', 'B', 'C'], editable: false, caption: 'The Jarl.' },
      dist2: { exprs: ['A || (B && C)', '(A || B) && (A || C)'], vars: ['A', 'B', 'C'], editable: false, caption: 'The locked door.' },
      neg1: { exprs: ['A || !B && C', '!A && B || !C'], vars: ['A', 'B', 'C'], caption: 'Not opposites: rows 2 and 4 agree.' },
      neg2: { exprs: ['A || !B && C', '!A && (B || !C)'], vars: ['A', 'B', 'C'], caption: 'With the parentheses: exact opposites.' },
      eqchain: { exprs: ['A == B == C', 'A != B != C', 'A == B && B == C'], vars: ['A', 'B', 'C'], caption: 'Only the last column means "all three the same".' },
    },
  });

  // =====================================================================
  // 2.5 Necessary and sufficient
  // =====================================================================
  const NS_SCEN = [
    { a: 'It is Monday–Friday', b: 'Regular school hours', rel: 'necessary', ex: ['Tuesday, a normal school day', 'Monday, but a holiday', '(impossible: no regular hours on weekends)', 'Saturday'] },
    { a: 'Integer ≥ 3 is prime', b: 'It is odd', rel: 'sufficient', ex: ['3, 5, 7, 11', '(impossible: the only even prime is 2)', '9, 15, 21', '4, 6, 8'] },
    { a: 'f is differentiable on an interval', b: 'f is continuous there', rel: 'sufficient', ex: ['sin x', '(impossible)', '|x| near 0', '1/x near 0'] },
    { a: 'I\'m playing Minecraft', b: 'My son is playing Minecraft', rel: 'both', ex: ['playing together', '(against the rule: I never play alone)', '(against the rule: he never plays alone)', 'out biking instead'] },
  ];
  lesson(10, 'cs2-necessary', {
    concepts: ['necessary', 'sufficient', 'nec-and-suf'],
    html: `
<p class="lead">"You need a ticket to get in." "Being prime means it's odd." These are two different kinds of logical link: <b>necessary</b> and <b>sufficient</b>. Each one rules out exactly one row of the truth table.</p>

<h2>Necessary: no A, no B</h2>
${tag('necessary')}
<p><b>A is necessary for B</b> means B can't happen without A. If A is false, B must be false. But having A doesn't guarantee B. Regular school hours require a weekday, yet a Monday holiday is a weekday with no school.</p>
${rule('impossible row: A false, B true', 'in Java, "A is necessary for B" is the expression !B || A')}

<h2>Sufficient: A guarantees B</h2>
${tag('sufficient')}
<p><b>A is sufficient for B</b> means A alone is enough. If A is true, B must be true. But B can happen other ways. For integers 3 and up, being prime guarantees being odd, but 9 is odd and not prime. Being differentiable guarantees continuity, but |x| is continuous and not differentiable at 0.</p>
${rule('impossible row: A true, B false', 'in Java, "A is sufficient for B" is !A || B')}

<h2>Necessary and sufficient: A == B</h2>
${tag('nec-and-suf')}
<p>When A is both, two rows are ruled out, and A and B always share a value: ${c('A == B')}. "My son and I only play Minecraft together, never alone."</p>
<div data-cs="truth" data-id="nsTable"></div>

<h2>Classify it yourself</h2>
<p>Pick a scenario, then click the cells to mark each combination possible or impossible. The readout names the relationship your marks describe.</p>
<div class="sim" data-sim="ns">
  <div class="ns-grid" style="padding:14px 16px"></div>
  <div class="sim-controls">
    <label>Scenario <select data-k="scen">${NS_SCEN.map((s, i) => `<option value="${i}">${esc(s.a)} → ${esc(s.b)}</option>`).join('')}</select></label>
    <button class="btn small" data-k="reveal">Show the answer</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Necessary rules out (A false, B true). Sufficient rules out (A true, B false). Both rule out both.</div>
</div>

${call('analogy', 'Analogy: tickets and VIP passes', 'A ticket is necessary to get into the concert: no ticket, no entry, but a ticket doesn\'t guarantee you a seat if you show up late. A backstage pass is sufficient to get backstage, but a crew badge works too.')}
${call('mistake', 'Common mistake: flipping the direction', '"Prime is sufficient for odd" does NOT mean "odd is sufficient for prime." If A is sufficient for B, then B is necessary for A, and not the other way around.')}
${call('ap', 'On the AP exam', 'This shows up as conditions in program specifications: "the method returns true only if…" (necessary) vs "…returns true if…" (sufficient). Read "only if" carefully.')}
${check('"A passing score is necessary to earn the certificate." Which combination is impossible?', ['Passing score, certificate', 'Passing score, no certificate', 'No passing score, certificate', 'No passing score, no certificate'], 2, 'Necessary means no A, no B. A certificate without a passing score breaks the rule.')}
${check('If A is sufficient for B, what does B being false tell you?', ['A is true', 'A is false', 'Nothing about A', 'B must be true'], 1, 'If A were true, B would have to be true. B is false, so A must be false (the contrapositive).')}
`,
    specs: {
      nsTable: { exprs: ['!B || A', '!A || B', 'A == B'], vars: ['A', 'B'], editable: false, caption: 'Columns: A necessary for B · A sufficient for B · both.' },
    },
    after(el) {
      const host = el.querySelector('[data-sim="ns"]');
      if (!host) return null;
      const ROWS = [[true, true], [true, false], [false, true], [false, false]];
      let scen = 0, marks = [true, true, true, true], shown = false;
      function relOf(m) {
        const tf = !m[1], ft = !m[2];
        if (tf && ft) return 'both';
        if (ft) return 'necessary';
        if (tf) return 'sufficient';
        return 'neither';
      }
      const NAME = { necessary: 'A is <b>necessary</b> for B', sufficient: 'A is <b>sufficient</b> for B', both: 'A is <b>necessary and sufficient</b> for B (A == B)', neither: 'Neither: all four combinations can happen' };
      function render() {
        const s = NS_SCEN[scen];
        const truth = ROWS.map(([a, b]) => !((s.rel === 'necessary' || s.rel === 'both') && !a && b) && !((s.rel === 'sufficient' || s.rel === 'both') && a && !b));
        host.querySelector('.ns-grid').innerHTML = `<table class="truth" style="margin:0 auto"><tr><th>A: ${esc(s.a)}</th><th>B: ${esc(s.b)}</th><th>Possible?</th>${shown ? '<th>Example</th>' : ''}</tr>${ROWS.map(([a, b], i) =>
          `<tr><td class="${a ? 't' : 'f'}">${a}</td><td class="${b ? 't' : 'f'}">${b}</td><td><button class="btn small" data-i="${i}" style="min-width:90px">${marks[i] ? 'possible' : 'impossible'}</button></td>${shown ? `<td style="text-align:left">${esc(s.ex[i])}${marks[i] !== truth[i] ? ' <span class="err">✗</span>' : ''}</td>` : ''}</tr>`).join('')}</table>`;
        host.querySelector('.sim-readout').innerHTML = `<span>Your marks say: ${NAME[relOf(marks)]}</span>${shown ? `<span>Answer: ${NAME[s.rel]}</span>` : ''}`;
        host.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { marks[Number(b.dataset.i)] = !marks[Number(b.dataset.i)]; render(); }; });
      }
      host.querySelector('[data-k="scen"]').onchange = (e) => { scen = Number(e.target.value); marks = [true, true, true, true]; shown = false; render(); };
      host.querySelector('[data-k="reveal"]').onclick = () => { shown = true; render(); };
      render();
      return null;
    },
  });

  // =====================================================================
  // 2.6 null, NullPointerException, short-circuiting
  // =====================================================================
  const LINE = `public class Line {
    private int x1, y1, x2, y2;
    public Line(int a, int b, int c, int d){
        x1 = a; y1 = b; x2 = c; y2 = d;
    }
    public double length(){
        return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
    }
    public void doSomething(){
        System.out.println("doSomething ran");
    }
}
Line l2 = new Line(2, 4, 3, 8);
Line l3 = null;
int threshold = 4;
System.out.println(l2.length());
if(l3 != null && l3.length() >= threshold)
    l3.doSomething();
else
    System.out.println("doSomething was not called");
System.out.println(l3.length());`;
  const CHECKCHAR = `public static boolean checkChar(String str, String c, int index){
    return index >= 0 && index < str.length() && str.substring(index, index + 1).equals(c);
}
System.out.println(checkChar("Memecraft", "e", 3));
System.out.println(checkChar("Memecraft", "e", 4));
System.out.println(checkChar("Memecraft", "e", -1));
System.out.println(checkChar("Memecraft", "e", 12));`;
  const CHECKCHAR_BAD = `public static boolean checkChar(String str, String c, int index){
    return str.substring(index, index + 1).equals(c) && index >= 0 && index < str.length();
}
System.out.println(checkChar("Memecraft", "e", 3));
System.out.println(checkChar("Memecraft", "e", 12));`;
  lesson(11, 'cs2-short-circuit', {
    concepts: ['null-ref', 'npe', 'short-and', 'short-or', 'guard-order', 'bounds-guard'],
    checks: [
      { src: LINE, expect: '4.123105625617661\ndoSomething was not called\n', expectError: 'NullPointerException' },
      { src: CHECKCHAR, expect: 'true\nfalse\nfalse\nfalse\n' },
      { src: CHECKCHAR_BAD, expectError: 'StringIndexOutOfBoundsException' },
      { src: 'int a = 7, b = 0; if(b != 0 && a / b > 2) System.out.print("hello"); else System.out.print("world");', expect: 'world' },
      { src: 'int a = 7, b = 0; if(a / b > 2 && b != 0) System.out.print("hello"); else System.out.print("world");', expectError: 'ArithmeticException' },
    ],
    html: `
<p class="lead">Some expressions crash when the wrong values reach them: dividing by zero, an index past the end of a String, calling a method on nothing. Java's <b>short-circuiting</b> lets one condition stand guard so the dangerous one never runs.</p>

<h2>null: a reference to nothing</h2>
${tag('null-ref', 'npe')}
<p>ints, doubles, and booleans are primitives. Everything else is an object, and an object variable holds a <i>reference</i> to an object. Declaring ${c('Line l3')} doesn't create a Line. Until you assign one, or if you assign ${c('null')}, the variable points at nothing. Calling a method through a null reference is a runtime error: <b>NullPointerException</b>. It compiles fine, because the compiler doesn't know the value will be null.</p>
<div data-cs="tracer" data-id="line"></div>

<h2>Short-circuiting: when Java skips the right side</h2>
${tag('short-and', 'short-or')}
<p>For ${c('false && X')}, the answer is false whatever X is. For ${c('true || X')}, it's true whatever X is. In those two cases Java doesn't evaluate X at all. That's <b>short-circuiting</b>.</p>
<table class="truth"><tr><th>Left side</th><th>Operator</th><th>Right side evaluated?</th><th>Result</th></tr>
<tr><td class="t">true</td><td class="mono">&amp;&amp;</td><td>yes</td><td>same as the right side</td></tr>
<tr><td class="f">false</td><td class="mono">&amp;&amp;</td><td><b>no, skipped</b></td><td>false</td></tr>
<tr><td class="t">true</td><td class="mono">||</td><td><b>no, skipped</b></td><td>true</td></tr>
<tr><td class="f">false</td><td class="mono">||</td><td>yes</td><td>same as the right side</td></tr></table>
<div class="fig-row"><div data-cs="stepper" data-id="sAnd"></div><div data-cs="stepper" data-id="sOr"></div></div>

<h2>Guard first, risky part second</h2>
${tag('guard-order')}
<p>That's <i>why</i> Java short-circuits: put the safety check on the left and the risky operation on the right. If the check fails, the risky part never runs. The order is everything:</p>
<div class="fig-row"><div data-cs="stepper" data-id="gGood"></div><div data-cs="stepper" data-id="gBad"></div></div>
<p>${c('a / b > 2 && b != 0')} divides first, so with b = 0 it crashes before the guard is even looked at.</p>
${rule('safe check  &&  risky operation', 'b != 0 && a / b > 2 · obj != null && obj.method() · index < str.length() && str.substring(index, index + 1)…')}

<h2>Guarding an index</h2>
${tag('bounds-guard')}
<p>${c('checkChar')} should return whether ${c('str')} has ${c('c')} at ${c('index')}, and false (not a crash) for indices out of range. Both bounds checks go before the substring call:</p>
<div data-cs="tracer" data-id="cc"></div>
<div data-cs="tracer" data-id="ccBad"></div>

${call('analogy', 'Analogy: checking the stove before touching it', 'You hold your hand near the burner first, and only touch it if it\'s cool. Reverse the order and the check comes too late. Short-circuiting is "don\'t touch it if the first check failed."')}
${call('mistake', 'Common mistakes', `<ul><li>Putting the guard second: ${c('obj.length() > 0 && obj != null')} still throws NullPointerException.</li><li>${c('index <= str.length()')} as the guard for ${c('substring(index, index + 1)')}: index = length is out of bounds there.</li><li>Thinking a crash in the right side happens even when it's skipped. A skipped expression never runs.</li></ul>`)}
${call('ap', 'On the AP exam', 'Questions like "for which values does this code throw an exception?" test both the guard order and short-circuiting. On free response, guarding indices and null references with && is the expected style.')}
${check('<code>String s = null;</code> Which line does NOT throw an exception?', ['<code>if(s.length() &gt; 0 &amp;&amp; s != null)</code>', '<code>if(s != null &amp;&amp; s.length() &gt; 0)</code>', '<code>System.out.print(s.length());</code>', '<code>if(s.equals("hi"))</code>'], 1, 's != null is false, so && skips s.length(). The others call a method on null.')}
${check('<code>int x = 0;</code> What does <code>if(x == 0 || 10 / x &gt; 1) System.out.print("A"); else System.out.print("B");</code> do?', ['Prints A', 'Prints B', 'ArithmeticException', 'Compile error'], 0, 'x == 0 is true, so || skips 10 / x and the whole condition is true.')}
`,
    specs: {
      line: { src: LINE, title: 'A null Line', caption: 'The guarded if on line 17 is safe. The last line calls length() on null and crashes.' },
      sAnd: { expr: 'b != 0 && a / b > 2', vars: { a: ['int', 7], b: ['int', 0] }, editable: false, caption: 'false && … : the division is never done.' },
      sOr: { expr: 'b == 0 || a / b > 2', vars: { a: ['int', 7], b: ['int', 0] }, editable: false, caption: 'true || … : skipped again.' },
      gGood: { expr: 'b != 0 && a / b > 2', vars: { a: ['int', 7], b: ['int', 0] }, editable: false, caption: 'Guard first: safe.' },
      gBad: { expr: 'a / b > 2 && b != 0', vars: { a: ['int', 7], b: ['int', 0] }, editable: false, caption: 'Guard second: crashes.' },
      cc: { src: CHECKCHAR, title: 'checkChar with guards', caption: 'For index −1 and 12, a guard is false, so substring is never called.' },
      ccBad: { src: CHECKCHAR_BAD, title: 'Guards in the wrong place', caption: 'substring runs first and throws for index 12.' },
    },
  });
})();
