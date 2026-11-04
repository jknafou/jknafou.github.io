/* Slide 2: its motions, from the animation bank (anim/anim.js) and the steps' helpers (anim/steps.js).
   ENTRY, in groups never interleaved: (1) the heading keyed; then each row, one after another, played to its end:
   its name keyed, its line keyed; the question card enters by its layers (its ruled lines drawn); the arrow flows;
   the AI box enters; the arrow; the answer card enters (its line drawn, its gauge hunting and settling); the arrow;
   the gate enters (its threshold keyed); the two branches flow together; "yes" and "no" keyed; the two outcomes
   enter together (each card pops with its sign, its words keyed). Rows 2 and 3 at 2x (A.pace). The entry ends on
   the overview: all three rows, nothing moving (no idle).
   STEPS, one per row in reading order: (a) the row opaque, the other two at 0.3 (A.focus); (b) its ball pops in at
   its question card, the last row's ball fading out; its loop rolls the ball along the row's arrows, through the
   AI, the answer and the gate, down the branch its confidence takes, into that outcome, and pops it back at the
   start (A.rollLoop). */
Deck.slide("02-answer-with-confidence", function (A, q) {
  var R = [0, 1, 2], rows = R.map(function (i) { return q("row" + i); });
  /* the branch each answer takes: its confidence against its threshold (the slide's ROWS) */
  var goes = ["up", "down", "up"];
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
  function pipes(i) {
    var k = "r" + i;
    return { along: [q(k + "-a1"), q(k + "-a2"), q(k + "-a3"), q(k + "-" + goes[i])],
             into: [q(k + "-ai"), q(k + "-a"), q(k + "-gate"), q(k + "-" + (goes[i] === "up" ? "sent" : "review"))] };
  }
  var steps = R.map(function (i) {
    var p = pipes(i);
    return {
      enter: A.par(
        A.focus(rows, { from: i ? i - 1 : null, to: i, dim: 0.3, dur: 0.6 }),
        i ? A.hide(q("b" + (i - 1)), { dur: 0.35 }) : null,
        A.at(0.3, A.pop(q("b" + i), { dur: 0.45 }))),
      loop: A.rollLoop(q("b" + i), { along: p.along, into: p.into, dur: 3.0, wait: 0.5, hold: 0.8 })
    };
  });
  return {
    entry: A.seq(A.type(q("head"), { quick: true }), A.wait(0.2),
                 row(0), A.wait(0.2), A.pace(row(1), 2), A.wait(0.2), A.pace(row(2), 2)),
    steps: steps
  };
});
