import JoinUsFormLayout from "../business-components/join-us/JoinUsFormLayout";

const JoinAsTeacher = () => {
  return (
    <JoinUsFormLayout
      title="Teach with Digital AELA"
      subtitle="Mentor learners across the globe, host immersive sessions, and co-create transformative learning journeys with our community."
      image="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80"
      imageAlt="Instructor guiding students in an interactive session"
      benefits={[
        {
          title: "Global class rooms",
          description: "Engage with motivated learners across 30+ countries in flexible time slots.",
        },
        {
          title: "Curriculum support",
          description: "Access digital toolkits, lesson templates, and coaching playbooks designed by our team.",
        },
        {
          title: "Earn & grow",
          description: "Competitive compensation, bonuses, and visibility across our Learn & Earn ecosystem.",
        },
        {
          title: "Creator community",
          description: "Collaborate with public speakers, language experts, and master mentors.",
        },
      ]}
      formConfig={[
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
          options: ["Less than 2 years", "2 - 5 years", "6 - 10 years", "10+ years"],
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
          placeholder: "Share notable certifications, awards, or teaching licenses.",
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
          options: ["Up to 5 hours", "5 - 10 hours", "10 - 20 hours", "20+ hours"],
          required: true,
        },
        {
          name: "portfolioLink",
          label: "Portfolio / LinkedIn / Session Recording",
          type: "text",
          placeholder: "https://linkedin.com/in/yourprofile",
          helperText: "Add any link that showcases your teaching style or impact.",
        },
        {
          name: "motivation",
          label: "Why do you want to teach with us?",
          type: "textarea",
          rows: 4,
          placeholder: "Tell us about your mission, teaching philosophy, and the impact you want to create.",
          required: true,
        },
      ]}
      ctaLabel="Apply as Teacher"
      disclaimer="We respect your privacy. Your application details are only used by the Digital AELA academic team."
    />
  );
};

export default JoinAsTeacher;

