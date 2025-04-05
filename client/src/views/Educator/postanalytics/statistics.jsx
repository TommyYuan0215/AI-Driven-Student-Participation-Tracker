import React from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import { useNavigate } from "react-router-dom";
import useSession from "../../../utils/sessionUtils";
import StatisticsDashboard from "../../../components/dashboard/StatisticsDashboardComponent";

function EducatorStatistics() {
  const navigate = useNavigate();
  const { userData } = useSession(navigate);
  const navigateToDetails = (sessionID) => {
    navigate(`trend`, { state: { sessionID } });
  };

  return (
    <>
      <PageTitleBreadcrumb
        title="Statistics Dashboard"
        path={location.pathname}
      />

      <StatisticsDashboard
        userData={userData}
        navigateToDetails={navigateToDetails}
      />
    </>
  );
}

export default EducatorStatistics;
