import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaBook,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaReply,
  FaSearch,
  FaSpinner,
  FaStar,
  FaTrash,
} from "react-icons/fa";
import {
  clearAdminEbookRatingReply,
  fetchAdminEbookRatings,
  replyToAdminEbookRating,
  updateAdminEbookRatingStatus,
} from "../../../src/services/api/resources";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

const INITIAL_FILTERS = {
  search: "",
  status: "all",
  rating: "all",
  replyStatus: "all",
};

const EMPTY_SUMMARY = {
  total: 0,
  approved: 0,
  hidden: 0,
  replied: 0,
  unreplied: 0,
};

const formatDate = (date) => {
  if (!date) return "Not available";
  return new Date(date).toLocaleString();
};

const renderStars = (rating) => (
  <div className="flex items-center gap-1">
    {[...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-[#F5D26A]" : "text-slate-700"
        }`}
      />
    ))}
  </div>
);

const statusStyles = {
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  hidden: "border-red-400/30 bg-red-400/10 text-red-300",
};

const BookReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [activeActionId, setActiveActionId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetchAdminEbookRatings({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      });
      const nextReviews = response.reviews || [];

      setReviews(nextReviews);
      setSummary(response.summary || EMPTY_SUMMARY);
      setPagination((prev) => ({
        ...prev,
        ...(response.pagination || {}),
        totalPages: response.pagination?.totalPages || 1,
      }));
      setReplyDrafts((prev) => {
        const nextDrafts = { ...prev };
        nextReviews.forEach((review) => {
          if (nextDrafts[review.id] === undefined) {
            nextDrafts[review.id] = review.adminReply?.message || "";
          }
        });
        return nextDrafts;
      });
    } catch (error) {
      toast.error(error.message || "Failed to load book reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [
    pagination.page,
    pagination.pageSize,
    filters.search,
    filters.status,
    filters.rating,
    filters.replyStatus,
  ]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const updateReviewInList = (updatedReview) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === updatedReview.id ? updatedReview : review
      )
    );
  };

  const handleReplySubmit = async (reviewId) => {
    const message = (replyDrafts[reviewId] || "").trim();
    if (!message) {
      toast.info("Write a reply before saving");
      return;
    }

    setActiveActionId(reviewId);
    try {
      const response = await replyToAdminEbookRating(reviewId, message);
      updateReviewInList(response.review);
      setReplyDrafts((prev) => ({
        ...prev,
        [reviewId]: response.review.adminReply?.message || message,
      }));
      toast.success("Reply saved");
    } catch (error) {
      toast.error(error.message || "Failed to save reply");
    } finally {
      setActiveActionId(null);
    }
  };

  const handleReplyClear = async (reviewId) => {
    if (!window.confirm("Remove the admin reply from this book review?")) {
      return;
    }

    setActiveActionId(reviewId);
    try {
      const response = await clearAdminEbookRatingReply(reviewId);
      updateReviewInList(response.review);
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      toast.success("Reply removed");
    } catch (error) {
      toast.error(error.message || "Failed to remove reply");
    } finally {
      setActiveActionId(null);
    }
  };

  const handleStatusToggle = async (review) => {
    const nextStatus = review.status === "hidden" ? "approved" : "hidden";
    const label = nextStatus === "hidden" ? "hide" : "publish";

    if (!window.confirm(`Are you sure you want to ${label} this review?`)) {
      return;
    }

    setActiveActionId(review.id);
    try {
      const response = await updateAdminEbookRatingStatus(
        review.id,
        nextStatus
      );
      updateReviewInList(response.review);
      toast.success(response.message || "Review status updated");
      loadReviews();
    } catch (error) {
      toast.error(error.message || "Failed to update review status");
    } finally {
      setActiveActionId(null);
    }
  };

  const statCards = [
    { label: "Total Reviews", value: summary.total, tone: "text-white" },
    { label: "Visible", value: summary.approved, tone: "text-emerald-300" },
    { label: "Hidden", value: summary.hidden, tone: "text-red-300" },
    { label: "Replied", value: summary.replied, tone: "text-[#F5D26A]" },
    { label: "Needs Reply", value: summary.unreplied, tone: "text-sky-300" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1E] text-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#F5D26A]/80">
              Book Store
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              Book Review Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Review what users are saying about books, reply as Digital AELA,
              and hide reviews that should not appear publicly.
            </p>
          </div>
          <button
            onClick={loadReviews}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#F5D26A]/40 px-4 py-2 text-sm font-semibold text-[#F5D26A] transition hover:bg-[#F5D26A]/10">
            {loading ? <FaSpinner className="animate-spin" /> : <FaFilter />}
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-[#090D19]/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {card.label}
              </p>
              <p className={`mt-3 text-3xl font-bold ${card.tone}`}>
                {card.value || 0}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090D19]/95 p-4">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) =>
                  handleFilterChange("search", event.target.value)
                }
                placeholder="Search book, user, review, or reply"
                className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/60 focus:outline-none"
              />
            </div>
            <select
              value={filters.status}
              onChange={(event) =>
                handleFilterChange("status", event.target.value)
              }
              className="rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-3 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
              <option value="all">All visibility</option>
              <option value="approved">Visible only</option>
              <option value="hidden">Hidden only</option>
            </select>
            <select
              value={filters.rating}
              onChange={(event) =>
                handleFilterChange("rating", event.target.value)
              }
              className="rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-3 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
              <option value="all">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
            <select
              value={filters.replyStatus}
              onChange={(event) =>
                handleFilterChange("replyStatus", event.target.value)
              }
              className="rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-3 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
              <option value="all">All reply states</option>
              <option value="replied">Replied</option>
              <option value="unreplied">Needs reply</option>
            </select>
          </div>
        </div>

        {loading && reviews.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#090D19]/95 py-16">
            <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#090D19]/95 p-12 text-center">
            <FaCheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-300" />
            <h2 className="text-xl font-semibold text-white">
              No book reviews found
            </h2>
            <p className="mt-2 text-slate-400">
              Try changing filters or check again after users review books.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map((review, index) => (
              <motion.article
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#090D19]/95 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                  <div className="border-b border-white/10 bg-black/20 p-5 lg:border-b-0 lg:border-r">
                    <div className="flex gap-4">
                      <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0B0F1E]">
                        {review.ebook?.coverImage ? (
                          <img
                            src={getMediaUrl(review.ebook.coverImage)}
                            alt={review.ebook.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FaBook className="h-8 w-8 text-[#F5D26A]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Book
                        </p>
                        <Link
                          to={`/books/${review.ebook?.id}`}
                          target="_blank"
                          className="mt-1 block font-semibold text-white transition hover:text-[#F5D26A]">
                          {review.ebook?.title || "Unknown book"}
                        </Link>
                        <p className="mt-1 text-sm text-slate-400">
                          {review.ebook?.author || "Digital AELA"}
                        </p>
                        <span
                          className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            statusStyles[review.status] ||
                            statusStyles.approved
                          }`}>
                          {review.status === "hidden" ? "Hidden" : "Visible"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-white/10 bg-[#0B0F1E]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Reviewer
                      </p>
                      <p className="mt-2 font-semibold text-white">
                        {review.user?.name || "Anonymous"}
                      </p>
                      {review.user?.email && (
                        <p className="mt-1 break-all text-sm text-slate-400">
                          {review.user.email}
                        </p>
                      )}
                      <p className="mt-3 text-xs text-slate-500">
                        Submitted: {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 p-5 md:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          {renderStars(review.rating)}
                          <span className="text-sm text-slate-400">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-[#0B0F1E]/80 p-4 text-sm leading-6 text-slate-200">
                          {review.review || "User left a star rating without written feedback."}
                        </p>
                      </div>

                      <button
                        onClick={() => handleStatusToggle(review)}
                        disabled={activeActionId === review.id}
                        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                          review.status === "hidden"
                            ? "border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10"
                            : "border border-red-400/40 text-red-300 hover:bg-red-400/10"
                        }`}>
                        {activeActionId === review.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : review.status === "hidden" ? (
                          <FaEye />
                        ) : (
                          <FaEyeSlash />
                        )}
                        {review.status === "hidden" ? "Publish" : "Hide"}
                      </button>
                    </div>

                    {review.adminReply?.message && (
                      <div className="rounded-xl border border-[#F5D26A]/25 bg-[#F5D26A]/10 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[#F5D26A]">
                            Admin reply
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(review.adminReply.repliedAt)}
                          </p>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">
                          {review.adminReply.message}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Replied by{" "}
                          {review.adminReply.repliedBy?.name || "Admin"}
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <label
                        htmlFor={`reply-${review.id}`}
                        className="mb-2 block text-sm font-semibold text-white">
                        Reply to this book review
                      </label>
                      <textarea
                        id={`reply-${review.id}`}
                        value={replyDrafts[review.id] || ""}
                        onChange={(event) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [review.id]: event.target.value,
                          }))
                        }
                        rows={4}
                        maxLength={2000}
                        placeholder="Write a thoughtful public reply..."
                        className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] p-3 text-sm leading-6 text-white placeholder:text-slate-500 focus:border-[#F5D26A]/60 focus:outline-none"
                      />
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-slate-500">
                          {(replyDrafts[review.id] || "").length}/2000
                          characters
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {review.adminReply?.message && (
                            <button
                              onClick={() => handleReplyClear(review.id)}
                              disabled={activeActionId === review.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-60">
                              <FaTrash />
                              Remove Reply
                            </button>
                          )}
                          <button
                            onClick={() => handleReplySubmit(review.id)}
                            disabled={
                              activeActionId === review.id ||
                              !(replyDrafts[review.id] || "").trim()
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-[#F5D26A] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60">
                            {activeActionId === review.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaReply />
                            )}
                            Save Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#090D19]/95 p-4 sm:flex-row">
            <p className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.totalPages} -{" "}
              {pagination.total} reviews
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page <= 1}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50">
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookReviewManagement;
