import React, { useState, useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import useSession from "../../hooks/useSession";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoadingState } from "../../hooks/useLoadingState";
import LoadingSpinner from "../../components/common/LoadingSpinnerComponent";
import PageTitleBreadcrumb from "../../components/layout/PageTitleBreadcrumbLayout";
import ProfileCard from "../../components/card/ProfileCard";
import AnnouncementCard from "../../components/card/AnnouncementCard";
import { toast } from "react-toastify";
import axios from "../../utils/axiosUtils";

function EducatorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoggedIn } = useSession(navigate);
  const { loading } = useLoadingState("/usermanagement/get_user_data", []);

  if (!isLoggedIn) {
    navigate("/");
    return null;
  }

  const handleNewMonitoringSession = async () => {
    const userConfirmed = window.confirm("Are you sure you want to create a new session?");
    if (!userConfirmed) return;

    try {
      const response = await axios.post("/tracking_session/create_tracking_session", {
        userID: userData.userID,
      });
      const sessionId = response.data.sessionID;
      toast.success("New session created successfully.");
      setTimeout(() => navigate(`/educator/tracking/${sessionId}`), 1000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to create session";
      toast.error("Failed to create new session: " + errorMessage);
    }
  };

  return (
    <Container className="py-2 fade-in">
      <PageTitleBreadcrumb 
        title={`Welcome, ${userData.userName}`}
        path={location.pathname}
        icon="bi-cpu"
      />

      {loading ? (
        <LoadingSpinner text="Synchronizing dashboard..." />
      ) : (
        <div className="px-1">
          {/* Top Row: Profile & Announcements */}
          <div className="row g-4 mb-5">
            <div className="col-lg-4">
              <div className="h-100 rounded-4 overflow-hidden" style={{
                background: 'var(--bs-body-bg)',
                border: '1px solid var(--bs-border-color-translucent)',
                boxShadow: '0 15px 35px -10px rgba(0,0,0,0.1)'
              }}>
                <ProfileCard userData={userData} />
              </div>
            </div>
            <div className="col-lg-8">
              <div className="h-100 rounded-4 overflow-hidden" style={{
                background: 'var(--bs-body-bg)',
                border: '1px solid var(--bs-border-color-translucent)',
                boxShadow: '0 15px 35px -10px rgba(0,0,0,0.1)'
              }}>
                <AnnouncementCard />
              </div>
            </div>
          </div>

          {/* Action Hero: Monitoring */}
          <div className="rounded-5 overflow-hidden mb-5" style={{
            background: 'var(--bs-body-bg)',
            border: '1px solid var(--bs-border-color-translucent)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
          }}>
            <div className="row g-0 align-items-stretch">
              <div className="col-lg-6 position-relative overflow-hidden" style={{ minHeight: '400px', background: '#0f172a' }}>
                <img
                  src="/assets/reality_monitor_hero.png"
                  alt="Reality Monitor"
                  className="position-absolute w-100 h-100 object-fit-cover"
                  style={{ opacity: 0.6, mixBlendMode: 'luminosity' }}
                />
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                  background: 'linear-gradient(to right, rgba(15, 23, 42, 0.9), transparent)'
                }}></div>
                <div className="position-absolute bottom-0 start-0 p-5 text-white" style={{ zIndex: 2 }}>
                  <div className="glass-badge mb-3">
                    <i className="bi bi-shield-check me-2 text-primary"></i>AI SYSTEM ACTIVE
                  </div>

                  <h2 className="fw-black mb-1 display-5" style={{ letterSpacing: '-2px' }}>Real-time Monitoring</h2>
                  <p className="opacity-75 small fw-bold text-uppercase" style={{ letterSpacing: '2px' }}>• Neural Engine v1.01</p>
                </div>
              </div>

              <div className="col-lg-6 p-5 d-flex flex-column justify-content-center">
                <h6 className="text-primary text-uppercase fw-bold mb-3" style={{ letterSpacing: '2px', fontSize: '0.75rem' }}>Neural Classroom Interface</h6>
                <h2 className="fw-bold mb-4" style={{ color: 'var(--bs-emphasis-color)', lineHeight: '1.2' }}>
                  Ready to launch your next <br />
                  <span className="text-gradient">Intelligent Session?</span>
                </h2>
                <p className="text-muted mb-5 fs-6 lh-lg">
                  Launch a new session to begin capturing real-time student engagement data.
                  Our neural networks will analyze focus levels, emotional response, and overall classroom participation.
                </p>
                <div className="d-flex align-items-center gap-4">
                  <button
                    className="btn-modern-action d-flex align-items-center gap-3 shadow-lg"
                    onClick={handleNewMonitoringSession}
                  >
                    <span className="fw-bold">START SESSION</span>
                    <i className="bi bi-lightning-charge-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </Container>
  );
}

export default EducatorDashboard;
