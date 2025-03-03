import React from "react";
import { Nav, Accordion } from "react-bootstrap";
import { NavLink, useLocation } from "react-router-dom";
import "../App.css";

function SidebarComponent({ items, onTabChange }) {
    const location = useLocation();

    const getActiveClass = (path) => {
        // Highlight only if the current path exactly matches the route
        return location.pathname === path ? "active" : "text-secondary";
    };

    const isExactMatch = (path) => {
        // Match the index route exactly; avoid highlighting for subpaths
        return location.pathname === path;
    };

    return (
        <Nav className="flex-column" variant="pills">
            <Accordion flush>
                {items.map((item) => (
                    <div key={item.id}>
                        {item.subItems ? (
                            <Accordion.Item eventKey={item.id}>
                                <Accordion.Header className="m-0" onClick={() => onTabChange(item.id)}>
                                    {item.label}
                                </Accordion.Header>
                                <Accordion.Body className="p-0">
                                    {item.subItems.map((subItem) => (
                                        <Nav.Item key={subItem.path}>
                                            <Nav.Link
                                                as={NavLink}
                                                to={subItem.path}
                                                className={isExactMatch(subItem.path) ? "active" : "text-secondary"}
                                            >
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
                                    onClick={() => onTabChange(item.id)}
                                >
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
