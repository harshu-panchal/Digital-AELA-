import { useCallback } from "react";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import ContactPageLayout from "../business-components/contact/ContactPageLayout";
import ContactForm from "../business-components/contact/ContactForm";
import { submitContactLead } from "../../../src/services/contactSubmission";

const GeneralInquiry = () => {
  const fields = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your name",
      autoComplete: "name",
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
      name: "subject",
      label: "Subject",
      type: "text",
      placeholder: "How can we help you?",
      fullWidth: true,
    },
    {
      name: "department",
      label: "Route to Department",
      type: "select",
      options: [
        "Admissions & Course Guidance",
        "Corporate Training & HR",
        "Franchise & Partnerships",
        "Finance & Billing",
        "Media & PR",
        "Other",
      ],
    },
    {
      name: "contactPreference",
      label: "Preferred Contact Method",
      type: "select",
      options: ["WhatsApp", "Phone Call", "Email"],
    },
    {
      name: "bestTime",
      label: "Best Time to Reach",
      type: "select",
      options: [
        "Morning (9 AM - 12 PM)",
        "Afternoon (12 PM - 4 PM)",
        "Evening (4 PM - 8 PM)",
        "Weekend",
      ],
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      placeholder:
        "Provide context for your enquiry and any important details we should know before we get in touch.",
      rows: 6,
      fullWidth: true,
    },
  ];

  const handleSubmit = useCallback(
    (payload) => submitContactLead("general-inquiry", payload),
    []
  );

  return (
    <>
      <SEO
        title="Contact Digital AELA Support"
        description="Reach out to Digital AELA for admissions, corporate training, franchise, or general enquiries. Our support team is available every day to assist you."
        keywords="contact Digital AELA, Digital AELA support, general enquiry Digital AELA, admissions support"
        url="https://digitalaela.com/contact/general-inquiry"
      />

      <ContactPageLayout
        badge="We're here to help"
        title="General Inquiry / Contact Us"
        subtitle="Get answers, resources, and personalised support"
        description="Whether you're a learner, parent, university, or corporate partner, we're ready to guide you. Share your query and the right team will get back within one business day.">
        <div className="max-w-4xl mx-auto">
          <ContactForm
            fields={fields}
            submitLabel="Submit Enquiry"
            successMessage="Thanks for reaching out! A member of our support team will respond shortly."
            disclaimer="We respect your privacy. Your details will only be used to respond to this enquiry."
            onSubmit={handleSubmit}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          className="mt-10 bg-[#0b0b0b] border border-[#D4AF37]/15 rounded-2xl p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-white font-display mb-4">
            Useful contacts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 leading-relaxed">
            <div className="space-y-2">
              <p>• Admissions & Demo Classes: admissions@digitalaela.com</p>
              <p>• Corporate Partnerships: corporate@digitalaela.com</p>
              <p>• Franchise Desk: franchise@digitalaela.com</p>
            </div>
            <div className="space-y-2">
              <p>• Placement & Career Services: placements@digitalaela.com</p>
              <p>• Finance & Accounts: accounts@digitalaela.com</p>
              <p>• Media & Press: media@digitalaela.com</p>
            </div>
          </div>
        </motion.div>
      </ContactPageLayout>
    </>
  );
};

export default GeneralInquiry;
