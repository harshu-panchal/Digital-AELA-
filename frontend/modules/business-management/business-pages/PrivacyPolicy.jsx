import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const PrivacyPolicy = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    {
      id: 1,
      title: "1. Information We Collect",
      content: [
        "To provide high-quality education and career services, we may collect:",
      ],
      subsections: [
        {
          title: "Account Information:",
          text: "Name, email address, phone number, password, country, city, and any profile details you choose to provide.",
        },
        {
          title: "Educational & Career Information:",
          text: "Resume details, work history, educational qualifications, and employment preferences (only if you voluntarily submit them for career services).",
        },
        {
          title: "Payment & Billing Information:",
          text: "Payment method, transaction details, billing address, and other necessary data through secure payment gateways.",
        },
        {
          title: "Service Usage Data:",
          text: "Login history, course activity, progress tracking, and communication with our support team.",
        },
        {
          title: "Technical & Device Data:",
          text: "IP address, browser type, device type, operating system, and cookies to enhance your browsing experience.",
        },
        {
          title: "Optional Data:",
          text: "Feedback, reviews, and survey responses you may choose to share with us.",
        },
      ],
    },
    {
      id: 2,
      title: "2. Purpose of Collecting Information",
      content: [
        "We process your data strictly for legitimate and lawful purposes, including:",
      ],
      subsections: [
        {
          title: "Service Delivery:",
          text: "To enroll you in courses, provide live and recorded classes, issue certificates, and offer placement services.",
        },
        {
          title: "User Experience:",
          text: "To personalize content, improve our website, and enhance your learning journey.",
        },
        {
          title: "Communication:",
          text: "To send important service updates, reminders, offers, newsletters, and customer support responses.",
        },
        {
          title: "Legal & Compliance:",
          text: "To comply with financial, tax, and data protection regulations in the UAE and internationally.",
        },
        {
          title: "Business Growth:",
          text: "To analyze trends, develop new services, and strengthen Digital AELA's educational ecosystem.",
        },
      ],
    },
    {
      id: 3,
      title: "3. Basis of Processing Personal Data",
      content: [
        "We process your personal information under the following legal bases:",
      ],
      subsections: [
        {
          title: "Contractual Necessity:",
          text: "When processing is required to deliver the services you request.",
        },
        {
          title: "Consent:",
          text: "When you voluntarily provide information or opt-in for communications.",
        },
        {
          title: "Legitimate Interest:",
          text: "To secure our platform, prevent misuse, and improve efficiency.",
        },
        {
          title: "Legal Obligation:",
          text: "To meet regulatory requirements or respond to lawful authorities.",
        },
      ],
    },
    {
      id: 4,
      title: "4. Data Sharing & Disclosure",
      content: [
        "Your personal information is treated with strict confidentiality. However, it may be shared in the following limited circumstances:",
      ],
      subsections: [
        {
          title: "Internal Staff:",
          text: "Only with authorized employees who require access to perform their duties.",
        },
        {
          title: "Trusted Partners:",
          text: "With vetted tutors, franchise partners, or affiliates involved in delivering your chosen services.",
        },
        {
          title: "Third-Party Service Providers:",
          text: "With payment processors, IT support providers, and analytics tools (e.g., Google Analytics) bound by confidentiality agreements.",
        },
        {
          title: "Legal & Regulatory Authorities:",
          text: "Where disclosure is required by law, court orders, or government authorities.",
        },
        {
          title: "Business Restructuring:",
          text: "In the event of mergers, acquisitions, or sale of business assets, your data may be transferred securely to the new entity.",
        },
      ],
    },
    {
      id: 5,
      title: "5. Data Retention",
      content: [],
      subsections: [
        {
          title: "Retention Duration:",
          text: "We retain personal data only for as long as necessary to fulfill the purposes described or as required by law.",
        },
        {
          title: "Deletion Process:",
          text: "Once the retention period expires, data will be permanently deleted, anonymized, or archived in compliance with applicable data protection laws.",
        },
        {
          title: "User Request:",
          text: "You may request deletion of your personal data anytime, subject to regulatory and contractual obligations.",
        },
      ],
    },
    {
      id: 6,
      title: "6. Your Rights as a User",
      content: [
        "As a valued user of Digital AELA, you have the following rights:",
      ],
      subsections: [
        {
          title: "Access & Portability:",
          text: "To request a copy of the personal data we hold about you.",
        },
        {
          title: "Correction:",
          text: "To update or correct inaccurate or incomplete data.",
        },
        {
          title: 'Erasure ("Right to be Forgotten"):',
          text: "To request deletion of your data when no longer necessary.",
        },
        {
          title: "Restriction of Processing:",
          text: "To limit how your data is used in certain situations.",
        },
        {
          title: "Objection:",
          text: "To object to direct marketing or data processing based on legitimate interests.",
        },
        {
          title: "Withdraw Consent:",
          text: "To withdraw your consent for optional data uses at any time.",
        },
      ],
      footer: "To exercise these rights, contact us at 📧 info@digitalaela.com | 📞 +971 502270625.",
    },
    {
      id: 7,
      title: "7. Data Security",
      content: [
        "We take data security seriously and employ:",
      ],
      subsections: [
        {
          title: "Encrypted connections (SSL/TLS)",
          text: "for all transactions.",
        },
        {
          title: "Regular monitoring",
          text: "and intrusion detection systems.",
        },
        {
          title: "Access restrictions",
          text: "to ensure only authorized staff can access personal data.",
        },
        {
          title: "Industry-standard data storage",
          text: "and backup solutions.",
        },
      ],
      warning: "⚠️ Please note: While we follow best practices, no digital platform can guarantee 100% protection. Users share information at their own discretion.",
    },
    {
      id: 8,
      title: "8. International Data Transfers",
      content: [
        "As Digital AELA serves students globally, your data may be transferred to and processed in jurisdictions outside the UAE. We ensure that such transfers comply with international data protection standards, including GDPR (where applicable).",
      ],
    },
    {
      id: 9,
      title: "9. Children's Privacy",
      content: [
        "Our services are primarily designed for individuals above the age of 16. We do not knowingly collect personal data from children without parental consent. If you believe a child has shared information with us, please contact us immediately.",
      ],
    },
    {
      id: 10,
      title: "10. Updates to This Policy",
      content: [
        "We may revise this Privacy Policy from time to time. Updates will be posted on our website with a new Effective Date. We encourage users to review the policy periodically to stay informed about how we protect their data.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Privacy Policy – Digital AELA"
        description="Read Digital AELA's privacy policy covering data collection, usage, sharing, security, and your rights as a user. Learn how we protect your personal information."
        keywords="Digital AELA privacy policy, data protection, GDPR, personal information, data security, user rights"
        url="https://digitalaela.com/privacy-policy"
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
              Privacy Policy – <span className="text-[#D4AF37]">Digital AELA</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-4">
              Effective Date: {currentDate}
            </p>
            <div className="mt-6 pt-6 border-t border-[#D4AF37]/20">
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                At Digital AELA, your privacy is our priority. We recognize the importance of protecting personal data in today's digital world and are fully committed to managing it with integrity, transparency, and respect. This Privacy Policy outlines how we collect, process, use, store, and protect your information when you interact with our website, mobile application, and related services.
              </p>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed mt-4">
                By accessing or using our platform, you agree to the practices described in this Privacy Policy.
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
                transition={{ duration: 0.5, delay: index * 0.1 }}
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
                {section.footer && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#D4AF37]/20">
                    <p className="text-sm sm:text-base text-[#F5D26A] leading-relaxed">
                      {section.footer}
                    </p>
                  </div>
                )}
                {section.warning && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#D4AF37]/20">
                    <p className="text-sm sm:text-base text-yellow-400 leading-relaxed">
                      {section.warning}
                    </p>
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
                11. Contact Information
              </h2>
              <div className="space-y-4 sm:space-y-6 text-center">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    Digital AELA
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    📍 New Delhi, India
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
                <p className="text-xs sm:text-sm text-gray-400 pt-4 border-t border-[#D4AF37]/20 mt-4">
                  For any privacy-related queries, complaints, or requests, you may reach us at the above contact information.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default PrivacyPolicy;

