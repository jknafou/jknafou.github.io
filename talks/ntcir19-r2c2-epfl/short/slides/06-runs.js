/* Slide 6, short version (6s): the full slide's drawing, overview and five steps (slides/06-runs.js, validated and
   untouched), each step's parts started as soon as what they need is on screen.
   The author, 10 November 2026: "Slide 6 animation faster. (when I say faster, I mean more parallelization)."

   THE GRID is the full slide's (the .py header): the passes 100-617.5, the brackets 621-633, the middle 640-895, the
   runs 900-1500; the title's baseline 140, the side headings' 205; one top line 230, one bottom line 784.

   WHAT IS FASTER, AND HOW (more in parallel, not sped up): every motion is the full slide's own (anim/anim.js, the same
   arguments, the same durations); only when it starts changes. On the full slide each step is [look ‖ clear] → its act,
   the act a chain in which every part waits for the one before to end. Here:
     - the act starts with the look (the focus moving while the first part draws), as on short slide 5;
     - a part that does not need another's END starts with it, or at the moment it needs (a ball rolls once the
       branch it rides is drawn, while the arrow into the card is still drawing; a confidence counts on its branch as
       soon as the branch is there; the "entailment" key and each tile's key are typed as that tile lands, not after
       the last one; the line as sent starts halfway through the sort that puts its passage first; AC-1's gap pops as
       the card's gauge settles on 98, its exact line typed as 45% of it fills; the run's lines are typed as the gauge
       lands on their value; the mark is written as the lines are typed);
     - a part that reads another's result still waits for it (a sort for its keys, the highest for the counts it
       compares, a sum for its confidences, the card for the ball that brings its answer, the 45% fill for the gap).
   Parts that overlap are ONE LEAF (`at`: each part at its own offset, set as A.seq sets its own: not begun at its first
   state, latest first, then begun in order), so the groups rule holds on the layers around them.

   ENTRY ("6"), 5.36 s (the full one 7.38 s). The author, 10 November 2026, on it: "some overlaps and the documents
   animations (green) could be parallelized and get displayed when the tools are being loaded" (and on slide 2:
   "starting the AI box just before the first arrow finishes", an exception he made to "each layer waits for the one
   before"). The full slide's tree (its .py header) with two changes, same motions and durations, only earlier starts:
     - along every flow each layer but a group's last hands over LEAD = 0.2 s before its end: in the tree such a leaf
       counts its track's length less LEAD (a track shorter than LEAD counts 0), and the track plays on to its own end
       under the next layer's start (as on short slide 2);
     - a pass's kept nuggets (its green tiles popping, then their checks written together, with their scores keyed)
       start with its calls instead of after its answer:
       aside → [header ‖ the passes (heading → the four blocks together, each: [box ‖ passages] → [label ‖ question]
       → in → [{calls → out → answer → right or wrong} ‖ its kept nuggets]) ‖ the runs (heading → the five rows
       together, each: [name ‖ kind] → its frame or card → its places or its rule)].
   GROUPS of each step (S = the step before's rest):
     6.1 PG-1  [look ‖ "pass 1's ten passages land, each its key as it lands" (tile i at i × 0.12, its key typed as it
               lands, the "entailment" label with the first green key)] → ["sorted, its first line from the sort's middle"]
     6.2 PG-2  [look ‖ clear ‖ the group sb ‖ the group il ‖ "each group's strongest pass, as its bracket is drawn; the
               higher one, as the lifts land" (the peaks at 0.5, the sweep at their end - 0.2)]
               → [the other group, set aside ‖ "its passages land, pooled, each its key"] → ["sorted, its first line"]
     6.3 AC-1  [look ‖ clear ‖ "its link; pass 1's answer along it" (branch 0.7, arrow at 0.7, the ball at 0.7)]
               → ["the card fills: 98; the gap magnified as its gauge settles; 45% of it fills with its exact line;
                   the gauge 98 to 99 at the fill's end; its lines from the raise's middle; the mark at its end"]
     6.4 AC-2  [look ‖ clear ‖ "its links; each confidence on its branch; the highest; its answer along its line"]
               → ["the card fills: Ilum 100; its lines from 0.2 s before the gauge lands; the mark as they type"]
     6.5 AC-3  [look ‖ clear ‖ "its links; the confidences; each answer's sum; the higher ‖ capped at 100; the winner's
               answers along its line"] → ["the card fills: Ilum 100; its lines; the mark"]
   NUMBERS: the full slide's, in its data-runs (recomputed from the traces and asserted against the submitted files in
   slides/06-runs.py; the ones the steps show asserted again in this slide's .py).
   ZONES: each run's row, to its step (the full slide's).
   HOW THE FULL MAKER IS REACHED: as on short slides 2 and 5, the full slide's motion file is loaded just after this
   one; its Deck.slide call is caught here and not registered, and this maker calls it for its entry and its zones.
   The helpers below that the full maker keeps inside it (the explanations, the tiles, the routes, the card) are
   repeated here, with the same motions: they cannot be reached from outside it, and the full slide is not touched. */
(function () {
  "use strict";
  var ID = "06-runs", full = null, reg = Deck.slide;
  Deck.slide = function (id, make) {               /* the full slide's registration, caught once */
    if (id === ID && !full) { full = make; Deck.slide = reg; return; }
    reg(id, make);
  };
  reg(ID, function (A, q) {
    if (!full) throw new Error(ID + " (short): the full slide's motion file was not loaded after this one");
    var m = full(A, q);
    var D = JSON.parse(q("frames").getAttribute("data-runs"));
    var RUNS = D.runs, KEYS = RUNS.map(function (r) { return r.key; }), PASSES = [1, 2, 3, 4];
    var run = function (k) { return RUNS.filter(function (r) { return r.key === k; })[0]; };
    var key = function (n) { return A.type(q(n), { quick: true }); };
    var L = function (name, tr) { return { name: name, track: tr }; };
    var shown = function (n) { return A.reveal(q(n), { dur: 0.01 }); };
    var all = function (sel) { return [].slice.call(q.root.querySelectorAll(sel)); };
    var tilesOf = function (k) { var a = []; for (var j = 0; j < run(k).n; j++) a.push(q("pt-" + k + "-" + j)); return a; };
    var keysOf = function (k) { var a = [q("ek-" + k)]; for (var j = 0; j < run(k).n; j++) a.push(q("ptk-" + k + "-" + j)); return a; };
    var ballsOf = function (k) { return D.rolls[k].map(function (p) { return q("tk-" + k + "-" + p); }); };
    var numsOf = function (k) { return PASSES.map(function (p) { return q("nb-" + k + "-" + p); }); };
    var GRP = ["sb", "il"];
    var grpParts = function (g) { return all('[data-a="grp-' + g + '"] > *'); };

    /* ---- parts at their own offsets, in one leaf ([[t, track], ...]); set as A.seq sets its own ---- */
    function at(parts) {
      parts = parts.filter(function (p) { return p[1]; });
      var dur = Math.max.apply(null, parts.map(function (p) { return p[0] + p[1].dur; }));
      return { dur: dur, set: function (t) {
        for (var i = parts.length - 1; i >= 0; i--) if (parts[i][0] > t) parts[i][1].set(t - parts[i][0]);
        for (var j = 0; j < parts.length; j++) if (parts[j][0] <= t) parts[j][1].set(t - parts[j][0]);
      } };
    }

    /* ---- what each step explains, cleared as the next one starts (the full maker's) ---- */
    var EXPLAINS = [
      keysOf("pg1"),
      keysOf("pg2").concat(grpParts("sb"), grpParts("il")),
      [q("gap-ac1"), q("lines-ac1")].concat(ballsOf("ac1")),
      numsOf("ac2").concat([q("hl-ac2"), q("lines-ac2")], ballsOf("ac2")),
      numsOf("ac3").concat([q("sum-sb"), q("sum-il"), q("hl-ac3"), q("cap-ac3"), q("lines-ac3")], ballsOf("ac3"))
    ];

    /* ---- the parts A.focus dims and lights (the full maker's) ---- */
    var NAMES = ["head", "have-h", "sub-h", "blk1", "blk2", "blk3", "blk4", "grp-sb", "grp-il"]
      .concat(KEYS.map(function (k) { return "row-" + k; }));
    var P = NAMES.map(q);
    var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 6s: no part " + k); return i; }); };
    var blk = function (ps) { return ps.map(function (p) { return "blk" + p; }); };
    var focusOn = function (ps, k, more) { return blk(ps).concat(["row-" + k], more || []); };

    /* ---- the motions a run is made by (the full maker's, the same arguments) ---- */
    var xy = function (el, a) { return el.getAttribute(a).split(",").map(Number); };
    var routes = function (k) {         /* its links: [shown, branches and bus 0.7] at 0, the dots and the arrow at 0.7 */
      var R = all('[data-a="lines-' + k + '"] > [data-a^="ln-' + k + '-"]'), Dt = all('[data-a="lines-' + k + '"] > [data-a^="dot-' + k + '-"]');
      return [[0, A.seq(shown("lines-" + k), A.draw(R, { dur: 0.7 }))], [0.71, Dt.length ? A.pop(Dt, { dur: 0.3 }) : null],
              [0.71, A.flow(q("arw-" + k), { dur: 0.4 })]];
    };
    var landKeyed = function (k) {      /* each tile from its pass's strip to its place, one after another; its key typed as it lands */
      var T = tilesOf(k), K = keysOf(k), gap = run(k).n > 10 ? 0.08 : 0.12, label = false, parts = [];
      T.forEach(function (t, i) {
        var kk = K[i + 1], green = kk.getAttribute("fill") === "#3F8A4E";
        parts.push([i * gap, A.par(A.reveal(t, { dur: 0.15 }), A.move(t, { from: xy(t, "data-from"), to: xy(t, "data-land"), dur: 0.7 }))]);
        parts.push([i * gap + 0.7, A.seq(A.reveal(kk, { dur: 0.01 }), A.type(kk, { quick: true }))]);
        if (green && !label) { label = true; parts.push([i * gap + 0.7, A.seq(A.reveal(K[0], { dur: 0.01 }), A.type(K[0], { quick: true }))]); }
      });
      if (!label) throw new Error("slide 6s: " + k + " has no kept nugget to label");
      return at(parts);
    };
    var sort = function (k) {
      var T = tilesOf(k).filter(function (t) { return xy(t, "data-land")[0] !== 0; });
      return A.par.apply(null, T.map(function (t) { return A.move(t, { from: xy(t, "data-land"), to: [0, 0], dur: 0.9 }); }));
    };
    var line = function (k) { return A.seq(shown("fl-" + k), A.type(q("fl-" + k), { quick: true })); };
    var sortThenLine = function (k) { var s = sort(k); return at([[0, s], [s.dur / 2, line(k)]]); };
    var rolls = function (k) {
      return A.par.apply(null, D.rolls[k].map(function (p) {
        var b = q("tk-" + k + "-" + p);
        return A.seq(A.reveal(b, { dur: 0.15 }), A.travel(b, { along: [q("gd-" + k + "-" + p), q("arw-" + k)], into: q("ac-" + k), dur: 1.4 }));
      }));
    };
    var card = function (k, conf0) {    /* the ruled card fills: its rule lifted, the answer thought and typed, its gauge */
      var c = "ac-" + k, bar = q(c + "-bar"), val = q(c + "-value");
      var gauge = conf0 == null ? A.fill(bar, { value: val }) : A.fillTo(bar, { frac: conf0 / 100, shown: conf0, value: val });
      var texts = q(c + "-text").querySelectorAll("text");
      return A.seq(A.reverse(A.draw(q(c + "-ph"), { dur: 0.3 })), shown(c + "-text"), A.think(texts[0], { dur: 0.6 }),
                   A.type(texts, { quick: true }), gauge);
    };
    var raise = function (k, conf0) {
      var bar = q("ac-" + k + "-bar");
      return A.gaugeTo(bar, { from: conf0 / 100, to: parseFloat(bar.getAttribute("data-frac")), value: q("ac-" + k + "-value"), dur: 0.8 });
    };
    var gapCount = function (d) {
      var v = q("gap-v"), a = parseFloat(v.getAttribute("data-from")), b = parseFloat(v.textContent), x1 = parseFloat(v.getAttribute("x"));
      var f = q("gap-fill"), x0 = parseFloat(f.getAttribute("x"));
      return A.track(d, function (u) {
        var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u);
        v.textContent = (a + (b - a) * e).toFixed(1); v.setAttribute("x", (x0 + (x1 - x0) * e).toFixed(2));
      });
    };
    var lines = function (k) { return A.seq(shown("fl-" + k), A.type(q("fl-" + k).querySelectorAll("text"), { quick: true })); };
    var mark = function (k) { return A.seq(shown("ac-" + k + "-verdict"), A.write(q("ac-" + k + "-verdict"))); };
    var GREEN = "#3F8A4E";
    var tint = function (el) {
      var f0 = el.getAttribute("fill");
      return A.track(0.5, function (u) { el.setAttribute("fill", u > 0 ? GREEN : f0); });
    };
    var decides = function (hl, el) { return A.seq(shown(hl), A.par(A.highlight(q(hl), { dur: 0.5 }), tint(el))); };
    var counted = function (el) { return A.seq(A.reveal(el, { dur: 0.01 }), A.count(el, { dur: 0.8 })); };
    var groupOf = function (g) {
      return { name: "the group " + g, layers: [
        L("its bracket", A.seq(shown("brk-" + g), A.draw(q("brk-" + g), { dur: 0.5 }))),
        [L("how many passes", counted(q("gn-" + g))), L("passes", A.seq(shown("gnk-" + g), key("gnk-" + g)))]] };
    };
    var peakOf = function (g) {
      var mm = q("gp-" + g);
      var lift = A.par(A.reveal(mm, { dur: 0.2 }), A.move(mm, { from: xy(mm, "data-from"), to: [0, 0], dur: 0.8 }));
      return A.seq(lift, shown("gpk-" + g), key("gpk-" + g));
    };
    /* the card, then what reads it: the run's lines from just before its gauge settles (its value typed as it lands),
       the mark written as they are typed */
    var cardOn = function (k) {
      var c = card(k);
      return at([[0, c], [c.dur - 0.2, lines(k)], [c.dur, mark(k)]]);
    };

    /* ---- the overview's entry, its parts handing over early (the author, 10 November 2026, on this entry: "some
       overlaps and the documents animations (green) could be parallelized and get displayed when the tools are being
       loaded"; and on slide 2: "starting the AI box just before the first arrow finishes"): along every flow, each
       layer but a group's last hands over LEAD s before its end (its leaf counts its track's length less LEAD, and the
       track plays on to its own end under the next one's start: same motions, same durations, only earlier starts);
       a pass's kept nuggets (its green tiles, their checks, their scores) start with its calls, not after its answer,
       the checks of one pass written together ---- */
    var LEAD = 0.2;
    var early = function (tr) { return { dur: Math.max(0, tr.dur - LEAD), set: function (t) { tr.set(t); } }; };
    var E = function (name, tr) { return L(name, early(tr)); };
    var ACS = KEYS.filter(function (k) { return run(k).kind === "AC"; }), PRS = KEYS.filter(function (k) { return run(k).kind === "PR"; });
    var later = [].concat.apply([], EXPLAINS).concat(           /* what the steps bring, set aside first (the full maker's) */
      [].concat.apply([], PRS.map(function (k) { return tilesOf(k).concat([q("fl-" + k)]); })),
      [].concat.apply([], ACS.map(function (k) { return [q("ac-" + k + "-text"), q("ac-" + k + "-value"), q("ac-" + k + "-verdict"), q("fl-" + k)]; })));
    var bars = ACS.map(function (k) { return A.hold(A.fill(q("ac-" + k + "-bar"), { value: q("ac-" + k + "-value") }), 0.01, 0); });
    var aside = A.par.apply(null, [A.hide(later, { dur: 0 })].concat(bars));
    function block(p) {                 /* slide 5's pass box read along its flow; its kept nuggets beside its calls */
      var ln = "lane" + p, checks = all('[data-a="greens' + p + '"] [data-verdict]');
      return { name: "pass " + p, layers: [
        [E("its box", A.pop(q(ln + "-frame"), { dur: 0.4 })), E("its passages", A.enter(q("strip" + p)))],
        [E("its label", key(ln + "-label")), E("its question", A.enter(q(ln + "-q")))],
        E("in", A.flow(q(ln + "-p1"), { dur: 0.35 })),
        [{ name: "its flow on", layers: [
           E("its calls", A.seq(A.pop(q(ln + "-chips"), { dur: 0.35 }), A.par(key(ln + "-calls"), key(ln + "-ret")))),
           E("out", A.flow(q(ln + "-p2"), { dur: 0.35 })),
           E("its answer", A.pace(A.enter(q(ln + "-a")), 1.5)),
           L("right or wrong", A.write(q("lv" + p)))] },
         L("its kept nuggets, as its calls load", A.seq(A.pop(q("greens" + p), { dur: 0.35 }),
           A.par(A.par.apply(null, checks.map(function (c) { return A.write(c); })), key("scores" + p))))]] };
    }
    function row(k) {                   /* a run, empty: its name, then its empty frame or card */
      var r = run(k), name = [E("its name", A.flip(q("nm-" + k))), E("its kind", key("kind-" + k))];
      if (r.kind === "PR")
        return { name: k, layers: [name, E("its frame", A.reveal(q("fr-" + k), { dur: 0.35 })),
                                   [L("its 20 places", A.pop(q("pl-" + k), { dur: 0.4 })), L("at most 20", key("cap-" + k))]] };
      return { name: k, layers: [name, E("its card", A.pop(q("ac-" + k), { dur: 0.4 })), L("ruled", A.draw(q("ac-" + k + "-ph"), { dur: 0.4 }))] };
    }
    var entry = A.groups({ name: "slide", layers: [
      L("aside", aside),
      [L("header", key("head")),
       { name: "the passes", layers: [E("heading", key("have-h")), PASSES.map(block)] },
       { name: "the runs", layers: [E("heading", key("sub-h")), KEYS.map(row)] }]] });

    /* ---- the five steps, one per run ---- */
    var setAside = A.focus(P, { from: ix(focusOn([1, 2, 3, 4], "pg2", ["grp-sb", "grp-il"])),
                                to: ix(focusOn(D.groups[D.win], "pg2", ["grp-" + D.win])), dim: 0.3, dur: 0.6 });
    var peaks = (function () {
      var a = peakOf("sb"), b = peakOf("il"), lifted = 0.5 + 0.8;
      return at([[0.5, a], [0.5, b], [lifted - 0.2, decides("pk-hl", q("gp-" + D.win))]]);
    })();
    var ac1 = (function () {
      var c = card("ac1", run("ac1").conf0);
      var pop = A.seq(shown("gap-ac1"), A.hide([q("gap-fill"), q("gap-v"), q("gap-k"), q("gap-g")], { dur: 0 }), A.pop(q("gap-ac1"), { dur: 0.4 }));
      var f0 = c.dur;                   /* the gap pops as the card's gauge settles on 98, and fills from there */
      var fill = A.par(A.seq(A.reveal(q("gap-fill"), { dur: 0.01 }), A.grow(q("gap-fill"), { dur: 1.2 })), A.seq(shown("gap-v"), gapCount(1.2)));
      var exact = A.seq(shown("gap-k"), key("gap-k"), shown("gap-g"), key("gap-g"));
      var r0 = Math.max(c.dur, f0 + fill.dur), up = raise("ac1", run("ac1").conf0);
      return at([[0, c], [f0 - pop.dur, pop], [f0, fill], [f0, exact], [r0, up], [r0 + up.dur / 2, lines("ac1")], [r0 + up.dur, mark("ac1")]]);
    })();
    var choose = function (k, pre) {    /* links, the confidences on their branches at 0.71, then what decides, then the balls */
      var nums = A.par.apply(null, numsOf(k).map(counted)), t = 0.71 + nums.dur, parts = routes(k).concat([[0.71, nums]]);
      (pre || []).forEach(function (p) { parts.push([t, p]); t += p.dur; });
      return { parts: parts, t: t };
    };
    var ac2 = (function () {
      var c = choose("ac2"), hl = decides("hl-ac2", q("nb-ac2-" + D.rolls.ac2[0]));
      return at(c.parts.concat([[c.t, hl], [c.t + 0.25, rolls("ac2")]]));
    })();
    var ac3 = (function () {
      var c = choose("ac3", [A.par(counted(q("sum-sb")), counted(q("sum-il")))]);
      var hl = decides("hl-ac3", q("sum-" + D.ac3)), cap = A.seq(shown("cap-ac3"), key("cap-ac3"));
      return at(c.parts.concat([[c.t, hl], [c.t, cap], [c.t + 0.25, rolls("ac3")]]));
    })();
    var ac1in = at(routes("ac1").concat([[0.71, rolls("ac1")]]));

    var STEPS = [
      { look: focusOn([1], "pg1"),                                                                                     /* 6.1 PG-1 */
        first: [L("pass 1's ten passages land in the order met, each its key as it lands", landKeyed("pg1"))],
        then: [L("sorted, the kept nugget first; its first line as sent from the sort's middle", sortThenLine("pg1"))] },
      { look: focusOn([1, 2, 3, 4], "pg2", ["grp-sb", "grp-il"]),                                                      /* 6.2 PG-2 */
        first: GRP.map(groupOf).concat([L("each group's strongest pass, as its bracket is drawn; the higher one", peaks)]),
        then: [[L("the other group, set aside", setAside), L("its passages land, pooled, each its key as it lands", landKeyed("pg2"))],
               L("sorted, the nuggets by entailment; its first line as sent from the sort's middle", sortThenLine("pg2"))],
        rest: focusOn(D.groups[D.win], "pg2", ["grp-" + D.win]) },
      { look: focusOn([1], "ac1"),                                                                                     /* 6.3 AC-1 */
        first: [L("its link; pass 1's answer along it, into the card", ac1in)],
        then: [L("the card fills: 98; the gap magnified, 45% of it with its exact line; the gauge 98 to 99; its lines; the mark", ac1)] },
      { look: focusOn([1, 2, 3, 4], "ac2"),                                                                            /* 6.4 AC-2 */
        first: [L("its links; each submission's confidence; the highest; its answer along its line", ac2)],
        then: [L("the card fills: Ilum 100; its lines as the gauge settles; the mark", cardOn("ac2"))] },
      { look: focusOn([1, 2, 3, 4], "ac3"),                                                                            /* 6.5 AC-3 */
        first: [L("its links; the confidences; each answer's sum; the higher, capped at 100; its answers along its line", ac3)],
        then: [L("the card fills: Ilum 100; its lines as the gauge settles; the mark", cardOn("ac3"))] }
    ];
    var steps = STEPS.map(function (st, s) {
      var prev = s ? (STEPS[s - 1].rest || STEPS[s - 1].look) : null;
      var clear = s ? A.hide(EXPLAINS[s - 1], { dur: 0.35 }) : null;
      return { enter: A.groups({ name: "6." + (s + 1), layers: [
        [L("look", A.focus(P, { from: prev ? ix(prev) : null, to: ix(st.look), dim: 0.3, dur: 0.6 })),
         clear ? L("what the step before explained, cleared", clear) : null].concat(st.first).filter(Boolean),
        { name: "act", layers: st.then }] }) };
    });

    return { entry: entry, steps: steps, zones: m.zones };
  });
})();
