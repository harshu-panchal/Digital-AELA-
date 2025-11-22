import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark } from "react-icons/hi2";
import PostDetailContent from "./PostDetailContent";
import { useExploreJobs } from "../context/ExploreJobsContext";

const modalRoot = typeof document !== "undefined" ? document.body : null;

const PostModal = ({ post, isOpen, onClose }) => {
  const { applyToJob, appliedPostIds } = useExploreJobs();
  const hasApplied = post ? appliedPostIds.has(post.id) : false;
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!modalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-xl px-6 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 30 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#020202]/95 shadow-[0_32px_120px_rgba(0,0,0,0.65)]">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-black/80 text-white transition hover:border-white/30 hover:text-white/90">
              <HiOutlineXMark className="h-6 w-6" />
            </button>
            <div className="h-full overflow-y-auto">
              <PostDetailContent 
                post={post} 
                variant="modal" 
                onApply={applyToJob}
                hasApplied={hasApplied}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot
  );
};

export default PostModal;


