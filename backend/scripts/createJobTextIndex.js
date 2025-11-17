/**
 * Script to create text index for job search
 * Run this once to enable full-text search on jobs
 * 
 * Usage: node scripts/createJobTextIndex.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import JobPost from "../src/models/JobPost.js";

dotenv.config();

const createTextIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Create text index for search
    await JobPost.collection.createIndex({
      title: "text",
      description: "text",
      company: "text",
      location: "text",
    });

    console.log("✅ Text index created successfully for JobPost");
    console.log("You can now use full-text search on jobs");

    process.exit(0);
  } catch (error) {
    console.error("Error creating text index:", error);
    process.exit(1);
  }
};

createTextIndex();
