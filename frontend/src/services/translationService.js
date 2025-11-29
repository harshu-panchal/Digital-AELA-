import { apiRequest } from "./api/baseClient.js";
import {
  getCachedTranslation,
  cacheTranslation,
} from "../utils/translationCache.js";
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
    if (import.meta.env.PROD && translationQueue.length > 0) {
      console.log("[Translation Service] Queue processing skipped:", {
        isProcessingQueue,
        queueLength: translationQueue.length,
      });
    }
    return;
  }

  if (import.meta.env.PROD) {
    console.log("[Translation Service] Starting queue processing:", {
      queueLength: translationQueue.length,
      apiUrl: API_BASE_URL,
    });
  }

  isProcessingQueue = true;

  while (translationQueue.length > 0) {
    // Wait if we're making requests too fast
    const now = Date.now();
    const timeSinceLastRequest = now - lastTranslationRequestTime;
    if (timeSinceLastRequest < MIN_TRANSLATION_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_TRANSLATION_INTERVAL - timeSinceLastRequest)
      );
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
        const {
          text,
          targetLang,
          sourceLang,
          normalizedTarget,
          normalizedSource,
          resolve,
          reject,
        } = batch[0];

        if (import.meta.env.PROD) {
          console.log(
            "[Translation Service] Making single translation API call:",
            {
              endpoint: "/translate",
              apiUrl: API_BASE_URL,
              fullUrl: `${API_BASE_URL}/translate`,
              text: text.substring(0, 50) + "...",
              targetLang,
              sourceLang,
            }
          );
        }

        try {
          const response = await apiRequest("/translate", {
            method: "POST",
            body: { text, targetLang, sourceLang },
            skipAuth: true,
          });

          if (import.meta.env.PROD) {
            console.log(
              "[Translation Service] Single translation API response:",
              {
                success: !!response?.data?.translation,
                hasTranslation: !!response?.data?.translation,
                responseKeys: response ? Object.keys(response) : [],
              }
            );
          }

          const translation = response?.data?.translation || text;

          if (import.meta.env.PROD) {
            console.log(
              "[Translation Service] Single translation API response received:",
              {
                original: text.substring(0, 50) + "...",
                translated: translation.substring(0, 50) + "...",
                isSameAsOriginal: translation === text,
                responseHasTranslation: !!response?.data?.translation,
                responseKeys: response ? Object.keys(response) : [],
                dataKeys: response?.data ? Object.keys(response.data) : [],
                responseStructure: JSON.stringify(response, null, 2).substring(
                  0,
                  500
                ),
              }
            );
          }

          // CRITICAL: If translation is same as original, log error with full response details
          if (translation === text && normalizedTarget !== normalizedSource) {
            console.error(
              "[Translation Service] ❌ CRITICAL ERROR: API returned original text instead of translation!",
              {
                text: text.substring(0, 50) + "...",
                translation: translation.substring(0, 50) + "...",
                targetLang,
                sourceLang,
                normalizedTarget,
                normalizedSource,
                responseStructure: {
                  hasData: !!response?.data,
                  hasTranslation: !!response?.data?.translation,
                  dataKeys: response?.data ? Object.keys(response.data) : [],
                  responseKeys: response ? Object.keys(response) : [],
                  fullResponse: JSON.stringify(response, null, 2).substring(
                    0,
                    1000
                  ),
                },
                apiUrl: API_BASE_URL,
                endpoint: "/translate",
                hint: "Backend translation API is not translating. Check backend logs and Google Cloud Translate configuration.",
              }
            );
          }

          // Cache the translation for future use
          if (translation !== text && normalizedTarget && normalizedSource) {
            try {
              await cacheTranslation(
                text,
                translation,
                normalizedTarget,
                normalizedSource
              );
              if (import.meta.env.PROD) {
                console.log(
                  "[Translation Service] Translation cached successfully:",
                  {
                    original: text.substring(0, 30) + "...",
                    cached: translation.substring(0, 30) + "...",
                  }
                );
              }
            } catch (cacheError) {
              // Cache error, ignore but continue
              if (import.meta.env.PROD) {
                console.warn(
                  "[Translation Service] Failed to cache translation:",
                  cacheError.message
                );
              }
            }
          } else {
            if (import.meta.env.PROD) {
              console.warn("[Translation Service] Translation not cached:", {
                reason:
                  translation === text
                    ? "translation same as original (BUG!)"
                    : "missing normalized language codes",
                normalizedTarget,
                normalizedSource,
                translation,
                text,
              });
            }
          }

          if (import.meta.env.PROD) {
            console.log("[Translation Service] Resolving single translation:", {
              original: text.substring(0, 50) + "...",
              translated: translation.substring(0, 50) + "...",
              changed: translation !== text,
            });
          }

          resolve(translation);
        } catch (error) {
          // Handle rate limit errors (429) - return original text but log warning
          if (error?.status === 429) {
            if (import.meta.env.PROD) {
              console.warn(
                "[Translation Service] Rate limit exceeded, returning original text:",
                {
                  text: text.substring(0, 50) + "...",
                  retryAfter: error?.data?.error?.retryAfter,
                  hint: "Translation API rate limit exceeded. Translations will be retried automatically.",
                }
              );
            }
            // Return original text on rate limit - frontend will retry later
            resolve(text);
          } else {
            // Enhanced error logging for production
            if (import.meta.env.PROD) {
              console.error(
                "[Translation Service] Single translation failed:",
                {
                  error: error.message,
                  status: error?.status,
                  code: error?.code,
                  apiUrl: API_BASE_URL,
                  endpoint: "/translate",
                  requestBody: {
                    text: text.substring(0, 50) + "...",
                    targetLang,
                    sourceLang,
                  },
                  hint: error?.isNetworkError
                    ? "Check if backend server is running and VITE_API_URL is set correctly"
                    : error?.status === 502
                    ? "Backend server may be down or restarting"
                    : "Check backend translation endpoint and Google Cloud Translate configuration",
                }
              );
            }
            reject(error);
          }
        }
      } else {
        // Batch multiple requests
        const texts = batch.map((b) => b.text);
        const batchNormalizedTarget = batch[0]?.normalizedTarget;
        const batchNormalizedSource = batch[0]?.normalizedSource;

        if (import.meta.env.PROD) {
          console.log(
            "[Translation Service] Making batch translation API call:",
            {
              endpoint: "/translate/batch",
              apiUrl: API_BASE_URL,
              fullUrl: `${API_BASE_URL}/translate/batch`,
              textCount: texts.length,
              targetLang: batchTargetLang,
              sourceLang: batchSourceLang,
            }
          );
        }

        try {
          const response = await apiRequest("/translate/batch", {
            method: "POST",
            body: {
              texts,
              targetLang: batchTargetLang,
              sourceLang: batchSourceLang,
            },
            skipAuth: true,
          });

          if (import.meta.env.PROD) {
            console.log(
              "[Translation Service] Batch translation API response:",
              {
                success: !!response?.data?.translations,
                translationCount: response?.data?.translations?.length,
                expectedCount: texts.length,
                responseKeys: response ? Object.keys(response) : [],
              }
            );
          }

          const translations = response?.data?.translations || texts;

          if (import.meta.env.PROD) {
            console.log(
              "[Translation Service] Batch translation API response received:",
              {
                originalCount: texts.length,
                translationCount: translations.length,
                responseStructure: {
                  hasData: !!response?.data,
                  hasTranslations: !!response?.data?.translations,
                  dataKeys: response?.data ? Object.keys(response.data) : [],
                  responseKeys: response ? Object.keys(response) : [],
                },
                sampleOriginal: texts[0]?.substring(0, 50) + "...",
                sampleTranslation: translations[0]?.substring(0, 50) + "...",
                isSameAsOriginal: translations[0] === texts[0],
              }
            );
          }

          // CRITICAL: Check if all translations are same as originals (backend bug)
          const allSameAsOriginal = translations.every(
            (trans, idx) => trans === texts[idx]
          );
          if (
            allSameAsOriginal &&
            batchNormalizedTarget !== batchNormalizedSource
          ) {
            console.error(
              "[Translation Service] ❌ CRITICAL ERROR: Batch API returned all original texts instead of translations!",
              {
                textCount: texts.length,
                targetLang: batchTargetLang,
                sourceLang: batchSourceLang,
                normalizedTarget: batchNormalizedTarget,
                normalizedSource: batchNormalizedSource,
                responseStructure: {
                  hasData: !!response?.data,
                  hasTranslations: !!response?.data?.translations,
                  dataKeys: response?.data ? Object.keys(response.data) : [],
                  responseKeys: response ? Object.keys(response) : [],
                  fullResponse: JSON.stringify(response, null, 2).substring(
                    0,
                    500
                  ),
                },
                hint: "Backend translation API is not translating. Check backend logs and Google Cloud Translate configuration.",
              }
            );
          }

          // Cache all translations for future use (only if they're different from original)
          if (batchNormalizedTarget && batchNormalizedSource) {
            for (let i = 0; i < batch.length; i++) {
              const originalText = batch[i].text;
              const translation = translations[i] || originalText;

              // Only cache if translation is different from original
              if (translation !== originalText) {
                try {
                  await cacheTranslation(
                    originalText,
                    translation,
                    batchNormalizedTarget,
                    batchNormalizedSource
                  );
                } catch (cacheError) {
                  // Cache error, ignore but continue
                  if (import.meta.env.PROD && i === 0) {
                    console.warn(
                      "[Translation Service] Failed to cache batch translations:",
                      cacheError.message
                    );
                  }
                }
              } else if (
                import.meta.env.PROD &&
                batchNormalizedTarget !== batchNormalizedSource
              ) {
                // Log when we skip caching because translation equals original
                console.warn(
                  "[Translation Service] ⚠️ Skipping cache: Translation equals original (backend may not be translating)",
                  {
                    original: originalText.substring(0, 50) + "...",
                    translation: translation.substring(0, 50) + "...",
                    index: i,
                  }
                );
              }
            }
          }

          batch.forEach((item, index) => {
            const translation = translations[index] || item.text;

            // Log if individual translation is same as original
            if (
              import.meta.env.PROD &&
              translation === item.text &&
              batchNormalizedTarget !== batchNormalizedSource
            ) {
              console.warn(
                "[Translation Service] ⚠️ Individual translation equals original:",
                {
                  text: item.text.substring(0, 50) + "...",
                  translation: translation.substring(0, 50) + "...",
                  index,
                }
              );
            }

            item.resolve(translation);
          });
        } catch (error) {
          // Handle rate limit errors (429) - return original texts but log warning
          if (error?.status === 429) {
            if (import.meta.env.PROD) {
              console.warn(
                "[Translation Service] Rate limit exceeded for batch, returning original texts:",
                {
                  textCount: texts.length,
                  retryAfter: error?.data?.error?.retryAfter,
                  hint: "Translation API rate limit exceeded. Translations will be retried automatically.",
                }
              );
            }
            // Return original texts on rate limit - frontend will retry later
            batch.forEach((item) => item.resolve(item.text));
          } else {
            // Enhanced error logging for production
            if (import.meta.env.PROD) {
              console.error("[Translation Service] Batch translation failed:", {
                error: error.message,
                status: error?.status,
                code: error?.code,
                apiUrl: API_BASE_URL,
                endpoint: "/translate/batch",
                requestBody: {
                  textCount: texts.length,
                  targetLang: batchTargetLang,
                  sourceLang: batchSourceLang,
                },
                hint: error?.isNetworkError
                  ? "Check if backend server is running and VITE_API_URL is set correctly"
                  : error?.status === 502
                  ? "Backend server may be down or restarting"
                  : "Check backend translation endpoint and Google Cloud Translate configuration",
              });
            }
            batch.forEach((item) => item.reject(error));
          }
        }
      }
    } catch (error) {
      // Handle unexpected errors
      batch.forEach((item) => {
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
const queueTranslation = (
  text,
  targetLang,
  sourceLang,
  normalizedTarget,
  normalizedSource
) => {
  return new Promise((resolve, reject) => {
    const queueItem = {
      text,
      targetLang,
      sourceLang,
      normalizedTarget,
      normalizedSource,
      resolve,
      reject,
      queuedAt: Date.now(),
    };

    translationQueue.push(queueItem);

    if (import.meta.env.PROD) {
      console.log("[Translation Service] Item added to queue:", {
        text: text.substring(0, 30) + "...",
        queueLength: translationQueue.length,
        willProcessIn: BATCH_WAIT_TIME + "ms",
      });
    }

    // Process queue after a short delay to allow batching
    setTimeout(() => {
      if (import.meta.env.PROD) {
        console.log("[Translation Service] Queue processing timer fired:", {
          queueLength: translationQueue.length,
          isProcessingQueue,
        });
      }
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
  if (import.meta.env.PROD) {
    console.log("[Translation Service] translateText called:", {
      text: text?.substring(0, 50) + (text?.length > 50 ? "..." : ""),
      targetLang,
      sourceLang,
      apiUrl: API_BASE_URL,
      timestamp: new Date().toISOString(),
    });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    if (import.meta.env.PROD) {
      console.log(
        "[Translation Service] translateText: Invalid text, returning original"
      );
    }
    return text;
  }

  // Normalize language codes (remove country code for caching)
  const normalizeForCache = (lang) => lang?.split("-")[0] || "en";
  const normalizedTarget = normalizeForCache(targetLang);
  const normalizedSource = normalizeForCache(sourceLang);

  if (import.meta.env.PROD) {
    console.log("[Translation Service] Normalized language codes:", {
      targetLang,
      normalizedTarget,
      sourceLang,
      normalizedSource,
    });
  }

  // Check cache first
  try {
    const cached = await getCachedTranslation(
      text,
      normalizedTarget,
      normalizedSource
    );
    if (cached) {
      if (import.meta.env.PROD) {
        console.log("[Translation Service] Cache HIT:", {
          text: text.substring(0, 50) + "...",
          cached: cached.substring(0, 50) + "...",
          isSameAsOriginal: cached === text,
          normalizedTarget,
          normalizedSource,
          targetLang,
          sourceLang,
        });

        // CRITICAL: If cache returns same as original, it's wrong - clear it and retry
        if (cached === text && normalizedTarget !== normalizedSource) {
          console.warn(
            "[Translation Service] ⚠️ CACHE BUG: Cache returned original text instead of translation! Clearing cache entry and retrying..."
          );
          // Don't return cached - continue to API call
        } else {
          return cached;
        }
      } else {
        return cached;
      }
    } else {
      if (import.meta.env.PROD) {
        console.log("[Translation Service] Cache MISS:", {
          text: text.substring(0, 50) + "...",
          normalizedTarget,
          normalizedSource,
        });
      }
    }
  } catch (e) {
    if (import.meta.env.PROD) {
      console.warn("[Translation Service] Cache check error:", e.message);
    }
    // Cache error, continue with API call
  }

  try {
    if (import.meta.env.PROD) {
      console.log("[Translation Service] Queuing translation request:", {
        text: text.substring(0, 50) + "...",
        targetLang,
        sourceLang,
        normalizedTarget,
        normalizedSource,
        queueLengthBefore: translationQueue.length,
      });
    }

    // Use queued translation to prevent rate limiting
    // Caching is handled in the queue processor
    const translationPromise = queueTranslation(
      text,
      targetLang,
      sourceLang,
      normalizedTarget,
      normalizedSource
    );

    if (import.meta.env.PROD) {
      console.log(
        "[Translation Service] Queue item added, waiting for translation...",
        {
          queueLengthAfter: translationQueue.length,
        }
      );
    }

    const translation = await translationPromise;

    if (import.meta.env.PROD) {
      console.log("[Translation Service] Translation received from queue:", {
        original: text.substring(0, 50) + "...",
        translated:
          typeof translation === "string"
            ? translation.substring(0, 50) + "..."
            : translation,
        changed: translation !== text,
        isSameAsOriginal: translation === text,
      });

      // CRITICAL: If translation is same as original, log error
      if (translation === text && normalizedTarget !== normalizedSource) {
        console.error(
          "[Translation Service] ❌ CRITICAL ERROR: Translation returned original text!",
          {
            text: text.substring(0, 50) + "...",
            targetLang,
            sourceLang,
            normalizedTarget,
            normalizedSource,
            hint: "API may be returning original text or translation failed silently",
          }
        );
      }
    }

    return translation;
  } catch (error) {
    // Suppress 429 rate limit errors - they're expected
    if (error?.status !== 429) {
      // Enhanced error logging for production
      if (import.meta.env.PROD) {
        console.error("[Translation Service] Translation failed:", {
          error: error.message,
          status: error?.status,
          code: error?.code,
          apiUrl: API_BASE_URL,
          endpoint: "/translate",
          text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
          targetLang,
          sourceLang,
          hint: error?.isNetworkError
            ? "Check if backend server is running and VITE_API_URL is set correctly"
            : error?.status === 502
            ? "Backend server may be down or restarting"
            : "Check backend translation endpoint and Google Cloud Translate configuration",
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
      const cached = await getCachedTranslation(
        text,
        normalizedTarget,
        normalizedSource
      );
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
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_TRANSLATION_INTERVAL - timeSinceLastRequest)
      );
    }

    // Call backend batch translation API
    lastTranslationRequestTime = Date.now();
    const response = await apiRequest("/translate/batch", {
      method: "POST",
      body: {
        texts: uncachedTexts,
        targetLang,
        sourceLang,
      },
      skipAuth: true,
    });

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
        await cacheTranslation(
          originalText,
          translation,
          normalizedTarget,
          normalizedSource
        );
      } catch (e) {
        // Cache error, ignore
      }
    }

    return results;
  } catch (error) {
    // Suppress 429 rate limit errors - they're expected
    if (error?.status !== 429) {
      // Enhanced error logging for production
      if (import.meta.env.PROD) {
        console.error("[Translation Service] Batch translation failed:", {
          error: error.message,
          status: error?.status,
          code: error?.code,
          apiUrl: API_BASE_URL,
          endpoint: "/translate/batch",
          textCount: uncachedTexts.length,
          targetLang,
          sourceLang,
          hint: error?.isNetworkError
            ? "Check if backend server is running and VITE_API_URL is set correctly"
            : error?.status === 502
            ? "Backend server may be down or restarting"
            : "Check backend translation endpoint and Google Cloud Translate configuration",
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
export const translateObject = async (
  obj,
  targetLang,
  sourceLang = "en",
  keysToTranslate = null
) => {
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
        } else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
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
      console.log(
        "[Translation Service] translateObject: No texts to translate"
      );
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
  const translations = await translateBatch(
    textsToTranslate,
    targetLang,
    sourceLang
  );

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(
      "[Translation Service] translateObject: Batch translation complete",
      {
        translationCount: translations.length,
      }
    );
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
