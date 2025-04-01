import React, { useState, useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import useSession from "../../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import { useLoadingState } from "../../utils/loadingUtils";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumb";
import ProfileCard from "../../components/card/ProfileCard";
import AnnouncementCard from "../../components/card/AnnouncementCard";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

function EducatorDashboard() {
  const navigate = useNavigate();

  const { userData, isLoggedIn } = useSession(navigate);
  const {
    data: userList,
    loading,
    refetch,
  } = useLoadingState("/usermanagement/get_user_data", []);
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

  // Handle Start a new session
  const handleNewSession = () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to create a new session?"
    );

    if (userConfirmed) {
      const sessionId = uuidv4();

      toast.success("New session created successful.");

      setTimeout(() => {
        navigate(`/views/educator/tracking/${sessionId}`);
      }, 1000);
    }
  };

  // Pie chart data
  const data = [
    { name: "Authorized", value: userStats.active },
    { name: "Unauthorized", value: userStats.inactive },
  ];

  const COLORS = ["#3b2ee2", "#de1e82"];

  return (
    <Container>
      <PageTitleBreadcrumb
        title={`Hello, ${userData.userName}👋, ready to analyze student participation today? `}
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
                <div className="col-md-12">
                  <div
                    className="card"
                    style={{
                      height: "300px",
                      maxHeight: "300px",
                      width: "100%",
                    }}
                  >
                    <div className="row h-100">
                      {/* Left Section (Title) with Spacing */}
                      <div className="col-md-3 d-flex align-items-center justify-content-center">
                        <h2
                          className="font-weight-bold text-center"
                          style={{
                            background:
                              "linear-gradient(to right, #3b2ee2, #de1e82)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          Real-Time Monitoring
                        </h2>
                      </div>

                      {/* Vertical Line */}
                      <div className="col-md-1">
                        <div
                          style={{
                            width: "2px",
                            height: "100%" /* Adjust height of the line */,
                            backgroundColor: "#ddd",
                            border: "none",
                          }}
                        />
                      </div>

                      {/* Right Section (Content) */}
                      <div className="col-md-8 d-flex flex-column align-items-start justify-content-center">
                        <div className="text-left">
                          <h3 className="text-primary mb-3 font-weight-semibold">
                            Ready to onboard our new Tracking Server?
                          </h3>
                          <p className="text-muted">
                            Let's get started by creating a new session to begin
                            tracking. This will help you stay updated with all
                            real-time data.
                          </p>
                        </div>
                        <div className="d-flex gap-3 justify-content-center mt-3">
                          <Button
                            className="btn btn-primary w-auto"
                            onClick={handleNewSession}
                          >
                            <i className="bi bi-eye mr-2"></i>
                            &nbsp; Create A New Session
                          </Button>
                        </div>
                      </div>
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

export default EducatorDashboard;
