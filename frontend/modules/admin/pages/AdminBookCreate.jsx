import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import { createEbook } from "../../../src/services/api/adminContent";

const AdminBookCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pages: "",
    downloadUrl: "",
    categories: "",
    isPublic: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createEbook({
        ...formData,
        pages: parseInt(formData.pages) || 0,
        categories: formData.categories.split(",").map((c) => c.trim()).filter(Boolean),
      });
      toast.success("Book created successfully");
      navigate("/super-admin");
    } catch (error) {
      toast.error(`Failed to create book: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Upload Book</h1>
        <p className="mt-2 text-sm text-gray-400">Add a new book to the platform</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none resize-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">Pages</label>
            <input
              type="number"
              value={formData.pages}
              onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">Download URL *</label>
            <input
              type="url"
              required
              value={formData.downloadUrl}
              onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">Categories (comma-separated)</label>
          <input
            type="text"
            value={formData.categories}
            onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
            placeholder="e.g., English, Business, Communication"
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="h-4 w-4 rounded border-white/10 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-300">
            Make public immediately
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/super-admin")}
            className="flex-1 rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50">
            {submitting ? (
              <>
                <FaSpinner className="mr-2 inline h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Book"
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default AdminBookCreate;

