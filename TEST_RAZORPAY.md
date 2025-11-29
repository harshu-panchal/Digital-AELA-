# How to Test Razorpay Payment Gateway

## Prerequisites

1. **Test Keys in Environment Variables**

   - Make sure you have set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in your `.env` file
   - These should be your **test mode** keys from Razorpay Dashboard

2. **Enable Razorpay**
   - Razorpay must be enabled in the database settings

## Step 1: Enable Razorpay (if not already enabled)

### Option A: Using the Script (Recommended)

```bash
cd backend
node scripts/enableRazorpay.js
```

### Option B: Using Admin Panel

1. Log in as Super Admin
2. Navigate to **Settings** → **Payment Settings**
3. Enable **"Razorpay Enabled"** toggle

### Option C: Direct Database Update

```javascript
// In MongoDB
db.settings.updateOne(
  { key: "payment.gateway.razorpay.enabled" },
  { $set: { value: true } },
  { upsert: true }
);
```

## Step 2: Verify Environment Variables

Make sure your `.env` file in the `backend` directory has:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret_key
```

**Note:** The keys should start with `rzp_test_` for test mode.

## Step 3: Test Payment Flow

### Method 1: Test via Frontend (Recommended)

1. **Start your servers:**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

2. **Navigate to a payment page:**

   - Go to any course/book/gift payment page
   - Or use the direct payment flow

3. **Create a test payment:**

   - Fill in payment details
   - Click "Pay" or "Proceed to Payment"
   - You'll be redirected to Razorpay's test payment page

4. **Use Razorpay Test Cards:**
   - **Success:** `4111 1111 1111 1111`
   - **Failure:** `4000 0000 0000 0002`
   - **CVV:** Any 3 digits (e.g., `123`)
   - **Expiry:** Any future date (e.g., `12/25`)
   - **Name:** Any name

### Method 2: Test via API (Using Postman/curl)

#### Step 1: Create a Payment Record

```bash
POST http://localhost:5000/api/v1/payments
Headers:
  Authorization: Bearer YOUR_AUTH_TOKEN
  Content-Type: application/json
  X-CSRF-Token: YOUR_CSRF_TOKEN

Body:
{
  "amount": 100,
  "currency": "INR",
  "description": "Test payment",
  "gateway": "razorpay"
}
```

Response will include a `payment._id` - save this for next steps.

#### Step 2: Create Razorpay Payment Link

```bash
POST http://localhost:5000/api/v1/payments/{paymentId}/razorpay/payment-link
Headers:
  Authorization: Bearer YOUR_AUTH_TOKEN
  Content-Type: application/json
  X-CSRF-Token: YOUR_CSRF_TOKEN

Body:
{
  "callbackUrl": "http://localhost:3000/payment/success"
}
```

Response will include a `paymentLink.url` - open this URL in your browser.

#### Step 3: Complete Payment on Razorpay

- Use test card: `4111 1111 1111 1111`
- Complete the payment
- You'll be redirected to the callback URL

### Method 3: Test Order Creation (Modal-based)

#### Step 1: Create Payment Record (same as above)

#### Step 2: Create Razorpay Order

```bash
POST http://localhost:5000/api/v1/payments/{paymentId}/razorpay/order
Headers:
  Authorization: Bearer YOUR_AUTH_TOKEN
  X-CSRF-Token: YOUR_CSRF_TOKEN
```

Response will include:

- `order.id` - Razorpay order ID
- `keyId` - Razorpay key ID for frontend
- `payment` - Payment details

#### Step 3: Verify Payment (after payment completion)

```bash
POST http://localhost:5000/api/v1/payments/razorpay/verify
Headers:
  Authorization: Bearer YOUR_AUTH_TOKEN
  Content-Type: application/json
  X-CSRF-Token: YOUR_CSRF_TOKEN

Body:
{
  "paymentId": "your_payment_id",
  "razorpayOrderId": "order_xxxxx",
  "razorpayPaymentId": "pay_xxxxx",
  "razorpaySignature": "signature_xxxxx"
}
```

## Step 4: Test Webhook (Optional)

To test webhooks, you'll need:

1. **Set up webhook in Razorpay Dashboard:**

   - Go to Settings → Webhooks
   - Add webhook URL: `http://your-domain.com/api/v1/payments/razorpay/webhook`
   - Select events: `payment.captured`, `payment.failed`

2. **Set webhook secret in environment:**

   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Test using Razorpay's webhook testing tool** or use a service like ngrok for local testing.

## Razorpay Test Cards

### Indian Cards (Recommended for Testing)

| Card Number           | Scenario                | CVV          | Expiry          |
| --------------------- | ----------------------- | ------------ | --------------- |
| `4111 1111 1111 1111` | Success (Visa)          | Any 3 digits | Any future date |
| `5555 5555 5555 4444` | Success (Mastercard)    | Any 3 digits | Any future date |
| `4000 0000 0000 0002` | Failure                 | Any 3 digits | Any future date |
| `5104 0600 0000 0008` | Success (International) | Any 3 digits | Any future date |

### International Cards (Requires Dashboard Configuration)

**⚠️ Important:** International cards require enabling in Razorpay Dashboard:

1. Go to Razorpay Dashboard → **Settings** → **Payment Methods**
2. Enable **"International Payments"**
3. Save changes

| Card Number           | Scenario                                | CVV          | Expiry          |
| --------------------- | --------------------------------------- | ------------ | --------------- |
| `4012 8888 8888 1881` | Success (Visa International)            | Any 3 digits | Any future date |
| `5555 5555 5555 4444` | Success (Mastercard International)      | Any 3 digits | Any future date |
| `5105 1051 0510 5100` | Success (Mastercard - requires address) | Any 3 digits | Any future date |

**Note:** For card `5105 1051 0510 5100`, you may need to provide address:

- Address Line 1: 21 Applegate Apartment
- Address Line 2: Rockledge Street
- City: New York
- State: New York
- Country: US
- Zipcode: 11561

## Common Issues & Solutions

### Issue: "Razorpay payment gateway is not enabled"

**Solution:** Run `node backend/scripts/enableRazorpay.js` or enable via admin panel

### Issue: "Razorpay credentials not configured"

**Solution:**

- Check `.env` file has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Restart your backend server after adding env variables
- Verify keys start with `rzp_test_` for test mode

### Issue: Payment link not created

**Solution:**

- Check backend logs for error messages
- Verify payment status is "pending"
- Ensure Razorpay is enabled in database

### Issue: Payment verification fails

**Solution:**

- Check that signature is correct
- Verify payment was actually captured in Razorpay dashboard
- Check backend logs for detailed error messages

### Issue: "International cards are not supported"

**Solution:**

1. **Enable International Payments in Razorpay Dashboard:**

   - Log in to https://dashboard.razorpay.com
   - Go to **Settings** → **Payment Methods**
   - Enable **"International Payments"**
   - Save changes

2. **OR Use Indian Test Cards:**

   - Use `4111 1111 1111 1111` (Visa) or `5555 5555 5555 4444` (Mastercard)
   - These work without international payment enablement

3. **Check Account Status:**
   - Ensure your Razorpay account is fully activated
   - International payments may require account verification

## Testing Checklist

- [ ] Test keys set in `.env` file
- [ ] Razorpay enabled in database
- [ ] Backend server restarted after env changes
- [ ] Payment record created successfully
- [ ] Razorpay payment link/order created
- [ ] Redirected to Razorpay payment page
- [ ] Test payment completed with test card
- [ ] Payment callback received
- [ ] Payment status updated to "completed"
- [ ] Invoice generated (if applicable)

## Monitoring Test Payments

1. **Razorpay Dashboard:**

   - Log in to https://dashboard.razorpay.com
   - Go to **Payments** → **Test Mode**
   - View all test payments

2. **Backend Logs:**

   - Check console for `[Razorpay]` prefixed logs
   - Look for order creation, payment verification, etc.

3. **Database:**
   - Check `payments` collection for payment status updates
   - Verify `gatewayPaymentIntentId` and `gatewayTransactionId` are set

## Next Steps

Once testing is successful:

1. Switch to **live mode** keys for production
2. Update environment variables with live keys
3. Enable webhook verification
4. Test with real small amounts first
5. Monitor payment success rates
