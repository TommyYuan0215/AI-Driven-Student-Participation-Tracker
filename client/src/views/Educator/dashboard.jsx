import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import useSession from "../../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useLoadingState } from "../../utils/loadingUtils";

function EducatorDashboard() {
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);
  const {
    data: userList,
    loading,
    refetch,
  } = useLoadingState("/usermanagement/get_user_data", []);

  const [notifications, setNotifications] = useState("");

  if (!isLoggedIn) {
    navigate("/");
    return null;
  }

  return (
    <Container>
      {loading ? (
        <LoadingSpinner text="Loading dashboard..." />
      ) : (
        <>
          <div className="p-4">
            <h4 className="ps-3">Hello, {userData.userName} 👋</h4>
          </div>

          {/* Notification Area  */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h6>Notifications</h6>
                </div>
                <div
                  className="card-body"
                  style={{
                    maxHeight: "250px",
                    overflowY: "auto",
                  }}
                >
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <Alert key={notif.id} variant={notif.type}>
                        {notif.message}
                      </Alert>
                    ))
                  ) : (
                    <div className="d-flex justify-content-center align-content-center">
                      <p className="text-muted">No new notifications</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <br />
        </>
      )}
    </Container>
  );
}

export default EducatorDashboard;
