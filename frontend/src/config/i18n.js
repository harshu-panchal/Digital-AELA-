import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// Language code mapping - convert from frontend codes to i18next format
const languageCodeMap = {
  "en": "en",
  "hi-IN": "hi",
  "ur-PK": "ur",
  "bn-BD": "bn",
  "ne-NP": "ne",
  "si-LK": "si",
  "ps-AF": "ps",
  "ar-SA": "ar",
  "ar-KW": "ar",
  "ar-AE": "ar",
};

// Get language from localStorage or browser
const getStoredLanguage = () => {
  if (typeof window === "undefined") return "en";
  
  try {
    const stored = localStorage.getItem("selectedLanguage");
    if (stored && languageCodeMap[stored]) {
      return languageCodeMap[stored];
    }
  } catch (e) {
    // Ignore storage errors
  }
  
  return "en";
};

i18n
  // Load translation files using HTTP backend
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language
    fallbackLng: "en",
    
    // Default namespace
    defaultNS: "common",
    
    // Supported languages
    supportedLngs: ["en", "hi", "ur", "bn", "ne", "si", "ps", "ar"],
    
    // Set initial language
    lng: getStoredLanguage(),
    
    // Debug mode (disable in production)
    debug: false,
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Backend configuration for loading translation files
    backend: {
      // Path to translation files
      loadPath: "/locales/{{lng}}/{{ns}}.json",
      
      // Allow loading from public directory
      allowMultiLoading: true,
      
      // Request options
      requestOptions: {
        cache: "default",
      },
      
      // Custom load path function for better organization
      parse: (data) => JSON.parse(data),
      
      // Reload interval (0 = disable auto reload)
      reloadInterval: false,
    },
    
    // Language detector options
    detection: {
      // Order of detection methods
      order: ["localStorage", "navigator"],
      
      // Keys to look for in localStorage
      lookupLocalStorage: "selectedLanguage",
      
      // Cache user language
      caches: ["localStorage"],
      
      // Don't set cookie
      cookieMinutes: 10080, // 7 days
      
      // Convert language codes
      convertDetectedLanguage: (lng) => {
        // Check if it's one of our frontend language codes
        for (const [frontendCode, i18nextCode] of Object.entries(languageCodeMap)) {
          if (lng.startsWith(frontendCode.split("-")[0])) {
            return i18nextCode;
          }
        }
        return "en";
      },
    },
    
    // React i18next options
    react: {
      useSuspense: true, // Use Suspense for loading translations
    },
    
    // Namespace options
    ns: ["common"], // Default namespaces to load
    defaultNS: "common",
    
    // Load translation files on demand (lazy loading)
    load: "languageOnly", // Only load language, not locale (e.g., "en" not "en-US")
    
    // Partial bundle support
    partialBundledLanguages: true,
    
    // Clean code (remove language from fallback)
    cleanCode: true,
    
    // Non-explicit supported languages fallback
    nonExplicitSupportedLngs: true,
  });

// Export helper function to convert frontend language code to i18next code
export const normalizeLanguageCode = (langCode) => {
  return languageCodeMap[langCode] || langCode?.split("-")[0] || "en";
};

// Export helper function to convert i18next code to frontend code
export const denormalizeLanguageCode = (i18nextCode) => {
  for (const [frontendCode, code] of Object.entries(languageCodeMap)) {
    if (code === i18nextCode) {
      return frontendCode;
    }
  }
  return "en";
};

export default i18n;

