import { useEffect, useMemo, useState, useCallback } from "react";
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
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineQuestionMarkCircle,
  HiOutlineMegaphone,
} from "react-icons/hi2";
import { FaFilePdf, FaClipboardList, FaTrash } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getTeacherEbooks } from "../../src/services/teacherEbooks";
import { getTeacherQuizzes, deleteTeacherQuiz } from "../../src/services/teacherQuizzes";
import { getTeacherCourses } from "../../src/services/teacherCourses";
import { fetchTeacherDashboard } from "../../src/services/api/teacher";
import { useSocket } from "../../src/hooks/useSocket";
import { getTeacherAssignments } from "../../src/services/api/assignments";
import { getDoubtTicketStats } from "../../src/services/api/doubtTickets";

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
  const [ebooks, setEbooks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [flash, setFlash] = useState({ ebooks: false, quizzes: false });
  const [loadingEbooks, setLoadingEbooks] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [doubtTicketStats, setDoubtTicketStats] = useState(null);
  const [loadingDoubtTickets, setLoadingDoubtTickets] = useState(false);

  // Load dashboard data from backend
  const loadDashboard = useCallback(async () => {
    if (!user || user.role !== "teacher") {
      setLoadingDashboard(false);
      return;
    }

    try {
      setLoadingDashboard(true);
      const data = await fetchTeacherDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to load teacher dashboard:", error);
      toast.warning("Some dashboard data may not be up to date.");
    } finally {
      setLoadingDashboard(false);
    }
  }, [user]);

  // Load assignments
  const loadAssignments = useCallback(async () => {
    if (!user || user.role !== "teacher") {
      return;
    }

    setLoadingAssignments(true);
    try {
      const response = await getTeacherAssignments({ page: 1, pageSize: 5 });
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoadingAssignments(false);
    }
  }, [user]);

  // Load doubt ticket stats
  const loadDoubtTicketStats = useCallback(async () => {
    if (!user || user.role !== "teacher") {
      return;
    }

    setLoadingDoubtTickets(true);
    try {
      const response = await getDoubtTicketStats();
      setDoubtTicketStats(response.stats || null);
    } catch (error) {
      console.error("Failed to load doubt ticket stats:", error);
    } finally {
      setLoadingDoubtTickets(false);
    }
  }, [user]);

  useEffect(() => {
    const refresh = async () => {
      try {
        setLoadingEbooks(true);
        setLoadingQuizzes(true);
        // Fetch all teacher data from backend
        const [ebooksData, quizzesData, coursesData] = await Promise.all([
          getTeacherEbooks().catch(() => []),
          getTeacherQuizzes().catch(() => []),
          getTeacherCourses().catch(() => []),
        ]);
        setEbooks(Array.isArray(ebooksData) ? ebooksData : []);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (error) {
        console.error("Failed to load teacher data:", error);
        setEbooks([]);
        setQuizzes([]);
        setCourses([]);
      } finally {
        setLoadingEbooks(false);
        setLoadingQuizzes(false);
      }
    };

    refresh();
    loadDashboard();
    loadAssignments();
    loadDoubtTicketStats();
  }, [loadDashboard, loadAssignments, loadDoubtTicketStats]);

  // Handle new enrollment updates
  const handleNewEnrollment = useCallback((enrollment) => {
    // Refresh dashboard to show updated enrollment count
    loadDashboard();
    // Optionally show a toast notification
    toast.success(`${enrollment.student.name} enrolled in ${enrollment.course.title}`);
  }, [loadDashboard]);

  // Handle new quiz attempt updates
  const handleNewQuizAttempt = useCallback((attempt) => {
    // Refresh dashboard to show updated quiz stats
    loadDashboard();
  }, [loadDashboard]);

  // Subscribe to real-time updates using Socket.io directly
  const { socket, isConnected } = useSocket();
  
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe to all course updates
    courses.forEach((course) => {
      const courseId = course._id || course.id;
      if (courseId) {
        socket.emit("subscribe_course_updates", { courseId });
      }
    });

    // Subscribe to all quiz updates
    quizzes.forEach((quiz) => {
      const quizId = quiz._id || quiz.id;
      if (quizId) {
        socket.emit("subscribe_quiz_updates", { quizId });
      }
    });

    // Listen for enrollment updates
    const handleEnrollmentUpdate = (data) => {
      handleNewEnrollment(data.enrollment);
    };

    const handleEnrollmentNotification = (data) => {
      toast.info(`${data.enrollment.studentName} enrolled in ${data.enrollment.courseTitle}`);
    };

    // Listen for quiz attempt updates
    const handleNewAttempt = (data) => {
      handleNewQuizAttempt(data.attempt);
    };

    const handleAttemptNotification = (data) => {
      toast.info(`${data.attempt.studentName} completed ${data.attempt.quizTitle}`);
    };

    socket.on("new_enrollment", handleEnrollmentUpdate);
    socket.on("new_enrollment_notification", handleEnrollmentNotification);
    socket.on("new_quiz_attempt", handleNewAttempt);
    socket.on("new_quiz_attempt_notification", handleAttemptNotification);

    return () => {
      socket.off("new_enrollment", handleEnrollmentUpdate);
      socket.off("new_enrollment_notification", handleEnrollmentNotification);
      socket.off("new_quiz_attempt", handleNewAttempt);
      socket.off("new_quiz_attempt_notification", handleAttemptNotification);
      
      // Unsubscribe from all
      courses.forEach((course) => {
        const courseId = course._id || course.id;
        if (courseId) {
          socket.emit("unsubscribe_course_updates", { courseId });
        }
      });
      quizzes.forEach((quiz) => {
        const quizId = quiz._id || quiz.id;
        if (quizId) {
          socket.emit("unsubscribe_quiz_updates", { quizId });
        }
      });
    };
  }, [socket, isConnected, courses, quizzes, handleNewEnrollment, handleNewQuizAttempt]);

  useEffect(() => {
    const state = location.state;
    if (!state) return;

    const highlightConfig = {
      ebooks: Boolean(state.highlightEbooks),
      quizzes: Boolean(state.highlightQuizzes),
    };

    if (highlightConfig.ebooks || highlightConfig.quizzes) {
      setFlash(highlightConfig);
      // Refresh data when returning from ebook/quiz creation
      if (highlightConfig.ebooks) {
        getTeacherEbooks().then((data) => {
          setEbooks(Array.isArray(data) ? data : []);
        }).catch(() => {});
        loadDashboard();
      }
      if (highlightConfig.quizzes) {
        getTeacherQuizzes().then((data) => {
          setQuizzes(Array.isArray(data) ? data : []);
        }).catch(() => {});
        loadDashboard();
      }
      
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
  }, [location, navigate, loadDashboard]);

  const {
    headlineStats,
    managementTiles,
    salesBreakdown,
    recentPurchases,
    quizPanel,
    ebookLibrary,
    studentSpotlight,
    mentorNetwork,
  } = useMemo(() => {
    const ebookCount = Array.isArray(ebooks) ? ebooks.length : 0;
    // For ebooks, check isPublic instead of status (since backend uses isPublic: false for pending)
    const draftEbooks = Array.isArray(ebooks) ? ebooks.filter((ebook) => !ebook.isPublic).length : 0;

    // Filter quizzes by current teacher (check metadata.createdBy)
    const teacherId = user?.id || user?._id;
    const teacherQuizzes = teacherId && Array.isArray(quizzes)
      ? quizzes.filter((quiz) => {
          const createdBy = quiz.metadata?.createdBy;
          return (
            !createdBy ||
            createdBy === teacherId ||
            createdBy.toString() === teacherId.toString()
          );
        })
      : Array.isArray(quizzes) ? quizzes : [];
    
    const quizCount = teacherQuizzes.length;
    const publishedQuizzes = teacherQuizzes.filter((quiz) => quiz.status === "published");
    const draftQuizzes = teacherQuizzes.filter((quiz) => quiz.status !== "published");

    // Get published courses count from courses or dashboard data
    const publishedCoursesCount = dashboardData?.headlineStats?.coursesPublished 
      || (Array.isArray(courses) ? courses.filter((c) => c.status === "published").length : 0);

    const stats = [
      {
        id: "activeCourses",
        label: "Courses Published",
        value: publishedCoursesCount.toString(),
        icon: HiOutlineBookOpen,
        context: publishedCoursesCount > 0
          ? `${publishedCoursesCount} published`
          : "+2 launching next week",
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
        value: dashboardData?.headlineStats?.monthlyRevenue || "AED 0",
        icon: HiOutlineCurrencyDollar,
        context: dashboardData?.headlineStats?.monthlyRevenueContext || "No revenue yet",
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
        title: "Create Assignment",
        description: "Add assignments for your courses",
        cta: "Create assignment",
        tone: "from-[#a855f7]/20 to-[#9333ea]/20 border-purple-400/40 text-purple-200",
        icon: HiOutlineDocumentText,
        href: "/teacher/assignments/create",
      },
      {
        title: "View Earnings",
        description: "Track your course revenue and payments",
        cta: "View earnings",
        tone: "from-[#10b981]/20 to-[#059669]/20 border-emerald-400/40 text-emerald-200",
        icon: HiOutlineCurrencyDollar,
        href: "/teacher/earnings",
      },
      {
        title: "Payout Requests",
        description: "Request payouts for your available earnings",
        cta: "Request payout",
        tone: "from-[#f59e0b]/20 to-[#d97706]/20 border-amber-400/40 text-amber-200",
        icon: HiOutlineCurrencyDollar,
        href: "/teacher/payout-requests",
      },
      {
        title: "Payment Slips",
        description: "View and download your payment slips",
        cta: "View slips",
        tone: "from-[#3b82f6]/20 to-[#2563eb]/20 border-blue-400/40 text-blue-200",
        icon: HiOutlineDocumentText,
        href: "/teacher/payment-slips",
      },
      {
        title: "Announcements",
        description: "Create and manage announcements for students",
        cta: "Manage announcements",
        tone: "from-[#8b5cf6]/20 to-[#7c3aed]/20 border-purple-400/40 text-purple-200",
        icon: HiOutlineMegaphone,
        href: "/teacher/announcements",
      },
    ];

    // Use backend data if available, otherwise use defaults
    const sales = dashboardData?.salesBreakdown || [
      {
        type: "Courses",
        revenue: "AED 0",
        enrollments: 0,
        topCourse: "No courses yet",
        trend: "0%",
      },
      {
        type: "Books",
        revenue: "AED 0",
        enrollments: 0,
        topCourse: "No books yet",
        trend: "0%",
      },
      {
        type: "Learn & Earn",
        revenue: "AED 0",
        enrollments: 0,
        topCourse: "No quizzes yet",
        trend: "0%",
      },
    ];

    const purchases = dashboardData?.recentPurchases || [];

    // Use backend quiz data with participants (already filtered by teacher)
    const backendQuizzes = Array.isArray(dashboardData?.quizzesWithParticipants) 
      ? dashboardData.quizzesWithParticipants 
      : [];
    
    // Additional frontend filter as safety measure - only show quizzes created by this teacher
    // (teacherId is already declared above, so we reuse it)
    const filteredBackendQuizzes = teacherId && Array.isArray(backendQuizzes)
      ? backendQuizzes.filter((q) => {
          // Backend should already filter, but double-check on frontend
          const createdBy = q.metadata?.createdBy;
          // If no createdBy metadata, skip it (shouldn't happen for new quizzes)
          if (!createdBy) return false;
          return (
            createdBy === teacherId ||
            createdBy.toString() === teacherId.toString()
          );
        })
      : backendQuizzes;

    const quizPanelData = {
      active: filteredBackendQuizzes
        .filter((q) => q.status === "published")
        .map((q) => ({
          id: q.id || q._id,
          title: q.title,
          participants: q.participants ?? 0,
          reward: `+${q.rewardCoins ?? 0} coins`,
          status: "Live", // Simplified status
        })),
      drafts: (dashboardData?.pendingItems || []).filter((item) => {
        // Only show draft quizzes created by this teacher
        if (item.type !== "quiz") return true; // Keep courses and ebooks
        if (!teacherId) return false;
        // For quizzes, we need to check if they're in the backend quizzes list
        // or check metadata if available
        const createdBy = item.metadata?.createdBy;
        if (!createdBy) return false;
        return (
          createdBy === teacherId ||
          createdBy.toString() === teacherId.toString()
        );
      }),
    };

    // Use backend ebook library data if available, otherwise fallback to local ebooks
    const libraryEntries = dashboardData?.ebookLibrary && dashboardData.ebookLibrary.length > 0
      ? dashboardData.ebookLibrary
      : (ebookCount && Array.isArray(ebooks)
        ? ebooks.map((ebook) => {
            const format = ebook.pages ? `PDF · ${ebook.pages} pages` : "PDF";
            const downloads = ebook.metadata?.downloads || ebook.downloads || 0;
            const updatedAt = ebook.updatedAt || ebook.createdAt;
            const lastUpdated = updatedAt 
              ? (() => {
                  const now = new Date();
                  const past = new Date(updatedAt);
                  const diffInSeconds = Math.floor((now - past) / 1000);
                  if (diffInSeconds < 60) return "Just now";
                  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
                  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
                  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
                  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
                  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
                })()
              : "Just now";
            const status = ebook.isPublic ? "published" : "draft";

            return {
          id: ebook.id || ebook._id,
          title: ebook.title,
              format: format,
              downloads: downloads,
              lastUpdated: lastUpdated,
              status: status,
            };
          })
        : []);

    const students = dashboardData?.learnerSpotlight || [];

    const mentors = dashboardData?.mentorNetwork || [];

    return {
      headlineStats: stats,
      managementTiles: tiles,
      salesBreakdown: sales,
      recentPurchases: purchases,
      quizPanel: quizPanelData,
      ebookLibrary: libraryEntries,
      studentSpotlight: students,
      mentorNetwork: mentors,
    };
  }, [ebooks, quizzes, courses, dashboardData, user]);

  return (
    <div className="min-h-screen text-white">
      <SEO
        title="Teacher Dashboard | Digital AELA"
        description="Manage uploads, quizzes, learners, and earnings from the Digital AELA teacher dashboard."
        keywords="teacher dashboard, upload courses, teacher analytics, digital aela mentor portal"
        url="https://digitalaela.com/teacher/dashboard"
      />

      <div className="space-y-10">
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
                <div className="flex items-center gap-2">
                  <Link
                    to="/teacher/analytics"
                    className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:border-sky-300/70 hover:text-sky-100">
                    View Analytics
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-[#F5D26A]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:border-[#F5D26A]/70 hover:text-[#FFE28A]">
                    Download report
                  </button>
                </div>
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
                {quizPanel.active.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-400">No active quizzes yet. Create one to get started!</p>
                  </div>
                ) : (
                  quizPanel.active.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="group relative flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 transition hover:border-emerald-300/60">
                    <Link
                    to={quiz.id.startsWith("sample-quiz") ? "/teacher/quizzes/new" : `/teacher/quizzes/${quiz.id}`}
                      className="flex-1">
                    <p className="text-sm font-semibold text-white">{quiz.title}</p>
                    <p className="text-xs text-emerald-200/80">
                      {quiz.participants} participants · Reward {quiz.reward}
                    </p>
                    <p className="text-xs text-emerald-100/70">{quiz.status}</p>
                  </Link>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`)) {
                          try {
                            await deleteTeacherQuiz(quiz.id || quiz._id);
                            toast.success("Quiz deleted successfully");
                            // Refresh quizzes and dashboard
                            const quizzesData = await getTeacherQuizzes();
                            setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
                            loadDashboard();
                          } catch (error) {
                            console.error("Failed to delete quiz:", error);
                            toast.error("Failed to delete quiz. Please try again.");
                          }
                        }
                      }}
                      className="flex-shrink-0 rounded-lg p-2 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                      title="Delete quiz">
                      <FaTrash className="h-4 w-4" />
                    </button>
              </div>
                  ))
                )}
              </div>
            </motion.div>
          </section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
            <header className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Drafts & review</h2>
                <p className="text-xs text-slate-400 mt-1">Pending admin approval</p>
              </div>
            </header>
            <div className="space-y-2">
              {quizPanel.drafts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-400">No pending items</p>
                </div>
              ) : (
                quizPanel.drafts.map((item) => {
                  const getTypeLabel = (type) => {
                    switch (type) {
                      case "course":
                        return "Course";
                      case "ebook":
                        return "E-Book";
                      case "quiz":
                        return "Quiz";
                      default:
                        return "Item";
                    }
                  };

                  const getTypeColor = (type) => {
                    switch (type) {
                      case "course":
                        return "text-blue-300";
                      case "ebook":
                        return "text-purple-300";
                      case "quiz":
                        return "text-emerald-300";
                      default:
                        return "text-slate-300";
                    }
                  };

                  const route = item.route || (item.type === "course" 
                    ? `/teacher/courses/${item.id}`
                    : item.type === "ebook"
                    ? `/teacher/ebooks/${item.id}`
                    : `/teacher/quizzes/${item.id}`);

                  return (
                    <Link
                      key={item.id}
                      to={route}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-sky-400/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white truncate">{item.title}</p>
                          <span className={`text-[10px] uppercase tracking-[0.2em] ${getTypeColor(item.type)} flex-shrink-0`}>
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400/70 mt-0.5">
                          {item.status === "draft" ? "Draft" : item.status === "pending" ? "Pending approval" : item.status}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300 flex-shrink-0 ml-2">
                        {item.action} →
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineCurrencyDollar className="h-5 w-5" />
                Earnings & Payouts
              </h2>
              <Link
                to="/teacher/earnings"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/teacher/earnings"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400/40">
                <p className="font-semibold text-white mb-1">View Earnings</p>
                <p className="text-xs text-slate-400">Track revenue</p>
              </Link>
              <Link
                to="/teacher/payout-requests"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-400/40">
                <p className="font-semibold text-white mb-1">Payout Requests</p>
                <p className="text-xs text-slate-400">Request payouts</p>
              </Link>
              <Link
                to="/teacher/payment-slips"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-blue-400/40">
                <p className="font-semibold text-white mb-1">Payment Slips</p>
                <p className="text-xs text-slate-400">Download slips</p>
              </Link>
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineQuestionMarkCircle className="h-5 w-5" />
                Doubt Ticket Inbox
              </h2>
              <Link
                to="/teacher/doubt-tickets"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {loadingDoubtTickets ? (
              <div className="text-center py-8 text-sm text-slate-400">Loading...</div>
            ) : doubtTicketStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Open</p>
                  <p className="text-2xl font-semibold text-blue-400">{doubtTicketStats.open || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">In Progress</p>
                  <p className="text-2xl font-semibold text-yellow-400">{doubtTicketStats.inProgress || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Resolved</p>
                  <p className="text-2xl font-semibold text-emerald-400">{doubtTicketStats.resolved || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-2xl font-semibold text-white">{doubtTicketStats.total || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                <HiOutlineQuestionMarkCircle className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                <p>No doubt tickets assigned yet</p>
              </div>
            )}
            <Link
              to="/teacher/doubt-tickets"
              className="block w-full mt-4 text-center px-4 py-2 rounded-lg border border-[#F5D26A]/40 bg-[#F5D26A]/10 text-[#F5D26A] text-sm font-semibold hover:bg-[#F5D26A]/20 transition">
              View All Tickets
            </Link>
          </motion.section>

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
              {ebookLibrary.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <FaFilePdf className="mx-auto mb-3 h-12 w-12 text-slate-500" />
                  <p className="text-sm text-slate-400">No ebooks in your library yet</p>
                  <p className="mt-1 text-xs text-slate-500">Upload your first e-book to get started</p>
                </div>
              ) : (
                ebookLibrary.map((book) => (
                <Link
                  key={book.id ?? book.title}
                    to={`/teacher/ebooks/${book.id}`}
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
                ))
              )}
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
                <Link
                  to="/teacher/students"
                  className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                  Manage Students →
                </Link>
              </header>
              <div className="space-y-3">
                {studentSpotlight.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-400">No student progress data yet</p>
                    <p className="mt-1 text-xs text-slate-500">Students will appear here as they enroll in your courses</p>
                  </div>
                ) : (
                  studentSpotlight.map((student) => (
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
                  ))
                )}
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
                {mentorNetwork.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-400">No other mentors found</p>
                    <p className="mt-1 text-xs text-slate-500">Connect with other teachers</p>
                  </div>
                ) : (
                  mentorNetwork.map((mentor) => (
                  <div key={mentor.name} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
                    <p className="text-sm font-semibold text-white">{mentor.name}</p>
                    <p className="text-slate-300/80">{mentor.expertise}</p>
                    <p className="mt-1 text-slate-300/70">
                      Courses {mentor.courses} · Rating {mentor.rating}
                    </p>
                  </div>
                  ))
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineMegaphone className="h-5 w-5" />
                Announcements
              </h2>
              <Link
                to="/teacher/announcements"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            <div className="text-center py-8 text-sm text-slate-400">
              <HiOutlineMegaphone className="h-12 w-12 mx-auto mb-3 text-slate-500" />
              <p>Create and send announcements to your students</p>
              <Link
                to="/teacher/announcements/create"
                className="mt-4 inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black text-sm font-semibold hover:brightness-110 transition">
                Create Announcement
              </Link>
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineMegaphone className="h-5 w-5" />
                Announcements
              </h2>
              <Link
                to="/teacher/announcements"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            <div className="text-center py-8 text-sm text-slate-400">
              <HiOutlineMegaphone className="h-12 w-12 mx-auto mb-3 text-slate-500" />
              <p>Create and send announcements to your students</p>
              <Link
                to="/teacher/announcements/create"
                className="mt-4 inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black text-sm font-semibold hover:brightness-110 transition">
                Create Announcement
              </Link>
            </div>
          </motion.section>
      </div>
    </div>
  );
};

export default TeacherDashboard;

