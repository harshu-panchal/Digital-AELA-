import { useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  deleteModule,
  updateModule,
  addFilesToModule,
  removeFileFromModule,
} from "../../src/services/courseModules";
import { FaEdit, FaTrash, FaFile, FaPlus, FaTimes, FaDownload } from "react-icons/fa";

const ModuleList = ({ modules, courseId, onModuleUpdated }) => {
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });
  const [addingFilesToModuleId, setAddingFilesToModuleId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getFileTypeIcon = (mimeType) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("wordprocessingml")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheetml")) return "📊";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentationml")) return "📊";
    return "📎";
  };

  const handleEdit = (module) => {
    setEditingModuleId(module._id);
    setEditForm({
      title: module.title || "",
      description: module.description || "",
    });
  };

  const handleSaveEdit = async (moduleId) => {
    if (!editForm.title.trim()) {
      toast.error("Module title cannot be empty");
      return;
    }

    try {
      await updateModule(moduleId, editForm);
      toast.success("Module updated successfully");
      setEditingModuleId(null);
      if (onModuleUpdated) {
        onModuleUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update module");
    }
  };

  const handleCancelEdit = () => {
    setEditingModuleId(null);
    setEditForm({ title: "", description: "" });
  };

  const handleDelete = async (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this module? All files will be deleted.")) {
      return;
    }

    try {
      await deleteModule(moduleId);
      toast.success("Module deleted successfully");
      if (onModuleUpdated) {
        onModuleUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete module");
    }
  };

  const handleAddFilesClick = (moduleId) => {
    setAddingFilesToModuleId(moduleId);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleAddFiles = async (moduleId) => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to add");
      return;
    }

    try {
      await addFilesToModule(moduleId, selectedFiles);
      toast.success("Files added successfully");
      setAddingFilesToModuleId(null);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onModuleUpdated) {
        onModuleUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Failed to add files");
    }
  };

  const handleRemoveFile = async (moduleId, fileIndex) => {
    if (!window.confirm("Are you sure you want to remove this file?")) {
      return;
    }

    try {
      await removeFileFromModule(moduleId, fileIndex);
      toast.success("File removed successfully");
      if (onModuleUpdated) {
        onModuleUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove file");
    }
  };

  if (!modules || modules.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
        No modules created yet. Use the form above to create your first module.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modules.map((module) => (
        <div
          key={module._id}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
          {editingModuleId === module._id ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Module title"
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
              />
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Description"
                rows={2}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#F5D26A]/70 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEdit(module._id)}
                  className="rounded-full border border-[#F5D26A]/60 bg-[#F5D26A]/20 px-3 py-1.5 text-xs font-semibold text-[#F5D26A] transition hover:bg-[#F5D26A]/30">
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/20">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {module.title}
                  </h4>
                  {module.description && (
                    <p className="text-xs text-slate-300 mb-2">
                      {module.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {module.files?.length || 0} file(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(module)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#F5D26A]/60 hover:text-[#F5D26A]">
                    <FaEdit className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(module._id)}
                    className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-400/70 hover:text-red-200">
                    <FaTrash className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {addingFilesToModuleId === module._id ? (
                <div className="mt-4 space-y-3 p-3 rounded-lg bg-black/30 border border-white/10">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,audio/*,video/*"
                    onChange={handleFileSelect}
                    className="block w-full text-xs text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-[#D4AF37] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black hover:file:bg-[#E5C158]"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="text-xs text-slate-300">
                      {selectedFiles.length} file(s) selected
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddFiles(module._id)}
                      className="rounded-full border border-[#F5D26A]/60 bg-[#F5D26A]/20 px-3 py-1.5 text-xs font-semibold text-[#F5D26A] transition hover:bg-[#F5D26A]/30">
                      Add Files
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingFilesToModuleId(null);
                        setSelectedFiles([]);
                      }}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/20">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {module.files && module.files.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {module.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm">{getFileTypeIcon(file.fileType)}</span>
                            <div className="flex-1 min-w-0">
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-white hover:text-[#F5D26A] truncate block">
                                {file.fileName}
                              </a>
                              <p className="text-xs text-slate-400">
                                {formatFileSize(file.fileSize)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={file.fileUrl}
                              download
                              className="text-slate-400 hover:text-[#F5D26A] transition">
                              <FaDownload className="h-3 w-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(module._id, index)}
                              className="text-red-400 hover:text-red-300 transition">
                              <FaTimes className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-400">
                      No files in this module
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddFilesClick(module._id)}
                    className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#F5D26A]/60 hover:text-[#F5D26A]">
                    <FaPlus className="h-3 w-3" />
                    Add Files
                  </button>
                </>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModuleList;

