import { useCallback } from "react";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import ContactPageLayout from "../business-components/contact/ContactPageLayout";
import ContactForm from "../business-components/contact/ContactForm";
import { submitContactLead } from "../../../src/services/contactSubmission";
import TranslatedText from "../../../src/components/TranslatedText";

const BookDemo = () => {
  const fields = [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      placeholder: "Enter your first name",
      autoComplete: "given-name",
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: "Enter your last name",
      autoComplete: "family-name",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "you@example.com",
      autoComplete: "email",
    },
    {
      name: "phone",
      label: "Phone / WhatsApp",
      type: "tel",
      placeholder: "+971 50 000 0000",
      autoComplete: "tel",
    },
    {
      name: "preferredCourse",
      label: "Course of Interest",
      type: "select",
      placeholder: "Select a course",
      options: [
        "Corporate Training",
        "Digital Marketing",
        "English Language",
        "Career Counselling & Skill Development",
        "Learn & Earn Programs",
        "Other / Custom",
      ],
      fullWidth: true,
    },
    {
      name: "preferredMode",
      label: "Preferred Mode",
      type: "select",
      options: [
        "Online Live (Zoom / Teams)",
        "In-Person (Dubai)",
        "On-Site Corporate Training",
        "Hybrid",
      ],
    },
    {
      name: "preferredDate",
      label: "Preferred Demo Date",
      type: "date",
    },
    {
      name: "preferredTime",
      label: "Preferred Demo Time",
      type: "time",
    },
    {
      name: "organization",
      label: "School / Company (Optional)",
      type: "text",
      placeholder: "Organisation name",
      required: false,
    },
    {
      name: "participants",
      label: "Number of Participants",
      type: "select",
      options: [
        "1 learner",
        "2-5 learners",
        "6-15 learners",
        "16-30 learners",
        "30+ learners",
      ],
    },
    {
      name: "goals",
      label: "Learning Goals / Questions",
      type: "textarea",
      placeholder:
        "Tell us about the learner(s), current challenges, and the outcomes you expect from the session.",
      rows: 5,
      fullWidth: true,
    },
  ];

  const handleSubmit = useCallback(
    (payload) => submitContactLead("book-demo", payload),
    []
  );

  return (
    <>
      <SEO
        title="Book a Demo Class | Digital AELA"
        description="Experience Digital AELA's teaching methodology with a personalised demo. Schedule a free session for your team or yourself and explore how we deliver measurable results."
        keywords="book demo class, corporate training demo, English speaking demo, digital marketing demo, Digital AELA demo class"
        url="https://digitalaela.com/contact/book-demo"
      />

      <ContactPageLayout
        badge={<TranslatedText>Experience Digital AELA</TranslatedText>}
        title={<TranslatedText>Book a Personalised Demo Class</TranslatedText>}
        subtitle={<TranslatedText>See how we transform learning into placement-ready skills</TranslatedText>}
        description={<TranslatedText>Share your requirements and we will schedule a tailored session with our senior faculty. Demos are available online, in-person, or at your corporate location.</TranslatedText>}>
        <div className="max-w-4xl mx-auto">
          <ContactForm
            fields={fields}
            submitLabel={<TranslatedText>Book My Demo Class</TranslatedText>}
            successMessage={<TranslatedText>Demo request received! Our academic advisor will reach out within 24 hours to confirm your session.</TranslatedText>}
            disclaimer={<TranslatedText>By submitting this form you consent to be contacted by Digital AELA's programme advisors via phone, email, or WhatsApp.</TranslatedText>}
            onSubmit={handleSubmit}
            formId="book-demo"
            pendingMessage={<TranslatedText>Your demo request is pending approval. Our team will review it and contact you within 24 hours.</TranslatedText>}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "🎯",
              title: <TranslatedText>Customised Agenda</TranslatedText>,
              description: <TranslatedText>We tailor every demo to your business use-case, learner profile, and regional requirements.</TranslatedText>,
            },
            {
              icon: "👨‍🏫",
              title: <TranslatedText>Expert Faculty</TranslatedText>,
              description: <TranslatedText>Interact with senior trainers who have 10-18 years of experience coaching CXOs, teams, and students across 5+ countries.</TranslatedText>,
            },
            {
              icon: "📊",
              title: <TranslatedText>Outcome Framework</TranslatedText>,
              description: <TranslatedText>Understand our assessment models, feedback reports, and placement assistance approach during the demo.</TranslatedText>,
            },
          ].map((card, index) => (
            <div
              key={index}
              className="bg-[#0b0b0b] border border-[#D4AF37]/15 rounded-2xl px-5 py-6 space-y-3">
              <div className="text-3xl">{card.icon}</div>
              <h4 className="text-lg font-semibold text-white font-display">
                {card.title}
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </motion.div>
      </ContactPageLayout>
    </>
  );
};

export default BookDemo;
