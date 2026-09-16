# Product

Dresses by Greta: the website for the Instagram boutique @dressesbygreta in Tirana, Albania. Floor-length evening and prom gowns, cocktail and mini dresses, available to rent or to buy. The site turns the Instagram feed into a catalog and adds one thing Instagram cannot do: a private camera try-on where the visitor sees a dress on herself without any photo leaving her phone.

Facts marked (verified) come from the public Instagram profile read on 2026-09-16. Facts marked (inferred) come from the client brief and were not confirmed by an interview; the interview could not run in this session.

## Platform

web

## Stack

Vite + vanilla TypeScript, static output. GSAP 3 (core + ScrollTrigger) is the only animation engine; native scroll, no smooth-scroll library, no second requestAnimationFrame loop. MediaPipe Tasks Vision (Pose Landmarker) runs the try-on entirely in the browser. Fonts self-hosted through @fontsource. No backend, no analytics, no cookies, no storage of visitor media.

## Users

- Young women in Tirana and across Albania shopping for a prom (mature), wedding-guest, birthday or TV appearance dress, mostly on a phone, arriving from the Instagram bio link (inferred from the feed hashtags: #promdresses, #weddingguest, #birthdaydress, #bigbrothervipalbania).
- Their mothers and friends, who co-decide and often pay (inferred).
- Greta and her team, who post the dresses and answer DMs (verified: the account is run as a boutique with client reposts).

## Product Purpose

Let a visitor browse every dress at full size, decide "this could be mine", see it on herself in seconds, and reserve it by messaging the boutique on Instagram. Success is a DM or a visit to the shop, not an online payment.

## Positioning

A Tirana boutique that rents and sells occasion dresses (verified: bio "For sale & rent!", highlights "For Sale & Rent", "Prom Dresses", "Miniprom", "Black Dresses", "Big Brother", "Clients", "Rregulla"). 26.2K followers (verified). Worn on television by Big Brother VIP Albania contestants (verified from captions naming Selin, Juela, Edisa, Nikol, Brikena). The website should feel like a step ahead of every other dress rental page in Albania: futuristic, calm, and exact (client brief).

## Operating Context

- Shop at Rruga Andon Zako Cajupi, pas LSI, Tirane; Google Maps pin 41.320034, 19.812943 (verified).
- Orders and reservations happen by Instagram message (verified from captions: "Reserve the dress and bag by sending us a message").
- Prices, opening hours, rental duration, deposit and the rental rules ("Rregulla") are NOT known and must not be invented. Link to Instagram for them.
- Visitors are on mobile Safari and Chrome, often on 4G, sometimes in the shop itself under warm ceiling light (inferred).

## Capabilities and Constraints

- Catalog content is imported from the Instagram feed (images and captions) and stored as static files; a re-run of the harvest refreshes it.
- Try-on: camera or an uploaded photo, pose detection on device, garment cutout overlay, freeze frame, manual adjust. Nothing is uploaded, stored, or sent; closing the room discards every frame.
- No accounts, no cart, no checkout, no prices.
- Copy in English; Albanian strings can be added later through one dictionary file (inferred need: the audience is Albanian).

## Brand Commitments

- Name: "Dresses by Greta" (verified). Handle @dressesbygreta (verified).
- Monogram: gold script "G" on an ivory disc (verified profile picture). The gold may inform a single accent; the site itself is not ivory or beige.
- Client brief pins the world as futuristic (client, 2026-09-16).
- Voice from captions: short, warm, confident, a single emoji; English with Albanian hashtags (verified). The site keeps the confidence and drops the emoji.

## Evidence on Hand

- 156 post links harvested from the profile grid (27 photo or carousel posts, 129 reels) with alt text and captions.
- Full-resolution images (1080 px wide) and captions per post via the public embed pages.
- Dress categories visible in the feed and highlights: prom, mini prom, black dresses, wedding guest, birthday, TV looks.

## Product Principles

- The dress leads; the interface recedes. Colour on the page comes from the dresses.
- Every motion has a job: reveal a dress, confirm a tap, or move the visitor between the catalog and the try-on room.
- Privacy is a feature, stated plainly and kept literally.
- Never claim what the shop has not said: no prices, no availability, no rules.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast on a dark surface; focus rings themed, never removed.
- All scroll and camera motion collapses under prefers-reduced-motion; the catalog still works with no JavaScript motion at all.
- The try-on has a photo-upload path for devices without a camera and a full keyboard path for every control.
- Albanian and English speakers; short sentences that translate cleanly.
