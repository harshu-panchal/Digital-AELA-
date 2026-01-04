import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Viewer,
  Worker,
  SpecialZoomLevel,
  ScrollMode,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { AnimatePresence, motion } from "framer-motion";
// Import worker file from pdfjs-dist
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  FaArrowLeft,
  FaArrowRight,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../../src/config/api.js";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

// Import styles - CSS is already lazy loaded since this component is lazy loaded at route level
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

const PDFEbookReader = () => {
  const { ebookId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [ebookData, setEbookData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPageTurning, setIsPageTurning] = useState(false);

  // Touch/swipe handling for page-turn animation
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const containerRef = useRef(null);
  const viewerContainerRef = useRef(null);

  // Configure plugins
  const pageNavigationPluginInstance = pageNavigationPlugin({
    enableShortcuts: true,
  });
  const { jumpToPage } = pageNavigationPluginInstance;

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    toolbarPlugin: {
      fullScreenPlugin: {
        onEnterFullScreen: () => {
          setIsFullscreen(true);
        },
        onExitFullScreen: () => {
          setIsFullscreen(false);
        },
      },
    },
  });

  // Fetch ebook data
  useEffect(() => {
    const fetchEbook = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/resources/ebooks/${ebookId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch ebook: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setEbookData(data);

        const processedPdfUrl = getMediaUrl(data.downloadUrl);
        setPdfUrl(processedPdfUrl);

        if (!data.downloadUrl) {
          throw new Error("PDF URL not found in ebook data");
        }

        // Validate PDF URL (use the processed absolute URL)
        try {
          const checkUrl = processedPdfUrl || data.downloadUrl;
          const urlLower = checkUrl.toLowerCase();
          const urlPath = urlLower.split("?")[0].split("#")[0];
          const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
          const hasImageExtension = imageExtensions.some((ext) => urlPath.endsWith(ext));
          const isCoverImage = urlLower.includes("/books/covers/") || urlLower.includes("/covers/") || urlLower.includes("/bookscovers/");

          if (hasImageExtension || isCoverImage) {
            const errorMessage = isCoverImage
              ? "Invalid PDF URL: This ebook's download URL points to an image file instead of the PDF. Please contact support."
              : "Invalid PDF URL: The ebook appears to have an image URL instead of a PDF file.";
            setError(errorMessage);
            toast.error(errorMessage);
            setLoading(false);
            return;
          }

          const pdfTestResponse = await fetch(checkUrl, {
            method: "HEAD",
          });
          const contentType = pdfTestResponse.headers.get("content-type");
          if (contentType) {
            const contentTypeLower = contentType.toLowerCase();
            if (contentTypeLower.includes("image/") && !contentTypeLower.includes("pdf")) {
              setError("Invalid PDF URL: The server returned an image instead of a PDF.");
              toast.error("The ebook URL points to an image file instead of a PDF.");
              setLoading(false);
              return;
            }
          }
        } catch (testError) {
          console.warn("Could not verify PDF URL:", testError.message);
        }

        // URL already set above with processed value
      } catch (err) {
        console.error("Error fetching ebook:", err);
        setError(err.message || "Failed to load ebook");
        toast.error(`Failed to load ebook: ${err.message}`);
        setLoading(false);
      }
    };

    if (ebookId) {
      fetchEbook();
    }
  }, [ebookId]);

  const onDocumentLoad = useCallback((e) => {
    setNumPages(e.doc.numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("PDF Load Error:", error);
    const errorMessage =
      error?.message ||
      "Failed to load PDF. Please check if the file is valid.";
    setError(errorMessage);
    setLoading(false);
    toast.error(`Failed to load PDF: ${errorMessage}`);
  }, []);

  // Track page changes by monitoring the toolbar and viewer
  useEffect(() => {
    if (!pdfUrl || loading) return;

    const updateCurrentPage = () => {
      // Method 1: Check toolbar page input
      const pageInput = document.querySelector('input[type="number"][min="1"]');
      if (pageInput) {
        const pageNum = parseInt(pageInput.value || "1");
        if (pageNum > 0) {
          const newPage = pageNum - 1; // Convert to 0-based
          if (newPage !== currentPage && newPage >= 0 && newPage < numPages) {
            setCurrentPage(newPage);
          }
        }
      }

      // Method 2: Check visible page elements
      const pageElements = document.querySelectorAll("[data-page-number]");
      if (pageElements.length > 0) {
        const visiblePage = Array.from(pageElements).find((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.top < window.innerHeight / 2;
        });
        if (visiblePage) {
          const pageNum = parseInt(
            visiblePage.getAttribute("data-page-number") || "0"
          );
          if (pageNum !== currentPage && pageNum >= 0) {
            setCurrentPage(pageNum);
          }
        }
      }
    };

    // Update immediately and on interval
    const timeout = setTimeout(updateCurrentPage, 500);
    const interval = setInterval(updateCurrentPage, 300);

    // Listen for changes in page input
    const handlePageChange = (e) => {
      if (e.target.type === "number" && e.target.getAttribute("min") === "1") {
        setTimeout(updateCurrentPage, 100);
      }
    };

    document.addEventListener("change", handlePageChange);
    document.addEventListener("input", handlePageChange);

    // Listen for scroll events (pages might change on scroll)
    const handleScroll = () => {
      setTimeout(updateCurrentPage, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener("change", handlePageChange);
      document.removeEventListener("input", handlePageChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pdfUrl, loading, numPages]);

  // Navigation functions that use the plugin's methods
  // Note: jumpToPage uses 0-based page index
  const goToNextPage = useCallback(() => {
    if (jumpToPage && numPages > 0) {
      // Get current page from DOM to ensure accuracy
      const pageInput = document.querySelector('input[type="number"][min="1"]');
      let actualCurrentPage = currentPage;
      if (pageInput) {
        const pageNum = parseInt(pageInput.value || "1");
        actualCurrentPage = pageNum - 1;
      }

      const nextPage = Math.min(numPages - 1, actualCurrentPage + 1);

      if (nextPage !== actualCurrentPage) {
        jumpToPage(nextPage);
        setCurrentPage(nextPage);
      }
    }
  }, [jumpToPage, currentPage, numPages]);

  const goToPreviousPage = useCallback(() => {
    if (jumpToPage) {
      // Get current page from DOM to ensure accuracy
      const pageInput = document.querySelector('input[type="number"][min="1"]');
      let actualCurrentPage = currentPage;
      if (pageInput) {
        const pageNum = parseInt(pageInput.value || "1");
        actualCurrentPage = pageNum - 1;
      }

      const prevPage = Math.max(0, actualCurrentPage - 1);

      if (prevPage !== actualCurrentPage) {
        jumpToPage(prevPage);
        setCurrentPage(prevPage);
      }
    }
  }, [jumpToPage, currentPage]);

  // Enhanced touch handlers with page-turn animation and navigation
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

    if (deltaX > deltaY && deltaX > 10) {
      isSwiping.current = true;
      touchEndX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current || !isSwiping.current) {
      touchStartX.current = 0;
      touchEndX.current = 0;
      isSwiping.current = false;
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance && jumpToPage) {
      const swipeDirection = distance > 0 ? 1 : -1;
      setDirection(swipeDirection);
      setIsPageTurning(true);

      // Trigger page turn animation
      if (viewerContainerRef.current) {
        viewerContainerRef.current.style.transform = `perspective(1000px) rotateY(${swipeDirection * -15
          }deg)`;
        viewerContainerRef.current.style.transition = "transform 0.4s ease-out";
      }

      // Navigate to next/previous page
      if (swipeDirection > 0) {
        // Swipe left - next page
        goToNextPage();
      } else {
        // Swipe right - previous page
        goToPreviousPage();
      }

      // Reset animation
      setTimeout(() => {
        if (viewerContainerRef.current) {
          viewerContainerRef.current.style.transform =
            "perspective(1000px) rotateY(0deg)";
          setTimeout(() => {
            setIsPageTurning(false);
            if (viewerContainerRef.current) {
              viewerContainerRef.current.style.transition = "";
            }
          }, 400);
        }
      }, 200);
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
    isSwiping.current = false;
  }, [goToNextPage, goToPreviousPage]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't prevent default for shortcuts that the plugin handles
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        setDirection(1);
        goToNextPage();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        setDirection(-1);
        goToPreviousPage();
      } else if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPreviousPage, toggleFullscreen]);

  // Add custom CSS for PDF viewer to ensure full page display
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .rpv-core__viewer {
        height: 100% !important;
        width: 100% !important;
      }
      .rpv-core__inner {
        width: 100% !important;
        height: 100% !important;
        display: flex !important;
        justify-content: center !important;
      }
      /* Vertical scroll mode styles */
      .rpv-core__viewer[data-scroll-mode="vertical"] .rpv-core__inner-pages {
        height: 100% !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }
      .rpv-core__viewer[data-scroll-mode="vertical"] .rpv-core__page-layer {
        align-items: center !important;
      }
      .rpv-core__viewer[data-scroll-mode="vertical"] .rpv-core__page {
        margin: 0 auto !important;
      }
      .rpv-core__viewer[data-scroll-mode="vertical"] .rpv-core__page canvas {
        margin: 0 auto !important;
      }
      /* Horizontal scroll mode styles */
      .rpv-core__viewer[data-scroll-mode="horizontal"] .rpv-core__inner {
        width: auto !important;
        min-width: 100% !important;
        justify-content: flex-start !important;
      }
      .rpv-core__viewer[data-scroll-mode="horizontal"] .rpv-core__inner-pages {
        width: auto !important;
        min-width: fit-content !important;
        height: 100% !important;
      }
      .rpv-core__viewer[data-scroll-mode="horizontal"] .rpv-core__page-layer {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: flex-start !important;
        justify-content: flex-start !important;
        width: auto !important;
        min-width: fit-content !important;
        height: 100% !important;
      }
      .rpv-core__viewer[data-scroll-mode="horizontal"] .rpv-core__page-layer > div {
        width: auto !important;
        flex-shrink: 0 !important;
        margin: 0 8px !important;
        display: block !important;
      }
      .rpv-core__viewer[data-scroll-mode="horizontal"] .rpv-core__page {
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
        display: block !important;
      }
      .rpv-core__viewer[data-scroll-mode="horizontal"] .rpv-core__page canvas {
        width: auto !important;
        height: auto !important;
        display: block !important;
        margin: 0 !important;
      }
    `;

    style.id = "pdf-viewer-custom-style";
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById("pdf-viewer-custom-style");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  if (error && !pdfUrl) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#04060F] px-6 text-center text-white">
        <div className="max-w-xl space-y-6 rounded-3xl border border-white/10 bg-white/5 px-10 py-12 backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-[#F5D26A]">
            Error Loading Ebook
          </h1>
          <p className="text-base text-slate-200/85">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/free-library")}
            className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/60 bg-[#F5D26A]/20 px-6 py-2.5 text-sm font-semibold text-[#F5D26A] transition-colors duration-300 hover:border-[#F5D26A]/90 hover:bg-[#F5D26A]/35">
            <FaArrowLeft /> Back to Library
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      className="relative min-h-screen bg-[#02040B] pb-16 md:pb-20 pt-24 md:pt-32 text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0d1325_0%,#02040B_60%,#010205_100%)] opacity-95" />

      <div className="relative layout-container flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/free-library")}
            className="inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-[#F5D26A] transition-all duration-300 hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
            <FaArrowLeft className="text-xs" />
            Back to library
          </button>

          {ebookData && (
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200/70">
              <span>{ebookData.metadata?.author || "Digital AELA"}</span>
              <span className="h-6 w-px bg-white/15" />
              <span>{numPages || ebookData.pages || 0} pages</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200/80 transition hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
              {isFullscreen ? (
                <FaCompress className="text-sm text-[#F5D26A]" />
              ) : (
                <FaExpand className="text-sm text-[#F5D26A]" />
              )}
            </button>
          </div>
        </header>

        {/* PDF Viewer */}
        <div
          className="flex flex-1 items-center justify-center rounded-3xl border border-white/12 bg-white/5 p-4 md:p-6 backdrop-blur-xl shadow-2xl mx-auto"
          style={{ minHeight: "600px", maxWidth: "700px", width: "100%" }}>
          {loading && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F5D26A]/30 border-t-[#F5D26A]" />
              <p className="text-sm text-slate-300">Loading PDF...</p>
            </div>
          )}

          {error && pdfUrl && (
            <div className="text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {pdfUrl && !error && (
            <div
              ref={viewerContainerRef}
              className="relative w-full rounded-2xl overflow-hidden flex justify-center items-start"
              style={{
                height: "calc(100vh - 280px)",
                minHeight: "600px",
                maxHeight: "calc(100vh - 280px)",
                transformStyle: "preserve-3d",
                WebkitTransformStyle: "preserve-3d",
              }}>
              <Worker workerUrl={pdfjsWorker}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key="pdf-viewer"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-full h-full rounded-2xl"
                    style={{
                      height: "100%",
                      width: "100%",
                      maxWidth: "100%",
                      boxShadow: isPageTurning
                        ? `0 ${direction > 0 ? "-" : ""
                        }25px 50px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(245, 210, 106, 0.1)`
                        : "0 15px 35px rgba(0, 0, 0, 0.25), 0 5px 15px rgba(0, 0, 0, 0.15)",
                      transition:
                        "box-shadow 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
                      transform: isPageTurning
                        ? `perspective(1000px) rotateY(${direction * 2}deg)`
                        : "perspective(1000px) rotateY(0deg)",
                    }}>
                    <Viewer
                      fileUrl={pdfUrl}
                      plugins={[
                        defaultLayoutPluginInstance,
                        pageNavigationPluginInstance,
                      ]}
                      onDocumentLoad={onDocumentLoad}
                      onDocumentLoadError={onDocumentLoadError}
                      defaultScale={SpecialZoomLevel.PageFit}
                      scrollMode={ScrollMode.Horizontal}
                      theme={{
                        theme: "dark",
                      }}
                      renderError={(error) => (
                        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-8">
                          <p className="text-lg font-semibold mb-2">
                            Failed to load PDF
                          </p>
                          <p className="text-sm text-slate-400">
                            {error.message || "Unknown error"}
                          </p>
                          <p className="text-xs mt-4 text-slate-500">
                            URL: {pdfUrl.substring(0, 50)}...
                          </p>
                        </div>
                      )}
                    />
                  </motion.div>
                </AnimatePresence>
              </Worker>
            </div>
          )}
        </div>

        {/* Instructions - Hidden on mobile for better space */}
        <div className="hidden md:block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 backdrop-blur-sm">
          <p className="mb-2 font-semibold text-[#F5D26A]">Navigation Tips:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Swipe left/right on mobile to navigate pages with page-turn
              animation
            </li>
            <li>Use arrow keys or Page Up/Down on desktop to navigate</li>
            <li>Press F for fullscreen mode</li>
            <li>Use zoom controls in the toolbar</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default PDFEbookReader;
