import React, { useState, useEffect } from "react";
import { Container, Badge } from "react-bootstrap";
import useSession from "../../hooks/useSession";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoadingState } from "../../hooks/useLoadingState";
import LoadingSpinner from "../../components/common/LoadingSpinnerComponent";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumbLayout";
import ProfileCard from "../../components/card/ProfileCard";
import AnnouncementCard from "../../components/card/AnnouncementCard";
import UserTrendingDashboard from "./datamanagement/usertrending";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useEmotionTrends } from "../../hooks/useEmotionTrends";

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoggedIn } = useSession(navigate);
  const {
    data: userList,
    loading,
  } = useLoadingState("/usermanagement/get_user_data", []);

  const { trendData: engagementTrendData, loading: trendLoading } = useEmotionTrends();
  const [userStats, setUserStats] = useState({ active: 0, inactive: 0 });

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

  const authData = [
    { name: "Authorized", value: userStats.active },
    { name: "Unauthorized", value: userStats.inactive },
  ];

  const AUTH_COLORS = ["#6366f1", "#f43f5e"];

  return (
    <Container className="py-2 fade-in">
      <PageTitleBreadcrumb 
        title="System Overview" 
        path={location.pathname} 
        icon="bi-shield-lock"
      />

      {loading ? (
        <LoadingSpinner text="Loading command center..." />
      ) : (
        <div className="px-1">
          {/* Core Info: Profile & Announcements */}
          <div className="row g-4 mb-5">
            <div className="col-lg-4">
              <ProfileCard userData={userData} />
            </div>
            <div className="col-lg-8">
              <AnnouncementCard />
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="row g-4">
            {/* User Growth */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{
                background: 'var(--bs-body-bg)',
                border: '1px solid var(--bs-border-color-translucent)'
              }}>
                <div className="card-header border-bottom py-3 d-flex align-items-center justify-content-between"
                  style={{ background: 'var(--bs-tertiary-bg)', borderColor: 'var(--bs-border-color-translucent)' }}
                >
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
                      <i className="bi bi-graph-up text-primary"></i>
                    </div>
                    <span className="fw-bold" style={{ letterSpacing: '-0.5px', color: 'var(--bs-emphasis-color)' }}>User Growth Trend</span>
                  </div>
                  <button className="btn btn-sm btn-link text-primary p-0 fw-bold small text-decoration-none" onClick={() => navigate("/admin/datamanagement/usertrend")}>
                    View Report <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
                <div className="card-body p-0" style={{ height: "350px" }}>
                  <UserTrendingDashboard isEmbedded={true} />
                </div>
              </div>
            </div>

            {/* Authorization Status Donut */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100" style={{
                background: 'var(--bs-body-bg)',
                border: '1px solid var(--bs-border-color-translucent)'
              }}>
                <div className="card-header border-bottom py-3 d-flex align-items-center justify-content-between"
                  style={{ background: 'var(--bs-tertiary-bg)', borderColor: 'var(--bs-border-color-translucent)' }}
                >
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 p-2 rounded-3 me-3">
                      <i className="bi bi-shield-check text-info"></i>
                    </div>
                    <span className="fw-bold" style={{ letterSpacing: '-0.5px', color: 'var(--bs-emphasis-color)' }}>Access Status</span>
                  </div>
                </div>
                <div className="card-body d-flex flex-column align-items-center justify-content-center pt-0">
                  <div className="position-relative d-flex justify-content-center align-items-center" style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart onClick={() => navigate("/admin/usermanagement")}>
                        <Pie
                          data={authData}
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {authData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={AUTH_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="position-absolute text-center">
                      <div className="h2 fw-black mb-0" style={{ color: 'var(--bs-emphasis-color)' }}>{userStats.active + userStats.inactive}</div>
                      <div className="small text-uppercase fw-bold" style={{ fontSize: '0.6rem', color: 'var(--bs-secondary-color)' }}>Total Users</div>
                    </div>
                  </div>
                  <div className="d-flex gap-4 mt-2">
                    <div className="small fw-bold" style={{ color: 'var(--bs-body-color)' }}><i className="bi bi-circle-fill me-2" style={{ color: AUTH_COLORS[0], fontSize: '0.6rem' }}></i>Authorized</div>
                    <div className="small fw-bold" style={{ color: 'var(--bs-body-color)' }}><i className="bi bi-circle-fill me-2" style={{ color: AUTH_COLORS[1], fontSize: '0.6rem' }}></i>Unauthorized</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Width Engagement Trend */}
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{
                background: 'var(--bs-body-bg)',
                border: '1px solid var(--bs-border-color-translucent)'
              }}>
                <div className="card-header border-bottom py-3 d-flex align-items-center justify-content-between"
                  style={{ background: 'var(--bs-tertiary-bg)', borderColor: 'var(--bs-border-color-translucent)' }}
                >
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-3 me-3">
                      <i className="bi bi-activity text-warning"></i>
                    </div>
                    <span className="fw-bold" style={{ letterSpacing: '-0.5px', color: 'var(--bs-emphasis-color)' }}>Global Engagement Trend</span>
                  </div>
                  <button className="btn btn-sm btn-link text-primary p-0 fw-bold small text-decoration-none" onClick={() => navigate("/admin/datamanagement/statisticsadmin")}>
                    View Detailed <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
                <div className="card-body p-4" style={{ height: "400px" }}>
                  {trendLoading ? (
                    <LoadingSpinner text="Analyzing trends..." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={engagementTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bs-border-color)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--bs-body-bg)',
                            borderRadius: '12px',
                            border: '1px solid var(--bs-border-color)',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            color: 'var(--bs-body-color)'
                          }}
                          itemStyle={{ color: 'var(--bs-body-color)' }}
                        />
                        <Legend iconType="circle" />
                        <Line type="monotone" dataKey="interested" name="Interested" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bs-body-bg)' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="bored" name="Bored" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bs-body-bg)' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="lackingFocus" name="Lacking Focus" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bs-body-bg)' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </Container>
  );
}

export default AdminDashboard;
