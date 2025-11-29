import React from "react";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import PostCard from "./PostCard";
import TranslatedText from "../../../src/components/TranslatedText";

const PostGrid = ({
  posts,
  emptyState,
  onOpen,
  onSave,
  savedPostIds,
  onApply,
  appliedPostIds,
  ownerUsername,
  onEdit,
  onDelete,
}) => {
  if (!posts?.length) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center">
        {emptyState ?? (
          <>
            <h3 className="text-lg font-semibold text-white">
              <TranslatedText>No posts available yet</TranslatedText>
            </h3>
            <p className="mt-2 max-w-md text-sm text-gray-400">
              <TranslatedText>Create your first job post to see it appear here.</TranslatedText>
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className="overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <div className="flex gap-6 min-w-max">
          <AnimatePresence>
            {posts.map((post) => (
              <div key={post.id} className="w-[320px] shrink-0">
                <PostCard
                  post={post}
                  onOpen={onOpen}
                  onSave={onSave}
                  onApply={onApply}
                  isSaved={savedPostIds?.has(post.id)}
                  hasApplied={appliedPostIds?.has(post.id)}
                  isOwner={ownerUsername ? post.authorUsername === ownerUsername : false}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
};

export default PostGrid;


