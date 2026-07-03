import React, { useState } from "react";
import { generateTrendReport } from "../../utils/generateTrendReportUtils";
import { toPng } from "html-to-image";
import { toast } from "react-toastify";

export interface ReportDropdownButtonProps {
  sessionID: string | number;
  chartData: any[];
  chartRef: React.RefObject<any>;
}

const ReportDropdownButtonComponent = ({ sessionID, chartData, chartRef }: ReportDropdownButtonProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleDownload = async (format) => {
    try {
      setIsCapturing(true);
      const chartElement =
        document.querySelector('[ref="chartRef"]') || chartRef.current;

      const imageBase64 = await toPng(chartElement);

      generateTrendReport(sessionID, chartData, format, imageBase64); // Send image to backend
      setShowDropdown(false);
    } catch (err) {
      console.error("Failed to generate chart image:", err);
      toast.error("Error capturing chart image.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div
      className="position-relative d-inline-block"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <button className="btn-modern-primary-sm d-flex align-items-center gap-2">
        <i className={isCapturing ? "bi bi-hourglass-split" : "bi bi-file-earmark-arrow-down-fill"}></i>
        <span>{isCapturing ? "Capturing..." : "Export Report"}</span>
        <i className="bi bi-chevron-down small opacity-50 ms-1"></i>
      </button>

      {showDropdown && (
        <div
          className="position-absolute top-100 start-0 pt-2"
          style={{ zIndex: 1050, minWidth: '180px' }}
        >
          <div className="modern-dropdown-menu p-2 shadow-lg border rounded-4 animate-slide-up-sm" style={{ background: 'var(--bs-body-bg)', borderColor: 'var(--bs-border-color-translucent)' }}>
            <button
              className="dropdown-item rounded-3 d-flex align-items-center gap-2 py-2"
              onClick={() => handleDownload("pdf")}
            >
              <i className="bi bi-file-earmark-pdf text-danger"></i>
              <span>Download PDF</span>
            </button>
            <button
              className="dropdown-item rounded-3 d-flex align-items-center gap-2 py-2"
              onClick={() => handleDownload("csv")}
            >
              <i className="bi bi-file-earmark-excel text-success"></i>
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .modern-dropdown-menu .dropdown-item {
            color: var(--bs-body-color);
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .modern-dropdown-menu .dropdown-item:hover {
            background: var(--bs-tertiary-bg);
            color: var(--bs-primary);
            transform: translateX(5px);
        }
        .animate-slide-up-sm {
            animation: slideUpSm 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUpSm {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .btn-modern-primary-sm {
            background: #6366f1;
            color: #fff;
            border: none;
            padding: 0.7rem 1.25rem;
            border-radius: 12px;
            font-weight: 800;
            font-size: 0.85rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
        }
        .btn-modern-primary-sm:hover {
            background: #4f46e5;
            transform: translateY(-2px);
            box-shadow: 0 15px 20px -5px rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
};

export default ReportDropdownButtonComponent;
