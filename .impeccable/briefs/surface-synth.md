# Home page surface brief, Dresses by Greta

Mode: Persuade (the actions are a message on Instagram or a visit to the shop), carried by one Experience moment (the fitting room) that only this site can offer. The page must make the offer intelligible in one line (sale and rent, Tirana), expose the action, and prove the one thing only this page can prove: the visitor can put a dress on herself from her phone.

Copy register: English, sentence case, second person, plain verbs, short sentences. No filler. No invented facts. One label per intent:
- 'Try it on' = open the fitting room (nav pill after the hero, hero primary, every plate, every contents tile, the door)
- 'See the dresses' = scroll to the rail (hero secondary, room fallback states)
- 'Ask on Instagram' = the only contact label, always https://ig.me/m/dressesbygreta (nav, plates, Visit, footer)
- 'Open in Google Maps' = https://www.google.com/maps?q=41.320034,19.812943 (Visit only)

Section order, layout family, and what each must contain. Six distinct layout families across seven blocks plus one overlay; no family repeats.

1. Nav (single-line bar, transparent then solid)
   - Left: the real profile picture (ivory disc, gold script G) at 28px, alt "Dresses by Greta", links to the top.
   - Right: 'Ask on Instagram' text link. After the hero leaves the viewport a gold 'Try it on' pill fades in beside it (200ms, reversible).
   - 56px on phones, 64px from 1024px. Transparent over the hero; --ground-2 fill with a 1px --hairline bottom after 80px of scroll.
   - Nothing else: no language toggle on day one, no menu.

2. Hero (asymmetric split with overlap; full-bleed portrait plate top-right, type hard-left at the bottom)
   - One real feed photograph of a single gown on a model, client-supplied, preloaded as LCP; a clearly labelled placeholder slot if missing, never a generated substitute.
   - Exactly four text elements, no eyebrow, no strip, no scroll cue:
     - Headline (display-xl, uppercase, two lines, her bio at poster scale), final: line one "FOR SALE" and line two "& RENT." with the ampersand as the only gold glyph on the page.
     - Subtext (body-lg, --ink, max 38ch, 19 words), final: "Floor-length gowns for prom, events and TV, in Tirana. Put one on with your camera before you come in."
     - Primary gold pill 'Try it on'.
     - Secondary outline pill 'See the dresses' (anchors to the rail).
   - The --scrim gradient covers the plate's lower 45% so the ivory holds 15:1.
   - Motion: after fonts are ready (capped at 300ms), the plate prints via the scan bar (900ms), the two headline lines rise inside overflow-hidden wrappers (700ms, 90ms stagger, from 200ms), subtext and pills fade up 12px (480ms, from 350ms). On scroll the plate drifts -8% and its scrim deepens to 0.6 while the type does not move.

3. The rail (sticky-stack of full-viewport plates)
   - 6 to 8 featured gowns chosen by the client, one plate each, in this order of highlight coverage where the client confirms the assignment: Prom Dresses, Miniprom, Black Dresses, For Sale & Rent. If a highlight assignment is unknown, order by photograph strength; never label a plate with a category the client has not confirmed.
   - Each plate: the photograph (alpha matte cutout on --ground where the matte is clean, otherwise the full framed photograph), a caption in display-lg sentence case that describes the photograph and is checked against it ("Red satin", "Black sequins", "Ivory with gold beading"), a gold 'Try it on' pill that opens the room with that dress selected, and an 'Ask on Instagram' text link.
   - No section headline: the first gown is the heading and its print is the handoff from the hero.
   - Mechanics per DESIGN.md section 8: sticky plate, 80svh hold, print scrubbed while stationary, previous plate recedes as the next covers it. No pin, no snap.
   - Captions are display-scale ink under a scrim, never small pills or tags over the photograph. No per-dress sale or rent badge, no price, no name.

4. Contents (filtered grid of square thumbnails, no card chrome)
   - Every dress in the catalog as a 3:4 square-cornered thumbnail on --ground-2, caption below in label role (the same checked description), whole tile a button that opens the room with that dress selected (the crossing plays from the tile).
   - 2 columns on phones, 3 from 768px, 4 from 1024px.
   - Filter chips appear only when the client supplies per-dress tags; the allowed chip set is 'All', 'Prom', 'Miniprom', 'Black', 'For sale', 'For rent', derived from the verified highlights and bio. With no tags the grid is unfiltered and no chips render. ScrollTrigger.refresh() after any filter change; leaving tiles fade 160ms, entering tiles print once at 500ms.
   - Tiles print via the scan bar as they enter (batch, once). A heading above the grid in display-lg: "Every dress." Nothing else above it.

5. The door (object plinth, vertical stack)
   - One garment cutout standing on the graphite paper (the same asset the room uses), printing once as it enters.
   - Headline in display-lg overlapping the hem: "Try it on before you visit."
   - Body (body-lg, two sentences, true): "Point your phone's camera at yourself and a dress appears on you. The picture stays on your phone, nothing is saved or uploaded."
   - One gold pill 'Try it on'.
   - This section does not prefetch anything; prefetch happens on pointerdown of the pill.

6. Visit (typographic band, no image)
   - The address set in display-md, verbatim: "Rruga Andon Zako Çajupi, pas LSI, Tiranë".
   - Two pills inline from 640px, stacked on phones: outline 'Open in Google Maps' (https://www.google.com/maps?q=41.320034,19.812943, opens in a new tab), gold 'Ask on Instagram'.
   - Two plain lines in body, --ink-2: "Rental rules are in the Rregulla highlight on Instagram." (links to https://www.instagram.com/dressesbygreta/) and "For prices and opening hours, ask on Instagram."
   - No hours, no prices, no map embed.

7. Footer (single row from 768px, stacked on phones, 1px --hairline top)
   - The profile picture at 40px, "Dresses by Greta", the address once more (its second and last appearance), 'Ask on Instagram', and the small-role line "The fitting room runs on your phone. No photo is stored or sent."
   - No version string, no locale strip, no social icon row beyond the one Instagram link.

Overlay, not in scroll flow: the fitting room, a full-screen <dialog> opened from any 'Try it on' control or contents tile. Specified in the try-on brief.

Omitted until the client supplies material: a Clients or Big Brother strip (needs photo releases), per-dress sale or rent labels (needs per-dress data), filter chips (needs tags), Albanian copy (needs a verified string set).

Assets the page needs from the client before build is judged: the original profile picture at 512px or larger; one hero photograph; 6 to 8 featured photographs with clean alpha mattes and per-dress anchor JSON (shoulderL, shoulderR, hipL, hipR, necklineOffset in PNG pixels); the full catalog photographs for the contents grid with checked descriptive captions.
