/* Slide 2, the two overview variants (review pages): T (data-idea="1", the idea in the row's two text slots) and N
   (data-idea="0", no words but the boxes'). Everything after the overview is slide 2 as validated.
   ENTRY, by nested groups all starting together (A.groups, PLAN.md "A slide animates by groups"):
     [ the header ("head" keyed),
       (T) the idea's words (its two lines keyed, one run),
       { group: [ the question card, the AI, {the answer card, idle: its gauge breathing}, the gate,
                  [the two outcomes] ],
         then: [ every arrow (a1, a2, a3, up, down) drawn together, then "yes" and "no" keyed, then the Q ball pops
                 in at the question card ] } ]
   OVERVIEW IDLE ("2"): the answer's gauge breathes (A.breathe: up to 95, down to 35 across the threshold, back to 94,
   its number following), then 1.4 s still; it begins when the answer card has entered (an idle starts when its own
   group ends), still at first, so that its beat lands exactly at the entry's end and the slide's loop continues it.
   STEPS: 2.1 the support desk: (T) the idea's two lines un-keyed and the support desk's keyed in their place, (N) its
   name and line keyed in the empty slots; the outgoing words re-keyed ("used as is" -> "sent to the customer"), the
   question card's ruled lines redrawn (the Q ball stays at its card: a pop would hide it at the overview's rest); its loop its five rounds. 2.2, 2.3 as validated
   (2.3 brings the citation in). */
Deck.slide("02-answer-with-confidence", function (A, q) {
  var g = q("row0"), k = "r0", ball = q("b0"), CITE = +g.getAttribute("data-cite"), IDEA = g.getAttribute("data-idea") === "1";
  var THR = g.getAttribute("data-thr").split(",").map(Number), CONF = g.getAttribute("data-conf").split(",").map(Number);
  var GEN = g.getAttribute("data-g").split(",").map(Number);
  var ROUNDS = g.getAttribute("data-rounds").split("|").map(function (s) { return s.split(",").map(Number); });
  var lines = [0, 1, 2].map(function (i) { return q(k + "-q-line" + i); });
  var link = q(k + "-cite"), span = q(k + "-p-span"), bar = q(k + "-a-bar"), val = q(k + "-a-value");

  var enter = function (nm) { var el = q(k + "-" + nm); return A.nodot(A.enter(el), el); };
  var flow = function (nm) { var el = q(k + "-" + nm); return A.nodot(A.flow(el, { dur: 0.45 }), el); };

  /* ---- the overview ---- */
  var loop = A.seq(A.breathe(bar, { value: val }), A.wait(1.4));
  var END = { t: 0 };
  /* the answer's leaf: its layers, then still until the breathing's phase meets the entry's end, then breathing */
  function settled(tr, id) {
    return { dur: tr.dur, set: function (t) {
      if (t <= tr.dur) { tr.set(t); id.set(0); return; }
      tr.set(tr.dur);
      var D = id.dur, lead = (END.t - tr.dur) % D, since = t - tr.dur;
      id.set(since < lead ? 0 : ((((t - END.t) % D) + D) % D));
    } };
  }
  var tree = [
    A.type(q("head"), { quick: true }),
    IDEA ? A.type([q(k + "-name-g"), q(k + "-note-g")], { quick: true }) : null,
    { group: [enter("q"), enter("ai"), settled(enter("a"), loop), enter("gate"), [A.enter(q(k + "-sent")), A.enter(q(k + "-review"))]],
      then: A.seq(A.par(flow("a1"), flow("a2"), flow("a3"), flow("up"), flow("down")),
                  A.type([q(k + "-yes"), q(k + "-no")], { quick: true }),
                  A.pop(ball, { dur: 0.45 })) }
  ].filter(Boolean);
  var entry = A.groups(tree);
  END.t = entry.dur;

  /* ---- the steps: slide 2's, as validated ---- */
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
  function citation() {
    return A.par(
      A.reveal(q(k + "-citation"), { dur: 0.01 }),
      A.at(0.1, A.pop(q(k + "-p"), { dur: 0.35 })),
      A.at(0.3, A.flow(link, { dur: 0.4 })),
      A.at(0.45, A.type(q(k + "-cites"), { quick: true })),
      A.at(0.55, A.highlight(span, { dur: 0.4 })));
  }
  var word = function (w, e) { return e < 0 ? (w === "sent-text" ? q(k + "-sent-text") : IDEA ? q(k + "-" + w + "-g") : null) : q(k + "-" + w + "-u" + e); };
  function into(e) {     /* from use case e - 1 (-1: the general overview) to use case e */
    var d = e - 1;
    return A.par(
      rekey(word("name", d), word("name", e)),
      rekey(word("note", d), word("note", e)),
      rekey(word("sent-text", d), word("sent-text", e)),
      A.recount(q(k + "-gate-title"), { from: d < 0 ? GEN[1] : THR[d], to: THR[e], dur: 0.7 }),
      A.seq(A.reverse(A.nodot(A.draw(lines, { dur: 0.28 }), lines)),
            A.stagger(lines, function (l) { return A.nodot(A.draw(l, { dur: 0.36 }), l); }, 0.08)),
      A.gaugeTo(bar, { from: (d < 0 ? GEN[0] : CONF[d]) / 100, to: CONF[e] / 100, value: val, dur: 0.7 }),
      e === CITE ? citation() : null);
  }
  return {
    entry: entry,
    loop: loop,
    steps: [{ enter: into(0), loop: rounds(0) }, { enter: into(1), loop: rounds(1) }, { enter: into(2), loop: rounds(2) }]
  };
});
