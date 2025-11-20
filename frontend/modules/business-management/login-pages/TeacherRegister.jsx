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
  parseCommaSeparated,
  sanitizeUrl,
} from "../../../src/utils/registrationHelpers";

const createInitialFormState = () => ({
  fullName: "",
  email: "",
  phone: "",
  experienceYears: "",
  expertise: "",
  primarySubjects: "",
  certifications: "",
  portfolioLink: "",
  linkedinUrl: "",
  website: "",
  twitter: "",
  preferredDelivery: "online",
  timeZones: "Gulf Standard Time (GST)",
  password: "",
  confirmPassword: "",
  message: "",
  about: "",
  profileImage: null,
  profileImagePreview: null,
});

const TeacherRegister = () => {
  const [formData, setFormData] = useState(() => createInitialFormState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
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
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = safeString(formData.fullName);
    const trimmedPhone = safeString(formData.phone);
    const trimmedMessage = safeString(formData.message);
    const email = safeString(formData.email).toLowerCase();
    const password = safeString(formData.password);
    const confirmPassword = safeString(formData.confirmPassword);
    const experienceYears = Number.parseInt(formData.experienceYears, 10);

    if (!trimmedName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
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

    if (Number.isNaN(experienceYears) || experienceYears < 0) {
      toast.error(
        "Please provide your teaching experience in years (0 or more)."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const primarySubjects = parseCommaSeparated(formData.primarySubjects);
      const certifications = parseCommaSeparated(formData.certifications);
      const safePortfolio = sanitizeUrl(formData.portfolioLink);
      const safeLinkedin = sanitizeUrl(formData.linkedinUrl);
      const safeWebsite = sanitizeUrl(formData.website);
      const safeTwitter = sanitizeUrl(formData.twitter);
      const trimmedAbout = safeString(formData.about);
      const trimmedExpertise = safeString(formData.expertise);

      const newUser = await registerUser({
        email,
        password,
        role: "teacher",
        profile: {
          fullName: trimmedName,
          phone: trimmedPhone,
          experienceYears,
          expertise: trimmedExpertise || primarySubjects[0] || "English Language",
          primarySubjects,
          certifications,
          portfolioLink: safePortfolio,
          linkedinUrl: safeLinkedin,
          linkedin: safeLinkedin,
          website: safeWebsite,
          twitter: safeTwitter,
          preferredDelivery: formData.preferredDelivery,
          timeZones: formData.timeZones,
          message: trimmedMessage,
          bio: trimmedAbout || trimmedMessage,
          about: trimmedAbout,
        },
        profileImage: formData.profileImage,
      });
      toast.success("Your mentor account has been created successfully. Your account is pending approval from the administrator. You will receive an email notification once your account is approved and you can login.");
      setFormData(createInitialFormState());
      // Redirect to login page instead of dashboard since account needs approval
      navigate("/login/teacher", { replace: true });
    } catch (error) {
      toast.error(
        error.message ||
          "We couldn't complete your registration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Teacher Registration | Digital AELA"
        description="Apply to teach with Digital AELA. Share your expertise and empower learners across the globe."
        keywords="teacher registration, instructor signup, Digital AELA"
        url="https://digitalaela.com/register/teacher"
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
              Become a Mentor
            </motion.span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Join the Digital AELA Faculty
            </h1>
            <p className="text-sm text-slate-300/80">
              Complete the form to begin onboarding. Our academic team will
              reach out with next steps and teaching opportunities.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid gap-4 sm:grid-cols-2">
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
                  placeholder="Priya Sharma"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
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
                  placeholder="mentor@digitalaela.com"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Phone Number
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+971 50 123 4567"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Teaching Experience (years)
                </span>
                <input
                  type="number"
                  min="0"
                  name="experienceYears"
                  required
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder="5"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Preferred Delivery Mode
                </span>
                <select
                  name="preferredDelivery"
                  value={formData.preferredDelivery}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur">
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="on-site">On-site</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Time Zone Preference
                </span>
                <select
                  name="timeZones"
                  value={formData.timeZones}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur">
                  <option>Gulf Standard Time (GST)</option>
                  <option>India Standard Time (IST)</option>
                  <option>British Standard Time (BST)</option>
                  <option>Eastern Time (ET)</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Primary Expertise
              </span>
              <input
                type="text"
                name="expertise"
                required
                value={formData.expertise}
                onChange={handleChange}
                placeholder="Public Speaking & Communication, IELTS & Test Prep, etc."
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Primary Subjects & Specializations
              </span>
              <textarea
                name="primarySubjects"
                rows={3}
                required
                value={formData.primarySubjects}
                onChange={handleChange}
                placeholder="Spoken English for adults, IELTS preparation, corporate communication, etc."
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Teaching Certifications
                </span>
                <input
                  type="text"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleChange}
                  placeholder="TESOL, CELTA, Cambridge TKT, etc."
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Portfolio / Demo Link
                </span>
                <input
                  type="url"
                  name="portfolioLink"
                  value={formData.portfolioLink}
                  onChange={handleChange}
                  placeholder="https://"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  LinkedIn Profile
                </span>
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
                <span className="text-sm font-semibold text-slate-100">
                  Website
                </span>
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
                <span className="text-sm font-semibold text-slate-100">
                  Twitter / X
                </span>
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
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
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
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                About You
              </span>
              <textarea
                name="about"
                rows={4}
                value={formData.about}
                onChange={handleChange}
                placeholder="Tell us about your teaching experience, background, and what makes you unique as an educator."
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Teaching Philosophy (Optional)
              </span>
              <textarea
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                placeholder="Share how you create outcome-driven sessions, tools you love, or success stories."
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

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
            Already have an account?{" "}
            <motion.a
              whileHover={{ x: 2 }}
              href="/login/teacher"
              className="text-[#F5D26A] underline-offset-2 hover:text-[#FFE28A]">
              Sign in here
            </motion.a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TeacherRegister;
