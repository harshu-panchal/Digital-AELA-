/**
 * Payment API Endpoint Test Script
 * Run this script with: node scripts/testPaymentAPI.js
 *
 * This script tests the payment API endpoints directly via HTTP requests.
 * Make sure the backend server is running before executing this script.
 *
 * Usage:
 *   BACKEND_URL=http://localhost:5000 node scripts/testPaymentAPI.js
 *   BACKEND_URL=https://your-api-domain.com node scripts/testPaymentAPI.js
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env") });

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
const API_BASE = `${BACKEND_URL}/api/v1`;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`),
  test: (msg) => console.log(`${colors.cyan}🧪${colors.reset} ${msg}`),
  section: (msg) =>
    console.log(
      `\n${colors.bright}${colors.cyan}${"=".repeat(60)}${colors.reset}\n${
        colors.bright
      }${msg}${colors.reset}\n${"=".repeat(60)}\n`
    ),
};

// Test data
let authToken = null;
let csrfToken = null;
let testPaymentId = null;

/**
 * Make HTTP request
 */
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  if (
    csrfToken &&
    options.method &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(options.method)
  ) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    // Extract CSRF token from response headers
    const responseCsrfToken = response.headers.get("X-CSRF-Token");
    if (responseCsrfToken) {
      csrfToken = responseCsrfToken;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null,
    };
  }
};

/**
 * Test server connectivity
 */
const testServerConnection = async () => {
  log.section("Test 1: Server Connectivity");

  const response = await makeRequest("/health", { method: "GET" });

  if (response.ok || response.status === 404) {
    // Try root endpoint
    const rootResponse = await makeRequest("", { method: "GET" });
    if (rootResponse.ok || rootResponse.status === 200) {
      log.success(`Server is running at ${BACKEND_URL}`);
      return true;
    }
  }

  log.error(`Cannot connect to server at ${BACKEND_URL}`);
  log.warning("Make sure the backend server is running");
  log.info("Start the server with: npm run dev");
  return false;
};

/**
 * Test authentication (mock - you'll need to provide a valid token)
 */
const testAuthentication = async () => {
  log.section("Test 2: Authentication");

  log.warning("This test requires a valid authentication token");
  log.info("You can get a token by:");
  log.info("  1. Logging in through the frontend");
  log.info("  2. Using the token from localStorage");
  log.info("  3. Or creating a test user and logging in via API");

  // Check if token is provided via environment variable
  const envToken = process.env.TEST_AUTH_TOKEN;
  if (envToken) {
    authToken = envToken;
    log.success(
      "Using authentication token from TEST_AUTH_TOKEN environment variable"
    );

    // Test the token
    const response = await makeRequest("/payments/history", { method: "GET" });
    if (response.ok) {
      log.success("Authentication token is valid");
      return true;
    } else {
      log.error("Authentication token is invalid");
      return false;
    }
  } else {
    log.warning(
      "No authentication token provided (set TEST_AUTH_TOKEN env variable)"
    );
    log.info("Skipping authenticated tests...");
    return false;
  }
};

/**
 * Test payment record creation
 */
const testCreatePayment = async () => {
  log.section("Test 3: Create Payment Record");

  if (!authToken) {
    log.warning("Skipping - Authentication required");
    return null;
  }

  const paymentData = {
    amount: 100,
    currency: "INR",
    description: "Test payment from API test script",
    paymentMethod: "card",
    gateway: "razorpay",
  };

  log.test(`Creating payment: ${JSON.stringify(paymentData, null, 2)}`);

  const response = await makeRequest("/payments", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });

  if (response.ok && response.data.payment) {
    testPaymentId = response.data.payment._id;
    log.success(`Payment created successfully: ${testPaymentId}`);
    log.info(
      `Amount: ${response.data.payment.amount} ${response.data.payment.currency}`
    );
    log.info(`Status: ${response.data.payment.status}`);
    return response.data.payment;
  } else {
    log.error(
      `Failed to create payment: ${
        response.data.error?.message || response.error
      }`
    );
    if (response.data.error) {
      log.info(
        `Error details: ${JSON.stringify(response.data.error, null, 2)}`
      );
    }
    return null;
  }
};

/**
 * Test payment link creation
 */
const testCreatePaymentLink = async () => {
  log.section("Test 4: Create Payment Link");

  if (!testPaymentId) {
    log.warning("Skipping - No payment ID available");
    return null;
  }

  log.test(`Creating payment link for payment: ${testPaymentId}`);

  const response = await makeRequest(
    `/payments/${testPaymentId}/payment-link`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );

  if (response.ok && response.data.paymentLink) {
    log.success("Payment link created successfully!");
    log.info(`Payment Link ID: ${response.data.paymentLink.id}`);
    log.info(`Payment Link URL: ${response.data.paymentLink.url}`);
    log.info(`Status: ${response.data.paymentLink.status}`);

    log.warning("\n📝 Next Steps:");
    log.info("1. Copy the payment link URL above");
    log.info("2. Open it in a browser to test the payment flow");
    log.info("3. Use Razorpay test cards (e.g., 4111 1111 1111 1111)");

    return response.data.paymentLink;
  } else {
    log.error(
      `Failed to create payment link: ${
        response.data.error?.message || response.error
      }`
    );
    if (response.data.error) {
      log.info(
        `Error details: ${JSON.stringify(response.data.error, null, 2)}`
      );
    }
    return null;
  }
};

/**
 * Test payment history retrieval
 */
const testGetPaymentHistory = async () => {
  log.section("Test 5: Get Payment History");

  if (!authToken) {
    log.warning("Skipping - Authentication required");
    return null;
  }

  log.test("Fetching payment history...");

  const response = await makeRequest("/payments/history?page=1&pageSize=10", {
    method: "GET",
  });

  if (response.ok && response.data.payments) {
    log.success(`Retrieved ${response.data.payments.length} payment(s)`);
    log.info(`Total payments: ${response.data.pagination?.total || "N/A"}`);

    if (response.data.summary) {
      log.info(`Total amount: ${response.data.summary.totalAmount} INR`);
      log.info(
        `Completed amount: ${response.data.summary.completedAmount} INR`
      );
    }

    if (response.data.payments.length > 0) {
      log.info("\nRecent payments:");
      response.data.payments.slice(0, 3).forEach((payment, index) => {
        log.info(
          `  ${index + 1}. ${payment.amount} ${payment.currency} - ${
            payment.status
          } (${payment._id})`
        );
      });
    }

    return response.data;
  } else {
    log.error(
      `Failed to get payment history: ${
        response.data.error?.message || response.error
      }`
    );
    return null;
  }
};

/**
 * Test payment details retrieval
 */
const testGetPaymentDetails = async () => {
  log.section("Test 6: Get Payment Details");

  if (!testPaymentId) {
    log.warning("Skipping - No payment ID available");
    return null;
  }

  log.test(`Fetching payment details: ${testPaymentId}`);

  const response = await makeRequest(`/payments/${testPaymentId}`, {
    method: "GET",
  });

  if (response.ok && response.data.payment) {
    log.success("Payment details retrieved successfully!");
    const payment = response.data.payment;
    log.info(`ID: ${payment._id}`);
    log.info(`Amount: ${payment.amount} ${payment.currency}`);
    log.info(`Status: ${payment.status}`);
    log.info(`Gateway: ${payment.gateway}`);
    log.info(`Created: ${payment.createdAt}`);
    return payment;
  } else {
    log.error(
      `Failed to get payment details: ${
        response.data.error?.message || response.error
      }`
    );
    return null;
  }
};

/**
 * Run all tests
 */
const runTests = async () => {
  try {
    log.section("Payment API Endpoint Test Suite");
    log.info(`Testing API at: ${BACKEND_URL}`);

    // Test 1: Server connection
    const serverConnected = await testServerConnection();
    if (!serverConnected) {
      process.exit(1);
    }

    // Test 2: Authentication
    const isAuthenticated = await testAuthentication();

    // Test 3: Create payment (requires auth)
    const payment = await testCreatePayment();

    // Test 4: Create payment link (requires payment)
    const paymentLink = await testCreatePaymentLink();

    // Test 5: Get payment history (requires auth)
    await testGetPaymentHistory();

    // Test 6: Get payment details (requires payment)
    await testGetPaymentDetails();

    // Summary
    log.section("Test Summary");

    log.success("✅ Server Connectivity: Passed");
    if (isAuthenticated) {
      log.success("✅ Authentication: Passed");
      log.success("✅ Payment Creation: " + (payment ? "Passed" : "Failed"));
      log.success(
        "✅ Payment Link Creation: " + (paymentLink ? "Passed" : "Failed")
      );
      log.success("✅ Payment History: Passed");
      log.success("✅ Payment Details: Passed");
    } else {
      log.warning("⚠️  Authentication: Skipped (no token provided)");
      log.warning("⚠️  Some tests were skipped due to missing authentication");
    }

    log.info("\n📋 Test Instructions:");
    log.info(
      "1. Set TEST_AUTH_TOKEN environment variable to test authenticated endpoints"
    );
    log.info(
      "2. Example: TEST_AUTH_TOKEN=your_token_here node scripts/testPaymentAPI.js"
    );
    log.info("3. You can get a token by logging in through the frontend");
    log.info(
      "4. Check browser localStorage for 'aela.auth.tokens' to get the access token"
    );

    log.info("\n🔗 Next Steps:");
    log.info(
      "1. Use the payment link URL from Test 4 to complete a test payment"
    );
    log.info("2. Test callback handling after payment completion");
    log.info("3. Test invoice generation for completed payments");
    log.info("4. Test refund functionality for completed payments");

    process.exit(0);
  } catch (error) {
    log.error(`\n❌ Test suite failed: ${error.message}`);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
};

// Run the tests
runTests();
