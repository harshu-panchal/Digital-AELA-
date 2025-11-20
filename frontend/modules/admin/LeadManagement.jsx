import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineUserPlus,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineBuildingOffice,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getAllLeads,
  createLead,
  deleteLead,
  assignLead,
  getTeamMembers,
} from "../../src/services/api/crm";

const LeadManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    source: "",
    assignedTo: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [newLead, setNewLead] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    source: "website",
    status: "new",
    priority: "medium",
    description: "",
  });

  useEffect(() => {
    loadLeads();
    loadTeamMembers();
  }, [filters.status, filters.priority, filters.source, filters.assignedTo, filters.search, pagination.page]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const response = await getAllLeads({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setLeads(response.leads || []);
      setStats(response.stats || null);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load leads");
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await getTeamMembers();
      setTeamMembers(response.teamMembers || []);
    } catch (error) {
      console.error("Failed to load team members:", error);
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.firstName || !newLead.email) {
      toast.error("First name and email are required");
      return;
    }

    try {
      await createLead(newLead);
      toast.success("Lead created successfully");
      setShowCreateModal(false);
      setNewLead({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        source: "website",
        status: "new",
        priority: "medium",
        description: "",
      });
      loadLeads();
    } catch (error) {
      toast.error(error.message || "Failed to create lead");
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    try {
      await deleteLead(leadId);
      toast.success("Lead deleted successfully");
      loadLeads();
    } catch (error) {
      toast.error(error.message || "Failed to delete lead");
    }
  };

  const handleAssign = async (assignedTo) => {
    if (!assignedTo) {
      toast.error("Please select a team member");
      return;
    }

    try {
      await assignLead(selectedLead._id, { assignedTo });
      toast.success("Lead assigned successfully");
      setShowAssignModal(false);
      setSelectedLead(null);
      loadLeads();
    } catch (error) {
      toast.error(error.message || "Failed to assign lead");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "contacted":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "qualified":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "proposal":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "negotiation":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "converted":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "lost":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "nurturing":
        return "bg-pink-500/20 text-pink-300 border-pink-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-400";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Lead Management | Digital AELA" description="Manage leads and track conversions" />

      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Lead Management</h1>
            <p className="text-slate-400">Manage leads, track status, and assign to team members</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition flex items-center gap-2">
            <HiOutlineUserPlus className="h-5 w-5" />
            Add Lead
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Total</p>
              <p className="text-2xl font-semibold text-white">{stats.total || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">New</p>
              <p className="text-2xl font-semibold text-blue-400">{stats.new || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Contacted</p>
              <p className="text-2xl font-semibold text-yellow-400">{stats.contacted || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Qualified</p>
              <p className="text-2xl font-semibold text-purple-400">{stats.qualified || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Converted</p>
              <p className="text-2xl font-semibold text-emerald-400">{stats.converted || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Lost</p>
              <p className="text-2xl font-semibold text-red-400">{stats.lost || 0}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Search leads..."
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
              <option value="nurturing">Nurturing</option>
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
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <select
              value={filters.source}
              onChange={(e) => {
                setFilters({ ...filters, source: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Sources</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social_media">Social Media</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <p className="text-slate-400">No leads found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <motion.div
                key={lead._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className="text-xl font-semibold text-white cursor-pointer hover:text-[#F5D26A] transition"
                        onClick={() => navigate(`/super-admin/crm/leads/${lead._id}`)}>
                        {lead.firstName} {lead.lastName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          lead.status
                        )}`}>
                        {lead.status}
                      </span>
                      <span className={`text-xs font-semibold ${getPriorityColor(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <HiOutlineMail className="h-4 w-4" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <HiOutlinePhone className="h-4 w-4" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.company && (
                        <div className="flex items-center gap-2">
                          <HiOutlineBuildingOffice className="h-4 w-4" />
                          <span>{lead.company}</span>
                        </div>
                      )}
                      {lead.assignedTo && (
                        <div className="flex items-center gap-2">
                          <HiOutlineUser className="h-4 w-4" />
                          <span>{lead.assignedTo.fullName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="h-4 w-4" />
                        <span>{formatDate(lead.createdAt)}</span>
                      </div>
                    </div>
                    {lead.description && (
                      <p className="text-sm text-slate-400 mb-2 line-clamp-2">{lead.description}</p>
                    )}
                    {lead.nextFollowUpAt && (
                      <div className="text-xs text-yellow-400">
                        Next follow-up: {formatDate(lead.nextFollowUpAt)}
                      </div>
                    )}
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/super-admin/crm/leads/${lead._id}`)}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-[#111] text-white text-sm font-semibold hover:bg-white/5 transition">
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowAssignModal(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-semibold hover:bg-blue-500/30 transition">
                      Assign
                    </button>
                    <button
                      onClick={() => handleDelete(lead._id)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition">
                      Delete
                    </button>
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

        {/* Create Lead Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0F1E] p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-white mb-4">Create New Lead</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newLead.firstName}
                    onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={newLead.lastName}
                    onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Source</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={newLead.status}
                    onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                    <option value="nurturing">Nurturing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  <select
                    value={newLead.priority}
                    onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={newLead.description}
                    onChange={(e) => setNewLead({ ...newLead, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewLead({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      company: "",
                      source: "website",
                      status: "new",
                      priority: "medium",
                      description: "",
                    });
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                  Cancel
                </button>
                <button
                  onClick={handleCreateLead}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110">
                  Create Lead
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Assign Lead Modal */}
        {showAssignModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1E] p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Assign Lead</h3>
              <p className="text-sm text-slate-400 mb-4">
                Assign "{selectedLead.firstName} {selectedLead.lastName}" to a team member
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Team Member
                </label>
                <select
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  <option value="">Select team member</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.fullName} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedLead(null);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManagement;

