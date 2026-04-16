import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaBook,
  FaExternalLinkAlt,
  FaImage,
  FaSave,
  FaSpinner,
} from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import {
  getAdminBookById,
  updateAdminBook,
} from "../../../src/services/api/adminContent";
import { getFeaturedBookCount } from "../../../src/services/api/resources";
import { uploadImageToCloudinary } from "../../../src/utils/imageUpload";
import { getMediaUrl } from "../../../src/utils/mediaUrl";
import { safeString, sanitizeUrl } from "../../../src/utils/registrationHelpers";

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

const initialFormState = {
  title: "",
  subtitle: "",
  author: "Digital AELA",
  description: "",
  price: "",
  category: "",
  coverImage: "",
  previewUrl: "",
  downloadUrl: "",
  pages: "",
  tags: "",
  isPublic: true,
  isFeatured: false,
  bookType: "ebook",
};

const AdminBookDetail = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [maxFeatured, setMaxFeatured] = useState(4);
  const [initialIsFeatured, setInitialIsFeatured] = useState(false);

  const canMarkFeatured = useMemo(() => {
    return (
      formData.isFeatured || initialIsFeatured || featuredCount < maxFeatured
    );
  }, [featuredCount, formData.isFeatured, initialIsFeatured, maxFeatured]);

  useEffect(() => {
    const loadBook = async () => {
      setLoading(true);
      try {
        const [bookData, featuredData] = await Promise.all([
          getAdminBookById(bookId),
          getFeaturedBookCount().catch(() => null),
        ]);

        const metadata = bookData.metadata || {};
        const bookType =
          metadata.bookType === "physical" || bookData.downloadUrl === "physical-book"
            ? "physical"
            : "ebook";

        const currentIsFeatured = metadata.isFeatured === true;

        setBook(bookData);
        setInitialIsFeatured(currentIsFeatured);
        setFormData({
          title: bookData.title || "",
          subtitle: metadata.subtitle || "",
          author: metadata.author || "Digital AELA",
          description: bookData.description || "",
          price:
            metadata.price !== undefined && metadata.price !== null
              ? metadata.price.toString()
              : "",
          category: bookData.categories?.[0] || "",
          coverImage: metadata.coverImage || "",
          previewUrl: metadata.previewUrl || "",
          downloadUrl:
            bookData.downloadUrl === "physical-book" ? "" : bookData.downloadUrl || "",
          pages: bookData.pages ? bookData.pages.toString() : "",
          tags: Array.isArray(metadata.tags) ? metadata.tags.join(", ") : "",
          isPublic: bookData.isPublic !== false,
          isFeatured: currentIsFeatured,
          bookType,
        });

        if (featuredData) {
          setFeaturedCount(featuredData.count || 0);
          setMaxFeatured(featuredData.maxAllowed || 4);
        }
      } catch (error) {
        toast.error(error.message || "Failed to load book details");
        navigate("/super-admin/content-management", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      loadBook();
    }
  }, [bookId, navigate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "bookType" && value === "physical") {
      setFormData((prev) => ({
        ...prev,
        bookType: value,
        downloadUrl: "",
      }));
      return;
    }

    if (name === "isFeatured" && checked && !canMarkFeatured) {
      toast.error(
        `Maximum of ${maxFeatured} featured books allowed. Unmark another featured book first.`
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingCover(true);
    try {
      const url = await uploadImageToCloudinary(file, "digital-aela/books/covers");
      setFormData((prev) => ({ ...prev, coverImage: url }));
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error(error.message || "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanedTitle = safeString(formData.title);
    const cleanedDescription = safeString(formData.description);

    if (!cleanedTitle) {
      toast.error("Book title is required");
      return;
    }

    if (!cleanedDescription || cleanedDescription.length < 40) {
      toast.error("Description must be at least 40 characters");
      return;
    }

    if (!formData.pages || Number(formData.pages) <= 0) {
      toast.error("Please enter a valid number of pages");
      return;
    }

    if (formData.bookType === "ebook" && !safeString(formData.downloadUrl)) {
      toast.error("Download URL is required for e-books");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: cleanedTitle,
        subtitle: safeString(formData.subtitle),
        author: safeString(formData.author) || "Digital AELA",
        description: cleanedDescription,
        price: formData.price === "" ? 0 : Number(formData.price),
        category: safeString(formData.category) || "Uncategorised",
        coverImage: sanitizeUrl(formData.coverImage),
        previewUrl: sanitizeUrl(formData.previewUrl),
        downloadUrl:
          formData.bookType === "physical"
            ? ""
            : sanitizeUrl(formData.downloadUrl),
        pages: Number(formData.pages),
        tags: safeString(formData.tags)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isPublic: formData.isPublic,
        isFeatured: formData.isFeatured,
        bookType: formData.bookType,
      };

      const updatedBook = await updateAdminBook(bookId, payload);
      setBook(updatedBook);
      toast.success("Book details updated");
      navigate("/super-admin/content-management");
    } catch (error) {
      toast.error(
        error?.details?.error?.message ||
          error.message ||
          "Failed to update book"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`Edit ${book?.title || "Book"} | Digital AELA Super Admin`}
        description="Edit book details in the Digital AELA super admin dashboard."
        keywords="admin book editor, digital aela"
        url={`https://digitalaela.com/super-admin/books/${bookId}`}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,210,106,0.14),transparent_68%)]" />

      <main className="relative z-10 pb-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link
                to="/super-admin/content-management"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition hover:text-[#E5C158]">
                <FaArrowLeft className="h-4 w-4" />
                Back to Content Management
              </Link>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-[#F5D26A]/80">
                Book Editor
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Edit book details
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Update the public book listing, pricing, discovery metadata,
                cover image, and e-book delivery links.
              </p>
            </div>

            <Link
              to={`/books/${bookId}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#F5D26A]/50 hover:text-[#F5D26A]">
              <FaExternalLinkAlt className="h-4 w-4" />
              View Public Page
            </Link>
          </header>

          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-5 rounded-3xl border border-white/10 bg-[#090D19]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {formData.coverImage ? (
                  <img
                    src={getMediaUrl(formData.coverImage)}
                    alt={formData.title || "Book cover"}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center">
                    <FaBook className="h-16 w-16 text-[#F5D26A]/60" />
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-sm font-semibold text-[#F5D26A] transition hover:bg-[#F5D26A]/15">
                {uploadingCover ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaImage />
                )}
                {uploadingCover ? "Uploading..." : "Upload Cover"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Visibility</p>
                <label className="mt-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#F5D26A] focus:ring-[#F5D26A]/30"
                  />
                  Show this book publicly
                </label>
                <label
                  className={`mt-3 flex items-start gap-3 ${
                    !formData.isPublic ? "opacity-50" : ""
                  }`}>
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    disabled={!formData.isPublic}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-[#F5D26A] focus:ring-[#F5D26A]/30 disabled:cursor-not-allowed"
                  />
                  <span>
                    Featured on home page
                    <span className="mt-1 block text-xs text-slate-500">
                      {featuredCount}/{maxFeatured} featured slots used
                    </span>
                  </span>
                </label>
              </div>
            </aside>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-[#090D19]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label
                    htmlFor="title"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Name*
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
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
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="author"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Author
                  </label>
                  <input
                    id="author"
                    name="author"
                    type="text"
                    value={formData.author}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Book Type*
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {[
                      { label: "E-book", value: "ebook" },
                      { label: "Physical Book", value: "physical" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 transition hover:border-[#F5D26A]/50">
                        <input
                          type="radio"
                          name="bookType"
                          value={option.value}
                          checked={formData.bookType === option.value}
                          onChange={handleChange}
                          className="h-4 w-4 text-[#F5D26A] focus:ring-[#F5D26A]/30"
                        />
                        <span className="text-sm text-white">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="price"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Price (INR)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pages"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Pages*
                  </label>
                  <input
                    id="pages"
                    name="pages"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.pages}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="category"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30">
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="tags"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Tags
                  </label>
                  <input
                    id="tags"
                    name="tags"
                    type="text"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="confidence, speaking, IELTS"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label
                    htmlFor="description"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={7}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="coverImage"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Cover Image URL
                  </label>
                  <input
                    id="coverImage"
                    name="coverImage"
                    type="url"
                    value={formData.coverImage}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="previewUrl"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                    Preview URL
                  </label>
                  <input
                    id="previewUrl"
                    name="previewUrl"
                    type="url"
                    value={formData.previewUrl}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                  />
                </div>

                {formData.bookType === "ebook" && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label
                      htmlFor="downloadUrl"
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
                      Download URL*
                    </label>
                    <input
                      id="downloadUrl"
                      name="downloadUrl"
                      type="url"
                      value={formData.downloadUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
                      required
                    />
                  </div>
                )}
              </div>

              <footer className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Changes update the public book detail page after saving.
                </p>
                <button
                  type="submit"
                  disabled={saving || uploadingCover}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5D26A] px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_60px_rgba(245,210,106,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {saving ? "Saving..." : "Save Book Details"}
                </button>
              </footer>
            </section>
          </motion.form>
        </div>
      </main>
    </div>
  );
};

export default AdminBookDetail;
