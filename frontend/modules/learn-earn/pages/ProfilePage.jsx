import { useMemo, useState, useEffect, useCallback } from "react";
import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaEdit,
  FaGlobe,
  FaLock,
  FaShieldAlt,
  FaSpinner,
  FaPlus,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { useUser } from "../../../src/contexts/UserContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { usePoints } from "../../../src/contexts/PointsContext";
import {
  verifySocialLink,
  fetchSocialLinks,
  addSocialLink,
  deleteSocialLink,
} from "../../../src/services/api/socialVerification";
import {
  fetchStudentProfile,
  updateStudentProfile,
  uploadProfileImage,
} from "../../../src/services/api/student";

const ProfilePage = () => {
  const { profile, updateProfile } = useUser();
  const { user: authUser, tokens, updateUserMetadata } = useAuth();
  const { refreshPoints } = usePoints();
  const [verifying, setVerifying] = useState(new Set());
  const [socialLinks, setSocialLinks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({ platform: "", url: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(new Set());
  const [studentProfile, setStudentProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingField, setSavingField] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const availablePlatforms = [
    "LinkedIn",
    "YouTube",
    "Instagram",
    "TikTok",
    "Twitter",
    "Facebook",
    "GitHub",
    "Website",
  ];

  // Load student profile from backend
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser?.id || !tokens?.accessToken) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        const profileData = await fetchStudentProfile(authUser.id);
        setStudentProfile(profileData);

        // Priority: StudentProfile.avatarUrl > User.metadata.avatarUrl > default
        const avatarUrl =
          profileData?.avatarUrl || authUser?.metadata?.avatarUrl || null;
        if (avatarUrl) {
          updateProfile({ avatar: avatarUrl });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load student profile:", error);
        // Profile might not exist yet, that's okay
        // Fallback to user metadata avatarUrl from registration
        if (authUser?.metadata?.avatarUrl) {
          updateProfile({ avatar: authUser.metadata.avatarUrl });
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [authUser, tokens, updateProfile]);

  // Load social links from backend on mount
  useEffect(() => {
    const loadSocialLinks = async () => {
      if (!authUser?.id || !tokens?.accessToken) {
        return;
      }

      try {
        const response = await fetchSocialLinks();
        // Always update socialLinks from backend, even if empty array (removes defaults)
        if (response?.socialLinks !== undefined) {
          // Only show verified links that user has manually added
          const verifiedLinks = (response.socialLinks || []).filter(
            (link) => link.verified === true
          );
          setSocialLinks(verifiedLinks);
          // Update profile with backend social links (all links, not just verified)
          updateProfile({ socialLinks: response.socialLinks });
        } else {
          // If backend doesn't return socialLinks, set to empty array
          setSocialLinks([]);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load social links from backend:", error);
        // Set to empty array on error to avoid showing default links
        setSocialLinks([]);
      }
    };

    loadSocialLinks();
  }, [authUser, tokens, updateProfile]);

  // Don't sync with profile.socialLinks to avoid showing default links
  // Only show verified links from backend

  const handleAddOrEdit = useCallback(async () => {
    if (!formData.platform || !formData.url) {
      toast.error("Please fill in both platform and URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.url);
    } catch {
      toast.error(
        "Please enter a valid URL (e.g., https://linkedin.com/in/yourprofile)"
      );
      return;
    }

    setSaving(true);

    try {
      const result = await addSocialLink({
        platform: formData.platform,
        url: formData.url,
      });

      if (result.success) {
        // Reload social links
        const response = await fetchSocialLinks();
        if (response?.socialLinks !== undefined) {
          // Only show verified links that user has manually added
          const verifiedLinks = (response.socialLinks || []).filter(
            (link) => link.verified === true
          );
          setSocialLinks(verifiedLinks);
          updateProfile({ socialLinks: response.socialLinks });
        }

        toast.success(
          `${formData.platform} link ${
            editingLink ? "updated" : "added"
          } successfully!`
        );
        setShowAddModal(false);
        setEditingLink(null);
        setFormData({ platform: "", url: "" });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to save social link:", error);
      const errorMessage =
        error.details?.error?.message ||
        error.message ||
        "Failed to save social link. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [formData, editingLink, updateProfile]);

  const handleDelete = useCallback(
    async (platform) => {
      if (!confirm(`Are you sure you want to delete your ${platform} link?`)) {
        return;
      }

      setDeleting((prev) => new Set(prev).add(platform));

      try {
        const result = await deleteSocialLink(platform);

        if (result.success) {
          // Reload social links
          const response = await fetchSocialLinks();
          if (response?.socialLinks !== undefined) {
            // Only show verified links that user has manually added
            const verifiedLinks = (response.socialLinks || []).filter(
              (link) => link.verified === true
            );
            setSocialLinks(verifiedLinks);
            updateProfile({ socialLinks: response.socialLinks });
          }

          toast.success(`${platform} link deleted successfully`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete social link:", error);
        const errorMessage =
          error.details?.error?.message ||
          error.message ||
          "Failed to delete social link. Please try again.";
        toast.error(errorMessage);
      } finally {
        setDeleting((prev) => {
          const next = new Set(prev);
          next.delete(platform);
          return next;
        });
      }
    },
    [updateProfile]
  );

  const openEditModal = useCallback((link) => {
    setEditingLink(link);
    setFormData({ platform: link.platform, url: link.url });
    setShowAddModal(true);
  }, []);

  const openAddModal = useCallback(() => {
    setEditingLink(null);
    setFormData({ platform: "", url: "" });
    setShowAddModal(true);
  }, []);

  const handleVerify = useCallback(
    async (link) => {
      if (verifying.has(link.platform)) {
        return;
      }

      if (!authUser || !tokens?.accessToken) {
        toast.error("Please log in to verify social links");
        return;
      }

      if (link.verified) {
        toast.info("This link is already verified");
        return;
      }

      setVerifying((prev) => new Set(prev).add(link.platform));

      try {
        const result = await verifySocialLink({
          platform: link.platform,
        });

        if (result.success) {
          // Reload social links from backend to get the verified link
          const response = await fetchSocialLinks();
          if (response?.socialLinks !== undefined) {
            // Only show verified links that user has manually added
            const verifiedLinks = (response.socialLinks || []).filter(
              (link) => link.verified === true
            );
            setSocialLinks(verifiedLinks);
            updateProfile({ socialLinks: response.socialLinks });
          }

          // Refresh points to show updated coin balance
          if (refreshPoints) {
            setTimeout(() => refreshPoints(), 500);
          }

          toast.success(
            `✅ ${link.platform} verified! +${result.points.coinsAwarded} coins awarded`,
            { icon: "🎉" }
          );
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to verify social link:", error);
        const errorMessage =
          error.details?.error?.message ||
          error.message ||
          "Failed to verify social link. Please try again.";
        toast.error(errorMessage);
      } finally {
        setVerifying((prev) => {
          const next = new Set(prev);
          next.delete(link.platform);
          return next;
        });
      }
    },
    [authUser, tokens, socialLinks, updateProfile, refreshPoints, verifying]
  );

  // Get field value from backend profile or fallback to context profile
  const getFieldValue = useCallback(
    (fieldName) => {
      if (!studentProfile) {
        // Fallback to context profile
        switch (fieldName) {
          case "englishLevel":
            return profile.englishLevel || "";
          case "profession":
            return profile.profession || "";
          case "experience":
            return profile.experience || "";
          case "country":
            return profile.country || "";
          case "city":
            return profile.city || "";
          case "maritalStatus":
            return profile.maritalStatus || "";
          default:
            return "";
        }
      }

      switch (fieldName) {
        case "englishLevel":
          return studentProfile.englishLevel || "";
        case "profession":
          return studentProfile.profession || "";
        case "experience":
          if (studentProfile.experience?.description) {
            return studentProfile.experience.description;
          }
          if (studentProfile.experience?.years) {
            return `${studentProfile.experience.years} years of experience`;
          }
          return "";
        case "country":
          return studentProfile.location?.country || "";
        case "city":
          return studentProfile.location?.city || "";
        case "maritalStatus":
          return studentProfile.maritalStatus || "";
        default:
          return "";
      }
    },
    [studentProfile, profile]
  );

  const getInterests = useCallback(() => {
    if (studentProfile?.interests && studentProfile.interests.length > 0) {
      return studentProfile.interests;
    }
    return profile.interests || [];
  }, [studentProfile, profile]);

  const infoGrid = useMemo(
    () => [
      {
        label: "English Level",
        value: getFieldValue("englishLevel"),
        field: "englishLevel",
      },
      {
        label: "Profession",
        value: getFieldValue("profession"),
        field: "profession",
      },
      {
        label: "Experience",
        value: getFieldValue("experience"),
        field: "experience",
      },
      { label: "Country", value: getFieldValue("country"), field: "country" },
      { label: "City", value: getFieldValue("city"), field: "city" },
      {
        label: "Marital Status",
        value: getFieldValue("maritalStatus"),
        field: "maritalStatus",
      },
    ],
    [getFieldValue]
  );

  const handleSaveField = useCallback(
    async (field, value) => {
      if (!authUser || !tokens?.accessToken) {
        toast.error("Please log in to update your profile");
        return;
      }

      setSavingField(field);

      try {
        let updatePayload = {};

        // Handle different field types
        if (field === "country" || field === "city") {
          // Update location object
          const currentLocation = studentProfile?.location || {};
          updatePayload.location = {
            ...currentLocation,
            [field]: value,
          };
        } else if (field === "experience") {
          // Parse experience string (e.g., "12 years of experience" -> {years: 12, description: value})
          const yearsMatch = value.match(/(\d+)\s*years?/i);
          const years = yearsMatch ? parseInt(yearsMatch[1], 10) : null;
          updatePayload.experience = {
            years: years || studentProfile?.experience?.years || null,
            description: value,
          };
        } else {
          updatePayload[field] = value;
        }

        const updatedProfile = await updateStudentProfile(updatePayload);

        // Update local state
        setStudentProfile(updatedProfile);
        setEditingField(null);
        setEditValue("");

        // Update context profile for display
        if (field === "country") {
          updateProfile({ country: value });
        } else if (field === "city") {
          updateProfile({ city: value });
        } else {
          updateProfile({ [field]: value });
        }

        toast.success(
          `${
            infoGrid.find((item) => item.field === field)?.label || field
          } updated successfully`
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to update profile field:", error);
        const errorMessage =
          error.details?.error?.message ||
          error.message ||
          "Failed to update profile. Please try again.";
        toast.error(errorMessage);
      } finally {
        setSavingField(null);
      }
    },
    [authUser, tokens, studentProfile, updateProfile, infoGrid]
  );

  const handleSaveInterests = useCallback(
    async (interests) => {
      if (!authUser || !tokens?.accessToken) {
        toast.error("Please log in to update your profile");
        return;
      }

      setSavingField("interests");

      try {
        const updatedProfile = await updateStudentProfile({
          interests: Array.isArray(interests)
            ? interests
            : interests
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean),
        });

        setStudentProfile(updatedProfile);
        setEditingField(null);
        setEditValue("");

        updateProfile({ interests: updatedProfile.interests || [] });

        toast.success("Interests updated successfully");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to update interests:", error);
        toast.error("Failed to update interests. Please try again.");
      } finally {
        setSavingField(null);
      }
    },
    [authUser, tokens, updateProfile]
  );

  const handleAvatarChange = useCallback(
    async (event) => {
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
        const avatarUrl = await uploadProfileImage(file);

        // Update StudentProfile (backend will also update User.metadata.avatarUrl)
        await updateStudentProfile({ avatarUrl });

        // Update AuthContext user metadata to reflect new avatar immediately
        await updateUserMetadata({ metadata: { avatarUrl } });

        // Update local profile context immediately
        updateProfile({ avatar: avatarUrl });

        // Reload profile to get updated data
        const profileData = await fetchStudentProfile(authUser.id);
        setStudentProfile(profileData);

        // Clear preview after successful upload
        setAvatarPreview(null);

        toast.success(
          "Profile photo updated successfully! It will appear everywhere in the app."
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to update profile photo:", error);
        toast.error(
          error.message || "Failed to update profile photo. Please try again."
        );
        setAvatarPreview(null);
      } finally {
        setUploadingAvatar(false);
        // Reset file input
        event.target.value = "";
      }
    },
    [updateStudentProfile, updateUserMetadata, updateProfile, authUser]
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#1f1f1f] via-[#0c0c0c] to-black">
        <div className="flex flex-col gap-6 px-6 pb-8 pt-6 sm:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-5">
              <div className="relative rounded-full border-4 border-black/80 p-1 group">
                <img
                  src={avatarPreview || profile.avatar}
                  alt={profile.name}
                  className="h-28 w-28 rounded-full border-4 border-[#D4AF37]/50 object-cover"
                />
                <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity cursor-pointer group-hover:opacity-100">
                  {uploadingAvatar ? (
                    <FaSpinner className="h-6 w-6 text-[#D4AF37] animate-spin" />
                  ) : (
                    <FaEdit className="h-6 w-6 text-[#D4AF37]" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
                  <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                    {profile.name}
                  </h1>
                  <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                    {profile.id}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm text-gray-300 sm:text-left">
                  {profile.title}
                </p>
                <p className="mt-3 text-sm text-gray-400 sm:text-left">
                  {profile.bio}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <Link
                to="/learn-earn/chat"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
                Message
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-[#D4AF37]/30 hover:brightness-110">
                <FaEdit className="h-3.5 w-3.5" />
                Edit profile
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                Followers
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {profile.followers.toLocaleString()}
              </p>
              <Link
                to="/learn-earn"
                className="mt-3 inline-flex text-xs font-semibold text-[#D4AF37]">
                View growth analytics →
              </Link>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                Following
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {profile.following.toLocaleString()}
              </p>
              <p className="mt-3 text-xs text-gray-400">
                Curating meaningful learning circles
              </p>
            </div>
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#151515] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                Community rating
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                ⭐ {profile.rating.toFixed(1)}
              </p>
              <p className="mt-3 text-xs text-gray-400">
                Top 5% of mentors on Learn & Earn
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                About
              </p>
              {authUser && tokens?.accessToken && (
                <button
                  type="button"
                  onClick={() => {
                    if (editingField === "all") {
                      // Cancel edit mode
                      setEditingField(null);
                      setEditValue("");
                    } else {
                      // Enable edit mode for all fields
                      setEditingField("all");
                    }
                  }}
                  className="text-xs font-semibold text-[#D4AF37] hover:text-[#E5C158] transition">
                  {editingField === "all" ? "Cancel" : "Edit All"}
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {infoGrid.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/5 bg-[#111] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
                      {item.label}
                    </p>
                    {authUser &&
                      tokens?.accessToken &&
                      editingField === "all" && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingField(item.field);
                            setEditValue(item.value);
                          }}
                          className="text-[10px] text-[#D4AF37] hover:text-[#E5C158] transition">
                          <FaEdit className="h-3 w-3" />
                        </button>
                      )}
                  </div>
                  {editingField === item.field ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveField(item.field, editValue);
                          } else if (e.key === "Escape") {
                            setEditingField(null);
                            setEditValue("");
                          }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveField(item.field, editValue)}
                          disabled={savingField === item.field}
                          className="flex-1 rounded-lg bg-[#D4AF37]/20 px-2 py-1 text-[10px] font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/30 disabled:opacity-50">
                          {savingField === item.field ? (
                            <>
                              <FaSpinner className="mr-1 inline h-2 w-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingField(null);
                            setEditValue("");
                          }}
                          className="flex-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold text-gray-400 transition hover:bg-white/10">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-white">
                      {item.value || (
                        <span className="text-gray-500 italic">Not set</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                Interests
              </p>
              {authUser && tokens?.accessToken && editingField === "all" && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingField("interests");
                    setEditValue(getInterests().join(", "));
                  }}
                  className="text-[10px] text-[#D4AF37] hover:text-[#E5C158] transition">
                  <FaEdit className="h-3 w-3" />
                </button>
              )}
            </div>
            {editingField === "interests" ? (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter interests separated by commas (e.g., Public Speaking, Leadership, Storytelling)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveInterests(editValue);
                    } else if (e.key === "Escape") {
                      setEditingField(null);
                      setEditValue("");
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveInterests(editValue)}
                    disabled={savingField === "interests"}
                    className="flex-1 rounded-lg bg-[#D4AF37]/20 px-2 py-1 text-[10px] font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/30 disabled:opacity-50">
                    {savingField === "interests" ? (
                      <>
                        <FaSpinner className="mr-1 inline h-2 w-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingField(null);
                      setEditValue("");
                    }}
                    className="flex-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold text-gray-400 transition hover:bg-white/10">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {getInterests().length > 0 ? (
                  getInterests().map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-200">
                      #{interest}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">
                    No interests added yet
                  </span>
                )}
              </div>
            )}
          </div>
        </Motion.div>
      </section>

      <section>
        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.32 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                Social verification
              </p>
              <p className="mt-1 text-xs text-gray-300">
                Add your social links, verify them, and earn bonus coins
              </p>
            </div>
            <div className="flex items-center gap-3">
              <FaShieldAlt className="h-5 w-5 text-[#D4AF37]" />
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-3 py-1.5 text-[10px] font-semibold text-black shadow-lg shadow-[#D4AF37]/30 hover:brightness-110">
                <FaPlus className="h-2.5 w-2.5" />
                Add Link
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {socialLinks.length > 0
              ? socialLinks.map((link) => (
                  <div
                    key={link.platform}
                    className="flex flex-col gap-2 rounded-xl border border-white/5 bg-[#111] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <FaGlobe className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {link.platform}
                        </p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#D4AF37]/90 underline-offset-4 hover:underline">
                          {link.url}
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        {link.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                            <FaCheckCircle className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVerify(link)}
                            disabled={verifying.has(link.platform)}
                            className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/25 disabled:opacity-50 disabled:cursor-not-allowed">
                            {verifying.has(link.platform) ? (
                              <>
                                <FaSpinner className="h-3 w-3 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <FaLock className="h-3 w-3" />
                                Verify & claim
                              </>
                            )}
                          </button>
                        )}
                        <span className="text-xs text-gray-400">
                          +{link.bonus || 0} coins
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(link)}
                          className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold text-gray-300 transition hover:bg-white/10">
                          <FaEdit className="h-2.5 w-2.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(link.platform)}
                          disabled={deleting.has(link.platform)}
                          className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                          {deleting.has(link.platform) ? (
                            <FaSpinner className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <FaTrash className="h-2.5 w-2.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              : null}
          </div>

          {/* Add/Edit Social Link Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {editingLink ? "Edit Social Link" : "Add Social Link"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingLink(null);
                      setFormData({ platform: "", url: "" });
                    }}
                    className="rounded-full p-1 text-gray-400 transition hover:bg-white/10 hover:text-white">
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-300">
                      Platform
                    </label>
                    <select
                      value={formData.platform}
                      onChange={(e) =>
                        setFormData({ ...formData, platform: e.target.value })
                      }
                      disabled={!!editingLink}
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">Select platform</option>
                      {availablePlatforms.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-300">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Enter the full URL of your profile (e.g.,
                      https://linkedin.com/in/yourname)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingLink(null);
                        setFormData({ platform: "", url: "" });
                      }}
                      className="flex-1 rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/5">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddOrEdit}
                      disabled={saving || !formData.platform || !formData.url}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                      {saving ? (
                        <>
                          <FaSpinner className="mr-2 inline h-3 w-3 animate-spin" />
                          Saving...
                        </>
                      ) : editingLink ? (
                        "Update Link"
                      ) : (
                        "Add Link"
                      )}
                    </button>
                  </div>
                </div>
              </Motion.div>
            </div>
          )}
        </Motion.div>
      </section>
    </div>
  );
};

export default ProfilePage;
