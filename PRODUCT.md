# Product

Dresses by Greta: the webshop of the boutique @dressesbygreta in Tirana, Albania. Floor-length evening and prom gowns, cocktail and mini dresses. The boutique sells and rents; the website sells (sale only, decided by Luca on 2026-09-23) and sends renting to Instagram.

Facts marked (verified) come from the public Instagram profile read on 2026-09-16. Facts marked (inferred) come from the client brief and were not confirmed by an interview.

## Platform

web

## Stack

One Cloudflare Worker (Hono) renders every storefront page on the server, serves the JSON APIs and the product photographs (R2), and keeps the catalogue, stock and orders in D1. Vite builds the browser code (vanilla TypeScript) through the Cloudflare Vite plugin; in development the Worker runs locally in workerd with simulated D1 and R2. GSAP 3 (core, ScrollTrigger) is the only animation engine; native scroll. Same-origin links swap <main> through a small client router so a dress photograph can fly from the Lookbook into its product page. No accounts for shoppers, no analytics, no advertising cookies; the bag lives in localStorage on the device.

## Users

- Young women in Tirana and across Albania shopping for a prom (mature), wedding-guest, birthday or TV appearance dress, mostly on a phone, arriving from the Instagram bio link (inferred from the feed hashtags).
- Their mothers and friends, who co-decide and often pay (inferred).
- Greta and her team, who photograph the dresses, set prices and stock, and handle orders in the admin (verified that the account is run as a boutique; the admin is new).

## Product Purpose

Let a visitor find a dress in her size, see it large, add it to the bag and order it with cash on delivery, in Albanian or English. Success is a placed order that the shop confirms by phone. Card payment is built as an adapter and stays off until a contract with an Albanian bank gateway exists.

## Positioning

A Tirana boutique that rents and sells occasion dresses (verified: bio "For sale & rent!", highlights "For Sale & Rent", "Prom Dresses", "Miniprom", "Black Dresses", "Big Brother", "Clients", "Rregulla"). 26.2K followers (verified). Worn on television by Big Brother VIP Albania contestants (verified from captions). The website should feel like a step ahead of every other dress page in Albania: a lookbook with Awwwards-level motion, calm and exact (client brief).

## Operating Context

- Shop at Rruga Andon Zako Cajupi, pas LSI, Tirane; Google Maps pin 41.320034, 19.812943 (verified).
- Prices (Lekë), stock per size, delivery fees per zone (Tirana, rest of Albania, Kosovo) and product descriptions are entered by Greta in the admin; none are invented in code. Opening hours, rental duration, deposit and the rental rules are not known and are linked to Instagram.
- Sizes are European 34, 36, 38, 40, 42 shown with XS, S, M, L, XL (decided 2026-09-23).
- Orders arrive in the admin; the shop calls the customer to confirm (process to be confirmed with Greta). Email alerts need a custom domain first.
- Visitors are on mobile Safari and Chrome, often on 4G, sometimes in Instagram's in-app browser (inferred).

## Capabilities and Constraints

- Catalogue in D1: names and descriptions in Albanian and English, price and optional previous price, categories (gowns, mini, black, TV), colour, featured flag, Instagram link, draft or published. A dress is visible only when published, priced and photographed.
- Photographs: the admin resizes in the browser (WebP, JPEG on iPhone Safari) to 480, 960 and 1600 px plus a 20 px stand-in; the Worker checks magic bytes and stores them in R2, served immutable.
- Stock per size with a database check that it never goes negative: an order that would oversell fails whole. Cancelling an order returns its dresses to stock.
- Checkout: name, phone, optional email, zone, city, address, notes; cash on delivery; card only when a gateway is configured (a simulated bank exists for local development). Prices are recomputed on the server; a client reference makes double submits idempotent; a honeypot and per-IP limits keep bots out.
- Admin at /admin, one password stored only as a PBKDF2 hash (ADMIN_PASSWORD_HASH secret), HMAC-signed session cookie, SameSite=Strict plus an Origin check; a password-free sign-in exists only in local development.

## Brand Commitments

- Name: "Dresses by Greta" (verified). Handle @dressesbygreta (verified).
- Monogram: gold script "G" on an ivory disc (verified profile picture). The site itself stays white.
- The look is the client's pinned reference (vivetofficial.com, 2026-09-16): white, Helvetica, 12px uppercase chrome, square corners, photographs as the only colour. Evolved, not replaced, on 2026-09-23.
- Voice from captions: short, warm, confident; the site keeps the confidence and drops the emoji.

## Evidence on Hand

- 39 dresses imported from the Instagram feed with their photographs; 7 featured.
- No real prices, stock or delivery fees yet: Greta enters them. Local development uses invented demo values (tools/seed.py --demo) that must never reach the live shop.

## Product Principles

- The dress leads; the interface recedes. Colour on the page comes from the dresses.
- Every motion has a job: reveal a dress, confirm a tap, or carry the visitor from one page to the next.
- Never claim what the shop has not said: prices, stock, fees and rules come from Greta or stay unsaid.
- Nothing is lost on a phone: every task works one-handed on a 390px screen.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast on white; focus rings themed, never removed; real radio buttons for sizes and payment.
- All motion collapses under prefers-reduced-motion; every page is server-rendered and works without JavaScript motion.
- Albanian and English; short sentences that translate cleanly. Albanian strings still need a native speaker's sign-off.
