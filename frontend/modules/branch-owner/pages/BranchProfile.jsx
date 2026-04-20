import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaSave, FaSpinner } from "react-icons/fa";
import {
  fetchBranchProfile,
  updateBranchProfile,
} from "../../../src/services/api/branchOwner";

const initialForm = {
  instituteName: "",
  branchName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  description: "",
  logoUrl: "",
  bannerUrl: "",
};

const BranchProfile = () => {
  const [formData, setFormData] = useState(initialForm);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchBranchProfile()
      .then((response) => {
        if (!mounted) return;
        const nextBranch = response.branch || {};
        setBranch(nextBranch);
        setFormData({
          ...initialForm,
          ...Object.fromEntries(
            Object.keys(initialForm).map((key) => [key, nextBranch[key] || ""])
          ),
        });
      })
      .catch((error) => toast.error(error.message || "Failed to load profile"))
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
      const response = await updateBranchProfile(formData);
      setBranch(response.branch);
      toast.success("Branch profile updated");
    } catch (error) {
      toast.error(error.message || "Failed to update branch profile");
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
          Branch Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {branch?.instituteName || "Institute Details"}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Keep public branch information accurate for teachers and students.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["instituteName", "Institute Name"],
            ["branchName", "Branch Name"],
            ["contactEmail", "Contact Email"],
            ["contactPhone", "Contact Phone"],
            ["city", "City"],
            ["state", "State"],
            ["country", "Country"],
            ["postalCode", "Postal Code"],
            ["logoUrl", "Logo URL"],
            ["bannerUrl", "Banner URL"],
          ].map(([name, label]) => (
            <label key={name} className="block space-y-2">
              <span className="text-sm font-semibold text-gray-200">{label}</span>
              <input
                name={name}
                value={formData[name]}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, [name]: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none"
              />
            </label>
          ))}
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-semibold text-gray-200">Address</span>
          <input
            name="address"
            value={formData.address}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, address: event.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none"
          />
        </label>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-semibold text-gray-200">Description</span>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, description: event.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F5D26A] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#FFE28A] disabled:opacity-60">
          {saving ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaSave className="h-4 w-4" />}
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default BranchProfile;
