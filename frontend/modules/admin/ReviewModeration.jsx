import { useState, useEffect } from "react";
import { FaStar, FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  getPendingReviews,
  moderateReview,
} from "../../src/services/api/reviews";
import RatingDisplay from "../business-management/common/RatingDisplay";

const ReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moderatingId, setModeratingId] = useState(null);

  useEffect(() => {
    loadPendingReviews();
  }, [page]);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await getPendingReviews({ page, pageSize: 20 });
      setReviews(response.reviews || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to load pending reviews:", error);
      toast.error("Failed to load pending reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (reviewId, action) => {
    try {
      setModeratingId(reviewId);
      await moderateReview(reviewId, action);
      toast.success(`Review ${action}d successfully`);
      loadPendingReviews();
    } catch (error) {
      toast.error(error.message || `Failed to ${action} review`);
    } finally {
      setModeratingId(null);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Moderation</h1>
          <p className="text-gray-400 mt-1">
            Approve or reject course reviews
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {reviews.length} pending review{reviews.length !== 1 ? "s" : ""}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#090D19]/95 p-12 text-center">
          <FaCheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Pending Reviews
          </h3>
          <p className="text-gray-400">
            All reviews have been moderated. Check back later for new submissions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-[#090D19]/95 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-semibold text-lg">
                      {review.student?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {review.student?.fullName || "Anonymous"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {review.student?.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RatingDisplay rating={review.rating} showNumber={false} />
                      <span className="text-sm text-gray-400">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Course:</div>
                    <div className="font-semibold text-white">
                      {review.course?.title || "Unknown Course"}
                    </div>
                  </div>

                  {review.review && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-2">Review:</div>
                      <p className="text-gray-300 whitespace-pre-wrap bg-[#0a0a0a] rounded-lg p-4 border border-white/5">
                        {review.review}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      Submitted:{" "}
                      {new Date(review.createdAt).toLocaleString()}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-green-400">
                        <FaCheckCircle />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleModerate(review._id, "approve")}
                    disabled={moderatingId === review._id}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                  >
                    {moderatingId === review._id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaCheckCircle />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleModerate(review._id, "reject")}
                    disabled={moderatingId === review._id}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                  >
                    {moderatingId === review._id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaTimesCircle />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-white/10 bg-transparent text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-white/10 bg-transparent text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewModeration;

