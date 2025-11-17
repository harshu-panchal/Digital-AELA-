import cron from "node-cron";
import { expireOldJobs } from "../controllers/jobController.js";

/**
 * Setup cron job to expire old jobs
 * Runs daily at 2 AM
 */
export const setupJobExpirationCron = () => {
  // Run daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("[Cron] Running job expiration task...");
    try {
      await expireOldJobs();
      console.log("[Cron] Job expiration task completed");
    } catch (error) {
      console.error("[Cron] Error in job expiration task:", error);
    }
  });

  console.log("[Cron] Job expiration cron job scheduled (daily at 2 AM)");
};

