/**
 * Garment compositor: places a garment cutout over a body using pose landmarks.
 *
 * Everything here is pure math on the main thread; no network, no storage. Frames are drawn
 * onto a canvas the caller owns and never leave it.
 */

export interface Pt {
  x: number;
  y: number;
}

/** Body anchors in pixel space of whatever surface they were measured on. */
export interface BodyAnchors {
  shoulderL: Pt;
  shoulderR: Pt;
  hipL: Pt;
  hipR: Pt;
}

/** How the garment cutout sits on the body it was photographed on (cutout pixel space). */
export interface GarmentCalibration {
  anchors: BodyAnchors;
  /** Cutout pixel size. */
  w: number;
  h: number;
}

/** Visitor-controlled nudges applied after the automatic fit. */
export interface ManualAdjust {
  dx: number; // px, in output space
  dy: number;
  scale: number; // multiplier, 1 = automatic fit
}

export interface Placement {
  /** Uniform-ish transform: translate(tx,ty) rotate(rot) scale(sx, sy) applied to the cutout. */
  tx: number;
  ty: number;
  rot: number;
  sx: number;
  sy: number;
}

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * Compute where the garment goes so that its shoulder line lands on the body's shoulder line,
 * its torso length matches the body's torso length, and it tilts with the body.
 */
/** Make "L" mean screen-left on both sides so the pairing survives mirroring and back-turned poses. */
export function bySide(a: BodyAnchors): BodyAnchors {
  const s = a.shoulderL.x <= a.shoulderR.x ? [a.shoulderL, a.shoulderR] : [a.shoulderR, a.shoulderL];
  const h = a.hipL.x <= a.hipR.x ? [a.hipL, a.hipR] : [a.hipR, a.hipL];
  return { shoulderL: s[0]!, shoulderR: s[1]!, hipL: h[0]!, hipR: h[1]! };
}

export function fitGarment(bodyIn: BodyAnchors, garmentIn: GarmentCalibration, adjust: ManualAdjust): Placement {
  const body = bySide(bodyIn);
  const garment: GarmentCalibration = { ...garmentIn, anchors: bySide(garmentIn.anchors) };
  const bodyShoulders = mid(body.shoulderL, body.shoulderR);
  const bodyHips = mid(body.hipL, body.hipR);
  const gShoulders = mid(garment.anchors.shoulderL, garment.anchors.shoulderR);
  const gHips = mid(garment.anchors.hipL, garment.anchors.hipR);

  const bodyWidth = Math.max(dist(body.shoulderL, body.shoulderR), 1);
  const gWidth = Math.max(dist(garment.anchors.shoulderL, garment.anchors.shoulderR), 1);
  const bodyTorso = Math.max(dist(bodyShoulders, bodyHips), 1);
  const gTorso = Math.max(dist(gShoulders, gHips), 1);

  // Width follows the shoulders; height follows the torso, but never lets the garment
  // stretch or squash more than a real fabric would read as.
  const sx = (bodyWidth / gWidth) * adjust.scale;
  const syRaw = (bodyTorso / gTorso) * adjust.scale;
  const sy = clamp(syRaw, sx * 0.82, sx * 1.22);

  const bodyAngle = Math.atan2(body.shoulderR.y - body.shoulderL.y, body.shoulderR.x - body.shoulderL.x);
  const gAngle = Math.atan2(
    garment.anchors.shoulderR.y - garment.anchors.shoulderL.y,
    garment.anchors.shoulderR.x - garment.anchors.shoulderL.x,
  );
  // Fabric hangs with gravity; follow the body tilt only partially so small shoulder
  // asymmetries do not swing a floor-length skirt around.
  const rot = (bodyAngle - gAngle) * 0.6;

  // Translate so the garment's shoulder midpoint lands on the body's shoulder midpoint.
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const gx = gShoulders.x * sx;
  const gy = gShoulders.y * sy;
  const tx = bodyShoulders.x - (gx * cos - gy * sin) + adjust.dx;
  const ty = bodyShoulders.y - (gx * sin + gy * cos) + adjust.dy;
  return { tx, ty, rot, sx, sy };
}

/** Draw the cutout with a placement onto a 2D context; `flip` mirrors the artwork horizontally. */
export function drawGarment(
  ctx: CanvasRenderingContext2D,
  cutout: CanvasImageSource,
  garment: GarmentCalibration,
  p: Placement,
  alpha = 1,
  flip = false,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.tx, p.ty);
  ctx.rotate(p.rot);
  ctx.scale(p.sx, p.sy);
  if (flip) {
    ctx.translate(garment.w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(cutout, 0, 0, garment.w, garment.h);
  ctx.restore();
}

/** A garment as seen in a mirror: anchors flipped inside the cutout box. Pair with drawGarment(flip). */
export function mirrorGarment(g: GarmentCalibration): GarmentCalibration {
  const m = (p: Pt): Pt => ({ x: g.w - p.x, y: p.y });
  const a = g.anchors;
  return { ...g, anchors: { shoulderL: m(a.shoulderR), shoulderR: m(a.shoulderL), hipL: m(a.hipR), hipR: m(a.hipL) } };
}

/** Exponential smoothing of anchors between frames; kills landmark jitter without lag you can see. */
export class AnchorSmoother {
  private prev: BodyAnchors | null = null;
  constructor(private readonly alpha = 0.35) {}

  push(next: BodyAnchors): BodyAnchors {
    if (!this.prev) {
      this.prev = next;
      return next;
    }
    const a = this.alpha;
    const lerp = (p: Pt, n: Pt): Pt => ({ x: p.x + (n.x - p.x) * a, y: p.y + (n.y - p.y) * a });
    this.prev = {
      shoulderL: lerp(this.prev.shoulderL, next.shoulderL),
      shoulderR: lerp(this.prev.shoulderR, next.shoulderR),
      hipL: lerp(this.prev.hipL, next.hipL),
      hipR: lerp(this.prev.hipR, next.hipR),
    };
    return this.prev;
  }

  reset(): void {
    this.prev = null;
  }
}

/** Mirror anchors horizontally inside a frame of width w (selfie view). */
export function mirrorAnchors(a: BodyAnchors, w: number): BodyAnchors {
  const m = (p: Pt): Pt => ({ x: w - p.x, y: p.y });
  // Mirroring swaps left and right so the garment's left strap stays on the visitor's left.
  return { shoulderL: m(a.shoulderR), shoulderR: m(a.shoulderL), hipL: m(a.hipR), hipR: m(a.hipL) };
}

/**
 * When the photograph shows no shoulders (a strapless mannequin shot), the calibration tool
 * falls back to a synthetic shoulder line above the bodice; keep that logic in one place.
 */
export function syntheticAnchorsFromBox(w: number, h: number): BodyAnchors {
  return {
    shoulderL: { x: w * 0.3, y: h * 0.06 },
    shoulderR: { x: w * 0.7, y: h * 0.06 },
    hipL: { x: w * 0.36, y: h * 0.4 },
    hipR: { x: w * 0.64, y: h * 0.4 },
  };
}
