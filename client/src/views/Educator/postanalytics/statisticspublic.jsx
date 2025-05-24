import React from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import { useNavigate } from "react-router-dom";
import useSession from "../../../hooks/useSession";
import StatisticsDashboard from "../../../components/dashboard/StatisticsDashboardComponent";

function EducatorPublicStatistics() {
  const navigate = useNavigate();
  const { userData } = useSession(navigate);
  const navigateToDetails = (sessionID) => {
    navigate(`datatrend`, { state: { sessionID } });
  };

  return (
    <>
      <PageTitleBreadcrumb
        title="Statistics Dashboard (Public)"
        path={location.pathname}
      />

      <StatisticsDashboard
        userData={userData}
        isPublic={true}
        navigateToDetails={navigateToDetails}
      />
    </>
  );
}

export default EducatorPublicStatistics;
