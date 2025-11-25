import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaStar,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaEyeSlash,
  FaImage,
  FaTimes,
} from "react-icons/fa";
import {
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialStatus,
} from "../../../src/services/api/testimonials";

const TestimonialManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    section: "",
    search: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    text: "",
    rating: 5,
    section: "home",
    status: "published",
    displayOrder: 0,
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load testimonials
  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const response = await getAdminTestimonials(
        pagination.page,
        pagination.pageSize,
        filters
      );
      setTestimonials(response.testimonials || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load testimonials");
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, [pagination.page, filters.status, filters.section, filters.search]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingTestimonial(null);
    setFormData({
      name: "",
      role: "",
      text: "",
      rating: 5,
      section: "home",
      status: "published",
      displayOrder: 0,
      avatar: "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name || "",
      role: testimonial.role || "",
      text: testimonial.text || "",
      rating: testimonial.rating || 5,
      section: testimonial.section || "home",
      status: testimonial.status || "published",
      displayOrder: testimonial.displayOrder || 0,
      avatar: testimonial.avatar || "",
    });
    setAvatarFile(null);
    setAvatarPreview(testimonial.avatar || null);
    setShowModal(true);
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove avatar
  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar: "" }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingTestimonial) {
        await updateTestimonial(editingTestimonial._id, formData, avatarFile);
        toast.success("Testimonial updated successfully");
      } else {
        await createTestimonial(formData, avatarFile);
        toast.success("Testimonial created successfully");
      }
      setShowModal(false);
      loadTestimonials();
    } catch (error) {
      toast.error(error.message || "Failed to save testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) {
      return;
    }

    try {
      await deleteTestimonial(id);
      toast.success("Testimonial deleted successfully");
      loadTestimonials();
    } catch (error) {
      toast.error(error.message || "Failed to delete testimonial");
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (testimonial) => {
    const newStatus = testimonial.status === "published" ? "draft" : "published";
    try {
      await toggleTestimonialStatus(testimonial._id, newStatus);
      toast.success(
        `Testimonial ${newStatus === "published" ? "published" : "drafted"} successfully`
      );
      loadTestimonials();
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  // Get section label
  const getSectionLabel = (section) => {
    const labels = {
      home: "Home",
      "success-stories": "Success Stories",
      both: "Both",
    };
    return labels[section] || section;
  };

  return (
    <div className="min-h-screen bg-[#0B0F1E] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#F5D26A] mb-2">
            Testimonial Management
          </h1>
          <p className="text-gray-400">
            Manage student testimonials displayed on the website
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#F5D26A] text-black rounded-lg hover:bg-[#D4AF37] transition">
            <FaPlus />
            <span>Add Testimonial</span>
          </button>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#F5D26A]"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]">
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange("section", e.target.value)}
              className="px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]">
              <option value="">All Sections</option>
              <option value="home">Home</option>
              <option value="success-stories">Success Stories</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        {/* Testimonials List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5D26A]"></div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No testimonials found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 hover:border-[#F5D26A]/50 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {testimonial.avatar && (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#F5D26A]/50"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate">
                        {testimonial.name}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusToggle(testimonial)}
                      className="p-2 hover:bg-white/10 rounded transition"
                      title={testimonial.status === "published" ? "Hide" : "Show"}>
                      {testimonial.status === "published" ? (
                        <FaEye className="text-green-400" />
                      ) : (
                        <FaEyeSlash className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`text-sm ${
                        i < testimonial.rating
                          ? "text-[#F5D26A]"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-gray-300 mb-4 line-clamp-3">
                  {testimonial.text}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs px-2 py-1 bg-[#F5D26A]/20 text-[#F5D26A] rounded">
                    {getSectionLabel(testimonial.section)}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      testimonial.status === "published"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}>
                    {testimonial.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(testimonial)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#F5D26A]/20 text-[#F5D26A] rounded hover:bg-[#F5D26A]/30 transition">
                    <FaEdit />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial._id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition">
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#F5D26A] transition">
              Previous
            </button>
            <span className="text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages, prev.page + 1),
                }))
              }
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#F5D26A] transition">
              Next
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#F5D26A]">
                  {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded transition">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-[#0B0F1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role/Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role: e.target.value }))
                    }
                    placeholder="e.g., Digital Marketing Student"
                    className="w-full px-4 py-2 bg-[#0B0F1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Testimonial Text *
                  </label>
                  <textarea
                    required
                    value={formData.text}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, text: e.target.value }))
                    }
                    rows={4}
                    className="w-full px-4 py-2 bg-[#0B0F1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rating *
                    </label>
                    <select
                      required
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rating: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 bg-[#0B0F1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num} Star{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Section *
                    </label>
                    <select
                      required
                      value={formData.section}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          section: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-[#0B0F1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]">
                      <option value="home">Home</option>
                      <option value="success-stories">Success Stories</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-[#0B0F1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOrder: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 bg-[#0B0F1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Avatar Image
                  </label>
                  {avatarPreview ? (
                    <div className="relative mb-2">
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-[#F5D26A]/50"
                      />
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition">
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  ) : null}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0B0F1E] border border-white/10 rounded-lg cursor-pointer hover:border-[#F5D26A] transition">
                    <FaImage />
                    <span>{avatarPreview ? "Change Image" : "Upload Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-[#F5D26A] text-black rounded-lg hover:bg-[#D4AF37] transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting
                      ? "Saving..."
                      : editingTestimonial
                      ? "Update"
                      : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg hover:bg-white/5 transition">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialManagement;

