import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineArrowUturnLeft, HiOutlineDocumentText, HiOutlineSparkles } from "react-icons/hi2";
import { FaVideo, FaTrash, FaEdit, FaSpinner } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import { getAdminCourseById, updateAdminCourse } from "../../../src/services/api/adminContent";
import { getPremiumCourseCount } from "../../../src/services/api/courses";
import {
  safeString,
  sanitizeUrl,
} from "../../../src/utils/registrationHelpers";
import { uploadImageToCloudinary } from "../../../src/utils/imageUpload";
import { getMediaUrl } from "../../../src/utils/mediaUrl";
import VideoUpload from "../../teacher/VideoUpload";
import ModuleUpload from "../../teacher/ModuleUpload";
import ModuleList from "../../teacher/ModuleList";
import { getCourseVideos, deleteVideo, updateVideo } from "../../../src/services/courseVideos";
import { getCourseModules } from "../../../src/services/courseModules";
import { fetchCourseStudents, updateStudentEnrollmentStatus } from "../../../src/services/api/teacher";
import { generateCertificate } from "../../../src/services/api/certificates";

const categories = [
  "English Language",
  "Digital Marketing",
  "Corporate Training",
  "Other",
];

const AdminCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [premiumCount, setPremiumCount] = useState(0);
  const [maxPremium, setMaxPremium] = useState(6);
  const [videos, setVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editVideoForm, setEditVideoForm] = useState({
    title: "",
    description: "",
    order: 0,
    isPreview: false,
  });
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [markingCompleteFor, setMarkingCompleteFor] = useState(null);
  const [issuingCertificateFor, setIssuingCertificateFor] = useState(null);
  const [modules, setModules] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    category: "",
    difficulty: "Intermediate",
    price: "",
    discountPrice: "",
    language: "English",
    deliveryMode: "Live cohort",
    duration: "",
    lessonCount: "",
    description: "",
    learningOutcomes: "",
    requirements: "",
    coverImage: "",
    coverImageFile: null,
    coverImagePreview: null,
    introVideoUrl: "",
    syllabus: "",
    tags: "",
    status: "draft",
    isPremium: false,
  });

  // Fetch premium course count on mount
  useEffect(() => {
    const fetchPremiumCount = async () => {
      try {
        const response = await getPremiumCourseCount();
        if (response) {
          setPremiumCount(response.count || 0);
          setMaxPremium(response.maxAllowed || 6);
        }
      } catch (error) {
        console.error("Failed to fetch premium course count:", error);
      }
    };
    fetchPremiumCount();
  }, []);

  // Fetch videos for the course
  const fetchVideos = useCallback(async () => {
    if (!courseId) return;
    setIsLoadingVideos(true);
    try {
      const response = await getCourseVideos(courseId);
      setVideos(response.videos || []);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      // Don't show error toast if course doesn't exist yet
      if (error.status !== 404) {
        toast.error("Failed to load course videos");
      }
    } finally {
      setIsLoadingVideos(false);
    }
  }, [courseId]);

  const handleVideoUploaded = useCallback(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDeleteVideo = useCallback(async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }
    try {
      await deleteVideo(videoId);
      toast.success("Video deleted successfully");
      fetchVideos();
    } catch (error) {
      toast.error(error.message || "Failed to delete video");
    }
  }, [fetchVideos]);

  const handleEditVideo = useCallback((video) => {
    setEditingVideoId(video._id);
    setEditVideoForm({
      title: video.title || "",
      description: video.description || "",
      order: video.order || 0,
      isPreview: video.isPreview || false,
    });
  }, []);

  const handleSaveVideoEdit = useCallback(async () => {
    if (!editingVideoId) return;
    try {
      await updateVideo(editingVideoId, editVideoForm);
      toast.success("Video updated successfully");
      setEditingVideoId(null);
      fetchVideos();
    } catch (error) {
      toast.error(error.message || "Failed to update video");
    }
  }, [editingVideoId, editVideoForm, fetchVideos]);

  const handleCancelEdit = useCallback(() => {
    setEditingVideoId(null);
    setEditVideoForm({
      title: "",
      description: "",
      order: 0,
      isPreview: false,
    });
  }, []);

  const fetchModules = useCallback(async () => {
    if (!courseId) return;
    setIsLoadingModules(true);
    try {
      const response = await getCourseModules(courseId);
      setModules(response.modules || []);
    } catch (error) {
      console.error("Failed to fetch modules:", error);
      if (error.status !== 404) {
        toast.error("Failed to load course modules");
      }
    } finally {
      setIsLoadingModules(false);
    }
  }, [courseId]);

  const handleModuleUploaded = useCallback(() => {
    fetchModules();
  }, [fetchModules]);

  const fetchEnrolledStudents = useCallback(async () => {
    if (!courseId) return;
    setIsLoadingStudents(true);
    try {
      const response = await fetchCourseStudents(courseId);
      setEnrolledStudents(response.students || []);
    } catch (error) {
      console.error("Failed to fetch enrolled students:", error);
      toast.error("Failed to load enrolled students");
      setEnrolledStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [courseId]);

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      try {
        setIsLoading(true);
        const existing = await getAdminCourseById(courseId);

        if (!existing) {
          toast.error("Course not found or you don't have permission to edit it.");
          navigate("/super-admin", { replace: true });
          return;
        }

        setCourse(existing);
        setFormData({
          title: existing.title || "",
          subtitle: existing.metadata?.subtitle || "",
          category: existing.category || "",
          difficulty: existing.metadata?.difficulty || "Intermediate",
          price: existing.price?.toString() || "",
          discountPrice: existing.metadata?.discountPrice?.toString() || "",
          language: existing.metadata?.language || "English",
          deliveryMode: existing.metadata?.deliveryMode || "Live cohort",
          duration: existing.duration?.toString() || "",
          lessonCount: existing.metadata?.lessonCount || "",
          description: existing.description || "",
          learningOutcomes: existing.metadata?.learningOutcomes || "",
          requirements: existing.metadata?.requirements || "",
          coverImage: existing.thumbnailUrl || "",
          coverImageFile: null,
          coverImagePreview: existing.thumbnailUrl || null,
          introVideoUrl: existing.metadata?.introVideoUrl || "",
          syllabus: existing.metadata?.syllabus || "",
          tags: Array.isArray(existing.metadata?.tags) 
            ? existing.metadata.tags.join(", ") 
            : safeString(existing.metadata?.tags),
          status: existing.status || "draft",
          isPremium: existing.metadata?.isPremium || false,
        });
        fetchVideos();
        fetchModules();
        fetchEnrolledStudents();
      } catch (error) {
        console.error("Failed to load course:", error);
        toast.error("Failed to load course details.");
        navigate("/super-admin", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId, navigate, fetchVideos, fetchEnrolledStudents]);

  const handleMarkAsCompleted = async (student) => {
    if (!courseId || !student.studentId) {
      toast.error("Missing required information");
      return;
    }

    if (student.status === "completed") {
      toast.info("Student is already marked as completed");
      return;
    }

    setMarkingCompleteFor(student.studentId);
    try {
      await updateStudentEnrollmentStatus(courseId, student.studentId, "completed");
      toast.success(`${student.studentName} marked as completed`);
      // Refresh students list to update status
      await fetchEnrolledStudents();
    } catch (error) {
      console.error("Failed to mark student as completed:", error);
      toast.error(error?.message || "Failed to mark student as completed");
    } finally {
      setMarkingCompleteFor(null);
    }
  };

  const handleIssueCertificate = async (student) => {
    if (!courseId || !student.studentId) {
      toast.error("Missing required information to issue certificate");
      return;
    }

    // Check eligibility: status must be "completed" AND progress must be 100%
    if (student.status !== "completed" || student.courseProgressPercentage !== 100) {
      toast.error("Student must have completed the course (100% progress) to receive a certificate");
      return;
    }

    // Check if certificate already exists
    if (student.hasCertificate) {
      toast.info("Certificate already issued for this student");
      return;
    }

    setIssuingCertificateFor(student.studentId);
    try {
      await generateCertificate({
        studentId: student.studentId,
        courseId: courseId,
        enrollmentId: student.enrollmentId,
        issuedType: "manual",
      });
      toast.success(`Certificate issued successfully for ${student.studentName}`);
      // Refresh students list to update hasCertificate status
      await fetchEnrolledStudents();
    } catch (error) {
      console.error("Failed to issue certificate:", error);
      toast.error(error?.message || "Failed to issue certificate");
    } finally {
      setIssuingCertificateFor(null);
    }
  };

  const priceHelper = useMemo(
    () => ({
      price: "Enter price in AED. You can offer discounts later.",
      discount: "Optional. Leave blank if you don't want to run a promo.",
    }),
    []
  );

  const handleChange = useCallback(
    (event) => {
      const { name, value, type, checked, files } = event.target;
      if (type === "file" && files && files[0]) {
        const file = files[0];
        
        // Handle cover image upload
        if (name === "coverImageFile") {
          // Validate image file
          if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
          }
          // Validate file size (1GB)
          if (file.size > 1024 * 1024 * 1024) {
            toast.error("Image file size must be less than 1GB");
            return;
          }
          
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData((prev) => ({
              ...prev,
              coverImageFile: file,
              coverImagePreview: reader.result,
            }));
          };
          reader.readAsDataURL(file);
          
          // Upload image automatically
          setIsUploadingImage(true);
          uploadImageToCloudinary(file, "digital-aela/courses/covers")
            .then((url) => {
              setFormData((prev) => ({
                ...prev,
                coverImage: url,
                coverImagePreview: url,
              }));
              toast.success("Cover image uploaded successfully");
            })
            .catch((error) => {
              toast.error(error.message || "Failed to upload image");
              setFormData((prev) => ({
                ...prev,
                coverImageFile: null,
                coverImagePreview: prev.coverImage || null,
              }));
            })
            .finally(() => {
              setIsUploadingImage(false);
            });
          return;
        }
      } else if (type === "checkbox") {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    },
    []
  );

  const handleImageUpload = async () => {
    if (!formData.coverImageFile) {
      toast.error("Please select an image file first");
      return;
    }

    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(formData.coverImageFile, "digital-aela/courses/covers");
      setFormData((prev) => ({
        ...prev,
        coverImage: imageUrl,
        coverImagePreview: imageUrl,
      }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!course) return;

    const trimmedTitle = safeString(formData.title).trim();
    const trimmedDescription = safeString(formData.description).trim();
    const trimmedPrice = safeString(formData.price).trim();

    if (!trimmedTitle) {
      toast.error("Course title is required.");
      return;
    }

    if (!trimmedDescription || trimmedDescription.length < 60) {
      toast.error("Description must be at least 60 characters.");
      return;
    }

    if (!trimmedPrice || isNaN(Number(trimmedPrice))) {
      toast.error("Valid price is required (use 0 for free courses).");
      return;
    }

    // Check premium course limit if setting to premium
    if (formData.isPremium) {
      const currentIsPremium = course.metadata?.isPremium || false;
      if (!currentIsPremium && premiumCount >= maxPremium) {
        toast.error(`Maximum of ${maxPremium} premium courses allowed. Please unmark another premium course first.`);
        return;
      }
    }

    const payload = {
      title: trimmedTitle,
      subtitle: safeString(formData.subtitle),
      category: formData.category || "Uncategorised",
      difficulty: formData.difficulty,
      price: Number(trimmedPrice),
      discountPrice: formData.discountPrice
        ? Number(formData.discountPrice)
        : null,
      language: formData.language,
      deliveryMode: formData.deliveryMode,
      duration: safeString(formData.duration),
      lessonCount: safeString(formData.lessonCount),
      description: trimmedDescription,
      learningOutcomes: safeString(formData.learningOutcomes),
      requirements: safeString(formData.requirements),
      coverImage: sanitizeUrl(formData.coverImage),
      introVideoUrl: formData.introVideoUrl
        ? sanitizeUrl(formData.introVideoUrl)
        : "",
      syllabus: safeString(formData.syllabus),
      tags: safeString(formData.tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: formData.status,
      isPremium: formData.isPremium || false,
    };

    setIsSaving(true);
    try {
      const updated = await updateAdminCourse(courseId, payload);
      setCourse(updated);
      
      // Update formData with the updated course data
      setFormData((prev) => ({
        ...prev,
        coverImage: updated.thumbnailUrl || prev.coverImage,
        coverImagePreview: updated.thumbnailUrl || prev.coverImagePreview,
      }));
      
      toast.success("Course updated successfully.");
      
      // Reload the course data fresh from backend to ensure all fields are updated
      const freshCourse = await getAdminCourseById(courseId);
      if (freshCourse) {
        setCourse(freshCourse);
        setFormData((prev) => ({
          ...prev,
          coverImage: freshCourse.thumbnailUrl || prev.coverImage,
          coverImagePreview: freshCourse.thumbnailUrl || prev.coverImagePreview,
        }));
      }
    } catch (error) {
      const message =
        (error?.details?.error?.message || error?.message) ??
        "We couldn't update your course. Please try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060D] text-white">
        <p className="text-sm text-slate-300/80">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`Edit ${formData.title || "Course"} | Digital AELA Super Admin`}
        description="Edit course details for the Digital AELA platform."
        keywords="edit course, admin course editing"
        url={`https://digitalaela.com/super-admin/courses/${courseId}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,210,106,0.15),transparent_70%)]" />

      <main className="relative z-10 pt-4 pb-20">
        <section className="layout-container space-y-8">
          <header className="space-y-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition">
                <HiOutlineArrowUturnLeft className="h-4 w-4" />
                Back
              </button>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/30 bg-[#F5D26A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]">
                Edit Course
              </span>
            </div>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Edit Course: {formData.title || "Untitled"}
            </h1>
            {courseId && (
              <p className="text-xs text-slate-500 font-mono mt-1">
                Course ID: {courseId}
              </p>
            )}
            <p className="text-sm text-slate-300/80 md:max-w-2xl">
              Update course details, outcomes, and media. Changes are saved immediately.
            </p>
          </header>

          <motion.form
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            onSubmit={handleSubmit}
            className="space-y-8 rounded-3xl border border-white/10 bg-[#090D19]/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="title"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Course title*
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Executive Presentation Mastery"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="subtitle"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Subtitle
                </label>
                <input
                  id="subtitle"
                  name="subtitle"
                  type="text"
                  value={formData.subtitle}
                  onChange={handleChange}
                  placeholder="Advanced storytelling for boardroom presentations"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="category"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Category*
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="" style={{ backgroundColor: "#000000" }}>
                    Select category
                  </option>
                  {categories.map((option) => (
                    <option
                      key={option}
                      value={option}
                      style={{ backgroundColor: "#000000" }}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="difficulty"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                    style={{ backgroundColor: "#000000" }}>
                    <option value="Beginner" style={{ backgroundColor: "#000000" }}>
                      Beginner
                    </option>
                    <option value="Intermediate" style={{ backgroundColor: "#000000" }}>
                      Intermediate
                    </option>
                    <option value="Advanced" style={{ backgroundColor: "#000000" }}>
                      Advanced
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="language"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                    style={{ backgroundColor: "#000000" }}>
                    <option value="English" style={{ backgroundColor: "#000000" }}>
                      English
                    </option>
                    <option value="Arabic" style={{ backgroundColor: "#000000" }}>
                      Arabic
                    </option>
                    <option value="Hindi" style={{ backgroundColor: "#000000" }}>
                      Hindi
                    </option>
                    <option value="Urdu" style={{ backgroundColor: "#000000" }}>
                      Urdu
                    </option>
                    <option value="Other" style={{ backgroundColor: "#000000" }}>
                      Other
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="description"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Course description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Explain what learners will master, the format of the sessions, and any transformations they can expect..."
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="learningOutcomes"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Learning outcomes
                </label>
                <textarea
                  id="learningOutcomes"
                  name="learningOutcomes"
                  value={formData.learningOutcomes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="List bullet-style outcomes (e.g., Master 5 persuasive frameworks...)"
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="requirements"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Requirements
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Any prerequisites or expectations from learners"
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="price"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Price (AED)*
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="899"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    {priceHelper.price}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="discountPrice"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Discount price
                  </label>
                  <input
                    id="discountPrice"
                    name="discountPrice"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.discountPrice}
                    onChange={handleChange}
                    placeholder="749"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                  <p className="text-[11px] text-slate-400">
                    {priceHelper.discount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="duration"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Duration
                  </label>
                  <input
                    id="duration"
                    name="duration"
                    type="text"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="6 weeks · 18 sessions"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="lessonCount"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Lessons
                  </label>
                  <input
                    id="lessonCount"
                    name="lessonCount"
                    type="text"
                    value={formData.lessonCount}
                    onChange={handleChange}
                    placeholder="12 video lessons"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="deliveryMode"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Delivery mode
                </label>
                <select
                  id="deliveryMode"
                  name="deliveryMode"
                  value={formData.deliveryMode}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="Live cohort" style={{ backgroundColor: "#000000" }}>
                    Live cohort
                  </option>
                  <option value="Self-paced video" style={{ backgroundColor: "#000000" }}>
                    Self-paced video
                  </option>
                  <option value="Hybrid" style={{ backgroundColor: "#000000" }}>
                    Hybrid
                  </option>
                  <option value="Learn & Earn challenge" style={{ backgroundColor: "#000000" }}>
                    Learn & Earn challenge
                  </option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="coverImageFile"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Cover Image
                </label>
                <div className="flex gap-3">
                  <input
                    id="coverImageFile"
                    name="coverImageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#F5D26A]/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#F5D26A] hover:file:bg-[#F5D26A]/30 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                  {formData.coverImageFile && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                      className="rounded-xl border border-[#F5D26A]/30 bg-[#F5D26A]/20 px-4 py-2 text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/30 transition disabled:opacity-50">
                      {isUploadingImage ? "Uploading..." : "Upload"}
                    </button>
                  )}
                </div>
                {formData.coverImagePreview && (
                  <div className="mt-3">
                    <img
                      src={
                        formData.coverImagePreview.startsWith("data:") 
                          ? formData.coverImagePreview 
                          : getMediaUrl(formData.coverImagePreview)
                      }
                      alt="Cover preview"
                      className="h-32 w-auto rounded-lg object-cover"
                    />
                  </div>
                )}
                <input
                  type="text"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="Or paste image URL directly"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="introVideoUrl"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Intro Video URL
                </label>
                <input
                  id="introVideoUrl"
                  name="introVideoUrl"
                  type="url"
                  value={formData.introVideoUrl}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="draft" style={{ backgroundColor: "#000000" }}>
                    Draft
                  </option>
                  <option value="published" style={{ backgroundColor: "#000000" }}>
                    Published
                  </option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="syllabus"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Syllabus
                </label>
                <textarea
                  id="syllabus"
                  name="syllabus"
                  value={formData.syllabus}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Detailed course outline and curriculum..."
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="tags"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="business, leadership, communication"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  id="isPremium"
                  name="isPremium"
                  type="checkbox"
                  checked={formData.isPremium}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#F5D26A] focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <label
                  htmlFor="isPremium"
                  className="text-sm text-white">
                  Mark as Premium Course
                  {formData.isPremium && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({premiumCount}/{maxPremium} premium courses)
                    </span>
                  )}
                </label>
              </div>
            </section>

            <div className="flex items-center justify-end gap-4 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-[#F5D26A]/20 px-6 py-3 text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/30 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.form>

          <motion.section
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
            className="mt-8 rounded-3xl border border-white/10 bg-[#090D19]/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <header className="mb-6">
              <h2 className="text-lg font-semibold text-white">Course Videos</h2>
              <p className="mt-1 text-xs text-slate-400">
                Upload and manage course videos. Students can access videos after enrollment.
              </p>
            </header>

            <div className="space-y-6">
              <VideoUpload
                courseId={courseId}
                onVideoUploaded={handleVideoUploaded}
                existingVideosCount={videos.length}
              />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Uploaded Videos</h3>
                {isLoadingVideos ? (
                  <div className="flex items-center justify-center py-8">
                    <FaSpinner className="h-6 w-6 animate-spin text-[#F5D26A]" />
                  </div>
                ) : videos.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                    No videos uploaded yet. Use the form above to upload your first video.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {videos.map((video) => (
                      <div
                        key={video._id}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        {editingVideoId === video._id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editVideoForm.title}
                              onChange={(e) =>
                                setEditVideoForm((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              placeholder="Video title"
                              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                            />
                            <textarea
                              value={editVideoForm.description}
                              onChange={(e) =>
                                setEditVideoForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Description"
                              rows={2}
                              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                            />
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-300">Order:</label>
                                <input
                                  type="number"
                                  value={editVideoForm.order}
                                  onChange={(e) =>
                                    setEditVideoForm((prev) => ({
                                      ...prev,
                                      order: Number(e.target.value),
                                    }))
                                  }
                                  min={0}
                                  className="w-20 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none"
                                />
                              </div>
                              <label className="flex items-center gap-2 text-xs text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={editVideoForm.isPreview}
                                  onChange={(e) =>
                                    setEditVideoForm((prev) => ({
                                      ...prev,
                                      isPreview: e.target.checked,
                                    }))
                                  }
                                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                Preview video
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleSaveVideoEdit}
                                className="rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-black hover:bg-[#E5C158]">
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:border-white/20">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FaVideo className="h-4 w-4 text-[#F5D26A]" />
                                <h4 className="font-semibold text-white">{video.title}</h4>
                                {video.isPreview && (
                                  <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D4AF37]">
                                    Preview
                                  </span>
                                )}
                              </div>
                              {video.description && (
                                <p className="mt-1 text-xs text-slate-400">{video.description}</p>
                              )}
                              <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                                {video.duration > 0 && (
                                  <span>
                                    {Math.floor(video.duration / 60)}:
                                    {String(video.duration % 60).padStart(2, "0")}
                                  </span>
                                )}
                                <span>Order: {video.order}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditVideo(video)}
                                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#F5D26A]/60 hover:text-[#F5D26A]">
                                <FaEdit className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVideo(video._id)}
                                className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-400/70 hover:text-red-200">
                                <FaTrash className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Course Modules Section */}
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
            className="mt-8 rounded-3xl border border-white/10 bg-[#090D19]/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <header className="mb-6">
              <h2 className="text-lg font-semibold text-white">Course Modules</h2>
              <p className="mt-1 text-xs text-slate-400">
                Create modules with multiple files (PDF, images, audio, documents, videos). Students can access modules after enrollment.
              </p>
            </header>

            <div className="space-y-6">
              <ModuleUpload
                courseId={courseId}
                onModuleUploaded={handleModuleUploaded}
              />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Created Modules</h3>
                {isLoadingModules ? (
                  <div className="flex items-center justify-center py-8">
                    <FaSpinner className="h-6 w-6 animate-spin text-[#F5D26A]" />
                  </div>
                ) : (
                  <ModuleList
                    modules={modules}
                    courseId={courseId}
                    onModuleUpdated={handleModuleUploaded}
                  />
                )}
              </div>
            </div>
          </motion.section>

          {/* Enrolled Students Section */}
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.2 }}
            className="mt-8 rounded-3xl border border-white/10 bg-[#090D19]/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Enrolled Students</h2>
                <p className="text-xs text-slate-400">
                  Monitor learner progress, contact details, and activity.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white hover:text-[#F5D26A]">
                Export roster
              </button>
            </header>

            <div className="mt-4 overflow-x-auto">
              {isLoadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="h-6 w-6 animate-spin text-[#F5D26A]" />
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                  No students enrolled yet.
                </div>
              ) : (
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    <tr className="border-b border-white/10">
                      <th className="px-3 py-3 font-semibold">Learner</th>
                      <th className="px-3 py-3 font-semibold">Email</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Progress</th>
                      <th className="px-3 py-3 font-semibold">Last active</th>
                      <th className="px-3 py-3 font-semibold">Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((student) => {
                      const isEligibleForCertificate =
                        student.status === "completed" &&
                        student.courseProgressPercentage === 100 &&
                        !student.hasCertificate;
                      const lastActive = student.lastAccessedAt
                        ? new Date(student.lastAccessedAt).toLocaleDateString()
                        : "Never";

                      return (
                        <tr
                          key={student.studentId}
                          className="border-b border-white/5 last:border-b-0">
                          <td className="px-3 py-3 font-semibold text-white">{student.studentName}</td>
                          <td className="px-3 py-3 text-xs text-slate-300/90">{student.studentEmail}</td>
                          <td className="px-3 py-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                                  student.status === "completed"
                                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                    : student.status === "active"
                                    ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                                    : "border-sky-400/40 bg-sky-500/10 text-sky-200"
                                }`}>
                                {student.status}
                              </span>
                              {student.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsCompleted(student)}
                                  disabled={markingCompleteFor === student.studentId}
                                  className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200 transition hover:border-emerald-400/70 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Mark as completed">
                                  {markingCompleteFor === student.studentId ? (
                                    <>
                                      <FaSpinner className="h-2.5 w-2.5 animate-spin" />
                                      Marking...
                                    </>
                                  ) : (
                                    <>
                                      <HiOutlineSparkles className="h-2.5 w-2.5" />
                                      Mark Complete
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-200">
                            <div className="w-40">
                              <div className="h-2 rounded-full bg-white/10">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-[#F5D26A] to-[#facc15]"
                                  style={{ width: `${Math.min(student.courseProgressPercentage || 0, 100)}%` }}
                                />
                              </div>
                              <span className="mt-1 block text-[11px] text-slate-400">
                                {student.courseProgressPercentage || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-300/80">{lastActive}</td>
                          <td className="px-3 py-3 text-xs">
                            {student.hasCertificate ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                                <HiOutlineDocumentText className="h-3 w-3" />
                                Issued
                              </span>
                            ) : isEligibleForCertificate ? (
                              <button
                                type="button"
                                onClick={() => handleIssueCertificate(student)}
                                disabled={issuingCertificateFor === student.studentId}
                                className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-3 py-1 text-[11px] font-semibold text-[#F5D26A] transition hover:border-[#F5D26A]/70 hover:bg-[#F5D26A]/20 disabled:cursor-not-allowed disabled:opacity-50">
                                {issuingCertificateFor === student.studentId ? (
                                  <>
                                    <FaSpinner className="h-3 w-3 animate-spin" />
                                    Issuing...
                                  </>
                                ) : (
                                  <>
                                    <HiOutlineSparkles className="h-3 w-3" />
                                    Issue Certificate
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500">Not eligible</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.section>
        </section>
      </main>
    </div>
  );
};

export default AdminCourseDetail;

