import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { getTeacherEbookById, updateTeacherEbook } from "../../src/services/teacherEbooks";
import { safeString, sanitizeUrl } from "../../src/utils/registrationHelpers";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const categories = [
  "Public Speaking",
  "IELTS & Test Prep",
  "Corporate Communication",
  "Leadership & Soft Skills",
  "Digital Marketing",
  "Career Development",
  "Learn & Earn",
  "Other",
];

const EbookDetail = () => {
  const { ebookId } = useParams();
  const navigate = useNavigate();

  const [ebook, setEbook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    category: "",
    coverImage: "",
    previewUrl: "",
    tags: "",
    status: "draft",
  });

  useEffect(() => {
    const existing = getTeacherEbookById(ebookId);
    if (!existing) {
      toast.error("We couldn't find that e-book.");
      navigate("/teacher/dashboard", { replace: true });
      return;
    }

    setEbook(existing);
    setFormData({
      title: existing.title ?? "",
      subtitle: existing.subtitle ?? "",
      description: existing.description ?? "",
      price: existing.price?.toString() ?? "",
      category: existing.category ?? "",
      coverImage: existing.coverImage ?? "",
      previewUrl: existing.previewUrl ?? "",
      tags: Array.isArray(existing.tags) ? existing.tags.join(", ") : safeString(existing.tags),
      status: existing.status ?? "draft",
    });
    setIsLoading(false);
  }, [ebookId, navigate]);

  const fileMeta = useMemo(() => ebook?.fileMeta ?? null, [ebook]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusToggle = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "published" ? "draft" : "published",
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!ebook) return;

    const cleanedTitle = safeString(formData.title);
    const cleanedDescription = safeString(formData.description);
    if (!cleanedTitle) {
      toast.error("Title is required.");
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
      description: cleanedDescription,
      price: formData.price ? Number(formData.price) : 0,
      category: safeString(formData.category) || "Uncategorised",
      coverImage: sanitizeUrl(formData.coverImage),
      previewUrl: sanitizeUrl(formData.previewUrl),
      status: formData.status,
      tags,
    };

    setIsSaving(true);
    try {
      const updated = await updateTeacherEbook(ebook.id, payload);
      setEbook(updated);
      toast.success("E-book details saved.");
    } catch (error) {
      toast.error(error?.message ?? "Unable to save changes right now.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060D] text-white">
        <p className="text-sm text-slate-300/80">Loading e-book...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`Manage ${formData.title || "E-book"} | Digital AELA`}
        description="Edit your e-book metadata, manage status, and prepare it for publishing."
        keywords="ebook editor, digital aela teacher"
        url={`https://digitalaela.com/teacher/ebooks/${ebookId}`}
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
                ← Back
              </button>
              <h1 className="text-3xl font-semibold md:text-4xl">{formData.title || "Untitled e-book"}</h1>
              <p className="mt-2 text-sm text-slate-300/80">
                Update details, adjust pricing, and publish when you’re ready.
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
                Updated · {ebook.updatedAt ? new Date(ebook.updatedAt).toLocaleString() : "Just now"}
              </span>
            </div>
          </header>

          <motion.form
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSave}
            className="space-y-6 rounded-3xl border border-white/10 bg-[#090D19]/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Title*
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
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
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="category" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                  <option value="">Select category</option>
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="price" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Price (AED)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
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
                onChange={handleChange}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                required
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
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="previewUrl" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Preview URL
                </label>
                <input
                  id="previewUrl"
                  name="previewUrl"
                  type="url"
                  value={formData.previewUrl}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
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
                onChange={handleChange}
                placeholder="confidence, communication"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-white">Publish status</p>
                <p className="text-xs text-slate-400">
                  Switch to publish when the e-book is ready for the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStatusToggle}
                className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/40 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-[#F5D26A] hover:border-[#F5D26A]/70 hover:text-[#ffe28a]">
                {formData.status === "published" ? "Unpublish e-book" : "Publish e-book"}
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                File metadata:{" "}
                {fileMeta
                  ? `${fileMeta.name} · ${(fileMeta.size / 1024).toFixed(0)} KB`
                  : "No file info stored yet."}
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
          </motion.form>
        </section>
      </main>
    </div>
  );
};

export default EbookDetail;

