import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Table, Button } from "react-bootstrap";
import LoadingSpinner from "../../../components/common/LoadingSpinnerComponent";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import { toast } from "react-toastify";
import ReportDropdownButton from "../../../components/customized/ReportDropdownButtonComponent";
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
import axios from "../../../utils/axiosUtils";

function EducatorTrending() {
  const location = useLocation();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef();

  // Directly get sessionID from location state
  const sessionID = location.state?.sessionID || "";

  // Fetch trend data when sessionID is available
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
          console.error("Error fetching tracking emotion data:", error);
          toast.error("Failed to load trend data");
        });
    }
  }, [sessionID]);

  return (
    <>
      <PageTitleBreadcrumb
        title="Trend Data Analysis"
        path={location.pathname}
        isAddNew={true}
        btnTitle="Generate Report"
        btnIcon="bi-file-earmark-text"
        customButton={
          <ReportDropdownButton
            sessionID={sessionID}
            chartData={chartData}
            chartRef={chartRef}
          />
        }
      />

      <div className="m-4 card px-3">
        {chartData.length === 0 ? (
          <LoadingSpinner text="Loading trend data..." />
        ) : (
          <>
            {/* Display Session ID and Back Button */}
            <section
              className="px-3 py-2 d-flex align-items-center"
              style={{ position: "relative" }}
            >
              <div
                className="back-button"
                onClick={() => navigate(-1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  position: "absolute",
                  top: "0.1rem",
                  left: "1rem",
                }}
              >
                <i className="bi bi-arrow-left"></i>
                <span>Back</span>
              </div>
              <h5 style={{ width: "100%", textAlign: "center", margin: "4px" }}>
                Session ID: {sessionID}
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
                    <th style={{ width: "50px" }}>#</th>
                    <th style={{ width: "25%" }}>Timestamp</th>
                    <th style={{ width: "25%" }}>Interested</th>
                    <th style={{ width: "25%" }}>Bored</th>
                    <th style={{ width: "25%" }}>Lacking Focus</th>
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
    </>
  );
}

export default EducatorTrending;
