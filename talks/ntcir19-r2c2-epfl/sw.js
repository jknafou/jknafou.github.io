/* The deck's service worker. Scope: the deck's folder (talks/<slug>/).
 *   the shell   every .html, .js, .css, .json: NETWORK FIRST (a fix published this morning is
 *               picked up), the cache when offline; every good answer refreshes the cache.
 *   the media   everything else: CACHE FIRST. deck.js fills the cache from offline-manifest.json,
 *               each file stored with its hash. A <video> asks with a Range header: a cached file
 *               answers it with a 206 sliced from the whole file, which Chrome needs offline.
 * The cache names carry the folder's path, so two decks on one site never share a cache, and a SCHEMA number:
 * the caches of any other schema are deleted when this worker activates (and by deck.js before anything plays).
 * A NEVER-STALE MEDIA FILE (the author, 5 November 2026: "I still don't see the validated new title page"; his browser
 * kept the old title video, because the cached copy's hash was checked against a manifest the publish had not
 * rewritten): deck.js asks for every still and video by a versioned URL, media/in-1.mp4?v=<its content hash>
 * (media.json's "v", the same sha256[:12] as offline-manifest.json's), and a cached copy is answered only when the
 * hash it was stored with (X-Hash) is that v; any other copy is dropped and the file comes from the network, by its
 * versioned URL, which no HTTP cache holds an older answer for.
 */
var ROOT = new URL(self.registration.scope).pathname;
var SCHEMA = 2, SHELL = "deck-shell-" + SCHEMA + ":" + ROOT, MEDIA = "deck-media-" + SCHEMA + ":" + ROOT;
function ours(name) { return /^deck-(shell|media)(-\d+)?:/.test(name) && name.slice(name.indexOf(":") + 1) === ROOT; }
var SHELL_FILES = ["./", "index.html", "deck.js", "deck.css", "deck.json", "slides.json", "live.html", "live.js", "anim.js",
  "offline-manifest.json", "media/media.json"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return Promise.all(SHELL_FILES.map(function (u) {
      return fetch(u, { cache: "no-store" }).then(function (r) { if (r.ok) return c.put(new URL(u, self.registration.scope).href, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ns) {
    return Promise.all(ns.filter(function (n) { return ours(n) && n !== SHELL && n !== MEDIA; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

function isShell(url) { return /\/$/.test(url.pathname) || /\.(html|js|css|json)$/.test(url.pathname); }
function keyOf(url) { return url.origin + url.pathname; }

async function shellFirst(req, url) {
  var c = await caches.open(SHELL);
  var key = req.mode === "navigate" && /\/$/.test(url.pathname) ? self.registration.scope : keyOf(url);
  try {
    var r = await fetch(req, { cache: "no-store" });
    if (r.ok) c.put(key, r.clone());
    return r;
  } catch (e) {
    var hit = await c.match(key) || await c.match(keyOf(url)) || await (await caches.open(MEDIA)).match(keyOf(url));
    if (hit) return hit;
    throw e;
  }
}
async function mediaFirst(req, url) {
  var c = await caches.open(MEDIA), hit = await c.match(keyOf(url)), v = url.searchParams.get("v");
  if (hit && v && hit.headers.get("X-Hash") !== v) {          /* a copy of another version: never answered while online */
    try { var r = await fetch(req); if (r.ok || r.status === 206) { c.delete(keyOf(url)); return r; } } catch (e) {}
  }
  if (!hit) return fetch(req);
  var range = req.headers.get("range");
  if (!range) return hit;
  var buf = await hit.arrayBuffer(), size = buf.byteLength;
  var m = /bytes=(\d*)-(\d*)/.exec(range);
  var start = m && m[1] !== "" ? +m[1] : 0, end = m && m[2] !== "" ? +m[2] : size - 1;
  if (m && m[1] === "" && m[2] !== "") { start = Math.max(0, size - +m[2]); end = size - 1; }
  end = Math.min(end, size - 1);
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers: {
    "Content-Type": hit.headers.get("Content-Type") || "application/octet-stream",
    "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
}
self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (url.searchParams.has("fill")) return;            /* the download control's own fetch: always the network */
  if (req.mode === "navigate" || isShell(url)) return e.respondWith(shellFirst(req, url));
  e.respondWith(mediaFirst(req, url));
});
