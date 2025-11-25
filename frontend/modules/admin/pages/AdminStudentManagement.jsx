import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowLeft,
  HiOutlineAcademicCap,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { useAuth } from "../../../src/contexts/AuthContext";
import { fetchTeacherStudents, fetchStudentDetails } from "../../../src/services/api/teacher";

const AdminStudentManagement = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    courseId: "",
  });
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "super-admin") {
      toast.info("Only super admins can access this page");
      navigate("/");
      return;
    }

    loadStudents();
  }, [isAuthenticated, user, navigate, pagination.page, filters]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeacherStudents({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...(filters.courseId && { courseId: filters.courseId }),
        ...(filters.search && { search: filters.search }),
      });

      setStudents(data.students || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load students");
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewStudent = async (studentId) => {
    try {
      const data = await fetchStudentDetails(studentId);
      setSelectedStudent(data);
    } catch (error) {
      toast.error(error.message || "Failed to load student details");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!isAuthenticated || !user || user.role !== "super-admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Student Management | Super Admin | Digital AELA"
        description="Manage and view all students across the platform"
        keywords="student management, enrolled students, student performance"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(55,124,255,0.18),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20" style={{ paddingTop: "calc(6rem + 5vh)" }}>
        <section className="layout-container space-y-6">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/super-admin")}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:border-sky-400/50 hover:bg-sky-500/10">
                <HiOutlineArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
                  Student Management
                </p>
                <h1 className="text-3xl font-semibold md:text-4xl">All Students</h1>
              </div>
            </div>
          </motion.header>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-[#060A17]/90 p-4">
            <div className="flex items-center gap-2">
              <HiOutlineFunnel className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-300">Filters:</span>
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
              />
            </div>
          </motion.div>

          {/* Students List */}
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-slate-300/80">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#060A17]/90 p-12 text-center">
              <HiOutlineUsers className="mb-4 h-16 w-16 text-slate-400/50" />
              <h3 className="text-xl font-semibold text-white">No students found</h3>
              <p className="mt-2 text-sm text-slate-300/80">
                {filters.search ? "No students match your search" : "No students enrolled yet"}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {students.map((student, index) => (
                  <motion.div
                    key={student.studentId || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {student.studentName || "Student"}
                        </h3>
                        <p className="text-xs text-slate-400">{student.studentEmail}</p>
                      </div>
                      <button
                        onClick={() => handleViewStudent(student.studentId)}
                        className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200 transition hover:border-sky-300/70 hover:bg-sky-500/20">
                        View
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Courses:</span>
                        <span className="font-semibold text-white">
                          {student.totalEnrollments || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Active:</span>
                        <span className="font-semibold text-green-400">
                          {student.activeEnrollments || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Completed:</span>
                        <span className="font-semibold text-blue-400">
                          {student.completedEnrollments || 0}
                        </span>
                      </div>
                      {student.lastActivity && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Last Activity:</span>
                          <span className="text-slate-300">{formatDate(student.lastActivity)}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm text-slate-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                    Next
                  </button>
                </motion.div>
              )}
            </>
          )}

          {/* Student Details Modal */}
          {selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedStudent(null)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#060A17] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedStudent.student.name}
                  </h2>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:border-red-400/50 hover:bg-red-500/10">
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-white">Performance Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Total Courses</p>
                        <p className="text-xl font-bold text-white">
                          {selectedStudent.performance.totalCourses}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Completed</p>
                        <p className="text-xl font-bold text-green-400">
                          {selectedStudent.performance.completedCourses}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Completion Rate</p>
                        <p className="text-xl font-bold text-blue-400">
                          {selectedStudent.performance.completionRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Avg Quiz Score</p>
                        <p className="text-xl font-bold text-yellow-400">
                          {selectedStudent.performance.avgQuizScore}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <h3 className="mb-3 text-lg font-semibold text-white">Enrolled Courses</h3>
                      <div className="space-y-2">
                        {selectedStudent.enrollments.map((enrollment) => (
                          <div
                            key={enrollment.courseId}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#060A17] p-3">
                            <div>
                              <p className="font-semibold text-white">{enrollment.courseTitle}</p>
                              <p className="text-xs text-slate-400">{enrollment.category}</p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                enrollment.status === "active"
                                  ? "bg-green-500/20 text-green-400"
                                  : enrollment.status === "completed"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                              }`}>
                              {enrollment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminStudentManagement;

