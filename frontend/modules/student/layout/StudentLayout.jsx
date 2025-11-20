import { useState } from "react";
import { Outlet } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import SidebarToggle from "../../../src/components/SidebarToggle";

const StudentLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SidebarToggle 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <div className="flex">
        <StudentSidebar isOpen={isSidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="pt-[120px] pl-[30px] pb-[20px] pr-[30px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;

