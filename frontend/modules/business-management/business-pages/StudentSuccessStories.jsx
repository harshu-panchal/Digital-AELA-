// eslint-disable-next-line no-unused-vars
import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const StudentSuccessStories = () => {
  // WhatsApp integration
  const whatsappNumber = "+971508185690";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in enrolling in Digital AELA courses."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    course: "",
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  // Success Stories
  const successStories = [
    {
      id: 1,
      name: "Aditi Sharma",
      position: "HR Executive, TCS",
      story:
        "From hesitation to fluent communication, Aditi's transformation shows that with AELA, growth is inevitable.",
      avatar:
        "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 2,
      name: "Rahul Kumar",
      position: "Software Developer, Dubai",
      story:
        "Started with zero confidence in English. Now leading client calls and working internationally with confidence.",
      avatar:
        "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 3,
      name: "Priya Patel",
      position: "Marketing Manager, MNC",
      story:
        "Overcame her fear of public speaking. Now presenting to global teams and leading marketing campaigns.",
      avatar:
        "https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 4,
      name: "Amit Singh",
      position: "Business Analyst, Fortune 500",
      story:
        "From struggling with interviews to securing a dream job. AELA's training made all the difference.",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
    },
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: "Rahul",
      rating: 5,
      testimonial:
        "AELA completely changed my career path. I now work in Dubai with confidence.",
    },
    {
      id: 2,
      name: "Meena",
      rating: 5,
      testimonial:
        "Best decision ever! I cracked my IELTS with 7.5 band in 3 months.",
    },
    {
      id: 3,
      name: "Arif",
      rating: 5,
      testimonial:
        "I used to fear interviews. Now, I lead client calls in English.",
    },
  ];

  // Statistics
  const statistics = [
    {
      id: 1,
      value: "100%",
      label: "Enrolled Students",
    },
    {
      id: 2,
      value: "92%",
      label: "Completed Program",
    },
    {
      id: 3,
      value: "87%",
      label: "Achieved Fluency",
    },
    {
      id: 4,
      value: "74%",
      label: "Got Placed/Promoted",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send this data to a backend
    console.log("Form submitted:", formData);
    setFormSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        course: "",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Student Success Stories – Digital AELA"
        description="Read inspiring success stories from Digital AELA students. From beginners to professionals, discover how our students achieved their career goals and transformed their lives."
        keywords="student success stories, Digital AELA success stories, student testimonials, career success, English learning success, placement success"
        url="https://digitalaela.com/about/success-stories"
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
              They Believed. They Achieved.
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
            Celebrating Our{" "}
            <span className="text-[#D4AF37]">Students' Journey</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed">
            At Digital AELA, success is not measured in numbers alone, but in
            the courage of every student who chose to believe in themselves.
            From beginners who couldn't speak a word of English to professionals
            now leading teams abroad — every story here is living proof that
            your future is secure when you learn with AELA.
          </motion.p>
        </div>
      </motion.section>

      {/* Success Stories Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Real Stories, <span className="text-[#D4AF37]">Real Success</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {successStories.map((story, index) => (
              <motion.div
                key={story.id}
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
                <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-[#D4AF37]/70 shadow-[0_12px_35px_rgba(12,12,12,0.55)]">
                  <img
                    src={story.avatar}
                    alt={story.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-display text-center">
                  {story.name}
                </h3>
                <p className="text-sm md:text-base text-[#D4AF37] mb-3 text-center font-semibold">
                  {story.position}
                </p>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed text-center">
                  {story.story}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              What Our <span className="text-[#D4AF37]">Students Say</span>{" "}
              About Us
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
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
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-[#D4AF37] text-lg">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
                  {testimonial.testimonial}
                </p>
                <p className="text-base md:text-lg font-bold text-white font-display">
                  — {testimonial.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Our Results <span className="text-[#D4AF37]">Speak</span> For
              Themselves
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {statistics.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ scale: 1.05 }}
                className="bg-[#1a1a1a] rounded-xl p-5 md:p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2 font-display">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-10 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg text-center">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed italic">
              Education is not about passing exams; it's about passing limits. At
              Digital AELA, we don't create learners — we create achievers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Enrollment Form Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Start Your <span className="text-[#D4AF37]">Success Story</span>{" "}
              Today
            </h2>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            {formSubmitted ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
                  Thank You!
                </h3>
                <p className="text-base md:text-lg text-gray-300">
                  Your enrollment request has been received. We'll contact you
                  shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-gray-300 text-sm font-medium mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full p-3 rounded-lg bg-[#0a0a0a] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]"
                      placeholder="First Name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-gray-300 text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full p-3 rounded-lg bg-[#0a0a0a] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]"
                      placeholder="Last Name"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-lg bg-[#0a0a0a] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mobile"
                    className="block text-gray-300 text-sm font-medium mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-lg bg-[#0a0a0a] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Mobile Number"
                  />
                </div>
                <div>
                  <label
                    htmlFor="course"
                    className="block text-gray-300 text-sm font-medium mb-2">
                    Course
                  </label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-lg bg-[#0a0a0a] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]">
                    <option value="">Course Name</option>
                    <option value="corporate-training">Corporate Training</option>
                    <option value="digital-marketing">Digital Marketing</option>
                    <option value="english-language">English Language</option>
                    <option value="career-counselling">
                      Career Counselling & Skill Development
                    </option>
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  type="submit"
                  className="w-full bg-[#D4AF37] text-black py-3 rounded-lg font-bold text-base md:text-lg hover:bg-[#E5C158] transition-colors duration-200">
                  Enroll Now – Begin Your Journey
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default StudentSuccessStories;

