import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axios_configure';  // Import the configured axios instance

function LoginForm({ switchToSignUp, closeModel }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    try {
      const response = await axios.post('/credential/login', { email, password });
      
      const result = response.data;
      navigate(result.redirect);  // Redirect to the specified page
      closeModel();
      // toast.success(result.message);
      window.location.reload();

    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage = error.response?.data?.message || "An error occurred. Please try again later.";
      setErrors([errorMessage]);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="rounded-4">
      <div className="row">
        {/* Left Column: Image */}
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <img
            src="/Login_SignUp_Picture.jpg"
            alt="Login Illustration"
            className="img-fluid w-100 h-100 object-fit-cover rounded-4"
            style={{ maxHeight: "100%" }}
          />
        </div>

        {/* Right Column: Form */}
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <div className="w-100">
            <div className="text-center mb-5">
              <h1 className="fw-bolder">Login</h1>
              <p className="lead fw-normal text-muted mb-0">Let's work together!</p>
            </div>
            <Form onSubmit={handleSubmit}>
              {/* Email input */}
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              {/* Password input */}
              <Form.Group controlId="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>

              {/* Error Message Dialog Box */}
              {errors.length > 0 && (
                <Alert variant="danger" className="text-center">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </Alert>
              )}

              {/* Submit Button */}
              <div className="d-grid">
                <Button variant="primary" type="submit" size="lg">
                  Login
                </Button>
              </div>
            </Form>

            <br />
            <p className="text-center">
              Don't have an account?{" "}
              <a href="#" onClick={switchToSignUp}>
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
