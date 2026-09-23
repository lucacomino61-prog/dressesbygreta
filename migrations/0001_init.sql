-- Dresses by Greta: catalogue, stock per size, photographs, orders, settings.

CREATE TABLE products (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  name_sq        TEXT NOT NULL,
  name_en        TEXT NOT NULL DEFAULT '',
  description_sq TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  price          INTEGER CHECK (price IS NULL OR price > 0),          -- Lek; NULL until Greta sets it
  compare_price  INTEGER CHECK (compare_price IS NULL OR compare_price > 0),
  color          TEXT NOT NULL DEFAULT '',
  categories     TEXT NOT NULL DEFAULT '[]',                            -- JSON array: gowns, mini, black, tv
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured       INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  instagram_url  TEXT NOT NULL DEFAULT '',
  sort           INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX products_status_sort ON products (status, sort);

-- Stock can never go negative: an order that would oversell fails its whole transaction.
CREATE TABLE product_sizes (
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size       TEXT NOT NULL CHECK (size IN ('34', '36', '38', '40', '42')),
  stock      INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  PRIMARY KEY (product_id, size)
);

-- One row per photograph; the WebP variants live in R2 under <key>/<width>.webp.
CREATE TABLE product_images (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  ext        TEXT NOT NULL DEFAULT 'webp' CHECK (ext IN ('webp', 'jpg')),   -- iPhone Safari cannot encode WebP
  widths     TEXT NOT NULL,                                             -- JSON array, ascending
  w          INTEGER NOT NULL,
  h          INTEGER NOT NULL,
  lqip       TEXT NOT NULL DEFAULT '',
  alt_sq     TEXT NOT NULL DEFAULT '',
  alt_en     TEXT NOT NULL DEFAULT '',
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX product_images_product ON product_images (product_id, sort);

CREATE TABLE orders (
  id             TEXT PRIMARY KEY,
  number         INTEGER NOT NULL UNIQUE,
  client_ref     TEXT UNIQUE,                                           -- idempotency key from the checkout form
  status         TEXT NOT NULL CHECK (status IN ('awaiting_payment', 'new', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'card')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  payment_ref    TEXT NOT NULL DEFAULT '',
  customer_name  TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT NOT NULL DEFAULT '',
  zone           TEXT NOT NULL,
  city           TEXT NOT NULL,
  address        TEXT NOT NULL,
  notes          TEXT NOT NULL DEFAULT '',
  subtotal       INTEGER NOT NULL,
  delivery_fee   INTEGER,                                               -- NULL: confirmed by phone
  total          INTEGER NOT NULL,
  lang           TEXT NOT NULL DEFAULT 'sq',
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX orders_status_created ON orders (status, created_at);

CREATE TABLE order_items (
  order_id   TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products (id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  size       TEXT NOT NULL,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  price      INTEGER NOT NULL,
  image_key  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX order_items_order ON order_items (order_id);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Delivery fees are Greta's to set; NULL means "confirmed by phone".
INSERT INTO settings (key, value) VALUES
  ('delivery_zones', '[{"id":"tirana","fee":null},{"id":"albania","fee":null},{"id":"kosovo","fee":null}]'),
  ('shop_phone', '');

-- Fixed-window counters for sign-in attempts and order submissions, keyed by purpose and IP.
CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
