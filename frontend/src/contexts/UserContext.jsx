/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { usePoints } from "./PointsContext";
import { useAuth } from "./AuthContext";
import { fetchSocialStats, fetchFollowers, fetchFollowing } from "../services/api/social";
import { fetchDashboardData } from "../services/api/learnEarn";
import { useSocket } from "../hooks/useSocket";
import { fetchConversations } from "../services/api/messages";
import { isNetworkError } from "../services/api/baseClient";
import { useSmartPolling } from "../hooks/useSmartPolling";

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

const defaultProfile = {
  id: "AELA0005690",
  name: "Imran Khan",
  avatar: "https://i.pravatar.cc/150?img=12",
  bannerGradient: "from-[#1f1f1f] via-[#111] to-black",
  title: "Founder · Digital AELA | Public Speaking Coach",
  bio: "Empowering learners to communicate with confidence while building meaningful careers across the globe.",
  englishLevel: "Advanced (C1)",
  country: "United Arab Emirates",
  city: "Dubai",
  education: "MBA · London Business School",
  profession: "Founder & Mentor",
  experience: "12 years of coaching & leadership",
  maritalStatus: "Married",
  interests: ["Public Speaking", "Leadership", "Storytelling", "Debates", "Gamified Learning"],
  followers: 18240,
  following: 642,
  coins: 0,
  rating: 4.6,
  badges: [
    { id: "coach", label: "Elite Coach", color: "bg-[#D4AF37]/20 text-[#D4AF37]" },
    { id: "mentor", label: "Community Mentor", color: "bg-emerald-500/15 text-emerald-300" },
    { id: "speaker", label: "Top Speaker", color: "bg-sky-500/15 text-sky-300" },
  ],
  socialLinks: [
    {
      platform: "LinkedIn",
      url: "https://linkedin.com/in/digitalaela",
      verified: true,
      bonus: 250,
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/@digitalaela",
      verified: true,
      bonus: 200,
    },
    {
      platform: "Instagram",
      url: "https://instagram.com/digitalaela",
      verified: false,
      bonus: 120,
    },
    {
      platform: "TikTok",
      url: "https://tiktok.com/@digitalaela",
      verified: false,
      bonus: 90,
    },
  ],
};

const defaultFollowers = [
  {
    id: "AELA000810",
    name: "Fatima Hassan",
    avatar: "https://i.pravatar.cc/150?img=47",
    tagline: "IELTS Band 8 · Debate Finalist",
    rating: 4.8,
    mutuals: 32,
    coinsShared: 480,
  },
  {
    id: "AELA000921",
    name: "Mohammed Ali",
    avatar: "https://i.pravatar.cc/150?img=22",
    tagline: "Corporate Trainer · Leadership Coach",
    rating: 4.7,
    mutuals: 18,
    coinsShared: 260,
  },
  {
    id: "AELA001104",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/150?img=32",
    tagline: "Content Strategist · Toastmasters Winner",
    rating: 4.9,
    mutuals: 28,
    coinsShared: 510,
  },
  {
    id: "AELA000654",
    name: "Omar Al Farsi",
    avatar: "https://i.pravatar.cc/150?img=15",
    tagline: "Career Coach · TEDx Speaker",
    rating: 4.5,
    mutuals: 11,
    coinsShared: 190,
  },
];

const defaultMessages = [
  {
    id: "chat-fatima",
    userId: "AELA000810",
    name: "Fatima Hassan",
    avatar: "https://i.pravatar.cc/150?img=47",
    preview: "Loved your session on storytelling!",
    unread: 2,
    timestamp: "15m",
    history: [
      {
        id: "m1",
        from: "them",
        content: "I just completed the listening challenge – earned 60 coins!",
        type: "text",
        time: "09:48",
      },
      {
        id: "m2",
        from: "me",
        content: "Brilliant! Let's co-host the next debate?",
        type: "text",
        time: "09:51",
      },
    ],
  },
  {
    id: "chat-mohammed",
    userId: "AELA000921",
    name: "Mohammed Ali",
    avatar: "https://i.pravatar.cc/150?img=22",
    preview: "Voice note: New corporate debate idea",
    unread: 0,
    timestamp: "1h",
    history: [
      {
        id: "m1",
        from: "them",
        content: "voice-message-link",
        type: "voice",
        duration: "0:56",
        time: "08:21",
      },
    ],
  },
  {
    id: "chat-priya",
    userId: "AELA001104",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/150?img=32",
    preview: "Sending you 80 coins for mentoring!",
    unread: 0,
    timestamp: "Yesterday",
    history: [
      {
        id: "m1",
        from: "them",
        content: "Sent 80 AELA coins · Keep inspiring!",
        type: "text",
        time: "22:14",
      },
    ],
  },
];

const defaultNotifications = [
  {
    id: "notif-1",
    title: "Coins received from Priya Sharma",
    description: "80 AELA coins added to your wallet.",
    time: "12m ago",
    type: "coins",
  },
  {
    id: "notif-2",
    title: "Live debate invitation",
    description: "Mohammed Ali invited you to the Career Growth debate.",
    time: "38m ago",
    type: "event",
  },
  {
    id: "notif-3",
    title: "New follower",
    description: "Sara Al Habsi started following you.",
    time: "1h ago",
    type: "social",
  },
];

const defaultTransactions = [
  {
    id: "txn-1",
    type: "earned",
    label: "Daily English Quiz",
    amount: 45,
    time: "Today · 09:20",
  },
  {
    id: "txn-2",
    type: "earned",
    label: "Vocabulary Blitz Champion",
    amount: 120,
    time: "Today · 08:05",
  },
  {
    id: "txn-3",
    type: "spent",
    label: "Gifted coins to Fatima",
    amount: 60,
    time: "Yesterday",
  },
  {
    id: "txn-4",
    type: "earned",
    label: "Mentor session bonus",
    amount: 300,
    time: "Tue",
  },
  {
    id: "txn-5",
    type: "redeemed",
    label: "Course discount applied",
    amount: 500,
    time: "Mon",
  },
];

const defaultGroups = [
  {
    id: "grp-public-speaking",
    name: "Public Speaking Mastery",
    type: "public",
    members: 243,
    topic: "Owning the stage with storytelling",
    nextEvent: "Live debate tomorrow",
  },
  {
    id: "grp-career-boost",
    name: "Career Boosters",
    type: "private",
    members: 96,
    topic: "Polished interview skills",
    nextEvent: "Mock interview room opens in 2h",
  },
];

const defaultLiveDebates = [
  {
    id: "debate-hybrid-work",
    topic: "Hybrid Work Builds Stronger Teams",
    forVotes: 64,
    againstVotes: 41,
    startInMinutes: 18,
    speakers: ["Fatima Hassan", "Mohammed Ali"],
  },
  {
    id: "debate-ai-communication",
    topic: "AI Will Replace Soft-Skill Training",
    forVotes: 28,
    againstVotes: 72,
    startInMinutes: 45,
    speakers: ["Priya Sharma", "Omar Al Farsi"],
  },
];

const defaultOpenRooms = [
  {
    id: "room-daily-debate",
    title: "Daily Debate Warm-up",
    host: "Sara Malik",
    listeners: 48,
    winners: ["Most Persuasive: Fatima", "Best Rebuttal: Omar"],
  },
  {
    id: "room-english-blitz",
    title: "English Fluency Blitz",
    host: "Imran Khan",
    listeners: 72,
    winners: ["Quick Thinker: Priya", "Audience Choice: Mohammed"],
  },
];

const defaultRatings = {
  average: 4.6,
  votes: 326,
  tags: [
    { label: "Inspiring Mentor", count: 142 },
    { label: "Good Speaker", count: 118 },
    { label: "Needs Improvement", count: 9 },
    { label: "Supportive Listener", count: 57 },
  ],
};

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const UserProvider = ({ children }) => {
  const { aelaPoints, addPoints, redeemPoints, totalEarned, totalRedeemed } = usePoints();
  const { user: authUser, tokens, updateUserMetadata, getRoleLabel } = useAuth();
  const { socket, isConnected } = useSocket();

  // Initialize with empty data in production, dummy data only in development
  const [profile, setProfile] = useState(() => 
    isDevelopment ? defaultProfile : { ...defaultProfile, followers: 0, following: 0, coins: 0 }
  );
  const [followers, setFollowers] = useState(() => isDevelopment ? defaultFollowers : []);
  const [following, setFollowing] = useState(() => isDevelopment ? defaultFollowers.slice(0, 3) : []);
  const [messages, setMessages] = useState(() => isDevelopment ? defaultMessages : []);
  const [notifications, setNotifications] = useState(() => isDevelopment ? defaultNotifications : []);
  const [transactions, setTransactions] = useState(() => isDevelopment ? defaultTransactions : []);
  const [groups, setGroups] = useState(() => isDevelopment ? defaultGroups : []);
  const [liveDebates, setLiveDebates] = useState(() => isDevelopment ? defaultLiveDebates : []);
  const [openRooms, setOpenRooms] = useState(() => isDevelopment ? defaultOpenRooms : []);
  const [ratings, setRatings] = useState(() => 
    isDevelopment ? defaultRatings : { average: 0, votes: 0, tags: [] }
  );
  const [socialStatsLoaded, setSocialStatsLoaded] = useState(false);
  const [streak, setStreak] = useState(0);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    setProfile((prev) => ({ ...prev, coins: aelaPoints }));
  }, [aelaPoints]);

  // Track if stats are currently loading to prevent duplicate calls
  const isLoadingSocialStatsRef = useRef(false);

  // Load social stats from backend (runs after profile is initialized)
  const loadSocialStats = useCallback(async () => {
      if (!authUser?.id) {
        return;
      }

    // Prevent duplicate simultaneous calls
    if (isLoadingSocialStatsRef.current) {
      return;
    }

    isLoadingSocialStatsRef.current = true;

      // Small delay to ensure profile is initialized first
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        // Pass userId to fetchSocialStats so it works even without tokens
        const stats = await fetchSocialStats(authUser.id);
        
        if (stats) {
          setProfile((prev) => {
            // Only update if we got valid data from backend
            const updated = { ...prev };
            
            // Use backend values even if 0 (means no data yet), only fallback if undefined/null
            if (stats.followers !== undefined && stats.followers !== null) {
              updated.followers = stats.followers;
            }
            if (stats.following !== undefined && stats.following !== null) {
              updated.following = stats.following;
            }
            if (stats.rating !== undefined && stats.rating !== null) {
              updated.rating = stats.rating;
            }
            
            return updated;
          });
          
          // Update ratings with quiz attempts count (totalRatings)
          if (stats.totalRatings !== undefined && stats.totalRatings !== null) {
            setRatings((prev) => ({
              ...prev,
              votes: stats.totalRatings, // This is now quiz attempts count
              average: stats.rating || prev.average,
            }));
          } else if (stats.rating !== undefined && stats.rating !== null) {
            setRatings((prev) => ({
              ...prev,
              average: stats.rating,
            }));
          }

          // Update badges from backend
          if (stats.badges && Array.isArray(stats.badges)) {
            setProfile((prev) => ({
              ...prev,
              badges: stats.badges.length > 0 ? stats.badges : prev.badges || [],
            }));
          }
          
          setSocialStatsLoaded(true);
        }
      } catch (error) {
        // Log errors appropriately based on environment
        if (isNetworkError(error)) {
          if (!isDevelopment) {
            // In production, log network errors to help debug API issues
            console.error("[UserContext] Failed to connect to API:", {
              message: error.message,
              code: error.code,
              url: import.meta.env.VITE_API_URL || "Not set - using default"
            });
          }
          setApiError("Unable to connect to server. Please check your connection.");
        } else {
          // eslint-disable-next-line no-console
          console.warn("Failed to load social stats from backend:", error);
        }
        // Keep existing values, don't reset to defaults
    } finally {
      isLoadingSocialStatsRef.current = false;
      }
  }, [authUser?.id]);

  useEffect(() => {
    loadSocialStats();
  }, [loadSocialStats]);

  // Helper functions to reload followers and following lists
  const reloadFollowers = useCallback(async () => {
      if (!authUser?.id) {
        return;
      }

      try {
        const response = await fetchFollowers(authUser.id, { pageSize: 20 });
      if (response?.data !== undefined) {
          setFollowers(response.data || []);
        }
      } catch (error) {
        if (isNetworkError(error) && !isDevelopment) {
          console.error("[UserContext] Failed to load followers:", error.message);
        } else if (!isNetworkError(error)) {
          // eslint-disable-next-line no-console
          console.warn("Failed to refresh followers:", error);
        }
    }
  }, [authUser?.id]);

  const reloadFollowing = useCallback(async () => {
      if (!authUser?.id) {
        return;
      }

      try {
        const response = await fetchFollowing(authUser.id, { pageSize: 20 });
      if (response?.data !== undefined) {
        setFollowing(response.data || []);
        }
      } catch (error) {
        if (isNetworkError(error) && !isDevelopment) {
          console.error("[UserContext] Failed to load following:", error.message);
        } else if (!isNetworkError(error)) {
          // eslint-disable-next-line no-console
          console.warn("Failed to refresh following:", error);
        }
    }
  }, [authUser?.id]);

  // Refresh social stats function (can be called manually)
  // Use useCallback with stable dependencies to prevent recreation
  const refreshSocialStats = useCallback(async () => {
    if (!authUser?.id) {
      return;
    }
    // Refresh counts and lists in parallel
    await Promise.all([
      loadSocialStats(),
      reloadFollowers(),
      reloadFollowing(),
    ]);
  }, [loadSocialStats, reloadFollowers, reloadFollowing, authUser?.id]);

  // Store refreshSocialStats in a ref for socket listeners to avoid dependency issues
  const refreshSocialStatsRef = useRef(refreshSocialStats);
  useEffect(() => {
    refreshSocialStatsRef.current = refreshSocialStats;
  }, [refreshSocialStats]);

  // Listen for real-time follow events via socket
  useEffect(() => {
    if (!socket || !isConnected || !authUser?.id) {
      return;
    }

    // Listen for when someone follows you (increases your follower count)
    const handleUserFollowed = () => {
      // Refresh social stats when someone follows you
      refreshSocialStatsRef.current?.();
    };

    // Listen for when you follow someone (increases your following count)
    const handleUserFollowing = () => {
      // Refresh social stats when you follow someone
      refreshSocialStatsRef.current?.();
    };

    // Listen for when someone unfollows you (decreases your follower count)
    const handleUserUnfollowed = () => {
      refreshSocialStatsRef.current?.();
    };

    // Listen for when you unfollow someone (decreases your following count)
    const handleUserUnfollowing = () => {
      refreshSocialStatsRef.current?.();
    };

    // Register socket listeners (events may need to be defined in backend)
    socket.on("user_followed", handleUserFollowed);
    socket.on("user_following", handleUserFollowing);
    socket.on("user_unfollowed", handleUserUnfollowed);
    socket.on("user_unfollowing", handleUserUnfollowing);

    return () => {
      socket.off("user_followed", handleUserFollowed);
      socket.off("user_following", handleUserFollowing);
      socket.off("user_unfollowed", handleUserUnfollowed);
      socket.off("user_unfollowing", handleUserUnfollowing);
    };
  }, [socket, isConnected, authUser?.id]);

  // Load followers list from backend with smart polling
  useSmartPolling(reloadFollowers, 15000, {
    enabled: !!authUser?.id,
    maxConsecutiveFailures: 3,
    onError: (error) => {
      // Errors are already handled in reloadFollowers, no need to log again
    },
  });

  // Load following list from backend with smart polling
  useSmartPolling(reloadFollowing, 15000, {
    enabled: !!authUser?.id,
    maxConsecutiveFailures: 3,
    onError: (error) => {
      // Errors are already handled in reloadFollowing, no need to log again
    },
  });

  // Listen for coin earning events to refresh leaderboard data and rating/badges
  useEffect(() => {
    const handleCoinEarned = () => {
      // Refresh followers and following lists when coins are earned
      reloadFollowers();
      reloadFollowing();
      // Refresh social stats (including rating and badges) when quiz is completed
      if (refreshSocialStats) {
        refreshSocialStats();
      }
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
  }, [reloadFollowers, reloadFollowing, refreshSocialStats]);

  // Load Learn & Earn dashboard data from backend with smart polling
  const loadDashboardData = useCallback(async () => {
    if (!authUser?.id || !tokens?.accessToken) {
      return;
    }

    const dashboardData = await fetchDashboardData();
    
    // Always update messages (even if empty array) to show real data
    if (dashboardData.messages !== undefined) {
      setMessages(dashboardData.messages || []);
    }

    // Always update notifications (even if empty array)
    if (dashboardData.notifications !== undefined) {
      setNotifications(dashboardData.notifications || []);
    }

    // Always update live debates (even if empty array)
    if (dashboardData.liveDebates !== undefined) {
      setLiveDebates(dashboardData.liveDebates || []);
    }

    // Always update open rooms (even if empty array)
    if (dashboardData.openRooms !== undefined) {
      setOpenRooms(dashboardData.openRooms || []);
    }

    // Update leaderboard (top followers)
    if (dashboardData.leaderboard && dashboardData.leaderboard.length > 0) {
      // Merge leaderboard data with existing followers
      setFollowers((prev) => {
        const leaderboardMap = new Map(
          dashboardData.leaderboard.map((item) => [item.id, item])
        );
        // Update existing followers with leaderboard data
        const updated = prev.map((follower) => {
          const leaderboardItem = leaderboardMap.get(follower.id);
          return leaderboardItem
            ? { ...follower, ...leaderboardItem }
            : follower;
        });
        // Add new leaderboard items not in followers
        dashboardData.leaderboard.forEach((item) => {
          if (!prev.find((f) => f.id === item.id)) {
            updated.push(item);
          }
        });
        return updated;
      });
    }

    // Update profile avatar if available from dashboard data
    if (dashboardData.profileAvatar) {
      setProfile((prev) => ({ ...prev, avatar: dashboardData.profileAvatar }));
    }

    // Update streak from dashboard data
    if (dashboardData.streak !== undefined) {
      setStreak(dashboardData.streak || 0);
    }
  }, [authUser?.id, tokens?.accessToken]);

  useSmartPolling(loadDashboardData, 30000, {
    enabled: !!authUser?.id && !!tokens?.accessToken,
    maxConsecutiveFailures: 3,
    onError: (error) => {
      if (isNetworkError(error) && !isDevelopment) {
        console.error("[UserContext] Failed to load dashboard data:", error.message);
      } else if (!isNetworkError(error)) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load dashboard data from backend:", error);
      }
    },
  });

  // Real-time message updates via Socket.io
  useEffect(() => {
    if (!socket || !isConnected || !authUser?.id) {
      return;
    }

    const handleNewMessage = (messageData) => {
      // Update messages list when a new message is received
      setMessages((prev) => {
        // Check if conversation already exists
        const conversationPartnerId = 
          messageData.senderId === authUser.id 
            ? messageData.recipientId 
            : messageData.senderId;
        
        const existingIndex = prev.findIndex((msg) => 
          msg.userId === conversationPartnerId || msg.id === `chat-${conversationPartnerId}`
        );

        const newConversation = {
          id: `chat-${conversationPartnerId}`,
          userId: conversationPartnerId,
          name: messageData.senderName || "User",
          avatar: messageData.senderAvatar || `https://i.pravatar.cc/150?img=${conversationPartnerId.slice(-2)}`,
          preview: messageData.content || "",
          timestamp: new Date(messageData.timestamp).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          }),
          unread: messageData.senderId === authUser.id ? 0 : (prev[existingIndex]?.unread || 0) + 1,
        };

        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            preview: newConversation.preview,
            timestamp: newConversation.timestamp,
            unread: newConversation.unread,
          };
          // Move to top
          const [moved] = updated.splice(existingIndex, 1);
          return [moved, ...updated];
        } else {
          // Add new conversation at the top
          return [newConversation, ...prev];
        }
      });

      // Add notification for new message if it's not from the current user
      if (messageData.senderId !== authUser.id) {
        setNotifications((prev) => [
          {
            id: crypto.randomUUID(),
            time: "Just now",
            type: "message",
            title: `New message from ${messageData.senderName || "User"}`,
            description: messageData.content || "",
          },
          ...prev,
        ]);
      }
    };

    const handleConversationUpdate = async () => {
      // Refresh conversations list when a conversation is updated
      try {
        const response = await fetchConversations();
        if (response?.conversations) {
          const formatted = response.conversations.map((conv) => ({
            id: conv.userId || conv.id,
            userId: conv.userId || conv.id,
            name: conv.name || "Unknown User",
            avatar: conv.avatar || `https://i.pravatar.cc/150?img=${(conv.userId || conv.id).slice(-2)}`,
            preview: conv.preview || "No messages yet",
            timestamp: conv.timestamp || "",
            unread: conv.unread || 0,
          }));
          setMessages(formatted);
        }
      } catch (error) {
        if (isNetworkError(error) && !isDevelopment) {
          console.error("[UserContext] Failed to refresh conversations:", error.message);
        } else if (!isNetworkError(error)) {
          // eslint-disable-next-line no-console
          console.warn("Failed to refresh conversations:", error);
        }
      }
    };

    // Listen for new messages
    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleConversationUpdate);
    socket.on("conversation_updated", handleConversationUpdate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleConversationUpdate);
      socket.off("conversation_updated", handleConversationUpdate);
    };
  }, [socket, isConnected, authUser]);

  useEffect(() => {
    if (!authUser) {
      // Reset to default profile when logged out (use development defaults only in dev)
      setProfile(isDevelopment ? defaultProfile : { ...defaultProfile, followers: 0, following: 0, coins: 0 });
      setApiError(null);
      return;
    }

    // Immediately update name from authUser if available (before async operations)
    if (authUser.fullName) {
      setProfile((prev) => ({
        ...prev,
        name: authUser.fullName,
        id: authUser.id || prev.id,
      }));
    }

    const metadata = authUser.metadata ?? {};

    // Load full student profile data (for students) from backend
    const loadAvatar = async () => {
      if (authUser.role === "student" && authUser.id && tokens?.accessToken) {
        try {
          const { fetchStudentProfile } = await import("../services/api/student");
          const { fetchStudentDashboard } = await import("../services/api/student");
          
          // Load StudentProfile for detailed info
          const profileData = await fetchStudentProfile(authUser.id);
          
          // Load dashboard data for badges
          let badgesData = [];
          try {
            const dashboardData = await fetchStudentDashboard();
            if (dashboardData?.learnEarnProgress?.badges) {
              badgesData = dashboardData.learnEarnProgress.badges.map((badge) => ({
                id: badge.label.toLowerCase().replace(/\s+/g, "-"),
                label: badge.label,
                color: "bg-[#D4AF37]/20 text-[#D4AF37]",
              }));
            }
          } catch (error) {
            // Only log non-network errors to reduce console noise when server is down
            if (!isNetworkError(error)) {
              // eslint-disable-next-line no-console
              console.warn("Failed to load badges from dashboard:", error);
            }
          }
          
          // Priority: StudentProfile.avatarUrl > User.metadata.avatarUrl > default
          const avatarUrl = profileData?.avatarUrl || metadata.avatarUrl || metadata.avatar || defaultProfile.avatar;
          
          // Format experience from StudentProfile
          let experienceText = defaultProfile.experience;
          if (profileData?.experience) {
            if (profileData.experience.description) {
              experienceText = profileData.experience.description;
            } else if (profileData.experience.years) {
              experienceText = `${profileData.experience.years} years of experience`;
            }
          } else if (metadata.experience) {
            experienceText = metadata.experience;
          } else if (metadata.experienceYears) {
            experienceText = `${metadata.experienceYears} years of experience`;
          }
          
          setProfile((prev) => ({
            ...defaultProfile,
            ...prev,
            id: authUser.id ?? defaultProfile.id,
            name: authUser.fullName || authUser.email?.split("@")[0] || "User",
            title:
              metadata.title ??
              (authUser.role ? `${getRoleLabel(authUser.role)} · Digital AELA` : defaultProfile.title),
            bio: profileData?.bio || profileData?.headline || metadata.bio || metadata.goals || defaultProfile.bio,
            country: profileData?.location?.country || metadata.country || metadata.region || defaultProfile.country,
            city: profileData?.location?.city || metadata.city || defaultProfile.city,
            profession: profileData?.profession || metadata.profession || metadata.currentStatus || defaultProfile.profession,
            englishLevel: profileData?.englishLevel || metadata.englishLevel || defaultProfile.englishLevel,
            experience: experienceText,
            maritalStatus: profileData?.maritalStatus || metadata.maritalStatus || defaultProfile.maritalStatus,
            interests: profileData?.interests || metadata.interests || metadata.contentThemes || defaultProfile.interests,
            avatar: avatarUrl, // Use StudentProfile avatar or metadata avatar from registration
            bannerGradient: metadata.bannerGradient ?? defaultProfile.bannerGradient,
            coins: aelaPoints,
            badges: badgesData.length > 0 ? badgesData : (prev.badges || defaultProfile.badges),
            metadata,
            role: authUser.role,
            contact: {
              email: authUser.email,
              phone: profileData?.phone || metadata.phone,
              whatsapp: metadata.whatsapp,
            },
            followers: socialStatsLoaded ? prev.followers : (prev.followers ?? defaultProfile.followers),
            following: socialStatsLoaded ? prev.following : (prev.following ?? defaultProfile.following),
            rating: socialStatsLoaded ? prev.rating : (prev.rating ?? defaultProfile.rating),
          }));
          return;
        } catch (error) {
          // Profile might not exist yet, continue with metadata fallback
          if (isNetworkError(error) && !isDevelopment) {
            console.error("[UserContext] Failed to load student profile:", error.message);
          } else if (!isNetworkError(error)) {
            // eslint-disable-next-line no-console
            console.warn("Failed to load student profile:", error);
          }
        }
      }

      // For non-students or if StudentProfile fetch failed, use metadata
      const avatarUrl = metadata.avatarUrl || metadata.avatar || defaultProfile.avatar;

      setProfile((prev) => ({
        ...defaultProfile,
        ...prev, // Preserve existing values (including backend-loaded social stats)
        id: authUser.id ?? defaultProfile.id,
        name: authUser.fullName || authUser.email?.split("@")[0] || "User",
        title:
          metadata.title ??
          (authUser.role ? `${getRoleLabel(authUser.role)} · Digital AELA` : defaultProfile.title),
        bio: metadata.bio ?? metadata.goals ?? defaultProfile.bio,
        country: metadata.country ?? metadata.region ?? defaultProfile.country,
        city: metadata.city ?? defaultProfile.city,
        profession: metadata.profession ?? metadata.currentStatus ?? defaultProfile.profession,
        experience:
          metadata.experience ??
          (metadata.experienceYears
            ? `${metadata.experienceYears} years of experience`
            : defaultProfile.experience),
        maritalStatus: metadata.maritalStatus ?? defaultProfile.maritalStatus,
        interests: metadata.interests ?? metadata.contentThemes ?? defaultProfile.interests,
        avatar: avatarUrl, // Use Cloudinary URL from registration metadata
        bannerGradient: metadata.bannerGradient ?? defaultProfile.bannerGradient,
        coins: aelaPoints,
        metadata,
        role: authUser.role,
        contact: {
          email: authUser.email,
          phone: metadata.phone,
          whatsapp: metadata.whatsapp,
        },
        // Preserve social stats from backend (don't overwrite if already loaded from backend)
        followers: socialStatsLoaded ? prev.followers : (prev.followers ?? defaultProfile.followers),
        following: socialStatsLoaded ? prev.following : (prev.following ?? defaultProfile.following),
        rating: socialStatsLoaded ? prev.rating : (prev.rating ?? defaultProfile.rating),
      }));
    };

    loadAvatar();
    
    // Refresh profile data every 30 seconds to keep it live
    const interval = setInterval(loadAvatar, 30000);
    
    return () => clearInterval(interval);
  }, [authUser, aelaPoints, getRoleLabel, socialStatsLoaded, tokens?.accessToken]);

  const updateProfile = useCallback((updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));

    if (!authUser) {
      return;
    }

    const metadataUpdates = Object.fromEntries(
      Object.entries(updates).filter(
        ([key]) =>
          ![
            "id",
            "coins",
            "followers",
            "following",
            "badges",
            "socialLinks",
            "metadata",
          ].includes(key)
      )
    );

    updateUserMetadata({
      fullName: typeof updates.name === "string" ? updates.name : undefined,
      metadata: {
        ...metadataUpdates,
        ...(updates.metadata ?? {}),
      },
    });
  }, [authUser, updateUserMetadata]);

  const markConversationRead = useCallback((conversationId) => {
    setMessages((prev) =>
      prev.map((chat) =>
        chat.id === conversationId
          ? {
              ...chat,
              unread: 0,
            }
          : chat
      )
    );
  }, []);

  const sendMessage = useCallback((conversationId, message) => {
    setMessages((prev) =>
      prev.map((chat) =>
        chat.id === conversationId
          ? {
              ...chat,
              preview: message.type === "voice" ? "Voice message sent" : message.content,
              timestamp: "Now",
              history: [...chat.history, { ...message, id: crypto.randomUUID() }],
            }
          : chat
      )
    );
  }, []);

  const addNotification = useCallback((payload) => {
    setNotifications((prev) => [
      {
        id: crypto.randomUUID(),
        time: "Just now",
        type: payload.type || "general",
        title: payload.title,
        description: payload.description,
      },
      ...prev,
    ]);
  }, []);

  const recordTransaction = useCallback((entry) => {
    setTransactions((prev) => [
      {
        id: crypto.randomUUID(),
        ...entry,
      },
      ...prev,
    ]);
  }, []);

  const shareCoins = useCallback(
    (recipientName, amount, note = "") => {
      if (amount <= 0) {
        return { success: false, reason: "Amount must be greater than zero." };
      }

      const redeemed = redeemPoints(amount);
      if (!redeemed) {
        return { success: false, reason: "Insufficient AELA coins." };
      }

      recordTransaction({
        type: "sent",
        label: `Gifted to ${recipientName}`,
        amount,
        time: "Moments ago",
        note,
      });
      addNotification({
        type: "coins",
        title: `You sent ${amount} coins to ${recipientName}`,
        description: note || "Keep motivating your peers!",
      });
      return { success: true };
    },
    [redeemPoints, recordTransaction, addNotification]
  );

  const rewardCoins = useCallback(
    (amount, label = "Activity reward") => {
      if (amount <= 0) return 0;
      const rewarded = addPoints(amount, label);
      recordTransaction({
        type: "earned",
        label,
        amount,
        time: "Just now",
      });
      addNotification({
        type: "coins",
        title: `+${amount} coins added`,
        description: label,
      });
      return rewarded;
    },
    [addPoints, recordTransaction, addNotification]
  );

  const voteOnDebate = useCallback((debateId, side) => {
    setLiveDebates((prev) =>
      prev.map((room) => {
        if (room.id !== debateId) return room;
        const increment = side === "for" ? { forVotes: room.forVotes + 1 } : { againstVotes: room.againstVotes + 1 };
        return { ...room, ...increment };
      })
    );
  }, []);

  const updateRatings = useCallback((tagLabel, delta = 1) => {
    setRatings((prev) => {
      const tagExists = prev.tags.find((tag) => tag.label === tagLabel);
      const updatedTags = tagExists
        ? prev.tags.map((tag) =>
            tag.label === tagLabel
              ? {
                  ...tag,
                  count: tag.count + delta,
                }
              : tag
          )
        : [...prev.tags, { label: tagLabel, count: Math.max(delta, 1) }];

      return {
        ...prev,
        votes: prev.votes + 1,
        average: Math.min(5, Number((prev.average + delta * 0.05).toFixed(2))),
        tags: updatedTags,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      followers,
      setFollowers,
      following,
      setFollowing,
      messages,
      markConversationRead,
      sendMessage,
      notifications,
      addNotification,
      transactions,
      recordTransaction,
      shareCoins,
      rewardCoins,
      groups,
      setGroups,
      liveDebates,
      setLiveDebates,
      voteOnDebate,
      openRooms,
      setOpenRooms,
      ratings,
      updateRatings,
      refreshSocialStats,
      totals: {
        current: aelaPoints,
        earned: totalEarned,
        redeemed: totalRedeemed,
      },
      streak,
      apiError,
    }),
    [
      profile,
      updateProfile,
      followers,
      following,
      messages,
      markConversationRead,
      sendMessage,
      notifications,
      addNotification,
      transactions,
      recordTransaction,
      shareCoins,
      rewardCoins,
      groups,
      liveDebates,
      setLiveDebates,
      voteOnDebate,
      openRooms,
      ratings,
      updateRatings,
      refreshSocialStats,
      aelaPoints,
      totalEarned,
      totalRedeemed,
      streak,
      apiError,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};


