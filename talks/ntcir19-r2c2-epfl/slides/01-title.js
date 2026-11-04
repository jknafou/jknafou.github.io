/* Slide 1: the title. Left: the title keyed in (presented text: quick, no typo), the rule drawn by pen, the name
   keyed; the portrait pops like a balloon and its ring is drawn by pen from the top; the three marks pop one after
   another onto the ring. Right, top to bottom: the question card enters by its layers (Q keyed, lines drawn, its
   scene's disc popping); the arrow; the five tools' tracks pop with their chips, then each call of pass 4 adds one
   step to its tool's bar, in the trace's order; the arrow; the three passages enter in a ripple, the middle one's
   band swept and its disc popping; the arrow; the answer card enters, its gauge hunting and settling at 91. Last,
   "jknafou" is typed at a deliberate pace, and the caret stays after it.
   Rest loop: the caret blinks (four blinks) while the answer's confidence breathes once, up to 95, down to 35 and
   back to 91, its number following the bar (A.breathe); it starts and ends on the rest. */
Deck.slide("01-title", function (A, q) {
  var handle = A.type(q("contact-handle"), { typos: 0, cps: 9, caret: "stay" });
  var tools = ["search", "read", "record", "extract", "submit"], calls = [];
  for (var i = 0; i < 16; i++) calls.push(q("call" + i));
  var blink = 1.06;
  return {
    entry: A.seq(
      A.type([q("title-1"), q("title-2")], { quick: true }),
      A.draw(q("rule"), { dur: 0.4 }),
      A.type(q("author"), { quick: true }),
      A.wait(0.15),
      A.pop(q("contact-portrait"), { dur: 0.7 }),
      A.draw(q("contact-ring"), { dur: 0.9 }),
      A.pop(q("contact-github"), { dur: 0.45 }),
      A.pop(q("contact-hf"), { dur: 0.45 }),
      A.pop(q("contact-linkedin"), { dur: 0.45 }),
      A.wait(0.2),
      A.enter(q("q")),
      A.flow(q("ar-q"), { dur: 0.45 }),
      A.stagger(tools, function (t) { return A.par(A.pop(q("track-" + t), { dur: 0.4 }), A.pop(q("chip-" + t), { dur: 0.4 })); }, 0.08),
      A.stagger(calls, function (c) { return A.grow(c, { dir: "up", dur: 0.22 }); }, 0.18),
      A.flow(q("ar-b"), { dur: 0.45 }),
      A.stagger([q("p0"), q("p1"), q("p2")], function (p) { return A.enter(p); }, 0.15),
      A.flow(q("ar-p"), { dur: 0.45 }),
      A.enter(q("a")),
      A.wait(0.1),
      handle
    ),
    loop: A.par(A.seq(handle.blink(blink), handle.blink(blink), handle.blink(blink), handle.blink(blink)),
                A.breathe(q("a-bar"), { value: q("a-value"), dur: 4 * blink, hi: 0.95, lo: 0.35 }))
  };
});
