import pkg from "@google-cloud/translate";
const { Translate } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Initialize Google Cloud Translate client
let translateClient = null;

const initializeTranslateClient = () => {
  if (translateClient) {
    return translateClient;
  }

  const credentialsPath = process.env.GOOGLE_CLOUD_CREDENTIALS_PATH;
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (!apiKey && !credentialsPath) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Google Cloud] No credentials found. Translation will not work. Set GOOGLE_CLOUD_TRANSLATE_API_KEY or GOOGLE_CLOUD_CREDENTIALS_PATH"
    );
    return null;
  }

  try {
    if (credentialsPath) {
      // Use service account credentials file
      translateClient = new Translate({
        projectId: projectId,
        keyFilename: credentialsPath,
      });
    } else if (apiKey) {
      // Use API key (simpler setup)
      translateClient = new Translate({
        projectId: projectId,
        key: apiKey,
      });
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

