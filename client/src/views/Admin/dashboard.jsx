import React, { useState, useEffect } from "react";
import { Container, Alert } from "react-bootstrap";
import useSession from "../../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import { useLoadingState } from "../../utils/loadingUtils";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

function AdminDashboard() {
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);
  const {
    data: userList,
    loading,
    refetch,
  } = useLoadingState("/usermanagement/get_user_data", []);
  const [userStats, setUserStats] = useState({ active: 0, inactive: 0 });

  // const [notifications, setNotifications] = useState([
  //   { id: 1, type: "success", message: "New user registered successfully!" },
  //   { id: 2, type: "warning", message: "Pending approval: 2 user accounts." },
  //   { id: 3, type: "danger", message: "System error detected in logs!" },
  // ]);

  const [notifications, setNotifications] = useState("");

  const handlePieChartClick = () => {
    navigate("/views/admin/usermanagement");
  };

  useEffect(() => {
    if (userList) {
      const stats = userList.reduce(
        (acc, user) => {
          acc[user.userStatus === 1 ? "active" : "inactive"]++;
          return acc;
        },
        { active: 0, inactive: 0 }
      );
      setUserStats(stats);
    }
  }, [userList]);

  if (!isLoggedIn) {
    navigate("/");
    return null;
  }

  // Pie chart data
  const data = [
    { name: "Authorized", value: userStats.active },
    { name: "Unauthorized", value: userStats.inactive },
  ];

  const COLORS = ["#3b2ee2", "#de1e82"]; 

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

          <div className="row">
            {/* User Account Status  */}
            <div className="col-md-3">
              <div className="card">
                <div className="card-header text-center">
                  <h6>User Account Status</h6>
                </div>
                <div className="card-body d-flex justify-content-center">
                  <PieChart
                    width={250}
                    height={200}
                    onClick={handlePieChartClick}
                  >
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                  </PieChart>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card">
                <div className="card-header text-center">
                  <h6>B</h6>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card">
                <div className="card-header text-center">
                  <h6>C</h6>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card">
                <div className="card-header text-center">
                  <h6>D</h6>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}

export default AdminDashboard;
