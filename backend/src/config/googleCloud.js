import { v2 } from "@google-cloud/translate";
const { Translate } = v2;
import dotenv from "dotenv";

dotenv.config();

// Initialize Google Cloud Translate client
let translateClient = null;

const initializeTranslateClient = () => {
  if (translateClient) {
    return translateClient;
  }

  const credentialsPath = process.env.GOOGLE_CLOUD_CREDENTIALS_PATH;
  let apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  // Trim and validate API key if provided
  if (apiKey) {
    apiKey = apiKey.trim();
    // Remove quotes if present
    if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
      apiKey = apiKey.slice(1, -1);
    }
  }

  if (!apiKey && !credentialsPath) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Google Cloud] No credentials found. Translation will not work. Set GOOGLE_CLOUD_TRANSLATE_API_KEY or GOOGLE_CLOUD_CREDENTIALS_PATH"
    );
    return null;
  }

  try {
    if (credentialsPath) {
      // Use service account credentials file (requires projectId)
      if (!projectId) {
        // eslint-disable-next-line no-console
        console.warn(
          "[Google Cloud] Project ID is required when using credentials file. Set GOOGLE_CLOUD_PROJECT_ID"
        );
        return null;
      }
      translateClient = new Translate({
        projectId: projectId,
        keyFilename: credentialsPath,
      });
    } else if (apiKey) {
      // Use API key authentication
      // Note: The v2 Translate client doesn't directly support API keys in constructor
      // We'll create a client and store the API key to use in REST API calls
      const config = {};
      if (projectId) {
        config.projectId = projectId;
      }
      
      // Create client (will use REST API with API key for actual translation)
      translateClient = new Translate(config);
      
      // Store API key for use in translate calls via REST API
      translateClient._apiKey = apiKey;
      translateClient._useApiKey = true;
    }

    // eslint-disable-next-line no-console
    console.log("[Google Cloud] Translate client initialized successfully");
    return translateClient;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Google Cloud] Failed to initialize Translate client:", error.message);
    return null;
  }
};

// Language code mapping - convert frontend language codes to Google Cloud format
export const languageCodeMap = {
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

export const normalizeLanguageCode = (langCode) => {
  return languageCodeMap[langCode] || langCode?.split("-")[0] || "en";
};

export const getTranslateClient = () => {
  if (!translateClient) {
    translateClient = initializeTranslateClient();
  }
  return translateClient;
};

export default getTranslateClient;

