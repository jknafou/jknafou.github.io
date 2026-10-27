/* The talk's service worker (27 October 2026, the day of the talk: "Is it normal that the
 * presentation is buggy when working offline? ... a way to make sure that once [loaded] it
 * keep all the presentation in memory"). Scope: this folder, talk/.
 *
 *   the shell   index.html, talk.js, talk.css, talk-live.js, every .json: NETWORK FIRST (so a
 *               fix published this morning is picked up), falling back to the cache offline;
 *               every good network answer refreshes the cache.
 *   the media   everything else: CACHE FIRST. The shell's download control (talk.js, "O")
 *               fills the cache from offline-manifest.json, each file stored with its hash.
 *               A <video> asks with a Range header: a cached file answers it with a 206 sliced
 *               from the whole file, which Chrome needs to play offline.
 * Bump VERSION to drop the shell cache; the media cache is kept and refreshed per file hash.
 */
var VERSION = "talk-shell-1";
var SHELL = "talk-shell", MEDIA = "talk-media";
var SHELL_FILES = ["./", "index.html", "talk.js", "talk.css", "talk-live.js", "offline-manifest.json",
  "media/media.json", "media/slides/slides.json", "media/retro/retro.json", "stills/stills.json"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return Promise.all(SHELL_FILES.map(function (u) {
      return fetch(u, { cache: "no-store" }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== SHELL && k !== MEDIA; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function isShell(url) {
  var p = url.pathname;
  return /\/$/.test(p) || /\.(html|js|css|json)$/.test(p);
}
/* the cache key of a request: this folder's path, without query or hash */
function keyOf(url) { return url.origin + url.pathname; }

async function shellFirst(req, url) {
  var c = await caches.open(SHELL);
  var key = req.mode === "navigate" ? new URL("./", self.registration.scope).href : keyOf(url);
  try {
    var r = await fetch(req, { cache: "no-store" });
    if (r.ok) c.put(key, r.clone());
    return r;
  } catch (e) {
    var hit = await c.match(key) || await c.match(keyOf(url)) || (await caches.open(MEDIA)).match(keyOf(url));
    if (hit) return hit;
    throw e;
  }
}

async function mediaFirst(req, url) {
  var c = await caches.open(MEDIA);
  var hit = await c.match(keyOf(url));
  if (!hit) return fetch(req);
  var range = req.headers.get("range");
  if (!range) return hit;
  /* a Range request answered from the whole cached file: 206, sliced */
  var buf = await hit.arrayBuffer(), size = buf.byteLength;
  var m = /bytes=(\d*)-(\d*)/.exec(range);
  var start = m && m[1] !== "" ? +m[1] : 0, end = m && m[2] !== "" ? +m[2] : size - 1;
  if (m && m[1] === "" && m[2] !== "") { start = Math.max(0, size - +m[2]); end = size - 1; }
  end = Math.min(end, size - 1);
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
  return new Response(buf.slice(start, end + 1), {
    status: 206, statusText: "Partial Content",
    headers: { "Content-Type": hit.headers.get("Content-Type") || "application/octet-stream",
      "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes" }
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.href.startsWith(self.registration.scope)) return;
  if (url.searchParams.has("fill")) return;            /* the download control's own fetch: always the network */
  if (req.mode === "navigate" || isShell(url)) return e.respondWith(shellFirst(req, url));
  e.respondWith(mediaFirst(req, url));
});
