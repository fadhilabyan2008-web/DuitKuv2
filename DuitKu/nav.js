/* DuitKu Nav — menyambungkan tombol Back/Forward browser (dan tombol kembali di HP) dengan perpindahan
   halaman, panel (modal), dan layar penuh (game, Wrapped, detail analisis) di dalam DuitKu.
   Tanpa pustaka. Dipakai oleh script.js (go, openModal, Intelligence, Wrapped) dan games.js.

   Cara kerja:
   - Tiap halaman baru dan tiap "lapisan" (modal, game, detail analisis, pemutar Wrapped) menambah satu entri riwayat.
   - Tombol Back menutup lapisan paling atas lebih dulu, baru kembali ke halaman sebelumnya.
   - Di halaman awal, Back pertama hanya memunculkan pesan; Back kedua (dalam 2,5 detik) baru keluar dari situs.

   API:
     DKNav.init({getPage, showPage, toast})   dipanggil sekali saat aplikasi mulai
     DKNav.navigate(page)                      catat perpindahan halaman (dipanggil go())
     DKNav.push(key, close, guard)             buka lapisan; close(reason) menutup tampilannya;
                                               guard() boleh mengembalikan true untuk "menahan" Back (mis. jeda game)
     DKNav.pop(key) / DKNav.back(key)          tutup lapisan (dan semua di atasnya) lewat kode; true bila ada
     DKNav.has(key), DKNav.closeAll(), DKNav.depth() */
(function () {
  'use strict';
  var layers = [];          // lapisan terbuka, paling atas di ujung: {key, close, guard, n}
  var cur = 0;              // indeks entri riwayat yang sedang aktif
  var pageGet = null, pageShow = null, toastFn = null;
  var expect = null;        // popstate yang sengaja kita picu (penutupan lewat kode)
  var queue = [], safety = 0, armed = 0, armTimer = 0, inited = false;

  function hash(p) { return '#/' + p; }
  function st(n, extra) { var o = { dk: 1, n: n }; for (var k in extra) o[k] = extra[k]; return o; }
  function getPage() { return pageGet ? pageGet() : 'dash'; }
  function flush() { var q = queue; queue = []; q.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  /* operasi riwayat yang datang saat penutupan lewat kode belum selesai ditunda dulu agar urutannya benar */
  function settle(fn) { if (expect !== null) queue.push(fn); else fn(); }
  function release() { expect = null; clearTimeout(safety); flush(); }

  function init(o) {
    if (inited) return; inited = true;
    pageGet = o.getPage; pageShow = o.showPage; toastFn = o.toast || function () {};
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    var s = history.state, p = getPage();
    if (s && s.dk && s.n > 0) {            // muat ulang di tengah riwayat: lanjutkan dari entri yang sama
      cur = s.n; history.replaceState(st(cur, { page: p }), '', hash(p));
    } else {                                // buka baru: entri 0 = batas keluar, entri 1 = halaman pertama
      history.replaceState(st(0, { root: 1, page: p }), '', hash(p));
      cur = 1; history.pushState(st(1, { page: p }), '', hash(p));
    }
    window.addEventListener('popstate', onPop);
  }

  function onPop(e) {
    var s = e.state; if (!s || !s.dk) return;
    var target = s.n;
    if (expect !== null) { cur = target; release(); return; }
    if (target < cur) {                     // pengguna menekan Back
      while (layers.length && layers[layers.length - 1].n > target) {
        var L = layers[layers.length - 1], handled = false;
        if (L.guard) { try { handled = !!L.guard(); } catch (err) {} }
        if (handled) {                      // ditahan (mis. game dijeda): pulihkan entri lapisan
          cur = L.n - 1; history.pushState(st(L.n, { layer: L.key, page: getPage() }), '', hash(getPage())); cur = L.n; return;
        }
        layers.pop();
        try { L.close('back'); } catch (err2) { console.error(err2); }
      }
      cur = target;
      if (s.root) { atRoot(); return; }
      if (s.page && s.page !== getPage() && pageShow) pageShow(s.page);
    } else if (target > cur) {              // tombol Forward
      cur = target;
      if (s.layer || (s.page && s.page === getPage())) history.replaceState(st(cur, { page: getPage() }), '', hash(getPage()));
      else if (s.page && pageShow) pageShow(s.page);
    }
  }

  function atRoot() {
    if (armed) { armed = 0; clearTimeout(armTimer); history.back(); return; }   // Back kedua: keluar dari situs
    armed = 1; clearTimeout(armTimer); armTimer = setTimeout(function () { armed = 0; }, 2500);
    try { toastFn('Tekan Kembali sekali lagi untuk keluar'); } catch (e) {}
    var p = getPage(); cur = 1; history.pushState(st(1, { page: p }), '', hash(p));
  }

  function navigate(p) { settle(function () { cur++; history.pushState(st(cur, { page: p }), '', hash(p)); }); }

  function push(key, close, guard) {
    for (var i = 0; i < layers.length; i++) if (layers[i].key === key) { layers[i].close = close; if (guard) layers[i].guard = guard; return; }
    var L = { key: key, close: close, guard: guard, n: 0 };
    layers.push(L);
    settle(function () { if (layers.indexOf(L) < 0) return; cur++; L.n = cur; history.pushState(st(cur, { layer: key, page: getPage() }), '', hash(getPage())); });
  }

  function pop(key) {
    var idx = -1; for (var i = 0; i < layers.length; i++) if (layers[i].key === key) idx = i;
    if (idx < 0) return false;
    var closing = layers.splice(idx).reverse();
    closing.forEach(function (L) { try { L.close('code'); } catch (e) { console.error(e); } });
    var n = closing.filter(function (L) { return L.n > 0; }).length;
    if (n > 0) {
      expect = cur - n; clearTimeout(safety);
      safety = setTimeout(function () { if (expect !== null) { cur = expect; release(); } }, 700);
      history.go(-n);
    }
    return true;
  }

  /* lepas lapisan tanpa mengubah riwayat (mis. pengguna pindah halaman lewat menu saat detail analisis terbuka) */
  function drop(key) { for (var i = layers.length - 1; i >= 0; i--) if (layers[i].key === key) layers.splice(i, 1); }

  window.DKNav = {
    init: init, navigate: navigate, push: push, pop: pop, back: pop, drop: drop,
    has: function (k) { return layers.some(function (l) { return l.key === k; }); },
    closeAll: function () { if (layers.length) pop(layers[0].key); },
    depth: function () { return layers.length; },
    debug: function () { return { cur: cur, layers: layers.map(function (l) { return l.key + '@' + l.n; }), expect: expect }; }
  };
})();
