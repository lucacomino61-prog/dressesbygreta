/**
 * Dev tool: derive garment anchors (shoulders, hips) in cutout pixel space.
 *
 * For each try-on dress we have the source photograph (a mannequin or model wearing the dress)
 * and the cutout's crop box inside that photograph (raw/cut/<stem>.json). Pose detection runs on
 * the source, the landmarks are shifted by the crop box, and the result is printed as JSON to
 * paste into raw/anchors.json. Nothing here ships to visitors.
 */
import { dresses } from './data/catalog';
import { PoseEngine } from './tryon/pose';
import type { BodyAnchors } from './tryon/compositor';

interface Box {
  source: string;
  source_size: [number, number];
  box: [number, number, number, number];
  size: [number, number];
}

const out = document.getElementById('out')!;
const rows = document.getElementById('rows')!;
const engine = new PoseEngine();

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function draw(img: HTMLImageElement, anchors: BodyAnchors | null, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  if (anchors) {
    ctx.strokeStyle = '#d4b16a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(anchors.shoulderL.x * scale, anchors.shoulderL.y * scale);
    ctx.lineTo(anchors.shoulderR.x * scale, anchors.shoulderR.y * scale);
    ctx.moveTo(anchors.hipL.x * scale, anchors.hipL.y * scale);
    ctx.lineTo(anchors.hipR.x * scale, anchors.hipR.y * scale);
    ctx.stroke();
    ctx.fillStyle = '#ede7da';
    for (const p of [anchors.shoulderL, anchors.shoulderR, anchors.hipL, anchors.hipR]) {
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return c;
}

document.getElementById('run')!.addEventListener('click', async () => {
  out.textContent = 'loading pose model';
  await engine.load();
  const result: Record<string, { anchors: BodyAnchors; auto: boolean }> = {};
  for (const d of dresses.filter((x) => x.tryon)) {
    const file = d.images[0]!.src.split('/').pop()!; // e.g. DIV_ecBtrEH_0.jpg
    const stem = file.replace(/\.jpg$/, '');
    let box: Box;
    try {
      box = (await (await fetch(`/raw-cut/${stem}.json`)).json()) as Box;
    } catch {
      out.textContent += `\nno crop box for ${d.id}`;
      continue;
    }
    const src = await loadImage(`/raw-src/${file}`);
    const cut = await loadImage(`/raw-cut/${stem}.png`);
    // Detect on the source at its natural size (the crop box is in source pixels).
    const c = document.createElement('canvas');
    c.width = src.naturalWidth;
    c.height = src.naturalHeight;
    c.getContext('2d')!.drawImage(src, 0, 0);
    const found = await engine.detectImage(c, c.width, c.height);
    const [bx, by] = box.box;
    let anchors: BodyAnchors | null = null;
    if (found) {
      const sh = (p: { x: number; y: number }) => ({ x: p.x - bx, y: p.y - by });
      anchors = { shoulderL: sh(found.shoulderL), shoulderR: sh(found.shoulderR), hipL: sh(found.hipL), hipR: sh(found.hipR) };
    }
    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(draw(src, found, 320 / src.naturalWidth));
    row.appendChild(draw(cut, anchors, 320 / cut.naturalWidth));
    const info = document.createElement('pre');
    info.textContent = `${d.id} ${d.name}\nsource ${src.naturalWidth}x${src.naturalHeight} cut ${cut.naturalWidth}x${cut.naturalHeight} box ${box.box.join(',')}\n${found ? 'detected' : 'NOT DETECTED'}`;
    row.appendChild(info);
    rows.appendChild(row);
    if (anchors) {
      const r = (p: { x: number; y: number }) => ({ x: Math.round(p.x), y: Math.round(p.y) });
      result[d.id] = { anchors: { shoulderL: r(anchors.shoulderL), shoulderR: r(anchors.shoulderR), hipL: r(anchors.hipL), hipR: r(anchors.hipR) }, auto: true };
    }
  }
  out.textContent = JSON.stringify(result);
  (window as unknown as { __anchors: unknown }).__anchors = result;
});
