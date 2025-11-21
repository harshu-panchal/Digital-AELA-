import { useMemo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { FaTrophy } from "react-icons/fa";
import { HiOutlineArrowLeft, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useUser } from "../../../src/contexts/UserContext";
import { useNavigate } from "react-router-dom";

const FullLeaderboard = () => {
  const {
    followers,
    following,
    refreshSocialStats,
  } = useUser();

  const navigate = useNavigate();
  const hasRefreshedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("coins"); // "coins" or "rating"

  // Refresh social stats once when component mounts
  useEffect(() => {
    if (refreshSocialStats && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshSocialStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for coin earning events to refresh leaderboard
  useEffect(() => {
    const handleCoinEarned = () => {
      if (refreshSocialStats) {
        refreshSocialStats();
      }
    };

    window.addEventListener("quizCompleted", handleCoinEarned);
    window.addEventListener("coinsEarned", handleCoinEarned);
    window.addEventListener("transactionCompleted", handleCoinEarned);

    return () => {
      window.removeEventListener("quizCompleted", handleCoinEarned);
      window.removeEventListener("coinsEarned", handleCoinEarned);
      window.removeEventListener("transactionCompleted", handleCoinEarned);
    };
  }, [refreshSocialStats]);

  // Combine followers and following lists, removing duplicates and preserving totalEarned
  const combinedFollowersFollowing = useMemo(() => {
    const followersMap = new Map();
    
    // Add followers first, preserving totalEarned
    followers.forEach((follower) => {
      const id = follower.id || follower.userId;
      if (id) {
        followersMap.set(id, { 
          ...follower, 
          relationshipType: "follower",
          totalEarned: follower.totalEarned || 0
        });
      }
    });
    
    // Add following, preserving followers if they already exist (mutual)
    following.forEach((followedUser) => {
      const id = followedUser.id || followedUser.userId;
      if (id) {
        const existing = followersMap.get(id);
        if (existing) {
          // This is a mutual connection - preserve the higher totalEarned
          const maxEarned = Math.max(
            existing.totalEarned || 0,
            followedUser.totalEarned || 0
          );
          followersMap.set(id, { 
            ...existing, 
            ...followedUser,
            relationshipType: "mutual",
            totalEarned: maxEarned
          });
        } else {
          followersMap.set(id, { 
            ...followedUser, 
            relationshipType: "following",
            totalEarned: followedUser.totalEarned || 0
          });
        }
      }
    });
    
    return Array.from(followersMap.values());
  }, [followers, following]);

  // Filter and sort leaderboard
  const sortedLeaderboard = useMemo(() => {
    let filtered = [...combinedFollowersFollowing].filter((user) => {
      if (user.totalEarned === undefined || user.totalEarned === null) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(query);
        const userIdMatch = user.id?.toLowerCase().includes(query) || user.userId?.toLowerCase().includes(query);
        if (!nameMatch && !userIdMatch) {
          return false;
        }
      }

      return true;
    });

    // Sort by selected criteria
    filtered.sort((a, b) => {
      if (sortBy === "coins") {
        const aEarned = a.totalEarned || 0;
        const bEarned = b.totalEarned || 0;
        return bEarned - aEarned; // Descending order
      } else if (sortBy === "rating") {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        return bRating - aRating; // Descending order
      }
      return 0;
    });

    return filtered;
  }, [combinedFollowersFollowing, searchQuery, sortBy]);

  const getRankIcon = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getRankColor = (index) => {
    if (index === 0) return "text-yellow-400";
    if (index === 1) return "text-gray-300";
    if (index === 2) return "text-amber-600";
    return "text-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-[#151515] p-2 text-gray-200 transition hover:text-white">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              Leaderboard
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Top earners in the Learn & Earn community
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1f1f1f] via-[#0c0c0c] to-black p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or user ID..."
              className="w-full rounded-2xl border border-white/10 bg-[#101010] py-3 pl-12 pr-4 text-sm text-gray-100 outline-none transition focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#101010] px-4 py-2.5 text-sm text-gray-100 outline-none transition focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20">
              <option value="coins">Most Coins</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#111] via-[#090909] to-black p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
            {sortedLeaderboard.length} {sortedLeaderboard.length === 1 ? "Member" : "Members"}
          </p>
          <FaTrophy className="h-5 w-5 text-[#D4AF37]" />
        </div>

        {sortedLeaderboard.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#141414]/80 px-6 py-12 text-center">
            <FaTrophy className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <p className="text-sm font-medium text-gray-300">
              {searchQuery.trim()
                ? `No members found matching "${searchQuery}"`
                : "No leaderboard data available yet."}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {searchQuery.trim()
                ? "Try adjusting your search criteria"
                : "Follow users to see their earnings!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLeaderboard.map((user, index) => {
              const totalEarned = user.totalEarned || 0;
              const rating = user.rating || 0;
              const userId = user.id || user.userId;
              const avatar = user.avatar || `https://i.pravatar.cc/150?img=${userId?.slice(-2) || index}`;

              return (
                <Motion.div
                  key={userId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group">
                  <Link
                    to={`/learn-earn/user/${userId}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#141414]/80 px-4 py-4 transition hover:border-[#D4AF37]/30 hover:bg-[#1a1a1a] sm:px-6">
                    {/* Rank */}
                    <div className={`flex-shrink-0 text-lg font-bold ${getRankColor(index)}`}>
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar */}
                    <img
                      src={avatar}
                      alt={user.name || "User"}
                      className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-[#D4AF37]/30 object-cover transition group-hover:border-[#D4AF37]/60 sm:h-14 sm:w-14"
                    />

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate sm:text-base">
                          {user.name || "Unknown User"}
                        </p>
                        {user.relationshipType === "mutual" && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            Mutual
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span className="truncate">{userId}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-[#D4AF37]">
                          Earned {totalEarned.toLocaleString()} coins
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-[#D4AF37]">
                          ⭐ {rating.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {totalEarned.toLocaleString()} coins
                        </p>
                      </div>
                    </div>
                  </Link>
                </Motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullLeaderboard;
