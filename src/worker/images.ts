/**
 * Product photographs in R2. The admin resizes in the browser and uploads every width at once;
 * the Worker only validates, stores and serves. Keys are never reused, so responses are immutable.
 */
import type { Context } from 'hono';
import type { AppEnv } from './types';

const KEY_RE = /^p\/[a-z0-9-]{6,40}\/[a-z0-9-]{6,40}\/\d{3,4}\.(webp|jpg)$/;
const MAX_BYTES = 4 * 1024 * 1024;

export async function serveImage(c: Context<AppEnv>): Promise<Response> {
  const key = c.req.path.slice('/img/'.length);
  if (!KEY_RE.test(key)) return c.notFound();
  const cache = import.meta.env.PROD ? caches.default : null;
  if (cache) {
    const hitRes = await cache.match(c.req.raw);
    if (hitRes) return hitRes;
  }
  const obj = await c.env.IMAGES.get(key, { onlyIf: c.req.raw.headers });
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  if (!('body' in obj) || !obj.body) return new Response(null, { status: 304, headers });
  const res = new Response(obj.body, { headers });
  if (cache) c.executionCtx.waitUntil(cache.put(c.req.raw, res.clone()));
  return res;
}

export interface UploadMeta {
  w: number;
  h: number;
  lqip: string;
  ext: 'webp' | 'jpg';
  widths: number[];
}

export function parseUploadMeta(raw: unknown): UploadMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const ext = m.ext === 'jpg' ? 'jpg' : m.ext === 'webp' ? 'webp' : null;
  const widths = Array.isArray(m.widths) ? m.widths : [];
  const okWidths =
    widths.length >= 1 &&
    widths.length <= 4 &&
    widths.every((w, i) => Number.isInteger(w) && (w as number) >= 200 && (w as number) <= 2400 && (i === 0 || (w as number) > (widths[i - 1] as number)));
  const w = Number(m.w);
  const h = Number(m.h);
  const lqip = typeof m.lqip === 'string' ? m.lqip : '';
  if (!ext || !okWidths || !Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 10000 || h > 10000) return null;
  if (lqip && (!/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(lqip) || lqip.length > 6000)) return null;
  return { w, h, lqip, ext, widths: widths as number[] };
}

/** Magic bytes, so a renamed HTML or SVG file can never be stored as a photograph. */
async function looksLike(file: File, ext: 'webp' | 'jpg'): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (ext === 'jpg') return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const ascii = (a: number, b: number) => String.fromCharCode(...head.slice(a, b));
  return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
}

export async function storeVariants(env: Env, key: string, meta: UploadMeta, form: FormData): Promise<string | null> {
  const files: [number, File][] = [];
  for (const width of meta.widths) {
    const f = form.get(`w${width}`);
    if (!(f instanceof File)) return `missing width ${width}`;
    if (f.size === 0 || f.size > MAX_BYTES) return `width ${width} has a bad size`;
    if (!(await looksLike(f, meta.ext))) return `width ${width} is not a ${meta.ext}`;
    files.push([width, f]);
  }
  const contentType = meta.ext === 'jpg' ? 'image/jpeg' : 'image/webp';
  // R2 needs a known length; a File's own stream does not carry one, its bytes do (max 4 MB each).
  await Promise.all(
    files.map(async ([width, f]) => env.IMAGES.put(`${key}/${width}.${meta.ext}`, await f.arrayBuffer(), { httpMetadata: { contentType } })),
  );
  return null;
}

export async function deleteVariants(env: Env, key: string, ext: string, widths: number[]): Promise<void> {
  if (widths.length) await env.IMAGES.delete(widths.map((w) => `${key}/${w}.${ext}`));
}
