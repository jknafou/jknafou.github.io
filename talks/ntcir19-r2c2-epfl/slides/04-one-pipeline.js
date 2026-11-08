/* Slide 4: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js) and
   the scenes' endings (anim/idles.js).
   ENTRY, a tree of groups in layers (A.groups; the tree is in the .py's header): the journey's parts set aside at
   once; then the title and the pipeline start together. The pipeline is a FLOW, read in order, every member and
   every arrow its own layer waiting for the one before (the author, 5 November 2026: "nested group animation must
   take into account the sequentiality"): the question card, l-q, the question type, l-type, the model (its band and
   the transcript, the five calls down, the five tools, the five results up), then the tools' two ways in parallel
   (to the passages DB: the stubs, the bus, its dots, the DB; to the orchestrator: the record and submit calls down,
   its band with the check and the gate, the replies up and their words, l-ck, the record, l-rg, l-ans, the answer),
   then "every passage", the link that joins the two ways. It ends on the OVERVIEW: everything opaque, nothing
   moving. Each step's enter is a tree too: layers: its state → look (the camera ‖ the focus ‖ what is put away) → its
   act, the ball's run along the flow (on 4.6 two groups started together, as the author asked: the read call ‖ the
   two passages growing out of the DB).
   STEPS, twelve, Han Solo's first pass (JOURNEY.md J 1-6), each in the normalized order: the rest dimmed (A.focus)
   while the camera pans onto the step's frame (A.zoom, one frame size: no zoom out), what the step before put out
   put away; then the ball, what it carries, rolls along the drawn link (A.travel, A.become); the box puts out what
   it made; the loop, where a scene played, is its ending idle (A.ending, scene rule 9). */
Deck.slide("04-one-pipeline", function (A, q) {
  var F = JSON.parse(q("frames").getAttribute("data-frames"));
  var HOME = [0, 0, 1600, 900];
  var key = function (n) { return A.type(q(n), { quick: true }); };
  var fl = function (n) { return A.flow(q(n), { dur: 0.45 }); };
  var tools = ["search", "read", "extract", "record", "submit"];

  /* ---- the overview's entry: groups ---- */
  var JOURNEY = ["han", "tag", "note-type", "turn1", "turn2", "turn3", "turn4", "dbx", "fun", "hanp", "nug", "note-rec", "g5", "cb", "cb-lead", "gl", "a5", "ball"];
  var aside = A.hide(JOURNEY.map(q), { dur: 0 });
  var each = function (f) { return tools.map(f); };
  /* the pipeline is a FLOW, read in order: every member and every arrow its own layer, each waiting for the one before;
     only parallel branches share a layer (the author, 5 November 2026: "nested group animation must take into account
     the sequentiality") */
  var tree = { name: "slide", layers: [
    { name: "aside", track: aside },
    [{ name: "header", track: key("head") },
     { name: "pipeline", layers: [
       { name: "question card", track: A.enter(q("q-card")) },
       { name: "l-q", track: fl("l-q") },
       { name: "question type", track: A.enter(q("qtype")) },
       { name: "l-type", track: fl("l-type") },
       { name: "model", layers: [
         { name: "band and transcript", group: [A.enter(q("model")), A.enter(q("tr"))] },
         { name: "five calls", group: each(function (k) { return fl("call-" + k); }) },
         { name: "five tools", group: each(function (k) { return A.enter(q("t-" + k)); }) },
         { name: "five results", group: each(function (k) { return fl("res-" + k); }) }] },
       { name: "the tools' two ways", group: [
         { name: "to the passages DB", layers: [
           { name: "stubs", group: ["stub-search", "stub-read", "stub-extract"].map(function (k) { return A.draw(q(k), { dur: 0.45 }); }) },
           { name: "bus", track: A.draw(q("bus"), { dur: 0.45 }) },
           { name: "bus dots", track: A.pop(q("bus-dots"), { dur: 0.3 }) },
           { name: "passages DB", group: [key("db-name"), A.enter(q("db"))] }] },
         { name: "to the orchestrator", layers: [
           { name: "record and submit calls", group: [fl("l-rc"), fl("l-sg")] },
           { name: "band, check, gate", group: [A.enter(q("orch")), A.enter(q("check")), A.enter(q("gate"))] },
           { name: "replies", group: [fl("l-cr"), fl("l-gs")] },
           { name: "their words", group: [key("say-kept"), key("say-back")] },
           { name: "l-ck", track: fl("l-ck") },
           { name: "record", track: A.enter(q("rec")) },
           { name: "l-rg", track: fl("l-rg") },
           { name: "l-ans", track: fl("l-ans") },
           { name: "answer", track: A.enter(q("ans")) }] }] },
       { name: "every passage", group: [fl("l-every"), key("say-every")] }] }]] };

  /* ---- the steps ---- */
  /* step 4's hits in the passages DB: each tile swept yellow, its title keyed and its tile scene acting, in rank
     order a little apart; their loop, every tile scene's ending idle */
  var HITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  var hits = function () {
    return A.stagger(HITS, function (r) {
      return A.seq(A.reveal(q("dbp" + r), { dur: 0.01 }), A.highlight(q("dby" + r), { dur: 0.3 }), A.par(key("dbt" + r), A.act(q("dbs" + r))));
    }, 0.35);
  };
  var hitsIdle = A.par.apply(null, HITS.map(function (r) { return A.ending(q("dbs" + r), { acted: true }); }));
  /* a passage read grows out of its DB tile to where it stands (data-from, data-at: x, y, scale) */
  function grow(nm) {
    var g = q(nm + "-at"), a = g.getAttribute("data-from").split(",").map(Number), b = g.getAttribute("data-at").split(",").map(Number), E = A.ease.io;
    return A.track(0.8, function (u) {
      var e = E(u), x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e, k = a[2] * Math.pow(b[2] / a[2], e);
      g.setAttribute("transform", "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ") scale(" + k.toFixed(5) + ")");
    });
  }
  /* the passage the check kept turns green in the DB, and is ticked */
  var kept = function () { return A.seq(A.highlight(q("dbg1"), { dur: 0.5 }), A.pop(q("dbk1"), { dur: 0.35 }), A.write(q("dbk1-tick"))); };
  /* 4.1: the pipeline's own question box becomes Han Solo's question (no new card): its ruled line lifted and its "Q"
     handed over while it grows down to the question's height, then the question typed in it and its scene acting;
     4.2 gives it back: the box shrinks to its ruled self as the question folds into the ball */
  var qc = q("q-card"), qcR = qc.querySelector("rect"), qcQ = [].filter.call(qc.children, function (c) { return c.tagName === "text"; })[0];
  var hanR = q("han").querySelector("rect"), hanK = +q("han-at").getAttribute("data-at").split(",")[2];
  hanR.style.display = "none";                                   /* the box is the pipeline's own: Han Solo's card has no frame */
  var H0 = +qcR.getAttribute("height"), H1 = +hanR.getAttribute("height") * hanK;
  var boxTo = function (a, b) { var E = A.ease.io; return A.track(0.5, function (u) { qcR.setAttribute("height", (a + (b - a) * E(u)).toFixed(2)); }); };
  var fill = function () { return A.par(A.reverse(A.draw(q("q-card-line0"), { dur: 0.3 })), A.hide(qcQ, { dur: 0.3 }), boxTo(H0, H1)); };
  var unfill = function () { return A.at(0.2, A.par(A.draw(q("q-card-line0"), { dur: 0.3 }), A.reverse(A.hide(qcQ, { dur: 0.3 })), boxTo(H1, H0))); };
  /* the pipeline's parts, the units A.focus dims and lights (none inside another) */
  var DBP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (r) { return "dbp" + r; });   /* the DB's ten hits (inside dbx) */
  var NAMES = ["head", "q-card", "l-q", "qtype", "db-blk", "model", "tr"]
    .concat(tools.map(function (k) { return "t-" + k; }), tools.map(function (k) { return "call-" + k; }),
            tools.map(function (k) { return "res-" + k; }))
    .concat(["l-type", "stub-search", "stub-read", "stub-extract", "bus", "bus-dots", "l-every", "say-every",
             "orch", "check", "gate", "rec", "l-ck", "l-rg", "l-rc", "l-cr", "say-kept", "l-sg", "l-gs", "say-back",
             "l-ans", "ans"]).concat(DBP);
  var P = NAMES.map(q);
  var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 4: no part " + k); return i; }); };
  var ball = q("ball");
  /* the ball is shown only while it rolls: out of a box it appears, into a box it is gone (A.travel masks it), and at
     every rest it is in a box, so a step's state hides it and each roll reveals it as it starts */
  var go = function () { return A.seq(A.reveal(ball, { dur: 0.01 }), A.travel(ball, { along: [].slice.call(arguments).map(q) })); };
  var turnTo = function (from, to) { return A.become(ball, { from: from, to: to, dur: 0.4 }); };
  var leave = function (from, to) { return A.par(go.apply(null, [].slice.call(arguments, 2)), turnTo(from, to)); };
  /* what is shown as a step starts: the journey's parts its step before left, opaque; every other one hidden; the
     ball's face. A zero-length track that acts only once begun, so the chain's later steps never touch the overview */
  function state(shown, face) {
    var S = shown.map(q);
    return { dur: 0, set: function (t) {
      if (t < 0) return;
      JOURNEY.forEach(function (k) { var e = q(k); e.style.opacity = S.indexOf(e) >= 0 ? "" : "0"; });
      ball.style.opacity = "0";
      [].forEach.call(ball.querySelectorAll("[data-face]"), function (f) { f.style.display = f.getAttribute("data-face") === face ? "" : "none"; });
    } };
  }
  /* the question card folds into its ball: shrinking onto the ball's place at the card's foot, fading as it lands */
  function fold() {
    var g = q("han-at"), a = g.getAttribute("data-at").split(",").map(Number), cx = 209.6, cy = 180;
    var bx = +ball.getAttribute("data-cx"), by = +ball.getAttribute("data-cy"), E = A.ease.io;
    return A.track(0.55, function (u) {
      var e = E(u), k = a[2] * (1 - 0.94 * e);
      var px = a[0] + a[2] * cx + (bx - a[0] - a[2] * cx) * e, py = a[1] + a[2] * cy + (by - a[1] - a[2] * cy) * e;
      g.setAttribute("transform", "translate(" + (px - k * cx).toFixed(2) + "," + (py - k * cy).toFixed(2) + ") scale(" + k.toFixed(5) + ")");
      g.style.opacity = u <= 0 ? "" : u >= 1 ? "0" : (1 - e * e).toFixed(3);
    });
  }
  /* 4.2: the six types come out of the type box, a ring passes over them and stops on the one chosen, the others
     fade; then the orchestrator tells the model, along l-type, what it means for the answer */
  var T6 = [0, 1, 2, 3, 4, 5], ring = q("tag-ring"), DY = +q("tag").getAttribute("data-dy");
  var ringAt = function (a, b, dur) { return A.track(dur, function (u) { var e = A.ease.io(u); ring.style.translate = "0px " + ((a + (b - a) * e) * DY).toFixed(2) + "px"; }); };
  function choose() {
    var path = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0], hops = [];
    for (var i = 1; i < path.length; i++) hops.push(ringAt(path[i - 1], path[i], 0.16));
    return A.seq(A.stagger(T6, function (i) { return A.pop(q("tag" + i), { dur: 0.35 }); }, 0.08),
                 A.par(A.pop(ring, { dur: 0.3 }), ringAt(0, 0, 0.3)), A.seq.apply(null, hops), A.wait(0.2),
                 A.hide([1, 2, 3, 4, 5].map(function (i) { return q("tag" + i); }), { dur: 0.4 }), A.hide(ring, { dur: 0.3 }));
  }
  /* 4.2 and 4.9: the orchestrator's note to the model (concepts/orchestrator_note.py), by groups in layers: printed
     beside the element whose rule dictates it, its rule first (A.dictate) → it folds into the ball, which pops as an
     O at the start of the drawn link → the ball rolls along it into the transcript → the note comes out under the
     transcript, where the T cards come out. The note is drawn at its rest (data-at); data-from is where it is printed,
     data-out the transcript's foot it comes out of (x, y, scale) */
  var xyk = function (g, k) { return g.getAttribute(k).split(",").map(Number); };
  var placed = function (g, x, y, k) { g.setAttribute("transform", "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ") scale(" + k.toFixed(5) + ")"); };
  function note(nm, links) {
    var g = q(nm + "-at"), a = xyk(g, "data-from"), b = xyk(g, "data-at"), out = xyk(g, "data-out"), E = A.ease.io;
    var bb = q(nm).querySelector("rect"), W = +bb.getAttribute("width"), H = +bb.getAttribute("height");
    var start = q(links[0]).querySelector('[data-part="shaft"]').getPointAtLength(0), tiny = a[2] * 0.06;
    var into = A.track(0.55, function (u) {                       /* folds into the ball at the link's start */
      var e = E(u), k = a[2] + (tiny - a[2]) * e, cx = a[0] + a[2] * W / 2 + (start.x - a[0] - a[2] * W / 2) * e,
          cy = a[1] + a[2] * H / 2 + (start.y - a[1] - a[2] * H / 2) * e;
      placed(g, cx - k * W / 2, cy - k * H / 2, k);
      g.style.opacity = u <= 0 ? "" : u >= 1 ? "0" : (1 - e * e).toFixed(3);
    });
    var outOf = A.track(0.55, function (u) {                      /* comes out of the transcript's foot to its rest */
      var e = E(u), k = tiny + (b[2] - tiny) * e, x = out[0] - k * W / 2 + (b[0] - out[0] + k * W / 2) * e, y = out[1] + (b[1] - out[1]) * e;
      placed(g, x, y, k);
      g.style.opacity = u <= 0 ? "0" : u >= 1 ? "" : Math.min(1, 3 * e).toFixed(3);
    });
    var face = { dur: 0, set: function (t) { if (t < 0) return;
      [].forEach.call(ball.querySelectorAll("[data-face]"), function (f) { f.style.display = f.getAttribute("data-face") === "O" ? "" : "none"; }); } };
    return { name: "the orchestrator's note", layers: [
      { name: "rule, then printed", track: A.seq(A.reveal(q(nm), { dur: 0.01 }), A.dictate(q(nm))) },
      { name: "into the ball", group: [into, A.at(0.3, A.seq(face, A.reveal(ball, { dur: 0.01 }), A.pop(ball, { dur: 0.3 })))] },
      { name: "along the link", track: A.travel(ball, { along: links.map(q) }) },
      { name: "out under the transcript", track: outOf }] };
  }
  /* 4.11: the gate's rules come out of it (its right edge) to where they stand (data-from, data-at: x, y, scale) */
  function outOfGate(nm) {
    var g = q(nm + "-at"), a = xyk(g, "data-from"), b = xyk(g, "data-at"), E = A.ease.io;
    return A.track(0.6, function (u) {
      var e = E(u), k = a[2] * Math.pow(b[2] / a[2], e), px = a[0] + (b[0] - a[0]) * e, py = a[1] + (b[1] - a[1]) * e;
      placed(g, px, py, k);
      g.style.opacity = u <= 0 ? "0" : u >= 1 ? "" : Math.min(1, 4 * e).toFixed(3);
    });
  }
  var putAway = function (names) { return names.length ? A.hide(names.map(q), { dur: 0.35 }) : null; };
  var idle = function (card) { return A.ending(q(card + "-scene"), { acted: true }); };
  var emitTurn = function (i) { return A.pace(A.emit(q("turn" + i)), 2.2); };

  var STEPS = [
    { look: ["q-card"], frame: "question", shown: [], face: "Q",              /* 1, J 1: the question */
      act: function () { return A.seq(fill(), A.reveal(q("han"), { dur: 0.01 }), A.enter(q("han"))); }, loop: idle("han") },
    { look: ["q-card", "l-q", "qtype"], frame: "question", shown: ["han"], face: "Q",   /* 2, J 2: its type */
      act: function () { return A.seq(A.par(fold(), unfill(), A.at(0.35, A.seq(A.reveal(ball, { dur: 0.01 }), A.pop(ball, { dur: 0.35 })))),
                                       go("l-q"), A.reveal(q("tag"), { dur: 0.01 }), choose()); },
      then: function () { return note("note-type", ["l-type"]); } },
    { look: ["qtype", "l-type", "tr"], frame: "turn1", shown: ["tag", "note-type"], away: ["note-type"], face: "O",   /* 3, J 3: turn 1 */
      act: function () { return A.seq(A.reveal(q("turn1"), { dur: 0.01 }), emitTurn(1)); } },   /* the question went in with its note (4.2) */
    { look: ["tr", "call-search", "t-search", "stub-search", "bus", "bus-dots", "db-blk"].concat(DBP),
      frame: "search", end: "db", shown: ["tag", "turn1"], away: ["turn1", "tag"], face: "O",   /* 4, J 3: Search */
      act: function () { return A.seq(leave("O", "search", "call-search"), go("g-search"),
                                       A.zoom(q.svg, { from: F.search, to: F.db, dur: 0.8 }),
                                       A.reveal(q("dbx"), { dur: 0.01 }), hits()); },
      loop: hitsIdle },
    { look: ["t-search", "res-search", "tr"], frame: "turn", shown: ["dbx"], face: "search",   /* 5, J 4: turn 2 */
      act: function () { return A.seq(go("gb-search"), go("res-search"), A.reveal(q("turn2"), { dur: 0.01 }), emitTurn(2)); } },
    { look: ["tr", "call-read", "t-read", "stub-read", "bus", "bus-dots", "db-blk"].concat(DBP),
      frame: "read", shown: ["dbx", "turn2"], away: ["turn2"], face: "search",   /* 6, J 4: Read */
      act: function () { return [                                                  /* two groups, started together */
        { name: "read call", layers: [leave("search", "read", "call-read"), go("g-read"), go("gb-read")] },   /* transcript, Read, the DB */
        { name: "two passages", layers: [A.reveal([q("fun"), q("hanp")], { dur: 0.01 }),                   /* the DB: they grow out */
              [grow("fun"), grow("hanp"), A.pace(A.enter(q("fun")), 2.5), A.pace(A.enter(q("hanp")), 2.5)]] }]; },
      loop: A.par(idle("fun"), idle("hanp")) },
    { look: ["t-read", "res-read", "tr"], frame: "turn", shown: ["dbx", "fun", "hanp"], away: ["fun", "hanp"], face: "read",   /* 7, J 5: turn 3 */
      act: function () { return A.seq(go("res-read"), A.reveal(q("turn3"), { dur: 0.01 }), emitTurn(3)); } },
    { look: ["tr", "call-record", "t-record", "l-rc", "check", "l-ck", "rec"],
      frame: "check", shown: ["dbx", "turn3"], away: ["turn3"], face: "read",   /* 8, J 5: the nugget check */
      act: function () { return A.seq(leave("read", "record", "call-record", "l-rc"), A.reveal(q("nug"), { dur: 0.01 }),
                                       A.enter(q("nug")), A.pulse(q("l-ck"), { dur: 0.9 })); } },
    { look: ["check", "l-cr", "say-kept", "t-record", "res-record", "tr", "db-blk"].concat(DBP),
      frame: "kept", shown: ["dbx", "nug"], away: ["nug"], face: "record",   /* 9, J 5: the note, the passage kept */
      act: function () { return [note("note-rec", ["l-cr", "res-record"]),                       /* two groups, started together */
                                 { name: "the passage kept", track: kept() }]; } },
    { look: ["tr"], frame: "turn", shown: ["dbx", "note-rec"], away: ["note-rec"], face: "O",   /* 10, J 6: turn 4 */
      act: function () { return A.seq(A.reveal(q("turn4"), { dur: 0.01 }), emitTurn(4),
                                       A.lift(q("turn4-lift"))); } },   /* the answer out of its rationale */
    { look: ["tr", "call-submit", "t-submit", "l-sg", "gate", "l-rg", "rec", "check"],   /* the check: the nugget's score */
      frame: "gate", shown: ["dbx", "turn4"], away: ["turn4"], face: "O",   /* 11, J 6: the evidence gate */
      act: function () { return A.seq(leave("O", "submit", "call-submit", "l-sg"), A.pulse(q("l-rg"), { dur: 0.8 }),
                                       A.reveal(q("cb"), { dur: 0.01 }),        /* the answer's confidence, the orchestrator's, step by */
                                       A.confidence(q("cb"), { feed: [q("cb-lead")] }),   /* step, the nugget's score fed from the check */
                                       A.reveal(q("g5"), { dur: 0.3 }), A.count(q("g5-reading"), { dur: 1.0 }),
                                       A.reveal(q("gl"), { dur: 0.01 }), outOfGate("gl"),         /* its rules, out of the gate */
                                       A.checklist(q("gl"), { pop: false }),                  /* evaluated in order, ticked */
                                       A.write(q("g5-verdict"))); } },
    { look: ["gate", "l-ans"], frame: "answer", shown: ["dbx", "g5", "cb", "cb-lead", "gl"], away: ["cb", "cb-lead", "gl"],
      face: "submit",   /* 12, J 6: the answer; the ruled answer stays dimmed, a5 takes its place (test_vanish) */
      act: function () { return A.seq(leave("submit", "A", "l-ans"), A.track(0.25, function (u) {   /* the dimmed ruled answer goes */
                                         q("ans").style.opacity = (0.3 * (1 - u)).toFixed(3); }),
                                       A.reveal(q("a5"), { dur: 0.01 }), A.enter(q("a5"))); } }
  ];
  var steps = STEPS.map(function (st, s) {
    var from = s ? STEPS[s - 1] : null, f0 = from ? F[from.end || from.frame] : HOME, f1 = F[st.frame];
    var move = f0 === f1 ? null : A.zoom(q.svg, { from: f0, to: f1, dur: 0.7 });
    var look = { name: "look", group: [move, A.focus(P, { from: from ? ix(from.look) : null, to: ix(st.look), dim: 0.3, dur: move ? 0.7 : 0.45 }),
                                       putAway(st.away || [])] };
    var act = st.act(), then = st.then ? st.then() : null;
    return { enter: A.groups({ name: "4." + (s + 1), layers: [{ name: "state", track: state(st.shown, st.face) }, look,
                                                              Array.isArray(act) ? { name: "act", group: act } : { name: "act", track: act },
                                                              then].filter(Boolean) }),
             loop: st.loop || null };
  });

  return {
    entry: A.groups(tree),
    steps: steps,
    /* each box of the overview, the first step that visits it (PLAN.md §Navigation, zones) */
    zones: { 1: "q-card", 2: "qtype", 3: "tr", 4: "t-search", 6: "t-read", 8: "check", 11: "gate", 12: "ans" }
  };
});
