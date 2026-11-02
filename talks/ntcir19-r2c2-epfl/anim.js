/* anim.js -- the deck's ANIMATION BANK: the motions every slide shares, defined once.
 *
 * Every motion is a TRACK: { dur, set(t) }, where set(t) puts its elements in the state
 * they have t seconds into it, as a pure function of t (no clock, no memory). That one
 * rule is what lets the same motion be played live (live.js drives t from the clock),
 * captured frame by frame into video (tools/make_media.mjs seeks t), and run backwards
 * exactly (← seeks t downwards).
 *
 *   A.reveal(el, {dur, dy, dx})     fade in, rising a little (dy units; 0 for a plain fade)
 *   A.hide(el, {dur})               the reverse: fade out
 *   A.draw(el, {dur})               draw a stroked path (or every path in a group) from its start
 *   A.flow(el, {dur})               a flow arrow (concepts/flow_arrow.py): shaft drawn, then head
 *   A.pulse(el, {dur})              an ink bead travelling along a flow arrow's shaft, for rest loops
 *   A.highlight(el, {dur, out})     a marker band (a <rect data-hl>) swept in from the left;
 *                                   data-hl="fit" sizes it to the words drawn right after it
 *   A.dim(el, {dur, to, back})      set aside: fade to a muted opacity (to, default 0.28) and stay there;
 *                                   back: true brings it back to full (styles cleared at its end)
 *   A.move(el, {dur, from, to})     gathered with / re-ranked: translate between two offsets [dx, dy] in
 *                                   slide units from where the markup draws it (from default [0, 0],
 *                                   to default [0, 0]); draw the element where it ends, give `from`
 *   A.grow(el, {dur, dir, from})    this much: a filled bar (a <rect>, or every rect[data-bar] in a group)
 *                                   extends from its base to its drawn size; dir "right" (default) or
 *                                   "up"; from is the starting fraction (default 0)
 *   A.camera(svg, from, to, {dur})  the camera: frames [x, y, w, h] in slide units; a CSS
 *                                   transform on the slide's <svg> box (the compositor's job)
 *   A.seq(a, b, ...)  one after the other     A.par(a, b, ...)  together
 *   A.wait(s)         nothing, for s seconds  A.at(s, track)    track, starting s seconds in
 *   A.stagger(els, make, gap)                 the same motion on several elements, gap apart
 *
 * In a seq, a track that has not started yet shows its first state only where no earlier
 * track has touched the element, so "reveal, then later hide" on one element is safe.
 *
 * A slide registers its motions with Deck.slide (live.js):
 *   Deck.slide("02-flow", function (A, q) {          // q("name") is [data-a="name"] in this slide
 *     return { entry: A.seq(A.reveal(q("src")), A.flow(q("arrow"))),
 *              loop:  A.seq(A.pulse(q("arrow")), A.wait(1.2)),   // optional; starts and ends at rest
 *              exit:  null };                                    // optional; default: a short fade
 *   });
 * A new shared motion is added HERE, never inside a slide, and shown on the specimen page.
 */
(function (G) {
  "use strict";
  var A = {};
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  A.ease = {
    io: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    out: function (x) { return 1 - Math.pow(1 - x, 3); },
    lin: function (x) { return x; }
  };
  /* a track from a function of u in [0, 1] */
  A.track = function (dur, fn) {
    return { dur: dur, set: function (t) { fn(dur > 0 ? clamp(t / dur) : (t >= 0 ? 1 : 0)); } };
  };
  A.wait = function (s) { return A.track(s, function () {}); };
  function list(args) { return [].slice.call(args).filter(Boolean); }
  A.seq = function () {
    var ts = list(arguments), at = [], o = 0;
    ts.forEach(function (x) { at.push(o); o += x.dur; });
    return { dur: o, set: function (t) {
      for (var i = ts.length - 1; i >= 0; i--) if (at[i] > t) ts[i].set(t - at[i]);     /* not begun: their first state, latest first */
      for (var j = 0; j < ts.length; j++) if (at[j] <= t) ts[j].set(t - at[j]);       /* begun: in order */
    } };
  };
  A.par = function () {
    var ts = list(arguments), d = Math.max.apply(null, [0].concat(ts.map(function (x) { return x.dur; })));
    return { dur: d, set: function (t) { ts.forEach(function (x) { x.set(t); }); } };
  };
  A.at = function (s, tr) { return A.seq(A.wait(s), tr); };
  A.stagger = function (els, make, gap) {
    return A.par.apply(null, [].slice.call(els).map(function (el, i) { return A.at(i * (gap == null ? 0.15 : gap), make(el)); }));
  };
  function els(el) { return !el ? [] : el.length != null && !el.tagName ? [].slice.call(el) : [el]; }
  function need(el, what) { if (!el || (el.length === 0)) throw new Error("anim: " + what + " has no element (check the data-a name)"); }

  /* ---- reveal / hide ---- */
  A.reveal = function (el, o) {
    need(el, "reveal"); o = o || {};
    var dy = o.dy == null ? 10 : o.dy, dx = o.dx || 0, E = o.ease || A.ease.out, L = els(el);
    return A.track(o.dur == null ? 0.6 : o.dur, function (u) {
      var e = E(u);
      L.forEach(function (n) {
        n.style.opacity = u >= 1 ? "" : String(e);
        n.style.translate = u >= 1 || (!dx && !dy) ? "" : ((1 - e) * dx).toFixed(3) + "px " + ((1 - e) * dy).toFixed(3) + "px";
      });
    });
  };
  A.hide = function (el, o) {
    need(el, "hide"); o = o || {};
    var L = els(el), E = o.ease || A.ease.io;
    return A.track(o.dur == null ? 0.4 : o.dur, function (u) {
      L.forEach(function (n) { n.style.opacity = u <= 0 ? "" : String(1 - E(u)); });
    });
  };

  /* ---- dim: set aside, still visible; u = 0 untouched, u = 1 exactly the muted level ---- */
  A.dim = function (el, o) {
    need(el, "dim"); o = o || {};
    var L = els(el), lo = o.to == null ? 0.28 : o.to, E = o.ease || A.ease.io;
    return A.track(o.dur == null ? 0.5 : o.dur, function (u) {
      var e = o.back ? 1 - E(u) : E(u);                 /* e: how far set aside */
      L.forEach(function (n) { n.style.opacity = e <= 0 ? "" : e >= 1 ? String(lo) : String(1 - (1 - lo) * e); });
    });
  };

  /* ---- move: a translation between two offsets from the drawn place; cleared wherever it is 0 ---- */
  A.move = function (el, o) {
    need(el, "move"); o = o || {};
    var L = els(el), a = o.from || [0, 0], b = o.to || [0, 0], E = o.ease || A.ease.io;
    return A.track(o.dur == null ? 0.8 : o.dur, function (u) {
      var e = E(u), x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e;
      if (u >= 1) { x = b[0]; y = b[1]; } else if (u <= 0) { x = a[0]; y = a[1]; }
      L.forEach(function (n) { n.style.translate = (!x && !y) ? "" : x.toFixed(3) + "px " + y.toFixed(3) + "px"; });
    });
  };

  /* ---- grow: a bar's rect extends from its base (left, or bottom with dir "up") to its drawn size ---- */
  A.grow = function (el, o) {
    need(el, "grow"); o = o || {};
    var R = els(el).reduce(function (a, n) {
      if (n.tagName.toLowerCase() === "rect") return a.concat([n]);
      var bars = n.querySelectorAll("rect[data-bar]");
      return a.concat([].slice.call(bars.length ? bars : n.querySelectorAll("rect")));
    }, []);
    if (!R.length) throw new Error("anim.grow: no <rect> to grow");
    var up = o.dir === "up", f0 = o.from || 0, E = o.ease || A.ease.out;
    var G0 = R.map(function (r) { return { y: r.getAttribute("y"), w: r.getAttribute("width"), h: r.getAttribute("height") }; });
    return A.track(o.dur == null ? 0.7 : o.dur, function (u) {
      var k = f0 + (1 - f0) * E(u);
      R.forEach(function (r, i) {
        var g = G0[i];
        if (u >= 1) { r.setAttribute("width", g.w); r.setAttribute("height", g.h); if (g.y != null) r.setAttribute("y", g.y); r.style.opacity = ""; return; }
        if (up) {
          var H = parseFloat(g.h), Y = parseFloat(g.y || 0);
          r.setAttribute("height", (H * k).toFixed(2)); r.setAttribute("y", (Y + H * (1 - k)).toFixed(2));
        } else r.setAttribute("width", (parseFloat(g.w) * k).toFixed(2));
        r.style.opacity = k <= 0 ? "0" : "";            /* a zero bar's stroke would show as a hairline */
      });
    });
  };

  /* ---- draw: a stroked path appears from its start ---- */
  function paths(el) {
    return els(el).reduce(function (a, n) {
      return a.concat(n.tagName && n.tagName.toLowerCase() === "path" ? [n] : [].slice.call(n.querySelectorAll("path")));
    }, []);
  }
  function drawTo(p, L, e) {
    if (e >= 1) { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; p.style.opacity = ""; return; }
    p.style.strokeDasharray = L + " " + (L + 1);
    p.style.strokeDashoffset = String(L * (1 - e));
    p.style.opacity = e <= 0 ? "0" : "";
  }
  A.draw = function (el, o) {
    need(el, "draw"); o = o || {};
    var P = paths(el), Ls = P.map(function (p) { return p.getTotalLength(); }), E = o.ease || A.ease.io;
    return A.track(o.dur == null ? 0.8 : o.dur, function (u) { P.forEach(function (p, i) { drawTo(p, Ls[i], E(u)); }); });
  };

  /* ---- flow: the flow arrow's shaft drawn, its head arriving at the end ---- */
  A.flow = function (el, o) {
    need(el, "flow"); o = o || {};
    var shaft = el.querySelector('[data-part="shaft"]'), head = el.querySelector('[data-part="head"]');
    if (!shaft) throw new Error("anim.flow: no [data-part=shaft] in " + (el.getAttribute("data-a") || "element"));
    var L = shaft.getTotalLength(), E = o.ease || A.ease.io, H = o.head == null ? 0.22 : o.head;
    return A.track(o.dur == null ? 0.9 : o.dur, function (u) {
      drawTo(shaft, L, E(clamp(u / (1 - H))));
      if (head) {
        var h = clamp((u - (1 - H)) / H);
        head.style.opacity = h >= 1 ? "" : String(h);
      }
    });
  };

  /* ---- pulse: an ink bead runs along a flow arrow's shaft (a rest loop's "this keeps flowing") ---- */
  var NS = "http://www.w3.org/2000/svg";
  A.pulse = function (el, o) {
    need(el, "pulse"); o = o || {};
    var shaft = el.querySelector('[data-part="shaft"]');
    var dot = el.querySelector('[data-part="pulse"]');
    if (!dot) {                                  /* made once, when the motion is defined: invisible at rest */
      dot = document.createElementNS(NS, "circle");
      dot.setAttribute("data-part", "pulse");
      var w = parseFloat(shaft.getAttribute("stroke-width")) || 3.5;
      dot.setAttribute("r", (w * 1.6).toFixed(2));
      dot.setAttribute("fill", o.fill || shaft.getAttribute("stroke") || "#302E2E");
      dot.setAttribute("opacity", "0");
      shaft.parentNode.insertBefore(dot, shaft.nextSibling);
    }
    var L = shaft.getTotalLength(), E = A.ease.io;
    return A.track(o.dur == null ? 1.2 : o.dur, function (u) {
      var p = shaft.getPointAtLength(L * E(u) * 0.97);
      dot.setAttribute("cx", p.x.toFixed(2)); dot.setAttribute("cy", p.y.toFixed(2));
      dot.setAttribute("opacity", (u <= 0 || u >= 1) ? "0" : String(Math.min(1, Math.min(u, 1 - u) * 8)));
    });
  };

  /* data-hl="fit": a marker sized to the words drawn right after it, measured in the browser, once */
  function fitOne(r) {
    if (!r || r.getAttribute("data-hl") !== "fit" || r.getAttribute("data-fitted")) return;
    var t = r.nextElementSibling; if (!t || !t.getBBox) return;
    var b = t.getBBox(), px = b.height * 0.18, py = b.height * 0.04;
    r.setAttribute("x", (b.x - px).toFixed(2)); r.setAttribute("y", (b.y + py).toFixed(2));
    r.setAttribute("width", (b.width + 2 * px).toFixed(2)); r.setAttribute("height", (b.height - 2 * py).toFixed(2));
    r.setAttribute("rx", (b.height * 0.16).toFixed(2)); r.setAttribute("data-fitted", "1");
  }
  A.fit = function (root) { [].forEach.call(root.querySelectorAll('rect[data-hl="fit"]'), fitOne); };

  /* ---- highlight: a marker band swept in (a <rect data-hl> behind the words, drawn at full width) ---- */
  A.highlight = function (el, o) {
    need(el, "highlight"); o = o || {};
    var R = els(el).map(function (n) { return n.tagName.toLowerCase() === "rect" ? n : n.querySelector("rect[data-hl]"); });
    R.forEach(fitOne);
    var W = R.map(function (r) { return parseFloat(r.getAttribute("width")); }), E = o.ease || A.ease.io;
    return A.track(o.dur == null ? 0.5 : o.dur, function (u) {
      var e = o.out ? 1 - E(u) : E(u);
      R.forEach(function (r, i) {
        if (e >= 1) { r.style.opacity = ""; r.setAttribute("width", W[i]); return; }
        r.setAttribute("width", (W[i] * e).toFixed(2));
        r.style.opacity = e <= 0 ? "0" : "";
      });
    });
  };

  /* ---- camera: the slide's frame moves; one CSS transform on its <svg> box, so the
   * compositor plays it (world/smooth.py's lesson: never rewrite the viewBox per frame) ---- */
  A.VB = [0, 0, 1600, 900];
  function camCss(f) {
    var s = Math.min(A.VB[2] / f[2], A.VB[3] / f[3]);
    var cx = f[0] + f[2] / 2, cy = f[1] + f[3] / 2;           /* the frame's centre at the stage's centre */
    var tx = (A.VB[2] / 2 - cx * s) / A.VB[2] * 100, ty = (A.VB[3] / 2 - cy * s) / A.VB[3] * 100;
    return "translate(" + tx.toFixed(4) + "%, " + ty.toFixed(4) + "%) scale(" + s.toFixed(5) + ")";
  }
  A.camera = function (svg, from, to, o) {
    o = o || {};
    var E = o.ease || A.ease.io;
    svg.style.transformOrigin = "0 0";
    return A.track(o.dur == null ? 1.2 : o.dur, function (u) {
      var e = E(u);
      var w = from[2] * Math.pow(to[2] / from[2], e), h = w * (from[3] / from[2]);    /* zoom geometric, pan linear */
      var cx = from[0] + from[2] / 2 + (to[0] + to[2] / 2 - from[0] - from[2] / 2) * e;
      var cy = from[1] + from[3] / 2 + (to[1] + to[3] / 2 - from[1] - from[3] / 2) * e;
      var f = [cx - w / 2, cy - h / 2, w, h];
      var full = f[0] === A.VB[0] && f[1] === A.VB[1] && f[2] === A.VB[2];
      svg.style.transform = full ? "" : camCss(f);
    });
  };

  G.Anim = A;
})(window);
