import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCalendarDays,
  HiOutlineMapPin,
  HiOutlineAcademicCap,
  HiOutlinePencil,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";

const TeacherProfile = () => {
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    expertise: "",
    experience: "",
  });

  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser?.fullName || "",
        email: authUser?.email || "",
        phone: authUser?.phone || "",
        bio: authUser?.bio || "",
        expertise: authUser?.expertise || "",
        experience: authUser?.experience || "",
      });
    }
  }, [authUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update profile
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    const userData = authUser;
    setFormData({
      fullName: userData?.fullName || "",
      email: userData?.email || "",
      phone: userData?.phone || "",
      bio: userData?.bio || "",
      expertise: userData?.expertise || "",
      experience: userData?.experience || "",
    });
  };

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Teacher Profile | Digital AELA"
        description="Manage your teacher profile and account settings"
        keywords="teacher profile, account settings"
        url="https://digitalaela.com/teacher/profile"
      />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">Profile Settings</h1>
              <p className="text-sm text-gray-400 mt-1">Manage your account information</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition">
                <HiOutlinePencil className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition">
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <div className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-3xl font-semibold">
                  {formData.fullName
                    ? formData.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "T"}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    {formData.fullName || "Teacher"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">{formData.email}</p>
                  {isEditing && (
                    <button className="mt-3 text-sm text-sky-400 hover:text-sky-300">
                      Change Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineUser className="h-4 w-4" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-white">{formData.fullName || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineEnvelope className="h-4 w-4" />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-white">{formData.email || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlinePhone className="h-4 w-4" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-white">{formData.phone || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineAcademicCap className="h-4 w-4" />
                    Expertise
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="expertise"
                      value={formData.expertise}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                      placeholder="e.g., English, Mathematics, Science"
                    />
                  ) : (
                    <p className="text-white">{formData.expertise || "Not provided"}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineCalendarDays className="h-4 w-4" />
                    Experience
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                      placeholder="e.g., 5 years of teaching experience"
                    />
                  ) : (
                    <p className="text-white">{formData.experience || "Not provided"}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineAcademicCap className="h-4 w-4" />
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30 resize-none"
                      placeholder="Tell us about yourself and your teaching philosophy..."
                    />
                  ) : (
                    <p className="text-white">{formData.bio || "No bio provided"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
            <div className="space-y-4">
              <button className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Change Password</p>
                    <p className="text-sm text-gray-400">Update your account password</p>
                  </div>
                  <HiOutlinePencil className="h-5 w-5 text-gray-400" />
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Notification Preferences</p>
                    <p className="text-sm text-gray-400">Manage your notification settings</p>
                  </div>
                  <HiOutlinePencil className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherProfile;

