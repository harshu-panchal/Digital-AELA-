import JoinUsFormLayout from "../business-components/join-us/JoinUsFormLayout";

const JoinInfluencer = () => {
  return (
    <JoinUsFormLayout
      title="Collaborate as an Influencer"
      subtitle="Partner with Digital AELA to create meaningful challenges, spotlight stories, and empower your community with future-ready communication skills."
      image="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80"
      imageAlt="Influencer recording content in a modern studio"
      benefits={[
        {
          title: "Launch exclusive challenges",
          description:
            "Design bespoke learning challenges with our team and reward your audience with AELA coins.",
        },
        {
          title: "Co-create content",
          description:
            "Host live conversations, workshops, and social campaigns amplified across our platforms.",
        },
        {
          title: "Grow your influence",
          description:
            "Tap into 100K+ community members, data-driven dashboards, and performance-based payouts.",
        },
        {
          title: "Premium partner toolkit",
          description:
            "Access creative assets, engagement scripts, and analytics to keep your community inspired.",
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
          name: "primaryPlatform",
          label: "Primary Platform",
          type: "select",
          options: [
            "Instagram",
            "YouTube",
            "LinkedIn",
            "TikTok",
            "Podcast",
            "Other",
          ],
          required: true,
        },
        {
          name: "profileLink",
          label: "Main Profile / Channel Link",
          type: "text",
          placeholder: "https://instagram.com/yourhandle",
          required: true,
        },
        {
          name: "audienceSize",
          label: "Audience Size",
          type: "select",
          options: ["Under 10K", "10K - 50K", "50K - 250K", "250K - 1M", "1M+"],
          required: true,
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
          required: true,
        },
        {
          name: "collaborationGoals",
          label: "What type of collaboration excites you?",
          type: "textarea",
          rows: 4,
          placeholder:
            "Tell us about your vision—co-branded workshops, challenge series, mentorship live streams, etc.",
          required: true,
        },
        {
          name: "brandPartnerships",
          label: "Notable Brand Collaborations",
          type: "textarea",
          rows: 3,
          placeholder:
            "List recent partnerships, campaigns, or case studies that highlight your impact.",
        },
        {
          name: "country",
          label: "Country of Residence",
          type: "text",
          placeholder: "United Arab Emirates",
          required: true,
        },
      ]}
      ctaLabel="Submit Influencer Profile"
      disclaimer="Only our partnerships team will review these details. We will reach out within 5 business days."
    />
  );
};

export default JoinInfluencer;
