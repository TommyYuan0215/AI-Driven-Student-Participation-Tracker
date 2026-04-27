import React from "react";
import { Form, Button } from "react-bootstrap";

function AnnouncementForm({
  formData,
  handleInputChange,
  handleSubmit,
  isEdit,
}) {
  return (
    <Form onSubmit={handleSubmit} className="px-1">
      {/* Identity Context - Only for Edit */}
      {isEdit && (
        <div className="mb-4 p-3 rounded-4" style={{ 
          background: 'var(--bs-tertiary-bg)', 
          border: '1px solid var(--bs-border-color-translucent)' 
        }}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 p-2 rounded-3">
              <i className="bi bi-fingerprint text-primary"></i>
            </div>
            <div>
              <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Broadcast Identity</div>
              <div className="fw-bold text-primary">#{formData.announcementId}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Content */}
      <div className="d-flex flex-column gap-4">
        {/* Title Input */}
        <div className="form-group-custom">
          <label className="small fw-bold text-muted mb-2 ps-1">ANNOUNCEMENT TITLE</label>
          <div className="input-group-modern shadow-sm rounded-4 d-flex align-items-center px-3" style={{ 
            background: 'var(--bs-body-bg)', 
            border: '1px solid var(--bs-border-color-translucent)',
            height: '56px'
          }}>
            <i className="bi bi-chat-left-dots text-primary me-3"></i>
            <Form.Control
              type="text"
              name="announcementTitle"
              value={formData.announcementTitle}
              onChange={handleInputChange}
              placeholder="Enter a compelling title..."
              className="border-0 bg-transparent p-0"
              style={{ boxShadow: 'none' }}
              required
            />
          </div>
        </div>

        {/* Description Input */}
        <div className="form-group-custom">
          <label className="small fw-bold text-muted mb-2 ps-1">BROADCAST CONTENT</label>
          <div className="input-group-modern shadow-sm rounded-4 d-flex align-items-start px-3 py-3" style={{ 
            background: 'var(--bs-body-bg)', 
            border: '1px solid var(--bs-border-color-translucent)',
            minHeight: '250px'
          }}>
            <i className="bi bi-text-paragraph text-primary me-3 mt-1"></i>
            <Form.Control
              as="textarea"
              name="announcementDesc"
              value={formData.announcementDesc}
              onChange={handleInputChange}
              placeholder="Compose your message to the campus..."
              className="border-0 bg-transparent p-0"
              style={{ boxShadow: 'none', minHeight: '200px', resize: 'none' }}
              required
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-2 text-center">
          <button 
            type="submit" 
            className="btn btn-primary rounded-pill px-5 py-3 shadow-lg d-inline-flex align-items-center gap-2 transition-all hover-scale"
            style={{ fontWeight: '800', letterSpacing: '0.5px' }}
          >
            <i className={`bi ${isEdit ? 'bi-arrow-repeat' : 'bi-send-fill'}`}></i>
            {isEdit ? "Update Broadcast" : "Publish Announcement"}
          </button>
        </div>
      </div>

      <style>{`
        .hover-scale:hover { transform: scale(1.02) translateY(-2px); }
        .input-group-modern:focus-within {
          border-color: var(--bs-primary) !important;
          box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.1) !important;
        }
      `}</style>
    </Form>
  );
}

export default AnnouncementForm;
