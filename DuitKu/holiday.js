/* DuitKu — hari besar & hari penting. Tanggal dihitung di perangkat (kalender Hijriah, Imlek, Paskah, Bali, bulan purnama).
   Penetapan resmi pemerintah bisa berbeda ±1 hari, jadi ditampilkan sebagai perkiraan. */
(function () {
  'use strict';
  var DAY = 864e5;
  function dk(y, m, d) { return new Date(y, m - 1, d, 12); }
  function key(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  function add(dt, n) { return new Date(dt.getTime() + n * DAY); }
  var fH, fC;
  try { fH = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric' }); fC = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric' }); } catch (e) {}
  function scan(y, fmt, mm, dd) {
    if (!fmt) return null;
    for (var t = dk(y, 1, 1), e = dk(y, 12, 31); t <= e; t = add(t, 1)) {
      var p = fmt.format(t).split('/');
      if (+p[0] === mm && +p[1] === dd && /^\d+$/.test(p[0])) return t;
    }
    return null;
  }
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), da = (h + l - 7 * m + 114) % 31 + 1;
    return dk(y, mo, da);
  }
  /* bulan purnama (rata-rata) → ±1 hari */
  function fullMoons(y) {
    var base = Date.UTC(2000, 0, 6, 18, 14) + 14.765294 * DAY, syn = 29.530588861 * DAY, out = [];
    var n = Math.floor((Date.UTC(y, 0, 1) - base) / syn) - 1;
    for (var k = n; k < n + 15; k++) { var t = new Date(base + k * syn); out.push(dk(t.getFullYear(), t.getMonth() + 1, t.getDate())); }
    return out;
  }
  function fm(y, m1, d1, m2, d2) { var a = dk(y, m1, d1), b = dk(y, m2, d2), r = fullMoons(y).filter(function (t) { return t >= a && t <= b; }); return r[0] || null; }
  var GAL = dk(2025, 4, 23), NYEPI = { 2026: [3, 19], 2027: [3, 9], 2028: [3, 28], 2029: [3, 17], 2030: [3, 6] }, DIWALI = { 2026: [11, 8], 2027: [10, 29], 2028: [10, 17], 2029: [11, 5], 2030: [10, 26] };
  function qing(y) { var yy = y % 100, d = Math.floor(yy * .2422 + 4.81) - Math.floor((yy - 1) / 4); return dk(y, 4, d); }
  function dong(y) { var yy = y % 100, d = Math.floor(yy * .2422 + 21.94) - Math.floor((yy - 1) / 4); return dk(y, 12, d); }

  /* tema: warna (gradasi), motif, ucapan, saran keuangan */
  var TH = {
    natal: { c: ['#7f1d1d', '#166534'], m: ['tree', 'snow'], w: 'Selamat Natal', tip: 'Siapkan anggaran hadiah dan perjalanan akhir tahun.' },
    tahunbaru: { c: ['#1e1b4b', '#b45309'], m: ['fire', 'star'], w: 'Selamat Tahun Baru', tip: 'Waktu yang pas menyusun target tabungan baru.' },
    ramadan: { c: ['#064e3b', '#92400e'], m: ['moon', 'lantern'], w: 'Marhaban ya Ramadan', tip: 'Rencanakan anggaran sahur, buka puasa, zakat, dan THR.' },
    fitri: { c: ['#065f46', '#b45309'], m: ['moon', 'ketupat'], w: 'Selamat Idul Fitri, mohon maaf lahir dan batin', tip: 'Catat THR dan pengeluaran mudik agar tetap terkendali.' },
    adha: { c: ['#14532d', '#78350f'], m: ['moon', 'star'], w: 'Selamat Idul Adha', tip: 'Sisihkan dana untuk kurban dan berbagi.' },
    hijriah: { c: ['#0f3d3a', '#a16207'], m: ['moon', 'star'], w: 'Selamat Tahun Baru Islam', tip: 'Awal baru yang baik untuk evaluasi keuangan.' },
    islam: { c: ['#0f3d3a', '#a16207'], m: ['moon', 'star'], w: 'Selamat memperingati hari besar Islam', tip: 'Catat sedekah dan donasi agar tidak terlewat.' },
    imlek: { c: ['#991b1b', '#b45309'], m: ['lantern', 'coin'], w: 'Gong Xi Fa Cai', tip: 'Siapkan angpao dan hadiah dalam anggaran khusus.' },
    paskah: { c: ['#5b21b6', '#be185d'], m: ['egg', 'cross'], w: 'Selamat Paskah', tip: 'Atur anggaran kumpul keluarga dan perjalanan.' },
    kristen: { c: ['#3730a3', '#0e7490'], m: ['cross', 'star'], w: 'Selamat memperingati hari besar Kristiani', tip: 'Catat persembahan dan kegiatan sosial.' },
    nyepi: { c: ['#1e293b', '#a16207'], m: ['star', 'diya'], w: 'Selamat Hari Raya Nyepi', tip: 'Hari hening: waktu yang tenang untuk meninjau keuangan.' },
    hindu: { c: ['#9a3412', '#a16207'], m: ['diya', 'flower'], w: 'Selamat Hari Raya', tip: 'Siapkan anggaran upacara dan persembahan.' },
    diwali: { c: ['#7c2d12', '#a21caf'], m: ['diya', 'star'], w: 'Selamat Deepavali', tip: 'Siapkan anggaran perayaan dan berbagi.' },
    waisak: { c: ['#92400e', '#0e7490'], m: ['lotus', 'star'], w: 'Selamat Hari Raya Waisak', tip: 'Waktu yang tepat untuk berdana dan berbagi.' },
    buddha: { c: ['#a16207', '#0f766e'], m: ['lotus', 'star'], w: 'Selamat memperingati hari besar Buddha', tip: 'Catat dana kebajikan secara teratur.' },
    konghucu: { c: ['#9f1239', '#854d0e'], m: ['lantern', 'coin'], w: 'Selamat memperingati hari besar Konghucu', tip: 'Siapkan anggaran persembahyangan dan keluarga.' },
    merdeka: { c: ['#b91c1c', '#7f1d1d'], m: ['flag', 'star'], w: 'Dirgahayu Republik Indonesia', tip: 'Anggarkan acara lomba dan kumpul warga.' },
    nasional: { c: ['#be123c', '#1d4ed8'], m: ['flag', 'star'], w: 'Selamat memperingati hari nasional', tip: 'Manfaatkan hari libur untuk meninjau pengeluaran.' },
    valentine: { c: ['#9d174d', '#be123c'], m: ['heart', 'star'], w: 'Selamat Hari Valentine', tip: 'Tentukan batas belanja hadiah sebelum membeli.' },
    ibu: { c: ['#9d174d', '#c2410c'], m: ['heart', 'flower'], w: 'Selamat Hari Ibu', tip: 'Siapkan anggaran hadiah untuk Ibu.' },
    buruh: { c: ['#b91c1c', '#1e3a8a'], m: ['star', 'coin'], w: 'Selamat Hari Buruh', tip: 'Evaluasi penghasilan dan pengeluaran bulananmu.' }
  };
  /* [id, nama, tema, hari persiapan (jendela tampil)] */
  function build(y) {
    var L = [], e = easter(y), g0 = GAL, g = [], k;
    function P(dt, id, name, th, lead, grp) { if (dt) L.push({ id: id + y, name: name, theme: th, date: dt, lead: lead || 14, grp: grp }); }
    /* tetap */
    P(dk(y, 1, 1), 'tb', 'Tahun Baru ' + y, 'tahunbaru', 10, 'Nasional');
    P(dk(y, 2, 14), 'val', 'Hari Valentine', 'valentine', 7, 'Umum');
    P(dk(y, 4, 21), 'kar', 'Hari Kartini', 'nasional', 5, 'Nasional');
    P(dk(y, 5, 1), 'bur', 'Hari Buruh', 'buruh', 4, 'Nasional');
    P(dk(y, 6, 1), 'pan', 'Hari Lahir Pancasila', 'nasional', 4, 'Nasional');
    P(dk(y, 8, 17), 'mrd', 'Hari Kemerdekaan Indonesia', 'merdeka', 18, 'Nasional');
    P(dk(y, 10, 28), 'sum', 'Hari Sumpah Pemuda', 'nasional', 5, 'Nasional');
    P(dk(y, 11, 10), 'pah', 'Hari Pahlawan', 'nasional', 5, 'Nasional');
    P(dk(y, 12, 22), 'ibu', 'Hari Ibu', 'ibu', 6, 'Nasional');
    P(dk(y, 12, 25), 'nat', 'Natal', 'natal', 40, 'Kristen & Katolik'); P(dk(y + 1, 1, 1), 'tbn', 'Tahun Baru ' + (y + 1), 'tahunbaru', 36, 'Nasional');
    P(dk(y, 11, 1), 'sok', 'Hari Raya Semua Orang Kudus', 'kristen', 5, 'Katolik');
    /* Kristen & Katolik (Paskah) */
    P(add(e, -46), 'rab', 'Rabu Abu', 'kristen', 5, 'Katolik'); P(add(e, -7), 'pal', 'Minggu Palma', 'kristen', 5, 'Katolik'); P(add(e, -3), 'kam', 'Kamis Putih', 'kristen', 3, 'Katolik');
    P(add(e, -2), 'jum', 'Jumat Agung', 'paskah', 7, 'Kristen & Katolik'); P(e, 'pas', 'Paskah', 'paskah', 7, 'Kristen & Katolik');
    P(add(e, 39), 'ken', 'Kenaikan Yesus Kristus', 'kristen', 5, 'Kristen & Katolik'); P(add(e, 49), 'pen', 'Pentakosta', 'kristen', 5, 'Kristen & Katolik');
    /* Islam (Hijriah) */
    var rm = scan(y, fH, 9, 1);
    P(rm, 'ram', 'Awal Ramadan', 'ramadan', 14, 'Islam');
    P(rm && add(rm, 16), 'nuz', 'Nuzulul Qur\'an', 'ramadan', 3, 'Islam');
    P(scan(y, fH, 10, 1), 'fit', 'Idul Fitri', 'fitri', 12, 'Islam');
    P(scan(y, fH, 12, 10), 'adh', 'Idul Adha', 'adha', 12, 'Islam');
    P(scan(y, fH, 1, 1), 'hij', 'Tahun Baru Islam', 'hijriah', 6, 'Islam');
    P(scan(y, fH, 7, 27), 'isr', 'Isra Mikraj', 'islam', 5, 'Islam');
    P(scan(y, fH, 3, 12), 'mau', 'Maulid Nabi Muhammad SAW', 'islam', 6, 'Islam');
    /* Konghucu / Tionghoa */
    var im = scan(y, fC, 1, 1);
    P(im, 'iml', 'Tahun Baru Imlek', 'imlek', 20, 'Konghucu');
    P(scan(y, fC, 1, 15), 'cgm', 'Cap Go Meh', 'imlek', 5, 'Konghucu');
    P(qing(y), 'qin', 'Qingming', 'konghucu', 5, 'Konghucu');
    P(scan(y, fC, 5, 5), 'dua', 'Duan Yang', 'konghucu', 5, 'Konghucu');
    P(scan(y, fC, 8, 27), 'kon', 'Hari Lahir Kongzi', 'konghucu', 5, 'Konghucu');
    P(dong(y), 'don', 'Dongzhi', 'konghucu', 5, 'Konghucu');
    /* Hindu */
    if (NYEPI[y]) P(dk(y, NYEPI[y][0], NYEPI[y][1]), 'nye', 'Nyepi (Tahun Baru Saka)', 'nyepi', 9, 'Hindu');
    if (DIWALI[y]) P(dk(y, DIWALI[y][0], DIWALI[y][1]), 'diw', 'Deepavali', 'diwali', 9, 'Hindu');
    for (k = -3; k <= 8; k++) { var gd = add(g0, k * 210); if (gd.getFullYear() === y) { P(gd, 'gal' + k, 'Galungan', 'hindu', 5, 'Hindu'); P(add(gd, 10), 'kun' + k, 'Kuningan', 'hindu', 4, 'Hindu'); }
      var sd = add(gd, -74); if (sd.getFullYear() === y) { P(sd, 'sar' + k, 'Saraswati', 'hindu', 3, 'Hindu'); P(add(sd, 4), 'pag' + k, 'Pagerwesi', 'hindu', 3, 'Hindu'); } }
    /* Buddha */
    P(fm(y, 5, 5, 6, 8), 'wai', 'Waisak', 'waisak', 10, 'Buddha');
    P(fm(y, 2, 8, 3, 14), 'mag', 'Magha Puja', 'buddha', 5, 'Buddha');
    P(fm(y, 7, 3, 8, 5), 'asa', 'Asadha', 'buddha', 5, 'Buddha');
    var kt = fm(y, 10, 1, 11, 10); if (kt) P(add(kt, 1), 'kat', 'Kathina', 'buddha', 5, 'Buddha');
    return L;
  }
  var cache = {};
  function all(y) { return cache[y] || (cache[y] = build(y)); }

  /* peristiwa yang sedang "aktif" di sekitar tanggal t */
  function active(t) {
    var t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12), out = [];
    [t0.getFullYear() - 1, t0.getFullYear(), t0.getFullYear() + 1].forEach(function (y) {
      all(y).forEach(function (h) {
        var d = Math.round((h.date - t0) / DAY);
        if (h.id.indexOf('ram') === 0) { if (d <= h.lead && d >= -29) out.push(Object.assign({ d: d }, h)); return; }
        if (d <= h.lead && d >= 0) out.push(Object.assign({ d: d }, h));
        else if (d === -1 && /^(tb|nat)/.test(h.id)) out.push(Object.assign({ d: d }, h)); /* sehari setelah, masih hangat */
      });
    });
    out.sort(function (a, b) { return a.d - b.d; });
    var seen = {}; return out.filter(function (h) { var k = h.name + h.date.getTime(); if (seen[k]) return false; seen[k] = 1; return true; });
  }

  /* gabungkan bila berdekatan: tema warna dari dua yang terdekat */
  var BIG = { natal: 1, tahunbaru: 1, imlek: 1, ramadan: 1, fitri: 1, adha: 1, nyepi: 1, waisak: 1, diwali: 1, merdeka: 1, paskah: 1 };
  function pick(t) {
    var a = active(t); if (!a.length) return null;
    var rk = function (h) { var ongoing = h.id.indexOf('ram') === 0 && h.d < 0; return (h.d === 0 ? 0 : ongoing ? 2 : h.d < 0 ? 40 : 10) + (BIG[h.theme] ? 0 : 6) + Math.max(0, h.d) * .25; };
    a.sort(function (x, y) { return rk(x) - rk(y); });
    var main = a[0], second = a.slice(1).filter(function (h) { return h.name !== main.name && (BIG[h.theme] || Math.abs(h.d - main.d) <= 3); })[0];
    /* "Tahun Baru" yang sama dengan Natal tahun itu: tampil sebagai paket */
    var names = [main.name].concat(second ? [second.name] : []), themes = [main.theme];
    if (second && themes.indexOf(second.theme) < 0) themes.push(second.theme);
    if (names.length === 2 && /^Tahun Baru \d/.test(names[0]) && names[1] === 'Natal') { names.reverse(); themes.reverse(); }
    return { main: main, all: a, names: names, themes: themes };
  }

  var ICON = {
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="currentColor"/><path d="M17 5l.7 1.6 1.6.7-1.6.7L17 9.6l-.7-1.6-1.6-.7 1.6-.7z" fill="currentColor"/>',
    star: '<path d="M12 3l2.5 5.6 6 .6-4.5 4.1 1.3 6L12 16.2 6.7 19.3l1.3-6L3.5 9.2l6-.6z" fill="currentColor"/>',
    lantern: '<path d="M12 2v3M9 5h6" stroke="currentColor" stroke-width="1.6" fill="none"/><rect x="6" y="6" width="12" height="12" rx="6" fill="currentColor"/><path d="M12 6v12M9 7.5c-1.5 3-1.5 6 0 9M15 7.5c1.5 3 1.5 6 0 9" stroke="rgba(0,0,0,.28)" stroke-width="1" fill="none"/><path d="M10 18v3M12 18v3.5M14 18v3" stroke="currentColor" stroke-width="1.4"/>',
    tree: '<path d="M12 2l5 7h-3l4 6h-4l3 5H7l3-5H6l4-6H7z" fill="currentColor"/><path d="M12 20v2.5" stroke="currentColor" stroke-width="2.4"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5L12 6.5l2.5-2M9.5 19.5l2.5-2 2.5 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>',
    fire: '<path d="M12 12V4M12 12L6 6M12 12l6-6M12 12H4.5M12 12h7.5M12 12l-5.5 5.5M12 12l5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
    egg: '<path d="M12 3c3.6 0 6 5.2 6 9.5a6 6 0 0 1-12 0C6 8.2 8.4 3 12 3z" fill="currentColor"/><path d="M6.5 13c2-1.4 3.6-1.4 5.5 0s3.5 1.4 5.5 0" stroke="rgba(255,255,255,.55)" stroke-width="1.4" fill="none"/>',
    cross: '<path d="M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z" fill="currentColor"/>',
    diya: '<path d="M3 13h18c0 4-3.5 7-9 7s-9-3-9-7z" fill="currentColor"/><path d="M12 3c2.5 2.5 3 5 0 8-3-3-2.5-5.5 0-8z" fill="currentColor"/>',
    flower: '<circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 3a3.2 3.2 0 0 1 0 6.4A3.2 3.2 0 0 1 12 3zM12 14.6a3.2 3.2 0 0 1 0 6.4 3.2 3.2 0 0 1 0-6.4zM3 12a3.2 3.2 0 0 1 6.4 0A3.2 3.2 0 0 1 3 12zM14.6 12a3.2 3.2 0 0 1 6.4 0 3.2 3.2 0 0 1-6.4 0z" fill="currentColor" opacity=".7"/>',
    lotus: '<path d="M12 4c2.4 2.6 3.3 5.6 0 9.5C8.7 9.6 9.6 6.6 12 4zM4 8c3-.4 5.6 1 7 5.5-3.4 1-6.4-.8-7-5.5zM20 8c-.6 4.7-3.6 6.5-7 5.5 1.4-4.5 4-5.9 7-5.5z" fill="currentColor"/><path d="M4 16c4 3 12 3 16 0" stroke="currentColor" stroke-width="1.6" fill="none"/>',
    flag: '<path d="M6 3v18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 4h12v8H6z" fill="currentColor"/>',
    heart: '<path d="M12 20.5S3.5 15 3.5 9A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2c0 6-8.5 11.5-8.5 11.5z" fill="currentColor"/>',
    coin: '<circle cx="12" cy="12" r="8.5" fill="currentColor"/><rect x="9.6" y="9.6" width="4.8" height="4.8" rx=".6" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.4"/>',
    ketupat: '<path d="M12 2l7 10-7 10-7-10z" fill="currentColor"/><path d="M8 7l8 10M16 7l-8 10" stroke="rgba(0,0,0,.28)" stroke-width="1.2"/>'
  };
  function svg(n, s) { return '<svg viewBox="0 0 24 24" width="' + (s || 24) + '" height="' + (s || 24) + '" aria-hidden="true">' + (ICON[n] || ICON.star) + '</svg>'; }
  function esc2(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var BM = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function fmtD(dt) { return dt.getDate() + ' ' + BM[dt.getMonth()] + ' ' + dt.getFullYear(); }
  function whenTxt(h) { return h.d === 0 ? 'Hari ini' : h.d === 1 ? 'Besok' : h.d > 0 ? 'H-' + h.d : 'Baru berlalu'; }

  function html(t) {
    t = t || new Date(); var p = pick(t); if (!p) return '';
    var m = p.main, th1 = TH[p.themes[0]], th2 = TH[p.themes[1]] || th1;
    var dis = ''; try { dis = localStorage.getItem('duitku_hol_off') || ''; } catch (e) {}
    var k = key(t) + p.themes.join('+'); if (dis === k) return '';
    var title = p.names.length > 1 ? p.names[0] + ' & ' + p.names[1] : p.names[0];
    var ramadanIn = p.all.filter(function (h) { return h.id.indexOf('ram') === 0 && h.d < 0; })[0];
    var sub;
    if (ramadanIn && p.names.length < 2) { sub = 'Hari ke-' + (-ramadanIn.d + 1) + ' Ramadan'; }
    else sub = fmtD(m.date) + (m.grp ? ' · ' + m.grp : '');
    var wish = m.d <= 0 ? th1.w : th1.w.replace(/^Selamat /, 'Menuju ');
    var wish2 = p.themes.length > 1 && p.names.length > 1 ? ' · ' + (m.d <= 0 ? th2.w : TH[p.themes[1]].w) : '';
    var ics = th1.m.concat(th2.m).slice(0, 4);
    var fx = '', cols = [th1.c[0], th1.c[1], th2.c[1], '#ffffff', '#ffd60a', '#ffe9a8'], i2;
    for (var i = 0; i < 12; i++) fx += '<i style="--l:' + (3 + (i * 8.3) % 94) + '%;--s:' + (16 + (i * 7) % 18) + 'px;--d:' + (5 + (i * 1.3) % 5).toFixed(1) + 's;--w:' + ((i * .7) % 4).toFixed(1) + 's">' + svg(ics[i % ics.length], 28) + '</i>';
    for (i2 = 0; i2 < 26; i2++) fx += '<b class="hc" style="--l:' + ((i2 * 13.7 + 5) % 98) + '%;--c:' + cols[i2 % cols.length] + ';--w:' + (4 + (i2 * 3) % 5) + 'px;--h:' + (8 + (i2 * 5) % 8) + 'px;--d:' + (3.4 + (i2 * .53) % 3.2).toFixed(1) + 's;--t:' + ((i2 * .37) % 3.6).toFixed(1) + 's;--r:' + (i2 * 47 % 360) + 'deg"></b>';
    for (i2 = 0; i2 < 9; i2++) fx += '<s class="hs" style="--x:' + ((i2 * 11.3 + 8) % 92) + '%;--y:' + ((i2 * 29 + 12) % 80) + '%;--z:' + (8 + (i2 * 5) % 10) + 'px;--t:' + ((i2 * .6) % 2.8).toFixed(1) + 's"></s>';
    var chip = m.d === 0 ? 'Hari ini' : m.d < 0 ? 'Sedang berlangsung' : m.d + ' hari lagi';
    var others = p.all.filter(function (h) { return h !== m && p.names.indexOf(h.name) < 0; }).slice(0, 2);
    return '<section class="hol-banner' + (p.themes.length < 2 || p.themes[0] === p.themes[1] ? ' hol-one' : '') + '" style="--h1:' + th1.c[0] + ';--h2:' + th2.c[1] + ';--h3:' + th1.c[1] + '" data-k="' + esc2(k) + '" aria-label="Hari besar">' +
      '<div class="hol-fx" aria-hidden="true">' + fx + '</div>' +
      '<div class="hol-ic" aria-hidden="true">' + svg(ics[0], 30) + (ics[1] ? svg(ics[1], 20) : '') + '</div>' +
      '<div class="hol-tx"><span class="hol-chip">' + esc2(chip) + '</span><span class="hol-when">' + esc2(sub) + '</span><b class="hol-t">' + esc2(title) + '</b><span class="hol-w">' + esc2(wish + wish2) + '</span>' +
      '<span class="hol-tip">' + esc2(th1.tip) + '</span>' +
      (others.length ? '<span class="hol-more">Juga: ' + others.map(function (h) { return esc2(h.name) + ' (' + whenTxt(h).toLowerCase() + ')'; }).join(' · ') + '</span>' : '') + '</div>' +
      '<div class="hol-act"><button type="button" class="hol-btn" data-go="bud">Atur anggaran</button><button type="button" class="hol-x" data-hol-x aria-label="Sembunyikan">' + svg('x') + '</button></div></section>';
  }
  ICON.x = '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>';

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-hol-x]'); if (!b) return;
    var s = b.closest('.hol-banner'); try { localStorage.setItem('duitku_hol_off', s.dataset.k); } catch (er) {}
    s.classList.add('out'); setTimeout(function () { s.remove(); }, 380);
  });
  window.DKHol = { html: html, pick: pick, active: active, all: all, key: key };
})();
