import React, { useState } from "react";
import { Nav, Accordion } from "react-bootstrap";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import useSession from "../../hooks/useSession";

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  subItems?: {
    label: string;
    path: string;
    icon: string;
    isLogout?: boolean;
    onClick?: () => void;
  }[];
}

export interface SidebarComponentProps {
  items: SidebarItem[];
  onTabChange: (tabId: string) => void;
  activeTab?: string;
}

function SidebarComponent({ items, onTabChange, activeTab }: SidebarComponentProps) {
  const location = useLocation();
  const [activeKey, setActiveKey] = useState(null);
  const navigate = useNavigate();
  const { logout } = useSession(navigate);

  const getActiveClass = (path) => {
    return location.pathname === path ? "active-link" : "inactive-link";
  };

  const handleAccordionClick = (itemId) => {
    setActiveKey(activeKey === itemId ? null : itemId);
    onTabChange(itemId);
  };

  const handleMainLinkClick = (itemId) => {
    setActiveKey(null); // Collapse when going to top-level
    onTabChange(itemId);
  };

  const handleSubLinkClick = (itemId) => {
    // DO NOT collapse when clicking sub-items
    onTabChange(itemId);
  };

  const enhancedItems = items;

  return (
    <div className="sidebar-container py-2 px-3 h-100">
      <Nav className="flex-column gap-2" variant="pills">
        <Accordion activeKey={activeKey} flush>
          {enhancedItems.map((item) => (
            <div key={item.id} className="mb-1">
              {item.subItems ? (
                <Accordion.Item eventKey={item.id} className="border-0 bg-transparent">
                  <Accordion.Header
                    className="sidebar-header-modern rounded-3"
                    onClick={() => handleAccordionClick(item.id)}
                  >
                    <div className="d-flex align-items-center w-100">
                      <i className={`${item.icon} me-3 icon-gradient`}></i>
                      <span className="fw-bold small text-uppercase text-start" style={{ letterSpacing: '1px' }}>{item.label}</span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="ps-4 pe-0 py-2 border-0 bg-transparent">
                    <div className="d-flex flex-column gap-1 border-start ms-2 ps-3" style={{ borderColor: 'var(--bs-border-color) !important' }}>
                      {item.subItems.map((subItem) => (
                        <Nav.Item key={subItem.path}>
                          {subItem.isLogout ? (
                            <button
                              className="sub-nav-link logout-link"
                              onClick={subItem.onClick || (() => handleSubLinkClick(item.id))}
                              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                            >
                              <i className={`${subItem.icon} me-2`}></i>
                              <span>{subItem.label}</span>
                            </button>
                          ) : (
                            <Nav.Link
                              as={NavLink}
                              to={subItem.path}
                              className={`sub-nav-link ${getActiveClass(subItem.path)}`}
                              onClick={() => handleSubLinkClick(item.id)}
                            >
                              <i className={`${subItem.icon} me-2`}></i>
                              <span>{subItem.label}</span>
                            </Nav.Link>
                          )}
                        </Nav.Item>
                      ))}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ) : (
                <Nav.Item>
                  <Nav.Link
                    as={NavLink}
                    to={item.path}
                    className={`sidebar-link-modern d-flex align-items-center ${getActiveClass(item.path)}`}
                    onClick={() => handleMainLinkClick(item.id)}
                  >
                    <i className={`${item.icon} me-3 icon-gradient`}></i>
                    <span className="fw-bold small text-uppercase text-start" style={{ letterSpacing: '1px' }}>{item.label}</span>
                  </Nav.Link>
                </Nav.Item>
              )}
            </div>
          ))}
        </Accordion>
      </Nav>
    </div>
  );
}

export default SidebarComponent;
