import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineSparkles } from "react-icons/hi2";
import { useExploreJobs } from "../context/ExploreJobsContext";
import TranslatedText from "../../../src/components/TranslatedText";

const defaultValues = {
  title: "",
  headline: "",
  summary: "",
  experience: "",
  skills: "",
  achievements: "",
  availability: "Immediate",
  image: "",
  resumeUrl: "",
  portfolioUrl: "",
};

const inputBase =
  "w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500";

const toList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toExperience = (value) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [role, company, period] = line.split("|").map((item) => item.trim());
      return { role, company, period };
    });

const CreateResumePostForm = ({ onSubmitComplete, isEditing, initialData }) => {
  const [formValues, setFormValues] = useState(initialData ?? defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createResumePost, updateResumePost } = useExploreJobs();

  const isReady = useMemo(() => {
    return (
      formValues.title?.length >= 3 &&
      formValues.headline?.length >= 6 &&
      formValues.summary?.length >= 12
    );
  }, [formValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isReady || isSubmitting) return;

    setIsSubmitting(true);

    const payload = {
      ...formValues,
      skills: toList(formValues.skills),
      achievements: toList(formValues.achievements),
      experience: toExperience(formValues.experience),
    };

    if (isEditing && initialData?.id) {
      updateResumePost(initialData.id, payload);
    } else {
      createResumePost(payload);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitComplete?.();
      setFormValues(defaultValues);
    }, 450);
  };

  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
    } else {
      setFormValues(defaultValues);
    }
  }, [initialData]);

  return (
    <motion.form
      layout
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[28px] border border-white/10 bg-[#040404]/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
          {isEditing ? <TranslatedText>Refresh Spotlight</TranslatedText> : <TranslatedText>Resume Spotlight</TranslatedText>}
        </p>
        <h3 className="text-xl font-semibold text-white">
          {isEditing ? <TranslatedText>Update your showcase</TranslatedText> : <TranslatedText>Share your wins like a carousel</TranslatedText>}
        </h3>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Title*</TranslatedText>
          </label>
          <input
            name="title"
            value={formValues.title}
            onChange={handleChange}
            placeholder="Product Designer · Fintech" // Placeholder
            className={inputBase}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Headline*</TranslatedText>
          </label>
          <input
            name="headline"
            value={formValues.headline}
            onChange={handleChange}
            placeholder="Designing inclusive financial journeys" // Placeholder
            className={inputBase}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          <TranslatedText>Summary*</TranslatedText>
        </label>
        <textarea
          name="summary"
          value={formValues.summary}
          onChange={handleChange}
          placeholder="Tell recruiters what makes you unique, your impact, your story." // Placeholder
          className={`${inputBase} min-h-[140px]`}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          <TranslatedText>Experience (newline separated · role | company | period)</TranslatedText>
        </label>
        <textarea
          name="experience"
          value={formValues.experience}
          onChange={handleChange}
          placeholder={`Lead Product Designer | FlowPay | 2022 — Present\nDesign Mentor | Figma Guild | 2021 — Present`} // Placeholder
          className={`${inputBase} min-h-[110px]`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Highlight Skills (comma separated)</TranslatedText>
          </label>
          <input
            name="skills"
            value={formValues.skills}
            onChange={handleChange}
            placeholder="Design Systems, Research, Accessibility" // Placeholder
            className={inputBase}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Achievements (comma separated)</TranslatedText>
          </label>
          <input
            name="achievements"
            value={formValues.achievements}
            onChange={handleChange}
            placeholder="Inclusive Design Award, Speaker · React India" // Placeholder
            className={inputBase}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Availability</TranslatedText>
          </label>
          <input
            name="availability"
            value={formValues.availability}
            onChange={handleChange}
            placeholder="Immediate · Open to relocation" // Placeholder
            className={inputBase}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Cover Image URL</TranslatedText>
          </label>
          <input
            name="image"
            value={formValues.image}
            onChange={handleChange}
            placeholder="https://images.unsplash.com/..." // Placeholder
            className={inputBase}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Resume URL</TranslatedText>
          </label>
          <input
            name="resumeUrl"
            value={formValues.resumeUrl}
            onChange={handleChange}
            placeholder="https://drive.google.com/..." // Placeholder
            className={inputBase}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Portfolio URL</TranslatedText>
          </label>
          <input
            name="portfolioUrl"
            value={formValues.portfolioUrl}
            onChange={handleChange}
            placeholder="https://yourname.design" // Placeholder
            className={inputBase}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
        <p className="text-xs text-gray-500">
          <TranslatedText>Tip: Share roles & achievements like Instagram carousels. Keep it visual.</TranslatedText>
        </p>
        <div className="flex items-center gap-3">
          <button
            type="reset"
            onClick={() => setFormValues(initialData ?? defaultValues)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-white/30">
            <TranslatedText>Reset</TranslatedText>
          </button>
          <button
            type="submit"
            disabled={!isReady || isSubmitting}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold transition ${
              !isReady || isSubmitting
                ? "cursor-not-allowed border border-white/10 bg-white/5 text-gray-400"
                : "bg-white text-black shadow-lg shadow-white/30 hover:-translate-y-0.5"
            }`}>
            <HiOutlineSparkles className="h-5 w-5" />
            {isSubmitting ? <TranslatedText>Posting...</TranslatedText> : isEditing ? <TranslatedText>Update Showcase</TranslatedText> : <TranslatedText>Post Showcase</TranslatedText>}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

export default CreateResumePostForm;


