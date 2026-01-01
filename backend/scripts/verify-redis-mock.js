
import { getRedisClient, isRedisAvailable } from "../src/config/redis.js";

const verifyRedisMock = async () => {
    console.log("=== Verifying Redis Client (Mock Mode Check) ===");

    // 1. Get Client
    console.log("1. Getting Redis client...");
    const client = getRedisClient();

    if (!client) {
        console.error("❌ Failed: Client is null");
        process.exit(1);
    }
    console.log("✅ Client obtained");

    // 2. Check Availability
    console.log("2. Checking availability (should be false if mock, true if real)...");
    const available = await isRedisAvailable();
    console.log(`ℹ️ Redis Available: ${available}`);

    // 3. Test Set/Get
    console.log("3. Testing Set/Get operation...");
    try {
        const key = "test_key_" + Date.now();
        const val = "test_value";

        await client.set(key, val);
        const retrieved = await client.get(key);

        if (retrieved === val) {
            console.log("✅ Set/Get successful");
        } else {
            console.error(`❌ Failed: Expected '${val}', got '${retrieved}'`);
        }
    } catch (err) {
        console.error("❌ Operation failed:", err.message);
    }

    // 4. Test Mock-specific behavior (optional)
    // If real Redis is down, this confirms the app won't crash.

    console.log("=== Verification Complete ===");
    process.exit(0);
};

verifyRedisMock();
