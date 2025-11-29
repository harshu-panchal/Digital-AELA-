import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  FaCoins,
  FaUsers,
  FaCommentDots,
  FaTrophy,
  FaBolt,
} from "react-icons/fa";
import {
  HiOutlineMicrophone,
  HiOutlineBellAlert,
  HiOutlineChatBubbleOvalLeft,
} from "react-icons/hi2";
import { useUser } from "../../../src/contexts/UserContext";
import { useSocket } from "../../../src/hooks/useSocket";
import { useAuth } from "../../../src/contexts/AuthContext";
import { fetchEnhancedLeaderboard } from "../../../src/services/api/learnEarn";
import { getUserRatingStats } from "../../../src/services/api/userRating";
import { FaSpinner } from "react-icons/fa";
import TranslatedText from "../../../src/components/TranslatedText";

const DashboardOverview = () => {
  const {
    profile,
    followers,
    following,
    messages,
    notifications,
    liveDebates,
    openRooms,
    totals,
    streak,
    setLiveDebates,
    refreshSocialStats,
  } = useUser();

  const { socket, isConnected } = useSocket();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("messages");
  const hasRefreshedRef = useRef(false);
  const [leaderboardSnapshot, setLeaderboardSnapshot] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [ratingStats, setRatingStats] = useState(null);

  // Provide safe defaults to prevent errors during initial load
  const safeProfile = profile || {
    id: "",
    name: "Loading...",
    avatar: "",
    rating: 0,
  };
  const safeTotals = totals || { current: 0, earned: 0, redeemed: 0 };
  const safeFollowers = followers || [];
  const safeFollowing = following || [];
  const safeMessages = messages || [];
  const safeNotifications = notifications || [];
  const safeLiveDebates = liveDebates || [];
  const safeOpenRooms = openRooms || [];

  // Refresh social stats once when component mounts (only once, not on every render)
  useEffect(() => {
    if (refreshSocialStats && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshSocialStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Load rating stats for current user
  useEffect(() => {
    const loadRatingStats = async () => {
      if (!authUser?.id) return;

      try {
        const statsData = await getUserRatingStats(authUser.id);
        // Set ratingStats even if averageRating is 0 (means no ratings yet)
        // The API returns { averageRating, totalRatings, tagStats, ratingDistribution }
        if (statsData) {
          setRatingStats(statsData);
        } else {
          setRatingStats(null);
        }
      } catch (error) {
        console.warn("Failed to load rating stats:", error);
        // Set to null to indicate loading failed
        setRatingStats(null);
      }
    };

    loadRatingStats();
  }, [authUser]);

  // Load leaderboard snapshot from backend
  useEffect(() => {
    const loadLeaderboardSnapshot = async () => {
      setLoadingLeaderboard(true);
      try {
        const response = await fetchEnhancedLeaderboard({
          type: "coins",
          period: "all",
          limit: 3, // Only top 3 for snapshot
        });

        if (response?.leaderboard) {
          // Map backend data to frontend format
          const mappedData = response.leaderboard.map((user) => ({
            id: user.userId || user.id,
            userId: user.userId || user.id,
            name: user.name || "Unknown User",
            avatar:
              user.avatar ||
              `https://i.pravatar.cc/150?img=${
                (user.userId || user.id)?.slice(-2) || "0"
              }`,
            totalEarned: user.totalEarned || user.totalCoins || 0,
            rating: user.rating || user.avgScore || 0,
            rank: user.rank || 0,
          }));

          setLeaderboardSnapshot(mappedData);
        } else {
          setLeaderboardSnapshot([]);
        }
      } catch (error) {
        console.error("Failed to load leaderboard snapshot:", error);
        setLeaderboardSnapshot([]);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    loadLeaderboardSnapshot();
  }, []);

  // Listen for coin earning events to refresh leaderboard
  useEffect(() => {
    const handleCoinEarned = () => {
      // Refresh followers and following lists when coins are earned
      if (refreshSocialStats) {
        refreshSocialStats();
      }
      // Reload leaderboard snapshot
      const loadLeaderboardSnapshot = async () => {
        try {
          const response = await fetchEnhancedLeaderboard({
            type: "coins",
            period: "all",
            limit: 3,
          });

          if (response?.leaderboard) {
            const mappedData = response.leaderboard.map((user) => ({
              id: user.userId || user.id,
              userId: user.userId || user.id,
              name: user.name || "Unknown User",
              avatar:
                user.avatar ||
                `https://i.pravatar.cc/150?img=${
                  (user.userId || user.id)?.slice(-2) || "0"
                }`,
              totalEarned: user.totalEarned || user.totalCoins || 0,
              rating: user.rating || user.avgScore || 0,
              rank: user.rank || 0,
            }));

            setLeaderboardSnapshot(mappedData);
          }
        } catch (error) {
          console.error("Failed to refresh leaderboard snapshot:", error);
        }
      };
      loadLeaderboardSnapshot();
    };

    // Listen for quiz completion (coins earned)
    window.addEventListener("quizCompleted", handleCoinEarned);

    // Listen for any coin earning events
    window.addEventListener("coinsEarned", handleCoinEarned);
    window.addEventListener("transactionCompleted", handleCoinEarned);

    return () => {
      window.removeEventListener("quizCompleted", handleCoinEarned);
      window.removeEventListener("coinsEarned", handleCoinEarned);
      window.removeEventListener("transactionCompleted", handleCoinEarned);
    };
  }, [refreshSocialStats]);

  // Real-time vote updates via Socket.io
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const handleVoteUpdate = (data) => {
      setLiveDebates((prev) =>
        prev.map((room) =>
          room.id === data.roomId
            ? {
                ...room,
                forVotes: data.forVotes || room.forVotes,
                againstVotes: data.againstVotes || room.againstVotes,
              }
            : room
        )
      );
    };

    socket.on("vote_update", handleVoteUpdate);

    return () => {
      socket.off("vote_update", handleVoteUpdate);
    };
  }, [socket, isConnected, setLiveDebates]);

  // Calculate real-time startInMinutes for each debate and update every minute
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute for startInMinutes calculation

    return () => clearInterval(interval);
  }, []);

  const debatesWithRealTime = useMemo(() => {
    const now = currentTime;
    return safeLiveDebates.map((room) => {
      // If scheduledStart is available, calculate from it in real-time
      if (room.scheduledStart) {
        const scheduledStart = new Date(room.scheduledStart);
        const diffMs = scheduledStart - now;
        const startInMinutes = Math.max(0, Math.floor(diffMs / 60000));
        return { ...room, startInMinutes };
      }
      // Otherwise use the startInMinutes from backend (will be updated on next refresh)
      return room;
    });
  }, [safeLiveDebates, currentTime]);

  // Calculate dynamic counts from backend data
  const unreadMessages = useMemo(
    () => safeMessages.reduce((sum, chat) => sum + (chat?.unread || 0), 0),
    [safeMessages]
  );

  // Combine followers and following lists, removing duplicates and preserving totalEarned
  const combinedFollowersFollowing = useMemo(() => {
    const followersMap = new Map();

    // Add followers first, preserving totalEarned
    safeFollowers.forEach((follower) => {
      const id = follower.id || follower.userId;
      if (id) {
        followersMap.set(id, {
          ...follower,
          relationshipType: "follower",
          totalEarned: follower.totalEarned || 0, // Ensure totalEarned is preserved
        });
      }
    });

    // Add following, preserving followers if they already exist (mutual)
    // If both exist, preserve the higher totalEarned value
    safeFollowing.forEach((followedUser) => {
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
            totalEarned: maxEarned,
          });
        } else {
          // You follow them but they don't follow you back
          followersMap.set(id, {
            ...followedUser,
            relationshipType: "following",
            totalEarned: followedUser.totalEarned || 0,
          });
        }
      }
    });

    return Array.from(followersMap.values());
  }, [safeFollowers, safeFollowing]);

  const followerCount = useMemo(
    () => combinedFollowersFollowing.length,
    [combinedFollowersFollowing]
  );
  // Get actual follower and following counts from arrays
  const actualFollowersCount = useMemo(
    () => safeFollowers.length,
    [safeFollowers]
  );
  const actualFollowingCount = useMemo(
    () => safeFollowing.length,
    [safeFollowing]
  );
  const notificationCount = useMemo(
    () =>
      safeNotifications.filter((n) => !n?.isRead && n?.type !== "archived")
        .length,
    [safeNotifications]
  );
  const liveRoomCount = useMemo(
    () => safeLiveDebates.length + safeOpenRooms.length,
    [safeLiveDebates, safeOpenRooms]
  );
  const totalCoins = safeTotals.current;

  const tabConfig = useMemo(
    () => [
      {
        id: "messages",
        label: <TranslatedText>Messages</TranslatedText>,
        count: unreadMessages,
        icon: FaCommentDots,
      },
      {
        id: "followers",
        label: <TranslatedText>Friends</TranslatedText>,
        count: followerCount,
        icon: FaUsers,
      },
      {
        id: "notifications",
        label: <TranslatedText>Notifications</TranslatedText>,
        count: notificationCount,
        icon: HiOutlineBellAlert,
      },
      {
        id: "wallet",
        label: <TranslatedText>Wallet</TranslatedText>,
        count: totalCoins,
        icon: FaCoins,
      },
      {
        id: "live",
        label: <TranslatedText>Live Groups</TranslatedText>,
        count: liveRoomCount,
        icon: HiOutlineMicrophone,
      },
    ],
    [
      unreadMessages,
      followerCount,
      notificationCount,
      totalCoins,
      liveRoomCount,
    ]
  );

  const tabRenderer = {
    messages: (
      <div className="auto-grid-sm">
        {safeMessages.map((chat) => (
          <Motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-white/5 bg-[#101010] p-5">
            <div className="flex items-start gap-3">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="h-12 w-12 rounded-full border border-[#D4AF37]/40 object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{chat.name}</p>
                  <span className="text-xs text-gray-400">
                    {chat.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-300">{chat.preview}</p>
                {chat.unread > 0 && (
                  <span className="mt-3 inline-flex rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold text-[#D4AF37]">
                    {chat.unread} <TranslatedText>unread</TranslatedText>
                  </span>
                )}
              </div>
            </div>
          </Motion.div>
        ))}
      </div>
    ),
    followers: (
      <div className="auto-grid-sm lg:grid-cols-3 lg:gap-6">
        {combinedFollowersFollowing.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/5 bg-linear-to-br from-[#101010] via-[#0c0c0c] to-[#050505] p-8 text-center">
            <p className="text-gray-400"><TranslatedText>No followers or following yet.</TranslatedText></p>
            <p className="mt-2 text-sm text-gray-500">
              <TranslatedText>Start following users to see them here!</TranslatedText>
            </p>
            <Link
              to="/learn-earn/find-learners"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-sm font-semibold text-black hover:brightness-110">
              <TranslatedText>Find Learners</TranslatedText>
            </Link>
          </div>
        ) : (
          combinedFollowersFollowing.map((user) => {
            const userId = user.id || user.userId;
            const relationshipLabel =
              user.relationshipType === "mutual"
                ? <TranslatedText>Mutual</TranslatedText>
                : user.relationshipType === "follower"
                ? <TranslatedText>Follows you</TranslatedText>
                : <TranslatedText>Following</TranslatedText>;

            return (
              <Motion.div
                key={userId}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.27 }}
                className="rounded-2xl border border-white/5 bg-linear-to-br from-[#101010] via-[#0c0c0c] to-[#050505] p-5">
                <div className="flex items-center gap-3">
                  <Link to={`/learn-earn/user/${userId}`}>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-12 w-12 rounded-full border border-[#D4AF37]/30 object-cover hover:border-[#D4AF37]/60 transition"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/learn-earn/user/${userId}`}
                      className="block hover:text-[#D4AF37] transition">
                      <p className="text-sm font-semibold text-white">
                        {user.name}
                      </p>
                    </Link>
                    <p className="text-[11px] text-gray-400">{userId}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        user.relationshipType === "mutual"
                          ? "bg-green-500/20 text-green-400"
                          : user.relationshipType === "follower"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}>
                      {relationshipLabel}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-300">
                  {user.tagline || user.headline || <TranslatedText>Learner</TranslatedText>}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>⭐ {(user.rating || 0).toFixed(1)}</span>
                  {user.mutuals !== undefined && (
                    <span>{user.mutuals} <TranslatedText>mutuals</TranslatedText></span>
                  )}
                  {user.coinsShared !== undefined && (
                    <span>{user.coinsShared} <TranslatedText>coins shared</TranslatedText></span>
                  )}
                </div>
                <Link
                  to={`/learn-earn/chat?userId=${userId}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2.5 text-xs font-semibold text-[#D4AF37] transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/20 active:scale-[0.98]">
                  <HiOutlineChatBubbleOvalLeft className="h-4 w-4" />
                  <TranslatedText>Messages</TranslatedText>
                </Link>
              </Motion.div>
            );
          })
        )}
      </div>
    ),
    notifications: (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {safeNotifications.map((notification) => (
          <Motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {notification.title}
                </p>
                {notification.description && (
                  <p className="mt-1 text-xs text-gray-400">
                    {notification.description}
                  </p>
                )}
                <p className="mt-2 text-[11px] uppercase tracking-wide text-[#D4AF37]/80">
                  {notification.time || notification.createdAt
                    ? new Date(
                        notification.createdAt || notification.time
                      ).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : <TranslatedText>Just now</TranslatedText>}
                </p>
              </div>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-[#D4AF37] flex-shrink-0 mt-1" />
              )}
            </div>
          </Motion.div>
        ))}
      </div>
    ),
    wallet: (
      <div className="auto-grid-sm md:grid-cols-2">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="rounded-2xl border border-[#D4AF37]/20 bg-[#101010] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/80">
            <TranslatedText>Balance</TranslatedText>
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {safeTotals.current.toLocaleString()}{" "}
            <span className="text-sm text-[#D4AF37]">AELA</span>
          </p>
          <div className="mt-6 space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span><TranslatedText>Total earned</TranslatedText></span>
              <span className="text-emerald-300">
                +{safeTotals.earned.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span><TranslatedText>Total redeemed</TranslatedText></span>
              <span className="text-rose-300">
                -{safeTotals.redeemed.toLocaleString()}
              </span>
            </div>
          </div>
        </Motion.div>
        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Quick actions</TranslatedText>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/learn-earn/wallet"
              className="inline-flex flex-1 min-w-[140px] items-center justify-between gap-2 rounded-xl bg-[#151515] px-4 py-3 text-sm font-semibold text-gray-200 transition hover:text-[#D4AF37]">
              <TranslatedText>Redeem</TranslatedText>
              <FaCoins className="h-4 w-4" />
            </Link>
            <Link
              to="/learn-earn/wallet"
              className="inline-flex flex-1 min-w-[140px] items-center justify-between gap-2 rounded-xl bg-[#151515] px-4 py-3 text-sm font-semibold text-gray-200 transition hover:text-[#D4AF37]">
              <TranslatedText>Send Coins</TranslatedText>
              <FaBolt className="h-4 w-4 text-[#D4AF37]" />
            </Link>
          </div>
          <p className="mt-6 text-[13px] text-gray-400">
            <TranslatedText>Daily streak:</TranslatedText>{" "}
            <span className="font-semibold text-emerald-300">
              {streak > 0
                ? <><TranslatedText>Active</TranslatedText> · {streak} {streak === 1 ? <TranslatedText>day</TranslatedText> : <TranslatedText>days</TranslatedText>}</>
                : <TranslatedText>Start your streak</TranslatedText>}
            </span>
          </p>
        </Motion.div>
      </div>
    ),
    live: (
      <div className="auto-grid-sm lg:grid-cols-2">
        {debatesWithRealTime.map((room) => (
          <Motion.div
            key={room.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-2xl border border-[#D4AF37]/15 bg-[#0f0f0f] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
              <TranslatedText>Live Debate</TranslatedText>
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {room.topic}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              {room.startInMinutes > 0
                ? <><TranslatedText>Starts in</TranslatedText> {room.startInMinutes} <TranslatedText>min</TranslatedText></>
                : room.status === "live"
                ? <TranslatedText>Live Now</TranslatedText>
                : <TranslatedText>Starting soon</TranslatedText>}{" "}
              · <TranslatedText>Hosts</TranslatedText> {room.speakers?.join(" & ") || <TranslatedText>TBD</TranslatedText>}
            </p>
          </Motion.div>
        ))}
        {safeOpenRooms.map((room) => (
          <Motion.div
            key={room.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-2xl border border-white/5 bg-[#101010] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              <TranslatedText>Open Room</TranslatedText>
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {room.title}
            </p>
            <p className="mt-1 text-sm text-gray-300"><TranslatedText>Host:</TranslatedText> {room.host}</p>
            <p className="mt-2 text-xs text-gray-500">
              <TranslatedText>Listeners online:</TranslatedText> {room.listeners}
            </p>
            <div className="mt-3 space-y-1 text-xs text-[#D4AF37]">
              {room.winners.map((item) => (
                <p key={item}>🏆 {item}</p>
              ))}
            </div>
          </Motion.div>
        ))}
      </div>
    ),
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-12">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-linear-to-br from-[#1a1a1a] via-[#101010] to-[#050505] p-6 lg:col-span-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-[#D4AF37]/10 to-transparent" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]/80">
                <TranslatedText>Good to see you</TranslatedText>
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                {safeProfile.name}
              </h1>
              <p className="mt-2 max-w-md text-sm text-gray-300">
                <TranslatedText>Keep the momentum going — your learners are engaging 14% more this week.</TranslatedText>
              </p>
            </div>
            <Motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-[#0f0f0f]/80 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/80">
                <TranslatedText>AELA Coins</TranslatedText>
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {totals.current.toLocaleString()}
                <span className="ml-1 text-sm text-[#D4AF37]"><TranslatedText>coins</TranslatedText></span>
              </p>
              <p className="mt-2 text-xs text-gray-400">
                +340 <TranslatedText>coins vs last week</TranslatedText>
              </p>
            </Motion.div>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-3 gap-3 text-center text-xs text-gray-300 sm:text-sm">
            <div className="rounded-2xl border border-white/10 bg-[#111]/80 p-4">
              <p className="text-[#D4AF37]"><TranslatedText>Friends</TranslatedText></p>
              <p className="mt-1 text-lg font-semibold text-white">
                {actualFollowersCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111]/80 p-4">
              <p className="text-[#D4AF37]"><TranslatedText>Following</TranslatedText></p>
              <p className="mt-1 text-lg font-semibold text-white">
                {actualFollowingCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111]/80 p-4">
              <p className="text-[#D4AF37]"><TranslatedText>Rating</TranslatedText></p>
              <p className="mt-1 text-lg font-semibold text-white">
                ⭐{" "}
                {ratingStats !== null &&
                ratingStats?.averageRating !== undefined
                  ? ratingStats.averageRating.toFixed(1)
                  : (safeProfile.rating || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-white/5 bg-linear-to-br from-[#111] via-[#090909] to-black p-6 lg:col-span-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
            <TranslatedText>Leaderboard snapshot</TranslatedText>
          </p>
          <div className="mt-4 space-y-3">
            {loadingLeaderboard ? (
              <div className="flex items-center justify-center py-6">
                <FaSpinner className="h-5 w-5 animate-spin text-[#D4AF37]" />
              </div>
            ) : leaderboardSnapshot.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-[#141414]/80 px-4 py-3 text-center text-sm text-gray-400">
                <TranslatedText>No leaderboard data available yet.</TranslatedText>
              </div>
            ) : (
              leaderboardSnapshot.map((user, index) => {
                const totalEarned = user.totalEarned || 0;
                return (
                  <div
                    key={user.id || user.userId}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#141414]/80 px-4 py-3">
                    <div className="text-xl text-[#D4AF37]">
                      {["🥇", "🥈", "🥉"][index]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        <TranslatedText>Earned</TranslatedText> {totalEarned.toLocaleString()} <TranslatedText>coins</TranslatedText>
                      </p>
                    </div>
                    <p className="text-xs text-[#D4AF37]">
                      ⭐ {(user.rating || 0).toFixed(1)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <Link
            to="/learn-earn/leaderboard"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] transition hover:text-[#E5C158]">
            <TranslatedText>See full leaderboard</TranslatedText> →
          </Link>
        </Motion.div>
      </section>

      <section>
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/5 bg-[#090909] p-2 sm:flex sm:flex-wrap">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3 text-[11px] transition sm:flex-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:text-xs md:text-sm ${
                  isActive
                    ? "bg-linear-to-r from-[#D4AF37]/20 to-[#E5C158]/20 text-[#D4AF37]"
                    : "text-gray-400 hover:text-white"
                }`}>
                <span className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <Icon
                    className={`h-5 w-5 sm:h-4 sm:w-4 ${
                      isActive ? "text-[#D4AF37]" : "text-gray-500"
                    }`}
                  />
                  <span className="text-[10px] sm:text-current sm:text-xs md:text-sm sm:inline hidden">
                    {tab.label}
                  </span>
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-[11px] ${
                    isActive
                      ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                      : "bg-[#111] text-gray-400"
                  }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">{tabRenderer[activeTab]}</div>
      </section>

      <div className="h-6" />
    </div>
  );
};

export default DashboardOverview;
