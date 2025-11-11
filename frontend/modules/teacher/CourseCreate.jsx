import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { createTeacherCourse } from "../../src/services/teacherCourses";
import { safeString, sanitizeUrl } from "../../src/utils/registrationHelpers";

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
  introVideoUrl: "",
  syllabus: "",
  tags: "",
  publishImmediately: false,
};

const categories = [
  "Public Speaking",
  "IELTS & Test Prep",
  "Corporate Communication",
  "Leadership & Soft Skills",
  "Digital Marketing",
  "Career Development",
  "Learn & Earn Challenges",
  "Other",
];

const CourseCreate = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const priceHelper = useMemo(
    () => ({
      price: "Enter price in AED. You can offer discounts later.",
      discount: "Optional. Leave blank if you don't want to run a promo.",
    }),
    []
  );

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

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

    if (!trimmedPrice || Number.isNaN(Number(trimmedPrice))) {
      toast.error("Please enter a valid course price in AED.");
      return;
    }

    const payload = {
      title: trimmedTitle,
      subtitle: safeString(formData.subtitle),
      category: formData.category || "Uncategorised",
      difficulty: formData.difficulty,
      price: Number(trimmedPrice),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
      language: formData.language,
      deliveryMode: formData.deliveryMode,
      duration: safeString(formData.duration),
      lessonCount: safeString(formData.lessonCount),
      description: trimmedDescription,
      learningOutcomes: safeString(formData.learningOutcomes),
      requirements: safeString(formData.requirements),
      coverImage: sanitizeUrl(formData.coverImage),
      introVideoUrl: formData.introVideoUrl ? sanitizeUrl(formData.introVideoUrl) : "",
      syllabus: safeString(formData.syllabus),
      tags: safeString(formData.tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      publishImmediately: formData.publishImmediately,
    };

    setIsSubmitting(true);
    try {
      const created = await createTeacherCourse(payload);
      toast.success("Course saved successfully. You can edit modules and publish when ready.");
      setFormData(initialFormState);
      navigate(`/teacher/courses/${created.id}`, { replace: true });
    } catch (error) {
      const message = error?.message ?? "We couldn't save your course. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title="Create Course | Digital AELA Teacher Portal"
        description="Upload a new course, design the curriculum, and start teaching learners across the Digital AELA community."
        keywords="create course, teacher upload, instructor portal"
        url="https://digitalaela.com/teacher/courses/new"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,210,106,0.15),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20">
        <section className="layout-container space-y-8">
          <header className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/30 bg-[#F5D26A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]">
              Course Builder
            </span>
            <h1 className="text-2xl font-semibold md:text-3xl">Create a new course</h1>
            <p className="text-sm text-slate-300/80 md:max-w-2xl">
              Add your course details, outcomes, and media. You can save as draft and enrich the curriculum later.
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
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                <label htmlFor="subtitle" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                <label htmlFor="category" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Category*
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                  <option value="">Select category</option>
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="difficulty" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="language" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                <label htmlFor="learningOutcomes" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                <label htmlFor="requirements" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                  <label htmlFor="price" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                  <p className="text-[11px] text-slate-400">{priceHelper.price}</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="discountPrice" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                  <p className="text-[11px] text-slate-400">{priceHelper.discount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="duration" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                  <label htmlFor="lessonCount" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                <label htmlFor="deliveryMode" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Delivery mode
                </label>
                <select
                  id="deliveryMode"
                  name="deliveryMode"
                  value={formData.deliveryMode}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                  <option value="Live cohort">Live cohort</option>
                  <option value="Self-paced video">Self-paced video</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Learn & Earn challenge">Learn & Earn challenge</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="coverImage" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Cover image URL
                </label>
                <input
                  id="coverImage"
                  name="coverImage"
                  type="url"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <p className="text-[11px] text-slate-400">Use a 16:9 image. You can upload assets in the media manager later.</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="introVideoUrl" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                <label htmlFor="syllabus" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                <label htmlFor="tags" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
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
                <p className="text-[11px] text-slate-400">Separate tags with commas. Helps students and mentors discover your course.</p>
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
                  <p className="text-xs text-slate-400">Uncheck to keep the course as draft until you publish manually.</p>
                </span>
              </label>
            </section>

            <footer className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">You can enrich the curriculum with lessons, quizzes, and resources after saving.</p>
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

export default CourseCreate; 

