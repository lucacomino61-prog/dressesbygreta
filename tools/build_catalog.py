"""Build the static catalog from the Instagram harvest.

Reads raw/posts.jsonl (harvest) + raw/curation.json (hand curation), writes:
  public/dresses/<file>            resized JPEG, max 1400px tall
  public/dresses/sm/<file>         resized JPEG, max 640px tall (grid / rail)
  public/dresses/cut/<id>.png      copied garment cutouts when raw/cut/<file>.png exists
  src/data/catalog.json            what the site renders

Run: uv run --with pillow python tools/build_catalog.py
"""
import json, os, shutil, sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'raw'
OUT = ROOT / 'raw' / 'instagram' / 'dresses'
(OUT / 'sm').mkdir(parents=True, exist_ok=True)
(OUT / 'cut').mkdir(parents=True, exist_ok=True)

posts = {}
for line in (RAW / 'posts.jsonl').read_text(encoding='utf-8').splitlines():
    if line.strip():
        p = json.loads(line)
        posts[p['code']] = p

cur = json.loads((RAW / 'curation.json').read_text(encoding='utf-8'))
anchors_path = RAW / 'anchors.json'
anchors = json.loads(anchors_path.read_text(encoding='utf-8')) if anchors_path.exists() else {}


def resize(src: Path, dst: Path, max_h: int, quality: int) -> tuple[int, int]:
    im = Image.open(src)
    im = ImageOps.exif_transpose(im).convert('RGB')
    if im.height > max_h:
        w = round(im.width * max_h / im.height)
        im = im.resize((w, max_h), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)
    return im.width, im.height


items = []
assets = {}
seen_ids = {}
for it in cur['items']:
    role = it.get('role')
    if role == 'skip-dup':
        continue
    src = RAW / it['file']
    if not src.exists():
        print('missing', it['file'], file=sys.stderr)
        continue
    w, h = resize(src, OUT / it['file'], 1400, 84)
    sw, sh = resize(src, OUT / 'sm' / it['file'], 640, 80)
    post = posts.get(it['code'], {})
    permalink = f"https://www.instagram.com/{'reel' if post.get('kind') == 'reel' else 'p'}/{it['code']}/"
    if role:
        assets[role] = {'src': f"dresses/{it['file']}", 'sm': f"dresses/sm/{it['file']}", 'w': w, 'h': h, 'alt': it['name'], 'permalink': permalink}
        continue
    base_id = it['code'].lower().replace('_', '').replace('-', '')
    if it.get('alt'):
        # attach as extra image of the previous item with the same code
        for prev in items:
            if prev['code'] == it['code']:
                prev['images'].append({'src': f"dresses/{it['file']}", 'sm': f"dresses/sm/{it['file']}", 'w': w, 'h': h})
                break
        continue
    n = seen_ids.get(base_id, 0)
    seen_ids[base_id] = n + 1
    item_id = base_id if n == 0 else f'{base_id}{n}'
    cut_src = RAW / 'cut' / (Path(it['file']).stem + '.png')
    cutout = None
    if it.get('tryon') and cut_src.exists():
        dst = OUT / 'cut' / f'{item_id}.png'
        shutil.copyfile(cut_src, dst)
        ci = Image.open(dst)
        cutout = {'src': f'dresses/cut/{item_id}.png', 'w': ci.width, 'h': ci.height}
        a = anchors.get(item_id)
        if a and a.get('anchors'):
            cutout['anchors'] = a['anchors']
    caption = (post.get('cap') or '').split('\n')[0].strip()
    if caption and caption[0] == '#':
        caption = ''
    items.append({
        'id': item_id,
        'code': it['code'],
        'name': it['name'],
        'color': it.get('color', ''),
        'cats': it.get('cats', []),
        'feature': bool(it.get('feature')),
        'tryon': bool(it.get('tryon')),
        'cutout': cutout,
        'caption': caption,
        'permalink': permalink,
        'images': [{'src': f"dresses/{it['file']}", 'sm': f"dresses/sm/{it['file']}", 'w': w, 'h': h}],
    })

out = {'generatedFrom': '@dressesbygreta', 'count': len(items), 'assets': assets, 'items': items}
(ROOT / 'src' / 'data').mkdir(parents=True, exist_ok=True)
(ROOT / 'src' / 'data' / 'catalog.json').write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print('items', len(items), 'with cutout', sum(1 for i in items if i['cutout']), 'assets', list(assets))
