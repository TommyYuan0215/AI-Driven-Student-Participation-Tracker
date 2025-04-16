import React from "react";
import { useLocation } from "react-router-dom";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import TrendAnalysisPageComponent from "../../../components/dashboard/TrendAnalysisPageComponent";

function EducatorDataTrending() {
  const location = useLocation();
  const sessionID = location.state?.sessionID || "";

  return (
    <>
      <PageTitleBreadcrumb
        title="Trend Data Analysis"
        path={location.pathname}
        isAddNew={true}
        btnTitle="Generate Report"
        btnIcon="bi-file-earmark-text"
      />

      <TrendAnalysisPageComponent sessionID={sessionID} showBackButton={true} />
    </>
  );
}

export default EducatorDataTrending;
