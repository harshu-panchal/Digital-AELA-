// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import TranslatedText from "../../../src/components/TranslatedText";

const MissionVision = () => {
  // WhatsApp integration
  const whatsappNumber = "+971545454982";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in learning more about Digital AELA's mission and vision."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Core Values
  const coreValues = [
    {
      id: 1,
      title: <TranslatedText>Excellence</TranslatedText>,
      description: (
        <TranslatedText>
          We strive for the highest standards in everything we do, from curriculum design to student support.
        </TranslatedText>
      ),
      icon: "⭐",
    },
    {
      id: 2,
      title: <TranslatedText>Accessibility</TranslatedText>,
      description: (
        <TranslatedText>
          Education should be accessible to everyone, regardless of background, location, or financial status.
        </TranslatedText>
      ),
      icon: "🌍",
    },
    {
      id: 3,
      title: <TranslatedText>Innovation</TranslatedText>,
      description: (
        <TranslatedText>
          We continuously evolve our teaching methods and technology to provide the best learning experience.
        </TranslatedText>
      ),
      icon: "💡",
    },
    {
      id: 4,
      title: <TranslatedText>Empowerment</TranslatedText>,
      description: (
        <TranslatedText>
          We empower students to achieve their goals and transform their lives through education.
        </TranslatedText>
      ),
      icon: "🚀",
    },
    {
      id: 5,
      title: <TranslatedText>Integrity</TranslatedText>,
      description: (
        <TranslatedText>
          We operate with honesty, transparency, and ethical practices in all our interactions.
        </TranslatedText>
      ),
      icon: "🤝",
    },
    {
      id: 6,
      title: <TranslatedText>Community</TranslatedText>,
      description: (
        <TranslatedText>
          We build a supportive community where students, teachers, and partners thrive together.
        </TranslatedText>
      ),
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
        className="relative pt-[110px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            className="mb-4">
            <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
              <TranslatedText>Our Purpose</TranslatedText>
            </span>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
            <TranslatedText>Our</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Mission & Vision</TranslatedText></span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed">
            <TranslatedText>
              At Digital AELA, we are driven by a clear mission and an inspiring
              vision that guides everything we do. Our commitment is to empower
              learners and transform lives through quality education.
            </TranslatedText>
          </motion.p>
        </div>
      </motion.section>

      {/* Mission Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🎯</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-display">
                <TranslatedText>Our Mission</TranslatedText>
              </h2>
            </div>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              <TranslatedText>
                To empower learners across the globe by providing accessible,
                high-quality education that transforms lives, opens opportunities,
                and builds confidence. We are committed to breaking down barriers
                to learning and ensuring that every student, regardless of their
                background or location, has the tools and support they need to
                achieve their dreams and reach their full potential.
              </TranslatedText>
            </p>
          </motion.div>

          {/* Vision Section */}
          <motion.div
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">👁️</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-display">
                <TranslatedText>Our Vision</TranslatedText>
              </h2>
            </div>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              <TranslatedText>
                To become the world's leading platform for accessible, transformative
                education, where millions of learners from diverse backgrounds come
                together to learn, grow, and succeed. We envision a future where
                education knows no boundaries—geographical, financial, or social.
                Through innovation, technology, and unwavering dedication, we aim
                to create a global community of empowered individuals who are
                equipped with the skills, knowledge, and confidence to shape their
                own destinies and contribute meaningfully to society.
              </TranslatedText>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-10 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            className="text-center mb-8 md:mb-10">
            <div className="mb-4">
              <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
                <TranslatedText>What Drives Us</TranslatedText>
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Our</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Core Values</TranslatedText></span>
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
              <TranslatedText>The fundamental principles that guide our actions and decisions</TranslatedText>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.id}
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
            className="text-center mb-8 md:mb-10">
            <div className="mb-4">
              <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
                <TranslatedText>Our Foundation</TranslatedText>
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Why We</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Exist</TranslatedText></span>
            </h2>
          </motion.div>

          <motion.div
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4">
              <TranslatedText>
                Digital AELA exists because we believe that education is the most
                powerful tool for change. We recognize that millions of individuals
                around the world face barriers to quality education—whether due to
                geographical limitations, financial constraints, or lack of access
                to quality resources.
              </TranslatedText>
            </p>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4">
              <TranslatedText>
                We exist to bridge these gaps. Our platform was built with the
                conviction that everyone deserves the opportunity to learn, grow,
                and succeed, regardless of where they come from or what their
                circumstances are.
              </TranslatedText>
            </p>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              <TranslatedText>
                Every course we offer, every student we support, and every success
                story we celebrate reinforces our belief that{" "}
                <i className="text-[#D4AF37] font-semibold">
                  with the right education and support, anyone can achieve their
                  dreams.
                </i>
              </TranslatedText>
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
              <TranslatedText>Join Us on This Journey</TranslatedText>
            </h2>
            <p className="text-sm md:text-base text-gray-300 mb-5 max-w-2xl mx-auto">
              <TranslatedText>
                Whether you're a student looking to transform your future, a
                teacher passionate about making a difference, or a partner who
                shares our vision, we invite you to be part of the Digital AELA
                community.
              </TranslatedText>
            </p>
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#D4AF37] text-black px-6 py-2.5 rounded-lg font-bold text-sm md:text-base hover:bg-[#E5C158] transition-colors duration-200">
              <TranslatedText>Get Started Today</TranslatedText>
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MissionVision;

