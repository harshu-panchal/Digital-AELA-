# Razorpay Test Keys - International Cards Error Fix

## Problem

You're using Razorpay **test keys** (`rzp_test_...`) but still getting:
> "Payment could not be completed - International cards are not supported"

## Root Cause

**Razorpay test accounts have strict limitations:**
- ✅ Support INR currency only
- ✅ Support Indian payment methods only (Indian cards, UPI, Net Banking)
- ❌ Do NOT support AED currency
- ❌ Do NOT support international cards (even with INR)

## Solution

The payment gateway has been updated to **automatically convert AED to INR for test keys**. However, you still need to:

### 1. Use Indian Payment Methods Only

Even with INR currency, Razorpay test environment **only accepts Indian payment methods**:

**✅ Use These:**
- Indian Credit/Debit Cards (starting with numbers like 4xxx, 5xxx)
- UPI (PhonePe, Google Pay, etc.)
- Net Banking (Indian banks)
- Indian Wallets (Paytm, etc.)

**❌ Don't Use:**
- International cards (Visa/Mastercard from outside India)
- International payment methods

### 2. Verify Currency Conversion is Working

Check your backend logs when creating a payment link. You should see:
```
[Payment Gateway] TEST KEY DETECTED: Forcing conversion from 100 AED to 2250 INR
[Payment Gateway] Test accounts do not support AED/international cards - conversion is mandatory
```

If you don't see this, the conversion might not be happening.

### 3. Use Razorpay Test Cards (Indian Cards)

For testing, use Razorpay's Indian test cards:

**Success Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**Failure Card:**
- Card Number: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

### 4. Check Payment Link Currency

Before making a payment:
1. Check the payment link URL in your browser's network tab
2. Verify the payment page shows INR (₹) not AED
3. If it shows AED, the conversion didn't work

## How Currency Conversion Works

### For Test Keys (Automatic):
```
Input: 100 AED
↓ (automatic conversion)
Output: 2,250 INR (at 22.5 rate)
↓
Razorpay Payment Link: 2,250 INR
```

### For Live Keys (Configurable):
- Default: Converts AED → INR
- Can be disabled if international payments are enabled in Razorpay dashboard

## Testing Steps

1. **Check Test Key is Detected:**
   ```bash
   # Your key ID should start with "rzp_test_"
   echo $RAZORPAY_KEY_ID
   ```

2. **Create a Test Payment:**
   - Amount: 100 AED
   - System should convert to 2,250 INR automatically
   - Payment link should show INR currency

3. **Use Indian Test Card:**
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`

4. **Complete Payment:**
   - Should work without "international cards" error

## Troubleshooting

### Error: Still seeing "International cards not supported"

**Possible Causes:**
1. Currency conversion not happening
2. Using international card instead of Indian card
3. Payment link still created with AED

**Solutions:**
1. Check backend logs for conversion messages
2. Verify payment link currency (should be INR)
3. Use Indian test card: `4111 1111 1111 1111`
4. Check Razorpay dashboard - payment link should show INR

### Error: Payment link shows AED currency

**Fix:**
1. Check backend logs - conversion should happen automatically
2. Verify test key is detected (starts with `rzp_test_`)
3. Restart backend server if needed
4. Check if settings are blocking conversion

### Want to Use AED Directly?

**You Cannot with Test Keys:**
- Test keys NEVER support AED
- Must use INR only
- Currency conversion is automatic and mandatory

**For Production (Live Keys):**
1. Enable international payments in Razorpay dashboard
2. Disable currency conversion in settings
3. Payments can then use AED directly

## Configuration

### Verify Currency Conversion Settings:

```bash
# Check if conversion is enabled (should be automatic for test keys)
# No action needed - conversion is forced for test keys
```

### Update Exchange Rate (if needed):

Settings → Payment Settings:
- `payment.currency.aedToInrRate` = `22.5` (default)
- Update to current rate if needed

## Important Notes

1. **Test Keys = INR Only:**
   - No way around this
   - Must use Indian payment methods
   - Currency conversion is automatic

2. **Live Keys = Can Use AED:**
   - Requires international payments enabled
   - Contact Razorpay support to enable
   - Takes 2-5 business days

3. **Payment Methods:**
   - Test environment: Indian methods only
   - Live environment: Can accept international (if enabled)

## Quick Checklist

- [ ] Using test key starting with `rzp_test_`?
- [ ] Backend logs show currency conversion?
- [ ] Payment link shows INR (₹) currency?
- [ ] Using Indian test card (`4111 1111 1111 1111`)?
- [ ] Not trying to use international card?
- [ ] Payment should work now!

## Still Not Working?

1. **Check Backend Logs:**
   - Look for `[Payment Gateway]` messages
   - Verify conversion is happening
   - Check for any errors

2. **Verify Test Key:**
   ```bash
   # Should start with rzp_test_
   echo $RAZORPAY_KEY_ID
   ```

3. **Try Different Test Card:**
   - Use: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Future date

4. **Check Payment Link:**
   - Open payment link in browser
   - Verify currency shown is INR (₹)
   - If AED, conversion didn't work

5. **Contact Support:**
   - Check Razorpay dashboard for payment details
   - Review backend error logs
   - Verify all configurations

