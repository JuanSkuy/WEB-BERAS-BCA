-- ============================================
-- Script untuk Mengubah User Menjadi Admin
-- ============================================
-- Gunakan script ini jika user sudah ada tapi belum jadi admin

-- Cara 1: Update berdasarkan email
UPDATE users 
SET role = 'admin' 
WHERE email = 'bejoo@gmail.com';

-- Cara 2: Update semua user dengan email tertentu
UPDATE users 
SET role = 'admin' 
WHERE email IN ('bejoo@gmail.com', 'admin@example.com');

-- Cara 3: Cek dulu user yang ada
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'bejoo@gmail.com';

-- Cara 4: Lihat semua user dan role mereka
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- ============================================
-- CATATAN
-- ============================================
-- 1. Ganti 'bejoo@gmail.com' dengan email yang ingin diubah
-- 2. Pastikan email sudah terdaftar di database
-- 3. Setelah update, user bisa login sebagai admin

