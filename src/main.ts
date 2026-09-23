import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/lqip.css';

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
  type Filter,
} from './ui/render';
import { initMotion, tiles as printTiles, refresh } from './motion';
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

/* ---- the drawers ---- */
function setLang(next: Lang): void {
  lang = next;
  writeLang(lang);
  applyCopy(lang);
  setCount(lang, grid.children.length);
  drawers.setLang(lang);
  refresh();
}

const drawers = new Drawers(
  {
    setFilter,
    setLang,
    lang: () => lang,
  },
  document.body,
);
drawers.setLang(lang);
applyCopy(lang);

document.addEventListener('click', (e) => {
  const target = e.target as Element;
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

/* ---- motion, then the follow card ---- */
void initMotion().then(() => {
  printTiles();
  drawers.schedulePopup(7000);
});

