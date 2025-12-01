import { getMediaUrl } from "../../../../src/utils/mediaUrl";

const TeacherPreview = ({ teacher }) => {
  if (!teacher) return null;

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const metadata = teacher.metadata || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{teacher.fullName || "Unknown Teacher"}</h1>
          <p className="mt-2 text-lg text-[#D4AF37] font-semibold">{teacher.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          {teacher.role && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
              {teacher.role}
            </span>
          )}
          {metadata.expertise && (
            <span className="text-gray-300">Expertise: {metadata.expertise}</span>
          )}
          {metadata.experienceYears !== undefined && (
            <span className="text-gray-300">{metadata.experienceYears} years experience</span>
          )}
        </div>
      </div>

      {/* Profile Image */}
      {teacher.profileImage && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <img
            src={getMediaUrl(teacher.profileImage)}
            alt={teacher.fullName}
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
        {teacher.email && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Email</h3>
            <p className="text-base text-white">{teacher.email}</p>
          </div>
        )}
      </div>

      {/* Bio/About */}
      {(metadata.bio || metadata.about) && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">About</h3>
          <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
            {metadata.bio || metadata.about}
          </p>
        </div>
      )}

      {/* Primary Subjects */}
      {metadata.primarySubjects && metadata.primarySubjects.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Primary Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {metadata.primarySubjects.map((subject, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {metadata.certifications && metadata.certifications.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Certifications</h3>
          <div className="space-y-2">
            {metadata.certifications.map((cert, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-[#D4AF37]">✓</span>
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        {teacher.createdAt && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Application Date</h3>
            <p className="text-base text-white">{formatDate(teacher.createdAt)}</p>
          </div>
        )}
        {teacher.isActive !== undefined && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Status</h3>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                teacher.isActive
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              }`}>
              {teacher.isActive ? "Active" : "Pending Approval"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherPreview;

