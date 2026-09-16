import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Static site. The MediaPipe wasm runtime (public/mediapipe) and the pose model (public/models)
 * are served from this origin; no CDN, no proxies, no backend. Keep them byte-identical to the
 * installed @mediapipe/tasks-vision version (see src/tryon/pose.ts).
 */

/** Production only: a content security policy that makes the "nothing is uploaded" promise mechanical. */
const csp: Plugin = {
  name: 'greta-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy = [
      "default-src 'self'",
      "connect-src 'self'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "script-src 'self' 'wasm-unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'none'",
    ].join('; ');
    return html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
  },
};

/** Dev only: serve the calibration tool's inputs from raw/ so nothing of them ships in the build. */
const rawForCalibration: Plugin = {
  name: 'greta-raw-for-calibration',
  apply: 'serve',
  configureServer(server) {
    const map: Record<string, string> = { '/raw-cut/': 'raw/cut', '/raw-src/': 'raw/tryon-src' };
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split('?')[0] ?? '';
      const hit = Object.entries(map).find(([prefix]) => url.startsWith(prefix));
      if (!hit) return next();
      const file = path.join(process.cwd(), hit[1], path.basename(url));
      if (!fs.existsSync(file)) return next();
      res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : file.endsWith('.png') ? 'image/png' : 'image/jpeg');
      fs.createReadStream(file).pipe(res);
    });
  },
};

export default defineConfig({
  plugins: [csp, rawForCalibration],
  server: { port: 3640, strictPort: true, host: '127.0.0.1' },
  preview: { port: 3641, strictPort: true },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      input: { main: 'index.html' },
      output: {
        manualChunks: {
          gsap: ['gsap', 'gsap/ScrollTrigger'],
          mediapipe: ['@mediapipe/tasks-vision'],
        },
      },
    },
  },
});