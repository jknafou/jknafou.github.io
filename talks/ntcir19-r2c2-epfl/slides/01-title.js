/* Slide 1: the title. Two groups, never interleaved (PLAN.md, "A slide animates by groups"):
   GROUP 1, the header and the foot, one plane, all started together, each running continuously to its end:
     - the title keyed in (presented text: quick, no typo), the rule drawn by pen, "Dr. Julien Knafou" keyed;
     - the HES-SO mark: its chip pops, then its letters appear one after another, H e s . s o, at the pace
       "jknafou" is typed (9 a second);
     - the corner unit: the portrait pops, its ring is drawn by pen from the top, the three marks pop one after
       another, then "jknafou" is typed at a deliberate pace, the caret staying after it.
   GROUP 2, the pipeline emblem, once group 1 has ended: the question card enters by its layers; the arrow; "tool
     calls" keyed while the five tracks pop with their chips; the block's frame drawn in; "passages" keyed while the
     window and its rails appear; the 16 calls grow their bars one step each in the trace's order while the passages
     roll left through the window, two laps, the marked one (Ilum) coming to rest in front; the arrow; the answer
     card enters, its gauge settling at 91.
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

  var header = A.seq(A.type([q("title-1"), q("title-2")], { quick: true }), A.draw(q("rule"), { dur: 0.4 }),
                     A.type(q("author"), { quick: true }));
  var hes = A.seq(A.pop(q("hes-chip"), { dur: 0.6 }),
                  A.stagger(letters, function (l) { return A.reveal(l, { dur: 0.04 }); }, 1 / 9));
  var unit = A.seq(A.pop(q("corner-portrait"), { dur: 0.6 }), A.draw(q("corner-ring"), { dur: 0.7 }),
                   A.stagger(["corner-github", "corner-hf", "corner-linkedin"], function (m) { return A.pop(q(m), { dur: 0.4 }); }, 0.15),
                   handle);
  var group1 = A.par(header, hes, unit);

  var bars = A.stagger(calls, function (c) { return A.grow(c, { dir: "up", dur: 0.22 }); }, 0.2);
  var group2 = A.seq(
    A.enter(q("q")),
    A.flow(q("ar-q"), { dur: 0.45 }),
    A.par(A.type(q("lab-t"), { quick: true }),
          A.stagger(tools, function (t) { return A.par(A.pop(q("track-" + t), { dur: 0.4 }), A.pop(q("chip-" + t), { dur: 0.4 })); }, 0.08)),
    A.reveal(q("blockframe"), { dur: 0.45 }),
    A.par(A.type(q("lab-p"), { quick: true }), A.reveal(car, { dur: 0.5 }), A.reveal(q("car-rails"), { dur: 0.5 })),
    A.par(bars, roll(mark - 2 * N, mark, bars.dur + 0.2)),
    A.flow(q("ar-p"), { dur: 0.45 }),
    A.enter(q("a")));

  var k = 8, bl = [], br = [];
  for (var b = 0; b < k; b++) bl.push(handle.blink(blink));
  for (var r = 0; r < k / 4; r++) br.push(A.breathe(q("a-bar"), { value: q("a-value"), dur: 4 * blink, hi: 0.95, lo: 0.35 }));
  return {
    entry: A.seq(group1, A.wait(0.25), group2),
    loop: A.par(A.seq.apply(null, bl), A.seq.apply(null, br), roll(mark, mark + N, k * blink, A.ease.lin))
  };
});
