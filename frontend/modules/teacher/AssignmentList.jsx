import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getTeacherAssignments } from "../../src/services/api/assignments";

const AssignmentList = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    courseId: courseId || "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadAssignments();
  }, [filters.status, filters.courseId, pagination.page]);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const response = await getTeacherAssignments({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setAssignments(response.assignments || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load assignments");
      setAssignments([]);
    } finally {
      setIsLoading(false);
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
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "closed":
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO title="Assignments | Digital AELA" description="Manage your course assignments" />

      <div className="layout-container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Assignments</h1>
            <p className="text-slate-400">Manage assignments for your courses</p>
          </div>
          <button
            onClick={() => navigate("/teacher/assignments/create")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold hover:from-sky-600 hover:to-sky-700 transition">
            <HiOutlinePlus className="h-5 w-5" />
            Create Assignment
          </button>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <p className="text-slate-400 mb-4">No assignments found</p>
            <button
              onClick={() => navigate("/teacher/assignments/create")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold hover:from-sky-600 hover:to-sky-700 transition">
              Create Your First Assignment
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/teacher/assignments/${assignment._id}`)}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6 cursor-pointer hover:border-sky-400/50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          assignment.status
                        )}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <p className="text-slate-400 mb-4 line-clamp-2">{assignment.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Course:</span>
                        <span className="text-white">{assignment.course?.title || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="h-4 w-4" />
                        <span
                          className={
                            isOverdue(assignment.dueDate) ? "text-red-400 font-semibold" : ""
                          }>
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Max Marks:</span>
                        <span className="text-white">{assignment.maxMarks}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <HiOutlineUserGroup className="h-4 w-4" />
                        <span>Submissions</span>
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {assignment.submissionStats?.total || 0}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <HiOutlineCheckCircle className="h-3 w-3" />
                        <span>{assignment.submissionStats?.graded || 0} graded</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <HiOutlineClock className="h-3 w-3" />
                        <span>{assignment.submissionStats?.pending || 0} pending</span>
                      </div>
                    </div>
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

export default AssignmentList;

