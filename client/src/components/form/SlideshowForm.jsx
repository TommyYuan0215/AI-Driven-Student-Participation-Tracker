import React from "react";
import { Form, Button } from "react-bootstrap";

function SlideshowForm({
  formData,
  previewImage,
  handleInputChange,
  handleImageChange,
  handleSubmit,
  handleClearForm,
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
              <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Asset Identifier</div>
              <div className="fw-bold text-primary">#{formData.slideshowId}</div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex flex-column gap-4">
        {/* Visual Preview Section */}
        <div className="form-group-custom">
          <label className="small fw-bold text-muted mb-2 ps-1 text-uppercase ls-1">Media Preview</label>
          <div className="preview-container shadow-lg rounded-4 overflow-hidden position-relative mb-2" style={{ 
            height: "300px",
            background: 'var(--bs-tertiary-bg)',
            border: '2px dashed var(--bs-border-color)'
          }}>
            {previewImage ? (
              <img
                src={previewImage}
                style={{ height: "100%", width: "100%", objectFit: "cover" }}
                alt="Preview"
              />
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50">
                <i className="bi bi-cloud-arrow-up display-4 mb-2"></i>
                <p className="small fw-bold">No Image Selected</p>
              </div>
            )}
            <div className="position-absolute bottom-0 end-0 p-3">
              <label className="btn btn-primary rounded-pill shadow-lg d-flex align-items-center gap-2 px-4 py-2 cursor-pointer">
                <i className="bi bi-camera-fill"></i>
                <span className="small fw-bold">{previewImage ? 'Change Image' : 'Select Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  name="slideshowImage"
                  onChange={handleImageChange}
                  className="d-none"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="row g-4">
          <div className="col-12">
            <label className="small fw-bold text-muted mb-2 ps-1 text-uppercase ls-1">Slide Title</label>
            <div className="input-group-modern shadow-sm rounded-4 d-flex align-items-center px-3" style={{ 
              background: 'var(--bs-body-bg)', 
              border: '1px solid var(--bs-border-color-translucent)',
              height: '56px'
            }}>
              <i className="bi bi-type-h1 text-primary me-3"></i>
              <Form.Control
                type="text"
                name="slideshowTitle"
                value={formData.slideshowTitle}
                onChange={handleInputChange}
                placeholder="Enter slide heading..."
                className="border-0 bg-transparent p-0"
                style={{ boxShadow: 'none' }}
                required
              />
            </div>
          </div>

          <div className="col-12">
            <label className="small fw-bold text-muted mb-2 ps-1 text-uppercase ls-1">Slide Description</label>
            <div className="input-group-modern shadow-sm rounded-4 d-flex align-items-start px-3 py-3" style={{ 
              background: 'var(--bs-body-bg)', 
              border: '1px solid var(--bs-border-color-translucent)',
              minHeight: '120px'
            }}>
              <i className="bi bi-card-text text-primary me-3 mt-1"></i>
              <Form.Control
                as="textarea"
                name="slideshowDesc"
                value={formData.slideshowDesc}
                onChange={handleInputChange}
                placeholder="Brief description for this slide..."
                className="border-0 bg-transparent p-0"
                style={{ boxShadow: 'none', height: '80px', resize: 'none' }}
                required
              />
            </div>
          </div>
        </div>

        {/* Control Center */}
        <div className="d-flex align-items-center justify-content-center gap-3 mt-3">
          <button 
            type="submit" 
            className="btn btn-primary rounded-pill px-5 py-3 shadow-lg d-flex align-items-center gap-2 transition-all hover-scale"
            style={{ fontWeight: '800' }}
          >
            <i className={`bi ${isEdit ? 'bi-check-circle-fill' : 'bi-cloud-upload-fill'}`}></i>
            {isEdit ? "Update Slide" : "Publish to Gallery"}
          </button>
          <button 
            type="button" 
            onClick={handleClearForm}
            className="btn btn-outline-secondary rounded-pill px-4 py-3 d-flex align-items-center gap-2 transition-all"
            style={{ fontWeight: '600' }}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Reset
          </button>
        </div>
      </div>

      <style>{`
        .ls-1 { letter-spacing: 1px; }
        .cursor-pointer { cursor: pointer; }
        .hover-scale:hover { transform: scale(1.02) translateY(-2px); }
        .input-group-modern:focus-within {
          border-color: var(--bs-primary) !important;
          box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.1) !important;
        }
      `}</style>
    </Form>
  );
}

export default SlideshowForm;
