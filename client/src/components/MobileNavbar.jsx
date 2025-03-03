import React, { useState } from "react";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "../App.css";

function MobileNavbar({ role }) {
    const [isNavOpen, setNavOpen] = useState(false); // State to handle the opening/closing of the navbar

    const toggleNavbar = () => setNavOpen(!isNavOpen); // Toggle nav state

    return (
        <div>
            {/* Navbar for Mobile */}
            <Navbar expand="lg" className="d-block d-md-none"> 
                {/* d-block d-md-none ensures this navbar is only shown on mobile */}
                <Navbar.Toggle aria-controls="mobile-navbar-nav" onClick={toggleNavbar} /> {/* Hamburger menu */}
                <Navbar.Collapse id="mobile-navbar-nav" in={isNavOpen}>
                    {/* Collapse items when nav is closed */}
                    <Nav className="flex-column">
                        {links.map((item) => (
                            <Nav.Item key={item.path}>
                                <Nav.Link as={NavLink} to={item.path} onClick={toggleNavbar}>
                                    {item.label}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                        {/* Profile Dropdown (common across all roles) */}
                        <NavDropdown title="Profile" id="profile-dropdown">
                            <NavDropdown.Item as={NavLink} to="/profile" onClick={toggleNavbar}>
                                My Profile
                            </NavDropdown.Item>
                            <NavDropdown.Item as={NavLink} to="/logout" onClick={toggleNavbar}>
                                Logout
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </div>
    );
}

export default MobileNavbar;
