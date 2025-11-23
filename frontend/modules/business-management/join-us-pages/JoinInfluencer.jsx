import { useCallback } from "react";
import ContactPageLayout from "../business-components/contact/ContactPageLayout";
import ContactForm from "../business-components/contact/ContactForm";
import { submitJoinUsLead } from "../../../src/services/joinUsSubmission";

const JoinInfluencer = () => {
  const handleSubmit = useCallback(
    (payload) => submitJoinUsLead("influencer", payload),
    []
  );

  const fields = [
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
          required: false,
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
          required: false,
        },
        {
          name: "audienceRegions",
          label: "Top Audience Regions",
          type: "text",
          placeholder: "GCC, South Asia, North America",
          required: false,
        },
        {
          name: "contentThemes",
          label: "Content Themes / Niche",
          type: "textarea",
          rows: 3,
          placeholder:
            "Public speaking, communication hacks, professional storytelling, creator economy...",
          required: false,
          fullWidth: true,
        },
        {
          name: "interests",
          label: "Key Interests & Communities",
          type: "textarea",
          rows: 3,
          placeholder:
            "e.g. Edtech partnerships, youth mentoring, creator economy, growth marketing...",
          required: false,
          fullWidth: true,
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
          required: false,
        },
        {
          name: "experienceLevel",
          label: "Years of Professional Experience",
          type: "select",
          options: ["0 - 2 years", "3 - 5 years", "6 - 10 years", "10+ years"],
          required: false,
        },
        {
          name: "skills",
          label: "Signature Skills & Tools",
          type: "textarea",
          rows: 4,
          placeholder:
            "Figma, Webflow, React, Social storytelling, CRM automations...",
          required: false,
          fullWidth: true,
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
          required: false,
        },
        {
          name: "rateExpectation",
          label: "Rate Expectation (Specify currency)",
          type: "text",
          placeholder: "AED 120 / hour",
          required: false,
        },
        {
          name: "collaborationGoals",
          label: "What type of collaboration or project excites you?",
          type: "textarea",
          rows: 4,
          placeholder:
            "Share your vision—co-branded workshops, retained design sprints, growth campaigns, mentorship live streams, etc.",
          required: true,
          fullWidth: true,
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
          help:
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
          required: false,
          fullWidth: true,
        },
      ];

  return (
    <ContactPageLayout
      badge="Join Digital AELA"
      title="Collaborate as an Influencer / Freelancer"
      subtitle="Co-create campaigns, programs, and learner experiences with Digital AELA—whether you move communities online or build projects behind the scenes."
      description="Join our creator community and scale your influence while making a meaningful impact.">
      <div className="max-w-4xl mx-auto">
        <ContactForm
          fields={fields}
          submitLabel="Apply"
          successMessage="Thanks for reaching out! Our partnerships team will respond within 5 business days."
          disclaimer="Only our partnerships team will review these details. We will reach out within 5 business days."
          onSubmit={handleSubmit}
          formId="influencer"
          pendingMessage="Your application is pending approval. Our partnerships team will review it and respond within 5 business days."
        />
      </div>
    </ContactPageLayout>
  );
};

export default JoinInfluencer;
