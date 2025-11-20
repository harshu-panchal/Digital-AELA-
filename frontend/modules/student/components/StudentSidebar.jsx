import { NavLink } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
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

const StudentSidebar = ({ isOpen = true, onClose }) => {
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
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={`fixed left-0 top-0 h-screen w-64 border-r border-white/10 bg-[#0B0F1E]/95 backdrop-blur-xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}>
        <div className="flex h-full flex-col pt-25 pb-8">
          <div className="border-b border-white/10 px-6 pt-12 pb-6 relative">
            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                aria-label="Close sidebar">
                <FaTimes className="h-5 w-5" />
              </button>
            )}
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
    </aside>
    </>
  );
};

export default StudentSidebar;

