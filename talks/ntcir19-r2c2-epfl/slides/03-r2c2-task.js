/* Slide 3: its motions, from the animation bank (anim/anim.js) and the steps' helpers (anim/steps.js).
   ENTRY, in groups never interleaved: (1) the camera set at once on the task canvas's right half (the slide no
   longer continues slide 2: it starts from paper); (2) the heading keyed; (3) what we have: its heading keyed, the corpus named and entering (its tiles
   pop, its size counts up), the questions named, then the six questions one after another, each its type tag turned
   in and counted, then its card typed with its scene acting, all at 3x (A.pace); (4) the divider drawn down;
   (5) what we must return: its heading keyed, the list named and entering (its rows in, "at most 20"), the answer
   named and its card entering (its gauge settles), the nuggets named, each nugget popping and its arrow flowing to
   the row it cites. The entry ends on the OVERVIEW: every part fully opaque, nothing moving.
   STEPS, eight, in reading order over the parts P = [corpus, the six types, what we must return]: step 1 the camera
   closes on the corpus and the rest goes to 0.3 (A.zoom, A.focus); each next step: the neighbourhood back to opaque
   (A.unfocus), the camera pans to the next part's frame (data-frame, slides/03-r2c2-task.py; the six cards' frames
   are one size, so between types it only moves), the new neighbourhood dimmed. On a type, its loop replays the
   card's scene (it fades out, acts again from its start, rests); on what we must return, a bead runs along each
   nugget's arrow in turn, to the passage it cites. */
Deck.slide("03-r2c2-task", function (A, q) {
  var six = [0, 1, 2, 3, 4, 5];
  var P = [q("corpus-blk")].concat(six.map(function (i) { return q("c" + i); }), [q("outs")]);
  var F = P.map(function (p) { return p.getAttribute("data-frame").split(",").map(Number); });
  var HOME = [1600, 0, 1600, 900];
  function question(i) {
    return A.seq(A.enter(q("t" + i)), A.enter(q("q" + i)));
  }
  function nug(j) {
    return A.seq(A.enter(q("n" + j)), A.flow(q("cite" + j), { dur: 0.45 }));
  }
  /* a card's scene again: faded out, then acting from its start, then at rest; each round self-contained */
  function replay(i) {
    var sc = q("q" + i + "-scene"), act = A.act(sc);
    return A.cycle(
      A.par(A.hold(act, 1.0), A.reveal(sc, { dur: 0 })),
      A.par(A.hold(act, 0.35), A.hide(sc, { dur: 0.35 })),
      A.par(act, A.reveal(sc, { dur: 0.3 })),
      A.par(A.hold(act, 1.6), A.reveal(sc, { dur: 0 })));
  }
  function cites() {
    return A.cycle.apply(null, [0, 1, 2].map(function (j) {
      return A.seq(A.wait(j ? 0.3 : 0.6), A.pulse(q("cite" + j), { dur: 0.9 }));
    }).concat([A.wait(0.8)]));
  }
  var steps = P.map(function (p, s) {
    var move = A.zoom(q.svg, { from: s ? F[s - 1] : HOME, to: F[s], dur: 0.7 });
    return {
      enter: s ? A.seq(A.unfocus(P, { from: s - 1, dur: 0.25 }), move, A.focus(P, { from: null, to: s, dim: 0.3, dur: 0.3 }))
               : A.par(move, A.focus(P, { from: null, to: 0, dim: 0.3, dur: 0.6 })),
      loop: s >= 1 && s <= 6 ? replay(s - 1) : s === 7 ? cites() : null
    };
  });
  return {
    entry: A.seq(
      A.camera(q.svg, HOME, HOME, { dur: 0 }),
      A.type(q("task-head"), { quick: true }),
      A.wait(0.2),
      A.type(q("have"), { quick: true }),
      A.type(q("corpus-name"), { quick: true }),
      A.enter(q("corpus")),
      A.type(q("qs-name"), { quick: true }),
      A.seq.apply(null, six.map(function (i) { return A.pace(question(i), 3); })),
      A.wait(0.2),
      A.draw(q("divide"), { dur: 0.6 }),
      A.type(q("return"), { quick: true }),
      A.type(q("pr-name"), { quick: true }),
      A.enter(q("pr")),
      A.type(q("ac-name"), { quick: true }),
      A.enter(q("ac")),
      A.type(q("n-name"), { quick: true }),
      nug(0), nug(1), nug(2)
    ),
    steps: steps
  };
});
