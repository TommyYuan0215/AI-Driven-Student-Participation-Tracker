import React, { useState } from "react";
import { Accordion, Table, Form, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useSession from "../../utils/sessionUtils";

function AccountSettings() {
    const navigate = useNavigate();
    const { userData, isLoggedIn } = useSession(navigate);
    const [imagePreview, setImagePreview] = useState("/assets/images/profile.jpg");
    const [imageFile, setImageFile] = useState(null);

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

    if (!isLoggedIn) {
        return <p>Please log in to access account settings.</p>;
    }

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
            <Form>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header><strong style={{color: "red"}}>(Mandatory)</strong> &nbsp; Basic Information</Accordion.Header>
                        <Accordion.Body>
                            
                                <div className="form-floating mb-3">
                                    <input className="form-control" id="name" type="name" name="name" value={userData.userName} placeholder="Name" data-sb-validations="required,email" />
                                    <label for="name">Name</label>
                                </div>

                                <div className="form-floating mb-3">
                                    <input className="form-control" id="email" type="email" name="email" value={userData.userEmail} placeholder="name@example.com" data-sb-validations="required,email" readonly />
                                    <label for="email">Email address</label>
                                </div>

                                <div className="form-floating mb-3">
                                    <input className="form-control" id="password" type="password" name="currentpass" placeholder="Enter your password here..." data-sb-validations="required" required />
                                    <label for="password">Current Password</label>
                                </div>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                        <Accordion.Header><strong>(Optional)</strong> &nbsp; Update Password</Accordion.Header>
                        <Accordion.Body>
                            <Row className="g-2">
                                <Col md>
                                    <div className="form-floating mb-3">
                                        <input className="form-control" id="password" type="password" name="pass1" placeholder="Enter your password here..." />
                                        <label for="password">New Password</label>
                                    </div>
                                </Col>
                                <Col md>
                                    <div className="form-floating mb-3">
                                        <input className="form-control" id="password" type="password" name="pass2" placeholder="Enter your password here..." />
                                        <label for="password">Confirm New Password</label>
                                    </div>
                                </Col>
                            </Row>         
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                        <Accordion.Header><strong>(Optional)</strong> &nbsp; Update User Profile</Accordion.Header>
                        <Accordion.Body>
                        <div className="image-section">
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
                            <div className="d-grid">
                                <button
                                className="btn btn-danger btn-sm"
                                id="submitButton"
                                type="submit"
                                name="process_delete_profile_pic"
                                onClick={(e) => {
                                    // Confirm reset to default
                                    if (
                                    window.confirm(
                                        "Are you sure you want to reset to the default profile picture?"
                                    )
                                    ) {
                                    setImagePreview("/assets/images/profile.jpg");
                                    }
                                }}
                                disabled={imagePreview === "/assets/images/profile.jpg"}
                                >
                                Reset to Default Profile Picture
                                </button>
                            </div>
                        </div>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <br/>
                <Button className="form-control" variant="success">Submit</Button>
            </Form>
        </div>
        </>
    );
}

export default AccountSettings;