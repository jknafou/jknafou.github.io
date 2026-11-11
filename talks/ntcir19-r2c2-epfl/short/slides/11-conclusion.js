/* Slide 11, short version (11s): the full slide's drawing and motions (slides/11-conclusion.js, untouched), two pairs
   of its steps MERGED: a short step is the full steps' enters played back to back, unchanged, as if → had been
   pressed twice (the author, 10 November 2026: "11.2-11.3 merge in one animation."; "11.4 and 11.5 too.").
       11.1 = full 11.1
       11.2 = full 11.2 + 11.3      rests on the new check, "Q + nuggets ⊨ A"        (5.49 + 3.85 s)
       11.3 = full 11.4, a 2 s pause on its end frame, full 11.5   rests on the estimator under any RAG   (10.18 + 2 + 5.76 s)
              (the author: "11.3 add a pause", so "reads only what the pipeline already logs: no extra model call, no
              extra pass", which the full 11.5 puts away as it starts, can be read)
       11.4-11.9 = full 11.6-11.11
   A merged step's loop is its last full step's (the full 11.3 has none; the full 11.5's flow).
   GROUPS: a merged step is A.groups of the full steps' enters, each a leaf (their own trees are the full slide's,
   stated in its .py header and checked on the full deck).
   HOW THE FULL MAKER IS REACHED: as short slides 2, 4 and 5: the build loads the full slide's motion file just after this
   one; its Deck.slide call is caught here, and its maker called for the entry and every step. */
(function () {
  "use strict";
  var ID = "11-conclusion", full = null, reg = Deck.slide;
  Deck.slide = function (id, make) {               /* the full slide's registration, caught once */
    if (id === ID && !full) { full = make; Deck.slide = reg; return; }
    reg(id, make);
  };
  reg(ID, function (A, q) {
    if (!full) throw new Error(ID + " (short): the full slide's motion file was not loaded after this one");
    var m = full(A, q), S = m.steps;
    if (S.length !== 11) throw new Error("slide 11s: the full slide has " + S.length + " steps, not 11");

    /* THE ORDER IN WHICH A SEEK SETS THE TRACKS (short slide 4's rule). The full slide's chain is one A.seq of its
       step enters: a seek sets every step not yet begun to its first state (latest first), THEN every begun step in
       order, so the steps played last win. Nested in a merged step, the full steps not yet begun inside it would be
       set AFTER the earlier short steps, and their first states would win over them (on slide 4 an element vanished
       that way). So a merged step, sought inside itself, sets: its not-begun full steps (latest first), then every
       full step before it again at its end, in order, then its begun full steps in order: exactly the full chain's
       order, so each frame is the full slide's. Its schedule (.nodes, .measure, for tools/test_groups.mjs) is an
       A.groups tree over the same steps. */
    var ALL = S.map(function (x) { return x.enter; });
    var leaf = function (i) { return { name: "full 11." + (i + 1), track: ALL[i] }; };
    /* idx: the full steps, in order; a number h < 0 among them is a pause of -h s on the frame the step before ends on
       (the author, 10 November 2026, on 11.3: "add a pause"), a wait: it sets nothing */
    function merged(name, idx) {
      var lay = idx.map(function (i) { return i < 0 ? { name: "a pause, " + (-i) + " s", track: A.wait(-i) } : leaf(i); });
      var G = A.groups({ name: name, layers: lay }), M = lay.map(function (l) { return l.track; }), at = [], o = 0;
      M.forEach(function (x) { at.push(o); o += x.dur; });
      if (Math.abs(o - G.dur) > 1e-9) throw new Error("slide 11s: " + name + ": its schedule is not its play");
      return { dur: o, nodes: G.nodes, measure: G.measure, set: function (t) {
        var j;
        for (j = M.length - 1; j >= 0; j--) if (at[j] > t || t < 0) M[j].set(t - at[j]);
        if (t < 0) return;
        for (j = 0; j < idx[0]; j++) ALL[j].set(ALL[j].dur);
        for (j = 0; j < M.length; j++) if (at[j] <= t) M[j].set(t - at[j]);
      } };
    }
    /* the loops: a seek first puts every step's loop at its start, latest first (anim/steps.js, reset), so on the full
       slide the full 11.4's loop (its pulses on the signals' links) is put at its start after the full 11.5's: the
       merged 11.3's loop does the same at its start, then plays the full 11.5's */
    var PAUSE = 2;                                   /* s, on the full 11.4's end: "reads only what the pipeline already logs" read */
    var L4 = S[3].loop, L5 = S[4].loop;
    if (S[1].loop || S[2].loop || !L4 || !L5) throw new Error("slide 11s: the merged steps' loops are not the ones this file expects");
    var loop3 = { dur: L5.dur, set: function (t) { L5.set(t); if (t === 0) L4.set(0); } };
    var steps = [S[0],
      { enter: merged("11.2 (full 11.2-11.3)", [1, 2]), loop: S[2].loop || null },
      { enter: merged("11.3 (full 11.4, a pause, 11.5)", [3, -PAUSE, 4]), loop: loop3 }].concat(S.slice(5));
    return { entry: m.entry, steps: steps };
  });
})();
