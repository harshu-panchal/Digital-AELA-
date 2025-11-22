const BlogPreview = ({ blog }) => {
  if (!blog) return null;

  const formatDate = (date) => {
    if (!date) return "Not published";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">{blog.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          {blog.publishedAt && <span>{formatDate(blog.publishedAt)}</span>}
          {blog.category && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
              {blog.category}
            </span>
          )}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, idx) => (
                <span key={idx} className="text-xs text-gray-500">#{tag}</span>
              ))}
            </div>
          )}
        </div>
        {blog.excerpt && (
          <p className="text-base text-gray-300 leading-relaxed">{blog.excerpt}</p>
        )}
      </div>

      {/* Cover Image */}
      {blog.coverImage && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="h-auto w-full max-h-64 object-cover sm:max-h-80"
          />
        </div>
      )}

      {/* Author Info */}
      {blog.author && (
        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-[#060606]/80 p-4">
          <div className="flex-1">
            <p className="text-base font-semibold text-white">
              {blog.author.fullName || blog.author.email || "Unknown Author"}
            </p>
            {blog.author.email && (
              <p className="mt-1 text-sm text-gray-400">{blog.author.email}</p>
            )}
            {blog.author.role && (
              <p className="mt-1 text-xs text-gray-500">{blog.author.role}</p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {blog.content && (
        <article className="prose prose-invert max-w-none rounded-xl border border-white/10 bg-[#050505]/80 p-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-white [&_p]:text-gray-300 [&_p]:my-3 [&_strong]:text-[#F5D26A] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-2 [&_li]:text-gray-300 [&_li]:my-1 [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#D4AF37]/40 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:my-3 [&_blockquote]:text-[#F5D26A] [&_blockquote]:italic [&_blockquote]:text-sm [&_blockquote]:bg-[#0a0a0a]/50 [&_blockquote]:py-2 [&_blockquote]:rounded-r [&_blockquote_p]:my-0">
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
        </article>
      )}
    </div>
  );
};

export default BlogPreview;

