/* Slide 9, short version (9s): the full slide's drawing, overview and two steps (slides/09-additional-runs.js, validated
   and untouched), played as short slide 6 plays slide 6: each part started as soon as what it needs is on screen.
   The author, 10 November 2026: "I just noticed that we improved the animation of slide 6, but not 9 which should do
   exactly the same animation." (On short 6: "Slide 6 animation faster. (when I say faster, I mean more
   parallelization)"; "some overlaps and the documents animations (green) could be parallelized and get displayed when
   the tools are being loaded".)

   THE GRID is the full slide's, slide 6's view (the .py header): the passes 100-617.5, the middle 640-895, the runs
   from 900; one top line 230, one bottom line 784.

   WHAT IS FASTER, AND HOW (more in parallel, not sped up): every motion is the full slide's own (the same arguments,
   the same durations); only when it starts changes, by short 6's rules:
     - the act starts with the look (the focus moving while the first part draws);
     - a part that does not need another's END starts with it, or at the moment it needs (each turn's bar grows as soon
       as "turn 1..4" is keyed, not after the caption; the median line draws as the last bar grows; the longest is
       swept as the line is drawn, with the line's words; the link draws as that sweep starts; a ball rolls once its
       branch is drawn, while the arrow into the card is still drawing; the votes lift onto their branches as soon as
       the branches are there; a pass's nugget scores fly one 0.5 s after the other, each counted in on its arrival,
       its count never moved by two at once; the answer is thought and typed with the rule's lines; the gauge starts as
       the rule's line is swept; the run's lines are typed as the gauge lands on their value; the mark is written as
       the lines are typed);
     - a part that reads another's result still waits for it (the tie's line and the sums for the votes' counts, each
       side's best for its sums, the higher for the bests, the card for the ball, the line taken for the rule's lines).
   Parts that overlap are ONE LEAF (`at`: each part at its own offset, set as A.seq sets its own: not begun at its first
   state, latest first, then begun in order), so the groups rule holds on the layers around them.

   ENTRY ("9"), as short 6's: the full slide's tree (its .py header) with two changes, same motions and durations, only
   earlier starts: along every flow each layer but a group's last hands over LEAD = 0.2 s before its end (in the tree
   such a leaf counts its track's length less LEAD, a track shorter than LEAD counts 0, and the track plays on to its
   own end under the next layer's start); a pass's kept nuggets (its green tiles popping, their checks written
   together, their scores keyed) start with its calls instead of after its answer:
     aside → [header ‖ the passes (heading → the four blocks together, each: [box ‖ passages] → [label ‖ question] → in
     → [{calls → out → answer → right or wrong} ‖ its kept nuggets]) ‖ the runs (heading → [the passages' line ‖ the two
     rows, each: [name ‖ kind] → its card → ruled])].
   GROUPS of each step:
     9.1  [look ‖ "pass 1's turns against the median; the longest; its link, pass 1's answer along it"]
          → ["Starkiller Base with the rule's two lines; the line it takes; 0; its lines; the mark"]
     9.2  [look ‖ clear ‖ "the branches; the votes and their rule; the tie's rule and the sums; each side's best; the
          higher"] → [the other answer, set aside ‖ "Ilum's link; its answers along it"]
          → ["Ilum with the rule's three lines; the line it takes ‖ two passes on their own; 100; its lines; the mark"]
   NUMBERS: the full slide's, in its data-runs (run from the rules' own code and asserted against the files in
   slides/09-additional-runs.py; the ones the steps show asserted again in this slide's .py).
   ZONES: each run's row, to its step (the full slide's).
   HOW THE FULL MAKER IS REACHED: as on short slides 2, 5 and 6, the full slide's motion file is loaded just after this
   one; its Deck.slide call is caught here and not registered, and this maker calls it for its zones. The helpers below
   that the full maker keeps inside it are repeated here, with the same motions: they cannot be reached from outside
   it, and the full slide is not touched. */
(function () {
  "use strict";
  var ID = "09-additional-runs", full = null, reg = Deck.slide;
  Deck.slide = function (id, make) {               /* the full slide's registration, caught once */
    if (id === ID && !full) { full = make; Deck.slide = reg; return; }
    reg(id, make);
  };
  reg(ID, function (A, q) {
    if (!full) throw new Error(ID + " (short): the full slide's motion file was not loaded after this one");
    var m = full(A, q);
    var D = JSON.parse(q("frames").getAttribute("data-runs"));
    var PASSES = [1, 2, 3, 4], GRP = ["sb", "il"];
    var key = function (n) { return A.type(q(n), { quick: true }); };
    var L = function (name, tr) { return { name: name, track: tr }; };
    var shown = function (n) { return A.reveal(q(n), { dur: 0.01 }); };
    var all = function (sel) { return [].slice.call(q.root.querySelectorAll(sel)); };
    var range = function (k) { var a = []; for (var i = 0; i < k; i++) a.push(i); return a; };
    var xy = function (el, a) { return el.getAttribute(a).split(",").map(Number); };
    var GREEN = "#3F8A4E";

    /* ---- parts at their own offsets, in one leaf ([[t, track], ...]); set as A.seq sets its own ---- */
    function at(parts) {
      parts = parts.filter(function (p) { return p[1]; });
      var dur = Math.max.apply(null, parts.map(function (p) { return p[0] + p[1].dur; }));
      return { dur: dur, set: function (t) {
        for (var i = parts.length - 1; i >= 0; i--) if (parts[i][0] > t) parts[i][1].set(t - parts[i][0]);
        for (var j = 0; j < parts.length; j++) if (parts[j][0] <= t) parts[j][1].set(t - parts[j][0]);
      } };
    }
    var end = function (p) { return p[0] + p[1].dur; };

    /* ---- the parts each run's explanation is made of (the full maker's) ---- */
    var turnParts = all('[data-a="turns"] [data-a]');
    var panel = function (k) { return range(D.panel[k]).map(function (i) { return q("pn-" + k + "-" + i); }).concat([q("pn-" + k + "-hl")]); };
    var midParts = function (g) { return all('[data-a="mid-' + g + '"] > [data-a]'); };
    var flies = all('[data-a^="fly-"]');
    var balls = function (k) { return D.rolls[k].map(function (p) { return q("tk-" + k + "-" + p); }); };
    var rowParts = function (k) { return [q("ac-" + k + "-text"), q("ac-" + k + "-value"), q("ac-" + k + "-verdict"), q("fl-" + k)]; };
    var EXPLAIN_LD = [q("turns"), q("pn-ld"), q("lines-ld")].concat(balls("ld"));

    /* ---- the overview's entry, its parts handing over early (short 6's) ---- */
    var LEAD = 0.2;
    var early = function (tr) { return { dur: Math.max(0, tr.dur - LEAD), set: function (t) { tr.set(t); } }; };
    var E = function (name, tr) { return L(name, early(tr)); };
    var later = [].concat(turnParts, panel("ld"), panel("ia"), [q("lines-ld"), q("lines-ia")], midParts("sb"), midParts("il"),
                          flies, balls("ld"), balls("ia"), rowParts("ld"), rowParts("ia"));
    var gauges = ["ld", "ia"].filter(function (k) { return q("ac-" + k + "-bar"); })
      .map(function (k) { return A.hold(A.fill(q("ac-" + k + "-bar"), { value: q("ac-" + k + "-value") }), 0.01, 0); });
    var aside = A.par.apply(null, [A.hide(later, { dur: 0 })].concat(gauges));
    function block(p) {                 /* slide 6's pass block along its flow; its kept nuggets beside its calls */
      var ln = "lane" + p, checks = all('[data-a="greens' + p + '"] [data-verdict]');
      return { name: "pass " + p, layers: [
        [E("its box", A.pop(q(ln + "-frame"), { dur: 0.4 })), E("its passages", A.enter(q("strip" + p)))],
        [E("its label", key(ln + "-label")), E("its question", A.enter(q(ln + "-q")))],
        E("in", A.flow(q(ln + "-p1"), { dur: 0.35 })),
        [{ name: "its flow on", layers: [
           E("its calls", A.seq(A.pop(q(ln + "-chips"), { dur: 0.35 }), A.par(key(ln + "-calls"), key(ln + "-ret")))),
           E("out", A.flow(q(ln + "-p2"), { dur: 0.35 })),
           E("its answer", A.pace(A.enter(q(ln + "-a")), 1.5)),
           L("right or wrong", A.write(q("lv" + p)))] },
         L("its kept nuggets, as its calls load", A.seq(A.pop(q("greens" + p), { dur: 0.35 }),
           A.par(A.par.apply(null, checks.map(function (c) { return A.write(c); })), key("scores" + p))))]] };
    }
    function row(k) {                   /* a run: its name and kind; an answer run's empty card, ruled */
      if (k === "pr") return { name: "the passages, unchanged", layers: [[L("its name", A.flip(q("nm-" + k))), L("its kind", key("kind-" + k))]] };
      return { name: k, layers: [[E("its name", A.flip(q("nm-" + k))), E("its kind", key("kind-" + k))],
                                 E("its card", A.pop(q("ac-" + k), { dur: 0.4 })), L("ruled", A.draw(q("ac-" + k + "-ph"), { dur: 0.4 }))] };
    }
    var entry = A.groups({ name: "slide", layers: [
      L("aside", aside),
      [L("header", key("head")),
       { name: "the passes", layers: [E("heading", key("have-h")), PASSES.map(block)] },
       { name: "the runs", layers: [E("heading", key("sub-h")), ["pr", "ld", "ia"].map(row)] }]] });

    /* ---- the parts A.focus dims and lights (the full maker's) ---- */
    var NAMES = ["head", "have-h", "sub-h", "blk1", "blk2", "blk3", "blk4", "row-pr", "row-ld", "row-ia", "mid-sb", "mid-il"];
    var P = NAMES.map(q);
    var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 9s: no part " + k); return i; }); };
    var blk = function (ps) { return ps.map(function (p) { return "blk" + p; }); };

    /* ---- the motions a rule is shown by (the full maker's, the same arguments) ---- */
    var tint = function (el) { var f0 = el.getAttribute("fill"); return A.track(0.5, function (u) { el.setAttribute("fill", u > 0 ? GREEN : f0); }); };
    var decides = function (hl, el) { return A.seq(shown(hl), A.par(A.highlight(q(hl), { dur: 0.5 }), tint(el))); };
    var counted = function (el, d) { return A.seq(A.reveal(el, { dur: 0.01 }), A.count(el, { dur: d || 0.8 })); };
    var keyed = function (n) { return A.seq(shown(n), key(n)); };
    var lift = function (el, d) { return A.par(A.reveal(el, { dur: 0.2 }), A.move(el, { from: xy(el, "data-from"), to: [0, 0], dur: d || 0.8 })); };
    var routes = function (k, t0) {     /* a link set: [shown, lines 0.7] at t0, the dots and the trunk at t0 + 0.71 */
      var R = all('[data-a="lines-' + k + '"] > [data-a^="ln-' + k + '-"]'), Dt = all('[data-a="lines-' + k + '"] > [data-a^="dot-' + k + '-"]');
      var arw = q("arw-" + k);
      return [[t0, A.seq(shown("lines-" + k), A.draw(R, { dur: 0.7 }))], [t0 + 0.71, Dt.length ? A.pop(Dt, { dur: 0.3 }) : null],
              [t0 + 0.71, arw ? A.flow(arw, { dur: 0.4 }) : null]];
    };
    var rolls = function (k) {
      return A.par.apply(null, D.rolls[k].map(function (p) {
        var b = q("tk-" + k + "-" + p);
        return A.seq(A.reveal(b, { dur: 0.15 }), A.travel(b, { along: [q("gd-" + k + "-" + p), q("arw-" + k)], into: q("ac-" + k), dur: 1.4 }));
      }));
    };
    var answer = function (k) {
      var c = "ac-" + k, texts = q(c + "-text").querySelectorAll("text");
      return A.seq(A.reverse(A.draw(q(c + "-ph"), { dur: 0.3 })), shown(c + "-text"), A.think(texts[0], { dur: 0.6 }), A.type(texts, { quick: true }));
    };
    var gauge = function (k) {
      var bar = q("ac-" + k + "-bar"), val = q("ac-" + k + "-value");
      return bar ? A.fill(bar, { value: val }) : A.seq(shown("ac-" + k + "-value"), A.count(val, { dur: 0.4 }));
    };
    var lines = function (k) { return A.seq(shown("fl-" + k), A.type(q("fl-" + k).querySelectorAll("text"), { quick: true })); };
    var mark = function (k) { return A.seq(shown("ac-" + k + "-verdict"), A.write(q("ac-" + k + "-verdict"))); };
    var ruleLines = function (k, from, to) {
      return A.par.apply(null, range(to - from).map(function (i) { return keyed("pn-" + k + "-" + (from + i)); }));
    };
    var picks = function (k) { return decides("pn-" + k + "-hl", q("pn-" + k + "-" + D.pick[k] + "-v")); };
    var grows = function (i, d) {
      var b = q("tn-b" + i), v = q("tn-v" + i), W = parseFloat(b.getAttribute("width")), x0 = parseFloat(b.getAttribute("x"));
      var N = parseInt(v.textContent, 10), vx = parseFloat(v.getAttribute("x")), gap = vx - x0 - W;
      return A.track(d, function (u) {
        var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.out(u);
        b.setAttribute("width", (W * e).toFixed(2)); b.style.opacity = e > 0 ? "" : "0";
        v.textContent = String(Math.round(N * e)); v.setAttribute("x", (x0 + W * e + gap).toFixed(2)); v.style.opacity = e > 0 ? "" : "0";
      });
    };
    /* the card, the rule beside it, then what reads them: the answer thought and typed with the rule's lines (`rule`);
       then the line taken (`take`, a list run together); the gauge as that line is swept; the lines as the gauge lands;
       the mark as they are typed */
    var cardOn = function (k, rule, take) {
      var a = answer(k), t1 = Math.max(a.dur, rule.dur), g = gauge(k), g0 = t1 + 0.25, g1 = g0 + g.dur;
      return at([[0, a], [0, rule]].concat(take.map(function (x) { return [t1, x]; }), [[g0, g], [g1 - 0.2, lines(k)], [g1, mark(k)]]));
    };

    /* ---- 9.1: the turns against the median, the longest; its link, pass 1's answer along it ---- */
    var turns = (function () {
      var labels = A.par.apply(null, range(D.n_turns).map(function (i) { return keyed("tn-c" + i); }));
      var bars = A.stagger(range(D.n_turns), function (i) { return grows(i, 0.8); }, 0.25);
      var b1 = labels.dur + bars.dur, med = A.seq(shown("tn-med"), A.draw(q("tn-med"), { dur: 0.5 })), m0 = b1 - 0.5, m1 = m0 + med.dur;
      return at([[0, keyed("tn-cap")], [0, labels], [labels.dur, bars], [m0, med], [m1, A.seq(keyed("tn-mk"), keyed("tn-mv"))],
                 [m1, decides("tn-hl", q("tn-v1"))]].concat(routes("ld", m1), [[m1 + 0.71, rolls("ld")]]));
    })();

    /* ---- 9.2: the branches; the votes; the tie's rule and the sums; each side's best; the higher ---- */
    var votes = function (g) {
      var up = A.par.apply(null, D.groups[g].map(function (p) { return lift(q("vt-" + p)); })), c = counted(q("jv-" + g), 0.6);
      return { track: A.seq(up, c, keyed("jvk-" + g)), counted: up.dur + c.dur };
    };
    var sums = function (p, t0) {       /* each kept nugget score flies from under its strip onto its branch, 0.5 s after the one before */
      var s = q("sm-" + p), parts = s.getAttribute("data-parts").split(",").map(Number), acc = 0;
      return parts.map(function (v, j) {
        var f = q("fly-" + p + "-" + j), from = acc; acc += v;
        var o = xy(f, "data-from"), low = [o[0], o[1] + 10], under = [0, o[1] + 10];
        return [t0 + 0.5 * j, A.seq(A.par(A.reveal(f, { dur: 0.15 }), A.move(f, { from: o, to: low, dur: 0.2 })),
                        A.move(f, { from: low, to: under, dur: 0.55 }), A.move(f, { from: under, to: [0, 0], dur: 0.35 }),
                        A.par(A.hide(f, { dur: 0.15 }), j ? A.wait(0.01) : A.reveal(s, { dur: 0.15 }), A.recount(s, { from: from, to: acc, dec: 3, dur: 0.35 })))];
      });
    };
    var tally = (function () {
      var V = GRP.map(votes), t = 0.71, tie = t + V[0].counted;
      var parts = routes("sb", 0).concat(routes("il", 0), [[t, V[0].track], [t, V[1].track], [t, ruleLines("ia", 0, 1)], [tie, ruleLines("ia", 1, 2)]]);
      PASSES.forEach(function (p) { parts = parts.concat(sums(p, tie)); });
      var s1 = Math.max.apply(null, parts.filter(function (p) { return p[1]; }).map(end));
      GRP.forEach(function (g) { parts.push([s1, A.seq(lift(q("jb-" + g)), keyed("jbk-" + g))]); });
      parts.push([s1 + 0.8 - 0.2, decides("jb-hl", q("jb-" + D.win))]);       /* the higher, as the bests land */
      return at(parts);
    })();

    var LOOK_IA = blk(PASSES).concat(["row-ia", "mid-sb", "mid-il"]), WON = blk(D.groups[D.win]).concat(["row-ia", "mid-" + D.win, "row-pr"]);
    var STEPS = [
      { look: blk([1]).concat(["row-ld", "row-pr"]),                                                                 /* 9.1 longest deliberation */
        first: [L("pass 1's turns against the median; the longest; its link, pass 1's answer along it", turns)],
        then: [L("Starkiller Base with the rule's two lines; the line it takes; 0; its lines as sent; its mark",
                 cardOn("ld", ruleLines("ld", 0, D.panel.ld), [picks("ld")]))] },
      { look: LOOK_IA, clear: EXPLAIN_LD,                                                                            /* 9.2 independent agreement */
        first: [L("the branches; the votes and their rule; the tie's rule and the sums; each side's best; the higher", tally)],
        then: [[L("the other answer, set aside", A.focus(P, { from: ix(LOOK_IA), to: ix(WON), dim: 0.3, dur: 0.6 })),
                L("Ilum's link; its answers along it, into the card", at(routes("ia", 0).concat([[0.71, rolls("ia")]])))],
               L("Ilum with the rule's three lines; the line it takes, two passes on their own; 100; its lines as sent; its mark",
                 cardOn("ia", ruleLines("ia", 2, D.panel.ia), [picks("ia"), decides("jv-hl", q("jv-" + D.win))]))] }
    ];
    var steps = STEPS.map(function (st, s) {
      var prev = s ? STEPS[s - 1].look : null;
      return { enter: A.groups({ name: "9." + (s + 1), layers: [
        [L("look", A.focus(P, { from: prev ? ix(prev) : null, to: ix(st.look), dim: 0.3, dur: 0.6 })),
         st.clear ? L("the run before's explanation, cleared", A.hide(st.clear, { dur: 0.35 })) : null].concat(st.first).filter(Boolean),
        { name: "act", layers: st.then }] }) };
    });

    return { entry: entry, steps: steps, zones: m.zones };
  });
})();
