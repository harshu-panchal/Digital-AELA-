// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import DonateButton from "../common/DonateButton";

const EnglishLanguageCourses = () => {
  // WhatsApp integration
  const whatsappNumber = "+971508185690";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in English Language courses."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const buildWhatsAppLink = (courseTitle) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `Hello! I'd like to enroll in the ${courseTitle} course at Digital AELA.`
    )}`;

  // English Language Courses
  const courses = [
    {
      id: 1,
      title: "Basic English Course",
      seoKeyword: "Basic English speaking course online",
      description:
        "Digital AELA's Basic English Course is designed for beginners who want to build a strong foundation in grammar, vocabulary, and everyday communication. With interactive lessons and practical exercises, this course ensures you gain confidence to speak and write English in daily life, study, and work situations.",
      duration: "8 weeks",
      format: "In-person / Online",
      price: "₹7,499",
      features: [
        "Grammar fundamentals",
        "Vocabulary building",
        "Everyday communication",
        "Practical exercises",
      ],
      image:
        "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 2,
      title: "Intermediate English Course",
      seoKeyword: "Intermediate English language training",
      description:
        "Take your English skills to the next level with our Intermediate English Course. Focused on enhancing fluency, sentence structuring, and professional communication, this course bridges the gap between basic knowledge and advanced mastery. Ideal for students, professionals, and job seekers.",
      duration: "10 weeks",
      format: "In-person / Online",
      price: "₹8,999",
      features: [
        "Fluency enhancement",
        "Sentence structuring",
        "Professional communication",
        "Advanced vocabulary",
      ],
      image:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 3,
      title: "Advanced English Course",
      seoKeyword: "Advanced English speaking classes online",
      description:
        "Master the art of fluent and confident English communication with Digital AELA's Advanced English Course. Covering advanced grammar, business communication, presentations, and academic writing, this course is perfect for career growth and international opportunities.",
      duration: "12 weeks",
      format: "In-person / Online",
      price: "₹11,499",
      features: [
        "Advanced grammar",
        "Business communication",
        "Presentation skills",
        "Academic writing",
      ],
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 4,
      title: "Personalised English Speaking",
      seoKeyword: "Personalized English coaching online",
      description:
        "Our Personalised English Speaking Course offers one-to-one customized lessons tailored to your goals—whether it's job interviews, corporate presentations, or social confidence. Learn at your own pace with dedicated mentors guiding you step by step.",
      duration: "Customized",
      format: "One-on-One",
      price: "₹1,499/session",
      features: [
        "One-to-one sessions",
        "Customized curriculum",
        "Personal mentors",
        "Flexible scheduling",
      ],
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 5,
      title: "Specialized Speaking Course for Kids",
      seoKeyword: "English speaking course for kids",
      description:
        "Build your child's confidence with our Kids English Speaking Program. Focused on pronunciation, storytelling, and interactive games, this course helps children develop strong communication skills from an early age.",
      duration: "8 weeks",
      format: "In-person / Online",
      price: "₹6,999",
      features: [
        "Pronunciation practice",
        "Storytelling skills",
        "Interactive games",
        "Early communication",
      ],
      image:
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 6,
      title: "Exam Preparation (IELTS, TOEFL, SSC, Bank PO & Others)",
      seoKeyword: "IELTS TOEFL SSC Bank PO English preparation",
      description:
        "Crack your dream exams with Digital AELA's Exam Preparation Courses. From IELTS & TOEFL for international studies to SSC, Bank PO, and other competitive exams, we provide structured guidance, practice tests, and proven strategies to help you succeed.",
      duration: "10 weeks",
      format: "In-person / Online",
      price: "₹9,999",
      features: [
        "IELTS & TOEFL prep",
        "SSC & Bank PO prep",
        "Practice tests",
        "Proven strategies",
      ],
      image:
        "https://images.unsplash.com/photo-1488722796624-0aa6f1bb6399?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 7,
      title: "11th & 12th English Literature (NCERT)",
      seoKeyword: "NCERT English Literature Class 11 12 coaching",
      description:
        "Our NCERT English Literature Coaching supports students of class 11th and 12th with in-depth analysis of prose, poetry, and grammar. Designed to score high in board exams while improving overall comprehension skills.",
      duration: "12 weeks",
      format: "In-person / Online",
      price: "₹10,499",
      features: [
        "Prose analysis",
        "Poetry comprehension",
        "Grammar mastery",
        "Board exam prep",
      ],
      image:
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 8,
      title: "English Language Teacher/Trainer Course",
      seoKeyword: "English teacher training course online",
      description:
        "Become a certified English trainer with Digital AELA's Teacher Training Course. Learn modern teaching methodologies, classroom management, and digital tools to kick-start or enhance your teaching career globally.",
      duration: "12 weeks",
      format: "In-person / Online",
      price: "₹12,999",
      features: [
        "Teaching methodologies",
        "Classroom management",
        "Digital tools",
        "Global certification",
      ],
      image:
        "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="English Language Courses | Digital AELA - Basic, Intermediate, Advanced English, IELTS, TOEFL Training"
        description="Comprehensive English Language Courses by Digital AELA. Learn Basic, Intermediate, Advanced English, Personalized Speaking, Kids English, IELTS & TOEFL Preparation, NCERT English Literature, and English Teacher Training. Online courses for India, Pakistan, Bangladesh, Nepal, and Gulf countries."
        keywords="English courses online, Basic English course, Intermediate English, Advanced English, IELTS preparation, TOEFL training, English speaking course, English for kids, NCERT English, English teacher training, English courses India, Pakistan, Bangladesh, Nepal, Gulf countries"
        url="https://digitalaela.com/courses/english-language"
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
              English Language Mastery
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
              Master English
            </motion.span>
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
              className="block bg-linear-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-transparent">
              From Basics to Fluency
            </motion.span>
          </motion.h1>

          {/* Descriptive Paragraph */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
            Comprehensive English language courses from beginner to advanced
            levels. Learn grammar, vocabulary, speaking, and writing skills with
            expert guidance and personalized support.
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
              Enroll Now
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              href="#courses"
              className="bg-black text-white px-8 py-4 rounded-lg font-bold text-lg border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all duration-200 shadow-lg hover:shadow-xl">
              View Courses
            </motion.a>
          </motion.div>
        </div>
      </motion.section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-[#141414] relative">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Our English Language{" "}
              <span className="text-[#D4AF37]">Courses</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Comprehensive training programs from basic to advanced levels,
              including exam preparation and specialized courses
            </p>
          </motion.div>

          {/* Courses Grid */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mb-12">
            {courses.map((course, index) => {
              const buyLink = course.buyLink || buildWhatsAppLink(course.title);

              return (
                <motion.div
                  key={course.id}
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
                      src={course.image}
                      alt={course.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 bg-linear-to-b from-[#141414] to-[#0a0a0a] space-y-4">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-[#D4AF37] mb-2 font-display leading-tight group-hover:text-[#E5C158] transition-colors duration-300">
                        {course.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
                        {course.description}
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
                        {course.duration}
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
                        {course.format}
                      </span>
                    </div>

                    <div className="border-t border-[#D4AF37]/15 pt-4">
                      <p className="mb-3 text-[#D4AF37]/80 text-xs uppercase tracking-[0.25em]">
                        Key Highlights
                      </p>
                      <ul className="space-y-2 text-xs md:text-sm text-gray-300">
                        {course.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>Course Fee</span>
                        <span className="text-lg font-semibold text-[#F5D26A]">
                          {course.price || "On Request"}
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
                        <DonateButton
                          className="inline-flex w-full items-center justify-center rounded-full border border-[#F5D26A]/60 px-4 text-xs md:text-sm font-semibold text-[#F5D26A] hover:bg-[#D4AF37] hover:text-black"
                          size="sm">
                          Donate
                        </DonateButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
              Get Started Today
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EnglishLanguageCourses;
