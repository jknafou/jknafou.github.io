/* Slide 1: the title. Its entry is a TREE of groups in layers (A.groups, anim/steps.js; PLAN.md, "A slide animates by
   groups"; the author, 5 November 2026: "the pipeline as three group (query, model, answer) in the model there are
   different groups that should start simultaneously (tool calls and passages) in the tool calls there are different
   groups that should starts simultaneously too"). A layer waits for the layer before it in its group; the members of
   a layer start at the same instant. The tree (also in the .py's header):
     slide: ONE LAYER, all started together at t = 0 (as the author validated, 5 November 2026)
     ├─ header     layers: the title keyed → the rule drawn by pen → "Dr. Julien Knafou" keyed
     ├─ HES-SO     its letters appear one after another (H e s · s o, 9 a second), no plate behind them
     ├─ corner     layers: the portrait pops → its ring drawn from the top → the three marks pop in turn → "jknafou"
     │             typed, the caret staying: its IDLE, the caret blinking, starts the moment "jknafou" is written
     └─ emblem     layers: query → model → answer → the links
        ├─ query   the question card entering by its layers
        ├─ model   layers: [tool calls ‖ passages ‖ the block's frame] → the calls
        │  ├─ tool calls  one layer: "tool calls" keyed ‖ the five tools, each its track ‖ its chip, all together
        │  ├─ passages    one layer: "passages" keyed ‖ the window ‖ its rails
        │  ├─ frame       the block's frame drawn in
        │  └─ then the calls, what joins the tools to the passages: the 16 calls grow their bars one step each in the
        │     trace's order while the passages roll left through the window, two laps, Ilum coming to rest in front
        ├─ answer  the answer card entering, its gauge settling at 91
        └─ links   the two arrows together: question → block, block → answer (every arrow after both of its ends)
   Rest loop (8 blinks, 8.48 s, starting and ending on the rest still): the caret blinks; the answer's confidence
   breathes twice, up to 95, down to 35 and back to 91, its number following the bar (A.breathe); the passages
   keep rolling slowly left, one lap, so the marked one is in front again at the loop's end. */
Deck.slide("01-title", function (A, q) {
  /* the window's passages: off is in cards; off = mark puts the marked one in the window's centre */
  var car = q("car"), N = +car.getAttribute("data-n"), mark = +car.getAttribute("data-mark");
  var P = +car.getAttribute("data-pitch"), cx = +car.getAttribute("data-cx"), cy = +car.getAttribute("data-cy");
  var cw = +car.getAttribute("data-w"), ch = +car.getAttribute("data-h");
  var cards = [].slice.call(car.querySelectorAll("[data-card]"));
  function wrap(d) { d = ((d % N) + N) % N; return d >= N / 2 ? d - N : d; }
  function place(off) {
    cards.forEach(function (c, i) {
      c.setAttribute("transform", "translate(" + (cx - cw / 2 + wrap(i - off) * P).toFixed(2) + "," + (cy - ch / 2).toFixed(2) + ")");
    });
  }
  function roll(from, to, dur, ease) {
    return A.track(dur, function (u) { place(from + (to - from) * (ease || A.ease.out)(u)); });
  }
  place(mark);

  var handle = A.type(q("corner-handle"), { typos: 0, cps: 9, caret: "stay" });
  var tools = ["search", "read", "record", "extract", "submit"], calls = [], letters = [];
  for (var i = 0; i < 16; i++) calls.push(q("call" + i));
  for (var j = 0; j < 6; j++) letters.push(q("hes-l" + j));
  var blink = 1.06;
  var bars = A.stagger(calls, function (c) { return A.grow(c, { dir: "up", dur: 0.22 }); }, 0.2);

  var tree = { name: "slide", layers: [[
    { name: "header", layers: [A.type([q("title-1"), q("title-2")], { quick: true }), A.draw(q("rule"), { dur: 0.4 }),
                               A.type(q("author"), { quick: true })] },
    { name: "HES-SO", track: A.stagger(letters, function (l) { return A.reveal(l, { dur: 0.04 }); }, 1 / 9) },
    { name: "corner", layers: [A.pop(q("corner-portrait"), { dur: 0.6 }), A.draw(q("corner-ring"), { dur: 0.7 }),
                               A.stagger(["corner-github", "corner-hf", "corner-linkedin"], function (m) { return A.pop(q(m), { dur: 0.4 }); }, 0.15),
                               { name: "jknafou", track: handle, idle: handle.blink(blink) }] },
    { name: "emblem", layers: [
      { name: "query", track: A.enter(q("q")) },
      { name: "model", layers: [
        [{ name: "tool calls", group: [{ name: "tool calls label", track: A.type(q("lab-t"), { quick: true }) }].concat(tools.map(function (t) {
           return { name: "tool " + t, group: [A.pop(q("track-" + t), { dur: 0.4 }), A.pop(q("chip-" + t), { dur: 0.4 })] }; })) },
         { name: "passages", group: [A.type(q("lab-p"), { quick: true }), A.reveal(car, { dur: 0.5 }), A.reveal(q("car-rails"), { dur: 0.5 })] },
         { name: "frame", track: A.reveal(q("blockframe"), { dur: 0.45 }) }],
        { name: "calls", group: [bars, roll(mark - 2 * N, mark, bars.dur + 0.2)] }] },
      { name: "answer", track: A.enter(q("a")) },
      { name: "links", group: [A.flow(q("ar-q"), { dur: 0.45 }), A.flow(q("ar-p"), { dur: 0.45 })] }] }
  ]] };

  var k = 8, bl = [], br = [];
  for (var b = 0; b < k; b++) bl.push(handle.blink(blink));
  for (var r = 0; r < k / 4; r++) br.push(A.breathe(q("a-bar"), { value: q("a-value"), dur: 4 * blink, hi: 0.95, lo: 0.35 }));
  return {
    /* the caret starts blinking as soon as "jknafou" is written, while the emblem builds: an idle begins when
       its own group ends, not when the slide does (the author, 4 November 2026) */
    entry: A.groups(tree),
    loop: A.par(A.seq.apply(null, bl), A.seq.apply(null, br), roll(mark, mark + N, k * blink, A.ease.lin))
  };
});
