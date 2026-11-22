/* DuitKu Intelligence — Tanya DuitKu (chat lokal)
   Menjawab pertanyaan soal uang langsung dari data di perangkat: tidak memakai layanan AI, API, atau server.
   Cara kerja: pertanyaan dibaca dengan aturan kata kunci -> (1) jawaban cepat dari data (saldo, pemasukan, pengeluaran,
   kategori, anggaran, tabungan, utang, tagihan), (2) Smart Spend Guard untuk "bisa beli ... Rp ...?", atau
   (3) salah satu dari 100 analisis DuitKu Intelligence yang paling cocok. Riwayat chat hanya disimpan di browser ini. */
(function () {
  'use strict';
  var KEY = 'duitku_ai_history', MAXH = 40, busy = false;
  var hist = load();

  function load() {
    try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.v === 2 && Array.isArray(o.m)) return o.m.slice(-MAXH); } catch (e) {}
    return [];
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ v: 2, m: hist.slice(-MAXH) })); } catch (e) {} }
  function X() { return window.DKIntel; }
  function el(id) { return document.getElementById(id); }


  /* ---------- pembantu data tambahan ---------- */
  var PL = { cur: 'bulan ini', prev: 'bulan lalu', '7d': '7 hari terakhir', '30d': '30 hari terakhir', '3m': '3 bulan terakhir', '6m': '6 bulan terakhir', year: 'tahun ini', all: 'seluruh data' };
  function ymdLocal(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function inPer(per) {
    var t = today(), cm = ym(t);
    function back(n) { var d = new Date(t + 'T00:00'); d.setDate(d.getDate() - n); return ymdLocal(d); }
    if (per === 'prev') { var pm = shiftYm(cm, -1); return function (x) { return x.date.startsWith(pm); }; }
    if (per === '7d') { var a = back(6); return function (x) { return x.date >= a && x.date <= t; }; }
    if (per === '30d') { var b = back(29); return function (x) { return x.date >= b && x.date <= t; }; }
    if (per === '3m') { var c3 = back(89); return function (x) { return x.date >= c3 && x.date <= t; }; }
    if (per === '6m') { var c6 = back(179); return function (x) { return x.date >= c6 && x.date <= t; }; }
    if (per === 'year') return function (x) { return x.date.startsWith(t.slice(0, 4)); };
    if (per === 'all') return function () { return true; };
    return function (x) { return x.date.startsWith(cm); };
  }
  function sumTx(list, type) { return list.filter(function (x) { return x.type === type; }).reduce(function (s, x) { return s + x.amount; }, 0); }
  function money(n) { return fmt(n, P.currency); }
  var SYNC = [[/makan|kopi|resto|jajan|minum|boba|sarapan/, 'Makanan'], [/baju|sepatu|jaket|celana|kaos|pakaian/, 'Pakaian'], [/bensin|ojek|bus|kereta|pesawat|transport|parkir/, 'Transportasi'], [/buku|kursus|kuliah|sekolah|spp|pendidikan/, 'Pendidikan'], [/film|game|konser|nonton|netflix|hiburan/, 'Hiburan'], [/obat|dokter|vitamin|kesehatan/, 'Kesehatan'], [/wifi|internet|kuota|pulsa/, 'Internet']];
  function findCat(q) {
    var all = []; try { all = (CO || []).concat(CI || []); } catch (e) {}
    for (var i = 0; i < all.length; i++) if (q.indexOf(norm(all[i])) >= 0) return all[i];
    for (var j = 0; j < SYNC.length; j++) if (SYNC[j][0].test(q)) return SYNC[j][1];
    return null;
  }
  function findWallet(q) { var ws = D.wallets.filter(function (w) { return w.active !== false; }); for (var i = 0; i < ws.length; i++) { var n = norm(ws[i].name); if (n.length > 1 && q.indexOf(n) >= 0) return ws[i]; } return null; }
  function follow(d) {
    var f = d.k === 'fact' ? d.f : d.k, m = {
      saldo: ['Pengeluaran terbesar bulan ini', 'Pemasukan bulan ini', 'Berapa bisa menabung?'], keluar: ['Pengeluaran terbesar bulan ini', 'Rata-rata pengeluaran per hari', 'Bandingkan dengan bulan lalu'],
      masuk: ['Selisih pemasukan dan pengeluaran', 'Berapa bisa menabung?'], bersih: ['Pengeluaran terbesar bulan ini', 'Tips hemat'], topcat: ['Cek status anggaran', 'Transaksi terbesar bulan ini', 'Tips hemat'],
      anggaran: ['Tips hemat', 'Pengeluaran terbesar bulan ini'], tabungan: ['Berapa bisa menabung?', 'Saldo dompetku'], utang: ['Tagihan 2 minggu ke depan', 'Saldo dompetku'], tagihan: ['Saldo dompetku', 'Cek status anggaran'],
      guard: ['Cek status anggaran', 'Berapa bisa menabung?'], cmp: ['Pengeluaran terbesar bulan ini', 'Tips hemat'], big: ['Pengeluaran terbesar bulan ini', 'Transaksi terakhir'], last: ['Pengeluaran hari ini', 'Saldo dompetku'],
      today: ['Rata-rata pengeluaran per hari', 'Transaksi terakhir'], avg: ['Prediksi pengeluaran bulan ini', 'Cek status anggaran'], cat: ['Pengeluaran terbesar bulan ini', 'Cek status anggaran'], wal1: ['Saldo dompetku', 'Transaksi terakhir'],
      calc: ['Saldo dompetku', 'Bagaimana kondisi keuanganku?'], date: ['Pengeluaran hari ini', 'Transaksi terakhir'], allow: ['Prediksi pengeluaran akhir bulan', 'Cek status anggaran'], proj: ['Jatah uang harian', 'Tips hemat'], bigin: ['Pemasukan bulan ini', 'Berapa bisa menabung?'], count: ['Transaksi terakhir', 'Pengeluaran terbesar bulan ini'], search: ['Transaksi terakhir', 'Saldo dompetku'],
      save: ['Progres target tabungan', 'Tips hemat'], tips: ['Cek status anggaran', 'Berapa bisa menabung?'], hello: ['Bagaimana kondisi keuanganku?', 'Saldo dompetku'], none: ['Bagaimana kondisi keuanganku?', 'Saldo dompetku', 'Pengeluaran terbesar bulan ini']
    };
    return m[f] || ['Bagaimana kondisi keuanganku?', 'Saldo dompetku'];
  }
  /* ---------- pembaca pertanyaan ---------- */
  function norm(q) {
    return String(q || '').toLowerCase()
      .replace(/\bgak\b|\bga\b|\bnggak\b|\benggak\b/g, 'tidak').replace(/\bbrp\b/g, 'berapa').replace(/\bduit\b|\buang\b/g, 'uang')
      .replace(/[^a-z0-9%.,#\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function parseAmt(q) {
    var re = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)*)\s*(juta|jt|ribu|rb|k|miliar|m)?(?![a-z])/g, m, best = null;
    while ((m = re.exec(q))) {
      var raw = m[1], suf = m[2] || '', n;
      if (suf && /^\d+[.,]\d{1,2}$/.test(raw)) n = parseFloat(raw.replace(',', '.'));
      else n = parseFloat(raw.replace(/[.,]/g, ''));
      if (!isFinite(n)) continue;
      var mul = { juta: 1e6, jt: 1e6, ribu: 1e3, rb: 1e3, k: 1e3, miliar: 1e9, m: 1e9 }[suf] || 1;
      n = Math.round(n * mul);
      if ((suf && n >= 1000) || (!suf && n >= 10000)) { best = n; break; }
    }
    return best;
  }
  function detectPeriod(q) {
    if (/bulan (lalu|kemarin|sebelumnya)/.test(q)) return 'prev';
    if (/(minggu|pekan) (ini|lalu)|7 hari|seminggu/.test(q)) return '7d';
    if (/30 hari|sebulan terakhir/.test(q)) return '30d';
    if (/3 bulan|tiga bulan/.test(q)) return '3m';
    if (/6 bulan|enam bulan|setengah tahun/.test(q)) return '6m';
    if (/tahun ini|setahun|sepanjang tahun/.test(q)) return 'year';
    if (/semua data|sejak awal|keseluruhan/.test(q)) return 'all';
    return null;
  }
  function guessCat(q) {
    var map = [[/makan|kopi|resto|jajan|minum|boba/, 'Makanan'], [/baju|sepatu|jaket|celana|tas |kaos/, 'Pakaian'], [/motor|mobil|bensin|tiket|ojek|bus |kereta|pesawat/, 'Transportasi'],
      [/buku|kursus|kuliah|sekolah|spp|les /, 'Pendidikan'], [/film|game|konser|nonton|netflix|liburan|wisata/, 'Hiburan'], [/obat|dokter|rumah sakit|vitamin/, 'Kesehatan'],
      [/gym|olahraga|fitness/, 'Kebugaran'], [/kucing|anjing|hewan/, 'Peliharaan'], [/wifi|internet|kuota|pulsa/, 'Internet'], [/kos|kontrakan|sewa|rumah/, 'Tempat tinggal']];
    for (var i = 0; i < map.length; i++) if (map[i][0].test(q + ' ')) return map[i][1];
    return 'Belanja';
  }
  function itemName(raw) {
    var m = raw.replace(/\?/g, ' ').match(/(?:beli|membeli|belanja|ambil|cicil)\s+(.+?)(?:\s+(?:seharga|harga|dengan harga|senilai|rp|sebesar)\b|\s+\d|$)/i);
    var n = m ? m[1].replace(/\b(ya|dong|nih|sih|aja|saja|bisa|boleh|tidak|gak|apa|kah)\b/gi, '').replace(/\s+/g, ' ').trim() : '';
    return n.length > 40 ? n.slice(0, 40) : n;
  }

  var STOP = /^(yang|dan|di|ke|dari|untuk|apa|apakah|bagaimana|gimana|berapa|aku|saya|ku|dong|ya|nih|tolong|bisa|mau|lihat|tampilkan|tunjukkan|analisis|dengan|atau|ini|itu|ada|saja|aja|sih|kah|nya|yg|tidak|buat|bulan|tahun|hari|minggu)$/;
  var SYN = {
    boros: ['pengeluaran', 'kategori', 'terbesar'], hemat: ['hemat', 'penghematan', 'tabungan', 'pengeluaran'], nabung: ['tabungan', 'target'], menabung: ['tabungan', 'target'],
    cicilan: ['utang', 'tagihan'], bayar: ['tagihan', 'utang'], defisit: ['arus', 'kas', 'pengeluaran'], ramal: ['prediksi'], perkiraan: ['prediksi', 'estimasi'],
    darurat: ['dana', 'darurat'], bandingkan: ['perbandingan', 'periode'], banding: ['perbandingan', 'periode'], langganan: ['rutin', 'langganan'], rutin: ['rutin', 'langganan'],
    gaji: ['pemasukan', 'gaji'], investasi: ['tabungan', 'target'], sehat: ['kondisi', 'keuangan'], kondisi: ['kondisi', 'keuangan'], rasio: ['rasio', 'pengeluaran'],
    kebiasaan: ['kebiasaan'], jajan: ['makanan', 'pengeluaran', 'kecil'], impulsif: ['kebiasaan', 'pengeluaran'], ringkasan: ['ringkasan', 'kondisi'], rekomendasi: ['rekomendasi', 'tindakan'],
    saran: ['rekomendasi', 'tindakan'], tips: ['rekomendasi', 'tindakan']
  };
  function tokens(q) {
    var out = [];
    q.split(' ').forEach(function (w) {
      if (w.length < 3 || STOP.test(w) || /^\d+$/.test(w)) return;
      out.push(w); if (SYN[w]) SYN[w].forEach(function (s) { out.push(s); });
    });
    return out;
  }
  function hit(tok, text) {
    var words = text.toLowerCase().split(/[^a-z0-9]+/);
    for (var i = 0; i < words.length; i++) {
      var w = words[i]; if (w.length < 3) continue;
      if (w === tok || (tok.length >= 4 && (w.indexOf(tok) === 0 || (w.length >= 4 && tok.indexOf(w) === 0)))) return true;
    }
    return false;
  }
  function rank(q) {
    var K = X(); if (!K) return [];
    var tk = tokens(q); if (!tk.length) return [];
    var seen = {}, uniq = tk.filter(function (t) { return seen[t] ? false : (seen[t] = 1); });
    return K.AN.map(function (a) {
      var ct = K.catOf(a.cat), s = 0;
      uniq.forEach(function (t) { if (hit(t, a.title)) s += 3; if (hit(t, ct ? ct[1] : '')) s += 1.2; if (hit(t, a.desc)) s += 1; });
      if (s > 0 && !K.isBlocked(a)) s += .4;
      return { a: a, s: s };
    }).filter(function (x) { return x.s >= 3; }).sort(function (x, y) { return y.s - x.s || x.a.id - y.a.id; });
  }

  /* ---------- niat pertanyaan -> deskriptor jawaban ---------- */
  var lastD = null;
  function dateOf(q) {
    var t = today(), d = new Date(t + 'T00:00'), m;
    function sh(n) { var x = new Date(d); x.setDate(x.getDate() + n); return ymdLocal(x); }
    if (/\bkemarin\b/.test(q)) return sh(-1);
    if (/\bkemarin lusa|2 hari (yang )?lalu|dua hari lalu\b/.test(q)) return sh(-2);
    if ((m = q.match(/tanggal (\d{1,2})\b/))) { var dd = +m[1]; if (dd >= 1 && dd <= 31) { var x = new Date(d.getFullYear(), d.getMonth(), dd); if (x.getMonth() !== d.getMonth()) return null; return ymdLocal(x); } }
    var days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    if ((m = q.match(/hari (minggu|senin|selasa|rabu|kamis|jumat|sabtu)( lalu| kemarin)?/))) { var k = days.indexOf(m[1]), diff = (d.getDay() - k + 7) % 7; if (diff === 0) diff = 7; return sh(-diff); }
    return null;
  }
  function calc(raw) {
    var q = String(raw).toLowerCase().replace(/,/g, '.');
    var m = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:dari|of)\s*(?:rp\.?\s*)?(\d+(?:[.]\d+)*)\s*(juta|jt|ribu|rb|k|miliar)?/);
    var U = { juta: 1e6, jt: 1e6, ribu: 1e3, rb: 1e3, k: 1e3, miliar: 1e9 };
    if (m) { var base = parseFloat(m[2].replace(/\.(?=\d{3}\b)/g, '')) * (U[m[3]] || 1); return { expr: m[1] + '% dari ' + money(base), v: Math.round(base * parseFloat(m[1]) / 100) }; }
    var amts = [], re = /(?:rp\.?\s*)?(\d+(?:[.]\d{3})*(?:\.\d+)?)\s*(juta|jt|ribu|rb|k|miliar)?/g, mm;
    while ((mm = re.exec(q))) { var n = parseFloat(mm[1].replace(/\.(?=\d{3}\b)/g, '')); if (isFinite(n)) amts.push(n * (U[mm[2]] || 1)); }
    if (amts.length >= 2 && /(\+|tambah|ditambah|plus|dikurangi|kurang|-|minus|kali|x|dibagi|bagi|\/)/.test(q) && /(hitung|berapa|=|\?)/.test(q)) {
      var op = /dikurangi|kurang|minus|\s-\s/.test(q) ? '-' : /dibagi|bagi|\//.test(q) ? '/' : /kali|\sx\s|\*/.test(q) ? '*' : '+', a = amts[0], b = amts[1], v = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : (b ? a / b : 0);
      return { expr: money(a) + ' ' + op + ' ' + money(b), v: Math.round(v) };
    }
    return null;
  }
  function answer(raw) {
    var d0 = answer0(raw); if (d0 && d0[0] && d0[0].k !== 'none' && d0[0].k !== 'hello') lastD = d0[0]; return d0;
  }
  function answer0(raw) {
    var q = norm(raw), per = detectPeriod(q), amt = parseAmt(q), m;
    if (!q) return [{ k: 'text', t: '<p>Tulis pertanyaanmu dulu ya.</p>' }];
    var cc = calc(raw); if (cc && /(hitung|berapa|=)/.test(q)) return [{ k: 'fact', f: 'calc', cc: cc }];
    var dt = dateOf(q);
    if (dt && /(pengeluaran|belanja|keluar|habis|pemasukan|masuk|transaksi|beli|jajan|catat)/.test(q)) return [{ k: 'fact', f: 'date', date: dt }];
    if (/(sisa|jatah|boleh).*(per hari|harian|sehari|tiap hari)|(per hari|sehari).*(sisa|jatah|boleh|aman)|bisa (habis|belanja|jajan).*(sehari|per hari)|uang harian/.test(q)) return [{ k: 'fact', f: 'allow' }];
    if (/(prediksi|perkiraan|proyeksi|estimasi|ramal).*(akhir bulan|bulan ini|sampai akhir)|akhir bulan.*(prediksi|perkiraan|berapa)/.test(q)) return [{ k: 'fact', f: 'proj' }];
    if (/(pemasukan|pendapatan|gaji).*(terbesar|tertinggi|terbanyak)|(terbesar|tertinggi).*(pemasukan|pendapatan)/.test(q)) return [{ k: 'fact', f: 'bigin', per: per }];
    if (/(berapa|jumlah).*(transaksi)|banyak transaksi/.test(q)) return [{ k: 'fact', f: 'count', per: per }];
    var sm = q.match(/(?:cari|temukan|carikan|search|transaksi|total|berapa)\s+(?:transaksi\s+)?(?:tentang |soal |yang |untuk |di |dengan )?([a-z0-9][a-z0-9 ]{2,24})$/);
    if (sm && /(cari|temukan|carikan|search)/.test(q)) return [{ k: 'fact', f: 'search', kw: sm[1].trim(), per: per }];
    /* pertanyaan lanjutan singkat: mewarisi topik sebelumnya */
    if (lastD && lastD.k === 'fact' && q.split(' ').length <= 6) {
      var fp = per || (/^(kalau|bagaimana|gimana|dan|lalu|terus)?\s*(bulan ini|bulan lalu|minggu ini|tahun ini|7 hari|30 hari|3 bulan|6 bulan)\s*\??$/.test(q) ? 'cur' : null);
      if (/^(kalau|bagaimana|gimana|dan|lalu|terus|bagaimana dengan|gimana dengan)\b/.test(q) || fp) {
        var nf = Object.assign({}, lastD);
        if (per) nf.per = per; else if (/bulan ini/.test(q)) nf.per = 'cur';
        var cat2 = findCat(q); if (cat2 && lastD.f !== 'wal1') { nf.f = 'cat'; nf.cat = cat2; }
        else if (/pemasukan|pendapatan|masuk/.test(q)) nf.f = 'masuk'; else if (/pengeluaran|keluar|belanja/.test(q)) nf.f = 'keluar';
        if (nf.f !== lastD.f || nf.per !== lastD.per || nf.cat !== lastD.cat) return [nf];
      }
    }

    if ((m = q.match(/(?:analisis|nomor|no|#)\s*#?(\d{1,3})\b/)) && X() && X().AN.some(function (a) { return a.id === +m[1]; })) return [{ k: 'run', id: +m[1], per: per }];
    if (/^(hai|halo|hi|hello|hey|pagi|siang|sore|malam|selamat (pagi|siang|sore|malam)|assalamualaikum)\b/.test(q) && q.split(' ').length <= 4) return [{ k: 'hello' }];
    if (/terima kasih|makasih|thanks|thx|mantap|oke deh/.test(q) && q.split(' ').length <= 5) return [{ k: 'text', t: '<p>Sama-sama! Kabari aku kalau mau cek hal lain.</p>' }];
    if (/siapa (kamu|anda)|kamu (itu )?siapa|kamu bisa apa|bisa apa saja|bantuan|^help|fitur|apa yang bisa/.test(q)) return [{ k: 'help' }];


    if (/(robot|chatgpt|gpt|manusia|beneran ai)/.test(q) && /(kamu|anda|apa)/.test(q)) return [{ k: 'text', t: '<p>Aku asisten lokal DuitKu, semacam robot kecil yang menghitung langsung dari catatan di perangkatmu. Aku tidak memakai server AI luar, jadi datamu tetap di sini.</p>' }];
    if (/siapa.*(buat|bikin|pembuat|kembang)/.test(q)) return [{ k: 'text', t: '<p>DuitKu dibuat oleh Muhammad Fadhil Abyan. Aku adalah bagian Intelligence-nya yang bekerja secara lokal.</p>' }];
    if (/^(dadah|bye|sampai jumpa|udah dulu|sudah dulu)/.test(q)) return [{ k: 'text', t: '<p>Siap, sampai jumpa! Jangan lupa catat transaksi hari ini ya.</p>' }];
    if (/(tips|cara|gimana|bagaimana|saran).*(hemat|irit|menabung|nabung|kurangi)/.test(q)) return [{ k: 'fact', f: 'tips', per: per }];
    if (/(bisa|mampu|sanggup|berapa).*(nabung|menabung|sisihkan|disisihkan)/.test(q) && !/target|progres/.test(q)) return [{ k: 'fact', f: 'save', per: per }];
    if (/(transaksi|belanja|pengeluaran).*(terbesar|tertinggi|termahal)|paling (mahal|besar)|termahal/.test(q) && /transaksi|paling mahal|termahal|belanja/.test(q)) return [{ k: 'fact', f: 'big', per: per }];
    if (/(transaksi|catatan).*(terakhir|terbaru)|terakhir (belanja|beli|catat|transaksi)/.test(q)) return [{ k: 'fact', f: 'last' }];
    if (/hari ini/.test(q) && /(pengeluaran|belanja|keluar|habis|pemasukan|masuk)/.test(q)) return [{ k: 'fact', f: 'today' }];
    if (/(rata rata|per hari|harian|sehari)/.test(q) && /(pengeluaran|belanja|keluar|habis|uang)/.test(q) && !/prediksi/.test(q)) return [{ k: 'fact', f: 'avg', per: per }];
    var wl = findWallet(q); if (wl && /(saldo|isi|berapa|sisa|ada|dompet)/.test(q)) return [{ k: 'fact', f: 'wal1', w: wl.id }];
    var fc = findCat(q); if (fc && /(berapa|total|habis|keluar|pengeluaran|spend|boros|jumlah)/.test(q) && !/anggaran|budget|beli|bisa/.test(q)) return [{ k: 'fact', f: 'cat', cat: fc, per: per }];

    if (/(beli|membeli|belanja|cicil|checkout|ambil)/.test(q) && amt) return [{ k: 'guard', g: { amt: amt, name: itemName(raw), cat: guessCat(q + ' ' + itemName(raw).toLowerCase()) } }];

    if (/(bandingkan|dibanding|banding|vs|lebih (banyak|besar|boros)).*(bulan|minggu|tahun)|bulan ini.*bulan lalu/.test(q) && !/anggaran/.test(q)) return [{ k: 'cmp' }];
    if (/(saldo|sisa uang|total uang|uang(ku)? (ada|tersisa|masih)|punya (uang|berapa)|dompet(ku)? (ada|berapa)|berapa uang|isi dompet)/.test(q)) return [{ k: 'fact', f: 'saldo' }];
    if (/(paling|terbesar|terbanyak|tertinggi|boros|habis).*(kategori|pengeluaran|belanja|uang|buat|untuk)|(pengeluaran|belanja|kategori).*(terbesar|terbanyak|tertinggi|paling)|uang(ku)? habis (buat|untuk|di)|kemana uang|ke mana uang|kategori/.test(q)) return [{ k: 'fact', f: 'topcat', per: per }];
    if (/(tagihan|jatuh tempo|cicilan).*(dekat|mendatang|akan|minggu|depan)|tagihan(ku)?\b|jadwal bayar|bayar apa saja/.test(q) && !/utang/.test(q)) return [{ k: 'fact', f: 'tagihan' }];
    if (/(utang|piutang|hutang|pinjam)/.test(q) && !/analisis/.test(q)) return [{ k: 'fact', f: 'utang' }];
    if (/(anggaran|budget)/.test(q) && /(sisa|status|aman|lewat|terpakai|cek|kondisi|berapa|bagaimana|gimana|lihat|progres)/.test(q)) return [{ k: 'fact', f: 'anggaran' }];
    if (/(tabungan|target|nabung|menabung)/.test(q) && /(progres|sudah|berapa|kapan|capai|status|lihat|cek|bagaimana|gimana|sisa)/.test(q)) return [{ k: 'fact', f: 'tabungan' }];
    var deep = /prediksi|perkiraan|estimasi|ramal|proyeksi|simulasi|rata rata|tren|kebiasaan|rasio|hemat|saran|rekomendasi|akhir pekan|harian/.test(q);
    if (!deep && /(pemasukan|pendapatan|income|gaji)/.test(q) && /(berapa|total|lihat|cek|bulan|minggu|tahun|hari)/.test(q) && !/bersih|selisih/.test(q)) return [{ k: 'fact', f: 'masuk', per: per }];
    if (!deep && /(pengeluaran|belanja|keluar|spend)/.test(q) && /(berapa|total|lihat|cek|bulan|minggu|tahun|hari)/.test(q)) return [{ k: 'fact', f: 'keluar', per: per }];
    if (/(bersih|selisih|surplus|defisit|arus kas|netto)/.test(q)) return [{ k: 'fact', f: 'bersih', per: per }];

    var r = rank(q);
    if (r.length) {
      var out = [{ k: 'run', id: r[0].a.id, per: per }];
      var more = r.slice(1, 4).filter(function (x) { return x.s >= 3; }).map(function (x) { return { id: x.a.id, t: x.a.title }; });
      if (more.length) out[0].more = more;
      return out;
    }
    return [{ k: 'none' }];
  }

  /* ---------- penyusun tampilan jawaban ---------- */
  function P_(t) { return '<p>' + t + '</p>'; }
  function row(l, v, tone) { return '<div class="ic-li"><span>' + esc(l) + '</span><b class="' + (tone || '') + '">' + esc(v) + '</b></div>'; }
  function btn(label, attr) { return '<button type="button" class="ic-pill" ' + attr + '>' + esc(label) + '</button>'; }
  function goBtn(label, g) { return '<div class="ic-acts">' + btn(label, 'data-go="' + g + '"') + '</div>'; }
  function noData() { return !(D.tx.length || D.wallets.length); }
  function emptyHint(what) { return P_('Belum ada ' + what + ' yang bisa dihitung. Catat dulu beberapa transaksi supaya aku bisa membantu.') + '<div class="ic-acts">' + btn('Catat transaksi', 'data-act="addtx"') + '</div>'; }
  function pct(a, b) { return b > 0 ? Math.round(a / b * 100) : 0; }

  var VIEW = {
    text: function (d) { return d.t; },
    hello: function () {
      var h = new Date().getHours(), s = h < 4 ? 'malam' : h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam';
      return P_('Selamat ' + s + ', ' + esc((P && P.name) || 'teman') + '! Mau cek apa hari ini? Pilih salah satu saran di bawah atau ketik pertanyaanmu.');
    },
    help: function () {
      return P_('Aku asisten lokal DuitKu. Aku menghitung dari data yang tersimpan di perangkatmu dan tidak mengirim apa pun ke layanan lain.') +
        '<ul class="ic-ul"><li>Saldo, pemasukan, pengeluaran, dan kategori terbesar</li><li>Status anggaran, target tabungan, utang-piutang, dan tagihan</li><li>“Bisa beli laptop Rp8 juta?” untuk menimbang rencana pembelian</li><li>100 analisis lain: prediksi, perbandingan periode, kebiasaan, dan rekomendasi</li></ul>';
    },
    none: function () {
      return P_('Aku belum menangkap maksudnya. Coba tanyakan dengan kata kunci keuangan, misalnya <b>saldo</b>, <b>pengeluaran terbesar</b>, <b>anggaran</b>, <b>tabungan</b>, <b>utang</b>, atau <b>“bisa beli … Rp …?”</b>.');
    },
    fact: function (d) {
      var K = X(), F = K.F, c = K.mkCtx(d.per || 'cur'), f = d.f;
      if (f === 'saldo') {
        var ws = D.wallets.filter(function (w) { return w.active !== false; });
        if (!ws.length) return emptyHint('dompet');
        return P_('Total saldo dompet aktifmu <b>' + esc(F(c.liquid)) + '</b>.') + '<div class="ic-list">' + ws.map(function (w) { return row(w.name, fmt(bal(w), w.currency), bal(w) < 0 ? 'bad' : ''); }).join('') + '</div>' + goBtn('Kelola dompet', 'wal');
      }
      if (f === 'masuk' || f === 'keluar' || f === 'bersih') {
        if (noData()) return emptyHint('data');
        var v = f === 'masuk' ? c.I : f === 'keluar' ? c.O : c.net, pv = f === 'masuk' ? c.pI : f === 'keluar' ? c.pO : c.pnet;
        var nm = f === 'masuk' ? 'Pemasukan' : f === 'keluar' ? 'Pengeluaran' : 'Selisih pemasukan dan pengeluaran', h = P_(nm + ' <b>' + esc(c.pr.label) + '</b>: <b>' + esc(F(v)) + '</b>.');
        var met = [[f === 'masuk' ? 'Pemasukan' : f === 'keluar' ? 'Pengeluaran' : 'Selisih', F(v)]];
        if (c.pr.pf && pv !== 0) { var dl = Math.round((v - pv) / Math.abs(pv) * 100); met.push(['Periode pembanding', F(pv)]); met.push(['Perubahan', (dl > 0 ? '+' : '') + dl + '%', (f === 'keluar' ? dl > 0 : dl < 0) ? 'bad' : 'good']); }
        if (f === 'bersih') h += P_(c.net < 0 ? 'Pengeluaran melebihi pemasukan pada periode ini.' : 'Arus kasmu positif pada periode ini.');
        return h + K.mtx(met);
      }

      if (f === 'calc') return P_('Hasil <b>' + esc(d.cc.expr) + '</b> adalah <b>' + esc(money(d.cc.v)) + '</b>.');
      if (f === 'date') {
        var Ld = D.tx.filter(function (x) { return x.date === d.date; }), od = sumTx(Ld, 'out'), idn = sumTx(Ld, 'in'), lbl = new Date(d.date + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!Ld.length) return P_('Tidak ada transaksi yang tercatat pada <b>' + esc(lbl) + '</b>.');
        return P_('Pada <b>' + esc(lbl) + '</b> kamu mengeluarkan <b>' + esc(money(od)) + '</b>' + (idn ? ' dan menerima <b>' + esc(money(idn)) + '</b>' : '') + ' dalam ' + Ld.length + ' transaksi.') + '<div class="ic-list">' + Ld.slice(0, 6).map(function (x) { return row(x.name, (x.type === 'in' ? '+' : x.type === 'out' ? '−' : '') + money(x.amount), x.type === 'in' ? 'good' : x.type === 'out' ? 'bad' : ''); }).join('') + '</div>';
      }
      if (f === 'allow') {
        var td2 = today(), dim2 = new Date(+td2.slice(0, 4), +td2.slice(5, 7), 0).getDate(), left = dim2 - (+td2.slice(8, 10)) + 1, liq = c.liquid;
        if (!D.wallets.length) return emptyHint('dompet');
        if (liq <= 0) return P_('Saldo dompet aktifmu sedang <b>' + esc(F(liq)) + '</b>, jadi belum ada jatah harian yang aman. Coba tambah dana atau tunda pengeluaran.');
        var per1 = Math.floor(liq / left);
        return P_('Sisa ' + left + ' hari bulan ini. Kalau seluruh saldo dompet aktif dibagi rata, jatahmu sekitar <b>' + esc(money(per1)) + '</b> per hari.') + K.mtx([['Saldo dompet aktif', F(liq)], ['Sisa hari', left + ' hari'], ['Jatah per hari', money(per1)]]) + P_('Ini hitungan kasar dan belum memperhitungkan tagihan atau cicilan yang akan datang.');
      }
      if (f === 'proj') {
        var td3 = today(), dn = +td3.slice(8, 10), dm = new Date(+td3.slice(0, 4), +td3.slice(5, 7), 0).getDate(), cm3 = ym(td3), sp = sumTx(D.tx.filter(function (x) { return x.date.startsWith(cm3); }), 'out'), inc = sumTx(D.tx.filter(function (x) { return x.date.startsWith(cm3); }), 'in');
        if (!sp) return P_('Belum ada pengeluaran bulan ini, jadi belum ada yang bisa diproyeksikan.');
        var pj = Math.round(sp / dn * dm);
        return P_('Dengan laju sekarang, pengeluaranmu sampai akhir bulan diperkirakan <b>' + esc(money(pj)) + '</b>.') + K.mtx([['Terpakai sejauh ini', money(sp)], ['Rata-rata per hari', money(Math.round(sp / dn))], ['Perkiraan akhir bulan', money(pj)]].concat(inc ? [['Pemasukan bulan ini', money(inc), pj > inc ? 'bad' : 'good']] : [])) + (inc ? P_(pj > inc ? 'Perkiraan ini melampaui pemasukan bulan ini. Pertimbangkan menekan pengeluaran.' : 'Perkiraan ini masih di bawah pemasukan bulan ini.') : '');
      }
      if (f === 'bigin') {
        var pb = inPer(d.per || 'cur'), Lb = D.tx.filter(function (x) { return x.type === 'in' && pb(x); }).sort(function (a, b) { return b.amount - a.amount; }).slice(0, 5);
        if (!Lb.length) return P_('Belum ada pemasukan pada ' + (PL[d.per || 'cur']) + '.');
        return P_('Pemasukan terbesar ' + (PL[d.per || 'cur']) + ':') + '<div class="ic-list">' + Lb.map(function (x) { return row(x.name + ' · ' + shortDate(x.date), '+' + money(x.amount), 'good'); }).join('') + '</div>';
      }
      if (f === 'count') {
        var pc2 = inPer(d.per || 'cur'), Lc = D.tx.filter(pc2);
        return P_('Ada <b>' + Lc.length + ' transaksi</b> ' + PL[d.per || 'cur'] + ': ' + Lc.filter(function (x) { return x.type === 'out'; }).length + ' pengeluaran, ' + Lc.filter(function (x) { return x.type === 'in'; }).length + ' pemasukan, ' + Lc.filter(function (x) { return x.type === 'tf'; }).length + ' transfer.');
      }
      if (f === 'search') {
        var ks = norm(d.kw), ps = inPer(d.per || 'all'), Ls = D.tx.filter(function (x) { return ps(x) && (norm(x.name).indexOf(ks) >= 0 || norm(x.cat || '').indexOf(ks) >= 0); });
        if (!Ls.length) return P_('Tidak ada transaksi yang cocok dengan “' + esc(d.kw) + '”.');
        return P_('Ketemu <b>' + Ls.length + ' transaksi</b> untuk “' + esc(d.kw) + '”, total pengeluaran <b>' + esc(money(sumTx(Ls, 'out'))) + '</b>:') + '<div class="ic-list">' + sortTx(Ls).slice(0, 6).map(function (x) { return row(x.name + ' · ' + shortDate(x.date), (x.type === 'in' ? '+' : x.type === 'out' ? '−' : '') + money(x.amount), x.type === 'in' ? 'good' : x.type === 'out' ? 'bad' : ''); }).join('') + '</div>';
      }
      if (f === 'cat') {
        var pf = inPer(d.per || 'cur'), L = D.tx.filter(function (x) { return x.cat === d.cat && pf(x); }), o = sumTx(L, 'out'), i2 = sumTx(L, 'in'), allO = sumTx(D.tx.filter(pf), 'out');
        if (!L.length) return P_('Belum ada transaksi <b>' + esc(d.cat) + '</b> ' + PL[d.per || 'cur'] + '.');
        var h2 = P_('Kategori <b>' + esc(d.cat) + '</b> ' + PL[d.per || 'cur'] + ': ' + (o ? 'pengeluaran <b>' + esc(money(o)) + '</b>' : 'pemasukan <b>' + esc(money(i2)) + '</b>') + ' dalam ' + L.length + ' transaksi.');
        if (o && allO) h2 += P_('Itu sekitar ' + pct(o, allO) + '% dari seluruh pengeluaranmu.');
        return h2 + '<div class="ic-list">' + L.sort(function (a, b) { return b.amount - a.amount; }).slice(0, 4).map(function (x) { return row(x.name + ' · ' + x.date.slice(5).split('-').reverse().join('/'), (x.type === 'in' ? '+' : '−') + money(x.amount), x.type === 'in' ? 'good' : ''); }).join('') + '</div>';
      }
      if (f === 'big') {
        var pf2 = inPer(d.per || 'cur'), L2 = D.tx.filter(function (x) { return x.type === 'out' && pf2(x); }).sort(function (a, b) { return b.amount - a.amount; }).slice(0, 5);
        if (!L2.length) return emptyHint('pengeluaran');
        return P_('Pengeluaran terbesar ' + PL[d.per || 'cur'] + ' adalah <b>' + esc(L2[0].name) + '</b> senilai <b>' + esc(money(L2[0].amount)) + '</b>.') + '<div class="ic-list">' + L2.map(function (x) { return row(x.name + ' · ' + x.cat, money(x.amount), 'bad'); }).join('') + '</div>';
      }
      if (f === 'last') {
        var L3 = sortTx(D.tx).slice(0, 5); if (!L3.length) return emptyHint('transaksi');
        return P_('Ini ' + L3.length + ' transaksi terakhirmu:') + '<div class="ic-list">' + L3.map(function (x) { return row(x.name + ' · ' + shortDate(x.date), (x.type === 'in' ? '+' : x.type === 'out' ? '−' : '') + money(x.amount), x.type === 'in' ? 'good' : x.type === 'out' ? 'bad' : ''); }).join('') + '</div>' + goBtn('Semua transaksi', 'tx');
      }
      if (f === 'today') {
        var td = today(), L4 = D.tx.filter(function (x) { return x.date === td; }), o4 = sumTx(L4, 'out'), i4 = sumTx(L4, 'in');
        if (!L4.length) return P_('Belum ada transaksi yang tercatat hari ini. Kalau kamu sudah jajan atau belanja, catat dulu ya.');
        return P_('Hari ini kamu mengeluarkan <b>' + esc(money(o4)) + '</b>' + (i4 ? ' dan menerima <b>' + esc(money(i4)) + '</b>' : '') + ' dalam ' + L4.length + ' transaksi.');
      }
      if (f === 'avg') {
        var per2 = d.per || 'cur', pf3 = inPer(per2), L5 = D.tx.filter(pf3), o5 = sumTx(L5, 'out');
        if (!o5) return emptyHint('pengeluaran');
        var days = per2 === 'cur' ? new Date().getDate() : per2 === '7d' ? 7 : per2 === '30d' ? 30 : per2 === '3m' ? 90 : per2 === '6m' ? 180 : per2 === 'prev' ? new Date(+shiftYm(ym(today()), -1).slice(0, 4), +shiftYm(ym(today()), -1).slice(5), 0).getDate() : per2 === 'year' ? Math.max(1, Math.round((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 864e5) + 1) : Math.max(1, new Set(L5.map(function (x) { return x.date; })).size);
        return P_('Rata-rata pengeluaranmu ' + PL[per2] + ' sekitar <b>' + esc(money(Math.round(o5 / days))) + '</b> per hari.') + K.mtx([['Total pengeluaran', money(o5)], ['Jumlah hari', String(days)], ['Rata-rata harian', money(Math.round(o5 / days))]]);
      }
      if (f === 'wal1') {
        var w1 = D.wallets.filter(function (w) { return w.id === d.w; })[0]; if (!w1) return emptyHint('dompet');
        var L6 = D.tx.filter(function (x) { return x.wallet === w1.id || x.to === w1.id; });
        return P_('Saldo <b>' + esc(w1.name) + '</b> saat ini <b>' + esc(fmt(bal(w1), w1.currency)) + '</b>.') + K.mtx([['Saldo awal', fmt(+w1.initial || 0, w1.currency)], ['Jumlah transaksi', String(L6.length)]]) + goBtn('Buka dompet', 'wal');
      }
      if (f === 'save') {
        var I6 = c.I, O6 = c.O, n6 = I6 - O6;
        if (!I6 && !O6) return emptyHint('data');
        if (n6 <= 0) return P_('Untuk ' + c.pr.label + ', pengeluaranmu belum lebih kecil dari pemasukan, jadi belum ada sisa yang aman untuk ditabung. Coba kurangi satu kategori terbesar dulu.');
        return P_('Dari selisih pemasukan dan pengeluaran ' + c.pr.label + ', kamu punya ruang sekitar <b>' + esc(F(n6)) + '</b>. Menyisihkan 50 sampai 70 persennya terasa realistis.') + K.mtx([['Selisih', F(n6)], ['Saran tabung (50%)', F(Math.round(n6 * .5))], ['Saran tabung (70%)', F(Math.round(n6 * .7))]]) + goBtn('Buka tabungan', 'goal');
      }
      if (f === 'tips') {
        var es2 = Object.keys(c.byCat).map(function (k) { return [k, c.byCat[k]]; }).sort(function (a, b) { return b[1] - a[1]; }), tp = [];
        if (es2.length) tp.push('Kategori terbesarmu <b>' + esc(es2[0][0]) + '</b> (' + esc(F(es2[0][1])) + '). Pangkas 10% saja di sini dan dampaknya terasa.');
        tp.push('Terapkan aturan tunggu 24 jam sebelum membeli barang non-kebutuhan.', 'Catat pengeluaran kecil setiap hari; jajan receh sering jadi kebocoran terbesar.', 'Sisihkan tabungan di awal bulan, bukan dari sisa di akhir.');
        return P_('Beberapa langkah hemat yang paling berguna untuk datamu:') + '<ul class="ic-ul">' + tp.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      }
      if (f === 'topcat') {
        var es = Object.keys(c.byCat).map(function (k) { return [k, c.byCat[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
        if (!es.length) return P_('Belum ada pengeluaran pada ' + esc(c.pr.label.toLowerCase()) + '.');
        var tot = es.reduce(function (s, x) { return s + x[1]; }, 0);
        return P_('Pengeluaran terbesar <b>' + esc(c.pr.label) + '</b> ada di <b>' + esc(es[0][0]) + '</b> (' + pct(es[0][1], tot) + '% dari ' + esc(F(tot)) + ').') +
          K.barsH(es.slice(0, 5).map(function (x) { return { l: x[0], v: x[1], t: F(x[1]) }; }));
      }
      if (f === 'anggaran') {
        var bs = c.budStat().filter(function (b) { return b.limit > 0; });
        if (!bs.length) return P_('Kamu belum punya anggaran bulan ini.') + goBtn('Buat anggaran', 'bud');
        var over = bs.filter(function (b) { return b.pct >= 100; }), near = bs.filter(function (b) { return b.pct >= 80 && b.pct < 100; });
        var msg = over.length ? over.length + ' anggaran sudah terlampaui' + (near.length ? ' dan ' + near.length + ' hampir habis' : '') + '.' : near.length ? near.length + ' anggaran hampir habis.' : 'Semua anggaran masih aman.';
        return P_(msg) + K.barsH(bs.sort(function (a, b) { return b.pct - a.pct; }).slice(0, 6).map(function (b) { return { l: b.cat, v: Math.min(100, b.pct), t: b.pct + '% · sisa ' + F(Math.max(0, b.rem)), neg: b.pct >= 100 }; })) + goBtn('Buka anggaran', 'bud');
      }
      if (f === 'tabungan') {
        var gs = c.goalStats();
        if (!gs.length) return P_('Belum ada target tabungan.') + goBtn('Buat target', 'goal');
        return P_(gs.filter(function (g) { return g.done; }).length + ' dari ' + gs.length + ' target sudah tercapai.') +
          K.barsH(gs.slice(0, 6).map(function (g) { return { l: g.g.name, v: Math.min(100, g.pct), t: g.pct + '% · ' + F(g.saved) + ' / ' + F(g.g.target) }; })) + goBtn('Buka tabungan', 'goal');
      }
      if (f === 'utang') {
        var ds = c.debtStat().filter(function (x) { return !x.done; });
        if (!ds.length) return P_('Tidak ada utang atau piutang yang aktif.');
        var hu = ds.filter(function (x) { return x.d.type === 'utang'; }), tp = ds.filter(function (x) { return x.d.type === 'piutang'; });
        var sum = function (a) { return a.reduce(function (s, x) { return s + x.rem; }, 0); };
        return P_('Utangmu <b>' + esc(F(sum(hu))) + '</b>, piutangmu <b>' + esc(F(sum(tp))) + '</b>.') +
          '<div class="ic-list">' + ds.slice(0, 6).map(function (x) { return row((x.d.type === 'utang' ? 'Utang ke ' : 'Piutang dari ') + x.d.party, F(x.rem) + (x.late ? ' · telat ' + x.late + ' hari' : x.due ? ' · tempo ' + x.due.slice(5).split('-').reverse().join('/') : ''), x.late ? 'bad' : ''); }).join('') + '</div>' + goBtn('Buka utang-piutang', 'debt');
      }
      if (f === 'tagihan') {
        var up = c.upcoming(14);
        if (!up.length) return P_('Tidak ada tagihan, cicilan, atau transaksi rutin dalam 14 hari ke depan.');
        return P_('Ada <b>' + up.length + '</b> jadwal dalam 14 hari ke depan.') + '<div class="ic-list">' + up.slice(0, 7).map(function (x) { return row(x.date.slice(5).split('-').reverse().join('/') + ' · ' + x.name, (x.type === 'in' ? '+' : '−') + F(x.amount), x.type === 'in' ? 'good' : ''); }).join('') + '</div>';
      }
      return '';
    },
    cmp: function () {
      var K = X(), F = K.F, c = K.mkCtx('cur');
      if (noData()) return emptyHint('data');
      var d1 = c.pO ? Math.round((c.O - c.pO) / c.pO * 100) : null, d2 = c.pI ? Math.round((c.I - c.pI) / c.pI * 100) : null;
      var h = P_('Dibandingkan dengan periode yang sama bulan lalu, pengeluaranmu ' + (d1 == null ? 'belum bisa dibandingkan' : d1 > 0 ? 'naik <b>' + d1 + '%</b>' : d1 < 0 ? 'turun <b>' + Math.abs(d1) + '%</b>' : 'sama') + '.');
      return h + K.tbl({ head: ['', 'Bulan ini', 'Pembanding'], body: [['Pemasukan', F(c.I), F(c.pI)], ['Pengeluaran', F(c.O), F(c.pO)], ['Selisih', F(c.net), F(c.pnet)]] }) + (d2 != null ? '' : '');
    },
    run: function (d) {
      var K = X(), a = K.AN.filter(function (x) { return x.id === d.id; })[0]; if (!a) return VIEW.none();
      var keep = K.IS.period; if (d.per) K.IS.period = d.per;
      var res; try { res = K.runAnalysis(a); } finally { K.IS.period = keep; }
      var c = res[0], r = res[1], h = '';
      if (r.empty) {
        h = '<div class="ic-kind"><span class="ikind">Data belum cukup</span><span class="ic-an">' + esc(a.title) + '</span></div>' + P_(esc(r.summary));
        if (r.missing && r.missing.length) h += '<ul class="ic-ul">' + r.missing.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      } else {
        h = '<div class="ic-kind"><span class="ikind k-' + r.kind + '">' + esc(K.KIND[r.kind] || r.kind) + '</span><span class="ic-an">' + esc(a.title) + '</span></div><p class="ic-sum">' + esc(r.summary) + '</p>';
        if (r.metrics && r.metrics.length) h += K.mtx(r.metrics.slice(0, 6));
        if (r.chart && r.chart.bars && r.chart.bars.length) h += K.barsH(r.chart.bars.slice(0, 6));
        if (r.table && r.table.body && r.table.body.length) h += K.tbl({ head: r.table.head, body: r.table.body.slice(0, 5) });
        if (r.insight) h += '<p class="ic-ins">' + esc(r.insight) + '</p>';
        if (r.actions && r.actions.length) h += '<ul class="ic-ul">' + r.actions.slice(0, 3).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      }
      h += '<div class="ic-acts">' + btn('Buka analisis lengkap', 'data-act="intelrun" data-id="' + a.id + '"') + '</div>';
      if (d.more && d.more.length) h += '<div class="ic-more"><small>Analisis terkait</small>' + d.more.map(function (m) { return btn(m.t, 'data-ichat="run" data-id="' + m.id + '"'); }).join('') + '</div>';
      return h;
    },
    guard: function (d) {
      var K = X(), r = K.guardCalc({ amt: d.g.amt, name: d.g.name, cat: d.g.cat, date: today(), wallet: 'all' });
      if (r.empty) return P_(esc(r.summary)) + (r.missing && r.missing.length ? '<ul class="ic-ul">' + r.missing.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '');
      var tone = r.verdict ? r.verdict[1] : '', h = '<div class="ic-kind"><span class="ikind k-simulasi">Smart Spend Guard</span><span class="ic-verdict ' + tone + '">' + esc(r.verdict ? r.verdict[0] : '') + '</span></div><p class="ic-sum">' + esc(r.summary) + '</p>';
      if (r.reasons && r.reasons.length) h += '<ul class="ic-rs">' + r.reasons.slice(0, 5).map(function (x) { return '<li class="' + x[0] + '"><i></i><span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul>';
      if (r.metrics) h += K.mtx(r.metrics.slice(0, 4));
      if (r.actions && r.actions.length) h += '<ul class="ic-ul">' + r.actions.slice(0, 2).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      return h + '<p class="ic-note">Ini simulasi: tidak mencatat transaksi dan bukan kepastian.</p><div class="ic-acts">' + btn('Atur di Smart Spend Guard', 'data-act="intelopen" data-k="guard"') + '</div>';
    }
  };

  function meAv() {
    try {
      var a = P && P.avatar;
      if (a && String(a).indexOf('data:image/') === 0) return '<img src="' + a + '" alt="">';
      if (a && typeof avIc === 'function') return avIc(a);
    } catch (e) {}
    return esc(((P && P.name) || 'K').trim().charAt(0).toUpperCase());
  }
  function bubbleHtml(m) {
    if (m.r === 'u') return '<div class="ic-row ic-u"><div class="ic-b">' + esc(m.t) + '</div><span class="ic-av ic-me" aria-hidden="true">' + meAv() + '</span></div>';
    var h; try { h = (VIEW[m.d.k] || VIEW.none)(m.d); } catch (e) { console.error(e); h = P_('Maaf, aku belum bisa menghitung itu dari data saat ini.'); }
    var fu = ''; try { fu = '<div class="ic-fu">' + follow(m.d).map(function (x) { return '<button type="button" class="ic-chip sm" data-ichat="ask" data-q="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>'; } catch (e) {}
    return '<div class="ic-row ic-a"><span class="ic-av" aria-hidden="true">' + SPARK + '</span><div class="ic-body"><div class="ic-b">' + h + '</div>' + fu + '</div></div>';
  }

  var SPARK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="8" width="15" height="11" rx="3.6"/><path d="M12 8V4.8"/><circle cx="12" cy="3.7" r="1.2" fill="currentColor"/><circle cx="9" cy="13" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.3" fill="currentColor" stroke="none"/><path d="M9.6 16.2h4.8"/><path d="M2.6 12.2v3M21.4 12.2v3"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg>';
  var TRASH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';

  function suggestions() {
    return ['Bagaimana kondisi keuanganku?', 'Saldo dompetku', 'Jatah uang harian', 'Pengeluaran kemarin', 'Pengeluaran terbesar bulan ini', 'Pengeluaran hari ini', 'Cek status anggaran', 'Bisa beli HP Rp3 juta?', 'Progres target tabungan', 'Tagihan 2 minggu ke depan', 'Bandingkan dengan bulan lalu', 'Prediksi pengeluaran bulan ini', 'Transaksi terbesar bulan ini', 'Transaksi terakhir', 'Rata-rata pengeluaran per hari', 'Berapa bisa menabung?', 'Tips hemat'];
  }
  function sugHtml() { return suggestions().map(function (s) { return '<button type="button" class="ic-chip" data-ichat="ask" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join(''); }

  function intro() {
    return '<div class="ic-row ic-a"><span class="ic-av" aria-hidden="true">' + SPARK + '</span><div class="ic-b"><p>Halo' + (P && P.name ? ', ' + esc(P.name) : '') + '! Aku bisa menjawab soal uangmu langsung dari data di perangkat ini, tanpa layanan AI luar.</p><p class="ic-note">Tanyakan saldo, pengeluaran, anggaran, tabungan, utang, atau “bisa beli … Rp …?”.</p></div></div>';
  }

  function html() {
    return '<section class="card ichat" id="ichat" aria-label="Tanya DuitKu">' +
      '<div class="ic-head"><span class="ic-logo" aria-hidden="true">' + SPARK.replace('width="15" height="15"', 'width="20" height="20"') + '</span><div class="ic-ht"><b>Tanya DuitKu</b><small>Dihitung di perangkatmu · tanpa AI luar</small></div>' +
      '<button type="button" class="ic-clear" data-ichat="clear" aria-label="Hapus percakapan" title="Hapus percakapan"' + (hist.length ? '' : ' hidden') + '>' + TRASH + '</button></div>' +
      '<div class="ic-scroll" id="icScroll" role="log" aria-live="polite">' + intro() + hist.map(bubbleHtml).join('') + '</div>' +
      '<div class="ic-sugs" id="icSugs">' + sugHtml() + '</div>' +
      '<form class="ic-form" id="icForm" autocomplete="off"><textarea id="icIn" rows="1" maxlength="240" placeholder="Tanya soal keuanganmu…" enterkeyhint="send" aria-label="Pertanyaan"></textarea><button type="submit" class="ic-send" aria-label="Kirim" disabled>' + SEND + '</button></form></section>';
  }

  /* ---------- interaksi ---------- */
  function scrollEnd(smooth) {
    var s = el('icScroll'); if (!s) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (s.scrollTo && smooth && !reduce) s.scrollTo({ top: s.scrollHeight, behavior: 'smooth' }); else s.scrollTop = s.scrollHeight;
  }
  function add(htmlStr) { var s = el('icScroll'); if (!s) return null; var t = document.createElement('div'); t.innerHTML = htmlStr; var n = t.firstElementChild; s.appendChild(n); return n; }

  function ask(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    var s = el('icScroll'); if (!s) return;
    busy = true;
    var um = { r: 'u', t: text }; hist.push(um); add(bubbleHtml(um));
    var clr = document.querySelector('.ic-clear'); if (clr) clr.hidden = false;
    var typing = add('<div class="ic-row ic-a ic-typing" aria-label="Sedang menghitung"><span class="ic-av" aria-hidden="true">' + SPARK + '</span><div class="ic-b"><i></i><i></i><i></i></div></div>');
    scrollEnd(true);
    setTimeout(function () {
      var ds; try { ds = answer(text); } catch (e) { console.error(e); ds = [{ k: 'none' }]; }
      if (typing && typing.parentNode) typing.remove();
      ds.forEach(function (d) { var m = { r: 'a', d: d }; hist.push(m); add(bubbleHtml(m)); });
      persist(); busy = false; scrollEnd(true);
    }, 380 + Math.random() * 260);
  }

  function grow(t) { t.style.height = 'auto'; t.style.height = Math.min(110, t.scrollHeight) + 'px'; }

  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'icForm') return;
    e.preventDefault();
    var t = el('icIn'); if (!t) return; var v = t.value; t.value = ''; grow(t);
    var b = e.target.querySelector('.ic-send'); if (b) b.disabled = true;
    ask(v);
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || t.id !== 'icIn') return; grow(t);
    var b = t.form && t.form.querySelector('.ic-send'); if (b) b.disabled = !t.value.trim();
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (!t || t.id !== 'icIn') return;
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (t.form) t.form.requestSubmit ? t.form.requestSubmit() : t.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ichat]'); if (!b) return;
    var a = b.dataset.ichat;
    if (a === 'ask') ask(b.dataset.q);
    else if (a === 'run') { if (busy) return; var m = { r: 'a', d: { k: 'run', id: +b.dataset.id } }; hist.push(m); add(bubbleHtml(m)); persist(); scrollEnd(true); }
    else if (a === 'clear') {
      openModal('Hapus percakapan?', '<div class="currency-confirm"><p>Seluruh riwayat chat dengan Tanya DuitKu di perangkat ini akan dihapus dan kembali ke percakapan pertama.</p><p class="muted">Data keuangan dan transaksimu tidak ikut terhapus.</p></div>', function () {
        hist = []; persist(); var s = el('icScroll'); if (s) s.innerHTML = intro(); var cb = document.querySelector('.ic-clear'); if (cb) cb.hidden = true; return true;
      }, 'Ya, hapus');
    }
  });

  /* chip saran: geser dengan roda mouse atau tarik */
  document.addEventListener('wheel', function (e) { var c = e.target.closest && e.target.closest('.ic-sugs'); if (c && c.scrollWidth > c.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { c.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  var drag = null;
  document.addEventListener('pointerdown', function (e) { var c = e.target.closest && e.target.closest('.ic-sugs'); if (c && e.pointerType === 'mouse') drag = { c: c, x: e.clientX, l: c.scrollLeft, m: false }; });
  document.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.m = true; drag.c.scrollLeft = drag.l - dx; });
  document.addEventListener('pointerup', function () { if (drag && drag.m) { var c = drag.c; c.classList.add('nodrag'); setTimeout(function () { c.classList.remove('nodrag'); }, 0); } drag = null; });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.ic-sugs.nodrag')) { e.stopPropagation(); e.preventDefault(); } }, true);

  /* setelah halaman digambar ulang: gulir ke pesan terbaru */
  if (typeof render === 'function') {
    var _r = render;
    render = function () { var r = _r.apply(this, arguments); try { if (typeof page !== 'undefined' && page === 'intel') requestAnimationFrame(function () { scrollEnd(false); }); } catch (e) {} return r; };
  }
  /* reset aplikasi ikut menghapus riwayat chat */
  window.DKChat = { html: html, ask: ask, answer: answer, norm: norm, parseAmt: parseAmt, clear: function () { hist = []; persist(); } };
})();
