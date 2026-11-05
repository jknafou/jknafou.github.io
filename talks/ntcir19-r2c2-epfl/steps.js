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
 * An entry made of nested groups (PLAN.md, "A slide animates by groups") is declared with A.groups(tree), below: a
 * group is a sequence of layers ({layers: [...]}), each layer waiting for the one before it; a list is one layer, its
 * members starting together; {group, then} closes a group with its links; {track, idle} settles a leaf into its idle.
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
 *   Live.info()                each slide also gets steps: [{enter, loop}] (durations in s) and zones: [{step, name}],
 *                              groups (its entry's A.groups schedule) and stepGroups (each step enter's), or null
 *   Live.groups(k, s, dt)      that schedule measured on the timeline, with the breaches of the groups rule
 *   Live.zoneRects(k, s)       where slide k's zones are drawn now (with s: at step s's rest), in viewport fractions
 *   Live.glide(k, s, {mode})   a move within slide k from what is shown: step s's enter, or back to its rest (below)
 * A slide may also declare `zones: {step: data-a name}` (slide 3: each region of its overview, the step on it).
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

  /* ---- groups: a slide's entry (and a step's enter) as a TREE of groups in LAYERS (PLAN.md, "A slide animates by
   * groups"; the author, 5 November 2026: "first assign nested groups for each slide, then normally, for a given layer
   * all the nested groups should start their animation simultaneously, only layer should wait for one to finish,
   * e.g. answer waits that the model finish, the model that the query finish"). A GROUP is a sequence of LAYERS; a
   * layer starts the moment the layer before it in the same group has ended (its last member ended); every member of
   * a layer starts at that same instant, and a member that is itself a group starts its own first layer then, and so
   * on down to the leaves. A node is
   *   a track                        a LEAF: one concept's layers, or one run of them, played to its own end
   *   [n1, n2, ...]                  ONE LAYER: its members all start at the same moment, each runs to its own end
   *   {layers: [L1, L2, ...]}        a group of layers, each Li a node (usually a list): L2 starts when L1 has ended...
   *   {group: L, then: n}            the same as {layers: [L, n]}: a group whose last layer (`then`: the links between
   *                                  members that START TOGETHER in L, every arrow after both of its ends) starts once
   *                                  they have ended; a link between two groups belongs to the smallest group holding
   *                                  both. A link between two members that come ONE AFTER THE OTHER is a group of its
   *                                  own, a layer between them: query → arrow → model → arrow → answer (the author:
   *                                  "the arrows are independent groups that needs to be animated between the
   *                                  sequence of question/model/answer")
   *   {track: t, idle: i}            a leaf that settles into its idle the moment it ends (an idle starts when its own
   *                                  group ends): `i` round and round from then on, while the others play; the leaf's
   *                                  length is its track's, so its idle never lengthens the entry, and at the tree's
   *                                  end every idle is set back to its start (its rest), the state the loop starts from
   * Any object node may carry `name` (the schedule's label; unnamed nodes are labelled by their path, "0.2.1").
   * A.groups(tree) is one pure track, as every motion of the bank is, and carries its SCHEDULE: .nodes, one row per
   * node, {path, name, kind ("leaf" | "layer" | "layers"), parent, layer (its index in its parent's layers), start,
   * end} in s from the track's start, computed from the durations; and .measure(dt), the same schedule MEASURED from
   * the timeline (the track played at dt steps, each leaf's start read from the time it is first given), with the
   * rule checked on it: .breaches lists every layer whose members do not share a start and every layer that does not
   * start at the end of the one before (tools/test_groups.mjs runs it on every slide and step: Live.groups). ---- */
  A.groups = function (tree) {
    var rows = [], leaves = [], idles = [], clock = { T: 0, on: false };
    function build(node, path, parent, layer) {
      if (!node) return null;
      var row = { path: path, name: node.name || path, kind: null, parent: parent, layer: layer, start: 0, end: 0, kids: [] };
      rows.push(row);
      if (parent) parent.kids.push(row);
      var tr;
      if (Array.isArray(node)) {
        row.kind = "layer";
        var ms = node.filter(Boolean).map(function (n, i) { return build(n, path + "." + i, row, 0); }).filter(Boolean);
        tr = A.par.apply(null, ms);
      } else if (node.layers || node.group) {
        row.kind = "layers";
        var L = (node.layers || [node.group, node.then]).filter(Boolean);
        tr = A.seq.apply(null, L.map(function (n, i) { return build(n, path + "." + i, row, i); }).filter(Boolean));
      } else if (node.track || typeof node.set === "function") {
        row.kind = "leaf";
        var t0 = node.track || node, id = node.track ? node.idle : null;
        var core = !id ? t0 : { dur: t0.dur, set: function (t) {
          if (t <= t0.dur) { t0.set(t); id.set(0); return; }
          t0.set(t0.dur); id.set(id.dur > 0 ? (t - t0.dur) % id.dur : 0);
        } };
        if (id) idles.push(id);
        var probe = { row: row, seen: null };
        leaves.push(probe);
        tr = { dur: core.dur, set: function (t) {
          if (clock.on && probe.seen == null && t >= 0) probe.seen = clock.T - t;   /* the leaf's start, on the timeline */
          core.set(t);
        } };
      } else {
        throw new Error("A.groups: a node is a track, a list, {layers}, {group, then} or {track, idle} (at " + path + ")");
      }
      row.dur = tr.dur;
      return tr;
    }
    var root = build(tree, "0", null, 0);
    if (!root) return null;
    /* the schedule from the durations: a layer's members at its start, a group's layers one after another */
    (function place(r, s) {
      r.start = s;
      if (r.kind === "leaf") { r.end = s + r.dur; return; }
      var at = s, cur = 0, end = s;
      r.kids.forEach(function (k) {
        if (r.kind === "layers" && k.layer !== cur) { cur = k.layer; at = end; }
        place(k, r.kind === "layer" ? s : at);
        end = Math.max(end, k.end);
      });
      r.end = r.kids.length ? end : s;
    })(rows[0], 0);
    var D = root.dur;
    var out = { dur: D, set: function (t) {
      root.set(t);
      if (t >= D) idles.forEach(function (i) { i.set(0); });            /* at rest: every idle at its start */
    } };
    var pub = function (r) { return { path: r.path, name: r.name, kind: r.kind, parent: r.parent ? r.parent.path : null,
      layer: r.layer, start: +r.start.toFixed(4), end: +r.end.toFixed(4) }; };
    out.nodes = rows.map(pub);
    out.measure = function (dt) {
      dt = dt || 1 / 30;
      leaves.forEach(function (p) { p.seen = null; });
      clock.on = true;
      try { for (var T = 0; ; T += dt) { clock.T = Math.min(T, D); out.set(clock.T); if (T >= D) break; } }
      finally { clock.on = false; }
      var M = {};
      leaves.forEach(function (p) { M[p.row.path] = p.seen == null ? null : [p.seen, p.seen + p.row.dur]; });
      (function span(r) {                       /* a group's measured span: from its first leaf's start to its last end */
        if (r.kind === "leaf") return M[r.path];
        var a = Infinity, b = -Infinity;
        r.kids.forEach(function (k) { var m = span(k); if (m) { a = Math.min(a, m[0]); b = Math.max(b, m[1]); } });
        return (M[r.path] = a === Infinity ? null : [a, b]);
      })(rows[0]);
      var eps = 1e-6, breaches = [];
      rows.forEach(function (r) {
        var m = M[r.path];
        if (!m) { breaches.push(r.name + ": never started"); return; }
        if (r.kind === "layer") r.kids.forEach(function (k) {
          var mk = M[k.path];
          if (mk && Math.abs(mk[0] - m[0]) > eps) breaches.push(k.name + " starts at " + mk[0].toFixed(3) + ", its layer (" + r.name + ") at " + m[0].toFixed(3));
        });
        if (r.kind === "layers") {
          var by = [];
          r.kids.forEach(function (k) { (by[k.layer] = by[k.layer] || []).push(k); });
          var prevEnd = m[0];
          by.forEach(function (ks, i) {
            ks.forEach(function (k) {
              var mk = M[k.path];
              if (mk && Math.abs(mk[0] - prevEnd) > eps)
                breaches.push(r.name + ": layer " + i + " (" + k.name + ") starts at " + mk[0].toFixed(3) + (i ? ", the layer before it ends at " : ", its group at ") + prevEnd.toFixed(3));
            });
            prevEnd = Math.max.apply(null, ks.map(function (k) { return M[k.path] ? M[k.path][1] : prevEnd; }));
          });
        }
      });
      return { dur: D, breaches: breaches, nodes: rows.map(function (r) {
        var o = pub(r), m = M[r.path]; o.measured = m ? [+m[0].toFixed(4), +m[1].toFixed(4)] : null; return o; }) };
    };
    return out;
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
  var ST = {}, GR = {}, reg = D.slide;
  D.slide = function (id, make) {
    reg(id, function (A_, q) {
      var m = make(A_, q) || {};
      var steps = (m.steps || []).filter(Boolean);
      /* the group trees (A.groups) of its entry and of each step's enter, for Live.info and Live.groups */
      GR[id] = { entry: m.entry && m.entry.measure ? m.entry : null,
                 steps: steps.map(function (s) { return s.enter && s.enter.measure ? s.enter : null; }) };
      if (steps.length) {
        var off = [0];
        steps.forEach(function (s, i) {
          if (!s.enter) throw new Error(id + ": step " + (i + 1) + " has no enter");
          off.push(off[i] + s.enter.dur);
        });
        ST[id] = { steps: steps, off: off, chain: A_.seq.apply(null, steps.map(function (s) { return s.enter; })) };
      }
      /* its ZONES (PLAN.md §Navigation, "two levels"): {step: a data-a name or a selector}, the region of the overview
         a click on which plays that step's attention move; only on a slide whose steps are regions (not slide 2's
         transformations) */
      if (m.zones) {
        if (!ST[id]) throw new Error(id + ": zones without steps");
        ST[id].zones = Object.keys(m.zones).map(function (k) {
          var n = +k, sel = m.zones[k], el = q(sel) || q.root.querySelector(sel);
          if (!(n >= 1 && n <= steps.length)) throw new Error(id + ": zone for step " + k + ", which does not exist");
          if (!el) throw new Error(id + ": zone " + k + " (" + sel + ") has no element");
          return { step: n, name: sel, el: el };
        });
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
      e.zones = x && x.zones ? x.zones.map(function (z) { return { step: z.step, name: z.name }; }) : null;
      var g = GR[e.id];                                    /* the group schedule, computed from the durations */
      e.groups = g && g.entry ? g.entry.nodes : null;
      e.stepGroups = g ? g.steps.map(function (t) { return t ? t.nodes : null; }) : [];
    });
    return a;
  };
  /* the group schedule of slide k's entry (s = 0 or none) or of step s's enter, MEASURED on its timeline (A.groups's
     .measure: each leaf's start read as the track is played at dt steps) with the rule's breaches; null when that
     motion is not a group tree. The slide is put back on its rest (or step s's) afterwards */
  L.groups = function (k, s, dt) {
    void L.n;
    var g = GR[sid(k)], tr = !g ? null : s ? g.steps[s - 1] : g.entry;
    if (!tr) return null;
    if (s) { L.stepEnter(k, s, 0); } else { L.entry(k, 0); }
    var r = tr.measure(dt);
    step(k, s || 0);
    return r;
  };
  /* the zones of slide k where they are now drawn (the camera included): [{step, r: [x, y, w, h]}] in fractions of
     this page's viewport, which the shell lays over the stage; with s, slide k is first set at step s's rest */
  L.zoneRects = function (k, s) {
    var x = S(k); if (!x || !x.zones) return [];
    if (s != null) step(k, s);
    var vw = G.innerWidth || 1, vh = G.innerHeight || 1;
    return x.zones.map(function (z) {
      var r = inked(z.el);
      return { step: z.step, r: [r[0] / vw, r[1] / vh, (r[2] - r[0]) / vw, (r[3] - r[1]) / vh] };
    });
  };
  /* the box of what a part draws: the union of its visible shapes, leaving out what is hidden (display none, or
     opacity 0 of its own: a bead parked at the origin until its pulse, a scene not yet shown) */
  function inked(el) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    (function walk(e) {
      var cs = G.getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return;
      if (e.firstElementChild) { for (var c = e.firstElementChild; c; c = c.nextElementSibling) walk(c); return; }
      var r = e.getBoundingClientRect(); if (!r.width && !r.height) return;
      b[0] = Math.min(b[0], r.left); b[1] = Math.min(b[1], r.top); b[2] = Math.max(b[2], r.right); b[3] = Math.max(b[3], r.bottom);
    })(el);
    return b[0] === Infinity ? [0, 0, 0, 0] : b;
  }

  /* ---- a GLIDE: a move within a slide from whatever is shown now, its camera and its dimming carried smoothly
   * (PLAN.md §Navigation, "two levels"). Two kinds:
   *   enter  step s's enter played from the picture shown (a zone clicked from any position of the slide): the enter
   *          runs from step s-1's rest as always, while the camera and the parts' opacity it starts from are offset
   *          to what was shown, the offset easing out over the first 0.7 s, so the camera travels from where it was;
   *   rest   back to step s's rest (the overview, from ↑ or ← on step 1): the camera and the dimming eased to the
   *          target's in 0.5 s over the content shown (the source step's rest, `from`, when the move starts at rest),
   *          then the target's content set. null when there is nothing to carry (a transformation only: slide 2), and
   *          the shell fades as for any ←.
   * What differs otherwise between the two states (a card filled, words keyed) is set at once: at the start for
   * an enter, at the end for a rest. A track, {dur, set(t)}. ---- */
  /* the camera as A.camera leaves it (a CSS transform on the svg), read back as the frame's centre and its scale
     [cx, cy, s], the space A.camera moves in (the centre linear, the zoom geometric) */
  var CAM = /translate\(([-\d.e]+)%,\s*([-\d.e]+)%\)\s*scale\(([-\d.e]+)\)/;
  function camOf(svg) {
    var m = CAM.exec(svg.style.transform || ""), W = A.VB[2], H = A.VB[3];
    var tx = m ? +m[1] : 0, ty = m ? +m[2] : 0, sc = m ? +m[3] : 1;
    return [(W / 2 - tx / 100 * W) / sc, (H / 2 - ty / 100 * H) / sc, sc];
  }
  function camSet(svg, c) {
    var W = A.VB[2], H = A.VB[3], tx = (W / 2 - c[0] * c[2]) / W * 100, ty = (H / 2 - c[1] * c[2]) / H * 100;
    svg.style.transform = Math.abs(tx) < 1e-4 && Math.abs(ty) < 1e-4 && Math.abs(c[2] - 1) < 1e-6 ? "" :
      "translate(" + tx.toFixed(4) + "%, " + ty.toFixed(4) + "%) scale(" + c[2].toFixed(5) + ")";
    svg.style.transformOrigin = "0 0";
  }
  var opOf = function (el) { return el.style.opacity === "" ? 1 : +el.style.opacity; };
  var opSet = function (el, v) { v = Math.max(0, Math.min(1, v)); el.style.opacity = v >= 0.9999 ? "" : v.toFixed(4); };
  function opsOf(sec) { var o = new Map(); sec.querySelectorAll('[style*="opacity"]').forEach(function (el) { if (el.style.opacity !== "") o.set(el, +el.style.opacity); }); return o; }
  L.glide = function (k, s, o) {
    o = o || {};
    var x = S(k); s = clampS(k, s);
    var sec = document.querySelectorAll("section.slide")[k - 1], svg = sec && sec.querySelector("svg");
    if (!svg) return null;
    var c0 = camOf(svg), o0 = opsOf(sec);                          /* what is shown now */
    var enter = o.mode === "enter" && s > 0 && !!x, E = enter ? x.steps[s - 1].enter : null;
    if (enter) L.stepEnter(k, s, 0); else step(k, s);
    var c1 = camOf(svg), o1 = opsOf(sec), D = [];
    var seen = new Set(); o0.forEach(function (v, el) { seen.add(el); }); o1.forEach(function (v, el) { seen.add(el); });
    seen.forEach(function (el) {
      var a = o0.has(el) ? o0.get(el) : 1, b = o1.has(el) ? o1.get(el) : 1;
      if (Math.abs(a - b) > 0.01) D.push([el, a, b]);
    });
    var moved = Math.abs(c0[0] - c1[0]) + Math.abs(c0[1] - c1[1]) + 100 * Math.abs(Math.log(c0[2] / c1[2])) > 0.05;
    if (!enter && !moved && !D.length) return null;
    var src = !enter && o.from != null && o.from !== s ? clampS(k, o.from) : null;
    var Tm = enter ? Math.min(0.7, E.dur) : (o.dur || 0.5), dur = enter ? E.dur : Tm, ease = A.ease.io;
    return { dur: dur, set: function (t) {
      t = Math.max(0, Math.min(dur, t));
      var e = ease(Tm > 0 ? Math.min(1, t / Tm) : 1);
      if (enter) {
        L.stepEnter(k, s, t);
        var w = 1 - e; if (w <= 0) return;
        var c = camOf(svg);
        camSet(svg, [c[0] + (c0[0] - c1[0]) * w, c[1] + (c0[1] - c1[1]) * w, c[2] * Math.pow(c0[2] / c1[2], w)]);
        D.forEach(function (d) { opSet(d[0], opOf(d[0]) + (d[1] - d[2]) * w); });
        return;
      }
      if (t >= dur) { step(k, s); return; }
      if (src != null) step(k, src);
      camSet(svg, [c0[0] + (c1[0] - c0[0]) * e, c0[1] + (c1[1] - c0[1]) * e, c0[2] * Math.pow(c1[2] / c0[2], e)]);
      D.forEach(function (d) { opSet(d[0], d[1] + (d[2] - d[1]) * e); });
    } };
  };
  /* live.js has put the first slide shown at rest by its own (inner) rest: with steps, its overview again */
  document.addEventListener("DOMContentLoaded", function () {
    var p = new URLSearchParams(location.search), k = Math.max(1, Math.min(L.n, +(p.get("k") || 1)));
    if (nSteps(k)) { L.stopLoop(); step(k, 0); if (p.get("capture") !== "1" && p.get("embed") !== "1") L.startLoop(k); }
  });
})(window);
