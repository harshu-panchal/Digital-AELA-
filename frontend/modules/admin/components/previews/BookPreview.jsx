const BookPreview = ({ ebook }) => {
  if (!ebook) return null;

  const metadata = ebook.metadata || {};
  const coverImage = metadata.coverImage || ebook.coverImage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {coverImage && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <img
              src={coverImage}
              alt={ebook.title}
              className="h-auto w-full max-h-64 object-cover sm:max-h-80 mx-auto"
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{ebook.title}</h1>
          {metadata.subtitle && (
            <p className="mt-2 text-lg text-[#D4AF37] font-semibold">{metadata.subtitle}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          {metadata.author && (
            <span className="text-gray-300">Author: {metadata.author}</span>
          )}
          {ebook.pages && (
            <span className="text-gray-300">Pages: {ebook.pages}</span>
          )}
          {ebook.categories && ebook.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ebook.categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
                  {cat}
                </span>
              ))}
            </div>
          )}
          {metadata.price !== undefined && (
            <span className="text-[#F5D26A] font-semibold">
              {metadata.isFree || metadata.price === 0
                ? "Free"
                : `Price: ${metadata.price} ${ebook.currency || "AED"}`}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {ebook.description && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-2 text-lg font-semibold text-white">Description</h3>
          <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
            {ebook.description}
          </p>
        </div>
      )}

      {/* Tags */}
      {metadata.tags && metadata.tags.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-full border border-white/10 bg-[#0a0a0a] px-3 py-1 text-xs text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Download Information */}
      <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Download Information
        </h3>
        <div className="space-y-2 text-sm">
          {ebook.downloadUrl && (
            <div>
              <p className="text-gray-400">Download URL:</p>
              <p className="mt-1 break-all text-gray-300">{ebook.downloadUrl}</p>
            </div>
          )}
          {ebook.pages && (
            <div>
              <p className="text-gray-400">Total Pages:</p>
              <p className="mt-1 text-white">{ebook.pages}</p>
            </div>
          )}
          {ebook.publishedAt && (
            <div>
              <p className="text-gray-400">Published:</p>
              <p className="mt-1 text-white">
                {new Date(ebook.publishedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-400">Visibility:</p>
            <p className="mt-1 text-white">{ebook.isPublic ? "Public" : "Private (Pending Approval)"}</p>
          </div>
        </div>
      </div>

      {/* Additional Metadata */}
      <div className="grid gap-4 sm:grid-cols-2">
        {metadata.isFeatured && (
          <div className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F5D26A]">
              Featured Book
            </p>
          </div>
        )}
        {metadata.isFree && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-400">
              Free Book
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookPreview;

