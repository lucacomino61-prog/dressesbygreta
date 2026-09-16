"""
cutout.py: garment-only background removal with rembg's u2net_cloth_seg model.

Turns a JPG/PNG of a person wearing clothes into an RGBA PNG that keeps only
the garment(s): skin, hair and background become transparent.

How the mask is built (verified against rembg 2.0.84 source and a probe run):
  - u2net_cloth_seg is a 4-class segmenter (0 background, 1 upper-body cloth,
    2 lower-body cloth, 3 full-body cloth), run at 768x768 and argmaxed.
  - session.predict() returns THREE L-mode masks at input size, in the order
    upper, lower, full.
  - remove(only_mask=True) concatenates them VERTICALLY, so the output is
    (input_width x 3*input_height). This script splits that into bands,
    verifying the band count from the height ratio instead of assuming it.
  - The three bands are unioned with a per-pixel maximum, detached specks
    smaller than 0.1 percent of the image are dropped, the mask is feathered
    with a small Gaussian blur, applied as alpha to the original RGB, then
    cropped to the alpha bounding box with a 2 percent padding.
  - If the union covers less than 0.5 percent of the image (no garment in the
    picture) the file is reported as [fail] and nothing is written.

Usage:
  python cutout.py IN.jpg [OUT.png]            single file (default OUT: IN_cutout.png)
  python cutout.py IN_DIR OUT_DIR              all *.jpg/*.jpeg/*.png in IN_DIR -> OUT_DIR/<stem>.png
  options: --force               reprocess even when the output already exists
           --feather 1.5         Gaussian blur radius in px applied to the union mask (0 disables)
           --pad 0.02            bounding-box padding as a fraction of the box size per side
           --threshold 8         alpha value below which pixels are ignored for the bounding box
           --min-coverage 0.005  fail when the union mask covers less than this fraction
           --min-island 0.001    drop detached components smaller than this fraction (0 disables)
           --debug               also write <out>_mask.png with the raw stacked mask
           --model NAME          rembg session name (default u2net_cloth_seg)

Run with the venv in tools/.venv:
  tools/.venv/Scripts/python.exe tools/cutout.py raw/test.jpg raw/test_cutout.png
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

IMAGE_EXTS = {".jpg", ".jpeg", ".png"}


def load_session(model_name: str):
    from rembg import new_session
    t0 = time.time()
    session = new_session(model_name)
    print(f"[session] {model_name} ready in {time.time() - t0:.1f}s", file=sys.stderr)
    return session


def stacked_mask(img: Image.Image, session) -> Image.Image:
    from rembg import remove
    return remove(img, session=session, only_mask=True).convert("L")


def split_bands(stacked: np.ndarray, in_h: int, in_w: int) -> list[np.ndarray]:
    """Split a vertically stacked mask into bands of the input height.

    Returns a list of (in_h, in_w) uint8 arrays. Raises if the layout is not a
    whole number of input-height bands, so a changed rembg layout fails loudly
    instead of producing a silently wrong alpha.
    """
    h, w = stacked.shape[:2]
    if w != in_w or h % in_h != 0:
        raise RuntimeError(
            f"unexpected mask layout {w}x{h} for input {in_w}x{in_h}; "
            "expected width == input width and height == k * input height"
        )
    n = h // in_h
    return [stacked[i * in_h:(i + 1) * in_h] for i in range(n)]


def drop_small_islands(alpha: np.ndarray, min_frac: float) -> tuple[np.ndarray, int]:
    """Zero out connected components smaller than min_frac of the image area.

    The cloth model leaves occasional detached specks (a hair or hand fragment
    misread as cloth). Anything below the threshold is removed; the garment
    itself is one large component and survives. Returns (alpha, dropped_count).
    """
    from scipy import ndimage
    labels, n = ndimage.label(alpha > 0)
    if n <= 1:
        return alpha, 0
    sizes = np.bincount(labels.ravel())
    min_px = max(1, int(min_frac * alpha.size))
    keep = sizes >= min_px
    keep[0] = False  # label 0 is background
    out = alpha.copy()
    out[~keep[labels]] = 0
    return out, int((~keep[1:]).sum())


def union_alpha(bands: list[np.ndarray], feather: float, min_island: float) -> tuple[Image.Image, int]:
    alpha = np.zeros_like(bands[0])
    for b in bands:
        alpha = np.maximum(alpha, b)
    dropped = 0
    if min_island > 0:
        alpha, dropped = drop_small_islands(alpha, min_island)
    alpha_img = Image.fromarray(alpha, mode="L")
    if feather > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=feather))
    return alpha_img, dropped


def crop_to_alpha(rgba: Image.Image, threshold: int, pad_frac: float) -> Image.Image:
    a = np.asarray(rgba.getchannel("A"))
    ys, xs = np.where(a > threshold)
    if len(xs) == 0:
        raise RuntimeError("empty garment mask: nothing to crop")
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    pad_x = int(round((x1 - x0) * pad_frac))
    pad_y = int(round((y1 - y0) * pad_frac))
    W, H = rgba.size
    box = (max(0, x0 - pad_x), max(0, y0 - pad_y), min(W, x1 + pad_x), min(H, y1 + pad_y))
    out = rgba.crop(box)
    out.info['crop_box'] = box
    return out


def process_one(src: Path, dst: Path, session, feather: float, pad: float,
                threshold: int, min_coverage: float, min_island: float,
                debug: bool) -> dict:
    img = Image.open(src).convert("RGB")
    in_w, in_h = img.size

    t0 = time.time()
    stacked_img = stacked_mask(img, session)
    infer_s = time.time() - t0
    stacked = np.asarray(stacked_img)

    bands = split_bands(stacked, in_h, in_w)
    coverage = [float((b > 0).mean()) for b in bands]

    alpha, dropped = union_alpha(bands, feather, min_island)
    union_cov = float((np.asarray(alpha) > 0).mean())
    if union_cov < min_coverage:
        raise RuntimeError(
            f"no garment detected: union mask covers {union_cov * 100:.2f}% of the image "
            f"(min {min_coverage * 100:.2f}%); not writing {dst.name}"
        )
    rgba = img.copy()
    rgba.putalpha(alpha)
    out = crop_to_alpha(rgba, threshold, pad)

    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, "PNG", optimize=True)
    import json
    box = out.info.get('crop_box')
    if box:
        dst.with_suffix('.json').write_text(json.dumps({'source': src.name, 'source_size': [in_w, in_h], 'box': list(box), 'size': list(out.size)}), encoding='utf-8')
    if debug:
        stacked_img.save(dst.with_name(dst.stem + "_mask.png"))

    return {
        "input": f"{in_w}x{in_h}",
        "mask": f"{stacked.shape[1]}x{stacked.shape[0]}",
        "bands": len(bands),
        "coverage": coverage,
        "union_coverage": union_cov,
        "islands_dropped": dropped,
        "output": f"{out.size[0]}x{out.size[1]}",
        "infer_s": infer_s,
    }


OUTPUT_SUFFIXES = ("_cutout", "_mask")  # this script's own outputs, never inputs


def collect_inputs(inp: Path) -> list[Path]:
    if inp.is_file():
        return [inp]
    return [p for p in sorted(inp.iterdir())
            if p.is_file() and p.suffix.lower() in IMAGE_EXTS
            and not p.stem.lower().endswith(OUTPUT_SUFFIXES)]


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", type=Path, help="image file or directory")
    ap.add_argument("output", type=Path, nargs="?",
                    help="output PNG (file mode) or output directory (dir mode)")
    ap.add_argument("--force", action="store_true", help="reprocess even if the output exists")
    ap.add_argument("--feather", type=float, default=1.5,
                    help="Gaussian blur radius in px for the alpha edge (default 1.5)")
    ap.add_argument("--pad", type=float, default=0.02,
                    help="bbox padding fraction per side (default 0.02)")
    ap.add_argument("--threshold", type=int, default=8,
                    help="alpha threshold for the bbox (default 8)")
    ap.add_argument("--min-coverage", type=float, default=0.005,
                    help="fail (and write nothing) if the union mask covers less than this "
                         "fraction of the image (default 0.005 = 0.5%%)")
    ap.add_argument("--min-island", type=float, default=0.001,
                    help="drop detached mask components smaller than this fraction of the "
                         "image area (default 0.001 = 0.1%%; 0 disables)")
    ap.add_argument("--debug", action="store_true",
                    help="also write the raw stacked mask next to each output")
    ap.add_argument("--model", default="u2net_cloth_seg",
                    help="rembg session name (default u2net_cloth_seg)")
    args = ap.parse_args(argv)

    inp: Path = args.input
    if not inp.exists():
        print(f"error: {inp} does not exist", file=sys.stderr)
        return 2

    if inp.is_dir():
        out_dir = args.output or (inp / "cutouts")
        jobs = [(p, out_dir / (p.stem + ".png")) for p in collect_inputs(inp)]
    else:
        out = args.output or inp.with_name(inp.stem + "_cutout.png")
        jobs = [(inp, out)]

    if not jobs:
        print("no jpg/png inputs found", file=sys.stderr)
        return 1

    todo = [(s, d) for s, d in jobs if args.force or not d.exists()]
    skipped = len(jobs) - len(todo)
    if skipped:
        print(f"[skip] {skipped} already done", file=sys.stderr)
    if not todo:
        return 0

    session = load_session(args.model)
    failures = 0
    for src, dst in todo:
        try:
            info = process_one(src, dst, session, args.feather, args.pad,
                               args.threshold, args.min_coverage, args.min_island,
                               args.debug)
            cov = " ".join(f"{c * 100:.1f}%" for c in info["coverage"])
            print(f"[ok] {src.name} -> {dst}  in={info['input']} mask={info['mask']} "
                  f"bands={info['bands']} cov=[{cov}] union={info['union_coverage'] * 100:.1f}% "
                  f"islands_dropped={info['islands_dropped']} out={info['output']} "
                  f"({info['infer_s']:.1f}s)")
        except Exception as e:  # keep going in batch mode
            failures += 1
            print(f"[fail] {src.name}: {type(e).__name__}: {e}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
