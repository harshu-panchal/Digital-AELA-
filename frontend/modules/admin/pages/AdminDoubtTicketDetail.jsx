import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import SEO from "../../../src/components/SEO";
import { useAuth } from "../../../src/contexts/AuthContext";
import {
  getDoubtTicketDetails,
  replyToDoubtTicket,
  updateDoubtTicketStatus,
  assignDoubtTicket,
} from "../../../src/services/api/doubtTickets";
import { apiRequest } from "../../../src/services/api/baseClient";

const AdminDoubtTicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    loadTicket();
    loadTeachers();
  }, [ticketId]);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const response = await getDoubtTicketDetails(ticketId);
      setTicket(response.ticket);
      if (response.ticket?.assignedTeacher?._id) {
        setSelectedTeacherId(response.ticket.assignedTeacher._id);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load ticket");
      navigate("/super-admin/doubt-tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      // Fetch all teachers
      const response = await apiRequest("/admin/users/teachers", {
        method: "GET",
      });
      setTeachers(response.users || []);
    } catch (error) {
      console.error("Failed to load teachers:", error);
      // Fallback: try alternative endpoint
      try {
        const altResponse = await apiRequest("/users?role=teacher", {
          method: "GET",
        });
        setTeachers(altResponse.users || altResponse || []);
      } catch (altError) {
        console.error("Failed to load teachers from alternative endpoint:", altError);
      }
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    try {
      await replyToDoubtTicket(ticketId, { message: replyMessage });
      toast.success("Reply sent successfully");
      setReplyMessage("");
      loadTicket();
    } catch (error) {
      toast.error(error.message || "Failed to send reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await updateDoubtTicketStatus(ticketId, status);
      toast.success("Ticket status updated");
      loadTicket();
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) {
      toast.error("Please select a teacher");
      return;
    }

    try {
      await assignDoubtTicket(ticketId, selectedTeacherId);
      toast.success("Ticket assigned to teacher successfully");
      loadTicket();
    } catch (error) {
      toast.error(error.message || "Failed to assign ticket");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#03040B] text-white flex items-center justify-center">
        <p className="text-slate-400">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title={`${ticket.title} | Super Admin | Digital AELA`}
        description="View and manage doubt ticket details"
      />

      <div className="layout-container py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/super-admin/doubt-tickets")}
            className="p-2 rounded-lg border border-white/10 bg-[#111] hover:bg-white/5 transition">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-semibold">{ticket.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                  ticket.status
                )}`}>
                {ticket.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
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
                <span>Created: {formatDate(ticket.createdAt)}</span>
              </div>
              {ticket.course && (
                <div className="flex items-center gap-2">
                  <HiOutlineTag className="h-4 w-4" />
                  <span>{ticket.course.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Assign Teacher Section */}
        <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlineUserGroup className="h-5 w-5" />
            Assign to Teacher
          </h2>
          <div className="flex gap-4">
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">Select a teacher...</option>
              {loadingTeachers ? (
                <option disabled>Loading teachers...</option>
              ) : (
                teachers.map((teacher) => (
                  <option key={teacher._id || teacher.id} value={teacher._id || teacher.id}>
                    {teacher.fullName || teacher.name || "Teacher"}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={handleAssignTeacher}
              disabled={!selectedTeacherId}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold hover:from-sky-600 hover:to-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Assign
            </button>
          </div>
        </div>

        {ticket.replies && ticket.replies.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Replies ({ticket.replies.length})
            </h2>
            {ticket.replies.map((reply, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border border-white/10 bg-[#060A17]/90 p-6 ${
                  reply.isTeacherReply ? "border-[#D4AF37]/40 bg-[#D4AF37]/5" : ""
                }`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] flex items-center justify-center text-black font-semibold">
                    {reply.user?.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">
                        {reply.user?.fullName || "User"}
                      </span>
                      {reply.isTeacherReply && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                          Teacher
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {ticket.status !== "closed" && (
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Reply to Student</h2>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none mb-4"
              placeholder="Type your reply to the student..."
            />
            <div className="flex gap-4">
              <button
                onClick={handleReply}
                disabled={isSubmitting || !replyMessage.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? "Sending..." : "Send Reply"}
              </button>
              {ticket.status !== "resolved" && (
                <button
                  onClick={() => handleStatusUpdate("resolved")}
                  className="px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 font-semibold hover:bg-emerald-500/30 transition">
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        )}

        {ticket.status === "resolved" && (
          <div className="flex gap-4">
            <button
              onClick={() => handleStatusUpdate("closed")}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
              Close Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoubtTicketDetail;

