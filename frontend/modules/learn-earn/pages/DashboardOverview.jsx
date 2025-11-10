import { useMemo, useState } from "react";
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
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { useUser } from "../../../src/contexts/UserContext";

const DashboardOverview = () => {
  const {
    profile,
    followers,
    messages,
    notifications,
    liveDebates,
    openRooms,
    totals,
  } = useUser();

  const [activeTab, setActiveTab] = useState("messages");

  const unreadMessages = useMemo(
    () => messages.filter((chat) => chat.unread > 0).length,
    [messages]
  );
  const followerCount = followers.length;
  const notificationCount = notifications.length;
  const badgeCount = profile.badges.length;
  const liveRoomCount = liveDebates.length + openRooms.length;
  const totalCoins = totals.current;

  const tabConfig = useMemo(
    () => [
      {
        id: "messages",
        label: "Messages",
        count: unreadMessages,
        icon: FaCommentDots,
      },
      {
        id: "followers",
        label: "Followers",
        count: followerCount,
        icon: FaUsers,
      },
      {
        id: "notifications",
        label: "Notifications",
        count: notificationCount,
        icon: HiOutlineBellAlert,
      },
      {
        id: "wallet",
        label: "Wallet",
        count: totalCoins,
        icon: FaCoins,
      },
      {
        id: "profile",
        label: "Profile",
        count: badgeCount,
        icon: HiOutlineUserCircle,
      },
      {
        id: "live",
        label: "Live Groups",
        count: liveRoomCount,
        icon: HiOutlineMicrophone,
      },
    ],
    [
      unreadMessages,
      followerCount,
      notificationCount,
      totalCoins,
      badgeCount,
      liveRoomCount,
    ]
  );

  const tabRenderer = {
    messages: (
      <div className="auto-grid-sm">
        {messages.map((chat) => (
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
                    {chat.unread} unread
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
        {followers.map((follower) => (
          <Motion.div
            key={follower.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.27 }}
            className="rounded-2xl border border-white/5 bg-linear-to-br from-[#101010] via-[#0c0c0c] to-[#050505] p-5">
            <div className="flex items-center gap-3">
              <img
                src={follower.avatar}
                alt={follower.name}
                className="h-12 w-12 rounded-full border border-[#D4AF37]/30 object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  {follower.name}
                </p>
                <p className="text-[11px] text-gray-400">{follower.id}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-300">{follower.tagline}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
              <span>⭐ {follower.rating.toFixed(1)}</span>
              <span>{follower.mutuals} mutuals</span>
              <span>{follower.coinsShared} coins shared</span>
            </div>
          </Motion.div>
        ))}
      </div>
    ),
    notifications: (
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-4">
            <p className="text-sm font-semibold text-white">
              {notification.title}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {notification.description}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-[#D4AF37]/80">
              {notification.time}
            </p>
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
            Balance
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {totals.current.toLocaleString()}{" "}
            <span className="text-sm text-[#D4AF37]">AELA</span>
          </p>
          <div className="mt-6 space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Total earned</span>
              <span className="text-emerald-300">
                +{totals.earned.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total redeemed</span>
              <span className="text-rose-300">
                -{totals.redeemed.toLocaleString()}
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
            Quick actions
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/learn-earn/wallet"
              className="inline-flex flex-1 min-w-[140px] items-center justify-between gap-2 rounded-xl bg-[#151515] px-4 py-3 text-sm font-semibold text-gray-200 transition hover:text-[#D4AF37]">
              Redeem
              <FaCoins className="h-4 w-4" />
            </Link>
            <Link
              to="/learn-earn/wallet"
              className="inline-flex flex-1 min-w-[140px] items-center justify-between gap-2 rounded-xl bg-[#151515] px-4 py-3 text-sm font-semibold text-gray-200 transition hover:text-[#D4AF37]">
              Send Coins
              <FaBolt className="h-4 w-4 text-[#D4AF37]" />
            </Link>
          </div>
          <p className="mt-6 text-[13px] text-gray-400">
            Daily streak:{" "}
            <span className="font-semibold text-emerald-300">
              Active · 7 days
            </span>
          </p>
        </Motion.div>
      </div>
    ),
    profile: (
      <div className="rounded-2xl border border-white/5 bg-linear-to-br from-[#101010] via-[#050505] to-black p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-16 w-16 rounded-full border border-[#D4AF37]/40 object-cover"
            />
            <div>
              <p className="text-lg font-semibold text-white">{profile.name}</p>
              <p className="text-sm text-gray-400">{profile.title}</p>
              <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]/80">
                {profile.id}
              </p>
            </div>
          </div>
          <Link
            to="/learn-earn/profile"
            className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">
            View full profile
          </Link>
        </div>
        <div className="mt-6 auto-grid-sm lg:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-[#0f0f0f] p-4 text-sm text-gray-300">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Location
            </p>
            <p className="mt-2 text-white">
              {profile.city}, {profile.country}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#0f0f0f] p-4 text-sm text-gray-300">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              English level
            </p>
            <p className="mt-2 text-white">{profile.englishLevel}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#0f0f0f] p-4 text-sm text-gray-300">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Experience
            </p>
            <p className="mt-2 text-white">{profile.experience}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {profile.badges.map((badge) => (
            <span
              key={badge.id}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    ),
    live: (
      <div className="auto-grid-sm lg:grid-cols-2">
        {liveDebates.map((room) => (
          <Motion.div
            key={room.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-2xl border border-[#D4AF37]/15 bg-[#0f0f0f] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
              Live Debate
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {room.topic}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Starts in {room.startInMinutes} min · Hosts{" "}
              {room.speakers.join(" & ")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                For · {room.forVotes}
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-200">
                Against · {room.againstVotes}
              </div>
            </div>
          </Motion.div>
        ))}
        {openRooms.map((room) => (
          <Motion.div
            key={room.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-2xl border border-white/5 bg-[#101010] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Open Room
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {room.title}
            </p>
            <p className="mt-1 text-sm text-gray-300">Host: {room.host}</p>
            <p className="mt-2 text-xs text-gray-500">
              Listeners online: {room.listeners}
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
                Good to see you
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                {profile.name}
              </h1>
              <p className="mt-2 max-w-md text-sm text-gray-300">
                Keep the momentum going — your learners are engaging 14% more
                this week.
              </p>
            </div>
            <Motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-[#0f0f0f]/80 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/80">
                AELA Coins
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {totals.current.toLocaleString()}
                <span className="ml-1 text-sm text-[#D4AF37]">coins</span>
              </p>
              <p className="mt-2 text-xs text-gray-400">
                +340 coins vs last week
              </p>
            </Motion.div>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-3 gap-3 text-center text-xs text-gray-300 sm:text-sm">
            <div className="rounded-2xl border border-white/10 bg-[#111]/80 p-4">
              <p className="text-[#D4AF37]">Followers</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {profile.followers.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111]/80 p-4">
              <p className="text-[#D4AF37]">Following</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {profile.following.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111]/80 p-4">
              <p className="text-[#D4AF37]">Rating</p>
              <p className="mt-1 text-lg font-semibold text-white">
                ⭐ {profile.rating.toFixed(1)}
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
            Leaderboard snapshot
          </p>
          <div className="mt-4 space-y-3">
            {followers.slice(0, 3).map((follower, index) => (
              <div
                key={follower.id}
                className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#141414]/80 px-4 py-3">
                <div className="text-xl text-[#D4AF37]">
                  {["🥇", "🥈", "🥉"][index]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {follower.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Shared {follower.coinsShared} coins
                  </p>
                </div>
                <p className="text-xs text-[#D4AF37]">
                  ⭐ {follower.rating.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
          <Link
            to="/learn-earn/live-debates"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
            See full leaderboard →
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
