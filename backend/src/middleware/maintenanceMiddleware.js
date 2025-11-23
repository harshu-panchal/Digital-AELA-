import { isMaintenanceModeEnabled, getMaintenanceMessage } from "../utils/settingsHelper.js";

/**
 * Maintenance mode middleware
 * Blocks all requests except for admins when maintenance mode is enabled
 */
export const checkMaintenanceMode = async (req, res, next) => {
  try {
    const maintenanceEnabled = await isMaintenanceModeEnabled();

    if (!maintenanceEnabled) {
      return next();
    }

    // Allow admins and super-admins to bypass maintenance mode
    const userRole = req.auth?.userRole;
    if (userRole === "admin" || userRole === "super-admin") {
      return next();
    }

    // Allow access to health check and public settings endpoints
    const publicPaths = ["/health", "/api/v1/public/settings"];
    if (publicPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Block all other requests
    const message = await getMaintenanceMessage();
    return res.status(503).json({
      error: {
        code: "MAINTENANCE_MODE",
        message: message || "We are currently performing maintenance. Please check back soon.",
      },
      maintenance: true,
    });
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
    // On error, allow request to proceed (fail open)
    return next();
  }
};

