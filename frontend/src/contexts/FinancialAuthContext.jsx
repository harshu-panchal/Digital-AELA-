import { createContext, useContext, useState, useEffect, useRef } from "react";
import { verifyFinancialPassword } from "../services/api/superAdmin";

const FinancialAuthContext = createContext(null);

const STORAGE_KEY = "aela.financial.auth";
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export const FinancialAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const lockTimerRef = useRef(null);
  const lockTimeoutRef = useRef(null);

  // Function to check if session is still valid
  const checkSessionValidity = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        const now = Date.now();
        // Check if session is still valid (2 hours)
        if (authData.timestamp && now - authData.timestamp < SESSION_DURATION) {
          return true;
        } else {
          // Session expired - lock automatically
          sessionStorage.removeItem(STORAGE_KEY);
          setIsAuthenticated(false);
          return false;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  // Function to clear the lock timer
  const clearLockTimer = () => {
    if (lockTimerRef.current) {
      clearInterval(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = null;
    }
  };

  // Function to start the auto-lock timer
  const startLockTimer = () => {
    clearLockTimer();
    
    // Set up interval to check every minute
    lockTimerRef.current = setInterval(() => {
      if (!checkSessionValidity()) {
        clearLockTimer();
        // Show notification that session was locked
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("financial-session-locked"));
        }
      }
    }, CHECK_INTERVAL);

    // Also set a timeout for the exact 2-hour mark
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const authData = JSON.parse(stored);
        if (authData.timestamp) {
          const timeRemaining = SESSION_DURATION - (Date.now() - authData.timestamp);
          if (timeRemaining > 0) {
            lockTimeoutRef.current = setTimeout(() => {
              sessionStorage.removeItem(STORAGE_KEY);
              setIsAuthenticated(false);
              clearLockTimer();
              if (typeof window !== "undefined" && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent("financial-session-locked"));
              }
            }, timeRemaining);
          }
        }
      } catch (error) {
        console.error("Error setting lock timeout:", error);
      }
    }
  };

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      const isValid = checkSessionValidity();
      setIsAuthenticated(isValid);
      setIsChecking(false);
      
      // Start the lock timer if authenticated
      if (isValid) {
        startLockTimer();
      }
    };

    checkAuth();

    // Cleanup on unmount
    return () => {
      clearLockTimer();
    };
  }, []);

  // Listen for visibility changes to check session when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // User returned to the tab, check if session is still valid
        if (!checkSessionValidity()) {
          clearLockTimer();
        } else {
          // Restart timer if still valid
          startLockTimer();
        }
      }
    };

    const handleFocus = () => {
      if (isAuthenticated) {
        if (!checkSessionValidity()) {
          clearLockTimer();
        } else {
          startLockTimer();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated]);

  const authenticate = async (password) => {
    try {
      const isValid = await verifyFinancialPassword(password);
      if (isValid) {
        // Store authentication in sessionStorage
        const timestamp = Date.now();
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            authenticated: true,
            timestamp: timestamp,
          })
        );
        setIsAuthenticated(true);
        // Start the auto-lock timer
        startLockTimer();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Financial authentication error:", error);
      return false;
    }
  };

  const logout = () => {
    clearLockTimer();
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

