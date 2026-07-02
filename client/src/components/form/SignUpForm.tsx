import React, { useState } from "react";
import { Form, Button, Alert, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "../../utils/axiosUtils";

function SignUpForm({ switchToLogin }) {
  const [formData, setFormData] = useState({
    image: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [previewImage, setPreviewImage] = useState("/profile.jpg");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size exceeds the limit of 5MB");
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid image type. Only JPEG, and PNG are allowed.");
        return;
      }

      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          setPreviewImage(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, image } = formData;

    const validationErrors = [];
    if (!name || !email || !password || !confirmPassword) {
      validationErrors.push("All fields are required.");
    }
    if (password !== confirmPassword) {
      validationErrors.push("Passwords do not match.");
    }

    if (validationErrors.length > 0) {
      toast.error(validationErrors.join("\n"));
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", name);
    formDataToSend.append("email", email);
    formDataToSend.append("password", password);
    formDataToSend.append("confirmPassword", confirmPassword);
    if (image) {
      formDataToSend.append("image", image);
    }

    try {
      const response = await axios.post("/credential/signup", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        toast.success(response.data.message);
        setTimeout(() => switchToLogin(), 2000);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred. Please try again later.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="py-5 px-4" style={{ background: 'var(--bs-body-bg)' }}>
      <div className="w-100 mx-auto" style={{ maxWidth: '450px' }}>
        <div className="mb-4 text-center">
          <h1 className="fw-black mb-1" style={{ color: 'var(--bs-emphasis-color)' }}>Sign Up</h1>
          <p className="text-muted fw-medium">Let's start working together!</p>
          <hr className="w-25 mx-auto opacity-10 mt-4" />
        </div>
        
        <Form onSubmit={handleSubmit} className="modern-form">
          {/* Profile Picture Upload */}
          <div className="text-center mb-4">
            <div className="position-relative d-inline-block">
              <img
                src={previewImage}
                className="rounded-circle shadow-lg border border-3 border-primary"
                alt="Profile Preview"
                style={{ width: '90px', height: '90px', objectFit: 'cover' }}
              />
              <label htmlFor="image" className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 shadow-sm" style={{ cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-camera-fill small"></i>
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="d-none"
              />
            </div>
          </div>

          <Row className="g-3">
            <Col md={12}>
              <Form.Group controlId="name">
                <Form.Label className="small fw-bold opacity-75">Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  name="name"
                  className="rounded-3 py-2 px-3 border-0 shadow-sm"
                  style={{ background: 'var(--bs-tertiary-bg)', color: 'var(--bs-emphasis-color)' }}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group controlId="email">
                <Form.Label className="small fw-bold opacity-75">Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  name="email"
                  className="rounded-3 py-2 px-3 border-0 shadow-sm"
                  style={{ background: 'var(--bs-tertiary-bg)', color: 'var(--bs-emphasis-color)' }}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="password">
                <Form.Label className="small fw-bold opacity-75">Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  name="password"
                  className="rounded-3 py-2 px-3 border-0 shadow-sm"
                  style={{ background: 'var(--bs-tertiary-bg)', color: 'var(--bs-emphasis-color)' }}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="confirmPassword">
                <Form.Label className="small fw-bold opacity-75">Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm your password"
                  name="confirmPassword"
                  className="rounded-3 py-2 px-3 border-0 shadow-sm"
                  style={{ background: 'var(--bs-tertiary-bg)', color: 'var(--bs-emphasis-color)' }}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-grid mt-4">
            <button 
              type="submit" 
              className="btn-modern-primary py-3 fw-bold"
            >
              Sign Up Account
            </button>
          </div>
        </Form>

        <div className="mt-4 text-center">
          <p className="small text-muted mb-0">
            Already have an account?{" "}
            <a href="#" className="text-primary fw-bold text-decoration-none" onClick={switchToLogin}>
              Sign in here
            </a>
          </p>
        </div>
      </div>
      
      <style>{`
        .fw-black { font-weight: 900; }
        .btn-modern-primary {
            background: #6366f1;
            color: #fff;
            border: none;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
        }
        .btn-modern-primary:hover {
            background: #4f46e5;
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -10px rgba(99, 102, 241, 0.5);
        }
        .modern-form .form-control:focus {
            background: var(--bs-tertiary-bg);
            box-shadow: 0 0 0 2px var(--bs-primary);
            border-color: transparent;
        }
      `}</style>
    </div>
  );
}

export default SignUpForm;
