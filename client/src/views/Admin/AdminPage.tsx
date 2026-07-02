import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import NavContentLayout from "../../components/layout/NavContentLayout";
import AdminNavigation, { sidebarItems } from "./AdminNavigation";

export interface AdminPageProps {
  showSidebar: boolean;
  toggleSidebar: () => void;
}

function AdminPage({ showSidebar, toggleSidebar }: AdminPageProps) {
  // State to manage the active tab
  const [activeTab, setActiveTab] = useState(
    sidebarItems[0]?.id || "dashboard"
  );

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <NavContentLayout
      sidebarItems={sidebarItems}
      showSidebar={showSidebar}
      toggleSidebar={toggleSidebar}
      mainContentItems={[]}
    >

      {/* Render child routes based on active tab */}
      <div className="col">
        <Outlet />
      </div>
    </NavContentLayout>
  );
}

export default AdminPage;
