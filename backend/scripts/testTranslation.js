#!/usr/bin/env node

/**
 * Test script for Google Cloud Translate API
 * 
 * Usage: node scripts/testTranslation.js
 * 
 * This script tests the translation API to verify:
 * 1. API key is configured correctly
 * 2. Translation service is working
 * 3. All supported languages can be translated
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import getTranslateClient, { normalizeLanguageCode } from "../src/config/googleCloud.js";
import { translateText, translateBatch } from "../src/services/translationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env") });

const testTexts = [
  "Hello, World!",
  "Welcome to Digital AELA",
  "Learn and grow with us",
];

const supportedLanguages = [
  { code: "hi", name: "Hindi" },
  { code: "ur", name: "Urdu" },
  { code: "bn", name: "Bangla" },
  { code: "ne", name: "Nepali" },
  { code: "si", name: "Sinhala" },
  { code: "ps", name: "Pashto" },
  { code: "ar", name: "Arabic" },
];

async function testTranslation() {
  console.log("🧪 Testing Google Cloud Translate API...\n");

  // Check if API key is set
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: GOOGLE_CLOUD_TRANSLATE_API_KEY not found in .env file");
    console.log("\n📝 Setup Instructions:");
    console.log("1. Add GOOGLE_CLOUD_TRANSLATE_API_KEY to backend/.env");
    console.log("2. Get your API key from: https://console.cloud.google.com/apis/credentials");
    console.log("3. Enable Cloud Translation API: https://console.cloud.google.com/apis/library/translate.googleapis.com");
    process.exit(1);
  }

  if (apiKey === "your_api_key_here" || apiKey.length < 20) {
    console.error("❌ ERROR: Invalid API key format detected");
    console.log("\n📝 Please replace 'your_api_key_here' with your actual Google Cloud Translate API key");
    console.log("   Get your API key from: https://console.cloud.google.com/apis/credentials");
    process.exit(1);
  }

  console.log("✅ API Key found in environment\n");

  // Initialize translate client
  const translate = getTranslateClient();
  if (!translate) {
    console.error("❌ ERROR: Failed to initialize Google Cloud Translate client");
    console.log("Check your API key and ensure Cloud Translation API is enabled");
    process.exit(1);
  }

  console.log("✅ Translate client initialized successfully\n");

  // Test single translation using translation service
  console.log("📝 Testing single text translation...");
  try {
    const testText = "Hello, World!";
    const translation = await translateText(testText, "hi", "en");
    console.log(`   Original: ${testText}`);
    console.log(`   Translated (Hindi): ${translation}`);
    if (translation === testText) {
      throw new Error("Translation returned original text - API may not be working");
    }
    console.log("✅ Single translation test passed\n");
  } catch (error) {
    console.error("❌ Single translation test failed:", error.message);
    if (error.message.includes("API key") || error.message.includes("invalid") || error.message.includes("identity")) {
      console.log("\n💡 Troubleshooting:");
      console.log("1. Verify your API key is correct in backend/.env");
      console.log("2. Ensure Cloud Translation API is enabled in Google Cloud Console");
      console.log("3. Check API key restrictions in Google Cloud Console");
      console.log("4. Verify you haven't exceeded API quota limits");
      console.log("5. Make sure the API key has 'Cloud Translation API' enabled");
    }
    process.exit(1);
  }

  // Test batch translation using translation service
  console.log("📝 Testing batch translation...");
  try {
    const translations = await translateBatch(testTexts, "hi", "en");
    console.log(`   Translated ${testTexts.length} texts successfully`);
    translations.forEach((translation, index) => {
      console.log(`   ${index + 1}. "${testTexts[index]}" → "${translation}"`);
    });
    // Check if translations are different from originals
    const allSame = translations.every((t, i) => t === testTexts[i]);
    if (allSame) {
      throw new Error("All translations returned original texts - API may not be working");
    }
    console.log("✅ Batch translation test passed\n");
  } catch (error) {
    console.error("❌ Batch translation test failed:", error.message);
    process.exit(1);
  }

  // Test all supported languages using translation service
  console.log("📝 Testing all supported languages...");
  const results = [];
  for (const lang of supportedLanguages) {
    try {
      const normalizedCode = normalizeLanguageCode(lang.code);
      const translation = await translateText("Hello", normalizedCode, "en");
      if (translation === "Hello") {
        throw new Error("Translation returned original text");
      }
      results.push({ lang: lang.name, code: normalizedCode, success: true, translation });
      console.log(`   ✅ ${lang.name} (${normalizedCode}): "${translation}"`);
    } catch (error) {
      results.push({ lang: lang.name, code: lang.code, success: false, error: error.message });
      console.log(`   ❌ ${lang.name} (${lang.code}): ${error.message}`);
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(`\n📊 Test Results: ${successCount} passed, ${failCount} failed\n`);

  if (failCount > 0) {
    console.log("⚠️  Some languages failed. This might be due to:");
    console.log("   - API quota limits");
    console.log("   - Unsupported language codes");
    console.log("   - Network issues");
  }

  if (successCount === supportedLanguages.length) {
    console.log("🎉 All tests passed! Translation system is ready to use.");
  } else if (successCount > 0) {
    console.log("⚠️  Partial success. Translation will work for supported languages.");
  } else {
    console.error("❌ All language tests failed. Please check your API key and configuration.");
    process.exit(1);
  }
}

// Run tests
testTranslation().catch((error) => {
  console.error("❌ Test script error:", error);
  process.exit(1);
});

