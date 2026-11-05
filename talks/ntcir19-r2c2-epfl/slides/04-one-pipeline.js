/* Slide 4: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js) and
   the scenes' endings (anim/idles.js).
   ENTRY, a tree of groups in layers (A.groups; the tree is in the .py's header): the journey's parts set aside at
   once; then the title and the pipeline start together; the pipeline's first layer is its five members started
   together (the entrance, the passages DB, the model, the orchestrator, the answer), each a group whose first layer
   is its boxes started together and whose last layer is its own links; the pipeline's last layer is the links
   between the five, all started together. It ends on the OVERVIEW: everything opaque, nothing moving. Each step's
   enter is a tree too: layers: its state → look (the camera ‖ the focus ‖ what is put away) → its act (on 4.6 two
   groups started together: the read call ‖ the two passages growing out of the DB).
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
  var JOURNEY = ["han", "tag", "turn1", "turn2", "turn3", "turn4", "dbx", "fun", "hanp", "nug", "reply", "g5", "a5", "ball"];
  var aside = A.hide(JOURNEY.map(q), { dur: 0 });
  var tree = { name: "slide", layers: [
    { name: "aside", track: aside },
    [{ name: "header", track: key("head") },
     { name: "pipeline", layers: [
       [{ name: "entrance", layers: [{ name: "entrance boxes", group: [A.enter(q("q-card")), A.enter(q("qtype"))] }, fl("l-q")] },
        { name: "passages DB", group: [key("db-name"), A.enter(q("db"))] },
        { name: "model", layers: [
          { name: "model boxes", group: [A.enter(q("model")), A.enter(q("tr")),
            { name: "five tools", group: tools.map(function (k) { return A.enter(q("t-" + k)); }) }] },
          { name: "calls and results", group: tools.map(function (k) { return { name: "call " + k, group: [fl("call-" + k), fl("res-" + k)] }; }) }] },
        { name: "orchestrator", layers: [
          { name: "orchestrator boxes", group: [A.enter(q("orch")), A.enter(q("check")), A.enter(q("gate")), A.enter(q("rec"))] },
          { name: "orchestrator links", group: [fl("l-ck"), fl("l-rg")] }] },
        { name: "answer", track: A.enter(q("ans")) }],
       { name: "pipeline links", group: [
         fl("l-type"),
         { name: "bus", layers: [["stub-search", "stub-read", "stub-extract", "bus"].map(function (k) { return A.draw(q(k), { dur: 0.45 }); }),
                                 A.pop(q("bus-dots"), { dur: 0.3 }), [fl("l-every"), key("say-every")]] },
         { name: "record and check", layers: [[fl("l-rc"), fl("l-cr")], key("say-kept")] },
         { name: "submit and gate", layers: [[fl("l-sg"), fl("l-gs")], key("say-back")] },
         fl("l-ans")] }] }]] };

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
  var kept = function () { return A.seq(A.highlight(q("dbg1"), { dur: 0.5 }), A.write(q("dbk1"))); };
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
  var putAway = function (names) { return names.length ? A.hide(names.map(q), { dur: 0.35 }) : null; };
  var idle = function (card) { return A.ending(q(card + "-scene"), { acted: true }); };
  var emitTurn = function (i) { return A.pace(A.emit(q("turn" + i)), 2.2); };

  var STEPS = [
    { look: ["q-card"], frame: "question", shown: [], face: "Q",              /* 1, J 1: the question */
      act: function () { return A.seq(A.reveal(q("han"), { dur: 0.01 }), A.enter(q("han"))); }, loop: idle("han") },
    { look: ["q-card", "l-q", "qtype"], frame: "question", shown: ["han"], face: "Q",   /* 2, J 2: its type */
      act: function () { return A.seq(A.par(fold(), A.at(0.35, A.seq(A.reveal(ball, { dur: 0.01 }), A.pop(ball, { dur: 0.35 })))),
                                       go("l-q"), A.reveal(q("tag"), { dur: 0.01 }), A.enter(q("tag"))); } },
    { look: ["qtype", "l-type", "tr"], frame: "turn1", shown: ["tag"], face: "Q",   /* 3, J 3: turn 1 */
      act: function () { return A.seq(go("l-type"), A.reveal(q("turn1"), { dur: 0.01 }), emitTurn(1)); } },
    { look: ["tr", "call-search", "t-search", "stub-search", "bus", "bus-dots", "db-blk"].concat(DBP),
      frame: "search", end: "db", shown: ["tag", "turn1"], away: ["turn1", "tag"], face: "Q",   /* 4, J 3: Search */
      act: function () { return A.seq(leave("Q", "search", "call-search"), go("g-search"),
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
      frame: "reply", end: "db9", shown: ["dbx", "nug"], away: ["nug"], face: "record",   /* 9, J 5: the reply, the passage kept */
      act: function () { return A.seq(go("l-cr", "res-record"), A.reveal(q("reply"), { dur: 0.01 }), key("reply"), A.wait(0.4),
                                       A.zoom(q.svg, { from: F.reply, to: F.db9, dur: 0.7 }),
                                       kept()); } },
    { look: ["tr"], frame: "turn", shown: ["dbx", "reply"], away: ["reply"], face: "record",   /* 10, J 6: turn 4 */
      act: function () { return A.seq(A.reveal(q("turn4"), { dur: 0.01 }), emitTurn(4)); } },
    { look: ["tr", "call-submit", "t-submit", "l-sg", "gate", "l-rg", "rec"],
      frame: "gate", shown: ["dbx", "turn4"], away: ["turn4"], face: "record",   /* 11, J 6: the evidence gate */
      act: function () { return A.seq(leave("record", "submit", "call-submit", "l-sg"), A.pulse(q("l-rg"), { dur: 0.8 }),
                                       A.reveal(q("g5"), { dur: 0.3 }), A.count(q("g5-reading"), { dur: 1.0 }),
                                       A.write(q("g5-verdict"))); } },
    { look: ["gate", "l-ans", "ans"], frame: "gate", shown: ["dbx", "g5"], face: "submit",   /* 12, J 6: the answer */
      act: function () { return A.seq(leave("submit", "A", "l-ans"), A.hide(q("ans"), { dur: 0.25 }),
                                       A.reveal(q("a5"), { dur: 0.01 }), A.enter(q("a5"))); } }
  ];
  var steps = STEPS.map(function (st, s) {
    var from = s ? STEPS[s - 1] : null, f0 = from ? F[from.end || from.frame] : HOME, f1 = F[st.frame];
    var move = f0 === f1 ? null : A.zoom(q.svg, { from: f0, to: f1, dur: 0.7 });
    var look = { name: "look", group: [move, A.focus(P, { from: from ? ix(from.look) : null, to: ix(st.look), dim: 0.3, dur: move ? 0.7 : 0.45 }),
                                       putAway(st.away || [])] };
    var act = st.act();
    return { enter: A.groups({ name: "4." + (s + 1), layers: [{ name: "state", track: state(st.shown, st.face) }, look,
                                                              Array.isArray(act) ? { name: "act", group: act } : { name: "act", track: act }] }),
             loop: st.loop || null };
  });

  return {
    entry: A.groups(tree),
    steps: steps,
    /* each box of the overview, the first step that visits it (PLAN.md §Navigation, zones) */
    zones: { 1: "q-card", 2: "qtype", 3: "tr", 4: "t-search", 6: "t-read", 8: "check", 11: "gate", 12: "ans" }
  };
});
