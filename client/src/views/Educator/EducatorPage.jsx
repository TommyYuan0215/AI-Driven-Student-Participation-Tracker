import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import NavContentLayout from "../../components/NavContentLayout";
import EducationNavigation, { sidebarItems } from "./EducatorNavigation";

function EducatorPage() {
  // State to manage the active tab
  const [activeTab, setActiveTab] = useState(
    sidebarItems[0]?.id || "dashboard"
  );

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <NavContentLayout sidebarItems={sidebarItems} mainContentItems={[]}>
      {/* Admin navigation will be rendered here */}
      <EducationNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Render child routes based on active tab */}
      <div className="col">
        <Outlet />
      </div>
    </NavContentLayout>
  );
}

export default EducatorPage;
