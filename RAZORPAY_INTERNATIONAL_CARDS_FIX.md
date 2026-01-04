# Fix: International Cards Not Supported Error

## Problem

When trying to make a payment, you see the error:
> "Payment could not be completed - International cards are not supported. Please contact our support team for help"

## Root Cause

This error occurs because:
1. **Razorpay accounts by default only support INR currency and Indian payment methods.**
2. International payments feature is not enabled in your Razorpay dashboard.
3. Razorpay test environment strictly enforces Indian payment methods for INR transactions.

## Solutions

### Solution 1: Use INR as Default Currency (Implemented)

The platform has been systematically updated to use **Indian Rupees (INR)** as the default currency for all courses, ebooks, and payments. This is the most reliable way to ensure compatibility with all Razorpay accounts, including those in test mode.

1. **Why INR?**
   - Every Razorpay account supports INR by default.
   - INR transactions work seamlessly in both test and live environments.
   - Avoids the "international cards not supported" error for Indian customers.

2. **How it works:**
   - All prices are now set and displayed in INR.
   - Payments are processed directly in INR.
   - No complex currency conversion logic is required on the backend.

### Solution 2: Enable International Payments in Razorpay (For Live Accounts)

If you want to accept non-Indian cards (even for INR payments) in your **Live** environment:

1. **Requirements:**
   - Complete Razorpay KYC verification.
   - Your website must have:
     - Terms and Conditions page
     - Privacy Policy page
     - Refund and Cancellation Policy
     - Shipping Policy (if applicable)

2. **Steps to Enable:**
   - Log in to Razorpay Dashboard: https://dashboard.razorpay.com
   - Navigate to **Account & Settings** → **Payment Methods**
   - Under **International Payments**, click **Request**.
   - Fill out the required details and submit.
   - Wait for approval (usually 2-5 business days).

3. **After Approval:**
   - International cards will be accepted for your INR payments.
   - Your customers from outside India can pay using their local cards.

4. **Razorpay Support:**
   - Email: support@razorpay.com
   - Dashboard: Settings → Help & Support

### Solution 3: Use Indian Payment Methods Only (For Testing)

While testing with Razorpay **test keys**:
- Use Indian payment methods (UPI, Net Banking, Indian Cards).
- Use Razorpay's Indian test cards: `4111 1111 1111 1111`.
- This avoids international card issues completely during development.

## Testing

### Test with INR (Default):
1. Create a payment for a course or ebook.
2. The amount will be in INR (₹).
3. Use Razorpay test cards:
   - Success: `4111 1111 1111 1111`
   - Any CVV, future expiry date.

## Important Notes

1. **INR is the Primary Currency:**
   - Prevents most "international cards not supported" errors.
   - Simplified payment flow.
   - Consistent pricing across the platform.

2. **Invoice Display:**
   - Invoices now show amounts in INR (₹).
   - All financial reporting and analytics use INR.

## Troubleshooting

### Error: "International cards not supported"
**Fix:** Use an Indian test card (`4111 1111 1111 1111`) during testing. For production, enable international payments in your Razorpay dashboard.

### Error: "Invalid currency"
**Fix:** Ensure your Razorpay account is configured to accept INR (which is the default for all Indian accounts).

## Contact Information

- **Razorpay Support:** support@razorpay.com
- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **International Payments Docs:** https://razorpay.com/docs/payments/international-payments/

## Quick Checklist

- [ ] Prices displayed in INR (₹)?
- [ ] Payment processes in INR?
- [ ] Using Indian test card (`4111 1111 1111 1111`)?
- [ ] International payments requested in Razorpay (for live use)?
