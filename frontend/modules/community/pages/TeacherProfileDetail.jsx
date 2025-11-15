import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaArrowLeft, FaSpinner, FaUser, FaGraduationCap, FaEnvelope, FaLink, FaGlobe, FaLinkedin, FaTwitter, FaPhone, FaCertificate, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import { apiRequest } from "../../../src/services/api/baseClient";

const TeacherProfileDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        // Fetch teacher profile from public endpoint
        const profileData = await apiRequest(`/teachers/${userId}/profile`, {
          skipAuth: true,
        });
        setUser(profileData);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load teacher profile");
        navigate("/student/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <FaSpinner className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-4">This teacher profile does not exist.</p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="bg-[#D4AF37] text-black py-2 px-6 rounded-lg font-bold hover:bg-[#E5C158] transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const userData = user?.user || {};
  const expertise = user?.expertise || "English Language";
  const bio = user?.bio || user?.about || "";
  const about = user?.about || user?.bio || "";
  const experienceYears = user?.experienceYears || 0;
  const experience = user?.experience || "";
  const certifications = user?.certifications || [];
  const specializations = user?.specializations || user?.primarySubjects || [];
  const portfolioLink = user?.portfolioLink || "";
  const preferredDelivery = user?.preferredDelivery || "";
  const timeZones = user?.timeZones || "";
  const phone = user?.phone || "";
  const socials = user?.socials || {};

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`${userData.fullName || "Teacher"} | Digital AELA`}
        description={bio || `View ${userData.fullName || "teacher"}'s profile on Digital AELA`}
        keywords={`teacher profile, ${userData.fullName}, Digital AELA`}
        url={`https://digitalaela.com/community/teachers/${userId}`}
      />

      <div className="layout-container pt-24 pb-20">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors">
          <FaArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-[#080808]/80 p-8 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={userData.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#D4AF37]/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-4 border-[#D4AF37]/30">
                  <FaGraduationCap className="w-16 h-16 text-[#D4AF37]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{userData.fullName || "Teacher"}</h1>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-4 py-1 rounded-full bg-[#D4AF37]/20 text-[#F5D26A] text-sm border border-[#D4AF37]/30">
                  Teacher
                </span>
                <span className="px-4 py-1 rounded-full bg-sky-500/20 text-sky-200 text-sm border border-sky-500/30">
                  {expertise}
                </span>
              </div>
              {bio && (
                <p className="text-gray-300 mb-4">{bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {userData.email && (
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="w-4 h-4" />
                    <span>{userData.email}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2">
                    <FaPhone className="w-4 h-4" />
                    <span>{phone}</span>
                  </div>
                )}
                {experienceYears > 0 && (
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="w-4 h-4" />
                    <span>{experienceYears} years experience</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          {(socials.linkedin || socials.website || socials.twitter) && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Connect</h2>
              <div className="flex flex-wrap gap-4">
                {socials.linkedin && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaLinkedin className="w-5 h-5 text-[#D4AF37]" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {socials.website && (
                  <a
                    href={socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaGlobe className="w-5 h-5 text-[#D4AF37]" />
                    <span>Website</span>
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaTwitter className="w-5 h-5 text-[#D4AF37]" />
                    <span>Twitter</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* About */}
          {about && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <p className="text-gray-300">{about}</p>
            </div>
          )}

          {/* Experience */}
          {(experienceYears > 0 || experience) && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Experience</h2>
              {experienceYears > 0 && (
                <p className="text-gray-300 mb-2">
                  <span className="font-semibold text-[#D4AF37]">{experienceYears} years</span> of teaching experience
                </p>
              )}
              {experience && (
                <p className="text-gray-300">{experience}</p>
              )}
            </div>
          )}

          {/* Expertise & Specializations */}
          <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
            <h2 className="text-xl font-semibold text-white mb-4">Expertise</h2>
            <p className="text-gray-300 text-lg mb-4">{expertise}</p>
            {specializations && specializations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 text-sm border border-sky-500/30">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaCertificate className="w-5 h-5 text-[#D4AF37]" />
                Certifications
              </h2>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#F5D26A] text-sm border border-[#D4AF37]/30">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preferredDelivery && (
              <div className="p-4 rounded-xl border border-white/10 bg-[#0b0b0b]/80">
                <p className="text-sm text-gray-400 mb-1">Preferred Delivery</p>
                <p className="text-lg font-semibold text-white capitalize">{preferredDelivery}</p>
              </div>
            )}
            {timeZones && (
              <div className="p-4 rounded-xl border border-white/10 bg-[#0b0b0b]/80">
                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <FaClock className="w-4 h-4" />
                  Time Zone
                </p>
                <p className="text-lg font-semibold text-white">{timeZones}</p>
              </div>
            )}
            {portfolioLink && (
              <div className="p-4 rounded-xl border border-white/10 bg-[#0b0b0b]/80">
                <p className="text-sm text-gray-400 mb-1">Portfolio</p>
                <a
                  href={portfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-[#D4AF37] hover:text-[#F5D26A] transition-colors break-all">
                  View Portfolio
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherProfileDetail;

