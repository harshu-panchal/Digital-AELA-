#!/usr/bin/env node

/**
 * Payment Configuration Diagnostic Script
 * Run this to check your payment configuration and get the callback URL to whitelist
 */

const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🔍 PAYMENT CONFIGURATION DIAGNOSTIC');
console.log('=====================================');
console.log('BACKEND_URL:', backendUrl);
console.log('FRONTEND_URL:', frontendUrl);
console.log('');
console.log('📋 CALLBACK URL TO WHITELIST IN RAZORPAY DASHBOARD:');
console.log(`${backendUrl}/api/v1/payments/razorpay/callback`);
console.log('');
console.log('🧪 TEST ENDPOINT:');
console.log(`curl ${backendUrl}/api/v1/payments/test-callback`);
console.log('');
console.log('⚠️  If payments are stuck in polling:');
console.log('1. Whitelist the callback URL above in Razorpay Dashboard');
console.log('2. Check backend logs for "razorpay_payment_id received" message');
console.log('3. Frontend should receive payment_id parameter (not null)');
console.log('4. If payment_id is null, callback URL whitelisting is NOT working');
console.log('');
console.log('🚨 QUICK FIX:');
console.log('1. Run: node scripts/diagnose-payment-config.js');
console.log('2. Copy the callback URL');
console.log('3. Add it to Razorpay Dashboard → Settings → Payment Links → Allowed Redirect URLs');
console.log('4. Test a payment - should work immediately!');

