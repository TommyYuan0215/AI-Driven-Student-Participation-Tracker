import React, { useState, useEffect } from "react";
import SidebarComponent from "./SidebarComponent";
import { Outlet } from "react-router-dom";

export interface NavContentLayoutProps {
  sidebarItems: any[];
  showSidebar: boolean;
  toggleSidebar: () => void;
  children?: React.ReactNode;
  mainContentItems?: any[];
}

function NavContentLayout({ sidebarItems, showSidebar, toggleSidebar, children }: NavContentLayoutProps) {
  const [activeTab, setActiveTab] = useState(sidebarItems[0]?.id || "");

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="nav-container">
      <div className="sidebar-section">
        {/* Sidebar with transition - Simplified sticking logic */}
        <div
          className={`sidebar-wrapper ${showSidebar ? "show" : "hide"}`}
        >
          <SidebarComponent
            items={sidebarItems}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>
      {/* Main Content with transition */}
      <div className={`content-wrapper ${showSidebar ? "" : "expanded"}`}>
        {children}
      </div>
    </div>
  );
}

export default NavContentLayout;
