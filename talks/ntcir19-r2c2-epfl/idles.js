/* idles.js -- a scene's ENDING: its action played once, then its own small quiet idle, never the action again.
 *
 * The rule (PLAN.md, "A scene acts by the same rules", rule 9; the author, 5 November 2026: "similarly to the jknafou
 * "|" blinking at the end, each of the scene concept must have an ending, instead of relooping the whole animation"):
 * a scene (concepts/scene.py) acts ONCE (A.act), then settles into its IDLE: a short loop on the one or two parts that
 * carry its meaning (Hannibal's head tilting as he waits, the dashed reels picked out one by one and the "?" rocking,
 * the marquee's two titles switching once more and the "?" back), with at least a second of stillness between beats.
 *
 *   A.idle(scene)              the idle, one period (data-ip on the scene, seconds): a pure track that starts and ends
 *                              on the scene's rest, built from its [data-idle] parts (scene.py's `_idle`):
 *                                data-idle  the kind: tilt (rocks both ways and back), lean (one way and back), bob
 *                                           (rises and settles), throb (swells and back), dip (dims and back), flap (an
 *                                           idle-only copy, hidden at rest, flipping in and out on its beats), gap
 *                                           (hidden during its beats: flips out, flips back in), roam (runs to
 *                                           data-iv units along x on its odd beats and back on its even ones,
 *                                           hopping and leaning into the run, held still between: an even number
 *                                           of beats, so the period ends at rest; it faces the way it runs: a run
 *                                           against its drawing's facing, data-if, is mirrored, and the beat's
 *                                           last TURN s turn it back to its drawn facing, still, where it stopped)
 *                                data-ib    its beats' starts on the idle clock (s, comma-separated)
 *                                data-id    their lengths (one for all, or one per beat)
 *                                data-iv    its amount (degrees, units, a fraction)
 *                                data-io    its origin: c, b, t (its box's centre, bottom, top) or "x,y"
 *                                data-if    roam: the way its drawing faces (1 right, -1 left; default 1)
 *   A.settle(lead, idle)       `lead` played once, then `idle` round and round: a track as long as an hour, so a loop
 *                              runner (live.js, steps.js: t modulo the track's length) never comes back to the lead
 *                              while a speaker is on it. Its .lead and .period say how it is made (for media later:
 *                              the lead once, then the period looping)
 *   A.idling(scene, track)     `track`, with the scene's idle running all through it (a scene acted in an entry, idling
 *                              while the later groups play, until its card is put away)
 *   A.ending(scene, {again, acted})  a scene's whole end behaviour, the one call slides and review pages make: its act,
 *                              then its idle. `acted`: the act was just played (a step's enter acted it), so the idle
 *                              alone, from the act's last frame; `again`: its rest held a second, faded out and acted
 *                              once more from its start, then the idle. Re-entering the step starts it again.
 *
 * Why its own file: anim.js and live.js are in every validated slide's hash (slides/VALIDATED.json); this file is in
 * the hash only of the slides whose motions call it (tools/build.py), so slide 1 (whose scenes are posed emblems, with
 * no idle parts) is untouched. A.cycle and A.hold come from anim/steps.js, which is loaded before it.
 */
(function (G) {
  "use strict";
  var A = G.Anim;
  if (!A || !A.cycle || !A.hold) throw new Error("idles.js: load anim.js and steps.js first");
  var S2 = function (u) { var s = Math.sin(Math.PI * u); return s * s; };          /* 0 -> 1 -> 0, still at both ends */
  var ROCK = function (u) { return Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u); };   /* + then -, still at both ends */
  var KIND = {                                            /* each: u in [0, 1] of a beat -> {r, x, y, s, sy, op} */
    tilt: function (u, v) { return { r: v * ROCK(u) }; },
    lean: function (u, v) { return { r: v * S2(u) }; },
    bob: function (u, v) { return { y: -v * S2(u) }; },
    throb: function (u, v) { return { s: 1 + v * S2(u) }; },
    dip: function (u, v) { return { op: 1 - v * S2(u) }; }
  };
  var OUT = 0.15, IN = 0.25, BACK = 0.4;                  /* flap and gap: the board's flip out, flip in, the "?"'s pop back */
  var HOP = 2.5, LEAN = 7, STEPS = 3, TURN = 0.25;        /* roam: a step's hop (units), the lean into the run (deg), steps per run, a turn (s) */

  function parts(sc) {
    return [].slice.call(sc.querySelectorAll("[data-idle]")).map(function (n) {
      if (n.hasAttribute("data-act")) throw new Error("idles.js: an idle part must not be an act part (wrap it): " + n.outerHTML.slice(0, 80));
      var kind = n.getAttribute("data-idle");
      if (!KIND[kind] && kind !== "flap" && kind !== "gap" && kind !== "roam") throw new Error("idles.js: no idle kind " + kind);
      var at = (n.getAttribute("data-ib") || "0").split(",").map(Number);
      var d = (n.getAttribute("data-id") || "1").split(",").map(Number);
      if (at.concat(d).some(function (x) { return !isFinite(x); }))     /* a malformed beat would show a flap copy for ever */
        throw new Error("idles.js: bad data-ib/data-id on a " + kind + " part: " + n.getAttribute("data-ib") + " / " + n.getAttribute("data-id"));
      if (kind === "roam" && (at.length % 2 || !n.hasAttribute("data-iv") || d.some(function (x) { return x <= TURN; })))
        throw new Error("idles.js: a roam part needs an even number of beats (there and back: an odd run would leave it away from its rest), its distance (data-iv), and beats longer than its turn");
      return { n: n, kind: kind, at: at, dur: at.map(function (_, i) { return d[i] != null ? d[i] : d[0]; }),
               v: n.hasAttribute("data-iv") ? +n.getAttribute("data-iv") : null, io: n.getAttribute("data-io") || "c", o: null,
               face: n.getAttribute("data-if") === "-1" ? -1 : 1 };
    });
  }
  function origin(p) {                                    /* measured once, the first time a beat moves it (at rest by then) */
    if (p.o) return p.o;
    var m = p.io.split(",");
    if (m.length === 2) return (p.o = [+m[0], +m[1]]);
    var b = p.n.getBBox();
    if (!b.width && !b.height) return null;               /* not laid out yet (a hidden slide): try again next frame */
    return (p.o = [b.x + b.width / 2, p.io === "b" ? b.y + b.height : p.io === "t" ? b.y : b.y + b.height / 2]);
  }
  function put(p, st) {
    var n = p.n, tf = "";
    if (st && (st.r || st.s != null || st.sy != null || st.x || st.y)) {
      var o = origin(p);
      if (o) {
        tf = (st.x || st.y ? "translate(" + (st.x || 0).toFixed(2) + "," + (st.y || 0).toFixed(2) + ") " : "") +
             "translate(" + o[0] + "," + o[1] + ")" + (st.r ? " rotate(" + st.r.toFixed(2) + ")" : "") +
             (st.s != null || st.sy != null ? " scale(" + (st.s != null ? st.s : 1).toFixed(4) + "," + (st.sy != null ? st.sy : st.s != null ? st.s : 1).toFixed(4) + ")" : "") +
             " translate(" + (-o[0]) + "," + (-o[1]) + ")";
      }
    }
    if (tf) n.setAttribute("transform", tf); else n.removeAttribute("transform");
    n.style.opacity = st && st.op != null ? String(+st.op.toFixed(4)) : "";
  }
  function state(p, t) {                                   /* the part at t s on the idle clock; null: at rest */
    if (p.kind === "roam") {                                /* there on odd beats, back on even ones, held between */
      var x = 0;
      for (var j = 0; j < p.at.length; j++) {
        var sj = t - p.at[j], dj = p.dur[j], from = j % 2 ? p.v : 0, to = j % 2 ? 0 : p.v;
        if (sj < 0) break;
        if (sj >= dj) { x = to; continue; }
        var dir = to > from ? 1 : -1, mir = dir !== p.face, run = mir ? dj - TURN : dj;
        if (sj >= run) return { x: to, s: -Math.cos(Math.PI * (sj - run) / TURN), sy: 1 };   /* turning back, in place */
        var w = sj / run;
        return { x: from + (to - from) * A.ease.io(w), y: -HOP * Math.abs(Math.sin(STEPS * Math.PI * w)), r: dir * LEAN * S2(w),
                 s: mir ? -1 : null, sy: mir ? 1 : null };
      }
      return x ? { x: x } : null;
    }
    for (var i = 0; i < p.at.length; i++) {
      var s = t - p.at[i], d = p.dur[i];
      if (s < 0 || s > d) continue;
      if (p.kind === "flap") {                              /* flips in about its fold, shows, flips out */
        var k = s < IN ? A.ease.out(s / IN) : s > d - OUT ? 1 - A.ease.io((s - (d - OUT)) / OUT) : 1;
        return { sy: Math.max(0.001, k), op: 1 };
      }
      if (p.kind === "gap") {                               /* flips out, is gone, pops back in */
        if (s < OUT * 1.4) return { sy: Math.max(0.001, 1 - A.ease.io(s / (OUT * 1.4))) };
        if (s > d - BACK) { var v = (s - (d - BACK)) / BACK; return { s: Math.max(0.001, 1 - Math.cos(2.5 * Math.PI * v) * Math.exp(-4.2 * v)) }; }
        return { op: 0 };
      }
      return KIND[p.kind](s / d, p.v == null ? 0.1 : p.v);
    }
    return p.kind === "flap" ? { op: 0 } : null;            /* a flap copy is hidden at rest (markup opacity 0, kept) */
  }

  A.idle = function (sc) {
    if (!sc) throw new Error("A.idle: no scene");
    var P = parts(sc);
    if (!P.length) throw new Error("A.idle: the scene " + sc.getAttribute("data-scene") + " has no idle part (PLAN.md, scene rule 9)");
    var end = P.reduce(function (m, p) { return Math.max(m, Math.max.apply(null, p.at.map(function (a, i) { return a + p.dur[i]; }))); }, 0);
    var per = +sc.getAttribute("data-ip") || end + 1.2;
    if (per < end + 0.5) throw new Error("A.idle: " + sc.getAttribute("data-scene") + "'s period " + per + " s is shorter than its beats (" + end + " s)");
    return A.track(per, function (u) {
      var t = u * per;
      P.forEach(function (p) { put(p, state(p, t)); });
    });
  };

  var HOUR = 3600;
  A.settle = function (lead, idle) {
    var n = Math.max(1, Math.ceil(HOUR / idle.dur)), D = lead.dur + n * idle.dur;
    return { dur: D, lead: lead.dur, period: idle.dur, set: function (t) {
      if (t < lead.dur) { idle.set(0); lead.set(Math.max(0, t)); return; }
      lead.set(lead.dur);
      idle.set((t - lead.dur) % idle.dur);
    } };
  };

  /* `track`, with the scene (just acted) in its ending idle all the while it plays: an idle that starts when its own
     group ends and keeps going while later groups play (PLAN.md, "An idle starts when its own group ends") */
  A.idling = function (sc, track) {
    var idle = A.idle(sc);
    return { dur: track.dur, set: function (t) { track.set(t); idle.set(Math.max(0, Math.min(t, track.dur)) % idle.dur); } };
  };

  A.ending = function (sc, o) {
    o = o || {};
    if (!sc) throw new Error("A.ending: no scene (check the data-a name)");
    var act = A.act(sc);
    var lead = o.acted ? A.hold(act, 0) : !o.again ? act : A.cycle(
      A.par(A.hold(act, o.rest == null ? 1.0 : o.rest), A.reveal(sc, { dur: 0 })),   /* the rest, a moment */
      A.par(A.hold(act, 0.35), A.hide(sc, { dur: 0.35 })),                          /* faded out */
      A.par(act, A.reveal(sc, { dur: 0.3 })));                                      /* acting again, once */
    return A.settle(lead, A.idle(sc));
  };
})(window);
