import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
  HiOutlineLink,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getStudentAssignmentDetails, submitAssignment } from "../../src/services/api/assignments";
import { getStoredTokens } from "../../src/services/api/baseClient";

const AssignmentDetail = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    submissionType: "file",
    submittedText: "",
    submittedUrl: "",
    submittedFiles: [],
  });

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    setIsLoading(true);
    try {
      const response = await getStudentAssignmentDetails(assignmentId);
      setAssignment(response.assignment);
      setSubmission(response.submission);
      if (response.submission) {
        setFormData({
          submissionType: response.submission.submissionType || "file",
          submittedText: response.submission.submittedText || "",
          submittedUrl: response.submission.submittedUrl || "",
          submittedFiles: response.submission.submittedFiles || [],
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to load assignment");
      navigate("/student/assignments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    const { API_BASE_URL } = await import("../../../src/config/api.js");
    const tokens = getStoredTokens();

    if (!tokens?.accessToken) {
      toast.error("Authentication required");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `digital-aela/assignments/${assignmentId}`);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const result = await response.json();
      return {
        type: file.type.includes("pdf")
          ? "pdf"
          : file.type.includes("word")
          ? "docx"
          : file.type.includes("image")
          ? "image"
          : "other",
        url: result.url,
        name: file.name,
        size: file.size,
      };
    } catch (error) {
      toast.error("Failed to upload file");
      throw error;
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadedFiles = await Promise.all(files.map((file) => handleFileUpload(file)));
      setFormData((prev) => ({
        ...prev,
        submittedFiles: [...prev.submittedFiles, ...uploadedFiles],
      }));
      toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  const handleRemoveFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      submittedFiles: prev.submittedFiles.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.submissionType === "file" && formData.submittedFiles.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }

    if (formData.submissionType === "text" && !formData.submittedText.trim()) {
      toast.error("Please enter your submission text");
      return;
    }

    if (formData.submissionType === "url" && !formData.submittedUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAssignment(assignmentId, formData);
      toast.success("Assignment submitted successfully!");
      loadAssignment();
    } catch (error) {
      toast.error(error.message || "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#03040B] text-white flex items-center justify-center">
        <p className="text-slate-400">Loading assignment...</p>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
  const isSubmitted = !!submission;
  const isGraded = submission?.status === "graded";

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO title={`${assignment.title} | Digital AELA`} />

      <div className="layout-container py-8">
        <button
          onClick={() => navigate("/student/assignments")}
          className="mb-6 flex items-center gap-2 text-sky-300 hover:text-sky-200 transition">
          <HiOutlineArrowLeft className="h-5 w-5" />
          Back to Assignments
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <h1 className="text-3xl font-semibold mb-2">{assignment.title}</h1>
              <p className="text-slate-400 mb-6">{assignment.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Course</p>
                  <p className="text-white font-semibold">{assignment.course?.title || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Due Date</p>
                  <p
                    className={`font-semibold flex items-center gap-2 ${
                      isOverdue ? "text-red-400" : "text-white"
                    }`}>
                    <HiOutlineCalendar className="h-4 w-4" />
                    {formatDate(assignment.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Maximum Marks</p>
                  <p className="text-white font-semibold">{assignment.maxMarks}</p>
                </div>
                {isGraded && submission?.marks !== null && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Your Score</p>
                    <p className="text-emerald-400 font-semibold text-xl">
                      {submission.marks} / {submission.maxMarks}
                    </p>
                  </div>
                )}
              </div>

              {assignment.instructions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <HiOutlineDocumentText className="h-5 w-5" />
                    Instructions
                  </h3>
                  <div className="text-slate-300 whitespace-pre-wrap bg-[#111] p-4 rounded-lg">
                    {assignment.instructions}
                  </div>
                </div>
              )}

              {isGraded && submission?.feedback && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Teacher Feedback</h3>
                  <div className="text-slate-300 whitespace-pre-wrap bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
                    {submission.feedback}
                  </div>
                </div>
              )}
            </div>

            {!isGraded && (
              <div className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
                <h2 className="text-xl font-semibold mb-6">
                  {isSubmitted ? "Update Submission" : "Submit Assignment"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Submission Type
                    </label>
                    <select
                      value={formData.submissionType}
                      onChange={(e) =>
                        setFormData({ ...formData, submissionType: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none">
                      <option value="file">File Upload</option>
                      <option value="text">Text Submission</option>
                      <option value="url">URL Submission</option>
                      <option value="mixed">Mixed (File + Text/URL)</option>
                    </select>
                  </div>

                  {(formData.submissionType === "file" ||
                    formData.submissionType === "mixed") && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Upload Files
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none"
                      />
                      {formData.submittedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {formData.submittedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-[#111] p-3 rounded-lg">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-400 hover:text-sky-300 flex items-center gap-2">
                                <HiOutlineLink className="h-4 w-4" />
                                {file.name}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(idx)}
                                className="text-red-400 hover:text-red-300">
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(formData.submissionType === "text" ||
                    formData.submissionType === "mixed") && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Text Submission
                      </label>
                      <textarea
                        value={formData.submittedText}
                        onChange={(e) =>
                          setFormData({ ...formData, submittedText: e.target.value })
                        }
                        rows={10}
                        placeholder="Enter your submission text here..."
                        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none resize-none"
                      />
                    </div>
                  )}

                  {(formData.submissionType === "url" ||
                    formData.submissionType === "mixed") && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        URL Submission
                      </label>
                      <input
                        type="url"
                        value={formData.submittedUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, submittedUrl: e.target.value })
                        }
                        placeholder="https://example.com/submission"
                        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || isOverdue}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold hover:from-sky-600 hover:to-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <HiOutlinePaperAirplane className="h-5 w-5" />
                    {isSubmitting
                      ? "Submitting..."
                      : isSubmitted
                      ? "Update Submission"
                      : "Submit Assignment"}
                  </button>

                  {isOverdue && (
                    <p className="text-red-400 text-sm text-center">
                      This assignment is overdue and cannot be submitted
                    </p>
                  )}
                </form>
              </div>
            )}

            {isSubmitted && !isGraded && (
              <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                <p className="text-yellow-300">
                  Your submission is being reviewed by the instructor. You can update it until it's
                  graded.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;

