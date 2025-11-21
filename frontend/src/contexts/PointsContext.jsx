/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchStudentDashboard } from "../services/api/student";
import { fetchStudentPoints } from "../services/api/points";
import { isNetworkError } from "../services/api/baseClient";

const PointsContext = createContext();

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return context;
};

export const PointsProvider = ({ children }) => {
  const { user: authUser, tokens } = useAuth();
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [aelaPoints, setAelaPoints] = useState(() => {
    // Get points from localStorage as initial value (will be overridden by backend if available)
    const savedPoints = localStorage.getItem("aelaPoints");
    return savedPoints ? parseInt(savedPoints, 10) : 0;
  });
  const [backendCoinsLoaded, setBackendCoinsLoaded] = useState(false);

  const [totalEarned, setTotalEarned] = useState(() => {
    const saved = localStorage.getItem("totalEarned");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [totalRedeemed, setTotalRedeemed] = useState(() => {
    const saved = localStorage.getItem("totalRedeemed");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Load points from backend on mount and when user changes
  const loadPointsFromBackend = useCallback(async () => {
    if (!authUser || authUser.role !== "student" || !tokens?.accessToken) {
      setIsLoadingPoints(false);
      return; // Fall back to localStorage
    }

    setIsLoadingPoints(true);
    try {
      // Try to load from dedicated points API first
      try {
        const pointsData = await fetchStudentPoints();
        if (pointsData?.points) {
          const { availableCoins, totalEarned, totalRedeemed } = pointsData.points;
          
          setAelaPoints(availableCoins || 0);
          localStorage.setItem("aelaPoints", (availableCoins || 0).toString());
          
          setTotalEarned(totalEarned || 0);
          localStorage.setItem("totalEarned", (totalEarned || 0).toString());
          
          setTotalRedeemed(totalRedeemed || 0);
          localStorage.setItem("totalRedeemed", (totalRedeemed || 0).toString());
          
          setBackendCoinsLoaded(true);
          setIsLoadingPoints(false);
          return;
        }
      } catch (pointsError) {
        // If points API fails, fall back to dashboard
        if (!isNetworkError(pointsError)) {
          // eslint-disable-next-line no-console
          console.warn("Points API failed, falling back to dashboard:", pointsError);
        }
      }

      // Fallback to dashboard data
      const dashboardData = await fetchStudentDashboard();
      const learnEarnProgress = dashboardData?.learnEarnProgress;
      if (learnEarnProgress) {
        // Update coins (available coins to redeem)
        if (learnEarnProgress.coinsToRedeem !== undefined) {
        const backendCoins = learnEarnProgress.coinsToRedeem || 0;
        setAelaPoints((prev) => {
          const newValue = backendCoins;
          if (prev !== newValue) {
            // eslint-disable-next-line no-console
            console.log("Updating coins from backend:", prev, "->", newValue);
          }
          return newValue;
        });
        localStorage.setItem("aelaPoints", backendCoins.toString());
        }

        // Update total earned from backend
        if (learnEarnProgress.totalEarned !== undefined) {
          const backendTotalEarned = learnEarnProgress.totalEarned || 0;
          setTotalEarned(backendTotalEarned);
          localStorage.setItem("totalEarned", backendTotalEarned.toString());
        }

        // Update total redeemed from backend
        if (learnEarnProgress.totalRedeemed !== undefined) {
          const backendTotalRedeemed = learnEarnProgress.totalRedeemed || 0;
          setTotalRedeemed(backendTotalRedeemed);
          localStorage.setItem("totalRedeemed", backendTotalRedeemed.toString());
        }

        setBackendCoinsLoaded(true);
      } else {
        // Backend didn't return learnEarnProgress data - keep current value
        setBackendCoinsLoaded(true);
      }
    } catch (error) {
      // Only log non-network errors to reduce console noise when server is down
      if (!isNetworkError(error)) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load points from backend:", error);
      }
      // If backend fails, keep using current localStorage value (don't reset to 0)
      setBackendCoinsLoaded(true);
    } finally {
      setIsLoadingPoints(false);
    }
  }, [authUser, tokens]);

  useEffect(() => {
    let interval = null;
    let shouldContinuePolling = true;

    const pollPoints = async () => {
      if (!shouldContinuePolling || !authUser || authUser.role !== "student" || !tokens?.accessToken) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        return;
      }

      try {
        await loadPointsFromBackend();
      } catch (error) {
        // Stop polling if we get a 401 error (unauthorized) after token refresh fails
        if (error.status === 401 && error.requiresLogin) {
          shouldContinuePolling = false;
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return;
        }
        // For other errors, continue polling (network errors are expected)
      }
    };

    // Initial load
    pollPoints();
    
    // Refresh wallet data every 30 seconds to keep it live
    interval = setInterval(pollPoints, 30000);
    
    // Listen for transaction completion to refresh wallet immediately
    const handleTransactionCompleted = () => {
      if (shouldContinuePolling) {
        loadPointsFromBackend();
      }
    };
    window.addEventListener("transactionCompleted", handleTransactionCompleted);
    window.addEventListener("refreshWallet", handleTransactionCompleted);
    
    return () => {
      shouldContinuePolling = false;
      if (interval) {
        clearInterval(interval);
      }
      window.removeEventListener("transactionCompleted", handleTransactionCompleted);
      window.removeEventListener("refreshWallet", handleTransactionCompleted);
    };
  }, [loadPointsFromBackend, authUser, tokens?.accessToken]);

  // Save to localStorage whenever points change
  useEffect(() => {
    localStorage.setItem("aelaPoints", aelaPoints.toString());
  }, [aelaPoints]);

  useEffect(() => {
    localStorage.setItem("totalEarned", totalEarned.toString());
  }, [totalEarned]);

  useEffect(() => {
    localStorage.setItem("totalRedeemed", totalRedeemed.toString());
  }, [totalRedeemed]);

  const addPoints = useCallback(
    (points, _REASON = "") => {
      void _REASON;
      setAelaPoints((prev) => {
        const newTotal = prev + points;
        // Update localStorage immediately to prevent data loss on refresh
        localStorage.setItem("aelaPoints", newTotal.toString());
        // eslint-disable-next-line no-console
        console.log("Added points locally:", points, "New total:", newTotal);
        return newTotal;
      });
      setTotalEarned((prev) => {
        const newTotal = prev + points;
        localStorage.setItem("totalEarned", newTotal.toString());
        return newTotal;
      });
      return points;
    },
    []
  );

  const redeemPoints = useCallback((points) => {
    if (aelaPoints >= points) {
      setAelaPoints((prev) => {
        const newTotal = prev - points;
        // Update localStorage immediately
        localStorage.setItem("aelaPoints", newTotal.toString());
        return newTotal;
      });
      setTotalRedeemed((prev) => {
        const newTotal = prev + points;
        localStorage.setItem("totalRedeemed", newTotal.toString());
        return newTotal;
      });
      return true;
    }
    return false;
  }, [aelaPoints]);

  const refreshPoints = useCallback(() => {
    loadPointsFromBackend();
  }, [loadPointsFromBackend]);

  const value = {
    aelaPoints,
    totalEarned,
    totalRedeemed,
    addPoints,
    redeemPoints,
    refreshPoints,
    isLoadingPoints,
  };

  return (
    <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
  );
};

