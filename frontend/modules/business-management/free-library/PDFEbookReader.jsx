import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaExpand,
  FaCompress,
  FaMinus,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";

// Set up PDF.js worker - use jsdelivr CDN (more reliable)
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const SCALE_STEP = 0.25;

const PDFEbookReader = () => {
  const { ebookId } = useParams();
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [ebookData, setEbookData] = useState(null);
  const [direction, setDirection] = useState(1);
  
  // Touch/swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef(null);

  // Fetch ebook data
  useEffect(() => {
    const fetchEbook = async () => {
      try {
        setLoading(true);
        const API_BASE_URL =
          import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";
        
        const response = await fetch(`${API_BASE_URL}/resources/ebooks/${ebookId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ebook: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setEbookData(data);
        
        // Verify PDF URL exists
        if (!data.downloadUrl) {
          throw new Error("PDF URL not found in ebook data");
        }
        
        console.log("PDF URL:", data.downloadUrl);
        
        // Try to verify the PDF URL is accessible and check Content-Type
        try {
          const pdfTestResponse = await fetch(data.downloadUrl, { method: "HEAD" });
          if (!pdfTestResponse.ok) {
            console.warn("PDF URL might not be accessible:", pdfTestResponse.status);
          }
          
          // Check content type first - this is the most reliable indicator
          const contentType = pdfTestResponse.headers.get("content-type");
          if (contentType) {
            const contentTypeLower = contentType.toLowerCase();
            
            // If Content-Type indicates an image, check if URL actually ends with image extension
            if (contentTypeLower.includes("image/") && !contentTypeLower.includes("pdf")) {
              const urlLower = data.downloadUrl.toLowerCase();
              let urlPath = '';
              
              // Try to extract the pathname from URL (remove query params and hash)
              try {
                urlPath = new URL(data.downloadUrl).pathname.toLowerCase();
              } catch (urlError) {
                // If URL parsing fails, use the full URL path
                urlPath = urlLower.split('?')[0].split('#')[0];
              }
              
              // Check if the actual filename/path ends with an image extension
              const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
              const hasImageExtension = imageExtensions.some(ext => urlPath.endsWith(ext));
              
              // Only throw error if Content-Type is image AND URL ends with image extension
              if (hasImageExtension) {
                throw new Error("Invalid PDF URL: The ebook appears to have an image URL instead of a PDF file. Please contact the administrator to upload the correct PDF file.");
              }
              // If Content-Type is image but URL doesn't end with image extension, it might be incorrectly configured
              // Log a warning but don't block - let the PDF viewer try to load it
              console.warn("Content-Type indicates image, but URL doesn't match:", contentType, data.downloadUrl);
            } else if (contentTypeLower.includes("pdf") || contentTypeLower.includes("application/pdf")) {
              // Valid PDF Content-Type - proceed
              console.log("Valid PDF Content-Type confirmed:", contentType);
            } else {
              // Unknown Content-Type - log warning but don't block
              console.warn("Content-Type is not clearly PDF:", contentType);
            }
          } else {
            // No Content-Type header - check URL pattern as fallback
            const urlLower = data.downloadUrl.toLowerCase();
            let urlPath = '';
            
            // Try to extract the pathname from URL
            try {
              urlPath = new URL(data.downloadUrl).pathname.toLowerCase();
            } catch (urlError) {
              // If URL parsing fails, use the full URL path
              urlPath = urlLower.split('?')[0].split('#')[0];
            }
            
            // Check if URL path ends with image extension (not just contains it)
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
            const hasImageExtension = imageExtensions.some(ext => urlPath.endsWith(ext));
            
            if (hasImageExtension && !urlPath.endsWith('.pdf')) {
              // URL clearly ends with image extension and no PDF - likely an error
              throw new Error("Invalid PDF URL: The ebook appears to have an image URL instead of a PDF file. Please contact the administrator to upload the correct PDF file.");
            }
            
            // Check if URL ends with .pdf or is a Cloudinary raw resource
            if (!urlPath.endsWith('.pdf') && !urlLower.includes('/raw/upload/')) {
              console.warn("PDF URL might not be a valid PDF file:", data.downloadUrl);
            }
          }
        } catch (testError) {
          // If it's our validation error, re-throw it
          if (testError.message && testError.message.includes("Invalid PDF URL")) {
            throw testError;
          }
          // For network errors or other issues, log warning but don't block
          console.warn("Could not verify PDF URL accessibility:", testError);
        }
        
        setPdfUrl(data.downloadUrl);
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

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("PDF Load Error:", error);
    const errorMessage = error?.message || "Failed to load PDF. Please check if the file is valid.";
    setError(errorMessage);
    setLoading(false);
    toast.error(`Failed to load PDF: ${errorMessage}`);
  }, []);

  const goToPrevPage = useCallback(() => {
    if (pageNumber > 1) {
      setDirection(-1);
      setPageNumber((prev) => prev - 1);
    }
  }, [pageNumber]);

  const goToNextPage = useCallback(() => {
    if (pageNumber < numPages) {
      setDirection(1);
      setPageNumber((prev) => prev + 1);
    }
  }, [pageNumber, numPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextPage();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevPage();
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
      }
      if (event.key === "-") {
        event.preventDefault();
        setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE));
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage]);

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe left - next page
        goToNextPage();
      } else {
        // Swipe right - previous page
        goToPrevPage();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [goToNextPage, goToPrevPage]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE));
  }, []);

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
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (error && !pdfUrl) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#04060F] px-6 text-center text-white">
        <div className="max-w-xl space-y-6 rounded-3xl border border-white/10 bg-white/5 px-10 py-12 backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-[#F5D26A]">Error Loading Ebook</h1>
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
      className="relative min-h-screen bg-[#02040B] pb-20 pt-32 text-white md:pt-36"
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
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= MIN_SCALE}
                className="inline-flex items-center justify-center rounded-full p-2 text-xs text-slate-200/75 transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Zoom out">
                <FaMinus />
              </button>
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-[#F5D26A]">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= MAX_SCALE}
                className="inline-flex items-center justify-center rounded-full p-2 text-xs text-slate-200/75 transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Zoom in">
                <FaPlus />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200/80 transition hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
              {isFullscreen ? <FaCompress className="text-sm text-[#F5D26A]" /> : <FaExpand className="text-sm text-[#F5D26A]" />}
            </button>
          </div>
        </header>

        {/* PDF Viewer */}
        <div className="flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-white/12 bg-white/5 p-6 backdrop-blur-xl">
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
            <div className="relative w-full overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
              <Document
                file={pdfUrl}
                options={{
                  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                  cMapPacked: true,
                }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F5D26A]/30 border-t-[#F5D26A]" />
                    <p className="text-sm text-slate-300">Loading PDF...</p>
                  </div>
                }
                error={
                  <div className="text-center text-red-400">
                    <p>Failed to load PDF</p>
                    <p className="text-xs mt-2 text-slate-400">URL: {pdfUrl.substring(0, 50)}...</p>
                  </div>
                }>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={pageNumber}
                    initial={{ opacity: 0, x: direction * 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -60 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex justify-center">
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-2xl"
                    />
                  </motion.div>
                </AnimatePresence>
              </Document>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {numPages && (
          <div className="flex flex-col gap-4 rounded-3xl border border-white/12 bg-white/5 px-6 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                whileTap={{ scale: 0.94 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/80 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
                <FaArrowLeft className="text-sm" />
                Prev
              </motion.button>
              <motion.button
                type="button"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                whileTap={{ scale: 0.94 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/80 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
                Next
                <FaArrowRight className="text-sm" />
              </motion.button>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/85">
              <span>Page</span>
              <div className="rounded-full border border-[#F5D26A]/30 bg-[#F5D26A]/10 px-3 py-1 text-[#F5D26A]">
                {String(pageNumber).padStart(2, "0")}
              </div>
              <span className="text-slate-200/70">of</span>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-slate-200/90">
                {String(numPages).padStart(2, "0")}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
          <p className="mb-2 font-semibold text-[#F5D26A]">Navigation Tips:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Swipe left/right on mobile to navigate pages</li>
            <li>Use arrow keys on desktop to navigate</li>
            <li>Use +/- keys or buttons to zoom</li>
            <li>Press F for fullscreen mode</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default PDFEbookReader;

