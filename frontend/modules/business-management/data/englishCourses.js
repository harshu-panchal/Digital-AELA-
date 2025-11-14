export const englishCourses = [
  {
    id: 1,
    slug: "basic-english",
    category: "English Language",
    title: "Basic English Course",
    description:
      "Digital AELA's Basic English Course is designed for beginners who want to build a strong foundation in grammar, vocabulary, and everyday communication. With interactive lessons and practical exercises, this course ensures you gain confidence to speak and write English in daily life, study, and work situations.",
    duration: "8 weeks",
    format: "Live online cohort",
    price: "₹7,499",
    image:
      "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=900&q=80",
    features: [
      "Grammar fundamentals",
      "Vocabulary building",
      "Everyday communication",
      "Practical exercises",
    ],
  },
  {
    id: 2,
    slug: "intermediate-english",
    category: "English Language",
    title: "Intermediate English Course",
    description:
      "Take your English skills to the next level with our Intermediate English Course. Focused on enhancing fluency, sentence structuring, and professional communication, this course bridges the gap between basic knowledge and advanced mastery. Ideal for students, professionals, and job seekers.",
    duration: "10 weeks",
    format: "Live online cohort",
    price: "₹8,999",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
    features: [
      "Fluency enhancement",
      "Sentence structuring",
      "Professional communication",
      "Advanced vocabulary",
    ],
  },
  {
    id: 3,
    slug: "advanced-english",
    category: "English Language",
    title: "Advanced English Course",
    description:
      "Master the art of fluent and confident English communication with Digital AELA's Advanced English Course. Covering advanced grammar, business communication, presentations, and academic writing, this course is perfect for career growth and international opportunities.",
    duration: "12 weeks",
    format: "Executive live online",
    price: "₹11,499",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    features: [
      "Advanced grammar",
      "Business communication",
      "Presentation skills",
      "Academic writing",
    ],
  },
  {
    id: 4,
    slug: "personalised-english-speaking",
    category: "English Language",
    title: "Personalised English Speaking",
    description:
      "Our Personalised English Speaking Course offers one-to-one customized lessons tailored to your goals—whether it's job interviews, corporate presentations, or social confidence. Learn at your own pace with dedicated mentors guiding you step by step.",
    duration: "Customized",
    format: "Live online personalised",
    price: "₹1,499/session",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    features: [
      "One-to-one sessions",
      "Customized curriculum",
      "Personal mentors",
      "Flexible scheduling",
    ],
  },
  {
    id: 5,
    slug: "english-speaking-kids",
    category: "English Language",
    title: "Specialized Speaking Course for Kids",
    description:
      "Build your child's confidence with our Kids English Speaking Program. Focused on pronunciation, storytelling, and interactive games, this course helps children develop strong communication skills from an early age.",
    duration: "8 weeks",
    format: "Live online cohort",
    price: "₹6,999",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
    features: [
      "Pronunciation practice",
      "Storytelling skills",
      "Interactive games",
      "Early communication",
    ],
  },
  {
    id: 6,
    slug: "exam-preparation-english",
    category: "English Language",
    title: "Exam Preparation (IELTS, TOEFL, SSC, Bank PO & Others)",
    description:
      "Crack your dream exams with Digital AELA's Exam Preparation Courses. From IELTS & TOEFL for international studies to SSC, Bank PO, and other competitive exams, we provide structured guidance, practice tests, and proven strategies to help you succeed.",
    duration: "10 weeks",
    format: "Live online cohort",
    price: "₹9,999",
    image:
      "https://images.unsplash.com/photo-1488722796624-0aa6f1bb6399?auto=format&fit=crop&w=900&q=80",
    features: [
      "IELTS & TOEFL prep",
      "SSC & Bank PO prep",
      "Practice tests",
      "Proven strategies",
    ],
  },
  {
    id: 7,
    slug: "english-literature-ncert",
    category: "English Language",
    title: "11th & 12th English Literature (NCERT)",
    description:
      "Our NCERT English Literature Coaching supports students of class 11th and 12th with in-depth analysis of prose, poetry, and grammar. Designed to score high in board exams while improving overall comprehension skills.",
    duration: "12 weeks",
    format: "Live online cohort",
    price: "₹10,499",
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
    features: [
      "Prose analysis",
      "Poetry comprehension",
      "Grammar mastery",
      "Board exam prep",
    ],
  },
  {
    id: 8,
    slug: "english-teacher-training",
    category: "English Language",
    title: "English Language Teacher/Trainer Course",
    description:
      "Become a certified English trainer with Digital AELA's Teacher Training Course. Learn modern teaching methodologies, classroom management, and digital tools to kick-start or enhance your teaching career globally.",
    duration: "12 weeks",
    format: "Live online cohort",
    price: "₹12,999",
    image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80",
    features: [
      "Teaching methodologies",
      "Classroom management",
      "Digital tools",
      "Global certification",
    ],
  },
  {
    id: 9,
    slug: "ielts-masterclass",
    category: "English Language",
    title: "IELTS Masterclass",
    description:
      "Band-focused preparation with mock tests, feedback reviews, and skill-by-skill improvement plans to help you reach your target score.",
    duration: "6 weeks",
    format: "Targeted prep cohort",
    price: "₹7,999",
    image:
      "https://images.unsplash.com/photo-1528109984716-1d28c37fa326?auto=format&fit=crop&w=900&q=80",
    features: [
      "Band analysis clinics",
      "Speaking mock interviews",
      "Writing task feedback",
      "Listening & reading labs",
    ],
  },
];

export const englishCourseBySlug = (slug) =>
  englishCourses.find((course) => course.slug === slug);

