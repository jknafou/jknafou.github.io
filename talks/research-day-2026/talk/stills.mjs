#!/usr/bin/env node
/* The world's stills: each island's living view AT REST (its signed still),
 * rendered once in headless Chrome and saved as world/talk/stills/<id>.webp,
 * with stills/stills.json giving each image's aspect.
 *
 *   node world/talk/stills.mjs            (from the deck's root, or anywhere)
 *
 * Why (the author, 26 October 2026, on his laptop: "The hovering at the world
 * level is really slow. The zoom in and out from world view to island is
 * extreamly slow and not smooth"): the world showed four living views in
 * iframes, and the zooms transformed live SVG pages. The shell now shows these
 * images on the world and zooms THEM (compositor-only transform and opacity),
 * revealing the live page under the image once the motion is over.
 *
 * Run it again after an island's still changes; build.py copies world/talk/
 * whole, stills included. It never runs inside build.py: the watcher would
 * launch a browser on every write.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DECK = resolve(HERE, "..", "..");
const OUT = join(HERE, "stills");
const ISLANDS = {
  "1.1": "sections/1-motivation/1.1-use-case",
  "2.1": "sections/2-methodology/2.1-translation-workflow",
  "2.2": "sections/2-methodology/2.2-pretraining",
  "3.1": "sections/3-results/3.1-results",
  "4.1": "sections/4-conclusion/4.1-what-is-possible",
};
const LONG = 1200, DPR = 2, QUALITY = 88;
const CHROME = process.env.DECK_CHROME || ["/opt/google/chrome/chrome", "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function browser() {
  const prof = mkdtempSync(join(tmpdir(), "stills-"));
  const kid = spawn(CHROME, ["--headless=new", "--no-first-run", "--hide-scrollbars", "--remote-debugging-port=0",
    `--user-data-dir=${prof}`, "--allow-file-access-from-files", "about:blank"], { stdio: "ignore", detached: true });
  let port = null;
  for (let i = 0; i < 150 && !port; i++) {
    await sleep(100);
    const f = join(prof, "DevToolsActivePort");
    if (existsSync(f)) port = readFileSync(f, "utf8").split("\n")[0].trim() || null;
  }
  let t = null;
  for (let i = 0; i < 60 && !t; i++) {
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

mkdirSync(OUT, { recursive: true });
const b = await browser();
const meta = {};
try {
  for (const [id, dir] of Object.entries(ISLANDS)) {
    const page = join(DECK, dir, "fixed.live.html");
    if (!existsSync(page)) { console.log(id, "no fixed.live.html"); continue; }
    /* the aspect first, from the page's own drawing */
    await b.send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 1000, deviceScaleFactor: 1, mobile: false });
    await b.send("Page.navigate", { url: pathToFileURL(page).href + "?autostart=0" });
    let vb = null;
    for (let i = 0; i < 600 && !vb; i++) {
      await sleep(100);
      vb = await b.evaluate(`(function(){ try { if (!window.FixedLive) return null; var v = document.querySelector("body > svg").viewBox.baseVal; return [v.x, v.y, v.width, v.height]; } catch (e) { return null; } })()`);
    }
    if (!vb) throw new Error(id + ": the living view never came up");
    const a = vb[2] / vb[3];
    const w = a >= 1 ? LONG : Math.round(LONG * a), h = a >= 1 ? Math.round(LONG / a) : LONG;
    await b.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: DPR, mobile: false });
    /* at rest: the tour never started (autostart=0), the page re-measured at this size */
    await sleep(800);
    await b.evaluate(`(function(){ try { FixedLive.stop(); } catch (e) {} return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); })()`);
    await sleep(600);
    const shot = await b.send("Page.captureScreenshot", { format: "webp", quality: QUALITY });
    writeFileSync(join(OUT, id + ".webp"), Buffer.from(shot.data, "base64"));
    meta[id] = { aspect: +a.toFixed(5), vb, w: w * DPR, h: h * DPR };
    console.log(id, w * DPR + "x" + h * DPR, Math.round(shot.data.length * 0.75 / 1024) + " kB");
  }
} finally { b.close(); }
writeFileSync(join(OUT, "stills.json"), JSON.stringify(meta, null, 1) + "\n");
