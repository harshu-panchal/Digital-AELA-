const STORAGE_KEY = "aela.recruiter.dashboard";

const defaultRecruiterDashboard = {
  actionShortcuts: [
    {
      id: "post-job",
      title: "Post a New Role",
      description: "Launch a fresh job drop to attract applications.",
      icon: "briefcase",
      tone: "from-emerald-500/15 to-emerald-400/10 border-emerald-400/30 text-emerald-100",
      to: "composer:job",
    },
    {
      id: "post-blog",
      title: "Share a Hiring Update",
      description: "Publish insights to the Digital AELA community.",
      icon: "blog",
      tone: "from-sky-500/15 to-sky-400/10 border-sky-400/30 text-sky-100",
      to: "/blogs/create",
    },
    {
      id: "view-pipeline",
      title: "Review Applicants",
      description: "Track candidate progress across your roles.",
      icon: "users",
      tone: "from-amber-500/15 to-amber-400/10 border-amber-400/30 text-amber-100",
      to: "#pipeline",
    },
    {
      id: "read-ebooks",
      title: "Hiring Playbooks",
      description: "Download playbooks and scorecards for interviews.",
      icon: "book",
      tone: "from-fuchsia-500/15 to-fuchsia-400/10 border-fuchsia-400/30 text-fuchsia-100",
      to: "/free-library",
    },
  ],
  applicantPipeline: [
    {
      jobId: "job-public-speaking",
      jobTitle: "Communication Coach · Dubai",
      stages: [
        {
          id: "cand-1",
          name: "Sara Malik",
          profileUrl: "/profiles/students/sara-malik",
          status: "Interview Scheduled",
          submittedAt: "2025-02-16",
        },
        {
          id: "cand-2",
          name: "Mohammed Ali",
          profileUrl: "/profiles/students/mohammed-ali",
          status: "Screening",
          submittedAt: "2025-02-15",
        },
      ],
    },
    {
      jobId: "job-content-intern",
      jobTitle: "Content Strategist Intern · Remote",
      stages: [
        {
          id: "cand-3",
          name: "Fatima Hassan",
          profileUrl: "/profiles/students/fatima-hassan",
          status: "Offer Sent",
          submittedAt: "2025-02-14",
        },
        {
          id: "cand-4",
          name: "Ravi Menon",
          profileUrl: "/profiles/students/ravi-menon",
          status: "Assessment Pending",
          submittedAt: "2025-02-17",
        },
      ],
    },
  ],
  talentSpotlight: [
    {
      id: "talent-1",
      name: "Fatima Hassan",
      headline: "Marketing Storyteller · Dubai",
      profileUrl: "/profiles/students/fatima-hassan",
      skills: ["Content", "Community", "CRM"],
    },
    {
      id: "talent-2",
      name: "Omar Al Farsi",
      headline: "Public Speaking Coach · Remote",
      profileUrl: "/profiles/students/omar-alfarsi",
      skills: ["Training", "EdTech", "Operations"],
    },
    {
      id: "talent-3",
      name: "Sara Malik",
      headline: "IELTS Mentor · Hybrid",
      profileUrl: "/profiles/students/sara-malik",
      skills: ["IELTS", "Curriculum", "Coaching"],
    },
  ],
  ebookShelf: [
    {
      id: "ebook-interview",
      title: "Interview Scorecard Templates",
      pages: 24,
      url: "/free-library/interview-scorecards",
    },
    {
      id: "ebook-onboarding",
      title: "Remote Onboarding Playbook",
      pages: 28,
      url: "/free-library/onboarding-playbook",
    },
    {
      id: "ebook-employer-brand",
      title: "Employer Branding Toolkit",
      pages: 32,
      url: "/free-library/employer-branding-toolkit",
    },
  ],
  blogDrafts: [
    {
      id: "blog-1",
      title: "How We Hired 3 Coaches in 30 Days",
      status: "Draft",
      updatedAt: "2025-02-16",
      url: "/blogs/create?template=hiring-30-days",
    },
    {
      id: "blog-2",
      title: "Lessons from our IELTS Talent Pipeline",
      status: "Scheduled",
      updatedAt: "2025-02-12",
      url: "/blogs/create?template=ielts-pipeline",
    },
  ],
};

const loadRecruiterDashboard = () => {
  if (typeof window === "undefined") return defaultRecruiterDashboard;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultRecruiterDashboard;
    const parsed = JSON.parse(raw);
    return { ...defaultRecruiterDashboard, ...parsed };
  } catch {
    return defaultRecruiterDashboard;
  }
};

const persistRecruiterDashboard = (data) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const getRecruiterDashboard = () => loadRecruiterDashboard();

export const updateRecruiterDashboard = (updates) => {
  const next = { ...loadRecruiterDashboard(), ...updates };
  persistRecruiterDashboard(next);
  return next;
};


