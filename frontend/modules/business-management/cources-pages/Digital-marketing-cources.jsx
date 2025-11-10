// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const DigitalMarketingCourses = () => {
  // WhatsApp integration
  const whatsappNumber = "+971508185690";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in Digital Marketing courses."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Digital Marketing Courses
  const courses = [
    {
      id: 1,
      title: "Social Media Marketing (SMM)",
      seoKeyword: "Social Media Marketing course online",
      description:
        "Master Facebook, Instagram, LinkedIn, and other platforms with our Social Media Marketing Course. Learn how to grow brands, run campaigns, and build engagement that converts followers into customers.",
      duration: "8 weeks",
      format: "In-person / Online",
      features: [
        "Platform mastery",
        "Campaign management",
        "Engagement strategies",
        "Brand growth",
      ],
      image:
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 2,
      title: "SEO (Search Engine Optimization)",
      seoKeyword: "Best SEO training online",
      description:
        "Rank websites on Google with Digital AELA's SEO Training. Cover on-page SEO, off-page SEO, keyword research, backlinks, and advanced strategies to make websites visible globally.",
      duration: "10 weeks",
      format: "In-person / Online",
      features: [
        "On-page & off-page SEO",
        "Keyword research",
        "Backlink strategies",
        "Global visibility",
      ],
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 3,
      title: "SMO (Social Media Optimization)",
      seoKeyword: "Social Media Optimization course",
      description:
        "Learn how to optimize social media profiles, increase organic reach, and strengthen brand identity. Our SMO Course gives you practical skills to create impactful content strategies.",
      duration: "8 weeks",
      format: "In-person / Online",
      features: [
        "Profile optimization",
        "Organic reach growth",
        "Brand identity",
        "Content strategies",
      ],
      image:
        "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 4,
      title: "PPC (Pay-Per-Click Advertising)",
      seoKeyword: "PPC advertising course online",
      description:
        "Become an expert in Pay-Per-Click Advertising with hands-on training in Google Ads and Bing Ads. Learn how to manage ad budgets, optimize campaigns, and maximize ROI.",
      duration: "8 weeks",
      format: "In-person / Online",
      features: [
        "Google Ads mastery",
        "Bing Ads training",
        "Budget management",
        "ROI optimization",
      ],
      image:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 5,
      title: "Facebook & Instagram Ads (Meta Ads)",
      seoKeyword: "Facebook Instagram Ads training",
      description:
        "Run high-converting campaigns with our Meta Ads Training. Learn audience targeting, creative design, budget optimization, and performance tracking for Facebook and Instagram ads.",
      duration: "6 weeks",
      format: "In-person / Online",
      features: [
        "Audience targeting",
        "Creative design",
        "Budget optimization",
        "Performance tracking",
      ],
      image:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 6,
      title: "Google Ads (GA4)",
      seoKeyword: "Google Ads GA4 course online",
      description:
        "Understand the power of Google Ads and GA4 with our practical course. Learn keyword bidding, analytics, and advanced conversion tracking to boost online sales and leads.",
      duration: "8 weeks",
      format: "In-person / Online",
      features: [
        "Keyword bidding",
        "GA4 analytics",
        "Conversion tracking",
        "Sales optimization",
      ],
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 7,
      title: "Content & Email Marketing",
      seoKeyword: "Content and Email Marketing course",
      description:
        "Learn how to craft persuasive content and effective email campaigns that nurture leads and increase sales. This course covers copywriting, email automation, and customer engagement.",
      duration: "10 weeks",
      format: "In-person / Online",
      features: [
        "Copywriting skills",
        "Email automation",
        "Lead nurturing",
        "Customer engagement",
      ],
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 8,
      title: "WordPress Website Development",
      seoKeyword: "WordPress website development course",
      description:
        "Build professional websites without coding. Our WordPress Course teaches installation, themes, plugins, SEO integration, and e-commerce setup to create fully functional websites.",
      duration: "12 weeks",
      format: "In-person / Online",
      features: [
        "Website building",
        "Theme customization",
        "Plugin integration",
        "E-commerce setup",
      ],
      image:
        "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 9,
      title: "Affiliate Marketing (National & International Market)",
      seoKeyword: "Affiliate Marketing course online",
      description:
        "Earn passive income by promoting products online. Our Affiliate Marketing Training covers affiliate networks, strategies for Indian & global markets, and proven income models.",
      duration: "8 weeks",
      format: "In-person / Online",
      features: [
        "Affiliate networks",
        "National & global strategies",
        "Income models",
        "Passive income",
      ],
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 10,
      title: "Influencer Marketing",
      seoKeyword: "Influencer Marketing course",
      description:
        "Discover how to collaborate with influencers and grow brand awareness. Learn campaign planning, influencer outreach, and ROI measurement in this Influencer Marketing Course.",
      duration: "6 weeks",
      format: "In-person / Online",
      features: [
        "Campaign planning",
        "Influencer outreach",
        "Brand awareness",
        "ROI measurement",
      ],
      image:
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 11,
      title: "E-commerce Marketing",
      seoKeyword: "E-commerce Marketing training",
      description:
        "Scale your online store with our E-commerce Marketing Course. From product listings to paid ads, SEO, and conversion optimization, we guide you in building a successful e-commerce business.",
      duration: "10 weeks",
      format: "In-person / Online",
      features: [
        "Product listings",
        "Paid advertising",
        "Conversion optimization",
        "E-commerce growth",
      ],
      image:
        "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 12,
      title: "Start-Up & Business Setup Training",
      seoKeyword: "Startup business training online",
      description:
        "Turn your ideas into a successful business with Digital AELA's Start-Up Training. Learn planning, digital presence, funding basics, and marketing strategies to launch and grow your venture.",
      duration: "12 weeks",
      format: "In-person / Online",
      features: [
        "Business planning",
        "Digital presence",
        "Funding basics",
        "Marketing strategies",
      ],
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Digital Marketing Courses | Digital AELA - SEO, SMM, PPC, Social Media Marketing Training"
        description="Comprehensive Digital Marketing Courses by Digital AELA. Learn SEO, Social Media Marketing, PPC, Facebook & Instagram Ads, Google Ads, Content Marketing, WordPress Development, Affiliate Marketing, and E-commerce Marketing. Online training for India, Pakistan, Bangladesh, Nepal, and Gulf countries."
        keywords="Digital Marketing course, SEO training, Social Media Marketing, PPC advertising, Facebook Ads, Instagram Ads, Google Ads, Content Marketing, WordPress Development, Affiliate Marketing, E-commerce Marketing, Digital Marketing India, Pakistan, Bangladesh, Nepal"
        url="https://digitalaela.com/courses/digital-marketing"
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
              Digital Marketing Mastery
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
              Master Digital Marketing
            </motion.span>
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
              className="block bg-linear-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-transparent">
              From Zero to Hero
            </motion.span>
          </motion.h1>

          {/* Descriptive Paragraph */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
            Comprehensive digital marketing courses covering SEO, SMM, PPC,
            Content Marketing, and more. Learn from industry experts and build
            a successful online presence.
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
      <section
        id="courses"
        className="py-20 bg-[#141414] relative">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Our Digital Marketing{" "}
              <span className="text-[#D4AF37]">Courses</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Comprehensive training programs covering all aspects of digital
              marketing from SEO to E-commerce
            </p>
          </motion.div>

          {/* Courses Grid */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mb-12">
            {courses.map((course, index) => (
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
                className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.18)] transition-all duration-300 group cursor-pointer">
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
                    <p className="mb-3 text-[#D4AF37]/80 text-[11px] uppercase tracking-[0.25em]">
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
              Get Started Today
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DigitalMarketingCourses;

