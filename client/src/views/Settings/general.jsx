import { useState, useEffect } from "react";
import { Accordion } from "react-bootstrap";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import useSession from "../../utils/sessionUtils";
import PageTitleBreadcrumb from "../../components/PageTitleBreadcrumb";

function GeneralSettings() {
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();
    const { userData, isLoggedIn } = useSession(navigate);

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
      document.querySelector("html").setAttribute("data-bs-theme", newDarkMode ? "dark" : "light");
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
                                    <input type="checkbox" checked={darkMode} onChange={toggleTheme} />
                                    <span className="slider"></span>
                                </label>
                                <span className="theme-label">{darkMode ? "Dark Mode" : "Light Mode"}</span>
                            </div>
                        </>
                        <hr/>
                        <>
                        <p>Model Selection</p>
                        <div className="d-flex flex-column gap-3">
                            <div className="model-toggle d-flex align-items-center">
                                <label className="toggle-switch mb-0">
                                    <input 
                                        type="checkbox" checked="true"
                                        // checked={modelSettings.emotionModel}
                                        // onChange={() => toggleModel('emotionModel')}
                                    />
                                    <span className="slider"></span>
                                </label>
                                <span className="model-label ms-2">Face Emotional Recognition Model</span>
                            </div>

                            <div className="model-toggle d-flex align-items-center">
                                <label className="toggle-switch mb-0">
                                    <input 
                                        type="checkbox" checked="true"
                                        // checked={modelSettings.attentionModel}
                                        // onChange={() => toggleModel('attentionModel')}
                                    />
                                    <span className="slider"></span>
                                </label>
                                <span className="model-label ms-2">Body Language Analyser Model</span>
                            </div>

                            <div className="model-toggle d-flex align-items-center">
                                <label className="toggle-switch mb-0">
                                    <input 
                                        type="checkbox" checked="true"
                                        // checked={modelSettings.engagementModel}
                                        // onChange={() => toggleModel('engagementModel')}
                                    />
                                    <span className="slider"></span>
                                </label>
                                <span className="model-label ms-2">Gaze Tracking Model</span>
                            </div>
                        </div>
                        </>

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
                    <p>Educator-specific settings can go here...</p>
                    </Accordion.Body>
                </Accordion.Item>
                )}
            </Accordion>
        </div>
        </>
    );
}

export default GeneralSettings;