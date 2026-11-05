/* Slide 2: its motions, from the animation bank (anim/anim.js) and the steps' helpers (anim/steps.js).
   ENTRY: the heading and the row together; the row played to its end (its name keyed, its line keyed, the question
   card, each arrow after both its ends, the AI, the answer with its gauge, the gate with its threshold, the
   branches, "yes" and "no", the outcomes), then the Q ball pops in at the question card. Every line drawn, here and
   in the steps, is hidden until it has length (A.nodot), so no round cap shows as a dot where it starts.
   LOOP (the overview, the support desk): its five rounds.
   STEPS: 1 into the contract and regulation lookup, 2 into the internal knowledge base. Each enter: the name, its
   line and the outgoing outcome's words erased and keyed anew (A.reverse of A.type, then the stacked words of the
   next use case), the threshold re-counted from the old bar to the new one (A.recount), the question card's ruled
   lines undrawn and drawn again, the gauge moving to the new
   use case's drawn confidence (A.gaugeTo); the rest of the pipeline stays in place. Step 2 also brings the citation
   in: the passage pops in under the answer, the dashed "cites" link is drawn by pen from the answer down to it,
   "cites" keyed, and the marker's yellow sweeps across its marked line (the quoted span).
   Each step's loop: that use case's five rounds (A.cycle), each the AI answering once with a new confidence
   (data-rounds, illustrative, NOTES) against its threshold (data-thr): the Q ball rolls into the AI and comes out
   turned over into an A (A.become), rolling into the answer; the thinking ring turns, the gauge empty; the gauge
   hunts and settles on the round's confidence (A.fillTo); a green tick at or above the threshold, a red cross
   below; the ball pops out and rolls through the gate, down the branch the verdict says, into that outcome; the Q
   ball pops back at its question card as the verdict fades. On the knowledge base the citation is part of each
   answer: the band is cleared as the new answer arrives, and as it settles a bead runs down the link (A.pulse) and
   the band is swept again. The last round's confidence is the one drawn, so every loop ends on its step's rest. */
Deck.slide("02-answer-with-confidence", function (A, q) {
  var g = q("row0"), k = "r0", ball = q("b0"), CITE = +g.getAttribute("data-cite");
  var THR = g.getAttribute("data-thr").split(",").map(Number), CONF = g.getAttribute("data-conf").split(",").map(Number);
  var ROUNDS = g.getAttribute("data-rounds").split("|").map(function (s) { return s.split(",").map(Number); });
  var sfx = function (e) { return e ? String(e) : ""; };
  var lines = [0, 1, 2].map(function (i) { return q(k + "-q-line" + i); });
  var link = q(k + "-cite"), span = q(k + "-p-span");

  /* every line the entry draws without a round cap's dot at its start (A.nodot) */
  var enter = function (nm) { var el = q(k + "-" + nm); return A.nodot(A.enter(el), el); };
  var flow = function (nm) { var el = q(k + "-" + nm); return A.nodot(A.flow(el, { dur: 0.45 }), el); };
  function row() {
    return A.seq(
      A.type(q(k + "-name"), { quick: true }),
      A.type(q(k + "-note"), { quick: true }),
      enter("q"),
      flow("a1"),
      enter("ai"),
      flow("a2"),
      enter("a"),
      flow("a3"),
      enter("gate"),
      A.par(flow("up"), flow("down")),
      A.type([q(k + "-yes"), q(k + "-no")], { quick: true }),
      A.par(A.enter(q(k + "-sent")), A.enter(q(k + "-review"))),
      A.pop(ball, { dur: 0.45 })
    );
  }
  /* one round: the AI answers with confidence v against thr, after a round that ended on `prev`; `cite`: the
     answer comes with its citation (the band cleared as it arrives, the link pulsing and the band swept as it settles) */
  function round(v, prev, thr, cite) {
    var up = v >= thr, bar = q(k + "-a-bar"), val = q(k + "-a-value");
    var mark = q(k + (up ? "-ok" : "-ko")), other = q(k + (up ? "-ko" : "-ok"));
    var t1 = A.travel(ball, { along: [q(k + "-a1")], into: [q(k + "-ai")], dur: 0.9 });
    var tA = A.travel(ball, { along: [q(k + "-a2")], into: [q(k + "-a")], dur: 0.6 });
    var turn = A.become(ball, { from: "Q", to: "A", dur: 0.45 });
    var t2 = A.travel(ball, { along: [q(k + "-a3"), q(k + "-" + (up ? "up" : "down"))],
                              into: [q(k + "-gate"), q(k + "-" + (up ? "sent" : "review"))], dur: 1.4 });
    var shown = A.pop(ball, { dur: 0.35 }), last = A.fillTo(bar, { frac: prev / 100, shown: prev, value: val });
    var think = A.think(val, { dur: 0.9 }), fill = A.fillTo(bar, { frac: v / 100, shown: v, value: val, dur: 1.2 });
    var body = A.seq(
      A.par(t1, A.hold(shown, t1.dur), A.hold(last, t1.dur), A.hold(turn, t1.dur, 0)),   /* the Q into the AI; the gauge as it was */
      A.par(A.hold(tA, turn.dur, 0), turn, A.hold(fill, turn.dur, 0)),         /* out of the AI, turned over: an A */
      tA,                                                                      /* the answer into its card */
      A.par(think, A.hold(fill, think.dur, 0),                                 /* the AI thinks, the gauge empty ... */
            cite ? A.highlight(span, { out: true, dur: 0.3 }) : null),         /* ... and the last answer's quote cleared */
      fill,                                                                    /* it hunts and settles on this round's value */
      A.par(A.reveal(mark, { dur: 0.01 }), A.write(mark, { dur: 0.5 }),       /* its verdict, written at the end of the gauge */
            cite ? A.pulse(link, { dur: 0.5 }) : null,                         /* the answer's link to its passage ... */
            cite ? A.at(0.2, A.highlight(span, { dur: 0.45 })) : null),        /* ... and the span it quotes, swept again */
      A.wait(0.25),
      A.par(A.hold(t2, 0.35, 0), A.pop(ball, { dur: 0.35 })),                  /* the answer pops out ... */
      t2,                                                                      /* ... and goes where the verdict says */
      A.wait(0.3),
      A.par(A.hold(t1, 0.4, 0), A.hold(turn, 0.4, 0), A.pop(ball, { dur: 0.4 }), A.hide(mark, { dur: 0.3 })),   /* a Q again at its card, the verdict fading */
      A.wait(0.4));
    return A.par(body, A.hold(A.hide(other, { dur: 0 }), body.dur));
  }
  function rounds(e) {
    var V = ROUNDS[e];
    return A.cycle.apply(null, V.map(function (v, j) { return round(v, V[(j + V.length - 1) % V.length], THR[e], e === CITE); }));
  }
  /* re-keyed: the words erased (their typing played backwards), the next use case's keyed in their place */
  var OUT = 0.25, IN = 0.4;
  function rekey(a, b) {
    var la = (a._full != null ? a._full : a.textContent).length, lb = (b._full != null ? b._full : b.textContent).length;
    return A.seq(A.reverse(A.type(a, { quick: true, cps: la / OUT })), A.type(b, { quick: true, cps: lb / IN }));
  }
  /* the citation brought in: the passage pops in under the answer, the link drawn by pen down to it, its span swept */
  function citation() {
    return A.par(
      A.reveal(q(k + "-citation"), { dur: 0.01 }),
      A.at(0.1, A.pop(q(k + "-p"), { dur: 0.35 })),
      A.at(0.3, A.flow(link, { dur: 0.4 })),
      A.at(0.45, A.type(q(k + "-cites"), { quick: true })),
      A.at(0.55, A.highlight(span, { dur: 0.4 })));
  }
  function into(e) {     /* from use case e - 1 to use case e */
    var d = e - 1;
    return A.par(
      rekey(q(k + "-name" + sfx(d)), q(k + "-name" + sfx(e))),
      rekey(q(k + "-note" + sfx(d)), q(k + "-note" + sfx(e))),
      rekey(q(k + "-sent-text" + sfx(d)), q(k + "-sent-text" + sfx(e))),
      A.recount(q(k + "-gate-title"), { from: THR[d], to: THR[e], dur: 0.7 }),
      A.seq(A.reverse(A.nodot(A.draw(lines, { dur: 0.28 }), lines)),
            A.stagger(lines, function (l) { return A.nodot(A.draw(l, { dur: 0.36 }), l); }, 0.08)),
      A.gaugeTo(q(k + "-a-bar"), { from: CONF[d] / 100, to: CONF[e] / 100, value: q(k + "-a-value"), dur: 0.7 }),
      e === CITE ? citation() : null);
  }
  return {
    entry: A.par(A.type(q("head"), { quick: true }), row()),
    loop: rounds(0),
    steps: [{ enter: into(1), loop: rounds(1) }, { enter: into(2), loop: rounds(2) }]
  };
});
