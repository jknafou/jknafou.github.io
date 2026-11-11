/* Slide 2, short version (2s): today's paradigm, then the confidence, then the use cases. The drawing is the full
   slide's with today's parts added (the .py header); the full slide's motion file is loaded after this one and its
   2.1 enter is reused for 2.2; everything else is made here.
   The author, 10 November 2026: "The first slide should really the current paradygme of human interaction with AI",
   "2.1 should show the extension of the pipeline with the confidence"; of the alternatives, "the option A" (the user
   is the gate). Earlier the same day, kept: "I really feel that slide 2 animation of the pipeline could be faster, with
   even a bit of overlap, like starting the AI box just before the first arrow finishes."; the use cases "change
   faster, like every 2-3 sec."

   ENTRY ("2"), a tree of groups in layers (A.groups), its two groups started together:
     words  layers: the heading keyed -> today's two lines keyed
     row    layers: question -> arrow -> AI -> arrow -> answer (its frame, "A", its ruled line; no gauge) -> branches,
            two parallel groups in one layer:
              to the user   layers: the arrow to the user -> the user (the figure pops, "the user" keyed) -> fork, one
                            layer of two parallel branches, each: its arrow -> its word ("sure" / "not sure") keyed ->
                            its card (the card pops, its words keyed: "used as is" / "opens the source")
              the citation  layers: the dashed "cites" link drawn down -> "cites" keyed -> the passage pops -> its
                            line swept
            Along the row and in both branches, a member hands over LEAD = 0.2 s before its end (the author's overlap:
            its leaf counts its track's length less LEAD, the track playing on to its end beneath the next). Not the
            fork's words (0.1 s keyed) nor the last members.
   OVERVIEW IDLE: the doubtful user's check: a bead runs down the "cites" link and the passage's line is swept again
     (its marker cleared first), then still; it begins with its stillness, so it continues the entry's end.
   STEP 2.1, its enter (one layer, every part re-made at once, 0.9 s): the user fades and the gate pops in its place,
     its threshold keyed; the gauge comes into the answer and grows 0 -> 94, the number counting; "sure" / "not sure"
     un-keyed and "yes" / "no" keyed; "opens the source" un-keyed and "a person reviews it" keyed; today's two lines
     un-keyed and the idea's keyed. Its rest is the full slide's overview with the citation. Its loop: the full
     overview's (the gauge breathing across the threshold, 1.4 s still).
   STEP 2.2, its enter: the full slide's 2.1 enter (the idea un-keyed, the support desk keyed, the threshold 70 -> 70,
     the question's lines redrawn, the gauge 94 -> 94). Its loop, the validated cycle, from and back to its rest:
     each use case held (its gauge breathing once, c -> 95 -> 35 -> c in 1.4 s, then 0.3 s still), then the next made
     in 0.8 s (one layer: name, line, outgoing words re-keyed, threshold re-counted, question's lines redrawn, gauge
     moved); on the knowledge base the citation's beat as the gauge lands (its marker cleared as the gauge leaves its
     value, a bead down the link and the line swept again as it lands back). The citation stays drawn throughout.
     A name is on screen 2.5 s (the knowledge base 2.75 s); the cycle 7.75 s.
   Numbers: the full slide's data-thr, data-conf and data-g (asserted in the .py); 95 and 35 A.breathe's bounds. */
(function () {
  "use strict";
  var ID = "02-answer-with-confidence", full = null, reg = Deck.slide;
  Deck.slide = function (id, make) {               /* the full slide's registration, caught once */
    if (id === ID && !full) { full = make; Deck.slide = reg; return; }
    reg(id, make);
  };
  reg(ID, function (A, q) {
    if (!full) throw new Error(ID + " (short): the full slide's motion file was not loaded after this one");
    var m = full(A, q), S = m.steps;
    var g = q("row0"), k = "r0", ball = q("b0");
    var THR = g.getAttribute("data-thr").split(",").map(Number), CONF = g.getAttribute("data-conf").split(",").map(Number);
    var GEN = g.getAttribute("data-g").split(",").map(Number), CITE = +g.getAttribute("data-cite");
    var lines = [0, 1, 2].map(function (i) { return q(k + "-q-line" + i); });
    var link = q(k + "-cite"), span = q(k + "-p-span"), bar = q(k + "-a-bar"), val = q(k + "-a-value");
    var el = function (nm) { return q(k + "-" + nm); };

    var enter = function (nm) { var e = el(nm); return A.nodot(A.enter(e), e); };
    var flow = function (nm, o) { var e = el(nm); return A.nodot(A.flow(e, o || { dur: 0.45 }), e); };
    var key = function (e) { return A.type(e, { quick: true }); };
    var LEAD = 0.2;
    var early = function (tr) { return { dur: tr.dur - LEAD, set: function (t) { tr.set(t); } }; };

    /* ---- the entry ---- */
    var entry = A.groups({ name: "slide", group: [
      { name: "no ball", track: A.hide(ball, { dur: 0 }) },
      { name: "words", layers: [key(q("head")), key([el("name-t"), el("note-t")])] },
      { name: "row", layers: [
        { name: "question", track: early(enter("q")) },
        { name: "arrow to the AI", track: early(flow("a1")) },
        { name: "AI", track: early(enter("ai")) },
        { name: "arrow to the answer", track: early(flow("a2")) },
        { name: "answer", track: early(enter("a")) },
        { name: "branches", group: [
          { name: "to the user", layers: [
            { name: "arrow to the user", track: early(flow("a3")) },
            { name: "the user", track: early(A.seq(A.pop(el("user"), { dur: 0.45 }), key(el("user-label")))) },
            { name: "fork", group: [
              { name: "sure", layers: [early(flow("up")), key(el("sure")),
                                       A.seq(A.pop(el("sent"), { dur: 0.4 }), key(el("sent-text")))] },
              { name: "not sure", layers: [early(flow("down")), key(el("notsure")),
                                           A.seq(A.pop(el("review"), { dur: 0.4 }), key(el("review-text-t")))] }] }] },
          { name: "the citation", layers: [
            early(A.par(A.reveal(el("citation"), { dur: 0.01 }), A.nodot(A.flow(link, { dur: 0.4 }), link))),
            key(el("cites")),
            early(A.pop(el("p"), { dur: 0.45 })),
            A.highlight(span, { dur: 0.4 })] }] }] }] });
    /* the overview's idle: still, then the doubtful user's check of the source */
    var idle = A.seq(A.wait(1.6), A.highlight(span, { out: true, dur: 0.3 }),
                     A.par(A.pulse(link, { dur: 0.5 }), A.at(0.2, A.highlight(span, { dur: 0.45 }))), A.wait(1.2));

    /* ---- 2.1: the extension ---- */
    var OUT = 0.25, IN = 0.4;
    var len = function (e) { return (e._full != null ? e._full : e.textContent).length; };
    var rekey = function (a, b) {
      return A.seq(A.reverse(A.type(a, { quick: true, cps: len(a) / OUT })), A.type(b, { quick: true, cps: len(b) / IN }));
    };
    var conf = A.groups({ name: "2.1", group: [
      { name: "the user becomes the gate", track: A.par(A.hide([el("user"), el("user-label")], { dur: 0.3 }),
                                                        A.at(0.2, A.enter(el("gate")))) },
      { name: "the gauge", track: A.par(A.reveal(el("a-gauge"), { dur: 0.2 }),
                                        A.gaugeTo(bar, { from: 0, to: GEN[0] / 100, value: val, dur: 0.9 })) },
      { name: "sure", track: rekey(el("sure"), el("yes")) },
      { name: "not sure", track: rekey(el("notsure"), el("no")) },
      { name: "the review", track: rekey(el("review-text-t"), el("review-text")) },
      { name: "name", track: rekey(el("name-t"), el("name-g")) },
      { name: "line", track: rekey(el("note-t"), el("note-g")) }] });

    /* ---- 2.2: the use cases ---- */
    var HI = 0.95, LO = 0.35, BREATH = 1.4, HOLD = 0.3;
    function breath(c) {
      var P = [c, HI, LO, c], L = [0, 1, 2].map(function (i) { return Math.sqrt(Math.abs(P[i + 1] - P[i])); });
      var Ssum = L[0] + L[1] + L[2];
      return A.seq.apply(null, [0, 1, 2].map(function (i) {
        return A.gaugeTo(bar, { from: P[i], to: P[i + 1], value: val, dur: BREATH * L[i] / Ssum });
      }));
    }
    function held(e) {
      var b = breath(CONF[e] / 100);
      if (e !== CITE) return A.seq(b, A.wait(HOLD));
      var land = BREATH - 0.4;                        /* the bead leaves as the gauge's last leg nears its value */
      return A.seq(A.par(b, A.highlight(span, { out: true, dur: 0.3 }),
                         A.at(land, A.pulse(link, { dur: 0.5 })), A.at(land + 0.2, A.highlight(span, { dur: 0.45 }))),
                   A.wait(HOLD));
    }
    var word = function (w, e) { return el(w + "-u" + e); };
    function into(d, e) {        /* from use case d to use case e: one layer, every part re-made at once */
      return A.groups({ name: "use case " + (e + 1), group: [
        { name: "name", track: rekey(word("name", d), word("name", e)) },
        { name: "line", track: rekey(word("note", d), word("note", e)) },
        { name: "outcome", track: rekey(word("sent-text", d), word("sent-text", e)) },
        { name: "threshold", track: A.recount(el("gate-title"), { from: THR[d], to: THR[e], dur: 0.7 }) },
        { name: "question", track: A.seq(A.reverse(A.nodot(A.draw(lines, { dur: 0.28 }), lines)),
              A.stagger(lines, function (l) { return A.nodot(A.draw(l, { dur: 0.36 }), l); }, 0.08)) },
        { name: "gauge", track: A.gaugeTo(bar, { from: CONF[d] / 100, to: CONF[e] / 100, value: val, dur: 0.7 }) }] });
    }
    var cycle = A.seq(held(0), into(0, 1), held(1), into(1, 2), held(2), into(2, 0));
    return { entry: entry, loop: idle,
             steps: [{ enter: conf, loop: m.loop }, { enter: S[0].enter, loop: cycle }] };
  });
})();
