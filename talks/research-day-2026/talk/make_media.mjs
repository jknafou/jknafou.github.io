#!/usr/bin/env node
/* The shell's videos: each island's LIVING VIEW, rendered deterministically by
 * seeking its own timeline (FixedLive.sync(t)) frame by frame, and encoded.
 *
 *   node world/talk/make_media.mjs --ffmpeg <path to ffmpeg> [--tmp <dir>] [--only 2.2,3.1] [--workers 8]
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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, statSync } from "node:fs";
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
  const out = { aspect: +(R.vb[2] / R.vb[3]).toFixed(5), vb: R.vb, L: R.L, fps: FPS, frames: R.N, w: R.w, h: R.h,
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

mkdirSync(OUT, { recursive: true });
const metaPath = join(OUT, "media.json");
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};
const ids = ONLY ? ONLY.split(",") : Object.keys(ISLANDS);
const rendered = await Promise.all(ids.map(async (id) => [id, await render(id)]));
for (const [id, R] of rendered) { meta[id] = encode(id, R); console.log(id, JSON.stringify(meta[id])); }
writeFileSync(metaPath, JSON.stringify(meta, null, 1) + "\n");
console.log("frames kept in", TMP);
