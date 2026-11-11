/* Slide 4, short version (4s): the full slide's drawing and motions (slides/04-one-pipeline.js, validated and
   untouched), its steps MERGED: a short step is the full slide's step enters played back to back, unchanged, as if →
   had been pressed several times (the author, 10 November 2026: "your job was just to kind of press -> multiple time
   instead of one"; "none of the animation must be worked, it is just a merging of multiple animation into one").
   The cuts: each short step rests on a turn's T card (the author: "the slide should stop with the Turn message, so I
   speak and say what will happen"):
       4.1 = full 4.1                 rests on the question
       4.2 = full 4.2                 rests on the orchestrator's note "[type: simple]"
       4.3 = full 4.3                 rests on T1, search_passages
       4.4 = full 4.4 + 4.5           rests on T2, get_passage
       4.5 = full 4.6 + 4.7           rests on T3, record_evidence
       4.6 = full 4.8 + 4.9 + 4.10    rests on T4, submit_answer
       4.7 = full 4.11 + 4.12         rests on the gate and the answer
   Every full step enter is the full slide's own track (its state, its look: the camera ‖ the focus ‖ what the step
   before put out put away, its act), with two exceptions, both asked:
   - 4.11, rebuilt here with the full 4.11's state, camera and look, its act reduced to ONE box (the author: "4.11
     with no details"; then "group the information in one box (2) make it move with the camera so that at the end of
     4.7 is still there and we can still read it (3) [...] make them appear opaque wrt rest just the time of the
     animation, so we know what it takes into account"), in layers: the submit call down call-submit and l-sg → the
     record's bead up l-rg → the box out of the gate's right edge, its name keyed → [the nugget check and l-ck lit
     against the rest ‖ "from the nugget's score," keyed] → [the record and l-rg lit ‖ "the passages that support
     it," keyed] → [the full 4.11's look back ‖ "and the claims its question type (simple) needs: 1" keyed, the type written in
     (the author: "(b) write the type into the box"): its source, the
     question type box (x 100-290), is 480 units left of the gate's frame (from 770), so nothing is lit for it] → [0.975 counting ‖ the
     gate's reading revealed and counting] → [the box's tick, then "committed" ‖ the gate's tick];
   - 4.12, the full one, its state showing the full 4.11's boxes (cb, cb-lead, gl) to put them away: here they stay
     hidden, and the one box stays (it stands where both frames show it readably, the .py).
   ENTRY ("4"): the full slide's tree with overlap (the author: "there could be some overlaps to get faster"): below.
   A short step is A.groups of the full steps' enters, each a leaf (their own trees are the full slide's, checked on
   the full deck); its loop is the last merged step's (the full 4.6's passages' idles are not on 4.5's rest, as on the
   full 4.7, which has none).
   ZONES: the question card 1, the question type 2, the transcript 3, Search 4, Read 5, the nugget check 6, the gate 7.
   HOW THE FULL MAKER IS REACHED: as short slide 2's: the build loads the full slide's motion file just after this one;
   its Deck.slide call is caught here, and its maker called for the entry's parts and every step. The few helpers below
   (state, go, leave, outOfGate) are the full slide's, copied for 4.11: they are closures of its maker, which the
   validated file does not export. */
(function () {
  "use strict";
  var ID = "04-one-pipeline", full = null, reg = Deck.slide;
  Deck.slide = function (id, make) {               /* the full slide's registration, caught once */
    if (id === ID && !full) { full = make; Deck.slide = reg; return; }
    reg(id, make);
  };
  reg(ID, function (A, q) {
    if (!full) throw new Error(ID + " (short): the full slide's motion file was not loaded after this one");
    var m = full(A, q), S = m.steps;
    var F = JSON.parse(q("frames").getAttribute("data-frames"));
    var key = function (n) { return A.type(q(n), { quick: true }); };
    var tools = ["search", "read", "extract", "record", "submit"];
    var JOURNEY = ["han", "tag", "note-type", "turn1", "turn2", "turn3", "turn4", "dbx", "fun", "hanp", "nug", "note-rec",
                   "g5", "cb", "cb-lead", "gl", "a5", "ball", "sb-at"];
    var DBP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (r) { return "dbp" + r; });
    var NAMES = ["head", "q-card", "l-q", "qtype", "db-blk", "model", "tr"]       /* the full slide's focus units */
      .concat(tools.map(function (k) { return "t-" + k; }), tools.map(function (k) { return "call-" + k; }),
              tools.map(function (k) { return "res-" + k; }))
      .concat(["l-type", "stub-search", "stub-read", "stub-extract", "bus", "bus-dots", "l-every", "say-every",
               "orch", "check", "gate", "rec", "l-ck", "l-rg", "l-rc", "l-cr", "say-kept", "l-sg", "l-gs", "say-back",
               "l-ans", "ans"]).concat(DBP);
    var P = NAMES.map(q);
    var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 4s: no part " + k); return i; }); };
    var ball = q("ball");
    var go = function () { return A.seq(A.reveal(ball, { dur: 0.01 }), A.travel(ball, { along: [].slice.call(arguments).map(q) })); };
    var leave = function (from, to) { return A.par(go.apply(null, [].slice.call(arguments, 2)), A.become(ball, { from: from, to: to, dur: 0.4 })); };
    function state(shown, face) {                                          /* the full slide's */
      var Sh = shown.map(q);
      return { dur: 0, set: function (t) {
        if (t < 0) return;
        JOURNEY.forEach(function (k) { var e = q(k); e.style.opacity = Sh.indexOf(e) >= 0 ? "" : "0"; });
        ball.style.opacity = "0";
        [].forEach.call(ball.querySelectorAll("[data-face]"), function (f) { f.style.display = f.getAttribute("data-face") === face ? "" : "none"; });
      } };
    }
    var xyk = function (g, k) { return g.getAttribute(k).split(",").map(Number); };
    var placed = function (g, x, y, k) { g.setAttribute("transform", "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ") scale(" + k.toFixed(5) + ")"); };
    function outOfGate(nm) {                                               /* the full slide's */
      var g = q(nm + "-at"), a = xyk(g, "data-from"), b = xyk(g, "data-at"), E = A.ease.io;
      return A.track(0.6, function (u) {
        var e = E(u), k = a[2] * Math.pow(b[2] / a[2], e), px = a[0] + (b[0] - a[0]) * e, py = a[1] + (b[1] - a[1]) * e;
        placed(g, px, py, k);
        g.style.opacity = u <= 0 ? "0" : u >= 1 ? "" : Math.min(1, 4 * e).toFixed(3);
      });
    }

    /* ---- 4.11 with the one box: the full 4.11's state and look (its .js, STEPS[10]), its act reduced ---- */
    var LG = ["tr", "call-submit", "t-submit", "l-sg", "gate", "l-rg", "rec", "check"];   /* the full 4.11's look */
    /* while the box keys an input, the part it comes from is lit against the rest (A.focus), then the look comes back */
    var lit = function (from, to) { return A.focus(P, { from: ix(from), to: ix(to), dim: 0.3, dur: 0.45 }); };
    var SRC1 = ["check", "l-ck"], SRC2 = ["rec", "l-rg"];
    var full411 = function () { return { name: "full 4.11, the one box", layers: [
      { name: "state", track: state(["dbx", "turn4"], "O") },
      { name: "look", group: [A.zoom(q.svg, { from: F.turn, to: F.gate, dur: 0.7 }),
                              A.focus(P, { from: ix(["tr"]), to: ix(LG), dim: 0.3, dur: 0.7 }),
                              A.hide([q("turn4")], { dur: 0.35 })] },
      { name: "submit call", track: leave("O", "submit", "call-submit", "l-sg") },
      { name: "the record into the gate", track: A.pulse(q("l-rg"), { dur: 0.8 }) },
      { name: "the box out of the gate", track: A.seq(A.reveal(q("sb-at"), { dur: 0.01 }), outOfGate("sb"), key("sb-head")) },
      { name: "the nugget's score", group: [lit(LG, SRC1), A.seq(key("sb-from"), key("sb-in1"))] },
      { name: "the passages", group: [lit(SRC1, SRC2), key("sb-in2")] },
      { name: "the claims its type needs", group: [lit(SRC2, LG), key("sb-in3")] },
      { name: "the outcome", group: [A.count(q("sb-value"), { dur: 0.9 }),
                                      A.seq(A.reveal(q("g5"), { dur: 0.3 }), A.count(q("g5-reading"), { dur: 1.0 }))] },
      { name: "the ruling", group: [A.seq(A.write(q("sb-mark"), { dur: 0.4 }), key("sb-result")), A.write(q("g5-verdict"))] }] }; };
    /* 4.12, the full one: its state shows the full 4.11's boxes to put them away; here they stay hidden, and the one
       box stays (the author: "so that at the end of 4.7 is still there and we can still read it"; it stands where both
       4.11's and 4.12's frames show it, the .py) */
    var FULLBOX = ["cb", "cb-lead", "gl"].map(q), e12 = S[11].enter, SB = q("sb-at");
    var full412 = function () { return { name: "full 4.12, the box kept", track: { dur: e12.dur, set: function (t) {
      e12.set(t);
      if (t >= 0) { FULLBOX.forEach(function (b) { b.style.opacity = "0"; }); SB.style.opacity = ""; }
    } } }; };

    /* THE ORDER IN WHICH A SEEK SETS THE TRACKS. The full slide's chain is one A.seq of its twelve step enters: a seek
       sets every step not yet begun to its first state (latest first), THEN every begun step in order, so the steps
       played last win. Nested in a merged step, the full steps not yet begun inside it would be set AFTER the
       earlier short steps (the outer A.seq reaches the merged step last), and their first states would win over
       them: the full 4.9's note pops the ball from scale 0 (A.pop), so seeking into the full 4.8 inside short 4.6
       left the ball at scale 0 (no coin), and every frame of that stretch the same. So a merged step, sought inside
       itself, sets: its not-begun full steps (latest first), then every full step before it again at its end, in
       order, then its begun full steps in order: exactly the full chain's order, so each frame is the full slide's.
       ALL is every full step enter as played, in order; a merged step plays ALL[i] for its i. Its schedule
       (.nodes, .measure, for tools/test_groups.mjs) is an A.groups tree over a second build of the same steps. */
    var E411 = A.groups(full411()), E412 = A.groups(full412());
    var ALL = S.slice(0, 10).map(function (x) { return x.enter; }).concat([E411, E412]);
    function merged(name, idx, nodes) {
      var G = A.groups({ name: name, layers: nodes }), M = idx.map(function (i) { return ALL[i]; }), at = [], o = 0;
      M.forEach(function (x) { at.push(o); o += x.dur; });
      if (Math.abs(o - G.dur) > 1e-9) throw new Error("slide 4s: " + name + ": its schedule is not its play");
      return { dur: o, nodes: G.nodes, measure: G.measure, set: function (t) {
        var j;
        for (j = M.length - 1; j >= 0; j--) if (at[j] > t || t < 0) M[j].set(t - at[j]);
        if (t < 0) return;
        for (j = 0; j < idx[0]; j++) ALL[j].set(ALL[j].dur);
        for (j = 0; j < M.length; j++) if (at[j] <= t) M[j].set(t - at[j]);
      } };
    }
    var leaf = function (i) { return { name: "full 4." + (i + 1), track: S[i].enter }; };
    var steps = [S[0], S[1],
      { enter: merged("4.3 (full 4.3)", [2], [leaf(2)]), loop: S[2].loop || null },
      { enter: merged("4.4 (full 4.4-4.5)", [3, 4], [leaf(3), leaf(4)]), loop: S[4].loop || null },
      { enter: merged("4.5 (full 4.6-4.7)", [5, 6], [leaf(5), leaf(6)]), loop: S[6].loop || null },
      { enter: merged("4.6 (full 4.8-4.10)", [7, 8, 9], [leaf(7), leaf(8), leaf(9)]), loop: S[9].loop || null },
      { enter: merged("4.7 (full 4.11-4.12)", [10, 11], [full411(), full412()]), loop: S[11].loop || null }];

    /* ---- the overview's entry: the full slide's tree (slides/04-one-pipeline.js), with OVERLAP (the author, 10
       November 2026, on the short deck: "Same for the slide 4 pipeline loading, there could be some overlaps to get
       faster", as on slide 2: "starting the AI box just before the first arrow finishes"): every leaf that a later
       layer waits for hands over LEAD s before its end. In the tree such a leaf counts its track's length less LEAD;
       its track plays on to its own end beneath the next layer (A.seq and A.par keep setting a begun track), so the
       motions and their durations are the full slide's, only the starts are earlier. The root's last layer (the title
       ‖ the pipeline's last group, "every passage") keeps its full length, so the entry ends on the rest. */
    var LEAD = 0.2;
    var early = function (tr) { return tr.dur > LEAD ? { dur: tr.dur - LEAD, set: function (t) { tr.set(t); } } : tr; };
    var fl = function (n) { return A.flow(q(n), { dur: 0.45 }); };
    var each = function (f) { return tools.map(f); };
    var E = function (tr) { return early(tr); };
    var tree = { name: "slide", layers: [
      { name: "aside", track: A.hide(JOURNEY.map(q), { dur: 0 }) },
      [{ name: "header", track: key("head") },
       { name: "pipeline", layers: [
         { name: "question card", track: E(A.enter(q("q-card"))) },
         { name: "l-q", track: E(fl("l-q")) },
         { name: "question type", track: E(A.enter(q("qtype"))) },
         { name: "l-type", track: E(fl("l-type")) },
         { name: "model", layers: [
           { name: "band and transcript", group: [E(A.enter(q("model"))), E(A.enter(q("tr")))] },
           { name: "five calls", group: each(function (k) { return E(fl("call-" + k)); }) },
           { name: "five tools", group: each(function (k) { return E(A.enter(q("t-" + k))); }) },
           { name: "five results", group: each(function (k) { return E(fl("res-" + k)); }) }] },
         { name: "the tools' two ways", group: [
           { name: "to the passages DB", layers: [
             { name: "stubs", group: ["stub-search", "stub-read", "stub-extract"].map(function (k) { return E(A.draw(q(k), { dur: 0.45 })); }) },
             { name: "bus", track: E(A.draw(q("bus"), { dur: 0.45 })) },
             { name: "bus dots", track: E(A.pop(q("bus-dots"), { dur: 0.3 })) },
             { name: "passages DB", group: [E(key("db-name")), E(A.enter(q("db")))] }] },
           { name: "to the orchestrator", layers: [
             { name: "record and submit calls", group: [E(fl("l-rc")), E(fl("l-sg"))] },
             { name: "band, check, gate", group: [E(A.enter(q("orch"))), E(A.enter(q("check"))), E(A.enter(q("gate")))] },
             { name: "replies", group: [E(fl("l-cr")), E(fl("l-gs"))] },
             { name: "their words", group: [E(key("say-kept")), E(key("say-back"))] },
             { name: "l-ck", track: E(fl("l-ck")) },
             { name: "record", track: E(A.enter(q("rec"))) },
             { name: "l-rg", track: E(fl("l-rg")) },
             { name: "l-ans", track: E(fl("l-ans")) },
             { name: "answer", track: E(A.enter(q("ans"))) }] }] },
         { name: "every passage", group: [fl("l-every"), key("say-every")] }] }]] };

    return {
      entry: A.groups(tree),
      steps: steps,
      zones: { 1: "q-card", 2: "qtype", 3: "tr", 4: "t-search", 5: "t-read", 6: "check", 7: "gate" }
    };
  });
})();
