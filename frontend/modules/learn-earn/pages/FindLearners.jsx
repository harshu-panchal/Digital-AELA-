import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUserPlus,
  HiOutlineChatBubbleOvalLeft,
  HiCheckCircle,
} from "react-icons/hi2";
import { FaSpinner } from "react-icons/fa";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useUser } from "../../../src/contexts/UserContext";
import { followUser, unfollowUser, fetchFollowing } from "../../../src/services/api/social";
import { searchLearners as searchLearnersAPI } from "../../../src/services/api/learnEarn";
import TranslatedText from "../../../src/components/TranslatedText";

const FindLearners = () => {
  const { user: authUser } = useAuth();
  const { refreshSocialStats } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(new Set());
  const [followingStatus, setFollowingStatus] = useState(new Map());

  const searchLearners = useCallback(async (query) => {
    if (!query.trim()) {
      setLearners([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchLearnersAPI({ 
        q: query.trim(), 
        page: 1, 
        pageSize: 50 
      });
      if (response?.learners) {
        setLearners(response.learners);
      } else {
        setLearners([]);
      }
    } catch (error) {
      console.error("Failed to search learners:", error);
      const errorMessage =
        error.details?.error?.message ||
        error.message ||
        "Failed to search learners. Please try again.";
      toast.error(errorMessage);
      setLearners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load following status for displayed learners
  useEffect(() => {
    const loadFollowingStatus = async () => {
      if (!authUser?.id || learners.length === 0) return;

      try {
        const response = await fetchFollowing(authUser.id, { page: 1, pageSize: 100 });
        const followingList = response?.data || [];
        
        if (followingList.length > 0) {
          const followingSet = new Set(
            followingList.map((user) => user.id || user._id || user.userId)
          );
          setFollowing(followingSet);
          
          const statusMap = new Map();
          learners.forEach((learner) => {
            const learnerId = learner.id || learner._id || learner.userId;
            statusMap.set(learnerId, followingSet.has(learnerId));
          });
          setFollowingStatus(statusMap);
        } else {
          // No following users, initialize all as false
          const statusMap = new Map();
          learners.forEach((learner) => {
            const learnerId = learner.id || learner._id || learner.userId;
            statusMap.set(learnerId, false);
          });
          setFollowingStatus(statusMap);
        }
      } catch (error) {
        console.error("Failed to load following status:", error);
        // Initialize all as false if API fails
        const statusMap = new Map();
        learners.forEach((learner) => {
          const learnerId = learner.id || learner._id || learner.userId;
          statusMap.set(learnerId, false);
        });
        setFollowingStatus(statusMap);
      }
    };

    loadFollowingStatus();
  }, [authUser, learners]);

  // Search when query changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchLearners(searchQuery);
      } else {
        setLearners([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchLearners]);

  const handleFollow = useCallback(
    async (learnerId, learnerName) => {
      if (!authUser?.id) {
        toast.error("Please log in to follow users");
        return;
      }

      if (learnerId === authUser.id) {
        toast.info("You cannot follow yourself");
        return;
      }

      const isFollowing = following.has(learnerId);
      const action = isFollowing ? unfollowUser : followUser;

      try {
        setFollowingStatus((prev) => {
          const next = new Map(prev);
          next.set(learnerId, !isFollowing);
          return next;
        });

        await action(learnerId);

        if (isFollowing) {
          setFollowing((prev) => {
            const next = new Set(prev);
            next.delete(learnerId);
            return next;
          });
          toast.success(`Unfollowed ${learnerName}`, { icon: "👋" });
        } else {
          setFollowing((prev) => new Set(prev).add(learnerId));
          toast.success(`Following ${learnerName}`, { icon: "✨" });
        }

        // Refresh social stats to update follower/following counts on profile page
        if (refreshSocialStats) {
          setTimeout(() => {
            refreshSocialStats();
          }, 500); // Small delay to ensure backend has updated
        }
      } catch (error) {
        // Revert optimistic update
        setFollowingStatus((prev) => {
          const next = new Map(prev);
          next.set(learnerId, isFollowing);
          return next;
        });

        console.error("Failed to follow/unfollow:", error);
        const errorMessage =
          error.details?.error?.message ||
          error.message ||
          `Failed to ${isFollowing ? "unfollow" : "follow"} user`;
        toast.error(errorMessage);
      }
    },
    [authUser, following]
  );

  const handleChat = useCallback(
    (userId) => {
      navigate(`/learn-earn/chat?userId=${userId}`);
    },
    [navigate]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            <TranslatedText>Find Learners</TranslatedText>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            <TranslatedText>Search for learners in the Learn & Earn community and connect with them</TranslatedText>
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1f1f1f] via-[#0c0c0c] to-black p-6">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, user ID, or interests..." // Placeholder
            className="w-full rounded-2xl border border-white/10 bg-[#101010] py-3 pl-12 pr-4 text-sm text-gray-100 outline-none transition focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <FaSpinner className="h-5 w-5 animate-spin text-[#D4AF37]" />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {learners.length === 0 && !loading && searchQuery.trim() && (
        <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-12 text-center">
          <HiOutlineMagnifyingGlass className="mx-auto h-12 w-12 text-gray-500" />
          <p className="mt-4 text-sm text-gray-400">
            <TranslatedText>No learners found matching</TranslatedText> "{searchQuery}"
          </p>
          <p className="mt-2 text-xs text-gray-500">
            <TranslatedText>Try searching with a different name or user ID</TranslatedText>
          </p>
        </div>
      )}

      {learners.length === 0 && !loading && !searchQuery.trim() && (
        <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-12 text-center">
          <HiOutlineUserPlus className="mx-auto h-12 w-12 text-gray-500" />
          <p className="mt-4 text-sm text-gray-400">
            <TranslatedText>Start searching to find learners in the community</TranslatedText>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            <TranslatedText>Enter a name, user ID, or interest to begin</TranslatedText>
          </p>
        </div>
      )}

      {learners.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {learners.map((learner, index) => {
            const learnerId = learner.id || learner._id || learner.userId;
            const isFollowingUser = followingStatus.get(learnerId) || false;
            const isCurrentUser = learnerId === authUser?.id;

            return (
              <Motion.div
                key={learnerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
                <div className="flex flex-col items-center gap-4">
                  <Link
                    to={`/learn-earn/user/${learnerId}`}
                    className="relative group">
                    <img
                      src={
                        learner.avatar ||
                        learner.avatarUrl ||
                        `https://i.pravatar.cc/150?img=${learnerId.slice(-2)}`
                      }
                      alt={learner.name || learner.fullName || "Learner"}
                      className="h-20 w-20 rounded-full border-2 border-[#D4AF37]/50 object-cover transition group-hover:border-[#D4AF37]"
                    />
                  </Link>
                  <div className="text-center">
                    <Link
                      to={`/learn-earn/user/${learnerId}`}
                      className="block text-lg font-semibold text-white hover:text-[#D4AF37] transition">
                      {learner.name || learner.fullName || "Unknown User"}
                    </Link>
                    <p className="mt-1 text-xs text-gray-400">{learnerId}</p>
                    {learner.title || learner.headline ? (
                      <p className="mt-2 text-sm text-gray-300">
                        {learner.title || learner.headline}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-wrap items-center justify-center gap-2">
                    {!isCurrentUser && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleFollow(learnerId, learner.name || learner.fullName)
                          }
                          disabled={followingStatus.get(learnerId) === undefined}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                            isFollowingUser
                              ? "border border-white/10 bg-[#151515] text-gray-300 hover:bg-[#1a1a1a]"
                              : "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black hover:brightness-110"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}>
                          {followingStatus.get(learnerId) === undefined ? (
                            <FaSpinner className="h-3 w-3 animate-spin" />
                          ) : isFollowingUser ? (
                            <>
                              <HiCheckCircle className="h-4 w-4" />
                              <TranslatedText>Following</TranslatedText>
                            </>
                          ) : (
                            <>
                              <HiOutlineUserPlus className="h-4 w-4" />
                              <TranslatedText>Follow</TranslatedText>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChat(learnerId)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#151515] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
                          <HiOutlineChatBubbleOvalLeft className="h-4 w-4" />
                          <TranslatedText>Message</TranslatedText>
                        </button>
                      </>
                    )}
                    {isCurrentUser && (
                      <span className="rounded-xl border border-white/10 bg-[#151515] px-4 py-2 text-xs font-semibold text-gray-500">
                        <TranslatedText>This is you</TranslatedText>
                      </span>
                    )}
                  </div>

                  {learner.bio && (
                    <p className="mt-2 line-clamp-2 text-center text-xs text-gray-400">
                      {learner.bio}
                    </p>
                  )}

                  {learner.interests && learner.interests.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {learner.interests.slice(0, 3).map((interest, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-gray-400">
                          #{interest}
                        </span>
                      ))}
                      {learner.interests.length > 3 && (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-gray-500">
                          +{learner.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FindLearners;

