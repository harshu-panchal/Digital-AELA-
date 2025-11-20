import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaGraduationCap,
  FaBook,
  FaQuestionCircle,
  FaFileAlt,
  FaUsers,
  FaChartBar,
  FaDollarSign,
  FaShoppingBag,
  FaEnvelope,
  FaBullhorn,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaUser,
} from "react-icons/fa";

const TeacherSidebar = () => {
  const navItems = [
    {
      label: "Dashboard",
      path: "/teacher/dashboard",
      icon: FaHome,
    },
    {
      label: "Courses",
      path: "/teacher/courses",
      icon: FaGraduationCap,
    },
    {
      label: "Ebooks",
      path: "/teacher/ebooks",
      icon: FaBook,
    },
    {
      label: "Quizzes",
      path: "/teacher/quizzes",
      icon: FaQuestionCircle,
    },
    {
      label: "Assignments",
      path: "/teacher/assignments",
      icon: FaFileAlt,
    },
    {
      label: "Students",
      path: "/teacher/students",
      icon: FaUsers,
    },
    {
      label: "Analytics",
      path: "/teacher/analytics",
      icon: FaChartBar,
    },
    {
      label: "Earnings",
      path: "/teacher/earnings",
      icon: FaDollarSign,
    },
    {
      label: "Marketplace",
      path: "/teacher/marketplace",
      icon: FaShoppingBag,
    },
    {
      label: "Doubt Tickets",
      path: "/teacher/doubt-tickets",
      icon: FaEnvelope,
    },
    {
      label: "Announcements",
      path: "/teacher/announcements",
      icon: FaBullhorn,
    },
    {
      label: "Payout Requests",
      path: "/teacher/payout-requests",
      icon: FaCreditCard,
    },
    {
      label: "Payment Slips",
      path: "/teacher/payment-slips",
      icon: FaFileInvoiceDollar,
    },
    {
      label: "Profile",
      path: "/teacher/profile",
      icon: FaUser,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/10 bg-[#0B0F1E]/95 backdrop-blur-xl z-50">
      <div className="flex h-full flex-col pt-25 pb-8">
        <div className="border-b border-white/10 px-6 pt-12 pb-6">
          <h2 className="text-lg font-semibold text-[#F5D26A]">Teacher Portal</h2>
          <p className="text-xs text-gray-400">Teaching Dashboard</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                end={item.path === "/teacher/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`
                }>
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default TeacherSidebar;

