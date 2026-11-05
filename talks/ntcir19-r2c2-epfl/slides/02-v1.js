/* VARIANT 1 of slide 2 (a review page): the entry plays the heading and all three rows at once; steps unchanged. */
/* Slide 2: its motions, from the animation bank (anim/anim.js) and the steps' helpers (anim/steps.js).
   ENTRY, in groups never interleaved: (1) the heading keyed; then each row, one after another, played to its end:
   its name keyed, its line keyed; the question card enters by its layers (its ruled lines drawn); the arrow flows;
   the AI box enters; the arrow; the answer card enters (its line drawn, its gauge hunting and settling); the arrow;
   the gate enters (its threshold keyed); the two branches flow together; "yes" and "no" keyed; the two outcomes
   enter together (each card pops with its sign, its words keyed). Rows 2 and 3 at 2x (A.pace). The entry ends on
   the overview: all three rows, nothing moving (no idle).
   STEPS, one per row in reading order: (a) the row opaque, the other two at 0.3 (A.focus); its ball pops in at its
   question card, the last row's ball fading out. (b) Its loop, five rounds (A.cycle), each the AI answering once with a
   new confidence (the row's data-rounds, illustrative, NOTES), against its threshold (data-thr): the Q ball rolls into
   the AI and comes out of it turned over into an A (A.become), rolling into the answer; the thinking ring turns at the answer's number, its gauge empty; the gauge hunts and settles on the round's
   confidence (A.fillTo); the verdict is written at the card's top right, a green tick at or above the threshold, a red
   cross below; the ball pops out at the gate's arrow and rolls through the gate, down the branch the verdict says,
   into that outcome; then the Q ball pops back at its question card as the verdict fades. The last round's confidence is
   the one drawn, so the loop ends on the step's rest. */
Deck.slide("02-answer-with-confidence", function (A, q) {
  var R = [0, 1, 2], rows = R.map(function (i) { return q("row" + i); });
  function row(i) {
    var k = "r" + i;
    return A.seq(
      A.type(q(k + "-name"), { quick: true }),
      A.type(q(k + "-note"), { quick: true }),
      A.enter(q(k + "-q")),
      A.flow(q(k + "-a1"), { dur: 0.45 }),
      A.enter(q(k + "-ai")),
      A.flow(q(k + "-a2"), { dur: 0.45 }),
      A.enter(q(k + "-a")),
      A.flow(q(k + "-a3"), { dur: 0.45 }),
      A.enter(q(k + "-gate")),
      A.par(A.flow(q(k + "-up"), { dur: 0.45 }), A.flow(q(k + "-down"), { dur: 0.45 })),
      A.type([q(k + "-yes"), q(k + "-no")], { quick: true }),
      A.par(A.enter(q(k + "-sent")), A.enter(q(k + "-review")))
    );
  }
  /* one round of row i: the AI answers with confidence v, after a round that ended on `prev` */
  function round(i, v, prev, thr) {
    var k = "r" + i, ball = q("b" + i), up = v >= thr, bar = q(k + "-a-bar"), val = q(k + "-a-value");
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
      A.par(think, A.hold(fill, think.dur, 0)),                                /* the AI thinks, the gauge empty */
      fill,                                                                    /* it hunts and settles on this round's value */
      A.par(A.reveal(mark, { dur: 0.01 }), A.write(mark, { dur: 0.5 })),       /* its verdict, written at the end of the gauge */
      A.wait(0.25),
      A.par(A.hold(t2, 0.35, 0), A.pop(ball, { dur: 0.35 })),                  /* the answer pops out ... */
      t2,                                                                      /* ... and goes where the verdict says */
      A.wait(0.3),
      A.par(A.hold(t1, 0.4, 0), A.hold(turn, 0.4, 0), A.pop(ball, { dur: 0.4 }), A.hide(mark, { dur: 0.3 })),   /* a Q again at its card, the verdict fading */
      A.wait(0.4));
    return A.par(body, A.hold(A.hide(other, { dur: 0 }), body.dur));
  }
  function rounds(i) {
    var g = rows[i], thr = +g.getAttribute("data-thr"), V = g.getAttribute("data-rounds").split(",").map(Number);
    return A.cycle.apply(null, V.map(function (v, j) { return round(i, v, V[(j + V.length - 1) % V.length], thr); }));
  }
  var steps = R.map(function (i) {
    return {
      enter: A.par(
        A.focus(rows, { from: i ? i - 1 : null, to: i, dim: 0.3, dur: 0.6 }),
        i ? A.hide(q("b" + (i - 1)), { dur: 0.35 }) : null,
        A.at(0.3, A.pop(q("b" + i), { dur: 0.45 }))),
      loop: rounds(i)
    };
  });
  return {
    /* VARIANT 1: the heading and the three rows start together, each running at its own pace to its end */
    entry: A.par(A.type(q("head"), { quick: true }), row(0), row(1), row(2)),
    steps: steps
  };
});
