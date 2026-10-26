#!/usr/bin/env node
/* The island views the retro openings land on, captured from the shell itself.
 *
 *   node world/talk/retro_capture.mjs [OUT_DIR]      (default $TMPDIR/retro-islands, kept out of the site)
 *
 * Serves world/talk/ on a local port (fetch() needs http), opens the shell with the old
 * world (?world=old, so nothing retro is needed to capture it) and ?chrome=0 at 1920x1080,
 * goes to each island view (#/<id>), holds its loop at frame 0 and saves the screen as
 * island-<id>.png: the last frame of open-<id>.mp4 and the first of close-<id>.mp4
 * (make_retro.py). Run it again whenever an island's rest picture or loop changes, then
 * make_retro.py --only open.
 */
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || path.join(os.tmpdir(), "retro-islands");   /* inputs only: never published */
mkdirSync(OUT, { recursive: true });
const house = process.env.DECK_HOUSE || path.join(process.env.HOME, "dotfiles/presentations");
const { open } = await import(path.join(house, "tools/drive.mjs"));
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".mp4": "video/mp4", ".webm": "video/webm", ".webp": "image/webp", ".png": "image/png" };
const srv = http.createServer((req, res) => {
  const p = path.join(HERE, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(HERE) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const size = statSync(p).size, type = MIME[path.extname(p)] || "application/octet-stream";
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || "");
  if (m) {
    const a = +m[1], b = m[2] ? +m[2] : size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${a}-${b}/${size}`, "Accept-Ranges": "bytes", "Content-Length": b - a + 1 });
    return createReadStream(p, { start: a, end: b }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
  createReadStream(p).pipe(res);
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}/index.html`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ["1.1", "2.2", "3.1", "4.1"]) {
  const b = await open(base + "?chrome=0&world=old#/" + id, { size: [1920, 1080] });
  await b.until("window.Talk && Talk.state.layer==='island' && !Talk.state.busy", 30000);
  await b.evaluate(`(async()=>{for(const v of document.querySelectorAll('video.bigvid')){v.pause();v.currentTime=0;await new Promise(r=>{v.addEventListener('seeked',r,{once:true});setTimeout(r,2000)});} return 1})()`);
  await sleep(800);
  await b.shot(path.join(OUT, "island-" + id + ".png"));
  console.log("island-" + id + ".png");
  await b.close();
}
srv.close();
process.exit(0);
