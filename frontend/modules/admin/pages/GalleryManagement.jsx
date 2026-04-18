import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaImage,
  FaImages,
  FaLink,
  FaPlay,
  FaSpinner,
  FaTrash,
  FaUpload,
  FaVideo,
  FaTimes,
} from "react-icons/fa";
import {
  createGalleryLink,
  deleteGalleryImage,
  getAdminGalleryImages,
  uploadGalleryImage,
} from "../../../src/services/api/gallery";
import UploadProgress from "../../../src/components/UploadProgress";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

const getVideoEmbedUrl = (url = "") => {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/
  );
  if (youtubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return "";
};

const GalleryManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadMode, setUploadMode] = useState("file");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mediaType: "image",
    mediaUrl: "",
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await getAdminGalleryImages(1, 100);
      setItems(response.data || []);
    } catch (error) {
      console.error("Error fetching gallery media:", error);
      toast.error("Failed to load gallery media");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      mediaType: "image",
      mediaUrl: "",
    });
    setSelectedFiles([]);
    setUploadingFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleFileSelect = (files) => {
    const nextFiles = Array.from(files || []);
    if (nextFiles.length === 0) return;

    const invalidFile = nextFiles.find(
      (file) =>
        !file.type.startsWith("image/") && !file.type.startsWith("video/")
    );
    if (invalidFile) {
      toast.error("Please select image or video files only");
      return;
    }

    setSelectedFiles((currentFiles) => {
      const fileMap = new Map();
      currentFiles.forEach((file) => {
        fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      });
      nextFiles.forEach((file) => {
        fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      });
      return Array.from(fileMap.values());
    });
    setUploadingFileName(
      selectedFiles.length + nextFiles.length === 1
        ? nextFiles[0].name
        : `${selectedFiles.length + nextFiles.length} media files selected`
    );
    setFormData((current) => ({
      ...current,
      mediaType: nextFiles[0].type.startsWith("video/") ? "video" : "image",
    }));
  };

  const handleFileInputChange = (event) => {
    handleFileSelect(event.target.files);
    event.target.value = "";
  };

  const removeSelectedFile = (fileToRemove) => {
    setSelectedFiles((currentFiles) => {
      const remainingFiles = currentFiles.filter(
        (file) =>
          `${file.name}-${file.size}-${file.lastModified}` !==
          `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`
      );
      setUploadingFileName(
        remainingFiles.length === 1
          ? remainingFiles[0].name
          : remainingFiles.length > 1
            ? `${remainingFiles.length} media files selected`
            : ""
      );
      return remainingFiles;
    });
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (uploading) return;

    const title = formData.title.trim();
    const description = formData.description.trim();
    const mediaUrls = formData.mediaUrl
      .split(/[\n,]+/)
      .map((url) => url.trim())
      .filter(Boolean);

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    if (uploadMode === "file" && selectedFiles.length === 0) {
      toast.error("Please choose one or more image/video files");
      return;
    }

    if (uploadMode === "link" && mediaUrls.length === 0) {
      toast.error("Please enter one or more image/video links");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      if (uploadMode === "file") {
        await uploadGalleryImage(
          selectedFiles,
          (progress) => setUploadProgress(progress),
          {
            title,
            description,
            mediaType: formData.mediaType,
          }
        );
      } else {
        await createGalleryLink({
          title,
          description,
          mediaType: formData.mediaType,
          mediaUrls,
        });
      }

      toast.success("Gallery item added successfully");
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error("Error adding gallery item:", error);
      const msg = error?.message || "Failed to add gallery item";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadError(null);
      }, 800);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gallery item?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteGalleryImage(id);
      toast.success("Gallery item deleted successfully");
      await fetchItems();
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      toast.error("Failed to delete gallery item. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const getItemMedia = (item) =>
    Array.isArray(item.mediaItems) && item.mediaItems.length > 0
      ? item.mediaItems
      : [
          {
            url: item.imageUrl,
            mediaType: item.mediaType || "image",
            sourceType: item.sourceType || "upload",
          },
        ];

  const allMedia = items.flatMap(getItemMedia);
  const totalVideos = allMedia.filter((item) => item.mediaType === "video")
    .length;
  const totalImages = allMedia.length - totalVideos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Gallery Management
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Upload and manage AELA Gallery photos, videos, and media links.
          </p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-[#0B0F1E]/95 backdrop-blur-xl rounded-xl border border-[#F5D26A]/20 p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Add Gallery Photo / Video
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Add title and description, then upload a file or paste an
              image/video link.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                uploadMode === "file"
                  ? "bg-[#F5D26A] text-black"
                  : "text-gray-300 hover:text-white"
              }`}>
              <FaUpload className="h-3 w-3" />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("link")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                uploadMode === "link"
                  ? "bg-[#F5D26A] text-black"
                  : "text-gray-300 hover:text-white"
              }`}>
              <FaLink className="h-3 w-3" />
              Add Link
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            value={formData.title}
            onChange={(event) => handleFormChange("title", event.target.value)}
            placeholder="Title"
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#F5D26A]/70"
            disabled={uploading}
          />
          <select
            value={formData.mediaType}
            onChange={(event) =>
              handleFormChange("mediaType", event.target.value)
            }
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none transition focus:border-[#F5D26A]/70"
            disabled={uploading}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <textarea
            value={formData.description}
            onChange={(event) =>
              handleFormChange("description", event.target.value)
            }
            placeholder="Description"
            rows={4}
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#F5D26A]/70 md:col-span-2"
            disabled={uploading}
          />

          {uploadMode === "file" ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-8 text-center transition md:col-span-2 ${
                dragActive
                  ? "border-[#F5D26A] bg-[#F5D26A]/10"
                  : "border-[#F5D26A]/25 bg-black/30 hover:border-[#F5D26A]/60"
              }`}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileInputChange}
                className="hidden"
                id="gallery-upload"
                disabled={uploading}
              />
              <label
                htmlFor="gallery-upload"
                className={`cursor-pointer flex flex-col items-center gap-3 ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}>
                {formData.mediaType === "video" ? (
                  <FaVideo className="text-4xl text-[#F5D26A]" />
                ) : (
                  <FaImage className="text-4xl text-[#F5D26A]" />
                )}
                <span className="text-white font-semibold text-sm sm:text-base">
                  {selectedFiles.length === 0
                    ? "Choose images or videos"
                    : `${selectedFiles.length} file${
                        selectedFiles.length > 1 ? "s" : ""
                      } selected`}
                </span>
                <span className="text-gray-400 text-xs sm:text-sm">
                  Select more files anytime. New selections are added here.
                </span>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex max-w-full flex-wrap justify-center gap-2">
                    {selectedFiles.map((file) => (
                      <span
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
                        {file.name}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removeSelectedFile(file);
                          }}
                          className="rounded-full p-1 text-gray-400 transition hover:bg-white/10 hover:text-white"
                          aria-label={`Remove ${file.name}`}>
                          <FaTimes className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>
            </div>
          ) : (
            <textarea
              value={formData.mediaUrl}
              onChange={(event) =>
                handleFormChange("mediaUrl", event.target.value)
              }
              placeholder="Paste one or more image/video URLs. Use a new line or comma for multiple links."
              rows={4}
              className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#F5D26A]/70 md:col-span-2"
              disabled={uploading}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5D26A] px-5 py-3 font-bold text-black transition hover:bg-[#ffe28a] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          {uploading ? (
            <>
              <FaSpinner className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FaUpload className="h-4 w-4" />
              Add to Gallery
            </>
          )}
        </button>
      </motion.form>

      <UploadProgress
        isUploading={uploading && uploadMode === "file"}
        progress={uploadProgress}
        fileName={uploadingFileName}
        error={uploadError}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs sm:text-sm font-medium">
                Total Media
              </p>
              <p className="text-white text-2xl sm:text-3xl font-bold mt-2">
                {allMedia.length}
              </p>
            </div>
            <FaImages className="text-white/20 text-3xl sm:text-4xl" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs sm:text-sm font-medium">
                Photos
              </p>
              <p className="text-white text-2xl sm:text-3xl font-bold mt-2">
                {totalImages}
              </p>
            </div>
            <FaImage className="text-white/20 text-3xl sm:text-4xl" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs sm:text-sm font-medium">
                Videos
              </p>
              <p className="text-white text-2xl sm:text-3xl font-bold mt-2">
                {totalVideos}
              </p>
            </div>
            <FaVideo className="text-white/20 text-3xl sm:text-4xl" />
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5D26A]/30 border-t-[#F5D26A]" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#0B0F1E]/95 backdrop-blur-xl rounded-xl border border-white/10 p-8 sm:p-12 text-center">
          <FaImages className="text-5xl sm:text-6xl text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-sm sm:text-base">
            No gallery media added yet. Add your first item to get started.
          </p>
        </div>
      ) : (
        <div className="bg-[#0B0F1E]/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white mb-4 sm:mb-6">
            Gallery Media ({items.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item, index) => {
              const mediaItems = getItemMedia(item);
              const firstMedia = mediaItems[0] || {};

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-[#060606] hover:border-[#F5D26A]/50 transition">
                  <div className="relative grid aspect-video grid-cols-2 gap-1 overflow-hidden bg-black p-1">
                    {mediaItems.slice(0, 4).map((mediaItem, mediaIndex) => {
                      const mediaUrl = getMediaUrl(
                        mediaItem.url || mediaItem.mediaUrl || mediaItem.image
                      );
                      const embedUrl =
                        mediaItem.mediaType === "video"
                          ? getVideoEmbedUrl(mediaUrl)
                          : "";

                      return (
                        <div
                          key={`${mediaUrl}-${mediaIndex}`}
                          className={`relative overflow-hidden rounded-md bg-black ${
                            mediaItems.length === 1 ? "col-span-2 row-span-2" : ""
                          }`}>
                          {mediaItem.mediaType === "video" ? (
                            embedUrl ? (
                              <iframe
                                src={embedUrl}
                                title={item.title || "Gallery video"}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={mediaUrl}
                                controls
                                className="h-full w-full object-cover"
                              />
                            )
                          ) : (
                            <img
                              src={mediaUrl}
                              alt={item.title || `Gallery ${index + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {mediaItem.mediaType === "video" && !embedUrl && (
                            <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/70 p-2 text-[#F5D26A]">
                              <FaPlay className="h-3 w-3" />
                            </div>
                          )}
                          {mediaIndex === 3 && mediaItems.length > 4 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-lg font-bold text-white">
                              +{mediaItems.length - 4}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="absolute right-3 top-3 rounded-lg bg-red-500/90 p-2 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete gallery item">
                      {deletingId === item.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F5D26A]">
                      {item.mediaType === "video" ? <FaVideo /> : <FaImage />}
                      {mediaItems.length} media item
                      {mediaItems.length > 1 ? "s" : ""}
                      {firstMedia.sourceType === "link" && (
                        <>
                          <span className="text-white/30">/</span>
                          <FaLink />
                          Link
                        </>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold text-white">
                      {item.title || "Untitled gallery item"}
                    </h3>
                    {item.description && (
                      <p className="line-clamp-3 text-xs leading-relaxed text-gray-400">
                        {item.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;
