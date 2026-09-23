/**
 * Menu (left), bag (right), search (top) drawers and the follow card. All native <dialog>
 * elements; GSAP slides them (one engine). Escape and the backdrop close them; focus returns.
 */
import { CATEGORIES, SIZES, SIZE_LETTER, formatLek, photoAt } from '../shared/catalog';
import { copy, href, type Lang } from '../shared/copy';
import { esc, html, raw } from '../shared/html';
import { bag, catalogue, type Line } from './bag';
import { gsap, reducedMotion } from './motion';

const SIDE = { menu: 'left', bag: 'right', search: 'top' } as const;
type Kind = keyof typeof SIDE;
const INSTAGRAM = 'https://www.instagram.com/dressesbygreta/';

export class Drawers {
  private d: Record<Kind, HTMLDialogElement>;
  private opener: Element | null = null;

  constructor(private lang: Lang) {
    this.d = { menu: this.make('menu'), bag: this.make('bag'), search: this.make('search') };
    this.buildMenu();
    this.buildSearch();
    document.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-open]');
      if (b && !b.closest('dialog')) {
        e.preventDefault();
        this.open(b.dataset.open as Kind, b);
      }
    });
    bag.subscribe((lines) => this.renderBag(lines));
  }

  private get t() {
    return copy[this.lang];
  }

  private make(kind: Kind): HTMLDialogElement {
    const d = document.createElement('dialog');
    d.className = `drawer drawer--${SIDE[kind]}`;
    d.dataset.kind = kind;
    const title = kind === 'menu' ? this.t.nav.menu : kind === 'bag' ? this.t.bag.title : this.t.search.title;
    d.setAttribute('aria-label', title);
    d.innerHTML = html`<div class="drawer__bar">
        <p class="drawer__title">${title}</p>
        <button class="drawer__close" type="button" data-close>${this.t.nav.close}</button>
      </div>
      <div class="drawer__body" data-body></div>
      <div class="drawer__foot" data-foot hidden></div>`.value;
    document.body.appendChild(d);
    d.querySelector('[data-close]')!.addEventListener('click', () => void this.close(d));
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      void this.close(d);
    });
    d.addEventListener('click', (e) => {
      if (e.target === d) return void this.close(d); // the backdrop
      // Links inside a drawer navigate; the drawer steps out of the way first.
      const a = (e.target as Element).closest('a[href]');
      if (a?.getAttribute('aria-disabled') === 'true') return e.preventDefault();
      if (a && !a.hasAttribute('target')) void this.close(d, false);
    });
    return d;
  }

  open(kind: Kind, opener?: Element): void {
    const d = this.d[kind];
    if (d.open) return;
    for (const other of Object.values(this.d)) if (other.open && other !== d) other.close();
    this.opener = opener ?? document.activeElement;
    if (kind === 'bag') void bag.refresh(this.lang);
    d.showModal();
    document.documentElement.classList.add('drawer-open');
    const side = SIDE[kind];
    const from = side === 'left' ? { xPercent: -100 } : side === 'right' ? { xPercent: 100 } : { yPercent: -100 };
    if (!reducedMotion()) gsap.fromTo(d, from, { xPercent: 0, yPercent: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform' });
    if (kind === 'search') {
      d.querySelector<HTMLInputElement>('input')?.focus();
      void this.runSearch();
    } else d.querySelector<HTMLElement>('[data-close]')?.focus();
  }

  async close(d: HTMLDialogElement, restoreFocus = true): Promise<void> {
    if (!d.open) return;
    const side = SIDE[d.dataset.kind as Kind];
    const to = side === 'left' ? { xPercent: -100 } : side === 'right' ? { xPercent: 100 } : { yPercent: -100 };
    if (!reducedMotion()) await gsap.to(d, { ...to, duration: 0.26, ease: 'power3.in' });
    d.close();
    gsap.set(d, { clearProps: 'transform' });
    document.documentElement.classList.remove('drawer-open');
    if (restoreFocus) (this.opener as HTMLElement | null)?.focus?.();
    this.opener = null;
  }

  closeAll(): void {
    for (const d of Object.values(this.d)) if (d.open) void this.close(d, false);
  }

  /* ------------------------------------------------------------ menu ------------------------------------------------------------ */

  private buildMenu(): void {
    const t = this.t;
    const l = this.lang;
    const other: Lang = l === 'sq' ? 'en' : 'sq';
    const here = new URL(location.href);
    here.searchParams.delete('lang');
    if (other === 'en') here.searchParams.set('lang', 'en');
    this.d.menu.querySelector('[data-body]')!.innerHTML = html`<nav class="menu" aria-label="${t.nav.menu}">
      <div class="menu__group">
        <a class="menu__parent" href="${href('/dyqani', l)}">${t.nav.lookbook}</a>
        ${CATEGORIES.map((c) => html`<a class="menu__child" href="${href('/dyqani', l, { kategoria: c })}">${t.categories[c]}</a>`)}
      </div>
      <div class="menu__group">
        <p class="menu__parent">${t.nav.bySize}</p>
        <div class="menu__sizes">
          ${SIZES.map((s) => html`<a class="menu__size" href="${href('/dyqani', l, { masa: s })}" aria-label="${t.sizes.label(s, SIZE_LETTER[s])}"><span>${s}</span><span>${SIZE_LETTER[s]}</span></a>`)}
        </div>
      </div>
      <div class="menu__group">
        <a class="menu__parent" href="${href('/', l)}#visit">${t.nav.visit}</a>
        <a class="menu__parent" href="${INSTAGRAM}" target="_blank" rel="noopener">${t.nav.instagram}</a>
        <button class="menu__parent" type="button" data-menu-search>${t.nav.search}</button>
      </div>
      <div class="menu__region">
        <p class="menu__parent">${t.nav.region}</p>
        <div class="menu__lang">
          <a href="${l === 'sq' ? location.href : here.href}" class="${l === 'sq' ? 'is-on' : ''}" lang="sq" hreflang="sq" data-no-router data-lang-link="sq">Shqip</a>
          <a href="${l === 'en' ? location.href : here.href}" class="${l === 'en' ? 'is-on' : ''}" lang="en" hreflang="en" data-no-router data-lang-link="en">English</a>
        </div>
      </div>
    </nav>`.value;
    this.d.menu.querySelector('[data-menu-search]')!.addEventListener('click', () => {
      this.d.menu.close();
      document.documentElement.classList.remove('drawer-open');
      this.open('search');
    });
  }

  /** The language links point at the current page; call after every navigation. */
  syncLanguageLinks(): void {
    const other = new URL(location.href);
    other.searchParams.delete('lang');
    if (this.lang === 'sq') other.searchParams.set('lang', 'en');
    this.d.menu.querySelectorAll<HTMLAnchorElement>('[data-lang-link]').forEach((a) => {
      a.href = a.dataset.langLink === this.lang ? location.href : other.href;
    });
  }

  /* ------------------------------------------------------------- bag ------------------------------------------------------------ */

  private renderBag(lines: Line[]): void {
    const t = this.t;
    const l = this.lang;
    const n = lines.reduce((s, x) => s + x.qty, 0);
    document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((c) => (c.textContent = n ? `(${n})` : ''));
    const body = this.d.bag.querySelector<HTMLElement>('[data-body]')!;
    const foot = this.d.bag.querySelector<HTMLElement>('[data-foot]')!;
    if (!lines.length) {
      body.innerHTML = html`<div class="bag__empty">
        <p class="ui">${t.bag.empty}</p>
        <p class="body muted">${t.bag.emptyBody}</p>
        <a class="btn btn--line" href="${href('/dyqani', l)}">${t.bag.browse}</a>
      </div>`.value;
      foot.hidden = true;
      return;
    }
    body.innerHTML = html`<ul class="bag">${lines.map((x) => {
      const url = href(`/fustan/${x.snap.slug}`, l);
      const cap = Math.min(5, x.snap.stock[x.size] ?? 0);
      return html`<li class="bag__item${x.gone ? ' is-gone' : ''}">
        <a href="${url}" class="bag__thumb" tabindex="-1" aria-hidden="true">${x.snap.cover ? html`<img src="${photoAt(x.snap.cover, 480)}" alt="" width="72" height="96" loading="lazy" decoding="async" />` : ''}</a>
        <div class="bag__meta">
          <a class="bag__name" href="${url}">${x.snap.name}</a>
          <span class="bag__row"><span>${t.bag.size} ${x.size} (${SIZE_LETTER[x.size]})</span><span class="bag__price">${x.snap.price !== null ? formatLek(x.snap.price * x.qty, l) : ''}</span></span>
          ${x.gone
            ? html`<span class="bag__warn">${t.bag.unavailable}</span>`
            : html`<span class="qty" role="group" aria-label="${t.bag.qty}">
                <button type="button" data-qty="-1" data-id="${x.id}" data-size="${x.size}" aria-label="${t.a11y.qtyDown}"${x.qty <= 1 ? ' disabled' : ''}>&minus;</button>
                <span class="qty__n" aria-live="polite">${x.qty}</span>
                <button type="button" data-qty="1" data-id="${x.id}" data-size="${x.size}" aria-label="${t.a11y.qtyUp}"${x.qty >= cap ? ' disabled' : ''}>+</button>
              </span>
              ${x.qty >= cap && cap <= 2 ? html`<span class="bag__note">${t.bag.onlyLeft(cap)}</span>` : ''}`}
          <button class="bag__remove" type="button" data-remove data-id="${x.id}" data-size="${x.size}">${t.bag.remove}</button>
        </div>
      </li>`;
    })}</ul>`.value;
    const blocked = lines.some((x) => x.gone);
    foot.hidden = false;
    foot.innerHTML = html`<div class="bag__sum"><span>${t.bag.subtotal}</span><span>${formatLek(bag.subtotal(), l)}</span></div>
      <p class="small">${t.bag.note}</p>
      <a class="btn btn--wide${blocked ? ' is-blocked' : ''}" href="${href('/porosia', l)}"${blocked ? raw(' aria-disabled="true"') : ''}>${t.bag.checkout}</a>`.value;
    body.querySelectorAll<HTMLButtonElement>('[data-qty]').forEach((b) =>
      b.addEventListener('click', () => {
        const line = lines.find((x) => x.id === b.dataset.id && x.size === b.dataset.size);
        if (line) bag.setQty(line.id, line.size, line.qty + Number(b.dataset.qty));
      }),
    );
    body.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((b) =>
      b.addEventListener('click', () => {
        const line = lines.find((x) => x.id === b.dataset.id && x.size === b.dataset.size);
        if (line) bag.remove(line.id, line.size);
      }),
    );
  }

  /* ----------------------------------------------------------- search ----------------------------------------------------------- */

  private buildSearch(): void {
    const t = this.t;
    const body = this.d.search.querySelector<HTMLElement>('[data-body]')!;
    body.classList.remove('drawer__body');
    body.innerHTML = html`<form class="search__form" role="search" data-form>
        <input class="search__input" type="search" name="q" autocomplete="off" placeholder="${t.search.placeholder}" aria-label="${t.search.title}" />
        <button class="btn btn--line" type="button" data-clear>${t.search.clear}</button>
      </form>
      <p class="search__status small" data-status aria-live="polite"></p>
      <div class="search__results" data-results></div>`.value;
    const input = body.querySelector<HTMLInputElement>('input')!;
    input.addEventListener('input', () => void this.runSearch());
    body.querySelector('[data-form]')!.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.runSearch();
    });
    body.querySelector('[data-clear]')!.addEventListener('click', () => {
      input.value = '';
      void this.runSearch();
      input.focus();
    });
  }

  private async runSearch(): Promise<void> {
    const t = this.t;
    const l = this.lang;
    const body = this.d.search;
    const q = (body.querySelector<HTMLInputElement>('input')?.value ?? '').trim().toLowerCase();
    const status = body.querySelector<HTMLElement>('[data-status]')!;
    const results = body.querySelector<HTMLElement>('[data-results]')!;
    let list;
    try {
      list = await catalogue(l);
    } catch {
      status.textContent = '';
      return;
    }
    const cats = copy[l].categories as Record<string, string>;
    const hits = q ? list.filter((p) => `${p.name} ${p.color} ${p.categories.map((c) => `${c} ${cats[c] ?? ''}`).join(' ')}`.toLowerCase().includes(q)) : list.slice(0, 12);
    status.textContent = q ? (hits.length ? t.search.results(hits.length) : t.search.none) : '';
    results.innerHTML = hits
      .slice(0, 24)
      .map(
        (p) => `<a class="search__hit" href="${esc(href(`/fustan/${p.slug}`, l))}">
          <span class="search__well">${p.cover ? `<img src="${esc(photoAt(p.cover, 480))}" alt="" loading="lazy" decoding="async" />` : ''}</span>
          <span class="search__name">${esc(p.name)}</span>
          <span class="search__price">${p.price !== null ? esc(formatLek(p.price, l)) : ''}</span>
        </a>`,
      )
      .join('');
  }

  /* ------------------------------------------------------------ popup ----------------------------------------------------------- */

  /** The follow card: once per session, after a moment, never over a drawer or during checkout. */
  schedulePopup(delayMs = 9000): void {
    try {
      if (sessionStorage.getItem('greta-follow') === '1') return;
    } catch {
      return;
    }
    window.setTimeout(() => {
      const kind = document.querySelector<HTMLElement>('main')?.dataset.page;
      if (document.querySelector('dialog[open]') || kind === 'checkout' || kind === 'confirmation' || kind === 'pay') return;
      const t = this.t;
      const p = document.createElement('dialog');
      p.className = 'popup';
      p.setAttribute('aria-label', t.popup.lead);
      p.innerHTML = html`<button class="popup__close" type="button" data-close aria-label="${t.popup.close}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.2" /></svg>
        </button>
        <p class="wordmark">${t.hero.wordmark}</p>
        <p class="popup__lead">${t.popup.lead}</p>
        <p class="small">${t.popup.body}</p>
        <a class="btn btn--wide" href="${INSTAGRAM}" target="_blank" rel="noopener">${t.popup.cta}</a>`.value;
      document.body.appendChild(p);
      const done = () => {
        try {
          sessionStorage.setItem('greta-follow', '1');
        } catch {
          /* shown again next visit; harmless */
        }
        p.close();
        p.remove();
      };
      p.querySelector('[data-close]')!.addEventListener('click', done);
      p.querySelector('a')!.addEventListener('click', done);
      p.addEventListener('cancel', (e) => {
        e.preventDefault();
        done();
      });
      p.addEventListener('click', (e) => {
        if (e.target === p) done();
      });
      p.showModal();
      p.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
      if (!reducedMotion()) gsap.fromTo(p, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', clearProps: 'transform' });
    }, delayMs);
  }
}
