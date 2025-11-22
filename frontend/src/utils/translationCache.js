// Translation cache utility using IndexedDB and localStorage fallback

const CACHE_VERSION = 1;
const DB_NAME = "aela_translations";
const STORE_NAME = "translations";
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

let db = null;

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      // Fallback to localStorage if IndexedDB is not available
      resolve(null);
      return;
    }

    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, CACHE_VERSION);

    request.onerror = () => {
      // eslint-disable-next-line no-console
      console.warn("[Translation Cache] IndexedDB not available, using localStorage");
      resolve(null);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

// Generate cache key
const getCacheKey = (text, targetLang, sourceLang = "en") => {
  const textHash = btoa(encodeURIComponent(text)).substring(0, 100);
  return `${sourceLang}_${targetLang}_${textHash}`;
};

// Get from IndexedDB
const getFromIndexedDB = (key) => {
  return new Promise((resolve) => {
    if (!db) {
      resolve(null);
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      if (result && result.expiresAt > Date.now()) {
        resolve(result.translation);
      } else if (result) {
        // Expired, delete it
        deleteFromIndexedDB(key);
        resolve(null);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      resolve(null);
    };
  });
};

// Set in IndexedDB
const setInIndexedDB = (key, translation, ttl = 24 * 60 * 60 * 1000) => {
  return new Promise((resolve) => {
    if (!db) {
      resolve(false);
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const data = {
      key,
      translation,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    const request = store.put(data);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      resolve(false);
    };
  });
};

// Delete from IndexedDB
const deleteFromIndexedDB = (key) => {
  return new Promise((resolve) => {
    if (!db) {
      resolve(false);
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      resolve(false);
    };
  });
};

// Get from localStorage (fallback)
const getFromLocalStorage = (key) => {
  try {
    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem(`translation_${key}`);
    if (!cached) return null;

    const data = JSON.parse(cached);
    if (data.expiresAt > Date.now()) {
      return data.translation;
    }

    // Expired, delete it
    localStorage.removeItem(`translation_${key}`);
    return null;
  } catch (e) {
    return null;
  }
};

// Set in localStorage (fallback)
const setInLocalStorage = (key, translation, ttl = 24 * 60 * 60 * 1000) => {
  try {
    if (typeof window === "undefined") return false;

    const data = {
      translation,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    localStorage.setItem(`translation_${key}`, JSON.stringify(data));
    return true;
  } catch (e) {
    // Storage quota exceeded or other error
    return false;
  }
};

// Initialize cache
initDB();

/**
 * Get cached translation
 * @param {string} text - Original text
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: "en")
 * @returns {Promise<string|null>} - Cached translation or null
 */
export const getCachedTranslation = async (text, targetLang, sourceLang = "en") => {
  if (!text || typeof text !== "string" || !text.trim()) {
    return null;
  }

  const key = getCacheKey(text, targetLang, sourceLang);

  // Try IndexedDB first
  if (db) {
    const cached = await getFromIndexedDB(key);
    if (cached) {
      return cached;
    }
  }

  // Fallback to localStorage
  return getFromLocalStorage(key);
};

/**
 * Cache translation
 * @param {string} text - Original text
 * @param {string} translation - Translated text
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: "en")
 * @param {number} ttl - Time to live in milliseconds (default: 24 hours)
 * @returns {Promise<boolean>} - Success status
 */
export const cacheTranslation = async (
  text,
  translation,
  targetLang,
  sourceLang = "en",
  ttl = 24 * 60 * 60 * 1000
) => {
  if (!text || !translation) {
    return false;
  }

  const key = getCacheKey(text, targetLang, sourceLang);

  // Try IndexedDB first
  if (db) {
    const success = await setInIndexedDB(key, translation, ttl);
    if (success) {
      return true;
    }
  }

  // Fallback to localStorage
  return setInLocalStorage(key, translation, ttl);
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = async () => {
  try {
    if (!db) {
      // Clear localStorage expired entries
      if (typeof window !== "undefined") {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith("translation_")) {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (data.expiresAt < Date.now()) {
                localStorage.removeItem(key);
              }
            } catch (e) {
              // Invalid entry, remove it
              localStorage.removeItem(key);
            }
          }
        }
      }
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const range = IDBKeyRange.upperBound(Date.now());
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.expiresAt < Date.now()) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (e) {
    // Ignore errors
  }
};

// Clear expired cache on initialization
clearExpiredCache();

