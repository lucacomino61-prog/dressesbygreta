/**
 * The Lookbook (/dyqani). Every dress is a spread: the photograph full height, its second photograph
 * and a caption with price, sizes and one black button. The contents view (?pamja=indeks) is the
 * lookbook's table of contents. The size index filters both.
 */
import { CATEGORIES, SIZES, SIZE_LETTER, formatLek, inStock, pad2, type Category, type Product, type Size } from '../../shared/catalog';
import { copy, href, type Lang } from '../../shared/copy';
import { html, raw, type Raw } from '../../shared/html';
import { SITE } from '../site';
import { flipId, folio, plate, price, sizePicker } from './parts';

export interface ShopState {
  size?: Size;
  category?: Category;
  view: 'spreads' | 'contents';
}

const params = (s: ShopState, over: Partial<ShopState> = {}) => {
  const n = { ...s, ...over };
  return { masa: n.size, kategoria: n.category, pamja: n.view === 'contents' ? 'indeks' : undefined };
};

/** Data the client needs to add a dress to the bag without another request. */
export const bagData = (p: Product) =>
  JSON.stringify({ id: p.id, slug: p.slug, name: p.name, price: p.price, cover: p.photos[0] ?? null, stock: p.stock });

function sizeIndex(lang: Lang, s: ShopState, counts: Record<Size, number>, cls: string): Raw {
  const t = copy[lang];
  return html`<nav class="${cls}" aria-label="${t.a11y.sizeIndex}">
    <a class="si${!s.size ? ' is-on' : ''}" href="${href('/dyqani', lang, params(s, { size: undefined }))}"${!s.size ? raw(' aria-current="true"') : ''}>
      <span class="si__n">${t.sizes.all}</span>
    </a>
    ${SIZES.map((size) => {
      const on = s.size === size;
      const n = counts[size];
      const inner = html`<span class="si__n">${size}</span><span class="si__l">${SIZE_LETTER[size]}</span><span class="si__c" aria-hidden="true">${n}</span><span class="sr-only">${t.sizes.label(size, SIZE_LETTER[size])}, ${t.sizes.count(n)}</span>`;
      return n > 0 || on
        ? html`<a class="si${on ? ' is-on' : ''}" href="${href('/dyqani', lang, params(s, { size }))}" data-size="${size}"${on ? raw(' aria-current="true"') : ''}>${inner}</a>`
        : html`<span class="si is-out" aria-disabled="true">${inner}</span>`;
    })}
    <a class="si si--views" href="${href('/dyqani', lang, params(s, { view: s.view === 'contents' ? 'spreads' : 'contents' }))}" data-view-toggle>
      <span class="si__n">${s.view === 'contents' ? t.shop.spreads : t.shop.contents}</span>
    </a>
  </nav>`;
}

function spread(p: Product, i: number, total: number, lang: Lang, s: ShopState): Raw {
  const t = copy[lang];
  const first = p.photos[0];
  const second = p.photos[1] ?? p.photos[0];
  const url = href(`/fustan/${p.slug}`, lang, { masa: s.size });
  const sold = !inStock(p);
  const sizes = SIZES.filter((k) => p.stock[k] > 0).join(' ');
  return html`<li class="spread" id="f-${p.slug}" data-sizes="${sizes}">
    <article class="spread__page" aria-labelledby="n-${p.id}">
      <a class="spread__main" href="${url}" tabindex="-1" aria-hidden="true" data-fly>
        ${plate(first, { alt: '', sizes: '(min-width: 1024px) 52vw, 100vw', eager: i === 0, target: 1600, flip: flipId(p), cls: 'spread__plate' })}
      </a>
      <div class="spread__side">
        ${plate(second, { alt: second?.alt || p.name, sizes: '(min-width: 1024px) 26vw, 1px', cls: 'spread__second' })}
        <form class="spread__cap" data-add data-product="${bagData(p)}" novalidate>
          <h2 class="spread__name" id="n-${p.id}"><a href="${url}" data-fly-link>${p.name}</a></h2>
          ${price(p, lang, 'price spread__price')}
          ${sold ? html`<p class="spread__sold">${t.shop.soldOut}</p>` : sizePicker(p, lang, `size-${p.id}`, s.size)}
          <button class="btn btn--wide" type="submit" data-add-btn${sold ? raw(' disabled') : ''}>${sold ? t.shop.soldOut : t.product.add}</button>
          <p class="spread__folio"><span class="spread__num" data-folio>${folio(i, total)}</span><a class="tlink" href="${url}" data-fly-link>${t.shop.open}</a></p>
        </form>
      </div>
    </article>
  </li>`;
}

function tocItem(p: Product, i: number, lang: Lang, s: ShopState): Raw {
  const url = href(`/fustan/${p.slug}`, lang, { masa: s.size });
  return html`<li class="toc__item">
    <a class="toc__link" href="${url}" data-fly-link>
      <span class="toc__num">${pad2(i + 1)}</span>
      ${plate(p.photos[0], { alt: '', sizes: '(min-width: 1024px) 15vw, (min-width: 768px) 24vw, 46vw', target: 480, flip: flipId(p), cls: 'toc__plate', tag: 'span' })}
      <span class="toc__name">${p.name}</span>
      <span class="toc__meta">
        <span class="toc__price">${p.price !== null ? formatLek(p.price, lang) : ''}</span>
        <span class="toc__sizes">${SIZES.map((k) => (p.stock[k] > 0 ? html`<span>${k}</span>` : html`<s>${k}</s>`))}</span>
      </span>
    </a>
  </li>`;
}

export function shopView(lang: Lang, all: Product[], s: ShopState): Raw {
  const t = copy[lang];
  const inCategory = s.category ? all.filter((p) => p.categories.includes(s.category!)) : all;
  const counts = Object.fromEntries(SIZES.map((k) => [k, inCategory.filter((p) => p.stock[k] > 0).length])) as Record<Size, number>;
  const list = s.size ? inCategory.filter((p) => p.stock[s.size!] > 0) : inCategory;
  const count = s.size ? t.shop.inSize(list.length, s.size) : t.shop.count(list.length);

  let body: Raw;
  if (!all.length) {
    body = html`<div class="lb-empty"><p class="body-lg">${t.shop.emptyAll}</p><a class="btn" href="${SITE.instagram}" target="_blank" rel="noopener">${t.nav.instagram}</a></div>`;
  } else if (!list.length) {
    body = html`<div class="lb-empty"><p class="body-lg">${s.size ? t.shop.empty(s.size) : t.shop.emptyAll}</p><a class="btn btn--line" href="${href('/dyqani', lang, params(s, { size: undefined, category: undefined }))}">${t.nav.all}</a></div>`;
  } else if (s.view === 'contents') {
    body = html`<ol class="toc" aria-label="${t.shop.contents}">${list.map((p, i) => tocItem(p, i, lang, s))}</ol>`;
  } else {
    body = html`<ol class="spreads" aria-label="${t.a11y.spreads}">${list.map((p, i) => spread(p, i, list.length, lang, s))}</ol>`;
  }

  return html`<div class="lookbook" data-lookbook data-view="${s.view}">
    <div class="lb-head">
        <h1 class="lb-title"><span>${t.shop.title}</span><span class="lb-title__count" data-lb-count>${count}</span></h1>
        <nav class="lb-cats" aria-label="${t.nav.shop}">
          <a class="chip${!s.category ? ' is-on' : ''}" href="${href('/dyqani', lang, params(s, { category: undefined }))}"${!s.category ? raw(' aria-current="true"') : ''}>${t.categories.all}</a>
          ${CATEGORIES.map(
            (c) =>
              html`<a class="chip${s.category === c ? ' is-on' : ''}" href="${href('/dyqani', lang, params(s, { category: c }))}"${s.category === c ? raw(' aria-current="true"') : ''}>${t.categories[c]}</a>`,
          )}
        </nav>
    </div>
    ${sizeIndex(lang, s, counts, 'size-strip')}
    <div class="lb-body">
      ${body}
      ${sizeIndex(lang, s, counts, 'size-index')}
    </div>
  </div>`;
}
