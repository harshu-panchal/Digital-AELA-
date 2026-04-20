import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaSave, FaSpinner } from "react-icons/fa";
import {
  fetchBranchSettings,
  updateBranchSettings,
} from "../../../src/services/api/branchOwner";

const BranchSettings = () => {
  const [settings, setSettings] = useState({
    autoApproveTeachers: false,
    autoApproveStudents: false,
    allowTeacherContentSubmission: true,
    defaultAnnouncementAudience: "all",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchBranchSettings()
      .then((response) => {
        if (mounted) setSettings((prev) => ({ ...prev, ...(response.settings || {}) }));
      })
      .catch((error) => toast.error(error.message || "Failed to load settings"))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await updateBranchSettings(settings);
      setSettings((prev) => ({ ...prev, ...(response.settings || {}) }));
      toast.success("Settings updated");
    } catch (error) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F5D26A]">
          Branch Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Approval Rules</h1>
        <p className="mt-2 text-sm text-gray-400">
          Configure safe defaults for branch member and content operations.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <div className="space-y-4">
          {[
            ["autoApproveTeachers", "Auto approve teachers"],
            ["autoApproveStudents", "Auto approve students"],
            ["allowTeacherContentSubmission", "Allow teacher content submissions"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111] p-4">
              <span className="text-sm font-semibold text-white">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, [key]: event.target.checked }))
                }
                className="h-5 w-5 rounded border-white/20 bg-black text-[#F5D26A] focus:ring-[#F5D26A]/40"
              />
            </label>
          ))}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-gray-200">
              Default announcement audience
            </span>
            <select
              value={settings.defaultAnnouncementAudience}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  defaultAnnouncementAudience: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
              <option value="all">All branch members</option>
              <option value="teachers">Teachers</option>
              <option value="students">Students</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F5D26A] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#FFE28A] disabled:opacity-60">
          {saving ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaSave className="h-4 w-4" />}
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default BranchSettings;
