// AP CSA Unit 1 (part B): Scanner, class structure, comments and conditions, method signatures,
// calling methods, the Math class, objects and aliases, String methods, concatenation, and
// modular arithmetic. Pushes lesson objects onto window.LESSONS (lessons 1.10–1.20).
(function () {
  'use strict';
  const LESSONS = window.LESSONS || (window.LESSONS = []);
  const K = window.CSKit;
  const { code, rule, c, call, check } = K;
  const J = String.raw; // Java source is written raw so \n means Java's \n
  const T = (id) => (window.CS_LESSONS.find((l) => l.id === id) || { title: id }).title;
  const esc = (s) => PR.esc(s);

  // Every snippet shown with its output goes through demo(): the output box is what JavaLite
  // actually prints, and the harness checks it against what the lesson text claims.
  const VERIFY = [];
  let cur = '';
  function demo(src, expect, opts = {}) {
    const r = JavaLite.run(src, { input: opts.input, random: opts.random });
    VERIFY.push({ lesson: cur, src, expect, opts });
    return code(src, { hl: opts.hl }) + K.outBox(r.output, K.errText(r.error));
  }
  // Tracer / stepper specs also carry `expect` so the harness can run them.
  function spec(o) { VERIFY.push({ lesson: cur, src: o.src, expect: o.expect, opts: o, kind: o.expr ? 'stepper' : 'tracer' }); return o; }
  // a fixed sequence for Math.random so traces are reproducible
  const seq = (...xs) => { let k = 0; return () => xs[k++ % xs.length]; };
  const both = (a, b) => () => { if (a) a(); if (b) b(); };

  function lesson(order, id, covers, render) {
    LESSONS.push({ unit: 1, order, id, title: T(id), covers, render(el) { cur = id; return render(el); }, _verify: VERIFY });
  }

  // =====================================================================
  // 1.10 The Scanner class
  // =====================================================================
  const TEMP = J`import java.util.Scanner;

public static double convertToFahrenheit(double celsiusTemperature){
  return 1.8*celsiusTemperature + 32;
}
public static boolean isAtLeastAbsoluteZeroInCelsius(double celsiusTemperature){
  return celsiusTemperature >= -273.15;
}

Scanner reader = new Scanner(System.in);
System.out.println("Enter a temperature in Celsius");
double celsiusTemperature = reader.nextDouble();
if(isAtLeastAbsoluteZeroInCelsius(celsiusTemperature)){
  double fahrenheitTemperature = convertToFahrenheit(celsiusTemperature);
  System.out.println("That is " + fahrenheitTemperature + " in Fahrenheit");
}
else
  System.out.println("That is below absolute zero");`;
  const POTATO_IN = 'true true false true false true false true true false true false'.split(' ');

  lesson(10, 'cs1-scanner', ['scanner-create', 'scanner-methods', 'scanner-file', 'scanner-hasnext', 'input-mismatch'], (el) => {
    el.innerHTML = `
<p class="lead">Every program so far had its values typed right into the code. To ask the person running the program for a number, or to read a whole file of data, Java gives us a library class called <b>Scanner</b>. It's your first taste of the Java library (the API): code someone else already wrote that you get to use.</p>

<h2>Step 1: import it, then make one</h2>
<p>Scanner lives in the package <code>java.util</code>, so the very first line of the file (above the class) has to bring it in. Then you create a Scanner object, just like any other object:</p>
${rule('import java.util.Scanner;\nScanner reader = new Scanner(System.in);', `${c('Scanner')} is the declared type of the variable; ${c('new Scanner(System.in)')} calls the Scanner constructor, and ${c('System.in')} means "read from the keyboard"; ${c('reader')} is the variable name (any name works) and now refers to that Scanner object.`)}
<p>Forget the import and the code doesn't compile: Java can't find a class called Scanner.</p>

<h2>Step 2: ask it for values</h2>
<p>The Scanner object has methods that each grab <b>one</b> value of a certain type:</p>
<ul>
<li>${c('reader.nextInt()')} returns the next int</li>
<li>${c('reader.nextDouble()')} returns the next double</li>
<li>${c('reader.nextBoolean()')} returns the next boolean</li>
<li>${c('reader.nextLine()')} returns the rest of the line as a String (spaces included)</li>
</ul>
<p>The program <b>pauses</b> at each of these until the user types something and hits enter. Here is the teacher's temperature converter. Pick what the user types and step through it:</p>
<div class="sim-controls" style="border:0;padding:0 0 4px"><label>User types <select data-k="tin"><option>20</option><option>-10</option><option>-320</option></select></label></div>
<div data-cs="tracer" data-id="temp"></div>

<h2>Each call moves past the value it read</h2>
<p>Think of the input as a row of values with a cursor in front of the first one. Every ${c('next...')} call returns the value at the cursor and moves the cursor forward, so the next call gets the <b>next</b> value, never the same one again. If the user types ${c('-40 -30 -20')}:</p>
${demo(J`Scanner reader = new Scanner(System.in);
System.out.println(reader.nextDouble());
System.out.println(reader.nextDouble());
System.out.println(reader.nextDouble());`, '-40.0\n-30.0\n-20.0', { input: ['-40', '-30', '-20'] })}
<p>Notice the ints came back as doubles (${c('-40.0')}) because we called ${c('nextDouble')}. And here's ${c('nextLine')} grabbing a name with a space in it:</p>
${demo(J`Scanner reader = new Scanner(System.in);
System.out.println("What's your name?");
String name = reader.nextLine();
System.out.println("Hello " + name + ", nice to meet you!");`, "What's your name?\nHello John Cena, nice to meet you!", { input: ['John Cena'] })}
${call('analogy', 'Analogy: a ticket dispenser', 'Each pull hands you the next ticket and that ticket is gone. You can never pull the same ticket twice, and if you ask for a ticket when the roll is empty, nothing comes out.')}

<h2>Reading from a file instead of the keyboard</h2>
<p>Swap ${c('System.in')} for a ${c('File')} and the same methods read values from a text file. Spaces separate values in the file. Three extra rules:</p>
${code(J`import java.util.Scanner;
import java.io.*;

public class Main {
  public static void main(String[] args) throws FileNotFoundException {
    Scanner reader = new Scanner(new File("CelsiusTemperatures.txt"));
    System.out.println(reader.nextDouble());   // -40.0
    System.out.println(reader.nextDouble());   // -30.0
  }
}`)}
<ul>
<li>Also ${c('import java.io.*;')} (that's where ${c('File')} lives).</li>
<li>The method that opens the file must say ${c('throws FileNotFoundException')}: Java insists you admit the file might not exist.</li>
<li>The file must be in the project, or you give its full path in the String.</li>
</ul>

<h2>Reading until the file runs out: hasNext</h2>
<p>${c('reader.hasNext()')} returns <b>true</b> if there is at least one more value to read and <b>false</b> once everything is used up. It does <i>not</i> move the cursor. So it's the perfect loop condition: "while there's more, read the next one." The teacher's potato inspector reads a file of booleans (here we feed the same 12 values as input):</p>
<div data-cs="tracer" data-id="potato"></div>
<p>The while loop is a Unit 2 tool; for now just read it as "repeat while the condition is true."</p>

<h2>Asking for the wrong type: InputMismatchException</h2>
<p>If the next value isn't the type you asked for (you call ${c('nextInt()')} and the user typed ${c('hello')} or ${c('3.5')}), Scanner can't convert it. That's a <b>runtime error</b>, an ${c('InputMismatchException')}. The code compiled fine; it crashes while running, after printing anything that came before:</p>
${demo(J`Scanner reader = new Scanner(System.in);
System.out.println("Enter an int");
int n = reader.nextInt();
System.out.println("You typed " + n);`, 'Enter an int\n then InputMismatchException', { input: ['hello'] })}

${call('mistake', 'Common mistakes', `<ul><li>Leaving out ${c('import java.util.Scanner;')}: compile error, "cannot find symbol: class Scanner".</li><li>Calling ${c('nextInt()')} twice when you meant to use one value twice. Each call reads a <b>new</b> value; store it in a variable once.</li><li>Expecting ${c('hasNext()')} to read. It only peeks.</li><li>Mismatched data (a word where an int should be) is a <b>runtime</b> error, not a compile error.</li></ul>`)}
${call('ap', 'On the AP exam', `Expect to trace code where the input values are given to you ("the user enters 4, then 7"). Track the cursor: each ${c('next...')} call takes the next value in order. Questions also love "what kind of error is this?": a missing import is compile time, a type mismatch in the input is run time.`)}
${check('The user types <code>5 8 2</code>. What does this print? <br><code>int a = reader.nextInt(); int b = reader.nextInt(); System.out.print(a + reader.nextInt());</code>', ['10', '13', '7', '15'], 2, 'a gets 5, b gets 8, and the third call reads the next value, 2. So it prints 5 + 2 = 7. b is never used in the print, but it still consumed the 8.')}
${check('A file contains <code>4 true 9</code>. The code calls <code>nextInt()</code>, then <code>nextInt()</code>. What happens?', ['It prints 4 and 9', 'Compile error', 'The second call skips true and returns 9', 'InputMismatchException on the second call'], 3, 'The first call returns 4. The second call finds <code>true</code>, which is not an int, so it throws InputMismatchException at run time. Scanner never skips values for you.')}
${check('What does <code>reader.hasNext()</code> do when values remain?', ['Returns true and moves to the next value', 'Returns true without reading anything', 'Returns the next value', 'Returns false'], 1, 'hasNext only reports whether another value exists. The cursor stays put until you call a next... method.')}
`;
    const specs = {
      temp: spec({ src: TEMP, input: ['20'], title: 'Temperature converter', expect: 'Enter a temperature in Celsius\nThat is 68.0 in Fahrenheit', caption: 'Change what the user types above, then step. With −320 the boolean method returns false and the else branch runs.' }),
      potato: spec({ src: J`Scanner reader = new Scanner(System.in);
int goodCount = 0;
int rottenCount = 0;
while(reader.hasNext()){
  boolean good = reader.nextBoolean();
  if(good)
    goodCount++;
  else
    rottenCount++;
}
System.out.println(goodCount + " good potatoes");
System.out.println(rottenCount + " rotten potatoes");`, input: POTATO_IN, title: 'Potatoes: true true false true false true false true true false true false', expect: '7 good potatoes\n5 rotten potatoes', caption: 'Watch hasNext() stay true for 12 passes, then turn false when the input runs out.' }),
    };
    spec({ src: TEMP, input: ['-10'], expect: 'Enter a temperature in Celsius\nThat is 14.0 in Fahrenheit' });
    spec({ src: TEMP, input: ['-320'], expect: 'Enter a temperature in Celsius\nThat is below absolute zero' });
    const off = K.mount(el, specs);
    const sel = el.querySelector && el.querySelector('[data-k="tin"]');
    if (sel) sel.onchange = () => {
      const host = el.querySelector('[data-id="temp"]');
      K.tracer(host, Object.assign({}, specs.temp, { input: [sel.value] }));
    };
    return off;
  });

  // =====================================================================
  // 1.11 Structure of a class
  // =====================================================================
  const CIRCLE = J`public class Circle {
  private double centerX;
  private double centerY;
  private double radius;

  public Circle(double cx, double cy, double r){
    centerX = cx;
    centerY = cy;
    radius = r;
  }
  public Circle(double r){
    centerX = 0;
    centerY = 0;
    radius = r;
  }
  public Circle(){
    centerX = 0;
    centerY = 0;
    radius = 1;
  }
  public void info(){
    System.out.println("Center: (" + centerX + ", " + centerY + ") Radius: " + radius);
  }
  public double area(){
    return Math.PI * radius * radius;
  }
  public double circumference(){
    return 2 * Math.PI * radius;
  }
  public void setRadius(double newRadius){
    radius = newRadius;
  }
}

Circle c = new Circle(3.0, 7.0, 2.0);
Circle u = new Circle();
Circle r = new Circle(5);
c.info();
u.info();
r.info();
System.out.println("Area: " + c.area());
System.out.println("Circumference: " + c.circumference());
u.setRadius(4);
u.info();`;

  lesson(11, 'cs1-class-structure', ['attributes', 'constructor', 'ctor-overload', 'methods-behaviors', 'double-tolerance'], (el) => {
    el.innerHTML = `
<p class="lead">A class is a design for a kind of object. Every class you'll write has the same three parts: what each object <b>knows</b> (attributes), how an object gets <b>made</b> (constructors), and what an object can <b>do</b> (methods). The teacher's Circle class shows all three.</p>

<h2>Attributes: what each object knows</h2>
<p>Attributes (also called <b>instance variables</b>) are declared at the top of the class, outside any method. Every Circle object gets its <i>own</i> copy:</p>
${code(J`private double centerX;
private double centerY;
private double radius;`)}
<p>They're marked ${c('private')} so only code inside the Circle class can touch them directly. Outside code has to go through methods. That keeps a Circle from ever getting a nonsense radius slipped in from somewhere else.</p>

<h2>Constructors: how an object is made</h2>
${rule('public Circle(double cx, double cy, double r){ ... }', `A constructor has <b>the same name as the class</b> and <b>no return type</b> (not even void). It runs once, when ${c('new')} creates the object, and its job is to give every attribute its starting value.`)}
<p>A class can have several constructors as long as their parameter lists differ. Circle has three:</p>
<ul>
<li>${c('Circle(double cx, double cy, double r)')}: any circle, center and radius given.</li>
<li>${c('Circle(double r)')}: a circle of radius r centered at the origin.</li>
<li>${c('Circle()')}: no information at all, so it makes the unit circle (center (0, 0), radius 1).</li>
</ul>
<p>${c('new Circle(5)')} calls the one-parameter version because there's exactly one argument. Having several constructors with the same name is called <b>overloading</b>. Java picks the one whose parameters match the arguments.</p>

<h2>Methods: what an object can do</h2>
<p>Methods are the behaviors. Some just report (${c('area()')} returns πr²), some change the object (${c('setRadius')} replaces the radius), some print (${c('info()')}). Inside a method, ${c('radius')} means <i>this</i> object's radius: the one that called the method. Step through it and watch the <b>this.</b> rows in the variable table switch as different circles call methods:</p>
<div data-cs="tracer" data-id="circle"></div>
${call('idea', 'Big idea: one design, many objects', `c, u and r are three separate Circle objects built from one class. ${c('u.setRadius(4)')} changes only u's radius. c and r are untouched. (Fun fact you can see in the output: for radius 2, the area 4π and the circumference 4π are the same number.)`)}

<h2>Checking a point: never compare computed doubles with ==</h2>
<p>The Circle class also has a method asking "is this point on the circle?" Mathematically that's: the distance from the center equals the radius. But distances come from ${c('Math.sqrt')}, and computed doubles are almost never <i>exactly</i> equal. The point (1.268, 8.0) is on the circle centered (3, 7) with radius 2, to three decimal places:</p>
${demo(J`double dist = Math.sqrt(Math.pow(1.268 - 3.0, 2) + Math.pow(8.0 - 7.0, 2));
System.out.println(dist);
System.out.println(dist == 2.0);
System.out.println(Math.abs(dist - 2.0) <= 0.001);`, '1.9999559995159892\nfalse\ntrue')}
${rule('Math.abs(a - b) <= 0.001', `"close enough": true when doubles a and b differ by at most the tolerance (0.001 here; 1E-10 when you need more precision).`)}

${call('analogy', 'Analogy: a cookie cutter', 'The class is the cutter; each object is a cookie. Every cookie has the same shape (the same attributes and methods) but its own frosting (its own attribute values). Biting one cookie doesn\'t change the others.')}
${call('mistake', 'Common mistakes', `<ul><li>Giving a constructor a return type: ${c('public void Circle()')} is just a method that happens to be named Circle, not a constructor.</li><li>Expecting two constructors with the same parameter types to coexist. They can't; the parameter lists must differ.</li><li>Using ${c('==')} on computed doubles. Use a tolerance.</li></ul>`)}
${call('ap', 'On the AP exam', `You'll read class definitions and answer: which constructor does ${c('new Circle(2.5)')} call? What does this method return? What are this object's attributes after these calls? Know that attributes are usually private, constructors set them, and methods read or change them.`)}
${check('How many attributes does each Circle object have?', ['1', '3', '6', 'It depends on which constructor was used'], 1, 'Three: centerX, centerY and radius. Every constructor sets all three (some just use default values like 0), so every Circle has the same three attributes.')}
${check('Which line is a valid constructor header for a class named <code>Lamp</code>?', ['<code>public void Lamp(boolean on)</code>', '<code>public Lamp lamp(boolean on)</code>', '<code>public Lamp(boolean on)</code>', '<code>public static Lamp(boolean on)</code>'], 2, 'A constructor has the class name and no return type. Adding void makes it an ordinary method named Lamp.')}
${check('Why does isPointOnCircle use <code>Math.abs(dist - radius) <= 0.001</code> instead of <code>dist == radius</code>?', ['== does not compile on doubles', 'Computed doubles carry tiny rounding errors, so exact equality almost never happens', 'Math.abs is faster', 'radius is private'], 1, '== does compile on doubles, but values from sqrt and pow are rounded slightly, so a point that is really on the circle can be off by 0.0000001. A tolerance accepts it.')}
`;
    return K.mount(el, { circle: spec({ src: CIRCLE, title: 'The Circle class', expect: 'Center: (3.0, 7.0) Radius: 2.0\nCenter: (0.0, 0.0) Radius: 1.0\nCenter: (0.0, 0.0) Radius: 5.0\nArea: 12.566370614359172\nCircumference: 12.566370614359172\nCenter: (0.0, 0.0) Radius: 4.0', caption: 'new Circle(5) passes an int to a double parameter, so radius becomes 5.0. setRadius(4) does the same.' }) });
  });

  // =====================================================================
  // 1.12 Comments, preconditions, postconditions
  // =====================================================================
  const SAMECHAR_GUARD = J`public static boolean sameChar(String str1, String str2, int index){
  if(index < 0 || index >= Math.min(str1.length(), str2.length()))
    return false;
  return str1.substring(index, index + 1).equals(str2.substring(index, index + 1));
}
System.out.println(sameChar("hello", "world", 1));
System.out.println(sameChar("hello", "world", 3));
System.out.println(sameChar("hello", "world", 9));`;

  lesson(12, 'cs1-comments', ['comments', 'precondition', 'precondition-substring', 'postcondition', 'guard-precondition'], (el) => {
    el.innerHTML = `
<p class="lead">Code is read far more often than it's written: by teammates, by graders, by you three weeks from now. Comments explain the <i>why</i>. Preconditions and postconditions are the most important comments of all: they say exactly when a method promises to work, and what it promises in return.</p>

<h2>Comments are ignored by the compiler</h2>
${rule('// one line        /* one or many lines */', `${c('//')} turns the rest of that line into a comment. ${c('/*')} starts a block comment and ${c('*/')} ends it, however many lines later. Neither is ever compiled or run.`)}
${demo(J`// System.out.println("You will never see this");
System.out.println("visible");
/* System.out.println("also hidden");
   System.out.println("still hidden"); */
System.out.println("done"); // a comment after code is fine`, 'visible\ndone')}

<h2>Preconditions: what must be true before</h2>
<p>A <b>precondition</b> is something that must be true just before a piece of code runs for it to behave as intended. If you break it, the method isn't "wrong"; you used it outside its promise. ${c('findSum')} is meant to add every integer from a to b:</p>
<div data-cs="tracer" data-id="sum"></div>
<p>${c('findSum(7, 5)')} returns 0 instead of 18, because ${c('i')} starts at 7 and ${c('7 <= 5')} is false right away. So the method's precondition is ${c('a <= b')}, written as a comment above it.</p>

<h2>Preconditions for substring: &lt; vs &lt;=</h2>
<p>${c('sameChar')} asks whether two Strings have the same character at an index: ${c('sameChar("hello", "world", 3)')} is true (both have "l"). It calls ${c('substring(index, index + 1)')} on both Strings, so index has to be a real character position in <b>both</b>:</p>
${rule('0 <= index < Math.min(str1.length(), str2.length())', 'the precondition for sameChar: index can be 0 up to, but not including, the shorter length.')}
<p>Now ${c('sameSubstring(str1, str2, a, b)')} compares ${c('substring(a, b)')} of each. Here b is an <i>end</i> index, which is exclusive, so b is allowed to equal the length:</p>
${rule('0 <= a <= b <= Math.min(str1.length(), str2.length())', 'the precondition for sameSubstring. b can equal the length because the second substring parameter is exclusive.')}
${demo(J`String s1 = "Mississippi";
String s2 = "Missouri";
System.out.println(s1.substring(3, 5).equals(s2.substring(3, 5)));
System.out.println(s1.substring(1, 4).equals(s2.substring(1, 4)));`, 'false\ntrue')}
<p>That's "si" vs "so" (different) and "iss" vs "iss" (same). Why &lt; in one and &lt;= in the other? In sameChar, index is the <i>first</i> substring parameter (inclusive), so it must be a real position; its partner ${c('index + 1')} then is at most the length automatically.</p>

<h2>Guarding: exit early when a precondition fails</h2>
<p>Instead of trusting callers, a method can check its own precondition and bail out with a safe answer before the risky line runs:</p>
<div data-cs="tracer" data-id="guard"></div>
<p>Without that if-statement, ${c('sameChar("hello", "world", 9)')} would crash with a StringIndexOutOfBoundsException:</p>
${demo(J`String str1 = "hello";
System.out.println(str1.substring(9, 10));`, 'StringIndexOutOfBoundsException')}

<h2>Postconditions: what is guaranteed after</h2>
<p>A <b>postcondition</b> is what must be true after the code runs. For this code (temperature is any double):</p>
${demo(J`double temperature = 120;
String phase = "liquid";
if(temperature < 0)
  phase = "solid";
if(temperature > 100)
  phase = "vapor";
System.out.println(phase);`, 'vapor')}
<p>the postcondition is: ${c('phase')} is exactly one of "liquid", "solid" or "vapor", matching the temperature. Whatever temperature goes in, that statement is true afterward.</p>

${call('analogy', 'Analogy: a warranty', 'A precondition is the fine print ("valid only if used indoors"). A postcondition is the promise ("then it will keep working for a year"). Break the fine print and the promise is off.')}
${call('mistake', 'Common mistakes', `<ul><li>Thinking a precondition is checked automatically. It's a comment; nothing enforces it unless you write a guard.</li><li>Using ${c('index <= str.length()')} for a single character. The last character is at ${c('length() - 1')}.</li><li>Putting the guard <i>after</i> the line that can crash. It must come first.</li></ul>`)}
${call('ap', 'On the AP exam', 'Free-response methods come with preconditions ("Precondition: n > 0"). You may assume them; you don\'t have to check them. Multiple choice asks things like "which precondition makes this method work as intended?" or "which call violates the precondition?"')}
${check('What is the precondition for <code>str.substring(k, k + 1)</code> not to crash?', ['<code>0 <= k <= str.length()</code>', '<code>0 <= k < str.length()</code>', '<code>0 < k < str.length()</code>', '<code>k <= str.length() - 2</code>'], 1, 'k must be a real character index: 0 through length − 1. Then k + 1 is at most length, which is allowed for the exclusive end.')}
${check('Which statement is a postcondition of a method that returns the larger of a and b?', ['a and b are ints', 'The value returned is >= a and >= b', 'a != b', 'The method is public'], 1, 'A postcondition describes what is true after: the result is at least as big as both inputs.')}
${check('Which of these does the compiler run?', ['<code>// x = 5;</code>', '<code>/* x = 5; */</code>', '<code>x = 5; // set x</code>', 'None of them'], 2, 'Only the code before the // in the third line runs. The comment part after // is ignored, as are both fully commented lines.')}
`;
    return K.mount(el, {
      sum: spec({ src: J`// Precondition: a <= b
public static int findSum(int a, int b){
  int sum = 0;
  for(int i = a; i <= b; i++)
    sum += i;
  return sum;
}
System.out.println(findSum(5, 7));
System.out.println(findSum(7, 5));`, title: 'findSum and its precondition', expect: '18\n0', caption: 'Step into findSum(7, 5): the loop condition is false on the very first check, so sum stays 0.' }),
      guard: spec({ src: SAMECHAR_GUARD, title: 'sameChar with a guard', expect: 'false\ntrue\nfalse', caption: 'For index 9 the guard condition is true, so the method returns false before substring is ever called.' }),
    });
  });

  // =====================================================================
  // 1.13 Method signatures
  // =====================================================================
  lesson(13, 'cs1-signatures', ['public-private', 'return-type', 'void-early-return', 'return-widen', 'overload-rules'], (el) => {
    el.innerHTML = `
<p class="lead">The first line of a method, its <b>header</b>, is a contract. In one line it says who may call the method, what it gives back, what it's called, and what it needs. Read headers carefully and half the questions about methods answer themselves.</p>

<h2>The parts of a header</h2>
${rule('public static double qf1(double a, double b, double c)', `${c('public')} / ${c('private')}: who can call it. ${c('static')}: belongs to the class, not to one object (main and helper methods in Main are static). ${c('double')}: the <b>return type</b>. ${c('qf1')}: the name. ${c('(double a, double b, double c)')}: the parameters, separated by commas; ${c('()')} if there are none.`)}

<h2>public vs private</h2>
<p>A ${c('public')} method can be called from any class. A ${c('private')} method can only be called from inside its own class; it's a helper for that class's other methods:</p>
${demo(J`public class Vault {
  private int code = 1234;
  private int secret(){ return code; }
  public int hint(){ return secret() % 100; }
}
Vault v = new Vault();
System.out.println(v.hint());`, '34')}
<p>${c('hint()')} is allowed to call ${c('secret()')} because they're in the same class. But from outside:</p>
${demo(J`public class Vault {
  private int code = 1234;
  private int secret(){ return code; }
}
Vault v = new Vault();
System.out.println(v.secret());`, 'Compile error')}

<h2>Return types: a promise on every path</h2>
<p>A method with a return type like ${c('int')} must return an int <b>no matter which path the code takes</b>. The compiler checks every path it can imagine, even ones you know can't happen:</p>
${demo(J`public static int sign(int x){
  if(x > 0)
    return 1;
  if(x <= 0)
    return -1;
}
System.out.println(sign(4));`, 'Compile error')}
<p>"Missing return statement": the compiler doesn't reason that one of the two ifs must be true; it sees a path where both are false and nothing is returned. (Unit 2 fixes this with else.)</p>
<p>A ${c('void')} method returns nothing at all. It may still use a bare ${c('return;')} to stop early, like the Pokemon ${c('damage')} method refusing negative damage:</p>
${demo(J`public static void damage(int healthLoss){
  if(healthLoss < 0)
    return;
  System.out.println("Took " + healthLoss + " damage");
}
damage(5);
damage(-3);
damage(2);`, 'Took 5 damage\nTook 2 damage')}

<h2>Returning an int from a double method</h2>
<p>A ${c('double')} method may return an int expression; it's converted to a double (a ${c('.0')} is attached). Watch out for what happens <i>before</i> the conversion though:</p>
${demo(J`public static double half(int n){
  return n / 2;
}
System.out.println(half(7));`, '3.0')}
<p>${c('7 / 2')} is int division, giving 3. Only then is 3 converted to 3.0. The method can't recover the lost .5.</p>

<h2>Overloading: same name, different parameter types</h2>
<p>Two methods in the same class may share a name only if their <b>lists of parameter types</b> differ. The teacher's johnCena example:</p>
<div data-cs="tracer" data-id="cena"></div>
<p>The rules, precisely:</p>
<ul>
<li>Different number of parameters: allowed (${c('()')} vs ${c('(int a)')}).</li>
<li>Same types in a different order: allowed. ${c('(int a, String b)')} and ${c('(String a, int b)')} are different lists.</li>
<li>Only the parameter <b>names</b> differ: not allowed. ${c('(int x)')} and ${c('(int y)')} are both just ${c('(int)')}.</li>
<li>Only the <b>return type</b> differs: not allowed.</li>
</ul>
${demo(J`public static void show(int a, String b){ System.out.println("int first: " + a + b); }
public static void show(String a, int b){ System.out.println("String first: " + a + b); }
show(1, "x");
show("x", 1);`, 'int first: 1x\nString first: x1')}
${demo(J`public static int area(int w, int h){ return w * h; }
public static double area(int w, int h){ return w * h * 1.0; }
System.out.println(area(2, 3));`, 'Compile error')}

${call('analogy', 'Analogy: a vending machine slot', 'The header is the label on the slot: "insert two quarters (parameters), get one soda (return type)." Two slots can share the name "Soda" only if they take different coins.')}
${call('mistake', 'Common mistakes', `<ul><li>Thinking a different return type is enough to overload. It isn't; only the parameter types count.</li><li>Writing a non-void method whose ifs "obviously" cover everything, with no final return.</li><li>Expecting a double method to fix int division that happened inside it.</li></ul>`)}
${call('ap', 'On the AP exam', 'Questions ask which pair of headers can coexist in one class, which method a call like <code>calc(3, 4.0)</code> runs, and whether a method compiles (missing return). The order of parameter types matters; names never do.')}
${check('Which header can be added to a class that already has <code>public int total(int a, double b)</code>?', ['<code>public double total(int a, double b)</code>', '<code>public int total(int x, double y)</code>', '<code>public int total(double a, int b)</code>', '<code>private int total(int a, double b)</code>'], 2, '(double, int) is a different list of parameter types from (int, double), so it overloads. The others have the same types (int, double) and differ only in return type, names, or access.')}
${check('What does <code>public static double avg(int a, int b){ return (a + b) / 2; }</code> return for <code>avg(3, 4)</code>?', ['3.5', '3.0', '3', 'Compile error'], 1, '(3 + 4) / 2 is int division: 3. Returning it from a double method attaches .0, so 3.0.')}
${check('A <code>void</code> method contains <code>return;</code>. What happens?', ['Compile error: void methods cannot return', 'The method stops immediately at that line', 'It returns 0', 'It returns null'], 1, 'A bare return; (no value) is allowed in a void method and simply exits it early.')}
`;
    return K.mount(el, { cena: spec({ src: J`public static void johnCena(){
  System.out.println("AND HIS NAME IS JOHN CENA!");
}
public static void johnCena(int a){
  System.out.println("AND HIS NAME IS JOHN CENA! " + a);
}
johnCena();
johnCena(5);`, title: 'Overloaded johnCena', expect: 'AND HIS NAME IS JOHN CENA!\nAND HIS NAME IS JOHN CENA! 5', caption: 'Each call jumps to the version whose parameter list matches: no arguments, then one int.' }) });
  });

  // =====================================================================
  // 1.14 Calling methods
  // =====================================================================
  const POKE_ATTACK = J`public class Pokemon {
  private String name;
  private int health;
  private int maxHealth;
  private int might;
  private int defense;
  private double hitRate;
  private double evadeRate;

  public Pokemon(String n, int h, int mi, int d, double hr, double er){
    name = n;
    health = h;
    maxHealth = h;
    might = mi;
    defense = d;
    hitRate = hr;
    evadeRate = er;
  }
  public String getName(){ return name; }
  public int getDefense(){ return defense; }
  public double getEvadeRate(){ return evadeRate; }

  public void attack(Pokemon target){
    System.out.println(name + " attacks " + target.getName());
    if(checkHit(hitRate, target.getEvadeRate())){
      System.out.print("Hit! ");
      target.damage(calcDamage(might, target.getDefense()));
    }
    else
      System.out.println("Miss");
  }
  public boolean checkHit(double hr, double er){
    return Math.random() < Math.max(0.25, hr - er);
  }
  public int calcDamage(int a, int b){
    return Math.max(1, (a*a)/(a + b));
  }
  public void damage(int healthLoss){
    if(healthLoss < 0)
      return;
    System.out.println(name + " has taken " + healthLoss + " damage");
    health -= healthLoss;
    if(health < 0)
      health = 0;
    System.out.println("Current health: " + health + "/" + maxHealth);
  }
  public String toString(){ return name + " " + health + "/" + maxHealth; }
}

Pokemon pikachu = new Pokemon("Pikachu", 30, 10, 6, 0.9, 0.2);
Pokemon squirtle = new Pokemon("Squirtle", 40, 10, 8, 0.8, 0.1);
pikachu.attack(squirtle);
squirtle.attack(pikachu);
System.out.println(pikachu);
System.out.println(squirtle);`;

  lesson(14, 'cs1-calling', ['arg-match', 'use-return', 'void-not-value', 'caller-vs-param', 'trace-calls'], (el) => {
    el.innerHTML = `
<p class="lead">A method sitting in a class does nothing until it's <b>called</b>. Calling means: hand over the arguments, jump into the method, run it, and come back with whatever it returns. Get comfortable tracing that jump and you can follow any program, however many methods it has.</p>

<h2>Arguments must line up with parameters</h2>
<p>The values you pass (arguments) are matched to the parameters <b>by position</b>: first to first, second to second. Their types must fit. An int fits a double parameter (it becomes x.0); a String doesn't fit a number:</p>
${demo(J`public static double qf1(double a, double b, double c){
  return (-b + Math.sqrt(b*b - 4*a*c))/(2*a);
}
System.out.println(qf1(2, 5, -3));`, '0.5')}
${demo(J`public static double qf1(double a, double b, double c){
  return (-b + Math.sqrt(b*b - 4*a*c))/(2*a);
}
System.out.println(qf1("2", 5, -3));`, 'Compile error')}

<h2>Using what a method returns</h2>
<p>A non-void call <i>is</i> a value. You can print it, store it, or use it in a bigger expression:</p>
${demo(J`public static double qf1(double a, double b, double c){
  return (-b + Math.sqrt(b*b - 4*a*c))/(2*a);
}
double sol1 = qf1(2, 5, -3);
System.out.println(sol1 * 10);
qf1(2, 5, -3);
System.out.println("done");`, '5.0\ndone')}
<p>The line ${c('qf1(2, 5, -3);')} by itself compiles and runs, but the 0.5 it returns is thrown away. Nothing is printed or stored.</p>

<h2>A void method has no value to use</h2>
<p>A void call does its job and comes back empty-handed. Trying to print it or store it doesn't compile:</p>
${demo(J`public static void sayHi(){ System.out.println("hi"); }
System.out.print(sayHi());`, 'Compile error')}
${demo(J`public static void sayHi(){ System.out.println("hi"); }
int x = sayHi();`, 'Compile error')}
<p>Just call it on its own line: ${c('sayHi();')}.</p>

<h2>Tracing calls between objects: the Pokemon battle</h2>
<p>Here's a trimmed version of the teacher's Pokemon class. One method calls another, which calls another. Step through ${c('pikachu.attack(squirtle)')} (Math.random is fixed at 0.5 for the first attack and 0.7 for the second, so the trace is the same every time):</p>
<div data-cs="tracer" data-id="battle"></div>
<p>What happened in the first attack, line by line:</p>
<ol>
<li>Inside ${c('attack')}, the caller is Pikachu and the parameter ${c('target')} is Squirtle. ${c('name')} alone means <b>the caller's</b> name ("Pikachu"); ${c('target.getName()')} asks <b>the target</b> for its name ("Squirtle").</li>
<li>${c('checkHit(hitRate, target.getEvadeRate())')} sends the attacker's hit rate (0.9) and the target's evade rate (0.1). ${c('Math.max(0.25, 0.8)')} is 0.8, and 0.5 &lt; 0.8, so it's a hit.</li>
<li>${c('calcDamage(might, target.getDefense())')} is ${c('Math.max(1, 100/18)')}. 100/18 is int division: 5.</li>
<li>${c('target.damage(5)')}: now <i>Squirtle</i> is the caller, so inside damage, ${c('name')} and ${c('health')} are Squirtle's. Health goes 40 → 35.</li>
</ol>
<p>In the second attack the roles flip: Squirtle's hit rate 0.8 minus Pikachu's evade 0.2 is about 0.6, and 0.7 is not below it, so it misses.</p>
${call('idea', 'Big idea: whose variable is it?', `Inside an instance method, a bare attribute name (${c('name')}, ${c('hitRate')}) always means the <b>caller\'s</b>. To use another object\'s value you must ask that object: ${c('target.getEvadeRate()')}. Sending ${c('evadeRate')} instead would quietly use the attacker\'s own evade rate: a logic error.`)}

${call('analogy', 'Analogy: a phone call', 'You dial (call the method) and read out some numbers (arguments). The other side does some work, maybe calls someone else, and finally tells you an answer (return value) before hanging up. A void method is a call where they just say "done."')}
${call('mistake', 'Common mistakes', `<ul><li>Passing arguments in the wrong order: the types might even match, but the values land in the wrong parameters.</li><li>Printing a void method call.</li><li>Calling a non-void method on its own line and expecting the result to be saved somewhere.</li></ul>`)}
${call('ap', 'On the AP exam', 'Tracing chains of calls is a staple: an object calls a method that calls another object\'s method. Keep a small table of each object\'s attributes and update it as you go. Watch for int division inside helper methods.')}
${check('Given <code>public static int f(int a, double b)</code>, which call compiles?', ['<code>f(2.5, 3)</code>', '<code>f(2, 3)</code>', '<code>f("2", 3.0)</code>', '<code>f(2)</code>'], 1, 'f(2, 3): 2 matches int, and the int 3 is allowed to go to the double parameter (it becomes 3.0). 2.5 can\'t go into an int parameter.')}
${check('Inside <code>pikachu.attack(squirtle)</code>, what does <code>might</code> refer to?', ["Squirtle's might", "Pikachu's might", 'Both added together', 'It does not compile'], 1, 'A bare attribute name means the caller\'s attribute. Pikachu called attack, so might is Pikachu\'s.')}
${check('<code>public static void greet()</code> exists. Which line compiles?', ['<code>String s = greet();</code>', '<code>System.out.println(greet());</code>', '<code>greet();</code>', '<code>greet() + "!";</code>'], 2, 'A void method has no value, so it can only be called as a statement on its own.')}
`;
    return K.mount(el, { battle: spec({ src: POKE_ATTACK, random: seq(0.5, 0.7), title: 'Pikachu vs Squirtle', expect: 'Pikachu attacks Squirtle\nHit! Squirtle has taken 5 damage\nCurrent health: 35/40\nSquirtle attacks Pikachu\nMiss\nPikachu 30/30\nSquirtle 35/40', caption: 'Watch the this. rows in the variable table: they switch from Pikachu to Squirtle when target.damage(...) is called.' }) });
  });

  // =====================================================================
  // 1.15 The Math class
  // =====================================================================
  function diceSim(el) {
    const host = el.querySelector && el.querySelector('[data-sim="dice"]');
    if (!host) return null;
    const P = window.PRKit;
    const cv = host.querySelector('canvas');
    const ro = host.querySelector('.sim-readout');
    const sel = host.querySelector('[data-k="f"]');
    const F = {
      good: { label: '(int)(Math.random() * 6) + 1', f: (r) => Math.trunc(r * 6) + 1 },
      bug: { label: '(int)Math.random() * 6 + 1', f: (r) => Math.trunc(r) * 6 + 1 },
      zero: { label: '(int)(Math.random() * 6)', f: (r) => Math.trunc(r * 6) },
      range: { label: '(int)(Math.random() * (8 - 4 + 1)) + 4', f: (r) => Math.trunc(r * 5) + 4 },
    };
    let counts = new Map(), total = 0;
    const lo = -1, hi = 9;
    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const n = hi - lo + 1, bw = (w - 40) / n, base = h - 28;
      const max = Math.max(1, ...counts.values());
      for (let v = lo; v <= hi; v++) {
        const k = v - lo, x = 20 + k * bw;
        const cnt = counts.get(v) || 0;
        const bh = (base - 20) * (cnt / max);
        ctx.fillStyle = cnt ? P.col('--accent') : P.rgba(P.col('--muted'), 0.15);
        P.roundRect(ctx, x + 4, base - Math.max(2, bh), bw - 8, Math.max(2, bh), 4); ctx.fill();
        P.text(ctx, String(v), x + bw / 2, base + 14, { color: P.col('--muted') });
        if (cnt) P.text(ctx, String(cnt), x + bw / 2, base - bh - 9, { size: 11 });
      }
    }
    const st = P.stage(cv, 0.42, draw);
    function roll(n) {
      const f = F[sel.value].f;
      for (let i = 0; i < n; i++) { const v = f(Math.random()); counts.set(v, (counts.get(v) || 0) + 1); }
      total += n;
      const vals = [...counts.keys()].sort((a, b) => a - b);
      ro.innerHTML = `<span>Formula: <b>${esc(F[sel.value].label)}</b></span><span>${total} rolls</span><span>values seen: <b>${vals.join(', ') || '—'}</b></span>`;
      st.request();
    }
    host.querySelectorAll('[data-roll]').forEach((b) => { b.onclick = () => roll(Number(b.dataset.roll)); });
    sel.onchange = () => { counts = new Map(); total = 0; roll(0); };
    roll(0);
    return () => st.destroy();
  }

  lesson(15, 'cs1-math', ['math-static', 'math-abs', 'math-pow', 'math-sqrt-nan', 'math-minmax', 'max-of-three', 'random-range', 'random-prob', 'random-int', 'random-cast-bug'], (el) => {
    el.innerHTML = `
<p class="lead">The Math class is a toolbox of ready-made calculations: absolute value, powers, square roots, minimum and maximum, and random numbers. Each tool has small rules about what type goes in and what type comes out, and those rules are exactly what exam questions test.</p>

<h2>Static methods: called on the class</h2>
<p>You never make a Math object. You call its methods on the class name itself: ${c('Math.sqrt(25)')}. That's what <b>static</b> means: the method belongs to the class. (Compare String methods like ${c('s.length()')}, which are called by a particular String object.)</p>

<h2>abs, pow, sqrt</h2>
${demo(J`System.out.println(Math.abs(-3));
System.out.println(Math.abs(-3.14));
System.out.println(Math.pow(3, 4));
System.out.println((int)Math.pow(3, 4));
System.out.println(Math.sqrt(25));
System.out.println(Math.sqrt(-25));`, '3\n3.14\n81.0\n81\n5.0\nNaN')}
<ul>
<li><b>${c('Math.abs')} is overloaded</b>: there's an int version and a double version. Give it an int, get an int (3); give it a double, get a double (3.14).</li>
<li><b>${c('Math.pow(base, exponent)')} always returns a double</b>: ${c('81.0')}, not 81. Cast with ${c('(int)')} if you need an int. And never write ${c('3 ^ 4')} for a power: in Java ${c('^')} is a different operator (bitwise exclusive or), and ${c('3 ^ 4')} is 7.</li>
<li><b>${c('Math.sqrt')} of a negative number returns ${c('NaN')}</b>, "not a number." That's a special double <i>value</i>, not an error; the program keeps running.</li>
</ul>
<p>The teacher's trick for imaginary roots: take the square root of the absolute value, then print an "i" if the number was negative:</p>
${demo(J`int a = -25;
System.out.print(Math.sqrt(Math.abs(a)));
if(a < 0)
  System.out.print("i");`, '5.0i')}

<h2>min and max: the type depends on the arguments</h2>
<p>Both are overloaded with an ${c('(int, int)')} version and a ${c('(double, double)')} version. Two ints call the int version. If <b>either</b> argument is a double, the double version runs and the int is converted:</p>
${demo(J`System.out.println(Math.max(2, 5));
System.out.println(Math.max(2, 5.0));
System.out.println(Math.min(2, 5.0));
int a = 4, b = 9, c = 7;
System.out.println(Math.max(a, Math.max(b, c)));`, '5\n5.0\n2.0\n9')}
<p>${c('Math.min(2, 5.0)')} is ${c('2.0')}, not 2: the 2 was converted to 2.0 on the way in. The last line is the standard way to find the largest of three: take the max of b and c, then the max of that and a. Try your own expressions here:</p>
<div data-cs="stepper" data-id="mm"></div>

<h2>Math.random(): a double from 0 up to (not including) 1</h2>
${rule('0.0 <= Math.random() < 1.0', 'a new random double every call, equally likely to be anywhere in that range. It can be 0.0 but never 1.0.')}
<p>Two ways to use it:</p>
<p><b>Probability.</b> ${c('Math.random() < p')} is true with probability p. ${c('Math.random() < 0.42')} is true 42% of the time. If p is 0 or less it's never true; if p is more than 1 it's always true. The Pokemon ${c('checkHit')} method returns ${c('Math.random() < Math.max(0.25, hr - er)')}: the ${c('Math.max')} sets a floor of 25%, so even a hopeless attack still hits a quarter of the time. With hr 0.5 and er 0.75:</p>
<div data-cs="stepper" data-id="hit"></div>
<p><b>Random integers.</b> Stretch, chop, shift:</p>
${rule('(int)(Math.random() * (max - min + 1)) + min', 'a random int from min to max inclusive, each equally likely. For a die: (int)(Math.random() * 6) + 1.')}
<ol><li>${c('Math.random() * 6')}: a double from 0 up to (not including) 6.</li><li>${c('(int)')} chops the decimal: 0, 1, 2, 3, 4 or 5.</li><li>${c('+ 1')}: 1 through 6.</li></ol>
<p>The parentheses around ${c('Math.random() * 6')} are essential. Casting happens before multiplication, so without them ${c('(int)Math.random()')} turns the random number (always below 1) into 0, and then ${c('0 * 6 + 1')} is always 1. Roll a few thousand of each and see:</p>
<div class="sim" data-sim="dice">
  <canvas></canvas>
  <div class="sim-controls">
    <label>Formula <select data-k="f"><option value="good">(int)(Math.random() * 6) + 1</option><option value="bug">(int)Math.random() * 6 + 1</option><option value="zero">(int)(Math.random() * 6)</option><option value="range">(int)(Math.random() * (8 - 4 + 1)) + 4</option></select></label>
    <button class="btn small" data-roll="1">Roll 1</button><button class="btn small" data-roll="100">Roll 100</button><button class="btn small primary" data-roll="1000">Roll 1000</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Real random numbers from your browser. The correct die formula fills 1–6 evenly; the version without parentheses only ever makes 1; leaving off the + 1 gives 0–5; the min/max formula gives 4–8.</div>
</div>
<p>And here's the same pair traced with Math.random fixed at 0.999 (as high as it can almost get):</p>
<div data-cs="tracer" data-id="rand"></div>

${call('analogy', 'Analogy: a toolbox you borrow', 'You don\'t build a hammer every time you need one; you take it off the shelf labeled Math. Each tool has a label saying what it takes and what it gives back, and the label is the part people misread.')}
${call('mistake', 'Common mistakes', `<ul><li>${c('(int)Math.random() * 6 + 1')}: always 1.</li><li>Forgetting ${c('Math.pow')} returns a double: ${c('int x = Math.pow(2, 3);')} doesn\'t compile (possible lossy conversion).</li><li>Writing ${c('2 ^ 3')} for a power.</li><li>Expecting ${c('Math.min(2, 5.0)')} to print 2.</li></ul>`)}
${call('ap', 'On the AP exam', `${c('Math.abs')}, ${c('Math.pow')}, ${c('Math.sqrt')} and ${c('Math.random')} are on the AP Java Quick Reference. The classic question: "Which expression produces a random integer from 5 to 12 inclusive?" Answer shape: ${c('(int)(Math.random() * 8) + 5')}, because 12 − 5 + 1 = 8.`)}
${check('Which expression gives a random int from 10 to 20 inclusive?', ['<code>(int)(Math.random() * 20) + 10</code>', '<code>(int)(Math.random() * 11) + 10</code>', '<code>(int)Math.random() * 11 + 10</code>', '<code>(int)(Math.random() * 10) + 10</code>'], 1, '20 − 10 + 1 = 11 possible values, so multiply by 11 and add 10. The third one has no parentheses and always gives 10; the last never reaches 20.')}
${check('What does <code>System.out.print(Math.max(7, 3.0));</code> print?', ['7', '7.0', '3.0', 'Compile error'], 1, 'One argument is a double, so the (double, double) version runs: 7 becomes 7.0, and that\'s the max.')}
${check('What does <code>Math.sqrt(-16)</code> do?', ['Returns 4.0', 'Returns -4.0', 'Returns NaN', 'Throws an ArithmeticException'], 2, 'Square roots of negatives return NaN, a special double value. No exception is thrown.')}
`;
    const specs = {
      mm: spec({ expr: '(int)Math.pow(3, 4) + Math.max(2, 5.0)', expect: '86.0', caption: 'Edit the expression: try Math.min(2, 5.0) or Math.abs(-7) * 2.' }),
      hit: spec({ expr: 'Math.max(0.25, hr - er)', vars: { hr: ['double', 0.5], er: ['double', 0.75] }, expect: '0.25', caption: 'hr − er is −0.25, so the floor of 0.25 wins: a 25% chance to hit.' }),
      rand: spec({ src: J`int good = (int)(Math.random() * 6) + 1;
int bug = (int)Math.random() * 6 + 1;
int fourToEight = (int)(Math.random() * (8 - 4 + 1)) + 4;
System.out.println(good + " " + bug + " " + fourToEight);`, random: () => 0.999, title: 'Math.random() fixed at 0.999', expect: '6 1 8', caption: 'Even with the largest possible random value, the version without parentheses still gives 1.' }),
    };
    return both(K.mount(el, specs), diceSim(el));
  });

  // =====================================================================
  // 1.16 More Math: round, floor, ceil, trig, logs
  // =====================================================================
  function lineSim(el) {
    const host = el.querySelector && el.querySelector('[data-sim="nline"]');
    if (!host) return null;
    const P = window.PRKit;
    const cv = host.querySelector('canvas');
    const ro = host.querySelector('.sim-readout');
    const sl = host.querySelector('[data-k="x"]');
    const xv = host.querySelector('[data-k="xv"]');
    let x = -5.3;
    const jd = (v) => JavaLite.fmtDouble(v);
    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const L = -7, R = 7, X = (v) => 24 + ((v - L) / (R - L)) * (w - 48), y0 = h * 0.62;
      ctx.strokeStyle = P.col('--muted'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(L), y0); ctx.lineTo(X(R), y0); ctx.stroke();
      for (let v = L; v <= R; v++) {
        ctx.beginPath(); ctx.moveTo(X(v), y0 - 5); ctx.lineTo(X(v), y0 + 5); ctx.stroke();
        P.text(ctx, String(v), X(v), y0 + 18, { color: P.col('--muted'), size: 11 });
      }
      const marks = [
        { v: Math.trunc(x), lab: '(int)', color: P.col('--neg'), dy: -50 },
        { v: Math.floor(x), lab: 'floor', color: P.col('--pos'), dy: -34 },
        { v: Math.ceil(x), lab: 'ceil', color: P.col('--good'), dy: -66 },
        { v: Math.floor(x + 0.5), lab: 'round', color: P.col('--warn'), dy: -18 },
      ];
      marks.forEach((m) => {
        ctx.fillStyle = m.color;
        ctx.beginPath(); ctx.arc(X(m.v), y0 + m.dy + 22, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = P.rgba(m.color, 0.5); ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(X(m.v), y0 + m.dy + 26); ctx.lineTo(X(m.v), y0); ctx.stroke(); ctx.setLineDash([]);
        P.text(ctx, m.lab, X(m.v) + 8, y0 + m.dy + 22, { align: 'left', color: m.color, weight: 700, size: 11 });
      });
      ctx.fillStyle = P.col('--accent');
      ctx.beginPath(); ctx.arc(X(x), y0, 7, 0, Math.PI * 2); ctx.fill();
      P.text(ctx, 'x = ' + jd(x), X(x), y0 + 34, { color: P.col('--accent'), weight: 700 });
    }
    const st = P.stage(cv, 0.34, draw);
    function upd(v) {
      x = Math.round(Number(v) * 10) / 10;
      if (!isFinite(x)) return;
      sl.value = x; xv.value = jd(x);
      ro.innerHTML = `<span>(int)x = <b>${Math.trunc(x)}</b></span><span>Math.floor(x) = <b>${jd(Math.floor(x))}</b></span><span>Math.ceil(x) = <b>${jd(Math.ceil(x))}</b></span><span>Math.round(x) = <b>${Math.floor(x + 0.5)}</b></span>`;
      st.request();
    }
    sl.oninput = () => upd(sl.value);
    xv.onchange = () => upd(xv.value);
    upd(x);
    return () => st.destroy();
  }

  lesson(16, 'cs1-math-more', ['math-round', 'math-floor-ceil', 'math-trig-radians', 'math-log'], (el) => {
    el.innerHTML = `
<p class="lead">Beyond the AP essentials, the Math class has rounding tools, trig functions and logarithms. Each has one detail that trips people up: whether it rounds toward zero or downward, whether it returns an int or a double, whether it expects degrees or radians.</p>

<h2>Four ways to turn a decimal into a whole number</h2>
<p>They agree for positive numbers that are already close to whole, and disagree everywhere else, especially for negatives. Drag x and compare:</p>
<div class="sim" data-sim="nline">
  <canvas></canvas>
  <div class="sim-controls">
    <label>x <input type="range" data-k="x" min="-6.5" max="6.5" step="0.1" value="-5.3"></label>
    <label>or type <input type="number" data-k="xv" step="0.1" style="width:90px"></label>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">(int) chops toward zero. floor always goes down, ceil always goes up. round goes to the nearest whole number (halves go up). Look at x = −5.3: (int) gives −5 but floor gives −6.0.</div>
</div>
<ul>
<li>${c('Math.round(n)')} rounds to the <b>nearest</b> whole number and returns a whole-number type (technically a ${c('long')}, so storing it in an int needs a cast). ${c('Math.round(4.6)')} is 5, ${c('Math.round(-4.6)')} is −5, ${c('Math.round(-4.2)')} is −4.</li>
<li>${c('Math.floor(n)')} returns the next whole number <b>down</b>, as a <b>double</b>: ${c('Math.floor(5.8)')} is ${c('5.0')} and ${c('Math.floor(-5.3)')} is ${c('-6.0')}.</li>
<li>${c('Math.ceil(n)')} returns the next whole number <b>up</b>, as a <b>double</b>: ${c('Math.ceil(5.3)')} is ${c('6.0')} and ${c('Math.ceil(-5.8)')} is ${c('-5.0')}.</li>
<li>If n already ends in .0, floor and ceil give it back unchanged.</li>
</ul>
${demo(J`System.out.println(Math.round(4.6) + " " + Math.round(4.2) + " " + Math.round(-4.6) + " " + Math.round(-4.2));
System.out.println(Math.floor(-5.3));
System.out.println(Math.ceil(-5.8));
System.out.println((int)Math.floor(-5.8));
System.out.println((int)Math.ceil(5.3));`, '5 4 -5 -4\n-6.0\n-5.0\n-6\n6')}

<h2>Trig works in radians</h2>
<p>${c('Math.sin')}, ${c('Math.cos')} and ${c('Math.tan')} take an angle in <b>radians</b>. ${c('Math.sin(90)')} is the sine of 90 radians, not 90°. Convert degrees by multiplying by ${c('Math.PI / 180')}. The inverse functions (${c('Math.asin')}, ${c('Math.acos')}, ${c('Math.atan')}) return radians too; multiply by ${c('180 / Math.PI')} to get degrees:</p>
${demo(J`System.out.println(Math.sin(Math.PI / 2));
System.out.println(Math.sin(90));
System.out.println(Math.sin(30 * Math.PI / 180));
System.out.println(Math.asin(1.0));
System.out.println(Math.asin(1.0) * 180 / Math.PI);`, '1.0\n0.8939966636005579\n0.49999999999999994\n1.5707963267948966\n90.0')}
<p>Notice ${c('sin(30°)')} came out as 0.49999999999999994, not 0.5: Math.PI is itself a rounded value, so a tiny error creeps in.</p>

<h2>Logarithms: log means ln</h2>
${rule('Math.log(x)    Math.log10(x)', `${c('Math.log')} is the <b>natural</b> log (base e), what your calculator calls ln. ${c('Math.log10')} is base 10. There is no ${c('Math.ln')}.`)}
${demo(J`System.out.println(Math.log(Math.E));
System.out.println(Math.log10(1000));
System.out.println(Math.log(1));`, '1.0\n3.0\n0.0')}
${demo(J`System.out.println(Math.ln(2));`, 'Compile error')}
<p>Step through an expression that mixes them:</p>
<div data-cs="stepper" data-id="fc"></div>

${call('analogy', 'Analogy: stuck between floors', 'You\'re in an elevator stuck at floor −5.3. floor takes you down to −6, ceil takes you up to −5, round takes you to whichever is nearer, and (int) always moves you toward the lobby at 0.')}
${call('mistake', 'Common mistakes', `<ul><li>Thinking ${c('(int)')} and ${c('Math.floor')} are the same. For negatives they differ by one.</li><li>Forgetting floor and ceil return doubles (${c('-6.0')}, not −6).</li><li>${c('Math.sin(45)')} for 45 degrees.</li><li>Writing ${c('Math.ln')}: it doesn't exist.</li></ul>`)}
${call('ap', 'On the AP exam', 'These methods aren\'t on the Quick Reference, so the exam rarely needs them; your class tests do. When you see them, the question is almost always about the return type or about negatives.')}
${check('What does <code>System.out.print(Math.floor(-2.1));</code> print?', ['-2', '-2.0', '-3.0', '-3'], 2, 'floor goes down to the next whole number: −3. It returns a double, so it prints -3.0.')}
${check('Which expression is the sine of 60 degrees?', ['<code>Math.sin(60)</code>', '<code>Math.sin(60 * 180 / Math.PI)</code>', '<code>Math.sin(60 * Math.PI / 180)</code>', '<code>Math.asin(60)</code>'], 2, 'Convert degrees to radians by multiplying by π/180.')}
${check('What is <code>Math.round(-7.5)</code>?', ['-8', '-7', '-7.0', '-8.0'], 1, 'Halves round up (toward positive infinity): −7.5 rounds to −7. It returns a whole-number type, so no .0.')}
`;
    return both(K.mount(el, { fc: spec({ expr: 'Math.floor(-5.3) + Math.ceil(-5.8) + Math.round(2.5)', expect: '-8.0', caption: 'floor and ceil give doubles, so the whole sum is a double. Edit it to try your own.' }) }), lineSim(el));
  });

  // =====================================================================
  // 1.17 Objects, instances, aliases
  // =====================================================================
  const POKE_ALIAS = J`public class Pokemon {
  private String name;
  private int health;
  private int maxHealth;
  private int might;
  public Pokemon(String n, int h, int mi){
    name = n;
    health = h;
    maxHealth = h;
    might = mi;
  }
  public void grow(int h, int m){
    maxHealth += h;
    health += h;
    might += m;
  }
  public String toString(){ return name + " " + health + "/" + maxHealth; }
}

Pokemon p2 = new Pokemon("Squirtle", 16, 4);
Pokemon p3 = new Pokemon("Charmander", 9, 3);
Pokemon p4 = p2;
System.out.println(p2 == p4);
System.out.println(p3 == p4);
p4.grow(5, 2);
System.out.println(p2);`;

  function aliasSim(el) {
    const host = el.querySelector && el.querySelector('[data-sim="alias"]');
    if (!host) return null;
    const P = window.PRKit;
    const cv = host.querySelector('canvas');
    const ro = host.querySelector('.sim-readout');
    let objs, refs, msg;
    function reset() {
      objs = [{ name: 'Squirtle', h: 16, max: 16 }, { name: 'Charmander', h: 9, max: 9 }];
      refs = { p2: 0, p3: 1, p4: null };
      msg = 'Pokemon p4; (no object yet: p4 is null)';
    }
    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const names = ['p2', 'p3', 'p4'];
      const vx = w * 0.06, vw = Math.min(90, w * 0.2), vh = 34;
      const vy = (i) => 26 + i * (h - 60) / 2;
      const ox = w * 0.56, ow = Math.min(190, w * 0.38), oh = 46;
      const oy = (i) => 16 + i * Math.min(70, (h - 70) / Math.max(1, objs.length - 1));
      objs.forEach((o, i) => {
        const used = Object.values(refs).includes(i);
        ctx.fillStyle = P.col('--surface'); ctx.strokeStyle = used ? P.col('--accent') : P.col('--border'); ctx.lineWidth = used ? 2 : 1;
        P.roundRect(ctx, ox, oy(i), ow, oh, 8); ctx.fill(); ctx.stroke();
        P.text(ctx, `${o.name} ${o.h}/${o.max}`, ox + ow / 2, oy(i) + 18, { weight: 700, color: used ? P.col('--text') : P.col('--muted') });
        P.text(ctx, used ? `Pokemon object #${i + 1}` : `#${i + 1} (no references)`, ox + ow / 2, oy(i) + 34, { size: 11, color: P.col('--muted') });
      });
      names.forEach((n, i) => {
        ctx.fillStyle = P.col('--surface-2'); ctx.strokeStyle = P.col('--border'); ctx.lineWidth = 1;
        P.roundRect(ctx, vx, vy(i), vw, vh, 6); ctx.fill(); ctx.stroke();
        P.text(ctx, n, vx + vw / 2, vy(i) + vh / 2, { weight: 700, size: 13 });
        const t = refs[n];
        if (t === null) P.text(ctx, 'null', vx + vw + 30, vy(i) + vh / 2, { color: P.col('--muted'), weight: 600 });
        else P.arrow(ctx, vx + vw + 4, vy(i) + vh / 2, ox - 6, oy(t) + oh / 2, n === 'p4' ? P.col('--warn') : P.col('--accent'), 2, 9);
      });
    }
    const st = P.stage(cv, 0.5, draw);
    function upd() {
      const eq = (a, b) => (refs[a] !== null && refs[a] === refs[b]) || (refs[a] === null && refs[b] === null);
      ro.innerHTML = `<span class="mono">${esc(msg)}</span><span>p2 == p4: <b>${eq('p2', 'p4')}</b></span><span>p3 == p4: <b>${eq('p3', 'p4')}</b></span>`;
      st.request();
    }
    const act = {
      a2: () => { refs.p4 = refs.p2; msg = 'p4 = p2;  (p4 now points where p2 points)'; },
      a3: () => { refs.p4 = refs.p3; msg = 'p4 = p3;'; },
      copy: () => { const s = objs[refs.p2]; objs.push({ name: s.name, h: s.h, max: s.max }); refs.p4 = objs.length - 1; msg = `p4 = new Pokemon("${s.name}", ${s.h}, ...);  (same data, NEW object)`; },
      grow: () => {
        if (refs.p4 === null) { msg = 'p4.grow(5, 2);  → NullPointerException: p4 is null'; return; }
        const o = objs[refs.p4]; o.h += 5; o.max += 5; msg = 'p4.grow(5, 2);  (changes the object p4 points to)';
      },
      nul: () => { refs.p4 = null; msg = 'p4 = null;'; },
      reset: () => reset(),
    };
    host.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => { act[b.dataset.a](); upd(); }; });
    reset(); upd();
    return () => st.destroy();
  }

  lesson(17, 'cs1-objects', ['class-vs-object', 'new-keyword', 'reference-variable', 'aliases', 'object-equality', 'private-access'], (el) => {
    el.innerHTML = `
<p class="lead">An int variable holds a number. An object variable does <b>not</b> hold an object; it holds a <i>reference</i>, an arrow pointing to an object somewhere in memory. That one fact explains aliases, why == on objects surprises people, and why changing "one" object can change "another."</p>

<h2>Class vs object</h2>
<p>The class is the blueprint; objects are what you build from it. ${c('Pokemon')} is one class. Pikachu, Squirtle and Charmander are three <b>instances</b> of it, each with its own attribute values (name, health, might, ...).</p>

<h2>new builds an object and runs a constructor</h2>
${rule('Pokemon p1 = new Pokemon("Pikachu", 15, 6);', `${c('Pokemon p1')} declares a variable that can refer to a Pokemon. ${c('new')} instantiates (creates) a brand-new Pokemon object and calls the constructor whose parameters match the arguments. Then the reference to that object is stored in p1.`)}

<h2>Variables hold references: aliases</h2>
<p>What does ${c('Pokemon p4 = p2;')} do? It does <b>not</b> copy Squirtle. It copies the <i>arrow</i>. Now p2 and p4 point at the same single object: they are <b>aliases</b>. Change the object through p4 and p2 sees the change, because there is only one object. Click through it:</p>
<div class="sim" data-sim="alias">
  <canvas></canvas>
  <div class="sim-controls">
    <button class="btn small" data-a="a2">p4 = p2;</button>
    <button class="btn small" data-a="a3">p4 = p3;</button>
    <button class="btn small" data-a="copy">p4 = new Pokemon(same data as p2)</button>
    <button class="btn small primary" data-a="grow">p4.grow(5, 2);</button>
    <button class="btn small" data-a="nul">p4 = null;</button>
    <button class="btn small" data-a="reset">Reset</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Arrows are references. Try: p4 = p2, then grow, and watch Squirtle change for both. Then make a new object with the same data: == says false even though they look identical. Grow while p4 is null to see a NullPointerException.</div>
</div>
<p>The teacher's version in code:</p>
<div data-cs="tracer" data-id="alias"></div>

<h2>== on objects: same object, not same data</h2>
<p>For objects, ${c('==')} asks "do these two variables point to the <b>same object</b>?" Two different objects with identical data are not ==:</p>
${demo(J`public class Pokemon {
  private String name;
  private int health;
  public Pokemon(String n, int h){ name = n; health = h; }
}
Pokemon a = new Pokemon("Eevee", 10);
Pokemon b = new Pokemon("Eevee", 10);
Pokemon c = a;
System.out.println(a == b);
System.out.println(a == c);`, 'false\ntrue')}
<p>And == can only compare variables of compatible types. Asking whether a Car is the same object as a Plant doesn't even compile:</p>
${demo(J`class Car { }
class Plant { }
Car c = new Car();
Plant p = new Plant();
System.out.println(c == p);`, 'Compile error')}

<h2>Private attributes stay private</h2>
<p>From outside the class you can't read a private attribute directly, even though the object clearly has it. You need a method (a "getter"):</p>
${demo(J`public class Pokemon {
  private String name;
  public Pokemon(String n){ name = n; }
  public String getName(){ return name; }
}
Pokemon p = new Pokemon("Pikachu");
System.out.println(p.getName());`, 'Pikachu')}
${demo(J`public class Pokemon {
  private String name;
  public Pokemon(String n){ name = n; }
}
Pokemon p = new Pokemon("Pikachu");
System.out.println(p.name);`, 'Compile error')}

${call('analogy', 'Analogy: house addresses', 'A variable holding an object is like a slip of paper with a house address on it. Copying the slip (p4 = p2) gives you two slips with the same address, not a second house. Paint the house using either slip and both slips now lead to a painted house.')}
${call('mistake', 'Common mistakes', `<ul><li>Thinking ${c('p4 = p2')} makes a copy. It makes an alias.</li><li>Using ${c('==')} to ask whether two objects have the same data. It only checks if they are the same object.</li><li>Accessing ${c('obj.privateField')} from another class.</li></ul>`)}
${call('ap', 'On the AP exam', 'Alias questions are classic: "After these statements, what is printed?" Draw the arrows. Every new makes a new box; every = between object variables just moves an arrow. Changes made through any arrow show up through every arrow pointing at that box.')}
${check('<code>Pokemon a = new Pokemon("A", 10); Pokemon b = a; b.grow(5, 0);</code> What is a\'s health now?', ['10', '15', '5', 'It depends on b'], 1, 'a and b refer to the same object, so growing it through b changes the one object both see: 15.')}
${check('How many Pokemon objects exist after: <code>Pokemon x = new Pokemon("A", 1); Pokemon y = x; Pokemon z = new Pokemon("A", 1);</code>', ['1', '2', '3', '0'], 1, 'Only new creates objects. There are two news, so two objects; x and y are aliases of the first.')}
${check('Two different Pokemon objects have exactly the same name and health. What is <code>p == q</code>?', ['true', 'false', 'Compile error', 'It depends on toString'], 1, '== on objects compares identity (same object), not contents. Different objects means false.')}
`;
    return both(K.mount(el, { alias: spec({ src: POKE_ALIAS, title: 'Aliases', expect: 'true\nfalse\nSquirtle 21/21', caption: 'p4 = p2 copies the reference, so p4.grow(5, 2) changes the Squirtle object that p2 also points to.' }) }), aliasSim(el));
  });

  // =====================================================================
  // 1.18 String methods
  // =====================================================================
  function substrSim(el) {
    const host = el.querySelector && el.querySelector('[data-sim="substr"]');
    if (!host) return null;
    const q = (k) => host.querySelector(`[data-k="${k}"]`);
    function render() {
      const s = q('s').value;
      const n = s.length;
      const fr = Number(q('from').value), to = Number(q('to').value);
      q('from').min = q('to').min = -2; q('from').max = q('to').max = n + 2;
      q('fv').textContent = fr; q('tv').textContent = to;
      const inRange = (i) => i >= fr && i < to;
      const bad = fr < 0 || to > n || fr > to;
      host.querySelector('.strip').innerHTML = s.split('').map((ch, i) => `<div class="cell ${!bad && inRange(i) ? 'on' : ''} ${idx >= 0 && i >= idx && i < idx + q('find').value.length ? 'found' : ''}"><b>${ch === ' ' ? '␣' : esc(ch)}</b><i>${i}</i></div>`).join('') + `<div class="cell end"><b>&nbsp;</b><i>${n}</i></div>`;
      const call1 = `s.substring(${fr}, ${to})`;
      const res = bad ? `<span class="err">StringIndexOutOfBoundsException</span> <span class="muted">(${fr < 0 ? 'from is negative' : to > n ? `to (${to}) is greater than length (${n})` : `from (${fr}) is greater than to (${to})`})</span>` : `"<b class="mono">${esc(s.slice(fr, to))}</b>" <span class="muted">(${to - fr} characters: indices ${fr} to ${to - 1})</span>`;
      host.querySelector('.r1').innerHTML = `<span class="mono">${esc(call1)}</span> → ${res}`;
      host.querySelector('.r2').innerHTML = `<span class="mono">s.indexOf("${esc(q('find').value)}", ${q('ff').value})</span> → <b>${idx}</b>${idx < 0 ? ' <span class="muted">(not found)</span>' : ''} · <span class="mono">s.length()</span> = <b>${n}</b>`;
    }
    let idx = -1;
    function upd() {
      const s = q('s').value, f = q('find').value, from = Number(q('ff').value) || 0;
      idx = f.length ? s.indexOf(f, Math.max(0, from)) : (from > s.length ? -1 : Math.max(0, from));
      render();
    }
    ['s', 'from', 'to', 'find', 'ff'].forEach((k) => { q(k).oninput = upd; });
    upd();
    return null;
  }

  lesson(18, 'cs1-strings', ['string-index', 'string-length', 'substring-one', 'substring-two', 'substring-bounds', 'single-char', 'indexof', 'indexof-from', 'substring-indexof-neg', 'equals-vs-eq', 'equals-case', 'compareto', 'compareto-prefix', 'contains'], (el) => {
    const s1 = 'I am Iron Man!';
    el.innerHTML = `
<p class="lead">Strings are objects, and the String class gives every String a set of methods: how long it is, cut out a piece, find something inside, compare with another String. Almost every String question comes down to one skill: counting indices correctly, starting from <b>0</b>.</p>

<h2>Indices start at 0</h2>
<p>Each character has an index. The first is index 0, so the last is at <b>length − 1</b>. Spaces and punctuation are characters too:</p>
<table class="truth"><tr><th>Index</th>${s1.split('').map((_, i) => `<td>${i}</td>`).join('')}</tr><tr><th>Char</th>${s1.split('').map((ch) => `<td class="mono">${ch === ' ' ? '␣' : esc(ch)}</td>`).join('')}</tr></table>
${rule('s.length()', 'the number of characters. "I am Iron Man!".length() is 14, so its characters are at indices 0 through 13.')}

<h2>substring: cutting out a piece</h2>
${rule('s.substring(from)        s.substring(from, to)', `One parameter: from index ${c('from')} to the end. Two parameters: from ${c('from')} (<b>inclusive</b>) up to ${c('to')} (<b>exclusive</b>): the character at ${c('to')} is not included. The result has ${c('to − from')} characters.`)}
${demo(J`String s1 = "I am Iron Man!";
System.out.println(s1.length());
System.out.println(s1.substring(4));
System.out.println(s1.substring(s1.length() - 1));
System.out.println(s1.substring(4, 11));
System.out.println("[" + s1.substring(14) + "]");
System.out.println("[" + s1.substring(3, 3) + "]");`, '14\n Iron Man!\n!\n Iron M\n[]\n[]')}
<ul>
<li>${c('s1.substring(4)')} starts at index 4, which is a space, so the result begins with a space.</li>
<li>${c('s.substring(s.length() - 1)')} is always just the last character.</li>
<li>${c('substring(4, 11)')} takes indices 4 through 10: " Iron M".</li>
<li>${c('substring(14)')} when the length is 14 is the <b>empty String</b>, not an error. An index equal to the length is still "in bounds" as a starting point. Same for ${c('substring(3, 3)')}.</li>
</ul>
${rule('s.substring(i, i + 1)', 'the single character at index i, as a String.')}

<h2>When substring crashes</h2>
<p>${c('StringIndexOutOfBoundsException')} (a runtime error) happens when: any index is <b>negative</b>, any index is <b>greater than</b> the length, or ${c('from')} is greater than ${c('to')}:</p>
${demo(J`String s1 = "I am Iron Man!";
System.out.println(s1.substring(15));`, 'StringIndexOutOfBoundsException')}
${demo(J`String s1 = "I am Iron Man!";
System.out.println(s1.substring(7, 6));`, 'StringIndexOutOfBoundsException')}
<p>Drag the handles past the ends of the String and see exactly when it breaks:</p>
<style>
.strip{display:flex;flex-wrap:wrap;gap:3px;padding:12px 16px}
.strip .cell{display:flex;flex-direction:column;align-items:center;min-width:26px;border:1px solid var(--border);border-radius:6px;padding:3px 2px;background:var(--surface-2)}
.strip .cell b{font-family:"JetBrains Mono",monospace;font-weight:500}
.strip .cell i{font-size:11px;color:var(--muted);font-style:normal}
.strip .cell.on{background:var(--accent-soft);border-color:var(--accent)}
.strip .cell.found{box-shadow:inset 0 -3px 0 var(--warn)}
.strip .cell.end{border-style:dashed;background:none}
</style>
<div class="sim" data-sim="substr">
  <div class="sim-controls">
    <label>s = <input type="text" data-k="s" value="${esc(s1)}" class="mono" spellcheck="false" style="width:200px"></label>
    <label>from <input type="range" data-k="from" value="4" step="1"> <b data-k="fv"></b></label>
    <label>to <input type="range" data-k="to" value="11" step="1"> <b data-k="tv"></b></label>
  </div>
  <div class="strip"></div>
  <div class="sim-readout r1"></div>
  <div class="sim-controls">
    <label>indexOf <input type="text" data-k="find" value="a" class="mono" spellcheck="false" style="width:80px"></label>
    <label>starting at <input type="number" data-k="ff" value="0" style="width:70px"></label>
  </div>
  <div class="sim-readout r2"></div>
  <div class="sim-caption">Blue cells are the substring (from inclusive, to exclusive). Yellow cells are where indexOf found its match. The index after the last character (the length) is shown as an empty cell: you can start or end a substring there.</div>
</div>

<h2>indexOf: where is it?</h2>
${rule('s.indexOf(str)        s.indexOf(str, from)', `Returns the index where ${c('str')} is <b>first</b> found, or <b>−1</b> if it isn't there. For a longer str, the index where the match <i>begins</i>. With a second parameter, the search starts at index ${c('from')} (inclusive).`)}
${demo(J`String s1 = "I am Iron Man!";
System.out.println(s1.indexOf("o"));
System.out.println(s1.indexOf("a"));
System.out.println(s1.indexOf("i"));
System.out.println(s1.indexOf("ron"));
System.out.println(s1.indexOf("a", 2));
System.out.println(s1.indexOf("a", 3));
System.out.println(s1.indexOf("a", 12));`, '7\n2\n-1\n6\n2\n11\n-1')}
<p>${c('indexOf("i")')} is −1 because Java is case sensitive: there's a capital I, but no lowercase i. ${c('indexOf("a", 2)')} is still 2 because the starting index is included in the search.</p>

<h2>Combining methods</h2>
<p>A method that returns a String can immediately call another String method. Read left to right:</p>
${demo(J`String s1 = "I am Iron Man!";
System.out.println(s1.substring(5, 9).indexOf("o"));
System.out.println(s1.substring(5, 9).indexOf("a"));
System.out.println(s1.substring(s1.indexOf("a")));`, '2\n-1\nam Iron Man!')}
<p>${c('s1.substring(5, 9)')} is "Iron", and in "Iron" the "o" is at index 2. But careful when indexOf fails:</p>
${demo(J`String s1 = "I am Iron Man!";
System.out.println(s1.substring(s1.indexOf("x")));`, 'StringIndexOutOfBoundsException')}
<p>${c('indexOf("x")')} returned −1, so this is ${c('substring(-1)')}: a crash.</p>

<h2>equals: same characters</h2>
<p>To ask whether two Strings contain the same characters, use ${c('equals')}, never ==. (== asks whether they are the same <i>object</i>; two Strings built separately can have identical text but be different objects, so == can be false.) And equals is exact: every character, capitalization and space must match.</p>
${demo(J`String s2 = "Iron Man killed him!";
String s3 = "Iron Man killed him!";
String s4 = "Ant Man killed him!";
System.out.println(s2.equals(s3));
System.out.println(s2.equals(s4));
System.out.println("Iron Man".equals("iron man"));`, 'true\nfalse\nfalse')}
${code(J`String a = "hi";
String b = new String("hi");
System.out.println(a == b);       // false: two different String objects
System.out.println(a.equals(b));  // true: same characters`)}

<h2>compareTo: alphabetical order</h2>
${rule('a.compareTo(b)', `<b>negative</b> if a comes before b in dictionary (ASCII) order, <b>positive</b> if after, <b>0</b> if they match exactly. The actual number is the difference between the first pair of characters that differ.`)}
${demo(J`String s1 = "Who Killed Thanos?";
String s4 = "Ant Man killed him!";
String s5 = "We all killed Thanos!";
System.out.println(s1.compareTo(s4));
System.out.println(s4.compareTo(s1));
System.out.println(s1.compareTo(s5));
System.out.println("pear".compareTo("pearl"));
System.out.println("pearl".compareTo("pear"));`, '22\n-22\n3\n-1\n1')}
<p>W is 22 letters after A, so 22. "Who..." vs "We...": the W's match, so the next letters decide: h is 3 after e. When one String is the start of the other ("pear" vs "pearl"), the <b>shorter one comes first</b>, so the result is negative.</p>

<h2>contains</h2>
${rule('s.contains(t)', `true if ${c('t')} appears anywhere in ${c('s')}. It's exactly the same question as ${c('s.indexOf(t) >= 0')}.`)}
${demo(J`String s1 = "John Cena";
System.out.println(s1.contains("oh"));
System.out.println(s1.contains("hi"));
System.out.println(s1.indexOf("oh") >= 0);`, 'true\nfalse\ntrue')}

${call('analogy', 'Analogy: a ruler', 'Picture the indices as the marks on a ruler, with letters in the gaps between them. substring(4, 11) cuts at mark 4 and mark 11 and keeps what is between. The last mark is at the length: you can cut there, but there is no letter after it.')}
${call('mistake', 'Common mistakes', `<ul><li>Thinking the last index is ${c('length()')}. It's ${c('length() - 1')}.</li><li>Including the character at ${c('to')} in ${c('substring(from, to)')}.</li><li>Thinking ${c('substring(length())')} crashes. It returns "".</li><li>Comparing Strings with ==.</li><li>Forgetting indexOf can return −1, then passing it to substring.</li></ul>`)}
${call('ap', 'On the AP exam', `${c('length')}, ${c('substring')} (both versions), ${c('indexOf')}, ${c('equals')} and ${c('compareTo')} are on the Java Quick Reference. Expect "what is printed" questions built from combinations, and free-response methods that walk through a String with ${c('substring(i, i + 1)')}.`)}
${check('What is <code>"basketball".substring(3, 6)</code>?', ['"ketb"', '"ket"', '"sket"', '"ketba"'], 1, 'Indices 3, 4 and 5: k, e, t. Index 6 is excluded.')}
${check('Which call does NOT throw an exception for <code>String s = "abc";</code>?', ['<code>s.substring(4)</code>', '<code>s.substring(-1)</code>', '<code>s.substring(3)</code>', '<code>s.substring(2, 1)</code>'], 2, 's.substring(3) starts at the length, which is allowed, and returns the empty String.')}
${check('What does <code>"cat".compareTo("catalog")</code> return?', ['0', 'A positive number', 'A negative number', 'An exception'], 2, '"cat" is the beginning of "catalog", so the shorter one comes first alphabetically: negative.')}
`;
    return both(K.mount(el, {}), substrSim(el));
  });

  // =====================================================================
  // 1.19 Concatenation, escape sequences, toString
  // =====================================================================
  lesson(19, 'cs1-concat', ['string-immutable', 'concat-left-right', 'concat-parens', 'escape-seq', 'tostring-implicit', 'concat-compound'], (el) => {
    el.innerHTML = `
<p class="lead">The ${c('+')} sign does two different jobs in Java: it adds numbers, and it glues Strings together (concatenation). Which job it does depends on what's on either side of it, and Java decides one ${c('+')} at a time, left to right. That's where all the surprises come from.</p>

<h2>Strings never change</h2>
<p>Strings are <b>immutable</b>: no String method changes the String that calls it. ${c('substring')}, concatenation and the rest all build a <i>new</i> String. If you don't store that new String, it's gone:</p>
${demo(J`String s = "hello";
s.substring(1);
System.out.println(s);
s = s.substring(1);
System.out.println(s);`, 'hello\nello')}
<p>(Objects from classes we write, like Pokemon, are usually <b>mutable</b>: a method like ${c('damage')} really changes the object. Strings are the exception.) A String can be made from a literal (${c('"John Cena"')}) or with the constructor (${c('new String("John Cena")')}); the String class needs no import.</p>

<h2>+ is decided left to right</h2>
${rule('String + anything → String', `If at least one side of a ${c('+')} is a String, it concatenates: the other side is converted to text. If both sides are numbers, it adds. Concatenation has the same precedence as addition and goes left to right.`)}
<p>Step through these and watch when the + switches from adding to gluing:</p>
<div data-cs="stepper" data-id="lr"></div>
${demo(J`System.out.println("John Cena " + 4 + 3);
System.out.println(4 + 3 + " John Cena " + 4 + 3);
System.out.println("John Cena " + (4 + 3));
System.out.println("John Cena " + 4 * 3);`, 'John Cena 43\n7 John Cena 43\nJohn Cena 7\nJohn Cena 12')}
<ul>
<li>${c('"John Cena " + 4')} is already a String, so ${c('+ 3')} glues: "John Cena 43".</li>
<li>${c('4 + 3')} at the start is number + number: 7. After that, everything is gluing.</li>
<li>Parentheses happen first, so ${c('(4 + 3)')} is added before it meets the String.</li>
<li>${c('*')} has higher precedence than ${c('+')}, so ${c('4 * 3')} is 12 before any gluing.</li>
</ul>

<h2>s += ... builds the whole right side first</h2>
<p>${c('+=')} is an assignment operator, so it happens <b>last</b>, after everything on the right is finished. The teacher's monster example:</p>
${demo(J`String s9 = "John Cena";
String s10 = "John Cena ";
s10 += "And his name is " + s9 + 4 + (5 + 6) + " Here comes " + s10 + 5 * 6;
System.out.println(s10);`, 'John Cena And his name is John Cena411 Here comes John Cena 30')}
<p>Order: ${c('(5 + 6)')} is 11, ${c('5 * 6')} is 30, then gluing left to right ("...John Cena" + 4 + 11 → "...John Cena411"), and only at the very end is the whole thing added onto the old s10.</p>

<h2>Escape sequences</h2>
<p>Inside a String literal, the backslash ${c('\\')} starts an <b>escape sequence</b>, a code for a character you can't type directly:</p>
${rule('\\n   \\"   \\\\', `${c('\\n')} is a new line. ${c('\\"')} is a quotation mark that doesn't end the String. ${c('\\\\')} is one actual backslash.`)}
${demo(J`System.out.println("Batman\nPrincess Leia\nIndiana Jones");
System.out.println("Bruce Wayne, AKA \"Batman,\" is not the hero Gotham needs.");
System.out.println("To do a new line, type \\n\nNow we have a new line");`, 'Batman\nPrincess Leia\nIndiana Jones\nBruce Wayne, AKA "Batman," is not the hero Gotham needs.\nTo do a new line, type \\n\nNow we have a new line')}
<p>In the last line, ${c('\\\\')} becomes one backslash, the ${c('n')} after it is just a letter, and the ${c('\\n')} after that is a real new line.</p>

<h2>toString is called for you</h2>
<p>When an object is printed or glued onto a String, Java automatically calls its ${c('toString()')} method and uses whatever String it returns:</p>
<div data-cs="tracer" data-id="ts"></div>
<p>If a class has <b>no</b> toString method, Java uses a default: the class name, an @, and a code number, something like ${c('Car@1b6d3586')} (the number varies).</p>
${demo(J`class Car {
  private int year;
  public Car(int y){ year = y; }
}
Car c = new Car(2020);
System.out.println(c);`, /^Car@[0-9a-f]+$/)}

${call('analogy', 'Analogy: a snowball rolling downhill', 'Concatenation picks up everything to its right once it starts. Numbers at the very front are still added like numbers, but the moment a String joins in, everything after it becomes text.')}
${call('mistake', 'Common mistakes', `<ul><li>Expecting ${c('"x" + 4 + 3')} to give "x7".</li><li>Calling ${c('s.substring(1);')} and expecting s to change.</li><li>Typing a plain ${c('"')} inside a String: it ends the String early (compile error). Use ${c('\\"')}.</li></ul>`)}
${call('ap', 'On the AP exam', 'Mixed + expressions are a favorite "what is printed" question. Go one operator at a time: parentheses, then * / %, then each + left to right, asking "is either side a String yet?"')}
${check('What does <code>System.out.print(1 + 2 + "3" + 4 + 5);</code> print?', ['"12345"', '"3345"', '"339"', '"15"'], 1, '1 + 2 is 3 (numbers). Then 3 + "3" is "33", then "334", then "3345".')}
${check('What does <code>System.out.print("a" + (1 + 2) * 2);</code> print?', ['a32', 'a6', 'a1 + 2 * 2', 'a12'], 1, 'Parentheses first: 3. Then * : 6. Then glue: "a6".')}
${check('<code>String s = "cat"; s.toUpperCase(); System.out.print(s);</code> — what prints? (toUpperCase returns an all-caps copy.)', ['CAT', 'cat', 'Cat', 'Compile error'], 1, 'Strings are immutable; the uppercase copy was made and thrown away. s still refers to "cat".')}
`;
    return K.mount(el, {
      lr: spec({ expr: '4 + 3 + " John Cena " + 4 + 3', expect: '"7 John Cena 43"', caption: 'Edit it: try "John Cena " + 4 * 3 or "John Cena " + (4 + 3).' }),
      ts: spec({ src: J`public class Pokemon {
  private String name;
  private int health;
  private int maxHealth;
  public Pokemon(String n, int h){
    name = n;
    health = h;
    maxHealth = h;
  }
  public String toString(){
    return name + " " + health + "/" + maxHealth;
  }
}

Pokemon p1 = new Pokemon("Squirtle", 20);
System.out.println(p1);
String str = "hello " + p1 + " world";
System.out.println(str);`, title: 'toString called automatically', expect: 'Squirtle 20/20\nhello Squirtle 20/20 world', caption: 'Step into each print and watch toString() get called without anyone writing p1.toString().' }),
    });
  });

  // =====================================================================
  // 1.20 Modular arithmetic design
  // =====================================================================
  function wheelSim(el) {
    const host = el.querySelector && el.querySelector('[data-sim="wheel"]');
    if (!host) return null;
    const P = window.PRKit;
    const cv = host.querySelector('canvas');
    const ro = host.querySelector('.sim-readout');
    const q = (k) => host.querySelector(`[data-k="${k}"]`);
    let n = 5, step = 3, start = 2, shown = 0, t = 0, playing = false;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const isPrime = (x) => { for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return x > 1; };
    const seqOf = () => { const s = [start]; for (let i = 1; i < n; i++) s.push((s[i - 1] + step) % n); return s; };
    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.32, cy = h / 2, R = Math.min(w * 0.26, h * 0.4);
      const pos = (k) => [cx + R * Math.sin((2 * Math.PI * k) / n), cy - R * Math.cos((2 * Math.PI * k) / n)];
      const s = seqOf();
      const upto = Math.min(shown, s.length - 1);
      for (let i = 0; i < upto; i++) {
        const [x1, y1] = pos(s[i]), [x2, y2] = pos(s[i + 1]);
        P.arrow(ctx, x1, y1, x1 + (x2 - x1) * 0.88, y1 + (y2 - y1) * 0.88, P.col('--accent'), 2, 9);
      }
      const visited = new Map();
      s.slice(0, upto + 1).forEach((v, i) => { if (!visited.has(v)) visited.set(v, i); });
      for (let k = 0; k < n; k++) {
        const [x, y] = pos(k);
        const hit = visited.has(k);
        ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fillStyle = hit ? P.col('--accent') : P.col('--surface'); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = k === s[upto] ? P.col('--warn') : P.col('--border'); ctx.stroke();
        P.text(ctx, String(k), x, y, { weight: 700, color: hit ? P.col('--accent-text') : P.col('--text') });
      }
      const tx = w * 0.64;
      P.text(ctx, 'counter = (counter + step) % ' + n, tx, 26, { align: 'left', weight: 700, size: 13 });
      s.slice(0, upto + 1).forEach((v, i) => {
        const line = i === 0 ? `start: ${v}` : `(${s[i - 1]} + ${step}) % ${n} = ${v}`;
        P.text(ctx, line, tx, 50 + i * 18, { align: 'left', size: 12, color: i === upto ? P.col('--warn') : P.col('--muted') });
      });
    }
    const st = P.stage(cv, 0.6, draw);
    function readout() {
      const s = seqOf();
      const all = gcd(step, n) === 1;
      ro.innerHTML = `<span>Sequence: <b class="mono">${s.join(', ')}</b></span><span>${all ? '<b class="good">every value exactly once</b>' : `<b class="bad">repeats</b> after ${n / gcd(step, n)} steps (step and ${n} share the factor ${gcd(step, n)})`}</span><span class="muted">${isPrime(n) ? `${n} is prime: any step that isn't a multiple of ${n} works` : `${n} is not prime`}</span>`;
    }
    function upd() {
      n = Number(q('n').value); q('nv').textContent = n;
      q('s').max = n; step = Math.min(Number(q('s').value), n); q('sv').textContent = step;
      q('c').max = n - 1; start = Math.min(Number(q('c').value), n - 1); q('cv').textContent = start;
      shown = n - 1; playing = false; readout(); st.request();
    }
    ['n', 's', 'c'].forEach((k) => { q(k).oninput = upd; });
    q('play').onclick = () => { shown = 0; t = 0; playing = true; st.request(); };
    const stop = P.loop((dt) => {
      if (!playing) return;
      t += dt;
      if (t > 0.6) { t = 0; shown++; st.draw(); if (shown >= n - 1) playing = false; }
    });
    upd();
    return () => { stop(); st.destroy(); };
  }

  lesson(20, 'cs1-modular', ['mod-cycle', 'mod-prime-step'], (el) => {
    el.innerHTML = `
<p class="lead">The remainder operator ${c('%')} is the secret behind anything that goes around in a circle: clocks, days of the week, turns in a game. The teacher used it to decide which sea monster attacks a ship next, so the encounters cycle in a different order each trip without ever skipping or repeating one.</p>

<h2>Wrapping around with %</h2>
<p>When you take any non-negative integer ${c('% 5')}, the only possible remainders are 0, 1, 2, 3 and 4. So if a counter keeps growing but you store it ${c('% 5')} every time, it can never leave that range: 4 + 1 becomes 5, and 5 % 5 is 0 again.</p>
${rule('counter = (counter + step) % n;', `moves the counter forward by ${c('step')} and wraps it into ${c('0')} … ${c('n − 1')}. The parentheses matter: add first, then take the remainder.`)}

<h2>The Thermal Sea encounters</h2>
<p>A ship crossing the Thermal Sea gets attacked 5 times. There are 5 possible battles (call them 0–4; battle 4 is the kraken). On the very first trip the counter starts at 0 with step 1, so they come in order 0, 1, 2, 3, 4 and the kraken is always last. On later trips the counter starts at a random 0–4 (${c('(int)(Math.random() * 5)')}) and the step is a random 1–4 (${c('(int)(Math.random() * 4) + 1')}). Here's a start of 2 and a step of 3:</p>
<div data-cs="tracer" data-id="ship"></div>
<p>2 → (2 + 3) % 5 = 0 → 3 → (3 + 3) % 5 = 1 → 4. All five battles, each exactly once.</p>

<h2>Why 5 battles and not 4 or 6?</h2>
<p>Because 5 is <b>prime</b>. With a prime number of slots, <i>any</i> step that isn't a multiple of 5 visits every slot exactly once before repeating. With 6 slots, a step of 2 only ever reaches 0, 2 and 4; a step of 3 only reaches two slots. Try it:</p>
<div class="sim" data-sim="wheel">
  <canvas></canvas>
  <div class="sim-controls">
    <label>slots n <input type="range" data-k="n" min="3" max="10" value="5"> <b data-k="nv"></b></label>
    <label>step <input type="range" data-k="s" min="1" max="5" value="3"> <b data-k="sv"></b></label>
    <label>start <input type="range" data-k="c" min="0" max="4" value="2"> <b data-k="cv"></b></label>
    <button class="btn small primary" data-k="play">Play ▸</button>
  </div>
  <div class="sim-readout"></div>
  <div class="sim-caption">Filled circles have been visited. Set n = 6 and step = 2 to see slots 1, 3 and 5 never get a turn. Set n = 7 (prime) and every step from 1 to 6 visits all seven.</div>
</div>
${call('idea', 'The rule', 'Stepping by s around n slots visits every slot exactly once when s and n share no common factor. When n is prime, that is true for every s that isn\'t a multiple of n.')}
${demo(J`int counter = 0;
counter = (counter + 2) % 6;
System.out.print(counter + " ");
counter = (counter + 2) % 6;
System.out.print(counter + " ");
counter = (counter + 2) % 6;
System.out.print(counter + " ");
counter = (counter + 2) % 6;
System.out.print(counter);`, '2 4 0 2')}

${call('analogy', 'Analogy: a clock', 'Add 5 hours to 10 o\'clock and you get 3 o\'clock, not 15. A clock is arithmetic % 12. Days of the week are % 7.')}
${call('mistake', 'Common mistakes', `<ul><li>${c('counter = counter + step % 5')}: % happens before +, so this only wraps the step, not the counter. Parenthesize: ${c('(counter + step) % 5')}.</li><li>Assuming any step visits every value. Only steps that share no factor with n do.</li></ul>`)}
${call('ap', 'On the AP exam', 'The % operator shows up constantly: even/odd tests (n % 2), last digits (n % 10), and wrap-around indexing ((i + 1) % length). Being fluent with "add, then mod" makes all of them easy.')}
${check('A counter starts at 3 and is updated by <code>counter = (counter + 4) % 5;</code> three times. What are the three new values?', ['2, 1, 0', '7, 11, 15', '2, 6, 10', '4, 3, 2'], 0, '(3 + 4) % 5 = 2, (2 + 4) % 5 = 1, (1 + 4) % 5 = 0.')}
${check('With 8 slots, which step visits every slot exactly once?', ['2', '4', '6', '3'], 3, '3 shares no factor with 8. Steps 2, 4 and 6 are all even, like 8, so they skip the odd slots.')}
`;
    return both(K.mount(el, { ship: spec({ src: J`public class Ship {
  private int counter;
  private int step;
  public Ship(int c, int s){
    counter = c;
    step = s;
  }
  public void encounter(){
    System.out.print(counter + " ");
    counter = (counter + step) % 5;
  }
}

Ship ship = new Ship(2, 3);
ship.encounter();
ship.encounter();
ship.encounter();
ship.encounter();
ship.encounter();`, title: 'Thermal Sea: start 2, step 3', expect: '2 0 3 1 4', caption: 'Edit the code: try new Ship(0, 1) for the first trip, or a step of 5 to see the same battle five times.' }) }), wheelSim(el));
  });
})();
