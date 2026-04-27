// src/components/customized/TrendAnalysisComponent.jsx

import React, { useEffect, useState, useRef, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Pagination, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "../../utils/axiosUtils";
import LoadingSpinner from "../common/LoadingSpinnerComponent";

const TrendAnalysisPageComponent = forwardRef(({
  sessionID,
  showBackButton = false,
  headerTitle = "",
}, ref) => {
  const [chartData, setChartData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const chartRef = useRef();
  const navigate = useNavigate();

  // Forward the ref to the chart section
  React.useImperativeHandle(ref, () => ({
    current: chartRef.current,
    props: {
      data: chartData
    }
  }));

  useEffect(() => {
    if (sessionID) {
      axios
        .get("/tracking_session/get_tracking_emotion", {
          params: { sessionID },
        })
        .then((response) => {
          const processedData = response.data.map((entry) => ({
            timestamp: entry.timestamp,
            Interested: entry.interestedCount,
            Bored: entry.boredCount,
            LackingFocus: entry.lackingFocusCount,
          }));
          setChartData(processedData);
        })
        .catch((error) => {
          console.error("Error fetching trend data:", error);
          toast.error("Failed to load trend data");
        });
    }
  }, [sessionID]);

  // Calculate pagination variables
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = chartData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(chartData.length / itemsPerPage);

  return (
    <div className="container-fluid py-4 px-4">
      {chartData.length === 0 ? (
        <LoadingSpinner text="Analyzing class emotional data..." />
      ) : (
        <div className="d-flex flex-column gap-4">
          {/* Header & Controls */}
          <div className="card border-0 rounded-4 overflow-hidden elevation-card" style={{
            background: 'var(--bs-body-bg)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid var(--bs-border-color-translucent)'
          }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                {showBackButton && (
                  <button
                    className="btn btn-light rounded-circle p-2 me-3 d-flex align-items-center justify-content-center shadow-sm elevation-button"
                    onClick={() => navigate(-1)}
                    style={{ width: '40px', height: '40px', background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)' }}
                  >
                    <i className="bi bi-arrow-left text-primary"></i>
                  </button>
                )}
                <div>
                  <h5 className="mb-0 fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>
                    {headerTitle || `Session Report #${sessionID}`}
                  </h5>
                  <div className="small text-muted fw-medium">Detailed Emotional Trajectory Analysis</div>
                </div>
              </div>
              <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold shadow-sm" style={{ fontSize: '0.7rem', border: '1px solid rgba(13, 110, 253, 0.2)' }}>
                SESSION COMPLETE
              </div>
            </div>
          </div>

          {/* Immersive Line Chart Section */}
          <div className="card border-0 rounded-4 overflow-hidden shadow-lg mb-2" style={{
            background: 'var(--bs-body-bg)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            border: '1px solid var(--bs-border-color-translucent)'
          }}>
            <div className="card-header bg-transparent border-0 pt-4 px-4">
              <h6 className="mb-0 fw-bold text-uppercase opacity-50" style={{ fontSize: '0.65rem', letterSpacing: '1.5px' }}>Engagement Over Time</h6>
            </div>
            <div className="card-body p-4" ref={chartRef} data-trend-data={JSON.stringify(chartData)}>
              <div style={{ height: '500px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bs-border-color-translucent)" />
                    <XAxis
                      dataKey="timestamp"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                      tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }}
                      domain={[0, 'dataMax + 5']}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bs-body-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--bs-border-color)',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
                        padding: '12px'
                      }}
                      labelStyle={{ color: 'var(--bs-emphasis-color)', fontWeight: 'bold', marginBottom: '8px' }}
                      labelFormatter={(value) => `Time: ${new Date(value).toLocaleTimeString()}`}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      height={50}
                    />
                    <Line
                      type="monotone"
                      dataKey="Interested"
                      stroke="#10b981"
                      strokeWidth={4}
                      dot={false}
                      activeDot={{ r: 8, strokeWidth: 0, shadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Bored"
                      stroke="#f59e0b"
                      strokeWidth={4}
                      dot={false}
                      activeDot={{ r: 8, strokeWidth: 0, shadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="LackingFocus"
                      stroke="#f43f5e"
                      strokeWidth={4}
                      dot={false}
                      activeDot={{ r: 8, strokeWidth: 0, shadow: '0 0 10px rgba(244, 63, 94, 0.5)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Raw Data Table Section */}
          <div className="card border-0 rounded-4 overflow-hidden" style={{
            background: 'var(--bs-body-bg)',
            boxShadow: '0 15px 35px -10px rgba(0,0,0,0.1)',
            border: '1px solid var(--bs-border-color-translucent)'
          }}>
            <div className="card-header bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-0 fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>Captured Data Points</h6>
                <p className="text-muted small mb-0">High-resolution tracking metrics</p>
              </div>
              <select
                className="form-select form-select-sm rounded-pill px-3"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ width: "80px", background: 'var(--bs-tertiary-bg)' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0 custom-analytics-table">
                  <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
                    <tr>
                      <th className="ps-4 py-3 text-muted fw-bold small text-uppercase">Point #</th>
                      <th className="py-3 text-muted fw-bold small text-uppercase">Capture Time</th>
                      <th className="py-3 text-muted fw-bold small text-uppercase text-center">Interested</th>
                      <th className="py-3 text-muted fw-bold small text-uppercase text-center">Bored</th>
                      <th className="py-3 text-muted fw-bold small text-uppercase text-center">Lacking Focus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((entry, index) => (
                      <tr key={index} className="border-bottom" style={{ borderColor: 'var(--bs-border-color-translucent)' }}>
                        <td className="ps-4 fw-medium text-muted">{indexOfFirstItem + index + 1}</td>
                        <td className="fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                        <td className="text-center">
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">{entry.Interested}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3">{entry.Bored}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3">{entry.LackingFocus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            <div className="card-footer bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
              <div className="text-muted small fw-medium">
                Data Point {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, chartData.length)} of {chartData.length} total
              </div>

              <Pagination className="mb-0 custom-analytics-pagination">
                <Pagination.Prev
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
                <Pagination.Next
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(chartData.length / itemsPerPage)
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(chartData.length / itemsPerPage)
                  }
                />
              </Pagination>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-analytics-table tbody tr:hover {
            background-color: var(--bs-tertiary-bg) !important;
        }
        .custom-analytics-pagination .page-link {
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 5px;
            background: var(--bs-tertiary-bg);
            color: var(--bs-primary);
        }
        .custom-analytics-pagination .active .page-link {
            background: var(--bs-primary);
            color: #fff;
        }
      `}</style>
    </div>
  );
});

export default TrendAnalysisPageComponent;