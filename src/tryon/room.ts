/**
 * The fitting room: a native <dialog> where the visitor sees a dress on herself.
 *
 * Privacy contract (kept literally):
 *  - camera frames are drawn to canvases inside this dialog and nowhere else; no toBlob,
 *    no toDataURL, no object URL of a frame, no fetch carrying pixels
 *  - nothing is written to storage of any kind
 *  - every exit path stops the camera tracks first, then clears canvases and drops the still
 *  - the pose runtime and model are served from this origin
 *
 * Frame loop: gsap.ticker is the only scheduler on the page; the room adds one tick callback
 * while live and removes it on freeze, suspend and close.
 */
import { gsap } from 'gsap';
import { tryOnDresses, byId, type Dress } from '../data/catalog';
import { copy, type Lang } from '../copy';
import { site } from '../data/site';
import { crossing, reducedMotion, roomEnter, roomExit } from '../motion';
import { bag } from '../ui/bag';
import { Camera } from './camera';
import { PoseEngine } from './pose';
import {
  AnchorSmoother,
  drawGarment,
  fitGarment,
  mirrorAnchors,
  mirrorGarment,
  syntheticAnchorsFromBox,
  type BodyAnchors,
  type GarmentCalibration,
  type ManualAdjust,
} from './compositor';

type RoomState = 'closed' | 'gate' | 'loading' | 'live' | 'frozen' | 'photo' | 'denied' | 'unavailable';
type RoomCopy = (typeof copy)['sq']['room'];

const IN_APP = /Instagram|FBAN|FBAV|FB_IAB/i.test(navigator.userAgent);

export class Room {
  readonly el: HTMLDialogElement;
  private video!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private gate!: HTMLElement;
  private gateLead!: HTMLElement;
  private gateText!: HTMLElement;
  private ghost!: HTMLImageElement;
  private progress!: HTMLElement;
  private hint!: HTMLElement;
  private rail!: HTMLElement;
  private freezeBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private bagBtn!: HTMLButtonElement;
  private cameraCtl!: HTMLButtonElement;
  private photoCtl!: HTMLButtonElement;
  private askLink!: HTMLAnchorElement;
  private fileInput!: HTMLInputElement;
  private nameEl!: HTMLElement;
  private promiseEl!: HTMLElement;
  private openCamBtn!: HTMLButtonElement;
  private usePhotoBtn!: HTMLButtonElement;
  private closeBtn!: HTMLButtonElement;

  private t: RoomCopy = copy.sq.room;
  private tBag = copy.sq.bag;
  private state: RoomState = 'closed';
  private raw = document.createElement('canvas');
  private camera = new Camera();
  private engine = new PoseEngine();
  private smoother = new AnchorSmoother(0.35);
  private dress: Dress | null = null;
  private garmentImg: HTMLImageElement | null = null;
  private garment: GarmentCalibration | null = null;
  private lastAnchors: BodyAnchors | null = null;
  private lostSince = 0;
  private stillAnchors: BodyAnchors | null = null;
  private still: ImageBitmap | null = null;
  private stillMirrored = false;
  private adjust: ManualAdjust = { dx: 0, dy: 0, scale: 1 };
  private frameCount = 0;
  private lastVideoTime = -1;
  private closing = false;
  private deepLinked = false;
  /** Bumped on open, close and suspend; async work compares it before touching the room. */
  private gen = 0;
  private readonly tick = (): void => this.renderLive();
  private readonly onVisibility = (): void => {
    if (document.hidden && (this.state === 'live' || this.state === 'frozen')) this.suspend();
  };
  private readonly onPop = (): void => {
    if (this.el.open) void this.close(false);
  };

  constructor(parent: HTMLElement) {
    this.el = document.createElement('dialog');
    this.el.className = 'room';
    this.el.innerHTML = `
      <header class="room__bar">
        <p class="room__name" data-name lang="en"></p>
        <p class="room__promise" data-promise></p>
        <button class="room__close" type="button" data-close></button>
      </header>
      <div class="room__stage" data-stage>
        <video class="room__video" playsinline muted aria-hidden="true"></video>
        <canvas class="room__canvas" data-canvas tabindex="0" role="img"></canvas>
        <p class="room__hint is-hidden" data-hint role="status"></p>
        <div class="room__gate" data-gate>
          <div class="room__gate-stage">
            <img class="room__ghost" data-ghost alt="" aria-hidden="true" hidden />
          </div>
          <p class="room__gate-lead" data-gate-lead></p>
          <p class="room__gate-body" data-gate-text role="status"></p>
          <div class="room__progress" data-progress hidden><span></span></div>
          <div class="room__gate-actions">
            <button class="btn" type="button" data-open-camera></button>
            <button class="btn btn--line" type="button" data-use-photo></button>
          </div>
          <input type="file" accept="image/*" data-file hidden />
        </div>
      </div>
      <div class="room__rail" data-rail role="group"></div>
      <footer class="room__controls">
        <button class="btn btn--line" type="button" data-freeze></button>
        <button class="btn btn--line" type="button" data-ctl-camera hidden></button>
        <button class="btn btn--line" type="button" data-ctl-photo hidden></button>
        <button class="btn btn--line" type="button" data-reset></button>
        <button class="btn btn--line" type="button" data-room-bag aria-pressed="false"></button>
        <a class="btn" data-ask href="${site.message}" target="_blank" rel="noopener"></a>
      </footer>`;
    parent.appendChild(this.el);
    this.bind();
    this.setLang('sq');
  }

  private bind(): void {
    const q = <T extends Element>(sel: string): T => this.el.querySelector(sel) as T;
    this.video = q('video');
    this.canvas = q('[data-canvas]');
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.gate = q('[data-gate]');
    this.gateLead = q('[data-gate-lead]');
    this.gateText = q('[data-gate-text]');
    this.ghost = q('[data-ghost]');
    this.progress = q('[data-progress]');
    this.hint = q('[data-hint]');
    this.rail = q('[data-rail]');
    this.freezeBtn = q('[data-freeze]');
    this.resetBtn = q('[data-reset]');
    this.bagBtn = q('[data-room-bag]');
    this.cameraCtl = q('[data-ctl-camera]');
    this.photoCtl = q('[data-ctl-photo]');
    this.askLink = q('[data-ask]');
    this.fileInput = q('[data-file]');
    this.nameEl = q('[data-name]');
    this.promiseEl = q('[data-promise]');
    this.openCamBtn = q('[data-open-camera]');
    this.usePhotoBtn = q('[data-use-photo]');
    this.closeBtn = q('[data-close]');

    this.closeBtn.addEventListener('click', () => void this.close());
    this.openCamBtn.addEventListener('click', () => void this.startCamera());
    this.cameraCtl.addEventListener('click', () => void this.startCamera());
    this.usePhotoBtn.addEventListener('click', () => this.fileInput.click());
    this.photoCtl.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', () => void this.usePhoto());
    this.freezeBtn.addEventListener('click', () => void this.toggleFreeze());
    this.resetBtn.addEventListener('click', () => this.resetAdjust());
    this.bagBtn.addEventListener('click', () => {
      if (this.dress) bag.toggle(this.dress.id);
    });
    bag.subscribe(() => this.syncBag());
    this.camera.onEnded = () => {
      if (this.state === 'live') this.suspend();
    };
    // Escape triggers 'cancel'; route it through our close so the camera stops first.
    this.el.addEventListener('cancel', (e) => {
      e.preventDefault();
      void this.close();
    });
    // If the dialog is closed by any other means, tear down synchronously.
    this.el.addEventListener('close', () => {
      if (this.state !== 'closed') this.teardown();
    });
    this.bindAdjustGestures();
    this.buildRail();
  }

  /** Swap every static string; the dress names are the same in both languages. */
  setLang(lang: Lang): void {
    this.t = copy[lang].room;
    this.tBag = copy[lang].bag;
    this.el.setAttribute('aria-label', this.t.title);
    this.promiseEl.textContent = this.t.promise;
    this.closeBtn.textContent = this.t.close;
    this.openCamBtn.textContent = this.t.openCamera;
    this.cameraCtl.textContent = this.t.openCamera;
    this.usePhotoBtn.textContent = this.t.usePhoto;
    this.photoCtl.textContent = this.t.usePhoto;
    this.fileInput.setAttribute('aria-label', this.t.usePhoto);
    this.resetBtn.textContent = this.t.reset;
    this.askLink.textContent = this.t.ask;
    this.rail.setAttribute('aria-label', this.t.rail);
    this.canvas.setAttribute('aria-label', this.t.canvas);
    this.gateLead.textContent = this.t.gateLead;
    this.syncBag();
    if (this.state !== 'closed') this.setState(this.state);
  }

  private syncBag(): void {
    const on = !!this.dress && bag.has(this.dress.id);
    this.bagBtn.textContent = on ? this.tBag.added : this.tBag.add;
    this.bagBtn.setAttribute('aria-pressed', String(on));
  }

  /** Warm the runtime on pointerdown of any try-on control. */
  prefetch(): void {
    this.engine.prefetch();
  }

  /* ---------------------------------- open / close ---------------------------------- */

  open(dressId?: string, from?: HTMLImageElement): void {
    const wanted = dressId ? tryOnDresses.find((d) => d.id === dressId) : undefined;
    if (this.el.open) {
      if (wanted) void this.selectDress(wanted);
      return;
    }
    const first = wanted ?? tryOnDresses[0];
    if (!first) return;
    this.gen++;
    this.closing = false;
    this.el.showModal();
    document.documentElement.classList.add('room-open');
    document.addEventListener('visibilitychange', this.onVisibility);
    const target = `#try/${first.id}`;
    this.deepLinked = location.hash === target;
    if (this.deepLinked) history.replaceState({ room: true }, '', target);
    else history.pushState({ room: true }, '', target);
    window.addEventListener('popstate', this.onPop);
    this.setState('gate');
    void this.selectDress(first);
    void roomEnter(this.el);
    if (from) void crossing(from, this.stageRect());
    this.openCamBtn.focus({ preventScroll: true });
  }

  private stageRect(): DOMRect {
    const r = this.el.querySelector('[data-stage]')!.getBoundingClientRect();
    const w = r.width * 0.5;
    const h = r.height * 0.6;
    return new DOMRect(r.left + (r.width - w) / 2, r.top + (r.height - h) / 2, w, h);
  }

  async close(popHistory = true): Promise<void> {
    if (this.closing || !this.el.open) return;
    this.closing = true;
    // Camera first: nothing else moves until every track is stopped.
    this.suspend(false);
    await roomExit(this.el);
    if (this.el.open) this.el.close(); // fires 'close' -> teardown()
    gsap.set(this.el, { clearProps: 'clipPath,opacity' });
    if (popHistory && !this.deepLinked && history.state?.room) history.back();
    else if (location.hash.startsWith('#try/')) history.replaceState(null, '', location.pathname + location.search);
    this.closing = false;
  }

  /** Synchronous end of the room: tracks, listeners, pixels, state. Idempotent. */
  private teardown(): void {
    this.gen++;
    gsap.ticker.remove(this.tick);
    this.camera.stop(this.video);
    window.removeEventListener('popstate', this.onPop);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.clearCanvas();
    this.still?.close();
    this.still = null;
    this.stillAnchors = null;
    this.smoother.reset();
    this.lastAnchors = null;
    document.documentElement.classList.remove('room-open');
    this.setState('closed');
  }

  /** Stop camera + ticker; keep the room on the gate so the visitor can resume. */
  private suspend(showGate = true): void {
    this.gen++;
    gsap.ticker.remove(this.tick);
    this.camera.stop(this.video);
    this.smoother.reset();
    this.lastAnchors = null;
    if (showGate) {
      this.clearCanvas();
      this.still?.close();
      this.still = null;
      this.stillAnchors = null;
      if (this.state === 'live' || this.state === 'frozen') this.setState('gate');
    }
  }

  private setState(s: RoomState): void {
    this.state = s;
    this.el.dataset.state = s;
    const t = this.t;
    const showGate = s === 'gate' || s === 'loading' || s === 'denied' || s === 'unavailable';
    this.gate.hidden = !showGate;
    this.ghost.hidden = !showGate || !this.ghost.getAttribute('src');
    this.progress.hidden = s !== 'loading';
    this.openCamBtn.hidden = s === 'unavailable';
    this.openCamBtn.disabled = s === 'loading';
    this.usePhotoBtn.disabled = s === 'loading';
    this.freezeBtn.hidden = !(s === 'live' || s === 'frozen');
    this.cameraCtl.hidden = s !== 'photo';
    this.photoCtl.hidden = s !== 'photo';
    this.resetBtn.hidden = !(s === 'live' || s === 'frozen' || s === 'photo');
    this.freezeBtn.textContent = s === 'frozen' ? t.live : t.freeze;
    const blocked = IN_APP && (s === 'denied' || s === 'unavailable');
    const text =
      s === 'loading' ? t.loading : blocked ? t.inApp : s === 'denied' ? t.denied : s === 'unavailable' ? t.unavailable : t.gateBody;
    this.gateText.textContent = text;
    this.gate.classList.toggle('is-busy', s === 'loading');
    this.setHint(null);
  }

  private setHint(text: string | null): void {
    this.hint.classList.toggle('is-hidden', !text);
    this.hint.textContent = text ?? '';
  }

  private setProgress(f: number): void {
    this.progress.style.setProperty('--progress', String(Math.max(0, Math.min(1, f))));
  }

  /* ------------------------------------- dresses ------------------------------------ */

  private buildRail(): void {
    this.rail.innerHTML = '';
    for (const d of tryOnDresses) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'room__swatch';
      b.dataset.id = d.id;
      const img = d.images[0]!;
      b.innerHTML = `<img src="${img.sm}" alt="" loading="lazy" decoding="async" /><span lang="en">${d.name}</span>`;
      b.setAttribute('aria-label', d.name);
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => void this.selectDress(d));
      this.rail.appendChild(b);
    }
  }

  private async selectDress(d: Dress): Promise<void> {
    this.dress = d;
    this.nameEl.textContent = d.name;
    this.syncBag();
    this.rail.querySelectorAll<HTMLButtonElement>('.room__swatch').forEach((b) => {
      const on = b.dataset.id === d.id;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      if (on) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
    if (this.el.open && history.state?.room) history.replaceState({ room: true }, '', `#try/${d.id}`);
    this.resetAdjust(false);
    if (!d.cutout) {
      this.garmentImg = null;
      this.garment = null;
      this.ghost.removeAttribute('src');
      this.ghost.hidden = true;
      return;
    }
    this.ghost.src = d.cutout.src;
    this.ghost.hidden = this.gate.hidden;
    const img = new Image();
    img.decoding = 'async';
    img.src = d.cutout.src;
    await img.decode().catch(() => undefined);
    if (this.dress !== d) return; // the visitor moved on
    this.garmentImg = img;
    this.garment = {
      w: d.cutout.w,
      h: d.cutout.h,
      anchors: d.cutout.anchors ?? syntheticAnchorsFromBox(d.cutout.w, d.cutout.h),
    };
    if (this.state === 'frozen' || this.state === 'photo') this.renderStill();
  }

  /* ------------------------------------- camera ------------------------------------- */

  private async startCamera(): Promise<void> {
    if (!Camera.supported()) {
      this.setState('unavailable');
      return;
    }
    const gen = ++this.gen;
    const alive = () => gen === this.gen && this.el.open;
    // Coming back from a frozen or photo still: the camera needs a clean slate.
    gsap.ticker.remove(this.tick);
    this.camera.stop(this.video);
    if (!this.engine.ready) {
      this.setState('loading');
      this.setProgress(0);
      try {
        await this.engine.load((f) => alive() && this.setProgress(f));
      } catch {
        if (!alive()) return;
        this.setState('unavailable');
        this.gateText.textContent = this.t.loadFail;
        return;
      }
      if (!alive()) return;
    }
    const st = await this.camera.start(this.video);
    if (!alive()) {
      this.camera.stop(this.video);
      return;
    }
    if (st !== 'live') {
      this.setState(st === 'denied' ? 'denied' : 'unavailable');
      return;
    }
    this.still?.close();
    this.still = null;
    this.stillAnchors = null;
    this.fitCanvasTo(this.video.videoWidth, this.video.videoHeight);
    this.frameCount = 0;
    this.lostSince = 0;
    this.lastVideoTime = -1;
    this.smoother.reset();
    this.setState('live');
    this.canvas.focus({ preventScroll: true });
    gsap.ticker.add(this.tick);
  }

  private fitCanvasTo(w: number, h: number): void {
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  private renderLive(): void {
    if (this.state !== 'live') return;
    const { ctx, canvas, video } = this;
    if (video.readyState < 2 || !video.videoWidth) return;
    // Phone rotation changes the frame size mid-stream; follow it.
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      this.fitCanvasTo(video.videoWidth, video.videoHeight);
      this.smoother.reset();
      this.lastAnchors = null;
    }
    const w = canvas.width;
    const h = canvas.height;
    // Mirror so the visitor sees herself as in a mirror. The bare frame is kept on an offscreen
    // canvas so a freeze can re-dress the same frame without baking the previous garment in.
    if (this.raw.width !== w || this.raw.height !== h) {
      this.raw.width = w;
      this.raw.height = h;
    }
    const rctx = this.raw.getContext('2d')!;
    rctx.save();
    rctx.translate(w, 0);
    rctx.scale(-1, 1);
    rctx.drawImage(video, 0, 0, w, h);
    rctx.restore();
    ctx.drawImage(this.raw, 0, 0);

    // Detect only on a new camera frame (the ticker runs faster than the camera), and on the
    // CPU delegate only every other new frame to hold the drawing rate.
    const every = this.engine.delegate === 'GPU' ? 1 : 2;
    const now = performance.now();
    const newFrame = video.currentTime !== this.lastVideoTime;
    this.lastVideoTime = video.currentTime;
    if (newFrame && this.frameCount++ % every === 0) {
      const found = this.engine.detectVideo(video, now);
      if (found) {
        this.lastAnchors = this.smoother.push(mirrorAnchors(found, w));
        this.lostSince = 0;
      } else {
        // 300ms grace before the garment disappears, so one dropped frame does not flicker.
        this.lostSince ||= now;
        if (now - this.lostSince > 300) {
          this.lastAnchors = null;
          this.smoother.reset();
        }
      }
    }
    if (this.lastAnchors && this.garmentImg && this.garment) {
      // The visitor sees a mirror, so the garment is mirrored too (her left strap on her left).
      const g = mirrorGarment(this.garment);
      drawGarment(ctx, this.garmentImg, g, fitGarment(this.lastAnchors, g, this.adjust), 1, true);
      if (!this.hint.classList.contains('is-hidden')) this.setHint(null);
    } else if (!this.lastAnchors && this.hint.classList.contains('is-hidden')) {
      this.setHint(this.t.noBody);
    }
  }

  private async toggleFreeze(): Promise<void> {
    if (this.state === 'live') {
      const gen = this.gen;
      gsap.ticker.remove(this.tick);
      // Keep the bare mirrored frame as the still; the garment is re-drawn over it on demand,
      // so switching dresses or nudging the fit works on the frozen frame too.
      const bmp = await createImageBitmap(this.raw);
      if (gen !== this.gen || this.state !== 'live') {
        bmp.close();
        return;
      }
      this.still?.close();
      this.still = bmp;
      this.stillMirrored = true;
      this.stillAnchors = this.lastAnchors;
      this.camera.stop(this.video);
      this.setState('frozen');
      this.setHint(this.t.adjustHint);
      this.renderStill();
      this.freezeBtn.focus({ preventScroll: true });
    } else if (this.state === 'frozen') {
      void this.startCamera();
    }
  }

  /* -------------------------------------- photo ------------------------------------- */

  private async usePhoto(): Promise<void> {
    const file = this.fileInput.files?.[0];
    this.fileInput.value = '';
    if (!file) return;
    // The visitor chose a photo: the camera goes off before anything else happens.
    const gen = ++this.gen;
    const alive = () => gen === this.gen && this.el.open;
    gsap.ticker.remove(this.tick);
    this.camera.stop(this.video);
    this.smoother.reset();
    this.lastAnchors = null;
    if (!this.engine.ready) {
      this.setState('loading');
      this.setProgress(0);
      try {
        await this.engine.load((f) => alive() && this.setProgress(f));
      } catch {
        if (!alive()) return;
        this.setState('unavailable');
        this.gateText.textContent = this.t.loadFail;
        return;
      }
      if (!alive()) return;
    }
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      if (!alive()) return;
      this.setState('gate');
      this.gateText.textContent = this.t.badFile;
      return;
    }
    if (!alive()) {
      bmp.close();
      return;
    }
    // Cap the working resolution; the photo lives only in this bitmap and the canvas.
    const maxSide = 1280;
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k);
    const h = Math.round(bmp.height * k);
    this.fitCanvasTo(w, h);
    this.still?.close();
    this.still = k === 1 ? bmp : await createImageBitmap(bmp, { resizeWidth: w, resizeHeight: h });
    if (k !== 1) bmp.close();
    if (!alive()) return;
    this.stillMirrored = false;
    this.ctx.drawImage(this.still, 0, 0, w, h);
    const anchors = await this.engine.detectImage(this.canvas, w, h);
    if (!alive()) return;
    this.stillAnchors = anchors;
    this.setState('photo');
    this.setHint(anchors ? this.t.adjustHint : this.t.photoNoBody);
    this.renderStill();
    this.canvas.focus({ preventScroll: true });
  }

  private renderStill(): void {
    if (!this.still) return;
    const { ctx, canvas } = this;
    ctx.drawImage(this.still, 0, 0, canvas.width, canvas.height);
    const anchors = this.stillAnchors ?? (this.garment ? centeredAnchors(canvas.width, canvas.height) : null);
    if (anchors && this.garmentImg && this.garment) {
      const g = this.stillMirrored ? mirrorGarment(this.garment) : this.garment;
      drawGarment(ctx, this.garmentImg, g, fitGarment(anchors, g, this.adjust), 1, this.stillMirrored);
    }
  }

  /* ------------------------------------- adjust ------------------------------------- */

  private resetAdjust(rerender = true): void {
    this.adjust = { dx: 0, dy: 0, scale: 1 };
    if (rerender && (this.state === 'photo' || this.state === 'frozen')) this.renderStill();
  }

  private nudge(dx: number, dy: number, scale = 1): void {
    this.adjust.dx += dx;
    this.adjust.dy += dy;
    this.adjust.scale = clamp(this.adjust.scale * scale, 0.6, 1.8);
    if (this.state !== 'live') this.renderStill();
  }

  private bindAdjustGestures(): void {
    const c = this.canvas;
    const pointers = new Map<number, { x: number; y: number }>();
    let startDist = 0;
    let startScale = 1;
    const active = () => this.state === 'live' || this.state === 'photo' || this.state === 'frozen';
    // Bitmap pixels per CSS pixel; the stage uses object-fit cover (live) or contain (photo),
    // so the visible scale is uniform and only its magnitude matters for deltas.
    const factor = () => {
      const r = c.getBoundingClientRect();
      const a = c.width / r.width;
      const b = c.height / r.height;
      return this.state === 'photo' ? Math.min(a, b) : Math.max(a, b);
    };
    c.addEventListener('pointerdown', (e) => {
      if (!active()) return;
      c.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        startDist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        startScale = this.adjust.scale;
      }
    });
    c.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const now = { x: e.clientX, y: e.clientY };
      if (pointers.size === 1) {
        const k = factor();
        this.adjust.dx += (now.x - prev.x) * k;
        this.adjust.dy += (now.y - prev.y) * k;
      }
      pointers.set(e.pointerId, now);
      if (pointers.size === 2 && startDist > 0) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        this.adjust.scale = clamp(startScale * (d / startDist), 0.6, 1.8);
      }
      if (this.state !== 'live') this.renderStill();
    });
    const end = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) startDist = 0;
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener(
      'wheel',
      (e) => {
        if (!active()) return;
        e.preventDefault();
        this.nudge(0, 0, e.deltaY < 0 ? 1.04 : 0.96);
      },
      { passive: false },
    );
    // Keyboard: arrows move the dress, plus and minus resize it, 0 resets.
    c.addEventListener('keydown', (e) => {
      if (!active()) return;
      const step = (e.shiftKey ? 40 : 10) * factor();
      const map: Record<string, () => void> = {
        ArrowLeft: () => this.nudge(-step, 0),
        ArrowRight: () => this.nudge(step, 0),
        ArrowUp: () => this.nudge(0, -step),
        ArrowDown: () => this.nudge(0, step),
        '+': () => this.nudge(0, 0, 1.05),
        '=': () => this.nudge(0, 0, 1.05),
        '-': () => this.nudge(0, 0, 0.95),
        '0': () => this.resetAdjust(),
      };
      const fn = map[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    });
  }

  private clearCanvas(): void {
    this.ctx.fillStyle = '#0b0b0b';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.raw.width = 1;
    this.raw.height = 1;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** When a photo has no detectable body, hang the dress in the middle so the visitor can drag it. */
function centeredAnchors(w: number, h: number): BodyAnchors {
  const sw = w * 0.26;
  const cx = w / 2;
  const sy = h * 0.22;
  return {
    shoulderL: { x: cx - sw / 2, y: sy },
    shoulderR: { x: cx + sw / 2, y: sy },
    hipL: { x: cx - sw * 0.42, y: sy + h * 0.24 },
    hipR: { x: cx + sw * 0.42, y: sy + h * 0.24 },
  };
}

export { byId };
