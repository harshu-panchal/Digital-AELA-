import { HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2";
import { motion } from "framer-motion";

const SidebarToggle = ({ isOpen, onToggle }) => {
  return (
    <motion.button
      onClick={onToggle}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] rounded-full bg-[#0B0F1E]/95 border border-white/20 backdrop-blur-xl p-3 text-white hover:bg-[#F5D26A]/20 hover:border-[#F5D26A]/40 transition-all duration-300 shadow-lg hover:shadow-[#F5D26A]/20"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? (
        <HiOutlineXMark className="w-5 h-5" />
      ) : (
        <HiOutlineBars3 className="w-5 h-5" />
      )}
    </motion.button>
  );
};

export default SidebarToggle;

