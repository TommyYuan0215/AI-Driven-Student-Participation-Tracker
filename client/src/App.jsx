import "./App.css";
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Header from "./components/layout/HeaderLayout";
import Footer from "./components/layout/FooterLayout";
import Cookies from "js-cookie";
import { ToastContainer } from "react-toastify";

import Home from "./views/home";

import AdminPage from "./views/Admin/AdminPage";
import AdminDashboard from "./views/Admin/dashboard";
import UserManagement from "./views/Admin/usermanagement";
import AdminStatistics from "./views/Admin/datamanagement/statistics";
import UserTrendingDashboard from "./views/Admin/datamanagement/usertrending";
import AdminDataTrending from "./views/Admin/datamanagement/datatrend";
import SlideshowManagement from "./views/Admin/contentmanagement/slideshowmanagement";
import AnnouncementManagement from "./views/Admin/contentmanagement/annoucementmanagement";

import EducatorPage from "./views/Educator/EducatorPage";
import EducatorDashboard from "./views/Educator/dashboard";
import RealTimeMonitoring from "./views/Educator/realtime/realtimemonitoring";
import EducatorStatistics from "./views/Educator/postanalytics/statistics";
import EducatorPublicStatistics from "./views/Educator/postanalytics/statisticspublic";
import EducatorDataTrending from "./views/Educator/postanalytics/datatrend";
import GeneralSettings from "./views/Settings/general";
import AccountSettings from "./views/Settings/account";

function AppRoutes({ showSidebar, toggleSidebar }) {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Home />} />

      {/* Admin Protected Routes */}
      <Route path="/admin/*" element={<AdminPage showSidebar={showSidebar} toggleSidebar={toggleSidebar} />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="usermanagement" element={<UserManagement />} />
        <Route path="datamanagement/*">
          <Route path="statisticsadmin/*">
            <Route index element={<AdminStatistics />} />
            <Route path="datatrend" element={<AdminDataTrending />} />
          </Route>
          <Route path="usertrend" element={<UserTrendingDashboard />} />
          <Route path="account" element={<AccountSettings />} />
        </Route>
        <Route path="contentmanagement/*">
          <Route path="slideshow" element={<SlideshowManagement />} />
          <Route path="announcement" element={<AnnouncementManagement />} />
        </Route>
        <Route path="settings/*">
          <Route path="general" element={<GeneralSettings />} />
          <Route path="account" element={<AccountSettings />} />
        </Route>
      </Route>

      {/* Educator Protected Routes */}
      <Route path="/educator/*" element={<EducatorPage showSidebar={showSidebar} toggleSidebar={toggleSidebar} />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<EducatorDashboard />} />
        <Route path="tracking/:sessionId" element={<RealTimeMonitoring />} />
        <Route path="postanalytics/*">
          <Route path="statistics/*">
            <Route index element={<EducatorStatistics />} />
            <Route path="datatrend" element={<EducatorDataTrending />} />
          </Route>

          <Route path="statisticspublic/*">
            <Route index element={<EducatorPublicStatistics />} />
            <Route path="datatrend" element={<EducatorDataTrending />} />
          </Route>
        </Route>
        <Route path="settings/*">
          <Route path="general" element={<GeneralSettings />} />
          <Route path="account" element={<AccountSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}

function AppWithSidebar() {
  const [showSidebar, setShowSidebar] = useState(true);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/admin") || location.pathname.startsWith("/educator");

  const toggleSidebar = () => setShowSidebar((prev) => !prev);

  return (
    <>
      <Header
        showSidebar={showSidebar}
        toggleSidebar={toggleSidebar}
        showSidebarToggle={isDashboard}
      />
      <AppRoutes
        showSidebar={showSidebar}
        toggleSidebar={toggleSidebar}
      />
      {/* Toast Notifications */}
      <ToastContainer position="top-center" autoClose={3000} />
      <Footer />
    </>
  );
}

function App() {
  useEffect(() => {
    const theme = Cookies.get("theme") || "light";
    document.querySelector("html").setAttribute("data-bs-theme", theme);
  }, []);

  return (
    <Router className="App">
      <AppWithSidebar />
    </Router>
  );
}

export default App;
