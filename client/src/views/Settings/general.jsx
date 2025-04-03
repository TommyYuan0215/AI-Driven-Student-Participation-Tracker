import { useState, useEffect } from "react";
import { Accordion } from "react-bootstrap";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import useSession from "../../utils/sessionUtils";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumb";
import axios from "../../utils/axios_configure";
import { toast } from "react-toastify";

function GeneralSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [privateMode, setPrivateMode] = useState(0);
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);

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

  // useEffect to save theme cache as cookie
  useEffect(() => {
    const savedTheme = Cookies.get("theme"); // Get theme from cookies
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.querySelector("html").setAttribute("data-bs-theme", "dark");
    }
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
    // Confirm the change with the user
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

  return (
    <>
      <PageTitleBreadcrumb title="General Settings" path={location.pathname} />
      <div className="ms-4 me-4">
        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Basic Settings</Accordion.Header>
            <Accordion.Body>
              {/* Dark Mode Toggle */}
              <>
                <p>System Theme</p>
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
              </>
              <hr />
            </Accordion.Body>
          </Accordion.Item>

          {/* Admin Section */}
          {isLoggedIn && userData?.userType === 0 && (
            <Accordion.Item eventKey="1">
              <Accordion.Header>Admin Settings</Accordion.Header>
              <Accordion.Body>
                <p>Admin-specific settings can go here...</p>
              </Accordion.Body>
            </Accordion.Item>
          )}

          {/* Educator Section */}
          {isLoggedIn && userData?.userType === 1 && (
            <Accordion.Item eventKey="2">
              <Accordion.Header>Educator Settings</Accordion.Header>
              <Accordion.Body>
                <>
                  <p>Privacy Information Settings</p>
                  <div className="model-toggle d-flex align-items-center">
                    <label className="toggle-switch mb-0">
                      <input
                        type="checkbox"
                        checked={privateMode === 1} // True when public (1)
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
                </>
              </Accordion.Body>
            </Accordion.Item>
          )}
        </Accordion>
      </div>
    </>
  );
}

export default GeneralSettings;
