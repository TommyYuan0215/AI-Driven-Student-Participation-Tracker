import React from "react";
import SidebarComponent from "../../components/SidebarComponent";

// Define sidebar items for Admin navigation
const sidebarItems = [
    { id: "dashboard", label: "Dashboard", path: "/views/admin/dashboard" },
    { id: "usermanagement", label: "User Account Management", path: "/views/admin/usermanagement" },
    { id: "datamanagement", label: "View Data", 
        subItems: [
            { label: "Overall Statistics Data", path: "/views/admin/statistic/1" },
            { label: "Trend Analysis", path: "/views/admin/statistic/2" }
        ] 
    },
    { id: "settings", label: "Settings",
        subItems: [
            { label: "General Settings", path: "/views/admin/settings/general" },
            { label: "Account Settings", path: "/views/admin/settings/account" }
        ]
    },
];

function AdminNavigation({ activeTab, onTabChange }) {
    return (
        <SidebarComponent
            items={sidebarItems}
            activeTab={activeTab}
            onTabChange={onTabChange}
        />
    );
}

export default AdminNavigation;
export { sidebarItems }; // Export for reuse if needed
