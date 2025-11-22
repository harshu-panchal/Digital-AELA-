const JobPreview = ({ job }) => {
  if (!job) return null;

  const formatDate = (date) => {
    if (!date) return "Not set";
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
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{job.title}</h1>
          <p className="mt-2 text-lg text-[#D4AF37] font-semibold">{job.company}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          {job.location && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0a] px-3 py-1 text-xs text-gray-300">
              📍 {job.location}
            </span>
          )}
          {job.isRemote && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
              Remote
            </span>
          )}
          {job.employmentType && (
            <span className="text-gray-300 capitalize">{job.employmentType}</span>
          )}
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Job Description</h3>
          <div
            className="prose prose-invert max-w-none text-base text-gray-300 leading-relaxed [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:my-1"
            dangerouslySetInnerHTML={{
              __html: typeof job.description === "string" ? job.description : "",
            }}
          />
        </div>
      )}

      {/* Job Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        {job.salary && (
          <div className="rounded-lg border border-white/10 bg-[#050505]/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Salary
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              {job.salary.range || job.salary}
              {job.salary.currency && ` ${job.salary.currency}`}
            </p>
          </div>
        )}
        {job.experience && (
          <div className="rounded-lg border border-white/10 bg-[#050505]/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Experience Required
            </p>
            <p className="mt-1 text-base text-white">{job.experience}</p>
          </div>
        )}
      </div>

      {/* Culture Highlights */}
      {job.cultureHighlights && job.cultureHighlights.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Culture Highlights</h3>
          <ul className="space-y-2">
            {job.cultureHighlights.map((highlight, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#0a0a0a]/50 p-3">
                <span className="mt-1 text-[#D4AF37]">✓</span>
                <span className="text-sm text-gray-300">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {job.tags.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-full border border-white/10 bg-[#0a0a0a] px-3 py-1 text-xs text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Apply CTA */}
      {job.applyCTA && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Apply Call to Action
          </h3>
          <p className="text-base text-white">{job.applyCTA}</p>
        </div>
      )}

      {/* Owner/Recruiter Info */}
      {job.owner && (
        <div className="rounded-xl border border-white/10 bg-[#060606]/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Posted By
          </h3>
          <p className="text-base font-semibold text-white">
            {job.owner.fullName || "Unknown"}
          </p>
          {job.owner.email && (
            <p className="mt-1 text-sm text-gray-400">{job.owner.email}</p>
          )}
        </div>
      )}

      {/* Additional Info */}
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        {job.publishedAt && (
          <div>
            <p className="text-gray-400">Published:</p>
            <p className="mt-1 text-white">{formatDate(job.publishedAt)}</p>
          </div>
        )}
        {job.expirationDate && (
          <div>
            <p className="text-gray-400">Expires:</p>
            <p className="mt-1 text-white">{formatDate(job.expirationDate)}</p>
          </div>
        )}
        {job.stats && (
          <div className="col-span-2">
            <p className="text-gray-400 mb-2">Statistics:</p>
            <div className="flex flex-wrap gap-4">
              {job.stats.views !== undefined && (
                <span className="text-gray-300">Views: {job.stats.views}</span>
              )}
              {job.stats.applications !== undefined && (
                <span className="text-gray-300">
                  Applications: {job.stats.applications}
                </span>
              )}
              {job.stats.saves !== undefined && (
                <span className="text-gray-300">Saves: {job.stats.saves}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPreview;

