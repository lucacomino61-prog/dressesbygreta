"""Estimate body anchors for garments whose source photograph defeated pose detection.

Measures the cutout's alpha: the bodice top (first opaque rows) gives the bust line and its
width; the shoulders are placed above it and the hips below it using the proportions observed
on the pose-detected garments (shoulder width about 1.1 x bust width, torso length about
0.3 x shoulder-to-floor). `kind` sets how much of the body the cutout covers.

Usage: python tools/manual_anchors.py            (writes raw/anchors.json entries, auto=false)
       python tools/manual_anchors.py --sheet    (also renders raw/_anchors_sheet.jpg for every garment)
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'raw'
CUT = RAW / 'cut'
ANCHORS = RAW / 'anchors.json'

# id -> (cutout stem, kind). kind: 'gown' bust-to-floor, 'midi' bust-to-calf, 'mini' bust-to-thigh,
# 'sleeved-knee' shoulders-to-knee (cape/sleeves reach the top edge).
MANUAL = {
    'dv0iu5mjbce': ('DV0iU5MjbCe_0', 'gown'),
    'dlphhhgtwa': ('DLphhhGtwA-_0', 'gown'),
    'dq6kc7cdal0': ('DQ6kC7cDal0_0', 'midi'),
    'dwyrehpdzty': ('DWyreHpDZtY_0', 'mini'),
    'dwmbtytjbda': ('DWmBTyTjbdA_0', 'sleeved-knee'),
}

# Fraction of the shoulder-to-floor body height that the cutout covers, and where the
# bodice top sits below the shoulder line, per kind.
KIND = {
    'gown': dict(cover=0.86, top_below_shoulder=0.13, sleeved=False),
    'midi': dict(cover=0.62, top_below_shoulder=0.13, sleeved=False),
    'mini': dict(cover=0.45, top_below_shoulder=0.13, sleeved=False),
    'sleeved-knee': dict(cover=0.60, top_below_shoulder=0.0, sleeved=True),
}
TORSO = 0.30          # shoulders to hips, as a fraction of shoulder-to-floor
HIP_W = 0.56          # hip width relative to shoulder width


def bodice(alpha: np.ndarray):
    """Return (center_x, width) of the garment measured 4 percent below its top edge."""
    rows = np.where((alpha > 40).any(axis=1))[0]
    top = int(rows.min())
    h = alpha.shape[0]
    y = min(h - 1, top + int(0.04 * h))
    xs = np.where(alpha[y] > 40)[0]
    if len(xs) < 4:
        y = min(h - 1, top + int(0.1 * h))
        xs = np.where(alpha[y] > 40)[0]
    return (float(xs.min() + xs.max()) / 2, float(xs.max() - xs.min()), top)


def estimate(stem: str, kind: str):
    im = Image.open(CUT / f'{stem}.png')
    a = np.asarray(im.getchannel('A'))
    W, H = im.size
    k = KIND[kind]
    body_h = H / k['cover']                       # shoulder-to-floor in cutout pixels
    cx, bust_w, top = bodice(a)
    if k['sleeved']:
        shoulder_y = top + 0.06 * body_h
        shoulder_w = min(W * 0.9, bust_w * 0.75)   # sleeves and cape widen the top row
    else:
        shoulder_y = top - k['top_below_shoulder'] * body_h
        shoulder_w = bust_w * 1.1
    hip_y = shoulder_y + TORSO * body_h
    hip_w = shoulder_w * HIP_W
    r = lambda v: int(round(v))
    return {
        'shoulderL': {'x': r(cx - shoulder_w / 2), 'y': r(shoulder_y)},
        'shoulderR': {'x': r(cx + shoulder_w / 2), 'y': r(shoulder_y)},
        'hipL': {'x': r(cx - hip_w / 2), 'y': r(hip_y)},
        'hipR': {'x': r(cx + hip_w / 2), 'y': r(hip_y)},
    }


def sheet(anchors: dict, catalog: dict):
    items = [i for i in catalog['items'] if i.get('cutout')]
    tw, th = 260, 420
    cols = 5
    rows = (len(items) + cols - 1) // cols
    out = Image.new('RGB', (cols * tw, rows * (th + 20)), (22, 23, 27))
    d = ImageDraw.Draw(out)
    for n, it in enumerate(items):
        p = ROOT / 'public' / it['cutout']['src']
        im = Image.open(p).convert('RGBA')
        a = anchors.get(it['id'], {}).get('anchors')
        # leave headroom for shoulders above the cutout
        pad = int(im.height * 0.25)
        canvas = Image.new('RGBA', (im.width, im.height + pad), (22, 23, 27, 255))
        canvas.alpha_composite(im, (0, pad))
        dd = ImageDraw.Draw(canvas)
        if a:
            pts = {k: (v['x'], v['y'] + pad) for k, v in a.items()}
            dd.line([pts['shoulderL'], pts['shoulderR']], fill=(212, 177, 106, 255), width=6)
            dd.line([pts['hipL'], pts['hipR']], fill=(212, 177, 106, 255), width=6)
            for q in pts.values():
                dd.ellipse([q[0] - 9, q[1] - 9, q[0] + 9, q[1] + 9], fill=(237, 231, 218, 255))
        canvas.thumbnail((tw - 10, th - 10))
        x = (n % cols) * tw + (tw - canvas.width) // 2
        y = (n // cols) * (th + 20) + 5
        out.paste(canvas.convert('RGB'), (x, y))
        d.text(((n % cols) * tw + 6, (n // cols) * (th + 20) + th + 2), f"{it['id']} {'auto' if anchors.get(it['id'], {}).get('auto') else 'manual' if a else 'NONE'}", fill=(230, 230, 230))
    out.save(RAW / '_anchors_sheet.jpg', quality=85)
    print('sheet', RAW / '_anchors_sheet.jpg')


def main():
    anchors = json.loads(ANCHORS.read_text(encoding='utf-8')) if ANCHORS.exists() else {}
    for item_id, (stem, kind) in MANUAL.items():
        if anchors.get(item_id, {}).get('auto'):
            continue
        anchors[item_id] = {'anchors': estimate(stem, kind), 'auto': False, 'kind': kind}
        print('manual', item_id, anchors[item_id]['anchors'])
    ANCHORS.write_text(json.dumps(anchors, indent=1), encoding='utf-8')
    if '--sheet' in sys.argv:
        catalog = json.loads((ROOT / 'src' / 'data' / 'catalog.json').read_text(encoding='utf-8'))
        sheet(anchors, catalog)


if __name__ == '__main__':
    main()
