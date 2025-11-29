import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { FaBell, FaCheck, FaTrash, FaArrowLeft } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSocket } from "../../../src/hooks/useSocket";
import TranslatedText from "../../../src/components/TranslatedText";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
} from "../../../src/services/api/notifications";
import { toast } from "react-toastify";

const NotificationCenter = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const loadNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (filter === "unread") {
        params.unreadOnly = true;
      } else if (filter === "read") {
        params.isRead = true;
      }

      const response = await fetchNotifications(params);
      setNotifications(response.notifications || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error("Failed to load notifications");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id, pagination.page, filter]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) return;

    const handleNewNotification = (notificationData) => {
      setNotifications((prev) => [notificationData, ...prev]);
    };

    const handleNotificationRead = (data) => {
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === data.notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      );
    };

    const handleAllNotificationsRead = () => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
    };

    const handleNotificationDeleted = (data) => {
      setNotifications((prev) =>
        prev.filter((n) => (n._id || n.id) !== data.notificationId)
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

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      );
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((n) => (n._id || n.id) !== notificationId)
      );
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAllRead = async () => {
    try {
      await clearAllRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success("All read notifications cleared");
    } catch (error) {
      toast.error("Failed to clear read notifications");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id || notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title="Notifications | Digital AELA"
        description="View and manage your notifications"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/learn-earn/dashboard"
              className="p-2 rounded-lg hover:bg-white/10 transition">
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white"><TranslatedText>Notifications</TranslatedText></h1>
              <p className="text-sm text-gray-400 mt-1">
                {unreadCount} <TranslatedText>unread</TranslatedText> · {readCount} <TranslatedText>read</TranslatedText>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition text-sm font-semibold">
                <TranslatedText>Mark all read</TranslatedText>
              </button>
            )}
            {readCount > 0 && (
              <button
                onClick={handleClearAllRead}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition text-sm font-semibold">
                <TranslatedText>Clear read</TranslatedText>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === "all"
                ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}>
            <TranslatedText>All</TranslatedText>
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === "unread"
                ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}>
            <TranslatedText>Unread</TranslatedText> ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === "read"
                ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}>
            <TranslatedText>Read</TranslatedText> ({readCount})
          </button>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400"><TranslatedText>Loading...</TranslatedText></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <FaBell className="h-16 w-16 mx-auto mb-4 opacity-30 text-gray-500" />
            <p className="text-gray-400"><TranslatedText>No notifications found</TranslatedText></p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {notifications.map((notification) => {
              const notificationId = notification._id || notification.id;
              const isUnread = !notification.isRead;

              return (
                <Motion.div
                  key={notificationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border ${
                    isUnread
                      ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                      : "border-white/5 bg-[#0f0f0f]"
                  } p-4 cursor-pointer hover:bg-white/5 transition`}
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
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notificationId);
                              }}
                              className="p-1.5 rounded hover:bg-white/10 transition"
                              title="Mark as read">
                              <FaCheck className="h-3 w-3 text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notificationId);
                            }}
                            className="p-1.5 rounded hover:bg-white/10 transition"
                            title="Delete">
                            <FaTrash className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition">
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages, prev.page + 1),
                }))
              }
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition">
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationCenter;

