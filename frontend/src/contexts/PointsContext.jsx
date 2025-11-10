/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const PointsContext = createContext();

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return context;
};

export const PointsProvider = ({ children }) => {
  const [aelaPoints, setAelaPoints] = useState(() => {
    // Get points from localStorage or default to 0
    const savedPoints = localStorage.getItem("aelaPoints");
    return savedPoints ? parseInt(savedPoints, 10) : 0;
  });

  const [totalEarned, setTotalEarned] = useState(() => {
    const saved = localStorage.getItem("totalEarned");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [totalRedeemed, setTotalRedeemed] = useState(() => {
    const saved = localStorage.getItem("totalRedeemed");
    return saved ? parseInt(saved, 10) : 0;
  });

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

  const addPoints = (points, _REASON = "") => {
    void _REASON;
    setAelaPoints((prev) => prev + points);
    setTotalEarned((prev) => prev + points);
    return points;
  };

  const redeemPoints = (points) => {
    if (aelaPoints >= points) {
      setAelaPoints((prev) => prev - points);
      setTotalRedeemed((prev) => prev + points);
      return true;
    }
    return false;
  };

  const value = {
    aelaPoints,
    totalEarned,
    totalRedeemed,
    addPoints,
    redeemPoints,
  };

  return (
    <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
  );
};

