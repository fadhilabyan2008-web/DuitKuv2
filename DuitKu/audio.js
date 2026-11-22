/* DuitKu Audio — musik dan efek suara yang dibuat sepenuhnya dengan Web Audio (tanpa file audio, tanpa pustaka).
   Dipakai oleh Mini Games (Coin Catcher, Money Tycoon) dan DuitKu Wrapped (pemutar + ekspor video).
   Pengaturan suara disimpan per perangkat di localStorage ("duitku_audio"). */
(function () {
  'use strict';
  var KEY = 'duitku_audio';
  var st = { music: true, sfx: true, vol: 0.8 };
  try { var s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0 && typeof s0 === 'object') { if (typeof s0.music === 'boolean') st.music = s0.music; if (typeof s0.sfx === 'boolean') st.sfx = s0.sfx; if (typeof s0.vol === 'number') st.vol = Math.max(0, Math.min(1, s0.vol)); } } catch (e) {}
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  var AC = null, master = null, musicBus = null, sfxBus = null, noiseCache = null;
  var cur = null; // musik yang sedang berjalan

  function mtof(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function limiter(c) {
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    return comp;
  }
  function ctx() {
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { AC = new C(); } catch (e) { return null; }
      master = AC.createGain(); master.gain.value = st.vol;
      var comp = limiter(AC); master.connect(comp); comp.connect(AC.destination);
      musicBus = AC.createGain(); musicBus.gain.value = st.music ? 1 : 0; musicBus.connect(master);
      sfxBus = AC.createGain(); sfxBus.gain.value = st.sfx ? 1 : 0; sfxBus.connect(master);
    }
    if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  function noiseBuf(c) {
    if (noiseCache && noiseCache.c === c) return noiseCache.b;
    var len = c.sampleRate * 1, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseCache = { c: c, b: b };
    return b;
  }

  /* ---------- suara dasar ---------- */
  function env(g, t, a, d, s, r, peak, dur) {
    var sus = Math.max(0.0001, peak * s), end = t + Math.max(dur, a + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(sus, t + a + d);
    g.gain.setValueAtTime(sus, end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + r);
  }
  function tone(c, out, t, f, dur, o) {
    o = o || {};
    var osc = c.createOscillator(), g = c.createGain(), node = osc;
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    if (o.detune) osc.detune.value = o.detune;
    if (o.lp) {
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 0.7;
      lp.frequency.setValueAtTime(o.lp, t);
      if (o.lpEnd) lp.frequency.exponentialRampToValueAtTime(o.lpEnd, t + dur);
      osc.connect(lp); node = lp;
    }
    node.connect(g);
    env(g, t, o.a || 0.005, o.d || 0.08, o.s == null ? 0.5 : o.s, o.r || 0.08, o.v || 0.2, dur);
    g.connect(out);
    osc.start(t); osc.stop(t + dur + (o.r || 0.08) + 0.06);
  }
  function noise(c, out, t, dur, o) {
    o = o || {};
    var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = noiseBuf(c);
    f.type = o.type || 'highpass'; f.frequency.value = o.f || 6000; f.Q.value = o.q || 0.7;
    src.connect(f); f.connect(g); g.connect(out);
    g.gain.setValueAtTime(o.v || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  function kick(c, out, t, v) {
    var osc = c.createOscillator(), g = c.createGain();
    osc.frequency.setValueAtTime(155, t); osc.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    g.gain.setValueAtTime(v || 0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + 0.3);
  }
  function snare(c, out, t, v) {
    noise(c, out, t, 0.16, { type: 'bandpass', f: 1900, q: 0.8, v: v || 0.32 });
    tone(c, out, t, 190, 0.08, { type: 'triangle', v: (v || 0.32) * 0.7, a: 0.002, d: 0.06, s: 0.2, r: 0.04, slide: 120 });
  }
  function clap(c, out, t, v) {
    for (var i = 0; i < 3; i++) noise(c, out, t + i * 0.011, 0.07, { type: 'bandpass', f: 1500, q: 0.9, v: (v || 0.3) * (i === 2 ? 1 : 0.7) });
    noise(c, out, t + 0.033, 0.2, { type: 'bandpass', f: 1300, q: 0.7, v: (v || 0.3) * 0.5 });
  }
  function hat(c, out, t, v, open) { noise(c, out, t, open ? 0.2 : 0.045, { f: open ? 6500 : 8500, v: v || 0.1 }); }
  function chiptick(c, out, t, v) { tone(c, out, t, 90, 0.07, { type: 'square', v: v || 0.4, a: 0.001, d: 0.05, s: 0.2, r: 0.02, slide: 45 }); }

  function makeDelay(c, out, bpm, amount) {
    var d = c.createDelay(1.2), fb = c.createGain(), lp = c.createBiquadFilter(), send = c.createGain();
    d.delayTime.value = Math.min(1.1, 60 / bpm * 0.75); fb.gain.value = 0.32; lp.type = 'lowpass'; lp.frequency.value = 2600;
    send.gain.value = amount == null ? 0.4 : amount;
    send.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(out);
    return send;
  }

  /* ---------- lagu ---------- */
  var TRACKS = {};

  /* Wrapped: pop-dance ceria 118 BPM (C – G – Am – F) */
  (function () {
    var chords = [
      { r: 36, t: [60, 64, 67], lead: [[0, 76, 3], [3, 79, 1], [4, 81, 2], [6, 79, 2], [8, 76, 4], [12, 74, 2], [14, 76, 2]] },
      { r: 43, t: [59, 62, 67], lead: [[0, 74, 3], [3, 79, 1], [4, 83, 2], [6, 79, 2], [8, 74, 4], [12, 71, 2], [14, 74, 2]] },
      { r: 45, t: [60, 64, 69], lead: [[0, 72, 3], [3, 76, 1], [4, 81, 2], [6, 76, 2], [8, 72, 4], [12, 71, 2], [14, 72, 2]] },
      { r: 41, t: [60, 65, 69], lead: [[0, 72, 3], [3, 77, 1], [4, 81, 2], [6, 77, 2], [8, 72, 4], [12, 69, 2], [14, 72, 2]] }
    ];
    var ARP = [0, 1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 1, 0, 2, 1, 2];
    var BASS = { 0: 0, 3: 0, 6: 12, 8: 0, 11: 0, 14: 7 };
    TRACKS.wrapped = {
      bpm: 118, bars: 16, swing: 0,
      layers: function (b) {
        // 0-1 intro, 2-3 bangun, 4-7 penuh, 8-9 jeda, 10-15 penuh + melodi
        return { pad: true, arp: true, hat: true, kick: b >= 2 && !(b >= 8 && b < 10), bass: b >= 2 && !(b >= 8 && b < 10), clap: b >= 4 && !(b >= 8 && b < 10), lead: b >= 4 && !(b >= 8 && b < 10), fill: b === 7 || b === 15, hi: b >= 10 };
      },
      play: function (c, out, fx, b, s, t, sd) {
        var L = this.layers(b), ch = chords[b % 4];
        if (s === 0 && L.pad) ch.t.forEach(function (n, i) { tone(c, out, t, mtof(n - 12), sd * 15, { type: 'sawtooth', lp: 1100, lpEnd: 500, v: 0.035, a: 0.18, d: 0.5, s: 0.7, r: 0.4, detune: (i - 1) * 7 }); });
        if (L.kick && s % 4 === 0) kick(c, out, t, 0.62);
        if (L.clap && (s === 4 || s === 12)) clap(c, out, t, 0.26);
        if (L.fill && s >= 12) snare(c, out, t, 0.12 + (s - 12) * 0.07);
        if (L.hat) { if (s % 4 === 2) hat(c, out, t, 0.1, true); else if (s % 2 === 0 || L.hi) hat(c, out, t, s % 2 ? 0.035 : 0.06); }
        if (L.bass && BASS[s] != null) tone(c, out, t, mtof(ch.r + BASS[s]), sd * 2.6, { type: 'sawtooth', lp: 620, lpEnd: 240, v: 0.23, a: 0.004, d: 0.1, s: 0.55, r: 0.05 });
        if (L.arp) {
          var n = ch.t[ARP[s] % 3] + (ARP[s] >= 2 ? 12 : 0) + (L.hi && s % 4 === 3 ? 12 : 0);
          var v = b < 2 ? 0.05 : 0.075;
          tone(c, out, t, mtof(n + 12), sd * 1.4, { type: 'square', lp: 3800, v: v, a: 0.003, d: 0.05, s: 0.35, r: 0.05 });
          if (fx) tone(c, fx, t, mtof(n + 12), sd * 1.2, { type: 'square', lp: 3000, v: v * 0.6, a: 0.003, d: 0.05, s: 0.3, r: 0.05 });
        }
        if (L.lead) ch.lead.forEach(function (nt) {
          if (nt[0] !== s) return;
          [-9, 9].forEach(function (dt) { tone(c, out, t, mtof(nt[1]), sd * nt[2] * 0.92, { type: 'sawtooth', detune: dt, lp: 5200, v: L.hi ? 0.075 : 0.058, a: 0.008, d: 0.08, s: 0.65, r: 0.14 }); });
          if (fx) tone(c, fx, t, mtof(nt[1]), sd * nt[2] * 0.8, { type: 'triangle', v: 0.06, a: 0.01, d: 0.1, s: 0.5, r: 0.1 });
        });
      }
    };
  })();

  /* Arcade: chiptune cepat 148 BPM (Am – F – C – G) untuk Coin Catcher */
  (function () {
    var chords = [
      { r: 33, a: [69, 72, 76], lead: [[0, 81, 2], [2, 84, 2], [4, 88, 4], [8, 84, 2], [10, 81, 2], [12, 76, 4]] },
      { r: 29, a: [65, 69, 72], lead: [[0, 81, 2], [2, 84, 2], [4, 89, 4], [8, 84, 2], [10, 81, 2], [12, 77, 4]] },
      { r: 36, a: [67, 72, 76], lead: [[0, 84, 2], [2, 88, 2], [4, 91, 4], [8, 88, 2], [10, 84, 2], [12, 79, 4]] },
      { r: 31, a: [67, 71, 74], lead: [[0, 83, 2], [2, 86, 2], [4, 91, 4], [8, 86, 2], [10, 83, 2], [12, 79, 4]] }
    ];
    TRACKS.arcade = {
      bpm: 148, bars: 16, swing: 0,
      layers: function (b) { return { lead: b >= 4, hi: b >= 8, fill: b % 8 === 7 }; },
      play: function (c, out, fx, b, s, t, sd) {
        var L = this.layers(b), ch = chords[b % 4];
        if (s === 0 || s === 6 || s === 8 || s === 14) chiptick(c, out, t, 0.5);
        if (s === 4 || s === 12) noise(c, out, t, 0.09, { type: 'bandpass', f: 2200, q: 0.9, v: 0.2 });
        if (L.fill && s >= 12) noise(c, out, t, 0.05, { type: 'bandpass', f: 2600, q: 0.9, v: 0.16 });
        if (s % 2 === 0) noise(c, out, t, 0.025, { f: 9000, v: 0.05 });
        if (s % 2 === 0) tone(c, out, t, mtof(ch.r + (s % 8 === 4 ? 12 : 0)), sd * 1.8, { type: 'triangle', v: 0.3, a: 0.003, d: 0.08, s: 0.7, r: 0.04 });
        var an = ch.a[s % 3] + (s % 6 >= 3 ? 12 : 0);
        tone(c, out, t, mtof(an), sd * 0.9, { type: 'square', v: 0.045, a: 0.002, d: 0.04, s: 0.4, r: 0.03 });
        if (L.lead) ch.lead.forEach(function (nt) {
          if (nt[0] !== s) return;
          tone(c, out, t, mtof(nt[1]), sd * nt[2] * 0.9, { type: 'square', v: L.hi ? 0.085 : 0.065, a: 0.004, d: 0.06, s: 0.6, r: 0.06, lp: 6000 });
          if (fx) tone(c, fx, t, mtof(nt[1]), sd * nt[2] * 0.7, { type: 'square', v: 0.04, a: 0.004, d: 0.06, s: 0.5, r: 0.06, lp: 4000 });
        });
      }
    };
  })();

  /* City: funk santai bergoyang 102 BPM (G – Em – C – D) untuk Money Tycoon */
  (function () {
    var chords = [
      { r: 43, t: [55, 59, 62, 66], m: [[0, 79, 2], [3, 83, 1], [6, 86, 2], [10, 83, 2]] },
      { r: 40, t: [52, 59, 62, 67], m: [[0, 76, 2], [3, 79, 1], [6, 83, 2], [10, 79, 2]] },
      { r: 36, t: [55, 60, 64, 67], m: [[0, 79, 2], [3, 84, 1], [6, 88, 2], [10, 84, 2]] },
      { r: 38, t: [57, 60, 62, 66], m: [[0, 78, 2], [3, 81, 1], [6, 86, 2], [10, 81, 2]] }
    ];
    var BASS = { 0: 0, 3: 12, 6: 0, 8: 7, 11: 0, 14: 12 };
    TRACKS.city = {
      bpm: 102, bars: 16, swing: 0.2,
      layers: function (b) { return { mel: b >= 4 && b % 8 >= 4, hi: b >= 8 }; },
      play: function (c, out, fx, b, s, t, sd) {
        var L = this.layers(b), ch = chords[b % 4];
        if (s === 0 || s === 7 || (s === 10 && b % 2)) kick(c, out, t, 0.42);
        if (s === 4 || s === 12) snare(c, out, t, 0.2);
        if (s % 2 === 0) hat(c, out, t, s % 4 === 2 ? 0.07 : 0.045, false);
        if (L.hi && s % 2 === 1) noise(c, out, t, 0.03, { f: 9500, v: 0.035 });
        if (BASS[s] != null) tone(c, out, t, mtof(ch.r + BASS[s]), sd * 1.9, { type: 'triangle', v: 0.3, a: 0.004, d: 0.09, s: 0.6, r: 0.05, lp: 900 });
        if (s === 2 || s === 6 || s === 10 || s === 13) ch.t.forEach(function (n) {
          tone(c, out, t, mtof(n), sd * 2.4, { type: 'triangle', v: 0.04, a: 0.004, d: 0.18, s: 0.15, r: 0.15 });
          tone(c, out, t, mtof(n + 12), sd * 1.6, { type: 'sine', v: 0.025, a: 0.004, d: 0.14, s: 0.1, r: 0.12 });
        });
        if (L.mel) ch.m.forEach(function (nt) {
          if (nt[0] !== s) return;
          tone(c, out, t, mtof(nt[1]), sd * 3, { type: 'sine', v: 0.11, a: 0.003, d: 0.22, s: 0.08, r: 0.2 });
          tone(c, out, t, mtof(nt[1] + 12), sd * 2, { type: 'sine', v: 0.03, a: 0.003, d: 0.12, s: 0.05, r: 0.1 });
          if (fx) tone(c, fx, t, mtof(nt[1]), sd * 2, { type: 'sine', v: 0.08, a: 0.003, d: 0.2, s: 0.05, r: 0.15 });
        });
      }
    };
  })();

  /* Santai (lo-fi) 84 BPM: piano listrik lembut, ketukan bergoyang (Fmaj7 – Em7 – Dm7 – Cmaj7) */
  (function () {
    var chords = [
      { r: 41, t: [53, 57, 60, 64], m: [[0, 76, 3], [6, 72, 2], [10, 69, 3]] },
      { r: 40, t: [52, 55, 59, 62], m: [[0, 74, 3], [6, 71, 2], [10, 67, 3]] },
      { r: 38, t: [50, 53, 57, 60], m: [[0, 72, 3], [6, 69, 2], [10, 65, 3]] },
      { r: 36, t: [48, 52, 55, 59], m: [[0, 71, 3], [6, 67, 2], [10, 76, 3]] }
    ];
    TRACKS.wlofi = {
      bpm: 84, bars: 16, swing: 0.22,
      layers: function (b) { return { beat: b >= 1, mel: b >= 4 && b % 8 >= 2, hi: b >= 8 }; },
      play: function (c, out, fx, b, s, t, sd) {
        var L = this.layers(b), ch = chords[b % 4];
        if (L.beat && (s === 0 || s === 10)) kick(c, out, t, 0.34);
        if (L.beat && (s === 4 || s === 12)) { noise(c, out, t, 0.12, { type: 'bandpass', f: 1800, q: 0.8, v: 0.14 }); }
        if (L.beat && s % 2 === 0) hat(c, out, t, s % 4 === 2 ? 0.055 : 0.032, false);
        if (s === 0 || s === 3 || s === 8 || s === 11) {
          ch.t.forEach(function (n, i) {
            tone(c, out, t, mtof(n + 12), sd * (s === 0 ? 5 : 2.2), { type: 'triangle', v: 0.05, a: 0.006, d: 0.35, s: 0.18, r: 0.25, detune: (i - 1.5) * 4 });
            tone(c, out, t, mtof(n), sd * 3, { type: 'sine', v: 0.04, a: 0.006, d: 0.3, s: 0.2, r: 0.2 });
          });
        }
        if (s === 0 || s === 6 || s === 8 || s === 14) tone(c, out, t, mtof(ch.r), sd * 2.4, { type: 'sine', v: 0.32, a: 0.005, d: 0.12, s: 0.6, r: 0.08 });
        if (L.mel) ch.m.forEach(function (nt) {
          if (nt[0] !== s) return;
          tone(c, out, t, mtof(nt[1]), sd * nt[2], { type: 'sine', v: 0.1, a: 0.004, d: 0.3, s: 0.12, r: 0.3 });
          tone(c, out, t, mtof(nt[1] + 12), sd * 1.5, { type: 'sine', v: 0.025, a: 0.004, d: 0.2, s: 0.05, r: 0.2 });
          if (fx) tone(c, fx, t, mtof(nt[1]), sd * 2, { type: 'sine', v: 0.07, a: 0.004, d: 0.25, s: 0.05, r: 0.2 });
        });
        if (s % 4 === 1 && L.hi) noise(c, out, t, 0.02, { f: 7000, v: 0.02 });
      }
    };
  })();

  /* Megah (sinematik) 96 BPM: string, denyut bas dan tabuh yang menanjak (Am – F – C – G) */
  (function () {
    var chords = [
      { r: 33, t: [57, 60, 64], m: [[0, 81, 4], [6, 84, 2], [8, 88, 6]] },
      { r: 29, t: [57, 60, 65], m: [[0, 84, 4], [6, 81, 2], [8, 89, 6]] },
      { r: 36, t: [55, 60, 64], m: [[0, 84, 4], [6, 79, 2], [8, 88, 6]] },
      { r: 31, t: [55, 59, 62], m: [[0, 83, 4], [6, 79, 2], [8, 86, 6]] }
    ];
    TRACKS.wcine = {
      bpm: 96, bars: 16, swing: 0,
      layers: function (b) { return { drum: b >= 3, mel: b >= 4, hi: b >= 8, roll: b === 7 || b === 15 }; },
      play: function (c, out, fx, b, s, t, sd) {
        var L = this.layers(b), ch = chords[b % 4];
        if (s === 0) ch.t.forEach(function (n, i) {
          tone(c, out, t, mtof(n), sd * 15.5, { type: 'sawtooth', lp: L.hi ? 2200 : 1300, lpEnd: 600, v: 0.04, a: 0.9, d: 1.2, s: 0.75, r: 0.6, detune: (i - 1) * 9 });
          tone(c, out, t, mtof(n - 12), sd * 15.5, { type: 'triangle', v: 0.05, a: 0.7, d: 1, s: 0.8, r: 0.5 });
        });
        if (s % 2 === 0) tone(c, out, t, mtof(ch.r), sd * 1.7, { type: 'triangle', v: L.drum ? 0.26 : 0.14, a: 0.004, d: 0.1, s: 0.55, r: 0.05, lp: 700 });
        if (L.drum && (s === 0 || s === 8)) tone(c, out, t, 120, 0.3, { type: 'sine', v: 0.6, a: 0.002, d: 0.2, s: 0.1, r: 0.1, slide: 38 });
        if (L.drum && L.hi && s === 10) tone(c, out, t, 120, 0.3, { type: 'sine', v: 0.45, a: 0.002, d: 0.2, s: 0.1, r: 0.1, slide: 38 });
        if (L.drum && (s === 4 || s === 12)) clap(c, out, t, 0.18);
        if (L.hi && s % 2 === 0) hat(c, out, t, 0.045, false);
        if (L.roll && s >= 8) snare(c, out, t, 0.06 + (s - 8) * 0.035);
        if (L.mel) ch.m.forEach(function (nt) {
          if (nt[0] !== s) return;
          tone(c, out, t, mtof(nt[1]), sd * nt[2], { type: 'triangle', v: L.hi ? 0.1 : 0.07, a: 0.02, d: 0.2, s: 0.6, r: 0.3 });
          tone(c, out, t, mtof(nt[1]), sd * nt[2], { type: 'sine', v: 0.05, a: 0.02, d: 0.2, s: 0.5, r: 0.3, detune: 7 });
          if (fx) tone(c, fx, t, mtof(nt[1]), sd * nt[2], { type: 'sine', v: 0.07, a: 0.02, d: 0.2, s: 0.4, r: 0.3 });
        });
        if (b >= 2 && s % 4 === 2) tone(c, out, t, mtof(ch.t[(s >> 2) % 3] + 24), sd * 1.2, { type: 'sine', v: 0.04, a: 0.003, d: 0.2, s: 0.1, r: 0.2 });
      }
    };
  })();

  function stepTime(tr, g) { var sd = 60 / tr.bpm / 4; return g * sd + (g % 2 === 1 ? tr.swing * sd : 0); }

  function startMusic(name, opts) {
    opts = opts || {};
    var tr = TRACKS[name]; if (!tr) return;
    if (cur && cur.name === name) { return; }
    stopMusic(true);
    var c = ctx(); if (!c) return;
    var out = c.createGain(); out.gain.setValueAtTime(0.0001, c.currentTime); out.gain.linearRampToValueAtTime(opts.vol == null ? 0.9 : opts.vol, c.currentTime + 0.6);
    out.connect(musicBus); if (tap) { try { out.connect(tap); } catch (e) {} }
    var fx = makeDelay(c, out, tr.bpm, 0.5);
    var sd = 60 / tr.bpm / 4, t0 = c.currentTime + 0.1, g = 0;
    var m = { name: name, out: out, fx: fx, timer: 0 };
    function pump() {
      var now = c.currentTime;
      while (t0 + stepTime(tr, g) < now + 0.3) {
        var t = t0 + stepTime(tr, g), bar = Math.floor(g / 16);
        try { tr.play(c, out, fx, bar % tr.bars, g % 16, t, sd); } catch (e) {}
        g++;
      }
    }
    pump();
    m.timer = setInterval(pump, 50);
    cur = m;
  }
  var tap = null;
  /* aliran audio lagu (untuk direkam ke video): tetap terekam walau musik di aplikasi dimatikan */
  function musicStream(name) {
    var c = ctx(); if (!c || !c.createMediaStreamDestination || !TRACKS[name]) return null;
    stopMusic(true);
    var d = c.createMediaStreamDestination(); tap = d;
    startMusic(name, { vol: 0.9 });
    return { stream: d.stream, stop: function (sec) { stopMusic(sec > 0.5 ? false : true); setTimeout(function () { try { d.disconnect(); } catch (e) {} if (tap === d) tap = null; }, 1100); } };
  }
  function stopMusic(quick) {
    if (!cur) return;
    var m = cur; cur = null; clearInterval(m.timer);
    try {
      var c = AC, t = c.currentTime;
      m.out.gain.cancelScheduledValues(t); m.out.gain.setValueAtTime(Math.max(0.0001, m.out.gain.value), t);
      m.out.gain.linearRampToValueAtTime(0.0001, t + (quick ? 0.08 : 0.5));
      setTimeout(function () { try { m.out.disconnect(); m.fx.disconnect(); } catch (e) {} }, quick ? 200 : 800);
    } catch (e) {}
  }

  /* Render lagu ke AudioBuffer (untuk ekspor video Wrapped): hasil identik, tanpa bergantung pada kinerja layar */
  function render(name, seconds, opts) {
    opts = opts || {};
    var tr = TRACKS[name], OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!tr || !OC) return Promise.reject(new Error('audio tidak didukung'));
    var sr = 44100, c = new OC(2, Math.ceil(sr * (seconds + 1.2)), sr);
    var master2 = c.createGain(); master2.gain.value = 0.9;
    var fade = Math.min(2.4, seconds / 3);
    master2.gain.setValueAtTime(0.9, Math.max(0, seconds - fade)); master2.gain.linearRampToValueAtTime(0.0001, seconds);
    var comp = limiter(c); master2.connect(comp); comp.connect(c.destination);
    var out = c.createGain(); out.gain.value = 1; out.connect(master2);
    var fx = makeDelay(c, out, tr.bpm, 0.5), sd = 60 / tr.bpm / 4, g = 0;
    var start = opts.from || 0;
    while (true) {
      var t = stepTime(tr, g) - start; if (t > seconds) break;
      if (t >= -0.01) { try { tr.play(c, out, fx, Math.floor(g / 16) % tr.bars, g % 16, Math.max(0, t), sd); } catch (e) {} }
      g++;
    }
    return c.startRendering();
  }

  /* ---------- efek suara ---------- */
  var SFX = {
    click: function (c, o, t) { tone(c, o, t, 880, 0.05, { type: 'triangle', v: 0.12, a: 0.002, d: 0.03, s: 0.2, r: 0.02 }); },
    coin: function (c, o, t) { tone(c, o, t, 988, 0.07, { type: 'square', v: 0.07, a: 0.002, d: 0.04, s: 0.5, r: 0.03, lp: 6000 }); tone(c, o, t + 0.06, 1319, 0.16, { type: 'square', v: 0.07, a: 0.002, d: 0.1, s: 0.3, r: 0.08, lp: 6000 }); },
    gold: function (c, o, t) { [784, 988, 1175, 1568].forEach(function (f, i) { tone(c, o, t + i * 0.055, f, 0.13, { type: 'triangle', v: 0.14, a: 0.002, d: 0.08, s: 0.3, r: 0.08 }); }); },
    bill: function (c, o, t) { tone(c, o, t, 220, 0.3, { type: 'sawtooth', v: 0.16, a: 0.005, d: 0.2, s: 0.3, r: 0.1, slide: 70, lp: 1200 }); noise(c, o, t, 0.15, { type: 'lowpass', f: 700, v: 0.15 }); },
    heart: function (c, o, t) { [523, 659, 784].forEach(function (f, i) { tone(c, o, t + i * 0.09, f, 0.2, { type: 'sine', v: 0.16, a: 0.004, d: 0.15, s: 0.3, r: 0.1 }); }); },
    power: function (c, o, t) { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(c, o, t + i * 0.05, f, 0.12, { type: 'square', v: 0.07, a: 0.002, d: 0.08, s: 0.4, r: 0.05, lp: 5000 }); }); },
    level: function (c, o, t) { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(c, o, t + i * 0.08, f, 0.22, { type: 'triangle', v: 0.17, a: 0.004, d: 0.14, s: 0.4, r: 0.12 }); }); tone(c, o, t + 0.4, 1568, 0.5, { type: 'sine', v: 0.1, a: 0.01, d: 0.3, s: 0.3, r: 0.25 }); },
    over: function (c, o, t) { [392, 330, 262, 196].forEach(function (f, i) { tone(c, o, t + i * 0.16, f, 0.3, { type: 'triangle', v: 0.18, a: 0.01, d: 0.2, s: 0.4, r: 0.12 }); }); },
    build: function (c, o, t) { for (var i = 0; i < 3; i++) { noise(c, o, t + i * 0.11, 0.07, { type: 'bandpass', f: 900, q: 1.2, v: 0.3 }); tone(c, o, t + i * 0.11, 150, 0.08, { type: 'square', v: 0.14, a: 0.001, d: 0.05, s: 0.2, r: 0.02, slide: 80 }); } [659, 880, 1175].forEach(function (f, i) { tone(c, o, t + 0.36 + i * 0.07, f, 0.18, { type: 'triangle', v: 0.13, a: 0.003, d: 0.1, s: 0.3, r: 0.1 }); }); },
    upgrade: function (c, o, t) { [523, 659, 784, 1047].forEach(function (f, i) { tone(c, o, t + i * 0.06, f, 0.14, { type: 'square', v: 0.07, a: 0.002, d: 0.08, s: 0.4, r: 0.06, lp: 5000 }); }); },
    cash: function (c, o, t) { tone(c, o, t, 1568, 0.1, { type: 'triangle', v: 0.14, a: 0.001, d: 0.07, s: 0.3, r: 0.1 }); tone(c, o, t + 0.07, 2093, 0.3, { type: 'sine', v: 0.12, a: 0.001, d: 0.2, s: 0.2, r: 0.18 }); noise(c, o, t, 0.04, { f: 7000, v: 0.08 }); },
    ach: function (c, o, t) { [523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tone(c, o, t + i * 0.08, f, i === 5 ? 0.5 : 0.14, { type: 'triangle', v: 0.17, a: 0.004, d: 0.1, s: 0.5, r: 0.15 }); }); },
    error: function (c, o, t) { tone(c, o, t, 196, 0.09, { type: 'square', v: 0.08, a: 0.002, d: 0.06, s: 0.4, r: 0.03, lp: 1500 }); tone(c, o, t + 0.1, 165, 0.12, { type: 'square', v: 0.08, a: 0.002, d: 0.08, s: 0.4, r: 0.04, lp: 1500 }); },
    whoosh: function (c, o, t) { noise(c, o, t, 0.25, { type: 'bandpass', f: 1400, q: 0.6, v: 0.12 }); },
    pop: function (c, o, t) { tone(c, o, t, 520, 0.09, { type: 'sine', v: 0.15, a: 0.002, d: 0.06, s: 0.2, r: 0.04, slide: 900 }); },
    tap: function (c, o, t) { tone(c, o, t, 1500, 0.03, { type: 'triangle', v: 0.07, a: 0.001, d: 0.02, s: 0.2, r: 0.02 }); },
    sparkle: function (c, o, t) { [1568, 2093, 2637, 3136].forEach(function (f, i) { tone(c, o, t + i * 0.045, f, 0.1, { type: 'sine', v: 0.08, a: 0.002, d: 0.07, s: 0.2, r: 0.07 }); }); },
    tick: function (c, o, t) { tone(c, o, t, 660, 0.08, { type: 'triangle', v: 0.16, a: 0.002, d: 0.05, s: 0.3, r: 0.04 }); },
    go: function (c, o, t) { tone(c, o, t, 1047, 0.22, { type: 'triangle', v: 0.2, a: 0.002, d: 0.12, s: 0.4, r: 0.1 }); tone(c, o, t, 1568, 0.22, { type: 'sine', v: 0.08, a: 0.002, d: 0.12, s: 0.3, r: 0.1 }); },
    unlock: function (c, o, t) { noise(c, o, t, 0.12, { type: 'lowpass', f: 900, v: 0.14 }); tone(c, o, t + 0.05, 330, 0.18, { type: 'triangle', v: 0.12, a: 0.004, d: 0.12, s: 0.3, r: 0.08, slide: 520 }); }
  };
  var lastSfx = {};
  function sfx(name, vol) {
    if (!st.sfx) return;
    var f = SFX[name]; if (!f) return;
    var now = performance.now(); if (lastSfx[name] && now - lastSfx[name] < 35) return; lastSfx[name] = now;
    var c = ctx(); if (!c) return;
    try {
      var g = c.createGain(); g.gain.value = vol == null ? 1 : vol; g.connect(sfxBus);
      f(c, g, c.currentTime + 0.005);
      setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 1600);
    } catch (e) {}
  }

  function apply() {
    if (!AC) return;
    var t = AC.currentTime;
    musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(st.music ? 1 : 0, t, 0.05);
    sfxBus.gain.cancelScheduledValues(t); sfxBus.gain.setTargetAtTime(st.sfx ? 1 : 0, t, 0.05);
    master.gain.setTargetAtTime(st.vol, t, 0.05);
  }
  function toggle(k) { st[k] = !st[k]; persist(); apply(); return st[k]; }

  document.addEventListener('visibilitychange', function () {
    if (!AC) return;
    if (document.hidden) { try { AC.suspend(); } catch (e) {} } else if (cur) { try { AC.resume(); } catch (e) {} }
  });

  window.DKAudio = {
    state: function () { return { music: st.music, sfx: st.sfx, vol: st.vol }; },
    toggle: toggle,
    setVolume: function (v) { st.vol = Math.max(0, Math.min(1, v)); persist(); apply(); },
    unlock: function () { ctx(); },
    play: startMusic, stop: stopMusic, musicStream: musicStream, sfx: sfx, render: render,
    playing: function () { return cur ? cur.name : null; },
    tracks: function () { return Object.keys(TRACKS); }
  };
})();
