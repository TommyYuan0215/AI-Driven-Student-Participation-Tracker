// src/components/customized/TrendAnalysisComponent.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
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

function TrendAnalysisPageComponent({
  sessionID,
  showBackButton = false,
  headerTitle = "",
}) {
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef();
  const navigate = useNavigate();

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

  return (
    <div className="m-4 card px-3">
      {chartData.length === 0 ? (
        <LoadingSpinner text="Loading trend data..." />
      ) : (
        <>
          <section
            className="px-3 py-2 d-flex align-items-center"
            style={{ position: "relative" }}
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

          {/* Line Chart */}
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

          {/* Data Table */}
          <section className="px-3 py-4">
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
                {chartData.map((entry, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                    <td>{entry.Interested}</td>
                    <td>{entry.Bored}</td>
                    <td>{entry.LackingFocus}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        </>
      )}
    </div>
  );
}

export default TrendAnalysisPageComponent;
