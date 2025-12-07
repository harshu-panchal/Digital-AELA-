# Payment Gateway Testing Guide

This guide explains how to test the payment gateway functionality using the provided test scripts.

## Available Test Scripts

### 1. `testPaymentGateway.js` - Comprehensive Service Tests

This script tests the payment gateway service directly, creating test data and testing all functionality.

**Usage:**
```bash
npm run test-payment-gateway
# or
node scripts/testPaymentGateway.js
```

**What it tests:**
- ✅ Razorpay configuration and initialization
- ✅ Payment record creation in database
- ✅ Payment link creation with Razorpay
- ✅ Payment history retrieval
- ✅ Payment status enumeration

**Requirements:**
- MongoDB connection configured
- Razorpay credentials set in settings or environment variables
- Razorpay enabled in settings

**Output:**
- Creates test user, course, and payment records
- Generates a payment link URL for manual testing
- Shows payment history and statistics

---

### 2. `testPaymentAPI.js` - API Endpoint Tests

This script tests the payment API endpoints via HTTP requests. The backend server must be running.

**Usage:**
```bash
# Start the backend server first
npm run dev

# In another terminal, run the test script
BACKEND_URL=http://localhost:5000 node scripts/testPaymentAPI.js

# With authentication token
TEST_AUTH_TOKEN=your_token_here BACKEND_URL=http://localhost:5000 node scripts/testPaymentAPI.js
```

**What it tests:**
- ✅ Server connectivity
- ✅ Authentication (if token provided)
- ✅ Payment record creation endpoint
- ✅ Payment link creation endpoint
- ✅ Payment history endpoint
- ✅ Payment details endpoint

**Requirements:**
- Backend server running
- (Optional) Authentication token for full testing

**Getting an Authentication Token:**
1. Log in through the frontend application
2. Open browser DevTools → Application → Local Storage
3. Look for `aela.auth.tokens` key
4. Copy the `accessToken` value
5. Use it as: `TEST_AUTH_TOKEN=your_access_token`

---

## Test Script Comparison

| Feature | testPaymentGateway.js | testPaymentAPI.js |
|---------|----------------------|-------------------|
| Tests Service Layer | ✅ | ❌ |
| Tests API Endpoints | ❌ | ✅ |
| Requires Running Server | ❌ | ✅ |
| Creates Test Data | ✅ | ✅ |
| Requires Auth Token | ❌ | ✅ (for full tests) |
| Best For | Service debugging | Integration testing |

---

## Step-by-Step Testing Guide

### Prerequisites

1. **Set up Razorpay credentials:**
   ```bash
   # Option 1: Environment variables
   export RAZORPAY_KEY_ID="rzp_test_..."
   export RAZORPAY_KEY_SECRET="your_secret_key"

   # Option 2: Database settings (via admin panel)
   # Set in Settings:
   # - payment.gateway.razorpay.keyId
   # - payment.gateway.razorpay.keySecret
   ```

2. **Enable Razorpay:**
   ```bash
   npm run enable-razorpay
   ```

3. **Verify Razorpay configuration:**
   ```bash
   npm run test-razorpay
   ```

### Testing the Payment Gateway Service

1. **Run the comprehensive test:**
   ```bash
   npm run test-payment-gateway
   ```

2. **Review the output:**
   - Check that all tests pass
   - Note the payment link URL generated
   - Review payment history statistics

3. **Test the payment link:**
   - Copy the payment link URL from the output
   - Open it in a browser
   - Use Razorpay test cards:
     - **Success:** 4111 1111 1111 1111
     - **Failure:** 4000 0000 0000 0002
   - Complete the payment
   - Verify callback handling

### Testing the Payment API

1. **Start the backend server:**
   ```bash
   npm run dev
   ```

2. **Get an authentication token:**
   - Log in through the frontend
   - Get token from browser localStorage

3. **Run the API test:**
   ```bash
   TEST_AUTH_TOKEN=your_token BACKEND_URL=http://localhost:5000 node scripts/testPaymentAPI.js
   ```

4. **Review the output:**
   - Check that all endpoints respond correctly
   - Verify payment creation and link generation
   - Review payment history and details

---

## Razorpay Test Cards

Use these test cards for payment testing:

### Success Cards
- **Card Number:** 4111 1111 1111 1111
- **CVV:** Any 3 digits (e.g., 123)
- **Expiry:** Any future date (e.g., 12/25)
- **Name:** Any name

### Failure Cards
- **Card Number:** 4000 0000 0000 0002
- **CVV:** Any 3 digits
- **Expiry:** Any future date

### Other Test Cards
- **Insufficient Funds:** 4000 0000 0000 9995
- **Card Declined:** 4000 0000 0000 0069
- **Invalid CVV:** 4000 0000 0000 0127

For more test cards, visit: https://razorpay.com/docs/payments/test-cards/

---

## Testing Payment Flow

### Complete Payment Flow Test

1. **Create a payment:**
   - Use the test scripts to create a payment record
   - Get the payment link URL

2. **Complete the payment:**
   - Open the payment link in a browser
   - Use a test card to complete payment
   - Verify redirect to callback URL

3. **Verify payment status:**
   - Check payment status in database
   - Verify enrollment created (if course payment)
   - Check invoice generation

4. **Test refund:**
   - Use admin panel to process refund
   - Verify refund status updated

---

## Common Issues and Solutions

### Issue: "Razorpay is disabled"
**Solution:** Run `npm run enable-razorpay`

### Issue: "Razorpay credentials not configured"
**Solution:** Set credentials in environment variables or database settings

### Issue: "Payment link creation failed"
**Solution:** 
- Verify Razorpay is enabled
- Check credentials are correct
- Ensure callback URL is whitelisted in Razorpay dashboard

### Issue: "Cannot connect to server"
**Solution:**
- Make sure backend server is running
- Check BACKEND_URL environment variable
- Verify port is correct (default: 5000)

### Issue: "Authentication failed"
**Solution:**
- Get a valid token from frontend login
- Check token hasn't expired
- Verify token format is correct

---

## Test Data Cleanup

The test scripts create test data that you may want to clean up:

### Clean up test payments:
```javascript
// In MongoDB or via script
db.payments.deleteMany({
  description: { $regex: /^Test payment/ },
  status: "pending"
});
```

### Clean up test user:
```javascript
db.users.deleteOne({
  email: "test.payment@digitalaela.com"
});
```

### Clean up test course:
```javascript
db.courses.deleteOne({
  title: "Test Payment Course"
});
```

---

## Monitoring and Debugging

### Check Payment Logs
- Backend console logs show payment operations
- Look for `[Payment Gateway]` prefixed logs
- Check for error messages

### Razorpay Dashboard
- View payments: https://dashboard.razorpay.com/app/payments
- View orders: https://dashboard.razorpay.com/app/orders
- View payment links: https://dashboard.razorpay.com/app/payment-links

### Database Queries
```javascript
// Check recent payments
db.payments.find().sort({ createdAt: -1 }).limit(10).pretty();

// Check payment status distribution
db.payments.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);

// Find test payments
db.payments.find({
  description: { $regex: /test/i }
}).pretty();
```

---

## Next Steps

After running the tests:

1. ✅ Verify all tests pass
2. ✅ Test payment link in browser
3. ✅ Complete a test payment
4. ✅ Verify callback handling
5. ✅ Check invoice generation
6. ✅ Test refund functionality
7. ✅ Review payment history
8. ✅ Clean up test data (optional)

---

## Support

For issues or questions:
- Check Razorpay documentation: https://razorpay.com/docs/
- Review backend logs for errors
- Check payment gateway service code
- Verify environment configuration

