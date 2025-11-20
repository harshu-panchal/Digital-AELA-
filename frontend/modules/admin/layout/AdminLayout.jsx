import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import AdminSidebar from "../components/AdminSidebar";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-lg bg-[#0B0F1E]/95 border border-white/10 backdrop-blur-xl text-white hover:bg-white/10 transition"
        aria-label="Open sidebar">
        <FaBars className="h-5 w-5" />
      </button>

      <div className="flex">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="md:ml-64 flex-1">
          <div className="pt-[120px] md:pt-[120px] pt-20 md:pl-[30px] pl-4 pb-[20px] pr-[30px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
