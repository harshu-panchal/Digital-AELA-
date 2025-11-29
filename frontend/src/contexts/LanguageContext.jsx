/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { normalizeLanguageCode, denormalizeLanguageCode } from "../utils/languageUtils";

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

  // Update document direction and language for RTL / LTR layouts
  useEffect(() => {
    const normalizedLang = normalizeLanguageCode(language);
    
    if (typeof document !== "undefined") {
      const rtlLanguages = ["ar", "ur", "ps"];
      const isRtl = rtlLanguages.includes(normalizedLang);

      document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", normalizedLang || "en");
    }

    // Set isChangingLanguage flag (can be used by components to show loading states)
    setIsChangingLanguage(true);
    // Small delay to allow components to react to language change
    const timer = setTimeout(() => {
      setIsChangingLanguage(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [language]);

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem("selectedLanguage", language);
    
    // Log language state for debugging
    if (import.meta.env.PROD) {
      console.log("[LanguageContext] Language state updated:", {
        language,
        normalized: normalizeLanguageCode(language),
        storedInLocalStorage: localStorage.getItem("selectedLanguage"),
        timestamp: new Date().toISOString(),
      });
    }
  }, [language]);

  const changeLanguage = useCallback(async (langCode) => {
    if (!Object.prototype.hasOwnProperty.call(languages, langCode)) {
      // eslint-disable-next-line no-console
      console.warn(`[LanguageContext] Invalid language code: ${langCode}`);
      return;
    }

    // Log language change for debugging
    if (import.meta.env.PROD) {
      console.log("[LanguageContext] Language change requested:", {
        from: language,
        to: langCode,
        timestamp: new Date().toISOString(),
      });
    }

    setIsChangingLanguage(true);
    setLanguage(langCode);
  }, [languages, language]);

  const value = {
    language,
    languages,
    changeLanguage,
    isChangingLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

