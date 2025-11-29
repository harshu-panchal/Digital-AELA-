/**
 * Script to enable Razorpay payment gateway
 * Run this script with: node scripts/enableRazorpay.js
 */

import mongoose from "mongoose";
import Settings from "../src/models/Settings.js";
import { clearSettingsCache } from "../src/utils/settingsHelper.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env") });

const enableRazorpay = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in environment variables");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Enable Razorpay
    const setting = await Settings.findOneAndUpdate(
      { key: "payment.gateway.razorpay.enabled" },
      {
        value: true,
        category: "payment",
        type: "boolean",
        label: "Razorpay Enabled",
        description: "Enable Razorpay payment gateway",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("✅ Razorpay payment gateway enabled");
    console.log(`   Setting: ${setting.key} = ${setting.value}`);

    // Clear settings cache
    clearSettingsCache();
    console.log("✅ Settings cache cleared");

    // Check if credentials are set
    const keyIdSetting = await Settings.findOne({ key: "payment.gateway.razorpay.keyId" });
    const keySecretSetting = await Settings.findOne({ key: "payment.gateway.razorpay.keySecret" });

    if (!keyIdSetting || !keyIdSetting.value) {
      console.log("\n⚠️  WARNING: Razorpay Key ID is not configured");
      console.log("   Please set 'payment.gateway.razorpay.keyId' in settings or RAZORPAY_KEY_ID in .env");
    }

    if (!keySecretSetting || !keySecretSetting.value) {
      console.log("\n⚠️  WARNING: Razorpay Key Secret is not configured");
      console.log("   Please set 'payment.gateway.razorpay.keySecret' in settings or RAZORPAY_KEY_SECRET in .env");
    }

    if ((keyIdSetting?.value || process.env.RAZORPAY_KEY_ID) && 
        (keySecretSetting?.value || process.env.RAZORPAY_KEY_SECRET)) {
      console.log("\n✅ Razorpay credentials are configured");
    }

    await mongoose.disconnect();
    console.log("\n✅ Done! Razorpay is now enabled.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error enabling Razorpay:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

enableRazorpay();

