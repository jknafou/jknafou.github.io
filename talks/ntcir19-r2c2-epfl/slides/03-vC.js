/* VARIANT C of slide 3, "one question's own answer" (a review page, not the deck's slide): Han Solo's question and
   its real submission (BITEM-PG-2, BITEM-AC-2).
   ENTRY (short and light): slide 2 set aside while the camera pans right (1 s); then THREE GROUPS STARTED TOGETHER:
   (1) the title keyed, the divider drawn; (2) what we have: its heading keyed, then the corpus (named, tiles in,
   count growing) and the questions (named; Han Solo's card pops RULED with its tag turned in, the strip's six tags
   turned in and counted in a ripple, multi-hop lit) together; (3) what we must return: its heading keyed, then PR
   (named, its 20 ruled rows in), AC (named, its card pops ruled, its gauge empty) and the nuggets (named, the four
   cards pop ruled, each "cites rank k" keyed) together. No question or claim typed, no scene, no gauge in the entry.
   STEPS, eight, by opacity only: 1 the corpus; 2 the question: its rules lifted, Han Solo's question keyed, its
   scene acting (loop: the scene again); 3 PR, its rows cited by the answer (1-4) lit, the others at 0.3; 4 AC: its
   rule lifted, the AI thinking, "Ilum" typed, the gauge growing and hunting to 100 (loop: the gauge hunting);
   5-8 each nugget in turn with the list: its rule lifted, the AI thinking, its claim typed, a line drawn from it to
   the row it cites, that row alone lit (loop: a bead along the line). */
Deck.slide("03-r2c2-task", function (A, q) {
  var six = [0, 1, 2, 3, 4, 5], four = [0, 1, 2, 3];
  var P = [q("corpus-blk"), q("qs-blk"), q("pr-blk"), q("ac-blk"), q("n-lab")].concat(four.map(function (j) { return q("nug" + j); }));
  var HOME = [1600, 0, 1600, 900], key = function (n) { return A.type(q(n), { quick: true }); };
  var ROWS = []; for (var r = 0; r < 20; r++) ROWS.push(q("pr-r" + r));
  var txt = function (n) { return q(n).querySelector("text"); };

  /* the list's rows lit: `a` and `b` the lit ranks before and after (null: all), the rest at 0.3 */
  function rows(a, b, dur) {
    var lv = function (S, i) { return !S || S.indexOf(i) >= 0 ? 1 : 0.3; }, E = A.ease.io;
    return A.track(dur, function (u) {
      var e = E(u <= 0 ? 0 : u >= 1 ? 1 : u);
      ROWS.forEach(function (n, i) { var v = lv(a, i) + (lv(b, i) - lv(a, i)) * e; n.style.opacity = v >= 0.9999 ? "" : v.toFixed(4); });
    });
  }
  function words() {
    var sc = q("q5-scene"), ty = A.type(q("q5-text"), { quick: true }), act = A.act(sc, { cue: ty.cue });
    return A.seq(A.reverse(A.draw(q("q5-ph"), { dur: 0.3 })), A.pace(A.par(ty, A.reveal(sc, { dur: 0.25 }), act), 1.4));
  }
  function answer() {
    var bar = q("ac-bar"), val = q("ac-value");
    return A.seq(A.reverse(A.draw(q("ac-ph"), { dur: 0.25 })), A.think(txt("ac-text"), { dur: 0.8 }), key("ac-text"),
      A.par(A.reveal(val, { dur: 0.2 }), A.grow(bar, { dur: 0.6 }), A.count(val, { dur: 0.6 })),
      A.fill(bar, { value: val, dur: 2.0 }));
  }
  function claim(j) {
    return A.seq(A.reverse(A.draw(q("n" + j + "-ph"), { dur: 0.25 })), A.think(txt("n" + j + "-claim"), { dur: 0.7 }),
      key("n" + j + "-claim"), A.flow(q("cite" + j), { dur: 0.55 }));
  }
  function replay() {
    var sc = q("q5-scene"), act = A.act(sc);
    return A.cycle(
      A.par(A.hold(act, 1.0), A.reveal(sc, { dur: 0 })),
      A.par(A.hold(act, 0.35), A.hide(sc, { dur: 0.35 })),
      A.par(act, A.reveal(sc, { dur: 0.3 })),
      A.par(A.hold(act, 1.6), A.reveal(sc, { dur: 0 })));
  }
  function bead(j) { return A.cycle(A.wait(0.6), A.pulse(q("cite" + j), { dur: 1.0 }), A.wait(0.8)); }
  function gauge() { return A.cycle(A.wait(0.6), A.fill(q("ac-bar"), { value: q("ac-value"), dur: 2.6 }), A.wait(1.2)); }

  var have = A.seq(key("have"), A.par(
    A.seq(key("corpus-name"), A.enter(q("corpus"))),
    A.seq(key("qs-name"), A.par(
      A.pace(A.enter(q("t5")), 2),
      A.seq(A.pop(q("q5"), { dur: 0.45 }), A.draw(q("q5-ph"), { dur: 0.4 })),
      A.stagger(six, function (k) { return A.pace(A.enter(q("s" + k)), 2); }, 0.1)))));
  var ret = A.seq(key("return"), A.par(
    A.seq(key("pr-name"), A.pace(A.enter(q("pr")), 2.5)),
    A.seq(key("ac-name"), A.pop(q("ac"), { dur: 0.45 }), A.draw(q("ac-ph"), { dur: 0.3 })),
    A.seq(key("n-name"), A.stagger(four, function (j) {
      return A.seq(A.pop(q("n" + j), { dur: 0.45 }), A.par(A.draw(q("n" + j + "-ph"), { dur: 0.35 }), key("n" + j + "-cite")));
    }, 0.12))));

  var STEP = [
    { to: 0 }, { to: 1, enter: words(), loop: replay() },
    { to: 2, lit: [0, 1, 2, 3] }, { to: 3, enter: answer(), loop: gauge() }
  ].concat(four.map(function (j) { return { to: [5 + j, 2, 4], lit: [j], enter: claim(j), loop: bead(j) }; }));
  var steps = STEP.map(function (st, s) {
    var prev = s ? STEP[s - 1] : { to: null, lit: null };
    var look = A.par(A.focus(P, { from: prev.to, to: st.to, dim: 0.3, dur: 0.5 }),
                     st.lit || prev.lit ? rows(prev.lit || null, st.lit || null, 0.5) : null);
    return { enter: st.enter ? A.seq(look, st.enter) : look, loop: st.loop || null };
  });
  return {
    entry: A.seq(
      A.par(A.dim(q("s2"), { dur: 0.5 }), A.camera(q.svg, [0, 0, 1600, 900], HOME, { dur: 1.0 })),
      A.par(A.par(key("task-head"), A.draw(q("divide"), { dur: 0.8 })), have, ret)),
    steps: steps
  };
});
