# How to Enable Razorpay Payment Gateway

## Option 1: Via Admin Panel (Recommended)

1. Log in as a **Super Admin** to your application
2. Navigate to **Settings** → **Payment Settings**
3. Find the **"Razorpay Enabled"** toggle/checkbox
4. Enable it
5. Also configure:
   - **Razorpay Key ID** (your Razorpay public key)
   - **Razorpay Secret Key** (your Razorpay secret key)
   - **Razorpay Webhook Secret** (for webhook verification)

## Option 2: Via API Call

You can enable Razorpay using the API:

```bash
# Enable Razorpay
curl -X PATCH http://localhost:5000/api/v1/admin/settings/payment.gateway.razorpay.enabled \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"value": true}'
```

Or update multiple settings at once:

```bash
curl -X PUT http://localhost:5000/api/v1/admin/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "settings": [
      {
        "key": "payment.gateway.razorpay.enabled",
        "value": true
      },
      {
        "key": "payment.gateway.razorpay.keyId",
        "value": "YOUR_RAZORPAY_KEY_ID"
      },
      {
        "key": "payment.gateway.razorpay.keySecret",
        "value": "YOUR_RAZORPAY_SECRET_KEY"
      },
      {
        "key": "payment.gateway.razorpay.webhookSecret",
        "value": "YOUR_WEBHOOK_SECRET"
      }
    ]
  }'
```

## Option 3: Via Database (Direct)

If you have direct database access:

```javascript
// In MongoDB
db.settings.updateOne(
  { key: "payment.gateway.razorpay.enabled" },
  { $set: { value: true } },
  { upsert: true }
)
```

## Required Razorpay Credentials

1. **Key ID** (Public Key): Found in Razorpay Dashboard → Settings → API Keys
2. **Secret Key**: Found in Razorpay Dashboard → Settings → API Keys
3. **Webhook Secret**: Found in Razorpay Dashboard → Settings → Webhooks → Create/View Webhook

## Important Notes

- Make sure you've added your Razorpay credentials (Key ID and Secret Key) before enabling
- The webhook secret is optional but recommended for production
- After enabling, test with a small amount first
- Use Razorpay test mode credentials for development

