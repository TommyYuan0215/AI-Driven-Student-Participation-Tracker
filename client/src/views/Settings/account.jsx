import { useState, useEffect } from "react";
import { Accordion, Table, Form, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useSession from "../../utils/sessionUtils";
import { toast } from "react-toastify";

function AccountSettings() {
    const navigate = useNavigate();
    const { userData, isLoggedIn } = useSession(navigate);
    const [imagePreview, setImagePreview] = useState("/profile.jpg");
    const [imageFile, setImageFile] = useState(null);

    const [formData, setFormData] = useState({
        name: userData?.userName || '',
        email: userData?.userEmail || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isMandatoryFilled, setIsMandatoryFilled] = useState(false);

    // Check mandatory fields (Email, Name and current password)
    useEffect(() => {
        const { name, email, currentPassword } = formData;
        setIsMandatoryFilled(name.trim() !== '' && 
                  email.trim() !== '' && 
                  currentPassword.trim() !== '');
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
        if (!isMandatoryFilled) {
            toast.error("Please fill in all mandatory field before click on save changes.");
            return;
        }
    };

    if (!isLoggedIn) {
        return <p>Please log in to access account settings.</p>;
    };

    return (
        <>
        <h2 className="p-3">Account Settings</h2>
        <div className="ms-4 me-4">  
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <img src="/profile.jpg" alt="User" 
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
                                <Form.Group className="form-floating mb-3">
                                    <input className="form-control" id="name" type="name" name="name" value={userData.userName} placeholder="Name" data-sb-validations="required,email" />
                                    <label for="name">Name</label>
                                </Form.Group>

                                <Form.Group className="form-floating mb-3">
                                    <input className="form-control" id="email" type="email" name="email" value={userData.userEmail} placeholder="name@example.com" data-sb-validations="required,email" readonly />
                                    <label for="email">Email address</label>
                                </Form.Group>

                                <Form.Group className="form-floating mb-3">
                                    <input className="form-control" id="password" type="password" name="currentpass" placeholder="Enter your password here..." data-sb-validations="required" required />
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
                                        <input className="form-control" id="password" type="password" name="pass1" placeholder="Enter your password here..." />
                                        <Form.Label for="password">New Password</Form.Label>
                                    </Form.Group>
                                </Col>
                                <Col md>
                                    <Form.Group className="form-floating mb-3">
                                        <input className="form-control" id="password" type="password" name="pass2" placeholder="Enter your password here..." />
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
                                    <button
                                    className="btn btn-danger btn-sm"
                                    id="submitButton"
                                    type="submit"
                                    name="process_delete_profile_pic"
                                    onClick={() => {
                                        // Confirm reset to default
                                        if (
                                        window.confirm(
                                            "Are you sure you want to reset to the default profile picture?"
                                        )
                                        ) {
                                        setImagePreview("/profile.jpg");
                                        }
                                    }}
                                    disabled={imagePreview === "/profile.jpg"}
                                    >
                                    Reset to Default Profile Picture
                                    </button>
                                </Form.Group> 
                            </>                            
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <br/>
                <Form.Group className="d-flex justify-content-around align-content-center">
                    <Button className="" variant="success"><i className="bi bi-save"></i>&nbsp; Save Changes</Button>
                    <Button variant="secondary"><i className="bi bi-arrow-clockwise"></i>&nbsp; Clear Optional</Button>
                </Form.Group>
            </Form>
        </div>
        </>
    );
}

export default AccountSettings;