import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const Disclaimer = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    {
      id: 1,
      title: "1. Educational Purpose",
      content: [
        "All content, courses, and services provided by Digital AELA are intended for educational, training, and career development purposes only.",
        "While we strive to provide accurate and reliable learning resources, the content should not be treated as professional, financial, or legal advice.",
      ],
    },
    {
      id: 2,
      title: "2. No Absolute Guarantees",
      content: [
        "Digital AELA provides placement support, mentorship, and career guidance. However, we do not guarantee specific employment outcomes, salary levels, promotions, or job offers.",
        "Success depends on multiple factors including personal effort, skill level, industry conditions, and market demand — factors beyond our control.",
      ],
    },
    {
      id: 3,
      title: "3. Third-Party Services",
      content: [
        "At times, we may recommend or integrate third-party tools, apps, or services (e.g., payment gateways, LinkedIn tools, external job portals).",
        "Digital AELA does not endorse, control, or take responsibility for third-party platforms. Users must review their terms and conditions independently.",
      ],
    },
    {
      id: 4,
      title: "4. Technology & Service Limitations",
      content: [
        "While we maintain robust systems, we do not warrant that our website or mobile app will be error-free, virus-free, or uninterrupted at all times.",
        "Technical failures, maintenance activities, or external network issues may temporarily affect access.",
        "Digital AELA shall not be held liable for data loss, delays, or disruptions caused by such factors.",
      ],
    },
    {
      id: 5,
      title: "5. Intellectual Property",
      content: [
        "All study materials, books, presentations, and course videos remain the intellectual property of Digital AELA.",
        "Users may not copy, reproduce, distribute, or commercialize our content without written consent. Any unauthorized use may result in legal action.",
      ],
    },
    {
      id: 6,
      title: "6. Personal Responsibility",
      content: [
        "Users are responsible for how they apply the knowledge and skills acquired from Digital AELA's programs.",
        "Decisions made based on our training, guidance, or advice are taken at the user's own discretion and risk.",
        "Digital AELA will not be held liable for any direct or indirect loss, damages, or consequences resulting from the use of our services.",
      ],
    },
    {
      id: 7,
      title: "7. Governing Law",
      content: [
        "This Disclaimer shall be governed by and construed in accordance with the laws of New Delhi, India.",
        "Any disputes shall be subject to the jurisdiction of the courts in New Delhi, India.",
      ],
    },
    {
      id: 8,
      title: "8. Updates to Disclaimer",
      content: [
        "We reserve the right to amend or update this Disclaimer at any time. Changes will take effect immediately upon publication on our website. Users are encouraged to review this page periodically.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Disclaimer – Digital AELA"
        description="Read Digital AELA's disclaimer covering educational purpose, guarantees, third-party services, technology limitations, intellectual property, and legal information."
        keywords="Digital AELA disclaimer, terms of use, legal information, educational disclaimer, service limitations"
        url="https://digitalaela.com/disclaimer"
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
              Disclaimer – <span className="text-[#D4AF37]">Digital AELA</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-4">
              Effective Date: {currentDate}
            </p>
            <div className="mt-6 pt-6 border-t border-[#D4AF37]/20">
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                This Disclaimer governs the use of the website, mobile application, and services offered by Digital AELA. By accessing or using our platform, you acknowledge and agree to the statements outlined below.
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
                <div className="space-y-3 sm:space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p
                      key={pIndex}
                      className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
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
                  <p className="text-sm sm:text-base text-gray-300">
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
                    href="tel:+971502270625"
                    className="flex items-center gap-2 text-sm sm:text-base text-[#F5D26A] hover:text-[#D4AF37] transition-colors duration-200">
                    <span className="text-lg">📞</span>
                    <span>+971 502270625</span>
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

export default Disclaimer;

