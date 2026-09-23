"""
Import the Instagram catalogue (src/data/catalog.json + public/dresses/*.jpg) into the shop through
the admin API of a running dev server, exactly as the admin page would: every photograph is resized
to WebP widths plus a tiny blurred stand-in, then uploaded.

  uv run --with pillow python tools/seed.py            # 39 dresses as DRAFTS: no price, no stock
  uv run --with pillow python tools/seed.py --demo     # local testing only: invented prices and stock, published

--demo values are made up so checkout can be exercised on the development machine. They are not
Greta's prices and must never be copied to the live shop; the live shop starts from the drafts.
Sign-in uses the dev login, which only exists on localhost in a Vite dev build.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import sys
import urllib.request
import uuid
from http.cookiejar import CookieJar
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WIDTHS = (480, 960, 1600)
SIZES = ("34", "36", "38", "40", "42")


class Api:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))

    def call(self, method: str, path: str, body: bytes | None = None, ctype: str | None = None):
        req = urllib.request.Request(self.base + path, data=body, method=method)
        req.add_header("Origin", self.base)
        if ctype:
            req.add_header("Content-Type", ctype)
        try:
            with self.opener.open(req, timeout=60) as res:
                raw = res.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            raise SystemExit(f"{method} {path} -> {e.code} {e.read()[:300]!r}")

    def json(self, method: str, path: str, data=None):
        return self.call(method, path, json.dumps(data).encode() if data is not None else None, "application/json")


def variants(path: Path) -> tuple[dict, list[tuple[str, bytes]]]:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    widths = sorted({min(x, w) for x in WIDTHS})
    files = []
    for width in widths:
        out = io.BytesIO()
        im.resize((width, round(h * width / w)), Image.LANCZOS).save(out, "WEBP", quality=82, method=5)
        files.append((f"w{width}", out.getvalue()))
    tiny = io.BytesIO()
    im.resize((20, max(1, round(h * 20 / w))), Image.LANCZOS).save(tiny, "WEBP", quality=40)
    lqip = "data:image/webp;base64," + base64.b64encode(tiny.getvalue()).decode()
    return {"w": w, "h": h, "lqip": lqip, "ext": "webp", "widths": widths}, files


def multipart(meta: dict, files: list[tuple[str, bytes]]) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="meta"\r\n\r\n{json.dumps(meta)}\r\n'.encode()]
    for name, data in files:
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{name}.webp"\r\nContent-Type: image/webp\r\n\r\n'.encode()
            + data
            + b"\r\n"
        )
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def demo_values(item: dict) -> tuple[int, dict]:
    """Deterministic invented numbers, so reruns agree. Gowns cost more than minis."""
    seed = int(hashlib.sha1(item["id"].encode()).hexdigest(), 16)
    base, span = (18000, 34) if "gowns" in item["cats"] else (9000, 14)
    price = base + (seed % span) * 500
    stock = {s: (seed >> (i * 3)) % 3 for i, s in enumerate(SIZES)}
    if seed % 9 == 0:
        stock = {s: 0 for s in SIZES}  # a few sold out, to see that state
    elif not any(stock.values()):
        stock[SIZES[seed % 5]] = 1
    return price, stock


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:3640")
    ap.add_argument("--demo", action="store_true", help="invent prices and stock and publish (local testing only)")
    args = ap.parse_args()

    api = Api(args.base)
    api.json("POST", "/api/admin/dev-login")
    existing = {p["instagramUrl"] for p in api.json("GET", "/api/admin/products")}
    catalog = json.loads((ROOT / "src/data/catalog.json").read_text(encoding="utf-8"))
    items = catalog["items"]
    if args.demo:
        print("DEMO MODE: prices and stock below are invented for local testing, not Greta's.", file=sys.stderr)

    made = 0
    # Reverse, because every new product is placed first: the final order matches the feed.
    for item in reversed(items):
        if item["permalink"] in existing:
            continue
        p = api.json("POST", "/api/admin/products", {"nameSq": item["name"]})
        for img in item["images"]:
            meta, files = variants(ROOT / "public" / img["src"])
            body, ctype = multipart(meta, files)
            api.call("POST", f"/api/admin/products/{p['id']}/photos", body, ctype)
        update = {
            "nameEn": item["name"],
            "color": item["color"],
            "categories": item["cats"],
            "featured": bool(item["feature"]),
            "instagramUrl": item["permalink"],
            "status": "draft",
        }
        if args.demo:
            price, stock = demo_values(item)
            update.update({"price": price, "stock": stock, "status": "published"})
        api.json("PUT", f"/api/admin/products/{p['id']}", update)
        made += 1
        print(f"{made:>2}  {item['name']}  ({len(item['images'])} photo{'s' if len(item['images']) > 1 else ''})")
    print(f"done: {made} imported, {len(existing)} already there")


if __name__ == "__main__":
    main()
