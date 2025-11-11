import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { createTeacherQuiz } from "../../src/services/teacherQuizzes";
import { safeString } from "../../src/utils/registrationHelpers";

const sectionVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const initialForm = {
  title: "",
  description: "",
  rewardCoins: "",
  questionsCount: "",
  courseId: "",
  availableFrom: "",
  availableUntil: "",
  timeLimitMinutes: "",
};

const emptyQuestion = {
  prompt: "",
  type: "single-choice",
  options: ["", "", "", ""],
  correctIndex: 0,
};

const QuizCreate = () => {
  const [formData, setFormData] = useState(initialForm);
  const [questions, setQuestions] = useState([emptyQuestion]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      courseIds: safeString(formData.courseId) ? [safeString(formData.courseId)] : [],
      availableFrom: formData.availableFrom ? new Date(formData.availableFrom).toISOString() : null,
      availableUntil: formData.availableUntil ? new Date(formData.availableUntil).toISOString() : null,
      timeLimitMinutes: formData.timeLimitMinutes ? Number(formData.timeLimitMinutes) : null,
      questions: preparedQuestions,
      status: "draft",
    };

    setIsSubmitting(true);
    try {
      await createTeacherQuiz(payload);
      toast.success("Quiz saved as draft. Link it to courses from the dashboard.");
      setFormData(initialForm);
      setQuestions([emptyQuestion]);
      navigate("/teacher/dashboard", { replace: true, state: { highlightQuizzes: true } });
    } catch (error) {
      toast.error(error?.message ?? "Unable to save quiz right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title="Create Quiz | Digital AELA Teacher Portal"
        description="Build Learn & Earn quizzes, reward learners with coins, and schedule availability."
        keywords="create quiz, learn and earn, digital aela"
        url="https://digitalaela.com/teacher/quizzes/new"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20">
        <section className="layout-container space-y-8">
          <header className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
              Learn & Earn Quiz Builder
            </span>
            <h1 className="text-2xl font-semibold md:text-3xl">Create a new quiz</h1>
            <p className="text-sm text-slate-300/80 md:max-w-2xl">
              Craft questions, assign rewards, and schedule availability. Publishing hooks into Learn & Earn once backend APIs are live.
            </p>
          </header>

          <motion.form
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-8 rounded-3xl border border-white/10 bg-[#090D19]/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <section className="grid gap-4 md:grid-cols-2">
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
                  placeholder="Confidence Lightning Round"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
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
                  placeholder="120"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="questionsCount" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Questions
                </label>
                <input
                  id="questionsCount"
                  name="questionsCount"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.questionsCount}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="courseId" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Optional course ID
                </label>
                <input
                  id="courseId"
                  name="courseId"
                  type="text"
                  value={formData.courseId}
                  onChange={handleChange}
                  placeholder="course-abc123"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
                <p className="text-[11px] text-slate-400">
                  Link to a course now or later via the course dashboard.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                Description*
              </label>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Explain what the quiz covers, target learners, and any participation rules."
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                required
              />
            </section>

            <section className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-1.5">
                <label htmlFor="timeLimitMinutes" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">
                  Time limit (min)
                </label>
                <input
                  id="timeLimitMinutes"
                  name="timeLimitMinutes"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.timeLimitMinutes}
                  onChange={handleChange}
                  placeholder="15"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
            </section>

            <section className="space-y-4">
              <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Questions</h2>
                  <p className="text-xs text-slate-400">
                    Provide at least one question. Each question supports up to four options.
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
                  <div key={`question-${index}`} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
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
              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-400 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(56,189,248,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? "Saving..." : "Save quiz"}
              </motion.button>
            </footer>
          </motion.form>
        </section>
      </main>
    </div>
  );
};

export default QuizCreate;

