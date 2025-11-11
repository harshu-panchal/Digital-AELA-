import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../../../src/components/SEO";
import {
  FaStar,
  FaBook,
  FaDownload,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import founderImage from "../../../src/assets/Founder.png";
import bookConfidenceBuildingImg from "../../../src/assets/images/books/confidence building.png";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import bookIELTSVocabularyImg from "../../../src/assets/images/books/IELTS vocabulary.png";
import bookVocabularyImg from "../../../src/assets/images/books/vocabulary.png";
import clientLogo1 from "../../../src/assets/images/client-logos/1.png";
import clientLogo2 from "../../../src/assets/images/client-logos/2.png";
import clientLogo3 from "../../../src/assets/images/client-logos/3.png";
import clientLogo4 from "../../../src/assets/images/client-logos/4.png";
import clientLogo5 from "../../../src/assets/images/client-logos/5.png";
import clientLogo6 from "../../../src/assets/images/client-logos/6.png";
import clientLogo7 from "../../../src/assets/images/client-logos/7.png";
import clientLogo8 from "../../../src/assets/images/client-logos/8.png";
import clientLogo11 from "../../../src/assets/images/client-logos/11.png";
import clientLogo12 from "../../../src/assets/images/client-logos/12.png";
import clientLogo13 from "../../../src/assets/images/client-logos/13.png";
import clientLogo14 from "../../../src/assets/images/client-logos/14.png";
import clientLogo17 from "../../../src/assets/images/client-logos/17.png";
import clientLogo19 from "../../../src/assets/images/client-logos/19.png";
import clientLogo23 from "../../../src/assets/images/client-logos/23.png";
import clientLogo25 from "../../../src/assets/images/client-logos/25.png";
import clientLogo26 from "../../../src/assets/images/client-logos/26.png";
import clientLogo28 from "../../../src/assets/images/client-logos/28.png";
import clientLogo29 from "../../../src/assets/images/client-logos/29.png";
import clientLogo30 from "../../../src/assets/images/client-logos/30.png";
import clientLogo31 from "../../../src/assets/images/client-logos/31.png";
import { useBlogs } from "../../../src/contexts/BlogContext";
import DonateButton from "../common/DonateButton";

const MotionLink = motion(Link);

const Home = () => {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState(0);
  const [activeCertificate, setActiveCertificate] = useState(0);
  const { trendingBlogs } = useBlogs();
  const topBlogs = trendingBlogs.slice(0, 3);

  const heroSlides = useMemo(
    () => [
      {
        id: "ambition-action",
        badge: "Where ambition meets action",
        title: "We build cities of opportunity",
        highlight: "Launch your Digital AELA centre",
        description:
          "Grow from learner to leader through guided cohorts, paid projects, and a global network cheering for you.",
        primaryCta: "Start Your Journey",
        primaryLink: "/join-us/after-life",
        secondaryCta: "See Success Stories",
        secondaryLink: "/about/success-stories",
        image:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
      },
      {
        id: "learn-earn",
        badge: "Learn & Earn",
        title: "Upgrade skills. Unlock income.",
        highlight: "Learning that pays every month",
        description:
          "Access micro-batches, freelance gigs, and recruiter dashboards built to accelerate your earning curve.",
        primaryCta: "Explore Learn & Earn",
        primaryLink: "/learn-earn",
        secondaryCta: "Browse Job Feed",
        secondaryLink: "/explore-jobs",
        image:
          "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1400&q=80",
      },
      {
        id: "gift-future",
        badge: "Gift a future",
        title: "Build your After Life centre",
        highlight: "Sponsor a classroom. Transform a city",
        description:
          "Dedicate scholarships, sponsor labs, and co-create hubs that keep learners future-ready across continents.",
        primaryCta: "Gift a Scholarship",
        primaryLink: "/donate/payment?type=anyone",
        secondaryCta: "Build After Life",
        secondaryLink: "/join-us/after-life",
        image:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
      },
      {
        id: "read-grow",
        badge: "Read • Reflect • Rise",
        title: "Free library books online",
        highlight: "Grow 1% every day with curated titles",
        description:
          "Dive into grammar guides, leadership playbooks, and digital marketing handbooks ready to read right now.",
        primaryCta: "Read Free Library",
        primaryLink: "/books",
        secondaryCta: "See Featured Reads",
        secondaryLink: "/join-us/after-life",
        image:
          "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1400&q=80",
      },
    ],
    []
  );

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const nextCertificate = () => {
    if (totalCertificateSlides <= 0) return;
    setActiveCertificate((prev) => (prev + 1) % totalCertificateSlides);
  };

  const prevCertificate = () => {
    if (totalCertificateSlides <= 0) return;
    setActiveCertificate(
      (prev) => (prev - 1 + totalCertificateSlides) % totalCertificateSlides
    );
  };

  const goToCertificate = (index) => {
    if (totalCertificateSlides <= 0) return;
    const normalizedIndex =
      ((index % totalCertificateSlides) + totalCertificateSlides) %
      totalCertificateSlides;
    setActiveCertificate(normalizedIndex);
  };

  // WhatsApp integration
  const whatsappNumber = "+971508185690";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in learning more about your English courses."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Courses data
  const courses = [
    {
      id: 1,
      title: "Basic English Course",
      image:
        "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80",
      description:
        "Build a strong foundation in English grammar, vocabulary, and everyday communication with engaging practice sessions.",
      duration: "8 weeks",
      format: "In-person / Online",
      price: "₹7,499",
      buyLink: "/contact/book-demo",
      donateLink: "/contact/business-collaboration",
      features: [
        "Grammar fundamentals",
        "Vocabulary building",
        "Speaking confidence",
        "Practical activities",
      ],
    },
    {
      id: 2,
      title: "Intermediate English Course",
      image:
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
      description:
        "Enhance fluency, sentence structure, and professional communication to bridge the gap between basics and mastery.",
      duration: "10 weeks",
      format: "Hybrid | Online",
      price: "₹9,499",
      buyLink: "/contact/book-demo",
      donateLink: "/contact/business-collaboration",
      features: [
        "Fluency drills",
        "Sentence structuring",
        "Professional writing",
        "Advanced vocabulary",
      ],
    },
    {
      id: 3,
      title: "Advanced English Course",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
      description:
        "Master business communication, presentation skills, and global-ready fluency for senior roles and international goals.",
      duration: "12 weeks",
      format: "In-person / Online",
      price: "₹11,999",
      buyLink: "/contact/book-demo",
      donateLink: "/contact/business-collaboration",
      features: [
        "Business communication",
        "Presentation mastery",
        "Advanced grammar",
        "Coaching & feedback",
      ],
    },
  ];

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Sarah Anderson",
      role: "Business Professional",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
      text: "The coaching transformed my English skills. Within 3 months, I was confidently presenting to international teams!",
      rating: 5,
    },
    {
      id: 2,
      name: "Mohammed Ali",
      role: "IELTS Student",
      avatar:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80",
      text: "Thanks to Digital AELA's IELTS preparation, I achieved a band 7.5! The personalized feedback made all the difference.",
      rating: 5,
    },
    {
      id: 3,
      name: "Fatima Hassan",
      role: "General English Learner",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
      text: "Learning English has never been this engaging. The instructors are patient, and the materials are practical and relevant.",
      rating: 5,
    },
  ];

  const certificates = [
    {
      id: "certificate-1",
      image:
        "https://images.unsplash.com/photo-1588075607487-1b2a43b871d7?auto=format&fit=crop&w=1200&q=80",
      alt: "Stack of certificates with elegant pen on desk",
    },
    {
      id: "certificate-2",
      image:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
      alt: "Instructor presenting certification to a learner",
    },
    {
      id: "certificate-3",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
      alt: "Team celebrating achievement with certificates",
    },
    {
      id: "certificate-4",
      image:
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
      alt: "Close-up of a certification folder on a table",
    },
    {
      id: "certificate-5",
      image:
        "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
      alt: "Graduates holding framed certificates",
    },
    {
      id: "certificate-6",
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      alt: "Certificate placed beside laptop and notebook",
    },
    {
      id: "certificate-7",
      image:
        "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80",
      alt: "Elegant award certificate with golden seal",
    },
    {
      id: "certificate-8",
      image:
        "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80",
      alt: "Business partners exchanging certification folder",
    },
    {
      id: "certificate-9",
      image:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
      alt: "Professional signing diploma certificate",
    },
    {
      id: "certificate-10",
      image:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
      alt: "Certificate with ribbon placed on workspace",
    },
    {
      id: "certificate-11",
      image:
        "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
      alt: "Mentor congratulating student with certificate",
    },
    {
      id: "certificate-12",
      image:
        "https://images.unsplash.com/photo-1523475472560-753a17d8d7d7?auto=format&fit=crop&w=1200&q=80",
      alt: "Framed certifications displayed on wall",
    },
  ];

  const certificatesPerSlide = 3;
  const totalCertificateSlides = Math.ceil(
    certificates.length / certificatesPerSlide
  );
  const certificateSlides = Array.from(
    { length: totalCertificateSlides },
    (_, slideIndex) =>
      certificates.slice(
        slideIndex * certificatesPerSlide,
        (slideIndex + 1) * certificatesPerSlide
      )
  );

  const storyVideos = [
    {
      id: "story-1",
      title: "How Digital AELA Transforms Careers",
      youtubeId: "I9_RD7b2oz4",
      thumbnail: "https://img.youtube.com/vi/I9_RD7b2oz4/hqdefault.jpg",
    },
    {
      id: "story-2",
      title: "Learner Spotlight: Speak with Confidence",
      youtubeId: "ItgBWtaLSVQ",
      thumbnail: "https://img.youtube.com/vi/ItgBWtaLSVQ/hqdefault.jpg",
    },
    {
      id: "story-3",
      title: "Inside Our English Labs",
      youtubeId: "GaKTXGdmahI",
      thumbnail: "https://img.youtube.com/vi/GaKTXGdmahI/hqdefault.jpg",
    },
    {
      id: "story-4",
      title: "Mentors Inspiring The After Life Movement",
      youtubeId: "DMLVWteuQJI",
      thumbnail: "https://img.youtube.com/vi/DMLVWteuQJI/hqdefault.jpg",
    },
  ];

  const clientLogosTopRow = [
    { id: "client-logo-1", name: "Aurora Corp", src: clientLogo1 },
    { id: "client-logo-2", name: "Nimble Retail", src: clientLogo2 },
    { id: "client-logo-3", name: "Swift Foods", src: clientLogo3 },
    { id: "client-logo-4", name: "Blue Horizon", src: clientLogo4 },
    { id: "client-logo-5", name: "Nova Services", src: clientLogo5 },
    { id: "client-logo-6", name: "Zenith Labs", src: clientLogo6 },
    { id: "client-logo-7", name: "Urban Motors", src: clientLogo7 },
    { id: "client-logo-8", name: "Metro Banking", src: clientLogo8 },
    { id: "client-logo-9", name: "Allied Healthcare", src: clientLogo11 },
    { id: "client-logo-10", name: "EduSpark", src: clientLogo12 },
    { id: "client-logo-11", name: "Vertex Analytics", src: clientLogo13 },
    { id: "client-logo-12", name: "Globe Logistics", src: clientLogo14 },
  ];

  const clientLogosBottomRow = [
    { id: "client-logo-13", name: "Momentum Retail", src: clientLogo17 },
    { id: "client-logo-14", name: "Pulse Media", src: clientLogo19 },
    { id: "client-logo-15", name: "Evergreen Estates", src: clientLogo23 },
    { id: "client-logo-16", name: "Bright Learning", src: clientLogo25 },
    { id: "client-logo-17", name: "Pioneer Systems", src: clientLogo26 },
    { id: "client-logo-18", name: "Prime Distribution", src: clientLogo28 },
    { id: "client-logo-19", name: "Connect Tech", src: clientLogo29 },
    { id: "client-logo-20", name: "Axis Consulting", src: clientLogo30 },
    { id: "client-logo-21", name: "Spectrum Finance", src: clientLogo31 },
  ];

  // Auto-slide testimonials every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    if (totalCertificateSlides <= 1) return;

    const certificateInterval = setInterval(() => {
      setActiveCertificate((prev) => (prev + 1) % totalCertificateSlides);
    }, 5000);

    return () => clearInterval(certificateInterval);
  }, [totalCertificateSlides]);

  const faqItems = [
    {
      question: "What types of courses do you offer?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          We offer a wide range of programs including
          <span className="font-semibold text-[#D4AF37]">
            {" "}
            English language training, digital marketing, corporate training,
            computer skills, job interview preparation, and career counselling
          </span>
          . Each course blends academic depth with real-world career skills.
        </p>
      ),
    },
    {
      question: "Who can join your courses?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          Our courses are designed for
          <span className="font-semibold text-[#D4AF37]">
            {" "}
            school & college students, working professionals, job seekers, and
            entrepreneurs
          </span>
          . Whether you are just starting or planning your next career leap,
          there is a pathway for you.
        </p>
      ),
    },
    {
      question: "Are the classes online or offline?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          We provide both{" "}
          <span className="font-semibold text-[#D4AF37]">online</span> (live and
          recorded) and
          <span className="font-semibold text-[#D4AF37]">
            {" "}
            offline classroom
          </span>{" "}
          sessions. Choose the mode that best matches your schedule and learning
          style.
        </p>
      ),
    },
    {
      question: "How do I enroll in a course?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          You can enroll directly through our website by clicking the
          <span className="font-semibold text-[#D4AF37]">
            {" "}
            "Enroll Now"
          </span>{" "}
          button on your preferred course. Need help choosing? Reach out via{" "}
          <span className="font-semibold text-[#D4AF37]">
            WhatsApp, phone, or email
          </span>{" "}
          for personalised guidance.
        </p>
      ),
    },
    {
      question: "Do you provide certificates after course completion?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          Yes, all graduates receive an{" "}
          <span className="font-semibold text-[#D4AF37]">
            ISO Certified certificate
          </span>{" "}
          that boosts your credibility for job applications, interviews, and
          career advancement.
        </p>
      ),
    },
    {
      question: "What is the Job Portal and how does it work?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          Our <span className="font-semibold text-[#D4AF37]">Job Portal</span>{" "}
          links learners with top recruiters. Upload your resume, browse curated
          openings, apply instantly, and receive dedicated placement support.
        </p>
      ),
    },
    {
      question: "Do you offer demo classes before enrollment?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          Absolutely. Join our{" "}
          <span className="font-semibold text-[#D4AF37]">
            free demo sessions
          </span>{" "}
          to experience the teaching style, curriculum, and trainer interaction
          before you commit.
        </p>
      ),
    },
    {
      question: "What makes Digital AELA different from other institutes?",
      answer: (
        <div className="text-gray-300 leading-relaxed space-y-3">
          <p>
            We combine{" "}
            <span className="font-semibold text-[#D4AF37]">
              practical learning with career outcomes
            </span>
            . Alongside expert-led training, you benefit from:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-semibold text-[#D4AF37]">
                Job assistance
              </span>{" "}
              through our talent portal
            </li>
            <li>
              <span className="font-semibold text-[#D4AF37]">
                Interview preparation & mock tests
              </span>
            </li>
            <li>
              <span className="font-semibold text-[#D4AF37]">
                Personalised study plans
              </span>
            </li>
            <li>
              Courses delivered in{" "}
              <span className="font-semibold text-[#D4AF37]">
                Hindi & English
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      question: "How can I buy your English learning books?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          Explore the{" "}
          <span className="font-semibold text-[#D4AF37]">Books</span> section on
          our website to order titles covering grammar, vocabulary, and English
          structures. They are also available on{" "}
          <span className="font-semibold text-[#D4AF37]">Amazon, Flipkart</span>
          , or directly from the institute.
        </p>
      ),
    },
    {
      question: "Do you provide career counselling services?",
      answer: (
        <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
          Yes, our experts conduct{" "}
          <span className="font-semibold text-[#D4AF37]">
            one-on-one counselling sessions
          </span>{" "}
          to help you select the right course, elevate your interview skills,
          and map a clear career roadmap.
        </p>
      ),
    },
  ];

  const galleryItems = [
    {
      id: "gallery-workshop",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "gallery-stage",
      image:
        "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "gallery-corporate",
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "gallery-mentors",
      image:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "gallery-celebration",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "gallery-organisation",
      image:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Digital AELA - Learn English & Skills Online | India Pakistan Bangladesh Nepal"
        description="Learn English, Digital Marketing, Corporate Training, and Career Skills with Digital AELA. Online courses for India, Pakistan, Bangladesh, Nepal, and Gulf countries. 24/7 support, live & recorded classes, 100% placement assistance."
        keywords="English courses online, Digital Marketing training, Corporate Training, Online learning India, Pakistan, Bangladesh, Nepal, Gulf countries, IELTS preparation, Career counselling, Skill development, English speaking course, Online education South Asia"
        url="https://digitalaela.com/"
      />
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative min-h-screen flex items-center pt-[160px] pb-20 md:pt-[180px] md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-0 right-0 h-104 w-104 -translate-y-1/4 translate-x-1/3 rounded-full bg-[#D4AF37]/10 blur-[220px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="absolute bottom-0 left-0 h-104 w-104 translate-y-1/3 -translate-x-1/2 rounded-full bg-[#0B1533]/80 blur-[200px]"
        />

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-16 xl:pl-[12%]">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroSlides[activeHeroSlide].id}
              initial={{ opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -120 }}
              transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
              className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
              <div className="order-2 text-left lg:order-1">
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#D4AF37]">
                  {heroSlides[activeHeroSlide].badge}
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
                  className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-[2.8rem] font-display">
                  {heroSlides[activeHeroSlide].title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
                  className="mt-3 text-lg font-semibold text-[#F5D26A]">
                  {heroSlides[activeHeroSlide].highlight}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.26, ease: "easeOut" }}
                  className="mt-4 max-w-xl text-base text-slate-200/85 md:text-lg">
                  {heroSlides[activeHeroSlide].description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.34, ease: "easeOut" }}
                  className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <MotionLink
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    to={heroSlides[activeHeroSlide].primaryLink}
                    className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm font-semibold text-black shadow-[0_15px_40px_rgba(245,210,106,0.32)] transition hover:brightness-105">
                    {heroSlides[activeHeroSlide].primaryCta}
                  </MotionLink>
                  <MotionLink
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    to={heroSlides[activeHeroSlide].secondaryLink}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10">
                    {heroSlides[activeHeroSlide].secondaryCta}
                  </MotionLink>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
                className="order-1 flex items-center justify-center lg:order-2">
                <div className="relative w-full max-w-[320px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/60 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
                  <div className="relative aspect-3/4 w-full">
                    <img
                      src={heroSlides[activeHeroSlide].image}
                      alt={heroSlides[activeHeroSlide].title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-linear-to-tr from-black/50 via-black/0 to-transparent" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setActiveHeroSlide(
                    (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                  )
                }
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 text-white transition hover:border-white/40 hover:bg-white/10">
                <FaArrowLeft className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length)
                }
                className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/20 p-2 text-[#F5D26A] transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/30">
                <FaArrowRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveHeroSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === activeHeroSlide
                      ? "w-10 bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.6)]"
                      : "w-6 bg-white/25 hover:bg-white/45"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Golden Ribbon Divider */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:block relative w-full pt-4 pb-8 md:pt-6 md:pb-12 bg-black overflow-hidden -mt-8 md:-mt-12">
        {/* Ribbon Shape - Full Width */}
        <div className="relative w-full">
          {/* Main Ribbon with Black->Golden->Black Gradient */}
          <div
            className="relative min-h-[100px] md:min-h-[120px] flex items-center justify-center py-4 md:py-6"
            style={{
              background:
                "linear-gradient(to right, black 0%, black 10%, #d4a837 15%, #d4af37 85%, black 90%, black 100%)",
            }}>
            {/* Ribbon Content - Statistics Grid */}
            <div className="absolute inset-0 flex items-center justify-center px-4 md:px-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 w-full max-w-7xl mx-auto">
                {/* Stat 1: 35,000+ Job Seekers Placed */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-center">
                  <div className="text-white font-bold text-lg md:text-xl lg:text-2xl font-display mb-0.5">
                    35,000+
                  </div>
                  <div className="text-white text-[10px] md:text-xs font-light">
                    Job Seekers Placed
                  </div>
                </motion.div>

                {/* Stat 2: 150+ Sectors Targeted */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-center">
                  <div className="text-white font-bold text-lg md:text-xl lg:text-2xl font-display mb-0.5">
                    150+
                  </div>
                  <div className="text-white text-[10px] md:text-xs font-light">
                    Sectors Targeted
                  </div>
                </motion.div>

                {/* Stat 3: 10+ Years of Experience */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-center">
                  <div className="text-white font-bold text-lg md:text-xl lg:text-2xl font-display mb-0.5">
                    10+
                  </div>
                  <div className="text-white text-[10px] md:text-xs font-light">
                    Years of Experience
                  </div>
                </motion.div>

                {/* Stat 4: 5000+ Placement Assisted Successfully */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="text-center">
                  <div className="text-white font-bold text-lg md:text-xl lg:text-2xl font-display mb-0.5">
                    5000+
                  </div>
                  <div className="text-white text-[10px] md:text-xs font-light">
                    Placement Assisted Successfully
                  </div>
                </motion.div>

                {/* Stat 5: 3100+ Secured Job Successfully */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="text-center">
                  <div className="text-white font-bold text-lg md:text-xl lg:text-2xl font-display mb-0.5">
                    3100+
                  </div>
                  <div className="text-white text-[10px] md:text-xs font-light">
                    Secured Job Successfully
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Left Ribbon Tail */}
            <div className="absolute left-0 top-0 h-full w-12 md:w-16">
              <svg
                className="w-full h-full"
                viewBox="0 0 64 96"
                preserveAspectRatio="none">
                <path d="M0,0 L64,0 L64,48 L0,96 Z" fill="black" />
              </svg>
            </div>

            {/* Right Ribbon Tail */}
            <div className="absolute right-0 top-0 h-full w-12 md:w-16">
              <svg
                className="w-full h-full"
                viewBox="0 0 64 96"
                preserveAspectRatio="none">
                <path d="M0,0 L64,0 L0,48 L64,96 Z" fill="black" />
              </svg>
            </div>

            {/* Decorative Lines */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-black/30"></div>
            <div className="absolute top-0 right-1/4 w-px h-full bg-black/30"></div>
          </div>
        </div>
      </motion.div>

      {/* Our Learners Work At Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-16 md:py-20 bg-black overflow-hidden">
        <div className="layout-container">
          {/* Title Area - Black Background */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white text-sm md:text-base font-medium">
                Our Clients
              </span>
              <svg
                className="w-2 h-2 text-[#D4AF37]"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#D4AF37] font-display tracking-tight leading-none">
              Our Learners Work At
            </h2>
          </motion.div>

          {/* White Ribbon Container */}
          <div
            className="relative rounded-2xl p-1 md:p-1 shadow-xl overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, #ffffff 0%, #ffffff calc(50% - 3px), #000000 calc(50% - 3px), #000000 calc(50% + 3px), #ffffff calc(50% + 3px), #ffffff 100%)",
            }}>
            {/* Client Logos - Top Row (Right to Left) */}
            <div className="pb-6 overflow-hidden">
              <div className="flex animate-scroll-left">
                {clientLogosTopRow.map((client, index) => (
                  <div
                    key={`${client.id}-${index}`}
                    className="shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] h-[100px] sm:h-[110px] md:h-[120px]">
                    <img
                      src={client.src}
                      alt={client.name}
                      loading="lazy"
                      className="h-30 md:h-1 lg:h-30 w-auto object-contain max-w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Client Logos - Bottom Row (Left to Right) */}
            <div className="overflow-hidden">
              <div className="flex animate-scroll-right">
                {clientLogosBottomRow.map((client, index) => (
                  <div
                    key={`${client.id}-${index}`}
                    className="shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] h-[100px] sm:h-[110px] md:h-[120px]">
                    <img
                      src={client.src}
                      alt={client.name}
                      loading="lazy"
                      className="h-30 md:h-1 lg:h-30 w-auto object-contain max-w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Courses Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        id="courses"
        className="pt-8 pb-12 bg-black">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Our Premium <span className="text-[#D4AF37]">Courses</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Choose from our carefully designed programs tailored to your
              learning level and goals
            </p>
          </motion.div>

          <div className="auto-grid-md lg:grid-cols-3 mb-10">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -6 }}
                className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_10px_rgba(212,175,55,0.18)] transition-all duration-300 group cursor-pointer">
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
                        {course.price}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        to={course.buyLink || "/contact/book-demo"}
                        className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs md:text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                        Buy Now
                      </Link>
                      <DonateButton
                        className="inline-flex w-full items-center justify-center rounded-full border border-[#D4AF37]/60 px-4 text-xs md:text-sm font-semibold text-[#F5D26A] hover:bg-[#D4AF37] hover:text-black"
                        size="sm">
                        Donate
                      </DonateButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* See All Courses Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            className="flex justify-center">
            <Link to="/courses/english-language">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200">
                Explore All Courses
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* About Founder Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="py-12 bg-black">
        <div className="layout-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Founder's Image */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="order-2 lg:order-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative">
                <img
                  src={founderImage}
                  alt="Digital AELA Founder - Expert English Language Trainer and Education Professional"
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </motion.div>
            </motion.div>

            {/* Right Side - Text Content */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              className="order-1 lg:order-1">
              {/* "About Our Founder" Badge */}
              <div className="mb-4">
                <span className="inline-block border-2 border-[#D4AF37] text-white px-4 py-2 rounded-lg text-sm font-semibold font-display">
                  About Our Founder
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display tracking-tight leading-none">
                Meet Our{" "}
                <span className="text-[#D4AF37]">Visionary Leader</span>
              </h2>

              {/* Descriptive Paragraph */}
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                With over 15 years of experience in English language education,
                our founder has dedicated their career to helping students
                achieve fluency and confidence. Specializing in IELTS
                preparation and corporate training, we understand that
                confidence in English opens doors to unlimited opportunities.
                Our innovative teaching methodology combines personalized
                approach with proven techniques, helping thousands of students
                achieve their dreams.
              </p>

              {/* Statistics Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
                className="flex flex-wrap gap-8 mt-8">
                {[
                  { number: "15+", label: "Years Experience" },
                  { number: "5000+", label: "Students Trained" },
                  { number: "98%", label: "Success Rate" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: 0.3 + index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col">
                    <span className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2 font-display">
                      {stat.number}
                    </span>
                    <p className="text-sm text-white font-normal">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Lead Magnets Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        id="lead-magnets"
        className="py-12 bg-[#141414]">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Start Your <span className="text-[#D4AF37]">Journey Free</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Experience premium English learning with our exclusive free offers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto">
            {/* Free Demo Class Card */}
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              whileInView={{ y: 0, opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.25,
                delay: 0.05,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-[#1a1a1a] rounded-lg p-8 border border-[#D4AF37] text-center hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300">
              {/* Play Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#3f3820] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4 font-display">
                Free Demo Class
              </h3>

              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                Join our interactive demo class and experience our teaching
                methodology firsthand.
              </p>

              {/* Button */}
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#D4AF37] text-black py-3 rounded-lg font-bold text-center hover:bg-[#E5C158] transition-colors duration-200">
                Book Your Class
              </motion.a>
            </motion.div>

            {/* Free English Guide Card */}
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              whileInView={{ y: 0, opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.25,
                delay: 0.08,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-[#1a1a1a] rounded-lg p-8 border border-[#D4AF37] text-center hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300">
              {/* Download Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#3f3820] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4 font-display">
                Free English Guide
              </h3>

              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                Download our comprehensive English learning guide with tips,
                tricks, and study resources.
              </p>

              {/* Button */}
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#1a1a1a] text-[#D4AF37] py-3 rounded-lg font-bold text-center border-2 border-[#D4AF37] hover:bg-[#524723] transition-colors duration-200">
                Download Now
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Premium Books Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-12 bg-[#1a1a1a]">
        <div className="layout-container">
          {/* Header */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            {/* Small Title */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-wider mb-4 font-display">
              • OUR RESOURCES •
            </motion.p>

            {/* Main Title */}
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Master English with Our{" "}
              <span className="text-[#D4AF37]">Premium Books</span>
            </h2>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Carefully curated learning materials designed by expert linguists
              to accelerate your English learning journey
            </p>
          </motion.div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Book 1: English Grammar Mastery */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.25,
                delay: 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer">
              <Link to="/books/1">
                {/* Book Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={bookGrammarImg}
                    alt="English Grammar Mastery cover"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Format Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <FaBook className="w-2.5 h-2.5" />
                      Physical
                    </span>
                  </div>
                  {/* Discount Badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                    40% OFF
                  </div>
                </div>

                {/* Book Content */}
                <div className="p-4">
                  {/* Category */}
                  <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                    Grammar
                  </span>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                    English Grammar Mastery
                  </h3>

                  {/* Author */}
                  <p className="text-xs text-gray-400 mb-2">
                    by Prof. Sarah Smith
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`w-3 h-3 ${
                            i < 4
                              ? "text-[#D4AF37] fill-current"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-300">4.8</span>
                    <span className="text-[10px] text-gray-500">(245)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-[#D4AF37] font-display">
                      ₹499
                    </span>
                    <span className="text-xs text-gray-500 line-through">
                      ₹699
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/books/1/payment`;
                      }}
                      className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-bold text-xs hover:bg-[#E5C158] transition-colors duration-200">
                      Buy Now
                    </motion.button>
                    <DonateButton
                      className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black"
                      size="sm">
                      Donate
                    </DonateButton>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Book 2: Vocabulary Builder Pro */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.25,
                delay: 0.15,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer">
              <Link to="/books/2">
                {/* Book Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={bookVocabularyImg}
                    alt="Vocabulary Builder Pro cover"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                  {/* Format Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <FaDownload className="w-2.5 h-2.5" />
                      E-Book
                    </span>
                  </div>
                  {/* Discount Badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                    25% OFF
                  </div>
                </div>

                {/* Book Content */}
                <div className="p-4">
                  {/* Category */}
                  <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                    Vocabulary
                  </span>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                    Vocabulary Builder Pro
                  </h3>

                  {/* Author */}
                  <p className="text-xs text-gray-400 mb-2">
                    by Dr. James Wilson
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`w-3 h-3 ${
                            i < 4
                              ? "text-[#D4AF37] fill-current"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-300">4.6</span>
                    <span className="text-[10px] text-gray-500">(189)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-[#D4AF37] font-display">
                      ₹299
                    </span>
                    <span className="text-xs text-gray-500 line-through">
                      ₹399
                    </span>
                  </div>

                  {/* Buy Now Button */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/books/2/payment`;
                      }}
                      className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-bold text-xs hover:bg-[#E5C158] transition-colors duration-200">
                      Buy Now
                    </motion.button>
                    <DonateButton
                      className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black"
                      size="sm">
                      Donate
                    </DonateButton>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Book 3: IELTS Preparation Guide */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.25,
                delay: 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer">
              <Link to="/books/3">
                {/* Book Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={bookIELTSVocabularyImg}
                    alt="IELTS Preparation Guide cover"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                  {/* Format Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <FaBook className="w-2.5 h-2.5" />
                      Physical
                    </span>
                  </div>
                  {/* Discount Badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                    42% OFF
                  </div>
                </div>

                {/* Book Content */}
                <div className="p-4">
                  {/* Category */}
                  <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                    Exam Prep
                  </span>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                    IELTS Preparation Guide
                  </h3>

                  {/* Author */}
                  <p className="text-xs text-gray-400 mb-2">by Emma Johnson</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`w-3 h-3 ${
                            i < 4
                              ? "text-[#D4AF37] fill-current"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-300">4.7</span>
                    <span className="text-[10px] text-gray-500">(312)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-[#D4AF37] font-display">
                      ₹349
                    </span>
                    <span className="text-xs text-gray-500 line-through">
                      ₹599
                    </span>
                  </div>

                  {/* Buy Now Button */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/books/3/payment`;
                      }}
                      className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-bold text-xs hover:bg-[#E5C158] transition-colors duration-200">
                      Buy Now
                    </motion.button>
                    <DonateButton
                      className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black"
                      size="sm">
                      Donate
                    </DonateButton>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Book 4: Speaking Fluency Course */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.25,
                delay: 0.25,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer">
              <Link to="/books/4">
                {/* Book Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={bookConfidenceBuildingImg}
                    alt="Speaking Fluency Course handbook"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                  {/* Format Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <FaDownload className="w-2.5 h-2.5" />
                      E-Book
                    </span>
                  </div>
                  {/* Discount Badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                    38% OFF
                  </div>
                </div>

                {/* Book Content */}
                <div className="p-4">
                  {/* Category */}
                  <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                    Speaking
                  </span>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                    Speaking Fluency Course
                  </h3>

                  {/* Author */}
                  <p className="text-xs text-gray-400 mb-2">by Mark Davis</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`w-3 h-3 ${
                            i < 4
                              ? "text-[#D4AF37] fill-current"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-300">4.9</span>
                    <span className="text-[10px] text-gray-500">(267)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-[#D4AF37] font-display">
                      ₹279
                    </span>
                    <span className="text-xs text-gray-500 line-through">
                      ₹449
                    </span>
                  </div>

                  {/* Buy Now Button */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/books/4/payment`;
                      }}
                      className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-bold text-xs hover:bg-[#E5C158] transition-colors duration-200">
                      Buy Now
                    </motion.button>
                    <DonateButton
                      className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black"
                      size="sm">
                      Donate
                    </DonateButton>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* View All Books Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            className="flex justify-center">
            <Link to="/books">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold text-base md:text-lg hover:bg-[#E5C158] transition-colors duration-200 flex items-center gap-2">
                View All Books
                <svg
                  className="w-5 h-5"
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
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Certificate Showcase Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-12 bg-black">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-12">
            <p className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
              • ACCREDITED & TRUSTED •
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
              Internationally Recognised{" "}
              <span className="text-[#D4AF37]">Certificates</span>
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Our programmes are backed by global awarding bodies, ensuring
              every learner receives verifiable credentials that open doors
              worldwide.
            </p>
          </motion.div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-white/5 backdrop-blur supports-backdrop-filter:bg-white/10">
              <ul
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.65,0.05,0.36,1)]"
                style={{
                  transform: `translateX(-${activeCertificate * 100}%)`,
                }}>
                {certificateSlides.map((slide, slideIndex) => (
                  <li
                    key={`certificate-slide-${slideIndex}`}
                    className="min-w-full bg-[#080808]/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                      {slide.map((certificate) => (
                        <figure
                          key={certificate.id}
                          className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#050505]/40 shadow-[0_16px_40px_rgba(8,8,8,0.55)]">
                          <img
                            src={certificate.image}
                            alt={certificate.alt}
                            loading="lazy"
                            className="h-56 w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                          />
                          <figcaption className="sr-only">
                            {certificate.alt}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-6 pointer-events-none">
              <button
                type="button"
                onClick={prevCertificate}
                className="pointer-events-auto hidden sm:inline-flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-black/60 p-3 text-[#F5D26A] shadow-lg transition hover:border-[#D4AF37]/60 hover:bg-black/80"
                aria-label="Previous certificates">
                <FaArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextCertificate}
                className="pointer-events-auto hidden sm:inline-flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-black/60 p-3 text-[#F5D26A] shadow-lg transition hover:border-[#D4AF37]/60 hover:bg-black/80"
                aria-label="Next certificates">
                <FaArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              {certificateSlides.map((_, index) => (
                <button
                  key={`certificate-indicator-${index}`}
                  type="button"
                  onClick={() => goToCertificate(index)}
                  className={`h-2.5 w-8 rounded-full transition-all duration-300 ${
                    index === activeCertificate
                      ? "bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                      : "bg-white/25 hover:bg-white/40"
                  }`}
                  aria-label={`View certificate slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Watch Our Stories Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-12 bg-black">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-12">
            <p className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
              • WATCH OUR STORIES •
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
              Step Inside the{" "}
              <span className="text-[#D4AF37]">Digital AELA</span> Experience
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Hear from our learners, mentors, and community as they share
              milestones, transformations, and the heart behind the After Life
              movement.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {storyVideos.map((video, index) => (
              <motion.article
                key={video.id}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="rounded-2xl border border-[#D4AF37]/20 bg-[#050505] shadow-[0_20px_50px_rgba(8,8,8,0.45)] overflow-hidden">
                <div className="relative aspect-9/16 w-full overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&showinfo=0`}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-2 font-display line-clamp-2">
                    {video.title}
                  </h3>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition-colors duration-200 hover:text-[#FFE28A]">
                    Watch on YouTube
                    <FaArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      {topBlogs.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="py-12 bg-[#090909]">
          <div className="layout-container">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center mb-12">
              <p className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
                • BLOGS •
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
                Latest Stories from the{" "}
                <span className="text-[#D4AF37]">AELA Community</span>
              </h2>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Quick reads curated by our mentors and learners. Dive into
                frameworks, wins, and behind-the-scenes playbooks powering the
                After Life movement.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {topBlogs.map((blog, index) => (
                <motion.article
                  key={blog.id}
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  whileHover={{ y: -6 }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#050505] shadow-[0_24px_60px_rgba(8,8,8,0.45)] transition-all duration-300">
                  <Link
                    to={`/blogs/${blog.id}`}
                    className="flex h-full flex-col">
                    <div className="relative h-56 w-full overflow-hidden">
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
                        {blog.category}
                      </span>
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold text-white/90">
                        {blog.readTime} min read
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-4 flex items-center gap-3 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-2">
                          <img
                            src={blog.author.avatar}
                            alt={blog.author.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="font-semibold text-white/90">
                            {blog.author.name}
                          </span>
                        </span>
                        <span className="h-1 w-1 rounded-full bg-gray-600" />
                        <span>
                          {new Date(blog.publishedAt).toLocaleDateString(
                            "en-GB"
                          )}
                        </span>
                      </div>
                      <h3 className="mb-3 text-xl font-semibold text-white font-display leading-tight group-hover:text-[#F5D26A]">
                        {blog.title}
                      </h3>
                      <p className="flex-1 text-sm text-gray-300 leading-relaxed line-clamp-3">
                        {blog.excerpt}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition-colors duration-200 group-hover:text-[#FFE28A]">
                        Read Story
                        <FaArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#0f0f0f] px-6 py-3 text-sm font-semibold text-[#F5D26A] transition hover:border-[#F5D26A]/60 hover:text-[#FFE28A]">
                Explore All Blogs
                <FaArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {galleryItems.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="py-12 bg-[#080808]">
          <div className="layout-container">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center mb-12">
              <p className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
                • AELA GALLERY •
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
                Highlights from Our{" "}
                <span className="text-[#D4AF37]">Community & Partners</span>
              </h2>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Celebrate wins from community hubs, partner organisations, and
                learners who are shaping the After Life movement across cities.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {galleryItems.map((item, index) => (
                <motion.figure
                  key={item.id}
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.04,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  whileHover={{ y: -6 }}
                  className="group overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#060606] shadow-[0_28px_70px_rgba(8,8,8,0.45)]">
                  <div className="relative h-56 w-full overflow-hidden">
                    <img
                      src={item.image}
                      alt="AELA community gallery"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                  </div>
                </motion.figure>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Testimonials Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-12 bg-[#141414]">
        <div className="layout-container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Student <span className="text-[#D4AF37]">Testimonials</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Success stories from our amazing students
            </p>
          </motion.div>

          {/* Single Testimonial Card */}
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-[#1a1a1a] rounded-lg p-8 border border-[#D4AF37] relative">
                {/* Rating Stars - Top Left */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map(
                    (_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-[#D4AF37]"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )
                  )}
                </div>

                {/* Testimonial Text */}
                <p className="text-white mb-6 text-lg leading-relaxed font-normal">
                  "{testimonials[currentTestimonial].text}"
                </p>

                {/* Author Information */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-[#D4AF37]/50 shadow-[0_6px_18px_rgba(12,12,12,0.55)]">
                    <img
                      src={testimonials[currentTestimonial].avatar}
                      alt={testimonials[currentTestimonial].name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">
                      {testimonials[currentTestimonial].name}
                    </h4>
                    <p className="text-sm text-[#D4AF37] font-normal">
                      {testimonials[currentTestimonial].role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 mt-8">
              {/* Arrow Buttons */}
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] hover:bg-[#524723] transition-colors duration-200">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] hover:bg-[#524723] transition-colors duration-200">
                  <svg
                    className="w-5 h-5"
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
                </motion.button>
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentTestimonial
                        ? "bg-[#D4AF37]"
                        : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        id="faq"
        className="py-12 bg-black">
        <div className="layout-container">
          <div className="text-center mb-9">
            <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70 font-semibold font-accent">
              Frequently Asked Questions
            </p>
            <h2 className="text-xl md:text-3xl font-bold text-white mt-3 font-display">
              Answers designed for curious learners
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mt-3 text-xs md:text-sm">
              Everything you need to know about Digital AELA courses, support,
              and the career outcomes we help you unlock.
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = activeFaq === index;
              return (
                <motion.div
                  key={item.question}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: index * 0.035 }}
                  className="rounded-2xl border border-[#D4AF37]/15 bg-[#111]/80 shadow-[0_16px_36px_rgba(0,0,0,0.22)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? -1 : index)}
                    className="w-full flex items-center justify-between gap-5 px-5 py-3 text-left">
                    <span className="text-white text-sm md:text-base font-semibold leading-snug">
                      {index + 1}. {item.question}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/35 transition-all duration-150 ${
                        isOpen
                          ? "bg-[#D4AF37]/15 text-[#D4AF37] rotate-45"
                          : "bg-transparent text-[#D4AF37]"
                      }`}>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                          open: { height: "auto", opacity: 1 },
                          collapsed: { height: 0, opacity: 0 },
                        }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="px-5 pb-4 overflow-hidden">
                        <div className="text-xs md:text-sm leading-relaxed text-gray-300">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* WhatsApp Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 group animate-float"
        aria-label="Chat on WhatsApp">
        <svg
          className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300"
          fill="currentColor"
          viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          1
        </span>
      </a>
    </div>
  );
};

export default Home;
