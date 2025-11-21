import { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineSquares2X2,
  HiOutlineUserCircle,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineMicrophone,
  HiOutlineBookOpen,
  HiOutlineCurrencyDollar,
  HiOutlineStar,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineUserGroup,
  HiOutlineClipboard,
  HiOutlineClipboardDocumentCheck,
  HiOutlineUserPlus,
} from "react-icons/hi2";
import { FaCoins } from "react-icons/fa";
import { toast } from "react-toastify";
import { useUser } from "../../../src/contexts/UserContext";
import { useAuth } from "../../../src/contexts/AuthContext";

const sideNavLinks = [
  {
    to: "/learn-earn",
    label: "Overview",
    icon: HiOutlineSquares2X2,
  },
  {
    to: "/learn-earn/profile",
    label: "Profile",
    icon: HiOutlineUserCircle,
  },
  {
    to: "/learn-earn/chat",
    label: "Messages",
    icon: HiOutlineChatBubbleOvalLeft,
  },
  {
    to: "/learn-earn/find-learners",
    label: "Find Learners",
    icon: HiOutlineUserPlus,
  },
  {
    to: "/learn-earn/live-debate-room",
    label: "Live Debate Room",
    icon: HiOutlineMicrophone,
  },
  {
    to: "/learn-earn/activities",
    label: "Quizzes & Games",
    icon: HiOutlineBookOpen,
  },
  {
    to: "/learn-earn/wallet",
    label: "Wallet",
    icon: HiOutlineCurrencyDollar,
  },
  {
    to: "/learn-earn/ratings",
    label: "Ratings",
    icon: HiOutlineStar,
  },
];

const LearnEarnLayout = () => {
  const location = useLocation();
  const { profile, totals, notifications, liveDebates, openRooms } = useUser();
  const { user: authUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopyUserId = async () => {
    if (!profile.id) return;
    try {
      await navigator.clipboard.writeText(profile.id);
      setCopied(true);
      toast.success("User ID copied to clipboard!", {
        icon: "📋",
        position: "top-right",
        autoClose: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy User ID", {
        icon: "⚠️",
        position: "top-right",
        autoClose: 2000,
      });
    }
  };
  
  // Calculate live rooms count (rooms with status "live")
  const liveRoomsCount = useMemo(() => {
    const liveDebatesCount = liveDebates.filter(room => room.status === "live").length;
    const liveOpenRoomsCount = openRooms.filter(room => room.status === "live").length;
    return liveDebatesCount + liveOpenRoomsCount;
  }, [liveDebates, openRooms]);

  const unreadCount = useMemo(
    () =>
      notifications.filter((notification) => notification.type !== "archived")
        .length,
    [notifications]
  );

  useEffect(() => {
    setIsSidebarOpen(false);
    // Clear search when navigating away from chat page
    if (location.pathname !== "/learn-earn/chat") {
      setSearchQuery("");
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderNavLinks = (isMobile = false) => (
    <nav className="space-y-1">
      {sideNavLinks.map((item) => {
        const isActive = location.pathname === item.to;
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/learn-earn"}
            onClick={() => (isMobile ? setIsSidebarOpen(false) : null)}
            className={({ isActive: active }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                active || isActive
                  ? "bg-[#1f1f1f] text-[#D4AF37] border border-[#D4AF37]/40 shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                  : "text-gray-300 hover:text-white hover:bg-[#141414]"
              }`
            }>
            <IconComponent className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-[#050505] to-black pt-[124px] md:pt-[104px] text-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:flex-row">
        {/* Desktop Sidebar - Fixed */}
        <aside 
          className="hidden fixed top-[124px] md:top-[104px] z-20 w-[250px] h-[calc(100vh-124px)] md:h-[calc(100vh-104px)] border-r border-white/5 bg-black/60 backdrop-blur-xl lg:block"
          style={{
            left: 'max(0px, calc((100vw - 1440px) / 2))'
          }}>
          <div className="flex h-full flex-col gap-6 overflow-y-auto overflow-x-hidden px-6 pb-8 pt-12 custom-scrollbar">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]/70">
                Learn & Earn
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                AELA House
              </h2>
            </div>
            {authUser ? (
            <div className="rounded-2xl border border-white/5 bg-[#0f0f0f]/90 p-4 shadow-inner">
              <div className="flex items-center gap-3">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-12 w-12 flex-shrink-0 rounded-full border border-[#D4AF37]/50 object-cover"
                />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">
                    {profile.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400 truncate break-all">
                    {profile.id}
                  </p>
                    <button
                      type="button"
                      onClick={handleCopyUserId}
                      className="flex-shrink-0 rounded p-1 text-gray-400 transition hover:bg-white/5 hover:text-[#D4AF37] active:scale-95"
                      title="Copy User ID">
                      {copied ? (
                        <HiOutlineClipboardDocumentCheck className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <HiOutlineClipboard className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-[#141414] p-3 text-xs text-gray-300">
                <p className="flex items-center gap-2 text-[#D4AF37]">
                  <FaCoins className="h-4 w-4" />
                  Current Balance
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {totals.current.toLocaleString()}{" "}
                  <span className="text-sm text-[#D4AF37]">AELA</span>
                </p>
              </div>
            </div>
            ) : (
              <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 shadow-inner">
                <p className="text-sm font-semibold text-white mb-2">
                  Welcome to Learn & Earn
                </p>
                <p className="text-xs text-gray-300 mb-4">
                  Sign in to track your progress, earn coins, and access exclusive features.
                </p>
                <Link
                  to="/login/student"
                  className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110">
                  Sign In
                </Link>
              </div>
            )}
            {renderNavLinks()}

            <div className="mt-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                Live
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {liveRoomsCount > 0 
                  ? `${liveRoomsCount} ${liveRoomsCount === 1 ? 'room' : 'rooms'} open now`
                  : 'No rooms live'}
              </p>
              {liveRoomsCount > 0 && (
              <Link
                to="/learn-earn/live-debate-room"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30">
                Jump in
              </Link>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 lg:pl-[250px]">
          {/* Top Navigation */}
          <header className="sticky top-[124px] md:top-[104px] z-30 border-b border-white/5 bg-black/80 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#151515] p-2 text-gray-200 transition hover:text-white lg:hidden">
                    <HiOutlineBars3 className="h-6 w-6" />
                  </button>
                  <div className="rounded-2xl border border-white/10 bg-[#111] px-3 py-2 text-xs text-gray-400">
                    Digital AELA · Learning & Earning House
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/learn-earn"
                    className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] sm:inline-flex">
                    Back to Overview
                  </Link>
                  <Link
                    to="/learn-earn/wallet"
                    className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110">
                    <FaCoins className="h-4 w-4" />
                    Redeem Coins
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        location.pathname === "/learn-earn/chat"
                          ? "Search conversations by name or user ID"
                          : "Search learners by name or AELA ID"
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#101010] py-3 pl-12 pr-4 text-sm text-gray-100 outline-none transition focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Link
                    to="/learn-earn/chat"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#121212] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
                    <HiOutlineChatBubbleOvalLeft className="h-4 w-4" />
                    Messages
                  </Link>
                  <Link
                    to="/learn-earn"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#121212] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
                    <HiOutlineUserGroup className="h-4 w-4" />
                    Followers
                  </Link>
                  <Link
                    to="/learn-earn"
                    className="relative inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#121212] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
                    <HiOutlineBell className="h-4 w-4" />
                    Alerts
                    {unreadCount > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-black">
                        {Math.min(unreadCount, 9)}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <main key={location.pathname} className="layout-container pb-16 pt-8">
            <Outlet context={{ searchQuery }} />
          </main>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-md lg:hidden"
            onClick={() => setIsSidebarOpen(false)}>
            <Motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="relative h-full w-[82%] max-w-xs border-r border-white/10 bg-[#060606] px-5 py-6 shadow-2xl">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-[#111] p-2 text-gray-300">
                <HiOutlineXMark className="h-5 w-5" />
              </button>
              <div className="mt-8 flex flex-col gap-6">
                {authUser ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f0f0f] p-3">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-10 w-10 flex-shrink-0 rounded-full border border-[#D4AF37]/40 object-cover"
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">
                      {profile.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400 truncate break-all">
                      {profile.id}
                    </p>
                      <button
                        type="button"
                        onClick={handleCopyUserId}
                        className="flex-shrink-0 rounded p-1 text-gray-400 transition hover:bg-white/5 hover:text-[#D4AF37] active:scale-95"
                        title="Copy User ID">
                        {copied ? (
                          <HiOutlineClipboardDocumentCheck className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <HiOutlineClipboard className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                ) : (
                  <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
                    <p className="text-sm font-semibold text-white mb-2">
                      Welcome to Learn & Earn
                    </p>
                    <p className="text-xs text-gray-300 mb-4">
                      Sign in to track your progress and earn coins.
                    </p>
                    <Link
                      to="/login/student"
                      onClick={() => setIsSidebarOpen(false)}
                      className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110">
                      Sign In
                    </Link>
                  </div>
                )}
                {renderNavLinks(true)}
              </div>
            </Motion.aside>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearnEarnLayout;
