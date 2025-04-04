import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
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
} from "recharts";
import axios from "../../../utils/axios_configure";

function EducatorTrending() {
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);
  const { data: trackingsessionList, loading } = useLoadingState(
    "/tracking_session/get_tracking_session",
    { userID: userData?.userID }
  );

  const [chartData, setChartData] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");

  // Fetch trend data when a session is selected
  useEffect(() => {
    if (isLoggedIn && userData?.userID && selectedSession) {
      axios
        .get("/tracking_session/get_tracking_emotion", {
          params: { sessionID: selectedSession },
        })
        .then((response) => {
          const processedData = response.data.map((sessionDetails) => ({
            timestamp: sessionDetails.timestamp,
            Interested: sessionDetails.interestedCount,
            Bored: sessionDetails.boredCount,
            LackingFocus: sessionDetails.lackingFocusCount,
            sessionID: sessionDetails.sessionID,
          }));

          setChartData(processedData);
          setFilteredSessions(processedData);
        })
        .catch((error) => {
          console.error("Error fetching tracking emotion data:", error);
          toast.error("Failed to load trend data");
        });
    }
  }, [selectedSession, isLoggedIn, userData?.userID]);

  // Handle session selection for filtering
  const handleFilterChange = (event) => {
    const selectedSessionID = event.target.value;
    setSelectedSession(selectedSessionID);

    // Filter the sessions based on the selected session ID
    const filteredData = chartData.filter(
      (session) => session.sessionID === selectedSessionID
    );
    setFilteredSessions(filteredData.length > 0 ? filteredData : chartData);
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
            <section className="px-3 py-4 mb-4">
              <Row>
                <Col lg={6} className="mx-auto">
                  <Form.Group controlId="filterSession">
                    <Form.Label>Select a Session</Form.Label>
                    <Form.Control
                      as="select"
                      onChange={handleFilterChange}
                      value={selectedSession}
                      className="shadow-sm"
                    >
                      <option value="" disabled>
                        --- Select a session ---
                      </option>
                      {trackingsessionList.map((session) => (
                        <option
                          key={session.sessionID}
                          value={session.sessionID}
                        >
                          {session.sessionID} ({session.sessionStart} -{" "}
                          {session.sessionEnd})
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
            </section>

            {/* Trend Data Section */}
            <section className="px-3 py-4">
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={filteredSessions}>
                  <CartesianGrid strokeDasharray="3 2" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleTimeString()
                    }
                    tick={{ fontSize: 12 }}
                    label={{ value: "Session", position: "bottom", offset: 0 }}
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
          </>
        )}
      </div>
    </>
  );
}

export default EducatorTrending;
