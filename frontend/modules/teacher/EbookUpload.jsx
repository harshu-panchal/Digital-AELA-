import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { createTeacherEbook } from "../../src/services/teacherEbooks";
import { fetchCategories } from "../../src/services/api/categories";
import { safeString, sanitizeUrl } from "../../src/utils/registrationHelpers";
import { uploadImageToCloudinary } from "../../src/utils/imageUpload";

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
  coverImageFile: null,
  coverImagePreview: null,
  previewUrl: "",
  tags: "",
  pages: "",
  file: null,
  bookType: "ebook",
};

const EbookUpload = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [categories, setCategories] = useState([
    "English Language",
    "Digital Marketing",
    "Corporate Training",
    "Public Speaking",
    "IELTS & Test Prep",
    "Corporate Communication",
    "Leadership & Soft Skills",
    "Career Development",
    "Learn & Earn",
    "Other",
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        if (data && data.length > 0) {
          const fetchedNames = data.map((c) => c.name);
          // Combine defaults with fetched, removing duplicates
          setCategories((prev) => {
            const combined = [...new Set([...prev, ...fetchedNames])];
            return combined;
          });
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    loadCategories();
  }, []);

  const priceHelper = useMemo(
    () => ({
      price: "Set in AED. Leave blank to offer for free (0).",
    }),
    []
  );

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "coverImageFile" && files && files[0]) {
      const file = files[0];
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

      // Upload image
      setIsUploadingImage(true);
      uploadImageToCloudinary(file, "digital-aela/books/covers")
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

    if (name === "file") {
      const file = files?.[0];
      setFormData((prev) => ({
        ...prev,
        file: file ?? null,
      }));
      return;
    }

    // Clear file when switching from ebook to physical book
    if (name === "bookType" && value === "physical") {
      setFormData((prev) => ({
        ...prev,
        file: null,
      }));
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

    // PDF validation only required for e-books
    if (formData.bookType === "ebook") {
      if (!formData.file) {
        toast.error("Please attach your PDF file.");
        return;
      }

      const file = formData.file;
      if (file.type !== "application/pdf") {
        toast.error("Only PDF uploads are supported.");
        return;
      }

      // Validate file size (1GB limit)
      if (file.size > 1024 * 1024 * 1024) {
        toast.error("PDF file size must be less than 1GB");
        return;
      }
    }

    if (!formData.pages || formData.pages <= 0) {
      toast.error("Please enter the number of pages.");
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
      bookType: formData.bookType,
    };

    setIsSubmitting(true);
    try {
      // Upload PDF file along with metadata only for e-books
      const pdfFile = formData.bookType === "ebook" ? formData.file : null;
      const created = await createTeacherEbook(payload, pdfFile);
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

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Book Type*
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 cursor-pointer hover:border-[#F5D26A]/50 transition-colors">
                    <input
                      type="radio"
                      name="bookType"
                      value="ebook"
                      checked={formData.bookType === "ebook"}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#F5D26A] focus:ring-[#F5D26A]/30"
                    />
                    <span className="text-sm text-white">E-book</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 cursor-pointer hover:border-[#F5D26A]/50 transition-colors">
                    <input
                      type="radio"
                      name="bookType"
                      value="physical"
                      checked={formData.bookType === "physical"}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#F5D26A] focus:ring-[#F5D26A]/30"
                    />
                    <span className="text-sm text-white">Physical Book</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  Select whether this is an e-book (requires PDF upload) or a physical book (no PDF needed).
                </p>
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
                  className="w-full appearance-none rounded-xl border border-white/15 bg-[#0a0d19] px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  style={{ backgroundColor: '#0a0d19' }}>
                  <option value="" style={{ backgroundColor: '#0a0d19' }}>Select a category</option>
                  {categories.map((option) => (
                    <option key={option} value={option} style={{ backgroundColor: '#0a0d19' }}>
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
                <label htmlFor="coverImageFile" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  Cover Image
                </label>
                <div className="space-y-3">
                  <input
                    id="coverImageFile"
                    name="coverImageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
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
                  Optional: Upload a cover image for your e-book (max 1GB).
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

            {formData.bookType === "ebook" && (
              <section className="space-y-4">
                <header>
                  <h2 className="text-lg font-semibold text-white">Attach PDF</h2>
                  <p className="text-xs text-slate-400">
                    Upload the final PDF file. It will be automatically saved when you submit the form.
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
                    <p className="text-xs text-slate-400">Upload a PDF up to 1GB.</p>
                  )}
                </label>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                  The PDF will be saved when you submit the form. Maximum file size: 1GB.
                </div>
              </section>
            )}

            {formData.bookType === "physical" && (
              <section className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                  <p className="font-semibold text-[#F5D26A] mb-1">Physical Book Selected</p>
                  <p>No PDF upload is required for physical books. The book will be available for physical purchase or distribution.</p>
                </div>
              </section>
            )}

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

