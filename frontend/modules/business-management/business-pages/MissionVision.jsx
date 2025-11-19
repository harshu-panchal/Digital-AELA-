// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const MissionVision = () => {
  // WhatsApp integration
  const whatsappNumber = "+971502270625";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in learning more about Digital AELA."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Core Values
  const coreValues = [
    {
      id: 1,
      title: "Excellence",
      description:
        "We strive for the highest standards in everything we do, from curriculum design to student support.",
      icon: "⭐",
    },
    {
      id: 2,
      title: "Accessibility",
      description:
        "Education should be accessible to everyone, regardless of background, location, or financial status.",
      icon: "🌍",
    },
    {
      id: 3,
      title: "Innovation",
      description:
        "We continuously evolve our teaching methods and technology to provide the best learning experience.",
      icon: "💡",
    },
    {
      id: 4,
      title: "Empowerment",
      description:
        "We empower students to achieve their goals and transform their lives through education.",
      icon: "🚀",
    },
    {
      id: 5,
      title: "Integrity",
      description:
        "We operate with honesty, transparency, and ethical practices in all our interactions.",
      icon: "🤝",
    },
    {
      id: 6,
      title: "Community",
      description:
        "We build a supportive community where students, teachers, and partners thrive together.",
      icon: "👥",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Mission & Vision – Digital AELA"
        description="Discover Digital AELA's mission to empower learners globally and our vision for transforming education. Learn about our core values and commitment to student success."
        keywords="Digital AELA mission, vision, education mission, student empowerment, learning goals, core values, educational vision"
        url="https://digitalaela.com/about/mission-vision"
      />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-4">
            <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
              Our Purpose
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
            Our <span className="text-[#D4AF37]">Mission & Vision</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed">
            At Digital AELA, we are driven by a clear mission and an inspiring
            vision that guides everything we do. Our commitment is to empower
            learners and transform lives through quality education.
          </motion.p>
        </div>
      </motion.section>

      {/* Mission Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🎯</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-display">
                Our Mission
              </h2>
            </div>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              To empower learners across the globe by providing accessible,
              high-quality education that transforms lives, opens opportunities,
              and builds confidence. We are committed to breaking down barriers
              to learning and ensuring that every student, regardless of their
              background or location, has the tools and support they need to
              achieve their dreams and reach their full potential.
            </p>
          </motion.div>

          {/* Vision Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">👁️</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-display">
                Our Vision
              </h2>
            </div>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              To become the world's leading platform for accessible, transformative
              education, where millions of learners from diverse backgrounds come
              together to learn, grow, and succeed. We envision a future where
              education knows no boundaries—geographical, financial, or social.
              Through innovation, technology, and unwavering dedication, we aim
              to create a global community of empowered individuals who are
              equipped with the skills, knowledge, and confidence to shape their
              own destinies and contribute meaningfully to society.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-10 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-8 md:mb-10">
            <div className="mb-4">
              <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
                What Drives Us
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Our <span className="text-[#D4AF37]">Core Values</span>
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
              The fundamental principles that guide our actions and decisions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-[#1a1a1a] rounded-xl p-5 md:p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300">
                <div className="text-3xl mb-3">{value.icon}</div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-display">
                  {value.title}
                </h3>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Exist Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-8 md:mb-10">
            <div className="mb-4">
              <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
                Our Foundation
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Why We <span className="text-[#D4AF37]">Exist</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4">
              Digital AELA exists because we believe that education is the most
              powerful tool for change. We recognize that millions of individuals
              around the world face barriers to quality education—whether due to
              geographical limitations, financial constraints, or lack of access
              to quality resources.
            </p>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4">
              We exist to bridge these gaps. Our platform was built with the
              conviction that everyone deserves the opportunity to learn, grow,
              and succeed, regardless of where they come from or what their
              circumstances are.
            </p>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              Every course we offer, every student we support, and every success
              story we celebrate reinforces our belief that{" "}
              <i className="text-[#D4AF37] font-semibold">
                with the right education and support, anyone can achieve their
                dreams.
              </i>
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
              Join Us on This Journey
            </h2>
            <p className="text-sm md:text-base text-gray-300 mb-5 max-w-2xl mx-auto">
              Whether you're a student looking to transform your future, a
              teacher passionate about making a difference, or a partner who
              shares our vision, we invite you to be part of the Digital AELA
              community.
            </p>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#D4AF37] text-black px-6 py-2.5 rounded-lg font-bold text-sm md:text-base hover:bg-[#E5C158] transition-colors duration-200">
              Get Started Today
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MissionVision;

