/* Slide 5, short version (5s): the full slide's drawing and its two stops off the passes (slides/05-other-passes.js,
   validated and untouched), the overview run on into pass 1, each pass's calls overlapping, no fallbacks.
   The author, 10 November 2026: "Then 5 and 5.1 merged. All the passes cycle with a faster animation. 5.7, 5.8 gone.
   [...] (when I say faster, I mean more parallelization)."

   THE GRID is the full slide's (the .py header): title baseline 140 at 100; the DB x 100-626, y 200-557; the maquette
   (slide 4 at 0.6) to x 1500, its bands from y 190; the four pass boxes a 2 x 2 grid, x 100-790 | 810-1500, from y 586.

   WHAT IS FASTER, AND HOW (more in parallel, not sped up): on the full slide a pass's calls are sequential layers, each
   waiting for the one before to end (and 0.1-0.25 s more); here they are ONE leaf in which every call starts GAP =
   0.3 s after the one before, in the trace's order, and plays its own motions to their end over the next calls': its
   chip popping, the calls and passages-retrieved counts, its tiles lit in the DB (a tile listed again blinks), a nugget
   kept (green, its check and its scene) or turned back (red, its cross), the check's counts. GAP is the counts' own
   0.3 s recount, so a count is never moved by two calls at once. The steps' look (camera ‖ focus ‖ put away) starts
   with the act's first layer instead of before it, and the answer goes out at the exit and into its pass box together.
   Every motion is the full slide's own (anim/anim.js, the same arguments): only when they start changes.

   GROUPS (A.groups), each pass's act (pass p):
       [look (the camera ‖ the focus ‖ what the step before left, put away) ‖ the passes before (withheld, put away,
        "withheld N", the check's counts back to 0; pass 1: the check's counts keyed) ‖ the question box (its box →
        its arrow in) ‖ its calls and passages retrieved, from 0]
     → its calls (one leaf: call i at i x GAP)
     → the gate's verdict (its reading counted, its tick)
     → [the answer at the exit ‖ in its pass box (the arrow out → the answer)]
   ENTRY ("5", the full 5 and 5.1): the full slide's entry tree (the full .py header: aside → [header ‖ maquette ‖
     lanes]; maquette: [question ‖ type ‖ DB] → l-q → [the model's band ‖ the orchestrator's band] → their links →
     l-ans → the answer exit), rebuilt here with the same leaves and durations but OVERLAPPED (the author, 10 November
     2026: "Same for the 5 slide loading, it could be faster with some overlap"): in every group each layer hands over
     LEAD = 0.2 s before its end, as on short 2; then → pass 1's act (handed over LEAD early too), its look the focus
     from the overview to pass 1. Overview 8.17 s → 6.77 s.
   STEPS: 5.1 pass 2, 5.2 pass 3, each state → act; 5.3 the passage that brings Ilum in = the full 5.4's motions and loop without
     the NLI line (state → look (camera ‖ focus) → the passage, large → its span swept, its nugget, MiniCheck 0.98);
     5.4 pass 4 (its look: the camera back from the passage's row to the whole slide, the passage's card put away);
     5.5 our evaluation = the full 5.6's enter. The full 5.7-5.8 (the fallbacks) are not reached.
   Each rest is the full slide's rest one position later (the full steps' state is carried: the DB's lit, kept and
   turned-back tiles, the check's counts), so the full 5.4 and 5.6 start here from exactly what they start from there.
   NUMBERS: the trace's, through the full slide's data-tiles (events_json, asserted against journeys/q0060.json there,
   and in this slide's .py).
   ZONES: the pass boxes 2-4 (steps 1, 2, 4); pass 1 is the overview's own, which a zone cannot name.
   HOW THE FULL MAKER IS REACHED: as on short slide 2, the full slide's motion file is loaded just after this one; its
   Deck.slide call is caught here and not registered, and this maker calls it for its 5.6. The
   helpers below that the full maker keeps inside it (the DB's tiles, the counts, the focus parts) are repeated here:
   they cannot be reached from outside it, and the full slide is not touched. */
(function () {
  "use strict";
  var ID = "05-other-passes", full = null, reg = Deck.slide;
  Deck.slide = function (id, make) {               /* the full slide's registration, caught once */
    if (id === ID && !full) { full = make; Deck.slide = reg; return; }
    reg(id, make);
  };
  reg(ID, function (A, q) {
    if (!full) throw new Error(ID + " (short): the full slide's motion file was not loaded after this one");
    var m = full(A, q), S = m.steps;
    var F = JSON.parse(q("frames").getAttribute("data-frames")), T = JSON.parse(q("frames").getAttribute("data-tiles"));
    var key = function (n) { return A.type(q(n), { quick: true }); };
    var fl = function (n) { return A.flow(q(n), { dur: 0.45 }); };
    var tools = ["search", "read", "extract", "record", "submit"];
    var each = function (f) { return tools.map(f); };
    var L = function (name, tr) { return { name: name, track: tr }; };
    var G = function (name, layers) { return { name: name, layers: layers.filter(Boolean) }; };
    var PASSES = [1, 2, 3, 4], GAP = 0.3;

    /* ---- the full maker's parts, as it names them ---- */
    var CARDS = ["pskb-at"].concat([].concat.apply([], T.det.c3.n.map(function (x) { return [x + "-at", x + "-why"]; })));
    var NAMES = ["head", "q-card", "l-q", "qtype", "model", "tr"]
      .concat(each(function (k) { return "t-" + k; }), each(function (k) { return "call-" + k; }), each(function (k) { return "res-" + k; }))
      .concat(["l-type", "stub-search", "stub-read", "stub-extract", "bus", "bus5", "bus-dots", "l-every", "orch", "check", "gate",
               "rec", "l-ck", "l-rg", "l-rc", "l-cr", "l-sg", "l-gs", "l-ans", "ans", "db-blk5", "lane1", "lane2", "lane3", "lane4", "lvs"]);
    var P = NAMES.map(q);
    var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 5s: no part " + k); return i; }); };
    var ORCH = ["check", "l-rc", "l-cr", "rec", "l-ck"];
    var GATE = ["gate", "l-sg", "l-gs", "l-rg", "l-ans", "ans"];
    var DET = ORCH.concat(GATE, ["tr", "t-record", "call-record", "res-record", "t-submit", "call-submit", "res-submit"]);
    var SUM = function (p) { return ["db-blk5", "lane" + p, "check", "gate", "l-ans", "ans"]; };
    /* the parts of the full slide's journey (its 5.4 card, its gold, its fallbacks) that a step's state hides: the
       ones this slide can have shown are 5.4's card (CARDS) and 5.6's gold; the fallbacks are never shown here */
    var JOURNEY = ["gold", "db-sum"].concat(CARDS);
    function state(shown) {
      var Sh = shown.map(q);
      return { dur: 0, set: function (t) {
        if (t < 0) return;
        JOURNEY.forEach(function (k) { var e = q(k); e.style.opacity = Sh.indexOf(e) >= 0 ? "" : "0"; });
      } };
    }

    /* ---- the DB's tiles, pass by pass (the full maker's, the same motions) ---- */
    var band = function (j) { return q("ty" + j); };
    var LIT = {}, OK = {}, NO = {};                   /* followed as the steps are made, in order */
    var blink = function (b) { return A.track(0.45, function (u) { b.style.opacity = u <= 0 || u >= 1 ? "" : (0.25 + 0.75 * Math.abs(Math.cos(Math.PI * u))).toFixed(3); }); };
    var lightTiles = function (js) {
      var seen = {};
      return A.stagger(js.filter(function (j) { if (seen[j]) return false; seen[j] = 1; return true; }), function (j) {
        var t = LIT[j] ? blink(band(j)) : A.highlight(band(j), { dur: 0.25 }); LIT[j] = 1; return t;
      }, 0.04);
    };
    var green = function (j) { OK[j] = 1; return A.seq(A.reveal(q("tok" + j), { dur: 0.3 }), A.write(q("tk" + j + "-tick"))); };
    var red = function (j) { NO[j] = 1; return A.seq(A.reveal(q("tno" + j), { dur: 0.3 }), A.write(q("tx" + j + "-tick"))); };
    var withhold = function (p) {
      var js = [].concat.apply([], PASSES.filter(function (x) { return x < p; }).map(function (x) { return T.pass[x]; }));
      var prev = T.pass[p - 1] || [];
      var fade = A.track(0.6, function (u) { var e = A.ease.io(u); js.forEach(function (j) { if (T.pass[p - 1].indexOf(j) >= 0) band(j).style.opacity = (1 - 0.62 * e).toFixed(3); }); });
      var away = [].concat.apply([], prev.map(function (j) { return (OK[j] ? [q("tok" + j)] : []).concat(NO[j] ? [q("tno" + j)] : []); }));
      return A.par(fade, away.length ? A.hide(away, { dur: 0.4 }) : null);
    };
    var RET = 0;
    var recount = function (n, a, b, d) { return A.recount(q(n), { from: a, to: b, dur: d || 0.3 }); };
    var CK = [0, 0];                                  /* the check's two counts, NUGGETS kept and turned back */
    var ckTo = function (ok, no) {
      var t = A.par(ok !== CK[0] ? recount("ck-ok", CK[0], ok) : null, no !== CK[1] ? recount("ck-no", CK[1], no) : null);
      CK = [ok, no]; return t;
    };
    var gateSays = function (g) { return A.seq(A.reveal(q(g), { dur: 0.3 }), A.count(q(g + "-reading"), { dur: 0.7 }), A.write(q(g + "-verdict"))); };

    /* ---- tracks that overlap: track i starts at i x gap, each plays to its own end; set as A.seq sets its own (those
       not begun at their first state, latest first, then those begun in order), so a later call's first state never
       hides an earlier call's motion on the same element ---- */
    function overlap(ts, gap) {
      var at = ts.map(function (_, i) { return i * gap; });
      var dur = Math.max.apply(null, ts.map(function (x, i) { return at[i] + x.dur; }));
      return { dur: dur, set: function (t) {
        for (var i = ts.length - 1; i >= 0; i--) if (at[i] > t) ts[i].set(t - at[i]);
        for (var j = 0; j < ts.length; j++) if (at[j] <= t) ts[j].set(t - at[j]);
      } };
    }

    /* ---- a pass, faster: its look and what the passes before left with its question box, its calls overlapping,
       the gate, its answer at the exit and in its box together ---- */
    function pass(p, look) {
      var E = T.ev[p], ln = "lane" + p;
      RET = 0;
      var before = p > 1 ? [
        L("the passes before: withheld", withhold(p)),
        L("what the pass before left, put away", A.hide([q("g" + (p - 1)), q("a" + (p - 1))].concat(p > 2 ? [q("wh" + (p - 1))] : []), { dur: 0.35 })),
        L("withheld " + [].concat.apply([], PASSES.filter(function (x) { return x < p; }).map(function (x) { return T.pass[x]; })).length,
          A.seq(A.reveal(q("wh" + p), { dur: 0.01 }), key("wh" + p))),
        L("the check's counts back to 0", ckTo(0, 0))] : [
        L("the check's counts", A.seq(A.reveal(q("ck"), { dur: 0.01 }), A.par(key("ck-ok"), key("ck-no"))))];
      var calls = E.map(function (r, i) {
        var parts = [A.pop(q(ln + "-c" + r.c), { dur: 0.35 }), recount(ln + "-calls", i, i + 1)];
        if (r.ret !== RET) { parts.push(recount(ln + "-ret", RET, r.ret)); RET = r.ret; }
        if (r.lit.length) parts.push(lightTiles(r.lit));
        r.no.forEach(function (j) { parts.push(red(j)); });
        r.ok.forEach(function (j) { parts.push(green(j)); });
        if (r.n_ok !== CK[0] || r.n_no !== CK[1]) parts.push(ckTo(r.n_ok, r.n_no));
        return A.par.apply(null, parts);
      });
      return [
        [look].concat(before, [
          G("the question box", [L("box", A.enter(q(ln + "-q"))), L("in", fl(ln + "-p1"))]),
          L("its calls and passages retrieved, from 0", A.seq(A.reveal([q(ln + "-calls"), q(ln + "-ret")], { dur: 0.01 }),
                                                               recount(ln + "-calls", 0, 0, 0.01), recount(ln + "-ret", 0, 0, 0.01)))]).filter(Boolean),
        L("its " + E.length + " calls, in the trace's order, each " + GAP + " s after the one before", overlap(calls, GAP)),
        L("the gate's verdict", gateSays("g" + p)),
        [L("the answer at the exit", A.pace(A.enter(q("a" + p)), 1.5)),
         G("the answer in its box", [L("out", fl(ln + "-p2")), L("the answer", A.pace(A.enter(q(ln + "-a")), 1.5))])]];
    }
    var focus = function (from, to, dur) { return A.focus(P, { from: from ? ix(from) : null, to: ix(to), dim: 0.3, dur: dur || 0.45 }); };
    var step = function (name, shown, act) {
      return A.groups({ name: name, layers: [L("state", state(shown)), { name: "act", layers: act }] });
    };

    /* ---- the overview: the full slide's entry tree (its .py header), every leaf and duration the same, with
       overlap. The author, 10 November 2026, on short 5: "Same for the 5 slide loading, it could be faster with some
       overlap" (as on short 2: "starting the AI box just before the first arrow finishes"): in every group, each
       layer but the last hands over LEAD s before its end (its leaves' length in the tree is their track's less
       LEAD, the track playing on to its own end under the next layer's start). A leaf shorter than 2 x LEAD keeps its
       length. Same motions, same durations, only earlier starts. ---- */
    var LEAD = 0.2;
    var early = function (tr) { return tr.dur > 2 * LEAD ? { dur: tr.dur - LEAD, set: function (t) { tr.set(t); } } : tr; };
    function handOver(nd) {                     /* a layer's end brought LEAD earlier: its leaves', or its last layer's */
      if (Array.isArray(nd)) return nd.filter(Boolean).map(handOver);
      if (nd.layers) { var ls = nd.layers.filter(Boolean); return { name: nd.name, layers: ls.slice(0, -1).concat([handOver(ls[ls.length - 1])]) }; }
      return { name: nd.name, track: early(nd.track) };
    }
    function overlapped(nd) {                   /* every group's layers but its last handed over early, all the way down */
      if (Array.isArray(nd)) return nd.filter(Boolean).map(overlapped);
      if (nd.layers) {
        var ls = nd.layers.filter(Boolean).map(overlapped);
        return { name: nd.name, layers: ls.map(function (l, i) { return i < ls.length - 1 ? handOver(l) : l; }) };
      }
      return nd;
    }
    /* what the full entry's first layer puts aside: its whole journey, the fallbacks' parts included (the full maker's
       names, repeated) */
    var FN = T.fbn, ALL4 = [1, 2, 3, 4], LANE_PARTS = ["-q", "-p1", "-chips", "-calls", "-ret", "-p2", "-a"];
    var laneParts = function (c, p, had) { return had ? LANE_PARTS.map(function (k) { return c + "lane" + p + k; }) : [c + "lane" + p + "-none"]; };
    var caseNames = function (c, had, marks, extra) {
      return [c + "-head", c + "-gold", c + "db-wh", c + "db-lit"].concat(extra, marks,
        [].concat.apply([], ALL4.map(function (p) { return [c + "lane" + p].concat(laneParts(c, p, p <= had)); })));
    };
    var titleNames = function (t) { return ["", "-name", "-tag", "-n", "-unit", "-more"].map(function (k) { return t + k; }); };
    var FB7 = ["head2"].concat(caseNames("b", FN.bcase, FN.bt, []), ["blane" + FN.bcase + "-e", "bq-at"], titleNames("ftb"))
      .filter(function (k) { return k !== "blane" + FN.bcase + "-a"; });
    var FB8 = ["bqt", "bqt-k", "bns", "gtb1", "gk-l", "cf1", "cf-feed", "gk1-at", "gk1", "bo", "bo-st"];
    var FB9 = ["bt", "bn", "bns2", "cf-feed2"].concat(FN.bt2, ["gtb2", "cf2", "gk2-at", "gk2", "ab", "blane" + FN.bcase + "-a"]);
    var ASIDE = JOURNEY.concat(FB7, FB8, FB9);
    var overview = overlapped({ name: "the overview", layers: [
      L("aside", A.hide(ASIDE.map(q), { dur: 0 })),
      [L("header", key("head")),
       G("maquette", [
         [L("question", A.enter(q("q-card"))), L("type", A.enter(q("qtype"))),
          G("passages DB", [L("its name", key("db5-name")), L("its tiles", A.enter(q("db5")))])],
         L("l-q", fl("l-q")),
         [G("the model's band", [
            [L("band", A.enter(q("model"))), L("transcript", A.enter(q("tr")))].concat(each(function (k) { return L("t-" + k, A.enter(q("t-" + k))); })),
            each(function (k) { return L("call-" + k, fl("call-" + k)); }).concat(each(function (k) { return L("res-" + k, fl("res-" + k)); }))]),
          G("the orchestrator's band", [
            [L("band", A.enter(q("orch"))), L("check", A.enter(q("check"))), L("gate", A.enter(q("gate"))), L("record", A.enter(q("rec")))],
            [L("l-ck", fl("l-ck")), L("l-rg", fl("l-rg"))]])],
         [L("l-type", fl("l-type")),
          G("the bus into the DB", [L("stubs", A.par.apply(null, ["stub-search", "stub-read", "stub-extract"].map(function (k) { return A.draw(q(k), { dur: 0.4 }); }))),
                                    L("bus", A.draw([q("bus"), q("bus5")], { dur: 0.5 })), L("dots", A.pop(q("bus-dots"), { dur: 0.3 }))]),
          L("l-every", fl("l-every")), L("l-rc", fl("l-rc")), L("l-cr", fl("l-cr")), L("l-sg", fl("l-sg")), L("l-gs", fl("l-gs"))],
         L("l-ans", fl("l-ans")),
         L("answer exit", A.enter(q("ans")))]),
       G("lanes", [PASSES.map(function (p) { return L("lane " + p, A.seq(A.pop(q("lane" + p + "-frame"), { dur: 0.4 }), key("lane" + p + "-label"))); })])]] });

    /* ---- in order, as the full maker makes them: the tiles' and the counts' state follows ---- */
    var entry = A.groups({ name: "slide", layers: [
      handOver(overview),                       /* pass 1 too starts LEAD before the overview's last part ends */
      { name: "pass 1", layers: pass(1, L("look: the focus on pass 1", focus(null, SUM(1)))) }] });
    var s1 = step("5.1", [], pass(2, L("look: the focus on pass 2", focus(SUM(1), SUM(2)))));
    var s2 = step("5.2", [], pass(3, L("look: the focus on pass 3", focus(SUM(2), SUM(3)))));
    /* 5.3, the passage that brings Ilum in: the full 5.4's motions, without the NLI line under the nugget (the
       author, 10 November 2026: "5.3: you can remove the NLI model, then deberta, this is a fall back, just the nugget
       box with the minicheck"). Its nugget, "Starkiller Base was built on the ice planet Ilum", was scored by
       MiniCheck alone: rule minicheck_default, score 0.9801 = MiniCheck's base 0.9801, outside the unsure band
       0.20-0.80, so DeBERTa's entailment (0.9985) was never averaged in (journeys/q0060.json, pass 3 turn 6; asserted
       in this slide's .py). The nugget box shows MiniCheck and its gauge, 0.98, and its tick. The line's group
       (<nugget>-why) is kept hidden on every step. */
    var WHY = T.det.c3.n.map(function (x) { return x + "-why"; });
    var xyk = function (g, k) { return g.getAttribute(k).split(",").map(Number); };
    var placed = function (g, x, y, k) { g.setAttribute("transform", "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ") scale(" + k.toFixed(5) + ")"); };
    function grow(nm) {                                 /* a passage card grows out of its DB tile (the full maker's) */
      var g = q(nm + "-at"), a = xyk(g, "data-from"), b = xyk(g, "data-at"), E = A.ease.io;
      return A.track(0.8, function (u) { var e = E(u); placed(g, a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] * Math.pow(b[2] / a[2], e)); });
    }
    var one = function (nm, c) {                        /* its span swept, its nugget, the check's counts */
      return A.seq(ckTo(c[0], c[1]), A.highlight([].slice.call(q.all(nm + "-sp")), { dur: 0.7 }), A.reveal(q(nm + "-at"), { dur: 0.01 }),
                   A.pace(A.enter(q(nm)), 1.6), ckTo(c[2], c[3]));
    };
    var s3 = A.groups({ name: "5.3", layers: [
      L("state", state([])),
      { name: "look", group: [A.zoom(q.svg, { from: F.home, to: F.pcn, dur: 0.7 }), focus(SUM(3), DET.concat(["db-blk5"]), 0.7)] },
      { name: "act", layers: [
        L("the passage, large", A.seq(A.reveal(q("pskb-at"), { dur: 0.01 }), A.par(grow("pskb"), A.pace(A.enter(q("pskb")), 1.5)))),
        L("its nugget, MiniCheck's 0.98", A.seq.apply(null, T.det.c3.n.map(function (nm, k) { return one(nm, T.det.c3.cnt[k]); })))] }] });
    var CARDS4 = CARDS.filter(function (k) { return WHY.indexOf(k) < 0; });
    var s4 = step("5.4", CARDS4, pass(4, { name: "look", group: [
      /* the camera back to the whole slide; then exactly on it: the passage's frame is not exactly 16:9 (its height
         rounded), so the move ends a hair off (scale 0.99995, as the full 5.5's rest does) */
      A.seq(A.zoom(q.svg, { from: F.pcn, to: F.home, dur: 0.7 }), A.zoom(q.svg, { from: F.home, to: F.home, dur: 0 })),
      focus(DET.concat(["db-blk5"]), SUM(4), 0.7),
      A.hide(CARDS4.map(q), { dur: 0.35 })] }));

    return {
      entry: entry,
      steps: [{ enter: s1 }, { enter: s2 }, { enter: s3, loop: A.ending(q("pskb-scene"), { acted: true }) }, { enter: s4 }, { enter: S[5].enter }],
      zones: { 1: "lane2", 2: "lane3", 4: "lane4" }
    };
  });
})();
