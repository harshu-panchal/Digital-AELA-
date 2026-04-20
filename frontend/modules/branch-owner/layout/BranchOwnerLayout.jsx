import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineClock, HiOutlineShieldCheck, HiOutlineXCircle } from "react-icons/hi2";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSidebar } from "../../../src/contexts/SidebarContext";
import BranchOwnerSidebar from "../components/BranchOwnerSidebar";

const MotionDiv = motion.div;

const statusCopy = {
  pending: {
    icon: HiOutlineClock,
    title: "Branch Approval Pending",
    subtitle: "Your institute application is under admin review.",
    body: "You can sign in and update your profile while the admin team reviews your branch. Full management tools unlock once the branch is approved and live.",
  },
  rejected: {
    icon: HiOutlineXCircle,
    title: "Branch Application Rejected",
    subtitle: "Your branch is not live right now.",
    body: "Review the rejection reason in your branch profile and update your application details before contacting the admin team.",
  },
  suspended: {
    icon: HiOutlineShieldCheck,
    title: "Branch Suspended",
    subtitle: "Management actions are paused.",
    body: "Your branch is temporarily offline. Existing members remain protected, but new approvals and publishing actions are disabled until reactivation.",
  },
};

const BranchStatusGate = ({ status, reason }) => {
  const copy = statusCopy[status] || statusCopy.pending;
  const Icon = copy.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020409] px-4 py-20 text-white">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#F5D26A]/30 bg-[#F5D26A]/10">
          <Icon className="h-14 w-14 text-[#F5D26A]" />
        </div>
        <h1 className="text-4xl font-bold">{copy.title}</h1>
        <p className="mt-4 text-xl text-slate-300">{copy.subtitle}</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <p className="text-slate-300">{copy.body}</p>
          {reason && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {reason}
            </p>
          )}
        </div>
      </MotionDiv>
    </div>
  );
};

const BranchOwnerLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const branchStatus =
    user?.metadata?.branchStatus || user?.metadata?.status || user?.approvalStatus;

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020409] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#F5D26A]" />
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (["pending", "rejected", "suspended"].includes(branchStatus)) {
    return <BranchStatusGate status={branchStatus} reason={user.rejectionReason} />;
  }

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <div className="flex">
        <BranchOwnerSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 md:ml-64">
          <div className="pt-20 pr-4 pb-6 pl-4 md:pt-[120px] md:pr-[30px] md:pl-[30px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BranchOwnerLayout;
