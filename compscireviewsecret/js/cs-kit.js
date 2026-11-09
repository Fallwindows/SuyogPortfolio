// Computer Science lesson toolkit: code blocks, a step-through tracer, a truth-table builder and an
// expression stepper, all powered by JavaLite. Lessons and the problem bank share these so code looks
// the same everywhere. Attaches window.CSKit. (Markup helpers match PRKit: eq, call, check.)
window.CSKit = (function () {
  'use strict';
  const esc = (s) => PR.esc(s);
  const J = window.JavaLite;

  // ---------- markup ----------
  const call = (kind, title, body) => `<div class="callout ${kind}"><div class="title">${title}</div>${body}</div>`;
  const check = (q, opts, ans, why) =>
    `<div class="check" data-answer="${ans}"><div class="q">${q}</div><div class="opts">${opts
      .map((o) => `<button>${o}</button>`)
      .join('')}</div><div class="why">${why}</div></div>`;
  // A boxed rule, like the physics equation box but for code: rule('a % b', 'the remainder of a / b').
  const rule = (codeText, where) => `<div class="eq"><code class="rule">${esc(codeText)}</code>${where ? `<div class="where">${where}</div>` : ''}</div>`;
  // Inline code: c('x++')
  const c = (s) => `<code>${esc(s)}</code>`;

  // Highlighted code block. opts: { lines: show line numbers (default true when > 1 line), hl: [line numbers to mark] }
  function code(src, opts = {}) {
    const text = String(src).replace(/^\n+|\s+$/g, '');
    const lines = J.highlight(text).split('\n');
    const showNums = opts.lines !== undefined ? opts.lines : lines.length > 1;
    const hl = new Set(opts.hl || []);
    return `<pre class="code${showNums ? ' nums' : ''}">${lines.map((l, i) =>
      `<span class="ln${hl.has(i + 1) ? ' hl' : ''}">${showNums ? `<i>${i + 1}</i>` : ''}${l || ' '}</span>`).join('')}</pre>`;
  }

  // Two code blocks side by side, e.g. right vs wrong. cols: [{ title, src, note }]
  function compare(cols) {
    return `<div class="fig-row">${cols.map((x) => `<div><div class="cmp-title ${x.bad ? 'bad' : x.good ? 'good' : ''}">${x.title}</div>${code(x.src)}${x.note ? `<p class="muted" style="font-size:14px">${x.note}</p>` : ''}</div>`).join('')}</div>`;
  }

  // Output console text: shows the exact characters, with trailing spaces visible.
  function outBox(text, err) {
    const shown = esc(text).replace(/ (?=\n|$)/g, '<span class="sp">·</span>');
    return `<pre class="console">${shown || '<span class="muted">(no output)</span>'}${err ? `\n<span class="err">${esc(err)}</span>` : ''}</pre>`;
  }
  const errText = (e) => (e ? (e.kind === 'compile' ? `Compile error (line ${e.line}): ${e.message}` : e.name === 'InfiniteLoop' ? `Infinite loop: ${e.message}` : `${e.name} (line ${e.line}): ${e.message}`) : '');

  // ---------- step-through tracer ----------
  // host: element. o: { src, input: [values for Scanner], title, caption, editable (default true), maxSteps }
  // Shows the code with the current line highlighted, every variable, and the output so far.
  function tracer(host, o) {
    let src = String(o.src).replace(/^\n+|\s+$/g, '');
    let steps = [], i = -1, result = null, editing = false;
    host.classList.add('sim', 'tracer');
    host.innerHTML = `
      ${o.title ? `<div class="tr-title">${o.title}</div>` : ''}
      <div class="tr-grid">
        <div class="tr-code"></div>
        <div class="tr-side">
          <div class="tr-label">Variables</div><div class="tr-vars"></div>
          <div class="tr-label">Output</div><div class="tr-out"></div>
        </div>
      </div>
      <div class="sim-controls">
        <button class="btn small" data-k="reset">⏮ Reset</button>
        <button class="btn small" data-k="back">◀ Back</button>
        <button class="btn small primary" data-k="step">Step ▶</button>
        <button class="btn small" data-k="run">Run to end ⏭</button>
        ${o.editable === false ? '' : '<button class="btn small" data-k="edit">✎ Edit code</button>'}
        <span class="muted tr-count" style="font-size:13px;margin-left:auto"></span>
      </div>
      <div class="sim-readout tr-status"></div>
      ${o.caption ? `<div class="sim-caption">${o.caption}</div>` : ''}`;
    const $ = (k) => host.querySelector(k);
    function compile() {
      result = J.run(src, { trace: true, input: o.input, maxSteps: o.maxSteps || 3000, random: o.random });
      steps = result.trace;
      i = -1;
    }
    function render() {
      if (editing) return;
      const st = i >= 0 ? steps[i] : null;
      const errLine = result.error && result.error.kind === 'compile' ? result.error.line : null;
      const lines = J.highlight(src).split('\n');
      $('.tr-code').innerHTML = `<pre class="code nums">${lines.map((l, k) => {
        const n = k + 1;
        const cls = [st && st.line === n ? 'hl' : '', errLine === n ? 'errl' : '', st && st.line === n && st.cond !== undefined ? (st.cond ? 'ctrue' : 'cfalse') : ''].join(' ');
        return `<span class="ln ${cls}"><i>${n}</i>${l || ' '}</span>`;
      }).join('')}</pre>`;
      const vars = st ? st.vars : [];
      $('.tr-vars').innerHTML = vars.length
        ? `<table>${vars.map(([n, t, v]) => `<tr><td class="mono">${esc(n)}</td><td class="muted">${esc(t)}</td><td class="mono"><b>${esc(v)}</b></td></tr>`).join('')}</table>`
        : '<span class="muted">none yet</span>';
      const atEnd = i === steps.length - 1;
      $('.tr-out').innerHTML = outBox(st ? st.out : '', atEnd && result.error && result.error.kind === 'runtime' ? errText(result.error) : '');
      let status = '';
      if (result.error && result.error.kind === 'compile') status = `<span class="err">${esc(errText(result.error))}</span> <span class="muted">— the program never runs.</span>`;
      else if (!st) status = '<span class="muted">Press Step to run the first line.</span>';
      else if (st.error) status = `<span class="err">${esc(errText(st.error))}</span>`;
      else if (st.cond !== undefined) status = `Line ${st.line}: condition is <b class="${st.cond ? 'good' : 'bad'}">${st.cond}</b>${st.cond ? '' : ' → skip / exit'}`;
      else if (st.call) status = `Called <b class="mono">${esc(st.call)}</b>`;
      else if (st.ret !== undefined) status = `Line ${st.line}: return <b class="mono">${esc(st.ret)}</b>`;
      else status = `Ran line ${st.line}`;
      if (atEnd && !result.error) status += ' <span class="muted">· finished</span>';
      $('.tr-status').innerHTML = status;
      $('.tr-count').textContent = steps.length ? `step ${Math.max(0, i + 1)} / ${steps.length}` : '';
      $('[data-k="back"]').disabled = i < 0;
      $('[data-k="step"]').disabled = $('[data-k="run"]').disabled = atEnd || !steps.length;
    }
    $('[data-k="step"]').onclick = () => { if (i < steps.length - 1) { i++; render(); } };
    $('[data-k="back"]').onclick = () => { if (i >= 0) { i--; render(); } };
    $('[data-k="run"]').onclick = () => { i = steps.length - 1; render(); };
    $('[data-k="reset"]').onclick = () => { i = -1; render(); };
    const ed = $('[data-k="edit"]');
    if (ed) ed.onclick = () => {
      if (!editing) {
        editing = true;
        ed.textContent = '▶ Run my code';
        $('.tr-code').innerHTML = `<textarea class="tr-edit mono" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>`;
        const ta = $('.tr-edit');
        ta.value = src;
        ta.rows = Math.max(6, src.split('\n').length + 1);
        ta.focus();
      } else {
        src = $('.tr-edit').value;
        editing = false;
        ed.textContent = '✎ Edit code';
        compile(); render();
      }
    };
    compile(); render();
    return () => {};
  }

  // ---------- truth tables ----------
  // host: element. o: { exprs: ['A && B', '!A || !B'], vars: ['A','B'], editable, caption }
  // Columns that match row-for-row are flagged as equivalent.
  function truthTable(host, o) {
    let exprs = o.exprs.slice();
    const vars = o.vars || ['A', 'B'];
    host.classList.add('sim', 'tt');
    host.innerHTML = `<div class="tt-table"></div>
      ${o.editable === false ? '' : `<div class="sim-controls">${exprs.map((e, k) => `<label>Expression ${k + 1} <input type="text" class="mono" data-k="${k}" value="${esc(e)}" spellcheck="false" style="min-width:180px"></label>`).join('')}</div>`}
      <div class="sim-readout tt-verdict"></div>
      ${o.caption ? `<div class="sim-caption">${o.caption}</div>` : ''}`;
    function render() {
      const rows = [];
      const n = vars.length;
      for (let r = 0; r < 1 << n; r++) {
        const vals = vars.map((v, k) => !((r >> (n - 1 - k)) & 1)); // true first, like the notes
        const env = {};
        vars.forEach((v, k) => { env[v] = ['boolean', vals[k]]; });
        rows.push({ vals, out: exprs.map((e) => { const x = J.evalExpr(e, env); return x.error ? null : x.value === 'true'; }) });
      }
      const bad = exprs.map((e) => { const env = {}; vars.forEach((v) => { env[v] = ['boolean', true]; }); const x = J.evalExpr(e, env); return x.error ? x.error.message : null; });
      host.querySelector('.tt-table').innerHTML = `<table class="truth"><tr>${vars.map((v) => `<th>${v}</th>`).join('')}${exprs.map((e) => `<th class="mono">${esc(e)}</th>`).join('')}</tr>
        ${rows.map((row) => `<tr>${row.vals.map((v) => `<td class="${v ? 't' : 'f'}">${v}</td>`).join('')}${row.out.map((v) => `<td class="${v === null ? '' : v ? 't' : 'f'} out">${v === null ? '—' : v}</td>`).join('')}</tr>`).join('')}</table>`;
      let verdict = '';
      if (bad.some(Boolean)) verdict = bad.map((b, k) => (b ? `<span class="err">Expression ${k + 1} doesn't compile: ${esc(b)}</span>` : '')).filter(Boolean).join(' ');
      else if (exprs.length > 1) {
        const same = rows.every((row) => row.out.every((v) => v === row.out[0]));
        const opposite = exprs.length === 2 && rows.every((row) => row.out[0] !== row.out[1]);
        verdict = same ? '<b class="good">Equivalent</b>: every row matches.' : opposite ? '<b>Exact opposites</b>: one is the negation of the other.' : '<b class="bad">Not equivalent</b>: some rows differ.';
      }
      host.querySelector('.tt-verdict').innerHTML = verdict;
    }
    host.querySelectorAll('input[data-k]').forEach((inp) => { inp.oninput = () => { exprs[Number(inp.dataset.k)] = inp.value; render(); }; });
    render();
    return () => {};
  }

  // ---------- expression stepper ----------
  // Shows how Java evaluates one expression, one operation at a time, in precedence order,
  // including short-circuit skips. o: { expr: '3 * 5 > 20 == 5.5 - 2 <= 3', vars: { a: ['int', 4] }, editable, caption }
  function exprSteps(exprSrc, vars) {
    const decls = Object.entries(vars || {}).map(([k, [t, v]]) => `${t} ${k} = ${typeof v === 'string' && t === 'String' ? JSON.stringify(v) : v};`).join('\n');
    const full = `${decls}\nSystem.out.print(${exprSrc});`;
    const r = J.run(full);
    if (r.error && r.error.kind === 'compile') return { error: r.error };
    const prog = J.parse(full);
    const root = prog.body[prog.body.length - 1].e.args[0];
    const show = (e) => {
      if (e.val !== undefined) return e.val;
      switch (e.k) {
        case 'lit': return e.t === 'String' ? JSON.stringify(e.v) : e.t === 'double' ? J.fmtDouble(e.v) : String(e.v);
        case 'var': return e.name;
        case 'paren': return `(${show(e.e)})`;
        case 'bin': return `${show(e.l)} ${e.op} ${show(e.r)}`;
        case 'un': return `${e.op}${show(e.e)}`;
        case 'cast': return `(${e.to})${show(e.e)}`;
        case 'scall': return `${e.cls}.${e.name}(${e.args.map(show).join(', ')})`;
        case 'mcall': return `${show(e.obj)}.${e.name}(${e.args.map(show).join(', ')})`;
        case 'sfield': return `${e.cls}.${e.name}`;
        default: return '?';
      }
    };
    // value of a sub-expression: run it for real (keeps Java's exact formatting and types)
    const valueOf = (e) => {
      const x = J.run(`${decls}\nSystem.out.print(${show(e)});`);
      if (x.error) return { error: x.error };
      return { text: literalOf(e, x.output) };
    };
    // turn printed output back into a literal of the right type (Strings get quotes)
    const isStringExpr = (e) => !J.run(`${decls}\nString __q = ${show(e)};`).error;
    const literalOf = (e, out) => (isStringExpr(e) ? JSON.stringify(out) : out);
    const steps = [{ text: show(root), note: '' }];
    let err = null;
    function reduce(e) {
      if (err || e.val !== undefined) return;
      switch (e.k) {
        case 'lit': return;
        case 'var': { const v = valueOf(e); e.val = v.text; steps.push({ text: show(root), note: `${e.name} is ${v.text}` }); return; }
        case 'paren': reduce(e.e); if (!err) { e.val = e.e.val; } return;
        case 'un': case 'cast': reduce(e.e); break;
        case 'scall': case 'mcall': if (e.obj) reduce(e.obj); e.args.forEach(reduce); break;
        case 'bin':
          reduce(e.l);
          if (err) return;
          if ((e.op === '&&' && e.l.val === 'false') || (e.op === '||' && e.l.val === 'true')) {
            e.val = e.l.val;
            steps.push({ text: show(root), note: `short-circuit: ${e.op === '&&' ? 'false && …' : 'true || …'} is ${e.val} without looking at the right side`, skip: true });
            return;
          }
          reduce(e.r);
          break;
        default: break;
      }
      if (err) return;
      const before = show(e);
      const v = valueOf(e);
      if (v.error) { err = v.error; steps.push({ text: show(root), note: `${before} → ${v.error.name}: ${v.error.message}`, error: true }); return; }
      e.val = v.text;
      steps.push({ text: show(root), note: `${before} → ${v.text}` });
    }
    reduce(root);
    return { steps, error: null, runtime: err };
  }
  function stepper(host, o) {
    let expr = o.expr;
    host.classList.add('sim', 'stepper');
    host.innerHTML = `<div class="st-body"></div>
      <div class="sim-controls">
        <button class="btn small" data-k="back">◀ Back</button>
        <button class="btn small primary" data-k="next">Next step ▶</button>
        <button class="btn small" data-k="all">Show all</button>
        ${o.editable === false ? '' : `<label style="flex:1">Expression <input type="text" class="mono" data-k="e" value="${esc(expr)}" spellcheck="false" style="flex:1;min-width:200px"></label>`}
      </div>
      ${o.vars && Object.keys(o.vars).length ? `<div class="sim-readout muted">${Object.entries(o.vars).map(([k, [t, v]]) => `<span class="mono">${t} ${k} = ${esc(typeof v === 'string' && t === 'String' ? JSON.stringify(v) : String(v))}</span>`).join('')}</div>` : ''}
      ${o.caption ? `<div class="sim-caption">${o.caption}</div>` : ''}`;
    let data = null, shown = 1;
    function compute() { data = exprSteps(expr, o.vars); shown = 1; }
    function render() {
      const b = host.querySelector('.st-body');
      if (data.error) { b.innerHTML = `<div class="st-line"><span class="mono">${esc(expr)}</span></div><div class="err" style="padding:0 16px 12px">Compile error: ${esc(data.error.message)}</div>`; }
      else b.innerHTML = data.steps.slice(0, shown).map((s, k) => `<div class="st-line ${k === shown - 1 ? 'cur' : ''} ${s.skip ? 'skip' : ''} ${s.error ? 'errl' : ''}"><span class="mono">${esc(s.text)}</span>${s.note ? `<span class="st-note">${esc(s.note)}</span>` : ''}</div>`).join('');
      const max = data.error ? 1 : data.steps.length;
      host.querySelector('[data-k="next"]').disabled = shown >= max;
      host.querySelector('[data-k="all"]').disabled = shown >= max;
      host.querySelector('[data-k="back"]').disabled = shown <= 1;
    }
    host.querySelector('[data-k="next"]').onclick = () => { shown++; render(); };
    host.querySelector('[data-k="back"]').onclick = () => { shown--; render(); };
    host.querySelector('[data-k="all"]').onclick = () => { shown = data.error ? 1 : data.steps.length; render(); };
    const inp = host.querySelector('[data-k="e"]');
    if (inp) inp.onchange = () => { expr = inp.value; compute(); render(); };
    compute(); render();
    return () => {};
  }

  // Mount every [data-cs] widget inside el from a spec table. Lessons write:
  //   <div data-cs="tracer" data-id="t1"></div>  and call CSKit.mount(el, { t1: { src: ... } })
  function mount(el, specs) {
    const cleanups = [];
    el.querySelectorAll('[data-cs]').forEach((host) => {
      const spec = specs[host.dataset.id] || {};
      const fn = { tracer, truth: truthTable, stepper }[host.dataset.cs];
      if (fn) cleanups.push(fn(host, spec));
    });
    return () => cleanups.forEach((f) => { try { f && f(); } catch (e) {} });
  }

  return { esc, call, check, rule, c, code, compare, outBox, errText, tracer, truthTable, stepper, exprSteps, mount };
})();
