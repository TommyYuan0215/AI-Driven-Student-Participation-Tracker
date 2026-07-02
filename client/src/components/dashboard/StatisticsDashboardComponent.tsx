// StatisticsDashboard.js
import React, { useState, useEffect } from "react";
import { Table, Button, Pagination } from "react-bootstrap";
import LoadingSpinner from "../common/LoadingSpinnerComponent";
import { useLoadingState } from "../../hooks/useLoadingState";
import axios from "../../utils/axiosUtils";

export interface StatisticsDashboardProps {
  isPublic?: boolean;
  isAdmin?: boolean;
  userData?: any;
  navigateToDetails: (sessionId: string | number) => void;
}

function StatisticsDashboard({
  isPublic = false,
  isAdmin = false,
  userData,
  navigateToDetails,
}: StatisticsDashboardProps) {
  // Conditionally set the API endpoint based on `isPublic` and `isAdmin` flags
  const endpoint = isPublic
    ? "/tracking_session/get_tracking_session_public"
    : isAdmin
      ? "/tracking_session/get_tracking_session_admin"
      : "/tracking_session/get_tracking_session";

  const params = isPublic
    ? { userID: userData?.userID } // Add userID for public sessions
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
    <div className="container-fluid">
      {loading ? (
        <LoadingSpinner text="Analyzing global performance..." />
      ) : trackingsessionList.length === 0 ? (
        <div className="text-center my-5 py-5 border-0 rounded-4 shadow-sm" style={{ background: 'var(--bs-tertiary-bg)' }}>
          <i
            className="bi bi-bar-chart-line text-muted mb-3 d-block"
            style={{ fontSize: "4rem", opacity: 0.3 }}
          ></i>
          <h4 className="fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>No analytics captured yet</h4>
          <p className="text-muted small max-width-500 mx-auto">
            {isPublic
              ? "Public engagement data will appear here once educators enable sharing."
              : "Complete a tracking session to see detailed emotional analytics and trends."}
          </p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="row g-4 mb-5">
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 rounded-4 h-100 overflow-hidden elevation-card" style={{
                background: 'var(--bs-body-bg)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                border: '1px solid var(--bs-border-color-translucent)'
              }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-4 me-3 shadow-sm">
                      <i className="bi bi-calendar-event text-primary fs-4"></i>
                    </div>
                    <h6 className="mb-0 fw-bold" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>TOTAL SESSIONS</h6>
                  </div>
                  <h2 className="fw-black mb-1" style={{ color: 'var(--bs-emphasis-color)' }}>{formatNumber(trackingsessionList.length)}</h2>
                  <div className="small text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i>System Active</div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card border-0 rounded-4 h-100 overflow-hidden elevation-card" style={{
                background: 'var(--bs-body-bg)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                border: '1px solid var(--bs-border-color-translucent)'
              }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-success bg-opacity-10 p-3 rounded-4 me-3 shadow-sm">
                      <i className="bi bi-emoji-smile text-success fs-4"></i>
                    </div>
                    <h6 className="mb-0 fw-bold" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>INTERESTED</h6>
                  </div>
                  <h2 className="fw-black mb-1" style={{ color: 'var(--bs-emphasis-color)' }}>{formatNumber(cumulativeStats.interested)}</h2>
                  <div className="small text-muted fw-light">Total Data Points</div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card border-0 rounded-4 h-100 overflow-hidden elevation-card" style={{
                background: 'var(--bs-body-bg)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                border: '1px solid var(--bs-border-color-translucent)'
              }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-warning bg-opacity-10 p-3 rounded-4 me-3 shadow-sm">
                      <i className="bi bi-emoji-expressionless text-warning fs-4"></i>
                    </div>
                    <h6 className="mb-0 fw-bold" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>BORED</h6>
                  </div>
                  <h2 className="fw-black mb-1" style={{ color: 'var(--bs-emphasis-color)' }}>{formatNumber(cumulativeStats.bored)}</h2>
                  <div className="small text-muted fw-light">Engagement Gap</div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card border-0 rounded-4 h-100 overflow-hidden elevation-card" style={{
                background: 'var(--bs-body-bg)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                border: '1px solid var(--bs-border-color-translucent)'
              }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-danger bg-opacity-10 p-3 rounded-4 me-3 shadow-sm">
                      <i className="bi bi-emoji-frown text-danger fs-4"></i>
                    </div>
                    <h6 className="mb-0 fw-bold" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>LACKING FOCUS</h6>
                  </div>
                  <h2 className="fw-black mb-1" style={{ color: 'var(--bs-emphasis-color)' }}>{formatNumber(cumulativeStats.lackingFocus)}</h2>
                  <div className="small text-muted fw-light">Critical Attention</div>
                </div>
              </div>
            </div>
          </div>

          {/* Session History Table */}
          <div className="card border-0 rounded-4 overflow-hidden shadow-lg mb-4" style={{
            background: 'var(--bs-body-bg)',
            border: '1px solid var(--bs-border-color-translucent)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
          }}>
            <div className="card-header bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>Session Analytics History</h5>
                <p className="text-muted small mb-0">Browse and analyze individual class performance</p>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="small text-muted d-none d-md-block">Entries:</div>
                <select
                  className="form-select form-select-sm rounded-pill px-3 shadow-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ width: "80px", background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0 custom-table">
                  <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
                    <tr>
                      <th className="ps-4 py-3 text-muted fw-bold small text-uppercase">#</th>
                      <th className="py-3 text-muted fw-bold small text-uppercase" onClick={() => handleSort("sessionID")} style={{ cursor: "pointer" }}>
                        Session ID {sortConfig.key === "sessionID" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "⇅"}
                      </th>
                      <th className="py-3 text-muted fw-bold small text-uppercase" onClick={() => handleSort("createAt")} style={{ cursor: "pointer" }}>
                        Educator {sortConfig.key === "createAt" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "⇅"}
                      </th>
                      <th className="py-3 text-muted fw-bold small text-uppercase" onClick={() => handleSort("sessionStart")} style={{ cursor: "pointer" }}>
                        Start Time {sortConfig.key === "sessionStart" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "⇅"}
                      </th>
                      <th className="py-3 text-muted fw-bold small text-uppercase" onClick={() => handleSort("sessionEnd")} style={{ cursor: "pointer" }}>
                        End Time {sortConfig.key === "sessionEnd" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "⇅"}
                      </th>
                      <th className="pe-4 py-3 text-muted fw-bold small text-uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackingsessionListPagination.map((session, index) => (
                      <tr key={session.sessionID} className="border-bottom" style={{ borderColor: 'var(--bs-border-color-translucent)' }}>
                        <td className="ps-4 fw-medium text-muted">{indexOfFirstItem + index + 1}</td>
                        <td className="fw-bold notranslate" style={{ color: 'var(--bs-emphasis-color)' }}>#{session.sessionID}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>
                              <i className="bi bi-person text-primary small"></i>
                            </div>
                            <span className="fw-medium notranslate">{session.userName}</span>
                          </div>
                        </td>
                        <td className="small text-muted">{session.sessionStart}</td>
                        <td className="small text-muted">{session.sessionEnd}</td>
                        <td className="pe-4 text-center">
                          <button
                            className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm elevation-button"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => navigateToDetails(session.sessionID)}
                          >
                            Analyze Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            <div className="card-footer bg-transparent border-0 py-4 px-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
              <div className="text-muted small fw-medium">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, trackingsessionList.length)} of {trackingsessionList.length} sessions
              </div>

              <Pagination className="mb-0 custom-pagination">
                <Pagination.Prev
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
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
              </Pagination>
            </div>
          </div>
        </>
      )}

      <style>{`
        .fw-black { font-weight: 900; }
        .rounded-4 { border-radius: 1.5rem !important; }
        .custom-table thead th {
            letter-spacing: 0.05em;
            font-size: 0.7rem;
        }
        .custom-table tbody tr {
            transition: all 0.2s ease;
        }
        .custom-table tbody tr:hover {
            background-color: var(--bs-tertiary-bg) !important;
            transform: scale(1.002);
        }
        .custom-pagination .page-link {
            border: none;
            border-radius: 8px;
            margin: 0 3px;
            padding: 8px 16px;
            font-weight: 600;
            background: var(--bs-tertiary-bg);
            color: var(--bs-body-color);
        }
        .custom-pagination .active .page-link {
            background: var(--bs-primary);
            color: #fff;
        }
      `}</style>
    </div>
  );
}

export default StatisticsDashboard;
