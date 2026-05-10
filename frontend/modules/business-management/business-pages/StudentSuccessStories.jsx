// eslint-disable-next-line no-unused-vars
import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import { getTestimonialsBySection } from "../../../src/services/api/testimonials";
import TranslatedText from "../../../src/components/TranslatedText";
import { useDynamicTranslation } from "../../../src/hooks/useDynamicTranslation";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

const StudentSuccessStories = () => {
  // Translation hook for option text (can't use TranslatedText component in <option>)
  const { translate } = useDynamicTranslation({ sourceLang: "en" });
  const [translatedOptions, setTranslatedOptions] = useState({
    "Course Name": "Course Name",
    "Corporate Training": "Corporate Training",
    "Digital Marketing": "Digital Marketing",
    "English Language": "English Language",
    "Career Counselling & Skill Development": "Career Counselling & Skill Development",
  });

  // Translate option text when language changes
  useEffect(() => {
    const translateOptions = async () => {
      const options = {
        "Course Name": "Course Name",
        "Corporate Training": "Corporate Training",
        "Digital Marketing": "Digital Marketing",
        "English Language": "English Language",
        "Career Counselling & Skill Development": "Career Counselling & Skill Development",
      };
      
      const translated = {};
      for (const [key, value] of Object.entries(options)) {
        try {
          translated[key] = await translate(value);
        } catch (error) {
          translated[key] = value; // Fallback to original
        }
      }
      setTranslatedOptions(translated);
    };
    translateOptions();
  }, [translate]);

  // WhatsApp integration
  const whatsappNumber = "+971545454982";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm inspired by the success stories and would like to know more about your courses."
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
  const [successStories, setSuccessStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);

  // Fetch success stories from API
  useEffect(() => {
    const loadSuccessStories = async () => {
      try {
        setLoadingStories(true);
        const response = await getTestimonialsBySection("success-stories");
        if (response && response.testimonials) {
          // Map API response to match existing structure
          const mappedStories = response.testimonials.map((testimonial, index) => ({
            id: testimonial._id || index + 1,
            name: testimonial.name,
            position: testimonial.role,
            story: testimonial.text,
            avatar: testimonial.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
          }));
          setSuccessStories(mappedStories);
        }
      } catch (error) {
        console.error("Failed to load success stories:", error);
        // Fallback to empty array on error
        setSuccessStories([]);
      } finally {
        setLoadingStories(false);
      }
    };
    loadSuccessStories();
  }, []);

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
      label: <TranslatedText>Enrolled Students</TranslatedText>,
    },
    {
      id: 2,
      value: "92%",
      label: <TranslatedText>Completed Program</TranslatedText>,
    },
    {
      id: 3,
      value: "87%",
      label: <TranslatedText>Achieved Fluency</TranslatedText>,
    },
    {
      id: 4,
      value: "74%",
      label: <TranslatedText>Got Placed/Promoted</TranslatedText>,
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
        className="relative pt-[110px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            className="mb-4">
            <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
              <TranslatedText>They Believed. They Achieved.</TranslatedText>
            </span>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
            <TranslatedText>Celebrating Our</TranslatedText>{" "}
            <span className="text-[#D4AF37]"><TranslatedText>Students' Journey</TranslatedText></span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed">
            <TranslatedText>At Digital AELA, success is not measured in numbers alone, but in the courage of every student who chose to believe in themselves. From beginners who couldn't speak a word of English to professionals now leading teams abroad — every story here is living proof that your future is secure when you learn with AELA.</TranslatedText>
          </motion.p>
        </div>
      </motion.section>

      {/* Success Stories Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Real Stories,</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Real Success</TranslatedText></span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {loadingStories ? (
              <div className="col-span-4 text-center py-12 text-gray-400">
                <TranslatedText>Loading success stories...</TranslatedText>
              </div>
            ) : successStories.length === 0 ? (
              <div className="col-span-4 text-center py-12 text-gray-400">
                <TranslatedText>No success stories available</TranslatedText>
              </div>
            ) : (
              successStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  className="bg-[#1a1a1a] rounded-xl p-5 md:p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300">
                  <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-[#D4AF37]/70 shadow-[0_12px_35px_rgba(12,12,12,0.55)]">
                    <img
                      src={getMediaUrl(story.avatar) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80"}
                      alt={story.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-display text-center">
                    <TranslatedText>{story.name}</TranslatedText>
                  </h3>
                  <p className="text-sm md:text-base text-[#D4AF37] mb-3 text-center font-semibold">
                    <TranslatedText>{story.position}</TranslatedText>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 leading-relaxed text-center">
                    <TranslatedText>{story.story}</TranslatedText>
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>What Our</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Students Say</TranslatedText></span>{" "}
              <TranslatedText>About Us</TranslatedText>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="bg-[#1a1a1a] rounded-xl p-5 md:p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-[#D4AF37] text-lg">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
                  <TranslatedText>{testimonial.testimonial}</TranslatedText>
                </p>
                <p className="text-base md:text-lg font-bold text-white font-display">
                  — <TranslatedText>{testimonial.name}</TranslatedText>
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
            className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Our Results</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Speak</TranslatedText></span> <TranslatedText>For Themselves</TranslatedText>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {statistics.map((stat, index) => (
              <motion.div
                key={stat.id}
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
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg text-center">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed italic">
              <TranslatedText>Education is not about passing exams; it's about passing limits. At Digital AELA, we don't create learners — we create achievers.</TranslatedText>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Enrollment Form Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.div
            className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Start Your</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Success Story</TranslatedText></span>{" "}
              <TranslatedText>Today</TranslatedText>
            </h2>
          </motion.div>

          <motion.div
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            {formSubmitted ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
                  <TranslatedText>Thank You!</TranslatedText>
                </h3>
                <p className="text-base md:text-lg text-gray-300">
                  <TranslatedText>Your enrollment request has been received. We'll contact you shortly.</TranslatedText>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-gray-300 text-sm font-medium mb-2">
                      <TranslatedText>First Name</TranslatedText>
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
                      <TranslatedText>Last Name</TranslatedText>
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
                    <TranslatedText>Email Address</TranslatedText>
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
                    <TranslatedText>Mobile Number</TranslatedText>
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
                    <TranslatedText>Course</TranslatedText>
                  </label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-lg bg-[#0a0a0a] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]">
                    <option value="">{translatedOptions["Course Name"]}</option>
                    <option value="corporate-training">{translatedOptions["Corporate Training"]}</option>
                    <option value="digital-marketing">{translatedOptions["Digital Marketing"]}</option>
                    <option value="english-language">{translatedOptions["English Language"]}</option>
                    <option value="career-counselling">{translatedOptions["Career Counselling & Skill Development"]}</option>
                  </select>
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-[#D4AF37] text-black py-3 rounded-lg font-bold text-base md:text-lg hover:bg-[#E5C158] transition-colors duration-200">
                  <TranslatedText>Enroll Now – Begin Your Journey</TranslatedText>
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

