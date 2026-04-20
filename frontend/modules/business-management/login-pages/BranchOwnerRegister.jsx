import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { useAuth } from "../../../src/contexts/AuthContext";
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  validatePasswordPair,
  safeString,
  splitLocation,
} from "../../../src/utils/registrationHelpers";

const createInitialFormState = () => ({
  fullName: "",
  email: "",
  phone: "",
  region: "",
  instituteName: "",
  branchName: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  description: "",
  password: "",
  confirmPassword: "",
  profileImage: null,
  profileImagePreview: null,
});

const BranchOwnerRegister = () => {
  const [formData, setFormData] = useState(createInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, getRoleHome } = useAuth();

  motion.div;

  const handleChange = (event) => {
    const { name, value, type, files } = event.target;
    if (type === "file" && files && files[0]) {
      const file = files[0];
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
      }
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: file,
          profileImagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match. Please confirm your password.");
      return;
    }
    const trimmedName = safeString(formData.fullName);
    const trimmedPhone = safeString(formData.phone);
    const trimmedRegion = safeString(formData.region);
    const instituteName = safeString(formData.instituteName);
    const branchName = safeString(formData.branchName);
    const address = safeString(formData.address);
    const cityInput = safeString(formData.city);
    const state = safeString(formData.state);
    const countryInput = safeString(formData.country);
    const postalCode = safeString(formData.postalCode);
    const description = safeString(formData.description);
    const email = safeString(formData.email).toLowerCase();
    const password = safeString(formData.password);
    const confirmPassword = safeString(formData.confirmPassword);

    if (!trimmedName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please provide a valid email address.");
      return;
    }

    const passwordError = validatePasswordPair(
      password,
      confirmPassword,
      MIN_PASSWORD_LENGTH
    );
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (!trimmedPhone) {
      toast.error("Please provide your contact number.");
      return;
    }

    const { city, country } = splitLocation(trimmedRegion);
    const branchCity = cityInput || city;
    const branchCountry = countryInput || country;

    if (!instituteName) {
      toast.error("Please enter your institute name.");
      return;
    }

    if (!branchName) {
      toast.error("Please enter your branch name.");
      return;
    }

    if (!branchCity || !branchCountry) {
      toast.error("Please provide your branch city and country.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await registerUser({
        email,
        password,
        role: "branch_owner",
        profile: {
          fullName: trimmedName,
          phone: trimmedPhone,
          region: trimmedRegion,
          city: branchCity,
          country: branchCountry,
        },
        branch: {
          instituteName,
          branchName,
          contactEmail: email,
          contactPhone: trimmedPhone,
          address,
          city: branchCity,
          state,
          country: branchCountry,
          postalCode,
          description,
        },
        profileImage: formData.profileImage,
      });
      toast.success("Branch application submitted for admin approval.");
      setFormData(createInitialFormState());
      navigate(getRoleHome(newUser.role), { replace: true });
    } catch (error) {
      toast.error(
        error.message ||
          "We couldn't submit your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Branch Owner Registration | Digital AELA"
        description="Partner with Digital AELA as a branch owner. Submit your details to start your centre onboarding process."
        keywords="branch owner registration, franchise signup, Digital AELA"
        url="https://digitalaela.com/register/branch-owner"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-xl space-y-10 rounded-3xl border border-white/15 bg-white/10 p-8 shadow-[0_40px_120px_rgba(191,148,72,0.45)] backdrop-blur-2xl supports-backdrop-filter:bg-white/18 sm:p-12">
          <div className="space-y-4 text-center">
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/50 bg-[#F5D26A]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#F5D26A]">
              Launch a Branch
            </motion.span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Start Your Digital AELA Centre
            </h1>
            <p className="text-sm text-slate-300/80">
              Share your details to begin the partnership process. Our expansion
              team will design a launch roadmap with you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Full Name
              </span>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ravi Menon"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Email
              </span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="owner@digitalaela.center"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Institute Name
                </span>
                <input
                  type="text"
                  name="instituteName"
                  required
                  value={formData.instituteName}
                  onChange={handleChange}
                  placeholder="Digital AELA Learning Institute"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Branch Name
                </span>
                <input
                  type="text"
                  name="branchName"
                  required
                  value={formData.branchName}
                  onChange={handleChange}
                  placeholder="Dubai Main Branch"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Contact Number
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+971 50 123 4567"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Region / City
                </span>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="Dubai, UAE"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Branch Address
              </span>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Office, street, landmark"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  City
                </span>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Dubai"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  State
                </span>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Dubai"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Country
                </span>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="UAE"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Postal Code
                </span>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="00000"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Branch Description
                </span>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Programs, audience, local focus"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
            </div>

            {/* Profile Image Upload */}
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Profile Photo{" "}
                <span className="text-xs text-slate-400">(Optional)</span>
              </span>
              <div className="flex items-center gap-4">
                {formData.profileImagePreview ? (
                  <img
                    src={formData.profileImagePreview}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#F5D26A]/40"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                    <span className="text-xs text-slate-400">No image</span>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F5D26A] file:text-black hover:file:bg-[#FFE28A] transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    JPG, PNG, or GIF.
                  </p>
                </div>
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Password
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Confirm Password
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-6 py-3 text-sm font-semibold text-black shadow-[0_12px_40px_rgba(245,210,106,0.35)] transition focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 disabled:cursor-not-allowed disabled:opacity-80">
              {isSubmitting ? "Submitting..." : "Create account"}
            </motion.button>
          </form>

          <div className="text-center text-xs text-slate-300/70">
            Already an owner?{" "}
            <motion.a
              whileHover={{ x: 2 }}
              href="/login/branch-owner"
              className="text-[#F5D26A] underline-offset-2 hover:text-[#FFE28A]">
              Sign in to your dashboard
            </motion.a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default BranchOwnerRegister;
