import "./App.css";
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Cookies from "js-cookie";
import { ToastContainer } from "react-toastify";

import Home from "./views/home";

import AdminPage from "./views/Admin/AdminPage";
import AdminDashboard from "./views/Admin/dashboard";
import UserManagement from "./views/Admin/usermanagement";
import StatisticsAdmin from "./views/Admin/datamanagement/statistics";
import UserTrendingAdmin from "./views/Admin/datamanagement/usertrending";
import DataTrendingAdmin from "./views/Admin/datamanagement/datatrending";
import SlideshowManagement from "./views/Admin/contentmanagement/slideshowmanagement";
import AnnouncementManagement from "./views/Admin/contentmanagement/annoucementmanagement";

import EducatorPage from "./views/Educator/EducatorPage";
import EducatorDashboard from "./views/Educator/dashboard";
import RealTimeMonitoring from "./views/Educator/realtimemonitoring";
import EducatorStatistics from "./views/Educator/postanalytics/statistics";
import EducatorPublicStatistics from "./views/Educator/postanalytics/statisticspublic";
import EducatorTrending from "./views/Educator/postanalytics/trend";
import GeneralSettings from "./views/Settings/general";
import AccountSettings from "./views/Settings/account";

function App() {
  useEffect(() => {
    const theme = Cookies.get("theme") || "light";
    document.querySelector("html").setAttribute("data-bs-theme", theme);
  }, []);

  return (
    <Router className="App">
      <Header />
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Home />} />

        {/* Admin Protected Routes */}
        <Route path="/views/admin/*" element={<AdminPage />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="usermanagement" element={<UserManagement />} />
          <Route path="datamanagement/*">
            <Route path="statistics" element={<StatisticsAdmin />} />
            <Route path="usertrend" element={<UserTrendingAdmin />} />
            <Route path="datatrend" element={<DataTrendingAdmin />} />
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
        <Route path="/views/educator/*" element={<EducatorPage />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<EducatorDashboard />} />
          <Route path="tracking/:sessionId" element={<RealTimeMonitoring />} />
          <Route path="postanalytics/*">
            <Route path="statistics" element={<EducatorStatistics />} />
            <Route
              path="statisticspublic"
              element={<EducatorPublicStatistics />}
            />
            <Route path="trend" element={<EducatorTrending />} />
          </Route>
          <Route path="settings/*">
            <Route path="general" element={<GeneralSettings />} />
            <Route path="account" element={<AccountSettings />} />
          </Route>
        </Route>
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer position="top-center" autoClose={3000} />
      <Footer />
    </Router>
  );
}

export default App;
