import React, { useState, useEffect } from "react";
import { useLoadingState } from "../../../utils/loadingUtils";
import { Table, Button, Pagination } from "react-bootstrap";
import LoadingSpinner from "../../../components/LoadingSpinner";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import UserStatusBadge from "../../../components/UserStatusBadge";
import { useNavigate } from "react-router-dom";
import useSession from "../../../utils/sessionUtils";
import { toast } from "react-toastify";
import axios from "../../../utils/axios_configure";

function EducatorStatistics() {
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);
  const {
    data: trackingsessionList,
    loading,
    refetch,
  } = useLoadingState("/tracking_session/get_tracking_session", {
    userID: userData?.userID,
  });

  // Pagination function
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
        title="Statistics Dashboard"
        path={location.pathname}
      />

      <div className="m-4 card px-3">
        <section className="px-1 py-4">
          {loading ? (
            <LoadingSpinner text="Loading statistics..." />
          ) : (
            <>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-sm p-3 mb-5 bg-body rounded">
                    <h5>Total Session has been created</h5>
                    <p>{trackingsessionList.length}</p>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-sm p-3 mb-5 bg-body rounded"></div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-sm p-3 mb-5 bg-body rounded"></div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-sm p-3 mb-5 bg-body rounded"></div>
                </div>
              </div>
            </>
          )}
          ;
        </section>
        <br />
        <section className="px-1 py-4">
          <h5 className="mb-3">Session History</h5>
          {loading ? (
            <LoadingSpinner text="Loading users..." />
          ) : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr className="text-center">
                    <th style={{ width: "50px" }}>#</th>
                    <th>ID</th>
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
              <br />

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
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default EducatorStatistics;
