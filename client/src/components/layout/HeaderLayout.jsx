import { useState } from "react";
import { Nav, Navbar, NavDropdown, Button, Container } from "react-bootstrap";
import "../../App.css";
import ModelComponent from "../modal/LoginModelComponent";
import LoginForm from "../form/LoginForm";
import SignUpForm from "../form/SignUpForm";
import useSession from "../../hooks/useSession";
import { useNavigate } from "react-router-dom";

function ProfileIcon({ userData, showName = true }) {
  return (
    <span className="d-inline-flex align-items-center">
      <div className="position-relative d-inline-block me-2">
          <img
            className="rounded-circle shadow-sm profile-avatar-img"
            src={
              userData.userPhoto
                ? `data:image/jpeg;base64,${userData.userPhoto}`
                : "/profile.jpg"
            }
            alt="profile-pic"
          />
          <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle profile-status-indicator"></span>
      </div>
      {showName && userData.userName && (
        <span className="fw-bold d-none d-sm-inline me-1 small text-emphasis">
            {userData.userName}
        </span>
      )}
    </span>
  );
}

function Header({ showSidebar, toggleSidebar, showSidebarToggle, modalType, setModalType }) {
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);
  const { logout } = useSession(navigate);
  
  const handleModalClose = () => setModalType(null);
  const openLoginModal = () => setModalType("login");
  const openSignUpModal = () => setModalType("signup");

  return (
    <div className="sticky-top w-100 z-1050">
      <Navbar expand="lg" className="glass-header pt-2 pb-1">
        <Container fluid className="px-4">
          <div className="d-flex align-items-center w-100">
            {/* Left: Brand & Toggle */}
            <div className="d-flex align-items-center">
                {showSidebarToggle && typeof toggleSidebar === "function" && (
                  <button
                    onClick={toggleSidebar}
                    className="sidebar-toggle-modern me-3 shadow-sm d-flex align-items-center justify-content-center"
                  >
                    <i className={`bi ${showSidebar ? "bi-x-lg" : "bi-list"}`}></i>
                  </button>
                )}
                
                <Navbar.Brand
                  href={isLoggedIn ? userData.redirect : "/"}
                  className="fw-black d-flex align-items-center gap-2 m-0 text-emphasis-ls-1"
                >
                  <img src="/Header_Icon.png" alt="icon" className="header-logo-img" />
                  <span className="fs-4 d-none d-sm-block">Focus<span className="text-primary">Track</span></span>
                </Navbar.Brand>
            </div>

            {/* Right: Actions */}
            <div className="ms-auto d-flex align-items-center gap-3">
              <Nav className="ms-auto align-items-center">
                {isLoggedIn ? (
                  <NavDropdown
                    title={<ProfileIcon userData={userData} />}
                    id="profile-nav-dropdown"
                    align="end"
                    className="custom-dropdown-modern-auth no-caret"
                  >
                    <div className="dropdown-header p-3 border-bottom mb-1 bg-tertiary">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <img 
                          src={userData.userPhoto ? `data:image/jpeg;base64,${userData.userPhoto}` : "/profile.jpg"} 
                          className="rounded-circle border border-primary p-1 profile-avatar-img-large" 
                          alt="avatar" 
                        />
                        <div className="overflow-hidden">
                          <p className="fw-black mb-0 text-truncate text-emphasis small">{userData.userName}</p>
                          <p className="text-muted small mb-0 opacity-75">
                            {userData.userType === 0 ? 'Administrator' : 'Educator'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <NavDropdown.Item
                        onClick={() => navigate(userData.userType === 0 ? "/admin/settings/general" : "/educator/settings/general")}
                        className="rounded-3 p-2 d-flex align-items-center gap-2 mb-1 transition-2"
                      >
                        <div className="bg-light p-2 rounded-circle shadow-sm d-flex align-items-center justify-content-center icon-box-32">
                          <i className="bi bi-gear text-primary"></i>
                        </div>
                        <span className="fw-bold small">System Settings</span>
                      </NavDropdown.Item>

                      <NavDropdown.Item
                        onClick={() => confirm("End current session?") && logout()}
                        className="text-danger rounded-3 p-2 d-flex align-items-center gap-2 transition-2"
                      >
                        <div className="bg-danger bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center icon-box-32">
                          <i className="bi bi-power"></i>
                        </div>
                        <span className="fw-bold small">Logout System</span>
                      </NavDropdown.Item>
                    </div>
                  </NavDropdown>
                ) : (
                  <button 
                    onClick={openLoginModal}
                    className="btn-futuristic-login shadow-sm"
                  >
                    <i className="bi bi-shield-lock me-2"></i>
                    <span>Portal Access</span>
                  </button>
                )}
              </Nav>
            </div>
          </div>
        </Container>
      </Navbar>


      <ModelComponent show={modalType !== null} onHide={handleModalClose}>
        {modalType === "login" ? (
          <LoginForm switchToSignUp={openSignUpModal} closeModel={handleModalClose} />
        ) : (
          <SignUpForm switchToLogin={openLoginModal} />
        )}
      </ModelComponent>
    </div>
  );
}

export default Header;
