/* Slide 2: its motions, from the animation bank only (anim/anim.js). The heading keyed in; then row by
   row: the use case keyed, the question card enters by its layers (its ruled lines drawn), the arrow
   flows, the answer card enters (its line drawn, the gauge hunting and settling). Last beat: the two
   outcomes keyed, then each answer's arrow flows to its outcome. Loop: one row at a time, a bead runs
   from the question to the answer and on to its outcome. */
Deck.slide("02-answer-with-confidence", function (A, q) {
  var rows = [0, 1, 2];
  function row(i) {
    var k = "r" + i;
    return A.seq(
      A.type(q(k + "-name"), { quick: true }),
      A.enter(q(k + "-q")),
      A.flow(q(k + "-arrow")),
      A.enter(q(k + "-a")),
      A.wait(0.3)
    );
  }
  return {
    entry: A.seq.apply(null, [A.type(q("head"), { quick: true }), A.wait(0.2)]
      .concat(rows.map(row))
      .concat([
        A.type([q("use"), q("check")], { quick: true }),
        A.stagger(rows.map(function (i) { return q("r" + i + "-route"); }), function (el) { return A.flow(el); }, 0.35)
      ])),
    loop: A.seq.apply(null, rows.map(function (i) {
      return A.seq(A.pulse(q("r" + i + "-arrow")), A.pulse(q("r" + i + "-route")), A.wait(0.6));
    }))
  };
});
