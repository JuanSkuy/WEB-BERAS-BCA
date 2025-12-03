# Setup Webhook Xendit dengan ngrok

## URL ngrok Anda
```
https://d75d06fcf014.ngrok-free.app
```

## Langkah Setup

### 1. Update Environment Variables

Tambahkan ke file `.env`:

```env
# Xendit Configuration
XENDIT_SECRET_KEY=xnd_development_xxxxxxxxxxxxx
XENDIT_BASE_URL=https://api.xendit.co
XENDIT_CALLBACK_TOKEN=your_webhook_token  # Optional

# Base URL untuk redirects (PENTING: gunakan BASE_URL untuk server-side)
# NEXT_PUBLIC_* hanya tersedia di client-side, tidak di API routes
BASE_URL=https://d75d06fcf014.ngrok-free.app
# Atau bisa juga set NEXT_PUBLIC_BASE_URL untuk client-side
NEXT_PUBLIC_BASE_URL=https://d75d06fcf014.ngrok-free.app
```

**⚠️ PENTING:** 
- `BASE_URL` digunakan di server-side (API routes)
- `NEXT_PUBLIC_BASE_URL` digunakan di client-side
- Untuk development dengan ngrok, set KEDUANYA dengan URL ngrok yang sama

### 2. Setup Webhook di Xendit Dashboard

1. Login ke [Xendit Dashboard](https://dashboard.xendit.co)
2. Masuk ke **Settings** → **Webhooks**
3. Klik **Add New Webhook**
4. Isi form:
   - **Name**: `Webhook Development` (atau nama lain)
   - **URL**: `https://d75d06fcf014.ngrok-free.app/api/payment/xendit/webhook`
   - **Events**: Pilih:
     - ✅ `invoice.paid`
     - ✅ `invoice.expired`
   - **Callback Token**: (opsional, copy dan set di `.env` sebagai `XENDIT_CALLBACK_TOKEN`)
5. Klik **Save**

### 3. Test Webhook

Setelah setup, test webhook dengan:

1. Buat order di aplikasi
2. Pilih payment method "Xendit"
3. Lakukan payment di Xendit (gunakan test payment)
4. Check webhook logs di:
   - Xendit Dashboard → Webhooks → Logs
   - ngrok dashboard: http://localhost:4040

### 4. Verify Webhook Working

- Check order status otomatis berubah setelah payment
- Check logs di server untuk webhook received
- Check Xendit webhook logs untuk delivery status

## ⚠️ Catatan Penting

1. **URL ngrok berubah setiap restart**
   - Jika restart ngrok, URL akan berubah
   - Update webhook URL di Xendit dashboard
   - Atau gunakan ngrok plan berbayar untuk URL tetap

2. **Pastikan ngrok tetap running**
   - Webhook tidak akan diterima jika ngrok tidak running
   - Monitor di ngrok dashboard: http://localhost:4040

3. **ngrok-free.app warning page**
   - Xendit mungkin perlu klik "Visit Site" di warning page ngrok
   - Untuk production, gunakan domain sendiri

## 🔍 Troubleshooting

### Webhook tidak diterima
- ✅ Pastikan ngrok masih running
- ✅ Check webhook URL di Xendit sudah benar
- ✅ Check ngrok dashboard untuk incoming requests
- ✅ Pastikan server development running di port 3000

### Webhook 404
- ✅ Pastikan route `/api/payment/xendit/webhook` sudah ada
- ✅ Check server logs untuk error

### Webhook 401 (Invalid token)
- ✅ Check `XENDIT_CALLBACK_TOKEN` di `.env` sudah benar
- ✅ Atau hapus token verification untuk testing

