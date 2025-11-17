import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineXCircle,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  fetchEnrolledCourses,
  unenrollFromCourse,
  updateEnrollmentStatus,
} from "../../src/services/api/courses";

const EnrolledCourses = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, completed, paused

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "student") {
      toast.info("Please log in as a student to view enrolled courses");
      navigate("/login/student");
      return;
    }

    loadEnrollments();
  }, [isAuthenticated, user, navigate, filter]);

  const loadEnrollments = async () => {
    setIsLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const result = await fetchEnrolledCourses(params);
      setEnrollments(result.enrollments || []);
    } catch (error) {
      toast.error(error.message || "Failed to load enrolled courses");
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenroll = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to unenroll from "${courseTitle}"?`)) {
      return;
    }

    try {
      await unenrollFromCourse(courseId);
      toast.success("Successfully unenrolled from course");
      loadEnrollments();
    } catch (error) {
      toast.error(error.message || "Failed to unenroll from course");
    }
  };

  const handleStatusUpdate = async (courseId, newStatus) => {
    try {
      await updateEnrollmentStatus(courseId, newStatus);
      toast.success(`Course status updated to ${newStatus}`);
      loadEnrollments();
    } catch (error) {
      toast.error(error.message || "Failed to update course status");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        label: "Active",
        className: "bg-green-500/20 text-green-400 border-green-500/40",
      },
      completed: {
        label: "Completed",
        className: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      },
      paused: {
        label: "Paused",
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
      },
      dropped: {
        label: "Dropped",
        className: "bg-red-500/20 text-red-400 border-red-500/40",
      },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (filter === "all") return true;
    return enrollment.status === filter;
  });

  if (!isAuthenticated || user?.role !== "student") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="My Enrolled Courses | Digital AELA"
        description="View and manage all your enrolled courses"
        keywords="enrolled courses, my courses, student courses"
        url="https://digitalaela.com/student/courses"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(55,124,255,0.18),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20" style={{ paddingTop: "calc(6rem + 5vh)" }}>
        <section className="layout-container space-y-6">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
                  My Learning
                </p>
                <h1 className="text-3xl font-semibold md:text-4xl">Enrolled Courses</h1>
                <p className="mt-2 text-sm text-slate-300/80">
                  Manage and continue your learning journey
                </p>
              </div>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300/70 hover:bg-sky-500/20">
                Browse Courses
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {["all", "active", "completed", "paused"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                    filter === status
                      ? "border-sky-400/60 bg-sky-500/20 text-sky-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300"
                  }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </motion.header>

          {/* Enrollments List */}
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-slate-300/80">Loading your courses...</p>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#060A17]/90 p-12 text-center">
              <HiOutlineAcademicCap className="mb-4 h-16 w-16 text-slate-400/50" />
              <h3 className="text-xl font-semibold text-white">
                {filter === "all"
                  ? "No enrolled courses yet"
                  : `No ${filter} courses`}
              </h3>
              <p className="mt-2 text-sm text-slate-300/80">
                {filter === "all"
                  ? "Start your learning journey by enrolling in a course"
                  : `You don't have any ${filter} courses at the moment`}
              </p>
              <Link
                to="/courses"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-6 py-3 text-sm font-semibold text-sky-200 transition hover:border-sky-300/70 hover:bg-sky-500/20">
                Browse Available Courses
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnrollments.map((enrollment) => {
                const course = enrollment.course || {};
                const enrolledDate = new Date(enrollment.enrolledAt);
                const lastAccessed = enrollment.lastAccessedAt
                  ? new Date(enrollment.lastAccessedAt)
                  : null;

                return (
                  <motion.div
                    key={enrollment._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group rounded-3xl border border-white/10 bg-[#060A17]/90 p-6 shadow-[0_24px_80px_rgba(20,30,60,0.4)] transition hover:border-sky-400/30">
                    {/* Course Header */}
                    <div className="mb-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white line-clamp-2">
                            {course.title || "Course Title"}
                          </h3>
                          {course.instructor && (
                            <p className="mt-1 text-xs text-slate-400">
                              by {course.instructor}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(enrollment.status)}
                      </div>

                      {course.description && (
                        <p className="line-clamp-2 text-sm text-slate-300/80">
                          {course.description}
                        </p>
                      )}
                    </div>

                    {/* Course Meta */}
                    <div className="mb-4 space-y-2 text-xs text-slate-400">
                      {course.duration && (
                        <div className="flex items-center gap-2">
                          <HiOutlineClock className="h-4 w-4" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendarDays className="h-4 w-4" />
                        <span>
                          Enrolled {enrolledDate.toLocaleDateString()}
                        </span>
                      </div>
                      {lastAccessed && (
                        <div className="flex items-center gap-2">
                          <HiOutlineClock className="h-4 w-4" />
                          <span>
                            Last accessed {lastAccessed.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {enrollment.status === "active" && course._id && (
                        <Link
                          to={`/student/courses/${course._id}`}
                          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300/70 hover:bg-sky-500/20">
                          Continue Learning
                          <HiOutlineArrowRight className="h-4 w-4" />
                        </Link>
                      )}

                      {enrollment.status === "active" && (
                        <button
                          onClick={() => handleStatusUpdate(course._id, "paused")}
                          className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-200 transition hover:border-yellow-300/70 hover:bg-yellow-500/20">
                          Pause
                        </button>
                      )}

                      {enrollment.status === "paused" && (
                        <button
                          onClick={() => handleStatusUpdate(course._id, "active")}
                          className="rounded-full border border-green-400/40 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-200 transition hover:border-green-300/70 hover:bg-green-500/20">
                          Resume
                        </button>
                      )}

                      <button
                        onClick={() => handleUnenroll(course._id, course.title)}
                        className="rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300/70 hover:bg-red-500/20">
                        <HiOutlineXCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Stats Summary */}
          {enrollments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6 md:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{enrollments.length}</p>
                <p className="text-xs text-slate-400">Total Courses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-400">
                  {enrollments.filter((e) => e.status === "active").length}
                </p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-400">
                  {enrollments.filter((e) => e.status === "completed").length}
                </p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-yellow-400">
                  {enrollments.filter((e) => e.status === "paused").length}
                </p>
                <p className="text-xs text-slate-400">Paused</p>
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};

export default EnrolledCourses;

