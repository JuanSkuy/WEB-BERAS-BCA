# Database Schema Documentation

## Tabel Users (User Admin)

Tabel `users` menyimpan data pengguna, termasuk admin dan user biasa.

### Struktur Tabel

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Kolom

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key, auto-generated |
| `email` | TEXT | Email pengguna (unique, required) |
| `name` | TEXT | Nama pengguna (optional) |
| `password_hash` | TEXT | Hash password (bcrypt, required) |
| `role` | TEXT | Role pengguna: 'user' atau 'admin' (default: 'user') |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan akun |

### Indexes

- `idx_users_email` - Index pada kolom `email` untuk pencarian cepat
- `idx_users_role` - Index pada kolom `role` untuk filter admin/user

### Constraints

- `chk_users_role` - Memastikan role hanya 'user' atau 'admin'

### Contoh Data

#### User Biasa
```sql
INSERT INTO users (email, password_hash, role) 
VALUES ('user@example.com', '$2b$10$...', 'user');
```

#### Admin
```sql
INSERT INTO users (email, password_hash, role) 
VALUES ('admin@example.com', '$2b$10$...', 'admin');
```

### Query Berguna

#### Cari semua admin
```sql
SELECT id, email, name, created_at 
FROM users 
WHERE role = 'admin';
```

#### Update user menjadi admin
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

#### Hitung jumlah admin
```sql
SELECT COUNT(*) as admin_count 
FROM users 
WHERE role = 'admin';
```

## Tabel Lainnya

### Categories
Menyimpan kategori produk.

### Settings
Menyimpan pengaturan toko (nama, alamat, kontak, dll).

### Products
Menyimpan data produk dengan relasi ke categories.

### Orders
Menyimpan data pesanan dengan relasi ke users.

### Order Items
Menyimpan item-item dalam setiap pesanan.

