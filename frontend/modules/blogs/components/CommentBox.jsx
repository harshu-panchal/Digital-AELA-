import { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { HiOutlinePaperAirplane } from "react-icons/hi2";
import { useBlogs } from "../../../src/contexts/BlogContext";
import { useUser } from "../../../src/contexts/UserContext";

const CommentBox = ({ blogId, comments = [] }) => {
  const [message, setMessage] = useState("");
  const { addComment, formatTimestamp } = useBlogs();
  const { profile } = useUser();

  const handleSubmit = (event) => {
    event.preventDefault();
    addComment(blogId, message);
    setMessage("");
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <header className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Community Comments</h3>
          <p className="text-sm text-gray-400">
            Share your insight. Respectful, quality feedback helps build the community.
          </p>
        </div>
        <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]">
          {comments.length} Comments
        </span>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080808]/80 p-4 sm:flex-row sm:items-center">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="h-10 w-10 rounded-full border border-[#D4AF37]/40 object-cover"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          placeholder="Add your voice to the conversation..."
          className="min-h-[64px] flex-1 resize-none rounded-xl border border-transparent bg-[#111]/60 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:border-[#D4AF37]/50 focus:outline-none"
        />
        <Motion.button
          type="submit"
          disabled={!message.trim()}
          whileHover={{ scale: message.trim() ? 1.02 : 1 }}
          whileTap={{ scale: message.trim() ? 0.96 : 1 }}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            message.trim()
              ? "bg-gradient-to-r from-[#D4AF37] to-[#F5D26A] text-black shadow-lg shadow-[#D4AF37]/30"
              : "cursor-not-allowed border border-white/10 bg-[#121212] text-gray-400"
          }`}>
          <HiOutlinePaperAirplane className="h-4 w-4" />
          Post
        </Motion.button>
      </form>

      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment) => (
            <Motion.article
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex gap-3 rounded-2xl border border-white/5 bg-[#0a0a0a]/80 p-4">
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="h-10 w-10 flex-shrink-0 rounded-full border border-[#D4AF37]/30 object-cover"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-white">{comment.author.name}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                    {formatTimestamp(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-200">{comment.message}</p>
              </div>
            </Motion.article>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 bg-[#080808]/60 p-6 text-center text-sm text-gray-400">
            No comments yet. Start the discussion and share your thoughts.
          </p>
        )}
      </div>
    </section>
  );
};

export default CommentBox;


