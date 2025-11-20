import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCalendarDays,
  HiOutlineAcademicCap,
  HiOutlinePencil,
  HiOutlinePhoto,
  HiOutlineXMark,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getTeacherProfile, updateTeacherProfile } from "../../src/services/api/teacher";

const TeacherProfile = () => {
  const { user: authUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    expertise: "",
    experience: "",
    experienceYears: 0,
    portfolioLink: "",
    certifications: [],
    specializations: [],
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getTeacherProfile();
        setProfileData(data);
        setFormData({
          fullName: data.user?.fullName || "",
          email: data.user?.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          expertise: data.expertise || "",
          experience: data.experience || "",
          experienceYears: data.experienceYears || 0,
          portfolioLink: data.portfolioLink || "",
          certifications: Array.isArray(data.certifications) ? data.certifications : [],
          specializations: Array.isArray(data.specializations) ? data.specializations : [],
        });
        setAvatarUrl(data.avatarUrl || "");
      } catch (error) {
        console.error("Failed to fetch teacher profile:", error);
        toast.error(error.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authUser?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Get the file if a new one was selected
      const profileImage = fileInputRef.current?.files?.[0] || null;

      // Prepare update data
      const updateData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        expertise: formData.expertise.trim(),
        experience: formData.experience.trim(),
        experienceYears: formData.experienceYears || 0,
        portfolioLink: formData.portfolioLink.trim(),
        certifications: formData.certifications,
        specializations: formData.specializations,
      };

      // Update profile
      const updatedProfile = await updateTeacherProfile(updateData, profileImage);

      // Update local state
      setProfileData(updatedProfile);
      setAvatarUrl(updatedProfile.avatarUrl || "");
      setAvatarPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh user context to get updated data
      if (refreshUser) {
        await refreshUser();
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Reset form data to original profile data
    if (profileData) {
      setFormData({
        fullName: profileData.user?.fullName || "",
        email: profileData.user?.email || "",
        phone: profileData.phone || "",
        bio: profileData.bio || "",
        expertise: profileData.expertise || "",
        experience: profileData.experience || "",
        experienceYears: profileData.experienceYears || 0,
        portfolioLink: profileData.portfolioLink || "",
        certifications: Array.isArray(profileData.certifications) ? profileData.certifications : [],
        specializations: Array.isArray(profileData.specializations) ? profileData.specializations : [],
      });
      setAvatarUrl(profileData.avatarUrl || "");
    }
  };

  // Display initials or avatar
  const displayAvatar = () => {
    if (avatarPreview) {
      return <img src={avatarPreview} alt="Profile preview" className="h-full w-full rounded-full object-cover" />;
    }
    if (avatarUrl) {
      return <img src={avatarUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />;
    }
    return (
      <span className="text-3xl font-semibold text-white">
        {formData.fullName
          ? formData.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "T"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020409] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5D26A] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Teacher Profile | Digital AELA"
        description="Manage your teacher profile and account settings"
        keywords="teacher profile, account settings"
        url="https://digitalaela.com/teacher/profile"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
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
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <div className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center overflow-hidden">
                  {displayAvatar()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    {formData.fullName || "Teacher"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">{formData.email}</p>
                  {isEditing && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="text-sm text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
                        <HiOutlinePhoto className="h-4 w-4" />
                        {avatarPreview ? "Change Photo" : "Upload Photo"}
                      </label>
                      {(avatarPreview || avatarUrl) && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                          <HiOutlineXMark className="h-4 w-4" />
                          Remove
                        </button>
                      )}
                    </div>
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

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineCalendarDays className="h-4 w-4" />
                    Experience (Years)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="experienceYears"
                      value={formData.experienceYears}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                      placeholder="e.g., 5"
                    />
                  ) : (
                    <p className="text-white">{formData.experienceYears || 0} years</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineAcademicCap className="h-4 w-4" />
                    Portfolio Link
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="portfolioLink"
                      value={formData.portfolioLink}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                      placeholder="https://your-portfolio.com"
                    />
                  ) : (
                    <p className="text-white">
                      {formData.portfolioLink ? (
                        <a
                          href={formData.portfolioLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300">
                          {formData.portfolioLink}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineCalendarDays className="h-4 w-4" />
                    Experience Description
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
                    <p className="text-white whitespace-pre-wrap">{formData.bio || "No bio provided"}</p>
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
