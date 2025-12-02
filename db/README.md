# Database SQL Files

File-file SQL untuk setup dan maintenance database BCA E-Commerce.

## 📁 File-file SQL

### 1. `schema.sql`
**File definisi schema lengkap** - Berisi semua CREATE TABLE statements untuk semua tabel.

**Kegunaan:**
- Referensi struktur database
- Dokumentasi schema
- Tidak perlu dijalankan jika sudah menggunakan `init-database.sql`

### 2. `init-database.sql` ⭐ **RECOMMENDED**
**Script inisialisasi database** - File utama untuk setup database pertama kali.

**Cara menggunakan:**
```bash
# Via psql
psql -U your_user -d your_database -f db/init-database.sql

# Atau copy-paste isi file ke database client (pgAdmin, DBeaver, dll)
```

**Apa yang dilakukan:**
- Membuat extension pgcrypto untuk UUID
- Membuat semua tabel (users, products, categories, orders, dll)
- Membuat semua index
- Setup constraint dan foreign keys

### 3. `migrations/0002_add_users_role.sql`
**Migration untuk menambahkan kolom role** - Untuk database yang sudah ada.

**Kapan digunakan:**
- Jika database sudah ada dan perlu menambahkan kolom `role` ke tabel `users`
- Jika sudah menjalankan `init-database.sql`, file ini tidak perlu

**Cara menggunakan:**
```bash
psql -U your_user -d your_database -f db/migrations/0002_add_users_role.sql
```

### 4. `create-admin.sql`
**Contoh script untuk membuat admin** - Hanya contoh, jangan langsung dijalankan!

**Catatan:**
- File ini hanya berisi contoh dan komentar
- **JANGAN hardcode password_hash** di production
- Gunakan endpoint `/api/admin/create-admin` atau halaman `/admin/setup` untuk membuat admin

### 5. `queries-examples.sql`
**Contoh-contoh query SQL yang berguna** - Referensi query untuk berbagai keperluan.

**Berisi:**
- Query untuk melihat users dan admin
- Query untuk products dan categories
- Query untuk orders dan statistik
- Query maintenance

## 🚀 Quick Start

### Setup Database Baru

1. **Buat database:**
```sql
CREATE DATABASE bca_ecommerce;
```

2. **Jalankan init script:**
```bash
psql -U postgres -d bca_ecommerce -f db/init-database.sql
```

3. **Buat admin pertama:**
   - Buka: `http://localhost:3000/admin/setup`
   - Atau gunakan API: `POST /api/admin/create-admin`

### Setup Database yang Sudah Ada

Jika database sudah ada dan perlu menambahkan fitur admin:

1. **Jalankan migration:**
```bash
psql -U postgres -d bca_ecommerce -f db/migrations/0002_add_users_role.sql
```

2. **Buat admin pertama** (sama seperti di atas)

## 📊 Struktur Tabel

### Users (dengan role admin)
```sql
users
├── id (UUID, PK)
├── email (TEXT, UNIQUE)
├── name (TEXT)
├── password_hash (TEXT)
├── role (TEXT: 'user' | 'admin')
└── created_at (TIMESTAMPTZ)
```

### Tabel Lainnya
- `categories` - Kategori produk
- `products` - Data produk
- `addresses` - Alamat pengiriman
- `orders` - Data pesanan
- `order_items` - Item dalam pesanan
- `settings` - Pengaturan toko

## 🔐 Keamanan

1. **Jangan hardcode password** di SQL files
2. **Gunakan environment variables** untuk database credentials
3. **Backup database** secara berkala
4. **Hapus endpoint `/api/admin/create-admin`** setelah admin pertama dibuat (untuk production)

## 📝 Query Berguna

Lihat file `queries-examples.sql` untuk contoh-contoh query yang sering digunakan.

## 🆘 Troubleshooting

### Error: "extension pgcrypto does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: "column role does not exist"
Jalankan migration: `db/migrations/0002_add_users_role.sql`

### Error: "constraint chk_users_role already exists"
File migration sudah dijalankan sebelumnya, aman untuk diabaikan.

## 📚 Dokumentasi Lengkap

Lihat `docs/database-schema.md` untuk dokumentasi lengkap struktur database.

