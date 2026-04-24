import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminHeader } from "../components/AdminHeader";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <div className="flex min-h-screen">
        <div className={sidebarOpen ? "fixed inset-0 z-30 bg-black/40 md:hidden" : "hidden"} onClick={() => setSidebarOpen(false)} />
        <div className={`z-40 ${sidebarOpen ? "fixed inset-y-0 left-0 h-screen" : "hidden md:sticky md:top-0 md:h-screen md:block"}`}>
          <AdminSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
