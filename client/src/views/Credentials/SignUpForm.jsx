import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { toast } from 'react-toastify';
import axios from '../../utils/axios_configure';

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
      // Validate image size (optional)
      if (file.size > 5 * 1024 * 1024) { // 5MB limit, for example
        toast.error("Image size exceeds the limit of 5MB");
        return;
      }
      // Validate image type (optional)
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid image type. Only JPEG, and PNG are allowed.")
        return;
      }

      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, confirmPassword, image } = formData;

    // Validate input
    const validationErrors = [];
    if (!name || !email || !password || !confirmPassword) {
      validationErrors.push("All fields are required.");
      toast.error(validationErrors);
    }
    if (password !== confirmPassword) {
      validationErrors.push("Passwords do not match.");
      toast.error(validationErrors);
    }

    if (validationErrors.length > 0) {
      toast.error(validationErrors);
      return;
    }

    const formDataToSend  = new FormData();
    formDataToSend.append("name", name);
    formDataToSend.append("email", email);
    formDataToSend.append("password", password);
    formDataToSend.append("confirmPassword", confirmPassword);
    if (image) {
      formDataToSend.append("image", image);
    }

    try {
      const response = await axios.post('/credential/signup', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        toast.success(response.data.message);
        // Optionally switch to login form after successful signup
        setTimeout(() => switchToLogin(), 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred. Please try again later.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="rounded-4">
        <div className="col-md-12 d-flex align-items-center justify-content-center h-100">
          <div className="w-100 p-4">
            <div className="text-center mb-5">
              <h1 className="fw-bolder">Sign Up</h1>
              <p className="lead fw-normal text-muted mb-0">Register Now!</p>
            </div>
            <Form onSubmit={handleSubmit}>
              {/* Profile Picture */}
              <div className="text-center mb-3">
                <img
                  src={previewImage}
                  className="rounded-circle mx-auto d-block"
                  alt="Profile Preview"
                  width="150"
                  height="150"
                />
                <Form.Group controlId="image" className="mt-3">
                  <Form.Control type="file" name="image" accept="image/*" onChange={handleImageChange} />
                </Form.Group>
              </div>

              {/* Name Input */}
              <Form.Group controlId="name" className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Form.Group>

              {/* Email Input */}
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Form.Group>

              {/* Password Input */}
              <Form.Group controlId="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </Form.Group>

              {/* Confirm Password Input */}
              <Form.Group controlId="confirmPassword" className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm your password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </Form.Group>

              {/* Submit Button */}
              <div className="d-grid">
                <Button variant="primary" size="lg" type="submit">
                  Sign Up Account
                </Button>
              </div>
            </Form>

            <br />
            <p className="text-center">
              Already have an account?{" "}
              <a href="#" onClick={switchToLogin}>
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
  );
}

export default SignUpForm;
