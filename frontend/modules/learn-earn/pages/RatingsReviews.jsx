import { useMemo, useState, useEffect, useCallback } from "react";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaStar, FaMedal, FaSpinner, FaSearch, FaTimes, FaUserCheck } from "react-icons/fa";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { useUser } from "../../../src/contexts/UserContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { searchLearners as searchLearnersAPI } from "../../../src/services/api/learnEarn";
import { fetchFollowing, fetchFollowers } from "../../../src/services/api/social";
import TranslatedText from "../../../src/components/TranslatedText";
import {
  submitUserRating,
  getUserRatings,
  getUserRatingStats,
} from "../../../src/services/api/userRating";

const ratingTags = [
  { label: "Inspiring Mentor", color: "bg-emerald-500/20 text-emerald-200" },
  { label: "Good Speaker", color: "bg-[#D4AF37]/20 text-[#D4AF37]" },
  { label: "Needs Improvement", color: "bg-rose-500/20 text-rose-200" },
  { label: "Supportive Listener", color: "bg-sky-500/20 text-sky-200" },
];

const RatingsReviews = () => {
  const { ratings, followers, following, profile } = useUser();
  const { user: authUser } = useAuth();
  const [selectedTag, setSelectedTag] = useState(ratingTags[0].label);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userRatings, setUserRatings] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [mutualFollows, setMutualFollows] = useState(new Set());

  // Provide safe defaults to prevent errors during initial load
  const safeProfile = profile || { id: "", name: "", avatar: "", badges: [] };
  const safeRatings = ratings || { average: 0, votes: 0, tags: [] };
  const safeFollowers = followers || [];
  const safeFollowing = following || [];

  // Calculate tag stats from ratings context (fallback)
  const tagStats = useMemo(() => {
    if (safeRatings?.tags && Array.isArray(safeRatings.tags)) {
      return safeRatings.tags.sort((a, b) => b.count - a.count);
    }
    return [];
  }, [safeRatings.tags]);

  // Calculate mutual follows
  useEffect(() => {
    if (safeFollowers.length > 0 && safeFollowing.length > 0) {
      const followersSet = new Set(safeFollowers.map((f) => f?.id || f?.userId));
      const followingSet = new Set(safeFollowing.map((f) => f?.id || f?.userId));
      const mutual = new Set();
      followersSet.forEach((id) => {
        if (followingSet.has(id)) {
          mutual.add(id);
        }
      });
      setMutualFollows(mutual);
    }
  }, [followers, following]);

  // Load ratings for current user
  useEffect(() => {
    const loadRatings = async () => {
      if (!authUser?.id) return;

      setLoadingRatings(true);
      try {
        const [ratingsData, statsData] = await Promise.all([
          getUserRatings(authUser.id),
          getUserRatingStats(authUser.id),
        ]);

        if (ratingsData?.ratings) {
          setUserRatings(ratingsData.ratings);
        }
        if (statsData) {
          setRatingStats(statsData);
        }
      } catch (error) {
        console.warn("Failed to load ratings:", error);
      } finally {
        setLoadingRatings(false);
      }
    };

    loadRatings();
  }, [authUser]);

  // Search for users
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await searchLearnersAPI({
        q: query.trim(),
        page: 1,
        pageSize: 20,
      });

      if (response?.learners) {
        // Filter to only show users with mutual follow
        const filtered = response.learners.filter((learner) => {
          const learnerId = learner.id || learner.userId;
          return learnerId !== authUser?.id && mutualFollows.has(learnerId);
        });
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [authUser, mutualFollows]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error("Please select a user to rate");
      return;
    }

    if (!authUser?.id) {
      toast.error("Please log in to submit a rating");
      return;
    }

    const selectedUserId = selectedUser.id || selectedUser.userId;
    if (selectedUserId === authUser.id) {
      toast.error("You cannot rate yourself");
      return;
    }

    // Check mutual follow
    if (!mutualFollows.has(selectedUserId)) {
      toast.error("You must follow each other to rate this user");
      return;
    }

    setSubmitting(true);
    try {
      // Convert tag label to array and determine rating value
      // Map tags to rating values (positive tags = higher rating)
      const tagToRating = {
        "Inspiring Mentor": 5,
        "Good Speaker": 4,
        "Supportive Listener": 4,
        "Needs Improvement": 2,
      };
      const ratingValue = tagToRating[selectedTag] || 3;

      await submitUserRating(selectedUserId, ratingValue, [selectedTag], "");

      toast.success(`Rating submitted for ${selectedUser.name || selectedUser.fullName}!`, {
        icon: "⭐",
      });

      // Reload ratings
      const [ratingsData, statsData] = await Promise.all([
        getUserRatings(authUser.id),
        getUserRatingStats(authUser.id),
      ]);

      if (ratingsData?.ratings) {
        setUserRatings(ratingsData.ratings);
      }
      if (statsData) {
        setRatingStats(statsData);
      }

      // Clear selection
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      const errorMessage =
        error.details?.error?.message ||
        error.message ||
        "Failed to submit rating. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-3">
        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#161616] via-[#0c0c0c] to-black p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Community rating</p>
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-5xl font-semibold text-white">
                {ratingStats?.averageRating?.toFixed(1) || safeRatings.average.toFixed(1)}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Based on {ratingStats?.totalRatings || safeRatings.votes}{" "}
                {(ratingStats?.totalRatings || safeRatings.votes) === 1 ? "rating" : "ratings"}
                {!ratingStats && ` (quiz ${safeRatings.votes === 1 ? "attempt" : "attempts"})`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {safeProfile.badges && safeProfile.badges.length > 0 ? (
                  safeProfile.badges.map((badge) => (
                  <span key={badge.id} className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Complete more quizzes to earn badges</p>
                )}
              </div>
            </div>
            <div className="relative h-28 w-28">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#1f1f1f" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#D4AF37"
                  strokeWidth="8"
                  strokeDasharray={`${((ratingStats?.averageRating || safeRatings.average) / 5) * 283} 283`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FaStar className="h-6 w-6 text-[#D4AF37]" />
                <p className="mt-1 text-xs text-gray-300">Top 5%</p>
              </div>
            </div>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Rate a learner</p>
          <div className="mt-4 space-y-3 text-xs text-gray-300">
            {/* User Search */}
            <div>
              <label className="block mb-2 text-xs font-semibold text-gray-300">
                Search for a user to rate
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full rounded-lg border border-white/10 bg-[#111] py-2 pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setSelectedUser(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    <FaTimes className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Search Results */}
              {searchLoading && (
                <div className="mt-2 flex items-center justify-center py-4">
                  <FaSpinner className="h-4 w-4 animate-spin text-[#D4AF37]" />
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-white/5 bg-[#111] p-2">
                  {searchResults.map((learner) => {
                    const learnerId = learner.id || learner.userId;
                    const isSelected = selectedUser && (selectedUser.id || selectedUser.userId) === learnerId;
                    return (
                      <button
                        key={learnerId}
                        type="button"
                        onClick={() => setSelectedUser(learner)}
                        className={`w-full rounded-lg border p-2 text-left transition ${
                          isSelected
                            ? "border-[#D4AF37]/50 bg-[#D4AF37]/10"
                            : "border-white/5 bg-[#0a0a0a] hover:border-white/10"
                        }`}>
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              learner.avatar ||
                              learner.avatarUrl ||
                              `https://i.pravatar.cc/150?img=${learnerId.slice(-2)}`
                            }
                            alt={learner.name || learner.fullName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-white">
                              {learner.name || learner.fullName || "Unknown"}
                            </p>
                            <p className="text-[10px] text-gray-400">{learnerId}</p>
                          </div>
                          <FaUserCheck className="h-3 w-3 text-emerald-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!searchLoading && searchQuery && searchResults.length === 0 && (
                <p className="mt-2 text-[10px] text-gray-500">
                  No mutually followed users found. Make sure you follow each other.
                </p>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="mt-3 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          selectedUser.avatar ||
                          selectedUser.avatarUrl ||
                          `https://i.pravatar.cc/150?img=${(selectedUser.id || selectedUser.userId).slice(-2)}`
                        }
                        alt={selectedUser.name || selectedUser.fullName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {selectedUser.name || selectedUser.fullName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {selectedUser.id || selectedUser.userId}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-gray-400 hover:text-white">
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Feedback Tag Selection */}
            {selectedUser && (
              <>
                <p className="mt-3">Select a feedback tag</p>
                <div className="flex flex-wrap gap-2">
                  {ratingTags.map((tag) => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => setSelectedTag(tag.label)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        selectedTag === tag.label
                          ? `${tag.color} ring-2 ring-[#D4AF37]/40`
                          : "bg-[#111] text-gray-300"
                      }`}>
                      {tag.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !selectedUser}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs font-semibold text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (
                    <>
                      <FaSpinner className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <HiOutlineChatBubbleOvalLeft className="h-4 w-4" /> Submit rating
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </Motion.div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Feedback insights</p>
          <div className="mt-4 space-y-3 text-sm text-gray-300">
            {loadingRatings ? (
              <div className="flex items-center justify-center py-4">
                <FaSpinner className="h-4 w-4 animate-spin text-[#D4AF37]" />
              </div>
            ) : ratingStats?.tagStats && ratingStats.tagStats.length > 0 ? (
              ratingStats.tagStats.map((tag) => (
                <div
                  key={tag.label}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#111] px-4 py-3">
                  <span>{tag.label}</span>
                  <span className="text-[#D4AF37]">{tag.count}</span>
                </div>
              ))
            ) : tagStats.length > 0 ? (
              tagStats.map((tag) => (
                <div
                  key={tag.label}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#111] px-4 py-3">
                  <span>{tag.label}</span>
                  <span className="text-[#D4AF37]">{tag.count}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No feedback yet</p>
            )}
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28, delay: 0.05 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Top supporters</p>
          <div className="mt-4 space-y-3 text-sm text-gray-300">
            {safeFollowers.slice(0, 3).map((follower, index) => (
              <div key={follower.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#111] px-4 py-3">
                <FaMedal className={`h-5 w-5 ${index === 0 ? "text-[#D4AF37]" : index === 1 ? "text-slate-300" : "text-amber-500"}`} />
                <div className="flex-1">
                  <p className="font-semibold text-white">{follower.name}</p>
                  <p className="text-xs text-gray-400">Coins shared {follower.coinsShared}</p>
                </div>
                <span className="text-xs text-[#D4AF37]">⭐ {follower.rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28, delay: 0.1 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Upgrade goals</p>
          <ul className="mt-4 space-y-3 text-xs text-gray-300">
            <li className="rounded-2xl border border-white/5 bg-[#111] px-4 py-3">Reach 500 reviews to unlock Platinum Mentor badge</li>
            <li className="rounded-2xl border border-white/5 bg-[#111] px-4 py-3">Collect 1,000 feedback coins for workshop spotlight</li>
            <li className="rounded-2xl border border-white/5 bg-[#111] px-4 py-3">Maintain 4.7+ rating for 30 days to earn AELA certification</li>
          </ul>
        </Motion.div>
      </section>

      {/* Received Ratings Section */}
      <section className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28 }}
          className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
              Received Ratings
            </p>
            {ratingStats && (
              <div className="flex items-center gap-2">
                <FaStar className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm font-semibold text-white">
                  {ratingStats.averageRating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-xs text-gray-400">
                  ({ratingStats.totalRatings || 0} {ratingStats.totalRatings === 1 ? "rating" : "ratings"})
                </span>
              </div>
            )}
          </div>

          {loadingRatings ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="h-6 w-6 animate-spin text-[#D4AF37]" />
            </div>
          ) : userRatings.length > 0 ? (
            <div className="space-y-3">
              {userRatings.map((rating) => (
                <div
                  key={rating.id}
                  className="rounded-2xl border border-white/5 bg-[#111] p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        rating.ratedBy?.avatar ||
                        `https://i.pravatar.cc/150?img=${rating.ratedBy?.id?.slice(-2) || "0"}`
                      }
                      alt={rating.ratedBy?.name || "User"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {rating.ratedBy?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(rating.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.round(rating.rating)
                                  ? "text-[#D4AF37]"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-sm font-semibold text-white">
                            {rating.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      {rating.tags && rating.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rating.tags.map((tag, idx) => {
                            const tagConfig = ratingTags.find((t) => t.label === tag);
                            return (
                              <span
                                key={idx}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  tagConfig?.color || "bg-gray-500/20 text-gray-300"
                                }`}>
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {rating.comment && (
                        <p className="mt-2 text-sm text-gray-300">{rating.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-[#111] p-8 text-center">
              <FaStar className="mx-auto h-12 w-12 text-gray-600" />
              <p className="mt-4 text-sm text-gray-400">No ratings received yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Start building your reputation by engaging with the community
              </p>
            </div>
          )}
        </Motion.div>
      </section>
    </div>
  );
};

export default RatingsReviews;


