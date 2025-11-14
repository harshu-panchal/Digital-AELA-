import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";

dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in .env file");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Super admin credentials
    const email = "admin@digitalaela.com";
    const password = "admin123"; // Change this to a secure password
    const fullName = "Super Admin";

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log("   If you want to update the password, delete the user first or use a different email.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password (using bcrypt with 12 salt rounds, same as in authController)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create super admin user
    const superAdmin = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName,
      role: "super-admin",
      isActive: true,
    });

    console.log("\n✅ Super Admin user created successfully!");
    console.log("\n📋 Login Credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: super-admin`);
    console.log(`   User ID: ${superAdmin._id}`);
    console.log("\n🔐 Please change the password after first login!");
    console.log("\n🌐 Access the admin dashboard at: http://localhost:5173/admin/login");

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
    process.exit(1);
  }
};

createSuperAdmin();

