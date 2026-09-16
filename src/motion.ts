/**
 * All choreographed and scroll-driven motion. GSAP is the only engine on the page and
 * gsap.ticker the only scheduler; the fitting room registers its frame loop with it.
 *
 * Every entrance starts from the visible default written in CSS (--p: 1, opacity 1). Hidden start
 * states are set only inside the no-preference branch, so a reduced-motion visitor or a failed
 * script still sees the complete page.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let booted = false;
const mm = gsap.matchMedia();

export async function initMotion(): Promise<void> {
  if (booted) return;
  booted = true;
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.defaults({ invalidateOnRefresh: true });

  // Let the width axis settle before the cover line rises; never wait more than 300ms.
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 300))]);

  // State, not decoration: the header turns solid once the hero photograph has left.
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'bottom 60px',
    end: 'max',
    toggleClass: { targets: '[data-nav]', className: 'is-scrolled' },
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    hero();
    rail();
    tiles();
    door();
  });

  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.fromTo('.hero__mark, .hero__plate', { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' });
  });

  ScrollTrigger.refresh();
}

function hero(): void {
  const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
  tl.fromTo('.hero__plate', { '--p': 0 }, { '--p': 1, duration: 1.1, ease: 'power3.out' }, 0)
    .from('.hero__title', { opacity: 0, letterSpacing: '0.3em', duration: 0.9, ease: 'expo.out' }, 0.35)
    .from('.hero__content', { opacity: 0, y: 10, duration: 0.5, ease: 'expo.out' }, 0.7);

  // The photograph drifts under the pinned wordmark as the page starts to scroll. The drift is
  // a typed custom property composed into the CSS transform, so the print zoom keeps working.
  gsap.to('.hero__plate', {
    '--drift': '-6%',
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__mark', {
    opacity: 0,
    yPercent: 20,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/** Featured gowns: the browser pins each sleeve, GSAP only scrubs the print and the recede. */
function rail(): void {
  const plates = gsap.utils.toArray<HTMLElement>('.rail__plate');
  const holds = gsap.utils.toArray<HTMLElement>('.rail .hold');
  plates.forEach((plate, i) => {
    const hold = holds[i];
    if (!hold) return;
    // Every trigger hangs off a hold (never off a sticky plate, whose measured position moves).
    // Plate i's top edge enters the viewport exactly when hold i-1's bottom edge does, and locks
    // at the top when that bottom edge reaches the top: the sleeve prints while it slides up.
    // The first sleeve is already at the top when the hero leaves, so it prints during its hold.
    const prevHold = holds[i - 1];
    // The print runs twice as fast as the arrival, so the zip line visibly leads the sheet's
    // edge instead of coinciding with the viewport bottom.
    const arrival = prevHold
      ? { trigger: prevHold, start: 'bottom bottom', end: 'bottom 50%', scrub: true }
      : { trigger: hold, start: 'top bottom', end: 'bottom bottom', scrub: true };
    gsap.fromTo(plate, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: arrival });
    const prev = plates[i - 1];
    if (prev && prevHold) {
      gsap.to(prev.querySelector('.plate__inner'), {
        scale: 0.94,
        opacity: 0.45,
        ease: 'none',
        scrollTrigger: { trigger: prevHold, start: 'bottom bottom', end: 'bottom top', scrub: true },
      });
      gsap.to(prev.querySelector('.rail__caption'), {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: prevHold, start: 'bottom bottom', end: 'bottom 60%', scrub: true },
      });
    }
  });
}

let tileBatch: ScrollTrigger[] = [];

/** Contents tiles print once as they enter. Call again after the grid is re-rendered. */
export function tiles(): void {
  tileBatch.forEach((t) => t.kill());
  tileBatch = [];
  if (reducedMotion()) return;
  // The well is the plate (it carries its own --p), so the print must target it directly.
  const els = gsap.utils.toArray<HTMLElement>('.tile .tile__well');
  if (!els.length) return;
  gsap.set(els, { '--p': 0 });
  tileBatch = ScrollTrigger.batch(els, {
    start: 'top 88%',
    once: true,
    onEnter: (b) => gsap.to(b, { '--p': 1, duration: 0.6, ease: 'power3.out', stagger: 0.06, overwrite: true }),
  });
  // Tiles already above the fold when the batch is created print immediately.
  ScrollTrigger.refresh();
}

function door(): void {
  const el = document.querySelector('[data-door]');
  if (!el) return;
  gsap.fromTo(el, { '--p': 0 }, { '--p': 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
}

export function refresh(): void {
  ScrollTrigger.refresh();
}

/** Open the fitting room like a curtain: the dialog clips open from the bottom edge. */
export async function roomEnter(dialog: HTMLElement): Promise<void> {
  if (reducedMotion()) {
    await gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'none' });
    return;
  }
  await gsap.fromTo(
    dialog,
    { clipPath: 'inset(100% 0 0 0)' },
    { clipPath: 'inset(0% 0 0 0)', duration: 0.48, ease: 'cubic-bezier(0.32, 0.72, 0, 1)' },
  );
}

export async function roomExit(dialog: HTMLElement): Promise<void> {
  if (reducedMotion()) {
    await gsap.to(dialog, { opacity: 0, duration: 0.15, ease: 'none' });
    return;
  }
  await gsap.to(dialog, { clipPath: 'inset(0 0 100% 0)', duration: 0.28, ease: 'power3.out' });
}

/** The crossing: a tapped dress lifts off the page and travels to the room's stage. */
export async function crossing(from: HTMLImageElement, toRect: DOMRect): Promise<void> {
  if (reducedMotion()) return;
  const r = from.getBoundingClientRect();
  const clone = from.cloneNode() as HTMLImageElement;
  clone.removeAttribute('srcset');
  clone.removeAttribute('sizes');
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    objectFit: 'cover',
    zIndex: '30',
    pointerEvents: 'none',
    clipPath: 'inset(0)',
    transform: 'none',
    margin: '0',
  } as Partial<CSSStyleDeclaration>);
  // The dialog lives in the top layer; a later top-layer entry (a manual popover) stacks above it.
  if ('showPopover' in clone) {
    clone.setAttribute('popover', 'manual');
    Object.assign(clone.style, { inset: 'auto', border: '0', padding: '0', background: 'transparent', overflow: 'visible' });
  }
  document.body.appendChild(clone);
  if ('showPopover' in clone) (clone as HTMLElement & { showPopover(): void }).showPopover();
  await gsap.to(clone, {
    left: toRect.left,
    top: toRect.top,
    width: toRect.width,
    height: toRect.height,
    opacity: 0.2,
    duration: 0.6,
    ease: 'power2.inOut',
  });
  clone.remove();
}
