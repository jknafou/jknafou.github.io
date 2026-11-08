/* Slide 9: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js).
   The tree of groups, the five steps and the grid are in the .py's header. Slide 6's view: the passes at the left, the
   runs at the right, no permanent link; each rule SHOWN in the middle (bars against a median, votes landing on their
   branches, entailment sums growing, the best of each side compared, the deciding value swept and turned green), then
   its A balls along the links into its card and its lines as sent. The explanation of one run stays through its beats
   and is put away as the next run starts. The pass blocks' and rows' entries are slide 6's, restated (a slide's motions
   cannot be imported from another's: live.js keeps each maker private). No camera. */
Deck.slide("09-additional-runs", function (A, q) {
  var D = JSON.parse(q("frames").getAttribute("data-runs"));
  var PASSES = [1, 2, 3, 4], GRP = ["sb", "il"];
  var key = function (n) { return A.type(q(n), { quick: true }); };
  var L = function (name, tr) { return { name: name, track: tr }; };
  var G = function (name, layers) { return { name: name, layers: layers.filter(Boolean) }; };
  var shown = function (n) { return A.reveal(q(n), { dur: 0.01 }); };
  var all = function (sel) { return [].slice.call(q.root.querySelectorAll(sel)); };
  var range = function (k) { var a = []; for (var i = 0; i < k; i++) a.push(i); return a; };
  var xy = function (el, a) { return el.getAttribute(a).split(",").map(Number); };
  var GREEN = "#3F8A4E";                             /* style.RIGHT: the deck's colour for a value that decides */

  /* ---- the parts each run's explanation is made of ---- */
  var turnParts = all('[data-a="turns"] [data-a]');
  var panel = function (k) { return range(D.panel[k]).map(function (i) { return q("pn-" + k + "-" + i); }).concat([q("pn-" + k + "-hl")]); };
  var midParts = function (g) { return all('[data-a="mid-' + g + '"] > [data-a]'); };
  var flies = all('[data-a^="fly-"]');
  var balls = function (k) { return D.rolls[k].map(function (p) { return q("tk-" + k + "-" + p); }); };
  var rowParts = function (k) { return [q("ac-" + k + "-text"), q("ac-" + k + "-value"), q("ac-" + k + "-verdict"), q("fl-" + k)]; };
  var EXPLAIN_LD = [q("turns"), q("pn-ld"), q("lines-ld")].concat(balls("ld"));

  /* ---- the overview's entry: what the steps bring is set aside first ---- */
  var later = [].concat(turnParts, panel("ld"), panel("ia"), [q("lines-ld"), q("lines-ia")], midParts("sb"), midParts("il"),
                        flies, balls("ld"), balls("ia"), rowParts("ld"), rowParts("ia"));
  var gauges = ["ld", "ia"].filter(function (k) { return q("ac-" + k + "-bar"); })
    .map(function (k) { return A.hold(A.fill(q("ac-" + k + "-bar"), { value: q("ac-" + k + "-value") }), 0.01, 0); });
  var aside = A.par.apply(null, [A.hide(later, { dur: 0 })].concat(gauges));

  function block(p) {                               /* slide 6's pass block, read along its flow (restated) */
    var ln = "lane" + p;
    return G("pass " + p, [
      [L("its box", A.pop(q(ln + "-frame"), { dur: 0.4 })), L("its passages", A.enter(q("strip" + p)))],
      [L("its label", key(ln + "-label")), L("its question", A.enter(q(ln + "-q")))],
      L("in", A.flow(q(ln + "-p1"), { dur: 0.35 })),
      L("its calls", A.seq(A.pop(q(ln + "-chips"), { dur: 0.35 }), A.par(key(ln + "-calls"), key(ln + "-ret")))),
      L("out", A.flow(q(ln + "-p2"), { dur: 0.35 })),
      L("its answer", A.pace(A.enter(q(ln + "-a")), 1.5)),
      [L("right or wrong", A.write(q("lv" + p))),
       L("its kept nuggets", A.seq(A.pop(q("greens" + p), { dur: 0.35 }), A.write(all('[data-a="greens' + p + '"] [data-verdict]')),
                                   key("scores" + p)))]]);
  }
  function row(k) {                                 /* a run: its name and kind; an answer run's empty card, ruled */
    var name = [L("its name", A.flip(q("nm-" + k))), L("its kind", key("kind-" + k))];
    if (k === "pr") return G("the passages, unchanged", [name]);
    return G(k, [name, L("its card", A.pop(q("ac-" + k), { dur: 0.4 })), L("ruled", A.draw(q("ac-" + k + "-ph"), { dur: 0.4 }))]);
  }
  var tree = { name: "slide", layers: [
    L("aside", aside),
    [L("header", key("head")),
     G("the passes", [L("heading", key("have-h")), PASSES.map(block)]),
     G("the runs", [L("heading", key("sub-h")), ["pr", "ld", "ia"].map(row)])]] };

  /* ---- the parts A.focus dims and lights (none inside another; the explanations are not among them) ---- */
  var NAMES = ["head", "have-h", "sub-h", "blk1", "blk2", "blk3", "blk4", "row-pr", "row-ld", "row-ia", "mid-sb", "mid-il"];
  var P = NAMES.map(q);
  var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 9: no part " + k); return i; }); };
  var blk = function (ps) { return ps.map(function (p) { return "blk" + p; }); };

  /* ---- the motions a rule is shown by ---- */
  var tint = function (el) { var f0 = el.getAttribute("fill"); return A.track(0.5, function (u) { el.setAttribute("fill", u > 0 ? GREEN : f0); }); };
  var decides = function (hl, el) { return A.seq(shown(hl), A.par(A.highlight(q(hl), { dur: 0.5 }), tint(el))); };
  var counted = function (el, d) { return A.seq(A.reveal(el, { dur: 0.01 }), A.count(el, { dur: d || 0.8 })); };
  var keyed = function (n) { return A.seq(shown(n), key(n)); };
  var lift = function (el, d) { return A.par(A.reveal(el, { dur: 0.2 }), A.move(el, { from: xy(el, "data-from"), to: [0, 0], dur: d || 0.8 })); };
  var routes = function (k) {                       /* a link set, the pipeline's: lines drawn together, dots, the trunk */
    var R = all('[data-a="lines-' + k + '"] > [data-a^="ln-' + k + '-"]'), Dt = all('[data-a="lines-' + k + '"] > [data-a^="dot-' + k + '-"]');
    var arw = q("arw-" + k);
    return G("links " + k, [L("shown", shown("lines-" + k)), L("lines", A.draw(R, { dur: 0.7 })),
                           Dt.length ? L("where they meet", A.pop(Dt, { dur: 0.3 })) : null, arw ? L("into the run", A.flow(arw, { dur: 0.4 })) : null]);
  };
  var rolls = function (k) {                        /* the A balls along their drawn links into the card, together */
    return A.par.apply(null, D.rolls[k].map(function (p) {
      var b = q("tk-" + k + "-" + p);
      return A.seq(A.reveal(b, { dur: 0.15 }), A.travel(b, { along: [q("gd-" + k + "-" + p), q("arw-" + k)], into: q("ac-" + k), dur: 1.4 }));
    }));
  };
  var answer = function (k) {                       /* the ruled card's rule lifted, the answer thought and typed */
    var c = "ac-" + k, texts = q(c + "-text").querySelectorAll("text");
    return A.seq(A.reverse(A.draw(q(c + "-ph"), { dur: 0.3 })), shown(c + "-text"), A.think(texts[0], { dur: 0.6 }), A.type(texts, { quick: true }));
  };
  var gauge = function (k) {                        /* the confidence the rule gave: the gauge hunts and settles (0: no fill) */
    var bar = q("ac-" + k + "-bar"), val = q("ac-" + k + "-value");
    return bar ? A.fill(bar, { value: val }) : A.seq(shown("ac-" + k + "-value"), A.count(val, { dur: 0.4 }));
  };
  var lines = function (k) { return A.seq(shown("fl-" + k), A.type(q("fl-" + k).querySelectorAll("text"), { quick: true })); };
  var mark = function (k) { return A.seq(shown("ac-" + k + "-verdict"), A.write(q("ac-" + k + "-verdict"))); };
  var ruleLines = function (k, from, to) {          /* a rule's lines over its row, keyed together */
    return A.par.apply(null, range(to - from).map(function (i) { return keyed("pn-" + k + "-" + (from + i)); }));
  };
  var picks = function (k) { return decides("pn-" + k + "-hl", q("pn-" + k + "-" + D.pick[k] + "-v")); };

  var grows = function (i, d) {                    /* a turn's bar grows from its base, its length counting at its end */
    var b = q("tn-b" + i), v = q("tn-v" + i), W = parseFloat(b.getAttribute("width")), x0 = parseFloat(b.getAttribute("x"));
    var N = parseInt(v.textContent, 10), vx = parseFloat(v.getAttribute("x")), gap = vx - x0 - W;
    return A.track(d, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.out(u);
      b.setAttribute("width", (W * e).toFixed(2)); b.style.opacity = e > 0 ? "" : "0";
      v.textContent = String(Math.round(N * e)); v.setAttribute("x", (x0 + W * e + gap).toFixed(2)); v.style.opacity = e > 0 ? "" : "0";
    });
  };

  /* 9.1, first: pass 1's turns, one bar each (turn 1..4), against the one median line; the longest marked */
  var turns = G("pass 1's turns", [
    [L("what they are", keyed("tn-cap")), L("turn 1..4", A.par.apply(null, range(D.n_turns).map(function (i) { return keyed("tn-c" + i); })))],
    L("each turn's reasoning, in characters", A.stagger(range(D.n_turns), function (i) { return grows(i, 0.8); }, 0.25)),
    L("the median longest turn of the 65 first passes", A.seq(shown("tn-med"), A.draw(q("tn-med"), { dur: 0.5 }))),
    L("its words", A.seq(keyed("tn-mk"), keyed("tn-mv"))),
    L("the longest, past it", decides("tn-hl", q("tn-v1")))]);

  /* 9.2: a vote lifts out of each answer card onto its branch; each bus counts its votes */
  var votes = function (g) {
    return G("the votes of " + g, [
      L("each pass's vote", A.par.apply(null, D.groups[g].map(function (p) { return lift(q("vt-" + p)); }))),
      L("counted on its bus", counted(q("jv-" + g), 0.6)), L("votes", keyed("jvk-" + g))]);
  };
  /* 9.2, then: each kept nugget score flies from under its strip onto its pass's branch, the sum counting at each arrival */
  var sums = function (p) {
    var s = q("sm-" + p), parts = s.getAttribute("data-parts").split(",").map(Number), acc = 0, legs = [];
    parts.forEach(function (v, j) {
      var f = q("fly-" + p + "-" + j), from = acc; acc += v;
      var o = xy(f, "data-from"), low = [o[0], o[1] + 10], under = [0, o[1] + 10];   /* below its strip, along, then up */
      legs.push(A.seq(A.par(A.reveal(f, { dur: 0.15 }), A.move(f, { from: o, to: low, dur: 0.2 })),
                      A.move(f, { from: low, to: under, dur: 0.55 }), A.move(f, { from: under, to: [0, 0], dur: 0.35 }),
                      A.par(A.hide(f, { dur: 0.15 }), j ? A.wait(0.01) : A.reveal(s, { dur: 0.15 }), A.recount(s, { from: from, to: acc, dec: 3, dur: 0.35 }))));
    });
    return L("pass " + p + "'s entailment, summed", A.seq.apply(null, legs));
  };
  var best = function (g) {
    return G("the best pass of " + g, [L("lifts to its bus", lift(q("jb-" + g))), L("best pass", keyed("jbk-" + g))]);
  };

  /* one step per run, as on slide 6: each one animation ending on its lines as sent */
  var LOOK_IA = blk(PASSES).concat(["row-ia", "mid-sb", "mid-il"]), WON = blk(D.groups[D.win]).concat(["row-ia", "mid-" + D.win, "row-pr"]);
  var STEPS = [
    { look: blk([1]).concat(["row-ld", "row-pr"]),                                                                   /* 9.1 longest deliberation */
      act: [turns,
            routes("ld"), L("pass 1's answer along it, into the card", rolls("ld")), L("Starkiller Base", answer("ld")),
            L("the rule's two lines", ruleLines("ld", 0, D.panel.ld)), L("the line it takes", picks("ld")),
            L("its confidence: 0", gauge("ld")), L("its lines as sent", lines("ld")), L("its mark", mark("ld"))] },
    { look: LOOK_IA, clear: EXPLAIN_LD, rest: WON,                                                                   /* 9.2 independent agreement */
      act: [[routes("sb"), routes("il")],
            [votes("sb"), votes("il"), L("the rule on votes", ruleLines("ia", 0, 1))],
            [L("the rule on a tie", ruleLines("ia", 1, 2))].concat(PASSES.map(sums)),
            GRP.map(best),
            L("the higher one", decides("jb-hl", q("jb-" + D.win))),
            L("the other answer, set aside", A.focus(P, { from: ix(LOOK_IA), to: ix(WON), dim: 0.3, dur: 0.6 })),
            routes("ia"), L("its answer along it, into the card", rolls("ia")), L("Ilum", answer("ia")),
            L("the rule's three lines", ruleLines("ia", 2, D.panel.ia)),
            [L("the line it takes", picks("ia")), L("two passes on their own", decides("jv-hl", q("jv-" + D.win)))],
            L("its confidence: 100", gauge("ia")), L("its lines as sent", lines("ia")), L("its mark", mark("ia"))] }
  ];
  var steps = STEPS.map(function (st, s) {
    var prev = s ? (STEPS[s - 1].rest || STEPS[s - 1].look) : null;
    return { enter: A.groups({ name: "9." + (s + 1), layers: [
      [L("look", A.focus(P, { from: prev ? ix(prev) : null, to: ix(st.look), dim: 0.3, dur: 0.6 })),
       st.clear ? L("the run before's explanation, cleared", A.hide(st.clear, { dur: 0.35 })) : null].filter(Boolean),
      { name: "act", layers: st.act }] }) };
  });

  return {
    entry: A.groups(tree),
    steps: steps,
    zones: { 1: "row-ld", 2: "row-ia" }             /* each run's row, to its step */
  };
});
