import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getAssignmentDetails, gradeSubmission } from "../../src/services/api/assignments";

const AssignmentDetail = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingData, setGradingData] = useState({
    marks: "",
    feedback: "",
  });
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    setIsLoading(true);
    try {
      const response = await getAssignmentDetails(assignmentId, true);
      setAssignment(response.assignment);
      setSubmissions(response.submissions || []);
    } catch (error) {
      toast.error(error.message || "Failed to load assignment");
      navigate("/teacher/assignments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = async (submissionId) => {
    if (!gradingData.marks || isNaN(Number(gradingData.marks))) {
      toast.error("Please enter valid marks");
      return;
    }

    const marks = Number(gradingData.marks);
    if (marks < 0 || marks > assignment.maxMarks) {
      toast.error(`Marks must be between 0 and ${assignment.maxMarks}`);
      return;
    }

    setIsGrading(true);
    try {
      await gradeSubmission(assignmentId, submissionId, {
        marks,
        feedback: gradingData.feedback || "",
      });
      toast.success("Submission graded successfully!");
      setSelectedSubmission(null);
      setGradingData({ marks: "", feedback: "" });
      loadAssignment();
    } catch (error) {
      toast.error(error.message || "Failed to grade submission");
    } finally {
      setIsGrading(false);
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
      case "late":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
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

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO title={`${assignment.title} | Digital AELA`} />

      <div className="layout-container py-8">
        <button
          onClick={() => navigate("/teacher/assignments")}
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
                  <p className="text-white font-semibold flex items-center gap-2">
                    <HiOutlineCalendar className="h-4 w-4" />
                    {formatDate(assignment.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Maximum Marks</p>
                  <p className="text-white font-semibold">{assignment.maxMarks}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      assignment.status
                    )}`}>
                    {assignment.status}
                  </span>
                </div>
              </div>

              {assignment.instructions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <HiOutlineDocumentText className="h-5 w-5" />
                    Instructions
                  </h3>
                  <div className="text-slate-300 whitespace-pre-wrap">{assignment.instructions}</div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <HiOutlineUserGroup className="h-5 w-5" />
                  Submissions ({submissions.length})
                </h2>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  No submissions yet
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission._id}
                      className="rounded-xl border border-white/10 bg-[#111] p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-semibold text-white">
                            {submission.student?.fullName || "Student"}
                          </p>
                          <p className="text-sm text-slate-400">
                            {submission.student?.email || ""}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Submitted: {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              submission.status
                            )}`}>
                            {submission.status}
                          </span>
                          {submission.marks !== null && (
                            <p className="mt-2 text-lg font-semibold text-white">
                              {submission.marks} / {submission.maxMarks}
                            </p>
                          )}
                        </div>
                      </div>

                      {submission.submittedText && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-400 mb-1">Text Submission:</p>
                          <div className="text-slate-300 whitespace-pre-wrap bg-[#060A17] p-3 rounded-lg">
                            {submission.submittedText}
                          </div>
                        </div>
                      )}

                      {submission.submittedUrl && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-400 mb-1">URL Submission:</p>
                          <a
                            href={submission.submittedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 break-all">
                            {submission.submittedUrl}
                          </a>
                        </div>
                      )}

                      {submission.submittedFiles && submission.submittedFiles.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-400 mb-2">Files:</p>
                          <div className="space-y-2">
                            {submission.submittedFiles.map((file, idx) => (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sky-400 hover:text-sky-300">
                                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {submission.feedback && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-400 mb-1">Feedback:</p>
                          <div className="text-slate-300 whitespace-pre-wrap bg-[#060A17] p-3 rounded-lg">
                            {submission.feedback}
                          </div>
                        </div>
                      )}

                      {submission.status !== "graded" && (
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold hover:from-sky-600 hover:to-sky-700 transition">
                          Grade Submission
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedSubmission && (
            <div className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6 h-fit sticky top-8">
              <h3 className="text-xl font-semibold mb-4">Grade Submission</h3>
              <p className="text-slate-400 mb-6">
                Student: {selectedSubmission.student?.fullName || "Student"}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Marks (out of {assignment.maxMarks})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={assignment.maxMarks}
                    value={gradingData.marks}
                    onChange={(e) =>
                      setGradingData({ ...gradingData, marks: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={gradingData.feedback}
                    onChange={(e) =>
                      setGradingData({ ...gradingData, feedback: e.target.value })
                    }
                    rows={6}
                    placeholder="Provide feedback to the student..."
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedSubmission(null);
                      setGradingData({ marks: "", feedback: "" });
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleGrade(selectedSubmission._id)}
                    disabled={isGrading}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold hover:from-sky-600 hover:to-sky-700 transition disabled:opacity-50">
                    {isGrading ? "Grading..." : "Submit Grade"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;

