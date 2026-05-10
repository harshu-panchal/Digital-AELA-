import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const TermsConditions = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    {
      id: 1,
      title: "1. Introduction",
      content: [
        "Digital AELA offers English language training, digital marketing courses, and career development services. These Terms govern the relationship between you and Digital AELA and must be accepted before using our services.",
      ],
    },
    {
      id: 2,
      title: "2. Service Details and Descriptions",
      content: [
        "All services are carefully structured to meet specific educational and career objectives.",
        "Complete details of courses, placement services, and tutor/franchise opportunities are available on our official website.",
        "For any clarification, you may contact us directly at info@digitalaela.com or +971 502270625.",
      ],
    },
    {
      id: 3,
      title: "3. Payment and Fees",
      content: [],
      subsections: [
        {
          title: "Full payment",
          text: "is required at the time of purchase.",
        },
        {
          title: "We accept multiple secure payment methods,",
          text: "including credit/debit cards and online gateways.",
        },
        {
          title: "Additional charges (if any)",
          text: "such as fast-track requests or premium services will be clearly communicated before payment.",
        },
      ],
    },
    {
      id: 4,
      title: "4. Recurring Payments",
      content: [],
      subsections: [
        {
          title: "For subscription-based services,",
          text: "billing will be automatic at the start of each billing cycle.",
        },
        {
          title: "To avoid charges for the next cycle,",
          text: "you must cancel before the current cycle ends.",
        },
      ],
    },
    {
      id: 5,
      title: "5. Refund and Cancellation Policy",
      content: [
        "Digital AELA follows a strict no-refund policy. Once payment is made and the service is activated, no refunds will be issued under any circumstances.",
        "We strongly encourage reviewing all service descriptions carefully before purchase.",
      ],
    },
    {
      id: 6,
      title: "6. Cancellation of Subscriptions",
      content: [],
      subsections: [
        {
          title: "You may cancel subscription services",
          text: "anytime by contacting our support team.",
        },
        {
          title: "Cancellation will take effect",
          text: "at the end of the current billing period.",
        },
      ],
    },
    {
      id: 7,
      title: "7. Service Delivery Timelines",
      content: [],
      subsections: [
        {
          title: "We provide estimated delivery schedules",
          text: "for services; however, these are indicative and may vary based on complexity and workload.",
        },
        {
          title: "Significant delays",
          text: "will be communicated promptly.",
        },
      ],
    },
    {
      id: 8,
      title: "8. Learning, Certificates & Career Outcomes",
      content: [],
      subsections: [
        {
          title: "Successful students",
          text: "will receive Digital AELA certificates upon completion of required coursework.",
        },
        {
          title: "We provide 100% placement support",
          text: "through our network and guidance programs.",
        },
        {
          title: "While we commit to supporting your career journey,",
          text: "final outcomes such as job offers or promotions depend on multiple external factors.",
        },
      ],
    },
    {
      id: 9,
      title: "9. Client Responsibilities",
      content: [],
      subsections: [
        {
          title: "You must provide accurate and updated information",
          text: "during registration and enrollment.",
        },
        {
          title: "Active participation in classes, tasks, and assignments",
          text: "is required to maximize results.",
        },
        {
          title: "Failure to provide required information within 30 days of purchase",
          text: "may result in service delivery based on available details.",
        },
      ],
    },
    {
      id: 10,
      title: "10. Revisions and Adjustments",
      content: [],
      subsections: [
        {
          title: "Requests for reasonable revisions",
          text: "may be considered within the service scope.",
        },
        {
          title: "Updates after successful job placement or beyond the service scope",
          text: "will require new service enrollment.",
        },
      ],
    },
    {
      id: 11,
      title: "11. Confidentiality and Data Protection",
      content: [],
      subsections: [
        {
          title: "Digital AELA complies",
          text: "with UAE Data Protection Laws and international standards.",
        },
        {
          title: "All client data",
          text: "is securely stored and used only for service delivery.",
        },
        {
          title: "Data will not be shared with third parties",
          text: "without explicit consent, except where required by law.",
        },
      ],
    },
    {
      id: 12,
      title: "12. Data Retention and Deletion",
      content: [],
      subsections: [
        {
          title: "We retain client data",
          text: "for the duration of the service and a reasonable period thereafter for administrative and legal purposes.",
        },
        {
          title: "Upon written request,",
          text: "data can be deleted unless law requires retention.",
        },
      ],
    },
    {
      id: 13,
      title: "13. Intellectual Property",
      content: [],
      subsections: [
        {
          title: "All course materials, books, videos, and digital resources",
          text: "remain the intellectual property of Digital AELA.",
        },
        {
          title: "Users are prohibited from copying, reselling, or distributing our materials",
          text: "without written permission.",
        },
        {
          title: "Violation",
          text: "may lead to immediate termination and legal action.",
        },
      ],
    },
    {
      id: 14,
      title: "14. Operating Hours",
      content: [],
      subsections: [
        {
          title: "Our business hours",
          text: "are Monday to Saturday, 9:00 AM to 6:00 PM (UAE time).",
        },
        {
          title: "Queries and support requests",
          text: "are generally addressed within 72 hours, subject to peak periods.",
        },
      ],
    },
    {
      id: 15,
      title: "15. Third-Party Services",
      content: [],
      subsections: [
        {
          title: "At times, we may recommend external tools or services",
          text: "to enhance your learning experience.",
        },
        {
          title: "We are not responsible for third-party services,",
          text: "and users should review their terms independently.",
        },
      ],
    },
    {
      id: 16,
      title: "16. Complaints and Dispute Resolution",
      content: [],
      subsections: [
        {
          title: "Complaints must be submitted in writing",
          text: "to info@digitalaela.com with full details.",
        },
        {
          title: "We aim to resolve issues",
          text: "fairly and quickly.",
        },
        {
          title: "If necessary,",
          text: "a scheduled phone discussion will be arranged for resolution.",
        },
      ],
    },
    {
      id: 17,
      title: "17. Limitation of Liability",
      content: [],
      subsections: [
        {
          title: "Digital AELA will not be liable",
          text: "for losses, damages, or delays arising from use of our services.",
        },
        {
          title: "Use of our platform",
          text: "is strictly at the user's own risk.",
        },
        {
          title: "Our liability is limited",
          text: "only to the value of the services purchased.",
        },
      ],
    },
    {
      id: 18,
      title: "18. Governing Law and Jurisdiction",
      content: [
        "These Terms are governed by the laws of New Delhi (India).",
        "Any disputes shall fall under the exclusive jurisdiction of the courts in New Delhi, India.",
      ],
    },
    {
      id: 19,
      title: "19. Changes to Terms",
      content: [],
      subsections: [
        {
          title: "We reserve the right",
          text: "to modify or update these Terms at any time.",
        },
        {
          title: "Updates will be published",
          text: "on our website with the revised Effective Date.",
        },
        {
          title: "Continued use of services",
          text: "constitutes acceptance of the revised Terms.",
        },
      ],
    },
    {
      id: 20,
      title: "20. Acceptance of Terms",
      content: [
        "By purchasing or using Digital AELA services, you confirm your understanding and acceptance of these Terms & Conditions.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Terms & Conditions – Digital AELA"
        description="Read Digital AELA's terms and conditions covering service details, payment terms, refund policy, client responsibilities, intellectual property, and legal information."
        keywords="Digital AELA terms and conditions, service terms, payment terms, user agreement, legal terms"
        url="https://digitalaela.com/terms-conditions"
      />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.1),transparent_70%)] opacity-60"></div>
        <div className="layout-container relative z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
              Terms & Conditions –{" "}
              <span className="text-[#D4AF37]">Digital AELA</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-4">
              Effective Date: {currentDate}
            </p>
            <div className="mt-6 pt-6 border-t border-[#D4AF37]/20">
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                Welcome to Digital AELA. By accessing, purchasing, or using our services, you agree to be bound by these Terms & Conditions ("Terms"). These Terms establish a clear understanding between Digital AELA ("we," "our," "us") and our clients ("you," "your"), ensuring smooth service delivery and long-term trust.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Content Section */}
      <section className="py-12 sm:py-16 bg-black">
        <div className="layout-container">
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl border border-[#D4AF37]/20 p-6 sm:p-8 hover:border-[#D4AF37]/40 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <h2 className="text-xl sm:text-2xl font-bold text-[#D4AF37] mb-4 sm:mb-6 font-display">
                  {section.title}
                </h2>
                {section.content.length > 0 && (
                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    {section.content.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className="text-sm sm:text-base text-gray-300 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
                {section.subsections && (
                  <div className="space-y-4 sm:space-y-5 mt-4 sm:mt-6">
                    {section.subsections.map((subsection, subIndex) => (
                      <div key={subIndex} className="pl-4 sm:pl-6 border-l-2 border-[#D4AF37]/30">
                        <h3 className="text-base sm:text-lg font-semibold text-[#F5D26A] mb-1 sm:mb-2">
                          {subsection.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                          {subsection.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-12 sm:py-16 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="layout-container">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl border border-[#D4AF37]/20 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] mb-6 sm:mb-8 font-display text-center">
                📍 Contact Information
              </h2>
              <div className="space-y-4 sm:space-y-6 text-center">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    Digital AELA
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    New Delhi, India
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-4 border-t border-[#D4AF37]/20">
                  <a
                    href="mailto:info@digitalaela.com"
                    className="flex items-center gap-2 text-sm sm:text-base text-[#F5D26A] hover:text-[#D4AF37] transition-colors duration-200">
                    <span className="text-lg">📧</span>
                    <span>info@digitalaela.com</span>
                  </a>
                  <a
                    href="tel:+971545454982"
                    className="flex items-center gap-2 text-sm sm:text-base text-[#F5D26A] hover:text-[#D4AF37] transition-colors duration-200">
                    <span className="text-lg">📞</span>
                    <span>+971 545454982</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default TermsConditions;

