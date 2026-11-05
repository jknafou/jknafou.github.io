/* Slide 3: its motions, from the animation bank (anim/anim.js) and the steps' helpers (anim/steps.js). Variant A of
   the review of 5 November 2026, "quiet overview, detail on demand" (the author: "For the slide 3, I like the
   variant A.").
   ENTRY (short and light), a tree of groups in layers (A.groups; the tree is in the .py's header): (1) the camera
   set at once on the task canvas's right half (the slide no longer continues slide 2: it starts from paper); then
   THREE GROUPS STARTED TOGETHER: (2) the title keyed while the divider is drawn down; (3) what we have: its heading
   keyed, then the corpus (named, then its tiles in, its count growing) and the questions (named, then the six cards
   all together: each its type tag turned in and counted while its card pops RULED, then its rows' rules drawn: no
   words, no scene) together; (4) what we must return: its heading keyed, then PR (named, then its 20 ruled rows
   in), AC (named, then its card in, its gauge settling) and the nuggets (named, then the three ruled N cards popping
   together) together, then the three arrows flowing together, each to the row it cites (the links of the right
   side, its last layer). No question is typed and no scene plays in the entry; it ends on the overview, nothing
   moving.
   STEPS, ten, over the parts P = [corpus, the six types, PR, AC, the nuggets]: 1 the camera closes on the corpus,
   the rest at 0.3 (A.zoom, A.focus); 2-7 each type in turn: the camera pans to its card (the six frames are one
   size: it only moves) while the focus moves to it, then its rules are lifted and its real question keyed, its
   scene acting with the words (the card stays filled after its step); its loop is the scene's ending idle; 8 the camera opens
   on what we must return, PR in focus; 9 AC in focus (the camera stays), its loop the gauge hunting and settling;
   10 the nuggets and the list they cite in focus, its loop a bead along each nugget's arrow to the row it cites. */
Deck.slide("03-r2c2-task", function (A, q) {
  var six = [0, 1, 2, 3, 4, 5];
  var P = [q("corpus-blk")].concat(six.map(function (i) { return q("c" + i); }), [q("pr-blk"), q("ac-blk"), q("n-blk")]);
  var F = P.map(function (p) { return p.getAttribute("data-frame").split(",").map(Number); });
  var HOME = [1600, 0, 1600, 900], key = function (n) { return A.type(q(n), { quick: true }); };

  /* the entry's ruled card: its tag turned in while the card pops, then its rows' rules drawn */
  function ruledCard(i) {
    return { name: "card " + (i + 1), group: [
      { name: "tag " + (i + 1), track: A.pace(A.enter(q("t" + i)), 2) },
      { name: "ruled " + (i + 1), layers: [A.pop(q("q" + i), { dur: 0.45 }), A.draw(q("q" + i + "-ph"), { dur: 0.35 })] }] };
  }
  /* a step's card filled, in layers: its rules lifted, then its question keyed, its scene acting with the words */
  function fill(i) {
    var sc = q("q" + i + "-scene"), ty = A.type(q("q" + i + "-text"), { quick: true }), act = A.act(sc, { cue: ty.cue });
    return { name: "fill " + (i + 1), layers: [A.reverse(A.draw(q("q" + i + "-ph"), { dur: 0.3 })),
                                               A.pace(A.par(ty, A.reveal(sc, { dur: 0.25 }), act), 1.4)] };
  }
  /* the card's scene, once its step has acted it: its ending idle (anim/idles.js, PLAN.md scene rule 9), never the
     act again; re-entering the step acts it once more */
  function replay(i) {
    return A.ending(q("q" + i + "-scene"), { acted: true });
  }
  function cites() {
    return A.cycle.apply(null, [0, 1, 2].map(function (j) {
      return A.seq(A.wait(j ? 0.3 : 0.6), A.pulse(q("cite" + j), { dur: 0.9 }));
    }).concat([A.wait(0.8)]));
  }
  function gauge() {
    return A.cycle(A.wait(0.6), A.fill(q("ac-bar"), { value: q("ac-value"), dur: 2.6 }), A.wait(1.2));
  }

  var have = { name: "what we have", layers: [key("have"), [
    { name: "corpus", layers: [key("corpus-name"), A.enter(q("corpus"))] },
    { name: "questions", layers: [key("qs-name"), { name: "six cards", group: six.map(ruledCard) }] }]] };
  var ret = { name: "what we must return", layers: [key("return"), [
    { name: "PR", layers: [key("pr-name"), A.pace(A.enter(q("pr")), 2.5)] },
    { name: "AC", layers: [key("ac-name"), A.pace(A.enter(q("ac")), 2)] },
    { name: "nuggets", layers: [key("n-name"), { name: "three nuggets", group: [0, 1, 2].map(function (j) { return A.enter(q("n" + j)); }) }] }],
    { name: "cites", group: [0, 1, 2].map(function (j) { return A.flow(q("cite" + j), { dur: 0.45 }); }) }] };

  var STEP = [
    { to: 0, frame: F[0] },
    { to: 1, frame: F[1], loop: replay(0) }, { to: 2, frame: F[2], loop: replay(1) }, { to: 3, frame: F[3], loop: replay(2) },
    { to: 4, frame: F[4], loop: replay(3) }, { to: 5, frame: F[5], loop: replay(4) }, { to: 6, frame: F[6], loop: replay(5) },
    { to: 7, frame: F[7] }, { to: 8, frame: F[7], loop: gauge() }, { to: [9, 7], frame: F[7], loop: cites() }
  ];
  var steps = STEP.map(function (st, s) {
    var from = s ? STEP[s - 1] : null, f0 = from ? from.frame : HOME;
    var move = f0 === st.frame ? null : A.zoom(q.svg, { from: f0, to: st.frame, dur: 0.7 });
    var look = { name: "look", group: [move, A.focus(P, { from: from ? from.to : null, to: st.to, dim: 0.3, dur: move ? 0.7 : 0.45 })] };
    return { enter: A.groups({ name: "3." + (s + 1), layers: [look, s >= 1 && s <= 6 ? fill(s - 1) : null] }), loop: st.loop || null };
  });
  return {
    entry: A.groups({ name: "slide", layers: [
      { name: "camera", track: A.camera(q.svg, HOME, HOME, { dur: 0 }) },
      [{ name: "title", group: [key("task-head"), A.draw(q("divide"), { dur: 0.8 })] }, have, ret]] }),
    steps: steps,
    /* the overview's regions, each the step on it (PLAN.md §Navigation, zones): a click plays that step from what is shown */
    zones: { 1: "corpus-blk", 2: "c0", 3: "c1", 4: "c2", 5: "c3", 6: "c4", 7: "c5", 8: "pr-blk", 9: "ac-blk", 10: "n-blk" }
  };
});
