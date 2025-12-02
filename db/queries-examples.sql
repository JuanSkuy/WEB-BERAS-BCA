-- ============================================
-- Contoh Query SQL yang Berguna
-- ============================================

-- ============================================
-- QUERY USERS & ADMIN
-- ============================================

-- 1. Lihat semua users
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- 2. Lihat semua admin
SELECT id, email, name, created_at 
FROM users 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 3. Lihat semua user biasa
SELECT id, email, name, created_at 
FROM users 
WHERE role = 'user'
ORDER BY created_at DESC;

-- 4. Hitung jumlah admin
SELECT COUNT(*) as total_admin 
FROM users 
WHERE role = 'admin';

-- 5. Hitung jumlah user biasa
SELECT COUNT(*) as total_users 
FROM users 
WHERE role = 'user';

-- 6. Update user menjadi admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- 7. Update admin menjadi user biasa
UPDATE users 
SET role = 'user' 
WHERE email = 'admin@example.com';

-- 8. Cari user berdasarkan email
SELECT * FROM users WHERE email = 'user@example.com';

-- ============================================
-- QUERY PRODUCTS
-- ============================================

-- 1. Lihat semua produk dengan kategori
SELECT 
  p.id, 
  p.name, 
  p.price_cents, 
  p.stock,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC;

-- 2. Produk dengan stok habis
SELECT id, name, stock 
FROM products 
WHERE stock = 0;

-- 3. Produk berdasarkan kategori
SELECT p.*, c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Nama Kategori';

-- ============================================
-- QUERY ORDERS
-- ============================================

-- 1. Lihat semua pesanan dengan detail
SELECT 
  o.id,
  o.total_cents,
  o.status,
  o.created_at,
  u.email as user_email,
  u.name as user_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

-- 2. Pesanan berdasarkan status
SELECT 
  o.id,
  o.total_cents,
  o.status,
  o.created_at,
  u.email as user_email
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending'
ORDER BY o.created_at DESC;

-- 3. Total pendapatan
SELECT 
  SUM(total_cents) as total_revenue,
  COUNT(*) as total_orders
FROM orders
WHERE status != 'cancelled';

-- 4. Pendapatan per bulan (6 bulan terakhir)
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as month,
  SUM(total_cents) as revenue,
  COUNT(*) as order_count
FROM orders
WHERE created_at >= NOW() - INTERVAL '6 months'
  AND status != 'cancelled'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;

-- 5. Pesanan dengan item detail
SELECT 
  o.id as order_id,
  o.total_cents,
  o.status,
  oi.quantity,
  oi.price_cents,
  p.name as product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.id = 'order-uuid-here';

-- ============================================
-- QUERY STATISTIK
-- ============================================

-- 1. Statistik penjualan
SELECT 
  COUNT(*) as total_orders,
  SUM(total_cents) as total_revenue,
  COUNT(DISTINCT user_id) as total_customers
FROM orders
WHERE status != 'cancelled';

-- 2. Pesanan per status
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_cents) as total
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 3. Top produk terlaris
SELECT 
  p.name,
  SUM(oi.quantity) as total_sold,
  SUM(oi.quantity * oi.price_cents) as total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;

-- 4. Pelanggan terbaik
SELECT 
  u.email,
  u.name,
  COUNT(o.id) as total_orders,
  SUM(o.total_cents) as total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status != 'cancelled'
GROUP BY u.id, u.email, u.name
ORDER BY total_spent DESC
LIMIT 10;

-- ============================================
-- QUERY SETTINGS
-- ============================================

-- 1. Lihat semua pengaturan
SELECT key, value, updated_at 
FROM settings 
ORDER BY key;

-- 2. Ambil pengaturan tertentu
SELECT value 
FROM settings 
WHERE key = 'store_name';

-- 3. Update pengaturan
UPDATE settings 
SET value = 'Nilai Baru', updated_at = NOW()
WHERE key = 'store_name';

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- 1. Hapus pesanan yang dibatalkan lebih dari 30 hari
DELETE FROM orders 
WHERE status = 'cancelled' 
  AND created_at < NOW() - INTERVAL '30 days';

-- 2. Update stok produk
UPDATE products 
SET stock = stock + 10 
WHERE id = 'product-uuid-here';

-- 3. Backup data (contoh)
-- COPY (SELECT * FROM users) TO '/path/to/backup/users.csv' CSV HEADER;

