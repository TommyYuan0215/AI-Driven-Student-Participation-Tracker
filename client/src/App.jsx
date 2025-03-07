import './App.css';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Cookies from 'js-cookie';
import { ToastContainer } from 'react-toastify';

import Home from './views/home'

import AdminPage from './views/Admin/AdminPage';
import AdminDashboard from './views/Admin/dashboard';
import UserManagement from './views/Admin/usermanagement';
import DataManagement from './views/Admin/datamanagement';
import ContentManagement from './views/Admin/contentmanagement';

import EducatorPage from './views/Educator/EducatorPage'
import EducatorDashboard from './views/Educator/dashboard';
import EducatorHistory from './views/Educator/history';
import GeneralSettings from './views/Settings/general';
import AccountSettings from './views/Settings/account';

function App() {
  useEffect(() => {
    const theme = Cookies.get('theme') || 'light';
    document.querySelector('html').setAttribute('data-bs-theme', theme);
  }, []);

  return (
    <Router classhName="App">
      <Header />
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Home />} ></Route>

          {/* Admin Protected Route */}
          <Route path="/views/admin/*" element={<AdminPage />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="usermanagement" element={<UserManagement />} />
              <Route path="datamanagement" element={<DataManagement />} />
              <Route path="contentmanagement" element={<ContentManagement />} />
              {/* Sibling Settings Element */}
              <Route path="settings/*" >
                  <Route path="general" element={<GeneralSettings />} />
                  <Route path="account" element={<AccountSettings />} />
              </Route>
          </Route>

          {/* Educator Role Element */}
          <Route path="/views/educator/*" element={<EducatorPage />}>
            <Route path="dashboard" element={<EducatorDashboard />}/>
            <Route path="history" element={<EducatorHistory />}/>
            {/* Sibling Settings Element */}
            <Route path="settings/*" >
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
