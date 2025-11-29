import { apiRequest } from "./api/baseClient.js";
import { getCachedTranslation, cacheTranslation } from "../utils/translationCache.js";
import { API_BASE_URL } from "../config/api.js";

// Rate limiting for translation requests
const translationQueue = [];
let isProcessingQueue = false;
let lastTranslationRequestTime = 0;
const MIN_TRANSLATION_INTERVAL = 200; // Minimum 200ms between translation requests
const MAX_BATCH_SIZE = 10; // Maximum texts to batch together
const BATCH_WAIT_TIME = 100; // Wait 100ms to collect more requests before processing

// Process translation queue with rate limiting
const processTranslationQueue = async () => {
  if (isProcessingQueue || translationQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (translationQueue.length > 0) {
    // Wait if we're making requests too fast
    const now = Date.now();
    const timeSinceLastRequest = now - lastTranslationRequestTime;
    if (timeSinceLastRequest < MIN_TRANSLATION_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_TRANSLATION_INTERVAL - timeSinceLastRequest));
    }

    // Collect requests to batch together (same target/source language)
    const batch = [];
    const batchTargetLang = translationQueue[0]?.targetLang;
    const batchSourceLang = translationQueue[0]?.sourceLang;

    while (
      translationQueue.length > 0 &&
      batch.length < MAX_BATCH_SIZE &&
      translationQueue[0]?.targetLang === batchTargetLang &&
      translationQueue[0]?.sourceLang === batchSourceLang
    ) {
      batch.push(translationQueue.shift());
    }

    if (batch.length === 0) {
      continue;
    }

    // Process batch
    try {
      lastTranslationRequestTime = Date.now();

      // If single request, use single endpoint
      if (batch.length === 1) {
        const { text, targetLang, sourceLang, resolve, reject } = batch[0];
        try {
          const response = await apiRequest(
            "/translate",
            {
              method: "POST",
              body: { text, targetLang, sourceLang },
              skipAuth: true,
            }
          );
          resolve(response?.data?.translation || text);
        } catch (error) {
          // Suppress 429 errors - they're expected when rate limited
          if (error?.status !== 429) {
            reject(error);
          } else {
            // Return original text on rate limit
            resolve(text);
          }
        }
      } else {
        // Batch multiple requests
        const texts = batch.map(b => b.text);
        try {
          const response = await apiRequest(
            "/translate/batch",
            {
              method: "POST",
              body: { texts, targetLang: batchTargetLang, sourceLang: batchSourceLang },
              skipAuth: true,
            }
          );
          const translations = response?.data?.translations || texts;
          batch.forEach((item, index) => {
            item.resolve(translations[index] || item.text);
          });
        } catch (error) {
          // Suppress 429 errors - they're expected when rate limited
          if (error?.status !== 429) {
            batch.forEach(item => item.reject(error));
          } else {
            // Return original texts on rate limit
            batch.forEach(item => item.resolve(item.text));
          }
        }
      }
    } catch (error) {
      // Handle unexpected errors
      batch.forEach(item => {
        if (error?.status !== 429) {
          item.reject(error);
        } else {
          item.resolve(item.text);
        }
      });
    }
  }

  isProcessingQueue = false;
};

// Queue translation request
const queueTranslation = (text, targetLang, sourceLang) => {
  return new Promise((resolve, reject) => {
    translationQueue.push({ text, targetLang, sourceLang, resolve, reject });
    
    // Process queue after a short delay to allow batching
    setTimeout(() => {
      processTranslationQueue();
    }, BATCH_WAIT_TIME);
  });
};

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
    // Use queued translation to prevent rate limiting
    // Caching is handled in the queue processor
    const translation = await queueTranslation(text, targetLang, sourceLang, normalizedTarget, normalizedSource);

    return translation;
  } catch (error) {
    // Suppress 429 rate limit errors - they're expected
    if (error?.status !== 429) {
      // Log errors in production to help debug API issues
      if (import.meta.env.PROD) {
        console.error("[Translation Service] Translation failed:", {
          error: error.message,
          status: error?.status,
          code: error?.code,
          apiUrl: API_BASE_URL,
          hint: error?.isNetworkError ? "Check if backend server is running and VITE_API_URL is set correctly" : "Check backend translation endpoint",
        });
      }
    }
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
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Translation Service] Calling batch API:", {
        endpoint: "/translate/batch",
        targetLang,
        sourceLang,
        textCount: uncachedTexts.length,
      });
    }

    // Rate limit batch requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastTranslationRequestTime;
    if (timeSinceLastRequest < MIN_TRANSLATION_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_TRANSLATION_INTERVAL - timeSinceLastRequest));
    }

    // Call backend batch translation API
    lastTranslationRequestTime = Date.now();
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

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Translation Service] Batch API Response:", {
        success: !!response?.data?.translations,
        translationCount: response?.data?.translations?.length,
      });
    }

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
    // Suppress 429 rate limit errors - they're expected
    if (error?.status !== 429) {
      // Log errors in production to help debug API issues
      if (import.meta.env.PROD) {
        console.error("[Translation Service] Batch translation failed:", {
          error: error.message,
          status: error?.status,
          code: error?.code,
          apiUrl: API_BASE_URL,
          textCount: uncachedTexts.length,
          hint: error?.isNetworkError ? "Check if backend server is running and VITE_API_URL is set correctly" : "Check backend translation endpoint",
        });
      }
    }
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
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Translation Service] translateObject: No texts to translate");
    }
    return obj;
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[Translation Service] translateObject: Translating", {
      textCount: textsToTranslate.length,
      keys: keysToTranslate || "all",
      targetLang,
      sourceLang,
    });
  }

  // Translate all texts in batch
  const translations = await translateBatch(textsToTranslate, targetLang, sourceLang);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[Translation Service] translateObject: Batch translation complete", {
      translationCount: translations.length,
    });
  }

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

