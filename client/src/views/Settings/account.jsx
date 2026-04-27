import { useState, useEffect } from "react";
import { Table, Form, Button, Row, Col } from "react-bootstrap";
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
  const [imageFile, setImageFile] = useState(null);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const previewImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target.result);
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleFormSaveChanges = async (e) => {
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
    } catch (err) {
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
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  if (!isLoggedIn) return <p>Access Denied.</p>;

  return (
    <div className="py-2 fade-in">
      <PageTitleBreadcrumb title="Account Management" path={location.pathname} />

      <Row className="mt-4 g-4">
        <Col lg={8}>
          <div className="settings-card p-4">
            <Form onSubmit={handleFormSaveChanges}>
              <div className="d-flex align-items-center gap-4 mb-5 pb-4 border-bottom">
                <div className="avatar-upload-container">
                  <img src={imagePreview} className="avatar-preview" alt="Profile" />
                  <label htmlFor="avatar-input" className="avatar-edit-btn">
                    <i className="bi bi-camera-fill"></i>
                  </label>
                  <input type="file" id="avatar-input" className="d-none" onChange={previewImage} />
                </div>
                <div>
                  <h5 className="fw-bold mb-1">{userData.userName}</h5>
                  <p className="text-muted small mb-3">Update your profile picture and personal details</p>
                  <Button type="button" variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={handleResetPhoto} disabled={imagePreview === "/profile.jpg"}>
                    Reset Photo
                  </Button>
                </div>
              </div>

              <h6 className="settings-section-title">Core Identity</h6>
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <div className="settings-input-group">
                    <Form.Label className="form-label">Full Name</Form.Label>
                    <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your display name" />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="settings-input-group">
                    <Form.Label className="form-label">Email Address</Form.Label>
                    <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="name@focustrack.com" />
                  </div>
                </Col>
              </Row>

              <h6 className="settings-section-title mt-5">Security Authorization</h6>
              <div className="p-4 rounded-4 mb-4" style={{ background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <Form.Label className="small fw-bold text-primary mb-2">Current Password (Required for any changes)</Form.Label>
                <Form.Control type="password" name="currentpass" value={formData.currentpass} onChange={handleInputChange} className="rounded-pill px-3 shadow-sm" placeholder="Verify your identity..." />
              </div>

              <h6 className="settings-section-title mt-5">Credentials Update (Optional)</h6>
              <Row className="g-3 mb-5">
                <Col md={6}>
                  <div className="settings-input-group">
                    <Form.Label className="form-label">New Password</Form.Label>
                    <Form.Control type="password" name="newpass" value={formData.newpass} onChange={handleInputChange} placeholder="Min. 8 characters" />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="settings-input-group">
                    <Form.Label className="form-label">Confirm New Password</Form.Label>
                    <Form.Control type="password" name="confirmpass" value={formData.confirmpass} onChange={handleInputChange} placeholder="Repeat new password" />
                  </div>
                </Col>
              </Row>

              <div className="d-flex gap-5 pt-4 border-top justify-content-center">
                <Button variant="primary" type="submit" className="rounded-pill px-5 py-2 fw-bold shadow-sm" disabled={!isMandatoryFilled}>
                  Save Changes
                </Button>
                <Button variant="light" className="rounded-pill px-4" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </Col>

        <Col lg={4}>
          <div className="position-sticky" style={{ top: '2rem' }}>
            <ProfileCard userData={userData} />

            <div className="settings-card p-4 mt-4 bg-light bg-opacity-50">
              <h6 className="fw-bold small mb-3">System Insights</h6>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-white p-2 rounded-3 shadow-sm">
                  <i className="bi bi-shield-check text-success"></i>
                </div>
                <div className="small">
                  <div className="fw-bold">Two-Factor Authenticated</div>
                  <div className="text-muted">Secured by cloud biometric engine</div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white p-2 rounded-3 shadow-sm">
                  <i className="bi bi-clock-history text-primary"></i>
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
    </div>
  );
}

export default AccountSettings;
