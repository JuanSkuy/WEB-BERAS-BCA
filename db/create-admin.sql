-- ============================================
-- Script untuk Membuat Admin Pertama
-- ============================================
-- PERHATIAN: Ganti email dan password_hash sebelum menjalankan!
-- 
-- Cara membuat password_hash:
-- 1. Gunakan bcrypt dengan cost factor 10
-- 2. Atau gunakan endpoint /api/admin/create-admin
-- 3. Atau gunakan halaman /admin/setup

-- ============================================
-- CONTOH: Membuat Admin dengan Email dan Password
-- ============================================
-- Ganti nilai di bawah ini sesuai kebutuhan:
-- - email: email admin yang diinginkan
-- - password_hash: hash bcrypt dari password (minimal 6 karakter)

-- Contoh membuat admin:
-- INSERT INTO users (email, password_hash, role, name)
-- VALUES (
--   'admin@example.com',
--   '$2b$10$YourBcryptHashHere',  -- Ganti dengan hash bcrypt yang valid
--   'admin',
--   'Administrator'
-- );

-- ============================================
-- ALTERNATIF: Update User Existing menjadi Admin
-- ============================================
-- Jika sudah ada user, bisa diubah menjadi admin:
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE email = 'user@example.com';

-- ============================================
-- CEK ADMIN YANG SUDAH ADA
-- ============================================
-- Untuk melihat semua admin:
SELECT id, email, name, role, created_at 
FROM users 
WHERE role = 'admin';

-- ============================================
-- CATATAN PENTING
-- ============================================
-- 1. Jangan hardcode password_hash di production!
-- 2. Gunakan endpoint /api/admin/create-admin atau halaman /admin/setup
-- 3. Pastikan password minimal 6 karakter
-- 4. Simpan password dengan aman

