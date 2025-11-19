// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const CareerPaths = () => {
  // WhatsApp integration
  const whatsappNumber = "+971502270625";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in career guidance and career paths."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Career Paths
  const careerPaths = [
    {
      id: 1,
      title: "Digital Marketing Career",
      description:
        "Build a successful career in digital marketing with skills in SEO, SMM, PPC, and content marketing. Perfect for creative minds who want to help businesses grow online.",
      icon: "📱",
      skills: ["SEO", "Social Media", "PPC", "Content Marketing"],
      opportunities: [
        "Digital Marketer",
        "SEO Specialist",
        "Social Media Manager",
        "PPC Analyst",
      ],
    },
    {
      id: 2,
      title: "English Language Teaching",
      description:
        "Become a certified English teacher and trainer. Teach students, professionals, or work in corporate training. High demand across South Asia and Gulf countries.",
      icon: "📚",
      skills: ["Teaching Methodology", "Grammar", "Communication", "Training"],
      opportunities: [
        "English Teacher",
        "Corporate Trainer",
        "Online Tutor",
        "IELTS Instructor",
      ],
    },
    {
      id: 3,
      title: "Customer Service & BPO",
      description:
        "Start your career in the booming BPO industry. Learn customer service skills, voice & accent training, and communication techniques for call centers.",
      icon: "📞",
      skills: [
        "Customer Service",
        "Voice & Accent",
        "Problem Solving",
        "Communication",
      ],
      opportunities: [
        "Call Center Agent",
        "Customer Support",
        "BPO Executive",
        "Team Lead",
      ],
    },
    {
      id: 4,
      title: "Sales & Business Development",
      description:
        "Excel in sales with our comprehensive training. Learn negotiation, client handling, CRM, and sales strategies for retail, telecom, banking, and corporate sectors.",
      icon: "💼",
      skills: ["Sales Techniques", "Negotiation", "CRM", "Client Handling"],
      opportunities: [
        "Sales Executive",
        "Business Development",
        "Account Manager",
        "Sales Manager",
      ],
    },
    {
      id: 5,
      title: "Graphic Design & Creative",
      description:
        "Pursue a creative career in graphic design. Master tools like Canva and Photoshop to create logos, social media posts, and marketing materials.",
      icon: "🎨",
      skills: ["Canva", "Photoshop", "Logo Design", "Social Media Graphics"],
      opportunities: [
        "Graphic Designer",
        "UI/UX Designer",
        "Freelance Designer",
        "Creative Director",
      ],
    },
    {
      id: 6,
      title: "Entrepreneurship & Startup",
      description:
        "Launch and grow your own business. Learn idea validation, branding, digital presence, funding, and business management to build successful ventures.",
      icon: "🚀",
      skills: ["Business Planning", "Branding", "Digital Marketing", "Funding"],
      opportunities: [
        "Entrepreneur",
        "Startup Founder",
        "Business Owner",
        "Consultant",
      ],
    },
  ];

  // Career Guidance Steps
  const guidanceSteps = [
    {
      id: 1,
      title: "Career Assessment",
      description:
        "Understand your strengths, interests, and career goals through our comprehensive assessment.",
      icon: "🔍",
    },
    {
      id: 2,
      title: "Skill Gap Analysis",
      description:
        "Identify the skills you need to develop to achieve your career objectives.",
      icon: "📊",
    },
    {
      id: 3,
      title: "Personalized Roadmap",
      description:
        "Get a customized career path with step-by-step guidance tailored to your goals.",
      icon: "🗺️",
    },
    {
      id: 4,
      title: "Skill Development",
      description:
        "Enroll in relevant courses and training programs to build required skills.",
      icon: "🎓",
    },
    {
      id: 5,
      title: "Resume & Interview Prep",
      description:
        "Create a winning resume and prepare for interviews with mock sessions.",
      icon: "📝",
    },
    {
      id: 6,
      title: "Job Placement Support",
      description:
        "Get access to job portals, recruiter connections, and placement assistance.",
      icon: "💼",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Career Paths & Guidance | Digital AELA - Career Counselling for India, Pakistan, Bangladesh, Nepal"
        description="Professional Career Guidance and Career Paths by Digital AELA. Expert career counselling, skill assessment, and personalized career path recommendations for students and professionals in India, Pakistan, Bangladesh, Nepal, and Gulf countries."
        keywords="Career paths, Career guidance, Career counselling, Career planning, Skill assessment, Career advice, Professional development, Career opportunities India, Pakistan, Bangladesh, Nepal, Gulf countries"
        url="https://digitalaela.com/career-paths"
      />
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative min-h-[80vh] flex items-center justify-center pt-[120px] pb-20 md:pt-[140px] md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-black"></div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl"></motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl"></motion.div>

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
          {/* Badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="inline-block mb-6">
            <motion.span
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-linear-to-r from-[#95928a] to-[#E5C158] text-black px-4 py-2 rounded-full text-sm font-semibold">
              Career Guidance & Development
            </motion.span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="clamp-heading font-bold text-white mb-6 leading-tight font-display tracking-tight text-balance">
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              className="block">
              Discover Your
            </motion.span>
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
              className="block bg-linear-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-transparent">
              Perfect Career Path
            </motion.span>
          </motion.h1>

          {/* Descriptive Paragraph */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
            Get personalized career guidance, skill development, and placement
            support to build a successful career in your chosen field.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-linear-to-r from-[#D4AF37] to-[#E5C158] text-black px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#D4AF37]/50">
              Get Career Guidance
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              href="#career-paths"
              className="bg-black text-white px-8 py-4 rounded-lg font-bold text-lg border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all duration-200 shadow-lg hover:shadow-xl">
              Explore Career Paths
            </motion.a>
          </motion.div>
        </div>
      </motion.section>

      {/* Career Guidance Process Section */}
      <section className="py-20 bg-[#141414] relative">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Our Career Guidance{" "}
              <span className="text-[#D4AF37]">Process</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              A step-by-step approach to help you discover and achieve your
              career goals
            </p>
          </motion.div>

          {/* Guidance Steps Grid */}
          <div className="auto-grid-md lg:grid-cols-3">
            {guidanceSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="bg-[#1a1a1a] rounded-xl p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 relative">
                {/* Step Number */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <span className="text-[#D4AF37] font-bold text-sm">
                    {step.id}
                  </span>
                </div>

                {/* Icon */}
                <div className="text-5xl mb-4">{step.icon}</div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-300 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Paths Section */}
      <section id="career-paths" className="py-20 bg-black relative">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Explore Popular{" "}
              <span className="text-[#D4AF37]">Career Paths</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover exciting career opportunities and the skills needed to
              succeed in each field
            </p>
          </motion.div>

          {/* Career Paths Grid */}
          <div className="auto-grid-md lg:grid-cols-3 mb-12">
            {careerPaths.map((path, index) => (
              <motion.div
                key={path.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer">
                {/* Header */}
                <div className="p-6 bg-linear-to-b from-[#1a1a1a] to-[#0a0a0a]">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{path.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-[#D4AF37] mb-2 font-display group-hover:text-[#E5C158] transition-colors duration-300">
                        {path.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed mb-4 text-sm md:text-base">
                        {path.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skills & Opportunities */}
                <div className="px-6 pb-6">
                  {/* Skills */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-[#D4AF37] mb-2">
                      Key Skills:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {path.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-xs rounded-full border border-[#D4AF37]/30">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">
                      Career Opportunities:
                    </h4>
                    <ul className="space-y-1">
                      {path.opportunities.map((opp, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-300">
                          <svg
                            className="w-4 h-4 text-[#D4AF37] shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
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
              Get Personalized Career Guidance
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Our Career Guidance Section */}
      <section className="py-20 bg-[#141414] relative">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Why Choose Our{" "}
              <span className="text-[#D4AF37]">Career Guidance</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Expert guidance and support to help you build a successful career
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <div className="auto-grid-md lg:grid-cols-3">
            {[
              {
                id: 1,
                title: "Expert Career Counsellors",
                description:
                  "Work with experienced career counsellors who understand the job market and industry trends.",
                icon: "👨‍💼",
              },
              {
                id: 2,
                title: "Personalized Approach",
                description:
                  "Get customized career guidance tailored to your skills, interests, and goals.",
                icon: "🎯",
              },
              {
                id: 3,
                title: "Industry Connections",
                description:
                  "Access to job portals, recruiters, and placement opportunities across South Asia and Gulf.",
                icon: "🤝",
              },
              {
                id: 4,
                title: "Skill Development",
                description:
                  "Comprehensive training programs to develop the skills needed for your chosen career path.",
                icon: "📚",
              },
              {
                id: 5,
                title: "Resume & Interview Support",
                description:
                  "Professional resume building and interview preparation to land your dream job.",
                icon: "📝",
              },
              {
                id: 6,
                title: "Lifetime Support",
                description:
                  "Ongoing career support and guidance even after placement to ensure long-term success.",
                icon: "🔄",
              },
            ].map((benefit, index) => (
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
      </section>
    </div>
  );
};

export default CareerPaths;
