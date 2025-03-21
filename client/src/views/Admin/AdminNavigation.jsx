import React from "react";
import SidebarComponent from "../../components/SidebarComponent";

// Define sidebar items for Admin navigation
const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/views/admin/dashboard",
    icon: "bi bi-house",
  },
  {
    id: "usermanagement",
    label: "User Account Management",
    path: "/views/admin/usermanagement",
    icon: "bi bi-people",
  },
  {
    id: "contentmanagement",
    label: "Content Management",
    path: "/views/admin/contentmanagement",
    icon: "bi bi-images",
  },
  {
    id: "datamanagement",
    label: "View Data",
    icon: "bi bi-database",
    subItems: [
      {
        label: "Overall Statistics Data",
        path: "/views/admin/datamanagement/statistics",
        icon: "bi bi-bar-chart-line",
      },
      {
        label: "Trend Analysis",
        path: "/views/admin/datamanagement/2",
        icon: "bi bi-graph-up-arrow",
      },
    ],
  },

  {
    id: "settings",
    label: "Settings",
    icon: "bi bi-gear",
    subItems: [
      {
        label: "General Settings",
        path: "/views/admin/settings/general",
        icon: "bi bi-sliders",
      },
      {
        label: "Account Settings",
        path: "/views/admin/settings/account",
        icon: "bi bi-person",
      },
    ],
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
