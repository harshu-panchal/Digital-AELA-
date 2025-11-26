const RecruiterPreview = ({ recruiter }) => {
  if (!recruiter) return null;

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const metadata = recruiter.metadata || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{recruiter.fullName || "Unknown Recruiter"}</h1>
          <p className="mt-2 text-lg text-[#D4AF37] font-semibold">{recruiter.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          {recruiter.role && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
              {recruiter.role}
            </span>
          )}
          {metadata.company && (
            <span className="text-gray-300">Company: {metadata.company}</span>
          )}
          {metadata.headline && (
            <span className="text-gray-300">{metadata.headline}</span>
          )}
        </div>
      </div>

      {/* Profile Image */}
      {metadata.avatarUrl && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <img
            src={metadata.avatarUrl}
            alt={recruiter.fullName}
            className="h-auto w-full max-h-64 object-cover sm:max-h-80 mx-auto"
          />
        </div>
      )}

      {/* Contact Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        {metadata.phone && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Phone</h3>
            <p className="text-base text-white">{metadata.phone}</p>
          </div>
        )}
        {recruiter.email && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Email</h3>
            <p className="text-base text-white">{recruiter.email}</p>
          </div>
        )}
      </div>

      {/* Company Information */}
      {metadata.company && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Company</h3>
          <p className="text-base text-white">{metadata.company}</p>
        </div>
      )}

      {/* Headline */}
      {metadata.headline && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Headline</h3>
          <p className="text-base text-white">{metadata.headline}</p>
        </div>
      )}

      {/* Bio/About Company */}
      {(metadata.bio || metadata.aboutCompany) && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">About</h3>
          <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
            {metadata.bio || metadata.aboutCompany}
          </p>
        </div>
      )}

      {/* Experience */}
      {metadata.experience && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Experience</h3>
          <p className="text-base text-white">{metadata.experience}</p>
          {metadata.experienceYears !== undefined && (
            <p className="mt-2 text-sm text-gray-300">{metadata.experienceYears} years of experience</p>
          )}
        </div>
      )}

      {/* Social Links */}
      {metadata.socials && (metadata.socials.linkedin || metadata.socials.website || metadata.socials.twitter) && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Social Links</h3>
          <div className="space-y-2">
            {metadata.socials.linkedin && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">LinkedIn:</span>
                <a
                  href={metadata.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4AF37] hover:underline">
                  {metadata.socials.linkedin}
                </a>
              </div>
            )}
            {metadata.socials.website && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Website:</span>
                <a
                  href={metadata.socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4AF37] hover:underline">
                  {metadata.socials.website}
                </a>
              </div>
            )}
            {metadata.socials.twitter && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Twitter:</span>
                <a
                  href={metadata.socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4AF37] hover:underline">
                  {metadata.socials.twitter}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        {recruiter.createdAt && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Application Date</h3>
            <p className="text-base text-white">{formatDate(recruiter.createdAt)}</p>
          </div>
        )}
        {recruiter.isActive !== undefined && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Status</h3>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                recruiter.isActive
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              }`}>
              {recruiter.isActive ? "Active" : "Pending Approval"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterPreview;

