/* VARIANT B of slide 3, "one question that transforms" (a review page, not the deck's slide; slide 2's variant 2).
   ENTRY (short and light): slide 2 set aside while the camera pans right (1 s); then THREE GROUPS STARTED TOGETHER:
   (1) the title keyed, the divider drawn; (2) what we have: its heading keyed, then the corpus (named, tiles in,
   count growing) and the questions (named; the one card pops RULED with its tag turned in, the strip's six tags
   turned in and counted in a ripple, "simple" lit) together; (3) what we must return: its heading keyed, then PR,
   AC and the nuggets together (each nugget's arrow flowing once the rows are there). No question typed, no scene.
   STEPS, ten, by opacity only (nothing moves but the focus; the camera stays): 1 the corpus; 2 the question: its
   rules lifted, Hannibal's question keyed, its scene acting; 3-7 the card TRANSFORMS into the next type: its words
   un-keyed and its scene faded, its tag gone, then the next type's tag turned in and counted, its question keyed and
   its scene acting, the strip's light moving to it; each type's loop replays its scene; 8 PR; 9 AC (loop: the gauge
   hunting); 10 the nuggets and the list they cite (loop: a bead along each arrow). */
Deck.slide("03-r2c2-task", function (A, q) {
  var six = [0, 1, 2, 3, 4, 5];
  var P = [q("corpus-blk"), q("qs-blk"), q("pr-blk"), q("ac-blk"), q("n-blk")];
  var HOME = [1600, 0, 1600, 900], key = function (n) { return A.type(q(n), { quick: true }); };

  function words(i) {           /* card i's question keyed, its scene acting with the words */
    var sc = q("q" + i + "-scene"), ty = A.type(q("q" + i + "-text"), { quick: true }), act = A.act(sc, { cue: ty.cue });
    return A.pace(A.par(ty, A.reveal(sc, { dur: 0.25 }), act), 1.4);
  }
  function unwords(i) {         /* its words un-keyed (keying played backwards), its scene faded */
    var t = q("q" + i + "-text"), L = t.textContent.length;
    return A.par(A.reverse(A.type(t, { quick: true, cps: L / 0.35 })), A.hide(q("q" + i + "-scene"), { dur: 0.35 }));
  }
  /* the strip's light from type d to type e (the wrappers' opacity: 1 lit, 0.35 not) */
  function light(d, e, dur) {
    var a = q("lit" + d), b = q("lit" + e), E = A.ease.io;
    return A.track(dur, function (u) {
      var x = E(u <= 0 ? 0 : u >= 1 ? 1 : u);
      a.style.opacity = String(1 - 0.65 * x); b.style.opacity = String(0.35 + 0.65 * x);
    });
  }
  function into(e) {
    var d = e - 1;
    return A.seq(
      A.par(unwords(d), A.hide(q("tag" + d), { dur: 0.3 }), light(d, e, 0.6)),
      A.par(A.hide(q("card" + d), { dur: 0 }), A.hide(q("tag" + d), { dur: 0 }), A.reveal(q("card" + e), { dur: 0 }),
            A.reveal(q("tag" + e), { dur: 0 })),
      A.par(A.pace(A.enter(q("t" + e)), 2), words(e)));
  }
  function replay(i) {
    var sc = q("q" + i + "-scene"), act = A.act(sc);
    return A.cycle(
      A.par(A.hold(act, 1.0), A.reveal(sc, { dur: 0 })),
      A.par(A.hold(act, 0.35), A.hide(sc, { dur: 0.35 })),
      A.par(act, A.reveal(sc, { dur: 0.3 })),
      A.par(A.hold(act, 1.6), A.reveal(sc, { dur: 0 })));
  }
  function cites() {
    return A.cycle.apply(null, [0, 1, 2].map(function (j) {
      return A.seq(A.wait(j ? 0.3 : 0.6), A.pulse(q("cite" + j), { dur: 0.9 }));
    }).concat([A.wait(0.8)]));
  }
  function gauge() { return A.cycle(A.wait(0.6), A.fill(q("ac-bar"), { value: q("ac-value"), dur: 2.6 }), A.wait(1.2)); }

  var have = A.seq(key("have"), A.par(
    A.seq(key("corpus-name"), A.enter(q("corpus"))),
    A.seq(key("qs-name"), A.par(
      A.pace(A.enter(q("t0")), 2),
      A.seq(A.pop(q("q0"), { dur: 0.45 }), A.draw(q("q0-ph"), { dur: 0.4 })),
      A.stagger(six, function (k) { return A.pace(A.enter(q("s" + k)), 2); }, 0.1)))));
  var prG = A.seq(key("pr-name"), A.pace(A.enter(q("pr")), 2.5));
  var nugs = A.seq(key("n-name"), A.stagger([0, 1, 2], function (j) { return A.enter(q("n" + j)); }, 0.12));
  var arrows = A.stagger([0, 1, 2], function (j) { return A.flow(q("cite" + j), { dur: 0.45 }); }, 0.1);
  var ret = A.seq(key("return"), A.par(prG,
    A.seq(key("ac-name"), A.pace(A.enter(q("ac")), 2)),
    A.par(nugs, A.at(Math.max(prG.dur, nugs.dur), arrows))));

  var TO = [0, 1, 1, 1, 1, 1, 1, 2, 3, [4, 2]];
  var steps = TO.map(function (to, s) {
    var look = s && TO[s - 1] === to ? null : A.focus(P, { from: s ? TO[s - 1] : null, to: to, dim: 0.3, dur: 0.5 });
    var enter = s === 1 ? A.seq(look, A.reverse(A.draw(q("q0-ph"), { dur: 0.3 })), words(0))
              : s >= 2 && s <= 6 ? into(s - 1) : look;
    return { enter: enter, loop: s >= 1 && s <= 6 ? replay(s - 1) : s === 8 ? gauge() : s === 9 ? cites() : null };
  });
  return {
    entry: A.seq(
      A.par(A.dim(q("s2"), { dur: 0.5 }), A.camera(q.svg, [0, 0, 1600, 900], HOME, { dur: 1.0 })),
      A.par(A.par(key("task-head"), A.draw(q("divide"), { dur: 0.8 })), have, ret)),
    steps: steps
  };
});
