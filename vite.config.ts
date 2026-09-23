import { defineConfig, type Plugin } from 'vite';

/**
 * Static site: everything is served from this origin; no CDN, no proxies, no backend.
 * Production only: a content security policy that keeps every request on this origin.
 */
const csp: Plugin = {
  name: 'greta-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy = [
      "default-src 'self'",
      "connect-src 'self'",
      "img-src 'self' data: blob:",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "base-uri 'self'",
      "form-action 'none'",
    ].join('; ');
    return html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
  },
};

export default defineConfig({
  plugins: [csp],
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
        },
      },
    },
  },
});