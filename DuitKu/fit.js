/* DuitKu — angka uang selalu satu baris & tidak keluar kotak (auto-kecilkan huruf). */
(function () {
  'use strict';
  var NUM = /(\d{1,3}([.,]\d{3})+|Rp|\$|€|£|¥|\d{5,})/, busy = false, tm = 0;
  function fitEl(el) {
    el.style.removeProperty('font-size');
    el.style.setProperty('white-space', 'nowrap', 'important');
    var cs = getComputedStyle(el), base = parseFloat(cs.fontSize) || 14, s = base, min = Math.max(7, base * 0.34);
    if (cs.overflow === 'visible' || cs.overflowX === 'visible') { el.style.setProperty('overflow-x', 'clip', 'important'); el.style.setProperty('overflow-y', 'visible', 'important'); }
    var guard = 0;
    while (el.scrollWidth > el.clientWidth + 1 && s > min && guard++ < 60) { s -= Math.max(.5, s * .04); el.style.setProperty('font-size', s + 'px', 'important'); }
  }
  function run() {
    if (busy) return; busy = true;
    try {
      var roots = document.querySelectorAll('#main, .modal, #modal, [role=dialog]');
      roots.forEach(function (r) {
        r.querySelectorAll('*').forEach(function (el) {
          if (el.children.length > 5 || el.closest('svg') || /^(SCRIPT|STYLE|BUTTON|SVG|PATH|INPUT|SELECT|TEXTAREA|OPTION)$/.test(el.tagName)) return;
          var own = '';
          el.childNodes.forEach(function (n) { if (n.nodeType === 3) own += n.textContent; });
          var counter = el.querySelector(':scope > .count-up');
          var t = own || (counter ? el.textContent : '');
          if (!t || t.length > 40 || !(NUM.test(t) || (/\d/.test(t) && el.closest('.cal-day')))) return;
          var d = getComputedStyle(el).display;
          if (d === 'inline' || d === 'contents' || d === 'none') return;
          if (!el.clientWidth) return;
          fitEl(el);
        });
      });
    } catch (e) {}
    busy = false;
  }
  function soon() { clearTimeout(tm); tm = setTimeout(function () { requestAnimationFrame(run); }, 60); }
  function start() {
    var m = document.getElementById('main');
    if (m) new MutationObserver(soon).observe(m, { childList: true, subtree: true, characterData: true });
    new MutationObserver(soon).observe(document.body, { childList: true });
    window.addEventListener('resize', soon);
    soon(); setTimeout(soon,500); setTimeout(soon,1600);
    try { document.fonts && document.fonts.ready.then(soon); } catch (e) {}
    window.addEventListener('load', soon);
    setInterval(function () { if (!document.hidden) soon(); }, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.DKFit = soon;
})();
