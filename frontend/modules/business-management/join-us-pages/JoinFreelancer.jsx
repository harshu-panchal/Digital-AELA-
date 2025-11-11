import { useCallback } from "react";
import JoinUsFormLayout from "../business-components/join-us/JoinUsFormLayout";
import { submitJoinUsLead } from "../../../src/services/joinUsSubmission";

const JoinFreelancer = () => {
  const handleSubmit = useCallback(
    (payload) => submitJoinUsLead("freelancer", payload),
    []
  );

  return (
    <JoinUsFormLayout
      title="Work with us as a Freelancer"
      subtitle="Support Digital AELA’s global operations across design, content, technology, and learner success. Create projects that elevate careers."
      image="https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1600&q=80"
      imageAlt="Freelancer working on a laptop in a collaborative space"
      benefits={[
        {
          title: "Mission-driven briefs",
          description:
            "Deliver projects that impact thousands of learners and professionals every month.",
        },
        {
          title: "Flexible engagements",
          description:
            "Choose from sprints, retainers, or outcome-based collaborations that fit your schedule.",
        },
        {
          title: "Global recognition",
          description:
            "Feature your work across our community showcases, events, and partner newsletters.",
        },
        {
          title: "Trusted partner network",
          description:
            "Join a curated circle of creatives, strategists, and builders shaping the future of learning.",
        },
      ]}
      formConfig={[
        {
          name: "fullName",
          label: "Full Name",
          type: "text",
          placeholder: "Rahul Singh",
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
          name: "serviceCategory",
          label: "Primary Service Category",
          type: "select",
          options: [
            "Design & Creative",
            "Content & Copywriting",
            "Marketing & Growth",
            "Technology & Engineering",
            "Operations & Community",
            "Other Specialized Services",
          ],
          required: true,
        },
        {
          name: "experienceLevel",
          label: "Years of Professional Experience",
          type: "select",
          options: ["0 - 2 years", "3 - 5 years", "6 - 10 years", "10+ years"],
          required: true,
        },
        {
          name: "skills",
          label: "Signature Skills & Tools",
          type: "textarea",
          rows: 3,
          placeholder:
            "Figma, Webflow, React, Social storytelling, CRM automations...",
          required: true,
        },
        {
          name: "portfolioLink",
          label: "Portfolio / Case Studies / GitHub",
          type: "text",
          placeholder: "https://behance.net/yourwork",
          required: true,
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
          required: true,
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
          required: true,
        },
        {
          name: "projectHighlights",
          label: "Recent Project Highlights",
          type: "textarea",
          rows: 4,
          placeholder:
            "Share outcomes, metrics, or testimonials that describe your best work.",
        },
      ]}
      ctaLabel="Submit Freelancer Profile"
      disclaimer="Your details help us match you with the right project leads. We’ll be in touch when a brief aligns with your expertise."
      onSubmit={handleSubmit}
      successMessage="Thanks for sharing your portfolio! We’ll connect when a project matches your skills."
    />
  );
};

export default JoinFreelancer;
