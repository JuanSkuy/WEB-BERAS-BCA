# Xendit API Troubleshooting

## Error: "Invalid input data. Please check your request"

Error ini biasanya disebabkan oleh format data yang tidak sesuai dengan yang diharapkan Xendit API.

### Checklist Validasi

1. **Amount (Jumlah)**
   - ✅ Minimum: Rp 10,000 (10,000 IDR)
   - ✅ Format: Number (bukan string)
   - ✅ Tidak boleh negatif

2. **External ID**
   - ✅ Required
   - ✅ Max 64 characters
   - ✅ Harus unique

3. **Customer Email**
   - ✅ Required
   - ✅ Format email valid
   - ✅ Tidak boleh kosong

4. **Customer Name (given_names)**
   - ✅ Required
   - ✅ Max 255 characters
   - ✅ Tidak boleh kosong

5. **Currency**
   - ✅ Set ke 'IDR' (default untuk Indonesia)

6. **Redirect URLs**
   - ✅ Format URL valid
   - ✅ Harus accessible (tidak bisa localhost tanpa ngrok)

### Common Issues

#### 1. Amount terlalu kecil
```json
// ❌ Error
{ "amount": 5000 }

// ✅ Correct
{ "amount": 10000 }
```

#### 2. Email tidak valid
```json
// ❌ Error
{ "payer_email": "" }
{ "payer_email": "invalid-email" }

// ✅ Correct
{ "payer_email": "customer@example.com" }
```

#### 3. Customer name kosong
```json
// ❌ Error
{ "customer": { "given_names": "" } }

// ✅ Correct
{ "customer": { "given_names": "John" } }
```

#### 4. External ID terlalu panjang
```json
// ❌ Error (lebih dari 64 chars)
{ "external_id": "VERY_LONG_EXTERNAL_ID_THAT_EXCEEDS_64_CHARACTERS_LIMIT" }

// ✅ Correct (max 64 chars)
{ "external_id": "ORDER-12345678-1234567890" }
```

### Debug Steps

1. **Check Server Logs**
   - Lihat console log untuk request payload
   - Check error details dari Xendit

2. **Verify API Key**
   - Pastikan menggunakan Development API Key untuk testing
   - Format: `xnd_development_...`

3. **Test dengan Minimal Request**
   ```json
   {
     "external_id": "TEST-123",
     "amount": 10000,
     "payer_email": "test@example.com",
     "customer": {
       "given_names": "Test",
       "email": "test@example.com"
     }
   }
   ```

4. **Check Xendit Dashboard**
   - Lihat API Logs di Xendit Dashboard
   - Check error details di sana

### Testing dengan Postman

Gunakan Postman untuk test langsung ke Xendit API:

```bash
POST https://api.xendit.co/v2/invoices
Headers:
  Authorization: Basic <base64(api_key:)>
  Content-Type: application/json

Body:
{
  "external_id": "TEST-123",
  "amount": 10000,
  "currency": "IDR",
  "payer_email": "test@example.com",
  "description": "Test invoice",
  "customer": {
    "given_names": "Test",
    "email": "test@example.com"
  }
}
```

