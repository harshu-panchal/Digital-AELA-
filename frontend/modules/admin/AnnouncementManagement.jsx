import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlinePlus,
  HiOutlineMegaphone,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getAllAnnouncements,
  deleteAnnouncement,
  publishAnnouncement,
  getAnnouncementStats,
} from "../../src/services/api/announcements";

const AnnouncementManagement = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    targetAudience: "",
    priority: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadAnnouncements();
    loadStats();
  }, [filters.status, filters.targetAudience, filters.priority, filters.search, pagination.page]);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await getAllAnnouncements({
        ...filters,
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

  const loadStats = async () => {
    try {
      const response = await getAnnouncementStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      await deleteAnnouncement(announcementId);
      toast.success("Announcement deleted successfully");
      loadAnnouncements();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Failed to delete announcement");
    }
  };

  const handlePublish = async (announcementId) => {
    try {
      const response = await publishAnnouncement(announcementId);
      toast.success(`Announcement published to ${response.recipientsCount || 0} recipients`);
      loadAnnouncements();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Failed to publish announcement");
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

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "draft":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
      case "scheduled":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "archived":
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
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

  const getTargetAudienceLabel = (audience) => {
    const labels = {
      all_students: "All Students",
      all_teachers: "All Teachers",
      specific_course: "Specific Course",
      specific_courses: "Specific Courses",
      enrolled_students: "Enrolled Students",
    };
    return labels[audience] || audience;
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Announcement Management | Digital AELA" description="Manage all announcements" />

      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Announcement Management</h1>
            <p className="text-slate-400">Manage all platform announcements</p>
          </div>
          <Link
            to="/super-admin/announcements/create"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition flex items-center gap-2">
            <HiOutlinePlus className="h-5 w-5" />
            New Announcement
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Total</p>
              <p className="text-2xl font-semibold text-white">{stats.total || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Draft</p>
              <p className="text-2xl font-semibold text-slate-400">{stats.draft || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Published</p>
              <p className="text-2xl font-semibold text-emerald-400">{stats.published || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Scheduled</p>
              <p className="text-2xl font-semibold text-blue-400">{stats.scheduled || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Archived</p>
              <p className="text-2xl font-semibold text-gray-400">{stats.archived || 0}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Search announcements..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <select
              value={filters.targetAudience}
              onChange={(e) => {
                setFilters({ ...filters, targetAudience: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Audiences</option>
              <option value="all_students">All Students</option>
              <option value="all_teachers">All Teachers</option>
              <option value="specific_course">Specific Course</option>
              <option value="specific_courses">Specific Courses</option>
              <option value="enrolled_students">Enrolled Students</option>
            </select>
          </div>
          <div>
            <select
              value={filters.priority}
              onChange={(e) => {
                setFilters({ ...filters, priority: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <HiOutlineMegaphone className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No announcements found</p>
            <Link
              to="/super-admin/announcements/create"
              className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition">
              Create Your First Announcement
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <motion.div
                key={announcement._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold text-white">{announcement.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          announcement.status
                        )}`}>
                        {announcement.status}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                          announcement.priority
                        )}`}>
                        {announcement.priority}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/40 bg-purple-500/20 text-purple-300">
                        {getTargetAudienceLabel(announcement.targetAudience)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3 line-clamp-2">{announcement.content}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>By: {announcement.createdBy?.fullName || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiOutlineClock className="h-4 w-4" />
                        <span>
                          {announcement.publishedAt
                            ? `Published: ${formatDate(announcement.publishedAt)}`
                            : `Created: ${formatDate(announcement.createdAt)}`}
                        </span>
                      </div>
                      {announcement.targetCourses && announcement.targetCourses.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span>
                            {announcement.targetCourses.length} course
                            {announcement.targetCourses.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {announcement.readBy && announcement.readBy.length > 0 && (
                        <div className="flex items-center gap-2">
                          <HiOutlineCheckCircle className="h-4 w-4" />
                          <span>{announcement.readBy.length} read</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    <Link
                      to={`/super-admin/announcements/${announcement._id}`}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-[#111] text-white text-sm font-semibold hover:bg-white/5 transition">
                      View
                    </Link>
                    {announcement.status === "draft" && (
                      <button
                        onClick={() => handlePublish(announcement._id)}
                        className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition">
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(announcement._id)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition">
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
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

export default AnnouncementManagement;

