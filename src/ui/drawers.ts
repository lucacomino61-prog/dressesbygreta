/**
 * Menu (left), bag (right), search (top) drawers and the follow popup. All native <dialog>
 * elements; GSAP slides them in and out (one engine). Escape and the backdrop close them.
 */
import { gsap } from 'gsap';
import { copy, type Lang } from '../copy';
import { dresses, categories, byId, type Dress, type Category } from '../data/catalog';
import { site } from '../data/site';
import { bag } from './bag';
import { reducedMotion } from '../motion';

export type Filter = Category | 'all';

export interface DrawerHost {
  setFilter(f: Filter): void;
  setLang(l: Lang): void;
  lang(): Lang;
}

const SIDE = { menu: 'left', bag: 'right', search: 'top' } as const;

export class Drawers {
  private menu: HTMLDialogElement;
  private bagEl: HTMLDialogElement;
  private search: HTMLDialogElement;
  private opener: Element | null = null;
  private t = copy.sq;

  constructor(
    private host: DrawerHost,
    parent: HTMLElement,
  ) {
    this.menu = this.make('menu', parent);
    this.bagEl = this.make('bag', parent);
    this.search = this.make('search', parent);
    this.buildMenu();
    this.buildBag();
    this.buildSearch();
    document.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-open]');
      if (b) this.open(b.dataset.open as keyof typeof SIDE, b);
    });
    bag.subscribe((ids) => this.renderBag(ids));
  }

  /* ------------------------------ generic drawer ------------------------------ */

  private make(kind: keyof typeof SIDE, parent: HTMLElement): HTMLDialogElement {
    const d = document.createElement('dialog');
    d.className = `drawer drawer--${SIDE[kind]}`;
    d.dataset.kind = kind;
    d.innerHTML = `
      <div class="drawer__bar">
        <p class="drawer__title" data-title></p>
        <button class="drawer__close" type="button" data-close></button>
      </div>
      <div class="drawer__body" data-body></div>
      <div class="drawer__foot" data-foot hidden></div>`;
    parent.appendChild(d);
    d.querySelector('[data-close]')!.addEventListener('click', () => this.close(d));
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      void this.close(d);
    });
    d.addEventListener('click', (e) => {
      if (e.target === d) void this.close(d); // backdrop
    });
    return d;
  }

  private el(kind: keyof typeof SIDE): HTMLDialogElement {
    return kind === 'menu' ? this.menu : kind === 'bag' ? this.bagEl : this.search;
  }

  open(kind: keyof typeof SIDE, opener?: Element): void {
    const d = this.el(kind);
    if (d.open) return;
    for (const other of [this.menu, this.bagEl, this.search]) if (other.open && other !== d) other.close();
    this.opener = opener ?? document.activeElement;
    d.showModal();
    document.documentElement.classList.add('drawer-open');
    const side = SIDE[kind];
    const from = side === 'left' ? { xPercent: -100 } : side === 'right' ? { xPercent: 100 } : { yPercent: -100 };
    if (!reducedMotion()) gsap.fromTo(d, from, { xPercent: 0, yPercent: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform' });
    if (kind === 'search') (d.querySelector('input') as HTMLInputElement | null)?.focus();
    else (d.querySelector('[data-close]') as HTMLElement).focus();
  }

  async close(d: HTMLDialogElement): Promise<void> {
    if (!d.open) return;
    const side = SIDE[d.dataset.kind as keyof typeof SIDE];
    const to = side === 'left' ? { xPercent: -100 } : side === 'right' ? { xPercent: 100 } : { yPercent: -100 };
    if (!reducedMotion()) await gsap.to(d, { ...to, duration: 0.26, ease: 'power3.in' });
    d.close();
    gsap.set(d, { clearProps: 'transform' });
    document.documentElement.classList.remove('drawer-open');
    (this.opener as HTMLElement | null)?.focus?.();
    this.opener = null;
  }

  closeAll(): void {
    for (const d of [this.menu, this.bagEl, this.search]) if (d.open) void this.close(d);
  }

  /* ---------------------------------- menu ---------------------------------- */

  private buildMenu(): void {
    const body = this.menu.querySelector('[data-body]')!;
    body.innerHTML = `
      <nav class="menu" aria-label="Menu">
        <div class="menu__group">
          <button class="menu__parent" type="button" data-filter="all" data-t="nav.dresses">Fustanet</button>
          <div data-menu-cats></div>
        </div>
        <div class="menu__group">
          <a class="menu__parent" href="#visit" data-go data-t="nav.shop">Dyqani</a>
        </div>
        <div class="menu__group">
          <a class="menu__parent" href="${site.instagram}" target="_blank" rel="noopener" data-t="nav.instagram">Instagram</a>
        </div>
        <div class="menu__region">
          <p class="menu__parent" data-t="nav.region">Rajoni dhe gjuha</p>
          <div class="menu__lang" role="group">
            <button type="button" data-set-lang="sq">Shqip</button>
            <button type="button" data-set-lang="en">English</button>
          </div>
        </div>
        <div class="menu__group">
          <button class="menu__parent" type="button" data-open="search" data-t="nav.search">Kërko</button>
        </div>
      </nav>`;
    const cats = body.querySelector('[data-menu-cats]')!;
    for (const c of categories.filter((c) => c.key !== 'all')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'menu__child';
      b.dataset.filter = c.key;
      b.dataset.t = `catalog.filters.${c.key}`;
      b.textContent = c.label;
      cats.appendChild(b);
    }
    body.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const f = t.closest<HTMLElement>('[data-filter]');
      if (f) {
        this.host.setFilter(f.dataset.filter as Filter);
        void this.close(this.menu).then(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }));
        return;
      }
      if (t.closest('[data-go]')) {
        void this.close(this.menu);
        return;
      }
      const l = t.closest<HTMLElement>('[data-set-lang]');
      if (l) {
        this.host.setLang(l.dataset.setLang as Lang);
        return;
      }
    });
  }

  /* ---------------------------------- bag ----------------------------------- */

  private buildBag(): void {
    const foot = this.bagEl.querySelector<HTMLElement>('[data-foot]')!;
    foot.innerHTML = `
      <p class="small" data-t="bag.hint"></p>
      <button class="btn btn--line btn--wide" type="button" data-copy></button>
      <a class="btn btn--wide" href="${site.message}" target="_blank" rel="noopener" data-t="bag.ask"></a>`;
    foot.querySelector('[data-copy]')!.addEventListener('click', async (e) => {
      const b = e.currentTarget as HTMLButtonElement;
      const names = bag
        .ids()
        .map((id) => byId(id))
        .filter((d): d is Dress => !!d)
        .map((d) => `${d.name}  ${d.permalink}`)
        .join('\n');
      try {
        await navigator.clipboard.writeText(names);
        b.textContent = this.t.bag.copied;
        setTimeout(() => (b.textContent = this.t.bag.copy), 2200);
      } catch {
        b.textContent = this.t.bag.copy;
      }
    });
    this.bagEl.querySelector('[data-body]')!.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const rm = t.closest<HTMLElement>('[data-remove]');
      if (rm) bag.remove(rm.dataset.remove!);
      if (t.closest('[data-continue]')) void this.close(this.bagEl);
    });
  }

  private renderBag(ids: string[]): void {
    const body = this.bagEl.querySelector<HTMLElement>('[data-body]')!;
    const foot = this.bagEl.querySelector<HTMLElement>('[data-foot]')!;
    const t = this.t.bag;
    document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((c) => (c.textContent = ids.length ? `(${ids.length})` : ''));
    document.querySelectorAll<HTMLElement>('[data-bag]').forEach((b) => {
      const on = ids.includes(b.dataset.bag!);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? t.added : t.add;
    });
    if (!ids.length) {
      body.innerHTML = `
        <div class="bag__empty">
          <p class="ui">${t.empty}</p>
          <p class="body muted">${t.emptyBody}</p>
          <button class="btn btn--line" type="button" data-continue>${t.continue}</button>
        </div>`;
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = `<div class="bag">${ids
      .map((id) => byId(id))
      .filter((d): d is Dress => !!d)
      .map(
        (d) => `
        <div class="bag__item">
          <img src="${d.images[0]!.sm}" alt="" loading="lazy" decoding="async" />
          <div class="bag__meta">
            <span>${d.name}</span>
            <div class="bag__acts">
              <a href="${d.permalink}" target="_blank" rel="noopener">${this.t.catalog.view}</a>
              <button type="button" data-remove="${d.id}">${t.remove}</button>
            </div>
          </div>
        </div>`,
      )
      .join('')}</div>`;
  }

  /* --------------------------------- search --------------------------------- */

  private buildSearch(): void {
    const body = this.search.querySelector<HTMLElement>('[data-body]')!;
    body.classList.remove('drawer__body');
    body.innerHTML = `
      <form class="search__form" role="search" data-form>
        <input class="search__input" type="search" name="q" autocomplete="off" data-t-placeholder="search.placeholder" />
        <button class="btn btn--line" type="button" data-clear data-t="search.clear">Fshi</button>
      </form>
      <p class="search__status small" data-status></p>
      <div class="search__results" data-results></div>`;
    const input = body.querySelector<HTMLInputElement>('input')!;
    const results = body.querySelector<HTMLElement>('[data-results]')!;
    const status = body.querySelector<HTMLElement>('[data-status]')!;
    const run = () => {
      const q = input.value.trim().toLowerCase();
      const hits = q ? dresses.filter((d) => `${d.name} ${d.color} ${d.cats.join(' ')}`.toLowerCase().includes(q)) : dresses.slice(0, 12);
      status.textContent = q ? (hits.length ? this.t.search.results(hits.length) : this.t.search.none) : '';
      results.innerHTML = hits
        .slice(0, 24)
        .map(
          (d) => `
          <div class="tile">
            <a class="tile__media" href="${d.permalink}" target="_blank" rel="noopener"><span class="tile__well"><img src="${d.images[0]!.sm}" alt="${d.name}" loading="lazy" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" /></span></a>
            <div class="tile__cap"><span class="tile__name">${d.name}</span></div>
          </div>`,
        )
        .join('');
    };
    input.addEventListener('input', run);
    body.querySelector('[data-form]')!.addEventListener('submit', (e) => {
      e.preventDefault();
      run();
    });
    body.querySelector('[data-clear]')!.addEventListener('click', () => {
      input.value = '';
      run();
      input.focus();
    });
    run();
  }

  /* --------------------------------- popup ---------------------------------- */

  /** The follow card, once per session, after the visitor has had a moment with the page. */
  schedulePopup(delayMs = 7000): void {
    let seen = false;
    try {
      seen = sessionStorage.getItem('greta-follow') === '1';
    } catch {
      seen = false;
    }
    if (seen) return;
    setTimeout(() => {
      if (document.querySelector('dialog[open]')) return; // never over a drawer
      const p = document.createElement('dialog');
      p.className = 'popup';
      p.innerHTML = `
        <button class="popup__close" type="button" data-close aria-label="${this.t.popup.close}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>
        <p class="wordmark">${this.t.hero.wordmark}</p>
        <p class="popup__lead">${this.t.popup.lead}</p>
        <p class="small">${this.t.popup.body}</p>
        <a class="btn btn--wide" href="${site.instagram}" target="_blank" rel="noopener">${this.t.popup.cta}</a>`;
      document.body.appendChild(p);
      const done = () => {
        try {
          sessionStorage.setItem('greta-follow', '1');
        } catch {
          /* private mode: show again next visit, harmless */
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
      (p.querySelector('a') as HTMLElement).focus({ preventScroll: true });
      if (!reducedMotion()) gsap.fromTo(p, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', clearProps: 'transform' });
    }, delayMs);
  }

  /* ---------------------------------- copy ---------------------------------- */

  setLang(lang: Lang): void {
    this.t = copy[lang];
    this.menu.querySelector('[data-title]')!.textContent = this.t.nav.menu;
    this.bagEl.querySelector('[data-title]')!.textContent = this.t.nav.bag;
    this.search.querySelector('[data-title]')!.textContent = this.t.search.title;
    for (const d of [this.menu, this.bagEl, this.search]) {
      d.querySelector('[data-close]')!.textContent = this.t.nav.close;
      d.setAttribute('aria-label', d.querySelector('[data-title]')!.textContent || '');
    }
    this.menu.querySelectorAll<HTMLButtonElement>('[data-set-lang]').forEach((b) => {
      const on = b.dataset.setLang === lang;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const copyBtn = this.bagEl.querySelector('[data-copy]');
    if (copyBtn) copyBtn.textContent = this.t.bag.copy;
    this.renderBag(bag.ids());
  }
}
