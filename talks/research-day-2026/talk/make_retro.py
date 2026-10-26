#!/usr/bin/env python3
"""The retro world's videos: the overworld map of world/concepts/drafts/retro-city/, animated.

    node world/talk/retro_capture.mjs                  (the island views, once; see its header)
    python3 world/talk/make_retro.py --ffmpeg <ffmpeg> [--out world/talk/media/retro]
                                     [--islands <dir of island-<id>.png>] [--only idle,walk,open]

Needs Pillow and numpy (the scratch venv: pip install pillow numpy imageio-ffmpeg; the
ffmpeg is `python -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"`).

Writes, at 1920x1080 and 30 fps (the map is 480x270 pixels, 4 screen pixels each):
  idle-<id>.mp4           2 s loop: Bert standing at building <id>, smoke rising, the rim flags waving
  walk-<a>-<b>.mp4        Bert walking the dirt road from <a>'s door to <b>'s (2 or 3 s), and back
  open-<id>.mp4           the roof flies off, the walls fall and slide away, the camera dives into the
                          floor and the island grows out of it: the LAST frame is the island view as the
                          shell shows it (islands/island-<id>.png, see retro_capture.mjs)
  close-<id>.mp4          open-<id> backwards
  idle-<id>.webp          the idle loop's frame 0, the poster (and the picture for ?reduced=1)
  backdrop-<id>.webp      the room inside building <id> (backdrops.py), the card's frame drawn round the
                          card's place and the card's place left as paper: the shell shows it behind the
                          island's card at every level of that island (2.1 uses 2.2's, the factory)
  retro.json              the map's size, each building's box and door, each video's length, each
                          backdrop's edge colour (the view is filled with it beyond the picture)

⚠️ THE HAND-OFFS ARE BY CONSTRUCTION, NOT BY LUCK. Every video is rendered on one clock: the smoke,
the flags and Bert's breath have a period of 1 s, so a video an integer number of seconds long
ends one frame before the idle loop's frame 0 (a walk ends where the destination's idle loop
begins); an opening starts on its idle loop's frame 0 and ends on the island picture, and the
closing is the same frames reversed. The island picture is captured from the shell itself
(retro_capture.mjs, ?chrome=0 at 1920x1080, the loop paused at its frame 0), so the shell can
put the island view under the video's last frame and nothing moves.
"""
import argparse
import json
import math
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument("--ffmpeg", required=True)
ap.add_argument("--deck", default=os.path.normpath(os.path.join(HERE, "..", "..")))
ap.add_argument("--out", default=None)
ap.add_argument("--islands", default=None)
ap.add_argument("--only", default="backdrop,idle,walk,open")
ap.add_argument("--crf", default="20")
A = ap.parse_args()
OUT = A.out or os.path.join(A.deck, "world", "talk", "media", "retro")
ISLANDS_DIR = A.islands or os.path.join(tempfile.gettempdir(), "retro-islands")   # retro_capture.mjs writes them there
os.makedirs(OUT, exist_ok=True)
sys.path.insert(0, os.path.join(A.deck, "world", "concepts", "drafts", "retro-city"))

import stadium  # noqa: E402
stadium.DRAW_FLAGS = False          # drawn here, waving
import mapview, avatar, props, palette as C  # noqa: E402
from pix import Layer  # noqa: E402

FPS, MW, MH, K = 30, 480, 270, 4
W, H = MW * K, MH * K
IDS = ["1.1", "2.2", "3.1", "4.1"]
CARD = (268.8, 21.6, 1382.4, 1036.8)     # the shell's cardBox() in a 1920x1080 view: the island's 4:3 card
PERIOD = 1.0                              # the smoke's, the flags' and Bert's breath


# ---- pixels to images ---------------------------------------------------------
def rgba(c, a=255):
    c = c.lstrip("#")
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)


class Sprite:
    """a Layer as an RGBA image and the map position of its top left"""
    def __init__(self, layer, dx=0, dy=0):
        if not layer.px:
            self.img, self.x, self.y = None, 0, 0
            return
        x0, y0, x1, y1 = layer.bbox()
        arr = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        for (x, y), c in layer.px.items():
            arr[y - y0, x - x0] = rgba(c)
        self.img, self.x, self.y = Image.fromarray(arr, "RGBA"), x0 + dx, y0 + dy

    def draw(self, canvas, ox=0, oy=0, alpha=1.0):
        if self.img is None or alpha <= 0:
            return
        im = self.img
        if alpha < 1:
            a = np.array(im); a[..., 3] = (a[..., 3] * alpha).astype(np.uint8); im = Image.fromarray(a, "RGBA")
        canvas.alpha_composite(im, (int(round(self.x + ox)), int(round(self.y + oy))))


def layer_of(layer, dx, dy):
    m = Layer(layer.name); m.merge(layer, dx, dy); return m


# ---- the scene ------------------------------------------------------------------
SC = mapview.scene()
base = Image.new("RGBA", (MW, MH), rgba(C.GRASS))
import terrain  # noqa: E402
for l in [terrain.grass(MW, MH, 0, 0)] + SC["ground"]:
    Sprite(l).draw(base)

BUILD = {}      # id -> {"layers": [(name, Sprite)], "floor": box, "box": box}
for bid, (b, dx, dy) in zip(IDS, SC["buildings"]):
    ls = []
    for l in b.layers():
        if not l.px or l.name in ("ground", "smoke"):
            continue
        ls.append((l.name, Sprite(l, dx, dy)))
    fl = b.L["floor"].bbox()
    allb = [s for _, s in ls if s.img is not None]
    box = (min(s.x for s in allb), min(s.y for s in allb),
           max(s.x + s.img.width for s in allb), max(s.y + s.img.height for s in allb))
    BUILD[bid] = {"b": b, "dx": dx, "dy": dy, "layers": ls, "floor": (fl[0] + dx, fl[1] + dy, fl[2] + dx, fl[3] + dy), "box": box}

# smoke sources (map pixels): the factory's two chimneys, the locomotive's
fb, fdx, fdy = SC["buildings"][1]
SMOKE = []
for (X, h) in ((12, 40), (26, 32)):
    px, py = fb.P(X, fb.D - 4, fb.H)
    SMOKE.append(("2.2", int(px) + fdx + 3, int(py) - h - 2 + fdy))
nb, ndx, ndy = SC["buildings"][3]
SMOKE.append(("4.1", nb.ox + nb.W + 12 + 46 + 90 + 6 + ndx, nb.gy - 9 - 4 + ndy))
PUFFS = {}
for r in range(1, 8):
    L_ = Layer("puff"); L_.ellipse(r + 1, r + 1, r + 0.6, r, C.SMOKE_D); L_.ellipse(r + 0.6, r + 0.5, r, r - 0.6, C.SMOKE)
    PUFFS[r] = Sprite(L_)

# the stadium's rim flags, waving: two shapes, a quarter period apart
sb, sdx, sdy = SC["buildings"][2]
FLAGS = [(x + sdx, y + sdy, code) for (x, y, code) in stadium.rim_flags()]


def wavy_flag(code, phase):
    f = props.lang_flag(code, 9)
    if phase == 0:
        return Sprite(f)
    m = Layer("flag")
    for (x, y), c in f.px.items():
        dy = 0
        if x >= 2:
            dy = int(round(math.sin(phase * math.pi / 2 + x * 0.9)))
            if (x, y) in f.px and y >= 9:
                dy = 0
        m.px[(x, y + dy)] = c
    return Sprite(m)


FLAG_SPR = {code: [wavy_flag(code, p) for p in range(4)] for code in set(c for _, _, c in FLAGS)}

# Bert
FRONT = Sprite(avatar.front("A"))
FRONT_UP = None
SIDE = [Sprite(avatar.side("A", f)) for f in range(4)]
SIDE_L = [Sprite(props.mirror(avatar.side("A", f))) for f in range(4)]
SHADOW = Sprite((lambda L_: (L_.ellipse(6, 2, 6, 2, C.SHADOW), L_)[1])(Layer("sh")))


def bert(canvas, x, y, sprite, ox=0, oy=0):
    """feet (bottom centre) at map point (x, y)"""
    SHADOW.img and canvas.alpha_composite(SHADOW.img, (int(round(x - 6 + ox)), int(round(y - 2 + oy))))
    im = sprite.img
    canvas.alpha_composite(im, (int(round(x - im.width / 2 + ox)), int(round(y - im.height + 1 + oy))))


STAND = {"1.1": (0, 15), "2.2": (0, 14), "3.1": (30, 5), "4.1": (0, 16)}   # in front of each door, clear of it


def stand_point(bid):
    d = SC["doors"][IDS.index(bid)]
    return (d[0] + STAND[bid][0], d[1] + STAND[bid][1])


# ---- one frame of the map at time t ------------------------------------------------
def frame(t, bert_at=None, bert_sprite=None, moving=None, lift_bert=0):
    """moving: (building id, {layer: (dx, dy, alpha)}) for an opening"""
    cv = base.copy()
    ph = (t % PERIOD) / PERIOD
    for bid in IDS:
        B = BUILD[bid]
        mv = moving[1] if moving and moving[0] == bid else {}
        for name, s in B["layers"]:
            dx, dy, a = mv.get(name, (0, 0, 1))
            s.draw(cv, dx, dy, a)
            if bid == "3.1" and name == "back":
                for (x, y, code) in FLAGS:
                    q = int(ph * 4 + x * 0.13) % 4
                    FLAG_SPR[code][q].draw(cv, x + dx, y + dy, a)
    for (bid, sx, sy) in SMOKE:
        mv = moving[1] if moving and moving[0] == bid else {}
        dx, dy, a = mv.get("roof", (0, 0, 1)) if bid == "2.2" else (0, 0, 1)
        for k in range(4):
            p = (ph + k / 4) % 1
            r = 1 + int(p * 5)
            al = a * min(1, p * 6) * (1 - p) ** 0.7
            PUFFS[r].draw(cv, sx + p * 14 - r - 1 + dx - PUFFS[r].x, sy - p * 30 - r - 1 + dy - PUFFS[r].y, al)
    if bert_at:
        breath = 0 if ph < 0.5 else -1 if bert_sprite is None else 0
        bert(cv, bert_at[0], bert_at[1] + breath, bert_sprite or FRONT)
    return cv


def to_screen(cv):
    return cv.convert("RGB").resize((W, H), Image.NEAREST)


# ---- encoding ---------------------------------------------------------------------------
def encode(name, frames):
    path = os.path.join(OUT, name)
    p = subprocess.Popen([A.ffmpeg, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H),
                          "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-tune", "animation",
                          "-crf", A.crf, "-pix_fmt", "yuv420p", "-g", "15", "-movflags", "+faststart", path], stdin=subprocess.PIPE)
    n = 0
    for im in frames:
        p.stdin.write(im.tobytes()); n += 1
    p.stdin.close(); p.wait()
    print("%-22s %3d frames  %6.0f kB" % (name, n, os.path.getsize(path) / 1024))
    return n


META = {"map": [MW, MH], "fps": FPS, "card": CARD, "buildings": {}, "videos": {}}
for bid in IDS:
    B = BUILD[bid]
    META["buildings"][bid] = {"box": B["box"], "floor": B["floor"], "stand": stand_point(bid)}

ONLY = A.only.split(",")


# ---- the rooms behind the cards ------------------------------------------------------------
import backdrops  # noqa: E402
from PIL import ImageDraw  # noqa: E402


def backdrop(bid):
    room = Image.new("RGBA", (MW, MH), (0, 0, 0, 0))
    Sprite(backdrops.ROOMS[bid]()).draw(room)
    im = room.convert("RGB").resize((W, H), Image.NEAREST)
    fr, fr_l, sh = backdrops.FRAMES[bid]
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = CARD[0], CARD[1], CARD[0] + CARD[2], CARD[1] + CARD[3]
    f, o, s = 12, 4, 8
    d.rectangle([x0 - f - o + s, y0 - f - o + s, x1 + f + o + s - 1, y1 + f + o + s - 1], fill=rgba(sh)[:3])   # its offset darker copy
    d.rectangle([x0 - f - o, y0 - f - o, x1 + f + o - 1, y1 + f + o - 1], fill=rgba(C.OUT)[:3])               # the chunky outline
    d.rectangle([x0 - f, y0 - f, x1 + f - 1, y1 + f - 1], fill=rgba(fr)[:3])                               # the frame
    d.rectangle([x0 - f, y0 - f, x1 + f - 1, y0 - f + 3], fill=rgba(fr_l)[:3])                            # its lit top edge
    d.rectangle([x0 - f, y0 - f, x0 - f + 3, y1 + f - 1], fill=rgba(fr_l)[:3])                            # and left edge
    d.rectangle([x0 - 2, y0 - 2, x1 + 1, y1 + 1], fill=rgba(C.OUT)[:3])                                    # the card's own edge
    d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=(245, 243, 239))                                             # the card's place
    return im


if "backdrop" in ONLY:
    for bid in IDS:
        im = backdrop(bid)
        im.save(os.path.join(OUT, "backdrop-%s.webp" % bid), lossless=True, quality=100, method=6)
        edge = np.array(im)[:, :8].reshape(-1, 3).mean(axis=0)
        META.setdefault("backdrops", {})[bid] = "rgb(%d,%d,%d)" % tuple(int(v) for v in edge)
        print("backdrop-%s.webp  %6.0f kB" % (bid, os.path.getsize(os.path.join(OUT, "backdrop-%s.webp" % bid)) / 1024))

# ---- idle loops ---------------------------------------------------------------------------
if "idle" in ONLY:
    for bid in IDS:
        fr = [to_screen(frame(i / FPS, stand_point(bid))) for i in range(2 * FPS)]
        fr[0].save(os.path.join(OUT, "idle-%s.webp" % bid), quality=90)
        META["videos"]["idle-" + bid] = encode("idle-%s.mp4" % bid, fr)


def ease_in(x):
    x = min(1, max(0, x)); return x * x


def smooth(x):
    x = min(1, max(0, x)); return x * x * (3 - 2 * x)


def ramp(x, a, b):
    return min(1, max(0, (x - a) / (b - a)))



# ---- walks ----------------------------------------------------------------------------------
def path_index(pt):
    P = SC["path"]
    return min(range(len(P)), key=lambda i: (P[i][0] - pt[0]) ** 2 + (P[i][1] - pt[1]) ** 2)


def walk_frames(a, b):
    P = SC["path"]
    ia, ib = path_index(SC["doors"][IDS.index(a)]), path_index(SC["doors"][IDS.index(b)])
    seg = P[ia:ib + 1] if ia < ib else P[ib:ia + 1][::-1]
    # arc length
    acc = [0.0]
    for p, q in zip(seg, seg[1:]):
        acc.append(acc[-1] + math.hypot(q[0] - p[0], q[1] - p[1]))
    Ltot = acc[-1]
    T = 2 if Ltot < 260 else 3
    n = T * FPS
    hold = 4                                           # frames standing at each end, turning
    sa, sb_ = stand_point(a), stand_point(b)
    out, facing = [], 1
    j = 0
    for i in range(n):
        t = i / FPS
        if i < hold:
            out.append(to_screen(frame(t, sa))); continue
        if i >= n - hold:
            out.append(to_screen(frame(t, sb_))); continue
        u = (i - hold) / (n - 2 * hold - 1)
        u = u * u * (3 - 2 * u) * 0.35 + u * 0.65           # a gentle start and stop
        d = u * Ltot
        while j + 1 < len(acc) - 1 and acc[j + 1] < d:
            j += 1
        while j > 0 and acc[j] > d:
            j -= 1
        f = (d - acc[j]) / max(1e-6, acc[j + 1] - acc[j]) if j + 1 < len(acc) else 0
        x = seg[j][0] + (seg[min(j + 1, len(seg) - 1)][0] - seg[j][0]) * f
        y = seg[j][1] + (seg[min(j + 1, len(seg) - 1)][1] - seg[j][1]) * f
        # facing from a short look-ahead
        k2 = min(len(seg) - 1, j + 12)
        vx, vy = seg[k2][0] - x, seg[k2][1] - y
        if abs(vx) > 0.4 * abs(vy) + 0.3:
            facing = 1 if vx > 0 else -1
        # end points: blend the road's centre into the stand points
        e0 = smooth(max(0.0, 1 - d / 28)); e1 = smooth(max(0.0, 1 - (Ltot - d) / 28))
        x += (sa[0] - seg[0][0]) * e0 + (sb_[0] - seg[-1][0]) * e1
        y += (sa[1] - seg[0][1]) * e0 + (sb_[1] - seg[-1][1]) * e1
        cyc = ((i - hold) // 4) % 4
        spr = (SIDE if facing > 0 else SIDE_L)[cyc]
        out.append(to_screen(frame(t, (x, y + 1), spr)))
    return out


if "walk" in ONLY:
    for a, b in zip(IDS, IDS[1:]):
        for (p, q) in ((a, b), (b, a)):
            META["videos"]["walk-%s-%s" % (p, q)] = encode("walk-%s-%s.mp4" % (p, q), walk_frames(p, q))


# ---- openings ----------------------------------------------------------------------------------
def opening_frames(bid):
    shot = Image.open(os.path.join(ISLANDS_DIR, "island-%s.png" % bid)).convert("RGB")
    assert shot.size == (W, H), shot.size
    cx0, cy0, cx1, cy1 = int(math.floor(CARD[0])), int(math.floor(CARD[1])), int(math.ceil(CARD[0] + CARD[2])), int(math.ceil(CARD[1] + CARD[3]))
    card_img = shot.crop((cx0, cy0, cx1, cy1))
    margin = shot.convert("RGBA")
    m = np.array(margin); m[cy0:cy1, cx0:cx1, 3] = 0; margin = Image.fromarray(m)
    B = BUILD[bid]
    fx0, fy0, fx1, fy1 = B["floor"]
    fc = ((fx0 + fx1) / 2, (fy0 + fy1) / 2)
    fw, fh = fx1 - fx0, fy1 - fy0
    s0, s1 = float(K), (cx1 - cx0) / fw
    C0 = (W / 2, H / 2)
    p0 = (C0[0] + s0 * (fc[0] - MW / 2), C0[1] + s0 * (fc[1] - MH / 2))
    pc = ((cx0 + cx1) / 2, (cy0 + cy1) / 2)
    T = 2.4
    n = int(T * FPS)
    tz0 = 0.8
    sa = stand_point(bid)
    out = []
    Hh = B["b"].H if hasattr(B["b"], "H") else 20
    for i in range(n):
        t = i / FPS
        r = ramp(t, 0.0, 0.7); w = ramp(t, 0.2, 0.9)
        mv = {
            "roof": (0, -150 * ease_in(r), 1 - ramp(t, 0.35, 0.7)),
            "front": (0, 70 * ease_in(w), 1 - ramp(t, 0.45, 0.85)),
            "right": (80 * ease_in(w), 6 * ease_in(w), 1 - ramp(t, 0.45, 0.85)),
            "left": (-80 * ease_in(w), 6 * ease_in(w), 1 - ramp(t, 0.45, 0.85)),
            "back": (0, -60 * ease_in(w), 1 - ramp(t, 0.45, 0.85)),
        }
        cv = frame(t, sa, None, (bid, mv)).convert("RGB")
        e = smooth(ramp(t, tz0, T - 1 / FPS))
        if i == n - 1:
            out.append(shot.copy()); continue
        if e <= 0:
            out.append(cv.resize((W, H), Image.NEAREST)); continue
        s = s0 * (s1 / s0) ** e
        p = (p0[0] + (pc[0] - p0[0]) * e, p0[1] + (pc[1] - p0[1]) * e)
        # screen = p + s * (map - fc)  ->  map = (screen - p) / s + fc
        a_ = 1 / s
        im = cv.transform((W, H), Image.AFFINE, (a_, 0, fc[0] - p[0] * a_, 0, a_, fc[1] - p[1] * a_), Image.NEAREST,
                          fillcolor=rgba(C.GRASS)[:3])
        im = im.convert("RGBA")
        # the island card grows out of the floor
        qw = fw * s
        qh = fh * s + ((cy1 - cy0) - fh * s) * e
        qx, qy = p[0] - qw / 2, p[1] - qh / 2
        a1 = smooth(ramp(e, 0.02, 0.45))
        if a1 > 0:
            ci = card_img if (abs(qw - card_img.width) < 0.5 and abs(qh - card_img.height) < 0.5) else \
                card_img.resize((max(1, int(round(qw))), max(1, int(round(qh)))), Image.BILINEAR)
            ci = ci.convert("RGBA")
            if a1 < 1:
                arr = np.array(ci); arr[..., 3] = int(255 * a1); ci = Image.fromarray(arr)
            im.alpha_composite(ci, (int(round(qx)), int(round(qy))))
        a2 = smooth(ramp(e, 0.5, 0.97))
        if a2 > 0:
            mg = margin
            if a2 < 1:
                arr = np.array(margin); arr[..., 3] = (arr[..., 3].astype(np.float32) * a2).astype(np.uint8); mg = Image.fromarray(arr)
            im.alpha_composite(mg)
        out.append(im.convert("RGB"))
    return out


if "open" in ONLY:
    for bid in IDS:
        fr = opening_frames(bid)
        META["videos"]["open-" + bid] = encode("open-%s.mp4" % bid, fr)
        META["videos"]["close-" + bid] = encode("close-%s.mp4" % bid, fr[::-1])

mp = os.path.join(OUT, "retro.json")
old = json.load(open(mp)) if os.path.exists(mp) else {}
old.update({k: v for k, v in META.items() if k not in ("videos", "backdrops")})
if "backdrops" in META:
    old["backdrops"] = META["backdrops"]
old.setdefault("videos", {}).update(META["videos"])
json.dump(old, open(mp, "w"), indent=1)
print("wrote", mp)
