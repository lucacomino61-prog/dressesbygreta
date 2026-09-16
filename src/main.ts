import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/room.css';

import { detectLang, writeLang, type Lang } from './copy';
import {
  applyCopy,
  setCount,
  markChips,
  renderChips,
  renderFooterDresses,
  renderGrid,
  renderNavList,
  renderRail,
  renderSteps,
  setDoorImage,
  type Filter,
} from './ui/render';
import { initMotion, tiles as printTiles, refresh } from './motion';
import { Room } from './tryon/room';
import { Drawers } from './ui/drawers';
import { bag } from './ui/bag';
import { dresses } from './data/catalog';

let lang: Lang = detectLang();
let filter: Filter = 'all';

const $ = <T extends Element>(sel: string): T => document.querySelector(sel) as T;

/* ---- static parts ---- */
renderNavList($('[data-nav-list]'));
renderFooterDresses($('[data-foot-dresses]'));
renderRail($('[data-rail]'));
renderSteps($('[data-steps]'), lang);
setDoorImage($('[data-door-img]'));

const grid = $<HTMLElement>('[data-grid]');
const empty = $<HTMLElement>('[data-empty]');
const chips = $<HTMLElement>('[data-chips]');

function drawGrid(): void {
  const items = renderGrid(grid, filter);
  empty.hidden = items.length > 0;
  applyCopy(lang);
  setCount(lang, items.length);
  printTiles();
  refresh();
}

function setFilter(f: Filter): void {
  filter = f;
  markChips(chips, f);
  drawGrid();
}

renderChips(chips, filter);
renderGrid(grid, filter);
applyCopy(lang);
setCount(lang, dresses.length);

/* ---- the fitting room and the drawers ---- */
const room = new Room(document.body);
room.setLang(lang);

function setLang(next: Lang): void {
  lang = next;
  writeLang(lang);
  applyCopy(lang);
  setCount(lang, grid.children.length);
  renderSteps($('[data-steps]'), lang);
  room.setLang(lang);
  drawers.setLang(lang);
  refresh();
}

const drawers = new Drawers(
  {
    setFilter,
    openRoom: (id, from) => room.open(id, from),
    setLang,
    lang: () => lang,
  },
  document.body,
);
drawers.setLang(lang);
applyCopy(lang);

document.addEventListener('click', (e) => {
  const target = e.target as Element;
  const t = target.closest<HTMLElement>('[data-tryon]');
  if (t) {
    e.preventDefault();
    drawers.closeAll();
    const img = t.querySelector<HTMLImageElement>('img') ?? t.closest('.tile')?.querySelector<HTMLImageElement>('img') ?? undefined;
    room.open(t.dataset.dress || undefined, img);
    return;
  }
  const b = target.closest<HTMLElement>('[data-bag]');
  if (b) {
    e.preventDefault();
    bag.toggle(b.dataset.bag!);
    return;
  }
  const f = target.closest<HTMLElement>('[data-filter]');
  if (f && !f.closest('dialog')) {
    e.preventDefault();
    setFilter(f.dataset.filter as Filter);
    if (!f.classList.contains('chip')) document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (target.closest('[data-lang-toggle], [data-lang-toggle-text]')) {
    e.preventDefault();
    setLang(lang === 'sq' ? 'en' : 'sq');
  }
});

// Warm the pose runtime the moment a visitor shows intent, never on page load.
document.addEventListener(
  'pointerdown',
  (e) => {
    if ((e.target as Element).closest('[data-tryon]')) room.prefetch();
  },
  { passive: true },
);

/* ---- motion, then deep links, then the follow card ---- */
void initMotion().then(() => {
  printTiles();
  const m = location.hash.match(/^#try\/([a-z0-9]+)$/);
  if (m) room.open(m[1]);
  else drawers.schedulePopup(7000);
});

