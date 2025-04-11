import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import useSession from "../../hooks/useSession";
import { useNavigate } from "react-router-dom";
import { useLoadingState } from "../../hooks/useLoadingState";
import LoadingSpinner from "../../components/common/LoadingSpinnerComponent";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumbLayout";
import ProfileCard from "../../components/card/ProfileCard";
import AnnouncementCard from "../../components/card/AnnouncementCard";
import UserTrendingDashboard from "./datamanagement/usertrending";

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
    navigate("/admin/usermanagement");
  };

  const handleTrendChartClick = () => {
    navigate("/admin/datamanagement/usertrend");
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
      <PageTitleBreadcrumb
        title={`Welcome back, ${userData.userName} 👋`}
        path={location.pathname}
      />
      <div className="px-3">
        <section className="px-1 py-4">
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
                      <span className="ms-1">
                        <b>Authorization Status</b>
                      </span>
                    </div>
                    <div className="card-body d-flex justify-content-center">
                      <PieChart
                        width={250}
                        height={250}
                        onClick={handlePieChartClick}
                      >
                        <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          innerRadius={60}
                          outerRadius={100}
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

                <div className="col-md-6">
                  <div className="card">
                    <div
                      className="card-header"
                      style={{ backgroundColor: "#3B3486", color: "#ffffff" }}
                    >
                      <span className="ms-1">
                        <b>User Growth Trend (Monthly)</b>
                      </span>
                    </div>
                    <div
                      className="card-body p-0"
                      onClick={handleTrendChartClick}
                      style={{ cursor: "pointer", height: "280px" }}
                    >
                      {/* Embed the UserTrendingDashboard component here */}
                      <UserTrendingDashboard isEmbedded={true} />
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
                        <b>Emotion Distribution</b>
                      </span>
                    </div>
                    <div className="card-body d-flex justify-content-center">
                      {/* <PieChart
                        width={250}
                        height={250}
                        onClick={handlePieChartClick}
                      >
                        <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          innerRadius={60}
                          outerRadius={100}
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
                      </PieChart> */}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </Container>
  );
}

export default AdminDashboard;
