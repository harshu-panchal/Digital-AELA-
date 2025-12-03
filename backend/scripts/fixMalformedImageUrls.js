import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "../src/models/Course.js";
import connectDatabase from "../src/config/db.js";

dotenv.config();

/**
 * Migration script to fix malformed image URLs in courses
 * 
 * This script:
 * 1. Scans all Course documents
 * 2. Identifies courses with malformed URLs (https://static/...)
 * 3. Converts them to proper format (/static/...)
 * 4. Updates the database
 * 
 * Usage: node backend/scripts/fixMalformedImageUrls.js
 * 
 * Note: This script will automatically fix URLs. Make sure to backup your database first.
 */
const fixMalformedImageUrls = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log("✅ Connected to MongoDB\n");

    // Import URL normalizer
    const { normalizeUrl } = await import("../src/utils/urlNormalizer.js");

    // Find all courses
    const allCourses = await Course.find({}).lean();
    console.log(`📚 Found ${allCourses.length} total courses\n`);

    const fixedCourses = [];
    const skippedCourses = [];

    // Check each course for malformed URLs
    for (const course of allCourses) {
      let needsUpdate = false;
      const updates = {};
      const originalValues = {};

      // Check thumbnailUrl
      if (course.thumbnailUrl && /^https?:\/\/static(\/|$)/i.test(course.thumbnailUrl)) {
        originalValues.thumbnailUrl = course.thumbnailUrl;
        updates.thumbnailUrl = normalizeUrl(course.thumbnailUrl);
        needsUpdate = true;
        console.log(`  ⚠️  Course "${course.title}" (${course._id}):`);
        console.log(`     thumbnailUrl: "${course.thumbnailUrl}" -> "${updates.thumbnailUrl}"`);
      }

      // Check brochureUrl
      if (course.brochureUrl && /^https?:\/\/static(\/|$)/i.test(course.brochureUrl)) {
        originalValues.brochureUrl = course.brochureUrl;
        updates.brochureUrl = normalizeUrl(course.brochureUrl);
        needsUpdate = true;
        console.log(`  ⚠️  Course "${course.title}" (${course._id}):`);
        console.log(`     brochureUrl: "${course.brochureUrl}" -> "${updates.brochureUrl}"`);
      }

      // Check metadata.introVideoUrl
      if (course.metadata?.introVideoUrl && /^https?:\/\/static(\/|$)/i.test(course.metadata.introVideoUrl)) {
        originalValues.introVideoUrl = course.metadata.introVideoUrl;
        if (!updates.metadata) {
          updates.metadata = { ...course.metadata };
        }
        updates.metadata.introVideoUrl = normalizeUrl(course.metadata.introVideoUrl);
        needsUpdate = true;
        console.log(`  ⚠️  Course "${course.title}" (${course._id}):`);
        console.log(`     introVideoUrl: "${course.metadata.introVideoUrl}" -> "${updates.metadata.introVideoUrl}"`);
      }

      if (needsUpdate) {
        // Update the course in database
        await Course.updateOne(
          { _id: course._id },
          { $set: updates }
        );

        fixedCourses.push({
          _id: course._id,
          title: course.title,
          originalValues,
          fixedValues: updates,
        });

        console.log(`     ✅ Fixed!\n`);
      } else {
        skippedCourses.push(course._id);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n📊 Migration Summary:");
    console.log(`   Total courses scanned: ${allCourses.length}`);
    console.log(`   Courses with malformed URLs fixed: ${fixedCourses.length}`);
    console.log(`   Courses with no issues: ${skippedCourses.length}`);
    console.log("\n" + "=".repeat(80));

    if (fixedCourses.length > 0) {
      console.log("\n✅ Fixed Courses:");
      fixedCourses.forEach((course, index) => {
        console.log(`\n${index + 1}. ${course.title} (${course._id})`);
        Object.entries(course.originalValues).forEach(([key, value]) => {
          console.log(`   ${key}:`);
          console.log(`     Before: "${value}"`);
          console.log(`     After:  "${course.fixedValues[key] || course.fixedValues.metadata?.[key]}"`);
        });
      });

      // Create a summary report
      const report = {
        timestamp: new Date().toISOString(),
        totalCourses: allCourses.length,
        fixedCourses: fixedCourses.length,
        skippedCourses: skippedCourses.length,
        fixes: fixedCourses.map(course => ({
          id: course._id,
          title: course.title,
          originalValues: course.originalValues,
          fixedValues: course.fixedValues,
        })),
      };

      console.log("\n📄 Summary Report:");
      console.log(JSON.stringify(report, null, 2));
      console.log("\n💾 Migration completed successfully!\n");
    } else {
      console.log("\n✅ No malformed URLs found! All course URLs are in correct format.\n");
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    console.log("\n✨ Migration script completed successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running migration:", error);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

// Run the migration
fixMalformedImageUrls();

