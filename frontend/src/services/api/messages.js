import { apiRequest } from "./baseClient";

/**
 * Get all conversations for the authenticated user
 */
export const fetchConversations = () =>
  apiRequest("/messages/conversations");

/**
 * Get messages between authenticated user and another user
 */
export const fetchMessages = (recipientId) =>
  apiRequest(`/messages/${recipientId}`);

/**
 * Send a message
 */
export const sendMessageAPI = (payload) =>
  apiRequest("/messages", {
    method: "POST",
    body: payload,
  });

/**
 * Mark messages as read
 */
export const markMessagesAsRead = (recipientId) =>
  apiRequest(`/messages/${recipientId}/read`, {
    method: "PATCH",
  });

