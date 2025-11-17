import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import SEO from "../../src/components/SEO";
import {
  getVideo,
  updateVideoProgress,
  getVideoProgress,
} from "../../src/services/courseVideos";
import {
  FaPlay,
  FaLock,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
} from "react-icons/fa";

const CourseVideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [progress, setProgress] = useState({
    watchedDuration: 0,
    progressPercentage: 0,
    isCompleted: false,
  });
  const videoRef = useRef(null);
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const [videoResponse, progressResponse] = await Promise.all([
          getVideo(videoId),
          getVideoProgress(videoId).catch(() => ({ progress: null })),
        ]);

        setVideo(videoResponse.video);
        setHasAccess(videoResponse.hasAccess);

        if (progressResponse.progress) {
          setProgress({
            watchedDuration: progressResponse.progress.watchedDuration || 0,
            progressPercentage:
              progressResponse.progress.progressPercentage || 0,
            isCompleted: progressResponse.progress.isCompleted || false,
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load video");
        if (err.code === "FORBIDDEN") {
          toast.error(
            "You must be enrolled in this course to access this video"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }

    return () => {
      // Cleanup on unmount
      lastUpdateTime.current = 0;
    };
  }, [videoId]);

  // Handle video time update and progress tracking
  const handleTimeUpdate = async () => {
    if (!videoRef.current || !hasAccess) return;

    const currentTime = Math.floor(videoRef.current.currentTime);
    const totalDuration = Math.floor(
      videoRef.current.duration || video?.duration || 0
    );

    if (currentTime > 0 && totalDuration > 0) {
      // Update progress every 5 seconds to avoid excessive API calls
      const now = Date.now();
      if (now - lastUpdateTime.current >= 5000 || currentTime === totalDuration) {
        lastUpdateTime.current = now;
        
        try {
          await updateVideoProgress(videoId, currentTime);
          const progressPercentage = Math.round(
            (currentTime / totalDuration) * 100
          );
          const isCompleted = progressPercentage >= 90;

          setProgress({
            watchedDuration: currentTime,
            progressPercentage,
            isCompleted,
          });

          if (isCompleted && !progress.isCompleted) {
            toast.success("Video completed! 🎉");
          }
        } catch (error) {
          console.error("Failed to update progress:", error);
        }
      }
    }
  };

  // Resume video from last watched position
  const handleVideoLoaded = () => {
    if (
      videoRef.current &&
      progress.watchedDuration > 0 &&
      !progress.isCompleted
    ) {
      videoRef.current.currentTime = progress.watchedDuration;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060D] text-white">
        <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#05060D] text-white">
        <div className="layout-container pt-24 pb-20">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error || "Video not found"}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 rounded-lg bg-[#D4AF37] px-6 py-2 font-semibold text-black">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess && !video.isPreview) {
    return (
      <div className="min-h-screen bg-[#05060D] text-white">
        <SEO
          title={`${video.title} | Digital AELA`}
          description={video.description}
        />
        <div className="layout-container pt-24 pb-20">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white">
            <FaArrowLeft />
            Go Back
          </button>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 to-black">
              <FaLock className="mb-4 h-16 w-16 text-[#D4AF37]" />
              <h2 className="mb-2 text-2xl font-bold">{video.title}</h2>
              <p className="mb-6 text-slate-400">
                You must be enrolled in this course to access this video
              </p>
              <button
                onClick={() =>
                  navigate(`/courses/${video.course._id || video.course}`)
                }
                className="rounded-lg bg-[#D4AF37] px-6 py-3 font-semibold text-black hover:bg-[#E5C158]">
                Enroll Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`${video.title} | Digital AELA`}
        description={video.description}
      />

      <div className="layout-container pt-24 pb-20">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white">
          <FaArrowLeft />
          Go Back
        </button>

        <div className="space-y-6">
          {/* Video Player */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              src={video.videoUrl}
              controls
              className="h-full w-full"
              poster={video.thumbnailUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleVideoLoaded}>
              Your browser does not support the video tag.
            </video>

            {/* Progress Indicator */}
            {progress.progressPercentage > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-[#D4AF37] transition-all duration-300"
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{video.title}</h1>
              {video.description && (
                <p className="mt-2 text-slate-300">{video.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              {video.duration > 0 && (
                <span>Duration: {formatDuration(video.duration)}</span>
              )}
              {progress.progressPercentage > 0 && (
                <span className="flex items-center gap-2">
                  <span>Progress: {progress.progressPercentage}%</span>
                  {progress.isCompleted && (
                    <FaCheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </span>
              )}
              {video.isPreview && (
                <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-[#D4AF37]">
                  Preview
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
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

export default CourseVideoPlayer;

