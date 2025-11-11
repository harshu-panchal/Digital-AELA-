import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaMoon,
  FaSun,
  FaMinus,
  FaPlus,
} from "react-icons/fa";
import ebooksData from "../../../src/data/ebooks.json";

const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.4;

const FreeLibraryReader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const book = useMemo(
    () => ebooksData.find((item) => item.id === bookId),
    [bookId],
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [fontScale, setFontScale] = useState(1.05);
  const [theme, setTheme] = useState("dark");
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    setCurrentPage(0);
    setDirection(1);
  }, [bookId]);

  const totalPages = book?.pages?.length ?? 0;

  const pageContent = useMemo(() => {
    if (!book?.pages) {
      return "";
    }
    const raw = book.pages[currentPage] ?? "";
    return raw.replace(/\\n/g, "\n");
  }, [book, currentPage]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  if (!book) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#04060F] px-6 text-center text-white">
        <div className="max-w-xl space-y-6 rounded-3xl border border-white/10 bg-white/5 px-10 py-12 backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-[#F5D26A]">
            Title not found
          </h1>
          <p className="text-base text-slate-200/85">
            The e-book you are looking for is no longer available. Please return
            to the Free Library and explore our latest learning resources.
          </p>
          <button
            type="button"
            onClick={() => navigate("/free-library")}
            className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/60 bg-[#F5D26A]/20 px-6 py-2.5 text-sm font-semibold text-[#F5D26A] transition-colors duration-300 hover:border-[#F5D26A]/90 hover:bg-[#F5D26A]/35">
            Back to Library
          </button>
        </div>
      </main>
    );
  }

  const themeClasses =
    theme === "dark"
      ? "bg-[#080C1A]/95 text-slate-100"
      : "bg-white/95 text-slate-900 shadow-[0_45px_120px_rgba(15,20,35,0.25)]";

  return (
    <main className="relative min-h-screen bg-[#02040B] pb-20 pt-32 text-white md:pt-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0d1325_0%,#02040B_60%,#010205_100%)] opacity-95" />
      <div className="relative layout-container flex flex-col gap-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/free-library")}
            className="inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-[#F5D26A] transition-all duration-300 hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
            <FaArrowLeft className="text-xs" />
            Back to library
          </button>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200/70">
              <span>{book.author}</span>
              <span className="h-6 w-px bg-white/15" />
              <span>{totalPages} pages</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2 py-2">
              <button
                type="button"
                onClick={() =>
                  setFontScale((prev) => Math.max(prev - 0.08, MIN_FONT_SCALE))
                }
                className="inline-flex items-center justify-center rounded-full p-2 text-xs text-slate-200/75 transition hover:bg-white/10"
                aria-label="Decrease font size">
                <FaMinus />
              </button>
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-[#F5D26A]">
                Text
              </span>
              <button
                type="button"
                onClick={() =>
                  setFontScale((prev) => Math.min(prev + 0.08, MAX_FONT_SCALE))
                }
                className="inline-flex items-center justify-center rounded-full p-2 text-xs text-slate-200/75 transition hover:bg-white/10"
                aria-label="Increase font size">
                <FaPlus />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200/80 transition hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
              {theme === "dark" ? (
                <>
                  <FaSun className="text-sm text-[#F5D26A]" />
                  Light
                </>
              ) : (
                <>
                  <FaMoon className="text-sm text-[#F5D26A]" />
                  Dark
                </>
              )}
            </button>
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] xl:gap-12">
          <aside className="flex flex-col gap-6 rounded-3xl border border-white/12 bg-white/7 p-7 backdrop-blur-xl">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img
                src={book.coverImage}
                alt={book.title}
                className="h-72 w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-white">{book.title}</h1>
              <p className="text-sm leading-relaxed text-slate-200/80">
                {book.description}
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-widest text-[#F5D26A]/85">
                <span className="rounded-full border border-[#F5D26A]/30 px-4 py-1.5">
                  Ebook edition
                </span>
                <span className="rounded-full border border-[#F5D26A]/30 px-4 py-1.5">
                  Kindle Mode
                </span>
              </div>
            </div>
          </aside>

          <div
            className={`relative flex min-h-[480px] flex-col overflow-hidden rounded-[32px] border border-white/12 px-6 pb-24 pt-10 shadow-[inset_0_2px_40px_rgba(255,255,255,0.04)] transition-colors duration-500 md:px-10 lg:pb-20 ${themeClasses}`}>
            <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-white/10 via-transparent to-transparent mix-blend-screen opacity-50" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={currentPage}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -60 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative flex-1 overflow-y-auto pr-2 text-base leading-relaxed md:pr-4"
                style={{
                  fontSize: `${fontScale}rem`,
                  lineHeight: 1.7,
                  wordBreak: "break-word",
                  hyphens: "auto",
                }}>
                {pageContent.split(/\n{2,}/).map((paragraph, idx) => (
                  <p key={idx} className="mb-6">
                    {paragraph}
                  </p>
                ))}
              </motion.article>
            </AnimatePresence>

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 bg-linear-to-t from-black/60 via-black/20 to-transparent px-6 pb-8 pt-6 md:px-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentPage === 0}
                  whileTap={{ scale: 0.94 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/80 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
                  <FaArrowLeft className="text-sm" />
                  Prev
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleNext}
                  disabled={currentPage >= totalPages - 1}
                  whileTap={{ scale: 0.94 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/80 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#F5D26A]/60 hover:bg-[#F5D26A]/15">
                  Next
                  <FaArrowRight className="text-sm" />
                </motion.button>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]/85">
                <span>Page</span>
                <div className="rounded-full border border-[#F5D26A]/30 bg-[#F5D26A]/10 px-3 py-1 text-[#F5D26A]">
                  {String(currentPage + 1).padStart(2, "0")}
                </div>
                <span className="text-slate-200/70">of</span>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-slate-200/90">
                  {String(totalPages).padStart(2, "0")}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default FreeLibraryReader;

