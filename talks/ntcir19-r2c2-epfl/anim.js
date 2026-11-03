/* anim.js -- the deck's ANIMATION BANK: the motions every slide shares, defined once.
 *
 * Every motion is a TRACK: { dur, set(t) }, where set(t) puts its elements in the state
 * they have t seconds into it, as a pure function of t (no clock, no memory). That one
 * rule is what lets the same motion be played live (live.js drives t from the clock),
 * captured frame by frame into video (tools/make_media.mjs seeks t), and run backwards
 * exactly (← seeks t downwards).
 *
 *   A.reveal(el, {dur, dy, dx})     fade in (dy, dx: an optional drift in units; none by default)
 *   A.hide(el, {dur})               the reverse: fade out
 *   A.draw(el, {dur})               draw a stroked path (or every path in a group) from its start
 *   A.write(el, {dur, lift})        written by hand: each stroked path of el drawn in turn, at a pen's
 *                                   pace (slow start, quick middle), a short pen-lift (lift s) between; a
 *                                   <text data-hand> (a teacher's "R") is one stroke, uncovered from its left
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
 *   A.settle(el, {dur, from})       a value moves: a dot (circle[data-dot]) travels from the faint ghost of its
 *                                   old value (circle[data-ghost]) and settles on its new one, the thin link
 *                                   (line[data-link], drawn ghost -> dot) following it; draw the dot where it
 *                                   ends. With no ghost, from is the offset [dx, dy] it starts at
 *   A.pop(el, {dur})                appears like a balloon: scales up from its centre past its size, and settles
 *   A.type(els, {dur, typos, quick}) typed on a keyboard: each <text> in turn, character by character with a
 *                                   caret, now and then a typo that is noticed, erased and retyped;
 *                                   quick: a fixed word keyed in at twice the pace, never a typo
 *   A.think(el, {dur})              the AI thinking: a loading ring turning just before the text it will
 *                                   generate (put it right before A.type of that text)
 *   A.flip(els, {beat})             a class label on a split-flap board, as a station's departures: every cell
 *                                   starts blank, all turn together through the same alphabet, flap by flap
 *                                   (half a character folding over the midline), each stopping at its own letter
 *   A.count(els, {dur})             a number that grows from 0 to its value, its format kept ("2,091,427 passages");
 *                                   data-one / data-many: the noun after it agrees on the way ("1 pass", "2 passes")
 *   A.fill(bar, {dur, value})       a gauge settling: the bar (rect[data-full]) hunts up and down around its
 *                                   level before it sets; value (text[data-value]) counts with it
 *   A.enter(el)                     ONE CONCEPT ENTERING, LAYER BY LAYER, the deck's standard entry:
 *                                   1 frame: the whole concept pops (A.pop); one marked data-enter="bare" has no frame and skips it
 *                                   2 writing, in document order: its own <text> by kind (data-anim, style.as_anim):
 *                                     "type" for words someone wrote (A.type), "flip" for a label (A.flip),
 *                                     "ai" for generated words (A.think, then A.type), "flip" for a question
 *                                     type's or a run's name only (A.flip), "count" for a number (A.count);
 *                                     unmarked text or "key", presented words ("Q", "A", a band's title, the
 *                                     handle), keyed in quickly without a typo (A.type quick);
 *                                     its own stroked lines drawn by pen (A.draw)
 *                                   3 marker bands swept (A.highlight)
 *                                   4 gauges settle (A.fill); a model's score (rect[data-model]) first thinks (A.think)
 *                                   5 hand marks written ([data-verdict], A.write)
 *                                   Nested concepts and anything under [data-layer="frame"] (a logo) come
 *                                   in with the frame and are not taken apart. A container marked
 *                                   data-enter="drawn" (a list) instead has its rect[data-frame] drawn by hand,
 *                                   then its nested concepts enter, each by its own layers, one after another.
 *                                   A composition marked data-enter="built" (the pipeline) is built in reading
 *                                   order: each nested concept enters by its own layers (a flow arrow by A.flow),
 *                                   its own lines are drawn, its own words entered by their kind (data-anim), a
 *                                   <g data-ticks> ticked in with its count (its [data-tick] chips popped, one each), anything else pops, a marker band
 *                                   left for A.highlight; a <g data-together> runs its parts at once, a
 *                                   <g data-ripple="s"> s apart; data-marks="last": its parts' hand marks are
 *                                   written after the whole is built, one after another.
 *   A.travel(ball, {along, dur})    goes on to this step: the ball (concepts/question_token.py) rolls along a pipe
 *                                   (`along`: a flow arrow or a list of them, in order) from its start to the
 *                                   next box and stops, straight through each box between two pipes at the same
 *                                   speed; draw the ball where it stops. Not move (re-placing)
 *                                   nor pulse (a bead, for loops)
 *   A.emit(out, {along, draw})      this came out of this step: an ink bead leaves the box along its out-arrow
 *                                   (`along`, drawn behind the bead unless draw: false), and where it arrives
 *                                   the output enters by its own layers (A.enter). One verb for every box
 *   A.camera(svg, from, to, {dur})  the camera: frames [x, y, w, h] in slide units; a CSS
 *                                   transform on the slide's <svg> box (the compositor's job)
 *   A.seq(a, b, ...)  one after the other     A.par(a, b, ...)  together
 *   A.wait(s)         nothing, for s seconds  A.at(s, track)    track, starting s seconds in
 *   A.stagger(els, make, gap)                 the same motion on several elements, gap apart
 *   A.pace(track, k)  track played k times faster: "passed through quickly", the same motion as a slow step
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
    return { dur: dur, set: function (t) {        /* within a rounding error of its end is its end: a seq's offsets add up inexactly */
      fn(dur > 0 ? (t / dur > 1 - 1e-9 ? 1 : clamp(t / dur)) : (t >= 0 ? 1 : 0)); } };
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
    var dy = o.dy || 0, dx = o.dx || 0, E = o.ease || A.ease.out, L = els(el);
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

  /* ---- settle: a dot travels from its old value to its new one, a link drawn behind it ---- */
  A.settle = function (el, o) {
    need(el, "settle"); o = o || {};
    var E = o.ease || A.ease.io;
    var S = els(el).map(function (g) {
      var dot = g.matches("[data-dot]") ? g : g.querySelector("[data-dot]");
      if (!dot) throw new Error("anim.settle: no [data-dot]");
      var link = g.querySelector("[data-link]"), ghost = g.querySelector("[data-ghost]");
      var at = function (n, k) { return parseFloat(n.getAttribute(k)); };
      var dx = 0, dy = 0, L = null;
      if (link) { L = { x1: at(link, "x1"), y1: at(link, "y1"), x2: at(link, "x2"), y2: at(link, "y2") }; dx = L.x1 - L.x2; dy = L.y1 - L.y2; }
      else if (ghost) { dx = at(ghost, "cx") - at(dot, "cx"); dy = at(ghost, "cy") - at(dot, "cy"); }
      else if (o.from) { dx = o.from[0]; dy = o.from[1]; }
      return { dot: dot, link: link, L: L, dx: dx, dy: dy };
    });
    return A.track(o.dur == null ? 1.0 : o.dur, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : E(u);
      S.forEach(function (s) {
        var x = (1 - e) * s.dx, y = (1 - e) * s.dy;
        s.dot.style.translate = (!x && !y) ? "" : x.toFixed(3) + "px " + y.toFixed(3) + "px";
        if (s.link) {
          s.link.setAttribute("x2", (s.L.x1 + (s.L.x2 - s.L.x1) * e).toFixed(2));
          s.link.setAttribute("y2", (s.L.y1 + (s.L.y2 - s.L.y1) * e).toFixed(2));
          s.link.style.opacity = e <= 0 ? "0" : "";
        }
      });
    });
  };

  /* ---- draw: a stroked path appears from its start ---- */
  function paths(el) {
    return els(el).reduce(function (a, n) {
      return a.concat(n.tagName && /^(path|rect|circle|line|polyline)$/i.test(n.tagName) ? [n] : [].slice.call(n.querySelectorAll("path")));
    }, []);
  }
  function drawTo(p, L, e) {
    if (p.tagName.toLowerCase() === "path" && p.getAttribute("stroke-dasharray")) {   /* dashed: drawn along its points, dashes kept */
      if (p._d0 == null) {
        p._d0 = p.getAttribute("d"); p._pts = [];
        for (var i = 0, k = Math.max(8, Math.ceil(L / 3)); i <= k; i++) { var q = p.getPointAtLength(L * i / k); p._pts.push(q.x.toFixed(2) + "," + q.y.toFixed(2)); }
      }
      if (e >= 1) { p.setAttribute("d", p._d0); p.style.opacity = ""; return; }
      p.setAttribute("d", "M" + p._pts.slice(0, Math.max(1, Math.round(e * (p._pts.length - 1))) + 1).join("L"));
      p.style.opacity = e <= 0 ? "0" : "";
      return;
    }
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

  /* ---- write: the strokes of a mark drawn one after another, as a hand writes them ---- */
  /* a letter written by hand (a <text data-hand>, the organisers' "R" or ";YES"): uncovered from its left as
     the pen goes, its width counted as its stroke's length; a clip made once, gone at rest */
  function handTo(t, e) {
    if (!t._hand) {
      var b = t.getBBox(), defs = t.ownerSVGElement.querySelector("defs") || t.ownerSVGElement.insertBefore(mk("defs", {}), t.ownerSVGElement.firstChild);
      var id = "hand" + (++flapId), cp = mk("clipPath", { id: id }, defs), pad = b.height * 0.1;
      t._hand = { id: id, x: b.x - pad, w: b.width + 2 * pad, r: mk("rect", { x: b.x - pad, y: b.y - pad, width: 0, height: b.height + 2 * pad }, cp) };
    }
    if (e >= 1) { t.removeAttribute("clip-path"); t.style.opacity = ""; return; }
    t.setAttribute("clip-path", "url(#" + t._hand.id + ")");
    t._hand.r.setAttribute("width", (t._hand.w * e).toFixed(2));
    t.style.opacity = e <= 0 ? "0" : "";
  }
  A.write = function (el, o) {
    need(el, "write"); o = o || {};
    var P = els(el).reduce(function (a, n) {          /* its strokes in order: lines, and letters written by hand */
      return a.concat(n.tagName.toLowerCase() === "text" && n.hasAttribute("data-hand") ? [n] : paths(n).concat(
        n.tagName.toLowerCase() === "g" ? [].slice.call(n.querySelectorAll("text[data-hand]")) : []));
    }, []);
    if (P.some(function (p) { return p.tagName.toLowerCase() === "text"; }) && P.length > 1) {   /* in the order they stand */
      P.sort(function (a, b) { return a === b ? 0 : a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    }
    var isT = function (p) { return p.tagName.toLowerCase() === "text"; };
    var Ls = P.map(function (p) { return isT(p) ? p.getBBox().width : p.getTotalLength(); });
    var lift = o.lift == null ? 0.12 : o.lift, total = Ls.reduce(function (a, b) { return a + b; }, 0) || 1;
    var dur = o.dur == null ? 0.55 : o.dur, ink = dur - lift * (P.length - 1);
    var pen = function (x) { return x < 0.15 ? 0.5 * x * x / 0.15 : x < 0.75 ? 0.075 + (x - 0.15) * 1.25 : 0.825 + 0.175 * A.ease.out((x - 0.75) / 0.25); };
    var spans = [], at = 0;
    Ls.forEach(function (L) { var d = ink * L / total; spans.push([at, d]); at += d + lift; });
    return A.track(dur, function (u) {
      var t = u * dur;
      P.forEach(function (p, i) { var e = u >= 1 ? 1 : pen(clamp((t - spans[i][0]) / spans[i][1])); if (isT(p)) handTo(p, e); else drawTo(p, Ls[i], e); });
    });
  };

  /* ---- pop: a balloon -- scaled up from its centre, past its size, settling ---- */
  A.pop = function (el, o) {
    need(el, "pop"); o = o || {};
    var L = els(el);
    L.forEach(function (n) { n.style.transformBox = "fill-box"; n.style.transformOrigin = "center"; });
    var O = L.map(function (n) { var a = parseFloat(n.getAttribute("opacity")); return isNaN(a) ? 1 : a; });   /* a dimmed row stays dimmed */
    return A.track(o.dur == null ? 0.6 : o.dur, function (u) {
      var k = u >= 1 ? 1 : 1 - Math.cos(u * Math.PI * 2.5) * Math.exp(-4.2 * u);     /* 0 -> ~1.1 -> ~0.97 -> 1 */
      L.forEach(function (n) {
        n.style.scale = u >= 1 ? "" : Math.max(0, k).toFixed(4);
        n.style.opacity = u >= 1 ? "" : String(O[L.indexOf(n)] * clamp(u / 0.2));
      });
    });
  };

  /* ---- flip: a split-flap board (Solari), for a label that names a class.
   * The board is the label itself: each letter is a flap of the label's own ground (the tag's colour,
   * or the paper), carrying the label's own letter -- same face, size, weight and ink, at the place it
   * holds at rest. All flaps start blank and turn together, one per beat, through the same alphabet,
   * each stopping at its own letter (so in "simple" the i lands before the s). A flap turns on its
   * axle: the upper half of the old letter falls forward over the fold, shortening and shading as it
   * tips, then the lower half of the new one swings down. While a flap turns, its fold shows as a
   * faint darker line; once it has landed the fold fades, so the last frame IS the still. ---- */
  function texts(el) {
    return els(el).reduce(function (a, n) { return a.concat(n.tagName.toLowerCase() === "text" ? [n] : [].slice.call(n.querySelectorAll("text"))); }, []);
  }
  var FLAP_SEQ = [" ABCDEFGHIJKLMNOPQRSTUVWXYZ", " abcdefghijklmnopqrstuvwxyz", " 0123456789"];
  function flapSeq(ch) {
    for (var i = 0; i < FLAP_SEQ.length; i++) if (FLAP_SEQ[i].indexOf(ch) > 0) return FLAP_SEQ[i].slice(0, FLAP_SEQ[i].indexOf(ch) + 1);
    return ch === " " ? " " : " " + ch;                 /* a sign (-, ·, .) has one flap */
  }
  var NS_ = "http://www.w3.org/2000/svg", flapId = 0;
  function mk(tag, at, parent) {
    var e = document.createElementNS(NS_, tag);
    for (var k in at) e.setAttribute(k, at[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  /* the label's ground: the filled shape it sits on (a tag), else the paper */
  function groundOf(n) {
    var b = n.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    for (var p = n.previousElementSibling; p; p = p.previousElementSibling) {
      if (p.tagName.toLowerCase() !== "rect") continue;
      var f = p.getAttribute("fill"), r = p.getBBox();
      if (f && f !== "none" && cx > r.x && cx < r.x + r.width && cy > r.y && cy < r.y + r.height) return f;
    }
    return "#FBF8F4";
  }
  function flapBoard(n) {
    if (n._board) return n._board;
    var S = n.textContent, svg = n.ownerSVGElement, defs = svg.querySelector("defs") || svg.insertBefore(mk("defs", {}), svg.firstChild);
    var g = mk("g", { "data-board": "" }); g.style.display = "none"; n.parentNode.insertBefore(g, n.nextSibling);
    var fs = parseFloat(n.getAttribute("font-size")), y = parseFloat(n.getAttribute("y")), ground = groundOf(n);
    var top = y - fs * 0.88, bot = y + fs * 0.26, mid = y - fs * 0.33;          /* the fold through the middle of the small letters */
    var cells = [];
    for (var i = 0; i < S.length; i++) {
      if (S[i] === " ") continue;
      var x0 = n.getStartPositionOfChar(i).x, x1 = n.getEndPositionOfChar(i).x, w = x1 - x0, cx = (x0 + x1) / 2, id = "flap" + (++flapId);
      var cT = mk("clipPath", { id: id + "t" }, defs); mk("rect", { x: x0, y: top, width: w, height: mid - top }, cT);
      var cB = mk("clipPath", { id: id + "b" }, defs); mk("rect", { x: x0, y: mid, width: w, height: bot - mid }, cB);
      var half = function (clip, shade) {
        var h = mk("g", { "clip-path": "url(#" + id + clip + ")" }, g);
        mk("rect", { x: x0, y: top, width: w, height: bot - top, fill: ground }, h);   /* the flap is the label's own ground */
        var t = n.cloneNode(false);
        t.removeAttribute("data-a"); t.removeAttribute("data-anim"); t.removeAttribute("style");
        t.setAttribute("x", cx); t.setAttribute("text-anchor", "middle"); h.appendChild(t);
        var sh = shade ? mk("rect", { x: x0, y: top, width: w, height: bot - top, fill: "#000", opacity: 0 }, h) : null;
        return { g: h, t: t, sh: sh };
      };
      var c = { room: w, seq: flapSeq(S[i]), mid: mid, id: id, upper: half("t"), lower: half("b"), flap: half("t", true) };
      c.fold = mk("rect", { x: x0, y: mid - fs * 0.008, width: w, height: fs * 0.016, fill: "#000", opacity: 0 }, g);
      cells.push(c);
    }
    n._board = { g: g, cells: cells };
    return n._board;
  }
  function blank(s) { return s === " " ? "" : s; }
  /* a flap's letter: at its own width, narrowed only when wider than the place its final letter holds (an m in an i's place) */
  function letter(t, ch, room) {
    if (t._ch === ch) return;
    t._ch = ch; t.removeAttribute("textLength"); t.textContent = ch;
    if (ch && t.getComputedTextLength() > room * 1.05) { t.setAttribute("textLength", room.toFixed(2)); t.setAttribute("lengthAdjust", "spacingAndGlyphs"); }
  }
  A.flip = function (el, o) {
    need(el, "flip"); o = o || {};
    var T = texts(el), beat = o.beat || 0.07, settle = 0.25;
    var B = T.map(flapBoard);
    var most = Math.max.apply(null, [1].concat(B.map(function (b) { return Math.max.apply(null, [1].concat(b.cells.map(function (c) { return c.seq.length - 1; }))); })));
    var dur = most * beat + settle;
    return A.track(dur, function (u) {
      var t = u * dur;
      T.forEach(function (n, i) {
        var b = B[i];
        if (u >= 1) { n.style.opacity = ""; b.g.style.display = "none"; return; }   /* the still, exactly as the board left it */
        n.style.opacity = "0"; b.g.style.display = u <= 0 ? "none" : "";
        b.cells.forEach(function (c) {
          var last = c.seq.length - 1, k = Math.min(last, Math.floor(t / beat)), p = (t - k * beat) / beat;
          if (k >= last) {                                   /* landed: the letter at rest, its fold fading */
            letter(c.upper.t, blank(c.seq[last]), c.room); letter(c.lower.t, blank(c.seq[last]), c.room);
            c.flap.g.style.display = "none";
            c.fold.setAttribute("opacity", (0.18 * (1 - clamp((t - last * beat) / settle))).toFixed(3));
            return;
          }
          var cur = blank(c.seq[k]), nxt = blank(c.seq[k + 1]);
          letter(c.upper.t, nxt, c.room); letter(c.lower.t, cur, c.room);
          var falling = p < 0.5, e = falling ? 2 * p : 2 * p - 1;
          var s = falling ? Math.cos(e * Math.PI / 2) : Math.sin(e * Math.PI / 2);   /* the flap's height as it turns on the axle */
          c.flap.g.style.display = "";
          letter(c.flap.t, falling ? cur : nxt, c.room);
          c.flap.g.setAttribute("clip-path", "url(#" + c.id + (falling ? "t" : "b") + ")");
          c.flap.g.setAttribute("transform", "translate(0 " + c.mid + ") scale(1 " + Math.max(0.001, s).toFixed(3) + ") translate(0 " + (-c.mid) + ")");
          c.flap.sh.setAttribute("opacity", (0.12 * (1 - s)).toFixed(3));       /* a shade as it tips away from the light */
          c.fold.setAttribute("opacity", "0.18");
        });
      });
    });
  };

  /* ---- count: a number grows from 0 to its value; the words around it and its format stay ---- */
  A.count = function (el, o) {
    need(el, "count"); o = o || {};
    var T = texts(el), P = T.map(function (n) {                /* the first number, or the last with data-count="last" */
      var s0 = n._full != null ? n._full : (n._full = n.textContent), all = s0.match(/\d[\d,]*(\.\d+)?/g) || [], m = null, re = /\d[\d,]*(\.\d+)?/g, x;
      while ((x = re.exec(s0))) { m = x; if (n.getAttribute("data-count") !== "last") break; }
      if (!m || !all.length) return { s0: s0 };
      return { s0: s0, pre: s0.slice(0, m.index), post: s0.slice(m.index + m[0].length), v: parseFloat(m[0].replace(/,/g, "")),
               dec: m[1] ? m[1].length - 1 : 0, comma: m[0].indexOf(",") >= 0,
               one: n.getAttribute("data-one"), many: n.getAttribute("data-many") };
    });
    var fmt = function (p, x) {
      var s1 = x.toFixed(p.dec), post = p.post;
      if (p.comma) { var parts = s1.split("."); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); s1 = parts.join("."); }
      var noun = s1 === "1" ? p.one : p.many;          /* the noun after the number agrees with it on the way ("1 pass", "2 passes") */
      if (noun != null) post = post.replace(/^(\s*)\S+/, "$1" + noun);
      return p.pre + s1 + post;
    };
    var E = o.ease || A.ease.out;
    return A.track(o.dur == null ? 1.1 : o.dur, function (u) {
      var e = E(u);
      T.forEach(function (n, i) {
        var p = P[i];
        if (u >= 1 || p.v == null) { n.textContent = u <= 0 && p.v == null ? "" : p.s0; return; }
        n.textContent = u <= 0 ? "" : fmt(p, p.v * e);
      });
    });
  };

  /* ---- type: a keyboard -- a pure script of keystrokes per <text>, seeded by its own words ---- */
  var KEYS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  function neighbour(ch, r) {
    var c = ch.toLowerCase();
    for (var i = 0; i < KEYS.length; i++) {
      var j = KEYS[i].indexOf(c);
      if (j < 0) continue;
      var opts = [KEYS[i][j - 1], KEYS[i][j + 1]].filter(Boolean), k = opts[Math.floor(r * opts.length) % opts.length];
      return ch === c ? k : k.toUpperCase();
    }
    return null;
  }
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  }
  /* [{t, s}]: the string shown from time t on; one typo at most per 30 characters, `typos` at most */
  function keystrokes(S, cps, budget) {
    var r = seeded(S), out = [{ t: 0, s: "" }], t = 0, made = 0, step = 1 / cps;
    var next = 6 + Math.floor(r() * 18);
    for (var i = 0; i < S.length; i++) {
      var ch = S[i];
      if (made < budget && i >= next && /[a-z]/i.test(ch) && i < S.length - 2) {
        var wrong = neighbour(ch, r());
        if (wrong) {
          var extra = r() < 0.5 && /[a-z]/i.test(S[i + 1]) ? 1 : 0;          /* sometimes one more key before it is noticed */
          t += step * (0.7 + 0.6 * r()); out.push({ t: t, s: S.slice(0, i) + wrong });
          if (extra) { t += step; out.push({ t: t, s: S.slice(0, i) + wrong + S[i + 1] }); }
          t += 0.22;                                                          /* noticed */
          for (var b = extra; b >= 0; b--) { t += 0.07; out.push({ t: t, s: S.slice(0, i) + (b ? wrong : "") }); }
          t += 0.08; made++; next = i + 30 + Math.floor(r() * 20);
        }
      }
      t += step * (ch === " " ? 1.5 : 0.6 + 0.8 * r());
      out.push({ t: t, s: S.slice(0, i + 1) });
    }
    return { dur: t, keys: out, made: made };
  }
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  A.type = function (el, o) {
    need(el, "type"); o = o || {};
    var T = els(el).reduce(function (a, n) { return a.concat(n.tagName.toLowerCase() === "text" ? [n] : [].slice.call(n.querySelectorAll("text"))); }, []);
    var texts = T.map(function (n) { return n._full != null ? n._full : (n._full = n.textContent); }), total   /* the words as drawn, read once */ = texts.join("").length || 1;
    var cps = Math.max(o.quick ? 48 : 22, total / (o.dur || (o.quick ? 1.2 : 3.2)));   /* a typist's pace, quicker for long text */
    var budget = o.quick ? 0 : o.typos == null ? 2 : o.typos, left = budget;
    var plans = texts.map(function (S) {
      var p = keystrokes(S, cps, Math.min(left, S.length >= 24 ? 1 : 0));
      left -= p.made; return p;
    });
    var at = [], d = 0;
    plans.forEach(function (p) { at.push(d); d += p.dur + 0.05; });
    var caret = '<tspan fill="#8C8682">|</tspan>';
    var fix = T.map(function (n) {                     /* an end- or middle-anchored line is typed from where it will start */
      var a = n.getAttribute("text-anchor");
      if (a !== "end" && a !== "middle") return null;
      var x = parseFloat(n.getAttribute("x")), w = n.getComputedTextLength ? n.getComputedTextLength() : 0;
      return { a: a, x: n.getAttribute("x"), left: (a === "end" ? x - w : x - w / 2).toFixed(2) };
    });
    var place = function (i, typing) {
      var f = fix[i], n = T[i];
      if (!f) return;
      n.setAttribute("text-anchor", typing ? "start" : f.a);
      n.setAttribute("x", typing ? f.left : f.x);
    };
    var tr = A.track(d, function (u) {
      var t = u * d;
      T.forEach(function (n, i) {
        if (u >= 1) { place(i, false); n.textContent = texts[i]; return; }
        place(i, true);
        var p = plans[i], lt = t - at[i];
        if (lt < 0 || u <= 0) { n.textContent = ""; return; }      /* not begun: empty, and no caret yet */
        var s = "";
        for (var k = 0; k < p.keys.length && p.keys[k].t <= lt; k++) s = p.keys[k].s;
        var typing = lt < p.dur + 0.05;
        n.innerHTML = esc(s) + (typing ? caret : "");
      });
    });
    tr.cue = function (word, after) {                /* the second `word` is fully typed (its first time after `after`), or null */
      var re = new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), m;
      for (var i = 0; i < texts.length; i++) {
        re.lastIndex = 0;
        while ((m = re.exec(texts[i]))) {
          var e = m.index + word.length, want = texts[i].slice(0, e), K = plans[i].keys, c = null;
          for (var k = 0; k < K.length; k++) if (K[k].s.length >= e && K[k].s.slice(0, e) === want) { c = at[i] + K[k].t; break; }
          if (c != null && (after == null || c > after)) return c;
        }
      }
      return null;
    };
    return tr;
  };

  /* ---- think: a loading ring turning where the generated text will start, then gone ---- */
  A.think = function (el, o) {
    need(el, "think"); o = o || {};
    var n = els(el)[0], fs = parseFloat(n.getAttribute("font-size")) || 30, r = fs * 0.3;
    var bx = parseFloat(n.getAttribute("x")), by = parseFloat(n.getAttribute("y")) - fs * 0.34;
    var anchor = n.getAttribute("text-anchor"), cx = anchor === "end" ? bx - r : anchor === "middle" ? bx : bx + r;
    var ring = document.createElementNS("http://www.w3.org/2000/svg", "g");
    var C = 2 * Math.PI * r;
    ring.innerHTML = '<circle cx="0" cy="0" r="' + r + '" fill="none" stroke="#8C8682" stroke-opacity="0.25" stroke-width="' + fs * 0.08 + '"/>'
      + '<circle cx="0" cy="0" r="' + r + '" fill="none" stroke="#302E2E" stroke-width="' + fs * 0.08 + '" stroke-linecap="round" '
      + 'stroke-dasharray="' + (C * 0.28).toFixed(2) + ' ' + C.toFixed(2) + '"/>';
    ring.style.display = "none";
    n.parentNode.insertBefore(ring, n);
    var dur = o.dur == null ? 1.3 : o.dur;
    return A.track(dur, function (u) {
      if (u <= 0 || u >= 1) { ring.style.display = "none"; return; }
      var t = u * dur, a = (t / 0.75) * 360;                                  /* a turn every 0.75 s */
      var fade = Math.min(1, u / 0.12, (1 - u) / 0.12);
      ring.style.display = ""; ring.style.opacity = String(fade);
      ring.setAttribute("transform", "translate(" + cx.toFixed(2) + " " + by.toFixed(2) + ") rotate(" + (a - 90).toFixed(1) + ")");
    });
  };

  /* ---- fill: a gauge hunting up and down around its level before it sets; its number counts with it ---- */
  A.fill = function (bar, o) {
    need(bar, "fill"); o = o || {};
    var full = parseFloat(bar.getAttribute("data-full")), frac = parseFloat(bar.getAttribute("data-frac"));
    var w0 = bar._w0 != null ? bar._w0 : (bar._w0 = bar.getAttribute("width")), min = parseFloat(bar.getAttribute("height")) || 0;
    var val = o.value || null, v0 = val ? (val._full != null ? val._full : (val._full = val.textContent)) : null, top = parseFloat(v0);
    var dp = v0 ? (String(v0).split(".")[1] || "").replace(/\D.*/, "").length : 0;
    return A.track(o.dur == null ? 1.5 : o.dur, function (u) {
      if (u >= 1) { bar.setAttribute("width", w0); bar.style.opacity = ""; if (val) { val.textContent = v0; val.style.opacity = ""; } return; }
      if (val) val.style.opacity = u <= 0 ? "0" : "";                         /* the number belongs to the gauge's beat */
      var k = 1 - Math.cos(u * Math.PI * 3) * Math.pow(1 - u, 2.6);         /* up, down, up, down, set */
      var f = frac * k;
      if (k > 1 && f > 0.985) f = frac - (k - 1) * frac;                       /* near the top the swing goes down, never flat at the clamp */
      f = clamp(f);
      bar.setAttribute("width", Math.max(min, full * f).toFixed(2));
      bar.style.opacity = f <= 0.005 ? "0" : "";
      if (val && !isNaN(top)) val.textContent = Math.min(100, Math.max(0, frac > 0 ? top * f / frac : 0)).toFixed(dp);   /* as many decimals as it ends on */
    });
  };

  /* a run of words of one kind (data-anim), as the layers say */
  function wordsTrack(kind, run, o) {
    if (kind === "type") return A.type(run, { typos: o.typos });
    if (kind === "ai") {                               /* one ring where the text starts, then all its rows typed */
      var th = A.think(run[0]), ty = A.type(run, { typos: o.typos }), ai = A.seq(th, ty);
      ai.cue = function (w, after) { var c = ty.cue(w, after == null ? null : after - th.dur); return c == null ? null : th.dur + c; };
      return ai;
    }
    if (kind === "ai-more") return A.type(run, { typos: o.typos });   /* the same generation, going on: no second ring */
    if (kind === "key") return A.type(run, { quick: true });
    if (kind === "empty") return A.stagger(run, function (n) {          /* an empty place appears whole, its number counting */
      var t = n.querySelector('text[data-anim="count"]');
      return A.par(A.reveal(n, { dur: 0.3 }), t ? A.count(t, { dur: 0.4 }) : null);
    }, 0.08);
    return A.stagger(run, function (n) {
      if (kind === "flip") return A.flip(n);
      var c = A.count(n, { dur: 0.6 });
      return n.hasAttribute("data-model") ? A.seq(A.think(n), c) : c;   /* a number a model gave: it thinks first */
    }, 0.06);
  }
  /* a <g data-ticks>: things written in, one tick each, their number counting in step; then what they are ("calls") */
  function ticksTrack(n) {
    var G = [].slice.call(n.querySelectorAll("[data-tick]"));        /* marks that say their kind (a tool's chip): each pops */
    var P = G.length ? G : [].slice.call(n.querySelectorAll("path"));
    var T = [].slice.call(n.querySelectorAll("text")).filter(function (t) { return !t.closest("[data-tick]"); }), c = T[0];
    var each = +(n.getAttribute("data-each") || 0.2);                 /* a tick 0.2 s; one measure (a length bar) longer */
    return A.seq(A.par(A.stagger(P, function (p) { return G.length ? A.pop(p, { dur: Math.max(0.3, each * 1.5) }) : A.draw(p, { dur: each }); }, each),
                       c ? A.count(c, { dur: each * P.length, ease: A.ease.lin }) : null),
                 T.length > 1 ? A.type(T.slice(1), { quick: true }) : null);
  }
  /* the hand marks ([data-verdict]), written last, one after another at a hand's pace; then their words, keyed
     (a letter marked data-hand is part of the mark, written with it, never keyed) */
  function marksTrack(marks) {
    var said = marks.reduce(function (a, m) { return a.concat([].slice.call(m.querySelectorAll("text:not([data-hand])"))); }, []);
    return A.seq(A.wait(0.15), A.seq.apply(null, marks.map(function (m, i) { return A.seq(i ? A.wait(0.12) : null, A.write(m)); })),
                 said.length ? A.type(said, { quick: true }) : null);
  }

  /* ---- enter: one concept, layer by layer (see the list at the top) ---- */
  A.enter = function (el, o) {
    need(el, "enter"); o = o || {};
    var root = el.matches && el.matches("[data-concept]") ? el : (el.querySelector("[data-concept]") || el);
    var own = function (n) {
      return (n.closest("[data-concept]") === root || !root.matches("[data-concept]"))
        && !n.closest('[data-layer="frame"]') && !(n.ownerSVGElement && n.closest("svg") !== n.ownerSVGElement);
    };
    var q = function (sel) { return [].slice.call(root.querySelectorAll(sel)).filter(own); };
    if (root.getAttribute("data-enter") === "built") {   /* a composition: its parts one after another, in reading order */
      var last = root.getAttribute("data-marks") === "last";   /* its parts' hand marks wait for the whole */
      var one = function (c) {                            /* one part, by its own rule */
        var t = c.tagName.toLowerCase(), k = c.getAttribute("data-concept");
        if (k === "flow_arrow") {                         /* an arrow inside a composition: paced by its length */
          var sh = c.querySelector('[data-part="shaft"]');
          return A.flow(c, { dur: Math.min(0.7, 0.25 + (sh ? sh.getTotalLength() : 0) / 1000) });
        }
        if (k) return A.enter(c, last ? { marks: false } : null);
        if (t === "rect" && c.hasAttribute("data-hl")) return null;   /* a marker band: swept by A.highlight at its own beat */
        if (t === "path" && c.getAttribute("fill") === "none") return A.draw(c, { dur: Math.min(0.6, Math.max(0.2, c.getTotalLength() / 1400)) });
        if (t === "g") {
          if (c.hasAttribute("data-ticks")) return ticksTrack(c);
          var kids = [].slice.call(c.children).map(one).filter(Boolean);
          if (c.hasAttribute("data-together")) return A.par.apply(null, kids);                       /* these run at once */
          if (c.hasAttribute("data-ripple")) return A.stagger(kids, function (x) { return x; }, +c.getAttribute("data-ripple"));
          return A.seq.apply(null, kids);
        }
        if (t === "text") return null;                    /* words are keyed by the walk, in runs */
        return t === "defs" ? null : A.pop(c, { dur: 0.4 });
      };
      var walk = function (g) {                           /* in order; consecutive words of one kind as one run */
        var steps0 = [], words0 = [], wk = null;
        var say = function () { if (words0.length) steps0.push(wordsTrack(wk, words0, o)); words0 = []; wk = null; };
        [].slice.call(g.children).forEach(function (c) {
          if (c.tagName.toLowerCase() === "text") {
            if (!(c._full != null ? c._full : c.textContent).trim()) return;
            var k = c.getAttribute("data-anim") || "key";
            if (k !== wk) say();
            wk = k; words0.push(c); return;
          }
          say();
          if (c.tagName.toLowerCase() === "g" && !c.getAttribute("data-concept") && !c.hasAttribute("data-together")
              && !c.hasAttribute("data-ripple") && !c.hasAttribute("data-ticks"))
            steps0.push(walk(c));
          else steps0.push(one(c));
        });
        say();
        return A.seq.apply(null, steps0.filter(Boolean));
      };
      var built = walk(root), held = last ? [].slice.call(root.querySelectorAll("[data-verdict]")) : [];
      return held.length ? A.seq(built, marksTrack(held)) : built;
    }
    var drawn = root.getAttribute("data-enter") === "drawn";
    var board = drawn ? q('text[data-anim="flip"]') : [];                       /* a list's run name turns in first */
    var writing = q("text:not([data-value]), path, g[data-empty], g[data-ticks]").filter(function (n) {
      if (n.tagName.toLowerCase() !== "g" && n.closest("[data-ticks]")) return false;   /* ticks and their count go together */
      if (n.hasAttribute("data-callout") || board.indexOf(n) >= 0) return false;   /* a callout's leader is drawn with its callout */
      if (n.tagName.toLowerCase() === "g") return true;                          /* an empty place: it appears whole */
      if (n.closest("[data-empty]")) return false;
      if (n.tagName.toLowerCase() === "text") return !n.closest("[data-verdict]");   /* a verdict's words come after its mark */
      return !n.closest("[data-verdict]") && !n.closest("[data-part]") && n.getAttribute("fill") === "none" && n.getAttribute("stroke") && n.getAttribute("stroke") !== "none";
    });
    var kind = function (n) { return n.getAttribute("data-anim") || "key"; };     /* a fixed word: keyed in quickly */
    var steps = [], run = [], runKind = null;
    var flush = function () {
      if (!run.length) return;
      steps.push(wordsTrack(runKind, run, o));
      run = []; runKind = null;
    };
    writing.forEach(function (n) {
      if (n.hasAttribute("data-ticks")) { flush(); steps.push(ticksTrack(n)); return; }
      if (n.tagName.toLowerCase() === "g") {
        if (runKind !== "empty") flush();
        runKind = "empty"; run.push(n);
      } else if (n.tagName.toLowerCase() === "text") {
        if (!(n._full != null ? n._full : n.textContent).trim()) return;   /* the words as drawn, not as a run left them */
        var k = kind(n);
        if (k !== runKind) flush();
        runKind = k; run.push(n);
      } else { flush(); steps.push(A.draw(n, { dur: Math.min(0.6, Math.max(0.2, n.getTotalLength() / 1400)) })); }
    });
    flush();
    var first, calls = [];
    var pose = function (m) { A.act(m, { hold: 0 }).set(+m.getAttribute("data-t")); };   /* an emblem is its scene, posed */
    if (drawn) {
      var frames = q("rect[data-frame]");
      var kids = [].slice.call(root.querySelectorAll("[data-concept]")).filter(function (n) { return n.parentNode.closest("[data-concept]") === root; });
      calls = [].slice.call(root.querySelectorAll("[data-callout]")).filter(function (n) { return n.parentNode.closest("[data-concept]") === root; });
      var marks_ = kids.filter(function (n) { return n.getAttribute("data-concept") === "emblem" && calls.indexOf(n) < 0; });
      kids = kids.filter(function (n) { return n.getAttribute("data-concept") !== "emblem" && calls.indexOf(n) < 0; });
      marks_.forEach(pose);
      first = A.seq(board.length ? A.stagger(board, function (n) { return A.flip(n); }, 0.06) : null,
                    frames.length ? A.draw(frames, { dur: 0.9 }) : null,
                    !kids.length ? null
                    : kids.some(function (n) { return n.querySelector('text[data-anim="key"], text[data-anim="type"]'); })
                    ? A.seq.apply(null, kids.map(function (n) { return A.enter(n); }))                       /* rows with words: one after another */
                    : A.stagger(kids, function (n) { return A.enter(n); }, Math.min(0.1, 1.5 / kids.length)),   /* ruled rows: in a ripple */
                    marks_.length ? A.stagger(marks_, function (n) { return A.pop(n); }, 0.08) : null);
    } else if (root.getAttribute("data-enter") !== "bare") first = A.pop(root);   /* a frameless concept (a ledger row) has no frame to pop */
    var hl = q("rect[data-hl]"), bars = q("rect[data-full]"), marks = q("[data-verdict]");
    var vals = q("text[data-value]");
    var scenes = [].slice.call(root.querySelectorAll('[data-concept="scene"]')).filter(function (n) { return n.parentNode.closest("[data-concept]") === root; });
    return A.seq(
      first,
      (function () {                                     /* the words, their bands and gauges; the scene acting them out alongside */
        var words = A.seq.apply(null, steps);
        var then = A.seq(words, hl.length ? A.highlight(hl) : null,
                         bars.length ? A.par.apply(null, bars.map(function (b, i) {
                           var f = A.fill(b, { value: vals[i] });
                           var at = q("text[data-ring]")[i];                       /* the ring turns where the gauge will grow from */
                           return b.hasAttribute("data-model") && vals[i] ? A.seq(A.think(at || vals[i]), f) : f;   /* a model's score: it thinks, then its gauge settles */
                         })) : null);
        if (!scenes.length) return then;
        var cue = function (w, after) {                  /* when `w` is typed, its first time after `after` */
          for (var i = 0, off = 0; i < steps.length; off += steps[i].dur, i++) {
            var c = steps[i].cue ? steps[i].cue(w, after == null ? null : after - off) : null;
            if (c != null) return off + c;
          }
          return null;
        };
        return A.par(then, A.par.apply(null, scenes.map(function (n) { return A.act(n, { cue: cue }); })));
      })(),
      marks.length && o.marks !== false ? marksTrack(marks) : null,     /* marks: false, in a composition that writes them last */
      calls.length ? A.seq.apply(null, calls.map(function (n) {     /* the passages worth reading, one by one, each with what it gave */
        var c = n.getAttribute("data-concept");
        if (!c) return A.draw(n, { dur: 0.45 });                              /* the leader from its row */
        if (c === "emblem") { pose(n); return A.pop(n, { dur: 0.45 }); }      /* its row's mark, once its story is told */
        return c === "flow_arrow" ? A.flow(n) : A.enter(n);
      })) : null
    );
  };

  /* ---- act: a scene's parts on one clock (concepts/scene.py). Each [data-act] part names its
     kind, its start data-at and length data-dur in seconds, its origin data-o and its value data-v;
     the part's own transform is kept and the act's is appended, so a part is a function of time only. */
  A.act = function (el, o) {
    need(el, "act"); o = o || {};
    var parts = [].slice.call(el.querySelectorAll("[data-act]")).map(function (p) {
      var num = function (k, d) { var v = p.getAttribute(k); return v == null ? d : +v; };
      var org = (p.getAttribute("data-o") || "0,0").split(",").map(Number);
      return { n: p, kind: p.getAttribute("data-act"), at: num("data-at", 0), dur: Math.max(0.001, num("data-dur", 0.5)),
               o: org, v: p.getAttribute("data-v"),
               base: p._actBase != null ? p._actBase : (p._actBase = p.getAttribute("transform") || "") };   /* read once: a second track must not take the first's frame for the drawing */
    });
    parts.forEach(function (p) {             /* words keyed in, numbers counted, lines drawn: from what the drawing holds */
      if (p.kind === "key" || p.kind === "count") {
        if (p.n._full == null) p.n._full = p.n.textContent;
        p.n.textContent = p.n._full;               /* a track reads the words as drawn, never as a last frame left them */
        p.tr = p.kind === "key" ? A.type(p.n, { quick: true })
             : A.count(p.n, { dur: p.dur, ease: p.v === "linear" ? A.ease.lin : null });   /* "linear": in step with what it counts */
        if (p.kind === "key") p.dur = Math.max(0.001, p.tr.dur);
      } else if (p.kind === "draw") {
        if (p.n._d0 == null) p.n._d0 = p.n.getAttribute("d");
        p.n.setAttribute("d", p.n._d0);
        var L = p.n.getTotalLength(), k = Math.max(8, Math.ceil(L / 3));
        p.pts = [];
        for (var i = 0; i <= k; i++) { var q = p.n.getPointAtLength(L * i / k); p.pts.push(q.x.toFixed(2) + "," + q.y.toFixed(2)); }
      }
    });
    var end = parts.reduce(function (m, p) { return Math.max(m, p.at + p.dur); }, 0);
    var about = function (p, t) { return " translate(" + p.o[0] + "," + p.o[1] + ") " + t + " translate(" + (-p.o[0]) + "," + (-p.o[1]) + ")"; };
    var put = function (p, t, op) {
      var tf = (p.base + (t ? " " + t : "")).trim();
      if (tf) p.n.setAttribute("transform", tf); else p.n.removeAttribute("transform");
      p.n.style.opacity = op == null ? "" : String(op);
    };
    var len = end + (o.hold || 0.2);
    /* cue: inside a card, each beat "word:second" of data-cues waits for its word to be typed ("word:0": the whole
       scene waits); between beats the scene keeps its own pace, and once a part has begun it runs on real time */
    var marks = [[0, 0]];
    if (o.cue) (el.getAttribute("data-cues") || "").split(",").filter(Boolean).forEach(function (c) {
      var i = c.lastIndexOf(":"), last = marks[marks.length - 1];
      var r = o.cue(c.slice(0, i), last[1]), sc = +c.slice(i + 1);                 /* searched after the beat before it */
      if (r == null) return;
      if (sc === 0 && marks.length === 1) marks[0] = [0, r];                   /* "word:0": nothing moves before the word */
      else if (sc > last[0] && r > last[1]) marks.push([sc, r]);
    });
    var lastM = marks[marks.length - 1], real = lastM[1] + (len - lastM[0]);
    var unwarp = function (st) {                     /* the first real second the scene reaches its second st */
      for (var i = 0; i < marks.length - 1; i++) {
        var a = marks[i], b = marks[i + 1];
        if (st === b[0]) return b[1];                                          /* a part on a cue's second waits for its word */
        if (st < b[0]) { var sg = b[0] - a[0], rg = b[1] - a[1]; return a[1] + (st - a[0]) * (rg >= sg ? 1 : rg / sg); }
      }
      return lastM[1] + (st - lastM[0]);
    };
    parts.forEach(function (p) { p.r0 = unwarp(p.at); });   /* begun, every part runs on real time: nothing frozen mid-word or mid-bounce */
    parts.forEach(function (p) { real = Math.max(real, p.r0 + p.dur + (o.hold || 0.2)); });
    return A.track(real, function (u) {
      var now = u * real;
      parts.forEach(function (p) {
        var v = clamp((now - p.r0) / p.dur), e = A.ease.io(v);
        if (p.kind === "pop") {
          if (v <= 0) return put(p, about(p, "scale(0.001)"), 0);
          put(p, v >= 1 ? "" : about(p, "scale(" + Math.max(0.001, 1 - Math.cos(2.5 * Math.PI * v) * Math.exp(-4.2 * v)).toFixed(4) + ")"));
        } else if (p.kind === "grow" || p.kind === "shrink") {
          var k = p.kind === "grow" ? A.ease.out(v) : 1 - A.ease.io(v);
          var s = p.v === "y" ? "scale(1," + Math.max(0.001, k).toFixed(4) + ")" : "scale(" + Math.max(0.001, k).toFixed(4) + ",1)";
          put(p, k >= 1 ? "" : about(p, s), k <= 0 ? 0 : null);
        } else if (p.kind === "turn") {
          put(p, v >= 1 ? "" : about(p, "rotate(" + ((1 - e) * +p.v).toFixed(2) + ")"));      /* from data-v degrees to the drawn pose */
        } else if (p.kind === "fall") {
          var f = (p.v || "0,100,0,1").split(",").map(Number), g = v * v;          /* gravity: distance grows as the square of time */
          put(p, v <= 0 ? "" : "translate(" + (f[0] * g).toFixed(2) + "," + (f[1] * g).toFixed(2) + ")" +
              about(p, "rotate(" + (f[2] * A.ease.out(v)).toFixed(2) + ") scale(" + (1 + (f[3] - 1) * g).toFixed(4) + ")"));
        } else if (p.kind === "move") {                                         /* drawn where it ends; comes from data-v away */
          var m = (p.v || "0,0").split(",").map(Number);
          put(p, v >= 1 ? "" : "translate(" + (m[0] * (1 - e)).toFixed(2) + "," + (m[1] * (1 - e)).toFixed(2) + ")");
        } else if (p.kind === "throw") {                                        /* the same, along an arc data-v[2] high */
          var w = (p.v || "0,0,30").split(",").map(Number);
          if (v <= 0) return put(p, "", 0);
          put(p, v >= 1 ? "" : "translate(" + (w[0] * (1 - v)).toFixed(2) + "," + (w[1] * (1 - v) - w[2] * 4 * v * (1 - v)).toFixed(2) + ")");
        } else if (p.kind === "leave") {                                        /* drawn where it starts; goes data-v away, shrinking, and fades */
          var l = (p.v || "0,-100,1").split(",").map(Number), ei = v * v;
          put(p, v <= 0 ? "" : "translate(" + (l[0] * ei).toFixed(2) + "," + (l[1] * ei).toFixed(2) + ")" + about(p, "scale(" + (1 + (l[2] - 1) * ei).toFixed(4) + ")"),
              v <= 0.7 ? null : Math.max(0, (1 - v) / 0.3));
        } else if (p.kind === "key" || p.kind === "count") {
          p.tr.set(Math.max(0, now - p.r0));
          put(p, "", now < p.r0 ? 0 : null);
        } else if (p.kind === "draw") {                                         /* from its first point to its last, dashes and all */
          var dv = clamp((now - p.r0) / p.dur), de = p.v === "linear" ? dv : A.ease.io(dv);
          if (dv >= 1) { p.n.setAttribute("d", p.n._d0); put(p, ""); return; }
          var m = Math.max(1, Math.round(de * (p.pts.length - 1)));
          p.n.setAttribute("d", "M" + p.pts.slice(0, m + 1).join("L"));
          put(p, "", dv <= 0 ? 0 : null);
        } else if (p.kind === "show") put(p, "", v <= 0 ? 0 : v >= 1 ? null : v);
        else if (p.kind === "hide") put(p, "", v <= 0 ? null : v >= 1 ? 0 : 1 - v);
        else if (p.kind === "pulse") put(p, "", v <= 0 || v >= 1 ? null : 1 - 0.75 * Math.sin(Math.PI * v));
      });
    });
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
        head.style.opacity = u >= 1 - H ? "" : "0";                            /* lands as the pen reaches it, no ghost */
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

  /* a pipe: the shafts of one flow arrow or a chain of them (or bare paths), with their lengths. Between two
     shafts of a chain the ball goes straight through the box, from one shaft's end to the next one's start: a
     leg of the chain like any other, counted in its length, so it rolls through at the same speed */
  function pipe(along) {
    var S = els(along).map(function (n) { return n.tagName.toLowerCase() === "path" ? n : n.querySelector('[data-part="shaft"]') || n.querySelector("path"); });
    if (!S.length || S.some(function (s) { return !s; })) throw new Error("anim: no pipe to run along (a flow arrow, or a list of them)");
    var Ls = S.map(function (s) { return s.getTotalLength(); }), legs = [];
    S.forEach(function (s, i) {
      if (i) {                                    /* through the box: straight from the last shaft's end */
        var a = S[i - 1].getPointAtLength(Ls[i - 1]), b = s.getPointAtLength(0), l = Math.hypot(b.x - a.x, b.y - a.y);
        if (l > 0.01) legs.push({ a: a, b: b, L: l });
      }
      legs.push({ s: s, L: Ls[i] });
    });
    var at = function (d) {                       /* the point d units along the chain */
      for (var i = 0; i < legs.length; i++) {
        var g = legs[i];
        if (d <= g.L || i === legs.length - 1) {
          var k = Math.max(0, Math.min(g.L, d));
          return g.s ? g.s.getPointAtLength(k) : { x: g.a.x + (g.b.x - g.a.x) * k / g.L, y: g.a.y + (g.b.y - g.a.y) * k / g.L };
        }
        d -= g.L;
      }
    };
    return { S: S, Ls: Ls, total: legs.reduce(function (a, g) { return a + g.L; }, 0), at: at };
  }

  /* ---- travel: the ball rolls along a pipe to the next box and stops ("goes on to this step").
   * The ball is drawn where it stops (its centre data-cx / data-cy, else its box's centre); it starts at
   * the pipe's start and rolls along every shaft of `along` to the point of the last one nearest its place.
   * Its turning body ([data-roll], or the part named <name>-roll) turns a whole number of times, so the
   * letter is upright where it starts and where it stops. ---- */
  A.travel = function (el, o) {
    need(el, "travel"); o = o || {};
    var B = els(el)[0], P = pipe(o.along), E = o.ease || A.ease.io;
    var b = B.getBBox(), cx = B.hasAttribute("data-cx") ? +B.getAttribute("data-cx") : b.x + b.width / 2,
        cy = B.hasAttribute("data-cy") ? +B.getAttribute("data-cy") : b.y + b.height / 2;
    var last = P.S[P.S.length - 1], LL = P.Ls[P.Ls.length - 1], best = 0, bd = Infinity;
    for (var i = 0; i <= 200; i++) {               /* where on the last shaft the ball stops */
      var q = last.getPointAtLength(LL * i / 200), dd = (q.x - cx) * (q.x - cx) + (q.y - cy) * (q.y - cy);
      if (dd < bd) { bd = dd; best = LL * i / 200; }
    }
    var stop = P.total - LL + best, end = P.at(stop), rx = cx - end.x, ry = cy - end.y;   /* what is left to its drawn place */
    var name = B.getAttribute("data-a"), roll = B.querySelector("[data-roll]") || (name ? B.querySelector('[data-a="' + name + '-roll"]') : null);
    var rad = o.r || (roll && roll.querySelector("circle") ? +roll.querySelector("circle").getAttribute("r") : b.height / 2) || 1;
    var turns = Math.max(1, Math.round(stop / (2 * Math.PI * rad)));
    var base = roll ? (roll._rollBase != null ? roll._rollBase : (roll._rollBase = roll.getAttribute("transform") || "")) : "";
    return A.track(o.dur == null ? Math.min(2.2, 0.5 + stop / 500) : o.dur, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : E(u), p = P.at(stop * e);
      var x = p.x + rx * e - cx, y = p.y + ry * e - cy;
      B.style.translate = u >= 1 || (Math.abs(x) < 1e-3 && Math.abs(y) < 1e-3) ? "" : x.toFixed(3) + "px " + y.toFixed(3) + "px";
      if (!roll) return;
      var a = 360 * turns * e, tf = (base + (u > 0 && u < 1 ? " rotate(" + a.toFixed(2) + ")" : "")).trim();
      if (tf) roll.setAttribute("transform", tf); else roll.removeAttribute("transform");
    });
  };

  /* ---- emit: the box puts out what it made ("this came out of this step"). An ink bead leaves the box
   * at the start of its out-arrow (`along`), the arrow drawn behind it (draw: false if it is already
   * there), and where the bead arrives the output enters by its own layers (A.enter). One verb for every
   * box: a tag, a turn, rows, a card, a nugget, a reply, a ruling, an answer. ---- */
  A.emit = function (el, o) {
    need(el, "emit"); o = o || {};
    var enter = o.enter || A.enter(el);
    if (!o.along) return enter;
    var arrow = els(o.along)[0], shaft = arrow.querySelector('[data-part="shaft"]') || arrow, head = arrow.querySelector('[data-part="head"]');
    var bead = arrow.querySelector('[data-part="emit"]');
    if (!bead) {                                  /* made once, when the motion is defined: invisible at rest */
      bead = document.createElementNS(NS, "circle");
      bead.setAttribute("data-part", "emit");
      bead.setAttribute("r", ((parseFloat(shaft.getAttribute("stroke-width")) || 3.5) * 1.9).toFixed(2));
      bead.setAttribute("fill", shaft.getAttribute("stroke") || "#302E2E");
      bead.setAttribute("opacity", "0");
      shaft.parentNode.appendChild(bead);
    }
    var L = shaft.getTotalLength(), E = A.ease.io, drawIt = o.draw !== false;
    var leave = A.track(o.dur == null ? Math.min(1.1, 0.35 + L / 600) : o.dur, function (u) {
      var e = u >= 1 ? 1 : u <= 0 ? 0 : E(u), p = shaft.getPointAtLength(L * e);
      if (drawIt) { drawTo(shaft, L, e); if (head) head.style.opacity = u >= 1 ? "" : "0"; }
      bead.setAttribute("cx", p.x.toFixed(2)); bead.setAttribute("cy", p.y.toFixed(2));
      bead.setAttribute("opacity", u <= 0 || u >= 1 ? "0" : "1");
    });
    return A.seq(leave, enter);
  };

  /* ---- pace: a track played k times faster ("passed through quickly"); the same motion, sped up ---- */
  A.pace = function (tr, k) {
    k = k || 2;
    var out = { dur: tr.dur / k, set: function (t) { tr.set(t * k); } };
    if (tr.cue) out.cue = function (w, after) { var c = tr.cue(w, after == null ? null : after * k); return c == null ? null : c / k; };
    return out;
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
