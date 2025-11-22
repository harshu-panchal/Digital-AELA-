import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSpinner, FaSave, FaUndo, FaCog, FaEnvelope, FaCreditCard, FaToggleOn, FaToggleOff, FaWrench, FaShareAlt, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  fetchAllSettings,
  fetchSettingsByCategory,
  updateSettings,
  updateSetting,
  initializeDefaultSettings,
} from "../../../src/services/api/superAdmin";

const SystemSettings = () => {
  const [activeCategory, setActiveCategory] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const categories = [
    { id: "general", label: "General", icon: FaCog },
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
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = () => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
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
          const original = originalSettings[category]?.find((s) => s.key === setting.key);
          if (!original || JSON.stringify(original.value) !== JSON.stringify(setting.value)) {
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
        toast.success(`Successfully updated ${settingsToUpdate.length} setting(s)`);
        await loadSettings(); // Reload to get updated data
        
        // If social media settings were updated, clear the cache and notify
        const hasSocialSettings = settingsToUpdate.some(s => s.category === "social" || s.key?.startsWith("social."));
        if (hasSocialSettings) {
          // Dispatch event to clear cache in useSocialMedia hook
          window.dispatchEvent(new Event('socialSettingsUpdated'));
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
        toast.success(`Initialized ${response.initialized || 0} default settings`);
        await loadSettings();
      }
    } catch (error) {
      console.error("Failed to initialize settings:", error);
      toast.error("Failed to initialize default settings");
    } finally {
      setSaving(false);
    }
  };

  const getCategorySettings = () => {
    return settings[activeCategory] || [];
  };

  const renderSettingInput = (setting) => {
    const { key, value, type, label, description } = setting;

    switch (type) {
      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSettingChange(activeCategory, key, !value, type)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? "bg-[#D4AF37]" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-gray-300">{value ? "Enabled" : "Disabled"}</span>
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => handleSettingChange(activeCategory, key, e.target.value, type)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
          />
        );

      case "string":
        if (key.includes("password") || key.includes("secret") || key.includes("key")) {
          return (
            <input
              type="password"
              value={value || ""}
              onChange={(e) => handleSettingChange(activeCategory, key, e.target.value, type)}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
              placeholder="••••••••"
            />
          );
        }
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleSettingChange(activeCategory, key, e.target.value, type)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
          />
        );

      default:
        return (
          <textarea
            value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-[#040404] to-black">
        <div className="text-center">
          <FaSpinner className="mx-auto h-8 w-8 animate-spin text-[#D4AF37]" />
          <p className="mt-4 text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#040404] to-black p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-display">System Settings</h1>
              <p className="mt-2 text-gray-400">Manage platform configuration and preferences</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleInitialize}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <FaCog className="h-4 w-4" />
                Initialize Defaults
              </button>
              <button
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <FaUndo className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#F5D26A] disabled:opacity-50"
              >
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Categories</h3>
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
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{category.label}</span>
                      <span className="ml-auto text-xs text-gray-500">({categorySettings.length})</span>
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
                {categories.find((c) => c.id === activeCategory)?.label} Settings
              </h2>

              {getCategorySettings().length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400">No settings found for this category.</p>
                  <button
                    onClick={handleInitialize}
                    className="mt-4 text-sm text-[#D4AF37] hover:underline"
                  >
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
                      className="space-y-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-white">
                            {setting.label || setting.key}
                          </label>
                          {setting.description && (
                            <p className="mt-1 text-xs text-gray-400">{setting.description}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500 font-mono">{setting.key}</p>
                        </div>
                        <div className="w-full max-w-md">{renderSettingInput(setting)}</div>
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

