/* DuitKu — pelindung dasar agar kode tidak mudah diintip/disalin lewat Inspect Element.
   Catatan: ini hanya penghalang. Kode di browser tidak mungkin disembunyikan 100%.
   Keamanan data tetap dijaga oleh aturan Firestore + Authorized domains Firebase.
   Matikan dengan: window.DUITKU_PROTECT = false (di firebase-config.js). Otomatis mati di localhost. */
(function () {
  'use strict';
  if (window.DUITKU_PROTECT === false) return;
  var h = location.hostname;
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(h) && location.search.indexOf('guard=1') < 0) return;
  var editable = function (t) { return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
  var block = function (e) { e.preventDefault(); e.stopPropagation(); return false; };

  addEventListener('contextmenu', function (e) { if (!editable(e.target)) return block(e); }, true);
  addEventListener('dragstart', function (e) { if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'A')) e.preventDefault(); }, true);
  addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (e.key === 'F12') return block(e);
    if (c && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k' || k === 'e')) return block(e);
    if (c && !e.shiftKey && !e.altKey && (k === 'u' || k === 's')) return block(e);
    if (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'u' || k === 'c')) return block(e);
  }, true);

  // Deteksi DevTools (hanya perangkat dengan mouse; ponsel dikecualikan agar tidak salah deteksi)
  var coarse = false; try { coarse = matchMedia('(pointer:coarse)').matches; } catch (e) {}
  if (coarse) return;
  var open = false, veil = null;
  function show(on) {
    if (on === open) return; open = on;
    if (on) {
      if (!veil) {
        veil = document.createElement('div');
        veil.id = 'dkGuard';
        veil.setAttribute('role', 'alert');
        veil.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;text-align:center;padding:24px;background:#0b0b0f;color:#f5f5f7;font:600 17px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';
        veil.innerHTML = '<div><div style="font-size:42px;margin-bottom:10px">🔒</div>Alat pengembang terdeteksi.<br><span style="font-weight:400;color:#9a9aa3">Tutup panel Inspect untuk melanjutkan memakai DuitKu.</span></div>';
      }
      document.documentElement.appendChild(veil);
    } else if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
  }
  var probe = new Image(), hit = false;
  try { Object.defineProperty(probe, 'id', { get: function () { hit = true; return ''; } }); } catch (e) {}
  function check() {
    var dock = (outerWidth - innerWidth > 180) || (outerHeight - innerHeight > 220);
    hit = false;
    try { console.debug(probe); console.clear && 0; } catch (e) {}
    show(dock || hit);
  }
  setInterval(check, 900);
  addEventListener('resize', check);
  try { console.log('%cBerhenti!', 'color:#f5b301;font:800 38px sans-serif;text-shadow:1px 1px 0 #000'); console.log('%cIni fitur browser untuk pengembang. Jangan menempelkan kode dari orang lain di sini.', 'font:15px sans-serif'); } catch (e) {}
})();
