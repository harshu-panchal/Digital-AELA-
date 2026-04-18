import { expireOldJobs } from "../controllers/jobController.js";

const DAILY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Setup job expiration task using native setInterval (replaces node-cron)
 * Runs every 24 hours.
 */
export const setupJobExpirationCron = () => {
  const runTask = async () => {
    console.log("[JobExpiration] Running job expiration task...");
    try {
      await expireOldJobs();
      console.log("[JobExpiration] Job expiration task completed");
    } catch (error) {
      console.error("[JobExpiration] Error in job expiration task:", error);
    }
  };

  // Run once immediately on startup, then every 24 hours
  runTask();
  setInterval(runTask, DAILY_MS);

  console.log("[JobExpiration] Job expiration task scheduled (every 24 hours)");
};
