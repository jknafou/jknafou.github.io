/* Slide 10: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js), the
   strip's morph (confidence_strip.py's MORPH_JS) and field_scatter_3d's motion (its SCATTER3D_JS), both handed over by
   slide 8's drawing as data (one home each). The tree of groups, the nine steps and the numbers are in the .py's header.
   Slide 8's motion file keeps its change(), swell() and entry tree to itself (no hook): the ones here are this
   slide's own, on the data slide 8's drawing exposes (strip-data's states, slots and means). */
Deck.slide("10-additional-results", function (A, q) {
  var D = JSON.parse(q("strip-data").getAttribute("data-st"));
  var FD = JSON.parse(q("fs10-data").getAttribute("data-s"));
  var TD = JSON.parse(q("ty10-data").getAttribute("data-t"));
  var MD = JSON.parse(q("mq10-data").getAttribute("data-m"));
  var TY = JSON.parse(q("ty-data").getAttribute("data-ty")), MQ = JSON.parse(q("mq-data").getAttribute("data-mq"));
  var HOME = [0, 0, 1600, 900];
  var P = [q("strip"), q("scatter"), q("types"), q("mistakes")];
  var F = P.map(function (p) { return p.getAttribute("data-frame").split(",").map(Number); });
  var all = function (sel) { return [].slice.call(q.root.querySelectorAll(sel)); };
  var key = function (n) { return A.type(typeof n === "string" ? q(n) : n, { quick: true }); };
  var L = function (name, tr) { return { name: name, track: tr }; };
  var G = function (name, layers) { return { name: name, layers: layers.filter(Boolean) }; };
  var SHOW = function (el) { return A.reveal(el, { dur: 0.01 }); };
  var KEY = function (el) {
    var T = el.tagName.toLowerCase() === "text" ? [el] : [].slice.call(el.querySelectorAll("text"));
    return T.length ? A.type(T, { quick: true }) : null;
  };
  var fromData = function (n, fn) {
    return new Function("A", "q", "SHOW", "KEY", JSON.parse(q(n).getAttribute("data-js")) + "\nreturn " + fn + ";")(A, q, SHOW, KEY);
  };
  var scatter3d = fromData("fs-js", "scatter3d"), stripMorph = fromData("strip-js", "stripMorph");
  var S3 = scatter3d("fs");
  /* the live drag at the 3D step's rest, as slide 8 (the shell forwards pointer events through window.Live3D) */
  window.Live3D = window.Live3D || {};
  window.Live3D["10-additional-results"] = S3.drag;
  window.Live3D["10-additional-results:units"] = S3.units;
  if (!/[?&](embed|capture)=1/.test(location.search)) S3.listen(q.root);
  var E = A.ease.io;

  /* ---- a text into another: its numbers recount where the words agree ---- */
  var NUM = /\d+(?:\.\d+)?/g;
  function tween(a, b, e) {
    if (a.replace(NUM, "#") !== b.replace(NUM, "#")) return e < 0.5 ? a : b;
    var na = a.match(NUM) || [], k = 0;
    return b.replace(NUM, function (m) {
      var a0 = na[k++];
      if (a0 === m) return m;                        /* unchanged: as written ("0049" stays "0049") */
      var d = (m.split(".")[1] || "").length, x = +a0 + (+m - +a0) * e;
      return x.toFixed(d);
    });
  }
  /* the strip's run changing: bars (MORPH_JS), the two means and the four slots together */
  function change(s0, s1, dur) {
    var bars = stripMorph("st", D.base, D.states[s0], D.states[s1], dur);
    var M = ["mr", "mw"].map(function (nm) {
      return { line: q(nm + "-line"), v: q(nm + "-v"), a: D.means[s0][nm], b: D.means[s1][nm] };
    });
    var slots = ["acc", "ru", "ro", "hmr"].map(function (f) { return { el: q("slot-" + f), a: D.slots[s0][f], b: D.slots[s1][f] }; });
    return A.par(bars, A.track(dur, function (u) {
      var e = E(u);
      M.forEach(function (m) {
        var y = m.a[0] + (m.b[0] - m.a[0]) * e, ty = m.a[1] + (m.b[1] - m.a[1]) * e;
        m.line.setAttribute("d", "M" + D.x0 + "," + y.toFixed(2) + "H" + D.x1);
        m.v.setAttribute("y", ty.toFixed(2));
        m.v.textContent = tween(m.a[2], m.b[2], e);
      });
      slots.forEach(function (s) { s.el.textContent = tween(s.a, s.b, e); });
    }));
  }
  /* the run label: the kind un-keyed, the name's board turns to the next run's, its kind keyed */
  function relabel(k0, k1) {
    return A.seq(A.reverse(key("rk-" + k0)), A.hide(q("run-" + k0), { dur: 0 }), SHOW(q("run-" + k1)),
                 A.flip(q("rn-" + k1)), key("rk-" + k1));
  }
  /* a part swells and back, at rest untouched: a circle by its radius, a bar (rect) by its width, a stroke by its weight */
  function swell(els, k, dur) {
    var S = els.map(function (e) {
      var t = e.tagName.toLowerCase(), at = t === "circle" ? "r" : t === "rect" ? "width" : "stroke-width";
      return { e: e, at: at, v0: e.getAttribute(at), v: +e.getAttribute(at), x0: e.getAttribute("x"), x: +e.getAttribute("x") };
    });
    return A.track(dur || 0.9, function (u) {
      var s = u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) * k;
      S.forEach(function (o) {
        o.e.setAttribute(o.at, s ? (o.v * (1 + s)).toFixed(2) : o.v0);
        if (o.at === "width") o.e.setAttribute("x", s ? (o.x - o.v * s / 2).toFixed(2) : o.x0);
      });
    });
  }
  var calm = function (els, k) { return A.seq(A.wait(0.8), swell(els, k), A.wait(3)); };
  var sweep = function (els) { return A.par.apply(null, els.map(function (h) { return A.highlight(h, { dur: 0.5 }); })); };
  var away = function (els) { return A.hide(els, { dur: 0.3 }); };
  var fx = function (i) { return A.seq(SHOW(q("fx" + i)), A.type(all('[data-a="fx' + i + '"] text'), { quick: true })); };
  var mean = function (nm) { return A.seq(SHOW(q(nm)), A.draw(q(nm + "-line"), { dur: 0.6 }), key(nm + "-v")); };
  var heads = function (k) { return A.type(all('[data-a="' + k + '-h"], [data-a="' + k + '-m"]'), { quick: true }); };
  var tagIn = function (k) {                         /* a bar's name: its band swept, its hairline drawn, its word keyed */
    var g = q("tag-" + k);
    return A.seq(sweep([q("tag-" + k + "-hl")]), SHOW(g), A.draw(g.querySelector("path"), { dur: 0.3 }), KEY(g));
  };

  /* ---- what only a step shows ---- */
  var RN = ["ld", "ia"].map(function (k) { return q("run-" + k); });
  var PTG = ["ld", "ia"].map(function (k) { return q("fs-" + FD[k].run); });
  var PT = PTG.map(function (g) { return g.querySelector("circle"); });
  var PW = ["ld", "ia"].map(function (k) { return q("fs10-" + k + "-name"); });
  var tyRing = TD.map(function (d) { return q("ty" + d.k + "-ring"); }), tyV2 = TD.map(function (d) { return q("ty" + d.k + "-v2"); });
  var tyV = TD.map(function (d) { return q("ty" + d.k + "-v"); }), tyHl2 = TD.map(function (d) { return q("ty" + d.k + "-hl"); });
  var lgOld = q("ty-legend").lastElementChild, lgNew = q("ty-legend-ia");
  var tyHl = TY.firsts.map(function (k) { return q("ty" + k + "-hl"); });
  var later = [q("note"), q("caps"), q("tag-ld"), q("tag-ia"), q("mw-0065-new")].concat(RN, PTG, PW, tyRing, tyV2, [lgNew]);
  var bands = [q("hmr-hl"), q("hmr-hl-ld"), q("hmr-hl-ia"), q("acc-hl"), q("mw-hl"), q("mw-hl2"), q("mw-0065-hl"), q("tag-ld-hl"), q("tag-ia-hl")].concat(tyHl, tyHl2);
  var aside = A.par(A.camera(q.svg, HOME, HOME, { dur: 0 }), A.focus(P, { from: null, to: null, dur: 0 }),
                    A.hide(later, { dur: 0 }), A.hide(bands, { dur: 0 }));

  /* ---- the overview's entry: slide 8's graphs, our submitted runs ---- */
  var gS = G("the strip", [
    L("its heading", heads("strip")),
    /* the bars and the words under them start together (the author, 8 November 2026) */
    [G("the chart", [L("the bars: BITEM-AC-2", A.enter(q("st"))), [L("the green mean", mean("mr")), L("the red mean", mean("mw"))]]),
     G("the words under it", [[L("the run's name", A.flip(q("rn-ours"))), L("its kind", key("rk-ours"))],
                              L("its formulas", A.seq(fx(0), fx(1), fx(2), fx(3)))])],
    L("HMR 0.4915", sweep([q("hmr-hl")]))]);
  var gF = G("the scatter", [
    L("its heading", heads("scatter")),
    L("the 25 runs", S3.entry),
    L("made square", S3.steps[0].enter)]);
  var R6 = [0, 1, 2, 3, 4, 5].slice(0, TY.types);
  var popIn = function (els, gap, d) { return A.stagger(els, function (e) { return A.pop(e, { dur: d || 0.35 }); }, gap); };
  var tyPop = function () { return A.par.apply(null, R6.map(function (k) { return popIn(all('[data-a="ty' + k + '-d"] circle'), 0.02, 0.3); })); };
  var gT = G("accuracy by type", [
    L("its heading", heads("types")),
    [L("the tags", A.par.apply(null, R6.map(function (k) { return A.pace(A.enter(q("ty" + k + "-t")), 2); }))),
     L("the lines", A.draw(R6.map(function (k) { return q("ty" + k + "-l"); }), { dur: 0.5 })),
     L("the scale", A.type(all('[data-a="ty-scale"] text'), { quick: true }))],
    L("the runs", tyPop()),
    L("AC-2's share and rank", A.type(R6.map(function (k) { return q("ty" + k + "-v"); }), { quick: true })),
    L("the legend", A.pop(q("ty-legend"), { dur: 0.4 })),
    L("where it is 1st", sweep(tyHl))]);
  var mqBars = MQ.order.map(function (qq) { return q("mq-" + qq); });
  var gM = G("our mistakes against everyone's", [
    L("its heading", heads("mistakes")),
    L("its axes", A.seq(A.draw(all('[data-a="mq-axes"] path'), { dur: 0.4 }), A.type(all('[data-a="mq-axes"] text'), { quick: true }))),
    L("the 64 questions", A.stagger(mqBars, function (b) { return A.grow(b, { dir: "up", dur: 0.4 }); }, 0.012)),
    L("our five, named", A.seq(A.draw(all('[data-a="mq-words"] path'), { dur: 0.4 }),
                               A.type(all('[data-a="mq-words"] text:not([data-a])'), { quick: true }))),
    L("Hannibal: 13 of 25 right, ours at 100", sweep([q("mw-hl")]))]);
  var tree = { name: "slide", layers: [L("aside", aside), [L("header", key("head")), gS, gF, gT, gM]] };

  /* ---- the steps: the camera onto one graph, the rest dimmed (slide 8's frames: one size, zoom once, then pan) ---- */
  var look = function (from, to) {
    return [L("the camera", A.zoom(q.svg, { from: from == null ? HOME : F[from], to: F[to], dur: 0.8 })),
            L("the focus", A.focus(P, { from: from, to: to, dim: 0.3, dur: 0.8 }))];
  };
  var still = function (from) { return [L("the focus held", A.focus(P, { from: from, to: from, dim: 0.3, dur: 0.01 }))]; };

  /* 10.1 the strip: BITEM-AC-2 as submitted, the reference, named */
  var i60 = D.qs.indexOf("0060"), i65 = D.qs.indexOf("0065");
  var step1 = A.groups(G("10.1 the strip: BITEM-AC-2, as submitted", [look(null, 0)]));

  /* 10.2 the single pass re-scored: BITEM-AC-2 -> revised-longest-deliberation */
  var step2 = A.groups(G("10.2 the strip: revised-longest-deliberation, AC-1's pass re-scored", [
    still(0).concat([L("AC-2's HMR band put away", away(q("hmr-hl")))]),
    [L("the run's label", relabel("ours", "ld")), L("the run changes: heights, order, colour, values", change("ours", "ld", 1.8))],
    L("Han Solo, 0", tagIn("ld")),
    L("HMR 0.6639", sweep([q("hmr-hl-ld")]))]));

  /* 10.3 the four passes: -> revised-independent-agreement */
  var step3 = A.groups(G("10.3 the strip: revised-independent-agreement, four passes", [
    still(0).concat([L("the single pass's words put away", away([q("hmr-hl-ld"), q("tag-ld"), q("tag-ld-hl")]))]),
    [L("the run's label", relabel("ld", "ia")), L("the run changes: heights, order, colour, values", change("ld", "ia", 1.8))],
    L("Rogue One right", tagIn("ia")),
    L("HMR 0.6985", sweep([q("hmr-hl-ia")]))]));

  /* 10.4 the scatter: each additional run out of the submitted run it reads differently */
  function out(i, k) {                               /* the point pops on its source and glides to its place */
    var c = PT[i], s = FD[k].src, t = FD[k].to;
    var glide = A.track(1.2, function (u) {
      var e = E(u);
      c.setAttribute("cx", (s[0] + (t[0] - s[0]) * e).toFixed(2));
      c.setAttribute("cy", (s[1] + (t[1] - s[1]) * e).toFixed(2));
    });
    return A.seq(SHOW(PTG[i]), A.pop(c, { dur: 0.45 }), glide);
  }
  var said = function (g) { return A.seq(SHOW(g), A.draw(g.querySelector("path"), { dur: 0.4 }), KEY(g)); };
  var step4 = A.groups(G("10.4 the scatter: the additional runs", [
    look(0, 1),
    L("out of BITEM-AC-1: revised-longest-deliberation", out(0, "ld")),
    L("its words: 11th on HMR, 7th on accHMR", said(PW[0])),
    L("out of BITEM-AC-2: revised-independent-agreement", out(1, "ia")),
    L("its words: 9th on HMR, 5th on accHMR", said(PW[1]))]));
  /* 10.5-10.8 field_scatter_3d's steps, as on slide 8, with the additional runs among the points */
  var fs = function (k, name, pre) {
    return A.groups(G(name, [[L("field_scatter_3d ." + k, S3.steps[k].enter)].concat(pre ? [L("the runs' words aside", away(PW))] : [])]));
  };

  /* 10.9 accuracy by type: multi-hop, 9/10 -> 10/10, 1st */
  var tyGlide = A.par.apply(null, TD.map(function (d, i) {
    return A.track(1.0, function (u) { tyRing[i].setAttribute("cx", (d.x0 + (d.x1 - d.x0) * E(u)).toFixed(2)); });
  }));
  var step9t = A.groups(G("10.9 accuracy by type: multi-hop", [
    look(1, 2),
    [L("a ring pops on AC-2's multi-hop disc and glides to 10/10", A.seq(A.pop(tyRing, { dur: 0.45 }), tyGlide)),
     L("its value", A.seq(A.reverse(key(tyV)), SHOW(tyV2), key(tyV2))),
     L("the legend: whose share", A.seq(A.reverse(key(lgOld)), A.hide(lgOld, { dur: 0 }), SHOW(lgNew),
                                        A.pop(lgNew.querySelector("circle"), { dur: 0.35 }), key(lgNew.querySelector("text"))))],
    L("1st", sweep(tyHl2))]));

  /* 10.10 our mistakes: after the camera settles, Rogue One turns right and the four confidences change, slowly */
  var rgBar = q("mq-0065"), rgOld = [].slice.call(q("mw-0065").querySelectorAll("text")).pop(), rgNew = q("mw-0065-new");
  var rgb = function (h) { return [1, 3, 5].map(function (k) { return parseInt(h.slice(k, k + 2), 16); }); };
  var c0 = rgb(rgBar.getAttribute("fill")), c1 = rgb(MD.col), f0 = rgBar.getAttribute("fill");
  var recolour = A.track(1.2, function (u) {
    if (u <= 0) { rgBar.setAttribute("fill", f0); return; }
    var e = E(u), c = c0.map(function (a, k) { return Math.round(a + (c1[k] - a) * e); });
    rgBar.setAttribute("fill", "rgb(" + c.join(",") + ")");
  });
  var W = Object.keys(MD.tgt).map(function (qq) {
    var t = [].slice.call(q("mw-" + qq).querySelectorAll("text")).pop();
    return { text: t, s0: t.textContent, s1: MD.tgt[qq].text };
  });
  var recount = A.track(1.4, function (u) { var e = E(u); W.forEach(function (o) { o.text.textContent = tween(o.s0, o.s1, e); }); });
  var ours4 = Object.keys(MD.tgt).map(function (qq) { return q("mq-" + qq); });
  var step10 = A.groups(G("10.10 our mistakes: Rogue One right, the confidences changed", [
    look(2, 3).concat([L("Hannibal's band put away", away(q("mw-hl")))]),
    L("the camera settled: a pause", A.wait(0.5)),
    [L("Rogue One's bar turns green", recolour),
     L("Rogue One's words: now right", A.seq(A.reverse(key(rgOld)), SHOW(rgNew), key(rgNew))),
     L("the four left: their confidences recount", recount),
     L("our 5 mistakes -> 4", A.recount(q("mistakes-h"), { from: 5, to: 4, dur: 1.2 }))],
    L("Rogue One now right; Hannibal at 0", sweep([q("mw-0065-hl"), q("mw-hl2")]))]));

  return {
    entry: A.groups(tree),
    steps: [{ enter: step1, loop: null },
            { enter: step2, loop: calm([q("st-q" + i60 + "-v")], 0.6) },
            { enter: step3, loop: calm([q("st-q" + i65 + "-v")], 0.6) },
            { enter: step4, loop: calm(PT, 0.35) },
            { enter: fs(1, "10.5 HMR flattened", true), loop: S3.steps[1].loop },
            { enter: fs(2, "10.6 accuracy flattened"), loop: S3.steps[2].loop },
            { enter: fs(3, "10.7 the 3D view, bullet time"), loop: S3.steps[3].loop },
            { enter: fs(4, "10.8 accHMR flattened"), loop: S3.steps[4].loop },
            { enter: step9t, loop: calm(tyRing, 0.35) },
            { enter: step10, loop: calm(ours4.concat([rgBar]), 0.3) }],
    zones: { 1: "strip", 4: "scatter", 9: "types", 10: "mistakes" }
  };
});
