import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <div className="flex">
        <AdminSidebar />
        <main className="ml-64 flex-1">
          <div className="pt-[100px] pl-[40px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
