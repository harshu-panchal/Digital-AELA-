import { useState, useRef, useEffect } from "react";

/**
 * LazyVideo Component
 *
 * A component that lazy loads video content using Intersection Observer.
 * The video source is only loaded when it enters the viewport, improving
 * initial page load performance.
 *
 * @param {string} src - Video source URL
 * @param {string} poster - Poster image URL (shown before video loads)
 * @param {boolean} controls - Show video controls
 * @param {boolean} autoPlay - Auto-play video (should be muted for autoplay)
 * @param {boolean} muted - Mute video
 * @param {boolean} loop - Loop video
 * @param {string} className - Additional CSS classes
 * @param {function} onTimeUpdate - Callback for time update events
 * @param {function} onLoadedMetadata - Callback for metadata loaded events
 * @param {React.Ref} videoRef - Ref to video element
 * @param {object} ...props - Other video element props
 */
export function LazyVideo({
  src,
  poster,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  className = "",
  onTimeUpdate,
  onLoadedMetadata,
  videoRef: externalRef,
  ...props
}) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = useRef(null);
  const internalVideoRef = useRef(null);
  const videoRef = externalRef || internalVideoRef;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
            // Load video when it enters viewport
            setShouldLoad(true);
            // Optionally disconnect after first load
            observer.disconnect();
          }
        });
      },
      {
        // Start loading when video is 100px away from viewport
        rootMargin: "100px",
        threshold: 0.01,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle video load
  const handleLoadedMetadata = (e) => {
    if (onLoadedMetadata) {
      onLoadedMetadata(e);
    }
  };

  const handleTimeUpdate = (e) => {
    if (onTimeUpdate) {
      onTimeUpdate(e);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          preload="none"
          className={className}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          {...props}>
          Your browser does not support the video tag.
        </video>
      ) : (
        <div
          className={`relative ${className}`}
          style={{
            aspectRatio: "16/9",
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          {poster ? (
            <img
              src={poster}
              alt="Video poster"
              className="h-full w-full object-cover opacity-50"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center text-gray-400">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
          {!isInViewport && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-gray-400">
                Video will load when visible
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LazyVideo;
