/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";
import { useUser } from "./UserContext";
import { useAuth } from "./AuthContext";
import {
  fetchPublishedBlogs,
  createBlog,
  toggleBlogLike,
  addBlogComment,
  searchBlogs,
  fetchBlogCategories,
  addBlogReaction,
  removeBlogReaction,
  shareBlog,
  fetchUserPendingBlogs,
} from "../services/api/blogs";
import { isNetworkError } from "../services/api/baseClient";

const BlogContext = createContext(null);

const now = new Date();

const seededBlogs = [
  {
    id: "blog-public-speaking-masterclass",
    title: "Finding Your Voice: Public Speaking Confidence in 2025",
    excerpt:
      "A step-by-step framework used inside Digital AELA to help learners remove stage fear and present like leaders.",
    banner:
      "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1600&q=80",
    thumbnail:
      "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=800&q=80",
    tags: ["Communication", "Soft Skills", "Leadership"],
    category: "Communication",
    readTime: 8,
    content:
      "<h2>Start with clarity</h2><p>Before you step in front of the spotlight, rehearse the first 60 seconds until it feels like breathing.\nAt Digital AELA we break every talk into 3 frames — Hook, Story, Impact.</p><blockquote><strong>Coach Insight:</strong> Confidence loves structure. Build a map, then add emotion.</blockquote><p>Use community practice rooms to receive fast feedback and track your progress after each milestone.</p>",
    likes: 264,
    views: 5940,
    publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    author: {
      id: "author-imran-khan",
      name: "Imran Khan",
      avatar: "https://i.pravatar.cc/150?img=12",
      bio: "Founder · Digital AELA | Public Speaking Coach",
      role: "Founder",
      social: {
        platform: "LinkedIn",
        url: "https://linkedin.com/in/digitalaela",
      },
      followers: 18240,
    },
    comments: [
      {
        id: "comment-fatima-1",
        author: {
          name: "Fatima Hassan",
          avatar: "https://i.pravatar.cc/150?img=47",
        },
        message: "These structure prompts helped me win my last debate. Highly recommend!",
        createdAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
        likes: 12,
      },
      {
        id: "comment-omar-1",
        author: {
          name: "Omar Al Farsi",
          avatar: "https://i.pravatar.cc/150?img=15",
        },
        message: "The 3-frame format makes storytelling so much easier.",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
        likes: 5,
      },
    ],
  },
  {
    id: "blog-ai-personalized-learning",
    title: "How AI Journaling Builds Daily Speaking Momentum",
    excerpt:
      "Turning reflective practice into a competitive advantage with Digital AELA's AI-powered speaking journals.",
    banner:
      "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1600&q=80",
    thumbnail:
      "https://images.unsplash.com/photo-1522204507449-d27c8ad37000?auto=format&fit=crop&w=800&q=80",
    tags: ["AI", "Learning", "Productivity"],
    category: "Technology",
    readTime: 6,
    content:
      "<p>Aim for daily momentum, not perfection. Our AI prompts analyze tone and suggest improvements while tracking your consistency.</p><ul><li>Schedule 10 minutes each evening.</li><li>Record quick reflections.</li><li>Track growth in the analytics dashboard.</li></ul><p>Use the insights to plan your next presentation or coaching session.</p>",
    likes: 198,
    views: 3720,
    publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    author: {
      id: "author-priya-sharma",
      name: "Priya Sharma",
      avatar: "https://i.pravatar.cc/150?img=32",
      bio: "Content Strategist · Toastmasters Winner",
      role: "Lead Mentor",
      social: {
        platform: "Instagram",
        url: "https://instagram.com/digitalaela",
      },
      followers: 10980,
    },
    comments: [
      {
        id: "comment-sara-1",
        author: {
          name: "Sara Malik",
          avatar: "https://i.pravatar.cc/150?img=21",
        },
        message: "The daily prompts increased my speaking streak to 28 days!",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 10).toISOString(),
        likes: 7,
      },
    ],
  },
  {
    id: "blog-mentor-playbook",
    title: "Mentor Playbook: Designing Impactful Speaking Challenges",
    excerpt:
      "A behind-the-scenes look at how mentors craft high-engagement speaking challenges that build confidence.",
    banner:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1600&q=80",
    thumbnail:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
    tags: ["Mentoring", "Challenges", "Community"],
    category: "Mentorship",
    readTime: 9,
    content:
      "<p>Challenges spark accountability. Design yours with three levels, each building on the previous one.</p><p>Inside the mentor dashboard we track participation, completion, and ratings to tailor next week's theme.</p>",
    likes: 156,
    views: 2850,
    publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    author: {
      id: "author-omar-al-farsi",
      name: "Omar Al Farsi",
      avatar: "https://i.pravatar.cc/150?img=15",
      bio: "Career Coach · TEDx Speaker",
      role: "Community Mentor",
      social: {
        platform: "LinkedIn",
        url: "https://linkedin.com/in/omaralfarsi",
      },
      followers: 8640,
    },
    comments: [],
  },
];

const formatBlog = (blog) => ({
  ...blog,
  likeCount: blog.likeCount ?? (Array.isArray(blog.likes) ? blog.likes.length : blog.likes ?? 0),
  commentCount: blog.commentCount ?? blog.comments?.length ?? 0,
});

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80";

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const mapApiBlog = (blog) => {
  const authorId = blog.author?.id ?? blog.author?._id ?? "";
  const recruiterProfile = blog.recruiterProfile ?? {};

  const formatted = {
    id: blog.id ?? blog._id ?? crypto.randomUUID(),
    title: blog.title,
    excerpt: blog.excerpt ?? "",
    banner: blog.coverImage ?? blog.thumbnail ?? DEFAULT_THUMBNAIL,
    thumbnail: blog.coverImage ?? blog.thumbnail ?? DEFAULT_THUMBNAIL,
    tags: blog.tags ?? [],
    category: blog.category ?? "Community",
    readTime:
      blog.readTime ??
      Math.max(3, Math.round(((blog.content?.length ?? 800) || 800) / 250)),
    content: blog.content ?? "",
    likes: Array.isArray(blog.likes) ? blog.likes.length : (blog.likes ?? blog.stats?.likes ?? 0),
    views: blog.views ?? blog.stats?.views ?? 0,
    likedBy: Array.isArray(blog.likes) ? blog.likes.map((id) => (id._id ? id._id.toString() : id.toString())) : [],
    publishedAt: blog.publishedAt ?? blog.updatedAt ?? new Date().toISOString(),
    author: blog.author
      ? {
          id: authorId,
          name: blog.author.fullName ?? blog.author.name ?? "Recruiter",
          avatar:
            recruiterProfile?.avatarUrl ??
            blog.author.avatarUrl ??
            blog.recruiterProfile?.avatarUrl ??
            "https://i.pravatar.cc/150?img=11",
          bio:
            recruiterProfile?.headline ??
            blog.author.bio ??
            "Digital AELA contributor",
          role:
            recruiterProfile?.company ??
            blog.author.role ??
            "Digital AELA Recruiter",
          social: recruiterProfile?.socials?.website
            ? {
                platform: "Website",
                url: recruiterProfile.socials.website,
              }
            : undefined,
          followers: recruiterProfile?.stats?.totalViews ?? 0,
        }
      : {
          id: "digital-aela",
          name: "Digital AELA",
          avatar: "https://i.pravatar.cc/150?img=16",
          bio: "Digital AELA community insights",
          role: "Community",
        },
    comments: blog.comments ?? [],
    source: "backend",
  };

  return formatBlog(formatted);
};

export const useBlogs = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlogs must be used within a BlogProvider");
  }
  return context;
};

export const BlogProvider = ({ children }) => {
  const { profile } = useUser();
  const { user: authUser } = useAuth();

  // Initialize with empty array in production, seeded blogs only in development
  const [blogs, setBlogs] = useState(() => 
    isDevelopment 
      ? seededBlogs.map((blog) => ({
          ...formatBlog(blog),
          source: "seed",
        }))
      : []
  );
  const [drafts, setDrafts] = useState([]);
  const [pendingBlogs, setPendingBlogs] = useState([]);
  const [followingAuthors, setFollowingAuthors] = useState(() => new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    tags: [],
    category: "all",
    sort: "trending",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const refreshBlogs = useCallback(
    async (params = {}) => {
      try {
        setIsLoading(true);
        const response = await fetchPublishedBlogs(params);
        const remote = response?.data ?? [];
        setBlogs((prev) => {
          const localBlogs = prev.filter((blog) => blog.source === "local");
          const remoteFormatted = remote.map(mapApiBlog);
          
          // Create a map of remote blog IDs for quick lookup
          const remoteBlogIds = new Set(remoteFormatted.map((blog) => blog.id));
          
          // Keep backend/seed blogs that aren't in remote response yet (e.g., just created)
          const existingBackendBlogs = prev.filter(
            (blog) => blog.source === "backend" && !remoteBlogIds.has(blog.id)
          );
          
          if (remoteFormatted.length > 0) {
            // Merge: local blogs + existing backend blogs not in remote + remote blogs
            // Remote blogs will override existing ones if duplicates exist
            const allBlogs = [...localBlogs, ...existingBackendBlogs, ...remoteFormatted];
            
            // Deduplicate by ID, keeping remote blogs when duplicates exist
            const blogMap = new Map();
            
            // First, add local and existing backend blogs
            for (const blog of [...localBlogs, ...existingBackendBlogs]) {
              blogMap.set(blog.id, blog);
            }
            
            // Then, add/override with remote blogs (remote takes precedence)
            for (const blog of remoteFormatted) {
              blogMap.set(blog.id, blog);
            }
            
            // Sort by publishedAt (newest first), then by createdAt as fallback
            const sortedBlogs = Array.from(blogMap.values()).sort((a, b) => {
              const dateA = new Date(a.publishedAt || a.createdAt || 0);
              const dateB = new Date(b.publishedAt || b.createdAt || 0);
              return dateB - dateA; // Descending order (newest first)
            });
            
            return sortedBlogs;
          }
          
          // If no remote blogs, keep existing structure (only seeded blogs in development)
          if (prev.length > 0) {
            return prev;
          }
          // Only return seeded blogs in development mode
          return isDevelopment 
            ? seededBlogs.map((blog) => ({
                ...formatBlog(blog),
                source: "seed",
              }))
            : [];
        });
        setLoadError(null);
      } catch (error) {
        setLoadError(error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Load categories and tags from API
  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchBlogCategories();
      if (data) {
        setCategories(data.categories || []);
        setTags(data.tags || []);
      }
    } catch (error) {
      if (isNetworkError(error) && !isDevelopment) {
        console.error("[BlogContext] Failed to load categories:", error.message);
      } else if (!isNetworkError(error)) {
        console.warn("Failed to load categories:", error);
      }
    }
  }, []);

  // Advanced search function
  const performSearch = useCallback(async (searchParams) => {
    try {
      setIsLoading(true);
      const response = await searchBlogs(searchParams);
      const remote = response?.blogs ?? [];
      const remoteFormatted = remote.map(mapApiBlog);
      setBlogs((prev) => {
        const localBlogs = prev.filter((blog) => blog.source === "local");
        return [...localBlogs, ...remoteFormatted];
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBlogs();
    loadCategories();
  }, [refreshBlogs, loadCategories]);

  const saveDraft = useCallback((draft) => {
    setDrafts((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === draft.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...draft,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      return [
        {
          id: draft.id ?? crypto.randomUUID(),
          title: draft.title,
          thumbnail: draft.thumbnail,
          content: draft.content ?? "",
          tags: draft.tags ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "draft",
        },
        ...prev,
      ];
    });
    toast.info("Draft saved", {
      toastId: "blog-draft-saved",
    });
  }, []);

  const publishBlog = useCallback(
    async (blog) => {
      const referenceId = blog.id ?? crypto.randomUUID();
      // Ensure we use the latest profile avatar (Cloudinary URL from metadata.avatarUrl)
      const authorAvatar = 
        authUser?.metadata?.avatarUrl || 
        profile.avatar || 
        "https://i.pravatar.cc/150?img=11";
      
      // Check if user is super-admin (can publish directly)
      const isSuperAdmin = authUser?.role === "super-admin";
      
      // Try to save to backend if user is authenticated
      let savedBlog = null;
      if (authUser) {
        try {
          const blogPayload = {
            title: blog.title,
            excerpt: blog.excerpt ?? blog.description ?? blog.content?.slice(0, 160) ?? "",
            content: blog.content ?? "",
            coverImage: blog.thumbnail || blog.banner || null,
            tags: blog.tags ?? [],
            status: isSuperAdmin ? "published" : "published", // Backend will handle pending for non-super-admins
          };
          
          savedBlog = await createBlog(blogPayload);
          
          // eslint-disable-next-line no-console
          console.log("Blog saved to backend:", savedBlog);
          
          // Immediately add the new blog to state so it appears instantly
          if (savedBlog && (savedBlog._id || savedBlog.id)) {
            const backendBlog = mapApiBlog({
              ...savedBlog,
              id: savedBlog._id || savedBlog.id,
            });
            
            // eslint-disable-next-line no-console
            console.log("Mapped blog for state:", backendBlog);
            
            const blogStatus = savedBlog.status || backendBlog.status;
            const isPending = blogStatus === "pending";
            const isPublished = blogStatus === "published";
            
            if (isPublished) {
              // Add published blog to blogs list
              setBlogs((prev) => {
                // Check if blog already exists to avoid duplicates
                const existingIndex = prev.findIndex((b) => b.id === backendBlog.id);
                if (existingIndex >= 0) {
                  // Update existing blog
                  const updated = [...prev];
                  updated[existingIndex] = backendBlog;
                  return updated;
                }
                // Add new blog at the beginning
                const newBlogs = [backendBlog, ...prev];
                // eslint-disable-next-line no-console
                console.log("Updated blogs state, new count:", newBlogs.length);
                return newBlogs;
              });
              
              toast.success("Blog published successfully!", {
                toastId: `blog-published-${savedBlog._id || savedBlog.id}`,
              });
            } else if (isPending) {
              // Add pending blog to pending list
              setPendingBlogs((prev) => {
                const existingIndex = prev.findIndex((b) => b.id === backendBlog.id);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = backendBlog;
                  return updated;
                }
                return [backendBlog, ...prev];
              });
              
              toast.success("Blog submitted for approval. You'll be notified once it's reviewed.", {
                toastId: `blog-pending-${savedBlog._id || savedBlog.id}`,
              });
            }
            
            // Remove from drafts
            setDrafts((prev) => prev.filter((item) => item.id !== blog.id));
            
            // Refresh blogs list in background after a delay to ensure DB has saved
            // This ensures all users see the newly published blog when they visit the blogs page
            // Use a longer delay to ensure the database transaction has completed
            if (isPublished) {
              setTimeout(() => {
                refreshBlogs().then(() => {
                  // eslint-disable-next-line no-console
                  console.log("Blogs refreshed successfully after publish");
                }).catch((err) => {
                  // eslint-disable-next-line no-console
                  console.warn("Background refresh failed:", err);
                });
              }, 1500); // Delay to ensure DB save completes and blog is queryable
            }
            
            return backendBlog;
          } else {
            // eslint-disable-next-line no-console
            console.error("Blog save failed - invalid response:", savedBlog);
            throw new Error("Invalid blog response from server");
          }
        } catch (error) {
          if (isNetworkError(error) && !isDevelopment) {
            console.error("[BlogContext] Failed to save blog:", error.message);
          } else if (!isNetworkError(error)) {
            // eslint-disable-next-line no-console
            console.warn("Failed to save blog to backend:", error);
          }
          // Continue with local save as fallback
          toast.warning("Blog saved locally. Please check your connection.", {
            toastId: `blog-published-warning-${referenceId}`,
          });
        }
      }
      
      // Fallback: Save locally if backend save failed or user not authenticated
      const newBlog = formatBlog({
        id: referenceId,
        title: blog.title,
        excerpt: blog.excerpt ?? blog.description ?? blog.content?.slice(0, 160) ?? "",
        banner: blog.banner ?? blog.thumbnail,
        thumbnail:
          blog.thumbnail ??
          "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
        tags: blog.tags ?? [],
        category: blog.category ?? "General",
        readTime: blog.readTime ?? Math.max(3, Math.round((blog.content?.length ?? 800) / 250)),
        content: blog.content ?? "",
        likes: blog.likes ?? 0,
        views: blog.views ?? 0,
        publishedAt: new Date().toISOString(),
        author: blog.author ?? {
          id: profile.id || authUser?.id || "user",
          name: profile.name || authUser?.fullName || "User",
          avatar: authorAvatar,
          bio: profile.bio || authUser?.metadata?.bio || "",
          role: profile.title || (authUser?.role ? `${authUser.role} · Digital AELA` : "Member"),
          social: profile.socialLinks?.[0],
          followers: profile.followers || 0,
        },
        comments: blog.comments ?? [],
        source: blog.source ?? "local",
      });

      setBlogs((prev) => [newBlog, ...prev]);
      setDrafts((prev) => prev.filter((item) => item.id !== blog.id));
      
      if (!savedBlog) {
        toast.success("Blog published successfully!", {
          toastId: `blog-published-${newBlog.id}`,
        });
      }
      
      return newBlog;
    },
    [profile, authUser, refreshBlogs]
  );

  const updateBlog = useCallback((blogId, updates) => {
    setBlogs((prev) =>
      prev.map((blog) =>
        blog.id === blogId
          ? formatBlog({
              ...blog,
              ...updates,
              updatedAt: new Date().toISOString(),
            })
          : blog
      )
    );
  }, []);

  const deleteBlog = useCallback((blogId) => {
    setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
    setDrafts((prev) => prev.filter((blog) => blog.id !== blogId));
  }, []);

  const toggleLike = useCallback(
    async (blogId, actorName = profile.name) => {
      // Optimistically update UI
      const currentBlog = blogs.find((b) => b.id === blogId);
      const profileIdStr = String(profile.id || "");
      const alreadyLiked = currentBlog?.likedBy?.some((id) => String(id) === profileIdStr);
      
      // Check if this is a seeded/local blog (not in database)
      const isSeededBlog = currentBlog?.source === "seed" || currentBlog?.source === "local";
      
      setBlogs((prev) =>
        prev.map((blog) => {
          if (blog.id !== blogId) return blog;
          const nextLikes = alreadyLiked ? blog.likeCount - 1 : blog.likeCount + 1;
          const likedBy = alreadyLiked
            ? blog.likedBy.filter((id) => String(id) !== profileIdStr)
            : [...(blog.likedBy ?? []), profileIdStr];
          return {
            ...blog,
            likeCount: Math.max(0, nextLikes),
            likedBy,
            lastInteractedBy: actorName,
          };
        })
      );

      // Persist to backend if authenticated and blog is from database
      // Also check if blogId looks like a MongoDB ObjectId (24 hex characters)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(blogId);
      if (authUser && !isSeededBlog && isMongoId) {
        try {
          const response = await toggleBlogLike(blogId);
          // Update with server response
          setBlogs((prev) =>
            prev.map((blog) => {
              if (blog.id !== blogId) return blog;
              return {
                ...blog,
                likeCount: response.likeCount || blog.likeCount,
                likedBy: response.isLiked
                  ? [...new Set([...(blog.likedBy ?? []), profileIdStr])]
                  : blog.likedBy.filter((id) => String(id) !== profileIdStr),
              };
            })
          );
          toast.success(response.isLiked ? "You liked this blog" : "Like removed", {
            toastId: `blog-like-${blogId}`,
          });
        } catch (error) {
          // Revert on error
          setBlogs((prev) =>
            prev.map((blog) => {
              if (blog.id !== blogId) return blog;
              const revertedLikes = alreadyLiked ? blog.likeCount + 1 : blog.likeCount - 1;
              const revertedLikedBy = alreadyLiked
                ? [...new Set([...(blog.likedBy ?? []), profileIdStr])]
                : blog.likedBy.filter((id) => String(id) !== profileIdStr);
              return {
                ...blog,
                likeCount: Math.max(0, revertedLikes),
                likedBy: revertedLikedBy,
              };
            })
          );
          if (!isNetworkError(error)) {
            const errorMessage = error?.response?.data?.error?.message || error?.message || "Failed to update like";
            if (error?.response?.status === 404) {
              toast.error("Blog not found. It may have been deleted.", {
                toastId: `blog-like-error-${blogId}`,
              });
            } else {
              toast.error(errorMessage, {
                toastId: `blog-like-error-${blogId}`,
              });
            }
          }
        }
      } else {
        // Not authenticated - just show toast
        toast.success(alreadyLiked ? "Like removed" : "You liked this blog", {
          toastId: `blog-like-${blogId}`,
        });
      }
    },
    [profile.id, profile.name, authUser, blogs]
  );

  const addComment = useCallback(
    async (blogId, message) => {
      if (!message?.trim()) return;
      
      const currentBlog = blogs.find((b) => b.id === blogId);
      // Check if this is a seeded/local blog (not in database)
      const isSeededBlog = currentBlog?.source === "seed" || currentBlog?.source === "local";
      
      const newComment = {
        id: crypto.randomUUID(),
        message,
        createdAt: new Date().toISOString(),
        author: {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
        },
      };

      // Optimistically update UI
      setBlogs((prev) =>
        prev.map((blog) => {
          if (blog.id !== blogId) return blog;
          const updatedComments = [newComment, ...blog.comments];
          return {
            ...blog,
            comments: updatedComments,
            commentCount: updatedComments.length,
          };
        })
      );

      // Persist to backend if authenticated and blog is from database
      // Also check if blogId looks like a MongoDB ObjectId (24 hex characters)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(blogId);
      if (authUser && !isSeededBlog && isMongoId) {
        try {
          const response = await addBlogComment(blogId, message);
          // Update with server response (replace optimistic comment with real one)
          setBlogs((prev) =>
            prev.map((blog) => {
              if (blog.id !== blogId) return blog;
              const commentsWithoutOptimistic = blog.comments.filter(
                (c) => c.id !== newComment.id
              );
              const updatedComments = [response.comment, ...commentsWithoutOptimistic];
              return {
                ...blog,
                comments: updatedComments,
                commentCount: response.commentCount || updatedComments.length,
              };
            })
          );
          toast.success("Comment added", {
            toastId: `blog-comment-${blogId}`,
          });
        } catch (error) {
          // Revert on error
          setBlogs((prev) =>
            prev.map((blog) => {
              if (blog.id !== blogId) return blog;
              const commentsWithoutOptimistic = blog.comments.filter(
                (c) => c.id !== newComment.id
              );
              return {
                ...blog,
                comments: commentsWithoutOptimistic,
                commentCount: commentsWithoutOptimistic.length,
              };
            })
          );
          if (!isNetworkError(error)) {
            const errorMessage = error?.response?.data?.error?.message || error?.message || "Failed to add comment";
            if (error?.response?.status === 404) {
              toast.error("Blog not found. It may have been deleted.", {
                toastId: `blog-comment-error-${blogId}`,
              });
            } else {
              toast.error(errorMessage, {
                toastId: `blog-comment-error-${blogId}`,
              });
            }
          }
        }
      } else {
        // Not authenticated - just show toast
        toast.success("Comment added", {
          toastId: `blog-comment-${blogId}`,
        });
      }
    },
    [profile.avatar, profile.id, profile.name, authUser]
  );

  const followAuthor = useCallback((authorId) => {
    setFollowingAuthors((prev) => {
      const next = new Set(prev);
      if (next.has(authorId)) {
        next.delete(authorId);
        toast.info("You unfollowed the author", {
          toastId: `follow-${authorId}`,
        });
      } else {
        next.add(authorId);
        toast.success("You are now following this author", {
          toastId: `follow-${authorId}`,
        });
      }
      return next;
    });
  }, []);

  const registerView = useCallback((blogId) => {
    setBlogs((prev) =>
      prev.map((blog) => {
        if (blog.id !== blogId) return blog;
        return {
          ...blog,
          views: blog.views + 1,
        };
      })
    );
  }, []);

  const filteredBlogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return blogs
      .filter((blog) => {
        const matchesSearch =
          !term ||
          blog.title.toLowerCase().includes(term) ||
          blog.excerpt.toLowerCase().includes(term) ||
          blog.author.name.toLowerCase().includes(term) ||
          blog.tags.some((tag) => tag.toLowerCase().includes(term));

        const matchesCategory =
          activeFilters.category === "all" || blog.category === activeFilters.category;

        const matchesTags =
          activeFilters.tags.length === 0 || activeFilters.tags.every((tag) => blog.tags.includes(tag));

        return matchesSearch && matchesCategory && matchesTags;
      })
      .sort((a, b) => {
        switch (activeFilters.sort) {
          case "recent":
            return new Date(b.publishedAt) - new Date(a.publishedAt);
          case "popular":
            return b.likeCount - a.likeCount;
          case "views":
            return b.views - a.views;
          default:
            return b.likeCount * 1.5 + b.views * 0.5 - (a.likeCount * 1.5 + a.views * 0.5);
        }
      });
  }, [activeFilters, blogs, searchTerm]);

  const trendingBlogs = useMemo(
    () => filteredBlogs.slice(0, 6),
    [filteredBlogs]
  );

  const recentBlogs = useMemo(
    () =>
      [...blogs]
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 6),
    [blogs]
  );

  const analytics = useMemo(() => {
    const authoredBlogs = blogs.filter((blog) => blog.author.id === profile.id);
    const totalLikes = authoredBlogs.reduce((acc, blog) => acc + blog.likeCount, 0);
    const totalViews = authoredBlogs.reduce((acc, blog) => acc + blog.views, 0);
    const totalComments = authoredBlogs.reduce((acc, blog) => acc + blog.commentCount, 0);

    return {
      totalBlogs: authoredBlogs.length,
      totalViews,
      totalLikes,
      totalComments,
    };
  }, [blogs, profile.id]);

  const formatTimestamp = useCallback((isoDate) => {
    try {
      const date = new Date(isoDate);
      const diffMs = Date.now() - date.getTime();
      const units = [
        { label: "year", ms: 1000 * 60 * 60 * 24 * 365 },
        { label: "month", ms: 1000 * 60 * 60 * 24 * 30 },
        { label: "week", ms: 1000 * 60 * 60 * 24 * 7 },
        { label: "day", ms: 1000 * 60 * 60 * 24 },
        { label: "hour", ms: 1000 * 60 * 60 },
        { label: "minute", ms: 1000 * 60 },
        { label: "second", ms: 1000 },
      ];
      for (const unit of units) {
        if (diffMs >= unit.ms) {
          const value = Math.floor(diffMs / unit.ms);
          return `${value} ${unit.label}${value > 1 ? "s" : ""} ago`;
        }
      }
      return "just now";
    } catch {
      return "moments ago";
    }
  }, []);

  // Add reaction function
  const addReaction = useCallback(
    async (blogId, reactionType) => {
      if (!authUser) {
        toast.info("Please log in to react");
        return;
      }
      try {
        const response = await addBlogReaction(blogId, reactionType);
        setBlogs((prev) =>
          prev.map((blog) => {
            if (blog.id !== blogId) return blog;
            return {
              ...blog,
              likeCount: response.counts?.like || blog.likeCount,
            };
          })
        );
        toast.success("Reaction added!");
      } catch (error) {
        if (!isNetworkError(error)) {
          toast.error(error.message || "Failed to add reaction");
        }
      }
    },
    [authUser]
  );

  // Remove reaction function
  const removeReaction = useCallback(
    async (blogId) => {
      if (!authUser) {
        return;
      }
      try {
        await removeBlogReaction(blogId);
        setBlogs((prev) =>
          prev.map((blog) => {
            if (blog.id !== blogId) return blog;
            return {
              ...blog,
              likeCount: Math.max(0, blog.likeCount - 1),
            };
          })
        );
      } catch (error) {
        if (!isNetworkError(error)) {
          toast.error(error.message || "Failed to remove reaction");
        }
      }
    },
    [authUser]
  );

  // Share blog function
  const shareBlogPost = useCallback(async (blogId, platform) => {
    try {
      const response = await shareBlog(blogId, platform);
      if (platform === "copy") {
        await navigator.clipboard.writeText(response.shareUrl);
        toast.success("Link copied to clipboard!");
      } else if (response.platformLinks?.[platform]) {
        window.open(response.platformLinks[platform], "_blank");
      }
    } catch (error) {
      if (!isNetworkError(error)) {
        toast.error(error.message || "Failed to share");
      }
    }
  }, []);

  // Fetch pending blogs for the current user
  const refreshPendingBlogs = useCallback(async () => {
    if (!authUser) return;
    
    try {
      const response = await fetchUserPendingBlogs();
      const pending = response?.data ?? [];
      const formattedPending = pending.map(mapApiBlog);
      setPendingBlogs(formattedPending);
    } catch (error) {
      if (isNetworkError(error) && !isDevelopment) {
        console.error("[BlogContext] Failed to fetch pending blogs:", error.message);
      } else if (!isNetworkError(error)) {
        // eslint-disable-next-line no-console
        console.warn("Failed to fetch pending blogs:", error);
      }
    }
  }, [authUser]);

  const value = useMemo(
    () => ({
      blogs,
      drafts,
      pendingBlogs,
      filteredBlogs,
      trendingBlogs,
      recentBlogs,
      analytics,
      saveDraft,
      publishBlog,
      updateBlog,
      deleteBlog,
      toggleLike,
      addComment,
      followAuthor,
      registerView,
      followingAuthors,
      isFollowing: (authorId) => followingAuthors.has(authorId),
      searchTerm,
      setSearchTerm,
      activeFilters,
      setActiveFilters,
      formatTimestamp,
      isAuthenticated: Boolean(authUser),
      isLoading,
      loadError,
      refreshBlogs,
      refreshPendingBlogs,
      categories,
      tags,
      performSearch,
      addReaction,
      removeReaction,
      shareBlogPost,
    }),
    [
      blogs,
      drafts,
      filteredBlogs,
      trendingBlogs,
      recentBlogs,
      analytics,
      saveDraft,
      publishBlog,
      updateBlog,
      deleteBlog,
      toggleLike,
      addComment,
      followAuthor,
      registerView,
      followingAuthors,
      searchTerm,
      activeFilters,
      formatTimestamp,
      categories,
      tags,
      performSearch,
      addReaction,
      removeReaction,
      shareBlogPost,
      authUser,
      isLoading,
      loadError,
      refreshBlogs,
    ]
  );

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};


