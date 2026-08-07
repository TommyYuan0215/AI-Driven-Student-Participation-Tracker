import React, { useState } from "react";
import { Container, Card, Form, Button } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../utils/axiosUtils";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Password reset token is missing. Please request a new link.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/credential/reset_password", {
        token,
        password,
      });

      if (response.data.status === "success") {
        toast.success(response.data.message);
        navigate("/");
      } else {
        toast.error(response.data.message || "Failed to reset password.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-5">
      <Card className="border-0 shadow-lg w-100 p-4" style={{ maxWidth: "450px", borderRadius: "24px", background: "var(--bs-body-bg)" }}>
        <Card.Body className="p-2">
          <div className="text-center mb-5">
            <div className="icon-box rounded-circle bg-primary-subtle text-primary mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
              <i className="bi bi-shield-lock-fill fs-2"></i>
            </div>
            <h2 className="fw-black mb-1" style={{ color: "var(--bs-emphasis-color)", letterSpacing: "-1px" }}>Set New Password</h2>
            <p className="text-muted small">Choose a strong password for your FocusTrack account</p>
          </div>

          <Form onSubmit={handleSubmit} className="modern-form">
            <Form.Group className="mb-4" controlId="newPassword">
              <Form.Label className="small fw-bold opacity-75">New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="At least 6 characters"
                className="rounded-3 py-3 px-4 border-0 shadow-sm"
                style={{ background: "var(--bs-tertiary-bg)", color: "var(--bs-emphasis-color)" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="confirmPassword">
              <Form.Label className="small fw-bold opacity-75">Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm your password"
                className="rounded-3 py-3 px-4 border-0 shadow-sm"
                style={{ background: "var(--bs-tertiary-bg)", color: "var(--bs-emphasis-color)" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-grid mt-5">
              <Button
                type="submit"
                className="btn-modern-primary py-3 fw-bold border-0"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <style>{`
        .fw-black { font-weight: 900; }
        .btn-modern-primary {
            background: #7c3aed;
            color: #fff;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 20px -5px rgba(124, 58, 237, 0.4);
        }
        .btn-modern-primary:hover {
            background: #6d28d9;
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -10px rgba(124, 58, 237, 0.5);
        }
        .modern-form .form-control:focus {
            background: var(--bs-tertiary-bg);
            box-shadow: 0 0 0 2px var(--bs-primary);
            border-color: transparent;
        }
      `}</style>
    </Container>
  );
}

export default ResetPassword;
