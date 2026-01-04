import { formatCurrency } from "../utils/currencyUtils";

const STORAGE_KEY = "aela.student.dashboard";

const defaultDashboard = {
  journeyStats: [
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
      value: "520",
      delta: "+340 coins pending redemption",
    },
    {
      id: "speakingScore",
      label: "Speaking Score",
      value: "8.4 / 10",
      delta: "Consistent streak · Keep it up!",
    },
  ],
  ongoingCourses: [
    {
      id: "course-public-speaking",
      title: "Public Speaking Accelerator",
      mentor: "Imran Khan",
      progress: 68,
      nextSession: "Tomorrow · 19:00 GST",
      access: "Continuing cohort",
      route: "/student/courses/course-public-speaking",
    },
    {
      id: "course-ielts",
      title: "IELTS Band 8 Mastery",
      mentor: "Priya Sharma",
      progress: 42,
      nextSession: "Friday · 17:30 GST",
      access: "Live session",
      route: "/student/courses/course-ielts",
    },
    {
      id: "course-storytelling",
      title: "Corporate Storytelling Bootcamp",
      mentor: "Omar Al Farsi",
      progress: 15,
      nextSession: "Saturday · 12:00 GST",
      access: "Self-paced module unlocked",
      route: "/student/courses/course-storytelling",
    },
  ],
  learnEarnProgress: {
    streak: 7,
    leaderboardPosition: 12,
    coinsToRedeem: 520,
    redeemRoute: "/learn-earn/wallet",
    badges: [
      {
        label: "Daily Speaker",
        description: "Completed 7-day speaking streak",
        icon: "🔥",
      },
      {
        label: "Quiz Champion",
        description: "Top 5% in Vocabulary Blitz",
        icon: "🏆",
      },
      { label: "Community Mentor", description: "Helped 12 peers", icon: "🤝" },
    ],
  },
  actionShortcuts: [
    {
      id: "donation",
      title: "Donate Access",
      description: "Gift a course to a friend or community student.",
      icon: "gift",
      to: "/join-us/afterlife",
      tone: "from-emerald-500/15 to-emerald-400/10 border-emerald-400/30 text-emerald-100",
    },
    {
      id: "redeem",
      title: "Redeem AELA Coins",
      description: "Convert coins into discounts or scholarship entries.",
      icon: "sparkles",
      to: "/learn-earn/wallet",
      tone: "from-amber-500/15 to-amber-400/10 border-amber-400/30 text-amber-100",
    },
    {
      id: "blog",
      title: "Post a Blog",
      description: "Share experiences, wins, and community updates.",
      icon: "blog",
      to: "/blogs/create",
      tone: "from-fuchsia-500/15 to-fuchsia-400/10 border-fuchsia-400/30 text-fuchsia-100",
    },
  ],
  marketplaceHighlights: [
    {
      id: "market-course-1",
      title: "Executive Presence Playbook",
      type: "Course",
      mentor: "David Mathews",
      price: formatCurrency(899),
      to: "/business/courses/executive-presence",
      tag: "Best Seller",
    },
    {
      id: "market-ebook-1",
      title: "Confidence Blueprint (PDF)",
      type: "E-Book",
      mentor: "Lina Joseph",
      price: formatCurrency(149),
      to: "/free-library/confidence-blueprint",
      tag: "Top Rated",
    },
    {
      id: "market-bundle-1",
      title: "IELTS Fast Track Bundle",
      type: "Bundle",
      mentor: "Priya Sharma",
      price: formatCurrency(999),
      to: "/learn-earn/bundles/ielts-fast-track",
      tag: "Save 25%",
    },
  ],
  quizChallenges: [
    {
      id: "quiz-1",
      title: "Confidence Lightning Round",
      reward: "+120 coins",
      playRoute: "/learn-earn/activities/confidence-quiz",
      closing: "Closes in 6h",
    },
    {
      id: "quiz-2",
      title: "Vocabulary Blitz · Advanced",
      reward: "+90 coins",
      playRoute: "/learn-earn/activities/vocabulary-blitz",
      closing: "Daily challenge",
    },
    {
      id: "quiz-3",
      title: "Interview Storytelling Drill",
      reward: "+150 coins",
      playRoute: "/learn-earn/activities/interview-drill",
      closing: "Live with mentor on Friday",
    },
  ],
  ebookShelf: [
    {
      id: "ebook-2",
      title: "Storytelling Scripts for Interviews",
      pages: 32,
      to: "/free-library/storytelling-scripts",
    },
    {
      id: "ebook-3",
      title: "IELTS Task 2 Answers",
      pages: 28,
      to: "/free-library/ielts-task2",
    },
    {
      id: "ebook-4",
      title: "Body Language Field Guide",
      pages: 40,
      to: "/free-library/body-language",
    },
  ],
  jobsBoard: [
    {
      id: "job-1",
      title: "Campus Ambassador · Dubai",
      company: "AELA Talent Collective",
      type: "Part-time",
      posted: "Today",
      to: "/explore-jobs/listings/campus-ambassador",
    },
    {
      id: "job-2",
      title: "Content Intern · Remote",
      company: "Vox Media Labs",
      type: "Remote",
      posted: "2 days ago",
      to: "/explore-jobs/listings/content-intern",
    },
    {
      id: "job-3",
      title: "Community Moderator · Hybrid",
      company: "Digital AELA",
      type: "Hybrid",
      posted: "This week",
      to: "/explore-jobs/listings/community-moderator",
    },
  ],
  blogFeed: [
    {
      id: "blog-1",
      title: "How I cracked my first international interview",
      author: "Fatima Hassan",
      time: "12 mins ago",
      to: "/blogs/how-i-cracked-international-interview",
    },
    {
      id: "blog-2",
      title: "My IELTS prep routine that boosted me to band 8",
      author: "Omar Al Farsi",
      time: "Today",
      to: "/blogs/ielts-prep-routine",
    },
    {
      id: "blog-3",
      title: "Donation drive: 20 new students joined!",
      author: "Digital AELA Admin",
      time: "Yesterday",
      to: "/blogs/donation-drive-update",
    },
  ],
  studentProfiles: [
    {
      id: "student-1",
      name: "Sara Malik",
      focus: "IELTS Scholar",
      to: "/profiles/students/sara-malik",
    },
    {
      id: "student-2",
      name: "Mohammed Ali",
      focus: "Debate Captain",
      to: "/profiles/students/mohammed-ali",
    },
    {
      id: "student-3",
      name: "Fatima Hassan",
      focus: "Blog Creator",
      to: "/profiles/students/fatima-hassan",
    },
  ],
  teacherSpotlight: [
    {
      id: "teacher-1",
      name: "Imran Khan",
      expertise: "Public Speaking & Confidence",
      to: "/profiles/teachers/imran-khan",
    },
    {
      id: "teacher-2",
      name: "Priya Sharma",
      expertise: "IELTS & Test Prep",
      to: "/profiles/teachers/priya-sharma",
    },
  ],
  recruiterSpotlight: [
    {
      id: "recruiter-1",
      name: "TalentBridge HR",
      roles: "Communication Coaches · GCC",
      to: "/profiles/recruiters/talentbridge",
    },
    {
      id: "recruiter-2",
      name: "Vox Media Labs",
      roles: "Content & Community Internships",
      to: "/profiles/recruiters/vox-media",
    },
  ],
};

const loadStoredDashboard = () => {
  if (typeof window === "undefined") return defaultDashboard;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDashboard;
    const parsed = JSON.parse(raw);
    return { ...defaultDashboard, ...parsed };
  } catch {
    return defaultDashboard;
  }
};

const persistDashboard = (data) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore write failures
  }
};

export const getStudentDashboard = () => loadStoredDashboard();

export const updateStudentDashboard = (updates) => {
  const current = loadStoredDashboard();
  const merged = { ...current, ...updates };
  persistDashboard(merged);
  return merged;
};
