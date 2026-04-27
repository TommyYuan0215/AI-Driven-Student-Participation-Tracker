import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import useSession from "../../hooks/useSession";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumbLayout";
import axios from "../../utils/axiosUtils";
import { toast } from "react-toastify";
import { Form, Button, Row, Col, Modal } from "react-bootstrap";

function GeneralSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [privateMode, setPrivateMode] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoggedIn } = useSession(navigate);

  const [savedInterval, setSavedInterval] = useState(30);
  const [fontSize, setFontSize] = useState("medium");
  const [lackingFocusThreshold, setLackingFocusThreshold] = useState(0);
  const [boredThreshold, setBoredThreshold] = useState(0);
  const [clearingSessions, setClearingSessions] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");


  useEffect(() => {
    const fetchSettings = async () => {
      if (!isLoggedIn || userData?.userType !== 1) return;
      try {
        const [privacy, interval, thresholds] = await Promise.all([
          axios.get("/settings/get_privacy_status"),
          axios.get("/settings/get_emotion_save_interval"),
          axios.get("/settings/get_thresholds")
        ]);
        if (privacy.data.success) setPrivateMode(privacy.data.privacyStatus);
        if (interval.data.success) setSavedInterval(interval.data.emotionSaveInterval);
        if (thresholds.data.success) {
          setLackingFocusThreshold(thresholds.data.thresholds.thresholdLackingFocus);
          setBoredThreshold(thresholds.data.thresholds.thresholdBored);
        }
      } catch (err) { console.error("Error fetching settings:", err); }
    };
    if (isLoggedIn) fetchSettings();
  }, [isLoggedIn, userData]);

  useEffect(() => {
    const savedTheme = Cookies.get("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.querySelector("html").setAttribute("data-bs-theme", "dark");
    }
    const savedFontSize = Cookies.get("fontSize");
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    Cookies.set("theme", newDarkMode ? "dark" : "light", { expires: 365 });
    document.querySelector("html").setAttribute("data-bs-theme", newDarkMode ? "dark" : "light");
  };

  const togglePrivacy = () => {
    const newPrivateMode = privateMode === 0 ? 1 : 0;
    setPrivateMode(newPrivateMode);
    axios.post("/settings/update_privacy_settings", {
      id: userData.userID,
      privacyStatus: newPrivateMode,
    }).then(() => toast.success("Privacy mode updated")).catch(() => toast.error("Update failed"));
  };

  const handleSaveInterval = () => {
    axios.post("/settings/update_emotion_save_interval", {
      id: userData.userID,
      emotionSaveInterval: savedInterval,
    }).then(() => toast.success("Frequency updated")).catch(() => toast.error("Save failed"));
  };

  const handleSaveThresholds = () => {
    axios.post('/settings/update_thresholds', {
      thresholdLackingFocus: lackingFocusThreshold,
      thresholdBored: boredThreshold
    }).then(() => toast.success('Thresholds updated!')).catch(() => toast.error('Save failed'));
  };

  const handleFontSizeChange = (e) => {
    const val = e.target.value;
    setFontSize(val);
    const size = val === "small" ? "14px" : val === "large" ? "20px" : "16px";
    document.documentElement.style.fontSize = size;
    Cookies.set("fontSize", val, { expires: 365 });
  };

  const handlePurgeExecution = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete all session history? This action cannot be undone.");
    if (!confirmDelete) return;

    setClearingSessions(true);
    try {
      const response = await axios.post("/tracking_session/delete_all_sessions", {
        userID: userData.userID
      });
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch { toast.error("Purge operation failed"); }
    finally { setClearingSessions(false); }
  };

  return (
    <div className="py-2 fade-in">
      <PageTitleBreadcrumb title="System Preferences" path={location.pathname} />

      <Row className="mt-4 g-4">
        <Col lg={3}>
          <div className="settings-card p-3">
            <div className={`settings-nav-item ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
              <i className="bi bi-sliders2"></i>
              <span>Basic Appearance</span>
            </div>
            {isLoggedIn && userData?.userType === 1 && (
              <div className={`settings-nav-item ${activeTab === 'educator' ? 'active' : ''}`} onClick={() => setActiveTab('educator')}>
                <i className="bi bi-shield-lock"></i>
                <span>Educator Controls</span>
              </div>
            )}
            <div className={`settings-nav-item ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
              <i className="bi bi-tools"></i>
              <span>Maintenance</span>
            </div>
          </div>
        </Col>

        <Col lg={9}>
          <div className="settings-card p-4">
            {activeTab === 'basic' && (
              <div className="fade-in">
                <h6 className="settings-section-title">Visual Customization</h6>

                <div className="modern-toggle-wrapper mb-4">
                  <div>
                    <div className="fw-bold mb-1">High Contrast Mode</div>
                    <div className="small text-muted">Optimize the interface for low-light environments</div>
                  </div>
                  <label className="premium-switch">
                    <input type="checkbox" checked={darkMode} onChange={toggleTheme} />
                    <span className="premium-slider"></span>
                  </label>
                </div>

                <div className="p-4 rounded-4 mb-4" style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)' }}>
                  <Form.Label className="fw-bold mb-3">System-wide Font Scale</Form.Label>
                  <div className="d-flex align-items-center gap-4">
                    <div className="flex-fill">
                      <Form.Select className="rounded-pill px-4" value={fontSize} onChange={handleFontSizeChange}>
                        <option value="small">Compact (14px)</option>
                        <option value="medium">Standard (16px)</option>
                        <option value="large">Spacious (20px)</option>
                      </Form.Select>
                    </div>
                    <div className="text-muted small">Affects all navigation and dashboard elements</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'educator' && (
              <div className="fade-in">
                <h6 className="settings-section-title">Data Privacy & Security</h6>
                <div className="modern-toggle-wrapper mb-4">
                  <div>
                    <div className="fw-bold mb-1">Global Data Visibility</div>
                    <div className="small text-muted">{privateMode === 1 ? 'Broadcasting: Your data is visible to all authorized educators' : 'Stealth: Data remains restricted to your local session analysis'}</div>
                  </div>
                  <label className="premium-switch">
                    <input type="checkbox" checked={privateMode === 1} onChange={togglePrivacy} />
                    <span className="premium-slider"></span>
                  </label>
                </div>

                <h6 className="settings-section-title mt-5">Engine Performance</h6>
                <div className="p-4 rounded-4 mb-4" style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="fw-bold">Emotion Sampling Frequency</div>
                    <span className="badge bg-primary rounded-pill px-3">{savedInterval}s</span>
                  </div>
                  <Form.Range min={30} max={300} step={30} value={savedInterval} onChange={(e) => setSavedInterval(Number(e.target.value))} />
                  <div className="d-flex justify-content-between small text-muted mt-2 px-1">
                    <span>Precision (30s)</span>
                    <span>Balanced</span>
                    <span>Optimized (5m)</span>
                  </div>
                  <Button variant="primary" className="mt-4 rounded-pill px-4" onClick={handleSaveInterval}>
                    Commit sampling rate
                  </Button>
                </div>

                <h6 className="settings-section-title mt-5">Alert Logic</h6>
                <div className="p-4 rounded-4" style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)' }}>
                  <Row className="g-4">
                    <Col md={6}>
                      <Form.Label className="small fw-bold text-muted">Lacking Focus Threshold</Form.Label>
                      <Form.Control type="number" className="rounded-pill px-3" value={lackingFocusThreshold} onChange={e => setLackingFocusThreshold(Number(e.target.value))} />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small fw-bold text-muted">Boredom Threshold</Form.Label>
                      <Form.Control type="number" className="rounded-pill px-3" value={boredThreshold} onChange={e => setBoredThreshold(Number(e.target.value))} />
                    </Col>
                  </Row>
                  <Button variant="primary" className="mt-4 rounded-pill px-4" onClick={handleSaveThresholds}>
                    Update trigger logic
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="fade-in">
                <h6 className="settings-section-title text-danger">Data Integrity & Cleanup</h6>
                <div className="p-4 rounded-4 border border-danger border-opacity-25 shadow-sm" style={{ background: 'rgba(220, 53, 69, 0.02)' }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div>
                      <div className="fw-bold text-danger">Purge Analytical Repository</div>
                      <p className="small text-muted mb-0">Permanently remove all tracking sessions and emotional data from the database.</p>
                    </div>
                  </div>
                  <Button variant="danger" className="rounded-pill px-4" onClick={handlePurgeExecution} disabled={clearingSessions}>
                    {clearingSessions ? 'Purging...' : 'Clear All Session History'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>


    </div>
  );
}

export default GeneralSettings;
