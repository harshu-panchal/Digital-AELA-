import { useState, useEffect } from "react";
import { getFeatureFlags, isFeatureEnabled } from "../utils/featureFlags.js";

/**
 * React hook to get feature flags
 * @returns {Object} { featureFlags, loading, refresh }
 */
export const useFeatureFlags = () => {
  const [featureFlags, setFeatureFlags] = useState({
    courses: true,
    jobs: true,
    blog: true,
    ebooks: true,
    quizzes: true,
    points: true,
    messaging: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatureFlags = async () => {
      try {
        setLoading(true);
        const flags = await getFeatureFlags();
        setFeatureFlags(flags);
      } catch (error) {
        console.error("Failed to load feature flags:", error);
        // Keep defaults on error
      } finally {
        setLoading(false);
      }
    };

    loadFeatureFlags();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      loadFeatureFlags();
    };

    window.addEventListener("socialSettingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("socialSettingsUpdated", handleSettingsUpdate);
    };
  }, []);

  const refresh = async () => {
    try {
      setLoading(true);
      const flags = await getFeatureFlags(true); // Force refresh
      setFeatureFlags(flags);
    } catch (error) {
      console.error("Failed to refresh feature flags:", error);
    } finally {
      setLoading(false);
    }
  };

  return { featureFlags, loading, refresh };
};

/**
 * React hook to check if a specific feature is enabled
 * @param {string} featureKey - Feature key (e.g., "courses", "jobs")
 * @returns {Object} { enabled, loading }
 */
export const useFeature = (featureKey) => {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        setLoading(true);
        const isEnabled = await isFeatureEnabled(featureKey);
        setEnabled(isEnabled);
      } catch (error) {
        console.error(`Failed to check feature ${featureKey}:`, error);
        setEnabled(true); // Default to enabled on error
      } finally {
        setLoading(false);
      }
    };

    checkFeature();
  }, [featureKey]);

  return { enabled, loading };
};

