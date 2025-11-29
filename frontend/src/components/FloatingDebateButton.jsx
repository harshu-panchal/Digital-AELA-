import { useState } from "react";
import { useNavigate } from "react-router-dom";
import microphoneIcon from "../assets/microphone.png";
import TranslatedText from "./TranslatedText";

const FloatingDebateButton = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate("/learn-earn/live-debate-room");
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-10 right-6 z-50 flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 sm:bottom-12 sm:right-3"
      aria-label="Live Debate Room">
      {/* Label that appears on hover */}
      <div
        className={`absolute right-full mr-3 whitespace-nowrap rounded-lg bg-black/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-300 ${
          isHovered
            ? "translate-x-0 opacity-100"
            : "translate-x-4 opacity-0 pointer-events-none"
        }`}>
        <TranslatedText>Live Debate Room</TranslatedText>
      </div>

      {/* Microphone Icon Button */}
      <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E5C158] shadow-lg shadow-[#D4AF37]/40 transition-all duration-300 hover:shadow-[#D4AF37]/60 overflow-hidden animate-float">
        <img
          src={microphoneIcon}
          alt="Microphone"
          className="h-full w-full object-cover"
        />
      </div>
    </button>
  );
};

export default FloatingDebateButton;
