import { apiRequest } from "./api/baseClient.js";
import { getCachedTranslation, cacheTranslation } from "../utils/translationCache.js";
import { API_BASE_URL } from "../config/api.js";

/**
 * Translate single text using Google Cloud Translate API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., "hi-IN", "ar-SA")
 * @param {string} sourceLang - Source language code (default: "en")
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLang, sourceLang = "en") => {
  if (!text || typeof text !== "string" || !text.trim()) {
    return text;
  }

  // Normalize language codes (remove country code for caching)
  const normalizeForCache = (lang) => lang?.split("-")[0] || "en";
  const normalizedTarget = normalizeForCache(targetLang);
  const normalizedSource = normalizeForCache(sourceLang);

  // Check cache first
  try {
    const cached = await getCachedTranslation(text, normalizedTarget, normalizedSource);
    if (cached) {
      return cached;
    }
  } catch (e) {
    // Cache error, continue with API call
  }

  try {
    // Call backend translation API
    const response = await apiRequest(
      "/translate",
      {
        method: "POST",
        body: {
          text,
          targetLang,
          sourceLang,
        },
        skipAuth: true, // Translation can be public
      }
    );

    const translation = response?.data?.translation || text;

    // Cache the translation
    try {
      await cacheTranslation(text, translation, normalizedTarget, normalizedSource);
    } catch (e) {
      // Cache error, ignore
    }

    return translation;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Translation Service] Error:", error.message);
    // Return original text on error
    return text;
  }
};

/**
 * Translate multiple texts in batch
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: "en")
 * @returns {Promise<string[]>} - Array of translated texts
 */
export const translateBatch = async (texts, targetLang, sourceLang = "en") => {
  if (!Array.isArray(texts) || texts.length === 0) {
    return texts || [];
  }

  const normalizeForCache = (lang) => lang?.split("-")[0] || "en";
  const normalizedTarget = normalizeForCache(targetLang);
  const normalizedSource = normalizeForCache(sourceLang);

  // Check cache for all texts first
  const results = [];
  const uncachedTexts = [];
  const uncachedIndices = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    // Skip empty or invalid texts
    if (!text || typeof text !== "string" || !text.trim()) {
      results[i] = text;
      continue;
    }

    try {
      const cached = await getCachedTranslation(text, normalizedTarget, normalizedSource);
      if (cached) {
        results[i] = cached;
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(i);
      }
    } catch (e) {
      // Cache error, add to uncached
      uncachedTexts.push(text);
      uncachedIndices.push(i);
    }
  }

  // If all texts are cached, return results
  if (uncachedTexts.length === 0) {
    return results;
  }

  try {
    // Call backend batch translation API
    const response = await apiRequest(
      "/translate/batch",
      {
        method: "POST",
        body: {
          texts: uncachedTexts,
          targetLang,
          sourceLang,
        },
        skipAuth: true,
      }
    );

    const translations = response?.data?.translations || uncachedTexts;

    // Update results and cache
    for (let i = 0; i < uncachedTexts.length; i++) {
      const originalText = uncachedTexts[i];
      const translation = translations[i] || originalText;
      const resultIndex = uncachedIndices[i];

      results[resultIndex] = translation;

      // Cache the translation
      try {
        await cacheTranslation(originalText, translation, normalizedTarget, normalizedSource);
      } catch (e) {
        // Cache error, ignore
      }
    }

    return results;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Translation Service] Batch error:", error.message);
    // Return original texts on error
    return texts;
  }
};

/**
 * Translate an object's string properties
 * @param {Object} obj - Object to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: "en")
 * @param {string[]} keysToTranslate - Optional array of keys to translate
 * @returns {Promise<Object>} - Translated object
 */
export const translateObject = async (obj, targetLang, sourceLang = "en", keysToTranslate = null) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  // Collect all texts that need translation
  const textsToTranslate = [];
  const textPaths = [];

  const collectTexts = (current, path = "") => {
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const fullPath = path ? `${path}.${key}` : key;
        const value = current[key];

        if (typeof value === "string" && value.trim()) {
          // Only translate specified keys if provided, otherwise translate all strings
          if (!keysToTranslate || keysToTranslate.includes(key)) {
            textsToTranslate.push(value);
            textPaths.push(fullPath);
          }
        } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // Recursively process nested objects
          collectTexts(value, fullPath);
        }
      }
    }
  };

  collectTexts(obj);

  // If no texts to translate, return original
  if (textsToTranslate.length === 0) {
    return obj;
  }

  // Translate all texts in batch
  const translations = await translateBatch(textsToTranslate, targetLang, sourceLang);

  // Reconstruct object with translated values
  const translated = { ...obj };
  const setNestedValue = (target, path, value) => {
    const parts = path.split(".");
    let current = target;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  };

  for (let i = 0; i < textPaths.length; i++) {
    setNestedValue(translated, textPaths[i], translations[i]);
  }

  return translated;
};

