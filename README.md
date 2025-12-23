# 📧 API Contact Verify

API para verificar emails y números de WhatsApp.

## 🚀 Inicio Rápido

```bash
npm install
cp .env.example .env
npm start
```

La API corre en `http://localhost:3002`

## 📖 Endpoints

### Email Verification

#### `POST /api/email/verify`
Verificación completa de email (formato, MX, disposable, role).

```bash
curl -X POST http://localhost:3002/api/email/verify \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu-api-key" \
  -d '{"email": "usuario@gmail.com"}'
```

**Respuesta:**
```json
{
  "success": true,
  "email": "usuario@gmail.com",
  "valid": true,
  "checks": {
    "format": true,
    "mx": true,
    "smtp": null,
    "disposable": false,
    "role_account": false
  },
  "details": {
    "domain": "gmail.com",
    "mx_records": ["gmail-smtp-in.l.google.com"]
  }
}
```

#### `POST /api/email/quick`
Verificación rápida (solo formato y MX).

#### `POST /api/email/batch`
Verificar múltiples emails (máx 50).

```bash
curl -X POST http://localhost:3002/api/email/batch \
  -H "x-api-key: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{"emails": ["test@gmail.com", "fake@tempmail.com"], "quick": true}'
```

---

### WhatsApp Verification

#### `POST /api/whatsapp/verify`
Verificar número de WhatsApp.

```bash
curl -X POST http://localhost:3002/api/whatsapp/verify \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu-api-key" \
  -d '{"phone": "+52 55 1234 5678"}'
```

**Respuesta:**
```json
{
  "success": true,
  "phone": "+52 55 1234 5678",
  "normalized": "525512345678",
  "valid": true,
  "has_whatsapp": true,
  "checks": {
    "format": true,
    "country_code": true,
    "length": true
  },
  "details": {
    "country_code": "52",
    "country": "MX",
    "whatsapp_link": "https://wa.me/525512345678"
  }
}
```

#### `POST /api/whatsapp/quick`
Verificación rápida (solo formato).

#### `POST /api/whatsapp/batch`
Verificar múltiples números (máx 25).

#### `POST /api/whatsapp/link`
Generar link de WhatsApp con mensaje.

```bash
curl -X POST http://localhost:3002/api/whatsapp/link \
  -H "x-api-key: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{"phone": "525512345678", "message": "Hola, quiero información"}'
```

## 💰 Monetización (RapidAPI)

| Plan | Precio | Requests/mes |
|------|--------|--------------|
| Free | $0 | 50 |
| Basic | $9.99 | 1,000 |
| Pro | $29.99 | 10,000 |
| Business | $99.99 | 100,000 |

## 🚀 Deploy

Mismo proceso que API QR - Railway o Render.
