import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineArrowUpRight,
  HiOutlineBookOpen,
  HiOutlineClipboardDocument,
  HiOutlineDocumentArrowUp,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineSparkles,
  HiOutlinePresentationChartLine,
} from "react-icons/hi2";
import { FaFilePdf, FaClipboardList, FaShoppingCart } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getTeacherEbooks } from "../../src/services/teacherEbooks";
import { getTeacherQuizzes } from "../../src/services/teacherQuizzes";

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

const TeacherDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState(() => getTeacherEbooks());
  const [quizzes, setQuizzes] = useState(() => getTeacherQuizzes());
  const [flash, setFlash] = useState({ ebooks: false, quizzes: false });

  useEffect(() => {
    const refresh = () => {
      setEbooks(getTeacherEbooks());
      setQuizzes(getTeacherQuizzes());
    };

    refresh();

    const handleStorage = (event) => {
      if (event.key === "aela.teacher.ebooks" || event.key === "aela.teacher.quizzes") {
        refresh();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  useEffect(() => {
    const state = location.state;
    if (!state) return;

    const highlightConfig = {
      ebooks: Boolean(state.highlightEbooks),
      quizzes: Boolean(state.highlightQuizzes),
    };

    if (highlightConfig.ebooks || highlightConfig.quizzes) {
      setFlash(highlightConfig);
      let timerId;
      if (typeof window !== "undefined") {
        timerId = window.setTimeout(() => setFlash({ ebooks: false, quizzes: false }), 2600);
      }
      navigate(location.pathname, { replace: true, state: {} });
      return () => {
        if (timerId) {
          window.clearTimeout(timerId);
        }
      };
    }
  }, [location, navigate]);

  const {
    headlineStats,
    managementTiles,
    salesBreakdown,
    recentPurchases,
    quizPanel,
    ebookLibrary,
    studentSpotlight,
    mentorNetwork,
    marketplace,
  } = useMemo(() => {
    const ebookCount = ebooks.length;
    const draftEbooks = ebooks.filter((ebook) => ebook.status !== "published").length;

    const quizCount = quizzes.length;
    const publishedQuizzes = quizzes.filter((quiz) => quiz.status === "published");
    const draftQuizzes = quizzes.filter((quiz) => quiz.status !== "published");

    const stats = [
      {
        id: "activeCourses",
        label: "Courses Published",
        value: "12",
        icon: HiOutlineBookOpen,
        context: "+2 launching next week",
      },
      {
        id: "ebooks",
        label: "E-Books Library",
        value: `${ebookCount}`,
        icon: FaFilePdf,
        context: ebookCount === 0 ? "Upload your first PDF" : `${draftEbooks} awaiting publish`,
      },
      {
        id: "activeQuizzes",
        label: "Active Quizzes",
        value: `${quizCount}`,
        icon: HiOutlineClipboardDocument,
        context: quizCount === 0 ? "Create a quiz to reward learners" : `${publishedQuizzes.length} live now`,
      },
      {
        id: "monthlyRevenue",
        label: "30-day Revenue",
        value: "AED 58,240",
        icon: HiOutlineCurrencyDollar,
        context: "+21% vs last month",
      },
    ];

    const tiles = [
      {
        title: "Upload a new course",
        description: "Video lessons, worksheets, and cohort schedule",
        cta: "Create course",
        tone: "from-[#F5D26A]/20 to-[#BA8D2F]/20 border-[#F5D26A]/40 text-[#F5D26A]",
        icon: HiOutlineDocumentArrowUp,
        href: "/teacher/courses/new",
      },
      {
        title: "Publish e-book or PDF",
        description: ebookCount === 0 ? "Share your first study guide" : `${ebookCount} items in library`,
        cta: "Upload e-book",
        tone: "from-[#38bdf8]/20 to-[#0ea5e9]/20 border-sky-400/40 text-sky-200",
        icon: FaFilePdf,
        href: "/teacher/ebooks/upload",
      },
      {
        title: "Build Learn & Earn quiz",
        description: quizCount === 0 ? "Engage learners with fresh challenges" : `${draftQuizzes.length} drafts ready to publish`,
        cta: "Create quiz",
        tone: "from-[#34d399]/20 to-[#10b981]/20 border-emerald-400/40 text-emerald-200",
        icon: FaClipboardList,
        href: "/teacher/quizzes/new",
      },
      {
        title: "Explore teacher marketplace",
        description: "Buy new courses or co-teach with top mentors",
        cta: "Browse mentors",
        tone: "from-[#facc15]/20 to-[#eab308]/20 border-yellow-400/40 text-yellow-200",
        icon: HiOutlineSparkles,
        href: "/teacher/marketplace",
      },
    ];

    const sales = [
      {
        type: "Courses",
        revenue: "AED 32.4K",
        enrollments: 642,
        topCourse: "Public Speaking Accelerator",
        trend: "+14%",
      },
      {
        type: "Books",
        revenue: "AED 18.9K",
        enrollments: 914,
        topCourse: "Confidence Blueprint",
        trend: "+9%",
      },
      {
        type: "Learn & Earn",
        revenue: "AED 6.9K",
        enrollments: 1_280,
        topCourse: "Speaking Streak Challenges",
        trend: "+28%",
      },
    ];

    const purchases = [
      { learner: "Fatima Hassan", item: "IELTS Band 8 Mastery", type: "Course", time: "12 min ago", value: "AED 899" },
      { learner: "Omar Al Farsi", item: "Executive Storytelling Playbook", type: "E-Book", time: "30 min ago", value: "AED 199" },
      { learner: "Sara Malik", item: "Public Speaking Accelerator", type: "Course", time: "2 hours ago", value: "AED 899" },
      { learner: "Mohammed Ali", item: "Confidence Drills Toolkit", type: "E-Book", time: "Yesterday", value: "AED 149" },
    ];

    const quizPanelData = {
      active: publishedQuizzes.length
        ? publishedQuizzes.map((quiz) => ({
            id: quiz.id,
            title: quiz.title,
            participants: quiz.participants ?? 0,
            reward: `+${quiz.rewardCoins ?? 0} coins`,
            status: quiz.availableUntil
              ? `Closes ${new Date(quiz.availableUntil).toLocaleString()}`
              : "Live",
          }))
        : [
            {
              id: "sample-quiz-1",
              title: "Confidence Lightning Round",
              participants: 482,
              reward: "+120 coins",
              status: "Live until midnight",
            },
            {
              id: "sample-quiz-2",
              title: "IELTS Listening Drill",
              participants: 316,
              reward: "+90 coins",
              status: "Closing in 2 days",
            },
          ],
      drafts: draftQuizzes.length
        ? draftQuizzes.map((quiz) => ({
            id: quiz.id,
            title: quiz.title,
            status: quiz.status,
            action: "Continue editing",
          }))
        : [
            { id: "sample-draft-1", title: "Storytelling Warm-Up", status: "draft", action: "Continue editing" },
            { id: "sample-draft-2", title: "Vocabulary Blitz · Advanced", status: "pending", action: "Submit for approval" },
          ],
    };

    const libraryEntries = ebookCount
      ? ebooks.map((ebook) => ({
          id: ebook.id,
          title: ebook.title,
          format: ebook.fileMeta
            ? `PDF · ${Math.max(1, Math.round(ebook.fileMeta.size / 1024))} KB`
            : "PDF",
          downloads: ebook.downloads ?? 0,
          lastUpdated: ebook.updatedAt ? new Date(ebook.updatedAt).toLocaleDateString() : "Just now",
          status: ebook.status ?? "draft",
        }))
      : [
          {
            id: "sample-ebook-1",
            title: "Confidence Blueprint",
            format: "PDF · 45 pages",
            downloads: 320,
            lastUpdated: "2 days ago",
            status: "published",
          },
          {
            id: "sample-ebook-2",
            title: "IELTS Speaking Drills",
            format: "PDF · 28 pages",
            downloads: 214,
            lastUpdated: "4 days ago",
            status: "published",
          },
          {
            id: "sample-ebook-3",
            title: "Stage Anxiety Reset",
            format: "PDF · 30 pages",
            downloads: 156,
            lastUpdated: "1 week ago",
            status: "draft",
          },
        ];

    const students = [
      { name: "Ali Hassan", programme: "Public Speaking Accelerator", progress: "92%", coins: 620 },
      { name: "Lina Joseph", programme: "Corporate Storytelling", progress: "78%", coins: 540 },
      { name: "Ahmed Khan", programme: "IELTS Band 8 Mastery", progress: "84%", coins: 480 },
    ];

    const mentors = [
      { name: "Priya Sharma", expertise: "IELTS & Test Prep", courses: 9, rating: "4.9 ★" },
      { name: "Omar Al Farsi", expertise: "Corporate Communication", courses: 7, rating: "4.8 ★" },
      { name: "Sarah Thomas", expertise: "Leadership Storytelling", courses: 5, rating: "4.7 ★" },
    ];

    const marketplaceItems = [
      {
        title: "Leadership Storytelling Masterclass",
        mentor: "Sarah Thomas",
        type: "Course",
        price: "AED 799",
        reason: "Great addition to your corporate communication bundle",
      },
      {
        title: "Voice & Accent Playbook",
        mentor: "Priya Sharma",
        type: "E-Book",
        price: "AED 149",
        reason: "Pairs well with your confidence drills course",
      },
      {
        title: "Advanced Debate Challenges",
        mentor: "Mohammed Ali",
        type: "Quiz Pack",
        price: "AED 299",
        reason: "Boost Learn & Earn engagement",
      },
    ];

    return {
      headlineStats: stats,
      managementTiles: tiles,
      salesBreakdown: sales,
      recentPurchases: purchases,
      quizPanel: quizPanelData,
      ebookLibrary: libraryEntries,
      studentSpotlight: students,
      mentorNetwork: mentors,
      marketplace: marketplaceItems,
    };
  }, [ebooks, quizzes]);

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title="Teacher Dashboard | Digital AELA"
        description="Manage uploads, quizzes, learners, and earnings from the Digital AELA teacher dashboard."
        keywords="teacher dashboard, upload courses, teacher analytics, digital aela mentor portal"
        url="https://digitalaela.com/teacher/dashboard"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,210,106,0.12),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20">
        <section className="layout-container space-y-10">
          <motion.header
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Mentor control centre
                </p>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  Hello, {user?.fullName?.split(" ")[0] ?? "Mentor"}
                </h1>
                <p className="mt-2 text-sm text-slate-300/80">
                  Upload courses & e-books, run Learn & Earn quizzes, and track learner success in one place.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Courses reviewed this month · <span className="font-semibold text-[#F5D26A]">22</span>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Student satisfaction · <span className="font-semibold text-[#F5D26A]">4.8 ★</span>
                </div>
              </div>
            </div>
          </motion.header>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {headlineStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={cardVariants}
                  className="rounded-3xl border border-[#F5D26A]/20 bg-[#090D19]/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#F5D26A]/60">
                      {stat.label}
                    </p>
                    <Icon className="text-[#F5D26A]" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-xs text-slate-300/80">{stat.context}</p>
                </motion.div>
              );
            })}
          </motion.section>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {managementTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <motion.div
                  key={tile.title}
                  variants={cardVariants}
                  className={`rounded-3xl border bg-[#090D19]/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)] ${tile.tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{tile.title}</p>
                      <p className="mt-1 text-xs text-slate-200/70">{tile.description}</p>
                    </div>
                    <Icon className="text-lg" />
                  </div>
                  <Link
                    to={tile.href ?? "#"}
                    className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em]">
                    {tile.cta} <HiOutlineArrowUpRight />
                  </Link>
                </motion.div>
              );
            })}
          </motion.section>

          <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Sales & enrolment snapshot</h2>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-[#F5D26A]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:border-[#F5D26A]/70 hover:text-[#FFE28A]">
                  Download report
                </button>
              </header>
              <div className="grid gap-3 md:grid-cols-3">
                {salesBreakdown.map((item) => (
                  <div key={item.type} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <p className="text-sm font-semibold text-white">{item.type}</p>
                    <p className="mt-1 text-xs text-slate-300/80">Revenue · {item.revenue}</p>
                    <p className="text-xs text-slate-300/80">Enrollments · {item.enrollments}</p>
                    <p className="text-xs text-[#34d399]/80">Trend · {item.trend}</p>
                    <p className="mt-1 text-xs text-slate-400/70">Top performer · {item.topCourse}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <header className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Latest purchases</h3>
                  <button
                    type="button"
                    className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                    View all →
                  </button>
                </header>
                {recentPurchases.map((order) => (
                  <div key={order.learner + order.item} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
                    <div>
                      <p className="font-semibold text-white">{order.learner}</p>
                      <p className="text-slate-300/80">
                        {order.item} · {order.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400/70">
                      <span>{order.time}</span>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-white/90">{order.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className={`space-y-4 rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6 transition ${
                flash.quizzes ? "ring-2 ring-sky-400/60 ring-offset-2 ring-offset-[#05060D]" : ""
              }`}
            >
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">Learn & Earn quizzes</h2>
                  {flash.quizzes ? (
                    <span className="rounded-full border border-sky-400/60 bg-sky-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-100">
                      Just added
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#34d399] hover:text-[#bbf7d0]">
                  Quiz manager →
                </button>
              </header>
              <div className="space-y-3">
                {quizPanel.active.map((quiz) => (
                  <Link
                    key={quiz.id}
                    to={quiz.id.startsWith("sample-quiz") ? "/teacher/quizzes/new" : `/teacher/quizzes/${quiz.id}`}
                    className="block rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 transition hover:border-emerald-300/60">
                    <p className="text-sm font-semibold text-white">{quiz.title}</p>
                    <p className="text-xs text-emerald-200/80">
                      {quiz.participants} participants · Reward {quiz.reward}
                    </p>
                    <p className="text-xs text-emerald-100/70">{quiz.status}</p>
                  </Link>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
                <p className="text-sm font-semibold text-white">Drafts & review</p>
                {quizPanel.drafts.map((draft) => (
                  <Link
                    key={draft.id}
                    to={draft.id.startsWith("sample-draft") ? "/teacher/quizzes/new" : `/teacher/quizzes/${draft.id}`}
                    className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 transition hover:border-sky-400/50">
                    <div>
                      <p className="font-semibold text-white">{draft.title}</p>
                      <p className="text-[11px] text-slate-400/70">{draft.status}</p>
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300">
                      {draft.action} →
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className={`rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6 transition ${
              flash.ebooks ? "ring-2 ring-sky-400/60 ring-offset-2 ring-offset-[#05060D]" : ""
            }`}
          >
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Your e-book library</h2>
                <p className="text-xs text-slate-400">Manage PDFs and premium downloads</p>
              </div>
              <div className="flex items-center gap-3">
                {flash.ebooks ? (
                  <span className="rounded-full border border-sky-400/60 bg-sky-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-100">
                    Just added
                  </span>
                ) : null}
                <Link
                  to="/teacher/ebooks/upload"
                  className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:border-sky-300/70 hover:text-sky-100">
                  Manage library
                </Link>
              </div>
            </header>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {ebookLibrary.map((book) => (
                <Link
                  key={book.id ?? book.title}
                  to={book.id?.startsWith("sample-ebook") ? "/teacher/ebooks/upload" : `/teacher/ebooks/${book.id}`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-sky-400/40">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <FaFilePdf className="text-[#f87171]" />
                    <span>{book.format}</span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-white">{book.title}</p>
                  <p className="mt-1 text-xs text-slate-400/80">Downloads · {book.downloads}</p>
                  <p className="text-xs text-slate-400/80">Updated · {book.lastUpdated}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">{book.status}</p>
                </Link>
              ))}
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Learner spotlight</h2>
                <button
                  type="button"
                  className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                  View all profiles →
                </button>
              </header>
              <div className="space-y-3">
                {studentSpotlight.map((student) => (
                  <div key={student.name} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
                    <div>
                      <p className="text-sm font-semibold text-white">{student.name}</p>
                      <p className="text-slate-300/80">{student.programme}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-slate-300/90">
                        Progress {student.progress}
                      </span>
                      <span className="rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-1 text-[#bbf7d0]">
                        Coins {student.coins}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Mentor network</h2>
                <button
                  type="button"
                  className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100">
                  See all mentors →
                </button>
              </header>
              <div className="space-y-3">
                {mentorNetwork.map((mentor) => (
                  <div key={mentor.name} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
                    <p className="text-sm font-semibold text-white">{mentor.name}</p>
                    <p className="text-slate-300/80">{mentor.expertise}</p>
                    <p className="mt-1 text-slate-300/70">
                      Courses {mentor.courses} · Rating {mentor.rating}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Marketplace recommendations</h2>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white hover:text-[#F5D26A]">
                Open marketplace <FaShoppingCart />
              </button>
            </header>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {marketplace.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {item.type}
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-300/80">Mentor · {item.mentor}</p>
                  <p className="mt-2 text-xs text-slate-300/70">{item.reason}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-white/90">
                      {item.price}
                    </span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100">
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;

