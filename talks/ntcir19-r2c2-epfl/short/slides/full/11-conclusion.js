/* Slide 11: its motions, from the animation bank (anim/anim.js), the steps' helpers and A.groups (anim/steps.js).
   The tree of groups, the eleven steps and the grid are in the .py's header. Slide 5's picture (the passages DB, the
   maquette, the four pass boxes, filled as 5.6 leaves them) enters as slide 5's does (its tree restated: a slide's
   motions cannot be imported from another's); each step adds its part on a temporary paper overlay or in the right
   column the camera opens, and puts away what the step before added as it starts. */
Deck.slide("11-conclusion", function (A, q) {
  var F = JSON.parse(q("frames").getAttribute("data-frames")), RK = JSON.parse(q("frames").getAttribute("data-ranks"));
  var key = function (n) { return A.type(typeof n === "string" ? q(n) : n, { quick: true }); };
  var fl = function (n) { return A.flow(q(n), { dur: 0.45 }); };
  var tools = ["search", "read", "extract", "record", "submit"];
  var each = function (f) { return tools.map(f); };
  var L = function (name, tr) { return { name: name, track: tr }; };
  var G = function (name, layers) { return { name: name, layers: layers.filter(Boolean) }; };
  var shown = function (n) { return A.reveal(typeof n === "string" ? q(n) : n, { dur: 0.01 }); };
  var all = function (root, sel) { return [].slice.call(root.querySelectorAll(sel)); };
  var PASSES = [1, 2, 3, 4];
  var INK = "#302E2E";
  var xyk = function (g, k) { return g.getAttribute(k).split(",").map(Number); };
  var placed = function (g, x, y, k) { g.setAttribute("transform", "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ") scale(" + k.toFixed(5) + ")"); };

  /* ---- what the steps add: set aside at the overview; at each step, what it shows as it starts ---- */
  var JOURNEY = ["any", "est-say", "lee", "concl", "nug-at", "gl-at", "gl-x", "ev", "lk", "ck", "g1", "a1", "estw", "est", "est-in", "pbg", "pbw",
                 "md", "md-big", "md-small", "ustrip", "mw", "u-say", "cap-u2", "unans", "fly8",
                 "th",                                                                 /* 11.10's */
                 "qa-head", "qa-me", "qq", "aq", "qa-note", "ball",                    /* 11.11's */
                 "g2", "g3", "g4", "gtb1", "gtb2", "a2", "a3", "a4", "ab"];   /* slide 5's other readings and answers: never */
  function state(shownNames) {
    var O = {};                                     /* "name" shown; "name@0.3" shown at that opacity */
    shownNames.forEach(function (k) { var p = k.split("@"); O[p[0]] = p[1] == null ? "" : p[1]; });
    return { dur: 0, set: function (t) {
      if (t < 0) return;
      JOURNEY.forEach(function (k) { var e = q(k); e.style.opacity = k in O ? O[k] : "0"; });
    } };
  }

  /* ---- the overview's entry: slide 5's picture ---- */
  function block(p) {                               /* a pass box along its flow, as 5.6 leaves it */
    var ln = "lane" + p;
    return G("pass " + p, [
      L("its box", A.pop(q(ln + "-frame"), { dur: 0.4 })),
      [L("its label", key(ln + "-label")), L("its question", A.enter(q(ln + "-q")))],
      L("in", A.flow(q(ln + "-p1"), { dur: 0.35 })),
      L("its calls", A.seq(A.pop(q(ln + "-chips"), { dur: 0.35 }), A.par(key(ln + "-calls"), key(ln + "-ret")))),
      L("out", A.flow(q(ln + "-p2"), { dur: 0.35 })),
      L("its answer", A.pace(A.enter(q(ln + "-a")), 1.5)),
      L("right or wrong", A.write(q("lv" + p)))]);
  }
  var tree = { name: "slide", layers: [
    L("aside", A.hide(JOURNEY.map(q), { dur: 0 })),
    [L("header", key("head")),
     G("maquette", [                                /* slide 5's, restated */
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
     G("pass boxes", [PASSES.map(block)])]] };

  /* ---- the parts A.focus dims and lights (slide 5's; none inside another; what the steps add is not among them) ---- */
  var NAMES = ["head", "q-card", "l-q", "qtype", "model", "tr"]
    .concat(each(function (k) { return "t-" + k; }), each(function (k) { return "call-" + k; }), each(function (k) { return "res-" + k; }))
    .concat(["l-type", "stub-search", "stub-read", "stub-extract", "bus", "bus5", "bus-dots", "l-every", "orch", "check", "gate",
             "rec", "l-ck", "l-rg", "l-rc", "l-cr", "l-sg", "l-gs", "l-ans", "ans", "db-blk5", "lane1", "lane2", "lane3", "lane4", "lvs"]);
  var P = NAMES.map(q);
  var ix = function (names) { return names.map(function (k) { var i = NAMES.indexOf(k); if (i < 0) throw new Error("slide 11: no part " + k); return i; }); };

  /* ---- 11.1: a rank counts in its ordinals, from where it starts (1st, or the rank of the submitted run an
     additional run re-reads), then takes its colour (green strong or better, red weak) ---- */
  var ord = function (k) { var t = k % 100 >= 10 && k % 100 <= 20 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" })[k % 10] || "th"; return k + t; };
  function rank(nm) {
    var el = q(nm), r = RK[nm], to = r[0], from = r[1], col = r[2], E = A.ease.out;
    var n = Math.abs(to - from), dur = Math.min(1.2, 0.35 + 0.08 * Math.max(n, to));
    var count = A.track(dur, function (u) {
      el.textContent = u <= 0 ? "" : ord(Math.round(from + (to - from) * (u >= 1 ? 1 : E(u))));
      el.setAttribute("fill", INK);
    });
    var tint = col ? A.track(0.4, function (u) { el.setAttribute("fill", u > 0 ? col : INK); }) : null;
    return A.seq(count, tint);
  }
  function row(k) {                                 /* its words keyed; its runs and measures keyed, ranks counting */
    var right = q("cr-" + k + "-r"), texts = all(right, "text"), R = texts.filter(function (t) { return RK[t.getAttribute("data-a")]; });
    var words = texts.filter(function (t) { return R.indexOf(t) < 0; });
    return G(k, [L("its words", key("cr-" + k + "-w")),
                 L("what it ranks", A.type(words, { quick: true })),
                 L("its ranks", A.par.apply(null, R.map(function (t) { return rank(t.getAttribute("data-a")); })))]);
  }
  var seps = all(q("concl"), '[data-a^="cr-sep"]');

  /* ---- 11.2: the case ---- */
  function grow(nm, dur) {                          /* a card grows out of the element that makes it (data-from) to its place */
    var g = q(nm), a = xyk(g, "data-from"), b = xyk(g, "data-at"), E = A.ease.io;
    return A.track(dur || 0.8, function (u) {
      var e = E(u); placed(g, a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] * Math.pow(b[2] / a[2], e));
      g.style.opacity = u <= 0 ? "0" : u >= 1 ? "" : Math.min(1, 4 * e).toFixed(3);
    });
  }
  var gateSays = function (g) { return A.seq(A.reveal(q(g), { dur: 0.3 }), A.count(q(g + "-reading"), { dur: 0.7 })); };
  /* the checklist with its new check: drawn whole, the part under the new check (data-low) shifted up by its height and
     the card shorter, until 11.3 makes the room */
  var GL = q("gl"), GX = q("gl-x"), ADD = +GX.getAttribute("data-add"), CARD = GL.querySelector("rect"), H0 = +CARD.getAttribute("height");
  var LOW = all(GL, "[data-low]");
  var room = function (dur) {
    return A.track(dur, function (u) {
      var d = (1 - (u >= 1 ? 1 : A.ease.io(u))) * ADD;
      LOW.forEach(function (e) { e.style.translate = d > 0.001 ? "0px " + (-d).toFixed(2) + "px" : ""; });
      CARD.setAttribute("height", (H0 - d).toFixed(2));
    });
  };
  var shut = room(0.01);                            /* at 0: no room yet */
  var closed = { dur: 0, set: function (t) { if (t >= 0) shut.set(0); } };

  /* ---- 11.3: the new check ---- */
  var xSlot = GX.querySelector("rect:not([data-hl])"), xHl = q("gl-x-hl"), xVal = q("gl-v-ent");
  var xWords = all(GX, "text").filter(function (t) { return !xVal.contains(t); });
  var a1hl = all(q("a1"), '[data-a^="a1-hl"]');

  /* ---- 11.4-11.5: the DB's overlay ---- */
  var ins = all(q("est"), '[data-a^="est-in"]');
  var EA = q("est-at");
  function estMove(fa, ta, dur) {                   /* the estimator from one place to another (x, y, scale) */
    var a = xyk(EA, fa), b = xyk(EA, ta);
    return A.track(dur, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u);
      placed(EA, a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] * Math.pow(b[2] / a[2], e));
    });
  }
  var STEP = function (el) { return A.seq(shown(el), key(el)); };
  /* ---- 11.6: items lost from pass to pass (a demonstration): every passage a pass reads is withheld from the next,
     so a later pass's list lacks the items whose passages are gone ---- */
  var NI = 6, TY = function (j, r) { return q.root.querySelector('[data-a="lt-y' + j + "-" + r + '"]'); };
  var CYc = function (j) { return q("lc-y" + j); }, CT = function (j) { return q("lc-t" + j); };
  var found = function (p) { var o = []; for (var j = 0; j < NI; j++) if (TY(j, p - 1)) o.push(j); return o; };
  var ghostAll = function (dur, lit) {                 /* every film's card: no yellow, its name faint (lit: the cards
                                                          the pass before found, fading from their yellow) */
    return A.track(dur, function (u) { var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u);
      for (var j = 0; j < NI; j++) { var on = lit && lit.indexOf(j) >= 0;
        if (on) CYc(j).style.opacity = (1 - 0.75 * e).toFixed(3);      /* lost: partly transparent yellow, as withheld */
        CT(j).style.opacity = on || !lit ? (1 - 0.65 * e).toFixed(3) : "0.350"; } });
  };
  var lightCard = function (j) {                       /* found: its card lit, its name in ink */
    return A.par(A.highlight(CYc(j), { dur: 0.3 }), A.track(0.3, function (u) { CT(j).style.opacity = u >= 1 ? "" : (0.35 + 0.65 * u).toFixed(3); }));
  };
  var withheldTiles = function (p) {                   /* pass p's tiles, withheld from the passes after it */
    var T = found(p).map(function (j) { return TY(j, p - 1); });
    return A.track(0.6, function (u) { var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u);
      T.forEach(function (r) { r.style.opacity = e <= 0 ? "" : (1 - 0.62 * e).toFixed(3); }); });
  };
  function passRun(p) {                                /* the pass reads its tiles; its films' cards light; its count */
    var F = found(p), d = 0.28, n = F.length * d + 0.3;
    var a = q("lr" + (p - 1) + "-a"), v = q.root.querySelector('[data-a="lr' + (p - 1) + '-v"]');
    return A.seq(A.par(A.stagger(F, function (j) { return A.par(A.highlight(TY(j, p - 1), { dur: 0.3 }), lightCard(j)); }, d),
                       A.count(a, { dur: n })), v ? A.write(v, { dur: 0.4 }) : null);
  }

  /* ---- 11.5-11.6: one bar. The four passes grow back to back (each segment as long as its calls), a paper gap
     between two; the gaps go: one pass. 11.6 keeps the same bar: the model, thicker (bigger?), thinner (smaller?) ---- */
  var MB = q("pb"), MCY = +MB.getAttribute("data-cy"), MH = +MB.getAttribute("data-h"), MW = +MB.getAttribute("data-w");
  var ENDS = MB.getAttribute("data-ends").split(",").map(Number);
  var SEPS = [].slice.call(q("pb-seps").querySelectorAll("rect")), PL = [].slice.call(q("pb-seps").querySelectorAll("text"));
  function passGrow(p) {                            /* pass p's segment grows from the bar's end so far; its gap pops */
    var a = p ? ENDS[p - 1] : 0, b = ENDS[p];
    return A.seq(A.track(0.6, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.out(u);
      MB.setAttribute("width", (MW * (a + (b - a) * e)).toFixed(2)); MB.style.opacity = a + (b - a) * e > 0 ? "" : "0";
    }), A.par(p < ENDS.length - 1 ? A.reveal(SEPS[p], { dur: 0.15 }) : null, A.reveal(PL[p], { dur: 0.25 })));
  }
  var ONE = q("pb-one"), LR = [0, 1, 2].map(function (k) { return q("lr" + k); }), LR1 = q("lr-one");
  function merge(dur, named) {                       /* in turn, never two words on one place: the passes' names fade,
                                                        then the borders, then "one pass" fades in */
    var ph = function (u, a, b) { var v = (u - a) / (b - a); return v <= 0 ? 0 : v >= 1 ? 1 : A.ease.io(v); };
    return A.track(dur, function (u) {
      var l = ph(u, 0, 0.45), g = ph(u, 0.3, 0.75), o = ph(u, 0.6, 1);
      PL.forEach(function (r) { r.style.opacity = l <= 0 ? "" : (1 - l).toFixed(3); });
      SEPS.forEach(function (r) { r.style.opacity = g <= 0 ? "" : (1 - g).toFixed(3); });
      if (named) ONE.style.opacity = o.toFixed(3);
      if (named) {                                   /* the three answers glide together and give way to one */
        var m = ph(u, 0.15, 0.85), f = ph(u, 0.4, 0.8), w1 = ph(u, 0.6, 1);
        LR.forEach(function (r) { var dx = +r.getAttribute("data-dx");
          r.style.translate = m <= 0 ? "" : (dx * m).toFixed(2) + "px 0px"; r.style.opacity = f <= 0 ? "" : (1 - f).toFixed(3); });
        LR1.style.opacity = w1.toFixed(3);
      }
    });
  }
  var thick = function (a, b, dur) {
    return A.track(dur, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u), hh = a + (b - a) * e;
      MB.setAttribute("height", hh.toFixed(2)); MB.setAttribute("y", (MCY - hh / 2).toFixed(2));
    });
  };
  var swap = function (out, inn) { return A.par(A.hide(q(out), { dur: 0.25 }), A.reveal(q(inn), { dur: 0.25 })); };
  var modelLoop = A.seq(A.wait(0.8),
    A.par(thick(MH, +MB.getAttribute("data-big"), 0.9), swap("md-v", "md-big")), A.wait(1.4),
    A.par(thick(+MB.getAttribute("data-big"), +MB.getAttribute("data-small"), 1.1), swap("md-big", "md-small")), A.wait(1.4),
    A.par(thick(+MB.getAttribute("data-small"), MH, 0.9), swap("md-small", "md-v")), A.wait(1.6));

  /* ---- 11.8: the questions without an answer fly up from the question card to their 8 places on the strip ---- */
  var FLY = [].slice.call(q("fly8").children);
  var flyUp = A.track(1.6, function (u) {
    FLY.forEach(function (f, i) {
      var fr = f.getAttribute("data-from").split(",").map(Number), m = /M([\d.]+),([\d.]+)V([\d.]+)/.exec(f.getAttribute("d"));
      var x0 = +m[1], b0 = +m[2], t0 = +m[3], cy0 = (b0 + t0) / 2;
      var v = Math.max(0, Math.min(1, (u * 1.6 - i * 0.06) / (1.6 - 7 * 0.06))), e = A.ease.io(v);
      f.style.transformBox = "view-box"; f.style.transformOrigin = x0 + "px " + cy0 + "px";
      f.style.translate = v >= 1 ? "" : ((fr[0] - x0) * (1 - e)).toFixed(2) + "px " + ((fr[1] - cy0) * (1 - e)).toFixed(2) + "px";
      f.style.scale = v >= 1 ? "" : (0.15 + 0.85 * e).toFixed(3);
      f.style.opacity = u <= 0 ? "0" : "";
    });
  });
  var flyGone = A.track(1.2, function (u) {         /* the copies give way to the bars rising under them */
    FLY.forEach(function (f) { f.style.opacity = u <= 0 ? "" : (1 - A.ease.io(u)).toFixed(3); });
  });

  /* ---- 11.2: the gate's rules evaluated all at once: every line keyed together, every value, every mark ---- */
  function checkAll(N) {
    var nm = N.getAttribute("data-a"), part = function (k) { return N.querySelector('[data-a="' + nm + "-" + k + '"]'); };
    var T = function (g) { return g ? [].slice.call(g.querySelectorAll("text")) : []; };
    var each = function (L, f) { return A.par.apply(null, L.map(f)); };
    var slots = [].slice.call(N.querySelectorAll("[data-check]"));
    var marks = [].slice.call(N.querySelectorAll('[data-verdict]')).filter(function (m) { return m.getAttribute("data-a") !== nm + "-m-result" && !m.closest('[data-a="' + nm + '-x"]'); });
    var hook = [].slice.call(part("back").querySelectorAll('path[fill="none"]'));
    var lines = T(part("words")).concat(T(part("back")), T(part("fmt")));
    var value = function (sl) {
      var t = sl.querySelector("text"), d = sl.querySelector("path");
      return A.seq(d ? A.draw(d, { dur: 0.3 }) : null, t ? (t.getAttribute("data-anim") === "count" ? A.count(t, { dur: 0.6 }) : A.type(t, { quick: true })) : null);
    };
    return A.seq(A.par(each(lines, function (t) { return A.type(t, { quick: true }); }), hook.length ? A.draw(hook, { dur: 0.4 }) : null),
                 each(slots, value), each(marks, function (m) { return A.write(m, { dur: 0.4 }); }),
                 part("m-result") ? A.write(part("m-result"), { dur: 0.45 }) : null);
  }

  /* ---- 11.7-11.8: slide 8's strip (its MORPH_JS handed over as data), this slide's three runs ---- */
  var SD = JSON.parse(q("strip-data").getAttribute("data-st")), UD = JSON.parse(q("u-data").getAttribute("data-u"));
  var SHOW = function (el) { return A.reveal(el, { dur: 0.01 }); };
  var KEY = function (el) { var T = el.tagName.toLowerCase() === "text" ? [el] : [].slice.call(el.querySelectorAll("text")); return T.length ? A.type(T, { quick: true }) : null; };
  var stripMorph = new Function("A", "q", "SHOW", "KEY", JSON.parse(q("strip-js").getAttribute("data-js")) + "\nreturn stripMorph;")(A, q, SHOW, KEY);
  var NUM = /\d+(?:\.\d+)?/g;
  function tween(a, b, e) {                         /* a text into another: its numbers recount where the words agree */
    if (a.replace(NUM, "#") !== b.replace(NUM, "#")) return e < 0.5 ? a : b;
    var na = a.match(NUM) || [], k = 0;
    return b.replace(NUM, function (m) { var a0 = na[k++]; if (a0 === m) return m; var d = (m.split(".")[1] || "").length; return (+a0 + (+m - +a0) * e).toFixed(d); });
  }
  function change(s0, s1, dur) {                    /* the bars, the green mean, the five slots, together */
    var bars = stripMorph("st", SD.base, SD.states[s0], SD.states[s1], dur);
    var mr = { line: q("mr-line"), v: q("mr-v"), a: SD.means[s0].mr, b: SD.means[s1].mr };
    var slots = ["acc", "ru", "ro", "hmr"].map(function (f) { return { el: q("slot-" + f), a: SD.slots[s0][f], b: SD.slots[s1][f] }; })
      .concat([{ el: q("slot-ah"), a: UD.ah[s0], b: UD.ah[s1] }]);
    return A.par(bars, A.track(dur, function (u) {
      var e = A.ease.io(u);
      var y = mr.a[0] + (mr.b[0] - mr.a[0]) * e, ty = mr.a[1] + (mr.b[1] - mr.a[1]) * e;
      mr.line.setAttribute("d", "M" + SD.x0 + "," + y.toFixed(2) + "H" + SD.x1);
      mr.v.setAttribute("y", ty.toFixed(2)); mr.v.textContent = tween(mr.a[2], mr.b[2], e);
      slots.forEach(function (o) { o.el.textContent = tween(o.a, o.b, e); });
    }));
  }
  var EXTRA8 = []; for (var i8 = 64; i8 < 72; i8++) EXTRA8.push(q("st-q" + i8), q("st-q" + i8 + "-v"));
  var mwAt = SD.means.u2.mw;                         /* the red mean, where it stands with the red bars (none before) */
  q("mw-line").setAttribute("d", "M" + SD.x0 + "," + mwAt[0] + "H" + SD.x1); q("mw-v").setAttribute("y", mwAt[1]); q("mw-v").textContent = mwAt[2];
  var mwIn = A.seq(SHOW(q("mw")), A.draw(q("mw-line"), { dur: 0.5 }), key("mw-v"));
  var SL = [q("slot-hmr"), q("slot-ah")];
  var redden = function (to) {                       /* HMR and accHMR coloured red as they collapse, ink as they return */
    return A.track(1.0, function (u) { var on = to ? u >= 0.5 : u < 0.5; SL.forEach(function (t) { t.setAttribute("fill", on && u > 0 ? "#B5473C" : "#302E2E"); }); });
  };
  var fx = function (i) { return A.seq(SHOW(q("fx" + i)), A.type(all(q("fx" + i), "text"), { quick: true })); };
  var cnt = q.root.querySelector('[data-a="st-count"]');

  /* ---- 11.11: questions? The speaker is the RAG system. The pipeline's own question box takes the audience's
     question (slide 4.1's device: its ruled line lifted and its "Q" handed over while it fits the question); the
     ball rolls the drawn links into the model, now "Me", out through Submit and the gate to the exit; the answer,
     generated: "Good question!", its gauge hunting, its number "?" ---- */
  var qc = q("q-card"), qcR = qc.querySelector("rect"), qcQ = [].filter.call(qc.children, function (c) { return c.tagName === "text"; })[0];
  var QH0 = +qcR.getAttribute("height"), QH1 = +q("qq").querySelector("rect").getAttribute("height");
  var boxTo = function (a, b) { return A.track(0.5, function (u) { qcR.setAttribute("height", (a + (b - a) * A.ease.io(u)).toFixed(2)); }); };
  var qFill = A.par(A.reverse(A.draw(q("q-card-line0"), { dur: 0.3 })), A.hide(qcQ, { dur: 0.3 }), boxTo(QH0, QH1));
  var ball = q("ball");
  var go = function () { return A.seq(A.reveal(ball, { dur: 0.01 }), A.travel(ball, { along: [].slice.call(arguments).map(q) })); };
  var leave = function (from, to) { return A.par(go.apply(null, [].slice.call(arguments, 2)), A.become(ball, { from: from, to: to, dur: 0.4 })); };
  var HEAD = q("head");
  var headAway = A.track(0.8, function (u) {         /* the slide's heading (un-keyed at 11.10), out of the frame: gone */
    var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u); HEAD.style.opacity = (0.3 * (1 - e)).toFixed(4); });
  var AQV = q("aq-value"), AQB = q("aq-bar");
  var rock = A.track(1.0, function (u) {             /* the "?" rocks a little, as a question's "?" does, back at rest */
    AQV.style.transformBox = "fill-box"; AQV.style.transformOrigin = "50% 80%";
    AQV.style.rotate = u <= 0 || u >= 1 ? "" : (9 * Math.sin(u * Math.PI * 3) * (1 - u)).toFixed(2) + "deg";
  });
  /* the question box and the ruled exit stay dimmed by the look: the box lights as it takes the question (once its
     ruled line is gone), the ruled exit fades as the answer takes its place */
  var QA_LOOK = NAMES.filter(function (k) { return ["head", "db-blk5", "lane1", "lane2", "lane3", "lane4", "lvs", "q-card", "ans"].indexOf(k) < 0; });
  var dimTo = function (el, a, b, dur) { return A.track(dur, function (u) {
    var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u), v = a + (b - a) * e; el.style.opacity = v >= 0.9999 ? "" : v.toFixed(4); }); };

  /* ---- 11.10: the take-home messages, each a message keyed, its source, its chart, its numbers ---- */
  /* message 1, the 25 official AC runs in three beats: the dots drop onto the accuracy axis (a dot plot), the band
     "accuracy ≥ 0.85" swept on it, its count; the same runs rise onto the HMR axis, its band swept upward, its count;
     then each run's two dots slide together into its one place in the scatter (accuracy across, HMR up), and the
     crossing of the two bands is lit and outlined: 4 runs, one team. Every dot is drawn at its scatter place; data-s
     is its offset on a dot plot, data-d how far above it it drops from. */
  var AXS = [].slice.call(q("th-axs").children), AYS = [].slice.call(q("th-ays").children);
  var off = function (c) { return c.getAttribute("data-s").split(",").map(Number); };
  var put = function (c, dx, dy) { c.style.translate = Math.abs(dx) + Math.abs(dy) < 0.005 ? "" : dx.toFixed(2) + "px " + dy.toFixed(2) + "px"; };
  var thDrop = A.track(1.6, function (u) {           /* staggered by accuracy (the dots are drawn in that order) */
    AXS.forEach(function (c, i) {
      var v = Math.max(0, Math.min(1, (u * 1.6 - i * 0.03) / (1.6 - 24 * 0.03))), e = A.ease.out(v), s = off(c), d = +c.getAttribute("data-d");
      put(c, s[0], s[1] + d * (1 - e)); c.style.opacity = u <= 0 ? "0" : Math.min(1, v * 4).toFixed(3);
    });
  });
  var thRise = A.track(1.6, function (u) {           /* from the axis's foot up to its height, staggered */
    AYS.forEach(function (c, i) {
      var v = Math.max(0, Math.min(1, (u * 1.6 - i * 0.03) / (1.6 - 24 * 0.03))), e = A.ease.out(v), s = off(c);
      var foot = +q("th-axes").getBBox().y + q("th-axes").getBBox().height - (+c.getAttribute("cy") + s[1]);
      put(c, s[0], s[1] + foot * (1 - e)); c.style.opacity = u <= 0 ? "0" : Math.min(1, v * 4).toFixed(3);
    });
  });
  var thJoin = A.track(1.4, function (u) {           /* the two dots of a run meet at its place; one disc stays */
    var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u);
    AXS.forEach(function (c) { var s = off(c); put(c, s[0] * (1 - e), s[1] * (1 - e)); });
    AYS.forEach(function (c) { var s = off(c); put(c, s[0] * (1 - e), s[1] * (1 - e)); c.style.opacity = u >= 1 ? "0" : ""; });
  });
  var BY = q("th-by"), BYH = +BY.getAttribute("height"), BYY = +BY.getAttribute("y");
  var bandUp = A.track(0.5, function (u) {           /* the marker swept up the HMR axis, from 0.70 to 1 */
    var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.io(u), hh = BYH * e;
    BY.setAttribute("height", hh.toFixed(2)); BY.setAttribute("y", (BYY + BYH - hh).toFixed(2)); BY.style.opacity = e <= 0 ? "0" : "";
  });
  var countLine = function (k) { return A.par(A.count(q("th-c" + k + "-n"), { dur: 0.8 }), key("th-c" + k + "-w")); };
  function thChart() {
    return G("message 1", [
      L("its words", A.type(q("th-m0"), { quick: true })),
      L("its source", key("th-s0")),
      [L("the axes", A.draw(q("th-axes"), { dur: 0.6 })), L("their numbers", key("th-num")),
       L("their words", A.type([q("th-yw"), q("th-xw")], { quick: true }))],
      G("accuracy", [L("the runs drop onto it", thDrop),
                     [L("0.85 and up", A.highlight(q("th-bx"), { dur: 0.5 })), L("0.85", key("th-tx"))],
                     L("10 of 25 runs", countLine(0))]),
      G("HMR", [L("the runs rise onto it", thRise),
                [L("0.70 and up", bandUp), L("0.70", key("th-ty"))],
                L("8 of 25 runs", countLine(1))]),
      G("both", [L("each run's two dots meet", thJoin),
                 [L("the crossing, lit", A.highlight(q("th-reg-hl"), { dur: 0.5 })), L("outlined", A.draw(q("th-reg"), { dur: 0.6 }))],
                 L("4 of 25 runs, one team", countLine(2))])]);
  }
  /* message 2, the relevant passages found so far, pass by pass: a bar shows the one before (its lighter part), then
     this pass's new passages grow on top while the value above counts on from the pass before; "pass k" and "+ new"
     keyed under it */
  function thBar(j) {
    var nw = q("th-b" + j + "-new"), v = q("th-b" + j + "-v"), old = q.root.querySelector('[data-a="th-b' + j + '-old"]');
    var y1 = +nw.getAttribute("y"), h1 = +nw.getAttribute("height"), y0 = +nw.getAttribute("data-base"), vy = +v.getAttribute("y");
    var v1 = parseFloat(v.textContent || v._full), prev = j ? parseFloat(q("th-b" + (j - 1) + "-v")._full || q("th-b" + (j - 1) + "-v").textContent) : 0;
    v._full = v._full || v.textContent;
    var grow = A.track(0.4 + 0.12 * (v1 - prev), function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : A.ease.out(u), hh = h1 * e;
      nw.setAttribute("height", hh.toFixed(2)); nw.setAttribute("y", (y0 - hh).toFixed(2)); nw.style.opacity = u <= 0 ? "0" : "";
      v.setAttribute("y", (vy + (y0 - y1) * (1 - e)).toFixed(2));
      v.textContent = u <= 0 ? "" : u >= 1 ? v._full : (Math.round((prev + (v1 - prev) * e) * 10) / 10).toFixed(1);
    });
    return G("pass " + (j + 1), [
      [old ? L("what the passes before found", A.reveal(old, { dur: 0.3 })) : null, L("pass k", key("th-b" + j + "-p"))],
      L("its new passages, the count on", grow),
      L("+ new", key("th-b" + j + "-n"))]);
  }
  function thBars() {
    return G("message 2", [
      L("its words", A.type(q("th-m1"), { quick: true })),
      L("its source", key("th-s1")),
      [L("the baseline", A.draw(q("th-base"), { dur: 0.4 })), L("pass, new", key("th-bw"))],
      thBar(0), thBar(1), thBar(2), thBar(3),
      L("40 of the 42 wins", A.par(A.count(q("th-d0-n"), { dur: 0.8 }), key("th-d0-w")))]);
  }

  var LOOK_CASE = ["check", "gate", "l-ans", "ans", "l-ck", "l-rg", "rec"];
  var CASE_SHOWN = ["nug-at", "gl-at", "ev", "ck", "g1", "a1"];
  var STEPS = [
    { look: [], frame: "home", shown: [],                                              /* 11.1 the conclusion */
      act: function () { return [
        L("its overlay", A.seq(shown("concl"), A.pop(q("cpn"), { dur: 0.45 }), seps.length ? A.draw(seps, { dur: 0.35 }) : null)),
        ["pr", "ac", "ad"].map(row)]; } },
    { look: LOOK_CASE, frame: "case", shown: ["concl"], away: ["concl"],               /* 11.2 the case: Han Solo, pass 1 */
      act: function () { return [
        [L("the check's counts", A.seq(shown("ck"), A.par(key("ck-ok"), key("ck-no")), A.recount(q("ck-ok"), { from: 0, to: 1, dur: 0.4 }))),
         G("the nugget, out of the check", [L("shown", shown("nug-at")), [L("grows out", grow("nug-at")), L("enters", A.pace(A.enter(q("nug")), 2.5))]]),
         L("the gate's reading", gateSays("g1")),
         G("its rules, out of the gate", [L("shown", A.seq(closed, shown("gl-at"))), L("out", grow("gl-at", 0.6)),
                                         L("evaluated, every line at once", checkAll(q("gl")))]),
         L("the answer, out", A.seq(A.pulse(q("l-ans"), { dur: 0.5 }), shown("a1"), A.pace(A.enter(q("a1")), 2)))],
        [L("the gate passes", A.write(q("g1-verdict"))),
         L("our evaluation: wrong, the gold", A.seq(shown("ev"), A.write(q("ev-x")), key("ev-w")))]]; } },
    { look: LOOK_CASE, frame: "case", shown: CASE_SHOWN, same: true,                  /* 11.3 the answer check */
      act: function () { return [
        L("the trigger: the wrong answer", A.highlight(a1hl, { dur: 0.5 })),
        L("a link to the gate's rules", A.seq(shown("lk"), A.draw(q("lk-line"), { dur: 0.45 }), A.flow(q("lk-arrow"), { dur: 0.3 }))),
        L("room for a new check", room(0.6)),
        G("the new check", [L("shown", shown("gl-x")),
                            [L("its slot", A.pop(xSlot, { dur: 0.35 })), L("its words", A.type(xWords.slice(0, 1), { quick: true }))],
                            L("the rule fires", A.highlight(xHl, { dur: 0.5 })),
                            L("Q + nuggets ⊨ A", A.type(xWords.slice(1), { quick: true })),
                            L("its value", A.seq(A.draw(xVal.querySelector("path"), { dur: 0.3 }), key(xVal.querySelector("text"))))])]; } },
    { look: ["db-blk5", "lane1"], frame: "est", shown: CASE_SHOWN.concat(["lk", "gl-x"]),   /* 11.4 the estimator */
      away: CASE_SHOWN.concat(["lk"]), also: function () { return A.hide(q("db5-name"), { dur: 0.35 }); },   /* the DB, covered: its name too */
      act: function () { return [
        L("its overlay", A.seq(shown("estw"), A.pop(q("pnl"), { dur: 0.45 }))),
        L("pass 1's signals, up", A.seq(shown("est-in"), A.flow(q("est-in"), { dur: 0.45 }))),
        [L("lifted out of pass 1's record", A.seq(shown("est"), estMove("data-from", "data-at", 1.0))),
         L("the estimator", A.pace(A.enter(q("est-all")), 1.8))],
        L("chosen, then tested", A.seq(STEP(q("est-step0")), A.wait(0.2), STEP(q("est-step1")))),
        L("reads only what the pipeline already logs", A.seq(shown("est-say"), A.type(all(q("est-say"), "text"), { quick: true })))]; },
      loop: A.seq(A.wait(0.4), A.pulse(q("est-in"), { dur: 0.8 }), A.par.apply(null, ins.map(function (a) { return A.pulse(a, { dur: 1.1 }); })),
                  A.pulse(q("est-out"), { dur: 0.8 }), A.wait(1.4)) },
    { look: [], frame: "est", shown: ["estw", "est", "est-in", "est-say"], away: ["est-in", "est-say"],   /* 11.5 plug and play */
      act: function () { return [
        [L("unplugged: down, under any RAG", estMove("data-at", "data-to", 1.0)),
         L("any RAG", A.seq(shown("any"), key("any-h")))],
        [L("its AI", A.enter(q("any-ai"))), L("its answer", A.enter(q("any-a")))],
        L("question to answer", A.flow(q("any-a1"), { dur: 0.45 })),
        [L("what the agent does, into the estimator", A.flow(q("any-l1"), { dur: 0.5 })),
         L("its confidence, onto the answer", A.flow(q("any-l2"), { dur: 0.5 }))],
        L("plugs into any RAG", key("any-say"))]; },
      loop: A.seq(A.wait(0.5), A.pulse(q("any-a1"), { dur: 0.8 }), A.pulse(q("any-l1"), { dur: 0.7 }),
                  A.par.apply(null, ins.map(function (a) { return A.pulse(a, { dur: 0.9 }); })), A.pulse(q("est-out"), { dur: 0.6 }),
                  A.pulse(q("any-l2"), { dur: 0.7 }), A.gaugeTo(q("any-a-bar"), { from: 0.01, to: 0.72, dur: 0.9 }), A.wait(1.6),
                  A.gaugeTo(q("any-a-bar"), { from: 0.72, to: 0.01, dur: 0.6 }), A.wait(0.8)) },
    { look: [], frame: "strip", shown: ["estw", "est", "any"], away: ["est", "any"],   /* 11.6 items lost from pass to pass (a demonstration), and one pass */
      act: function () { return [
        [G("the question", [L("shown", A.seq(shown("lee"), shown("pbg"))), L("its card", A.enter(q("lq")))]),
         L("for demonstration purposes", A.type([q("lt-cap"), q("lt-demo")], { quick: true })),
         G("each film's passages, its card", [L("the DB's tiles", A.par.apply(null, [0, 1, 2, 3, 4, 5].map(function (j) { return A.enter(q("lt" + j)); }))),
                                              L("the films, not yet found", A.seq(A.par.apply(null, [0, 1, 2, 3, 4, 5].map(function (j) { return A.pop(q("lc" + j), { dur: 0.35 }); })), ghostAll(0.3)))])],
        [L("pass 1's segment", passGrow(0)), L("pass 1 reads one passage of each film: 6", passRun(1))],
        [L("pass 1's passages withheld", withheldTiles(1)), L("the cards cleared", ghostAll(0.4, found(1))), L("pass 2's segment", passGrow(1))],
        L("pass 2 finds 5: Episode I's only passage is gone", passRun(2)),
        [L("pass 2's passages withheld", withheldTiles(2)), L("the cards cleared", ghostAll(0.4, found(2))), L("pass 3's segment", passGrow(2))],
        L("pass 3 finds 3", passRun(3)),
        L("one pass, the same model, gathering every item", A.seq(shown("pbw"), key("pb-say")))]; },
      loop: A.seq(A.wait(1.0), merge(1.8, true), A.wait(2.0), A.reverse(merge(1.8, true)), A.wait(1.4)) },   /* split ↔ one, and back */
    { look: ["model"], frame: "home", shown: ["estw", "lee", "pbg", "pbw"], away: ["lee", "pbw"],   /* 11.7 the same bar: the model */
      act: function () { return [
        L("the borders go: one pass", merge(1.0, false)),
        L("the model, in every pass", A.seq(shown("md"), key("md-head"))),
        L("its name", key("md-name")),
        L("its size, on the bar's end", key("md-v")),
        L("the question", key("md-q"))]; },
      loop: modelLoop },
    { look: [], frame: "strip", shown: ["estw", "pbg", "md"], away: ["pbg"],              /* 11.8 a perfect model, at 100 */
      act: function () { return [
        L("the strip", A.seq(shown("ustrip"), A.type(all(q("ustrip"), '[data-a="strip-h"], [data-a="strip-m"]'), { quick: true }))),
        [L("a model right on every question", (function () {          /* the 8 added bars stay out until 11.8 */
           var en = A.enter(q("st"));
           return A.par(en, A.track(en.dur, function () { EXTRA8.forEach(function (e) { e.style.opacity = "0"; }); }));
         })()),
         L("hypothetical", KEY(q("cap-u0"))),                          /* the words under the bars start with them */
         L("its scores", A.seq(fx(0), fx(1), fx(2), fx(3), fx(4)))],
        L("the green mean", A.seq(SHOW(q("mr")), A.draw(q("mr-line"), { dur: 0.5 }), key("mr-v"))),
        L("100 on every answer", change("u0", "u1", 1.4)),
        L("perfect", A.par(A.highlight(q("hmr-hl"), { dur: 0.5 }), A.highlight(q("ah-hl"), { dur: 0.5 })))]; },
      loop: A.seq(A.wait(1.0), A.par(change("u1", "u1x", 1.0), redden(1)), A.wait(2.4),
                  A.par(change("u1x", "u1", 1.0), redden(0)), A.wait(1.8)) },
    { look: [], frame: "fig", shown: ["estw", "ustrip"], same: true,                     /* 11.9 what if questions had no answer? */
      also: function () { return A.hide(q("cap-u0"), { dur: 0.35 }); },
      act: function () { return [
        L("under the strip, an overlay", A.seq(shown("unans"), A.pop(q("upn"), { dur: 0.45 }))),
        L("a question", A.enter(q("uq"))),
        L("searched for", A.flow(q("u-arrow"), { dur: 0.45 })),
        L("an empty passage", A.enter(q("up"))),
        L("nothing supports it", key("u-none")),
        L("8 such questions join the strip", A.seq(shown("fly8"), flyUp)),
        [L("answered at 100, wrong", A.seq(A.reveal(EXTRA8, { dur: 0.01 }), change("u1", "u2", 1.2))),
         L("the copies give way", flyGone),
         cnt ? L("72 questions", A.recount(cnt, { from: UD.n0, to: UD.n1, dur: 1.2 })) : null,
         L("hypothetical", A.seq(SHOW(q("cap-u2")), KEY(q("cap-u2"))))].filter(Boolean),
        [L("the red mean", mwIn), L("collapsed", redden(1))],
        L("careful about wrong answers", A.seq(SHOW(q("u-say")), key("u-say")))]; } },
    { look: ["head"], frame: "home", shown: ["estw", "ustrip", "unans", "fly8", "u-say", "cap-u2", "mw"],   /* 11.10 take home */
      away: ["estw", "unans", "fly8"],
      act: function () { return [
        [L("a clean page over the picture", A.seq(shown("th"), A.pop(q("th-pnl"), { dur: 0.45 }), A.draw(q("th-sep"), { dur: 0.35 }))),
         G("the title changes", [L("the old one, un-keyed", A.reverse(key("head"))), L("Take-home messages", key("th-head"))])],
        thChart(),
        thBars()]; } },
    { look: QA_LOOK, frame: "qa", shown: ["th"], away: ["th"], also: function () { return headAway; },   /* 11.11 questions? */
      act: function () { return [
        [L("Questions?", A.seq(shown("qa-head"), key("qa-head"))),
         G("the model is me", [L("its title, un-keyed", A.reverse(key("model-title"))),
                               L("my portrait", A.seq(shown("qa-me"), A.pop(q("me-portrait"), { dur: 0.45 }))),
                               L("its ring", A.draw(q("me-ring"), { dur: 0.4 })),
                               L("Me", key("me-title"))]),
         G("your question, in the question box", [L("the box takes it, and lights", A.par(qFill, A.at(0.3, dimTo(qc, 0.3, 1, 0.5)))),
                                                  L("typed", A.seq(shown("qq"), A.enter(q("qq"))))])],
        L("its ball", A.seq(A.reveal(ball, { dur: 0.01 }), A.pop(ball, { dur: 0.35 }))),
        L("into me", go("l-q", "l-type")),
        L("my answer, submitted, through the gate", leave("Q", "submit", "call-submit", "l-sg")),
        [L("out", leave("submit", "A", "l-ans")), L("the orchestrator's rule, for me", A.seq(shown("qa-note"), key("qa-note")))],
        L("the answer: generated, its confidence unknown", A.seq(dimTo(q("ans"), 0.3, 0, 0.25), shown("aq"), A.enter(q("aq"))))]; },
      loop: A.seq(A.wait(1.0), A.breathe(AQB, { hi: 0.92, lo: 0.12, dur: 3.2 }), A.wait(1.2), rock, A.wait(1.4)) }
  ];
  var putAway = function (names) { return names && names.length ? A.hide(names.map(q), { dur: 0.35 }) : null; };
  var steps = STEPS.map(function (st, s) {
    var from = s ? STEPS[s - 1] : null, f0 = F[from ? from.frame : "home"], f1 = F[st.frame];
    var move = f0 === f1 ? null : A.zoom(q.svg, { from: f0, to: f1, dur: 0.8 });
    var look = { name: "look", group: [move, st.same ? null : A.focus(P, { from: from ? ix(from.look) : null, to: ix(st.look), dim: 0.3, dur: move ? 0.8 : 0.5 }),
                                       putAway(st.away), st.also ? st.also() : null].filter(Boolean) };
    return { enter: A.groups({ name: "11." + (s + 1), layers: [L("state", state(st.shown)), look.group.length ? look : null,
                                                              { name: "act", layers: st.act() }].filter(Boolean) }),
             loop: st.loop || null };
  });

  return { entry: A.groups(tree), steps: steps };
});
