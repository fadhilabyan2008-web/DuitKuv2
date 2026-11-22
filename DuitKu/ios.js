/* DuitKu iOS layer — ikon tambahan (kartu saldo, saklar, robot). Dimuat setelah v7.js, sebelum boot.js. */
(function () {
  'use strict';
  try {
    IL.arrowdown = '<path d="M12 4.5v13M6.5 12.5L12 18l5.5-5.5"/>';
    IL.arrowup = '<path d="M12 19.5v-13M6.5 11.5L12 6l5.5 5.5"/>';
    IL.eye = '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>';
    IL.eyeoff = '<path d="M3 3l18 18M10.6 5.7A9.5 9.5 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.7M6.6 6.9A15.6 15.6 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';
    IL.textsize = '<path d="M3.5 18L8 6l4.5 12M5 14h6.2M14.5 18l3-8 3 8M15.7 15.4h3.6"/>';
    IL.contrast = '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>';
    IL.sidebar = '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/>';
    IL.plus = '<path d="M12 5v14M5 12h14"/>';
    IL.bell = '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0"/>';
    IL.keyboard = '<rect x="2.5" y="6" width="19" height="12" rx="3"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7 14h10"/>';
    IL.robot = '<rect x="4.5" y="8" width="15" height="11" rx="3.6"/><path d="M12 8V4.8M2.6 12.2v3M21.4 12.2v3M9.6 16.2h4.8"/><circle cx="12" cy="3.7" r="1.2" fill="currentColor"/><circle cx="9" cy="13" r="1.1" fill="currentColor"/><circle cx="15" cy="13" r="1.1" fill="currentColor"/>';
    IL.insight = '<path d="M3.5 17l5-5.5 3.5 3.5 5.5-7"/><path d="M14 8h3.5v3.5"/><path d="M4 20.5h16"/>';
    IL.rocket = '<path d="M14.5 4.5c3 .3 5 2.3 5.5 5.5-1.3 3.5-4 6-7.5 7.5L7 12c1.5-3.5 4-6.2 7.5-7.5z"/><circle cx="14.5" cy="9.5" r="1.4"/><path d="M7 12l-3 .5 2.5-4M12 17l-.5 3 4-2.5M5 19c.2-1.5 1-2.3 2.5-2.5"/>';
    if (IL.intel) IL.intel = IL.robot;
  } catch (e) {}
  /* hak cipta: di HP ikut berada di ujung halaman (kaca), di desktop tetap di bar bawah */
  try {
    var _r = render;
    render = function () {
      var cr = document.getElementById('copyright'), mq = window.matchMedia('(max-width: 800px)').matches;
      if (cr && cr.parentNode !== document.getElementById('app').parentNode && !document.getElementById('main').contains(cr)) {}
      if (cr && document.getElementById('main').contains(cr)) document.getElementById('app').after(cr);
      var out = _r.apply(this, arguments);
      try { var m = document.getElementById('main'), c2 = document.getElementById('copyright'); if (m && c2 && mq) m.appendChild(c2); } catch (e) {}
      return out;
    };
  } catch (e) {}
})();

/* ===== 50 ikon finansial acak untuk layar selamat datang (tersebar, tidak mengganggu teks) ===== */
(function () {
  if (typeof welcomeHtml !== 'function') return;
  var ICONS = [
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M9.8 10.2c0-1 1-1.6 2.2-1.6s2.2.6 2.2 1.6c0 2.2-4.4 1-4.4 3.4 0 1 1 1.6 2.2 1.6s2.2-.6 2.2-1.6"/>',
    '<rect x="3" y="6.5" width="18" height="12" rx="3"/><path d="M3 10h18M16.5 14.5h1.6"/>',
    '<rect x="4" y="12.5" width="3.6" height="7" rx="1"/><rect x="10.2" y="8" width="3.6" height="11.5" rx="1"/><rect x="16.4" y="4" width="3.6" height="15.5" rx="1"/>',
    '<path d="M3.5 16.5l5-5 3.6 3.6L20.5 7M15 7h5.5v5.5"/>',
    '<rect x="3.5" y="9.5" width="17" height="10.5" rx="2.2"/><rect x="3" y="6.5" width="18" height="3.4" rx="1.3"/><path d="M12 6.5V20M12 6.5C10.5 3 7 3.6 7.6 5.6c.4 1.2 2.6 1 4.4.9zm0 0c1.5-3.5 5-2.9 4.4-.9-.4 1.2-2.6 1-4.4.9z"/>',
    '<path d="M12 3.2l7 2.6v5.4c0 4.4-2.9 7.6-7 9.6-4.1-2-7-5.2-7-9.6V5.8z"/><path d="M9 12l2.2 2.2L15.2 10"/>',
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.1"/>',
    '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    '<path d="M12 3.4l2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 16.6 6.9 19.4l1-5.8L3.7 9.5l5.8-.8z"/>',
    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM18.5 16.5v4M16.5 18.5h4"/>',
    '<path d="M5 19L19 5"/><circle cx="7.5" cy="7.5" r="2.4"/><circle cx="16.5" cy="16.5" r="2.4"/>',
    '<path d="M4 11.5L12 4l8 7.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M10 20v-5.5h4V20"/>',
    '<path d="M4 5h2.4l1.9 9.4a1.6 1.6 0 0 0 1.6 1.3h6.8a1.6 1.6 0 0 0 1.6-1.2L19.8 8H7"/><circle cx="10" cy="19.2" r="1.2"/><circle cx="17" cy="19.2" r="1.2"/>',
    '<path d="M5 9h11v5.2a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.8a2.2 2.2 0 0 1 0 4.4H16M8 3.6v2.4M12 3.6v2.4"/>',
    '<rect x="3.5" y="8" width="17" height="10" rx="2.5"/><circle cx="12" cy="13" r="2.4"/><path d="M6.5 11v4M17.5 11v4"/>',
    '<path d="M6 17.5h12M8 14c0-3 1.3-6 4-6s4 3 4 6M12 8V5.5"/>'
  ];
  var COL = ['#38bdf8', '#22d3ee', '#34d399', '#a78bfa', '#f59e0b', '#f472b6', '#fbbf24', '#60a5fa'];
  function scatter(n) {
    var wide = innerWidth > innerHeight * 1.05, cols = wide ? 10 : 5, rows = Math.ceil(n / cols), out = '', seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var cells = []; for (var i = 0; i < cols * rows; i++) cells.push(i);
    for (var k = cells.length - 1; k > 0; k--) { var j = Math.floor(rnd() * (k + 1)), t = cells[k]; cells[k] = cells[j]; cells[j] = t; }
    for (var c = 0; c < n; c++) {
      var cell = cells[c], cx = cell % cols, cy = Math.floor(cell / cols);
      var x = ((cx + .12 + rnd() * .76) / cols * 100).toFixed(1), y = ((cy + .12 + rnd() * .76) / rows * 100).toFixed(1);
      var s = 20 + Math.round(rnd() * 16), o = (.22 + rnd() * .2).toFixed(2), r = Math.round(rnd() * 50 - 25);
      out += '<i style="--x:' + x + '%;--y:' + y + '%;--s:' + s + 'px;--o:' + o + ';--r:' + r + 'deg;--c:' + COL[c % COL.length] + ';--t:' + (5 + rnd() * 5).toFixed(1) + 's;--d:' + (rnd() * 3).toFixed(2) + 's;--e:' + (.15 + rnd() * 1.2).toFixed(2) + 's"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ICONS[c % ICONS.length] + '</svg></i>';
    }
    return '<div class="wl-scatter" aria-hidden="true">' + out + '</div>';
  }
  var base = welcomeHtml;
  welcomeHtml = function () {
    var nm = (typeof esc === 'function' ? esc : function (x) { return x; })((window.P && P.name) || 'teman');
    var row = function (bg, ico, t, d, i) { return '<li style="--i:' + i + '"><span class="wl2-fi" style="background:' + bg + '"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + ico + '</svg></span><span class="wl2-ft"><b>' + t + '</b><small>' + d + '</small></span></li>'; };
    return scatter(50) + '<div class="wl-fin" hidden></div><div class="wl2">' +
      '<div class="wl2-icon" aria-hidden="true">' + (typeof logoMark === 'function' ? logoMark() : '') + '</div>' +
      '<p class="wl2-hi">Halo, ' + nm + '</p>' +
      '<h1 class="wl2-title">Selamat datang<br>di <span>DuitKu</span></h1>' +
      '<ul class="wl2-feats">' +
        row('linear-gradient(160deg,#ffcf4d,#f59e0b)', ICONS[1], 'Catat dengan cepat', 'Pemasukan dan pengeluaran tercatat rapi dalam hitungan detik.', 1) +
        row('linear-gradient(160deg,#5ac8fa,#0a84ff)', ICONS[2], 'Pantau anggaran', 'Batasi belanja per kategori dan lihat sisa dananya setiap hari.', 2) +
        row('linear-gradient(160deg,#6ee7a0,#30b562)', ICONS[6], 'Capai targetmu', 'Kumpulkan tabungan menuju tujuan dan rayakan setiap kemajuan.', 3) +
      '</ul>' +
      '<button type="button" class="wl2-btn">Mulai</button>' +
      '</div><div class="wl-bar" aria-hidden="true"><i></i></div>';
  };
})();
