export const corporateTrainingCourses = [
  {
    id: 1,
    slug: "public-speaking-stage-confidence",
    category: "Corporate Training",
    title: "Public Speaking & Stage Confidence",
    description:
      "Build your confidence on stage and in meetings with Digital AELA's Public Speaking Training. Learn voice control, body language, storytelling, and audience engagement to become a fearless speaker in every environment.",
    duration: "8 weeks",
    format: "Live online cohort",
    price: "₹18,999",
    image:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
    features: [
      "Voice control & modulation",
      "Body language mastery",
      "Storytelling techniques",
      "Audience engagement",
    ],
  },
  {
    id: 2,
    slug: "communication-accent-training",
    category: "Corporate Training",
    title: "Communication & Accent Training",
    description:
      "Improve your fluency, clarity, and pronunciation with our Communication & Accent Training program. Learn neutral English accent, reduce MTI (Mother Tongue Influence), and practice real-life dialogues.",
    duration: "10 weeks",
    format: "Live online cohort",
    price: "₹16,999",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    features: [
      "Neutral English accent",
      "MTI reduction techniques",
      "Pronunciation mastery",
      "Real-life dialogue practice",
    ],
  },
  {
    id: 3,
    slug: "leadership-team-management",
    category: "Corporate Training",
    title: "Leadership & Team Management Skills",
    description:
      "Become a confident leader with our Leadership & Team Management Training. Learn decision-making, conflict resolution, motivation techniques, and project management for global workplaces.",
    duration: "12 weeks",
    format: "Live online cohort",
    price: "₹22,499",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    features: [
      "Decision-making strategies",
      "Conflict resolution",
      "Motivation techniques",
      "Project management",
    ],
  },
  {
    id: 4,
    slug: "host-anchor-speaker-training",
    category: "Corporate Training",
    title: "Host / Anchor / Speaker Training",
    description:
      "Become a professional host, anchor, or event speaker. Learn stage handling, script reading, voice modulation, and event coordination with experts from the media industry.",
    duration: "8 weeks",
    format: "Live online cohort",
    price: "₹15,499",
    image:
      "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=900&q=80",
    features: [
      "Stage handling & presence",
      "Script reading mastery",
      "Voice modulation",
      "Event coordination",
    ],
  },
  {
    id: 5,
    slug: "interview-preparation",
    category: "Corporate Training",
    title: "Interview Preparation (HR & Technical)",
    description:
      "Equip your teams to ace HR and technical interviews with confidence. Mock interviews, communication labs, and role-specific question banks ensure they represent your brand flawlessly.",
    duration: "6 weeks",
    format: "Live online cohort",
    price: "₹12,999",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    features: [
      "Mock interview labs",
      "Communication coaching",
      "Role-specific prep",
      "HR & technical panels",
    ],
  },
  {
    id: 6,
    slug: "call-centre-customer-service",
    category: "Corporate Training",
    title: "Call Centre / Customer Service Training",
    description:
      "Launch high-performing customer experience teams. Voice & accent, empathy frameworks, and de-escalation drills prepare your workforce for BPO and client-facing roles across global markets.",
    duration: "8 weeks",
    format: "Live online cohort",
    price: "₹11,999",
    image:
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=900&q=80",
    features: [
      "Voice & accent mastery",
      "Client communication",
      "Problem-solving drills",
      "CX quality metrics",
    ],
  },
  {
    id: 7,
    slug: "sales-executive-masterclass",
    category: "Corporate Training",
    title: "Sales Executive Masterclass",
    description:
      "Turn sales teams into revenue powerhouses. Learn territory planning, negotiation playbooks, CRM workflows, and deal-closing psychology tailored for multiple sectors.",
    duration: "10 weeks",
    format: "Live online cohort",
    price: "₹19,999",
    image:
      "https://images.unsplash.com/photo-1507679622673-989605832e3d?auto=format&fit=crop&w=900&q=80",
    features: [
      "Consultative selling",
      "Negotiation labs",
      "Client relationship design",
      "CRM implementation",
    ],
  },
  {
    id: 8,
    slug: "custom-training-request",
    category: "Corporate Training",
    title: "Custom Training Request",
    description:
      "Every organization has unique training needs. Request personalized modules in communication, leadership, or technical skills with flexible delivery options across South Asia and the Gulf.",
    duration: "Customized",
    format: "Live online cohort",
    price: "Custom Pricing",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    features: [
      "Personalized curriculum",
      "Flexible scheduling",
      "Industry-specific modules",
      "Online & offline options",
    ],
    isCustom: true,
  },
  {
    id: 9,
    slug: "career-launchpad",
    category: "Corporate Training",
    title: "Career Launchpad & Skill Development",
    description:
      "Blend psychometrics, skill sprints, and mentorship to design placement-ready career blueprints for emerging professionals.",
    duration: "8 weeks",
    format: "Mentorship pods",
    price: "₹12,499",
    image:
      "https://images.unsplash.com/photo-1518609803965-7f03b10f17dd?auto=format&fit=crop&w=900&q=80",
    features: [
      "Career mapping",
      "Interview labs",
      "1:1 mentorship",
      "Portfolio reviews",
    ],
  },
];

export const corporateTrainingCourseBySlug = (slug) =>
  corporateTrainingCourses.find((course) => course.slug === slug);

