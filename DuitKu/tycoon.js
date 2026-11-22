/* DuitKu Money Tycoon — game simulasi bisnis idle di kota isometrik 2D (canvas, tanpa pustaka).
   Mulai dari satu toko kecil; bangun, upgrade, kumpulkan koin, selesaikan misi dan pencapaian.
   Semua koin dan skor bersifat VIRTUAL: tidak terhubung ke saldo, transaksi, atau data keuangan nyata DuitKu.
   Progres + skor tertinggi disimpan di localStorage (kunci "duitku_game_data" → "tycoon"), lewat DKGames.load/save.
   Gambar bangunan: tycoon-art.js (TYArt). Musik dan efek suara: audio.js (DKAudio, lagu "city"). */
(function () {
  'use strict';
  if (!window.DKGames || !window.TYArt || !window.DKAudio) { if (window.console) console.warn('Money Tycoon: modul pendukung belum dimuat'); return; }
  var DG = DKGames, ART = TYArt, I = DG.icon, fmtN = DG.fmtN, esc = DG.esc;

  /* ====================== DATA & MODEL ====================== */
  var N = 7, ROAD = 3, MAXL = 10, SAVE_V = 1, DAY = 200;
  var KINDS = ['shop', 'cafe', 'resto', 'park', 'mart', 'mall', 'bank', 'hotel', 'tower'];
  var B = {
    shop:  { n: 'Toko Kelontong',     cost: 40,      inc: 1,      req: 1,  d: 'Toko kecil serba ada. Awal dari kerajaan bisnismu.' },
    cafe:  { n: 'Kafe',               cost: 300,     inc: 3.6,    req: 2,  d: 'Kopi dan kue untuk pekerja kota.' },
    resto: { n: 'Restoran',           cost: 1900,    inc: 19,     req: 3,  d: 'Meja penuh setiap jam makan siang.' },
    park:  { n: 'Taman Kota',         cost: 4500,    inc: 0,      req: 4,  d: 'Tidak menghasilkan koin, tetapi menambah pendapatan bangunan di sekelilingnya.' },
    mart:  { n: 'Minimarket',         cost: 9500,    inc: 90,     req: 5,  d: 'Buka 24 jam, pelanggannya tak pernah putus.' },
    mall:  { n: 'Pusat Perbelanjaan', cost: 62000,   inc: 480,    req: 7,  d: 'Ratusan toko dalam satu atap.' },
    bank:  { n: 'Gedung Bank',        cost: 400000,  inc: 2600,   req: 9,  d: 'Bunga mengalir tanpa henti.' },
    hotel: { n: 'Hotel',              cost: 2.6e6,   inc: 14500,  req: 11, d: 'Tamu dari seluruh dunia menginap di kotamu.' },
    tower: { n: 'Menara Bisnis',      cost: 21e6,    inc: 96000,  req: 13, d: 'Simbol kejayaan kota bisnismu.' }
  };
  var LV = [0, 90, 380, 1500, 5800, 23000, 95000, 380000, 1.5e6, 6e6, 24e6, 95e6, 380e6, 1.5e9, 6e9, 24e9, 95e9, 380e9, 1.5e12, 6e12];
  var ZONES = [{ n: 'Distrik Awal', req: 1 }, { n: 'Distrik Timur', req: 3 }, { n: 'Distrik Barat', req: 6 }, { n: 'Distrik Pusat', req: 9 }];
  var TARGETS = [1, 3, 8, 20, 50, 120, 300, 800, 2000, 5000, 12000, 30000, 80000, 200000, 500000, 1.2e6, 3e6, 8e6, 20e6, 60e6];
  var AUTO_COST = 2500, AUTO_LV = 3;

  function incAt(k, l) { return B[k].inc * l * (1 + 0.12 * (l - 1)); }
  function upCost(k, l) { return Math.round(B[k].cost * 0.85 * Math.pow(1.65, l - 1)); }
  function hOf(k, l) {                       /* tinggi gambar bangunan (piksel dunia) untuk sentuhan dan posisi gelembung */
    switch (k) {
      case 'shop': return 21 * (1 + (l >= 4) + (l >= 8)) + 12;
      case 'cafe': return 20 * (1 + (l >= 5) + (l >= 9)) + 10;
      case 'resto': return 22 * (1 + (l >= 3) + (l >= 7)) + 26;
      case 'mart': return 22 * (1 + (l >= 5)) + 14;
      case 'mall': return 19 * (2 + Math.floor((l - 1) / 3)) + 36;
      case 'bank': return 19 * (2 + (l >= 6)) + 14;
      case 'hotel': return 15 * (5 + Math.floor(l / 2)) + 14;
      case 'tower': return 13 * (8 + Math.floor(l * 1.2)) + 24;
      default: return 34;
    }
  }
  function zoneOf(gx, gy) { return (gx > ROAD ? 1 : 0) + (gy > ROAD ? 2 : 0); }
  function isRoad(gx, gy) { return gx === ROAD || gy === ROAD; }
  var VR = 0; /* putaran pandangan kota: 0..3 (x90 derajat) */
  function rg(gx, gy, r) { r = r == null ? VR : r; return r === 0 ? [gx, gy] : r === 1 ? [N - 1 - gy, gx] : r === 2 ? [N - 1 - gx, N - 1 - gy] : [gy, N - 1 - gx]; }
  function tcx(gx, gy) { var q = rg(gx, gy); return (q[0] - q[1]) * 32; }
  function tcy(gx, gy) { var q = rg(gx, gy); return (q[0] + q[1]) * 16; }
  function kfy(gx, gy) { return gx + ',' + gy; }
  function fmtR(r) { return r < 10 ? (Math.round(r * 10) / 10).toFixed(1).replace('.', ',') : fmtN(r); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function round2(v) { if (v < 100) return Math.max(5, Math.round(v / 5) * 5); var p = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / p) * p; }

  var ACH = [
    { id: 'first', n: 'Bos Baru', d: 'Bangun bangunan pertamamu.', t: function (S) { return S.stats.builds >= 1; } },
    { id: 'e1k', n: 'Seribu Koin', d: 'Hasilkan total 1 rb koin.', t: function (S) { return S.earned >= 1e3; } },
    { id: 'e100k', n: 'Pengusaha Muda', d: 'Hasilkan total 100 rb koin.', t: function (S) { return S.earned >= 1e5; } },
    { id: 'e10m', n: 'Konglomerat', d: 'Hasilkan total 10 jt koin.', t: function (S) { return S.earned >= 1e7; } },
    { id: 'e1b', n: 'Miliarder', d: 'Hasilkan total 1 M koin.', t: function (S) { return S.earned >= 1e9; } },
    { id: 'c100', n: 'Tangan Cepat', d: 'Kumpulkan koin 100 kali.', t: function (S) { return S.stats.collects >= 100; } },
    { id: 'b10', n: 'Kota Kecil', d: 'Miliki 10 bangunan.', t: function (S) { return cnt(S) >= 10; } },
    { id: 'b25', n: 'Kota Ramai', d: 'Miliki 25 bangunan.', t: function (S) { return cnt(S) >= 25; } },
    { id: 'u10', n: 'Tukang Renovasi', d: 'Upgrade bangunan 10 kali.', t: function (S) { return S.stats.upgrades >= 10; } },
    { id: 'l10', n: 'Mahakarya', d: 'Upgrade satu bangunan ke level 10.', t: function (S) { return any(S, function (t) { return t.l >= MAXL; }); } },
    { id: 'kinds', n: 'Serba Ada', d: 'Miliki satu dari setiap jenis bangunan.', t: function (S) { return KINDS.every(function (k) { return any(S, function (t) { return t.k === k; }); }); } },
    { id: 'cl5', n: 'Kota Berkembang', d: 'Capai level kota 5.', t: function (S) { return S.level >= 5; } },
    { id: 'cl10', n: 'Metropolis', d: 'Capai level kota 10.', t: function (S) { return S.level >= 10; } },
    { id: 'promo', n: 'Promo Besar', d: 'Gunakan Promo ×2 sebanyak 5 kali.', t: function (S) { return S.stats.promos >= 5; } },
    { id: 'bal', n: 'Pemburu Balon', d: 'Ketuk 10 balon bonus.', t: function (S) { return S.stats.balloons >= 10; } },
    { id: 'mall', n: 'Raja Belanja', d: 'Bangun Pusat Perbelanjaan.', t: function (S) { return any(S, function (t) { return t.k === 'mall'; }); } },
    { id: 'tower', n: 'Pencakar Langit', d: 'Bangun Menara Bisnis.', t: function (S) { return any(S, function (t) { return t.k === 'tower'; }); } },
    { id: 'sc', n: 'Skor 100 Rb', d: 'Capai skor 100.000.', t: function (S) { return calcScore(S) >= 1e5; } }
  ];
  function cnt(S) { return Object.keys(S.tiles).length; }
  function any(S, f) { for (var k in S.tiles) if (f(S.tiles[k])) return true; return false; }
  function assetsOf(S) { var a = 0; for (var k in S.tiles) a += S.tiles[k].inv; return a; }
  function calcScore(S) { return Math.floor(S.earned / 8 + assetsOf(S) / 4 + Object.keys(S.ach).length * 250 + S.missionsDone * 60 + (S.level - 1) * 100); }

  function newState(best) {
    var now = Date.now(), S = {
      v: SAVE_V, coins: 120, earned: 0, level: 1, tiles: {}, best: best || 0, ach: {}, missions: [], missionsDone: 0, tI: 0, auto: false,
      promoUntil: 0, promoReady: 0, intro: false, lastSeen: now, started: now,
      stats: { taps: 0, collects: 0, builds: 0, upgrades: 0, promos: 0, balloons: 0, sold: 0, play: 0, resets: 0 }
    };
    S.tiles['1,1'] = { k: 'shop', l: 1, stock: 0, inv: B.shop.cost, x: 1, y: 1 };
    return S;
  }
  function sanitize(o) {
    if (!o || typeof o !== 'object' || o.v !== SAVE_V) return null;
    var S = newState(0), num = function (v, d) { return typeof v === 'number' && isFinite(v) ? v : d; };
    S.coins = Math.max(0, num(o.coins, 120)); S.earned = Math.max(0, num(o.earned, 0)); S.level = clamp(Math.floor(num(o.level, 1)), 1, LV.length);
    S.best = Math.max(0, num(o.best, 0)); S.missionsDone = Math.max(0, Math.floor(num(o.missionsDone, 0))); S.tI = clamp(Math.floor(num(o.tI, 0)), 0, TARGETS.length);
    S.auto = !!o.auto; VR = clamp(Math.floor(num(o.view, 0)), 0, 3); S.promoUntil = num(o.promoUntil, 0); S.promoReady = num(o.promoReady, 0); S.intro = !!o.intro;
    S.lastSeen = num(o.lastSeen, Date.now()); S.started = num(o.started, Date.now());
    if (o.stats && typeof o.stats === 'object') for (var k in S.stats) S.stats[k] = Math.max(0, num(o.stats[k], 0));
    S.ach = {}; if (o.ach && typeof o.ach === 'object') ACH.forEach(function (a) { if (o.ach[a.id]) S.ach[a.id] = num(o.ach[a.id], 1); });
    S.tiles = {};
    if (o.tiles && typeof o.tiles === 'object') for (var key in o.tiles) {
      var t = o.tiles[key], p = key.split(','), gx = +p[0], gy = +p[1];
      if (!t || !B[t.k] || !(gx >= 0 && gx < N && gy >= 0 && gy < N) || isRoad(gx, gy)) continue;
      S.tiles[key] = { k: t.k, l: clamp(Math.floor(num(t.l, 1)), 1, MAXL), stock: Math.max(0, num(t.stock, 0)), inv: Math.max(0, num(t.inv, B[t.k].cost)), x: gx, y: gy };
    }
    if (!cnt(S)) S.tiles['1,1'] = { k: 'shop', l: 1, stock: 0, inv: B.shop.cost, x: 1, y: 1 };
    if (Array.isArray(o.missions)) S.missions = o.missions.filter(function (m) { return m && typeof m.t === 'string' && typeof m.need === 'number' && typeof m.reward === 'number'; }).slice(0, 3).map(function (m) { return { id: String(m.id || Math.random()), t: m.t, kind: B[m.kind] ? m.kind : '', need: m.need, got: Math.max(0, num(m.got, 0)), reward: m.reward }; });
    return S;
  }

  /* ====================== PEMASANGAN GAME ====================== */
  var S = null, root, view, cv, cx, panel, body, W = 300, H = 300, dpr = 1, raf = 0, last = 0, T = 0, night = 0, ro = null, timers = [];
  var cam = { x: 0, y: 40, z: 1, fit: 1 }, ptrs = {}, pinch = null, dragMoved = false;
  var sel = null, place = null, tab = 'build', dirty = true, saveDirty = false, saveAt = 0, achAt = 0, hudAt = 0, liveAt = 0, autoT = 12, balT = 25, shown = 0, sellArm = 0, lastTapAt = 0;
  var fx = { parts: [], pops: [], coins: [], cars: [], walkers: [], clouds: [], bal: null, ring: [] };
  var hud = {}, cache = {}, cacheN = 0, offlineGain = 0, introShown = false, alive = false;

  function mount(stage, ap) {
    S = sanitize(DG.load().tycoon) || newState(bestSaved());
    var offSec = (Date.now() - S.lastSeen) / 1000;
    if (offSec > 45 && offSec < 86400 * 14) offlineGain = awayGain(offSec); else offlineGain = 0;
    S.lastSeen = Date.now();
    if (!S.missions.length) topUpMissions();
    sel = null; place = null; tab = 'build'; dirty = true; T = 0; shown = S.coins; autoT = 12; balT = 25; sellArm = 0; ptrs = {}; pinch = null; cache = {}; cacheN = 0;
    fx = { parts: [], pops: [], coins: [], cars: [], walkers: [], clouds: [], bal: null, ring: [] };
    for (var i = 0; i < 5; i++) fx.clouds.push({ x: Math.random() * 900, y: 18 + Math.random() * 120, s: 0.6 + Math.random() * 0.9, v: 4 + Math.random() * 6 });
    fx.cars = [{ ax: 'u', lane: 0.17, s: -0.4, v: 0.9, c: '#ef4444' }, { ax: 'u', lane: -0.17, s: 6.2, v: -0.75, c: '#3b82f6' }, { ax: 'v', lane: 0.17, s: 2, v: 0.7, c: '#f59e0b' }, { ax: 'v', lane: -0.17, s: 5, v: -0.95, c: '#10b981' }];
    fx.walkers = [{ ax: 'u', off: 0.4, s: 1, v: 0.18, c: '#a855f7' }, { ax: 'v', off: -0.4, s: 4, v: -0.15, c: '#ec4899' }, { ax: 'u', off: -0.4, s: 5.5, v: -0.2, c: '#0ea5e9' }];

    stage.innerHTML =
      '<div class="ty" id="ty"><div class="ty-main"><div class="ty-view" id="tyView"><canvas id="tyCv" aria-label="Kota bisnis isometrik. Ketuk gelembung koin untuk mengumpulkan, ketuk petak untuk membangun."></canvas>' +
      '<div class="ty-hud"><div class="ty-pill ty-coins"><span class="ty-ico" id="tyCoinIco">' + I.coin + '</span><div><b id="tyCoins">0</b><small id="tyRate">+0/dtk</small></div></div>' +
      '<div class="ty-pill ty-lvl"><div class="ty-ring" id="tyRing"><b id="tyLv">1</b></div><div><small>Level kota</small><div class="ty-xp"><i id="tyXp"></i></div></div></div>' +
      '<div class="ty-pill ty-score"><small>Skor</small><b id="tyScore">0</b></div></div>' +
      '<div class="ty-hint" id="tyHint" hidden></div><div class="ty-banner" id="tyBanner" hidden></div>' +
      '<div class="ty-tools"><button type="button" class="ty-tool ty-collect" data-ty="collectall" aria-label="Kumpulkan semua koin">' + I.coin + '<span>Kumpulkan</span><em id="tyCollBadge" hidden>0</em></button>' +
      '<button type="button" class="ty-tool ty-promo" data-ty="promo" id="tyPromo" aria-label="Promo pendapatan dua kali lipat">' + I.star + '<span id="tyPromoT">Promo ×2</span></button>' +
      '<div class="ty-zoom"><button type="button" data-ty="zin" aria-label="Perbesar">' + I.plus + '</button><button type="button" data-ty="zout" aria-label="Perkecil">' + I.minus + '</button><button type="button" data-ty="zfit" aria-label="Pas ke layar">' + I.fit + '</button><button type="button" data-ty="rot" aria-label="Putar kota">' + I.rot + '</button></div></div>' +
      '</div><aside class="ty-panel" id="tyPanel"><nav class="ty-tabs" role="tablist"><button type="button" role="tab" data-ty="tab" data-t="build">Bangun</button><button type="button" role="tab" data-ty="tab" data-t="mission">Misi<em id="tyMBadge" hidden>0</em></button><button type="button" role="tab" data-ty="tab" data-t="ach">Prestasi</button><button type="button" role="tab" data-ty="tab" data-t="score">Skor</button></nav><div class="ty-body" id="tyBody"></div></aside></div><div class="ty-ov" id="tyOv" hidden></div></div>';
    root = stage.querySelector('#ty'); view = root.querySelector('#tyView'); cv = root.querySelector('#tyCv'); cx = cv.getContext('2d'); panel = root.querySelector('#tyPanel'); body = root.querySelector('#tyBody');
    ['Coins', 'Rate', 'Lv', 'Xp', 'Score', 'Ring', 'Hint', 'Banner', 'CoinIco', 'CollBadge', 'MBadge', 'Promo', 'PromoT', 'Ov'].forEach(function (k) { hud[k] = root.querySelector('#ty' + k); });

    root.addEventListener('click', onClick);
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('keydown', onKey); document.addEventListener('visibilitychange', onVis); window.addEventListener('pagehide', persist);
    ro = new ResizeObserver(function () { fit(false); }); ro.observe(view);
    alive = true; fit(true); renderBody(); hudSync(true);
    if (DKAudio.state().music) ap.music('city');
    if (!S.intro) showOverlay('intro'); else if (offlineGain > 0) showOverlay('away');
    last = performance.now(); raf = requestAnimationFrame(loop);
    if (window.__DUITKU_TEST) window.__ty = api();
  }

  function unmount() {
    alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); ro = null;
    document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', persist);
    timers.forEach(clearTimeout); timers = []; persist(); root = view = cv = cx = panel = body = null; hud = {};
  }
  function bestSaved() { var o = DG.load().tycoon; return o && o.best || 0; }
  function persist() {
    if (!S) return;
    var o = { v: SAVE_V, coins: S.coins, earned: S.earned, level: S.level, best: Math.max(S.best, calcScore(S)), ach: S.ach, missions: S.missions, missionsDone: S.missionsDone, tI: S.tI, auto: S.auto,
      view: VR, promoUntil: S.promoUntil, promoReady: S.promoReady, intro: S.intro, lastSeen: Date.now(), started: S.started, stats: S.stats, tiles: {} };
    for (var k in S.tiles) { var t = S.tiles[k]; o.tiles[k] = { k: t.k, l: t.l, stock: Math.floor(t.stock * 100) / 100, inv: t.inv }; }
    S.best = o.best; var g = DG.load(); g.tycoon = o; g.tycoon.level = S.level; DG.save(g); saveDirty = false;
  }
  function touchSave() { saveDirty = true; saveAt = performance.now() + 900; }

  /* ====================== EKONOMI ====================== */
  function bonusOf(gx, gy) {
    var m = 0;
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; var t = S.tiles[kfy(gx + dx, gy + dy)]; if (t && t.k === 'park') m += 0.08 + 0.02 * (t.l - 1); }
    return Math.min(0.6, m);
  }
  function rateBase(t) { return t.k === 'park' ? 0 : incAt(t.k, t.l) * (1 + bonusOf(t.x, t.y)); }
  function promoOn() { return Date.now() < S.promoUntil; }
  function rateOf(t) { return rateBase(t) * (promoOn() ? 2 : 1); }
  function totalBase() { var r = 0; for (var k in S.tiles) r += rateBase(S.tiles[k]); return r; }
  function totalRate() { return totalBase() * (promoOn() ? 2 : 1); }
  function capOf(t) { return Math.max(8, rateBase(t) * (45 + 15 * t.l)); }
  function ready(t) { return t.k !== 'park' && t.stock >= Math.max(1, rateBase(t) * 4); }
  function readyCount() { var n = 0; for (var k in S.tiles) if (ready(S.tiles[k])) n++; return n; }
  function awayGain(sec) {
    var eff = S.auto ? 1 : 0.5, g = Math.floor(totalBase() * Math.min(sec, 4 * 3600) * eff);
    if (g > 0) { S.coins += g; S.earned += g; touchSave(); }
    return g;
  }

  function collect(t, quiet) {
    var amt = Math.floor(t.stock); if (amt < 1) return 0;
    t.stock -= amt; S.coins += amt; S.earned += amt; S.stats.collects++;
    var px = tcx(t.x, t.y), py = tcy(t.x, t.y) - hOf(t.k, t.l);
    pop(px, py - 20, '+' + fmtN(amt), '#ffe066');
    flyCoins(px, py - 14, quiet ? 2 : 4);
    if (!quiet) DKAudio.sfx('cash', 0.8);
    evt('collect', 1); evt('earn', amt); dirty = true; touchSave();
    return amt;
  }
  function collectAll(auto) {
    var n = 0, sum = 0, k, t;
    for (k in S.tiles) { t = S.tiles[k]; if (t.stock >= 1) { var a = collect(t, true); if (a) { n++; sum += a; } } }
    if (n) { DKAudio.sfx(auto ? 'coin' : 'cash', 0.9); if (!auto) banner('+' + fmtN(sum) + ' koin', n + ' bangunan', 'ok'); }
    else if (!auto) { DKAudio.sfx('tap'); banner('Belum ada koin siap', 'Tunggu gudang bangunan terisi', ''); }
    return sum;
  }

  function build(gx, gy, k) {
    var key = kfy(gx, gy), b = B[k];
    if (!b || S.tiles[key] || isRoad(gx, gy)) return false;
    var z = ZONES[zoneOf(gx, gy)];
    if (z.req > S.level) { deny('Distrik terkunci', 'Terbuka di level kota ' + z.req); return false; }
    if (b.req > S.level) { deny(b.n + ' terkunci', 'Terbuka di level kota ' + b.req); return false; }
    if (S.coins < b.cost) { deny('Koin belum cukup', 'Butuh ' + fmtN(b.cost) + ' koin'); return false; }
    S.coins -= b.cost;
    var t = S.tiles[key] = { k: k, l: 1, stock: 0, inv: b.cost, x: gx, y: gy, anim: { k: 'build', t0: performance.now() } };
    S.stats.builds++; DKAudio.sfx('build'); dust(tcx(gx, gy), tcy(gx, gy), 16);
    evt('build', 1, k); afterChange(); sel = key; place = null; dirty = true; tab = 'build'; touchSave(); renderBody();
    banner(b.n + ' dibangun', 'Pendapatan +' + fmtR(rateBase(t)) + '/dtk', 'ok'); showHint();
    return true;
  }
  function upgrade(key) {
    var t = S.tiles[key]; if (!t) return false;
    if (t.l >= MAXL) { deny('Sudah level maksimum', ''); return false; }
    var c = upCost(t.k, t.l);
    if (S.coins < c) { deny('Koin belum cukup', 'Butuh ' + fmtN(c) + ' koin'); return false; }
    S.coins -= c; t.l++; t.inv += c; t.anim = { k: 'up', t0: performance.now() }; S.stats.upgrades++;
    DKAudio.sfx('upgrade'); var px = tcx(t.x, t.y), py = tcy(t.x, t.y);
    sparkle(px, py - hOf(t.k, t.l) * 0.6, 18); pop(px, py - hOf(t.k, t.l) - 6, 'Level ' + t.l, '#ffffff');
    evt('upgrade', 1, t.k); afterChange(); dirty = true; touchSave(); renderBody();
    return true;
  }
  function sell(key) {
    var t = S.tiles[key]; if (!t) return;
    var ref = Math.floor(t.inv * 0.5); S.coins += ref; delete S.tiles[key]; S.stats.sold++;
    DKAudio.sfx('whoosh'); dust(tcx(t.x, t.y), tcy(t.x, t.y), 12); pop(tcx(t.x, t.y), tcy(t.x, t.y) - 20, '+' + fmtN(ref), '#bbf7d0');
    sel = null; sellArm = 0; dirty = true; touchSave(); renderBody(); banner('Bangunan dibongkar', 'Dana kembali ' + fmtN(ref) + ' koin', '');
  }
  function deny(t, s) { DKAudio.sfx('error'); banner(t, s, 'bad'); }
  function afterChange() { checkLevel(); checkAch(); }

  function checkLevel() {
    var a = assetsOf(S), lv = S.level, up = false;
    while (lv < LV.length && a >= LV[lv]) { lv++; up = true; }
    if (!up) return;
    var from = S.level; S.level = lv;
    var un = []; KINDS.forEach(function (k) { if (B[k].req > from && B[k].req <= lv) un.push(B[k].n); });
    ZONES.forEach(function (z) { if (z.req > from && z.req <= lv) un.push(z.n); });
    DKAudio.sfx('level'); banner('Level kota ' + lv + '!', un.length ? 'Terbuka: ' + un.join(', ') : 'Kotamu makin besar', 'lvl');
    confetti(); evt('level', 0); dirty = true; touchSave();
  }
  function checkAch() {
    ACH.forEach(function (a) {
      if (S.ach[a.id]) return;
      var ok = false; try { ok = a.t(S); } catch (e) {}
      if (ok) { S.ach[a.id] = Date.now(); DKAudio.sfx('ach'); banner('Pencapaian: ' + a.n, a.d + ' (+250 skor)', 'ach'); confetti(true); dirty = true; touchSave(); }
    });
  }

  /* ---- misi ---- */
  function scaleE() { return Math.max(40, totalBase() * 40); }
  function genMission() {
    var E = scaleE(), have = {}, i;
    S.missions.forEach(function (m) { have[m.t] = 1; });
    var free = Object.keys(S.tiles).length < 36 - 0, upg = any(S, function (t) { return t.l < MAXL && t.k !== 'park'; });
    var kinds = KINDS.filter(function (k) { return B[k].req <= S.level; }), plotsLeft = freePlots() > 0;
    var pool = [];
    if (plotsLeft) pool.push('build');
    if (upg) pool.push('upgrade');
    pool.push('collect', 'earn', 'own', 'promo', 'balloon'); if (S.level < LV.length) pool.push('level');
    var fresh = pool.filter(function (p) { return !have[p]; }); if (fresh.length) pool = fresh;
    var t = pool[rnd(pool.length)], m = { id: Date.now().toString(36) + rnd(1e4), t: t, kind: '', need: 1, got: 0, reward: 0 };
    if (t === 'build') {
      var notOwned = kinds.filter(function (k) { return !any(S, function (x) { return x.k === k; }); }), ks = notOwned.length ? notOwned : kinds;
      m.kind = ks[rnd(ks.length)]; m.need = m.kind === 'shop' ? 2 : 1; m.reward = round2(B[m.kind].cost * 0.5 * m.need + E * 0.5);
    } else if (t === 'upgrade') { m.need = 2 + rnd(4); m.reward = round2(E * m.need * 0.7); }
    else if (t === 'collect') { m.need = 12 + rnd(4) * 6; m.reward = round2(E * m.need / 7); }
    else if (t === 'earn') { m.need = round2(Math.max(200, totalBase() * (120 + rnd(120)))); m.reward = round2(m.need * 0.3); }
    else if (t === 'own') { m.need = cnt(S) + 2; m.reward = round2(E * 2.2); }
    else if (t === 'level') { m.need = S.level + 1; m.reward = round2(E * 4); }
    else if (t === 'promo') { m.need = 1; m.reward = round2(E * 2); }
    else { m.need = 2; m.reward = round2(E * 2); }
    return m;
  }
  function freePlots() {
    var n = 0; for (var gx = 0; gx < N; gx++) for (var gy = 0; gy < N; gy++) if (!isRoad(gx, gy) && !S.tiles[kfy(gx, gy)] && ZONES[zoneOf(gx, gy)].req <= S.level) n++;
    return n;
  }
  function topUpMissions() { while (S.missions.length < 3) S.missions.push(genMission()); }
  function mGot(m) { return m.t === 'own' ? cnt(S) : m.t === 'level' ? S.level : m.got; }
  function mDone(m) { return mGot(m) >= m.need; }
  function evt(type, n, kind) {
    S.missions.forEach(function (m) { if (m.t === type && (!m.kind || m.kind === kind)) m.got += n; });
    dirty = true;
  }
  function claimMission(id) {
    var i = -1; S.missions.forEach(function (m, j) { if (m.id === id) i = j; });
    if (i < 0 || !mDone(S.missions[i])) return;
    var m = S.missions.splice(i, 1)[0]; S.coins += m.reward; S.missionsDone++;
    DKAudio.sfx('ach'); banner('Misi selesai!', '+' + fmtN(m.reward) + ' koin', 'ok'); flyCoins(W / 2, H / 2, 8, true);
    topUpMissions(); checkAch(); dirty = true; touchSave(); renderBody();
  }
  function targetOf() { return TARGETS[Math.min(S.tI, TARGETS.length - 1)]; }
  function targetDone() { return S.tI < TARGETS.length && totalBase() >= TARGETS[S.tI]; }
  function claimTarget() {
    if (!targetDone()) return;
    var r = Math.round(TARGETS[S.tI] * 80); S.coins += r; S.tI++; S.missionsDone++;
    DKAudio.sfx('ach'); banner('Target pendapatan tercapai!', '+' + fmtN(r) + ' koin', 'ok'); flyCoins(W / 2, H / 2, 8, true);
    checkAch(); dirty = true; touchSave(); renderBody();
  }

  function promo() {
    var now = Date.now();
    if (promoOn()) { DKAudio.sfx('tap'); return; }
    if (now < S.promoReady) { DKAudio.sfx('error'); banner('Promo sedang istirahat', 'Siap lagi dalam ' + Math.ceil((S.promoReady - now) / 1000) + ' dtk', 'bad'); return; }
    S.promoUntil = now + 30000; S.promoReady = now + 150000; S.stats.promos++;
    DKAudio.sfx('power'); banner('Promo ×2 aktif!', 'Pendapatan dua kali lipat selama 30 detik', 'lvl'); sparkle(0, 60, 24); evt('promo', 1); checkAch(); dirty = true; touchSave();
  }
  function buyAuto() {
    if (S.auto) return;
    if (S.level < AUTO_LV) return deny('Kasir Otomatis terkunci', 'Terbuka di level kota ' + AUTO_LV);
    if (S.coins < AUTO_COST) return deny('Koin belum cukup', 'Butuh ' + fmtN(AUTO_COST) + ' koin');
    S.coins -= AUTO_COST; S.auto = true; DKAudio.sfx('upgrade'); banner('Kasir Otomatis aktif', 'Koin dikumpulkan otomatis setiap 12 detik', 'ok'); dirty = true; touchSave(); renderBody();
  }
  function resetGame() {
    var b = Math.max(S.best, calcScore(S)), resets = S.stats.resets + 1;
    S = newState(b); S.stats.resets = resets; S.intro = true; topUpMissions(); sel = null; place = null; cache = {}; cacheN = 0; shown = S.coins; tab = 'build';
    fx.parts = []; fx.pops = []; fx.coins = []; fx.bal = null; persist(); fit(true); dirty = true; renderBody(); DKAudio.sfx('whoosh'); banner('Kota baru dimulai', 'Skor tertinggi tetap tersimpan', '');
  }

  /* ====================== EFEK ====================== */
  function pop(x, y, txt, c) { fx.pops.push({ x: x, y: y, t: 0, txt: txt, c: c || '#fff' }); }
  function dust(x, y, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = 20 + Math.random() * 40; fx.parts.push({ x: x + Math.cos(a) * 14, y: y + Math.sin(a) * 6, vx: Math.cos(a) * s, vy: -10 - Math.random() * 25, l: 0.6 + Math.random() * 0.4, m: 1, c: 'rgba(235,225,205,.85)', r: 3 + Math.random() * 4, g: 0 }); } }
  function sparkle(x, y, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = 40 + Math.random() * 90; fx.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, l: 0.5 + Math.random() * 0.5, m: 1, c: i % 2 ? '#fff6b0' : '#ffd60a', r: 1.6 + Math.random() * 2, g: 160, add: true }); } }
  function confetti(small) { var n = small ? 22 : 56, cols = ['#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#0a84ff', '#bf5af2']; for (var i = 0; i < n; i++) fx.ring.push({ x: Math.random() * W, y: -10 - Math.random() * 60, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 140, l: 2.2 + Math.random(), c: cols[i % 6], w: 5 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10 }); }
  function flyCoins(wx, wy, n, screen) {
    var s = screen ? [wx, wy] : toScreen(wx, wy), tg = hudTarget();
    for (var i = 0; i < n; i++) fx.coins.push({ x0: s[0] + (Math.random() - 0.5) * 14, y0: s[1] + (Math.random() - 0.5) * 8, t: -i * 0.06, dur: 0.55 + Math.random() * 0.25, tx: tg[0], ty: tg[1] });
    if (fx.coins.length > 40) fx.coins.splice(0, fx.coins.length - 40);
  }
  function hudTarget() { if (!hud.CoinIco || !cv) return [34, 26]; var a = hud.CoinIco.getBoundingClientRect(), b = cv.getBoundingClientRect(); return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2]; }
  var bannerT = 0;
  function banner(t, s, kind) {
    var el = hud.Banner; if (!el) return;
    el.className = 'ty-banner ' + (kind || ''); el.innerHTML = '<b>' + esc(t) + '</b>' + (s ? '<small>' + esc(s) + '</small>' : ''); el.hidden = false;
    void el.offsetWidth; el.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(function () { if (el) { el.classList.remove('show'); } }, 2300);
  }
  function showHint() {
    var h = hud.Hint; if (!h) return;
    var txt = '';
    if (place) txt = 'Ketuk petak hijau untuk membangun ' + B[place].n + '. Ketuk di luar petak untuk batal.';
    else if (!S.stats.collects) txt = 'Ketuk gelembung koin di atas tokomu untuk mengumpulkan pendapatan.';
    else if (!S.stats.builds) txt = 'Bagus! Sekarang ketuk petak hijau kosong untuk membangun bisnis baru.';
    h.hidden = !txt; h.textContent = txt;
  }

  /* ====================== PENGGAMBARAN ====================== */
  function fit(reset) {
    if (!view || !cv) return;
    var r = view.getBoundingClientRect(), w = Math.max(160, Math.floor(r.width)), h = Math.max(160, Math.floor(r.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w !== W || h !== H || reset || cv.width !== Math.round(w * dpr)) {
      W = w; H = h; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    }
    var f = Math.min(W / 500, H / 400); f = clamp(f, 0.35, 2);
    var was = cam.fit; cam.fit = f;
    if (reset) { cam.z = f * 1.0; cam.x = 0; cam.y = 44; } else if (Math.abs(cam.z - was) < 0.001) cam.z = f;
    clampCam();
  }
  function clampCam() { cam.z = clamp(cam.z, cam.fit * 0.7, Math.max(cam.fit * 3.2, 2.4)); cam.x = clamp(cam.x, -260, 260); cam.y = clamp(cam.y, -90, 230); }
  function toScreen(wx, wy) { return [(wx - cam.x) * cam.z + W / 2, (wy - cam.y) * cam.z + H / 2]; }
  function toWorld(sx, sy) { return [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y]; }
  function nightAt(t) { var s = 0.5 + 0.5 * Math.cos(6.283 * t / DAY); var x = clamp((0.62 - s) / 0.42, 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function drawSky(c) {
    var n = night, top, bot;
    if (n < 0.5) { top = ART.mixc('#6ec3ff', '#ff8fa3', n * 2); bot = ART.mixc('#e4f5ff', '#ffd6a5', n * 2); } else { top = ART.mixc('#ff8fa3', '#0a0f33', (n - 0.5) * 2); bot = ART.mixc('#ffd6a5', '#2c3b8a', (n - 0.5) * 2); }
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (n > 0.15) { c.save(); c.fillStyle = '#fff'; for (var i = 0; i < 34; i++) { var tw = 0.5 + 0.5 * Math.sin(T * 2 + i * 1.7); c.globalAlpha = (n - 0.15) * (0.3 + 0.7 * tw); c.beginPath(); c.arc((i * 137.5) % W, (i * 53.3) % (H * 0.55), 0.7 + (i % 3) * 0.4, 0, 6.283); c.fill(); } c.restore(); }
    var ang = 6.283 * T / DAY, sx = W * 0.5 + Math.sin(ang) * W * 0.36, sy = H * 0.2 + (1 - Math.cos(ang)) * 0.5 * H * 0.12;
    c.save(); if (n < 0.75) { c.globalAlpha = 1 - n * 1.1; var rg = c.createRadialGradient(sx, sy, 4, sx, sy, 60); rg.addColorStop(0, 'rgba(255,244,190,.95)'); rg.addColorStop(1, 'rgba(255,244,190,0)'); c.fillStyle = rg; c.beginPath(); c.arc(sx, sy, 60, 0, 6.283); c.fill(); c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(sx, sy, 15, 0, 6.283); c.fill(); }
    if (n > 0.4) { c.globalAlpha = clamp((n - 0.4) * 1.6, 0, 1); c.fillStyle = '#f4f1de'; c.beginPath(); c.arc(W * 0.82, H * 0.16, 14, 0, 6.283); c.fill(); c.fillStyle = 'rgba(10,15,51,.35)'; c.beginPath(); c.arc(W * 0.82 + 5, H * 0.16 - 3, 12, 0, 6.283); c.fill(); }
    c.restore();
    c.save(); c.globalAlpha = 0.9 - n * 0.65; c.fillStyle = '#fff';
    fx.clouds.forEach(function (k) { var x = (k.x + T * k.v) % (W + 200) - 100; c.beginPath(); c.ellipse(x, k.y, 40 * k.s, 11 * k.s, 0, 0, 6.283); c.ellipse(x + 24 * k.s, k.y - 8 * k.s, 26 * k.s, 10 * k.s, 0, 0, 6.283); c.ellipse(x - 26 * k.s, k.y - 4 * k.s, 24 * k.s, 9 * k.s, 0, 0, 6.283); c.fill(); });
    c.restore();
  }

  function cachedB(t, nq) {
    var k = t.k + '|' + t.l + '|' + nq, e = cache[k];
    if (e) { e.u = performance.now(); return e; }
    var h = hOf(t.k, t.l) + 46, w = 200, S2 = 2, cvs = document.createElement('canvas'); cvs.width = w * S2; cvs.height = h * S2;
    var c = cvs.getContext('2d'); c.scale(S2, S2); c.translate(w / 2, h - 30);
    ART.drawBuilding(c, t.k, t.l, { night: nq, seed: 3 });
    if (++cacheN > 60) { var oldest = null; for (var q in cache) if (!oldest || cache[q].u < cache[oldest].u) oldest = q; delete cache[oldest]; cacheN--; }
    return (cache[k] = { cv: cvs, w: w, h: h, u: performance.now() });
  }
  function drawBuildingAt(c, t) {
    var x = tcx(t.x, t.y), y = tcy(t.x, t.y), now = performance.now(), a = t.anim, live = t.k === 'park' || t.k === 'tower';
    if (a) {
      var dur = a.k === 'build' ? 1100 : 750, p = (now - a.t0) / dur;
      if (p >= 1) { t.anim = null; a = null; }
      else {
        c.save(); c.translate(x, y);
        if (a.k === 'build') ART.drawBuilding(c, t.k, t.l, { build: p, night: night, seed: 3, t: T });
        else ART.drawBuilding(c, t.k, t.l, { night: night, seed: 3, t: T, pulse: p, flash: 1 - p });
        c.restore(); return;
      }
    }
    if (live) { c.save(); c.translate(x, y); ART.drawBuilding(c, t.k, t.l, { night: night, seed: 3, t: T }); c.restore(); return; }
    var e = cachedB(t, Math.round(night * 3) / 3);
    c.drawImage(e.cv, x - e.w / 2, y - (e.h - 30), e.w, e.h);
  }

  function draw() {
    if (!cx) return;
    var c = cx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSky(c);
    c.save(); c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
    ART.slab(c, N, 14);
    var s, gx, gy, x, y, alt, key, t, items = [];
    var hot = !!place, selKey = sel;
    for (s = 0; s <= 2 * N - 2; s++) for (var rx0 = 0; rx0 < N; rx0++) {
      var ry0 = s - rx0; if (ry0 < 0 || ry0 >= N) continue;
      var iq0 = rg(rx0, ry0, (4 - VR) % 4); gx = iq0[0]; gy = iq0[1];
      x = tcx(gx, gy); y = tcy(gx, gy); alt = (gx + gy) & 1; key = kfy(gx, gy);
      if (isRoad(gx, gy)) { var ax0 = gx === ROAD ? 'v' : 'u'; if (VR & 1) ax0 = ax0 === 'v' ? 'u' : 'v'; ART.road(c, x, y, ax0, gx === ROAD && gy === ROAD); continue; }
      var z = ZONES[zoneOf(gx, gy)];
      t = S.tiles[key];
      if (z.req > S.level) {
        ART.locked(c, x, y, alt);
        c.save(); c.font = '800 9px -apple-system,system-ui,sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(40,52,70,.75)'; c.fillText('Lv ' + z.req, x, y + 12); c.restore();
        if (selKey === key) { ART.tilePath(c, x, y, 0.94); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke(); }
        continue;
      }
      if (t) {
        ART.grass(c, x, y, alt);
        if (selKey === key) { ART.tilePath(c, x, y, 0.94); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke(); }
        var rq = rg(gx, gy); items.push({ d: rq[0] + rq[1] + rq[0] * 0.001, t: t });
      } else ART.plot(c, x, y, alt, hot, selKey === key, T);
    }
    /* mobil dan pejalan kaki ikut diurutkan bersama bangunan */
    fx.cars.forEach(function (v) { var ix = Math.round(v.s); if (ix < 0 || ix >= N) return; var rc = v.ax === 'u' ? rg(ix, ROAD) : rg(ROAD, ix); items.push({ d: rc[0] + rc[1] + 0.002, car: v, ix: ix }); });
    fx.walkers.forEach(function (v) { var ix = Math.round(v.s); if (ix < 0 || ix >= N) return; var rw = v.ax === 'u' ? rg(ix, ROAD) : rg(ROAD, ix); items.push({ d: rw[0] + rw[1] + 0.003, walk: v, ix: ix }); });
    items.sort(function (a, b) { return a.d - b.d; });
    items.forEach(function (it) {
      if (it.t) drawBuildingAt(c, it.t);
      else if (it.car) { var v = it.car, px = v.ax === 'u' ? tcx(it.ix, ROAD) : tcx(ROAD, it.ix), py = v.ax === 'u' ? tcy(it.ix, ROAD) : tcy(ROAD, it.ix); c.save(); c.translate(px, py); var cax = v.ax === 'u' ? 'u' : 'v', cf = v.s - it.ix, cd = v.v > 0 ? 1 : -1, cl = v.lane; if (VR & 1) cax = cax === 'u' ? 'v' : 'u'; if (VR >= 2) { cf = -cf; cd = -cd; } ART.car(c, cax, cl, cf, v.c, cd); c.restore(); }
      else if (it.walk) { var w = it.walk, wx = w.ax === 'u' ? tcx(it.ix, ROAD) : tcx(ROAD, it.ix), wy = w.ax === 'u' ? tcy(it.ix, ROAD) : tcy(ROAD, it.ix); c.save(); c.translate(wx, wy); var wa = w.ax === 'u' ? 'u' : 'v', wf = w.s - it.ix, wo = w.off; if (VR & 1) wa = wa === 'u' ? 'v' : 'u'; if (VR >= 2) { wf = -wf; wo = -wo; } if (wa === 'u') ART.walker(c, wf, wo, w.c, T + w.s); else ART.walker(c, wo, wf, w.c, T + w.s); c.restore(); }
    });
    /* gelembung koin */
    for (key in S.tiles) {
      t = S.tiles[key]; if (!ready(t)) continue;
      var bx = tcx(t.x, t.y), by = tcy(t.x, t.y) - hOf(t.k, t.l) - 14 - Math.sin(T * 3 + t.x * 1.3 + t.y) * 3, full = t.stock >= capOf(t) * 0.95;
      c.save(); c.translate(bx, by);
      c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(0, 0, 14, 0, 6.283); c.fill();
      c.beginPath(); c.moveTo(-4, 12); c.lineTo(0, 18); c.lineTo(4, 12); c.closePath(); c.fill();
      var cg = c.createRadialGradient(-3, -3, 1, 0, 0, 11); cg.addColorStop(0, '#fff2a8'); cg.addColorStop(1, '#f5a700');
      c.fillStyle = cg; c.beginPath(); c.arc(0, 0, 10.5, 0, 6.283); c.fill(); c.strokeStyle = '#b57a00'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#8a5a00'; c.font = '800 10px -apple-system,system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Rp', 0, 0.5);
      if (full) { c.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(T * 8)) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 17, 0, 6.283); c.stroke(); }
      c.restore();
    }
    /* partikel dan teks melayang (dunia) */
    c.save(); c.globalCompositeOperation = 'source-over';
    fx.parts.forEach(function (q) { c.globalAlpha = clamp(q.l / q.m, 0, 1); c.fillStyle = q.c; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.283); c.fill(); });
    c.globalAlpha = 1; c.textAlign = 'center'; c.font = '800 13px -apple-system,system-ui,sans-serif'; c.lineWidth = 3.5; c.lineJoin = 'round';
    fx.pops.forEach(function (o) { c.globalAlpha = clamp(1 - o.t / 1.1, 0, 1); c.strokeStyle = 'rgba(20,25,45,.55)'; c.strokeText(o.txt, o.x, o.y); c.fillStyle = o.c; c.fillText(o.txt, o.x, o.y); });
    c.restore();
    c.restore();
    /* lapisan layar: balon bonus, koin terbang, konfeti */
    if (fx.bal) {
      var b = fx.bal, bob = Math.sin(T * 2.4 + b.ph) * 6;
      c.save(); c.translate(b.x, b.y + bob);
      c.strokeStyle = 'rgba(80,60,40,.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 22); c.quadraticCurveTo(6, 36, 0, 46); c.stroke();
      var bg = c.createRadialGradient(-8, -10, 3, 0, 0, 28); bg.addColorStop(0, '#fff4a3'); bg.addColorStop(1, '#ff9f0a');
      c.fillStyle = bg; c.beginPath(); c.ellipse(0, 0, 24, 28, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(180,90,0,.6)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#fff'; c.font = '900 20px -apple-system,system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', 0, 1);
      c.restore();
    }
    fx.coins.forEach(function (q) {
      if (q.t < 0) return; var p = clamp(q.t / q.dur, 0, 1), e = p * p * (3 - 2 * p);
      var x = lerp(q.x0, q.tx, e), y = lerp(q.y0, q.ty, e) - Math.sin(p * 3.14159) * 40;
      c.fillStyle = '#ffd60a'; c.strokeStyle = '#b57a00'; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, 6.5, 0, 6.283); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - 2, y - 2, 2, 0, 6.283); c.fill();
    });
    fx.ring.forEach(function (q) { c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.globalAlpha = clamp(q.l, 0, 1); c.fillStyle = q.c; c.fillRect(-q.w / 2, -2, q.w, 4); c.restore(); });
    if (promoOn()) { c.save(); c.strokeStyle = 'rgba(255,214,10,' + (0.35 + 0.25 * Math.sin(T * 6)) + ')'; c.lineWidth = 6; c.strokeRect(3, 3, W - 6, H - 6); c.restore(); }
    if (night > 0.2) { c.save(); c.fillStyle = 'rgba(8,12,46,' + (night * 0.22) + ')'; c.fillRect(0, 0, W, H); c.restore(); }
  }

  /* ====================== PEMBARUAN ====================== */
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    var gap = (now - last) / 1000; last = now;
    if (gap > 2.5) { var g = awayGain(gap); if (g > 0) { offlineGain = g; showOverlay('away'); } gap = 0.016; }
    update(Math.min(gap, 0.1)); draw();
  }
  function update(dt) {
    var k, t, now = performance.now();
    T += dt; S.stats.play += dt; night = nightAt(T);
    var pm = promoOn() ? 2 : 1;
    for (k in S.tiles) { t = S.tiles[k]; if (t.k === 'park') continue; var r = rateBase(t) * pm, cap = capOf(t); if (t.stock < cap) t.stock = Math.min(cap, t.stock + r * dt); }
    if (S.auto) { autoT -= dt; if (autoT <= 0) { autoT = 12; collectAll(true); } }
    balT -= dt;
    if (!fx.bal && balT <= 0 && cnt(S) > 0) { var left = Math.random() < 0.5; fx.bal = { x: left ? -40 : W + 40, y: 70 + Math.random() * Math.max(40, H * 0.3), vx: (left ? 1 : -1) * (36 + Math.random() * 26), ph: Math.random() * 6, t: 0 }; DKAudio.sfx('pop'); }
    if (fx.bal) { var b = fx.bal; b.x += b.vx * dt; b.t += dt; if ((b.vx > 0 && b.x > W + 60) || (b.vx < 0 && b.x < -60) || b.t > 30) { fx.bal = null; balT = 45 + Math.random() * 45; } }
    fx.cars.forEach(function (v) { v.s += v.v * dt; if (v.s > N + 0.4) v.s = -0.4; else if (v.s < -0.4) v.s = N + 0.4; });
    fx.walkers.forEach(function (v) { v.s += v.v * dt; if (v.s > N + 0.4) v.s = -0.4; else if (v.s < -0.4) v.s = N + 0.4; });
    var i, q;
    for (i = fx.parts.length - 1; i >= 0; i--) { q = fx.parts[i]; q.l -= dt; if (q.l <= 0) { fx.parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g == null ? 120 : q.g) * dt; }
    for (i = fx.pops.length - 1; i >= 0; i--) { q = fx.pops[i]; q.t += dt; q.y -= 26 * dt; if (q.t > 1.1) fx.pops.splice(i, 1); }
    for (i = fx.coins.length - 1; i >= 0; i--) { q = fx.coins[i]; q.t += dt; if (q.t >= q.dur) { fx.coins.splice(i, 1); if (hud.CoinIco) { hud.CoinIco.classList.remove('hit'); void hud.CoinIco.offsetWidth; hud.CoinIco.classList.add('hit'); } } }
    for (i = fx.ring.length - 1; i >= 0; i--) { q = fx.ring[i]; q.l -= dt; if (q.l <= 0 || q.y > H + 20) { fx.ring.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; }
    shown += (S.coins - shown) * Math.min(1, dt * 9); if (Math.abs(S.coins - shown) < 0.6) shown = S.coins;
    if (now > hudAt) { hudAt = now + 100; hudSync(); }
    if (now > liveAt) { liveAt = now + 400; live(); }
    if (now > achAt) { achAt = now + 1500; checkAch(); checkLevel(); }
    if (saveDirty && now > saveAt) persist(); else if (now - saveAt > 12000 && !saveDirty) { saveAt = now; persist(); }
  }

  /* ====================== HUD & PANEL ====================== */
  function hudSync(force) {
    if (!hud.Coins) return;
    var sc = calcScore(S), a = assetsOf(S), lo = LV[S.level - 1] || 0, hi = LV[S.level] || lo, p = hi > lo ? clamp((a - lo) / (hi - lo), 0, 1) : 1;
    hud.Coins.textContent = fmtN(shown); hud.Rate.textContent = '+' + fmtR(totalRate()) + '/dtk' + (promoOn() ? ' ×2' : '');
    hud.Lv.textContent = S.level; hud.Xp.style.width = Math.round(p * 100) + '%'; hud.Ring.style.setProperty('--p', (p * 100).toFixed(0));
    hud.Score.textContent = fmtN(sc); if (sc > S.best) S.best = sc;
    var rc = readyCount(); hud.CollBadge.hidden = !rc; hud.CollBadge.textContent = rc;
    var mb = S.missions.filter(mDone).length + (targetDone() ? 1 : 0); hud.MBadge.hidden = !mb; hud.MBadge.textContent = mb;
    var now = Date.now(), pb = hud.Promo;
    if (promoOn()) { pb.className = 'ty-tool ty-promo on'; hud.PromoT.textContent = Math.ceil((S.promoUntil - now) / 1000) + ' dtk'; }
    else if (now < S.promoReady) { pb.className = 'ty-tool ty-promo cool'; hud.PromoT.textContent = Math.ceil((S.promoReady - now) / 1000) + ' dtk'; }
    else { pb.className = 'ty-tool ty-promo'; hud.PromoT.textContent = 'Promo ×2'; }
    if (force) showHint();
  }
  function live() {
    if (!body) return;
    if (dirty) { renderBody(); return; }
    var coins = S.coins;
    body.querySelectorAll('[data-cost]').forEach(function (el) { el.classList.toggle('short', coins < +el.dataset.cost); });
    var t = sel && S.tiles[sel];
    if (t) {
      var st = body.querySelector('[data-stock]'), sb = body.querySelector('[data-stockbar]'), cap = capOf(t);
      if (st) st.textContent = fmtN(t.stock) + ' / ' + fmtN(cap); if (sb) sb.style.width = Math.round(t.stock / cap * 100) + '%';
      var rr = body.querySelector('[data-rate]'); if (rr) rr.textContent = '+' + fmtR(rateOf(t)) + '/dtk';
    }
    body.querySelectorAll('[data-mprog]').forEach(function (el) { var m = S.missions.filter(function (x) { return x.id === el.dataset.mprog; })[0]; if (m) { el.style.width = Math.round(clamp(mGot(m) / m.need, 0, 1) * 100) + '%'; } });
    var tp = body.querySelector('[data-tprog]'); if (tp) { tp.style.width = Math.round(clamp(totalBase() / targetOf(), 0, 1) * 100) + '%'; var tt = body.querySelector('[data-ttxt]'); if (tt) tt.textContent = fmtR(totalBase()) + ' / ' + fmtN(targetOf()) + ' koin per detik'; }
    var done = S.missions.filter(mDone).length + (targetDone() ? 1 : 0);
    if (done !== +(body.dataset.done || 0) && tab === 'mission') { renderBody(); }
  }

  function card(k) {
    var b = B[k], lock = b.req > S.level, plot = sel && !S.tiles[sel] ? sel : null;
    var meta = k === 'park' ? '<span>Bonus +8% tetangga</span>' : '<span>+' + fmtR(b.inc) + '/dtk</span>';
    var btn = lock ? '<button type="button" class="ty-b lock" disabled>Level ' + b.req + '</button>' : '<button type="button" class="ty-b' + (S.coins < b.cost ? ' short' : '') + '" data-ty="build" data-k="' + k + '" data-cost="' + b.cost + '">' + (plot ? 'Bangun' : place === k ? 'Dipilih' : 'Pilih') + '</button>';
    return '<div class="ty-card' + (lock ? ' lock' : '') + (place === k ? ' on' : '') + '"><img src="' + ART.sprite(k, 1, 76) + '" width="64" height="64" alt="" draggable="false"><div class="ty-ci"><b>' + esc(b.n) + '</b><small>' + esc(b.d) + '</small><div class="ty-meta"><span class="ty-cost' + (S.coins < b.cost && !lock ? ' short' : '') + '" data-cost="' + b.cost + '">' + I.coin + fmtN(b.cost) + '</span>' + meta + '</div></div>' + btn + '</div>';
  }
  function detail(t) {
    var b = B[t.k], nxt = t.l < MAXL, uc = nxt ? upCost(t.k, t.l) : 0, d = nxt ? incAt(t.k, t.l + 1) - incAt(t.k, t.l) : 0, bo = bonusOf(t.x, t.y), cap = capOf(t);
    var info = t.k === 'park'
      ? '<div class="ty-stats"><div><small>Efek</small><b>+' + Math.round((0.08 + 0.02 * (t.l - 1)) * 100) + '% / tetangga</b></div><div><small>Level</small><b>' + t.l + ' / ' + MAXL + '</b></div></div>'
      : '<div class="ty-stats"><div><small>Pendapatan</small><b data-rate>+' + fmtR(rateOf(t)) + '/dtk</b></div><div><small>Bonus taman</small><b>' + (bo ? '+' + Math.round(bo * 100) + '%' : '–') + '</b></div><div><small>Level</small><b>' + t.l + ' / ' + MAXL + '</b></div></div><div class="ty-stock"><span>Gudang <b data-stock>' + fmtN(t.stock) + ' / ' + fmtN(cap) + '</b></span><div class="ty-bar"><i data-stockbar style="width:' + Math.round(t.stock / cap * 100) + '%"></i></div></div>';
    var acts = (t.k !== 'park' ? '<button type="button" class="ty-b pri" data-ty="collect">Kumpulkan</button>' : '') +
      (nxt ? '<button type="button" class="ty-b up' + (S.coins < uc ? ' short' : '') + '" data-ty="upg" data-cost="' + uc + '"><span>Upgrade ke Lv ' + (t.l + 1) + '</span><small>' + I.coin + fmtN(uc) + (t.k !== 'park' ? ' · +' + fmtR(d) + '/dtk' : '') + '</small></button>' : '<button type="button" class="ty-b" disabled>Level maksimum</button>') +
      '<button type="button" class="ty-b ghost" data-ty="sell">' + (sellArm ? 'Ketuk lagi untuk bongkar' : 'Bongkar · +' + fmtN(Math.floor(t.inv / 2))) + '</button>';
    return '<div class="ty-det"><img src="' + ART.sprite(t.k, t.l, 96) + '" width="84" height="84" alt=""><div class="ty-dt"><h3>' + esc(b.n) + '</h3><p>' + esc(b.d) + '</p></div></div>' + info + '<div class="ty-acts">' + acts + '</div>';
  }
  function renderBody() {
    if (!body) return;
    var sc = body.scrollTop, h = '', t = sel && S.tiles[sel], i;
    panel.querySelectorAll('.ty-tabs [data-t]').forEach(function (b) { var on = b.dataset.t === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    if (tab === 'build') {
      if (t) { h += detail(t); h += '<div class="ty-sec"><button type="button" class="ty-link" data-ty="desel">Tutup detail</button></div>'; }
      else {
        var zk = sel ? ZONES[zoneOf.apply(null, sel.split(',').map(Number))] : null, isLock = zk && zk.req > S.level;
        if (isLock) h += '<div class="ty-note lockn"><b>' + zk.n + ' masih terkunci</b><p>Terbuka saat level kota mencapai ' + zk.req + '. Bangun dan upgrade bisnis untuk menaikkan level.</p></div>';
        else {
          h += '<div class="ty-note">' + (sel ? '<b>Petak kosong' + (zk ? ' · ' + zk.n : '') + '</b><p>Pilih bangunan untuk dibangun di sini.</p>' : place ? '<b>Mode membangun</b><p>Ketuk petak hijau di peta untuk menaruh ' + esc(B[place].n) + '. <button type="button" class="ty-link" data-ty="cancel">Batal</button></p>' : '<b>Mulai membangun</b><p>Ketuk petak hijau kosong di peta, atau pilih bangunan lalu tentukan lokasinya.</p>') + '</div>';
          KINDS.forEach(function (k) { h += card(k); });
          h += '<div class="ty-card auto' + (S.auto ? ' done' : '') + (S.level < AUTO_LV ? ' lock' : '') + '"><div class="ty-ico2">' + I.gear + '</div><div class="ty-ci"><b>Kasir Otomatis</b><small>Mengumpulkan koin tiap 12 detik dan membuat penghasilan saat kamu pergi penuh (bukan setengah).</small><div class="ty-meta"><span class="ty-cost' + (S.coins < AUTO_COST && !S.auto ? ' short' : '') + '" data-cost="' + AUTO_COST + '">' + I.coin + fmtN(AUTO_COST) + '</span></div></div>' + (S.auto ? '<button type="button" class="ty-b" disabled>Aktif</button>' : S.level < AUTO_LV ? '<button type="button" class="ty-b lock" disabled>Level ' + AUTO_LV + '</button>' : '<button type="button" class="ty-b' + (S.coins < AUTO_COST ? ' short' : '') + '" data-ty="auto" data-cost="' + AUTO_COST + '">Beli</button>') + '</div>';
        }
      }
    } else if (tab === 'mission') {
      var tgt = S.tI < TARGETS.length, td = targetDone();
      h += '<div class="ty-sec"><h4>Target pendapatan</h4>';
      if (tgt) h += '<div class="ty-mis target' + (td ? ' ok' : '') + '"><div class="ty-mt"><b>Capai ' + fmtN(targetOf()) + ' koin per detik</b><small data-ttxt>' + fmtR(totalBase()) + ' / ' + fmtN(targetOf()) + ' koin per detik</small><div class="ty-bar"><i data-tprog style="width:' + Math.round(clamp(totalBase() / targetOf(), 0, 1) * 100) + '%"></i></div></div><button type="button" class="ty-b' + (td ? ' pri' : '') + '" data-ty="claimt"' + (td ? '' : ' disabled') + '>' + (td ? 'Klaim ' + fmtN(Math.round(targetOf() * 80)) : 'Hadiah ' + fmtN(Math.round(targetOf() * 80))) + '</button></div>';
      else h += '<div class="ty-note"><b>Semua target tercapai</b><p>Kotamu sudah menembus semua target pendapatan.</p></div>';
      h += '</div><div class="ty-sec"><h4>Misi harian kota</h4>';
      S.missions.forEach(function (m) {
        var g = Math.min(mGot(m), m.need), ok = mDone(m);
        h += '<div class="ty-mis' + (ok ? ' ok' : '') + '"><div class="ty-mt"><b>' + esc(mText(m)) + '</b><small>' + fmtN(g) + ' / ' + fmtN(m.need) + '</small><div class="ty-bar"><i data-mprog="' + m.id + '" style="width:' + Math.round(clamp(g / m.need, 0, 1) * 100) + '%"></i></div></div><button type="button" class="ty-b' + (ok ? ' pri' : '') + '" data-ty="claim" data-id="' + m.id + '"' + (ok ? '' : ' disabled') + '>' + (ok ? 'Klaim ' : 'Hadiah ') + fmtN(m.reward) + '</button></div>';
      });
      h += '</div>';
      body.dataset.done = S.missions.filter(mDone).length + (td ? 1 : 0);
    } else if (tab === 'ach') {
      var n = Object.keys(S.ach).length;
      h += '<div class="ty-sec"><h4>Pencapaian <span class="ty-count">' + n + ' / ' + ACH.length + '</span></h4><div class="ty-achs">';
      ACH.forEach(function (a) { var on = !!S.ach[a.id]; h += '<div class="ty-ach' + (on ? ' on' : '') + '"><span class="ty-medal">' + (on ? I.trophy : I.target) + '</span><div><b>' + esc(a.n) + '</b><small>' + esc(a.d) + '</small></div></div>'; });
      h += '</div></div>';
    } else {
      var sc2 = calcScore(S), pt = Math.round(S.stats.play);
      h += '<div class="ty-sec"><div class="ty-big"><small>Skor kotamu</small><b>' + fmtN(sc2) + '</b><span>Skor tertinggi <b>' + fmtN(Math.max(S.best, sc2)) + '</b></span></div><div class="ty-grid">' +
        [['Level kota', S.level], ['Bangunan', cnt(S) + ' / 36'], ['Pendapatan', fmtR(totalBase()) + '/dtk'], ['Total koin dihasilkan', fmtN(S.earned)], ['Nilai aset', fmtN(assetsOf(S))], ['Pencapaian', Object.keys(S.ach).length + ' / ' + ACH.length], ['Misi selesai', S.missionsDone], ['Waktu bermain', Math.floor(pt / 60) + ' mnt']].map(function (r) { return '<div><small>' + r[0] + '</small><b>' + r[1] + '</b></div>'; }).join('') +
        '</div><p class="ty-fine">Skor = koin yang dihasilkan, nilai aset, pencapaian, dan misi. Koin dan skor di game ini virtual dan tidak terhubung ke saldo atau transaksi DuitKu-mu.</p><button type="button" class="ty-b ghost danger" data-ty="reset">' + (resetArm ? 'Ketuk lagi untuk mulai ulang' : 'Mulai ulang kota') + '</button></div>';
    }
    body.innerHTML = h; body.scrollTop = sc; dirty = false;
  }
  var resetArm = 0;
  function mText(m) {
    switch (m.t) {
      case 'build': return 'Bangun ' + (m.need > 1 ? m.need + ' ' : '') + (m.kind ? B[m.kind].n : 'bangunan');
      case 'upgrade': return 'Upgrade bangunan ' + m.need + ' kali';
      case 'collect': return 'Kumpulkan koin ' + m.need + ' kali';
      case 'earn': return 'Hasilkan ' + fmtN(m.need) + ' koin';
      case 'own': return 'Miliki ' + m.need + ' bangunan';
      case 'level': return 'Capai level kota ' + m.need;
      case 'promo': return 'Gunakan Promo ×2';
      default: return 'Ketuk ' + m.need + ' balon bonus';
    }
  }

  function showOverlay(kind) {
    var o = hud.Ov; if (!o) return;
    if (!kind) { o.hidden = true; o.innerHTML = ''; return; }
    var h;
    if (kind === 'intro') h = '<div class="ty-oc"><div class="ty-oi">' + I.coin + '</div><h2>Selamat datang, Bos!</h2><p>Kamu punya satu toko kecil dan <b>' + fmtN(S.coins) + ' koin</b>. Ketuk gelembung koin untuk mengumpulkan pendapatan, lalu upgrade dan bangun bisnis baru: kafe, restoran, minimarket, pusat perbelanjaan, sampai menara bisnis.</p><ul><li>Seret untuk menggeser peta, cubit atau gulir untuk memperbesar</li><li>Ketuk balon emas yang melintas untuk bonus</li><li>Semua koin di sini virtual, aman dari saldo aslimu</li></ul><button type="button" class="btn ty-go" data-ty="ovclose">Mulai membangun</button></div>';
    else h = '<div class="ty-oc"><div class="ty-oi">' + I.star + '</div><h2>Selamat datang kembali!</h2><p>Selama kamu pergi, bisnismu menghasilkan <b>' + fmtN(offlineGain) + ' koin</b>' + (S.auto ? '.' : '. Beli Kasir Otomatis agar penghasilan saat pergi penuh, bukan setengah.') + '</p><button type="button" class="btn ty-go" data-ty="ovclose">Lanjut</button></div>';
    o.innerHTML = h; o.hidden = false; DKAudio.sfx(kind === 'intro' ? 'sparkle' : 'cash');
  }
  function overlayOpen() { return hud.Ov && !hud.Ov.hidden; }
  function closeOverlay() { if (kind0()) { S.intro = true; touchSave(); } showOverlay(null); showHint(); }
  function kind0() { return !S.intro; }

  /* ====================== INPUT ====================== */
  function onClick(e) {
    var b = e.target.closest && e.target.closest('[data-ty]'); if (!b || !root.contains(b)) return;
    var a = b.dataset.ty;
    if (a !== 'sell') sellArm = 0; if (a !== 'reset') resetArm = 0;
    switch (a) {
      case 'ovclose': DKAudio.sfx('click'); closeOverlay(); break;
      case 'tab': tab = b.dataset.t; DKAudio.sfx('tap'); dirty = true; renderBody(); break;
      case 'collectall': collectAll(false); break;
      case 'promo': promo(); break;
      case 'rot': VR = (VR + 1) % 4; if (S) S.view = VR; dirty = true; DKAudio.sfx('whoosh'); touchSave(); break;
      case 'zin': zoom(1.25); break;
      case 'zout': zoom(0.8); break;
      case 'zfit': cam.z = cam.fit; cam.x = 0; cam.y = 44; clampCam(); break;
      case 'build':
        if (sel && !S.tiles[sel]) { var p = sel.split(',').map(Number); build(p[0], p[1], b.dataset.k); }
        else { var k = b.dataset.k; place = place === k ? null : k; sel = null; DKAudio.sfx('click'); dirty = true; renderBody(); showHint(); if (place) banner('Pilih lokasi', 'Ketuk petak hijau di peta', ''); }
        break;
      case 'cancel': place = null; dirty = true; renderBody(); showHint(); break;
      case 'desel': sel = null; dirty = true; renderBody(); break;
      case 'upg': if (sel) upgrade(sel); break;
      case 'collect': if (sel && S.tiles[sel]) { if (!collect(S.tiles[sel])) { DKAudio.sfx('tap'); banner('Gudang masih kosong', 'Tunggu beberapa detik', ''); } dirty = true; renderBody(); } break;
      case 'sell': if (sel && S.tiles[sel]) { if (sellArm) sell(sel); else { sellArm = 1; DKAudio.sfx('tap'); dirty = true; renderBody(); timers.push(setTimeout(function () { sellArm = 0; dirty = true; }, 3000)); } } break;
      case 'claim': DKAudio.sfx('click'); claimMission(b.dataset.id); break;
      case 'claimt': claimTarget(); break;
      case 'auto': buyAuto(); break;
      case 'reset': if (resetArm) { resetArm = 0; resetGame(); } else { resetArm = 1; DKAudio.sfx('tap'); dirty = true; renderBody(); timers.push(setTimeout(function () { resetArm = 0; dirty = true; }, 3500)); } break;
    }
  }
  function zoom(f, sx, sy) {
    var ox = sx == null ? W / 2 : sx, oy = sy == null ? H / 2 : sy, w0 = toWorld(ox, oy);
    cam.z *= f; clampCam(); var w1 = toWorld(ox, oy); cam.x += w0[0] - w1[0]; cam.y += w0[1] - w1[1]; clampCam();
  }
  function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function onWheel(e) { e.preventDefault(); var p = pt(e); zoom(e.deltaY < 0 ? 1.12 : 0.89, p[0], p[1]); }
  function onDown(e) {
    var p = pt(e); ptrs[e.pointerId] = { x: p[0], y: p[1], sx: p[0], sy: p[1] };
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    var ids = Object.keys(ptrs);
    if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: cam.z }; dragMoved = true; }
    else dragMoved = false;
  }
  function onMove(e) {
    var q = ptrs[e.pointerId]; if (!q) return; var p = pt(e), ids = Object.keys(ptrs);
    if (ids.length >= 2 && pinch) {
      q.x = p[0]; q.y = p[1]; var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, w0 = toWorld(mx, my);
      cam.z = pinch.z * d / pinch.d; clampCam(); var w1 = toWorld(mx, my); cam.x += w0[0] - w1[0]; cam.y += w0[1] - w1[1]; clampCam(); return;
    }
    var dx = p[0] - q.x, dy = p[1] - q.y;
    if (!dragMoved && Math.hypot(p[0] - q.sx, p[1] - q.sy) > 7) dragMoved = true;
    if (dragMoved) { cam.x -= dx / cam.z; cam.y -= dy / cam.z; clampCam(); }
    q.x = p[0]; q.y = p[1];
  }
  function onUp(e) {
    var q = ptrs[e.pointerId]; if (!q) return; delete ptrs[e.pointerId];
    var n = Object.keys(ptrs).length; if (n < 2) pinch = null;
    if (!dragMoved && n === 0 && e.type === 'pointerup') tap(q.x, q.y);
    if (n === 0) dragMoved = false;
  }

  function tap(sx, sy) {
    if (overlayOpen()) return;
    S.stats.taps++;
    var w = toWorld(sx, sy), k, t, i, list = [];
    if (fx.bal && Math.hypot(sx - fx.bal.x, sy - (fx.bal.y + Math.sin(T * 2.4 + fx.bal.ph) * 6)) < 40) { claimBalloon(); return; }
    for (k in S.tiles) list.push(S.tiles[k]);
    list.sort(function (a, b) { return (b.x + b.y + b.x * 0.001) - (a.x + a.y + a.x * 0.001); });
    for (i = 0; i < list.length; i++) {            /* gelembung koin lebih dulu */
      t = list[i]; if (!ready(t)) continue;
      var bx = tcx(t.x, t.y), by = tcy(t.x, t.y) - hOf(t.k, t.l) - 14;
      if (Math.hypot(w[0] - bx, w[1] - by) < 22 + 6 / cam.z) { collect(t); return; }
    }
    if (place) {                                   /* mode membangun: ketuk petak kosong */
      var gt = tileAt(w[0], w[1]);
      if (gt && !isRoad(gt[0], gt[1]) && !S.tiles[kfy(gt[0], gt[1])]) { var pk = place; if (build(gt[0], gt[1], pk)) return; return; }
      place = null; dirty = true; renderBody(); showHint(); return;
    }
    for (i = 0; i < list.length; i++) {            /* badan bangunan */
      t = list[i]; var x = tcx(t.x, t.y), y = tcy(t.x, t.y), h = hOf(t.k, t.l);
      if (Math.abs(w[0] - x) < 34 && w[1] > y - h - 4 && w[1] < y + 17 - Math.abs(w[0] - x) * 0.0) { select(kfy(t.x, t.y)); return; }
    }
    var g = tileAt(w[0], w[1]);
    if (g && !isRoad(g[0], g[1])) { select(kfy(g[0], g[1])); return; }
    if (sel) { sel = null; dirty = true; renderBody(); DKAudio.sfx('tap'); }
  }
  function tileAt(wx, wy) {
    var a = wy / 16, b = wx / 32, rx = Math.round((a + b) / 2), ry = Math.round((a - b) / 2);
    if (rx < 0 || ry < 0 || rx >= N || ry >= N) return null;
    var iq = rg(rx, ry, (4 - VR) % 4), gx = iq[0], gy = iq[1];
    var dx = Math.abs(wx - tcx(gx, gy)) / 32, dy = Math.abs(wy - tcy(gx, gy)) / 16;
    return dx + dy <= 1.02 ? [gx, gy] : null;
  }
  function select(key) {
    sel = key; tab = 'build'; place = null; sellArm = 0; dirty = true; DKAudio.sfx('tap');
    var p = key.split(',').map(Number), z = ZONES[zoneOf(p[0], p[1])];
    if (!S.tiles[key] && z.req > S.level) { DKAudio.sfx('error'); banner(z.n + ' terkunci', 'Terbuka di level kota ' + z.req, 'bad'); }
    renderBody(); showHint();
    if (window.matchMedia && matchMedia('(max-width: 820px)').matches) body.scrollTop = 0;
  }
  function claimBalloon() {
    var b = fx.bal; if (!b) return;
    var amt = Math.max(30, Math.floor(totalBase() * 45)); S.coins += amt; S.earned += amt; S.stats.balloons++; evt('balloon', 1); evt('earn', amt);
    DKAudio.sfx('sparkle'); DKAudio.sfx('cash', 0.7); sparkle2(b.x, b.y); flyCoins(b.x, b.y, 8, true); banner('Balon bonus! +' + fmtN(amt), 'Setara 45 detik pendapatan', 'ok');
    fx.bal = null; balT = 45 + Math.random() * 45; checkAch(); dirty = true; touchSave();
  }
  function sparkle2(sx, sy) { var w = toWorld(sx, sy); sparkle(w[0], w[1], 22); }

  function onKey(e) {
    if (!alive || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    if (overlayOpen()) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeOverlay(); } return; }
    var k = e.key;
    if (k === 'c' || k === 'C') collectAll(false);
    else if ((k === 'u' || k === 'U') && sel) upgrade(sel);
    else if (k === '+' || k === '=') zoom(1.2); else if (k === '-' || k === '_') zoom(0.83);
    else if (k === 'p' || k === 'P') promo();
    else if (k === '0') { cam.z = cam.fit; cam.x = 0; cam.y = 44; clampCam(); }
  }
  function onVis() { if (document.hidden) { persist(); } else { last = performance.now(); } }

  function api() {
    return { S: function () { return S; }, build: build, upgrade: upgrade, collectAll: collectAll, collect: collect, sell: sell, select: select, promo: promo, tap: tap, B: B, LV: LV, ACH: ACH, calcScore: calcScore, totalBase: totalBase, claimMission: claimMission, mDone: mDone, claimTarget: claimTarget, cam: cam, toScreen: toScreen, balloon: function () { balT = 0; }, place: function (k) { place = k; }, fx: fx, upCost: upCost, incAt: incAt, resetGame: resetGame, buyAuto: buyAuto, renderBody: renderBody, setTab: function (t) { tab = t; dirty = true; renderBody(); } };
  }

  /* kembali (tombol Back / Esc): tutup lapisan kecil lebih dulu sebelum keluar dari game */
  function onBack() {
    if (!alive) return false;
    if (overlayOpen()) { closeOverlay(); return true; }
    if (place) { place = null; dirty = true; renderBody(); showHint(); return true; }
    if (sel) { sel = null; dirty = true; renderBody(); return true; }
    return false;
  }

  DG.register('tycoon', { title: 'Money Tycoon', mount: mount, unmount: unmount, musicTrack: 'city', wantsMusic: function () { return true; }, onEscape: onBack, onBack: onBack, onClick: function () {} });
})();
