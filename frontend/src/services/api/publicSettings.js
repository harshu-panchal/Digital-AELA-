/**
 * Public Settings API
 * These endpoints don't require authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";

/**
 * Get public settings (no authentication required)
 * GET /api/v1/public/settings?category=social
 */
export const fetchPublicSettings = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  const query = searchParams.toString();
  
  const response = await fetch(`${API_BASE_URL}/public/settings${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch public settings: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get social media links from public settings
 */
export const fetchSocialMediaLinks = async () => {
  try {
    const response = await fetchPublicSettings({ category: "social" });
    if (response?.settings?.social) {
      const socialSettings = response.settings.social;
      return {
        facebook: socialSettings.find((s) => s.key === "social.facebook")?.value || "",
        twitter: socialSettings.find((s) => s.key === "social.twitter")?.value || "",
        linkedin: socialSettings.find((s) => s.key === "social.linkedin")?.value || "",
        instagram: socialSettings.find((s) => s.key === "social.instagram")?.value || "",
        youtube: socialSettings.find((s) => s.key === "social.youtube")?.value || "",
      };
    }
    return {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
      youtube: "",
    };
  } catch (error) {
    console.error("Failed to fetch social media links:", error);
    // Return empty values on error
    return {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
      youtube: "",
    };
  }
};

