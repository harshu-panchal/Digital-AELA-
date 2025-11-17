import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  getCourseVideos,
  getCourseProgress,
} from "../../src/services/courseVideos";
import { FaPlay, FaLock, FaSpinner, FaCheckCircle, FaVideo } from "react-icons/fa";

const CourseVideosList = ({ courseId }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Videos list is always accessible (shows locked for non-enrolled)
        const videosResponse = await getCourseVideos(courseId).catch(() => ({
          videos: [],
          hasAccess: false,
        }));

        setVideos(videosResponse.videos || []);
        const userHasAccess = videosResponse.hasAccess || false;
        setHasAccess(userHasAccess);

        // Progress is only available for enrolled students
        // Only fetch progress if user has access to avoid unnecessary 403 errors
        if (userHasAccess) {
          try {
            const progressResponse = await getCourseProgress(courseId);
            setCourseProgress(progressResponse);
          } catch (error) {
            // Progress not available - should not happen if hasAccess is true
            // But handle gracefully just in case
            if (error.status !== 403) {
              // Only log unexpected errors
              console.error("Failed to load course progress:", error);
            }
            setCourseProgress(null);
          }
        } else {
          // User doesn't have access, so no progress to fetch
          setCourseProgress(null);
        }
      } catch (error) {
        // Don't show error if user is not enrolled (expected behavior)
        if (error.status !== 403 && error.status !== 404) {
          console.error("Failed to load course videos:", error);
          // Still show empty state instead of error
          setVideos([]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#090D19]/95 p-6 text-center text-slate-400">
        No videos available for this course yet.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaVideo className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="text-xl font-semibold">Course Videos</h2>
        </div>
        {courseProgress && (
          <div className="text-sm text-slate-400">
            <span className="font-semibold text-[#D4AF37]">
              {courseProgress.course.courseProgressPercentage}%
            </span>{" "}
            Complete ({courseProgress.course.completedVideos}/
            {courseProgress.course.totalVideos} videos)
          </div>
        )}
        {!hasAccess && videos.length > 0 && (
          <div className="text-xs text-slate-400">
            <span className="text-[#D4AF37]">Enroll to access videos</span>
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      {courseProgress && (
        <div className="rounded-lg border border-white/10 bg-[#090D19]/95 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-300">Course Progress</span>
            <span className="font-semibold text-[#D4AF37]">
              {courseProgress.course.courseProgressPercentage}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-[#D4AF37]"
              initial={{ width: 0 }}
              animate={{
                width: `${courseProgress.course.courseProgressPercentage}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
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
                <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#090D19]/95 p-4 opacity-60">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700/20">
                    <FaLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-400">{video.title}</h3>
                    {video.description && (
                      <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                        {video.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                      {video.duration > 0 && (
                        <span>{formatDuration(video.duration)}</span>
                      )}
                      <span className="text-red-400">Locked - Enroll to access</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to={`/courses/videos/${video._id}`}
                  className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#090D19]/95 p-4 transition hover:border-[#D4AF37]/50 hover:bg-[#090D19]">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20">
                    {isCompleted ? (
                      <FaCheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <FaPlay className="h-5 w-5 text-[#D4AF37]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{video.title}</h3>
                      {isCompleted && (
                        <FaCheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      {video.isPreview && (
                        <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D4AF37]">
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
                      {videoProgress && videoProgress.progressPercentage > 0 && (
                        <span className="text-[#D4AF37]">
                          {videoProgress.progressPercentage}% watched
                        </span>
                      )}
                      {video.isPreview && (
                        <span className="text-[#D4AF37]">Preview</span>
                      )}
                    </div>
                    {/* Video Progress Bar */}
                    {videoProgress && videoProgress.progressPercentage > 0 && (
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
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
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

export default CourseVideosList;

