/**
 * Script to check which port the backend is configured to use
 * Run with: node scripts/checkPort.js
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, "..", ".env") });

const port = process.env.PORT || 5000;

console.log("\n📊 Backend Port Configuration:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`PORT environment variable: ${process.env.PORT || "NOT SET (using default)"}`);
console.log(`Configured port: ${port}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("💡 For BACKEND_URL, use your public backend domain:");
console.log("   Example: BACKEND_URL=https://api.digitalaela.com");
console.log("   (Don't include the port number in the URL)\n");

