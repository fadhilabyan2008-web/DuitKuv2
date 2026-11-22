/* DuitKu Scenes — ilustrasi sapaan satu baris penuh untuk pagi, siang, sore, dan malam.
   Setiap suasana hanya punya satu benda langit; pejalan dan kendaraan bergerak bolak-balik
   (kanan → kiri, lalu kiri → kanan). Animasi memakai CSS (kelas .sc-*) di ios.css. */
(function () {
  'use strict';
  var uid = 0;

  /* pejalan kaki menghadap kiri; kaki di y=0 */
  function walker(o) {
    return '<g class="sc-run" style="--t:' + o.t + 's;--dl:' + o.dl + 's;--y:' + o.y + 'px"><g class="sc-flip" style="--t:' + o.t + 's;--dl:' + o.dl + 's"><g transform="scale(' + (o.s || 1) + ')">' +
      '<g transform="translate(0 -9)"><path class="sc-leg a" d="M0 0V9" stroke="' + o.pants + '" stroke-width="2.6" stroke-linecap="round"/><path class="sc-leg b" d="M0 0V9" stroke="' + o.pants + '" stroke-width="2.6" stroke-linecap="round"/></g>' +
      '<rect x="-3.3" y="-20" width="6.6" height="12" rx="3.2" fill="' + o.shirt + '"/>' +
      '<circle cy="-23.6" r="3.2" fill="' + o.skin + '"/><path d="M-3.3-24.2a3.3 3.3 0 0 1 6.6 0c-1.6-1-4-1.3-6.6 0z" fill="' + o.hair + '"/>' +
      (o.umb ? '<path d="M-1 -20V-33" stroke="#6b4a2b" stroke-width="1" stroke-linecap="round"/><path d="M-12-33a11 8 0 0 1 22 0z" fill="' + o.umb + '"/>' : '') +
      (o.board ? '<g transform="rotate(-72 6 -14)"><ellipse cx="6" cy="-14" rx="2.6" ry="11" fill="' + o.board + '"/><path d="M6-24V-4" stroke="#fff" stroke-width=".7" opacity=".8"/></g>' : '') +
      (o.dog ? '<g transform="translate(-13 0)"><ellipse cx="0" cy="-5" rx="5" ry="2.8" fill="#8b5a32"/><circle cx="-5" cy="-7" r="2.2" fill="#8b5a32"/><path d="M-3-1v2M3-1v2" stroke="#6e4524" stroke-width="1.4" stroke-linecap="round"/><path d="M5-6q3-2 3-5" stroke="#8b5a32" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>' : '') +
      '</g></g></g>';
  }

  /* pesepeda (digambar menghadap kanan lalu dicerminkan agar menghadap kiri) */
  function cyclist(o) {
    return '<g class="sc-run" style="--t:' + o.t + 's;--dl:' + o.dl + 's;--y:' + o.y + 'px"><g class="sc-flip" style="--t:' + o.t + 's;--dl:' + o.dl + 's"><g transform="scale(-1 1)">' +
      '<g transform="translate(-9 -6.6)"><g class="sc-spin r"><circle r="6.6" fill="none" stroke="#2b2f3a" stroke-width="1.4"/><path d="M-6.6 0H6.6M0-6.6V6.6" stroke="#8a8f9c" stroke-width=".7"/></g></g>' +
      '<g transform="translate(9 -6.6)"><g class="sc-spin r"><circle r="6.6" fill="none" stroke="#2b2f3a" stroke-width="1.4"/><path d="M-6.6 0H6.6M0-6.6V6.6" stroke="#8a8f9c" stroke-width=".7"/></g></g>' +
      '<path d="M-9-6.6L-2-14H5L9-6.6M-2-14L1-6.6H-9M5-14V-17H8" stroke="' + o.frame + '" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M1-6.6l-1.6-5" stroke="#2b2f3a" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M-1.5-15.5L3-25" stroke="' + o.shirt + '" stroke-width="5.4" stroke-linecap="round"/>' +
      '<path d="M3-25L7-17.5" stroke="' + o.skin + '" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="3.6" cy="-29" r="3.1" fill="' + o.skin + '"/><path d="M.6-29.6a3.1 3.1 0 0 1 6 0c-1.8-1-3.9-1.4-6 0z" fill="' + o.helm + '"/>' +
      '</g></g></g>';
  }

  /* motor/ojek (dicerminkan menghadap kiri) */
  function moto(o) {
    return '<g class="sc-run" style="--t:' + o.t + 's;--dl:' + o.dl + 's;--y:' + o.y + 'px"><g class="sc-flip" style="--t:' + o.t + 's;--dl:' + o.dl + 's"><g transform="scale(-1 1)">' +
      '<g transform="translate(-10 -5)"><g class="sc-spin r f"><circle r="5" fill="#242833"/><circle r="2" fill="#aeb4c2"/></g></g>' +
      '<g transform="translate(10 -5)"><g class="sc-spin r f"><circle r="5" fill="#242833"/><circle r="2" fill="#aeb4c2"/></g></g>' +
      '<path d="M-10-5L-3-8H8L12-14M-3-8L-1-12H6" stroke="' + o.body + '" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M5-12L10-16" stroke="#242833" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M1-12L3.5-21" stroke="' + o.shirt + '" stroke-width="5.4" stroke-linecap="round"/>' +
      '<circle cx="4.2" cy="-25" r="3.1" fill="' + o.skin + '"/><path d="M1.2-25.5a3.1 3.1 0 0 1 6 0z" fill="' + o.helm + '"/>' +
      '</g></g></g>';
  }

  /* mobil menghadap kiri dengan lampu */
  function car(o) {
    return '<g class="sc-run" style="--t:' + o.t + 's;--dl:' + o.dl + 's;--y:' + o.y + 'px"><g class="sc-flip" style="--t:' + o.t + 's;--dl:' + o.dl + 's">' +
      (o.beam ? '<path d="M-24-7L-86-1V-15z" fill="url(#' + o.beam + ')"/>' : '') +
      '<path d="M-24-4V-9q0-3 3-3.4L-14-13q3-6 8-6h12q5 0 8 5l7 1.6q3 .6 3 3.4V-4z" fill="' + o.body + '"/>' +
      '<path d="M-12-13q2-4.6 6-4.6h5V-13zM3-13v-4.6h4q3 0 5 3.4l1 1.2z" fill="' + o.glass + '"/>' +
      '<circle cx="-14" cy="-3.6" r="4.2" fill="#1f232d"/><circle cx="-14" cy="-3.6" r="1.6" fill="#aeb4c2"/><circle cx="14" cy="-3.6" r="4.2" fill="#1f232d"/><circle cx="14" cy="-3.6" r="1.6" fill="#aeb4c2"/>' +
      '<rect x="-25.5" y="-10" width="3" height="3.2" rx="1.4" fill="' + (o.lamp || '#fff2b0') + '"/>' +
      '</g></g>';
  }

  function cloud(x, y, s, t, dl, c) {
    return '<g class="sc-cloud" style="--t:' + t + 's;--dl:' + dl + 's;--y:' + y + 'px"><g transform="scale(' + s + ')" fill="' + c + '"><ellipse cx="0" cy="0" rx="16" ry="5.4"/><ellipse cx="-7" cy="-4" rx="8" ry="6"/><ellipse cx="6" cy="-5" rx="9.5" ry="7"/></g></g>';
  }

  function bird(t, dl, y, c) {
    return '<g class="sc-fly" style="--t:' + t + 's;--dl:' + dl + 's;--y:' + y + 'px"><path class="sc-wing" d="M-4 0q2-3 4 0q2-3 4 0" fill="none" stroke="' + c + '" stroke-width="1.1" stroke-linecap="round"/></g>';
  }

  function tree(x, y, s, c1, c2) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-1.3" y="-10" width="2.6" height="10" fill="#7a5233"/><circle cy="-15" r="8" fill="' + c1 + '"/><circle cx="-4" cy="-12" r="5.5" fill="' + c2 + '"/><circle cx="5" cy="-12.5" r="5" fill="' + c2 + '"/></g>';
  }

  function hills(c1, c2) {
    return '<path d="M0 84Q50 52 110 70T230 62T350 72T480 58V92H0z" fill="' + c1 + '"/><path d="M0 90Q70 70 150 82T300 78T480 84V96H0z" fill="' + c2 + '"/>';
  }

  function ground(top, bot, line) {
    var g = 'g' + (++uid);
    return '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bot + '"/></linearGradient></defs>' +
      '<rect y="92" width="480" height="28" fill="url(#' + g + ')"/><path d="M0 92.4H480" stroke="' + line + '" stroke-width=".8"/>';
  }

  function sky(a, b, c) {
    var g = 'k' + (++uid);
    return '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset=".62" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></linearGradient></defs><rect width="480" height="120" fill="url(#' + g + ')"/>';
  }

  function sun(x, y, r, core, glow) {
    return '<g transform="translate(' + x + ' ' + y + ')"><circle class="sc-glow" r="' + (r * 2.1) + '" fill="' + glow + '" opacity=".28"/><circle class="sc-glow s2" r="' + (r * 1.5) + '" fill="' + glow + '" opacity=".35"/><circle r="' + r + '" fill="' + core + '"/></g>';
  }

  function moon(x, y) {
    var m = 'm' + (++uid);
    return '<g transform="translate(' + x + ' ' + y + ')"><circle class="sc-glow" r="30" fill="#cfd8ff" opacity=".12"/><mask id="' + m + '"><rect x="-20" y="-20" width="40" height="40" fill="#fff"/><circle cx="7" cy="-3.5" r="11.5" fill="#000"/></mask><circle r="13" fill="#fff4cf" mask="url(#' + m + ')"/></g>';
  }

  function stars() {
    var p = [[22, 14], [58, 30], [96, 12], [140, 26], [176, 10], [214, 34], [252, 16], [292, 8], [372, 36], [410, 14], [452, 28], [470, 10], [330, 52], [120, 48], [38, 54], [250, 50]], o = '';
    p.forEach(function (s, i) { o += '<circle class="sc-star" style="--dl:' + (-(i % 6) * .6) + 's" cx="' + s[0] + '" cy="' + s[1] + '" r="' + (i % 3 ? .9 : 1.3) + '" fill="#fff"/>'; });
    return o;
  }

  function skyline() {
    var o = '', xs = [0, 34, 70, 104, 142, 178, 212, 250, 286, 322, 360, 396, 432, 460], hs = [40, 58, 34, 64, 46, 72, 38, 56, 44, 66, 36, 60, 48, 52];
    xs.forEach(function (x, i) {
      var w = (xs[i + 1] || 490) - x - 3, h = hs[i], y = 92 - h;
      o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1.5" fill="' + (i % 2 ? '#1a1f45' : '#222857') + '"/>';
      for (var yy = y + 6; yy < 86; yy += 9) for (var xx = x + 5; xx < x + w - 5; xx += 8) {
        var on = ((xx * 7 + yy * 13 + i * 5) % 5) < 2;
        if (on) o += '<rect class="' + (((xx + yy) % 3) ? 'sc-win' : 'sc-win b') + '" x="' + xx + '" y="' + yy + '" width="3.6" height="4.6" rx=".8" fill="#ffd77a"/>';
      }
    });
    return o;
  }

  function lamp(x) {
    return '<g transform="translate(' + x + ' 92)"><path d="M0 0V-26q0-3 3-3h5" stroke="#3d4570" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="9" cy="-26.5" r="2.6" fill="#ffe08a"/><path d="M4-24L14-24L19 0H-1z" fill="#ffe08a" opacity=".13"/><ellipse cx="9" cy="1" rx="14" ry="2.6" fill="#ffe08a" opacity=".16"/></g>';
  }


  /* unta menghadap kiri; telapak kaki di y=0 */
  function camel(o) {
    var c = o.fur || '#c99a5b', d = o.dark || '#a97a3f';
    function leg(x, cls) { return '<g transform="translate(' + x + ' -15)"><path class="sc-leg slow ' + cls + '" d="M0 0V15" stroke="' + d + '" stroke-width="2.1" stroke-linecap="round"/></g>'; }
    return '<g class="sc-run" style="--t:' + o.t + 's;--dl:' + o.dl + 's;--y:' + o.y + 'px"><g class="sc-flip" style="--t:' + o.t + 's;--dl:' + o.dl + 's"><g transform="scale(' + (o.s || 1) + ')">' +
      leg(-10, 'b') + leg(11, 'b') +
      '<path d="M17-21q5-1 4 5" stroke="' + d + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="1" cy="-22" rx="16" ry="7" fill="' + c + '"/>' +
      '<path d="M-6-27q2-9 7-9t7 9q-7 2-14 0z" fill="' + c + '"/>' +
      '<path d="M-11-24q-6-3-9-9l-1-5" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="-23.5" cy="-40.5" rx="5.6" ry="3.2" transform="rotate(-12 -23.5 -40.5)" fill="' + c + '"/><circle cx="-25.2" cy="-41.2" r=".9" fill="#2b1d10"/>' +
      '<path d="M-6-27q7-2 14 0v3q-7 2-14 0z" fill="' + (o.rug || '#d9534f') + '"/><path d="M-6-25.6q7-2 14 0" stroke="#ffd98a" stroke-width=".8" fill="none"/>' +
      leg(-5, 'a') + leg(16, 'a') +
      '</g></g></g>';
  }

  function cactus(x, y, s, c1, c2) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0V-26" stroke="' + c1 + '" stroke-width="6" stroke-linecap="round"/><path d="M-3-12H-8V-19M3-16H8V-24" stroke="' + c1 + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 -3V-24" stroke="' + c2 + '" stroke-width="1.4" stroke-linecap="round" opacity=".6"/></g>';
  }

  function dunes(c1, c2, c3) {
    return '<path d="M0 82Q60 58 130 76T250 70T380 78T480 66V96H0z" fill="' + c1 + '"/>' +
      '<path d="M0 90Q80 70 170 86T330 80T480 88V96H0z" fill="' + c2 + '"/>' +
      '<path d="M120 76Q150 66 190 80" stroke="' + c3 + '" stroke-width="1" fill="none" opacity=".5"/>';
  }

  function pyramid(x, y, s, c1, c2) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-22 0L0-24 22 0z" fill="' + c1 + '"/><path d="M0-24L22 0H6z" fill="' + c2 + '"/></g>';
  }

  function palm(x, y, s, lean) {
    var f = '#2f9a62', g = '#3fb579', k = lean || 1, o = '<g transform="translate(' + x + ' ' + y + ') scale(' + (s * k) + ' ' + s + ')">';
    o += '<path d="M0 0Q4-18 1-38" stroke="#8a6035" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    o += '<g transform="translate(1 -38)"><path d="M0 0Q-10-9-22-4Q-12-4 0 0zM0 0Q10-10 22-5Q12-4 0 0zM0 0Q-6-14-17-14Q-8-8 0 0zM0 0Q6-14 17-15Q8-8 0 0zM0 0Q0-10 0-16Q3-8 0 0z" fill="' + f + '"/><path d="M0 0Q-9-6-20-2M0 0Q9-7 20-3" stroke="' + g + '" stroke-width="1" fill="none"/><circle cx="-2" cy="2" r="1.8" fill="#6b4423"/><circle cx="2" cy="2.4" r="1.8" fill="#6b4423"/></g></g>';
    return o;
  }

  function boat(y, t, dl, sail) {
    return '<g class="sc-cloud" style="--t:' + t + 's;--dl:' + dl + 's;--y:' + y + 'px"><path d="M-9 0h18l-3 4h-12z" fill="#f4efe6"/><path d="M0 0V-16L9-2z" fill="' + sail + '"/><path d="M-1-14L-8-2h7z" fill="#fff" opacity=".9"/></g>';
  }

  function sea(top, bot) {
    var g = 'z' + (++uid), o = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bot + '"/></linearGradient></defs><rect y="64" width="480" height="30" fill="url(#' + g + ')"/>';
    o += '<g fill="#ffd9a0" opacity=".55"><ellipse cx="284" cy="67" rx="16" ry="1.2"/><ellipse cx="284" cy="71" rx="11" ry="1.1"/><ellipse cx="284" cy="75" rx="7" ry="1"/><ellipse cx="284" cy="79" rx="4" ry="1"/></g>';
    [[70, 70, 0], [210, 76, 1], [350, 72, 2], [430, 82, 3], [120, 84, 4], [300, 86, 5]].forEach(function (w) {
      o += '<path class="sc-wave" style="--dl:' + (-w[2] * .9) + 's" d="M' + w[0] + ' ' + w[1] + 'q5-3 10 0t10 0t10 0" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>';
    });
    return o + '<path class="sc-foam" d="M-20 92q20-4 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0V95H-20z" fill="#fff" opacity=".7"/>';
  }

  /* ---------- tokoh & properti diam (kegiatan di tiap suasana) ---------- */
  function person(x, y, o) {
    var d = o.dir || 1, sk = o.skin || SKIN[1], hr = o.hair || '#222', sh = o.shirt || '#6c8cff', pn = o.pants || '#2c3a5a', k = o.s || 1, g;
    g = '<g transform="translate(' + x + ' ' + y + ') scale(' + (d * k) + ' ' + k + ')"><g' + (o.bob ? ' class="sc-bob" style="--dl:' + o.bob + 's"' : '') + '>';
    if (o.sit) {
      g += '<path d="M0-4h7M7-4v4" stroke="' + pn + '" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="-3.3" y="-16" width="6.6" height="12.4" rx="3.2" fill="' + sh + '"/><circle cy="-19.6" r="3.2" fill="' + sk + '"/><path d="M-3.3-20.2a3.3 3.3 0 0 1 6.6 0c-1.6-1-4-1.3-6.6 0z" fill="' + hr + '"/>';
      if (o.hold) g += '<path d="M2-11l6 1" stroke="' + sh + '" stroke-width="1.8" stroke-linecap="round"/>';
    } else {
      g += '<path d="M-1.6-9v9M1.6-9v9" stroke="' + pn + '" stroke-width="2.6" stroke-linecap="round"/><rect x="-3.3" y="-20" width="6.6" height="12" rx="3.2" fill="' + sh + '"/><circle cy="-23.6" r="3.2" fill="' + sk + '"/><path d="M-3.3-24.2a3.3 3.3 0 0 1 6.6 0c-1.6-1-4-1.3-6.6 0z" fill="' + hr + '"/>';
      if (o.arms === 'up') g += '<g class="sc-arm" style="--dl:' + (o.dl || 0) + 's"><path d="M-3-18l-5-7M3-18l5-7" stroke="' + sh + '" stroke-width="1.9" stroke-linecap="round"/></g>';
      else if (o.arms === 'serve') g += '<path d="M3-17l6 3" stroke="' + sh + '" stroke-width="1.9" stroke-linecap="round"/>';
      else g += '<path d="M-3.3-18l-1.6 7M3.3-18l1.6 7" stroke="' + sh + '" stroke-width="1.8" stroke-linecap="round"/>';
    }
    if (o.hat) g += '<path d="M-4.2-23.4h8.4l-1-3h-6.4z" fill="' + o.hat + '"/>';
    return g + '</g></g>';
  }
  function bench(x, y, w) { w = w || 36; return '<g transform="translate(' + x + ' ' + y + ')"><rect x="' + (-w / 2) + '" y="-9" width="' + w + '" height="3" rx="1.2" fill="#8a6035"/><path d="M' + (-w / 2 + 3) + ' -6v6M' + (w / 2 - 3) + ' -6v6" stroke="#5e4023" stroke-width="2" stroke-linecap="round"/></g>'; }
  function sleeper(x, y) {
    return bench(x, y, 40) + '<g transform="translate(' + x + ' ' + (y - 10) + ')"><ellipse cx="-2" cy="-1.5" rx="13" ry="3.6" fill="#6aa0e8"/><path d="M-6-1.5q8-4 17 0" fill="none" stroke="#fff" stroke-width=".6" opacity=".5"/><circle cx="-16" cy="-2" r="3.1" fill="#e8b48a"/><path d="M-19-3a3.2 3.2 0 0 1 5.6-1.4c-2 .4-3.8.9-5.6 1.4z" fill="#222"/></g>' +
      '<g fill="#cfe0ff" font-family="system-ui,sans-serif" font-weight="800"><text class="sc-zz" style="--dl:0s" x="' + (x - 14) + '" y="' + (y - 18) + '" font-size="6">z</text><text class="sc-zz" style="--dl:1s" x="' + (x - 10) + '" y="' + (y - 20) + '" font-size="8">z</text><text class="sc-zz" style="--dl:2s" x="' + (x - 5) + '" y="' + (y - 22) + '" font-size="10">Z</text></g>';
  }
  function guitar(x, y) { return '<g transform="translate(' + x + ' ' + y + ') rotate(-28)"><ellipse cx="0" cy="0" rx="4.6" ry="3.6" fill="#c8843a"/><circle cx="0" cy="0" r="1.2" fill="#3a2410"/><path d="M4 -1l9-4" stroke="#6b4423" stroke-width="1.5" stroke-linecap="round"/></g>'; }
  function fire(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')"><ellipse cx="0" cy="0" rx="14" ry="3" fill="#ffb347" opacity=".2"/><path d="M-4 0l8 -2M4 0l-8 -2" stroke="#6b4423" stroke-width="1.6" stroke-linecap="round"/><g class="sc-fire"><path d="M0-2c-4-3-2-6 0-9 1 3 4 4 3 9-1 2-3 2-3 0z" fill="#ff8a1f"/><path d="M0-2c-2-2-1-4 0-6 1 2 2 3 1.4 6z" fill="#ffd84d"/></g></g>';
  }
  function cart(x, y, o) {
    var sd = o.sd || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sd + ' 1)"><path d="M-14-24h28l3 6h-34z" fill="' + o.roof + '"/><path d="M-14-24l3 6M-6-24l1 6M2-24l0 6M10-24l1 6" stroke="#fff" stroke-width=".8" opacity=".35"/>' +
      '<rect x="-13" y="-18" width="26" height="12" rx="1.6" fill="' + (o.body || '#8a5a2b') + '"/><rect x="-11" y="-16" width="9" height="4" rx="1" fill="#fff" opacity=".28"/>' +
      '<circle cx="-8" cy="-3" r="3.4" fill="#2b2b33"/><circle cx="8" cy="-3" r="3.4" fill="#2b2b33"/><circle cx="-8" cy="-3" r="1.1" fill="#9aa0b8"/><circle cx="8" cy="-3" r="1.1" fill="#9aa0b8"/>' +
      (o.lantern ? '<circle cx="12" cy="-20" r="9" fill="#ffe08a" opacity=".22" class="sc-glow"/><circle cx="12" cy="-20" r="2.2" fill="#ffe9a0"/><path d="M12-24v2" stroke="#7a5a2a" stroke-width=".8"/>' : '') +
      (o.steam ? '<g class="sc-steam" style="--dl:0s"><path d="M-4-20q-2-4 0-7t0-5" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/></g><g class="sc-steam" style="--dl:1.2s"><path d="M2-20q-2-4 0-7t0-5" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/></g>' : '') + '</g>';
  }
  function parasol(x, y, c1, c2, s) {
    s = s || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0V-30" stroke="#7a5a2a" stroke-width="1.5" stroke-linecap="round"/><path d="M-17-29a17 12 0 0 1 34 0z" fill="' + c1 + '"/><path d="M-17-29a8.5 12 0 0 1 8.5-5v5zM0-34v5h8.5a8.5 12 0 0 0-8.5-5z" fill="' + c2 + '"/></g>';
  }
  function towel(x, y, c) { return '<rect x="' + (x - 14) + '" y="' + (y - 2) + '" width="28" height="4" rx="1.4" fill="' + c + '"/><path d="M' + (x - 14) + ' ' + (y - .2) + 'h28" stroke="#fff" stroke-width=".7" opacity=".6"/>'; }
  function sandcastle(x, y) { return '<g transform="translate(' + x + ' ' + y + ')"><path d="M-9 0v-6h3v-3h3v3h6v-3h3v3h3v6z" fill="#e8c88e" stroke="#c9a468" stroke-width=".7"/><path d="M0-9v-6" stroke="#6b4423" stroke-width=".8"/><path d="M0-15l5 1.6-5 1.6z" fill="#ff5d5d"/></g>'; }
  function kite(x, y, c, t) {
    return '<g class="sc-kite" style="--dl:' + (t || 0) + 's" transform="translate(' + x + ' ' + y + ')"><path d="M0-8l5 8-5 8-5-8z" fill="' + c + '"/><path d="M0-8v16M-5 0h10" stroke="#fff" stroke-width=".6" opacity=".7"/><path d="M0 8q-3 5 0 9t0 8" fill="none" stroke="' + c + '" stroke-width="1.1" stroke-linecap="round"/></g>';
  }
  function oasis(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')"><ellipse cx="0" cy="0" rx="26" ry="4.4" fill="#3d9fcf"/><ellipse cx="-4" cy="-.6" rx="16" ry="2.2" fill="#7fd0f0" opacity=".8"/><path class="sc-wave" style="--dl:0s" d="M-10 0q3-1.5 6 0t6 0" stroke="#fff" stroke-width=".8" fill="none" opacity=".7"/><path d="M-26 -1c4-3 8-4 12-4M24 -1c-3-3-6-4-10-4" stroke="#bf8f4d" stroke-width="1" fill="none" opacity=".6"/></g>' +
      palm(x - 24, y + 1, .75, 1) + palm(x + 24, y + 1, .85, -1) + '<path d="M' + (x - 14) + ' ' + (y + 1) + 'v-6M' + (x - 12) + ' ' + (y + 1) + 'v-4M' + (x + 12) + ' ' + (y + 1) + 'v-5" stroke="#4b8a4f" stroke-width="1.2" stroke-linecap="round"/>';
  }
  function tumble(t, dl, y) { return '<g class="sc-cloud" style="--t:' + t + 's;--dl:' + dl + 's;--y:' + y + 'px"><g class="sc-roll"><circle r="5" fill="none" stroke="#9a7b4f" stroke-width="1"/><path d="M-5 0q5-4 10 0M-4 3q4-6 8-1M-3-4q4 3 7 1M0-5q-3 5 0 10" fill="none" stroke="#9a7b4f" stroke-width=".8"/></g></g>'; }
  function lizard(x, y) { return '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 0q5-1 9 0t5 2" fill="none" stroke="#7a8c3a" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="-2" cy="-.4" rx="3.2" ry="1.8" fill="#8fa545"/><path d="M1 1l-1 2M6 1l1 2" stroke="#7a8c3a" stroke-width="1" stroke-linecap="round"/></g>'; }
  function heat() { var o = ''; [[100, 78, 0], [220, 82, 1], [330, 76, 2], [420, 84, 3]].forEach(function (w) { o += '<path class="sc-wave" style="--dl:' + (-w[2] * .8) + 's" d="M' + w[0] + ' ' + w[1] + 'q6-2.4 12 0t12 0t12 0" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".38"/>'; }); return o; }

  var SKIN = ['#f1c9a5', '#d9a57e', '#b97f58', '#8d5a3b'];

  var scenes = {
    pagi: function () {
      return sky('#7cc4f2', '#ffe1b8', '#ffc59a') + sun(292, 44, 15, '#ffd24a', '#ffe6a0') +
        cloud(0, 22, 1, 70, -10, '#fff') + cloud(0, 40, .7, 90, -52, '#fff7ea') +
        hills('#9fcf9a', '#7fbf7c') + tree(40, 90, 1.1, '#4f9d5d', '#63b36e') + tree(92, 90, .8, '#4f9d5d', '#63b36e') + tree(404, 90, 1.2, '#4f9d5d', '#63b36e') + tree(452, 90, .85, '#5aa866', '#6fbc79') +
        bird(26, -3, 34, '#5d6b86') + bird(30, -12, 26, '#5d6b86') +
        ground('#e5dccd', '#cfc3ae', '#bfb39b') +
        /* senam pagi di taman kecil */
        '<ellipse cx="176" cy="96" rx="34" ry="3.2" fill="#8cc58a" opacity=".7"/>' +
        person(160, 97, { arms: 'up', dl: 0, shirt: '#ff7a59', pants: '#35435f', skin: SKIN[0], hair: '#2d2a2a' }) + person(176, 97, { arms: 'up', dl: -.5, shirt: '#34c759', pants: '#35435f', skin: SKIN[2], hair: '#1b1b1b' }) + person(192, 97, { arms: 'up', dl: -.2, shirt: '#0a84ff', pants: '#35435f', skin: SKIN[1], hair: '#3a2a1c' }) +
        /* penjual bubur ayam dan pembeli */
        cart(318, 101, { roof: '#ffffff', body: '#c98b45', steam: true }) + person(300, 101, { dir: 1, shirt: '#ffd60a', pants: '#3b4a6b', skin: SKIN[3], hair: '#171717', s: .95 }) + person(338, 101, { dir: -1, arms: 'serve', shirt: '#ff375f', pants: '#2c3a5a', skin: SKIN[1], hair: '#2d2a2a' }) +
        walker({ t: 40, dl: -6, y: 104, shirt: '#ff7a59', pants: '#3b4a6b', skin: SKIN[1], hair: '#2d2a2a' }) +
        walker({ t: 24, dl: -10, y: 108, shirt: '#ff453a', pants: '#1f2a44', skin: SKIN[2], hair: '#171717' }) +
        walker({ t: 58, dl: -22, y: 106, shirt: '#5ac8fa', pants: '#2c3a5a', skin: SKIN[0], hair: '#3a2a1c', s: .74 }) + walker({ t: 58, dl: -24, y: 106, shirt: '#ff9f0a', pants: '#2c3a5a', skin: SKIN[3], hair: '#171717', s: .7 }) +
        walker({ t: 52, dl: -30, y: 110, shirt: '#8e6bff', pants: '#3b4a6b', skin: SKIN[1], hair: '#2d2a2a', dog: 1 }) +
        cyclist({ t: 22, dl: -14, y: 112, frame: '#0a84ff', shirt: '#34c759', skin: SKIN[0], helm: '#ff9f0a' }) +
        cyclist({ t: 30, dl: -3, y: 116, frame: '#ff375f', shirt: '#ffd60a', skin: SKIN[2], helm: '#5ac8fa' });
    },
    siang: function () {
      return sky('#58b4ee', '#bfe3f5', '#fbe7c2') + sun(286, 30, 16, '#fff0a0', '#fff6c8') +
        cloud(0, 22, 1, 90, -24, '#fff') + cloud(0, 44, .6, 120, -80, '#fffaf0') +
        bird(34, -8, 40, '#3a2f2a') + bird(44, -20, 30, '#3a2f2a') + bird(40, -30, 46, '#3a2f2a') +
        pyramid(372, 78, 1, '#d9ac6c', '#bf8f4d') + pyramid(404, 80, .6, '#dcb273', '#c4975a') +
        dunes('#f1cd8a', '#e5b66f', '#c79a52') + heat() +
        cactus(62, 90, 1.2, '#4b8a4f', '#2f6a3a') + cactus(168, 90, .85, '#4b8a4f', '#2f6a3a') + cactus(330, 90, 1, '#4b8a4f', '#2f6a3a') + cactus(446, 90, 1.3, '#4b8a4f', '#2f6a3a') +
        oasis(236, 93) +
        '<path d="M120 100q4-2 8 0M300 98q5-2 9 0M380 102q4-2 8 0" stroke="#c39a58" stroke-width="1" fill="none" opacity=".6"/><ellipse cx="14" cy="92" rx="5" ry="2.4" fill="#b98a4a" opacity=".7"/><path d="M92 99v-7M95 99v-9M98 99v-6" stroke="#6b5a35" stroke-width="1.2" stroke-linecap="round"/>' +
        ground('#ecc888', '#d7ac68', '#c39a58') + lizard(150, 101) +
        tumble(26, -6, 106) +
        camel({ t: 70, dl: -38, y: 100, s: .72, fur: '#d6aa6e', dark: '#b3874b', rug: '#2f7bd9' }) +
        camel({ t: 52, dl: -9, y: 113 });
    },
    sore: function () {
      return sky('#5a4a9e', '#f08a74', '#ffd08a') + sun(284, 60, 17, '#ffd36b', '#ffd9a0') +
        cloud(0, 24, 1, 100, -30, '#ffb9a6') + cloud(0, 42, .75, 120, -76, '#ffd1b0') +
        bird(22, -2, 30, '#5a3a66') + bird(26, -9, 40, '#5a3a66') + bird(30, -16, 24, '#5a3a66') +
        sea('#f09a82', '#3b5a98') + boat(70, 110, -30, '#ff6f61') + boat(62, 190, -60, '#ffd60a').replace('#f4efe6', '#e8e2d6') +
        palm(34, 94, 1.1, 1) + palm(176, 94, .85, -1) + palm(330, 94, .95, 1) + palm(446, 94, 1.15, -1) +
        kite(214, 24, '#ff453a', 0) + kite(238, 30, '#32d4ff', 1.4) +
        ground('#f3dcb8', '#dcc09a', '#c7aa84') +
        /* payung, handuk & orang bersantai */
        parasol(98, 103, '#ff6b57', '#fff', 1) + towel(98, 103, '#32d4ff') + person(92, 102, { sit: true, shirt: '#ff9f0a', pants: '#2c3a5a', skin: SKIN[1], hair: '#2d2a2a' }) + person(106, 102, { sit: true, dir: -1, shirt: '#ff375f', pants: '#2c3a5a', skin: SKIN[0], hair: '#171717' }) +
        /* anak-anak membuat istana pasir */
        sandcastle(150, 104) + person(140, 104, { sit: true, s: .7, shirt: '#34c759', pants: '#2c3a5a', skin: SKIN[2], hair: '#1b1b1b' }) + person(162, 104, { sit: true, dir: -1, s: .7, shirt: '#5ac8fa', pants: '#2c3a5a', skin: SKIN[3], hair: '#171717' }) +
        /* penjual es kelapa */
        parasol(318, 104, '#ffd60a', '#fff', 1.1) + cart(318, 104, { roof: '#2fbf71', body: '#b7793c' }) + person(298, 104, { shirt: '#fff', pants: '#2c3a5a', skin: SKIN[3], hair: '#171717', arms: 'serve', hat: '#ff453a', dir: 1 }) + person(340, 104, { dir: -1, shirt: '#8e6bff', pants: '#26385c', skin: SKIN[1], hair: '#2d2a2a' }) +
        '<g fill="#e8d6a0" stroke="#a98a4f" stroke-width=".6"><circle cx="312" cy="-4" r="0"/></g>' +
        walker({ t: 46, dl: -16, y: 104, shirt: '#ffd60a', pants: '#2f4a7a', skin: SKIN[0], hair: '#2b2020', dog: 1 }) +
        walker({ t: 34, dl: -4, y: 112, shirt: '#ff5d7a', pants: '#26385c', skin: SKIN[3], hair: '#171717', board: '#35c7e8' }) +
        walker({ t: 60, dl: -26, y: 108, shirt: '#34c759', pants: '#26385c', skin: SKIN[1], hair: '#2d2a2a' }) + walker({ t: 60, dl: -28.4, y: 108, shirt: '#ff9f0a', pants: '#26385c', skin: SKIN[0], hair: '#3a2a1c' });
    },
    malam: function () {
      var b = 'bm' + (++uid);
      return sky('#090d24', '#1c1f4f', '#3b2f6b') + stars() + moon(300, 22) +
        skyline() + ground('#2a2f55', '#171a38', '#3d4570') + lamp(70) + lamp(250) + lamp(410) +
        '<defs><linearGradient id="' + b + '" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff2b0" stop-opacity=".55"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/></linearGradient></defs>' +
        /* nongkrong di bangku sambil bermain gitar */
        bench(262, 100, 52) + person(250, 99, { sit: true, shirt: '#7d7bff', pants: '#20244a', skin: SKIN[1], hair: '#171717', bob: 0 }) + person(264, 99, { sit: true, shirt: '#ff6b57', pants: '#20244a', skin: SKIN[0], hair: '#2d2a2a', bob: .7 }) + person(278, 99, { sit: true, dir: -1, shirt: '#34c759', pants: '#20244a', skin: SKIN[2], hair: '#171717', bob: 1.3 }) + guitar(268, 92) +
        /* angkringan dengan lampu pijar */
        cart(334, 104, { roof: '#d9462f', body: '#8a5a2b', lantern: true, steam: true }) + person(316, 104, { sit: true, shirt: '#ffd60a', pants: '#20244a', skin: SKIN[3], hair: '#171717' }) + person(354, 104, { dir: -1, arms: 'serve', shirt: '#e8e8ef', pants: '#20244a', skin: SKIN[1], hair: '#171717' }) +
        /* tidur di bangku */
        sleeper(410, 100) +
        /* api unggun & dua teman */
        fire(150, 104) + person(136, 104, { sit: true, shirt: '#5ac8fa', pants: '#20244a', skin: SKIN[0], hair: '#171717' }) + person(166, 104, { sit: true, dir: -1, shirt: '#ff9f0a', pants: '#20244a', skin: SKIN[2], hair: '#2d2a2a' }) +
        walker({ t: 48, dl: -12, y: 104, shirt: '#7d7bff', pants: '#20244a', skin: SKIN[1], hair: '#171717' }) +
        walker({ t: 64, dl: -30, y: 110, shirt: '#ff5d7a', pants: '#20244a', skin: SKIN[0], hair: '#2d2a2a' }) + walker({ t: 64, dl: -32.2, y: 110, shirt: '#32d4ff', pants: '#20244a', skin: SKIN[3], hair: '#171717' }) +
        moto({ t: 30, dl: -20, y: 108, body: '#32d4ff', shirt: '#ffd60a', skin: SKIN[2], helm: '#ff375f' }) +
        car({ t: 26, dl: -5, y: 118, body: '#ff6b57', glass: '#cfe3ff', beam: b });
    }
  };

  window.DKScenes = function (tod, label) {
    var f = scenes[tod] || scenes.malam;
    return '<svg class="scene sc-wide" viewBox="0 0 480 120" preserveAspectRatio="xMidYMax slice" role="img" aria-label="' + label + '">' + f() + '</svg>';
  };
  window.DKScenes.labels = {
    pagi: 'Pagi hari: matahari terbit, orang berjalan dan bersepeda bolak-balik di trotoar',
    siang: 'Siang hari di gurun pasir: matahari terik, kaktus, unta berjalan dan orang berpayung bolak-balik',
    sore: 'Sore hari di pantai: matahari terbenam di laut, pohon kelapa, perahu, orang berjalan bersama anjing dan membawa papan selancar',
    malam: 'Malam hari: bulan dan bintang, orang berjalan dan mobil melintas bolak-balik di kota'
  };
})();
