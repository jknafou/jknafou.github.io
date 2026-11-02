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
 *                                   pace (slow start, quick middle), a short pen-lift (lift s) between
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
 *   A.count(els, {dur})             a number that grows from 0 to its value, its format kept ("2,091,427 passages")
 *   A.fill(bar, {dur, value})       a gauge settling: the bar (rect[data-full]) hunts up and down around its
 *                                   level before it sets; value (text[data-value]) counts with it
 *   A.enter(el)                     ONE CONCEPT ENTERING, LAYER BY LAYER, the deck's standard entry:
 *                                   1 frame: the whole concept pops (A.pop)
 *                                   2 writing, in document order: its own <text> by kind (data-anim, style.as_anim):
 *                                     "type" for words someone wrote (A.type), "flip" for a label (A.flip),
 *                                     "ai" for generated words (A.think, then A.type), "flip" for a question
 *                                     type's or a run's name only (A.flip), "count" for a number (A.count);
 *                                     unmarked text or "key", presented words ("Q", "A", a band's title, the
 *                                     handle), keyed in quickly without a typo (A.type quick);
 *                                     its own stroked lines drawn by pen (A.draw)
 *                                   3 marker bands swept (A.highlight)
 *                                   4 gauges settle (A.fill)
 *                                   5 hand marks written ([data-verdict], A.write)
 *                                   Nested concepts and anything under [data-layer="frame"] (a logo) come
 *                                   in with the frame and are not taken apart. A container marked
 *                                   data-enter="drawn" (a list) instead has its rect[data-frame] drawn by hand,
 *                                   then its nested concepts enter, each by its own layers, one after another.
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
  A.write = function (el, o) {
    need(el, "write"); o = o || {};
    var P = paths(el), Ls = P.map(function (p) { return p.getTotalLength(); });
    var lift = o.lift == null ? 0.12 : o.lift, total = Ls.reduce(function (a, b) { return a + b; }, 0) || 1;
    var dur = o.dur == null ? 0.55 : o.dur, ink = dur - lift * (P.length - 1);
    var pen = function (x) { return x < 0.15 ? 0.5 * x * x / 0.15 : x < 0.75 ? 0.075 + (x - 0.15) * 1.25 : 0.825 + 0.175 * A.ease.out((x - 0.75) / 0.25); };
    var spans = [], at = 0;
    Ls.forEach(function (L) { var d = ink * L / total; spans.push([at, d]); at += d + lift; });
    return A.track(dur, function (u) {
      var t = u * dur;
      P.forEach(function (p, i) { drawTo(p, Ls[i], u >= 1 ? 1 : pen(clamp((t - spans[i][0]) / spans[i][1]))); });
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
    var T = texts(el), P = T.map(function (n) {
      var s0 = n.textContent, m = s0.match(/\d[\d,]*(\.\d+)?/);
      if (!m) return { s0: s0 };
      return { s0: s0, pre: s0.slice(0, m.index), post: s0.slice(m.index + m[0].length), v: parseFloat(m[0].replace(/,/g, "")),
               dec: m[1] ? m[1].length - 1 : 0, comma: m[0].indexOf(",") >= 0 };
    });
    var fmt = function (p, x) {
      var s1 = x.toFixed(p.dec);
      if (p.comma) { var parts = s1.split("."); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); s1 = parts.join("."); }
      return p.pre + s1 + p.post;
    };
    return A.track(o.dur == null ? 1.1 : o.dur, function (u) {
      var e = A.ease.out(u);
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
    var texts = T.map(function (n) { return n.textContent; }), total = texts.join("").length || 1;
    var cps = Math.max(o.quick ? 48 : 22, total / (o.dur || (o.quick ? 1.2 : 3.2)));   /* a typist's pace, quicker for long text */
    var budget = o.quick ? 0 : o.typos == null ? 2 : o.typos, left = budget;
    var plans = texts.map(function (S) {
      var p = keystrokes(S, cps, Math.min(left, S.length >= 24 ? 1 : 0));
      left -= p.made; return p;
    });
    var at = [], d = 0;
    plans.forEach(function (p) { at.push(d); d += p.dur + 0.05; });
    var caret = '<tspan fill="#8C8682">|</tspan>';
    var tr = A.track(d, function (u) {
      var t = u * d;
      T.forEach(function (n, i) {
        if (u >= 1) { n.textContent = texts[i]; return; }
        var p = plans[i], lt = t - at[i];
        if (lt < 0 || u <= 0) { n.textContent = ""; return; }      /* not begun: empty, and no caret yet */
        var s = "";
        for (var k = 0; k < p.keys.length && p.keys[k].t <= lt; k++) s = p.keys[k].s;
        var typing = lt < p.dur + 0.05;
        n.innerHTML = esc(s) + (typing ? caret : "");
      });
    });
    tr.cue = function (word) {                       /* the second at which `word` is fully typed, or null */
      for (var i = 0; i < texts.length; i++) {
        var m = texts[i].search(new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b"));
        if (m < 0) continue;
        var e = m + word.length, want = texts[i].slice(0, e), K = plans[i].keys;
        for (var k = 0; k < K.length; k++) if (K[k].s.length >= e && K[k].s.slice(0, e) === want) return at[i] + K[k].t;
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
    var w0 = bar.getAttribute("width"), min = parseFloat(bar.getAttribute("height")) || 0;
    var val = o.value || null, v0 = val ? val.textContent : null, top = parseFloat(v0);
    return A.track(o.dur == null ? 1.5 : o.dur, function (u) {
      if (u >= 1) { bar.setAttribute("width", w0); bar.style.opacity = ""; if (val) val.textContent = v0; return; }
      var k = 1 - Math.cos(u * Math.PI * 3) * Math.pow(1 - u, 2.6);         /* up, down, up, down, set */
      var f = clamp(frac * k);
      bar.setAttribute("width", Math.max(min, full * f).toFixed(2));
      bar.style.opacity = f <= 0.005 ? "0" : "";
      if (val && !isNaN(top)) val.textContent = String(Math.round(Math.min(100, Math.max(0, top * k))));
    });
  };

  /* ---- enter: one concept, layer by layer (see the list at the top) ---- */
  A.enter = function (el, o) {
    need(el, "enter"); o = o || {};
    var root = el.matches && el.matches("[data-concept]") ? el : (el.querySelector("[data-concept]") || el);
    var own = function (n) {
      return (n.closest("[data-concept]") === root || !root.matches("[data-concept]"))
        && !n.closest('[data-layer="frame"]') && !(n.ownerSVGElement && n.closest("svg") !== n.ownerSVGElement);
    };
    var q = function (sel) { return [].slice.call(root.querySelectorAll(sel)).filter(own); };
    var writing = q("text:not([data-value]), path, g[data-empty]").filter(function (n) {
      if (n.tagName.toLowerCase() === "g") return true;                          /* an empty place: it appears whole */
      if (n.closest("[data-empty]")) return false;
      if (n.tagName.toLowerCase() === "text") return true;
      return !n.closest("[data-verdict]") && !n.closest("[data-part]") && n.getAttribute("fill") === "none" && n.getAttribute("stroke") && n.getAttribute("stroke") !== "none";
    });
    var kind = function (n) { return n.getAttribute("data-anim") || "key"; };     /* a fixed word: keyed in quickly */
    var steps = [], run = [], runKind = null;
    var flush = function () {
      if (!run.length) return;
      if (runKind === "type") steps.push(A.type(run, { typos: o.typos }));
      else if (runKind === "ai") steps.push(A.seq.apply(null, run.map(function (n) { return A.seq(A.think(n), A.type([n], { typos: o.typos })); })));
      else if (runKind === "key") steps.push(A.type(run, { quick: true }));
      else if (runKind === "empty") steps.push(A.stagger(run, function (n) { return A.reveal(n, { dur: 0.3 }); }, 0.08));
      else steps.push(A.stagger(run, function (n) { return runKind === "flip" ? A.flip(n) : A.count(n, { dur: 0.6 }); }, 0.06));
      run = []; runKind = null;
    };
    writing.forEach(function (n) {
      if (n.tagName.toLowerCase() === "g") {
        if (runKind !== "empty") flush();
        runKind = "empty"; run.push(n);
      } else if (n.tagName.toLowerCase() === "text") {
        if (!n.textContent.trim()) return;
        var k = kind(n);
        if (k !== runKind) flush();
        runKind = k; run.push(n);
      } else { flush(); steps.push(A.draw(n, { dur: Math.min(0.6, Math.max(0.2, n.getTotalLength() / 1400)) })); }
    });
    flush();
    var drawn = root.getAttribute("data-enter") === "drawn";
    var first;
    if (drawn) {
      var frames = q("rect[data-frame]");
      var kids = [].slice.call(root.querySelectorAll("[data-concept]")).filter(function (n) { return n.parentNode.closest("[data-concept]") === root; });
      first = A.seq(frames.length ? A.draw(frames, { dur: 0.9 }) : null,
                    kids.length ? A.stagger(kids, function (n) { return A.enter(n); }, Math.min(0.1, 1.5 / kids.length)) : null);   /* each row enters by its own layers */
    } else first = A.pop(root);
    var hl = q("rect[data-hl]"), bars = q("rect[data-full]"), marks = q("[data-verdict]");
    var vals = q("text[data-value]");
    var scenes = [].slice.call(root.querySelectorAll('[data-concept="scene"]')).filter(function (n) { return n.parentNode.closest("[data-concept]") === root; });
    return A.seq(
      first,
      scenes.length ? (function () {                    /* the scene acts the words out as they are written */
        var words = A.seq.apply(null, steps);
        var cue = function (w) {
          for (var i = 0, off = 0; i < steps.length; off += steps[i].dur, i++) {
            var c = steps[i].cue ? steps[i].cue(w) : null;
            if (c != null) return off + c;
          }
          return null;
        };
        return A.par(words, A.par.apply(null, scenes.map(function (n) { return A.act(n, { cue: cue }); })));
      })() : A.seq.apply(null, steps),
      hl.length ? A.highlight(hl) : null,
      bars.length ? A.par.apply(null, bars.map(function (b, i) { return A.fill(b, { value: vals[i] }); })) : null,
      marks.length ? A.seq(A.wait(0.15), A.write(marks)) : null
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
    var end = parts.reduce(function (m, p) { return Math.max(m, p.at + p.dur); }, 0);
    var about = function (p, t) { return " translate(" + p.o[0] + "," + p.o[1] + ") " + t + " translate(" + (-p.o[0]) + "," + (-p.o[1]) + ")"; };
    var put = function (p, t, op) {
      var tf = (p.base + (t ? " " + t : "")).trim();
      if (tf) p.n.setAttribute("transform", tf); else p.n.removeAttribute("transform");
      p.n.style.opacity = op == null ? "" : String(op);
    };
    var len = end + (o.hold || 0.2);
    /* cue: inside a passage, each beat "word:second" of data-cues waits for its word to be typed;
       between beats the scene plays at its own pace and holds, or hurries if the words come faster */
    var marks = [[0, 0]];
    if (o.cue) (el.getAttribute("data-cues") || "").split(",").filter(Boolean).forEach(function (c) {
      var kv = c.split(":"), r = o.cue(kv[0]), sc = +kv[1], last = marks[marks.length - 1];
      if (r != null && sc > last[0] && r > last[1]) marks.push([sc, r]);
    });
    var lastM = marks[marks.length - 1], real = lastM[1] + (len - lastM[0]);
    var warp = function (r) {
      for (var i = 0; i < marks.length - 1; i++) {
        var a = marks[i], b = marks[i + 1];
        if (r < b[1]) { var sg = b[0] - a[0], rg = b[1] - a[1]; return rg >= sg ? a[0] + Math.min(r - a[1], sg) : a[0] + (r - a[1]) * sg / rg; }
      }
      return lastM[0] + (r - lastM[1]);
    };
    return A.track(real, function (u) {
      var t = warp(u * real);
      parts.forEach(function (p) {
        var v = clamp((t - p.at) / p.dur), e = A.ease.io(v);
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
