/* Slide 3: its motions, from the animation bank only (anim/anim.js). (a) slide 2's rows are set aside;
   (b) the camera pans right onto the task canvas's other half; (d) the heading keyed, the corpus enters
   (its tiles pop with it, its size counts up); the six questions, each its type tag turned in and counted,
   then its card typed with its scene acting -- the first five passed quickly, Han Solo's last at a
   person's pace; the five are set aside, his stays inked; then the two flows: an arrow to the ranked
   passages (the list drawn, its rows in, "at most 20"), an arrow to the answer card (its gauge settles).
   Loop (e): a bead runs each of the two flows in turn. */
Deck.slide("03-r2c2-task", function (A, q) {
  var five = [0, 1, 2, 3, 4];
  function question(i) {
    return A.seq(A.enter(q("t" + i)), A.enter(q("q" + i)));
  }
  return {
    entry: A.seq(
      A.dim(q("s2"), { dur: 0.5 }),
      A.camera(q.svg, [0, 0, 1600, 900], [1600, 0, 1600, 900], { dur: 1.4 }),
      A.type(q("task-head"), { quick: true }),
      A.wait(0.2),
      A.type(q("corpus-name"), { quick: true }),
      A.enter(q("corpus")),
      A.type(q("qs-name"), { quick: true }),
      A.seq.apply(null, five.map(function (i) { return A.pace(question(i), 3); })),
      A.wait(0.3),
      question(5),
      A.wait(0.3),
      A.par.apply(null, five.map(function (i) { return A.dim(q("q" + i), { to: 0.4 }); })),
      A.type(q("pr-name"), { quick: true }),
      A.flow(q("to-pr")),
      A.enter(q("pr")),
      A.type(q("ac-name"), { quick: true }),
      A.flow(q("to-ac")),
      A.enter(q("ac"))
    ),
    loop: A.seq(A.wait(0.6), A.pulse(q("to-pr")), A.wait(0.4), A.pulse(q("to-ac")), A.wait(0.8))
  };
});
