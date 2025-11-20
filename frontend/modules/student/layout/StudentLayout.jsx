import { Outlet } from "react-router-dom";
import { useSidebar } from "../../../src/contexts/SidebarContext";
import StudentSidebar from "../components/StudentSidebar";

const StudentLayout = () => {
  const { isSidebarOpen, closeSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <div className="flex">
        <StudentSidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
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

export default StudentLayout;

