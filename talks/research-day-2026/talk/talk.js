/* The talk's navigation shell (26 October 2026), a pragmatic stand-in for
 * world/FINAL-PLAN.md section 1.
 *
 * Three layers: WORLD (the four living views on one row) -> ISLAND (the
 * island's slides page, at its island view) -> SLIDE. The shell holds the
 * keyboard; the islands' pages are driven through their own test API,
 * `EntryStage` (enter / goto / leave / order / phase / id / aim), by
 * same-origin access to their iframes. Nothing inside an island page is
 * edited: the island's own hud is hidden by a style the shell adds to the
 * mounted copy, and the 2.2 door's link is caught before it navigates.
 *
 * Keys: down/Enter in, up/Escape out, left/right within the layer. From an
 * island's last slide, right crosses to the next island's first slide; from
 * its first slide, left crosses back to the previous island's last.
 * Hash: #/ (world), #/@3.1 (world, focus on 3.1), #/2.2 (island), #/2.2/3 (slide 3).
 * ?chrome=0 hides the strip.
 */
(function () {
  "use strict";

  var ISL = {
    "1.1": { sec: "1 Motivation", name: "1.1 Use case" },
    "2.1": { sec: "2 Methodology", name: "2.1 Translation workflow", parent: "2.2" },
    "2.2": { sec: "2 Methodology", name: "2.2 Pre-training" },
    "3.1": { sec: "3 Results", name: "3.1 Results" },
    "4.1": { sec: "4 Conclusion", name: "4.1 What is possible" }
  };
  var WORLD = ["1.1", "2.2", "3.1", "4.1"];            /* the world's row, in talk order */
  var CHAIN = ["1.1", "2.1", "2.2", "3.1", "4.1"];      /* the talk's slides, in order: 2.1 is 2.2's translator, told first */
  var BASE = "../";
  var liveUrl = function (id) { return BASE + "island-" + id + "-live.html?autostart=0"; };
  var slidesUrl = function (id) { return BASE + "island-" + id + "-slides.html?autostart=0"; };

  var params = new URLSearchParams(location.search);
  if (params.get("chrome") === "0") document.body.classList.add("nochrome");

  var $ = function (id) { return document.getElementById(id); };
  var worldEl = $("world"), stageEl = $("stage"), veil = $("veil"), loading = $("loading");
  var crumb = $("crumb"), pos = $("pos"), strip = $("strip");

  var S = { layer: "world", focus: 0, island: null, busy: false };
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
      ifr.addEventListener("load", function () { cell.loaded = true; playWorld(); });
      hit.addEventListener("mouseenter", function () { S.hover = i; playWorld(); });
      hit.addEventListener("mouseleave", function () { if (S.hover === i) S.hover = null; playWorld(); });
      hit.addEventListener("click", function () { if (S.layer !== "world" || S.busy) return; S.focus = i; openIsland(id); });
      cells.push(cell);
    });
  }
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

  /* ---- the slides pages: the current island and the next one, never more --- */
  var frames = {};                       /* id -> {el, win, ready} */
  function frameFor(id) {
    if (frames[id]) return frames[id];
    var el = document.createElement("iframe");
    el.src = slidesUrl(id); el.title = ISL[id].name; el.setAttribute("tabindex", "-1");
    var rec = { id: id, el: el, win: null };
    rec.ready = new Promise(function (res) {
      el.addEventListener("load", function () {
        var w = el.contentWindow; rec.win = w;
        hookFrame(rec);
        (function wait(n) {
          if ((w.EntryStage && w.EntryStage.order) || n > 300) { res(rec); return; }
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
    /* a link never navigates the island's frame; 2.2's door opens 2.1 */
    w.addEventListener("click", function (e) {
      var a = e.target && e.target.closest && e.target.closest("a");
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      if (rec.id === "2.2" && stage(rec) && stage(rec).phase === "map" && !S.busy) crossTo("2.1", null);
    }, true);
    /* if the keyboard ever does land inside, it is handed to the shell before the page sees it */
    w.addEventListener("keydown", function (e) {
      if (!NAV[e.key]) return;
      e.preventDefault(); e.stopImmediatePropagation();
    }, true);
  }
  function stage(rec) { try { return rec && rec.win && rec.win.EntryStage; } catch (e) { return null; } }
  function cur() { return S.island ? frames[S.island] : null; }
  function next(id) { var i = CHAIN.indexOf(id); return i >= 0 && i + 1 < CHAIN.length ? CHAIN[i + 1] : null; }
  function prev(id) { var i = CHAIN.indexOf(id); return i > 0 ? CHAIN[i - 1] : null; }
  function prune(keep) {
    Object.keys(frames).forEach(function (id) {
      if (keep.indexOf(id) >= 0) return;
      var r = frames[id]; delete frames[id];
      try { r.el.src = "about:blank"; } catch (e) {}
      r.el.remove();
    });
  }
  function keepSet(id) {
    var k = [id], n = next(id);
    if (n) k.push(n);
    prune(k);
    k.forEach(function (x) { frameFor(x); });
    /* the preloaded one holds its still: it is out of sight */
    if (n) frames[n].ready.then(function (r) { if (S.island !== n) hush(r); });
  }
  function hush(rec) {
    var E = stage(rec), F = fl(rec.win);
    if (E && E.phase !== "map") { try { E.leave(); } catch (e) {} }
    var t = 0;
    (function wait() {
      if (S.island === rec.id) return;
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

  /* ---- the moves -------------------------------------------------------- */
  async function mount(id, slide, fade) {
    /* bring island `id` on stage; slide = null (island view), "first", "last" or an index */
    S.busy = true;
    if (fade) { veil.classList.add("on"); await sleep(300); }
    var old = S.island;
    var rec = frameFor(id);
    var shown = false;
    var t0 = setTimeout(function () { if (!shown) loading.classList.add("on"); }, 250);
    await rec.ready;
    shown = true; clearTimeout(t0); loading.classList.remove("on");
    await atMap(rec);
    S.island = id; S.layer = "island";
    showFrame(id);
    document.body.classList.add("in");
    playWorld();
    if (old && old !== id && frames[old]) hush(frames[old]);
    var E = stage(rec), F = fl(rec.win);
    if (E && slide !== null && slide !== undefined) {
      var order = E.order, k = slide === "first" ? 0 : slide === "last" ? order.length - 1 : Math.max(0, Math.min(order.length - 1, slide));
      E.enter(order[k]);
    } else if (F && !F.running) { try { F.start(); } catch (e) {} }
    if (fade) { await sleep(40); veil.classList.remove("on"); }
    keepSet(id);
    refocus();
    S.busy = false;
    update();
  }
  function openIsland(id) { return mount(id, null, false); }
  function crossTo(id, slide) { return mount(id, slide, true); }

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
    S.island = null; showFrame(null);
    if (rec) S.island = null;
    S.busy = false;
    update();
  }

  /* ---- the keys ----------------------------------------------------------- */
  var NAV = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Enter: 1, Escape: 1 };
  function onKey(k) {
    if (S.busy) return;
    var rec = cur(), E = stage(rec);
    if (S.layer === "world") {
      if (k === "ArrowRight" || k === "ArrowLeft") {
        var j = S.focus + (k === "ArrowRight" ? 1 : -1);
        if (j < 0 || j >= WORLD.length) return bump();
        S.focus = j; playWorld(); update();
      } else if (k === "ArrowDown" || k === "Enter") openIsland(WORLD[S.focus]);
      else bump();
      return;
    }
    if (!E) return;
    var island = S.island;
    if (E.phase === "map") {                    /* the island view */
      if (k === "ArrowDown" || k === "Enter") E.enter(E.order[0]);
      else if (k === "ArrowUp" || k === "Escape") {
        if (ISL[island].parent) crossTo(ISL[island].parent, null);
        else goWorld(island);
      } else if (k === "ArrowRight") { var n = next(island); n ? crossTo(n, null) : bump(); }
      else if (k === "ArrowLeft") { var p = prev(island); p ? crossTo(p, null) : bump(); }
      return;
    }
    /* a slide (or on its way to one) */
    var order = E.order, here = E.aim !== null && E.aim !== undefined ? E.aim : E.id, i = order.indexOf(here);
    if (k === "ArrowUp" || k === "Escape") E.leave();
    else if (k === "ArrowRight") {
      if (i >= 0 && i < order.length - 1) E.goto(order[i + 1]);
      else { var nx = next(island); nx ? crossTo(nx, "first") : bump(); }
    } else if (k === "ArrowLeft") {
      if (i > 0) E.goto(order[i - 1]);
      else { var pv = prev(island); pv ? crossTo(pv, "last") : bump(); }
    } else bump();
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
    var E = stage(cur());
    if (!E || E.phase === "map") return { layer: "island", id: S.island };
    var here = E.aim !== null && E.aim !== undefined ? E.aim : E.id;
    var i = E.order.indexOf(here);
    var name = "";
    try { name = (E.slides[here] && E.slides[here].name) || ""; } catch (e) {}
    return { layer: "slide", id: S.island, k: i, n: E.order.length, name: name };
  }
  function update() {
    var w = where(), I = ISL[w.id], path;
    if (w.layer === "world") {
      crumb.textContent = "The talk · " + I.sec + " › " + I.name;
      pos.textContent = "island " + (S.focus + 1) + " / " + WORLD.length;
      path = S.focus ? "#/@" + w.id : "#/";
    } else {
      var trail = I.sec + " › " + (I.parent ? ISL[I.parent].name + " › " : "") + I.name;
      if (w.layer === "island") { crumb.textContent = trail; pos.textContent = "island view"; path = "#/" + w.id; }
      else {
        crumb.textContent = trail + " › " + (w.name || "slide");
        pos.textContent = "slide " + (w.k + 1) + " / " + w.n;
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
    if (!ISL[p[0]]) return { layer: "world", id: WORLD[0] };
    if (p.length > 1 && /^\d+$/.test(p[1])) return { layer: "slide", id: p[0], k: +p[1] - 1 };
    return { layer: "island", id: p[0] };
  }
  var at = parseHash();
  if (at.layer === "world") goWorld(at.id);
  else {
    var wi = WORLD.indexOf(ISL[at.id].parent || at.id); if (wi >= 0) S.focus = wi;
    mount(at.id, at.layer === "slide" ? at.k : null, false);
  }

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
