/* Slide 2: its motions, from the animation bank (anim/anim.js) and the steps' helpers and A.groups (anim/steps.js).
   The overview ("2") is the general idea (variant T, the author, 5 November 2026: "the VT is great"): the one row,
   generic (a ruled question, the AI, an answer at 94, the gate "≥ 70", "used as is" up, "a person reviews it" down),
   the idea in the row's two text slots.
   ENTRY, a tree of groups in layers (A.groups; the tree is in the .py's header; the author: "in a flat pipeline like
   the slide 2, the animations are "question" then "->" then "AI" then "->", ..."): two groups started together,
   (1) the words: the heading keyed, then the idea's two lines keyed; (2) the row, a FLOW, so every member and every
   arrow is its own layer, each waiting for the one before: the question card, the arrow, the AI, the arrow, the
   answer (its gauge entering empty, then growing to its confidence, the number counting), the arrow, the gate with
   its threshold, then the fork, whose two branches are parallel and start together (each: its arrow, its word
   "yes" / "no", its outcome). No Q ball on the overview (the author, 5 November 2026: "slide 2 should not show the
   "Q" coin"); it first appears in a step's rounds. Every line drawn, here and in the steps, is hidden until it has length (A.nodot), so no round cap shows as a
   dot where it starts.
   OVERVIEW IDLE ("2"): the answer's gauge breathes (A.breathe: up to 95, down to 35 across the threshold, back to 94,
   its number following), then 1.4 s still; it begins when the answer card has entered (an idle starts when its own
   group ends), still at first, so that its beat lands exactly at the entry's end and the slide's loop continues it.
   STEPS: 2.1 the support desk, 2.2 the contract and regulation lookup, 2.3 the internal knowledge base. Each enter is
   one layer, every part re-made at once: the name and its line (the idea's, then the use case before's) un-keyed and
   the use case's keyed in their place, the outgoing outcome's words re-keyed, the threshold re-counted (A.recount),
   the question card's ruled lines undrawn and drawn again, the gauge moved to the use case's drawn confidence
   (A.gaugeTo); 2.3's layer also holds the citation, a flow in layers: the dashed "cites" link drawn down from the
   answer, "cites" keyed, the passage popping in, the marker's yellow swept across its marked line (the quoted span).
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
  var GEN = g.getAttribute("data-g").split(",").map(Number);
  var ROUNDS = g.getAttribute("data-rounds").split("|").map(function (s) { return s.split(",").map(Number); });
  var lines = [0, 1, 2].map(function (i) { return q(k + "-q-line" + i); });
  var link = q(k + "-cite"), span = q(k + "-p-span"), bar = q(k + "-a-bar"), val = q(k + "-a-value");

  /* every line the entry draws without a round cap's dot at its start (A.nodot) */
  var enter = function (nm) { var el = q(k + "-" + nm); return A.nodot(A.enter(el), el); };
  var flow = function (nm) { var el = q(k + "-" + nm); return A.nodot(A.flow(el, { dur: 0.45 }), el); };
  var key = function (el) { return A.type(el, { quick: true }); };

  /* ---- the overview ---- */
  var loop = A.seq(A.breathe(bar, { value: val }), A.wait(1.4));
  var END = { t: 0 };
  /* the answer's leaf: its layers, then still until the breathing's phase meets the entry's end, then breathing */
  function settled(tr, id) {
    return { dur: tr.dur, set: function (t) {
      if (t <= tr.dur) { id.set(0); tr.set(t); return; }      /* the leaf's own state wins over the idle's start */
      tr.set(tr.dur);
      var D = id.dur, lead = (END.t - tr.dur) % D, since = t - tr.dur;
      id.set(since < lead ? 0 : ((((t - END.t) % D) + D) % D));
    } };
  }
  /* the answer enters with its gauge empty, then the gauge grows to its confidence, the number counting with it */
  var aIn = enter("a"), grow = A.gaugeTo(bar, { from: 0, to: GEN[0] / 100, value: val, dur: 1.2 });
  var answerIn = A.seq(A.par(aIn, A.hold(grow, aIn.dur, 0)), grow);
  var tree = { name: "slide", group: [
    { name: "no ball on the overview", track: A.hide(ball, { dur: 0 }) },
    { name: "words", layers: [key(q("head")), key([q(k + "-name-g"), q(k + "-note-g")])] },
    { name: "row", layers: [
      { name: "question", track: enter("q") },
      { name: "arrow to the AI", track: flow("a1") },
      { name: "AI", track: enter("ai") },
      { name: "arrow to the answer", track: flow("a2") },
      { name: "answer", track: settled(answerIn, loop) },
      { name: "arrow to the gate", track: flow("a3") },
      { name: "gate", track: enter("gate") },
      { name: "fork", group: [
        { name: "yes branch", layers: [flow("up"), key(q(k + "-yes")), A.enter(q(k + "-sent"))] },
        { name: "no branch", layers: [flow("down"), key(q(k + "-no")), A.enter(q(k + "-review"))] }] }] }] };
  var entry = A.groups(tree);
  END.t = entry.dur;

  /* ---- the steps ---- */
  function round(v, prev, thr, cite) {
    var up = v >= thr;
    var mark = q(k + (up ? "-ok" : "-ko")), other = q(k + (up ? "-ko" : "-ok"));
    var t1 = A.travel(ball, { along: [q(k + "-a1")], into: [q(k + "-ai")], dur: 0.9 });
    var tA = A.travel(ball, { along: [q(k + "-a2")], into: [q(k + "-a")], dur: 0.6 });
    var turn = A.become(ball, { from: "Q", to: "A", dur: 0.45 });
    var t2 = A.travel(ball, { along: [q(k + "-a3"), q(k + "-" + (up ? "up" : "down"))],
                              into: [q(k + "-gate"), q(k + "-" + (up ? "sent" : "review"))], dur: 1.4 });
    var shown = A.pop(ball, { dur: 0.35 }), last = A.fillTo(bar, { frac: prev / 100, shown: prev, value: val });
    var think = A.think(val, { dur: 0.9 }), fill = A.fillTo(bar, { frac: v / 100, shown: v, value: val, dur: 1.2 });
    var body = A.seq(
      A.par(t1, A.hold(shown, t1.dur), A.hold(last, t1.dur), A.hold(turn, t1.dur, 0)),
      A.par(A.hold(tA, turn.dur, 0), turn, A.hold(fill, turn.dur, 0)),
      tA,
      A.par(think, A.hold(fill, think.dur, 0), cite ? A.highlight(span, { out: true, dur: 0.3 }) : null),
      fill,
      A.par(A.reveal(mark, { dur: 0.01 }), A.write(mark, { dur: 0.5 }),
            cite ? A.pulse(link, { dur: 0.5 }) : null,
            cite ? A.at(0.2, A.highlight(span, { dur: 0.45 })) : null),
      A.wait(0.25),
      A.par(A.hold(t2, 0.35, 0), A.pop(ball, { dur: 0.35 })),
      t2,
      A.wait(0.3),
      A.par(A.hold(t1, 0.4, 0), A.hold(turn, 0.4, 0), A.pop(ball, { dur: 0.4 }), A.hide(mark, { dur: 0.3 })),
      A.wait(0.4));
    return A.par(body, A.hold(A.hide(other, { dur: 0 }), body.dur));
  }
  function rounds(e) {
    var V = ROUNDS[e];
    return A.cycle.apply(null, V.map(function (v, j) { return round(v, V[(j + V.length - 1) % V.length], THR[e], e === CITE); }));
  }
  var OUT = 0.25, IN = 0.4;
  var len = function (el) { return (el._full != null ? el._full : el.textContent).length; };
  function rekey(a, b) {      /* a's words un-keyed (none: an empty slot), b's keyed in their place */
    var kin = A.type(b, { quick: true, cps: len(b) / IN });
    return a ? A.seq(A.reverse(A.type(a, { quick: true, cps: len(a) / OUT })), kin) : A.seq(A.wait(OUT), kin);
  }
  /* the citation, a flow down from the answer, in reading order: the "cites" link drawn, its word keyed, the passage
     popping in under it, then its quoted span swept */
  function citation() {
    return { name: "citation", layers: [
      [A.reveal(q(k + "-citation"), { dur: 0.01 }), A.flow(link, { dur: 0.4 })],
      A.type(q(k + "-cites"), { quick: true }),
      A.pop(q(k + "-p"), { dur: 0.35 }),
      A.highlight(span, { dur: 0.4 })] };
  }
  var word = function (w, e) { return e < 0 ? (w === "sent-text" ? q(k + "-sent-text") : q(k + "-" + w + "-g")) : q(k + "-" + w + "-u" + e); };
  function into(e) {     /* from use case e - 1 (-1: the general overview) to use case e: one layer, all re-made at once */
    var d = e - 1;
    return A.groups({ name: "2." + (e + 1), group: [
      { name: "name", track: rekey(word("name", d), word("name", e)) },
      { name: "line", track: rekey(word("note", d), word("note", e)) },
      { name: "outcome", track: rekey(word("sent-text", d), word("sent-text", e)) },
      { name: "threshold", track: A.recount(q(k + "-gate-title"), { from: d < 0 ? GEN[1] : THR[d], to: THR[e], dur: 0.7 }) },
      { name: "question", track: A.seq(A.reverse(A.nodot(A.draw(lines, { dur: 0.28 }), lines)),
            A.stagger(lines, function (l) { return A.nodot(A.draw(l, { dur: 0.36 }), l); }, 0.08)) },
      { name: "gauge", track: A.gaugeTo(bar, { from: (d < 0 ? GEN[0] : CONF[d]) / 100, to: CONF[e] / 100, value: val, dur: 0.7 }) },
      e === CITE ? citation() : null] });
  }
  return {
    entry: entry,
    loop: loop,
    steps: [{ enter: into(0), loop: rounds(0) }, { enter: into(1), loop: rounds(1) }, { enter: into(2), loop: rounds(2) }]
  };
});
