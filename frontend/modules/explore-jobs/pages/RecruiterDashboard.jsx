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
  updateJobApplicantStage,
  createRecruiterBlog,
  updateRecruiterProfile,
} from "../../../src/services/api/recruiter";
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
      { value: "screening", label: "Screening" },
      { value: "assessment", label: "Assessment" },
      { value: "interview", label: "Interview" },
      { value: "offer", label: "Offer" },
      { value: "hired", label: "Hired" },
      { value: "rejected", label: "Rejected" },
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
        }));
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
              status: applicant.currentStage ?? "screening",
              statusLabel: (applicant.currentStage ?? "screening")
                .replace(/-/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase()),
              submittedAt: applicant.submittedAt
                ? new Date(applicant.submittedAt).toLocaleDateString()
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
      toast.success("Applicant stage updated");
    } catch (error) {
      toast.error(error.message || "Unable to update applicant");
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
      toast.error("Please add a title and content before saving.");
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
      toast.success(publish ? "Blog published!" : "Blog draft saved.");
      setBlogComposerOpen(false);
      resetBlogDraft();
      await loadDashboard(true);
      await refreshBlogs();
    } catch (error) {
      toast.error(error.message || "Unable to save blog");
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
      toast.error("Please provide your full name.");
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

      toast.success("Profile updated");
      setProfileEditorOpen(false);
    } catch (error) {
      toast.error(error.message || "Unable to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-10">
      <ProfileHeader
        profile={resolvedProfile}
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
              onClick={() => setProfileEditorOpen(true)}
              className="inline-flex items-center gap-2 rounded-3xl border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/40">
              Edit Profile
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
                      <div className="inline-flex items-center gap-2">
                        <select
                          value={applicant.status}
                          onChange={(event) =>
                            handleApplicantStageChange(
                              stage.jobId,
                              applicant.id,
                              event.target.value
                            )
                          }
                          disabled={pipelineUpdates.has(`${stage.jobId}:${applicant.id}`)}
                          className="rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-medium text-slate-200 outline-none transition focus:border-sky-400/60"
                        >
                          {applicantStageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {pipelineUpdates.has(`${stage.jobId}:${applicant.id}`) && (
                          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            Updating…
                          </span>
                        )}
                      </div>
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
            className="fixed inset-0 z-[105] mx-auto flex w-full max-w-4xl items-end justify-center px-4 pb-6 pt-20">
            <div className="relative flex w-full max-h-[85vh] flex-col rounded-[36px] border border-white/10 bg-[#050505]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">
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
                <h3 className="text-lg font-semibold text-white">Update recruiter profile</h3>
                <button
                  type="button"
                  onClick={() => setProfileEditorOpen(false)}
                  className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-white/20 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="overflow-y-auto pr-1 sm:pr-2">
                <form className="space-y-5" onSubmit={handleProfileSave}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        Full Name*
                      </label>
                      <input
                        name="fullName"
                        value={profileForm.fullName}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="Adil Rahman"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        Company
                      </label>
                      <input
                        name="company"
                        value={profileForm.company}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="AELA Talent Collective"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        Headline
                      </label>
                      <input
                        name="headline"
                        value={profileForm.headline}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="Talent Partner · GCC"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        Location
                      </label>
                      <input
                        name="location"
                        value={profileForm.location}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="Dubai, UAE"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        Website
                      </label>
                      <input
                        name="website"
                        value={profileForm.website}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="https://yourcompany.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        LinkedIn
                      </label>
                      <input
                        name="linkedin"
                        value={profileForm.linkedin}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                        Avatar URL
                      </label>
                      <input
                        name="avatarUrl"
                        value={profileForm.avatarUrl}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileInputChange}
                      className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                      rows={4}
                      placeholder="Share a short introduction so learners understand your hiring focus."
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <p className="text-xs text-gray-500">
                      Updating your profile refreshes what students, teachers, and recruiters see.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setProfileEditorOpen(false)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-white/30"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-white/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingProfile ? "Saving…" : "Save Profile"}
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
                <h3 className="text-lg font-semibold text-white">Share a community update</h3>
                <button
                  type="button"
                  onClick={() => {
                    setBlogComposerOpen(false);
                    resetBlogDraft();
                  }}
                  className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-white/20 hover:text-white"
                >
                  Close
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleBlogSave}>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Title*
                  </label>
                  <input
                    value={blogDraft.title}
                    onChange={(event) =>
                      setBlogDraft((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="How we hired 3 coaches in 30 days"
                    className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Excerpt
                  </label>
                  <textarea
                    value={blogDraft.excerpt}
                    onChange={(event) =>
                      setBlogDraft((prev) => ({ ...prev, excerpt: event.target.value }))
                    }
                    placeholder="Share a teaser for your blog drop (optional)"
                    className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Content*
                  </label>
                  <textarea
                    value={blogDraft.content}
                    onChange={(event) =>
                      setBlogDraft((prev) => ({ ...prev, content: event.target.value }))
                    }
                    placeholder="Tell the story behind your latest hiring win..."
                    className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500"
                    rows={6}
                    required
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <p className="text-xs text-gray-500">
                    You can keep this as a draft or publish directly to the community feed.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => handleBlogSave(event, false)}
                      disabled={isSavingBlog}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingBlog ? "Saving…" : "Save as Draft"}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => handleBlogSave(event, true)}
                      disabled={isSavingBlog}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-white/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingBlog ? "Publishing…" : "Publish"}
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

