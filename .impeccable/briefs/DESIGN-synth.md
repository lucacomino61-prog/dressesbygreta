# DESIGN.md, Dresses by Greta

Direction: Future Issue (winner on combined judge total, 89), raised with named grafts from Quicksilver Room and Stage Light. This file owns every durable visual decision. The surface briefs own composition per route.

## 1. Identity

Design read: a mobile-first Instagram landing for a Tirana gown boutique (sale and rent), for young women and their mothers, with a fashion-magazine-printed-in-the-future language, leaning toward one wide grotesk on cool graphite paper, ivory ink, and a single champagne gold lifted from the shop's own monogram.

The world: a fashion issue printed onto a phone. Cool graphite is the paper, ivory is the ink, photographs are plates, and every plate is printed onto the page by one flat 2px ivory scan bar. The type carries the futurism (a wide grotesk at cover-line scale); no glow, no glass, no neon does.

Signature grammar, the scan bar: one flat 2px ivory bar with no glow prints every picture top to bottom. It appears in exactly five places: the hero plate on load, each featured gown as it prints in the rail, each contents thumbnail as it enters, the fitting room as it opens, and the visitor's own frozen picture. Same bar, same speed family, nowhere else.

Raises kept from the runners-up (named so they cannot be silently dropped):
- Quicksilver Room: the unsupported-browser state, detection inside gsap.ticker, prefetch on pointerdown, the crossing (a dress lifts off the page and lands in the room's rail), and a filterable overview grid translated into magazine grammar (a contents page).
- Stage Light: the frozen frame keeps its pose so the rail stays live on the still, the selected garment stands on the permission screen before the camera is on, self-hosted model with a real progress hairline, drag-down to dismiss, the Rregulla line.

Verified brand facts the design may state: handle @dressesbygreta, name Dresses by Greta, bio "For sale & rent!", address Rruga Andon Zako Çajupi, pas LSI, Tiranë, map pin 41.320034, 19.812943, highlights (By Greta, Clients, For Sale & Rent, Rregulla, Prom Dresses, Miniprom, Big Brother, Black Dresses), profile picture (ivory disc, gold script G). Nothing else exists: no prices, hours, rental rules, founding date, staff, sizes, per-dress status, or client names.

Dials: DESIGN_VARIANCE 8, MOTION_INTENSITY 6, VISUAL_DENSITY 3. Theme locked dark for the whole page including the fitting room; no section inverts.

## 2. Colour

All colours are CSS custom properties on :root. The accent is champagne gold because the brand's own monogram is gold; that is the only reason it is allowed, and it is the single accent on a dark graphite base. The base is graphite, never beige or cream. Every surface and text token is near-neutral; the gowns in the photographs are the only saturated objects on the page.

| Token | Hex | Role |
| --- | --- | --- |
| --ground | #0F1012 | The paper. Page background, dialog background, room background, scrim colour. Cool graphite, never #000. |
| --ground-2 | #16171B | Raised paper: nav fill after 80px of scroll, desktop plate letterbox, thumbnail wells, the fitting-room column on desktop, disabled pill fill. |
| --ground-3 | #1D1E23 | Pressed or hovered thumbnail well and outline-pill hover fill (pointer-fine only). |
| --hairline | #2A2C31 | 1px rules only where they separate real content: nav bottom once scrolled, footer top, the empty video frame while loading, scrollbar thumb. |
| --line | #6B675E | Outline pill border at rest (3.5:1 on --ground) and disabled control text. Never running copy. |
| --ink | #EDE7DA | Ivory ink: all primary text, the cover line, the scan bar, the shutter fill, outline pill text, the freeze flash. 15:1 on --ground. |
| --ink-2 | #A39E92 | Secondary text, captions under thumbnails, footer copy, status lines, placeholders. 7.4:1 on --ground. Tinted from the ivory, never gray. |
| --gold | #D4B16A | The one accent, sampled from the monogram G (saturation 55%): primary pill fill, active thumbnail ring, focus ring, text selection, caret, the loading hairline, the ampersand in the cover line. Used identically in every section. 9.6:1 on --ground. |
| --gold-press | #C6A25A | Gold pill pressed state and pointer-fine hover. |
| --on-gold | #14130F | Text and icons on gold pills. 9.3:1 on --gold. |
| --scrim | #0F1012 | Used as a gradient, alpha 0 to 0.6, under type on photographs so ivory never drops below 4.5:1 on any gown. Also the rail strip background in the room at alpha 0.85. |

Rules:
- No semantic colours. There is no red, green, or amber anywhere; state is written in words ("The camera is off.").
- No pure #000000 or #FFFFFF as surface or text.
- Gold is flat fill and flat glyph only: no gold gradient, no gold glow, no gold shimmer, no gold text at body sizes.
- Browser surfaces are themed from the palette: ::selection background --gold with --on-gold text; caret-color --gold; :focus-visible outline 2px solid --gold, outline-offset 3px, following the element's own shape; scrollbar-width thin, thumb --hairline on --ground; link underline 1px, text-underline-offset 0.14em, text-decoration-color --ink at 60%.

## 3. Typography

One family carries the whole hierarchy. Archivo Variable has a width axis (62 to 125) and a weight axis; width does the work a second typeface usually does, so the cover voice (wide) and the text voice (normal) never sound like two brands. Archivo Expanded is the Google-catalog stand-in for the wide grotesks that make a cover read as future.

Package: @fontsource-variable/archivo. Import exactly `@fontsource-variable/archivo/wdth.css` (the file that carries both wght and wdth axes). There is no full.css. Subsets: latin and latin-ext ship in that file with unicode-range, which covers ë and ç for the address and any Albanian copy. Preload the latin upright woff2 in index.html. No italic file is loaded; emphasis inside a headline is weight 600 of the same family, one word maximum, never a second face.

Fallback stack: 'Archivo Variable', Archivo, system-ui, sans-serif. font-display: swap. Wait on document.fonts.ready, capped at 300ms, before the hero choreography starts so the width axis never reflows the cover line mid-animation.

Weights used: 400, 500, 600 only. Width values set per role with font-stretch.

| Role | Size | Line height | Tracking | Width | Weight | Case | Where |
| --- | --- | --- | --- | --- | --- | --- | --- |
| display-xl | clamp(3.25rem, 12vw, 6rem) | 0.92 | -0.03em | 125% | 500 | Uppercase | Hero cover line only. Never above 6rem; verify "FOR SALE" fits one line at 768, 1024, 1440. |
| display-lg | clamp(2rem, 7vw, 4rem) | 1.0 | -0.025em | 118% | 500 | Sentence case | Plate captions, the door headline, the room's permission headline. |
| display-md | clamp(1.625rem, 5vw, 3rem) | 1.05 | -0.02em | 112% | 500 | Sentence case | The address in Visit. |
| body-lg | 1.125rem | 1.55 | 0 | 100% | 400 | Sentence case | Hero subtext, the door and permission body, Visit body. Measure max 60ch. |
| body | 1rem | 1.5 | 0 | 100% | 400 | Sentence case | Everything else. Measure max 60ch. |
| label | 0.875rem | 1.2 | 0.02em | 100% | 500 | Sentence case | Pill and chip text, nav link, thumbnail captions. Never uppercase, so nothing reads as an eyebrow. |
| small | 0.8125rem | 1.45 | 0 | 100% | 400 | Sentence case | Footer, status lines, the not-saved disclosure. |

Rules:
- Uppercase exists only at display-xl. The cover line is the one poster moment; everything else is sentence case so the page reads couture, not streetwear.
- text-wrap: balance on every display element.
- font-variant-numeric: tabular-nums wherever a number can change (the loading percent).
- No eyebrows, kickers, section numbers, or tracked small-caps labels above any heading. The heading carries itself.
- The hero headline never exceeds 2 lines and the subtext never exceeds 20 words at any width; if real copy breaks that, the font scale drops, not the layout.
- Body text colour --ink at body-lg in the hero and permission screen, --ink-2 elsewhere.

## 4. Spacing, grid, radius

Spacing scale (4px base), as tokens: --s-1 4px, --s-2 8px, --s-3 12px, --s-4 16px, --s-5 24px, --s-6 32px, --s-7 48px, --s-8 64px, --s-9 96px, --s-10 128px. Section padding: --s-9 top and bottom on phones, --s-10 from 1024px. More space above a heading than below it: heading margin-top --s-8, margin-bottom --s-5.

Gutters: 16px at 0 to 639px, 24px at 640 to 1023px, 48px from 1024px. Container max-width 1400px, centred. 12-column grid from 1024px with 24px column gap; single column below 768px for every multi-column composition (the hero overlap is the one exception and is specified in the surface brief).

Safe areas: bottom-anchored text and the room's rail use padding-bottom max(24px, env(safe-area-inset-bottom) + 16px).

Radius system, two shapes, one rule, no third value:
- --r-frame: 0px. Anything that is a picture or holds one: plates, thumbnails, the video frame, the frozen still, the dialog, inputs, the nav bar.
- --r-pill: 999px. Any text-labelled control: pills (buttons), filter chips, the nav pill, links styled as buttons. The shutter is a 64px circle, which is a pill at 1:1.
- Thumbnails stay square because they are pictures first; they show pressability with a 2px --gold ring and the 120ms press scale.
- Focus rings follow the element's own shape. A 4px, 8px, 12px or 16px corner anywhere on the page is a defect.

## 5. Elevation and material

There are no box-shadows on this page. Depth comes from three things only: the sticky stack (the previous plate recedes to scale 0.94 and opacity 0.45 as the next covers it), the --scrim gradient under type on photographs, and the tonal step from --ground to --ground-2. Gold is flat. Ink is flat. The scan bar is flat.

No glass, no backdrop-filter, no blur on surfaces. The nav is transparent over the hero and becomes solid --ground-2 with a 1px --hairline bottom after 80px of scroll (toggleClass, 200ms colour transition). Solid fill also avoids per-frame repaints in WebViews.

Grain: one static SVG feTurbulence tile (baseFrequency 0.8, 2 octaves, 160px tile) on a fixed, pointer-events: none body::after at opacity 0.04, normal blending, no keyframes. The dialog re-applies the same tile on dialog::after because the top layer sits above the page pseudo. The interlace overlay from the original direction is removed; it read as CRT costume.

Z-scale (document in one constants file): 0 content, 1 to n rail plates in order (later plates above earlier ones), 20 nav, 30 crossing clone inside the dialog, 50 grain. The dialog lives in the browser top layer and needs no z-index.

Images: every plate and thumbnail reserves its aspect (3:4 tiles, 4:5 desktop plates, cover on phones) so CLS is 0. The first two plates and the hero plate are eager; the hero plate is preloaded as LCP. Everything else loading="lazy" decoding="async" with srcset at 480, 768, 1080, 1440 and sizes 100vw on phones, 60vw from 1024px. Garment cutouts are alpha mattes derived from Greta's own photographs; geometric masks standing in for a cutout are forbidden.

## 6. Components

Pills (buttons): height 48px (44px minimum touch target everywhere), padding 0 22px, --r-pill, label role. Gold pill: fill --gold, text --on-gold, hover --gold-press (pointer-fine only), pressed scale(0.97) over 120ms. Outline pill: transparent fill, 1px --line border, text --ink, hover fill --ground-3. Text link: --ink, underlined per browser-surface rules. Disabled: fill --ground-2, text --line, no press scale. Labels never wrap at desktop; 3 words maximum.

Chips (filters, only when the client supplies per-dress tags): 36px tall, --r-pill, 1px --line border, label role at 0.8125rem; selected chip: fill --gold, text --on-gold. Chips never appear without real data behind them.

Plate: a full-viewport stage with exactly three children inside the clipped wrapper (image, scan bar, inner transform wrapper) and the caption outside the clipped wrapper. See section 8 for the mechanics.

Thumbnail (contents grid and room rail): square 0px corners, image cover on --ground-2, active state 2px --gold ring, unselected in the room at 60% opacity. Caption below the frame in the contents grid, never over it.

Nav: 56px on phones, 64px from 1024px, single line always. Left: the real profile picture (ivory disc, gold G) at 28px, alt "Dresses by Greta". Right: 'Ask on Instagram' text link and, after the hero leaves, the gold 'Try it on' pill (fades in over 200ms). The monogram is never redrawn as an SVG.

Icons: Phosphor, regular weight, one weight only, used for the close X, the copy-link glyph, and the map pin. No hand-drawn glyphs, no emoji.

States every interactive component ships with: rest, hover (gated behind @media (hover: hover) and (pointer: fine)), focus-visible, pressed, disabled, loading (skeleton matching the final shape, never a spinner), error written inline in words.

## 7. Motion

Engine: GSAP 3 core plus ScrollTrigger owns every choreographed and scroll-driven moment. gsap.ticker is the only scheduler on the page; the fitting-room frame loop is registered with gsap.ticker.add and removed on exit. No Lenis, no ScrollTrigger.normalizeScroll, no raw requestAnimationFrame, no requestVideoFrameCallback, no CSS keyframe loops, no View Transitions. CSS transitions are allowed only for pointer feedback and colour under 200ms. Audit every dependency for requestAnimationFrame before install.

Easing tokens (CSS) and their GSAP names:
- --ease-out: cubic-bezier(0.23, 1, 0.32, 1). Press release, all exits. GSAP: power3.out for prints.
- --ease-expo: cubic-bezier(0.16, 1, 0.3, 1). Entrances. GSAP: expo.out.
- --ease-move: cubic-bezier(0.77, 0, 0.175, 1). Anything travelling across the screen (the crossing). GSAP: power2.inOut is the closest for the freeze print.
- --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1). The room opening.
- --ease-color: cubic-bezier(0.25, 0.1, 0.25, 1). Colour and opacity on hover.
- Scrubs use ease: 'none', always.

Duration tokens:
- --d-press 120ms (scale to 0.97 on every pressable element, including the shutter at 0.94)
- --d-hover 160ms (fill and colour, pointer-fine only)
- --d-swap 200ms (garment crossfade in the room)
- --d-nav 200ms (nav fill, nav pill fade)
- --d-exit 280ms (dialog exit; exits are always faster than entrances)
- --d-enter 480ms (dialog enter, hero subtext and pills)
- --d-crossing 600ms (the dress travelling into the rail; the freeze print)
- --d-line 700ms (each headline line rising)
- --d-print 900ms (hero plate print on load; the door cutout print)
- Tile prints in the contents grid: 600ms with 60ms stagger. Hero headline stagger 90ms.

What animates: clip-path, transform, opacity, and the --p custom property on plates and tiles (declared with @property so the browser types it; each plate keeps 3 or 4 descendants so the recalc stays cheap). The sole filters are the 2px canvas blur on the outgoing garment during a swap and nothing else.

What never animates: type position on scroll (the type is the paper; the photograph is the layer pulled beneath it), the grain, headline colour, the address, thumbnail positions (native scroll-snap), the nav height, section backgrounds, anything on a loop. Zero marquees. Zero pulsing dots. Zero hover lifts or hover scales on images. No magnetic buttons, no custom cursor, no parallax on text.

Authoring rule: every entrance starts from the visible default written in CSS (--p initial-value 1, opacity 1, transform none). GSAP sets the hidden start state only inside gsap.matchMedia('(prefers-reduced-motion: no-preference)'), so a failed script or a reduced-motion visitor sees a complete page.

Reduced motion (gsap.matchMedia branch for '(prefers-reduced-motion: reduce)' plus a CSS media block): the hero appears complete with a single 200ms opacity fade; --p stays at 1 on every plate and tile, no recede scrub; the nav pill appears without fade; the dialog fades over 150ms instead of clipping; the crossing clone is skipped; the garment swap is a 150ms opacity crossfade; the freeze shows the still without flash or print; the loading hairline still reports progress because it is state, not decoration; the 120ms press scale stays because it is feedback. The try-on canvas keeps drawing because it is content.

## 8. Scroll-reveal spec

Boot, once:
```ts
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
ScrollTrigger.defaults({ invalidateOnRefresh: true });
```
Call ScrollTrigger.refresh() after document.fonts.ready and after any filter change in the contents grid. Never attach window scroll listeners.

Custom property, in CSS:
```css
@property --p { syntax: '<number>'; inherits: true; initial-value: 1; }
```

Plate markup and layers (the same three-layer print is used by the hero plate, the rail plates, the contents tiles, the door cutout, and the room's frozen still):
```css
.plate__inner { will-change: transform; }
.plate__img   { clip-path: inset(0 0 calc((1 - var(--p)) * 100%) 0);
                transform: scale(calc(1.06 - 0.06 * var(--p))); }
.plate__scan  { position: absolute; inset: 0 0 auto 0; height: 2px; background: var(--ink);
                transform: translateY(calc(var(--p) * var(--stage-h)));
                opacity: calc(1 - var(--p) * var(--p)); }
```
The caption sits outside .plate__inner so it is never clipped and never inherits the transform.

Hero, on load (after Promise.race([document.fonts.ready, 300ms delay])), inside the no-preference branch:
```ts
const tl = gsap.timeline();
tl.fromTo('.hero .plate', { '--p': 0 }, { '--p': 1, duration: 0.9, ease: 'power3.out' }, 0)
  .from('.hero .line > span', { yPercent: 18, duration: 0.7, ease: 'expo.out', stagger: 0.09 }, 0.2)
  .from('.hero .sub, .hero .cta', { opacity: 0, y: 12, duration: 0.48, ease: 'expo.out' }, 0.35);
```
Headline lines live in overflow: hidden wrappers. Hero on scroll, the photograph is the layer pulled beneath the paper:
```ts
gsap.to('.hero .plate__img', { yPercent: -8, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('.hero .scrim', { opacity: 0.6, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
```
Nav:
```ts
ScrollTrigger.create({ start: 80, end: 'max', toggleClass: { targets: '.nav', className: 'is-scrolled' } });
gsap.from('.nav__try', { opacity: 0, duration: 0.2, paused: true,
  scrollTrigger: { trigger: '#hero', start: 'bottom 60%', toggleActions: 'play none none reverse' } });
```

The rail (featured gowns as a sticky stack). The browser pins; GSAP only scrubs. Structure: a flat container whose children alternate a sticky plate and a hold spacer, so every plate sticks at the top while its hold scrolls, and the next plate covers it.
```html
<section class="rail">
  <article class="plate" style="z-index:1"> ... </article><div class="hold" aria-hidden="true"></div>
  <article class="plate" style="z-index:2"> ... </article><div class="hold" aria-hidden="true"></div>
  ...
</section>
```
```css
.plate { position: sticky; top: 0; height: 100vh; height: 100svh; --stage-h: 100svh; background: var(--ground); }
.hold  { height: 80vh; height: 80svh; }
```
Use svh, not dvh, so plate heights do not change as the address bar collapses. Print, per plate (the plate is stationary during the whole print, so the bar travels exactly top to bottom on screen while the gown prints beneath it and the 1.06 to 1.0 settle reads as stepping into the room):
```ts
plates.forEach((plate, i) => {
  gsap.fromTo(plate, { '--p': 0 }, { '--p': 1, ease: 'none',
    scrollTrigger: { trigger: holds[i], start: 'top bottom', end: 'bottom bottom', scrub: true } });
  if (i > 0) gsap.to(plates[i - 1].querySelector('.plate__inner'), { scale: 0.94, opacity: 0.45, ease: 'none',
    scrollTrigger: { trigger: plate, start: 'top bottom', end: 'top top', scrub: true } });
});
```
While a plate arrives (before its hold), it is an opaque sheet of --ground with the bar at its top edge covering the receding gown; that is the page turning. Each gown costs 180svh of native scroll; the featured set is 6 to 8 gowns, so the rail is 11 to 15 screens and nothing is hijacked. No GSAP pin, no pinSpacing, no snap, no anticipatePin anywhere on the page.

Contents grid (every dress, after the rail): tiles print once as they enter.
```ts
ScrollTrigger.batch('.tile', { start: 'top 85%', once: true,
  onEnter: b => gsap.fromTo(b, { '--p': 0 }, { '--p': 1, duration: 0.6, ease: 'power3.out', stagger: 0.06, overwrite: true }) });
```
The door cutout prints once at start 'top 75%', 900ms power3.out. Section headings, body copy, the Visit band and the footer never animate. Budget: 2 triggers per featured plate, 1 batch for tiles, 4 global, well under 40 triggers.

## 9. The fitting room (durable rules; the full brief lives in the try-on surface brief)

- One native <dialog> opened with showModal() from every 'Try it on' pill and every contents tile. Scroll lock via html:has(dialog[open]) { overflow: hidden }. history.pushState on open so the back gesture closes it. Focus returns to the opener on close.
- Enter: clip-path inset(100% 0 0 0) to inset(0) over --d-enter with --ease-drawer and the scan bar riding the edge (the same --p mechanics). Exit: clip-path to inset(0 0 100% 0) over --d-exit with --ease-out.
- The camera is never requested before the visitor taps 'Turn the camera on'. MediaPipe (tasks-vision wasm plus pose_landmarker_lite.task) is served from the same origin under Vite public/, fetched with a manual ReadableStream so the hairline reports real bytes, dynamically imported on pointerdown of any 'Try it on' control, never on page load and never on scroll. GPU delegate with CPU fallback, runningMode VIDEO, numPoses 1.
- One loop: gsap.ticker.add(tick); detectForVideo runs only when video.currentTime has advanced. Landmarks 11 and 12 give anchor, scale and rotation; 23 and 24 confirm the torso; exponential moving average alpha 0.35; a 300ms debounce before the garment fades on lost shoulders.
- Frames stay on the device. No toDataURL, no blob, no object URL of a frame, no share sheet, no download, no network request carrying pixels. Closing the room stops every MediaStreamTrack first, then clears the canvases and drops the cached frame and pose.
- The frozen frame keeps its pose so the rail stays live on the still.
- Desktop: a 9:16 column centred on --ground-2, max-height 86vh, rail beneath, same controls.

## 10. Copy rules

English, sentence case, second person, short sentences, concrete verbs. One label per intent across the whole site, spelled identically everywhere:
- 'Try it on' (opens the room; nav, hero, plates, tiles, the door)
- 'See the dresses' (scrolls to the rail; hero secondary, denied and unsupported states)
- 'Ask on Instagram' (the only contact label; links to https://ig.me/m/dressesbygreta)
- 'Turn the camera on', 'Use a photo instead', 'Copy link', 'Not now', 'Back to live', 'Close', 'Open in Google Maps'
Banned words: elevate, seamless, unleash, next-gen, revolutionize, experience (as a noun), curated. Banned characters: em-dash and en-dash anywhere, in copy, captions, alt text, code comments and commit messages; hyphen, comma, period only. Unknown facts are never filled: prices, hours, rental rules, sizes, per-dress status, names. They point to Instagram. Captions describe the photograph ('Red satin', 'Black sequins') and are checked against it; a dress is never given an invented name.

Albanian: the audience is Tirana and both judges asked for Albanian first. Ship English on day one (this file's copy is final in English). A string table lives in src/copy.ts so a verified Albanian set can replace it without touching markup; proposed Albanian strings must be signed off by a native speaker before they ship, and the two-line cover-line cap must be re-verified at 390px with the Albanian text.

## 11. Do

- Keep the scan bar to its five places and keep it flat.
- Use the real profile picture as the mark at 28px (nav) and 40px (footer, permission screen).
- Let the browser pin (position: sticky); let GSAP only scrub --p, scale and opacity.
- Reserve every image's aspect; preload the hero plate; lazy-load beyond the first two plates.
- Write every state in words, with the recovery in the same sentence.
- Gate hover behind (hover: hover) and (pointer: fine); give every control a 44px target.
- Theme selection, caret, focus ring, scrollbar and underline offset from the palette.
- Stop the camera tracks before anything else moves on close.
- Test from the real Instagram bio link on an iPhone and a mid-range Android before calling the room done; the preview pane composites no camera frames.

## 12. Do not

- No em-dashes or en-dashes, anywhere.
- No eyebrows, kickers, section numbers, pagination ('01 / 12'), uppercase tracked labels above headings, version stamps, locale or time strips.
- No scroll cues of any kind.
- No three equal cards, no bento, no card chrome around dresses; plates and square thumbnails are the layout.
- No serif, no Inter, no Space Grotesk, no second family; Archivo's width axis is the type system.
- No glow, no drop shadow, no gradient text, no glass or backdrop-filter, no shimmer, no interlace or animated grain.
- No second chromatic accent; no red or green status colour.
- No pure #000000 or #FFFFFF.
- No GSAP pin, no snap, no Lenis, no normalizeScroll, no second requestAnimationFrame loop, no requestVideoFrameCallback, no CSS keyframe loop.
- No marquee, no parallax on type, no hover lift or hover scale on images, no magnetic buttons, no custom cursor.
- No pills, tags or credits laid over photographs; captions sit beside or below.
- No invented prices, hours, rental rules, sizes, dress names, per-dress sale or rent badges, client names or testimonials.
- No redrawn G monogram; no hand-rolled decorative SVG.
- No geometric masks pretending to be garment cutouts.
- No getUserMedia before the tap; no MediaPipe load before pointerdown intent; no third-party CDN for model or wasm; no frame ever saved, shared or sent.
- No light section or theme flip; the dark paper is locked, including the room.
- No 100vh on the hero (min-height 100dvh) and no dvh on plates (svh).
- No filler verbs.

## 13. Responsive rules

Breakpoints: 640, 768, 1024, 1280. Mobile first; every rule below is the phone default unless a wider breakpoint is named.

- Hero: min-height 100dvh. Plate anchored top-right, 62vw wide by 58svh tall (58vw at widths under 360px); type block hard-left at the bottom, overlapping the plate's lower-left corner by about one fifth of the plate width; pills stacked full width. From 1024px: 12-column grid, plate spans columns 7 to 12 at full height and bleeds to the right edge, type block in columns 1 to 6 bottom-aligned overlapping the plate by two columns, pills inline. Headline 2 lines at every width; subtext max 38ch.
- Nav: 56px, then 64px from 1024px; always one line; the 'Try it on' pill appears in the nav only after the hero leaves, so the first viewport never duplicates the CTA.
- Rail plates: full-bleed cover on phones; from 1024px a centred 4:5 portrait box at 100svh height on --ground-2 with the caption bleeding left off the box onto the paper. Caption and pill sit bottom-left over a --scrim gradient on phones.
- Contents grid: 2 columns at 12px gap; 3 columns from 768px; 4 columns from 1024px at 24px gap. Tiles 3:4, captions below. Chips (if any) wrap into a horizontal scroll-snap row on phones, inline from 768px.
- The door: single column, the cutout 70vw tall on phones, headline overlapping its hem; from 1024px the cutout takes columns 7 to 11 and the text columns 1 to 5.
- Visit: single column stacked; pills inline from 640px. No image.
- Footer: single column on phones, one row from 768px.
- Room: full-bleed video on phones with the rail as a bottom strip; from 1024px a 9:16 column centred on --ground-2, max-height 86vh, rail beneath.
- Asymmetry collapses to a strict single column below 768px in every section except the hero overlap, which is the composition's signature and is specified above at phone width.
- Touch targets 44px minimum everywhere; hover is never the only affordance.
