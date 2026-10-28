// Shared helpers for Physics Review. Loaded first on every page.
window.PR = (function () {
  // Render KaTeX inside an element. Supports \( inline \) and \[ display \].
  function math(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
      });
    }
  }

  // Deterministic PRNG so both duel players generate identical problems from one seed.
  function rng(seed) {
    let a = seed >>> 0;
    const next = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (lo, hi) => lo + (hi - lo) * next();
    next.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next()); // inclusive
    next.pick = (arr) => arr[Math.floor(next() * arr.length)];
    next.shuffle = (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    };
    return next;
  }

  // Round to n significant figures (returns a number).
  function sig(x, n = 3) {
    if (x === 0 || !isFinite(x)) return x;
    return Number(x.toPrecision(n));
  }

  // Format a number for display: plain for normal magnitudes, scientific (a × 10^b) otherwise.
  // Returns a KaTeX-ready string (no delimiters).
  function fmt(x, n = 3) {
    if (x === 0) return '0';
    const ax = Math.abs(x);
    if (ax >= 1e-3 && ax < 1e5) return String(sig(x, n));
    const e = Math.floor(Math.log10(ax));
    const m = sig(x / Math.pow(10, e), n);
    return `${m} \\times 10^{${e}}`;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Wire up any .check blocks inside el (quick-check multiple choice).
  // Markup: <div class="check" data-answer="1"><div class="q">…</div><div class="opts"><button>…</button>…</div><div class="why">…</div></div>
  function wireChecks(el) {
    el.querySelectorAll('.check').forEach((box) => {
      const ans = Number(box.dataset.answer);
      const btns = box.querySelectorAll('.opts button');
      btns.forEach((b, i) =>
        b.addEventListener('click', () => {
          if (box.classList.contains('answered')) return;
          box.classList.add('answered');
          b.classList.add(i === ans ? 'right' : 'wrong');
          btns[ans].classList.add('right');
        })
      );
    });
  }

  // Read a CSS custom property (for canvas drawing that should follow the theme).
  function color(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Size a canvas to its CSS width at device pixel ratio; returns {ctx, w, h} in CSS pixels.
  function fitCanvas(canvas, aspect = 0.5) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
    const h = Math.round(w * aspect);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  return { math, rng, sig, fmt, esc, wireChecks, color, fitCanvas };
})();
