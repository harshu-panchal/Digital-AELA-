// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import ContactPageLayout from "../business-components/contact/ContactPageLayout";
import ContactForm from "../business-components/contact/ContactForm";

const WorkshopEnrollment = () => {
  const fields = [
    {
      name: "organizationName",
      label: "Organisation / Institute",
      type: "text",
      placeholder: "Company or institute name",
      fullWidth: true,
    },
    {
      name: "contactPerson",
      label: "Contact Person",
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
      name: "workshopSelection",
      label: "Workshop / Programme",
      type: "select",
      options: [
        "Public Speaking & Presentation Mastery",
        "Accent Neutralisation & Voice Training",
        "Corporate Communication Bootcamp",
        "Digital Marketing Accelerator",
        "Career Launchpad (Colleges / Universities)",
        "Custom Programme",
      ],
      fullWidth: true,
    },
    {
      name: "participantsCount",
      label: "Number of Participants",
      type: "select",
      options: [
        "Up to 25 participants",
        "26 - 50 participants",
        "51 - 100 participants",
        "100+ participants",
      ],
    },
    {
      name: "participantProfile",
      label: "Participant Profile",
      type: "select",
      options: [
        "College Students",
        "Early Career Professionals",
        "Mid-Level Managers",
        "Customer-Facing Teams",
        "Leadership / CXOs",
      ],
    },
    {
      name: "preferredStartDate",
      label: "Preferred Start Date",
      type: "date",
    },
    {
      name: "preferredDuration",
      label: "Preferred Duration",
      type: "select",
      options: [
        "1-Day Intensive",
        "2-3 Day Bootcamp",
        "4-6 Week Programme",
        "Ongoing Monthly Engagement",
      ],
    },
    {
      name: "preferredMode",
      label: "Delivery Mode",
      type: "select",
      options: [
        "On-Site (Your Location)",
        "Digital / Live Online",
        "Hybrid",
        "We are flexible",
      ],
    },
    {
      name: "additionalNotes",
      label: "Learning Objectives / Notes",
      type: "textarea",
      placeholder:
        "Describe focus areas, participant expectations, budget considerations, and any certifications required.",
      rows: 6,
      fullWidth: true,
    },
  ];

  return (
    <>
      <SEO
        title="Enroll in Workshops & Training | Digital AELA"
        description="Plan customised workshops for your teams or institute. Submit your requirements for public speaking, corporate communication, digital marketing, and career readiness programmes."
        keywords="workshop enrollment, corporate training workshop, public speaking workshop, digital marketing bootcamp"
        url="https://digitalaela.com/contact/workshop-training"
      />

      <ContactPageLayout
        badge="Team Training & Workshops"
        title="Enroll in a Workshop or Training Programme"
        subtitle="High-impact learning experiences tailored to your teams"
        description="Share your training goals and participant details. We will craft an agenda with outcomes, facilitator profiles, and delivery plans aligned to your organisation.">
        <div className="max-w-4xl mx-auto">
          <ContactForm
            fields={fields}
            submitLabel="Submit Workshop Request"
            successMessage="Thanks for the request! Our training consultants will send a customised proposal shortly."
            disclaimer="Once we receive your request, we will confirm feasibility, investment, and facilitator availability within two business days."
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          className="mt-10 bg-[#0b0b0b] border border-[#D4AF37]/15 rounded-2xl p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-white font-display mb-4">
            Popular workshop formats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300 leading-relaxed">
            <div className="space-y-2">
              <p>• Communication Masterclass (1 or 2 days)</p>
              <p>• Accent & Voice for Customer Service Teams</p>
              <p>• Placement Accelerator for Colleges</p>
            </div>
            <div className="space-y-2">
              <p>• Digital Marketing Playbook for SMEs</p>
              <p>• Sales Presentation & Pitch Labs</p>
              <p>• Leadership Storytelling & Executive Presence</p>
            </div>
            <div className="space-y-2">
              <p>• Custom onboarding programmes for MNCs</p>
              <p>• IELTS / OET crash courses for healthcare teams</p>
              <p>• Learn & Earn gamified engagement series</p>
            </div>
          </div>
        </motion.div>
      </ContactPageLayout>
    </>
  );
};

export default WorkshopEnrollment;
