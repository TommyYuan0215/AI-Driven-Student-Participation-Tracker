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
    <div className="m-4 card px-3">
      {chartData.length === 0 ? (
        <LoadingSpinner text="Loading trend data..." />
      ) : (
        <>
          <section
            className="px-3 py-2 d-flex align-items-center"
            style={{ position: "relative" }}
            data-trend-data={JSON.stringify(chartData)}
          >
            {showBackButton && (
              <div
                className="back-button"
                onClick={() => navigate(-1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  position: "absolute",
                  top: "0.1rem",
                  left: "1rem",
                  cursor: "pointer",
                }}
              >
                <i className="bi bi-arrow-left"></i>
                <span>Back</span>
              </div>
            )}
            <h5 style={{ width: "100%", textAlign: "center", margin: "4px" }}>
              {headerTitle || `Session ID: ${sessionID}`}
            </h5>
          </section>

          {/* Line Chart - Shows ALL data regardless of pagination */}
          <section className="px-3 py-4" ref={chartRef}>
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 2" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Timestamp (Emotions Save Frequency)",
                    position: "bottom",
                    offset: -10,
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Emotion Count",
                    angle: -90,
                    position: "left",
                    offset: -20,
                  }}
                />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="Interested"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Bored"
                  stroke="#ff7300"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="LackingFocus"
                  stroke="#ff0000"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          {/* Data Table with pagination */}
          <section className="px-3 py-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, chartData.length)} of {chartData.length} entries
                </div>
                <div className="d-flex align-items-center">
                  <span className="me-2">Items per page:</span>
                  <select 
                    className="form-select form-select-sm" 
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when changing items per page
                    }}
                    style={{ width: "70px" }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            
            <Table striped bordered hover responsive>
              <thead>
                <tr className="text-center">
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>Interested</th>
                  <th>Bored</th>
                  <th>Lacking Focus</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((entry, index) => (
                  <tr key={index}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                    <td>{entry.Interested}</td>
                    <td>{entry.Bored}</td>
                    <td>{entry.LackingFocus}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {totalPages > 1 && (
              <Pagination className="d-flex justify-content-end">
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                />
                {currentPage > 3 && <Pagination.Ellipsis disabled />}
                {Array.from({
                  length: Math.ceil(chartData.length / itemsPerPage),
                })
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(
                      currentPage + 2,
                      Math.ceil(chartData.length / itemsPerPage)
                    )
                  )
                  .map((_, pageIndex) => (
                    <Pagination.Item
                      key={pageIndex + Math.max(1, currentPage - 2)}
                      active={Math.max(1, currentPage - 2) + pageIndex === currentPage}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 2) + pageIndex)}
                    >
                      {Math.max(1, currentPage - 2) + pageIndex}
                    </Pagination.Item>
                  ))}
                {currentPage <
                  Math.ceil(chartData.length / itemsPerPage) - 2 && (
                  <Pagination.Ellipsis disabled />
                )}
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
                <Pagination.Last
                  onClick={() =>
                    setCurrentPage(
                      Math.ceil(chartData.length / itemsPerPage)
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(chartData.length / itemsPerPage)
                  }
                />
              </Pagination>
            )}
          </section>
        </>
      )}
    </div>
  );
});

export default TrendAnalysisPageComponent;