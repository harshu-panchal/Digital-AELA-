# Fix: International Cards Error with Test Keys

## The Problem

You're using Razorpay **test keys** (`rzp_test_...`) and getting:

> "Payment could not be completed - International cards are not supported"

## Why This Happens

**Razorpay test accounts have strict limitations:**

1. ✅ Support **INR currency only**
2. ✅ Support **Indian payment methods only**
   - Indian Credit/Debit Cards
   - UPI (PhonePe, Google Pay)
   - Net Banking (Indian banks)
   - Indian Wallets
3. ❌ **Do NOT support international cards** (even with INR currency)

## The Fix

The platform has been systematically updated to:

- ✅ **Use INR as the default currency** for all transactions
- ✅ **Remove all legacy currency conversion logic** to ensure consistency
- ✅ **Support all Razorpay accounts** (Test and Live) natively

### What Changed

1. **Native INR Support:**

   - All courses, ebooks, and payments are now natively priced and processed in INR.
   - This eliminates the need for currency conversion and avoids "international cards not supported" errors caused by multi-currency transactions in test mode.

2. **Simplified Payment Flow:**

   - No more automatic conversion.
   - What you see is what you pay: prices are listed in ₹ (INR).

3. **Universal Compatibility:**
   - Works seamlessly with both `rzp_test_` and `rzp_live_` keys.
   - No special handling required for test accounts.

## How to Test Payments

### ✅ Use Indian Test Cards

**Success Card:**

- Card Number: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: `12/25` (any future date)
- Name: Any name

**This is an INDIAN test card - it works perfectly with INR payments.**

### ❌ International Cards in Test Mode

Even with INR currency, Razorpay test environment will reject:

- International Visa cards
- International Mastercard
- Cards from outside India

## Troubleshooting

### Still Getting "International cards not supported"?

**Check 1: Are you using an Indian test card?**

- ✅ Use: `4111 1111 1111 1111` (Indian card)
- ❌ Don't use: International cards

**Check 2: Is currency INR?**

- All payments should now be natively in INR.
- If you see anything other than INR (₹) during checkout, it means the systematic conversion missed a spot.

**Check 3: What currency does the payment page show?**

- Should show INR (₹) or "Rupees"
- If it shows any other currency, something is wrong.

**Check 4: Verify your test key:**

```bash
echo $RAZORPAY_KEY_ID
# Should start with: rzp_test_
```

### Payment Link Shows Unexpected Currency?

If the payment link shows a currency other than INR, it means the database or the request still has the old currency. Since we have updated all models to default to INR, this shouldn't happen for new payments.

For existing payments that were created before the conversion, they might still show the old currency. We recommend creating a new payment to test the INR flow.

## Live Account: How to Accept International Payments

To accept international cards (Visa/Mastercard from outside India) on your **Live** account:

1. **Enable International Payments:**

   - Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
   - Go to **Account & Settings** > **Payment Methods**.
   - Request activation for **International Payments**.

2. **Currency Note:**
   - Even if you accept international cards, the platform will process them in **INR**.
   - Razorpay will handle the conversion from the customer's local currency to INR.
