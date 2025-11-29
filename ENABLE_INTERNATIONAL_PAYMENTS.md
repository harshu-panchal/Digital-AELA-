# How to Enable International Payments in Razorpay Dashboard

This guide will walk you through enabling international card payments in your Razorpay account.

## Step-by-Step Instructions

### Step 1: Log in to Razorpay Dashboard

1. Go to **https://dashboard.razorpay.com**
2. Log in with your Razorpay account credentials
3. Make sure you're in **Test Mode** (you'll see a "Test Mode" indicator at the top if you're using test keys)

### Step 2: Navigate to Payment Methods

1. Click on **Settings** in the left sidebar menu
2. Scroll down or look for **Payment Methods** section
3. Click on **Payment Methods** or **Payment Settings**

**Alternative Path:**
- You can also access it directly via: **Settings** → **Payment Methods**

### Step 3: Enable International Payments

1. In the Payment Methods page, look for **"International Payments"** or **"International Cards"**
2. You should see a toggle switch or checkbox next to it
3. **Turn ON** the toggle/checkbox to enable international payments
4. Read any terms or conditions that appear (if any)
5. Click **Save** or **Update** to save your changes

### Step 4: Verify the Change

1. The toggle should now show as **enabled** (green/ON state)
2. Wait 2-5 minutes for the changes to take effect across Razorpay's systems
3. You may see a success message confirming the change

### Step 5: Test International Payments

After enabling:

1. Try using an international test card:
   - **Visa International:** `4012 8888 8888 1881`
   - **Mastercard International:** `5555 5555 5555 4444`
   - **CVV:** Any 3 digits (e.g., `123`)
   - **Expiry:** Any future date (e.g., `12/25`)

2. Or continue using Indian test cards (these work regardless):
   - **Visa:** `4111 1111 1111 1111`
   - **Mastercard:** `5555 5555 5555 4444`

## What If You Don't See the Option?

### For Test Mode Accounts:
- International payments should be available in test mode
- If you don't see the option, your account might need activation
- Contact Razorpay support for test mode activation

### For Live Mode Accounts:
- International payments require account verification
- You may need to complete KYC (Know Your Customer) verification
- Some business accounts may have restrictions

## Important Notes

1. **Account Status:**
   - Your Razorpay account must be fully activated
   - KYC verification may be required for live mode

2. **Time to Take Effect:**
   - Changes usually take effect within 2-5 minutes
   - If it doesn't work immediately, wait a few minutes and try again

3. **Test Mode vs Live Mode:**
   - Settings are separate for Test and Live modes
   - Make sure you enable it in the correct mode (Test for development)

4. **Support:**
   - If you can't find the option or it's not working:
     - Check Razorpay documentation: https://razorpay.com/docs/
     - Contact Razorpay support: support@razorpay.com
     - Check their help center: https://razorpay.com/support/

## Visual Guide (Menu Structure)

```
Dashboard
└── Settings (Left Sidebar)
    └── Payment Methods / Payment Settings
        └── International Payments
            └── [Toggle ON/OFF]
```

## Troubleshooting

### Issue: "International Payments" option is missing

**Solutions:**
1. Make sure your account is fully activated
2. Check if you're in the correct mode (Test/Live)
3. Complete KYC verification if required
4. Contact Razorpay support for assistance

### Issue: Option is disabled/grayed out

**Solutions:**
1. Complete account verification
2. Ensure you have the necessary permissions
3. Contact Razorpay support to enable the feature

### Issue: Still getting "International cards not supported" error

**Solutions:**
1. Wait 5-10 minutes after enabling (changes take time to propagate)
2. Clear your browser cache and try again
3. Create a new payment link/order
4. Verify the setting is saved in the dashboard
5. Check if you enabled it in the correct mode (Test vs Live)

## After Enabling

Once international payments are enabled:

✅ You can accept cards from any country  
✅ International test cards will work  
✅ You can test with cards like `4012 8888 8888 1881`  
✅ Indian test cards will continue to work as well  

## Contact Information

If you need help:
- **Email:** support@razorpay.com
- **Phone:** Check Razorpay website for current support numbers
- **Documentation:** https://razorpay.com/docs/payments/
- **Dashboard:** https://dashboard.razorpay.com

