import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { createDoubtTicket } from "../../src/services/api/doubtTickets";
import { fetchPublishedCourses } from "../../src/services/api/courses";

const DoubtTicketCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    course: "",
    lesson: "",
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetchPublishedCourses({ limit: 100 });
      setCourses(response.courses || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
      };

      if (formData.course) {
        payload.course = formData.course;
      }
      if (formData.lesson) {
        payload.lesson = formData.lesson;
      }

      await createDoubtTicket(payload);
      toast.success("Doubt ticket created successfully");
      navigate("/student/doubt-tickets");
    } catch (error) {
      toast.error(error.message || "Failed to create doubt ticket");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Create Doubt Ticket | Digital AELA" description="Create a new doubt ticket" />

      <div className="space-y-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/student/doubt-tickets")}
            className="p-2 rounded-lg border border-white/10 bg-[#111] hover:bg-white/5 transition">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold mb-2">Create Doubt Ticket</h1>
            <p className="text-slate-400">Ask a question and get help from teachers</p>
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
                placeholder="Enter a brief title for your question"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                placeholder="Describe your question or doubt in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  <option value="course_content">Course Content</option>
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                  <option value="technical">Technical</option>
                  <option value="payment">Payment</option>
                  <option value="certificate">Certificate</option>
                  <option value="general">General</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Related Course (Optional)
              </label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                <option value="">Select a course (optional)</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/student/doubt-tickets")}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoubtTicketCreate;

