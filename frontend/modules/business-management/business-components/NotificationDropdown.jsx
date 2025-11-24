import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaTimes, FaCheck, FaTrash } from "react-icons/fa";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSocket } from "../../../src/hooks/useSocket";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
} from "../../../src/services/api/notifications";
import { toast } from "react-toastify";

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetchNotifications({
        page: pagination.page,
        pageSize: pagination.pageSize,
        unreadOnly: false,
      });
      setNotifications(response.notifications || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const response = await fetchUnreadCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load unread count:", error);
    }
  };

  // Load data when dropdown opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen, user?.id]);

  // Listen for new notifications via socket
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) return;

    const handleNewNotification = (notificationData) => {
      setNotifications((prev) => [notificationData, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotificationRead = (data) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      );
    };

    const handleAllNotificationsRead = () => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    };

    const handleNotificationDeleted = (data) => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== data.notificationId)
      );
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("notification_read", handleNotificationRead);
    socket.on("all_notifications_read", handleAllNotificationsRead);
    socket.on("notification_deleted", handleNotificationDeleted);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("notification_read", handleNotificationRead);
      socket.off("all_notifications_read", handleAllNotificationsRead);
      socket.off("notification_deleted", handleNotificationDeleted);
    };
  }, [socket, isConnected, user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId || n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((n) => (n._id || n.id) !== notificationId)
      );
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAllRead = async (e) => {
    e.stopPropagation();
    try {
      await clearAllRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success("All read notifications cleared");
    } catch (error) {
      toast.error("Failed to clear read notifications");
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id || notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            (n._id || n.id) === (notification._id || notification.id)
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        // Continue even if marking as read fails
      }
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "message":
        return "💬";
      case "approval":
        return "✅";
      case "payment":
        return "💳";
      case "certificate":
        return "🎓";
      case "live_room":
        return "🎤";
      case "assignment":
        return "📝";
      case "quiz":
        return "📊";
      case "video":
        return "🎥";
      case "job_post":
        return "💼";
      case "announcement":
        return "📢";
      default:
        return "🔔";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-2 w-[90vw] max-w-md rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-2xl z-50 sm:w-96"
          style={{ maxHeight: "80vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#D4AF37] hover:text-[#E5C158] transition">
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 transition">
                <FaTimes className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 140px)" }}>
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FaBell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => {
                  const notificationId = notification._id || notification.id;
                  const isUnread = !notification.isRead;
                  
                  return (
                    <motion.div
                      key={notificationId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-white/5 transition cursor-pointer ${
                        isUnread ? "bg-[#D4AF37]/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getTypeIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-sm font-semibold ${
                                isUnread ? "text-white" : "text-gray-300"
                              }`}>
                              {notification.title}
                            </h4>
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-[#D4AF37] flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          {notification.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {notification.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notificationId, e)}
                                  className="p-1.5 rounded hover:bg-white/10 transition"
                                  title="Mark as read">
                                  <FaCheck className="h-3 w-3 text-gray-400" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(notificationId, e)}
                                className="p-1.5 rounded hover:bg-white/10 transition"
                                title="Delete">
                                <FaTrash className="h-3 w-3 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 p-3 flex items-center justify-end">
              <button
                onClick={handleClearAllRead}
                className="text-xs text-gray-400 hover:text-[#D4AF37] transition">
                Clear all read
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;

