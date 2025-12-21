import { API_BASE_URL } from "../../config/api.js";
import { apiRequest } from "./baseClient";

/**
 * Fetch all course categories
 * @returns {Promise<Array>} Categories array
 */
export const fetchCategories = async () => {
    try {
        const data = await apiRequest("/categories");
        return data.success ? data.data : [];
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
};

/**
 * Fetch a single category by slug
 * @param {string} slug Category slug
 * @returns {Promise<Object>} Category object
 */
export const fetchCategoryBySlug = async (slug) => {
    try {
        const data = await apiRequest(`/categories/${slug}`);
        return data.success ? data.data : null;
    } catch (error) {
        console.error(`Failed to fetch category with slug ${slug}:`, error);
        return null;
    }
};

/**
 * Create a new category (Admin only)
 * @param {Object} categoryData Category data
 * @returns {Promise<Object>} Created category
 */
export const createCategory = async (categoryData) => {
    return apiRequest(`/categories`, {
        method: "POST",
        body: JSON.stringify(categoryData),
    });
};

/**
 * Update an existing category (Admin only)
 * @param {string} id Category ID
 * @param {Object} categoryData Updated data
 * @returns {Promise<Object>} Updated category
 */
export const updateCategory = async (id, categoryData) => {
    return apiRequest(`/categories/id/${id}`, {
        method: "PUT",
        body: JSON.stringify(categoryData),
    });
};

/**
 * Delete a category (Admin only)
 * @param {string} id Category ID
 * @returns {Promise<Object>} Result
 */
export const deleteCategory = async (id) => {
    return apiRequest(`/categories/id/${id}`, {
        method: "DELETE",
    });
};
