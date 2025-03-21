import "./App.css";
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Cookies from "js-cookie";
import { ToastContainer } from "react-toastify";

import Home from "./views/home";

import AdminPage from "./views/Admin/AdminPage";
import AdminDashboard from "./views/Admin/dashboard";
import UserManagement from "./views/Admin/usermanagement";
import AdminStatistics from "./views/Admin/statistics";
import ContentManagement from "./views/Admin/contentmanagement";

import EducatorPage from "./views/Educator/EducatorPage";
import EducatorDashboard from "./views/Educator/dashboard";
import EducatorStatistics from "./views/Educator/statistics";
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
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="usermanagement" element={<UserManagement />} />
          <Route path="datamanagement/*">
            <Route path="statistics" element={<AdminStatistics />} />
            <Route path="account" element={<AccountSettings />} />
          </Route>
          <Route path="contentmanagement" element={<ContentManagement />} />
          <Route path="settings/*">
            <Route path="general" element={<GeneralSettings />} />
            <Route path="account" element={<AccountSettings />} />
          </Route>
        </Route>

        {/* Educator Protected Routes */}
        <Route path="/views/educator/*" element={<EducatorPage />}>
          <Route path="dashboard" element={<EducatorDashboard />} />
          <Route path="postanalytics/*">
            <Route path="statistics" element={<EducatorStatistics />} />
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
