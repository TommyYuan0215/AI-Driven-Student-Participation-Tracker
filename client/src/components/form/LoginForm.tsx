import React, { useState, useRef } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useSession from "../../hooks/useSession";
import axios from "../../utils/axiosUtils";

function LoginForm({ switchToSignUp, closeModel }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [viewMode, setViewMode] = useState<"login" | "otp" | "forgot">("login");
  const [statusMessage, setStatusMessage] = useState("");
  
  // OTP segmented input state
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const navigate = useNavigate();
  const { login, verifyOtp } = useSession(navigate);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      closeModel();
    } else if (result.otpRequired) {
      setStatusMessage(result.message || "Verification code sent to your email.");
      setViewMode("otp");
      // Focus first OTP field on transition
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const submitOtpCode = async (code: string) => {
    const result = await verifyOtp(code);
    if (result.success) {
      closeModel();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = otpArray.join("");
    if (finalCode.length === 6) {
      await submitOtpCode(finalCode);
    } else {
      toast.error("Please enter a valid 6-digit code.");
    }
  };

  const handleOtpChange = async (value: string, index: number) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const newOtp = [...otpArray];
      newOtp[index] = "";
      setOtpArray(newOtp);
      return;
    }

    const newOtp = [...otpArray];
    if (cleanValue.length > 1) {
      // Handles multi-digit input or paste distributions
      const digits = cleanValue.split("").slice(0, 6 - index);
      digits.forEach((digit, idx) => {
        newOtp[index + idx] = digit;
      });
      setOtpArray(newOtp);
      
      const finalCode = newOtp.join("");
      if (finalCode.length === 6) {
        await submitOtpCode(finalCode);
      } else {
        const nextIndex = Math.min(index + digits.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    newOtp[index] = cleanValue;
    setOtpArray(newOtp);

    // Auto-focus next input field
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // Auto-submit if all 6 inputs are loaded
      const finalCode = newOtp.join("");
      if (finalCode.length === 6) {
        await submitOtpCode(finalCode);
      }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpArray[index] && index > 0) {
        const newOtp = [...otpArray];
        newOtp[index - 1] = "";
        setOtpArray(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpArray];
        newOtp[index] = "";
        setOtpArray(newOtp);
      }
    }
  };

  const handleOtpPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtpArray(newOtp);
      await submitOtpCode(pastedData);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/credential/forgot_password", {
        email,
      });
      if (response.data.status === "success") {
        toast.success(response.data.message);
        setStatusMessage(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to send reset link.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to request password reset.");
    }
  };

  return (
    <div className="py-5 px-4" style={{ background: 'var(--bs-body-bg)' }}>
      <div className="w-100 mx-auto" style={{ maxWidth: '400px' }}>
        <div className="mb-5 text-center">
          <h1 className="fw-black mb-1" style={{ color: 'var(--bs-emphasis-color)', letterSpacing: '-1.5px' }}>
            {viewMode === "login" && "Login"}
            {viewMode === "otp" && "Verification"}
            {viewMode === "forgot" && "Reset Password"}
          </h1>
          <p className="text-muted fw-medium">
            {viewMode === "login" && "Let's work together!"}
            {viewMode === "otp" && "Verify your identity"}
            {viewMode === "forgot" && "Recover your account credentials"}
          </p>
          <hr className="w-25 mx-auto opacity-10 mt-4" />
        </div>
        
        {viewMode === "login" && (
          <Form onSubmit={handleLoginSubmit} className="modern-form">
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
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="small fw-bold opacity-75 mb-0">Password</Form.Label>
                <a href="#" className="small text-primary fw-semibold text-decoration-none" onClick={() => { setViewMode("forgot"); setStatusMessage(""); }}>
                  Forgot Password?
                </a>
              </div>
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
        )}

        {viewMode === "otp" && (
          <Form onSubmit={handleOtpSubmit} className="modern-form">
            <div className="alert alert-info border-0 rounded-4 px-4 py-3 mb-4 small">
              <i className="bi bi-info-circle-fill me-2 text-primary"></i>
              {statusMessage}
            </div>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold opacity-75 d-block text-center mb-3">
                Verification Code
              </Form.Label>
              <div className="d-flex justify-content-center gap-2 notranslate">
                {otpArray.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={(el) => {
                      if (el) inputRefs.current[idx] = el;
                    }}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    onPaste={handleOtpPaste}
                    className="form-control text-center fw-bold fs-3 rounded-3 border-0 shadow-sm otp-digit-input"
                    style={{
                      width: "50px",
                      height: "60px",
                      background: "var(--bs-tertiary-bg)",
                      color: "var(--bs-emphasis-color)",
                      border: "2px solid transparent"
                    }}
                  />
                ))}
              </div>
            </Form.Group>

            <div className="d-grid mt-5 gap-3">
              <button 
                type="submit" 
                className="btn-modern-primary py-3 fw-bold"
                disabled={otpArray.join("").length !== 6}
              >
                Verify & Login
              </button>
              <button 
                type="button" 
                className="btn btn-link text-muted small text-decoration-none fw-semibold py-2"
                onClick={() => { setViewMode("login"); setOtpArray(Array(6).fill("")); }}
              >
                <i className="bi bi-arrow-left me-2"></i>Back to Login
              </button>
            </div>
          </Form>
        )}

        {viewMode === "forgot" && (
          <Form onSubmit={handleForgotSubmit} className="modern-form">
            <p className="small text-muted mb-4">
              Enter your registered email address and we'll send you a secure link to reset your password.
            </p>

            {statusMessage && (
              <div className="alert alert-success border-0 rounded-4 px-4 py-3 mb-4 small">
                <i className="bi bi-check-circle-fill me-2 text-success"></i>
                {statusMessage}
              </div>
            )}

            <Form.Group controlId="forgotEmail" className="mb-4">
              <Form.Label className="small fw-bold opacity-75">Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="name@focustrack.edu"
                className="rounded-3 py-3 px-4 border-0 shadow-sm"
                style={{ background: 'var(--bs-tertiary-bg)', color: 'var(--bs-emphasis-color)' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-grid mt-5 gap-3">
              <button 
                type="submit" 
                className="btn-modern-primary py-3 fw-bold"
              >
                Send Reset Link
              </button>
              <button 
                type="button" 
                className="btn btn-link text-muted small text-decoration-none fw-semibold py-2"
                onClick={() => { setViewMode("login"); setStatusMessage(""); }}
              >
                <i className="bi bi-arrow-left me-2"></i>Back to Login
              </button>
            </div>
          </Form>
        )}

        {viewMode === "login" && (
          <div className="mt-5 text-center">
            <p className="small text-muted mb-0">
              Don't have an account?{" "}
              <a href="#" className="text-primary fw-bold text-decoration-none" onClick={switchToSignUp}>
                Sign up here
              </a>
            </p>
          </div>
        )}
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .btn-modern-primary {
            background: #7c3aed;
            color: #fff;
            border: none;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 20px -5px rgba(124, 58, 237, 0.4);
        }
        .btn-modern-primary:hover {
            background: #6d28d9;
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -10px rgba(124, 58, 237, 0.5);
        }
        .modern-form .form-control:focus,
        .modern-form .otp-digit-input:focus {
            background: var(--bs-tertiary-bg);
            box-shadow: 0 0 0 2px var(--bs-primary);
            border-color: transparent;
            outline: none;
        }
      `}</style>
    </div>
  );
}

export default LoginForm;
