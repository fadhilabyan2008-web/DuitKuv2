/* DuitKu Feedback — nilai, saran kritis, dan kuesioner dikirim ke pengembang.
   Jalur 1: Firestore (koleksi "duitku_feedback") bila Firebase aktif dan pengguna masuk.
   Jalur 2: email ke pengembang (tombol di lembar konfirmasi) — selalu tersedia, tanpa server.
   ISI alamat email pengembang di firebase-config.js:  window.DUITKU_DEV_EMAIL = "emailkamu@contoh.com";  */
(function () {
  'use strict';
  if (typeof A === 'undefined' || !A.sendFeedback || !A.sendSurvey) return;
  var DEV = function () { return window.DUITKU_DEV_EMAIL || ''; };
  function dev(o) { return Object.assign({ app: 'DuitKu', at: new Date().toISOString(), rating: (D.settings && D.settings.rating) || null, ua: navigator.userAgent, lang: navigator.language, name: P && P.name || '' }, o); }
  function toCloud(doc) {
    try { if (typeof CLOUD !== 'undefined' && CLOUD && fbDb && CU) { doc.uid = CU.uid; return fbDb.collection('duitku_feedback').add(doc).then(function () { return true; }, function () { return false; }); } } catch (e) {}
    return Promise.resolve(false);
  }
  function text(doc) {
    var L = ['DuitKu — masukan pengguna', 'Waktu: ' + doc.at, 'Nama: ' + doc.name, 'Nilai: ' + (doc.rating ? doc.rating + '/5' : '-'), ''];
    if (doc.kind === 'saran') L.push('Saran/kritik:', doc.text);
    else { var s = doc.survey || {}; L.push('Kuesioner:', 'Kemudahan: ' + s.ease, 'Manfaat: ' + s.usefulness, 'Desain: ' + s.design, 'Insight/AI: ' + s.ai, 'Rekomendasi: ' + s.recommend, 'Fitur dipakai: ' + (s.used || []).join(', '), 'Fitur kurang: ' + s.missing, 'Bug: ' + s.bug, 'Lainnya: ' + s.extra); }
    L.push('', 'Perangkat: ' + doc.ua);
    return L.join('\n');
  }
  function deliver(doc) {
    var body = text(doc), email = DEV();
    toCloud(Object.assign({}, doc)).then(function (ok) {
      var href = 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent('Masukan DuitKu (' + doc.kind + ')') + '&body=' + encodeURIComponent(body);
      openModal('Kirim ke pengembang',
        '<p class="muted">Terima kasih! Masukanmu sudah tersimpan di perangkat' + (ok ? ' dan <b>terkirim ke pengembang</b>.' : '.') + '</p>' +
        (ok ? '' : '<p class="muted sm">Agar sampai ke pengembang, kirim lewat email di bawah.</p>') +
        '<div class="mb" style="flex-wrap:wrap"><a class="btn" href="' + href + '" style="text-decoration:none;display:inline-flex;align-items:center">Kirim lewat email</a><button type="button" class="btn ghost" id="fbCopy">Salin teks</button></div>' +
        (email ? '' : '<small class="muted">Alamat email pengembang belum diatur (window.DUITKU_DEV_EMAIL di firebase-config.js).</small>'));
      var c = document.getElementById('fbCopy');
      if (c) c.onclick = function () { try { navigator.clipboard.writeText(body); toast('Teks disalin'); } catch (e) { toast('Gagal menyalin', 'err'); } };
    });
  }
  var sf = A.sendFeedback, ss = A.sendSurvey;
  A.sendFeedback = function () {
    var el = document.getElementById('appFeedback'), v = el && el.value.trim(), n = ((D.settings.feedbacks || []).length);
    var r = sf.apply(this, arguments);
    if (v && (D.settings.feedbacks || []).length > n) deliver(dev({ kind: 'saran', text: v }));
    return r;
  };
  A.sendSurvey = function () {
    var root = document.getElementById('appSurvey'), n = ((D.settings.surveys || []).length);
    var r = ss.apply(this, arguments);
    var list = D.settings.surveys || [];
    if (list.length > n) deliver(dev({ kind: 'kuesioner', survey: list[list.length - 1] }));
    return r;
  };
})();
