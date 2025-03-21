import React, { useState } from "react";
import SidebarComponent from "./SidebarComponent";
import { Outlet } from "react-router-dom";
import { Button } from "react-bootstrap";

function NavContentLayout({ sidebarItems }) {
  const [activeTab, setActiveTab] = useState(sidebarItems[0]?.id || "");
  const [showSidebar, setShowSidebar] = useState(true);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="nav-container">
      {/* Sidebar with transition */}
      <div className={`sidebar-wrapper ${showSidebar ? "show" : "hide"}`}>
        <SidebarComponent
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Toggle Button */}
      <Button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        variant="light"
        size="sm"
      >
        <i className={`bi bi-chevron-${showSidebar ? "left" : "right"}`}></i>
      </Button>

      {/* Main Content with transition */}
      <div className={`content-wrapper ${showSidebar ? "" : "expanded"}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default NavContentLayout;
