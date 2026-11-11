/* Slide 6: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js).
   The tree of groups, the five steps and the grid are in the .py's header. One persistent layout: the passes at the
   left, the five runs at the right, no permanent link between them. Each step, one run: it first clears what the
   step before explained (never mid-animation), then SHOWS its rule (no sentence): its links are drawn, in the pipeline's own
   way (slide 4's `_line`, `arrow`, `_dot`), from the answer cards' edges to its AC run's card (the A balls' guides; none
   for the PR runs); the passes' tiles fly into the
   run's places and sort by their key; A balls roll along their lines into the card; AC-1's gap to 100 fills by 45%; then the run's lines as sent are keyed. No camera. */
Deck.slide("06-runs", function (A, q) {
  var D = JSON.parse(q("frames").getAttribute("data-runs"));
  var RUNS = D.runs, KEYS = RUNS.map(function (r) { return r.key; }), PASSES = [1, 2, 3, 4];
  var run = function (k) { return RUNS.filter(function (r) { return r.key === k; })[0]; };
  var key = function (n) { return A.type(q(n), { quick: true }); };
  var L = function (name, tr) { return { name: name, track: tr }; };
  var G = function (name, layers) { return { name: name, layers: layers.filter(Boolean) }; };
  var shown = function (n) { return A.reveal(q(n), { dur: 0.01 }); };
  var all = function (sel) { return [].slice.call(q.root.querySelectorAll(sel)); };
  var tilesOf = function (k) { var a = []; for (var j = 0; j < run(k).n; j++) a.push(q("pt-" + k + "-" + j)); return a; };
  var keysOf = function (k) { var a = [q("ek-" + k)]; for (var j = 0; j < run(k).n; j++) a.push(q("ptk-" + k + "-" + j)); return a; };
  var ballsOf = function (k) { return D.rolls[k].map(function (p) { return q("tk-" + k + "-" + p); }); };
  var numsOf = function (k) { return PASSES.map(function (p) { return q("nb-" + k + "-" + p); }); };
  var ACS = KEYS.filter(function (k) { return run(k).kind === "AC"; }), PRS = KEYS.filter(function (k) { return run(k).kind === "PR"; });
  var GRP = ["sb", "il"];
  var grpParts = function (g) { return all('[data-a="grp-' + g + '"] > *'); };

  /* ---- what each step explains, cleared as the next one starts (the rows stay filled) ---- */
  var EXPLAINS = [
    keysOf("pg1"),
    keysOf("pg2").concat(grpParts("sb"), grpParts("il")),
    [q("gap-ac1"), q("lines-ac1")].concat(ballsOf("ac1")),
    numsOf("ac2").concat([q("hl-ac2"), q("lines-ac2")], ballsOf("ac2")),
    numsOf("ac3").concat([q("sum-sb"), q("sum-il"), q("hl-ac3"), q("cap-ac3"), q("lines-ac3")], ballsOf("ac3"))
  ];

  /* ---- the overview's entry: what the steps bring is set aside first ---- */
  var later = [].concat.apply([], EXPLAINS).concat(
    [].concat.apply([], PRS.map(function (k) { return tilesOf(k).concat([q("fl-" + k)]); })),
    [].concat.apply([], ACS.map(function (k) { return [q("ac-" + k + "-text"), q("ac-" + k + "-value"), q("ac-" + k + "-verdict"), q("fl-" + k)]; })));
  var bars = ACS.map(function (k) { return A.hold(A.fill(q("ac-" + k + "-bar"), { value: q("ac-" + k + "-value") }), 0.01, 0); });
  var aside = A.par.apply(null, [A.hide(later, { dur: 0 })].concat(bars));

  function block(p) {                               /* slide 5's pass box read along its flow, its strip beside it */
    var ln = "lane" + p;
    return G("pass " + p, [
      [L("its box", A.pop(q(ln + "-frame"), { dur: 0.4 })), L("its passages", A.enter(q("strip" + p)))],
      [L("its label", key(ln + "-label")), L("its question", A.enter(q(ln + "-q")))],
      L("in", A.flow(q(ln + "-p1"), { dur: 0.35 })),
      L("its calls", A.seq(A.pop(q(ln + "-chips"), { dur: 0.35 }), A.par(key(ln + "-calls"), key(ln + "-ret")))),
      L("out", A.flow(q(ln + "-p2"), { dur: 0.35 })),
      L("its answer", A.pace(A.enter(q(ln + "-a")), 1.5)),
      [L("right or wrong", A.write(q("lv" + p))),
       L("its kept nuggets", A.seq(A.pop(q("greens" + p), { dur: 0.35 }), A.write(all('[data-a="greens' + p + '"] [data-verdict]')),
                                   key("scores" + p)))]]);
  }
  function row(k) {                                 /* a run, empty: its name, then its empty frame or card */
    var r = run(k), name = [L("its name", A.flip(q("nm-" + k))), L("its kind", key("kind-" + k))];
    if (r.kind === "PR")
      return G(k, [name, L("its frame", A.reveal(q("fr-" + k), { dur: 0.35 })),
                   [L("its 20 places", A.pop(q("pl-" + k), { dur: 0.4 })), L("at most 20", key("cap-" + k))]]);
    return G(k, [name, L("its card", A.pop(q("ac-" + k), { dur: 0.4 })), L("ruled", A.draw(q("ac-" + k + "-ph"), { dur: 0.4 }))]);
  }
  var tree = { name: "slide", layers: [
    L("aside", aside),
    [L("header", key("head")),
     G("the passes", [L("heading", key("have-h")), PASSES.map(block)]),
     G("the runs", [L("heading", key("sub-h")), KEYS.map(row)])]] };

  /* ---- the parts A.focus dims and lights (none inside another; the explanations are not among them) ---- */
  var NAMES = ["head", "have-h", "sub-h", "blk1", "blk2", "blk3", "blk4", "grp-sb", "grp-il"]
    .concat(KEYS.map(function (k) { return "row-" + k; }));
  var P = NAMES.map(q);
  var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 6: no part " + k); return i; }); };
  var blk = function (ps) { return ps.map(function (p) { return "blk" + p; }); };
  var focusOn = function (ps, k, more) { return blk(ps).concat(["row-" + k], more || []); };

  /* ---- the motions a run is made by ---- */
  var xy = function (el, a) { return el.getAttribute(a).split(",").map(Number); };
  var routes = function (k) {                       /* a step's links, the pipeline's: branches and bus drawn together, dots, the trunk */
    var R = all('[data-a="lines-' + k + '"] > [data-a^="ln-' + k + '-"]'), Dt = all('[data-a="lines-' + k + '"] > [data-a^="dot-' + k + '-"]');
    return G("its links", [L("shown", shown("lines-" + k)), L("branches and bus", A.draw(R, { dur: 0.7 })),
                           Dt.length ? L("where they meet", A.pop(Dt, { dur: 0.3 })) : null, L("into the run", A.flow(q("arw-" + k), { dur: 0.4 }))]);
  };

  var land = function (k) {                          /* each tile from its pass's strip to where it lands, one after another */
    return A.stagger(tilesOf(k), function (t) {
      return A.par(A.reveal(t, { dur: 0.15 }), A.move(t, { from: xy(t, "data-from"), to: xy(t, "data-land"), dur: 0.7 }));
    }, run(k).n > 10 ? 0.08 : 0.12);
  };
  var keysIn = function (k) { return A.par(A.reveal(keysOf(k), { dur: 0.01 }), A.type(keysOf(k), { quick: true })); };
  var sort = function (k) {                          /* the tiles out of place move to their place, together, their keys riding */
    var T = tilesOf(k).filter(function (t) { return xy(t, "data-land")[0] !== 0; });
    return A.par.apply(null, T.map(function (t) { return A.move(t, { from: xy(t, "data-land"), to: [0, 0], dur: 0.9 }); }));
  };
  var line = function (k) { return A.seq(shown("fl-" + k), A.type(q("fl-" + k), { quick: true })); };
  var rolls = function (k) {                         /* the A balls along their drawn links into the card, together */
    return A.par.apply(null, D.rolls[k].map(function (p) {
      var b = q("tk-" + k + "-" + p);
      return A.seq(A.reveal(b, { dur: 0.15 }), A.travel(b, { along: [q("gd-" + k + "-" + p), q("arw-" + k)], into: q("ac-" + k), dur: 1.4 }));
    }));
  };

  var card = function (k, conf0) {                  /* the ruled card fills: its rule lifted, the answer thought and typed, its gauge */
    var c = "ac-" + k, bar = q(c + "-bar"), val = q(c + "-value");
    var gauge = conf0 == null ? A.fill(bar, { value: val }) : A.fillTo(bar, { frac: conf0 / 100, shown: conf0, value: val });
    var texts = q(c + "-text").querySelectorAll("text");
    return A.seq(A.reverse(A.draw(q(c + "-ph"), { dur: 0.3 })), shown(c + "-text"), A.think(texts[0], { dur: 0.6 }),
                 A.type(texts, { quick: true }), gauge);
  };
  var raise = function (k, conf0) {                 /* AC-1's gauge from pass 1's confidence to the one computed */
    var bar = q("ac-" + k + "-bar");
    return A.gaugeTo(bar, { from: conf0 / 100, to: parseFloat(bar.getAttribute("data-frac")), value: q("ac-" + k + "-value"), dur: 0.8 });
  };
  var gapCount = function (d) {                     /* the gap's value counting from p to the result, riding the fill's end */
    var v = q("gap-v"), a = parseFloat(v.getAttribute("data-from")), b = parseFloat(v.textContent), x1 = parseFloat(v.getAttribute("x"));
    var f = q("gap-fill"), x0 = parseFloat(f.getAttribute("x"));
    return A.track(d, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u);
      v.textContent = (a + (b - a) * e).toFixed(1); v.setAttribute("x", (x0 + (x1 - x0) * e).toFixed(2));
    });
  };
  var lines = function (k) { return A.seq(shown("fl-" + k), A.type(q("fl-" + k).querySelectorAll("text"), { quick: true })); };
  var mark = function (k) { return A.seq(shown("ac-" + k + "-verdict"), A.write(q("ac-" + k + "-verdict"))); };
  var GREEN = "#3F8A4E";                             /* style.RIGHT: the deck's colour for a value that decides (the checklist's) */
  var tint = function (el) {                         /* a decisive value turns green, as the marker sweeps behind it */
    var f0 = el.getAttribute("fill");
    return A.track(0.5, function (u) { el.setAttribute("fill", u > 0 ? GREEN : f0); });
  };
  var decides = function (hl, el) { return A.seq(shown(hl), A.par(A.highlight(q(hl), { dur: 0.5 }), tint(el))); };
  var counted = function (el) { return A.seq(A.reveal(el, { dur: 0.01 }), A.count(el, { dur: 0.8 })); };
  var groupOf = function (g) {                       /* a bracket drawn; how many passes joined it, counted */
    return G("the group " + g, [
      L("its bracket", A.seq(shown("brk-" + g), A.draw(q("brk-" + g), { dur: 0.5 }))),
      [L("how many passes", counted(q("gn-" + g))), L("passes", A.seq(shown("gnk-" + g), key("gnk-" + g)))]]);
  };
  var peakOf = function (g) {                        /* its strongest pass's confidence lifts out of that pass's answer card */
    var m = q("gp-" + g);
    return A.seq(A.par(A.reveal(m, { dur: 0.2 }), A.move(m, { from: xy(m, "data-from"), to: [0, 0], dur: 0.8 })),
                 shown("gpk-" + g), key("gpk-" + g));
  };

  /* ---- the five steps, one per run ---- */
  var STEPS = [
    { look: focusOn([1], "pg1"),                                                                                     /* 6.1 PG-1 */
      act: [L("pass 1's ten passages land in the order met", land("pg1")), L("their keys", keysIn("pg1")),
            L("sorted: the kept nugget first", sort("pg1")), L("its first line as sent", line("pg1"))] },
    { look: focusOn([1, 2, 3, 4], "pg2", ["grp-sb", "grp-il"]),                                                      /* 6.2 PG-2 */
      act: [GRP.map(groupOf),
            GRP.map(function (g) { return L("the strongest pass of " + g, peakOf(g)); }),
            L("the higher one", decides("pk-hl", q("gp-" + D.win))),
            L("the other group, set aside", A.focus(P, { from: ix(focusOn([1, 2, 3, 4], "pg2", ["grp-sb", "grp-il"])),
                                                         to: ix(focusOn(D.groups[D.win], "pg2", ["grp-" + D.win])), dim: 0.3, dur: 0.6 })),
            L("its passages land, pooled", land("pg2")), L("their keys", keysIn("pg2")),
            L("sorted: the nuggets by entailment", sort("pg2")), L("its first line as sent", line("pg2"))],
      rest: focusOn(D.groups[D.win], "pg2", ["grp-" + D.win]) },
    { look: focusOn([1], "ac1"),                                                                                     /* 6.3 AC-1 */
      act: [routes("ac1"), L("pass 1's answer along it, into the card", rolls("ac1")), L("the card fills: 98", card("ac1", run("ac1").conf0)),
            L("the gap to 100, magnified", A.seq(shown("gap-ac1"), A.hide([q("gap-fill"), q("gap-v"), q("gap-k"), q("gap-g")], { dur: 0 }),
                                                 A.pop(q("gap-ac1"), { dur: 0.4 }))),
            L("45% of it fills", A.par(A.seq(A.reveal(q("gap-fill"), { dur: 0.01 }), A.grow(q("gap-fill"), { dur: 1.2 })),
                                       A.seq(shown("gap-v"), gapCount(1.2)))),
            L("its exact line", A.seq(shown("gap-k"), key("gap-k"), shown("gap-g"), key("gap-g"))),
            L("the gauge: 98 to 99", raise("ac1", run("ac1").conf0)), L("its lines as sent", lines("ac1")), L("the organisers' mark", mark("ac1"))] },
    { look: focusOn([1, 2, 3, 4], "ac2"),                                                                            /* 6.4 AC-2 */
      act: [routes("ac2"), L("each submission's confidence", A.par.apply(null, numsOf("ac2").map(counted))),
            L("the highest", decides("hl-ac2", q("nb-ac2-" + D.rolls.ac2[0]))),
            L("its answer along its line, into the card", rolls("ac2")),
            L("the card fills: Ilum 100", card("ac2")), L("its lines as sent", lines("ac2")), L("the organisers' mark", mark("ac2"))] },
    { look: focusOn([1, 2, 3, 4], "ac3"),                                                                            /* 6.5 AC-3 */
      act: [routes("ac3"), L("each submission's confidence", A.par.apply(null, numsOf("ac3").map(counted))),
            L("each answer's sum", A.par(counted(q("sum-sb")), counted(q("sum-il")))), L("the higher", decides("hl-ac3", q("sum-" + D.ac3))),
            L("capped at 100", A.seq(shown("cap-ac3"), key("cap-ac3"))),
            L("the winner's answers along its line, into the card", rolls("ac3")),
            L("the card fills: Ilum 100", card("ac3")), L("its lines as sent", lines("ac3")), L("the organisers' mark", mark("ac3"))] }
  ];
  var steps = STEPS.map(function (st, s) {
    var prev = s ? (STEPS[s - 1].rest || STEPS[s - 1].look) : null;
    var clear = s ? A.hide(EXPLAINS[s - 1], { dur: 0.35 }) : null;
    return { enter: A.groups({ name: "6." + (s + 1), layers: [
      [L("look", A.focus(P, { from: prev ? ix(prev) : null, to: ix(st.look), dim: 0.3, dur: 0.6 })),
       clear ? L("what the step before explained, cleared", clear) : null].filter(Boolean),
      { name: "act", layers: st.act }] }) };
  });

  return {
    entry: A.groups(tree),
    steps: steps,
    zones: { 1: "row-pg1", 2: "row-pg2", 3: "row-ac1", 4: "row-ac2", 5: "row-ac3" }   /* each run's row, to its step */
  };
});
