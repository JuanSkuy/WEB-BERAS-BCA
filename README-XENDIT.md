# Setup Xendit Payment Gateway untuk Localhost Development

## 🚀 Quick Start untuk Development dengan Localhost

### 1. Install ngrok

```bash
# Via npm (recommended)
npm install -g ngrok

# Atau download dari https://ngrok.com/download
```

### 2. Jalankan ngrok

```bash
# Di terminal terpisah, jalankan:
ngrok http 3000
```

Anda akan mendapatkan URL seperti: `https://abc123.ngrok.io`

### 3. Update Environment Variables

Tambahkan ke file `.env`:

```env
# Xendit (gunakan Development API Key untuk testing)
XENDIT_SECRET_KEY=xnd_development_xxxxxxxxxxxxx
XENDIT_BASE_URL=https://api.xendit.co
XENDIT_CALLBACK_TOKEN=your_webhook_token  # Optional

# Base URL untuk redirects (PENTING: set BASE_URL untuk server-side)
# NEXT_PUBLIC_* hanya tersedia di client-side, tidak di API routes
BASE_URL=https://d75d06fcf014.ngrok-free.app
# Atau bisa juga set NEXT_PUBLIC_BASE_URL untuk client-side
NEXT_PUBLIC_BASE_URL=https://d75d06fcf014.ngrok-free.app
```

**⚠️ PENTING:** 
- `BASE_URL` digunakan di server-side (API routes) - **WAJIB untuk redirect URLs**
- `NEXT_PUBLIC_BASE_URL` digunakan di client-side
- Untuk development dengan ngrok, set KEDUANYA dengan URL ngrok yang sama

**Contoh untuk URL ngrok Anda:**
```env
NEXT_PUBLIC_BASE_URL=https://d75d06fcf014.ngrok-free.app
```

### 4. Setup Webhook di Xendit Dashboard

1. Login ke [Xendit Dashboard](https://dashboard.xendit.co)
2. Masuk ke **Settings** → **Webhooks**
3. Klik **Add New Webhook**
4. Isi form:
   - **URL**: `https://d75d06fcf014.ngrok-free.app/api/payment/xendit/webhook`
   - **Events**: Pilih:
     - ✅ `invoice.paid`
     - ✅ `invoice.expired`
   - **Callback Token**: (opsional, copy dan set di `.env` sebagai `XENDIT_CALLBACK_TOKEN`)
5. Klik **Save**

**⚠️ Catatan Penting:**
- URL ngrok berubah setiap kali restart ngrok (kecuali pakai plan berbayar)
- Jika URL ngrok berubah, update webhook URL di Xendit dashboard
- Pastikan ngrok tetap running saat testing payment

### 5. Jalankan Development Server

```bash
npm run dev
```

## 📝 Catatan Penting

### URL ngrok berubah setiap restart
- Setiap kali restart ngrok, URL akan berubah
- **Solusi**: Update webhook URL di Xendit dashboard setiap kali restart ngrok
- Atau gunakan ngrok plan berbayar untuk URL tetap

### Testing Payment Flow

1. **Create Order** → User checkout dengan payment method "Xendit"
2. **Redirect** → User di-redirect ke Xendit payment page
3. **Payment** → User bayar di Xendit (gunakan test payment method)
4. **Webhook** → Xendit mengirim webhook ke ngrok URL → localhost
5. **Update Status** → Order status otomatis terupdate

### Test Payment Methods di Xendit Sandbox

- **Virtual Account**: Gunakan test account dari Xendit docs
- **E-Wallet**: Gunakan test credentials
- **Credit Card**: Gunakan test card numbers

Dokumentasi test credentials: https://docs.xendit.co

## 🔄 Alternatif tanpa Webhook (Manual Check)

Jika tidak ingin setup webhook, Anda bisa:

1. Check invoice status di Xendit dashboard
2. Atau poll status secara manual
3. Order status tidak akan auto-update, perlu manual update

## 🚢 Production Setup

Untuk production:

1. Ganti `XENDIT_SECRET_KEY` ke Production API Key
2. Set `NEXT_PUBLIC_BASE_URL` ke domain production
3. Update webhook URL di Xendit ke production URL
4. Pastikan webhook URL accessible dari internet

## 🆘 Troubleshooting

### Webhook tidak diterima
- Pastikan ngrok masih running
- Check webhook URL di Xendit dashboard sudah benar
- Check logs di ngrok dashboard: http://localhost:4040

### Payment tidak redirect
- Check `NEXT_PUBLIC_BASE_URL` sudah benar
- Pastikan redirect URLs di Xendit invoice sudah benar

### Order status tidak update
- Check webhook sudah terkirim (lihat di Xendit dashboard → Webhooks → Logs)
- Check server logs untuk error
- Verify webhook token jika sudah set

