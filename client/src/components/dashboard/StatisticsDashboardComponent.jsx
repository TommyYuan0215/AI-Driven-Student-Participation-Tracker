// StatisticsDashboard.js
import React, { useState, useEffect } from "react";
import { Table, Button, Pagination } from "react-bootstrap";
import LoadingSpinner from "../common/LoadingSpinnerComponent";
import { useLoadingState } from "../../hooks/useLoadingState";
import axios from "../../utils/axiosUtils";

function StatisticsDashboard({
  isPublic = false,
  isAdmin = false,
  userData,
  navigateToDetails,
}) {
  // Conditionally set the API endpoint based on `isPublic` and `isAdmin` flags
  const endpoint = isPublic
    ? "/tracking_session/get_tracking_session_public"
    : isAdmin
    ? "/tracking_session/get_tracking_session_admin"
    : "/tracking_session/get_tracking_session";

  const params = isPublic
    ? {} // No userID for public sessions
    : isAdmin
    ? {} // Admin can see all sessions
    : { userID: userData?.userID }; // Add userID for private sessions

  // Call the appropriate API endpoint
  const {
    data: trackingsessionList,
    loading,
    refetch,
  } = useLoadingState(endpoint, params);

  // State for cumulative statistics
  const [cumulativeStats, setCumulativeStats] = useState({
    interested: 0,
    bored: 0,
    lackingFocus: 0
  });

  // Calculate cumulative statistics when tracking session list changes
  useEffect(() => {
    const calculateCumulativeStats = async () => {
      if (!trackingsessionList || trackingsessionList.length === 0) return;

      let totalInterested = 0;
      let totalBored = 0;
      let totalLackingFocus = 0;

      // Fetch emotion data for each session
      for (const session of trackingsessionList) {
        try {
          const response = await axios.get("/tracking_session/get_tracking_emotion", {
            params: { sessionID: session.sessionID }
          });
          
          // Sum up all entries for this session
          if (response.data && response.data.length > 0) {
            response.data.forEach(entry => {
              totalInterested += parseInt(entry.interestedCount) || 0;
              totalBored += parseInt(entry.boredCount) || 0;
              totalLackingFocus += parseInt(entry.lackingFocusCount) || 0;
            });
          }
        } catch (error) {
          console.error(`Error fetching emotion data for session ${session.sessionID}:`, error);
        }
      }

      setCumulativeStats({
        interested: totalInterested,
        bored: totalBored,
        lackingFocus: totalLackingFocus
      });
    };

    calculateCumulativeStats();
  }, [trackingsessionList]);

  // To handle sort function
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        // Reset sorting
        setSortConfig({ key: null, direction: null });
        return;
      }
    }

    setSortConfig({ key, direction });
  };

  // Applied sorting dynamically
  const sortedSessionList = [...trackingsessionList].sort((a, b) => {
    if (!sortConfig.key) return 0; // No sorting initially
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const trackingsessionListPagination = sortedSessionList.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Format number to remove leading zeros
  const formatNumber = (num) => {
    return num.toString().replace(/^0+/, '') || '0';
  };

  return (
    <>
      <div className="m-4 card px-3">
        {loading ? (
          <LoadingSpinner text="Loading statistics..." />
        ) : trackingsessionList.length === 0 ? (
          <div className="text-center my-5 py-5 text-muted">
            <i
              className="bi bi-emoji-neutral"
              style={{ fontSize: "3rem", opacity: 0.7 }}
            ></i>
            <h5 className="mt-3">No engagement data available</h5>
            <p className="small">
              {isPublic
                ? "Engagement data is only shown where educators have enabled public sharing in their privacy settings."
                : "Tracking hasn't started yet — stay tuned!"}
            </p>
          </div>
        ) : (
          <>
            <section className="px-1 py-4">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-lg p-4 mb-5 rounded">
                    <div className="card-body">
                      <i
                        className="bi bi-file-earmark-plus mb-3"
                        style={{ fontSize: "2rem", color: "magenta" }}
                      ></i>
                      <h5 className="card-title">Total Sessions Created</h5>
                      <h3>{formatNumber(trackingsessionList.length)}</h3>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-lg p-4 mb-5 rounded">
                    <div className="card-body">
                      <i
                        className="bi bi-emoji-smile mb-3"
                        style={{ fontSize: "2rem", color: "green" }}
                      ></i>
                      <h5 className="card-title">Interested (Cumulative)</h5>
                      <h3>{formatNumber(cumulativeStats.interested)}</h3>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-lg p-4 mb-5 rounded">
                    <div className="card-body">
                      <i
                        className="bi bi-emoji-expressionless mb-3"
                        style={{ fontSize: "2rem", color: "orange" }}
                      ></i>
                      <h5 className="card-title">Bored (Cumulative)</h5>
                      <h3>{formatNumber(cumulativeStats.bored)}</h3>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-lg p-4 mb-5 rounded">
                    <div className="card-body">
                      <i
                        className="bi bi-emoji-frown mb-3"
                        style={{ fontSize: "2rem", color: "red" }}
                      ></i>
                      <h5 className="card-title">Lacking Focus (Cumulative)</h5>
                      <h3>{formatNumber(cumulativeStats.lackingFocus)}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="px-1">
              <h5 className="mb-3">Session History</h5>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, trackingsessionList.length)} of {trackingsessionList.length} entries
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
                    <th style={{ width: "50px" }}>#</th>
                    <th
                      onClick={() => handleSort("sessionID")}
                      style={{ cursor: "pointer" }}
                    >
                      Session ID{" "}
                      {sortConfig.key === "sessionID"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </th>
                    <th
                      onClick={() => handleSort("createAt")}
                      style={{ cursor: "pointer" }}
                    >
                      Create By{" "}
                      {sortConfig.key === "createAt"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </th>
                    <th
                      onClick={() => handleSort("sessionStart")}
                      style={{ cursor: "pointer" }}
                    >
                      Session Start{" "}
                      {sortConfig.key === "sessionStart"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </th>
                    <th
                      onClick={() => handleSort("sessionEnd")}
                      style={{ cursor: "pointer" }}
                    >
                      Session End{" "}
                      {sortConfig.key === "sessionEnd"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </th>
                    <th style={{ width: "180px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingsessionListPagination.map((session, index) => (
                    <tr key={session.sessionID}>
                      <td>{index + 1}</td>
                      <td>{session.sessionID}</td>
                      <td>{session.userName}</td>
                      <td>{session.sessionStart}</td>
                      <td>{session.sessionEnd}</td>
                      <td>
                        <Button
                          variant="primary"
                          className="btn-sm"
                          onClick={() => navigateToDetails(session.sessionID)}
                        >
                          <i className="bi bi-eye"></i>&nbsp; View Trend Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

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
                  length: Math.ceil(trackingsessionList.length / itemsPerPage),
                })
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(
                      currentPage + 2,
                      Math.ceil(trackingsessionList.length / itemsPerPage)
                    )
                  )
                  .map((_, pageIndex) => (
                    <Pagination.Item
                      key={pageIndex + 1}
                      active={pageIndex + 1 === currentPage}
                      onClick={() => setCurrentPage(pageIndex + 1)}
                    >
                      {pageIndex + 1}
                    </Pagination.Item>
                  ))}
                {currentPage <
                  Math.ceil(trackingsessionList.length / itemsPerPage) - 2 && (
                  <Pagination.Ellipsis disabled />
                )}
                <Pagination.Next
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(trackingsessionList.length / itemsPerPage)
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(trackingsessionList.length / itemsPerPage)
                  }
                />
                <Pagination.Last
                  onClick={() =>
                    setCurrentPage(
                      Math.ceil(trackingsessionList.length / itemsPerPage)
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(trackingsessionList.length / itemsPerPage)
                  }
                />
              </Pagination>
            </section>
          </>
        )}
      </div>
    </>
  );
}

export default StatisticsDashboard;
