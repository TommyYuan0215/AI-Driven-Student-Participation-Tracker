import { useState, useEffect } from "react";
import { Accordion } from "react-bootstrap";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import useSession from "../../hooks/useSession";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumbLayout";
import axios from "../../utils/axiosUtils";
import { toast } from "react-toastify";
import { Form, Button } from "react-bootstrap";

function GeneralSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [privateMode, setPrivateMode] = useState(0);
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);

  // State for Emotion Save Interval
  const [savedInterval, setSavedInterval] = useState();
  const [fontSize, setFontSize] = useState("medium");
  const [lackingFocusThreshold, setLackingFocusThreshold] = useState(0);
  const [boredThreshold, setBoredThreshold] = useState(0);
  const [clearingSessions, setClearingSessions] = useState(false);

  // Fetch privacy status when the component mounts
  useEffect(() => {
    const fetchPrivacyStatus = async () => {
      try {
        const response = await axios.get("/settings/get_privacy_status");
        if (response.data.success) {
          setPrivateMode(response.data.privacyStatus); // Directly set the fetched value (0 or 1)
        } else {
          console.error(response.data.message); // Handle error (e.g., not logged in)
        }
      } catch (error) {
        console.error("Error fetching privacy status:", error);
      }
    };

    fetchPrivacyStatus();
  }, []);

  // Fetch saved interval when the component mounts
  useEffect(() => {
    const fetchSavedInterval = async () => {
      try {
        const response = await axios.get("/settings/get_emotion_save_interval");
        if (response.data.success) {
          setSavedInterval(response.data.emotionSaveInterval); // Corrected to match the key returned by the backend
        } else {
          console.error("Error fetching saved interval");
        }
      } catch (error) {
        console.error("Error fetching saved interval:", error);
      }
    };

    fetchSavedInterval();
  }, []);

  // useEffect to save theme cache as cookie
  useEffect(() => {
    const savedTheme = Cookies.get("theme"); // Get theme from cookies
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.querySelector("html").setAttribute("data-bs-theme", "dark");
    }
  }, []);

  useEffect(() => {
    const savedFontSize = Cookies.get("fontSize");
    if (savedFontSize) {
      setFontSize(savedFontSize);
      const size =
        savedFontSize === "small"
          ? "14px"
          : savedFontSize === "large"
          ? "20px"
          : "16px";
      document.documentElement.style.fontSize = size;
    }
  }, []);

  useEffect(() => {
    axios.get('/settings/get_thresholds').then(res => {
      if (res.data.success) {
        setLackingFocusThreshold(res.data.thresholds.thresholdLackingFocus);
        setBoredThreshold(res.data.thresholds.thresholdBored);
      }
    });
  }, []);

  // Dark Mode toggle logic
  const toggleTheme = () => {
    const newDarkMode = !darkMode; // Compute new theme state
    setDarkMode(newDarkMode);
    // Update theme in cookies
    Cookies.set("theme", newDarkMode ? "dark" : "light", { expires: 365 }); // Save for 1 year
    document
      .querySelector("html")
      .setAttribute("data-bs-theme", newDarkMode ? "dark" : "light");
  };

  // Privacy settings toggle logic
  const togglePrivacy = () => {
    if (!userData?.userID) {
      console.error("User not logged in");
      return;
    }

    const confirmationMessage =
      privateMode === 0
        ? "Switching to Public Mode will share your data with all educators for further analysis. Are you sure?"
        : "Switching to Private Mode will keep your data only within your account for personal analysis. Are you sure?";

    const isConfirmed = window.confirm(confirmationMessage);

    if (!isConfirmed) {
      return; // If the user cancels, don't proceed
    }

    const newPrivateMode = privateMode === 0 ? 1 : 0; // Switch between 0 and 1
    setPrivateMode(newPrivateMode);

    // Send the updated privacy status to the backend
    const updatePrivacyStatus = async () => {
      try {
        const response = await axios.post("/settings/update_privacy_settings", {
          id: userData.userID, // Send the userID from userData
          privacyStatus: newPrivateMode, // Send 1 for public, 0 for private
        });

        if (response.status === 200) {
          toast.success("Privacy settings updated successfully!");
        } else {
          toast.error(
            response.data.message || "Failed to update privacy settings"
          );
        }
      } catch (error) {
        console.error("Error updating privacy settings:", error);
        toast.error(
          error.response?.data?.message ||
            "An error occurred while updating privacy settings"
        );
      }
    };

    updatePrivacyStatus();
  };

  // Handle the slider change
  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    setSavedInterval(value); // Update the savedInterval when the slider changes
  };

  // Handle Save Emotional Interval
  const handleSaveInterval = () => {
    const userId = userData.userID;

    if (!userId) {
      console.error("User not logged in");
      return;
    }

    axios
      .post("/settings/update_emotion_save_interval", {
        id: userId,
        emotionSaveInterval: savedInterval, // Send the selected interval value (in seconds)
      })
      .then((response) => {
        toast.success("Emotion save interval updated successfully!");
      })
      .catch((error) => {
        console.error("Error updating interval:", error);
        toast.error("Failed to update interval.");
      });
  };

  const handleSaveThresholds = () => {
    axios.post('/settings/update_thresholds', {
      thresholdLackingFocus: lackingFocusThreshold,
      thresholdBored: boredThreshold
    }).then(response => {
      if (response.data.success) toast.success('Thresholds updated!');
      else toast.error(response.data.message);
    }).catch(() => toast.error('Failed to update thresholds.'));
  };

  const handleClearAllSessions = async () => {
    if (!userData?.userID) {
      toast.error("User not logged in");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete all your session data? This action cannot be undone."
    );
    if (!confirmed) return;
    setClearingSessions(true);
    try {
      const response = await axios.post("/tracking_session/delete_all_sessions", {
        userID: userData.userID,
      });
      if (response.data.success) {
        toast.success(response.data.message || "All session data deleted.");
      } else {
        toast.error(response.data.message || "Failed to delete session data.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete session data."
      );
    } finally {
      setClearingSessions(false);
    }
  };

  const handleFontSizeChange = (e) => {
    setFontSize(e.target.value);
    const size =
      e.target.value === "small"
        ? "14px"
        : e.target.value === "large"
        ? "20px"
        : "16px";
    document.documentElement.style.fontSize = size;
    Cookies.set("fontSize", e.target.value, { expires: 365 });
  };

  // Determine which accordion section to open by default
  let defaultActiveKey = "0"; // Basic Settings by default
  if (isLoggedIn && userData?.userType === 1) defaultActiveKey = "2"; // Educator

  return (
    <>
      <PageTitleBreadcrumb title="General Settings" path={location.pathname} />
      <div className="ms-4 me-4">
        <Accordion defaultActiveKey={defaultActiveKey}>
          {/* Basic Settings */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>Basic Settings</Accordion.Header>
            <Accordion.Body>
              <section className="mb-4">
                <h6 className="fw-semibold">System Theme</h6>
                <p className="text-muted small mb-2">
                  Switch between light and dark mode for the entire system interface. Your preference will be saved for future visits.
                </p>
                <div className="theme-toggle">
                  <label className="toggle-switch mb-0">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={toggleTheme}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="theme-label">
                    {darkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                </div>
              </section>
              <hr />
              {/* Font Size Option */}
              <section className="mb-4">
                <h6 className="fw-semibold">Font Size</h6>
                <p className="text-muted small mb-2">
                  Adjust the font size for better readability across the system.
                </p>
                <div className="d-flex align-items-center gap-3">
                  <Form.Group>
                    <Form.Select value={fontSize} onChange={handleFontSizeChange} style={{ width: 300, maxWidth: 300 }}>
                      <option value="small">Small</option>
                      <option value="medium">Medium (Default)</option>
                      <option value="large">Large</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </section>
            </Accordion.Body>
          </Accordion.Item>

          {/* Educator Section */}
          {isLoggedIn && userData?.userType === 1 && (
          <Accordion.Item eventKey="2">
            <Accordion.Header>Educator Settings</Accordion.Header>
            <Accordion.Body>
              {/* Privacy Section */}
              <section className="mb-4">
                <h6 className="fw-semibold">Privacy Information Settings</h6>
                <p className="text-muted small mb-2">
                  Control who can see your student participation session data.
                </p>
                <div className="model-toggle d-flex align-items-center mt-2">
                  <label className="toggle-switch mb-0">
                    <input
                      type="checkbox"
                      checked={privateMode === 1}
                      onChange={togglePrivacy}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="model-label ms-2">
                    {privateMode === 0
                      ? "Private Mode: Only you can see your own student participation engagement session data"
                      : "Public Mode: Everyone can see your student participation session data"}
                  </span>
                </div>
              </section>

              <hr />

              {/* Emotion Data Save Frequency */}
              <section className="mb-4">
                <h6 className="fw-semibold">Emotion Data Save Frequency</h6>
                <p className="text-muted small mb-2">
                  Set how often emotion data is saved during a session.
                </p>
                <div className="d-flex align-items-end gap-3 mt-3 flex-wrap">
                  <Form.Group className="flex-fill" controlId="formIntervalSlider">
                    <Form.Range
                      min={30}
                      max={300}
                      step={30}
                      value={savedInterval}
                      onChange={handleSliderChange}
                    />
                    <div className="d-flex justify-content-between small text-muted px-1 mt-1">
                      <span>30s</span>
                      <span>1m</span>
                      <span>1.5m</span>
                      <span>2m</span>
                      <span>2.5m</span>
                      <span>3m</span>
                      <span>3.5m</span>
                      <span>4m</span>
                      <span>4.5m</span>
                      <span>5m</span>
                    </div>
                  </Form.Group>
                  <Button
                    variant="success"
                    className="h-50 mt-2"
                    onClick={handleSaveInterval}
                  >
                    <i className="bi bi-floppy me-1"></i> Save Changes
                  </Button>
                </div>
              </section>

              <hr />

              {/* Threshold Settings Section */}
              <section className="mb-4">
                <h6 className="fw-semibold">Predefined Threshold Settings (Alert Toast)</h6>
                <p className="text-muted small mb-2">
                  Set alert thresholds for student engagement.
                </p>
                <div className="d-flex align-items-end gap-3 mt-2 flex-wrap">
                  <Form.Group className="flex-fill" controlId="formLackingFocus">
                    <Form.Label>Lacking Focus (Cumulative) Threshold Value</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter threshold value"
                      min={0}
                      max={100}
                      step={1}
                      value={lackingFocusThreshold}
                      onChange={e => setLackingFocusThreshold(Number(e.target.value))}
                    />
                  </Form.Group>
                  <Form.Group className="flex-fill" controlId="formBored">
                    <Form.Label>Bored (Cumulative) Threshold Value</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter threshold value"
                      min={0}
                      max={100}
                      step={1}
                      value={boredThreshold}
                      onChange={e => setBoredThreshold(Number(e.target.value))}
                    />
                  </Form.Group>
                  <Button variant="success" className="h-50 mt-2" onClick={handleSaveThresholds}>
                    <i className="bi bi-floppy me-1"></i> Save Changes
                  </Button>
                </div>
              </section>

              <hr />

              {/* Danger Zone */}
              <section>
                <div className="alert alert-danger">
                  <h6 className="fw-semibold text-danger mb-2">
                    Danger Zone: Clear All Session Data
                  </h6>
                  <p className="mb-2 small">
                    This will permanently delete all your session data. This action cannot be undone.
                  </p>
                  <Button variant="danger" className="mt-2" onClick={handleClearAllSessions} disabled={clearingSessions}>
                    {clearingSessions ? "Clearing..." : "Clear All Session Data"}
                  </Button>
                </div>
              </section>
            </Accordion.Body>
          </Accordion.Item>
        )}
        </Accordion>
      </div>
    </>
  );
}

export default GeneralSettings;
