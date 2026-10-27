/* The talk's navigation shell (26 October 2026), a pragmatic stand-in for
 * world/FINAL-PLAN.md section 1.
 *
 * VIDEO AT EVERY LEVEL (the author, 26 October 2026 evening: "now it is really
 * smooth, can it be implemented at all the levels?"). Nothing heavy runs:
 *   WORLD   four looping tile videos of the islands' living views.
 *   ISLAND  the island page's resting picture (media/slides/<id>/rest-0.webp)
 *           with the island's looping video over its drawing, and HTML hotspots.
 *   SLIDE   the slide's resting picture (rest-<k>.webp, 2x); every move is a
 *           video captured from the island's own slides page: in-<k> (entry from
 *           the island view), out-<k> (back), fw-<k> (k -> k+1), bw-<k> (k+1 -> k).
 *           Each video starts on the picture it leaves and ends on the one it reaches.
 * ?live=1 loads talk-live.js instead: the same shell over the live slides pages.
 * ?reduced=1 (or the OS setting) cuts between the pictures; the videos hold still.
 *
 * The walk (→ forwards, ← exactly backwards):
 *   1.1's slides … → (fade, then a zoom into 2.2's translator) 2.1's living view,
 *   2.2's step 1 → 2.2's slides … → 3.1's … → 4.1's.
 * ↓ from 2.1's living view goes one level deeper, into 2.1's nine slides (the
 * author: "Can we add a depth for the translation island?"); there ←/→ move
 * between them and ↑ climbs back to the living view.
 * ↑/Escape climbs a layer: slide → island view → world.
 * Hash: #/ (world), #/@3.1, #/2.2 (island view), #/2.2/3 (2.2's slide 3),
 * #/2.2/translation (2.1's living view), #/2.2/translation/4 (2.1's slide 4);
 * #/2.1 and #/2.1/4 are aliases. ?chrome=0 hides the strip.
 * Media are made by make_media.mjs (--slides for these), stills by stills.mjs.
 *
 * THE RETRO WORLD (the author, 26 October 2026 evening: a city "in a kind of mario retro
 * games rendering"; the designs validated: "Love it"). The world level is the overworld
 * map of world/concepts/drafts/retro-city/, as videos made by make_retro.py
 * (media/retro/): Bert idles at the building of the current island (idle-<id>), ←/→ walk
 * him along the dirt road to the previous or next building (walk-<a>-<b>), ↓/Enter or a
 * click on a building plays its opening (open-<id>: the roof flies off, the walls fall,
 * the camera dives into the floor and ends ON the island view, which is under it), and
 * ↑/Escape from the island view plays it backwards (close-<id>) after the island's loop
 * is put back at its frame 0. ?world=old brings back the four tiles.
 *
 * THE ROOMS (the author, 26 October 2026, late: "could we adapt the background of each
 * island so that it matches its environement?"). Inside an island, at every level -- its
 * view, its slides, 2.1's depth inside the factory -- the room of its building
 * (media/retro/backdrop-<id>.webp, make_retro.py) is drawn BEHIND the island's card, and
 * the slide pictures and videos are clipped to the card: their margins are plain page
 * colour (measured on every rest picture and every move video), so only paper is cut, and
 * the signed card is shown untouched. Each room carries its title sign (backdrops.py),
 * which the opening switches on or drops into place. ?plain=1 turns the rooms off.
 *
 * THE TITLE (the author, 27 October 2026, the day of the talk: "the sky with the same texture
 * with the title, then with -> the camera tilt down to get to the city"). The talk opens on
 * media/retro/title.webp, the pixel sky above the map (title_scene.py, rendered by make_retro.py
 * --only title). →, ↓ or Enter (or a click) plays title-down.mp4, which lands on idle-1.1's loop:
 * Bert at the hospital. ← or ↑ from the map at the hospital plays title-up.mp4 back to it.
 * THE THANKS (the author, the same day: "show it at the end ... the last -> could tilt up with a
 * thank you in the sky"): → on 4.1's last slide leaves it (out-<k>), closes the station
 * (close-4.1) and tilts up from the map into thanks.webp (thanks-up.mp4); ← plays it all back
 * (thanks-down, open-4.1, in-<k>). → at the station on the map tilts up too.
 * Hash: #/ is the title, #/world the city at the hospital, #/thanks the thanks. With
 * ?world=old or ?reduced=1 the skies are stills and the moves are cuts.
 */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  if (params.get("live") === "1") {
    var sc = document.createElement("script"); sc.src = "talk-live.js"; document.body.appendChild(sc);
    return;
  }

  var ISL = {
    "1.1": { sec: "1 Motivation", name: "1.1 Use case" },
    "2.2": { sec: "2 Methodology", name: "2.2 Pre-training", sub: "2.1" },
    "3.1": { sec: "3 Results", name: "3.1 Results" },
    "4.1": { sec: "4 Conclusion", name: "4.1 What is possible" }
  };
  var SUBNAME = { "2.1": "Translation (2.1)" };
  var WORLD = ["1.1", "2.2", "3.1", "4.1"];
  var REDUCED = params.get("reduced") === "1" ||
    !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var RETRO = params.get("world") !== "old";
  var THEMED = params.get("plain") !== "1";
  if (!THEMED) document.body.classList.add("plain");
  var stillUrl = function (id) { return "stills/" + id + ".webp"; };
  var slideMedia = function (id, name) { return "media/slides/" + id + "/" + name; };
  if (params.get("chrome") === "0") document.body.classList.add("nochrome");

  /* ---- the clickable areas, as the author asked (26 October 2026 evening).
   * Boxes are in the drawing's own units (the island page's viewBox). A region
   * listed here REPLACES the boxes the page gives it; "union" merges the page's
   * boxes for that region into one, "boxes" are explicit, "pad" widens. */
  var HOTS = {
    "1.1": {
      "1.1": { union: true, pad: 10 },                                   /* the clinical case: one bigger box */
      "3.3": { boxes: "experiment" }                                     /* the experiment: the whole landmark */
    },
    "2.2": {
      "3": { union: true, pad: 6 },                                      /* pre-training: one big box */
      "4": { boxes: "finetuning" },                                      /* fine-tuning: models + modules, and the tasks */
      "4.1": { boxes: "pretrained" }                                     /* the pre-trained model, whole */
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var viewEl = $("view"), worldEl = $("world"), vidsEl = $("vids"), hotsEl = $("hots"), slideEl = $("slide");
  var veil = $("veil"), fly = $("fly"), mark = $("mark"), restImg = $("rest");
  var crumb = $("crumb"), pos = $("pos"), strip = $("strip");

  /* layer: world | island | sub (2.1's living view) | slide | subslide (2.1's slides) */
  var S = { layer: "world", focus: 0, island: null, k: 0, sk: 0, busy: false };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var nextFrame = function () { return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); };
  function bump() { strip.classList.remove("bump"); void strip.offsetWidth; strip.classList.add("bump"); }

  /* ---- what the media are ---------------------------------------------------- */
  var META = {}, SL = {}, RJ = null;
  var metaReady = Promise.all([
    fetch("stills/stills.json").then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch("media/media.json").then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch("media/slides/slides.json").then(function (r) { return r.json(); }).catch(function () { return {}; }),
    (RETRO || THEMED) ? fetch("media/retro/retro.json").then(function (r) { return r.json(); }).catch(function () { return null; }) : null
  ]).then(function (j) {
    RJ = j[3]; if (RETRO && !RJ) RETRO = false;
    if (THEMED && !(RJ && RJ.backdrops)) { THEMED = false; document.body.classList.add("plain"); }
    if (THEMED) { document.body.classList.add("themed"); buildBackdrop(); }
    [j[0], j[1]].forEach(function (m) { Object.keys(m).forEach(function (k) { META[k] = Object.assign(META[k] || {}, m[k]); }); });
    SL = j[2];
    layoutWorld();
  });
  function N(id) { return SL[id] ? SL[id].order.length : 0; }

  function video(src, poster) {
    var v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("disablepictureinpicture", "");
    v.preload = "auto"; if (poster) v.poster = poster;
    [].concat(src).forEach(function (s) {
      var so = document.createElement("source"); so.src = s; so.type = /\.webm$/.test(s) ? "video/webm" : "video/mp4"; v.appendChild(so);
    });
    return v;
  }
  function loopVideo(id, tile) {
    var base = "media/" + id + (tile ? "-tile" : "");
    var v = video([base + ".webm", base + ".mp4"], stillUrl(id)); v.loop = true; return v;
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
  function place(el, r) { el.style.left = r.x + "px"; el.style.top = r.y + "px"; el.style.width = r.w + "px"; el.style.height = r.h + "px"; }
  function over(at, to) {
    return "translate(" + (to.x - at.x) + "px," + (to.y - at.y) + "px) scale(" + (to.w / at.w) + "," + (to.h / at.h) + ")";
  }

  /* ---- the world: four tile videos -------------------------------------- */
  var cells = [];
  function buildWorld() {
    if (cells.length) return;
    WORLD.forEach(function (id, i) {
      var c = document.createElement("div"); c.className = "cell"; c.dataset.id = id;
      var f = document.createElement("div"); f.className = "frame";
      var v = loopVideo(id, true); v.className = "tilevid"; if (!REDUCED) v.autoplay = true;
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
  function markFocus() { cells.forEach(function (c, i) { c.el.classList.toggle("focus", i === S.focus); }); }
  function worldPlaying(on) { cells.forEach(function (c) { if (on) play(c.vid); else c.vid.pause(); }); }
  function cellOf(id) { return cells.filter(function (x) { return x.id === id; })[0]; }
  function tileRect(id) {
    var c = cellOf(id); if (!c) return null;
    var b = c.vid.getBoundingClientRect(), v = viewEl.getBoundingClientRect();
    return { x: b.left - v.left, y: b.top - v.top, w: b.width, h: b.height };
  }

  /* ---- geometry: the island page's 4:3 card, as the page draws it at this view ----
   * The page's <svg> is a 4:3 box centred in the view with a 2% margin (measured,
   * slides.json svgFrac); its viewBox is the island's 4:3 frame. The captured
   * pictures (1920x1080) are scaled so their card lands on that box. */
  function cardBox() {
    var Vw = viewEl.clientWidth, Vh = viewEl.clientHeight, m = 0.96;
    var w = Math.min(Vw * m, Vh * m * 4 / 3), h = w * 3 / 4;
    return { x: (Vw - w) / 2, y: (Vh - h) / 2, w: w, h: h };
  }
  function slideBox(id) {
    var sf = (SL[id] && SL[id].svgFrac) || [0.14, 0.02, 0.72, 0.96], C = cardBox();
    var k = C.h / (sf[3] * 1080), w = 1920 * k, h = 1080 * k;
    return { x: C.x + C.w / 2 - (sf[0] + sf[2] / 2) * w, y: C.y + C.h / 2 - (sf[1] + sf[3] / 2) * h, w: w, h: h };
  }
  /* a box in the drawing's units -> the view's pixels */
  function toView(id, b) {
    var f = (SL[id] && SL[id].frame), C = cardBox();
    if (!f) { var m = META[id] || {}, vb = m.vb || [0, 0, 1000, 1000], a = vb[2] / vb[3];
      f = a < 4 / 3 ? [vb[0] - (vb[3] * 4 / 3 - vb[2]) / 2, vb[1], vb[3] * 4 / 3, vb[3]] : [vb[0], vb[1] - (vb[2] * 3 / 4 - vb[3]) / 2, vb[2], vb[2] * 3 / 4]; }
    var s = C.w / f[2];
    return { x: C.x + (b[0] - f[0]) * s, y: C.y + (b[1] - f[1]) * s, w: b[2] * s, h: b[3] * s };
  }
  function islandRect(id) { var m = META[id] || {}; return toView(id, m.vb || [0, 0, 1000, 1000]); }
  /* the loop video's element box: the drawing's box widened by the video's own margin */
  function expand(id, r) {
    var c = (META[id] && META[id].content) || [0.02, 0.02, 0.96, 0.96];
    var w = r.w / c[2], h = r.h / c[3];
    return { x: r.x - c[0] * w, y: r.y - c[1] * h, w: w, h: h };
  }
  function loopBox(id) { return expand(id, islandRect(id)); }


  /* ---- the room behind the card (THE ROOMS, above) ----------------------------- */
  var bdEl = null, bdImg = null, bdId = null;
  /* 2.1 is inside the factory: its own picture when there is one (the factory with a
   * TRANSLATION sub-plate under its METHODS plate), the factory's otherwise */
  function roomOf(id) { return id === "2.1" && !(RJ && RJ.backdrops && RJ.backdrops["2.1"]) ? "2.2" : id; }
  function buildBackdrop() {
    if (bdEl) return;
    bdEl = document.createElement("div"); bdEl.id = "backdrop";
    bdImg = document.createElement("img"); bdImg.alt = ""; bdEl.appendChild(bdImg);
    viewEl.insertBefore(bdEl, viewEl.firstChild);
    WORLD.concat(["2.1"]).forEach(function (id) { var im = new Image(); im.src = "media/retro/backdrop-" + roomOf(id) + ".webp"; });
  }
  function setBackdrop(id) {
    if (!THEMED || !bdEl || !id) return;
    var r = roomOf(id);
    if (r !== bdId) {
      bdId = r;
      bdImg.src = "media/retro/backdrop-" + r + ".webp";
      bdEl.style.backgroundColor = (RJ.backdrops && RJ.backdrops[r]) || "";
    }
    layoutBackdrop();
  }
  function layoutBackdrop() {
    if (!THEMED || !bdEl) return;
    var C = cardBox(), cd = (RJ && RJ.card) || [268.8, 21.6, 1382.4, 1036.8], s = C.h / cd[3];
    place(bdImg, { x: C.x - cd[0] * s, y: C.y - cd[1] * s, w: 1920 * s, h: 1080 * s });
    var Vw = viewEl.clientWidth, Vh = viewEl.clientHeight;
    slideEl.style.clipPath = "inset(" + C.y + "px " + (Vw - C.x - C.w) + "px " + (Vh - C.y - C.h) + "px " + C.x + "px)";
  }

  /* ---- the island loop videos ------------------------------------------------ */
  var vids = {};
  function bigVideo(id) {
    if (vids[id]) return vids[id];
    var v = loopVideo(id, false); v.className = "bigvid";
    vidsEl.appendChild(v);
    vids[id] = v;
    return v;
  }
  /* the loops are clipped to the page's card, as the page clips its drawing */
  function clipVids() {
    var C = cardBox(), Vw = viewEl.clientWidth, Vh = viewEl.clientHeight;
    vidsEl.style.clipPath = "inset(" + C.y + "px " + (Vw - C.x - C.w) + "px " + (Vh - C.y - C.h) + "px " + C.x + "px)";
  }
  function showVideo(id) {
    clipVids();
    Object.keys(vids).forEach(function (k) { if (k !== id) { vids[k].classList.remove("on"); vids[k].pause(); } });
    if (id) { var v = bigVideo(id); place(v, loopBox(id)); v.classList.add("on"); play(v); }
  }
  function pruneVideos(keep) {
    Object.keys(vids).forEach(function (id) {
      if (keep.indexOf(id) >= 0) return;
      var v = vids[id]; delete vids[id];
      v.pause(); while (v.firstChild) v.removeChild(v.firstChild); v.removeAttribute("src"); v.load(); v.remove();
    });
  }

  /* ---- the resting pictures --------------------------------------------------- */
  var imgCache = {};
  function restUrl(id, k) { return slideMedia(id, "rest-" + k + ".webp"); }
  function preImg(id, k) {
    if (k < 0 || (SL[id] && k > N(id))) return null;
    var u = restUrl(id, k);
    if (!imgCache[u]) { var im = new Image(); im.src = u; imgCache[u] = im.decode ? im.decode().catch(function () {}) : Promise.resolve(); }
    return imgCache[u];
  }
  async function showRest(id, k) {
    await preImg(id, k);
    place(restImg, slideBox(id));
    restImg.src = restUrl(id, k);
    if (restImg.decode) await restImg.decode().catch(function () {});
    slideEl.classList.add("on");
    slideEl.style.background = THEMED ? "transparent" : ((SL[id] && SL[id].bg) || "");
    if (THEMED) { setBackdrop(id); layoutBackdrop(); }
  }
  function hideRest() { slideEl.classList.remove("on"); }

  /* ---- the move videos: preloaded, at most a handful ------------------------- */
  var moves = {};
  function moveVideo(id, name) {
    var u = slideMedia(id, name + ".mp4");
    if (moves[u]) { moves[u].t = Date.now(); return moves[u].v; }
    var v = video(u); v.className = "movevid";
    slideEl.appendChild(v);
    moves[u] = { v: v, t: Date.now() };
    var keys = Object.keys(moves);
    if (keys.length > 8) {
      keys.sort(function (a, b) { return moves[a].t - moves[b].t; }).slice(0, keys.length - 8).forEach(function (k) {
        var e = moves[k].v; if (!e.paused) return; delete moves[k];
        while (e.firstChild) e.removeChild(e.firstChild); e.load(); e.remove();
      });
    }
    return v;
  }
  function preload(id, names) { names.forEach(function (n) { if (n) moveVideo(id, n); }); }
  /* what the next key might play, loaded while this one rests */
  function preloadAround(id, k) {
    var n = N(id), L = [];
    if (k === 0) L.push("in-1");
    else { L.push(k < n ? "fw-" + k : null, k > 1 ? "bw-" + (k - 1) : null, "out-" + k); }
    preload(id, L);
    preImg(id, k + 1); preImg(id, k - 1); preImg(id, 0);
  }
  /* play one move: it starts on the picture now shown and ends on rest-<to> */
  async function playMove(id, name, to) {
    var target = preImg(id, to);
    if (REDUCED) { await showRest(id, to); return; }
    var v = moveVideo(id, name);
    place(v, slideBox(id));
    await ready(v, 6000);
    if (v.currentTime !== 0) await seekTo(v, 0);
    v.classList.add("on");
    var ended = new Promise(function (r) { v.addEventListener("ended", r, { once: true }); });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    slideEl.classList.add("on");
    await target;
    await ended;
    place(restImg, slideBox(id));
    restImg.src = restUrl(id, to);
    if (restImg.decode) await restImg.decode().catch(function () {});
    v.classList.remove("on");
    try { v.pause(); v.currentTime = 0; } catch (e) {}
  }

  /* ---- hotspots over the island view ------------------------------------------ */
  function unionOf(bs) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    bs.forEach(function (b) { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[0] + b[2]); y1 = Math.max(y1, b[1] + b[3]); });
    return [x0, y0, x1 - x0, y1 - y0];
  }
  function padded(b, p) { return [b[0] - p, b[1] - p, b[2] + 2 * p, b[3] + 2 * p]; }
  /* explicit boxes, in the drawing's units, read off rest-0 with the page's boxes drawn on it */
  var NAMED = {
    /* 2.2 fine-tuning: the tasks around, and the models with their attached modules inside */
    finetuning: function () { return [[271, 716, 403, 457], [376, 793, 196, 302]]; },
    /* 2.2 the pre-trained model, whole: its body, screen and badge */
    pretrained: function () { return [[381, 852, 184, 150]]; },
    /* 1.1 the experiment: the whole landmark */
    experiment: function () { return EXPERIMENT; }
  };
  var EXPERIMENT = [[97, 732, 241, 247]];      /* "Translate the data", the balance and all round it */
  function spotsFor(id) {
    var info = SL[id]; if (!info) return [];
    var order = info.order, ov = HOTS[id] || {}, by = {};
    info.hits.forEach(function (h) { (by[h.rid] = by[h.rid] || []).push(h.box); });
    var out = [];
    Object.keys(by).forEach(function (rid) {
      var k = order.indexOf(rid) + 1;
      if (!k) return;
      var o = ov[rid];
      if (!o) by[rid].forEach(function (b) { out.push({ k: k, box: b }); });
      else if (o.boxes) (NAMED[o.boxes] ? NAMED[o.boxes](info) : [unionOf(by[rid])]).forEach(function (b) { out.push({ k: k, box: b }); });
      else if (o.union) out.push({ k: k, box: padded(unionOf(by[rid]), o.pad || 0) });
    });
    if (ISL[id].sub && info.door) out.push({ k: "sub", box: info.door });
    out.sort(function (p, q) { return q.box[2] * q.box[3] - p.box[2] * p.box[3]; });   /* the smallest on top */
    return out;
  }
  function buildHots(id) {
    hotsEl.innerHTML = "";
    if (S.layer !== "island" || S.island !== id) return;
    spotsFor(id).forEach(function (s) {
      var r = toView(id, s.box), h = document.createElement("div"); h.className = "hot";
      var pad = Math.max(0, (40 - Math.min(r.w, r.h)) / 2);
      place(h, { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad });
      h.title = s.k === "sub" ? SUBNAME[ISL[id].sub] : SL[id].names[s.k - 1];
      h.addEventListener("pointerenter", function () { if (s.k !== "sub") preload(id, ["in-" + s.k]); });
      h.addEventListener("click", function () {
        if (S.busy || S.layer !== "island") return;
        if (s.k === "sub") zoomIn(); else enterSlide(s.k);
      });
      hotsEl.appendChild(h);
    });
  }

  /* ---- the flights: transform and opacity only ------------------------------- */
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
  function flyVideo(id, from, r) {
    var v = loopVideo(id, true); v.className = "flyvid"; place(v, r);
    fly.appendChild(v);
    v.addEventListener("loadedmetadata", function () { try { v.currentTime = from ? (from.currentTime % (v.duration || 1e9)) : 0; } catch (e) {} }, { once: true });
    play(v);
    return v;
  }

  /* ---- the island view: the page's resting picture, the loop over it ------- */
  async function islandView(id, t) {
    S.island = id; S.layer = "island"; S.k = 0; setBackdrop(id);
    await showRest(id, 0);
    var v = bigVideo(id);
    await ready(v, 3000);
    if (t != null) await seekTo(v, t);
    showVideo(id);
    hotsEl.innerHTML = "";
    buildHots(id);
    preloadAround(id, 0);
    keep(id);
  }
  function keep(id) { pruneVideos(ISL[id].sub ? [id, ISL[id].sub] : [id]); }

  /* world -> island */
  async function openIsland(id) {
    if (RETRO) return retroOpen(id);
    S.busy = true;
    await metaReady;
    buildWorld();
    var c = cellOf(id), tile = tileRect(id), R = loopBox(id);
    var fv = flyVideo(id, c && c.vid, R);
    fly.className = "on clear";
    await ready(fv, 1500);
    document.body.classList.add("in");
    preImg(id, 0);
    await animate([{ el: fv, from: { transform: tile ? over(R, tile) : "none" }, to: { transform: "none" } }], 560);
    worldPlaying(false);
    await islandView(id, fv.currentTime);
    await nextFrame();
    fly.innerHTML = ""; fly.className = "";
    S.busy = false; update();
  }
  /* island -> world */
  async function goWorld(focusId) {
    if (RETRO) return retroClose(focusId);
    S.busy = true;
    buildWorld();
    var i = WORLD.indexOf(focusId); if (i >= 0) S.focus = i;
    markFocus();
    var from = S.island, big = from && vids[from];
    hotsEl.innerHTML = "";
    S.layer = "world";
    if (from && big && big.classList.contains("on")) {
      var R = loopBox(from), tile = tileRect(from);
      var fv = flyVideo(from, big, R); fly.className = "on";
      await ready(fv, 800);
      await nextFrame();
      fly.className = "on clear";
      showVideo(null); hideRest();
      var c = cellOf(from); if (c) { try { c.vid.currentTime = (big.currentTime || 0) % (c.vid.duration || 1e9); } catch (e) {} }
      document.body.classList.remove("in");
      worldPlaying(true);
      await animate([{ el: fv, from: { transform: "none" }, to: { transform: tile ? over(R, tile) : "none" } }], 520);
      fly.innerHTML = ""; fly.className = "";
    } else {
      showVideo(null); hideRest();
      document.body.classList.remove("in");
      worldPlaying(true);
      await sleep(300);
    }
    S.island = null;
    S.busy = false; update();
  }

  /* island view -> slide k (its entry video) */
  async function enterSlide(k, idOverride) {
    var id = idOverride || S.island;
    S.busy = true;
    hotsEl.innerHTML = "";
    var v = vids[id];
    /* the entry starts on the island at rest: the loop goes back to its still first */
    if (v && v.classList.contains("on")) { v.pause(); await seekTo(v, 0); }
    var p = playMove(id, "in-" + k, k);
    await sleep(60);
    showVideo(null);
    await p;
    S.layer = idOverride ? "subslide" : "slide";
    if (idOverride) S.sk = k; else S.k = k;
    preloadAround(id, k);
    S.busy = false; update();
  }
  /* slide k -> the island view (its leave video), the loop taking over at its still */
  async function leaveSlide(id, k, then) {
    S.busy = true;
    await playMove(id, "out-" + k, 0);
    var v = bigVideo(id);
    await ready(v, 3000); await seekTo(v, 0);
    showVideo(id);
    S.busy = false;
    return then();
  }
  async function stepSlide(id, from, to, sub) {
    S.busy = true;
    await playMove(id, to > from ? "fw-" + from : "bw-" + to, to);
    if (sub) S.sk = to; else S.k = to;
    preloadAround(id, to);
    S.busy = false; update();
  }

  /* ---- the translator: 2.2's loop grows about the translator's box while 2.1's grows out of it */
  function doorBox() {
    var d = SL[S.island] && SL[S.island].door;
    if (d) return toView(S.island, d);
    var R = islandRect(S.island);
    return { x: R.x + R.w * 0.22, y: R.y + R.h * 0.07, w: R.w * 0.17, h: R.h * 0.22 };
  }
  async function zoomTranslator(into) {
    var parent = S.island, sub = ISL[parent].sub;
    var A = bigVideo(parent), C = bigVideo(sub);
    var R2 = islandRect(parent), R1 = islandRect(sub), b = doorBox();
    var eA = function (r) { return expand(parent, r); }, eC = function (r) { return expand(sub, r); };
    place(A, eA(R2)); place(C, eC(R1));
    var s = Math.max(b.w / R1.w, b.h / R1.h);
    var door = { x: b.x + b.w / 2 - R1.w * s / 2, y: b.y + b.h / 2 - R1.h * s / 2, w: R1.w * s, h: R1.h * s };
    var k = R1.w / door.w, cx = b.x + b.w / 2, cy = b.y + b.h / 2, tx = R1.x + R1.w / 2, ty = R1.y + R1.h / 2;
    var big = { x: tx + (R2.x - cx) * k, y: ty + (R2.y - cy) * k, w: R2.w * k, h: R2.h * k };
    await Promise.all([ready(A, 3000), ready(C, 3000)]);
    if (into) await seekTo(C, 0);
    hideRest();
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
    await showRest(into ? sub : parent, 0);
    showVideo(into ? sub : parent);
    clean(A); clean(C);
  }
  async function zoomIn() {
    S.busy = true;
    hotsEl.innerHTML = "";
    await zoomTranslator(true);
    S.layer = "sub"; S.sk = 0;
    preloadAround(ISL[S.island].sub, 0);
    S.busy = false; update();
  }
  async function zoomOut(then) {
    S.busy = true;
    await zoomTranslator(false);
    S.layer = "island"; S.k = 0;
    S.busy = false; update();
    if (then === "first") return enterSlide(1);
    buildHots(S.island);
    markDoor();
  }
  function markDoor() {
    var b = doorBox(), pad = 8;
    place(mark, { x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad });
    mark.classList.add("on");
    clearTimeout(markDoor.t);
    markDoor.t = setTimeout(function () { mark.classList.remove("on"); }, 1400);
  }

  /* ---- between islands: a short fade through paper ------------------------ */
  async function crossTo(id, where) {
    S.busy = true;
    veil.classList.add("on"); await sleep(300);
    hotsEl.innerHTML = "";
    showVideo(null);
    S.island = id; setBackdrop(id);
    if (where === "last") {
      await showRest(id, N(id)); S.layer = "slide"; S.k = N(id);
      keep(id); preloadAround(id, S.k);
      veil.classList.remove("on"); await sleep(300);
      S.busy = false; update(); return;
    }
    /* "first" and "translation" both arrive on the island view at rest, then move on */
    await showRest(id, 0);
    var v = bigVideo(id); await ready(v, 3000); await seekTo(v, 0); v.pause();
    place(v, loopBox(id)); v.classList.add("on");
    S.layer = "island"; S.k = 0; keep(id);
    preload(id, ["in-1"]);
    veil.classList.remove("on"); await sleep(320);
    S.busy = false;
    if (where === "translation") return zoomIn();
    return enterSlide(1);
  }


  /* ---- the retro world: the overworld map as videos (make_retro.py) --------------
   * #retro covers the view with paper; its videos are placed so that the island's card
   * in their frames lands exactly on cardBox(), the box the island view uses, so an
   * opening's last frame IS the island view under it. Videos are swapped only once the
   * new one has presented its first frame, the newest on top. */
  var retroEl = null, rcur = null, rz = 1, rpool = {}, rposter = null, rlat = { key: 0, moved: 0 };
  function rurl(name) { return "media/retro/" + name + ".mp4"; }
  function retroBox() {
    var C = cardBox(), cd = (RJ && RJ.card) || [268.8, 21.6, 1382.4, 1036.8], s = C.h / cd[3];
    return { x: C.x - cd[0] * s, y: C.y - cd[1] * s, w: 1920 * s, h: 1080 * s };
  }
  function rvid(name) {
    if (rpool[name]) return rpool[name];
    var v = video(rurl(name)); v.className = "rvid";
    if (/^idle-/.test(name)) v.loop = true;
    retroEl.appendChild(v); place(v, retroBox());
    rpool[name] = v;
    return v;
  }
  function firstFrame(v) {
    return new Promise(function (res) {
      var done = false, fin = function () { if (!done) { done = true; res(); } };
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(function () { fin(); });
      else v.addEventListener("playing", function () { requestAnimationFrame(fin); }, { once: true });
      setTimeout(fin, 800);
    });
  }
  /* play v from its start and show it over what is shown, once its first frame is up */
  async function rswap(v, rate) {
    await ready(v, 6000);
    if (v.currentTime > 0.001) await seekTo(v, 0);
    v.playbackRate = rate || 1;
    v.style.zIndex = ++rz;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    await firstFrame(v);
    v.classList.add("on");
    if (!rlat.moved) rlat.moved = performance.now();
    var old = rcur; rcur = v;
    if (old && old !== v) { old.classList.remove("on"); try { old.pause(); } catch (e) {} }
  }
  function rended(v) {
    return new Promise(function (res) {
      if (v.ended) return res();
      v.addEventListener("ended", res, { once: true });
      setTimeout(res, ((v.duration || 4) / (v.playbackRate || 1)) * 1000 + 1500);
    });
  }
  function rposterShow(id) { rposter.src = "media/retro/idle-" + id + ".webp"; rposter.style.zIndex = ++rz; }
  function buildRetro() {
    if (retroEl) return;
    retroEl = document.createElement("div"); retroEl.id = "retro";
    viewEl.insertBefore(retroEl, veil);
    rposter = document.createElement("img"); rposter.className = "rposter"; rposter.alt = ""; retroEl.appendChild(rposter);
    retroEl.addEventListener("click", function (e) { if (S.layer === "title" && !S.busy && !e.target.classList.contains("bld")) skyDown("title"); });
    WORLD.forEach(function (id, i) {
      var b = document.createElement("div"); b.className = "bld"; b.dataset.id = id;
      b.title = ISL[id].sec + " · " + ISL[id].name;
      b.addEventListener("click", function () { if (S.layer !== "world" || S.busy) return; retroGo(i, true); });
      retroEl.appendChild(b);
    });
    layoutRetro();
  }
  function layoutRetro() {
    if (!retroEl) return;
    var R = retroBox(), k = R.w / ((RJ && RJ.map && RJ.map[0]) || 480);
    [].forEach.call(retroEl.querySelectorAll(".rvid"), function (v) { place(v, R); });
    place(rposter, R);
    [].forEach.call(retroEl.querySelectorAll(".bld"), function (b) {
      var bx = RJ.buildings[b.dataset.id].box, p = 3;
      place(b, { x: R.x + (bx[0] - p) * k, y: R.y + (bx[1] - p) * k, w: (bx[2] - bx[0] + 2 * p) * k, h: (bx[3] - bx[1] + 2 * p) * k });
    });
  }
  function retroShown(on) { retroEl.classList.toggle("on", on); }
  /* what shows beyond the videos' 16:9 picture when the view is wider: grass on the map, the
   * room's own colour as the camera arrives in a building, so the edges never jump */
  var GRASS = "#4caf46";
  function retroEdge(c, ms, delay) {
    retroEl.style.transition = ms ? "background-color " + ms + "ms linear " + (delay || 0) + "ms" : "none";
    retroEl.style.backgroundColor = c;
  }
  function roomColour(id) { return (THEMED && RJ && RJ.backdrops && RJ.backdrops[roomOf(id)]) || ""; }
  /* what the next key might play, loaded while Bert idles at building i */
  function retroPreload(i) {
    var id = WORLD[i], L = ["idle-" + id, "open-" + id];
    if (i + 1 < WORLD.length) L.push("walk-" + id + "-" + WORLD[i + 1], "idle-" + WORLD[i + 1]);
    if (i > 0) L.push("walk-" + id + "-" + WORLD[i - 1], "idle-" + WORLD[i - 1]);
    else L.push("title-up");
    if (i === WORLD.length - 1) L.push("thanks-up");
    L.forEach(function (n) { rvid(n); });
  }
  /* Bert idling at building i, shown at once (arrival, or the end of a cut) */
  async function retroIdle(i) {
    buildRetro(); retroShown(true); retroEdge(GRASS, 0);
    var id = WORLD[i];
    rposterShow(id);
    if (!REDUCED) { await rswap(rvid("idle-" + id)); rposter.removeAttribute("src"); }
    retroPreload(i);
  }
  /* walk Bert from his building to building j, one road at a time, then maybe open it */
  async function retroGo(j, openAfter) {
    if (j === S.focus) { if (openAfter) return openIsland(WORLD[j]); return; }
    S.busy = true;
    var step = j > S.focus ? 1 : -1, far = Math.abs(j - S.focus) > 1;
    while (S.focus !== j) {
      var a = WORLD[S.focus], b = WORLD[S.focus + step];
      if (REDUCED) rposterShow(b);
      else {
        var w = rvid("walk-" + a + "-" + b);
        await rswap(w, far ? 2 : 1);
        rvid("idle-" + b);
        await rended(w);
        await rswap(rvid("idle-" + b));
      }
      S.focus += step; markFocus(); update();
    }
    retroPreload(S.focus);
    S.busy = false; update();
    if (openAfter) return openIsland(WORLD[j]);
  }
  /* the island view, made ready UNDER the retro layer: its picture, its loop held at frame 0 */
  async function prepIsland(id) {
    S.island = id; setBackdrop(id);
    await showRest(id, 0);
    var v = bigVideo(id);
    await ready(v, 3000);
    v.pause(); await seekTo(v, 0);
    clipVids();
    Object.keys(vids).forEach(function (k) { if (k !== id) { vids[k].classList.remove("on"); vids[k].pause(); } });
    place(v, loopBox(id)); v.classList.add("on");
    return v;
  }
  async function retroOpen(id) {
    S.busy = true;
    await metaReady;
    buildRetro(); retroShown(true);
    var loop = prepIsland(id);
    if (!REDUCED) {
      var v = rvid("open-" + id);
      await rswap(v);
      if (roomColour(id)) retroEdge(roomColour(id), 1300, 900);
      rvid("close-" + id);
      await rended(v);
    }
    var bv = await loop;
    document.body.classList.add("in");
    S.layer = "island"; S.k = 0;
    retroShown(false);
    if (!THEMED && !REDUCED) await sleep(320);   /* ?plain=1: the videos land on the room; #retro fades instead */
    play(bv);
    hotsEl.innerHTML = ""; buildHots(id); preloadAround(id, 0); keep(id);
    S.busy = false; update();
  }
  async function retroClose(id) {
    S.busy = true;
    hotsEl.innerHTML = "";
    var i = WORLD.indexOf(id); if (i >= 0) S.focus = i;
    var big = vids[id];
    if (big) { big.pause(); await seekTo(big, 0); }          /* the island at rest: the closing's first frame */
    buildRetro();
    if (!REDUCED) {
      var v = rvid("close-" + id);
      rvid("idle-" + id);
      if (roomColour(id)) retroEdge(roomColour(id), 0);
      await ready(v, 6000);
      if (v.currentTime > 0.001) await seekTo(v, 0);
      v.style.zIndex = ++rz;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      await firstFrame(v);
      v.classList.add("on");
      var old = rcur; rcur = v; if (old && old !== v) { old.classList.remove("on"); old.pause(); }
      await nextFrame();
      retroEl.classList.add("clear");            /* until the map is back, the island shows through, never paper */
      retroShown(true);
      retroEdge(GRASS, 1300, 200);
      if (!rlat.moved) rlat.moved = performance.now();
      await rended(v);
      await rswap(rvid("idle-" + id));
      await nextFrame();
      retroEl.classList.remove("clear");
    } else { rposterShow(id); retroShown(true); }
    showVideo(null); hideRest();
    document.body.classList.remove("in");
    S.layer = "world"; S.island = null;
    retroPreload(S.focus);
    S.busy = false; update();
  }

  /* ---- the skies above the map (title_scene.py): the opening title and the closing thanks ----
   * In the retro world a sky is #retro's poster; <sky>-down.mp4 tilts the camera down onto the
   * idle loop of its building (title: 1.1, thanks: 4.1) and <sky>-up.mp4 back up onto the
   * poster. With ?world=old a sky is a still (#titlecard) over the four tiles, the moves cuts. */
  var SKIES = { title: { at: 0 }, thanks: { at: 3 } }, titleCard = null;
  function skyUrl(n) { return "media/retro/" + n + ".webp"; }
  function skyColour() { return (RJ && RJ.sky && RJ.sky.sky) || "#3f86d8"; }
  function skyImg(n) { var im = new Image(); im.src = skyUrl(n); return im.decode ? im.decode().catch(function () {}) : Promise.resolve(); }
  function oldSky(n) {
    if (!titleCard) {
      titleCard = document.createElement("div"); titleCard.id = "titlecard";
      var im = document.createElement("img"); im.alt = ""; titleCard.appendChild(im);
      titleCard.addEventListener("click", function () { if (S.layer === "title" && !S.busy) skyDown("title"); });
      viewEl.insertBefore(titleCard, veil);
      layoutTitle();
    }
    if (n) titleCard.firstChild.src = skyUrl(n);
    titleCard.style.backgroundColor = skyColour();
    titleCard.classList.toggle("on", !!n);
  }
  function layoutTitle() { if (titleCard) place(titleCard.firstChild, retroBox()); }
  function skyPoster(n) {
    rposter.src = skyUrl(n); rposter.style.zIndex = ++rz;
  }
  async function showSky(n) {
    S.layer = n; S.focus = SKIES[n].at; S.island = null;
    if (!RETRO) { oldSky(n); return; }
    buildRetro(); retroShown(true); retroEdge(skyColour(), 0);
    retroEl.classList.add("title");
    await skyImg(n);
    skyPoster(n);
    if (rcur) { rcur.classList.remove("on"); try { rcur.pause(); } catch (e) {} rcur = null; }
    if (!REDUCED) { rvid(n + "-down"); rvid("idle-" + WORLD[SKIES[n].at]); }
  }
  /* the sky -> the map, Bert at its building */
  async function skyDown(n) {
    S.busy = true;
    var i = SKIES[n].at, id = WORLD[i];
    if (!RETRO) {
      buildWorld(); S.focus = i; markFocus(); oldSky(null);
      S.layer = "world"; S.busy = false; update(); return;
    }
    if (REDUCED) { rposterShow(id); }
    else {
      var v = rvid(n + "-down");
      await rswap(v);
      rposter.removeAttribute("src");
      retroEdge(GRASS, 2200, 400);
      rvid("idle-" + id);
      await rended(v);
      await rswap(rvid("idle-" + id));
    }
    retroEl.classList.remove("title");
    S.layer = "world"; S.focus = i; markFocus();
    retroPreload(i);
    S.busy = false; update();
  }
  /* the map, Bert at the sky's building -> the sky */
  async function skyUp(n) {
    S.busy = true;
    if (!RETRO) { oldSky(n); S.layer = n; S.busy = false; update(); return; }
    retroEl.classList.add("title");
    var poster = skyImg(n);
    if (!REDUCED) {
      var v = rvid(n + "-up");
      await rswap(v);
      retroEdge(skyColour(), 2200, 0);
      await rended(v);
    }
    await poster;
    skyPoster(n);
    await nextFrame();
    if (rcur) { rcur.classList.remove("on"); try { rcur.pause(); } catch (e) {} rcur = null; }
    retroEdge(skyColour(), 0);
    S.layer = n;
    if (!REDUCED) rvid(n + "-down");
    S.busy = false; update();
  }
  /* 4.1's last slide -> its island view -> the station closes -> up into the thanks */
  async function toThanks() {
    var id = S.island, k = S.k;
    await leaveSlide(id, k, function () { S.layer = "island"; S.k = 0; update(); });
    await goWorld(id);
    return skyUp("thanks");
  }
  /* and back: down to the station, it opens, into 4.1's last slide */
  async function fromThanks() {
    var id = WORLD[SKIES.thanks.at];
    await skyDown("thanks");
    await openIsland(id);
    return enterSlide(N(id));
  }

  /* ---- the keys ----------------------------------------------------------- */
  var NAV = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Enter: 1, Escape: 1 };
  function onKey(k) {
    if (S.busy) return;
    rlat.key = performance.now(); rlat.moved = 0;
    var fwd = k === "ArrowRight", back = k === "ArrowLeft", down = k === "ArrowDown" || k === "Enter", up = k === "ArrowUp" || k === "Escape";
    var id = S.island, n = N(id);
    if (S.layer === "title") return (fwd || down) ? skyDown("title") : bump();
    if (S.layer === "thanks") return (back || down) ? fromThanks() : bump();
    if (S.layer === "world" && S.focus === 0 && (back || (up && RETRO))) return skyUp("title");
    if (S.layer === "world" && S.focus === WORLD.length - 1 && (fwd || (up && RETRO))) return skyUp("thanks");
    if (S.layer === "world" && RETRO) {
      if (fwd || back) {
        var jj = S.focus + (fwd ? 1 : -1);
        if (jj < 0 || jj >= WORLD.length) return bump();
        return retroGo(jj, false);
      }
      if (down) return openIsland(WORLD[S.focus]);
      return bump();
    }
    if (S.layer === "world") {
      if (fwd || back) {
        var j = S.focus + (fwd ? 1 : -1);
        if (j < 0 || j >= WORLD.length) return bump();
        S.focus = j; markFocus(); update();
      } else if (down) openIsland(WORLD[S.focus]);
      else bump();
      return;
    }
    if (S.layer === "island") {
      if (down || fwd) return ISL[id].sub ? zoomIn() : enterSlide(1);
      if (up) return goWorld(id);
      if (back) { var p0 = prevW(id); return p0 ? crossTo(p0, "last") : bump(); }
      return;
    }
    if (S.layer === "sub") {                       /* 2.1's living view, 2.2's step 1 */
      var sub = ISL[id].sub;
      if (fwd) return zoomOut("first");
      if (up) return zoomOut(null);
      if (down) return enterSlide(1, sub);
      if (back) { var pb = prevW(id); return pb ? crossTo(pb, "last") : zoomOut(null); }
      return;
    }
    if (S.layer === "subslide") {                  /* 2.1's slides, one level deeper */
      var sb = ISL[id].sub, m = N(sb);
      if (up) return leaveSlide(sb, S.sk, function () { S.layer = "sub"; S.sk = 0; preloadAround(sb, 0); update(); });
      if (fwd) return S.sk < m ? stepSlide(sb, S.sk, S.sk + 1, true) : bump();
      if (back) return S.sk > 1 ? stepSlide(sb, S.sk, S.sk - 1, true) : bump();
      return bump();
    }
    /* a slide */
    if (up) return leaveSlide(id, S.k, function () { S.layer = "island"; S.k = 0; buildHots(id); preloadAround(id, 0); update(); });
    if (down) return bump();
    if (fwd) {
      if (S.k < n) return stepSlide(id, S.k, S.k + 1);
      var nx = nextW(id);
      if (!nx && id === WORLD[WORLD.length - 1]) return toThanks();
      return nx ? crossTo(nx, ISL[nx].sub ? "translation" : "first") : bump();
    }
    if (back) {
      if (S.k > 1) return stepSlide(id, S.k, S.k - 1);
      if (ISL[id].sub) return leaveSlide(id, 1, function () { S.layer = "island"; S.k = 0; return zoomIn(); });
      var pv = prevW(id); return pv ? crossTo(pv, "last") : bump();
    }
  }
  function nextW(id) { var i = WORLD.indexOf(id); return i >= 0 && i + 1 < WORLD.length ? WORLD[i + 1] : null; }
  function prevW(id) { var i = WORLD.indexOf(id); return i > 0 ? WORLD[i - 1] : null; }
  window.addEventListener("keydown", function (e) {
    if (!NAV[e.key] || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    onKey(e.key);
  });
  window.addEventListener("resize", function () {
    layoutWorld(); layoutRetro(); layoutTitle(); layoutBackdrop(); clipVids();
    if (S.island) {
      Object.keys(vids).forEach(function (id) { place(vids[id], loopBox(id)); });
      var cur = S.layer === "sub" || S.layer === "subslide" ? ISL[S.island].sub : S.island;
      place(restImg, slideBox(cur));
      if (S.layer === "island") buildHots(S.island);
    }
  });

  /* ---- where am I --------------------------------------------------------- */
  var lastHash = null;
  function update() {
    var path, id = S.island;
    if (S.layer === "title") {
      crumb.textContent = "The talk · title · → into the city";
      pos.textContent = "title"; path = "#/";
    } else if (S.layer === "thanks") {
      crumb.textContent = "The talk · thank you · ← back to the last slide";
      pos.textContent = "thanks"; path = "#/thanks";
    } else if (S.layer === "world" || !id) {
      var I0 = ISL[WORLD[S.focus]];
      crumb.textContent = "The talk · " + I0.sec + " › " + I0.name;
      pos.textContent = "island " + (S.focus + 1) + " / " + WORLD.length;
      path = S.focus ? "#/@" + WORLD[S.focus] : "#/world";
    } else {
      var I = ISL[id], subN = I.sub ? 1 : 0, all = N(id) + subN, trail = I.sec + " › " + I.name;
      if (S.layer === "island") { crumb.textContent = trail; pos.textContent = "island view"; path = "#/" + id; }
      else if (S.layer === "sub") {
        crumb.textContent = trail + " › " + SUBNAME[I.sub] + " › step 1 / " + all + " · ↓ for its slides";
        pos.textContent = id + " · 1 / " + all; path = "#/" + id + "/translation";
      } else if (S.layer === "subslide") {
        var sb = I.sub;
        crumb.textContent = trail + " › " + SUBNAME[sb] + " › slide " + S.sk + " / " + N(sb) + " · " + SL[sb].names[S.sk - 1];
        pos.textContent = id + " · 1 / " + all + " · " + sb + " " + S.sk + " / " + N(sb); path = "#/" + id + "/translation/" + S.sk;
      } else {
        var at = subN + S.k;
        crumb.textContent = trail + (subN ? " › step " + at + " / " + all : " › slide " + S.k + " / " + N(id)) + " · " + SL[id].names[S.k - 1];
        pos.textContent = id + " · " + at + " / " + all; path = "#/" + id + "/" + S.k;
      }
    }
    if (RETRO && S.layer === "world" && retroEl) [].forEach.call(retroEl.querySelectorAll(".bld"), function (b, i) { b.classList.toggle("focus", i === S.focus); });
    if (path !== lastHash) { lastHash = path; try { history.replaceState(null, "", path); } catch (e) {} }
  }

  /* ---- arrival ------------------------------------------------------------ */
  function parseHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) return { layer: "title", id: WORLD[0] };
    if (h === "world") return { layer: "world", id: WORLD[0] };
    if (h === "thanks") return { layer: "thanks", id: WORLD[WORLD.length - 1] };
    if (h[0] === "@") return { layer: "world", id: h.slice(1) };
    var p = h.split("/");
    if (p[0] === "2.1") p = ["2.2", "translation"].concat(p.slice(1));
    if (!ISL[p[0]]) return { layer: "world", id: WORLD[0] };
    if (p[1] === "translation" && ISL[p[0]].sub) return /^\d+$/.test(p[2] || "") ? { layer: "subslide", id: p[0], k: +p[2] } : { layer: "sub", id: p[0] };
    if (p.length > 1 && /^\d+$/.test(p[1])) return { layer: "slide", id: p[0], k: +p[1] };
    return { layer: "island", id: p[0] };
  }
  async function arrive() {
    await metaReady;
    var at = parseHash();
    var wi = WORLD.indexOf(at.id); if (wi >= 0) S.focus = wi;
    if (SKIES[at.layer]) { await showSky(at.layer); update(); return; }
    if (at.layer === "world") {
      if (RETRO) { await retroIdle(S.focus); update(); return; }
      buildWorld(); markFocus(); update(); return;
    }
    if (RETRO) buildRetro();
    document.body.classList.add("in");
    S.island = at.id; setBackdrop(at.id);
    if (at.layer === "island") { await islandView(at.id, 0); update(); return; }
    if (at.layer === "slide") {
      S.k = Math.max(1, Math.min(N(at.id), at.k)); S.layer = "slide";
      await showRest(at.id, S.k); keep(at.id); preloadAround(at.id, S.k); update(); return;
    }
    var sub = ISL[at.id].sub;
    keep(at.id);
    if (at.layer === "sub") { await showRest(sub, 0); showVideo(sub); S.layer = "sub"; preloadAround(sub, 0); update(); return; }
    S.sk = Math.max(1, Math.min(N(sub), at.k)); S.layer = "subslide";
    await showRest(sub, S.sk); preloadAround(sub, S.sk); update();
  }
  arrive();

  window.Talk = {
    get state() {
      return { busy: S.busy, layer: S.layer, id: S.island, k: S.k, sk: S.sk, hash: location.hash, flying: false,
        crumb: crumb.textContent + " | " + pos.textContent, hots: hotsEl.children.length,
        moves: Object.keys(moves).length, videos: Object.keys(vids), retro: RETRO,
        latency: rlat.moved ? rlat.moved - rlat.key : null };
    },
    key: onKey,
    spots: function (id) { return spotsFor(id).map(function (s) { return { k: s.k, box: s.box, view: toView(id, s.box) }; }); }
  };
  window.TalkNamed = NAMED;
})();
