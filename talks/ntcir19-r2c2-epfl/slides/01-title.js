/* Slide 1: the title. Every line keyed in, in reading order (presented text: quick, no typo), the
   rule drawn by pen between the talk and the speaker, then the handles enter by their layers. No loop. */
Deck.slide("01-title", function (A, q) {
  return {
    entry: A.seq(
      A.type(q("title"), { quick: true }),
      A.type([q("sub-1"), q("sub-2")], { quick: true }),
      A.draw(q("rule"), { dur: 0.4 }),
      A.type(q("author"), { quick: true }),
      A.type([q("affil"), q("venue")], { quick: true }),
      A.wait(0.2),
      A.enter(q("contact"))
    )
  };
});
