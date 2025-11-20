import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCalendarDays,
  HiOutlineMapPin,
  HiOutlineAcademicCap,
  HiOutlinePencil,
  HiOutlineXMark,
  HiOutlineLockClosed,
  HiOutlineBell,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { useUser } from "../../src/contexts/UserContext";
import { fetchStudentProfile, updateStudentProfile, uploadProfileImage } from "../../src/services/api/student";
import { apiRequest } from "../../src/services/api/baseClient";

const StudentProfile = () => {
  const { user: authUser, tokens, updateUserMetadata } = useAuth();
  const { profile, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    bio: "",
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    courseUpdates: true,
    jobAlerts: true,
    messages: true,
    announcements: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    showActivity: true,
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Fetch student profile from backend
  useEffect(() => {
    const loadStudentProfile = async () => {
      if (!authUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profileData = await fetchStudentProfile(authUser.id);
        setStudentProfile(profileData);

        // Get avatar URL - priority: StudentProfile.avatarUrl > User.metadata.avatarUrl > profile.avatar
        // This ensures we get the image uploaded during registration
        const avatar = 
          profileData?.avatarUrl || 
          authUser?.metadata?.avatarUrl || 
          profile?.avatar || 
          null;
        setAvatarUrl(avatar);

        // Build address from location (from registration: city, country)
        const addressParts = [];
        if (profileData?.location?.city) {
          addressParts.push(profileData.location.city);
        }
        if (profileData?.location?.country) {
          addressParts.push(profileData.location.country);
        }
        const address = addressParts.join(", ");

        // Get dateOfBirth from metadata if available
        const dateOfBirth = profileData?.metadata?.dateOfBirth || "";

        // Set form data with priority: StudentProfile data (from registration) > User metadata > fallback
        setFormData({
          fullName: authUser?.fullName || profile?.name || "",
          email: authUser?.email || "",
          // Phone from StudentProfile (set during registration)
          phone: profileData?.phone || authUser?.metadata?.phone || "",
          dateOfBirth: dateOfBirth,
          // Address from StudentProfile.location (set during registration)
          address: address || (authUser?.metadata?.city && authUser?.metadata?.country 
            ? `${authUser.metadata.city}, ${authUser.metadata.country}` 
            : ""),
          // Bio from StudentProfile (set during registration)
          bio: profileData?.bio || authUser?.metadata?.bio || profile?.bio || "",
        });
      } catch (error) {
        console.error("Failed to load student profile:", error);
        // Fallback to authUser metadata (which contains registration data)
        const fallbackAvatar = authUser?.metadata?.avatarUrl || profile?.avatar || null;
        setAvatarUrl(fallbackAvatar);
        
        // Fallback to user metadata which may contain registration data
        const fallbackAddress = 
          (authUser?.metadata?.city && authUser?.metadata?.country 
            ? `${authUser.metadata.city}, ${authUser.metadata.country}` 
            : "") ||
          (profile?.city && profile?.country 
            ? `${profile.city}, ${profile.country}` 
            : "");
        
        setFormData({
          fullName: authUser?.fullName || "",
          email: authUser?.email || "",
          phone: authUser?.metadata?.phone || profile?.contact?.phone || "",
          dateOfBirth: authUser?.metadata?.dateOfBirth || "",
          address: fallbackAddress,
          bio: authUser?.metadata?.bio || profile?.bio || "",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudentProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]); // Only depend on authUser.id to prevent multiple loads

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!authUser?.id || !tokens?.accessToken) {
      toast.error("Authentication required");
      return;
    }

    try {
      // Parse address into city and country
      const addressParts = formData.address.split(",").map((part) => part.trim());
      const city = addressParts[0] || "";
      const country = addressParts[1] || "";

      // Prepare update payload
      const updatePayload = {
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        location: {
          city: city || undefined,
          country: country || undefined,
        },
      };

      // Add metadata if dateOfBirth is provided
      if (formData.dateOfBirth) {
        updatePayload.metadata = {
          ...(studentProfile?.metadata || {}),
          dateOfBirth: formData.dateOfBirth,
        };
      }

      // Remove undefined fields
      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key] === undefined) {
          delete updatePayload[key];
        }
      });

      if (updatePayload.location) {
        if (!updatePayload.location.city && !updatePayload.location.country) {
          delete updatePayload.location;
        } else {
          // Remove undefined values from location
          if (!updatePayload.location.city) delete updatePayload.location.city;
          if (!updatePayload.location.country) delete updatePayload.location.country;
        }
      }

      // Update student profile
      const updatedProfile = await updateStudentProfile(updatePayload);
      setStudentProfile(updatedProfile);

      // Update avatar URL if it changed
      if (updatedProfile?.avatarUrl) {
        setAvatarUrl(updatedProfile.avatarUrl);
      }

      // Update formData with the response to reflect any server-side changes
      const updatedAddressParts = [];
      if (updatedProfile?.location?.city) {
        updatedAddressParts.push(updatedProfile.location.city);
      }
      if (updatedProfile?.location?.country) {
        updatedAddressParts.push(updatedProfile.location.country);
      }
      const updatedAddress = updatedAddressParts.join(", ");

      setFormData((prev) => ({
        ...prev,
        phone: updatedProfile?.phone || prev.phone,
        bio: updatedProfile?.bio || prev.bio,
        address: updatedAddress || prev.address,
        dateOfBirth: updatedProfile?.metadata?.dateOfBirth || prev.dateOfBirth,
      }));

      // Update fullName if changed (this updates the User model, not StudentProfile)
      if (formData.fullName !== authUser.fullName) {
        // Note: Updating fullName would require a separate API call to update the User model
        // For now, we'll just show a success message
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    // Reset form data to original values
    const addressParts = [];
    if (studentProfile?.location?.city) {
      addressParts.push(studentProfile.location.city);
    }
    if (studentProfile?.location?.country) {
      addressParts.push(studentProfile.location.country);
    }
    const address = addressParts.join(", ");

    setFormData({
      fullName: authUser?.fullName || "",
      email: authUser?.email || "",
      phone: studentProfile?.phone || "",
      dateOfBirth: studentProfile?.metadata?.dateOfBirth || "",
      address: address,
      bio: studentProfile?.bio || "",
    });
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      // Upload to Cloudinary
      const newAvatarUrl = await uploadProfileImage(file);

      // Update StudentProfile (backend will also update User.metadata.avatarUrl)
      await updateStudentProfile({ avatarUrl: newAvatarUrl });

      // Update AuthContext user metadata to reflect new avatar immediately
      await updateUserMetadata({ metadata: { avatarUrl: newAvatarUrl } });

      // Update local profile context immediately
      updateProfile({ avatar: newAvatarUrl });

      // Update local state
      setAvatarUrl(newAvatarUrl);
      setAvatarPreview(null);

      // Reload profile to get updated data
      const profileData = await fetchStudentProfile(authUser.id);
      setStudentProfile(profileData);

      toast.success("Profile photo updated successfully!");
    } catch (error) {
      console.error("Failed to update profile photo:", error);
      toast.error(error.message || "Failed to update profile photo. Please try again.");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setSavingPassword(true);
    try {
      // Note: This endpoint may need to be created in the backend
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
      });

      toast.success("Password changed successfully");
      setShowChangePasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error(error.message || "Failed to change password. Please check your current password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      // Save notification preferences to student profile metadata
      await updateStudentProfile({
        metadata: {
          ...(studentProfile?.metadata || {}),
          notificationPreferences: notificationSettings,
        },
      });

      toast.success("Notification preferences saved");
      setShowNotificationModal(false);
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      toast.error(error.message || "Failed to save notification preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      // Save privacy settings to student profile metadata
      await updateStudentProfile({
        metadata: {
          ...(studentProfile?.metadata || {}),
          privacySettings: privacySettings,
        },
      });

      toast.success("Privacy settings saved");
      setShowPrivacyModal(false);
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
      toast.error(error.message || "Failed to save privacy settings");
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Load settings from profile metadata
  useEffect(() => {
    if (studentProfile?.metadata) {
      if (studentProfile.metadata.notificationPreferences) {
        setNotificationSettings({
          ...notificationSettings,
          ...studentProfile.metadata.notificationPreferences,
        });
      }
      if (studentProfile.metadata.privacySettings) {
        setPrivacySettings({
          ...privacySettings,
          ...studentProfile.metadata.privacySettings,
        });
      }
    }
  }, [studentProfile]);

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
        title="Student Profile | Digital AELA"
        description="Manage your student profile and account settings"
        keywords="student profile, account settings"
        url="https://digitalaela.com/student/profile"
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
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full overflow-hidden relative bg-gradient-to-br from-sky-400 to-sky-600">
                    {(avatarPreview || avatarUrl) ? (
                      <img
                        src={avatarPreview || avatarUrl}
                        alt={formData.fullName || "Student"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Hide image on error, initials will show through background
                          e.target.style.display = "none";
                        }}
                      />
                    ) : null}
                    {!(avatarPreview || avatarUrl) && (
                      <div className="h-full w-full flex items-center justify-center text-3xl font-semibold text-white">
                        {formData.fullName
                          ? formData.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity cursor-pointer group-hover:opacity-100">
                      {uploadingAvatar ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <HiOutlinePencil className="h-6 w-6 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    {formData.fullName || "Student"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">{formData.email}</p>
                  {isEditing && (
                    <label className="mt-3 text-sm text-sky-400 hover:text-sky-300 cursor-pointer inline-block">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
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
                    <HiOutlineCalendarDays className="h-4 w-4" />
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                    />
                  ) : (
                    <p className="text-white">
                      {formData.dateOfBirth
                        ? new Date(formData.dateOfBirth).toLocaleDateString()
                        : "Not provided"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineMapPin className="h-4 w-4" />
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                      placeholder="Enter your address"
                    />
                  ) : (
                    <p className="text-white">{formData.address || "Not provided"}</p>
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
                      placeholder="Tell us about yourself..."
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
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Change Password</p>
                    <p className="text-sm text-gray-400">Update your account password</p>
                  </div>
                  <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                </div>
              </button>
              <button
                onClick={() => setShowNotificationModal(true)}
                className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Notification Preferences</p>
                    <p className="text-sm text-gray-400">Manage your notification settings</p>
                  </div>
                  <HiOutlineBell className="h-5 w-5 text-gray-400" />
                </div>
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Privacy Settings</p>
                    <p className="text-sm text-gray-400">Control your privacy and data</p>
                  </div>
                  <HiOutlineShieldCheck className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Change Password Modal */}
          <AnimatePresence>
            {showChangePasswordModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#060A17] rounded-2xl border border-white/10 p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Change Password</h3>
                    <button
                      onClick={() => setShowChangePasswordModal(false)}
                      className="text-gray-400 hover:text-white transition">
                      <HiOutlineXMark className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowChangePasswordModal(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={savingPassword}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition disabled:opacity-50">
                        {savingPassword ? "Saving..." : "Change Password"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Notification Preferences Modal */}
          <AnimatePresence>
            {showNotificationModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#060A17] rounded-2xl border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Notification Preferences</h3>
                    <button
                      onClick={() => setShowNotificationModal(false)}
                      className="text-gray-400 hover:text-white transition">
                      <HiOutlineXMark className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-400">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              email: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-400">Receive push notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.push}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              push: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-400">Receive notifications via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.sms}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              sms: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Course Updates</p>
                        <p className="text-sm text-gray-400">Get notified about course updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.courseUpdates}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              courseUpdates: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Job Alerts</p>
                        <p className="text-sm text-gray-400">Get notified about new job opportunities</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.jobAlerts}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              jobAlerts: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Messages</p>
                        <p className="text-sm text-gray-400">Get notified about new messages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.messages}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              messages: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white font-medium">Announcements</p>
                        <p className="text-sm text-gray-400">Get notified about platform announcements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.announcements}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              announcements: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowNotificationModal(false)}
                        className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotifications}
                        disabled={savingNotifications}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition disabled:opacity-50">
                        {savingNotifications ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Privacy Settings Modal */}
          <AnimatePresence>
            {showPrivacyModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#060A17] rounded-2xl border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Privacy Settings</h3>
                    <button
                      onClick={() => setShowPrivacyModal(false)}
                      className="text-gray-400 hover:text-white transition">
                      <HiOutlineXMark className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Visibility
                      </label>
                      <select
                        value={privacySettings.profileVisibility}
                        onChange={(e) =>
                          setPrivacySettings({
                            ...privacySettings,
                            profileVisibility: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="friends">Friends Only</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Show Email</p>
                        <p className="text-sm text-gray-400">Display your email on profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showEmail}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showEmail: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Show Phone</p>
                        <p className="text-sm text-gray-400">Display your phone on profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showPhone}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showPhone: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Show Location</p>
                        <p className="text-sm text-gray-400">Display your location on profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showLocation}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showLocation: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">Allow Messages</p>
                        <p className="text-sm text-gray-400">Allow others to message you</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.allowMessages}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              allowMessages: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white font-medium">Show Activity</p>
                        <p className="text-sm text-gray-400">Show your activity to others</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showActivity}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showActivity: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowPrivacyModal(false)}
                        className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePrivacy}
                        disabled={savingPrivacy}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition disabled:opacity-50">
                        {savingPrivacy ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentProfile;

