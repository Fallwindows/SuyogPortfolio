// JavaLite: a small interpreter for the slice of Java taught in AP CSA Unit 2.
// Used by the lessons (step-through tracers you can edit) and by the problem bank
// (every answer comes from actually running the code, so answers can't be wrong).
//
// Supported: int, double, long (from Math.round), boolean, String, Integer/Double boxes,
// Scanner input; if/else, while, for, break/continue, blocks; static methods with returns;
// Math (abs, sqrt, pow, min, max, random, round, PI, E), Integer.MAX_VALUE/MIN_VALUE,
// String length/substring/indexOf/equals/compareTo, System.out.print/println.
// Compile-time checks follow javac for this subset: types of conditions and operators,
// incomparable ==, lossy assignments, undeclared / out-of-scope / duplicate variables,
// variables that might not have been initialized, missing return, unreachable statements.
// Runtime errors: ArithmeticException, NullPointerException, StringIndexOutOfBounds,
// and a step limit for infinite loops.
//
// JavaLite.run(src, { trace, maxSteps, input, random }) ->
//   { output, error: null | { kind: 'compile'|'runtime', name, message, line }, trace, steps }
// No eval / new Function (the site's CSP forbids them).
window.JavaLite = (function () {
  'use strict';

  class JErr extends Error {
    constructor(kind, name, message, line) { super(message); this.kind = kind; this.jname = name; this.line = line; }
  }
  const cerr = (msg, line) => new JErr('compile', 'CompileError', msg, line);
  const rerr = (name, msg, line) => new JErr('runtime', name, msg, line);

  // ---------------- tokenizer ----------------
  const KEYWORDS = new Set(['int', 'double', 'boolean', 'long', 'void', 'if', 'else', 'while', 'for', 'return', 'true', 'false',
    'null', 'new', 'public', 'private', 'static', 'final', 'break', 'continue', 'class', 'this', 'import', 'throws']);
  const OPS = ['>>>=', '<<=', '>>=', '>>>', '++', '--', '+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '&&', '||',
    '+', '-', '*', '/', '%', '=', '<', '>', '!', '(', ')', '{', '}', ';', ',', '.', '?', ':', '[', ']'];

  function tokenize(src) {
    const out = [];
    let i = 0, line = 1;
    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') {
        i += 2;
        while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        i += 2; continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) {
        let j = i, dbl = false;
        while (/[0-9]/.test(src[j])) j++;
        if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { dbl = true; j++; while (/[0-9]/.test(src[j])) j++; }
        else if (src[j] === '.' && !/[a-zA-Z_]/.test(src[j + 1] || '')) { dbl = true; j++; }
        if (/[eE]/.test(src[j]) && /[-+0-9]/.test(src[j + 1] || '')) { dbl = true; j++; if (/[-+]/.test(src[j])) j++; while (/[0-9]/.test(src[j])) j++; }
        let text = src.slice(i, j);
        if (/[dD]/.test(src[j] || '')) { dbl = true; j++; } else if (/[lL]/.test(src[j] || '')) { j++; out.push({ t: 'num', v: Number(text), lng: true, line }); i = j; continue; }
        out.push({ t: 'num', v: Number(text), dbl, line });
        i = j; continue;
      }
      if (c === '"') {
        let j = i + 1, s = '';
        while (j < src.length && src[j] !== '"') {
          if (src[j] === '\\') { const e = src[j + 1]; s += e === 'n' ? '\n' : e === 't' ? '\t' : e; j += 2; }
          else { if (src[j] === '\n') throw cerr('unclosed string literal', line); s += src[j++]; }
        }
        if (j >= src.length) throw cerr('unclosed string literal', line);
        out.push({ t: 'str', v: s, line });
        i = j + 1; continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        let j = i;
        while (/[A-Za-z0-9_$]/.test(src[j] || '')) j++;
        const w = src.slice(i, j);
        out.push({ t: KEYWORDS.has(w) ? 'kw' : 'id', v: w, line });
        i = j; continue;
      }
      const op = OPS.find((o) => src.startsWith(o, i));
      if (!op) throw cerr(`illegal character: '${c}'`, line);
      out.push({ t: 'op', v: op, line });
      i += op.length;
    }
    out.push({ t: 'eof', v: '', line });
    return out;
  }

  // ---------------- parser ----------------
  const TYPES = new Set(['int', 'double', 'boolean', 'long', 'String', 'Integer', 'Double', 'Scanner', 'void']);

  function parse(src) {
    const tk = tokenize(src);
    // Class names are types too, so find them all before parsing.
    const classNames = new Set();
    for (let i = 0; i < tk.length - 1; i++) if (tk[i].v === 'class' && tk[i + 1].t === 'id') classNames.add(tk[i + 1].v);
    let p = 0;
    const peek = (o = 0) => tk[p + o];
    const at = (v, o = 0) => { const t = tk[p + o]; return (t.t === 'op' || t.t === 'kw' || t.t === 'id') && t.v === v; };
    const next = () => tk[p++];
    const expect = (v) => {
      if (!at(v)) { const t = peek(); throw cerr(`'${v}' expected${t.t === 'eof' ? ' (reached end of code)' : ` before '${t.v}'`}`, t.line); }
      return next();
    };
    const isTypeAt = (o = 0) => { const t = tk[p + o]; return (t.t === 'kw' || t.t === 'id') && (TYPES.has(t.v) || classNames.has(t.v)); };
    // `Type name` starts a declaration (as opposed to an expression like `x = 3`).
    const isDeclAt = () => isTypeAt() && tk[p + 1].t === 'id';

    // A program is any mix of: classes, static methods, and loose statements (run in order).
    // A class holding `main` (or only static methods) is the program class: its methods are global.
    function program() {
      const methods = Object.create(null), classes = Object.create(null), body = [];
      const addMethod = (table, m) => {
        const list = (table[m.name] = table[m.name] || []);
        const sig = m.params.map((x) => x.type).join(',');
        if (list.some((o) => o.params.map((x) => x.type).join(',') === sig)) throw cerr(`method ${m.name}(${sig}) is already defined`, m.line);
        list.push(m);
      };
      while (peek().t !== 'eof') {
        if (at('import')) { while (!at(';')) next(); next(); continue; }
        if ((at('public') && at('class', 1)) || at('class')) {
          const c = classDecl();
          const isMain = c.methods.main || (!c.fields.length && !c.ctors.length && Object.values(c.methods).every((l) => l.every((m) => m.isStatic)));
          if (isMain) Object.values(c.methods).forEach((l) => l.forEach((m) => addMethod(methods, m)));
          else { if (classes[c.name]) throw cerr(`duplicate class: ${c.name}`, c.line); classes[c.name] = c; }
          continue;
        }
        if (isMethodAt()) addMethod(methods, method());
        else body.push(statement());
      }
      prog.classes = classes;
      return Object.assign(prog, { methods, body });
    }
    const prog = {};
    function classDecl() {
      if (at('public')) next();
      expect('class');
      const nameTok = next();
      const c = { name: nameTok.v, fields: [], ctors: [], methods: Object.create(null), line: nameTok.line };
      expect('{');
      while (!at('}')) {
        if (peek().t === 'eof') throw cerr("reached end of file while parsing (missing '}')", peek().line);
        let o = 0;
        while (['public', 'private', 'static', 'final'].some((m) => at(m, o))) o++;
        if (at(c.name, o) && at('(', o + 1)) { // constructor
          const mods = mods_();
          const line = next().line;
          const params = paramList();
          c.ctors.push(Object.assign({ name: c.name, params, body: block(), line, isCtor: true }, mods));
        } else if (isMethodAt()) {
          const m = method();
          (c.methods[m.name] = c.methods[m.name] || []).push(m);
        } else {
          const mods = mods_();
          const d = decl();
          d.vars.forEach((v) => c.fields.push(Object.assign({ name: v.name, type: d.type, init: v.init, line: v.line }, mods)));
        }
      }
      next();
      return c;
    }
    function mods_() {
      const m = { isStatic: false, isPrivate: false, isFinal: false };
      for (;;) {
        if (at('public')) next();
        else if (at('private')) { next(); m.isPrivate = true; }
        else if (at('static')) { next(); m.isStatic = true; }
        else if (at('final')) { next(); m.isFinal = true; }
        else return m;
      }
    }
    function paramList() {
      expect('(');
      const params = [];
      if (at('String') && at('[', 1)) { next(); next(); expect(']'); params.push({ type: 'String[]', name: next().v }); }
      else while (!at(')')) {
        if (!isTypeAt()) throw cerr('<identifier> expected', peek().line);
        const type = next().v, name = next().v;
        params.push({ type, name });
        if (!at(')')) expect(',');
      }
      expect(')');
      if (at('throws')) { next(); next(); }
      return params;
    }
    function isMethodAt() {
      let o = 0;
      while (['public', 'private', 'static', 'final'].some((m) => at(m, o))) o++;
      return isTypeAt(o) && tk[p + o + 1].t === 'id' && at('(', o + 2);
    }
    function method() {
      const mods = mods_();
      const ret = next().v, nameTok = next();
      const params = paramList();
      return Object.assign({ name: nameTok.v, ret, params, body: block(), line: nameTok.line }, mods);
    }
    function block() {
      const line = expect('{').line;
      const body = [];
      while (!at('}')) {
        if (peek().t === 'eof') throw cerr("reached end of file while parsing (missing '}')", peek().line);
        body.push(statement());
      }
      next();
      return { k: 'block', body, line };
    }
    function decl(noSemi) {
      const typeTok = next(), type = typeTok.v;
      const vars = [];
      do {
        const nm = next();
        if (nm.t !== 'id') throw cerr('<identifier> expected', nm.line);
        let init = null;
        if (at('=')) { next(); init = expr(); }
        vars.push({ name: nm.v, init, line: nm.line });
      } while (at(',') && next());
      if (!noSemi) expect(';');
      return { k: 'decl', type, vars, line: typeTok.line };
    }
    function statement() {
      const t = peek();
      if (at('{')) return block();
      if (at(';')) { next(); return { k: 'empty', line: t.line }; }
      if (at('final')) { next(); const d = decl(); d.isFinal = true; return d; }
      if (isDeclAt()) return decl();
      if (at('if')) {
        next(); expect('('); const cond = expr(); expect(')');
        const then = statement();
        let els = null;
        if (at('else')) { next(); els = statement(); }
        return { k: 'if', cond, then, els, line: t.line };
      }
      if (at('else')) throw cerr("'else' without 'if'", t.line);
      if (at('while')) { next(); expect('('); const cond = expr(); expect(')'); return { k: 'while', cond, body: statement(), line: t.line }; }
      if (at('for')) {
        next(); expect('(');
        let init = [];
        if (!at(';')) { if (isDeclAt()) init = [decl(true)]; else { init.push({ k: 'expr', e: expr(), line: t.line }); while (at(',')) { next(); init.push({ k: 'expr', e: expr(), line: t.line }); } } }
        expect(';');
        const cond = at(';') ? null : expr();
        expect(';');
        const upd = [];
        if (!at(')')) { upd.push(expr()); while (at(',')) { next(); upd.push(expr()); } }
        expect(')');
        return { k: 'for', init, cond, upd, body: statement(), line: t.line };
      }
      if (at('return')) { next(); const e = at(';') ? null : expr(); expect(';'); return { k: 'return', e, line: t.line }; }
      if (at('break')) { next(); expect(';'); return { k: 'break', line: t.line }; }
      if (at('continue')) { next(); expect(';'); return { k: 'continue', line: t.line }; }
      const e = expr();
      if (!['assign', 'pre', 'post', 'call', 'mcall', 'print', 'scall', 'new'].includes(e.k)) throw cerr('not a statement', t.line);
      expect(';');
      return { k: 'expr', e, line: t.line };
    }

    // precedence climbing
    const BIN = [['||'], ['&&'], ['==', '!='], ['<', '>', '<=', '>='], ['+', '-'], ['*', '/', '%']];
    function expr() { return assign(); }
    function assign() {
      const left = ternary();
      if (peek().t === 'op' && ['=', '+=', '-=', '*=', '/=', '%='].includes(peek().v)) {
        const op = next();
        if (left.k === 'field') return { k: 'assign', op: op.v, field: left, e: assign(), line: op.line };
        if (left.k !== 'var') throw cerr('unexpected type: required variable, found value', op.line);
        return { k: 'assign', op: op.v, target: left.name, e: assign(), line: op.line };
      }
      return left;
    }
    function ternary() {
      const c = bin(0);
      if (at('?')) { const q = next(); const a = assign(); expect(':'); const b = assign(); return { k: 'tern', c, a, b, line: q.line }; }
      return c;
    }
    function bin(lvl) {
      if (lvl === BIN.length) return unary();
      let l = bin(lvl + 1);
      while (peek().t === 'op' && BIN[lvl].includes(peek().v)) {
        const op = next();
        l = { k: 'bin', op: op.v, l, r: bin(lvl + 1), line: op.line };
      }
      return l;
    }
    function unary() {
      const t = peek();
      if (t.t === 'op' && (t.v === '!' || t.v === '-' || t.v === '+')) { next(); return { k: 'un', op: t.v, e: unary(), line: t.line }; }
      if (t.t === 'op' && (t.v === '++' || t.v === '--')) {
        next(); const e = unary();
        if (e.k !== 'var') throw cerr('unexpected type: required variable, found value', t.line);
        return { k: 'pre', op: t.v, target: e.name, line: t.line };
      }
      // cast: (int) x, (double) x
      if (at('(') && (at('int', 1) || at('double', 1) || at('long', 1)) && at(')', 2)) {
        next(); const to = next().v; next();
        return { k: 'cast', to, e: unary(), line: t.line };
      }
      return postfix();
    }
    function postfix() {
      let e = primary();
      for (;;) {
        if (at('.')) {
          next();
          const nm = next();
          if (at('(')) { e = { k: 'mcall', obj: e, name: nm.v, args: args(), line: nm.line }; }
          else e = { k: 'field', obj: e, name: nm.v, line: nm.line };
        } else if (peek().t === 'op' && (peek().v === '++' || peek().v === '--')) {
          const op = next();
          if (e.k !== 'var') throw cerr('unexpected type: required variable, found value', op.line);
          e = { k: 'post', op: op.v, target: e.name, line: op.line };
        } else return e;
      }
    }
    function args() {
      expect('(');
      const a = [];
      while (!at(')')) { a.push(expr()); if (!at(')')) expect(','); }
      expect(')');
      return a;
    }
    function primary() {
      const t = next();
      if (t.t === 'num') {
        if (t.lng) return { k: 'lit', t: 'long', v: t.v, line: t.line };
        if (!t.dbl && Math.abs(t.v) > 2147483648) throw cerr('integer number too large', t.line);
        return { k: 'lit', t: t.dbl ? 'double' : 'int', v: t.v, line: t.line };
      }
      if (t.t === 'str') return { k: 'lit', t: 'String', v: t.v, line: t.line };
      if (t.v === 'true' || t.v === 'false') return { k: 'lit', t: 'boolean', v: t.v === 'true', line: t.line };
      if (t.v === 'null') return { k: 'lit', t: 'null', v: null, line: t.line };
      if (t.v === 'this') return { k: 'this', line: t.line };
      if (t.v === '(') { const e = expr(); expect(')'); return { k: 'paren', e, line: t.line }; }
      if (t.v === 'new') {
        const cls = next();
        return { k: 'new', cls: cls.v, args: args(), line: t.line };
      }
      if (t.t === 'id') {
        if (t.v === 'System' && at('.') && at('in', 1)) { next(); next(); return { k: 'lit', t: 'InputStream', v: null, line: t.line }; }
        if (t.v === 'System' && at('.') && at('out', 1)) {
          next(); next(); expect('.');
          const m = next().v;
          if (m !== 'print' && m !== 'println') throw cerr('cannot find symbol: System.out.' + m, t.line);
          return { k: 'print', ln: m === 'println', args: args(), line: t.line };
        }
        if ((t.v === 'Math' || t.v === 'Integer' || t.v === 'Double' || classNames.has(t.v)) && at('.')) {
          next(); const nm = next();
          if (at('(')) return { k: 'scall', cls: t.v, name: nm.v, args: args(), line: t.line };
          return { k: 'sfield', cls: t.v, name: nm.v, line: t.line };
        }
        if (at('(')) return { k: 'call', name: t.v, args: args(), line: t.line };
        return { k: 'var', name: t.v, line: t.line };
      }
      throw cerr(t.t === 'eof' ? 'reached end of file while parsing' : `illegal start of expression: '${t.v}'`, t.line);
    }
    return program();
  }

  // ---------------- static checking ----------------
  const NUM = new Set(['int', 'double', 'long']);
  const unbox = (t) => (t === 'Integer' ? 'int' : t === 'Double' ? 'double' : t);
  const isNum = (t) => NUM.has(unbox(t));
  const isRef = (t) => !['int', 'double', 'long', 'boolean'].includes(t);
  const wider = (a, b) => (a === 'double' || b === 'double' ? 'double' : a === 'long' || b === 'long' ? 'long' : 'int');
  // Can a value of type `from` be assigned to a variable of type `to`?
  function assignable(to, from) {
    if (to === from) return true;
    if (from === 'null') return isRef(to);
    if (to === 'double') return ['int', 'long', 'Integer', 'Double'].includes(from);
    if (to === 'long') return ['int', 'Integer'].includes(from);
    if (to === 'int') return from === 'Integer';
    if (to === 'Integer') return from === 'int';
    if (to === 'Double') return from === 'double';
    return false;
  }
  function lossy(to, from) { return (to === 'int' && (from === 'double' || from === 'long' || from === 'Double')) || (to === 'long' && from === 'double'); }

  function check(prog) {
    const classes = prog.classes || {};
    let curMethod = null, curClass = null; // curClass: class whose instance/static method we are inside
    // scope: array of Map(name -> {type, assigned, final})
    let scopes = [];
    const fieldOf = (cls, n) => cls && cls.fields.find((f) => f.name === n);
    const lookup = (n) => {
      for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].has(n)) return scopes[i].get(n);
      const f = fieldOf(curClass, n);
      if (f) {
        if (!f.isStatic && curMethod && curMethod.isStatic) throw cerr(`non-static variable ${n} cannot be referenced from a static context`, curMethod.line);
        return { type: f.type, assigned: true, final: f.isFinal, field: f };
      }
      return null;
    };
    const declare = (n, type, line, assigned, final) => {
      for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].has(n)) throw cerr(`variable ${n} is already defined`, line);
      scopes[scopes.length - 1].set(n, { type, assigned, final });
    };
    // definite assignment: we track the set of names assigned; branches intersect.
    const snapshot = () => scopes.map((s) => new Map([...s].map(([k, v]) => [k, v.assigned])));
    const restore = (snap) => scopes.forEach((s, i) => { if (snap[i]) for (const [k, a] of snap[i]) if (s.has(k)) s.get(k).assigned = a; });
    const intersect = (a, b) => a.map((m, i) => new Map([...m].map(([k, v]) => [k, v && b[i] && b[i].get(k)])));
    const ALL = 'all'; // marker for "this path cannot complete" (everything counts as assigned)
    const isClass = (t) => !!classes[t];
    const known = (t, line) => { if (!TYPES.has(t) && !isClass(t) && t !== 'String[]') throw cerr(`cannot find symbol: class ${t}`, line); };

    // Overload resolution: exact parameter types first, then anything assignable.
    function resolve(list, argTypes, line, what) {
      const fits = (m, exact) => m.params.length === argTypes.length && m.params.every((pr, i) => (exact ? pr.type === argTypes[i] : assignable(pr.type, argTypes[i])));
      const m = (list || []).find((x) => fits(x, true)) || (list || []).find((x) => fits(x, false));
      if (!m) throw cerr(list && list.length ? `${what} cannot be applied to given types (${argTypes.join(', ') || 'no arguments'})` : `cannot find symbol: ${what}`, line);
      return m;
    }
    function assignCheck(to, from, line) {
      if (from === 'void') throw cerr(`incompatible types: void cannot be converted to ${to}`, line);
      if (!assignable(to, from)) throw cerr(lossy(to, from) ? `incompatible types: possible lossy conversion from ${from} to ${to}` : `incompatible types: ${from} cannot be converted to ${to}`, line);
    }

    function type(e) {
      switch (e.k) {
        case 'lit': return e.t;
        case 'paren': return type(e.e);
        case 'this':
          if (!curClass || (curMethod && curMethod.isStatic)) throw cerr('non-static variable this cannot be referenced from a static context', e.line);
          return curClass.name;
        case 'var': {
          const v = lookup(e.name);
          if (!v) throw cerr(`cannot find symbol: variable ${e.name}`, e.line);
          if (!v.assigned) throw cerr(`variable ${e.name} might not have been initialized`, e.line);
          return v.type;
        }
        case 'field': {
          const ot = type(e.obj);
          const c = classes[ot];
          const f = fieldOf(c, e.name);
          if (!f) throw cerr(isRef(ot) ? `cannot find symbol: variable ${e.name}` : `${ot} cannot be dereferenced`, e.line);
          if (f.isPrivate && curClass !== c) throw cerr(`${e.name} has private access in ${ot}`, e.line);
          return f.type;
        }
        case 'assign': {
          let v;
          if (e.field) { const t = type(e.field); const f = fieldOf(classes[type(e.field.obj)], e.field.name); v = { type: t, assigned: true, final: f.isFinal, field: f }; }
          else { v = lookup(e.target); if (!v) throw cerr(`cannot find symbol: variable ${e.target}`, e.line); }
          const name = e.field ? e.field.name : e.target;
          // a final field may be set once, in a constructor
          if (v.final && (v.field ? !(curMethod && curMethod.isCtor) : v.assigned)) throw cerr(`cannot assign a value to final variable ${name}`, e.line);
          const rt = type(e.e);
          if (e.op === '=') { assignCheck(v.type, rt, e.line); v.assigned = true; }
          else {
            if (!v.assigned) throw cerr(`variable ${name} might not have been initialized`, e.line);
            if (e.op === '+=' && v.type === 'String') return 'String';
            if (!isNum(v.type) || !isNum(rt)) throw cerr(`bad operand types for binary operator '${e.op[0]}'`, e.line);
          }
          return v.type;
        }
        case 'pre': case 'post': {
          const v = lookup(e.target);
          if (!v) throw cerr(`cannot find symbol: variable ${e.target}`, e.line);
          if (!v.assigned) throw cerr(`variable ${e.target} might not have been initialized`, e.line);
          if (v.final) throw cerr(`cannot assign a value to final variable ${e.target}`, e.line);
          if (!isNum(v.type)) throw cerr(`bad operand type ${v.type} for unary operator '${e.op}'`, e.line);
          return v.type;
        }
        case 'un': {
          const t = type(e.e);
          if (e.op === '!') { if (t !== 'boolean') throw cerr(`bad operand type ${t} for unary operator '!'`, e.line); return 'boolean'; }
          if (!isNum(t)) throw cerr(`bad operand type ${t} for unary operator '${e.op}'`, e.line);
          return unbox(t);
        }
        case 'cast': {
          const t = type(e.e);
          if (!isNum(t)) throw cerr(`incompatible types: ${t} cannot be converted to ${e.to}`, e.line);
          return e.to;
        }
        case 'tern': {
          if (type(e.c) !== 'boolean') throw cerr('incompatible types: condition must be boolean', e.line);
          const a = type(e.a), b = type(e.b);
          if (a === b) return a;
          if (isNum(a) && isNum(b)) return wider(unbox(a), unbox(b));
          return isRef(a) && isRef(b) ? 'String' : a;
        }
        case 'bin': {
          const a = type(e.l), b = type(e.r), op = e.op;
          if (a === 'void' || b === 'void') throw cerr("'void' type not allowed here", e.line);
          if (op === '&&' || op === '||') {
            if (a !== 'boolean' || b !== 'boolean') throw cerr(`bad operand types for binary operator '${op}'`, e.line);
            return 'boolean';
          }
          if (op === '+' && (a === 'String' || b === 'String')) return 'String';
          if (['-', '*', '/', '%', '+'].includes(op)) {
            if (!isNum(a) || !isNum(b)) throw cerr(`bad operand types for binary operator '${op}'`, e.line);
            return wider(unbox(a), unbox(b));
          }
          if (['<', '>', '<=', '>='].includes(op)) {
            if (!isNum(a) || !isNum(b)) throw cerr(`bad operand types for binary operator '${op}'`, e.line);
            return 'boolean';
          }
          // == and !=
          if (a === 'boolean' && b === 'boolean') return 'boolean';
          if (isNum(a) && isNum(b) && !(isRef(a) && isRef(b))) return 'boolean'; // at least one primitive: unbox
          if (isRef(a) && isRef(b)) {
            if (a === 'null' || b === 'null' || a === b) return 'boolean';
            throw cerr(`incomparable types: ${a} and ${b}`, e.line);
          }
          throw cerr(`bad operand types for binary operator '${op}'`, e.line);
        }
        case 'print': {
          if (e.args.length > 1) throw cerr('no suitable method found for print' + (e.ln ? 'ln' : '') + ` (${e.args.length} arguments)`, e.line);
          if (!e.ln && !e.args.length) throw cerr('no suitable method found for print(no arguments)', e.line);
          if (e.args.length && type(e.args[0]) === 'void') throw cerr("'void' type not allowed here", e.line);
          return 'void';
        }
        case 'new': {
          const at = e.args.map(type);
          if (isClass(e.cls)) {
            const c = classes[e.cls];
            if (!c.ctors.length) { if (at.length) throw cerr(`constructor ${e.cls} in class ${e.cls} cannot be applied to given types`, e.line); e.ctor = null; }
            else e.ctor = resolve(c.ctors, at, e.line, `constructor ${e.cls}`);
            return e.cls;
          }
          if (e.cls === 'Integer') { if (at.length !== 1 || (!assignable('int', at[0]) && at[0] !== 'String')) throw cerr('no suitable constructor found for Integer', e.line); return 'Integer'; }
          if (e.cls === 'Double') { if (at.length !== 1 || !isNum(at[0])) throw cerr('no suitable constructor found for Double', e.line); return 'Double'; }
          if (e.cls === 'Scanner') return 'Scanner';
          if (e.cls === 'String') return 'String';
          throw cerr(`cannot find symbol: class ${e.cls}`, e.line);
        }
        case 'sfield': {
          if (isClass(e.cls)) {
            const f = fieldOf(classes[e.cls], e.name);
            if (!f) throw cerr(`cannot find symbol: variable ${e.name} in class ${e.cls}`, e.line);
            if (!f.isStatic) throw cerr(`non-static variable ${e.name} cannot be referenced from a static context`, e.line);
            if (f.isPrivate && curClass !== classes[e.cls]) throw cerr(`${e.name} has private access in ${e.cls}`, e.line);
            return f.type;
          }
          if (e.cls === 'Math' && (e.name === 'PI' || e.name === 'E')) return 'double';
          if (e.cls === 'Integer' && (e.name === 'MAX_VALUE' || e.name === 'MIN_VALUE')) return 'int';
          if (e.cls === 'Double' && (e.name === 'MAX_VALUE' || e.name === 'MIN_VALUE')) return 'double';
          throw cerr(`cannot find symbol: ${e.cls}.${e.name}`, e.line);
        }
        case 'scall': {
          const at = e.args.map(type);
          if (isClass(e.cls)) {
            const c = classes[e.cls];
            if (!c.methods[e.name]) throw cerr(`cannot find symbol: method ${e.name} in class ${e.cls}`, e.line);
            const m = resolve(c.methods[e.name], at, e.line, `method ${e.name} in class ${e.cls}`);
            if (!m.isStatic) throw cerr(`non-static method ${e.name} cannot be referenced from a static context`, e.line);
            if (m.isPrivate && curClass !== c) throw cerr(`${e.name} has private access in ${e.cls}`, e.line);
            e.res = m;
            return m.ret;
          }
          const need = (n) => { if (at.length !== n) throw cerr(`method ${e.cls}.${e.name} cannot be applied to given types`, e.line); };
          const nums = () => at.forEach((t) => { if (!isNum(t)) throw cerr(`incompatible types: ${t} cannot be converted to double`, e.line); });
          if (e.cls === 'Math') {
            switch (e.name) {
              case 'random': need(0); return 'double';
              case 'abs': need(1); nums(); return unbox(at[0]);
              case 'round': need(1); nums(); return 'long';
              case 'sqrt': case 'floor': case 'ceil': case 'log': case 'log10': case 'sin': case 'cos': case 'tan':
              case 'asin': case 'acos': case 'atan': case 'cbrt': case 'exp': need(1); nums(); return 'double';
              case 'pow': need(2); nums(); return 'double';
              case 'min': case 'max': need(2); nums(); return wider(unbox(at[0]), unbox(at[1]));
            }
          }
          if (e.cls === 'Integer' && e.name === 'parseInt') { need(1); return 'int'; }
          if (e.cls === 'Double' && e.name === 'parseDouble') { need(1); return 'double'; }
          throw cerr(`cannot find symbol: method ${e.cls}.${e.name}`, e.line);
        }
        case 'mcall': {
          const ot = type(e.obj);
          const at = e.args.map(type);
          const bad = () => { throw cerr(`method ${e.name} in class ${ot} cannot be applied to given types`, e.line); };
          if (isClass(ot)) {
            const c = classes[ot];
            if (!c.methods[e.name]) throw cerr(`cannot find symbol: method ${e.name} in class ${ot}`, e.line);
            const m = resolve(c.methods[e.name], at, e.line, `method ${e.name} in class ${ot}`);
            if (m.isPrivate && curClass !== c) throw cerr(`${e.name}(${m.params.map((x) => x.type).join(',')}) has private access in ${ot}`, e.line);
            e.res = m;
            return m.ret;
          }
          if (ot === 'String') {
            switch (e.name) {
              case 'length': if (at.length) bad(); return 'int';
              case 'substring': if (at.length < 1 || at.length > 2 || at.some((t) => unbox(t) !== 'int')) bad(); return 'String';
              case 'indexOf': if (at.length < 1 || at.length > 2 || at[0] !== 'String' || (at[1] && unbox(at[1]) !== 'int')) bad(); return 'int';
              case 'equals': if (at.length !== 1) bad(); return 'boolean';
              case 'compareTo': if (at.length !== 1 || at[0] !== 'String') bad(); return 'int';
              case 'contains': if (at.length !== 1 || at[0] !== 'String') bad(); return 'boolean';
              case 'toString': return 'String';
            }
          }
          if (ot === 'Integer' || ot === 'Double') {
            if (e.name === 'intValue') return 'int';
            if (e.name === 'doubleValue') return 'double';
            if (e.name === 'equals') return 'boolean';
            if (e.name === 'compareTo') return 'int';
            if (e.name === 'toString') return 'String';
          }
          if (ot === 'Scanner') {
            if (e.name === 'nextInt') return 'int';
            if (e.name === 'nextDouble') return 'double';
            if (e.name === 'nextBoolean' || e.name === 'hasNext') return 'boolean';
            if (e.name === 'nextLine' || e.name === 'next') return 'String';
          }
          if (!isRef(ot)) throw cerr(`${ot} cannot be dereferenced`, e.line);
          throw cerr(`cannot find symbol: method ${e.name}`, e.line);
        }
        case 'call': {
          const at = e.args.map(type);
          const inClass = curClass && curClass.methods[e.name];
          const m = resolve(inClass ? curClass.methods[e.name] : prog.methods[e.name], at, e.line, `method ${e.name}`);
          if (inClass && !m.isStatic && curMethod && curMethod.isStatic) throw cerr(`non-static method ${e.name} cannot be referenced from a static context`, e.line);
          e.res = m;
          return m.ret;
        }
      }
      throw cerr('illegal expression', e.line);
    }

    const isTrue = (e) => e && ((e.k === 'lit' && e.v === true) || (e.k === 'paren' && isTrue(e.e)));

    // Returns true if the statement can complete normally (JLS 14.22, simplified).
    function stmt(s, inLoop) {
      switch (s.k) {
        case 'empty': return true;
        case 'block': {
          scopes.push(new Map());
          let can = true;
          for (const x of s.body) {
            if (!can) throw cerr('unreachable statement', x.line);
            can = stmt(x, inLoop);
          }
          scopes.pop();
          return can;
        }
        case 'decl':
          if (s.type === 'void') throw cerr("illegal start of expression: 'void'", s.line);
          known(s.type, s.line);
          for (const v of s.vars) {
            if (v.init) assignCheck(s.type, type(v.init), v.line);
            declare(v.name, s.type, v.line, !!v.init, !!s.isFinal);
          }
          return true;
        case 'expr': type(s.e); return true;
        case 'if': {
          const ct = type(s.cond);
          if (ct !== 'boolean') throw cerr(`incompatible types: ${ct} cannot be converted to boolean`, s.line);
          if (s.then.k === 'decl') throw cerr('variable declaration not allowed here', s.then.line);
          const before = snapshot();
          const c1 = stmt(s.then, inLoop);
          const afterThen = c1 ? snapshot() : ALL;
          restore(before);
          let c2 = true, afterElse = before;
          if (s.els) { c2 = stmt(s.els, inLoop); afterElse = c2 ? snapshot() : ALL; }
          const merged = afterThen === ALL ? afterElse : afterElse === ALL ? afterThen : intersect(afterThen, afterElse);
          if (merged !== ALL) restore(merged);
          return c1 || c2;
        }
        case 'while': case 'for': {
          if (s.k === 'for') scopes.push(new Map());
          if (s.k === 'for') s.init.forEach((x) => stmt(x, inLoop));
          const cond = s.cond;
          if (cond) { const ct = type(cond); if (ct !== 'boolean') throw cerr(`incompatible types: ${ct} cannot be converted to boolean`, s.line); }
          const before = snapshot();
          const loopInfo = { brk: false };
          stmt(s.body, loopInfo);
          if (s.k === 'for') s.upd.forEach((u) => type(u));
          restore(before); // assignments inside the body don't count after the loop
          if (s.k === 'for') scopes.pop();
          const infinite = !cond || isTrue(cond);
          return !infinite || loopInfo.brk;
        }
        case 'break':
          if (!inLoop) throw cerr('break outside switch or loop', s.line);
          inLoop.brk = true; return false;
        case 'continue':
          if (!inLoop) throw cerr('continue outside of loop', s.line);
          return false;
        case 'return': {
          if (!curMethod || curMethod.isCtor || curMethod.ret === 'void') { if (s.e) throw cerr('incompatible types: unexpected return value', s.line); return false; }
          if (!s.e) throw cerr('missing return value', s.line);
          assignCheck(curMethod.ret, type(s.e), s.line);
          return false;
        }
      }
      return true;
    }

    function checkMethod(m, cls) {
      curMethod = m; curClass = cls;
      if (!m.isCtor) known(m.ret, m.line);
      scopes = [new Map()];
      m.params.forEach((pr) => { known(pr.type, m.line); declare(pr.name, pr.type, m.line, true); });
      const can = stmt(m.body, null);
      if (can && !m.isCtor && m.ret !== 'void') throw cerr('missing return statement', lastLine(m.body));
    }
    for (const c of Object.values(classes)) {
      c.fields.forEach((f) => { known(f.type, f.line); if (f.init) { curClass = c; curMethod = null; scopes = [new Map()]; assignCheck(f.type, type(f.init), f.line); } });
      c.ctors.forEach((k) => checkMethod(k, c));
      Object.values(c.methods).forEach((l) => l.forEach((m) => checkMethod(m, c)));
    }
    Object.values(prog.methods).forEach((l) => l.forEach((m) => checkMethod(m, null)));
    curMethod = null; curClass = null;
    scopes = [new Map()];
    prog.body.forEach((s) => stmt(s, null));
  }
  function lastLine(b) { let l = b.line; (function walk(s) { if (s && s.line > l) l = s.line; if (s && s.body && Array.isArray(s.body)) s.body.forEach(walk); })(b); return l + 1; }

  // ---------------- formatting (Java's toString) ----------------
  function fmtDouble(x) {
    if (Number.isNaN(x)) return 'NaN';
    if (x === Infinity) return 'Infinity';
    if (x === -Infinity) return '-Infinity';
    if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
    const ax = Math.abs(x);
    if (ax >= 1e-3 && ax < 1e7) {
      const s = String(x);
      return s.includes('.') || s.includes('e') ? s : s + '.0';
    }
    let [m, e] = x.toExponential().split('e');
    if (!m.includes('.')) m += '.0';
    return m + 'E' + (e[0] === '+' ? e.slice(1) : e);
  }
  let objToString = null; // set by run(): calls a class's toString(), or Java's default Name@hash
  function str(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'object' && v.obj) return objToString(v);
    if (typeof v === 'object' && v.box) return v.t === 'Double' ? fmtDouble(v.v) : String(v.v);
    if (typeof v === 'object' && v.scanner) return 'java.util.Scanner';
    if (typeof v === 'object' && v.d) return fmtDouble(v.v); // tagged double
    return String(v);
  }

  // ---------------- execution ----------------
  // Values: int/long are JS numbers tagged by static type at the use site; doubles are wrapped
  // { d: true, v } so 5 and 5.0 print differently; booleans/strings are JS values; boxes are
  // { box: true, t, v } objects compared by identity.
  const D = (v) => ({ d: true, v });
  const num = (v) => (v && typeof v === 'object' ? v.v : v); // unwrap double or box
  const isD = (v) => v && typeof v === 'object' && (v.d || (v.box && v.t === 'Double'));
  const int32 = (x) => x | 0;
  const boxCache = new Map();
  function boxInt(v, fresh) {
    if (!fresh && v >= -128 && v <= 127) { if (!boxCache.has(v)) boxCache.set(v, { box: true, t: 'Integer', v }); return boxCache.get(v); }
    return { box: true, t: 'Integer', v };
  }

  class Flow { constructor(kind, value) { this.kind = kind; this.value = value; } }

  function run(src, opts = {}) {
    const maxSteps = opts.maxSteps || 50000;
    const input = (opts.input || []).slice();
    const rand = opts.random || Math.random;
    let output = '', steps = 0;
    const trace = opts.trace ? [] : null;
    let prog;
    try { prog = parse(src); check(prog); }
    catch (e) {
      if (e instanceof JErr) return { output: '', error: { kind: e.kind, name: e.jname, message: e.message, line: e.line }, trace: trace || [], steps: 0 };
      throw e;
    }
    boxCache.clear();
    const classes = prog.classes || {};

    // A frame is a list of block scopes; frame.self is `this` inside instance methods/constructors.
    let frames = [];
    const scope = () => frames[frames.length - 1];
    const statics = {}; // class name -> Map of static field slots
    let objCount = 0;
    function find(n) {
      const f = scope();
      for (let i = f.length - 1; i >= 0; i--) if (f[i].has(n)) return f[i].get(n);
      if (f.self && f.self.fields.has(n)) return f.self.fields.get(n);
      if (f.cls && statics[f.cls] && statics[f.cls].has(n)) return statics[f.cls].get(n);
      return null;
    }
    function snap() {
      const out = [];
      const f = scope();
      if (f.self) for (const [k, v] of f.self.fields) out.push(['this.' + k, v.type, str(v.v)]);
      for (const s of f) for (const [k, v] of s) out.push([k, v.type, v.set ? str(v.v) : '—']);
      return out;
    }
    const defaultOf = (t) => (t === 'int' || t === 'long' ? 0 : t === 'double' ? D(0) : t === 'boolean' ? false : null);
    objToString = (o) => {
      const m = classes[o.cls].methods.toString && classes[o.cls].methods.toString.find((x) => !x.params.length);
      if (m) return str(callMethod(m, [], m.line, o));
      return `${o.cls}@${(0x1b6d3586 + o.id * 0x2f1).toString(16)}`;
    };
    function event(line, extra) {
      if (++steps > maxSteps) throw rerr('InfiniteLoop', `the program ran more than ${maxSteps} steps, so it is almost certainly an infinite loop`, line);
      if (trace) trace.push(Object.assign({ line, vars: snap(), out: output, depth: frames.length }, extra || {}));
    }

    // convert a value to the variable's declared type
    function coerce(type, v) {
      switch (type) {
        case 'int': return int32(Math.trunc(num(v)));
        case 'long': return Math.trunc(num(v));
        case 'double': return D(num(v));
        case 'Integer': return v && v.box ? v : boxInt(num(v));
        case 'Double': return v && v.box ? v : { box: true, t: 'Double', v: num(v) };
        default: return v;
      }
    }
    // static type of an expression at run time (re-derived cheaply from the value)
    function castInt(x) {
      if (Number.isNaN(x)) return 0;
      if (x >= 2147483647) return 2147483647;
      if (x <= -2147483648) return -2147483648;
      return Math.trunc(x);
    }

    function ev(e) {
      switch (e.k) {
        case 'lit': return e.t === 'double' ? D(e.v) : e.v;
        case 'paren': return ev(e.e);
        case 'var': return find(e.name).v;
        case 'this': return scope().self;
        case 'field': {
          const o = ev(e.obj);
          if (o === null) throw rerr('NullPointerException', `cannot read field "${e.name}" because the reference is null`, e.line);
          return fieldSlot(o, e.name).v;
        }
        case 'assign': {
          let slot;
          if (e.field) {
            const o = ev(e.field.obj);
            if (o === null) throw rerr('NullPointerException', `cannot assign field "${e.field.name}" because the reference is null`, e.line);
            slot = fieldSlot(o, e.field.name);
          } else slot = find(e.target);
          let v = ev(e.e);
          if (e.op === '+=' && slot.type === 'String') v = str(slot.v) + str(v);
          else if (e.op !== '=') v = arith(e.op[0], slot.v, v, e.line, slot.type);
          slot.v = coerce(slot.type, v); slot.set = true;
          return slot.v;
        }
        case 'pre': case 'post': {
          const slot = find(e.target);
          const old = slot.v;
          slot.v = coerce(slot.type, arith(e.op[0], old, 1, e.line, slot.type));
          return e.k === 'pre' ? slot.v : old;
        }
        case 'un': {
          const v = ev(e.e);
          if (e.op === '!') return !v;
          if (e.op === '-') return isD(v) ? D(-num(v)) : int32(-num(v));
          return v && v.box ? (v.t === 'Double' ? D(v.v) : v.v) : v;
        }
        case 'cast': {
          const v = num(ev(e.e));
          return e.to === 'double' ? D(v) : e.to === 'long' ? Math.trunc(v) : castInt(v);
        }
        case 'tern': return ev(e.c) ? ev(e.a) : ev(e.b);
        case 'bin': {
          if (e.op === '&&') return ev(e.l) ? !!ev(e.r) : false; // short circuit
          if (e.op === '||') return ev(e.l) ? true : !!ev(e.r);
          const a = ev(e.l), b = ev(e.r);
          if (e.op === '==' || e.op === '!=') {
            let eq;
            const ab = a && typeof a === 'object' && a.box, bb = b && typeof b === 'object' && b.box;
            if (ab && bb) eq = a === b; // identity
            else if (typeof a === 'boolean' || typeof b === 'boolean') eq = a === b;
            else if (typeof a === 'string' || typeof b === 'string' || a === null || b === null) eq = a === b; // identity (string literals are interned)
            else if ((a && a.obj) || (b && b.obj) || (a && a.scanner)) eq = a === b; // object identity
            else eq = num(a) === num(b);
            return e.op === '==' ? eq : !eq;
          }
          if (['<', '>', '<=', '>='].includes(e.op)) {
            if (a === null || b === null) throw rerr('NullPointerException', 'unboxing a null value', e.line);
            const x = num(a), y = num(b);
            return e.op === '<' ? x < y : e.op === '>' ? x > y : e.op === '<=' ? x <= y : x >= y;
          }
          if (e.op === '+' && (typeof a === 'string' || typeof b === 'string')) return str(a) + str(b);
          return arith(e.op, a, b, e.line, null, e);
        }
        case 'print': {
          const s = e.args.length ? str(ev(e.args[0])) : '';
          output += s + (e.ln ? '\n' : '');
          return undefined;
        }
        case 'new':
          if (classes[e.cls]) return construct(classes[e.cls], e.ctor, e.args.map(ev), e.line);
          if (e.cls === 'Integer') { const v = ev(e.args[0]); return boxInt(typeof v === 'string' ? parseInt(v, 10) : num(v), true); }
          if (e.cls === 'Double') return { box: true, t: 'Double', v: num(ev(e.args[0])) };
          if (e.cls === 'Scanner') return { scanner: true };
          if (e.cls === 'String') return e.args.length ? String(ev(e.args[0])) : '';
          return null;
        case 'sfield':
          if (classes[e.cls]) return statics[e.cls].get(e.name).v;
          if (e.cls === 'Math') return D(e.name === 'PI' ? Math.PI : Math.E);
          if (e.cls === 'Integer') return e.name === 'MAX_VALUE' ? 2147483647 : -2147483648;
          return D(e.name === 'MAX_VALUE' ? Number.MAX_VALUE : Number.MIN_VALUE);
        case 'scall': {
          const a = e.args.map(ev);
          if (classes[e.cls]) return callMethod(e.res, a, e.line, null);
          if (e.cls === 'Math') {
            const x = a.map(num), anyD = a.some(isD);
            switch (e.name) {
              case 'random': return D(rand());
              case 'sqrt': case 'floor': case 'ceil': case 'log': case 'log10': case 'sin': case 'cos': case 'tan':
              case 'asin': case 'acos': case 'atan': case 'cbrt': case 'exp': return D(Math[e.name](x[0]));
              case 'pow': return D(Math.pow(x[0], x[1]));
              case 'abs': return isD(a[0]) ? D(Math.abs(x[0])) : int32(Math.abs(x[0]));
              case 'min': return anyD ? D(Math.min(x[0], x[1])) : Math.min(x[0], x[1]);
              case 'max': return anyD ? D(Math.max(x[0], x[1])) : Math.max(x[0], x[1]);
              case 'round': return Math.floor(x[0] + 0.5);
            }
          }
          if (e.name === 'parseInt') { const n = parseInt(a[0], 10); if (!/^[-+]?\d+$/.test(String(a[0]).trim())) throw rerr('NumberFormatException', `For input string: "${a[0]}"`, e.line); return n; }
          if (e.name === 'parseDouble') return D(parseFloat(a[0]));
          return undefined;
        }
        case 'mcall': {
          const o = ev(e.obj);
          if (o === null) throw rerr('NullPointerException', `cannot invoke "${e.name}()" because the reference is null`, e.line);
          const a = e.args.map(ev);
          if (o.obj) return callMethod(e.res, a, e.line, o);
          if (typeof o === 'string') {
            switch (e.name) {
              case 'length': return o.length;
              case 'contains': return o.includes(a[0]);
              case 'toString': return o;
              case 'substring': {
                const b = num(a[0]), en = a.length > 1 ? num(a[1]) : o.length;
                if (b < 0 || en > o.length || b > en) throw rerr('StringIndexOutOfBoundsException', `begin ${b}, end ${en}, length ${o.length}`, e.line);
                return o.slice(b, en);
              }
              case 'indexOf': return o.indexOf(a[0], a.length > 1 ? Math.max(0, num(a[1])) : 0);
              case 'equals': return typeof a[0] === 'string' && o === a[0];
              case 'compareTo': return compareStr(o, a[0]);
            }
          }
          if (o.box) {
            if (e.name === 'intValue') return int32(Math.trunc(o.v));
            if (e.name === 'doubleValue') return D(o.v);
            if (e.name === 'equals') return !!(a[0] && a[0].box && a[0].t === o.t && a[0].v === o.v);
            if (e.name === 'compareTo') return Math.sign(o.v - num(a[0]));
            if (e.name === 'toString') return str(o);
          }
          if (o.scanner) {
            if (e.name === 'hasNext') return input.length > 0;
            if (!input.length) throw rerr('NoSuchElementException', 'no more input', e.line);
            const v = input.shift();
            if (e.name === 'nextInt') { if (!/^[-+]?\d+$/.test(String(v))) throw rerr('InputMismatchException', `"${v}" is not an int`, e.line); return int32(Number(v)); }
            if (e.name === 'nextDouble') { if (isNaN(Number(v))) throw rerr('InputMismatchException', `"${v}" is not a double`, e.line); return D(Number(v)); }
            if (e.name === 'nextBoolean') { if (!/^(true|false)$/i.test(String(v))) throw rerr('InputMismatchException', `"${v}" is not a boolean`, e.line); return /^true$/i.test(String(v)); }
            return String(v);
          }
          return undefined;
        }
        case 'call': return callMethod(e.res, e.args.map(ev), e.line, e.res.isStatic ? null : scope().self);
      }
      return undefined;
    }

    function compareStr(a, b) {
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a.charCodeAt(i) - b.charCodeAt(i);
      return a.length - b.length;
    }

    // Arithmetic with Java's int rules: truncating division, / by zero, 32-bit wraparound.
    // `as` is the target variable type for compound assignment (x += 1.5 on an int).
    function arith(op, a, b, line) {
      const dbl = isD(a) || isD(b);
      const x = num(a), y = num(b);
      if (a === null || b === null) throw rerr('NullPointerException', 'unboxing a null value', line);
      if (dbl) {
        switch (op) {
          case '+': return D(x + y);
          case '-': return D(x - y);
          case '*': return D(x * y);
          case '/': return D(x / y);
          case '%': return D(x % y);
        }
      }
      switch (op) {
        case '+': return int32(x + y);
        case '-': return int32(x - y);
        case '*': return Math.imul(x, y);
        case '/': if (y === 0) throw rerr('ArithmeticException', '/ by zero', line); return int32(Math.trunc(x / y));
        case '%': if (y === 0) throw rerr('ArithmeticException', '/ by zero', line); return int32(x % y);
      }
      return 0;
    }

    // self: the object for instance methods/constructors (null for static methods).
    function callMethod(m, args, line, self) {
      if (frames.length > 400) throw rerr('StackOverflowError', 'too many nested method calls', line);
      const s = new Map();
      m.params.forEach((pr, i) => s.set(pr.name, { type: pr.type, v: coerce(pr.type, args[i]), set: true }));
      const frame = [s];
      frame.self = self || null;
      frame.cls = self ? self.cls : m.cls || null;
      frames.push(frame);
      event(m.line, { call: m.name });
      try {
        const f = exec(m.body);
        if (f && f.kind === 'return') return f.value === undefined ? undefined : coerce(m.ret, f.value);
        return undefined;
      } finally { frames.pop(); }
    }
    function fieldSlot(o, name) { return o.fields.get(name) || (statics[o.cls] && statics[o.cls].get(name)); }
    // new Cls(...): default every instance field, run field initializers, then the constructor.
    function construct(c, ctor, args, line) {
      const o = { obj: true, cls: c.name, fields: new Map(), id: ++objCount };
      c.fields.filter((f) => !f.isStatic).forEach((f) => o.fields.set(f.name, { type: f.type, v: defaultOf(f.type), set: true }));
      const frame = [new Map()]; frame.self = o; frame.cls = c.name;
      frames.push(frame);
      try { c.fields.filter((f) => !f.isStatic && f.init).forEach((f) => { o.fields.get(f.name).v = coerce(f.type, ev(f.init)); }); }
      finally { frames.pop(); }
      if (ctor) callMethod(ctor, args, line, o);
      return o;
    }
    // static fields exist once per class, initialized before the program starts
    for (const c of Object.values(classes)) {
      statics[c.name] = new Map();
      c.fields.filter((f) => f.isStatic).forEach((f) => statics[c.name].set(f.name, { type: f.type, v: defaultOf(f.type), set: true }));
      Object.values(c.methods).forEach((l) => l.forEach((m) => { m.cls = c.name; }));
    }

    function declareVar(type, name, v) {
      const sc = scope();
      sc[sc.length - 1].set(name, { type, v: v === undefined ? undefined : coerce(type, v), set: v !== undefined });
    }

    function exec(s) {
      switch (s.k) {
        case 'empty': return null;
        case 'block': {
          scope().push(new Map());
          try {
            for (const x of s.body) { const f = exec(x); if (f) return f; }
          } finally { scope().pop(); }
          return null;
        }
        case 'decl':
          for (const v of s.vars) declareVar(s.type, v.name, v.init ? ev(v.init) : undefined);
          event(s.line);
          return null;
        case 'expr': ev(s.e); event(s.line); return null;
        case 'if': {
          const c = ev(s.cond);
          event(s.line, { cond: !!c });
          if (c) return exec(s.then);
          if (s.els) return exec(s.els);
          return null;
        }
        case 'while':
          for (;;) {
            const c = ev(s.cond);
            event(s.line, { cond: !!c });
            if (!c) return null;
            const f = exec(s.body);
            if (f) { if (f.kind === 'break') return null; if (f.kind === 'return') return f; }
          }
        case 'for': {
          scope().push(new Map());
          try {
            s.init.forEach((x) => { if (x.k === 'decl') { for (const v of x.vars) declareVar(x.type, v.name, v.init ? ev(v.init) : undefined); } else ev(x.e); });
            for (;;) {
              const c = s.cond ? ev(s.cond) : true;
              event(s.line, { cond: !!c });
              if (!c) return null;
              const f = exec(s.body);
              if (f) { if (f.kind === 'break') return null; if (f.kind === 'return') return f; }
              s.upd.forEach(ev);
            }
          } finally { scope().pop(); }
        }
        case 'return': { const v = s.e ? ev(s.e) : undefined; event(s.line, { ret: v === undefined ? undefined : str(v) }); return new Flow('return', v); }
        case 'break': event(s.line); return new Flow('break');
        case 'continue': event(s.line); return new Flow('continue');
      }
      return null;
    }
    // `continue` inside a loop body just ends that iteration: handled by loops ignoring the 'continue' flow.

    let error = null;
    try {
      frames = [[new Map()]];
      for (const c of Object.values(classes)) {
        const f0 = [new Map()]; f0.cls = c.name; frames.push(f0);
        c.fields.filter((f) => f.isStatic && f.init).forEach((f) => { statics[c.name].get(f.name).v = coerce(f.type, ev(f.init)); });
        frames.pop();
      }
      if (prog.body.length) {
        for (const s of prog.body) { const f = exec(s); if (f && f.kind === 'return') break; }
      } else if (prog.methods.main) {
        const m = prog.methods.main[0];
        callMethod(m, [null], m.line, null);
      }
    } catch (e) {
      if (!(e instanceof JErr)) throw e;
      error = { kind: e.kind, name: e.jname, message: e.message, line: e.line };
      if (trace) trace.push({ line: e.line, vars: frames.length ? snap() : [], out: output, error });
    }
    return { output, error, trace: trace || [], steps };
  }

  // What a student would write as "the result": output, or the error, in one line.
  function result(src, opts) {
    const r = run(src, opts);
    if (r.error && r.error.kind === 'compile') return { text: 'Compile error', detail: r.error.message, r };
    if (r.error && r.error.name === 'InfiniteLoop') return { text: 'Infinite loop', detail: r.error.message, r };
    if (r.error) return { text: (r.output ? r.output + ' then ' : '') + r.error.name, detail: r.error.message, r };
    return { text: r.output, detail: '', r };
  }

  // Evaluate one expression with variables, e.g. JavaLite.evalExpr('a > b == b > c', { a: ['int', 4], ... }).
  function evalExpr(exprSrc, vars) {
    const decls = Object.entries(vars || {}).map(([k, [t, v]]) => `${t} ${k} = ${typeof v === 'string' ? JSON.stringify(v) : v};`).join('\n');
    const r = run(`${decls}\nSystem.out.print(${exprSrc});`);
    return r.error ? { error: r.error } : { value: r.output };
  }

  // Tokens for syntax highlighting (lessons + problems share one look).
  function highlight(src) {
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const KW = /^(int|double|boolean|long|void|if|else|while|for|return|true|false|null|new|public|private|static|final|break|continue|class)$/;
    const TY = /^(String|Integer|Double|Math|System|Scanner)$/;
    return src.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|(\b\d+(?:\.\d+)?(?:[eE][-+]?\d+)?\b)|([A-Za-z_]\w*)|([^\w\s"\/]+|\/|\s+)/g, (m, com, s, n, w, rest) => {
      if (com) return `<span class="tk-c">${esc(com)}</span>`;
      if (s) return `<span class="tk-s">${esc(s)}</span>`;
      if (n) return `<span class="tk-n">${n}</span>`;
      if (w) return KW.test(w) ? `<span class="tk-k">${w}</span>` : TY.test(w) ? `<span class="tk-t">${w}</span>` : w;
      return esc(m);
    });
  }

  return { run, result, evalExpr, highlight, fmtDouble, tokenize, parse };
})();
