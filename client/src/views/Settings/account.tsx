import { useState, useEffect } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import useSession from "../../hooks/useSession";
import { toast } from "react-toastify";
import axios from "../../utils/axiosUtils";
import ProfileCard from "../../components/card/ProfileCard";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumbLayout";

function AccountSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoggedIn, refetch } = useSession(navigate);
  const [imagePreview, setImagePreview] = useState("/profile.jpg");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [twoFactorMode, setTwoFactorMode] = useState(1);

  const [systemStatus, setSystemStatus] = useState({
    neuralEngine: "Checking...",
    database: "Checking...",
    faceEngine: "Checking...",
    smtp: "Checking...",
  });

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await axios.get("/settings/get_system_status");
        if (response.data.success) {
          setSystemStatus({
            neuralEngine: response.data.neuralEngine,
            database: response.data.database,
            faceEngine: response.data.faceEngine,
            smtp: response.data.smtp,
          });
        }
      } catch (err) {
        console.error("Failed to fetch system status", err);
        setSystemStatus({
          neuralEngine: "Offline",
          database: "Offline",
          faceEngine: "Offline",
          smtp: "Offline",
        });
      }
    };
    if (isLoggedIn) {
      fetchSystemStatus();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (userData && userData.user2FA !== undefined) {
      setTwoFactorMode(userData.user2FA);
    }
  }, [userData]);

  const toggleTwoFactor = () => {
    const newTwoFactorMode = twoFactorMode === 0 ? 1 : 0;
    setTwoFactorMode(newTwoFactorMode);
    
    axios.post("/settings/update_2fa_settings", {
      twoFactorStatus: newTwoFactorMode,
    })
    .then((res) => {
      if (res.data.success) {
        toast.success(res.data.message || "Two-Factor Authentication updated");
        if (userData) {
          const updatedUserData = { ...userData, user2FA: newTwoFactorMode };
          sessionStorage.setItem("userData", JSON.stringify(updatedUserData));
          refetch();
        }
      } else {
        toast.error("Failed to update Two-Factor Authentication");
        setTwoFactorMode(twoFactorMode);
      }
    })
    .catch(() => {
      toast.error("Update failed");
      setTwoFactorMode(twoFactorMode);
    });
  };

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    currentpass: "",
    newpass: "",
    confirmpass: "",
  });

  useEffect(() => {
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        id: userData.userID || "",
        name: userData.userName || "",
        email: userData.userEmail || "",
      }));
      if (userData.userPhoto) {
        setImagePreview(`data:image/jpeg;base64,${userData.userPhoto}`);
      }
    }
  }, [userData]);

  const [isMandatoryFilled, setIsMandatoryFilled] = useState(false);
  useEffect(() => {
    setIsMandatoryFilled(
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.currentpass.trim() !== ""
    );
  }, [formData.name, formData.email, formData.currentpass]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const previewImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setImagePreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleFormSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMandatoryFilled) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }
    if (formData.newpass && formData.newpass !== formData.confirmpass) {
      toast.error("New passwords do not match!");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("id", formData.id);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("currentPassword", formData.currentpass);
      if (formData.newpass) {
        formDataToSend.append("newPassword", formData.newpass);
        formDataToSend.append("confirmPassword", formData.confirmpass);
      }
      if (imageFile) formDataToSend.append("profileImage", imageFile);

      const response = await axios.post("/settings/update_account", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        await refetch();
        setFormData(p => ({ ...p, currentpass: "", newpass: "", confirmpass: "" }));
        setImageFile(null);
        toast.success("Account profile updated!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleResetPhoto = async () => {
    if (!window.confirm("Reset to default profile picture?")) return;
    if (!formData.currentpass) {
      toast.error("Enter your current password to authorize this action.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("id", userData.userID);
      fd.append("resetPhoto", "true");
      fd.append("currentPassword", formData.currentpass);
      await axios.post("/settings/reset_account_photo", fd);
      setImagePreview("/profile.jpg");
      await refetch();
      toast.success("Photo reset");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  if (!isLoggedIn) return <p>Access Denied.</p>;

  return (
    <div className="py-2 fade-in">
      <PageTitleBreadcrumb title="Account Management" path={location.pathname} />

      <Row className="mt-4 g-4">
        <Col lg={8}>
          <Form onSubmit={handleFormSaveChanges}>
            
            {/* Header Card: Profile Photo & Header Details */}
            <div className="card border rounded-4 shadow-sm p-4 mb-4" style={{ background: 'var(--bs-body-bg)', borderColor: 'var(--bs-border-color-translucent)' }}>
              <div className="d-flex align-items-center gap-4">
                <div className="avatar-upload-container position-relative">
                  <img src={imagePreview} className="avatar-preview" alt="Profile" />
                  <label htmlFor="avatar-input" className="avatar-edit-btn">
                    <i className="bi bi-camera-fill"></i>
                  </label>
                  <input type="file" id="avatar-input" className="d-none" onChange={previewImage} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 notranslate" style={{ color: 'var(--bs-emphasis-color)' }}>{userData.userName}</h4>
                  <p className="text-muted small mb-3">Update your profile picture and personal details</p>
                  <Button type="button" variant="outline-danger" size="sm" className="rounded-pill px-3 fw-bold" onClick={handleResetPhoto} disabled={imagePreview === "/profile.jpg"}>
                    <i className="bi bi-trash-fill me-1"></i> Reset Photo
                  </Button>
                </div>
              </div>
            </div>

            {/* Card 1: Core Identity */}
            <div className="card border rounded-4 shadow-sm p-4 mb-4" style={{ background: 'var(--bs-body-bg)', borderColor: 'var(--bs-border-color-translucent)' }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-person-badge fs-5 text-primary"></i>
                <h6 className="fw-bold mb-0" style={{ color: 'var(--bs-emphasis-color)' }}>Core Identity</h6>
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-muted mb-2">Full Name</Form.Label>
                    <div className="input-group premium-input-group">
                      <span className="input-group-text bg-transparent border-end-0 text-muted">
                        <i className="bi bi-person"></i>
                      </span>
                      <Form.Control 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        placeholder="Your display name"
                        className="border-start-0 py-3"
                        style={{ background: 'transparent' }}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-muted mb-2">Email Address</Form.Label>
                    <div className="input-group premium-input-group">
                      <span className="input-group-text bg-transparent border-end-0 text-muted">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <Form.Control 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="name@focustrack.com"
                        className="border-start-0 py-3"
                        style={{ background: 'transparent' }}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Card 2: Security & Authentication */}
            <div className="card border rounded-4 shadow-sm p-4 mb-4" style={{ background: 'var(--bs-body-bg)', borderColor: 'var(--bs-border-color-translucent)' }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-shield-lock fs-5 text-primary"></i>
                <h6 className="fw-bold mb-0" style={{ color: 'var(--bs-emphasis-color)' }}>Security Authorization</h6>
              </div>
              
              <div className="p-3 rounded-4 mb-4" style={{ background: 'rgba(124, 58, 237, 0.03)', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                <Form.Label className="small fw-bold text-primary mb-2">Current Password (Required to authorize changes)</Form.Label>
                <div className="input-group premium-input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <Form.Control 
                    type="password" 
                    name="currentpass" 
                    value={formData.currentpass} 
                    onChange={handleInputChange} 
                    className="border-start-0 py-3"
                    style={{ background: 'transparent' }}
                    placeholder="Verify your identity..."
                  />
                </div>
              </div>

              {/* 2FA Toggle Switch */}
              <div className="d-flex align-items-center justify-content-between p-3 rounded-4 bg-light bg-opacity-50" style={{ border: '1px solid var(--bs-border-color-translucent)' }}>
                <div>
                  <div className="fw-bold mb-1" style={{ color: 'var(--bs-emphasis-color)' }}>Two-Factor Authentication (2FA)</div>
                  <div className="small text-muted">{twoFactorMode === 1 ? 'Require a 6-digit OTP email code during login' : 'Bypass OTP verification and login immediately'}</div>
                </div>
                <label className="premium-switch mb-0">
                  <input type="checkbox" checked={twoFactorMode === 1} onChange={toggleTwoFactor} />
                  <span className="premium-slider"></span>
                </label>
              </div>
            </div>

            {/* Card 3: Password Update (Optional) */}
            <div className="card border rounded-4 shadow-sm p-4 mb-4" style={{ background: 'var(--bs-body-bg)', borderColor: 'var(--bs-border-color-translucent)' }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-key fs-5 text-primary"></i>
                <h6 className="fw-bold mb-0" style={{ color: 'var(--bs-emphasis-color)' }}>Credentials Update (Optional)</h6>
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-muted mb-2">New Password</Form.Label>
                    <div className="input-group premium-input-group">
                      <span className="input-group-text bg-transparent border-end-0 text-muted">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <Form.Control 
                        type="password" 
                        name="newpass" 
                        value={formData.newpass} 
                        onChange={handleInputChange} 
                        placeholder="Min. 8 characters"
                        className="border-start-0 py-3"
                        style={{ background: 'transparent' }}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-muted mb-2">Confirm New Password</Form.Label>
                    <div className="input-group premium-input-group">
                      <span className="input-group-text bg-transparent border-end-0 text-muted">
                        <i className="bi bi-shield-fill-check"></i>
                      </span>
                      <Form.Control 
                        type="password" 
                        name="confirmpass" 
                        value={formData.confirmpass} 
                        onChange={handleInputChange} 
                        placeholder="Repeat new password"
                        className="border-start-0 py-3"
                        style={{ background: 'transparent' }}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3 justify-content-end mt-4">
              <Button 
                variant="primary" 
                type="submit" 
                className="rounded-pill px-5 py-3 fw-bold shadow-sm btn-modern-primary border-0" 
                disabled={!isMandatoryFilled}
              >
                Save Changes
              </Button>
              <Button 
                variant="light" 
                className="rounded-pill px-4 py-3 fw-semibold border"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>

          </Form>
        </Col>

        <Col lg={4}>
          <div className="position-sticky" style={{ top: '2rem' }}>
            <ProfileCard userData={userData} />

            <div className="settings-card p-4 mt-4 bg-light bg-opacity-50 border rounded-4 shadow-sm" style={{ borderColor: 'var(--bs-border-color-translucent)' }}>
              <h6 className="fw-bold small mb-4">System Insights</h6>
              
              {/* 2FA Status View Only */}
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-light">
                <div className={`p-2 rounded-3 shadow-sm bg-white ${twoFactorMode === 1 ? 'text-success' : 'text-secondary'}`}>
                  <i className={`bi ${twoFactorMode === 1 ? 'bi-shield-check' : 'bi-shield-slash'}`}></i>
                </div>
                <div className="small flex-fill">
                  <div className="fw-bold">Two-Factor Auth</div>
                  <div className="text-muted">Status of login verification</div>
                </div>
                <span className={`badge rounded-pill px-3 ${twoFactorMode === 1 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                  {twoFactorMode === 1 ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* Neural Engine Status */}
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-light">
                <div className={`p-2 rounded-3 shadow-sm bg-white ${systemStatus.neuralEngine === 'Loaded' ? 'text-success' : 'text-danger'}`}>
                  <i className="bi bi-cpu"></i>
                </div>
                <div className="small flex-fill">
                  <div className="fw-bold">Neural Engine</div>
                  <div className="text-muted">LiteRT model interpreter</div>
                </div>
                <span className={`badge rounded-pill px-3 ${systemStatus.neuralEngine === 'Loaded' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                  {systemStatus.neuralEngine}
                </span>
              </div>

              {/* Face Analysis Status */}
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-light">
                <div className={`p-2 rounded-3 shadow-sm bg-white ${systemStatus.faceEngine === 'Loaded' ? 'text-success' : 'text-danger'}`}>
                  <i className="bi bi-eye"></i>
                </div>
                <div className="small flex-fill">
                  <div className="fw-bold">Face Analysis</div>
                  <div className="text-muted">InsightFace detector model</div>
                </div>
                <span className={`badge rounded-pill px-3 ${systemStatus.faceEngine === 'Loaded' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                  {systemStatus.faceEngine}
                </span>
              </div>

              {/* SMTP Mailer Status */}
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-light">
                <div className={`p-2 rounded-3 shadow-sm bg-white ${systemStatus.smtp === 'Configured' ? 'text-success' : 'text-warning'}`}>
                  <i className="bi bi-envelope"></i>
                </div>
                <div className="small flex-fill">
                  <div className="fw-bold">SMTP Mailer</div>
                  <div className="text-muted">Gmail verification service</div>
                </div>
                <span className={`badge rounded-pill px-3 ${systemStatus.smtp === 'Configured' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                  {systemStatus.smtp}
                </span>
              </div>

              {/* Database Status */}
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-light">
                <div className={`p-2 rounded-3 shadow-sm bg-white ${systemStatus.database === 'Online' ? 'text-success' : 'text-danger'}`}>
                  <i className="bi bi-database"></i>
                </div>
                <div className="small flex-fill">
                  <div className="fw-bold">Database Server</div>
                  <div className="text-muted">MySQL service connection</div>
                </div>
                <span className={`badge rounded-pill px-3 ${systemStatus.database === 'Online' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                  {systemStatus.database}
                </span>
              </div>

              {/* Last Activity */}
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white p-2 rounded-3 shadow-sm text-primary">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div className="small">
                  <div className="fw-bold">Last Activity</div>
                  <div className="text-muted">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <style>{`
        .fw-black { font-weight: 900; }
        .premium-input-group .form-control {
            border: 1px solid var(--bs-border-color);
            background: transparent;
            transition: all 0.3s ease;
        }
        .premium-input-group .form-control:focus {
            box-shadow: none;
            border-color: var(--bs-primary);
            background: transparent;
        }
        .premium-input-group .input-group-text {
            border: 1px solid var(--bs-border-color);
            background: transparent;
            transition: all 0.3s ease;
        }
        .premium-input-group:focus-within .input-group-text,
        .premium-input-group:focus-within .form-control {
            border-color: var(--bs-primary) !important;
        }
        .btn-modern-primary {
            background: #7c3aed;
            color: #fff;
            box-shadow: 0 10px 20px -5px rgba(124, 58, 237, 0.4);
            transition: all 0.3s ease;
        }
        .btn-modern-primary:hover:not(:disabled) {
            background: #6d28d9;
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -10px rgba(124, 58, 237, 0.5);
        }
      `}</style>
    </div>
  );
}

export default AccountSettings;
