/** What each server-rendered page does once it is on screen (first load and every swap). */
import { SIZE_LETTER, formatLek, isSize, photoAt, type Zone } from '../shared/catalog';
import { copy, href, type Lang } from '../shared/copy';
import { esc } from '../shared/html';
import { bag, type Snap } from './bag';
import type { Drawers } from './drawers';
import { dropIntoBag, gsap, pageMotion, reducedMotion } from './motion';
import { navigate, type PageInit } from './router';

interface ProductData extends Snap {
  id: string;
}

export function initPage(lang: Lang, drawers: Drawers): PageInit {
  return (main, arrivedByFlight) => {
    const offs: (() => void)[] = [];
    pageMotion(main, { arrivedByFlight });
    main.querySelectorAll<HTMLFormElement>('form[data-add]').forEach((f) => addForm(f, lang));
    const kind = main.dataset.page;
    if (kind === 'product') offs.push(productPage(main, lang));
    if (kind === 'checkout') offs.push(checkoutPage(main, lang));
    if (kind === 'confirmation') confirmationPage(main);
    if (kind === 'pay') payPage(main);
    drawers.syncLanguageLinks();
    return () => offs.forEach((off) => off());
  };
}

/* --------------------------------------------------------------- add to bag --------------------------------------------------------------- */

function addForm(form: HTMLFormElement, lang: Lang): void {
  const t = copy[lang];
  let data: ProductData;
  try {
    data = JSON.parse(form.dataset.product ?? '') as ProductData;
  } catch {
    return;
  }
  const btn = form.querySelector<HTMLButtonElement>('[data-add-btn]');
  const hint = form.querySelector<HTMLElement>('[data-pick-hint]');
  const say = (text: string) => {
    if (hint) hint.textContent = text;
  };
  let timer = 0;
  const label = (text: string) => {
    if (!btn) return;
    btn.textContent = text;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => (btn.textContent = t.product.add), 1600);
  };

  form.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement;
    if (r.type !== 'radio') return;
    say(r.dataset.left === '1' ? t.product.lastOne : '');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const picked = form.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    if (!picked || !isSize(picked.value)) {
      say(t.product.chooseSize);
      label(t.product.chooseSize);
      form.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)')?.focus();
      if (!reducedMotion()) gsap.fromTo(form.querySelector('.pick__row'), { x: -4 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    const { id, ...snap } = data;
    if (!bag.add(id, picked.value, snap)) {
      say(t.bag.onlyLeft(Number(picked.dataset.left ?? 0)));
      return;
    }
    const card = form.closest('.spread, .product');
    const plate = card?.querySelector<HTMLElement>('.spread__plate, .product__plate') ?? null;
    dropIntoBag(plate);
    label(t.product.added);
    say('');
  });
}

/* ----------------------------------------------------------------- product ---------------------------------------------------------------- */

function productPage(main: HTMLElement, lang: Lang): () => void {
  const t = copy[lang];
  const observers: IntersectionObserver[] = [];
  const counter = main.querySelector<HTMLElement>('[data-gallery-i]');
  const gallery = main.querySelector<HTMLElement>('[data-gallery]');
  if (counter && gallery) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.isIntersecting) counter.textContent = String([...gallery.children].indexOf(en.target) + 1);
      },
      { root: gallery, threshold: 0.6 },
    );
    [...gallery.children].forEach((li) => io.observe(li));
    observers.push(io);
  }

  const form = main.querySelector<HTMLFormElement>('.product__form');
  const bar = main.querySelector<HTMLElement>('[data-buybar]');
  if (form && bar) {
    const io = new IntersectionObserver(([en]) => {
      const show = !!en && !en.isIntersecting && en.boundingClientRect.top < 0;
      if (show === !bar.hidden) return;
      bar.hidden = !show;
      if (show && !reducedMotion()) gsap.fromTo(bar, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'expo.out' });
    });
    io.observe(form);
    observers.push(io);
    bar.querySelector('[data-buybar-btn]')?.addEventListener('click', () => {
      if (form.querySelector('input[type="radio"]:checked')) return form.requestSubmit();
      form.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
      const hint = form.querySelector<HTMLElement>('[data-pick-hint]');
      if (hint) hint.textContent = t.product.chooseSize;
      window.setTimeout(() => form.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)')?.focus({ preventScroll: true }), 400);
    });
  }
  return () => observers.forEach((o) => o.disconnect());
}

/* ----------------------------------------------------------------- checkout --------------------------------------------------------------- */

const PHONE_RE = /^\+?[\d\s()./-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function orderRef(): string {
  const sig = bag.lines().map((l) => `${l.id}:${l.size}:${l.qty}`).join('|');
  try {
    const saved = JSON.parse(sessionStorage.getItem('greta-order-ref') ?? 'null') as { sig: string; ref: string } | null;
    if (saved && saved.sig === sig) return saved.ref;
    const ref = crypto.randomUUID();
    sessionStorage.setItem('greta-order-ref', JSON.stringify({ sig, ref }));
    return ref;
  } catch {
    return crypto.randomUUID();
  }
}

function checkoutPage(main: HTMLElement, lang: Lang): () => void {
  const t = copy[lang];
  const tc = t.checkout;
  const root = main.querySelector<HTMLElement>('[data-checkout]');
  const form = main.querySelector<HTMLFormElement>('[data-co-form]');
  if (!root || !form) return () => undefined;
  const zones = JSON.parse(root.dataset.zones ?? '[]') as Pick<Zone, 'id' | 'fee'>[];
  const grid = root.querySelector<HTMLElement>('[data-co-grid]')!;
  const empty = root.querySelector<HTMLElement>('[data-co-empty]')!;
  const items = root.querySelector<HTMLElement>('[data-co-items]')!;
  const errorBox = root.querySelector<HTMLElement>('[data-co-error]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-co-submit]')!;

  const zoneFee = (): number | null => {
    const id = (form.elements.namedItem('zone') as RadioNodeList | null)?.value;
    return zones.find((z) => z.id === id)?.fee ?? null;
  };

  const render = () => {
    const lines = bag.lines();
    empty.hidden = lines.length > 0;
    grid.hidden = lines.length === 0;
    items.innerHTML = lines
      .map((l) => {
        const img = l.snap.cover ? `<img src="${esc(photoAt(l.snap.cover, 480))}" alt="" width="56" height="75" loading="lazy" decoding="async" />` : '<span></span>';
        const total = l.snap.price !== null ? formatLek(l.snap.price * l.qty, lang) : '';
        return `<li class="co-item${l.gone ? ' is-gone' : ''}">${img}<span class="co-item__meta"><span class="ui">${esc(l.snap.name)}</span><span class="small">${esc(
          `${t.bag.size} ${l.size} (${SIZE_LETTER[l.size]}) · ${t.bag.qty} ${l.qty}`,
        )}</span>${l.gone ? `<span class="bag__warn">${esc(t.bag.unavailable)}</span>` : ''}</span><span class="ui">${esc(total)}</span></li>`;
      })
      .join('');
    const sub = bag.subtotal();
    const fee = zoneFee();
    root.querySelector('[data-co-subtotal]')!.textContent = formatLek(sub, lang);
    root.querySelector('[data-co-shipping]')!.textContent = fee === null ? tc.shippingTbc : fee === 0 ? tc.shippingFree : formatLek(fee, lang);
    root.querySelector('[data-co-total]')!.textContent = formatLek(sub + (fee ?? 0), lang);
    submit.disabled = lines.some((l) => l.gone);
  };

  const off = bag.subscribe(render);
  void bag.refresh(lang);
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).name === 'zone') render();
  });

  const fieldError = (name: string, message: string | null) => {
    const wrap = form.querySelector<HTMLElement>(`[data-field="${name}"]`);
    const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
    const err = wrap?.querySelector<HTMLElement>('.field__error');
    if (!wrap || !err) return;
    err.hidden = !message;
    err.textContent = message ?? '';
    if (input) {
      input.toggleAttribute('aria-invalid', Boolean(message));
      const ids = [input.id + '-hint', input.id + '-error'].filter((id) => form.querySelector(`#${CSS.escape(id)}`) && (id.endsWith('-hint') || message));
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    }
  };

  form.addEventListener('input', (e) => fieldError((e.target as HTMLInputElement).name, null));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    const val = (n: string) => ((form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? '').trim();
    const problems: [string, string][] = [];
    if (val('name').length < 2) problems.push(['name', tc.required]);
    const phone = val('phone');
    const digits = phone.replace(/\D/g, '');
    if (!phone) problems.push(['phone', tc.required]);
    else if (!PHONE_RE.test(phone) || digits.length < 8 || digits.length > 15) problems.push(['phone', tc.phoneInvalid]);
    const email = val('email');
    if (email && !EMAIL_RE.test(email)) problems.push(['email', tc.emailInvalid]);
    if (val('city').length < 2) problems.push(['city', tc.required]);
    if (val('address').length < 5) problems.push(['address', tc.required]);
    ['name', 'phone', 'email', 'city', 'address'].forEach((n) => fieldError(n, problems.find(([k]) => k === n)?.[1] ?? null));
    if (problems.length) {
      form.querySelector<HTMLElement>(`[name="${problems[0]![0]}"]`)?.focus();
      return;
    }
    const lines = bag.lines();
    if (!lines.length || lines.some((l) => l.gone)) return;

    submit.disabled = true;
    submit.textContent = tc.placing;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ref: orderRef(),
          items: lines.map((l) => ({ id: l.id, size: l.size, qty: l.qty })),
          name: val('name'),
          phone,
          email,
          zone: val('zone') || (form.elements.namedItem('zone') as RadioNodeList | null)?.value,
          city: val('city'),
          address: val('address'),
          notes: val('notes'),
          payment: (form.elements.namedItem('payment') as RadioNodeList | null)?.value ?? 'cod',
          website: val('website'),
          lang,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; payUrl?: string | null; error?: string; fields?: { field: string }[]; unavailable?: { name: string; size: string }[] };
      if (res.ok && body.id) {
        try {
          sessionStorage.removeItem('greta-order-ref');
        } catch {
          /* ignore */
        }
        if (body.payUrl) {
          location.href = body.payUrl;
          return;
        }
        bag.clear();
        navigate(href(`/porosia/${body.id}`, lang));
        return;
      }
      if (res.status === 409 && body.unavailable?.length) {
        errorBox.textContent = body.unavailable.map((u) => tc.soldOut(u.name, u.size)).join(' ');
        void bag.refresh(lang);
      } else if (res.status === 400 && body.fields?.length) {
        body.fields.forEach((f) => fieldError(f.field, tc.required));
        errorBox.textContent = tc.failed;
      } else {
        errorBox.textContent = tc.failed;
      }
      errorBox.hidden = false;
    } catch {
      errorBox.textContent = tc.failed;
      errorBox.hidden = false;
    } finally {
      submit.disabled = bag.lines().some((l) => l.gone);
      submit.textContent = tc.place;
    }
  });

  return () => {
    off();
  };
}

/* -------------------------------------------------------------- confirmation -------------------------------------------------------------- */

function confirmationPage(main: HTMLElement): void {
  let data: { status?: string } = {};
  try {
    data = JSON.parse(main.dataset.pageJson || '{}') as { status?: string };
  } catch {
    /* no data */
  }
  // The bag empties once the order stands: after a cash order, or once a card payment went through.
  if (data.status && data.status !== 'cancelled' && data.status !== 'awaiting_payment') bag.clear();
}

/* ------------------------------------------------------------- test gateway -------------------------------------------------------------- */

function payPage(main: HTMLElement): void {
  const root = main.querySelector<HTMLElement>('[data-pay]');
  if (!root) return;
  root.querySelectorAll<HTMLButtonElement>('[data-pay-result]').forEach((b) =>
    b.addEventListener('click', async () => {
      root.querySelectorAll('button').forEach((x) => (x.disabled = true));
      await fetch(`/api/pay/test/${root.dataset.order}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ result: b.dataset.payResult }),
      }).catch(() => undefined);
      navigate(root.dataset.back ?? '/');
    }),
  );
}
