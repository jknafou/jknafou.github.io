/* Slide 12: thank you. No steps. Its entry is a TREE of groups in layers (A.groups, anim/steps.js; PLAN.md, "A slide
   animates by groups"), the tree also in the .py's header:
     slide: ONE LAYER, all started together at t = 0
     ├─ header   layers: "Thank you" keyed → the rule drawn by pen
     ├─ authors  layers: the six names keyed → the affiliations keyed
     ├─ QR       one layer: the paper's card ‖ the code's card, each by A.enter's layers (card and code pop, caption keyed)
     └─ handles  layers: the portrait pops → its ring drawn from the top → the three marks pop in turn →
                 ["jknafou" typed, the caret staying ‖ the sentence keyed]; "jknafou"'s IDLE, the caret blinking,
                 starts the moment it is written (as on the title slide)
   Rest: still, the caret blinking after "jknafou" (8 blinks, starting and ending on the rest still). */
Deck.slide("12-thank-you", function (A, q) {
  var blink = 1.06;
  var handle = A.type(q("me-handle"), { typos: 0, cps: 9, caret: "stay" });
  var tree = { name: "slide", layers: [[
    { name: "header", layers: [A.type(q("thanks"), { quick: true }), A.draw(q("rule"), { dur: 0.4 })] },
    { name: "authors", layers: [A.type(q("authors"), { quick: true, dur: 2.2 }), A.type(q("affil"), { quick: true })] },
    { name: "QR", group: [{ name: "QR paper", track: A.enter(q("qr-paper")) }, { name: "QR code", track: A.enter(q("qr-code")) }] },
    { name: "handles", layers: [A.pop(q("me-portrait"), { dur: 0.6 }), A.draw(q("me-ring"), { dur: 0.7 }),
                                A.stagger(["me-github", "me-hf", "me-linkedin"], function (m) { return A.pop(q(m), { dur: 0.4 }); }, 0.15),
                                [{ name: "jknafou", track: handle, idle: handle.blink(blink) },
                                 { name: "links", track: A.type(q("links"), { quick: true, dur: 2.4 }) }]] }
  ]] };
  var bl = [];
  for (var b = 0; b < 8; b++) bl.push(handle.blink(blink));
  return { entry: A.groups(tree), loop: A.seq.apply(null, bl) };
});
