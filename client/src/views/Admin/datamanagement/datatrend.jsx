import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import TrendAnalysisPageComponent from "../../../components/dashboard/TrendAnalysisPageComponent";
import { generateTrendReport } from "../../../utils/generateTrendReportUtils";
import { Modal, Button, Form } from "react-bootstrap";

function AdminDataTrending() {
  const location = useLocation();
  const sessionID = location.state?.sessionID || "";
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const chartRef = useRef(null);

  const handleGenerateReport = () => {
    setShowFormatModal(true);
  };

  const handleFormatSubmit = () => {
    const trendData = document.querySelector('[data-trend-data]')?.getAttribute('data-trend-data');
    if (trendData) {
      const parsedData = JSON.parse(trendData);
      generateTrendReport(sessionID, parsedData, chartRef, selectedFormat);
      setShowFormatModal(false);
    } else {
      console.error("Could not find trend data");
    }
  };

  return (
    <>
      <PageTitleBreadcrumb
        title="Trend Data Analysis"
        path={location.pathname}
        isAddNew={true}
        btnTitle="Generate Report"
        btnIcon="bi-file-earmark-text"
        onclickToggle={handleGenerateReport}
      />

      <TrendAnalysisPageComponent sessionID={sessionID} showBackButton={true} ref={chartRef} />

      {/* Format Selection Modal */}
      <Modal show={showFormatModal} onHide={() => setShowFormatModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Report Format</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Choose Report Format:</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  label="PDF Document"
                  name="format"
                  value="pdf"
                  checked={selectedFormat === "pdf"}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  label="CSV Spreadsheet"
                  name="format"
                  value="csv"
                  checked={selectedFormat === "csv"}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                />
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFormatModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleFormatSubmit}>
            Generate Report
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default AdminDataTrending;
