import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaSpinner, FaArrowLeft, FaUser } from "react-icons/fa";
import { fetchUserDetailsById } from "../../../src/services/api/adminUsers";

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const response = await fetchUserDetailsById(userId);
        if (response?.user) {
          setUser(response.user);
          setDetails(response);
        }
      } catch (error) {
        toast.error(`Failed to load user: ${error.message}`);
        navigate("/super-admin");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUser();
    }
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-white">User not found</div>;
  }

  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleString();
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

  const studentActivity = user.role === "student" ? details?.activity : null;
  const instituteLabel = (() => {
    const isBranchUser = user?.branchJoinType === "branch";
    const instituteName = details?.branch?.instituteName;
    if (isBranchUser && instituteName) return instituteName;
    return "Individual";
  })();

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
        <FaArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/20">
            <FaUser className="h-10 w-10 text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-white">{user.fullName}</h1>
            <p className="mt-1 text-sm text-gray-400">{user.email}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  user.isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-gray-500/20 text-gray-400"
                }`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
              <span className="inline-flex rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">User ID</h3>
            <p className="text-sm text-white">{user._id || user.id}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Role</h3>
            <p className="text-sm text-white capitalize">{user.role}</p>
          </div>
          {(user.role === "student" || user.role === "teacher") && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-400">Institute</h3>
              <p className="text-sm text-white">{instituteLabel}</p>
            </div>
          )}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Email</h3>
            <p className="text-sm text-white">{user.email}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Status</h3>
            <p className="text-sm text-white">{user.isActive ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Joined</h3>
            <p className="text-sm text-white">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Last Updated</h3>
            <p className="text-sm text-white">{formatDate(user.updatedAt)}</p>
          </div>
        </div>
      </div>

      {user.role === "student" && (
        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Student Activity</h2>
              <p className="mt-1 text-sm text-gray-400">
                Courses enrolled and purchase history for this student.
              </p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <div>Total enrollments: {studentActivity?.enrollments?.total ?? 0}</div>
              {studentActivity?.enrollments?.branchTotal !== undefined && (
                <div>Branch enrollments: {studentActivity?.enrollments?.branchTotal ?? 0}</div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Courses Enrolled</h3>
                  <p className="mt-1 text-xs text-gray-400">Most recent enrollments.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(studentActivity?.enrollments?.recent || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No enrollments yet.</p>
                ) : (
                  (studentActivity?.enrollments?.recent || []).slice(0, 10).map((enrollment) => (
                    <div
                      key={enrollment._id || `${enrollment.student}-${enrollment.course?._id || enrollment.course}`}
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
              <p className="mt-1 text-xs text-gray-400">Completed payments recorded for this student.</p>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-[#111] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Course Payments</p>
                  <div className="mt-3 space-y-3">
                    {(studentActivity?.payments?.recentCoursePayments || []).length === 0 ? (
                      <p className="text-sm text-gray-500">No course payments found.</p>
                    ) : (
                      (studentActivity?.payments?.recentCoursePayments || []).slice(0, 6).map((payment) => (
                        <div key={payment._id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="text-sm font-semibold text-white">
                            {payment.course?.title || "Course payment"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {payment.amount} {payment.currency || "INR"} | {formatDateTime(payment.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#111] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Book Purchases</p>
                  <div className="mt-3 space-y-3">
                    {(studentActivity?.bookPurchases?.recentPayments || []).length === 0 ? (
                      <p className="text-sm text-gray-500">No book purchases found.</p>
                    ) : (
                      (studentActivity?.bookPurchases?.recentPayments || []).slice(0, 6).map((payment) => (
                        <div key={payment._id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="text-sm font-semibold text-white">
                            {payment.metadata?.itemName || payment.metadata?.type || "Book purchase"}
                          </p>
                          {renderPaymentItems(payment) && (
                            <p className="mt-1 text-xs text-gray-400">Items: {renderPaymentItems(payment)}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-400">
                            {payment.amount} {payment.currency || "INR"} | {formatDateTime(payment.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;

