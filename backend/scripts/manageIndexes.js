import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Index Management Script
 * 
 * Usage:
 *   node scripts/manageIndexes.js list          - List all indexes
 *   node scripts/manageIndexes.js create        - Create all recommended indexes
 *   node scripts/manageIndexes.js analyze        - Analyze index usage
 *   node scripts/manageIndexes.js drop <name>    - Drop a specific index
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is required");
  process.exit(1);
}

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// List all indexes for all collections
const listIndexes = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log("\n=== Database Indexes ===\n");
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const indexes = await mongoose.connection.db.collection(collectionName).indexes();
      
      if (indexes.length > 1) { // More than just _id index
        console.log(`\nCollection: ${collectionName}`);
        indexes.forEach((index, idx) => {
          console.log(`  ${idx + 1}. ${index.name}`);
          console.log(`     Keys: ${JSON.stringify(index.key)}`);
          if (index.unique) console.log(`     Unique: true`);
          if (index.sparse) console.log(`     Sparse: true`);
        });
      }
    }
  } catch (error) {
    console.error("Error listing indexes:", error);
  }
};

// Create recommended indexes
const createIndexes = async () => {
  try {
    console.log("\n=== Creating Recommended Indexes ===\n");
    
    // Import all models to ensure schemas are registered
    await import("../src/models/User.js");
    await import("../src/models/Course.js");
    await import("../src/models/JobPost.js");
    await import("../src/models/Enrollment.js");
    await import("../src/models/JobApplication.js");
    await import("../src/models/EbookResource.js");
    await import("../src/models/RecruiterBlog.js");
    await import("../src/models/Quiz.js");
    await import("../src/models/LessonCompletion.js");
    await import("../src/models/VideoProgress.js");
    await import("../src/models/QuizAttempt.js");
    await import("../src/models/EbookReadingProgress.js");
    
    // Sync indexes (create missing indexes from schema definitions)
    const models = mongoose.modelNames();
    let createdCount = 0;
    
    for (const modelName of models) {
      const model = mongoose.model(modelName);
      try {
        await model.syncIndexes();
        console.log(`✓ Synced indexes for ${modelName}`);
        createdCount++;
      } catch (error) {
        console.error(`✗ Error syncing indexes for ${modelName}:`, error.message);
      }
    }
    
    console.log(`\n✓ Created/synced indexes for ${createdCount} models`);
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
};

// Analyze index usage (requires MongoDB 3.2+)
const analyzeIndexes = async () => {
  try {
    console.log("\n=== Index Usage Analysis ===\n");
    console.log("Note: Index usage stats require MongoDB 3.2+ and may not be available in all environments\n");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const stats = await mongoose.connection.db.command({
        collStats: collectionName,
        indexDetails: true,
      });
      
      if (stats.indexSizes) {
        console.log(`\nCollection: ${collectionName}`);
        console.log(`  Total Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (stats.indexDetails) {
          Object.keys(stats.indexDetails).forEach((indexName) => {
            const details = stats.indexDetails[indexName];
            console.log(`  Index: ${indexName}`);
            console.log(`    Size: ${(details.size / 1024).toFixed(2)} KB`);
            if (details.accesses) {
              console.log(`    Accesses: ${details.accesses.ops || 0}`);
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Error analyzing indexes:", error.message);
    console.log("Note: Index usage analysis may not be available in your MongoDB version");
  }
};

// Drop a specific index
const dropIndex = async (collectionName, indexName) => {
  try {
    await mongoose.connection.db.collection(collectionName).dropIndex(indexName);
    console.log(`✓ Dropped index ${indexName} from ${collectionName}`);
  } catch (error) {
    console.error(`✗ Error dropping index:`, error.message);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  
  switch (command) {
    case "list":
      await listIndexes();
      break;
    case "create":
      await createIndexes();
      break;
    case "analyze":
      await analyzeIndexes();
      break;
    case "drop":
      const collectionName = process.argv[3];
      const indexName = process.argv[4];
      if (!collectionName || !indexName) {
        console.error("Usage: node scripts/manageIndexes.js drop <collectionName> <indexName>");
        process.exit(1);
      }
      await dropIndex(collectionName, indexName);
      break;
    default:
      console.log("Usage:");
      console.log("  node scripts/manageIndexes.js list          - List all indexes");
      console.log("  node scripts/manageIndexes.js create        - Create all recommended indexes");
      console.log("  node scripts/manageIndexes.js analyze       - Analyze index usage");
      console.log("  node scripts/manageIndexes.js drop <col> <idx> - Drop a specific index");
      process.exit(1);
  }
  
  await mongoose.connection.close();
  console.log("\nDisconnected from MongoDB");
  process.exit(0);
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

