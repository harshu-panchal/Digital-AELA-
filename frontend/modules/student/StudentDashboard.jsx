import { useMemo } from "react";
import { motion } from "framer-motion";
import { HiOutlineBookOpen, HiOutlineCalendarDays, HiOutlineTrophy, HiOutlineSparkles } from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useUser } from "../../src/contexts/UserContext";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const StudentDashboard = () => {
  const { profile, notifications, followers } = useUser();

  const { journeyStats, ongoingCourses, learnEarnProgress, nextActions, communityHighlights } = useMemo(() => {
    const stats = [
      {
        id: "learningHours",
        label: "Learning Hours",
        value: "124.5",
        delta: "+12.4 hours this month",
      },
      {
        id: "activeCourses",
        label: "Active Courses",
        value: "4",
        delta: "2 live cohorts this week",
      },
      {
        id: "aelaCoins",
        label: "AELA Coins",
        value: `${profile?.coins?.toLocaleString() ?? 0}`,
        delta: "+340 coins pending redemption",
      },
      {
        id: "speakingScore",
        label: "Speaking Score",
        value: "8.4 / 10",
        delta: "Consistent streak · Keep it up!",
      },
    ];

    const courses = [
      {
        title: "Public Speaking Accelerator",
        mentor: "Imran Khan",
        progress: 68,
        nextSession: "Tomorrow · 19:00 GST",
        access: "Continuing cohort",
      },
      {
        title: "IELTS Band 8 Mastery",
        mentor: "Priya Sharma",
        progress: 42,
        nextSession: "Friday · 17:30 GST",
        access: "Live session",
      },
      {
        title: "Corporate Storytelling Bootcamp",
        mentor: "Omar Al Farsi",
        progress: 15,
        nextSession: "Saturday · 12:00 GST",
        access: "Self-paced module unlocked",
      },
    ];

    const learnEarn = {
      streak: 7,
      badges: [
        { label: "Daily Speaker", description: "Completed 7-day speaking streak", icon: "🔥" },
        { label: "Quiz Champion", description: "Top 5% in Vocabulary Blitz", icon: "🏆" },
        { label: "Community Mentor", description: "Helped 12 peers", icon: "🤝" },
      ],
      leaderboardPosition: 12,
      coinsToRedeem: 520,
    };

    const actions = [
      {
        title: "Resume IELTS Band 8 Mastery",
        description: "Next lesson: Writing Task 2 · Live at 17:30 GST",
        cta: "Join live session",
      },
      {
        title: "Complete confidence challenge",
        description: "Earn +120 coins · 4 hours left",
        cta: "Attempt challenge",
      },
      {
        title: "Redeem AELA coins for discount",
        description: "520 coins available · Save AED 150 on next course",
        cta: "Open wallet",
      },
      {
        title: "Book mentorship slot",
        description: "1:1 with Imran Khan · Sunday 20:00 GST",
        cta: "Schedule session",
      },
    ];

    const highlights = {
      communityFeed: [
        {
          title: "Live debate: AI in education",
          time: "Today · 21:00 GST",
          participants: "Hosted by Fatima Hassan · 680 registered",
        },
        {
          title: "New Speaking Circle",
          time: "Tomorrow · 19:30 GST",
          participants: "Topic: Elevator pitches · Hosted by Mohammed Ali",
        },
        {
          title: "Peer feedback session",
          time: "Friday · 18:00 GST",
          participants: "IELTS Group C · Facilitated by Sara Malik",
        },
      ],
      recommendedCourses: [
        {
          title: "Sales Presentation Lab",
          mentor: "David Mathews",
          reason: "Boosts speaking style and persuasion — matches your goals",
        },
        {
          title: "Digital Persona Mastery",
          mentor: "Lina Joseph",
          reason: "Helps you craft standout LinkedIn profiles for placements",
        },
      ],
    };

    return {
      journeyStats: stats,
      ongoingCourses: courses,
      learnEarnProgress: learnEarn,
      nextActions: actions,
      communityHighlights: highlights,
    };
  }, [profile?.coins]);

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Student Dashboard | Digital AELA"
        description="Track your courses, Learn & Earn progress, and upcoming sessions in the Digital AELA student dashboard."
        keywords="student dashboard, course progress, aela coins, learn and earn"
        url="https://digitalaela.com/student/dashboard"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(55,124,255,0.18),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20">
        <section className="layout-container space-y-10">
          <motion.header
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
                  Learning journey
                </p>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  Welcome back, {profile?.name?.split(" ")[0] ?? "Learner"}
                </h1>
                <p className="mt-2 text-sm text-slate-300/80">
                  Your courses, coins, and community progress at a glance.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Consistency streak ·{" "}
                  <span className="font-semibold text-sky-200">{learnEarnProgress.streak} days</span>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Upcoming mentor call · <span className="font-semibold text-sky-200">Sunday</span>
                </div>
              </div>
            </div>
          </motion.header>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {journeyStats.map((stat) => (
              <motion.div
                key={stat.id}
                variants={cardVariants}
                className="rounded-3xl border border-sky-400/20 bg-[#060A17]/90 p-5 shadow-[0_24px_80px_rgba(20,30,60,0.4)]">
                <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-xs text-slate-300/80">{stat.delta}</p>
              </motion.div>
            ))}
          </motion.section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">In-progress courses</h2>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:border-sky-300/70 hover:text-sky-100">
                  View all
                </button>
              </header>
            <div className="space-y-3">
                {ongoingCourses.map((course) => (
                  <div key={course.title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{course.title}</p>
                        <p className="text-xs text-slate-400">Mentor · {course.mentor}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1">
                          <HiOutlineCalendarDays className="text-sky-200" />
                          {course.nextSession}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          Progress · {course.progress}%
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          {course.access}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${course.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Learn & Earn</h2>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:border-sky-300/70 hover:text-sky-100">
                  View wallet
                </button>
              </header>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <p className="font-semibold text-white">Current streak</p>
                <p className="mt-1 text-xs text-slate-300/80">
                  {learnEarnProgress.streak} days · unlock bonus at day 10
                </p>
              </div>
              <div className="space-y-3">
                {learnEarnProgress.badges.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
                    <span className="text-xl">{badge.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{badge.label}</p>
                      <p className="text-slate-300/80">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 px-4 py-3 text-xs text-sky-100">
                Leaderboard position · <span className="font-semibold text-white">#{learnEarnProgress.leaderboardPosition}</span>
                <br />
                Coins available · <span className="font-semibold text-white">{learnEarnProgress.coinsToRedeem}</span>
              </div>
            </motion.div>
          </section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Next best actions</h2>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:border-sky-300/70 hover:text-sky-100">
                View planner
              </button>
            </header>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {nextActions.map((action) => (
                <div key={action.title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  <p className="text-base font-semibold text-white">{action.title}</p>
                  <p className="mt-1 text-xs text-slate-400/80">{action.description}</p>
                  <button
                    type="button"
                    className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-300 hover:text-white">
                    {action.cta} →
                  </button>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Community & Recommendations</h2>
                <p className="text-xs text-slate-400">Stay connected and keep improving</p>
              </div>
            </header>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-3">
                {communityHighlights.communityFeed.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400/80">{item.time}</p>
                    <p className="mt-1 text-xs text-slate-300/80">{item.participants}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-[#0ea5e9]/10 px-4 py-3 text-sm text-sky-100">
                  <HiOutlineSparkles className="mb-2 text-sky-200" />
                  <p className="text-base font-semibold text-white">Recommended for you</p>
                  <p className="mt-1 text-xs text-slate-200/70">
                    Based on your learning goals, we handpicked these programmes.
                  </p>
                </div>
                {communityHighlights.recommendedCourses.map((course) => (
                  <div key={course.title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <p className="text-sm font-semibold text-white">{course.title}</p>
                    <p className="text-xs text-slate-400/80">Mentor · {course.mentor}</p>
                    <p className="mt-1 text-xs text-slate-300/80">{course.reason}</p>
                    <button
                      type="button"
                      className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-300 hover:text-white">
                      View details →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;

