import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "../../../src/services/api/categories";
import { uploadImageToCloudinary } from "../../../src/utils/imageUpload";
import { FaPlus, FaTrash, FaEdit, FaChevronDown, FaUpload, FaImage } from "react-icons/fa";
import UploadProgress from "../../../src/components/UploadProgress";

const AdminCategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState(null);


    const [formData, setFormData] = useState({
        name: "",
        topHeading: "",
        mainHeading: "",
        subHeading: "",
        description: "",
        bannerUrl: "",
    });

    const loadCategories = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch (error) {
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);
            setUploadError(null);
            const url = await uploadImageToCloudinary(file, "digital-aela/categories/banners", (progress) => {
                setUploadProgress(progress);
            });
            setFormData((prev) => ({ ...prev, bannerUrl: url }));
            toast.success("Banner uploaded successfully");
        } catch (error) {
            setUploadError(error.message);
            toast.error("Failed to upload banner");
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                setUploadError(null);
            }, 1500);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("Category name is required");
            return;
        }

        try {
            setIsSubmitting(true);
            if (isEditing) {
                await updateCategory(isEditing, formData);
                toast.success("Category updated successfully");
            } else {
                await createCategory(formData);
                toast.success("Category created successfully");
            }
            setIsModalOpen(false);
            setIsEditing(null);
            setFormData({
                name: "",
                topHeading: "",
                mainHeading: "",
                subHeading: "",
                description: "",
                bannerUrl: "",
            });
            loadCategories();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (category) => {
        setIsEditing(category._id);
        setFormData({
            name: category.name,
            topHeading: category.topHeading || "",
            mainHeading: category.mainHeading || "",
            subHeading: category.subHeading || "",
            description: category.description || "",
            bannerUrl: category.bannerUrl || "",
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this category? This might affect courses assigned to it.")) {
            try {
                await deleteCategory(id);
                toast.success("Category deleted");
                loadCategories();
            } catch (error) {
                toast.error("Failed to delete category");
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#05060D] text-white p-6">
            <SEO title="Manage Categories | Super Admin" />

            <div className="layout-container space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Course Categories
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Manage dynamic course categories and their page content.
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setIsEditing(null);
                            setFormData({
                                name: "",
                                topHeading: "",
                                mainHeading: "",
                                subHeading: "",
                                description: "",
                                bannerUrl: "",
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-[#F5D26A] text-black px-6 py-2.5 rounded-full font-bold shadow-[0_12px_40px_rgba(245,210,106,0.25)] hover:brightness-110 transition"
                    >
                        <FaPlus /> Add New Category
                    </motion.button>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-12 w-12 border-4 border-[#F5D26A]/20 border-t-[#F5D26A] rounded-full animate-spin" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-20 border border-white/10 rounded-3xl bg-white/5">
                        <p className="text-slate-400">No categories found. Add your first one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((category) => (
                            <motion.div
                                key={category._id}
                                layout
                                className="group relative bg-[#090D19] border border-white/10 rounded-3xl overflow-hidden hover:border-[#F5D26A]/30 transition-all duration-300"
                            >
                                <div className="h-32 bg-[#D4AF37]/5 relative">
                                    {category.bannerUrl ? (
                                        <img src={category.bannerUrl} alt={category.name} className="w-full h-full object-cover opacity-50" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-20">
                                            <FaImage size={40} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-[#090D19] via-[#090D19]/40 to-transparent" />
                                </div>

                                <div className="p-6 space-y-4">
                                    <h3 className="text-xl font-bold text-white group-hover:text-[#F5D26A] transition-colors">
                                        {category.name}
                                    </h3>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                                        >
                                            <FaEdit /> Edit Details
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category._id)}
                                            className="flex items-center gap-2 text-xs font-semibold text-red-400/70 hover:text-red-400 transition"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-2xl bg-[#090D19] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-white">
                                        {isEditing ? "Edit Category" : "Add New Category"}
                                    </h2>
                                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                                        &times;
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#F5D26A]/70">Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Data Science"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#F5D26A]/50 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#F5D26A]/70">Top Heading</label>
                                            <input
                                                type="text"
                                                name="topHeading"
                                                value={formData.topHeading}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Advanced Mastery"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#F5D26A]/50 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#F5D26A]/70">Main Heading</label>
                                            <input
                                                type="text"
                                                name="mainHeading"
                                                value={formData.mainHeading}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Master Data Science"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#F5D26A]/50 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#F5D26A]/70">Sub Heading</label>
                                            <input
                                                type="text"
                                                name="subHeading"
                                                value={formData.subHeading}
                                                onChange={handleInputChange}
                                                placeholder="e.g. From Zero to Hero"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#F5D26A]/50 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#F5D26A]/70">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Enter a brief description for the category page..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#F5D26A]/50 outline-none resize-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#F5D26A]/70">Banner Image</label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    name="bannerUrl"
                                                    value={formData.bannerUrl}
                                                    onChange={handleInputChange}
                                                    placeholder="Image URL or upload below"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#F5D26A]/50 outline-none"
                                                />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="banner-upload"
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                    accept="image/*"
                                                    disabled={isUploading}
                                                />
                                                <label
                                                    htmlFor="banner-upload"
                                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#F5D26A]/40 hover:bg-[#F5D26A]/5 cursor-pointer transition ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <FaUpload className="text-[#F5D26A]" />
                                                    <span className="text-xs font-bold">{isUploading ? "Uploading..." : "Upload"}</span>
                                                </label>
                                            </div>
                                        </div>
                                        {formData.bannerUrl && (
                                            <div className="mt-2 h-20 w-full rounded-xl overflow-hidden border border-white/5">
                                                <img src={formData.bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-6 py-2.5 rounded-full text-sm font-bold text-slate-400 hover:text-white transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || isUploading}
                                            className="bg-[#F5D26A] text-black px-8 py-2.5 rounded-full font-bold shadow-[0_12px_40px_rgba(245,210,106,0.2)] hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <UploadProgress
                isUploading={isUploading}
                progress={uploadProgress}
                fileName="Category Banner"
                error={uploadError}
            />
        </div>
    );
};

export default AdminCategoryManagement;
