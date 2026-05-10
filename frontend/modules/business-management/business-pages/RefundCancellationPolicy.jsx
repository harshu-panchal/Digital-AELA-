import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const RefundCancellationPolicy = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    {
      id: 1,
      title: "1. Nature of Services",
      content: [],
      subsections: [
        {
          title: "Non-Refundable Services:",
          text: "All Digital AELA services are designed and customized to meet the unique needs of each client. Once the service process has begun (whether live sessions, recorded access, or customized guidance), the purchase is deemed final and non-refundable.",
        },
        {
          title: "Commitment of Expertise:",
          text: "Our team invests significant effort and professional expertise in preparing tailored solutions. This investment of time and resources makes refunds impractical.",
        },
      ],
    },
    {
      id: 2,
      title: "2. Payment Acknowledgment",
      content: [],
      subsections: [
        {
          title: "By purchasing a course, subscription, or career service,",
          text: "you acknowledge that your payment is an investment in an intangible, customized service.",
        },
        {
          title: "Once service delivery has started, or access to content is granted,",
          text: "refunds cannot be issued under any condition.",
        },
      ],
    },
    {
      id: 3,
      title: "3. Client Satisfaction & Revisions",
      content: [
        "While refunds are not available, we remain committed to client satisfaction.",
      ],
      subsections: [
        {
          title: "If you have concerns about the quality of a service",
          text: "(e.g., feedback on a draft CV or assignment), you may contact us within 3 days of receiving the service output.",
        },
        {
          title: "Within the scope of the original purchase,",
          text: "we will provide up to two revisions at no additional cost.",
        },
        {
          title: "Revisions are intended for minor adjustments and improvements;",
          text: "they do not extend to new requirements or changes outside the purchased service scope.",
        },
      ],
    },
    {
      id: 4,
      title: "4. Subscription Cancellations",
      content: [],
      subsections: [
        {
          title: "For subscription-based services,",
          text: "you may request cancellation before the renewal of the next billing cycle.",
        },
        {
          title: "Upon cancellation,",
          text: "you will not be charged further, but any amount already paid for the current cycle is non-refundable.",
        },
      ],
    },
    {
      id: 5,
      title: "5. Live & Recorded Classes",
      content: [],
      subsections: [
        {
          title: "Access to live classes",
          text: "is provided according to scheduled timings. If you miss a class, you may access the recording (where available).",
        },
        {
          title: "Missed classes or personal scheduling conflicts",
          text: "do not entitle users to refunds, discounts, or replacement sessions.",
        },
      ],
    },
    {
      id: 6,
      title: "6. Service Delivery Timelines",
      content: [],
      subsections: [
        {
          title: "Estimated delivery timelines",
          text: "for customized services (such as profile reviews or coaching sessions) will be communicated at the time of purchase.",
        },
        {
          title: "These are approximate and may vary based on complexity and workload.",
          text: "Delays will be informed in advance, but refunds will not be issued.",
        },
      ],
    },
    {
      id: 7,
      title: "7. Contact & Complaints",
      content: [
        "For any concerns regarding services or cancellation queries, you may contact us at:",
      ],
      contactInfo: true,
    },
    {
      id: 8,
      title: "8. Governing Law",
      content: [
        "This Refund & Cancellation Policy is governed by the laws of New Delhi (India). Any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.",
      ],
    },
    {
      id: 9,
      title: "9. Final Agreement",
      content: [
        "By purchasing or subscribing to our services, you acknowledge that you have read, understood, and agreed to this Refund & Cancellation Policy.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Refund & Cancellation Policy – Digital AELA"
        description="Read Digital AELA's refund and cancellation policy covering service terms, payment acknowledgment, revisions, subscription cancellations, and contact information."
        keywords="Digital AELA refund policy, cancellation policy, no refund policy, service terms, payment terms"
        url="https://digitalaela.com/refund-cancellation-policy"
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
              Refund & Cancellation Policy –{" "}
              <span className="text-[#D4AF37]">Digital AELA</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-4">
              Effective Date: {currentDate}
            </p>
            <div className="mt-6 pt-6 border-t border-[#D4AF37]/20">
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                At Digital AELA, we provide highly personalized educational and career development services, including but not limited to English language training, digital marketing courses, CV and profile guidance, one-on-one mentoring, and placement support. Since our services are delivered in a customized manner and require time, expertise, and tailored content, we follow a strict no-refund policy as outlined below.
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
                {section.contactInfo && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#D4AF37]/20">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                      <a
                        href="mailto:info@digitalaela.com"
                        className="flex items-center gap-2 text-sm sm:text-base text-[#F5D26A] hover:text-[#D4AF37] transition-colors duration-200">
                        <span className="text-lg">📧</span>
                        <span>info@digitalaela.com</span>
                      </a>
                      <span className="hidden sm:inline text-gray-500">|</span>
                      <a
                        href="tel:+971545454982"
                        className="flex items-center gap-2 text-sm sm:text-base text-[#F5D26A] hover:text-[#D4AF37] transition-colors duration-200">
                        <span className="text-lg">📞</span>
                        <span>+971 545454982</span>
                      </a>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 text-center mt-4 pt-4 border-t border-[#D4AF37]/20">
                      We aim to resolve complaints quickly and fairly. In most cases, issues can be clarified and resolved over a short consultation call.
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RefundCancellationPolicy;

