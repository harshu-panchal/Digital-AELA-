import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineBuildingOffice,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineXCircle,
} from "react-icons/hi2";
import {
  HiOutlineMail,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getLeadDetails,
  updateLead,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  getTeamMembers,
} from "../../src/services/api/crm";

const LeadDetail = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [newFollowUp, setNewFollowUp] = useState({
    type: "note",
    subject: "",
    description: "",
    scheduledAt: "",
    priority: "medium",
    assignedTo: "",
  });

  useEffect(() => {
    loadLeadDetails();
    loadTeamMembers();
  }, [leadId]);

  const loadLeadDetails = async () => {
    setIsLoading(true);
    try {
      const response = await getLeadDetails(leadId);
      setLead(response.lead);
      setFollowUps(response.followUps || []);
    } catch (error) {
      toast.error(error.message || "Failed to load lead details");
      navigate("/super-admin/crm/leads");
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

  const handleUpdateLead = async (field, value) => {
    try {
      const updatedLead = await updateLead(leadId, { [field]: value });
      setLead(updatedLead.lead);
      toast.success("Lead updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update lead");
    }
  };

  const handleCreateFollowUp = async () => {
    if (!newFollowUp.subject) {
      toast.error("Subject is required");
      return;
    }

    try {
      await createFollowUp({
        ...newFollowUp,
        lead: leadId,
        assignedTo: newFollowUp.assignedTo || user._id,
      });
      toast.success("Follow-up created successfully");
      setShowFollowUpModal(false);
      setNewFollowUp({
        type: "note",
        subject: "",
        description: "",
        scheduledAt: "",
        priority: "medium",
        assignedTo: "",
      });
      loadLeadDetails();
    } catch (error) {
      toast.error(error.message || "Failed to create follow-up");
    }
  };

  const handleUpdateFollowUp = async (followUpId, updateData) => {
    try {
      await updateFollowUp(followUpId, updateData);
      toast.success("Follow-up updated successfully");
      loadLeadDetails();
    } catch (error) {
      toast.error(error.message || "Failed to update follow-up");
    }
  };

  const handleDeleteFollowUp = async (followUpId) => {
    if (!window.confirm("Are you sure you want to delete this follow-up?")) {
      return;
    }

    try {
      await deleteFollowUp(followUpId);
      toast.success("Follow-up deleted successfully");
      loadLeadDetails();
    } catch (error) {
      toast.error(error.message || "Failed to delete follow-up");
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
      case "completed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "scheduled":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "overdue":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "cancelled":
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <p className="text-slate-400">Loading lead details...</p>
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="min-h-screen text-white">
      <SEO title={`Lead: ${lead.firstName} ${lead.lastName} | Digital AELA`} />

      <div className="space-y-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/super-admin/crm/leads")}
            className="p-2 rounded-lg border border-white/10 bg-[#111] hover:bg-white/5 transition">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold mb-2">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="text-slate-400">Lead details and follow-ups</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Lead Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateLead("status", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
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
                      value={lead.priority}
                      onChange={(e) => handleUpdateLead("priority", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <div className="flex items-center gap-2 text-white">
                      <HiOutlineMail className="h-4 w-4" />
                      <span>{lead.email}</span>
                    </div>
                  </div>
                  {lead.phone && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                      <div className="flex items-center gap-2 text-white">
                        <HiOutlinePhone className="h-4 w-4" />
                        <span>{lead.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
                {lead.company && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                    <div className="flex items-center gap-2 text-white">
                      <HiOutlineBuildingOffice className="h-4 w-4" />
                      <span>{lead.company}</span>
                    </div>
                  </div>
                )}
                {lead.description && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <p className="text-white">{lead.description}</p>
                  </div>
                )}
                {lead.assignedTo && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Assigned To
                    </label>
                    <div className="flex items-center gap-2 text-white">
                      <HiOutlineUser className="h-4 w-4" />
                      <span>{lead.assignedTo.fullName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {lead.customFields && Object.keys(lead.customFields).length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Form Details</h2>
                <div className="space-y-4">
                  {Object.entries(lead.customFields).map(([key, value]) => {
                    // Format field name (convert camelCase to Title Case)
                    const formatFieldName = (str) => {
                      return str
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim();
                    };

                    // Skip empty values
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                      return null;
                    }

                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {formatFieldName(key)}
                        </label>
                        <div className="text-white">
                          {Array.isArray(value) ? (
                            <div className="flex flex-wrap gap-2">
                              {value.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-lg bg-[#111] border border-white/10 text-sm">
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : typeof value === "object" ? (
                            <pre className="text-sm bg-[#111] p-3 rounded-lg border border-white/10 overflow-x-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-sm">{String(value)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Follow-Ups</h2>
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition flex items-center gap-2">
                  <HiOutlinePlus className="h-5 w-5" />
                  Add Follow-Up
                </button>
              </div>
              <div className="space-y-4">
                {followUps.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No follow-ups yet</p>
                ) : (
                  followUps.map((followUp) => (
                    <div
                      key={followUp._id}
                      className="rounded-xl border border-white/10 bg-[#111] p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{followUp.subject}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(
                                followUp.status
                              )}`}>
                              {followUp.status}
                            </span>
                            <span className="text-xs text-slate-400">{followUp.type}</span>
                            {followUp.scheduledAt && (
                              <span className="text-xs text-slate-400">
                                {formatDate(followUp.scheduledAt)}
                              </span>
                            )}
                          </div>
                          {followUp.description && (
                            <p className="text-sm text-slate-300 mb-2">{followUp.description}</p>
                          )}
                          {followUp.outcome && (
                            <p className="text-sm text-slate-400">Outcome: {followUp.outcome}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {followUp.status === "scheduled" && (
                            <button
                              onClick={() =>
                                handleUpdateFollowUp(followUp._id, {
                                  status: "completed",
                                  completedAt: new Date(),
                                })
                              }
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition">
                              <HiOutlineCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFollowUp(followUp._id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">
                            <HiOutlineXCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Info</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400">Source: </span>
                  <span className="text-white">{lead.source}</span>
                </div>
                {lead.formSource && (
                  <div>
                    <span className="text-slate-400">Form Source: </span>
                    <span className="px-2 py-1 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold">
                      {lead.formSource.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Created: </span>
                  <span className="text-white">{formatDate(lead.createdAt)}</span>
                </div>
                {lead.lastContactedAt && (
                  <div>
                    <span className="text-slate-400">Last Contacted: </span>
                    <span className="text-white">{formatDate(lead.lastContactedAt)}</span>
                  </div>
                )}
                {lead.nextFollowUpAt && (
                  <div>
                    <span className="text-slate-400">Next Follow-Up: </span>
                    <span className="text-yellow-400">{formatDate(lead.nextFollowUpAt)}</span>
                  </div>
                )}
                {lead.value > 0 && (
                  <div>
                    <span className="text-slate-400">Value: </span>
                    <span className="text-white font-semibold">
                      {lead.currency} {lead.value.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Follow-Up Modal */}
        {showFollowUpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1E] p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Add Follow-Up</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={newFollowUp.type}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, type: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="note">Note</option>
                    <option value="task">Task</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={newFollowUp.subject}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, subject: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newFollowUp.description}
                    onChange={(e) =>
                      setNewFollowUp({ ...newFollowUp, description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Scheduled At
                  </label>
                  <input
                    type="datetime-local"
                    value={newFollowUp.scheduledAt}
                    onChange={(e) =>
                      setNewFollowUp({ ...newFollowUp, scheduledAt: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  <select
                    value={newFollowUp.priority}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, priority: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Assign To
                  </label>
                  <select
                    value={newFollowUp.assignedTo}
                    onChange={(e) =>
                      setNewFollowUp({ ...newFollowUp, assignedTo: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="">Self</option>
                    {teamMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowFollowUpModal(false);
                      setNewFollowUp({
                        type: "note",
                        subject: "",
                        description: "",
                        scheduledAt: "",
                        priority: "medium",
                        assignedTo: "",
                      });
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFollowUp}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110">
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadDetail;

