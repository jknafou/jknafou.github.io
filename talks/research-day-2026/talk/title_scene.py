"""The title scene: the retro pixel sky above the city map, and the camera tilting down into it.

Rendered by make_retro.py (its `title` part), which hands this module itself (its frame(),
encode(), stand_point(), META ...):

    python3 world/talk/make_retro.py --ffmpeg <ffmpeg> --only title [--no-plate]

Writes into media/retro/:
  title.webp        the title scene as the talk opens on it (1920x1080, lossless)
  title-down.mp4    the camera tilts down from the sky to the map. Its first frame is title.webp,
                    its last is the map with Bert at the hospital on the shared 1 s clock, one
                    frame before idle-1.1's frame 0 (the same rule as the walks), so the
                    hand-off to idle-1.1.mp4 is seamless
  title-up.mp4      the same frames backwards: it ends on title.webp

THE TEXT IS HERE, in the constants below: change TITLE / SUBTITLE / NAME / USERNAME and re-render.
The map's font (pix.FONT5) has capitals only; the few lower-case letters and signs the title
needs are added below (EXTRA); add a glyph there if a new text needs one.

THE INPUTS, in world/talk/media/title/ (kept as they came, never redrawn or recoloured):
  avatar-github.jpg  https://github.com/jknafou.png?size=460 (460x460), the author's GitHub avatar,
                     downloaded 27 October 2026
  github-mark.svg    the GitHub mark, octicon `mark-github` (16) from @primer/octicons 19.8.0
                     (build/data.json on cdn.jsdelivr.net), MIT, (c) GitHub Inc.;
                     github-mark.png is it rasterised at 512x512 by headless Chrome
  hf-logo.png        world/concepts/assets/hf-logo.svg (see SOURCES.md there: the terms are UNCLEAR)
                     rasterised at 512x512 by headless Chrome
  heg-logo.svg       the official HEG Geneve logo, from the header of https://www.hesge.ch/heg/ :
                     https://www.hesge.ch/heg/sites/heg/themes/custom/heg/img/logo_heg-ge.svg
                     (33,585 bytes, 27 October 2026); heg-logo.png is it at 1240x450 (Chrome)
  sib-logo.png       submissions/emnlp2025-as-presented/WP/presentation/logos/sib_logo2023.png
  research-day-logo.png (or .jpg / .jpeg / .webp)
                     THE RESEARCH DAY'S LOGO: not on disk yet. Drop it there and re-render (the
                     command above); it is fitted on its white plate automatically. Until then
                     the plate is drawn empty and marked, or left out with --no-plate.
"""
import math
import os

import numpy as np
from PIL import Image

TITLE = [("DON'T TRANSLATE THE MODEL", 2, "WHITE"), ("TRANSLATE THE DATA", 3, "YELLOW")]   # (text, pixel scale, colour)
SUBTITLE = "TRANSBERT & TRANSCORPUS"
NAME = "JULIEN KNAFOU"
USERNAME = "jknafou"
TILT_S = 3                     # the tilt's length in seconds: an integer, so it ends on the idle loop's clock
RD_NAMES = ["research-day-logo.png", "research-day-logo.jpg", "research-day-logo.jpeg", "research-day-logo.webp"]

EXTRA = {  # glyphs the map's FONT5 lacks
    "&": [".##..", "#..#.", ".##..", ".#...", "#.#.#", "#..#.", ".##.#"],
    "a": [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
    "f": ["..##.", ".#...", "####.", ".#...", ".#...", ".#...", ".#..."],
    "j": ["...#", "....", "..##", "...#", "...#", "#..#", ".##."],
    "k": ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
    "n": [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
    "o": [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
    "u": [".....", ".....", "#...#", "#...#", "#...#", "#...#", ".####"],
}


def render(R):
    """R: the make_retro module (frame, to_screen, encode, stand_point, META, OUT, A, C, Layer, Sprite ...)"""
    C, Layer, Sprite = R.C, R.Layer, R.Sprite
    from pix import FONT5
    import props
    F = dict(FONT5); F.update(EXTRA)
    MW, MH, K, W, H = R.MW, R.MH, R.K, R.W, R.H
    MEDIA = os.path.join(R.A.deck, "world", "talk", "media", "title")

    def tw(s, sc=1):
        return (sum(len(F[ch][0]) + 1 for ch in s) - 1) * sc

    def text(L, x, y, s, c, sc=1):
        cx = x
        for ch in s:
            g = F[ch]
            for j, row in enumerate(g):
                for i, b in enumerate(row):
                    if b == "#":
                        L.rect(cx + i * sc, y + j * sc, sc, sc, c)
            cx += (len(g[0]) + 1) * sc

    # ---- the sky: flat bands, each joined to the next by dithered rows -------------------
    sky = Layer("sky")
    bands = [(0, C.WATER_D), (34, C.WATER), (96, C.WATER_L), (170, C.GLASS), (214, C.GLASS_L)]
    for k, (y0, c) in enumerate(bands):
        y1 = bands[k + 1][0] if k + 1 < len(bands) else MH
        sky.rect(0, y0, MW, y1 - y0, c)
        if k:
            prev = bands[k - 1][1]
            # 4 rows of the band above, thinning: 3/4, 1/2, 1/4, 1/8 of its pixels
            for r, keep in enumerate([(lambda x, y: (x + y) % 4 != 0), (lambda x, y: (x + y) % 2 == 0),
                                      (lambda x, y: (x % 2 == 0 and y % 2 == 0)), (lambda x, y: (x % 4 == 0 and (x // 4 + y) % 2 == 0))]):
                for x in range(MW):
                    if keep(x, y0 + r):
                        sky.put(x, y0 + r, prev)

    # the sun, top right, and its rays as dithered rings
    sun = Layer("sun")
    sun.ellipse(446, 30, 16, 16, C.YELLOW_L, ring=None)
    sun.ellipse(446, 30, 16, 16, C.YELLOW, ring=(13, 13))
    sun.ellipse(443, 27, 6, 6, "#fff8c8")
    halo = Layer("halo")
    for y in range(0, 60):
        for x in range(410, MW):
            d = math.hypot(x + 0.5 - 446, y + 0.5 - 30)
            if 18 <= d < 22 and (x + y) % 2 == 0:
                halo.put(x, y, C.YELLOW_L)
            elif 22 <= d < 26 and (x % 2 == 0 and y % 2 == 0):
                halo.put(x, y, C.YELLOW_L)

    def cloud(w):
        L = Layer("cloud")
        h = 8
        L.ellipse(w * 0.5, h + 1, w * 0.5, 5, C.WHITE)
        L.ellipse(w * 0.32, h - 2, w * 0.2, 6, C.WHITE)
        L.ellipse(w * 0.62, h - 4, w * 0.22, 8, C.WHITE)
        for (x, y), c in list(L.px.items()):
            if y >= h + 3:
                L.px[(x, y)] = C.WHITE_S
        L.outline(C.WATER_D)
        return L

    clouds = Layer("clouds")
    for (x, y, w) in [(14, 14, 54), (100, 6, 36), (236, 10, 40), (8, 104, 40), (418, 108, 46), (60, 182, 34), (424, 186, 38)]:
        clouds.merge(cloud(w), x, y)

    # the horizon: far hills, a tree line, then the grass the map begins with
    hz = Layer("horizon")
    for x in range(MW):
        y = 236 + 6 * math.sin(x / 37.0) + 4 * math.sin(x / 13.0 + 1)
        hz.rect(x, int(y), 1, MH - int(y), C.GRASS_D)
    hz.outline(C.LEAF_D)
    near = Layer("near")
    for x in range(MW):
        y = 250 + 3 * math.sin(x / 21.0 + 2)
        near.rect(x, int(y), 1, MH - int(y), C.GRASS)
    import terrain
    g = terrain.grass(MW, 8, 0, MH - 8)
    trees = Layer("trees")
    for i, x in enumerate(range(-4, MW, 26)):
        trees.merge(props.tree(i % 2), x + (7 if i % 3 == 0 else 0), 232 + (i % 3) * 2)

    # ---- the title ------------------------------------------------------------------
    words = Layer("title")
    y = 40
    lines = []
    for (s, sc, col) in TITLE:
        x = (MW - tw(s, sc)) // 2
        lines.append((s, sc, getattr(C, col), x, y))
        y += 7 * sc + 8
    shadow = Layer("tshadow")
    for (s, sc, col, x, y_) in lines:
        text(shadow, x + sc, y_ + sc, s, C.OUT, sc)
        text(words, x, y_, s, col, sc)
    words.outline(C.OUT)
    sub = Layer("sub")
    sy = y + 0
    text(sub, (MW - tw(SUBTITLE)) // 2, sy, SUBTITLE, C.WHITE)
    sub.outline(C.OUT)
    y = sy + 7 + 12

    # ---- the plates: name, then the logos ---------------------------------------------
    plates = Layer("plates")
    pastes = []          # (image, screen box) laid over the plates after scaling

    def plate(x, y, w, h, fill=C.WHITE, dashed=False):
        plates.rect(x + 2, y + 2, w + 2, h + 2, C.WATER_D)                 # its offset darker copy
        plates.rect(x - 1, y - 1, w + 2, h + 2, C.OUT)                      # the chunky outline
        plates.rect(x, y, w, h, fill)
        if dashed:
            for i in range(w):
                c = C.OUT if (i // 3) % 2 == 0 else fill
                plates.put(x + i, y + 2, c); plates.put(x + i, y + h - 3, c)
            for j in range(h):
                c = C.OUT if (j // 3) % 2 == 0 else fill
                plates.put(x + 2, y + j, c); plates.put(x + w - 3, y + j, c)
        else:
            plates.rect(x, y, w, 1, C.WHITE if fill != C.WHITE else "#ffffff")
            plates.rect(x, y + h - 1, w, 1, C.WHITE_S)

    def load(name, crop=True):
        im = Image.open(os.path.join(MEDIA, name)).convert("RGBA")
        if crop:
            a = np.array(im)
            if a[..., 3].min() < 255:
                bb = Image.fromarray(a[..., 3]).getbbox()
            else:                                          # opaque: crop the near-white margin
                bb = Image.fromarray((255 - a[..., :3].min(axis=2) > 12).astype(np.uint8) * 255).getbbox()
            if bb:
                im = im.crop(bb)
        return im

    def fit(im, bw, bh):
        s = min(bw / im.width, bh / im.height)
        return im.resize((max(1, int(round(im.width * s))), max(1, int(round(im.height * s)))), Image.LANCZOS)

    # the name plate: avatar | NAME over [GH][HF] username
    av = 30
    colw = max(tw(NAME), 10 + 2 + 10 + 4 + tw(USERNAME))
    pw, ph = 4 + av + 6 + colw + 5, av + 8
    px, py = (MW - pw) // 2, y
    plate(px, py, pw, ph)
    plates.rect(px + 3, py + 3, av + 2, av + 2, C.OUT)                       # the photo's own frame
    avatar = Image.open(os.path.join(MEDIA, "avatar-github.jpg")).convert("RGBA")
    pastes.append((avatar.resize((av * K, av * K), Image.LANCZOS), ((px + 4) * K, (py + 4) * K)))
    tx = px + 4 + av + 6
    text(plates, tx, py + 6, NAME, C.OUT)
    iy = py + 19
    for k, name in enumerate(["github-mark.png", "hf-logo.png"]):
        ic = fit(load(name), 10 * K, 10 * K)
        bx, by = (tx + k * 12) * K, iy * K
        pastes.append((ic, (bx + (10 * K - ic.width) // 2, by + (10 * K - ic.height) // 2)))
    text(plates, tx + 26, iy + 2, USERNAME, C.OUT)
    y = py + ph + 10

    # the logos strip
    lh = 30                                                    # each logo's height inside its plate, map px
    rd = next((n for n in RD_NAMES if os.path.exists(os.path.join(MEDIA, n))), None)
    logos = [load("heg-logo.png"), load("sib-logo.png")]
    if rd:
        logos.append(load(rd))
    items = []
    for im in logos:
        f = fit(im, 120 * K, lh * K)
        items.append(("img", f, math.ceil(f.width / K) + 8))
    if not rd and not R.A.no_plate:
        items.append(("empty", None, 84))
    gap = 12
    total = sum(w for _, _, w in items) + gap * (len(items) - 1)
    x = (MW - total) // 2
    for kind, im, w in items:
        if kind == "img":
            plate(x, y, w, lh + 8)
            pastes.append((im, (x * K + (w * K - im.width) // 2, (y + 4) * K + (lh * K - im.height) // 2)))
        else:
            plate(x, y, w, lh + 8, fill=C.WHITE_S, dashed=True)
            from pix import FONT3
            for j, s in enumerate(["RESEARCH DAY", "LOGO"]):     # its file's path is in this script's header
                L_ = Layer("t"); L_.text(0, 0, s, C.OUT, font=FONT3)
                plates.merge(L_, x + (w - (sum(len(FONT3[ch][0]) + 1 for ch in s) - 1)) // 2, y + 10 + j * 9)
        x += w + gap
    print("title: logos HEG, SIB, research day: %s" % (rd or ("EMPTY PLATE" if not R.A.no_plate else "left out")))

    # ---- compose ------------------------------------------------------------------------------
    cv = Image.new("RGBA", (MW, MH), (0, 0, 0, 0))
    for L in [sky, halo, sun, clouds, hz, trees, near, g, shadow, words, sub, plates]:
        Sprite(L).draw(cv)
    still = cv.convert("RGB").resize((W, H), Image.NEAREST)
    for im, at in pastes:
        still.paste(im, at, im)
    still.save(os.path.join(R.OUT, "title.webp"), lossless=True, quality=100, method=6)
    print("title.webp  %6.0f kB" % (os.path.getsize(os.path.join(R.OUT, "title.webp")) / 1024))

    # ---- the tilt: the sky above the map, the camera moving down one screen -------------------
    n = TILT_S * R.FPS
    sa = R.stand_point("1.1")
    sky_arr = np.array(still)
    frames = []
    for i in range(n):
        e = R.smooth(R.ramp(i, 3, n - 1))
        e = e * e * (3 - 2 * e) * 0.5 + e * 0.5                 # a slow start under the title, a soft landing
        o = int(round(H * e / K)) * K                          # on the pixel grid
        mp = np.array(R.to_screen(R.frame(i / R.FPS, sa)))
        fr = np.concatenate([sky_arr[o:], mp[:o]], axis=0) if o else sky_arr.copy()
        frames.append(Image.fromarray(fr))
    R.META["videos"]["title-down"] = R.encode("title-down.mp4", frames)
    R.META["videos"]["title-up"] = R.encode("title-up.mp4", frames[::-1])
    R.META["title"] = {"sky": C.WATER, "logo": rd, "tilt": TILT_S}
