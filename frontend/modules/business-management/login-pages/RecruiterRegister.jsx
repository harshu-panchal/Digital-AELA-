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
  sanitizeUrl,
} from "../../../src/utils/registrationHelpers";

const createInitialFormState = () => ({
  fullName: "",
  company: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  website: "",
  twitter: "",
  aboutCompany: "",
  experience: "",
  experienceYears: "",
  headline: "",
  password: "",
  confirmPassword: "",
  profileImage: null,
  profileImagePreview: null,
});

const RecruiterRegister = () => {
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
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
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
    const trimmedCompany = safeString(formData.company);
    const email = safeString(formData.email).toLowerCase();
    const password = safeString(formData.password);
    const confirmPassword = safeString(formData.confirmPassword);

    if (!trimmedName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!trimmedCompany) {
      toast.error("Please provide your company or organisation name.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid work email address.");
      return;
    }

    const passwordError = validatePasswordPair(password, confirmPassword, MIN_PASSWORD_LENGTH);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedAbout = safeString(formData.aboutCompany);
      const trimmedHeadline = safeString(formData.headline);
      const trimmedExperience = safeString(formData.experience);
      const experienceYears = formData.experienceYears ? Number.parseInt(formData.experienceYears, 10) : 0;
      const safeLinkedin = sanitizeUrl(formData.linkedinUrl);
      const safeWebsite = sanitizeUrl(formData.website);
      const safeTwitter = sanitizeUrl(formData.twitter);
      const trimmedPhone = safeString(formData.phone);

      const newUser = await registerUser({
        email,
        password,
        role: "recruiter",
        profile: {
          fullName: trimmedName,
          companyName: trimmedCompany,
          company: trimmedCompany,
          headline: trimmedHeadline,
          aboutCompany: trimmedAbout,
          bio: trimmedAbout,
          experience: trimmedExperience,
          experienceYears: experienceYears,
          phone: trimmedPhone,
          linkedinUrl: safeLinkedin,
          linkedin: safeLinkedin,
          website: safeWebsite,
          twitter: safeTwitter,
        },
        profileImage: formData.profileImage,
      });
      toast.success("Your recruiter account has been created successfully! Please check your email to verify your account. Your account is also pending approval from the administrator. You will receive an email notification once your account is approved and you can login.");
      setFormData(createInitialFormState());
      // Redirect to login page instead of dashboard since account needs approval
      navigate("/login/recruiter", { replace: true });
    } catch (error) {
      // Handle specific error cases
      if (error.status === 409 || error.code === "CONFLICT" || error.message?.includes("already exists")) {
        toast.error("An account with this email already exists. Please try logging in instead.");
        // Optionally redirect to login page
        setTimeout(() => {
          navigate("/login/recruiter", { replace: true });
        }, 2000);
      } else {
        toast.error(error.message || "We couldn't create the account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Recruiter Registration | Digital AELA"
        description="Sign up as a recruiter with Digital AELA to access talent pipelines, placements, and hiring support."
        keywords="recruiter registration, hire talent, Digital AELA"
        url="https://digitalaela.com/register/recruiter"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-3xl space-y-8 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(191,148,72,0.38)] backdrop-blur-xl supports-backdrop-filter:bg-white/18 sm:p-9">
          <div className="space-y-3 text-center">
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/50 bg-[#F5D26A]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#F5D26A]">
              Partner with Digital AELA
            </motion.span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Create Recruiter Access</h1>
            <p className="text-sm text-slate-300/80">
              Gain instant access to curated candidate pools, interview pipelines, and hiring dashboards.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Full Name</span>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Neha Kapoor"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Company</span>
                <input
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="AELA Talent Partners"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Work Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="talent@company.com"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Phone Number</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+971 50 123 4567"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            {/* Profile Image Upload */}
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Profile Photo <span className="text-xs text-slate-400">(Optional)</span>
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
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F5D26A] file:text-black hover:file:bg-[#FFE28A] transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    JPG, PNG, or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">Professional Headline</span>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="Senior Talent Acquisition Specialist"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Years of Experience</span>
                <input
                  type="number"
                  min="0"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Experience Description</span>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Recruiting in tech, finance, healthcare, etc."
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">LinkedIn Profile</span>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Company Website</span>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Twitter / X</span>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/..."
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">About Your Company</span>
              <textarea
                name="aboutCompany"
                rows={4}
                value={formData.aboutCompany}
                onChange={handleChange}
                placeholder="Tell us about your company, what industries you recruit for, your company culture, and what makes you unique."
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Password</span>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_32px_rgba(245,210,106,0.3)] transition focus:outline-none focus:ring focus:ring-[#F5D26A]/40 disabled:cursor-not-allowed disabled:opacity-80">
              {isSubmitting ? "Submitting..." : "Create account"}
            </motion.button>
          </form>

          <div className="text-center text-xs text-slate-300/70">
            Already a partner?{" "}
            <motion.a
              whileHover={{ x: 2 }}
              href="/login/recruiter"
              className="text-[#F5D26A] underline-offset-2 hover:text-[#FFE28A]">
              Sign in to your recruiter portal
            </motion.a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default RecruiterRegister;
