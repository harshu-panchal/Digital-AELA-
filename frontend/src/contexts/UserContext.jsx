/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePoints } from "./PointsContext";
import { useAuth } from "./AuthContext";

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

export const UserProvider = ({ children }) => {
  const { aelaPoints, addPoints, redeemPoints, totalEarned, totalRedeemed } = usePoints();
  const { user: authUser, updateUserMetadata, getRoleLabel } = useAuth();

  const [profile, setProfile] = useState(defaultProfile);
  const [followers, setFollowers] = useState(defaultFollowers);
  const [following, setFollowing] = useState(() => defaultFollowers.slice(0, 3));
  const [messages, setMessages] = useState(defaultMessages);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [transactions, setTransactions] = useState(defaultTransactions);
  const [groups, setGroups] = useState(defaultGroups);
  const [liveDebates, setLiveDebates] = useState(defaultLiveDebates);
  const [openRooms, setOpenRooms] = useState(defaultOpenRooms);
  const [ratings, setRatings] = useState(defaultRatings);

  useEffect(() => {
    setProfile((prev) => ({ ...prev, coins: aelaPoints }));
  }, [aelaPoints]);

  useEffect(() => {
    if (!authUser) {
      setProfile(defaultProfile);
      return;
    }

    const metadata = authUser.metadata ?? {};

    setProfile((prev) => ({
      ...defaultProfile,
      ...prev,
      id: authUser.id ?? defaultProfile.id,
      name: authUser.fullName ?? defaultProfile.name,
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
      avatar: metadata.avatar ?? prev.avatar ?? defaultProfile.avatar,
      bannerGradient: metadata.bannerGradient ?? defaultProfile.bannerGradient,
      coins: aelaPoints,
      metadata,
      role: authUser.role,
      contact: {
        email: authUser.email,
        phone: metadata.phone,
        whatsapp: metadata.whatsapp,
      },
    }));
  }, [authUser, aelaPoints, getRoleLabel]);

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
      voteOnDebate,
      openRooms,
      setOpenRooms,
      ratings,
      updateRatings,
      totals: {
        current: aelaPoints,
        earned: totalEarned,
        redeemed: totalRedeemed,
      },
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
      voteOnDebate,
      openRooms,
      ratings,
      updateRatings,
      aelaPoints,
      totalEarned,
      totalRedeemed,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};


