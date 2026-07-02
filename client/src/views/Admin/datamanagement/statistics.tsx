import React from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import { useNavigate, useLocation } from "react-router-dom";
import StatisticsDashboard from "../../../components/dashboard/StatisticsDashboardComponent";

function AdminStatistics() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateToDetails = (sessionID) => {
    navigate(`datatrend`, { state: { sessionID } });
  };

  return (
    <div className="py-2 fade-in">
      <PageTitleBreadcrumb
        title="Statistics Dashboard"
        path={location.pathname}
      />
      <StatisticsDashboard
        isAdmin={true}
        navigateToDetails={navigateToDetails}
      />
    </div>
  );
}

export default AdminStatistics;
