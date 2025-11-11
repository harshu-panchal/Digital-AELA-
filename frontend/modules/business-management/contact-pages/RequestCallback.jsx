import { useCallback } from "react";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import ContactPageLayout from "../business-components/contact/ContactPageLayout";
import ContactForm from "../business-components/contact/ContactForm";
import { submitContactLead } from "../../../src/services/contactSubmission";

const RequestCallback = () => {
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
      name: "callPurpose",
      label: "Call Purpose",
      type: "select",
      options: [
        "Admissions & Course Guidance",
        "Corporate Training Enquiry",
        "Career Counselling",
        "Franchise Partnership",
        "Finance / Billing",
        "Other",
      ],
      fullWidth: true,
    },
    {
      name: "preferredDay",
      label: "Preferred Day",
      type: "select",
      options: ["Today", "Tomorrow", "Within 3 Days", "Weekend"],
    },
    {
      name: "preferredTime",
      label: "Preferred Time Slot",
      type: "select",
      options: [
        "Morning (9 AM - 12 PM)",
        "Afternoon (12 PM - 3 PM)",
        "Evening (3 PM - 7 PM)",
        "Night (7 PM - 9 PM)",
      ],
    },
    {
      name: "timezone",
      label: "Timezone",
      type: "select",
      options: [
        { label: "Gulf Standard Time (GST)", value: "GST" },
        { label: "India Standard Time (IST)", value: "IST" },
        { label: "Pakistan Standard Time (PKT)", value: "PKT" },
        { label: "Bangladesh Time (BST)", value: "BST" },
        { label: "Other", value: "Other" },
      ],
    },
    {
      name: "message",
      label: "Additional Context",
      type: "textarea",
      placeholder:
        "Briefly describe your query so we can connect you to the right advisor.",
      rows: 5,
      fullWidth: true,
      required: false,
    },
  ];

  const handleSubmit = useCallback(
    (payload) => submitContactLead("request-callback", payload),
    []
  );

  return (
    <>
      <SEO
        title="Request a Call Back | Digital AELA"
        description="Need a quick conversation? Request a call back from Digital AELA advisors for admissions, corporate partnerships, or learner support."
        keywords="request call back, Digital AELA call back, admissions call back, corporate training call back"
        url="https://digitalaela.com/contact/callback"
      />

      <ContactPageLayout
        badge="Talk to us"
        title="Request a Call Back"
        subtitle="Let us know when and how to reach you"
        description="Specify your preferred time and topic. Our advisors across admissions, corporate training, and placements are ready to assist you.">
        <div className="max-w-4xl mx-auto">
          <ContactForm
            fields={fields}
            submitLabel="Request Call Back"
            successMessage="Thanks! A Digital AELA advisor will confirm your callback shortly."
            disclaimer="We typically call from UAE or India numbers. Please whitelist international calls to ensure we can reach you."
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
            Tips for a productive call
          </h3>
          <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
            <p>
              • Keep your documents handy (CV, course preferences, proposal
              outline).
            </p>
            <p>
              • Let us know if additional stakeholders should join the call.
            </p>
            <p>
              • Prefer a virtual meeting? Mention it and we'll send a Zoom link.
            </p>
          </div>
        </motion.div>
      </ContactPageLayout>
    </>
  );
};

export default RequestCallback;
