// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import founderImage2 from "../../../src/assets/Founder2.png";

const OurStory = () => {
  // WhatsApp integration
  const whatsappNumber = "+971508185690";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in learning more about Digital AELA."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Story sections
  const storySections = [
    {
      id: 1,
      title: "The First Academy – Where It All Began",
      content:
        "It all started with a small rented classroom, a whiteboard, and a young teacher with a big dream. Imran Sir, a single boy with nothing but determination, stood before a handful of students. With limited resources but unlimited passion, he planted the first seed of Digital AELA. The mission was clear from day one: to give every learner, regardless of background, the confidence to speak, succeed, and shape their future. That little room was more than a classroom — it was the birthplace of a movement.",
      image: "📚", // Placeholder - can be replaced with actual image
    },
    {
      id: 2,
      title: "The First Book Launch – Knowledge in Every Hand",
      content:
        "From chalk on a blackboard to words on printed pages, Imran Sir turned his lessons into a book. The first launch was not grand, but it was powerful. Students held in their hands not just a guide to English, but a weapon for self-growth. For many, this book became their first stepping stone toward career opportunities and personal success. It was proof that Digital AELA wasn't just teaching — it was creating tools for transformation.",
      image: "📖", // Placeholder - can be replaced with actual image
    },
    {
      id: 3,
      title: "The Second Book – Expanding the Dream",
      content:
        "When the first book touched hearts, the second book carried the dream further. It wasn't just about grammar; it was about real-life English that opened doors to jobs, interviews, and global opportunities. Imran Sir often said, \"Education is not about passing exams, it's about passing limits.\" This book embodied that belief, giving learners the confidence to cross barriers and believe in themselves.",
      image: "📗", // Placeholder - can be replaced with actual image
    },
    {
      id: 4,
      title: "The Third Book – From Local to Global Readers",
      content:
        "The third book marked a turning point. Now, Digital AELA's message was not limited to one city or one country. Written with a bilingual approach, it reached learners across India and resonated with students abroad. Holding that third book in his hands, Imran Sir knew: this was no longer just his journey — it was the journey of thousands who saw Digital AELA as their pathway to success.",
      image: "📘", // Placeholder - can be replaced with actual image
    },
    {
      id: 5,
      title: "The Second Branch – Building a Community",
      content:
        "With growing demand and countless success stories, the need for expansion was inevitable. The opening of the second branch was more than cutting a ribbon; it was building a community. More teachers joined hands, more students walked in with hope, and more dreams found a home. Digital AELA was no longer just one man's vision — it had become a family where educators and learners stood side by side.",
      image: "🏢", // Placeholder - can be replaced with actual image
    },
    {
      id: 6,
      title: "Celebrating the Success of Thousands",
      content:
        "From the first few students to thousands of success stories, Digital AELA became synonymous with achievement. Every certificate awarded, every placement secured, and every student who spoke English with confidence was a victory shared by the entire academy. We celebrated not only results but the journeys — the late nights of practice, the struggles overcome, and the transformation of fear into fluency. Each student became a living testimony: at Digital AELA, success is not an exception; it's a tradition.",
      image: "🎓", // Placeholder - can be replaced with actual image
    },
    {
      id: 7,
      title: "The Leap to Dubai – A Global Vision",
      content:
        "The journey from a small town in India to the global city of Dubai was not easy. It was filled with sacrifices, sleepless nights, and relentless belief. But with every challenge, Imran Sir remembered the faces of his students — the trust they placed in him, and the promise he made to never stop. Dubai became the next chapter, not just as a new location, but as a global stage.",
      image: "🌍", // Placeholder - can be replaced with actual image
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Our Story – Digital AELA"
        description="Discover the inspiring journey of Digital AELA - from a small classroom to a global mission. Learn how one teacher's vision transformed into thousands of success stories."
        keywords="Digital AELA story, our story, education journey, Imran Sir, English learning, success stories, Dubai education, global mission"
        url="https://digitalaela.com/about/our-story"
      />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="text-center lg:text-left">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mb-4">
                <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
                  Discover the Journey
                </span>
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
                A Story of One Teacher,{" "}
                <span className="text-[#D4AF37]">Thousands of Futures</span>
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
                From a single boy with a vision to an academy that empowers
                thousands, Digital AELA is more than an institution — it is
                hope, hard work, and a promise fulfilled. Every class, every
                book, every branch, and every success story carries the same
                message:{" "}
                <i className="text-[#D4AF37]">
                  with Digital AELA, your future is not just possible, it is
                  unstoppable.
                </i>
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex justify-center lg:justify-start">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-bold text-sm md:text-base hover:bg-[#E5C158] transition-colors duration-200 flex items-center gap-2">
                  Find Jobs
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Right Side - Founder's Image */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="flex justify-center lg:justify-end">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative">
                <img
                  src={founderImage2}
                  alt="Digital AELA Founder - Imran Sir - Visionary Leader and Education Professional"
                  className="w-full max-w-sm h-auto rounded-2xl object-cover scale-90"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Main Story Section */}
      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Section Title */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-12 md:mb-16">
            <div className="mb-4">
              <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
                Our Story
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              From a <span className="text-[#D4AF37]">Classroom Dream</span> to
              a <span className="text-[#D4AF37]">Global Mission</span>
            </h2>
          </motion.div>

          {/* Story Sections */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4AF37] via-[#D4AF37] to-transparent"></div>

            <div className="space-y-16 md:space-y-20">
              {storySections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="relative flex flex-col lg:flex-row gap-8 md:gap-12 items-start">
                  {/* Timeline Dot */}
                  <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 items-center justify-center">
                    <div className="w-4 h-4 bg-[#D4AF37] rounded-full border-4 border-[#141414] shadow-lg z-10"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 md:ml-20">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 font-display">
                      {section.title}
                    </h3>
                    <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                      {section.content}
                    </p>
                  </div>

                  {/* Image */}
                  <div className="flex-shrink-0 w-full lg:w-80 h-64 md:h-80 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center text-8xl border border-[#D4AF37]/20 shadow-lg hover:border-[#D4AF37]/50 transition-all duration-300">
                    {section.image}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="py-12 bg-black relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-8 md:p-12 border border-[#D4AF37]/20 shadow-lg">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              Today, Digital AELA connects learners from India, Pakistan,
              Bangladesh, Nepal, and the Gulf, carrying the same torch:{" "}
              <i className="text-[#D4AF37] font-semibold">
                Learning to Earning, without limits.
              </i>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default OurStory;
