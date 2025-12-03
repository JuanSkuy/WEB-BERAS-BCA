# Setup Xendit Webhook untuk Localhost Development

Untuk development dengan localhost, Anda perlu menggunakan tunneling service agar Xendit bisa mengirim webhook ke localhost Anda.

## Opsi 1: Menggunakan ngrok (Recommended)

### Install ngrok
```bash
# Download dari https://ngrok.com/download
# atau install via npm
npm install -g ngrok
```

### Jalankan ngrok
```bash
# Jalankan ngrok untuk expose port 3000
ngrok http 3000
```

### Setup Webhook di Xendit
1. Copy URL dari ngrok (contoh: `https://abc123.ngrok.io`)
2. Masuk ke Xendit Dashboard → Settings → Webhooks
3. Add New Webhook
4. URL: `https://abc123.ngrok.io/api/payment/xendit/webhook`
5. Events: Pilih `invoice.paid`, `invoice.expired`
6. Copy Callback Token dan set di `.env` sebagai `XENDIT_CALLBACK_TOKEN`

### Update Environment Variable
```env
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

**Catatan:** URL ngrok berubah setiap kali restart (kecuali pakai plan berbayar). Update webhook URL di Xendit setiap kali restart ngrok.

## Opsi 2: Menggunakan localtunnel

### Install localtunnel
```bash
npm install -g localtunnel
```

### Jalankan localtunnel
```bash
lt --port 3000
```

### Setup Webhook
Sama seperti ngrok, gunakan URL yang diberikan localtunnel.

## Opsi 3: Menggunakan Cloudflare Tunnel (Gratis, URL tetap)

### Install cloudflared
```bash
# Download dari https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### Jalankan tunnel
```bash
cloudflared tunnel --url http://localhost:3000
```

## Opsi 4: Testing Manual (Tanpa Webhook)

Jika tidak ingin setup tunneling, Anda bisa:
1. Test payment flow tanpa webhook
2. Manually check invoice status di Xendit dashboard
3. Atau poll invoice status secara manual

## Tips

- Untuk development, gunakan ngrok karena paling mudah
- Untuk production, pastikan `NEXT_PUBLIC_BASE_URL` sudah set ke domain production
- Webhook token verification adalah optional tapi recommended untuk security

