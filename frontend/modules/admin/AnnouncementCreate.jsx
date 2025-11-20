import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { createAnnouncement } from "../../src/services/api/announcements";
import { fetchPublishedCourses } from "../../src/services/api/courses";

const AdminAnnouncementCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetAudience: "all_students",
    targetCourses: [],
    priority: "normal",
    status: "draft",
    scheduledAt: "",
    expiresAt: "",
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetchPublishedCourses();
      setCourses(response.courses || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        targetAudience: formData.targetAudience,
        priority: formData.priority,
        status: formData.status,
      };

      if (formData.targetAudience === "specific_course" || formData.targetAudience === "specific_courses") {
        if (formData.targetCourses.length === 0) {
          toast.error("Please select at least one course");
          setIsLoading(false);
          return;
        }
        payload.targetCourses = formData.targetCourses;
      }

      if (formData.scheduledAt) {
        payload.scheduledAt = formData.scheduledAt;
        payload.status = "scheduled";
      }

      if (formData.expiresAt) {
        payload.expiresAt = formData.expiresAt;
      }

      await createAnnouncement(payload);
      toast.success("Announcement created successfully");
      navigate("/super-admin/announcements");
    } catch (error) {
      toast.error(error.message || "Failed to create announcement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseToggle = (courseId) => {
    setFormData((prev) => ({
      ...prev,
      targetCourses: prev.targetCourses.includes(courseId)
        ? prev.targetCourses.filter((id) => id !== courseId)
        : [...prev.targetCourses, courseId],
    }));
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Create Announcement | Digital AELA" description="Create a new announcement" />

      <div className="space-y-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/super-admin/announcements")}
            className="p-2 rounded-lg border border-white/10 bg-[#111] hover:bg-white/5 transition">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold mb-2">Create Announcement</h1>
            <p className="text-slate-400">Send announcements to students and teachers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none"
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Content <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                placeholder="Enter announcement content..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value, targetCourses: [] })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  <option value="all_students">All Students</option>
                  <option value="all_teachers">All Teachers</option>
                  <option value="enrolled_students">Enrolled Students</option>
                  <option value="specific_course">Specific Course</option>
                  <option value="specific_courses">Specific Courses</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {(formData.targetAudience === "specific_course" || formData.targetAudience === "specific_courses") && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Courses</label>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#111] p-4 space-y-2">
                  {courses.length === 0 ? (
                    <p className="text-sm text-slate-400">No courses available</p>
                  ) : (
                    courses.map((course) => (
                      <label
                        key={course._id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.targetCourses.includes(course._id)}
                          onChange={() => handleCourseToggle(course._id)}
                          className="w-4 h-4 rounded border-white/20 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                        <span className="text-sm text-white">{course.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/super-admin/announcements")}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? "Creating..." : "Create Announcement"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAnnouncementCreate;

