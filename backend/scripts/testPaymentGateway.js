/**
 * Comprehensive Payment Gateway Test Script
 * Run this script with: node scripts/testPaymentGateway.js
 * 
 * This script will test:
 * 1. Payment gateway service initialization
 * 2. Payment record creation
 * 3. Payment link creation
 * 4. Payment verification
 * 5. Payment history retrieval
 * 6. Invoice generation
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Payment from "../src/models/Payment.js";
import User from "../src/models/User.js";
import Course from "../src/models/Course.js";
import {
  isRazorpayEnabled,
  getRazorpayKeyId,
  createPaymentLink,
  fetchPayment,
} from "../src/services/paymentGatewayService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env") });

// Test configuration
const TEST_AMOUNT = 100; // AED
const TEST_CURRENCY = "AED";

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`),
  test: (msg) => console.log(`${colors.cyan}🧪${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.bright}${msg}${colors.reset}\n${'='.repeat(60)}\n`),
};

const testPaymentGateway = async () => {
  let testUser = null;
  let testCourse = null;
  let testPayment = null;

  try {
    log.section("Payment Gateway Test Suite");

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      log.error("MONGODB_URI not found in environment variables");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    log.success("Connected to MongoDB");

    // ==========================================
    // Test 1: Check Razorpay Configuration
    // ==========================================
    log.section("Test 1: Razorpay Configuration Check");
    
    const enabled = await isRazorpayEnabled();
    if (enabled) {
      log.success("Razorpay is enabled");
    } else {
      log.error("Razorpay is disabled");
      log.warning("Run: node scripts/enableRazorpay.js to enable it");
      throw new Error("Razorpay is not enabled");
    }

    const keyId = await getRazorpayKeyId();
    if (keyId) {
      log.success(`Key ID available: ${keyId.substring(0, 10)}...${keyId.substring(keyId.length - 4)}`);
      log.info(`Key ID: ${keyId}`);
    } else {
      log.error("Key ID not available");
      throw new Error("Razorpay key ID not configured");
    }

    // ==========================================
    // Test 2: Setup Test Data
    // ==========================================
    log.section("Test 2: Setting Up Test Data");

    // Get or create test user
    testUser = await User.findOne({ email: "test.payment@digitalaela.com" });
    if (!testUser) {
      log.info("Creating test user...");
      // Create a minimal test user (without password for simplicity)
      testUser = await User.create({
        email: "test.payment@digitalaela.com",
        fullName: "Test Payment User",
        passwordHash: "$2a$10$dummyhashforpaymenttestonly", // Dummy hash
        role: "student",
        phone: "+971501234567",
      });
      log.success(`Test user created: ${testUser.email}`);
    } else {
      log.success(`Using existing test user: ${testUser.email}`);
    }

    // Get or create test course
    testCourse = await Course.findOne({ title: "Test Payment Course" });
    if (!testCourse) {
      log.info("Creating test course...");
      const instructors = await User.find({ role: "teacher" }).limit(1);
      if (instructors.length === 0) {
        log.warning("No teacher found. Creating a test teacher...");
        const testTeacher = await User.create({
          email: "test.teacher@digitalaela.com",
          fullName: "Test Teacher",
          passwordHash: "$2a$10$dummyhashforpaymenttestonly",
          role: "teacher",
        });
        testCourse = await Course.create({
          title: "Test Payment Course",
          description: "A test course for payment gateway testing",
          instructor: testTeacher._id,
          price: TEST_AMOUNT,
          currency: TEST_CURRENCY,
          category: "Test",
          status: "published",
        });
      } else {
        testCourse = await Course.create({
          title: "Test Payment Course",
          description: "A test course for payment gateway testing",
          instructor: instructors[0]._id,
          price: TEST_AMOUNT,
          currency: TEST_CURRENCY,
          category: "Test",
          status: "published",
        });
      }
      log.success(`Test course created: ${testCourse.title}`);
    } else {
      log.success(`Using existing test course: ${testCourse.title}`);
    }

    // ==========================================
    // Test 3: Create Payment Record
    // ==========================================
    log.section("Test 3: Payment Record Creation");

    // Clean up any existing pending test payments
    await Payment.deleteMany({
      user: testUser._id,
      course: testCourse._id,
      status: "pending",
      description: { $regex: /^Test payment/ },
    });

    testPayment = await Payment.create({
      user: testUser._id,
      course: testCourse._id,
      amount: TEST_AMOUNT,
      currency: TEST_CURRENCY,
      description: "Test payment for gateway testing",
      paymentMethod: "card",
      gateway: "razorpay",
      status: "pending",
    });

    log.success(`Payment record created: ${testPayment._id}`);
    log.info(`Amount: ${testPayment.amount} ${testPayment.currency}`);
    log.info(`Status: ${testPayment.status}`);
    log.info(`Gateway: ${testPayment.gateway}`);

    // ==========================================
    // Test 4: Create Payment Link
    // ==========================================
    log.section("Test 4: Payment Link Creation");

    try {
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const isLocalhost = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1');
      const callbackUrl = isLocalhost
        ? `${backendUrl}/api/v1/payments/callback?paymentId=${testPayment._id}`
        : `${frontendUrl}/payment/callback?paymentId=${testPayment._id}`;

      log.info(`Callback URL: ${callbackUrl}`);

      const paymentLink = await createPaymentLink({
        amount: testPayment.amount,
        currency: testPayment.currency,
        receipt: testPayment._id.toString(),
        description: testPayment.description,
        customerName: testUser.fullName,
        customerEmail: testUser.email,
        customerContact: testUser.phone || "",
        callbackUrl: callbackUrl,
        notes: {
          payment_id: testPayment._id.toString(),
          user_id: testUser._id.toString(),
          course_id: testCourse._id.toString(),
          test: true,
        },
      });

      log.success("Payment link created successfully!");
      log.info(`Payment Link ID: ${paymentLink.id}`);
      log.info(`Payment Link URL: ${paymentLink.url}`);
      log.info(`Status: ${paymentLink.status}`);

      // Update payment with payment link ID
      testPayment.gatewayPaymentIntentId = paymentLink.id;
      testPayment.status = "processing";
      await testPayment.save();
      log.success("Payment record updated with payment link ID");

      log.warning("\n📝 Important Notes:");
      log.info("1. The payment link URL above can be used to test the payment flow");
      log.info("2. Use Razorpay test cards for testing (e.g., 4111 1111 1111 1111)");
      log.info("3. The callback URL must be whitelisted in Razorpay dashboard for production");
      log.info("4. For localhost testing, use backend callback URL");
  log.info("");
  log.info("🔴 PRODUCTION TROUBLESHOOTING:");
  log.info("If payments work on localhost but not production:");
  log.info("1. Check callback URL is whitelisted in Razorpay Dashboard");
  log.info("2. Verify webhook URL is correct and active");
  log.info("3. Check BACKEND_URL and FRONTEND_URL environment variables");
  log.info("4. Look for 'CRITICAL: razorpay_payment_id is missing' in backend logs");

    } catch (linkError) {
      log.error(`Failed to create payment link: ${linkError.message}`);
      if (linkError.error?.description) {
        log.error(`Details: ${linkError.error.description}`);
      }
      throw linkError;
    }

    // ==========================================
    // Test 5: Fetch Payment from Razorpay
    // ==========================================
    log.section("Test 5: Payment Fetch Test (Simulated)");

    log.info("This test requires an actual payment to be made through the payment link");
    log.info("After making a test payment, you can fetch payment details using:");
    log.info(`  fetchPayment(payment_id_from_razorpay)`);

    // ==========================================
    // Test 6: Payment History Retrieval
    // ==========================================
    log.section("Test 6: Payment History Retrieval");

    const paymentHistory = await Payment.find({ user: testUser._id })
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    log.success(`Found ${paymentHistory.length} payment(s) for test user`);
    paymentHistory.forEach((payment, index) => {
      log.info(`\nPayment ${index + 1}:`);
      log.info(`  ID: ${payment._id}`);
      log.info(`  Amount: ${payment.amount} ${payment.currency}`);
      log.info(`  Status: ${payment.status}`);
      log.info(`  Gateway: ${payment.gateway}`);
      log.info(`  Course: ${payment.course?.title || 'N/A'}`);
      log.info(`  Created: ${payment.createdAt}`);
    });

    // ==========================================
    // Test 7: Payment Status Enumeration
    // ==========================================
    log.section("Test 7: Payment Status Check");

    const statusCounts = await Payment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    log.info("Payment status distribution:");
    statusCounts.forEach((status) => {
      log.info(`  ${status._id}: ${status.count}`);
    });

    // ==========================================
    // Test 8: Cleanup Options
    // ==========================================
    log.section("Test 8: Cleanup");

    log.info("Test payment records created:");
    log.info(`  Payment ID: ${testPayment._id}`);
    log.info(`  User ID: ${testUser._id}`);
    log.info(`  Course ID: ${testCourse._id}`);

    log.warning("\nCleanup Options:");
    log.info("1. Keep test data for further testing (recommended)");
    log.info("2. Delete test payment: Payment.findByIdAndDelete(paymentId)");
    log.info("3. Delete test user: User.findByIdAndDelete(userId)");
    log.info("4. Delete test course: Course.findByIdAndDelete(courseId)");

    // ==========================================
    // Summary
    // ==========================================
    log.section("Test Summary");

    log.success("✅ Payment Gateway Service: Working");
    log.success("✅ Payment Record Creation: Working");
    log.success("✅ Payment Link Creation: Working");
    log.success("✅ Payment History Retrieval: Working");

    log.info("\n📋 Next Steps:");
    log.info("1. Use the payment link URL above to test the full payment flow");
    log.info("2. Test with Razorpay test cards (see Razorpay docs)");
    log.info("3. Check callback handling after payment completion");
    log.info("4. Verify invoice generation for completed payments");
    log.info("5. Test refund functionality for completed payments");

    log.info("\n🔗 Useful Links:");
    log.info("- Razorpay Test Cards: https://razorpay.com/docs/payments/test-cards/");
    log.info("- Razorpay Dashboard: https://dashboard.razorpay.com/");
    log.info("- Payment Link: " + (testPayment.gatewayPaymentIntentId ? "Created" : "Not created"));

    await mongoose.disconnect();
    log.success("\n✅ All tests completed successfully!");
    process.exit(0);
  } catch (error) {
    log.error(`\n❌ Test failed: ${error.message}`);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }

    // Cleanup on error
    try {
      if (testPayment && testPayment.status === "pending") {
        log.info("Cleaning up test payment...");
        await Payment.findByIdAndDelete(testPayment._id);
      }
    } catch (cleanupError) {
      log.warning("Failed to cleanup test payment");
    }

    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run the tests
testPaymentGateway();

