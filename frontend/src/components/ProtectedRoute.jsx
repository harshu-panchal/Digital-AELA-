import { useEffect, useMemo } from "react";
import { Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaLock, FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const MotionDiv = motion.div;

const LoginPrompt = ({ pathname }) => {
  const navigate = useNavigate();
  const pageNames = {
    "/learn-earn": "Dashboard Overview",
    "/learn-earn/dashboard": "Dashboard",
    "/learn-earn/profile": "Profile",
    "/learn-earn/chat": "Messages",
    "/learn-earn/ratings": "Ratings",
    "/learn-earn/wallet": "Wallet",
    "/learn-earn/redemption-history": "Redemption History",
  };

  const pageName = pageNames[pathname] || "this page";

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto px-4">
        <div className="bg-[#0A0E1C] rounded-3xl p-8 border border-white/10 text-center">
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}>
            <FaLock className="w-16 h-16 text-[#D4AF37] mx-auto mb-6" />
          </MotionDiv>
          <h2 className="text-2xl font-bold text-white mb-3">Login Required</h2>
          <p className="text-gray-400 mb-2">
            Please sign in to access <span className="font-semibold text-[#D4AF37]">{pageName}</span>.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Sign in to track your progress, earn coins, and unlock exclusive features.
          </p>
          <div className="space-y-3">
            <Link
              to="/login/student"
              state={{ from: pathname }}
              className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110">
              Sign In to Continue
            </Link>
            <button
              onClick={() => navigate("/learn-earn/activities")}
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-white/20 bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              <FaArrowLeft className="w-4 h-4" />
              Browse Activities
            </button>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

const ProtectedRoute = ({ children, roles, showLoginPrompt = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const normalizedUserRole = user?.role === "branch-owner" ? "branch_owner" : user?.role;
  const normalizedRoles = useMemo(
    () => roles?.map((role) => (role === "branch-owner" ? "branch_owner" : role)),
    [roles]
  );

  useEffect(() => {
    if (!user) {
      if (showLoginPrompt) {
        toast.info("Please sign in to access this page.", {
          toastId: `auth-required-${location.pathname}`,
        });
      }
      return;
    }

    if (normalizedRoles && normalizedRoles.length > 0 && !normalizedRoles.includes(normalizedUserRole)) {
      toast.error("You do not have permission to access this area.", {
        toastId: `auth-forbidden-${location.pathname}`,
      });
    }
  }, [user, normalizedRoles, normalizedUserRole, location.pathname, showLoginPrompt]);

  if (!user) {
    // If showLoginPrompt is true, show in-page login prompt instead of redirecting
    if (showLoginPrompt) {
      return <LoginPrompt pathname={location.pathname} />;
    }
    
    // Default behavior: redirect to login
    return (
      <Navigate
        to="/login/student"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (normalizedRoles && normalizedRoles.length > 0 && !normalizedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

