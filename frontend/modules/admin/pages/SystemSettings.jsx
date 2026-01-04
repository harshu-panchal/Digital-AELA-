import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaSpinner,
  FaSave,
  FaUndo,
  FaCog,
  FaEnvelope,
  FaCreditCard,
  FaToggleOn,
  FaToggleOff,
  FaWrench,
  FaShareAlt,
  FaSearch,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  fetchAllSettings,
  fetchSettingsByCategory,
  updateSettings,
  updateSetting,
  initializeDefaultSettings,
  requestFinancialPasswordReset,
} from "../../../src/services/api/superAdmin";
import { changePassword } from "../../../src/services/api/auth";

const SystemSettings = () => {
  const [activeCategory, setActiveCategory] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [financialPasswordExists, setFinancialPasswordExists] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });

  const categories = [
    { id: "general", label: "General", icon: FaCog },
    { id: "security", label: "Security", icon: FaLock },
    { id: "email", label: "Email", icon: FaEnvelope },
    { id: "payment", label: "Payment", icon: FaCreditCard },
    { id: "features", label: "Features", icon: FaToggleOn },
    { id: "maintenance", label: "Maintenance", icon: FaWrench },
    { id: "social", label: "Social Media", icon: FaShareAlt },
    { id: "seo", label: "SEO", icon: FaSearch },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    checkForChanges();
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetchAllSettings();
      if (response && response.settings) {
        setSettings(response.settings);
        setOriginalSettings(JSON.parse(JSON.stringify(response.settings)));

        // Check if financial password exists
        const generalSettings = response.settings.general || [];
        const financialPasswordSetting = generalSettings.find(
          (s) => s.key === "financial.password"
        );
        setFinancialPasswordExists(!!financialPasswordSetting);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = () => {
    const changed =
      JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  };

  const handleSettingChange = (category, key, value, type) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      if (!newSettings[category]) {
        newSettings[category] = [];
      }

      const categorySettings = [...(newSettings[category] || [])];
      const existingIndex = categorySettings.findIndex((s) => s.key === key);

      let convertedValue = value;
      if (type === "boolean") {
        convertedValue = value === true || value === "true" || value === 1;
      } else if (type === "number") {
        convertedValue = Number(value);
      }

      if (existingIndex >= 0) {
        categorySettings[existingIndex] = {
          ...categorySettings[existingIndex],
          value: convertedValue,
        };
      } else {
        categorySettings.push({
          key,
          value: convertedValue,
          type,
        });
      }

      newSettings[category] = categorySettings;
      return newSettings;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Collect all changed settings
      const settingsToUpdate = [];
      Object.keys(settings).forEach((category) => {
        settings[category].forEach((setting) => {
          const original = originalSettings[category]?.find(
            (s) => s.key === setting.key
          );
          if (
            !original ||
            JSON.stringify(original.value) !== JSON.stringify(setting.value)
          ) {
            settingsToUpdate.push({
              key: setting.key,
              value: setting.value,
              category,
              type: setting.type,
            });
          }
        });
      });

      if (settingsToUpdate.length === 0) {
        toast.info("No changes to save");
        return;
      }

      const response = await updateSettings(settingsToUpdate);
      if (response) {
        toast.success(
          `Successfully updated ${settingsToUpdate.length} setting(s)`
        );
        await loadSettings(); // Reload to get updated data

        // If social media settings were updated, clear the cache and notify
        const hasSocialSettings = settingsToUpdate.some(
          (s) => s.category === "social" || s.key?.startsWith("social.")
        );
        if (hasSocialSettings) {
          // Dispatch event to clear cache in useSocialMedia hook
          window.dispatchEvent(new Event("socialSettingsUpdated"));
        }
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    toast.info("Settings reset to original values");
  };

  const handleInitialize = async () => {
    try {
      setSaving(true);
      const response = await initializeDefaultSettings();
      if (response) {
        toast.success(
          `Initialized ${response.initialized || 0} default settings`
        );
        await loadSettings();
      }
    } catch (error) {
      console.error("Failed to initialize settings:", error);
      toast.error("Failed to initialize default settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestFinancialPasswordReset = async () => {
    try {
      setRequestingReset(true);
      const response = await requestFinancialPasswordReset();
      if (response && response.success) {
        toast.success(
          response.message ||
            "Verification email sent to info.digitalaela@gmail.com"
        );
      }
    } catch (error) {
      console.error("Failed to request financial password reset:", error);
      toast.error(error.message || "Failed to send verification email");
    } finally {
      setRequestingReset(false);
    }
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    let score = 0;
    if (requirements.length) score += 20;
    if (requirements.uppercase) score += 20;
    if (requirements.lowercase) score += 20;
    if (requirements.number) score += 20;
    if (requirements.special) score += 20;

    let feedback = "";
    if (score < 40) feedback = "Weak";
    else if (score < 80) feedback = "Fair";
    else if (score < 100) feedback = "Good";
    else feedback = "Strong";

    setPasswordStrength({ score, feedback, requirements });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (name === "newPassword") {
      validatePassword(value);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (passwordStrength.score < 100) {
      toast.error("New password does not meet security requirements");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      toast.success("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordStrength({
        score: 0,
        feedback: "",
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        },
      });
    } catch (error) {
      console.error("Password change failed:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const getCategorySettings = () => {
    const categorySettings = settings[activeCategory] || [];
    // Filter out financial.password setting - it should not be displayed/editable here
    return categorySettings.filter(
      (setting) => setting.key !== "financial.password"
    );
  };

  const renderSettingInput = (setting) => {
    const { key, value, type, label, description } = setting;

    switch (type) {
      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                handleSettingChange(activeCategory, key, !value, type)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? "bg-[#D4AF37]" : "bg-gray-600"
              }`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-gray-300">
              {value ? "Enabled" : "Disabled"}
            </span>
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleSettingChange(activeCategory, key, e.target.value, type)
            }
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
          />
        );

      case "string":
        if (
          key.includes("password") ||
          key.includes("secret") ||
          key.includes("key")
        ) {
          return (
            <input
              type="password"
              value={value || ""}
              onChange={(e) =>
                handleSettingChange(activeCategory, key, e.target.value, type)
              }
              className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
              placeholder="••••••••"
            />
          );
        }
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) =>
              handleSettingChange(activeCategory, key, e.target.value, type)
            }
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
          />
        );

      default:
        return (
          <textarea
            value={
              typeof value === "string" ? value : JSON.stringify(value, null, 2)
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(activeCategory, key, parsed, type);
              } catch {
                handleSettingChange(activeCategory, key, e.target.value, type);
              }
            }}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-black via-[#040404] to-black">
        <div className="text-center">
          <FaSpinner className="mx-auto h-8 w-8 animate-spin text-[#D4AF37]" />
          <p className="mt-4 text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-[#040404] to-black p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-display">
                System Settings
              </h1>
              <p className="mt-2 text-gray-400">
                Manage platform configuration and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleInitialize}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50">
                <FaCog className="h-4 w-4" />
                Initialize Defaults
              </button>
              <button
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50">
                <FaUndo className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#F5D26A] disabled:opacity-50">
                {saving ? (
                  <>
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Financial Password Section */}
        <div className="mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#D4AF37]/20 p-3">
                  <FaLock className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Financial Password
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {financialPasswordExists
                      ? "Financial password is configured. You can change it using email verification."
                      : "No financial password is set. Create one using email verification."}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {financialPasswordExists ? (
                      <>
                        <FaCheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">
                          Password Set
                        </span>
                      </>
                    ) : (
                      <>
                        <FaExclamationCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-yellow-500">Not Set</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleRequestFinancialPasswordReset}
                disabled={requestingReset}
                className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#F5D26A] disabled:opacity-50">
                {requestingReset ? (
                  <>
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaLock className="h-4 w-4" />
                    {financialPasswordExists
                      ? "Change Financial Password"
                      : "Create Financial Password"}
                  </>
                )}
              </button>
            </div>
            <div className="mt-4 rounded-lg bg-black/40 p-4">
              <p className="text-xs text-gray-400">
                <strong className="text-gray-300">How it works:</strong> Click
                the button above to request a verification email. The email will
                be sent to{" "}
                <strong className="text-[#D4AF37]">
                  info.digitalaela@gmail.com
                </strong>
                . Click the link in the email to verify and set your new
                financial password.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const categorySettings = settings[category.id] || [];
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                        activeCategory === category.id
                          ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}>
                      <Icon className="h-4 w-4" />
                      <span>{category.label}</span>
                      {category.id !== "security" && (
                        <span className="ml-auto text-xs text-gray-500">
                          ({categorySettings.length})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-6 text-xl font-semibold text-white capitalize">
                {categories.find((c) => c.id === activeCategory)?.label}{" "}
                Settings
              </h2>

              {activeCategory === "security" ? (
                <div className="space-y-8">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-6">
                    <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                      <FaShieldAlt className="text-[#D4AF37]" />
                      Change Account Password
                    </h3>

                    <form
                      onSubmit={onPasswordSubmit}
                      className="max-w-xl space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("current")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                            {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
                            placeholder="Enter new password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("new")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                            {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {passwordData.newPassword && (
                          <div className="mt-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                Strength:
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  passwordStrength.score < 40
                                    ? "text-red-500"
                                    : passwordStrength.score < 80
                                    ? "text-yellow-500"
                                    : "text-green-500"
                                }`}>
                                {passwordStrength.feedback}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  passwordStrength.score < 40
                                    ? "bg-red-500"
                                    : passwordStrength.score < 80
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${passwordStrength.score}%` }}
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {Object.entries({
                                "Min 12 characters":
                                  passwordStrength.requirements.length,
                                "Uppercase letter":
                                  passwordStrength.requirements.uppercase,
                                "Lowercase letter":
                                  passwordStrength.requirements.lowercase,
                                Number: passwordStrength.requirements.number,
                                "Special character":
                                  passwordStrength.requirements.special,
                              }).map(([label, met]) => (
                                <div
                                  key={label}
                                  className="flex items-center gap-2">
                                  {met ? (
                                    <FaCheckCircle className="text-green-500 h-3 w-3" />
                                  ) : (
                                    <div className="h-3 w-3 rounded-full border border-gray-600" />
                                  )}
                                  <span
                                    className={`text-[11px] ${
                                      met ? "text-gray-300" : "text-gray-500"
                                    }`}>
                                    {label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
                            placeholder="Confirm new password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("confirm")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                            {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={
                            saving ||
                            passwordStrength.score < 100 ||
                            passwordData.newPassword !==
                              passwordData.confirmPassword
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-4 text-sm font-bold text-black transition hover:bg-[#F5D26A] disabled:opacity-50">
                          {saving ? (
                            <>
                              <FaSpinner className="h-4 w-4 animate-spin" />
                              Updating Password...
                            </>
                          ) : (
                            <>
                              <FaSave className="h-4 w-4" />
                              Update Password
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                    <h4 className="flex items-center gap-2 font-semibold text-yellow-500">
                      <FaExclamationCircle />
                      Security Best Practices
                    </h4>
                    <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-gray-400">
                      <li>
                        Use a unique password that you don't use elsewhere.
                      </li>
                      <li>
                        Enable Two-Factor Authentication (2FA) for extra
                        security.
                      </li>
                      <li>
                        Change your password periodically (every 90 days
                        recommended).
                      </li>
                      <li>
                        Avoid using personal information like names, birthdays,
                        or common words.
                      </li>
                    </ul>
                  </div>
                </div>
              ) : getCategorySettings().length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400">
                    No settings found for this category.
                  </p>
                  <button
                    onClick={handleInitialize}
                    className="mt-4 text-sm text-[#D4AF37] hover:underline">
                    Initialize default settings
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {getCategorySettings().map((setting, index) => (
                    <motion.div
                      key={setting.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-white">
                            {setting.label || setting.key}
                          </label>
                          {setting.description && (
                            <p className="mt-1 text-xs text-gray-400">
                              {setting.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500 font-mono">
                            {setting.key}
                          </p>
                        </div>
                        <div className="w-full max-w-md">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
