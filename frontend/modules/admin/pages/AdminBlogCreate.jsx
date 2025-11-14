import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import { createBlog } from "../../../src/services/api/adminContent";

const AdminBlogCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    status: "published",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createBlog(formData);
      toast.success("Blog posted successfully");
      navigate("/super-admin");
    } catch (error) {
      toast.error(`Failed to post blog: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Post Blog</h1>
        <p className="mt-2 text-sm text-gray-400">Create a new blog post</p>
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
          <label className="mb-2 block text-sm font-semibold text-gray-300">Excerpt</label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">Content *</label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={10}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">Cover Image URL</label>
          <input
            type="url"
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-300">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
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
                Posting...
              </>
            ) : (
              "Post Blog"
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default AdminBlogCreate;

