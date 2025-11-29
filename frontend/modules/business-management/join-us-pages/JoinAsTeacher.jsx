import { useCallback } from "react";
import { motion } from "framer-motion";
import ContactPageLayout from "../business-components/contact/ContactPageLayout";
import ContactForm from "../business-components/contact/ContactForm";
import { submitJoinUsLead } from "../../../src/services/joinUsSubmission";
import { useAuth } from "../../../src/contexts/AuthContext";
import TranslatedText from "../../../src/components/TranslatedText";

const JoinAsTeacher = () => {
  const { user } = useAuth();
  
  const handleSubmit = useCallback(
    (payload) => {
      if (!user?.id) {
        throw new Error("Please log in to submit this application");
      }
      return submitJoinUsLead("teacher", payload, user.id);
    },
    [user]
  );

  const fields = [
        {
          name: "fullName",
          label: "Full Name",
          type: "text",
          placeholder: "Imran Khan",
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
          label: "Contact Number",
          type: "tel",
          placeholder: "+971 50 123 4567",
          required: true,
        },
        {
          name: "experience",
          label: "Years of Teaching Experience",
          type: "select",
          options: [
            "Less than 2 years",
            "2 - 5 years",
            "6 - 10 years",
            "10+ years",
          ],
          required: true,
        },
        {
          name: "primaryExpertise",
          label: "Primary Expertise",
          type: "select",
          options: [
            "Public Speaking & Communication",
            "IELTS & Test Prep",
            "Business Communication",
            "Debating & Critical Thinking",
            "Leadership & Soft Skills",
            "Other",
          ],
          required: true,
        },
        {
          name: "certifications",
          label: "Certifications / Credentials",
          type: "textarea",
          rows: 3,
          placeholder:
            "Share notable certifications, awards, or teaching licenses.",
          required: false,
          fullWidth: true,
        },
        {
          name: "sessionFormat",
          label: "Preferred Session Format",
          type: "select",
          options: [
            "Live masterclasses",
            "1:1 coaching",
            "Cohort-based programs",
            "Asynchronous video courses",
            "Hybrid formats",
          ],
          required: true,
        },
        {
          name: "availability",
          label: "Weekly Availability",
          type: "select",
          options: [
            "Up to 5 hours",
            "5 - 10 hours",
            "10 - 20 hours",
            "20+ hours",
          ],
          required: true,
        },
        {
          name: "portfolioLink",
          label: "Portfolio / LinkedIn / Session Recording",
          type: "text",
          placeholder: "https://linkedin.com/in/yourprofile",
          help: "Add any link that showcases your teaching style or impact.",
          required: false,
        },
        {
          name: "motivation",
          label: "Why do you want to teach with us?",
          type: "textarea",
          rows: 4,
          placeholder:
            "Tell us about your mission, teaching philosophy, and the impact you want to create.",
          required: true,
          fullWidth: true,
        },
        {
          name: "resume",
          label: "Attach Resume (PDF, under 10MB)",
          type: "file",
          accept: ".pdf,.doc,.docx",
          help: "Upload your latest resume (max file size 10 MB).",
          required: true,
        },
        {
          name: "videoIntro",
          label: "Attach Your Video Introduction (minimum 3 minutes)",
          type: "file",
          accept: "video/mp4,video/webm,video/quicktime",
          help:
            "Share a video introduction (MP4/WEBM/MOV) at least 3 minutes long to showcase your teaching style.",
          required: true,
        },
      ];

  return (
    <ContactPageLayout
      badge={<TranslatedText>Join Digital AELA</TranslatedText>}
      title={<TranslatedText>Teach with Digital AELA</TranslatedText>}
      subtitle={<TranslatedText>Mentor learners across the globe, host immersive sessions, and co-create transformative learning journeys with our community.</TranslatedText>}
      description={<TranslatedText>Share your expertise and join a global community of educators making a real impact.</TranslatedText>}>
      <div className="max-w-4xl mx-auto">
        <ContactForm
          fields={fields}
          submitLabel={<TranslatedText>Apply</TranslatedText>}
          successMessage={<TranslatedText>Application received! Our academic partnerships team will get in touch soon.</TranslatedText>}
          disclaimer={<TranslatedText>We respect your privacy. Your application details are only used by the Digital AELA academic team.</TranslatedText>}
          onSubmit={handleSubmit}
          formId="teacher"
          pendingMessage={<TranslatedText>Your application is pending approval. Our academic partnerships team will review it and get in touch soon.</TranslatedText>}
        />
      </div>
    </ContactPageLayout>
  );
};

export default JoinAsTeacher;
