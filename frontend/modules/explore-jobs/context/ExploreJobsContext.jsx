import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  CURRENT_RECRUITER_USERNAME,
  CURRENT_SEEKER_USERNAME,
  highlightTags,
  initialPosts,
  initialRecruiterProfiles,
  initialSeekerProfiles,
} from "../data/posts";
import { useAuth } from "../../../src/contexts/AuthContext";
import { fetchPublishedJobs, submitJobApplication } from "../../../src/services/api/jobs";
import { getStoredTokens } from "../../../src/services/api/baseClient";

const ExploreJobsContext = createContext(undefined);

const generateId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const ExploreJobsProvider = ({ children }) => {
  const { user: authUser } = useAuth();
  const [posts, setPosts] = useState(initialPosts);
  const [recruiterProfiles, setRecruiterProfiles] = useState(
    initialRecruiterProfiles
  );
  const [seekerProfiles, setSeekerProfiles] = useState(initialSeekerProfiles);

  const [appliedPostIds, setAppliedPostIds] = useState(() => new Set());
  const [savedPostIds, setSavedPostIds] = useState(() => new Set());
  const [composerState, setComposerState] = useState({ mode: null, post: null });
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // Map backend job to post format
  const mapBackendJobToPost = useMemo(
    () => (job) => {
      const owner = job.owner || {};
      const stats = job.stats || {};
      return {
        id: job.id || job._id,
        backendId: job.id || job._id,
        type: "job",
        authorType: "recruiter",
        authorUsername: CURRENT_RECRUITER_USERNAME,
        authorName: owner.fullName || "Recruiter",
        authorAvatar:
          "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=80",
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary?.range || job.salary || "",
        employmentType: job.employmentType || "full-time",
        experience: job.experience || "",
        tags: job.tags || [],
        image:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80",
        createdAt: job.publishedAt || job.createdAt,
        description: job.description,
        cultureHighlights: job.cultureHighlights || [],
        applyCTA: job.applyCTA || "Apply now",
        stats: {
          likes: 0,
          comments: 0,
          views: stats.views || 0,
          saves: stats.saves || 0,
          applications: stats.applications || 0,
        },
      };
    },
    []
  );

  // Fetch published jobs from backend
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoadingJobs(true);
      try {
        const response = await fetchPublishedJobs({ pageSize: 50 });
        const backendJobs = (response?.data || []).map(mapBackendJobToPost);

        // Merge backend jobs with existing posts (keep resume posts, etc.)
        setPosts((prev) => {
          const nonJobPosts = prev.filter((post) => post.type !== "job");
          const existingJobIds = new Set(nonJobPosts.map((p) => p.id));
          const newJobs = backendJobs.filter((job) => !existingJobIds.has(job.id));
          return [...nonJobPosts, ...newJobs];
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load jobs from backend", error);
        // Keep existing posts if fetch fails
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobs();
  }, [mapBackendJobToPost]);

  const currentRecruiterProfile = useMemo(
    () =>
      recruiterProfiles.find(
        (profile) => profile.username === CURRENT_RECRUITER_USERNAME
      ) ?? recruiterProfiles[0],
    [recruiterProfiles]
  );

  const currentSeekerProfile = useMemo(
    () =>
      seekerProfiles.find(
        (profile) => profile.username === CURRENT_SEEKER_USERNAME
      ) ?? seekerProfiles[0],
    [seekerProfiles]
  );

  const toggleSavePost = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              stats: {
                ...post.stats,
                saves: savedPostIds.has(postId)
                  ? Math.max((post.stats?.saves ?? 0) - 1, 0)
                  : (post.stats?.saves ?? 0) + 1,
              },
            }
          : post
      )
    );

    setSavedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const applyToJob = async (postId) => {
    const target = posts.find((post) => post.id === postId && post.type === "job");
    if (!target) return;

    const tokens = getStoredTokens();
    const jobId = target.backendId || target.id;

    // If user has backend tokens, submit to API
    if (tokens?.accessToken && jobId) {
      try {
        await submitJobApplication(jobId, {
          candidateName: authUser?.fullName || "Student",
          candidateHeadline: authUser?.metadata?.headline,
          profileUrl: `/profiles/${authUser?.role}/${authUser?.id}`,
        });
        toast.success("Application submitted successfully!");
      } catch (error) {
        if (error.status === 409) {
          toast.error("You have already applied to this job");
        } else {
          toast.error(error.message || "Failed to submit application");
        }
        return; // Don't update UI if API call failed
      }
    } else if (!tokens?.accessToken) {
      // User doesn't have backend tokens - this is a mock application
      toast.warning(
        "Application saved locally. Please log in with backend authentication to submit your application.",
        { autoClose: 5000 }
      );
      // eslint-disable-next-line no-console
      console.warn("Student applied without backend tokens - application not saved to backend");
    }

    // Update local state
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              stats: {
                ...post.stats,
                applications: (post.stats?.applications ?? 0) + 1,
              },
            }
          : post
      )
    );

    setAppliedPostIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
  };

  const createJobPost = (payload) => {
    const newPost = {
      id: generateId("job"),
      type: "job",
      authorType: "recruiter",
      authorUsername: currentRecruiterProfile?.username,
      authorName: currentRecruiterProfile?.name,
      authorAvatar: currentRecruiterProfile?.avatar,
      title: payload.title,
      company: payload.company,
      location: payload.location,
      salary: payload.salary,
      experience: payload.experience,
      employmentType: payload.employmentType,
      tags: payload.tags ?? [],
      image: payload.image,
      createdAt: new Date().toISOString(),
      description: payload.description,
      cultureHighlights: payload.cultureHighlights ?? [],
      applyCTA: payload.applyCTA ?? "Apply via Explore Jobs",
      stats: {
        likes: 0,
        comments: 0,
        saves: 0,
        views: 0,
        applications: 0,
      },
    };

    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const updateJobPost = (postId, payload) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId && post.type === "job"
          ? {
              ...post,
              ...payload,
              tags: payload.tags ?? post.tags,
              cultureHighlights:
                payload.cultureHighlights ?? post.cultureHighlights,
            }
          : post
      )
    );
  };

  const deletePost = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));

    setSavedPostIds((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });

    setAppliedPostIds((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  const createResumePost = (payload) => {
    const newPost = {
      id: generateId("resume"),
      type: "resume",
      authorType: "seeker",
      authorUsername: currentSeekerProfile?.username,
      authorName: currentSeekerProfile?.name,
      authorAvatar: currentSeekerProfile?.avatar,
      title: payload.title,
      headline: payload.headline,
      summary: payload.summary,
      experience: payload.experience ?? [],
      skills: payload.skills ?? [],
      achievements: payload.achievements ?? [],
      availability: payload.availability ?? "Open to opportunities",
      image: payload.image,
      resumeUrl: payload.resumeUrl ?? "#",
      portfolioUrl: payload.portfolioUrl ?? "#",
      createdAt: new Date().toISOString(),
      stats: {
        likes: 0,
        comments: 0,
        saves: 0,
        views: 0,
        referrals: 0,
      },
    };

    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const updateResumePost = (postId, payload) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId && post.type === "resume"
          ? {
              ...post,
              ...payload,
              skills: payload.skills ?? post.skills,
              achievements: payload.achievements ?? post.achievements,
              experience: payload.experience ?? post.experience,
            }
          : post
      )
    );
  };

  const getPostById = (postId) => posts.find((post) => post.id === postId);

  const getProfileByUsername = (username) =>
    recruiterProfiles.find((profile) => profile.username === username) ??
    seekerProfiles.find((profile) => profile.username === username);

  const getPostsByUsername = (username) =>
    posts.filter((post) => post.authorUsername === username);

  const recruiterPosts = useMemo(
    () => posts.filter((post) => post.authorUsername === CURRENT_RECRUITER_USERNAME),
    [posts]
  );

  const seekerPosts = useMemo(
    () => posts.filter((post) => post.authorUsername === CURRENT_SEEKER_USERNAME),
    [posts]
  );

  const recruiterJobPosts = useMemo(
    () => posts.filter((post) => post.type === "job"),
    [posts]
  );

  const seekerShowcasePosts = useMemo(
    () => posts.filter((post) => post.type === "resume"),
    [posts]
  );

  const value = {
    posts,
    recruiterJobPosts,
    seekerShowcasePosts,
    recruiterPosts,
    seekerPosts,
    recruiterProfiles,
    seekerProfiles,
    currentRecruiterProfile,
    currentSeekerProfile,
    appliedPostIds,
    savedPostIds,
    highlightTags,
    composerState,
    openComposer: (mode, post = null) => setComposerState({ mode, post }),
    closeComposer: () => setComposerState({ mode: null, post: null }),
    toggleSavePost,
    applyToJob,
    createJobPost,
    updateJobPost,
    deletePost,
    createResumePost,
    updateResumePost,
    getPostById,
    getProfileByUsername,
    getPostsByUsername,
    setRecruiterProfiles,
    setSeekerProfiles,
    setPosts,
  };

  return (
    <ExploreJobsContext.Provider value={value}>
      {children}
    </ExploreJobsContext.Provider>
  );
};

export const useExploreJobs = () => {
  const context = useContext(ExploreJobsContext);
  if (!context) {
    throw new Error("useExploreJobs must be used within ExploreJobsProvider");
  }
  return context;
};


