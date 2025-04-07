import React from "react";
import SidebarComponent from "../../components/layout/SidebarComponent";

// Define sidebar items for Educator navigation
const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/views/educator/dashboard",
    icon: "bi bi-house",
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
        subItems: [
          {
            label: "Trend Data Analysis",
            path: "/views/educator/postanalytics/statistics/trend",
            icon: "bi bi-graph-up-arrow",
          },
        ],
      },
      {
        label: "Statistics Dashboard (Public)",
        path: "/views/educator/postanalytics/statisticspublic",
        icon: "bi bi-bar-chart-line",
        subItems: [
          {
            label: "Trend Data Analysis",
            path: "/views/educator/postanalytics/statisticspublic/trend",
            icon: "bi bi-graph-up-arrow",
          },
        ],
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
