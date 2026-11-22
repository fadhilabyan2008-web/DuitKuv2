/* DuitKu v7 — lapisan penyambung: tombol Back browser/HP, tab bar ala iPhone, menu grup, tema warna browser.
   Dimuat paling akhir. Hanya membungkus fungsi yang sudah ada di script.js; tidak mengubah data keuangan. */
(function () {
  'use strict';
  if (typeof go !== 'function' || typeof openModal !== 'function' || typeof A === 'undefined') { console.warn('DuitKu v7: script.js belum siap'); return; }

  /* ---------- riwayat: Back menutup lapisan teratas, baru kembali ke halaman sebelumnya ---------- */
  var goRaw = go, silent = false;
  go = function (p) {
    var was = page;
    goRaw.apply(this, arguments);
    if (page !== was) {
      if (was === 'intel' && window.DKNav) DKNav.drop('intel');
      if (!silent && window.DKNav) DKNav.navigate(page);
      keepNavVisible();
    }
  };
  function showPage(p) { silent = true; try { go(p); } finally { silent = false; } }

  var openRaw = openModal, closeRaw = closeModal;
  openModal = function () {
    var r = openRaw.apply(this, arguments);
    if (window.DKNav) DKNav.push('modal', function () { closeRaw(); });
    return r;
  };
  closeModal = function () {
    if (window.DKNav && DKNav.has('modal')) DKNav.pop('modal'); else closeRaw();
  };
  A.close = closeModal;           /* A.close menunjuk ke fungsi lama; arahkan ke versi yang mengurus riwayat */

  /* detail DuitKu Intelligence (hasil analisis, Spend Guard, Goal Planner) = satu lapisan riwayat */
  ['intelrun', 'intelopen'].forEach(function (k) {
    var f = A[k]; if (!f) return;
    A[k] = function () { var r = f.apply(this, arguments); if (window.DKNav) DKNav.push('intel', function () { if (page === 'intel') intelBackRaw(); }); return r; };
  });
  var intelBackRaw = A.intelback;
  A.intelback = function () { if (window.DKNav && DKNav.has('intel')) DKNav.pop('intel'); else if (intelBackRaw) intelBackRaw(); };

  if (window.DKNav) DKNav.init({
    getPage: function () { return page; },
    showPage: showPage,
    toast: function (t) { toast(t); }
  });

  /* ---------- tab bar ala iPhone + menu grup ---------- */
  var TAB_KEYS = ['dash', 'tx', 'wal', 'stat'];
  var SHORT = { dash: 'Beranda', tx: 'Transaksi', wal: 'Dompet', stat: 'Statistik' };
  function tabLabel(k) { var l = navLabel(k); return curLang() === 'id' && SHORT[k] ? SHORT[k] : l; }
  bnavHtml = function () {
    var inTabs = TAB_KEYS.indexOf(page) > -1;
    return TAB_KEYS.map(function (k) {
      return '<button type="button" class="tab' + (k === page ? ' on' : '') + '" data-go="' + k + '" aria-label="' + esc(navLabel(k)) + '"' + (k === page ? ' aria-current="page"' : '') + '>' + svg(k) + '<span>' + esc(tabLabel(k)) + '</span></button>';
    }).join('') + '<button type="button" class="tab' + (inTabs ? '' : ' on') + '" data-act="menu" aria-haspopup="dialog" aria-label="' + esc(MENU_T[curLang()] || 'Menu') + ': ' + esc(navLabel(page)) + '">' + svg(inTabs ? 'grid' : page) + '<span>' + esc(inTabs ? (MENU_T[curLang()] || 'Menu') : navLabel(page)) + '</span></button>';
  };
  menuSheet = function () {
    var T = NAV_GROUP_T[curLang()] || NAV_GROUP_T.en;
    openModal(MENU_T[curLang()] || 'Menu',
      '<div class="msheet"><div class="more-me">' + meAvatarHtml() + '<div class="mm-t"><b>' + esc(P.name) + '</b><small>' + esc(P.job) + '</small></div></div>' +
      NAV_GROUPS.map(function (g, i) {
        return '<div class="mgrp"><div class="mgt">' + esc(T[i] || '') + '</div><div class="mlist">' + g.map(function (k) {
          return '<button type="button" class="mrow' + (k === page ? ' on' : '') + '" data-go="' + k + '"><span class="mic">' + svg(k) + '</span><span class="mtx">' + esc(navLabel(k)) + '</span><span class="mch" aria-hidden="true"></span></button>';
        }).join('') + '</div></div>';
      }).join('') + '</div>');
  };

  /* menu samping: item aktif tetap terlihat tanpa menggeser daftar bila sudah terlihat */
  function keepNavVisible() {
    requestAnimationFrame(function () {
      var nav = document.querySelector('#side .nav'), on = nav && nav.querySelector('button.on'); if (!on) return;
      var a = on.getBoundingClientRect(), b = nav.getBoundingClientRect();
      if (a.top < b.top + 4) nav.scrollTop -= (b.top + 4 - a.top); else if (a.bottom > b.bottom - 4) nav.scrollTop += (a.bottom - b.bottom + 4);
    });
  }

  /* warna bilah browser mengikuti tema */
  var tc = document.querySelector('meta[name="theme-color"]');
  if (!tc) { tc = document.createElement('meta'); tc.name = 'theme-color'; document.head.appendChild(tc); }
  function syncThemeColor() { tc.content = document.documentElement.dataset.theme === 'dark' ? '#000000' : '#f2f2f7'; }
  syncThemeColor();
  new MutationObserver(syncThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* kunci pengujian */
  if (window.__DUITKU_TEST) window.__dkShowPage = showPage;
})();
