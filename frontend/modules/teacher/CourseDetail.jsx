import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineArrowUturnLeft, HiOutlineDocumentText, HiOutlinePlus, HiOutlineSparkles } from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import {
  getTeacherCourseById,
  updateTeacherCourse,
  addCourseModule,
  addLessonToModule,
  linkCourseQuiz,
  unlinkCourseQuiz,
  removeCourseModule,
  moveCourseModule,
  removeLessonFromModule,
  moveLessonWithinModule,
} from "../../src/services/teacherCourses";
import { getTeacherQuizzes } from "../../src/services/teacherQuizzes";
import { safeString, sanitizeUrl } from "../../src/utils/registrationHelpers";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    price: "",
    discountPrice: "",
    status: "draft",
    coverImage: "",
    introVideoUrl: "",
    description: "",
    tags: "",
  });
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    lessonTitle: "",
    lessonType: "video",
    lessonUrl: "",
    lessonDuration: "",
  });
  const [isModuleSaving, setIsModuleSaving] = useState(false);
  const [activeLessonModule, setActiveLessonModule] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    contentType: "video",
    contentUrl: "",
    durationMinutes: "",
  });
  const [isLessonSaving, setIsLessonSaving] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "",
    rewardCoins: "",
    questionsCount: "",
    availableUntil: "",
  });
  const [isQuizSaving, setIsQuizSaving] = useState(false);
  const [quizLinkMode, setQuizLinkMode] = useState("new");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [availableQuizzes, setAvailableQuizzes] = useState(() => getTeacherQuizzes());

  useEffect(() => {
    const existing = getTeacherCourseById(courseId);

    if (!existing) {
      toast.error("We couldn't find that course.");
      navigate("/teacher/dashboard", { replace: true });
      return;
    }

    setCourse(existing);
    setFormData({
      title: existing.title ?? "",
      subtitle: existing.subtitle ?? "",
      price: existing.price?.toString() ?? "",
      discountPrice: existing.discountPrice?.toString() ?? "",
      status: existing.status ?? "draft",
      coverImage: existing.coverImage ?? "",
      introVideoUrl: existing.introVideoUrl ?? "",
      description: existing.description ?? "",
      tags: Array.isArray(existing.tags) ? existing.tags.join(", ") : safeString(existing.tags),
    });
    setIsLoading(false);
  }, [courseId, navigate]);

  useEffect(() => {
    const refresh = () => setAvailableQuizzes(getTeacherQuizzes());
    refresh();
    const handleStorage = (event) => {
      if (event.key === "aela.teacher.quizzes") {
        refresh();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (quizLinkMode === "new") {
      setSelectedQuizId("");
    }
  }, [quizLinkMode]);

  const enrolments = useMemo(() => {
    if (!course) return [];
    if (Array.isArray(course.enrolments) && course.enrolments.length > 0) {
      return course.enrolments;
    }

    // Placeholder data to illustrate layout until backend is connected
    return [
      {
        learner: "Fatima Hassan",
        email: "fatima.hassan@example.com",
        enrolledAt: "2025-02-18T10:32:00.000Z",
        progress: 68,
        lastActive: "2 hours ago",
        status: "In progress",
      },
      {
        learner: "Omar Al Farsi",
        email: "omar.alfarsi@example.com",
        enrolledAt: "2025-02-16T09:10:00.000Z",
        progress: 100,
        lastActive: "Yesterday",
        status: "Completed",
      },
      {
        learner: "Lina Joseph",
        email: "lina.joseph@example.com",
        enrolledAt: "2025-02-20T14:20:00.000Z",
        progress: 32,
        lastActive: "30 minutes ago",
        status: "New",
      },
    ];
  }, [course]);

  const linkableQuizzes = useMemo(() => {
    const attachedIds = new Set((course?.quizzes ?? []).map((item) => item.id));
    return availableQuizzes.filter((quizItem) => !attachedIds.has(quizItem.id));
  }, [availableQuizzes, course]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModuleFormChange = (event) => {
    const { name, value } = event.target;
    setModuleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLessonFormChange = (event) => {
    const { name, value } = event.target;
    setLessonForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuizFormChange = (event) => {
    const { name, value } = event.target;
    setQuizForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModuleSubmit = async (event) => {
    event.preventDefault();
    if (!course) return;

    const title = safeString(moduleForm.title);
    if (!title) {
      toast.error("Module title is required.");
      return;
    }

    const lessonTitle = safeString(moduleForm.lessonTitle);
    const lessons = lessonTitle
      ? [
          {
            title: lessonTitle,
            contentType: moduleForm.lessonType,
            contentUrl: sanitizeUrl(moduleForm.lessonUrl),
            durationMinutes: moduleForm.lessonDuration ? Number(moduleForm.lessonDuration) : null,
          },
        ]
      : [];

    setIsModuleSaving(true);
    try {
      const updated = await addCourseModule(course.id, {
        title,
        description: safeString(moduleForm.description),
        lessons,
      });
      setCourse(updated);
      setModuleForm({
        title: "",
        description: "",
        lessonTitle: "",
        lessonType: "video",
        lessonUrl: "",
        lessonDuration: "",
      });
      toast.success("Module added to curriculum.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to add module right now.");
    } finally {
      setIsModuleSaving(false);
    }
  };

  const handleAddLesson = async (event) => {
    event.preventDefault();
    if (!course || !activeLessonModule) return;

    const title = safeString(lessonForm.title);
    if (!title) {
      toast.error("Lesson title is required.");
      return;
    }

    if (!lessonForm.contentUrl) {
      toast.error("Please provide a content URL (video, PDF, etc.).");
      return;
    }

    setIsLessonSaving(true);
    try {
      const updated = await addLessonToModule(course.id, activeLessonModule, {
        title,
        contentType: lessonForm.contentType,
        contentUrl: sanitizeUrl(lessonForm.contentUrl),
        durationMinutes: lessonForm.durationMinutes ? Number(lessonForm.durationMinutes) : null,
      });
      setCourse(updated);
      setLessonForm({
        title: "",
        contentType: "video",
        contentUrl: "",
        durationMinutes: "",
      });
      setActiveLessonModule(null);
      toast.success("Lesson added.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to add lesson right now.");
    } finally {
      setIsLessonSaving(false);
    }
  };

  const handleRemoveModule = async (moduleId) => {
    if (!course) return;
    const confirmed = window.confirm("Delete this module and all its lessons?");
    if (!confirmed) return;
    try {
      const updated = await removeCourseModule(course.id, moduleId);
      setCourse(updated);
      toast.info("Module removed.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to remove module right now.");
    }
  };

  const handleMoveModule = async (moduleId, direction) => {
    if (!course) return;
    try {
      const updated = await moveCourseModule(course.id, moduleId, direction);
      setCourse(updated);
    } catch (error) {
      toast.error(error?.message ?? "Unable to reorder module right now.");
    }
  };

  const handleRemoveLesson = async (moduleId, lessonId) => {
    if (!course) return;
    const confirmed = window.confirm("Remove this lesson from the module?");
    if (!confirmed) return;
    try {
      const updated = await removeLessonFromModule(course.id, moduleId, lessonId);
      setCourse(updated);
      toast.info("Lesson removed.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to remove lesson right now.");
    }
  };

  const handleMoveLesson = async (moduleId, lessonId, direction) => {
    if (!course) return;
    try {
      const updated = await moveLessonWithinModule(course.id, moduleId, lessonId, direction);
      setCourse(updated);
    } catch (error) {
      toast.error(error?.message ?? "Unable to reorder lesson right now.");
    }
  };

  const handleLinkQuiz = async (event) => {
    event.preventDefault();
    if (!course) return;

    if (quizLinkMode === "existing") {
      if (!selectedQuizId) {
        toast.error("Select a quiz to link.");
        return;
      }
      const existingQuiz = availableQuizzes.find((quizItem) => quizItem.id === selectedQuizId);
      if (!existingQuiz) {
        toast.error("That quiz is no longer available.");
        return;
      }

      setIsQuizSaving(true);
      try {
        const updated = await linkCourseQuiz(course.id, {
          id: existingQuiz.id,
          title: existingQuiz.title,
          rewardCoins: existingQuiz.rewardCoins ?? 0,
          questionsCount:
            existingQuiz.questionsCount ?? existingQuiz.questions?.length ?? 0,
          availableUntil: existingQuiz.availableUntil ?? null,
          status: existingQuiz.status ?? "draft",
        });
        setCourse(updated);
        setSelectedQuizId("");
        toast.success("Quiz linked to course.");
      } catch (error) {
        toast.error(error?.message ?? "Unable to link quiz right now.");
      } finally {
        setIsQuizSaving(false);
        setAvailableQuizzes(getTeacherQuizzes());
      }
      return;
    }

    const title = safeString(quizForm.title);
    if (!title) {
      toast.error("Quiz title is required.");
      return;
    }

    setIsQuizSaving(true);
    try {
      const updated = await linkCourseQuiz(course.id, {
        title,
        rewardCoins: quizForm.rewardCoins ? Number(quizForm.rewardCoins) : 0,
        questionsCount: quizForm.questionsCount ? Number(quizForm.questionsCount) : 0,
        availableUntil:
          quizForm.availableUntil ? new Date(quizForm.availableUntil).toISOString() : null,
        status: "draft",
      });
      setCourse(updated);
      setQuizForm({
        title: "",
        rewardCoins: "",
        questionsCount: "",
        availableUntil: "",
      });
      toast.success("Quiz linked to course.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to link quiz right now.");
    } finally {
      setIsQuizSaving(false);
    }
  };

  const handleUnlinkQuiz = async (quizId) => {
    if (!course) return;
    try {
      const updated = await unlinkCourseQuiz(course.id, quizId);
      setCourse(updated);
      toast.info("Quiz removed from course.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to unlink quiz.");
    }
  };

  const handleStatusToggle = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "published" ? "draft" : "published",
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!course) return;

    const cleanedTitle = safeString(formData.title);
    const cleanedDescription = safeString(formData.description);
    if (!cleanedTitle) {
      toast.error("Course title is required.");
      return;
    }
    if (!cleanedDescription || cleanedDescription.length < 40) {
      toast.error("Description should be at least 40 characters.");
      return;
    }

    const tags = safeString(formData.tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title: cleanedTitle,
      subtitle: safeString(formData.subtitle),
      price: formData.price ? Number(formData.price) : 0,
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
      status: formData.status,
      publishImmediately: formData.status === "published",
      coverImage: sanitizeUrl(formData.coverImage),
      introVideoUrl: formData.introVideoUrl ? sanitizeUrl(formData.introVideoUrl) : "",
      description: cleanedDescription,
      tags,
    };

    setIsSaving(true);
    try {
      const updated = await updateTeacherCourse(course.id, payload);
      setCourse(updated);
      toast.success("Course details updated.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to update course. Please try again.");
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

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`Manage ${formData.title || "Course"} | Digital AELA Teacher Portal`}
        description="Edit your course, manage curriculum, and review student enrolments."
        keywords="course editor, manage course, digital aela mentor portal"
        url={`https://digitalaela.com/teacher/courses/${courseId}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,210,106,0.12),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20">
        <section className="layout-container space-y-8">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80 hover:text-[#ffe28a] md:mb-2">
                <HiOutlineArrowUturnLeft /> Back
              </button>
              <h1 className="text-3xl font-semibold md:text-4xl">{formData.title}</h1>
              <p className="mt-2 text-sm text-slate-300/80">
                Manage course settings, curriculum, and enrolled learners.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${
                  formData.status === "published"
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                    : "border-slate-500/40 bg-slate-500/10 text-slate-200"
                }`}>
                Status · {formData.status}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200">
                Last updated ·{" "}
                {course?.updatedAt ? new Date(course.updatedAt).toLocaleString() : "Just now"}
              </span>
            </div>
          </header>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#090D19]/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Course title*
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
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
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>

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
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
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
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="coverImage" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Cover image URL
                  </label>
                  <input
                    id="coverImage"
                    name="coverImage"
                    type="url"
                    value={formData.coverImage}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="introVideoUrl" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Intro video URL
                  </label>
                  <input
                    id="introVideoUrl"
                    name="introVideoUrl"
                    type="url"
                    value={formData.introVideoUrl}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:w-1/2">
                <label htmlFor="tags" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Tags
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="public speaking, cohort, storytelling"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <p className="text-[11px] text-slate-400">
                  Separate tags with commas. Helps learners and recruiters find your course.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-white">Publish status</p>
                  <p className="text-xs text-slate-400">
                    Toggle to publish immediately once the course is approved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStatusToggle}
                  className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/40 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-[#F5D26A] hover:border-[#F5D26A]/70 hover:text-[#ffe28a]">
                  {formData.status === "published" ? "Unpublish course" : "Publish course"}
                </button>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Tip: keep your description updated, add modules, and refresh pricing to stay competitive.
                </p>
                <motion.button
                  whileHover={{ scale: isSaving ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving ? 1 : 0.98 }}
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5D26A] px-6 py-2.5 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(245,210,106,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                  {isSaving ? "Saving..." : "Save changes"}
                </motion.button>
              </div>
            </form>
          </motion.section>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Curriculum & engagement</h2>
                  <p className="text-xs text-slate-400">
                    Add modules, lessons, and Learn & Earn quizzes tied to this course.
                  </p>
                </div>
              </header>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
                <div className="space-y-4">
                  <form
                    onSubmit={handleModuleSubmit}
                    className="space-y-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-white">Add module</p>
                      <span className="text-[11px] uppercase tracking-[0.25em] text-[#F5D26A]">Curriculum</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="moduleTitle" className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                          Module title*
                        </label>
                        <input
                          id="moduleTitle"
                          name="title"
                          type="text"
                          value={moduleForm.title}
                          onChange={handleModuleFormChange}
                          placeholder="Week 1 · Confidence foundations"
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="moduleLessonTitle" className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                          First lesson (optional)
                        </label>
                        <input
                          id="moduleLessonTitle"
                          name="lessonTitle"
                          type="text"
                          value={moduleForm.lessonTitle}
                          onChange={handleModuleFormChange}
                          placeholder="Kickoff & speaker baseline"
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                          Lesson type
                        </label>
                        <select
                          name="lessonType"
                          value={moduleForm.lessonType}
                          onChange={handleModuleFormChange}
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                          <option value="video">Video</option>
                          <option value="pdf">PDF</option>
                          <option value="audio">Audio</option>
                          <option value="assignment">Assignment</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                          Lesson URL
                        </label>
                        <input
                          name="lessonUrl"
                          type="url"
                          value={moduleForm.lessonUrl}
                          onChange={handleModuleFormChange}
                          placeholder="https://cdn.digitalaela.com/lesson.mp4"
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                          Duration (min)
                        </label>
                        <input
                          name="lessonDuration"
                          type="number"
                          min="0"
                          step="1"
                          value={moduleForm.lessonDuration}
                          onChange={handleModuleFormChange}
                          placeholder="45"
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] text-slate-400">Add more lessons later from each module card.</p>
                      <motion.button
                        whileHover={{ scale: isModuleSaving ? 1 : 1.02 }}
                        whileTap={{ scale: isModuleSaving ? 1 : 0.98 }}
                        type="submit"
                        disabled={isModuleSaving}
                        className="inline-flex items-center gap-2 rounded-full bg-[#F5D26A] px-5 py-2 text-sm font-semibold text-black shadow-[0_12px_40px_rgba(245,210,106,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                        {isModuleSaving ? "Saving..." : "Add module"}
                      </motion.button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {(course?.modules ?? []).length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                        No modules yet. Start with the form above to build your first week.
                      </div>
                    )}
                    {(course?.modules ?? []).map((module, moduleIndex) => (
                      <div key={module.id} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-base font-semibold text-white">
                              {module.order}. {module.title}
                            </p>
                            {module.description ? (
                              <p className="text-xs text-slate-300/80">{module.description}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-300">
                            <span className="rounded-full border border-white/10 px-3 py-1">
                              {module.lessons?.length ?? 0} lessons
                            </span>
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                              <button
                                type="button"
                                onClick={() => handleMoveModule(module.id, "up")}
                                disabled={moduleIndex === 0}
                                className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] transition hover:border-[#F5D26A]/60 hover:text-[#F5D26A] disabled:cursor-not-allowed disabled:opacity-40">
                                Move up
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveModule(module.id, "down")}
                                disabled={moduleIndex === (course?.modules?.length ?? 0) - 1}
                                className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] transition hover:border-[#F5D26A]/60 hover:text-[#F5D26A] disabled:cursor-not-allowed disabled:opacity-40">
                                Move down
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveModule(module.id)}
                                className="rounded-full border border-red-400/40 px-3 py-1 text-xs uppercase tracking-[0.25em] text-red-300 transition hover:border-red-400/70 hover:text-red-200">
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(module.lessons ?? []).map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="space-y-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-200">
                              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                <p className="font-semibold text-white">
                                  {lesson.order}. {lesson.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                                  <span>{lesson.contentType}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveLesson(module.id, lesson.id, "up")}
                                    disabled={lessonIndex === 0}
                                    className="rounded-full border border-white/10 px-2 py-1 text-[10px] transition hover:border-[#F5D26A]/60 hover:text-[#F5D26A] disabled:cursor-not-allowed disabled:opacity-40">
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveLesson(module.id, lesson.id, "down")}
                                    disabled={lessonIndex === (module.lessons?.length ?? 0) - 1}
                                    className="rounded-full border border-white/10 px-2 py-1 text-[10px] transition hover:border-[#F5D26A]/60 hover:text-[#F5D26A] disabled:cursor-not-allowed disabled:opacity-40">
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLesson(module.id, lesson.id)}
                                    className="rounded-full border border-red-400/40 px-2 py-1 text-[10px] text-red-300 transition hover:border-red-400/70 hover:text-red-200">
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400/80">
                                {lesson.durationMinutes ? <span>⏱ {lesson.durationMinutes} mins</span> : null}
                                {lesson.contentUrl ? (
                                  <a
                                    href={lesson.contentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#F5D26A] hover:text-[#ffe28a]">
                                    View resource →
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>

                        {activeLessonModule === module.id ? (
                          <form onSubmit={handleAddLesson} className="space-y-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-xs text-slate-200">
                            <div className="grid gap-3 md:grid-cols-3">
                              <input
                                name="title"
                                type="text"
                                value={lessonForm.title}
                                onChange={handleLessonFormChange}
                                placeholder="Lesson title"
                                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                              />
                              <select
                                name="contentType"
                                value={lessonForm.contentType}
                                onChange={handleLessonFormChange}
                                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                                <option value="video">Video</option>
                                <option value="pdf">PDF</option>
                                <option value="audio">Audio</option>
                                <option value="assignment">Assignment</option>
                              </select>
                              <input
                                name="durationMinutes"
                                type="number"
                                min="0"
                                step="1"
                                value={lessonForm.durationMinutes}
                                onChange={handleLessonFormChange}
                                placeholder="Duration"
                                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                              />
                            </div>
                            <input
                              name="contentUrl"
                              type="url"
                              value={lessonForm.contentUrl}
                              onChange={handleLessonFormChange}
                              placeholder="https://..."
                              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                            />
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: isLessonSaving ? 1 : 1.02 }}
                                whileTap={{ scale: isLessonSaving ? 1 : 0.98 }}
                                type="submit"
                                disabled={isLessonSaving}
                                className="inline-flex items-center gap-2 rounded-full bg-[#F5D26A] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-black disabled:cursor-not-allowed disabled:opacity-70">
                                {isLessonSaving ? "Saving..." : "Add lesson"}
                              </motion.button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveLessonModule(null);
                                  setLessonForm({
                                    title: "",
                                    contentType: "video",
                                    contentUrl: "",
                                    durationMinutes: "",
                                  });
                                }}
                                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-200">
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLessonModule(module.id);
                              setLessonForm({
                                title: "",
                                contentType: "video",
                                contentUrl: "",
                                durationMinutes: "",
                              });
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white hover:text-[#F5D26A]">
                            <HiOutlinePlus /> Add lesson
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <form
                    onSubmit={handleLinkQuiz}
                    className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-white">Link Learn & Earn quiz</p>
                      <span className="text-[11px] uppercase tracking-[0.25em] text-sky-200">Engagement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="newQuiz"
                        name="quizLinkMode"
                        value="new"
                        checked={quizLinkMode === "new"}
                        onChange={() => setQuizLinkMode("new")}
                        className="h-4 w-4 text-sky-400 focus:ring-sky-400 border-gray-300"
                      />
                      <label htmlFor="newQuiz" className="text-[11px] text-slate-300/80">
                        Create a new quiz
                      </label>
                      <input
                        type="radio"
                        id="existingQuiz"
                        name="quizLinkMode"
                        value="existing"
                        checked={quizLinkMode === "existing"}
                        onChange={() => setQuizLinkMode("existing")}
                        className="h-4 w-4 text-sky-400 focus:ring-sky-400 border-gray-300"
                      />
                      <label htmlFor="existingQuiz" className="text-[11px] text-slate-300/80">
                        Link an existing quiz
                      </label>
                    </div>
                    {quizLinkMode === "new" ? (
                      <>
                        <input
                          name="title"
                          type="text"
                          value={quizForm.title}
                          onChange={handleQuizFormChange}
                          placeholder="Confidence lightning round"
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300/80">
                              Reward coins
                            </label>
                            <input
                              name="rewardCoins"
                              type="number"
                              min="0"
                              step="10"
                              value={quizForm.rewardCoins}
                              onChange={handleQuizFormChange}
                              placeholder="120"
                              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300/80">
                              Questions
                            </label>
                            <input
                              name="questionsCount"
                              type="number"
                              min="0"
                              step="1"
                              value={quizForm.questionsCount}
                              onChange={handleQuizFormChange}
                              placeholder="10"
                              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                            />
                          </div>
                        </div>
                        <input
                          name="availableUntil"
                          type="datetime-local"
                          value={quizForm.availableUntil}
                          onChange={handleQuizFormChange}
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                        />
                      </>
                    ) : (
                      <>
                        <label htmlFor="existingQuizSelect" className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300/80">
                          Select an existing quiz:
                        </label>
                        <select
                          id="existingQuizSelect"
                          name="selectedQuizId"
                          value={selectedQuizId}
                          onChange={(e) => setSelectedQuizId(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30">
                          <option value="">Select a quiz...</option>
                          {linkableQuizzes.map((quiz) => (
                            <option key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </option>
                          ))}
                        </select>
                        {linkableQuizzes.length === 0 ? (
                          <p className="text-[11px] text-slate-400">
                            You have no unlinked quizzes yet. Create one first or unlink an existing quiz.
                          </p>
                        ) : null}
                      </>
                    )}
                    <motion.button
                      whileHover={{ scale: isQuizSaving ? 1 : 1.02 }}
                      whileTap={{ scale: isQuizSaving ? 1 : 0.98 }}
                      type="submit"
                      disabled={
                        isQuizSaving || (quizLinkMode === "existing" && linkableQuizzes.length === 0)
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-black shadow-[0_12px_40px_rgba(56,189,248,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                      {isQuizSaving ? "Linking..." : "Link quiz"}
                    </motion.button>
                  </form>

                  <div className="space-y-3">
                    {(course?.quizzes ?? []).length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                        No quizzes linked yet. Create a quiz to reward learners with coins.
                      </div>
                    )}
                    {(course?.quizzes ?? []).map((quiz) => (
                      <div key={quiz.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-base font-semibold text-white">{quiz.title}</p>
                            <p className="text-xs text-slate-400">
                              Reward · {quiz.rewardCoins} coins · {quiz.questionsCount} questions
                            </p>
                            {quiz.availableUntil ? (
                              <p className="text-[11px] text-slate-400/80">
                                Closes {new Date(quiz.availableUntil).toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400/80">No closing date</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnlinkQuiz(quiz.id)}
                            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300 hover:text-white">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Activity & approvals</h2>
                  <p className="text-xs text-slate-400">Keep track of submissions and review cycles.</p>
                </div>
              </header>
              <div className="mt-4 space-y-3 text-xs text-slate-300/80">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Draft saved</p>
                  <p className="text-[11px] text-slate-400">Your initial draft is ready for review.</p>
                  <p className="text-[11px] text-[#F5D26A]/80">
                    {course?.createdAt ? new Date(course.createdAt).toLocaleString() : "Just now"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Next steps</p>
                  <p className="text-[11px] text-slate-400">
                    Once published, Analytics and Sales dashboards will appear here.
                  </p>
                </div>
              </div>
            </motion.section>
          </div>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#0A0E1C]/90 p-6">
            <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Student enrolments</h2>
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
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-3 font-semibold">Learner</th>
                    <th className="px-3 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Progress</th>
                    <th className="px-3 py-3 font-semibold">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolments.map((row) => (
                    <tr key={`${row.learner}-${row.email}`} className="border-b border-white/5 last:border-b-0">
                      <td className="px-3 py-3 font-semibold text-white">{row.learner}</td>
                      <td className="px-3 py-3 text-xs text-slate-300/90">{row.email}</td>
                      <td className="px-3 py-3 text-xs">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                            row.status === "Completed"
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                              : row.status === "New"
                              ? "border-sky-400/40 bg-sky-500/10 text-sky-200"
                              : "border-amber-400/40 bg-amber-500/10 text-amber-200"
                          }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-200">
                        <div className="w-40">
                          <div className="h-2 rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-[#F5D26A] to-[#facc15]"
                              style={{ width: `${Math.min(row.progress, 100)}%` }}
                            />
                          </div>
                          <span className="mt-1 block text-[11px] text-slate-400">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300/80">{row.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </section>
      </main>
    </div>
  );
};

export default CourseDetail;

