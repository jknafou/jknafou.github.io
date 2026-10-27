"""The talk, offline (the author, 27 October 2026, the day of the talk: "Is it normal that the
presentation is buggy when working offline? Couldn't we have a download button?").

    python3 world/talk/offline.py                 writes world/talk/offline-manifest.json
    python3 world/talk/offline.py --zip OUT_DIR   and the ZIP backup into OUT_DIR

THE MANIFEST lists every file the shell can load -- talk.js, talk.css, index.html, talk-live.js,
the stills, every media file (loops, tiles, slide moves, rest pictures and loops, the retro
map, the skies) -- with its size and a short hash. sw.js and the shell's download control read
it: a file is (re)fetched into the cache when its hash changes, so a media change refreshes only
that file. The manifest is rewritten only when its content changes, so publish/watch.py, which
reruns the build on every write, settles.

NOT IN IT: the island slides pages and living views (../island-<id>-slides.html, -live.html),
which only ?live=1 loads; the default walk never does. And the scripts that MAKE the media.

THE ZIP BACKUP is in two parts, because GitHub refuses any file over 100 MB:
talk-offline-a.zip (the shell and most media) and talk-offline-b.zip (the rest), each holding
one folder, research-day-talk/ and research-day-talk-part-b/. Unzip both side by side (a
double-click each, in the same folder); start.command (Mac) or start.bat (Windows), in
research-day-talk/, merges part b in on its first run, serves the folder and opens the browser.
The zips are rebuilt only when the manifest's version changes.
"""

import hashlib
import json
import os
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
MANIFEST = os.path.join(HERE, "offline-manifest.json")
SKIP_EXT = (".py", ".mjs", ".pyc")
SKIP = {"offline-manifest.json", "sw.js"}
PART_B = ("media/slides/2.1/", "media/slides/4.1/")       # what goes in talk-offline-b.zip


def files():
    out = []
    for root, dirs, names in os.walk(HERE):
        dirs[:] = sorted(d for d in dirs if d != "__pycache__" and not d.startswith("."))
        for n in sorted(names):
            if n.startswith(".") or n.endswith(SKIP_EXT) or n in SKIP:
                continue
            p = os.path.join(root, n)
            rel = os.path.relpath(p, HERE).replace(os.sep, "/")
            h = hashlib.sha256(open(p, "rb").read()).hexdigest()[:12]
            out.append([rel, os.path.getsize(p), h])
    return out


def manifest():
    fs = files()
    version = hashlib.sha256("".join(f[0] + f[2] for f in fs).encode()).hexdigest()[:12]
    m = {"version": version, "bytes": sum(f[1] for f in fs), "count": len(fs), "files": fs}
    text = json.dumps(m, separators=(",", ":")) + "\n"
    old = open(MANIFEST).read() if os.path.exists(MANIFEST) else None
    if old != text:
        open(MANIFEST, "w").write(text)
    return m


README = """THE TALK, OFFLINE
=================

1. Unzip BOTH talk-offline-a.zip and talk-offline-b.zip in the same folder
   (double-click each). You get research-day-talk/ and research-day-talk-part-b/.
2. Mac: double-click research-day-talk/start.command
   (the first time: right-click it > Open, as it is not from the App Store).
   Windows: double-click research-day-talk\\start.bat
   It merges part b in, serves the folder on http://localhost:8765/ and opens the browser.
3. Or by hand, in a terminal, in research-day-talk/:
       python3 -m http.server 8765
   then open http://localhost:8765/   (merge research-day-talk-part-b/ into it first).

Keys: arrows travel, F full screen, O the offline panel.
"""

COMMAND = """#!/bin/bash
# the talk, offline: merge part b, serve this folder, open the browser
cd "$(dirname "$0")"
B="../research-day-talk-part-b"
[ -d "$B" ] && ditto "$B" .
( sleep 1; open "http://localhost:8765/" ) &
exec python3 -m http.server 8765
"""

BAT = """@echo off
rem the talk, offline: merge part b, serve this folder, open the browser
cd /d "%~dp0"
if exist "..\\research-day-talk-part-b" xcopy /E /Y /Q "..\\research-day-talk-part-b\\*" ".\\" >nul
start "" "http://localhost:8765/"
python -m http.server 8765 || py -m http.server 8765
"""


def zips(out, m):
    stamp = os.path.join(out, "talk-offline.version")
    if os.path.exists(stamp) and open(stamp).read().strip() == m["version"] \
            and all(os.path.exists(os.path.join(out, "talk-offline-%s.zip" % x)) for x in "ab"):
        return False
    for part, top in (("a", "research-day-talk"), ("b", "research-day-talk-part-b")):
        tmp = os.path.join(out, "talk-offline-%s.zip.tmp" % part)
        with zipfile.ZipFile(tmp, "w") as z:
            for rel, size, h in m["files"]:
                if rel.startswith("talk-offline"):
                    continue
                inb = rel.startswith(PART_B)
                if (part == "b") != inb:
                    continue
                packed = zipfile.ZIP_STORED if rel.endswith((".mp4", ".webm", ".webp", ".png", ".jpg")) else zipfile.ZIP_DEFLATED
                z.write(os.path.join(HERE, rel), top + "/" + rel, compress_type=packed)
            if part == "a":
                z.write(MANIFEST, top + "/offline-manifest.json")
                z.writestr(top + "/README.txt", README)
                for name, body in (("start.command", COMMAND), ("start.bat", BAT)):
                    zi = zipfile.ZipInfo(top + "/" + name)
                    zi.external_attr = 0o100755 << 16
                    z.writestr(zi, body)
        os.replace(tmp, os.path.join(out, "talk-offline-%s.zip" % part))
    open(stamp, "w").write(m["version"] + "\n")
    return True


if __name__ == "__main__":
    m = manifest()
    print("offline manifest: %d files, %.1f MB, version %s" % (m["count"], m["bytes"] / 1048576, m["version"]))
    if "--zip" in sys.argv:
        out = sys.argv[sys.argv.index("--zip") + 1]
        os.makedirs(out, exist_ok=True)
        if zips(out, m):
            for x in "ab":
                p = os.path.join(out, "talk-offline-%s.zip" % x)
                print("  %s %.1f MB" % (os.path.basename(p), os.path.getsize(p) / 1048576))
