/* VARIANT A of slide 3, "quiet overview, detail on demand" (a review page, not the deck's slide).
   ENTRY (short and light): slide 2 set aside while the camera pans right (1 s); then THREE GROUPS STARTED TOGETHER,
   each running to its end: (1) the title keyed, the divider drawn down; (2) what we have: its heading keyed, then
   the corpus (named, its tiles in, its count growing) and the questions (named, then the six cards in a ripple:
   each its type tag turned in and counted while its card pops RULED, its rows' rules drawn: no words, no scene)
   together; (3) what we must return: its heading keyed, then PR (named, its 20 ruled rows in), AC (named, its card
   in, its gauge settling) and the nuggets (named, the three ruled N cards popping, then each arrow flowing to the
   row it cites, once the rows are there) together. No question is typed and no scene plays in the entry.
   STEPS, ten: 1 the camera closes on the corpus, the rest at 0.3; 2-7 each type in turn: the camera pans to its
   card while the focus moves to it, then its rules are lifted and its real question keyed, its scene acting with
   the words (the card stays filled after its step); its loop replays the scene; 8 the camera opens on what we
   must return, PR in focus; 9 AC in focus, its loop the gauge hunting and settling; 10 the nuggets (and the list
   they cite) in focus, its loop a bead along each nugget's arrow to the row it cites. */
Deck.slide("03-r2c2-task", function (A, q) {
  var six = [0, 1, 2, 3, 4, 5];
  var P = [q("corpus-blk")].concat(six.map(function (i) { return q("c" + i); }), [q("pr-blk"), q("ac-blk"), q("n-blk")]);
  var F = P.map(function (p) { return p.getAttribute("data-frame").split(",").map(Number); });
  var HOME = [1600, 0, 1600, 900], key = function (n) { return A.type(q(n), { quick: true }); };

  /* the entry's ruled card: its tag turned in while the card pops, then its rows' rules drawn */
  function ruledCard(i) {
    return A.par(A.pace(A.enter(q("t" + i)), 2), A.seq(A.pop(q("q" + i), { dur: 0.45 }), A.draw(q("q" + i + "-ph"), { dur: 0.35 })));
  }
  /* a step's card filled: its rules lifted, its question keyed, its scene acting with the words */
  function fill(i) {
    var sc = q("q" + i + "-scene"), ty = A.type(q("q" + i + "-text"), { quick: true }), act = A.act(sc, { cue: ty.cue });
    return A.seq(A.reverse(A.draw(q("q" + i + "-ph"), { dur: 0.3 })), A.pace(A.par(ty, A.reveal(sc, { dur: 0.25 }), act), 1.4));
  }
  /* a card's scene again: faded out, then acting from its start, then at rest (slide 3's own replay) */
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
  function gauge() {
    return A.cycle(A.wait(0.6), A.fill(q("ac-bar"), { value: q("ac-value"), dur: 2.6 }), A.wait(1.2));
  }

  var have = A.seq(key("have"), A.par(
    A.seq(key("corpus-name"), A.enter(q("corpus"))),
    A.seq(key("qs-name"), A.stagger(six, ruledCard, 0.12))));
  var prG = A.seq(key("pr-name"), A.pace(A.enter(q("pr")), 2.5));
  var nugs = A.seq(key("n-name"), A.stagger([0, 1, 2], function (j) { return A.enter(q("n" + j)); }, 0.12));
  var arrows = A.stagger([0, 1, 2], function (j) { return A.flow(q("cite" + j), { dur: 0.45 }); }, 0.1);
  var ret = A.seq(key("return"), A.par(prG,
    A.seq(key("ac-name"), A.pace(A.enter(q("ac")), 2)),
    A.par(nugs, A.at(Math.max(prG.dur, nugs.dur), arrows))));

  var STEP = [
    { to: 0, frame: F[0] },
    { to: 1, frame: F[1], loop: replay(0) }, { to: 2, frame: F[2], loop: replay(1) }, { to: 3, frame: F[3], loop: replay(2) },
    { to: 4, frame: F[4], loop: replay(3) }, { to: 5, frame: F[5], loop: replay(4) }, { to: 6, frame: F[6], loop: replay(5) },
    { to: 7, frame: F[7] }, { to: 8, frame: F[7], loop: gauge() }, { to: [9, 7], frame: F[7], loop: cites() }
  ];
  var steps = STEP.map(function (st, s) {
    var from = s ? STEP[s - 1] : null, f0 = from ? from.frame : HOME;
    var move = f0 === st.frame ? null : A.zoom(q.svg, { from: f0, to: st.frame, dur: 0.7 });
    var look = A.par(move, A.focus(P, { from: from ? from.to : null, to: st.to, dim: 0.3, dur: move ? 0.7 : 0.45 }));
    return { enter: s >= 1 && s <= 6 ? A.seq(look, fill(s - 1)) : look, loop: st.loop || null };
  });
  return {
    entry: A.seq(
      A.par(A.dim(q("s2"), { dur: 0.5 }), A.camera(q.svg, [0, 0, 1600, 900], HOME, { dur: 1.0 })),
      A.par(A.par(key("task-head"), A.draw(q("divide"), { dur: 0.8 })), have, ret)),
    steps: steps
  };
});
