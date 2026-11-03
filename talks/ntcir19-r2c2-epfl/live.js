/* live.js -- the slides, live: the page every picture and video of the deck is taken from.
 *
 * live.html (written by tools/build.py) holds every slide's <svg> in a <section class="slide">,
 * in order, then anim.js, this file, and each slide's motion file (slides/NN-name.js), which
 * calls Deck.slide(id, make). Nothing here knows any slide.
 *
 * A slide k (1-based) has an ENTRY (from paper, or from slide k-1's rest when it CONTINUES it),
 * an optional LOOP at rest (starts and ends on the rest), and an EXIT (default: a short fade).
 * The MOVE fw-k, from slide k to k+1, is k's exit then k+1's entry -- or k+1's entry alone when
 * k+1 continues k. ← plays it backwards.
 *
 * The API (window.Live), used by tools/make_media.mjs to capture and by the shell's ?live=1:
 *   Live.info()            [{id, title, part, continues, entry, exit, loop, move}] durations in s
 *   Live.rest(k)           slide k at rest
 *   Live.entry(k, t)       slide k, t s into its entry (from paper)
 *   Live.move(k, j)        the move k -> k+1 at j in [0, 1]
 *   Live.loop(k, t)        slide k's rest loop at t s
 *   Live.play(k, dir, rate)  play the move k -> k+1 (dir 1) or k+1 -> k (dir -1); a promise
 *   Live.playEntry(k, rate), Live.startLoop(k), Live.stopLoop(), Live.speed(rate)
 */
(function (G) {
  "use strict";
  var A = G.Anim, MAKERS = {};
  G.Deck = { slide: function (id, make) { MAKERS[id] = make; } };

  var S = null;                       /* the slides, once built */
  function build() {
    if (S) return S;
    S = [].slice.call(document.querySelectorAll("section.slide")).map(function (sec, i) {
      var id = sec.getAttribute("data-id"), svg = sec.querySelector("svg");
      var q = function (name) { return sec.querySelector('[data-a="' + name + '"]'); };
      q.all = function (name) { return sec.querySelectorAll('[data-a="' + name + '"]'); };
      q.svg = svg; q.root = sec;
      A.fit(sec);                                   /* markers sized to their words, before any motion reads them */
      var m = MAKERS[id] ? MAKERS[id](A, q) || {} : {};
      var body = svg;
      return {
        k: i + 1, id: id, sec: sec, svg: svg,
        title: sec.getAttribute("data-title") || id, part: +(sec.getAttribute("data-part") || 0),
        continues: sec.getAttribute("data-continues") === "1",
        entry: m.entry || A.reveal(body, { dur: 0.45, dy: 0 }),
        exit: m.exit === undefined || m.exit === null ? A.hide(body, { dur: 0.35 }) : m.exit,
        loop: m.loop || null
      };
    });
    return S;
  }
  function only(k) { build().forEach(function (s) { s.sec.style.display = s.k === k ? "" : "none"; }); }
  function at(k) { var s = build()[k - 1]; if (!s) throw new Error("no slide " + k); return s; }

  function rest(k) { var s = at(k); only(k); s.entry.set(s.entry.dur); if (s.loop) s.loop.set(0); }
  function entry(k, t) { var s = at(k); only(k); if (s.loop) s.loop.set(0); s.entry.set(t); }
  function moveDur(k) { var b = at(k + 1); return (b.continues ? 0 : at(k).exit.dur) + b.entry.dur; }
  function move(k, j) {
    var a = at(k), b = at(k + 1), ex = b.continues ? 0 : a.exit.dur, T = j * moveDur(k);
    if (T < ex) { rest(k); a.exit.set(T); return; }
    a.exit.set(0);                                   /* leave k as it rests, for the next visit */
    entry(k + 1, T - ex);
  }
  function loop(k, t) { var s = at(k); if (!s.loop) return rest(k); only(k); s.entry.set(s.entry.dur); s.loop.set(t % s.loop.dur); }

  /* ---- playing, live (the shell's ?live=1) ---- */
  var RATE = 1, cur = null, loopRaf = null;
  function run(dur, fn, rate) {
    return new Promise(function (res) {
      var t0 = performance.now(), u = 0;
      cur = { rate: rate || 1 };
      (function tick(now) {
        u += ((now - t0) / 1000) * cur.rate * RATE / Math.max(dur, 1e-6); t0 = now;
        if (u >= 1) { fn(1); cur = null; return res(); }
        fn(u); requestAnimationFrame(tick);
      })(t0);
    });
  }
  function stopLoop() { if (loopRaf) cancelAnimationFrame(loopRaf); loopRaf = null; }
  function startLoop(k) {
    stopLoop(); var s = at(k); if (!s.loop) return;
    var t0 = performance.now();
    (function tick(now) { loop(k, ((now - t0) / 1000) * RATE); loopRaf = requestAnimationFrame(tick); })(t0);
  }

  G.Live = {
    get n() { return build().length; },
    info: function () { return build().map(function (s, i, all) { return { id: s.id, title: s.title, part: s.part, continues: s.continues,
      entry: +s.entry.dur.toFixed(3), exit: +s.exit.dur.toFixed(3), loop: s.loop ? +s.loop.dur.toFixed(3) : 0,
      move: i + 1 < all.length ? +moveDur(i + 1).toFixed(3) : 0 }; }); },
    rest: rest, entry: entry, move: move, loop: loop, moveDur: moveDur,
    play: function (k, dir, rate) {
      stopLoop();
      var d = moveDur(k);
      return run(d, function (u) { move(k, dir > 0 ? u : 1 - u); }, rate).then(function () { startLoop(dir > 0 ? k + 1 : k); });
    },
    playEntry: function (k, rate) { stopLoop(); var s = at(k); return run(s.entry.dur, function (u) { entry(k, u * s.entry.dur); }, rate).then(function () { startLoop(k); }); },
    startLoop: startLoop, stopLoop: stopLoop,
    speed: function (r) { if (cur) cur.rate = Math.max(cur.rate, r); }
  };
  document.addEventListener("DOMContentLoaded", function () {
    var p = new URLSearchParams(location.search);
    var k = Math.max(1, Math.min(G.Live.n, +(p.get("k") || 1)));
    rest(k);
    if (p.get("capture") !== "1" && p.get("embed") !== "1") startLoop(k);
    document.documentElement.setAttribute("data-ready", "1");
  });
})(window);
