/* deck.js -- the linear deck: one 16:9 stage, slides in order, pictures and videos by default.
 *
 * Simplified from the research-day talk's shell (world/talk/talk.js, 27 October 2026): no world,
 * no islands; the same keys, the same destination planner on a straight line, the same bar,
 * offline cache, fit, timer and cursor.
 *
 *   DEFAULT     each slide at rest is a crisp still (media/rest-<k>.webp, 2x) with its rest loop
 *               over it (loop-<k>.mp4) when it has one; → plays fw-<k>.mp4 (k's exit, k+1's entry),
 *               ← plays bw-<k>.mp4 (the same frames reversed); a jump plays in-<k>.mp4 (its entry).
 *   ?live=1     the same keys over the live page (live.html), which plays the motions themselves.
 *   ?reduced=1  (or the OS setting) cuts between the stills; nothing moves.
 *   ?chrome=0   hides the bar.   #/k opens slide k.
 *
 * KEYS, NEVER BLOCKED (the author, 27 October 2026: "We want to be able to press multiple times and
 * see in the navbar where we are going to jump"): every key moves a DESTINATION, starting from the
 * pending one; the stage travels towards it one hop at a time, a playing move hurries, and the bar
 * shows where it is going.
 *   → Space PageDown   next        ← PageUp Backspace   previous      Home / End   first / last
 *   1-9                the first slide of that part (or a part's own letter, deck.json parts[].key)
 *   T                  the title (slide 1)    Esc  cancel the pending destination
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
  var FAST = 3, BACK = 1.5, JUMP = 1.6;

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
      if (v.currentTime === 0) return res();
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
    if (keys.length > 8) keys.sort(function (a, b) { return moves[a].t - moves[b].t; }).slice(0, keys.length - 8).forEach(function (k) {
      var e = moves[k].v; if (!e.paused) return; delete moves[k]; e.removeAttribute("src"); e.load(); e.remove();
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
    if (loopK === k && loopEl) return;
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
  async function setRest(k) {
    await preImg(k);
    restImg.src = restUrl(k);
    if (restImg.decode) await restImg.decode().catch(function () {});
  }
  var curMove = null;
  /* one video from the picture now shown to rest-<to>; fade: fade it in first (a jump) */
  async function playVideo(name, to, rate, fade) {
    var target = preImg(to);
    if (REDUCED || !has(name)) { stopLoop(); await setRest(to); startLoop(to); return; }
    var v = moveVideo(name);
    await ready(v, 6000);
    await seek0(v);
    v.playbackRate = rate || 1;
    var ended = new Promise(function (r) { v.addEventListener("ended", r, { once: true }); });
    if (fade) { v.style.transition = "none"; v.style.opacity = 0; v.classList.add("on"); await nextFrame();
      v.style.transition = "opacity 200ms ease"; v.style.opacity = 1; await sleep(200); }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    curMove = v;
    await firstFrame(v);
    v.style.transition = loopEl && !fade ? "opacity 120ms ease" : "none";     /* over a rest loop: no phase jump */
    v.style.opacity = ""; v.classList.add("on");
    if (loopEl) setTimeout(stopLoop, 140);
    await target; await ended;
    curMove = null;
    await setRest(to);
    await startLoop(to);
    v.style.transition = "none"; v.classList.remove("on");
    try { v.pause(); v.currentTime = 0; v.playbackRate = 1; } catch (e) {}
  }
  var MEDIA = {
    init: async function (k) { await setRest(k); startLoop(k); },
    move: function (a, dir, rate) { return dir > 0 ? playVideo("fw-" + a, a + 1, rate) : playVideo("bw-" + a, a, (rate || 1) * BACK); },
    jump: async function (k) {
      if (CFG.jump !== "fade" && has("in-" + k)) return playVideo("in-" + k, k, JUMP, true);
      /* a fade to the target's still */
      await preImg(k);
      var im = document.createElement("img"); im.className = "jumpimg"; im.alt = ""; im.src = restUrl(k); im.style.opacity = 0;
      if (im.decode) await im.decode().catch(function () {});
      box.appendChild(im); await nextFrame();
      im.style.opacity = 1; await sleep(REDUCED ? 0 : 240);
      stopLoop(); await setRest(k); im.remove(); startLoop(k);
    },
    speed: function () { if (curMove && !curMove.paused && !REDUCED) try { curMove.playbackRate = Math.max(curMove.playbackRate, FAST); } catch (e) {} },
    preload: function (k) {
      [k < N ? "fw-" + k : null, k > 1 ? "bw-" + (k - 1) : null].forEach(function (n) { if (n && has(n) && !REDUCED) moveVideo(n); });
      preImg(k + 1); preImg(k - 1); preImg(1);
    }
  };

  /* ---- the live renderer (?live=1): the same keys over live.html ---------------- */
  var frame = null, W = null;
  var LIVER = {
    init: function (k) {
      return new Promise(function (res) {
        restImg.style.display = "none";
        frame = document.createElement("iframe"); frame.src = "live.html?embed=1&k=" + k; frame.title = "slides";
        frame.style.pointerEvents = "none"; frame.tabIndex = -1;
        box.appendChild(frame);
        frame.addEventListener("load", function () {
          W = frame.contentWindow;
          (function wait() { if (W.Live && W.document.documentElement.getAttribute("data-ready")) { W.Live.rest(k); if (!REDUCED) W.Live.startLoop(k); res(); } else setTimeout(wait, 50); })();
        });
      });
    },
    move: function (a, dir, rate) {
      if (REDUCED) { W.Live.rest(dir > 0 ? a + 1 : a); return Promise.resolve(); }
      return W.Live.play(a, dir, dir > 0 ? rate : (rate || 1) * BACK);
    },
    jump: function (k) { if (REDUCED) { W.Live.rest(k); return Promise.resolve(); } return W.Live.playEntry(k, JUMP); },
    speed: function () { if (W && W.Live) W.Live.speed(FAST); },
    preload: function () {}
  };
  var R = MEDIA;

  /* ---- the destination planner on a line ---------------------------------------- */
  var T = { dest: null, driving: false };
  async function travel() {
    if (T.driving) return;
    T.driving = true;
    try {
      for (var guard = 0; guard < 400 && T.dest != null && T.dest !== cur; guard++) {
        var d = T.dest;
        if (Math.abs(d - cur) === 1) { var a = Math.min(cur, d), dir = d > cur ? 1 : -1; await R.move(a, dir, 1); cur = d; }
        else { await R.jump(d); cur = d; }
        update();
      }
    } catch (e) { ERR.push("travel: " + (e && e.message || e)); }
    finally { T.driving = false; T.dest = null; update(); R.preload(cur); }
  }
  function goTo(k) {
    var from = T.driving && T.dest != null ? T.dest : cur;
    k = Math.max(1, Math.min(N, k));
    if (k === from) return bump();
    T.dest = k;
    if (T.driving) R.speed();
    update();
    if (!T.driving) travel();
  }
  function step(dir) { goTo((T.driving && T.dest != null ? T.dest : cur) + dir); }
  function partStart(i) { for (var k = 1; k <= N; k++) if (SL[k - 1].part === i) return k; return null; }

  /* ---- where am I: the bar ---------------------------------------------------- */
  function partName(i) { var p = (CFG.parts || [])[i - 1]; return p ? p.name : ""; }
  function describe(k) {
    var s = SL[k - 1] || {}, pn = partName(s.part);
    return [(pn ? pn + " › " : "") + (s.title || ""), k + " / " + N];
  }
  var lastHash = null;
  function update() {
    var going = T.dest != null && T.dest !== cur;
    var d = describe(going ? T.dest : cur);
    crumb.textContent = (going ? "→ " : (CFG.title ? CFG.title + " · " : "")) + d[0];
    pos.textContent = d[1];
    strip.classList.toggle("going", going);
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
    if (k === "Escape") { if (T.driving && T.dest != null) { T.dest = null; update(); } return; }
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
    $("help").innerHTML = "<table>" + [["→ Space PageDown", "next"], ["← PageUp", "previous"], ["Home / End", "first / last"],
      ["1–9" + (CFG.parts || []).filter(function (p) { return p.key; }).map(function (p) { return ", " + p.key.toUpperCase(); }).join(""), "a part: " + (CFG.parts || []).map(function (p, i) { return (i + 1) + " " + p.name; }).join(", ")],
      ["T", "the title"], ["F", "full screen"], ["S", "timer"], ["O", "offline"], ["Esc", "cancel"], ["H", "this help"]]
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
      return { k: cur, n: N, dest: T.dest, driving: T.driving, mode: R === LIVER ? "live" : "media", reduced: REDUCED,
        offline: OFF.state + (OFF.ready ? " ready" : "") + " " + OFF.files + "/" + OFF.of, crumb: crumb.textContent + " | " + pos.textContent,
        timer: timerEl.textContent, full: !!document.fullscreenElement, loop: loopK, errors: ERR.slice() };
    },
    started: started, fillCache: fillCache
  };
})();
