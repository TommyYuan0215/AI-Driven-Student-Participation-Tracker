import React from "react";
import SidebarComponent from "../../components/layout/SidebarComponent";

// Define sidebar items for Admin navigation
const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: "bi bi-house",
  },
  {
    id: "usermanagement",
    label: "User Account Management",
    path: "/admin/usermanagement",
    icon: "bi bi-people",
  },
  {
    id: "contentmanagement",
    label: "Content Management",
    path: "/admin/contentmanagement",
    icon: "bi bi-file-earmark-text",
    subItems: [
      {
        label: "Slideshow Management",
        path: "/admin/contentmanagement/slideshow",
        icon: "bi bi-images",
      },
      {
        label: "Announcement Management",
        path: "/admin/contentmanagement/announcement",
        icon: "bi bi-megaphone",
      },
    ],
  },
  {
    id: "datamanagement",
    label: "Data Management (Viewer)",
    icon: "bi bi-database",
    subItems: [
      {
        label: "Overall Statistics Data",
        path: "/admin/datamanagement/statisticsadmin",
        icon: "bi bi-bar-chart-line",
        subItems: [
          {
            label: "Trend Data Analysis",
            path: "/admin/datamanagement/statisticsadmin/datatrend",
            icon: "bi bi-graph-up-arrow",
          },
        ],
      },
      {
        label: "User Growth Trend",
        path: "/admin/datamanagement/usertrend",
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
        path: "/admin/settings/general",
        icon: "bi bi-sliders",
      },
      {
        label: "Account Settings",
        path: "/admin/settings/account",
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
