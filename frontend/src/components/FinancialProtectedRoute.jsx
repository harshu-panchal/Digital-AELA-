import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useFinancialAuth } from "../contexts/FinancialAuthContext";
import FinancialPasswordModal from "./FinancialPasswordModal";

const FinancialProtectedRoute = ({ children }) => {
  const { isAuthenticated, isChecking, authenticate, logout } = useFinancialAuth();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setShowModal(true);
    }
  }, [isAuthenticated, isChecking]);

  // Listen for auto-lock events
  useEffect(() => {
    const handleSessionLocked = () => {
      toast.warning("Financial session has been automatically locked after 2 hours for security.", {
        autoClose: 5000,
        toastId: "financial-session-locked",
      });
      setShowModal(true);
    };

    window.addEventListener("financial-session-locked", handleSessionLocked);

    return () => {
      window.removeEventListener("financial-session-locked", handleSessionLocked);
    };
  }, []);

  const handleAuthenticate = async (password) => {
    const success = await authenticate(password);
    if (success) {
      setShowModal(false);
      return true;
    }
    return false;
  };

  const handleCancel = () => {
    // Navigate back to admin dashboard
    navigate("/super-admin");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#03040B] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          <p className="mt-4 text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <FinancialPasswordModal
          isOpen={showModal}
          onSuccess={handleAuthenticate}
          onCancel={handleCancel}
        />
        <div className="min-h-screen bg-[#03040B] text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400">Please enter the financial password to access this page.</p>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default FinancialProtectedRoute;


