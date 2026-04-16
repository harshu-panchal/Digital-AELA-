import Settings from "../models/Settings.js";

// Cache for settings to reduce database queries
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute cache
const settingValueCache = new Map();

const getCachedSettingValue = (key) => {
  const cached = settingValueCache.get(key);
  if (!cached) {
    return undefined;
  }

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    settingValueCache.delete(key);
    return undefined;
  }

  return cached.value;
};

const setCachedSettingValue = (key, value) => {
  settingValueCache.set(key, {
    value,
    timestamp: Date.now(),
  });
};

/**
 * Get a setting value by key
 * @param {string} key - Setting key (e.g., "email.smtp.host")
 * @param {any} defaultValue - Default value if setting not found
 * @returns {Promise<any>} Setting value
 */
export const getSetting = async (key, defaultValue = null) => {
  try {
    const cached = getCachedSettingValue(key);
    if (cached !== undefined) {
      return cached;
    }

    const setting = await Settings.findOne({ key }).lean();
    const value = setting ? setting.value : defaultValue;
    setCachedSettingValue(key, value);
    return value;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Get multiple settings by keys
 * @param {string[]} keys - Array of setting keys
 * @returns {Promise<Object>} Object with key-value pairs
 */
export const getSettings = async (keys) => {
  try {
    const result = {};
    const missingKeys = [];

    keys.forEach((key) => {
      const cached = getCachedSettingValue(key);
      if (cached !== undefined) {
        result[key] = cached;
      } else {
        missingKeys.push(key);
      }
    });

    if (missingKeys.length === 0) {
      return result;
    }

    const settings = await Settings.find({ key: { $in: missingKeys } }).lean();
    settings.forEach((setting) => {
      result[setting.key] = setting.value;
      setCachedSettingValue(setting.key, setting.value);
    });
    // Fill in defaults for missing keys
    keys.forEach((key) => {
      if (!(key in result)) {
        result[key] = null;
        setCachedSettingValue(key, null);
      }
    });
    return result;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {};
  }
};

/**
 * Get all settings (with caching)
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} Object with all settings grouped by category
 */
export const getAllSettings = async (forceRefresh = false) => {
  try {
    const now = Date.now();
    
    // Return cached settings if still valid
    if (!forceRefresh && settingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      return settingsCache;
    }

    const settings = await Settings.find({}).lean();
    const grouped = {};
    
    settings.forEach((setting) => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {};
      }
      grouped[setting.category][setting.key] = setting.value;
    });

    // Update cache
    settingsCache = grouped;
    cacheTimestamp = now;

    return grouped;
  } catch (error) {
    console.error("Error fetching all settings:", error);
    return {};
  }
};

/**
 * Clear settings cache (call this when settings are updated)
 */
export const clearSettingsCache = () => {
  settingsCache = null;
  cacheTimestamp = null;
  settingValueCache.clear();
};

/**
 * Check if a feature is enabled
 * @param {string} featureKey - Feature key (e.g., "courses", "jobs")
 * @returns {Promise<boolean>} True if feature is enabled
 */
export const isFeatureEnabled = async (featureKey) => {
  try {
    const key = `features.${featureKey}.enabled`;
    const value = await getSetting(key, true); // Default to enabled if not set
    return value === true || value === "true" || value === 1;
  } catch (error) {
    console.error(`Error checking feature ${featureKey}:`, error);
    return true; // Default to enabled on error
  }
};

/**
 * Check if maintenance mode is enabled
 * @returns {Promise<boolean>} True if maintenance mode is enabled
 */
export const isMaintenanceModeEnabled = async () => {
  try {
    const value = await getSetting("maintenance.enabled", false);
    return value === true || value === "true" || value === 1;
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
    return false; // Default to disabled on error
  }
};

/**
 * Get maintenance message
 * @returns {Promise<string>} Maintenance message
 */
export const getMaintenanceMessage = async () => {
  try {
    return await getSetting(
      "maintenance.message",
      "We are currently performing maintenance. Please check back soon."
    );
  } catch (error) {
    console.error("Error fetching maintenance message:", error);
    return "We are currently performing maintenance. Please check back soon.";
  }
};

