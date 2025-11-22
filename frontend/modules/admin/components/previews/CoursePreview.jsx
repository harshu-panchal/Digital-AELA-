const CoursePreview = ({ course }) => {
  if (!course) return null;

  const metadata = course.metadata || {};
  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {course.thumbnailUrl && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-auto w-full max-h-48 object-cover sm:max-h-64"
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{course.title}</h1>
          {metadata.subtitle && (
            <p className="mt-2 text-lg text-[#D4AF37] font-semibold">{metadata.subtitle}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          {course.category && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
              {course.category}
            </span>
          )}
          {course.duration && (
            <span className="text-gray-300">Duration: {course.duration} hours</span>
          )}
          {metadata.difficulty && (
            <span className="text-gray-300">Level: {metadata.difficulty}</span>
          )}
          {metadata.language && (
            <span className="text-gray-300">Language: {metadata.language}</span>
          )}
          {course.price !== undefined && (
            <span className="text-[#F5D26A] font-semibold">
              {course.price === 0 ? "Free" : `${course.currency || "AED"} ${course.price}`}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-2 text-lg font-semibold text-white">Course Description</h3>
          <p className="text-base text-gray-300 leading-relaxed">{course.description}</p>
        </div>
      )}

      {/* Instructor */}
      {course.instructor && (
        <div className="rounded-xl border border-white/10 bg-[#060606]/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Instructor
          </h3>
          <p className="text-base font-semibold text-white">
            {course.instructor.fullName || "Unknown"}
          </p>
          {course.instructor.email && (
            <p className="mt-1 text-sm text-gray-400">{course.instructor.email}</p>
          )}
        </div>
      )}

      {/* Learning Outcomes */}
      {metadata.learningOutcomes && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Learning Outcomes</h3>
          <div
            className="prose prose-invert max-w-none text-sm text-gray-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:my-1"
            dangerouslySetInnerHTML={{ __html: metadata.learningOutcomes }}
          />
        </div>
      )}

      {/* Requirements */}
      {metadata.requirements && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Requirements</h3>
          <div
            className="prose prose-invert max-w-none text-sm text-gray-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:my-1"
            dangerouslySetInnerHTML={{ __html: metadata.requirements }}
          />
        </div>
      )}

      {/* Syllabus */}
      {metadata.syllabus && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Course Syllabus</h3>
          <div
            className="prose prose-invert max-w-none text-sm text-gray-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:my-1"
            dangerouslySetInnerHTML={{ __html: metadata.syllabus }}
          />
        </div>
      )}

      {/* Course Videos List */}
      {course.videos && course.videos.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#050505]/80 p-4">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Course Videos ({course.videos.length})
          </h3>
          <div className="space-y-3">
            {course.videos.map((video, idx) => (
              <div
                key={video._id || idx}
                className="flex items-start gap-4 rounded-lg border border-white/5 bg-[#0a0a0a]/50 p-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-sm font-semibold text-[#D4AF37]">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-white">{video.title}</h4>
                  {video.description && (
                    <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {video.duration > 0 && (
                      <span>Duration: {formatDuration(video.duration)}</span>
                    )}
                    {video.isPreview && (
                      <span className="rounded-full bg-[#D4AF37]/20 px-2 py-1 text-[#D4AF37]">
                        Preview
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Metadata */}
      <div className="grid gap-4 sm:grid-cols-2">
        {metadata.deliveryMode && (
          <div className="rounded-lg border border-white/10 bg-[#050505]/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Delivery Mode
            </p>
            <p className="mt-1 text-sm text-white">{metadata.deliveryMode}</p>
          </div>
        )}
        {metadata.lessonCount && (
          <div className="rounded-lg border border-white/10 bg-[#050505]/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Lessons
            </p>
            <p className="mt-1 text-sm text-white">{metadata.lessonCount}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePreview;

