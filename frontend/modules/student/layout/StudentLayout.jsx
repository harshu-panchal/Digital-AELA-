import { Outlet } from "react-router-dom";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSidebar } from "../../../src/contexts/SidebarContext";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { HiOutlineClock, HiOutlineShieldCheck } from "react-icons/hi2";
import StudentSidebar from "../components/StudentSidebar";

const StudentLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const { isSidebarOpen, closeSidebar } = useSidebar();

  // Wait for user to load before checking approval status
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#020409] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5D26A] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if student is not approved (isActive is false)
  // Only check if user is a student and isActive is explicitly false
  // If isActive is undefined, allow access (for backward compatibility with existing users)
  const isStudentPendingApproval =
    user &&
    user.role === "student" &&
    typeof user.isActive === "boolean" &&
    user.isActive === false;

  if (isStudentPendingApproval) {
    return (
      <div className="min-h-screen mt-[100px] bg-[#020409] text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto px-6 py-12 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#F5D26A]/20 rounded-full blur-2xl"></div>
              <div className="relative bg-[#F5D26A]/10 rounded-full p-6 border border-[#F5D26A]/30">
                <HiOutlineClock className="w-16 h-16 text-[#F5D26A]" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-white">
            Admin Approval Pending
          </h1>

          <p className="text-xl text-slate-300 mb-6">
            Your student account is currently under review
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-6">
              <HiOutlineShieldCheck className="w-6 h-6 text-[#F5D26A] shrink-0 mt-1" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-white mb-2">
                  What happens next?
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  Our administrative team is reviewing your application. Once
                  approved, you'll receive an email notification and will be
                  able to access your student dashboard.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-sm text-slate-400">
                If you have any questions, please contact our support team.
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-400">
            <p>
              You'll be automatically redirected once your account is approved.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <div className="flex">
        <StudentSidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
        <main className="md:ml-64 flex-1">
          <div className="pt-[120px] md:pt-[120px] pt-20 md:pl-[30px] pl-4 pb-[20px] pr-[30px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;

