/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to English
    return localStorage.getItem("selectedLanguage") || "en";
  });

  const languages = {
    en: "English",
    hi: "Hindi",
    ne: "Nepali",
    pa: "Punjabi",
    si: "Sinhala",
    te: "Telugu",
    ta: "Tamil",
  };

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem("selectedLanguage", language);
  }, [language]);

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
  };

  const value = {
    language,
    languages,
    changeLanguage,
    t: (key, fallback = key) => {
      // Simple translation function - can be expanded with actual translation files
      // For now, returns the fallback (English text)
      return fallback;
    },
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

