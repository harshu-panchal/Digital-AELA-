import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { createModule } from "../../src/services/courseModules";
import { FaUpload, FaTimes, FaSpinner, FaFile } from "react-icons/fa";
import UploadProgress from "../../src/components/UploadProgress";

const ModuleUpload = ({ courseId, onModuleUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadingFileName, setUploadingFileName] = useState("");

  // Allowed file types
  const allowedFileTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Audio
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    // Video
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Validate files
    const validFiles = [];
    for (const file of files) {
      // Validate file type
      if (!allowedFileTypes.includes(file.type)) {
        toast.error(`${file.name} has invalid file type`);
        continue;
      }

      validFiles.push(file);
    }

    // Add to selected files
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getFileTypeIcon = (mimeType) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("wordprocessingml"))
      return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheetml"))
      return "📊";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentationml"))
      return "📊";
    return "📎";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a module title");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadingFileName(selectedFiles.length > 1 ? `${selectedFiles.length} files` : selectedFiles[0]?.name || "Module files");

    try {
      await createModule(courseId, formData, selectedFiles, (progress) => {
        setUploadProgress(progress);
      });

      toast.success("Module created successfully!");
      setSelectedFiles([]);
      setFormData({
        title: "",
        description: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onModuleUploaded) {
        onModuleUploaded();
      }
    } catch (error) {
      setUploadError(error.message);
      toast.error(error.message || "Failed to create module");
    } finally {
      // Delay hiding progress bar to show 100% completion
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadError(null);
      }, 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-xl border border-white/10 bg-[#090D19]/95 p-6">
      <div className="mb-4 flex items-center gap-2">
        <FaFile className="h-5 w-5 text-[#F5D26A]" />
        <h3 className="text-lg font-semibold">Create Course Module</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
            Module Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter module title"
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
            placeholder="Enter module description (optional)"
            rows={3}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
            Files (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,audio/*,video/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-slate-400">
            Supported: PDF, Images, Audio (MP3, WAV, OGG), Documents (Word,
            Excel, PowerPoint), Videos (MP4, MOV, AVI, WebM). Unlimited size.
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/80">
              Selected Files ({selectedFiles.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">
                      {getFileTypeIcon(file.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-400 hover:text-red-300 transition"
                    disabled={isUploading}>
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !formData.title.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-black transition hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50">
          {isUploading ? (
            <>
              <FaSpinner className="animate-spin" />
              Creating Module...
            </>
          ) : (
            <>
              <FaUpload />
              Create Module
            </>
          )}
        </button>
      </form>

      <UploadProgress
        isUploading={isUploading}
        progress={uploadProgress}
        fileName={uploadingFileName}
        error={uploadError}
      />
    </motion.div>
  );
};

export default ModuleUpload;
