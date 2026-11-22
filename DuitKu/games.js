/* DuitKu Mini Games — peluncur game, kerangka layar penuh, dan Coin Catcher.
   Money Tycoon ada di tycoon.js. Semua koin/skor bersifat virtual dan tidak terhubung ke saldo atau transaksi DuitKu. */
(function () {
  'use strict';
  var GK = 'duitku_game_data';
  function gload() { try { var o = JSON.parse(localStorage.getItem(GK)); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function gsave(o) { try { localStorage.setItem(GK, JSON.stringify(o)); } catch (e) {} }
  /* data game lama (sudah tidak ada) dibersihkan dari penyimpanan */
  (function () { var g = gload(); if (g.bb || 'sound' in g) { delete g.bb; delete g.sound; gsave(g); } })();

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtN(n) {
    n = Math.floor(Math.max(0, n));
    if (n < 1000) return String(n);
    var u = [['T', 1e12], ['M', 1e9], ['jt', 1e6], ['rb', 1e3]];
    for (var i = 0; i < u.length; i++) {
      if (n >= u[i][1]) {
        var x = n / u[i][1], s = x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2);
        if (s.indexOf('.') > -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
        return s.replace('.', ',') + ' ' + u[i][0];
      }
    }
    return String(n);
  }

  var I = {
    back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    music: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
    sfx: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.8l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 21s-7.5-4.6-9.6-9.3C1 8.4 3 5 6.4 5c2 0 3.5 1 4.3 2.4h2.6C14.1 6 15.600 5 17.600 5 21 5 23 8.400 21.600 11.700 19.500 16.400 12 21 12 21z" fill="currentColor"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 21h8M9.500 18h5"/></svg>',
    target: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.200" fill="currentColor"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    rot: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/></svg>',
    minus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    fit: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/></svg>',
    coin: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#ffd60a"/><circle cx="12" cy="12" r="7.200" fill="none" stroke="#c99700" stroke-width="1.600"/><path d="M12 7v10M14.500 9.300c-.6-.8-1.400-1.200-2.500-1.200-1.400 0-2.400.7-2.400 1.800s1 1.500 2.400 1.900c1.500.4 2.500.8 2.500 1.900s-1 1.800-2.500 1.800c-1 0-1.900-.4-2.500-1.200" fill="none" stroke="#a37400" stroke-width="1.500" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2.500l2.900 6 6.600.9-4.800 4.600 1.200 6.500-5.900-3.100-5.900 3.100 1.200-6.500L2.500 9.400l6.600-.9z" fill="currentColor"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.100a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.100a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.100a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.100a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  var GAMES = {}, layer = null, active = null, stageEl = null;
  var api = {
    sfx: function (n, v) { if (window.DKAudio) DKAudio.sfx(n, v); },
    music: function (n) { if (window.DKAudio) DKAudio.play(n); },
    stopMusic: function () { if (window.DKAudio) DKAudio.stop(); },
    load: gload, save: gsave, esc: esc, fmtN: fmtN, icon: I,
    close: function () { closeGame(); }
  };

  function shellHtml(def) {
    var a = window.DKAudio ? DKAudio.state() : { music: false, sfx: false };
    return '<header class="gl-bar"><button type="button" class="gl-back" data-g="close" aria-label="Kembali ke Mini Games">' + I.back + '<span>Mini Games</span></button><b class="gl-title">' + esc(def.title) + '</b>' +
      '<div class="gl-ctl"><button type="button" class="gl-ic' + (a.music ? ' on' : '') + '" data-g="music" aria-label="Musik" aria-pressed="' + a.music + '">' + I.music + '</button><button type="button" class="gl-ic' + (a.sfx ? ' on' : '') + '" data-g="sfx" aria-label="Efek suara" aria-pressed="' + a.sfx + '">' + I.sfx + '</button></div></header><div class="gl-stage" id="glStage"></div>';
  }
  function syncAudioBtns() {
    if (!layer || !window.DKAudio) return;
    var a = DKAudio.state();
    [['music', a.music], ['sfx', a.sfx]].forEach(function (p) { var b = layer.querySelector('[data-g="' + p[0] + '"]'); if (b) { b.classList.toggle('on', p[1]); b.setAttribute('aria-pressed', p[1]); } });
  }
  function onLayerClick(e) {
    var b = e.target.closest && e.target.closest('[data-g]'); if (!b || !layer || !layer.contains(b)) return;
    var k = b.dataset.g;
    if (k === 'close') { requestClose(); return; }
    if (k === 'music') { DKAudio.toggle('music'); DKAudio.unlock(); syncAudioBtns(); if (DKAudio.state().music && active && active.def.musicTrack && active.def.wantsMusic && active.def.wantsMusic()) DKAudio.play(active.def.musicTrack); return; }
    if (k === 'sfx') { var on = DKAudio.toggle('sfx'); syncAudioBtns(); if (on) DKAudio.sfx('click'); return; }
    if (active && active.def.onClick) active.def.onClick(b, e);
  }
  function onKey(e) {
    if (!layer) return;
    if (e.key === 'Escape') { if (active && active.def.onEscape && active.def.onEscape()) return; requestClose(); }
  }
  function requestClose() {
    if (window.DKNav && DKNav.has('game')) DKNav.back('game'); else closeNow();
  }
  function openGame(id) {
    var def = GAMES[id]; if (!def || layer) return;
    layer = document.createElement('div'); layer.id = 'gl'; layer.className = 'gl gl-' + id;
    layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-label', def.title);
    layer.innerHTML = shellHtml(def);
    document.body.appendChild(layer); document.documentElement.classList.add('gl-open');
    stageEl = layer.querySelector('#glStage'); active = { id: id, def: def };
    layer.addEventListener('click', onLayerClick);
    document.addEventListener('keydown', onKey);
    if (window.DKNav) DKNav.push('game', closeNow, function () { try { return !!(active && active.def.onBack && active.def.onBack()); } catch (e) { return false; } });
    if (window.DKAudio) DKAudio.unlock();
    def.mount(stageEl, api);
  }
  function closeNow() {
    if (!layer) return;
    try { if (active && active.def.unmount) active.def.unmount(); } catch (e) { console.error(e); }
    if (window.DKAudio) DKAudio.stop();
    document.removeEventListener('keydown', onKey);
    layer.remove(); layer = null; active = null; stageEl = null;
    document.documentElement.classList.remove('gl-open');
    try { if (typeof page !== 'undefined' && page === 'game' && typeof render === 'function') render(); } catch (e) {}
  }
  function closeGame() { requestClose(); }

  /* ============ Peluncur: halaman Mini Games ============ */
  var ART_COIN = '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="gaSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#fde68a"/></linearGradient><linearGradient id="gaW" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs><rect width="320" height="200" fill="url(#gaSky)"/><g fill="#fff" opacity=".8"><ellipse cx="60" cy="40" rx="30" ry="9"/><ellipse cx="80" cy="34" rx="20" ry="8"/><ellipse cx="250" cy="60" rx="26" ry="8"/></g><g fill="#0ea5e9" opacity=".25"><rect x="10" y="120" width="30" height="80"/><rect x="46" y="100" width="26" height="100"/><rect x="250" y="110" width="34" height="90"/><rect x="290" y="132" width="30" height="68"/></g><g><circle cx="90" cy="46" r="13" fill="#ffd60a" stroke="#c99700" stroke-width="3"/><circle cx="160" cy="84" r="13" fill="#ffd60a" stroke="#c99700" stroke-width="3"/><circle cx="228" cy="38" r="13" fill="#ffd60a" stroke="#c99700" stroke-width="3"/><rect x="196" y="96" width="26" height="18" rx="3" fill="#ff453a" transform="rotate(14 209 105)"/></g><g transform="translate(130 128)"><rect width="76" height="50" rx="14" fill="url(#gaW)"/><rect x="48" y="16" width="30" height="18" rx="9" fill="#fff" opacity=".9"/><circle cx="62" cy="25" r="3.500" fill="#0ea5e9"/><circle cx="22" cy="20" r="4" fill="#0b2b3a"/><circle cx="40" cy="20" r="4" fill="#0b2b3a"/></g><rect y="180" width="320" height="20" fill="#16a34a" opacity=".85"/></svg>';
  var ART_TYCOON = '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="gtSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5b4fc"/><stop offset="1" stop-color="#fbcfe8"/></linearGradient></defs><rect width="320" height="200" fill="url(#gtSky)"/><g transform="translate(160 150)"><path d="M0 40L-130 -25 0 -90 130 -25z" fill="#86efac"/><path d="M0 40L-130 -25 0 -90 130 -25z" fill="none" stroke="#4ade80" stroke-width="2"/>' +
    '<g transform="translate(-52 -8)"><path d="M0 0L-26 -13 0 -26 26 -13z" fill="#fde68a"/><path d="M-26 -13L0 0V-34L-26 -47z" fill="#f59e0b"/><path d="M0 0L26 -13V-47L0 -34z" fill="#d97706"/><path d="M-26 -47L0 -34 26 -47 0 -60z" fill="#fca5a5"/></g>' +
    '<g transform="translate(42 -4)"><path d="M0 0L-30 -15 0 -30 30 -15z" fill="#bfdbfe"/><path d="M-30 -15L0 0V-62L-30 -77z" fill="#60a5fa"/><path d="M0 0L30 -15V-77L0 -62z" fill="#3b82f6"/><path d="M-30 -77L0 -62 30 -77 0 -92z" fill="#e0f2fe"/></g>' +
    '<g transform="translate(-6 -42)"><path d="M0 0L-32 -16 0 -32 32 -16z" fill="#fecaca"/><path d="M-32 -16L0 0V-44L-32 -60z" fill="#f87171"/><path d="M0 0L32 -16V-60L0 -44z" fill="#dc2626"/><path d="M-32 -60L0 -44 32 -60 0 -76z" fill="#fee2e2"/></g></g><g><circle cx="52" cy="46" r="11" fill="#ffd60a" stroke="#c99700" stroke-width="3"/><circle cx="268" cy="70" r="9" fill="#ffd60a" stroke="#c99700" stroke-width="3"/></g></svg>';

  function bestOf(k, f) { var o = gload()[k]; return o && o[f] || 0; }
  function launcherHtml() {
    var g = gload(), cb = bestOf('coin', 'best'), tb = bestOf('tycoon', 'best'), tp = (g.tycoon && g.tycoon.level) || 0;
    function card(id, cls, art, title, desc, chips, cta) {
      return '<article class="arc-card ' + cls + '"><div class="arc-art">' + art + '</div><div class="arc-body"><h2>' + title + '</h2><p>' + desc + '</p><div class="arc-chips">' + chips + '</div><button type="button" class="btn arc-play" data-act="gplay" data-g="' + id + '">' + cta + '</button></div></article>';
    }
    return '<header class="hd"><div><h1>Mini Games</h1><p class="muted">Hiburan ringan, lengkap dengan musik dan efek suara. Koin dan skor di sini bersifat virtual: tidak terhubung dengan saldo, transaksi, anggaran, atau data keuangan nyatamu.</p></div></header>' +
      '<div class="arc-grid">' +
      card('coin', 'arc-coin', ART_COIN, 'Coin Catcher', 'Geser dompet untuk menangkap koin emas, hindari tagihan merah, kumpulkan power-up, dan jaga rangkaian combo.', '<span class="arc-chip">Rekor <b>' + cb + '</b></span><span class="arc-chip">Refleks</span>', cb ? 'Main lagi' : 'Main') +
      card('tycoon', 'arc-tycoon', ART_TYCOON, 'Money Tycoon', 'Bangun kota bisnis isometrik dari satu toko kecil: restoran, minimarket, pusat perbelanjaan, hingga gedung bank. Idle tycoon dengan misi dan pencapaian.', '<span class="arc-chip">Skor tertinggi <b>' + fmtN(tb) + '</b></span>' + (tp ? '<span class="arc-chip">Level kota <b>' + tp + '</b></span>' : '<span class="arc-chip">Simulasi</span>'), tp ? 'Lanjutkan kota' : 'Mulai membangun') +
      '</div>';
  }

  /* ============ Coin Catcher ============ */
  var CC = (function () {
    var H = 640, W = 360, scale = 1, dpr = 1, cv, cx, stage, ro, raf = 0, last = 0, root;
    var G, sky, skyline, clouds, stars, hud = {}, keysBound = false;
    var PAL = [['#7dd3fc', '#fef3c7', 0], ['#38bdf8', '#fed7aa', 0], ['#fb923c', '#a78bfa', 0.15], ['#6d28d9', '#1e1b4b', 0.7], ['#0f172a', '#312e81', 1]];

    function mix(a, b, t) { return a + (b - a) * t; }
    function hex(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    function mixC(a, b, t) { var x = hex(a), y = hex(b); return 'rgb(' + Math.round(mix(x[0], y[0], t)) + ',' + Math.round(mix(x[1], y[1], t)) + ',' + Math.round(mix(x[2], y[2], t)) + ')'; }
    function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

    function newState() {
      return { st: 'idle', items: [], parts: [], pops: [], score: 0, lives: 3, level: 1, caught: 0, combo: 0, maxCombo: 0, spawn: 0.6, t: 0, shake: 0, flash: 0, banner: 0, bannerTxt: '', blink: 0,
        p: { x: W / 2, tx: W / 2, w: 80, h: 50, vx: 0, look: 0 }, pw: { magnet: 0, x2: 0, shield: 0 }, keys: { l: 0, r: 0 }, best: bestOf('coin', 'best'), newBest: false, dragging: false, skyT: 0 };
    }
    function genWorld() {
      skyline = [[], []];
      for (var L = 0; L < 2; L++) { var x = 0; while (x < 2700) { var w = 26 + Math.random() * 40, h = (L ? 70 : 110) + Math.random() * (L ? 70 : 120); skyline[L].push({ x: x, w: w, h: h, seed: Math.random() }); x += w + 4 + Math.random() * 10; } }
      clouds = []; for (var i = 0; i < 5; i++) clouds.push({ x: Math.random() * W, y: 40 + Math.random() * 180, s: 0.6 + Math.random() * 0.9, v: 4 + Math.random() * 8 });
      stars = []; for (var j = 0; j < 46; j++) stars.push({ x: Math.random() * 1000, y: Math.random() * 360, r: Math.random() * 1.4 + 0.3, ph: Math.random() * 6 });
    }

    function mount(stg, ap) {
      stage = stg;
      stage.innerHTML = '<div class="cc"><div class="cc-field"><canvas id="ccv" aria-label="Area permainan Coin Catcher"></canvas>' +
        '<div class="cc-hud" id="ccHud"><div class="cc-chip"><small>Skor</small><b id="ccScore">0</b></div><div class="cc-chip"><small>Level</small><b id="ccLevel">1</b></div><div class="cc-chip cc-lives" id="ccLives" aria-label="Nyawa"></div><div class="cc-chip cc-best"><small>Rekor</small><b id="ccBest">0</b></div><button type="button" class="cc-pause" data-g="ccpause" aria-label="Jeda">' + I.pause + '</button></div>' +
        '<div class="cc-pw" id="ccPw"></div><div class="cc-combo" id="ccCombo" hidden></div><div class="cc-ov" id="ccOv"></div></div></div>';
      root = stage.querySelector('.cc'); cv = stage.querySelector('#ccv'); cx = cv.getContext('2d');
      hud = { score: stage.querySelector('#ccScore'), level: stage.querySelector('#ccLevel'), lives: stage.querySelector('#ccLives'), best: stage.querySelector('#ccBest'), pw: stage.querySelector('#ccPw'), combo: stage.querySelector('#ccCombo'), ov: stage.querySelector('#ccOv'), pause: stage.querySelector('.cc-pause') };
      G = newState(); sky = 0; genWorld(); fit();
      ro = new ResizeObserver(function () { fit(); }); ro.observe(stage);
      var f = stage.querySelector('.cc-field');
      f.addEventListener('pointerdown', onDown); f.addEventListener('pointermove', onMove); f.addEventListener('pointerup', onUp); f.addEventListener('pointercancel', onUp); f.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') G.dragging = false; });
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); document.addEventListener('visibilitychange', vis);
      hud.best.textContent = G.best; renderLives(); showOverlay('idle'); draw(); loopOnce();
      if (window.__DUITKU_TEST) window.__coin = G;
    }
    function unmount() {
      cancelAnimationFrame(raf); if (ro) ro.disconnect(); ro = null;
      document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); document.removeEventListener('visibilitychange', vis);
      G = null;
    }
    function fit() {
      if (!stage || !cv) return;
      var r = stage.getBoundingClientRect(), sw = Math.max(200, Math.min(r.width, document.documentElement.clientWidth)), sh = Math.max(300, r.height);
      var aspect = sw / sh, nw = Math.max(340, Math.min(1240, aspect * H));
      if (G && (G.st === 'run')) nw = W; // jangan ubah dunia saat bermain
      if (nw !== W && G) { var k = nw / W; G.p.x *= k; G.p.tx *= k; G.items.forEach(function (it) { it.x *= k; }); }
      W = nw; scale = Math.min(sw / W, sh / H); dpr = Math.min(2, window.devicePixelRatio || 1);
      var cssW = Math.floor(W * scale), cssH = Math.floor(H * scale);
      cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
      var f = stage.querySelector('.cc-field'); f.style.width = cssW + 'px'; f.style.height = cssH + 'px';
      cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
      cx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      stage.style.setProperty('--ccs', scale.toFixed(3));
      if (G && G.st !== 'run') { draw(); }
    }

    /* ---- kontrol ---- */
    function px(e) { var r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; }
    function clampX(x) { return Math.max(G.p.w / 2, Math.min(W - G.p.w / 2, x)); }
    function onDown(e) { if (!G || G.st !== 'run') return; G.dragging = true; G.p.tx = clampX(px(e)); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} }
    function onMove(e) { if (!G || G.st !== 'run') return; if (G.dragging || e.pointerType === 'mouse') G.p.tx = clampX(px(e)); }
    function onUp() { if (G) G.dragging = false; }
    function kd(e) {
      if (!G || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { G.keys.l = 1; if (G.st === 'run') e.preventDefault(); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { G.keys.r = 1; if (G.st === 'run') e.preventDefault(); }
      else if (k === 'p' || k === 'P') { toggle(); }
      else if ((k === ' ' || k === 'Enter') && G.st !== 'run' && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); if (G.st === 'pause') resume(); else start(); }
      else if (k === ' ' && G.st === 'run') { e.preventDefault(); pause(); }
    }
    function ku(e) { if (!G) return; var k = e.key; if (k === 'ArrowLeft' || k === 'a' || k === 'A') G.keys.l = 0; else if (k === 'ArrowRight' || k === 'd' || k === 'D') G.keys.r = 0; }
    function vis() { if (document.hidden && G && G.st === 'run') pause(); }

    /* ---- alur permainan ---- */
    function start() {
      var best = G.best; G = newState(); G.best = best; if (window.__DUITKU_TEST) window.__coin = G;
      G.st = 'run'; last = performance.now(); hud.score.textContent = 0; hud.level.textContent = 1; renderLives(); renderPw(); showOverlay('run');
      if (DKAudio.state().music) DKAudio.play('arcade'); api0.sfx('power', 0.6); hud.pause.innerHTML = I.pause;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function pause() { if (!G || G.st !== 'run') return; G.st = 'pause'; cancelAnimationFrame(raf); DKAudio.stop(); showOverlay('pause'); hud.pause.innerHTML = I.play; draw(); }
    function resume() { if (!G || G.st !== 'pause') return; G.st = 'run'; last = performance.now(); showOverlay('run'); if (DKAudio.state().music) DKAudio.play('arcade'); hud.pause.innerHTML = I.pause; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    function toggle() { if (!G) return; if (G.st === 'run') pause(); else if (G.st === 'pause') resume(); }
    function over() {
      G.st = 'over'; cancelAnimationFrame(raf); DKAudio.stop(); api0.sfx('over');
      var g = gload(); g.coin = g.coin || {};
      if (G.score > (g.coin.best || 0)) { g.coin.best = G.score; G.newBest = true; }
      G.best = g.coin.best || 0; g.coin.plays = (g.coin.plays || 0) + 1; g.coin.caught = (g.coin.caught || 0) + G.caught; gsave(g);
      hud.best.textContent = G.best; showOverlay('over'); hud.pause.innerHTML = I.pause; draw();
    }
    var api0 = api;

    function spawn() {
      var lv = G.level, r = Math.random(), bill = Math.min(0.34, 0.12 + lv * 0.018), t;
      if (r < bill) t = 'bill';
      else if (r < bill + 0.045) t = 'gem';
      else if (r < bill + 0.065 && G.lives < 5) t = 'heart';
      else if (r < bill + 0.1) t = ['magnet', 'x2', 'shield'][Math.floor(Math.random() * 3)];
      else t = 'coin';
      var rad = t === 'coin' ? 15 : t === 'bill' ? 18 : 17;
      G.items.push({ t: t, x: rad + 8 + Math.random() * (W - 2 * rad - 16), y: -30, vy: (150 + lv * 20 + Math.random() * 55) * (t === 'bill' ? 1.1 : t === 'gem' ? 1.2 : 1), r: rad, rot: Math.random() * 6, vr: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3), ph: Math.random() * 6 });
    }
    function burst(x, y, col, n, spd) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.283, s = (spd || 100) * (0.4 + Math.random()); G.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 50, l: 0.55 + Math.random() * 0.3, m: 0.85, c: col, r: 1.5 + Math.random() * 2.4 }); } }
    function pop(x, y, txt, col) { G.pops.push({ x: x, y: y, t: 0, txt: txt, c: col || '#fff' }); }
    function mult() { return Math.min(8, 1 + Math.floor(G.combo / 5)) * (G.pw.x2 > 0 ? 2 : 1); }

    function update(dt) {
      var p = G.p; G.t += dt; G.blink -= dt; if (G.blink < -2.6) G.blink = 0.14;
      var dir = (G.keys.r ? 1 : 0) - (G.keys.l ? 1 : 0);
      if (dir) p.tx = clampX(p.tx + dir * 470 * dt);
      var ox = p.x; p.x += (p.tx - p.x) * Math.min(1, dt * 18); p.vx = (p.x - ox) / Math.max(dt, 0.001);
      ['magnet', 'x2', 'shield'].forEach(function (k) { if (G.pw[k] > 0) { G.pw[k] -= dt; if (G.pw[k] <= 0) { G.pw[k] = 0; renderPw(); } } });
      G.spawn -= dt;
      if (G.spawn <= 0) { G.spawn = Math.max(0.28, 0.82 - G.level * 0.05) * (0.7 + Math.random() * 0.6); spawn(); }
      var py = H - 76, mouth = p.w * 0.46, near = null;
      for (var i = G.items.length - 1; i >= 0; i--) {
        var it = G.items[i];
        if (G.pw.magnet > 0 && (it.t === 'coin' || it.t === 'gem') && it.y > 60) { var dx = p.x - it.x, dy = py - it.y, d = Math.hypot(dx, dy); if (d < 190) { var f = (1 - d / 190) * 520 * dt; it.x += dx / (d || 1) * f; it.y += dy / (d || 1) * f * 0.6; } }
        it.y += it.vy * dt; it.rot += it.vr * dt;
        if (!near && it.t !== 'bill' && it.y < py && it.y > py - 160) near = it;
        if (it.y > py - 22 && it.y < py + 14 && Math.abs(it.x - p.x) < mouth + it.r * 0.5) { G.items.splice(i, 1); catchItem(it); continue; }
        if (it.y > H - 44) {
          G.items.splice(i, 1);
          if (it.t === 'coin' || it.t === 'gem') { if (G.combo > 2) pop(it.x, H - 56, 'combo putus', '#ffd0d0'); G.combo = 0; hudCombo(); }
          burst(it.x, H - 46, it.t === 'bill' ? '#ff6961' : '#ffe066', 4, 60);
        }
      }
      p.look += ((near ? (near.x - p.x) / 60 : 0) - p.look) * Math.min(1, dt * 8);
      for (var j = G.parts.length - 1; j >= 0; j--) { var q = G.parts[j]; q.l -= dt; if (q.l <= 0) { G.parts.splice(j, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 360 * dt; }
      for (var k = G.pops.length - 1; k >= 0; k--) { var o = G.pops[k]; o.t += dt; o.y -= 38 * dt; if (o.t > 0.9) G.pops.splice(k, 1); }
      G.shake = Math.max(0, G.shake - dt * 4); G.flash = Math.max(0, G.flash - dt * 2.4); G.banner = Math.max(0, G.banner - dt);
      var targetSky = Math.min(PAL.length - 1, (G.level - 1) * 0.5); G.skyT += (targetSky - G.skyT) * Math.min(1, dt * 0.8);
    }
    function catchItem(it) {
      var p = G.p, y = H - 90;
      if (it.t === 'coin' || it.t === 'gem') {
        G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
        var v = (it.t === 'gem' ? 50 : 10) * mult(); G.score += v; G.caught++;
        pop(it.x, y, '+' + v, it.t === 'gem' ? '#7dd3fc' : '#ffe066'); burst(it.x, y, it.t === 'gem' ? '#7dd3fc' : '#ffd60a', it.t === 'gem' ? 14 : 8);
        api0.sfx(it.t === 'gem' ? 'gold' : 'coin');
        if (G.caught % 12 === 0) levelUp();
        hudScore(); hudCombo();
      } else if (it.t === 'bill') {
        if (G.pw.shield > 0) { G.pw.shield = 0; renderPw(); pop(it.x, y, 'tertahan!', '#9be7ff'); burst(it.x, y, '#7dd3fc', 14); api0.sfx('power', 0.6); }
        else { G.lives--; G.combo = 0; G.shake = 0.6; G.flash = 1; pop(it.x, y, '−1 nyawa', '#ff8a80'); burst(it.x, y, '#ff6961', 14, 140); api0.sfx('bill'); renderLives(); hudCombo(); if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {} if (G.lives <= 0) { over(); return; } }
      } else if (it.t === 'heart') { G.lives = Math.min(5, G.lives + 1); pop(it.x, y, '+1 nyawa', '#ff9ec7'); burst(it.x, y, '#ff7eb6', 12); api0.sfx('heart'); renderLives(); }
      else { G.pw[it.t] = it.t === 'shield' ? 14 : 9; pop(it.x, y, { magnet: 'Magnet!', x2: 'Skor ×2!', shield: 'Perisai!' }[it.t], '#fff'); burst(it.x, y, '#fff', 12); api0.sfx('power'); renderPw(); }
    }
    function levelUp() { G.level++; G.banner = 1.8; G.bannerTxt = 'LEVEL ' + G.level; api0.sfx('level'); hud.level.textContent = G.level; G.score += 100; hudScore(); }

    /* ---- HUD DOM ---- */
    function hudScore() { hud.score.textContent = G.score; if (G.score > G.best) hud.best.textContent = G.score; }
    function hudCombo() { var m = mult(); if (G.combo >= 3) { hud.combo.hidden = false; hud.combo.innerHTML = 'Combo <b>' + G.combo + '</b> · ×' + m; } else hud.combo.hidden = true; }
    function renderLives() { var h = ''; for (var i = 0; i < 5; i++) h += '<span class="' + (i < G.lives ? 'on' : '') + '">' + I.heart + '</span>'; hud.lives.innerHTML = h; }
    function renderPw() {
      var n = { magnet: 'Magnet', x2: 'Skor ×2', shield: 'Perisai' }, h = '';
      Object.keys(n).forEach(function (k) { if (G.pw[k] > 0) h += '<span class="pw-' + k + '">' + n[k] + '</span>'; });
      hud.pw.innerHTML = h;
    }
    function showOverlay(kind) {
      var o = hud.ov; if (kind === 'run') { o.hidden = true; o.innerHTML = ''; return; } o.hidden = false;
      if (kind === 'idle') o.innerHTML = '<div class="cc-card"><div class="cc-ico">' + I.coin + '</div><h3>Coin Catcher</h3><p>Geser jari (atau mouse / tombol ← →) untuk menggerakkan dompet. Tangkap koin, hindari tagihan merah.</p><ul class="cc-legend"><li><i class="lg-coin"></i>Koin +10</li><li><i class="lg-gem"></i>Permata +50</li><li><i class="lg-bill"></i>Tagihan −1 nyawa</li><li><i class="lg-heart"></i>Hati +1 nyawa</li></ul><button type="button" class="btn cc-go" data-g="ccstart">Mulai bermain</button><small>Rekor: <b>' + G.best + '</b></small></div>';
      else if (kind === 'pause') o.innerHTML = '<div class="cc-card"><h3>Jeda</h3><p>Skor <b>' + G.score + '</b> · Level ' + G.level + '</p><button type="button" class="btn cc-go" data-g="ccresume">Lanjutkan</button><button type="button" class="btn ghost" data-g="ccstart">Mulai ulang</button></div>';
      else o.innerHTML = '<div class="cc-card"><h3>' + (G.newBest ? 'Rekor baru!' : 'Permainan selesai') + '</h3><div class="cc-final"><b>' + G.score + '</b><small>skor · level ' + G.level + ' · combo terbaik ' + G.maxCombo + '</small></div><p class="muted">Rekor tertinggi: <b>' + G.best + '</b></p><button type="button" class="btn cc-go" data-g="ccstart">Main lagi</button><button type="button" class="btn ghost" data-g="close">Kembali</button></div>';
    }
    function onClick(b) {
      var k = b.dataset.g;
      if (k === 'ccstart') { api0.sfx('click'); start(); }
      else if (k === 'ccresume') { api0.sfx('click'); resume(); }
      else if (k === 'ccpause') { toggle(); }
    }

    /* ---- gambar ---- */
    function drawSky() {
      var f = Math.min(PAL.length - 1.001, G.skyT), i = Math.floor(f), t = f - i, a = PAL[i], b = PAL[i + 1];
      var g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mixC(a[0], b[0], t)); g.addColorStop(1, mixC(a[1], b[1], t));
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      var night = mix(a[2], b[2], t);
      if (night > 0.05) { cx.save(); cx.fillStyle = '#fff'; stars.forEach(function (s) { var tw = 0.5 + 0.5 * Math.sin(G.t * 2 + s.ph); cx.globalAlpha = night * (0.35 + 0.65 * tw); cx.beginPath(); cx.arc(s.x % W, s.y, s.r, 0, 6.283); cx.fill(); }); cx.restore(); }
      cx.save(); cx.globalAlpha = 0.85 - night * 0.6; cx.fillStyle = '#fff';
      clouds.forEach(function (c) { c.x += c.v * 0.016; if (c.x > W + 80) c.x = -80; cx.beginPath(); cx.ellipse(c.x, c.y, 38 * c.s, 11 * c.s, 0, 0, 6.283); cx.ellipse(c.x + 22 * c.s, c.y - 7 * c.s, 24 * c.s, 9 * c.s, 0, 0, 6.283); cx.ellipse(c.x - 24 * c.s, c.y - 4 * c.s, 22 * c.s, 8 * c.s, 0, 0, 6.283); cx.fill(); });
      cx.restore();
      [0, 1].forEach(function (L) {
        var off = (G.t * (L ? 7 : 3)) % (W * 2 + 200), col = L ? mixC('#38bdf8', '#312e81', Math.min(1, night + 0.15)) : mixC('#0ea5e9', '#1e1b4b', Math.min(1, night + 0.1));
        cx.save(); cx.globalAlpha = L ? 0.55 : 0.4; cx.fillStyle = col;
        skyline[L].forEach(function (b) { var x = ((b.x - off) % 2700 + 2700) % 2700 - 100; if (x > W + 60 || x < -b.w - 60) return; cx.fillRect(x, H - 44 - b.h, b.w, b.h + 4); if (night > 0.25) { cx.fillStyle = 'rgba(255,230,140,' + (night * 0.8) + ')'; for (var wy = H - 44 - b.h + 8; wy < H - 52; wy += 14) for (var wx = x + 5; wx < x + b.w - 6; wx += 10) if ((Math.floor(wx * 7 + wy * 3 + b.seed * 50) % 3) === 0) cx.fillRect(wx, wy, 4, 6); cx.fillStyle = col; } });
        cx.restore();
      });
      var gg = cx.createLinearGradient(0, H - 44, 0, H); gg.addColorStop(0, mixC('#34d399', '#065f46', night)); gg.addColorStop(1, mixC('#16a34a', '#022c22', night));
      cx.fillStyle = gg; cx.fillRect(0, H - 44, W, 44); cx.fillStyle = 'rgba(255,255,255,.18)'; cx.fillRect(0, H - 44, W, 3);
    }
    function drawItem(it) {
      var c = cx; c.save(); c.translate(it.x, it.y);
      if (it.t === 'coin') {
        var sx = Math.max(0.16, Math.abs(Math.cos(it.rot))); c.scale(sx, 1);
        c.shadowColor = 'rgba(255,214,10,.6)'; c.shadowBlur = 12;
        c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(0, 0, it.r, 0, 6.283); c.fill(); c.shadowBlur = 0;
        c.strokeStyle = '#c99700'; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, it.r - 2, 0, 6.283); c.stroke();
        c.strokeStyle = '#b07d00'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -7); c.lineTo(0, 7); c.moveTo(3.4, -4.2); c.bezierCurveTo(2, -6, -4.400, -5.200, -3.600, -2); c.bezierCurveTo(-3, 0.400, 3.600, 0.200, 3.600, 3.200); c.bezierCurveTo(3.600, 6, -2, 6.200, -3.600, 4.200); c.stroke();
      } else if (it.t === 'gem') {
        c.rotate(Math.sin(it.rot) * 0.2); c.shadowColor = 'rgba(125,211,252,.8)'; c.shadowBlur = 14;
        c.fillStyle = '#38bdf8'; c.beginPath(); c.moveTo(0, -17); c.lineTo(15, -4); c.lineTo(0, 17); c.lineTo(-15, -4); c.closePath(); c.fill(); c.shadowBlur = 0;
        c.fillStyle = '#bae6fd'; c.beginPath(); c.moveTo(0, -17); c.lineTo(-15, -4); c.lineTo(-4, -4); c.closePath(); c.fill();
        c.fillStyle = '#0ea5e9'; c.beginPath(); c.moveTo(0, 17); c.lineTo(15, -4); c.lineTo(4, -4); c.closePath(); c.fill();
      } else if (it.t === 'bill') {
        c.rotate(Math.sin(it.rot) * 0.5); c.shadowColor = 'rgba(255,69,58,.55)'; c.shadowBlur = 10;
        c.fillStyle = '#ff453a'; rr(c, -15, -19, 30, 38, 4); c.fill(); c.shadowBlur = 0;
        c.fillStyle = '#fff'; c.globalAlpha = 0.92; c.fillRect(-9, -11, 18, 3); c.fillRect(-9, -5, 14, 2.6); c.fillRect(-9, 0, 16, 2.6);
        c.globalAlpha = 1; c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 11, 4.200, 0, 6.283); c.fill(); c.fillStyle = '#ff453a'; c.font = '800 8px system-ui'; c.textAlign = 'center'; c.fillText('!', 0, 14);
      } else if (it.t === 'heart') {
        var s = 1 + Math.sin(it.ph + G.t * 6) * 0.08; c.scale(s, s); c.shadowColor = 'rgba(255,100,160,.7)'; c.shadowBlur = 12;
        c.fillStyle = '#ff5fa2'; c.beginPath(); c.moveTo(0, 14); c.bezierCurveTo(-24, -2, -12, -20, 0, -8); c.bezierCurveTo(12, -20, 24, -2, 0, 14); c.fill();
      } else {
        var col = { magnet: '#ff9f0a', x2: '#bf5af2', shield: '#0a84ff' }[it.t];
        c.shadowColor = col; c.shadowBlur = 16; c.fillStyle = col; c.beginPath(); c.arc(0, 0, 17, 0, 6.283); c.fill(); c.shadowBlur = 0;
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 17, 0, 6.283); c.stroke();
        c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round';
        if (it.t === 'x2') { c.font = '800 15px system-ui'; c.textAlign = 'center'; c.fillText('×2', 0, 5.500); }
        else if (it.t === 'magnet') { c.beginPath(); c.arc(0, 1, 7, Math.PI, 0); c.moveTo(-7, 1); c.lineTo(-7, 8); c.moveTo(7, 1); c.lineTo(7, 8); c.stroke(); }
        else { c.beginPath(); c.moveTo(0, -9); c.lineTo(8, -5); c.lineTo(7, 3); c.quadraticCurveTo(5, 8, 0, 10); c.quadraticCurveTo(-5, 8, -7, 3); c.lineTo(-8, -5); c.closePath(); c.fill(); }
      }
      c.restore();
    }
    function drawWallet() {
      var p = G.p, c = cx, y = H - 76, tilt = Math.max(-0.22, Math.min(0.22, p.vx * 0.0004));
      c.save(); c.translate(p.x, y); c.rotate(tilt);
      if (G.pw.magnet > 0) { c.strokeStyle = 'rgba(255,159,10,' + (0.35 + 0.25 * Math.sin(G.t * 8)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(0, -10, 62 + Math.sin(G.t * 6) * 4, 0, 6.283); c.stroke(); }
      if (G.pw.shield > 0) { c.fillStyle = 'rgba(10,132,255,.18)'; c.strokeStyle = 'rgba(10,132,255,' + (G.pw.shield < 3 ? 0.4 + 0.4 * Math.sin(G.t * 16) : 0.85) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(0, -8, 58, 0, 6.283); c.fill(); c.stroke(); }
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, 36, p.w * 0.5, 7, 0, 0, 6.283); c.fill();
      var w = p.w, hw = w / 2, g = c.createLinearGradient(0, -26, 0, 32); g.addColorStop(0, '#ffd84d'); g.addColorStop(1, '#f2a900');
      c.fillStyle = g; rr(c, -hw, -22, w, 54, 16); c.fill(); c.lineWidth = 3; c.strokeStyle = '#c2710c'; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, -hw + 5, -19, w - 10, 11, 8); c.fill();
      /* tutup dompet */
      c.fillStyle = '#e59a05'; rr(c, -hw - 2, -30, w + 4, 15, 8); c.fill(); c.strokeStyle = '#c2710c'; c.lineWidth = 2.5; c.stroke();
      /* grafik kecil seperti logo */
      c.strokeStyle = '#a65a06'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-hw + 12, 25); c.lineTo(-hw + 24, 17); c.lineTo(-hw + 33, 21); c.lineTo(-hw + 46, 11); c.stroke();
      /* kancing */
      c.fillStyle = '#fff'; c.strokeStyle = '#c2710c'; c.lineWidth = 2.5; rr(c, hw - 34, 1, 38, 22, 11); c.fill(); c.stroke(); c.fillStyle = '#f5b301'; c.beginPath(); c.arc(hw - 15, 12, 4.4, 0, 6.283); c.fill();
      /* mata */
      var blink = G.blink > 0 && G.blink < 0.14, ex = -4 + p.look * 3;
      c.fillStyle = '#5a3205';
      if (blink) { c.fillRect(ex - 14, -2, 8, 2.4); c.fillRect(ex + 4, -2, 8, 2.4); } else { c.beginPath(); c.ellipse(ex - 10, -1, 3.8, 4.8, 0, 0, 6.283); c.ellipse(ex + 8, -1, 3.8, 4.8, 0, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 9, -2.6, 1.3, 0, 6.283); c.arc(ex + 9, -2.6, 1.3, 0, 6.283); c.fill(); }
      c.restore();
    }
    function draw() {
      if (!cx || !G) return;
      var c = cx; c.save(); c.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      if (G.shake > 0) c.translate((Math.random() - 0.5) * 14 * G.shake, (Math.random() - 0.5) * 14 * G.shake);
      drawSky();
      G.items.forEach(drawItem); drawWallet();
      c.globalCompositeOperation = 'lighter';
      G.parts.forEach(function (q) { c.globalAlpha = Math.max(0, q.l / q.m); c.fillStyle = q.c; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.283); c.fill(); });
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.textAlign = 'center'; c.font = '800 17px system-ui,-apple-system,sans-serif'; c.lineWidth = 4; c.lineJoin = 'round';
      G.pops.forEach(function (o) { c.globalAlpha = Math.max(0, 1 - o.t / 0.9); c.strokeStyle = 'rgba(0,0,0,.45)'; c.strokeText(o.txt, o.x, o.y); c.fillStyle = o.c; c.fillText(o.txt, o.x, o.y); });
      c.globalAlpha = 1;
      if (G.banner > 0) { var a = Math.min(1, G.banner * 1.5, (1.8 - G.banner) * 4), sc = 1 + (1 - Math.min(1, (1.8 - G.banner) * 3)) * 0.4; c.save(); c.translate(W / 2, H * 0.32); c.scale(sc, sc); c.globalAlpha = a; c.font = '900 40px system-ui,-apple-system,sans-serif'; c.lineWidth = 7; c.strokeStyle = 'rgba(0,0,0,.4)'; c.strokeText(G.bannerTxt, 0, 0); c.fillStyle = '#fff'; c.fillText(G.bannerTxt, 0, 0); c.restore(); }
      if (G.flash > 0) { var rg = c.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75); rg.addColorStop(0, 'rgba(255,69,58,0)'); rg.addColorStop(1, 'rgba(255,69,58,' + (G.flash * 0.55) + ')'); c.fillStyle = rg; c.fillRect(0, 0, W, H); }
      c.restore();
    }
    function loop(now) {
      if (!G || G.st !== 'run') return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      update(dt); if (G && G.st === 'run') { draw(); raf = requestAnimationFrame(loop); }
    }
    function loopOnce() { /* gambar awal sudah dilakukan; animasi awan di layar mulai tidak diperlukan */ }

    return { title: 'Coin Catcher', mount: mount, unmount: unmount, onClick: onClick, musicTrack: 'arcade', wantsMusic: function () { return G && G.st === 'run'; }, onEscape: function () { if (G && G.st === 'run') { pause(); return true; } return false; }, onBack: function () { if (G && G.st === 'run') { pause(); return true; } return false; } };
  })();

  GAMES.coin = CC;

  window.DKGames = {
    register: function (id, def) { GAMES[id] = def; },
    open: openGame, close: closeGame, isOpen: function () { return !!layer; },
    load: gload, save: gsave, fmtN: fmtN, esc: esc, icon: I
  };

  /* ---- integrasi ke halaman "Mini Games" ---- */
  if (typeof R !== 'undefined') R.game = launcherHtml;
  if (typeof A !== 'undefined') A.gplay = function (b) { openGame(b.dataset.g); };
})();
