import { useState } from "react";
import { Nav, Navbar, NavDropdown, Button } from "react-bootstrap";
import "../../App.css";
import ModelComponent from "../modal/LoginModelComponent";
import LoginForm from "../form/LoginForm";
import SignUpForm from "../form/SignUpForm";
import useSession from "../../hooks/useSession";
import { useNavigate } from "react-router-dom";

function ProfileIcon({ userData, showName = true }) {
  return (
    <span>
      <img
        className="rounded-circle userprofile me-1 img-thumbnail"
        src={
          userData.userPhoto
            ? `data:image/jpeg;base64,${userData.userPhoto}`
            : "/profile.jpg"
        }
        alt="profile-pic"
        style={{ width: "40px", height: "40px", objectFit: "cover" }}
      />
      &nbsp;
      {showName && userData.userName && <span>{userData.userName}</span>}
    </span>
  );
}

function Header({ showSidebar, toggleSidebar, showSidebarToggle }) {
  const [modalType, setModalType] = useState(null); // "login" or "signup"
  const navigate = useNavigate(); // Use navigate here
  const { userData, isLoggedIn } = useSession(navigate);
  const { logout } = useSession(navigate);
  const handleModalClose = () => setModalType(null); // Close modal
  const openLoginModal = () => setModalType("login"); // Open login modal
  const openSignUpModal = () => setModalType("signup"); // Open signup modal

  return (
    <div className="header-gradient-background">
      <Navbar expand="lg" className="ps-4 pe-4 d-flex align-items-center">
        {/* Sidebar Toggle Button (if showSidebarToggle is true) */}
        {showSidebarToggle && typeof toggleSidebar === "function" && (
          <Button
            className="sidebar-toggle me-3 d-none d-md-inline-flex align-items-center"
            onClick={toggleSidebar}
            variant="light"
            size="sm"
            aria-label="Toggle sidebar"
            style={{
              boxShadow: "none",
              height: "48px",
              width: "48px",
              padding: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <i className="bi bi-list" style={{ fontSize: "2rem" }}></i>
          </Button>
        )}
        <Navbar.Brand
          href={isLoggedIn ? userData.redirect : "/"}
          className="fw-bolder custom-navbar-brand"
          style={{ display: "flex", alignItems: "center" }}
        >
          <img
            src={"/ai-technology.png"}
            alt="brand-icon"
            style={{ width: "30px", height: "30px" }}
          ></img>{" "}
          &nbsp; AI-Driven Student Participantion Tracker
        </Navbar.Brand>

        {/* Navbar toggle for smaller screens */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav>
            {isLoggedIn ? (
              <NavDropdown
                title={<ProfileIcon userData={userData} />}
                id="profile-nav-dropdown"
                align="end"
                className="custom-nav-dropdown fw-bold"
              >
                <NavDropdown.Item
                  onClick={() =>
                    confirm("Are you sure you want to log out?") && logout()
                  }
                  className="logout-item d-flex align-items-center"
                >
                  <i className="bi bi-box-arrow-right me-2"></i> Logout System
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link
                onClick={openLoginModal}
                className="d-flex align-items-center"
              >
                <span className="ms-2 fw-bold" style={{ lineHeight: "40px" }}>
                  Login Now
                </span>
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Modal for both Login and Sign Up */}
      <ModelComponent show={modalType !== null} onHide={handleModalClose}>
        {modalType === "login" ? (
          <LoginForm
            switchToSignUp={openSignUpModal}
            closeModel={handleModalClose}
          />
        ) : (
          <SignUpForm switchToLogin={openLoginModal} />
        )}
      </ModelComponent>
    </div>
  );
}

export default Header;
