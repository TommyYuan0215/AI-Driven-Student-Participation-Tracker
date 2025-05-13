import React, { useState, useEffect } from "react";
import SidebarComponent from "./SidebarComponent";
import { Outlet } from "react-router-dom";

function NavContentLayout({ sidebarItems, showSidebar, toggleSidebar }) {
  const [activeTab, setActiveTab] = useState(sidebarItems[0]?.id || "");
  const [scrolledPastHeader, setScrolledPastHeader] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPastHeader(window.scrollY >= 75);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="nav-container">
      <div className="sidebar-section">
        {/* Sidebar with transition */}
        <div
          className={`sidebar-wrapper ${showSidebar ? "show" : "hide"}${scrolledPastHeader ? " scrolled" : ""}`}
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
        <Outlet />
      </div>
    </div>
  );
}

export default NavContentLayout;
