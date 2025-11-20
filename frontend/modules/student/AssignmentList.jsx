import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getStudentAssignments } from "../../src/services/api/assignments";

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
      const response = await getStudentAssignments({
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
      case "graded":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "submitted":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "overdue":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "pending":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "graded":
        return <HiOutlineCheckCircle className="h-5 w-5" />;
      case "submitted":
        return <HiOutlineClock className="h-5 w-5" />;
      case "overdue":
        return <HiOutlineExclamationTriangle className="h-5 w-5" />;
      default:
        return <HiOutlineClock className="h-5 w-5" />;
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO title="My Assignments | Digital AELA" description="View and submit your assignments" />

      <div className="layout-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">My Assignments</h1>
          <p className="text-slate-400">View and submit assignments for your enrolled courses</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
            <option value="">All Assignments</option>
            <option value="pending">Pending</option>
            <option value="due">Due</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <p className="text-slate-400">No assignments found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/student/assignments/${assignment._id}`)}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6 cursor-pointer hover:border-sky-400/50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(
                          assignment.submissionStatus
                        )}`}>
                        {getStatusIcon(assignment.submissionStatus)}
                        {assignment.submissionStatus}
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
                      {assignment.submission?.marks !== null &&
                        assignment.submission?.marks !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Your Score:</span>
                            <span className="text-emerald-400 font-semibold">
                              {assignment.submission.marks} / {assignment.maxMarks}
                            </span>
                          </div>
                        )}
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

