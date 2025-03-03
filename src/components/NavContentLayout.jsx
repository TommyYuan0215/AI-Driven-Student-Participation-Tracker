import React, { useState } from "react";
import SidebarComponent from "./SidebarComponent";
import { Outlet } from "react-router-dom";

function NavContentLayout({ sidebarItems }) {
    const [activeTab, setActiveTab] = useState(sidebarItems[0]?.id || "");
    const [showSidebar, setShowSidebar] = useState(false);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
      };

    return (
        <div className="container-fluid" style={{ height: "100vh" }}>
            <div className="row h-100">
                <div className={`col-12 col-md-2 p-0 ms-auto card ${showSidebar ? "d-block" : "d-none d-md-block"}`}>
                <SidebarComponent
                    items={sidebarItems}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
                </div>
                <div className={`col-12 col-md-10 p-0 m-0 ${showSidebar ? "col-md-12" : "col-md-10"}`}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default NavContentLayout;
