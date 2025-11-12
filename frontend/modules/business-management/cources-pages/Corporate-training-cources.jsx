// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import GiftButton from "../common/GiftButton";

const CorporateTrainingCourses = () => {
  // WhatsApp integration
  const whatsappNumber = "+971508185690";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in Corporate Training programs for my organization."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Training Programs
  const trainingPrograms = [
    {
      id: 1,
      title: "Public Speaking & Stage Confidence",
      seoKeyword:
        "Public speaking course online India Pakistan Bangladesh Nepal",
      description:
        "Build your confidence on stage and in meetings with Digital AELA's Public Speaking Training. Learn voice control, body language, storytelling, and audience engagement. Whether you are a student, teacher, or professional in South Asia and Gulf regions this course helps you become a fearless speaker in every environment.",
      duration: "8 weeks",
      format: "Live online cohort",
      price: "₹18,999",
      features: [
        "Voice control & modulation",
        "Body language mastery",
        "Storytelling techniques",
        "Audience engagement",
      ],
      image:
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 2,
      title: "Communication & Accent Training",
      seoKeyword:
        "English communication and accent training India Pakistan Bangladesh Nepal",
      description:
        "Improve your fluency, clarity, and pronunciation with our Communication & Accent Training program. Learn neutral English accent, reduce MTI (Mother Tongue Influence), and practice real-life dialogues. Perfect for call center employees, international job aspirants, and corporate professionals across South Asia.",
      duration: "10 weeks",
      format: "Live online cohort",
      price: "₹16,999",
      features: [
        "Neutral English accent",
        "MTI reduction techniques",
        "Pronunciation mastery",
        "Real-life dialogue practice",
      ],
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 3,
      title: "Leadership & Team Management Skills",
      seoKeyword: "Leadership training program India Pakistan Bangladesh Nepal",
      description:
        "Become a confident leader with our Leadership & Team Management Training. Learn decision-making, conflict resolution, motivation techniques, and project management. This course is ideal for managers, startup founders, and business leaders in India, Pakistan, Bangladesh, Nepal, South Asia and Gulf regions.",
      duration: "12 weeks",
      format: "Live online cohort",
      price: "₹22,499",
      features: [
        "Decision-making strategies",
        "Conflict resolution",
        "Motivation techniques",
        "Project management",
      ],
      image:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 4,
      title: "Host / Anchor / Speaker Training",
      seoKeyword:
        "Anchor and event hosting training India Pakistan Bangladesh Nepal",
      description:
        "Want to become a professional host, anchor, or event speaker? Our Host & Anchor Training Course covers stage handling, script reading, voice modulation, and event coordination. Perfect for aspiring media professionals, YouTubers, and event speakers in South Asia.",
      duration: "8 weeks",
      format: "Live online cohort",
      price: "₹15,499",
      features: [
        "Stage handling & presence",
        "Script reading mastery",
        "Voice modulation",
        "Event coordination",
      ],
      image:
        "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 5,
      title: "Interview Preparation (HR & Technical)",
      seoKeyword:
        "Job interview preparation training India Pakistan Bangladesh Nepal Gulf",
      description:
        "Equip your teams and trainees to ace HR and technical interviews with confidence. Mock interviews, communication labs, and role-specific question banks ensure they represent your brand flawlessly across South Asia and Gulf placements.",
      duration: "6 weeks",
      format: "Live online cohort",
      price: "₹12,999",
      features: [
        "Mock interview labs",
        "Communication coaching",
        "Role-specific prep",
        "HR & technical panels",
      ],
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 6,
      title: "Call Centre / Customer Service Training",
      seoKeyword:
        "Call centre customer service training India Pakistan Bangladesh Nepal Gulf",
      description:
        "Launch high-performing customer experience teams. Voice & accent, empathy frameworks, and de-escalation drills prepare your workforce for BPO and client-facing roles across global markets.",
      duration: "8 weeks",
      format: "Live online cohort",
      price: "₹11,999",
      features: [
        "Voice & accent mastery",
        "Client communication",
        "Problem-solving drills",
        "CX quality metrics",
      ],
      image:
        "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 7,
      title: "Sales Executive Masterclass",
      seoKeyword: "Sales executive training course South Asia Gulf",
      description:
        "Turn sales teams into revenue powerhouses. Learn territory planning, negotiation playbooks, CRM workflows, and deal-closing psychology tailored for retail, telecom, BFSI, and enterprise sectors.",
      duration: "10 weeks",
      format: "Live online cohort",
      price: "₹19,999",
      features: [
        "Consultative selling",
        "Negotiation labs",
        "Client relationship design",
        "CRM implementation",
      ],
      image:
        "https://images.unsplash.com/photo-1507679622673-989605832e3d?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 8,
      title: "Custom Training Request",
      seoKeyword: "Corporate training programs customized South Asia",
      description:
        "At Digital AELA, we understand every company and individual has unique training needs. Our Custom Training Programs allow businesses and learners to request personalized modules in communication, leadership, or technical skills. Available across South Asia and Gulf regions with both online and offline options.",
      duration: "Customized",
      format: "Live online cohort",
      price: "Custom Pricing",
      features: [
        "Personalized curriculum",
        "Flexible scheduling",
        "Industry-specific modules",
        "Online & offline options",
      ],
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
      isCustom: true,
    },
  ];

  // Benefits
  const benefits = [
    {
      id: 1,
      title: "24/7 Support for Every Learner",
      seoKeyword: "24/7 online learning support South Asia Gulf",
      description:
        "Education ka safar raat-din nahi dekhta, aur hum bhi nahi. With round-the-clock student support, you are never alone in your journey. Whether you are in India, Pakistan, Bangladesh, Nepal, or the Gulf countries, help is always one click away.",
      icon: "🕐",
    },
    {
      id: 2,
      title: "Live + Recorded Classes for Flexibility",
      seoKeyword: "live and recorded online classes India Pakistan Gulf",
      description:
        "We understand every learner has a different routine. That's why Digital AELA offers live interactive sessions plus recorded lessons. You can learn in real-time with mentors or revise at your own pace — anytime, anywhere.",
      icon: "📹",
    },
    {
      id: 3,
      title: "100% Placement Assistance",
      seoKeyword: "job placement training India Pakistan Bangladesh Nepal Gulf",
      description:
        "Our commitment doesn't end with teaching. Digital AELA provides resume building, interview preparation, job portal access, and recruiter connections to ensure that you don't just learn, but you also earn.",
      icon: "💼",
    },
    {
      id: 4,
      title: "Expert Trainers & Mentors",
      seoKeyword: "expert online trainers South Asia Gulf",
      description:
        "Our trainers are not just teachers, they are industry professionals who know what works in the real world. They bring practical knowledge, global experience, and personal mentorship that transforms learners into professionals.",
      icon: "👨‍🏫",
    },
    {
      id: 5,
      title: "Equal Opportunity for All",
      seoKeyword: "equal opportunity education learning to earning platform",
      description:
        "At Digital AELA, we believe education should be free of age, degree, and gender discrimination. Whether you are a student, homemaker, working professional, or retired individual — we provide equal opportunities to learn, grow, and earn.",
      icon: "🤝",
    },
    {
      id: 6,
      title: "Affordable & Accessible Globally",
      seoKeyword:
        "affordable online courses India Pakistan Bangladesh Nepal Gulf",
      description:
        "High-quality education should not be limited to the rich. Digital AELA ensures affordable learning solutions so that anyone from South Asia to the Gulf can access top-class training and career opportunities.",
      icon: "💰",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Corporate Training Courses | Digital AELA - Public Speaking, Leadership, Communication Training"
        description="Professional Corporate Training Programs by Digital AELA. Public Speaking, Communication & Accent Training, Leadership Skills, Host/Anchor Training, and Custom Training Solutions for India, Pakistan, Bangladesh, Nepal, and Gulf countries."
        keywords="Corporate Training, Public Speaking course, Leadership Training, Communication Training, Accent Training, Host Training, Corporate Training India, Pakistan, Bangladesh, Nepal, Gulf countries, Business Training, Professional Development"
        url="https://digitalaela.com/courses/corporate-training"
      />
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden bg-black pt-[120px] pb-20 md:pt-[140px] md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-[12%] h-104 w-104 rounded-full bg-[#D4AF37]/18 blur-[180px]" />
          <div className="absolute bottom-[-25%] right-[20%] h-112 w-md rounded-full bg-[#6A8BFF]/12 blur-[220px]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-6 text-left">
            <motion.span
              initial={{ y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-black shadow-[0_12px_30px_rgba(212,175,55,0.25)]">
              Corporate Training Excellence
            </motion.span>
            <motion.h1
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Empower Your Team with
            </motion.h1>
            <motion.h2
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
              className="bg-linear-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl">
              Professional English
            </motion.h2>
            <motion.p
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              className="max-w-xl text-sm text-gray-300 sm:text-base lg:text-lg">
              Transform your workforce with professional English training
              programs including Public Speaking, Communication & Accent
              Training, Leadership Skills, and Host/Anchor Training. Available
              across South Asia and Gulf regions.
            </motion.p>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              className="flex flex-col gap-4 sm:flex-row">
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-8 py-3 text-sm font-bold text-black shadow-[0_12px_30px_rgba(212,175,55,0.35)] hover:brightness-110 sm:text-base">
                Request a Demo
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                href="#programs"
                className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/60 px-8 py-3 text-sm font-bold text-[#D4AF37] transition-colors duration-200 hover:bg-[#D4AF37] hover:text-black sm:text-base">
                View Corporate Programs
              </motion.a>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mx-auto flex-1 max-w-[420px]">
            <div className="absolute inset-0 -translate-y-6 rounded-[36px] bg-gradient-to-br from-[#D4AF37]/35 via-transparent to-[#6A8BFF]/25 blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80"
              alt="Corporate training workshop in progress"
              className="relative z-10 w-full rounded-[32px] border border-white/10 object-cover shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
              loading="lazy"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Training Programs Section */}
      <motion.section
        id="programs"
        initial={{ opacity: 1 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-20 bg-black">
        <div className="layout-container">
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Our Training <span className="text-[#D4AF37]">Programs</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Professional training programs in Public Speaking, Communication &
              Accent Training, Leadership Skills, and Host/Anchor Training for
              teams across South Asia and Gulf regions
            </p>
          </motion.div>

          {/* Programs Grid */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {trainingPrograms
              .filter((program) => !program.isCustom)
              .map((program, index) => {
                const buyLink = program.buyLink || whatsappUrl;

                return (
                  <motion.div
                    key={program.id}
                    initial={{ y: 40, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.25,
                      delay: index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    whileHover={{ y: -6 }}
                    className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.18)] transition-all duration-300 group">
                    <div className="h-40 w-full overflow-hidden">
                      <img
                        src={program.image}
                        alt={program.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 bg-linear-to-b from-[#141414] to-[#0a0a0a] space-y-4">
                      {(program.title === "Interview Training Course" ||
                        program.title ===
                          "Interview Preparation (HR & Technical)") && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-red-200">
                          Trending
                        </span>
                      )}
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-[#D4AF37] mb-2 font-display leading-tight group-hover:text-[#E5C158] transition-colors duration-300">
                          {program.title}
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
                          {program.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-400">
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-[#D4AF37]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {program.duration}
                        </span>
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-[#D4AF37]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                          {program.format}
                        </span>
                      </div>

                      <div className="border-t border-[#D4AF37]/15 pt-4">
                        <p className="mb-3 text-[#D4AF37]/80 text-[11px] uppercase tracking-[0.25em]">
                          Key Highlights
                        </p>
                        <ul className="space-y-2 text-xs md:text-sm text-gray-300">
                          {program.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-2">
                              <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Program Fee</span>
                          <span className="text-lg font-semibold text-[#F5D26A]">
                            {program.price || "On Request"}
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <motion.a
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            href={buyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs md:text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                            Buy Now
                          </motion.a>
                          <GiftButton
                            className="inline-flex w-full items-center justify-center rounded-full border border-[#F5D26A]/60 px-4 text-xs md:text-sm font-semibold text-[#F5D26A] hover:bg-[#D4AF37] hover:text-black"
                            size="sm">
                            Gift
                          </GiftButton>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </motion.section>

      {/* Why Choose Corporate Training Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-20 bg-[#141414]">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Why Choose <span className="text-[#D4AF37]">Digital AELA</span>?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Your partner in building a strong future with knowledge that
              creates income, and income that creates freedom
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <div className="auto-grid-md lg:grid-cols-3 mb-16">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="bg-[#1a1a1a] rounded-xl p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300">
                {/* Icon */}
                <div className="text-5xl mb-4">{benefit.icon}</div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Training Methodology Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-20 bg-[#141414]">
        <div className="layout-container">
          <div className="auto-grid-sm lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}>
              {/* Badge */}
              <div className="mb-4">
                <span className="inline-block border-2 border-[#D4AF37] text-white px-4 py-2 rounded-lg text-sm font-semibold font-display">
                  Our Methodology
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display tracking-tight leading-none">
                Proven Training <span className="text-[#D4AF37]">Approach</span>
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Our comprehensive training methodology combines interactive
                learning, real-world scenarios, and continuous assessment to
                ensure maximum impact and measurable results for your team.
              </p>

              {/* Methodology Points */}
              <div className="space-y-4">
                {[
                  {
                    title: "Needs Assessment",
                    description:
                      "Comprehensive evaluation of your team's current proficiency and business requirements.",
                  },
                  {
                    title: "Customized Curriculum",
                    description:
                      "Tailored content aligned with your industry, job roles, and organizational goals.",
                  },
                  {
                    title: "Interactive Learning",
                    description:
                      "Engaging sessions with role-plays, case studies, and practical exercises.",
                  },
                  {
                    title: "Progress Monitoring",
                    description:
                      "Regular assessments and detailed reports to track improvement and ROI.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: 0.2 + index * 0.1,
                    }}
                    className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-[#D4AF37]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 font-display">
                        {item.title}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Visual/Stats */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { number: "500+", label: "Companies Trained" },
                { number: "10,000+", label: "Professionals Certified" },
                { number: "95%", label: "Satisfaction Rate" },
                { number: "50+", label: "Industry Sectors" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.3,
                    delay: 0.3 + index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  whileHover={{ scale: 1.1 }}
                  className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/20 text-center">
                  <span className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2 block font-display">
                    {stat.number}
                  </span>
                  <p className="text-sm text-gray-300 font-normal">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Custom Training Request Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-20 bg-[#0b0b0b]">
        <div className="layout-container">
          {trainingPrograms
            .filter((program) => program.isCustom)
            .map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -6 }}
                className="bg-[#0a0a0a] rounded-2xl overflow-hidden border-2 border-[#D4AF37] hover:shadow-[0_0_16px_rgba(212,175,55,0.22)] transition-all duration-300 group mb-12">
                <div className="h-52 w-full overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-8 md:p-10 bg-linear-to-b from-[#141414] to-[#0a0a0a] space-y-6">
                  <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h3 className="text-2xl md:text-3xl font-semibold text-[#D4AF37] font-display group-hover:text-[#E5C158] transition-colors duration-300">
                      {program.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                      {program.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {program.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
                        <svg
                          className="w-4 h-4 text-[#D4AF37] shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <motion.a
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-linear-to-r from-[#D4AF37] to-[#E5C158] text-black px-10 py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#D4AF37]/50">
                      Request Custom Training Program
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}

          <motion.div
            initial={{ y: 0, opacity: 1 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            className="flex justify-center">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200">
              Get Customized Quote
            </motion.a>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default CorporateTrainingCourses;
