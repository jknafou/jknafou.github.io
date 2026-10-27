"""The two sky scenes: the retro pixel sky above the city map, and the camera tilting between them.

Rendered by make_retro.py (its `title` part), which hands this module itself (its frame(),
encode(), stand_point(), META ...):

    python3 world/talk/make_retro.py --ffmpeg <ffmpeg> --only title

Writes into media/retro/, for each scene <s> of SCENES ("title", "thanks"):
  <s>.webp        the scene as the shell shows it at rest (1920x1080, lossless)
  <s>-down.mp4    the camera tilts down from the sky to the map. Its first frame is <s>.webp, its
                  last is the map with Bert at the scene's building (title: the hospital 1.1;
                  thanks: the station 4.1) on the shared 1 s clock, one frame before
                  idle-<id>'s frame 0 (the walks' rule), so the hand-off to the idle loop is seamless
  <s>-up.mp4      the same frames backwards: from the map up into the sky, ending on <s>.webp

  title    the talk opens on it; -> tilts down to the city at the hospital
  thanks   after 4.1's last slide (-> leaves the slide, closes the station, tilts up into it)

THE TEXT IS HERE, in SCENES below: change a line and re-render. The map's font (pix.FONT5) has
capitals only; the few lower-case letters and signs needed are added in EXTRA.

THE INPUTS are in world/talk/media/title/; SOURCES.md there gives each file's origin.
"""
import math
import os

import numpy as np
from PIL import Image

NAME = "JULIEN KNAFOU"
USERNAME = "jknafou"
TILT_S = 3                     # each tilt's length in seconds: an integer, so it ends on the idle loop's clock
SCENES = {
    "title": {
        "lines": [("FOUND IN TRANSLATION:", 3, "WHITE"), ("AI BEYOND ENGLISH", 3, "YELLOW")],   # (text, pixel scale, colour)
        "sub": "DON'T TRANSLATE THE MODEL - TRANSLATE THE DATA",
        "logos": [("heg-logo.png", "light"), ("sib-logo.png", "light")],
        "at": "1.1", "top": 34,
    },
    "thanks": {
        "lines": [("MERCI", 3, "WHITE"), ("THANK YOU", 4, "YELLOW")],
        "sub": None,
        # the paper, as on the published Hugging Face card: Knafou, J., Mottin, L., Mottaz, A.,
        # Flament, A., Ruch, P. (2025). Findings of the ACL: EMNLP 2025, pp. 19338-19354,
        # doi:10.18653/v1/2025.findings-emnlp.1053
        "cite": {"logo": "emnlp2025-logo.png", "qr": "qr-aclanthology.png",
                 "lines": [("TransBERT: A Framework for Synthetic Translation", "OUT"),
                           ("in Domain-Specific Language Modeling", "OUT"),
                           ("Knafou et al., Findings of EMNLP 2025", "BRICK_D"),
                           ("aclanthology.org/2025.findings-emnlp.1053", "WATER_D")]},
        # HEG and SIB are on the opening; left out here so the closing stays uncluttered
        "logos": [("swiss-ai-center-logo.png", "light"), ("geneva-ai-summit-logo.png", "dark")],
        "at": "4.1", "top": 14,
    },
}

EXTRA = {  # glyphs the map's FONT5 lacks (g p q y hang one row below the line)
    ":": [".", "#", "#", ".", "#", "#", "."],
    ",": [".", ".", ".", ".", ".", "#", "#"],
    "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
    "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
    "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
    "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
    "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
    "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
    "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
    "b": ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
    "c": [".....", ".....", ".####", "#....", "#....", "#....", ".####"],
    "d": ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
    "e": [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
    "g": [".....", ".....", ".####", "#...#", "#...#", ".####", "....#", ".###."],
    "h": ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
    "i": ["#", ".", "#", "#", "#", "#", "#"],
    "l": ["#.", "#.", "#.", "#.", "#.", "#.", ".#"],
    "m": [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
    "p": [".....", ".....", "####.", "#...#", "#...#", "####.", "#....", "#...."],
    "q": [".....", ".....", ".####", "#...#", "#...#", ".####", "....#", "....#"],
    "r": ["....", "....", "#.##", "##..", "#...", "#...", "#..."],
    "s": [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
    "t": [".#..", ".#..", "####", ".#..", ".#..", ".#..", "..##"],
    "v": [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "w": [".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", ".#.#."],
    "x": [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
    "y": [".....", ".....", "#...#", "#...#", "#...#", ".####", "....#", ".###."],
    "z": [".....", ".....", "#####", "...#.", "..#..", ".#...", "#####"],
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
    import terrain
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

    # ---- the sky, shared by both scenes: flat bands joined by dithered rows ----------------
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

    sun = Layer("sun")                                   # the sun, top right, its rays as dithered rings
    sun.ellipse(446, 30, 16, 16, C.YELLOW_L)
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
    for (x, y, w) in [(14, 6, 54), (100, 2, 36), (236, 4, 40), (8, 104, 40), (418, 108, 46), (60, 182, 34), (424, 186, 38)]:
        clouds.merge(cloud(w), x, y)

    hz = Layer("horizon")                                # far hills, a tree line, then the map's grass
    for x in range(MW):
        y = 236 + 6 * math.sin(x / 37.0) + 4 * math.sin(x / 13.0 + 1)
        hz.rect(x, int(y), 1, MH - int(y), C.GRASS_D)
    hz.outline(C.LEAF_D)
    near = Layer("near")
    for x in range(MW):
        y = 250 + 3 * math.sin(x / 21.0 + 2)
        near.rect(x, int(y), 1, MH - int(y), C.GRASS)
    g = terrain.grass(MW, 8, 0, MH - 8)
    trees = Layer("trees")
    for i, x in enumerate(range(-4, MW, 26)):
        trees.merge(props.tree(i % 2), x + (7 if i % 3 == 0 else 0), 232 + (i % 3) * 2)

    def load(name):
        im = Image.open(os.path.join(MEDIA, name)).convert("RGBA")
        a = np.array(im)
        if a[..., 3].min() < 255:
            bb = Image.fromarray(a[..., 3]).getbbox()
        else:                                            # opaque: crop the near-white margin
            bb = Image.fromarray((255 - a[..., :3].min(axis=2) > 12).astype(np.uint8) * 255).getbbox()
        return im.crop(bb) if bb else im

    def fit(im, bw, bh):
        s = min(bw / im.width, bh / im.height)
        return im.resize((max(1, int(round(im.width * s))), max(1, int(round(im.height * s)))), Image.LANCZOS)

    def scene(cfg):
        words, shadow, sub = Layer("title"), Layer("tshadow"), Layer("sub")
        y = cfg["top"]
        for (s, sc, col) in cfg["lines"]:
            x = (MW - tw(s, sc)) // 2
            text(shadow, x + sc, y + sc, s, C.OUT, sc)
            text(words, x, y, s, getattr(C, col), sc)
            y += 7 * sc + 8
        words.outline(C.OUT)
        if cfg["sub"]:
            text(sub, (MW - tw(cfg["sub"])) // 2, y, cfg["sub"], C.WHITE)
            sub.outline(C.OUT)
            y += 7 + 12
        else:
            y += 6

        plates, pastes = Layer("plates"), []           # pastes: (image, screen top left) over the plates

        def plate(x, y, w, h, fill=C.WHITE):
            plates.rect(x + 2, y + 2, w + 2, h + 2, C.WATER_D)               # its offset darker copy
            plates.rect(x - 1, y - 1, w + 2, h + 2, C.OUT)                    # the chunky outline
            plates.rect(x, y, w, h, fill)
            if fill == C.WHITE:
                plates.rect(x, y, w, 1, "#ffffff"); plates.rect(x, y + h - 1, w, 1, C.WHITE_S)

        # the name plate: the photo | NAME over [GH][HF] username
        av = 30
        colw = max(tw(NAME), 10 + 2 + 10 + 4 + tw(USERNAME))
        pw, ph = 4 + av + 6 + colw + 5, av + 8
        px, py = (MW - pw) // 2, y
        plate(px, py, pw, ph)
        plates.rect(px + 3, py + 3, av + 2, av + 2, C.OUT)                   # the photo's own frame
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

        # the citation plate: the conference's logo | the reference | a QR code of its address
        ct = cfg.get("cite")
        if ct:
            lg = fit(load(ct["logo"]), 64 * K, 30 * K)
            lgw = math.ceil(lg.width / K)
            qr = Image.open(os.path.join(MEDIA, ct["qr"])).convert("L")      # 1 module = 1 map pixel
            textw = max(tw(s) for s, _ in ct["lines"])
            chh = len(ct["lines"]) * 7 + (len(ct["lines"]) - 1) * 3
            chh = max(chh, qr.height + 4)
            cw = 5 + lgw + 7 + textw + 7 + qr.width + 5
            cx, cy = (MW - cw) // 2, y
            plate(cx, cy, cw, chh + 8)
            pastes.append((lg, ((cx + 5) * K, (cy + 4) * K + (chh * K - lg.height) // 2)))
            ty = cy + 4 + (chh - (len(ct["lines"]) * 7 + (len(ct["lines"]) - 1) * 3)) // 2
            for s, col in ct["lines"]:
                text(plates, cx + 5 + lgw + 7, ty, s, getattr(C, col)); ty += 10
            qx, qy = cx + cw - 5 - qr.width, cy + 4 + (chh - qr.height) // 2
            q = np.array(qr)
            for j in range(qr.height):
                for i in range(qr.width):
                    if q[j, i] < 128:
                        plates.put(qx + i, qy + j, "#000000")
            y = cy + chh + 8 + 10

        # the logos strip, each on its own plate (a white logo on a dark one)
        lh = 30
        items = []
        for name, tone in cfg["logos"]:
            f = fit(load(name), 120 * K, lh * K)
            items.append((f, math.ceil(f.width / K) + 8, C.WHITE if tone == "light" else C.SKY_BOARD))
        gap = 12
        x = (MW - (sum(w for _, w, _ in items) + gap * (len(items) - 1))) // 2
        for im, w, fill in items:
            plate(x, y, w, lh + 8, fill)
            pastes.append((im, (x * K + (w * K - im.width) // 2, (y + 4) * K + (lh * K - im.height) // 2)))
            x += w + gap

        cv = Image.new("RGBA", (MW, MH), (0, 0, 0, 0))
        for L in [sky, halo, sun, clouds, hz, trees, near, g, shadow, words, sub, plates]:
            Sprite(L).draw(cv)
        still = cv.convert("RGB").resize((W, H), Image.NEAREST)
        for im, at in pastes:
            still.paste(im, at, im)
        return still

    R.META["sky"] = {"sky": C.WATER, "tilt": TILT_S}
    for name, cfg in SCENES.items():
        still = scene(cfg)
        still.save(os.path.join(R.OUT, name + ".webp"), lossless=True, quality=100, method=6)
        print("%s.webp  %6.0f kB" % (name, os.path.getsize(os.path.join(R.OUT, name + ".webp")) / 1024))
        # the tilt: the sky above the map, the camera moving down one screen
        n = TILT_S * R.FPS
        sa = R.stand_point(cfg["at"])
        sky_arr = np.array(still)
        frames = []
        for i in range(n):
            e = R.smooth(R.ramp(i, 3, n - 1))
            e = e * e * (3 - 2 * e) * 0.5 + e * 0.5         # a slow start under the title, a soft landing
            o = int(round(H * e / K)) * K                  # on the pixel grid
            mp = np.array(R.to_screen(R.frame(i / R.FPS, sa)))
            frames.append(Image.fromarray(np.concatenate([sky_arr[o:], mp[:o]], axis=0) if o else sky_arr.copy()))
        R.META["videos"][name + "-down"] = R.encode(name + "-down.mp4", frames)
        R.META["videos"][name + "-up"] = R.encode(name + "-up.mp4", frames[::-1])
