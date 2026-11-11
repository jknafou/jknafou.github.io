/* Slide 10: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js), the
   strip's morph (confidence_strip.py's MORPH_JS) and field_scatter_3d's motion (its SCATTER3D_JS), both handed over by
   slide 8's drawing as data (one home each). The tree of groups, the twelve steps and the numbers are in the .py's header.
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
  /* the neighbour cells' teams view (slide 8's drawing's nt-js, one home), in the scatter's teams loops (10.4-10.8) */
  var NT = fromData("nt-js", "neighTeams")(q);
  var teams = function (k) { return S3.teamsLoop(S3.rests[k + 1], NT); };
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
  /* 10.10-10.11's marks and words (one pass against four, by type), shown by their steps */
  var P11 = ["r", "d", "s", "va", "vb", "w"].reduce(function (a, p) {
    return a.concat([].slice.call(q.root.querySelectorAll('[data-a^="ty11-' + p + '"]')).filter(function (e) { return /^ty11-(r|d|s|va|vb|w)\d$/.test(e.getAttribute("data-a")); }));
  }, []).concat([q("ty11-lg"), q("ty11-ma"), q("ty11-mb"), q("ty11-h")]);
  later = later.concat(P11);
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
  /* 10.4's loop: field_scatter_3d's teams loop (the runs gather onto their team's best and back), each additional run's
     rank line unkeyed and its team rank keyed in its place during the teams phase; the neighbour cells' teams view
     with it (NT, as at 10.5-10.8) */
  var TW = ["ld", "ia"].map(function (k) {
    var g = q("fs10-" + k + "-name"), t = q("fs10-" + k + "-team"), T = [].slice.call(g.querySelectorAll("text")).filter(function (x) { return x !== t; });
    var own = T[T.length - 1];
    return { own: own, ownS: own.textContent, t: t, tS: t.textContent };
  });
  function teamWords(team, tp, tv) {
    NT(team, tp, tv);
    var a = Math.max(0, Math.min(1, 1 - 2 * tp)), b = Math.max(0, Math.min(1, 2 * tp - 1));
    TW.forEach(function (o) {
      o.own.textContent = o.ownS.slice(0, Math.round(o.ownS.length * a));
      o.t.textContent = o.tS.slice(0, Math.round(o.tS.length * b));
      o.t.style.opacity = b > 0 ? "" : "0";
    });
  }
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

  /* ---- 10.10, 10.11: one pass against four, by type (slide 7's per-type graph, its 7.5: the single pass an open ring,
     the four passes a filled disc sliding out of it, the gain an ink segment drawn behind it, the value at the row's
     end); every mark's place set by these tracks from the data, so each step starts on the one before's rest ---- */
  var PD = JSON.parse(q("ty11-data").getAttribute("data-t")), R6p = PD.map(function (_, k) { return k; });
  var pRing = R6p.map(function (k) { return q("ty11-r" + k); }), pDisc = R6p.map(function (k) { return q("ty11-d" + k); });
  var pSeg = R6p.map(function (k) { return q("ty11-s" + k); }), pLy = pSeg.map(function (s) { return s.getAttribute("d").split(",")[1].split("H")[0]; });
  var pVa = R6p.map(function (k) { return q("ty11-va" + k); }), pVb = R6p.map(function (k) { return q("ty11-vb" + k); });
  var pW = R6p.map(function (k) { return q("ty11-w" + k); });
  var pField = R6.map(function (k) { return q("ty" + k + "-d"); });
  /* the ring at r, the disc at d, the segment between them: from one state to another (per row [ring x, disc x]) */
  function marks(from, to, dur) {
    return A.track(dur, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : E(u);
      R6p.forEach(function (k) {
        var r = from(k)[0] + (to(k)[0] - from(k)[0]) * e, d = from(k)[1] + (to(k)[1] - from(k)[1]) * e;
        pRing[k].setAttribute("cx", r.toFixed(2)); pDisc[k].setAttribute("cx", d.toFixed(2));
        pSeg[k].setAttribute("d", "M" + r.toFixed(2) + "," + pLy[k] + "H" + d.toFixed(2));
      });
    });
  }
  /* the camera held on the graph (exactly its frame, as the next step's first state sets it) and the focus held */
  var held = function (k) { return [L("the camera held", A.zoom(q.svg, { from: F[k], to: F[k], dur: 0.01 }))].concat(still(k)); };
  var at = function (s, i) { return function (k) { return [PD[k][s][0], PD[k][s][i]]; }; };   /* i = 0: the disc in the ring */
  var fade = function (els, a, b, dur) {             /* an opacity from a to b (the field: dimmed, then gone) */
    return A.track(dur, function (u) {
      var v = a + (b - a) * (u >= 1 ? 1 : u <= 0 ? 0 : E(u));
      els.forEach(function (el) { el.style.opacity = v >= 0.9999 ? "" : v.toFixed(4); });
    });
  };
  var lgP = q("ty11-lg");
  /* words keyed (or un-keyed) on every row together, as slide 7's values count together */
  var each = function (els, f) { return els.length != null && !els.tagName ? A.par.apply(null, [].map.call(els, f)) : f(els); };
  var keyed = function (els) { return each(els, function (e) { return A.seq(SHOW(e), A.type(e, { quick: true })); }); };
  var unkey = function (els) { return each(els, function (e) { return A.reverse(A.type(e, { quick: true })); }); };
  var rowVals = R6.map(function (k) {             /* AC-2's value on each row as 10.9 leaves it (multi-hop: its new one) */
    var i = TD.map(function (d) { return d.k; }).indexOf(k);
    return i >= 0 ? tyV2[i] : q("ty" + k + "-v");
  });

  /* 10.10 accuracy by type: revised-longest-deliberation (1 pass) against revised-independent-agreement (4 passes) */
  var step10a = A.groups(G("10.10 accuracy by type: 1 pass against 4 passes", [
    held(2).concat([L("10.9's ring, bands and legend put away", away(tyRing.concat(tyHl, tyHl2, [lgNew, q("ty-legend")]))),
                     L("the field dimmed", A.dim(pField, { to: 0.15, dur: 0.5 })),
                     L("AC-2's values and the measure unkeyed", A.par(unkey(rowVals), unkey(q("types-m"))))]),
    L("1 pass: a ring on every row", A.seq(marks(at("a", 0), at("a", 0), 0.01), A.pop(pRing, { dur: 0.4 }))),
    [L("4 passes: the disc slides out, the gain drawn", A.seq(SHOW(pDisc.concat(pSeg)), marks(at("a", 0), at("a", 1), 0.9))),
     L("the values: 1 pass -> 4 passes", keyed(pVa))],
    [L("the legend", A.seq(SHOW(lgP), A.pop(lgP.querySelectorAll("circle"), { dur: 0.35 }), A.type(lgP.querySelectorAll("text"), { quick: true }))),
     L("all 64: 58/64 -> 60/64", keyed(q("ty11-ma")))]]));

  /* 10.11 HMR by type: the same rows, the axis turns to HMR; each row's wrong answers, on which its HMR rests */
  var step11b = A.groups(G("10.11 HMR by type: 1 pass against 4 passes", [
    held(2).concat([L("the accuracy values unkeyed", A.par(unkey(pVa), unkey(q("ty11-ma")))),
                     L("the field gone", fade(pField, 0.15, 0, 0.5)),
                     L("the disc back into the ring", A.seq(marks(at("a", 1), at("a", 0), 0.6), A.hide(pDisc, { dur: 0.15 })))]),
    [L("the heading: HMR", A.seq(unkey(q("types-h")), SHOW(q("ty11-h")), key("ty11-h"))),
     L("the rings glide to the single pass's HMR", marks(at("a", 0), at("b", 0), 1.0))],
    [L("4 passes: the disc slides out, the gain drawn", A.seq(SHOW(pDisc), marks(at("b", 0), at("b", 1), 0.9))),
     L("the values: 1 pass -> 4 passes", keyed(pVb))],
    [L("each row's wrong answers", keyed(pW)), L("all 64: 0.66 -> 0.70, wrong 6 -> 4", keyed(q("ty11-mb")))]]));

  /* 10.12 our mistakes: after the camera settles, Rogue One turns right and the four confidences change, slowly */
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
  var step10 = A.groups(G("10.12 our mistakes: Rogue One right, the confidences changed", [
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
            { enter: step4, loop: S3.teamsLoop(S3.rests[1], teamWords) },
            { enter: fs(1, "10.5 HMR flattened", true), loop: teams(1) },
            { enter: fs(2, "10.6 accuracy flattened"), loop: teams(2) },
            { enter: fs(3, "10.7 the 3D view, bullet time"), loop: teams(3) },
            { enter: fs(4, "10.8 accHMR flattened"), loop: teams(4) },
            { enter: step9t, loop: calm(tyRing, 0.35) },
            { enter: step10a, loop: calm(pDisc.filter(function (_, k) { return PD[k].a[1] !== PD[k].a[0]; }), 0.35) },
            { enter: step11b, loop: calm(pDisc, 0.3) },
            { enter: step10, loop: calm(ours4.concat([rgBar]), 0.3) }],
    zones: { 1: "strip", 4: "scatter", 9: "types", 12: "mistakes" }
  };
});
