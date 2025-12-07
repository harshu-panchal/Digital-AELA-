# Fix: International Cards Not Supported Error

## Problem

When trying to make a payment, you see the error:
> "Payment could not be completed - International cards are not supported. Please contact our support team for help"

## Root Cause

This error occurs because:
1. **Razorpay accounts by default only support INR currency and Indian payment methods**
2. Your account is trying to accept AED currency or international cards
3. International payments feature is not enabled in your Razorpay dashboard

## Solutions

### Solution 1: Enable Currency Conversion (Recommended - Quick Fix)

The payment gateway now automatically converts AED to INR by default. This is enabled in the settings:

1. **Check Currency Conversion Settings:**
   - Setting: `payment.currency.convertAEDtoINR` = `true` (default)
   - Setting: `payment.currency.aedToInrRate` = `22.5` (default exchange rate)

2. **How it works:**
   - When a payment is made in AED, it's automatically converted to INR
   - Example: 100 AED → 2,250 INR (at 22.5 rate)
   - Payment is processed in INR (which all Razorpay accounts support)

3. **Update Exchange Rate (if needed):**
   - Go to Settings → Payment Settings
   - Update `payment.currency.aedToInrRate` to current exchange rate
   - Or leave default (22.5) if acceptable

### Solution 2: Enable International Payments in Razorpay (Long-term Solution)

To accept AED currency and international cards directly:

1. **Requirements:**
   - Complete Razorpay KYC verification
   - Your website must have:
     - Terms and Conditions page
     - Privacy Policy page
     - Refund and Cancellation Policy
     - Shipping Policy (if applicable)

2. **Steps to Enable:**
   - Log in to Razorpay Dashboard: https://dashboard.razorpay.com
   - Navigate to **Settings** → **Payment Methods**
   - Under **International Payments**, click **Request**
   - Fill out the required details and submit
   - Wait for approval (usually 2-5 business days)

3. **After Approval:**
   - Disable currency conversion: Set `payment.currency.convertAEDtoINR` = `false`
   - Payments will be processed in AED directly
   - International cards will be accepted

4. **Razorpay Support:**
   - Email: support@razorpay.com
   - Dashboard: Settings → Help & Support

### Solution 3: Use Indian Payment Methods Only

If you're primarily targeting Indian customers:
- Keep currency conversion enabled (AED → INR)
- Use Indian payment methods (UPI, Net Banking, Indian Cards)
- This avoids international card issues completely

## Configuration Guide

### Enable/Disable Currency Conversion

**Via Settings API or Admin Panel:**
```javascript
// Enable conversion (default)
payment.currency.convertAEDtoINR = true
payment.currency.aedToInrRate = 22.5

// Disable conversion (requires international payments enabled)
payment.currency.convertAEDtoINR = false
```

**Via Environment Variables:**
```env
# Currency conversion (default: enabled)
PAYMENT_CURRENCY_CONVERT_AED_TO_INR=true
PAYMENT_CURRENCY_AED_TO_INR_RATE=22.5
```

## Testing

### Test with Currency Conversion Enabled:
1. Create a payment for 100 AED
2. System converts to 2,250 INR automatically
3. Use Razorpay test cards:
   - Success: `4111 1111 1111 1111`
   - Any CVV, future expiry date

### Test with International Payments Enabled:
1. Disable currency conversion
2. Create payment in AED
3. Use international test cards (if available)
4. Verify payment processes in AED

## Important Notes

1. **Currency Conversion is ON by Default:**
   - Prevents international card errors
   - Works with all Razorpay accounts
   - Exchange rate can be configured

2. **Invoice Display:**
   - Invoice shows original amount in AED
   - Payment notes include conversion details
   - Customer sees AED price, pays in INR equivalent

3. **Exchange Rate:**
   - Default: 1 AED = 22.5 INR
   - Update regularly for accurate conversion
   - Can be set per payment if needed

## Troubleshooting

### Error: "International cards not supported"
**Fix:** Enable currency conversion OR enable international payments in Razorpay

### Error: "Invalid currency"
**Fix:** Ensure currency conversion is enabled for AED → INR

### Payment succeeds but wrong amount
**Fix:** Check and update `payment.currency.aedToInrRate` setting

### Want to use AED directly
**Fix:** 
1. Enable international payments in Razorpay dashboard
2. Disable currency conversion setting
3. Contact Razorpay support for approval

## Contact Information

- **Razorpay Support:** support@razorpay.com
- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **International Payments Docs:** https://razorpay.com/docs/payments/international-payments/

## Quick Fix Checklist

- [ ] Verify currency conversion is enabled (default)
- [ ] Check exchange rate is accurate
- [ ] Test payment with INR (converted from AED)
- [ ] Use Razorpay test cards
- [ ] Verify callback handling works
- [ ] Check invoice shows correct amounts

## Long-term Fix Checklist

- [ ] Complete Razorpay KYC verification
- [ ] Add required legal pages to website
- [ ] Request international payments in Razorpay dashboard
- [ ] Wait for approval (2-5 business days)
- [ ] Disable currency conversion after approval
- [ ] Test payments in AED directly
- [ ] Verify international cards work

