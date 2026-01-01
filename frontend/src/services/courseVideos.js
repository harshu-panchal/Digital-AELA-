import { apiRequest } from "./api/baseClient";

/**
 * Upload a video for a course
 * @param {string} courseId - The course ID
 * @param {File} videoFile - The video file to upload
 * @param {Object} videoData - Video metadata (title, description, order, isPreview)
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} - The uploaded video response
 */
export const uploadCourseVideo = async (courseId, videoFile, videoData, onProgress) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("title", videoData.title || "");
  formData.append("description", videoData.description || "");
  formData.append("order", videoData.order || 0);
  formData.append("isPreview", videoData.isPreview || false);

  const response = await apiRequest(`/courses/${courseId}/videos`, {
    method: "POST",
    body: formData,
    onUploadProgress: onProgress,
    // Note: Don't set Content-Type header - browser will set it with boundary
  });

  return response;
};

/**
 * Get all videos for a course
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} - Response with videos array and hasAccess flag
 */
export const getCourseVideos = async (courseId) => {
  const response = await apiRequest(`/courses/${courseId}/videos`, {
    method: "GET",
    // Authentication is required to check enrollment status
    // The backend uses optionalAuth middleware, so it will work with or without auth
    // but we need to send the token to check enrollment
  });
  return response;
};

/**
 * Get a single video
 * @param {string} videoId - The video ID
 * @returns {Promise<Object>} - Response with video object and hasAccess flag
 */
export const getVideo = async (videoId) => {
  const response = await apiRequest(`/videos/${videoId}`, {
    method: "GET",
  });
  return response;
};

/**
 * Update video details
 * @param {string} videoId - The video ID
 * @param {Object} videoData - Video data to update (title, description, order, isPreview)
 * @returns {Promise<Object>} - Updated video response
 */
export const updateVideo = async (videoId, videoData) => {
  const response = await apiRequest(`/videos/${videoId}`, {
    method: "PATCH",
    body: videoData,
  });
  return response;
};

/**
 * Delete a video
 * @param {string} videoId - The video ID
 * @returns {Promise<Object>} - Delete confirmation response
 */
export const deleteVideo = async (videoId) => {
  const response = await apiRequest(`/videos/${videoId}`, {
    method: "DELETE",
  });
  return response;
};

/**
 * Update video watch progress
 * @param {string} videoId - The video ID
 * @param {number} watchedDuration - Watched duration in seconds
 * @returns {Promise<Object>} - Progress update response
 */
export const updateVideoProgress = async (videoId, watchedDuration) => {
  const response = await apiRequest(`/videos/${videoId}/progress`, {
    method: "POST",
    body: { watchedDuration },
  });
  return response;
};

/**
 * Get video progress for current user
 * @param {string} videoId - The video ID
 * @returns {Promise<Object>} - Progress response
 */
export const getVideoProgress = async (videoId) => {
  const response = await apiRequest(`/videos/${videoId}/progress`, {
    method: "GET",
  });
  return response;
};

/**
 * Get course progress (all videos in a course)
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} - Course progress response with all videos and their progress
 */
export const getCourseProgress = async (courseId) => {
  const response = await apiRequest(`/courses/${courseId}/progress`, {
    method: "GET",
  });
  return response;
};

