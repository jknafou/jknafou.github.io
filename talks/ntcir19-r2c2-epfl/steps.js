/* steps.js -- a slide's STEPS OF ATTENTION: the shared helpers that make them, and the runtime that plays them.
 *
 * The rule (PLAN.md, "A slide is an overview, then steps of attention"; the author, 4 November 2026): arriving
 * on a slide, its entry brings the whole design in (the OVERVIEW, step 0); then each → is one step of attention
 * on one part, in reading order, until every part has had one; only then does → leave the slide. A step draws
 * attention by three means only, alone or together:
 *   (a) opacity    A.focus(parts, {from, to, dim, dur})   the part in focus fully opaque, the others at `dim`
 *                  A.unfocus(parts, {from, dim, dur})     back to the overview: every part opaque
 *   (b) animation  only the focus moves, in the step's LOOP (starting and ending on its rest), built from the bank's
 *                  motions in ROUNDS: A.cycle(r1, r2, ...) plays self-contained rounds one after another (only the
 *                  current one is set); A.hold(track, dur, t) keeps a track at its state t (default its end) for dur;
 *                  A.fillTo(bar, {frac, shown, value, dur}) is A.fill settling on another value than the drawn one;
 *                  A.become(token, {to, from, dur}) turns a token over into what it now carries (Q into A, a tool call)
 *   (c) zoom       A.zoom(svg, {from, to, pad, dur})      the camera closes on a part (A.camera, onto the 16:9 frame
 *                                                         around an element, or a frame [x, y, w, h])
 * `from` / `to` of A.focus are the index (or indexes) in `parts` of the focus, null for the overview. Each is a
 * pure track, as every motion of anim.js is. A step may also TRANSFORM its part in place (slide 2's one row becoming
 * each use case): A.reverse(track), A.recount(el, {from, to}), A.gaugeTo(bar, {from, to, value}) and
 * A.nodot(track, el) (lines drawn without a round cap's dot at their start), below.
 *
 * A slide declares its steps in its motion file, beside its entry and loop:
 *   Deck.slide("02-...", function (A, q) {
 *     return { entry: ..., loop: ...,                     // the overview's entry and (optional) idle
 *              steps: [ { enter: <track, <= ~0.8 s, from the previous step's rest to this one's>,
 *                         loop: <track, optional: this step's resting motion, starting and ending on its rest> },
 *                       ... ] };
 *   });
 * Step s's rest is the overview's rest, then the enters of steps 1..s played to their ends, in order (one
 * timeline, A.seq(entry, enter 1, ..., enter n), so any step is reached exactly from any other, both ways).
 *
 * Why its own file: anim.js and live.js are inside the hash of every validated slide (slides/VALIDATED.json, the
 * author's validation; tools/build.py's vhash), so a line added there would un-validate slide 1, which has no
 * steps. This file is in the hash of each slide that uses it (its motion file declares `steps:` or calls a helper
 * above), and of none other. It extends anim.js's bank (A) and live.js's API (window.Live) without changing them:
 *   Live.steps(k)              how many steps slide k has (0: none)
 *   Live.step(k, s)            slide k at the rest of step s (s = 0: the overview, as Live.rest(k))
 *   Live.stepEnter(k, s, t)    t s into step s's enter (from step s-1's rest)
 *   Live.stepLoop(k, s, t)     step s's loop at t s (its rest when it has none)
 *   Live.startLoop(k, s)       plays the idle of slide k at step s (s = 0 or none: the slide's own loop)
 *   Live.info()                each slide also gets steps: [{enter, loop}] (durations in s)
 * Live.rest, Live.entry and Live.loop put a slide with steps back on its overview first, so its steps never leak
 * into its entry or its stills.
 */
(function (G) {
  "use strict";
  var A = G.Anim;
  var lst = function (x) { return !x ? [] : x.length != null && !x.tagName ? [].slice.call(x) : [x]; };
  var has = function (f, i) { return f == null ? false : typeof f === "number" ? f === i : [].slice.call(f).indexOf(i) >= 0; };   /* an index, or several */

  /* ---- (a) opacity: the focus opaque, the rest partly transparent ---- */
  A.focus = function (parts, o) {
    o = o || {};
    var P = lst(parts), dim = o.dim == null ? 0.3 : o.dim, E = o.ease || A.ease.io;
    if (!P.length || P.some(function (p) { return !p; })) throw new Error("A.focus: a part has no element (check the data-a names)");
    var level = function (f, i) { return f == null ? 1 : has(f, i) ? 1 : dim; };    /* null: the overview, all opaque */
    return A.track(o.dur == null ? 0.6 : o.dur, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : E(u);
      P.forEach(function (n, i) {
        var a = level(o.from, i), b = level(o.to, i), v = a + (b - a) * e;
        n.style.opacity = v >= 0.9999 ? "" : v.toFixed(4);
      });
    });
  };
  A.unfocus = function (parts, o) { o = o || {}; return A.focus(parts, { from: o.from, to: null, dim: o.dim, dur: o.dur, ease: o.ease }); };

  /* ---- (b) animation: only the focus moves. Its loop is made of ROUNDS, each a self-contained track (it sets
   * everything it touches at every moment), played one after another by A.cycle; A.hold keeps a track at one of its
   * states for a while; A.fillTo is A.fill (the bank's gauge, hunting and settling) settling on another value than
   * the one drawn, so each round can read a different confidence ---- */
  A.cycle = function () {                                 /* rounds one after another, only the current one set */
    var R = [].slice.call(arguments).filter(Boolean), at = [], o = 0;
    R.forEach(function (r) { at.push(o); o += r.dur; });
    return { dur: o, set: function (t) {
      var i = 0; while (i < R.length - 1 && t >= at[i + 1]) i++;
      R[i].set(Math.max(0, Math.min(R[i].dur, t - at[i])));
    } };
  };
  A.hold = function (tr, dur, t) { return A.track(dur, function () { tr.set(t == null ? tr.dur : t); }); };
  A.fillTo = function (bar, o) {
    o = o || {};
    var full = parseFloat(bar.getAttribute("data-full")), min = parseFloat(bar.getAttribute("height")) || 0, val = o.value || null;
    var f0 = bar.getAttribute("data-frac"), w0 = bar._w0 != null ? bar._w0 : bar.getAttribute("width");
    var v0 = val ? (val._full != null ? val._full : val.textContent) : null;
    bar.setAttribute("data-frac", String(o.frac)); bar._w0 = Math.max(min, full * o.frac).toFixed(2);   /* A.fill reads these once */
    if (val) val._full = o.shown != null ? String(o.shown) : String(Math.round(o.frac * 100));
    var tr = A.fill(bar, { dur: o.dur, value: val });
    bar.setAttribute("data-frac", f0); bar._w0 = w0; if (val) val._full = v0;           /* the drawn gauge as it was */
    return tr;
  };

  /* ---- a step that TRANSFORMS its part rather than focusing it (slide 2: one row becoming each use case in turn).
   * A.reverse(track)                 the track played backwards: words un-keyed, lines undrawn
   * A.recount(el, {from, to, dur})   the first number of a <text> counted from one value to another, the words
   *                                  round it kept ("≥ 70" to "≥ 90"); `dec` decimals (default 0)
   * A.gaugeTo(bar, {from, to, value, dur})   an answer card's gauge moved from one fraction to another, smoothly,
   *                                  its number (`value`) following, as a percentage; not A.fillTo's hunting
   * A.nodot(track, el)               a track that draws el's lines (A.draw, A.flow, A.enter) without the dot a
   *                                  round cap shows while a line has no length yet: each path of el hidden until
   *                                  its drawn part is longer than its stroke is wide
   * ---- */
  A.reverse = function (tr) { return { dur: tr.dur, set: function (t) { tr.set(tr.dur - t); } }; };
  A.recount = function (el, o) {
    var T = lst(el)[0]; if (!T) throw new Error("A.recount: no element");
    var s0 = T.textContent, m = s0.match(/\d+(\.\d+)?/);
    if (!m) throw new Error("A.recount: no number in " + JSON.stringify(s0));
    var pre = s0.slice(0, m.index), post = s0.slice(m.index + m[0].length), E = o.ease || A.ease.io, dec = o.dec || 0;
    return A.track(o.dur == null ? 0.7 : o.dur, function (u) {
      T.textContent = pre + (o.from + (o.to - o.from) * E(u)).toFixed(dec) + post;
    });
  };
  A.gaugeTo = function (bar, o) {
    var full = parseFloat(bar.getAttribute("data-full")), min = parseFloat(bar.getAttribute("height")) || 0;
    var val = o.value || null, E = o.ease || A.ease.io;
    if (!(full > 0)) throw new Error("A.gaugeTo: the bar has no data-full (answer_card's gauge)");
    return A.track(o.dur == null ? 0.7 : o.dur, function (u) {
      var x = o.from + (o.to - o.from) * E(u);
      bar.setAttribute("width", Math.max(min, full * x).toFixed(2)); bar.style.opacity = "";
      if (val) { val.textContent = String(Math.round(x * 100)); val.style.opacity = ""; }
    });
  };
  A.nodot = function (tr, el) {
    var P = lst(el).reduce(function (a, n) { return a.concat(/^path$/i.test(n.tagName) ? [n] : [].slice.call(n.querySelectorAll("path"))); }, []);
    var SWs = P.map(function (p) { return parseFloat(p.getAttribute("stroke-width")) || 3.5; });
    var Ls = P.map(function (p) { return p.getTotalLength(); });
    return { dur: tr.dur, set: function (t) {
      tr.set(t);
      P.forEach(function (p, i) {                       /* anim.js's drawTo dash: drawn = L - offset; at rest it clears both */
        if (!p.style.strokeDasharray) return;
        if (Ls[i] - (parseFloat(p.style.strokeDashoffset) || 0) < SWs[i]) p.style.opacity = "0";
      });
    } };
  };

  /* ---- become: the token turns over into what it now carries (concepts/question_token.py, carries=("Q", "A")):
   * a coin turning, its width to nothing and back, the face swapped at the edge, as it leaves a box. `to` is the
   * face it ends on, `from` the face it starts on (default: the one shown in the markup). Pure: at 0 it is `from`,
   * at its end `to`, flat on both ---- */
  A.become = function (token, o) {
    o = o || {};
    var T = lst(token)[0], flip = T && T.querySelector("[data-flip]"), F = T ? [].slice.call(T.querySelectorAll("[data-face]")) : [];
    if (!flip || !F.length) throw new Error("A.become: the token has no faces (question_token carries=[...])");
    var face = function (k) { var f = F.filter(function (x) { return x.getAttribute("data-face") === k; })[0]; if (!f) throw new Error("A.become: no face " + k); return f; };
    var from = face(o.from || F.filter(function (x) { return x.style.display !== "none"; })[0].getAttribute("data-face")), to = face(o.to);
    flip.style.transformBox = "fill-box"; flip.style.transformOrigin = "center";
    return A.track(o.dur == null ? 0.4 : o.dur, function (u) {
      var on = u < 0.5 ? from : to, sx = Math.abs(Math.cos(Math.PI * u));
      F.forEach(function (f) { f.style.display = f === on ? "" : "none"; });
      flip.style.scale = u <= 0 || u >= 1 ? "" : Math.max(0.001, sx).toFixed(4) + " 1";
    });
  };

  /* ---- (c) zoom: the camera onto the 16:9 frame around a part (measured once, at rest, when defined) ---- */
  A.frameOf = function (el, pad) {
    var svg = el.ownerSVGElement || el, r = el.getBoundingClientRect(), s = svg.getBoundingClientRect();
    var k = A.VB[2] / (s.width || 1), p = pad == null ? 0.08 : pad;
    var x = (r.left - s.left) * k + A.VB[0], y = (r.top - s.top) * k + A.VB[1], w = r.width * k, h = r.height * k;
    var W = Math.max(w * (1 + 2 * p), h * (1 + 2 * p) * A.VB[2] / A.VB[3]), H = W * A.VB[3] / A.VB[2];
    return [x + w / 2 - W / 2, y + h / 2 - H / 2, W, H];
  };
  A.zoom = function (svg, o) {
    o = o || {};
    var f = function (v) { return !v ? A.VB.slice() : v.length === 4 && typeof v[0] === "number" ? v : A.frameOf(v, o.pad); };
    return A.camera(svg, f(o.from), f(o.to), { dur: o.dur == null ? 0.8 : o.dur, ease: o.ease });
  };

  /* ---- the runtime ---- */
  var L = G.Live, D = G.Deck;
  if (!L || !D) return;                                   /* the specimen page: the helpers alone */
  var ST = {}, reg = D.slide;
  D.slide = function (id, make) {
    reg(id, function (A_, q) {
      var m = make(A_, q) || {};
      var steps = (m.steps || []).filter(Boolean);
      if (steps.length) {
        var off = [0];
        steps.forEach(function (s, i) {
          if (!s.enter) throw new Error(id + ": step " + (i + 1) + " has no enter");
          off.push(off[i] + s.enter.dur);
        });
        ST[id] = { steps: steps, off: off, chain: A_.seq.apply(null, steps.map(function (s) { return s.enter; })) };
      }
      /* a slide with steps is left by the shell's fade to paper, so the slide after it is never CONTINUED (PLAN.md
         §Navigation): live.js reads data-continues once this maker has returned, and the slides are made in order,
         so the slide before's steps are known here */
      var prev = q.root.previousElementSibling;
      while (prev && !(prev.matches && prev.matches("section.slide"))) prev = prev.previousElementSibling;
      if (prev && ST[prev.getAttribute("data-id")] && q.root.getAttribute("data-continues") === "1") q.root.setAttribute("data-continues", "0");
      return m;
    });
  };
  var O = { rest: L.rest, entry: L.entry, loop: L.loop, info: L.info, startLoop: L.startLoop, stopLoop: L.stopLoop };
  function sid(k) { var s = document.querySelectorAll("section.slide")[k - 1]; return s ? s.getAttribute("data-id") : null; }
  function S(k) { void L.n; return ST[sid(k)] || null; }  /* L.n builds the slides (and so runs the makers) once */
  function nSteps(k) { var x = S(k); return x ? x.steps.length : 0; }
  function clampS(k, s) { return Math.max(0, Math.min(nSteps(k), s | 0)); }
  /* every step back to its first state, its loops at their start: the overview's state, before the entry is set */
  function reset(k) {
    var x = S(k); if (!x) return;
    for (var i = x.steps.length - 1; i >= 0; i--) if (x.steps[i].loop) x.steps[i].loop.set(0);
    x.chain.set(0);
  }
  function step(k, s) {
    var x = S(k); s = clampS(k, s);
    reset(k); O.rest(k);
    if (x) x.chain.set(x.off[s]);
  }
  var raf = null;
  function stopOwn() { if (raf) cancelAnimationFrame(raf); raf = null; }
  L.rest = function (k) { step(k, 0); };
  L.entry = function (k, t) { reset(k); O.entry(k, t); };
  L.loop = function (k, t) { reset(k); O.loop(k, t); };
  L.steps = nSteps;
  L.step = step;
  L.stepEnter = function (k, s, t) {
    var x = S(k); s = clampS(k, s);
    if (!x || !s) return step(k, 0);
    reset(k); O.rest(k);
    x.chain.set(x.off[s - 1] + Math.max(0, Math.min(t, x.steps[s - 1].enter.dur)));
  };
  L.stepLoop = function (k, s, t) {
    var x = S(k); s = clampS(k, s);
    step(k, s);
    var lp = x && s ? x.steps[s - 1].loop : null;
    if (lp) lp.set(((t % lp.dur) + lp.dur) % lp.dur);
  };
  L.stopLoop = function () { stopOwn(); O.stopLoop(); };
  L.startLoop = function (k, s) {
    var x = S(k); s = s ? clampS(k, s) : 0;
    L.stopLoop();
    if (!s) return O.startLoop(k);
    var lp = x.steps[s - 1].loop; if (!lp) return;
    var t0 = performance.now();
    (function tick(now) { lp.set((((now - t0) / 1000) % lp.dur)); raf = requestAnimationFrame(tick); })(t0);
  };
  L.info = function () {
    var a = O.info();
    a.forEach(function (e, i) {
      var x = S(i + 1);
      e.steps = x ? x.steps.map(function (s) { return { enter: +s.enter.dur.toFixed(3), loop: s.loop ? +s.loop.dur.toFixed(3) : 0 }; }) : [];
    });
    return a;
  };
  /* live.js has put the first slide shown at rest by its own (inner) rest: with steps, its overview again */
  document.addEventListener("DOMContentLoaded", function () {
    var p = new URLSearchParams(location.search), k = Math.max(1, Math.min(L.n, +(p.get("k") || 1)));
    if (nSteps(k)) { L.stopLoop(); step(k, 0); if (p.get("capture") !== "1" && p.get("embed") !== "1") L.startLoop(k); }
  });
})(window);
