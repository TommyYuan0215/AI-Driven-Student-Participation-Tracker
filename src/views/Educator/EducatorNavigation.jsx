import React from "react";
import SidebarComponent from "../../components/SidebarComponent";

// Define sidebar items for Educator navigation
const sidebarItems = [
    { id: "realtime", label: "Real-Time Monitoring Dashboard", path: "/views/educator/dashboard" },
    { id: "history", label: "Post Class Analytics & Report",
        subItems: [
            { label: "Overall Statistics Data", path: "/views/educator/overallstatistics" },
            { label: "Trend Data", path: "/views/educator/trend" },
            { label: "Generate Reports", path: "/views/educator/generatereport" }
        ]
     },
    { id: "settings", label: "Settings",
        subItems: [
            { label: "General Settings", path: "/views/educator/settings/general" },
            { label: "Account Settings", path: "/views/educator/settings/account" }
        ]
    },
];

function EducatorNavigation({ onTabChange }) {
    return (
        <SidebarComponent
            items={sidebarItems}
            onTabChange={onTabChange}
        />
    );
}

export default EducatorNavigation;
export { sidebarItems }; // Export for reuse if needed