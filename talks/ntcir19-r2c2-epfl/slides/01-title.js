/* Slide 1: the title. The title keyed in (presented text: quick, no typo), the rule drawn by pen, the
   name keyed; then the portrait pops like a balloon and its ring is drawn by pen from the top; the three
   marks pop one after another onto the ring; "jknafou" is typed at a deliberate pace (a short word keyed
   quickly is over before it is seen), and the caret stays after it. The rest
   loop is that caret blinking, and nothing else. */
Deck.slide("01-title", function (A, q) {
  var handle = A.type(q("contact-handle"), { typos: 0, cps: 9, caret: "stay" });
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
      A.wait(0.1),
      handle
    ),
    loop: handle.blink()
  };
});
