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
import { useUser } from "../../src/contexts/UserContext";
import { fetchStudentProfile, updateStudentProfile } from "../../src/services/api/student";

const StudentProfile = () => {
  const { user: authUser, tokens } = useAuth();
  const { profile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    bio: "",
  });

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

        // Build address from location
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

        setFormData({
          fullName: authUser?.fullName || profile?.name || "",
          email: authUser?.email || "",
          phone: profileData?.phone || "",
          dateOfBirth: dateOfBirth,
          address: address,
          bio: profileData?.bio || "",
        });
      } catch (error) {
        console.error("Failed to load student profile:", error);
        // Fallback to authUser data
        setFormData({
          fullName: authUser?.fullName || "",
          email: authUser?.email || "",
          phone: profile?.contact?.phone || "",
          dateOfBirth: authUser?.metadata?.dateOfBirth || "",
          address: profile?.city && profile?.country 
            ? `${profile.city}, ${profile.country}` 
            : "",
          bio: profile?.bio || "",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudentProfile();
  }, [authUser, profile]);

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
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-3xl font-semibold">
                  {formData.fullName
                    ? formData.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    {formData.fullName || "Student"}
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
              <button className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Privacy Settings</p>
                    <p className="text-sm text-gray-400">Control your privacy and data</p>
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

export default StudentProfile;

