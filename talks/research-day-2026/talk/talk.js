/* The talk's navigation shell (26 October 2026), a pragmatic stand-in for
 * world/FINAL-PLAN.md section 1.
 *
 * Layers: WORLD (the four living views on one row) -> ISLAND (the island's
 * slides page, at its island view) -> SLIDE. 2.1 is not an island of the row:
 * it is the inside of 2.2's translator, one level deeper (the author, 26
 * October 2026: "I want 2.1 nested in 2.2 in the translation part. kind of an
 * island in an island."). The shell holds the keyboard; the islands' pages are
 * driven through their own test API, `EntryStage` (enter / goto / leave /
 * order / phase / id / aim), by same-origin access to their iframes. Nothing
 * inside an island page is edited: the island's own hud is hidden by a style
 * the shell adds to the mounted copy, and 2.2's door link is caught before it
 * navigates.
 *
 * The talk, as one line (→ forwards, ← exactly backwards):
 *   1.1 slides … 1.1 last → 2.2 island view → (zoom into the translator)
 *   2.1's LIVING VIEW, playing its loop (step 1 of 2.2) → (back out) 2.2 slide 1
 *   (tokenizer) … 2.2 last → 3.1 slides … → 4.1 slides.
 * ⚠️ THE TRANSLATION IS 2.1'S LIVING VIEW, NOT ITS SLIDES (the author, 26 October
 * 2026, the eve of the talk: "The first slide should be the translation live
 * animated fix view (let's not use for the moment the slide of the
 * translation)"). 2.1's island view and its nine slides are out of the walk;
 * they stay reachable by deep link, #/2.2/translation/slides (2.1's slides
 * page at its island view) and #/2.2/translation/4 (2.1's slide 4).
 * ↓/Enter goes in, ↑/Escape goes out a layer (from 2.1's living view: 2.2's
 * island view with the translator marked, then the world).
 * Hash: #/ (world), #/@3.1 (world, focus), #/2.2 (island), #/2.2/3 (2.2's own
 * slide 3), #/2.2/translation (2.1's living view); #/2.1 is an alias.
 * ?chrome=0 hides the strip.
 */
(function () {
  "use strict";

  var ISL = {
    "1.1": { sec: "1 Motivation", name: "1.1 Use case" },
    "2.2": { sec: "2 Methodology", name: "2.2 Pre-training", sub: "2.1" },
    "3.1": { sec: "3 Results", name: "3.1 Results" },
    "4.1": { sec: "4 Conclusion", name: "4.1 What is possible" }
  };
  var SUBNAME = { "2.1": "Translation (2.1)" };
  var WORLD = ["1.1", "2.2", "3.1", "4.1"];            /* the world's row and the talk's order */
  var BASE = "../";
  var liveUrl = function (id) { return BASE + "island-" + id + "-live.html?autostart=0"; };
  var slidesUrl = function (id) { return BASE + "island-" + id + "-slides.html?autostart=0"; };
  /* a nested island's LIVING VIEW is mounted under its own key, beside (never instead of) its slides page */
  var LIVE = "live:";
  var liveKey = function (id) { return LIVE + id; };
  var isLive = function (key) { return typeof key === "string" && key.indexOf(LIVE) === 0; };

  var params = new URLSearchParams(location.search);
  if (params.get("chrome") === "0") document.body.classList.add("nochrome");

  var $ = function (id) { return document.getElementById(id); };
  var viewEl = $("view"), worldEl = $("world"), stageEl = $("stage"), veil = $("veil"), loading = $("loading");
  var crumb = $("crumb"), pos = $("pos"), strip = $("strip"), mark = $("mark");

  /* island: the world island on stage; sub: "2.1" when inside 2.2's translator;
     subLive: true when that is 2.1's living view (the walk), false for its slides page (a deep link) */
  var S = { layer: "world", focus: 0, island: null, sub: null, subLive: false, busy: false };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function bump() { strip.classList.remove("bump"); void strip.offsetWidth; strip.classList.add("bump"); }
  function refocus() { try { window.focus(); } catch (e) {} }
  /* ---- the world: built on first need, never with a slides page's cost ---- */
  var cells = [];
  function buildWorld() {
    if (cells.length) return;
    WORLD.forEach(function (id, i) {
      var c = document.createElement("div"); c.className = "cell"; c.dataset.id = id;
      var f = document.createElement("div"); f.className = "frame";
      var ifr = document.createElement("iframe"); ifr.src = liveUrl(id); ifr.setAttribute("tabindex", "-1");
      ifr.title = ISL[id].name;
      var hit = document.createElement("div"); hit.className = "hit";
      var lab = document.createElement("div"); lab.className = "label"; lab.textContent = ISL[id].sec + " · " + ISL[id].name;
      f.appendChild(ifr); f.appendChild(hit); c.appendChild(f); c.appendChild(lab); worldEl.appendChild(c);
      var cell = { id: id, el: c, ifr: ifr, playing: false };
      ifr.addEventListener("load", function () {
        cell.loaded = true;
        try {
          var sv = ifr.contentDocument.querySelector("body > svg"), vb = sv && sv.viewBox && sv.viewBox.baseVal;
          if (vb && vb.width && vb.height) cell.aspect = vb.width / vb.height;
        } catch (e) {}
        layoutWorld(); playWorld();
      });
      hit.addEventListener("mouseenter", function () { S.hover = i; playWorld(); });
      hit.addEventListener("mouseleave", function () { if (S.hover === i) S.hover = null; playWorld(); });
      hit.addEventListener("click", function () { if (S.layer !== "world" || S.busy) return; S.focus = i; openIsland(id); });
      cells.push(cell);
    });
  }
  /* each island at its own aspect, all at one height, the row as large as the view allows */
  function layoutWorld() {
    if (!cells.length) return;
    var W = worldEl.clientWidth, H = worldEl.clientHeight, gap = Math.max(12, W * 0.015), lab = 26;
    var asp = cells.map(function (c) { return c.aspect || 1; });
    var sum = asp.reduce(function (a, b) { return a + b; }, 0);
    var h = Math.min(H * 0.9 - lab, (W * 0.96 - gap * (cells.length - 1)) / sum);
    cells.forEach(function (c, i) {
      c.el.style.flex = "0 0 " + Math.floor(asp[i] * h) + "px";
      c.el.style.height = Math.floor(h + lab) + "px";
    });
    worldEl.style.gap = gap + "px";
  }
  window.addEventListener("resize", layoutWorld);
  function fl(win) { try { return win && win.FixedLive; } catch (e) { return null; } }
  /* only the island under focus or hover plays; the rest hold their still */
  function playWorld() {
    cells.forEach(function (c, i) {
      var want = S.layer === "world" && (i === S.focus || i === S.hover);
      var F = fl(c.ifr.contentWindow);
      if (!F) return;
      try {
        if (want && !F.running) F.start();
        else if (!want && F.running) F.stop();
      } catch (e) {}
    });
    cells.forEach(function (c, i) { c.el.classList.toggle("focus", i === S.focus); });
  }

  /* ---- the slides pages: the current island, its nested one, and the next -- */
  var frames = {};                       /* id -> {el, win, ready} */
  function frameFor(id) {
    if (frames[id]) return frames[id];
    var el = document.createElement("iframe"), live = isLive(id);
    el.src = live ? liveUrl(id.slice(LIVE.length)) : slidesUrl(id); el.title = id; el.setAttribute("tabindex", "-1");
    var rec = { id: id, el: el, win: null, live: live };
    rec.ready = new Promise(function (res) {
      el.addEventListener("load", function () {
        var w = el.contentWindow; rec.win = w;
        hookFrame(rec);
        (function wait(n) {
          if ((live ? w.FixedLive : (w.EntryStage && w.EntryStage.order)) || n > 300) { res(rec); return; }
          setTimeout(function () { wait(n + 1); }, 50);
        })(0);
      });
    });
    stageEl.appendChild(el);
    frames[id] = rec;
    return rec;
  }
  function hookFrame(rec) {
    var w = rec.win, d;
    try { d = w.document; } catch (e) { return; }
    /* the shell's strip says where we are; the page's own hud and hint would say it twice */
    var st = d.createElement("style");
    st.textContent = "#entry-hud,#fixed-live-hint{display:none!important}";
    d.head.appendChild(st);
    /* the keyboard stays with the shell: a click inside gives focus back */
    var back = function () { setTimeout(refocus, 0); };
    w.addEventListener("pointerup", back, true);
    w.addEventListener("focus", back);
    /* a link never navigates the island's frame; 2.2's door zooms into 2.1 */
    w.addEventListener("click", function (e) {
      var a = e.target && e.target.closest && e.target.closest("a");
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      var E = stage(rec);
      if (ISL[rec.id] && ISL[rec.id].sub && E && E.phase === "map" && !S.busy && !S.sub) zoomIn(null);
    }, true);
    /* if the keyboard ever does land inside, the page's map keys are kept from it */
    w.addEventListener("keydown", function (e) {
      if (!NAV[e.key]) return;
      e.preventDefault(); e.stopImmediatePropagation();
    }, true);
  }
  function stage(rec) { try { return rec && rec.win && rec.win.EntryStage; } catch (e) { return null; } }
  function activeId() { return S.sub ? (S.subLive ? liveKey(S.sub) : S.sub) : S.island; }
  function cur() { var a = activeId(); return a ? frames[a] : null; }
  function nextW(id) { var i = WORLD.indexOf(id); return i >= 0 && i + 1 < WORLD.length ? WORLD[i + 1] : null; }
  function prevW(id) { var i = WORLD.indexOf(id); return i > 0 ? WORLD[i - 1] : null; }
  function prune(keep) {
    Object.keys(frames).forEach(function (id) {
      if (keep.indexOf(id) >= 0) return;
      var r = frames[id]; delete frames[id];
      try { r.el.src = "about:blank"; } catch (e) {}
      r.el.remove();
    });
  }
  /* the island on stage, its nested island (2.1 is small), and the next one */
  function keepSet(id) {
    var k = [id];
    if (ISL[id].sub) {
      k.push(liveKey(ISL[id].sub));                      /* the walk's translation */
      if (S.sub && !S.subLive) k.push(S.sub);           /* 2.1's slides, only while a deep link holds them */
    }
    var n = nextW(id);
    if (n) k.push(n);
    prune(k);
    k.forEach(function (x) {
      frameFor(x).ready.then(function (r) { if (activeId() !== x) hush(r); });
    });
  }
  /* a page out of sight: back to its island view, its tour stopped */
  function hush(rec) {
    if (rec.live) { stopTour(rec); return; }
    var E = stage(rec);
    if (E && E.phase !== "map") { try { E.leave(); } catch (e) {} }
    var t = 0;
    (function wait() {
      if (activeId() === rec.id) return;
      var E2 = stage(rec);
      if (E2 && E2.phase === "map" && !E2.flying) { try { var F2 = fl(rec.win); if (F2 && F2.running) F2.stop(); } catch (e) {} return; }
      if (++t < 80) setTimeout(wait, 50);
    })();
  }
  async function atMap(rec) {
    var E = stage(rec);
    if (!E) return;
    if (E.phase !== "map") { try { E.leave(); } catch (e) {} }
    for (var i = 0; i < 100; i++) {
      E = stage(rec);
      if (E.phase === "map" && !E.flying) return;
      await sleep(50);
    }
  }
  function showFrame(id) {
    Object.keys(frames).forEach(function (k) { frames[k].el.classList.toggle("on", k === id); });
  }
  function startTour(rec) { var F = fl(rec.win); if (F && !F.running) { try { F.start(); } catch (e) {} } }
  function stopTour(rec) { var F = fl(rec.win); if (F && F.running) { try { F.stop(); } catch (e) {} } }
  function pick(E, slide) {
    var order = E.order;
    return order[slide === "first" ? 0 : slide === "last" ? order.length - 1 : Math.max(0, Math.min(order.length - 1, slide))];
  }
  async function loaded(id) {
    var rec = frameFor(id), shown = false;
    var t0 = setTimeout(function () { if (!shown) loading.classList.add("on"); }, 250);
    await rec.ready;
    shown = true; clearTimeout(t0); loading.classList.remove("on");
    return rec;
  }

  /* ---- the translator: its box on 2.2's island view, in the view's pixels --- */
  function doorBox() {
    var r22 = frames[S.island];
    try {
      var a = r22.win.document.querySelector("a.subisland") || r22.win.document.querySelector("a");
      var b = a.getBoundingClientRect();
      if (b.width > 4 && b.height > 4) return { x: b.left, y: b.top, w: b.width, h: b.height };
    } catch (e) {}
    return null;
  }
  function markDoor() {
    var b = doorBox();
    if (!b) return;
    var pad = 8;
    mark.style.left = (b.x - pad) + "px"; mark.style.top = (b.y - pad) + "px";
    mark.style.width = (b.w + 2 * pad) + "px"; mark.style.height = (b.h + 2 * pad) + "px";
    mark.classList.add("on");
    clearTimeout(markDoor.t);
    markDoor.t = setTimeout(function () { mark.classList.remove("on"); }, 1400);
  }
  /* the zoom: the parent grows about the translator while the nested island grows out of it */
  async function zoom(outer, inner, into, ms) {
    var b = doorBox(), Vw = viewEl.clientWidth, Vh = viewEl.clientHeight;
    var a = outer.el, c = inner.el;
    if (!b) { /* no box: a plain crossfade */
      b = { x: Vw * 0.4, y: Vh * 0.4, w: Vw * 0.2, h: Vh * 0.2 };
    }
    var s = Math.max(b.w / Vw, b.h / Vh), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    var small = "translate(" + (cx - Vw * s / 2) + "px," + (cy - Vh * s / 2) + "px) scale(" + s + ")";
    var big = "translate(" + (Vw / 2 - cx / s) + "px," + (Vh / 2 - cy / s) + "px) scale(" + (1 / s) + ")";
    [a, c].forEach(function (e) { e.style.transition = "none"; e.style.transformOrigin = "0 0"; });
    a.style.opacity = 1; a.style.transform = into ? "none" : big;
    c.style.opacity = into ? 0 : 1; c.style.transform = into ? small : "none";
    c.style.zIndex = 2; a.style.zIndex = 1;
    void c.offsetWidth;
    var tr = "transform " + ms + "ms cubic-bezier(.45,0,.25,1), opacity " + ms + "ms ease";
    a.style.transition = tr; c.style.transition = tr;
    a.style.transform = into ? big : "none";
    c.style.transform = into ? "none" : small;
    c.style.opacity = into ? 1 : 0;
    await sleep(ms + 40);
    [a, c].forEach(function (e) { e.style.transition = e.style.transform = e.style.opacity = e.style.zIndex = e.style.transformOrigin = ""; });
  }

  /* ---- the moves -------------------------------------------------------- */
  /* bring world island `id` on stage; slide = null (island view), "first", "last" or an index */
  async function mount(id, slide, fade) {
    S.busy = true;
    if (fade) { veil.classList.add("on"); await sleep(300); }
    var old = activeId();
    var rec = await loaded(id);
    await atMap(rec);
    S.island = id; S.sub = null; S.subLive = false; S.layer = "island";
    showFrame(id);
    document.body.classList.add("in");
    playWorld();
    if (old && old !== id && frames[old]) hush(frames[old]);
    var E = stage(rec);
    if (E && slide !== null && slide !== undefined) E.enter(pick(E, slide));
    else startTour(rec);
    if (fade) { await sleep(40); veil.classList.remove("on"); }
    keepSet(id);
    refocus();
    S.busy = false;
    update();
    if (ISL[id].sub && (slide === null || slide === undefined) && fade) { await sleep(320); markDoor(); }
  }
  function openIsland(id) { return mount(id, null, false); }
  function crossTo(id, slide) { return mount(id, slide, true); }

  /* into 2.2's translator. slide = null: 2.1's LIVING VIEW, its loop playing (the walk);
     "map": 2.1's slides page at its island view, or an index: one of its slides (deep links only) */
  async function zoomIn(slide) {
    var parent = S.island, sub = ISL[parent].sub, live = slide === null || slide === undefined;
    S.busy = true;
    var outer = frames[parent], inner = await loaded(live ? liveKey(sub) : sub);
    await atMap(outer); if (!live) await atMap(inner);
    stopTour(outer);
    if (live) { stopTour(inner); try { fl(inner.win).sync(0); } catch (e) {} }
    await zoom(outer, inner, true, 650);
    S.sub = sub; S.subLive = live;
    showFrame(inner.id);
    var E = stage(inner);
    if (live) startTour(inner);
    else if (slide !== "map") E.enter(pick(E, slide));
    else startTour(inner);
    refocus();
    S.busy = false;
    update();
  }
  /* out of the translator, back to 2.2's island view: with the translator marked,
     or (then = "first") straight on to 2.2's first own slide, the walk's next step */
  async function zoomOut(then) {
    var parent = S.island;
    S.busy = true;
    var outer = frames[parent], inner = cur();
    if (!inner.live) await atMap(inner);
    stopTour(inner);
    await zoom(outer, inner, false, 550);
    S.sub = null; S.subLive = false;
    showFrame(parent);
    hush(inner);
    var E = stage(outer);
    if (then === "first" && E) E.enter(E.order[0]);
    else startTour(outer);
    refocus();
    S.busy = false;
    update();
    if (then !== "first") markDoor();
  }
  /* 2.2's first own slide ← : back to the island view, then into the translator again */
  async function backIntoTranslator() {
    S.busy = true;
    await atMap(cur());
    S.busy = false;
    return zoomIn(null);
  }
  /* between 2.1 and 2.2's own slides, inside the same island: a short fade */
  async function swapTo(id, slide, sub) {
    S.busy = true;
    veil.classList.add("on"); await sleep(280);
    var old = cur(), rec = await loaded(id);
    await atMap(rec);
    S.sub = sub; S.subLive = false;
    showFrame(id);
    if (old && old !== rec) hush(old);
    var E = stage(rec);
    E.enter(pick(E, slide));
    await sleep(40); veil.classList.remove("on");
    refocus();
    S.busy = false;
    update();
  }

  async function goWorld(focusId) {
    S.busy = true;
    buildWorld();
    var i = WORLD.indexOf(focusId);
    if (i >= 0) S.focus = i;
    var rec = cur();
    S.layer = "world";
    document.body.classList.remove("in");
    if (rec) hush(rec);
    playWorld();
    await sleep(300);
    S.island = null; S.sub = null; S.subLive = false; showFrame(null);
    S.busy = false;
    update();
  }

  /* ---- the keys ----------------------------------------------------------- */
  var NAV = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Enter: 1, Escape: 1 };
  /* the last item of an island's line, for ← from the next island */
  function crossBack(id) { return crossTo(id, "last"); }
  /* the first item of an island's line, for → from the previous island:
     an island with a nested one starts at its island view, the door before the zoom */
  function crossFwd(id) { return ISL[id].sub ? crossTo(id, null) : crossTo(id, "first"); }

  function onKey(k) {
    if (S.busy) return;
    var rec = cur(), E = stage(rec);
    var fwd = k === "ArrowRight", back = k === "ArrowLeft", down = k === "ArrowDown" || k === "Enter", up = k === "ArrowUp" || k === "Escape";
    if (S.layer === "world") {
      if (fwd || back) {
        var j = S.focus + (fwd ? 1 : -1);
        if (j < 0 || j >= WORLD.length) return bump();
        S.focus = j; playWorld(); update();
      } else if (down) openIsland(WORLD[S.focus]);
      else bump();
      return;
    }
    /* 2.1's living view, inside 2.2's translator: step 1 of 2.2 */
    if (S.sub && S.subLive) {
      if (fwd) zoomOut("first");                /* back out, on to 2.2's first own slide */
      else if (back || up) zoomOut(null);       /* back to 2.2's island view, the translator marked */
      else bump();
      return;
    }
    if (!E) return;
    var island = S.island, sub = S.sub, order = E.order;
    if (E.phase === "map") {
      if (sub) {                               /* 2.1's island view, inside 2.2 */
        if (down || fwd) E.enter(order[0]);
        else if (up || back) zoomOut();
        return;
      }
      /* a world island's view */
      if (down || fwd) { if (ISL[island].sub) zoomIn(null); else E.enter(order[0]); }
      else if (up) goWorld(island);
      else if (back) { var p0 = prevW(island); p0 ? crossBack(p0) : bump(); }
      return;
    }
    /* a slide, or on the way to one */
    var here = E.aim !== null && E.aim !== undefined ? E.aim : E.id, i = order.indexOf(here);
    if (up) { E.leave(); return; }
    if (down) return bump();
    if (fwd) {
      if (i >= 0 && i < order.length - 1) return E.goto(order[i + 1]);
      if (sub) return swapTo(island, "first", null);           /* 2.1's last → 2.2's first own slide */
      var n = nextW(island); n ? crossFwd(n) : bump();
      return;
    }
    if (back) {
      if (i > 0) return E.goto(order[i - 1]);
      if (sub) { E.leave(); return; }                          /* (deep link) 2.1's first ← 2.1's island view */
      if (ISL[island].sub) return backIntoTranslator();        /* 2.2's first ← 2.1's living view */
      var p = prevW(island); p ? crossBack(p) : bump();
    }
  }
  window.addEventListener("keydown", function (e) {
    if (!NAV[e.key] || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    onKey(e.key);
  });

  /* ---- where am I: the strip and the hash, read off the stage ------------- */
  var lastHash = null;
  function where() {
    if (S.layer === "world" || !S.island) return { layer: "world", id: WORLD[S.focus] };
    var E = stage(cur()), base = { id: S.island, sub: S.sub, live: !!(S.sub && S.subLive) };
    if (!E || E.phase === "map") return Object.assign(base, { layer: S.sub ? "sub" : "island" });
    var here = E.aim !== null && E.aim !== undefined ? E.aim : E.id;
    var name = "";
    try { name = (E.slides[here] && E.slides[here].name) || ""; } catch (e) {}
    return Object.assign(base, { layer: "slide", k: E.order.indexOf(here), n: E.order.length, name: name });
  }
  /* the island's whole count: the nested island's living view is step 1 of its parent */
  function total(id) {
    var E = stage(frames[id]);
    return { own: E ? E.order.length : 0, sub: ISL[id].sub ? 1 : 0 };
  }
  function update() {
    var w = where(), I = ISL[w.id], path;
    if (w.layer === "world") {
      crumb.textContent = "The talk · " + I.sec + " › " + I.name;
      pos.textContent = "island " + (S.focus + 1) + " / " + WORLD.length;
      path = S.focus ? "#/@" + w.id : "#/";
    } else {
      var trail = I.sec + " › " + I.name + (w.sub ? " › " + SUBNAME[w.sub] : "");
      var T = total(w.id), all = T.own + T.sub;
      if (w.layer === "island") { crumb.textContent = trail; pos.textContent = "island view"; path = "#/" + w.id; }
      else if (w.layer === "sub" && w.live) {          /* 2.1's living view: step 1 of 2.2 */
        crumb.textContent = trail + " › step 1 / " + all;
        pos.textContent = w.id + " · 1 / " + all;
        path = "#/" + w.id + "/translation";
      }
      else if (w.layer === "sub") { crumb.textContent = trail + " › its slides (not in the walk)"; pos.textContent = "translator · 2.1's island view"; path = "#/" + w.id + "/translation/slides"; }
      else if (w.sub) {                                 /* a deep link into 2.1's slides, out of the walk */
        crumb.textContent = trail + " › 2.1's slide " + (w.k + 1) + " / " + w.n + (w.name ? " · " + w.name : "") + " (not in the walk)";
        pos.textContent = w.sub + " · " + (w.k + 1) + " / " + w.n;
        path = "#/" + w.id + "/translation/" + (w.k + 1);
      }
      else {
        var at = T.sub + w.k + 1;
        crumb.textContent = trail + (T.sub ? " › step " + at + " / " + all : " › slide " + (w.k + 1) + " / " + w.n) + (w.name ? " · " + w.name : "");
        pos.textContent = w.id + " · " + at + " / " + all;
        path = "#/" + w.id + "/" + (w.k + 1);
      }
    }
    if (path !== lastHash) { lastHash = path; try { history.replaceState(null, "", path); } catch (e) {} }
  }
  setInterval(function () { if (!S.busy) update(); }, 200);

  /* ---- arrival: the hash, else the world --------------------------------- */
  function parseHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) return { layer: "world", id: WORLD[0] };
    if (h[0] === "@") return { layer: "world", id: h.slice(1) };
    var p = h.split("/");
    if (p[0] === "2.1") p = ["2.2", "translation"].concat(p.slice(1));      /* the alias */
    if (!ISL[p[0]]) return { layer: "world", id: WORLD[0] };
    var r = { id: p[0], layer: "island", k: null };
    if (p[1] === "translation" && ISL[p[0]].sub) {
      r.sub = true; p = [p[0]].concat(p.slice(2));
      if (p[1] === "slides") { r.k = "map"; return r; }
    }
    if (p.length > 1 && /^\d+$/.test(p[1])) r.k = +p[1] - 1;
    return r;
  }
  async function arrive() {
    var at = parseHash();
    if (at.layer === "world") return goWorld(at.id);
    var wi = WORLD.indexOf(at.id); if (wi >= 0) S.focus = wi;
    if (at.sub) {
      await mount(at.id, null, false);
      return zoomIn(at.k);
    }
    return mount(at.id, at.k, false);
  }
  arrive();

  /* for the walk: the shell's own state, read from outside */
  window.Talk = {
    get state() {
      var E = stage(cur());
      return Object.assign({ busy: S.busy, frames: Object.keys(frames), hash: location.hash,
                             flying: !!(E && E.flying), phase: E ? E.phase : null, crumb: crumb.textContent + " | " + pos.textContent }, where());
    },
    key: onKey
  };
})();
