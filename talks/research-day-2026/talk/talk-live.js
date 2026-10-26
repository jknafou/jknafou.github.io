/* ?live=1: THE FALLBACK SHELL, the island videos with the LIVE slides pages (the
 * version of 26 October 2026, 21:00). talk.js loads it instead of itself on ?live=1.
 *
 * The talk's navigation shell (26 October 2026), a pragmatic stand-in for
 * world/FINAL-PLAN.md section 1.
 *
 * LEVELS OF DETAIL (the author, 26 October 2026: "Couln't the world be a simple
 * gif and it would load the rendering when clicking on it? Something lighter
 * until a click ... Load only when necessary"):
 *   WORLD   four looping VIDEOS of the islands' living views (media/<id>-tile.*),
 *           their signed stills as posters. No iframe, no SVG.
 *   ISLAND  one full-size looping VIDEO of the island (media/<id>.*), with HTML
 *           hotspots over its clickable regions. The island's heavy slides page
 *           loads behind it, hidden and resting; the hotspots come from it.
 *   SLIDE   the slides page itself, its entry played from rest, crossfaded in
 *           over the video. Going back up crossfades to the video at frame 0,
 *           which is the signed still the page rests on.
 * The flights (world <-> island, 2.2's translator <-> 2.1) move video elements
 * by transform and opacity only, on the compositor.
 *
 * 2.1 is the inside of 2.2's translator ("I want 2.1 nested in 2.2 in the
 * translation part"), and 2.2's first step is 2.1's living view (its video):
 *   1.1 slides … 1.1 last → (zoom into 2.2's translator) 2.1's living view
 *   → 2.2's slides … → 3.1's slides … → 4.1's slides; ← exactly backwards.
 * ↓/Enter goes in, ↑/Escape goes out a layer (2.1 → 2.2's island view with the
 * translator marked → the world).
 * Hash: #/ (world), #/@3.1 (world, focus), #/2.2 (island view), #/2.2/3 (2.2's
 * slide 3), #/2.2/translation (2.1's living view); #/2.1 is an alias.
 * ?chrome=0 hides the strip; ?reduced=1 (or the OS setting) holds every video on
 * its still and turns the flights into short crossfades.
 * If a video cannot load, its poster (the signed still) stands in.
 * Media are made by make_media.mjs, stills by stills.mjs.
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
  var WORLD = ["1.1", "2.2", "3.1", "4.1"];
  var BASE = "../";
  var params = new URLSearchParams(location.search);
  var REDUCED = params.get("reduced") === "1" ||
    !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var slidesUrl = function (id) { return BASE + "island-" + id + "-slides.html?autostart=0" + (REDUCED ? "&reduced=1" : ""); };
  var stillUrl = function (id) { return "stills/" + id + ".webp"; };
  if (params.get("chrome") === "0") document.body.classList.add("nochrome");

  var $ = function (id) { return document.getElementById(id); };
  var viewEl = $("view"), worldEl = $("world"), stageEl = $("stage"), vidsEl = $("vids"), hotsEl = $("hots");
  var veil = $("veil"), loading = $("loading"), fly = $("fly"), mark = $("mark");
  var crumb = $("crumb"), pos = $("pos"), strip = $("strip");

  /* layer: world | island | sub (2.1's living view) | slide */
  var S = { layer: "world", focus: 0, island: null, busy: false };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var nextFrame = function () { return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); };
  function bump() { strip.classList.remove("bump"); void strip.offsetWidth; strip.classList.add("bump"); }
  function refocus() { try { window.focus(); } catch (e) {} }

  /* ---- what the media are: aspect and frame of each island's living view ---- */
  var META = { "1.1": { aspect: 0.771 }, "2.1": { aspect: 1 }, "2.2": { aspect: 0.769 }, "3.1": { aspect: 1.275 }, "4.1": { aspect: 1.79 } };
  var metaReady = Promise.all([
    fetch("stills/stills.json").then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch("media/media.json").then(function (r) { return r.json(); }).catch(function () { return {}; })
  ]).then(function (j) {
    [j[0], j[1]].forEach(function (m) { Object.keys(m).forEach(function (k) { META[k] = Object.assign(META[k] || {}, m[k]); }); });
    layoutWorld();
  });

  function video(id, tile) {
    var v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("disablepictureinpicture", "");
    v.preload = "auto"; v.poster = stillUrl(id);
    var base = "media/" + id + (tile ? "-tile" : "");
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (s) {
      var so = document.createElement("source"); so.src = base + "." + s[0]; so.type = s[1]; v.appendChild(so);
    });
    return v;
  }
  function play(v) { if (REDUCED || !v) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function ready(v, ms) {
    return new Promise(function (res) {
      if (v.readyState >= 2) return res(true);
      var done = false, fin = function (ok) { if (!done) { done = true; res(ok); } };
      v.addEventListener("loadeddata", function () { fin(true); }, { once: true });
      setTimeout(function () { fin(v.readyState >= 2); }, ms || 4000);
    });
  }
  function seekTo(v, t) {
    return new Promise(function (res) {
      try {
        if (!(v.duration > 0)) return res();
        var tt = Math.max(0, t % v.duration);
        if (Math.abs(v.currentTime - tt) < 0.02) return res();
        var to = setTimeout(res, 600);
        v.addEventListener("seeked", function () { clearTimeout(to); res(); }, { once: true });
        v.currentTime = tt;
      } catch (e) { res(); }
    });
  }

  /* ---- the world: four tile videos -------------------------------------- */
  var cells = [];
  function buildWorld() {
    if (cells.length) return;
    WORLD.forEach(function (id, i) {
      var c = document.createElement("div"); c.className = "cell"; c.dataset.id = id;
      var f = document.createElement("div"); f.className = "frame";
      var v = video(id, true); v.className = "tilevid"; if (!REDUCED) v.autoplay = true;
      var lab = document.createElement("div"); lab.className = "label"; lab.textContent = ISL[id].sec + " · " + ISL[id].name;
      f.appendChild(v); c.appendChild(f); c.appendChild(lab); worldEl.appendChild(c);
      f.addEventListener("click", function () { if (S.layer !== "world" || S.busy) return; S.focus = i; markFocus(); openIsland(id); });
      cells.push({ id: id, el: c, vid: v, frame: f });
      play(v);
    });
    layoutWorld();
  }
  function layoutWorld() {
    if (!cells.length) return;
    var W = worldEl.clientWidth, H = worldEl.clientHeight, gap = Math.max(12, W * 0.015), lab = 26;
    var asp = cells.map(function (c) { return (META[c.id] && META[c.id].aspect) || 1; });
    var sum = asp.reduce(function (a, b) { return a + b; }, 0);
    var h = Math.min(H * 0.9 - lab, (W * 0.96 - gap * (cells.length - 1)) / sum);
    cells.forEach(function (c, i) {
      c.el.style.flex = "0 0 " + Math.floor(asp[i] * h) + "px";
      c.el.style.height = Math.floor(h + lab) + "px";
    });
    worldEl.style.gap = gap + "px";
  }
  window.addEventListener("resize", function () { layoutWorld(); placeVideos(); if (S.layer === "island") buildHots(S.island); });
  function markFocus() { cells.forEach(function (c, i) { c.el.classList.toggle("focus", i === S.focus); }); }
  function worldPlaying(on) { cells.forEach(function (c) { if (on) play(c.vid); else c.vid.pause(); }); }
  function cellOf(id) { return cells.filter(function (x) { return x.id === id; })[0]; }
  function tileRect(id) {
    var c = cellOf(id); if (!c) return null;
    var b = c.vid.getBoundingClientRect(), v = viewEl.getBoundingClientRect();
    return { x: b.left - v.left, y: b.top - v.top, w: b.width, h: b.height };
  }

  /* ---- where an island's picture sits on its slides page, in the view's pixels.
   * The page's <svg> fills the view, framed by its viewBox (xMidYMid meet); the
   * video is the living view's viewBox. Without the page, the page's framing is
   * reproduced: the island's box widened to 4:3, fitted to the view. */
  function fitRect(fr, vb) {
    var Vw = viewEl.clientWidth, Vh = viewEl.clientHeight;
    var s = Math.min(Vw / fr[2], Vh / fr[3]);
    var ox = (Vw - fr[2] * s) / 2, oy = (Vh - fr[3] * s) / 2;
    return { x: ox + (vb[0] - fr[0]) * s, y: oy + (vb[1] - fr[1]) * s, w: vb[2] * s, h: vb[3] * s };
  }
  function islandRect(id) {
    var m = META[id] || {}, vb = m.vb || [0, 0, 1000 * (m.aspect || 1), 1000];
    var rec = frames[id];
    try {
      var sv = rec.win.document.querySelector("body > svg"), r = sv.getBoundingClientRect();
      var f = (sv.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
      if (f.length === 4 && f[2] > 0 && r.width > 0) {
        var s = Math.min(r.width / f[2], r.height / f[3]);
        var ox = r.left + (r.width - f[2] * s) / 2, oy = r.top + (r.height - f[3] * s) / 2;
        return { x: ox + (vb[0] - f[0]) * s, y: oy + (vb[1] - f[1]) * s, w: vb[2] * s, h: vb[3] * s };
      }
    } catch (e) {}
    var a = vb[2] / vb[3], fr = a < 4 / 3 ? [vb[0] - (vb[3] * 4 / 3 - vb[2]) / 2, vb[1], vb[3] * 4 / 3, vb[3]]
                                          : [vb[0], vb[1] - (vb[2] * 3 / 4 - vb[3]) / 2, vb[2], vb[2] * 3 / 4];
    return fitRect(fr, vb);
  }
  /* 2.1's living view stands alone: its own box fitted to the view */
  function subRect(id) { var m = META[id] || {}, vb = m.vb || [0, 0, 1000, 1000]; return fitRect(vb, vb); }
  function place(el, r) { el.style.left = r.x + "px"; el.style.top = r.y + "px"; el.style.width = r.w + "px"; el.style.height = r.h + "px"; }
  function over(at, to) {
    return "translate(" + (to.x - at.x) + "px," + (to.y - at.y) + "px) scale(" + (to.w / at.w) + "," + (to.h / at.h) + ")";
  }

  /* ---- the island videos: the current island's, and 2.1's inside 2.2 ------- */
  var vids = {};
  function bigVideo(id) {
    if (vids[id]) return vids[id];
    var v = video(id, false); v.className = "bigvid";
    vidsEl.appendChild(v);
    vids[id] = v;
    return v;
  }
  function rectFor(id) { return id === "2.1" ? subRect(id) : islandRect(id); }
  /* a video's frame holds the drawing with the living view's own margin (2% a side,
     media.json "content"): the element's box is the drawing's box widened by it */
  function expand(id, r) {
    var c = (META[id] && META[id].content) || [0.02, 0.02, 0.96, 0.96];
    var w = r.w / c[2], h = r.h / c[3];
    return { x: r.x - c[0] * w, y: r.y - c[1] * h, w: w, h: h };
  }
  function placeVideos() { Object.keys(vids).forEach(function (id) { place(vids[id], expand(id, rectFor(id))); }); }
  /* the slides page's own ground (its margin colour and its 4:3 card), drawn behind
     the island video so the hand-off between the two changes nothing but motion */
  var card = document.createElement("div"); card.id = "card"; vidsEl.appendChild(card);
  function ground(id) {
    var rec = id && id !== "2.1" ? frames[id] : null;
    try {
      var d = rec.win.document, sv = d.querySelector("body > svg"), r = sv.getBoundingClientRect();
      var bg = rec.win.getComputedStyle(d.body).backgroundColor, cb = rec.win.getComputedStyle(sv).backgroundColor;
      vidsEl.style.background = bg;
      card.style.background = cb && cb !== "rgba(0, 0, 0, 0)" ? cb : "";
      place(card, { x: r.left, y: r.top, w: r.width, h: r.height }); card.style.display = "block";
      return;
    } catch (e) {}
    vidsEl.style.background = ""; card.style.display = "none";
  }
  function showVideo(id) {
    ground(id);
    Object.keys(vids).forEach(function (k) { vids[k].classList.toggle("on", k === id); if (k !== id) vids[k].pause(); });
    if (id) { place(bigVideo(id), expand(id, rectFor(id))); vids[id].classList.add("on"); play(vids[id]); }
  }
  function pruneVideos(keep) {
    Object.keys(vids).forEach(function (id) {
      if (keep.indexOf(id) >= 0) return;
      var v = vids[id]; delete vids[id];
      v.pause(); while (v.firstChild) v.removeChild(v.firstChild); v.removeAttribute("src"); v.load(); v.remove();
    });
  }

  /* ---- the slides pages: the current island and the next, never more ------- */
  var frames = {};
  function frameFor(id) {
    if (frames[id]) return frames[id];
    var el = document.createElement("iframe");
    el.src = slidesUrl(id); el.title = id; el.setAttribute("tabindex", "-1");
    var rec = { id: id, el: el, win: null };
    rec.ready = new Promise(function (res) {
      el.addEventListener("load", function () {
        var w = el.contentWindow; rec.win = w;
        hookFrame(rec);
        (function wait(n) {
          if ((w.EntryStage && w.EntryStage.order) || n > 400) { stopTour(rec); res(rec); return; }
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
    var st = d.createElement("style");
    st.textContent = "#entry-hud,#fixed-live-hint{display:none!important}";
    d.head.appendChild(st);
    var back = function () { setTimeout(refocus, 0); };
    w.addEventListener("pointerup", back, true);
    w.addEventListener("focus", back);
    w.addEventListener("click", function (e) {             /* a link never navigates the page */
      var a = e.target && e.target.closest && e.target.closest("a");
      if (a) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    w.addEventListener("keydown", function (e) { if (NAV[e.key]) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  }
  function stage(rec) { try { return rec && rec.win && rec.win.EntryStage; } catch (e) { return null; } }
  function fl(rec) { try { return rec && rec.win && rec.win.FixedLive; } catch (e) { return null; } }
  function stopTour(rec) { var F = fl(rec); if (F && F.running) { try { F.stop(); } catch (e) {} } }
  function cur() { return S.island ? frames[S.island] : null; }
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
  /* the island on stage and the next one's page; the island's videos */
  function keepSet(id) {
    var n = nextW(id), k = [id];
    if (n) k.push(n);
    prune(k);
    k.forEach(function (x) { frameFor(x).ready.then(function (r) { if (!(S.island === x && S.layer === "slide")) hush(r); }); });
    pruneVideos(ISL[id].sub ? [id, ISL[id].sub] : [id]);
  }
  /* a page out of sight: at its island view, its tour stopped */
  function hush(rec) {
    var E = stage(rec);
    if (E && E.phase !== "map") { try { E.leave(); } catch (e) {} }
    var t = 0;
    (function wait() {
      if (S.island === rec.id && S.layer === "slide") return;
      var E2 = stage(rec);
      if (E2 && E2.phase === "map" && !E2.flying) { stopTour(rec); return; }
      if (++t < 100) setTimeout(wait, 50);
    })();
  }
  async function atMap(rec) {
    var E = stage(rec);
    if (!E) return;
    if (E.phase !== "map") { try { E.leave(); } catch (e) {} }
    for (var i = 0; i < 120; i++) {
      E = stage(rec);
      if (E.phase === "map" && !E.flying) { stopTour(rec); return; }
      await sleep(50);
    }
  }
  function showFrame(id) { Object.keys(frames).forEach(function (k) { frames[k].el.classList.toggle("on", k === id); }); }
  async function loaded(id) {
    var rec = frameFor(id), shown = false;
    var t0 = setTimeout(function () { if (!shown) loading.classList.add("on"); }, 250);
    await rec.ready;
    shown = true; clearTimeout(t0); loading.classList.remove("on");
    return rec;
  }
  function pick(E, slide) {
    var o = E.order;
    return o[slide === "first" ? 0 : slide === "last" ? o.length - 1 : Math.max(0, Math.min(o.length - 1, slide))];
  }

  /* ---- hotspots over the island video, from the page's own hit boxes -------- */
  function buildHots(id) {
    hotsEl.innerHTML = "";
    var rec = frames[id], E = stage(rec);
    if (!E || S.island !== id || S.layer !== "island") return;
    var d; try { d = rec.win.document; } catch (e) { return; }
    var sub = ISL[id].sub, spots = [];
    Array.prototype.forEach.call(d.querySelectorAll("[data-hit]"), function (el) {
      var rid = el.getAttribute("data-hit");
      if (!E.slides[rid] && !(sub && rid === "1")) return;
      var b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) return;
      spots.push({ rid: rid, b: b });
    });
    if (sub) { var a = d.querySelector("a.subisland"); if (a) spots.push({ rid: "1", b: a.getBoundingClientRect() }); }
    spots.sort(function (p, q) { return q.b.width * q.b.height - p.b.width * p.b.height; });   /* the smallest on top */
    spots.forEach(function (s) {
      var h = document.createElement("div"); h.className = "hot";
      var pad = Math.max(0, (40 - Math.min(s.b.width, s.b.height)) / 2);
      place(h, { x: s.b.left - pad, y: s.b.top - pad, w: s.b.width + 2 * pad, h: s.b.height + 2 * pad });
      var toSub = sub && s.rid === "1";
      h.title = toSub ? SUBNAME[sub] : ((E.slides[s.rid] || {}).name || "");
      h.addEventListener("click", function () {
        if (S.busy || S.layer !== "island") return;
        if (toSub) zoomIn(); else toSlide(s.rid);
      });
      hotsEl.appendChild(h);
    });
  }

  /* ---- the flights: transform and opacity on video elements only ------------ */
  async function animate(els, ms) {
    document.body.classList.add("flying");
    els.forEach(function (o) { o.el.style.transition = "none"; o.el.style.transform = REDUCED ? (o.to.transform || "none") : (o.from.transform || "none"); o.el.style.opacity = o.from.opacity == null ? 1 : o.from.opacity; });
    await nextFrame();
    var d = REDUCED ? 180 : ms;
    var tr = "transform " + d + "ms cubic-bezier(.45,0,.2,1), opacity " + d + "ms ease";
    els.forEach(function (o) { o.el.style.transition = tr; o.el.style.transform = o.to.transform || "none"; o.el.style.opacity = o.to.opacity == null ? 1 : o.to.opacity; });
    await sleep(d + 30);
    document.body.classList.remove("flying");
  }
  function clean(el) { el.style.transition = el.style.transform = el.style.opacity = el.style.zIndex = ""; }
  /* a copy of an island's tile video, in step with the one it leaves, for a flight */
  function flyVideo(id, from, r) {
    var v = video(id, true); v.className = "flyvid"; place(v, r);
    fly.appendChild(v);
    v.addEventListener("loadedmetadata", function () { try { v.currentTime = from ? (from.currentTime % (v.duration || 1e9)) : 0; } catch (e) {} }, { once: true });
    play(v);
    return v;
  }

  /* world -> island: the tile flies to the island's place, the island video takes over */
  async function openIsland(id) {
    S.busy = true;
    buildWorld();
    var c = cellOf(id), tile = tileRect(id), R = expand(id, islandRect(id));
    var big = bigVideo(id); place(big, R);
    var fv = flyVideo(id, c && c.vid, R);
    fly.className = "on clear";
    await ready(fv, 1500);
    document.body.classList.add("in");
    await animate([{ el: fv, from: { transform: tile ? over(R, tile) : "none" }, to: { transform: "none" } }], 560);
    worldPlaying(false);
    await ready(big, 3000); await seekTo(big, fv.currentTime);
    S.island = id; S.layer = "island";
    showFrame(null); showVideo(id);
    await nextFrame();
    fly.innerHTML = ""; fly.className = "";
    keepSet(id);
    S.busy = false; refocus(); update();
    afterIsland(id);
  }
  /* the island view is up: its page loads behind, and the hotspots follow it */
  function afterIsland(id) {
    frameFor(id).ready.then(async function (rec) {
      if (!(S.island === id && S.layer === "island")) return;
      await atMap(rec);
      if (S.island === id && S.layer === "island") { placeVideos(); ground(id); buildHots(id); }
    });
  }

  /* island -> world: the island flies back to its tile */
  async function goWorld(focusId) {
    S.busy = true;
    buildWorld();
    var i = WORLD.indexOf(focusId); if (i >= 0) S.focus = i;
    markFocus();
    var from = S.island, big = from && vids[from];
    hotsEl.innerHTML = "";
    S.layer = "world";
    if (from && big && big.classList.contains("on")) {
      var R = expand(from, islandRect(from)), tile = tileRect(from);
      var fv = flyVideo(from, big, R); fly.className = "on";
      await ready(fv, 800);
      await nextFrame();
      fly.className = "on clear";
      showVideo(null);
      var c = cellOf(from); if (c) { try { c.vid.currentTime = (big.currentTime || 0) % (c.vid.duration || 1e9); } catch (e) {} }
      document.body.classList.remove("in");
      worldPlaying(true);
      await animate([{ el: fv, from: { transform: "none" }, to: { transform: tile ? over(R, tile) : "none" } }], 520);
      fly.innerHTML = ""; fly.className = "";
    } else {
      showVideo(null);
      document.body.classList.remove("in");
      worldPlaying(true);
      await sleep(300);
    }
    showFrame(null);
    if (cur()) hush(cur());
    S.island = null;
    S.busy = false; update();
  }

  /* island view -> a slide: the page rests under the video; the video fades as the entry plays */
  async function toSlide(rid) {
    var id = S.island;
    S.busy = true;
    var rec = await loaded(id);
    await atMap(rec);
    hotsEl.innerHTML = "";
    showFrame(id);
    S.layer = "slide";
    stage(rec).enter(rid);
    if (vids[id] && vids[id].classList.contains("on")) {
      vidsEl.style.transition = "opacity 260ms ease"; vidsEl.style.opacity = 0;
      await sleep(280);
    }
    showVideo(null); vidsEl.style.transition = ""; vidsEl.style.opacity = "";
    keepSet(id);
    S.busy = false; refocus(); update();
  }
  /* a slide -> the island view: the page plays its way out, then the video takes over at its still */
  async function toIsland() {
    var id = S.island, rec = cur();
    S.busy = true;
    await atMap(rec);
    var v = bigVideo(id);
    await ready(v, 2000); await seekTo(v, 0);
    vidsEl.style.transition = "none"; vidsEl.style.opacity = 0;
    showVideo(id); v.pause();
    await nextFrame();
    vidsEl.style.transition = "opacity 220ms ease"; vidsEl.style.opacity = 1;
    await sleep(240); vidsEl.style.transition = ""; vidsEl.style.opacity = ""; play(v);
    showFrame(null);
    S.layer = "island";
    S.busy = false; update();
    buildHots(id);
  }

  /* the translator: 2.2's video grows about the translator's box while 2.1's grows out of it */
  function doorBox() {
    try {
      var b = frames[S.island].win.document.querySelector("a.subisland").getBoundingClientRect();
      if (b.width > 4) return { x: b.left, y: b.top, w: b.width, h: b.height };
    } catch (e) {}
    var R = islandRect(S.island);                     /* without the page: where 2.2's still has it */
    return { x: R.x + R.w * 0.22, y: R.y + R.h * 0.07, w: R.w * 0.17, h: R.h * 0.22 };
  }
  async function zoomTranslator(into) {
    var parent = S.island, sub = ISL[parent].sub;
    var A = bigVideo(parent), C = bigVideo(sub);
    var R2 = islandRect(parent), R1 = subRect(sub), b = doorBox();
    var eA = function (r) { return expand(parent, r); }, eC = function (r) { return expand(sub, r); };
    place(A, eA(R2)); place(C, eC(R1));
    var s = Math.max(b.w / R1.w, b.h / R1.h);
    var door = { x: b.x + b.w / 2 - R1.w * s / 2, y: b.y + b.h / 2 - R1.h * s / 2, w: R1.w * s, h: R1.h * s };
    var k = R1.w / door.w, cx = b.x + b.w / 2, cy = b.y + b.h / 2, tx = R1.x + R1.w / 2, ty = R1.y + R1.h / 2;
    var big = { x: tx + (R2.x - cx) * k, y: ty + (R2.y - cy) * k, w: R2.w * k, h: R2.h * k };
    await Promise.all([ready(A, 3000), ready(C, 3000)]);
    if (into) await seekTo(C, 0);
    ground(null);
    A.style.zIndex = 1; C.style.zIndex = 2;
    var from = [into ? "none" : over(eA(R2), eA(big)), into ? over(eC(R1), eC(door)) : "none"];
    A.style.transition = C.style.transition = "none";
    A.style.transform = from[0]; C.style.transform = from[1];
    A.style.opacity = into ? 1 : 0; C.style.opacity = into ? 0 : 1;
    A.classList.add("on"); C.classList.add("on"); play(A); play(C);
    await animate([
      { el: A, from: { transform: from[0], opacity: into ? 1 : 0 }, to: { transform: into ? over(eA(R2), eA(big)) : "none", opacity: into ? 0 : 1 } },
      { el: C, from: { transform: from[1], opacity: into ? 0 : 1 }, to: { transform: into ? "none" : over(eC(R1), eC(door)), opacity: into ? 1 : 0 } }
    ], into ? 650 : 550);
    showVideo(into ? sub : parent);
    clean(A); clean(C);
  }
  async function zoomIn() {
    S.busy = true;
    hotsEl.innerHTML = ""; showFrame(null);
    await zoomTranslator(true);
    S.layer = "sub";
    S.busy = false; refocus(); update();
  }
  /* out of the translator: to 2.2's island view (the translator marked), or on to its first slide */
  async function zoomOut(then) {
    S.busy = true;
    await zoomTranslator(false);
    S.layer = "island";
    S.busy = false; update();
    if (then === "first") { S.busy = true; var rec = await loaded(S.island); S.busy = false; return toSlide(stage(rec).order[0]); }
    markDoor();
    afterIsland(S.island);
  }
  function markDoor() {
    var b = doorBox(), pad = 8;
    place(mark, { x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad });
    mark.classList.add("on");
    clearTimeout(markDoor.t);
    markDoor.t = setTimeout(function () { mark.classList.remove("on"); }, 1400);
  }

  /* between islands: a short fade through paper */
  async function crossTo(id, slide) {
    S.busy = true;
    veil.classList.add("on"); await sleep(300);
    hotsEl.innerHTML = "";
    var old = S.island, rec = await loaded(id);
    await atMap(rec);
    S.island = id;
    if (old && old !== id && frames[old]) hush(frames[old]);
    keepSet(id);
    if (slide === "translation") {                    /* → into 2.2: straight through its translator */
      showFrame(null); showVideo(id); vids[id].pause(); await seekTo(vids[id], 0);
      S.layer = "island";
      await nextFrame();
      veil.classList.remove("on"); await sleep(300);
      S.busy = false;
      return zoomIn();
    }
    if (slide === null) { showFrame(null); showVideo(id); S.layer = "island"; }
    else { showVideo(null); showFrame(id); S.layer = "slide"; stage(rec).enter(pick(stage(rec), slide)); }
    await nextFrame();
    veil.classList.remove("on");
    S.busy = false; refocus(); update();
    if (slide === null) afterIsland(id);
  }

  /* ---- the keys ----------------------------------------------------------- */
  var NAV = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Enter: 1, Escape: 1 };
  function onKey(k) {
    if (S.busy) return;
    var fwd = k === "ArrowRight", back = k === "ArrowLeft", down = k === "ArrowDown" || k === "Enter", up = k === "ArrowUp" || k === "Escape";
    var island = S.island;
    if (S.layer === "world") {
      if (fwd || back) {
        var j = S.focus + (fwd ? 1 : -1);
        if (j < 0 || j >= WORLD.length) return bump();
        S.focus = j; markFocus(); update();
      } else if (down) openIsland(WORLD[S.focus]);
      else bump();
      return;
    }
    if (S.layer === "sub") {                     /* 2.1's living view: 2.2's first step */
      if (fwd) zoomOut("first");
      else if (up) zoomOut(null);
      else if (back) { var pb = prevW(island); pb ? crossTo(pb, "last") : zoomOut(null); }
      else bump();
      return;
    }
    if (S.layer === "island") {
      if (down || fwd) {
        if (ISL[island].sub) return zoomIn();
        S.busy = true;
        return loaded(island).then(function (rec) { S.busy = false; toSlide(stage(rec).order[0]); });
      }
      if (up) return goWorld(island);
      if (back) { var p0 = prevW(island); return p0 ? crossTo(p0, "last") : bump(); }
      return;
    }
    var E = stage(cur()); if (!E) return;      /* a slide */
    var order = E.order, here = E.aim !== null && E.aim !== undefined ? E.aim : E.id, i = order.indexOf(here);
    if (up) return toIsland();
    if (down) return bump();
    if (fwd) {
      if (i >= 0 && i < order.length - 1) return E.goto(order[i + 1]);
      var n = nextW(island);
      return n ? crossTo(n, ISL[n].sub ? "translation" : "first") : bump();
    }
    if (back) {
      if (i > 0) return E.goto(order[i - 1]);
      if (ISL[island].sub) return (async function () { await toIsland(); await zoomIn(); })();   /* 2.2's first slide ← the translation */
      var p = prevW(island); return p ? crossTo(p, "last") : bump();
    }
  }
  window.addEventListener("keydown", function (e) {
    if (!NAV[e.key] || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    onKey(e.key);
  });

  /* ---- where am I --------------------------------------------------------- */
  var lastHash = null;
  function where() {
    if (S.layer === "world" || !S.island) return { layer: "world", id: WORLD[S.focus] };
    if (S.layer !== "slide") return { layer: S.layer, id: S.island };
    var E = stage(cur());
    if (!E) return { layer: "island", id: S.island };
    var here = E.aim !== null && E.aim !== undefined ? E.aim : E.id, name = "";
    try { name = (E.slides[here] && E.slides[here].name) || ""; } catch (e) {}
    return { layer: "slide", id: S.island, k: E.order.indexOf(here), n: E.order.length, name: name };
  }
  function update() {
    var w = where(), I = ISL[w.id], path;
    if (w.layer === "world") {
      crumb.textContent = "The talk · " + I.sec + " › " + I.name;
      pos.textContent = "island " + (S.focus + 1) + " / " + WORLD.length;
      path = S.focus ? "#/@" + w.id : "#/";
    } else {
      var sub = I.sub ? 1 : 0, E = stage(frames[w.id]), own = E ? E.order.length : (w.n || 0), all = own + sub;
      var trail = I.sec + " › " + I.name;
      if (w.layer === "island") { crumb.textContent = trail; pos.textContent = "island view"; path = "#/" + w.id; }
      else if (w.layer === "sub") {
        crumb.textContent = trail + " › " + SUBNAME[I.sub] + " › step 1 / " + (all || "…");
        pos.textContent = w.id + " · 1 / " + (all || "…");
        path = "#/" + w.id + "/translation";
      } else {
        var at = sub + w.k + 1;
        crumb.textContent = trail + (sub ? " › step " + at + " / " + all : " › slide " + (w.k + 1) + " / " + w.n) + (w.name ? " · " + w.name : "");
        pos.textContent = w.id + " · " + at + " / " + all;
        path = "#/" + w.id + "/" + (w.k + 1);
      }
    }
    if (path !== lastHash) { lastHash = path; try { history.replaceState(null, "", path); } catch (e) {} }
  }
  setInterval(function () { if (!S.busy) update(); }, 250);

  /* ---- arrival ------------------------------------------------------------ */
  function parseHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) return { layer: "world", id: WORLD[0] };
    if (h[0] === "@") return { layer: "world", id: h.slice(1) };
    var p = h.split("/");
    if (p[0] === "2.1") p = ["2.2", "translation"];
    if (!ISL[p[0]]) return { layer: "world", id: WORLD[0] };
    if (p[1] === "translation" && ISL[p[0]].sub) return { layer: "sub", id: p[0] };
    if (p.length > 1 && /^\d+$/.test(p[1])) return { layer: "slide", id: p[0], k: +p[1] - 1 };
    return { layer: "island", id: p[0] };
  }
  async function arrive() {
    await metaReady;
    var at = parseHash();
    var wi = WORLD.indexOf(at.id); if (wi >= 0) S.focus = wi;
    if (at.layer === "world") { buildWorld(); markFocus(); update(); return; }
    document.body.classList.add("in");
    S.island = at.id; S.layer = "island";
    if (at.layer === "island") { showVideo(at.id); keepSet(at.id); update(); return afterIsland(at.id); }
    S.busy = true;
    var rec = await loaded(at.id);
    await atMap(rec);
    keepSet(at.id);
    if (at.layer === "sub") { showVideo(at.id); S.busy = false; return zoomIn(); }
    showFrame(at.id); S.layer = "slide";
    stage(rec).enter(pick(stage(rec), at.k));
    S.busy = false; update();
  }
  arrive();

  window.Talk = {
    get state() {
      var E = stage(cur());
      return Object.assign({ busy: S.busy, frames: Object.keys(frames), videos: Object.keys(vids), hash: location.hash,
        flying: !!(E && E.flying && S.layer === "slide"), phase: E ? E.phase : null,
        crumb: crumb.textContent + " | " + pos.textContent, hots: hotsEl.children.length }, where());
    },
    key: onKey
  };
})();
