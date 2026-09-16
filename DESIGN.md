# DESIGN.md, Dresses by Greta

World: the client pinned a reference on 2026-09-16 (vivetofficial.com, a Shopify Horizon store) and asked for its design to be followed, menu included. The site is therefore a white, Helvetica, 12px-uppercase fashion store: a transparent three-zone header, a home page whose hero is one full-bleed photograph with the wordmark pinned in the centre, drawers for menu, search and the list, a three-column footer and a follow card. Under that skin the site keeps what the reference does not have: a rail of featured gowns that print as you scroll, a filterable catalog of every dress from the Instagram feed, and the fitting room where the visitor puts a dress on herself with her camera, on device.

Direction record: Impeccable seed 48f6c139 assigned the garment-rail candidate and the judge panel chose the printed-magazine world; both survive in the rail (sticky sleeves that open top-down) and in the scan-bar print grammar. The visual material (light ground, Helvetica, square black controls, 12px uppercase chrome) is the client's pinned reference and overrides the earlier dark world. Theme locked light everywhere; the fitting-room stage is the one dark surface because it shows a camera.

## Colour

| Token | Value | Role |
| --- | --- | --- |
| `--ground` | #FFFFFF | Page, drawers, dialog chrome, popup |
| `--ground-2` | #F4F4F4 | Image wells while loading, swatch wells |
| `--ground-3` | #EBEBEB | Hover fill on outline controls |
| `--hairline` | #E6E6E6 | 1px rules: scrolled header, drawer footer, section tops, footer |
| `--line` | #606A72 | Input borders |
| `--ink` | #000000 | All primary text, filled buttons, the scan bar |
| `--ink-2` | rgba(0,0,0,.8) | Secondary text, child menu items, captions |
| `--ink-3` | rgba(0,0,0,.55) | Placeholders, footer bottom line |
| `--overlay` | rgba(0,0,0,.15) | The hero photograph overlay (plus a 120px top gradient at .35 for the header) |
| `--stage` | #0B0B0B | The camera stage and the hero photograph's letterbox |
| `--on-photo` | #FFFFFF | Text and controls over photographs (hero, phone rail captions) |

No accent colour: the dresses are the only colour. No gradients except the two overlays above and the phone rail scrim. No shadows, no glass.

## Typography

One stack, no webfont: `'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif`. Chrome and labels are 12px uppercase with 0.02em tracking, weight 400 (`.ui`, `.tlink`, `.chip`, buttons, captions, footer). Section headings are the same 12px uppercase at 0.08em (`.heading`). Body is 14px, 1.55 line height, 60ch max; the door body is 16px. The wordmark is 12px, weight 600, 0.22em tracking in the header and popup; in the hero it is the one large element, clamp(1.5rem, 8.4vw, 5.5rem) on phones and clamp(2rem, 5.6vw, 5.5rem) on one line from 768px, 0.14em tracking, weight 600, white. Dress names are English descriptive captions and carry lang="en".

## Spacing, grid, shape

4px scale (`--s-1` 4 to `--s-10` 128). Gutters 16 / 24 / 40px at 0 / 640 / 1024; header inner padding 30px from 1024px like the reference. Container 1440px. Header 49px on phones, 54px from 1024px. Drawers min(370px, 92vw). Every corner is square (`--r` 0). Touch targets 44px; the visual 36px chips extend to 44px with padding.

## Header

Fixed, transparent over the hero with white text, solid white with a hairline and black text once the hero has scrolled past (`.is-scrolled`) or while a drawer is open. Three zones: left MENU (phones) or the inline category list (from 1024px); centre the wordmark; right the language toggle (EN/SQ), KËRKO and LISTA with a count, of which phones show only LISTA. All 12px uppercase text controls.

## Drawers, search, list, popup

Native `<dialog>` elements slid in by GSAP (menu from the left, list from the right, search from the top), 20% backdrop, Escape and backdrop close, focus returns to the opener. Menu: parents 12px uppercase, children 14px uppercase at 80% ink, then "Rajoni dhe gjuha" (Shqip / English) and Kërko, like the reference's localization and search rows. Search: a 54px bordered input, live results as tiles, "Shiko të gjitha". List ("Lista", the reference's BAG): dresses kept in memory only, each with Provoje, Shiko në Instagram and Hiq, a copy-to-clipboard button and the single Pyet në Instagram action. Popup: the reference's newsletter card becomes a follow card (wordmark, one line, one black button), shown once per session after 7 seconds, never over an open dialog.

## Hero

100svh, one photograph (object-fit cover, positioned 50% 20%) printed by the scan bar on load, the 15% overlay, the wordmark pinned centre, a single outline "Provoje" button at the bottom centre. On scroll the photograph drifts 6% and the wordmark fades. Nothing else in the viewport.

## Rail, catalog, door, visit, footer

Rail: sticky sleeves of 100svh with 60svh holds; every trigger hangs off a hold; each sleeve prints while it slides up and the previous one recedes to 0.94 and 45%. Phones: full-bleed with a bottom scrim and white caption; desktop: a centred portrait frame and a black caption bottom-left that never runs under the frame. Captions: name in 12px uppercase plus text links (Provoje or Pyet në Instagram, Shiko në Instagram, Shto në listë).

Catalog: heading and count, a text-filter row (active item underlined), 2 / 3 / 4 columns of 3:4 tiles with the caption below (name, Provoje, Shto në listë). Tiles print once on entry. Door: the crimson cutout on white, heading, body, three numbered steps, one black button. Visit: heading, address at 20px, two buttons, two lines. Footer: three columns of 12px links (Dyqani, Ndihmë, Fustanet) and a bottom line with the follower count and the privacy sentence.

## Motion

GSAP core and ScrollTrigger only; `gsap.ticker` is the only frame loop, including the fitting room. Scrubs use `ease: none`; entrances `power3.out` or `expo.out`, drawers 420ms in and 260ms out, press feedback scale(0.98) over 120ms. The scan bar is a 1px ink line whose travel is the plate's own height (`100cqh`); the print is `clip-path` driven by the typed `--p`; the hero drift is the typed `--drift` composed into the same transform. Reduced motion: single 200ms fades, no drift, no slide, everything visible by default in CSS.

## Fitting room

A native `<dialog>` with white chrome and a dark stage. Gate (ghost of the selected garment, lead, body, Hap kamerën, Përdor një foto), loading with a real progress hairline, live, frozen (Ndalo pamjen / Live), photo (with Hap kamerën and Përdor një foto in the controls), denied, unavailable, in-app browser. The camera view is a mirror and the garment is mirrored with it; photos are not. Frames never leave the canvases; every exit stops the tracks first; a generation counter cancels camera work that finishes after a close. Keyboard: arrows move the dress, plus and minus resize, 0 resets. Wasm and model are served from this origin; the production build ships a Content-Security-Policy with `connect-src 'self'`.

## Copy

Albanian first (reviewed for agreement: fustane të gjata, të zeza, të gjitha fustanet; ijët for hips; "shiko si të rri fustani"), English via the toggle, URL-carried, nothing stored. One label per intent: Provoje, Shiko fustanet, Pyet në Instagram, Hap në Google Maps, Shto në listë. No invented facts: no prices, hours, sizes, rental rules, per-dress status. No em or en dashes anywhere.

## Do not

- No colour accent, no gradients beyond the overlays, no shadows, no glass, no rounded corners.
- No second font, no display serif, no eyebrows above headings, no section numbers, no scroll cues.
- No GSAP pin or snap, no Lenis, no second frame loop, no CSS keyframe loops.
- No storage of visitor media, no third-party request from the fitting room, no getUserMedia before the tap.
- No dark sections; the stage is the only dark surface.
