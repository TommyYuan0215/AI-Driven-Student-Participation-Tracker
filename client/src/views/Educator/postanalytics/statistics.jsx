import React, { useState, useEffect } from "react";
import { useLoadingState } from "../../../utils/loadingUtils";
import { Table, Button, Pagination } from "react-bootstrap";
import LoadingSpinner from "../../../components/LoadingSpinner";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import UserStatusBadge from "../../../components/UserStatusBadge";
import { toast } from "react-toastify";
import axios from "../../../utils/axios_configure";

function EducatorStatistics() {
  const {
    data: userList,
    loading,
    refetch,
  } = useLoadingState("/usermanagement/get_user_data", []);

  // To handle sort function
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  // Applied sorting dynamically
  const sortedUsers = [...userList].sort((a, b) => {
    if (!sortConfig.key) return 0; // No sorting initially
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination function
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const registeredUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

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
                    <p>{userList.length}</p>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-sm p-3 mb-5 bg-body rounded">
                    <h5>Total Session has been created</h5>
                    <p>{userList.length}</p>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-sm p-3 mb-5 bg-body rounded">
                    <h5>Total Session has been created</h5>
                    <p>{userList.length}</p>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card text-center shadow-sm p-3 mb-5 bg-body rounded">
                    <h5>Total Session has been created</h5>
                    <p>{userList.length}</p>
                  </div>
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
                    <th
                      onClick={() => handleSort("userId")}
                      style={{ width: "100px", cursor: "pointer" }}
                    >
                      ID{" "}
                      {sortConfig.key === "userId"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : ""}
                    </th>
                    <th
                      onClick={() => handleSort("userName")}
                      style={{ cursor: "pointer" }}
                    >
                      User Name{" "}
                      {sortConfig.key === "userName"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : ""}
                    </th>
                    <th
                      onClick={() => handleSort("userEmail")}
                      style={{ cursor: "pointer" }}
                    >
                      User Email{" "}
                      {sortConfig.key === "userEmail"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : ""}
                    </th>
                    <th
                      style={{ width: "150px", cursor: "pointer" }}
                      onClick={() => handleSort("userStatus")}
                    >
                      Account Status{" "}
                      {sortConfig.key === "userStatus"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : ""}
                    </th>
                    <th
                      style={{ width: "250px", cursor: "pointer" }}
                      onClick={() => handleSort("createAt")}
                    >
                      Created Date{""}
                      {sortConfig.key === "createAt"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : ""}
                    </th>
                    <th style={{ width: "320px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredUsers.map((user, index) => (
                    <tr key={user.userID}>
                      <td>{index + 1}</td>
                      <td>{user.userID}</td>
                      <td>{user.userName}</td>
                      <td>{user.userEmail}</td>
                      <td className="text-center">
                        <UserStatusBadge userStatus={user.userStatus} />
                      </td>
                      <td>{user.createAt}</td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            handleOpenModalAuthorized(user.userEmail)
                          }
                        >
                          <i className="bi bi-clipboard-check"></i>&nbsp;
                          Authorized?
                        </Button>{" "}
                        &nbsp;
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleOpenModalEdit(user)}
                        >
                          <i className="bi bi-pencil"></i>&nbsp; Edit
                        </Button>{" "}
                        &nbsp;
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleDeleteUser(user.userID, user.userEmail)
                          }
                        >
                          <i className="bi bi-trash"></i>&nbsp; Delete
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
                  length: Math.ceil(userList.length / itemsPerPage),
                })
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(
                      currentPage + 2,
                      Math.ceil(userList.length / itemsPerPage)
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
                  Math.ceil(userList.length / itemsPerPage) - 2 && (
                  <Pagination.Ellipsis disabled />
                )}

                <Pagination.Next
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(userList.length / itemsPerPage)
                      )
                    )
                  }
                  disabled={
                    currentPage === Math.ceil(userList.length / itemsPerPage)
                  }
                />
                <Pagination.Last
                  onClick={() =>
                    setCurrentPage(Math.ceil(userList.length / itemsPerPage))
                  }
                  disabled={
                    currentPage === Math.ceil(userList.length / itemsPerPage)
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
