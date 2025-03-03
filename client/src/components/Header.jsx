import { useState } from "react";
import { Nav, Navbar, NavDropdown } from "react-bootstrap";
import "../App.css";
import ModelComponent from "./XLargeModelComponent";
import LoginForm from "../views/Credentials/LoginForm";
import SignUpForm from "../views/Credentials/SignUpForm";
import useSession from "../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';

function ProfileIcon({ userData }) {
  return (
    <span>
      <img
        className="rounded-circle userprofile me-1 img-thumbnail"
        src={userData.userPhoto ? `data:image/jpeg;base64,${userData.userPhoto}` : "/profile.jpg"}
        alt="profile-pic"
        width="40"
        height="40"
      />
    </span>
  );
}

function Header() {
  const [modalType, setModalType] = useState(null); // "login" or "signup"
  const navigate = useNavigate();  // Use navigate here
  const { userData, isLoggedIn, logout } = useSession(navigate);
  const handleModalClose = () => setModalType(null); // Close modal
  const openLoginModal = () => setModalType("login"); // Open login modal
  const openSignUpModal = () => setModalType("signup"); // Open signup modal

  return (
    <div className="header-gradient-background card">     
      <Navbar expand="lg" className="ps-4 pe-4">
        <Navbar.Brand href={isLoggedIn ? userData.redirect : "/"} className="fw-bolder custom-navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={"/ai-technology.png"} alt="brand-icon" style={{width: '30px', height: '30px'}}></img> &nbsp; AI-Driven Student Participant Tracker
        </Navbar.Brand>
        
        {/* Navbar toggle for smaller screens */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          {/* Login/Logout or Profile Dropdown */}
          <Nav>
            {isLoggedIn ? (
              <NavDropdown title={<>{<ProfileIcon userData={userData} />} {userData.userName}</>} id="profile-nav-dropdown" align="end">
                <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown title={<ProfileIcon userData={{}} />} id="profile-nav-dropdown" align="end">
                <NavDropdown.Item onClick={openLoginModal}>Login to Account</NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Modal for both Login and Sign Up */}
      <ModelComponent
        show={modalType !== null}
        onHide={handleModalClose}
        title={modalType === "login" ? "Login into Account" : "Sign Up for an Account"}
      >
        {modalType === "login" ? (
          <LoginForm switchToSignUp={openSignUpModal} closeModel={handleModalClose}/>
        ) : (
          <SignUpForm switchToLogin={openLoginModal}/>
        )}
      </ModelComponent>

      {/* Toast Notifications */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

export default Header;