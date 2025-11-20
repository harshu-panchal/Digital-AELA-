import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaChalkboardTeacher,
  FaUserTie,
  FaUserFriends,
  FaBook,
  FaGraduationCap,
  FaBriefcase,
  FaFileAlt,
  FaPlusCircle,
  FaEdit,
  FaStar,
  FaChartBar,
  FaCog,
  FaVideo,
  FaCreditCard,
  FaChartBar,
} from "react-icons/fa";

const AdminSidebar = () => {
  const navItems = [
    {
      label: "Dashboard",
      path: "/super-admin",
      icon: FaHome,
    },
    {
      label: "Analytics",
      path: "/super-admin/analytics",
      icon: FaChartBar,
    },
    {
      label: "Settings",
      path: "/super-admin/settings",
      icon: FaCog,
    },
    {
      label: "Payments",
      path: "/super-admin/payments",
      icon: FaCreditCard,
    },
    {
      label: "Certificates",
      path: "/super-admin/certificates",
      icon: FaFileAlt,
    },
    {
      label: "CRM / Leads",
      path: "/super-admin/crm/leads",
      icon: FaUserFriends,
    },
    {
      label: "Expenses",
      path: "/super-admin/expenses",
      icon: FaFileAlt,
    },
    {
      label: "Financial Dashboard",
      path: "/super-admin/financial-dashboard",
      icon: FaChartBar,
    },
    {
      label: "User Management",
      children: [
        {
          label: "Students",
          path: "/super-admin/users/students",
          icon: FaUsers,
        },
        {
          label: "Teachers",
          path: "/super-admin/users/teachers",
          icon: FaChalkboardTeacher,
        },
        {
          label: "Recruiters",
          path: "/super-admin/users/recruiters",
          icon: FaUserTie,
        },
        {
          label: "Influencers",
          path: "/super-admin/users/influencer",
          icon: FaUserFriends,
        },
        {
          label: "Freelancers",
          path: "/super-admin/users/freelancer",
          icon: FaUserFriends,
        },
      ],
    },
    {
      label: "Approvals",
      children: [
        {
          label: "Courses",
          path: "/super-admin/approvals/courses",
          icon: FaGraduationCap,
        },
        { label: "Books", path: "/super-admin/approvals/books", icon: FaBook },
        {
          label: "Jobs",
          path: "/super-admin/approvals/jobs",
          icon: FaBriefcase,
        },
        {
          label: "Teacher Applications",
          path: "/super-admin/approvals/teachers",
          icon: FaChalkboardTeacher,
        },
        {
          label: "Course Reviews",
          path: "/super-admin/reviews/moderate",
          icon: FaStar,
        },
        {
          label: "Live Rooms",
          path: "/super-admin/live-rooms/moderate",
          icon: FaVideo,
        },
      ],
    },
    {
      label: "Content Creation",
      children: [
        {
          label: "Create Course",
          path: "/super-admin/create/course",
          icon: FaPlusCircle,
        },
        {
          label: "Upload Book",
          path: "/super-admin/create/book",
          icon: FaPlusCircle,
        },
        { label: "Post Blog", path: "/blogs/create", icon: FaEdit },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/10 bg-[#0B0F1E]/95 backdrop-blur-xl z-50">
      <div className="flex h-full flex-col pt-25 pb-8">
        <div className="border-b border-white/10 px-6 pt-12 pb-6">
          <h2 className="text-lg font-semibold text-[#F5D26A]">Super Admin</h2>
          <p className="text-xs text-gray-400">Control Panel</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <div key={index}>
                {item.path ? (
                  <NavLink
                    to={item.path}
                    end
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
                ) : (
                  <>
                    <div className="mb-2 mt-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {item.label}
                    </div>
                    {item.children?.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `ml-2 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                            isActive
                              ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`
                        }>
                        {child.icon && <child.icon className="h-4 w-4" />}
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
