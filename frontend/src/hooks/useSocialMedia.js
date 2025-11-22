import { useState, useEffect } from "react";
import { fetchSocialMediaLinks } from "../services/api/publicSettings";

/**
 * Custom hook to fetch and provide social media links
 * Caches the result to avoid multiple API calls
 */
let cachedSocialLinks = null;
let cacheTimestamp = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (reduced for faster updates)

// Function to clear cache (can be called after admin updates)
export const clearSocialMediaCache = () => {
  cachedSocialLinks = null;
  cacheTimestamp = null;
};

export const useSocialMedia = () => {
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSocialLinks = async () => {
      // Check cache first
      if (cachedSocialLinks && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setSocialLinks(cachedSocialLinks);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const links = await fetchSocialMediaLinks();
        cachedSocialLinks = links;
        cacheTimestamp = Date.now();
        setSocialLinks(links);
      } catch (error) {
        console.error("Failed to load social media links:", error);
        // Keep default empty values on error
      } finally {
        setLoading(false);
      }
    };

    loadSocialLinks();
    
    // Listen for storage events to clear cache when settings are updated
    const handleStorageChange = () => {
      clearSocialMediaCache();
      loadSocialLinks();
    };
    
    // Listen for custom event that can be dispatched after settings update
    window.addEventListener('socialSettingsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('socialSettingsUpdated', handleStorageChange);
    };
  }, []);

  // Function to refresh social links (useful after admin updates)
  const refreshSocialLinks = async () => {
    try {
      setLoading(true);
      const links = await fetchSocialMediaLinks();
      cachedSocialLinks = links;
      cacheTimestamp = Date.now();
      setSocialLinks(links);
    } catch (error) {
      console.error("Failed to refresh social media links:", error);
    } finally {
      setLoading(false);
    }
  };

  return { socialLinks, loading, refreshSocialLinks };
};

