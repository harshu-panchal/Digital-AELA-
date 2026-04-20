import { NavLink } from "react-router-dom";
import {
  FaBook,
  FaBullhorn,
  FaChartLine,
  FaCog,
  FaGraduationCap,
  FaHome,
  FaHourglassHalf,
  FaSchool,
  FaUsers,
} from "react-icons/fa";

const navItems = [
  { label: "Dashboard", path: "/branch-owner/dashboard", icon: FaHome },
  { label: "Branch Profile", path: "/branch-owner/profile", icon: FaSchool },
  { label: "Pending Approvals", path: "/branch-owner/approvals", icon: FaHourglassHalf },
  { label: "Teachers", path: "/branch-owner/teachers", icon: FaUsers },
  { label: "Students", path: "/branch-owner/students", icon: FaUsers },
  { label: "Courses", path: "/branch-owner/courses", icon: FaGraduationCap },
  { label: "Books", path: "/branch-owner/books", icon: FaBook },
  { label: "Announcements", path: "/branch-owner/announcements", icon: FaBullhorn },
  { label: "Analytics", path: "/branch-owner/analytics", icon: FaChartLine },
  { label: "Settings", path: "/branch-owner/settings", icon: FaCog },
];

const BranchOwnerSidebar = ({ isOpen = true, onClose }) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-white/10 bg-[#0B0F1E]/95 backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}>
        <div className="flex h-full flex-col pt-25 pb-8">
          <div className="border-b border-white/10 px-6 pt-12 pb-6">
            <h2 className="text-lg font-semibold text-[#F5D26A]">Branch Owner</h2>
            <p className="text-xs text-gray-400">Institute Management</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
            <div className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/branch-owner/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                      isActive
                        ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`
                  }>
                  <item.icon className="h-4 w-4" />
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

export default BranchOwnerSidebar;
