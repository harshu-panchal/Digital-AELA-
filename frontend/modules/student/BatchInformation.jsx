import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineMapPin,
  HiOutlineLink,
  HiOutlineDocumentText,
  HiOutlineCalendar,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getMyBatch } from "../../src/services/api/batches";

const BatchInformation = () => {
  const { user } = useAuth();
  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBatch();
  }, []);

  const loadBatch = async () => {
    setIsLoading(true);
    try {
      const response = await getMyBatch();
      setBatch(response.batch);
    } catch (error) {
      if (error.message?.includes("No active batch")) {
        setBatch(null);
      } else {
        toast.error(error.message || "Failed to load batch information");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    // Convert 24-hour to 12-hour format
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "upcoming":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "completed":
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getDayAbbreviation = (day) => {
    const days = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    };
    return days[day.toLowerCase()] || day;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white">
        <SEO title="Batch Information | Digital AELA" description="View your batch information" />
        <div className="text-center py-12">
          <p className="text-slate-400">Loading batch information...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen text-white">
        <SEO title="Batch Information | Digital AELA" description="View your batch information" />
        <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
          <HiOutlineAcademicCap className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">No Active Batch</h2>
          <p className="text-slate-400 mb-4">
            You are not currently enrolled in any active batch.
          </p>
          <p className="text-sm text-slate-500">
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <SEO title="Batch Information | Digital AELA" description="View your batch information" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{batch.name}</h1>
            <p className="text-slate-400">Batch Code: {batch.code}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
              batch.status
            )}`}>
            {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
          </span>
        </div>

        {batch.description && (
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <p className="text-slate-300">{batch.description}</p>
          </div>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <HiOutlineCalendarDays className="h-5 w-5" />
              Important Dates
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Start Date</p>
                <p className="text-lg font-semibold text-white">{formatDate(batch.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">End Date</p>
                <p className="text-lg font-semibold text-white">{formatDate(batch.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Duration</p>
                <p className="text-lg font-semibold text-white">
                  {Math.ceil((new Date(batch.endDate) - new Date(batch.startDate)) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </motion.div>

          {/* Schedule */}
          {batch.schedule && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <HiOutlineClock className="h-5 w-5" />
                Schedule
              </h2>
              <div className="space-y-3">
                {batch.schedule.days && batch.schedule.days.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Days</p>
                    <div className="flex flex-wrap gap-2">
                      {batch.schedule.days.map((day, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-semibold border border-blue-500/40">
                          {getDayAbbreviation(day)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {batch.schedule.time && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Time</p>
                    <p className="text-lg font-semibold text-white">
                      {formatTime(batch.schedule.time.start)} - {formatTime(batch.schedule.time.end)}
                    </p>
                  </div>
                )}
                {batch.schedule.timezone && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Timezone</p>
                    <p className="text-sm text-white">{batch.schedule.timezone}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Course Information */}
          {batch.course && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <HiOutlineAcademicCap className="h-5 w-5" />
                Course
              </h2>
              <div>
                <p className="text-lg font-semibold text-white">{batch.course.title}</p>
                {batch.course.description && (
                  <p className="text-sm text-slate-400 mt-2">{batch.course.description}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Instructor */}
          {batch.instructor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <HiOutlineUserGroup className="h-5 w-5" />
                Instructor
              </h2>
              <div className="flex items-center gap-3">
                {batch.instructor.profilePicture ? (
                  <img
                    src={batch.instructor.profilePicture}
                    alt={batch.instructor.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E5C158] flex items-center justify-center text-black font-semibold">
                    {batch.instructor.fullName?.charAt(0) || "I"}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-white">{batch.instructor.fullName}</p>
                  <p className="text-sm text-slate-400">{batch.instructor.email}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Batch Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <HiOutlineUserGroup className="h-5 w-5" />
              Batch Members
            </h2>
            <div className="mb-4">
              <p className="text-sm text-slate-400">
                {batch.enrolledCount || batch.students?.length || 0} of {batch.capacity} students enrolled
              </p>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#D4AF37] to-[#E5C158] h-2 rounded-full"
                  style={{
                    width: `${((batch.enrolledCount || batch.students?.length || 0) / batch.capacity) * 100}%`,
                  }}
                />
              </div>
            </div>
            {batch.students && batch.students.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {batch.students.map((student) => (
                  <div key={student._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    {student.profilePicture ? (
                      <img
                        src={student.profilePicture}
                        alt={student.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                        {student.fullName?.charAt(0) || "S"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{student.fullName}</p>
                      <p className="text-xs text-slate-400">{student.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Additional Information */}
          {batch.metadata && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <HiOutlineDocumentText className="h-5 w-5" />
                Additional Information
              </h2>
              <div className="space-y-3">
                {batch.metadata.location && (
                  <div className="flex items-start gap-2">
                    <HiOutlineMapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-400">Location</p>
                      <p className="text-white">{batch.metadata.location}</p>
                    </div>
                  </div>
                )}
                {batch.metadata.meetingLink && (
                  <div className="flex items-start gap-2">
                    <HiOutlineLink className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-400">Meeting Link</p>
                      <a
                        href={batch.metadata.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline">
                        {batch.metadata.meetingLink}
                      </a>
                    </div>
                  </div>
                )}
                {batch.metadata.notes && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Notes</p>
                    <p className="text-white text-sm">{batch.metadata.notes}</p>
                  </div>
                )}
                {batch.metadata.resources && batch.metadata.resources.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Resources</p>
                    <div className="space-y-2">
                      {batch.metadata.resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                          <p className="text-sm font-medium text-white">{resource.title}</p>
                          <p className="text-xs text-slate-400">{resource.type || "Resource"}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchInformation;

