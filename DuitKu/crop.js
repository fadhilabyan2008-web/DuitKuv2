/* DuitKu — pemangkas foto profil (geser, zoom, potong persegi). DKCrop.open(file, cb(dataUrl)) */
(function () {
  'use strict';
  var BOX = 300, OUT = 360;
  function open(file, cb) {
    if (!file || !/^image\//.test(file.type)) { return cb && cb(null); }
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () { build(im, cb); };
      im.onerror = function () { cb && cb(null); };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  function build(im, cb) {
    var ov = document.createElement('div');
    ov.className = 'crop-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Pangkas foto');
    ov.innerHTML = '<div class="crop-card"><div class="crop-h"><b>Pangkas foto</b><small>Geser dan cubit untuk menyesuaikan</small></div>' +
      '<div class="crop-stage" id="cropStage"><canvas id="cropCv" width="' + BOX * 2 + '" height="' + BOX * 2 + '"></canvas><div class="crop-mask"></div></div>' +
      '<div class="crop-zoom"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="6"/></svg><input type="range" id="cropZ" min="1" max="4" step="0.01" value="1" aria-label="Perbesar"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/></svg></div>' +
      '<div class="crop-acts"><button type="button" class="btn ghost" data-c="x">Batal</button><button type="button" class="btn" data-c="ok">Gunakan foto</button></div></div>';
    document.body.appendChild(ov);
    var cv = ov.querySelector('#cropCv'), x = cv.getContext('2d'), z = ov.querySelector('#cropZ'), st = ov.querySelector('#cropStage');
    var base = Math.max(BOX / im.width, BOX / im.height), s = 1, ox = 0, oy = 0;
    function clamp() {
      var w = im.width * base * s, h = im.height * base * s, mx = Math.max(0, (w - BOX) / 2), my = Math.max(0, (h - BOX) / 2);
      ox = Math.max(-mx, Math.min(mx, ox)); oy = Math.max(-my, Math.min(my, oy));
    }
    function draw(ctx, size) {
      var k = size / BOX, w = im.width * base * s * k, h = im.height * base * s * k;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
      ctx.drawImage(im, size / 2 - w / 2 + ox * k, size / 2 - h / 2 + oy * k, w, h);
    }
    function paint() { clamp(); draw(x, BOX * 2); }
    paint();
    z.addEventListener('input', function () { s = +z.value; paint(); });
    var pts = {}, last = null, d0 = 0, s0 = 1;
    st.addEventListener('pointerdown', function (e) { st.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY }; last = { x: e.clientX, y: e.clientY }; var k = Object.keys(pts); if (k.length === 2) { d0 = dist(); s0 = s; } });
    st.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; var k = Object.keys(pts);
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (k.length === 2) { s = Math.max(1, Math.min(4, s0 * dist() / (d0 || 1))); z.value = s; }
      else if (last) { ox += e.clientX - last.x; oy += e.clientY - last.y; }
      last = { x: e.clientX, y: e.clientY }; paint();
    });
    function up(e) { delete pts[e.pointerId]; var k = Object.keys(pts); last = k.length ? pts[k[0]] : null; }
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    function dist() { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }
    st.addEventListener('wheel', function (e) { e.preventDefault(); s = Math.max(1, Math.min(4, s - e.deltaY * .002)); z.value = s; paint(); }, { passive: false });
    function close(res) { document.removeEventListener('keydown', key); ov.classList.add('out'); setTimeout(function () { ov.remove(); }, 220); cb && cb(res); cb = null; }
    function key(e) { if (e.key === 'Escape') close(null); }
    document.addEventListener('keydown', key);
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (!b) return;
      if (b.dataset.c === 'x') return close(null);
      var oc = document.createElement('canvas'); oc.width = oc.height = OUT; draw(oc.getContext('2d'), OUT); close(oc.toDataURL('image/jpeg', .86));
    });
  }
  window.DKCrop = { open: open };
})();
