import React from "react";
import SidebarComponent from "../../components/SidebarComponent";

// Define sidebar items for Educator navigation
const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/views/educator/dashboard",
    icon: "bi bi-house",
  },
  {
    id: "tracking",
    label: "Real-Time Monitoring",
    path: "/views/educator/tracking",
    icon: "bi bi-speedometer2",
  },
  {
    id: "postanalytics",
    label: "Post Class Analytics & Report",
    icon: "bi bi-kanban",
    subItems: [
      {
        label: "Statistics Dashboard",
        path: "/views/educator/postanalytics/statistics",
        icon: "bi bi-bar-chart-line",
      },
      {
        label: "Trend Data",
        path: "/views/educator/postanalytics/trend",
        icon: "bi bi-graph-up-arrow",
      },
      {
        label: "Generate Reports",
        path: "/views/educator/postanalytics/generatereport",
        icon: "bi bi-file-earmark-text",
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
        path: "/views/educator/settings/general",
        icon: "bi bi-sliders",
      },
      {
        label: "Account Settings",
        path: "/views/educator/settings/account",
        icon: "bi bi-person",
      },
    ],
  },
];

function EducatorNavigation({ onTabChange }) {
  return <SidebarComponent items={sidebarItems} onTabChange={onTabChange} />;
}

export default EducatorNavigation;
export { sidebarItems }; // Export for reuse if needed
