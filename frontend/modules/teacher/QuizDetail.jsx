import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { getTeacherQuizById, updateTeacherQuiz, deleteTeacherQuiz } from "../../src/services/teacherQuizzes";
import { safeString } from "../../src/utils/registrationHelpers";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const emptyQuestion = {
  prompt: "",
  type: "single-choice",
  options: ["", "", "", ""],
  correctIndex: 0,
};

const QuizDetail = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    rewardCoins: "",
    questionsCount: "",
    timeLimitMinutes: "",
    status: "draft",
    availableFrom: "",
    availableUntil: "",
  });
  const [questions, setQuestions] = useState([emptyQuestion]);

  useEffect(() => {
    const existing = getTeacherQuizById(quizId);
    if (!existing) {
      toast.error("We couldn't find that quiz.");
      navigate("/teacher/dashboard", { replace: true });
      return;
    }

    setQuiz(existing);
    setFormData({
      title: existing.title ?? "",
      description: existing.description ?? "",
      rewardCoins: existing.rewardCoins?.toString() ?? "",
      questionsCount: existing.questionsCount?.toString() ?? "",
      timeLimitMinutes: existing.timeLimitMinutes?.toString() ?? "",
      status: existing.status ?? "draft",
      availableFrom: existing.availableFrom
        ? new Date(existing.availableFrom).toISOString().slice(0, 16)
        : "",
      availableUntil: existing.availableUntil
        ? new Date(existing.availableUntil).toISOString().slice(0, 16)
        : "",
    });
    setQuestions(
      Array.isArray(existing.questions) && existing.questions.length > 0
        ? existing.questions.map((question) => ({
            prompt: question.prompt ?? "",
            type: question.type ?? "single-choice",
            options:
              question.options && question.options.length > 0
                ? [...question.options, ...Array(Math.max(0, 4 - question.options.length)).fill("")]
                : ["", "", "", ""],
            correctIndex: question.correctIndex ?? 0,
          }))
        : [emptyQuestion]
    );
    setIsLoading(false);
  }, [quizId, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      const updatedOptions = [...next[questionIndex].options];
      updatedOptions[optionIndex] = value;
      next[questionIndex] = {
        ...next[questionIndex],
        options: updatedOptions,
      };
      return next;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { ...emptyQuestion }]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validateQuestions = () => {
    for (const question of questions) {
      const prompt = safeString(question.prompt);
      if (!prompt) {
        toast.error("Each question needs a prompt.");
        return false;
      }
      const options = question.options.map((opt) => safeString(opt)).filter(Boolean);
      if (options.length < 2) {
        toast.error("Each question needs at least two options.");
        return false;
      }
      if (question.correctIndex < 0 || question.correctIndex >= options.length) {
        toast.error("Each question needs a valid correct option.");
        return false;
      }
    }
    return true;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!quiz) return;

    const cleanedTitle = safeString(formData.title);
    const cleanedDescription = safeString(formData.description);
    if (!cleanedTitle) {
      toast.error("Quiz title is required.");
      return;
    }
    if (!cleanedDescription || cleanedDescription.length < 20) {
      toast.error("Description should be at least 20 characters.");
      return;
    }
    if (!validateQuestions()) return;

    const preparedQuestions = questions.map((question) => ({
      prompt: safeString(question.prompt),
      type: question.type,
      options: question.options.map((opt) => safeString(opt)).filter(Boolean),
      correctIndex: question.correctIndex,
    }));

    const payload = {
      title: cleanedTitle,
      description: cleanedDescription,
      rewardCoins: formData.rewardCoins ? Number(formData.rewardCoins) : 0,
      questionsCount: formData.questionsCount
        ? Number(formData.questionsCount)
        : preparedQuestions.length,
      availableFrom: formData.availableFrom ? new Date(formData.availableFrom).toISOString() : null,
      availableUntil: formData.availableUntil ? new Date(formData.availableUntil).toISOString() : null,
      timeLimitMinutes: formData.timeLimitMinutes ? Number(formData.timeLimitMinutes) : null,
      status: formData.status,
      questions: preparedQuestions,
    };

    setIsSaving(true);
    try {
      const updated = await updateTeacherQuiz(quiz.id, payload);
      setQuiz(updated);
      toast.success("Quiz details saved.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to save quiz right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "published" ? "draft" : "published",
    }));
  };

  const handleDelete = async () => {
    if (!quiz) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz? This action cannot be undone."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteTeacherQuiz(quiz.id);
      toast.success("Quiz removed.");
      navigate("/teacher/dashboard", { replace: true });
    } catch (error) {
      toast.error(error?.message ?? "Unable to delete quiz right now.");
    } finally {
      setIsDeleting(false);
    }
  };

  const metrics = useMemo(
    () => ({
      attempts: quiz?.attempts ?? 0,
      avgScore: quiz?.averageScore ?? 0,
      completionRate: quiz?.completionRate ?? 0,
    }),
    [quiz]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060D] text-white">
        <p className="text-sm text-slate-300/80">Loading quiz...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`Manage ${formData.title || "Quiz"} | Digital AELA`}
        description="Edit Learn & Earn quiz details, manage questions, and publish when ready."
        keywords="quiz editor, learn and earn, digital aela"
        url={`https://digitalaela.com/teacher/quizzes/${quizId}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20">
        <section className="layout-container space-y-8">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80 hover:text-sky-100 md:mb-2">
                ← Back
              </button>
              <h1 className="text-3xl font-semibold md:text-4xl">{formData.title || "Untitled quiz"}</h1>
              <p className="mt-2 text-sm text-slate-300/80">
                Edit metadata, manage questions, and control publish state.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${
                  formData.status === "published"
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                    : "border-slate-500/40 bg-slate-500/10 text-slate-200"
                }`}>
                Status · {formData.status}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Updated · {quiz?.updatedAt ? new Date(quiz.updatedAt).toLocaleString() : "Just now"}
              </span>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-sky-400/20 bg-[#0a1424]/80 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Attempts</p>
              <p className="mt-2 text-2xl font-semibold text-white">{metrics.attempts}</p>
            </div>
            <div className="rounded-3xl border border-sky-400/20 bg-[#0a1424]/80 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Average score</p>
              <p className="mt-2 text-2xl font-semibold text-white">{metrics.avgScore}%</p>
            </div>
            <div className="rounded-3xl border border-sky-400/20 bg-[#0a1424]/80 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Completion rate</p>
              <p className="mt-2 text-2xl font-semibold text-white">{metrics.completionRate}%</p>
            </div>
          </section>

          <motion.form
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSave}
            className="space-y-6 rounded-3xl border border-white/10 bg-[#090D19]/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Quiz title*
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="rewardCoins" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Reward coins
                </label>
                <input
                  id="rewardCoins"
                  name="rewardCoins"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.rewardCoins}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="questionsCount" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Questions count
                </label>
                <input
                  id="questionsCount"
                  name="questionsCount"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.questionsCount}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
                <p className="text-[11px] text-slate-400">
                  Leave empty to auto-populate from the number of questions below.
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="timeLimitMinutes" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Time limit (minutes)
                </label>
                <input
                  id="timeLimitMinutes"
                  name="timeLimitMinutes"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.timeLimitMinutes}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="availableFrom" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Available from
                </label>
                <input
                  id="availableFrom"
                  name="availableFrom"
                  type="datetime-local"
                  value={formData.availableFrom}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="availableUntil" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Available until
                </label>
                <input
                  id="availableUntil"
                  name="availableUntil"
                  type="datetime-local"
                  value={formData.availableUntil}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-white">Publish status</p>
                <p className="text-xs text-slate-400">
                  Set to published to make the quiz visible in Learn & Earn once approvals are done.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStatusToggle}
                className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-sky-200 hover:border-sky-300/60 hover:text-sky-100">
                {formData.status === "published" ? "Unpublish quiz" : "Publish quiz"}
              </button>
            </div>

            <section className="space-y-4">
              <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Questions</h2>
                  <p className="text-xs text-slate-400">
                    Each question supports up to four options. Mark the correct answer to reward accuracy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:border-sky-300/60 hover:text-sky-100">
                  + Add question
                </button>
              </header>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={`question-${index}`}
                    className="space-y-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-semibold text-white">Question {index + 1}</p>
                      {questions.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-100">
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <textarea
                      value={question.prompt}
                      onChange={(event) => handleQuestionChange(index, "prompt", event.target.value)}
                      rows={3}
                      placeholder="What is the strongest hook to open a presentation?"
                      className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={`option-${optionIndex}`} className="space-y-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                            Option {optionIndex + 1}
                          </label>
                          <input
                            type="text"
                            value={option}
                            onChange={(event) =>
                              handleOptionChange(index, optionIndex, event.target.value)
                            }
                            placeholder={`Response ${optionIndex + 1}`}
                            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                        Correct option
                      </label>
                      <select
                        value={question.correctIndex}
                        onChange={(event) =>
                          handleQuestionChange(index, "correctIndex", Number(event.target.value))
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-emerald-400/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/30">
                        {question.options.map((_, optionIndex) => (
                          <option key={`correct-${optionIndex}`} value={optionIndex}>
                            Option {optionIndex + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <footer className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Quizzes start in draft mode. Publishing and automated rewards connect once backend endpoints arrive.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ scale: isSaving ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving ? 1 : 0.98 }}
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-400 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(56,189,248,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                  {isSaving ? "Saving..." : "Save quiz"}
                </motion.button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/40 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-red-300 transition hover:border-red-400/60 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60">
                  {isDeleting ? "Deleting..." : "Delete quiz"}
                </button>
              </div>
            </footer>
          </motion.form>
        </section>
      </main>
    </div>
  );
};

export default QuizDetail;

