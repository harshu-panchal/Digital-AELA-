import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineDocumentText } from "react-icons/hi2";
import SEO from "../../../src/components/SEO";
import { useAuth } from "../../../src/contexts/AuthContext";
import { createAssignment } from "../../../src/services/api/assignments";
import { getTeacherCourses } from "../../../src/services/teacherCourses";

const AdminAssignmentCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: "",
    maxMarks: 100,
    instructions: "",
    allowLateSubmission: false,
    latePenalty: 0,
    status: "published",
  });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        // For super-admin, this will return all courses
        const coursesData = await getTeacherCourses();
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (error) {
        console.error("Failed to load courses:", error);
        toast.error("Failed to load courses");
      }
    };
    loadCourses();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Assignment title is required");
      return;
    }

    if (!formData.courseId) {
      toast.error("Please select a course");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Due date is required");
      return;
    }

    if (formData.maxMarks < 0) {
      toast.error("Maximum marks must be a positive number");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAssignment(formData);
      toast.success("Assignment created successfully!");
      navigate("/super-admin/assignments");
    } catch (error) {
      toast.error(error.message || "Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Create Assignment | Super Admin | Digital AELA"
        description="Create a new assignment for any course"
      />

      <div className="layout-container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/super-admin/assignments")}
            className="mb-6 flex items-center gap-2 text-sky-300 hover:text-sky-200 transition">
            <HiOutlineArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-8">
            <h1 className="text-3xl font-semibold mb-2">Create Assignment</h1>
            <p className="text-slate-400 mb-8">Add a new assignment for any course</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Course <span className="text-red-400">*</span>
                </label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none">
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id || course.id} value={course._id || course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Assignment Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Final Project Submission"
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Provide detailed instructions for the assignment..."
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <HiOutlineCalendar className="inline h-4 w-4 mr-1 text-white" />
                    Due Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    name="maxMarks"
                    value={formData.maxMarks}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <HiOutlineDocumentText className="inline h-4 w-4 mr-1" />
                  Instructions
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Provide step-by-step instructions for completing the assignment..."
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allowLateSubmission"
                    name="allowLateSubmission"
                    checked={formData.allowLateSubmission}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-white/10 bg-[#111] text-sky-400 focus:ring-sky-400"
                  />
                  <label htmlFor="allowLateSubmission" className="text-sm text-slate-300">
                    Allow late submissions
                  </label>
                </div>

                {formData.allowLateSubmission && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Late Penalty (%)
                    </label>
                    <input
                      type="number"
                      name="latePenalty"
                      value={formData.latePenalty}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Percentage of marks to deduct for late submissions
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/super-admin/assignments")}
                  className="px-6 py-3 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold hover:from-sky-600 hover:to-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAssignmentCreate;

