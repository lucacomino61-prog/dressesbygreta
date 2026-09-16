/**
 * Pose detection wrapper around MediaPipe Tasks Vision.
 *
 * Privacy: the wasm runtime and the model are served from this site's own /public folder, so the
 * try-on makes no third-party request at all. Frames never leave the canvas the visitor sees.
 *
 * Frame loop: this module never calls requestAnimationFrame. The caller drives `detectVideo`
 * from the single gsap.ticker the site already runs (one scheduler per page).
 */
import type { BodyAnchors } from './compositor';

type Landmark = { x: number; y: number; z: number; visibility?: number };
type PoseResult = { landmarks: Landmark[][] };
type PoseLandmarkerLike = {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): PoseResult;
  detect(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): PoseResult;
  setOptions(o: { runningMode: 'IMAGE' | 'VIDEO' }): Promise<void>;
  close(): void;
};

// MediaPipe BlazePose landmark indices.
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;

const WASM_ROOT = `${import.meta.env.BASE_URL}mediapipe`;
const MODEL_URL = `${import.meta.env.BASE_URL}models/pose_landmarker_lite.task`;

export type Delegate = 'GPU' | 'CPU';
export type Progress = (fraction: number) => void;

export class PoseEngine {
  private landmarker: PoseLandmarkerLike | null = null;
  private mode: 'IMAGE' | 'VIDEO' = 'VIDEO';
  private lastTs = -1;
  private modelBytes: Promise<Uint8Array> | null = null;
  private runtime: Promise<typeof import('@mediapipe/tasks-vision')> | null = null;
  private progressListeners = new Set<Progress>();
  delegate: Delegate = 'GPU';

  /** Start fetching the runtime and the model without creating anything yet (pointerdown intent). */
  prefetch(): void {
    this.runtime ??= import('@mediapipe/tasks-vision');
    this.modelBytes ??= this.fetchModel();
  }

  /** Fetch the model with a byte-level progress report so the room's hairline is honest. */
  private async fetchModel(): Promise<Uint8Array> {
    const res = await fetch(MODEL_URL);
    if (!res.ok || !res.body) throw new Error(`model ${res.status}`);
    const total = Number(res.headers.get('content-length')) || 5_800_000;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      const f = Math.min(0.95, received / total);
      this.progressListeners.forEach((p) => p(f));
    }
    const out = new Uint8Array(received);
    let off = 0;
    for (const c of chunks) {
      out.set(c, off);
      off += c.byteLength;
    }
    return out;
  }

  private loading: Promise<void> | null = null;

  /** Loads the runtime lazily (about 6 MB); call when the visitor opens the room, not on page load. */
  load(onProgress?: Progress): Promise<void> {
    if (this.landmarker) {
      onProgress?.(1);
      return Promise.resolve();
    }
    if (onProgress) this.progressListeners.add(onProgress);
    // One in-flight load at a time: the camera and photo paths may both ask for it.
    this.loading ??= this.doLoad().finally(() => {
      this.loading = null;
      if (onProgress) this.progressListeners.delete(onProgress);
    });
    return this.loading.then(() => onProgress?.(1));
  }

  private async doLoad(): Promise<void> {
    try {
      this.prefetch();
      const [{ FilesetResolver, PoseLandmarker }, model] = await Promise.all([this.runtime!, this.modelBytes!]);
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      const create = (delegate: Delegate) =>
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetBuffer: model, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      try {
        this.landmarker = (await create('GPU')) as unknown as PoseLandmarkerLike;
        this.delegate = 'GPU';
      } catch {
        // Some Windows and older Android GPUs refuse the GPU delegate; CPU is slower but works.
        this.landmarker = (await create('CPU')) as unknown as PoseLandmarkerLike;
        this.delegate = 'CPU';
      }
      this.mode = 'VIDEO';
    } catch (e) {
      // A failed fetch or import must not poison later attempts.
      this.modelBytes = null;
      this.runtime = null;
      throw e;
    }
  }

  get ready(): boolean {
    return this.landmarker !== null;
  }

  private async ensureMode(mode: 'IMAGE' | 'VIDEO'): Promise<void> {
    if (!this.landmarker || this.mode === mode) return;
    await this.landmarker.setOptions({ runningMode: mode });
    this.mode = mode;
  }

  /**
   * Detect on a live video frame. Timestamps must increase monotonically; we guard against the
   * same frame being submitted twice, which MediaPipe rejects.
   */
  detectVideo(video: HTMLVideoElement, nowMs: number): BodyAnchors | null {
    if (!this.landmarker || this.mode !== 'VIDEO' || this.rebuilding) return null;
    if (video.readyState < 2 || video.videoWidth === 0) return null;
    const ts = Math.max(Math.floor(nowMs), this.lastTs + 1);
    this.lastTs = ts;
    try {
      const result = this.landmarker.detectForVideo(video, ts);
      return toAnchors(result, video.videoWidth, video.videoHeight);
    } catch (e) {
      // A GPU delegate can pass creation and still fail on its first shader compile.
      if (this.delegate === 'GPU') void this.rebuildOnCpu();
      else console.warn('pose detection failed', e);
      return null;
    }
  }

  private rebuilding = false;

  private async rebuildOnCpu(): Promise<void> {
    if (this.rebuilding) return;
    this.rebuilding = true;
    const old = this.landmarker;
    this.landmarker = null;
    try {
      old?.close();
      const [{ FilesetResolver, PoseLandmarker }, model] = await Promise.all([this.runtime!, this.modelBytes!]);
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      this.landmarker = (await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetBuffer: model, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })) as unknown as PoseLandmarkerLike;
      this.delegate = 'CPU';
      this.lastTs = -1;
    } catch (e) {
      // Give up quietly: the room keeps drawing the camera and shows the "step back" hint.
      this.landmarker = null;
      this.delegate = 'CPU';
      console.warn('pose engine unavailable', e);
    } finally {
      this.rebuilding = false;
    }
  }

  /** Detect on a still (uploaded photo or a frozen frame). */
  async detectImage(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap, w: number, h: number): Promise<BodyAnchors | null> {
    if (!this.landmarker) return null;
    await this.ensureMode('IMAGE');
    const result = this.landmarker.detect(image);
    await this.ensureMode('VIDEO');
    return toAnchors(result, w, h);
  }

  /** Release GPU memory and the wasm heap. */
  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
    this.lastTs = -1;
  }
}

/** Convert normalized landmarks to pixel anchors; null when the torso is not confidently visible. */
function toAnchors(result: PoseResult, w: number, h: number): BodyAnchors | null {
  const lm = result.landmarks?.[0];
  if (!lm) return null;
  const need = [L_SHOULDER, R_SHOULDER, L_HIP, R_HIP];
  for (const i of need) {
    const p = lm[i];
    if (!p) return null;
    if ((p.visibility ?? 1) < 0.35) return null;
  }
  const px = (i: number) => ({ x: lm[i]!.x * w, y: lm[i]!.y * h });
  return { shoulderL: px(L_SHOULDER), shoulderR: px(R_SHOULDER), hipL: px(L_HIP), hipR: px(R_HIP) };
}
