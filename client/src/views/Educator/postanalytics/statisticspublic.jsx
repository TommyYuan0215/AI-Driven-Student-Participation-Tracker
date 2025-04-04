import React, { useState } from "react";
import { useLoadingState } from "../../../utils/loadingUtils";
import { Table, Button, Pagination } from "react-bootstrap";
import LoadingSpinner from "../../../components/LoadingSpinner";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import { useNavigate } from "react-router-dom";
import axios from "../../../utils/axios_configure";

function EducatorPublicStatistics() {
  const {
    data: trackingsessionList,
    loading,
    refetch,
  } = useLoadingState("/tracking_session/get_tracking_session_public");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const trackingsessionListPagination = trackingsessionList.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <>
      <PageTitleBreadcrumb
        title="Statistics Dashboard (Public)"
        path={location.pathname}
      />

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
              Engagement data is only shown where educators have enabled public
              sharing in their privacy settings.
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
                      <h3>{trackingsessionList.length}</h3>
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
                      <h3>{0}</h3>
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
                      <h3>{0}</h3>
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
                      <h3>{0}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="px-1">
              <h5 className="mb-3">Public Session History</h5>

              <Table striped bordered hover responsive>
                <thead>
                  <tr className="text-center">
                    <th style={{ width: "50px" }}>#</th>
                    <th>ID</th>
                    <th>Created By</th>
                    <th>Session Start</th>
                    <th>Session End</th>
                    <th>Action</th>
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
                        <Button variant="primary" className="btn-sm">
                          <i className="bi bi-eye"></i>&nbsp; View Details
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

export default EducatorPublicStatistics;
