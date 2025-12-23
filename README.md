# Contact Intelligence API v2.0.0

Complete contact verification and intelligence platform. Verify emails, WhatsApp numbers, detect fraud, score leads, and discover social profiles.

## 🚀 Features

| Feature | Description |
|---------|-------------|
| ✅ **Email Verification** | Syntax, MX records, SMTP check, disposable detection |
| ✅ **WhatsApp Verification** | 200+ countries, number validation, link generation |
| 🆕 **Quality Score (0-100)** | Single score indicating contact quality |
| 🆕 **Fraud Detection** | AI-based risk scoring and pattern detection |
| 🆕 **Social Profile Discovery** | Find LinkedIn, Twitter, Gravatar, and more |
| 🆕 **Carrier Intelligence** | Operator, line type, VOIP detection, SMS deliverability |
| 🆕 **Bulk Processing** | Process thousands of contacts with webhook callbacks |

## 📦 Installation

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

## 🔑 Authentication

All endpoints require an API key in the header:

```
x-api-key: your-api-key
```

For RapidAPI, use:
```
x-rapidapi-key: your-rapidapi-key
```

## 📡 API Endpoints

### Original Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/verify` | Verify single email |
| POST | `/api/email/batch` | Verify multiple emails |
| POST | `/api/whatsapp/verify` | Verify WhatsApp number |
| POST | `/api/whatsapp/link` | Generate WhatsApp link with QR |

### NEW Premium Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact/analyze` | **Complete contact analysis** (all features in one call) |
| POST | `/api/contact/score` | Get quality score only (faster) |
| POST | `/api/contact/fraud-check` | Fraud detection only |
| POST | `/api/social/lookup` | Discover social profiles |
| POST | `/api/social/enrich` | Full contact enrichment |
| GET | `/api/social/gravatar/:email` | Get Gravatar info |
| POST | `/api/carrier/lookup` | Get carrier information |
| POST | `/api/carrier/sms-check` | Check SMS deliverability |
| POST | `/api/carrier/batch` | Batch carrier lookup |
| POST | `/api/bulk/process` | Start async bulk job |
| GET | `/api/bulk/status/:jobId` | Check job status |
| GET | `/api/bulk/results/:jobId` | Get full results |

## 💡 Usage Examples

### Complete Contact Analysis

```bash
curl -X POST https://your-api.com/api/contact/analyze \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "phone": "14155551234"
  }'
```

**Response:**
```json
{
  "success": true,
  "quality_score": {
    "score": 85,
    "grade": "A",
    "quality": "good"
  },
  "fraud_analysis": {
    "overall_risk_level": "low",
    "overall_risk_score": 10
  },
  "carrier_info": {
    "carrier": "AT&T",
    "line_type": "mobile",
    "is_voip": false
  },
  "summary": {
    "is_valid": true,
    "is_safe": true,
    "recommendation": "Excellent contact - safe to proceed"
  }
}
```

### Social Profile Discovery

```bash
curl -X POST https://your-api.com/api/social/lookup \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@company.com"}'
```

### Bulk Processing with Webhook

```bash
curl -X POST https://your-api.com/api/bulk/process \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {"email": "user1@gmail.com", "phone": "14155551234"},
      {"email": "user2@company.com", "phone": "447911123456"}
    ],
    "webhook_url": "https://your-server.com/webhook",
    "options": {
      "include_score": true,
      "include_fraud": true
    }
  }'
```

## 📊 Quality Score Breakdown

| Score | Grade | Quality | Meaning |
|-------|-------|---------|---------|
| 90-100 | A+ | Excellent | Premium lead, fully verified |
| 80-89 | A | Good | High quality, safe to proceed |
| 70-79 | B | Good | Minor issues, generally safe |
| 50-69 | C-D | Fair | Some concerns, verify further |
| 0-49 | F | Bad | High risk, additional verification needed |

## 🛡️ Fraud Risk Levels

| Level | Score | Action |
|-------|-------|--------|
| Minimal | 0-19 | Safe to proceed |
| Low | 20-39 | Normal processing |
| Medium | 40-69 | Proceed with caution |
| High | 70-100 | Block or require verification |

## 💰 Pricing Plans (RapidAPI)

| Plan | Price | Requests/month | Features |
|------|-------|----------------|----------|
| Basic | FREE | 100 | Email + WhatsApp verification |
| Pro | $19.99 | 5,000 | + Quality Score + Carrier Intel |
| Ultra | $49.99 | 25,000 | + Social Lookup + Fraud Detection |
| Mega | $149.99 | 100,000 | All features + Bulk API |

## 📝 Environment Variables

```env
# API Keys
API_KEYS=key1,key2,key3
RAPIDAPI_PROXY_SECRET=your-secret

# Server
PORT=3002
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔗 Links

- [RapidAPI Listing](https://rapidapi.com/krispaz77/api/worldwide-contact-verifier)
- [API Documentation](/api/docs)

## 📄 License

MIT License
