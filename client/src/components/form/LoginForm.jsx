import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useSession from "../../hooks/useSession";

function LoginForm({ switchToSignUp, closeModel }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useSession(navigate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password); // ✅ Uses login correctly

    if (success) {
      closeModel();
    }
  };

  return (
    <div className="py-5 px-4" style={{ background: 'var(--bs-body-bg)' }}>
      <div className="w-100 mx-auto" style={{ maxWidth: '400px' }}>
        <div className="mb-5 text-center">
          <h1 className="fw-black mb-1" style={{ color: 'var(--bs-emphasis-color)', letterSpacing: '-1.5px' }}>Login</h1>
          <p className="text-muted fw-medium">Let's work together!</p>
          <hr className="w-25 mx-auto opacity-10 mt-4" />
        </div>
        
        <Form onSubmit={handleSubmit} className="modern-form">
          <Form.Group controlId="email" className="mb-4">
            <Form.Label className="small fw-bold opacity-75">Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              className="rounded-3 py-3 px-4 border-0 shadow-sm"
              style={{ background: 'var(--bs-tertiary-bg)', color: 'var(--bs-emphasis-color)' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group controlId="password" className="mb-4">
            <Form.Label className="small fw-bold opacity-75">Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password"
              className="rounded-3 py-3 px-4 border-0 shadow-sm"
              style={{ background: 'var(--bs-tertiary-bg)', color: 'var(--bs-emphasis-color)' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <div className="d-grid mt-5">
            <button 
              type="submit" 
              className="btn-modern-primary py-3 fw-bold"
            >
              Login
            </button>
          </div>
        </Form>

        <div className="mt-5 text-center">
          <p className="small text-muted mb-0">
            Don't have an account?{" "}
            <a href="#" className="text-primary fw-bold text-decoration-none" onClick={switchToSignUp}>
              Sign up here
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

export default LoginForm;
