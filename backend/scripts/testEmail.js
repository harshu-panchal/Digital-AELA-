/**
 * Test Email Configuration Script
 * 
 * Run this script to test if your email configuration is working:
 * node scripts/testEmail.js
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

const require = createRequire(import.meta.url);

async function testEmail() {
  try {
    console.log("📧 Testing Email Configuration...\n");
    
    // Check environment variables
    console.log("Environment Variables:");
    console.log("  EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "not set");
    console.log("  EMAIL_USER:", process.env.EMAIL_USER || "not set");
    console.log("  EMAIL_PASS:", process.env.EMAIL_PASS ? "***set***" : "❌ NOT SET");
    console.log("  EMAIL_FROM:", process.env.EMAIL_FROM || "not set");
    console.log("  FRONTEND_URL:", process.env.FRONTEND_URL || "not set");
    console.log("  SMTP_HOST:", process.env.SMTP_HOST || "not set");
    console.log("  SMTP_PORT:", process.env.SMTP_PORT || "not set");
    console.log("  SMTP_USER:", process.env.SMTP_USER || "not set");
    console.log("  SMTP_PASS:", process.env.SMTP_PASS ? "***set***" : "not set");
    console.log("");

    // Check if required variables are set
    if (!process.env.EMAIL_USER && !process.env.SMTP_USER) {
      console.error("❌ ERROR: EMAIL_USER or SMTP_USER must be set");
      return;
    }

    if (!process.env.EMAIL_PASS && !process.env.SMTP_PASS) {
      console.error("❌ ERROR: EMAIL_PASS or SMTP_PASS must be set");
      console.error("   For Gmail, you need an App Password (not your regular password)");
      console.error("   Get it from: https://myaccount.google.com/apppasswords");
      return;
    }

    // Import email service
    const { sendVerificationEmail, testEmailConfiguration } = await import("../src/utils/emailService.js");

    // Test email transporter configuration
    console.log("Testing email transporter configuration...");
    const configTest = await testEmailConfiguration();
    
    if (!configTest.success) {
      console.error("❌ Email configuration test failed:");
      console.error("   Error:", configTest.error);
      console.error("\nCommon issues:");
      console.error("   1. Wrong EMAIL_PASS (should be App Password for Gmail)");
      console.error("   2. 2-Step Verification not enabled on Gmail");
      console.error("   3. App Passwords not available for your account");
      console.error("   4. SMTP settings incorrect");
      return;
    }

    console.log("✅ Email transporter configuration is valid!\n");

    // Test sending a verification email
    const testEmail = process.env.EMAIL_USER || process.env.SMTP_USER;
    console.log(`Sending test verification email to: ${testEmail}`);
    
    const testToken = "test-token-12345";
    const testName = "Test User";

    try {
      const result = await sendVerificationEmail(testEmail, testToken, testName);
      console.log("✅ Test email sent successfully!");
      console.log("   Message ID:", result.messageId);
      console.log("\n📬 Check your inbox (and spam folder) for the test email.");
      console.log("   The verification link will be: " + (process.env.FRONTEND_URL || "http://localhost:5173") + "/verify-email?token=" + testToken);
    } catch (error) {
      console.error("❌ Failed to send test email:");
      console.error("   Error:", error.message);
      console.error("   Full error:", error);
      
      if (error.message.includes("Invalid login")) {
        console.error("\n💡 This usually means:");
        console.error("   - EMAIL_PASS is incorrect");
        console.error("   - For Gmail, you need an App Password, not your regular password");
      } else if (error.message.includes("Connection")) {
        console.error("\n💡 This usually means:");
        console.error("   - SMTP_HOST or SMTP_PORT is incorrect");
        console.error("   - Firewall blocking the connection");
      }
    }

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the test
testEmail().then(() => {
  console.log("\n✨ Test complete!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

