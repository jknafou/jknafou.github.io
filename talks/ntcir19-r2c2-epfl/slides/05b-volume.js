/* Slide 6 (05b-volume): the volume of the run. Its picture, grid (the results slides') and numbers are in the .py's
   header; here its motions. Every disc is one pass (236 per row; at the per-question rest a question's passes sit on its
   disc): its places are in its data (data-q the question's place, data-p its pass's), so every
   motion is a move between two drawn places, eased, in one go.

   ENTRY ("6", per question), as slides 7 and 8 enter, A.groups:
     aside (what the steps bring, hidden) → [the title ‖ the three rows, each: [its heading ‖ what it measures] keyed →
     [its line drawn ‖ its scale keyed] → its 65 discs pop in value order (1.6 s) → [Han Solo's name ‖ the median's ring
     pops → its value counted → "median"]]
   STEP 1 ("6.1", pass by pass), the three rows together:
     the per-question marks put away (Han Solo's name, the ring, the median)
     → [the heading and what it measures re-keyed "... per pass" ‖ each question's disc splits into its passes' discs, which travel to their pass's line (1.3 s; Han Solo's turn
        blue: they are passes now) ‖ the question's line fades ‖ the four pass lines drawn ‖ the scale re-scales in one
        move (its ticks slide to their new places, those of one scale only fading out or in) ‖ the pass lines' names]
     → [the means' rings pop pass 1 to 4, the line joining them drawn with them, their values counted] → "mean"
   (Step 6.2, the cost by GPU, was removed on 11 November 2026: the GPU-hours row is RTX PRO 6000-equivalent, see the .py.)
   No word ever crosses a moving disc: the lines' words sit left of the lines (x < 238), the values right of them
   (x > 1400), the scales under the discs' lowest place (checked every 0.1 s). */
Deck.slide("05b-volume", function (A, q) {
  var B = ["calls", "retrieved", "gpuh"], P4 = [1, 2, 3, 4];
  var key = function (n) { return A.type(q(n), { quick: true }); };
  var shown = function (n) { return A.seq(A.reveal(q(n), { dur: 0.01 }), key(n)); };
  var L = function (name, tr) { return { name: name, track: tr }; };
  var num = function (s) { return s.split(",").map(Number); };
  var E = A.ease.io, lerp = function (a, b, e) { return a + (b - a) * e; };
  var INK = [48, 46, 46], EN = [160, 182, 208];
  var mix = function (a, b, e) { return "rgb(" + a.map(function (v, i) { return Math.round(lerp(v, b[i], e)); }).join(",") + ")"; };
  var discs = function (b) { return [].slice.call(q("vb-" + b + "-d").querySelectorAll("circle")); };
  var DR = 5.5, PR = 4.0, AX0 = 250, AX1 = 1400;
  var ticks = function (b) { return [].slice.call(q("vb-" + b + "-t").querySelectorAll("text")); };
  var qTicks = function (b) { return ticks(b).filter(function (t) { return t.getAttribute("data-q") === "1"; }); };
  var pOnly = [].concat.apply([], B.map(function (b) { return ticks(b).filter(function (t) { return t.getAttribute("data-q") !== "1"; }); }));

  /* ---- the entry ---- */
  var popIn = function (b) {                              /* a row's discs pop along its line in value order */
    var D = discs(b), xs = D.map(function (d) { return num(d.getAttribute("data-q"))[0]; });
    var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
    return A.track(1.6, function (u) {
      var T = u * 1.6;
      D.forEach(function (d, i) {
        var a = 1.25 * (xs[i] - lo) / (hi - lo), v = Math.max(0, Math.min(1, (T - a) / 0.3));
        d.setAttribute("r", (DR * (v <= 0 ? 0 : v >= 1 ? 1 : A.ease.out(v))).toFixed(2));
      });
    });
  };
  var later = [].concat.apply([], B.map(function (b) {
    return ["vb-" + b + "-h2", "vb-" + b + "-c2", "vb-" + b + "-tr", "vb-" + b + "-vk"].concat([].concat.apply([], P4.map(function (p) {
      return ["vb-" + b + "-pl" + p, "vb-" + b + "-pk" + p, "vb-" + b + "-m" + p, "vb-" + b + "-v" + p]; })));
  }));
  var row = function (b) {
    return { name: b, layers: [
      [L("its heading", key("vb-" + b + "-h1")), L("what it measures", key("vb-" + b + "-c1"))],
      [L("its line", A.draw(q("vb-" + b + "-ql"), { dur: 0.6 })), L("its scale", A.type(qTicks(b), { quick: true }))],
      L("its 65 questions, in value order", popIn(b)),
      [L("Han Solo", A.reveal(q("vb-" + b + "-han"), { dur: 0.35 })),
       { name: "the median", layers: [A.pop(q("vb-" + b + "-med"), { dur: 0.4 }), A.count(q("vb-" + b + "-mv"), { dur: 0.7 }), key("vb-" + b + "-mk")] }]] };
  };
  var entry = A.groups({ name: "slide", layers: [
    L("aside: what the steps bring", A.hide(later.map(q).concat(pOnly), { dur: 0 })),
    [L("title", key("head"))].concat(B.map(row))] });

  /* ---- step 1: pass by pass ---- */
  var travel = function (b, from, to, dur) {               /* every disc of a row from one of its places to another */
    var D = discs(b), F = D.map(function (d) { return num(d.getAttribute(from)); }), T = D.map(function (d) { return num(d.getAttribute(to)); });
    var han = D.map(function (d) { return d.getAttribute("data-han") === "1"; });
    return A.track(dur, function (u) {
      var e = E(u);
      D.forEach(function (d, i) {
        d.setAttribute("cx", lerp(F[i][0], T[i][0], e).toFixed(2));
        d.setAttribute("cy", lerp(F[i][1], T[i][1], e).toFixed(2));
        d.setAttribute("r", lerp(DR, PR, e).toFixed(2));    /* a question's disc → a pass's: smaller, half clear, no rim */
        d.setAttribute("fill", han[i] ? mix(INK, EN, e) : "rgb(" + EN.join(",") + ")");
        d.setAttribute("fill-opacity", lerp(1, 0.6, e).toFixed(3));
        d.setAttribute("stroke-opacity", (1 - e).toFixed(3));
      });
    });
  };
  var rescale = function (b) {                              /* the scale in one move: every tick slides with it */
    var g = q("vb-" + b + "-t"), K0 = +g.getAttribute("data-kq"), K1 = +g.getAttribute("data-kp"), T = ticks(b);
    return A.track(1.3, function (u) {
      var e = E(u), k = lerp(K0, K1, e);
      T.forEach(function (t) {
        var v = +t.getAttribute("data-v"), x = AX0 + v * k, iq = t.getAttribute("data-q") === "1", ip = t.getAttribute("data-p") === "1";
        var o = (iq && ip) ? 1 : iq ? 1 - e : e;
        if (x > AX1 + 2) o = 0;
        t.setAttribute("x", x.toFixed(2));
        t.style.opacity = u <= 0 ? (iq ? "" : "0") : u >= 1 ? (ip ? "" : "0") : o.toFixed(3);
        if (u > 0 && t._full != null) t.textContent = t._full;   /* keyed at the entry: written in full */
      });
    });
  };
  var rekey = function (a, b) {                             /* a heading's words re-keyed in place */
    return A.seq(A.reverse(key(a)), A.hide(q(a), { dur: 0.01 }), A.reveal(q(b), { dur: 0.01 }), key(b));
  };
  var means = function (b) {
    var parts = P4.map(function (p, i) {
      return A.at(0.35 * i, A.par(A.seq(A.reveal(q("vb-" + b + "-m" + p), { dur: 0.01 }), A.pop(q("vb-" + b + "-m" + p), { dur: 0.35 })),
                                  A.seq(A.reveal(q("vb-" + b + "-v" + p), { dur: 0.01 }), A.count(q("vb-" + b + "-v" + p), { dur: 0.5 }))));
    });
    return A.par.apply(null, [A.reveal(q("vb-" + b + "-tr"), { dur: 0.01 }), A.draw(q("vb-" + b + "-tr"), { dur: 1.2 })].concat(parts));
  };
  var s1 = A.groups({ name: "6.1", layers: [
    L("the per-question marks, put away", A.hide([].concat.apply([], B.map(function (b) {
      return ["han", "med", "mv", "mk"].map(function (x) { return q("vb-" + b + "-" + x); }); })), { dur: 0.35 })),
    B.map(function (b) {
      return { name: b + ": to the passes", group: [
        L("its heading, re-keyed", rekey("vb-" + b + "-h1", "vb-" + b + "-h2")),
        L("what it measures, re-keyed", rekey("vb-" + b + "-c1", "vb-" + b + "-c2")),
        L("the discs to their passes", travel(b, "data-q", "data-p", 1.3)),
        L("the question's line fades", A.hide(q("vb-" + b + "-ql"), { dur: 0.6 })),
        L("the pass lines", A.seq(A.reveal(P4.map(function (p) { return q("vb-" + b + "-pl" + p); }), { dur: 0.01 }),
                                  A.draw(P4.map(function (p) { return q("vb-" + b + "-pl" + p); }), { dur: 0.7 }))),
        L("the scale, in one move", rescale(b)),
        L("the pass lines' names", A.seq(A.reveal(P4.map(function (p) { return q("vb-" + b + "-pk" + p); }), { dur: 0.01 }),
                                         A.type(P4.map(function (p) { return q("vb-" + b + "-pk" + p); }), { quick: true })))] };
    }),
    L("the means, pass 1 to 4", A.par.apply(null, B.map(means))),
    L("mean", A.par.apply(null, B.map(function (b) { return shown("vb-" + b + "-vk"); })))] });

  return { entry: entry, steps: [{ enter: s1 }] };
});
