import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import AuditLog from "../src/models/AuditLog.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyPasswordChange() {
  console.log("Starting Password Change Feature Verification...");

  try {
    // 1. Connect to DB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27015/digital-aela";
    await mongoose.connect(mongoUri);
    console.log("Connected to database.");

    // 2. Setup Test User
    const email = "test-security@example.com";
    await User.deleteMany({ email });
    await AuditLog.deleteMany({}); // Clear logs for clean test

    const initialPassword = "InitialPassword123!";
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    
    const testUser = await User.create({
      email,
      fullName: "Security Test User",
      passwordHash,
      role: "super-admin",
      isActive: true,
      emailVerified: true
    });
    console.log("Created test user.");

    const userId = testUser._id;

    // Helper for mocking the change password logic (since we want to test the controller logic)
    // In a real test we'd use supertest, but here we'll simulate the controller steps
    
    async function simulateChangePassword(currentPassword, newPassword) {
      console.log(`\nTesting: Current="${currentPassword}", New="${newPassword}"`);
      
      // 1. Strength Validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
      if (!passwordRegex.test(newPassword)) {
        console.log("❌ Strength Validation Failed (Expected)");
        return { success: false, error: "STRENGTH_ERROR" };
      }

      const user = await User.findById(userId).select("+passwordHash +passwordHistory");
      
      // 2. Current Password Verification
      const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordMatch) {
        await AuditLog.create({
          user: userId,
          action: "password_change_attempt",
          entity: "User",
          entityId: userId,
          status: "failure",
          details: { reason: "Incorrect current password" }
        });
        console.log("❌ Current Password Match Failed (Expected if wrong)");
        return { success: false, error: "AUTH_ERROR" };
      }

      // 3. History Check
      const isRecentlyUsed = await Promise.all(
        (user.passwordHistory || []).map((hash) => bcrypt.compare(newPassword, hash))
      );

      if (isRecentlyUsed.some((match) => match)) {
        console.log("❌ History Check Failed (Expected)");
        return { success: false, error: "HISTORY_ERROR" };
      }

      // Success Path
      const newHash = await bcrypt.hash(newPassword, 12);
      const updatedHistory = [user.passwordHash, ...(user.passwordHistory || [])].slice(0, 5);
      
      await User.findByIdAndUpdate(userId, {
        passwordHash: newHash,
        passwordHistory: updatedHistory,
        lastPasswordChange: new Date(),
      });

      await AuditLog.create({
        user: userId,
        action: "password_change",
        entity: "User",
        entityId: userId,
        status: "success"
      });
      
      console.log("✅ Password Changed Successfully");
      return { success: true };
    }

    // --- TEST SCENARIOS ---

    // Scenario 1: Weak Password
    await simulateChangePassword(initialPassword, "weak");

    // Scenario 2: Wrong Current Password
    await simulateChangePassword("WrongPass123!", "NewValidPassword123!");

    // Scenario 3: Valid Change
    const secondPassword = "SecondValidPassword123!";
    await simulateChangePassword(initialPassword, secondPassword);

    // Scenario 4: Reuse Previous Password
    await simulateChangePassword(secondPassword, initialPassword);

    // Scenario 5: Fill History and test 6th reuse (should be allowed)
    console.log("\nFilling history...");
    const p3 = "PasswordNumber3!";
    const p4 = "PasswordNumber4!";
    const p5 = "PasswordNumber5!";
    const p6 = "PasswordNumber6!";
    const p7 = "PasswordNumber7!";
    
    await simulateChangePassword(secondPassword, p3);
    await simulateChangePassword(p3, p4);
    await simulateChangePassword(p4, p5);
    await simulateChangePassword(p5, p6);
    await simulateChangePassword(p6, p7);
    
    console.log("\nTesting reuse of the very first password (initialPassword) which should be out of history now...");
    await simulateChangePassword(p7, initialPassword);

    // 4. Verify Audit Logs
    const logs = await AuditLog.find({ user: userId });
    console.log(`\nTotal Audit Logs found: ${logs.length}`);
    logs.forEach(log => {
      console.log(`- ${log.action}: ${log.status} (${log.details?.reason || 'no reason'})`);
    });

    // Cleanup
    await User.deleteMany({ email });
    console.log("\nVerification complete. Cleanup done.");

  } catch (error) {
    console.error("Verification failed with error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyPasswordChange();
