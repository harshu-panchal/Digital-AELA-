# Payment Callback Test Script

This script tests the Razorpay payment callback handler to verify that it correctly processes payment callbacks with the new parameter names.

## Prerequisites

1. **Backend server must be running** (for HTTP endpoint tests)
2. MongoDB connection configured
3. Test user and course will be created automatically if they don't exist

## Usage

### Basic Usage

```bash
# From backend directory
npm run test-payment-callback
```

### With Custom Backend URL

```bash
BACKEND_URL=http://localhost:5000 npm run test-payment-callback
```

### Direct Execution

```bash
node scripts/testPaymentCallback.js
```

## What It Tests

The script performs the following tests:

### Test 1: Successful Payment Callback
- Tests callback with `razorpay_payment_link_status=paid`
- Verifies redirect URL contains `status=success`
- Checks payment status is updated to `completed` in database
- Verifies gateway transaction ID is stored

### Test 2: Failed Payment Callback
- Tests callback with `razorpay_payment_link_status=failed`
- Verifies redirect URL contains `status=failed`
- Checks payment status is updated accordingly

### Test 3: Missing Payment ID
- Tests error handling when `paymentId` is missing
- Verifies graceful error handling

### Test 4: Parameter Name Comparison
- Compares old parameter names (`payment_id`, `status`) vs new names (`razorpay_payment_id`, `razorpay_payment_link_status`)
- Verifies new parameter names work correctly

### Test 5: Enrollment Creation
- Tests automatic enrollment creation for course payments
- Verifies enrollment is created when payment is completed

## Expected Output

The script will output:
- ✅ Success indicators for passing tests
- ❌ Error indicators for failing tests
- ⚠️ Warnings for expected issues (e.g., Razorpay API calls failing in test environment)
- ℹ️ Information about test progress and results

## Notes

1. **Razorpay API Calls**: Some tests may show warnings if Razorpay API calls fail. This is expected in test environments without valid Razorpay credentials. The callback handler logic is still verified.

2. **Test Data**: The script creates test data (user, course, payment) and cleans them up automatically after tests complete.

3. **Database**: The script connects directly to MongoDB to verify payment status updates.

4. **HTTP Tests**: The script makes HTTP requests to the callback endpoint, so the backend server must be running.

## Troubleshooting

### "Cannot connect to server"
- Make sure the backend server is running
- Check the `BACKEND_URL` environment variable
- Verify the port is correct (default: 5000)

### "Database connection error"
- Check MongoDB connection string in `.env` file
- Ensure MongoDB is running
- Verify `MONGODB_URI` is set correctly

### "Test user/course not found"
- The script will create them automatically
- If creation fails, check database permissions

## Example Output

```
============================================================
Payment Callback Test Script
============================================================

🧪 Connecting to database...
✅ Database connected

🧪 Setting up test user...
ℹ️  Using existing test user

============================================================
Test 1: Successful Payment Callback (razorpay_payment_link_status=paid)
============================================================

🧪 Sending callback request with success parameters...
✅ Callback redirected successfully
ℹ️  Redirect location: http://localhost:5173/payment/callback?paymentId=...&status=success
✅ ✓ Redirect URL contains status=success

🧪 Verifying payment status in database...
ℹ️  Payment status: completed
✅ ✓ Payment status updated to 'completed'
```

