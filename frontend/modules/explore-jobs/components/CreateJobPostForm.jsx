import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HiOutlinePlusCircle } from "react-icons/hi2";
import { useExploreJobs } from "../context/ExploreJobsContext";
import TranslatedText from "../../../src/components/TranslatedText";

const defaultValues = {
  title: "",
  company: "",
  location: "",
  salary: "",
  experience: "",
  employmentType: "",
  tags: "",
  image: "",
  description: "",
  cultureHighlights: "",
  applyCTA: "",
};

const inputBase =
  "w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-500";

const toList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const CreateJobPostForm = ({ onSubmitComplete, isEditing, initialData, onSubmitOverride }) => {
  const [formValues, setFormValues] = useState(initialData ?? defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createJobPost, updateJobPost } = useExploreJobs();

  const isReady = useMemo(() => {
    return (
      formValues.title?.length >= 4 &&
      formValues.company?.length >= 2 &&
      formValues.location?.length >= 3 &&
      formValues.description?.length >= 12
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
      tags: toList(formValues.tags),
      cultureHighlights: toList(formValues.cultureHighlights),
    };

    try {
      if (onSubmitOverride) {
        await onSubmitOverride(payload, {
          isEditing,
          id: initialData?.id,
        });
      } else if (isEditing && initialData?.id) {
        updateJobPost(initialData.id, payload);
      } else {
        createJobPost(payload);
      }
      setTimeout(() => {
        setIsSubmitting(false);
        onSubmitComplete?.();
        setFormValues(defaultValues);
      }, 350);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to submit job post", error);
      setIsSubmitting(false);
    }
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
          {isEditing ? <TranslatedText>Update Role Drop</TranslatedText> : <TranslatedText>New Job Drop</TranslatedText>}
        </p>
        <h3 className="text-xl font-semibold text-white">
          {isEditing ? <TranslatedText>Edit job post</TranslatedText> : <TranslatedText>Share a role within 90 seconds</TranslatedText>}
        </h3>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Job Title*</TranslatedText>
          </label>
          <input
            name="title"
            value={formValues.title}
            onChange={handleChange}
            placeholder="Lead Product Designer" // Placeholder
            className={inputBase}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Company*</TranslatedText>
          </label>
          <input
            name="company"
            value={formValues.company}
            onChange={handleChange}
            placeholder="Aurora Finance" // Placeholder
            className={inputBase}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Location*</TranslatedText>
          </label>
          <input
            name="location"
            value={formValues.location}
            onChange={handleChange}
            placeholder="Remote · Europe / India" // Placeholder
            className={inputBase}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Salary Range</TranslatedText>
          </label>
          <input
            name="salary"
            value={formValues.salary}
            onChange={handleChange}
            placeholder="₹28L – ₹36L / $80k – $110k" // Placeholder
            className={inputBase}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Experience Level</TranslatedText>
          </label>
          <input
            name="experience"
            value={formValues.experience}
            onChange={handleChange}
            placeholder="5–7 years · Fintech" // Placeholder
            className={inputBase}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Employment Type</TranslatedText>
          </label>
          <input
            name="employmentType"
            value={formValues.employmentType}
            onChange={handleChange}
            placeholder="Full-time · Remote" // Placeholder
            className={inputBase}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Primary Tags (comma separated)</TranslatedText>
          </label>
          <input
            name="tags"
            value={formValues.tags}
            onChange={handleChange}
            placeholder="Design Systems, Figma, Accessibility" // Placeholder
            className={inputBase}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            <TranslatedText>Culture Highlights</TranslatedText>
          </label>
          <input
            name="cultureHighlights"
            value={formValues.cultureHighlights}
            onChange={handleChange}
            placeholder="Quarterly design retreats, Learning wallet" // Placeholder
            className={inputBase}
          />
        </div>
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

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          <TranslatedText>Description*</TranslatedText>
        </label>
        <textarea
          name="description"
          value={formValues.description}
          onChange={handleChange}
          placeholder="Why is this role exciting? What challenges will they own?" // Placeholder
          className={`${inputBase} min-h-[140px]`}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          <TranslatedText>Application CTA</TranslatedText>
        </label>
        <input
          name="applyCTA"
          value={formValues.applyCTA}
          onChange={handleChange}
          placeholder="Apply via portfolio drop" // Placeholder
          className={inputBase}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
        <p className="text-xs text-gray-500">
          <TranslatedText>Tip: Keep it crisp like an Instagram drop. Add images, highlights, and perks.</TranslatedText>
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
            <HiOutlinePlusCircle className="h-5 w-5" />
            {isSubmitting ? <TranslatedText>Publishing...</TranslatedText> : isEditing ? <TranslatedText>Update Post</TranslatedText> : <TranslatedText>Publish Job</TranslatedText>}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

export default CreateJobPostForm;


