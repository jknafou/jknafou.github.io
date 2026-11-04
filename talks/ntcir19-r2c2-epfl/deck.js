/* deck.js -- the linear deck: one 16:9 stage, slides in order, pictures and videos by default.
 *
 * Simplified from the research-day talk's shell (world/talk/talk.js, 27 October 2026): no world,
 * no islands; the same keys, bar, offline cache, fit, timer and cursor.
 *
 *   DEFAULT     each slide at rest is a crisp still (media/rest-<k>.webp, 2x) with its rest loop over
 *               it (loop-<k>.mp4) when it has one; arriving FORWARD plays its entry (in-<k>.mp4) at 1x,
 *               arriving BACKWARD shows its rest at once (a 0.35 s cross-fade). No video ever plays
 *               backwards, and leaving a slide never replays it.
 *   ?live=1     the same keys over the live page (live.html), which plays the motions themselves.
 *   ?reduced=1  (or the OS setting) cuts between the stills; nothing moves.
 *   ?chrome=0   hides the bar.   #/k opens slide k.
 *
 * NAVIGATION (the author, 4 November 2026, on build/rules.html: "if pressing <- or -> mid animation,
 * it should just stop the animation to move to the selected slide (we can navigate by pressing
 * multiple times to arrow keys..)"):
 *   1. → at rest: the next slide's entry plays at its designed speed (1x), then its rest (loop/idle).
 *      A slide that continues the last starts on its rest, with no exit; any other first fades the
 *      picture to the entry's first frame in 0.35 s (that fade is the whole exit).
 *   2. → or ← while an entry (or a fade) plays: it stops at once, and the stage moves to the slide
 *      the key selects. Nothing is hurried to its end.
 *   3. Presses each within BURST (0.5 s) of the last are one move: every press moves the destination
 *      at once and the bar shows it ("→ 7 · title"); a press inside the window starts the target's
 *      entry only once the keys have been quiet for BURST, so no slide in between is played (the
 *      first press's entry, under 0.5 s old, is cut).
 *   4. Direction decides how a slide is arrived at: forward (→, End, a part ahead) with its entry at
 *      1x; backward (←, Home, T, a part behind) at rest, by a 0.35 s cross-fade, its loop restarting.
 *   ?reduced=1: cuts between rest stills, in both directions.
 *   → Space PageDown   next        ← PageUp Backspace   previous      Home / End   first / last
 *   1-9                the first slide of that part (or a part's own letter, deck.json parts[].key)
 *   T                  the title (slide 1)
 *   F full screen      S timer (minutes; S again restarts)    O offline panel    H help
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

  var CFG = {}, SL = [], MED = null, N = 0, cur = 1;
  var FADE = 350, BURST = 500;

  /* ---- one navigation at a time: every key press starts a new GENERATION; whatever an older one
   * was doing (a fade, an entry, a wait) sees it is stale at its next step and gives up, leaving the
   * picture where it was for the new one to fade from. ------------------------------------------ */
  var NAV = { gen: 0, phase: "rest", dir: 0, last: 0, wakers: [], played: [] };   /* played: the entries started, for the walk */
  function stale(my) { return my !== NAV.gen; }
  function setPhase(p) { NAV.phase = p; update(); }
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
  var restUrl = function (k) { return "media/rest-" + k + ".webp"; };
  var has = function (name) { return !!(MED && MED.files && MED.files[name]); };
  var imgs = {};
  function preImg(k) {
    if (k < 1 || k > N) return null;
    var u = restUrl(k);
    if (!imgs[u]) { var im = new Image(); im.src = u; imgs[u] = im.decode ? im.decode().catch(function () {}) : Promise.resolve(); }
    return imgs[u];
  }
  var moves = {};
  function moveVideo(name) {
    var u = "media/" + name + ".mp4";
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
  var loopEl = null, loopK = 0;
  function stopLoop() {
    if (!loopEl) return;
    var v = loopEl; loopEl = null; loopK = 0;
    try { v.pause(); } catch (e) {} v.removeAttribute("src"); try { v.load(); } catch (e) {} v.remove();
  }
  async function startLoop(k) {
    if (REDUCED || !has("loop-" + k)) { stopLoop(); return; }
    if (loopK === k && loopEl) { try { loopEl.currentTime = 0; } catch (e) {} return; }   /* its loop from the start */
    stopLoop();
    var v = video("media/loop-" + k + ".mp4", restUrl(k)); v.loop = true; v.className = "loopvid";
    box.insertBefore(v, restImg.nextSibling);
    loopEl = v; loopK = k;
    await ready(v, 3000);
    if (loopEl !== v) return;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    await firstFrame(v);
    if (loopEl === v) v.classList.add("on");
  }
  async function setRest(k, my) {
    await preImg(k);
    if (stale(my)) return;
    restImg.src = restUrl(k);
    if (restImg.decode) await restImg.decode().catch(function () {});
  }
  /* the layers over the rest: each new one is laid on top of everything shown so far */
  var Z = 5, curMove = null;
  function onTop(el) { el.style.zIndex = String(++Z); }
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
    if (!keep) Z = 5;
  }
  async function arriveAtRest(k, my) {
    await setRest(k, my); if (stale(my)) return;
    await startLoop(k); if (stale(my)) return;
    clearLayers(null);
    setPhase("rest");
  }
  var MEDIA = {
    /* opening the deck is arriving forward: the first slide shown plays its entry (the author, 4 November 2026:
       "I don't see the animation when starting the slideshow"); a key pressed meanwhile stops it as any other */
    init: async function (k) {
      var my = NAV.gen; await setRest(k, my);
      if (REDUCED || !has("in-" + k)) { startLoop(k); return; }
      MEDIA.forward(k, false, my, false);
    },
    /* forward onto k: (fade to) its entry's first frame, wait out the burst, play it at 1x, rest */
    forward: async function (k, seamless, my, inBurst) {
      freeze();
      if (REDUCED || !has("in-" + k)) return MEDIA.back(k, my);
      setPhase("fade");
      var v = moveVideo("in-" + k);
      await ready(v, 6000); if (stale(my)) return;
      await seek0(v); if (stale(my)) return;
      v.playbackRate = 1;
      /* a continued slide's first frame is the rest just left: laid on at once (120 ms over a loop,
         whose phase is not frame 0); anything else is faded to, which is the exit */
      await fadeIn(v, seamless ? (loopEl ? 120 : 0) : FADE); if (stale(my)) return;
      if (inBurst) { setPhase("hold"); if (!(await quiet(my))) return; }
      stopLoop(); clearLayers(v);
      var ended = new Promise(function (r) { v.addEventListener("ended", r, { once: true }); v.addEventListener("error", r, { once: true }); });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      curMove = v; NAV.played.push("in-" + k); setPhase("entry");
      preImg(k);
      await Promise.race([ended, superseded(my)]);
      if (stale(my)) return;
      curMove = null;
      await arriveAtRest(k, my);
    },
    /* backward onto k (or a cut): its rest faded in over whatever is shown, then its loop restarts */
    back: async function (k, my) {
      freeze();
      setPhase("fade");
      await preImg(k); if (stale(my)) return;
      if (!REDUCED) {
        var im = document.createElement("img"); im.className = "jumpimg"; im.alt = ""; im.src = restUrl(k);
        if (im.decode) await im.decode().catch(function () {});
        if (stale(my)) return;
        box.appendChild(im);
        await fadeIn(im, FADE); if (stale(my)) return;
      }
      await arriveAtRest(k, my);
    },
    preload: function (k) {
      if (!REDUCED && k < N && has("in-" + (k + 1))) moveVideo("in-" + (k + 1));
      preImg(k + 1); preImg(k - 1); preImg(1);
    }
  };

  /* ---- the live renderer (?live=1): the same rules over live.html, driving its timelines ------ */
  var frame = null, W = null, INFO = null;
  function liveFade(to, ms) {
    frame.style.transition = ms ? "opacity " + ms + "ms ease" : "none"; frame.style.opacity = String(to);
    return ms ? sleep(ms) : Promise.resolve();
  }
  var LIVER = {
    init: function (k) {
      return new Promise(function (res) {
        restImg.style.display = "none";
        frame = document.createElement("iframe"); frame.src = "live.html?embed=1&k=" + k; frame.title = "slides";
        frame.style.pointerEvents = "none"; frame.tabIndex = -1;
        box.appendChild(frame);
        frame.addEventListener("load", function () {
          W = frame.contentWindow;
          (function wait() {
            if (W.Live && W.document.documentElement.getAttribute("data-ready")) {
              INFO = W.Live.info(); W.Live.rest(k); if (!REDUCED) W.Live.startLoop(k); res();
            } else setTimeout(wait, 50);
          })();
        });
      });
    },
    forward: async function (k, seamless, my, inBurst) {
      var dur = INFO[k - 1].entry;
      if (REDUCED || !(dur > 0)) return LIVER.back(k, my);
      W.Live.stopLoop(); setPhase("fade");
      if (!seamless) { await liveFade(0, FADE / 2); if (stale(my)) return; }
      W.Live.entry(k, 0);
      if (!seamless) { await liveFade(1, FADE / 2); if (stale(my)) return; }
      if (inBurst) { setPhase("hold"); if (!(await quiet(my))) return; }
      NAV.played.push("in-" + k); setPhase("entry");
      var t0 = performance.now();
      for (;;) {
        await new Promise(function (r) { requestAnimationFrame(r); });
        if (stale(my)) return;                                   /* stopped where it is */
        var t = (performance.now() - t0) / 1000;
        if (t >= dur) break;
        W.Live.entry(k, t);
      }
      W.Live.rest(k); W.Live.startLoop(k); setPhase("rest");
    },
    back: async function (k, my) {
      W.Live.stopLoop();
      if (REDUCED) { W.Live.rest(k); setPhase("rest"); return; }
      setPhase("fade");
      await liveFade(0, FADE / 2); if (stale(my)) return;
      W.Live.rest(k); W.Live.startLoop(k);
      await liveFade(1, FADE / 2); if (stale(my)) return;
      setPhase("rest");
    },
    preload: function () {}
  };
  var R = MEDIA;

  /* ---- the planner: every press acts at once ----------------------------------- */
  function goTo(k) {
    var now = performance.now(), inBurst = now - NAV.last < BURST;    /* a press inside the window waits for quiet */
    NAV.last = now;
    k = Math.max(1, Math.min(N, k));
    if (k === cur) return bump();
    var from = cur, dir = k > from ? 1 : -1;
    /* a continued slide reached from its own predecessor at rest needs no exit */
    var seamless = dir > 0 && k === from + 1 && NAV.phase === "rest" && !!(SL[k - 1] || {}).continues;
    var my = ++NAV.gen; NAV.wakers.splice(0).forEach(function (w) { w(); });
    cur = k; NAV.dir = dir;
    update();
    var run = dir > 0 ? R.forward(k, seamless, my, inBurst) : R.back(k, my);
    run.catch(function (e) { ERR.push("move: " + (e && e.message || e)); })
       .then(function () { if (!stale(my)) R.preload(cur); });
  }
  function step(dir) { goTo(cur + dir); }
  function partStart(i) { for (var k = 1; k <= N; k++) if (SL[k - 1].part === i) return k; return null; }

  /* ---- where am I: the bar ---------------------------------------------------- */
  function partName(i) { var p = (CFG.parts || [])[i - 1]; return p ? p.name : ""; }
  function describe(k) {
    var s = SL[k - 1] || {}, pn = partName(s.part);
    return [(pn ? pn + " › " : "") + (s.title || ""), k + " / " + N];
  }
  var lastHash = null;
  function going() { return NAV.phase === "fade" || NAV.phase === "hold"; }
  var numEl = null;
  function update() {
    var g = going(), d = describe(cur);
    crumb.textContent = (g ? (NAV.dir < 0 ? "← " : "→ ") : (CFG.title ? CFG.title + " · " : "")) + d[0];
    pos.textContent = d[1];
    strip.classList.toggle("going", g);
    if (numEl) numEl.textContent = String(cur);
    var h = "#/" + cur;
    if (h !== lastHash) { lastHash = h; try { history.replaceState(null, "", h + ""); } catch (e) {} }
    layoutLogos();
  }

  /* ---- the logos, from deck.json, over the stage ---------------------------------- */
  var logoEls = [];
  function buildLogos() {
    (CFG.logos || []).forEach(function (L) {
      var im = document.createElement("img"); im.className = "logo" + (L.chip ? " chip" : ""); im.src = L.src; im.alt = L.alt || "";
      var h = (L.height || 0.04) * 100, c = L.corner || "bottom-left";
      im.style.height = h + "%";                                  /* of the stage's height */
      im.style[c.indexOf("top") >= 0 ? "top" : "bottom"] = "2.6%";  /* the same margin on both axes of a 16:9 box */
      im.style[c.indexOf("right") >= 0 ? "right" : "left"] = "1.46%";
      if (L.chip) im.style.padding = "0.35% 0.5%";
      box.appendChild(im); logoEls.push([im, L.slides || null]);
    });
  }
  function layoutLogos() { logoEls.forEach(function (x) { x[0].style.display = !x[1] || x[1].indexOf(cur) >= 0 ? "" : "none"; }); }

  /* ---- keys ------------------------------------------------------------------ */
  var NEXT = { ArrowRight: 1, PageDown: 1, " ": 1, Spacebar: 1 }, PREV = { ArrowLeft: 1, PageUp: 1, Backspace: 1 };
  window.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key || "", low = k.toLowerCase();
    if (NEXT[k]) { e.preventDefault(); return step(1); }
    if (PREV[k]) { e.preventDefault(); return step(-1); }
    if (k === "Home") { e.preventDefault(); return goTo(1); }
    if (k === "End") { e.preventDefault(); return goTo(N); }
    if (/^[1-9]$/.test(k)) { var s = partStart(+k); e.preventDefault(); return s ? goTo(s) : bump(); }
    if (low === "f") { e.preventDefault(); return toggleFull(); }
    if (low === "s") { e.preventDefault(); return startTimer(); }
    if (low === "o") { e.preventDefault(); return toggleOffPanel(); }
    if (low === "h" || k === "?") { e.preventDefault(); return $("help").classList.toggle("on"); }
    if (low === "t") { e.preventDefault(); return goTo(1); }
    var parts = CFG.parts || [];
    for (var i = 0; i < parts.length; i++) if (parts[i].key && parts[i].key.toLowerCase() === low) { e.preventDefault(); var p = partStart(i + 1); return p ? goTo(p) : bump(); }
  });
  window.addEventListener("hashchange", function () {
    var m = /^#\/(\d+)/.exec(location.hash); if (m && +m[1] !== cur && ("#/" + m[1]) !== lastHash) goTo(+m[1]);
  });
  function toggleFull() {
    var d = document;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) { var x = (d.exitFullscreen || d.webkitExitFullscreen).call(d); if (x && x.catch) x.catch(function () {}); }
      else { var el = d.documentElement, r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(function () {}); }
    } catch (e) {}
  }

  /* ---- the timer: whole minutes only (ticking seconds distract the audience) -------- */
  var timerEl = $("timer"), timerT0 = 0, timerTick = null;
  function timerShow() { timerEl.textContent = Math.floor((Date.now() - timerT0) / 60000) + " min"; }
  function startTimer() { timerT0 = Date.now(); timerShow(); if (!timerTick) timerTick = setInterval(timerShow, 250); }

  /* ---- offline: sw.js serves the shell network-first and the media cache-first; this fills the
   * media cache from offline-manifest.json, file by file, each with its hash. It starts a few
   * seconds after the page opens; the bar shows "offline 42 %", then ✓. ---------------------- */
  var OFF = { state: "idle", done: 0, total: 0, files: 0, of: 0, ready: false, zips: [] };
  var offEl = $("off"), offPanel = null;
  var canOffline = /^https?:/.test(location.protocol) && "serviceWorker" in navigator && "caches" in window;
  var CACHE = "deck-media:" + new URL("./", location.href).pathname;
  function mb(b) { return (b / 1048576).toFixed(0); }
  function offShow() {
    offEl.textContent = OFF.ready ? "✓" : OFF.state === "run" ? "offline " + Math.floor(100 * OFF.done / Math.max(1, OFF.total)) + " %" : OFF.state === "error" ? "offline ✗" : "";
    offEl.title = OFF.ready ? "Ready offline" : "";
    if (!offPanel) return;
    offPanel.querySelector(".st").textContent = OFF.ready ? "✓ Ready offline · " + mb(OFF.total) + " MB in this browser" :
      OFF.state === "run" ? "Offline: " + mb(OFF.done) + " / " + mb(OFF.total) + " MB (" + OFF.files + " / " + OFF.of + " files)" :
      OFF.state === "error" ? "Offline: stopped (" + (OFF.err || "network") + ")" : canOffline ? "Offline: not started" : "Offline needs the page served over http(s)";
  }
  async function fillCache() {
    if (!canOffline || OFF.state === "run") return;
    OFF.state = "run"; OFF.ready = false; OFF.err = null; offShow();
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
          if (!(hit && hit.headers.get("X-Hash") === f[2])) {
            try {
              var r = await fetch(u + "?fill=" + f[2], { cache: "no-store" });
              if (!r.ok) throw new Error(r.status);
              var blob = await r.blob();
              await cache.put(u, new Response(blob, { headers: { "Content-Type": r.headers.get("Content-Type") || blob.type, "X-Hash": f[2], "Content-Length": String(blob.size) } }));
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

  /* ---- in full screen the pointer hides after 1.5 s without moving ---------------- */
  (function () {
    var timer = null, root = document.documentElement;
    function full() { return !!(document.fullscreenElement || document.webkitFullscreenElement ||
      (window.innerHeight >= screen.height - 1 && window.innerWidth >= screen.width - 1)); }
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
    fetch("deck.json").then(function (r) { return r.json(); }),
    fetch("slides.json").then(function (r) { return r.json(); }),
    fetch("media/media.json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]).then(async function (j) {
    CFG = j[0]; SL = j[1].slides; N = SL.length; MED = j[2];
    if (CFG.title) document.title = CFG.title;
    if (LIVE || !MED) R = LIVER;
    var m = /^#\/(\d+)/.exec(location.hash);
    cur = Math.max(1, Math.min(N, m ? +m[1] : 1));
    buildLogos();
    numEl = document.createElement("div"); numEl.id = "num"; numEl.setAttribute("aria-hidden", "true"); box.appendChild(numEl);
    $("help").innerHTML = "<table>" + [["→ Space PageDown", "next"], ["← PageUp", "previous"], ["Home / End", "first / last"],
      ["1–9" + (CFG.parts || []).filter(function (p) { return p.key; }).map(function (p) { return ", " + p.key.toUpperCase(); }).join(""), "a part: " + (CFG.parts || []).map(function (p, i) { return (i + 1) + " " + p.name; }).join(", ")],
      ["T", "the title"], ["F", "full screen"], ["S", "timer"], ["O", "offline"], ["H", "this help"]]
      .map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("") + "</table>";
    await R.init(cur);
    update(); R.preload(cur);
    document.documentElement.setAttribute("data-ready", "1");
  }).catch(function (e) { ERR.push("start: " + (e && e.message || e)); crumb.textContent = "could not start: " + e; });

  if (canOffline) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
    setTimeout(fillCache, 3000);
  }
  window.DeckShell = {
    get state() {
      return { k: cur, n: N, phase: NAV.phase, dest: going() ? cur : null, driving: NAV.phase !== "rest", playing: NAV.phase === "entry" ? "in-" + cur : null, played: NAV.played.slice(-20), nplayed: NAV.played.length, mode: R === LIVER ? "live" : "media", reduced: REDUCED,
        offline: OFF.state + (OFF.ready ? " ready" : "") + " " + OFF.files + "/" + OFF.of, crumb: crumb.textContent + " | " + pos.textContent,
        timer: timerEl.textContent, full: !!document.fullscreenElement, loop: loopK, errors: ERR.slice() };
    },
    started: started, fillCache: fillCache
  };
})();
