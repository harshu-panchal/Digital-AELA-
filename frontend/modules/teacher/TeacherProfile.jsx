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
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiRequest } from "../../src/services/api/baseClient";

const TeacherProfile = () => {
  const { user: authUser, tokens, updateUserMetadata } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    expertise: "",
    experience: "",
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser?.fullName || "",
        email: authUser?.email || "",
        phone: authUser?.phone || authUser?.metadata?.phone || "",
        bio: authUser?.bio || authUser?.metadata?.bio || authUser?.metadata?.about || "",
        expertise: authUser?.expertise || authUser?.metadata?.expertise || "",
        experience: authUser?.experience || authUser?.metadata?.experience || "",
      });
      // Reset image error when user changes
      setImageError(false);
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
      phone: userData?.phone || userData?.metadata?.phone || "",
      bio: userData?.bio || userData?.metadata?.bio || userData?.metadata?.about || "",
      expertise: userData?.expertise || userData?.metadata?.expertise || "",
      experience: userData?.experience || userData?.metadata?.experience || "",
    });
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

    if (!tokens?.accessToken) {
      toast.error("Authentication required");
      return;
    }

    setSavingPassword(true);
    try {
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
    if (!authUser?.id || !tokens?.accessToken) {
      toast.error("Authentication required");
      return;
    }

    setSavingNotifications(true);
    try {
      // Save notification preferences to backend
      const response = await apiRequest("/auth/profile", {
        method: "PATCH",
        body: {
          metadata: {
            ...(authUser?.metadata || {}),
            notificationPreferences: notificationSettings,
          },
        },
      });

      // Update local user state using AuthContext
      if (response?.user) {
        await updateUserMetadata({
          metadata: response.user.metadata,
        });
      }

      toast.success("Notification preferences saved");
      setShowNotificationModal(false);
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      toast.error(error.message || "Failed to save notification preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  // Load notification settings from user metadata
  useEffect(() => {
    if (authUser?.metadata?.notificationPreferences) {
      setNotificationSettings((prev) => ({
        ...prev,
        ...authUser.metadata.notificationPreferences,
      }));
    }
  }, [authUser?.metadata?.notificationPreferences]);

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
                {authUser?.metadata?.avatarUrl && !imageError ? (
                  <img
                    src={authUser.metadata.avatarUrl}
                    alt={formData.fullName || "Teacher"}
                    className="h-24 w-24 rounded-full object-cover border-2 border-[#F5D26A]/40"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-3xl font-semibold">
                    {formData.fullName
                      ? formData.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "T"}
                  </div>
                )}
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
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherProfile;

