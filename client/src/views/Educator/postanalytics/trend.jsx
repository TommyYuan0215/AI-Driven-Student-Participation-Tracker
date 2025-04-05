import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoadingState } from "../../../utils/loadingUtils";
import LoadingSpinner from "../../../components/common/LoadingSpinnerComponent";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
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
import axios from "../../../utils/axiosUtils";

function EducatorTrending() {
  const location = useLocation();
  const [chartData, setChartData] = useState([]);

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
      />

      <div className="m-4 card px-3">
        {chartData.length === 0 ? (
          <LoadingSpinner text="Loading trend data..." />
        ) : (
          <section className="px-3 py-4">
            <ResponsiveContainer width="100%" height={450}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 2" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Emotion Count",
                    angle: -90,
                    position: "left",
                    offset: 0,
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
        )}
      </div>
    </>
  );
}

export default EducatorTrending;
