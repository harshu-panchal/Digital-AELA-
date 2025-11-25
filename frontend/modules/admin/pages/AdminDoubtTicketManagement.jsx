import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTag,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import SEO from "../../../src/components/SEO";
import { useAuth } from "../../../src/contexts/AuthContext";
import { getAllDoubtTickets, getDoubtTicketStats } from "../../../src/services/api/doubtTickets";

const AdminDoubtTicketManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filters.status, filters.priority, filters.category, filters.search, pagination.page]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const response = await getAllDoubtTickets({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setTickets(response.tickets || []);
      setPagination(response.pagination || pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load doubt tickets");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getDoubtTicketStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
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
      case "open":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "resolved":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "closed":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
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
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      course_content: "Course Content",
      assignment: "Assignment",
      quiz: "Quiz",
      technical: "Technical",
      payment: "Payment",
      certificate: "Certificate",
      general: "General",
      other: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Doubt Ticket Management | Super Admin | Digital AELA"
        description="Manage all doubt tickets across the platform"
      />

      <div className="layout-container py-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/super-admin")}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:border-sky-400/50 hover:bg-sky-500/10">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold mb-2">Doubt Ticket Management</h1>
            <p className="text-slate-400">View and manage all student doubt tickets</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Total Tickets</p>
              <p className="text-2xl font-semibold text-white">{stats.total || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Open</p>
              <p className="text-2xl font-semibold text-blue-400">{stats.open || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">In Progress</p>
              <p className="text-2xl font-semibold text-yellow-400">{stats.inProgress || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Resolved</p>
              <p className="text-2xl font-semibold text-emerald-400">{stats.resolved || 0}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Search tickets..."
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
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
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Categories</option>
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
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <HiOutlineQuestionMarkCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No doubt tickets found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket._id}
                to={`/super-admin/doubt-tickets/${ticket._id}`}
                className="block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6 hover:bg-[#060A17] transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-semibold text-white">{ticket.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            ticket.status
                          )}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                            ticket.priority
                          )}`}>
                          {ticket.priority}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/40 bg-purple-500/20 text-purple-300">
                          {getCategoryLabel(ticket.category)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span>Student: {ticket.student?.fullName || "Unknown"}</span>
                        </div>
                        {ticket.assignedTeacher && (
                          <div className="flex items-center gap-2">
                            <span>Assigned to: {ticket.assignedTeacher.fullName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <HiOutlineClock className="h-4 w-4" />
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                        {ticket.course && (
                          <div className="flex items-center gap-2">
                            <HiOutlineTag className="h-4 w-4" />
                            <span>{ticket.course.title}</span>
                          </div>
                        )}
                        {ticket.replies && ticket.replies.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span>{ticket.replies.length} replies</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
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

export default AdminDoubtTicketManagement;

