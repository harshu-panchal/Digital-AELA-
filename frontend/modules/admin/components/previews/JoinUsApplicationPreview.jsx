import { useState } from "react";
import { FaDownload, FaFile, FaImage, FaVideo, FaExternalLinkAlt } from "react-icons/fa";

const JoinUsApplicationPreview = ({ application }) => {
  const [expandedImage, setExpandedImage] = useState(null);

  if (!application) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/")) return <FaImage className="h-5 w-5" />;
    if (fileType?.startsWith("video/")) return <FaVideo className="h-5 w-5" />;
    return <FaFile className="h-5 w-5" />;
  };

  const renderAttachment = (attachment) => {
    const isImage = attachment.fileType?.startsWith("image/");
    const isVideo = attachment.fileType?.startsWith("video/");
    const isDocument = !isImage && !isVideo;

    return (
      <div
        key={attachment.fieldName}
        className="rounded-xl border border-white/10 bg-[#060606]/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-[#F5D26A]">{getFileIcon(attachment.fileType)}</div>
            <div>
              <p className="text-sm font-semibold text-white capitalize">
                {attachment.fieldName.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-xs text-gray-400">{attachment.fileName}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</div>
        </div>

        {isImage && (
          <div className="space-y-2">
            <div
              className="relative cursor-pointer overflow-hidden rounded-lg border border-white/10"
              onClick={() => setExpandedImage(attachment.url)}>
              <img
                src={attachment.url}
                alt={attachment.fileName}
                className="h-auto w-full max-h-64 object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                <FaExternalLinkAlt className="h-6 w-6 text-white" />
              </div>
            </div>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-xs font-semibold text-[#F5D26A] transition hover:bg-[#D4AF37]/20">
              <FaDownload className="h-3 w-3" />
              View Full Size
            </a>
          </div>
        )}

        {isVideo && (
          <div className="space-y-2">
            <video
              src={attachment.url}
              controls
              className="h-auto w-full rounded-lg border border-white/10"
              preload="none">
              Your browser does not support the video tag.
            </video>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-xs font-semibold text-[#F5D26A] transition hover:bg-[#D4AF37]/20">
              <FaDownload className="h-3 w-3" />
              Download Video
            </a>
          </div>
        )}

        {isDocument && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-[#F5D26A] transition hover:bg-[#D4AF37]/20">
            <FaDownload className="h-4 w-4" />
            Download Document
          </a>
        )}
      </div>
    );
  };

  const renderFormField = (key, value) => {
    if (!value || value === "") return null;

    // Skip internal fields
    if (key.startsWith("_") || key === "id") return null;

    return (
      <div key={key} className="rounded-xl border border-white/10 bg-[#060606]/80 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {key.replace(/([A-Z])/g, " $1").trim()}
        </p>
        <p className="text-sm text-gray-300">
          {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            {application.formData?.fullName || "Unknown Applicant"}
          </h1>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
              application.status === "pending"
                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                : application.status === "approved"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
            {application.status?.toUpperCase()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          <span className="capitalize">{application.applicationType} Application</span>
          <span>•</span>
          <span>Submitted: {formatDate(application.submittedAt)}</span>
          {application.reviewedAt && (
            <>
              <span>•</span>
              <span>Reviewed: {formatDate(application.reviewedAt)}</span>
            </>
          )}
        </div>
        {application.formData?.email && (
          <p className="text-base text-gray-300">
            <span className="font-semibold text-white">Email:</span> {application.formData.email}
          </p>
        )}
        {application.formData?.phone && (
          <p className="text-base text-gray-300">
            <span className="font-semibold text-white">Phone:</span> {application.formData.phone}
          </p>
        )}
      </div>

      {/* Attachments */}
      {application.attachments && application.attachments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Attachments</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {application.attachments.map((attachment) => renderAttachment(attachment))}
          </div>
        </div>
      )}

      {/* Form Data */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Application Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {application.formData &&
            Object.entries(application.formData)
              .filter(([key]) => !["email", "phone", "fullName"].includes(key))
              .map(([key, value]) => renderFormField(key, value))}
        </div>
      </div>

      {/* Rejection Reason */}
      {application.status === "rejected" && application.rejectionReason && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="mb-2 text-sm font-semibold text-red-400">Rejection Reason</p>
          <p className="text-sm text-gray-300">{application.rejectionReason}</p>
        </div>
      )}

      {/* Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpandedImage(null)}>
          <div className="relative max-h-full max-w-full">
            <img
              src={expandedImage}
              alt="Expanded view"
              className="max-h-[90vh] max-w-full object-contain"
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinUsApplicationPreview;

