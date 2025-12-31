import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCourseVideos,
  getCourseProgress,
} from "../../src/services/courseVideos";
import { getCourseModules } from "../../src/services/courseModules";
import LazyVideo from "../../src/components/LazyVideo";
import { getMediaUrl } from "../../src/utils/mediaUrl";
import {
  FaPlay,
  FaLock,
  FaSpinner,
  FaCheckCircle,
  FaVideo,
  FaFileAlt,
  FaFilePdf,
  FaFileImage,
  FaFileAudio,
  FaChevronDown,
  FaFolder,
  FaExternalLinkAlt,
} from "react-icons/fa";

const FileIcon = ({ type }) => {
  if (type.startsWith("video/"))
    return <FaVideo className="h-4 w-4 text-rose-400" />;
  if (type.startsWith("image/"))
    return <FaFileImage className="h-4 w-4 text-purple-400" />;
  if (type.startsWith("audio/"))
    return <FaFileAudio className="h-4 w-4 text-sky-400" />;
  if (type === "application/pdf")
    return <FaFilePdf className="h-4 w-4 text-red-400" />;
  return <FaFileAlt className="h-4 w-4 text-slate-400" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ModuleItem = ({
  module,
  index,
  isOpen,
  onToggle,
  onSelectFile,
  activeFileUrl,
}) => {
  const fileCount = module.files?.length || 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0E1C]/50 transition-all hover:border-white/20">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-white/5 px-5 py-4 text-left transition hover:bg-white/10">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400">
            <span className="text-sm font-bold">{index + 1}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{module.title}</h3>
              {fileCount > 0 && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                  {fileCount} {fileCount === 1 ? "file" : "files"}
                </span>
              )}
            </div>
            {module.description && (
              <p className="text-xs text-slate-400 line-clamp-1">
                {module.description}
              </p>
            )}
          </div>
        </div>
        <div
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}>
          <FaChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}>
            <div className="border-t border-white/5 bg-[#060A17]/30 px-2 py-2">
              {module.files && module.files.length > 0 ? (
                <div className="space-y-1">
                  {module.files.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        onSelectFile({
                          kind: "module-file",
                          url: getMediaUrl(file.fileUrl),
                          mime: file.fileType,
                          title: file.fileName,
                          description: module.title,
                          size: file.fileSize,
                        })
                      }
                      className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 transition hover:bg-white/5 ${
                        activeFileUrl === getMediaUrl(file.fileUrl)
                          ? "bg-white/5 ring-1 ring-inset ring-sky-500/20"
                          : ""
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 transition group-hover:bg-white/10">
                          <FileIcon type={file.fileType} />
                        </div>
                        <div className="min-w-0 text-left">
                          <p
                            className={`text-sm font-medium truncate ${
                              activeFileUrl === getMediaUrl(file.fileUrl)
                                ? "text-sky-400"
                                : "text-slate-200 group-hover:text-white"
                            }`}>
                            {file.fileName}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                              {file.fileType.split("/")[1]?.toUpperCase() ||
                                "FILE"}
                            </p>
                            {file.fileSize > 0 && (
                              <>
                                <span className="text-[10px] text-slate-700">
                                  •
                                </span>
                                <p className="text-[10px] text-slate-500">
                                  {formatFileSize(file.fileSize)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {activeFileUrl === getMediaUrl(file.fileUrl) && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10">
                            <div className="h-2 w-2 rounded-full bg-sky-400" />
                          </div>
                        )}
                        <FaExternalLinkAlt className="h-3 w-3 text-slate-600 opacity-0 transition group-hover:opacity-100 group-hover:text-sky-400" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-sm text-slate-500">
                  No files in this module.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CourseVideosList = ({ courseId }) => {
  const [videos, setVideos] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);
  const [openModuleIndex, setOpenModuleIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Modules
        const modulesResponse = await getCourseModules(courseId).catch(() => ({
          modules: [],
          hasAccess: false,
        }));
        setModules(modulesResponse.modules || []);

        // Fetch Videos (Standalone)
        const videosResponse = await getCourseVideos(courseId).catch(() => ({
          videos: [],
          hasAccess: false,
        }));
        setVideos(videosResponse.videos || []);

        const userHasAccess =
          videosResponse.hasAccess || modulesResponse.hasAccess || false;
        setHasAccess(userHasAccess);

        if (!selectedItem) {
          let defaultItem = null;
          for (const m of modulesResponse.modules || []) {
            const f = (m.files || []).find(
              (file) =>
                file.fileType?.startsWith("video/") ||
                file.fileType?.startsWith("image/")
            );
            if (f) {
              defaultItem = {
                kind: "module-file",
                url: getMediaUrl(f.fileUrl),
                mime: f.fileType,
                title: f.fileName,
                description: m.title,
                size: f.fileSize,
              };
              break;
            }
          }
          if (!defaultItem && (videosResponse.videos || []).length > 0) {
            const v = (videosResponse.videos || []).find(
              (vid) => !vid.isLocked && vid.videoUrl
            );
            if (v) {
              defaultItem = {
                kind: "course-video",
                url: getMediaUrl(v.videoUrl),
                mime: "video/*",
                title: v.title,
                description: v.description,
              };
            }
          }
          if (defaultItem) {
            setSelectedItem(defaultItem);
          }
        }

        // Progress is only available for enrolled students
        if (userHasAccess) {
          try {
            const progressResponse = await getCourseProgress(courseId);
            setCourseProgress(progressResponse);
          } catch (error) {
            if (error.status !== 403) {
              console.error("Failed to load course progress:", error);
            }
            setCourseProgress(null);
          }
        } else {
          setCourseProgress(null);
        }
      } catch (error) {
        if (error.status !== 403 && error.status !== 404) {
          console.error("Failed to load course content:", error);
          setVideos([]);
          setModules([]);
          setHasAccess(false);
        }
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  // Get progress for a specific video
  const getVideoProgress = (videoId) => {
    if (!courseProgress || !courseProgress.videos) return null;
    const videoProgress = courseProgress.videos.find(
      (v) => v.video._id === videoId
    );
    return videoProgress?.progress || null;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (videos.length === 0 && modules.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#090D19]/95 p-8 text-center">
        <FaFolder className="mx-auto mb-4 h-12 w-12 text-slate-700" />
        <p className="text-slate-400">
          No content available for this course yet.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-8">
      {selectedItem && (
        <div className="rounded-2xl border border-white/10 bg-[#0A0E1C]/80 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white truncate max-w-md">
                {selectedItem.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">
                  {selectedItem.mime?.startsWith("video/")
                    ? "Video Content"
                    : selectedItem.mime?.startsWith("image/")
                    ? "Image Resource"
                    : selectedItem.mime === "application/pdf"
                    ? "PDF Document"
                    : "Resource File"}
                </span>
                {selectedItem.size > 0 && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="text-xs text-slate-500">
                      {formatFileSize(selectedItem.size)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <a
              href={selectedItem.url}
              download={selectedItem.title}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
              <FaExternalLinkAlt className="h-3 w-3" />
              Download
            </a>
          </div>
          <div className="relative">
            {selectedItem.mime?.startsWith("video/") ||
            selectedItem.kind === "course-video" ? (
              <LazyVideo
                src={selectedItem.url}
                controls
                className="w-full rounded-xl"
              />
            ) : selectedItem.mime?.startsWith("image/") ? (
              <div className="flex items-center justify-center bg-black/60 rounded-xl overflow-hidden">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title || "Image"}
                  className="max-h-[70vh] w-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : selectedItem.mime === "application/pdf" ? (
              <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-[#060A17]/60">
                <iframe
                  src={`${selectedItem.url}#toolbar=0`}
                  className="h-full w-full"
                  title={selectedItem.title}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-xl border border-dashed border-white/10 bg-[#060A17]/60 text-slate-400">
                <FileIcon type={selectedItem.mime || ""} />
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">
                    Preview not available for this file type
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    You can still download it using the button above
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Course Progress Summary */}
      {courseProgress && (
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#0A0E1C]/80 p-6 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-white">Your Progress</h3>
            <p className="text-sm text-slate-400">Keep up the good work!</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Completed</span>
              <span className="font-semibold text-[#D4AF37]">
                {courseProgress.course.courseProgressPercentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-300"
                initial={{ width: 0 }}
                animate={{
                  width: `${courseProgress.course.courseProgressPercentage}%`,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modules Section */}
      {modules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FaFolder className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-xl font-semibold text-white">Course Modules</h2>
          </div>
          <div className="space-y-3">
            {modules.map((module, index) => (
              <ModuleItem
                key={module._id || index}
                module={module}
                index={index}
                isOpen={openModuleIndex === index}
                onToggle={() =>
                  setOpenModuleIndex(openModuleIndex === index ? -1 : index)
                }
                onSelectFile={(item) => setSelectedItem(item)}
                activeFileUrl={
                  selectedItem?.kind === "module-file" ? selectedItem.url : null
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Standalone Videos Section (if any) */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FaVideo className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-xl font-semibold text-white">
              Additional Videos
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-1">
            {videos.map((video) => {
              const videoProgress = getVideoProgress(video._id);
              const isCompleted = videoProgress?.isCompleted || false;
              const isLocked = video.isLocked && !hasAccess && !video.isPreview;

              return (
                <motion.div
                  key={video._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}>
                  {isLocked ? (
                    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0A0E1C]/50 p-4 opacity-60">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700/20">
                        <FaLock className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-400">
                          {video.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-600">
                          {video.duration > 0 && (
                            <span>{formatDuration(video.duration)}</span>
                          )}
                          <span>Locked</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setSelectedItem({
                          kind: "course-video",
                          url: getMediaUrl(video.videoUrl),
                          mime: "video/*",
                          title: video.title,
                          description: video.description,
                        })
                      }
                      className="group flex w-full items-center gap-4 rounded-xl border border-white/10 bg-[#0A0E1C]/50 p-4 transition hover:border-[#D4AF37]/50 hover:bg-[#0A0E1C]">
                      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10 transition group-hover:bg-[#D4AF37]/20">
                        {isCompleted ? (
                          <FaCheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <FaPlay className="h-4 w-4 text-[#D4AF37]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-slate-200 group-hover:text-white truncate">
                            {video.title}
                          </h3>
                          {video.isPreview && (
                            <span className="flex-shrink-0 rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D4AF37]">
                              Preview
                            </span>
                          )}
                        </div>
                        {video.description && (
                          <p className="mt-1 text-sm text-slate-400 line-clamp-1">
                            {video.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          {video.duration > 0 && (
                            <span>{formatDuration(video.duration)}</span>
                          )}
                          {videoProgress &&
                            videoProgress.progressPercentage > 0 && (
                              <span className="text-[#D4AF37]">
                                {videoProgress.progressPercentage}% watched
                              </span>
                            )}
                        </div>
                        {videoProgress &&
                          videoProgress.progressPercentage > 0 && (
                            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full bg-[#D4AF37] transition-all duration-300"
                                style={{
                                  width: `${videoProgress.progressPercentage}%`,
                                }}
                              />
                            </div>
                          )}
                      </div>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CourseVideosList;
