// Local receiver for the Instagram harvest. The logged-in browser pane navigates to
// http://127.0.0.1:3699/save?d=<uri-encoded JSON array of posts>; this appends to raw/posts.jsonl
// and downloads every image to raw/<code>_<n>.jpg in the background. Dev-only.
// Run with: node --max-http-header-size=4194304 tools/harvest-server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'raw');
const LOG = path.join(RAW, 'posts.jsonl');
fs.mkdirSync(RAW, { recursive: true });

const seen = new Set(
  fs.existsSync(LOG)
    ? fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).code)
    : [],
);
const status = { saved: 0, downloaded: 0, failed: [], pending: 0 };

async function download(url, file) {
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) return 'cached';
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return 'ok';
}

async function ingest(posts) {
  for (const post of posts) {
    if (seen.has(post.code)) continue;
    seen.add(post.code);
    post.imgs.forEach((img, i) => (img.file = 'raw/' + post.code + '_' + i + '.jpg'));
    post.savedAt = new Date().toISOString();
    fs.appendFileSync(LOG, JSON.stringify(post) + '\n');
    status.saved++;
    for (let i = 0; i < post.imgs.length; i++) {
      status.pending++;
      try {
        await download(post.imgs[i].src, path.join(RAW, post.code + '_' + i + '.jpg'));
        status.downloaded++;
      } catch (e) {
        status.failed.push(post.code + '_' + i + ': ' + e.message);
      } finally {
        status.pending--;
      }
    }
  }
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1:3699');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (url.pathname === '/save') {
      let posts;
      try {
        posts = JSON.parse(url.searchParams.get('d') || '[]');
      } catch (e) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        return res.end('bad json: ' + e);
      }
      const fresh = posts.filter((p) => !seen.has(p.code)).length;
      ingest(posts).catch((e) => status.failed.push('ingest: ' + e.message));
      res.writeHead(200, { 'content-type': 'text/plain' });
      return res.end(JSON.stringify({ ok: true, received: posts.length, fresh, seen: seen.size }));
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, ...status, seen: seen.size }));
  })
  .listen(3699, '127.0.0.1', () => console.log('harvest receiver on http://127.0.0.1:3699'));
