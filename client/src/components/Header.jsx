import { useState } from "react";
import { Nav, Navbar, NavDropdown } from "react-bootstrap";
import "../App.css";
import ModelComponent from "./LoginModelComponent";
import LoginForm from "../views/Credentials/LoginForm";
import SignUpForm from "../views/Credentials/SignUpForm";
import useSession from "../utils/sessionUtils";
import { useNavigate } from "react-router-dom";

function ProfileIcon({ userData, showName = true }) {
  return (
    <span>
      <img
        className="rounded-circle userprofile me-1 img"
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

function Header() {
  const [modalType, setModalType] = useState(null); // "login" or "signup"
  const navigate = useNavigate(); // Use navigate here
  const { userData, isLoggedIn } = useSession(navigate);
  const handleModalClose = () => setModalType(null); // Close modal
  const openLoginModal = () => setModalType("login"); // Open login modal
  const openSignUpModal = () => setModalType("signup"); // Open signup modal

  return (
    <div className="header-gradient-background">
      <Navbar expand="lg" className="ps-4 pe-4">
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
              <Nav.Item>
                <Nav.Link className="px-3">
                  <ProfileIcon userData={userData} />
                </Nav.Link>
              </Nav.Item>
            ) : (
              <NavDropdown
                title={<ProfileIcon userData={{}} />}
                id="profile-nav-dropdown"
                align="end"
              >
                <NavDropdown.Item onClick={openLoginModal}>
                  Login to Account
                </NavDropdown.Item>
              </NavDropdown>
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
