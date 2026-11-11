/* deck.js -- the linear deck: one 16:9 stage, slides in order, pictures and videos by default.
 *
 * Simplified from the research-day talk's shell (world/talk/talk.js, 27 October 2026): no world,
 * no islands; the same keys, bar, offline cache, fit, timer and cursor.
 *
 *   DEFAULT     a slide WITH MEDIA (one the author has validated: media/media.json lists its rest-<k>)
 *               is at rest a crisp still (media/rest-<k>.webp, 2x) with its rest loop over it
 *               (loop-<k>.mp4) when it has one; arriving FORWARD plays its entry (in-<k>.mp4) at 1x,
 *               arriving BACKWARD shows its rest at once (a 0.35 s cross-fade). No video ever plays
 *               backwards, and leaving a slide never replays it.
 *               A slide WITHOUT media (not validated: no video may exist for it, tools/make_media.mjs)
 *               is played LIVE, by the same rules, from live.html in an iframe over the stage, which
 *               drives its own timelines. Going between the two, the arriving one is laid on top of the
 *               leaving one and the leaving one is cleared once covered, so nothing stale stays on top.
 *   ?live=1     every slide live.
 *   ?reduced=1  (or the OS setting) cuts between the rests (stills, or the live page at rest); nothing moves.
 *   ?chrome=0   hides the bar.   #/k opens slide k, #/k.s its step s.
 *
 * NAVIGATION (the author, 4 November 2026, on build/rules.html: "if pressing <- or -> mid animation,
 * it should just stop the animation to move to the selected slide (we can navigate by pressing
 * multiple times to arrow keys..)"):
 *   1. → at rest: the next slide's entry plays at its designed speed (1x), then its rest (loop/idle).
 *      A slide that continues the last (one without steps) starts on its rest, with no exit.
 *   LEAVING A SLIDE (the author, 5 November 2026: "the disappearance should be reworked and standardized"): → from
 *      its last step, ← from its overview, or any jump to another slide is ONE move. The stage's current frame,
 *      exactly as shown (an entry or a loop frozen where it is), fades out to the empty paper in 0.35 s under the
 *      VEIL (a paper-coloured layer over every slide layer, under the marks: the HES-SO mark, the corner unit and
 *      the slide number never move); under the paper the target is set, and the veil is lifted at once: forward
 *      on the entry's own first frame, which then plays; backward on the target's rest (from the next slide, its
 *      last step's). Nothing else is ever shown on the way: no overview, no other step, no cross-fade of two
 *      pictures. A press during that fade sends the veil on from where it is.
 *   2. → or ← while an entry (or a fade) plays: it stops at once, and the stage moves to the slide
 *      the key selects. Nothing is hurried to its end (another slide: by the fade to paper, above).
 *   3. Presses each within BURST (0.5 s) of the last are one move: every press moves the destination
 *      at once and the bar shows it ("→ 7 · title"); a press inside the window starts the target's
 *      entry only once the keys have been quiet for BURST, so no slide in between is played (the
 *      first press's entry, under 0.5 s old, is cut).
 *   4. Direction decides how a slide is arrived at: forward (→, End, a part ahead) with its entry at
 *      1x; backward (←, Home, T, a part behind) at rest, after the fade to paper, its loop restarting.
 *   ?reduced=1: cuts between rest stills, in both directions.
 *
 * STEPS OF ATTENTION (the author, 4 November 2026: "I want to present the slides as a whole when changing slide so
 * people can start reading, then I want to speak about the first item and draw attention to it, then the second and
 * third"; anim/steps.js): a slide may have steps 1..n after its entry (its overview, step 0). The deck is then a line
 * of POSITIONS (slide k, step s): (1, 0), (2, 0), (2, 1) ... (2, n), (3, 0) ...
 *   the NEXT POSITION (→ on a step, ↓ on an overview, Space, PageDown, Enter; see TWO LEVELS below): after the entry (or a step) to the next step, playing its enter (<= ~0.8 s, from the
 *     step before's rest, laid on at once when that rest is what is shown, else faded to in 0.35 s), then its loop;
 *     after the last step to the next slide, by the rules above: the fade to paper. A slide after one with steps is
 *     never continued (anim/steps.js clears its CONTINUES), so it starts on its own first frame.
 *   the PREVIOUS POSITION (← on a step, PageUp, Backspace), AT REST: the previous step's rest, by a 0.35 s fade
 *     through paper within the slide (the overview: by a glide, below); from a slide's overview (PageUp, Backspace)
 *     the previous slide's last step, after the fade to paper. Its
 *     loop restarts. Nothing is played backwards.
 *   a press during a step's enter stops it where it is and moves at once, as during an entry.
 *   a BURST of k presses moves k positions, across steps and slides alike; once the keys are quiet the target's own
 *     motion plays (its entry, or its step's enter, faded to from what is shown). The first press's motion starts at
 *     once (a step from rest has no fade to wait behind) and is cut by the second.
 *   Home, End, T and the part keys land on a slide's overview (step 0).
 *   The bar shows "slide k / N · step s/n" on a slide with steps; the hash is #/k, or #/k.s on a step.
 *
 * NUMBERING AND TWO LEVELS (the author, 5 November 2026: "Their should be a normalization between slide number and
 * animation number [...] slide number and animation number should always writen on the bottom/right [...] a
 * navigation by level <- -> for the slide 1,2,3... and then top down for the level"; PLAN.md §Navigation):
 *   one name per position, on every slide: the overview (entry and rest) is "k", step s is "k.s"; the corner number,
 *   the hash (#/k, #/k.s, deep-linkable) and the bar all show it, in every mode.
 *   TWO MODES (the author, 5 November 2026: "The presentation mode should be the default navigation"): PRESENTATION,
 *     the default on every opening: ← → are the linear order (as PageDown / PageUp below), 1, 2, 2.1 ... 3, 3.1 ...;
 *     ↑ or ↓ leaves it for NAVIGATION, the same press doing its move there (↓ N.1, ↑ N; a bump still switches); P
 *     returns to presentation in place. ?nav=1 opens in navigation. The corner shows the mode, faint, above the
 *     position: "nav", or "pres" ("short" over "pres" on the short build; header: X). The levels below are NAVIGATION mode's.
 *   SLIDE LEVEL (an overview): ← → go to the previous / next slide's overview (forward its entry, backward its rest,
 *     after the fade to paper); ↓ enters the steps at k.1, playing its enter (nothing on a slide without steps).
 *   STEP LEVEL (k.s): → plays k.s+1, and past the last step goes to the next slide's overview; ← lands at k.s-1's
 *     rest; ← on k.1 and ↑ on any step both return to the overview k at rest, its camera and dimming undone by a
 *     GLIDE (0.5 s, on a live slide; a cross-fade on a video slide, or where there is nothing to undo).
 *   LINEAR (a clicker): Space, PageDown, Enter go to the next position in order (overview, its steps, the next
 *     slide); PageUp, Backspace to the previous one (from an overview: the previous slide's last step, at rest).
 *   ZONES (both modes; a click never changes the mode): a slide may declare zones {step: part} (anim/steps.js); on its overview and on any of its steps a click on
 *     a zone plays that step's enter from the picture shown, the camera gliding from where it is (no fade within the
 *     slide; a video slide fades to the enter's first frame); hovering one shows a pointer and a faint outline.
 *   Every rule above still holds: a press mid-motion stops it and moves, a burst is one move.
 *   Media (validated slides only): rest-<k>-<s>.webp, st-<k>-<s>.mp4 (the enter), stl-<k>-<s>.mp4 (the loop), and
 *   media.json's steps {k: n}; a live slide's steps are its timelines' (Live.info()[k-1].steps).
 *   ← →   presentation mode: the linear order; navigation mode: slides (on a step: steps)
 *   ↓ ↑   enter navigation mode: into the steps / back to the overview     P   back to presentation mode
 *   Space PageDown Enter   next, in order        PageUp Backspace   previous, in order      Home / End   first / last
 *   1-9, 0             slide 1 to 9, 0 slide 10, at its overview (the author, 8 November 2026); a part by its own letter (deck.json parts[].key)
 *   T                  the title (slide 1)
 *   G                  the slide grid      L the progress line on / off      Z or `   back to before the last jump
 *   B or .             blank screen (any key or a click returns)      C the bar on / off
 *   F or F5 full screen      S timer (minutes; S again restarts)    O offline panel    H help
 *   X                  the short version on / off: ANOTHER DECK at the same position (the author, 10 November 2026; PLAN.md
 *                      "Short version, re-planned"): tools/build.py --short builds it into build/short/, every slide of
 *                      the deck but those with a variant in slides/short/, replaced by it, numbered 1-12 as here. Its
 *                      deck.json says "short_build" (X: location.replace("../")), the full one's "has_short" (X:
 *                      location.replace("short/")), the hash and the other query parameters (?live=1 ...) kept. The
 *                      corner shows the mode always: "pres", "short" over "pres" on the short build, "nav" on either.
 *                      ?short=1 on the full deck opens the short one (the same replace).
 *   A held key (auto-repeat) is one press: its repeats are ignored. Ctrl/Alt/Cmd combinations are the browser's.
 *
 * THE PROGRESS LINE (the author, 8 November 2026: "the progress bar should evolve with the slide animation, e.g. 5.4,
 *   5.5...."): a 2 px hairline in the muted ink (#8C8682) along the stage's bottom edge, below the marks (they end at
 *   y 877 of 900), over the veil like them. The line of positions 1, 2, 2.1 ... 12 is cut in EQUAL shares, one per
 *   position (each position is one press of the speaker; weighting by motion time would make a slide of long entries
 *   look "longer" than the talk time spent on it, which the motion does not decide). Position i of P sits at i/(P-1).
 *   One press forward to the next position (not in a burst): the line grows from the previous position's mark to the
 *   new one DRIVEN BY THE MOTION'S OWN PLAYBACK (the video's currentTime / duration, the live timeline's t / dur), so
 *   it moves with the entry or the step's enter and is still while the fade to paper runs; any other move (a burst, a
 *   jump, a part or number key, the grid) puts it on the target's mark at once (250 ms ease forward, a cut backward);
 *   at rest it sits exactly on the position's mark, and loops never move it. B hides it, on by default at every
 *   opening. It is the player's (index.html), never live.html's, so no recorded video holds it (tools/make_media.mjs
 *   records live.html).
 * NAVIGATION AIDS (the author, 8 November 2026: "add the navigation features we spoke about"):
 *   THE BAR (#strip: the crumb, the position, the timer) is the speaker's: hidden in full screen (the API's, or a window
 *     as large as the screen), shown in a window; C overrides that either way until pressed again or until full screen is entered or left. The timer runs on
 *     while the bar is hidden.
 *   BLANK: B or "." (a clicker's blank-screen button sends one of them) lays plain paper over the whole window, the
 *     marks and the bar included; any key or a click takes it away and does nothing else, so the deck is back at the
 *     same position. A motion playing when it was blanked plays on under the paper.
 *   JUMP BACK: a JUMP is a move not in the linear order: the grid, 1-9 and 0, a part's letter, Home, End, T, a click
 *     on a zone, and Z itself. Z (or `) goes back to the position held before the last jump, at rest (as ←: no entry
 *     replayed), and records the one it left, so Z twice returns to the jump's target (also at rest).
 *   F5 (Shift+F5: a clicker's "present" button) toggles full screen instead of reloading.
 *   THE WARM PASS: 4 s after the opening, and only while the deck is at rest, every video of media.json (the entries,
 *     step enters, loops and leads; 127 files, 74 MB on 8 November 2026) is read once, in the talk's order from the
 *     current slide on, into a detached <video preload=auto> that is released at its first decoded frame
 *     (loadeddata): one decoder at a time, none kept, so memory stays flat. The files land in the browser's caches
 *     (the service worker's media cache, filled from offline-manifest.json, already holds them over http(s); this pass
 *     also covers a server without it) and the platform's decoders are warmed. Decoding all of them and keeping the
 *     frames was refused: ~127 decoders at 1920x1080 is gigabytes.
 * THE SLIDE GRID (G): every slide's rest at its overview as a thumbnail (media/rest-<k>.webp, the versioned still the
 *   player and its offline cache already hold, decoded once at 640x360; a live slide: its number on paper), numbered
 *   and titled, 4 columns; the current slide outlined in ink. ← → ↑ ↓ choose, Enter (or a click) jumps to that
 *   slide's overview by the rules of any jump; G or Esc closes it; any other key closes it and acts. It is shown to
 *   the audience: it is in the one window.
 */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var LIVE = params.get("live") === "1";
  var REDUCED = params.get("reduced") === "1" || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (params.get("chrome") === "0") document.body.classList.add("nochrome");
  var $ = function (id) { return document.getElementById(id); };
  var box = $("box"), strip = $("strip"), crumb = $("crumb"), pos = $("pos"), restImg = $("rest");
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var nextFrame = function () { return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); };
  function bump() { strip.classList.remove("bump"); void strip.offsetWidth; strip.classList.add("bump"); }
  var ERR = [];
  window.addEventListener("error", function (e) { ERR.push(String(e.message || e)); });

  var CFG = {}, SL = [], MED = null, N = 0, cur = 1, curS = 0;
  var FADE = 350, BURST = 500;

  /* ---- one navigation at a time: every key press starts a new GENERATION; whatever an older one
   * was doing (a fade, an entry, a wait) sees it is stale at its next step and gives up, leaving the
   * picture where it was for the new one to fade from. ------------------------------------------ */
  var NAV = { gen: 0, phase: "rest", dir: 0, last: 0, wakers: [], played: [], cue: null };   /* played: the entries and step enters started, for the walk */
  function stale(my) { return my !== NAV.gen; }
  function setPhase(p) { NAV.phase = p; if (p === "rest") progRest(); update(); }
  /* resolves when the generation `my` is superseded */
  function superseded(my) { return new Promise(function (r) { if (stale(my)) r(); else NAV.wakers.push(r); }); }
  /* the burst: wait until the keys have been quiet for BURST (false if a newer press came) */
  async function quiet(my) {
    for (;;) {
      var left = BURST - (performance.now() - NAV.last);
      if (stale(my)) return false;
      if (left <= 0) return true;
      await sleep(Math.min(left, 60));
    }
  }

  /* ---- the media renderer ---------------------------------------------------- */
  function video(src, poster) {
    var v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    if (poster) v.poster = poster;
    v.src = src; return v;
  }
  function ready(v, ms) {
    return new Promise(function (res) {
      if (v.readyState >= 3) return res(true);
      var done = false, fin = function (ok) { if (!done) { done = true; res(ok); } };
      v.addEventListener("canplay", function () { fin(true); }, { once: true });
      v.addEventListener("error", function () { fin(false); }, { once: true });
      setTimeout(function () { fin(v.readyState >= 2); }, ms || 5000);
    });
  }
  function firstFrame(v) {
    return new Promise(function (res) {
      var done = false, fin = function () { if (!done) { done = true; res(); } };
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(function () { fin(); });
      else v.addEventListener("playing", function () { requestAnimationFrame(fin); }, { once: true });
      setTimeout(fin, 600);
    });
  }
  function seek0(v) {
    return new Promise(function (res) {
      if (v.currentTime === 0 && v.readyState >= 2) return res();
      var to = setTimeout(res, 800);
      v.addEventListener("seeked", function () { clearTimeout(to); res(); }, { once: true });
      try { v.currentTime = 0; } catch (e) { clearTimeout(to); res(); }
    });
  }
  /* every still and video by a versioned URL: its content hash (media.json's v), so a re-rendered file is never
     answered from an older copy (sw.js, "a never-stale media file") */
  var mediaUrl = function (name, ext) { var f = MED && MED.files && MED.files[name]; return "media/" + name + "." + ext + (f && f.v ? "?v=" + f.v : ""); };
  var restUrl = function (k, s) { return mediaUrl("rest-" + k + (s ? "-" + s : ""), "webp"); };
  var loopName = function (k, s) { return s ? "stl-" + k + "-" + s : "loop-" + k; };
  var cueName = function (k, s) { return s ? "st-" + k + "-" + s : "in-" + k; };
  var has = function (name) { return !LIVE && !!(MED && MED.files && MED.files[name]); };
  var media = function (k) { return has("rest-" + k); };        /* a validated slide: its stills and videos exist */
  /* the rests preloaded, each an <img> DECODED ahead (← lands on one within 0.7 s: the 2x still is not decoded on the
     press, and the one faded in becomes the rest itself, so it is not decoded a second time; takeImg) */
  var imgs = {}, imgEl = {};
  function preImg(k, s) {
    if (k < 1 || k > N || !media(k) || (s && !has("rest-" + k + "-" + s))) return null;
    var u = restUrl(k, s);
    if (!imgs[u]) { var im = new Image(); im.alt = ""; im.src = u; imgEl[u] = im; imgs[u] = im.decode ? im.decode().catch(function () {}) : Promise.resolve(); }
    return imgs[u];
  }
  /* the decoded <img> of (k, s)'s rest, taken out of the cache (it is laid on the stage); a new one when none is free */
  async function takeImg(k, s) {
    var u = restUrl(k, s);
    await preImg(k, s);
    var im = imgEl[u];
    if (im && !im.isConnected) { delete imgs[u]; delete imgEl[u]; return im; }
    im = document.createElement("img"); im.alt = ""; im.src = u;
    if (im.decode) await im.decode().catch(function () {});
    return im;
  }
  /* a still faded in over the stage becomes the rest (#rest), in place of the old one: no second decode */
  function adoptRest(im) {
    im.className = ""; im.id = "rest"; im.style.transition = "none"; im.style.opacity = ""; im.style.zIndex = ""; im.style.visibility = "";
    box.insertBefore(im, restImg); restImg.remove(); restImg = im;
  }
  var moves = {};
  function moveVideo(name) {
    var u = mediaUrl(name, "mp4");
    if (moves[u]) { moves[u].t = performance.now(); return moves[u].v; }
    var v = video(u); v.className = "movevid"; box.appendChild(v);
    moves[u] = { v: v, t: performance.now() };
    var keys = Object.keys(moves);
    if (keys.length > 6) keys.sort(function (a, b) { return moves[a].t - moves[b].t; }).slice(0, keys.length - 6).forEach(function (k) {
      var e = moves[k].v; if (!e.paused || e.classList.contains("on")) return;
      delete moves[k]; e.removeAttribute("src"); e.load(); e.remove();
    });
    return v;
  }
  /* A SCENE'S ENDING (anim/idles.js: its lead once, then its idle round and round) comes as two files
     (tools/make_media.mjs): lead-<k>[-<s>].mp4, played once, then the loop's file, one idle period, looped; a loop
     whose ending has no lead (a scene acted in the step's enter) is its period alone. The period is laid on over the
     lead's last frame the moment the lead ends: its first frame is the state the lead ends on. */
  var leadName = function (k, s) { return "lead-" + k + (s ? "-" + s : ""); };
  var loopEl = null, loopK = null, leadEl = null;  /* loopK: the name of the loop playing (loop-<k>, stl-<k>-<s>) */
  function dropVideo(v) { try { v.pause(); } catch (e) {} v.removeAttribute("src"); try { v.load(); } catch (e) {} v.remove(); }
  function stopLoop() {
    if (leadEl) { dropVideo(leadEl); leadEl = null; }
    if (!loopEl) return;
    var v = loopEl; loopEl = null; loopK = null;
    dropVideo(v);
  }
  async function startLoop(k, s) {
    var name = loopName(k, s), lead = has(leadName(k, s)) ? leadName(k, s) : null;
    if (REDUCED || !has(name)) { stopLoop(); return; }
    if (loopK === name && loopEl && !lead) { try { loopEl.currentTime = 0; } catch (e) {} return; }   /* its loop from the start */
    stopLoop();
    var v = video(mediaUrl(name, "mp4"), restUrl(k, s)); v.loop = true; v.className = "loopvid";
    box.insertBefore(v, restImg.nextSibling);
    loopEl = v; loopK = name;
    var l = null;
    if (lead) { l = video(mediaUrl(lead, "mp4"), restUrl(k, s)); l.className = "loopvid"; box.insertBefore(l, v.nextSibling); leadEl = l; }
    await Promise.all([ready(v, 3000), l ? ready(l, 3000) : null]);
    if (loopEl !== v) return;
    if (l) {                                        /* the lead once, over the period (paused on its first frame) */
      var p0 = l.play(); if (p0 && p0.catch) p0.catch(function () {});
      await firstFrame(l);
      if (loopEl !== v) return;
      l.classList.add("on");
      await new Promise(function (r) { l.addEventListener("ended", r, { once: true }); l.addEventListener("error", r, { once: true }); });
      if (loopEl !== v) return;
    }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    await firstFrame(v);
    if (loopEl !== v) return;
    v.classList.add("on");
    if (l && leadEl === l) { leadEl = null; dropVideo(l); }
  }
  async function setRest(k, s, my) {
    await preImg(k, s);
    if (stale(my)) return;
    if (restImg.getAttribute("src") === restUrl(k, s) && restImg.complete) return;   /* adopted: already this still, decoded */
    restImg.src = restUrl(k, s);
    if (restImg.decode) await restImg.decode().catch(function () {});
  }
  /* the layers over the rest: each new one is laid on top of everything shown so far */
  var Z = 5, curMove = null, topEl = null;
  function onTop(el) { el.style.zIndex = String(++Z); topEl = el; }
  async function fadeIn(el, ms) {
    el.style.transition = "none"; el.style.opacity = "0"; el.classList.add("on"); onTop(el);
    await nextFrame();
    el.style.transition = ms ? "opacity " + ms + "ms ease" : "none"; el.style.opacity = "1";
    if (ms) await sleep(ms);
  }
  function freeze() { if (curMove) { try { curMove.pause(); } catch (e) {} curMove = null; } }   /* an entry stops where it is */
  /* drop every layer but `keep` (the stage is now the rest, or `keep` alone) */
  function clearLayers(keep) {
    Object.keys(moves).forEach(function (u) {
      var v = moves[u].v; if (v === keep) return;
      try { v.pause(); } catch (e) {}
      v.classList.remove("on"); v.style.transition = "none"; v.style.opacity = ""; v.style.zIndex = "";
    });
    [].slice.call(box.querySelectorAll(".jumpimg")).forEach(function (im) { if (im !== keep) im.remove(); });
  }
  /* ---- the VEIL: leaving a slide, the stage fades out to the empty paper under it (the marks stay over it) ---- */
  var veil = null, veilUp = false;
  function veilTo(v, ms) {
    if (!veil) { veil = document.createElement("div"); veil.id = "veil"; veil.setAttribute("aria-hidden", "true");
      veil.style.cssText = "position:absolute;inset:0;z-index:99999;background:var(--paper);opacity:0;pointer-events:none"; box.appendChild(veil); }
    var now = +getComputedStyle(veil).opacity || 0;
    ms = Math.round((ms || 0) * Math.abs(v - now));                /* from where it is: a press mid-fade goes on, not over */
    veil.style.transition = ms ? "opacity " + ms + "ms linear" : "none"; veil.style.opacity = String(v);
    veilUp = v > 0;
    /* what the stage shows under the marks (UNDER): lifted, the slide now set; once at paper, none (the foot band) */
    if (v === 0 && under !== cur) { under = cur; layoutLogos(); }
    var done = ms ? sleep(ms) : Promise.resolve();
    return v < 1 ? done : done.then(function () {
      if (veilUp && +getComputedStyle(veil).opacity >= 0.999 && under !== null) { under = null; layoutLogos(); } });
  }
  /* the current frame, exactly as shown, frozen and faded to paper; false if a newer press came meanwhile */
  async function leave(my) {
    freeze();
    if (loopEl) { try { loopEl.pause(); } catch (e) {} }
    if (leadEl) { try { leadEl.pause(); } catch (e) {} }   /* an ending's lead still playing is frozen too (it kept moving under the fade) */
    if (W && W.Live) W.Live.stopLoop();
    if (REDUCED) { await veilTo(1, 0); return !stale(my); }
    await veilTo(1, FADE);
    return !stale(my);
  }
  /* the media renderer's own picture gone (a live slide now covers the stage) */
  function hideMedia() { freeze(); stopLoop(); clearLayers(null); restImg.style.visibility = "hidden"; }
  async function arriveAtRest(k, s, my) {
    await setRest(k, s, my); if (stale(my)) return;
    restImg.style.visibility = "";
    startLoop(k, s);                  /* not waited for: it is laid over the rest still once it plays */
    clearLayers(null); hideFrame();
    setPhase("rest");
  }
  var MEDIA = {
    /* opening the deck is arriving forward: the first slide shown plays its entry (the author, 4 November 2026:
       "I don't see the animation when starting the slideshow"); a key pressed meanwhile stops it as any other.
       It starts on the entry's first frame, laid on the empty stage at once: the rest is never shown first
       (it flashed the finished slide before its animation) */
    init: async function (k, s) {
      var my = NAV.gen;
      if (s || REDUCED || !has("in-" + k)) { await setRest(k, s, my); restImg.style.visibility = ""; startLoop(k, s); return; }
      MEDIA.forward(k, 0, true, my, false);
    },
    /* forward onto (k, s): (fade to) its motion's first frame (the entry, or step s's enter), wait out the burst,
       play it at 1x, rest */
    forward: async function (k, s, seamless, my, inBurst, paper) {
      freeze();
      var name = cueName(k, s);
      if (REDUCED || !has(name)) return MEDIA.back(k, s, my, paper);
      setPhase("fade");
      var v = moveVideo(name);
      await ready(v, 6000); if (stale(my)) return;
      await seek0(v); if (stale(my)) return;
      v.playbackRate = 1;
      /* a continued slide's first frame is the rest just left: laid on at once (120 ms over a loop,
         whose phase is not frame 0); anything else is faded to, which is the exit */
      if (paper) {                                  /* under the veil: the entry's first frame alone, then the veil lifted */
        await fadeIn(v, 0); if (stale(my)) return;
        /* the leaving slide's rest still hidden too: lifted before the entry's first frame is painted, the veil showed
           it again for a frame (the walk, 8 November 2026: "98 % of what only A inked is inked"); now that frame is
           paper. arriveAtRest shows the still again, set to this slide's rest */
        restImg.style.visibility = "hidden";
        stopLoop(); clearLayers(v); hideFrame(); await veilTo(0, 0);
      } else { await fadeIn(v, seamless ? (loopEl ? 120 : 0) : FADE); if (stale(my)) return; }
      if (inBurst) { setPhase("hold"); if (!(await quiet(my))) return; }
      stopLoop(); clearLayers(v); hideFrame();
      var ended = new Promise(function (r) { v.addEventListener("ended", r, { once: true }); v.addEventListener("error", r, { once: true }); });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      curMove = v; NAV.played.push(name); NAV.cue = name; setPhase("entry");
      progPlay(my, function () { return v.duration ? v.currentTime / v.duration : 0; });
      preImg(k, s);
      await Promise.race([ended, superseded(my)]);
      if (stale(my)) return;
      curMove = null;
      await arriveAtRest(k, s, my);
    },
    /* backward onto (k, s) (or a cut): its rest faded in over whatever is shown, then its loop restarts */
    back: async function (k, s, my, paper) {
      freeze();
      setPhase("fade");
      await preImg(k, s); if (stale(my)) return;
      if (paper) {                                  /* under the veil: the rest alone, then the veil lifted */
        await setRest(k, s, my); if (stale(my)) return;
        restImg.style.visibility = ""; stopLoop(); clearLayers(null); hideFrame();
        await veilTo(0, 0);
      } else if (!REDUCED) {
        var im = await takeImg(k, s); im.className = "jumpimg";
        if (stale(my)) return;
        box.appendChild(im);
        await fadeIn(im, FADE);
        if (stale(my)) return;          /* (a newer press fades from it as shown; clearLayers removes it after) */
        stopLoop(); clearLayers(im); adoptRest(im);
      }
      await arriveAtRest(k, s, my);
    },
    preload: function (k, s) {                      /* the next position's motion, the stills either side */
      var nx = nextPos(k, s), pv = prevPos(k, s);
      if (!REDUCED && nx && has(cueName(nx[0], nx[1]))) moveVideo(cueName(nx[0], nx[1]));   /* has() and preImg() skip live slides */
      if (nx) preImg(nx[0], nx[1]);
      if (pv) preImg(pv[0], pv[1]);
      for (var j = 0; j <= nst(k); j++) preImg(k, j);   /* every rest of this slide's steps: ← lands on one at once */
      preImg(1, 0);
    }
  };

  /* ---- the live renderer: every slide without media (or all, ?live=1), the same rules over live.html,
   * its timelines driven from here. One iframe, loaded once, holds every slide; it is shown on top while a
   * live slide is on the stage and hidden (its loop stopped) once a media slide has covered it. ---------- */
  var frame = null, W = null, INFO = null, frameP = null;
  function ensureFrame(k) {
    if (frameP) return frameP;
    frameP = new Promise(function (res) {
      frame = document.createElement("iframe"); frame.src = "live.html?embed=1&k=" + k; frame.title = "slides";
      frame.style.pointerEvents = "none"; frame.tabIndex = -1;
      frame.style.opacity = "0"; frame.style.visibility = "hidden";
      box.appendChild(frame);
      frame.addEventListener("load", function () {
        W = frame.contentWindow;
        (function wait() {
          if (W.Live && W.document.documentElement.getAttribute("data-ready")) { INFO = W.Live.info(); res(); }
          else setTimeout(wait, 50);
        })();
      });
    });
    return frameP;
  }
  function frameShown() { return !!frame && frame.style.visibility !== "hidden" && topEl === frame; }
  function hideFrame() {
    if (!frame || frame.style.visibility === "hidden") return;
    if (W && W.Live) W.Live.stopLoop();
    frame.style.transition = "none"; frame.style.opacity = "0"; frame.style.visibility = "hidden";
  }
  var liveLoopAt = { k: 0, s: 0, t: 0 };           /* when the live page's loop of slide k (step s) last started (an overlay's caret follows it) */
  function liveLoop(k, s) { W.Live.startLoop(k, s || 0); liveLoopAt = { k: k, s: s || 0, t: performance.now() }; }
  function liveFade(to, ms) {
    frame.style.transition = ms ? "opacity " + ms + "ms ease" : "none"; frame.style.opacity = String(to);
    return ms ? sleep(ms) : Promise.resolve();
  }
  /* lay the live page, already set to its first picture, over whatever is shown, in `ms` */
  async function frameOver(ms) {
    frame.style.transition = "none"; frame.style.opacity = "0"; frame.style.visibility = ""; onTop(frame);
    await nextFrame();
    await liveFade(1, ms);
  }
  /* go to the live picture `set` (a function setting the live page): from the live page itself by a fade
     through paper (half out, half in), from anything else by fading the live page in over it */
  async function liveTo(set, my, ms, seamless, paper) {
    if (paper) {                                    /* under the veil: the picture set and shown alone, then the veil lifted */
      set();
      frame.style.transition = "none"; frame.style.opacity = "1"; frame.style.visibility = "";
      if (topEl !== frame) onTop(frame);
      hideMedia(); await veilTo(0, 0);
      return !stale(my);
    }
    if (frameShown()) {
      if (!seamless) { await liveFade(0, ms / 2); if (stale(my)) return false; }
      hideMedia(); set();
      if (!seamless) { await liveFade(1, ms / 2); if (stale(my)) return false; }
    } else {
      set();
      await frameOver(seamless ? (loopEl ? 120 : 0) : ms); if (stale(my)) return false;
      hideMedia();
    }
    return true;
  }
  var LIVER = {
    init: async function (k, s) {
      var my = NAV.gen; await ensureFrame(k);
      if (s || REDUCED || !(INFO[k - 1].entry > 0)) { await liveTo(function () { W.Live.step(k, s); if (!REDUCED) liveLoop(k, s); }, my, 0, false); return; }
      LIVER.forward(k, 0, true, my, false);    /* opening is arriving forward, as with media: the live page shown at once at its entry's start, never its rest first */
    },
    /* forward onto (k, s): its entry (s = 0) or step s's enter, from its first frame, at 1x; then its rest and loop */
    forward: async function (k, s, seamless, my, inBurst, paper) {
      freeze();
      await ensureFrame(k); if (stale(my)) return;
      var st = s ? (INFO[k - 1].steps || [])[s - 1] : null, dur = s ? (st ? st.enter : 0) : INFO[k - 1].entry;
      if (REDUCED || !(dur > 0)) return LIVER.back(k, s, my, paper);
      var at = s ? function (t) { W.Live.stepEnter(k, s, t); } : function (t) { W.Live.entry(k, t); };
      W.Live.stopLoop(); setPhase("fade");
      if (!(await liveTo(function () { at(0); }, my, FADE, seamless, paper))) return;
      if (inBurst) { setPhase("hold"); if (!(await quiet(my))) return; }
      var name = cueName(k, s);
      NAV.played.push(name); NAV.cue = name; setPhase("entry");
      var t0 = performance.now();
      progPlay(my, function () { return (performance.now() - t0) / 1000 / dur; });
      for (;;) {
        await new Promise(function (r) { requestAnimationFrame(r); });
        if (stale(my)) return;                                   /* stopped where it is */
        var t = (performance.now() - t0) / 1000;
        if (t >= dur) break;
        at(t);
      }
      W.Live.step(k, s); liveLoop(k, s); setPhase("rest");
    },
    back: async function (k, s, my, paper) {
      freeze();
      await ensureFrame(k); if (stale(my)) return;
      if (W.Live) W.Live.stopLoop();
      setPhase("fade");
      if (!(await liveTo(function () { W.Live.step(k, s); if (!REDUCED) liveLoop(k, s); }, my, REDUCED ? 0 : FADE, false, paper))) return;
      setPhase("rest");
    },
    /* a move within slide k from what is shown (anim/steps.js Live.glide): "enter" plays step s's enter with the
       camera and the dimming carried from the picture shown (a zone clicked); "rest" undoes them smoothly back to
       step s's rest (↑, or ← on step 1, to the overview). Where it cannot glide (the live page not on top, the veil
       up, ?reduced=1, nothing to carry) it is the ordinary forward or back move */
    glide: async function (k, s, mode, from, my) {
      freeze();
      await ensureFrame(k); if (stale(my)) return;
      var g = null;
      if (!REDUCED && frameShown() && !veilUp && W.Live.glide) { W.Live.stopLoop(); g = W.Live.glide(k, s, { mode: mode, from: from }); }
      if (!g) return mode === "enter" ? LIVER.forward(k, s, false, my, false, false) : LIVER.back(k, s, my, false);
      g.set(0);
      if (mode === "enter") { var name = cueName(k, s); NAV.played.push(name); NAV.cue = name; setPhase("entry"); } else setPhase("fade");
      var t0 = performance.now();
      if (mode === "enter") progPlay(my, function () { return (performance.now() - t0) / 1000 / g.dur; });
      for (;;) {
        await new Promise(function (r) { requestAnimationFrame(r); });
        if (stale(my)) return;                                   /* stopped where it is */
        var t = (performance.now() - t0) / 1000;
        if (t >= g.dur) break;
        g.set(t);
      }
      W.Live.step(k, s); liveLoop(k, s); setPhase("rest");
    },
    preload: function () {}
  };
  /* a video slide has no glide: its enter faded to, or its rest cross-faded in */
  MEDIA.glide = function (k, s, mode, from, my) { return mode === "enter" ? MEDIA.forward(k, s, false, my, false, false) : MEDIA.back(k, s, my, false); };
  /* which renderer plays slide k */
  function R(k) { return media(k) ? MEDIA : LIVER; }


  /* ---- the planner: every press acts at once ----------------------------------- */
  /* the steps of slide k: from its media (media.json) when it plays from video, else from its live timelines */
  function nst(k) {
    if (k < 1 || k > N) return 0;
    if (media(k)) return +((MED && MED.steps && MED.steps[k]) || 0);
    return INFO && INFO[k - 1] && INFO[k - 1].steps ? INFO[k - 1].steps.length : 0;
  }
  /* the line of positions (slide, step) */
  function nextPos(k, s) { return s < nst(k) ? [k, s + 1] : k < N ? [k + 1, 0] : null; }
  function prevPos(k, s) { return s > 0 ? [k, s - 1] : k > 1 ? [k - 1, nst(k - 1)] : null; }
  /* THE SHORT VERSION (header: X): another deck, build/short/ beside this one's files; X goes to the other at the
     same position, keeping the hash and every query parameter but "short" */
  function otherDeck() {
    var to = CFG.short_build ? "../" : CFG.has_short ? "short/" : null;
    if (!to) return false;
    var u = new URL(to, location.href); var q = new URLSearchParams(location.search); q.delete("short");
    u.search = q.toString() ? "?" + q.toString() : ""; u.hash = location.hash;
    location.replace(u.href);
    return true;
  }
  /* how.play: a zone clicked: step s's attention move is played from what is shown, whichever way it lies (even
     the step shown now, acted once more) */
  function goTo(k, s, how) {
    how = how || {};
    var now = performance.now(), inBurst = now - NAV.last < BURST;    /* a press inside the window waits for quiet */
    NAV.last = now;
    k = Math.max(1, Math.min(N, k)); s = Math.max(0, Math.min(nst(k), s || 0));
    if (k === cur && s === curS && !how.play) return bump();
    var from = cur, fromS = curS, dir = how.play ? 1 : how.rest ? -1 : (k - from || s - fromS) > 0 ? 1 : -1, atRest = NAV.phase === "rest";
    if (how.jump) JUMPED = [from, fromS];          /* Z returns here (a jump: the grid, a number, a part, Home, End, T, a zone, Z) */
    /* laid on at once, with no exit: a step from the rest of the step before it, and a continued slide reached from
       its own predecessor at rest when that one has no steps (with steps, its entry starts on the overview) */
    var seamless = dir > 0 && atRest && (k === from ? s === fromS + 1 :
      k === from + 1 && s === 0 && nst(from) === 0 && !!(SL[k - 1] || {}).continues);
    LEAVE = { k: from, t: idleTime(from), dir: dir };
    var my = ++NAV.gen; NAV.wakers.splice(0).forEach(function (w) { w(); });
    cur = k; curS = s; NAV.dir = dir; NAV.phase = "fade";     /* moving from now on: the renderer sets each phase after */
    /* the progress line: one press on to the next position grows with its motion (progPlay); anything else lands */
    progAim(my, dir > 0 && !inBurst && posIndex(k, s) === posIndex(from, fromS) + 1, dir > 0);
    update();
    /* leaving the slide (or the veil still up from a press just before): the fade to paper first, then the target */
    var leaving = (k !== from && !seamless) || veilUp;
    if (!leaving && under !== k) { under = k; layoutLogos(); }   /* no fade to paper: the target is shown at once */
    /* within the slide: a zone's step played from what is shown, or the way back to the overview, by a glide */
    var glide = !leaving && k === from ? (how.play && !seamless ? "enter" : dir < 0 && s === 0 ? "rest" : null) : null;
    var arrive = function () {
      if (glide) return R(k).glide(k, s, glide, atRest ? fromS : null, my);
      return dir > 0 ? R(k).forward(k, s, seamless && !leaving, my, inBurst, leaving) : R(k).back(k, s, my, leaving);
    };
    var run = leaving ? leave(my).then(function (ok) { if (ok) return arrive(); }) : arrive();
    run.catch(function (e) { ERR.push("move: " + (e && e.message || e)); })
       .then(function () { if (!stale(my)) MEDIA.preload(cur, curS); });
  }
  function step(dir) {                               /* the LINEAR order (a clicker): overview, its steps, the next slide */
    var p = dir > 0 ? nextPos(cur, curS) : prevPos(cur, curS);
    if (!p) { NAV.last = performance.now(); return bump(); }
    goTo(p[0], p[1]);
  }
  /* TWO LEVELS (the author, 5 November 2026): ← → on an overview go between the slides' overviews; on a step, between
     the steps of this slide (← on step 1 back to the overview, → past the last step on to the next slide's overview);
     ↓ on an overview enters its steps at step 1; ↑ on a step returns to the overview */
  function level(dir) {
    var p = curS === 0 ? (dir > 0 ? (cur < N ? [cur + 1, 0] : null) : (cur > 1 ? [cur - 1, 0] : null))
                       : (dir > 0 ? nextPos(cur, curS) : [cur, curS - 1]);
    if (!p) { NAV.last = performance.now(); return bump(); }
    goTo(p[0], p[1]);
  }
  function down() { if (curS === 0 && nst(cur)) return goTo(cur, 1); NAV.last = performance.now(); bump(); }
  function up() { if (curS > 0) return goTo(cur, 0); NAV.last = performance.now(); bump(); }
  /* TWO MODES (the author, 5 November 2026: "The presentation mode should be the default navigation : 1 -> 2 -> 2.1 ->
     2.2.. -> 3 -> 3.1... to get out of the presentation mode, up or down arrow, to come back to presentation mode "P""):
     PRESENTATION (the default) ← → are the linear order, as a clicker's keys; ↑ or ↓ leaves it for NAVIGATION, that
     same press doing its navigation move (↓ into N.1, ↑ back to N; a bump still switches), where ← → move by level.
     P returns to presentation from wherever the deck is, without moving. Opened with ?nav=1 in navigation mode. The
     mode is not kept across reloads (sessionStorage would carry it into the next opening of the same tab, the walk's
     and the speaker's alike: a reload must always start in presentation mode) */
  var NAVMODE = params.get("nav") === "1";
  function setMode(nav) { NAVMODE = !!nav; update(); }
  function partStart(i) { for (var k = 1; k <= N; k++) if (SL[k - 1].part === i) return k; return null; }

  /* ---- where am I: the bar ---------------------------------------------------- */
  function partName(i) { var p = (CFG.parts || [])[i - 1]; return p ? p.name : ""; }
  function describe(k) {
    var s = SL[k - 1] || {}, pn = partName(s.part);
    return [(pn ? pn + " › " : "") + (s.title || ""), k + " / " + N];
  }
  var lastHash = null;
  /* a position's name, one rule for every slide: its overview "k", its step s "k.s" (the corner number, the hash) */
  function posName(k, s) { return k + (s ? "." + s : ""); }
  function going() { return NAV.phase === "fade" || NAV.phase === "hold"; }
  var numEl = null;
  /* the number never runs under the corner unit's portrait (its right edge at 96.1% of the stage): a long one ("10.10",
     "11.10") is set smaller until it fits the 2.6% of the stage between the portrait (and a 0.5% gap) and the number's
     right edge (deck.css #num, right 0.8%) */
  function fitNum() {
    var at = numEl.lastChild; at.style.fontSize = "";
    var w = at.getBoundingClientRect().width, W = box.getBoundingClientRect().width, room = 0.026 * W;
    if (w > room && W > 0) at.style.fontSize = (room / w).toFixed(3) + "em";
  }
  function update() {
    var g = going(), d = describe(cur), n = nst(cur);
    crumb.textContent = (g ? (NAV.dir < 0 ? "← " : "→ ") : (CFG.title ? CFG.title + " · " : "")) + d[0];
    pos.textContent = n ? "slide " + d[1] + " · step " + curS + "/" + n : d[1];
    strip.classList.toggle("going", g);
    if (numEl) { numEl.firstChild.textContent = NAVMODE ? "nav" : CFG.short_build ? "short\npres" : "pres";   /* the mode always shown (the author, 10 November 2026) */ numEl.lastChild.textContent = posName(cur, curS); fitNum(); }
    var h = "#/" + posName(cur, curS);
    if (h !== lastHash) { lastHash = h; try { history.replaceState(null, "", h + ""); } catch (e) {} }
    layoutLogos();
    if (NAV.phase === "rest") hover();               /* the zones are where the picture at rest draws them */
    else if (zoneEl) zoneEl.style.display = "none";
  }

  /* ---- the logos and overlays, from deck.json, over the stage ---------------------------- */
  /* UNDER: the slide whose picture the stage shows beneath the veil (null: the paper); set by goTo and veilTo */
  var logoEls = [], LEAVE = null, bandEl = null, under = null;
  function buildLogos() {
    (CFG.logos || []).forEach(function (L) {
      var im = document.createElement("img"); im.className = "logo" + (L.chip ? " chip" : ""); im.src = L.src; im.alt = L.alt || "";
      var h = (L.height || 0.04) * 100, c = L.corner || "bottom-left";
      im.style.height = h + "%";                                  /* of the stage's height */
      im.style[c.indexOf("top") >= 0 ? "top" : "bottom"] = "2.6%";  /* the same margin on both axes of a 16:9 box */
      im.style[c.indexOf("right") >= 0 ? "right" : "left"] = "1.46%";
      if (L.chip) im.style.padding = "0.35% 0.5%";
      im.style.display = "none";                                  /* until the first layout: never on the title before its entry */
      box.appendChild(im); logoEls.push([im, L.slides || null, L.except || [], null]);
    });
  }
  /* an overlay: a part of one slide (tools/build.py cut it from that slide's svg into a full-stage svg with the
     slide's viewBox), inlined over the stage so it lands to the pixel where that slide draws it; its caret, if any,
     blinks by CSS with the slide's own period (data-blink), from the phase the slide's own caret was at */
  async function buildOverlays() {
    await Promise.all((CFG.overlays || []).map(async function (O) {
      var d = document.createElement("div"); d.className = "overlay" + (REDUCED ? " still" : "");
      d.setAttribute("role", "img"); d.setAttribute("aria-label", O.alt || ""); d.style.display = "none";
      try { d.innerHTML = await (await fetch(O.src)).text(); } catch (e) { ERR.push("overlay " + O.src + ": " + e); return; }
      var sv = d.querySelector("svg"), caret = d.querySelector("[data-caret]");
      if (sv) { sv.removeAttribute("width"); sv.removeAttribute("height"); }
      var period = sv && +sv.getAttribute("data-blink") || 0;
      box.appendChild(d);
      if (caret && period) caret.style.animationDuration = period + "s";
      logoEls.push([d, O.slides || null, O.except || [], caret && period ? { el: caret, period: period } : null]);
    }));
  }
  /* how far into its idle (rest loop) slide k is, in s, or null when it is not idling (mid-entry, a fade) */
  function idleTime(k) {
    if (NAV.phase !== "rest") return null;
    if (media(k)) {
      if (!loopEl || loopK !== loopName(k, curS)) return null;
      if (leadEl) return leadEl.currentTime;            /* still in its lead */
      var f = MED.files[loopName(k, curS)] || {};
      return (f.lead || 0) + loopEl.currentTime;        /* an ending's period starts where its lead ends */
    }
    return liveLoopAt.k === k && liveLoopAt.s === curS ? (performance.now() - liveLoopAt.t) / 1000 : null;
  }
  /* restart a caret's blink as if it had been blinking for t s (0: shown, as at rest) */
  function caretAt(c, t) {
    c.el.style.animationName = "none"; void c.el.getBoundingClientRect();
    c.el.style.animationDelay = -(((t || 0) % c.period + c.period) % c.period).toFixed(3) + "s"; c.el.style.animationName = "";
  }
  /* "slides": where a logo shows (default all); "except": the slides that draw it themselves, in their entry. THE SHELL'S
     MARK IS THE ONLY COPY ONCE THE ENTRY HAS DRAWN IT (the author, 5 November 2026: no plate behind the marks, ever):
     on such a slide it is hidden only while that slide's entry is shown from its start (forward onto its overview,
     until its rest), and the slide's own copy draws it, letter by letter; at the entry's end, in the same frame, the
     mark is shown and the slide's own copy hidden (live: live.html's #own-marks switched on; media: its rest and loop
     are recorded without it, tools/make_media.mjs). Leaving, coming back (at rest) or any other slide: the mark alone,
     its caret blinking on; nothing hands over, nothing doubles */
  function layoutLogos() {
    var drawing = NAV.dir >= 0 && curS === 0 && NAV.phase !== "rest", own = false;
    logoEls.forEach(function (x) {
      var el = x[0], was = el.style.display !== "none", want = !x[1] || x[1].indexOf(cur) >= 0;
      var mine = x[2].indexOf(cur) >= 0, show = want && !(mine && drawing);
      /* leaving a slide that drew it while its own copy is the one inked (its entry frozen under the veil's fade):
         still hidden until the veil covers that picture (UNDER then none), so the two never show at once */
      if (!was && under !== null && under !== cur && x[2].indexOf(under) >= 0) show = false;
      /* a slide playing from video recorded before this (media.json without it in "bare": its rest still draws the
         marks): the mark hidden once that picture covers the stage, as it was; tools/make_media.mjs re-records it */
      if (mine && media(cur) && !(MED && (MED.bare || []).indexOf(cur) >= 0))
        show = want && was && !(NAV.phase === "rest" || NAV.phase === "entry" || under === cur);
      if (x[3] && show && !was) {
        /* the hand-over at the end of the slide's own entry: shown, as its rest's caret is; arriving from a slide
           that drew it: on from that slide's phase */
        if (mine) caretAt(x[3], 0);
        else if (LEAVE && LEAVE.k !== cur && x[2].indexOf(LEAVE.k) >= 0) caretAt(x[3], LEAVE.t);
      }
      el.style.display = show ? "" : "none";
      if (show && x[2].length) own = true;
    });
    /* the live page's own copies of the marks off while the marks are on (build.py's #own-marks, scoped to the slides
       that draw them) */
    var om = W && W.document && W.document.getElementById("own-marks");
    if (om) om.media = own ? "all" : "not all";
    /* the foot band (deck.css #footband): under the marks, shown with them, but never over a slide drawing them
       itself (the title) while its picture is the one on the stage (UNDER: unveiled, not yet left for the paper) */
    if (bandEl) bandEl.style.display = logoEls.some(function (x) { return x[0].style.display !== "none" && x[2].indexOf(under) < 0; }) ? "" : "none";
  }

  /* ---- keys ------------------------------------------------------------------ */
  var NEXT = { PageDown: 1, " ": 1, Spacebar: 1, Enter: 1 }, PREV = { PageUp: 1, Backspace: 1 };   /* linear: a clicker */
  var JUMP = { jump: true };
  window.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key || "", low = k.toLowerCase(), tag = e.target && e.target.tagName;
    if (k === "F5") { e.preventDefault(); if (!e.repeat) toggleFull(); return; }   /* a clicker's "present" button (F5, Shift+F5): never a reload */
    if (e.repeat) { if (k.length === 1 || /^(Arrow|Page|Home|End|Enter|Backspace)/.test(k)) e.preventDefault(); return; }   /* a held key or clicker button: one press */
    if (blanked()) { e.preventDefault(); return blank(false); }   /* any key brings the slide back, and does nothing else */
    if (gridShown() && gridKey(e)) return;                   /* the grid's own keys first */
    if ((k === "Enter" || k === " ") && (tag === "BUTTON" || tag === "A" || tag === "INPUT")) return;   /* the offline panel's own */
    if (k === "ArrowRight") { e.preventDefault(); return NAVMODE ? level(1) : step(1); }
    if (k === "ArrowLeft") { e.preventDefault(); return NAVMODE ? level(-1) : step(-1); }
    if (k === "ArrowDown") { e.preventDefault(); setMode(true); return down(); }   /* leaves presentation mode, and moves (a bump too) */
    if (k === "ArrowUp") { e.preventDefault(); setMode(true); return up(); }
    if (low === "p") { e.preventDefault(); return setMode(false); }                /* back to presentation mode, in place */
    if (NEXT[k]) { e.preventDefault(); return step(1); }
    if (PREV[k]) { e.preventDefault(); return step(-1); }
    if (k === "Home") { e.preventDefault(); return goTo(1, 0, JUMP); }
    if (k === "End") { e.preventDefault(); return goTo(N, 0, JUMP); }
    if (/^[0-9]$/.test(k)) { e.preventDefault(); var kk = k === "0" ? 10 : +k; return kk <= N ? goTo(kk, 0, JUMP) : bump(); }   /* slide k; 0 slide 10 */
    if (low === "g") { e.preventDefault(); return gridOpen(); }
    if (low === "b" || k === ".") { e.preventDefault(); return blank(true); }        /* a clicker's blank-screen button sends one of them */
    if (low === "l") { e.preventDefault(); return toggleProg(); }
    if (low === "c") { e.preventDefault(); return toggleBar(); }
    if (low === "z" || k === "`") { e.preventDefault(); return jumpBack(); }
    if (low === "f") { e.preventDefault(); return toggleFull(); }
    if (low === "s") { e.preventDefault(); return startTimer(); }
    if (low === "o") { e.preventDefault(); return toggleOffPanel(); }
    if (low === "x") { e.preventDefault(); return otherDeck(); }
    if (low === "h" || k === "?") { e.preventDefault(); return $("help").classList.toggle("on"); }
    if (low === "t") { e.preventDefault(); return goTo(1, 0, JUMP); }
    var parts = CFG.parts || [];
    for (var i = 0; i < parts.length; i++) if (parts[i].key && parts[i].key.toLowerCase() === low) { e.preventDefault(); var p = partStart(i + 1); return p ? goTo(p, 0, JUMP) : bump(); }
  });
  window.addEventListener("hashchange", function () {
    var m = /^#\/(\d+)(?:\.(\d+))?/.exec(location.hash);
    if (m && location.hash !== lastHash && (+m[1] !== cur || +(m[2] || 0) !== curS)) goTo(+m[1], +(m[2] || 0));
  });
  function toggleFull() {
    var d = document;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) { var x = (d.exitFullscreen || d.webkitExitFullscreen).call(d); if (x && x.catch) x.catch(function () {}); }
      else { var el = d.documentElement, r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(function () {}); }
    } catch (e) {}
  }

  /* ---- ZONES: on a slide that declares them (its motion file's `zones`, anim/steps.js), a click on a region of the
   * picture plays the step on it from what is shown (goTo's how.play); hovering one shows a pointer and a faint
   * outline. Where the zones are drawn is read from the live page (the camera included): from the picture shown when
   * the live page is on top, else from the live page set, hidden, to the position shown. ---------------------- */
  var zoneEl = null, mouse = null;
  function zonesOf(k) { return INFO && INFO[k - 1] && INFO[k - 1].zones || null; }
  function zoneRects() {
    if (!zonesOf(cur) || !W || !W.Live || !W.Live.zoneRects || !frame) return [];
    var fr = frame.getBoundingClientRect(), shown = frame.style.visibility !== "hidden";
    return W.Live.zoneRects(cur, shown ? null : curS).map(function (z) {
      return { step: z.step, x: fr.left + z.r[0] * fr.width, y: fr.top + z.r[1] * fr.height, w: z.r[2] * fr.width, h: z.r[3] * fr.height };
    });
  }
  function zoneAt(x, y) {                          /* the smallest zone under the point (a block inside another wins) */
    var best = null, bx = box.getBoundingClientRect();
    if (x < bx.left || y < bx.top || x > bx.right || y > bx.bottom) return null;
    zoneRects().forEach(function (z) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h && (!best || z.w * z.h < best.w * best.h)) best = z;
    });
    return best;
  }
  function hover() {
    var z = mouse && zonesOf(cur) ? zoneAt(mouse[0], mouse[1]) : null;
    var h3 = mouse ? g3() : null;                  /* over a draggable 3D graph: the hand says it can be turned */
    box.style.cursor = h3 && g3at(h3, mouse[0], mouse[1]) ? "grab" : z ? "pointer" : "";
    if (!z) { if (zoneEl) zoneEl.style.display = "none"; return; }
    if (!zoneEl) { zoneEl = document.createElement("div"); zoneEl.id = "zone"; zoneEl.setAttribute("aria-hidden", "true"); box.appendChild(zoneEl); }
    var bx = box.getBoundingClientRect(), pad = 0.006 * bx.width;
    zoneEl.style.left = (z.x - bx.left - pad) + "px"; zoneEl.style.top = (z.y - bx.top - pad) + "px";
    zoneEl.style.width = (z.w + 2 * pad) + "px"; zoneEl.style.height = (z.h + 2 * pad) + "px"; zoneEl.style.display = "";
  }
  box.addEventListener("mousemove", function (e) { mouse = [e.clientX, e.clientY]; hover(); });
  box.addEventListener("mouseleave", function () { mouse = null; hover(); });
  /* ---- A DRAGGABLE 3D GRAPH (slide 8.3, concepts/field_scatter_3d.py's drag): when the live page is on top and the
   * slide shown offers one (window.Live3D[id] in the live page, active only at its 3D rest), a pointer pressed on it
   * orbits the graph and the wheel zooms it; a drag never reaches the zones or the keys (captured and stopped here),
   * and a press released without moving (under 4 px) is left to be an ordinary click. A video cannot be dragged. */
  var drag3 = null, eatClick = false;
  function g3() {
    if (!frameShown() || !W || !W.Live3D || !INFO || !INFO[cur - 1]) return null;
    var h = W.Live3D[INFO[cur - 1].id];
    return h && h.active() ? h : null;
  }
  function g3at(h, x, y) { var fr = frame.getBoundingClientRect(); return h.hit(x - fr.left, y - fr.top); }
  box.addEventListener("pointerdown", function (e) {
    var h = g3(); if (!h || !g3at(h, e.clientX, e.clientY)) return;
    drag3 = { h: h, x: e.clientX, y: e.clientY, moved: false };
    try { box.setPointerCapture(e.pointerId); } catch (_) {}
    h.start(); e.stopPropagation();
  }, true);
  box.addEventListener("pointermove", function (e) {
    if (!drag3) return;
    var dx = e.clientX - drag3.x, dy = e.clientY - drag3.y;
    if (!drag3.moved && Math.hypot(dx, dy) < 4) return;
    drag3.moved = true; drag3.h.move(dx, dy); drag3.x = e.clientX; drag3.y = e.clientY;
    e.stopPropagation(); e.preventDefault();
  }, true);
  function g3up(e) { if (!drag3) return; eatClick = drag3.moved; drag3.h.end(); drag3 = null; e.stopPropagation(); }
  box.addEventListener("pointerup", g3up, true);
  box.addEventListener("pointercancel", g3up, true);
  box.addEventListener("click", function (e) { if (eatClick) { eatClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
  box.addEventListener("wheel", function (e) {
    var h = g3(); if (!h || !g3at(h, e.clientX, e.clientY)) return;
    e.preventDefault(); e.stopPropagation(); h.zoom(e.deltaY);
  }, { passive: false, capture: true });

  box.addEventListener("click", function (e) {
    var z = zonesOf(cur) ? zoneAt(e.clientX, e.clientY) : null;
    if (!z) return;
    e.preventDefault();
    goTo(cur, z.step, { play: true, jump: true });
  });

  /* ---- the timer: whole minutes only (ticking seconds distract the audience) -------- */
  var timerEl = $("timer"), timerT0 = 0, timerTick = null;
  function timerShow() { timerEl.textContent = Math.floor((Date.now() - timerT0) / 60000) + " min"; }
  function startTimer() { timerT0 = Date.now(); timerShow(); if (!timerTick) timerTick = setInterval(timerShow, 250); }

  /* ---- the progress line (header: THE PROGRESS LINE) ------------------------------- */
  var progEl = null, PROG = { at: 0, aim: null, run: 0 };
  /* position (k, s)'s index on the line 1, 2, 2.1 ... (0 for slide 1's overview), and its mark in [0, 1] */
  function posIndex(k, s) { var i = 0; for (var j = 1; j < k; j++) i += nst(j) + 1; return i + (s || 0); }
  function progMark(k, s) { var P = posIndex(N, nst(N)); return P > 0 ? posIndex(k, s) / P : 0; }
  function progSet(f, ms) {
    f = Math.max(0, Math.min(1, f)); PROG.at = f;
    if (!progEl) return;
    progEl.style.transition = ms ? "transform " + ms + "ms cubic-bezier(.25,.1,.25,1)" : "none";
    progEl.style.transform = "scaleX(" + f.toFixed(5) + ")";
  }
  /* a move begins: `grow` (one press on to the next position) waits on the previous mark for the motion to drive it;
     otherwise the line lands on the target's mark now (eased forward, cut backward) */
  function progAim(my, grow, fwd) {
    PROG.run++;
    var to = progMark(cur, curS);
    if (grow) { PROG.aim = { my: my, from: progMark.apply(null, prevPos(cur, curS) || [1, 0]), to: to }; progSet(PROG.aim.from, 0); }
    else { PROG.aim = null; progSet(to, fwd ? 250 : 0); }
  }
  /* the motion of generation `my` is playing: the line follows `frac` (its playback, 0..1) until it ends or is cut */
  function progPlay(my, frac) {
    var a = PROG.aim; if (!a || a.my !== my) return;
    var run = ++PROG.run;
    (function tick() {
      if (run !== PROG.run || stale(my)) return;
      var f = frac(); f = f > 0 ? Math.min(1, f) : 0;
      progSet(a.from + (a.to - a.from) * f, 0);
      if (f < 1) requestAnimationFrame(tick);
    })();
  }
  /* at rest: exactly on the position's mark */
  function progRest() { PROG.run++; PROG.aim = null; if (N) progSet(progMark(cur, curS), 0); }
  function toggleProg() { if (progEl) progEl.classList.toggle("off"); }

  /* ---- the slide grid (header: THE SLIDE GRID) --------------------------------------- */
  var gridEl = null, gridSel = 1, thumbs = {}, COLS = 4;
  /* slide k's thumbnail: its overview's rest still, decoded once at 640x360 (a 2x still decoded whole is 33 MB) */
  function thumb(k) {
    if (thumbs[k]) return thumbs[k];
    thumbs[k] = (async function () {
      if (!media(k)) return null;
      var u = restUrl(k, 0), W = 640, H = 360, c = document.createElement("canvas"); c.width = W; c.height = H;
      var g = c.getContext("2d"); g.imageSmoothingQuality = "high";
      try {
        var blob = await (await fetch(u)).blob(), bm = await createImageBitmap(blob, { resizeWidth: W, resizeHeight: H, resizeQuality: "high" });
        g.drawImage(bm, 0, 0, W, H); if (bm.close) bm.close();
      } catch (e) {
        try { var im = new Image(); im.src = u; await im.decode(); g.drawImage(im, 0, 0, W, H); im.src = ""; } catch (e2) { return null; }
      }
      return c;
    })();
    return thumbs[k];
  }
  function gridMark() {
    if (!gridEl) return;
    [].forEach.call(gridEl.querySelectorAll(".cell"), function (c) {
      var k = +c.getAttribute("data-k");
      c.classList.toggle("cur", k === cur); c.classList.toggle("sel", k === gridSel);
      c.setAttribute("aria-current", k === cur ? "true" : "false");
    });
  }
  function gridOpen() {
    if (!N) return;
    if (!gridEl) {
      gridEl = document.createElement("div"); gridEl.id = "grid"; gridEl.setAttribute("role", "dialog"); gridEl.setAttribute("aria-label", "All slides");
      var wrap = document.createElement("div"); wrap.className = "cells"; gridEl.appendChild(wrap);
      for (var k = 1; k <= N; k++) (function (k) {
        var c = document.createElement("div"); c.className = "cell"; c.setAttribute("role", "button"); c.setAttribute("data-k", k);   /* not a <button>: a focused one would take the clicker's Enter and Space once closed */
        var t = document.createElement("div"); t.className = "thumb"; t.innerHTML = '<span class="ph">' + k + "</span>";
        var cap = document.createElement("div"); cap.className = "cap";
        var n = document.createElement("span"); n.className = "n"; n.textContent = k;
        var ti = document.createElement("span"); ti.className = "ti"; ti.textContent = (SL[k - 1] || {}).title || "";
        cap.appendChild(n); cap.appendChild(ti); c.title = k + " · " + ti.textContent;
        c.appendChild(t); c.appendChild(cap); wrap.appendChild(c);
        c.addEventListener("click", function (e) { e.preventDefault(); gridGo(k); });
        c.addEventListener("mousemove", function () { if (gridSel !== k) { gridSel = k; gridMark(); } });
        thumb(k).then(function (cv) { if (cv) { cv.className = "img"; t.innerHTML = ""; t.appendChild(cv); } });
      })(k);
      gridEl.addEventListener("click", function (e) { if (e.target === gridEl || e.target === wrap) gridClose(); });   /* the paper around: closes */
      document.body.appendChild(gridEl);
    }
    gridSel = cur; gridMark(); gridEl.classList.add("on");
  }
  function gridClose() { if (gridEl) gridEl.classList.remove("on"); }
  function gridShown() { return !!gridEl && gridEl.classList.contains("on"); }
  function gridGo(k) { gridClose(); goTo(k, 0, { jump: true }); }
  /* a key while the grid is open: true when the grid took it */
  function gridKey(e) {
    var k = e.key, low = (k || "").toLowerCase(), mv = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLS, ArrowUp: -COLS }[k];
    if (mv) { e.preventDefault(); var t = gridSel + mv; if (t >= 1 && t <= N) { gridSel = t; gridMark(); } return true; }
    if (k === "Enter" || k === " ") { e.preventDefault(); gridGo(gridSel); return true; }
    if (k === "Home" || k === "End") { e.preventDefault(); gridSel = k === "Home" ? 1 : N; gridMark(); return true; }
    if (k === "Escape" || low === "g") { e.preventDefault(); gridClose(); return true; }
    gridClose(); return false;                      /* any other key: the grid closes and the key acts */
  }

  /* ---- offline: sw.js serves the shell network-first and the media cache-first; this fills the
   * media cache from offline-manifest.json, file by file, each with its hash. It starts a few
   * seconds after the page opens; the bar shows "offline 42 %", then ✓. ---------------------- */
  var OFF = { state: "idle", done: 0, total: 0, files: 0, of: 0, ready: false, zips: [] };
  var offEl = $("off"), offPanel = null;
  var canOffline = /^https?:/.test(location.protocol) && "serviceWorker" in navigator && "caches" in window;
  var ROOTP = new URL("./", location.href).pathname, CACHE = "deck-media-2:" + ROOTP;   /* sw.js's MEDIA (its SCHEMA, 2) */
  function mb(b) { return (b / 1048576).toFixed(0); }
  function offShow() {
    offEl.textContent = OFF.ready ? "✓" : OFF.state === "run" ? "offline " + Math.floor(100 * OFF.done / Math.max(1, OFF.total)) + " %" : OFF.state === "error" ? "offline ✗" : "";
    offEl.title = OFF.ready ? "Ready offline" : "";
    if (!offPanel) return;
    offPanel.querySelector(".st").textContent = OFF.ready ? "✓ Ready offline · " + mb(OFF.total) + " MB in this browser" :
      OFF.state === "run" ? "Offline: " + mb(OFF.done) + " / " + mb(OFF.total) + " MB (" + OFF.files + " / " + OFF.of + " files)" :
      OFF.state === "error" ? "Offline: stopped (" + (OFF.err || "network") + ")" : canOffline ? "Offline: not started" : "Offline needs the page served over http(s)";
  }
  /* before anything plays: a cached file whose hash no longer matches the published one is dropped, so a republished
     slide is never shown from the old copy (the author, 4 November 2026: "I still don't see the animation") */
  /* the hash a cached file must carry: a still's or a video's is media.json's v (what its URL asks for), whatever an
     older manifest says; any other file's, the manifest's */
  function wantHash(f) { var m = /^media\/(.+)\.(mp4|webp)$/.exec(f[0]), e = m && MED && MED.files && MED.files[m[1]]; return e && e.v || f[2]; }
  async function dropStale() {
    if (!canOffline) return;
    try {               /* the caches of an older worker's schema first: that worker may still be answering this page */
      var names = await caches.keys();
      await Promise.all(names.filter(function (n) { return /^deck-(shell|media)(-\d+)?:/.test(n) && n.slice(n.indexOf(":") + 1) === ROOTP &&
        n !== CACHE && n !== "deck-shell-2:" + ROOTP; }).map(function (n) { return caches.delete(n); }));
    } catch (e) {}
    try {
      var man = await (await fetch("offline-manifest.json", { cache: "no-store" })).json();
      var cache = await caches.open(CACHE), base = new URL("./", location.href).href;
      await Promise.all(man.files.map(async function (f) {
        var u = base + f[0], hit = await cache.match(u);
        if (hit && hit.headers.get("X-Hash") !== wantHash(f)) await cache.delete(u);
      }));
    } catch (e) {}
  }
  async function fillCache() {
    if (!canOffline || OFF.state === "run") return;
    OFF.state = "run"; OFF.ready = false; OFF.err = null; offShow();
    try { await started; } catch (e) {}                        /* media.json read first (wantHash) */
    try {
      try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
      var man = await (await fetch("offline-manifest.json", { cache: "no-store" })).json();
      OFF.zips = man.zips || [];
      var cache = await caches.open(CACHE), base = new URL("./", location.href).href;
      var list = man.files.slice(); OFF.total = man.bytes; OFF.of = list.length; OFF.done = 0; OFF.files = 0;
      var want = {}; list.forEach(function (f) { want[base + f[0]] = 1; });
      (await cache.keys()).forEach(function (r) { if (!want[r.url]) cache.delete(r); });
      var next = 0, failed = 0;
      async function worker() {
        for (;;) {
          var f = list[next++]; if (!f) return;
          var u = base + f[0], hit = await cache.match(u);
          if (!(hit && hit.headers.get("X-Hash") === wantHash(f))) {
            try {
              var r = await fetch(u + "?fill=" + wantHash(f), { cache: "no-store" });
              if (!r.ok) throw new Error(r.status);
              var blob = await r.blob();
              await cache.put(u, new Response(blob, { headers: { "Content-Type": r.headers.get("Content-Type") || blob.type, "X-Hash": wantHash(f), "Content-Length": String(blob.size) } }));
            } catch (e) { failed++; OFF.err = String(e.message || e); }
          }
          OFF.done += f[1]; OFF.files++; offShow();
        }
      }
      await Promise.all([worker(), worker(), worker(), worker()]);
      OFF.state = failed ? "error" : "done"; OFF.ready = !failed;
    } catch (e) { OFF.state = "error"; OFF.err = String(e.message || e); }
    offShow();
  }
  function toggleOffPanel() {
    if (offPanel) { offPanel.remove(); offPanel = null; return; }
    offPanel = document.createElement("div"); offPanel.id = "offpanel";
    var z = (OFF.zips.length ? OFF.zips : ["deck-offline.zip"]).map(function (n) { return '<a href="' + n + '">' + n + "</a>"; }).join(" + ");
    offPanel.innerHTML = '<div class="st"></div><button type="button">Download for offline</button>' +
      '<div class="hint">ZIP backup: ' + z + '; unzip (all parts in one folder), then start.command (Mac) or start.bat (Windows).</div>' +
      '<div class="hint">Open once online and wait for ✓; a reload then works offline. O closes this.</div>';
    offPanel.querySelector("button").addEventListener("click", function () { fillCache(); });
    document.body.appendChild(offPanel); offShow();
  }

  /* full screen: the API's, or a window as large as the screen (F11, a kiosk) */
  function full() { return !!(document.fullscreenElement || document.webkitFullscreenElement ||
    (window.innerHeight >= screen.height - 1 && window.innerWidth >= screen.width - 1)); }

  /* ---- THE BAR (header): hidden in full screen, shown in a window; C overrides it until full screen is entered or left ---- */
  var BAR = null, barFull = null;                  /* BAR null: by the screen */
  function barShown() { return BAR !== null ? BAR : !full(); }
  function layoutBar() {
    var f = full(); if (f !== barFull) { barFull = f; BAR = null; }   /* entering or leaving full screen: its default again */
    document.body.classList.toggle("nobar", !barShown());
  }
  function toggleBar() { BAR = !barShown(); layoutBar(); }
  document.addEventListener("fullscreenchange", layoutBar); document.addEventListener("webkitfullscreenchange", layoutBar);
  window.addEventListener("resize", layoutBar);

  /* ---- BLANK (header): plain paper over everything; the deck under it is left exactly as it is ---------------- */
  var blankEl = null;
  function blanked() { return !!blankEl && blankEl.classList.contains("on"); }
  function blank(on) {
    if (!blankEl) { blankEl = document.createElement("div"); blankEl.id = "blank"; blankEl.setAttribute("aria-hidden", "true");
      blankEl.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); blank(false); }); document.body.appendChild(blankEl); }
    blankEl.classList.toggle("on", !!on);
  }

  /* ---- JUMP BACK (header): Z returns to the position held before the last jump, at rest; twice toggles ---- */
  var JUMPED = null;
  function jumpBack() {
    if (!JUMPED || (JUMPED[0] === cur && JUMPED[1] === curS)) { NAV.last = performance.now(); return bump(); }
    goTo(JUMPED[0], JUMPED[1], { rest: true, jump: true });
  }

  /* ---- THE WARM PASS (header): every video read once, one at a time, while the deck is at rest -------------- */
  var WARM = { done: 0, of: 0, on: false };
  async function warm() {
    if (WARM.on || REDUCED || LIVE || !MED || !MED.files) return;
    WARM.on = true;
    var names = [], seen = {};
    /* in the order the talk reaches them, from where the deck is: the entry, each step's enter, their loops and leads */
    for (var k = 1; k <= N; k++) for (var s = 0; s <= nst(k); s++)
      [cueName(k, s), leadName(k, s), loopName(k, s)].forEach(function (n) { if (has(n) && !seen[n]) { seen[n] = 1; names.push([k, n]); } });
    names.sort(function (a, b) { return (a[0] < cur) - (b[0] < cur) || a[0] - b[0]; });
    WARM.of = names.length;
    for (var i = 0; i < names.length; i++) {
      while (NAV.phase !== "rest" || document.hidden) await sleep(500);     /* never beside a motion playing */
      await new Promise(function (r) { (window.requestIdleCallback || setTimeout)(r, { timeout: 1000 }); });
      var v = document.createElement("video");              /* detached: never on the stage, one decoder at a time */
      v.muted = true; v.preload = "auto"; v.src = mediaUrl(names[i][1], "mp4");
      await new Promise(function (r) { var to = setTimeout(r, 8000);
        ["loadeddata", "error"].forEach(function (ev) { v.addEventListener(ev, function () { clearTimeout(to); r(); }, { once: true }); }); });
      v.removeAttribute("src"); try { v.load(); } catch (e) {}  /* the decoder and its buffers released */
      WARM.done++;
    }
  }

  /* ---- in full screen the pointer hides after 1.5 s without moving ---------------- */
  (function () {
    var timer = null, root = document.documentElement;
    function arm() {
      root.classList.remove("nocursor"); clearTimeout(timer);
      if (full()) timer = setTimeout(function () { if (full()) root.classList.add("nocursor"); }, 1500);
    }
    window.addEventListener("mousemove", arm, true);
    document.addEventListener("fullscreenchange", arm); document.addEventListener("webkitfullscreenchange", arm);
    window.addEventListener("resize", arm); arm();
  })();

  /* ---- start ------------------------------------------------------------------ */
  var started = Promise.all([
    fetch("deck.json", { cache: "no-cache" }).then(function (r) { return r.json(); }),      /* never an HTTP-cached copy */
    fetch("slides.json", { cache: "no-cache" }).then(function (r) { return r.json(); }),
    fetch("media/media.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]).then(async function (j) {
    CFG = j[0]; SL = j[1].slides; N = SL.length; MED = j[2];
    if (params.get("short") === "1" && !CFG.short_build && otherDeck()) return;    /* ?short=1: the short deck (header: X) */
    if (CFG.title) document.title = CFG.title;
    var m = /^#\/(\d+)(?:\.(\d+))?/.exec(location.hash);
    cur = Math.max(1, Math.min(N, m ? +m[1] : 1)); under = cur;
    buildLogos(); await buildOverlays();
    /* the foot band: paper fading upward behind the marks, over the slides and under the veil (deck.css #footband) */
    bandEl = document.createElement("div"); bandEl.id = "footband"; bandEl.setAttribute("aria-hidden", "true"); bandEl.style.display = "none"; box.appendChild(bandEl);
    /* the corner: the position, right-aligned where it always was, and above it the mode (update) */
    numEl = document.createElement("div"); numEl.id = "num"; numEl.setAttribute("aria-hidden", "true");
    numEl.innerHTML = '<span class="mode"></span><span class="at"></span>'; box.appendChild(numEl);
    /* the progress line, along the stage's foot, over the veil with the marks (deck.css #prog) */
    progEl = document.createElement("div"); progEl.id = "prog"; progEl.setAttribute("aria-hidden", "true"); box.appendChild(progEl);
    $("help").innerHTML = "<table>" + [["Presentation mode", "(the default) ← → every position in order: 1, 2, 2.1, 2.2 … 3, 3.1 …"],
      ["Navigation mode", "↓ or ↑ enters it (and moves)"],
      ["P", "back to presentation mode, where you are"],
      ["X", "the short version (another deck at the same place) on / off"],
      ["  ← →", "the slides; on a step, its steps"], ["  ↓ / ↑", "into a slide's steps / back to its overview"],
      ["Space PageDown Enter", "next, in order (both modes)"], ["PageUp Backspace", "previous, in order (both modes)"], ["click", "a part of the slide (where outlined): its step"], ["Home / End", "first / last"],
      ["1–9, 0", "slide 1 to 9, 0: slide 10"], ["G", "all the slides (← → ↑ ↓ Enter or a click; G or Esc closes)"],
      [(CFG.parts || []).filter(function (p) { return p.key; }).map(function (p) { return p.key.toUpperCase(); }).join(", "), "a part: " + (CFG.parts || []).filter(function (p) { return p.key; }).map(function (p) { return p.key.toUpperCase() + " " + p.name; }).join(", ")],
      ["Z or `", "back to where I was before the last jump (twice: forth again)"],
      ["T", "the title"], ["B or .", "blank screen (any key returns)"], ["L", "the progress line on / off"], ["C", "this bar on / off (hidden in full screen)"],
      ["F or F5", "full screen"], ["S", "timer (minutes; S again restarts)"], ["O", "offline"], ["H", "this help"]]
      .map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("") + "</table>";
    await dropStale();
    var live = [];
    for (var i = 1; i <= N; i++) if (!media(i)) live.push(i);
    if (live.length || SL.some(function (x) { return x.zones; })) await ensureFrame(cur);   /* the live page is ready before any key (and holds the zones) */
    curS = Math.max(0, Math.min(nst(cur), m && m[2] ? +m[2] : 0));
    progRest();
    await R(cur).init(cur, curS);
    update(); MEDIA.preload(cur, curS); layoutBar();
    document.documentElement.setAttribute("data-ready", "1");
    setTimeout(warm, 4000);                         /* after the opening's entry has started, at idle priority */
  }).catch(function (e) { ERR.push("start: " + (e && e.message || e)); crumb.textContent = "could not start: " + e; });

  if (canOffline) {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(function () {});
    setTimeout(fillCache, 3000);
  }
  window.DeckShell = {
    get state() {
      return { k: cur, s: curS, nsteps: nst(cur), steps: (function () { var a = []; for (var i = 1; i <= N; i++) a.push(nst(i)); return a; })(),
        n: N, phase: NAV.phase, dest: going() ? cur : null, driving: NAV.phase !== "rest", playing: NAV.phase === "entry" ? NAV.cue : null, played: NAV.played.slice(-20), nplayed: NAV.played.length, mode: R(cur) === LIVER ? "live" : "media", reduced: REDUCED,
        live: (function () { var a = []; for (var i = 1; i <= N; i++) if (!media(i)) a.push(i); return a; })(),
        entries: INFO ? INFO.map(function (e) { return e.entry; }) : null,
        enters: INFO ? INFO.map(function (e) { return (e.steps || []).map(function (x) { return x.enter; }); }) : null,
        pos: pos.textContent, num: numEl ? numEl.lastChild.textContent : null, navmode: NAVMODE, modeShown: numEl ? numEl.firstChild.textContent : null, hash: location.hash,
        zones: zonesOf(cur) && NAV.phase === "rest" ? zoneRects() : [], zoneShown: !!zoneEl && zoneEl.style.display !== "none", cursor: box.style.cursor,
        layers: { frame: frameShown(), frameVisible: !!frame && frame.style.visibility !== "hidden", rest: restImg.style.visibility !== "hidden" && !!restImg.getAttribute("src"),
          videos: box.querySelectorAll("video.on").length, jumps: box.querySelectorAll(".jumpimg").length },
        offline: OFF.state + (OFF.ready ? " ready" : "") + " " + OFF.files + "/" + OFF.of, crumb: crumb.textContent + " | " + pos.textContent,
        marks: logoEls.map(function (x) { return { what: x[0].tagName === "IMG" ? x[0].getAttribute("src") : "overlay", shown: x[0].style.display !== "none", except: x[2] }; }),
        timer: timerEl.textContent, prog: +PROG.at.toFixed(5), progMark: N ? +progMark(cur, curS).toFixed(5) : 0, progOn: !!progEl && !progEl.classList.contains("off"), grid: gridShown(), blank: blanked(), bar: barShown(), jumped: JUMPED ? posName(JUMPED[0], JUMPED[1]) : null, warm: WARM.done + "/" + WARM.of, full: !!document.fullscreenElement, loop: loopK, errors: ERR.slice() };
    },
    started: started, fillCache: fillCache
  };
})();
