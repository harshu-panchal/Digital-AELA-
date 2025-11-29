import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineXMark,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { highlightTags } from "../data/posts";
import TranslatedText from "../../../src/components/TranslatedText";

const filterCategories = [
  {
    title: <TranslatedText>Role Type</TranslatedText>,
    options: [<TranslatedText>Product</TranslatedText>, <TranslatedText>Engineering</TranslatedText>, <TranslatedText>Marketing</TranslatedText>, <TranslatedText>Design Ops</TranslatedText>],
  },
  {
    title: <TranslatedText>Experience Level</TranslatedText>,
    options: [<TranslatedText>Entry</TranslatedText>, <TranslatedText>Mid-level</TranslatedText>, <TranslatedText>Senior</TranslatedText>, <TranslatedText>Leadership</TranslatedText>],
  },
  {
    title: <TranslatedText>Mode</TranslatedText>,
    options: [<TranslatedText>Remote</TranslatedText>, <TranslatedText>Hybrid</TranslatedText>, <TranslatedText>On-site</TranslatedText>],
  },
];

const FiltersPanel = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[110] flex justify-end bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 220, damping: 32 }}
            className="flex h-full w-full max-w-md flex-col gap-6 border-l border-white/10 bg-[#050505]/95 p-6 shadow-[0_32px_120px_rgba(0,0,0,0.65)]">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  <TranslatedText>Smart Filters</TranslatedText>
                </p>
                <h3 className="text-xl font-semibold text-white">
                  <TranslatedText>Find your next drop</TranslatedText>
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-black/70 text-white transition hover:border-white/30">
                <HiOutlineXMark className="h-6 w-6" />
              </button>
            </header>

            <div className="space-y-6">
              {filterCategories.map((category, idx) => (
                <div key={idx} className="space-y-3">
                  <p className="text-sm font-semibold text-gray-300">
                    {category.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        type="button"
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-200 transition hover:border-white/30 hover:text-white">
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                <TranslatedText>Spotlights</TranslatedText>
              </p>
              <div className="flex flex-wrap gap-2">
                {highlightTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                    <TranslatedText>{tag}</TranslatedText>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                <TranslatedText>Coming Soon</TranslatedText>
              </p>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-gray-300">
                <HiOutlineAdjustmentsHorizontal className="h-5 w-5 text-white/70" />
                <TranslatedText>Activate AI-matched roles when backend is live.</TranslatedText>
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5">
                <HiOutlineSparkles className="h-5 w-5" />
                <TranslatedText>Save Filter</TranslatedText>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FiltersPanel;


