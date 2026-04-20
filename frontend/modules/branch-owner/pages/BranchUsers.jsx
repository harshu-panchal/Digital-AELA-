import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaCheck, FaEye, FaSearch, FaSpinner, FaTimes, FaUserMinus } from "react-icons/fa";
import {
  approveBranchUser,
  fetchBranchStudents,
  fetchBranchTeachers,
  fetchBranchUserDetails,
  fetchPendingBranchUsers,
  rejectBranchUser,
  removeBranchUser,
} from "../../../src/services/api/branchOwner";

const statusClass = {
  approved: "bg-emerald-500/20 text-emerald-300",
  pending: "bg-amber-500/20 text-amber-300",
  rejected: "bg-red-500/20 text-red-300",
};

const DetailsRow = ({ label, value }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-sm text-gray-200 break-words">{value}</p>
    </div>
  );
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const renderPaymentItems = (payment) => {
  const items = payment?.metadata?.cartItems;
  if (!Array.isArray(items) || items.length === 0) return null;
  return items
    .map((item) => {
      const title = item?.title || item?.name || item?.itemName || "Item";
      const quantity = item?.quantity ? ` x${item.quantity}` : "";
      return `${title}${quantity}`;
    })
    .join(", ");
};

const BranchUsers = ({ mode }) => {
  const params = useParams();
  const resolvedMode = mode || params.mode || "teachers";
  const isPendingMode = resolvedMode === "approvals";
  const isStudents = resolvedMode === "students";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(isPendingMode ? "pending" : "");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);

  const pageTitle = useMemo(() => {
    if (isPendingMode) return "Pending Approvals";
    return isStudents ? "Students" : "Teachers";
  }, [isPendingMode, isStudents]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search, status: status || undefined };
      const response = isPendingMode
        ? await fetchPendingBranchUsers(params)
        : isStudents
          ? await fetchBranchStudents(params)
          : await fetchBranchTeachers(params);
      setUsers(response.users || []);
    } catch (error) {
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [isPendingMode, isStudents, search, status]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetails(null);
  };

  const openDetails = async (user) => {
    const userId = user._id || user.id;
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const response = await fetchBranchUserDetails(userId);
      setDetails(response);
    } catch (error) {
      toast.error(error.message || "Failed to load user details");
      closeDetails();
    } finally {
      setDetailsLoading(false);
    }
  };

  const requestReason = (label) => {
    const reason = window.prompt(label);
    return reason?.trim() || "";
  };

  const handleAction = async (user, action) => {
    const userId = user._id || user.id;
    setProcessing(`${action}-${userId}`);
    try {
      if (action === "approve") {
        await approveBranchUser(userId);
        toast.success("User approved");
      } else if (action === "reject") {
        const reason = requestReason("Reason for rejection");
        if (!reason) return;
        await rejectBranchUser(userId, reason);
        toast.success("User rejected");
      } else if (action === "remove") {
        const reason = requestReason("Reason for removing this user from the branch");
        await removeBranchUser(userId, reason);
        toast.success("User removed from branch");
      }
      loadUsers();
    } catch (error) {
      toast.error(error.message || "Action failed");
    } finally {
      setProcessing("");
    }
  };

  return (
    <div className="space-y-6">
      {detailsOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-28 pb-10 overflow-y-auto">
          <div className="flex w-full max-w-3xl max-h-[calc(100vh-8rem)] flex-col rounded-2xl border border-white/10 bg-[#0B0F1E] shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5D26A]">
                  Member Details
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {details?.user?.fullName || "Loading..."}
                </h2>
                {details?.user?.email && (
                  <p className="mt-1 text-sm text-gray-400">{details.user.email}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/15">
                Close
              </button>
            </div>

            <div className="flex-1 px-6 py-6 overflow-y-auto overscroll-contain">
              {detailsLoading ? (
                <div className="flex justify-center py-10">
                  <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailsRow label="Role" value={details?.user?.role} />
                    <DetailsRow
                      label="Approval Status"
                      value={details?.user?.approvalStatus}
                    />
                    <DetailsRow
                      label="Branch Membership"
                      value={details?.membership?.status}
                    />
                    <DetailsRow
                      label="Phone"
                      value={details?.profile?.phone || details?.teacherProfile?.phone}
                    />
                  </div>

                  {details?.user?.role === "student" && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <h3 className="text-sm font-semibold text-white">
                        Student Profile
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <DetailsRow
                          label="Location"
                          value={[
                            details?.profile?.location?.city,
                            details?.profile?.location?.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        />
                        <DetailsRow label="Age Group" value={details?.profile?.ageGroup} />
                        <DetailsRow
                          label="Current Status"
                          value={details?.profile?.currentStatus}
                        />
                        <DetailsRow
                          label="Preferred Program"
                          value={details?.profile?.preferredProgram}
                        />
                        <DetailsRow label="Headline" value={details?.profile?.headline} />
                        <DetailsRow label="Goals" value={details?.profile?.goals} />
                        <DetailsRow
                          label="Skills"
                          value={Array.isArray(details?.profile?.skills) ? details.profile.skills.join(", ") : ""}
                        />
                        <DetailsRow label="Resume URL" value={details?.profile?.resumeUrl} />
                        <DetailsRow
                          label="Portfolio URL"
                          value={details?.profile?.portfolioUrl}
                        />
                        <DetailsRow
                          label="LinkedIn URL"
                          value={details?.profile?.linkedinUrl}
                        />
                      </div>
                    </div>
                  )}

                  {details?.user?.role === "student" && (
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-white">
                              Courses
                            </h3>
                            <p className="mt-1 text-xs text-gray-400">
                              Enrollments tracked for this student.
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-400">
                            <div>Total: {details?.activity?.enrollments?.total ?? 0}</div>
                            <div>Branch: {details?.activity?.enrollments?.branchTotal ?? 0}</div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(details?.activity?.enrollments?.recent || []).length === 0 ? (
                            <p className="text-sm text-gray-500">No enrollments yet.</p>
                          ) : (
                            (details?.activity?.enrollments?.recent || []).slice(0, 10).map((enrollment) => (
                              <div
                                key={enrollment._id}
                                className="rounded-xl border border-white/10 bg-[#111] p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">
                                      {enrollment.course?.title || "Course"}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                      Status: {enrollment.status || "active"}
                                      {enrollment.course?.status ? ` | Course: ${enrollment.course.status}` : ""}
                                    </p>
                                  </div>
                                  <div className="text-right text-xs text-gray-500">
                                    <div>{formatDateTime(enrollment.enrolledAt || enrollment.createdAt)}</div>
                                    {enrollment.lastAccessedAt && (
                                      <div className="mt-1">Last: {formatDateTime(enrollment.lastAccessedAt)}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h3 className="text-sm font-semibold text-white">Purchases</h3>
                        <p className="mt-1 text-xs text-gray-400">
                          Completed payments recorded for this student.
                        </p>

                        <div className="mt-4 space-y-4">
                          <div className="rounded-xl border border-white/10 bg-[#111] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                              Course Payments
                            </p>
                            <div className="mt-3 space-y-3">
                              {(details?.activity?.payments?.recentCoursePayments || []).length === 0 ? (
                                <p className="text-sm text-gray-500">No course payments found.</p>
                              ) : (
                                (details?.activity?.payments?.recentCoursePayments || []).slice(0, 6).map((payment) => (
                                  <div key={payment._id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                                    <p className="text-sm font-semibold text-white">
                                      {payment.course?.title || "Course payment"}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                      {payment.amount} {payment.currency || "INR"} • {formatDateTime(payment.createdAt)}
                                    </p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-[#111] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                              Book Purchases
                            </p>
                            <div className="mt-3 space-y-3">
                              {(details?.activity?.bookPurchases?.recentPayments || []).length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  No book purchases found in payment metadata.
                                </p>
                              ) : (
                                (details?.activity?.bookPurchases?.recentPayments || []).slice(0, 6).map((payment) => (
                                  <div key={payment._id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                                    <p className="text-sm font-semibold text-white">
                                      {payment.metadata?.itemName || payment.metadata?.type || "Book purchase"}
                                    </p>
                                    {renderPaymentItems(payment) && (
                                      <p className="mt-1 text-xs text-gray-400">
                                        Items: {renderPaymentItems(payment)}
                                      </p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-400">
                                      {payment.amount} {payment.currency || "INR"} • {formatDateTime(payment.createdAt)}
                                    </p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {details?.user?.role === "teacher" && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <h3 className="text-sm font-semibold text-white">
                        Teacher Profile
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <DetailsRow
                          label="Expertise"
                          value={details?.teacherProfile?.expertise}
                        />
                        <DetailsRow
                          label="Experience (Years)"
                          value={details?.teacherProfile?.experienceYears}
                        />
                        <DetailsRow
                          label="Subjects"
                          value={Array.isArray(details?.teacherProfile?.primarySubjects)
                            ? details.teacherProfile.primarySubjects.join(", ")
                            : ""}
                        />
                        <DetailsRow
                          label="Certifications"
                          value={Array.isArray(details?.teacherProfile?.certifications)
                            ? details.teacherProfile.certifications.join(", ")
                            : ""}
                        />
                        <DetailsRow
                          label="Portfolio"
                          value={details?.teacherProfile?.portfolioLink}
                        />
                        <DetailsRow
                          label="LinkedIn"
                          value={details?.teacherProfile?.linkedin || details?.teacherProfile?.socials?.linkedin}
                        />
                        <DetailsRow
                          label="Website"
                          value={details?.teacherProfile?.website || details?.teacherProfile?.socials?.website}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F5D26A]">
          Member Management
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{pageTitle}</h1>
        <p className="mt-2 text-sm text-gray-400">
          Review branch-linked teachers and students without affecting independent users.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-white/10 bg-[#111] px-10 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No branch-linked users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const userId = user._id || user.id;
                  const statusValue = user.approvalStatus || (user.isActive ? "approved" : "pending");
                  return (
                    <tr key={userId} className="border-b border-white/5 text-sm">
                      <td className="py-4 pr-4 font-semibold text-white">{user.fullName}</td>
                      <td className="py-4 pr-4 text-gray-300">{user.email}</td>
                      <td className="py-4 pr-4 text-gray-400">{user.role}</td>
                      <td className="py-4 pr-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[statusValue] || statusClass.pending}`}>
                          {statusValue}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(user)}
                            className="rounded-lg bg-white/10 p-2 text-gray-200 hover:bg-white/15">
                            <FaEye className="h-4 w-4" />
                          </button>
                          {statusValue !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleAction(user, "approve")}
                              disabled={processing === `approve-${userId}`}
                              className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50">
                              <FaCheck className="h-4 w-4" />
                            </button>
                          )}
                          {statusValue !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleAction(user, "reject")}
                              disabled={processing === `reject-${userId}`}
                              className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30 disabled:opacity-50">
                              <FaTimes className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAction(user, "remove")}
                            disabled={processing === `remove-${userId}`}
                            className="rounded-lg bg-white/10 p-2 text-gray-300 hover:bg-white/15 disabled:opacity-50">
                            <FaUserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchUsers;
