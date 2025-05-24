import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import NavContentLayout from "../../components/layout/NavContentLayout";
import AdminNavigation, { sidebarItems } from "./AdminNavigation";

function AdminPage({ showSidebar, toggleSidebar }) {
  // State to manage the active tab
  const [activeTab, setActiveTab] = useState(
    sidebarItems[0]?.id || "dashboard"
  );

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <NavContentLayout
      sidebarItems={sidebarItems}
      showSidebar={showSidebar}
      toggleSidebar={toggleSidebar}
      mainContentItems={[]}
    >
      {/* Admin navigation will be rendered here */}
      <AdminNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Render child routes based on active tab */}
      <div className="col">
        <Outlet />
      </div>
    </NavContentLayout>
  );
}

export default AdminPage;
