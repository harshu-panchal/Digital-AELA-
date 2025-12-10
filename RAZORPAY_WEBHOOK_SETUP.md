# Razorpay Webhook Configuration Guide

## Overview

Razorpay webhooks are essential for reliably updating payment status. The webhook is the **primary mechanism** for payment status updates and should be configured in production.

## Webhook Endpoint

### Production

```
POST https://api.digitalaela.com/api/v1/payments/razorpay/webhook
```

### Development/Testing

```
POST http://your-dev-url/api/v1/payments/razorpay/webhook
```

## Required Webhook Events

The following events must be enabled in Razorpay Dashboard:

1. **payment.captured** - When payment is successfully captured
2. **payment.authorized** - When payment is authorized (for orders)
3. **payment_link.paid** - When payment link is paid (for payment links)
4. **payment.failed** - When payment fails

## Configuration Steps

### Step 1: Razorpay Dashboard Setup

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **Webhooks**
3. Click **Create New Webhook**
4. Enter the webhook URL:
   - Production: `https://api.digitalaela.com/api/v1/payments/razorpay/webhook`
5. Select the following events:
   - `payment.captured`
   - `payment.authorized`
   - `payment_link.paid`
   - `payment.failed`
6. Copy the **Webhook Secret** (you'll need this)

### Step 2: Configure Webhook Secret

The webhook secret must be configured in your application. You have **two options**:

#### Option A: Via Admin Settings UI (Recommended)

1. After creating the webhook in Razorpay Dashboard, copy the **Webhook Secret** from:
   - Razorpay Dashboard → Settings → Webhooks → Your webhook → Copy Secret
2. In your application, go to **Admin Panel** → **System Settings** → **Payment** tab
3. Look for **"Razorpay Webhook Secret"** field
4. If it doesn't appear:
   - Click **"Initialize Default Settings"** button (if available) to create all default settings
   - Or it will appear automatically when you first save settings
5. Paste the webhook secret in the **"Razorpay Webhook Secret"** field
6. Click **"Save Settings"**

The field will show as a password field (masked with dots) for security.

#### Option B: Via Environment Variable

1. Copy the **Webhook Secret** from Razorpay Dashboard
2. Add it to your `.env` file:
   ```
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```
3. Restart your backend server

**Note**: If using environment variable, it will take precedence over settings in database. However, using the admin UI is recommended for easier management.

#### Verifying the Setting Exists

To verify the webhook secret setting is configured:

1. **Check Admin UI**: Go to Admin Panel → System Settings → Payment tab

   - Look for "Razorpay Webhook Secret" field
   - If it shows a value (even if masked), it's configured

2. **Check Database** (if you have direct access):

   ```javascript
   // In MongoDB or via script
   db.settings.findOne({ key: "payment.gateway.razorpay.webhookSecret" });
   ```

3. **Check Environment Variable**:
   - Verify `RAZORPAY_WEBHOOK_SECRET` is set in your `.env` file

**Important**: The setting key must be exactly: `payment.gateway.razorpay.webhookSecret`

### Step 3: Verify Webhook is Working

1. In Razorpay Dashboard → Webhooks
2. Send a test webhook to verify it's reaching your server
3. Check server logs for:
   - `[Payment Webhook] Webhook received`
   - `[Payment Webhook] Event received:`

## How Webhooks Work

### Payment Link Flow (Primary Method)

1. User completes payment on Razorpay
2. Razorpay sends `payment_link.paid` webhook event
3. Backend receives webhook and:
   - Verifies webhook signature
   - Finds payment by `gatewayPaymentIntentId` (payment link ID)
   - Updates payment status to "completed"
   - Creates enrollment if payment is for a course
   - Returns 200 OK to Razorpay

### Order-Based Flow

1. User completes payment on Razorpay
2. Razorpay sends `payment.captured` or `payment.authorized` webhook event
3. Backend receives webhook and:
   - Verifies webhook signature
   - Finds payment by `gatewayPaymentIntentId` (order ID)
   - Updates payment status to "completed"
   - Creates enrollment if payment is for a course
   - Returns 200 OK to Razorpay

## Webhook Signature Verification

The webhook handler automatically verifies the webhook signature using:

- Webhook secret from settings/environment
- Raw request body
- Signature from `X-Razorpay-Signature` header

If signature verification fails, the webhook is rejected with 400 status.

## Troubleshooting

### Webhook Not Receiving Events

1. **Check Webhook URL**: Ensure the URL is correct and accessible
2. **Check Firewall**: Ensure your server allows POST requests from Razorpay IPs
3. **Check Logs**: Look for webhook receipt logs in server console
4. **Test Webhook**: Use Razorpay Dashboard to send a test webhook

### Webhook Signature Verification Failing

1. **Check Webhook Secret**: Ensure it matches the one in Razorpay Dashboard
2. **Check Raw Body**: Webhook handler uses raw body for signature verification
3. **Check Headers**: Ensure `X-Razorpay-Signature` header is present

### Payment Status Not Updating

1. **Check Webhook Events**: Ensure required events are enabled
2. **Check Database**: Verify payment exists with correct `gatewayPaymentIntentId`
3. **Check Logs**: Look for webhook processing logs
4. **Check Webhook Response**: Webhook must return 200 OK

## Callback URL vs Webhook

### Callback URL (Redirect-based)

- Used for redirecting user back to frontend after payment
- May not always include `razorpay_payment_id`
- Used for user experience, not primary status update

### Webhook (Server-to-server)

- **Primary mechanism** for payment status updates
- More reliable than callback
- Always includes complete payment information
- Works even if user closes browser

## Best Practices

1. **Always configure webhooks in production** - They are the most reliable update mechanism
2. **Test webhooks in staging** before deploying to production
3. **Monitor webhook logs** to ensure they're being received
4. **Handle webhook failures gracefully** - Log errors but return 200 OK to prevent excessive retries
5. **Use webhook secret** - Never expose it in client-side code

## Webhook Handler Code

The webhook handler is located at:

- `backend/src/controllers/paymentController.js` → `handleRazorpayWebhook`

Key features:

- Signature verification
- Multiple event type handling
- Automatic enrollment creation
- Comprehensive logging
- Error handling with 200 OK response

## Support

If webhooks are not working:

1. Check Razorpay Dashboard → Webhooks → Recent Deliveries
2. Check server logs for webhook errors
3. Verify webhook secret configuration
4. Test with Razorpay Dashboard test webhook feature
