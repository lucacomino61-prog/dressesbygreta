---
version: 1
slug: "src-worker-views-shop-ts"
primary_target: "src/worker/views/shop.ts"
related_targets: ["src/worker/views/product.ts","src/worker/views/checkout.ts","src/worker/views/home.ts","src/client/motion.ts"]
---

# Shop surface brief, Dresses by Greta

Naming (Luca, 2026-09-23): the site calls this surface "Shop" in both languages; "lookbook" stays the name of its structure here. The home page is the hero followed directly by the shop; the featured rail and the sizes band were removed from home.

Scope: the webshop routes rendered by the Worker: `/` (the hero, then the shop), `/dyqani` (the shop on its own, all dresses and by size), its index view, `/fustan/<slug>` (product), the bag drawer, `/porosia` (checkout) and `/porosia/<id>` (confirmation). Visitor mode: Persuade, turning into a short Operate task at checkout. Audience: young women in Tirana and their mothers, from the Instagram bio link, on phones. Job: find a dress in her size, see it large, add it to the bag, order with cash on delivery. Proof: the real dress photographed by the boutique, a price in Lek, the sizes actually in stock. Constraints: sale only; EU sizes 34, 36, 38, 40, 42 shown with XS to XL; cash on delivery now, card payment only once a bank gateway exists; prices, stock and delivery fees come from the admin and are never invented; Albanian first, English via ?lang=en; GSAP is the only scheduler; no GSAP pin or snap, no Lenis (DESIGN.md).

## Direction contract

THESIS: The shop is Greta's lookbook. Every dress gets a spread, full-height photograph beside its second photo and a caption with price, sizes and one black button, turned page by page as you scroll; the index view is the lookbook's contents page. It refuses the square product grid with badges and a filter sidebar.

OWN-WORLD: The incumbent world unchanged: white ground, black ink, Helvetica 12px uppercase at 0.02em, 14px body, square corners, filled black buttons, 1px hairlines, photographs as the only colour, the scan-bar print on every photograph. New atoms in the same grammar: spread numbers "01 / 39", a vertical size index of numerals on the page edge, square size toggles with sold-out sizes struck through, prices set in the same Helvetica.

STORY: She scrolls past the hero into the Shop (or opens /dyqani) at spread 01, scrolls, each spread slides over the last and prints in. She taps 38 on the size index; spreads without a 38 fold away and the count reads the sizes left. She opens the contents page, taps a dress; its photograph flies into the product page. She picks 38, the photo drops into the bag, she orders with cash on delivery.

FIRST VIEWPORT: On home the first viewport stays the hero; the shop's first spread follows it. On /dyqani at 1440x900: white 54px header (SHOP and the category list left, wordmark centre, EN / KËRKO / ÇANTA right). Below it one spread: columns 1 to 7 the dress photograph at full remaining height; columns 8 to 11 the second photograph on top and the caption under it (spread number, name, price in Lek at 20px, the 34 to 42 toggles, full-width black SHTO NË ÇANTË); column 12 the vertical size index TË GJITHA, 34, 36, 38, 40, 42 with INDEKSI at its foot. A dress with one photograph shows its page numeral in columns 8 to 11 instead of a second photograph. 390x844: the photograph full width, a white caption panel over its lower edge, the size index as a sticky strip under the header.

FORM: The Lookbook, position 7 of 7 on the ordered list (1 your size first, 2 occasion chapters, 3 Instagram-native profile, 4 the rack, 5 sleeves, 6 contact sheet, 7 lookbook), seed key e8df2a29. Signature interaction: the page turn (each spread slides over the previous, which recedes to 0.94 and 45%, and prints in with the scan bar) plus the photograph's flight from spread or contents page into the product page.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Delivery fees per zone, the shop phone for order confirmation, real prices and stock: Greta enters them in the admin. The card gateway contract does not exist yet. Albanian strings still need a native speaker's sign-off.
