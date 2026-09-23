// Dev-only: exercises the client router and the photograph's flight (spread -> product,
// contents -> product, size index swap) and captures mid-flight frames.
import path from 'node:path';
import { puppeteer } from 'file:///C:/Users/User/AppData/Local/npm-cache/_npx/15c61037b1978c83/node_modules/chrome-devtools-mcp/build/src/third_party/index.js';

const BASE = 'http://127.0.0.1:3640';
const out = path.resolve('.impeccable/review');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem('greta-follow', '1');
  } catch {}
});
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE + '/dyqani', { waitUntil: 'networkidle0' });
await sleep(1500);
const loads = await page.evaluate(() => performance.getEntriesByType('navigation').length);

await page.click('.spread .spread__name a');
await sleep(380);
await page.screenshot({ path: path.join(out, 'flight-mid.png') });
await sleep(1400);
await page.screenshot({ path: path.join(out, 'flight-landed.png') });
const afterSpread = await page.evaluate(() => ({ url: location.pathname, kind: document.querySelector('main').dataset.page, clones: document.querySelectorAll('.flight').length, title: document.title }));

await page.goBack();
await sleep(1200);
const back = await page.evaluate(() => ({ url: location.pathname + location.search, kind: document.querySelector('main').dataset.page }));

await page.click('.size-index a[data-size="38"]');
await sleep(1200);
const sized = await page.evaluate(() => ({ url: location.search, count: document.querySelector('[data-lb-count]')?.textContent, spreads: document.querySelectorAll('.spread').length }));

await page.click('.size-index [data-view-toggle]');
await sleep(1200);
await page.click('.toc__item:nth-child(3) .toc__link');
await sleep(350);
await page.screenshot({ path: path.join(out, 'flight-toc-mid.png') });
await sleep(1400);
const afterToc = await page.evaluate(() => ({ url: location.pathname + location.search, kind: document.querySelector('main').dataset.page }));
const stillOneLoad = await page.evaluate(() => performance.getEntriesByType('navigation').length);

console.log(JSON.stringify({ loads, afterSpread, back, sized, afterToc, stillOneLoad, errors }, null, 1));
await browser.close();
