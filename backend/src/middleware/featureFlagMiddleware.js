import { isFeatureEnabled } from "../utils/settingsHelper.js";

/**
 * Middleware to check if a feature is enabled
 * @param {string} featureKey - Feature key (e.g., "courses", "jobs", "blog")
 * @returns {Function} Express middleware
 */
export const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const enabled = await isFeatureEnabled(featureKey);

      if (!enabled) {
        return res.status(403).json({
          error: {
            code: "FEATURE_DISABLED",
            message: `The ${featureKey} feature is currently disabled.`,
          },
        });
      }

      return next();
    } catch (error) {
      console.error(`Error checking feature ${featureKey}:`, error);
      // On error, allow request to proceed (fail open)
      return next();
    }
  };
};

/**
 * Middleware to check multiple features (all must be enabled)
 * @param {string[]} featureKeys - Array of feature keys
 * @returns {Function} Express middleware
 */
export const requireFeatures = (featureKeys) => {
  return async (req, res, next) => {
    try {
      const checks = await Promise.all(
        featureKeys.map((key) => isFeatureEnabled(key))
      );

      const allEnabled = checks.every((enabled) => enabled === true);

      if (!allEnabled) {
        const disabledFeatures = featureKeys.filter(
          (_, index) => !checks[index]
        );
        return res.status(403).json({
          error: {
            code: "FEATURES_DISABLED",
            message: `The following features are currently disabled: ${disabledFeatures.join(", ")}`,
          },
        });
      }

      return next();
    } catch (error) {
      console.error("Error checking features:", error);
      // On error, allow request to proceed (fail open)
      return next();
    }
  };
};

