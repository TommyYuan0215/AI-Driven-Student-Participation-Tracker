import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavContentLayout from "../../components/layout/NavContentLayout";
import ContentLayout from "../../components/layout/ContentLayout";
import EducationNavigation, { sidebarItems } from "./EducatorNavigation";

function EducatorPage() {
  // State to manage the active tab
  const [activeTab, setActiveTab] = useState(
    sidebarItems[0]?.id || "dashboard"
  );

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Check condition, if is realtimemonitoring.jsx, change layout
  const location = useLocation();
  const isTrackingPage = location.pathname.startsWith(
    "/views/educator/tracking"
  );

  return isTrackingPage ? (
    <ContentLayout>
      {/* Render child routes */}
      <div className="col">
        <Outlet />
      </div>
    </ContentLayout>
  ) : (
    <NavContentLayout sidebarItems={sidebarItems} mainContentItems={[]}>
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
