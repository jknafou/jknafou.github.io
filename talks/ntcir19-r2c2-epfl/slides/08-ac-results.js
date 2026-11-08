/* Slide 8: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js), the
   strip's morph (confidence_strip.py's MORPH_JS) and field_scatter_3d's motion (its SCATTER3D_JS), both handed over by
   the drawing as data (one home each). The tree of groups, the ten steps and the grid are in the .py's header:
   8.1 the strip read on the trick (one answer right at 100, the rest wrong at 0); 8.2 the trick repeated (4, 16, 32);
   8.3 its limit, every answer wrong at 0; 8.4 confidence 50 everywhere at the median accuracy; 8.5 ours; 8.6 the camera pans to the scatter, the hypothetical runs pop in; 8.7-8.10 field_scatter_3d's steps (8.9
   bullet time, draggable live). */
Deck.slide("08-ac-results", function (A, q) {
  var D = JSON.parse(q("strip-data").getAttribute("data-st"));
  var HOME = [0, 0, 1600, 900];
  var P = [q("strip"), q("scatter"), q("types"), q("mistakes")];
  var TY = JSON.parse(q("ty-data").getAttribute("data-ty")), MQ = JSON.parse(q("mq-data").getAttribute("data-mq"));
  var F = P.map(function (p) { return p.getAttribute("data-frame").split(",").map(Number); });
  var all = function (sel) { return [].slice.call(q.root.querySelectorAll(sel)); };
  var key = function (n) { return A.type(q(n), { quick: true }); };
  var L = function (name, tr) { return { name: name, track: tr }; };
  var G = function (name, layers) { return { name: name, layers: layers.filter(Boolean) }; };
  /* the words field_scatter_3d's own motion uses (the specimen page's SHOW and KEY) */
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
  /* the neighbour cells' teams view (the drawing's nt-js, one home): accuracy by type and our mistakes said in teams
     during the teams phase of the scatter's loops (8.6-8.10), dimmed as they are; teamsLoop calls it on every frame */
  var NT = fromData("nt-js", "neighTeams")(q);
  var teams = function (k) { return S3.teamsLoop(S3.rests[k + 1], NT); };
  /* the live drag at the 3D step's rest (field_scatter_3d's drag): the deck's shell forwards pointer events to it
     through window.Live3D (the live page sits under the shell, which takes the pointer); a page opened alone listens */
  window.Live3D = window.Live3D || {};
  window.Live3D["08-ac-results"] = S3.drag;
  window.Live3D["08-ac-results:units"] = S3.units;  /* the cube's check (the scratchpad's drag test reads it) */
  if (!/[?&](embed|capture)=1/.test(location.search)) S3.listen(q.root);

  /* ---- the strip's run changing: bars (MORPH_JS), means and slots together ---- */
  var NUM = /\d+(?:\.\d+)?/g;
  function tween(a, b, e) {                         /* one text into another: its numbers recount if the words agree */
    if (a.replace(NUM, "#") !== b.replace(NUM, "#")) return e < 0.5 ? a : b;
    var na = a.match(NUM) || [], k = 0;
    return b.replace(NUM, function (m) {
      var d = (m.split(".")[1] || "").length, x = +na[k] + (+m - +na[k]) * e; k++;
      return x.toFixed(d);
    });
  }
  var SLOTS = ["acc", "ru", "ro", "hmr"];
  function change(s0, s1, dur) {                     /* run s0's strip into run s1's */
    dur = dur || 1.4;
    var bars = stripMorph("st", D.base, D.states[s0], D.states[s1], dur), E = A.ease.io;
    var M = ["mr", "mw"].map(function (nm) {
      return { g: q(nm), line: q(nm + "-line"), v: q(nm + "-v"), a: D.means[s0][nm], b: D.means[s1][nm] };
    });
    var slots = SLOTS.map(function (f) { return { el: q("slot-" + f), a: D.slots[s0][f], b: D.slots[s1][f] }; });
    var rest = A.track(dur, function (u) {
      var e = E(u);
      M.forEach(function (m) {
        var a = m.a || m.b, b = m.b || m.a;
        if (!a) { m.g.style.opacity = "0"; return; }
        var y = a[0] + (b[0] - a[0]) * e, ty = a[1] + (b[1] - a[1]) * e;
        m.line.setAttribute("d", "M" + D.x0 + "," + y.toFixed(2) + "H" + D.x1);
        m.v.setAttribute("y", ty.toFixed(2));
        m.v.textContent = tween(a[2], b[2], e);
        var o = m.a && m.b ? 1 : m.a ? 1 - e : e;
        m.g.style.opacity = o >= 0.9999 ? "" : o.toFixed(4);
      });
      slots.forEach(function (s) { s.el.textContent = tween(s.a, s.b, e); });
    });
    return A.par(bars, rest);
  }
  var capSwap = function (s0, s1) {                 /* the caption: the old one goes, the new one is keyed */
    return A.seq(A.hide(q("cap-" + s0), { dur: 0.3 }), SHOW(q("cap-" + s1)), key("cap-" + s1));
  };
  /* a part swells and back, eased, at rest untouched: a circle by its radius, a bar by its width about its centre */
  function swell(els, k, dur) {
    var S = els.map(function (e) {
      var c = e.tagName.toLowerCase() === "circle";
      return { e: e, c: c, v: +e.getAttribute(c ? "r" : "width"), v0: e.getAttribute(c ? "r" : "width"), x0: e.getAttribute("x"), x: +e.getAttribute("x") };
    });
    return A.track(dur || 0.9, function (u) {
      var s = u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) * k;
      S.forEach(function (o) {
        if (o.c) { o.e.setAttribute("r", s ? (o.v * (1 + s)).toFixed(2) : o.v0); return; }
        o.e.setAttribute("width", s ? (o.v * (1 + s)).toFixed(2) : o.v0);
        o.e.setAttribute("x", s ? (o.x - o.v * s / 2).toFixed(2) : o.x0);
      });
    });
  }
  var sweep = function (els) { return A.par.apply(null, els.map(function (h) { return A.highlight(h, { dur: 0.5 }); })); };
  var fx = function (i) { return A.seq(SHOW(q("fx" + i)), A.type(all('[data-a="fx' + i + '"] text'), { quick: true })); };
  var mean = function (nm) { return A.seq(SHOW(q(nm)), A.draw(q(nm + "-line"), { dur: 0.6 }), key(nm + "-v")); };

  /* ---- the overview's entry: the camera home, what only a step shows set aside ---- */
  var O = D.order;                                  /* k1, k4, k16, k32, k0, flat50, ours */
  var hidden = [q("note")]
    .concat(O.slice(1).map(function (s) { return q("cap-" + s); }));
  var aside = A.par(A.camera(q.svg, HOME, HOME, { dur: 0 }), A.focus(P, { from: null, to: null, dur: 0 }),
                    A.hide(hidden, { dur: 0 }), A.hide([q("hmr-hl"), q("acc-hl"), q("mw-hl")].concat(TY.firsts.map(function (k) { return q("ty" + k + "-hl"); })), { dur: 0 }));
  var heads = function (k) { return A.type(all('[data-a="' + k + '-h"], [data-a="' + k + '-m"]'), { quick: true }); };
  var gS = G("the strip", [
    L("its heading", heads("strip")),
    /* the bars and the words under them start together (the author, 8 November 2026: "the left/top bar chart should
       start getting animated the same moment with the text under the chart") */
    [G("the chart", [L("the bars", A.enter(q("st"))), [L("the green mean", mean("mr")), L("the red mean", mean("mw"))]]),
     G("the words under it", [L("its caption", key("cap-" + O[0])), L("its formulas", A.seq(fx(0), fx(1), fx(2), fx(3)))])]]);
  var gF = G("the scatter", [
    L("its heading", heads("scatter")),
    L("the scatter and its curves", S3.entry)]);
  /* ---- the closing graphs: accuracy by type, our mistakes against everyone's ---- */
  var R4 = [0, 1, 2, 3, 4, 5].slice(0, TY.types);
  var popIn = function (els, gap, d) { return A.stagger(els, function (e) { return A.pop(e, { dur: d || 0.35 }); }, gap); };
  var tyDiscs = function (k) { return all('[data-a="ty' + k + '-d"] circle'); };
  var tyPop = function () { return A.par.apply(null, R4.map(function (k) { return popIn(tyDiscs(k), 0.02, 0.3); })); };
  var tyVals = function () { return A.type(R4.map(function (k) { return q("ty" + k + "-v"); }), { quick: true }); };
  var tyHl = TY.firsts.map(function (k) { return q("ty" + k + "-hl"); });
  var tyKey = R4.map(function (k) { return q("ty" + k + "-" + TY.key); });
  var gT = G("accuracy by type", [
    L("its heading", heads("types")),
    [L("the tags", A.par.apply(null, R4.map(function (k) { return A.pace(A.enter(q("ty" + k + "-t")), 2); }))),
     L("the lines", A.draw(R4.map(function (k) { return q("ty" + k + "-l"); }), { dur: 0.5 })),
     L("the scale", A.type(all('[data-a="ty-scale"] text'), { quick: true }))],
    L("the runs", tyPop()),
    L("AC-2's share and rank", tyVals()),
    L("the legend", A.pop(q("ty-legend"), { dur: 0.4 }))]);
  var mqBars = MQ.order.map(function (qq) { return q("mq-" + qq); }), mqOurs = MQ.wrong.map(function (qq) { return q("mq-" + qq); });
  var mqGrow = function () { return A.stagger(mqBars, function (b) { return A.grow(b, { dir: "up", dur: 0.4 }); }, 0.012); };
  var mqWords = function () {
    return A.seq(A.draw(all('[data-a="mq-words"] path'), { dur: 0.4 }), A.type(all('[data-a="mq-words"] text'), { quick: true }));
  };
  var gM = G("our mistakes against everyone's", [
    L("its heading", heads("mistakes")),
    L("its axes", A.seq(A.draw(all('[data-a="mq-axes"] path'), { dur: 0.4 }), A.type(all('[data-a="mq-axes"] text'), { quick: true }))),
    L("the 64 questions", mqGrow()),
    L("our five, named", mqWords())]);
  var tree = { name: "slide", layers: [L("aside", aside), [L("header", key("head")), gS, gF, gT, gM]] };

  /* ---- the steps ---- */
  var look = function (from, to) {
    return [L("the camera", A.zoom(q.svg, { from: from == null ? HOME : F[from], to: F[to], dur: 0.8 })),
            L("the focus", A.focus(P, { from: from, to: to, dim: 0.3, dur: 0.8 }))];
  };
  /* 8.1 PLAYS THE READING AGAIN (slide 7's rule): its first layer takes back, quickly, what its later layers play */
  var back = function (tr, d) { return A.reverse(A.pace(tr, tr.dur / (d || 0.35))); };
  var step1 = A.groups(G("8.1 one answer right at 100, the others wrong at 0, read", [
    look(null, 0).concat([L("the reading taken back", back(A.par(fx(0), fx(1), fx(2), fx(3), mean("mr"), mean("mw"))))]),
    L("accuracy", fx(0)),
    [L("R_U", fx(1)), L("the green mean", mean("mr"))],
    [L("R_O", fx(2)), L("the red mean", mean("mw"))],
    L("HMR", fx(3)),
    L("HMR 1.0000 at accuracy 1/64", sweep([q("hmr-hl")]))]));
  var morph = function (i, dur) {                  /* one layer: the caption and the run, from O[i - 1] to O[i] */
    return [L("the caption: " + O[i], capSwap(O[i - 1], O[i])), L("the run changes: " + O[i], change(O[i - 1], O[i], dur))];
  };
  var hl = function (f) { return q(f + "-hl"); };
  var step2 = A.groups(G("8.2 the trick repeated: 4, 16, 32 answers at 100", [
    [L("the caption: 4, then 16, then 32", capSwap(O[0], O[3])), L("the run changes: " + O[1], change(O[0], O[1], 1.1))],
    L("a beat", A.wait(0.3)), L("the run changes: " + O[2], change(O[1], O[2], 1.1)),
    L("a beat", A.wait(0.3)), L("the run changes: " + O[3], change(O[2], O[3], 1.1)),
    L("the accuracy climbed", sweep([hl("acc")]))]));
  var step3 = A.groups(G("8.3 its limit: every answer wrong, at 0",
    [[L("the accuracy's band put away", A.hide(hl("acc"), { dur: 0.3 }))].concat(morph(4))]));
  var step4 = A.groups(G("8.4 confidence 50 everywhere, at the median accuracy", [
    [L("the HMR's band put away", A.hide(hl("hmr"), { dur: 0.3 }))].concat(morph(5)),
    L("HMR 0.5000", sweep([hl("hmr")]))]));
  var step5 = A.groups(G("8.5 ours", [
    [L("the HMR's band put away", A.hide(hl("hmr"), { dur: 0.3 }))].concat(morph(6)),
    L("HMR 0.4915", sweep([hl("hmr")])),
    L("below confidence 50 everywhere", A.seq(SHOW(q("note")), key("note")))]));
  var step6 = A.groups(G("8.6 the scatter, with the hypothetical runs",
    [look(0, 1).concat([L("field_scatter_3d: the hypothetical runs", S3.steps[0].enter)])]));
  var fs = function (k, name) { return A.groups(G(name, [L("field_scatter_3d ." + k, S3.steps[k].enter)])); };
  /* A STEP PLAYS ITS GRAPH AGAIN (slide 7's rule) */
  var step11 = A.groups(G("8.11 accuracy by type", [
    look(1, 2).concat([L("the graph taken back", back(A.par(tyPop(), tyVals())))]),
    L("the runs, row by row together", tyPop()),
    L("AC-2's share and rank", tyVals()),
    L("where it is 1st", sweep(tyHl))]));
  var loop11 = A.seq(A.wait(0.8), swell(tyKey, 0.5), A.wait(3));
  var step12 = A.groups(G("8.12 our mistakes against everyone's", [
    look(2, 3).concat([L("the graph taken back", back(A.par(mqGrow(), mqWords())))]),
    L("the 64 questions, most runs right first", mqGrow()),
    L("our five, named", mqWords()),
    L("Hannibal: 13 of 25 right, ours at 100", sweep([q("mw-hl")]))]));
  var loop12 = A.seq(A.wait(0.8), swell(mqOurs, 0.3), A.wait(3));

  return {
    entry: A.groups(tree),
    steps: [{ enter: step1 }, { enter: step2 }, { enter: step3 }, { enter: step4 }, { enter: step5 },
            { enter: step6, loop: teams(0) },
            { enter: fs(1, "8.7 HMR flattened"), loop: teams(1) }, { enter: fs(2, "8.8 accuracy flattened"), loop: teams(2) },
            { enter: fs(3, "8.9 the 3D view, bullet time"), loop: teams(3) }, { enter: fs(4, "8.10 accHMR flattened"), loop: teams(4) },
            { enter: step11, loop: loop11 }, { enter: step12, loop: loop12 }],
    zones: { 1: "strip", 6: "scatter", 11: "types", 12: "mistakes" }
  };
});
