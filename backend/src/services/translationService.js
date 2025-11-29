import getTranslateClient, { normalizeLanguageCode } from "../config/googleCloud.js";

// In-memory cache for translations (can be upgraded to Redis in production)
const translationCache = new Map();

// Cache key generator
const getCacheKey = (text, targetLang, sourceLang = "en") => {
  return `${sourceLang}_${targetLang}_${Buffer.from(text).toString("base64")}`;
};

// Cache TTL: 24 hours in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Clean up expired cache entries periodically
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of translationCache.entries()) {
    if (value.expiresAt < now) {
      translationCache.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

/**
 * Translate single text
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., "hi", "ar")
 * @param {string} sourceLang - Source language code (default: "en")
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLang, sourceLang = "en") => {
  if (!text || typeof text !== "string" || !text.trim()) {
    return text;
  }

  const normalizedTargetLang = normalizeLanguageCode(targetLang);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);

  // If source and target are same, return original
  if (normalizedSourceLang === normalizedTargetLang) {
    return text;
  }

  // Check cache
  const cacheKey = getCacheKey(text, normalizedTargetLang, normalizedSourceLang);
  const cached = translationCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.translation;
  }

  // Get translation client
  const translate = getTranslateClient();
  if (!translate) {
    // eslint-disable-next-line no-console
    console.warn("[Translation] Google Cloud Translate not configured. Returning original text.");
    return text;
  }

  try {
    let translation;
    
    // If using API key, use REST API directly
    if (translate._useApiKey && translate._apiKey) {
      const apiKey = translate._apiKey;
      const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: normalizedSourceLang,
          target: normalizedTargetLang,
          format: "text",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      translation = data.data?.translations?.[0]?.translatedText || text;
    } else {
      // Use client library (for service account authentication)
      [translation] = await translate.translate(text, {
        from: normalizedSourceLang,
        to: normalizedTargetLang,
      });
    }

    // Cache the result
    translationCache.set(cacheKey, {
      translation,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return translation;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Translation] Error translating text:", error.message);
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

  const normalizedTargetLang = normalizeLanguageCode(targetLang);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);

  // If source and target are same, return originals
  if (normalizedSourceLang === normalizedTargetLang) {
    return texts;
  }

  // Separate cached and uncached texts
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

    const cacheKey = getCacheKey(text, normalizedTargetLang, normalizedSourceLang);
    const cached = translationCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      results[i] = cached.translation;
    } else {
      uncachedTexts.push(text);
      uncachedIndices.push(i);
    }
  }

  // If all texts are cached, return results
  if (uncachedTexts.length === 0) {
    return results;
  }

  // Get translation client
  const translate = getTranslateClient();
  if (!translate) {
    // eslint-disable-next-line no-console
    console.warn("[Translation] Google Cloud Translate not configured. Returning original texts.");
    return texts;
  }

  try {
    let translatedArray;
    
    // If using API key, use REST API directly
    if (translate._useApiKey && translate._apiKey) {
      const apiKey = translate._apiKey;
      const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: uncachedTexts,
          source: normalizedSourceLang,
          target: normalizedTargetLang,
          format: "text",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      translatedArray = data.data?.translations?.map((t) => t.translatedText) || uncachedTexts;
    } else {
      // Use client library (for service account authentication)
      const [translations] = await translate.translate(uncachedTexts, {
        from: normalizedSourceLang,
        to: normalizedTargetLang,
      });
      // Google Cloud Translate returns an array or a single string
      translatedArray = Array.isArray(translations) ? translations : [translations];
    }

    // Update results and cache
    for (let i = 0; i < uncachedTexts.length; i++) {
      const originalText = uncachedTexts[i];
      const translation = translatedArray[i] || originalText;
      const resultIndex = uncachedIndices[i];

      results[resultIndex] = translation;

      // Cache the result
      const cacheKey = getCacheKey(originalText, normalizedTargetLang, normalizedSourceLang);
      translationCache.set(cacheKey, {
        translation,
        expiresAt: Date.now() + CACHE_TTL,
      });
    }

    return results;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Translation] Error translating batch:", error.message);
    // Return original texts on error
    return texts;
  }
};

/**
 * Translate an object's string properties recursively
 * @param {Object} obj - Object to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: "en")
 * @param {string[]} keysToTranslate - Optional array of keys to translate (if not provided, translates all string values)
 * @returns {Promise<Object>} - Translated object
 */
export const translateObject = async (obj, targetLang, sourceLang = "en", keysToTranslate = null) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  const normalizedTargetLang = normalizeLanguageCode(targetLang);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);

  // If source and target are same, return original
  if (normalizedSourceLang === normalizedTargetLang) {
    return obj;
  }

  const translated = { ...obj };
  const textsToTranslate = [];
  const textPaths = [];

  // Collect all texts that need translation
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

