import { useState, useEffect } from "react";
import { FaStar, FaThumbsUp, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  getCourseReviews,
  getMyReview,
  deleteReview,
  markReviewHelpful,
} from "../../../src/services/api/reviews";
import ReviewForm from "./ReviewForm";
import RatingDisplay from "./RatingDisplay";
import { useAuth } from "../../../src/contexts/AuthContext";

const CourseReviews = ({ courseId }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRating, setSelectedRating] = useState(null);

  useEffect(() => {
    if (courseId) {
      loadReviews();
      if (isAuthenticated) {
        loadMyReview();
      }
    }
  }, [courseId, isAuthenticated, page, selectedRating]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await getCourseReviews(courseId, {
        page,
        pageSize: 10,
        rating: selectedRating,
      });

      setReviews(response.reviews || []);
      setRatingDistribution(response.ratingDistribution || ratingDistribution);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalReviews(response.pagination?.total || 0);

      // Calculate average rating
      const dist = response.ratingDistribution || {};
      const total = Object.values(dist).reduce((sum, count) => sum + count, 0);
      if (total > 0) {
        const weightedSum =
          (dist[5] || 0) * 5 +
          (dist[4] || 0) * 4 +
          (dist[3] || 0) * 3 +
          (dist[2] || 0) * 2 +
          (dist[1] || 0) * 1;
        setAverageRating(weightedSum / total);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const loadMyReview = async () => {
    try {
      const response = await getMyReview(courseId);
      setMyReview(response.review);
    } catch (error) {
      // User hasn't reviewed yet, that's okay
      setMyReview(null);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    try {
      await deleteReview(myReview._id);
      toast.success("Review deleted successfully");
      setMyReview(null);
      loadReviews();
    } catch (error) {
      toast.error(error.message || "Failed to delete review");
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await markReviewHelpful(reviewId);
      // Update local state
      setReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId
            ? { ...review, helpfulCount: (review.helpfulCount || 0) + 1 }
            : review
        )
      );
    } catch (error) {
      toast.error("Failed to mark review as helpful");
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    loadReviews();
    loadMyReview();
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
      {/* Rating Summary */}
      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#090D19]/95 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D4AF37]">
                {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
              </div>
              <RatingDisplay rating={averageRating} showNumber={false} size="lg" />
              <div className="text-sm text-gray-400 mt-1">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star] || 0;
                const percentage =
                  totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm text-gray-300">{star}</span>
                      <FaStar className="text-xs text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4AF37] transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form or My Review */}
      {isAuthenticated && (
        <div className="rounded-xl border border-[#D4AF37]/20 bg-[#090D19]/95 p-6">
          {showReviewForm ? (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                {myReview ? "Update Your Review" : "Write a Review"}
              </h3>
              <ReviewForm
                courseId={courseId}
                existingReview={myReview}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          ) : myReview ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <RatingDisplay rating={myReview.rating} />
                    <span className="text-sm text-gray-400">
                      {new Date(myReview.createdAt).toLocaleDateString()}
                    </span>
                    {myReview.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <FaCheckCircle />
                        Verified Purchase
                      </span>
                    )}
                    {myReview.status === "pending" && (
                      <span className="text-xs text-yellow-400">
                        (Pending Approval)
                      </span>
                    )}
                  </div>
                  {myReview.review && (
                    <p className="text-gray-300">{myReview.review}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-3 py-1 text-sm rounded-lg border border-white/10 bg-transparent text-white hover:bg-white/5 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteReview}
                    className="px-3 py-1 text-sm rounded-lg border border-red-500/50 bg-transparent text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full rounded-lg border border-[#D4AF37] bg-[#D4AF37]/10 px-4 py-3 font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/20"
            >
              Write a Review
            </button>
          )}
        </div>
      )}

      {/* Filter by Rating */}
      {totalReviews > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRating(null)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              selectedRating === null
                ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                : "border-white/10 bg-transparent text-gray-300 hover:bg-white/5"
            }`}
          >
            All Reviews
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedRating(star)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedRating === star
                  ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                  : "border-white/10 bg-transparent text-gray-300 hover:bg-white/5"
              }`}
            >
              {star} Star{star !== 1 ? "s" : ""} (
              {ratingDistribution[star] || 0})
            </button>
          ))}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-[#090D19]/95 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-semibold">
                    {review.student?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {review.student?.fullName || "Anonymous"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RatingDisplay rating={review.rating} showNumber={false} />
                  {review.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <FaCheckCircle />
                    </span>
                  )}
                </div>
              </div>

              {review.review && (
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">
                  {review.review}
                </p>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleMarkHelpful(review._id)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors"
                >
                  <FaThumbsUp />
                  Helpful ({review.helpfulCount || 0})
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#090D19]/95 p-6 text-center text-gray-400">
          {selectedRating
            ? `No ${selectedRating}-star reviews yet`
            : "No reviews yet. Be the first to review this course!"}
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

export default CourseReviews;

