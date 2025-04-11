import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { generateTrendReport } from "../../utils/generateTrendReportUtils";
import { toPng } from "html-to-image";
import { toast } from "react-toastify";

const ReportDropdownButtonComponent = ({ sessionID, chartData, chartRef }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleDownload = async (format) => {
    try {
      const chartElement =
        document.querySelector('[ref="chartRef"]') || chartRef.current;

      const imageBase64 = await toPng(chartElement);

      generateTrendReport(sessionID, chartData, format, imageBase64); // Send image to backend
      setShowDropdown(false);
    } catch (err) {
      console.error("Failed to generate chart image:", err);
      toast.error("Error capturing chart image.");
    }
  };

  return (
    <div
      className="position-relative d-inline-block"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <Button variant="primary" className="btn d-flex align-items-center">
        <i className="bi bi-file-earmark-text me-2"></i> Generate Report
      </Button>
      {showDropdown && (
        <div
          className={`dropdown-menu transition-dropdown show`}
          style={{ position: "absolute", top: "100%", left: 0, zIndex: 1000 }}
        >
          <button
            className="dropdown-item"
            onClick={() => handleDownload("pdf")}
          >
            Download PDF
          </button>
          <button
            className="dropdown-item"
            onClick={() => handleDownload("csv")}
          >
            Download CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportDropdownButtonComponent;
