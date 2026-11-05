/* VARIANT 2 of slide 2 (a review page, not the deck's slide): one row that becomes each use case in turn.
   ENTRY: the heading and the row together; the row as slide 2's, played to its end (its name keyed, its line keyed,
   the question card, each arrow after both its ends, the AI, the answer with its gauge, the gate with its threshold,
   the branches, "yes" and "no", the outcomes), then the Q ball pops in at the question card.
   LOOP (the overview, the support desk): its five rounds, as slide 2's step 1.
   STEPS: 1 into the contract and regulation lookup, 2 into the internal knowledge base. Each enter (~0.8 s): the name,
   its line and the outgoing outcome's words erased and keyed anew (A.type, the stacked words of the next use case),
   the threshold re-counted from the old bar to the new one, the question card's ruled lines undrawn and drawn again
   (A.draw), the gauge moving to the new use case's drawn confidence; the rest of the pipeline stays in place. Each
   step's loop: that use case's five rounds. The rounds are slide 2's, unchanged. */
Deck.slide("02-answer-with-confidence", function (A, q) {
  var g = q("row0"), k = "r0", ball = q("b0");
  var THR = g.getAttribute("data-thr").split(",").map(Number), CONF = g.getAttribute("data-conf").split(",").map(Number);
  var ROUNDS = g.getAttribute("data-rounds").split("|").map(function (s) { return s.split(",").map(Number); });
  var sfx = function (e) { return e ? String(e) : ""; };
  var back = function (tr) { return { dur: tr.dur, set: function (t) { tr.set(tr.dur - t); } }; };   /* a track played backwards */
  var lines = [0, 1, 2].map(function (i) { return q(k + "-q-line" + i); });

  function row() {
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
      A.par(A.enter(q(k + "-sent")), A.enter(q(k + "-review"))),
      A.pop(ball, { dur: 0.45 })
    );
  }
  /* one round: the AI answers with confidence v against thr, after a round that ended on `prev` (slide 2's round) */
  function round(v, prev, thr) {
    var up = v >= thr, bar = q(k + "-a-bar"), val = q(k + "-a-value");
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
      A.par(think, A.hold(fill, think.dur, 0)),
      fill,
      A.par(A.reveal(mark, { dur: 0.01 }), A.write(mark, { dur: 0.5 })),
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
    return A.cycle.apply(null, V.map(function (v, j) { return round(v, V[(j + V.length - 1) % V.length], THR[e]); }));
  }
  /* re-keyed: the words erased (typing played backwards), the next use case's keyed in their place */
  var OUT = 0.25, IN = 0.4;
  function rekey(a, b) {
    var la = (a._full != null ? a._full : a.textContent).length, lb = (b._full != null ? b._full : b.textContent).length;
    return A.seq(back(A.type(a, { quick: true, cps: la / OUT })), A.type(b, { quick: true, cps: lb / IN }));
  }
  /* re-counted: the threshold's number from the old bar to the new one, its "≥ " kept */
  function recount(el, a, b, dur) {
    var pre = el.textContent.replace(/\d+.*$/, ""), E = A.ease.io;
    return A.track(dur, function (u) { el.textContent = pre + Math.round(a + (b - a) * E(u)); });
  }
  /* the gauge moved from one drawn confidence to the next, its number with it */
  function regauge(a, b, dur) {
    var bar = q(k + "-a-bar"), val = q(k + "-a-value"), full = parseFloat(bar.getAttribute("data-full"));
    var min = parseFloat(bar.getAttribute("height")) || 0, E = A.ease.io;
    return A.track(dur, function (u) {
      var x = a + (b - a) * E(u);
      bar.setAttribute("width", Math.max(min, full * x / 100).toFixed(2)); bar.style.opacity = "";
      val.textContent = String(Math.round(x)); val.style.opacity = "";
    });
  }
  function into(e) {     /* from use case e - 1 to use case e */
    var d = e - 1;
    return A.par(
      rekey(q(k + "-name" + sfx(d)), q(k + "-name" + sfx(e))),
      rekey(q(k + "-note" + sfx(d)), q(k + "-note" + sfx(e))),
      rekey(q(k + "-sent-text" + sfx(d)), q(k + "-sent-text" + sfx(e))),
      recount(q(k + "-gate-title"), THR[d], THR[e], 0.7),
      A.seq(back(A.draw(lines, { dur: 0.28 })), A.stagger(lines, function (l) { return A.draw(l, { dur: 0.36 }); }, 0.08)),
      regauge(CONF[d], CONF[e], 0.7));
  }
  return {
    entry: A.par(A.type(q("head"), { quick: true }), row()),
    loop: rounds(0),
    steps: [{ enter: into(1), loop: rounds(1) }, { enter: into(2), loop: rounds(2) }]
  };
});
