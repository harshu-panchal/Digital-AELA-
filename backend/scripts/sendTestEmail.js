/**
 * Interactive Test Email Script
 * 
 * Run this script to send a test verification email to any email address:
 * node scripts/sendTestEmail.js
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function sendTestEmail() {
  try {
    console.log("📧 Test Email Sender for Digital AELA\n");
    console.log("=" .repeat(50));
    
    // Check environment variables
    console.log("\n📋 Current Email Configuration:");
    console.log("  EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "not set (using SMTP)");
    console.log("  EMAIL_USER:", process.env.EMAIL_USER || process.env.SMTP_USER || "not set");
    console.log("  EMAIL_FROM:", process.env.EMAIL_FROM || process.env.EMAIL_USER || "not set");
    console.log("  FRONTEND_URL:", process.env.FRONTEND_URL || "http://localhost:5173");
    console.log("=" .repeat(50));

    // Get email address from user
    console.log("\n");
    const email = await askQuestion("Enter email address to send test email to: ");
    
    if (!email || !email.trim()) {
      console.error("❌ Email address is required!");
      rl.close();
      process.exit(1);
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.error("❌ Invalid email format!");
      rl.close();
      process.exit(1);
    }

    // Get user name (optional)
    const userName = await askQuestion("Enter recipient name (optional, press Enter to skip): ");
    const name = userName.trim() || "Test User";

    console.log("\n⏳ Sending test email...\n");

    // Import email service
    const { sendVerificationEmail, testEmailConfiguration } = await import("../src/utils/emailService.js");

    // First, test email configuration
    console.log("Testing email transporter configuration...");
    const configTest = await testEmailConfiguration();
    
    if (!configTest.success) {
      console.error("\n❌ Email configuration test failed:");
      console.error("   Error:", configTest.error);
      console.error("\n💡 Please check your .env file:");
      console.error("   - EMAIL_USER or SMTP_USER");
      console.error("   - EMAIL_PASS or SMTP_PASS");
      console.error("   - EMAIL_SERVICE (if using Gmail or SendGrid)");
      rl.close();
      process.exit(1);
    }

    console.log("✅ Email transporter configuration is valid!\n");

    // Generate a test token
    const crypto = (await import("crypto")).default;
    const testToken = crypto.randomBytes(32).toString("hex");
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email?token=${testToken}`;

    // Send test email
    try {
      const result = await sendVerificationEmail(email.trim(), testToken, name);
      
      console.log("✅ Test email sent successfully!");
      console.log("   Message ID:", result.messageId);
      console.log("\n📬 Email Details:");
      console.log("   To:", email.trim());
      console.log("   From:", process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@digitalaela.com");
      console.log("   Subject: Verify Your Email - Digital AELA");
      console.log("\n🔗 Verification Link:");
      console.log("   " + verificationUrl);
      console.log("\n💡 Note: This is a test email. The verification link will work if you have a user account with this email.");
      console.log("\n📋 Next Steps:");
      console.log("   1. Check your inbox (and spam folder)");
      console.log("   2. Click the verification link in the email");
      console.log("   3. Or use the link above to test verification");
      
    } catch (error) {
      console.error("\n❌ Failed to send test email:");
      console.error("   Error:", error.message);
      
      if (error.response) {
        console.error("   Response:", error.response);
      }
      
      if (error.code) {
        console.error("   Error Code:", error.code);
      }

      console.error("\n💡 Common issues:");
      if (error.message.includes("Invalid login") || error.message.includes("authentication")) {
        console.error("   - EMAIL_PASS or SMTP_PASS is incorrect");
        console.error("   - For Gmail, you need an App Password (not regular password)");
        console.error("   - Get App Password: https://myaccount.google.com/apppasswords");
      } else if (error.message.includes("Connection") || error.message.includes("ECONNREFUSED")) {
        console.error("   - SMTP_HOST or SMTP_PORT is incorrect");
        console.error("   - Firewall might be blocking the connection");
        console.error("   - Check your network connection");
      } else if (error.message.includes("timeout")) {
        console.error("   - Connection timeout");
        console.error("   - Check SMTP settings");
      } else {
        console.error("   - Check your email configuration in .env file");
        console.error("   - Verify EMAIL_USER, EMAIL_PASS, and EMAIL_SERVICE settings");
      }
      
      rl.close();
      process.exit(1);
    }

  } catch (error) {
    console.error("\n❌ Script error:", error);
    console.error("   Stack:", error.stack);
    rl.close();
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
console.log("🚀 Starting test email sender...\n");
sendTestEmail().then(() => {
  console.log("\n✨ Test complete!");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

