/* Slide 5: its motions, from the animation bank (anim/anim.js), A.groups (anim/steps.js) and the scenes' endings
   (anim/idles.js); its entry is one group, the journey, whose layers are the events of the trace in order. It starts on its own first frame (slide 4
   has steps now, so this slide is reached by the fade to paper): Figure 1 as slide 4 drew it, its stand-ins and
   ball set aside at once; the old heading gives way to this one's. Then J 1-6 of Han Solo's pass 1, the camera closing on each step (FRAMES, drawn in the .py) and
   opening again to the whole pipeline after each turn, where the signal rows under the record count it:
   J 1 the card typed at the mouth folds into its ball; J 2 the ball rolls into the type box, which puts out
   `simple`; J 3 turn 1 into the transcript, the ball down to Search: its two indexes, the fusion, the
   re-ranker, ten rows out, ten tiles lit in the corpus; J 4 turn 2, the ball to Read: the Funeral card typed
   large with its scene, Han Solo small; J 5 turn 3, the ball down to the check: the nugget, its span swept
   in the Funeral card, MiniCheck's gauge at 0.975, a tick, the reply keyed back up; J 6 turn 4, the ball
   down to the gate: its reading counted, a tick, the answer out. Each scene, once acted, idles (its ending, anim/idles.js)
   until its card is put away. No loop: it ends on a result. */
Deck.slide("05-han-solo-pass-1", function (A, q) {
  var F = JSON.parse(q("frames").getAttribute("data-frames"));
  var arrows = [].slice.call(q("p").querySelectorAll('[data-concept="flow_arrow"]'));   /* slide 4's order */
  var ball = q("ball"), pipe = q("p"), cur = F.full;
  function cam(name, dur) { var from = cur; cur = F[name]; return A.camera(q.svg, from, cur, { dur: dur || 0.9 }); }
  function go() { return A.seq.apply(null, [].slice.call(arguments).map(function (i) { return A.travel(ball, { along: arrows[i] }); })); }
  function sig(k, j) { return q("sig-" + k + "-" + j); }
  function bump(k, j) {                       /* the row's value goes up: the new value counts in where the old one was */
    return A.par(A.hide(sig(k, j - 1), { dur: 0.3 }), A.reveal(sig(k, j), { dur: 0.3 }), A.count(q("sig-" + k + "-" + j + "-value"), { dur: 0.5 }));
  }
  function idling(card, track) { return A.idling(q(card + "-scene"), track); }
  var spans = [].slice.call(q.all("fun2-span"));
  var lit = [].slice.call(q.svg.querySelectorAll('[data-a^="c5-lit"]'));
  var setAside = A.par(
    A.hide([q("o-tag"), q("o-turn"), q("o-rows"), q("o-nugget"), ball, q("corpus")], { dur: 0 }),
    A.dim(q("c5"), { dur: 0 }),
    A.highlight(lit, { dur: 0, out: true })      /* its ten bands, swept in when the search lights them */
  );
  return {
    /* one group, the journey, in layers: each event of the trace waits for the one before it (the tree is in the
       .py's header) */
    entry: A.groups({ name: "journey", layers: [
      { name: "set aside", track: setAside },
      { name: "heading", layers: [A.hide(q("head"), { dur: 0.4 }), A.type(q("h5"), { quick: true }), A.wait(0.3)] },
      /* J 1: Han Solo's question typed at the mouth, folding into its ball */
      { name: "J 1", layers: [
        cam("mouth"),
        [A.hide(q("p-question"), { dur: 0.3 }), A.enter(q("han"))],
        A.wait(0.5),
        A.par(A.hide(q("han"), { dur: 0.45 }), A.at(0.4, A.pop(ball, { dur: 0.5 })))] },
      /* J 2: the type box */
      { name: "J 2", layers: [go(0), A.emit(q("o-tag")), A.wait(0.3)] },
      /* J 3, turn 1: into the transcript, then down to Search */
      { name: "J 3", layers: [
        go(1),
        cam("t1"), A.pace(A.emit(q("t1")), 2), A.wait(0.4),
        cam("search"),
        go(2),
        A.dim(pipe, { to: 0.3, dur: 0.5 }),
        [A.flow(q("x-q1"), { dur: 0.6 }), A.flow(q("x-q2"), { dur: 0.6 })],
        [A.enter(q("x-sparse")), A.enter(q("x-dense"))],
        [A.flow(q("x-f1"), { dur: 0.5 }), A.flow(q("x-f2"), { dur: 0.5 })],
        A.enter(q("x-fuse")),
        A.flow(q("x-f3"), { dur: 0.4 }),
        A.enter(q("x-rank")),
        A.pace(A.emit(q("rows"), { along: q("x-out") }), 2.5),
        A.wait(0.8),
        cam("full"),
        A.par(A.dim(q("c5"), { dur: 0.5, back: true }), A.at(0.4, A.highlight(lit, { dur: 0.8 }))),
        [A.hide([q("machine"), q("rows")], { dur: 0.6 }), A.dim(pipe, { dur: 0.6, back: true }), A.pulse(arrows[14], { dur: 1.0 })],
        A.stagger(["search", "calls", "read", "nug", "tb", "atb"].map(function (k) { return sig(k, 0); }), function (r) { return A.enter(r); }, 0.35),
        A.wait(0.4)] },
      /* J 4, turn 2: back up, then to Read; J 5, turn 3 inside it, while the two cards idle */
      { name: "J 4 and J 5", layers: [
        go(3),
        cam("t2"), A.pace(A.emit(q("t2")), 2.5), A.wait(0.4),
        cam("read"),
        go(4),
        A.dim(pipe, { to: 0.3, dur: 0.5 }),
        A.enter(q("fun")),
        /* once acted, each scene settles into its ending idle (anim/idles.js) until its card is put away */
        idling("fun", A.seq(
          A.pace(A.enter(q("hanp")), 3),
          idling("hanp", A.seq(
            A.wait(0.6),
            cam("full"),
            A.par(bump("calls", 1), bump("read", 1)),
            A.wait(0.3),
            /* J 5, turn 3: back up, then down to the nugget check */
            go(5),
            cam("t3"), A.pace(A.emit(q("t3")), 2.5), A.wait(0.3),
            cam("check"),
            go(6, 10),
            A.reveal(q("fun2"), { dur: 0.05 }),
            A.par(A.enter(q("n5")), A.at(1.6, A.highlight(spans, { dur: 1.0 }))),
            A.wait(0.5),
            go(11, 7),
            cam("t3"),
            A.type(q("reply"), { quick: true }),
            A.wait(0.8),
            cam("full"))))),
        [A.hide([q("fun"), q("fun2"), q("hanp"), q("n5")], { dur: 0.6 }), A.dim(pipe, { dur: 0.6, back: true }),
         A.pulse(arrows[15], { dur: 1.0 })],
        [bump("calls", 2), bump("nug", 1)],
        A.wait(0.3)] },
      /* J 6, turn 4: submit, the gate's ruling, the answer */
      { name: "J 6", layers: [
        cam("t4"), A.pace(A.emit(q("t4")), 2.5), A.wait(0.3),
        cam("gate"),
        go(8, 12),
        A.reveal(q("g5"), { dur: 0.3 }),
        A.count(q("g5-reading"), { dur: 1.0 }),
        A.write(q("g5-verdict")),
        A.wait(0.3),
        A.hide(q("p-answer"), { dur: 0.3 }),
        A.emit(q("a5"), { along: arrows[17], draw: false }),
        A.wait(0.8),
        cam("full", 1.3),
        A.par(A.hide(q("g5"), { dur: 0.5 }), bump("calls", 3), A.at(0.4, A.reveal(q("p-question"), { dur: 0.5 }))),
        A.wait(0.4)] }] })
  };
});
