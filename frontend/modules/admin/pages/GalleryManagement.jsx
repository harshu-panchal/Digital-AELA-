import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaImages, FaTrash, FaUpload, FaSpinner } from "react-icons/fa";
import {
  getAdminGalleryImages,
  uploadGalleryImage,
  deleteGalleryImage,
} from "../../../src/services/api/gallery";
import UploadProgress from "../../../src/components/UploadProgress";

const GalleryManagement = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadingFileName, setUploadingFileName] = useState("");

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await getAdminGalleryImages(1, 100);
      setImages(response.data || []);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      toast.error("Failed to load gallery images");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (files) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadingFileName(file.name);

      const response = await uploadGalleryImage(file, (progress) => {
        setUploadProgress(progress);
      });
      toast.success("Image uploaded successfully");
      await fetchImages(); // Refresh the list
    } catch (error) {
      console.error("Error uploading image:", error);
      const msg = error?.message || "Failed to upload image. Please try again.";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      // Delay hiding progress bar
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadError(null);
      }, 1500);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteGalleryImage(id);
      toast.success("Image deleted successfully");
      await fetchImages(); // Refresh the list
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Gallery Management
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Upload and manage gallery images for the website
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0B0F1E]/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 sm:p-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition ${dragActive
            ? "border-[#F5D26A] bg-[#F5D26A]/10"
            : "border-white/20 hover:border-white/30"
            }`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="gallery-upload"
            disabled={uploading}
          />
          <label
            htmlFor="gallery-upload"
            className={`cursor-pointer flex flex-col items-center gap-4 ${uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}>
            {uploading ? (
              <>
                <FaSpinner className="text-4xl sm:text-5xl text-[#F5D26A] animate-spin" />
                <div>
                  <p className="text-white font-semibold text-sm sm:text-base">
                    Uploading...
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Please wait
                  </p>
                </div>
              </>
            ) : (
              <>
                <FaUpload className="text-4xl sm:text-5xl text-[#F5D26A]" />
                <div>
                  <p className="text-white font-semibold text-sm sm:text-base">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    PNG, JPG, GIF
                  </p>
                </div>
              </>
            )}
          </label>
        </div>
      </motion.div>

      <UploadProgress
        isUploading={uploading}
        progress={uploadProgress}
        fileName={uploadingFileName}
        error={uploadError}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs sm:text-sm font-medium">
                Total Images
              </p>
              <p className="text-white text-2xl sm:text-3xl font-bold mt-2">
                {images.length}
              </p>
            </div>
            <FaImages className="text-white/20 text-3xl sm:text-4xl" />
          </div>
        </motion.div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5D26A]/30 border-t-[#F5D26A]" />
        </div>
      ) : images.length === 0 ? (
        <div className="bg-[#0B0F1E]/95 backdrop-blur-xl rounded-xl border border-white/10 p-8 sm:p-12 text-center">
          <FaImages className="text-5xl sm:text-6xl text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-sm sm:text-base">
            No images uploaded yet. Upload your first image to get started.
          </p>
        </div>
      ) : (
        <div className="bg-[#0B0F1E]/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white mb-4 sm:mb-6">
            Uploaded Images ({images.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#060606] hover:border-[#F5D26A]/50 transition">
                <img
                  src={image.imageUrl}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(image.id)}
                    disabled={deletingId === image.id}
                    className="opacity-0 group-hover:opacity-100 transition p-2 bg-red-500/80 hover:bg-red-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    {deletingId === image.id ? (
                      <FaSpinner className="text-white animate-spin" />
                    ) : (
                      <FaTrash className="text-white" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;
