/* DuitKu boot — dijalankan paling akhir, setelah semua modul (nav, audio, game, feedback, v7) terpasang. */
delete window.__INTEL_H; delete window.__INTEL_AN;   /* pembantu bersama (dipakai script.js dan wrapped.js) tidak lagi diperlukan */
bootGate();
requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.remove('dk-boot'); }); });
