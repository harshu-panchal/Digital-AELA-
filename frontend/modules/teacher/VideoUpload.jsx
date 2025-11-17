import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { uploadCourseVideo } from "../../src/services/courseVideos";
import { FaUpload, FaTimes, FaSpinner, FaVideo } from "react-icons/fa";

const VideoUpload = ({
  courseId,
  onVideoUploaded,
  existingVideosCount = 0,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: existingVideosCount,
    isPreview: false,
  });
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (500MB)
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video file size must be less than 500MB");
        return;
      }
      // Validate file type
      const allowedTypes = [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Please upload a valid video file (MP4, MOV, AVI, or WebM)"
        );
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ""),
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a video file");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Please enter a video title");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (actual progress would require XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      await uploadCourseVideo(courseId, selectedFile, formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Video uploaded successfully!");
      setSelectedFile(null);
      setFormData({
        title: "",
        description: "",
        order: existingVideosCount + 1,
        isPreview: false,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onVideoUploaded) {
        onVideoUploaded();
      }
    } catch (error) {
      toast.error(error.message || "Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-xl border border-white/10 bg-[#090D19]/95 p-6">
      <div className="mb-4 flex items-center gap-2">
        <FaVideo className="h-5 w-5 text-[#F5D26A]" />
        <h3 className="text-lg font-semibold">Upload Course Video</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
            Video File *
          </label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50"
            />
            {selectedFile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-red-400 hover:text-red-300 transition"
                disabled={isUploading}>
                <FaTimes className="h-5 w-5" />
              </button>
            )}
          </div>
          {selectedFile && (
            <p className="mt-2 text-xs text-slate-400">
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
            Video Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter video title"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
            required
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Enter video description (optional)"
            rows={3}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
            disabled={isUploading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
              Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  order: Number(e.target.value),
                }))
              }
              min={0}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
              disabled={isUploading}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="isPreview"
                checked={formData.isPreview}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPreview: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37]"
                disabled={isUploading}
              />
              <span className="text-sm text-slate-300">
                Make this a preview video (accessible without enrollment)
              </span>
            </label>
          </div>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-[#D4AF37]"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-black transition hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50">
          {isUploading ? (
            <>
              <FaSpinner className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload />
              Upload Video
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default VideoUpload;

