import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { getFreeEbooks } from "../../../src/services/ebooks";

const FreeLibrary = () => {
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        setLoading(true);
        const response = await getFreeEbooks(1, 50); // Fetch up to 50 free ebooks
        setEbooks(response.data || []);
      } catch (error) {
        console.error("Error fetching free ebooks:", error);
        toast.error("Failed to load free ebooks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEbooks();
  }, []);

  const handleOpenReader = (bookId) => {
    navigate(`/free-library/ebook/${bookId}/read`);
  };

  return (
    <main className="relative min-h-screen bg-[#04060F] pt-36 pb-20 text-white md:pt-40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0d1325_0%,#04060F_55%,#010205_100%)] opacity-90" />
      <div className="relative layout-container flex flex-col gap-12">
        <header className="mx-auto max-w-3xl text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl font-bold text-[#F5D26A] sm:text-4xl md:text-5xl">
            Free Library
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-base text-slate-200/85 sm:text-lg">
            Discover curated e-books created by the Digital AELA team. Dive into
            leadership, communication, marketing and wellbeing playbooks crafted
            to elevate your growth—all free and ready to read instantly.
          </motion.p>
        </header>

        <section>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F5D26A]/30 border-t-[#F5D26A]" />
              <p className="mt-4 text-sm text-slate-300">Loading free ebooks...</p>
            </div>
          ) : ebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg text-slate-300">No free ebooks available at the moment.</p>
              <p className="mt-2 text-sm text-slate-400">Check back later for new additions!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {ebooks.map((book, index) => (
                <motion.article
                  key={book._id || book.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.06,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => handleOpenReader(book._id || book.id)}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/8 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-[#F5D26A]/60 hover:bg-white/8">
                  <div className="relative h-64 w-full overflow-hidden">
                    <img
                      src={book.metadata?.coverImage || book.coverImage || "/placeholder-book.png"}
                      alt={book.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/placeholder-book.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#04060F]/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#F5D26A] backdrop-blur">
                      Free E-book
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 px-6 py-6">
                    <h3 className="text-xl font-semibold text-white">
                      {book.title}
                    </h3>
                    <p className="text-sm font-medium uppercase tracking-wider text-[#F5D26A]/80">
                      {book.metadata?.author || book.author || "Digital AELA"}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-200/80 line-clamp-3">
                      {book.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenReader(book._id || book.id);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/50 bg-[#F5D26A]/20 px-5 py-2 text-sm font-semibold text-[#F5D26A] transition-all duration-300 hover:border-[#F5D26A]/80 hover:bg-[#F5D26A]/30">
                        Read Now
                      </button>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-200/75">
                        {book.pages || 0} pages
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default FreeLibrary;

