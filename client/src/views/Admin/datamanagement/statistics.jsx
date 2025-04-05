import React from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import { useNavigate } from "react-router-dom";
import StatisticsDashboard from "../../../components/dashboard/StatisticsDashboardComponent";
import useSession from "../../../utils/sessionUtils";

function StatisticsAdmin() {
  const navigate = useNavigate();
  const navigateToDetails = (sessionID) => {
    navigate(`trend`, { state: { sessionID } });
  };

  return (
    <>
      <PageTitleBreadcrumb
        title="Overall Statistics Data"
        path={location.pathname}
      />
      <StatisticsDashboard
        isAdmin={true}
        navigateToDetails={navigateToDetails}
      />
    </>
  );
}

export default StatisticsAdmin;
