/**
 * DOM renderers for the data-driven parts of the page (header list, rail plates, contents grid,
 * filters, steps, footer list) and the string table. Everything is plain DOM; no framework.
 */
import { dresses, featured, categories, tryOnDresses, byId, type Dress, type DressImage, type Category } from '../data/catalog';
import { copy, type Lang } from '../copy';
import { site } from '../data/site';
import { bag } from './bag';

export type Filter = Category | 'all';

/** Resolve a dotted path like "catalog.filters.gowns" inside the copy table. */
function resolve(lang: Lang, path: string): string | null {
  let node: unknown = copy[lang];
  for (const key of path.split('.')) {
    if (node && typeof node === 'object' && key in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return typeof node === 'string' ? node : null;
}

/** Write every [data-t] string for the language and flip the document language. */
export function setCount(lang: Lang, n: number): void {
  const count = document.querySelector<HTMLElement>('[data-count]');
  if (count) count.textContent = copy[lang].catalog.count(n);
}

export function applyCopy(lang: Lang): void {
  document.documentElement.lang = lang;
  const t = copy[lang];
  document.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => {
    const s = resolve(lang, el.dataset.t!);
    if (s !== null) el.textContent = s;
  });
  document.querySelectorAll<HTMLElement>('[data-t-aria]').forEach((el) => {
    const s = resolve(lang, el.dataset.tAria!);
    if (s !== null) el.setAttribute('aria-label', s);
  });
  document.querySelectorAll<HTMLElement>('[data-t-alt]').forEach((el) => {
    const s = resolve(lang, el.dataset.tAlt!);
    if (s !== null) el.setAttribute('alt', s);
  });
  document.querySelectorAll<HTMLElement>('[data-t-placeholder]').forEach((el) => {
    const s = resolve(lang, el.dataset.tPlaceholder!);
    if (s !== null) el.setAttribute('placeholder', s);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-lang-toggle]').forEach((toggle) => {
    toggle.textContent = lang === 'sq' ? 'EN' : 'SQ';
    toggle.setAttribute('aria-label', `${t.nav.region}: ${t.switchTo}`);
    toggle.lang = lang === 'sq' ? 'en' : 'sq';
  });
  document.querySelectorAll<HTMLElement>('[data-bag]').forEach((b) => {
    const on = bag.has(b.dataset.bag!);
    b.textContent = on ? t.bag.added : t.bag.add;
  });
  document.title = site.name;
}

function srcset(img: DressImage): string {
  const smW = img.h > 640 ? Math.round((img.w * 640) / img.h) : img.w;
  return `${img.sm} ${smW}w, ${img.src} ${img.w}w`;
}

const alt = (d: Dress): string => `${d.name}, Dresses by Greta`;

/* ------------------------------ header list + footer list ------------------------------ */

export function renderNavList(el: HTMLElement): void {
  el.innerHTML = '';
  for (const c of categories) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tlink';
    b.dataset.filter = c.key;
    b.dataset.t = c.key === 'all' ? 'nav.all' : `catalog.filters.${c.key}`;
    b.textContent = c.label;
    el.appendChild(b);
  }
}

export function renderFooterDresses(el: HTMLElement): void {
  el.querySelectorAll('button').forEach((b) => b.remove());
  for (const c of categories) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.filter = c.key;
    b.dataset.t = c.key === 'all' ? 'nav.all' : `catalog.filters.${c.key}`;
    b.textContent = c.label;
    el.appendChild(b);
  }
}

/* ------------------------------------ rail ------------------------------------ */

export function renderRail(el: HTMLElement): void {
  el.innerHTML = '';
  featured.forEach((d, i) => {
    const img = d.images[0]!;
    const plate = document.createElement('article');
    plate.className = 'plate rail__plate';
    plate.style.zIndex = String(i + 1);
    plate.dataset.id = d.id;
    const primary = d.cutout
      ? `<button class="tlink" type="button" data-tryon data-dress="${d.id}" data-t="hero.tryon">Provoje</button>`
      : `<a class="tlink" href="${site.message}" target="_blank" rel="noopener" data-t="rent.cta">Pyet në Instagram</a>`;
    plate.innerHTML = `
      <div class="rail__frame">
        <div class="plate__inner">
          <img class="plate__img" src="${img.src}" srcset="${srcset(img)}" sizes="(min-width: 1024px) 44vw, 100vw"
               width="${img.w}" height="${img.h}" alt="${alt(d)}" ${i < 2 ? 'loading="eager"' : 'loading="lazy"'} decoding="async" />
          <span class="plate__scan" aria-hidden="true"></span>
        </div>
        <div class="rail__scrim" aria-hidden="true"></div>
      </div>
      <div class="rail__caption">
        <h2 class="rail__name" lang="en">${d.name}</h2>
        <div class="rail__actions">
          ${primary}
          <a class="tlink" href="${d.permalink}" target="_blank" rel="noopener" data-t="catalog.view">Shiko në Instagram</a>
          <button class="tlink" type="button" data-bag="${d.id}" aria-pressed="false" data-t="bag.add">Shto në çantë</button>
        </div>
      </div>`;
    el.appendChild(plate);
    const hold = document.createElement('div');
    hold.className = 'hold';
    hold.setAttribute('aria-hidden', 'true');
    el.appendChild(hold);
  });
}

/* ------------------------------------ filters ----------------------------------- */

export function renderChips(el: HTMLElement, active: Filter): void {
  el.innerHTML = '';
  for (const c of categories) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (c.key === active ? ' is-on' : '');
    b.dataset.filter = c.key;
    b.dataset.t = `catalog.filters.${c.key}`;
    b.setAttribute('aria-pressed', String(c.key === active));
    b.textContent = c.label;
    el.appendChild(b);
  }
}

export function markChips(el: HTMLElement, active: Filter): void {
  el.querySelectorAll<HTMLElement>('.chip').forEach((x) => {
    const on = x.dataset.filter === active;
    x.classList.toggle('is-on', on);
    x.setAttribute('aria-pressed', String(on));
  });
}

/* ------------------------------------ grid ------------------------------------ */

export function filterDresses(f: Filter): Dress[] {
  return f === 'all' ? dresses : dresses.filter((d) => d.cats.includes(f));
}

export function renderGrid(el: HTMLElement, f: Filter): HTMLElement[] {
  el.innerHTML = '';
  const tiles: HTMLElement[] = [];
  for (const d of filterDresses(f)) {
    const img = d.images[0]!;
    const tile = document.createElement('div');
    tile.className = 'tile';
    const media = d.cutout
      ? `<button class="tile__media" type="button" data-tryon data-dress="${d.id}">`
      : `<a class="tile__media" href="${d.permalink}" target="_blank" rel="noopener">`;
    const mediaEnd = d.cutout ? '</button>' : '</a>';
    tile.innerHTML = `
      ${media}
        <span class="tile__well plate">
          <span class="plate__inner">
            <img class="plate__img" src="${img.sm}" srcset="${srcset(img)}" sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 46vw"
                 width="${img.w}" height="${img.h}" alt="${alt(d)}" loading="lazy" decoding="async" />
            <span class="plate__scan" aria-hidden="true"></span>
          </span>
        </span>
      ${mediaEnd}
      <div class="tile__cap">
        <span class="tile__name" lang="en">${d.name}</span>
        <span class="tile__acts">
          ${d.cutout ? `<button type="button" data-tryon data-dress="${d.id}" data-t="catalog.tryon">Provoje</button>` : ''}
          <button type="button" data-bag="${d.id}" aria-pressed="false" data-t="bag.add">Shto në çantë</button>
        </span>
      </div>`;
    el.appendChild(tile);
    tiles.push(tile);
  }
  return tiles;
}

/* ------------------------------------ door + steps ---------------------------- */

export function renderSteps(el: HTMLElement, lang: Lang): void {
  el.innerHTML = copy[lang].tryonSection.steps.map((s) => `<li>${s}</li>`).join('');
}

/** The door shows a garment cutout when one exists; otherwise the cleanest mannequin photograph. */
export function setDoorImage(img: HTMLImageElement): void {
  const cut = tryOnDresses[0]?.cutout;
  if (cut) {
    img.src = cut.src;
    img.width = cut.w;
    img.height = cut.h;
    img.alt = tryOnDresses[0]!.name;
    return;
  }
  const fallback = byId('dlphhhgtwa') ?? dresses[0];
  if (!fallback) return;
  const im = fallback.images[0]!;
  img.src = im.src;
  img.srcset = srcset(im);
  img.width = im.w;
  img.height = im.h;
  img.alt = fallback.name;
}
