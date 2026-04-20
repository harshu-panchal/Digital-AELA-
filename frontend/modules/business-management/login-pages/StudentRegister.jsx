import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { useAuth } from "../../../src/contexts/AuthContext";
import { fetchPublicBranches } from "../../../src/services/api/branches";
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  validatePasswordPair,
  splitLocation,
  safeString,
} from "../../../src/utils/registrationHelpers";

const MotionDiv = motion.div;
const MotionSpan = motion.span;
const MotionButton = motion.button;
const MotionAnchor = motion.a;

const createInitialFormState = () => ({
  fullName: "",
  email: "",
  phone: "",
  country: "",
  ageGroup: "",
  currentStatus: "",
  preferredProgram: "",
  referralSource: "",
  goals: "",
  message: "",
  password: "",
  confirmPassword: "",
  // Additional fields for recruiter view
  headline: "",
  resumeUrl: "",
  portfolioUrl: "",
  linkedinUrl: "",
  skills: "",
  profileImage: null,
  profileImagePreview: null,
  branchJoinType: "independent",
  branchId: "",
});

const StudentRegister = () => {
  const [formData, setFormData] = useState(createInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchesLoading, setBranchesLoading] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  useEffect(() => {
    setBranchesLoading(true);
    fetchPublicBranches({ includeAll: true })
      .then((response) => setBranches(response.branches || []))
      .catch(() => setBranches([]))
      .finally(() => setBranchesLoading(false));
  }, []);

  const filteredBranches = branches.filter((branch) =>
    [branch.instituteName, branch.branchName, branch.city, branch.state, branch.country]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(branchSearch.trim().toLowerCase())
  );

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
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
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        ...(name === "branchJoinType" && value === "independent"
          ? { branchId: "" }
          : {}),
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = safeString(formData.fullName);
    const trimmedPhone = safeString(formData.phone);
    const trimmedGoals = safeString(formData.goals);
    const trimmedMessage = safeString(formData.message);
    const email = safeString(formData.email).toLowerCase();
    const password = safeString(formData.password);
    const confirmPassword = safeString(formData.confirmPassword);

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

    if (!formData.preferredProgram) {
      toast.error("Please select your preferred program.");
      return;
    }

    if (formData.branchJoinType === "branch" && !formData.branchId) {
      toast.error("Please select a branch.");
      return;
    }

    const { city, country } = splitLocation(formData.country);
    if (!country) {
      toast.error("Please specify your country or city in the location field.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse skills from comma-separated string
      const skillsArray = formData.skills
        ? formData.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const profilePayload = {
        fullName: trimmedName,
        phone: trimmedPhone,
        country,
        city,
        ageGroup: formData.ageGroup || null,
        currentStatus: formData.currentStatus || null,
        preferredProgram: formData.preferredProgram || null,
        referralSource: formData.referralSource || null,
        goals: trimmedGoals,
        message: trimmedMessage,
        bio: trimmedMessage || trimmedGoals,
        // Additional fields for recruiter view
        headline: safeString(formData.headline) || null,
        resumeUrl: safeString(formData.resumeUrl) || null,
        portfolioUrl: safeString(formData.portfolioUrl) || null,
        linkedinUrl: safeString(formData.linkedinUrl) || null,
        skills: skillsArray,
        branchJoinType: formData.branchJoinType,
        branchId: formData.branchId || null,
      };

      await registerUser({
        email,
        password,
        role: "student",
        profile: profilePayload,
        branchJoinType: formData.branchJoinType,
        branchId: formData.branchJoinType === "branch" ? formData.branchId : null,
        profileImage: formData.profileImage,
      });
      toast.success(
        formData.branchJoinType === "branch"
          ? "Your student account has been created. Your selected branch owner will review your application."
          : "Your student account has been created successfully! Please check your email to verify your account. Your account is also pending approval from the administrator."
      );
      setFormData(createInitialFormState());
      // Redirect to login page instead of dashboard since account needs approval
      navigate("/login/student", { replace: true });
    } catch (error) {
      // Handle specific error cases
      if (
        error.status === 409 ||
        error.code === "CONFLICT" ||
        error.message?.includes("already exists")
      ) {
        toast.error(
          "An account with this email already exists. Please try logging in instead."
        );
        setTimeout(() => {
          navigate("/login/student", { replace: true });
        }, 2000);
      } else {
        toast.error(
          error.message || "We couldn't create your account. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Student Registration | Digital AELA"
        description="Create your Digital AELA student account to access live classes, resources, and career accelerators."
        keywords="student registration, signup, Digital AELA"
        url="https://digitalaela.com/register/student"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 mt-20">
        <MotionDiv
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-3xl space-y-8 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(191,148,72,0.38)] backdrop-blur-xl supports-backdrop-filter:bg-white/18 sm:p-9">
          <div className="space-y-3 text-center">
            <MotionSpan
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/50 bg-[#F5D26A]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#F5D26A]">
              Join as a Student
            </MotionSpan>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Create Your Digital AELA Account
            </h1>
            <p className="text-sm text-slate-300/80">
              Enrol in live cohorts, access premium study rooms, and track your
              progress toward certification.
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
                  placeholder="Amit Verma"
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
                  placeholder="student@digitalaela.com"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
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
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F5D26A] file:text-black hover:file:bg-[#FFE28A] transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
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
                  Phone Number
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+971 50 876 5432"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Country / City
                </span>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Dubai, UAE"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-[#F5D26A]/25 bg-[#F5D26A]/10 p-4">
              <p className="text-sm font-semibold text-[#F5D26A]">
                Registration Type
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  ["independent", "Register as individual"],
                  ["branch", "Join a branch"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      formData.branchJoinType === value
                        ? "border-[#F5D26A]/70 bg-[#F5D26A]/15 text-white"
                        : "border-white/10 bg-white/5 text-gray-300"
                    }`}>
                    <input
                      type="radio"
                      name="branchJoinType"
                      value={value}
                      checked={formData.branchJoinType === value}
                      onChange={handleChange}
                      className="text-[#F5D26A]"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {formData.branchJoinType === "branch" && (
                <label className="mt-4 block space-y-2">
                  <span className="text-sm font-semibold text-slate-100">
                    Branch
                  </span>
                  <input
                    type="search"
                    value={branchSearch}
                    onChange={(event) => setBranchSearch(event.target.value)}
                    placeholder="Search by institute, branch, or city"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30"
                  />
                  <select
                    name="branchId"
                    required
                    value={formData.branchId}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/20 bg-black px-3.5 py-2.5 text-sm text-white transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30">
                    <option value="">
                      {branchesLoading ? "Loading branches..." : "Select a branch"}
                    </option>
                    {filteredBranches.map((branch) => (
                      <option
                        key={branch._id}
                        value={branch._id}
                        disabled={["rejected", "suspended"].includes(branch.status)}>
                        {branch.instituteName} - {branch.branchName}
                        {branch.city ? ` (${branch.city})` : ""}
                        {branch.status && branch.status !== "approved"
                          ? ` [${branch.status}]`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {filteredBranches.length === 0 && !branchesLoading && (
                    <p className="text-xs text-slate-400">
                      No branches are available right now.
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    If the branch is still pending admin approval, your application will wait until the branch goes live.
                  </p>
                </label>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Age Group
                </span>
                <select
                  name="ageGroup"
                  value={formData.ageGroup}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/20 bg-black px-3.5 py-2.5 text-sm text-white transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="" style={{ backgroundColor: "#000000" }}>
                    Select your age group
                  </option>
                  <option value="13-17" style={{ backgroundColor: "#000000" }}>
                    13-17
                  </option>
                  <option value="18-24" style={{ backgroundColor: "#000000" }}>
                    18-24
                  </option>
                  <option value="25-34" style={{ backgroundColor: "#000000" }}>
                    25-34
                  </option>
                  <option value="35+" style={{ backgroundColor: "#000000" }}>
                    35+
                  </option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Current Status
                </span>
                <select
                  name="currentStatus"
                  value={formData.currentStatus}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/20 bg-black px-3.5 py-2.5 text-sm text-white transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="" style={{ backgroundColor: "#000000" }}>
                    Tell us about you
                  </option>
                  <option
                    value="school-student"
                    style={{ backgroundColor: "#000000" }}>
                    School Student
                  </option>
                  <option
                    value="college-graduate"
                    style={{ backgroundColor: "#000000" }}>
                    College / University
                  </option>
                  <option
                    value="working-professional"
                    style={{ backgroundColor: "#000000" }}>
                    Working Professional
                  </option>
                  <option
                    value="career-switcher"
                    style={{ backgroundColor: "#000000" }}>
                    Career Switcher
                  </option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  Preferred Program
                </span>
                <select
                  name="preferredProgram"
                  value={formData.preferredProgram}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/20 bg-black px-3.5 py-2.5 text-sm text-white transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="" style={{ backgroundColor: "#000000" }}>
                    Select a program
                  </option>
                  <option
                    value="english-language"
                    style={{ backgroundColor: "#000000" }}>
                    English Language Labs
                  </option>
                  <option
                    value="digital-marketing"
                    style={{ backgroundColor: "#000000" }}>
                    Digital Marketing Cohort
                  </option>
                  <option
                    value="corporate-training"
                    style={{ backgroundColor: "#000000" }}>
                    Corporate Training Tracks
                  </option>
                  <option
                    value="career-counselling"
                    style={{ backgroundColor: "#000000" }}>
                    Career Counselling + Placement
                  </option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">
                  How did you hear about us?
                </span>
                <select
                  name="referralSource"
                  value={formData.referralSource}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/20 bg-black px-3.5 py-2.5 text-sm text-white transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="" style={{ backgroundColor: "#000000" }}>
                    Choose an option
                  </option>
                  <option
                    value="social-media"
                    style={{ backgroundColor: "#000000" }}>
                    Instagram / Facebook
                  </option>
                  <option
                    value="youtube"
                    style={{ backgroundColor: "#000000" }}>
                    YouTube
                  </option>
                  <option
                    value="referral"
                    style={{ backgroundColor: "#000000" }}>
                    Friend / Alumni
                  </option>
                  <option value="event" style={{ backgroundColor: "#000000" }}>
                    Workshop / Event
                  </option>
                  <option value="search" style={{ backgroundColor: "#000000" }}>
                    Google Search
                  </option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Your Goals
              </span>
              <textarea
                name="goals"
                rows={4}
                required
                value={formData.goals}
                onChange={handleChange}
                placeholder="Tell us about the skills you want to build or roles you are targeting."
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <div className="rounded-2xl border border-[#F5D26A]/30 bg-[#F5D26A]/10 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F5D26A]">
                Professional Profile (Optional - for job applications)
              </p>
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-100">
                    Professional Headline
                  </span>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    placeholder="e.g., Full Stack Developer | React & Node.js"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-100">
                    Skills (comma-separated)
                  </span>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g., JavaScript, React, Node.js, Python"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-100">
                      Resume URL
                    </span>
                    <input
                      type="url"
                      name="resumeUrl"
                      value={formData.resumeUrl}
                      onChange={handleChange}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-100">
                      Portfolio URL
                    </span>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                      className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                    />
                  </label>
                </div>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-100">
                    LinkedIn Profile
                  </span>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  />
                </label>
              </div>
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
                Anything else we should know?
              </span>
              <textarea
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                placeholder="Preferred class timings, accessibility needs, scholarship interest, etc."
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <MotionButton
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_32px_rgba(245,210,106,0.3)] transition focus:outline-none focus:ring focus:ring-[#F5D26A]/40 disabled:cursor-not-allowed disabled:opacity-80">
              {isSubmitting ? "Submitting..." : "Create account"}
            </MotionButton>
          </form>

          <div className="text-center text-xs text-slate-300/70">
            Already with us?{" "}
            <MotionAnchor
              whileHover={{ x: 2 }}
              href="/login/student"
              className="text-[#F5D26A] underline-offset-2 hover:text-[#FFE28A]">
              Sign in to your account
            </MotionAnchor>
          </div>
        </MotionDiv>
      </main>
    </div>
  );
};

export default StudentRegister;
