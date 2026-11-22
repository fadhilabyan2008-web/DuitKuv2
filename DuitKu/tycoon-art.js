/* DuitKu Money Tycoon — gambar isometrik (canvas 2D, tanpa pustaka, tanpa file gambar).
   Dipakai oleh tycoon.js. Koordinat lokal sebuah petak: u dan v berkisar -0.5..0.5 (u ke kanan-bawah, v ke kiri-bawah),
   z = tinggi dalam piksel. Satu petak = 64 x 32 piksel. */
(function () {
  'use strict';
  var TW = 64, TH = 32;
  var cache = {};

  function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function sh(h, a) {
    var k = h + a; if (cache[k]) return cache[k];
    var c = rgb(h), r = c[0], g = c[1], b = c[2];
    if (a >= 0) { r += (255 - r) * a; g += (255 - g) * a; b += (255 - b) * a; } else { r *= 1 + a; g *= 1 + a; b *= 1 + a; }
    return (cache[k] = 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')');
  }
  function mixc(a, b, t) { var x = rgb(a), y = rgb(b); return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' + Math.round(x[1] + (y[1] - x[1]) * t) + ',' + Math.round(x[2] + (y[2] - x[2]) * t) + ')'; }
  function P(u, v, z) { return [(u - v) * 32, (u + v) * 16 - (z || 0)]; }
  function poly(c, pts, fill, stroke, lw) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.lineJoin = 'round'; c.stroke(); }
  }
  /* kotak isometrik: sisi kiri (v=v1), sisi kanan (u=u1), atas */
  function box(c, u0, v0, u1, v1, z0, z1, base, edge) {
    poly(c, [P(u0, v1, z0), P(u1, v1, z0), P(u1, v1, z1), P(u0, v1, z1)], base, edge, 1);
    poly(c, [P(u1, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u1, v0, z1)], sh(base, -0.17), edge, 1);
    poly(c, [P(u0, v0, z1), P(u1, v0, z1), P(u1, v1, z1), P(u0, v1, z1)], sh(base, 0.16), edge, 1);
  }
  function winCol(n, i, j, s) {
    var lit = n > 0.3 && ((i * 7 + j * 13 + s) % 3 !== 0);
    return lit ? mixc('#9fd6ff', '#ffe48a', Math.min(1, (n - 0.3) * 2.2)) : mixc('#9fd6ff', '#33507a', Math.min(1, n * 1.2));
  }
  function winsL(c, u0, u1, v1, z0, z1, nc, nr, n, s, pw) {
    var du = (u1 - u0) / nc, dz = (z1 - z0) / nr, px = du * (pw || 0.2), pz = dz * 0.2;
    for (var i = 0; i < nc; i++) for (var j = 0; j < nr; j++) {
      var a = u0 + i * du + px, b = u0 + (i + 1) * du - px, za = z0 + j * dz + pz, zb = z0 + (j + 1) * dz - pz;
      poly(c, [P(a, v1, za), P(b, v1, za), P(b, v1, zb), P(a, v1, zb)], winCol(n, i, j, s));
    }
  }
  function winsR(c, u1, v0, v1, z0, z1, nc, nr, n, s, pw) {
    var dv = (v1 - v0) / nc, dz = (z1 - z0) / nr, px = dv * (pw || 0.2), pz = dz * 0.2;
    for (var i = 0; i < nc; i++) for (var j = 0; j < nr; j++) {
      var a = v0 + i * dv + px, b = v0 + (i + 1) * dv - px, za = z0 + j * dz + pz, zb = z0 + (j + 1) * dz - pz;
      poly(c, [P(u1, a, za), P(u1, b, za), P(u1, b, zb), P(u1, a, zb)], sh(winCol(n, i + 3, j, s + 1).replace(/^rgb/, 'rgb'), 0) && winCol(n, i + 3, j, s + 1));
    }
  }
  function awning(c, u0, u1, v1, zt, cols, n, depth, drop) {
    var du = (u1 - u0) / n;
    for (var i = 0; i < n; i++) {
      var a = u0 + i * du, b = a + du;
      poly(c, [P(a, v1, zt), P(b, v1, zt), P(b, v1 + depth, zt - drop), P(a, v1 + depth, zt - drop)], cols[i % cols.length]);
    }
  }
  function door(c, u, w, v1, h, col) { poly(c, [P(u - w, v1, 0), P(u + w, v1, 0), P(u + w, v1, h), P(u - w, v1, h)], col); }
  function star(c, x, y, r, col) {
    c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = col; c.fill();
  }
  function crown(c, l, z, u, v) {      /* penanda level tinggi: bendera emas (lv 5+) dan bintang (lv 10) */
    if (l < 5) return;
    var p = P(u || 0, v || 0, z), x = p[0], y = p[1];
    c.strokeStyle = '#7a5b14'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 14); c.stroke();
    if (l >= 10) star(c, x, y - 17, 6, '#ffd60a');
    else { c.fillStyle = '#ffd60a'; c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + 9, y - 11); c.lineTo(x, y - 8); c.closePath(); c.fill(); }
  }
  function shadow(c, u0, v0, u1, v1, a) {
    poly(c, [P(u0 - 0.04, v0 + 0.1, 0), P(u1 + 0.16, v0 + 0.1, 0), P(u1 + 0.16, v1 + 0.16, 0), P(u0 - 0.04, v1 + 0.16, 0)], 'rgba(10,30,20,' + (a || 0.2) + ')');
  }

  /* ---------------- bangunan ---------------- */
  var DRAW = {};
  DRAW.shop = function (c, l, n, s) {
    var fl = 1 + (l >= 4 ? 1 : 0) + (l >= 8 ? 1 : 0), h = 21 * fl, u = 0.36, v = 0.33;
    shadow(c, -u, -v, u, v);
    box(c, -u, -v, u, v, 0, h, '#fde3a6', 'rgba(120,80,20,.22)');
    box(c, -u - 0.03, -v - 0.03, u + 0.03, v + 0.03, h, h + 3.5, l >= 5 ? '#f2b705' : '#d9954a');
    winsL(c, -u, u, v, 4 + (fl > 1 ? 20 : 0), h - 4, 2, fl > 1 ? fl - 1 : 1, n, s);
    winsR(c, u, -v, v, 4, h - 4, 2, fl, n, s);
    door(c, -0.05, 0.1, v, 14, '#7a4a21');
    awning(c, -u - 0.02, u + 0.02, v, 17, ['#ef4444', '#ffffff'], 6, 0.14, 6);
    box(c, 0.12, -0.04, 0.34, 0.04, h + 3.5, h + 11, '#e8d9b4');        // papan nama di atap
    poly(c, [P(0.12, 0.04, h + 5), P(0.34, 0.04, h + 5), P(0.34, 0.04, h + 10), P(0.12, 0.04, h + 10)], '#ef4444');
    crown(c, l, h + 3.5, -0.28, -0.2);
  };
  DRAW.cafe = function (c, l, n, s) {
    var fl = 1 + (l >= 5 ? 1 : 0) + (l >= 9 ? 1 : 0), h = 20 * fl, u = 0.3, v = 0.3;
    shadow(c, -u, -v, u, v);
    box(c, -u, -v, u, v, 0, h, '#bfe6c8', 'rgba(20,90,60,.2)');
    box(c, -u - 0.03, -v - 0.03, u + 0.03, v + 0.03, h, h + 3, l >= 5 ? '#f2b705' : '#7a5238');
    winsL(c, -u, u, v, 5, h - 4, 2, fl, n, s, 0.14); winsR(c, u, -v, v, 5, h - 4, 2, fl, n, s, 0.14);
    awning(c, -u - 0.02, u + 0.02, v, 15, ['#8b5a2b', '#f5e6c8'], 6, 0.16, 5);
    door(c, 0, 0.09, v, 13, '#5a3a22');
    [[0.46, 0.0], [0.46, 0.3]].forEach(function (t, i) {                 // meja + payung di teras
      var p = P(t[0], t[1] + 0.2, 0); c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(p[0], p[1] + 1, 10, 4.5, 0, 0, 6.283); c.fill();
      c.strokeStyle = '#6b4a2f'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 13); c.stroke();
      c.fillStyle = i ? '#ff7b5c' : '#5cc8ff'; c.beginPath(); c.moveTo(p[0] - 11, p[1] - 12); c.quadraticCurveTo(p[0], p[1] - 24, p[0] + 11, p[1] - 12); c.closePath(); c.fill();
    });
    c.fillStyle = '#7a5238'; var cp = P(0, -0.12, h + 3); c.beginPath(); c.arc(cp[0], cp[1] - 4, 4.4, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.fillRect(cp[0] - 2.2, cp[1] - 6.4, 4.4, 2);
    crown(c, l, h + 3, -0.22, -0.2);
  };
  DRAW.resto = function (c, l, n, s) {
    var fl = 1 + (l >= 3 ? 1 : 0) + (l >= 7 ? 1 : 0), h = 22 * fl, u = 0.38, v = 0.34, rh = 20;
    shadow(c, -u, -v, u, v);
    box(c, -u, -v, u, v, 0, h, '#ffd9cc', 'rgba(120,40,30,.2)');
    winsL(c, -u, u, v, 4, h - 4, 3, fl, n, s, 0.16); winsR(c, u, -v, v, 4, h - 4, 2, fl, n, s, 0.16);
    door(c, 0, 0.09, v, 15, '#7a2f22');
    awning(c, -0.2, 0.2, v, 17, ['#d7263d', '#fff4e0'], 4, 0.13, 5);
    /* atap pelana merah (punggung sejajar sumbu u) */
    poly(c, [P(u, -v, h), P(u, v, h), P(u, 0, h + rh)], '#ffd9cc', 'rgba(120,40,30,.2)', 1);
    poly(c, [P(-u - 0.04, v + 0.05, h - 1), P(u + 0.04, v + 0.05, h - 1), P(u + 0.04, 0, h + rh), P(-u - 0.04, 0, h + rh)], l >= 5 ? '#e5a100' : '#c8372d');
    poly(c, [P(-u - 0.04, 0, h + rh), P(u + 0.04, 0, h + rh), P(u + 0.04, -v - 0.05, h - 1), P(-u - 0.04, -v - 0.05, h - 1)], sh(l >= 5 ? '#e5a100' : '#c8372d', 0.12));
    box(c, -0.28, -0.2, -0.16, -0.1, h + 6, h + rh + 3, '#a8442f');            // cerobong
    c.fillStyle = 'rgba(255,255,255,.55)'; var sp = P(-0.22, -0.15, h + rh + 6); c.beginPath(); c.arc(sp[0] + 3, sp[1] - 4, 3.4, 0, 6.283); c.arc(sp[0] + 7, sp[1] - 10, 2.6, 0, 6.283); c.fill();
    crown(c, l, h + rh, 0.3, 0);
  };
  DRAW.mart = function (c, l, n, s) {
    var fl = 1 + (l >= 5 ? 1 : 0), h = 22 * fl, u = 0.45, v = 0.34;
    shadow(c, -u, -v, u, v);
    box(c, -u, -v, u, v, 0, h, '#f1f6fb', 'rgba(30,60,100,.2)');
    poly(c, [P(-u, v, h - 8), P(u, v, h - 8), P(u, v, h), P(-u, v, h)], '#1d6fe0');     // pita biru
    poly(c, [P(u, -v, h - 8), P(u, v, h - 8), P(u, v, h), P(u, -v, h)], '#1759b3');
    poly(c, [P(-u, v, h - 14), P(u, v, h - 14), P(u, v, h - 8), P(-u, v, h - 8)], '#ff7a1a');   // pita oranye
    poly(c, [P(u, -v, h - 14), P(u, v, h - 14), P(u, v, h - 8), P(u, -v, h - 8)], '#d9610c');
    poly(c, [P(-0.3, v, 3), P(0.3, v, 3), P(0.3, v, 15), P(-0.3, v, 15)], winCol(n, 0, 0, s));        // etalase kaca
    poly(c, [P(0, v, 3), P(0.04, v, 3), P(0.04, v, 15), P(0, v, 15)], '#cfe0f5');
    if (fl > 1) winsL(c, -u, u, v, h - 22 + 4, h - 16, 4, 1, n, s, 0.16);
    box(c, -u - 0.03, -v - 0.03, u + 0.03, v + 0.03, h, h + 3, '#1759b3');
    box(c, -0.12, -0.04, 0.24, 0.04, h + 3, h + 12, '#ffffff', 'rgba(0,0,0,.15)');
    poly(c, [P(-0.12, 0.04, h + 5), P(0.24, 0.04, h + 5), P(0.24, 0.04, h + 10), P(-0.12, 0.04, h + 10)], '#ff7a1a');
    crown(c, l, h + 3, 0.34, -0.2);
  };
  DRAW.mall = function (c, l, n, s) {
    var fl = 2 + Math.floor((l - 1) / 3), h = 19 * fl, u = 0.46, v = 0.44;
    shadow(c, -u, -v, u, v, 0.24);
    box(c, -u, -v, u, v, 0, h, '#b9d8f2', 'rgba(20,60,110,.22)');
    for (var f = 0; f < fl; f++) {                                              // pita kaca per lantai
      winsL(c, -u, u, v, f * 19 + 4, f * 19 + 16, 5, 1, n, s + f, 0.07); winsR(c, u, -v, v, f * 19 + 4, f * 19 + 16, 5, 1, n, s + f + 2, 0.07);
      poly(c, [P(-u, v, f * 19 + 17), P(u, v, f * 19 + 17), P(u, v, f * 19 + 19), P(-u, v, f * 19 + 19)], '#ffffff');
      poly(c, [P(u, -v, f * 19 + 17), P(u, v, f * 19 + 17), P(u, v, f * 19 + 19), P(u, -v, f * 19 + 19)], '#dfe9f4');
    }
    box(c, -0.14, v - 0.02, 0.14, v + 0.16, 0, 6, '#ff5d73');                     // kanopi pintu masuk
    box(c, -u - 0.03, -v - 0.03, u + 0.03, v + 0.03, h, h + 4, l >= 5 ? '#f2b705' : '#e8f1fa');
    box(c, -0.04, -0.04, 0.04, 0.04, h + 4, h + 26, '#9aa7b8');                     // tiang papan
    var pp = P(0, 0, h + 30); c.fillStyle = '#ff5d73'; c.beginPath(); c.ellipse(pp[0], pp[1], 14, 9, 0, 0, 6.283); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.font = '800 11px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('M', pp[0], pp[1] + 0.5);
    crown(c, l, h + 4, 0.34, 0.3);
  };
  DRAW.bank = function (c, l, n, s) {
    var fl = 2 + (l >= 6 ? 1 : 0), h = 19 * fl, u = 0.4, v = 0.38;
    shadow(c, -u, -v, u, v, 0.24);
    box(c, -u - 0.04, -v - 0.04, u + 0.04, v + 0.1, 0, 4, '#d9cba5');                // alas tangga
    box(c, -u, -v, u, v, 4, h, '#f6ecce', 'rgba(110,80,20,.2)');
    winsL(c, -u, u, v, 10, h - 6, 4, fl - 1 > 0 ? 1 : 1, n, s, 0.2);
    for (var i = 0; i < 5; i++) { var uu = -u + 0.06 + i * ((2 * u - 0.12) / 4); box(c, uu - 0.025, v + 0.0, uu + 0.025, v + 0.05, 4, h - 5, '#fffaf0', 'rgba(0,0,0,.12)'); }  // pilar
    poly(c, [P(-u - 0.04, v + 0.08, h - 5), P(u + 0.04, v + 0.08, h - 5), P(0, v + 0.08, h + 10)], '#e9dcb6', 'rgba(110,80,20,.3)', 1);   // pedimen
    box(c, -u - 0.02, -v - 0.02, u + 0.02, v + 0.04, h - 5, h - 1, '#d9cba5');
    var cp = P(0, v + 0.08, h + 1); c.fillStyle = '#ffd60a'; c.strokeStyle = '#b88700'; c.lineWidth = 1.5; c.beginPath(); c.arc(cp[0], cp[1], 5, 0, 6.283); c.fill(); c.stroke();
    var dp = P(0, 0, h); c.fillStyle = '#f2b705'; c.beginPath(); c.ellipse(dp[0], dp[1] + 0, 11, 6, 0, 0, 6.283); c.fill(); c.beginPath(); c.arc(dp[0], dp[1] - 1, 8, Math.PI, 0); c.fill();
    crown(c, l, h, 0.3, -0.28);
  };
  DRAW.hotel = function (c, l, n, s) {
    var fl = 5 + Math.floor(l / 2), h = 15 * fl, u = 0.33, v = 0.33;
    shadow(c, -u, -v, u, v, 0.26);
    box(c, -u - 0.06, -v - 0.06, u + 0.06, v + 0.1, 0, 12, '#c9a6e4');                // podium
    box(c, -u, -v, u, v, 12, h, '#e7d6f6', 'rgba(70,30,110,.2)');
    winsL(c, -u, u, v, 16, h - 3, 3, fl - 1, n, s, 0.15); winsR(c, u, -v, v, 16, h - 3, 3, fl - 1, n, s, 0.15);
    awning(c, -0.2, 0.2, v + 0.1, 11, ['#7a3fb5', '#e7d6f6'], 4, 0.12, 4);
    box(c, -u - 0.02, -v - 0.02, u + 0.02, v + 0.02, h, h + 3, '#7a3fb5');
    box(c, -0.18, -0.06, 0.18, 0.06, h + 3, h + 13, '#ffffff', 'rgba(0,0,0,.15)');
    poly(c, [P(-0.18, 0.06, h + 6), P(0.18, 0.06, h + 6), P(0.18, 0.06, h + 11), P(-0.18, 0.06, h + 11)], '#ff4d9d');
    crown(c, l, h + 3, 0.22, -0.2);
  };
  DRAW.tower = function (c, l, n, s) {
    var fl = 8 + Math.floor(l * 1.2), h = 13 * fl, u = 0.3, v = 0.3;
    shadow(c, -0.36, -0.36, 0.36, 0.36, 0.28);
    box(c, -0.38, -0.38, 0.38, 0.38, 0, 14, '#8fb3d9');
    box(c, -u, -v, u, v, 14, h * 0.62, '#a6c8ea', 'rgba(20,60,110,.2)');
    winsL(c, -u, u, v, 17, h * 0.62 - 3, 4, Math.max(2, Math.floor(fl * 0.55)), n, s, 0.12); winsR(c, u, -v, v, 17, h * 0.62 - 3, 4, Math.max(2, Math.floor(fl * 0.55)), n, s, 0.12);
    var u2 = 0.22, v2 = 0.22, z2 = h * 0.62;
    box(c, -u2, -v2, u2, v2, z2, h, '#c3dcf5', 'rgba(20,60,110,.2)');
    winsL(c, -u2, u2, v2, z2 + 3, h - 3, 3, Math.max(2, Math.floor(fl * 0.4)), n, s + 3, 0.12); winsR(c, u2, -v2, v2, z2 + 3, h - 3, 3, Math.max(2, Math.floor(fl * 0.4)), n, s + 4, 0.12);
    box(c, -0.03, -0.03, 0.03, 0.03, h, h + 22, '#aab6c6');
    var ap = P(0, 0, h + 23), blink = (Date.now() / 500 | 0) % 2; c.fillStyle = blink ? '#ff3b30' : '#7a1d18'; c.beginPath(); c.arc(ap[0], ap[1], 2.6, 0, 6.283); c.fill();
    crown(c, l, 14, 0.3, 0.3);
  };
  DRAW.park = function (c, l, n, s, t) {
    poly(c, [P(-0.46, -0.46, 0), P(0.46, -0.46, 0), P(0.46, 0.46, 0), P(-0.46, 0.46, 0)], '#7fd37c');
    poly(c, [P(-0.1, -0.46, 0.2), P(0.1, -0.46, 0.2), P(0.1, 0.46, 0.2), P(-0.1, 0.46, 0.2)], 'rgba(255,240,200,.65)');   // jalan setapak
    var pf = P(0, 0.02, 0);                                                    // air mancur
    c.fillStyle = '#bfe8ff'; c.strokeStyle = '#8aa6b8'; c.lineWidth = 2; c.beginPath(); c.ellipse(pf[0], pf[1], 13, 6.5, 0, 0, 6.283); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.6; var ph = (t || 0) * 3;
    for (var i = 0; i < 3; i++) { var a = (i - 1) * 0.5; c.beginPath(); c.moveTo(pf[0], pf[1] - 2); c.quadraticCurveTo(pf[0] + a * 14, pf[1] - 15 - Math.sin(ph + i) * 2, pf[0] + a * 22, pf[1] - 1); c.stroke(); }
    var spots = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.32, 0.3], [0.0, -0.34]], cnt = Math.min(5, 2 + l);
    for (var k = 0; k < cnt; k++) tree(c, spots[k][0], spots[k][1], 1 + (k % 2) * 0.15, k % 2 ? '#2f9e57' : '#43b86a');
  };
  function tree(c, u, v, sc, col) {
    var p = P(u, v, 0); c.fillStyle = 'rgba(0,40,20,.18)'; c.beginPath(); c.ellipse(p[0] + 2, p[1] + 1, 9 * sc, 4 * sc, 0, 0, 6.283); c.fill();
    c.fillStyle = '#7a5238'; c.fillRect(p[0] - 1.6, p[1] - 9 * sc, 3.2, 9 * sc);
    c.fillStyle = col || '#43b86a'; c.beginPath(); c.arc(p[0], p[1] - 16 * sc, 9 * sc, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(p[0] - 3 * sc, p[1] - 19 * sc, 4 * sc, 0, 6.283); c.fill();
  }

  var BUILD_H = { shop: 80, cafe: 80, resto: 100, mart: 90, mall: 140, bank: 100, hotel: 180, tower: 260, park: 40 };

  /* gambar bangunan pada pusat petak (0,0) */
  function drawBuilding(c, kind, lvl, o) {
    o = o || {};
    var f = DRAW[kind]; if (!f) return;
    c.save();
    var b = o.build == null ? 1 : o.build;
    if (b < 1) {                                   // animasi dibangun: naik dari tanah dengan sedikit memantul
      var e = 1 + 2.4 * Math.pow(b - 1, 3) + 1.4 * Math.pow(b - 1, 2); e = Math.max(0.02, e);
      c.scale(1, e);
    }
    if (o.pulse) { var pp = Math.sin(o.pulse * Math.PI); c.scale(1 + 0.05 * pp, 1 - 0.07 * pp); }
    f(c, lvl || 1, o.night || 0, o.seed || 0, o.t || 0);
    c.restore();
    if (o.flash) {                                  // kilat putih saat upgrade
      c.save(); c.globalAlpha = o.flash * 0.55; c.globalCompositeOperation = 'lighter'; c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(0, -22, 34, 30, 0, 0, 6.283); c.fill(); c.restore();
    }
  }

  /* ---------------- tanah ---------------- */
  function tilePath(c, x, y, k) { k = k || 1; c.beginPath(); c.moveTo(x, y - 16 * k); c.lineTo(x + 32 * k, y); c.lineTo(x, y + 16 * k); c.lineTo(x - 32 * k, y); c.closePath(); }
  function grass(c, x, y, alt, tone) {
    tilePath(c, x, y); c.fillStyle = tone || (alt ? '#8fdc7e' : '#86d476'); c.fill();
    c.strokeStyle = 'rgba(30,110,60,.18)'; c.lineWidth = 1; c.stroke();
  }
  function plot(c, x, y, alt, hot, selected, t) {
    grass(c, x, y, alt);
    tilePath(c, x, y, 0.82); c.fillStyle = alt ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.12)'; c.fill();
    if (hot) { tilePath(c, x, y, 0.86); c.strokeStyle = 'rgba(255,255,255,' + (0.45 + 0.4 * Math.sin((t || 0) * 5)) + ')'; c.lineWidth = 2.4; c.setLineDash([6, 5]); c.lineDashOffset = -(t || 0) * 14; c.stroke(); c.setLineDash([]); }
    if (selected) { tilePath(c, x, y, 0.94); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke(); }
  }
  function locked(c, x, y, alt) {
    grass(c, x, y, alt, alt ? '#a5c79b' : '#9dbf93');
    tilePath(c, x, y, 0.78); c.fillStyle = 'rgba(70,80,90,.22)'; c.fill();
    c.strokeStyle = 'rgba(80,95,110,.55)'; c.lineWidth = 1.6; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(70,80,95,.7)'; c.beginPath(); c.roundRect ? c.roundRect(x - 5, y - 4, 10, 8, 2) : c.rect(x - 5, y - 4, 10, 8); c.fill();
    c.strokeStyle = 'rgba(70,80,95,.7)'; c.lineWidth = 1.8; c.beginPath(); c.arc(x, y - 4, 3.2, Math.PI, 0); c.stroke();
  }
  function road(c, x, y, axis, cross) {
    tilePath(c, x, y); c.fillStyle = '#626a78'; c.fill();
    c.save(); c.translate(x, y);
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1; tilePath(c, 0, 0, 0.98); c.stroke();
    if (cross) {
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (var i = -2; i <= 2; i++) { poly(c, [P(-0.42, i * 0.14 - 0.04, 0), P(-0.3, i * 0.14 - 0.04, 0), P(-0.3, i * 0.14 + 0.04, 0), P(-0.42, i * 0.14 + 0.04, 0)], 'rgba(255,255,255,.5)'); poly(c, [P(i * 0.14 - 0.04, -0.42, 0), P(i * 0.14 + 0.04, -0.42, 0), P(i * 0.14 + 0.04, -0.3, 0), P(i * 0.14 - 0.04, -0.3, 0)], 'rgba(255,255,255,.5)'); }
    } else {
      c.strokeStyle = 'rgba(255,224,102,.85)'; c.lineWidth = 1.8; c.setLineDash([5, 5]); c.beginPath();
      var a = axis === 'v' ? P(0, -0.5, 0) : P(-0.5, 0, 0), b = axis === 'v' ? P(0, 0.5, 0) : P(0.5, 0, 0);
      c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]);
    }
    c.restore();
  }
  /* tepi papan (diorama) */
  function slab(c, N, th) {
    var h = (N - 1) / 2, A = function (gx, gy) { return [(gx - gy) * 32, (gx + gy) * 16]; };
    var L = A(-0.5, N - 0.5), B = A(N - 0.5, N - 0.5), R = A(N - 0.5, -0.5);
    c.fillStyle = '#6bb25e'; c.beginPath(); c.moveTo(L[0], L[1]); c.lineTo(B[0], B[1]); c.lineTo(B[0], B[1] + th); c.lineTo(L[0], L[1] + th); c.closePath(); c.fill();
    c.fillStyle = '#4d9446'; c.beginPath(); c.moveTo(B[0], B[1]); c.lineTo(R[0], R[1]); c.lineTo(R[0], R[1] + th); c.lineTo(B[0], B[1] + th); c.closePath(); c.fill();
    c.fillStyle = '#8b6a49'; c.beginPath(); c.moveTo(L[0], L[1] + th); c.lineTo(B[0], B[1] + th); c.lineTo(B[0], B[1] + th + 10); c.lineTo(L[0], L[1] + th + 10); c.closePath(); c.fill();
    c.fillStyle = '#6e5238'; c.beginPath(); c.moveTo(B[0], B[1] + th); c.lineTo(R[0], R[1] + th); c.lineTo(R[0], R[1] + th + 10); c.lineTo(B[0], B[1] + th + 10); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,30,20,.16)'; c.beginPath(); c.moveTo(L[0] - 10, L[1] + th + 14); c.lineTo(B[0], B[1] + th + 30); c.lineTo(R[0] + 10, R[1] + th + 14); c.lineTo(B[0], B[1] + th + 12); c.closePath(); c.fill();
  }

  function car(c, axis, lane, pos, col, dir) {
    c.save();
    var u = axis === 'v' ? lane : pos, v = axis === 'v' ? pos : lane;
    var p = P(u, v, 0); c.translate(p[0], p[1]);
    var du = axis === 'v' ? 0.06 : 0.13, dv = axis === 'v' ? 0.13 : 0.06;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(1, 1, 12, 5, 0, 0, 6.283); c.fill();
    box(c, -du, -dv, du, dv, 1, 5, col);
    box(c, -du * 0.6, -dv * 0.6, du * 0.6, dv * 0.6, 5, 8.5, sh(col, 0.2));
    c.restore();
  }
  function walker(c, u, v, col, ph) {
    var p = P(u, v, 0), bob = Math.abs(Math.sin(ph * 6)) * 1.2;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(p[0], p[1] + 1, 3.6, 1.6, 0, 0, 6.283); c.fill();
    c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(p[0] - 2, p[1] - 8 - bob, 4, 7, 2) : c.rect(p[0] - 2, p[1] - 8 - bob, 4, 7); c.fill();
    c.fillStyle = '#f1c9a0'; c.beginPath(); c.arc(p[0], p[1] - 10 - bob, 2.4, 0, 6.283); c.fill();
  }

  /* gambar kecil untuk daftar bangunan */
  var spr = {};
  function sprite(kind, lvl, px) {
    var k = kind + ':' + (lvl || 1) + ':' + (px || 96); if (spr[k]) return spr[k];
    var cv = document.createElement('canvas'), W = px || 96; cv.width = W * 2; cv.height = W * 2;
    var c = cv.getContext('2d'), hh = BUILD_H[kind] || 100, sc = Math.min(W * 2 / 96, W * 2 / (hh + 34)) * 0.96;
    c.translate(W, W * 2 - 22 * sc - 4); c.scale(sc, sc);
    if (kind !== 'park') { tilePath(c, 0, 0); c.fillStyle = '#86d476'; c.fill(); }
    drawBuilding(c, kind, lvl || 1, { night: 0, seed: 1 });
    try { return (spr[k] = cv.toDataURL('image/png')); } catch (e) { return ''; }
  }

  window.TYArt = {
    TW: TW, TH: TH, P: P, poly: poly, tilePath: tilePath, drawBuilding: drawBuilding, buildH: function (k, l) { return (BUILD_H[k] || 90) + (k === 'tower' ? (l || 1) * 14 : k === 'hotel' ? (l || 1) * 8 : k === 'mall' ? Math.floor(((l || 1) - 1) / 3) * 19 : 0) + 12; },
    grass: grass, plot: plot, locked: locked, road: road, slab: slab, car: car, walker: walker, tree: tree, sprite: sprite, mixc: mixc, star: star
  };
})();
