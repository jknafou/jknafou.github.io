/* Slide 7: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js).
   The tree of groups, the four steps and the grid are in the .py's header. One persistent layout, four graphs in a
   2 x 2 grid, fully drawn at the overview; each step pans the camera to one graph (one frame size: it only moves), the
   other three at 0.3, and plays that graph again: G1's bars grow in rank order, G2's points come in region by region
   with their counts, G4's length bars and gain bars grow (the reason PG-1 trails), G3's PG-2 discs slide out of PG-1's
   rings drawing the gain. Each step's loop is a calm swell of what it showed, then stillness. */
Deck.slide("07-pr-results", function (A, q) {
  var D = JSON.parse(q("frames").getAttribute("data-pr"));
  var HOME = [0, 0, 1600, 900];
  var P = D.order.map(q);                           /* g1, g2, g4, g3: the steps' order */
  var F = P.map(function (p) { return p.getAttribute("data-frame").split(",").map(Number); });
  var key = function (n) { return A.type(q(n), { quick: true }); };
  var L = function (name, tr) { return { name: name, track: tr }; };
  var G = function (name, layers) { return { name: name, layers: layers.filter(Boolean) }; };
  var all = function (sel) { return [].slice.call(q.root.querySelectorAll(sel)); };
  var range = function (k) { var a = []; for (var i = 0; i < k; i++) a.push(i); return a; };
  var R1 = range(D.n1), R3 = range(D.types), RG = range(D.gains);
  var xy = function (el, a) { return el.getAttribute(a).split(",").map(Number); };
  var keyAll = function (els) { return A.par.apply(null, els.map(function (t) { return A.type(t, { quick: true }); })); };

  /* a part swells by a share of its size and back (a disc's radius; a bar's thickness: its height, or with `across` its
     width, so a bar standing on an axis stays on it), eased; its rest untouched */
  function swell(els, k, dur, across) {
    var A_ = across ? ["width", "x"] : ["height", "y"];
    var S = els.map(function (e) {
      return e.tagName.toLowerCase() === "circle" ? { e: e, r: +e.getAttribute("r"), r0: e.getAttribute("r") }
        : { e: e, h: +e.getAttribute(A_[0]), y: +e.getAttribute(A_[1]), h0: e.getAttribute(A_[0]), y0: e.getAttribute(A_[1]) };
    });
    return A.track(dur || 0.9, function (u) {
      var s = u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) * k;
      S.forEach(function (o) {
        if (o.r != null) { o.e.setAttribute("r", s ? (o.r * (1 + s)).toFixed(2) : o.r0); return; }
        if (!s) { o.e.setAttribute(A_[0], o.h0); o.e.setAttribute(A_[1], o.y0); return; }
        o.e.setAttribute(A_[0], (o.h * (1 + s)).toFixed(2)); o.e.setAttribute(A_[1], (o.y - o.h * s / 2).toFixed(2));
      });
    });
  }
  var bars = R1.map(function (i) { return q("g1-b" + i); }), vals = R1.map(function (i) { return q("g1-v" + i); });
  var g1hl = D.ours.map(function (i) { return q("g1-hl" + i); });
  var side = function (s) { return all('[data-a="g2-pts"] [data-side="' + s + '"]'); };
  var pins = D.firsts.map(function (k) { return q("g3-pin" + k); }), g3hl = D.firsts.map(function (k) { return q("g3-hl" + k); });

  /* ---- G1: the bars, ranked ---- */
  var g1grow = function () {                        /* the bars from 0 in rank order, each value counting with its bar */
    return A.stagger(R1, function (i) { return A.par(A.grow(bars[i], { dur: 0.7 }), A.count(vals[i], { dur: 0.7 })); }, 0.05);
  };
  var g1 = G("G1: all 22 PR runs", [
    L("its heading", key("g1-h")),
    [L("its axes", A.seq(A.draw(all('[data-a="g1-axes"] path'), { dur: 0.5 }), A.type(all('[data-a="g1-axes"] text'), { quick: true }))),
     L("ranks and names", keyAll(all('[data-a="g1-names"] text'))), L("what is measured", key("g1-m"))],
    L("the bars and their values", g1grow()),
    L("the legend", A.pop(q("g1-legend"), { dur: 0.4 }))]);

  /* ---- G2: per question ---- */
  var popIn = function (els, gap) { return A.stagger(els, function (e) { return A.pop(e, { dur: 0.35 }); }, gap); };
  var regions = function () {                       /* each region's points pop in while its count grows, the three together */
    return [["up", "g2-n-up"], ["tie", "g2-n-tie"], ["down", "g2-n-down"]].map(function (s) {
      var ps = side(s[0]), gap = Math.min(0.04, 1.4 / ps.length);
      return L("the " + s[0] + " region", A.par(popIn(ps, gap), A.count(q(s[1]), { dur: gap * ps.length + 0.3, ease: A.ease.lin })));
    });
  };
  var mean = function () {
    return A.seq(A.draw(q("g2-gap"), { dur: 0.4 }), A.pop(q("g2-ring"), { dur: 0.4 }),
                 A.draw(all('[data-a="g2-mean"] > path:not([data-a])'), { dur: 0.3 }), key("g2-mean-w"));
  };
  var keyOf = function () {                         /* the key's hairlines to their regions, and what each count is */
    return A.par(A.draw(all('[data-a="g2-leads"] path'), { dur: 0.5 }),
                 A.type(all('[data-a="g2-keys"] text:not([data-a])'), { quick: true }));
  };
  var han = function () { return A.seq(A.draw(all('[data-a="g2-han"] path'), { dur: 0.3 }), key("g2-han-w")); };
  var g2 = G("G2: per question", [
    L("its heading", key("g2-h")),
    L("its axes", A.seq(A.draw(all('[data-a="g2-axes"] path'), { dur: 0.5 }), A.type(all('[data-a="g2-axes"] text'), { quick: true }))),
    regions(),
    [L("the diagonal", A.draw(q("g2-diag"), { dur: 0.5 })), L("the key", keyOf())],
    [L("the mean", mean()), L("Han Solo", han())]]);

  /* ---- G3: per question type ---- */
  var others = function (k) { return all('[data-a="g3-o' + k + '"] circle'); };
  var slideOut = function (k) {                     /* PG-2's disc slides out of PG-1's ring, the gain drawn behind it */
    var b = q("g3-b" + k);
    return A.par(A.reveal(b, { dur: 0.1 }), A.move(b, { from: xy(b, "data-from"), to: [0, 0], dur: 0.9 }),
                 A.draw(q("g3-s" + k), { dur: 0.9 }), A.count(q("g3-g" + k), { dur: 0.9 }));
  };
  /* ---- G4: PG-1's list lengths, where 37 and 27 come from, and PG-2's lead on each set of questions ---- */
  var lbars = D.lengths.map(function (k) { return q("g4-b" + k); }), lcnts = D.lengths.map(function (k) { return q("g4-c" + k); });
  var gbars = RG.map(function (i) { return q("g4-g" + i); }), gvals = RG.map(function (i) { return q("g4-v" + i); }), glabs = RG.map(function (i) { return q("g4-gl" + i); });
  var shorts = D.lengths.filter(function (k) { return k < 20; });
  var g4lengths = function () {                     /* the bars up from the axis, by length, each count counting with its bar */
    return A.stagger(range(lbars.length), function (i) { return A.par(A.grow(lbars[i], { dur: 0.6, dir: "up" }), A.count(lcnts[i], { dur: 0.6 })); }, 0.06);
  };
  var g4note = function () { return A.type(all('[data-a="g4-note"] text'), { quick: true }); };
  var g4rows = function (ix) {                      /* a set of rows: its labels keyed, then its bars grow with their values */
    return A.seq(A.type(ix.map(function (i) { return glabs[i]; }), { quick: true }),
                 A.par.apply(null, ix.map(function (i) { return A.par(A.grow(gbars[i], { dur: 0.6 }), A.count(gvals[i], { dur: 0.6 })); })));
  };
  var SHORT = 2, FULL = 3;                          /* the rows: all 64, cut, the short lists, the full lists */
  var g4 = G("G4: PG-1's short lists", [
    L("its heading", key("g4-h")),
    [L("the legend", A.pop(q("g4-legend"), { dur: 0.4 })),
     L("its axes and words", A.seq(A.draw(all('[data-a="g4-axes"] path'), { dur: 0.4 }), A.type(all('[data-a="g4-axes"] text'), { quick: true }))),
     L("what the right half measures", A.type(all('[data-a="g4-gh"] text'), { quick: true }))],
    [G("the lengths (left)", [L("the bars", g4lengths()), L("the note on the 10s", g4note())]),
     G("the leads (right)", [L("all 64", g4rows([0, 1])), L("the short and the full lists", g4rows([SHORT, FULL]))])]]);

  var g3 = G("G3: per question type", [
    L("its heading", key("g3-h")),
    [L("the tags", A.par.apply(null, R3.map(function (k) { return A.pace(A.enter(q("g3-t" + k)), 2); }))),
     L("the lines", A.draw(R3.map(function (k) { return q("g3-l" + k); }), { dur: 0.5 })),
     L("the scale and what is measured", A.par(A.type(all('[data-a="g3-scale"] text'), { quick: true }), key("g3-m")))],
    [L("the other runs", A.par.apply(null, R3.map(function (k) { return popIn(others(k), 0.02); }))),
     L("PG-1", A.pop(R3.map(function (k) { return q("g3-a" + k); }), { dur: 0.4 }))],
    L("PG-2 and the gain", A.par.apply(null, R3.map(slideOut))),
    L("the legend", A.pop(q("g3-legend"), { dur: 0.4 }))]);

  /* ---- the overview's entry: the camera home, what only a step shows set aside ---- */
  var aside = A.par(A.camera(q.svg, HOME, HOME, { dur: 0 }), A.focus(P, { from: null, to: null, dur: 0 }),
                    A.hide(g1hl.concat(g3hl, pins, [q("g4-hl")]), { dur: 0 }), A.hide(R3.map(function (k) { return q("g3-b" + k); }), { dur: 0 }));
  var tree = { name: "slide", layers: [L("aside", aside), [L("header", key("head")), g1, g2, g4, g3]] };

  /* ---- the three steps: the camera to the graph, the graph played again, then its loop ---- */
  var look = function (s) {
    return [L("the camera", A.zoom(q.svg, { from: s ? F[s - 1] : HOME, to: F[s], dur: 0.8 })),
            L("the focus", A.focus(P, { from: s ? s - 1 : null, to: s, dim: 0.3, dur: 0.8 }))];
  };
  /* A STEP PLAYS ITS GRAPH AGAIN. Its first layer takes back, quickly, exactly the motions its later layers play (each
     one's own track backwards, A.reverse): while the step has not begun, the timeline sets every later layer to its
     first state (A.seq: not begun, latest first) and then this layer to its own, which is the graph as drawn, so the
     step before's rest is untouched (anim/anim.js A.seq) */
  var back = function (tr, d) { return A.reverse(A.pace(tr, tr.dur / (d || 0.35))); };
  var step1 = A.groups(G("7.1", [
    [look(0)[0], look(0)[1], L("the bars fall back", back(g1grow()))],
    L("they grow again, in rank order", g1grow()),
    L("ours: rank, name and value", A.par.apply(null, g1hl.map(function (h) { return A.highlight(h, { dur: 0.5 }); })))]));
  var loop1 = A.seq(A.wait(0.8), swell([bars[D.ours[0]]], 0.35), A.wait(0.4), swell([bars[D.ours[1]]], 0.35), A.wait(3));

  var step2 = A.groups(G("7.2", [
    look(1).concat([L("the graph taken back", back(A.par(A.par.apply(null, regions().map(function (r) { return r.track; })),
                                                          A.draw(q("g2-diag"), { dur: 0.5 }), keyOf(), mean(), han())))]),
    regions(),
    [L("the diagonal", A.draw(q("g2-diag"), { dur: 0.5 })), L("the key", keyOf())],
    [L("the mean", mean()), L("Han Solo", han())]]));
  var loop2 = A.seq(A.wait(0.8), swell(side("up"), 0.3), A.wait(0.5), swell(side("down"), 0.3), A.wait(3));

  var g3others = function () { return A.par.apply(null, R3.map(function (k) { return popIn(others(k), 0.02); })); };
  var g3pg1 = function () { return A.pop(R3.map(function (k) { return q("g3-a" + k); }), { dur: 0.4 }); };
  var step3 = A.groups(G("7.4", [
    look(3).concat([L("the graph taken back", back(A.par(g3others(), g3pg1(), A.par.apply(null, R3.map(slideOut)))))]),
    [L("the other runs", g3others()), L("PG-1", g3pg1())],
    L("PG-2 and the gain", A.par.apply(null, R3.map(slideOut))),
    L("1st of 22", A.par(A.par.apply(null, g3hl.map(function (h) { return A.seq(A.reveal(h, { dur: 0.01 }), A.highlight(h, { dur: 0.5 })); })),
                         A.par.apply(null, pins.map(function (p) { return A.seq(A.reveal(p, { dur: 0.01 }), A.type(p, { quick: true })); }))))]));
  var b3 = D.firsts.map(function (k) { return q("g3-b" + k); });
  var loop3 = A.seq(A.wait(0.8), swell([b3[0]], 0.4), A.wait(0.4), swell([b3[1]], 0.4), A.wait(3));

  var step4 = A.groups(G("7.3", [
    look(2).concat([L("the graph taken back", back(A.par(g4lengths(), g4note(), g4rows([0, 1]), g4rows([SHORT, FULL]))))]),
    [G("the lengths (left)", [L("the bars", g4lengths()), L("the note on the 10s", g4note())]),
     G("the leads (right)", [L("all 64", g4rows([0, 1])), L("the short and the full lists", g4rows([SHORT, FULL]))])],
    L("the short lists' lead", A.highlight(q("g4-hl"), { dur: 0.5 }))]));
  var loop4 = A.seq(A.wait(0.8), swell([q("g4-b10")], 0.3, 0.9, true), A.wait(0.4), swell([gbars[SHORT]], 0.35), A.wait(3));

  return {
    entry: A.groups(tree),
    steps: [{ enter: step1, loop: loop1 }, { enter: step2, loop: loop2 }, { enter: step4, loop: loop4 }, { enter: step3, loop: loop3 }],
    zones: { 1: "g1", 2: "g2", 3: "g4", 4: "g3" }
  };
});
