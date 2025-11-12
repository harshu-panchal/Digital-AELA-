import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlinePlusCircle,
  HiOutlineFolderOpen,
  HiOutlineTrash,
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineNewspaper,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import PostGrid from "../components/PostGrid";
import ProfileHeader from "../components/ProfileHeader";
import CreateJobPostForm from "../components/CreateJobPostForm";
import { useExploreJobs } from "../context/ExploreJobsContext";
import {
  CURRENT_RECRUITER_USERNAME,
  highlightTags,
} from "../data/posts";
import { useAuth } from "../../../src/contexts/AuthContext";
import {
  fetchRecruiterProfile,
  fetchRecruiterJobs,
  createRecruiterJob,
  updateRecruiterJob,
  deleteRecruiterJob,
  fetchJobApplicants,
  fetchRecruiterBlogs,
} from "../../../src/services/api/recruiter";
import { fetchEbooks } from "../../../src/services/api/resources";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const defaultTalentSpotlight = useMemo(
    () => [
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
    []
  );

  const {
    recruiterPosts,
    currentRecruiterProfile,
    savedPostIds,
    appliedPostIds,
    toggleSavePost,
    openComposer,
    closeComposer,
    composerState,
    setPosts,
  } = useExploreJobs();
  const [dashboardData, setDashboardData] = useState({
    actionShortcuts: [],
    applicantPipeline: [],
    talentSpotlight: defaultTalentSpotlight,
    ebookShelf: [],
    blogDrafts: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const mapJobToPostCard = useCallback(
    (job, profile) => {
      const profileData = profile?.user ?? profile ?? {};
      const avatar =
        profile?.avatarUrl ??
        profileData.avatar ??
        currentRecruiterProfile?.avatar ??
        "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=80";

      const stats = job.stats ?? {};
      return {
        id: job.id,
        backendId: job.id,
        type: "job",
        authorType: "recruiter",
        authorUsername: CURRENT_RECRUITER_USERNAME,
        authorName: profileData.fullName ?? currentRecruiterProfile?.name ?? "Recruiter",
        authorAvatar: avatar,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary?.range ?? job.salary ?? "",
        employmentType: job.employmentType ?? "full-time",
        experience: job.experience ?? "",
        tags: job.tags ?? [],
        image:
          job.image ??
          currentRecruiterProfile?.banner ??
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80",
        createdAt: job.createdAt,
        description: job.description,
        cultureHighlights: job.cultureHighlights ?? [],
        applyCTA: job.applyCTA ?? "Apply now",
        stats: {
          likes: stats.likes ?? 0,
          comments: stats.comments ?? 0,
          views: stats.views ?? 0,
          saves: stats.saves ?? 0,
          applications: stats.applications ?? 0,
        },
      };
    },
    [currentRecruiterProfile]
  );

  const loadDashboard = useCallback(
    async (showToast = false) => {
      if (!authUser || authUser.role !== "recruiter") return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const [profile, jobsResponse, blogsResponse, ebooksResponse] = await Promise.all([
          fetchRecruiterProfile(),
          fetchRecruiterJobs(),
          fetchRecruiterBlogs({ status: "draft" }),
          fetchEbooks({ pageSize: 6 }),
        ]);

        const jobs = jobsResponse?.data ?? [];
        const applicantGroups = await Promise.all(
          jobs.map(async (job) => {
            try {
              const pipeline = await fetchJobApplicants(job.id);
              return pipeline;
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error("Failed to fetch applicants", error);
              return null;
            }
          })
        );

        const mappedPipeline = applicantGroups
          .filter(Boolean)
          .map((group) => ({
            jobId: group.jobId,
            jobTitle: group.jobTitle,
            stages: (group.applicants ?? []).map((applicant) => ({
              id: applicant.applicationId,
              name: applicant.fullName,
              profileUrl: applicant.profileUrl ?? "#",
              status: applicant.currentStage
                ? applicant.currentStage.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
                : "Screening",
              submittedAt: applicant.submittedAt
                ? new Date(applicant.submittedAt).toLocaleDateString()
                : "",
            })),
          }));

        const mappedPosts = jobs.map((job) => mapJobToPostCard(job, profile));
        setPosts((prev) => {
          const nonRecruiter = prev.filter(
            (post) =>
              post.type !== "job" || post.authorUsername !== CURRENT_RECRUITER_USERNAME
          );
          return [...mappedPosts, ...nonRecruiter];
        });

        const ebooks = (ebooksResponse?.data ?? []).map((ebook) => ({
          id: ebook.id,
          title: ebook.title,
          pages: ebook.pages ?? 0,
          url: ebook.downloadUrl ?? `/resources/ebooks/${ebook.id}`,
        }));

        const blogDrafts = (blogsResponse?.data ?? []).map((blog) => ({
          id: blog.id,
          title: blog.title,
          status: blog.status ? blog.status.replace(/\b\w/g, (c) => c.toUpperCase()) : "Draft",
          updatedAt: blog.updatedAt
            ? new Date(blog.updatedAt).toLocaleDateString()
            : "",
          url: `/blogs/editor/${blog.id}`,
        }));

        setDashboardData((prev) => ({
          ...prev,
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
          applicantPipeline: mappedPipeline,
          ebookShelf: ebooks,
          blogDrafts,
          talentSpotlight: prev.talentSpotlight?.length
            ? prev.talentSpotlight
            : defaultTalentSpotlight,
        }));

        if (showToast) {
          toast.success("Recruiter dashboard refreshed");
        }
      } catch (error) {
        setLoadError(error);
        // eslint-disable-next-line no-console
        console.error("Failed to load recruiter dashboard", error);
        if (showToast) {
          toast.error(error.message || "Unable to refresh dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [authUser, defaultTalentSpotlight, mapJobToPostCard, setPosts]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const {
    actionShortcuts = [],
    applicantPipeline = [],
    talentSpotlight = [],
    ebookShelf = [],
    blogDrafts = [],
  } = dashboardData || {};

  const shortcutIcons = useMemo(
    () => ({
      briefcase: HiOutlineBriefcase,
      blog: HiOutlineNewspaper,
      users: HiOutlineUserGroup,
      book: HiOutlineBookOpen,
    }),
    []
  );

  const stats = useMemo(() => {
    const totalViews = recruiterPosts.reduce(
      (acc, post) => acc + (post.stats?.views ?? 0),
      0
    );
    const totalApplications = recruiterPosts.reduce(
      (acc, post) => acc + (post.stats?.applications ?? 0),
      0
    );
    const avgApplyRate = recruiterPosts.length
      ? Math.round(totalApplications / recruiterPosts.length)
      : 0;

    return [
      { label: "Active Roles", value: recruiterPosts.length },
      { label: "Total Views", value: totalViews },
      { label: "Applications", value: totalApplications },
      { label: "Avg. Applies / Post", value: `${avgApplyRate}` },
    ];
  }, [recruiterPosts]);

  const handleOpenPost = (post) => {
    navigate(`/explore-jobs/post/${post.id}`, {
      state: { backgroundLocation: location },
    });
  };

  const handleEdit = (post) => openComposer("job", post);

  const handleDelete = async (postId) => {
    try {
      await deleteRecruiterJob(postId);
      toast.success("Job archived");
      await loadDashboard(true);
    } catch (error) {
      toast.error(error.message || "Unable to delete job");
    }
  };

  const composerVisible = composerState.mode === "job";

  const handleJobSubmit = async (payload, context) => {
    const body = {
      title: payload.title,
      company: payload.company,
      location: payload.location,
      employmentType: payload.employmentType || "full-time",
      experience: payload.experience,
      description: payload.description,
      tags: payload.tags ?? [],
      cultureHighlights: payload.cultureHighlights ?? [],
      applyCTA: payload.applyCTA,
      salary: payload.salary
        ? {
            currency: payload.salary.includes("₹") ? "INR" : "USD",
            range: payload.salary,
          }
        : undefined,
    };

    try {
      if (context.isEditing && context.id) {
        await updateRecruiterJob(context.id, body);
        toast.success("Job updated");
      } else {
        await createRecruiterJob(body);
        toast.success("Job created");
      }
      await loadDashboard(true);
    } catch (error) {
      toast.error(error.message || "Unable to save job");
      throw error;
    }
  };

  const handleShortcutClick = (shortcut) => {
    if (shortcut.to === "composer:job") {
      openComposer("job");
      return;
    }
    if (shortcut.to.startsWith("#")) {
      const target = document.querySelector(shortcut.to);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    navigate(shortcut.to);
  };

  return (
    <div className="space-y-10">
      <ProfileHeader
        profile={currentRecruiterProfile}
        roleBadge={
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <HiOutlineBriefcase className="h-4 w-4" />
            Recruiter Mode
          </span>
        }
        actionSlot={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              className="inline-flex items-center gap-2 rounded-3xl border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/40">
              Refresh
            </button>
            <button
              type="button"
              onClick={() => openComposer("job")}
              className="inline-flex items-center gap-2 rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5">
              <HiOutlinePlusCircle className="h-5 w-5" />
              New Job Drop
            </button>
          </div>
        }
        metrics={stats}
      />

      {isLoading && (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur">
          Syncing recruiter data…
        </div>
      )}

      {loadError && (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {loadError.message || "We couldn't load your recruiter data. Please refresh."}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actionShortcuts.map((shortcut) => {
          const Icon =
            shortcutIcons[shortcut.icon] ?? HiOutlineBriefcase;
          return (
            <motion.button
              key={shortcut.id}
              onClick={() => handleShortcutClick(shortcut)}
              type="button"
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`group h-full rounded-3xl border bg-[#050505]/95 p-5 text-left shadow-[0_24px_80px_rgba(6,9,18,0.4)] transition ${shortcut.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{shortcut.title}</p>
                  <p className="mt-2 text-xs text-slate-200/75">{shortcut.description}</p>
                </div>
                <Icon className="h-6 w-6 opacity-80" />
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80 transition group-hover:text-white">
                Open <HiOutlineArrowRight className="h-4 w-4" />
              </span>
            </motion.button>
          );
        })}
      </section>

      <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Role Library
            </p>
            <h2 className="text-xl font-semibold text-white">
              Manage your active job drops
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {highlightTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <PostGrid
          posts={recruiterPosts}
          onOpen={handleOpenPost}
          onSave={toggleSavePost}
          savedPostIds={savedPostIds}
          appliedPostIds={appliedPostIds}
          ownerUsername={CURRENT_RECRUITER_USERNAME}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyState={
            <>
              <h3 className="text-lg font-semibold text-white">
                Drop your first role to activate the feed
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                Post your active openings with visual storytelling. Perfect for
                Instagram-style recruiting.
              </p>
              <button
                type="button"
                onClick={() => openComposer("job")}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-black">
                <HiOutlinePlusCircle className="h-4 w-4" />
                Create Role
              </button>
            </>
          }
        />
      </section>

      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
          <div className="flex items-center gap-3 text-sm text-gray-200">
            <HiOutlineFolderOpen className="h-5 w-5 text-white/80" />
            Draft roles & talent pools (Coming Soon)
          </div>
          <p className="text-sm text-gray-400">
            Build evergreen pools for product, engineering, and marketing hires.
            Auto-sync with your ATS when backend is live.
          </p>
        </div>

        <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
          <div className="flex items-center gap-3 text-sm text-gray-200">
            <HiOutlineTrash className="h-5 w-5 text-white/80" />
            Archive & analytics
          </div>
          <p className="text-sm text-gray-400">
            Track performance by role, measure drop-off, and see cross-platform
            engagement.
          </p>
        </div>
      </section>

      <section id="pipeline" className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Applicant Pipeline
            </p>
            <h2 className="text-xl font-semibold text-white">
              Track candidates across each role
            </h2>
          </div>
          <Link
            to="/explore-jobs"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-200 transition hover:border-white/20 hover:text-white">
            Open job board
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.25em] text-slate-400">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Candidate</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applicantPipeline.flatMap((stage) =>
                stage.stages.map((applicant) => (
                  <tr key={`${stage.jobId}-${applicant.id}`} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-3 text-xs text-slate-300/85">{stage.jobTitle}</td>
                    <td className="px-3 py-3 text-xs text-slate-200">
                      <Link
                        to={applicant.profileUrl}
                        className="font-semibold text-white hover:text-sky-200">
                        {applicant.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-200">
                        {applicant.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400/75">
                      {applicant.submittedAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                Talent Spotlight
              </p>
              <h2 className="text-lg font-semibold text-white">
                Recommended student profiles
              </h2>
            </div>
          </header>
          <div className="space-y-3">
            {talentSpotlight.map((talent) => (
              <Link
                key={talent.id}
                to={talent.profileUrl}
                className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50">
                <div>
                  <p className="font-semibold text-white">{talent.name}</p>
                  <p className="text-xs text-slate-400/80">{talent.headline}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                    {talent.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-white/10 px-2 py-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <HiOutlineUserGroup className="h-5 w-5 text-sky-200" />
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  Hiring Playbooks
                </p>
                <h3 className="text-lg font-semibold text-white">Recommended e-books</h3>
              </div>
              <Link
                to="/free-library"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100">
                View library
              </Link>
            </div>
            <div className="space-y-3">
              {ebookShelf.map((book) => (
                <Link
                  key={book.id}
                  to={book.url}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200 transition hover:border-sky-400/50">
                  <div>
                    <p className="font-semibold text-white">{book.title}</p>
                    <p className="text-slate-400/80">{book.pages} pages</p>
                  </div>
                  <HiOutlineBookOpen className="h-5 w-5 text-sky-200" />
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  Content Studio
                </p>
                <h3 className="text-lg font-semibold text-white">Blogs in progress</h3>
              </div>
              <Link
                to="/my-blogs"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100">
                View drafts
              </Link>
            </div>
            <div className="space-y-3">
              {blogDrafts.map((draft) => (
                <Link
                  key={draft.id}
                  to={draft.url}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200 transition hover:border-sky-400/50">
                  <div>
                    <p className="font-semibold text-white">{draft.title}</p>
                    <p className="text-slate-400/80">{draft.status} · {draft.updatedAt}</p>
                  </div>
                  <HiOutlineNewspaper className="h-5 w-5 text-sky-200" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {composerVisible && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-0 bottom-0 z-[105] mx-auto w-full max-w-4xl px-4 pb-6">
            <div className="rounded-[36px] border border-white/10 bg-[#050505]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-white">
                  {composerState.post ? "Edit Job Post" : "Create Job Drop"}
                </h3>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-white/20 hover:text-white">
                  Close
                </button>
              </div>
              <CreateJobPostForm
                initialData={
                  composerState.post
                    ? {
                        ...composerState.post,
                        tags: (composerState.post.tags ?? []).join(", "),
                        cultureHighlights: (composerState.post.cultureHighlights ?? []).join(
                          ", "
                        ),
                      }
                    : undefined
                }
                isEditing={Boolean(composerState.post)}
                onSubmitComplete={closeComposer}
                onSubmitOverride={handleJobSubmit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterDashboard;

