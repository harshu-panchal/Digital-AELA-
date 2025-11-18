import React, { useState, useEffect, useCallback } from "react";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineVideoCamera,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePencilSquare,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import {
  scheduleInterview,
  fetchInterviewSchedule,
  updateInterviewStatus,
  searchCandidates,
} from "../../../src/services/api/recruiter";

const InterviewScheduling = () => {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: "",
    scheduledTime: "",
    duration: 60,
    interviewType: "video",
    location: "",
    notes: "",
    interviewer: "",
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const loadInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const result = await fetchInterviewSchedule(params);
      console.log("Interviews data received:", result);
      const interviewsData = result?.data || result;
      setInterviews(interviewsData?.interviews || []);
    } catch (err) {
      console.error("Error loading interviews:", err);
      toast.error(err.message || "Failed to load interviews");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateRange]);

  const loadApplicants = useCallback(async () => {
    try {
      const result = await searchCandidates({
        stage: "interview",
        pageSize: 100,
      });
      const candidatesData = result?.data || result;
      setApplicants(candidatesData?.applicants || []);
    } catch (err) {
      console.error("Failed to load applicants:", err);
      setApplicants([]);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const handleScheduleInterview = async () => {
    if (!selectedApplication) {
      toast.error("Please select an applicant");
      return;
    }

    if (!scheduleForm.scheduledDate || !scheduleForm.scheduledTime) {
      toast.error("Please select date and time");
      return;
    }

    try {
      setLoading(true);
      await scheduleInterview(selectedApplication.applicationId, scheduleForm);
      toast.success("Interview scheduled successfully");
      setShowScheduleModal(false);
      setSelectedApplication(null);
      setScheduleForm({
        scheduledDate: "",
        scheduledTime: "",
        duration: 60,
        interviewType: "video",
        location: "",
        notes: "",
        interviewer: "",
      });
      loadInterviews();
    } catch (err) {
      toast.error(err.message || "Failed to schedule interview");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, status, feedback = "") => {
    try {
      setLoading(true);
      await updateInterviewStatus(applicationId, { status, feedback });
      toast.success("Interview status updated");
      loadInterviews();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const interviewTypeIcons = {
    video: HiOutlineVideoCamera,
    phone: HiOutlinePhone,
    "in-person": HiOutlineMapPin,
  };

  return (
    <div className="w-full text-white">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Interview Scheduling
            </h1>
            <p className="text-gray-400">
              Schedule and manage candidate interviews
            </p>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#D4AF37]/90 transition">
            Schedule Interview
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none">
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Scheduled Interviews ({interviews.length})
          </h3>
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : interviews.length > 0 ? (
            <div className="space-y-4">
              {interviews.map((interview) => {
                const interviewData = interview.interview || {};
                const InterviewIcon =
                  interviewTypeIcons[interviewData.interviewType] ||
                  HiOutlineCalendar;
                const scheduledDate = new Date(interviewData.scheduledDate);

                return (
                  <div
                    key={interview.applicationId}
                    className="p-6 rounded-xl border border-white/5 bg-black/40 hover:border-white/10 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <InterviewIcon className="w-5 h-5 text-[#D4AF37]" />
                          <div className="text-white font-semibold">
                            {interview.candidateName}
                          </div>
                          <div className="px-3 py-1 rounded-lg bg-white/5 text-white text-sm capitalize">
                            {interviewData.status || "scheduled"}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          {interview.candidateHeadline}
                        </div>
                        <div className="text-xs text-gray-500 mb-4">
                          {interview.job?.title}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Date:</span>
                            <span className="text-white">
                              {scheduledDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <HiOutlineClock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Time:</span>
                            <span className="text-white">
                              {scheduledDate.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {interviewData.duration && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">Duration:</span>
                              <span className="text-white">
                                {interviewData.duration} minutes
                              </span>
                            </div>
                          )}
                          {interviewData.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <HiOutlineMapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-white">
                                {interviewData.location}
                              </span>
                            </div>
                          )}
                        </div>
                        {interviewData.notes && (
                          <div className="mt-4 p-3 rounded-lg bg-white/5 text-sm text-gray-300">
                            {interviewData.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {interviewData.status === "scheduled" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  interview.applicationId,
                                  "completed",
                                  "Interview completed successfully"
                                )
                              }
                              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition text-sm">
                              Mark Complete
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  interview.applicationId,
                                  "cancelled",
                                  "Interview cancelled"
                                )
                              }
                              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm">
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-12 text-center">
              <HiOutlineCalendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                No Interviews Scheduled
              </h2>
              <p className="text-gray-400 mb-6">
                Schedule interviews with candidates who are in the interview
                stage.
              </p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#D4AF37]/90 transition">
                Schedule Interview
              </button>
            </div>
          )}
        </div>

        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Schedule Interview
                </h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Select Candidate
                  </label>
                  <select
                    value={selectedApplication?.applicationId || ""}
                    onChange={(e) => {
                      const app = applicants.find(
                        (a) => a.applicationId === e.target.value
                      );
                      setSelectedApplication(app);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none">
                    <option value="">Select candidate...</option>
                    {applicants.map((app) => (
                      <option key={app.applicationId} value={app.applicationId}>
                        {app.candidateName} - {app.job?.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.scheduledDate}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          scheduledDate: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.scheduledTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          scheduledTime: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={scheduleForm.duration}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          duration: parseInt(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Interview Type
                    </label>
                    <select
                      value={scheduleForm.interviewType}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          interviewType: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none">
                      <option value="video">Video</option>
                      <option value="phone">Phone</option>
                      <option value="in-person">In-Person</option>
                    </select>
                  </div>
                </div>
                {scheduleForm.interviewType === "in-person" && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={scheduleForm.location}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          location: e.target.value,
                        })
                      }
                      placeholder="Enter location..."
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Interviewer
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.interviewer}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        interviewer: e.target.value,
                      })
                    }
                    placeholder="Interviewer name..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={handleScheduleInterview}
                    disabled={
                      loading ||
                      !selectedApplication ||
                      !scheduleForm.scheduledDate ||
                      !scheduleForm.scheduledTime
                    }
                    className="flex-1 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#D4AF37]/90 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {loading ? "Scheduling..." : "Schedule Interview"}
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-6 py-3 rounded-xl border border-white/10 bg-black/60 text-white hover:border-white/20 transition">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewScheduling;

