import sys, glob, os
from PIL import Image, ImageDraw
files = open(sys.argv[1][1:]).read().split() if sys.argv[1].startswith('@') else sorted([f for f in glob.glob(sys.argv[1]) if not f.endswith('_cutout.png')])
out = sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
tw, th = 220, 300
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 22)), (18, 18, 20))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    try:
        im = Image.open(f).convert('RGB')
    except Exception as e:
        continue
    im.thumbnail((tw - 8, th - 8))
    x = (i % cols) * tw + (tw - im.width) // 2
    y = (i // cols) * (th + 22) + 4
    sheet.paste(im, (x, y))
    d.text(((i % cols) * tw + 6, (i // cols) * (th + 22) + th + 4), f"{i} {os.path.basename(f)[:22]}", fill=(230, 230, 230))
sheet.save(out, quality=82)
print(out, len(files))
