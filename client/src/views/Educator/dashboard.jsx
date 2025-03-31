import React, { useState, useEffect } from "react";
import { Alert, Table } from "react-bootstrap";
import useSession from "../../utils/sessionUtils";
import { useNavigate } from "react-router-dom";
import { useLoadingState } from "../../utils/loadingUtils";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumb";
import ProfileCard from "../../components/card/ProfileCard";
import AnnouncementCard from "../../components/card/AnnouncementCard";

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

  // Pie chart data
  const data = [
    { name: "Authorized", value: userStats.active },
    { name: "Unauthorized", value: userStats.inactive },
  ];

  const COLORS = ["#3b2ee2", "#de1e82"];

  return (
    <>
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
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default EducatorDashboard;
