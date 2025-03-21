import React, { useState } from "react";
import { Table, Container, Button, Form, Pagination } from "react-bootstrap";
import UserStatusBadge from "../../components/UserStatusBadge";
import { useLoadingState } from "../../utils/loadingUtils";
import LoadingSpinner from "../../components/LoadingSpinner";
import SmallModelComponent from "../../components/SmallModelComponent";
import LargeModelComponent from "../../components/LargeModelComponent";
import PageTitleBreadcrumb from "../../components/PageTitleBreadcrumb";
import { toast } from "react-toastify";
import axios from "../../utils/axios_configure";

function UserManagement() {
  const {
    data: userList,
    loading,
    refetch,
  } = useLoadingState("/usermanagement/get_user_data", []);
  const [modalShowAuthorized, setModalShowAuthorized] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

  // Pagination function
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const registeredUsers = userList.slice(indexOfFirstItem, indexOfLastItem);

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

  // Modify handleUpdateUser to use refetch
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
      <PageTitleBreadcrumb
        title="User Management"
        path={location.pathname}
        isAddNew="True"
        onclickToggle={() => null}
        btnTitle="Add New User"
      />
      <div className="ms-3 me-3">
        {loading ? (
          <LoadingSpinner text="Loading users..." />
        ) : (
          <>
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th></th>
                  <th>User Name</th>
                  <th>User Email</th>
                  <th>Account Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.map((user, index) => (
                  <tr key={user.userID}>
                    <td>{index + 1}</td>
                    <td>{user.userName}</td>
                    <td>{user.userEmail}</td>
                    <td>
                      <UserStatusBadge userStatus={user.userStatus} />
                    </td>
                    <td>
                      {/* Action buttons */}
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

            <Pagination className="d-flex justify-content-center">
              <Pagination.First
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
              {Array.from({
                length: Math.ceil(userList.length / itemsPerPage),
              }).map((_, pageIndex) => (
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
          show={modalShowEdit}
          onHide={handleCloseModalEdit}
          title="Edit User Profile"
        >
          <Container>
            <Form onSubmit={handleUpdateUser}>
              <Form.Group className="mb-3">
                <Form.Label>User ID</Form.Label>
                <Form.Control
                  type="text"
                  name="userId"
                  value={formData.userId}
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      userName: e.target.value.trim(),
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      userEmail: e.target.value.trim(),
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3 d-flex justify-content-around">
                <Button
                  variant="success"
                  type="submit"
                  disabled={!formData.userName || !formData.userEmail}
                >
                  <i className="bi bi-save"></i> &nbsp; Save Changes
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleClearForm}
                  type="button"
                >
                  <i className="bi bi-arrow-counterclockwise"></i> &nbsp; Reset
                </Button>
              </Form.Group>
            </Form>
          </Container>
        </LargeModelComponent>
      </div>
    </>
  );
}

export default UserManagement;
