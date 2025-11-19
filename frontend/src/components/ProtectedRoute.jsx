import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      toast.info("Please sign in to continue.", {
        toastId: `auth-required-${location.pathname}`,
      });
      return;
    }

//     git status
// On branch main
// Your branch is up to date with 'origin/main'.

// Untracked files:
//   (use "git add <file>..." to include in what will be committed)
//         frontend/.env

// nothing added to commit but untracked files present (use "git add" to track)

    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      toast.error("You do not have permission to access this area.", {
        toastId: `auth-forbidden-${location.pathname}`,
      });
    }
  }, [user, roles, location.pathname]);

  if (!user) {
    return (
      <Navigate
        to="/login/student"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

