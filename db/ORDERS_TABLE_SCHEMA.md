# Orders Table Schema Documentation

## Overview
Tabel `orders` menyimpan informasi pesanan dari customer, termasuk informasi pembayaran dan status pengiriman.

## Struktur Tabel

### Kolom Utama

| Kolom | Tipe | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID unik pesanan |
| `user_id` | UUID | FOREIGN KEY → users(id), ON DELETE SET NULL | ID user yang membuat pesanan |
| `total_cents` | INTEGER | NOT NULL, CHECK (>= 0) | Total harga dalam sen (Rupiah * 100) |
| `shipping_cost_cents` | INTEGER | NOT NULL, DEFAULT 0, CHECK (>= 0) | Ongkos kirim dalam sen |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | Status pesanan |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Waktu pesanan dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Waktu pesanan terakhir diupdate |

### Kolom Payment

| Kolom | Tipe | Constraints | Deskripsi |
|-------|------|-------------|-----------|
| `payment_method` | TEXT | NULL | Metode pembayaran: 'xendit', 'doku', 'cod', dll |
| `payment_invoice_number` | TEXT | NULL | Nomor invoice dari payment gateway |
| `payment_url` | TEXT | NULL | URL untuk redirect ke halaman pembayaran |
| `payment_status` | TEXT | NULL | Status pembayaran: 'PENDING', 'PAID', 'EXPIRED', 'FAILED' |
| `payment_channel` | TEXT | NULL | Channel pembayaran atau invoice ID dari gateway |
| `payment_code` | TEXT | NULL | Kode pembayaran (untuk virtual account, dll) |
| `payment_expired_at` | TIMESTAMPTZ | NULL | Waktu kadaluarsa pembayaran |
| `payment_status_date` | TIMESTAMPTZ | NULL | Waktu status pembayaran terakhir diupdate |

## Status Pesanan

Status yang valid untuk kolom `status`:
- `pending` - Menunggu konfirmasi
- `processing` - Sedang diproses
- `shipped` - Sudah dikirim
- `delivered` - Sudah diterima
- `cancelled` - Dibatalkan

## Indexes

1. `idx_orders_user` - Index pada `user_id` untuk query pesanan per user
2. `idx_orders_status` - Index pada `status` untuk filter berdasarkan status
3. `idx_orders_payment_invoice` - Index pada `payment_invoice_number` untuk lookup payment
4. `idx_orders_payment_status` - Index pada `payment_status` untuk filter payment status

## Relasi

- **users**: `user_id` → `users.id` (ON DELETE SET NULL)
- **order_items**: `id` → `order_items.order_id` (ON DELETE CASCADE)

## Contoh Penggunaan

### Membuat Pesanan Baru
```sql
INSERT INTO orders (user_id, total_cents, shipping_cost_cents, status)
VALUES ('user-uuid', 150000, 10000, 'pending');
```

### Update Payment Info (Xendit)
```sql
UPDATE orders
SET 
  payment_method = 'xendit',
  payment_invoice_number = 'INV-12345',
  payment_url = 'https://checkout.xendit.co/web/...',
  payment_status = 'PENDING',
  payment_channel = 'xendit-invoice-id',
  payment_expired_at = '2024-12-31 23:59:59+00',
  updated_at = now()
WHERE id = 'order-uuid';
```

### Update Payment Status dari Webhook
```sql
UPDATE orders
SET 
  payment_status = 'PAID',
  payment_status_date = now(),
  status = 'processing',
  updated_at = now()
WHERE payment_invoice_number = 'INV-12345';
```

## Migration

Untuk database yang sudah ada, jalankan migration:
```bash
psql -d your_database -f db/migrations/0004_add_payment_fields.sql
```

Atau kolom akan otomatis ditambahkan saat `ensureSchema()` dipanggil dari aplikasi.

