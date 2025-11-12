import { useCallback } from "react";
import JoinUsFormLayout from "../business-components/join-us/JoinUsFormLayout";
import { submitJoinUsLead } from "../../../src/services/joinUsSubmission";

const JoinInfluencer = () => {
  const handleSubmit = useCallback(
    (payload) => submitJoinUsLead("influencer", payload),
    []
  );

  return (
    <JoinUsFormLayout
      title="Collaborate as an Influencer / Freelancer"
      subtitle="Co-create campaigns, programs, and learner experiences with Digital AELA—whether you move communities online or build projects behind the scenes."
      image="https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1600&q=80"
      imageAlt="Creator collaborating with team members around a laptop"
      benefits={[
        {
          title: "Launch signature drops",
          description:
            "Design challenge series, live workshops, or community funnels powered by AELA’s learning products.",
        },
        {
          title: "Flexible engagements",
          description:
            "Choose between one-off campaigns, retained projects, or performance-based collaborations that match your schedule.",
        },
        {
          title: "Scale your influence & revenue",
          description:
            "Access 100K+ engaged learners, analytics dashboards, and structured payouts for every milestone you achieve.",
        },
        {
          title: "Creator & builder toolkit",
          description:
            "Use our content playbooks, project templates, and success team to keep your audience inspired and your clients delighted.",
        },
      ]}
      formConfig={[
        {
          name: "fullName",
          label: "Full Name",
          type: "text",
          placeholder: "Ayesha Rahman",
          required: true,
        },
        {
          name: "email",
          label: "Email Address",
          type: "email",
          placeholder: "you@example.com",
          required: true,
        },
        {
          name: "phone",
          label: "Mobile Number",
          type: "tel",
          placeholder: "+971 50 123 4567",
          required: true,
        },
        {
          name: "collaborationType",
          label: "Collaboration Focus",
          type: "select",
          options: [
            "Influencer partnership",
            "Freelancer project",
            "Both / Hybrid",
          ],
          required: true,
        },
        {
          name: "primaryPlatform",
          label: "Primary Platform (for influencers)",
          type: "select",
          options: [
            "Instagram",
            "YouTube",
            "LinkedIn",
            "TikTok",
            "Podcast",
            "Other",
          ],
        },
        {
          name: "profileLink",
          label: "Main Profile / Portfolio Link",
          type: "text",
          placeholder: "https://yourwebsite.com/portfolio",
          required: true,
        },
        {
          name: "audienceSize",
          label: "Audience Size (if applicable)",
          type: "select",
          options: ["Under 10K", "10K - 50K", "50K - 250K", "250K - 1M", "1M+"],
        },
        {
          name: "audienceRegions",
          label: "Top Audience Regions",
          type: "text",
          placeholder: "GCC, South Asia, North America",
        },
        {
          name: "contentThemes",
          label: "Content Themes / Niche",
          type: "textarea",
          rows: 3,
          placeholder:
            "Public speaking, communication hacks, professional storytelling, creator economy...",
        },
        {
          name: "interests",
          label: "Key Interests & Communities",
          type: "textarea",
          rows: 3,
          placeholder:
            "e.g. Edtech partnerships, youth mentoring, creator economy, growth marketing...",
        },
        {
          name: "serviceCategory",
          label: "Primary Service Category (for freelancers)",
          type: "select",
          options: [
            "Design & Creative",
            "Content & Copywriting",
            "Marketing & Growth",
            "Technology & Engineering",
            "Operations & Community",
            "Other Specialized Services",
          ],
        },
        {
          name: "experienceLevel",
          label: "Years of Professional Experience",
          type: "select",
          options: ["0 - 2 years", "3 - 5 years", "6 - 10 years", "10+ years"],
        },
        {
          name: "skills",
          label: "Signature Skills & Tools",
          type: "textarea",
          rows: 4,
          placeholder:
            "Figma, Webflow, React, Social storytelling, CRM automations...",
        },
        {
          name: "availability",
          label: "Availability",
          type: "select",
          options: [
            "5 - 10 hrs / week",
            "10 - 20 hrs / week",
            "20 - 30 hrs / week",
            "Full-time contract",
          ],
        },
        {
          name: "timeZone",
          label: "Preferred Time Zone(s)",
          type: "text",
          placeholder: "Gulf Standard Time, flexible overlap with EST",
        },
        {
          name: "rateExpectation",
          label: "Rate Expectation (Specify currency)",
          type: "text",
          placeholder: "AED 120 / hour",
        },
        {
          name: "collaborationGoals",
          label: "What type of collaboration or project excites you?",
          type: "textarea",
          rows: 4,
          placeholder:
            "Share your vision—co-branded workshops, retained design sprints, growth campaigns, mentorship live streams, etc.",
          required: true,
        },
        {
          name: "country",
          label: "Country of Residence",
          type: "text",
          placeholder: "United Arab Emirates",
          required: true,
        },
        {
          name: "profileImage",
          label: "Attach Social Media Profile Picture",
          type: "file",
          accept: "image/png,image/jpeg,image/webp",
          helperText:
            "Upload a recent profile image (PNG/JPG/WebP, up to 5 MB).",
          required: true,
        },
        {
          name: "brandPartnerships",
          label: "Notable Collaborations or Project Highlights",
          type: "textarea",
          rows: 3,
          placeholder:
            "List campaigns, brands, or client projects that highlight your impact.",
        },
      ]}
      ctaLabel="Submit Collaboration Profile"
      disclaimer="Only our partnerships team will review these details. We will reach out within 5 business days."
      onSubmit={handleSubmit}
      successMessage="Thanks for reaching out! Our partnerships team will respond within 5 business days."
    />
  );
};

export default JoinInfluencer;
