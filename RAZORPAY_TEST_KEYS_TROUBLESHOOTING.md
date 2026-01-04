# Razorpay Test Keys - International Cards Error Fix

## Problem

You're using Razorpay **test keys** (`rzp_test_...`) but still getting:
> "Payment could not be completed - International cards are not supported"

## Root Cause

**Razorpay test accounts have strict limitations:**
- ✅ Support INR currency only
- ✅ Support Indian payment methods only (Indian cards, UPI, Net Banking)
- ❌ Do NOT support international cards (even with INR)

## Solution

The platform now uses **Indian Rupees (INR)** as the default currency for all transactions. This ensures compatibility with Razorpay test accounts. However, you still need to:

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

### 2. Use Razorpay Test Cards (Indian Cards)

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

### 3. Check Payment Link Currency

Before making a payment:
1. Check the payment link URL in your browser's network tab
2. Verify the payment page shows INR (₹)
3. The platform is configured to use INR by default for all transactions.

## How Currency Works

The platform has been systematically converted to use **INR** as the primary currency for courses, ebooks, and payments. This avoids the common "international cards not supported" error in Razorpay test mode.

## Testing Steps

1. **Check Test Key is Detected:**
   ```bash
   # Your key ID should start with "rzp_test_"
   echo $RAZORPAY_KEY_ID
   ```

2. **Create a Test Payment:**
   - Create a payment for any course or ebook.
   - The amount will be in INR.
   - Payment link will show INR (₹) currency.

3. **Use Indian Test Card:**
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`

4. **Complete Payment:**
   - Should work without "international cards" error.

## Troubleshooting

### Error: Still seeing "International cards not supported"

**Possible Causes:**
1. Using international card instead of Indian card.
2. Trying to pay with a non-Indian payment method.

**Solutions:**
1. Use Indian test card: `4111 1111 1111 1111`.
2. Ensure you are selecting an Indian payment method in the Razorpay checkout.

### For Production (Live Keys)

1. Enable international payments in Razorpay dashboard if you want to accept non-Indian cards.
2. Payments will still be processed in INR by default.
3. If you need to accept other currencies directly, contact Razorpay support to enable multi-currency support.

## Quick Checklist

- [ ] Using test key starting with `rzp_test_`?
- [ ] Payment link shows INR (₹) currency?
- [ ] Using Indian test card (`4111 1111 1111 1111`)?
- [ ] Not trying to use international card?
- [ ] Payment should work now!
