/**
 * Camera access for the try-on room. Front camera, portrait-friendly, no recording.
 * Stopping the stream is the only way frames stop existing; `stop()` is called on every exit path.
 */
export type CameraState = 'idle' | 'requesting' | 'live' | 'denied' | 'unavailable';

export class Camera {
  stream: MediaStream | null = null;
  state: CameraState = 'idle';
  /** Fired when the OS or another app takes the camera away. */
  onEnded: (() => void) | null = null;

  static supported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async start(video: HTMLVideoElement): Promise<CameraState> {
    if (!Camera.supported()) {
      this.state = 'unavailable';
      return this.state;
    }
    this.stop(video);
    this.state = 'requesting';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
      });
    } catch (err) {
      const name = (err as DOMException)?.name;
      this.state = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable';
      return this.state;
    }
    const track = this.stream.getVideoTracks()[0];
    track?.addEventListener('ended', () => this.onEnded?.(), { once: true });
    video.srcObject = this.stream;
    // iOS Safari needs these attributes set before play() or it opens the native player.
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    await video.play().catch(() => undefined);
    // Wait for real frames, but never hang the room: after 4s we proceed with what we have.
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2 && video.videoWidth > 0) return resolve();
      const done = () => {
        clearTimeout(timer);
        video.removeEventListener('loadeddata', done);
        video.removeEventListener('loadedmetadata', done);
        resolve();
      };
      const timer = setTimeout(done, 4000);
      video.addEventListener('loadeddata', done, { once: true });
      video.addEventListener('loadedmetadata', done, { once: true });
    });
    if (!this.stream) {
      // stop() ran while we were waiting
      this.state = 'idle';
      return this.state;
    }
    this.state = video.videoWidth > 0 ? 'live' : 'unavailable';
    if (this.state !== 'live') this.stop(video);
    return this.state;
  }

  stop(video?: HTMLVideoElement | null): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    this.state = 'idle';
  }
}
