import React, { useState } from "react";
import { Table, Container, Button, Form, Pagination } from "react-bootstrap";
import UserStatusBadge from "../../components/customized/UserStatusBadge";
import { useLoadingState } from "../../hooks/useLoadingState";
import LoadingSpinner from "../../components/common/LoadingSpinnerComponent";
import SmallModelComponent from "../../components/modal/SmallModelComponent";
import LargeModelComponent from "../../components/modal/LargeModelComponent";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumbLayout";
import UserFormModal from "../../components/form/UserForm";
import { toast } from "react-toastify";
import axios from "../../utils/axiosUtils";

function UserManagement() {
  const {
    data: userList,
    loading,
    refetch,
  } = useLoadingState("/usermanagement/get_user_data", []);
  const [modalShowAuthorized, setModalShowAuthorized] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const registeredUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Initialize the form
  const [formData, setFormData] = useState({
    userId: "",
    userName: "",
    userEmail: "",
  });

  // Handle modal for authorized button
  const handleOpenModalAuthorized = (email) => {
    setSelectedUserEmail(email);
    setModalShowAuthorized(true);
  };
  const handleCloseModalAuthorized = () => setModalShowAuthorized(false);

  // Handle add modal
  const [modalShowAdd, setModalShowAdd] = useState(false);
  const handleOpenModalAdd = (user) => {
    setModalShowEdit(true);
  };
  const handleCloseModalAdd = () => setModalShowAdd(false);

  // Handle edit modal
  const [modalShowEdit, setModalShowEdit] = useState(false);
  const handleOpenModalEdit = (user) => {
    setFormData({
      userId: user.userID,
      userName: user.userName,
      userEmail: user.userEmail,
    });
    setModalShowEdit(true);
  };
  const handleCloseModalEdit = () => setModalShowEdit(false);

  // Add clear form handler
  const handleClearForm = (e) => {
    e.preventDefault();
    setFormData({
      userName: "",
      userEmail: "",
    });
    toast.info("Form has been reset to original values");
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const userStatus = e.nativeEvent.submitter.value;

    try {
      const response = await axios.post("/usermanagement/authorized_user", {
        userStatus,
        userEmail: selectedUserEmail,
      });

      if (response.data.success) {
        toast.success(
          response.data.message || "User status updated successfully!"
        );
        await refetch(); // Refresh the data instead of using setUserList
        handleCloseModalAuthorized();
      } else {
        toast.error(response.data.message || "Failed to update user status");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error(
        error.response?.data?.message || "Failed to update user status"
      );
    }
  };

  // Add new user form submission
  const handleAddUser = async (e) => {
    e.preventDefault();
  };

  // Edit exist user form submission
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const { userId, userName, userEmail } = formData;

    // Enhanced validation
    const ValidationErrors = [];
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!userName) {
      ValidationErrors.push("Name is required.");
    }
    if (!userEmail) {
      ValidationErrors.push("Email is required.");
    }

    if (!emailPattern.test(userEmail)) {
      ValidationErrors.push("Invalid email format.");
    }

    const formDataToSend = new FormData();
    formDataToSend.append("userId", userId);
    formDataToSend.append("userName", userName);
    formDataToSend.append("userEmail", userEmail);

    try {
      const response = await axios.post(
        "/usermanagement/update_user",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        // Reset the form
        setFormData({
          userId: "",
          userName: "",
          userEmail: "",
        });

        toast.success(response.data.message || "User updated successfully!");
        handleCloseModalEdit();

        // Refresh the user list
        await refetch();
      } else {
        toast.error(
          response.data.message || "Failed to update user. Please try again."
        );
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete user: ${email}?`)) {
      return;
    }

    try {
      const response = await axios.post("/usermanagement/delete_user", {
        userId: id,
      });

      if (response.data.success) {
        toast.success(response.data.message || "User deleted successfully!");
        await refetch(); // Refresh the data instead of using setUserList
      } else {
        toast.error(response.data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <>
      <PageTitleBreadcrumb title="User Management" path={location.pathname} />
      <div className="m-4 card px-3">
        <section className="px-1 py-4">
          {loading ? (
            <LoadingSpinner text="Loading users..." />
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, userList.length)} of {userList.length} entries
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
                      onClick={() => handleSort("userId")}
                      style={{ width: "100px", cursor: "pointer" }}
                    >
                      ID{" "}
                      {sortConfig.key === "userId"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
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
                        : "↕️"}
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
                        : "↕️"}
                    </th>

                    <th
                      style={{ width: "200px", cursor: "pointer" }}
                      onClick={() => handleSort("createAt")}
                    >
                      Created Date{" "}
                      {sortConfig.key === "createAt"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </th>
                    <th
                      style={{ width: "120px", cursor: "pointer" }}
                      onClick={() => handleSort("userStatus")}
                    >
                      Status{" "}
                      {sortConfig.key === "userStatus"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
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
                      <td>{user.createAt}</td>
                      <td className="text-center">
                        <UserStatusBadge userStatus={user.userStatus} />
                      </td>
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

        {/* Model component for authorized button */}
        <SmallModelComponent
          show={modalShowAuthorized}
          onHide={handleCloseModalAuthorized}
          title="Autorized User"
        >
          <Container className="text-center">
            <p>
              Are you sure you want to authorize this user:{" "}
              <strong>{selectedUserEmail}</strong>?
            </p>
            <Form onSubmit={handleUpdateStatus}>
              <Button type="submit" variant="success" value="1">
                <i className="bi bi-check"></i> &nbsp; Yes
              </Button>
              &emsp;
              <Button type="submit" variant="danger" value="0">
                <i className="bi bi-x"></i> &nbsp; No
              </Button>
            </Form>
          </Container>
        </SmallModelComponent>

        <LargeModelComponent
          show={modalShowEdit || modalShowAdd}
          onHide={modalShowEdit ? handleCloseModalEdit : handleCloseModalAdd}
          title={modalShowEdit ? "Edit User Profile" : "Add New User Profile"}
        >
          <UserFormModal
            formData={formData}
            setFormData={setFormData}
            handleSubmit={modalShowEdit ? handleUpdateUser : handleAddUser}
            handleClearForm={handleClearForm}
          />
        </LargeModelComponent>
      </div>
    </>
  );
}

export default UserManagement;
