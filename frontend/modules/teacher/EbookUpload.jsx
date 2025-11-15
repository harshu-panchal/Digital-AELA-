import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { createTeacherEbook } from "../../src/services/teacherEbooks";
import { safeString, sanitizeUrl } from "../../src/utils/registrationHelpers";

const sectionVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const initialFormState = {
  title: "",
  subtitle: "",
  description: "",
  price: "",
  category: "",
  coverImage: "",
  previewUrl: "",
  tags: "",
  pages: "",
  file: null,
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

const EbookUpload = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const priceHelper = useMemo(
    () => ({
      price: "Set in AED. Leave blank to offer for free (0).",
    }),
    []
  );

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "file") {
      const file = files?.[0];
      setFormData((prev) => ({
        ...prev,
        file: file ?? null,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanedTitle = safeString(formData.title);
    const cleanedDescription = safeString(formData.description);

    if (!cleanedTitle) {
      toast.error("E-book title is required.");
      return;
    }

    if (!cleanedDescription || cleanedDescription.length < 40) {
      toast.error("Please provide a description of at least 40 characters.");
      return;
    }

    if (!formData.file) {
      toast.error("Please attach your PDF file.");
      return;
    }

    const file = formData.file;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF uploads are supported at this stage.");
      return;
    }

    // For now, we'll use the previewUrl or coverImage as downloadUrl
    // In production, you'd upload the file to a storage service (S3, etc.) and get the URL
    const downloadUrl = sanitizeUrl(formData.previewUrl) || sanitizeUrl(formData.coverImage) || "";

    if (!downloadUrl) {
      toast.error("Please provide a download URL or preview URL for the ebook file.");
      return;
    }

    const payload = {
      title: cleanedTitle,
      subtitle: safeString(formData.subtitle),
      description: cleanedDescription,
      price: formData.price ? Number(formData.price) : 0,
      category: safeString(formData.category) || "Uncategorised",
      coverImage: sanitizeUrl(formData.coverImage),
      previewUrl: sanitizeUrl(formData.previewUrl),
      tags: safeString(formData.tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      pages: formData.pages ? Number(formData.pages) : undefined,
      downloadUrl: downloadUrl,
      // Note: In production, you'd upload the file and get the URL
      // For now, using previewUrl or coverImage as downloadUrl placeholder
    };

    setIsSubmitting(true);
    try {
      const created = await createTeacherEbook(payload);
      toast.success("E-book submitted for approval. It will be reviewed by admin before being published.");
      setFormData(initialFormState);
      navigate("/teacher/dashboard", { replace: true, state: { highlightEbooks: true, ebookId: created.id } });
    } catch (error) {
      const message = (error?.details?.error?.message || error?.message) ?? "Unable to save e-book. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title="Upload E-book | Digital AELA Teacher Portal"
        description="Upload your PDF resources, add metadata, and prepare them for sale on Digital AELA."
        keywords="teacher ebook upload, digital aela, mentor portal"
        url="https://digitalaela.com/teacher/ebooks/upload"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,210,106,0.15),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20">
        <section className="layout-container space-y-8">
          <header className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/30 bg-[#F5D26A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]">
              E-book Publisher
            </span>
            <h1 className="text-2xl font-semibold md:text-3xl">Upload a new e-book</h1>
            <p className="text-sm text-slate-300/80 md:max-w-2xl">
              Fill in the details, attach your PDF, and save as draft. Publishing is enabled once reviews and backend storage are in place.
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
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Title*
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Confidence Blueprint"
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
                  onChange={handleInputChange}
                  placeholder="Exercises and rituals to own every stage"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
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
                  onChange={handleInputChange}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                  <option value="">Select a category</option>
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
                  onChange={handleInputChange}
                  placeholder="149"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <p className="text-[11px] text-slate-400">{priceHelper.price}</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pages" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Number of Pages*
                </label>
                <input
                  id="pages"
                  name="pages"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.pages}
                  onChange={handleInputChange}
                  placeholder="250"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  required
                />
                <p className="text-[11px] text-slate-400">Enter the total number of pages in the e-book</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Outline what the e-book covers, the transformation learners can expect, and who will benefit most."
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  required
                />
              </div>

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
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <p className="text-[11px] text-slate-400">
                  Optional: Provide a public cover image URL for storefronts.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="previewUrl" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Preview link
                </label>
                <input
                  id="previewUrl"
                  name="previewUrl"
                  type="url"
                  value={formData.previewUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <p className="text-[11px] text-slate-400">
                  Optional: Link to a sample preview or landing page.
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="tags" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Tags
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="confidence, communication, storytelling"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                />
                <p className="text-[11px] text-slate-400">
                  Separate tags with commas. Helps learners discover your e-book.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <header>
                <h2 className="text-lg font-semibold text-white">Attach PDF</h2>
                <p className="text-xs text-slate-400">
                  Upload the final PDF. Actual storage will connect to backend later; we keep metadata for now.
                </p>
              </header>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-sm text-slate-300 hover:border-[#F5D26A]/50 hover:text-white">
                <span className="text-xs uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Drop PDF here or click to browse
                </span>
                <input
                  type="file"
                  name="file"
                  accept=".pdf"
                  onChange={handleInputChange}
                  className="hidden"
                />
                {formData.file ? (
                  <div className="text-xs text-slate-300">
                    Selected: <span className="font-semibold text-white">{formData.file.name}</span>{" "}
                    ({Math.round(formData.file.size / 1024)} KB)
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Upload a PDF up to 25 MB.</p>
                )}
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                Note: The PDF is not permanently uploaded yet. We store its name and size so the backend can request the
                actual file later.
              </div>
            </section>

            <footer className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Save as draft for now—publishing will be available once backend approvals are connected.
              </p>
              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5D26A] px-6 py-2.5 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(245,210,106,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? "Saving..." : "Save e-book"}
              </motion.button>
            </footer>
          </motion.form>
        </section>
      </main>
    </div>
  );
};

export default EbookUpload;

