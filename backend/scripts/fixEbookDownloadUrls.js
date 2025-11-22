import dotenv from "dotenv";
import mongoose from "mongoose";
import EbookResource from "../src/models/EbookResource.js";

dotenv.config();

/**
 * Migration script to identify and fix ebooks with cover image URLs in downloadUrl field
 * 
 * This script:
 * 1. Scans all EbookResource documents
 * 2. Identifies ebooks with image URLs in downloadUrl field
 * 3. Logs affected ebooks for admin review
 * 4. Optionally marks them for manual review
 */
const fixEbookDownloadUrls = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in .env file");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Find all ebooks
    const allEbooks = await EbookResource.find({}).lean();
    console.log(`📚 Found ${allEbooks.length} total ebooks\n`);

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const problematicEbooks = [];
    const fixedEbooks = [];

    for (const ebook of allEbooks) {
      if (!ebook.downloadUrl) {
        continue;
      }

      const urlLower = ebook.downloadUrl.toLowerCase();
      const urlPath = urlLower.split('?')[0].split('#')[0];
      const isImageUrl = imageExtensions.some(ext => urlPath.endsWith(ext));
      const isCoverImagePath = urlLower.includes('/books/covers/') || urlLower.includes('/covers/');

      if (isImageUrl || isCoverImagePath) {
        problematicEbooks.push({
          _id: ebook._id,
          title: ebook.title,
          downloadUrl: ebook.downloadUrl,
          coverImage: ebook.metadata?.coverImage || '',
          isPublic: ebook.isPublic,
          createdAt: ebook.createdAt,
        });
      }
    }

    console.log(`⚠️  Found ${problematicEbooks.length} ebooks with image URLs in downloadUrl field:\n`);

    if (problematicEbooks.length > 0) {
      console.log("=".repeat(80));
      problematicEbooks.forEach((ebook, index) => {
        console.log(`\n${index + 1}. ${ebook.title}`);
        console.log(`   ID: ${ebook._id}`);
        console.log(`   Download URL: ${ebook.downloadUrl}`);
        console.log(`   Cover Image: ${ebook.coverImage || 'N/A'}`);
        console.log(`   Public: ${ebook.isPublic}`);
        console.log(`   Created: ${ebook.createdAt}`);
      });
      console.log("\n" + "=".repeat(80));

      // Ask for confirmation before marking
      console.log("\n⚠️  ACTION REQUIRED:");
      console.log("   These ebooks need manual review to fix their download URLs.");
      console.log("   Options:");
      console.log("   1. Mark as non-public (isPublic: false) until fixed");
      console.log("   2. Leave as-is for manual review");
      console.log("   3. Attempt to find correct PDF URL from coverImage metadata");
      console.log("\n   This script will only LOG the issues. Manual fixes are required.");
      console.log("   Export this list and provide it to the admin team.\n");

      // Create a summary report
      const report = {
        timestamp: new Date().toISOString(),
        totalEbooks: allEbooks.length,
        problematicEbooks: problematicEbooks.length,
        issues: problematicEbooks.map(ebook => ({
          id: ebook._id,
          title: ebook.title,
          currentDownloadUrl: ebook.downloadUrl,
          coverImageUrl: ebook.coverImage,
          suggestion: ebook.coverImage 
            ? "Check if coverImage URL should be used for cover, and downloadUrl should point to actual PDF"
            : "No cover image found - needs manual investigation",
        })),
      };

      console.log("📄 Summary Report:");
      console.log(JSON.stringify(report, null, 2));
      console.log("\n💾 Save this report for admin review.\n");
    } else {
      console.log("✅ No problematic ebooks found! All download URLs appear to be valid.\n");
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    console.log("\n✨ Migration script completed successfully!");
    
    if (problematicEbooks.length > 0) {
      console.log("\n⚠️  Remember: Manual fixes are required for the problematic ebooks listed above.");
      process.exit(1); // Exit with error code to indicate issues found
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error running migration:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the migration
fixEbookDownloadUrls();

