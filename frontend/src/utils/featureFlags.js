import { fetchPublicSettings } from "../services/api/publicSettings.js";

// Cache for feature flags
let featureFlagsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get feature flags from public settings API
 * @returns {Promise<Object>} Object with feature flags
 */
export const getFeatureFlags = async (forceRefresh = false) => {
  try {
    const now = Date.now();

    // Return cached flags if still valid
    if (
      !forceRefresh &&
      featureFlagsCache &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_TTL
    ) {
      return featureFlagsCache;
    }

    // Fetch settings from public API
    const response = await fetchPublicSettings({ category: "features" });
    const features = response.settings?.features || [];

    // Convert array to object for easier access
    const flags = {};
    features.forEach((setting) => {
      if (setting.key?.startsWith("features.") && setting.key?.endsWith(".enabled")) {
        const featureKey = setting.key.replace("features.", "").replace(".enabled", "");
        flags[featureKey] = setting.value === true || setting.value === "true" || setting.value === 1;
      }
    });

    // Set defaults if not found (default to enabled)
    const defaultFeatures = ["courses", "jobs", "blog", "ebooks", "quizzes", "points", "messaging"];
    defaultFeatures.forEach((key) => {
      if (!(key in flags)) {
        flags[key] = true; // Default to enabled
      }
    });

    // Update cache
    featureFlagsCache = flags;
    cacheTimestamp = now;

    return flags;
  } catch (error) {
    console.error("Error fetching feature flags:", error);
    // Return defaults on error (fail open - show features)
    return {
      courses: true,
      jobs: true,
      blog: true,
      ebooks: true,
      quizzes: true,
      points: true,
      messaging: true,
    };
  }
};

/**
 * Check if a specific feature is enabled
 * @param {string} featureKey - Feature key (e.g., "courses", "jobs")
 * @returns {Promise<boolean>} True if feature is enabled
 */
export const isFeatureEnabled = async (featureKey) => {
  try {
    const flags = await getFeatureFlags();
    return flags[featureKey] === true;
  } catch (error) {
    console.error(`Error checking feature ${featureKey}:`, error);
    return true; // Default to enabled on error
  }
};

/**
 * Clear feature flags cache
 */
export const clearFeatureFlagsCache = () => {
  featureFlagsCache = null;
  cacheTimestamp = null;
};

/**
 * React hook for feature flags (for use in components)
 * Note: This is a simple version. For React components, consider using useState/useEffect
 */
export const useFeatureFlags = () => {
  // This would typically use React hooks, but for now we'll provide a simple async function
  // Components should use getFeatureFlags() with useState/useEffect
  return {
    getFeatureFlags,
    isFeatureEnabled,
    clearFeatureFlagsCache,
  };
};

