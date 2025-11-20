import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { createCourse } from "../../../src/services/api/adminContent";
import { getPremiumCourseCount } from "../../../src/services/api/courses";
import {
  safeString,
  sanitizeUrl,
} from "../../../src/utils/registrationHelpers";
import { uploadImageToCloudinary } from "../../../src/utils/imageUpload";

const initialFormState = {
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
  publishImmediately: false,
  isPremium: false,
};

const categories = [
  "English Language",
  "Digital Marketing",
  "Corporate Training",
  "Other",
];

const AdminCourseCreate = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [premiumCount, setPremiumCount] = useState(0);
  const [maxPremium, setMaxPremium] = useState(6);
  const navigate = useNavigate();

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
          // Validate file size (5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Image file size must be less than 5MB");
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
          
          // Upload to Cloudinary
          setIsUploadingImage(true);
          uploadImageToCloudinary(file, "digital-aela/courses/covers")
            .then((url) => {
              setFormData((prev) => ({
                ...prev,
                coverImage: url,
              }));
              toast.success("Cover image uploaded successfully");
            })
            .catch((error) => {
              toast.error(error.message || "Failed to upload image");
              setFormData((prev) => ({
                ...prev,
                coverImageFile: null,
                coverImagePreview: null,
              }));
            })
            .finally(() => {
              setIsUploadingImage(false);
            });
          return;
        }
        
        // Handle PDF brochure file
        if (name === "brochureFile") {
          // Validate PDF file
          if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file");
            return;
          }
          // Validate file size (10MB)
          if (file.size > 10 * 1024 * 1024) {
            toast.error("PDF file size must be less than 10MB");
            return;
          }
          setFormData((prev) => ({
            ...prev,
            [name]: file,
          }));
          return;
        }
      } else if (type === "checkbox" && name === "isPremium" && checked) {
        // Check premium course limit before allowing checkbox to be checked
        if (premiumCount >= maxPremium) {
          toast.error(
            `Maximum of ${maxPremium} premium courses allowed. Please unmark another premium course first.`
          );
          return;
        }
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        }));
      }
    },
    [premiumCount, maxPremium]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedTitle = safeString(formData.title);
    const trimmedDescription = safeString(formData.description);
    const trimmedPrice = safeString(formData.price);

    if (!trimmedTitle) {
      toast.error("Please enter a course title.");
      return;
    }

    if (!trimmedDescription || trimmedDescription.length < 60) {
      toast.error("Please provide a description (minimum 60 characters).");
      return;
    }

    // Allow price to be 0 for free courses
    if (
      trimmedPrice === "" ||
      trimmedPrice === null ||
      trimmedPrice === undefined ||
      Number.isNaN(Number(trimmedPrice))
    ) {
      toast.error(
        "Please enter a valid course price in AED (use 0 for free courses)."
      );
      return;
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
      status: formData.publishImmediately ? "published" : "draft",
      isPremium: formData.isPremium || false,
    };

    setIsSubmitting(true);
    try {
      const created = await createCourse(payload);

      // Upload brochure if provided
      if (formData.brochureFile) {
        try {
          const { uploadAdminCourseBrochure } = await import("../../../src/services/api/adminContent");
          await uploadAdminCourseBrochure(created.course._id, formData.brochureFile);
          toast.success("Course and brochure uploaded successfully!");
        } catch (brochureError) {
          console.error("Failed to upload brochure:", brochureError);
          toast.warning(
            "Course saved but brochure upload failed. You can upload it later."
          );
        }
      } else {
        toast.success("Course created successfully.");
      }

      setFormData(initialFormState);
      navigate(`/super-admin`, { replace: true });
    } catch (error) {
      const message =
        (error?.details?.error?.message || error?.message) ??
        "We couldn't save your course. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title="Create Course | Digital AELA Super Admin"
        description="Create a new course for the Digital AELA platform."
        keywords="create course, admin course creation"
        url="https://digitalaela.com/super-admin/create/course"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,210,106,0.15),transparent_70%)]" />

      <main className="relative z-10 pt-4 pb-20">
        <section className="layout-container space-y-8">
          <header className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/30 bg-[#F5D26A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]">
              Course Builder
            </span>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Create a new course
            </h1>
            <p className="text-sm text-slate-300/80 md:max-w-2xl">
              Add your course details, outcomes, and media. You can save as
              draft and enrich the curriculum later.
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
                  className="w-full appearance-none rounded-xl border border-white/15 bg-[#0a0d19] px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  style={{ backgroundColor: "#0a0d19" }}>
                  <option value="" style={{ backgroundColor: "#0a0d19" }}>
                    Select category
                  </option>
                  {categories.map((option) => (
                    <option
                      key={option}
                      value={option}
                      style={{ backgroundColor: "#0a0d19" }}>
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
                    className="w-full appearance-none rounded-xl border border-white/15 bg-[#0a0d19] px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                    style={{ backgroundColor: "#0a0d19" }}>
                    <option
                      value="Beginner"
                      style={{ backgroundColor: "#0a0d19" }}>
                      Beginner
                    </option>
                    <option
                      value="Intermediate"
                      style={{ backgroundColor: "#0a0d19" }}>
                      Intermediate
                    </option>
                    <option
                      value="Advanced"
                      style={{ backgroundColor: "#0a0d19" }}>
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
                    className="w-full appearance-none rounded-xl border border-white/15 bg-[#0a0d19] px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                    style={{ backgroundColor: "#0a0d19" }}>
                    <option
                      value="English"
                      style={{ backgroundColor: "#0a0d19" }}>
                      English
                    </option>
                    <option
                      value="Arabic"
                      style={{ backgroundColor: "#0a0d19" }}>
                      Arabic
                    </option>
                    <option
                      value="Hindi"
                      style={{ backgroundColor: "#0a0d19" }}>
                      Hindi
                    </option>
                    <option value="Urdu" style={{ backgroundColor: "#0a0d19" }}>
                      Urdu
                    </option>
                    <option
                      value="Other"
                      style={{ backgroundColor: "#0a0d19" }}>
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
                  className="w-full appearance-none rounded-xl border border-white/15 bg-[#0a0d19] px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  style={{ backgroundColor: "#0a0d19" }}>
                  <option
                    value="Live cohort"
                    style={{ backgroundColor: "#0a0d19" }}>
                    Live cohort
                  </option>
                  <option
                    value="Self-paced video"
                    style={{ backgroundColor: "#0a0d19" }}>
                    Self-paced video
                  </option>
                  <option value="Hybrid" style={{ backgroundColor: "#0a0d19" }}>
                    Hybrid
                  </option>
                  <option
                    value="Learn & Earn challenge"
                    style={{ backgroundColor: "#0a0d19" }}>
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
                <div className="space-y-3">
                  <input
                    id="coverImageFile"
                    name="coverImageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    disabled={isUploadingImage}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#F5D26A]/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#F5D26A] file:hover:bg-[#F5D26A]/30 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {isUploadingImage && (
                    <p className="text-[11px] text-[#F5D26A]">Uploading image...</p>
                  )}
                  {formData.coverImagePreview && (
                    <div className="relative w-full max-w-md">
                      <img
                        src={formData.coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-auto rounded-lg border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            coverImageFile: null,
                            coverImagePreview: null,
                            coverImage: "",
                          }));
                        }}
                        className="absolute top-2 right-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white p-1.5 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload a 16:9 cover image (max 5MB). Recommended: 1920x1080px.
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="introVideoUrl"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Intro video URL
                </label>
                <input
                  id="introVideoUrl"
                  name="introVideoUrl"
                  type="url"
                  value={formData.introVideoUrl}
                  onChange={handleChange}
                  placeholder="https://player.vimeo.com/..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="syllabus"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Syllabus outline
                </label>
                <textarea
                  id="syllabus"
                  name="syllabus"
                  value={formData.syllabus}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Week 1: Confidence fundamentals... Week 2: Persuasive structure..."
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="tags"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Tags (comma separated)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="public speaking, confidence, corporate"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <p className="text-[11px] text-slate-400">
                  Separate tags with commas. Helps students and mentors discover
                  your course.
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="brochureFile"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Course Brochure PDF (Optional)
                </label>
                <input
                  id="brochureFile"
                  name="brochureFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#F5D26A]/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#F5D26A] file:hover:bg-[#F5D26A]/30 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <p className="text-[11px] text-slate-400">
                  Upload a PDF brochure for your course. Maximum file size:
                  10MB. Any user can download this without enrolling.
                  {formData.brochureFile && (
                    <span className="block mt-1 text-[#F5D26A]">
                      Selected: {formData.brochureFile.name}
                    </span>
                  )}
                </p>
              </div>

              <label className="md:col-span-2 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  name="publishImmediately"
                  checked={formData.publishImmediately}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#F5D26A] focus:ring-[#F5D26A]/30"
                />
                <span>
                  Publish immediately after approval
                  <p className="text-xs text-slate-400">
                    Uncheck to keep the course as draft until you publish
                    manually.
                  </p>
                </span>
              </label>

              <label
                className={`md:col-span-2 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 ${
                  premiumCount >= maxPremium && !formData.isPremium
                    ? "opacity-60"
                    : ""
                }`}>
                <input
                  type="checkbox"
                  name="isPremium"
                  checked={formData.isPremium}
                  onChange={handleChange}
                  disabled={premiumCount >= maxPremium && !formData.isPremium}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#F5D26A] focus:ring-[#F5D26A]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span>
                  Show on Home Page (Premium Course)
                  <p className="text-xs text-slate-400">
                    Check this to display this course in the "Our Premium
                    Courses" section on the home page.
                    {premiumCount >= maxPremium && !formData.isPremium && (
                      <span className="block mt-1 text-red-400 font-semibold">
                        Maximum limit reached ({premiumCount}/{maxPremium}).
                        Unmark another premium course first.
                      </span>
                    )}
                    {premiumCount < maxPremium && (
                      <span className="block mt-1 text-[#F5D26A]">
                        {maxPremium - premiumCount} slot
                        {maxPremium - premiumCount !== 1 ? "s" : ""} available (
                        {premiumCount}/{maxPremium} used)
                      </span>
                    )}
                  </p>
                </span>
              </label>
            </section>

            <footer className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                You can enrich the curriculum with lessons, quizzes, and
                resources after saving.
              </p>
              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5D26A] px-6 py-2.5 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(245,210,106,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? "Saving..." : "Save course"}
              </motion.button>
            </footer>
          </motion.form>
        </section>
      </main>
    </div>
  );
};

export default AdminCourseCreate;
