import { useCallback } from "react";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import ContactPageLayout from "../business-components/contact/ContactPageLayout";
import ContactForm from "../business-components/contact/ContactForm";
import { submitContactLead } from "../../../src/services/contactSubmission";
import TranslatedText from "../../../src/components/TranslatedText";

const BusinessCollaboration = () => {
  const fields = [
    {
      name: "companyName",
      label: "Company Name",
      type: "text",
      placeholder: "Organisation name",
    },
    {
      name: "contactPerson",
      label: "Primary Contact Person",
      type: "text",
      placeholder: "Full name",
    },
    {
      name: "email",
      label: "Work Email",
      type: "email",
      placeholder: "name@company.com",
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
      name: "companyWebsite",
      label: "Company Website",
      type: "text",
      placeholder: "https://",
      required: false,
    },
    {
      name: "industry",
      label: "Industry",
      type: "text",
      placeholder: "E.g. Hospitality, Aviation, EdTech, Retail",
    },
    {
      name: "teamSize",
      label: "Team Size",
      type: "select",
      options: [
        "1 - 20 employees",
        "21 - 50 employees",
        "51 - 200 employees",
        "201 - 500 employees",
        "500+ employees",
      ],
    },
    {
      name: "collaborationType",
      label: "Collaboration Type",
      type: "select",
      options: [
        "Corporate Language & Communication Training",
        "Digital Marketing Partnership",
        "Workforce Placement / Internship",
        "Custom LMS / Content Solutions",
        "Joint Workshops & Events",
        "Other (describe below)",
      ],
      fullWidth: true,
    },
    {
      name: "location",
      label: "Office Location",
      type: "text",
      placeholder: "City, Country",
    },
    {
      name: "timeline",
      label: "Expected Launch Timeline",
      type: "select",
      options: [
        "Immediate (within 2 weeks)",
        "3 - 6 weeks",
        "6 - 12 weeks",
        "3 months +",
      ],
    },
    {
      name: "message",
      label: "Tell us about your project",
      type: "textarea",
      placeholder:
        "Describe your objectives, target audience, budget range, and any KPIs we should align with.",
      rows: 6,
      fullWidth: true,
    },
  ];

  const handleSubmit = useCallback(
    (payload) => submitContactLead("business-collaboration", payload),
    []
  );

  return (
    <>
      <SEO
        title="Request Business Collaboration | Digital AELA"
        description="Partner with Digital AELA for corporate training, recruitment support, content development, and placement collaborations. Share your requirements and get a custom proposal."
        keywords="business collaboration, corporate training partner, recruitment partnership, Digital AELA partnerships"
        url="https://digitalaela.com/contact/business-collaboration"
      />

      <ContactPageLayout
        badge={<TranslatedText>Strategic Partnerships</TranslatedText>}
        title={<TranslatedText>Request a Business Collaboration</TranslatedText>}
        subtitle={<TranslatedText>Empower your teams with customised training, placements, and digital solutions</TranslatedText>}
        description={<TranslatedText>Collaborate with Digital AELA for executive coaching, workforce development, or co-branded learning programmes. We co-create solutions that meet measurable business outcomes.</TranslatedText>}>
        <div className="max-w-4xl mx-auto">
          <ContactForm
            fields={fields}
            submitLabel={<TranslatedText>Submit Collaboration Request</TranslatedText>}
            successMessage={<TranslatedText>Thank you! Our partnerships team will reach out with the next steps within one business day.</TranslatedText>}
            disclaimer={<TranslatedText>We sign NDAs upon request. Your project details are kept confidential and viewed only by senior partnership managers.</TranslatedText>}
            onSubmit={handleSubmit}
            formId="business-collaboration"
            pendingMessage={<TranslatedText>Your collaboration request is pending approval. Our partnerships team will review it and get back to you within one business day.</TranslatedText>}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "🤝",
              title: <TranslatedText>End-to-End Delivery</TranslatedText>,
              description: <TranslatedText>From needs analysis to facilitation, assessments, and reporting — our team manages every stage of the engagement.</TranslatedText>,
            },
            {
              icon: "🌍",
              title: <TranslatedText>Regional Expertise</TranslatedText>,
              description: <TranslatedText>Experience delivering projects across UAE, India, Saudi Arabia, Qatar, Bahrain, and remote-first organisations.</TranslatedText>,
            },
            {
              icon: "📈",
              title: <TranslatedText>Measurable Outcomes</TranslatedText>,
              description: <TranslatedText>Define KPIs across language proficiency, sales enablement, customer experience, and placement success. We report on each milestone.</TranslatedText>,
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

export default BusinessCollaboration;
