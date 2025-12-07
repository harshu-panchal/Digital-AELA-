# Fix: International Cards Error with Test Keys

## The Problem

You're using Razorpay **test keys** (`rzp_test_...`) and getting:
> "Payment could not be completed - International cards are not supported"

## Why This Happens

**Razorpay test accounts have strict limitations:**
1. ✅ Support **INR currency only** (not AED)
2. ✅ Support **Indian payment methods only**
   - Indian Credit/Debit Cards
   - UPI (PhonePe, Google Pay)
   - Net Banking (Indian banks)
   - Indian Wallets
3. ❌ **Do NOT support international cards** (even with INR currency)
4. ❌ **Do NOT support AED currency**

## The Fix

The payment gateway has been updated to:
- ✅ **Automatically detect test keys**
- ✅ **Automatically convert AED → INR** for test keys
- ✅ **Force INR currency** for all test key payments

### What Changed

1. **Automatic Currency Conversion:**
   - Test keys: AED is automatically converted to INR (mandatory)
   - Example: 100 AED → 2,250 INR (at 22.5 rate)

2. **Test Key Detection:**
   - System detects if key starts with `rzp_test_`
   - Forces conversion for test keys (no exceptions)

3. **Safety Checks:**
   - Prevents AED from being sent to Razorpay with test keys
   - Logs conversion details for debugging

## Quick Verification

Run this to verify currency conversion is working:

```bash
npm run verify-currency-conversion
```

This will:
- ✅ Detect if you're using test keys
- ✅ Test currency conversion
- ✅ Create a test payment link
- ✅ Show you the converted amount

## How to Test Payments

### ✅ Use Indian Test Cards Only

**Success Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: `12/25` (any future date)
- Name: Any name

**This is an INDIAN test card - it will work with test keys.**

### ❌ Don't Use International Cards

Even if the payment is in INR, Razorpay test environment will reject:
- International Visa cards
- International Mastercard
- Cards from outside India

## Step-by-Step Testing

1. **Create a payment:**
   - Amount: 100 AED
   - System converts to 2,250 INR automatically

2. **Check backend logs:**
   ```
   [Payment Gateway] TEST KEY DETECTED: Forcing conversion from 100 AED to 2250 INR
   [Payment Gateway] Test accounts do not support AED/international cards - conversion is mandatory
   ```

3. **Open payment link:**
   - Should show INR (₹) currency, not AED
   - If it shows AED, conversion didn't work

4. **Pay with Indian test card:**
   - Use: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Future date

5. **Payment should succeed!**

## Troubleshooting

### Still Getting "International cards not supported"?

**Check 1: Are you using an Indian test card?**
- ✅ Use: `4111 1111 1111 1111` (Indian card)
- ❌ Don't use: International cards

**Check 2: Is currency conversion happening?**
- Look for log: `TEST KEY DETECTED: Forcing conversion`
- If not present, conversion might not be working

**Check 3: What currency does the payment page show?**
- Should show INR (₹) or "Rupees"
- If shows AED, conversion failed

**Check 4: Verify your test key:**
```bash
echo $RAZORPAY_KEY_ID
# Should start with: rzp_test_
```

### Currency Conversion Not Working?

1. **Check backend logs** for conversion messages
2. **Verify test key** is detected (starts with `rzp_test_`)
3. **Restart backend server** if needed
4. **Run verification script:**
   ```bash
   npm run verify-currency-conversion
   ```

### Payment Link Shows AED Instead of INR?

This means conversion didn't happen. Check:
1. Backend logs for errors
2. Test key is properly detected
3. Settings are not blocking conversion

## Configuration

### Exchange Rate (Optional)

Default: 1 AED = 22.5 INR

To update:
- Settings → Payment Settings
- Update `payment.currency.aedToInrRate`
- Or leave default if acceptable

### Disable Conversion (Only for Live Keys)

**Don't disable for test keys** - they require INR.

For live keys (if international payments enabled):
- Settings → Payment Settings
- Set `payment.currency.convertAEDtoINR` = `false`

## Important Notes

1. **Test Keys = INR Only (No Exceptions)**
   - Cannot use AED directly
   - Cannot accept international cards
   - Conversion is automatic and mandatory

2. **Use Indian Cards Only**
   - Even with INR, must use Indian cards
   - International cards will fail in test environment

3. **Live Keys = Different Rules**
   - Can enable international payments
   - Can use AED directly (after approval)
   - Requires Razorpay dashboard configuration

## Summary

✅ **Solution Applied:**
- Automatic currency conversion for test keys
- AED → INR conversion (mandatory)
- Safety checks to prevent errors

✅ **What You Need to Do:**
1. Use Indian test card: `4111 1111 1111 1111`
2. Verify payment page shows INR (₹)
3. Complete payment with Indian card

✅ **Result:**
- No more "international cards" error
- Payments work with test keys
- Conversion happens automatically

## Still Having Issues?

1. Run verification: `npm run verify-currency-conversion`
2. Check backend logs for conversion messages
3. Verify using Indian test card
4. Check payment page shows INR currency

If still not working, check:
- Backend logs for errors
- Razorpay dashboard for payment details
- Test key format (must start with `rzp_test_`)

