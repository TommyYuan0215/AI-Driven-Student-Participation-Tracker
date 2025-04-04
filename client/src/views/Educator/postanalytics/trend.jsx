import React, { useEffect, useState } from "react";
import { Container, Form } from "react-bootstrap";
import useSession from "../../../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import { useLoadingState } from "../../../utils/loadingUtils";
import LoadingSpinner from "../../../components/LoadingSpinner";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
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
} from "recharts"; // Import necessary Recharts components
import axios from "../../../utils/axios_configure";

function EducatorTrending() {
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);
  const {
    data: trackingsessionList,
    loading,
    refetch,
  } = useLoadingState("/tracking_session/get_tracking_session", {
    userID: userData?.userID,
  });

  const [chartData, setChartData] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(""); // State to store selected session

  useEffect(() => {
    if (trackingsessionList.length > 0) {
      const processedData = trackingsessionList.map((session) => ({
        name: session.sessionStart,
        Interested: session.interestedCount,
        Bored: session.boredCount,
        LackingFocus: session.lackingFocusCount,
        sessionID: session.sessionID, // Store session ID for filtering
      }));

      setChartData(processedData);
      setFilteredSessions(processedData); // Set all sessions initially
    }
  }, [trackingsessionList]);

  const handleFilterChange = (event) => {
    const selectedSessionID = event.target.value;
    setSelectedSession(selectedSessionID);

    if (selectedSessionID) {
      // Filter the sessions based on the selected session ID
      const filteredData = chartData.filter(
        (session) => session.sessionID === selectedSessionID
      );
      setFilteredSessions(filteredData);
    } else {
      // If no filter is applied, show all sessions
      setFilteredSessions(chartData);
    }
  };

  return (
    <>
      <PageTitleBreadcrumb
        title="Trend Data Analysis"
        path={location.pathname}
      />

      <div className="m-4 card px-3">
        {loading ? (
          <LoadingSpinner text="Loading trend data..." />
        ) : trackingsessionList.length === 0 ? (
          <div className="text-center my-5 py-5 text-muted">
            <i
              className="bi bi-emoji-neutral"
              style={{ fontSize: "3rem", opacity: 0.7 }}
            ></i>
            <h5 className="mt-3">No engagement data available</h5>
            <p className="small">Tracking hasn't started yet — stay tuned!</p>
          </div>
        ) : (
          <>
            {/* Filter Section */}
            <section className="px-1 py-4">
              <Form.Group controlId="filterSession" className="mb-3">
                <Form.Label>Select a Session</Form.Label>
                <Form.Control
                  as="select"
                  onChange={handleFilterChange}
                  value={selectedSession}
                >
                  <option value="">All Sessions</option>
                  {trackingsessionList.map((session) => (
                    <option key={session.sessionID} value={session.sessionID}>
                      {session.sessionID} ({session.sessionStart} -{" "}
                      {session.sessionEnd})
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </section>

            {/* Trend Data Section */}
            <section className="px-1 py-4">
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={filteredSessions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Interested" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="Bored" stroke="#ff7300" />
                  <Line
                    type="monotone"
                    dataKey="LackingFocus"
                    stroke="#ff0000"
                  />
                </LineChart>
              </ResponsiveContainer>
            </section>
          </>
        )}
      </div>
    </>
  );
}

export default EducatorTrending;
