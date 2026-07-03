import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import TrendAnalysisPageComponent from "../../../components/dashboard/TrendAnalysisPageComponent";
import { generateTrendReport } from "../../../utils/generateTrendReportUtils";
import { Button } from "react-bootstrap";

function AdminDataTrending() {
  const location = useLocation();
  const sessionID = location.state?.sessionID || "";
  const [isGenerating, setIsGenerating] = useState(false);
  const chartRef = useRef(null);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      const trendData = document.querySelector('[data-trend-data]')?.getAttribute('data-trend-data');
      if (trendData) {
        const parsedData = JSON.parse(trendData);
        await generateTrendReport(sessionID, parsedData, chartRef, "pdf");
      } else {
        console.error("Could not find trend data");
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="py-2 fade-in">
      <PageTitleBreadcrumb
        title="Trend Data Analysis"
        path={location.pathname}
        isAddNew={true}
        btnTitle={isGenerating ? "Generating..." : "Generate PDF Report"}
        btnIcon={isGenerating ? "bi-hourglass-split" : "bi-file-earmark-pdf"}
        onclickToggle={handleGenerateReport}
        disabled={isGenerating}
      />

      <TrendAnalysisPageComponent sessionID={sessionID} showBackButton={true} ref={chartRef} />
    </div>
  );
}

export default AdminDataTrending;
