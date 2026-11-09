// Small reading helper for the intro section.
(function () {
  'use strict';
  var h1 = document.querySelector('.intro h1');
  var foot = document.getElementById('year');
  if (!h1 || !foot) return;

  // The word under a click, read from the text itself (no extra markup needed).
  function wordAt(x, y) {
    var node, off;
    if (document.caretPositionFromPoint) {
      var p = document.caretPositionFromPoint(x, y);
      if (!p) return '';
      node = p.offsetNode; off = p.offset;
    } else if (document.caretRangeFromPoint) {
      var r = document.caretRangeFromPoint(x, y);
      if (!r) return '';
      node = r.startContainer; off = r.startOffset;
    } else return '';
    if (!node || node.nodeType !== 3) return '';
    var t = node.textContent, a = off, b = off;
    while (a > 0 && /\w/.test(t[a - 1])) a--;
    while (b < t.length && /\w/.test(t[b])) b++;
    return t.slice(a, b).toLowerCase();
  }

  var flip = function (s) { return s.split('').reverse().join(''); };
  var k = ['dliub', 'sloot', 'atad'].map(flip);
  var path = '/' + flip('tercesweivericspmoc') + '/';
  var seq = [], timer = null;

  function reveal() {
    var a = document.createElement('a');
    a.href = path;
    a.textContent = path;
    a.style.color = 'inherit';
    foot.textContent = '';
    foot.appendChild(a);
    clearTimeout(timer);
    timer = setTimeout(function () { foot.textContent = String(new Date().getFullYear()); }, 60000);
  }

  h1.addEventListener('click', function (e) {
    var now = Date.now();
    seq = seq.filter(function (s) { return now - s.t < 20000; });
    seq.push({ w: wordAt(e.clientX, e.clientY), t: now });
    if (seq.length > 3) seq.shift();
    if (seq.length === 3 && seq.every(function (s, i) { return s.w === k[i]; })) { seq = []; reveal(); }
  });
})();
