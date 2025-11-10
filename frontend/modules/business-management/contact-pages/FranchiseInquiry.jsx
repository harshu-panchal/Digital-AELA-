// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import ContactPageLayout from "../business-components/contact/ContactPageLayout";
import ContactForm from "../business-components/contact/ContactForm";

const FranchiseInquiry = () => {
  const fields = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your full name",
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
      placeholder: "+91 90000 00000",
      autoComplete: "tel",
    },
    {
      name: "city",
      label: "City",
      type: "text",
      placeholder: "City of operation",
    },
    {
      name: "country",
      label: "Country",
      type: "text",
      placeholder: "Country",
    },
    {
      name: "investmentCapacity",
      label: "Investment Capacity",
      type: "select",
      options: [
        "USD 5,000 - 10,000",
        "USD 10,000 - 25,000",
        "USD 25,000 - 40,000",
        "USD 40,000+",
      ],
    },
    {
      name: "experience",
      label: "Background",
      type: "select",
      options: [
        "Education / Coaching",
        "Corporate Training",
        "HR / Recruitment",
        "Business Owner",
        "First-time Entrepreneur",
      ],
    },
    {
      name: "timeframe",
      label: "Planned Launch Timeline",
      type: "select",
      options: ["Within 1 month", "1 - 3 months", "3 - 6 months", "6 months +"],
    },
    {
      name: "hearAbout",
      label: "How did you hear about us?",
      type: "select",
      options: [
        "Digital Marketing / Social Media",
        "Reference from Partner",
        "Existing Learner",
        "Event / Expo",
        "Other",
      ],
      required: false,
    },
    {
      name: "message",
      label: "Tell us about your vision",
      type: "textarea",
      placeholder:
        "Share your plans, target audience, existing facilities, and any support you expect from Digital AELA.",
      rows: 6,
      fullWidth: true,
    },
  ];

  return (
    <>
      <SEO
        title="Franchise Partnership Inquiry | Digital AELA"
        description="Start your own Digital AELA training centre. Submit a franchise enquiry to receive investment details, launch roadmap, and partnership benefits."
        keywords="Digital AELA franchise, education franchise UAE, training franchise India, corporate training franchise"
        url="https://digitalaela.com/contact/franchise-partnership"
      />

      <ContactPageLayout
        badge="Partner with Digital AELA"
        title="Franchise Partnership Inquiry"
        subtitle="Launch a Digital AELA learning centre in your city"
        description="Build a profitable education business with our proven curriculum, placement network, and marketing engine. Tell us about your market and we will share the franchise roadmap.">
        <div className="max-w-4xl mx-auto">
          <ContactForm
            fields={fields}
            submitLabel="Submit Franchise Inquiry"
            successMessage="Thank you for your interest! Our expansion team will reach out with the franchise information deck."
            disclaimer="Submitting this form does not create a legal obligation. We will schedule a discovery call before sharing agreements."
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          className="mt-10 bg-[#0b0b0b] border border-[#D4AF37]/15 rounded-2xl p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-white font-display mb-4">
            Franchise benefits at a glance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 leading-relaxed">
            <div className="space-y-2">
              <p>
                • Exclusive territory rights with multi-city upgrade options
              </p>
              <p>• 360° trainer certification and placement support</p>
              <p>
                • Launch marketing kit, social media campaigns, and lead funnels
              </p>
            </div>
            <div className="space-y-2">
              <p>• Central LMS, assessments, and analytics dashboard</p>
              <p>• Continuous curriculum updates mapped to employer needs</p>
              <p>• Quarterly business reviews to scale revenue and retention</p>
            </div>
          </div>
        </motion.div>
      </ContactPageLayout>
    </>
  );
};

export default FranchiseInquiry;
