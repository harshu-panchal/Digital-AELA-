import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome,
  FaBook,
  FaFileAlt,
  FaCreditCard,
  FaBriefcase,
  FaCoins,
  FaUser,
  FaBookOpen,
  FaUsers,
  FaSearch,
  FaGraduationCap,
  FaCertificate,
  FaQuestionCircle,
} from "react-icons/fa";

const StudentSidebar = ({ isOpen = true }) => {
  const navItems = [
    {
      label: "Dashboard",
      path: "/student/dashboard",
      icon: FaHome,
    },
    {
      label: "My Courses",
      path: "/student/courses",
      icon: FaGraduationCap,
    },
    {
      label: "Assignments",
      path: "/student/assignments",
      icon: FaFileAlt,
    },
    {
      label: "Certificates",
      path: "/student/certificates",
      icon: FaCertificate,
    },
    {
      label: "Doubt Tickets",
      path: "/student/doubt-tickets",
      icon: FaQuestionCircle,
    },
    {
      label: "Payments",
      path: "/student/payments",
      icon: FaCreditCard,
    },
    {
      label: "Job Applications",
      path: "/student/applications",
      icon: FaBriefcase,
    },
    {
      label: "Points & Rewards",
      path: "/student/points/history",
      icon: FaCoins,
    },
    {
      label: "Learn & Earn",
      path: "/learn-earn",
      icon: FaCoins,
    },
    {
      label: "Library",
      path: "/free-library",
      icon: FaBookOpen,
    },
    {
      label: "Community",
      path: "/community",
      icon: FaUsers,
    },
    {
      label: "Explore Jobs",
      path: "/explore-jobs",
      icon: FaSearch,
    },
    {
      label: "Profile",
      path: "/student/profile",
      icon: FaUser,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -256, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -256, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed left-0 top-0 h-screen w-64 border-r border-white/10 bg-[#0B0F1E]/95 backdrop-blur-xl z-50"
        >
          <div className="flex h-full flex-col pt-25 pb-8">
            <div className="border-b border-white/10 px-6 pt-12 pb-6">
              <h2 className="text-lg font-semibold text-[#F5D26A]">Student Portal</h2>
              <p className="text-xs text-gray-400">Learning Dashboard</p>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
              <div className="space-y-2">
                {navItems.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.path}
                    end={item.path === "/student/dashboard"}
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
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default StudentSidebar;

