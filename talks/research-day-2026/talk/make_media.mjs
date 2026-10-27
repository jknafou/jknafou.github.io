#!/usr/bin/env node
/* The shell's videos: each island's LIVING VIEW, rendered deterministically by
 * seeking its own timeline (FixedLive.sync(t)) frame by frame, and encoded.
 *
 *   node world/talk/make_media.mjs --ffmpeg <path to ffmpeg> [--tmp <dir>] [--only 2.2,3.1] [--workers 8]
 *   node world/talk/make_media.mjs --slides --ffmpeg <path> [--only 3.1] [--workers 10] [--crf 26]
 *        (every slide move as video, every rest as a still: see "--slides" below)
 *   node world/talk/make_media.mjs --rest --ffmpeg <path> [--only 2.2] [--workers 8] [--crf 27]
 *        (each slide's resting loop, after --slides: see "--rest" below)
 *
 * writes world/talk/media/<id>.mp4 + .webm (the island view: the island at up to
 * 1920x1080, framed exactly as its living view's viewBox, like stills/), and
 * <id>-tile.mp4 + .webm (the world's tile, long side 560 px), and media.json.
 *
 * Why (the author, 26 October 2026): "Couln't the world be a simple gif and it
 * would load the rendering when clicking on it? Something lighter until a
 * click ... Load only when necessary". A video is decoded off the main thread;
 * a living SVG page is not. The heavy pages load only when a slide is near.
 *
 * ⚠️ THE LOOP ENDS WHERE IT STARTS: frame 0 is sync(0), the signed still, and the
 * video holds one period [0, L). The seam (sync(L) against sync(0)) is measured
 * and printed as PSNR; the shell hands off to the resting page at frame 0.
 *
 * ffmpeg is not installed on the VM: a venv with `pip install imageio-ffmpeg`
 * ships a static one (python -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())").
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DECK = resolve(HERE, "..", "..");
const OUT = join(HERE, "media");
const ISLANDS = {
  "1.1": "sections/1-motivation/1.1-use-case",
  "2.1": "sections/2-methodology/2.1-translation-workflow",
  "2.2": "sections/2-methodology/2.2-pretraining",
  "3.1": "sections/3-results/3.1-results",
  "4.1": "sections/4-conclusion/4.1-what-is-possible",
};
const TILES = ["1.1", "2.2", "3.1", "4.1"];          /* 2.1 is never on the world */
const FPS = 30, BOX = [1920, 1080], TILE_LONG = 560;
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const FFMPEG = arg("ffmpeg", process.env.FFMPEG);
const TMP = arg("tmp", null) || mkdtempSync(join(tmpdir(), "media-"));
const ONLY = arg("only", null);
const WORKERS = +arg("workers", 8);
if (!FFMPEG || !existsSync(FFMPEG)) { console.error("--ffmpeg <path> is needed (see the header)"); process.exit(1); }
const CHROME = process.env.DECK_CHROME || ["/opt/google/chrome/chrome", "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const even = (x) => 2 * Math.round(x / 2);

async function browser() {
  const prof = mkdtempSync(join(tmpdir(), "media-chrome-"));
  const kid = spawn(CHROME, ["--headless=new", "--no-first-run", "--hide-scrollbars", "--remote-debugging-port=0",
    `--user-data-dir=${prof}`, "--allow-file-access-from-files", "about:blank"], { stdio: "ignore", detached: true });
  let port = null;
  for (let i = 0; i < 300 && !port; i++) {
    await sleep(100);
    const f = join(prof, "DevToolsActivePort");
    if (existsSync(f)) port = readFileSync(f, "utf8").split("\n")[0].trim() || null;
  }
  let t = null;
  for (let i = 0; i < 100 && !t; i++) {
    await sleep(100);
    try { t = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((x) => x.type === "page"); } catch {}
  }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let n = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++n; pend.set(i, (m) => (m.error ? rej(new Error(method + ": " + m.error.message)) : res(m.result)));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result.value;
  const close = () => { try { ws.close(); } catch {} try { process.kill(-kid.pid, "SIGKILL"); } catch {} rmSync(prof, { recursive: true, force: true }); };
  return { send, evaluate, close };
}

async function openIsland(id, size) {
  const b = await browser();
  if (size) await b.send("Emulation.setDeviceMetricsOverride", { width: size[0], height: size[1], deviceScaleFactor: 1, mobile: false });
  await b.send("Page.navigate", { url: pathToFileURL(join(DECK, ISLANDS[id], "fixed.live.html")).href + "?autostart=0" });
  for (let i = 0; i < 1200; i++) {
    await sleep(100);
    if (await b.evaluate("!!(window.FixedLive && FixedLive.L)").catch(() => false)) break;
  }
  return b;
}

async function render(id) {
  /* the drawing's frame and period, from the page itself */
  const p = await openIsland(id, [1000, 1000]);
  const info = await p.evaluate(`(function(){ var v = document.querySelector("body > svg").viewBox.baseVal; return { vb: [v.x, v.y, v.width, v.height], L: FixedLive.L }; })()`);
  p.close();
  const a = info.vb[2] / info.vb[3];
  const w = even(Math.min(BOX[0], BOX[1] * a)), h = even(Math.min(BOX[1], BOX[0] / a));
  /* where the drawing sits in the frame (the living view keeps a margin): the shell aligns by it */
  const q = await openIsland(id, [w, h]);
  await sleep(800);
  info.content = await q.evaluate(`(function(){ var s = document.querySelector('body > svg'), r = s.getBoundingClientRect(), b = s.viewBox.baseVal;
    var k = Math.min(r.width / b.width, r.height / b.height), cw = b.width * k, ch = b.height * k;
    return [(r.left + (r.width - cw) / 2) / innerWidth, (r.top + (r.height - ch) / 2) / innerHeight, cw / innerWidth, ch / innerHeight].map(function (x) { return +x.toFixed(6); }); })()`);
  q.close();
  const N = Math.round(info.L * FPS);
  const dir = join(TMP, id); mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  /* frames 0..N (N is the seam check: t = L against t = 0), spread over WORKERS browsers */
  await Promise.all(Array.from({ length: WORKERS }, async (_, k) => {
    const b = await openIsland(id, [w, h]);
    await b.evaluate("(function(){ try { FixedLive.stop(); } catch (e) {} })()");
    try {
      for (let n = k; n <= N; n += WORKERS) {
        await b.evaluate(`(function(){ FixedLive.sync(${(n / FPS).toFixed(5)}); return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); })()`);
        const s = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 94 });
        writeFileSync(join(dir, String(n).padStart(5, "0") + ".jpg"), Buffer.from(s.data, "base64"));
      }
    } finally { b.close(); }
  }));
  console.log(id, `${N + 1} frames at ${w}x${h} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  return { ...info, w, h, N, dir };
}

function ff(args) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + r.stderr);
  return r.stderr;
}
function psnr(a, b) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-i", a, "-i", b, "-lavfi", "psnr", "-f", "null", "-"], { encoding: "utf8" });
  const m = /average:([\d.inf]+)/.exec(r.stderr); return m ? m[1] : "?";
}

function encode(id, R) {
  const inp = ["-framerate", String(FPS), "-start_number", "0", "-i", join(R.dir, "%05d.jpg"), "-frames:v", String(R.N)];
  const x264 = ["-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-g", String(FPS * 2), "-movflags", "+faststart", "-an"];
  const vp9 = ["-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-row-mt", "1", "-cpu-used", "2", "-pix_fmt", "yuv420p", "-g", String(FPS * 2), "-an"];
  ff([...inp, ...x264, join(OUT, id + ".mp4")]);
  ff([...inp, ...vp9, join(OUT, id + ".webm")]);
  const out = { aspect: +(R.vb[2] / R.vb[3]).toFixed(5), vb: R.vb, content: R.content, L: R.L, fps: FPS, frames: R.N, w: R.w, h: R.h,
    seamPSNR: psnr(join(R.dir, "00000.jpg"), join(R.dir, String(R.N).padStart(5, "0") + ".jpg")) };
  if (TILES.includes(id)) {
    const s = R.w >= R.h ? `scale=${TILE_LONG}:-2` : `scale=-2:${TILE_LONG}`;
    ff([...inp, "-vf", s + ":flags=lanczos", ...x264.map((v) => (v === "24" ? "26" : v)), join(OUT, id + "-tile.mp4")]);
    ff([...inp, "-vf", s + ":flags=lanczos", ...vp9, join(OUT, id + "-tile.webm")]);
    out.tile = true;
  }
  for (const f of [id + ".mp4", id + ".webm", id + "-tile.mp4", id + "-tile.webm"])
    if (existsSync(join(OUT, f))) out[f] = Math.round(statSync(join(OUT, f)).size / 1024) + " kB";
  return out;
}

/* ---- --slides: every move of every island's slides page, as video, and every
 * slide at rest, as a still (the author, 26 October 2026 evening: "now it is
 * really smooth, can it be implemented at all the levels?").
 * Captured from the deck's dynamic/dynamic.html AS IT IS (never rebuilt), by its
 * own test API: EntryStage.mapSeek(id, into, j) for a slide's entry from the
 * island view and its leave back, EntryStage.journeySeek(a, b, j) for a move
 * between consecutive slides, both ways; EntryStage.seek(id, 1) for the rest.
 * Writes media/slides/<island>/in-<k>.mp4, out-<k>.mp4, fw-<k>.mp4 (k -> k+1),
 * bw-<k>.mp4 (k+1 -> k), rest-<k>.webp (2x), rest-0.webp (the island view), and
 * media/slides/slides.json: order, names, the page's ground, its frame, every
 * clickable region's boxes in the drawing's units, and the hand-off checks. */
const SLIDE_SIZE = [1920, 1080];
async function openSlides(id, dpr) {
  const b = await browser();
  await b.send("Emulation.setDeviceMetricsOverride", { width: SLIDE_SIZE[0], height: SLIDE_SIZE[1], deviceScaleFactor: dpr || 1, mobile: false });
  await b.send("Page.navigate", { url: pathToFileURL(join(DECK, ISLANDS[id], "dynamic", "dynamic.html")).href + "?autostart=0" });
  for (let i = 0; i < 1800; i++) {
    await sleep(100);
    if (await b.evaluate("!!(window.EntryStage && EntryStage.order && window.FixedLive)").catch(() => false)) break;
  }
  await sleep(500);
  return b;
}
const RAF = "new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); })";
async function slidesInfo(id) {
  const b = await openSlides(id, 1);
  try {
    return await b.evaluate(`(function(){ var E = EntryStage, o = E.order; E.base();
      var sv = document.querySelector("body > svg"), r = sv.getBoundingClientRect();
      var f = (sv.getAttribute("viewBox") || "").trim().split(/[\\s,]+/).map(Number);
      if (f.length !== 4) { var bv = sv.viewBox.baseVal; f = [bv.x, bv.y, bv.width, bv.height]; }
      var s = Math.min(r.width / f[2], r.height / f[3]), ox = r.left + (r.width - f[2] * s) / 2, oy = r.top + (r.height - f[3] * s) / 2;
      var toU = function (b) { return [f[0] + (b.left - ox) / s, f[1] + (b.top - oy) / s, b.width / s, b.height / s].map(function (x) { return +x.toFixed(2); }); };
      var hits = [];
      Array.prototype.forEach.call(document.querySelectorAll("[data-hit]"), function (el) {
        var b = el.getBoundingClientRect(); if (b.width < 1 || b.height < 1) return;
        hits.push({ rid: el.getAttribute("data-hit"), part: el.getAttribute("data-hit-part") || el.getAttribute("data-object") || "", box: toU(b) });
      });
      var door = document.querySelector("a.subisland"), doorBox = door ? toU(door.getBoundingClientRect()) : null;
      var regions = (window.FIXED_CLICKABLE && FIXED_CLICKABLE.regions || []).map(function (g) { return { id: g.id, name: g.name, hit: g.hit }; });
      var parts = {};
      regions.forEach(function (g) { (g.hit || []).forEach(function (n) { var el = document.querySelector('[data-object="' + n + '"]'); if (el) { var b = el.getBoundingClientRect(); if (b.width > 0) parts[n] = toU(b); } }); });
      return { order: o, names: o.map(function (k) { return E.slides[k].name; }),
        bg: getComputedStyle(document.body).backgroundColor, frame: f, svgFrac: [r.left / innerWidth, r.top / innerHeight, r.width / innerWidth, r.height / innerHeight],
        hits: hits, door: doorBox, regions: regions, parts: parts,
        durs: o.map(function (k, i) { return { in: E.mapPlan(k, true).dur, out: E.mapPlan(k, false).dur, fw: i + 1 < o.length ? E.journeyPlan(k, o[i + 1]).dur : null, bw: i + 1 < o.length ? E.journeyPlan(o[i + 1], k).dur : null }; }) }; })()`);
  } finally { b.close(); }
}
async function captureMoves(id, info, dir, workers) {
  const o = info.order, moves = [];
  o.forEach((k, i) => {
    const n = i + 1;
    moves.push({ name: "in-" + n, dur: info.durs[i].in, pre: `E.seek(${JSON.stringify(k)}, 0)`, at: (j) => `E.mapSeek(${JSON.stringify(k)}, true, ${j})` });
    moves.push({ name: "out-" + n, dur: info.durs[i].out, pre: `E.seek(${JSON.stringify(k)}, 1)`, at: (j) => `E.mapSeek(${JSON.stringify(k)}, false, ${j})` });
    if (i + 1 < o.length) {
      const a = JSON.stringify(k), c = JSON.stringify(o[i + 1]);
      moves.push({ name: "fw-" + n, dur: info.durs[i].fw, pre: `E.seek(${a}, 1)`, at: (j) => `E.journeySeek(${a}, ${c}, ${j})` });
      moves.push({ name: "bw-" + n, dur: info.durs[i].bw, pre: `E.seek(${c}, 1)`, at: (j) => `E.journeySeek(${c}, ${a}, ${j})` });
    }
  });
  moves.sort((x, y) => y.dur - x.dur);                       /* the longest first, spread over the workers */
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(workers, moves.length) }, async () => {
    const b = await openSlides(id, 1);
    try {
      for (;;) {
        const m = moves[next++]; if (!m) break;
        const md = join(dir, m.name); mkdirSync(md, { recursive: true });
        const N = Math.max(2, Math.ceil(m.dur * FPS) + 1);
        m.frames = N;
        /* every slide a previous move drew is put back to E(0) first: base() leaves them */
        await b.evaluate(`(function(){ var E = EntryStage; E.base(); E.order.forEach(function (k) { E.seek(k, 0); }); ${m.pre}; return ${RAF}; })()`);
        for (let f = 0; f < N; f++) {
          const j = (f / (N - 1)).toFixed(6);
          await b.evaluate(`(function(){ var E = EntryStage; ${m.at(j)}; return ${RAF}; })()`);
          const s = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 93 });
          writeFileSync(join(md, String(f).padStart(4, "0") + ".jpg"), Buffer.from(s.data, "base64"));
        }
      }
    } finally { b.close(); }
  }));
  return moves;
}
async function captureRests(id, info, dir) {
  const b = await openSlides(id, 2);
  try {
    const shoot = async (expr, name) => {
      await b.evaluate(`(function(){ var E = EntryStage; E.base(); E.order.forEach(function (k) { E.seek(k, 0); }); ${expr}; return ${RAF}; })()`);
      await sleep(150);
      const s = await b.send("Page.captureScreenshot", { format: "webp", quality: 90 });
      writeFileSync(join(dir, name), Buffer.from(s.data, "base64"));
      /* and a 1x jpeg of the same state, for the hand-off check */
      await b.send("Emulation.setDeviceMetricsOverride", { width: SLIDE_SIZE[0], height: SLIDE_SIZE[1], deviceScaleFactor: 1, mobile: false });
      await b.evaluate(RAF);
      const t = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 93 });
      writeFileSync(join(TMP, "slides-" + id + "-" + name.replace(".webp", ".jpg")), Buffer.from(t.data, "base64"));
      await b.send("Emulation.setDeviceMetricsOverride", { width: SLIDE_SIZE[0], height: SLIDE_SIZE[1], deviceScaleFactor: 2, mobile: false });
      await b.evaluate(RAF);
    };
    await shoot("FixedLive.sync(0)", "rest-0.webp");
    for (let i = 0; i < info.order.length; i++) await shoot(`E.seek(${JSON.stringify(info.order[i])}, 1)`, `rest-${i + 1}.webp`);
  } finally { b.close(); }
}
async function slidesFor(id, workers) {
  const t0 = Date.now();
  const info = await slidesInfo(id);
  const out = join(OUT, "slides", id); mkdirSync(out, { recursive: true });
  const fr = join(TMP, "slides-" + id); mkdirSync(fr, { recursive: true });
  const [moves] = await Promise.all([captureMoves(id, info, fr, workers), captureRests(id, info, out)]);
  const x264 = ["-c:v", "libx264", "-preset", "slow", "-crf", String(arg("crf", "26")), "-pix_fmt", "yuv420p", "-g", String(FPS), "-movflags", "+faststart", "-an"];
  const checks = {};
  for (const m of moves) {
    ff(["-framerate", String(FPS), "-start_number", "0", "-i", join(fr, m.name, "%04d.jpg"), ...x264, join(out, m.name + ".mp4")]);
    /* hand-offs: first and last frames against the rests they leave and reach */
    const n = +m.name.split("-")[1], last = String(m.frames - 1).padStart(4, "0");
    const restJ = (k) => join(TMP, "slides-" + id + "-rest-" + k + ".jpg");
    const [a, z] = m.name.startsWith("in") ? [0, n] : m.name.startsWith("out") ? [n, 0] : m.name.startsWith("fw") ? [n, n + 1] : [n + 1, n];
    checks[m.name] = { frames: m.frames, first: +(+psnr(join(fr, m.name, "0000.jpg"), restJ(a)) || 99).toFixed(1), last: +(+psnr(join(fr, m.name, last + ".jpg"), restJ(z)) || 99).toFixed(1) };
  }
  let bytes = 0;
  for (const f of readdirSync(out)) bytes += statSync(join(out, f)).size;
  console.log(id, "slides:", info.order.length, "moves:", moves.length, "frames:", moves.reduce((s, m) => s + m.frames, 0),
    "MB:", (bytes / 1048576).toFixed(1), "in", ((Date.now() - t0) / 1000).toFixed(0), "s");
  delete info.durs;
  return Object.assign(info, { checks, bytes });
}
/* ---- --rest: each slide's RESTING LOOP (the author, 27 October 2026: "important animation
 * of some slides disapear, e.g. tokenizer, pretraining, fine-tuning, those were looping for a
 * reason"). A slide loops at rest when its page starts an idle after the entry
 * (EntryStage.idling). The loop is captured by the page's own clock: the slide is entered
 * for real, then EntryStage.idleSeek(u) is driven over one period, u = f / N, N = period x 30.
 * Writes media/slides/<island>/loop-<k>.mp4 and, in slides.json, <island>.loops[k] =
 * { period, frames, seam (dB, u = 1 against u = 0), handoff (dB, u = 0 against rest-<k>) }. */
async function restLoops(id, workers) {
  const t0 = Date.now();
  const sp = join(OUT, "slides", "slides.json"), sm = JSON.parse(readFileSync(sp, "utf8"));
  const order = sm[id].order;
  const out = join(OUT, "slides", id), fr = join(TMP, "loops-" + id); mkdirSync(fr, { recursive: true });
  const jobs = order.map((k, i) => ({ k, n: i + 1 }));
  const loops = {};
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, async () => {
    const b = await openSlides(id, 1);
    try {
      for (;;) {
        const j = jobs[next++]; if (!j) break;
        await b.evaluate(`(function(){ var E = EntryStage; E.base(); E.order.forEach(function (k) { E.seek(k, 0); }); E.enter(${JSON.stringify(j.k)}); })()`);
        for (let i = 0; i < 600; i++) { await sleep(100); if (await b.evaluate("EntryStage.phase === 'slide' && !EntryStage.flying")) break; }
        const info = await b.evaluate(`(function(){ var a = EntryStage.idling ? EntryStage.idleSeek(0) : null; return a ? { period: a.period } : null; })()`);
        if (info && info.period > 0) {
          const N = Math.max(2, Math.round(info.period * FPS));
          const md = join(fr, "loop-" + j.n); mkdirSync(md, { recursive: true });
          for (let f = 0; f <= N; f++) {                       /* f = N is the seam check */
            await b.evaluate(`(function(){ EntryStage.idleSeek(${(f / N).toFixed(6)}); return ${RAF}; })()`);
            const s = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 93 });
            writeFileSync(join(md, String(f).padStart(4, "0") + ".jpg"), Buffer.from(s.data, "base64"));
          }
          loops[j.n] = { period: +info.period.toFixed(4), frames: N, dir: md };
        }
        await b.evaluate("EntryStage.leave()");
        for (let i = 0; i < 300; i++) { await sleep(100); if (await b.evaluate("EntryStage.phase === 'map' && !EntryStage.flying")) break; }
      }
    } finally { b.close(); }
  }));
  const x264 = ["-c:v", "libx264", "-preset", "slow", "-crf", String(arg("crf", "27")), "-pix_fmt", "yuv420p", "-g", String(FPS), "-movflags", "+faststart", "-an"];
  let bytes = 0;
  for (const n of Object.keys(loops)) {
    const L = loops[n], f0 = join(L.dir, "0000.jpg"), fN = join(L.dir, String(L.frames).padStart(4, "0") + ".jpg");
    ff(["-framerate", String(FPS), "-start_number", "0", "-i", join(L.dir, "%04d.jpg"), "-frames:v", String(L.frames), ...x264, join(out, "loop-" + n + ".mp4")]);
    bytes += statSync(join(out, "loop-" + n + ".mp4")).size;
    const restJ = join(TMP, "slides-" + id + "-rest-" + n + ".jpg");
    L.seam = +(+psnr(f0, fN) || 99).toFixed(1);
    L.handoff = existsSync(restJ) ? +(+psnr(f0, restJ) || 99).toFixed(1) : null;
    delete L.dir;
  }
  const s2 = JSON.parse(readFileSync(sp, "utf8"));          /* re-read: other islands may have written meanwhile */
  s2[id].loops = loops;
  writeFileSync(sp, JSON.stringify(s2, null, 1) + "\n");
  console.log(id, "loops:", Object.keys(loops).length, "MB:", (bytes / 1048576).toFixed(1), "in", ((Date.now() - t0) / 1000).toFixed(0), "s", JSON.stringify(loops));
}
if (process.argv.includes("--rest")) {
  const ids = ONLY ? ONLY.split(",") : Object.keys(ISLANDS);
  for (const id of ids) await restLoops(id, WORKERS);     /* one island at a time: slides.json is shared */
  process.exit(0);
}
if (process.argv.includes("--slides")) {
  mkdirSync(join(OUT, "slides"), { recursive: true });
  const sp = join(OUT, "slides", "slides.json");
  const sm = existsSync(sp) ? JSON.parse(readFileSync(sp, "utf8")) : {};
  const ids = ONLY ? ONLY.split(",") : Object.keys(ISLANDS);
  const res = await Promise.all(ids.map(async (id) => [id, await slidesFor(id, WORKERS)]));
  for (const [id, r] of res) sm[id] = r;
  writeFileSync(sp, JSON.stringify(sm, null, 1) + "\n");
  console.log("frames kept in", TMP);
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
const metaPath = join(OUT, "media.json");
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};
const ids = ONLY ? ONLY.split(",") : Object.keys(ISLANDS);
const rendered = await Promise.all(ids.map(async (id) => [id, await render(id)]));
for (const [id, R] of rendered) { meta[id] = encode(id, R); console.log(id, JSON.stringify(meta[id])); }
writeFileSync(metaPath, JSON.stringify(meta, null, 1) + "\n");
console.log("frames kept in", TMP);
