-- Pengaturan awal toko. Tidak membuat baris baru jika pengaturan sudah tersedia.
INSERT INTO store_settings (
  store_name,
  whatsapp_number,
  store_phone,
  store_email,
  store_address,
  invoice_note
)
SELECT
  'Miztel Digital',
  '',
  '',
  '',
  '',
  'Dokumen ini merupakan bukti pembelian yang sah'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

CREATE TEMP TABLE seed_products (
  name TEXT PRIMARY KEY COLLATE NOCASE,
  slug TEXT NOT NULL,
  category TEXT NOT NULL
);

INSERT INTO seed_products (name, slug, category) VALUES
  ('Netflix', 'netflix', 'Streaming Apps'),
  ('Disney+', 'disney-plus', 'Streaming Apps'),
  ('Vidio', 'vidio', 'Streaming Apps'),
  ('Viu (Anlim)', 'viu-anlim', 'Streaming Apps'),
  ('Loklok', 'loklok', 'Streaming Apps'),
  ('iQIYI', 'iqiyi', 'Streaming Apps'),
  ('WeTV', 'wetv', 'Streaming Apps'),
  ('Youku', 'youku', 'Streaming Apps'),
  ('Bstation', 'bstation', 'Streaming Apps'),
  ('Prime Video', 'prime-video', 'Streaming Apps'),
  ('Vision+ Sport', 'vision-plus-sport', 'Streaming Apps'),
  ('YouTube', 'youtube', 'Streaming Apps'),
  ('Zoom', 'zoom', 'Streaming Apps'),
  ('HBO Max', 'hbo-max', 'Streaming Apps'),
  ('Apple Music', 'apple-music', 'Music Apps'),
  ('Spotify', 'spotify', 'Music Apps'),
  ('YouTube Music', 'youtube-music', 'Music Apps'),
  ('Canva', 'canva', 'Editing Apps'),
  ('CapCut', 'capcut', 'Editing Apps'),
  ('Alight Motion', 'alight-motion', 'Editing Apps'),
  ('Meitu', 'meitu', 'Editing Apps'),
  ('Wink', 'wink', 'Editing Apps'),
  ('Polar', 'polar', 'Editing Apps'),
  ('VSCO', 'vsco', 'Editing Apps'),
  ('DazzCam', 'dazzcam', 'Other Apps'),
  ('Gemini', 'gemini', 'Other Apps'),
  ('Grammarly', 'grammarly', 'Other Apps'),
  ('QuillBot', 'quillbot', 'Other Apps'),
  ('Scribd', 'scribd', 'Other Apps'),
  ('Duolingo', 'duolingo', 'Other Apps'),
  ('ChatGPT Business', 'chatgpt-business', 'Other Apps');

-- Aktifkan dan perbarui kategori produk yang sudah ada tanpa mengubah gambar.
UPDATE products
SET
  category = (
    SELECT seed_products.category
    FROM seed_products
    WHERE seed_products.name = products.name COLLATE NOCASE
  ),
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM seed_products
  WHERE seed_products.name = products.name COLLATE NOCASE
);

-- Tambahkan hanya produk yang belum ada. Gambar sengaja dibiarkan NULL.
INSERT INTO products (
  name,
  slug,
  category,
  description,
  image_url,
  is_active
)
SELECT
  seed_products.name,
  seed_products.slug,
  seed_products.category,
  '',
  NULL,
  1
FROM seed_products
WHERE NOT EXISTS (
  SELECT 1
  FROM products
  WHERE products.name = seed_products.name COLLATE NOCASE
);

CREATE TEMP TABLE seed_variants (
  product_name TEXT NOT NULL COLLATE NOCASE,
  variant_name TEXT NOT NULL COLLATE NOCASE,
  price INTEGER NOT NULL,
  PRIMARY KEY (product_name, variant_name)
);

INSERT INTO seed_variants (product_name, variant_name, price) VALUES
  ('Netflix', '1 User — 7 Hari', 14000),
  ('Netflix', '1 User — 1 Bulan', 39000),
  ('Netflix', '2 User — 1 Bulan', 23000),
  ('Netflix', 'Semi Private — 1 Bulan', 43000),
  ('Disney+', 'Premium 6 User — 7 Hari', 14000),
  ('Disney+', 'Premium 6 User — 1 Bulan', 29000),
  ('Vidio', 'Platinum 2 User — 1 Bulan', 27000),
  ('Vidio', 'Platinum Private — 1 Bulan', 42000),
  ('Vidio', 'Mobile 2 User — 1 Bulan', 19000),
  ('Vidio', 'Mobile Private — 1 Bulan', 30000),
  ('Viu (Anlim)', '1 Bulan', 4000),
  ('Viu (Anlim)', '2 Bulan', 7000),
  ('Viu (Anlim)', '3 Bulan', 9000),
  ('Viu (Anlim)', '6 Bulan', 11000),
  ('Viu (Anlim)', '1 Tahun', 15000),
  ('Loklok', '3 User Basic — 1 Bulan', 18000),
  ('Loklok', '5 User Standard — 1 Bulan', 20000),
  ('Loklok', 'Basic Private — 1 Bulan', 43000),
  ('Loklok', 'Standard Private — 1 Bulan', 69000),
  ('iQIYI', 'Standard — 1 Bulan', 9000),
  ('iQIYI', 'Premium — 1 Bulan', 10000),
  ('iQIYI', 'Premium — 1 Tahun', 14000),
  ('iQIYI', 'Standard Private — 1 Bulan', 31000),
  ('iQIYI', 'Premium Private — 1 Bulan', 36000),
  ('WeTV', 'Maksimal 6 User — 1 Bulan', 9000),
  ('WeTV', '3 User — 1 Bulan', 13000),
  ('WeTV', 'Private — 1 Bulan', 24000),
  ('Youku', 'Sharing — 1 Bulan', 8000),
  ('Youku', 'Sharing — 1 Tahun', 14000),
  ('Youku', 'Private — 1 Bulan', 33000),
  ('Bstation', 'Sharing — 1 Bulan', 8000),
  ('Bstation', 'Sharing — 1 Tahun', 14000),
  ('Bstation', 'Private — 1 Bulan', 34000),
  ('Prime Video', 'Sharing — 1 Bulan', 8000),
  ('Prime Video', 'Private — 1 Bulan', 13000),
  ('Vision+ Sport', 'Sharing — 1 Bulan', 16000),
  ('Vision+ Sport', 'Private — 1 Bulan', 23000),
  ('YouTube', 'Family Plan — 1 Bulan', 10000),
  ('YouTube', 'Family Plan — 2 Bulan', 14000),
  ('YouTube', 'Individual Plan Buyer — 1 Bulan', 9000),
  ('YouTube', 'Individual Plan Buyer — 3 Bulan', 16000),
  ('YouTube', 'Individual Plan Seller — 3 Bulan', 46000),
  ('YouTube', 'Mix Plan Buyer — 3 Bulan', 15000),
  ('Zoom', '100 Peserta — 7 Hari', 7000),
  ('Zoom', '100 Peserta — 14 Hari', 10000),
  ('HBO Max', 'Standard Private — 1 Bulan', 26000),
  ('HBO Max', 'Ultimate Private — 1 Bulan', 46000),
  ('HBO Max', 'Standard Sharing — 1 Bulan', 9000),
  ('HBO Max', 'Ultimate Sharing — 1 Bulan', 11000),
  ('Apple Music', 'iOS — 1 Bulan', 8000),
  ('Apple Music', 'iOS — 2 Bulan', 10000),
  ('Spotify', 'Family Plan — 1 Bulan', 17000),
  ('Spotify', 'Individual Plan — 1 Bulan', 19000),
  ('YouTube Music', '1 Bulan', 10000),
  ('Canva', '1 Bulan', 1500),
  ('Canva', '2 Bulan', 2500),
  ('Canva', '3 Bulan', 3000),
  ('Canva', '6 Bulan', 5000),
  ('Canva', '1 Tahun', 8000),
  ('CapCut', 'Private — 1 Bulan', 32000),
  ('CapCut', 'Sharing 2 User — 1 Bulan', 19000),
  ('CapCut', 'Private — 7 Hari', 7000),
  ('CapCut', 'Sharing 2 User — 7 Hari', 4000),
  ('Alight Motion', 'Sharing — 1 Tahun', 8000),
  ('Alight Motion', 'Private Seller — 1 Tahun', 8000),
  ('Alight Motion', 'Private Buyer — 1 Tahun', 8000),
  ('Meitu', 'Android & iOS — 7 Hari', 8000),
  ('Wink', 'Android Only — 7 Hari', 8000),
  ('Polar', 'Android & iOS — 1 Tahun', 14000),
  ('VSCO', 'Android — 1 Tahun', 14000),
  ('DazzCam', 'Lifetime iOS', 10000),
  ('Gemini', '1 Bulan', 12000),
  ('Gemini', '1 Tahun', 22000),
  ('Grammarly', '1 Bulan', 13000),
  ('QuillBot', '1 Bulan', 15000),
  ('Scribd', 'Sharing — 1 Bulan', 7000),
  ('Scribd', 'Private — 1 Bulan', 10000),
  ('Duolingo', 'Family Plan — 1 Bulan', 14000),
  ('ChatGPT Business', 'Invite Email Sendiri', 100000);

-- Perbarui harga varian yang sudah ada dan aktifkan kembali jika nonaktif.
UPDATE product_variants
SET
  price = (
    SELECT seed_variants.price
    FROM seed_variants
    INNER JOIN products
      ON products.name = seed_variants.product_name COLLATE NOCASE
    WHERE products.id = product_variants.product_id
      AND seed_variants.variant_name = product_variants.variant_name COLLATE NOCASE
    LIMIT 1
  ),
  duration_label = '',
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM seed_variants
  INNER JOIN products
    ON products.name = seed_variants.product_name COLLATE NOCASE
  WHERE products.id = product_variants.product_id
    AND seed_variants.variant_name = product_variants.variant_name COLLATE NOCASE
);

-- Tambahkan hanya varian yang belum ada pada produk terkait.
INSERT INTO product_variants (
  product_id,
  variant_name,
  duration_label,
  price,
  is_active
)
SELECT
  (
    SELECT MIN(products.id)
    FROM products
    WHERE products.name = seed_variants.product_name COLLATE NOCASE
  ),
  seed_variants.variant_name,
  '',
  seed_variants.price,
  1
FROM seed_variants
WHERE NOT EXISTS (
  SELECT 1
  FROM product_variants
  INNER JOIN products
    ON products.id = product_variants.product_id
  WHERE products.name = seed_variants.product_name COLLATE NOCASE
    AND product_variants.variant_name = seed_variants.variant_name COLLATE NOCASE
);

DROP TABLE seed_variants;
DROP TABLE seed_products;
