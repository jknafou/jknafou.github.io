/* Slide 4: its motions, from the animation bank only (anim/anim.js). The heading keyed in; the corpus pops
   at the left edge and is set aside at once (abstracted); Figure 1 is built in reading order (A.enter on
   the pipeline, data-enter="built": the bands, the question and its type, the transcript, the tools in a
   ripple and their calls, the two gates and the crossings, the record, the answer, the bracket).
   Last beat, the journey's grammar, wordless: the question card folds into its ball (the card goes, the
   ball pops on its arrow) while the answer card is set aside, not yet made; the ball rolls (A.travel)
   into each box in turn along the pipeline's own arrows, and each box puts out (A.emit) its stand-in:
   the type box a tag, the transcript a turn, Search its rows (an ink bead down the "every passage" leg),
   the nugget check a nugget; the ball goes up to Record, the transcript, down to Submit and the gate,
   and the gate puts out the answer (a bead along its arrow, the card brought back). The stand-ins and the
   ball fade, a new question card is there: the rest. Loop (e): that same roll, from the rest to the rest. */
Deck.slide("04-one-pipeline", function (A, q) {
  /* the pipeline's arrows, in its drawing order (concepts/pipeline.py): 0 question -> type, 1 type ->
     transcript, 2-9 each tool's call down (even) and result up (odd), Search, Read, Record, Submit;
     10/11 Record -> check and back, 12/13 Submit -> gate and back, 14 "every passage" down to the record,
     15 check -> record, 16 record -> gate, 17 gate -> answer */
  var arrows = [].slice.call(q("p").querySelectorAll('[data-concept="flow_arrow"]'));
  var outs = ["o-tag", "o-turn", "o-rows", "o-nugget"];
  function journey() {
    var ball = q("ball"), card = q("p-question"), ans = q("p-answer");
    var go = function (i) { return A.travel(ball, { along: arrows[i] }); };
    return A.seq(
      A.par(A.hide(card, { dur: 0.4 }), A.dim(ans, { dur: 0.4 }), A.at(0.2, A.pop(ball, { dur: 0.5 }))),
      go(0), A.emit(q("o-tag")),
      go(1), A.emit(q("o-turn")),
      go(2), A.emit(q("o-rows"), { along: arrows[14], draw: false }),
      go(3), go(6), go(10), A.emit(q("o-nugget")),
      go(11), go(7), go(8), go(12),
      A.emit(ans, { along: arrows[17], draw: false, enter: A.dim(ans, { dur: 0.5, back: true }) }),
      A.wait(1.2),
      A.par(A.hide(outs.map(q), { dur: 0.6 }), A.hide(ball, { dur: 0.4 }), A.at(0.3, A.reveal(card, { dur: 0.5 }))),
      A.wait(0.6)
    );
  }
  return {
    entry: A.seq(
      A.type(q("head"), { quick: true }),
      A.wait(0.2),
      A.par(A.enter(q("corpus")), A.at(0.6, A.dim(q("corpus"), { dur: 0.6 }))),
      A.enter(q("p")),
      A.wait(0.6),
      journey()
    ),
    loop: A.seq(A.wait(0.8), journey())
  };
});
