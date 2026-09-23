"""
One-off production import: the 39 Instagram dresses go into the LIVE database as drafts (no price,
no stock, not visible), their photographs into the live PHOTOS KV namespace, exactly in the shapes the admin
would produce. Greta then sets prices and sizes in /admin and publishes each dress.

  uv run --with pillow python tools/import-remote.py            # dry run: prepares files, uploads nothing
  uv run --with pillow python tools/import-remote.py --go       # uploads photos, then inserts the rows

Nothing here invents a price, a size or a stock count. Refuses to run if the live catalogue is not empty.
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import re
import subprocess
import sys
import tempfile
import unicodedata
import uuid
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BINDING = "PHOTOS"
WIDTHS = (480, 960, 1600)
SIZES = ("34", "36", "38", "40", "42")


def run(cmd: str) -> str:
    res = subprocess.run(cmd, shell=True, cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    if res.returncode != 0:
        raise SystemExit(f"failed: {cmd}\n{res.stdout[-800:]}\n{res.stderr[-800:]}")
    return res.stdout


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFD", name)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60] or "fustan"


def q(v) -> str:
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def variants(path: Path, out: Path, key: str) -> tuple[dict, list[tuple[Path, str]]]:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    widths = sorted({min(x, w) for x in WIDTHS})
    files = []
    for width in widths:
        f = out / f"{key.replace('/', '_')}_{width}.webp"
        im.resize((width, round(h * width / w)), Image.LANCZOS).save(f, "WEBP", quality=82, method=5)
        files.append((f, f"{key}/{width}.webp"))
    tiny = io.BytesIO()
    im.resize((20, max(1, round(h * 20 / w))), Image.LANCZOS).save(tiny, "WEBP", quality=40)
    lqip = "data:image/webp;base64," + base64.b64encode(tiny.getvalue()).decode()
    return {"w": w, "h": h, "lqip": lqip, "widths": widths}, files


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--go", action="store_true", help="really upload and insert")
    args = ap.parse_args()

    count = json.loads(run('npx wrangler d1 execute greta --remote --json --command "SELECT COUNT(*) AS n FROM products"'))
    if count[0]["results"][0]["n"] != 0:
        raise SystemExit("the live catalogue is not empty: nothing imported")

    catalog = json.loads((ROOT / "src/data/catalog.json").read_text(encoding="utf-8"))
    tmp = Path(tempfile.mkdtemp(prefix="greta-import-"))
    sql: list[str] = []
    uploads: list[tuple[Path, str]] = []
    taken: set[str] = set()
    for sort, item in enumerate(catalog["items"]):
        pid = str(uuid.uuid4())
        base = slugify(item["name"])
        slug, n = base, 2
        while slug in taken:
            slug, n = f"{base}-{n}", n + 1
        taken.add(slug)
        sql.append(
            "INSERT INTO products (id, slug, name_sq, name_en, color, categories, status, featured, instagram_url, sort) VALUES "
            f"({q(pid)}, {q(slug)}, {q(item['name'])}, {q(item['name'])}, {q(item['color'])}, {q(json.dumps(item['cats']))}, 'draft', "
            f"{1 if item['feature'] else 0}, {q(item['permalink'])}, {sort});"
        )
        sql += [f"INSERT INTO product_sizes (product_id, size, stock) VALUES ({q(pid)}, {q(s)}, 0);" for s in SIZES]
        for i, img in enumerate(item["images"]):
            iid = str(uuid.uuid4())
            key = f"p/{pid}/{iid}"
            meta, files = variants(ROOT / "raw" / "instagram" / img["src"], tmp, key)
            uploads += files
            sql.append(
                "INSERT INTO product_images (id, product_id, key, ext, widths, w, h, lqip, alt_sq, alt_en, sort) VALUES "
                f"({q(iid)}, {q(pid)}, {q(key)}, 'webp', {q(json.dumps(meta['widths']))}, {meta['w']}, {meta['h']}, {q(meta['lqip'])}, '', '', {i});"
            )
    sql_file = tmp / "import.sql"
    sql_file.write_text("\n".join(sql) + "\n", encoding="utf-8")
    print(f"prepared {len(catalog['items'])} dresses, {len(uploads)} photo files, {len(sql)} statements in {tmp}")
    if not args.go:
        print("dry run: pass --go to upload and insert")
        return

    # One bulk write to the PHOTOS namespace (values base64, content type in the metadata).
    bulk = tmp / "photos.json"
    bulk.write_text(
        json.dumps([{"key": key, "value": base64.b64encode(f.read_bytes()).decode(), "base64": True, "metadata": {"ct": "image/webp"}} for f, key in uploads]),
        encoding="utf-8",
    )
    run(f'npx wrangler kv bulk put "{bulk}" --binding {BINDING} --remote')
    print(f"uploaded {len(uploads)} photo files", flush=True)
    run(f'npx wrangler d1 execute greta --remote --file "{sql_file}" --yes')
    print("inserted: all dresses are drafts; Greta publishes them from /admin once priced")


if __name__ == "__main__":
    sys.exit(main())
