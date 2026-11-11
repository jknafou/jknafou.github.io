/* Slide 5: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js) and
   the scenes' endings (anim/idles.js). The tree of groups and the eight steps are in the .py's header.
   Each → plays one animation and stops at rest. A pass is one step, at the overview's scale: its calls one by one in
   its box (the calls and the passages retrieved counting) while the DB shows only that pass's passages (withheld from
   the passes before: partly transparent yellow; retrieved: yellow; a nugget kept: green, its check and small scene;
   only turned back: red, its cross) and the check counts its nuggets. Between passes 3 and 4, one stop on the passage
   that brings Ilum in; at the end, our evaluation against the organisers' gold. (The detailed walk-through of pass 4
   is saved apart: PLAN.md, "If time allows".) */
Deck.slide("05-other-passes", function (A, q) {
  var F = JSON.parse(q("frames").getAttribute("data-frames")), T = JSON.parse(q("frames").getAttribute("data-tiles"));
  var key = function (n) { return A.type(q(n), { quick: true }); };
  var fl = function (n) { return A.flow(q(n), { dur: 0.45 }); };
  var tools = ["search", "read", "extract", "record", "submit"];
  var each = function (f) { return tools.map(f); };
  var L = function (name, tr) { return { name: name, track: tr }; };
  var G = function (name, layers) { return { name: name, layers: layers.filter(Boolean) }; };
  var PASSES = [1, 2, 3, 4];

  /* ---- the passage that brings Ilum in (5.4): the card, its span, its nugget and the NLI's verdict ---- */
  var CARDS = ["pskb-at"].concat([].concat.apply([], T.det.c3.n.map(function (x) { return [x + "-at", x + "-why"]; })));
  /* ---- 5.7-5.8, the orchestrator's fallback: the case fills 5.6's layout, unchanged (the same DB tiles, the same
     four pass boxes, the same maquette), its own boxes on the margin the camera opens (frame "fb"). What each rest adds: */
  var FN = T.fbn, ALL4 = [1, 2, 3, 4];
  var LANE_PARTS = ["-q", "-p1", "-chips", "-calls", "-ret", "-p2", "-a"];
  var laneParts = function (c, p, had) { return had ? LANE_PARTS.map(function (k) { return c + "lane" + p + k; }) : [c + "lane" + p + "-none"]; };
  var caseNames = function (c, had, marks, extra) {
    return [c + "-head", c + "-gold", c + "db-wh", c + "db-lit"].concat(extra, marks,
      [].concat.apply([], ALL4.map(function (p) { return [c + "lane" + p].concat(laneParts(c, p, p <= had)); })));
  };
  var TPARTS = ["", "-name", "-tag", "-n", "-unit", "-more"];
  var titleNames = function (t) { return TPARTS.map(function (k) { return t + k; }); };
  var FB7 = ["head2"].concat(caseNames("b", FN.bcase, FN.bt, []), ["blane" + FN.bcase + "-e", "bq-at"], titleNames("ftb"))
    .filter(function (k) { return k !== "blane" + FN.bcase + "-a"; });                     /* Marlene McFly: state, question */
  var FB8 = ["bqt", "bqt-k", "bns", "gtb1", "gk-l", "cf1", "cf-feed", "gk1-at", "gk1", "bo", "bo-st"];                              /* turned back: checklist, FALLBACK */
  var FB9 = ["bt", "bn", "bns2", "cf-feed2"].concat(FN.bt2, ["gtb2", "cf2", "gk2-at", "gk2", "ab", "blane" + FN.bcase + "-a"]);
  var JOURNEY = ["gold", "db-sum"].concat(CARDS, FB7, FB8, FB9);
  var GOLDLINES = ["gtrunk", "gb1", "gb2", "gb3", "gb4"];                              /* 5.6's lines from the gold */
  var xyk = function (g, k) { return g.getAttribute(k).split(",").map(Number); };
  var placed = function (g, x, y, k) { g.setAttribute("transform", "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ") scale(" + k.toFixed(5) + ")"); };
  function grow(nm) {                                 /* a passage card grows out of its DB tile */
    var g = q(nm + "-at"), a = xyk(g, "data-from"), b = xyk(g, "data-at"), E = A.ease.io;
    return A.track(0.8, function (u) { var e = E(u); placed(g, a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] * Math.pow(b[2] / a[2], e)); });
  }

  /* ---- the overview's entry ---- */
  var aside = A.hide(JOURNEY.map(q), { dur: 0 });
  var tree = { name: "slide", layers: [
    L("aside", aside),
    [L("header", key("head")),
     G("maquette", [
       [L("question", A.enter(q("q-card"))), L("type", A.enter(q("qtype"))),
        G("passages DB", [L("its name", key("db5-name")), L("its tiles", A.enter(q("db5")))])],
       L("l-q", fl("l-q")),
       [G("the model's band", [
          [L("band", A.enter(q("model"))), L("transcript", A.enter(q("tr")))].concat(each(function (k) { return L("t-" + k, A.enter(q("t-" + k))); })),
          each(function (k) { return L("call-" + k, fl("call-" + k)); }).concat(each(function (k) { return L("res-" + k, fl("res-" + k)); }))]),
        G("the orchestrator's band", [
          [L("band", A.enter(q("orch"))), L("check", A.enter(q("check"))), L("gate", A.enter(q("gate"))), L("record", A.enter(q("rec")))],
          [L("l-ck", fl("l-ck")), L("l-rg", fl("l-rg"))]])],
       [L("l-type", fl("l-type")),
        G("the bus into the DB", [L("stubs", A.par.apply(null, ["stub-search", "stub-read", "stub-extract"].map(function (k) { return A.draw(q(k), { dur: 0.4 }); }))),
                                  L("bus", A.draw([q("bus"), q("bus5")], { dur: 0.5 })), L("dots", A.pop(q("bus-dots"), { dur: 0.3 }))]),
        L("l-every", fl("l-every")), L("l-rc", fl("l-rc")), L("l-cr", fl("l-cr")), L("l-sg", fl("l-sg")), L("l-gs", fl("l-gs"))],
       L("l-ans", fl("l-ans")),
       L("answer exit", A.enter(q("ans")))]),
     G("lanes", [PASSES.map(function (p) { return L("lane " + p, A.seq(A.pop(q("lane" + p + "-frame"), { dur: 0.4 }), key("lane" + p + "-label"))); })])]] };

  /* ---- the parts A.focus dims and lights (none inside another) ---- */
  var NAMES = ["head", "q-card", "l-q", "qtype", "model", "tr"]
    .concat(each(function (k) { return "t-" + k; }), each(function (k) { return "call-" + k; }), each(function (k) { return "res-" + k; }))
    .concat(["l-type", "stub-search", "stub-read", "stub-extract", "bus", "bus5", "bus-dots", "l-every", "orch", "check", "gate",
             "rec", "l-ck", "l-rg", "l-rc", "l-cr", "l-sg", "l-gs", "l-ans", "ans", "db-blk5", "lane1", "lane2", "lane3", "lane4", "lvs"]);
  var P = NAMES.map(q);
  var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 5: no part " + k); return i; }); };

  /* ---- the DB's tiles, pass by pass ---- */
  var band = function (j) { return q("ty" + j); };
  var LIT = {}, OK = {}, NO = {};                   /* followed as the steps are made, in order */
  var blink = function (b) { return A.track(0.45, function (u) { b.style.opacity = u <= 0 || u >= 1 ? "" : (0.25 + 0.75 * Math.abs(Math.cos(Math.PI * u))).toFixed(3); }); };
  var lightTiles = function (js) {                  /* a search's tiles swept in (one listed again blinks), a read's likewise */
    var seen = {};
    return A.stagger(js.filter(function (j) { if (seen[j]) return false; seen[j] = 1; return true; }), function (j) {
      var t = LIT[j] ? blink(band(j)) : A.highlight(band(j), { dur: 0.25 }); LIT[j] = 1; return t;
    }, 0.04);
  };
  var green = function (j) {                         /* a nugget kept on it: green, its small scene, its check */
    var t = A.seq(A.reveal(q("tok" + j), { dur: 0.3 }), A.write(q("tk" + j + "-tick")));   /* over its red, which keeps its cross */
    OK[j] = 1; return t;
  };
  var red = function (j) { NO[j] = 1; return A.seq(A.reveal(q("tno" + j), { dur: 0.3 }), A.write(q("tx" + j + "-tick"))); };
  /* the passes before p: what they met is withheld (partly transparent yellow), their greens and reds put away */
  var withhold = function (p) {
    var js = [].concat.apply([], PASSES.filter(function (x) { return x < p; }).map(function (x) { return T.pass[x]; }));
    var prev = T.pass[p - 1] || [];
    var fade = A.track(0.6, function (u) { var e = A.ease.io(u); js.forEach(function (j) { if (T.pass[p - 1].indexOf(j) >= 0) band(j).style.opacity = (1 - 0.62 * e).toFixed(3); }); });
    var away = [].concat.apply([], prev.map(function (j) { return (OK[j] ? [q("tok" + j)] : []).concat(NO[j] ? [q("tno" + j)] : []); }));
    return A.par(fade, away.length ? A.hide(away, { dur: 0.4 }) : null);
  };

  /* what is shown as a step starts: the journey's parts the step before left, opaque; every other one hidden */
  function state(shown) {
    var S = shown.map(q);
    return { dur: 0, set: function (t) {
      if (t < 0) return;
      JOURNEY.forEach(function (k) { var e = q(k); e.style.opacity = S.indexOf(e) >= 0 ? "" : "0"; });
    } };
  }
  var RET = 0;
  var recount = function (n, a, b, d) { return A.recount(q(n), { from: a, to: b, dur: d || 0.3 }); };
  /* the check's two counts, NUGGETS kept and turned back: CK follows what they show as the steps are made, in order */
  var CK = [0, 0];
  var ckTo = function (ok, no) {
    var t = A.par(ok !== CK[0] ? recount("ck-ok", CK[0], ok) : null, no !== CK[1] ? recount("ck-no", CK[1], no) : null);
    CK = [ok, no]; return t;
  };
  var gateSays = function (g) { return A.seq(A.reveal(q(g), { dur: 0.3 }), A.count(q(g + "-reading"), { dur: 0.7 }), A.write(q(g + "-verdict"))); };

  /* ---- a pass's SUMMARY: its calls one by one, in its lane and in the DB, then its answer ---- */
  function summary(p) {
    var E = T.ev[p], ln = "lane" + p;
    RET = 0;
    var before = p > 1 ? [
      L("the passes before: withheld", withhold(p)),
      L("what the pass before left, put away", A.hide([q("g" + (p - 1)), q("a" + (p - 1))].concat(p > 2 ? [q("wh" + (p - 1))] : []), { dur: 0.35 })),
      L("withheld " + T.pass[p - 1].length, A.seq(A.reveal(q("wh" + p), { dur: 0.01 }), key("wh" + p))),
      L("the check's counts back to 0", ckTo(0, 0))] : [
      L("the check's counts", A.seq(A.reveal(q("ck"), { dur: 0.01 }), A.par(key("ck-ok"), key("ck-no"))))];
    var calls = E.map(function (r, i) {
      var parts = [A.pop(q(ln + "-c" + r.c), { dur: 0.35 }), recount(ln + "-calls", i, i + 1)];
      if (r.ret !== RET) { parts.push(recount(ln + "-ret", RET, r.ret)); RET = r.ret; }
      if (r.lit.length) parts.push(lightTiles(r.lit));
      r.no.forEach(function (j) { parts.push(red(j)); });
      r.ok.forEach(function (j) { parts.push(green(j)); });
      if (r.n_ok !== CK[0] || r.n_no !== CK[1]) parts.push(ckTo(r.n_ok, r.n_no));
      if (r.k === "submit") parts.push(A.seq(gateSays("g" + p), A.pace(A.enter(q("a" + p)), 1.5)));
      return L("call " + (i + 1) + ": " + r.k, A.seq(A.par.apply(null, parts), A.wait(r.k === "search" || r.k === "record" ? 0.25 : 0.1)));
    });
    return [[].concat(before, [                         /* together: what the passes before left ‖ this pass's box */
      G("the question box", [L("box", A.enter(q(ln + "-q"))), L("in", fl(ln + "-p1"))]),
      L("its calls and passages retrieved, from 0", A.seq(A.reveal([q(ln + "-calls"), q(ln + "-ret")], { dur: 0.01 }), recount(ln + "-calls", 0, 0, 0.01), recount(ln + "-ret", 0, 0, 0.01)))])].concat(
      calls,
      [G("its answer", [L("out", fl(ln + "-p2")), L("the answer", A.pace(A.enter(q(ln + "-a")), 1.5))])]);
  }

  /* ---- a DETAIL step: the passage with its scene, then each record call's nuggets (the check's score, its tick or
     cross and why), then the note the orchestrator sent back, where the trace has one ---- */
  /* the NLI model's verdict, which decides: its score on 0..1 against the 0.55 floor */
  var nliOf = function (nm) {
    var mv = T.nlimv[nm], band = q(nm + "-band");
    var flashBand = A.track(0.9, function (u) { band.setAttribute("fill-opacity", u <= 0 || u >= 1 ? "0.18" : (0.18 + 0.3 * Math.abs(Math.sin(u * Math.PI * 2))).toFixed(3)); });
    var head = A.seq(A.reveal(q(nm + "-why"), { dur: 0.01 }), key(nm + "-nk"), A.draw([q(nm + "-ax"), q(nm + "-fl")], { dur: 0.5 }), key(nm + "-flk"),
                     A.reveal(band, { dur: 0.3 }), key(nm + "-bk"),
                     A.pop(q(nm + "-mc"), { dur: 0.4 }), key(nm + "-mck"));
    if (!mv) return A.seq(head, A.count(q(nm + "-dv"), { dur: 0.5 }));          /* outside the band: MiniCheck alone */
    return A.seq(head,
                 flashBand,                                                         /* unsure: the second opinion */
                 A.pop(q(nm + "-db"), { dur: 0.4 }), key(nm + "-dbk"),
                 A.par(A.move(q(nm + "-mc"), { from: [0, 0], to: [mv.mc, 0], dur: 0.8 }), A.move(q(nm + "-db"), { from: [0, 0], to: [mv.db, 0], dur: 0.8 })),
                 A.pop(q(nm + "-dot"), { dur: 0.4 }), key(nm + "-avk"), A.count(q(nm + "-dv"), { dur: 0.5 }));
  };
  var CNT = {};                                        /* each nugget's counts before and after it is judged */
  Object.keys(T.det).forEach(function (c) { T.det[c].n.forEach(function (nm, k) { CNT[nm] = T.det[c].cnt[k]; }); });
  var one = function (nm) {
    var c = CNT[nm];
    return A.seq(c ? ckTo(c[0], c[1]) : null, A.highlight([].slice.call(q.all(nm + "-sp")), { dur: 0.7 }), A.reveal(q(nm + "-at"), { dur: 0.01 }),
                 A.pace(A.enter(q(nm)), 1.6), nliOf(nm), c ? ckTo(c[2], c[3]) : null);
  };
  var nugs = function (ns) { return A.seq.apply(null, ns.map(one)); };
  var ORCH = ["check", "l-rc", "l-cr", "rec", "l-ck"];
  var GATE = ["gate", "l-sg", "l-gs", "l-rg", "l-ans", "ans"];
  var DET = ORCH.concat(GATE, ["tr", "t-record", "call-record", "res-record", "t-submit", "call-submit", "res-submit"]);
  var SUM = function (p) { return ["db-blk5", "lane" + p, "check", "gate", "l-ans", "ans"]; };
  var NEUTRAL = function () {                         /* the DB as a summary: every passage met, partly transparent yellow */
    var J4 = T.pass[4];
    var fade = A.track(0.6, function (u) { var e = A.ease.io(u); J4.forEach(function (j) { band(j).style.opacity = (1 - 0.62 * e).toFixed(3); }); });
    var marks = J4.filter(function (j) { return OK[j] || NO[j]; }).reduce(function (a, j) { return a.concat(OK[j] ? [q("tok" + j)] : [], NO[j] ? [q("tno" + j)] : []); }, []);
    return A.par(fade, A.hide(marks.concat([q("g4"), q("a4"), q("ck"), q("wh4"), q("db5-name")]), { dur: 0.5 }));                /* the exit card left empty, as the question */
  };

  var STEPS = [
    { look: SUM(1), frame: "home", shown: [], act: function () { return summary(1); } },                                   /* 5.1 pass 1 */
    { look: SUM(2), frame: "home", shown: [], act: function () { return summary(2); } },                                   /* 5.2 pass 2 */
    { look: SUM(3), frame: "home", shown: [], act: function () { return summary(3); } },                                   /* 5.3 pass 3 */
    { look: DET.concat(["db-blk5"]), frame: "pcn", shown: [],                                                              /* 5.4 Ilum comes in */
      act: function () { return [
        L("the passage, large", A.seq(A.reveal(q("pskb-at"), { dur: 0.01 }), A.par(grow("pskb"), A.pace(A.enter(q("pskb")), 1.5)))),
        L("its nugget, ruled on", nugs(T.det.c3.n))]; }, loop: "pskb" },
    { look: SUM(4), frame: "home", shown: CARDS, away: CARDS, act: function () { return summary(4); } },                     /* 5.5 pass 4 */
    { look: null, frame: "home", shown: [],                                                                                /* 5.6 our evaluation */
      act: function () { return [[                    /* two groups together: the DB as a summary ‖ the gold and its verdicts */
        G("the DB", [L("the pipeline at rest, the DB a summary", NEUTRAL()),
                     L("99 different passages", A.seq(A.reveal(q("db-sum"), { dur: 0.01 }), key("db-sum")))]),
        G("our evaluation", [
          L("the organisers' gold", A.seq(A.reveal(q("gold"), { dur: 0.01 }), key("gold-c"), A.pop(q("gold").querySelector("rect"), { dur: 0.45 }),
                                          key("gold-k"), key("gold-v"))),
          L("from the gold to the middle of the four passes", A.nodot(A.draw(q("gtrunk"), { dur: 1.1 }), q("gtrunk"))),
          PASSES.map(function (p) { return L("to pass " + p + "'s answer", A.nodot(A.draw(q("gb" + p), { dur: 0.6 }), q("gb" + p))); }),
          PASSES.map(function (p) { return L("pass " + p + ": right or wrong", A.write(q("lv" + p))); })])]]; } },
    /* 5.7, in one motion (the author, 6 November 2026: "I want 5.7 and 5.8 to be in one motion"): the camera opens the
       margin; the title re-keyed; the fallback's title and its count; Marlene McFly, q0013, pass 1, in 5.6's layout (its
       DB: nothing withheld on a first pass, what it retrieved, the nugget kept), its question; then FALLBACK 1, the
       evidence gate: "Michael J. Fox" at the gate on one passage, the gate's checklist showing how 0.38 came about,
       turned back; the gate's note to the model, stamped */
    { look: null, frame: "fb", shown: ["gold", "db-sum"], withLook: true,     /* the camera opens with the first layer */
      away: ["lvs", "gold", "db-sum", "tps"].concat(GOLDLINES, [].concat.apply([], ALL4.map(function (p) { return laneParts("", p, true); }))),
      act: function () { return [
        /* layer 1, together: the camera, the title, which question, the fallback's title, the case's state, the question
           card, the question's type */
        caseIn("b", FN.bcase, FN.bt, T.fb.b_ck0, "bq", FN.bcase, "lane", "ftb").concat([
          L("the question's type, as the pipeline predicted it: 2 claims needed", A.seq(shown("bqt"), A.enter(q("bqt")), says("bqt-k")))]),
        /* layer 2, the cause and its effects: the nugget's score → the gate turns the answer back → its confidence ‖ its
           checklist, together */
        G("the gate, on one nugget", [
          L("the nugget's score: one claim against its passage", says("bns")),
          L("the gate: 0.38, turned back", turnedBack("gtb1")),
          [G("the answer's confidence, as the orchestrator computes it",
             [L("from the gate", A.seq(shown("gk-l"), A.draw(q("gk-l"), { dur: 0.5 }))), L("computed", formula("cf1", [q("cf-feed")]))]),
           L("the gate's rules, as a checklist", A.seq(shown("gk1-at"), A.pace(A.checklist(q("gk1")), 1.8)))]]),
        /* layer 3: the fallback, because the gate turned it back */
        L("the fallback: the gate's note, stamped", A.pace(note("bo"), 1.6))]; }, loop: "bq" },
    /* 5.8 the model does as told: it records a second passage its first search had listed; the check keeps it; the gate's
       checklist again, its values cleared and checked anew: 0.87, committed */
    { look: null, frame: "fb", shown: FB7.concat(FB8), away: ["bo", "bo-st"],   /* the note answered: the turn takes its place */
      act: function () { var LP = "blane" + FN.bcase; return [
        /* the model's turn and its call → the nugget it records (its card ‖ its tile green, then its score) → together:
           the check's count ‖ the gate's 0.87 ‖ the confidence recomputed ‖ the checklist re-evaluated ‖ the submit call
           → committed: the answer at the exit ‖ in pass 1's box */
        [L("its next turn: a second passage", card("bt", 2)), L("a call", A.par(A.pop(q(LP + "-c" + FN.b_cut[0]), { dur: 0.35 }), recount(LP + "-calls", FN.b_cut[0], FN.b_cut[0] + 1)))],
        [L("the nugget it records, kept", card("bn", 1.8)), G("its passage", [L("green", tilesIn(FN.bt2)), L("its score", says("bns2"))])],
        [L("the check: 2 kept", ckTo(T.fb.b_ck1[0], T.fb.b_ck1[1])),
         L("the gate: 0.87, passes", A.seq(A.hide(q("gtb1"), { dur: 0.3 }), gateSays("gtb2"))),
         L("its confidence anew", A.seq(A.hide(q("cf1"), { dur: 0.01 }), formula("cf2", [null, q("cf-feed2")]))),
         L("its checklist anew", A.seq(A.hide(q("gk1-at"), { dur: 0.01 }), shown("gk2-at"), shown("gk2"), A.pace(A.checklist(q("gk2"), { pop: false }), 1.8))),
         L("a call", A.par(A.pop(q(LP + "-c" + (FN.b_cut[0] + 1)), { dur: 0.35 }), recount(LP + "-calls", FN.b_cut[0] + 1, FN.b_all[0])))],
        [L("Michael J. Fox, delivered", card("ab", 1.5)), L("in pass 1's box", A.seq(shown(LP + "-a"), A.reveal(q(LP + "-a"), { dur: 0.4 })))]]; }, loop: "bq" }
  ];

  /* ---- the fallbacks' motions ---- */
  var shown = function (n) { return A.reveal(q(n), { dur: 0.01 }); };
  var says = function (n) { return A.seq(shown(n), key(n)); };
  var card = function (n, pace) { return A.seq(shown(n), pace ? A.pace(A.enter(q(n)), pace) : A.enter(q(n))); };
  var turnedBack = function (g) {                   /* the gate's reading counted, then its hook written and its words keyed */
    var v = q(g + "-verdict");
    return A.seq(A.hide(v, { dur: 0 }), A.reveal(q(g), { dur: 0.3 }), A.count(q(g + "-reading"), { dur: 0.7 }), A.reveal(v, { dur: 0.01 }),
                 A.par(A.write(v), A.type(v.querySelectorAll("text"), { quick: true })));
  };
  var note = function (n) { return A.seq(shown(n), A.dictate(q(n), { cps: 75 }), A.pop(q(n + "-st"), { dur: 0.45 })); };   /* printed, then stamped */

  /* a case's state, in 5.6's layout: the title re-keyed (the first case only) and which question; the pass boxes swapped
     for the case's in place (frames and labels identical: the swap does not show), then their contents; the DB's
     withheld, then retrieved, then kept and turned back with their scenes, the check's counts; last the question card */
  var tilesIn = function (names) {
    return names.length ? A.par.apply(null, names.map(function (k) { return A.seq(shown(k), A.pop(q(k), { dur: 0.4 })); })) : null;
  };
  /* the answer's confidence, the orchestrator's formula (concepts/confidence_box.py): computed step by step, the nugget's
     score arriving along its leader from its label on the DB tile (5.7) */
  var formula = function (nm, feed) { return A.seq(shown(nm), A.confidence(q(nm), { feed: feed })); };   /* step by step */
  /* the fallback's title: the slip pops, its name keyed, the count growing from 0, its unit, then the line more */
  var fbTitle = function (t) {
    return A.seq(A.par.apply(null, titleNames(t).map(shown)), A.pop(q(t), { dur: 0.45 }), A.par(key(t + "-name"), key(t + "-tag")),
                 A.par(A.count(q(t + "-n"), { dur: 1.6 }), key(t + "-unit")), key(t + "-more"));
  };
  var caseIn = function (c, had, marks, ck, qc, cp, prev, t) {
    var first = c === "b";
    var swap = A.seq(A.reveal(ALL4.map(function (p) { return q(c + "lane" + p); }), { dur: 0.01 }),
                     A.hide([].concat.apply([], ALL4.map(function (p) { return [q(prev + p + "-frame"), q(prev + p + "-label")]; })), { dur: 0.01 }));
    var contents = function (p) {
      if (p > had) return says(c + "lane" + p + "-none");
      var ln = c + "lane" + p, parts = LANE_PARTS.filter(function (k) { return !(p === cp && k === "-a"); });
      return A.seq(A.par.apply(null, parts.map(function (k) { return shown(ln + k); })),
                   A.par(A.reveal(parts.map(function (k) { return q(ln + k); }), { dur: 0.5 }), p === cp ? shown(ln + "-e") : null));
    };
    /* ONE layer of groups that start together (PLAN.md, "A slide animates by groups"; the author, 6 November 2026, on
       5.6 → 5.7: "there are a lot of groups on the same layer [...] whenever possible [...] groups animated in
       parallel"): the title, which question, the fallback's title, the case's state (its own layers: the pass boxes
       swapped, then their contents with the DB's withheld, then what it retrieved, then what it kept and the check's
       counts: a flow), the question card */
    return [
      first ? L("the title, re-keyed", A.seq(A.reverse(key("head")), says("head2"))) : null,
      L("which question, which pass", A.seq(says(c + "-head"), says(c + "-gold"))),
      L("the fallback's title, how often it fired", fbTitle(t)),
      G("the case's state", [
        L("its pass boxes, in place of the last", swap),
        [L("its passes 1-4", A.par.apply(null, ALL4.map(contents))),
         first ? L("the DB's name, back", A.reveal(q("db5-name"), { dur: 0.4 })) : null,
         L("the DB: withheld from this pass", A.seq(shown(c + "db-wh"), A.reveal(q(c + "db-wh"), { dur: 0.6 }),
                                                     FN.nwk && c === "n" ? says("ndb-wh-k") : null))].filter(Boolean),
        L("retrieved by this pass", A.seq(shown(c + "db-lit"), A.reveal(q(c + "db-lit"), { dur: 0.6 }))),
        [marks.length ? L("kept and turned back, with their scenes", tilesIn(marks)) : null,
         L("the check's counts", first ? A.seq(ckTo(0, 0), A.reveal(q("ck"), { dur: 0.3 }), ckTo(ck[0], ck[1])) : ckTo(ck[0], ck[1]))].filter(Boolean)]),
      L("the question, its scene", A.seq(shown(qc + "-at"), card(qc, 1.5)))].filter(Boolean);
  };

  var putAway = function (names) { return names && names.length ? A.hide(names.map(q), { dur: 0.35 }) : null; };
  var steps = STEPS.map(function (st, s) {
    var from = s ? STEPS[s - 1] : null, f0 = from ? F[from.end || from.frame] : F.home, f1 = F[st.frame];
    var move = f0 === f1 ? null : A.zoom(q.svg, { from: f0, to: f1, dur: 0.7 });
    var still = !(from && from.look) && !st.look;      /* the overview's focus kept: nothing to light or dim */
    var look = { name: "look", group: [move, still ? null : A.focus(P, { from: from && from.look ? ix(from.look) : null, to: st.look ? ix(st.look) : null, dim: 0.3, dur: move ? 0.7 : 0.45 }),
                                       putAway(st.away)].filter(Boolean) };
    var act = st.act();
    if (st.withLook && look.group.length) {           /* the camera and what is put away start with the act's first layer */
      act[0] = [{ name: "look", group: look.group }].concat(act[0]); look = { group: [] };
    }
    return { enter: A.groups({ name: "5." + (s + 1), layers: [L("state", state(st.shown)), look.group.length ? look : null,
                                                            { name: "act", layers: act.filter(Boolean) }].filter(Boolean) }),
             loop: st.loop ? A.ending(q(st.loop + "-scene"), { acted: true }) : null };
  });

  return {
    entry: A.groups(tree),
    steps: steps,
    /* only the four pass boxes, each to the start of its pass (the author, 6 November 2026) */
    zones: { 1: "lane1", 2: "lane2", 3: "lane3", 5: "lane4" }
  };
});
