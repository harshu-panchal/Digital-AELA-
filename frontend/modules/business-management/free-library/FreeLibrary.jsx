import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ebooksData from "../../../src/data/ebooks.json";

const FreeLibrary = () => {
  const navigate = useNavigate();
  const ebooks = useMemo(() => ebooksData, []);

  const handleOpenReader = (bookId) => {
    navigate(`/free-library/${bookId}`);
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
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {ebooks.map((book, index) => (
              <motion.article
                key={book.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => handleOpenReader(book.id)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/8 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-[#F5D26A]/60 hover:bg-white/8">
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
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
                    {book.author}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-200/80">
                    {book.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenReader(book.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/50 bg-[#F5D26A]/20 px-5 py-2 text-sm font-semibold text-[#F5D26A] transition-all duration-300 hover:border-[#F5D26A]/80 hover:bg-[#F5D26A]/30">
                      Read Now
                    </button>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-200/75">
                      {book.pages.length} pages
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default FreeLibrary;

