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
  HiOutlineChartBar,
  HiOutlineFunnel,
  HiOutlineCalendar,
  HiOutlineDocumentText,
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
import TranslatedText from "../../../src/components/TranslatedText";
import {
  fetchRecruiterProfile,
  fetchRecruiterJobs,
  createRecruiterJob,
  updateRecruiterJob,
  deleteRecruiterJob,
  fetchJobApplicants,
  fetchRecruiterBlogs,
  updateJobApplicantStage,
  createRecruiterBlog,
  updateRecruiterProfile,
} from "../../../src/services/api/recruiter.js";
import { useBlogs } from "../../../src/contexts/BlogContext";
import { fetchEbooks } from "../../../src/services/api/resources";

const RECRUITER_AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80";

const DEFAULT_PROFILE_FORM = {
  fullName: "",
  company: "",
  headline: "",
  bio: "",
  website: "",
  linkedin: "",
  avatarUrl: "",
  location: "",
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const { refreshBlogs } = useBlogs();

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
    talentSpotlight: [],
    ebookShelf: [],
    blogDrafts: [],
    stats: {
      activeRoles: 0,
      totalViews: 0,
      totalApplications: 0,
      avgAppliesPerPost: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [blogComposerOpen, setBlogComposerOpen] = useState(false);
  const [blogDraft, setBlogDraft] = useState({
    title: "",
    excerpt: "",
    content: "",
  });
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [pipelineUpdates, setPipelineUpdates] = useState(() => new Map());
  const [serverProfile, setServerProfile] = useState(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(DEFAULT_PROFILE_FORM);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const applicantStageOptions = useMemo(
    () => [
      { value: "screening", label: <TranslatedText>Screening</TranslatedText> },
      { value: "assessment", label: <TranslatedText>Assessment</TranslatedText> },
      { value: "interview", label: <TranslatedText>Interview</TranslatedText> },
      { value: "offer", label: <TranslatedText>Offer</TranslatedText> },
      { value: "hired", label: <TranslatedText>Hired</TranslatedText> },
      { value: "rejected", label: <TranslatedText>Rejected</TranslatedText> },
    ],
    []
  );

  const buildDisplayProfile = useCallback(
    (profile) => {
      const metadata = authUser?.metadata ?? {};
      const fallbackProfile = currentRecruiterProfile ?? {};
      const stats = profile?.stats ?? {};
      return {
        name:
          profile?.user?.fullName ??
          authUser?.fullName ??
          fallbackProfile.name ??
          "Recruiter",
        avatar:
          profile?.avatarUrl ??
          metadata.avatarUrl ??
          fallbackProfile.avatar ??
          RECRUITER_AVATAR_FALLBACK,
        headline:
          profile?.headline ??
          metadata.headline ??
          (profile?.company
            ? `Talent Partner · ${profile.company}`
            : fallbackProfile.headline ?? "Recruiter"),
        location:
          profile?.location ??
          metadata.location ??
          metadata.city ??
          fallbackProfile.location ??
          "",
        website:
          profile?.socials?.website ??
          metadata.website ??
          fallbackProfile.website ??
          "",
        availability:
          typeof stats.activeRoles === "number"
            ? `${stats.activeRoles} active roles`
            : fallbackProfile.availability ?? "",
        bio:
          profile?.bio ??
          metadata.bio ??
          fallbackProfile.bio ??
          "Share a short introduction about your mission and hiring focus.",
        badges:
          profile?.tags ??
          fallbackProfile.badges ??
          (profile?.company ? [profile.company] : []),
        company: profile?.company ?? fallbackProfile.company,
      };
    },
    [authUser, currentRecruiterProfile]
  );

  const mapJobToPostCard = useCallback(
    (job, profile, displayProfile) => {
      const profileData = profile?.user ?? profile ?? {};
      const jobId = job.id ?? job._id ?? job.jobId ?? job.backendId;
      const stats = job.stats ?? {};
      return {
        id: jobId,
        backendId: jobId,
        type: "job",
        authorType: "recruiter",
        authorUsername: CURRENT_RECRUITER_USERNAME,
        authorName:
          displayProfile?.name ??
          profileData.fullName ??
          currentRecruiterProfile?.name ??
          authUser?.fullName ??
          "Recruiter",
        authorAvatar:
          displayProfile?.avatar ??
          profile?.avatarUrl ??
          profileData.avatar ??
          currentRecruiterProfile?.avatar ??
          authUser?.metadata?.avatarUrl ??
          RECRUITER_AVATAR_FALLBACK,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary?.range ?? job.salary ?? "",
        employmentType: job.employmentType ?? "full-time",
        experience: job.experience ?? "",
        tags: job.tags ?? [],
        image:
          job.image ??
          authUser?.metadata?.bannerImage ??
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
    [authUser, currentRecruiterProfile]
  );

  const loadDashboard = useCallback(
    async (showToast = false) => {
      if (!authUser || authUser.role !== "recruiter") return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const [profile, jobsResponse, blogsResponse, ebooksResponse] = await Promise.all([
          fetchRecruiterProfile().catch(async (error) => {
            if (error?.status === 404) {
              const defaultProfilePayload = {
                company: authUser?.metadata?.company ?? "",
                headline: authUser?.metadata?.headline ?? "Talent Partner",
                bio:
                  authUser?.metadata?.bio ??
                  "Add a short introduction so students and mentors can learn about your company.",
                avatarUrl: authUser?.metadata?.avatarUrl ?? "",
                socials: authUser?.metadata?.socials ?? {},
              };
              return updateRecruiterProfile(defaultProfilePayload);
            }
            throw error;
          }),
          fetchRecruiterJobs(),
          fetchRecruiterBlogs({ status: "draft" }),
          fetchEbooks({ pageSize: 6 }),
        ]);

        const composedProfile = buildDisplayProfile(profile);
        setServerProfile(profile);

        const jobs = (jobsResponse?.data ?? []).map((job) => ({
          ...job,
          id: job.id ?? job._id ?? job.jobId,
          backendId: job._id || job.id, // Store backend _id for API calls
        }));
        const applicantGroups = await Promise.all(
          jobs.map(async (job) => {
            try {
              // Use backend _id for API calls
              const jobIdForApi = job.backendId || job._id || job.id;
              const pipeline = await fetchJobApplicants(jobIdForApi);
              return pipeline;
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error(`Failed to fetch applicants for job ${job.id}:`, error);
              return null;
            }
          })
        );

        const mappedPipeline = applicantGroups
          .filter(Boolean)
          .map((group) => ({
            jobId: group.jobId || group.job?._id || group.job?.id,
            jobTitle: group.jobTitle || group.job?.title,
            stages: (group.applicants ?? []).map((applicant) => ({
              id: applicant.id || applicant._id,
              applicationId: applicant.id || applicant._id,
              name: applicant.candidateName || applicant.fullName || "Applicant",
              profileUrl: applicant.profileUrl || "#",
              status: applicant.currentStage || "screening",
              statusLabel: (applicant.currentStage || "screening")
                .replace(/-/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase()),
              submittedAt: applicant.submittedAt || applicant.createdAt
                ? new Date(applicant.submittedAt || applicant.createdAt).toLocaleDateString()
                : "",
            })),
          }));

        const mappedPosts = jobs.map((job) =>
          mapJobToPostCard(job, profile, composedProfile)
        );
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

        // Calculate stats from the fetched jobs (only this recruiter's jobs)
        const activeRoles = jobs.filter(
          (job) => job.status === "published" && (!job.expirationDate || new Date(job.expirationDate) > new Date())
        ).length;
        const totalViews = jobs.reduce(
          (acc, job) => acc + (job.stats?.views ?? 0),
          0
        );
        const totalApplications = jobs.reduce(
          (acc, job) => acc + (job.stats?.applications ?? 0),
          0
        );
        const avgAppliesPerPost = jobs.length > 0
          ? Math.round(totalApplications / jobs.length)
          : 0;

        setDashboardData((prev) => ({
          ...prev,
          actionShortcuts: [
            {
              id: "post-job",
              title: <TranslatedText>Post a New Role</TranslatedText>,
              description: <TranslatedText>Launch a fresh job drop to attract applications.</TranslatedText>,
              icon: "briefcase",
              tone: "from-emerald-500/15 to-emerald-400/10 border-emerald-400/30 text-emerald-100",
              to: "composer:job",
            },
            {
              id: "analytics",
              title: <TranslatedText>Analytics Hub</TranslatedText>,
              description: <TranslatedText>View comprehensive recruitment analytics and metrics.</TranslatedText>,
              icon: "chart",
              tone: "from-[#D4AF37]/15 to-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]",
              to: "/explore-jobs/recruiter/analytics",
            },
            {
              id: "post-blog",
              title: <TranslatedText>Share a Hiring Update</TranslatedText>,
              description: <TranslatedText>Publish insights to the Digital AELA community.</TranslatedText>,
              icon: "blog",
              tone: "from-sky-500/15 to-sky-400/10 border-sky-400/30 text-sky-100",
              to: "/blogs/create",
            },
            {
              id: "read-ebooks",
              title: <TranslatedText>Hiring Playbooks</TranslatedText>,
              description: <TranslatedText>Download playbooks and scorecards for interviews.</TranslatedText>,
              icon: "book",
              tone: "from-fuchsia-500/15 to-fuchsia-400/10 border-fuchsia-400/30 text-fuchsia-100",
              to: "/free-library",
            },
          ],
          applicantPipeline: mappedPipeline,
          ebookShelf: ebooks,
          blogDrafts,
          talentSpotlight: [], // Will be populated when talent spotlight API is available
          stats: {
            activeRoles,
            totalViews,
            totalApplications,
            avgAppliesPerPost,
          },
        }));

        if (showToast) {
          toast.success(<TranslatedText>Recruiter dashboard refreshed</TranslatedText>);
        }
      } catch (error) {
        setLoadError(error);
        // eslint-disable-next-line no-console
        console.error("Failed to load recruiter dashboard", error);
        if (showToast) {
          toast.error(error.message || <TranslatedText>Unable to refresh dashboard</TranslatedText>);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [authUser, mapJobToPostCard, setPosts]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!profileEditorOpen) return;
    const profile = serverProfile ?? {};
    const metadata = authUser?.metadata ?? {};
    setProfileForm({
      fullName: authUser?.fullName ?? profile?.user?.fullName ?? "",
      company: profile.company ?? metadata.company ?? "",
      headline: profile.headline ?? metadata.headline ?? "",
      bio: profile.bio ?? metadata.bio ?? "",
      website: profile.socials?.website ?? metadata.website ?? "",
      linkedin: profile.socials?.linkedin ?? metadata.linkedin ?? "",
      avatarUrl: profile.avatarUrl ?? metadata.avatarUrl ?? "",
      location: profile.location ?? metadata.location ?? metadata.city ?? "",
    });
  }, [profileEditorOpen, serverProfile, authUser]);

  const {
    actionShortcuts = [],
    applicantPipeline = [],
    talentSpotlight = [],
    ebookShelf = [],
    blogDrafts = [],
  } = dashboardData || {};

  const resolvedProfile = useMemo(
    () => buildDisplayProfile(serverProfile),
    [serverProfile, buildDisplayProfile]
  );

  const shortcutIcons = useMemo(
    () => ({
      briefcase: HiOutlineBriefcase,
      blog: HiOutlineNewspaper,
      users: HiOutlineUserGroup,
      book: HiOutlineBookOpen,
      chart: HiOutlineChartBar,
      funnel: HiOutlineFunnel,
      calendar: HiOutlineCalendar,
      bulk: HiOutlineDocumentText,
    }),
    []
  );

  // Use stats from dashboardData which are calculated from the fetched jobs
  const stats = useMemo(() => {
    const dashboardStats = dashboardData?.stats ?? {
      activeRoles: 0,
      totalViews: 0,
      totalApplications: 0,
      avgAppliesPerPost: 0,
    };

    return [
      { label: <TranslatedText>Active Roles</TranslatedText>, value: dashboardStats.activeRoles },
      { label: <TranslatedText>Total Views</TranslatedText>, value: dashboardStats.totalViews },
      { label: <TranslatedText>Applications</TranslatedText>, value: dashboardStats.totalApplications },
      { label: <TranslatedText>Avg. Applies / Post</TranslatedText>, value: `${dashboardStats.avgAppliesPerPost}` },
    ];
  }, [dashboardData?.stats]);

  const handleOpenPost = (post) => {
    navigate(`/explore-jobs/post/${post.id}`, {
      state: { backgroundLocation: location },
    });
  };

  const handleEdit = (post) => openComposer("job", post);

  const handleDelete = async (postId) => {
    try {
      await deleteRecruiterJob(postId);
      toast.success(<TranslatedText>Job archived</TranslatedText>);
      await loadDashboard(true);
    } catch (error) {
      toast.error(error.message || <TranslatedText>Unable to delete job</TranslatedText>);
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
        toast.success(<TranslatedText>Job updated</TranslatedText>);
      } else {
        await createRecruiterJob(body);
        toast.success(<TranslatedText>Job created</TranslatedText>);
      }
      await loadDashboard(true);
    } catch (error) {
      toast.error(error.message || <TranslatedText>Unable to save job</TranslatedText>);
      throw error;
    }
  };

  const handleApplicantStageChange = async (jobId, applicationId, nextStage) => {
    const key = `${jobId}:${applicationId}`;
    setPipelineUpdates((prev) => {
      const next = new Map(prev);
      next.set(key, true);
      return next;
    });
    try {
      await updateJobApplicantStage(jobId, applicationId, {
        currentStage: nextStage,
      });
      setDashboardData((prev) => ({
        ...prev,
        applicantPipeline: prev.applicantPipeline.map((group) =>
          group.jobId === jobId
            ? {
                ...group,
                stages: group.stages.map((applicant) =>
                  applicant.id === applicationId
                    ? {
                        ...applicant,
                        status: nextStage,
                        statusLabel: nextStage
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (char) => char.toUpperCase()),
                      }
                    : applicant
                ),
              }
            : group
        ),
      }));
      toast.success(<TranslatedText>Applicant stage updated</TranslatedText>);
    } catch (error) {
      toast.error(error.message || <TranslatedText>Unable to update applicant</TranslatedText>);
    } finally {
      setPipelineUpdates((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleOpenShortcut = (shortcut) => {
    if (shortcut.to === "composer:job") {
      openComposer("job");
      return;
    }
    if (shortcut.id === "post-blog") {
      setBlogComposerOpen(true);
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

  const resetBlogDraft = () => {
    setBlogDraft({
      title: "",
      excerpt: "",
      content: "",
    });
  };

  const handleBlogSave = async (event, publish = false) => {
    event.preventDefault();
    if (!blogDraft.title.trim() || !blogDraft.content.trim()) {
      toast.error(<TranslatedText>Please add a title and content before saving.</TranslatedText>);
      return;
    }

    setIsSavingBlog(true);
    try {
      await createRecruiterBlog({
        title: blogDraft.title.trim(),
        excerpt: blogDraft.excerpt.trim(),
        content: blogDraft.content.trim(),
        status: publish ? "published" : "draft",
      });
      toast.success(publish ? <TranslatedText>Blog published!</TranslatedText> : <TranslatedText>Blog draft saved.</TranslatedText>);
      setBlogComposerOpen(false);
      resetBlogDraft();
      await loadDashboard(true);
      await refreshBlogs();
    } catch (error) {
      toast.error(error.message || <TranslatedText>Unable to save blog</TranslatedText>);
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleProfileInputChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!profileForm.fullName.trim()) {
      toast.error(<TranslatedText>Please provide your full name.</TranslatedText>);
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        company: profileForm.company?.trim(),
        headline: profileForm.headline?.trim(),
        bio: profileForm.bio?.trim(),
        avatarUrl: profileForm.avatarUrl?.trim(),
        location: profileForm.location?.trim(),
        socials: {
          website: profileForm.website?.trim(),
          linkedin: profileForm.linkedin?.trim(),
        },
      };

      const updatedProfile = await updateRecruiterProfile(payload);
      setServerProfile(updatedProfile);

      const updatedDisplay = buildDisplayProfile(updatedProfile);
      setPosts((prev) =>
        prev.map((post) =>
          post.authorUsername === CURRENT_RECRUITER_USERNAME
            ? {
                ...post,
                authorName: updatedDisplay.name,
                authorAvatar: updatedDisplay.avatar,
              }
            : post
        )
      );

      toast.success(<TranslatedText>Profile updated</TranslatedText>);
      setProfileEditorOpen(false);
    } catch (error) {
      toast.error(error.message || <TranslatedText>Unable to update profile</TranslatedText>);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Show loading screen until data is fetched
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-32 pb-24">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
          <p className="text-lg font-semibold text-white"><TranslatedText>Loading recruiter dashboard...</TranslatedText></p>
          <p className="mt-2 text-sm text-slate-400"><TranslatedText>Fetching your jobs, applicants, and analytics</TranslatedText></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ProfileHeader
        profile={resolvedProfile}
        roleBadge={
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <HiOutlineBriefcase className="h-4 w-4" />
            <TranslatedText>Recruiter Mode</TranslatedText>
          </span>
        }
        actionSlot={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              className="inline-flex items-center gap-2 rounded-3xl border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/40">
              <TranslatedText>Refresh</TranslatedText>
            </button>
            <button
              type="button"
              onClick={() => setProfileEditorOpen(true)}
              className="inline-flex items-center gap-2 rounded-3xl border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/40">
              <TranslatedText>Edit Profile</TranslatedText>
            </button>
          <button
            type="button"
            onClick={() => openComposer("job")}
            className="inline-flex items-center gap-2 rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5">
            <HiOutlinePlusCircle className="h-5 w-5" />
            <TranslatedText>New Job Drop</TranslatedText>
          </button>
          </div>
        }
        metrics={stats}
      />

      {loadError && (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {loadError.message || <TranslatedText>We couldn't load your recruiter data. Please refresh.</TranslatedText>}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actionShortcuts.map((shortcut) => {
          const Icon =
            shortcutIcons[shortcut.icon] ?? HiOutlineBriefcase;
          return (
            <motion.button
              key={shortcut.id}
              onClick={() => handleOpenShortcut(shortcut)}
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
                <TranslatedText>Open</TranslatedText> <HiOutlineArrowRight className="h-4 w-4" />
              </span>
            </motion.button>
          );
        })}
      </section>

      <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              <TranslatedText>Role Library</TranslatedText>
            </p>
            <h2 className="text-xl font-semibold text-white">
              <TranslatedText>Manage your active job drops</TranslatedText>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {highlightTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                <TranslatedText>{tag}</TranslatedText>
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
                <TranslatedText>Drop your first role to activate the feed</TranslatedText>
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                <TranslatedText>Post your active openings with visual storytelling. Perfect for Instagram-style recruiting.</TranslatedText>
              </p>
              <button
                type="button"
                onClick={() => openComposer("job")}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-black">
                <HiOutlinePlusCircle className="h-4 w-4" />
                <TranslatedText>Create Role</TranslatedText>
              </button>
            </>
          }
        />
      </section>

      <section id="pipeline" className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              <TranslatedText>Applicant Pipeline</TranslatedText>
            </p>
            <h2 className="text-xl font-semibold text-white">
              <TranslatedText>Track candidates across each role</TranslatedText>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/explore-jobs/recruiter/analytics"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/20 hover:bg-white/5">
              <TranslatedText>View Analytics Hub</TranslatedText>
            </Link>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.25em] text-slate-400">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3 font-semibold"><TranslatedText>Role</TranslatedText></th>
                <th className="px-3 py-3 font-semibold"><TranslatedText>Candidate</TranslatedText></th>
                <th className="px-3 py-3 font-semibold"><TranslatedText>Status</TranslatedText></th>
                <th className="px-3 py-3 font-semibold"><TranslatedText>Submitted</TranslatedText></th>
              </tr>
            </thead>
            <tbody>
              {applicantPipeline.length === 0 || applicantPipeline.every((s) => s.stages.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center">
                    <p className="text-sm text-slate-400"><TranslatedText>No applications yet</TranslatedText></p>
                    <p className="mt-1 text-xs text-slate-500">
                      <TranslatedText>Applications from students will appear here once they apply to your jobs.</TranslatedText>
                    </p>
                  </td>
                </tr>
              ) : (
                applicantPipeline.flatMap((stage) =>
                  stage.stages.map((applicant) => (
                    <tr key={`${stage.jobId}-${applicant.id || applicant.applicationId}`} className="border-b border-white/5 last:border-b-0">
                      <td className="px-3 py-3 text-xs text-slate-300/85"><TranslatedText>{stage.jobTitle}</TranslatedText></td>
                      <td className="px-3 py-3 text-xs text-slate-200">
                        <Link
                          to={`/explore-jobs/recruiter/applicants/${stage.jobId}/${applicant.id || applicant.applicationId}`}
                          className="font-semibold text-white hover:text-sky-200 transition hover:underline">
                          <TranslatedText>{applicant.name}</TranslatedText>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <div className="inline-flex items-center gap-2">
                          <select
                            value={applicant.status}
                            onChange={(event) =>
                              handleApplicantStageChange(
                                stage.jobId,
                                applicant.id || applicant.applicationId,
                                event.target.value
                              )
                            }
                            disabled={pipelineUpdates.has(`${stage.jobId}:${applicant.id || applicant.applicationId}`)}
                            className="rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-medium text-slate-200 outline-none transition focus:border-sky-400/60"
                          >
                            {applicantStageOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {pipelineUpdates.has(`${stage.jobId}:${applicant.id || applicant.applicationId}`) && (
                            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <TranslatedText>Updating…</TranslatedText>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400/75">
                      {applicant.submittedAt}
                    </td>
                  </tr>
                  ))
                )
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
                <TranslatedText>Talent Spotlight</TranslatedText>
              </p>
              <h2 className="text-lg font-semibold text-white">
                <TranslatedText>Recommended student profiles</TranslatedText>
              </h2>
            </div>
          </header>
          <div className="space-y-3">
            {talentSpotlight.length > 0 ? (
              talentSpotlight.map((talent) => (
                <Link
                  key={talent.id}
                  to={talent.profileUrl}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50">
                  <div>
                    <p className="font-semibold text-white"><TranslatedText>{talent.name}</TranslatedText></p>
                    <p className="text-xs text-slate-400/80"><TranslatedText>{talent.headline}</TranslatedText></p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                      {talent.skills.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 px-2 py-1">
                          <TranslatedText>{skill}</TranslatedText>
                        </span>
                      ))}
                    </div>
                  </div>
                  <HiOutlineUserGroup className="h-5 w-5 text-sky-200" />
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-white/10 bg-black/70 px-4 py-6 text-center">
                <p className="text-sm text-slate-400"><TranslatedText>No talent recommendations available yet</TranslatedText></p>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  <TranslatedText>Hiring Playbooks</TranslatedText>
                </p>
                <h3 className="text-lg font-semibold text-white"><TranslatedText>Recommended e-books</TranslatedText></h3>
              </div>
              <Link
                to="/free-library"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100">
                <TranslatedText>View library</TranslatedText>
              </Link>
            </div>
            <div className="space-y-3">
              {ebookShelf.map((book) => (
                <Link
                  key={book.id}
                  to={book.url}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200 transition hover:border-sky-400/50">
                  <div>
                    <p className="font-semibold text-white"><TranslatedText>{book.title}</TranslatedText></p>
                    <p className="text-slate-400/80"><TranslatedText>{book.pages} pages</TranslatedText></p>
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
                  <TranslatedText>Content Studio</TranslatedText>
                </p>
                <h3 className="text-lg font-semibold text-white"><TranslatedText>Blogs in progress</TranslatedText></h3>
              </div>
              <Link
                to="/my-blogs"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100">
                <TranslatedText>View drafts</TranslatedText>
              </Link>
            </div>
            <div className="space-y-3">
              {blogDrafts.map((draft) => (
                <Link
                  key={draft.id}
                  to={draft.url}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200 transition hover:border-sky-400/50">
                  <div>
                    <p className="font-semibold text-white"><TranslatedText>{draft.title}</TranslatedText></p>
                    <p className="text-slate-400/80"><TranslatedText>{draft.status}</TranslatedText> · {draft.updatedAt}</p>
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
            className="fixed inset-0 z-[105] mx-auto flex w-full max-w-4xl items-end justify-center px-4 pb-6 pt-20">
            <div className="relative flex w-full max-h-[85vh] flex-col rounded-[36px] border border-white/10 bg-[#050505]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-white">
                  {composerState.post ? <TranslatedText>Edit Job Post</TranslatedText> : <TranslatedText>Create Job Drop</TranslatedText>}
                </h3>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-white/20 hover:text-white">
                  <TranslatedText>Close</TranslatedText>
                </button>
              </div>
              <div className="overflow-y-auto pr-1 sm:pr-2">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileEditorOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-0 z-[106] mx-auto flex w-full max-w-3xl items-end justify-center px-4 pb-6 pt-20"
          >
            <div className="relative flex w-full max-h-[82vh] flex-col rounded-[36px] border border-white/10 bg-[#050505]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-white"><TranslatedText>Update recruiter profile</TranslatedText></h3>
                <button
                  type="button"
                  onClick={() => setProfileEditorOpen(false)}
                  className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-white/20 hover:text-white"
                >
                  <TranslatedText>Close</TranslatedText>
                </button>
              </div>
              <div className="overflow-y-auto pr-1 sm:pr-2">
                <form className="space-y-5" onSubmit={handleProfileSave}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        <TranslatedText>Full Name*</TranslatedText>
                      </label>
                      <input
                        name="fullName"
                        value={profileForm.fullName}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="Adil Rahman" // Placeholder
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        <TranslatedText>Company</TranslatedText>
                      </label>
                      <input
                        name="company"
                        value={profileForm.company}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="AELA Talent Collective" // Placeholder
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        <TranslatedText>Headline</TranslatedText>
                      </label>
                      <input
                        name="headline"
                        value={profileForm.headline}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="Talent Partner · GCC" // Placeholder
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        <TranslatedText>Location</TranslatedText>
                      </label>
                      <input
                        name="location"
                        value={profileForm.location}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="Dubai, UAE" // Placeholder
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        <TranslatedText>Website</TranslatedText>
                      </label>
                      <input
                        name="website"
                        value={profileForm.website}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="https://yourcompany.com" // Placeholder
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        <TranslatedText>LinkedIn</TranslatedText>
                      </label>
                      <input
                        name="linkedin"
                        value={profileForm.linkedin}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="https://linkedin.com/in/..." // Placeholder
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        <TranslatedText>Avatar URL</TranslatedText>
                      </label>
                      <input
                        name="avatarUrl"
                        value={profileForm.avatarUrl}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="https://images.unsplash.com/..." // Placeholder
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                      <TranslatedText>Bio</TranslatedText>
                    </label>
                    <textarea
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileInputChange}
                      className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                      rows={4}
                      placeholder="Share a short introduction so learners understand your hiring focus." // Placeholder
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <p className="text-xs text-gray-500">
                      <TranslatedText>Updating your profile refreshes what students, teachers, and recruiters see.</TranslatedText>
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setProfileEditorOpen(false)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-white/30"
                      >
                        <TranslatedText>Cancel</TranslatedText>
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-white/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingProfile ? <TranslatedText>Saving…</TranslatedText> : <TranslatedText>Save Profile</TranslatedText>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {blogComposerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-0 bottom-0 z-[105] mx-auto w-full max-w-3xl px-4 pb-6"
          >
            <div className="rounded-[36px] border border-white/10 bg-[#050505]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-white"><TranslatedText>Share a community update</TranslatedText></h3>
                <button
                  type="button"
                  onClick={() => {
                    setBlogComposerOpen(false);
                    resetBlogDraft();
                  }}
                  className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-white/20 hover:text-white"
                >
                  <TranslatedText>Close</TranslatedText>
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleBlogSave}>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    <TranslatedText>Title*</TranslatedText>
                  </label>
                  <input
                    value={blogDraft.title}
                    onChange={(event) =>
                      setBlogDraft((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="How we hired 3 coaches in 30 days" // Placeholder
                    className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    <TranslatedText>Excerpt</TranslatedText>
                  </label>
                  <textarea
                    value={blogDraft.excerpt}
                    onChange={(event) =>
                      setBlogDraft((prev) => ({ ...prev, excerpt: event.target.value }))
                    }
                    placeholder="Share a teaser for your blog drop (optional)" // Placeholder
                    className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    <TranslatedText>Content*</TranslatedText>
                  </label>
                  <textarea
                    value={blogDraft.content}
                    onChange={(event) =>
                      setBlogDraft((prev) => ({ ...prev, content: event.target.value }))
                    }
                    placeholder="Tell the story behind your latest hiring win..." // Placeholder
                    className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                    rows={6}
                    required
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <p className="text-xs text-gray-500">
                    <TranslatedText>You can keep this as a draft or publish directly to the community feed.</TranslatedText>
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => handleBlogSave(event, false)}
                      disabled={isSavingBlog}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingBlog ? <TranslatedText>Saving…</TranslatedText> : <TranslatedText>Save as Draft</TranslatedText>}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => handleBlogSave(event, true)}
                      disabled={isSavingBlog}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-white/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingBlog ? <TranslatedText>Publishing…</TranslatedText> : <TranslatedText>Publish</TranslatedText>}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterDashboard;

