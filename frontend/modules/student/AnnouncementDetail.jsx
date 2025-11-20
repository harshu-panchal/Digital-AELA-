import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineMegaphone } from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getAnnouncementDetails, markAnnouncementAsRead } from "../../src/services/api/announcements";

const StudentAnnouncementDetail = () => {
  const { announcementId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnnouncement();
  }, [announcementId]);

  const loadAnnouncement = async () => {
    setIsLoading(true);
    try {
      const response = await getAnnouncementDetails(announcementId);
      setAnnouncement(response.announcement);
      // Mark as read when viewing
      try {
        await markAnnouncementAsRead(announcementId);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load announcement");
      navigate("/student/announcements");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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

  if (isLoading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <p className="text-slate-400">Loading announcement...</p>
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <div className="min-h-screen text-white">
      <SEO title={`${announcement.title} | Digital AELA`} description="View announcement details" />

      <div className="space-y-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/student/announcements")}
            className="p-2 rounded-lg border border-white/10 bg-[#111] hover:bg-white/5 transition">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-semibold">{announcement.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                  announcement.priority
                )}`}>
                {announcement.priority}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <HiOutlineClock className="h-4 w-4" />
                <span>
                  {announcement.publishedAt
                    ? `Published: ${formatDate(announcement.publishedAt)}`
                    : `Created: ${formatDate(announcement.createdAt)}`}
                </span>
              </div>
              {announcement.createdBy && (
                <div className="flex items-center gap-2">
                  <span>By: {announcement.createdBy.fullName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Content</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{announcement.content}</p>
        </div>

        {announcement.targetCourses && announcement.targetCourses.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Related Courses</h2>
            <div className="flex flex-wrap gap-2">
              {announcement.targetCourses.map((course) => (
                <span
                  key={course._id || course}
                  className="px-3 py-1 rounded-full text-sm border border-purple-500/40 bg-purple-500/20 text-purple-300">
                  {course.title || course}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncementDetail;

