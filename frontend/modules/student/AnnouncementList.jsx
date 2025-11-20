import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineMegaphone,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getStudentAnnouncements,
  markAnnouncementAsRead,
  getAnnouncementDetails,
} from "../../src/services/api/announcements";

const StudentAnnouncementList = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadAnnouncements();
  }, [pagination.page]);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await getStudentAnnouncements({
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setAnnouncements(response.announcements || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load announcements");
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (announcementId) => {
    try {
      await markAnnouncementAsRead(announcementId);
      // Update local state
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann._id === announcementId ? { ...ann, isRead: true } : ann
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "normal":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Announcements | Digital AELA" description="View platform announcements" />

      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Announcements</h1>
          <p className="text-slate-400">Stay updated with platform announcements</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <HiOutlineMegaphone className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No announcements available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Link
                key={announcement._id}
                to={`/student/announcements/${announcement._id}`}
                onClick={() => {
                  if (!announcement.isRead) {
                    handleMarkAsRead(announcement._id);
                  }
                }}
                className="block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border border-white/10 bg-[#060A17]/90 p-6 hover:bg-[#060A17] transition ${
                    !announcement.isRead ? "border-[#D4AF37]/40 bg-[#D4AF37]/5" : ""
                  }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-semibold text-white">{announcement.title}</h3>
                        {!announcement.isRead && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                            New
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                            announcement.priority
                          )}`}>
                          {announcement.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-3 line-clamp-2">{announcement.content}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <HiOutlineClock className="h-4 w-4" />
                          <span>
                            {announcement.publishedAt
                              ? formatDate(announcement.publishedAt)
                              : formatDate(announcement.createdAt)}
                          </span>
                        </div>
                        {announcement.createdBy && (
                          <div className="flex items-center gap-2">
                            <span>By: {announcement.createdBy.fullName}</span>
                          </div>
                        )}
                        {announcement.targetCourses && announcement.targetCourses.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span>
                              {announcement.targetCourses.length} course
                              {announcement.targetCourses.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!announcement.isRead && (
                      <div className="ml-6">
                        <div className="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncementList;

