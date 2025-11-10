import React from "react";
import { motion } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineHeart,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineBookmark,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

const PostCard = ({
  post,
  onOpen,
  onSave,
  isSaved,
  onApply,
  hasApplied,
  isCompact = false,
  onEdit,
  onDelete,
  isOwner = false,
}) => {
  const isJob = post.type === "job";
  const showOwnerActions = isOwner && (onEdit || onDelete);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.18 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-[#0c0c0c] via-[#050505] to-[#030303] text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      <button
        type="button"
        onClick={() => onOpen?.(post)}
        className="relative h-48 overflow-hidden">
        {showOwnerActions && (
          <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition group-hover:opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(post);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-black/60 text-white hover:border-white/40">
                <HiOutlinePencilSquare className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(post.id);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-black/60 text-white hover:border-white/40">
                <HiOutlineTrash className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <img
          src={post.image}
          alt={post.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="h-10 w-10 rounded-full border-2 border-white/20 object-cover"
            />
            <div className="text-left">
              <p className="text-sm font-semibold text-white">
                {post.authorName}
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-300">
                {isJob ? "Recruiter" : "Job Seeker"}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
            {isJob ? "Role Drop" : "Showcase"}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-5 px-4 py-5 sm:px-5">
        <div>
          <h3 className="text-lg font-semibold leading-tight text-white">
            {post.title}
          </h3>
          {isJob ? (
            <p className="mt-1 text-sm text-gray-400">{post.company}</p>
          ) : (
            <p className="mt-1 text-sm text-gray-400">{post.headline}</p>
          )}
        </div>

        {isJob ? (
          <div className="space-y-3 text-sm text-gray-300">
            <p className="flex items-center gap-2">
              <HiOutlineMapPin className="h-5 w-5 text-white/70" />
              {post.location}
            </p>
            {post.salary && (
              <p className="flex items-center gap-2">
                <HiOutlineCurrencyRupee className="h-5 w-5 text-white/70" />
                {post.salary}
              </p>
            )}
            <p className="flex items-center gap-2">
              <HiOutlineBriefcase className="h-5 w-5 text-white/70" />
              {post.employmentType}
            </p>
            {post.experience && (
              <p className="flex items-center gap-2">
                <HiOutlineClock className="h-5 w-5 text-white/70" />
                {post.experience}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-300 line-clamp-3">{post.summary}</p>
            <div className="flex flex-wrap gap-2">
              {post.skills?.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {(post.tags ?? post.skills ?? []).slice(0, isCompact ? 2 : 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <HiOutlineHeart className="h-4 w-4" />
              {post.stats?.likes ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <HiOutlineChatBubbleOvalLeft className="h-4 w-4" />
              {post.stats?.comments ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <HiOutlineEye className="h-4 w-4" />
              {post.stats?.views ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isJob && (
              <button
                type="button"
                onClick={() => onApply?.(post.id)}
                disabled={hasApplied}
                className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                  hasApplied
                    ? "cursor-not-allowed border border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
                }`}>
                <HiOutlineSparkles className="h-4 w-4" />
                {hasApplied ? "Applied" : "Apply"}
              </button>
            )}

            <button
              type="button"
              onClick={() => onSave?.(post.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                isSaved
                  ? "border-white/40 bg-white/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
              }`}>
              <HiOutlineBookmark className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => onOpen?.(post)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10">
              <HiOutlineArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;


