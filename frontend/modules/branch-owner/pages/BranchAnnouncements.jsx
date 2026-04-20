import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaBullhorn, FaSpinner, FaTrash } from "react-icons/fa";
import {
  createBranchAnnouncement,
  deleteBranchAnnouncement,
  fetchBranchAnnouncements,
} from "../../../src/services/api/branchOwner";

const initialForm = {
  title: "",
  content: "",
  audience: "all",
  priority: "normal",
  status: "published",
};

const BranchAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetchBranchAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      toast.error(error.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setSubmitting(true);
    try {
      await createBranchAnnouncement(formData);
      toast.success("Announcement created");
      setFormData(initialForm);
      loadAnnouncements();
    } catch (error) {
      toast.error(error.message || "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteBranchAnnouncement(announcementId);
      toast.success("Announcement deleted");
      loadAnnouncements();
    } catch (error) {
      toast.error(error.message || "Failed to delete announcement");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F5D26A]">
          Branch Communication
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Announcements</h1>
        <p className="mt-2 text-sm text-gray-400">
          Publish branch-level updates for teachers, students, or everyone.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white">
            <FaBullhorn className="text-[#F5D26A]" />
            Create Announcement
          </h2>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-200">Title</span>
              <input
                value={formData.title}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, title: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-200">Content</span>
              <textarea
                rows={5}
                value={formData.content}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, content: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-200">Audience</span>
                <select
                  value={formData.audience}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, audience: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
                  <option value="all">All branch members</option>
                  <option value="teachers">Teachers only</option>
                  <option value="students">Students only</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-200">Status</span>
                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
                  <option value="published">Publish now</option>
                  <option value="draft">Save draft</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#F5D26A] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#FFE28A] disabled:opacity-60">
              {submitting ? "Publishing..." : "Create Announcement"}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
          <h2 className="text-lg font-semibold text-white">Recent Announcements</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No announcements yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="rounded-xl border border-white/10 bg-[#111] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{announcement.title}</h3>
                      <p className="mt-2 text-sm text-gray-400">{announcement.content}</p>
                      <p className="mt-3 text-xs text-gray-500">
                        {announcement.targetAudience} - {announcement.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(announcement._id)}
                      className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30">
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchAnnouncements;
