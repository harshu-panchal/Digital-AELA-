import { getMediaUrl } from "../../../../src/utils/mediaUrl";

const StudentPreview = ({ student }) => {
  if (!student) return null;

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const metadata = student.metadata || {};
  const profile = student.profile || {};
  const location = profile.location || {};

  // Helper to format enum values
  const formatEnum = (value) => {
    if (!value) return null;
    return value
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{student.fullName || "Unknown Student"}</h1>
          <p className="mt-2 text-lg text-[#D4AF37] font-semibold">{student.email}</p>
          {profile.headline && (
            <p className="mt-1 text-sm text-gray-300">{profile.headline}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          {student.role && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
              {student.role}
            </span>
          )}
        </div>
      </div>

      {/* Profile Image */}
      {(student.profileImage || profile.avatarUrl) && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <img
            src={getMediaUrl(student.profileImage || profile.avatarUrl)}
            alt={student.fullName}
            className="h-auto w-full max-h-64 object-cover sm:max-h-80 mx-auto"
          />
        </div>
      )}

      {/* Contact Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(profile.phone || metadata.phone) && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Phone</h3>
            <p className="text-base text-white">{profile.phone || metadata.phone}</p>
          </div>
        )}
        {student.email && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Email</h3>
            <p className="text-base text-white">{student.email}</p>
          </div>
        )}
        {(location.city || location.country) && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Location</h3>
            <p className="text-base text-white">
              {[location.city, location.country].filter(Boolean).join(", ") || "Not specified"}
            </p>
          </div>
        )}
        {profile.ageGroup && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Age Group</h3>
            <p className="text-base text-white">{profile.ageGroup}</p>
          </div>
        )}
      </div>

      {/* Status & Program Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        {profile.currentStatus && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Current Status</h3>
            <p className="text-base text-white">{formatEnum(profile.currentStatus)}</p>
          </div>
        )}
        {profile.preferredProgram && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Preferred Program</h3>
            <p className="text-base text-white">{profile.preferredProgram}</p>
          </div>
        )}
        {student.createdAt && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Application Date</h3>
            <p className="text-base text-white">{formatDate(student.createdAt)}</p>
          </div>
        )}
        {student.isActive !== undefined && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Status</h3>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                student.isActive
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              }`}>
              {student.isActive ? "Active" : "Pending Approval"}
            </span>
          </div>
        )}
      </div>

      {/* Bio/About */}
      {(profile.bio || metadata.bio || metadata.about) && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">About</h3>
          <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
            {profile.bio || metadata.bio || metadata.about}
          </p>
        </div>
      )}

      {/* Goals */}
      {profile.goals && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Goals</h3>
          <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.goals}</p>
        </div>
      )}

      {/* Skills */}
      {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links & URLs */}
      {(profile.resumeUrl || profile.portfolioUrl || profile.linkedinUrl) && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Links</h3>
          <div className="space-y-2">
            {profile.resumeUrl && (
              <div>
                <span className="text-sm font-semibold text-gray-400">Resume: </span>
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#D4AF37] hover:text-[#F5D26A] underline">
                  {profile.resumeUrl}
                </a>
              </div>
            )}
            {profile.portfolioUrl && (
              <div>
                <span className="text-sm font-semibold text-gray-400">Portfolio: </span>
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#D4AF37] hover:text-[#F5D26A] underline">
                  {profile.portfolioUrl}
                </a>
              </div>
            )}
            {profile.linkedinUrl && (
              <div>
                <span className="text-sm font-semibold text-gray-400">LinkedIn: </span>
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#D4AF37] hover:text-[#F5D26A] underline">
                  {profile.linkedinUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referral Source & Message */}
      {(profile.metadata?.referralSource || profile.metadata?.message) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.metadata?.referralSource && (
            <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Referral Source</h3>
              <p className="text-base text-white">{profile.metadata.referralSource}</p>
            </div>
          )}
          {profile.metadata?.message && (
            <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Message</h3>
              <p className="text-base text-white">{profile.metadata.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPreview;

