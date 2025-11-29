import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { normalizeLanguageCode } from "../utils/languageUtils";

const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  author = "Digital AELA",
  siteName = "Digital AELA",
}) => {
  const location = useLocation();
  const { language } = useLanguage();
  const baseUrl = "https://digitalaela.com"; // Update with your actual domain
  const fullUrl = url || `${baseUrl}${location.pathname}`;
  const defaultImage = `${baseUrl}/og-image.jpg`; // Update with your actual OG image

  const normalizedLang = normalizeLanguageCode(language);
  const ogLocaleMap = {
    en: "en_US",
    hi: "hi_IN",
    ur: "ur_PK",
    bn: "bn_BD",
    ne: "ne_NP",
    si: "si_LK",
    ps: "ps_AF",
    ar: "ar_SA",
  };
  const ogLocale = ogLocaleMap[normalizedLang] || "en_US";
  const languageLabelMap = {
    en: "English",
    hi: "Hindi",
    ur: "Urdu",
    bn: "Bangla",
    ne: "Nepali",
    si: "Sinhala",
    ps: "Pashto",
    ar: "Arabic",
  };
  const languageLabel = languageLabelMap[normalizedLang] || "English";

  useEffect(() => {
    // Update title
    document.title = title
      ? `${title} | Digital AELA - Learn English & Skills Online`
      : "Digital AELA - Learn English & Skills Online | Online Courses India Pakistan Bangladesh Nepal";

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    // Basic meta tags
    if (description) {
      updateMetaTag("description", description);
    }
    if (keywords) {
      updateMetaTag("keywords", keywords);
    }
    updateMetaTag("author", author);

    // Open Graph tags
    updateMetaTag("og:title", title || "Digital AELA - Learn English & Skills Online", true);
    updateMetaTag("og:description", description || "Learn English, Digital Marketing, and Career Skills with Digital AELA. Online courses for India, Pakistan, Bangladesh, Nepal, and Gulf countries.", true);
    updateMetaTag("og:image", image || defaultImage, true);
    updateMetaTag("og:url", fullUrl, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:site_name", siteName, true);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title || "Digital AELA - Learn English & Skills Online");
    updateMetaTag("twitter:description", description || "Learn English, Digital Marketing, and Career Skills with Digital AELA.");
    updateMetaTag("twitter:image", image || defaultImage);

    // Canonical URL
    let canonicalLink = document.querySelector("link[rel='canonical']");
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", fullUrl);

    // Language tag
    updateMetaTag("og:locale", ogLocale, true);
    updateMetaTag("language", languageLabel);
  }, [
    title,
    description,
    keywords,
    image,
    url,
    type,
    author,
    siteName,
    fullUrl,
    defaultImage,
    location.pathname,
    ogLocale,
    languageLabel,
  ]);

  return null;
};

export default SEO;

