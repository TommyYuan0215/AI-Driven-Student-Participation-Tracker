import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavContentLayout from "../../components/layout/NavContentLayout";
import ContentLayout from "../../components/layout/ContentLayout";
import EducationNavigation, { sidebarItems } from "./EducatorNavigation";

export interface EducatorPageProps {
  showSidebar: boolean;
  toggleSidebar: () => void;
}

function EducatorPage({ showSidebar, toggleSidebar }: EducatorPageProps) {
  // State to manage the active tab
  const [activeTab, setActiveTab] = useState(
    sidebarItems[0]?.id || "dashboard"
  );

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Check condition, if is realtimemonitoring.jsx, change layout
  const location = useLocation();
  const isTrackingPage = location.pathname.startsWith(
    "/educator/tracking"
  );

  return isTrackingPage ? (
    <ContentLayout>
      {/* Render child routes */}
      <div className="col">
        <Outlet />
      </div>
    </ContentLayout>
  ) : (
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

export default EducatorPage;
