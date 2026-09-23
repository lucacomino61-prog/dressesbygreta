// Dev-only visual check: headless Chrome against the local dev server (the app's browser pane
// freezes animation frames while hidden). Writes .impeccable/review/<view>-<name>.png and prints
// console errors, horizontal overflow and frame rate per page.
//   node tools/capture.mjs [--only desktop|mobile] [--pages home,shop,...]
import fs from 'node:fs';
import path from 'node:path';
import { puppeteer } from 'file:///C:/Users/User/AppData/Local/npm-cache/_npx/15c61037b1978c83/node_modules/chrome-devtools-mcp/build/src/third_party/index.js';

const BASE = 'http://127.0.0.1:3640';
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const pick = args.includes('--pages') ? args[args.indexOf('--pages') + 1].split(',') : null;
const out = path.resolve('.impeccable/review');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
});

const views = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
].filter((v) => !only || v.name === only);

async function firstSlug(page) {
  return page.evaluate(async () => (await (await fetch('/api/products')).json()).find((p) => Object.values(p.stock).some((n) => n > 0))?.slug);
}

const report = [];
for (const v of views) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 200)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.setItem('greta-follow', '1');
    } catch {
      /* about:blank has no storage */
    }
  });
  await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: 1, isMobile: v.mobile, hasTouch: v.mobile });
  const shot = async (name) => {
    await page.screenshot({ path: path.join(out, `${v.name}-${name}.png`), captureBeyondViewport: false });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    report.push({ view: v.name, shot: name, overflow, errors: errors.splice(0) });
  };
  const open = async (url, wait = 1800) => {
    await page.goto(BASE + url, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(wait);
  };
  const want = (n) => !pick || pick.includes(n);

  if (want('home')) {
    await open('/');
    await shot('home');
    await page.evaluate(() => window.scrollTo(0, document.getElementById('shop').getBoundingClientRect().top + window.scrollY));
    await sleep(1800);
    await shot('home-shop');
  }
  if (want('shop')) {
    await open('/dyqani');
    await shot('shop');
    const h = await page.evaluate(() => document.querySelector('.spread')?.getBoundingClientRect().height ?? 800);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(h * 0.55));
    await sleep(900);
    await shot('shop-turning');
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(h * 1.02));
    await sleep(900);
    await shot('shop-spread2');
    await open('/dyqani?pamja=indeks', 1500);
    await shot('contents');
    await open('/dyqani?masa=38', 1500);
    await shot('shop-38');
  }
  const slug = await firstSlug(page);
  if (want('product') && slug) {
    await open(`/fustan/${slug}`);
    await shot('product');
    await page.click('[data-zoom]');
    await sleep(900);
    await shot('viewer');
    await page.keyboard.press('Escape');
    await sleep(400);
    // add to bag through the real form
    await page.evaluate(() => {
      const r = document.querySelector('.product__form input[type="radio"]:not(:disabled)');
      if (r) r.click();
      document.querySelector('.product__form').requestSubmit();
    });
    await sleep(1200);
    await page.click('.nav [data-open="bag"]');
    await sleep(900);
    await shot('bag');
  }
  if (want('checkout')) {
    await open('/porosia', 1500);
    await shot('checkout');
    await page.type('#co-name', 'Test Klient');
    await page.type('#co-phone', '069 123 4567');
    await page.type('#co-city', 'Tiranë');
    await page.type('#co-address', 'Rruga e Durrësit, Pallati 5, Ap. 12');
    await page.evaluate(() => document.querySelector('[data-co-form]').requestSubmit());
    await sleep(3200);
    await shot('confirmation');
    // Put the stock back so every capture shows one data state (cancelling restocks the order).
    await page.evaluate(async () => {
      const id = location.pathname.split('/').pop();
      await fetch('/api/admin/dev-login', { method: 'POST' });
      await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
    });
  }
  if (want('admin')) {
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
    await sleep(600);
    const dev = await page.$('[data-dev]');
    if (dev) {
      await dev.click();
      await sleep(1500);
    }
    await shot('admin');
    const first = await page.evaluate(() => document.querySelector('.adm-row__name')?.getAttribute('href'));
    if (first) {
      await page.goto(BASE + first, { waitUntil: 'networkidle0' });
      await sleep(1200);
      await shot('admin-editor');
    }
    await page.goto(BASE + '/admin/porosi?s=all', { waitUntil: 'networkidle0' });
    await sleep(1000);
    await shot('admin-orders');
  }
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); })(); }));
  report.push({ view: v.name, fps });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(report.filter((r) => r.errors?.length || r.overflow || r.fps), null, 1));
