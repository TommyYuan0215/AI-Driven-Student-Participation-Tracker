import React, { useEffect, useState } from "react";
import { Table, Container, Button, Form, Pagination } from 'react-bootstrap'
import UserStatusBadge from "../../components/UserStatusBadge";
import SmallModelComponent from "../../components/SmallModelComponent";
import LargeModelComponent from "../../components/LargeModelComponent";
import { toast } from 'react-toastify';


function UserManagement() {
    const [modalShowAuthorized, setModalShowAuthorized] = useState(false);
    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const handleOpenModalAuthorized = (email) => {
        setSelectedUserEmail(email);
        setModalShowAuthorized(true);
    }
        
    const handleCloseModalAuthorized = () => setModalShowAuthorized(false);

    const [modalShowEdit, setModalShowEdit] = useState(false);
    const handleOpenModalEdit = () => setModalShowEdit(true);
    const handleCloseModalEdit = () => setModalShowEdit(false);

    const [userList, setUserList] = useState([]);

    // Pagination function
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25; 
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = userList.slice(indexOfFirstItem, indexOfLastItem);

    // Breadcrumb items for the page
    const breadcrumbItems = [
        { label: 'Home', path: '../dashboard' },
        { label: 'User Account' }
    ];

    useEffect(() => {
        fetch("http://localhost:5000/usermanagement/get_user_data")
        .then(response => response.json())
        .then(data => {
            setUserList(data);
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
    }, []);

    const handleUpdateStatus= async (e) => {
        e.preventDefault();

        const userStatus = e.nativeEvent.submitter.value;

        try {
            const response = await fetch("http://localhost:5000/usermanagement/authorized_user", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userStatus, userEmail: selectedUserEmail }),
                credentials: "include", // Include cookies for session handling
              });

            if (!response.ok) {
                throw new Error("Server error");
            }

            const data = await response.json();

            if (data.success) {
                // Show success toast
                toast.success(data.message || "User status updated successfully!");
    
                // Update the badge dynamically
                setUserList((prevList) =>
                    prevList.map((user) =>
                        user.userEmail === selectedUserEmail
                            ? { ...user, userStatus: parseInt(userStatus) }
                            : user
                    )
                );
    
                // Close modal after updating
                handleCloseModalAuthorized();
            } else {
                // Show error toast
                toast.error(data.message || "Failed to update user status.");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("An error occurred. Please try again later.");
        }
    }

    return (
    <>
    <h2 className="p-3 text-center">User Account Management</h2>
    <div className="ms-3 me-3">
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
        {currentUsers.map((user, index) => (
            <tr key={user.userID}>
                <td>{index + 1}</td>
                <td>{user.userName}</td>
                <td>{user.userEmail}</td>
                <td><UserStatusBadge userStatus={user.userStatus} /></td>
                <td>
                    {/* Action buttons */}
                    <Button variant="primary" size="sm" onClick={() => handleOpenModalAuthorized(user.userEmail)}>Authorized?</Button> &nbsp;
                    <Button variant="info" size="sm" onClick={handleOpenModalEdit}>Edit</Button> &nbsp;
                    <Button variant="danger" size="sm">Delete</Button>

                </td>
            </tr>
        ))}
        </tbody>
        </Table>

        <Pagination className="d-flex justify-content-center">
            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
            <Pagination.Prev
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            />
            {Array.from({ length: Math.ceil(userList.length / itemsPerPage) }).map((_, pageIndex) => (
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
                    setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(userList.length / itemsPerPage)))
                }
                disabled={currentPage === Math.ceil(userList.length / itemsPerPage)}
            />
            <Pagination.Last
                onClick={() => setCurrentPage(Math.ceil(userList.length / itemsPerPage))}
                disabled={currentPage === Math.ceil(userList.length / itemsPerPage)}
            />
        </Pagination>

        {/* Model component for authorized button */}
        <SmallModelComponent
            show={modalShowAuthorized}
            onHide={handleCloseModalAuthorized}
            title="Autorized User"
        >
            <Container className="text-center">
                <p>
                    Are you sure you want to authorize this user: <strong>{selectedUserEmail}</strong>?
                </p>
                <Form onSubmit={handleUpdateStatus}>
                    <Button type="submit"
                        variant="success"
                        value="1">
                            Yes
                    </Button> 
                    &emsp;
                    <Button 
                        type="submit" 
                        variant="danger"
                        value="0">
                            No
                    </Button>
                </Form>
            </Container>
        </SmallModelComponent>

        <LargeModelComponent
            show={modalShowEdit}
            onHide={handleCloseModalEdit}
            title="Edit User Profile"
        >
        </LargeModelComponent>
    </div>
    </>
    )
};

export default UserManagement;