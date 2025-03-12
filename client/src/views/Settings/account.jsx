import { useState, useEffect } from "react";
import { Accordion, Table, Form, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useSession from "../../utils/sessionUtils";
import { toast } from "react-toastify";
import axios from "../../utils/axios_configure";
import PageTitleBreadcrumb from "../../components/PageTitleBreadcrumb";

function AccountSettings() {
    const navigate = useNavigate();
    const { userData, isLoggedIn, refetch } = useSession(navigate);
    const [imagePreview, setImagePreview] = useState("/profile.jpg");
    const [imageFile, setImageFile] = useState(null);

    // Initialize form data with empty values
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        currentpass: '',
        newpass: '',
        confirmpass: ''
    });

    // Update form data when userData becomes available
    useEffect(() => {
        if (userData) {
            setFormData(prev => ({
                ...prev,
                id: userData.userID || '',
                name: userData.userName || '',
                email: userData.userEmail || ''
            }));
            
            // Update profile image if exists
            if (userData.userPhoto) {
                setImagePreview(`data:image/jpeg;base64,${userData.userPhoto}`);
            }
        }
    }, [userData]);

    const [isMandatoryFilled, setIsMandatoryFilled] = useState(false);

    // Check mandatory fields (Email, Name and current password)
    useEffect(() => {
        const { name, email, currentpass } = formData;
        setIsMandatoryFilled(name.trim() !== '' && 
                  email.trim() !== '' && 
                  currentpass.trim() !== '');
    }, [formData]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle preview image after user choose file
    const previewImage = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImagePreview(event.target.result);
          };
          reader.readAsDataURL(file);
          setImageFile(file);
        }
    };

    // Handle form save changes
    const handleFormSaveChanges = async (e) => {
        e.preventDefault();
        
        // Check mandatory fields
        if (!isMandatoryFilled) {
            toast.error("Please fill in all mandatory fields before saving changes.");
            return;
        }
    
        // Validate password match if new password is provided
        if (formData.newpass) {
            if (formData.newpass !== formData.confirmpass) {
                toast.error("New password and confirm password do not match!");
                return;
            }
        }
    
        try {
            const formDataToSend = new FormData();
            
            // Add mandatory fields
            formDataToSend.append("id", formData.id);
            formDataToSend.append("name", formData.name);
            formDataToSend.append("email", formData.email);
            formDataToSend.append("currentPassword", formData.currentpass);
    
            // Add optional fields if they exist
            if (formData.newpass) {
                formDataToSend.append("newPassword", formData.newpass);
            }
    
            // Add profile image if changed
            if (imageFile && imagePreview !== "/profile.jpg") {
                formDataToSend.append("profileImage", imageFile);
            }
    
            const response = await axios.post('/settings/update_account', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            if (response.status === 200) {
                // Refresh session data
                await axios.get('/credential/get_user_session');
                await refetch();

                // Reset optional fields
                setFormData(prev => ({
                    ...prev,
                    currentpass: '',
                    newpass: '',
                    confirmpass: ''
                }));

                // Reset image if it was changed
                if (imageFile) {
                    setImageFile(null);
                }

                toast.success("Account settings updated successfully!");
            } else {
                toast.error(response.data.message || "Failed to update account settings");
            }
        } catch (error) {
            console.error('Update account error:', error);
            toast.error(error.response?.data?.message || "An error occurred while updating account settings");
        }
    };

    const handleResetPhoto = async (e) => {
        e.preventDefault();
        
        if (!window.confirm("Are you sure you want to reset to the default profile picture?")) {
            return;
        }

        // Check mandatory fields
        if (!isMandatoryFilled) {
            toast.error("Please fill in all mandatory fields before saving changes.");
            return;
        }
    
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('id', userData.userID);
            formDataToSend.append('resetPhoto', 'true');
            formDataToSend.append('currentPassword', formData.currentpass);
    
            const response = await axios.post('/settings/reset_account_photo', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            if (response.status === 200) {
                // Update local state
                setImagePreview('/profile.jpg');
                setImageFile(null);
    
                // Refresh session
                await refetch();
    
                toast.success("Profile picture reset successfully");
            } else {
                toast.error(response.data.message || "Failed to reset profile picture");
            }
        } catch (error) {
            console.error('Reset photo error:', error);
            toast.error(error.response?.data?.message || "Failed to reset profile picture");
        }
    };

    if (!isLoggedIn) {
        return <p>Please log in to access account settings.</p>;
    };

    return (
        <>
        <PageTitleBreadcrumb title="Account Settings" path={location.pathname} />
        <div className="ms-4 me-4 m-3">  
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <img src={userData.userPhoto ? `data:image/jpeg;base64,${userData.userPhoto}` : "/profile.jpg"} alt="User" 
                            className="rounded-circle mx-auto d-block img-thumbnail" width="120" height="120"/>
                            <br />
                            <h5 className="card-title text-center">Hello,  {userData.userName} &#128075;</h5>
                        </div>
                        <div className="card-body">
                            <Table hover responsive>
                                <tbody>
                                    <tr>
                                        <th className="col-4">Registered Email Address:</th>
                                        <td className="col-8 text-justify">{userData.userEmail}</td>
                                    </tr>
                                    <tr>
                                        <th className="col-4">Type of User:</th>
                                        <td className="col-8 text-justify">{userData?.userType === 0 ? "Administrator" : "Educator"}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>  
            </div>
            <br/>
            <Form onSubmit={handleFormSaveChanges}>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header><strong style={{color: "red"}}>(Mandatory)</strong> &nbsp; Basic Information</Accordion.Header>
                        <Accordion.Body>
                            <Form.Group>
                                <Form.Group className="form-floating mb-3 d-none">
                                    <input className="form-control" id="id" type="text" name="id" value={formData.id} onChange={handleInputChange} placeholder="UserID" data-sb-validations="required" disabled/>
                                    <label for="name">User ID</label>
                                </Form.Group>
                                <Form.Group className="form-floating mb-3">
                                    <input className="form-control" id="name" type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Name" data-sb-validations="required" />
                                    <label for="name">Name</label>
                                </Form.Group>

                                <Form.Group className="form-floating mb-3">
                                    <input className="form-control" id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="name@example.com" data-sb-validations="required,email" readonly />
                                    <label for="email">Email address</label>
                                </Form.Group>

                                <Form.Group className="form-floating mb-3">
                                    <input className="form-control" id="password" type="password" name="currentpass" value={formData.currentpass} onChange={handleInputChange} placeholder="Enter your password here..." data-sb-validations="required" required />
                                    <label for="password">Current Password</label>
                                </Form.Group>
                            </Form.Group>    
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                        <Accordion.Header><strong>(Optional)</strong> &nbsp; Update Password</Accordion.Header>
                        <Accordion.Body>
                            <Row className="g-2">
                                <Col md>
                                    <Form.Group className="form-floating mb-3">
                                        <input className="form-control" id="password" type="password" name="newpass" placeholder="Enter your password here..." />
                                        <Form.Label for="password">New Password</Form.Label>
                                    </Form.Group>
                                </Col>
                                <Col md>
                                    <Form.Group className="form-floating mb-3">
                                        <input className="form-control" id="password" type="password" name="confirmpass" placeholder="Enter your password here..." />
                                        <Form.Label for="password">Confirm New Password</Form.Label>
                                    </Form.Group>
                                </Col>
                            </Row>         
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                        <Accordion.Header><strong>(Optional)</strong> &nbsp; Update User Profile</Accordion.Header>
                        <Accordion.Body>
                            <>
                                <Form.Group className="image-section">
                                    <img
                                    src={imagePreview}
                                    id="image-preview"
                                    className="rounded-circle mx-auto d-block"
                                    alt=""
                                    width="120"
                                    height="120"
                                    />
                                    <br />
                                    <div className="custom-file">
                                        <input
                                            type="file"
                                            className="form-control"
                                            name="image"
                                            id="image"
                                            onChange={previewImage}
                                        />
                                    </div>
                                    <br />
                                </Form.Group>
                                <Form.Group className="d-grid">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    disabled={imagePreview === "/profile.jpg"}
                                    onClick={handleResetPhoto}
                                >
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                    &nbsp;Reset to Default Profile Picture
                                </Button>
                                </Form.Group> 
                            </>                            
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <br/>
                <Form.Group className="d-flex justify-content-around align-content-center">
                    <Button className="" variant="success" type="submit"><i className="bi bi-save"></i>&nbsp; Save Changes</Button>
                    <Button variant="secondary"><i className="bi bi-arrow-clockwise"></i>&nbsp; Clear Optional</Button>
                </Form.Group>
            </Form>
        </div>
        </>
    );
}

export default AccountSettings;