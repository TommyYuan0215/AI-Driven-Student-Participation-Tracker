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
import { useLocation } from "react-router-dom";

function UserManagement() {
  const location = useLocation();
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
  const handleOpenModalAdd = () => {
    setFormData({
      userId: "",
      userName: "",
      userEmail: "",
    });
    setModalShowAdd(true);
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
    // Implementation for adding user could go here
  };

  // Edit exist user form submission
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const { userId, userName, userEmail } = formData;

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!userName || !userEmail || !emailPattern.test(userEmail)) {
      toast.error("Please provide valid name and email.");
      return;
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
        setFormData({
          userId: "",
          userName: "",
          userEmail: "",
        });

        toast.success(response.data.message || "User updated successfully!");
        handleCloseModalEdit();
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
        await refetch();
      } else {
        toast.error(response.data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="py-2 fade-in">
      <PageTitleBreadcrumb
        title="User Management"
        path={location.pathname}
        isAddNew={true}
        btnTitle="Register User"
        btnIcon="bi-person-plus"
        onclickToggle={handleOpenModalAdd}
      />

      <div className="card border-0 rounded-4 overflow-hidden shadow-lg mt-4" style={{
        background: 'var(--bs-body-bg)',
        border: '1px solid var(--bs-border-color-translucent)'
      }}>
        <div className="card-header bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
          <div>
            <h6 className="mb-0 fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>Registered Accounts</h6>
            <p className="text-muted small mb-0">Manage system access and profiles</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small fw-medium">Items:</span>
            <select
              className="form-select form-select-sm rounded-pill px-3"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: "80px", background: 'var(--bs-tertiary-bg)' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="py-5"><LoadingSpinner text="Synchronizing user database..." /></div>
          ) : userList.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0 custom-premium-table">
                <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
                  <tr>
                    <th className="ps-4 py-3 text-muted fw-bold small text-uppercase">#</th>
                    <th className="py-3 text-muted fw-bold small text-uppercase cursor-pointer" onClick={() => handleSort("userId")}>
                      ID {sortConfig.key === "userId" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                    <th className="py-3 text-muted fw-bold small text-uppercase cursor-pointer" onClick={() => handleSort("userName")}>
                      Name {sortConfig.key === "userName" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                    <th className="py-3 text-muted fw-bold small text-uppercase cursor-pointer" onClick={() => handleSort("userEmail")}>
                      Email {sortConfig.key === "userEmail" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                    <th className="py-3 text-muted fw-bold small text-uppercase text-center">Status</th>
                    <th className="py-3 text-muted fw-bold small text-uppercase text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredUsers.map((user, index) => (
                    <tr key={user.userID} className="border-bottom" style={{ borderColor: 'var(--bs-border-color-translucent)' }}>
                      <td className="ps-4 text-muted small">{indexOfFirstItem + index + 1}</td>
                      <td className="fw-medium text-primary">#{user.userID}</td>
                      <td className="fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>{user.userName}</td>
                      <td className="text-muted">{user.userEmail}</td>
                      <td className="text-center">
                        <UserStatusBadge userStatus={user.userStatus} />
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            onClick={() => handleOpenModalAuthorized(user.userEmail)}
                          >
                            <i className="bi bi-shield-check text-success"></i>
                            <span className="small fw-bold">Verify</span>
                          </button>
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            onClick={() => handleOpenModalEdit(user)}
                          >
                            <i className="bi bi-pencil-square text-primary"></i>
                            <span className="small fw-bold">Edit</span>
                          </button>
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            onClick={() => handleDeleteUser(user.userID, user.userEmail)}
                          >
                            <i className="bi bi-trash text-danger"></i>
                            <span className="small fw-bold">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
              <h5 className="text-muted mt-3">No Users Found</h5>
              <p className="text-muted small">Register a new user to get started</p>
            </div>
          )}
        </div>

        <div className="card-footer bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
          <div className="text-muted small fw-medium">
            Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, userList.length)} of {userList.length}
          </div>

          <Pagination className="mb-0 custom-premium-pagination">
            <Pagination.Prev
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            />
            {Array.from({ length: Math.ceil(userList.length / itemsPerPage) }).map((_, idx) => (
              <Pagination.Item
                key={idx + 1}
                active={idx + 1 === currentPage}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(userList.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(userList.length / itemsPerPage)}
            />
          </Pagination>
        </div>
      </div>

      {/* Modals */}
      <SmallModelComponent
        show={modalShowAuthorized}
        onHide={handleCloseModalAuthorized}
        title="Account Authorization"
      >
        <div className="p-2">
          <div className="text-center mb-4">
            <h5 className="fw-black mb-1">Verify Credentials</h5>
            <p className="text-muted small">Update system access for {selectedUserEmail}</p>
          </div>

          <Form onSubmit={handleUpdateStatus}>
            <div className="d-flex flex-column gap-3 mb-4">
              <button
                type="submit"
                value="1"
                className="btn-modern-auth-selection authorize d-flex align-items-center gap-3 p-3 rounded-4 border-0 w-100 text-start"
              >
                <div className="icon-box rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="flex-fill">
                  <div className="fw-bold mb-0">Authorize Access</div>
                  <div className="small opacity-75">Grant full system entry to this user.</div>
                </div>
                <i className="bi bi-chevron-right opacity-50"></i>
              </button>

              <button
                type="submit"
                value="0"
                className="btn-modern-auth-selection revoke d-flex align-items-center gap-3 p-3 rounded-4 border-0 w-100 text-start"
              >
                <div className="icon-box rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-x-circle-fill"></i>
                </div>
                <div className="flex-fill">
                  <div className="fw-bold mb-0">Revoke Credentials</div>
                  <div className="small opacity-75">Suspend all active system permissions.</div>
                </div>
                <i className="bi bi-chevron-right opacity-50"></i>
              </button>
            </div>
          </Form>
        </div>

      </SmallModelComponent>

      <LargeModelComponent
        show={modalShowEdit || modalShowAdd}
        onHide={modalShowEdit ? handleCloseModalEdit : handleCloseModalAdd}
        title={modalShowEdit ? "Modify Account Profile" : "Register New Account"}
      >
        <div className="p-2">
          <UserFormModal
            formData={formData}
            setFormData={setFormData}
            handleSubmit={modalShowEdit ? handleUpdateUser : handleAddUser}
            handleClearForm={handleClearForm}
          />
        </div>
      </LargeModelComponent>

    </div>
  );
}

export default UserManagement;
