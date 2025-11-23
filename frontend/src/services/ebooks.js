/**
 * Ebook services for public access
 */

/**
 * Get all free ebooks (public access)
 */
import { API_BASE_URL } from "../config/api.js";

export const getFreeEbooks = async (page = 1, pageSize = 20) => {

  try {
    const response = await fetch(`${API_BASE_URL}/resources/ebooks/free?page=${page}&pageSize=${pageSize}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch free ebooks");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching free ebooks:", error);
    throw error;
  }
};

/**
 * Get a single ebook by ID (public access for free ebooks)
 */
export const getEbookById = async (ebookId) => {

  try {
    const response = await fetch(`${API_BASE_URL}/resources/ebooks/${ebookId}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch ebook");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching ebook:", error);
    throw error;
  }
};

/**
 * Get all public ebooks (with optional featured filter)
 */
export const getPublicEbooks = async (page = 1, pageSize = 20, featured = false) => {

  try {
    const featuredParam = featured ? "&featured=true" : "";
    const response = await fetch(`${API_BASE_URL}/resources/ebooks?page=${page}&pageSize=${pageSize}${featuredParam}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch ebooks");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching ebooks:", error);
    throw error;
  }
};

