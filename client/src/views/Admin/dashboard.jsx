import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import useSession from "../../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import { useLoadingState } from "../../utils/loadingUtils";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumb";
import ProfileCard from "../../components/card/ProfileCard";
import AnnouncementCard from "../../components/card/AnnouncementCard";

function AdminDashboard() {
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);
  const {
    data: userList,
    loading,
    refetch,
  } = useLoadingState("/usermanagement/get_user_data", []);
  const [userStats, setUserStats] = useState({ active: 0, inactive: 0 });

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
    <>
      <PageTitleBreadcrumb
        title={`Welcome back, ${userData.userName} 👋`}
        path={location.pathname}
      />
      <div className="px-3">
        <section className="px-1">
          {loading ? (
            <LoadingSpinner text="Loading dashboard..." />
          ) : (
            <>
              <div className="row">
                {/* User Profile Area  */}
                <div className="col-md-4">
                  <ProfileCard userData={userData} />
                </div>
                {/* Announcement Area  */}
                <div className="col-md-8">
                  <AnnouncementCard />
                </div>
              </div>

              <br />

              <div className="row">
                {/* User Account Status  */}
                <div className="col-md-3">
                  <div className="card">
                    <div
                      className="card-header"
                      style={{ backgroundColor: "#3B3486", color: "#ffffff" }}
                    >
                      <span className="ms-3">
                        <b>User Account Authorization Status</b>
                      </span>
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
                    <div
                      className="card-header"
                      style={{ backgroundColor: "#3B3486", color: "#ffffff" }}
                    >
                      <span className="ms-3">
                        <b>B</b>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card">
                    <div
                      className="card-header"
                      style={{ backgroundColor: "#3B3486", color: "#ffffff" }}
                    >
                      <span className="ms-3">
                        <b>C</b>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card">
                    <div
                      className="card-header"
                      style={{ backgroundColor: "#3B3486", color: "#ffffff" }}
                    >
                      <span className="ms-3">
                        <b>D</b>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default AdminDashboard;
