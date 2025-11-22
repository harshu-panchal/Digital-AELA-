/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import i18n, { normalizeLanguageCode, denormalizeLanguageCode } from "../config/i18n.js";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {

  const languages = {
    en: {
      label: "English",
      country: "Global",
      flag: "🇬🇧",
      flagSrc: "https://flagcdn.com/w40/gb.png",
      flagAlt: "United Kingdom flag",
    },
    "hi-IN": {
      label: "Hindi",
      country: "India",
      flag: "🇮🇳",
      flagSrc: "https://flagcdn.com/w40/in.png",
      flagAlt: "India flag",
    },
    "ur-PK": {
      label: "Urdu",
      country: "Pakistan",
      flag: "🇵🇰",
      flagSrc: "https://flagcdn.com/w40/pk.png",
      flagAlt: "Pakistan flag",
    },
    "bn-BD": {
      label: "Bangla",
      country: "Bangladesh",
      flag: "🇧🇩",
      flagSrc: "https://flagcdn.com/w40/bd.png",
      flagAlt: "Bangladesh flag",
    },
    "ne-NP": {
      label: "Nepali",
      country: "Nepal",
      flag: "🇳🇵",
      flagSrc: "https://flagcdn.com/w40/np.png",
      flagAlt: "Nepal flag",
    },
    "si-LK": {
      label: "Sinhala",
      country: "Sri Lanka",
      flag: "🇱🇰",
      flagSrc: "https://flagcdn.com/w40/lk.png",
      flagAlt: "Sri Lanka flag",
    },
    "ps-AF": {
      label: "Pashto",
      country: "Afghanistan",
      flag: "🇦🇫",
      flagSrc: "https://flagcdn.com/w40/af.png",
      flagAlt: "Afghanistan flag",
    },
    "ar-SA": {
      label: "Arabic",
      country: "Saudi Arabia",
      flag: "🇸🇦",
      flagSrc: "https://flagcdn.com/w40/sa.png",
      flagAlt: "Saudi Arabia flag",
    },
    "ar-KW": {
      label: "Arabic",
      country: "Kuwait",
      flag: "🇰🇼",
      flagSrc: "https://flagcdn.com/w40/kw.png",
      flagAlt: "Kuwait flag",
    },
    "ar-AE": {
      label: "Arabic",
      country: "United Arab Emirates",
      flag: "🇦🇪",
      flagSrc: "https://flagcdn.com/w40/ae.png",
      flagAlt: "United Arab Emirates flag",
    },
  };

  const getInitialLanguage = () => {
    const stored = localStorage.getItem("selectedLanguage");
    if (stored && Object.prototype.hasOwnProperty.call(languages, stored)) {
      return stored;
    }
    return "en";
  };

  const [language, setLanguage] = useState(getInitialLanguage);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Sync language with i18next
  useEffect(() => {
    const normalizedLang = normalizeLanguageCode(language);
    if (i18n.language !== normalizedLang) {
      setIsChangingLanguage(true);
      i18n.changeLanguage(normalizedLang).then(() => {
        setIsChangingLanguage(false);
      });
    } else {
      setIsChangingLanguage(false);
    }
  }, [language]);

  // Update language state when i18next language changes
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      const frontendLang = denormalizeLanguageCode(lng);
      if (frontendLang !== language && Object.prototype.hasOwnProperty.call(languages, frontendLang)) {
        setLanguage(frontendLang);
      }
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [language, languages]);

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem("selectedLanguage", language);
  }, [language]);

  const changeLanguage = useCallback(async (langCode) => {
    if (!Object.prototype.hasOwnProperty.call(languages, langCode)) {
      // eslint-disable-next-line no-console
      console.warn(`[LanguageContext] Invalid language code: ${langCode}`);
      return;
    }

    setIsChangingLanguage(true);
    setLanguage(langCode);

    // i18next language change is handled in useEffect
  }, [languages]);

  // Translation function that uses i18next
  const t = useCallback((key, options = {}) => {
    if (!i18n.isInitialized) {
      return options.defaultValue || key;
    }

    // Use i18next's t function directly
    return i18n.t(key, options);
  }, []);

  const value = {
    language,
    languages,
    changeLanguage,
    t,
    isChangingLanguage,
    i18nReady: i18n.isInitialized,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

