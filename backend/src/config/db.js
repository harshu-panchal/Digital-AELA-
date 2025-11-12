import mongoose from "mongoose";

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
    });
    // eslint-disable-next-line no-console
    console.log("[Database] Connected to MongoDB");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Database] Connection error:", error.message);
    process.exit(1);
  }
};

export default connectDatabase;

