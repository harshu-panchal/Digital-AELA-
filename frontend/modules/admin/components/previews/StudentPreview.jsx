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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{student.fullName || "Unknown Student"}</h1>
          <p className="mt-2 text-lg text-[#D4AF37] font-semibold">{student.email}</p>
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
      {student.profileImage && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <img
            src={student.profileImage}
            alt={student.fullName}
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
        {student.email && (
          <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">Email</h3>
            <p className="text-base text-white">{student.email}</p>
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

      {/* Additional Information */}
      <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
};

export default StudentPreview;

