import { createContext, useContext, useState, useEffect } from "react";
import { verifyFinancialPassword } from "../services/api/superAdmin";

const FinancialAuthContext = createContext(null);

const STORAGE_KEY = "aela.financial.auth";
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours

export const FinancialAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const authData = JSON.parse(stored);
          const now = Date.now();
          // Check if session is still valid (4 hours)
          if (authData.timestamp && now - authData.timestamp < SESSION_DURATION) {
            setIsAuthenticated(true);
          } else {
            // Session expired
            sessionStorage.removeItem(STORAGE_KEY);
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  const authenticate = async (password) => {
    try {
      const isValid = await verifyFinancialPassword(password);
      if (isValid) {
        // Store authentication in sessionStorage
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            authenticated: true,
            timestamp: Date.now(),
          })
        );
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Financial authentication error:", error);
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <FinancialAuthContext.Provider
      value={{
        isAuthenticated,
        isChecking,
        authenticate,
        logout,
      }}>
      {children}
    </FinancialAuthContext.Provider>
  );
};

export const useFinancialAuth = () => {
  const context = useContext(FinancialAuthContext);
  if (!context) {
    throw new Error("useFinancialAuth must be used within FinancialAuthProvider");
  }
  return context;
};

