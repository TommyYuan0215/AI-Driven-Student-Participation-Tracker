import React, { useState } from "react";
import { Nav, Accordion } from "react-bootstrap";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import useSession from "../../hooks/useSession";

import "../../App.css";

function SidebarComponent({ items, onTabChange }) {
  const location = useLocation();
  const [activeKey, setActiveKey] = useState(null);

  const getActiveClass = (path) => {
    // Highlight only if the current path exactly matches the route
    return location.pathname === path ? "active" : "text-secondary";
  };

  const isExactMatch = (path) => {
    // Match the index route exactly; avoid highlighting for subpaths
    return location.pathname === path;
  };

  const handleAccordionClick = (itemId) => {
    setActiveKey(activeKey === itemId ? null : itemId);
    onTabChange(itemId);
  };

  const handleNavLinkClick = (itemId) => {
    setActiveKey(null); // Collapse accordion
    onTabChange(itemId);
  };

  const navigate = useNavigate();
  const { logout } = useSession(navigate);

  // Add Logout to the Settings tab
  const enhancedItems = items.map((item) => {
    if (item.label === "Settings") {
      return {
        ...item,
        subItems: [
          ...(item.subItems || []),
          {
            id: "logout",
            path: "#",
            label: "Logout System",
            icon: "bi bi-box-arrow-right",
            onClick: () =>
              confirm("Are you sure you want to log out?") && logout(),
          },
        ],
      };
    }
    return item;
  });

  // Make sure logout button is different with other subItems
  const getSubItemClass = (subItem) => {
    if (subItem.id === "logout") {
      return "text-danger fw-bold ms-3";
    }
    return `${
      isExactMatch(subItem.path) ? "active" : "text-secondary"
    } fw-bold ms-3`;
  };

  return (
    <Nav className="flex-column" variant="pills">
      <Accordion activeKey={activeKey} flush>
        {enhancedItems.map((item) => (
          <div key={item.id}>
            {item.subItems ? (
              <Accordion.Item eventKey={item.id}>
                <Accordion.Header
                  className="m-0"
                  onClick={() => handleAccordionClick(item.id)}
                >
                  <i className={item.icon}></i> &nbsp;
                  {item.label}
                </Accordion.Header>
                <Accordion.Body className="p-0">
                  {item.subItems.map((subItem) => (
                    <Nav.Item key={subItem.path}>
                      <Nav.Link
                        as={subItem.id === "logout" ? "button" : NavLink}
                        to={subItem.id === "logout" ? undefined : subItem.path}
                        className={getSubItemClass(subItem)}
                        onClick={subItem.onClick}
                        style={
                          subItem.id === "logout"
                            ? {
                                cursor: "pointer",
                                border: "none",
                                background: "none",
                                width: "100%",
                                textAlign: "left",
                              }
                            : {}
                        }
                      >
                        <i className={subItem.icon}></i> &nbsp;
                        {subItem.label}
                      </Nav.Link>
                      <hr className="m-0" />
                    </Nav.Item>
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            ) : (
              <Nav.Item>
                <Nav.Link
                  as={NavLink}
                  to={item.path}
                  className={`${getActiveClass(item.path)} fw-bold`}
                  onClick={() => handleNavLinkClick(item.id)}
                >
                  <i className={item.icon}></i> &nbsp;
                  {item.label}
                </Nav.Link>
                <hr className="m-0" />
              </Nav.Item>
            )}
          </div>
        ))}
      </Accordion>
    </Nav>
  );
}

export default SidebarComponent;
