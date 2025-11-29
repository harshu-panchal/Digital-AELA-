/**
 * Script to test Razorpay configuration
 * Run this script with: node scripts/testRazorpay.js
 * 
 * This script will:
 * 1. Check if Razorpay credentials are set
 * 2. Check if Razorpay is enabled
 * 3. Test creating a test order
 */

import mongoose from "mongoose";
import Settings from "../src/models/Settings.js";
import { createOrder, isRazorpayEnabled, getRazorpayKeyId } from "../src/services/razorpayService.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env") });

const testRazorpay = async () => {
  try {
    console.log("🔍 Testing Razorpay Configuration...\n");

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in environment variables");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Check environment variables
    console.log("📋 Checking Environment Variables:");
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (envKeyId) {
      console.log(`   ✅ RAZORPAY_KEY_ID: ${envKeyId.substring(0, 10)}...${envKeyId.substring(envKeyId.length - 4)}`);
      if (!envKeyId.startsWith("rzp_test_") && !envKeyId.startsWith("rzp_live_")) {
        console.log("   ⚠️  WARNING: Key ID doesn't start with 'rzp_test_' or 'rzp_live_'");
      }
    } else {
      console.log("   ❌ RAZORPAY_KEY_ID: Not set");
    }

    if (envKeySecret) {
      console.log(`   ✅ RAZORPAY_KEY_SECRET: Set (${envKeySecret.length} characters)`);
    } else {
      console.log("   ❌ RAZORPAY_KEY_SECRET: Not set");
    }

    // Check database settings
    console.log("\n📋 Checking Database Settings:");
    const enabledSetting = await Settings.findOne({ key: "payment.gateway.razorpay.enabled" });
    const keyIdSetting = await Settings.findOne({ key: "payment.gateway.razorpay.keyId" });
    const keySecretSetting = await Settings.findOne({ key: "payment.gateway.razorpay.keySecret" });

    if (enabledSetting) {
      console.log(`   ✅ Razorpay Enabled: ${enabledSetting.value}`);
    } else {
      console.log("   ❌ Razorpay Enabled: Not set (defaults to false)");
    }

    if (keyIdSetting?.value) {
      console.log(`   ✅ Key ID in DB: ${keyIdSetting.value.substring(0, 10)}...${keyIdSetting.value.substring(keyIdSetting.value.length - 4)}`);
    } else {
      console.log("   ⚠️  Key ID in DB: Not set (will use env variable)");
    }

    if (keySecretSetting?.value) {
      console.log(`   ✅ Key Secret in DB: Set (${keySecretSetting.value.length} characters)`);
    } else {
      console.log("   ⚠️  Key Secret in DB: Not set (will use env variable)");
    }

    // Check if Razorpay is enabled
    console.log("\n📋 Checking Razorpay Status:");
    const isEnabled = await isRazorpayEnabled();
    if (isEnabled) {
      console.log("   ✅ Razorpay is ENABLED");
    } else {
      console.log("   ❌ Razorpay is DISABLED");
      console.log("   💡 Run: node scripts/enableRazorpay.js");
    }

    // Get key ID
    const keyId = await getRazorpayKeyId();
    if (keyId) {
      console.log(`   ✅ Key ID available: ${keyId.substring(0, 10)}...${keyId.substring(keyId.length - 4)}`);
    } else {
      console.log("   ❌ Key ID not available");
    }

    // Test Razorpay initialization and order creation
    console.log("\n📋 Testing Razorpay Connection:");
    try {
      // Get credentials for direct initialization test
      const settingsArray = await Settings.find({
        key: { $in: ["payment.gateway.razorpay.keyId", "payment.gateway.razorpay.keySecret"] }
      }).lean();
      
      const testKeyId = settingsArray.find(s => s.key === "payment.gateway.razorpay.keyId")?.value || envKeyId;
      const testKeySecret = settingsArray.find(s => s.key === "payment.gateway.razorpay.keySecret")?.value || envKeySecret;
      
      if (testKeyId && testKeySecret) {
        // Test direct initialization
        const testRazorpay = new Razorpay({
          key_id: testKeyId,
          key_secret: testKeySecret,
        });
        console.log("   ✅ Razorpay instance can be initialized");
        
        // Test creating a small order using the service function (1 INR)
        console.log("\n📋 Testing Order Creation:");
        try {
          const testOrder = await createOrder(
            1, // 1 INR (will be converted to 100 paise)
            "INR",
            `test_${Date.now()}`,
            {
              test: true,
              description: "Test order from verification script"
            }
          );
          
          console.log("   ✅ Test order created successfully!");
          console.log(`   Order ID: ${testOrder.id}`);
          console.log(`   Amount: ${testOrder.amount / 100} ${testOrder.currency}`);
          console.log(`   Status: ${testOrder.status}`);
          console.log("\n   💡 You can view this order in Razorpay Dashboard → Orders");
        } catch (orderError) {
          console.log("   ❌ Failed to create test order");
          console.log(`   Error: ${orderError.message}`);
          if (orderError.error?.description) {
            console.log(`   Details: ${orderError.error.description}`);
          }
        }
      } else {
        console.log("   ⚠️  Cannot test initialization - credentials not found");
      }
    } catch (initError) {
      console.log("   ❌ Failed to test Razorpay connection");
      console.log(`   Error: ${initError.message}`);
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Summary:");
    
    const hasCredentials = (envKeyId || keyIdSetting?.value) && (envKeySecret || keySecretSetting?.value);
    
    if (hasCredentials && isEnabled) {
      console.log("   ✅ Razorpay is properly configured and ready to use!");
      console.log("\n   💡 Next steps:");
      console.log("      1. Test a payment through the frontend");
      console.log("      2. Use test card: 4111 1111 1111 1111");
      console.log("      3. Check TEST_RAZORPAY.md for detailed testing guide");
    } else {
      console.log("   ⚠️  Razorpay needs configuration:");
      if (!hasCredentials) {
        console.log("      - Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
      }
      if (!isEnabled) {
        console.log("      - Run: node scripts/enableRazorpay.js");
      }
    }

    await mongoose.disconnect();
    console.log("\n✅ Test completed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error testing Razorpay:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

testRazorpay();

