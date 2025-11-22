import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import {
  getTeacherCourses,
  deleteTeacherCourse,
} from "../../src/services/teacherCourses";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, published, draft

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const coursesData = await getTeacherCourses();
      let filtered = Array.isArray(coursesData) ? coursesData : [];

      if (filter === "published") {
        filtered = filtered.filter((c) => c.status === "published");
      } else if (filter === "draft") {
        filtered = filtered.filter((c) => c.status === "draft");
      }

      setCourses(filtered);
    } catch (error) {
      toast.error(error.message || "Failed to load courses");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteTeacherCourse(courseId);
      toast.success("Course deleted successfully");
      loadCourses(); // Reload the courses list
    } catch (error) {
      toast.error(error.message || "Failed to delete course");
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO
        title="My Courses | Digital AELA"
        description="Manage your courses"
        keywords="teacher courses, course management"
        url="https://digitalaela.com/teacher/courses"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">My Courses</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage and organize your courses
            </p>
          </div>
          <Link
            to="/teacher/courses/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition">
            <HiOutlinePlus className="h-5 w-5" />
            Create Course
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === "all"
                ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            All
          </button>
          <button
            onClick={() => setFilter("published")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === "published"
                ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            Published
          </button>
          <button
            onClick={() => setFilter("draft")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === "draft"
                ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            Draft
          </button>
        </div>

        {/* Courses List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No courses found</p>
            <Link
              to="/teacher/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition">
              <HiOutlinePlus className="h-5 w-5" />
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <motion.div
                key={course._id || course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-[#060A17]/90 p-6 hover:border-[#F5D26A]/40 transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-1 rounded ${
                        course.status === "published"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                      {course.status || "draft"}
                    </span>
                    <span className="text-gray-400">
                      {course.enrolments?.length || 0} students
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Link
                      to={`/teacher/courses/${course._id || course.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
                      <HiOutlineEye className="h-4 w-4" />
                      View
                    </Link>
                    <Link
                      to={`/teacher/courses/${course._id || course.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
                      <HiOutlinePencil className="h-4 w-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() =>
                        handleDeleteCourse(
                          course._id || course.id,
                          course.title
                        )
                      }
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm">
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
