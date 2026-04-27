import React from "react";
import { Table } from "react-bootstrap"; // Assuming you're using react-bootstrap

const ProfileCard = ({ userData }) => {
  return (
    <div className="card border-0 h-100 shadow-sm transition-all" style={{
      borderRadius: '1.5rem',
      overflow: 'hidden',
      background: 'var(--bs-body-bg)',
      border: '1px solid var(--bs-border-color-translucent)',
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
    }}>
      {/* Decorative Header */}
      <div
        style={{
          height: "100px",
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        }}
      ></div>

      <div className="card-body pt-0 text-center position-relative">
        {/* Avatar with Glow */}
        <div
          className="position-relative d-inline-block"
          style={{
            marginTop: "-60px",
            zIndex: 2
          }}
        >
          <img
            src={userData.userPhoto ? `data:image/jpeg;base64,${userData.userPhoto}` : "/profile.jpg"}
            alt="User"
            className="rounded-circle border border-4 shadow-lg"
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
              backgroundColor: 'var(--bs-tertiary-bg)',
              borderColor: 'var(--bs-body-bg)'
            }}
          />
          <div className="position-absolute bottom-0 end-0 bg-success border border-2 rounded-circle" style={{ width: '18px', height: '18px', borderColor: 'var(--bs-body-bg)' }}></div>
        </div>

        {/* User Info */}
        <div className="mt-3 mb-4">
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-emphasis-color)', letterSpacing: '-0.5px' }}>
            {userData.userName}
          </h4>
          <p className="small mb-3" style={{ color: 'var(--bs-secondary-color)' }}>{userData.userEmail}</p>

          <div className="d-inline-block px-3 py-1 rounded-pill" style={{
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#6366f1',
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            <i className="bi bi-shield-check me-1"></i>
            {userData?.userType === 0 ? "Administrator" : "Educator"}
          </div>
        </div>

        {/* Subtle Stats Row */}
        <div className="row g-0 border-top mt-4 pt-4" style={{ borderColor: 'var(--bs-border-color-translucent)' }}>
          <div className="col-6 border-end" style={{ borderColor: 'var(--bs-border-color-translucent)' }}>
            <div className="small text-uppercase fw-bold" style={{ fontSize: '0.6rem', color: 'var(--bs-secondary-color)' }}>Account Status</div>
            <div className="fw-bold text-success" style={{ fontSize: '0.8rem' }}>Verified</div>
          </div>
          <div className="col-6">
            <div className="small text-uppercase fw-bold" style={{ fontSize: '0.6rem', color: 'var(--bs-secondary-color)' }}>Member Since</div>
            <div className="fw-bold" style={{ fontSize: '0.8rem', color: 'var(--bs-body-color)' }}>
              {userData.createAt ? new Date(userData.createAt).getFullYear() : "Active"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
